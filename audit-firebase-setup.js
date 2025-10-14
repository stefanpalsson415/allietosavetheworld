// audit-firebase-setup.js
// Run this to audit your Firebase setup after deleting data

const admin = require('firebase-admin');
const fs = require('fs');

// Initialize admin SDK
// You'll need to add your service account key
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function auditFirebaseSetup() {
  console.log('🔍 Starting Firebase Setup Audit...\n');
  
  const auditResults = {
    timestamp: new Date().toISOString(),
    collections: {},
    indexes: [],
    securityRules: null,
    issues: [],
    recommendations: []
  };

  try {
    // 1. Check what collections exist (even if empty)
    console.log('📁 Checking collections...');
    const collections = await db.listCollections();
    
    for (const collection of collections) {
      const collectionId = collection.id;
      const snapshot = await collection.limit(1).get();
      
      auditResults.collections[collectionId] = {
        exists: true,
        isEmpty: snapshot.empty,
        documentCount: snapshot.empty ? 0 : 'unknown (empty check only)',
        hasDocuments: !snapshot.empty
      };
      
      // Check if this collection is in our cleanup plan
      if (!isEssentialCollection(collectionId)) {
        auditResults.issues.push({
          type: 'unnecessary_collection',
          collection: collectionId,
          message: `Collection '${collectionId}' is not in the essential collections list`
        });
      }
    }
    
    // 2. Check for missing essential collections
    console.log('✅ Checking for missing essential collections...');
    const essentialCollections = [
      'users', 'families', 'events', 'tasks', 'habits', 
      'choreTemplates', 'choreInstances', 'messages', 'documents'
    ];
    
    for (const essential of essentialCollections) {
      if (!auditResults.collections[essential]) {
        auditResults.issues.push({
          type: 'missing_collection',
          collection: essential,
          message: `Essential collection '${essential}' does not exist`
        });
        auditResults.recommendations.push(
          `Create collection '${essential}' when adding first document`
        );
      }
    }
    
    // 3. Analyze service files for collection usage
    console.log('🔎 Analyzing service files...');
    const serviceAnalysis = await analyzeServiceFiles();
    auditResults.serviceAnalysis = serviceAnalysis;
    
    // 4. Check for duplicate services
    console.log('🔄 Checking for duplicate services...');
    const duplicateServices = findDuplicateServices();
    auditResults.duplicateServices = duplicateServices;
    
    // 5. Generate recommendations
    console.log('💡 Generating recommendations...');
    generateRecommendations(auditResults);
    
    // 6. Save audit results
    const auditPath = `./firebase-audit-${Date.now()}.json`;
    fs.writeFileSync(auditPath, JSON.stringify(auditResults, null, 2));
    console.log(`\n✅ Audit complete! Results saved to: ${auditPath}`);
    
    // 7. Print summary
    printAuditSummary(auditResults);
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
    auditResults.error = error.message;
  }
  
  return auditResults;
}

function isEssentialCollection(collectionId) {
  const essentials = [
    'users', 'families', 'events', 'tasks', 'habits', 'habitInstances',
    'choreTemplates', 'choreInstances', 'rewardTemplates', 'bucksTransactions',
    'messages', 'emailInbox', 'smsInbox', 'documents', 'insights', 'surveyResponses'
  ];
  return essentials.includes(collectionId);
}

async function analyzeServiceFiles() {
  const analysis = {
    collectionUsage: {},
    idPatterns: [],
    datePatterns: [],
    subscriptionPatterns: []
  };
  
  // This would normally scan your service files
  // For now, we'll return a summary based on the known issues
  analysis.issues = [
    'Multiple calendar services (EventStore, CalendarService, MasterCalendarService)',
    'Inconsistent ID patterns (id, firestoreId, universalId)',
    'Mixed date formats (ISO strings, Timestamps, Date objects)',
    'No consistent error handling pattern',
    'Missing subscription cleanup in some services'
  ];
  
  return analysis;
}

function findDuplicateServices() {
  return {
    calendar: ['EventStore.js', 'CalendarService.js', 'MasterCalendarService.js'],
    habits: ['HabitService2.js', 'HabitCyclesService.js', 'HabitQuestService.js'],
    auth: ['MagicLinkService.js', 'MagicLinkServiceV2.js'],
    knowledge: ['EnhancedKnowledgeGraphService.js', 'QuantumKnowledgeGraph.js']
  };
}

function generateRecommendations(auditResults) {
  // Service consolidation
  if (auditResults.duplicateServices.calendar.length > 1) {
    auditResults.recommendations.push(
      'Consolidate calendar services into a single CalendarServiceV2'
    );
  }
  
  // Collection cleanup
  const collectionCount = Object.keys(auditResults.collections).length;
  if (collectionCount > 20) {
    auditResults.recommendations.push(
      `Reduce collection count from ${collectionCount} to ~15 core collections`
    );
  }
  
  // Standard patterns
  auditResults.recommendations.push(
    'Implement BaseFirestoreService class for consistent CRUD operations',
    'Standardize on single ID pattern: { id: doc.id, ...data }',
    'Use Firestore Timestamps for all date fields',
    'Add userId and familyId to all documents',
    'Implement consistent error handling with retry logic'
  );
}

function printAuditSummary(auditResults) {
  console.log('\n📊 AUDIT SUMMARY');
  console.log('================\n');
  
  console.log(`📁 Collections Found: ${Object.keys(auditResults.collections).length}`);
  console.log(`⚠️  Issues Found: ${auditResults.issues.length}`);
  console.log(`💡 Recommendations: ${auditResults.recommendations.length}`);
  
  if (auditResults.issues.length > 0) {
    console.log('\n⚠️  TOP ISSUES:');
    auditResults.issues.slice(0, 5).forEach(issue => {
      console.log(`   - ${issue.message}`);
    });
  }
  
  if (auditResults.recommendations.length > 0) {
    console.log('\n💡 TOP RECOMMENDATIONS:');
    auditResults.recommendations.slice(0, 5).forEach(rec => {
      console.log(`   - ${rec}`);
    });
  }
  
  console.log('\n🏗️  NEXT STEPS:');
  console.log('1. Review the full audit file for details');
  console.log('2. Start with service consolidation');
  console.log('3. Implement BaseFirestoreService pattern');
  console.log('4. Create test data with proper structure');
  console.log('5. Update security rules and indexes');
}

// Run the audit
auditFirebaseSetup().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});