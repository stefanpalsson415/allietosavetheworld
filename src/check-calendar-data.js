// Script to check calendar data and find issues with missing events
// Run this script with: node check-calendar-data.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');

// Firebase configuration - replace with your actual config if different
const firebaseConfig = {
  apiKey: "AIzaSyBiLOvRYKX3ZnRXgTSjYhcw7o7XCPu1kBs",
  authDomain: "parentloaddev.firebaseapp.com",
  projectId: "parentloaddev",
  storageBucket: "parentloaddev.appspot.com",
  messagingSenderId: "729483563123",
  appId: "1:729483563123:web:d6dbd0d49d5aeee58cd3b9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkCalendarData() {
  try {
    console.log("🔍 Checking calendar events...");
    
    // Get recent calendar events
    const eventsRef = collection(db, "calendar_events");
    const recentEventsQuery = query(eventsRef, orderBy("createdAt", "desc"), limit(10));
    const eventsSnapshot = await getDocs(recentEventsQuery);
    
    console.log(`\n📆 Found ${eventsSnapshot.docs.length} recent events\n`);
    
    // Display event data
    eventsSnapshot.docs.forEach((doc, index) => {
      const event = doc.data();
      console.log(`Event ${index + 1} ID: ${doc.id}`);
      console.log(`- Title: ${event.title}`);
      
      // Format and display dates
      try {
        const dateStr = event.dateTime || event.date || event.start?.dateTime;
        const date = dateStr ? new Date(dateStr) : null;
        console.log(`- Date: ${date ? date.toLocaleString() : 'Not available'}`);
      } catch (e) {
        console.log(`- Date: Invalid date format`);
      }
      
      console.log(`- Type: ${event.eventType || event.category || 'Unknown'}`);
      console.log(`- Child: ${event.childName || 'None'}`);
      
      // Check for provider
      if (event.provider) {
        console.log(`- Provider: ${event.provider.name || 'Unknown'}`);
      }
      
      // Check if event is missing critical data
      const issues = [];
      if (!event.title) issues.push("Missing title");
      if (!event.dateTime && !event.date && !event.start?.dateTime) issues.push("Missing date");
      
      if (issues.length > 0) {
        console.log(`- Issues: ${issues.join(', ')}`);
      }
      
      console.log(''); // Add empty line between events
    });
    
    // Check for Dr. Yearn's appointment specifically
    console.log("🔍 Looking for Dr. Yearn appointments...");
    const yearnQuery = query(eventsRef, where("title", ">=", "Dental"), where("title", "<=", "Dentalz"));
    const yearnSnapshot = await getDocs(yearnQuery);
    
    if (yearnSnapshot.empty) {
      console.log("❌ No Dr. Yearn appointments found");
    } else {
      console.log(`\n📆 Found ${yearnSnapshot.docs.length} dental appointments\n`);
      
      yearnSnapshot.docs.forEach((doc, index) => {
        const event = doc.data();
        console.log(`Appointment ${index + 1} ID: ${doc.id}`);
        console.log(`- Title: ${event.title}`);
        
        // Format and display dates
        try {
          const dateStr = event.dateTime || event.date || event.start?.dateTime;
          const date = dateStr ? new Date(dateStr) : null;
          console.log(`- Date: ${date ? date.toLocaleString() : 'Not available'}`);
        } catch (e) {
          console.log(`- Date: Invalid date format`);
        }
        
        console.log(''); // Add empty line between events
      });
    }
    
    // Check providers
    console.log("🔍 Checking provider data...");
    const providersRef = collection(db, "familyProviders");
    const providersSnapshot = await getDocs(providersRef);
    
    console.log(`\n👩‍⚕️ Found ${providersSnapshot.docs.length} providers\n`);
    
    // Display provider data
    providersSnapshot.docs.forEach((doc, index) => {
      const provider = doc.data();
      console.log(`Provider ${index + 1} ID: ${doc.id}`);
      console.log(`- Name: ${provider.name}`);
      console.log(`- Type: ${provider.type}`);
      console.log(`- Specialty: ${provider.specialty || 'None'}`);
      
      if (provider.name.includes("Yearn")) {
        console.log(`- ID: ${doc.id} (Dr. Yearn matched!)`);
      }
      
      console.log(''); // Add empty line between providers
    });
    
  } catch (error) {
    console.error("❌ Error checking calendar data:", error);
  }
}

// Run the function
checkCalendarData().then(() => {
  console.log("Script completed");
  process.exit(0);
}).catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});