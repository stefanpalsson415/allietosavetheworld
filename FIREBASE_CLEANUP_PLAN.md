doe# Firebase Architecture Cleanup Plan

## Current State Analysis

### 1. **Collection Sprawl**
- **125+ collections** identified (way too many!)
- Many appear to be duplicates or unused
- No clear naming convention

### 2. **Service Redundancy**
- **3 calendar services**: EventStore, CalendarService, MasterCalendarService
- **Multiple habit services**: HabitService2, HabitCyclesService, HabitQuestService, etc.
- **2 knowledge graph services**: EnhancedKnowledgeGraphService, QuantumKnowledgeGraph
- **Multiple auth services**: OTPAuthService, MagicLinkService, MagicLinkServiceV2

### 3. **ID Chaos**
```javascript
// Current mess:
event.id
event.firestoreId
event.universalId
event.eventId
// Sometimes all in the same object!
```

### 4. **Date Format Issues**
- Some services use ISO strings
- Some use Firestore Timestamps
- Some use Date objects
- Conversion happens inconsistently

## Cleanup Phase 1: Core Collections

### Collections to Keep (Essential)
```javascript
const CORE_COLLECTIONS = {
  // User & Family
  'users': 'User accounts',
  'families': 'Family groups',
  
  // Events & Tasks
  'events': 'Calendar events',
  'tasks': 'Task management',
  
  // Habits
  'habits': 'Habit definitions',
  'habitInstances': 'Habit tracking',
  
  // Chores & Rewards
  'choreTemplates': 'Chore definitions',
  'choreInstances': 'Chore assignments',
  'rewardTemplates': 'Reward definitions',
  'bucksTransactions': 'Virtual currency',
  
  // Communication
  'messages': 'Chat messages',
  'emailInbox': 'Email integration',
  'smsInbox': 'SMS integration',
  
  // Documents
  'documents': 'Family documents',
  
  // Knowledge
  'insights': 'AI insights',
  'surveyResponses': 'Survey data'
};
```

### Collections to Merge
```javascript
// Merge these into 'events':
- calendar_events
- failedCalendarEvents
- eventRelationships

// Merge these into 'habits':
- habitCycles
- habitQuests
- habitDJSettings
- habitHelperFeedback

// Merge these into 'families':
- familyProfiles
- familyMembers (as subcollection)
- familyContacts (as subcollection)
- familyProviders (as subcollection)

// Merge these into 'documents':
- familyDocuments
- documentInbox
- documentFolders
```

## Cleanup Phase 2: Service Consolidation

### 1. **Create Single Calendar Service**
```javascript
// services/CalendarServiceV2.js
class CalendarServiceV2 {
  // Combine best of all three services
  // Use MasterCalendarService retry logic
  // Use EventStore's caching
  // Single ID pattern: { id: doc.id }
}
```

### 2. **Create Single Habit Service**
```javascript
// services/HabitServiceV2.js
class HabitServiceV2 {
  // Core CRUD operations
  // Tracking in habitInstances subcollection
  // All extra features as methods, not separate services
}
```

### 3. **Standardize Service Pattern**
```javascript
// Base service pattern to follow
class BaseFirestoreService {
  constructor(collectionName) {
    this.collection = collectionName;
    this.subscriptions = new Map();
  }

  // Standard CRUD
  async create(data) {
    const docRef = await addDoc(collection(db, this.collection), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  }

  async get(id) {
    const doc = await getDoc(doc(db, this.collection, id));
    if (!doc.exists()) throw new Error('Not found');
    return { id: doc.id, ...doc.data() };
  }

  async update(id, data) {
    await updateDoc(doc(db, this.collection, id), {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { id, ...data };
  }

  async delete(id) {
    await deleteDoc(doc(db, this.collection, id));
    return { id };
  }

  // Standard subscription
  subscribe(query, callback) {
    const unsubscribe = onSnapshot(query, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(docs);
    });
    return unsubscribe;
  }
}
```

## Cleanup Phase 3: Data Standards

### 1. **ID Standard**
```javascript
// ALWAYS use this pattern:
const document = {
  id: doc.id,  // Firestore document ID
  ...doc.data()
};

// Never create custom ID fields
// Never use firestoreId, universalId, etc.
```

### 2. **Date Standard**
```javascript
// Writing to Firestore:
{
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  eventDate: Timestamp.fromDate(date)
}

// Reading from Firestore:
const date = doc.data().eventDate?.toDate() || new Date();

// For API/storage: Use ISO strings
const isoDate = date.toISOString();
```

### 3. **User/Family Reference Standard**
```javascript
// Every document should have:
{
  userId: 'user-id',      // Who created it
  familyId: 'family-id',  // Which family owns it
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

## Cleanup Phase 4: Security Rules

### Simplified Rules Structure
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function isFamilyMember(familyId) {
      return isSignedIn() && 
        exists(/databases/$(database)/documents/families/$(familyId)) &&
        request.auth.uid in get(/databases/$(database)/documents/families/$(familyId)).data.memberIds;
    }
    
    // Users - only access own document
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Families - members can read, admins can write
    match /families/{familyId} {
      allow read: if isFamilyMember(familyId);
      allow write: if isFamilyMember(familyId) && 
        request.auth.uid in resource.data.adminIds;
    }
    
    // Everything else requires family membership
    match /{collection}/{document} {
      allow read: if isSignedIn() && 
        isFamilyMember(resource.data.familyId);
      allow create: if isSignedIn() && 
        isFamilyMember(request.resource.data.familyId) &&
        request.resource.data.userId == request.auth.uid;
      allow update, delete: if isSignedIn() && 
        isFamilyMember(resource.data.familyId) &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Cleanup Phase 5: Index Strategy

### Required Indexes
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
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "familyId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "dueDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "habits",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "messages",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "familyId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Implementation Steps

### Step 1: Create Migration Scripts
```javascript
// migrate-to-clean-structure.js
async function migrateCollections() {
  // 1. Backup everything first
  await backupAllData();
  
  // 2. Migrate events
  await mergeEventCollections();
  
  // 3. Migrate habits
  await mergeHabitCollections();
  
  // 4. Clean up IDs
  await standardizeIds();
  
  // 5. Fix dates
  await standardizeDates();
}
```

### Step 2: Update Services (One at a Time)
1. Start with CalendarServiceV2
2. Update all components using old services
3. Test thoroughly
4. Remove old services
5. Repeat for each service

### Step 3: Deploy New Security Rules
1. Test in emulator first
2. Deploy to production
3. Monitor for access issues

### Step 4: Create New Indexes
1. Deploy index configuration
2. Wait for building to complete
3. Test all queries

### Step 5: Archive Old Code
1. Move old services to `/src/services/deprecated/`
2. Add deprecation warnings
3. Remove after 30 days

## Success Metrics

After cleanup, you should have:
- ✅ ~15 core collections (not 125+)
- ✅ One service per feature
- ✅ Consistent ID pattern everywhere
- ✅ All dates as Firestore Timestamps
- ✅ Clear security rules
- ✅ Optimized indexes
- ✅ No duplicate functionality
- ✅ Clean error handling
- ✅ Proper subscription cleanup

## Testing Strategy

1. **Unit Tests**: Test each new service
2. **Integration Tests**: Test service interactions
3. **Security Tests**: Verify access rules
4. **Performance Tests**: Check query speed
5. **Migration Tests**: Verify data integrity

This cleanup will dramatically simplify your codebase and make it much easier to maintain!