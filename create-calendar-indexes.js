#!/usr/bin/env node

// Script to create missing Firebase indexes for calendar functionality

const { exec } = require('child_process');

const indexes = [
  // Events index for AllieProactiveService
  {
    collection: 'events',
    fields: [
      { field: 'familyId', order: 'ASCENDING' },
      { field: 'status', order: 'ASCENDING' }, 
      { field: 'startTime', order: 'ASCENDING' },
      { field: '__name__', order: 'ASCENDING' }
    ]
  },
  // Processed emails index for EmailConfigurationService  
  {
    collection: 'processed_emails',
    fields: [
      { field: 'familyId', order: 'ASCENDING' },
      { field: 'processedAt', order: 'DESCENDING' },
      { field: '__name__', order: 'ASCENDING' }
    ]
  }
];

console.log('🔥 Creating Firebase indexes for calendar functionality...');
console.log('');
console.log('Missing indexes detected:');
console.log('1. Events: familyId + status + startTime + __name__');
console.log('2. Processed emails: familyId + processedAt + __name__');
console.log('');
console.log('Please create these indexes manually:');
console.log('');
console.log('📋 EVENTS INDEX:');
console.log('https://console.firebase.google.com/v1/r/project/parentload-ba995/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9wYXJlbnRsb2FkLWJhOTk1L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ldmVudHMvaW5kZXhlcy9fEAEaDAoIZmFtaWx5SWQQARoKCgZzdGF0dXMQARoNCglzdGFydFRpbWUQAhoMCghfX25hbWVfXxAC');
console.log('');
console.log('📧 PROCESSED EMAILS INDEX:'); 
console.log('https://console.firebase.google.com/v1/r/project/parentload-ba995/firestore/indexes?create_composite=Cllwcm9qZWN0cy9wYXJlbnRsb2FkLWJhOTk1L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9wcm9jZXNzZWRfZW1haWxzL2luZGV4ZXMvXxABGgwKCGZhbWlseUlkEAEaDwoLcHJvY2Vzc2VkQXQQAhoMCghfX25hbWVfXxAC');
console.log('');
console.log('After clicking the links above:');
console.log('1. Click "Create Index" for each one');
console.log('2. Wait for indexes to build (may take a few minutes)');
console.log('3. Refresh your app');
console.log('');
console.log('✨ This will fix the calendar and email history loading issues!');