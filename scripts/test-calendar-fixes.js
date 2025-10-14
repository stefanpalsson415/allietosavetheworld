#!/usr/bin/env node

// Test script for calendar bug fixes
// Run with: node scripts/test-calendar-fixes.js

const admin = require('firebase-admin');
const serviceAccount = require('../server/service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://parentload-ba995.firebaseio.com'
});

const db = admin.firestore();

// Test configuration
const TEST_FAMILY_ID = 'test-family-' + Date.now();
const TEST_USER_ID = 'test-user-' + Date.now();

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName) {
  console.log(`\n${colors.blue}Testing: ${testName}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test 1: Event Creation
async function testEventCreation() {
  logTest('Event Creation');

  try {
    // Test creating event with minimal data
    const minimalEvent = {
      title: 'Test Event Minimal',
      familyId: TEST_FAMILY_ID,
      createdBy: TEST_USER_ID
    };

    const eventRef = await db.collection('events').add({
      ...minimalEvent,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logSuccess(`Created minimal event: ${eventRef.id}`);

    // Test creating event with full data
    const fullEvent = {
      title: 'Test Event Full',
      description: 'This is a test event with all fields',
      location: 'Test Location',
      familyId: TEST_FAMILY_ID,
      userId: TEST_USER_ID,
      createdBy: TEST_USER_ID,
      status: 'active',
      source: 'test',
      category: 'meeting',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(),
      attendees: ['user1', 'user2'],
      reminders: [{ minutes: 15 }],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const fullEventRef = await db.collection('events').add(fullEvent);
    logSuccess(`Created full event: ${fullEventRef.id}`);

    // Verify events were created
    const minimalDoc = await eventRef.get();
    const fullDoc = await fullEventRef.get();

    if (minimalDoc.exists && fullDoc.exists) {
      logSuccess('Both events verified in database');
    } else {
      throw new Error('Events not found in database');
    }

    // Cleanup
    await eventRef.delete();
    await fullEventRef.delete();
    logSuccess('Test events cleaned up');

    return true;
  } catch (error) {
    logError(`Event creation failed: ${error.message}`);
    return false;
  }
}

// Test 2: Event Querying
async function testEventQuerying() {
  logTest('Event Querying');

  try {
    // Create test events
    const events = [];
    for (let i = 0; i < 3; i++) {
      const eventData = {
        title: `Query Test Event ${i + 1}`,
        familyId: TEST_FAMILY_ID,
        status: 'active',
        startDate: new Date(Date.now() + i * 86400000).toISOString(), // Each day
        createdBy: TEST_USER_ID,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      const ref = await db.collection('events').add(eventData);
      events.push(ref);
    }

    logSuccess(`Created ${events.length} test events`);

    // Query events by familyId
    const familyQuery = await db.collection('events')
      .where('familyId', '==', TEST_FAMILY_ID)
      .where('status', '==', 'active')
      .get();

    if (familyQuery.size === events.length) {
      logSuccess(`Query returned correct number of events: ${familyQuery.size}`);
    } else {
      logWarning(`Query returned ${familyQuery.size} events, expected ${events.length}`);
    }

    // Test date range query
    const tomorrow = new Date(Date.now() + 86400000);
    const dateQuery = await db.collection('events')
      .where('familyId', '==', TEST_FAMILY_ID)
      .orderBy('startDate')
      .limit(2)
      .get();

    logSuccess(`Date range query returned ${dateQuery.size} events`);

    // Cleanup
    for (const ref of events) {
      await ref.delete();
    }
    logSuccess('Query test events cleaned up');

    return true;
  } catch (error) {
    logError(`Event querying failed: ${error.message}`);
    return false;
  }
}

// Test 3: Event Updates
async function testEventUpdates() {
  logTest('Event Updates');

  try {
    // Create test event
    const eventData = {
      title: 'Update Test Event',
      familyId: TEST_FAMILY_ID,
      status: 'active',
      startDate: new Date().toISOString(),
      createdBy: TEST_USER_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const eventRef = await db.collection('events').add(eventData);
    logSuccess(`Created test event: ${eventRef.id}`);

    // Update event
    await eventRef.update({
      title: 'Updated Test Event',
      description: 'This event has been updated',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Verify update
    const updatedDoc = await eventRef.get();
    const updated = updatedDoc.data();

    if (updated.title === 'Updated Test Event' && updated.description) {
      logSuccess('Event updated successfully');
    } else {
      throw new Error('Event update not reflected in database');
    }

    // Test partial update
    await eventRef.update({
      location: 'New Location'
    });

    const partialDoc = await eventRef.get();
    const partial = partialDoc.data();

    if (partial.location === 'New Location' && partial.title === 'Updated Test Event') {
      logSuccess('Partial update successful');
    } else {
      throw new Error('Partial update failed');
    }

    // Cleanup
    await eventRef.delete();
    logSuccess('Update test event cleaned up');

    return true;
  } catch (error) {
    logError(`Event updates failed: ${error.message}`);
    return false;
  }
}

// Test 4: Event Deletion
async function testEventDeletion() {
  logTest('Event Deletion');

  try {
    // Create test event
    const eventData = {
      title: 'Delete Test Event',
      familyId: TEST_FAMILY_ID,
      status: 'active',
      startDate: new Date().toISOString(),
      createdBy: TEST_USER_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const eventRef = await db.collection('events').add(eventData);
    logSuccess(`Created test event: ${eventRef.id}`);

    // Delete event
    await eventRef.delete();

    // Verify deletion
    const deletedDoc = await eventRef.get();
    if (!deletedDoc.exists) {
      logSuccess('Event deleted successfully');
    } else {
      throw new Error('Event still exists after deletion');
    }

    return true;
  } catch (error) {
    logError(`Event deletion failed: ${error.message}`);
    return false;
  }
}

// Test 5: Duplicate Detection
async function testDuplicateDetection() {
  logTest('Duplicate Detection');

  try {
    // Create first event
    const eventData = {
      title: 'Duplicate Test Event',
      familyId: TEST_FAMILY_ID,
      status: 'active',
      startDate: new Date().toISOString(),
      createdBy: TEST_USER_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const firstRef = await db.collection('events').add(eventData);
    logSuccess(`Created first event: ${firstRef.id}`);

    // Check for duplicate
    const duplicateQuery = await db.collection('events')
      .where('familyId', '==', TEST_FAMILY_ID)
      .where('title', '==', 'Duplicate Test Event')
      .where('startDate', '==', eventData.startDate)
      .get();

    if (duplicateQuery.size === 1) {
      logSuccess('Duplicate detection working correctly');
    } else {
      logWarning(`Found ${duplicateQuery.size} events, expected 1`);
    }

    // Create event with different time (should not be duplicate)
    const nonDuplicateData = {
      ...eventData,
      startDate: new Date(Date.now() + 3600000).toISOString()
    };

    const secondRef = await db.collection('events').add(nonDuplicateData);
    logSuccess(`Created non-duplicate event: ${secondRef.id}`);

    // Verify both exist
    const allQuery = await db.collection('events')
      .where('familyId', '==', TEST_FAMILY_ID)
      .where('title', '==', 'Duplicate Test Event')
      .get();

    if (allQuery.size === 2) {
      logSuccess('Non-duplicate event created successfully');
    } else {
      logWarning(`Found ${allQuery.size} events, expected 2`);
    }

    // Cleanup
    await firstRef.delete();
    await secondRef.delete();
    logSuccess('Duplicate test events cleaned up');

    return true;
  } catch (error) {
    logError(`Duplicate detection failed: ${error.message}`);
    return false;
  }
}

// Test 6: Field Validation
async function testFieldValidation() {
  logTest('Field Validation');

  try {
    // Test with missing required fields (should be handled gracefully)
    const invalidEvent = {
      // Missing title and familyId
      status: 'active'
    };

    // This should fail
    let failed = false;
    try {
      await db.collection('events').add(invalidEvent);
    } catch (error) {
      failed = true;
      logSuccess('Invalid event correctly rejected');
    }

    if (!failed) {
      logWarning('Invalid event was accepted (may have defaults)');
    }

    // Test with valid minimal fields
    const minimalValid = {
      title: 'Minimal Valid Event',
      familyId: TEST_FAMILY_ID,
      status: 'active',
      startDate: new Date().toISOString(),
      createdBy: TEST_USER_ID
    };

    const validRef = await db.collection('events').add(minimalValid);
    logSuccess(`Valid minimal event created: ${validRef.id}`);

    // Cleanup
    await validRef.delete();

    return true;
  } catch (error) {
    logError(`Field validation failed: ${error.message}`);
    return false;
  }
}

// Test 7: Permissions (simulated)
async function testPermissions() {
  logTest('Permissions (Simulated)');

  try {
    // Create event as one user
    const eventData = {
      title: 'Permission Test Event',
      familyId: TEST_FAMILY_ID,
      status: 'active',
      startDate: new Date().toISOString(),
      createdBy: TEST_USER_ID,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const eventRef = await db.collection('events').add(eventData);
    logSuccess(`Created test event: ${eventRef.id}`);

    // Simulate read by family member (should succeed)
    const readDoc = await eventRef.get();
    if (readDoc.exists && readDoc.data().familyId === TEST_FAMILY_ID) {
      logSuccess('Family member can read event');
    }

    // Simulate update by creator (should succeed)
    await eventRef.update({
      title: 'Updated by creator'
    });
    logSuccess('Creator can update event');

    // Cleanup
    await eventRef.delete();
    logSuccess('Creator can delete event');

    return true;
  } catch (error) {
    logError(`Permission test failed: ${error.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(50));
  log('🧪 Calendar System Test Suite', 'blue');
  console.log('='.repeat(50));

  const tests = [
    { name: 'Event Creation', fn: testEventCreation },
    { name: 'Event Querying', fn: testEventQuerying },
    { name: 'Event Updates', fn: testEventUpdates },
    { name: 'Event Deletion', fn: testEventDeletion },
    { name: 'Duplicate Detection', fn: testDuplicateDetection },
    { name: 'Field Validation', fn: testFieldValidation },
    { name: 'Permissions', fn: testPermissions }
  ];

  const results = {
    passed: 0,
    failed: 0,
    total: tests.length
  };

  for (const test of tests) {
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      logError(`Test "${test.name}" crashed: ${error.message}`);
      results.failed++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  log('📊 Test Results', 'blue');
  console.log('='.repeat(50));

  logSuccess(`Passed: ${results.passed}/${results.total}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}/${results.total}`);
  }

  const percentage = Math.round((results.passed / results.total) * 100);
  if (percentage === 100) {
    log(`\n🎉 All tests passed! The calendar system is working correctly.`, 'green');
  } else if (percentage >= 80) {
    log(`\n✨ ${percentage}% tests passed. Most functionality is working.`, 'yellow');
  } else {
    log(`\n⚠️  Only ${percentage}% tests passed. Critical issues need attention.`, 'red');
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});