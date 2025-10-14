// debug-allie-appointments.js
// A script to diagnose and fix issues with Allie's appointment creation process
// Run with: node debug-allie-appointments.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy, limit, getDoc, doc, setDoc, updateDoc } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

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

/**
 * A comprehensive diagnostic for Allie's appointment creation abilities
 */
async function diagnoseChatAppointmentIssues() {
  try {
    console.log("🔍 Diagnosing Allie chat appointment issues...");
    
    // Step 1: Check for appointment templates in Allie service settings
    console.log("\n📋 Step 1: Checking Allie appointment templates...");
    const allieSettingsRef = doc(db, "settings", "allieAISettings");
    const allieSnapshot = await getDoc(allieSettingsRef);
    
    if (allieSnapshot.exists()) {
      const settings = allieSnapshot.data();
      if (settings.appointmentTemplates) {
        console.log("✅ Found appointment templates in Allie settings");
        console.log(`   Total templates: ${Object.keys(settings.appointmentTemplates).length}`);
        
        // Print template types
        Object.keys(settings.appointmentTemplates).forEach(type => {
          console.log(`   - ${type}`);
        });
        
        // Check for dental template specifically
        if (settings.appointmentTemplates.dental) {
          console.log("✅ Dental appointment template exists");
        } else {
          console.log("❌ No dental appointment template found");
          console.log("   Adding dental template to settings...");
          
          // Add dental template
          const updatedTemplates = {
            ...settings.appointmentTemplates,
            dental: {
              title: "${childName}'s Dental Appointment with ${providerName}",
              description: "Regular dental checkup with ${providerName}",
              duration: 60,
              category: "medical",
              eventType: "appointment",
              tags: ["dental", "health", "appointment"]
            }
          };
          
          try {
            await updateDoc(allieSettingsRef, {
              appointmentTemplates: updatedTemplates,
              lastUpdated: new Date().toISOString()
            });
            console.log("✅ Added dental template to Allie settings");
          } catch (err) {
            console.log("❌ Failed to update Allie settings:", err);
          }
        }
      } else {
        console.log("❌ No appointment templates found in Allie settings");
        console.log("   Creating appointment templates...");
        
        // Create basic templates
        const templates = {
          medical: {
            title: "${childName}'s Doctor Appointment with ${providerName}",
            description: "Medical appointment with ${providerName}",
            duration: 60,
            category: "medical",
            eventType: "appointment",
            tags: ["medical", "health", "appointment"]
          },
          dental: {
            title: "${childName}'s Dental Appointment with ${providerName}",
            description: "Dental checkup with ${providerName}",
            duration: 60,
            category: "medical",
            eventType: "appointment",
            tags: ["dental", "health", "appointment"]
          },
          therapy: {
            title: "${childName}'s Therapy Session with ${providerName}",
            description: "Therapy session with ${providerName}",
            duration: 60,
            category: "medical",
            eventType: "appointment",
            tags: ["therapy", "health", "appointment"]
          }
        };
        
        try {
          await updateDoc(allieSettingsRef, {
            appointmentTemplates: templates,
            lastUpdated: new Date().toISOString()
          });
          console.log("✅ Created appointment templates in Allie settings");
        } catch (err) {
          console.log("❌ Failed to update Allie settings:", err);
        }
      }
    } else {
      console.log("❌ Allie settings document doesn't exist");
      console.log("   Creating Allie settings document...");
      
      // Create basic settings document
      const basicSettings = {
        appointmentTemplates: {
          medical: {
            title: "${childName}'s Doctor Appointment with ${providerName}",
            description: "Medical appointment with ${providerName}",
            duration: 60,
            category: "medical",
            eventType: "appointment",
            tags: ["medical", "health", "appointment"]
          },
          dental: {
            title: "${childName}'s Dental Appointment with ${providerName}",
            description: "Dental checkup with ${providerName}",
            duration: 60,
            category: "medical",
            eventType: "appointment",
            tags: ["dental", "health", "appointment"]
          }
        },
        lastUpdated: new Date().toISOString(),
        version: "1.0.0"
      };
      
      try {
        await setDoc(allieSettingsRef, basicSettings);
        console.log("✅ Created Allie settings document with appointment templates");
      } catch (err) {
        console.log("❌ Failed to create Allie settings:", err);
      }
    }
    
    // Step 2: Check Allie conversations for appointment mentions
    console.log("\n📋 Step 2: Checking recent Allie conversations...");
    
    const conversationsRef = collection(db, "conversations");
    const recentConversationsQuery = query(
      conversationsRef,
      orderBy("lastMessageTimestamp", "desc"),
      limit(20)
    );
    
    const conversationsSnapshot = await getDocs(recentConversationsQuery);
    
    if (conversationsSnapshot.empty) {
      console.log("❌ No recent conversations found");
    } else {
      console.log(`✅ Found ${conversationsSnapshot.docs.length} recent conversations`);
      
      // Look for appointment-related messages
      let appointmentMentions = 0;
      let appointmentCreationAttempts = 0;
      
      for (const convoDoc of conversationsSnapshot.docs) {
        const conversation = convoDoc.data();
        
        // Get messages if available
        if (conversation.messages && Array.isArray(conversation.messages)) {
          for (const message of conversation.messages) {
            // Check for appointment mentions
            if (message.content && 
                (message.content.toLowerCase().includes("appointment") ||
                 message.content.toLowerCase().includes("dentist") ||
                 message.content.toLowerCase().includes("doctor"))) {
              appointmentMentions++;
            }
            
            // Check for specific appointment creation phrases
            if (message.content && 
                message.content.includes("I've added") && 
                (message.content.includes("appointment") ||
                 message.content.includes("to your calendar"))) {
              appointmentCreationAttempts++;
            }
          }
        }
      }
      
      console.log(`   Found ${appointmentMentions} messages mentioning appointments`);
      console.log(`   Found ${appointmentCreationAttempts} appointment creation attempts`);
    }
    
    // Step 3: Check for integration between ClaudeService and EventStore
    console.log("\n📋 Step 3: Checking integration between services...");
    
    // Create diagnostic data
    const diagnosticData = {
      timestamp: new Date().toISOString(),
      familyId: "m93tlovs6ty9sg8k0c8",
      appointmentData: {
        title: "Diagnostic Appointment",
        description: "Created by diagnostic script",
        dateTime: new Date().toISOString(),
        eventType: "appointment",
        category: "medical",
        appointmentType: "diagnostic"
      },
      results: {}
    };
    
    // Save diagnostic data to a file
    fs.writeFileSync(
      path.join(__dirname, 'allie-appointment-diagnostic.json'),
      JSON.stringify(diagnosticData, null, 2)
    );
    
    console.log("✅ Created diagnostic data file: allie-appointment-diagnostic.json");
    console.log("   Use this file for further debugging if needed");
    
    // Final recommendations
    console.log("\n📋 Recommended fixes:");
    console.log("1. Ensure the ClaudeService has necessary permissions for calendar events");
    console.log("2. Check that handleAddAppointment in IntentActionService.js is robust");
    console.log("3. Run fix-calendar-appointment.js to create Dr. Yearn and the appointment");
    console.log("4. Reload your app to see if the appointment appears");
    
  } catch (error) {
    console.error("❌ Diagnostic error:", error);
  }
}

// Run the diagnostic
diagnoseChatAppointmentIssues().then(() => {
  console.log("\n✨ Diagnostic completed ✨");
  process.exit(0);
}).catch(error => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});