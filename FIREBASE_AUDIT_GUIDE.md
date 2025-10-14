# Firebase Data Audit Guide

## 1. Pre-Deletion Audit

### Export Current Structure
```bash
# Export all collection names and document counts
firebase firestore:indexes > current-indexes.json
firebase firestore:rules > current-rules.rules
```

### Document Your Collections
Run this script to audit your current data structure:

```javascript
// audit-firestore-structure.js
const admin = require('firebase-admin');
const fs = require('fs');

async function auditCollections() {
  const db = admin.firestore();
  const audit = {};
  
  // List all root collections
  const collections = await db.listCollections();
  
  for (const collection of collections) {
    const snapshot = await collection.limit(1).get();
    const sampleDoc = snapshot.docs[0];
    
    audit[collection.id] = {
      documentCount: (await collection.count().get()).data().count,
      sampleStructure: sampleDoc ? sampleDoc.data() : null,
      fields: sampleDoc ? Object.keys(sampleDoc.data()) : [],
      subcollections: []
    };
    
    // Check for subcollections
    if (sampleDoc) {
      const subcollections = await sampleDoc.ref.listCollections();
      audit[collection.id].subcollections = subcollections.map(sub => sub.id);
    }
  }
  
  fs.writeFileSync('firestore-audit.json', JSON.stringify(audit, null, 2));
  console.log('Audit complete! Check firestore-audit.json');
}
```

## 2. Security Rules Audit

### Check for Common Issues
```javascript
// Common security rule problems to look for:

// ❌ BAD: Too permissive
allow read, write: if true;

// ❌ BAD: No user isolation
allow read: if request.auth != null;

// ✅ GOOD: User-specific access
allow read: if request.auth != null && request.auth.uid == resource.data.userId;

// ✅ GOOD: Family-based access
allow read: if request.auth != null && 
  request.auth.uid in resource.data.familyMembers;
```

### Recommended Security Rules Structure
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Family members can access family data
    match /families/{familyId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.memberIds;
      allow write: if request.auth != null && 
        request.auth.uid in resource.data.adminIds;
    }
    
    // Events belong to families
    match /events/{eventId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/families/$(resource.data.familyId)) &&
        request.auth.uid in get(/databases/$(database)/documents/families/$(resource.data.familyId)).data.memberIds;
    }
  }
}
```

## 3. Index Audit

### Check Required Indexes
```bash
# View current indexes
firebase firestore:indexes

# Common indexes needed for your app:
```

```json
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "familyId", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "habits",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "familyId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## 4. Data Consistency Checks

### Run These Checks Before Deletion
```javascript
// check-data-consistency.js
async function checkDataConsistency() {
  const issues = [];
  
  // Check 1: Orphaned events (no valid familyId)
  const events = await db.collection('events').get();
  for (const event of events.docs) {
    const familyId = event.data().familyId;
    if (!familyId) {
      issues.push(`Event ${event.id} has no familyId`);
      continue;
    }
    const family = await db.collection('families').doc(familyId).get();
    if (!family.exists) {
      issues.push(`Event ${event.id} references non-existent family ${familyId}`);
    }
  }
  
  // Check 2: Users without families
  const users = await db.collection('users').get();
  for (const user of users.docs) {
    const families = await db.collection('families')
      .where('memberIds', 'array-contains', user.id)
      .get();
    if (families.empty) {
      issues.push(`User ${user.id} is not in any family`);
    }
  }
  
  // Check 3: Invalid date fields
  const collections = ['events', 'habits', 'messages'];
  for (const collName of collections) {
    const docs = await db.collection(collName).limit(100).get();
    docs.forEach(doc => {
      const data = doc.data();
      ['createdAt', 'updatedAt', 'startTime', 'endTime'].forEach(field => {
        if (data[field] && !(data[field] instanceof admin.firestore.Timestamp)) {
          issues.push(`${collName}/${doc.id} has invalid ${field} format`);
        }
      });
    });
  }
  
  return issues;
}
```

## 5. Post-Deletion Setup

### Create Clean Test Data
```javascript
// create-test-data.js
async function createTestData() {
  // 1. Create test user
  const testUser = {
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  const userRef = await db.collection('users').add(testUser);
  
  // 2. Create test family
  const testFamily = {
    name: 'Test Family',
    memberIds: [userRef.id],
    adminIds: [userRef.id],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  const familyRef = await db.collection('families').add(testFamily);
  
  // 3. Create test event
  const testEvent = {
    title: 'Test Event',
    familyId: familyRef.id,
    createdBy: userRef.id,
    startTime: admin.firestore.Timestamp.fromDate(new Date()),
    endTime: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 3600000)),
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };
  await db.collection('events').add(testEvent);
  
  console.log('Test data created successfully!');
}
```

## 6. Performance Monitoring

### Set Up Usage Monitoring
```javascript
// Monitor collection sizes
async function monitorCollectionSizes() {
  const collections = ['users', 'families', 'events', 'habits', 'messages'];
  const sizes = {};
  
  for (const coll of collections) {
    const count = await db.collection(coll).count().get();
    sizes[coll] = count.data().count;
  }
  
  // Log to monitoring service or file
  console.log('Collection sizes:', sizes);
  
  // Alert if any collection is too large
  Object.entries(sizes).forEach(([coll, size]) => {
    if (size > 10000) {
      console.warn(`⚠️ ${coll} has ${size} documents - consider pagination`);
    }
  });
}
```

## 7. Backup Strategy

### Regular Backups
```bash
# Set up daily backups
gcloud firestore export gs://your-backup-bucket/$(date +%Y%m%d)

# Create backup script
cat > daily-backup.sh << 'EOF'
#!/bin/bash
BUCKET="gs://your-backup-bucket"
DATE=$(date +%Y%m%d_%H%M%S)
gcloud firestore export $BUCKET/$DATE
# Keep only last 7 days
gsutil ls $BUCKET | sort | head -n -7 | xargs -I {} gsutil rm -r {}
EOF
```

## 8. Query Optimization

### Identify Slow Queries
```javascript
// Common query patterns to optimize
const optimizedQueries = {
  // ✅ GOOD: Uses index
  familyEvents: db.collection('events')
    .where('familyId', '==', familyId)
    .where('startTime', '>=', startDate)
    .orderBy('startTime'),
    
  // ❌ BAD: No index, will be slow
  allActiveEvents: db.collection('events')
    .where('status', '==', 'active')
    .where('category', '==', 'meeting')
    .orderBy('createdAt'),
    
  // ✅ GOOD: Paginated
  paginatedMessages: db.collection('messages')
    .where('familyId', '==', familyId)
    .orderBy('timestamp', 'desc')
    .limit(20)
};
```

## 9. Clean Architecture Checklist

After deletion, ensure:

- [ ] One service per feature (no duplicates)
- [ ] Consistent ID naming (use `id` everywhere)
- [ ] All dates use Firestore Timestamps
- [ ] Proper error handling in all services
- [ ] Pagination for large collections
- [ ] Proper indexes for all queries
- [ ] Security rules are restrictive
- [ ] No circular dependencies
- [ ] Clear data ownership (userId/familyId)
- [ ] Audit trail fields (createdAt, updatedAt, createdBy)

## 10. Testing Strategy

```javascript
// Test critical paths
describe('Firebase Data Operations', () => {
  test('Create family with proper structure', async () => {
    const family = await createFamily({...});
    expect(family).toHaveProperty('id');
    expect(family).toHaveProperty('createdAt');
  });
  
  test('Events require valid familyId', async () => {
    await expect(createEvent({ familyId: 'invalid' }))
      .rejects.toThrow();
  });
  
  test('Users can only access their family data', async () => {
    // Test security rules
  });
});
```

This audit process will help you maintain a clean, efficient, and secure Firebase setup!