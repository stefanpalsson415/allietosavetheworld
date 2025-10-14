// Script to backup all Firestore data before cleanup
const admin = require('firebase-admin');
const fs = require('fs');

// Initialize admin SDK (you'll need to add your service account key)
// Download from Firebase Console > Project Settings > Service Accounts
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function backupCollection(collectionName) {
  console.log(`Backing up ${collectionName}...`);
  const snapshot = await db.collection(collectionName).get();
  const data = [];
  
  snapshot.forEach(doc => {
    data.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  fs.writeFileSync(
    `./backup/${collectionName}.json`, 
    JSON.stringify(data, null, 2)
  );
  
  console.log(`✅ Backed up ${data.length} documents from ${collectionName}`);
  return data.length;
}

async function backupAll() {
  const collections = [
    'users',
    'families', 
    'events',
    'providers',
    'habits',
    'choreTemplates',
    'choreInstances',
    'rewardTemplates',
    'rewardInstances',
    'bucksTransactions',
    'messages',
    'documents',
    'familyDocuments',
    'tasks'
  ];
  
  // Create backup directory
  if (!fs.existsSync('./backup')) {
    fs.mkdirSync('./backup');
  }
  
  // Add timestamp to backup
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  fs.writeFileSync('./backup/backup-info.json', JSON.stringify({
    timestamp,
    date: new Date().toString()
  }, null, 2));
  
  let totalDocs = 0;
  for (const collection of collections) {
    try {
      totalDocs += await backupCollection(collection);
    } catch (error) {
      console.error(`Error backing up ${collection}:`, error);
    }
  }
  
  console.log(`\n✅ Backup complete! Total documents: ${totalDocs}`);
}

// Run backup
backupAll().catch(console.error);