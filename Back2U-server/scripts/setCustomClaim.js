// server/scripts/setCustomClaim.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(__dirname, "../firebase-service-account.json");

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

async function setRole(email, role) {
  try {
    const user = await admin.auth().getUserByEmail(email);

    await admin.auth().setCustomUserClaims(user.uid, {
      role: role, // "admin" or "staff"
    });

    console.log(`✔ SUCCESS: Role '${role}' set for ${email}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ ERROR:", err);
    process.exit(1);
  }
}

const [,, email, role] = process.argv;

if (!email || !role) {
  console.log("❌ Usage: node scripts/setCustomClaim.js <email> <role>");
  console.log("Example: node scripts/setCustomClaim.js test@gmail.com admin");
  process.exit(1);
}

setRole(email, role);
