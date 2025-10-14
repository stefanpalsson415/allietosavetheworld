# Creating Firestore Indexes

This guide explains how to create Firestore indexes when you see missing index errors.

## What Are Firestore Indexes?

Firestore indexes are special database structures that improve query performance. When your app needs to filter or sort data in complex ways (especially using multiple fields), Firestore requires custom indexes to handle these queries efficiently.

## How to Recognize an Index Error

You'll typically see an error message like one of these:

```
Error: 9 FAILED_PRECONDITION: The query requires an index.
```

```
FirebaseError: Missing or insufficient permissions / failed to match any of the index definitions
```

The error message will usually include a direct link to create the index automatically.

## Creating the Required Index

### Method 1: Use the Direct Link (Recommended)

1. When you see an index error, look for a URL in the error message
2. Click the link or copy it to your browser
3. You'll be taken to the Firebase Console with the index configuration pre-filled
4. Click "Create Index" to confirm

### Method 2: Manual Index Creation

If you don't have a direct link, you can create indexes manually:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Firestore Database in the left sidebar
4. Click the "Indexes" tab
5. Click "Add Index"
6. Fill in the following:
   - Collection ID: The collection requiring the index (e.g., "choreTemplates")
   - Fields to index: Add the fields mentioned in the error message
   - Query scope: Usually "Collection"
7. Click "Create"

## Understanding Common Indexed Queries in Our App

Our app typically needs indexes for these common queries:

1. **Chore Templates by Family**:
   - Collection: `choreTemplates`
   - Fields: `familyId` (Ascending), `isActive` (Ascending)

2. **Reward Templates by Category**:
   - Collection: `rewardTemplates`
   - Fields: `familyId` (Ascending), `category` (Ascending), `isActive` (Ascending)

3. **Pending Approvals by Child**:
   - Collection: `choreApprovals`
   - Fields: `childId` (Ascending), `status` (Ascending), `completedAt` (Descending)

## After Creating an Index

1. It takes a few minutes for indexes to build
2. The exact time depends on the amount of data
3. Try your operation again after 2-5 minutes
4. If you still see errors, check if it's a different index that's required

## Tips for Efficient Indexing

1. Only create indexes you actually need
2. Remove unused indexes to optimize performance
3. When testing in development, create all required indexes before deploying to production
4. Check error messages carefully - sometimes multiple indexes are needed

## Common Issues

- **"Index already exists"**: Another developer may have created it, or you might be trying to create a duplicate
- **"Index creation failed"**: Check your permissions or try again later
- **"Index still building"**: Wait a few minutes before retrying your operation
- **Still getting errors after creating index**: You might need a different or additional index

## Need More Help?

If you're still experiencing issues after following these steps, contact the development team for assistance. Include the full error message in your request.