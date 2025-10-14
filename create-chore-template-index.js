// create-chore-template-index.js
const firebase = require('firebase/app');
require('firebase/firestore');
const { getFirestore, collection, query, where, orderBy } = require('firebase/firestore');

// Initialize Firebase
// Replace with your actual Firebase config
const firebaseConfig = {
  // Your Firebase config goes here
};

firebase.initializeApp(firebaseConfig);
const db = getFirestore();

// Create the query that needs the index
// This will log a link in the console to create the necessary index
async function createIndex() {
  try {
    console.log('Creating index for choreTemplates...');
    
    // This is the query from ChoreService.js:138-143
    const q = query(
      collection(db, 'choreTemplates'),
      where('familyId', '==', '<familyId>'),
      where('isArchived', '==', false),
      orderBy('title')
    );
    
    // Try to execute the query - this will fail but generate the correct index creation link
    await getDocs(q);
  } catch (error) {
    console.error('Error:', error);
    
    // Extract the index creation URL from the error message
    if (error.message && error.message.includes('https://console.firebase.google.com')) {
      const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s"]*/);
      if (urlMatch) {
        console.log('Please visit the following URL to create the required index:');
        console.log(urlMatch[0]);
      }
    }
  }
}

createIndex();