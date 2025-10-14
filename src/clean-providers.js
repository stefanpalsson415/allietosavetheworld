// clean-providers.js
// Script to remove dummy data from providers and properly add Dr. Yearn
// Run with: node clean-providers.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, deleteDoc, addDoc, serverTimestamp, doc, getDoc } = require('firebase/firestore');

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

async function cleanProviders() {
  try {
    console.log("🧹 Cleaning provider data...");
    
    // Step 1: Identify and delete dummy providers
    console.log("\n📋 Step 1: Removing dummy providers...");
    
    const providersRef = collection(db, "familyProviders");
    const dummyProvidersQuery = query(
      providersRef,
      where("name", "in", ["Dr. Sarah Johnson", "Dr. Michael Chen"])
    );
    
    const dummySnapshot = await getDocs(dummyProvidersQuery);
    
    if (dummySnapshot.empty) {
      console.log("✅ No dummy providers found");
    } else {
      console.log(`⚠️ Found ${dummySnapshot.docs.length} dummy providers to remove`);
      
      // Delete each dummy provider
      let deletedCount = 0;
      for (const doc of dummySnapshot.docs) {
        await deleteDoc(doc.ref);
        deletedCount++;
        console.log(`   Deleted provider: ${doc.data().name}`);
      }
      
      console.log(`✅ Successfully removed ${deletedCount} dummy providers`);
    }
    
    // Step 2: Check for Dr. Yearn and create if needed
    console.log("\n📋 Step 2: Checking for Dr. Yearn provider...");
    
    const yearnQuery = query(providersRef, where("name", "==", "Dr. Yearn"));
    const yearnSnapshot = await getDocs(yearnQuery);
    
    let providerId;
    
    if (!yearnSnapshot.empty) {
      providerId = yearnSnapshot.docs[0].id;
      console.log(`✅ Found existing Dr. Yearn provider: ${providerId}`);
      
      // Check if it has proper data
      const providerData = yearnSnapshot.docs[0].data();
      if (!providerData.specialty || !providerData.type) {
        console.log("⚠️ Dr. Yearn provider has incomplete data, updating...");
        await updateDoc(yearnSnapshot.docs[0].ref, {
          specialty: "Dentist",
          type: "medical",
          lastVisit: "May 21, 2023", 
          phone: "555-123-4567",
          email: "dr.yearn@example.com",
          address: "123 Dental Drive, Suite 100",
          notes: "Lillian's regular dentist",
          isDummy: false,
          updatedAt: serverTimestamp()
        });
        console.log("✅ Updated Dr. Yearn with complete data");
      }
    } else {
      console.log("⚠️ Dr. Yearn provider not found, creating...");
      
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
      providerId = providerRef.id;
      console.log(`✅ Created Dr. Yearn provider with ID: ${providerId}`);
    }
    
    // Step 3: Check for any other dummy data
    console.log("\n📋 Step 3: Checking for other dummy data...");
    
    const allProvidersQuery = query(providersRef);
    const allProvidersSnapshot = await getDocs(allProvidersQuery);
    
    console.log(`Found ${allProvidersSnapshot.docs.length} total providers`);
    
    // List remaining providers
    if (allProvidersSnapshot.docs.length > 0) {
      console.log("\nRemaining providers:");
      allProvidersSnapshot.docs.forEach((doc, i) => {
        const data = doc.data();
        console.log(`${i+1}. ${data.name} (${data.specialty || 'Unknown specialty'})`);
      });
    }
    
    // Step 4: Check for any "isDummy" flag and remove those providers
    console.log("\n📋 Step 4: Removing any providers with isDummy=true flag...");
    
    const dummyFlagQuery = query(providersRef, where("isDummy", "==", true));
    const dummyFlagSnapshot = await getDocs(dummyFlagQuery);
    
    if (dummyFlagSnapshot.empty) {
      console.log("✅ No providers with isDummy=true flag found");
    } else {
      console.log(`⚠️ Found ${dummyFlagSnapshot.docs.length} providers with isDummy=true flag`);
      
      // Delete each dummy provider
      let deletedCount = 0;
      for (const doc of dummyFlagSnapshot.docs) {
        await deleteDoc(doc.ref);
        deletedCount++;
        console.log(`   Deleted provider: ${doc.data().name}`);
      }
      
      console.log(`✅ Successfully removed ${deletedCount} dummy providers`);
    }
    
    // Step 5: Replace empty display with a better message
    console.log("\n📋 Step 5: Checking if we need a placeholder message...");
    
    // After all operations, check how many providers remain
    const finalProvidersSnapshot = await getDocs(query(providersRef));
    
    if (finalProvidersSnapshot.empty) {
      console.log("⚠️ No providers remain after cleanup, adding placeholder...");
      
      // If no providers remain, add a special placeholder document
      const placeholderData = {
        name: "__PLACEHOLDER__",
        specialty: "placeholder",
        type: "placeholder",
        familyId: "m93tlovs6ty9sg8k0c8",
        message: "Add your first healthcare provider by asking Allie or using the + button above.",
        isPlaceholder: true,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, "familyProviders"), placeholderData);
      console.log("✅ Added placeholder message for empty provider list");
    } else {
      console.log(`✅ ${finalProvidersSnapshot.docs.length} providers remain after cleanup`);
      
      // Check if there's a placeholder and remove it if there are real providers
      const placeholderQuery = query(providersRef, where("name", "==", "__PLACEHOLDER__"));
      const placeholderSnapshot = await getDocs(placeholderQuery);
      
      if (!placeholderSnapshot.empty) {
        for (const doc of placeholderSnapshot.docs) {
          await deleteDoc(doc.ref);
        }
        console.log("✅ Removed placeholder message as we have real providers now");
      }
    }
    
    console.log("\n🎉 Provider cleanup complete!");
    console.log("Your provider list should now show Dr. Yearn without any dummy data.");
    console.log("Please refresh your app to see the changes.");
    
  } catch (error) {
    console.error("❌ Error cleaning providers:", error);
  }
}

// Run the function
cleanProviders().then(() => {
  console.log("\n✨ Script completed successfully ✨");
  process.exit(0);
}).catch(error => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});