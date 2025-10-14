#!/bin/bash

echo "🚀 Deploying Updated Email Template to Cloud Run"
echo "==============================================="
echo ""

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &>/dev/null; then
    echo "⚠️  Please login to Google Cloud first:"
    echo "Run: gcloud auth login"
    exit 1
fi

echo "✅ Authenticated with Google Cloud"
echo ""

# Deploy the backend with the new email template
echo "📦 Deploying backend server..."
cd server
gcloud run deploy parentload-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --project parentload-ba995

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Email template updated successfully!"
    echo ""
    echo "📧 Test the new email design:"
    echo "1. Go to your app and request a verification code"
    echo "2. Check your email for the beautiful new design"
    echo ""
    echo "Features of the new email:"
    echo "✨ Clean, modern design"
    echo "🎨 Purple/pink gradient matching Allie brand"
    echo "📱 Mobile-responsive layout"
    echo "💌 Compatible with all email clients"
    echo "🔢 Clear, prominent OTP code display"
else
    echo ""
    echo "❌ Deployment failed"
    echo "Please run: gcloud auth login"
    echo "Then try this script again"
fi