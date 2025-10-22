#!/usr/bin/env node

/**
 * Family Seed Templates
 *
 * Reusable family archetypes based on Palsson Family simulation patterns
 * Use these templates to quickly create realistic demo families
 *
 * Usage:
 *   const { familyTemplates } = require('./seed-templates');
 *   const family = familyTemplates.busy_professional;
 */

const admin = require('firebase-admin');

/**
 * Family Templates
 * Each template represents a common family archetype
 */
const familyTemplates = {
  /**
   * Busy Professional Family
   * High-achieving parents with imbalanced mental load
   * Based on Stefan & Kimberly personality patterns
   */
  busy_professional: {
    familyName: 'Miller Family',
    description: 'Busy professional couple with 2 kids, high mental load on one parent',

    members: [
      {
        name: 'Sarah',
        role: 'parent',
        isParent: true,
        age: 38,
        email: 'sarah@millerfamily.com',
        phone: '+14155552001',
        avatar: '👩',

        // High awareness, high mental load (like Kimberly)
        personality: {
          helpfulness: 0.90,
          awareness: 0.85,
          followThrough: 0.95,
          initiative: 0.80
        },
        mentalLoad: 0.82,
        taskCreationRate: 0.70
      },
      {
        name: 'Michael',
        role: 'parent',
        isParent: true,
        age: 40,
        email: 'michael@millerfamily.com',
        phone: '+14155552002',
        avatar: '👨',

        // Lower awareness, lower mental load (like Stefan at start)
        personality: {
          helpfulness: 0.75,
          awareness: 0.40,
          followThrough: 0.90,
          initiative: 0.50
        },
        mentalLoad: 0.35,
        taskCreationRate: 0.20
      },
      {
        name: 'Emma',
        role: 'child',
        isParent: false,
        age: 14,
        avatar: '👧',

        personality: {
          helpfulness: 0.60,
          awareness: 0.50,
          followThrough: 0.70,
          initiative: 0.55
        }
      },
      {
        name: 'Noah',
        role: 'child',
        isParent: false,
        age: 11,
        avatar: '🧒',

        personality: {
          helpfulness: 0.65,
          awareness: 0.55,
          followThrough: 0.60,
          initiative: 0.70
        }
      }
    ],

    // Typical events for busy professional family (50 annual events)
    eventTemplates: [
      // Medical
      { title: 'Emma Annual Checkup', category: 'Medical', duration: 60, frequency: 'yearly' },
      { title: 'Noah Annual Checkup', category: 'Medical', duration: 60, frequency: 'yearly' },
      { title: 'Dentist - Emma', category: 'Medical', duration: 60, frequency: 'biannual' },
      { title: 'Dentist - Noah', category: 'Medical', duration: 60, frequency: 'biannual' },

      // School
      { title: 'Parent-Teacher Conference', category: 'School', duration: 30, frequency: 'quarterly' },
      { title: 'School Play Performance', category: 'School', duration: 120, frequency: 'yearly' },
      { title: 'Back to School Night', category: 'School', duration: 90, frequency: 'yearly' },

      // Sports/Activities
      { title: 'Emma Soccer Practice', category: 'Sports', duration: 90, frequency: 'weekly' },
      { title: 'Noah Piano Lesson', category: 'Education', duration: 60, frequency: 'weekly' }
    ],

    // Essential contacts (20 contacts)
    contactTemplates: [
      // Medical
      { name: 'Dr. Jennifer Smith', category: 'Medical', role: 'Pediatrician', phone: '+14155553001' },
      { name: 'Dr. David Chen', category: 'Medical', role: 'Dentist', phone: '+14155553002' },

      // School
      { name: 'Ms. Anderson', category: 'School', role: 'Emma\'s Teacher', phone: '+14155553010' },
      { name: 'Mr. Rodriguez', category: 'School', role: 'Noah\'s Teacher', phone: '+14155553011' },

      // Activities
      { name: 'Coach Martinez', category: 'Sports', role: 'Soccer Coach', phone: '+14155553020' },
      { name: 'Ms. Williams', category: 'Education', role: 'Piano Teacher', phone: '+14155553021' }
    ]
  },

  /**
   * Single Parent Family
   * Single mom with 3 kids, very high mental load
   */
  single_parent: {
    familyName: 'Rodriguez Family',
    description: 'Single parent household with 3 children, maximum mental load',

    members: [
      {
        name: 'Maria',
        role: 'parent',
        isParent: true,
        age: 35,
        email: 'maria@rodriguezfamily.com',
        phone: '+14155554001',
        avatar: '👩',

        // Maximum awareness and mental load
        personality: {
          helpfulness: 1.00,
          awareness: 0.98,
          followThrough: 1.00,
          initiative: 0.95
        },
        mentalLoad: 0.95,
        taskCreationRate: 0.90
      },
      {
        name: 'Sofia',
        role: 'child',
        isParent: false,
        age: 15,
        avatar: '👧',

        // Helpful older sibling
        personality: {
          helpfulness: 0.80,
          awareness: 0.70,
          followThrough: 0.75,
          initiative: 0.65
        }
      },
      {
        name: 'Diego',
        role: 'child',
        isParent: false,
        age: 12,
        avatar: '🧒',

        personality: {
          helpfulness: 0.60,
          awareness: 0.50,
          followThrough: 0.65,
          initiative: 0.55
        }
      },
      {
        name: 'Luna',
        role: 'child',
        isParent: false,
        age: 8,
        avatar: '👧',

        personality: {
          helpfulness: 0.50,
          awareness: 0.40,
          followThrough: 0.55,
          initiative: 0.45
        }
      }
    ],

    eventTemplates: [
      // More medical appointments (single parent = all coordination)
      { title: 'Sofia Annual Checkup', category: 'Medical', duration: 60, frequency: 'yearly' },
      { title: 'Diego Annual Checkup', category: 'Medical', duration: 60, frequency: 'yearly' },
      { title: 'Luna Annual Checkup', category: 'Medical', duration: 60, frequency: 'yearly' },

      // School (3 kids = 3x events)
      { title: 'Sofia Parent-Teacher Conference', category: 'School', duration: 30, frequency: 'quarterly' },
      { title: 'Diego Parent-Teacher Conference', category: 'School', duration: 30, frequency: 'quarterly' },
      { title: 'Luna Parent-Teacher Conference', category: 'School', duration: 30, frequency: 'quarterly' }
    ],

    contactTemplates: [
      { name: 'Dr. Patel', category: 'Medical', role: 'Family Doctor', phone: '+14155554010' },
      { name: 'Ms. Thompson', category: 'School', role: 'Sofia\'s Teacher', phone: '+14155554020' },
      { name: 'Mr. Garcia', category: 'School', role: 'Diego\'s Teacher', phone: '+14155554021' },
      { name: 'Mrs. Lee', category: 'School', role: 'Luna\'s Teacher', phone: '+14155554022' },
      { name: 'Maria\'s Mom', category: 'Family', role: 'Grandmother', phone: '+14155554030' }
    ]
  },

  /**
   * Balanced Partnership Family
   * Equal mental load distribution, both parents aware
   */
  balanced_partnership: {
    familyName: 'Chen Family',
    description: 'Balanced partnership with equal mental load distribution',

    members: [
      {
        name: 'Alex',
        role: 'parent',
        isParent: true,
        age: 36,
        email: 'alex@chenfamily.com',
        phone: '+14155555001',
        avatar: '👨',

        // Balanced, high awareness
        personality: {
          helpfulness: 0.85,
          awareness: 0.80,
          followThrough: 0.88,
          initiative: 0.75
        },
        mentalLoad: 0.60,
        taskCreationRate: 0.55
      },
      {
        name: 'Jordan',
        role: 'parent',
        isParent: true,
        age: 37,
        email: 'jordan@chenfamily.com',
        phone: '+14155555002',
        avatar: '👩',

        // Also balanced, high awareness
        personality: {
          helpfulness: 0.82,
          awareness: 0.78,
          followThrough: 0.85,
          initiative: 0.72
        },
        mentalLoad: 0.58,
        taskCreationRate: 0.50
      },
      {
        name: 'Riley',
        role: 'child',
        isParent: false,
        age: 10,
        avatar: '🧒',

        personality: {
          helpfulness: 0.70,
          awareness: 0.65,
          followThrough: 0.68,
          initiative: 0.60
        }
      }
    ],

    eventTemplates: [
      { title: 'Riley Annual Checkup', category: 'Medical', duration: 60, frequency: 'yearly' },
      { title: 'Family Movie Night', category: 'Family', duration: 120, frequency: 'weekly' },
      { title: 'Date Night', category: 'Family', duration: 180, frequency: 'biweekly' },
      { title: 'Riley Swimming Lesson', category: 'Sports', duration: 60, frequency: 'weekly' }
    ],

    contactTemplates: [
      { name: 'Dr. Johnson', category: 'Medical', role: 'Pediatrician', phone: '+14155555010' },
      { name: 'Coach Kim', category: 'Sports', role: 'Swim Coach', phone: '+14155555020' },
      { name: 'Ms. Davis', category: 'School', role: 'Teacher', phone: '+14155555030' }
    ]
  },

  /**
   * Large Family
   * 2 parents + 4 kids, complex coordination needs
   */
  large_family: {
    familyName: 'Johnson Family',
    description: 'Large family with 4 kids, complex scheduling',

    members: [
      {
        name: 'David',
        role: 'parent',
        isParent: true,
        age: 42,
        email: 'david@johnsonfamily.com',
        phone: '+14155556001',
        avatar: '👨',

        personality: {
          helpfulness: 0.80,
          awareness: 0.65,
          followThrough: 0.85,
          initiative: 0.60
        },
        mentalLoad: 0.55,
        taskCreationRate: 0.40
      },
      {
        name: 'Rachel',
        role: 'parent',
        isParent: true,
        age: 40,
        email: 'rachel@johnsonfamily.com',
        phone: '+14155556002',
        avatar: '👩',

        personality: {
          helpfulness: 0.92,
          awareness: 0.88,
          followThrough: 0.93,
          initiative: 0.85
        },
        mentalLoad: 0.78,
        taskCreationRate: 0.75
      },
      {
        name: 'Olivia',
        role: 'child',
        isParent: false,
        age: 16,
        avatar: '👧',
        personality: { helpfulness: 0.75, awareness: 0.65, followThrough: 0.70, initiative: 0.60 }
      },
      {
        name: 'Ethan',
        role: 'child',
        isParent: false,
        age: 13,
        avatar: '🧒',
        personality: { helpfulness: 0.60, awareness: 0.50, followThrough: 0.65, initiative: 0.55 }
      },
      {
        name: 'Ava',
        role: 'child',
        isParent: false,
        age: 10,
        avatar: '👧',
        personality: { helpfulness: 0.65, awareness: 0.55, followThrough: 0.60, initiative: 0.50 }
      },
      {
        name: 'Lucas',
        role: 'child',
        isParent: false,
        age: 6,
        avatar: '🧒',
        personality: { helpfulness: 0.45, awareness: 0.35, followThrough: 0.50, initiative: 0.40 }
      }
    ],

    eventTemplates: [
      // 4 kids = 4x medical appointments
      { title: 'Olivia Annual Checkup', category: 'Medical', duration: 60, frequency: 'yearly' },
      { title: 'Ethan Annual Checkup', category: 'Medical', duration: 60, frequency: 'yearly' },
      { title: 'Ava Annual Checkup', category: 'Medical', duration: 60, frequency: 'yearly' },
      { title: 'Lucas Annual Checkup', category: 'Medical', duration: 60, frequency: 'yearly' },

      // Multiple activities
      { title: 'Olivia Volleyball Practice', category: 'Sports', duration: 120, frequency: 'weekly' },
      { title: 'Ethan Basketball Practice', category: 'Sports', duration: 90, frequency: 'weekly' },
      { title: 'Ava Dance Class', category: 'Sports', duration: 60, frequency: 'weekly' },
      { title: 'Lucas Soccer', category: 'Sports', duration: 60, frequency: 'weekly' }
    ],

    contactTemplates: [
      { name: 'Dr. Martinez', category: 'Medical', role: 'Family Doctor', phone: '+14155556010' },
      { name: 'Coach Williams', category: 'Sports', role: 'Volleyball Coach', phone: '+14155556020' },
      { name: 'Coach Brown', category: 'Sports', role: 'Basketball Coach', phone: '+14155556021' },
      { name: 'Ms. Taylor', category: 'Sports', role: 'Dance Instructor', phone: '+14155556022' },
      { name: 'Coach Anderson', category: 'Sports', role: 'Soccer Coach', phone: '+14155556023' }
    ]
  }
};

/**
 * Generate family member with proper Triple ID pattern
 *
 * @param {Object} member - Member template
 * @param {string} familyId - Family ID
 * @returns {Object} Complete family member with all required fields
 */
function generateFamilyMember(member, familyId) {
  const userId = `${member.name.toLowerCase()}_${familyId}`;

  const familyMember = {
    // Triple ID Pattern (CRITICAL - all three required)
    id: userId,
    memberId: userId,
    userId: userId,

    // Core fields
    name: member.name,
    role: member.role,
    isParent: member.isParent,
    age: member.age,
    avatar: member.avatar,

    // Optional fields (only if defined)
    ...(member.email && { email: member.email }),
    ...(member.phone && { phone: member.phone }),

    // Personality (if provided)
    ...(member.personality && { personality: member.personality }),
    ...(member.mentalLoad !== undefined && { mentalLoad: member.mentalLoad }),
    ...(member.taskCreationRate !== undefined && { taskCreationRate: member.taskCreationRate })
  };

  return familyMember;
}

/**
 * Generate contact with proper format
 *
 * @param {Object} contact - Contact template
 * @param {string} familyName - Family name for email generation
 * @returns {Object} Complete contact
 */
function generateContact(contact, familyName) {
  const emailDomain = familyName.toLowerCase().replace(' ', '') + '.contacts';

  return {
    name: contact.name,
    category: contact.category,
    role: contact.role,
    phone: contact.phone,
    email: contact.email || `${contact.name.toLowerCase().replace(/\s+/g, '.')}@${emailDomain}.com`,
    favorite: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
}

/**
 * Calculate next occurrence of event based on frequency
 *
 * @param {Date} startDate - Starting date
 * @param {string} frequency - Event frequency
 * @returns {Date} Next occurrence
 */
function calculateNextOccurrence(startDate, frequency) {
  const date = new Date(startDate);

  switch (frequency) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'biannual':
      date.setMonth(date.getMonth() + 6);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setDate(date.getDate() + 7);
  }

  return date;
}

module.exports = {
  familyTemplates,
  generateFamilyMember,
  generateContact,
  calculateNextOccurrence
};
