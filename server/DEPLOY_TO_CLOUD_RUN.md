# Deploy Backend to Google Cloud Run

This guide will help you deploy the Parentload backend server to Google Cloud Run for production use.

## Prerequisites

1. Install Google Cloud SDK:
   ```bash
   # macOS with Homebrew
   brew install google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. Authenticate with Google Cloud:
   ```bash
   gcloud auth login
   ```

3. Set your project ID:
   ```bash
   gcloud config set project parentload-ba995
   ```

## Deployment Steps

### 1. Navigate to the server directory:
```bash
cd server
```

### 2. Deploy to Cloud Run:
```bash
gcloud run deploy parentload-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "TWILIO_ACCOUNT_SID=your_twilio_account_sid" \
  --set-env-vars "TWILIO_AUTH_TOKEN=your_twilio_auth_token" \
  --set-env-vars "TWILIO_PHONE_NUMBER=your_twilio_phone_number" \
  --set-env-vars "SENDGRID_API_KEY=your_sendgrid_api_key" \
  --set-env-vars "SENDGRID_FROM_EMAIL=noreply@parentload.com" \
  --set-env-vars "FRONTEND_URL=https://parentload-ba995.web.app" \
  --set-env-vars "REACT_APP_CLAUDE_API_KEY=your_claude_api_key"
```

### 3. Get your Cloud Run URL:
After deployment, you'll get a URL like:
```
https://parentload-backend-abc123-uc.a.run.app
```

### 4. Update your React app:
Update `.env.production` in the root directory:
```env
REACT_APP_BACKEND_URL=https://parentload-backend-abc123-uc.a.run.app
```

### 5. Rebuild and deploy the frontend:
```bash
cd ..  # Go back to root directory
npm run build
firebase deploy --only hosting
```

## Alternative: Using Secret Manager (More Secure)

For sensitive environment variables, use Google Secret Manager:

1. Create secrets:
```bash
echo -n "your_twilio_auth_token" | gcloud secrets create twilio-auth-token --data-file=-
echo -n "your_sendgrid_api_key" | gcloud secrets create sendgrid-api-key --data-file=-
echo -n "your_claude_api_key" | gcloud secrets create claude-api-key --data-file=-
```

2. Deploy with secrets:
```bash
gcloud run deploy parentload-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "TWILIO_ACCOUNT_SID=your_twilio_account_sid" \
  --set-env-vars "TWILIO_PHONE_NUMBER=your_twilio_phone_number" \
  --set-env-vars "SENDGRID_FROM_EMAIL=noreply@parentload.com" \
  --set-env-vars "FRONTEND_URL=https://parentload-ba995.web.app" \
  --set-secrets "TWILIO_AUTH_TOKEN=twilio-auth-token:latest" \
  --set-secrets "SENDGRID_API_KEY=sendgrid-api-key:latest" \
  --set-secrets "REACT_APP_CLAUDE_API_KEY=claude-api-key:latest"
```

## Updating the Backend

To update after making changes:
```bash
cd server
gcloud run deploy parentload-backend --source .
```

## Monitoring

View logs:
```bash
gcloud run logs read --service parentload-backend
```

View metrics in Google Cloud Console:
https://console.cloud.google.com/run

## Cost Considerations

- Cloud Run charges only when your service is handling requests
- First 2 million requests per month are free
- After that, it's about $0.40 per million requests
- See pricing: https://cloud.google.com/run/pricing

## Webhooks Configuration

After deployment, update your Twilio webhook URLs:

1. Go to Twilio Console
2. Update SMS webhook to: `https://your-cloud-run-url.run.app/api/twilio/incoming-sms`
3. Update SendGrid webhook to: `https://your-cloud-run-url.run.app/api/sendgrid/webhook`

## Troubleshooting

If deployment fails:
1. Check logs: `gcloud run logs read --service parentload-backend`
2. Ensure all environment variables are set correctly
3. Check that the Dockerfile builds locally: `docker build -t test .`
4. Verify your Google Cloud project has Cloud Run API enabled