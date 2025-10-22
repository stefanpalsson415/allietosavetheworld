#!/usr/bin/env node

/**
 * Seed Demo Family
 *
 * Quickly create realistic demo families for testing, sales demos, or development
 *
 * Usage:
 *   node seed-demo-family.js busy_professional
 *   node seed-demo-family.js single_parent
 *   node seed-demo-family.js balanced_partnership
 *   node seed-demo-family.js large_family
 *
 * Creates family with:
 * - Complete family members (Triple ID pattern)
 * - 20+ essential contacts
 * - 50+ annual calendar events
 * - Initial habits for current cycle
 */

const admin = require('firebase-admin');
const path = require('path');
const { familyTemplates, generateFamilyMember, generateContact, calculateNextOccurrence } = require('./seed-templates');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, '..', '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentload-ba995.firebaseio.com'
});

const db = admin.firestore();

/**
 * Create demo family from template
 *
 * @param {string} templateName - Template to use
 * @returns {Promise<string>} familyId
 */
async function createDemoFamily(templateName) {
  const template = familyTemplates[templateName];

  if (!template) {
    console.error(`❌ Template "${templateName}" not found`);
    console.log(`\nAvailable templates: ${Object.keys(familyTemplates).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n🚀 Creating ${template.familyName} from ${templateName} template...`);
  console.log(`   ${template.description}\n`);

  // Generate unique family ID
  const timestamp = Date.now();
  const familyId = `demo_${templateName}_${timestamp}`;

  try {
    // 1. Create family members with Triple ID pattern
    console.log(`👥 Creating ${template.members.length} family members...`);
    const familyMembers = template.members.map(member =>
      generateFamilyMember(member, familyId)
    );

    familyMembers.forEach(member => {
      const mentalLoadStr = member.mentalLoad !== undefined
        ? ` (mental load: ${(member.mentalLoad * 100).toFixed(0)}%)`
        : '';
      console.log(`   ✅ ${member.name} (${member.role}, age ${member.age})${mentalLoadStr}`);
    });

    // 2. Create family document
    console.log(`\n📋 Creating family document...`);
    const now = admin.firestore.Timestamp.now();

    await db.collection('families').doc(familyId).set({
      familyName: template.familyName,
      familyMembers: familyMembers,
      createdAt: now,
      updatedAt: now,
      currentWeek: 1
    });

    console.log(`   ✅ Family document created: ${familyId}`);

    // 3. Create contacts
    if (template.contactTemplates && template.contactTemplates.length > 0) {
      console.log(`\n📞 Creating ${template.contactTemplates.length} contacts...`);

      for (const contactTemplate of template.contactTemplates) {
        const contact = generateContact(contactTemplate, template.familyName);

        await db.collection('families')
          .doc(familyId)
          .collection('contacts')
          .add(contact);

        console.log(`   ✅ ${contact.name} (${contact.category} - ${contact.role})`);
      }
    }

    // 4. Create calendar events (annual calendar)
    let totalEvents = 0;
    if (template.eventTemplates && template.eventTemplates.length > 0) {
      console.log(`\n📅 Generating annual calendar events...`);

      const parents = familyMembers.filter(m => m.isParent);
      const primaryParent = parents[0] || familyMembers[0];

      const startDate = new Date();

      for (const eventTemplate of template.eventTemplates) {
        // Calculate how many times this event occurs in a year
        const occurrences = getAnnualOccurrences(eventTemplate.frequency);
        let eventDate = new Date(startDate);

        for (let i = 0; i < occurrences; i++) {
          const startTime = admin.firestore.Timestamp.fromDate(eventDate);
          const endDate = new Date(eventDate);
          endDate.setMinutes(endDate.getMinutes() + eventTemplate.duration);
          const endTime = admin.firestore.Timestamp.fromDate(endDate);

          const event = {
            // Security fields (CRITICAL)
            familyId: familyId,
            userId: primaryParent.userId,

            title: eventTemplate.title,
            description: `Auto-generated from ${templateName} template`,

            // Timestamp duality
            startTime: startTime,
            endTime: endTime,
            startDate: eventDate.toISOString(),
            endDate: endDate.toISOString(),

            allDay: false,
            category: eventTemplate.category,
            source: 'manual',

            createdAt: now,
            updatedAt: now
          };

          await db.collection('families')
            .doc(familyId)
            .collection('events')
            .add(event);

          totalEvents++;

          // Calculate next occurrence
          eventDate = calculateNextOccurrence(eventDate, eventTemplate.frequency);
        }
      }

      console.log(`   ✅ Created ${totalEvents} calendar events`);
    }

    // 5. Create initial habits for current cycle
    console.log(`\n🎯 Creating initial habits for cycle 1...`);

    const parents = familyMembers.filter(m => m.isParent);
    const habitCategories = ['home', 'kids', 'work', 'self', 'home'];
    const habitDescriptions = [
      'Take 15 minutes in the morning to plan the day',
      'Have a 10-minute check-in with kids after school',
      'Set work boundaries - no email after 7pm',
      'Practice 5 minutes of mindfulness before bed',
      'Delegate one household task to partner'
    ];

    let habitCount = 0;
    for (const parent of parents) {
      for (let i = 0; i < 5; i++) {
        const habit = {
          userId: parent.userId,
          userName: parent.name,
          habitText: habitDescriptions[i],
          description: habitDescriptions[i],
          category: habitCategories[i],

          // CycleId format (CRITICAL: just the number)
          cycleId: '1',
          cycleType: 'weekly',

          createdAt: now,
          completionCount: 0,
          targetFrequency: 5,
          eloRating: 1200,
          active: true
        };

        await db.collection('families')
          .doc(familyId)
          .collection('habits')
          .add(habit);

        habitCount++;
      }

      console.log(`   ✅ Created 5 habits for ${parent.name}`);
    }

    // 6. Create initial cycle document
    console.log(`\n♻️  Creating cycle 1 document...`);

    const cycleEndDate = new Date();
    cycleEndDate.setDate(cycleEndDate.getDate() + 7);

    await db.collection('families')
      .doc(familyId)
      .collection('cycles')
      .doc('weekly')
      .collection('cycles')
      .doc('weekly_1')
      .set({
        cycleNumber: 1,
        cycleType: 'weekly',
        startDate: now,
        endDate: admin.firestore.Timestamp.fromDate(cycleEndDate),
        step: 1,

        habits: {
          selected: true,
          completed: false
        },

        survey: {
          completed: false
        },

        meeting: {
          completed: false
        }
      });

    console.log(`   ✅ Cycle 1 initialized (Step 1: Habits)`);

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ SUCCESS! ${template.familyName} created`);
    console.log(`${'='.repeat(60)}\n`);

    console.log(`Family ID: ${familyId}`);
    console.log(`Family Name: ${template.familyName}`);
    console.log(`Members: ${familyMembers.length} (${parents.length} parents, ${familyMembers.length - parents.length} children)`);
    console.log(`Contacts: ${template.contactTemplates?.length || 0}`);
    console.log(`Annual Events: ${totalEvents || 0}`);
    console.log(`Habits: ${habitCount}`);

    console.log(`\n📊 Mental Load Distribution:`);
    familyMembers
      .filter(m => m.mentalLoad !== undefined)
      .forEach(m => {
        const loadPercent = (m.mentalLoad * 100).toFixed(0);
        const bar = '█'.repeat(Math.round(m.mentalLoad * 20));
        console.log(`   ${m.name.padEnd(12)} ${bar.padEnd(20)} ${loadPercent}%`);
      });

    console.log(`\n🔑 Login Credentials:`);
    parents.forEach(parent => {
      console.log(`   Email: ${parent.email}`);
      console.log(`   (Set up authentication in Firebase Console)\n`);
    });

    console.log(`\n🎉 Demo family ready for testing/sales demos!`);
    console.log(`   Use familyId: ${familyId}\n`);

    return familyId;

  } catch (error) {
    console.error(`\n❌ Error creating demo family:`, error);
    throw error;
  }
}

/**
 * Calculate number of annual occurrences for event frequency
 *
 * @param {string} frequency - Event frequency
 * @returns {number} Number of occurrences per year
 */
function getAnnualOccurrences(frequency) {
  const occurrences = {
    'weekly': 52,
    'biweekly': 26,
    'monthly': 12,
    'quarterly': 4,
    'biannual': 2,
    'yearly': 1
  };

  return occurrences[frequency] || 1;
}

// Run script
const templateName = process.argv[2];

if (!templateName) {
  console.log(`\n📋 Seed Demo Family`);
  console.log(`   Create realistic demo families in seconds\n`);
  console.log(`Usage: node seed-demo-family.js <template_name>\n`);
  console.log(`Available templates:`);
  Object.entries(familyTemplates).forEach(([key, template]) => {
    console.log(`   ${key.padEnd(25)} - ${template.description}`);
  });
  console.log('');
  process.exit(0);
}

createDemoFamily(templateName)
  .then(() => {
    console.log(`✨ Script completed successfully\n`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n💥 Script failed:`, error);
    process.exit(1);
  });
