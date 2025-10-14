#!/bin/bash

echo "🚀 Deploying Firestore indexes for scalability improvements..."
echo ""
echo "This will create the following indexes:"
echo "- surveyResponses: familyId + timestamp (for paginated survey loading)"
echo "- events: userId + dateTime (for date-filtered event queries)"
echo "- events: familyId + startDate (for family event queries)"
echo "- kanbanTasks: familyId + status + updatedAt (for filtered task loading)"
echo "- choreSchedules: familyId + childId + isActive (for active schedule queries)"
echo ""

# Deploy the indexes
firebase deploy --only firestore:indexes

echo ""
echo "✅ Index deployment initiated!"
echo ""
echo "Note: Index creation can take 5-10 minutes. You can check the status at:"
echo "https://console.firebase.google.com/project/parentload-ba995/firestore/indexes"
echo ""
echo "While indexes are building, the app will use simplified queries that don't require indexes."