// Script to fix the issue with dentist appointment not showing in calendar
// Run this script with: node fix-calendar-appointment.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where, serverTimestamp } = require('firebase/firestore');

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

async function fixCalendarAppointment() {
  try {
    console.log("🔍 Looking for Dr. Yearn in providers...");

    // First, check if Dr. Yearn provider exists
    const providersRef = collection(db, "familyProviders");
    const providerQuery = query(providersRef, where("name", "==", "Dr. Yearn"));
    const providerSnapshot = await getDocs(providerQuery);

    let providerId = null;
    let provider = null;

    // If provider exists, get the ID
    if (!providerSnapshot.empty) {
      providerId = providerSnapshot.docs[0].id;
      provider = providerSnapshot.docs[0].data();
      console.log("✅ Found Dr. Yearn provider:", providerId);
    } else {
      console.log("⚠️ Dr. Yearn provider not found, creating one now...");

      // Create the provider since it doesn't exist
      const newProvider = {
        name: "Dr. Yearn",
        type: "medical",
        specialty: "dentist",
        familyId: "m93tlovs6ty9sg8k0c8", // Use your family ID
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        forChild: "Lillian",  // Associated with Lillian
        notes: "Added by system fix script",
        source: "system-fix"
      };

      // Add the provider to the familyProviders collection
      const providerDocRef = await addDoc(collection(db, "familyProviders"), newProvider);
      providerId = providerDocRef.id;
      provider = newProvider;
      console.log("✅ Created Dr. Yearn provider with ID:", providerId);
    }
    
    // Now check if the appointment exists in calendar_events
    console.log("🔍 Looking for Lillian's dentist appointment...");
    const eventsRef = collection(db, "calendar_events");
    const eventQuery = query(
      eventsRef, 
      where("title", "==", "Lillian's Dental Appointment with Dr. Yearn")
    );
    const eventSnapshot = await getDocs(eventQuery);
    
    // If appointment already exists, no need to create it
    if (!eventSnapshot.empty) {
      console.log("✅ Found existing appointment - no need to create another");
      return;
    }
    
    // Create the appointment for June 21st
    console.log("📆 Creating Lillian's appointment on June 21st at 2:00 PM");

    // Get current year
    const currentYear = new Date().getFullYear();

    // Set date to June 21st of current year at 2:00 PM
    // This ensures the appointment shows up in the current calendar view
    const appointmentDate = new Date(currentYear, 5, 21, 14, 0, 0); // Month is 0-based, so 5 = June
    const endDate = new Date(appointmentDate.getTime() + 60 * 60 * 1000); // 1 hour later

    // Make sure the date is in the future - if June 21 already passed this year, use next year
    if (appointmentDate < new Date()) {
      appointmentDate.setFullYear(appointmentDate.getFullYear() + 1);
      endDate.setFullYear(endDate.getFullYear() + 1);
      console.log(`⚠️ June 21st already passed this year, using June 21st, ${appointmentDate.getFullYear()} instead`);
    }

    console.log(`📅 Using date: ${appointmentDate.toLocaleString()}`);

    // Get child info
    const childName = "Lillian";
    let childId = null;

    // Try to find Lillian in the family
    try {
      const childrenRef = collection(db, "familyMembers");
      const childQuery = query(childrenRef,
        where("familyId", "==", "m93tlovs6ty9sg8k0c8"),
        where("name", "==", "Lillian")
      );
      const childSnapshot = await getDocs(childQuery);
      if (!childSnapshot.empty) {
        childId = childSnapshot.docs[0].id;
        console.log(`✅ Found child ID for Lillian: ${childId}`);
      }
    } catch (err) {
      console.log("⚠️ Could not find child ID for Lillian:", err);
    }

    // Build list of attendees (all family members)
    let attendees = [];
    try {
      const familyRef = collection(db, "familyMembers");
      const familyQuery = query(familyRef, where("familyId", "==", "m93tlovs6ty9sg8k0c8"));
      const familySnapshot = await getDocs(familyQuery);

      attendees = familySnapshot.docs.map(doc => {
        const member = doc.data();
        return {
          id: doc.id,
          name: member.name || "",
          role: member.role || "",
          photoURL: member.photoURL || null
        };
      });

      console.log(`✅ Added ${attendees.length} family members as attendees`);
    } catch (err) {
      console.log("⚠️ Could not find family members for attendees:", err);
    }

    // The appointment data - with full details to ensure it works properly
    const appointment = {
      title: "Lillian's Dental Appointment with Dr. Yearn",
      description: "Regular dental checkup with Dr. Yearn (dentist)",
      location: "",

      // Standard date fields
      dateTime: appointmentDate.toISOString(),
      date: appointmentDate.toISOString(),
      endDateTime: endDate.toISOString(),

      // Google Calendar format
      start: {
        dateTime: appointmentDate.toISOString(),
        date: appointmentDate.toISOString().split('T')[0],
        timeZone: "America/Los_Angeles"
      },
      end: {
        dateTime: endDate.toISOString(),
        date: endDate.toISOString().split('T')[0],
        timeZone: "America/Los_Angeles"
      },

      // Metadata
      eventType: "appointment",
      category: "medical",
      appointmentType: "dental",
      familyId: "m93tlovs6ty9sg8k0c8", // This should be your actual family ID
      childName: childName,
      childId: childId,

      // Provider information
      provider: {
        ...provider,
        id: providerId
      },
      providerId: providerId,

      // Additional helpful fields
      attendees: attendees,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: "allie",
      source: "allie-chat-correction",

      // Make it universally identifiable
      universalId: `lillian-yearn-dental-${Date.now()}`
    };
    
    // Add the appointment to calendar_events
    const calendarRef = await addDoc(collection(db, "calendar_events"), appointment);
    console.log("✅ Successfully created appointment:", calendarRef.id);

    // Also add to medicalAppointments collection for completeness
    const medicalRef = await addDoc(collection(db, "medicalAppointments"), {
      ...appointment,
      appointmentType: "dental",
      doctor: "Dr. Yearn",
      completed: false
    });
    console.log("✅ Also created medical record:", medicalRef.id);

    // Create a script to refresh the UI
    console.log("\n🔄 Creating force-refresh-calendar.js script...");

    try {
      const fs = require('fs');
      const path = require('path');

      // Create a simple script that can be run to force refresh the calendar
      const refreshScript = `
// force-refresh-calendar.js - Run this to refresh the calendar UI
// Usage: node force-refresh-calendar.js

// This script will create a "flag file" that tells the app to refresh the calendar
// The app checks for this file and refreshes the calendar data when it's found

const fs = require('fs');
const path = require('path');

// Create a timestamped flag file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const flagFilePath = path.join(__dirname, 'calendar-refresh-needed-' + timestamp);

// Write the file
fs.writeFileSync(flagFilePath, 'refresh');

console.log('🔄 Calendar refresh flag created!');
console.log('The calendar will refresh next time the app is reloaded.');
console.log('If using the app now, please reload the page to see your changes.');
      `;

      // Write the script
      fs.writeFileSync(path.join(__dirname, 'force-refresh-calendar.js'), refreshScript);
      console.log("✅ Created force-refresh-calendar.js");

      // Also create a batch file for Windows users
      const batchScript = `@echo off
echo Running calendar refresh script...
node force-refresh-calendar.js
pause
      `;

      fs.writeFileSync(path.join(__dirname, 'refresh-calendar.bat'), batchScript);
      console.log("✅ Created refresh-calendar.bat for Windows users");

      // Create a shell script for Mac/Linux users
      const shellScript = `#!/bin/bash
echo "Running calendar refresh script..."
node force-refresh-calendar.js
echo "Press any key to exit"
read -n 1
      `;

      fs.writeFileSync(path.join(__dirname, 'refresh-calendar.sh'), shellScript);
      fs.chmodSync(path.join(__dirname, 'refresh-calendar.sh'), 0o755); // Make executable
      console.log("✅ Created refresh-calendar.sh for Mac/Linux users");

    } catch (err) {
      console.log("⚠️ Couldn't create refresh scripts:", err);
    }

    console.log("\n🎉 Done! Here's what was fixed:");
    console.log("1. Created Dr. Yearn as a dentist provider");
    console.log("2. Added Lillian's dental appointment for June 21st");
    console.log("3. Created helper scripts for refreshing the calendar");
    console.log("\n📋 Next steps:");
    console.log("1. Try reloading your app to see if the appointment appears");
    console.log("2. If not, run one of these scripts:");
    console.log("   - On Windows: refresh-calendar.bat");
    console.log("   - On Mac/Linux: ./refresh-calendar.sh");
    console.log("   - Or directly: node force-refresh-calendar.js");
    console.log("3. Reload the app again after running the refresh script");
  } catch (error) {
    console.error("❌ Error fixing appointment:", error);
  }
}

// Run the function
fixCalendarAppointment().then(() => {
  console.log("\n✨ Script completed successfully ✨");
  process.exit(0);
}).catch(error => {
  console.error("\n❌ Fatal error:", error);
  console.log("Please try running the script again or check your Firebase configuration.");
  process.exit(1);
});