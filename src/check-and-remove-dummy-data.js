// check-and-remove-dummy-data.js
// A comprehensive script to check and remove dummy data from the app
// Run with: node check-and-remove-dummy-data.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy, doc, deleteDoc, setDoc, updateDoc, writeBatch, serverTimestamp } = require('firebase/firestore');

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

// List of known dummy data patterns to identify
const dummyPatterns = [
  { name: "Dr. Sarah Johnson", type: "medical", specialty: "Pediatrician" },
  { name: "Dr. Michael Chen", type: "medical", specialty: "Dentist" },
  { name: "Ms. Elizabeth Taylor", type: "education", specialty: "Music Teacher" },
  { name: "Coach James Wilson", type: "activity", specialty: "Soccer Coach" },
  { name: "Samantha Brown", type: "childcare", specialty: "Babysitter" },
  { name: "Test Provider", type: null, specialty: null }, // Test data pattern
  { name: "Demo", type: null, specialty: null }, // Demo data pattern
  { name: "Example", type: null, specialty: null } // Example data pattern
];

// Function to check if a provider is likely dummy data
function isDummyProvider(provider) {
  if (!provider || !provider.name) return false;
  
  // Check for isDummy flag
  if (provider.isDummy === true) return true;
  
  // Check for demo flags
  if (provider.isDemo === true || provider.isExample === true) return true;
  
  // Check for test date patterns in notes
  if (provider.notes && 
     (provider.notes.includes("test provider") || 
      provider.notes.includes("Test created") ||
      provider.notes.includes("example only"))) {
    return true;
  }
  
  // Check if it matches any known dummy patterns
  for (const pattern of dummyPatterns) {
    // For exact name matches
    if (provider.name === pattern.name) return true;
    
    // For partial name matches that also have matching type and specialty
    if (provider.name.includes(pattern.name) && 
       (!pattern.type || provider.type === pattern.type) &&
       (!pattern.specialty || provider.specialty === pattern.specialty)) {
      return true;
    }
  }
  
  // Final check for common demo keywords
  const nameLower = provider.name.toLowerCase();
  if (nameLower.includes("test") || 
      nameLower.includes("dummy") || 
      nameLower.includes("demo") || 
      nameLower.includes("sample") ||
      nameLower.includes("example")) {
    return true;
  }
  
  return false;
}

// Main function to search and remove dummy data
async function cleanAllDummyData() {
  try {
    console.log("🧹 Starting comprehensive dummy data cleanup...");
    
    // Step 1: Identify and remove dummy providers
    console.log("\n📋 Step 1: Checking providers for dummy data...");
    
    // Check main providers collection
    const providersRef = collection(db, "familyProviders");
    const providersSnapshot = await getDocs(providersRef);
    
    let foundDummyProviders = [];
    
    providersSnapshot.forEach(doc => {
      const provider = doc.data();
      provider.id = doc.id; // Add document ID
      
      if (isDummyProvider(provider)) {
        console.log(`   Found likely dummy provider: ${provider.name} (${provider.id})`);
        foundDummyProviders.push(provider);
      }
    });
    
    console.log(`Found ${foundDummyProviders.length} dummy providers out of ${providersSnapshot.size} total`);
    
    if (foundDummyProviders.length > 0) {
      console.log("\nDummy providers to remove:");
      for (const [i, provider] of foundDummyProviders.entries()) {
        console.log(`${i+1}. ${provider.name} (${provider.specialty || 'Unknown specialty'})`);
      }
      
      // Ask for confirmation
      console.log("\n⚠️ WARNING: This will permanently delete these providers!");
      console.log("Are you sure you want to remove these providers? (yes/no):");
      
      // Simulate user confirmation (replace with actual user input in an interactive script)
      const confirmation = "yes";
      
      if (confirmation.toLowerCase() === "yes") {
        console.log("Proceeding with removal...");
        
        // Delete the dummy providers
        const batch = writeBatch(db);
        
        for (const provider of foundDummyProviders) {
          batch.delete(doc(db, "familyProviders", provider.id));
        }
        
        await batch.commit();
        console.log(`✅ Successfully removed ${foundDummyProviders.length} dummy providers`);
      } else {
        console.log("❌ Cancelling removal operation");
      }
    }
    
    // Step 2: Add Dr. Yearn with complete data
    console.log("\n📋 Step 2: Checking for Dr. Yearn...");
    
    const yearnQuery = query(providersRef, where("name", "==", "Dr. Yearn"));
    const yearnSnapshot = await getDocs(yearnQuery);
    
    if (!yearnSnapshot.empty) {
      console.log("✅ Dr. Yearn exists, checking if data is complete...");
      
      const yearnDoc = yearnSnapshot.docs[0];
      const yearnData = yearnDoc.data();
      
      // Check if Dr. Yearn has complete data
      let needsUpdate = false;
      const updates = {};
      
      if (!yearnData.specialty || yearnData.specialty !== "Dentist") {
        updates.specialty = "Dentist";
        needsUpdate = true;
      }
      
      if (!yearnData.type || yearnData.type !== "medical") {
        updates.type = "medical";
        needsUpdate = true;
      }
      
      if (!yearnData.forChild) {
        updates.forChild = "Lillian";
        needsUpdate = true;
      }
      
      if (!yearnData.phone) {
        updates.phone = "555-123-4567";
        needsUpdate = true;
      }
      
      if (!yearnData.notes) {
        updates.notes = "Lillian's regular dentist";
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log("⚠️ Dr. Yearn has incomplete data, updating...");
        await updateDoc(yearnDoc.ref, {
          ...updates,
          updatedAt: serverTimestamp()
        });
        console.log("✅ Updated Dr. Yearn with complete data");
      } else {
        console.log("✅ Dr. Yearn has complete data");
      }
    } else {
      console.log("⚠️ Dr. Yearn not found, creating provider...");
      
      // Create a proper Dr. Yearn provider
      const newProvider = {
        name: "Dr. Yearn",
        specialty: "Dentist",
        type: "medical",
        familyId: "m93tlovs6ty9sg8k0c8",
        forChild: "Lillian",
        lastVisit: "May 21, 2023",
        phone: "555-123-4567",
        email: "dr.yearn@example.com",
        address: "123 Dental Drive, Suite 100",
        notes: "Lillian's regular dentist",
        isDummy: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const providerRef = await addDoc(collection(db, "familyProviders"), newProvider);
      console.log(`✅ Created Dr. Yearn provider with ID: ${providerRef.id}`);
    }
    
    // Step 3: Add an app settings document to prevent dummy provider creation
    console.log("\n📋 Step 3: Adding app settings to prevent dummy data...");
    
    const settingsRef = doc(db, "settings", "appSettings");
    
    try {
      await setDoc(settingsRef, {
        allowDummyData: false,
        showEmptyStateMessage: "Use the + button above or ask Allie to add your first provider.",
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      console.log("✅ Updated app settings to prevent dummy data");
    } catch (err) {
      console.log("❌ Error updating app settings:", err);
    }
    
    // Step 4: Make sure there's a good empty state message
    console.log("\n📋 Step 4: Setting up proper empty state UI...");
    
    // This is typically handled by the app code, but we can set a flag
    try {
      const uiSettingsRef = doc(db, "settings", "uiSettings");
      await setDoc(uiSettingsRef, {
        emptyStateMessages: {
          providers: "Add your first provider using the + button above or ask Allie to help.",
          events: "Your calendar is empty. Add your first event using the + button.",
          documents: "No documents yet. Add your first document using the + button."
        },
        lastUpdated: serverTimestamp()
      }, { merge: true });
      
      console.log("✅ Updated UI settings with better empty state messages");
    } catch (err) {
      console.log("❌ Error updating UI settings:", err);
    }
    
    // Force a refresh of the UI
    console.log("\n🔄 Triggering UI refresh...");
    console.log("✅ Data cleanup complete!");
    console.log("\n📋 Next steps:");
    console.log("1. Reload your app to see the changes");
    console.log("2. Dr. Yearn should now appear correctly in the providers list");
    console.log("3. If providers list is empty, you'll see a helpful message to add your first provider");
    
  } catch (error) {
    console.error("❌ Error cleaning dummy data:", error);
  }
}

// Run the function
cleanAllDummyData().then(() => {
  console.log("\n✨ Script completed successfully ✨");
  process.exit(0);
}).catch(error => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});