// firebase-index-creator.js
// This script helps create Firestore indexes when you encounter index errors
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check if service account file exists
const serviceAccountPath = path.join(__dirname, 'service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`Service account file not found at ${serviceAccountPath}`);
  console.error('Please create a service-account.json file with your Firebase admin credentials');
  process.exit(1);
}

// Initialize Firebase Admin
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
}

const db = admin.firestore();

/**
 * Creates an index definition that can be added to firestore.indexes.json
 * @param {string} collectionId - Collection ID
 * @param {Array<Object>} fields - Array of field objects with name and order
 * @returns {Object} - Index definition
 */
function createIndexDefinition(collectionId, fields) {
  return {
    collectionGroup: collectionId,
    queryScope: 'COLLECTION',
    fields: fields
  };
}

// Example: Create an index for choreTemplates
const choreTemplatesIndex = createIndexDefinition('choreTemplates', [
  { fieldPath: 'familyId', order: 'ASCENDING' },
  { fieldPath: 'isArchived', order: 'ASCENDING' },
  { fieldPath: 'title', order: 'ASCENDING' }
]);

// Example: Create an index for choreInstances
const choreInstancesIndex = createIndexDefinition('choreInstances', [
  { fieldPath: 'familyId', order: 'ASCENDING' },
  { fieldPath: 'childId', order: 'ASCENDING' },
  { fieldPath: 'date', order: 'ASCENDING' },
  { fieldPath: 'sequence', order: 'ASCENDING' }
]);

// Print index definitions that can be added to firestore.indexes.json
console.log(JSON.stringify({ indexes: [choreTemplatesIndex, choreInstancesIndex] }, null, 2));

// Function to create Firebase Firestore indexes programmatically
// Note: For programmatic creation, you need the appropriate permissions
async function createIndexes() {
  try {
    console.log('Creating indexes...');
    
    // Note: Firebase Admin SDK doesn't have direct index creation methods
    // This would require using the Firebase Management API
    
    console.log('To create indexes, you can:');
    console.log('1. Add the above index definitions to firestore.indexes.json');
    console.log('2. Run firebase deploy --only firestore:indexes');
    console.log('3. Or visit the Firebase Console > Firestore > Indexes and add them manually');
    
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
}

createIndexes();