// server/routes/feature15Routes.js
const express = require("express");
const { ObjectId } = require("mongodb");




//to save the uploads file on local machine
//const multer = require("multer");
//const path = require("path");
//const fs = require("fs");

const verifyIdToken = require("../middleware/verifyFirebase");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router(); // <<< MUST EXIST


function getDb(req) {
  return req.app.locals.db;
}

// Ensure upload directory exists

//const UPLOAD_DIR = path.join(__dirname, "../uploads/feature15");
//if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

//const storage = multer.diskStorage({
  //destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  //filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
//});

//const upload = multer({
  //storage,
  //limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
//});



/* 1) CREATE PEER-HELD ITEM (with photo) */
//router.post("/item", upload.single("photo"), async (req, res) => {

  router.post("/item", async (req, res) => {
  try {
    const db = getDb(req);
    const { title, description, category, studentID, studentEmail, location, dateFound } = req.body;
    const { photoBase64 } = req.body;


    //if (!title || !studentID || !studentEmail || !location || !dateFound) {
    if (!title || !studentID || !studentEmail || !location || !dateFound || !photoBase64) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    //const photoPath = req.file ? `/uploads/feature15/${req.file.filename}` : null;

    const newItem = {
      title,
      description: description || "",
      category: category || "General",
      location,
      dateFound: new Date(dateFound),
      postedBy: req.user?.uid || new ObjectId(),
 // NEW ObjectId
      studentEmail,
      status: "Held by Student",
      //photo: photoPath,
      photo: photoBase64,
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

/* 2) GET PEER-HELD ITEMS (only for logged-in student) */
router.get("/item", verifyIdToken, async (req, res) => {
  try {
    const db = getDb(req);
    const userEmail = (req.user?.email || "").trim().toLowerCase();

    if (!userEmail) {
      return res.status(401).json({ success: false, message: "Unauthenticated" });
    }

    // Fetch only items posted by this user
    const items = await db
      .collection("peerHeldItems")
      .find({ studentEmail: userEmail })
      .sort({ createdAt: -1 })
      .toArray();

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
      .find({
        handoffRequested: true,
        converted: false,
        status: { $ne: "Rejected" }  // exclude rejected items
      })
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

    // Convert to official item
    const officialItem = {
      title: item.title,
      description: item.description,
      category: item.category,
      status: "Open",
      photo: item.photo,
      photoUrl: item.photo, // same as photo, can be adjusted if hosted elsewhere
      location: item.location,
      locationText: item.location,
      internalTag: `PH-${Date.now()}`, // example internal tag
      dateFound: item.dateFound,
      postedBy: item.postedBy,
      claimedBy: null,
      resolvedAt: null,
      acceptedClaim: null,
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
    const userEmail = (req.user?.email || "").trim().toLowerCase();

    if (!userEmail) {
      return res.status(401).json({ success: false, message: "Unauthenticated" });
    }

    const item = await db.collection("peerHeldItems").findOne({ _id: new ObjectId(id) });
    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    const itemEmail = (item.studentEmail || "").trim().toLowerCase();

    // Allow delete if:
    // 1) student owns the item
    // 2) legacy item with no studentEmail
    if (itemEmail && itemEmail !== userEmail) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: cannot delete this item",
      });
    }

    const deleteResult = await db.collection("peerHeldItems").deleteOne({ _id: new ObjectId(id) });

    if (deleteResult.deletedCount === 0) {
      return res.status(500).json({ success: false, message: "Failed to delete item" });
    }

    res.json({ success: true, message: "Item deleted successfully", itemId: id });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ success: false, message: "Error deleting item" });
  }
});


module.exports = router;
