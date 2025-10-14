#!/bin/bash

# Deploy Firebase Firestore indexes
echo "🚀 Deploying Firebase Firestore indexes..."

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null
then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in
firebase login:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "📱 Please log in to Firebase:"
    firebase login
fi

# Deploy only Firestore indexes
echo "📤 Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

echo "✅ Deployment complete!"
echo ""
echo "If you see any errors, you can also manually create indexes by:"
echo "1. Going to https://console.firebase.google.com"
echo "2. Select your project"
echo "3. Go to Firestore Database > Indexes"
echo "4. Click 'Create Index' and add these:"
echo ""
echo "Collection: families/{familyId}/djSessions"
echo "- Field: familyId (Ascending)"
echo "- Field: createdAt (Descending)"
echo ""
echo "Collection: families/{familyId}/practiceHistory"
echo "- Field: userId (Ascending)"
echo "- Field: sessionDate (Descending)"
echo ""
echo "Collection: liveSessions"
echo "- Field: familyId (Ascending)"
echo "- Field: startedAt (Descending)"