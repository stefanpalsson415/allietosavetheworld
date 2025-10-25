const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: 'parentload-ba995'
  });
}

const db = admin.firestore();
const familyId = 'palsson_family_simulation';

async function markAsProcessed() {
  console.log('🔧 Marking demo data as processed...\n');

  try {
    // Process emails
    console.log('📧 Processing emails...');
    const emailsSnapshot = await db.collection('emailInbox')
      .where('familyId', '==', familyId)
      .get();

    let batch = db.batch();
    let count = 0;

    emailsSnapshot.forEach(doc => {
      const data = doc.data();
      batch.update(doc.ref, {
        status: 'processed',
        aiAnalysis: {
          summary: data.subject || 'Email received',
          category: 'general',
          processed: true
        },
        suggestedActions: [],
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count++;
    });

    await batch.commit();
    console.log(`✅ Marked ${count} emails as processed\n`);

    // Process SMS
    console.log('📱 Processing SMS...');
    const smsSnapshot = await db.collection('smsInbox')
      .where('familyId', '==', familyId)
      .get();

    batch = db.batch();
    count = 0;

    smsSnapshot.forEach(doc => {
      const data = doc.data();
      batch.update(doc.ref, {
        status: 'processed',
        aiAnalysis: {
          summary: (data.content || data.body || 'SMS received').substring(0, 100),
          category: 'general',
          processed: true
        },
        suggestedActions: [],
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count++;
    });

    await batch.commit();
    console.log(`✅ Marked ${count} SMS as processed\n`);

    // Process documents
    console.log('📄 Processing documents...');
    const docsSnapshot = await db.collection('familyDocuments')
      .where('familyId', '==', familyId)
      .get();

    batch = db.batch();
    count = 0;

    docsSnapshot.forEach(doc => {
      const data = doc.data();
      batch.update(doc.ref, {
        status: 'processed',
        aiAnalysis: {
          summary: data.title || data.fileName || 'Document',
          category: data.category || 'general',
          processed: true
        },
        processedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      count++;
    });

    await batch.commit();
    console.log(`✅ Marked ${count} documents as processed\n`);

    // Process contacts
    console.log('👥 Processing contacts...');
    const contactsSnapshot = await db.collection('familyContacts')
      .where('familyId', '==', familyId)
      .get();

    batch = db.batch();
    count = 0;

    contactsSnapshot.forEach(doc => {
      batch.update(doc.ref, {
        status: 'active'
      });
      count++;
    });

    await batch.commit();
    console.log(`✅ Marked ${count} contacts as active\n`);

    console.log('🎉 All demo data marked as processed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

markAsProcessed();
