// src/services/TestFirebaseCollections.js
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs,
  query, 
  where, 
  doc, 
  getDoc,
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Utility for testing providers added to Firebase collections
 * This helps debug issues with collection name mismatches
 */
class TestFirebaseCollections {
  /**
   * Test provider creation and verify it shows up in the Allie Drive
   * @param {string} familyId - Family ID to use for the test
   * @returns {Promise<Object>} Results of test with diagnostics
   */
  static async testProviderCreation(familyId) {
    const results = {
      success: false,
      tests: {},
      providers: {}
    };
    
    try {
      console.log("🔍 RUNNING FIREBASE COLLECTION TESTS");
      console.log(`Using familyId: ${familyId}`);
      
      // Create test marker for easy identification
      const testMarker = Date.now().toString().slice(-4);
      const testId = `test-${testMarker}`;
      
      // Test writing to familyProviders collection
      try {
        console.log("📝 Testing write to familyProviders collection");
        
        const providerData = {
          name: `Test Doctor ${testMarker}`,
          type: "medical",
          specialty: "Test Provider (familyProviders)",
          familyId: familyId,
          createdAt: serverTimestamp(),
          notes: `Test provider added to familyProviders collection at ${new Date().toISOString()}`
        };
        
        const docRef = await addDoc(collection(db, "familyProviders"), providerData);
        const familyProviderId = docRef.id;
        
        console.log(`✅ Added provider to familyProviders with ID: ${familyProviderId}`);
        
        // Verify it exists
        const docSnapshot = await getDoc(doc(db, "familyProviders", familyProviderId));
        
        results.tests.familyProviders = {
          success: docSnapshot.exists(),
          id: familyProviderId,
          data: providerData
        };
        
        // Add trigger for drive refresh
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('provider-added', {
            detail: { providerId: familyProviderId }
          }));
          window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
        }
      } catch (error) {
        console.error("❌ Error testing familyProviders:", error);
        results.tests.familyProviders = {
          success: false,
          error: error.message
        };
      }
      
      // Test querying both collections to see what's in there
      try {
        console.log("🔍 Querying familyProviders collection");
        const familyProvidersQuery = query(
          collection(db, "familyProviders"),
          where("familyId", "==", familyId)
        );
        
        const familyProvidersSnapshot = await getDocs(familyProvidersQuery);
        const familyProviders = [];
        
        familyProvidersSnapshot.forEach(doc => {
          familyProviders.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`📊 Found ${familyProviders.length} providers in familyProviders collection`);
        results.providers.familyProviders = familyProviders;
      } catch (error) {
        console.error("❌ Error querying familyProviders:", error);
        results.providers.familyProviders = { error: error.message };
      }
      
      // Also check the old "providers" collection to see if anything is there
      try {
        console.log("🔍 Querying providers collection (old/incorrect)");
        const providersQuery = query(
          collection(db, "providers"),
          where("familyId", "==", familyId)
        );
        
        const providersSnapshot = await getDocs(providersQuery);
        const oldProviders = [];
        
        providersSnapshot.forEach(doc => {
          oldProviders.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`📊 Found ${oldProviders.length} providers in old providers collection`);
        
        if (oldProviders.length > 0) {
          console.warn("⚠️ Data exists in the old 'providers' collection!");
          console.log("Consider migrating this data to 'familyProviders'");
        }
        
        results.providers.oldProviders = oldProviders;
      } catch (error) {
        console.error("❌ Error querying old providers collection:", error);
        results.providers.oldProviders = { error: error.message };
      }
      
      // Set overall success
      results.success = results.tests.familyProviders?.success === true;
      
      console.log("🏁 Firebase collection test complete");
      return results;
    } catch (error) {
      console.error("❌ Test failed with error:", error);
      results.error = error.message;
      return results;
    }
  }
  
  /**
   * Migrate providers from old "providers" collection to "familyProviders"
   * @param {string} familyId - Family ID to migrate
   * @returns {Promise<Object>} Results of migration with stats
   */
  static async migrateProviders(familyId) {
    const results = {
      success: false,
      migrated: 0,
      providers: []
    };
    
    try {
      console.log(`🔄 Starting migration for family ID: ${familyId}`);
      
      // Get all providers from old collection
      const providersQuery = query(
        collection(db, "providers"),
        where("familyId", "==", familyId)
      );
      
      const providersSnapshot = await getDocs(providersQuery);
      const oldProviders = [];
      
      providersSnapshot.forEach(doc => {
        oldProviders.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`📊 Found ${oldProviders.length} providers to migrate`);
      
      // Migrate each provider
      for (const oldProvider of oldProviders) {
        try {
          // Remove the id field
          const { id, ...providerData } = oldProvider;
          
          // Ensure created/updated timestamps
          if (!providerData.createdAt) {
            providerData.createdAt = serverTimestamp();
          }
          
          providerData.updatedAt = serverTimestamp();
          providerData.migrated = true;
          providerData.oldId = id;
          
          // Add to new collection
          const docRef = await addDoc(collection(db, "familyProviders"), providerData);
          console.log(`✅ Migrated provider ${id} to ${docRef.id}`);
          
          results.providers.push({
            oldId: id,
            newId: docRef.id,
            name: providerData.name
          });
          
          results.migrated++;
        } catch (error) {
          console.error(`❌ Error migrating provider ${oldProvider.id}:`, error);
        }
      }
      
      console.log(`🏁 Migration complete. Migrated ${results.migrated} of ${oldProviders.length} providers`);
      
      // Trigger UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
        window.dispatchEvent(new CustomEvent('force-data-refresh'));
      }
      
      results.success = results.migrated > 0;
      return results;
    } catch (error) {
      console.error("❌ Migration failed with error:", error);
      results.error = error.message;
      return results;
    }
  }
}

export default TestFirebaseCollections;