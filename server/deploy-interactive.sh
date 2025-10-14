#!/bin/bash

echo "🚀 Interactive Parentload Backend Deployment to Google Cloud Run"
echo "=================================================="
echo ""

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ You need to authenticate with Google Cloud first!"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set project ID
echo "Setting project to parentload-ba995..."
gcloud config set project parentload-ba995

echo ""
echo "📋 I need some information to deploy your backend."
echo "   (Press Enter to use the default values shown in brackets)"
echo ""

# Collect environment variables
read -p "Twilio Account SID: " TWILIO_ACCOUNT_SID
read -p "Twilio Auth Token: " TWILIO_AUTH_TOKEN
read -p "Twilio Phone Number (e.g., +17197486209): " TWILIO_PHONE_NUMBER
read -p "SendGrid API Key: " SENDGRID_API_KEY
read -p "SendGrid From Email [noreply@parentload.com]: " SENDGRID_FROM_EMAIL
SENDGRID_FROM_EMAIL=${SENDGRID_FROM_EMAIL:-noreply@parentload.com}
read -p "Claude API Key (optional): " REACT_APP_CLAUDE_API_KEY

echo ""
echo "🔄 Starting deployment to Cloud Run..."
echo "   This will take 2-5 minutes..."
echo ""

# Deploy to Cloud Run
gcloud run deploy parentload-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 60 \
  --max-instances 100 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "FRONTEND_URL=https://parentload-ba995.web.app" \
  --set-env-vars "TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID" \
  --set-env-vars "TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN" \
  --set-env-vars "TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER" \
  --set-env-vars "SENDGRID_API_KEY=$SENDGRID_API_KEY" \
  --set-env-vars "SENDGRID_FROM_EMAIL=$SENDGRID_FROM_EMAIL" \
  ${REACT_APP_CLAUDE_API_KEY:+--set-env-vars "REACT_APP_CLAUDE_API_KEY=$REACT_APP_CLAUDE_API_KEY"}

# Check if deployment was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe parentload-backend --region us-central1 --format 'value(status.url)')
    echo "🌐 Your backend is now live at:"
    echo "   $SERVICE_URL"
    echo ""
    echo "📝 I'll now update your frontend to use this backend..."
    
    # Update .env.production
    cd ..
    echo "REACT_APP_BACKEND_URL=$SERVICE_URL" > .env.production
    echo "✅ Updated .env.production"
    
    echo ""
    echo "🔨 Building the React app..."
    npm run build
    
    echo ""
    echo "🚀 Deploying to Firebase Hosting..."
    firebase deploy --only hosting
    
    echo ""
    echo "🎉 All done! Your app is fully deployed!"
    echo ""
    echo "📱 Don't forget to update your Twilio webhook URL to:"
    echo "   $SERVICE_URL/api/twilio/incoming-sms"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check the error messages above for details."
    exit 1
fi