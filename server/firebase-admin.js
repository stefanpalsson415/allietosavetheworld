const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // In production (Cloud Run), use Application Default Credentials
    // Cloud Run automatically provides these when running in GCP
    if (process.env.NODE_ENV === 'production' || process.env.K_SERVICE) {
      admin.initializeApp({
        projectId: 'parentload-ba995',
        credential: admin.credential.applicationDefault()
      });
      console.log('Firebase Admin initialized with Application Default Credentials');
    } else {
      // For local development
      admin.initializeApp({
        projectId: 'parentload-ba995',
        storageBucket: 'parentload-ba995.appspot.com',
        credential: process.env.GOOGLE_APPLICATION_CREDENTIALS
          ? admin.credential.applicationDefault()
          : admin.credential.cert({
              projectId: 'parentload-ba995',
              clientEmail: 'firebase-adminsdk@parentload-ba995.iam.gserviceaccount.com',
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || ''
            })
      });
      console.log('Firebase Admin initialized for development');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);

    // Fallback: Initialize with just project ID
    try {
      admin.initializeApp({
        projectId: 'parentload-ba995'
      });
      console.log('Firebase Admin initialized with minimal config');
    } catch (fallbackError) {
      console.error('Failed to initialize Firebase Admin completely:', fallbackError);
    }
  }
}

// Export for CommonJS (most server files)
module.exports = admin;

// Also export Firestore instance for convenience
module.exports.db = admin.firestore();