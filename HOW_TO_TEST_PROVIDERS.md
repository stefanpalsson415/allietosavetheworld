# How to Test Provider Collections

This document provides instructions for testing the provider-related collections in your Firestore database to ensure your application is using the correct ones.

## Step 1: Check Current Collections

Run this code in your browser console to check all provider collections:

```javascript
import('/test-provider-collections.js').then(module => {
  module.checkProviderCollections().then(results => {
    console.log("Provider Collection Check Results:", results);
    console.table(results.collections.providers || []);
    console.table(results.collections.familyProviders || []);
    console.table(results.collections.healthcareProviders || []);
    
    // Log recommendations if any
    if (results.recommendations && results.recommendations.length > 0) {
      console.log("Recommendations:", results.recommendations);
    }
  });
});
```

This will show you:
- What providers exist in each collection
- If there are duplicates across collections
- What the UI is actually showing (from the knowledge graph)
- Recommendations for fixing any issues

## Step 2: Test Creating Providers in Different Collections

You can test creating providers in specific collections to see which ones appear in the UI:

```javascript
// Test creating in 'providers' collection
import('/test-provider-collections.js').then(module => {
  module.createTestProvider('providers').then(result => {
    console.log("Created provider in 'providers':", result);
  });
});

// Test creating in 'familyProviders' collection
import('/test-provider-collections.js').then(module => {
  module.createTestProvider('familyProviders').then(result => {
    console.log("Created provider in 'familyProviders':", result);
  });
});
```

After creating test providers, check the UI to see which ones appear.

## Step 3: Test Using Allie Chat

Try adding a provider through Allie Chat with a message like:
```
Add Dr. Taylor Smith as our pediatrician with phone number 555-987-6543
```

Then check which collection the provider was added to using the script from Step 1.

## Step 4: Migration Plan (If Needed)

Based on your test results, you might need to:

1. Continue using the 'providers' collection for all new providers (as we've updated)
2. Migrate existing providers from other collections to 'providers'
3. Update any other components that might still be using other collections

A simple migration script could be created if needed to consolidate all providers into a single collection.