const admin = require('firebase-admin');

// Simple Firebase Admin initialization without service account
// This will work for basic read/write operations with security rules
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'parentload-ba995',
    storageBucket: 'parentload-ba995.appspot.com',
  });
  console.log('✅ Firebase Admin initialized (simple mode)');
}

const db = admin.firestore();

module.exports = { admin, db };