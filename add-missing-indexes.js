#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the existing firestore.indexes.json
const indexesPath = path.join(__dirname, 'firestore.indexes.json');
const indexesContent = fs.readFileSync(indexesPath, 'utf8');
const indexesData = JSON.parse(indexesContent);

// Define the new indexes to add
const newIndexes = [
  {
    collectionGroup: "familyDocuments",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "familyId", order: "ASCENDING" },
      { fieldPath: "uploadedAt", order: "DESCENDING" }
    ]
  },
  {
    collectionGroup: "familyContacts",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "familyId", order: "ASCENDING" },
      { fieldPath: "name", order: "ASCENDING" }
    ]
  }
];

// Add the new indexes to the existing ones
indexesData.indexes.push(...newIndexes);

// Sort indexes by collectionGroup for better organization
indexesData.indexes.sort((a, b) => a.collectionGroup.localeCompare(b.collectionGroup));

// Write the updated indexes back to the file
fs.writeFileSync(indexesPath, JSON.stringify(indexesData, null, 2));

console.log('✅ Successfully added the following indexes:');
console.log('- familyDocuments: familyId (ASC), uploadedAt (DESC)');
console.log('- familyContacts: familyId (ASC), name (ASC)');
console.log('\nTo deploy these indexes, run:');
console.log('firebase deploy --only firestore:indexes');