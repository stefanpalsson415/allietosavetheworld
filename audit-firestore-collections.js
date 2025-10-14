// audit-firestore-collections.js
// This script analyzes Firestore collections to identify similar/duplicate variables and schema inconsistencies

// Dynamic imports to support both browser and Node.js environments
let db;
let firestore;

// Set up a dynamic import function
async function setupFirebase() {
  try {
    // For browser environment
    if (typeof window !== 'undefined') {
      const firebaseModule = await import('./src/services/firebase.js');
      db = firebaseModule.db;

      const firestoreModule = await import('firebase/firestore');
      return {
        db,
        collection: firestoreModule.collection,
        getDocs: firestoreModule.getDocs,
        listCollections: firestoreModule.listCollections
      };
    } else {
      // For Node.js environment
      console.log("Running in Node.js environment");
      const { initializeApp } = await import('firebase/app');
      const { getFirestore, collection, getDocs, listCollections } = await import('firebase/firestore');

      // You'll need to provide your Firebase config here
      const firebaseConfig = {
        // Add your Firebase config here
        // apiKey: "...",
        // authDomain: "...",
        // projectId: "...",
        // storageBucket: "...",
        // messagingSenderId: "...",
        // appId: "..."
      };

      // Initialize Firebase
      const app = initializeApp(firebaseConfig);
      db = getFirestore(app);

      return {
        db,
        collection,
        getDocs,
        listCollections
      };
    }
  } catch (error) {
    console.error("Error setting up Firebase:", error);
    throw error;
  }
}

// Analyze all Firestore collections and their schemas
const auditFirestoreCollections = async () => {
  try {
    console.log("🔍 Starting Firestore collections audit...");

    // Set up Firebase first
    const { db, collection, getDocs, listCollections } = await setupFirebase();

    // Get all collections
    const collectionsSnapshot = await listCollections(db);
    console.log(`Found ${collectionsSnapshot.length} collections in Firestore`);

    const results = {
      timestamp: new Date().toISOString(),
      collectionCount: collectionsSnapshot.length,
      collections: {},
      similarNamedCollections: [],
      similarSchemaCollections: [],
      recommendedMerges: []
    };

    // Analyze each collection
    for (const collectionRef of collectionsSnapshot) {
      const collectionName = collectionRef.id;
      console.log(`Analyzing collection: ${collectionName}`);

      // Get a sample of documents (limit to 5 for efficiency)
      const docsSnapshot = await getDocs(collection(db, collectionName));
      
      const documents = [];
      const schemaMap = {}; // Track fields and their types
      let documentCount = 0;
      
      docsSnapshot.forEach(doc => {
        documentCount++;
        
        // Only store up to 5 sample documents to avoid memory issues
        if (documents.length < 5) {
          const data = doc.data();
          documents.push({
            id: doc.id,
            data: data
          });
          
          // Track schema fields and types
          Object.keys(data).forEach(field => {
            const type = typeof data[field];
            schemaMap[field] = schemaMap[field] || {};
            schemaMap[field][type] = (schemaMap[field][type] || 0) + 1;
          });
        }
      });
      
      // Store collection info
      results.collections[collectionName] = {
        documentCount,
        documentSample: documents,
        schema: schemaMap,
        fields: Object.keys(schemaMap)
      };
    }
    
    // Find similarly named collections
    const collectionNames = Object.keys(results.collections);
    
    // Check for collections with similar names
    for (let i = 0; i < collectionNames.length; i++) {
      for (let j = i + 1; j < collectionNames.length; j++) {
        const nameA = collectionNames[i];
        const nameB = collectionNames[j];
        
        // Check for similar naming patterns
        if (
          (nameA.includes(nameB) || nameB.includes(nameA)) ||
          (nameA.toLowerCase().includes('provider') && nameB.toLowerCase().includes('provider')) ||
          (nameA.toLowerCase().includes('family') && nameB.toLowerCase().includes('family')) ||
          (nameA.toLowerCase().includes('event') && nameB.toLowerCase().includes('event')) ||
          (nameA.toLowerCase().includes('task') && nameB.toLowerCase().includes('task')) ||
          (nameA.toLowerCase().includes('document') && nameB.toLowerCase().includes('document')) ||
          (nameA.toLowerCase().includes('feedback') && nameB.toLowerCase().includes('feedback'))
        ) {
          results.similarNamedCollections.push({
            collections: [nameA, nameB],
            reason: `Similar naming pattern`
          });
        }
      }
    }
    
    // Check for collections with similar schemas
    for (let i = 0; i < collectionNames.length; i++) {
      for (let j = i + 1; j < collectionNames.length; j++) {
        const nameA = collectionNames[i];
        const nameB = collectionNames[j];
        
        const fieldsA = results.collections[nameA].fields;
        const fieldsB = results.collections[nameB].fields;
        
        // Find common fields
        const commonFields = fieldsA.filter(field => fieldsB.includes(field));
        
        // If they share several important fields, they might be similar
        const importantFields = ['familyId', 'userId', 'createdAt', 'name', 'type'];
        const commonImportantFields = commonFields.filter(field => importantFields.includes(field));
        
        if (
          // Either they share many common fields
          (commonFields.length >= 4 && commonFields.length / Math.max(fieldsA.length, fieldsB.length) > 0.3) ||
          // Or they share important identifier fields
          (commonImportantFields.length >= 2)
        ) {
          results.similarSchemaCollections.push({
            collections: [nameA, nameB],
            commonFields,
            commonImportantFields,
            similarity: commonFields.length / Math.max(fieldsA.length, fieldsB.length)
          });
        }
      }
    }
    
    // Generate specific recommendations for provider collections
    const providerCollections = collectionNames.filter(name => 
      name.toLowerCase().includes('provider'));
    
    if (providerCollections.length > 1) {
      results.recommendedMerges.push({
        type: 'provider_collections',
        collections: providerCollections,
        targetCollection: 'providers',
        reason: 'Multiple provider collections with similar schemas',
        action: 'Merge all provider data into a single providers collection'
      });
    }
    
    // Check for event-related collections
    const eventCollections = collectionNames.filter(name => 
      name.toLowerCase().includes('event'));
    
    if (eventCollections.length > 1) {
      results.recommendedMerges.push({
        type: 'event_collections',
        collections: eventCollections,
        targetCollection: 'events',
        reason: 'Multiple event collections with similar schemas',
        action: 'Consider consolidating event data into a single collection with a type field'
      });
    }
    
    // Check for feedback-related collections
    const feedbackCollections = collectionNames.filter(name => 
      name.toLowerCase().includes('feedback'));
    
    if (feedbackCollections.length > 1) {
      results.recommendedMerges.push({
        type: 'feedback_collections',
        collections: feedbackCollections,
        targetCollection: 'feedback',
        reason: 'Multiple feedback collections with similar purpose',
        action: 'Consider consolidating feedback into a single collection with a type field'
      });
    }
    
    // Add specific recommendations for family-related collections
    const familyCollections = collectionNames.filter(name => 
      name.toLowerCase().includes('family'));
    
    if (familyCollections.length > 2) { // Allow 'families' and maybe one other
      results.recommendedMerges.push({
        type: 'family_collections',
        collections: familyCollections,
        targetCollection: 'families',
        reason: 'Multiple family-related collections',
        action: 'Consider reorganizing family data into a more consistent structure'
      });
    }
    
    console.log("✅ Firestore collections audit completed!");
    return results;
  } catch (error) {
    console.error("❌ Error auditing Firestore collections:", error);
    return {
      error: error.message,
      stack: error.stack
    };
  }
};

// Create a more detailed analysis of a specific collection
const analyzeCollection = async (collectionName) => {
  try {
    console.log(`🔍 Analyzing collection: ${collectionName}`);

    // Set up Firebase first
    const { db, collection, getDocs } = await setupFirebase();

    const docsSnapshot = await getDocs(collection(db, collectionName));
    
    const results = {
      collection: collectionName,
      documentCount: docsSnapshot.size,
      fields: {},
      keyCounts: {},
      valueDistribution: {},
      issues: []
    };
    
    // First pass: identify all fields and their types
    docsSnapshot.forEach(doc => {
      const data = doc.data();
      
      // Track all keys/fields used
      Object.keys(data).forEach(field => {
        results.keyCounts[field] = (results.keyCounts[field] || 0) + 1;
        
        const type = typeof data[field];
        results.fields[field] = results.fields[field] || {};
        results.fields[field][type] = (results.fields[field][type] || 0) + 1;
        
        // For string fields, track common values (careful with PII)
        if (type === 'string' && ['type', 'status', 'category'].includes(field)) {
          results.valueDistribution[field] = results.valueDistribution[field] || {};
          const value = data[field];
          if (value) {
            results.valueDistribution[field][value] = 
              (results.valueDistribution[field][value] || 0) + 1;
          }
        }
      });
    });
    
    // Identify schema inconsistencies
    const totalDocs = docsSnapshot.size;
    
    // Fields that aren't in all documents
    Object.keys(results.keyCounts).forEach(field => {
      const count = results.keyCounts[field];
      
      if (count < totalDocs * 0.8) { // Less than 80% of documents have this field
        results.issues.push({
          field,
          issue: 'inconsistent_usage',
          description: `Field "${field}" only appears in ${count}/${totalDocs} documents (${Math.round(count/totalDocs*100)}%)`,
          severity: count < totalDocs * 0.5 ? 'high' : 'medium'
        });
      }
    });
    
    // Fields with inconsistent types
    Object.keys(results.fields).forEach(field => {
      const types = Object.keys(results.fields[field]);
      
      if (types.length > 1) {
        results.issues.push({
          field,
          issue: 'inconsistent_types',
          description: `Field "${field}" has multiple types: ${types.join(', ')}`,
          typeDistribution: results.fields[field],
          severity: 'high'
        });
      }
    });
    
    console.log(`✅ Analysis completed for collection: ${collectionName}`);
    console.log(`Found ${results.issues.length} potential issues`);
    
    return results;
  } catch (error) {
    console.error(`❌ Error analyzing collection "${collectionName}":`, error);
    return {
      error: error.message,
      stack: error.stack
    };
  }
};

// Generate a migration plan for collections that should be merged
const generateMigrationPlan = async (sourceCollections, targetCollection) => {
  try {
    console.log(`🔄 Generating migration plan from ${sourceCollections.join(', ')} to ${targetCollection}`);

    // Set up Firebase first
    const { db, collection, getDocs } = await setupFirebase();

    const results = {
      timestamp: new Date().toISOString(),
      sourceCollections,
      targetCollection,
      documentCounts: {},
      fieldMappings: {},
      steps: [],
      sampleMigrations: []
    };

    // Analyze each source collection
    for (const collectionName of sourceCollections) {
      if (collectionName === targetCollection) continue;

      console.log(`Analyzing source collection: ${collectionName}`);

      const docsSnapshot = await getDocs(collection(db, collectionName));
      results.documentCounts[collectionName] = docsSnapshot.size;
      
      // Determine field mapping for this collection
      const fieldMapping = {};
      let sampleDoc = null;
      
      docsSnapshot.forEach(doc => {
        const data = doc.data();
        
        // Save first document as sample
        if (!sampleDoc) {
          sampleDoc = {
            id: doc.id,
            data: data
          };
        }
        
        // Identify fields to map
        Object.keys(data).forEach(field => {
          // Default mapping is direct (same field name)
          if (!fieldMapping[field]) {
            fieldMapping[field] = field;
          }
        });
      });
      
      // Store field mapping for this collection
      results.fieldMappings[collectionName] = fieldMapping;
      
      // Create sample migration
      if (sampleDoc) {
        const migratedData = {};
        
        // Apply field mappings
        Object.keys(sampleDoc.data).forEach(field => {
          const targetField = fieldMapping[field];
          if (targetField) {
            migratedData[targetField] = sampleDoc.data[field];
          }
        });
        
        // Add source collection as metadata
        migratedData.sourceCollection = collectionName;
        migratedData.migratedAt = new Date().toISOString();
        
        results.sampleMigrations.push({
          sourceId: sampleDoc.id,
          sourceData: sampleDoc.data,
          targetData: migratedData
        });
      }
    }
    
    // Generate migration steps
    results.steps = [
      {
        step: 1,
        description: 'Create backup of all collections',
        code: 'exportToJsonFiles([' + sourceCollections.join(', ') + '])'
      },
      {
        step: 2,
        description: 'Migrate data with field mappings',
        code: `migrateCollections([${sourceCollections.map(c => `'${c}'`).join(', ')}], '${targetCollection}', fieldMappings)`
      },
      {
        step: 3,
        description: 'Update application code to use only the target collection',
        details: 'Update all service files to consistently use the same collection name'
      },
      {
        step: 4,
        description: 'Verify data integrity and application functionality',
        details: 'Test all features that use the affected collections'
      },
      {
        step: 5,
        description: 'Archive original collections (rename with _archive suffix)',
        code: `archiveCollections([${sourceCollections.map(c => `'${c}'`).join(', ')}])`
      }
    ];
    
    console.log(`✅ Migration plan generated for ${sourceCollections.length} collections`);
    return results;
  } catch (error) {
    console.error(`❌ Error generating migration plan:`, error);
    return {
      error: error.message,
      stack: error.stack
    };
  }
};

// Export functions for browser console use
if (typeof window !== 'undefined') {
  window.auditFirestoreCollections = auditFirestoreCollections;
  window.analyzeCollection = analyzeCollection;
  window.generateMigrationPlan = generateMigrationPlan;
}

export { auditFirestoreCollections, analyzeCollection, generateMigrationPlan };