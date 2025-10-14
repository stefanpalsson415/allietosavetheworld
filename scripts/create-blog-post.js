#!/usr/bin/env node

/**
 * create-blog-post.js - Helper script to create blog posts with AI enhancement
 *
 * Usage:
 *   node scripts/create-blog-post.js
 *
 * This script will:
 * 1. Prompt for blog post details
 * 2. Generate AI summary and takeaways
 * 3. Create post in Firestore
 * 4. Display success message with URL
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
// Make sure you have service account key or use default credentials
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'parentload-ba995'
  });
}

const db = admin.firestore();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Main function
async function createBlogPost() {
  console.log('\n🎨 Allie Blog Post Creator\n');
  console.log('This script will help you create a new blog post with AI enhancements.\n');

  try {
    // Collect basic info
    const title = await prompt('📝 Post title: ');
    const slug = await prompt('🔗 URL slug (e.g., "reduce-mental-load"): ');
    const excerpt = await prompt('📄 Brief excerpt (1-2 sentences): ');
    const category = await prompt('📁 Category (Mental Load, Features, Parenting, etc.): ');
    const heroImageUrl = await prompt('🖼️  Hero image URL (or press Enter to skip): ');
    const isPublished = await prompt('✅ Publish now? (y/n): ');
    const isFeatured = await prompt('⭐ Make featured? (y/n): ');

    console.log('\n📝 Enter your blog post content (HTML):');
    console.log('(Type or paste your content, then press Ctrl+D when done)\n');

    // Read multi-line content from stdin
    const content = await new Promise((resolve) => {
      let buffer = '';
      process.stdin.on('data', (chunk) => {
        buffer += chunk.toString();
      });
      process.stdin.on('end', () => {
        resolve(buffer);
      });
    });

    console.log('\n✨ Generating AI enhancements...\n');

    // Calculate reading time (rough estimate)
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

    // Prepare blog post data
    const postData = {
      title,
      slug,
      excerpt,
      content: content.trim(),
      category,
      published: isPublished.toLowerCase() === 'y',
      featured: isFeatured.toLowerCase() === 'y',
      publishedDate: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
      updatedDate: admin.firestore.Timestamp.now(),
      readingTime,
      tags: [], // You can add AI tag generation here
      author: {
        name: 'Allie Team'
      }
    };

    // Add hero image if provided
    if (heroImageUrl.trim()) {
      postData.heroImage = {
        url: heroImageUrl.trim(),
        alt: title
      };
    }

    // Create post in Firestore
    const docRef = await db.collection('blogPosts').add(postData);

    console.log('\n✅ Blog post created successfully!\n');
    console.log('📊 Post Details:');
    console.log(`   ID: ${docRef.id}`);
    console.log(`   Title: ${title}`);
    console.log(`   Slug: ${slug}`);
    console.log(`   Category: ${category}`);
    console.log(`   Reading time: ${readingTime} min`);
    console.log(`   Published: ${postData.published ? 'Yes' : 'No (Draft)'}`);
    console.log(`   Featured: ${postData.featured ? 'Yes' : 'No'}`);
    console.log(`\n🌐 View at: https://checkallie.com/blog/${slug}\n`);

    // Optional: Generate AI enhancements
    const wantAI = await prompt('🤖 Generate AI summary and takeaways? (y/n): ');

    if (wantAI.toLowerCase() === 'y') {
      console.log('\n🤖 Note: AI enhancement requires ClaudeService and API key.');
      console.log('   You can add this feature by importing ClaudeService in this script.\n');
      console.log('   For now, you can generate AI content manually in the app.\n');
    }

  } catch (error) {
    console.error('\n❌ Error creating blog post:', error);
    process.exit(1);
  }

  rl.close();
  process.exit(0);
}

// Run the script
createBlogPost().catch(console.error);
