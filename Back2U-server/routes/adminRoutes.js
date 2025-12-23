const express = require("express");
const router = express.Router();
const { ObjectId } = require("mongodb");
const checkAdmin = require("../middleware/checkAdmin");

// Protect all admin routes
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

// CREATE category
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
      timestamp: new Date(),
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

    await db.collection("categories").updateOne(
      { _id: new ObjectId(id) },
      { $set: { name } }
    );

    await db.collection("auditLogs").insertOne({
      action: "RENAME_CATEGORY",
      details: name,
      admin: req.body.adminEmail || "ADMIN_USER",
      timestamp: new Date(),
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
      admin: req.user?.email || "ADMIN_USER",
      timestamp: new Date(),
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
      timestamp: new Date(),
    });

    res.json({ success: true, value: days });
  } catch (err) {
    console.error("POST /reminder-policy error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/* --------------------------
   STUDENT MANAGEMENT
--------------------------- */

// Search student by ID, email, or name (partial)
router.get("/student/search", async (req, res) => {
  try {
    const db = getDb(req);
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Query is required" });

    const student = await db.collection("students").findOne({
      $or: [
        { studentId: query },
        { email: query.toLowerCase() },
        { name: { $regex: query, $options: "i" } }
      ]
    });

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student);
  } catch (err) {
    console.error("Search student error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Ban / Warning student by _id
router.put("/student/ban/:id", async (req, res) => {
  try {
    const db = getDb(req);
    const { id } = req.params;
    const { permanent, until, warning, adminEmail } = req.body;

    const student = await db.collection("students").findOne({ _id: new ObjectId(id) });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Warning
    if (warning) {
      const warnings = (student.warningsCount || 0) + 1;
      await db.collection("students").updateOne(
        { _id: new ObjectId(id) },
        { $set: { warningsCount: warnings } }
      );

      await db.collection("auditLogs").insertOne({
        action: "SEND_WARNING",
        details: `Student ${student.name || student.email} received warning #${warnings}`,
        admin: adminEmail || "ADMIN_USER",
        timestamp: new Date(),
      });

      return res.json({ success: true, message: `Warning sent (#${warnings})` });
    }

    // Ban
    let bannedUntil = null;
    if (permanent) bannedUntil = "PERMANENT";
    else if (until) {
      const date = new Date(until);
      if (isNaN(date.getTime())) return res.status(400).json({ message: "Invalid date" });
      bannedUntil = date;
    }

    await db.collection("students").updateOne(
      { _id: new ObjectId(id) },
      { $set: { banned: true, bannedUntil } }
    );

    await db.collection("auditLogs").insertOne({
      action: "BAN_STUDENT",
      details: `Student ${student.name || student.email} banned ${permanent ? "permanently" : `until ${bannedUntil}`}`,
      admin: adminEmail || "ADMIN_USER",
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: `Student banned ${permanent ? "permanently" : `until ${bannedUntil}`}`,
    });
  } catch (err) {
    console.error("PUT /student/ban/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Unban student by _id
router.put("/student/unban/:id", async (req, res) => {
  try {
    const db = getDb(req);
    const { id } = req.params;
    const adminEmail = req.body.adminEmail || "ADMIN_USER";

    const result = await db.collection("students").updateOne(
      { _id: new ObjectId(id) },
      { $set: { banned: false, bannedUntil: null } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ message: "Student not found" });

    await db.collection("auditLogs").insertOne({
      action: "UNBAN_STUDENT",
      details: `Student ${id} unbanned`,
      admin: adminEmail,
      timestamp: new Date(),
    });

    res.json({ success: true, message: "Student unbanned successfully" });
  } catch (err) {
    console.error("PUT /student/unban/:id error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
