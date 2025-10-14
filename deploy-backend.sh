#!/bin/bash

# Deploy Backend to Google Cloud Run

echo "🚀 Deploying Allie Backend to Cloud Run..."

# Set variables
PROJECT_ID="parentload-ba995"
SERVICE_NAME="parentload-backend"
REGION="us-central1"

# Navigate to server directory
cd server

# Check if gcloud is authenticated
echo "📝 Checking Google Cloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "❌ Not authenticated with Google Cloud"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo "🔧 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Build and deploy using Cloud Build
echo "🏗️ Building and deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production" \
    --set-env-vars "SENDGRID_API_KEY=$SENDGRID_API_KEY" \
    --set-env-vars "SENDGRID_FROM_EMAIL=hello@allie.family" \
    --set-env-vars "TWILIO_ACCOUNT_SID=$TWILIO_ACCOUNT_SID" \
    --set-env-vars "TWILIO_AUTH_TOKEN=$TWILIO_AUTH_TOKEN" \
    --set-env-vars "TWILIO_PHONE_NUMBER=$TWILIO_PHONE_NUMBER" \
    --set-env-vars "ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY" \
    --set-env-vars "ANTHROPIC_SALES_API_KEY=$ANTHROPIC_SALES_API_KEY" \
    --set-env-vars "FRONTEND_URL=https://checkallie.com"

# Get the service URL
echo "✅ Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo "🎉 Deployment complete!"
echo "📍 Service URL: $SERVICE_URL"
echo ""
echo "⚠️  IMPORTANT: Update your frontend .env.production file:"
echo "REACT_APP_BACKEND_URL=$SERVICE_URL"
echo ""
echo "Then rebuild and deploy the frontend:"
echo "npm run build && firebase deploy --only hosting"