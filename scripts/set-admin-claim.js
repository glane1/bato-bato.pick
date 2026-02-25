#!/usr/bin/env node
/*
  Usage:
    node scripts/set-admin-claim.js /path/to/serviceAccountKey.json <UID>
  Or set env var GOOGLE_APPLICATION_CREDENTIALS and run:
    node scripts/set-admin-claim.js <UID>

  This script sets the custom claim { admin: true } on the specified Firebase Auth user UID.
  Requirements: a Firebase service account JSON (Admin SDK) with permissions to manage users.
*/

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

async function main() {
  const args = process.argv.slice(2);
  let keyPath, uid;

  if (args.length === 1) {
    // Assume env var points to key file
    uid = args[0];
    keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  } else if (args.length >= 2) {
    keyPath = args[0];
    uid = args[1];
  }

  if (!uid) {
    console.error('Error: missing UID. Usage: node scripts/set-admin-claim.js [serviceAccount.json] <UID>');
    process.exit(1);
  }

  if (!keyPath) {
    console.error('Error: missing service account key path. Provide it as first arg or set GOOGLE_APPLICATION_CREDENTIALS env var.');
    process.exit(1);
  }

  keyPath = path.resolve(keyPath);
  if (!fs.existsSync(keyPath)) {
    console.error('Service account file not found:', keyPath);
    process.exit(1);
  }

  const serviceAccount = require(keyPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  try {
    console.log('Setting admin claim for UID:', uid);
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log('Custom claim set. Note: the user must re-authenticate to receive the new token.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to set custom claim:', err.message || err);
    process.exit(1);
  }
}

main();
