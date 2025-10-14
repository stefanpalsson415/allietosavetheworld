#!/usr/bin/env node

/**
 * clean-blog-posts.js - Delete ALL blog posts except "The Invisible Crisis"
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin with service account
if (!admin.apps.length) {
  const serviceAccount = require(path.join(__dirname, '../server/service-account.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'parentload-ba995'
  });
}

const db = admin.firestore();

async function cleanBlogPosts() {
  console.log('\n🧹 Cleaning Blog Posts - Keeping ONLY "The Invisible Crisis"\n');

  try {
    // Get ALL blog posts (not just published ones)
    const snapshot = await db.collection('blogPosts').get();

    if (snapshot.empty) {
      console.log('✅ No blog posts found. Collection is empty.\n');
      process.exit(0);
    }

    console.log(`📊 Found ${snapshot.size} total blog post(s):\n`);

    const toDelete = [];
    const toKeep = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const title = data.title || 'Untitled';

      // Keep only "The Invisible Crisis" post
      if (title.includes('Invisible Crisis')) {
        toKeep.push({ id: doc.id, title });
        console.log(`✅ KEEPING: ${title} (${doc.id})`);
      } else {
        toDelete.push({ id: doc.id, title });
        console.log(`❌ DELETING: ${title} (${doc.id})`);
      }
    });

    if (toDelete.length === 0) {
      console.log('\n✅ No posts to delete. Only "The Invisible Crisis" exists.\n');
      process.exit(0);
    }

    console.log(`\n⚠️  About to delete ${toDelete.length} post(s) and keep ${toKeep.length} post(s)\n`);

    // Delete unwanted posts
    const batch = db.batch();
    toDelete.forEach(post => {
      const docRef = db.collection('blogPosts').doc(post.id);
      batch.delete(docRef);
    });

    await batch.commit();

    console.log(`✅ Successfully deleted ${toDelete.length} blog post(s)!\n`);
    console.log(`✅ Kept ${toKeep.length} post(s):\n`);
    toKeep.forEach(post => {
      console.log(`   - ${post.title}`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ Error cleaning blog posts:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
cleanBlogPosts().catch(console.error);
