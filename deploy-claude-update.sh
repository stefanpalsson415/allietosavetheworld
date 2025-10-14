#!/bin/bash

echo "🚀 Deploying Claude Sonnet 4 Update to Firebase Functions"
echo "================================================"

# Navigate to functions directory
cd functions

# Install dependencies (if needed)
echo "📦 Checking dependencies..."
npm install

# Deploy the claude function specifically
echo "🔄 Deploying Claude function with Sonnet 4 model..."
firebase deploy --only functions:claude

echo "✅ Deployment complete!"
echo "================================================"
echo "The Claude API now uses claude-sonnet-4-20250514 with web search capability"
echo "Test the update by asking Allie to search for information about a family member"