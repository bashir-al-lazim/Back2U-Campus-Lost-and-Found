// server/routes/feature15Routes.js
const express = require("express");
const { ObjectId } = require("mongodb");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const verifyIdToken = require("../middleware/verifyFirebase");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

function getDb(req) {
  return req.app.locals.db;
}

// ensure upload dir
const UPLOAD_DIR = path.join(__dirname, "../uploads/feature15");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

/* 1) CREATE PEER-HELD ITEM (with photo) */
router.post("/item", upload.single("photo"), async (req, res) => {
  try {
    const db = getDb(req);
    const { title, description, category, studentID, studentEmail } = req.body;
    if (!title || !studentID || !studentEmail) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const photoPath = req.file ? `/uploads/feature15/${req.file.filename}` : null;

    const newItem = {
      title,
      description: description || "",
      category: category || "General",
      postedBy: studentID,
      studentEmail,
      status: "Held by Student",
      photo: photoPath,
      handoffRequested: false,
      converted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("peerHeldItems").insertOne(newItem);
    const created = await db.collection("peerHeldItems").findOne({ _id: result.insertedId });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error("Create peer-held item error:", err);
    res.status(500).json({ success: false, message: "Error creating item." });
  }
});

/* 2) GET PEER-HELD ITEMS (filter by student) */
router.get("/item", async (req, res) => {
  try {
    const db = getDb(req);
    const { studentID } = req.query;
    const query = studentID ? { studentEmail: studentID } : {};
    const items = await db.collection("peerHeldItems").find(query).sort({ createdAt: -1 }).toArray();
    res.json({ success: true, data: items });
  } catch (err) {
    console.error("Get peer-held items error:", err);
    res.status(500).json({ success: false, message: "Error fetching items." });
  }
});

/* 3) STUDENT: request handoff */
router.post("/handoff-request/:id", async (req, res) => {
  try {
    const db = getDb(req);
    const { id } = req.params;
    const item = await db.collection("peerHeldItems").findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });
    if (item.handoffRequested) return res.status(400).json({ success: false, message: "Handoff already requested." });

    await db.collection("peerHeldItems").updateOne(
      { _id: new ObjectId(id) },
      { $set: { handoffRequested: true, status: "Handoff Requested", updatedAt: new Date() } }
    );

    res.json({ success: true, message: "Handoff requested successfully." });
  } catch (err) {
    console.error("Handoff request error:", err);
    res.status(500).json({ success: false, message: "Error requesting handoff." });
  }
});

/* 4) STAFF: view pending requests (protected) */
router.get("/requests", verifyIdToken, adminOnly, async (req, res) => {
  try {
    const db = getDb(req);
    const requests = await db
      .collection("peerHeldItems")
      .find({ handoffRequested: true, converted: false })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ success: true, data: requests });
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({ success: false, message: "Error loading requests." });
  }
});

/* 5) STAFF: confirm receipt (protected) */
router.post("/confirm/:id", verifyIdToken, adminOnly, async (req, res) => {
  try {
    const db = getDb(req);
    const { id } = req.params;
    const staffEmail = req.user?.email;

    if (!staffEmail) return res.status(400).json({ success: false, message: "Staff email is required." });

    const item = await db.collection("peerHeldItems").findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });

    const officialItem = {
      title: item.title,
      description: item.description,
      category: item.category,
      status: "Open",
      photo: item.photo,
      createdAt: new Date(),
      updatedAt: new Date(),
      convertedFrom: item._id,
      addedBy: staffEmail,
    };

    await db.collection("items").insertOne(officialItem);
    await db.collection("peerHeldItems").updateOne(
      { _id: new ObjectId(id) },
      { $set: { converted: true, status: "Converted", updatedAt: new Date() } }
    );

    res.json({ success: true, message: "Item converted to official inventory.", data: officialItem });
  } catch (err) {
    console.error("Confirm receipt error:", err);
    res.status(500).json({ success: false, message: "Error confirming receipt." });
  }
});


/* 6) STAFF: reject handoff request (protected) */
router.post("/reject/:id", verifyIdToken, adminOnly, async (req, res) => {
  try {
    const db = getDb(req);
    const { id } = req.params;

    const item = await db.collection("peerHeldItems").findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ success: false, message: "Item not found." });

    await db.collection("peerHeldItems").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "Rejected", updatedAt: new Date() } }
    );

    res.json({ success: true, message: "Handoff request rejected." });
  } catch (err) {
    console.error("Reject request error:", err);
    res.status(500).json({ success: false, message: "Error rejecting request." });
  }
});

/* 7) STUDENT: delete their own peer-held item (protected) */
router.delete("/item/:id", verifyIdToken, async (req, res) => {
  try {
    const db = getDb(req);
    const { id } = req.params;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({ success: false, message: "Unauthenticated" });
    }

    // Find the item by ID
    const item = await db.collection("peerHeldItems").findOne({ _id: new ObjectId(id) });
    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    // Check ownership
    if (item.studentEmail !== userEmail) {
      return res.status(403).json({ success: false, message: "Forbidden: cannot delete this item" });
    }

    // Delete the item
    const deleteResult = await db.collection("peerHeldItems").deleteOne({ _id: new ObjectId(id) });
    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({ success: false, message: "Failed to delete item" });
    }

    // Delete associated photo from server
    if (item.photo) {
      const filePath = path.join(__dirname, "..", item.photo.replace(/^\//, ""));
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete item photo:", err);
      });
    }

    res.json({ success: true, message: "Item deleted successfully", itemId: id });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ success: false, message: "Error deleting item" });
  }
});


module.exports = router;
