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

    const db = client.db("back2uDB");
    const itemsCollection = db.collection("items");
    const lostReportsCollection = db.collection("lostreports");
    const authorityCollection = db.collection("authorities");
    const notificationsCollection = db.collection("notifications"); // ✅ Feature 6


    // FEATURE 13: TTL permanent delete after 30 days
    await itemsCollection.createIndex(
      { deletedAt: 1 },
      {
        expireAfterSeconds: 60 * 60 * 24 * 30, 
        partialFilterExpression: { isDeleted: true, deletedAt: { $type: "date" } },
      }
    );

    await lostReportsCollection.createIndex(
      { deletedAt: 1 },
      {
        expireAfterSeconds: 60 * 60 * 24 * 30,
        partialFilterExpression: { isDeleted: true, deletedAt: { $type: "date" } },
      }
    );

    // FEATURE 6: Notifications index 
    await notificationsCollection.createIndex(
      { userEmail: 1, isRead: 1, createdAt: -1 }
    );

    // -----------------------
    // Notifications
    // -----------------------
    async function createNotification({
      userEmail,
      type,
      title,
      message,
      link,
      entity = null,
    }) {
      if (!userEmail) return;

      await notificationsCollection.insertOne({
        userEmail,
        type,
        title,
        message,
        link,
        entity,
        isRead: false,
        createdAt: new Date(),
        readAt: null,
      });
    }

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
    // FEATURE 13: hide soft-deleted items 
    app.get("/items", async (req, res) => {
      const items = await itemsCollection
        .find({ isDeleted: { $ne: true } })
        .sort({ _id: -1 })
        .toArray();

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

    // UPDATE item
    app.put('/items/:id', async (req, res) => {
      const { id } = req.params;
      const update = req.body;

      try {
        const filter = { _id: new ObjectId(id) };

        // Build update object with proper fields
        const updateDoc = {
          $set: {
            ...update,
            photo: update.photoUrl || update.photo || update.photoUrl,
            photoUrl: update.photoUrl || update.photo || update.photoUrl,
            location: update.location || update.locationText || update.location,
            updatedAt: new Date()
          }
        };

        const result = await itemsCollection.findOneAndUpdate(
          filter,
          updateDoc,
          { returnDocument: 'after' }
        );

        if (!result) {
          return res.status(404).send('Item not found');
        }

        res.send(result);
      } catch (err) {
        console.error(err);
        res.status(400).send('Invalid item id');
      }
    });



    //  FEATURE 13: SOFT DELETE 
    app.delete("/items/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const _id = new ObjectId(id);

        const item = await itemsCollection.findOne({ _id });
        if (!item) return res.status(404).send("Item not found");

        await itemsCollection.updateOne(
          { _id },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: req.body?.deletedBy || null,
              updatedAt: new Date(),
            },
          }
        );
        //  FEATURE 6: create notification on ITEM delete 
        await createNotification({
          userEmail: req.body?.deletedBy || null,
          type: "ITEM_DELETED",
          title: "Item moved to Recycle Bin",
          message: `“${item.title || "Untitled"}” was deleted. You can restore it from Recycle Bin.`,
          link: "/dashboard/recycle-bin",
          entity: { kind: "item", id },
        });

        res.send({ ok: true, softDeleted: true });
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid item id");
      }
    }); // f13 


    // -----------------------
    // LOST REPORTS CRUD
    // -----------------------

    // FEATURE 13
    app.get("/lostreports", async (req, res) => {
      try {
        const { userEmail } = req.query;

        const filter = {
          ...(userEmail ? { userEmail } : {}),
          isDeleted: { $ne: true }   // ✅ NEW
        };

        const reports = await lostReportsCollection
          .find(filter)
          .sort({ _id: -1 })
          .toArray();

        res.send(reports);
      } catch (err) {
        console.error(err);
        res.status(500).send("Failed to fetch lost reports");
      }
    });


    app.get("/lostreports/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const filter = { _id: new ObjectId(id) };
        const report = await lostReportsCollection.findOne({
          ...filter,
          isDeleted: { $ne: true }   
        }); 

        if (!report) return res.status(404).send("Lost report not found");
        res.send(report);
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid report id");
      }
    });

    app.post("/lostreports", async (req, res) => {
      const report = req.body;
      if (!report.title || !report.category || !report.description || !report.locationLost || !report.userEmail) {
        return res.status(400).send("Missing required fields");
      }
      const newReport = {
        ...report,
        status: report.status || "Active",
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      };
      const result = await lostReportsCollection.insertOne(newReport);
      const created = await lostReportsCollection.findOne({ _id: result.insertedId });
      res.status(201).send(created);
    });

    app.put("/lostreports/:id", async (req, res) => {
      const { id } = req.params;
      const update = req.body;
      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = { $set: { ...update, updatedAt: new Date() } };
        const result = await lostReportsCollection.findOneAndUpdate(filter, updateDoc, { returnDocument: "after" });
        if (!result.value) return res.status(404).send("Lost report not found");
        res.send(result.value);
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid report id");
      }
    });



    // FEATURE 13: SOFT DELETE Lost Report 
    app.delete("/lostreports/:id", async (req, res) => {
      const { id } = req.params;

      try {
        const _id = new ObjectId(id);

        const report = await lostReportsCollection.findOne({ _id });
        if (!report) return res.status(404).send("Lost report not found");

        await lostReportsCollection.updateOne(
          { _id },
          {
            $set: {
              isDeleted: true,
              deletedAt: new Date(),
              deletedBy: req.body?.deletedBy || report.userEmail || null,
              updatedAt: new Date(),
            },
          }
        );

        // FEATURE 6 
        await createNotification({
          userEmail: report.userEmail,
          type: "LOSTREPORT_DELETED",
          title: "Lost report moved to Recycle Bin",
          message: `“${report.title || "Untitled"}” was deleted. You can restore it from Recycle Bin.`,
          link: "/app/recycle-bin",
          entity: { kind: "lostreport", id },
        });

        res.send({ ok: true, softDeleted: true });
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid report id");
      }
    });  



    // -----------------------
    // LINKING LOST REPORTS TO ITEMS
    // -----------------------
    // Link a lost report to a found item
    app.post("/link", async (req, res) => {
      const { reportId, itemId } = req.body;

      if (!reportId || !itemId) {
        return res.status(400).send("Both reportId and itemId are required");
      }

      try {
        // Check if report exists and is not already linked
        const report = await lostReportsCollection.findOne({ _id: new ObjectId(reportId) });
        if (!report) return res.status(404).send("Lost report not found");
        if (report.linkedItemId) {
          return res.status(400).send("This report is already linked to an item");
        }

        // Check if item exists and is not already linked
        const item = await itemsCollection.findOne({ _id: new ObjectId(itemId) });
        if (!item) return res.status(404).send("Item not found");
        if (item.linkedReportId) {
          return res.status(400).send("This item is already linked to a report");
        }

        // Link both records
        await lostReportsCollection.updateOne(
          { _id: new ObjectId(reportId) },
          {
            $set: {
              linkedItemId: itemId,
              linkedAt: new Date(),
              updatedAt: new Date()
            }
          }
        );

        await itemsCollection.updateOne(
          { _id: new ObjectId(itemId) },
          {
            $set: {
              linkedReportId: reportId,
              linkedAt: new Date(),
              updatedAt: new Date()
            }
          }
        );

        res.status(200).json({
          success: true,
          message: "Successfully linked report to item",
          reportId,
          itemId
        });
      } catch (err) {
        console.error(err);
        res.status(500).send("Failed to link report and item");
      }
    });

    // Unlink a lost report from a found item
    app.post("/unlink", async (req, res) => {
      const { reportId, itemId } = req.body;

      if (!reportId || !itemId) {
        return res.status(400).send("Both reportId and itemId are required");
      }

      try {
        // Unlink both records
        await lostReportsCollection.updateOne(
          { _id: new ObjectId(reportId) },
          {
            $unset: { linkedItemId: "", linkedAt: "" },
            $set: { updatedAt: new Date() }
          }
        );

        await itemsCollection.updateOne(
          { _id: new ObjectId(itemId) },
          {
            $unset: { linkedReportId: "", linkedAt: "" },
            $set: { updatedAt: new Date() }
          }
        );

        res.status(200).json({
          success: true,
          message: "Successfully unlinked report from item"
        });
      } catch (err) {
        console.error(err);
        res.status(500).send("Failed to unlink report and item");
      }
    });

    // Get linked item for a report
    app.get("/lostreports/:id/linked-item", async (req, res) => {
      const { id } = req.params;
      try {
        const report = await lostReportsCollection.findOne({ _id: new ObjectId(id) });
        if (!report) return res.status(404).send("Lost report not found");

        if (!report.linkedItemId) {
          return res.status(200).json(null);
        }

        const item = await itemsCollection.findOne({
          _id: new ObjectId(report.linkedItemId),
          isDeleted: { $ne: true }, //  don't return deleted linked items
        });  

        res.status(200).json(item);
      } catch (err) {
        console.error(err);
        res.status(500).send("Failed to fetch linked item");
      }
    });

    // Get linked report for an item
    app.get("/items/:id/linked-report", async (req, res) => {
      const { id } = req.params;
      try {
        const item = await itemsCollection.findOne({
          _id: new ObjectId(id),
          isDeleted: { $ne: true },
        });

        if (!item) return res.status(404).send("Item not found");

        if (!item.linkedReportId) {
          return res.status(200).json(null);
        }

        const report = await lostReportsCollection.findOne({
          _id: new ObjectId(item.linkedReportId),
          isDeleted: { $ne: true }, //  don't return deleted linked reports
        });

        res.status(200).json(report);
      } catch (err) {
        console.error(err);
        res.status(500).send("Failed to fetch linked report");
      }
    });

    // -----------------------
    // ANALYTICS
    // -----------------------
    app.get("/analytics", async (req, res) => {
      try {
        const [items, lostReports] = await Promise.all([
          itemsCollection.find({ isDeleted: { $ne: true } }).toArray(),       //  ignore deleted items
          lostReportsCollection.find({ isDeleted: { $ne: true } }).toArray(), //  ignore deleted reports
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
          const daysArray = resolvedItems.map((doc) => (new Date(doc.resolvedAt) - new Date(doc.createdAt)) / (1000 * 60 * 60 * 24));
          daysArray.sort((a, b) => a - b);
          const mid = Math.floor(daysArray.length / 2);
          medianDays = daysArray.length % 2 === 0 ? (daysArray[mid - 1] + daysArray[mid]) / 2 : daysArray[mid];
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
        for (let i = monthsBack - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        }

        const [items, lostReports] = await Promise.all([
          itemsCollection.find({ isDeleted: { $ne: true } }).toArray(),       //  ignore deleted items
          lostReportsCollection.find({ isDeleted: { $ne: true } }).toArray(), //  ignore deleted reports
        ]);
        const combined = [...items, ...lostReports];

        const safeMonth = (dateVal) => {
          if (!dateVal) return null;
          const d = new Date(dateVal);
          if (isNaN(d.getTime())) return null;
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        };

        const countByMonth = (statuses, dateField) => {
          const map = {};
          combined.forEach(doc => {
            if (!statuses.includes(doc.status)) return;
            const month = safeMonth(doc[dateField]);
            if (!month) return;
            map[month] = (map[month] || 0) + 1;
          });
          return map;
        };

        const open = countByMonth(["Open", "Active"], "createdAt");
        const claimed = countByMonth(["Claimed"], "createdAt");
        const resolved = countByMonth(["Resolved"], "resolvedAt");
        const unresolved = countByMonth(["Open", "Active", "Claimed"], "createdAt");

        res.json({
          months,
          series: {
            Open: months.map(m => open[m] || 0),
            Claimed: months.map(m => claimed[m] || 0),
            Resolved: months.map(m => resolved[m] || 0),
            Unresolved: months.map(m => unresolved[m] || 0),
          }
        });
      } catch (err) {
        console.error("❌ /analytics/monthly error", err);
        res.status(500).json({ error: "Failed to compute monthly analytics" });
      }
    });


    // ========================
    // ITEMS ROUTES (Item Discovery Feature)
    // ========================

    // Get all items with filters (keyword, category, date, status)
    app.get('/api/items', async (req, res) => {
      try {
        const {
          keyword,
          category,
          status,
          dateFrom,
          dateTo,
          page = 1,
          limit = 12,
        } = req.query;

        // Build query
        const query = {};
        //  FEATURE 13: exclude deleted items everywhere in discovery/share
        query.isDeleted = { $ne: true };


        // Keyword search (title or description)
        if (keyword) {
          query.$or = [
            { title: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
          ];
        }

        // Category filter
        if (category && category !== 'All') {
          query.category = category;
        }

        // Status filter
        if (status && status !== 'All') {
          query.status = status;
        }

        // Date range filter
        if (dateFrom || dateTo) {
          query.dateFound = {};
          if (dateFrom) {
            query.dateFound.$gte = new Date(dateFrom);
          }
          if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            query.dateFound.$lte = endDate;
          }
        }

        // Pagination
        const skip = (page - 1) * limit;
        const limitNum = parseInt(limit);

        // Execute query - sort by newest first
        const items = await itemsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip(skip)
          .toArray();

        // Get total count
        const total = await itemsCollection.countDocuments(query);

        res.status(200).json({
          success: true,
          data: items,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limitNum),
            totalItems: total,
            itemsPerPage: limitNum,
          },
        });
      } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch items',
          error: error.message,
        });
      }
    })

    // Get single item by ID
    app.get('/api/items/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid item ID',
          });
        }
        const item = await itemsCollection.findOne({
          _id: new ObjectId(id),
          isDeleted: { $ne: true }, //  hide deleted items from detail/share link
        });  


        if (!item) {
          return res.status(404).json({
            success: false,
            message: 'Item not found',
          });
        }

        res.status(200).json({
          success: true,
          data: item,
        });
      } catch (error) {
        console.error('Error fetching item:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to fetch item',
          error: error.message,
        });
      }
    })

    // FEATURE 13: RESTORE Item (undo soft delete)
    app.patch("/items/:id/restore", async (req, res) => {
      const { id } = req.params;

      try {
        const _id = new ObjectId(id);

        const item = await itemsCollection.findOne({ _id, isDeleted: true });
        if (!item) return res.status(404).send("Item not found in recycle bin");


        await itemsCollection.updateOne(
          { _id },
          {
            $set: {
              isDeleted: false,
              restoredAt: new Date(),
              restoredBy: req.body?.restoredBy || null,
              updatedAt: new Date(),
            },
            // unset deletedAt so TTL won't remove restored item
            $unset: { deletedAt: "", deletedBy: "" },
          }
        );

        // FEATURE 6: create notification on ITEM restore
        await createNotification({
          userEmail: req.body?.restoredBy || null,
          type: "ITEM_RESTORED",
          title: "Item restored",
          message: `“${item.title || "Untitled"}” has been restored successfully.`,
          link: "/dashboard/items",
          entity: { kind: "item", id },
        });

        res.send({ ok: true, restored: true });
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid item id");
      }
    }); 

    // FEATURE 13: RESTORE Lost Report (undo soft delete)
    app.patch("/lostreports/:id/restore", async (req, res) => {
      const { id } = req.params;

      try {
        const _id = new ObjectId(id);

        const report = await lostReportsCollection.findOne({ _id, isDeleted: true });
        if (!report) return res.status(404).send("Lost report not found in recycle bin");


        await lostReportsCollection.updateOne(
          { _id },
          {
            $set: {
              isDeleted: false,
              restoredAt: new Date(),
              restoredBy: req.body?.restoredBy || null,
              updatedAt: new Date(),
            },
            // unset deletedAt so TTL won't remove restored report
            $unset: { deletedAt: "", deletedBy: "" },
          }
        );

        // FEATURE 6: notify student 
        await createNotification({
          userEmail: report.userEmail,
          type: "LOSTREPORT_RESTORED",
          title: "Lost report restored",
          message: `“${report.title || "Untitled"}” has been restored successfully.`,
          link: "/app/lost-reports",
          entity: { kind: "lostreport", id },
        });

        res.send({ ok: true, restored: true });
      } catch (err) {
        console.error(err);
        res.status(400).send("Invalid report id");
      }
    });  

    // FEATURE 13: RECYCLE BIN LIST 
    app.get("/api/recycle-bin", async (req, res) => {
      try {
        const { role, userEmail } = req.query;

        if (!role) {
          return res
            .status(400)
            .json({ success: false, message: "role is required" });
        }

        if (role === "admin" || role === "staff") {
          const deletedItems = await itemsCollection
            .find({ isDeleted: true })
            .sort({ deletedAt: -1 })
            .toArray();
          const data = deletedItems.map((doc) => ({
            ...doc,
            displayName: doc.title || doc.name || "(no title)",
          }));

          return res.json({ success: true, entityType: "items", data });
        }

       
        if (role === "student") {
          if (!userEmail) {
            return res.status(400).json({
              success: false,
              message: "userEmail is required for students",
            });
          }

          const deletedReports = await lostReportsCollection
            .find({ isDeleted: true, userEmail })
            .sort({ deletedAt: -1 })
            .toArray();

          const data = deletedReports.map((doc) => ({
            ...doc,
            displayName: doc.title || doc.name || "(no title)",
          }));

          return res.json({ success: true, entityType: "lostreports", data });
        }

        return res
          .status(400)
          .json({ success: false, message: "Unknown role" });
      } catch (err) {
        console.error(err);
        return res
          .status(500)
          .json({ success: false, message: "Failed to load recycle bin" });
      }
    }); 


    // GET /notifications?userEmail=...&limit=50
    app.get("/notifications", async (req, res) => {
      try {
        const { userEmail, limit = 50 } = req.query;
        if (!userEmail) return res.status(400).json({ message: "userEmail is required" });

        const limitNum = Math.min(parseInt(limit, 10) || 50, 100);

        const data = await notificationsCollection
          .find({ userEmail })
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .toArray();

        res.json({ success: true, data });
      } catch (err) {
        console.error("GET /notifications error:", err);
        res.status(500).json({ success: false, message: "Failed to load notifications" });
      }
    });

    // PATCH /notifications/:id/read
    app.patch("/notifications/:id/read", async (req, res) => {
      try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid id" });

        const result = await notificationsCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { isRead: true, readAt: new Date() } }
        );

        res.json({ success: true, updated: result.modifiedCount === 1 });
      } catch (err) {
        console.error("PATCH /notifications/:id/read error:", err);
        res.status(500).json({ success: false, message: "Failed to mark as read" });
      }
    });

    // PATCH /notifications/read-all?userEmail=...
    app.patch("/notifications/read-all", async (req, res) => {
      try {
        const { userEmail } = req.query;
        if (!userEmail) return res.status(400).json({ message: "userEmail is required" });

        const result = await notificationsCollection.updateMany(
          { userEmail, isRead: false },
          { $set: { isRead: true, readAt: new Date() } }
        );

        res.json({ success: true, updatedCount: result.modifiedCount });
      } catch (err) {
        console.error("PATCH /notifications/read-all error:", err);
        res.status(500).json({ success: false, message: "Failed to mark all as read" });
      }
    });

    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");



  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
  }
}

run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Back2U server is running')
})

app.listen(port, () => {
  console.log(`Back2U server is running on port ${port}`)
})