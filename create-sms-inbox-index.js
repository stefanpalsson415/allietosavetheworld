// Create missing index for smsInbox collection
const fs = require('fs');

// Read current indexes
const indexesFile = './firestore.indexes.json';
const indexes = JSON.parse(fs.readFileSync(indexesFile, 'utf8'));

// Add smsInbox index
const smsInboxIndex = {
  "collectionGroup": "smsInbox",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "familyId",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "receivedAt",
      "order": "DESCENDING"
    }
  ]
};

// Check if index already exists
const exists = indexes.indexes.some(index => 
  index.collectionGroup === 'smsInbox' &&
  index.fields.some(f => f.fieldPath === 'familyId') &&
  index.fields.some(f => f.fieldPath === 'receivedAt')
);

if (!exists) {
  indexes.indexes.push(smsInboxIndex);
  
  // Write back
  fs.writeFileSync(indexesFile, JSON.stringify(indexes, null, 2));
  console.log('✅ Added smsInbox index to firestore.indexes.json');
  console.log('Run: firebase deploy --only firestore:indexes');
} else {
  console.log('Index already exists');
}