// Script to create Firebase indexes for Google Calendar sync
// Run this with: node create-events-indexes.js

console.log('\n=== Firebase Indexes Needed for Google Calendar Sync ===\n');

console.log('Please create the following indexes in Firebase Console:');
console.log('https://console.firebase.google.com/project/parentload-ba995/firestore/indexes\n');

console.log('1. Events Collection - For Google Calendar sync queries:');
console.log('   Collection: events');
console.log('   Fields:');
console.log('   - familyId (Ascending)');
console.log('   - source (Ascending)');
console.log('   - __name__ (Ascending)');
console.log('');

console.log('2. Events Collection - For calendar view queries with status:');
console.log('   Collection: events');
console.log('   Fields:');
console.log('   - familyId (Ascending)');
console.log('   - status (Ascending)');
console.log('   - startTime (Ascending)');
console.log('');

console.log('3. Events Collection - For calendar view queries by time:');
console.log('   Collection: events');
console.log('   Fields:');
console.log('   - familyId (Ascending)');
console.log('   - startTime (Ascending)');
console.log('   - __name__ (Ascending)');
console.log('');

console.log('4. Events Collection - For legacy dateTime queries:');
console.log('   Collection: events');
console.log('   Fields:');
console.log('   - familyId (Ascending)');
console.log('   - dateTime (Ascending)');
console.log('   - __name__ (Ascending)');
console.log('');

console.log('5. Events Collection - For fetching by startDate:');
console.log('   Collection: events');
console.log('   Fields:');
console.log('   - familyId (Ascending)');
console.log('   - startDate (Ascending)');
console.log('   - __name__ (Ascending)');
console.log('');

console.log('6. Google Calendar Sync Status:');
console.log('   Collection: googleCalendarSync');
console.log('   Fields:');
console.log('   - familyId (Ascending)');
console.log('   - updatedAt (Descending)');
console.log('   - __name__ (Ascending)');
console.log('');

console.log('Direct links to create indexes:');
console.log('');
console.log('Events - familyId + source:');
console.log('https://console.firebase.google.com/project/parentload-ba995/firestore/indexes?create_composite=CgZldmVudHMSCgoIZmFtaWx5SWQQARIKCgZzb3VyY2UQARoMCghfX25hbWVfXxAC');
console.log('');
console.log('Events - familyId + status + startTime:');
console.log('https://console.firebase.google.com/project/parentload-ba995/firestore/indexes?create_composite=CgZldmVudHMSCgoIZmFtaWx5SWQQARIKCgZzdGF0dXMQARINCglzdGFydFRpbWUQAQ');
console.log('');
console.log('Events - familyId + startTime:');
console.log('https://console.firebase.google.com/project/parentload-ba995/firestore/indexes?create_composite=CgZldmVudHMSCgoIZmFtaWx5SWQQARINCglzdGFydFRpbWUQARoMCghfX25hbWVfXxAC');
console.log('');
console.log('Events - familyId + startDate:');
console.log('https://console.firebase.google.com/project/parentload-ba995/firestore/indexes?create_composite=CgZldmVudHMSCgoIZmFtaWx5SWQQARINCglzdGFydERhdGUQARoMCghfX25hbWVfXxAC');
console.log('');

console.log('After creating these indexes, the Google Calendar sync will work properly.');
console.log('It may take 5-10 minutes for the indexes to be ready.\n');

console.log('⚠️  IMPORTANT: If you see errors like "The query requires an index" in the console,');
console.log('   click the link in the error message to automatically create the required index.\n');