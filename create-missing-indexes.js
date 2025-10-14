#!/usr/bin/env node

// Script to create missing Firestore indexes
// Run with: node create-missing-indexes.js

const indexes = [
  {
    collection: "familyDocuments",
    fields: [
      { fieldPath: "familyId", order: "ASCENDING" },
      { fieldPath: "reviewed", order: "ASCENDING" },
      { fieldPath: "uploadedAt", order: "DESCENDING" }
    ]
  },
  {
    collection: "smsInbox",
    fields: [
      { fieldPath: "familyId", order: "ASCENDING" },
      { fieldPath: "receivedAt", order: "DESCENDING" }
    ]
  },
  {
    collection: "questionEffectiveness",
    fields: [
      { fieldPath: "familyId", order: "ASCENDING" },
      { fieldPath: "createdAt", order: "DESCENDING" }
    ]
  }
];

console.log("Add these indexes to your firestore.indexes.json file:");
console.log(JSON.stringify({ indexes }, null, 2));
console.log("\nThen run: firebase deploy --only firestore:indexes");