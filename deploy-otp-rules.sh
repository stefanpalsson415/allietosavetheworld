#!/bin/bash

echo "🚀 Deploying Firestore rules to fix OTP authentication..."

# Deploy the Firestore rules
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully!"
    echo ""
    echo "📋 What was fixed:"
    echo "• Added read permission for users collection during OTP flow"
    echo "• Added create permission for new users during OTP flow"
    echo "• This allows OTPAuthService to check if user exists before authentication"
    echo ""
    echo "🔄 Please try the OTP login again now!"
else
    echo "❌ Failed to deploy Firestore rules"
    echo "Make sure you're logged in to Firebase CLI: firebase login"
fi