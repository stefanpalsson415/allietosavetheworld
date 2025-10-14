# How to Audit Your Firestore Database

This guide explains how to use the audit scripts to identify duplicate variables, similar collections, and schema inconsistencies in your Firestore database.

## Step 1: Run a Full Database Audit

This will scan all collections in your Firestore database and identify potential duplicates and inconsistencies:

```javascript
import('/audit-firestore-collections.js').then(module => {
  module.auditFirestoreCollections().then(results => {
    console.log("Firestore Audit Results:", results);
    
    // Log collections with similar names
    console.log("Similar Named Collections:", results.similarNamedCollections);
    
    // Log collections with similar schemas
    console.log("Similar Schema Collections:", results.similarSchemaCollections);
    
    // Log recommended merges
    console.log("Recommended Merges:", results.recommendedMerges);
  });
});
```

## Step 2: Analyze Specific Collections

For more detailed analysis of a specific collection (like providers):

```javascript
import('/audit-firestore-collections.js').then(module => {
  module.analyzeCollection('providers').then(results => {
    console.log("Collection Analysis Results:", results);
    
    // Log field usage statistics
    console.table(results.keyCounts);
    
    // Log detected issues
    console.table(results.issues);
    
    // For fields with value distributions (like 'type')
    if (results.valueDistribution.type) {
      console.log("Type values distribution:");
      console.table(results.valueDistribution.type);
    }
  });
});
```

You can repeat this for any collection you want to analyze in detail:
- `analyzeCollection('familyProviders')`
- `analyzeCollection('healthcareProviders')`
- etc.

## Step 3: Generate Migration Plan

If you need to merge collections (as recommended in Step 1), you can create a migration plan:

```javascript
import('/audit-firestore-collections.js').then(module => {
  // Example: Merge all provider-related collections into 'providers'
  module.generateMigrationPlan(
    ['familyProviders', 'healthcareProviders', 'providers'],
    'providers'
  ).then(plan => {
    console.log("Migration Plan:", plan);
    
    // Log document counts in each collection
    console.log("Document Counts:", plan.documentCounts);
    
    // Log sample migrations to review
    console.log("Sample Migrations:", plan.sampleMigrations);
    
    // Log migration steps
    console.log("Migration Steps:");
    plan.steps.forEach(step => {
      console.log(`Step ${step.step}: ${step.description}`);
      if (step.code) console.log(`   Code: ${step.code}`);
      if (step.details) console.log(`   Details: ${step.details}`);
    });
  });
});
```

## Step 4: Check for UI Variables

To check what variables are actually being used in the UI:

```javascript
// Check what's in the global state
console.log("window.allieKnowledgeGraph:", window.allieKnowledgeGraph);

// Examine localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('provider') || key.includes('family')) {
    console.log(`localStorage key: ${key}`, localStorage.getItem(key));
  }
});

// Check for event listeners
if (window._debugEvents) {
  Object.keys(window._debugEvents).forEach(eventName => {
    if (eventName.includes('provider') || eventName.includes('family')) {
      console.log(`Event listener: ${eventName}`);
    }
  });
}
```

## Next Steps After Audit

Based on the audit results, you should:

1. **Identify Collections to Merge**: Determine which collections have duplicate purposes
2. **Choose Target Collections**: Decide which collection names to standardize on
3. **Update Code**: Ensure all services use the same collection names
4. **Migrate Data**: Move data from duplicate collections to your chosen standard collections
5. **Archive Old Collections**: Once migration is complete, archive or delete old collections

Remember to always back up your data before performing any migrations!