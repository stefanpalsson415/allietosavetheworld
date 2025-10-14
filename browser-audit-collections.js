// browser-audit-collections.js
// A simplified version that works in the browser

import { db } from './src/services/firebase.js';
import { 
  collection, 
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore';

// Check all provider-related collections for duplicates
const auditProviderCollections = async () => {
  try {
    console.log("🔍 Starting provider collections audit...");
    
    // Define the collections to check
    const collectionsToCheck = ['providers', 'familyProviders', 'healthcareProviders'];
    
    // Get a family ID from localStorage or use a default
    const familyId = localStorage.getItem('selectedFamilyId') || 
                     localStorage.getItem('currentFamilyId') || 
                     'm93tlovs6ty9sg8k0c8'; // Fallback ID
    
    console.log(`Using family ID: ${familyId}`);
    
    const results = {
      timestamp: new Date().toISOString(),
      familyId,
      collections: {}
    };
    
    // Check each collection
    for (const collectionName of collectionsToCheck) {
      try {
        console.log(`Checking collection: ${collectionName}`);
        
        // Query the collection
        const providersQuery = query(
          collection(db, collectionName),
          where("familyId", "==", familyId),
          orderBy("createdAt", "desc")
        );
        
        const snapshot = await getDocs(providersQuery);
        const providers = [];
        
        snapshot.forEach(doc => {
          const data = doc.data();
          providers.push({
            id: doc.id,
            name: data.name,
            type: data.type || "unknown",
            specialty: data.specialty || "",
            email: data.email || "",
            phone: data.phone || "",
            createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000).toISOString() : "unknown"
          });
        });
        
        console.log(`Found ${providers.length} providers in "${collectionName}" collection`);
        results.collections[collectionName] = providers;
      } catch (error) {
        console.error(`Error checking collection "${collectionName}":`, error);
        results.collections[collectionName] = { error: error.message };
      }
    }
    
    // Check for duplicates across collections
    results.duplicates = findDuplicateProviders(results.collections);
    
    // Generate recommendations
    results.recommendations = [];
    
    // Check if we have providers in multiple collections
    const collectionsWithProviders = Object.keys(results.collections)
      .filter(name => Array.isArray(results.collections[name]) && results.collections[name].length > 0);
    
    if (collectionsWithProviders.length > 1) {
      results.recommendations.push({
        issue: "providers_in_multiple_collections",
        description: `Found providers in multiple collections: ${collectionsWithProviders.join(', ')}`,
        solution: "Consolidate all providers into a single 'providers' collection"
      });
    }
    
    // Check which collection the UI is using
    if (typeof window !== 'undefined' && window.allieKnowledgeGraph) {
      const knowledgeGraphProviders = window.allieKnowledgeGraph.familyProviders || [];
      
      results.uiProviders = {
        count: knowledgeGraphProviders.length,
        providers: knowledgeGraphProviders.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type || "unknown",
          source: p._source || "unknown"
        }))
      };
      
      // Compare UI providers with database providers
      results.recommendations.push({
        issue: "ui_providers_analysis",
        description: `UI shows ${knowledgeGraphProviders.length} providers`,
        details: "Compare with database collections to find mismatches"
      });
    }
    
    // Return the results
    return results;
  } catch (error) {
    console.error("Error in audit:", error);
    return {
      error: error.message,
      stack: error.stack
    };
  }
};

// Helper function to find duplicate providers across collections
function findDuplicateProviders(collections) {
  const duplicates = [];
  const providerNames = {};
  
  // Check each collection
  for (const collectionName of Object.keys(collections)) {
    if (!Array.isArray(collections[collectionName])) continue;
    
    // Check each provider in the collection
    collections[collectionName].forEach(provider => {
      const name = provider.name;
      
      if (!name) return;
      
      if (!providerNames[name]) {
        providerNames[name] = [];
      }
      
      providerNames[name].push({
        collection: collectionName,
        id: provider.id,
        type: provider.type,
        specialty: provider.specialty
      });
    });
  }
  
  // Find duplicates (providers in multiple collections)
  Object.keys(providerNames).forEach(name => {
    if (providerNames[name].length > 1) {
      duplicates.push({
        name,
        instances: providerNames[name]
      });
    }
  });
  
  return duplicates;
}

// Create a simple test provider to see where it shows up
const createTestProvider = async (collectionName) => {
  try {
    console.log(`Creating test provider in '${collectionName}'...`);
    
    // Get a family ID from localStorage or use a default
    const familyId = localStorage.getItem('selectedFamilyId') || 
                     localStorage.getItem('currentFamilyId') || 
                     'm93tlovs6ty9sg8k0c8'; // Fallback ID
    
    // Create a test provider with timestamp for uniqueness
    const timestamp = new Date().toISOString();
    const testProvider = {
      name: `Test Provider in ${collectionName} (${timestamp.substring(11, 19)})`,
      type: "test",
      specialty: "Test Provider",
      email: "test@example.com",
      phone: "555-TEST",
      notes: `Test provider created in ${collectionName} at ${timestamp}`,
      familyId: familyId,
      createdAt: new Date(),
      updatedAt: new Date(),
      source: "test_script"
    };
    
    // Add to the specified collection
    const { addDoc } = await import('firebase/firestore');
    const providersRef = collection(db, collectionName);
    const docRef = await addDoc(providersRef, testProvider);
    
    console.log(`✅ Created test provider in '${collectionName}' with ID: ${docRef.id}`);
    
    // Force UI refresh
    window.dispatchEvent(new CustomEvent('provider-added'));
    window.dispatchEvent(new CustomEvent('force-data-refresh'));
    
    return {
      success: true,
      providerId: docRef.id,
      provider: testProvider
    };
  } catch (error) {
    console.error(`Error creating test provider in '${collectionName}':`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Expose functions to window for browser console testing
window.auditProviderCollections = auditProviderCollections;
window.createTestProvider = createTestProvider;

export { auditProviderCollections, createTestProvider };