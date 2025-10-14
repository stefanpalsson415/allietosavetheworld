#!/bin/bash

echo "Deploying Habit DJ Firebase indexes..."

# Deploy the indexes
firebase deploy --only firestore:indexes

echo "Indexes deployment complete!"
echo ""
echo "Note: It may take a few minutes for the indexes to be fully built."
echo "You can check the status at:"
echo "https://console.firebase.google.com/project/parentload-ba995/firestore/indexes"