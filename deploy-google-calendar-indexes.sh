#!/bin/bash

echo "=== Deploying Firebase Indexes for Google Calendar Sync ==="
echo ""

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI is not installed. Please install it with:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Create a temporary firestore.indexes.json for Google Calendar sync
cat > firestore.indexes.temp.json << 'EOF'
{
  "indexes": [
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "familyId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "source",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "events",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "familyId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "startDate",
          "order": "ASCENDING"
        }
      ]
    },
    {
      "collectionGroup": "googleCalendarSync",
      "queryScope": "COLLECTION",
      "fields": [
        {
          "fieldPath": "familyId",
          "order": "ASCENDING"
        },
        {
          "fieldPath": "updatedAt",
          "order": "DESCENDING"
        }
      ]
    }
  ],
  "fieldOverrides": []
}
EOF

echo "Deploying indexes to Firebase..."
firebase firestore:indexes:deploy --only firestore.indexes.temp.json --project parentload-ba995

# Clean up temp file
rm firestore.indexes.temp.json

echo ""
echo "✅ Index deployment initiated!"
echo "Note: It may take 5-10 minutes for the indexes to be fully created."
echo ""
echo "You can check the status at:"
echo "https://console.firebase.google.com/project/parentload-ba995/firestore/indexes"