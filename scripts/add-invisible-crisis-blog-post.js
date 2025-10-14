#!/usr/bin/env node

/**
 * add-invisible-crisis-blog-post.js - Add "The Invisible Crisis" blog post
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

async function addBlogPost() {
  console.log('\n📝 Adding "The Invisible Crisis" Blog Post\n');

  try {
    const title = 'The Invisible Crisis: Why Modern Families Are Drowning';
    const slug = 'invisible-crisis-modern-families';
    const excerpt = 'I was standing in my kitchen at 10 PM, updating our family calendar. Our three-year-old was finally asleep, the baby had been fed, and I should have been exhausted in a good way. Instead, I felt like I was drowning.';

    const content = `
<article class="prose lg:prose-xl max-w-none">
  <p class="lead">I was standing in my kitchen at 10 PM, updating our family calendar. Our three-year-old was finally asleep, the baby had been fed, and I should have been exhausted in a good way. Instead, I felt like I was drowning.</p>

  <p>While I'd pulled back on my work hours, the details of running a household seemed to multiply daily. Since having our second child, I was constantly keeping track of medical appointments, items to pick up from the store (always more diapers!), and signing up my three-year-old for enriching activities like gymnastics and painting class. Then there was the laundry, the outgrown baby clothes that needed to either be saved (would we have another?) or donated.</p>

  <p>One night, I was particularly short-tempered with my husband over nothing really. "What is going on with you?" he asked. I was exasperated. Couldn't he see I was drowning? All the details I was barely holding together? The plates about to topple?</p>

  <p>I tried to explain that I was overwhelmed by everything I had to do that week. To his credit, he brought curiosity to the conversation and asked what exactly I needed to do. As I listed the doctor's appointment on Thursday and the trip to the store for laundry detergent, I watched his eyes glaze over. He was flabbergasted. In a slightly annoyed, somewhat sarcastic voice, he said: "I'm sorry, but you're stressed that you have to go to the grocery store?"</p>

  <p>My heart sank, and I felt more alone than ever. He was probably right, I thought. Something was wrong with me. Why were these mundane tasks overwhelming me and leaving me close to tears?</p>

  <p><strong>The reality: I was bearing almost all of the invisible parental load and had been for three years. And he didn't see it. He couldn't at the time.</strong></p>

  <h2>The Hidden Epidemic</h2>

  <p>What I experienced that night is happening in kitchens across America. Research reveals that 87% of households have one person carrying the majority of what sociologists call "cognitive labor", the invisible work of remembering, planning, and coordinating family life.</p>

  <p>This isn't about who does the dishes or drives carpool. Those tasks are visible. The invisible work is the remembering, the planning, the emotional labor of anticipating needs. It's knowing that school pictures need payment next week, noticing that your child seems withdrawn after school, tracking which friendships need nurturing, and mentally rehearsing the logistics of every family outing.</p>

  <h2>The Numbers Behind the Crisis</h2>

  <p>The statistics paint a sobering picture:</p>

  <ul>
    <li>Global fertility rates have plummeted from 5.1 births per woman in 1970 to just 2.4 today</li>
    <li>In America, the birthrate has fallen to 1.6, well below the 2.1 needed to maintain population stability</li>
    <li>73% of young adults cite "overwhelming parental responsibilities" as a primary factor in delaying or avoiding children altogether</li>
  </ul>

  <p>This represents millions of individual decisions by couples who look at the landscape of modern parenting and quietly say, "We cannot bear this load."</p>

  <p>The 2025 Care.com survey revealed that 90% of parents regularly lose sleep due to care coordination tasks, and 75% report "a sense of dread" when thinking about their family logistics. Most alarmingly, 29% have considered self-harm as a response to parental stress.</p>

  <p>These aren't the markers of a sustainable system. These are warning signs of a civilization that has optimized for everything except the basic human need to raise children without destroying oneself in the process.</p>

  <h2>The Invisible Load Defined</h2>

  <p>To understand this crisis, we must make visible what has remained hidden. Consider what happens in your mind during a typical Tuesday morning:</p>

  <p>You remember that today is the last day to return the field trip permission slip. But wait. What does your daughter need for the trip? Lunch money? A jacket? Did you buy that special science notebook yet? While making breakfast, you're mentally cataloguing seventeen separate tasks that need attention, none of which appeared on your calendar or task list. They existed only in your mind: fragile, interrelated memories that could collapse if you allowed yourself a moment's inattention.</p>

  <p>Dr. Allison Daminger's groundbreaking Harvard research identified four distinct components of cognitive labor:</p>

  <ol>
    <li><strong>Anticipating needs</strong> (school will need volunteers for the fall festival)</li>
    <li><strong>Identifying options</strong> (researching which volunteer roles work with your schedule)</li>
    <li><strong>Making decisions</strong> (choosing to sign up for book fair instead of Halloween party)</li>
    <li><strong>Monitoring outcomes</strong> (ensuring you actually show up and fulfill the commitment)</li>
  </ol>

  <p>Her study of 135 couples found that women perform an average of 71% of this cognitive work, regardless of employment status or professed egalitarian values.</p>

  <h2>When Recognition Becomes Liberation</h2>

  <p>The most insidious aspect of the mental load crisis is how invisible it remains to those not carrying it. Partners see the same situation completely differently. Primary caregivers can accurately assess that they handle 87% of the family's cognitive load, while their partners believe that percentage is only 43%. In fact, both partners believe they're doing the majority of family work, a mathematical impossibility.</p>

  <p>Looking back on that kitchen conversation, all I really needed was to be seen. To be appreciated and supported in my role as the invisible load bearer. While sharing the load is optimal, recognition alone can be transformative.</p>

  <p>When families make their cognitive load distribution visible something shifts. Partners stop arguing about who does more because they can finally see what was always there. Children observe different models of partnership. The drowning parent gets a lifeline: validation that their exhaustion is real and reasonable.</p>

  <h2>The Path Forward</h2>

  <p>This crisis isn't inevitable. Systems and patterns can be changed through conscious intervention. Beyond good intentions, it demands tools that make invisible work visible, systems that distribute memory rather than concentrate it, and recognition that this isn't a personal failing but a systemic challenge requiring systemic solutions.</p>

  <p>The families struggling today aren't failing. They're responding predictably to systems that were never designed for contemporary family life. And when we see that clearly, when we make the invisible visible, we create space for real change.</p>

  <p><strong>Because when we see the load, we see each other. And that makes all the difference.</strong></p>

  <h2>Three Immediate Actions You Can Take</h2>

  <ol>
    <li><strong>Track for one week:</strong> Note who in your family remembers appointments, initiates planning conversations, and anticipates problems. Just awareness creates change.</li>
    <li><strong>Start appreciation conversations:</strong> Thank your partner for specific invisible work: "I noticed you researched three different summer camps before making that recommendation."</li>
    <li><strong>Make it visible:</strong> Share one mental task you're carrying with your partner today. Don't ask them to take it over; just make it known.</li>
  </ol>

  <p>The invisible crisis starts to heal the moment we decide to see it.</p>

  <div class="bg-blue-50 border-l-4 border-blue-500 p-6 my-8">
    <p class="font-semibold">Have you experienced the invisible load in your family? What would change if this work became truly visible and valued? Share your story in the comments below.</p>
  </div>
</article>
    `.trim();

    // Calculate reading time (roughly 200 words per minute)
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    // Prepare blog post data
    const postData = {
      title,
      slug,
      excerpt,
      content,
      category: 'Mental Load',
      published: true,
      featured: true, // Make it featured as it's the first post
      publishedDate: admin.firestore.Timestamp.now(),
      createdAt: admin.firestore.Timestamp.now(),
      updatedDate: admin.firestore.Timestamp.now(),
      readingTime,
      tags: ['mental load', 'cognitive labor', 'parenting', 'invisible work', 'family balance', 'research'],
      author: {
        name: 'Allie Team',
        bio: 'Research-backed insights on family balance and mental load redistribution'
      },
      heroImage: {
        url: '/earth-image.jpg', // Using existing image
        alt: 'Modern family finding balance'
      },
      seo: {
        metaDescription: 'Research reveals 87% of households have one person carrying the majority of cognitive labor. Discover why modern families are drowning in invisible work and how to fix it.',
        keywords: 'mental load, cognitive labor, parenting stress, invisible work, family balance, emotional labor'
      }
    };

    // Create post in Firestore
    const docRef = await db.collection('blogPosts').add(postData);

    console.log('✅ Blog post created successfully!\n');
    console.log('📊 Post Details:');
    console.log(`   ID: ${docRef.id}`);
    console.log(`   Title: ${title}`);
    console.log(`   Slug: ${slug}`);
    console.log(`   Category: ${postData.category}`);
    console.log(`   Reading time: ${readingTime} min`);
    console.log(`   Published: Yes`);
    console.log(`   Featured: Yes`);
    console.log(`   Word count: ${wordCount} words`);
    console.log(`\n🌐 View at: https://checkallie.com/blog/${slug}\n`);

  } catch (error) {
    console.error('\n❌ Error creating blog post:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
addBlogPost().catch(console.error);
