// create-firestore-indexes.js
// This script generates Firebase Firestore indexes needed for the application
// It's designed to run from the command line

const fs = require('fs');
const path = require('path');

// Generate the index configuration file
function generateIndexConfig() {
  console.log('Generating Firebase Firestore indexes configuration...');
  
  // Basic Firestore index configuration
  const indexConfig = {
    "indexes": [
      // ChoreTemplates indexes
      {
        "collectionGroup": "choreTemplates",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "familyId", "order": "ASCENDING" },
          { "fieldPath": "title", "order": "ASCENDING" }
        ]
      },
      {
        "collectionGroup": "choreTemplates",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "familyId", "order": "ASCENDING" },
          { "fieldPath": "isArchived", "order": "ASCENDING" },
          { "fieldPath": "title", "order": "ASCENDING" }
        ]
      },
      
      // ChoreInstances indexes
      {
        "collectionGroup": "choreInstances",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "familyId", "order": "ASCENDING" },
          { "fieldPath": "childId", "order": "ASCENDING" },
          { "fieldPath": "date", "order": "ASCENDING" },
          { "fieldPath": "sequence", "order": "ASCENDING" }
        ]
      },
      {
        "collectionGroup": "choreInstances",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "familyId", "order": "ASCENDING" },
          { "fieldPath": "status", "order": "ASCENDING" },
          { "fieldPath": "completedAt", "order": "DESCENDING" }
        ]
      },
      {
        "collectionGroup": "choreInstances",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "familyId", "order": "ASCENDING" },
          { "fieldPath": "scheduleId", "order": "ASCENDING" },
          { "fieldPath": "date", "order": "ASCENDING" }
        ]
      },
      
      // RewardTemplates indexes
      {
        "collectionGroup": "rewardTemplates",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "familyId", "order": "ASCENDING" },
          { "fieldPath": "title", "order": "ASCENDING" }
        ]
      },
      {
        "collectionGroup": "rewardTemplates",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "familyId", "order": "ASCENDING" },
          { "fieldPath": "isActive", "order": "ASCENDING" },
          { "fieldPath": "title", "order": "ASCENDING" }
        ]
      }
    ],
    "fieldOverrides": []
  };

  // Write the configuration to a file
  fs.writeFileSync(
    path.join(__dirname, 'firestore.indexes.json'), 
    JSON.stringify(indexConfig, null, 2)
  );
  
  console.log('Generated firestore.indexes.json');
  console.log('\nTo deploy these indexes, run:');
  console.log('firebase deploy --only firestore:indexes');
  console.log('\nNote: It might take up to 30 minutes for indexes to be created in Firestore.');
  console.log('In the meantime, the application will use client-side filtering.');
}

// Run the generator
generateIndexConfig();