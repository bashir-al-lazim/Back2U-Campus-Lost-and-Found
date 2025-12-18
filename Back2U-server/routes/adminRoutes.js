const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");

const checkAdmin = require("../middleware/checkAdmin");

// PROTECT ALL ADMIN ROUTES
router.use(checkAdmin);

// Helper to get DB from app locals
function getDb(req) {
  return req.app.locals.db;
}

/* --------------------------
   CATEGORY MANAGEMENT
--------------------------- */

// GET all categories
router.get("/categories", async (req, res) => {
  try {
    const db = getDb(req);
    const categories = await db.collection("categories").find().toArray();
    res.json({ success: true, data: categories });
  } catch (err) {
    console.error("GET /categories error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE a category
router.post("/categories", async (req, res) => {
  try {
    const db = getDb(req);
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name is required" });

    const result = await db.collection("categories").insertOne({ name, createdAt: new Date() });

    await db.collection("auditLogs").insertOne({
      action: "CREATE_CATEGORY",
      details: name,
      admin: req.body.adminEmail || "ADMIN_USER",
      timestamp: new Date()
    });

    res.json({ success: true, data: { _id: result.insertedId, name } });
  } catch (err) {
    console.error("POST /categories error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// RENAME category
router.put("/categories/:id", async (req, res) => {
  try {
    const db = getDb(req);
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "New name is required" });

    const result = await db.collection("categories").updateOne(
      { _id: new ObjectId(id) },
      { $set: { name } }
    );

    await db.collection("auditLogs").insertOne({
      action: "RENAME_CATEGORY",
      details: name,
      admin: req.body.adminEmail || "ADMIN_USER",
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    console.error("PUT /categories/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE category
router.delete("/categories/:id", async (req, res) => {
  try {
    const db = getDb(req);
    const { id } = req.params;

    await db.collection("categories").deleteOne({ _id: new ObjectId(id) });

    await db.collection("auditLogs").insertOne({
      action: "DELETE_CATEGORY",
      details: id,
      admin: req.body.adminEmail || "ADMIN_USER",
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE /categories/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* --------------------------
   AUDIT LOGS
--------------------------- */

// GET latest 50 logs
router.get("/audit-logs", async (req, res) => {
  try {
    const db = getDb(req);
    const logs = await db.collection("auditLogs").find()
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();
    res.json({ success: true, data: logs });
  } catch (err) {
    console.error("GET /audit-logs error:", err);
    res.status(500).json({ success: false, error: err.message });
  }


});

/* --------------------------
   REMINDER POLICY
--------------------------- */
// GET reminder policy
router.get("/reminder-policy", async (req, res) => {
  try {
    const db = getDb(req);
    let policy = await db.collection("settings").findOne({ _id: "reminder-policy" });

    if (!policy) policy = { _id: "reminder-policy", days: 3 };

    res.json({ success: true, value: policy.days });
  } catch (err) {
    console.error("GET /reminder-policy error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE reminder policy
router.post("/reminder-policy", async (req, res) => {
  try {
    const db = getDb(req);
    const { days, adminEmail } = req.body;

    if (days === undefined || days === null) 
      return res.status(400).json({ success: false, message: "Days is required" });

    await db.collection("settings").updateOne(
      { _id: "reminder-policy" },
      { $set: { days, updatedAt: new Date() } },
      { upsert: true }
    );

    await db.collection("auditLogs").insertOne({
      action: "UPDATE_REMINDER_POLICY",
      details: `${days} days`,
      admin: adminEmail || "ADMIN_USER",
      timestamp: new Date()
    });

    res.json({ success: true, value: days });
  } catch (err) {
    console.error("POST /reminder-policy error:", err);
    res.status(500).json({ success: false, error: err.message });
  }

});

/* --------------------------
   STUDENT MANAGEMENT (Unban)
--------------------------- */

// GET student by studentId
router.get("/student/:studentId", async (req, res) => {
  try {
    const db = getDb(req);
    const { studentId } = req.params;

    const student = await db.collection("students").findOne({ studentId });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(student);
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// UNBAN student
router.put("/student/unban/:studentId", async (req, res) => {
  try {
    const db = getDb(req);
    const { studentId } = req.params;
    const adminEmail = req.body.adminEmail || "ADMIN_USER";

    const result = await db.collection("students").updateOne(
      { studentId },
      { $set: { banned: false } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    await db.collection("auditLogs").insertOne({
      action: "UNBAN_STUDENT",
      details: `Student ID ${studentId} unbanned`,
      admin: adminEmail,
      timestamp: new Date()
    });

    res.json({ success: true, message: "Student unbanned successfully" });
  } catch (err) {
    console.error("PUT /student/unban/:studentId error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});


module.exports = router;
