const admin = require('firebase-admin');
const { Timestamp, FieldValue } = require('firebase-admin/firestore');
const path = require('path');

// Initialize admin if not already done
if (!admin.apps.length) {
  const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    projectId: 'parentload-ba995'
  });
}

const db = admin.firestore();

// Family configuration
const familyId = 'palsson_family_simulation';
const familyMembers = [
  { id: 'stefan_palsson_agent', name: 'Stefan', role: 'parent', email: 'stefan@gmail.com', phone: '+14155551001' },
  { id: 'kimberly_palsson_agent', name: 'Kimberly', role: 'parent', email: 'kimberly@gmail.com', phone: '+14155551002' },
  { id: 'lillian_palsson_agent', name: 'Lillian', role: 'child', age: 15 },
  { id: 'oly_palsson_agent', name: 'Oly', role: 'child', age: 11 },
  { id: 'tegner_palsson_agent', name: 'Tegner', role: 'child', age: 8 }
];

// Contact database (100 contacts: babysitters, doctors, dentists, coaches, tutors, friends, relatives)
const contactsDatabase = [
  // Medical professionals
  { name: 'Dr. Sarah Johnson', category: 'Medical', role: 'Pediatrician', phone: '+14155552001', email: 'sjohnson@childrenshealth.org', address: '123 Health Plaza, San Francisco, CA' },
  { name: 'Dr. Michael Chen', category: 'Medical', role: 'Dentist', phone: '+14155552002', email: 'mchen@familydental.com', address: '456 Smile Ave, San Francisco, CA' },
  { name: 'Dr. Emily Rodriguez', category: 'Medical', role: 'Orthodontist', phone: '+14155552003', email: 'erodriguez@straightsmiles.com', address: '789 Braces Blvd, San Francisco, CA' },
  { name: 'Dr. James Wilson', category: 'Medical', role: 'Allergist', phone: '+14155552004', email: 'jwilson@allergycare.org', address: '234 Wellness Dr, San Francisco, CA' },
  { name: 'Dr. Lisa Park', category: 'Medical', role: 'Therapist', phone: '+14155552005', email: 'lpark@familytherapy.com', address: '567 Mindful Way, San Francisco, CA' },
  { name: 'Dr. Robert Martinez', category: 'Medical', role: 'Dermatologist', phone: '+14155552006', email: 'rmartinez@skincare.com', address: '890 Clear Skin Rd, San Francisco, CA' },

  // Schools
  { name: 'Principal Anderson', category: 'School', role: 'School Principal', phone: '+14155552010', email: 'j.anderson@lincolnelementary.edu', address: 'Lincoln Elementary School, 100 Learning Way, San Francisco, CA' },
  { name: 'Mrs. Thompson', category: 'School', role: 'Teacher - 3rd Grade', phone: '+14155552011', email: 'a.thompson@lincolnelementary.edu', address: 'Lincoln Elementary School' },
  { name: 'Mr. Garcia', category: 'School', role: 'Teacher - 6th Grade', phone: '+14155552012', email: 'm.garcia@lincolnelementary.edu', address: 'Lincoln Elementary School' },
  { name: 'Ms. Kim', category: 'School', role: 'Teacher - 9th Grade', phone: '+14155552013', email: 's.kim@lincolnhigh.edu', address: 'Lincoln High School, 200 Academic Ave, San Francisco, CA' },
  { name: 'Mr. Davis', category: 'School', role: 'School Counselor', phone: '+14155552014', email: 'r.davis@lincolnhigh.edu', address: 'Lincoln High School' },
  { name: 'Mrs. Foster', category: 'School', role: 'Special Ed Coordinator', phone: '+14155552015', email: 'l.foster@lincolnelementary.edu', address: 'Lincoln Elementary School' },

  // Coaches
  { name: 'Coach Ryan', category: 'Sports', role: 'Soccer Coach', phone: '+14155552020', email: 'coach.ryan@sfyouthsoccer.org', address: 'Golden Gate Park Field 3' },
  { name: 'Coach Martinez', category: 'Sports', role: 'Basketball Coach', phone: '+14155552021', email: 'j.martinez@ymca.org', address: 'YMCA Sports Center, 300 Fitness Ln, San Francisco, CA' },
  { name: 'Coach Williams', category: 'Sports', role: 'Swimming Instructor', phone: '+14155552022', email: 'b.williams@swimclub.org', address: 'Aquatic Center, 400 Pool Dr, San Francisco, CA' },
  { name: 'Coach Taylor', category: 'Sports', role: 'Baseball Coach', phone: '+14155552023', email: 'c.taylor@littleleague.org', address: 'Marina Fields' },
  { name: 'Coach Brown', category: 'Sports', role: 'Dance Instructor', phone: '+14155552024', email: 's.brown@dancestudio.com', address: 'Creative Movement Studio, 500 Dance Way, San Francisco, CA' },
  { name: 'Sensei Tanaka', category: 'Sports', role: 'Karate Instructor', phone: '+14155552025', email: 'k.tanaka@martialarts.com', address: '600 Discipline Dr, San Francisco, CA' },

  // Tutors
  { name: 'Amanda Lee', category: 'Education', role: 'Math Tutor', phone: '+14155552030', email: 'amanda.lee@tutoring.com', address: '700 Study St, San Francisco, CA' },
  { name: 'Brian Murphy', category: 'Education', role: 'Science Tutor', phone: '+14155552031', email: 'b.murphy@tutoring.com', address: '800 Knowledge Ave, San Francisco, CA' },
  { name: 'Carla Nguyen', category: 'Education', role: 'Reading Specialist', phone: '+14155552032', email: 'c.nguyen@literacy.org', address: '900 Book Blvd, San Francisco, CA' },
  { name: 'David Cohen', category: 'Education', role: 'Piano Teacher', phone: '+14155552033', email: 'd.cohen@musiclessons.com', address: '1000 Melody Ln, San Francisco, CA' },
  { name: 'Emily Zhang', category: 'Education', role: 'Art Teacher', phone: '+14155552034', email: 'e.zhang@artstudio.com', address: '1100 Creative Ct, San Francisco, CA' },
  { name: 'Frank Roberts', category: 'Education', role: 'SAT Prep', phone: '+14155552035', email: 'f.roberts@testprep.com', address: '1200 College Rd, San Francisco, CA' },

  // Babysitters & Childcare
  { name: 'Jessica Miller', category: 'Childcare', role: 'Babysitter', phone: '+14155552040', email: 'j.miller@babysitters.com', address: '1300 Care Circle, San Francisco, CA' },
  { name: 'Katie Johnson', category: 'Childcare', role: 'Nanny', phone: '+14155552041', email: 'k.johnson@nannies.org', address: '1400 Helper Way, San Francisco, CA' },
  { name: 'Lauren Davis', category: 'Childcare', role: 'Au Pair', phone: '+14155552042', email: 'l.davis@aupair.com', address: '1500 Family Ave, San Francisco, CA' },
  { name: 'Morgan Anderson', category: 'Childcare', role: 'After School Care', phone: '+14155552043', email: 'm.anderson@afterschool.org', address: 'Community Center, 1600 Kids Ln, San Francisco, CA' },
  { name: 'Nicole Wilson', category: 'Childcare', role: 'Overnight Sitter', phone: '+14155552044', email: 'n.wilson@overnightsitters.com', address: '1700 Trustworthy Terrace, San Francisco, CA' },

  // Family Friends
  { name: 'The Smith Family', category: 'Friends', role: 'Family Friends', phone: '+14155552050', email: 'smith.family@gmail.com', address: '1800 Friendship Dr, San Francisco, CA' },
  { name: 'The Jones Family', category: 'Friends', role: 'Family Friends', phone: '+14155552051', email: 'jones.family@gmail.com', address: '1900 Neighbor Ln, San Francisco, CA' },
  { name: 'The Garcia Family', category: 'Friends', role: 'School Friends', phone: '+14155552052', email: 'garcia.family@gmail.com', address: '2000 Playdate St, San Francisco, CA' },
  { name: 'The Chen Family', category: 'Friends', role: 'Soccer Team', phone: '+14155552053', email: 'chen.family@gmail.com', address: '2100 Sports Circle, San Francisco, CA' },
  { name: 'The Martinez Family', category: 'Friends', role: 'Neighbors', phone: '+14155552054', email: 'martinez.family@gmail.com', address: '2200 Block Party Blvd, San Francisco, CA' },

  // Extended Family
  { name: 'Grandma Patricia', category: 'Family', role: 'Grandmother (Stefan\'s mom)', phone: '+14155552060', email: 'patricia.palsson@gmail.com', address: '2300 Legacy Ln, Oakland, CA' },
  { name: 'Grandpa Robert', category: 'Family', role: 'Grandfather (Stefan\'s dad)', phone: '+14155552061', email: 'robert.palsson@gmail.com', address: '2300 Legacy Ln, Oakland, CA' },
  { name: 'Grandma Helen', category: 'Family', role: 'Grandmother (Kimberly\'s mom)', phone: '+14155552062', email: 'helen.rodriguez@gmail.com', address: '2400 Memory Rd, San Jose, CA' },
  { name: 'Grandpa William', category: 'Family', role: 'Grandfather (Kimberly\'s dad)', phone: '+14155552063', email: 'william.rodriguez@gmail.com', address: '2400 Memory Rd, San Jose, CA' },
  { name: 'Uncle Marcus', category: 'Family', role: 'Uncle (Stefan\'s brother)', phone: '+14155552064', email: 'marcus.palsson@gmail.com', address: '2500 Sibling St, Berkeley, CA' },
  { name: 'Aunt Rebecca', category: 'Family', role: 'Aunt (Kimberly\'s sister)', phone: '+14155552065', email: 'rebecca.martinez@gmail.com', address: '2600 Auntie Ave, Palo Alto, CA' },

  // Service Providers
  { name: 'Sarah\'s Hair Salon', category: 'Services', role: 'Hair Stylist', phone: '+14155552070', email: 'info@sarahshair.com', address: '2700 Beauty Blvd, San Francisco, CA' },
  { name: 'Tom\'s Auto Repair', category: 'Services', role: 'Mechanic', phone: '+14155552071', email: 'tom@autorepair.com', address: '2800 Garage Way, San Francisco, CA' },
  { name: 'Green Thumb Landscaping', category: 'Services', role: 'Lawn Care', phone: '+14155552072', email: 'info@greenthumb.com', address: '2900 Mower Ln, San Francisco, CA' },
  { name: 'Sparkle Clean', category: 'Services', role: 'House Cleaning', phone: '+14155552073', email: 'booking@sparkleclean.com', address: '3000 Tidy Terrace, San Francisco, CA' },
  { name: 'Pet Paradise Vet', category: 'Services', role: 'Veterinarian', phone: '+14155552074', email: 'dr.adams@petparadise.com', address: '3100 Animal Ave, San Francisco, CA' },

  // Additional contacts (padding to 50 - we'll add more variations of above categories)
  { name: 'Dr. Alex Turner', category: 'Medical', role: 'Eye Doctor', phone: '+14155552075', email: 'a.turner@visioncare.com', address: '3200 Sight St, San Francisco, CA' },
  { name: 'Dr. Maya Patel', category: 'Medical', role: 'Physical Therapist', phone: '+14155552076', email: 'm.patel@physicaltherapy.com', address: '3300 Movement Way, San Francisco, CA' },
  { name: 'Coach Anderson', category: 'Sports', role: 'Tennis Coach', phone: '+14155552077', email: 'l.anderson@tennisclub.org', address: '3400 Court Dr, San Francisco, CA' },
  { name: 'Mrs. Bennett', category: 'School', role: 'Librarian', phone: '+14155552078', email: 'p.bennett@lincolnelementary.edu', address: 'Lincoln Elementary School' },
  { name: 'Mr. Cooper', category: 'School', role: 'PE Teacher', phone: '+14155552079', email: 'j.cooper@lincolnelementary.edu', address: 'Lincoln Elementary School' },
  { name: 'Dr. Nina Campbell', category: 'Medical', role: 'ENT Specialist', phone: '+14155552080', email: 'n.campbell@entcare.com', address: '3500 Hearing Ln, San Francisco, CA' },
  { name: 'Coach Rivera', category: 'Sports', role: 'Gymnastics Coach', phone: '+14155552081', email: 's.rivera@gymnastics.org', address: '3600 Flip Circle, San Francisco, CA' },
  { name: 'Grace Turner', category: 'Childcare', role: 'Summer Camp Director', phone: '+14155552082', email: 'g.turner@summercamp.org', address: '3700 Adventure Ave, San Francisco, CA' },
  { name: 'Noah Phillips', category: 'Education', role: 'Spanish Tutor', phone: '+14155552083', email: 'n.phillips@language.com', address: '3800 Linguistics Ln, San Francisco, CA' },
  { name: 'Olivia Barnes', category: 'Childcare', role: 'Date Night Sitter', phone: '+14155552084', email: 'o.barnes@sitters.com', address: '3900 Reliable Rd, San Francisco, CA' }
];

// Extend to 100 contacts with more realistic variations
const extendedContacts = [...contactsDatabase];
const categories = ['Medical', 'School', 'Sports', 'Education', 'Childcare', 'Friends', 'Family', 'Services'];
const basePhoneNumber = 14155552085;

for (let i = extendedContacts.length; i < 100; i++) {
  const category = categories[i % categories.length];
  const rolesByCategory = {
    'Medical': ['Specialist', 'Nurse Practitioner', 'Nutritionist', 'Chiropractor'],
    'School': ['Assistant Principal', 'Music Teacher', 'Art Teacher', 'Technology Coordinator'],
    'Sports': ['Track Coach', 'Volleyball Coach', 'Golf Instructor', 'Yoga Teacher'],
    'Education': ['Chemistry Tutor', 'History Tutor', 'English Tutor', 'Coding Instructor'],
    'Childcare': ['Weekend Sitter', 'Emergency Contact', 'Carpool Helper', 'Study Buddy Parent'],
    'Friends': ['Playdate Family', 'Sports Team Parent', 'Class Parent', 'Birthday Party Friend'],
    'Family': ['Cousin', 'Second Cousin', 'Great Aunt', 'Family Friend'],
    'Services': ['Plumber', 'Electrician', 'Painter', 'Handyman']
  };

  const firstName = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn'][i % 8];
  const lastName = ['Anderson', 'Brown', 'Clark', 'Davis', 'Evans', 'Foster', 'Green', 'Harris'][i % 8];
  const role = rolesByCategory[category][Math.floor(i / 8) % rolesByCategory[category].length];

  extendedContacts.push({
    name: `${firstName} ${lastName}`,
    category,
    role,
    phone: `+1${basePhoneNumber + i}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${category.toLowerCase()}.com`,
    address: `${(i + 1) * 100} ${category} St, San Francisco, CA`
  });
}

console.log(`✅ Generated ${extendedContacts.length} contacts`);

// Email templates
function generateEmails() {
  const emails = [];
  const senders = [
    ...extendedContacts.filter(c => c.category === 'Medical'),
    ...extendedContacts.filter(c => c.category === 'School'),
    ...extendedContacts.filter(c => c.category === 'Sports'),
    ...extendedContacts.filter(c => c.category === 'Education')
  ];

  const templates = [
    // Medical appointments
    {
      subject: 'Appointment Reminder - {child} Annual Checkup',
      content: 'Hi {parent},\n\nThis is a reminder that {child} has an annual checkup scheduled for {date} at {time} with {doctor}.\n\nPlease arrive 10 minutes early to complete any necessary paperwork.\n\nLocation: {address}\n\nIf you need to reschedule, please call us at {phone}.\n\nBest regards,\n{senderName}\n{role}',
      category: 'Medical',
      type: 'appointment',
      daysOut: [3, 7, 14, 21]
    },
    {
      subject: 'Vaccination Records - {child}',
      content: 'Dear {parent},\n\n{child}\'s vaccination records have been updated. Please find attached the updated immunization record.\n\nNext recommended vaccines:\n- Flu shot: October\n- Tdap booster: Age 11-12\n\nPlease keep this record for school registration.\n\nThank you,\n{senderName}',
      category: 'Medical',
      type: 'medical_records'
    },
    // School communications
    {
      subject: 'Field Trip Permission Slip - {child}',
      content: 'Dear Families,\n\n{child}\'s class will be taking a field trip to the Science Museum on {date}. We will depart at 9:00 AM and return by 2:30 PM.\n\nCost: $15 per student (includes admission and transportation)\nLunch: Students should bring a packed lunch\n\nPlease sign and return the attached permission slip by {deadlineDate}.\n\nWe need 3 parent chaperones. If interested, please email me.\n\nBest regards,\n{senderName}\n{role}',
      category: 'School',
      type: 'permission',
      daysOut: [10, 15, 20]
    },
    {
      subject: 'Parent-Teacher Conference - {child}',
      content: 'Hello {parent},\n\nI would like to schedule a parent-teacher conference to discuss {child}\'s progress this semester.\n\nAvailable time slots:\n- {date} at 3:00 PM\n- {date} at 3:30 PM\n- {date} at 4:00 PM\n\nPlease reply with your preferred time.\n\nLooking forward to meeting with you!\n\n{senderName}\n{role}',
      category: 'School',
      type: 'meeting',
      daysOut: [5, 7, 10]
    },
    // Sports activities
    {
      subject: 'Soccer Practice Schedule - Spring Season',
      content: 'Hi Team!\n\nHere is the practice schedule for the spring soccer season:\n\nPractice Times:\n- Tuesdays: 4:00-5:30 PM\n- Thursdays: 4:00-5:30 PM\n- Saturdays: 9:00-10:30 AM\n\nLocation: Golden Gate Park Field 3\n\nFirst practice: {date}\n\nPlease bring:\n- Cleats\n- Shin guards\n- Water bottle\n- Soccer ball (for first practice)\n\nLooking forward to a great season!\n\nCoach {senderName}',
      category: 'Sports',
      type: 'schedule'
    },
    {
      subject: 'Game This Saturday - {child}',
      content: 'Team Parents,\n\n{child}\'s team has a game this Saturday!\n\nDate: {date}\nTime: {time}\nLocation: Marina Fields\nOpponent: Eagles\n\nPlease arrive 15 minutes early for warm-up.\n\nWe need volunteers for:\n- Snack duty (bring oranges and water)\n- Setup/cleanup\n\nGo Team!\n\nCoach {senderName}',
      category: 'Sports',
      type: 'event',
      daysOut: [3]
    },
    // Activities & lessons
    {
      subject: 'Piano Recital - {child}',
      content: 'Dear Parents,\n\n{child} will be performing in our spring piano recital!\n\nDate: {date}\nTime: {time}\nLocation: {address}\n\n{child} will be playing:\n1. \"Für Elise\" by Beethoven\n2. \"Canon in D\" by Pachelbel\n\nPlease arrive 10 minutes early. The recital will last approximately 90 minutes.\n\nFamily and friends are welcome!\n\nMusically yours,\n{senderName}\n{role}',
      category: 'Education',
      type: 'event',
      daysOut: [14, 21]
    },
    // Birthday parties
    {
      subject: 'Birthday Party Invitation - {friend}',
      content: 'You\'re invited to {friend}\'s birthday party!\n\nDate: {date}\nTime: {time}\nLocation: {address}\n\nTheme: Superhero Adventure\n\nPlease RSVP by {deadlineDate} to {phone}\n\nLooking forward to celebrating together!\n\nThe {lastName} Family',
      category: 'Friends',
      type: 'invitation',
      daysOut: [7, 14]
    }
  ];

  // Generate 100 emails
  const startDate = new Date('2025-01-01');
  for (let i = 0; i < 100; i++) {
    const template = templates[i % templates.length];
    const sender = senders[i % senders.length];
    const child = familyMembers[2 + (i % 3)]; // Rotate through children
    const parent = familyMembers[i % 2]; // Rotate between parents

    // Calculate email date (spread over past 6 months)
    const daysAgo = Math.floor((i / 100) * 180); // 180 days = 6 months
    const emailDate = new Date(startDate);
    emailDate.setDate(emailDate.getDate() + daysAgo);

    // Calculate event date (future from email date)
    const daysOut = template.daysOut ? template.daysOut[i % template.daysOut.length] : 7;
    const eventDate = new Date(emailDate);
    eventDate.setDate(eventDate.getDate() + daysOut);

    const deadlineDate = new Date(eventDate);
    deadlineDate.setDate(deadlineDate.getDate() - 3);

    // Replace placeholders
    let content = template.content
      .replace(/{child}/g, child.name)
      .replace(/{parent}/g, parent.name)
      .replace(/{senderName}/g, sender.name)
      .replace(/{role}/g, sender.role)
      .replace(/{doctor}/g, sender.name)
      .replace(/{address}/g, sender.address)
      .replace(/{phone}/g, sender.phone)
      .replace(/{friend}/g, extendedContacts[i % extendedContacts.length].name)
      .replace(/{lastName}/g, sender.name.split(' ')[1]);

    let subject = template.subject
      .replace(/{child}/g, child.name)
      .replace(/{friend}/g, extendedContacts[i % extendedContacts.length].name);

    // Replace dates
    content = content
      .replace(/{date}/g, eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
      .replace(/{time}/g, `${(i % 5) + 2}:00 PM`)
      .replace(/{deadlineDate}/g, deadlineDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }));

    emails.push({
      id: `email_${i + 1}`,
      familyId,
      from: sender.email,
      fromName: sender.name,
      to: `family-${familyId.substring(0, 8)}@families.checkallie.com`,
      subject,
      content: { text: content },
      receivedAt: Timestamp.fromDate(emailDate),
      status: 'pending',
      source: 'email',
      metadata: {
        senderCategory: sender.category,
        senderRole: sender.role,
        senderPhone: sender.phone,
        relatedChild: child.name,
        templateType: template.type
      }
    });
  }

  return emails;
}

// SMS templates
function generateSMS() {
  const messages = [];
  const senders = [
    ...extendedContacts.filter(c => ['Medical', 'School', 'Sports', 'Childcare', 'Friends'].includes(c.category))
  ];

  const templates = [
    'Reminder: {child} has an appointment with {senderName} tomorrow at {time}. Reply CONFIRM to confirm.',
    'Hi! This is {senderName}. Can {child} come to a playdate on Saturday at {time}? Reply YES or NO.',
    'Practice cancelled today due to rain. Make-up practice scheduled for {date} at {time}. -Coach {lastName}',
    '{child} left their backpack at school today. Will hold in office. -{senderName}',
    'Quick question: Is {child} available for a birthday party on {date}? Text back when you can! -{firstName}',
    'Appointment confirmed for {child} on {date} at {time} with {senderName}. Reply CANCEL to cancel.',
    'School picture day is tomorrow! Don\'t forget to dress {child} in their best. -{senderName}',
    'Hi, it\'s {senderName}. Would you like me to pick up {child} from soccer practice today? LMK!',
    'Snack schedule reminder: You\'re signed up for team snacks on {date}. Thanks! -Coach',
    'Hey! {firstName} here. Can {child} join us for dinner tonight? Around {time}?',
    'Field trip money due by Friday. $15 cash or check made out to Lincoln Elementary. Thanks! -{senderName}',
    'Your library books are overdue. Please return by {date} to avoid late fees. -{senderName}',
    'Great news! {child} earned student of the month! Certificate will be mailed home. -{senderName}',
    'Homework assignment: Read chapters 5-7 and complete worksheet by Monday. -{senderName}',
    'Don\'t forget {child} has a dentist appointment on {date} at {time}. See you then! -{senderName}',
    'Weather looks good for Saturday\'s game! See you at {time} at Marina Fields. -Coach {lastName}',
    'Can you bring extra water bottles to practice today? We\'re running low. Thanks! -{firstName}',
    'FYI - School will dismiss 2 hours early on Friday for teacher training. -{senderName}',
    'Hi! Would {child} like to join our carpool this week? M/W/F mornings. -{firstName}',
    'Reminder to bring science project materials tomorrow. List was sent home last week. -{senderName}'
  ];

  const startDate = new Date('2025-01-01');
  for (let i = 0; i < 100; i++) {
    const sender = senders[i % senders.length];
    const child = familyMembers[2 + (i % 3)];
    const template = templates[i % templates.length];

    // Calculate SMS date (spread over past 6 months)
    const daysAgo = Math.floor((i / 100) * 180);
    const smsDate = new Date(startDate);
    smsDate.setDate(smsDate.getDate() + daysAgo);

    const eventDate = new Date(smsDate);
    eventDate.setDate(eventDate.getDate() + 3);

    // Replace placeholders
    const content = template
      .replace(/{child}/g, child.name)
      .replace(/{senderName}/g, sender.name)
      .replace(/{firstName}/g, sender.name.split(' ')[0])
      .replace(/{lastName}/g, sender.name.split(' ')[1])
      .replace(/{time}/g, `${(i % 5) + 2}:00 PM`)
      .replace(/{date}/g, eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

    messages.push({
      id: `sms_${i + 1}`,
      familyId,
      from: sender.phone,
      fromName: sender.name,
      to: familyMembers[i % 2].phone, // Alternate between parents
      content,
      body: content,
      receivedAt: Timestamp.fromDate(smsDate),
      status: 'pending',
      source: 'sms',
      hasMedia: false,
      metadata: {
        senderCategory: sender.category,
        senderRole: sender.role,
        relatedChild: child.name
      }
    });
  }

  return messages;
}

// Document templates
function generateDocuments() {
  const documents = [];
  const documentTypes = [
    { fileName: 'Soccer_Spring_Schedule_2025.pdf', title: 'Soccer Schedule Spring 2025', category: 'Sports', fileType: 'application/pdf', description: 'Complete schedule for spring soccer season including practice times, game dates, and tournament information.' },
    { fileName: 'School_Calendar_2024-2025.pdf', title: 'School Calendar 2024-2025', category: 'School', fileType: 'application/pdf', description: 'Annual school calendar with holidays, teacher work days, and important dates.' },
    { fileName: 'Medical_Records_Lillian.pdf', title: 'Medical Records - Lillian', category: 'Medical', fileType: 'application/pdf', description: 'Updated vaccination records and annual checkup results.' },
    { fileName: 'Dental_Xray_Results.pdf', title: 'Dental X-Ray Results - Oly', category: 'Medical', fileType: 'application/pdf', description: 'Dental x-rays showing cavity in molar #14.' },
    { fileName: 'Birthday_Party_Invitation.jpg', title: 'Birthday Party Invitation', category: 'Social', fileType: 'image/jpeg', description: 'Invitation to Emma\'s 10th birthday party at Chuck E. Cheese.' },
    { fileName: 'Field_Trip_Permission.pdf', title: 'Field Trip Permission Slip', category: 'School', fileType: 'application/pdf', description: 'Permission slip for Science Museum field trip on March 15.' },
    { fileName: 'Basketball_Tryouts.pdf', title: 'Basketball Tryout Schedule', category: 'Sports', fileType: 'application/pdf', description: 'Schedule for winter basketball tryouts and team selection process.' },
    { fileName: 'Piano_Recital_Program.pdf', title: 'Spring Piano Recital Program', category: 'Music', fileType: 'application/pdf', description: 'Program for annual spring piano recital featuring all students.' },
    { fileName: 'Report_Card_Q2.pdf', title: 'Report Card - Q2', category: 'School', fileType: 'application/pdf', description: 'Second quarter report card with grades and teacher comments.' },
    { fileName: 'Insurance_Card.jpg', title: 'Health Insurance Card', category: 'Medical', fileType: 'image/jpeg', description: 'Updated health insurance card front and back.' },
    { fileName: 'Summer_Camp_Brochure.pdf', title: 'Summer Camp 2025 Brochure', category: 'Activities', fileType: 'application/pdf', description: 'Information about summer camp programs, dates, and registration.' },
    { fileName: 'Medication_Authorization.pdf', title: 'School Medication Authorization', category: 'Medical', fileType: 'application/pdf', description: 'Authorization form for administering medication during school hours.' },
    { fileName: 'Art_Show_Flyer.jpg', title: 'Student Art Show', category: 'School', fileType: 'image/jpeg', description: 'Flyer for the annual student art exhibition.' },
    { fileName: 'Swimming_Lessons_Schedule.pdf', title: 'Swimming Lessons Spring 2025', category: 'Sports', fileType: 'application/pdf', description: 'Schedule and levels for spring swimming lessons.' },
    { fileName: 'Allergy_Action_Plan.pdf', title: 'Allergy Action Plan - Tegner', category: 'Medical', fileType: 'application/pdf', description: 'Emergency action plan for peanut allergy.' }
  ];

  const startDate = new Date('2025-01-01');

  // Generate 30 documents (not 100 as documents are usually less frequent)
  for (let i = 0; i < 30; i++) {
    const docTemplate = documentTypes[i % documentTypes.length];
    const child = familyMembers[2 + (i % 3)];

    const daysAgo = Math.floor((i / 30) * 180);
    const uploadDate = new Date(startDate);
    uploadDate.setDate(uploadDate.getDate() + daysAgo);

    documents.push({
      id: `doc_${i + 1}`,
      familyId,
      fileName: docTemplate.fileName.replace('.', `_${i + 1}.`),
      title: docTemplate.title,
      fileType: docTemplate.fileType,
      category: docTemplate.category,
      description: docTemplate.description,
      uploadedAt: Timestamp.fromDate(uploadDate),
      uploadedBy: familyMembers[i % 2].id,
      status: 'pending',
      source: 'upload',
      // Note: fileUrl removed - these are demo documents without actual files
      // Real documents uploaded by users will have fileUrl populated
      metadata: {
        relatedChild: child.name,
        documentType: docTemplate.category,
        isDemo: true // Mark as demo document
      }
    });
  }

  return documents;
}

// Main execution
async function generateInboxData() {
  console.log('📥 Generating family inbox data for Palsson family simulation...\n');

  try {
    let batch = db.batch();
    let batchCount = 0;
    const batchLimit = 500;

    // 1. Generate and save contacts
    console.log('👥 Generating 100 contacts...');
    const contactsRef = db.collection('familyContacts');
    for (let i = 0; i < extendedContacts.length; i++) {
      const contact = extendedContacts[i];
      const docRef = contactsRef.doc(`contact_${i + 1}`);

      batch.set(docRef, {
        ...contact,
        familyId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        source: 'manual',
        status: 'active',
        tags: [contact.category.toLowerCase(), contact.role.toLowerCase()]
      });

      batchCount++;
      if (batchCount >= batchLimit) {
        await batch.commit();
        console.log(`   ✅ Committed ${batchCount} contacts`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Committed final ${batchCount} contacts`);
    }
    console.log(`✅ ${extendedContacts.length} contacts created\n`);

    // 2. Generate and save emails
    console.log('📧 Generating 100 emails...');
    const emails = generateEmails();
    batch = db.batch();
    batchCount = 0;

    for (const email of emails) {
      const docRef = db.collection('emailInbox').doc(email.id);
      batch.set(docRef, email);

      batchCount++;
      if (batchCount >= batchLimit) {
        await batch.commit();
        console.log(`   ✅ Committed ${batchCount} emails`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Committed final ${batchCount} emails`);
    }
    console.log(`✅ ${emails.length} emails created\n`);

    // 3. Generate and save SMS
    console.log('📱 Generating 100 SMS messages...');
    const smsMessages = generateSMS();
    batch = db.batch();
    batchCount = 0;

    for (const sms of smsMessages) {
      const docRef = db.collection('smsInbox').doc(sms.id);
      batch.set(docRef, sms);

      batchCount++;
      if (batchCount >= batchLimit) {
        await batch.commit();
        console.log(`   ✅ Committed ${batchCount} SMS messages`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Committed final ${batchCount} SMS messages`);
    }
    console.log(`✅ ${smsMessages.length} SMS messages created\n`);

    // 4. Generate and save documents
    console.log('📄 Generating 30 documents...');
    const documents = generateDocuments();
    batch = db.batch();
    batchCount = 0;

    for (const doc of documents) {
      const docRef = db.collection('familyDocuments').doc(doc.id);
      batch.set(docRef, doc);

      batchCount++;
      if (batchCount >= batchLimit) {
        await batch.commit();
        console.log(`   ✅ Committed ${batchCount} documents`);
        batch = db.batch();
        batchCount = 0;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Committed final ${batchCount} documents`);
    }
    console.log(`✅ ${documents.length} documents created\n`);

    console.log('🎉 INBOX DATA GENERATION COMPLETE!\n');
    console.log('Summary:');
    console.log(`  👥 Contacts: ${extendedContacts.length}`);
    console.log(`  📧 Emails: ${emails.length}`);
    console.log(`  📱 SMS: ${smsMessages.length}`);
    console.log(`  📄 Documents: ${documents.length}`);
    console.log(`  📊 Total items: ${extendedContacts.length + emails.length + smsMessages.length + documents.length}`);
    console.log('\n✅ All data saved to Firestore');
    console.log('⏳ Items will auto-process with AI when loaded in the UI');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating inbox data:', error);
    process.exit(1);
  }
}

generateInboxData();
