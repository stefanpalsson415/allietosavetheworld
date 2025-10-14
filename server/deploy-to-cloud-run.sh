#!/bin/bash

echo "🚀 Deploying Parentload Backend to Google Cloud Run"
echo ""

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ You need to authenticate with Google Cloud first!"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set project ID
echo "Setting project to parentload-ba995..."
gcloud config set project parentload-ba995

# Deploy to Cloud Run
echo ""
echo "🔄 Starting deployment to Cloud Run..."
echo "This will take a few minutes..."
echo ""

# Deploy with environment variables
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
  --set-env-vars "REACT_APP_CLAUDE_API_KEY=$REACT_APP_CLAUDE_API_KEY"

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
    echo "📝 Next steps:"
    echo "1. Update your React app's .env.production file:"
    echo "   REACT_APP_BACKEND_URL=$SERVICE_URL"
    echo ""
    echo "2. Rebuild and deploy the frontend:"
    echo "   cd .."
    echo "   npm run build"
    echo "   firebase deploy --only hosting"
    echo ""
    echo "3. Update Twilio webhook URL to:"
    echo "   $SERVICE_URL/api/twilio/incoming-sms"
else
    echo ""
    echo "❌ Deployment failed!"
    echo "Check the error messages above for details."
    exit 1
fi