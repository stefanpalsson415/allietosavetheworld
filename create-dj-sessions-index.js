// create-dj-sessions-index.js
// Script to create the required index for djSessions collection

const indexConfig = {
  collectionGroup: 'djSessions',
  fields: [
    { fieldPath: 'familyId', order: 'ASCENDING' },
    { fieldPath: 'userId', order: 'ASCENDING' },
    { fieldPath: 'startTime', order: 'ASCENDING' }
  ]
};

console.log('To create the required index, please visit:');
console.log('https://console.firebase.google.com/v1/r/project/parentload-ba995/firestore/indexes');
console.log('\nOr use the Firebase CLI:');
console.log('firebase firestore:indexes');
console.log('\nAdd this to your firestore.indexes.json:');
console.log(JSON.stringify({
  indexes: [{
    collectionGroup: "djSessions",
    queryScope: "COLLECTION",
    fields: [
      { fieldPath: "familyId", order: "ASCENDING" },
      { fieldPath: "userId", order: "ASCENDING" },
      { fieldPath: "startTime", order: "ASCENDING" }
    ]
  }]
}, null, 2));