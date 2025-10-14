#!/bin/bash

# Deploy Survey System Firestore Rules

echo "🔐 Deploying Firestore security rules for new survey system..."

# Check if firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Backup existing rules
if [ -f "firestore.rules" ]; then
    echo "📋 Backing up existing firestore.rules..."
    cp firestore.rules firestore.rules.backup.$(date +%Y%m%d_%H%M%S)
fi

# Check if new rules file exists
if [ ! -f "firestore-survey-rules.txt" ]; then
    echo "❌ firestore-survey-rules.txt not found!"
    exit 1
fi

echo "📝 Instructions for updating Firestore rules:"
echo ""
echo "1. Open your existing firestore.rules file"
echo "2. Add the survey system rules from firestore-survey-rules.txt"
echo "3. Make sure to add them BEFORE the closing brace of the service block"
echo "4. Save the file"
echo ""
echo "5. Then run: firebase deploy --only firestore:rules"
echo ""
echo "Or to deploy to a specific project:"
echo "firebase deploy --only firestore:rules --project your-project-id"
echo ""
echo "⚠️  Important: The new rules include:"
echo "   - surveyResponses collection rules"
echo "   - surveyCheckpoints collection rules"
echo "   - surveyAggregates collection rules"
echo ""
echo "These rules ensure:"
echo "✅ Users can only access surveys from their family"
echo "✅ Users can only modify their own surveys"
echo "✅ Completed surveys cannot be modified (except marking as complete)"
echo "✅ Checkpoints are private to each user"
echo "✅ Aggregates are readable by family members"
echo ""

# Optional: Show the rules for review
echo "Would you like to view the new rules? (y/n)"
read -r response
if [[ "$response" == "y" ]]; then
    cat firestore-survey-rules.txt
fi

echo ""
echo "Ready to deploy? Make sure you've added the rules to firestore.rules first!"
echo "Then run: firebase deploy --only firestore:rules"