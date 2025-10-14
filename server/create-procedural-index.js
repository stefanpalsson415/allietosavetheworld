#!/usr/bin/env node

/**
 * Create the procedural_memory index manually
 * This is needed for the AI agent's ReAct reasoning system
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'parentload-ba995',
    credential: admin.credential.applicationDefault()
  });
}

async function createProceduralMemoryIndex() {
  console.log('🔧 Creating procedural_memory index...');

  try {
    // The specific URL from the error message
    const indexUrl = 'https://console.firebase.google.com/v1/r/project/parentload-ba995/firestore/indexes?create_composite=Clpwcm9qZWN0cy9wYXJlbnRsb2FkLWJhOTk1L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wcm9jZWR1cmFsX21lbW9yeS9pbmRleGVzL18QARoMCghmYW1pbHlJZBABGg8KC3N1Y2Nlc3NSYXRlEAIaEgoOZXhlY3V0aW9uQ291bnQQAhoMCghfX25hbWVfXxAC';

    console.log('📋 Index configuration needed:');
    console.log('Collection Group: procedural_memory');
    console.log('Fields:');
    console.log('  - familyId: Ascending');
    console.log('  - successRate: Descending');
    console.log('  - executionCount: Descending');
    console.log('');
    console.log('🌐 Please visit the Firebase Console to create this index:');
    console.log(indexUrl);
    console.log('');
    console.log('Or manually create the index with these steps:');
    console.log('1. Go to Firebase Console > Firestore > Indexes');
    console.log('2. Click "Create Index"');
    console.log('3. Collection Group: procedural_memory');
    console.log('4. Add fields:');
    console.log('   - familyId (Ascending)');
    console.log('   - successRate (Descending)');
    console.log('   - executionCount (Descending)');
    console.log('5. Click "Create"');
    console.log('');

    // Test if the query works (it will fail until the index is created)
    console.log('🧪 Testing procedural memory query...');
    const db = admin.firestore();

    try {
      const snapshot = await db.collection('procedural_memory')
        .where('familyId', '==', 'test_family')
        .orderBy('successRate', 'desc')
        .orderBy('executionCount', 'desc')
        .limit(5)
        .get();

      console.log('✅ Index already exists! Query succeeded.');
      console.log(`Found ${snapshot.size} procedural memory patterns.`);

    } catch (error) {
      if (error.message.includes('requires an index')) {
        console.log('❌ Index still needed. Please create it using the URL above.');
        console.log('Once created, the AI agent will have full reasoning capabilities.');
      } else {
        console.log('ℹ️  Other error (normal if no data exists yet):', error.message);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createProceduralMemoryIndex()
    .then(() => {
      console.log('✨ Index creation process complete!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

module.exports = createProceduralMemoryIndex;