// Minimal Firebase Admin for development
// This version doesn't require service account credentials
// and allows other services to load properly

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Initialize without credentials for development
    // This will have limited access but won't block other services
    admin.initializeApp({
      projectId: 'parentload-ba995',
      storageBucket: 'parentload-ba995.appspot.com'
    });
    console.log('Firebase Admin initialized (minimal mode for development)');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error.message);
    // Don't throw - let the app continue
  }
}

module.exports = admin;