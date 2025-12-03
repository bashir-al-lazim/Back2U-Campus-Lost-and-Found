const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

// initialization
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// MongoDB connection URI
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.SECRET_KEY}@back2u.slzfoxx.mongodb.net/?appName=Back2U`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("back2uDB");
    const usersCollection = db.collection("users");
    const itemsCollection = db.collection("items");
    const lostReportsCollection = db.collection("lostreports");
    const authorityCollection = db.collection("authorities");

    await client.db("admin").command({ ping: 1 });
    console.log("✅ MongoDB connected successfully");

    // -----------------------
    // SIMPLE ROUTES
    // -----------------------
    app.get("/", (req, res) => {
      res.send("Back2U server is running");
    });

    app.get("/users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // -----------------------
    // AUTHORITY ROUTE
    // -----------------------
    app.get("/authority/:email", async (req, res) => {
      const email = req.params.email;
      try {
        const user = await authorityCollection.findOne({ email });
        if (!user || !["admin", "staff"].includes(user.role)) {
          return res.status(404).json({ message: "Not an authority user" });
        }
        res.json({ email: user.email, role: user.role });
      } catch (err) {
        console.error("Error fetching authority:", err);
        res.status(500).json({ message: "Server error" });
      }
    });

    // -----------------------
    // ITEMS CRUD
    // -----------------------
    app.get("/items", async (req, res) => {
      const items = await itemsCollection.find().sort({ _id: -1 }).toArray();
      res.send(items);
    });

    app.post("/items", async (req, res) => {
      const item = req.body;
      if (!item.title || !item.category || !item.description || !item.locationText) {
        return res.status(400).send("Missing required fields");
      }
      const newItem = {
        ...item,
        photo: item.photoUrl || item.photo || "",
        photoUrl: item.photoUrl || item.photo || "",
        location: item.location || item.locationText || "",
        dateFound: item.dateFound || new Date(),
        status: item.status || "Open",
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      };
      const result = await itemsCollection.insertOne(newItem);
      const created = await itemsCollection.findOne({ _id: result.insertedId });
      res.status(201).send(created);
    });

    app.put("/items/:id", async (req, res) => {
      const { id } = req.params;
      const update = req.body;
      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { ...update, updatedAt: new Date() } };
        const result = await itemsCollection.findOneAndUpdate(filter, updateDoc, { returnDocument: "after" });
        if (!result.value) return res.status(404).send("Item not found");
        res.send(result.value);
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid item id");
      }
    });

    app.delete("/items/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const filter = { _id: new ObjectId(id) };
        const result = await itemsCollection.deleteOne(filter);
        if (result.deletedCount === 0) return res.status(404).send("Item not found");
        res.send({ ok: true });
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid item id");
      }
    });

    // -----------------------
    // ANALYTICS
    // -----------------------
    app.get("/analytics", async (req, res) => {
      try {
        const [items, lostReports] = await Promise.all([
          itemsCollection.find().toArray(),
          lostReportsCollection.find().toArray(),
        ]);
        const combined = [...items, ...lostReports];

        const activeItems = combined.filter((doc) =>
          ["Open", "Active", "Claimed"].includes(doc.status)
        ).length;

        const totalCount = combined.length;
        const claimedResolved = combined.filter((d) =>
          ["Claimed", "Resolved"].includes(d.status)
        ).length;
        const claimMatchRate = totalCount > 0 ? ((claimedResolved / totalCount) * 100).toFixed(2) : 0;

        const resolvedItems = combined.filter((d) => d.resolvedAt && d.status === "Resolved");
        let medianDays = 0;
        if (resolvedItems.length > 0) {
          const daysArray = resolvedItems.map((doc) => (new Date(doc.resolvedAt) - new Date(doc.createdAt)) / (1000*60*60*24));
          daysArray.sort((a,b)=>a-b);
          const mid = Math.floor(daysArray.length/2);
          medianDays = daysArray.length % 2 === 0 ? (daysArray[mid-1]+daysArray[mid])/2 : daysArray[mid];
        }

        res.json({ activeItems, claimMatchRate, medianTimeToResolution: medianDays.toFixed(1) });
      } catch (err) {
        console.error("❌ /analytics error", err);
        res.status(500).json({ error: "Failed to fetch analytics" });
      }
    });

    app.get("/analytics/monthly", async (req, res) => {
      try {
        const monthsBack = parseInt(req.query.months || "6", 10);
        const now = new Date();
        const months = [];
        for (let i = monthsBack-1; i>=0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth()-i,1);
          months.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
        }

        const [items, lostReports] = await Promise.all([
          itemsCollection.find().toArray(),
          lostReportsCollection.find().toArray(),
        ]);
        const combined = [...items, ...lostReports];

        const safeMonth = (dateVal) => {
          if(!dateVal) return null;
          const d = new Date(dateVal);
          if(isNaN(d.getTime())) return null;
          return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        };

        const countByMonth = (statuses, dateField) => {
          const map = {};
          combined.forEach(doc=>{
            if(!statuses.includes(doc.status)) return;
            const month = safeMonth(doc[dateField]);
            if(!month) return;
            map[month] = (map[month]||0)+1;
          });
          return map;
        };

        const open = countByMonth(["Open","Active"],"createdAt");
        const claimed = countByMonth(["Claimed"],"createdAt");
        const resolved = countByMonth(["Resolved"],"resolvedAt");
        const unresolved = countByMonth(["Open","Active","Claimed"],"createdAt");

        res.json({
          months,
          series:{
            Open: months.map(m=>open[m]||0),
            Claimed: months.map(m=>claimed[m]||0),
            Resolved: months.map(m=>resolved[m]||0),
            Unresolved: months.map(m=>unresolved[m]||0),
          }
        });
      } catch(err){
        console.error("❌ /analytics/monthly error",err);
        res.status(500).json({error:"Failed to compute monthly analytics"});
      }
    });

    // -----------------------
    // START SERVER
    // -----------------------
    app.listen(port, () => console.log(`🚀 Back2U server running on port ${port}`));

  } catch(error){
    console.error("❌ MongoDB connection failed:", error);
  }
}

run().catch(console.dir);
