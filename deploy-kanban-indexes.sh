#!/bin/bash

# Deploy Firestore indexes for Kanban board functionality
echo "🚀 Deploying Firestore indexes for Kanban board..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "   npm install -g firebase-tools"
    exit 1
fi

# Deploy only the Firestore indexes
echo "📋 Deploying indexes from firestore.indexes.json..."
firebase deploy --only firestore:indexes

# Check deployment status
if [ $? -eq 0 ]; then
    echo "✅ Indexes deployed successfully!"
    echo ""
    echo "⏱️  Note: It may take a few minutes for the indexes to be fully built."
    echo "    You can check the status in the Firebase Console:"
    echo "    https://console.firebase.google.com/project/parentload-ba995/firestore/indexes"
    echo ""
    echo "💡 The Kanban board should start working once the indexes are ready."
else
    echo "❌ Failed to deploy indexes. Please check your Firebase configuration."
    exit 1
fi