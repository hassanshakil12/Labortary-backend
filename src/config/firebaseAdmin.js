const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

const serviceAccount = JSON.parse(
  fs.readFileSync(
    path.resolve("../keys/firebaseServiceAccountKey.json"),
    "utf-8"
  )
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firebaseAdmin = admin;
module.exports = firebaseAdmin;
