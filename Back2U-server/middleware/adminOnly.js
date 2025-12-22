// server/middleware/adminOnly.js
module.exports = async function adminOnly(req, res, next) {
  try {
    // Ensure verifyIdToken ran
    if (!req.user) return res.status(401).json({ success: false, message: "Unauthenticated" });

    const email = req.user.email;
    const claims = req.user.claims || {};

    // 1) Check firebase custom claims first
    // (Expect custom claims like: { admin: true } or { staff: true })
    if (claims.admin === true || claims.staff === true) {
      return next();
    }

    // 2) Check authorities collection in DB (role can be 'admin' or 'staff')
    try {
      const db = req.app.locals.db;
      if (db) {
        const doc = await db.collection("authorities").findOne({ email });
        if (doc && doc.role && (doc.role === "admin" || doc.role === "staff")) {
          return next();
        }
      }
    } catch (err) {
      console.error("Error looking up authority in DB:", err);
      // fallthrough to next check
    }

    // 3) Fallback: allow a single admin email from env
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    if (ADMIN_EMAIL && email && ADMIN_EMAIL === email) {
      return next();
    }

    return res.status(403).json({ success: false, message: "Forbidden: admin only" });
  } catch (err) {
    console.error("Admin check error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
