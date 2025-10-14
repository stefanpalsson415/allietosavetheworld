// src/services/ProviderDebugger.js
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDoc, 
  doc,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';

/**
 * Debug tool for provider creation issues
 * This creates providers with detailed debugging information
 */
class ProviderDebugger {
  /**
   * Debug provider creation to test against Allie Chat
   * Creates a provider that should show up in the UI
   * @param {string} familyId - Family ID
   * @param {string} name - Provider name 
   * @returns {Promise<Object>} Debug results
   */
  static async debugCreateProvider(familyId, name = "Test Debug Provider") {
    const results = {
      success: false,
      providerId: null,
      steps: []
    };
    
    try {
      results.steps.push({ step: "start", timestamp: Date.now() });
      console.log(`🧪 ProviderDebugger: Creating debug provider for family ${familyId}`);
      
      // Generate unique identifier for this debug run
      const debugId = Date.now().toString().slice(-4);
      
      // Create provider data with debugging info
      const providerData = {
        name: `${name} (Debug ${debugId})`,
        type: "test",
        specialty: "Debug Provider",
        email: "debug@test.com",
        phone: "555-DEBUG",
        notes: `Debug provider created by ProviderDebugger at ${new Date().toISOString()}`,
        familyId: familyId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        testTimestamp: Date.now(),
        debugId: debugId,
        source: "provider_debugger"
      };
      
      results.steps.push({ 
        step: "data_prepared", 
        timestamp: Date.now(),
        data: { ...providerData, createdAt: new Date().toISOString() }
      });
      console.log("📝 Provider data:", providerData);
      
      // Add directly to the providers collection
      const providersRef = collection(db, "providers");
      results.steps.push({ 
        step: "collection_selected", 
        timestamp: Date.now(),
        collection: "providers"
      });
      console.log("📁 Using collection:", providersRef.path);
      
      // Add document
      const docRef = await addDoc(providersRef, providerData);
      const providerId = docRef.id;
      
      results.providerId = providerId;
      results.steps.push({ 
        step: "provider_added", 
        timestamp: Date.now(),
        providerId
      });
      console.log("✅ Provider created with ID:", providerId);
      
      // Verify creation
      const docSnapshot = await getDoc(doc(db, "providers", providerId));
      const exists = docSnapshot.exists();
      
      results.steps.push({ 
        step: "verify_exists", 
        timestamp: Date.now(),
        exists
      });
      console.log("✅ Provider exists in database:", exists);
      
      // Force UI update
      if (typeof window !== 'undefined') {
        console.log("🔄 Dispatching UI update events");
        
        // Create multiple events for different event handler implementations
        window.dispatchEvent(new CustomEvent('provider-added', { 
          detail: { providerId: providerId }
        }));
        
        window.dispatchEvent(new CustomEvent('provider-directly-added', { 
          detail: { providerId: providerId }
        }));
        
        window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
        
        // Also dispatch with full provider data
        window.dispatchEvent(new CustomEvent('provider-added', { 
          detail: { 
            providerId: providerId,
            provider: {
              id: providerId,
              ...providerData,
              _source: 'debugger'
            }
          }
        }));
        
        // Extra refresh to be sure
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('force-data-refresh'));
        }, 300);
        
        results.steps.push({ 
          step: "events_dispatched", 
          timestamp: Date.now()
        });
      }
      
      // Return success
      results.success = true;
      return results;
    } catch (error) {
      console.error("❌ Debug provider creation failed:", error);
      
      results.steps.push({ 
        step: "error", 
        timestamp: Date.now(),
        error: error.message,
        stack: error.stack
      });
      
      results.error = error.message;
      return results;
    }
  }
  
  /**
   * Check what providers exist for this family
   * @param {string} familyId - Family ID to check
   * @returns {Promise<object>} Results with providers from each collection
   */
  static async checkExistingProviders(familyId) {
    try {
      console.log(`🔍 ProviderDebugger: Checking providers for family ${familyId}`);

      const results = {
        timestamp: Date.now(),
        familyId: familyId,
        collections: {},
        allProviders: []
      };

      // Also try to get all stored family IDs
      let storedFamilyIds = [];
      if (typeof localStorage !== 'undefined') {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('selectedFamilyId') || key.startsWith('currentFamilyId') || key.startsWith('familyId')) {
            const value = localStorage.getItem(key);
            if (value && !storedFamilyIds.includes(value)) {
              storedFamilyIds.push(value);
            }
          }
        }
      }

      // Check for the current family ID in auth
      const auth = await import('firebase/auth').then(module => module.getAuth());
      if (auth.currentUser) {
        results.currentUser = auth.currentUser.uid;
      }

      results.possibleFamilyIds = [...storedFamilyIds];

      // FIRST APPROACH: Get all providers (no family filter) to see what's there
      try {
        // Check providers without family filter first
        const allProvidersQuery = query(
          collection(db, "providers"),
          orderBy("createdAt", "desc")
        );

        const allProvidersSnapshot = await getDocs(allProvidersQuery);
        const allProviders = [];

        // Build list of all family IDs found in providers
        const foundFamilyIds = new Set();

        allProvidersSnapshot.forEach(doc => {
          const data = doc.data();
          if (data.familyId && !foundFamilyIds.has(data.familyId)) {
            foundFamilyIds.add(data.familyId);
          }

          allProviders.push({
            id: doc.id,
            name: data.name,
            familyId: data.familyId,
            type: data.type,
            specialty: data.specialty
          });
        });

        console.log(`Found ${allProviders.length} total providers in "providers" collection`);
        results.allProviders = allProviders;

        // Add any found family IDs to our list
        foundFamilyIds.forEach(id => {
          if (!results.possibleFamilyIds.includes(id)) {
            results.possibleFamilyIds.push(id);
          }
        });
      } catch (error) {
        console.error("Error checking all providers:", error);
        results.allProvidersError = error.message;
      }

      // SECOND APPROACH: Try with the provided family ID
      try {
        const providersQuery = query(
          collection(db, "providers"),
          where("familyId", "==", familyId),
          orderBy("createdAt", "desc")
        );

        const providersSnapshot = await getDocs(providersQuery);
        const providers = [];

        providersSnapshot.forEach(doc => {
          const data = doc.data();
          providers.push({
            id: doc.id,
            name: data.name,
            type: data.type,
            specialty: data.specialty,
            source: data.source || 'unknown'
          });
        });

        console.log(`Found ${providers.length} providers in "providers" collection for family ${familyId}`);
        results.collections.providers = providers;
      } catch (error) {
        console.error("Error checking providers collection:", error);
        results.collections.providers = { error: error.message };
      }

      // Also check familyProviders collection
      try {
        const familyProvidersQuery = query(
          collection(db, "familyProviders"),
          where("familyId", "==", familyId),
          orderBy("createdAt", "desc")
        );

        const familyProvidersSnapshot = await getDocs(familyProvidersQuery);
        const familyProviders = [];

        familyProvidersSnapshot.forEach(doc => {
          const data = doc.data();
          familyProviders.push({
            id: doc.id,
            name: data.name,
            type: data.type,
            specialty: data.specialty,
            source: data.source || 'unknown'
          });
        });

        console.log(`Found ${familyProviders.length} providers in "familyProviders" collection for family ${familyId}`);
        results.collections.familyProviders = familyProviders;
      } catch (error) {
        console.error("Error checking familyProviders collection:", error);
        results.collections.familyProviders = { error: error.message };
      }

      // THIRD APPROACH: Check for each possible family ID we found
      results.familyIdResults = {};

      for (const possibleFamilyId of results.possibleFamilyIds) {
        if (possibleFamilyId === familyId) continue; // Skip the one we already checked

        try {
          const testQuery = query(
            collection(db, "providers"),
            where("familyId", "==", possibleFamilyId),
            orderBy("createdAt", "desc")
          );

          const testSnapshot = await getDocs(testQuery);
          const testProviders = [];

          testSnapshot.forEach(doc => {
            const data = doc.data();
            testProviders.push({
              id: doc.id,
              name: data.name,
              type: data.type || "unknown"
            });
          });

          if (testProviders.length > 0) {
            console.log(`Found ${testProviders.length} providers for alternate family ID: ${possibleFamilyId}`);
            results.familyIdResults[possibleFamilyId] = testProviders;
          }
        } catch (error) {
          console.error(`Error checking providers for family ID ${possibleFamilyId}:`, error);
        }
      }

      return results;
    } catch (error) {
      console.error("Error checking existing providers:", error);
      return { error: error.message };
    }
  }
}

// Create window access for debugging from console
if (typeof window !== 'undefined') {
  window.ProviderDebugger = ProviderDebugger;
}

export default ProviderDebugger;