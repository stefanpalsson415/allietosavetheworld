# Backend Server Deployment Required for Production

## Issue
The mobile phone verification is failing in production because the Twilio SMS functionality requires a backend server, which is not currently deployed.

## Current Setup
- **Development**: Working correctly with `server/server-simple.js` running on `localhost:3002`
- **Production**: No backend server deployed, causing SMS verification to fail

## Solution
You need to deploy the backend server (`server/server-simple.js`) to a cloud provider. Here are your options:

### Option 1: Deploy to Railway (Recommended - Easy & Fast)
1. Sign up at [railway.app](https://railway.app)
2. Connect your GitHub repo
3. Add environment variables:
   ```
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=noreply@parentload.com
   FRONTEND_URL=https://parentload-ba995.web.app
   ```
4. Deploy the `server` directory
5. Get your production URL (e.g., `https://your-app.railway.app`)

### Option 2: Deploy to Heroku
1. Install Heroku CLI
2. In the `server` directory:
   ```bash
   heroku create parentload-backend
   heroku config:set TWILIO_ACCOUNT_SID=your_sid
   heroku config:set TWILIO_AUTH_TOKEN=your_token
   heroku config:set TWILIO_PHONE_NUMBER=your_number
   heroku config:set SENDGRID_API_KEY=your_key
   heroku config:set SENDGRID_FROM_EMAIL=noreply@parentload.com
   heroku config:set FRONTEND_URL=https://parentload-ba995.web.app
   git push heroku main
   ```

### Option 3: Deploy to Google Cloud Run
1. Create a Dockerfile in the `server` directory
2. Deploy using gcloud CLI
3. Set environment variables in Cloud Run console

## After Deployment

1. Set the backend URL in your React app:
   - Add to `.env.production`:
     ```
     REACT_APP_BACKEND_URL=https://your-backend-url.com
     ```

2. Rebuild and deploy the frontend:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

## Temporary Workaround
Until you deploy the backend, the app will show: "SMS verification is not configured for production. Please deploy the backend server."

## Files Already Updated
- `src/components/onboarding/OnboardingFlow.jsx` - Updated to use `REACT_APP_BACKEND_URL`
- Removed duplicate Firebase Functions code that was conflicting

## Existing Backend Features
Your `server/server-simple.js` includes:
- Twilio SMS verification (`/api/twilio/send-verification`, `/api/twilio/verify-code`)
- Email OTP authentication (`/api/auth/send-otp`, `/api/auth/verify-otp`)
- Family email service
- Inbound email/SMS webhooks
- Claude AI proxy (if needed)