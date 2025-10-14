# Firebase Cleanup Implementation Plan

## Overview
This document provides step-by-step instructions and actual code to clean up your Firebase architecture.

## Phase 1: Service Consolidation (Week 1)

### Step 1.1: Create Base Service Pattern

First, create a base service that all other services will extend:

```javascript
// src/services/BaseFirestoreService.js
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';

class BaseFirestoreService {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.subscriptions = new Map();
  }

  // Create with automatic timestamps
  async create(data, customId = null) {
    const timestamp = serverTimestamp();
    const docData = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    let docRef;
    if (customId) {
      docRef = doc(db, this.collectionName, customId);
      await setDoc(docRef, docData);
    } else {
      docRef = await addDoc(collection(db, this.collectionName), docData);
    }

    return { id: docRef.id, ...docData };
  }

  // Get single document
  async get(id) {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`${this.collectionName} document not found: ${id}`);
    }
    
    return { id: docSnap.id, ...docSnap.data() };
  }

  // Update with automatic timestamp
  async update(id, data) {
    const docRef = doc(db, this.collectionName, id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(docRef, updateData);
    return { id, ...updateData };
  }

  // Soft delete (set status) or hard delete
  async delete(id, soft = true) {
    const docRef = doc(db, this.collectionName, id);
    
    if (soft) {
      await updateDoc(docRef, {
        status: 'deleted',
        deletedAt: serverTimestamp()
      });
    } else {
      await deleteDoc(docRef);
    }
    
    return { id, deleted: true };
  }

  // Query with pagination
  async query(filters = {}, orderByField = 'createdAt', orderDirection = 'desc', pageSize = 20, lastDoc = null) {
    let q = collection(db, this.collectionName);
    
    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        q = query(q, where(field, '==', value));
      }
    });
    
    // Apply ordering
    q = query(q, orderBy(orderByField, orderDirection));
    
    // Apply pagination
    q = query(q, limit(pageSize));
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(q);
    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return {
      docs,
      lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
      hasMore: snapshot.docs.length === pageSize
    };
  }

  // Real-time subscription
  subscribe(filters = {}, callback, errorCallback = console.error) {
    const subscriptionId = Date.now().toString();
    
    let q = collection(db, this.collectionName);
    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null) {
        q = query(q, where(field, '==', value));
      }
    });
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const changes = {
          added: [],
          modified: [],
          removed: []
        };
        
        snapshot.docChanges().forEach(change => {
          const doc = { id: change.doc.id, ...change.doc.data() };
          changes[change.type].push(doc);
        });
        
        callback(docs, changes);
      },
      errorCallback
    );
    
    this.subscriptions.set(subscriptionId, unsubscribe);
    
    // Return cleanup function
    return () => {
      unsubscribe();
      this.subscriptions.delete(subscriptionId);
    };
  }

  // Cleanup all subscriptions
  cleanup() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }
}

export default BaseFirestoreService;
```

### Step 1.2: Create Consolidated Calendar Service

Replace all 3 calendar services with one:

```javascript
// src/services/CalendarServiceV2.js
import BaseFirestoreService from './BaseFirestoreService';
import { db } from './firebase';
import { Timestamp } from 'firebase/firestore';

class CalendarServiceV2 extends BaseFirestoreService {
  constructor() {
    super('events');
    this.cache = new Map();
  }

  // Create event with proper structure
  async createEvent(eventData, userId, familyId) {
    if (!userId || !familyId) {
      throw new Error('userId and familyId are required');
    }

    // Parse and validate dates
    const startTime = this.parseDate(eventData.startTime);
    const endTime = this.parseDate(eventData.endTime || new Date(startTime.getTime() + 3600000));

    const event = {
      // Core fields
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      
      // Dates as Firestore Timestamps
      startTime: Timestamp.fromDate(startTime),
      endTime: Timestamp.fromDate(endTime),
      
      // Location
      location: eventData.location || '',
      
      // Categorization
      category: eventData.category || 'general',
      
      // Attendees
      attendees: eventData.attendees || [],
      
      // Standard fields
      userId,
      familyId,
      createdBy: userId,
      
      // Status
      status: 'active'
    };

    const created = await this.create(event);
    this.cache.set(created.id, created);
    
    return created;
  }

  // Get events for date range
  async getEventsByDateRange(familyId, startDate, endDate) {
    const startTimestamp = Timestamp.fromDate(this.parseDate(startDate));
    const endTimestamp = Timestamp.fromDate(this.parseDate(endDate));
    
    const q = query(
      collection(db, 'events'),
      where('familyId', '==', familyId),
      where('status', '==', 'active'),
      where('startTime', '>=', startTimestamp),
      where('startTime', '<=', endTimestamp),
      orderBy('startTime', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Timestamps back to Dates for the UI
      startTime: doc.data().startTime?.toDate(),
      endTime: doc.data().endTime?.toDate()
    }));
  }

  // Subscribe to family events
  subscribeToFamilyEvents(familyId, callback) {
    return this.subscribe(
      { familyId, status: 'active' },
      (events, changes) => {
        // Convert timestamps for UI
        const processedEvents = events.map(event => ({
          ...event,
          startTime: event.startTime?.toDate?.() || new Date(event.startTime),
          endTime: event.endTime?.toDate?.() || new Date(event.endTime)
        }));
        
        callback(processedEvents, changes);
      }
    );
  }

  // Helper to parse various date formats
  parseDate(dateInput) {
    if (!dateInput) return new Date();
    if (dateInput instanceof Date) return dateInput;
    if (dateInput.toDate) return dateInput.toDate(); // Firestore Timestamp
    if (typeof dateInput === 'string') return new Date(dateInput);
    if (typeof dateInput === 'number') return new Date(dateInput);
    throw new Error('Invalid date format');
  }
}

export default new CalendarServiceV2();
```

### Step 1.3: Update Components to Use New Service

```javascript
// Example: Update CalendarProvider.js
import CalendarServiceV2 from '../../../services/CalendarServiceV2';

// Replace all references to old services
// OLD: import MasterCalendarService from '../../../services/MasterCalendarService';
// NEW: import CalendarServiceV2 from '../../../services/CalendarServiceV2';

// Update method calls
// OLD: MasterCalendarService.createEvent(...)
// NEW: CalendarServiceV2.createEvent(...)
```

### Step 1.4: Create Migration Script

```javascript
// scripts/migrate-calendar-services.js
const replaceInFile = require('replace-in-file');

async function migrateCalendarServices() {
  const options = {
    files: [
      'src/**/*.js',
      'src/**/*.jsx'
    ],
    from: [
      /import.*EventStore.*from.*EventStore/g,
      /import.*CalendarService.*from.*CalendarService/g,
      /import.*MasterCalendarService.*from.*MasterCalendarService/g,
      /EventStore\./g,
      /CalendarService\./g,
      /MasterCalendarService\./g
    ],
    to: [
      "import CalendarServiceV2 from '../services/CalendarServiceV2'",
      "import CalendarServiceV2 from '../services/CalendarServiceV2'",
      "import CalendarServiceV2 from '../services/CalendarServiceV2'",
      'CalendarServiceV2.',
      'CalendarServiceV2.',
      'CalendarServiceV2.'
    ],
  };

  try {
    const results = await replaceInFile(options);
    console.log('Migration results:', results);
  } catch (error) {
    console.error('Migration error:', error);
  }
}

migrateCalendarServices();
```

## Phase 2: Collection Consolidation (Week 2)

### Step 2.1: Update Firestore Structure

```javascript
// scripts/update-firestore-structure.js
const admin = require('firebase-admin');

async function consolidateCollections() {
  const db = admin.firestore();
  
  // Map old collections to new ones
  const consolidationMap = {
    // Events
    'calendar_events': 'events',
    'failedCalendarEvents': 'events',
    
    // Habits
    'habitCycles': 'habits',
    'habitQuests': 'habits',
    'habitDJSettings': 'habits',
    
    // Documents
    'familyDocuments': 'documents',
    'documentInbox': 'documents',
    
    // Remove these (merge data into user/family docs)
    'userSettings': null,  // Move to users collection
    'familyProfiles': null, // Move to families collection
  };
  
  for (const [oldCollection, newCollection] of Object.entries(consolidationMap)) {
    if (newCollection) {
      console.log(`Migrating ${oldCollection} -> ${newCollection}`);
      // Add migration logic here
    } else {
      console.log(`Removing ${oldCollection} (data moves to parent doc)`);
      // Add removal logic here
    }
  }
}
```

### Step 2.2: Update Security Rules

Create new, simplified security rules:

```javascript
// firestore.rules
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
    
    // Users collection
    match /users/{userId} {
      allow read, write: if isOwner(userId);
    }
    
    // Families collection
    match /families/{familyId} {
      allow read: if isFamilyMember(familyId);
      allow write: if isFamilyMember(familyId) && 
        request.auth.uid in resource.data.adminIds;
    }
    
    // All other collections require family membership
    match /{collection}/{document} {
      allow read: if isSignedIn() && 
        'familyId' in resource.data &&
        isFamilyMember(resource.data.familyId);
        
      allow create: if isSignedIn() && 
        'familyId' in request.resource.data &&
        isFamilyMember(request.resource.data.familyId) &&
        request.resource.data.userId == request.auth.uid;
        
      allow update: if isSignedIn() && 
        'familyId' in resource.data &&
        isFamilyMember(resource.data.familyId) &&
        resource.data.userId == request.auth.uid;
        
      allow delete: if isSignedIn() && 
        'familyId' in resource.data &&
        isFamilyMember(resource.data.familyId) &&
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## Phase 3: Testing & Validation (Week 3)

### Step 3.1: Create Test Suite

```javascript
// tests/firebase-cleanup.test.js
import { describe, test, expect } from '@jest/globals';
import CalendarServiceV2 from '../src/services/CalendarServiceV2';

describe('CalendarServiceV2', () => {
  test('creates event with proper structure', async () => {
    const event = await CalendarServiceV2.createEvent({
      title: 'Test Event',
      startTime: new Date()
    }, 'userId', 'familyId');
    
    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('createdAt');
    expect(event).not.toHaveProperty('firestoreId');
    expect(event).not.toHaveProperty('universalId');
  });
  
  test('handles date formats correctly', () => {
    const date = new Date();
    const parsed = CalendarServiceV2.parseDate(date.toISOString());
    expect(parsed).toBeInstanceOf(Date);
  });
});
```

### Step 3.2: Validation Script

```javascript
// scripts/validate-cleanup.js
async function validateCleanup() {
  const issues = [];
  
  // Check for old service imports
  const oldServices = [
    'EventStore',
    'CalendarService',
    'MasterCalendarService',
    'HabitService2',
    'HabitCyclesService'
  ];
  
  // Scan codebase
  const files = glob.sync('src/**/*.{js,jsx}');
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    for (const oldService of oldServices) {
      if (content.includes(oldService)) {
        issues.push(`${file} still references ${oldService}`);
      }
    }
    
    // Check for old ID patterns
    if (content.includes('firestoreId') || content.includes('universalId')) {
      issues.push(`${file} uses old ID pattern`);
    }
  }
  
  if (issues.length > 0) {
    console.error('Validation failed:');
    issues.forEach(issue => console.error(`  - ${issue}`));
    process.exit(1);
  } else {
    console.log('✅ Validation passed!');
  }
}
```

## Phase 4: Deployment (Week 4)

### Step 4.1: Deployment Checklist

```bash
#!/bin/bash
# deploy-cleanup.sh

echo "🚀 Deploying Firebase Cleanup..."

# 1. Run tests
echo "Running tests..."
npm test

# 2. Validate cleanup
echo "Validating cleanup..."
node scripts/validate-cleanup.js

# 3. Deploy security rules
echo "Deploying security rules..."
firebase deploy --only firestore:rules

# 4. Deploy indexes
echo "Deploying indexes..."
firebase deploy --only firestore:indexes

# 5. Deploy functions (if any)
echo "Deploying functions..."
firebase deploy --only functions

echo "✅ Deployment complete!"
```

### Step 4.2: Rollback Plan

```javascript
// scripts/rollback-services.js
// Keep old services in src/services/deprecated/
// If issues arise, this script reverts the migration

async function rollback() {
  // Revert imports back to old services
  const options = {
    files: ['src/**/*.js', 'src/**/*.jsx'],
    from: /CalendarServiceV2/g,
    to: 'MasterCalendarService'
  };
  
  await replaceInFile(options);
  console.log('Rollback complete');
}
```

## Timeline Summary

### Week 1: Service Consolidation
- Day 1-2: Create BaseFirestoreService
- Day 3-4: Create CalendarServiceV2
- Day 5: Migrate components to new service

### Week 2: Collection Consolidation  
- Day 1-2: Plan collection mergers
- Day 3-4: Write migration scripts
- Day 5: Update security rules

### Week 3: Testing
- Day 1-2: Write comprehensive tests
- Day 3-4: Fix any issues found
- Day 5: Run validation scripts

### Week 4: Deployment
- Day 1: Final testing
- Day 2: Deploy to staging
- Day 3: Monitor for issues
- Day 4: Deploy to production
- Day 5: Post-deployment validation

## Success Metrics

After implementation, you should see:
- ✅ 15 collections instead of 125+
- ✅ 1 service per feature
- ✅ Consistent patterns everywhere
- ✅ 50% less code to maintain
- ✅ Faster queries
- ✅ Easier debugging
- ✅ Clear documentation

This plan gives you actual code to implement the cleanup, not just ideas!