const admin = require("firebase-admin");

/**  
 * Middleware to verify Firebase token and check admin role  
 */
async function checkAdmin(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(token);

    // Check custom claim
    if (!decoded.role || decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }

    req.user = decoded; // add decoded token to request
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(403).json({ message: "Not authorized" });
  }
}

module.exports = checkAdmin;
