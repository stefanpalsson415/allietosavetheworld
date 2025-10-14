# How to Audit Firestore Collections in Browser

This guide explains how to use the simplified browser script to check for duplicate providers across collections.

## Step 1: Audit Provider Collections

Run this code in your browser console:

```javascript
import('/browser-audit-collections.js')
  .then(module => {
    module.auditProviderCollections().then(results => {
      console.log("Provider audit results:", results);
      
      console.log("Collection summary:");
      Object.keys(results.collections).forEach(collection => {
        const providers = results.collections[collection];
        console.log(`${collection}: ${Array.isArray(providers) ? providers.length : 'Error'} providers`);
      });
      
      if (results.duplicates && results.duplicates.length > 0) {
        console.log("Found duplicate providers across collections:", results.duplicates);
      }
      
      if (results.recommendations && results.recommendations.length > 0) {
        console.log("Recommendations:", results.recommendations);
      }
    });
  })
  .catch(error => {
    console.error("Error importing audit script:", error);
  });
```

This will:
1. Check all provider-related collections for the current family
2. Identify any providers that exist in multiple collections
3. Compare providers in the database with what's shown in the UI
4. Provide recommendations for fixing issues

## Step 2: Test Creating Providers

You can test which collection is currently being used by creating test providers in different collections:

```javascript
// Create a test provider in the 'providers' collection
import('/browser-audit-collections.js')
  .then(module => {
    module.createTestProvider('providers').then(result => {
      console.log("Test provider created:", result);
    });
  });

// Create a test provider in the 'familyProviders' collection
import('/browser-audit-collections.js')
  .then(module => {
    module.createTestProvider('familyProviders').then(result => {
      console.log("Test provider created:", result);
    });
  });
```

After creating test providers, check the UI to see which ones appear. This will tell you which collection the UI is actually using.

## Step 3: Run the Audit Again

After creating test providers, run the audit again to see which collections they appear in:

```javascript
import('/browser-audit-collections.js')
  .then(module => {
    module.auditProviderCollections().then(results => {
      console.log("Updated provider audit results:", results);
    });
  });
```

## Understanding the Results

The audit results will show:

1. **Collection breakdown**: What providers exist in each collection
2. **Duplicates**: Providers that exist in multiple collections
3. **UI providers**: What providers are shown in the UI
4. **Recommendations**: Suggested actions based on the audit

## Next Steps

Based on your audit results:

1. If providers exist in multiple collections, consider migrating them all to the 'providers' collection
2. If the UI is showing providers from one collection but your code is writing to another, update your code to be consistent
3. Test the provider creation with Allie Chat to confirm which collection it's using
4. If needed, create a simple migration script to consolidate providers