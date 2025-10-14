#!/bin/bash

echo "🔥 Deploying Firestore Rules to Fix Calendar Integration"
echo "========================================================="
echo ""
echo "This script will:"
echo "1. Re-authenticate with Firebase (if needed)"
echo "2. Deploy the updated Firestore rules"
echo "3. Help you create the missing index"
echo ""

# Check if user is authenticated
echo "📝 Checking Firebase authentication..."
if ! firebase projects:list &>/dev/null; then
    echo "⚠️  You need to authenticate with Firebase"
    echo "Running: firebase login"
    firebase login
fi

echo ""
echo "✅ Authenticated with Firebase"
echo ""

# Deploy Firestore rules
echo "🚀 Deploying Firestore rules..."
firebase deploy --only firestore:rules --project parentload-ba995

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firestore rules deployed successfully!"
    echo ""
    echo "📋 IMPORTANT: Now you need to create the missing index!"
    echo "=================================================="
    echo ""
    echo "Option 1 - Quick Fix (Recommended):"
    echo "Click this link to create the index automatically:"
    echo "https://console.firebase.google.com/v1/r/project/parentload-ba995/firestore/indexes?create_composite=Ck9wcm9qZWN0cy9wYXJlbnRsb2FkLWJhOTk1L2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy9ldmVudHMvaW5kZXhlcy9fEAEaDAoIZmFtaWx5SWQQARoKCgZzdGF0dXMQARoNCglzdGFydFRpbWUQAhoMCghfX25hbWVfXxAC"
    echo ""
    echo "Option 2 - Manual Creation:"
    echo "1. Go to: https://console.firebase.google.com/project/parentload-ba995/firestore/indexes"
    echo "2. Click 'Create Index'"
    echo "3. Set Collection ID: events"
    echo "4. Add fields:"
    echo "   - familyId (Ascending)"
    echo "   - status (Ascending)"
    echo "   - startTime (Descending)"
    echo "5. Click 'Create'"
    echo ""
    echo "⏳ Note: Index creation takes 5-10 minutes"
    echo ""
    echo "After the index is created, your calendar integration should work!"
else
    echo ""
    echo "❌ Failed to deploy Firestore rules"
    echo "Please run: firebase login --reauth"
    echo "Then try this script again"
fi