// server/middleware/verifyFirebase.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// Initialize firebase-admin once
if (!admin.apps.length) {
  const serviceAccountPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    path.join(__dirname, "../firebase-service-account.json");

  if (!fs.existsSync(serviceAccountPath)) {
    console.error("Firebase service account file not found at:", serviceAccountPath);
    throw new Error("Firebase service account file not found. Check FIREBASE_SERVICE_ACCOUNT_PATH");
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const verifyIdToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const match = authHeader.match(/^Bearer (.*)$/);
    if (!match) return res.status(401).json({ success: false, message: "Missing or invalid Authorization header" });
    const idToken = match[1];

    // Verify token using firebase-admin
    const decoded = await admin.auth().verifyIdToken(idToken);

    // Attach useful user info and claims
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      name: decoded.name || null,
      claims: decoded, // contains custom claims and default claims
    };

    return next();
  } catch (err) {
    console.error("Token verification error:", err?.message || err);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = verifyIdToken;
