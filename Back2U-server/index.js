const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
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

    // =====================================================================
    // 📊 COMBINED ANALYTICS OVERVIEW
    // =====================================================================
    app.get("/analytics", async (req, res) => {
      try {
        const [items, lostReports] = await Promise.all([
          itemsCollection.find().toArray(),
          lostReportsCollection.find().toArray(),
        ]);

        const combined = [...items, ...lostReports];

        // ACTIVE ITEMS
        const activeItems = combined.filter((doc) =>
          ["Open", "Active", "Claimed"].includes(doc.status)
        ).length;

        // CLAIM / MATCH RATE
        const totalCount = combined.length;

        const claimedResolved = combined.filter((d) =>
          ["Claimed", "Resolved"].includes(d.status)
        ).length;

        const claimMatchRate =
          totalCount > 0 ? ((claimedResolved / totalCount) * 100).toFixed(2) : 0;

        // MEDIAN TIME TO RESOLUTION
        const resolvedItems = combined.filter(
          (d) => d.resolvedAt && d.status === "Resolved"
        );

        let medianDays = 0;

        if (resolvedItems.length > 0) {
          const daysArray = resolvedItems.map((doc) => {
            const created = new Date(doc.createdAt);
            const resolved = new Date(doc.resolvedAt);
            return (resolved - created) / (1000 * 60 * 60 * 24);
          });

          daysArray.sort((a, b) => a - b);
          const mid = Math.floor(daysArray.length / 2);

          medianDays =
            daysArray.length % 2 === 0
              ? (daysArray[mid - 1] + daysArray[mid]) / 2
              : daysArray[mid];
        }

        res.json({
          activeItems,
          claimMatchRate,
          medianTimeToResolution: medianDays.toFixed(1),
        });
      } catch (err) {
        console.error("❌ /analytics error", err);
        res.status(500).json({ error: "Failed to fetch analytics" });
      }
    });

// =====================================================
// 📆 FULLY SAFE MONTHLY ANALYTICS (items + lostreports)
// =====================================================
app.get('/analytics/monthly', async (req, res) => {
  try {
    const monthsBack = parseInt(req.query.months || '6', 10);

    // --- SAFE MONTH LABEL GENERATOR ---
    function getSafeMonth(year, month) {
      const d = new Date(Date.UTC(year, month, 1));
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    }

    const months = [];
    for (let i = monthsBack - 1; i >= 0; i--) {
      const date = new Date();
      date.setUTCMonth(date.getUTCMonth() - i);
      months.push(getSafeMonth(date.getUTCFullYear(), date.getUTCMonth()));
    }

    // Fetch Data
    const [items, lostReports] = await Promise.all([
      itemsCollection.find().toArray(),
      lostReportsCollection.find().toArray(),
    ]);

    const combined = [...items, ...lostReports];

    // Safe date parser for documents
    const safeMonth = (dateVal) => {
      if (!dateVal) return null;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    };

    const countByMonth = (statuses, dateField) => {
      const map = {};
      combined.forEach((doc) => {
        if (!statuses.includes(doc.status)) return;

        const month = safeMonth(doc[dateField]);
        if (!month) return;

        map[month] = (map[month] || 0) + 1;
      });

      return map;
    };

    const open = countByMonth(['Open', 'Active'], 'createdAt');
    const claimed = countByMonth(['Claimed'], 'createdAt');
    const resolved = countByMonth(['Resolved'], 'resolvedAt');
    const unresolved = countByMonth(['Open', 'Active', 'Claimed'], 'createdAt');

    res.json({
      months,
      series: {
        Open: months.map((m) => open[m] || 0),
        Claimed: months.map((m) => claimed[m] || 0),
        Resolved: months.map((m) => resolved[m] || 0),
        Unresolved: months.map((m) => unresolved[m] || 0),
      },
    });
  } catch (err) {
    console.error("❌ /analytics/monthly error", err);
    res.status(500).json({ error: "Failed to compute monthly analytics" });
  }
});


    // -----------------------
    // START SERVER
    // -----------------------
    app.listen(port, () => {
      console.log(`🚀 Back2U server is running on port ${port}`);
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}

run().catch(console.dir);
