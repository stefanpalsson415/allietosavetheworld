#!/bin/bash

# Deploy Firestore indexes to Firebase
echo "Deploying Firestore indexes..."
firebase deploy --only firestore:indexes

echo "Done!"
echo "If you don't have the Firebase CLI installed, run: npm install -g firebase-tools"
echo "Then login with: firebase login"
