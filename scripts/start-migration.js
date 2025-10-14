#!/usr/bin/env node
// start-migration.js - Begin the migration process

const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Firebase Service Migration\n');

// Step 1: Backup current state
console.log('📦 Step 1: Creating backup...');
const backupDir = `./backup-${Date.now()}`;
fs.mkdirSync(backupDir, { recursive: true });

// Copy key service files
const servicesToBackup = [
  'src/services/EventStore.js',
  'src/services/CalendarService.js', 
  'src/services/MasterCalendarService.js',
  'src/services/HabitService2.js',
  'src/services/HabitCyclesService.js'
];

servicesToBackup.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const backupPath = path.join(backupDir, file);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(filePath, backupPath);
    console.log(`  ✓ Backed up ${file}`);
  }
});

console.log(`\n✅ Backup created in: ${backupDir}\n`);

// Step 2: Test the new service
console.log('🧪 Step 2: Testing CalendarServiceV2...');
console.log('  Run these commands to test:');
console.log('  1. npm start');
console.log('  2. Create a test event using the UI');
console.log('  3. Verify it appears in Firebase Console\n');

// Step 3: Migration checklist
console.log('📋 Step 3: Migration Checklist\n');
console.log('Week 1 - Service Migration:');
console.log('  [ ] CalendarServiceV2 is working');
console.log('  [ ] Update 3 most critical components first:');
console.log('      - src/components/calendar-v2/core/CalendarProvider.js');
console.log('      - src/components/chat/AllieChat.jsx');
console.log('      - src/components/calendar/EnhancedEventManager.jsx');
console.log('  [ ] Test event creation, update, delete');
console.log('  [ ] Check real-time updates work\n');

console.log('Week 2 - Complete Migration:');
console.log('  [ ] Update remaining 80+ components');
console.log('  [ ] Fix collection names (calendar_events → events)');
console.log('  [ ] Update security rules');
console.log('  [ ] Deploy indexes\n');

console.log('Week 3 - Cleanup:');
console.log('  [ ] Remove old services');
console.log('  [ ] Fix ID patterns (no more firestoreId)');
console.log('  [ ] Update tests');
console.log('  [ ] Performance testing\n');

// Step 4: First file to update
console.log('🔧 Step 4: Start with CalendarProvider.js\n');
console.log('Replace these imports:');
console.log('  OLD: import MasterCalendarService from \'../../../services/MasterCalendarService\';');
console.log('  NEW: import CalendarServiceV2 from \'../../../services/CalendarServiceV2\';\n');

console.log('Update method calls:');
console.log('  OLD: MasterCalendarService.createEvent(...)');
console.log('  NEW: CalendarServiceV2.createEvent(...)\n');

console.log('The new service has the same methods, so it should be a drop-in replacement!\n');

// Generate a simple test file
const testContent = `// test-calendar-v2.js - Test the new calendar service
// Run this in the browser console after starting the app

async function testCalendarV2() {
  // Get the service (it's attached to window for testing)
  const CalendarServiceV2 = window.CalendarServiceV2;
  
  if (!CalendarServiceV2) {
    console.error('CalendarServiceV2 not found. Make sure to import it in App.js');
    return;
  }
  
  // Test data
  const testEvent = {
    title: 'Test Event from CalendarServiceV2',
    description: 'Testing the new consolidated service',
    startTime: new Date(),
    endTime: new Date(Date.now() + 3600000), // 1 hour later
    location: 'Home',
    category: 'test'
  };
  
  try {
    // Create event
    console.log('Creating test event...');
    const result = await CalendarServiceV2.createEvent(
      testEvent,
      'test-user-id',
      'test-family-id'
    );
    
    if (result.success) {
      console.log('✅ Event created:', result.event);
      
      // Update event
      console.log('Updating event title...');
      const updateResult = await CalendarServiceV2.updateEvent(
        result.event.id,
        { title: 'Updated Test Event' },
        'test-user-id'
      );
      
      if (updateResult.success) {
        console.log('✅ Event updated:', updateResult.event);
      }
      
      // Get events
      console.log('Getting events...');
      const events = await CalendarServiceV2.getEvents('test-family-id');
      console.log('✅ Found events:', events.length);
      
    } else {
      console.error('❌ Failed to create event:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCalendarV2();
`;

fs.writeFileSync('./test-calendar-v2.js', testContent);
console.log('📝 Created test file: test-calendar-v2.js\n');

console.log('🎯 Next Steps:');
console.log('1. Start your app: npm start');
console.log('2. Update CalendarProvider.js to use CalendarServiceV2');
console.log('3. Test creating an event');
console.log('4. If it works, continue updating other files\n');

console.log('💡 Pro tip: Start with one file, test it thoroughly, then move to the next.');
console.log('This way you can catch issues early!\n');

console.log('Good luck! 🚀');