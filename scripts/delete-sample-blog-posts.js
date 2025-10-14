#!/usr/bin/env node

/**
 * delete-sample-blog-posts.js - Delete all sample/test blog posts from Firestore
 *
 * Usage:
 *   node scripts/delete-sample-blog-posts.js
 *
 * This script will:
 * 1. Connect to Firestore
 * 2. List all blog posts
 * 3. Delete all posts (use with caution!)
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

async function deleteSampleBlogPosts() {
  console.log('\n🗑️  Allie Blog Post Deletion Script\n');
  console.log('⚠️  WARNING: This will delete ALL blog posts from the blogPosts collection!\n');

  try {
    // Get all blog posts
    const snapshot = await db.collection('blogPosts').get();

    if (snapshot.empty) {
      console.log('✅ No blog posts found. Collection is already empty.\n');
      process.exit(0);
    }

    console.log(`📊 Found ${snapshot.size} blog post(s):\n`);

    // List all posts
    const posts = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      posts.push({ id: doc.id, ...data });
      console.log(`   - ${data.title || 'Untitled'} (${doc.id})`);
      console.log(`     Slug: ${data.slug || 'no-slug'}`);
      console.log(`     Published: ${data.published ? 'Yes' : 'No'}`);
      console.log(`     Category: ${data.category || 'N/A'}\n`);
    });

    // Confirm deletion
    console.log(`\n⚠️  About to delete ${posts.length} blog post(s).`);
    console.log('   This action CANNOT be undone!\n');

    // Delete all posts
    console.log('🗑️  Deleting posts...\n');

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    console.log(`✅ Successfully deleted ${posts.length} blog post(s)!\n`);
    console.log('📊 Blog posts collection is now empty.\n');

  } catch (error) {
    console.error('\n❌ Error deleting blog posts:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
deleteSampleBlogPosts().catch(console.error);
