const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: 'parentload-ba995'
  });
}

const db = admin.firestore();
const familyId = 'palsson_family_simulation';

// Family members
const family = {
  stefan: { id: 'stefan_palsson_agent', name: 'Stefan', role: 'parent' },
  kimberly: { id: 'kimberly_palsson_agent', name: 'Kimberly', role: 'parent' },
  lillian: { id: 'lillian_palsson_agent', name: 'Lillian', age: 14, role: 'child' },
  oly: { id: 'oly_palsson_agent', name: 'Oly', age: 11, role: 'child' },
  tegner: { id: 'tegner_palsson_agent', name: 'Tegner', age: 7, role: 'child' }
};

// Event types with full connections
const eventTypes = [
  {
    title: 'Volleyball practice',
    attendees: [family.lillian.id, family.kimberly.id],
    location: 'Lincoln High School Gym, 200 Academic Ave, San Francisco, CA',
    description: 'Weekly volleyball practice for the school team. Lillian is working on serving and defense.',
    duration: 90, // minutes
    dayOfWeek: 2, // Tuesday
    time: '17:00', // 5:00 PM
    frequency: 'weekly',
    color: 'purple',
    contact: {
      name: 'Coach Martinez',
      role: 'Volleyball Coach',
      phone: '+14155552021',
      email: 'j.martinez@lincolnhigh.edu',
      category: 'Sports'
    },
    sourceEmail: {
      from: 'j.martinez@lincolnhigh.edu',
      subject: 'Volleyball Practice Schedule - Fall Season',
      body: 'Hi parents! Volleyball practice will be every Tuesday and Thursday at 5:00 PM at the gym. Please have Lillian arrive 10 minutes early for warm-ups.'
    },
    relatedTasks: [
      { title: 'Pack volleyball gear for Lillian', assignedTo: family.kimberly.id, dueOffset: 0 },
      { title: 'Pick up Lillian from volleyball practice', assignedTo: family.kimberly.id, dueOffset: 2 }
    ]
  },
  {
    title: 'Volleyball practice',
    attendees: [family.lillian.id, family.stefan.id],
    location: 'Lincoln High School Gym, 200 Academic Ave, San Francisco, CA',
    description: 'Weekly volleyball practice for the school team.',
    duration: 90,
    dayOfWeek: 4, // Thursday
    time: '17:00',
    frequency: 'weekly',
    color: 'purple',
    contact: { name: 'Coach Martinez' }, // Reuse contact
    relatedTasks: [
      { title: 'Pack volleyball gear for Lillian', assignedTo: family.stefan.id, dueOffset: 0 }
    ]
  },
  {
    title: 'Science club',
    attendees: [family.oly.id, family.stefan.id],
    location: 'Community Center, Room 203, 1600 Kids Ln, San Francisco, CA',
    description: 'Weekly science club meeting. This week: Building volcanos and learning about chemistry reactions.',
    duration: 60,
    dayOfWeek: 3, // Wednesday
    time: '16:30', // 4:30 PM
    frequency: 'weekly',
    color: 'blue',
    contact: {
      name: 'Mrs. Thompson',
      role: 'Science Club Coordinator',
      phone: '+14155552011',
      email: 'a.thompson@lincolnelementary.edu',
      category: 'Education'
    },
    sourceEmail: {
      from: 'a.thompson@lincolnelementary.edu',
      subject: 'Science Club - Wednesdays at 4:30 PM',
      body: 'Excited to have Oly join science club! We meet every Wednesday at 4:30 PM in Room 203. Please bring a notebook and curiosity!'
    },
    relatedTasks: [
      { title: 'Drop off Oly at science club', assignedTo: family.stefan.id, dueOffset: 0 }
    ]
  },
  {
    title: 'Swimming lessons',
    attendees: [family.tegner.id, family.stefan.id],
    location: 'Aquatic Center, 400 Pool Dr, San Francisco, CA',
    description: 'Swimming lessons for Tegner. Working on freestyle stroke and water confidence.',
    duration: 45,
    dayOfWeek: 6, // Saturday
    time: '10:00', // 10:00 AM
    frequency: 'weekly',
    color: 'cyan',
    contact: {
      name: 'Coach Williams',
      role: 'Swimming Instructor',
      phone: '+14155552022',
      email: 'b.williams@swimclub.org',
      category: 'Sports'
    },
    sourceSMS: {
      from: '+14155552022',
      body: 'Hi! This is Coach Williams. Tegner is doing great in swimming! Lessons are every Saturday at 10 AM. See you at the pool!'
    },
    relatedTasks: [
      { title: 'Pack swimming gear for Tegner', assignedTo: family.stefan.id, dueOffset: 0 },
      { title: 'Apply sunscreen before swimming', assignedTo: family.stefan.id, dueOffset: 0 }
    ]
  },
  {
    title: 'Piano lessons',
    attendees: [family.lillian.id, family.kimberly.id],
    location: 'Music Academy, 1000 Melody Ln, San Francisco, CA',
    description: 'Piano lessons with Mr. Cohen. Currently learning Beethoven\'s Moonlight Sonata.',
    duration: 60,
    dayOfWeek: 1, // Monday
    time: '15:30', // 3:30 PM
    frequency: 'weekly',
    color: 'pink',
    contact: {
      name: 'David Cohen',
      role: 'Piano Teacher',
      phone: '+14155552033',
      email: 'd.cohen@musiclessons.com',
      category: 'Education'
    },
    sourceEmail: {
      from: 'd.cohen@musiclessons.com',
      subject: 'Piano Lesson Schedule',
      body: 'Lillian\'s piano lessons will be every Monday at 3:30 PM. Please ensure she practices at least 20 minutes daily.'
    },
    relatedTasks: [
      { title: 'Remind Lillian to practice piano', assignedTo: family.kimberly.id, dueOffset: -1 }
    ]
  },
  {
    title: 'Family dinner',
    attendees: [family.stefan.id, family.kimberly.id, family.lillian.id, family.oly.id, family.tegner.id],
    location: 'Home',
    description: 'Family dinner together. No phones allowed - quality time to connect and share our day.',
    duration: 60,
    dayOfWeek: null, // All days
    time: '19:00', // 7:00 PM
    frequency: 'daily',
    color: 'orange',
    relatedTasks: [
      { title: 'Meal prep for dinner', assignedTo: family.kimberly.id, dueOffset: -1 },
      { title: 'Set the table', assignedTo: family.lillian.id, dueOffset: 0 }
    ]
  },
  {
    title: 'Family Meeting',
    attendees: [family.stefan.id, family.kimberly.id],
    location: 'Home - Living Room',
    description: 'Weekly parent check-in to discuss schedules, priorities, and Fair Play card distribution.',
    duration: 45,
    dayOfWeek: 0, // Sunday
    time: '20:00', // 8:00 PM
    frequency: 'weekly',
    color: 'gray',
    relatedTasks: [
      { title: 'Review weekly calendar', assignedTo: family.kimberly.id, dueOffset: 0 },
      { title: 'Update Fair Play cards', assignedTo: family.stefan.id, dueOffset: 0 }
    ]
  }
];

async function regenerateConnectedEvents() {
  console.log('🔄 Regenerating Calendar Events with Full Connections\n');

  try {
    // Step 1: Delete ALL existing events
    console.log('Step 1: Deleting all existing events...');
    const eventsSnapshot = await db.collection('events')
      .where('familyId', '==', familyId)
      .get();

    console.log('  Found ' + eventsSnapshot.size + ' events to delete');

    let deleteCount = 0;
    for (const doc of eventsSnapshot.docs) {
      await doc.ref.delete();
      deleteCount++;
      if (deleteCount % 100 === 0) {
        console.log('  Deleted ' + deleteCount + '...');
      }
    }
    console.log('  ✅ Deleted ' + deleteCount + ' events\n');

    // Step 2: Create contacts
    console.log('Step 2: Creating contacts...');
    const contactIds = {};
    for (const eventType of eventTypes) {
      if (!eventType.contact || !eventType.contact.email) continue;

      const contactName = eventType.contact.name;
      if (contactIds[contactName]) continue; // Already created

      const existingSnapshot = await db.collection('familyContacts')
        .where('familyId', '==', familyId)
        .where('name', '==', contactName)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        contactIds[contactName] = existingSnapshot.docs[0].id;
        console.log('  Contact already exists: ' + contactName);
        continue;
      }

      const contactRef = await db.collection('familyContacts').add({
        familyId,
        name: contactName,
        role: eventType.contact.role,
        phone: eventType.contact.phone,
        email: eventType.contact.email,
        type: eventType.contact.category === 'Sports' ? 'service' : 'education',
        category: eventType.contact.category,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        source: 'manual',
        status: 'active',
        tags: [eventType.contact.category.toLowerCase()]
      });

      contactIds[contactName] = contactRef.id;
      console.log('  Created contact: ' + contactName);
    }
    console.log('  ✅ Created ' + Object.keys(contactIds).length + ' contacts\n');

    // Step 3: Generate events for the year
    console.log('Step 3: Generating events with connections for 2025...');

    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');

    let totalEvents = 0;
    let totalEmails = 0;
    let totalSMS = 0;
    let totalTasks = 0;

    for (const eventType of eventTypes) {
      console.log('  Generating: ' + eventType.title + '...');

      let currentDate = new Date(startDate);
      let eventCount = 0;

      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();

        // Check if this event should occur on this day
        let shouldCreate = false;
        if (eventType.frequency === 'daily') {
          shouldCreate = true;
        } else if (eventType.frequency === 'weekly' && eventType.dayOfWeek === dayOfWeek) {
          shouldCreate = true;
        }

        if (shouldCreate) {
          // Parse time
          const timeParts = eventType.time.split(':');
          const eventDateTime = new Date(currentDate);
          eventDateTime.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);

          const endDateTime = new Date(eventDateTime);
          endDateTime.setMinutes(endDateTime.getMinutes() + eventType.duration);

          // Create source email/SMS (only for first occurrence)
          let sourceEmailId = null;
          let sourceSMSId = null;

          if (eventCount === 0) {
            if (eventType.sourceEmail) {
              const emailRef = await db.collection('emailInbox').add({
                familyId,
                from: eventType.sourceEmail.from,
                subject: eventType.sourceEmail.subject,
                body: eventType.sourceEmail.body,
                content: eventType.sourceEmail.body,
                receivedAt: admin.firestore.Timestamp.fromDate(new Date(eventDateTime.getTime() - 7 * 24 * 60 * 60 * 1000)), // 1 week before
                status: 'processed',
                source: 'manual',
                aiAnalysis: {
                  summary: eventType.sourceEmail.subject,
                  category: 'event',
                  processed: true
                },
                processedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              sourceEmailId = emailRef.id;
              totalEmails++;
            }

            if (eventType.sourceSMS) {
              const smsRef = await db.collection('smsInbox').add({
                familyId,
                from: eventType.sourceSMS.from,
                body: eventType.sourceSMS.body,
                content: eventType.sourceSMS.body,
                receivedAt: admin.firestore.Timestamp.fromDate(new Date(eventDateTime.getTime() - 7 * 24 * 60 * 60 * 1000)),
                status: 'processed',
                source: 'manual',
                aiAnalysis: {
                  summary: 'Text message about ' + eventType.title,
                  category: 'event',
                  processed: true
                },
                processedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              sourceSMSId = smsRef.id;
              totalSMS++;
            }
          }

          // Create event (Neo4j compatible structure)
          const eventData = {
            familyId,
            userId: eventType.attendees[0], // Primary attendee for queries
            title: eventType.title,
            description: eventType.description || '',
            location: eventType.location || '',
            startTime: admin.firestore.Timestamp.fromDate(eventDateTime), // Neo4j sync uses startTime
            endTime: admin.firestore.Timestamp.fromDate(endDateTime), // Neo4j sync uses endTime
            startDate: eventDateTime.toISOString(), // Legacy field
            endDate: endDateTime.toISOString(), // Legacy field
            allDay: false,
            attendees: eventType.attendees,
            color: eventType.color || 'blue',
            status: 'active', // CRITICAL: CalendarServiceV2 filters by status
            source: sourceEmailId ? 'email' : (sourceSMSId ? 'sms' : 'manual'),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            reminders: [{ minutes: 60, method: 'notification' }],
            // Linked entities
            relatedContacts: eventType.contact && contactIds[eventType.contact.name] ? [contactIds[eventType.contact.name]] : [],
            relatedTasks: [],
            relatedEmails: sourceEmailId ? [sourceEmailId] : [],
            relatedSMS: sourceSMSId ? [sourceSMSId] : [],
            sourceEmail: sourceEmailId || null,
            sourceSMS: sourceSMSId || null
          };

          const eventRef = await db.collection('events').add(eventData);

          // Create related tasks (only for first few occurrences)
          if (eventType.relatedTasks && eventCount < 10) {
            for (const taskTemplate of eventType.relatedTasks) {
              const taskDueDate = new Date(eventDateTime);
              taskDueDate.setDate(taskDueDate.getDate() + taskTemplate.dueOffset);

              await db.collection('kanbanTasks').add({
                familyId,
                userId: taskTemplate.assignedTo,
                title: taskTemplate.title,
                description: 'Related to: ' + eventType.title,
                column: 'todo',
                priority: 'medium',
                dueDate: admin.firestore.Timestamp.fromDate(taskDueDate),
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                relatedEventId: eventRef.id,
                tags: ['event-related']
              });

              totalTasks++;
            }
          }

          eventCount++;
          totalEvents++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log('    Created ' + eventCount + ' occurrences');
    }

    console.log('\n✅ Event regeneration complete!');
    console.log('\nSummary:');
    console.log('  📅 Events: ' + totalEvents);
    console.log('  📧 Source Emails: ' + totalEmails);
    console.log('  📱 Source SMS: ' + totalSMS);
    console.log('  ✅ Related Tasks: ' + totalTasks);
    console.log('  👥 Contacts: ' + Object.keys(contactIds).length);

    console.log('\n🔗 All events now have:');
    console.log('  - Attendees (family members)');
    console.log('  - Locations and descriptions');
    console.log('  - Linked contacts');
    console.log('  - Source emails/SMS');
    console.log('  - Related tasks');
    console.log('  - Neo4j-compatible structure');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

regenerateConnectedEvents();
