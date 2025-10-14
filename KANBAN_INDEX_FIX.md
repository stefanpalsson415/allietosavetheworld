# Kanban Board Index Fix

## Quick Fix Options

### Option 1: Click the Firebase Console Link (Fastest)
The error message in your browser console contains a direct link to create the index. Simply:
1. Click the link in the error message that starts with: `https://console.firebase.google.com/v1/r/project/parentload-ba995/firestore/indexes?create_composite=...`
2. Firebase Console will open with the index pre-configured
3. Click "Create Index"
4. Wait 1-3 minutes for the index to build

### Option 2: Deploy All Indexes
Run the deployment script I created:
```bash
./deploy-kanban-indexes.sh
```

This will deploy all indexes defined in `firestore.indexes.json`, including the one needed for the Kanban board.

### Option 3: Manual Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/project/parentload-ba995/firestore/indexes)
2. Click "Create Index"
3. Configure as follows:
   - Collection ID: `kanbanTasks`
   - Fields to index:
     - `familyId` - Ascending
     - `updatedAt` - Descending
     - `status` - Descending
   - Query scope: Collection
4. Click "Create"

## What This Fixes
The Kanban board queries tasks using multiple fields for sorting and filtering. Firestore requires a composite index when queries use:
- Multiple field filters (familyId, status)
- Ordering by a field (updatedAt)

## Index Details
The specific query causing the issue is in `AIKanbanBoard.jsx`:
```javascript
query(
  collection(db, 'kanbanTasks'),
  where('familyId', '==', familyId),
  where('status', '!=', 'archived'),
  orderBy('updatedAt', 'desc'),
  limit(50)
)
```

## Note
After creating the index, it typically takes 1-3 minutes to build. The Kanban board will automatically start working once the index is ready.