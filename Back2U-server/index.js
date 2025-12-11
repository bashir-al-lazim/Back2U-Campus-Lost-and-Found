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
    const claimsCollection = db.collection("claims");

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
       //create items
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
  // DELETE item
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
    // LOST REPORTS CRUD
    // -----------------------
    app.get("/lostreports", async (req, res) => {
      try {
        const { userEmail } = req.query;
        const filter = userEmail ? { userEmail } : {};
        const reports = await lostReportsCollection.find(filter).sort({ _id: -1 }).toArray();
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
        const report = await lostReportsCollection.findOne(filter);
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

    app.delete("/lostreports/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const filter = { _id: new ObjectId(id) };
        const result = await lostReportsCollection.deleteOne(filter);
        if (result.deletedCount === 0) return res.status(404).send("Lost report not found");
        res.send({ ok: true });
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

        const item = await itemsCollection.findOne({ _id: new ObjectId(report.linkedItemId) });
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
        const item = await itemsCollection.findOne({ _id: new ObjectId(id) });
        if (!item) return res.status(404).send("Item not found");

        if (!item.linkedReportId) {
          return res.status(200).json(null);
        }

        const report = await lostReportsCollection.findOne({ _id: new ObjectId(item.linkedReportId) });
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
          itemsCollection.find().toArray(),
          lostReportsCollection.find().toArray(),
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

        const query = {};

        if (keyword) {
          query.$or = [
            { title: { $regex: keyword, $options: 'i' } },
            { description: { $regex: keyword, $options: 'i' } },
          ];
        }

        if (category && category !== 'All') {
          query.category = category;
        }

        if (status && status !== 'All') {
          query.status = status;
        }

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

        const skip = (page - 1) * limit;
        const limitNum = parseInt(limit);

        const items = await itemsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip(skip)
          .toArray();

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
    });

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

        const item = await itemsCollection.findOne({ _id: new ObjectId(id) });

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
    });

    // ========================
    // CLAIMS MANAGEMENT ROUTES-------(##4)-loba
    // ========================

    // POST /claims - Student creates a new claim
    app.post('/claims', async (req, res) => {
      const claimData = req.body;

      if (!claimData.itemId || !claimData.claimantEmail || (!claimData.proofText && !claimData.proofPhotoUrl)) {
        return res.status(400).json({ message: 'Missing required fields (itemId, claimantEmail, and at least one proof).' });
      }

      try {
       
        const item = await itemsCollection.findOne({ _id: new ObjectId(claimData.itemId) });
        if (!item) {
          return res.status(404).json({ message: 'Item not found or is no longer claimable.' });
        }

        
        const status = (item.status || 'Open').trim().toLowerCase();
        if (status !== 'open') {
          return res.status(404).json({ message: 'Item not found or is no longer claimable.' });
        }


        const newClaim = {
          itemId: claimData.itemId,
          itemTitle: item.title,
          claimantEmail: claimData.claimantEmail,
          proofText: claimData.proofText || '',
          proofPhotoUrl: claimData.proofPhotoUrl || '',
          status: 'Pending', 
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await claimsCollection.insertOne(newClaim);
        res.status(201).json({
          success: true,
          message: 'Claim submitted successfully. Waiting for staff review.',
          claimId: result.insertedId
        });
      } catch (error) {
        console.error('Error submitting claim:', error);
        res.status(500).json({ message: 'Failed to submit claim.' });
      }
    });

    // NEW: POST /items/:itemId/claims  <-- used by StudentClaimPage
    app.post('/items/:itemId/claims', async (req, res) => {
      const { itemId } = req.params;
      const {
        claimantEmail,
        claimantName, 
        proofText,
        proofPhotoUrl,
      } = req.body;

      // 0) Basic validation
      if (!itemId || !claimantEmail || (!proofText && !proofPhotoUrl)) {
        return res.status(400).json({
          message:
            'Missing required fields (itemId param, claimantEmail, and at least one proof).',
        });
      }

      try {
        // 1) Verify item exists
        let item = null;

        if (ObjectId.isValid(itemId)) {
          item = await itemsCollection.findOne({ _id: new ObjectId(itemId) });
        }
        if (!item) {
          
          item = await itemsCollection.findOne({ _id: itemId });
        }

        if (!item) {
         
          return res.status(404).json({
            message: 'Item not found.',
          });
        }

        // 2) Check if this student already has a pending claim for this item
        const existingClaim = await claimsCollection.findOne({
          itemId: String(itemId),
          claimantEmail,
          status: 'Pending',
        });

        if (existingClaim) {
          return res.status(400).json({
            message: 'You already have a pending claim for this item.',
          });
        }

        // 3) Enforce EXACTLY ONE proof (text XOR photo)
        const text = (proofText || '').trim();
        const photo = (proofPhotoUrl || '').trim();

        if (!text && !photo) {
          return res.status(400).json({
            message: 'Provide exactly one proof: text OR photo.',
          });
        }

        if (text && photo) {
          return res.status(400).json({
            message: 'Provide exactly one proof: text OR photo (not both).',
          });
        }

        // 4) Create the claim
        const newClaim = {
          itemId: String(itemId),
          itemTitle: item.title,
          claimantEmail,
          claimantName: claimantName || null,
          proofText: text || '',
          proofPhotoUrl: photo || '',
          status: 'Pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await claimsCollection.insertOne(newClaim);

        return res.status(201).json({
          success: true,
          message: 'Claim submitted successfully. Waiting for staff review.',
          claimId: result.insertedId,
        });
      } catch (error) {
        console.error('Error submitting claim via /items/:itemId/claims:', error);
        return res.status(500).json({ message: 'Failed to submit claim.' });
      }
    });



    // GET /claims - Staff gets all claims, Student gets claims by email
    app.get('/claims', async (req, res) => {
      try {
        const { email } = req.query; // Used by student for 'My Claims'

        let filter = {};
        if (email) {
      
          filter.claimantEmail = email;
        } else {
          
          filter.status = { $in: ["Pending", "Accepted", "Rejected"] };
        }

        const claims = await claimsCollection.find(filter).sort({ createdAt: -1 }).toArray();
        res.status(200).json(claims);
      } catch (error) {
        console.error('Error fetching claims:', error);
        res.status(500).json({ message: 'Failed to fetch claims.' });
      }
    });

    // GET /claims/:id - Get single claim details
    app.get('/claims/:id', async (req, res) => {
      const { id } = req.params;
      try {
        const claim = await claimsCollection.findOne({ _id: new ObjectId(id) });
        if (!claim) {
          return res.status(404).json({ message: 'Claim not found.' });
        }
        res.status(200).json(claim);
      } catch (error) {
        console.error('Error fetching claim details:', error);
        res.status(400).json({ message: 'Invalid claim ID.' });
      }
    });

    // PUT /claims/:id/accept - Staff accepts a claim
    app.put('/claims/:id/accept', async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid claim ID.' });
      }

      try {
        const _id = new ObjectId(id);

        // 1) Find the claim first
        const claim = await claimsCollection.findOne({ _id });

        if (!claim) {
          return res.status(404).json({ message: 'Claim not found.' });
        }

        if (claim.status !== 'Pending') {
          return res
            .status(400)
            .json({ message: `Cannot accept claim with status "${claim.status}".` });
        }

        // 2) Generate a 6-digit OTP as string
        const otp = String(Math.floor(100000 + Math.random() * 900000));

        const updateDoc = {
          $set: {
            status: 'Accepted',
            otp: otp,
            reviewedAt: new Date(),
            updatedAt: new Date(),
          }
        };

        const result = await claimsCollection.findOneAndUpdate(
          { _id },
          updateDoc,
          { returnDocument: 'after' }
        );

        return res.json({
          message: 'Claim accepted successfully.',
          ...result.value
        });

      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error while accepting claim.' });
      }
    });

    // PUT /claims/:id/reject - Staff rejects a claim
    app.put('/claims/:id/reject', async (req, res) => {
      const { id } = req.params;

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid claim ID.' });
      }

      try {
        const _id = new ObjectId(id);

        // 1) Find the claim first
        const claim = await claimsCollection.findOne({ _id });

        if (!claim) {
          return res.status(404).json({ message: 'Claim not found.' });
        }

        if (claim.status !== 'Pending') {
          return res
            .status(400)
            .json({ message: `Cannot reject claim with status "${claim.status}".` });
        }

        const updateDoc = {
          $set: {
            status: 'Rejected',
            reviewedAt: new Date(),
            updatedAt: new Date(),
          },
          $unset: { otp: "" }
        };

        const result = await claimsCollection.findOneAndUpdate(
          { _id },
          updateDoc,
          { returnDocument: 'after' }
        );

        return res.status(200).json(result.value);
      } catch (error) {
        console.error('Error rejecting claim:', error);
        res.status(500).json({ message: 'Failed to reject claim.' });
      }
    });

    // PUT /claims/:id/cancel - Student cancels a claim
    app.put('/claims/:id/cancel', async (req, res) => {
      const { id } = req.params;
      try {
        const filter = { _id: new ObjectId(id), status: 'Pending' };
        const updateDoc = {
          $set: {
            status: 'Cancelled',
            updatedAt: new Date(),
          },
          $unset: { otp: "" }
        };

        const result = await claimsCollection.findOneAndUpdate(
          filter,
          updateDoc,
          { returnDocument: 'after' }
        );

        const updated = result && (result.value ?? result);

        if (!updated) {
          return res
            .status(404)
            .json({ message: 'Claim not found or status is not Pending.' });
        }

        res.status(200).json(updated);
      } catch (error) {
        console.error('Error canceling claim:', error);
        res.status(500).json({ message: 'Failed to cancel claim.' });
      }
    });

    // -----------------------
    // HANDOVER OTP VERIFICATION (##5)-loba
    // -----------------------
    app.post('/handover/verify-otp', async (req, res) => {
      const { claimId, otp } = req.body;

      if (!claimId || !otp) {
        return res.status(400).json({ message: 'Claim ID and OTP are required.' });
      }

      try {
        let claim = null;
        if (ObjectId.isValid(claimId)) {
          const objectId = new ObjectId(claimId);
          claim = await claimsCollection.findOne({ _id: objectId });
        }

        
        if (!claim) {
          claim = await claimsCollection.findOne({ itemId: String(claimId) });
        }

        if (!claim) {
          return res.status(400).json({
            message: 'Verification failed. Invalid Claim ID or claim not found.'
          });
        }

        //  Check status
        if (claim.status !== 'Accepted') {
          return res.status(400).json({
            message: 'Verification failed. Claim is not Accepted.'
          });
        }

        // Check OTP (string-safe compare)
        if (String(claim.otp) !== String(otp)) {
          return res.status(400).json({
            message: 'Verification failed. Invalid OTP.'
          });
        }

        // All good → mark as handed over
        const updateDoc = {
          $set: {
            status: 'HandedOver',
            resolvedAt: new Date(),
            updatedAt: new Date(),
            otpVerifiedAt: new Date(),
          }
        };

        const result = await claimsCollection.findOneAndUpdate(
          { _id: claim._id },
          updateDoc,
          { returnDocument: 'after' }
        );

        return res.json({
          message: 'Item successfully handed over.',
          ...result.value
        });

      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error verifying OTP.' });
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
