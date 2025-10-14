#!/bin/bash

echo "🚀 Deploying Web Search Feature for Family Tree"
echo "================================================"

# Deploy backend changes to Cloud Run
echo ""
echo "📦 Step 1: Deploying backend server with WebSearch support..."
cd server
gcloud run deploy allie-claude-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --quiet

if [ $? -ne 0 ]; then
    echo "❌ Backend deployment failed!"
    exit 1
fi

echo "✅ Backend deployed successfully!"

# Build and deploy frontend
echo ""
echo "📦 Step 2: Building React app..."
cd ..
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed!"

# Deploy to Firebase
echo ""
echo "📦 Step 3: Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -ne 0 ]; then
    echo "❌ Firebase deployment failed!"
    exit 1
fi

echo ""
echo "🎉 SUCCESS! Web Search for Family Tree is now LIVE!"
echo ""
echo "✨ New Features Available:"
echo "  ✅ Web search for genealogy research"
echo "  ✅ AI assistance in every Story Studio tab:"
echo "     - Stories: Help writing family stories"
echo "     - Media: Help organizing photos with AI"
echo "     - Documents: Find historical records online"
echo "     - Legacy: Capture complete legacy profiles"
echo ""
echo "🌐 Live at: https://checkallie.com"
echo "🌐 Also at: https://parentload-ba995.web.app"
echo ""
echo "📝 How to use:"
echo "  1. Go to Family Tree tab"
echo "  2. Click on any family member"
echo "  3. Click 'Ask Allie' or use AI buttons in each tab"
echo "  4. Allie will search the internet for real information!"