# Google Calendar Integration Setup Guide

## Overview
This guide will help you set up Google Calendar integration for Allie using Google OAuth 2.0. This allows users to connect their Google Calendar and sync events between Allie and Google Calendar.

## Prerequisites
- Google Cloud Platform account
- Domain ownership (for production)
- Basic understanding of OAuth 2.0

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "Allie Calendar Integration"
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" (unless you have Google Workspace)
3. Fill in the required information:
   - **App name**: Allie Family Assistant
   - **User support email**: your-email@example.com
   - **Developer contact information**: your-email@example.com
   - **App domain**: checkallie.com (or your domain)
   - **Authorized domains**: 
     - checkallie.com
     - localhost (for development)

4. **Scopes**: Add these scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`

5. **Test users** (for development):
   - Add your test email addresses

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Configure the client:
   - **Name**: Allie Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://checkallie.com` (production)
     - `https://www.checkallie.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/auth/verify` (development)
     - `https://checkallie.com/auth/verify` (production)
     - `https://www.checkallie.com/auth/verify` (production)

5. Click "Create"
6. **Save the Client ID and Client Secret** - you'll need these

## Step 5: Create API Key (for Calendar API access)

1. In "Credentials", click "Create Credentials" → "API Key"
2. **Restrict the API key**:
   - Click on the API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Calendar API"
   - Under "Website restrictions", add your domains:
     - `localhost:3000/*` (development)
     - `checkallie.com/*` (production)
     - `www.checkallie.com/*` (production)

## Step 6: Configure Environment Variables

Add these environment variables to your application:

### Development (.env.local)
```bash
REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
REACT_APP_GOOGLE_API_KEY=your-api-key
```

### Production
Set these in your hosting platform (Vercel, Netlify, etc.):
- `REACT_APP_GOOGLE_CLIENT_ID`
- `REACT_APP_GOOGLE_API_KEY`

## Step 7: Test the Integration

1. **In Development**:
   - Start your React app: `npm start`
   - Go to Settings → Calendar & Events
   - Click "Setup Integration"
   - Enter your Client ID and API Key
   - Click "Connect Google Calendar"
   - Complete the OAuth flow

2. **Testing Checklist**:
   - [ ] OAuth popup opens correctly
   - [ ] User can grant permissions
   - [ ] Events sync from Google Calendar to Allie
   - [ ] Events created in Allie appear in Google Calendar
   - [ ] No CORS errors in browser console

## Step 8: Production Deployment

1. **Update OAuth consent screen** to "In production" status
2. **Verify domain ownership** in Google Search Console
3. **Update redirect URIs** to use production domain
4. **Set production environment variables**

## Security Best Practices

1. **API Key Restrictions**:
   - Always restrict API keys to specific APIs and domains
   - Regularly rotate API keys

2. **OAuth Client Security**:
   - Use HTTPS in production
   - Validate redirect URIs
   - Don't expose client secrets in frontend code

3. **Token Management**:
   - Store access tokens securely
   - Implement token refresh logic
   - Respect token expiration

## Common Issues and Solutions

### CORS Errors
- Ensure your domain is added to "Authorized JavaScript origins"
- Check that the domain matches exactly (with/without www)

### Redirect URI Mismatch
- Verify the redirect URI in your OAuth client matches the one in your app
- Check for trailing slashes or protocol mismatches

### Scope Permissions
- Ensure you've added the correct scopes in the OAuth consent screen
- Check that users are granting the necessary permissions

### API Quota Limits
- Monitor your API usage in Google Cloud Console
- Implement rate limiting if needed
- Consider caching calendar data

## File Locations in Codebase

- **Google Calendar Adapter**: `/src/components/calendar-v2/services/GoogleCalendarAdapter.js`
- **Calendar Sync Settings**: `/src/components/calendar-v2/views/CalendarSyncSettings.js`
- **Integration UI**: `/src/components/user/UserSettingsScreen.jsx` (Calendar & Events tab)

## Support Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [OAuth 2.0 for Client-side Applications](https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow)
- [Google API JavaScript Client](https://github.com/google/google-api-javascript-client)

## Next Steps

After setting up Google Calendar integration, consider:
1. Adding Outlook Calendar support
2. Implementing calendar webhooks for real-time sync
3. Adding calendar sharing features
4. Creating calendar export/import functionality