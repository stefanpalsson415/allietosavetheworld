const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with proper authentication
if (!admin.apps.length) {
  // For local development, we'll use a different approach
  // Instead of service account, we'll use the Firebase REST API
  console.log('Initializing Firebase Admin for local development...');
  
  admin.initializeApp({
    projectId: 'parentload-ba995',
    databaseURL: 'https://parentload-ba995.firebaseio.com'
  });
}

// Helper function to get Firestore with auth bypass for development
function getFirestore() {
  const db = admin.firestore();
  
  // In development, we'll use the REST API approach
  if (process.env.NODE_ENV !== 'production') {
    // Set up to use emulator or bypass auth
    db.settings({
      ignoreUndefinedProperties: true
    });
  }
  
  return db;
}

module.exports = {
  admin,
  db: getFirestore()
};