// Script to create the missing Firestore index for kanbanTasks
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require('./serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function createIndex() {
  console.log('Creating Firestore composite index for kanbanTasks...');
  
  // Note: Firestore indexes must be created through the Firebase Console or CLI
  // This script will output the index configuration that needs to be added
  
  const indexConfig = {
    collectionGroup: "kanbanTasks",
    queryScope: "COLLECTION",
    fields: [
      {
        fieldPath: "familyId",
        order: "ASCENDING"
      },
      {
        fieldPath: "updatedAt",
        order: "DESCENDING"
      },
      {
        fieldPath: "status",
        order: "DESCENDING"
      }
    ]
  };
  
  console.log('\nAdd this to your firestore.indexes.json file:');
  console.log(JSON.stringify(indexConfig, null, 2));
  
  console.log('\nThen run: firebase deploy --only firestore:indexes');
  
  // Also output the direct Firebase Console URL
  const projectId = admin.app().options.projectId || 'your-project-id';
  console.log(`\nOr create manually at: https://console.firebase.google.com/project/${projectId}/firestore/indexes`);
}

createIndex().catch(console.error);