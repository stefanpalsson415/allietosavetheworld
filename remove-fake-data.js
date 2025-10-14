// remove-fake-data.js
// Run with: node remove-fake-data.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, deleteDoc, serverTimestamp, addDoc } = require('firebase/firestore');

// Firebase configuration
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

// Family ID - adjust if needed
const FAMILY_ID = "m93tlovs6ty9sg8k0c8";

async function cleanFakeProvidersAndFixAllie() {
  console.log("🧹 Cleaning fake providers and fixing Allie...");
  
  try {
    // Step 1: Delete the fake providers by name
    const fakeProviders = ["Dr. Sarah Johnson", "Dr. Michael Chen"];
    
    const providersRef = collection(db, "familyProviders");
    
    for (const providerName of fakeProviders) {
      const providerQuery = query(
        providersRef,
        where("name", "==", providerName)
      );
      
      const querySnapshot = await getDocs(providerQuery);
      
      if (querySnapshot.empty) {
        console.log(`No provider found with name: ${providerName}`);
      } else {
        for (const doc of querySnapshot.docs) {
          await deleteDoc(doc.ref);
          console.log(`✅ Deleted provider: ${providerName}`);
        }
      }
    }
    
    // Step 2: Ensure Dr. Yearn exists
    const yearnQuery = query(
      providersRef,
      where("name", "==", "Dr. Yearn")
    );
    
    const yearnSnapshot = await getDocs(yearnQuery);
    
    if (yearnSnapshot.empty) {
      // Create Dr. Yearn
      const drYearn = {
        name: "Dr. Yearn",
        type: "medical",
        specialty: "Dentist",
        phone: "555-123-4567",
        email: "dr.yearn@example.com",
        address: "123 Dental Drive, Suite 100",
        notes: "Lillian's regular dentist",
        familyId: FAMILY_ID,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(providersRef, drYearn);
      console.log(`✅ Created Dr. Yearn with ID: ${docRef.id}`);
    } else {
      console.log("✅ Dr. Yearn already exists");
    }
    
    // Step 3: Check and clean up family providers
    const allProvidersQuery = query(
      providersRef,
      where("familyId", "==", FAMILY_ID)
    );
    
    const allProvidersSnapshot = await getDocs(allProvidersQuery);
    
    console.log(`\nRemaining providers (${allProvidersSnapshot.size}):`);
    allProvidersSnapshot.forEach(doc => {
      const provider = doc.data();
      console.log(`- ${provider.name} (${provider.specialty || 'Unknown specialty'})`);
    });
    
    console.log("\n🎉 Clean-up complete!");
    console.log("\nNext steps:");
    console.log("1. Refresh your application to see the changes");
    console.log("2. Try asking Allie to create a new provider");
    console.log("   Example: \"Add Dr. Smith as Lillian's pediatrician\"");
    
  } catch (error) {
    console.error("❌ Error during clean-up:", error);
  }
}

// Run the clean-up function
cleanFakeProvidersAndFixAllie()
  .then(() => console.log("✨ Script completed"))
  .catch(err => console.error("❌ Fatal error:", err));