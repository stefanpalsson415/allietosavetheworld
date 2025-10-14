// src/services/DebugProviderStorage.js
import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  addDoc,
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Debug helper for provider storage issues
 * This utility helps diagnose collection naming issues
 */
class DebugProviderStorage {
  /**
   * Check if providers exist in various collections
   * @param {string} familyId - Family ID to check
   * @returns {Promise<object>} Summary of providers in each collection
   */
  static async checkCollections(familyId) {
    try {
      console.log(`🔍 Checking providers for family: ${familyId}`);
      
      const results = {
        timestamp: new Date().toISOString(),
        collections: {}
      };
      
      // Collections to check
      const collectionNames = [
        "providers",
        "familyProviders",
        "healthcareProviders"
      ];
      
      // Check each collection
      for (const collectionName of collectionNames) {
        try {
          const providersQuery = query(
            collection(db, collectionName),
            where("familyId", "==", familyId),
            orderBy("createdAt", "desc")
          );
          
          const snapshot = await getDocs(providersQuery);
          const providers = [];
          
          snapshot.forEach(doc => {
            providers.push({
              id: doc.id,
              name: doc.data().name,
              type: doc.data().type,
              createdAt: doc.data().createdAt
            });
          });
          
          console.log(`Found ${providers.length} providers in "${collectionName}" collection`);
          
          results.collections[collectionName] = {
            count: providers.length,
            providers: providers
          };
        } catch (error) {
          console.error(`Error checking "${collectionName}" collection:`, error);
          results.collections[collectionName] = {
            error: error.message
          };
        }
      }
      
      return results;
    } catch (error) {
      console.error("Collection check failed:", error);
      return { error: error.message };
    }
  }
  
  /**
   * Test provider creation in the specified collection
   * @param {string} familyId - Family ID
   * @param {string} collectionName - Collection to use (providers, familyProviders, etc.)
   * @returns {Promise<object>} Results of provider creation
   */
  static async testProviderCreation(familyId, collectionName = "providers") {
    try {
      console.log(`🧪 Testing provider creation in "${collectionName}" collection`);
      
      // Generate test marker
      const timestamp = Date.now();
      const marker = timestamp.toString().slice(-5);
      
      // Create test provider
      const provider = {
        name: `Test Provider ${marker}`,
        type: "medical",
        specialty: `Test in ${collectionName}`,
        familyId: familyId,
        createdAt: serverTimestamp(),
        notes: `Test provider created in ${collectionName} at ${new Date(timestamp).toISOString()}`
      };
      
      console.log("Provider data:", provider);
      
      // Add to collection
      const docRef = await addDoc(collection(db, collectionName), provider);
      const providerId = docRef.id;
      
      console.log(`✅ Provider added to ${collectionName} with ID: ${providerId}`);
      
      // Trigger UI refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('provider-added', {
          detail: { providerId }
        }));
        window.dispatchEvent(new CustomEvent('directory-refresh-needed'));
      }
      
      return {
        success: true,
        providerId,
        collectionName,
        provider
      };
    } catch (error) {
      console.error(`Error creating provider in "${collectionName}":`, error);
      return { 
        success: false, 
        error: error.message,
        collectionName
      };
    }
  }
}

export default DebugProviderStorage;