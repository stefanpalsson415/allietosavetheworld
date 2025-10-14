#!/usr/bin/env node

/**
 * verify-blog-post.js - Verify blog post was added successfully
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

async function verifyBlogPost() {
  console.log('\n🔍 Verifying Blog Post\n');

  try {
    // Get all blog posts
    const snapshot = await db.collection('blogPosts')
      .where('published', '==', true)
      .get();

    if (snapshot.empty) {
      console.log('❌ No published blog posts found!\n');
      process.exit(1);
    }

    console.log(`✅ Found ${snapshot.size} published blog post(s):\n`);

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📝 ${data.title}`);
      console.log(`   Slug: ${data.slug}`);
      console.log(`   Category: ${data.category}`);
      console.log(`   Reading Time: ${data.readingTime} min`);
      console.log(`   Featured: ${data.featured ? 'Yes' : 'No'}`);
      console.log(`   Tags: ${data.tags?.join(', ') || 'None'}`);
      console.log(`   URL: https://checkallie.com/blog/${data.slug}`);
      console.log('');
    });

    console.log('✅ Blog post verification complete!\n');

  } catch (error) {
    console.error('\n❌ Error verifying blog post:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
verifyBlogPost().catch(console.error);
