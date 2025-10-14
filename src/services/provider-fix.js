// IMPROVED: Enhanced version of provider creation utility
// Import Firestore functions first (fix for ESLint error)
import {
  collection,
  addDoc,
  serverTimestamp,
  setDoc,
  doc,
  getDocs,
  query,
  where,
  deleteDoc  // Added missing import for deleteDoc
} from 'firebase/firestore';

// Then import Firebase instance
import { db, auth } from './firebase';

// Start logging
console.log("🔍 LOADING provider-fix.js - IMPROVED DUAL COLLECTION VERSION");

/**
 * Creates a provider using both Firestore and localStorage
 * This improved version ensures data is saved to both providers and familyProviders collections
 */
window.createProviderFromAllie = async (providerInfo) => {
  console.log("📋 Creating provider using DUAL-COLLECTION method:", providerInfo);

  if (!providerInfo || !providerInfo.name) {
    console.error("❌ Invalid provider data");
    return { success: false, error: "Invalid provider data" };
  }

  try {
    // Get the current family ID from localStorage with fallbacks
    const familyId = localStorage.getItem('selectedFamilyId') ||
                     localStorage.getItem('currentFamilyId') ||
                     localStorage.getItem('familyId') ||
                     localStorage.getItem('lastUsedFamilyId') ||
                     'm93tlovs6ty9sg8k0c8'; // Fallback ID from the codebase

    // Get userId with fallbacks
    const userId = auth.currentUser?.uid ||
                  localStorage.getItem('userId') ||
                  'system';

    console.log("🔑 Auth Context:", { familyId, userId });

    // Create provider object
    const provider = {
      name: providerInfo.name,
      type: providerInfo.type || 'medical',
      phone: providerInfo.phone || '',
      email: providerInfo.email || '',
      address: providerInfo.address || '',
      specialty: providerInfo.specialty || providerInfo.type || 'General',
      familyId: familyId,
      childName: providerInfo.childName || null,
      forChild: providerInfo.forChild || providerInfo.childName || null,
      notes: providerInfo.notes || `Added by Allie Chat on ${new Date().toLocaleDateString()}`,
      createdBy: userId,
      source: 'allie-chat'
    };

    console.log("📋 Provider data to save:", provider);

    // FIRESTORE FIRST APPROACH: Try to save to Firestore first
    let firestoreSuccess = false;
    let providerId = null;

    try {
      console.log("🔥 Attempting to save to both Firestore collections");

      // 1. First add to "providers" collection (primary collection)
      const providersCollection = collection(db, "providers");
      const docRef = await addDoc(providersCollection, {
        ...provider,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      providerId = docRef.id;
      console.log("✅ Provider saved to 'providers' collection with ID:", providerId);

      // 2. Also add to "familyProviders" collection (for backward compatibility)
      try {
        const familyProvidersCollection = collection(db, "familyProviders");
        const fpDocRef = await addDoc(familyProvidersCollection, {
          ...provider,
          mirrorOf: providerId, // Track that this is a mirror of the main provider
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        console.log("✅ Provider also saved to 'familyProviders' collection with ID:", fpDocRef.id);
      } catch (mirrorError) {
        console.error("❌ Error mirroring to familyProviders:", mirrorError);
        // Continue even if mirror fails - at least we saved to the primary collection
      }

      firestoreSuccess = true;
    } catch (firestoreError) {
      console.error("❌ Firestore save failed:", firestoreError);
      console.log("⚠️ Falling back to localStorage only");
    }

    // LOCAL STORAGE FALLBACK: Always save to localStorage as backup
    // Generate a custom ID for localStorage if Firestore failed
    const localId = firestoreSuccess ? providerId : `local-provider-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Save to localStorage
    try {
      // Get existing providers
      let localProviders = [];
      const storedProviders = localStorage.getItem('localProviders');

      if (storedProviders) {
        try {
          localProviders = JSON.parse(storedProviders);
          if (!Array.isArray(localProviders)) localProviders = [];
        } catch (e) {
          console.error("Error parsing stored providers:", e);
          localProviders = [];
        }
      }

      // Add new provider with ID
      const localProvider = {
        ...provider,
        id: localId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        savedToFirestore: firestoreSuccess
      };

      localProviders.push(localProvider);

      // Save back to localStorage
      localStorage.setItem('localProviders', JSON.stringify(localProviders));
      console.log("✅ Provider saved to localStorage");

      // Also save to window variable for this session
      if (!window.allieCreatedProviders) window.allieCreatedProviders = [];
      window.allieCreatedProviders.push(localProvider);

      // Save as lastProvider for easy retrieval
      localStorage.setItem('lastProvider', JSON.stringify(localProvider));
    } catch (storageError) {
      console.error("❌ Error saving to localStorage:", storageError);
    }

    // Use the providerId from Firestore if available, otherwise the local ID
    const finalProviderId = providerId || localId;

    // Dispatch events to notify UI components
    try {
      // Main events for provider directory - include full provider object for better UI handling
      window.dispatchEvent(new CustomEvent('provider-added', {
        detail: {
          providerId: finalProviderId,
          provider: {
            ...provider,
            id: finalProviderId
          },
          fromFirestore: firestoreSuccess
        }
      }));

      // Additional events for UI update
      window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
      window.dispatchEvent(new CustomEvent('force-data-refresh'));

      // Delayed events to catch race conditions
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
      }, 500);
    } catch (eventError) {
      console.error("❌ Error dispatching events:", eventError);
    }

    // Return success with appropriate message
    const resultMessage = firestoreSuccess ?
      `Successfully added ${provider.name} to your provider directory.` :
      `Added ${provider.name} to your provider directory (saved locally only).`;

    return {
      success: true,
      id: finalProviderId,
      provider: {
        ...provider,
        id: finalProviderId
      },
      savedToFirestore: firestoreSuccess,
      message: resultMessage
    };
  } catch (error) {
    console.error("❌ Error creating provider:", error);

    // Last-ditch effort - store minimal info
    try {
      localStorage.setItem('lastProviderAttempt', JSON.stringify({
        name: providerInfo.name,
        error: error.message,
        time: new Date().toISOString()
      }));
    } catch (e) {
      // Nothing more we can do
    }

    return {
      success: false,
      error: error.message
    };
  }
};

// Enhanced testing functions
const setupProviderFix = () => {
  console.log("✅ DUAL-COLLECTION Provider fix loaded");

  // Test creation function with more options
  window.testProviderCreation = (name = "Dr. Test Provider", options = {}) => {
    console.log("🧪 Testing provider creation with name:", name);

    // Create test provider with default values that can be overridden
    return window.createProviderFromAllie({
      name,
      type: options.type || "medical",
      specialty: options.specialty || "Pediatrician",
      phone: options.phone || "(555) 123-4567",
      email: options.email || "test@example.com",
      childName: options.childName || null,
      forChild: options.forChild || options.childName || null,
      notes: options.notes || "Test provider created via window.testProviderCreation()",
      ...options
    });
  };

  // Comprehensive debug info function
  window.debugProviders = async () => {
    let storedProviders = [];
    try {
      const sp = localStorage.getItem('localProviders');
      if (sp) storedProviders = JSON.parse(sp);
    } catch (e) {
      console.error("Error parsing providers:", e);
    }

    // Try to fetch Firebase providers too
    let firestoreProviders = [];
    try {
      if (db) {
        const familyId = localStorage.getItem('selectedFamilyId') ||
                       localStorage.getItem('currentFamilyId') ||
                       localStorage.getItem('familyId') ||
                       localStorage.getItem('lastUsedFamilyId') ||
                       'm93tlovs6ty9sg8k0c8';

        console.log(`🔍 Checking Firestore with familyId: ${familyId}`);

        // Check providers collection
        const providersQuery = query(
          collection(db, "providers"),
          where("familyId", "==", familyId)
        );

        const providersSnapshot = await getDocs(providersQuery);
        firestoreProviders = providersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          source: "providers"
        }));

        // Also check familyProviders
        const fpQuery = query(
          collection(db, "familyProviders"),
          where("familyId", "==", familyId)
        );

        const fpSnapshot = await getDocs(fpQuery);
        const familyProviders = fpSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          source: "familyProviders"
        }));

        // Add unique providers
        for (const fp of familyProviders) {
          // Check if we already have this provider by name
          const existingProvider = firestoreProviders.find(p => p.name === fp.name);
          if (!existingProvider) {
            firestoreProviders.push(fp);
          }
        }
      }
    } catch (firestoreError) {
      console.error("❌ Error fetching from Firestore:", firestoreError);
    }

    console.log("🔍 PROVIDER DEBUG INFO:");
    console.log("📋 Local storage providers:", storedProviders.length);
    console.log("📋 Memory providers:", (window.allieCreatedProviders || []).length);
    console.log("📋 Firestore providers:", firestoreProviders.length);

    // Format some counts by provider type
    try {
      const providersByType = {};

      // Count localStorage providers by type
      for (const p of storedProviders) {
        const type = p.type || 'unknown';
        providersByType[type] = (providersByType[type] || 0) + 1;
      }

      console.log("📊 Provider types in localStorage:", providersByType);

      // If we have Firestore providers, show counts of those too
      if (firestoreProviders.length > 0) {
        const fsProvidersByType = {};
        for (const p of firestoreProviders) {
          const type = p.type || 'unknown';
          fsProvidersByType[type] = (fsProvidersByType[type] || 0) + 1;
        }

        console.log("📊 Provider types in Firestore:", fsProvidersByType);
      }
    } catch (e) {
      console.warn("Error processing provider stats:", e);
    }

    return {
      localStorage: storedProviders,
      memory: window.allieCreatedProviders || [],
      firestore: firestoreProviders,
      counts: {
        localStorage: storedProviders.length,
        memory: (window.allieCreatedProviders || []).length,
        firestore: firestoreProviders.length
      }
    };
  };

  // Test Firebase permissions specifically
  window.testFirebaseProviderPermissions = async () => {
    try {
      console.log("🧪 Testing Firebase provider permissions...");

      // Get family ID with fallbacks
      const familyId = localStorage.getItem('selectedFamilyId') ||
                     localStorage.getItem('currentFamilyId') ||
                     localStorage.getItem('familyId') ||
                     localStorage.getItem('lastUsedFamilyId') ||
                     'm93tlovs6ty9sg8k0c8';

      // Get user ID with fallbacks
      const userId = auth.currentUser?.uid ||
                   localStorage.getItem('userId') ||
                   'system';

      console.log(`🔑 Testing with familyId: ${familyId}, userId: ${userId}`);

      // Create test provider
      const testProvider = {
        name: `Test Provider ${new Date().toLocaleTimeString()}`,
        type: "test",
        specialty: "Firebase Permission Test",
        familyId: familyId,
        createdBy: userId,
        notes: "Created by testFirebaseProviderPermissions - should be deleted automatically",
        isTestProvider: true
      };

      // Try adding to providers collection first
      const providersRef = collection(db, "providers");
      const docRef = await addDoc(providersRef, {
        ...testProvider,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log("✅ Successfully added to 'providers' collection with ID:", docRef.id);

      // Try adding to familyProviders collection
      const familyProvidersRef = collection(db, "familyProviders");
      const fpDocRef = await addDoc(familyProvidersRef, {
        ...testProvider,
        mirrorOf: docRef.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      console.log("✅ Successfully added to 'familyProviders' collection with ID:", fpDocRef.id);

      // Clean up test providers
      await deleteDoc(doc(db, "providers", docRef.id));
      await deleteDoc(doc(db, "familyProviders", fpDocRef.id));

      console.log("✅ Test providers cleaned up successfully");

      return {
        success: true,
        message: "Firebase provider permissions test passed successfully!",
        providersId: docRef.id,
        familyProvidersId: fpDocRef.id
      };
    } catch (error) {
      console.error("❌ Firebase permission test failed:", error);
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  };

  // Create global tracking array
  if (!window.allieCreatedProviders) window.allieCreatedProviders = [];

  console.log("🧪 You can test by running window.testProviderCreation('Dr. Smith')");
  console.log("🧪 Test Firebase permissions with window.testFirebaseProviderPermissions()");
  console.log("🔍 Debug with window.debugProviders()");
};

// Run setup
setupProviderFix();

export default setupProviderFix;