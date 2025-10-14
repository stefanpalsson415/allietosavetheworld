# Calendar OAuth Setup Guide

This guide explains how to set up Google Calendar and Outlook Calendar integration for Allie.

## Google Calendar Setup

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project or select existing one

2. **Enable Google Calendar API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Name: "Allie Calendar Integration"
   - Add your domain to "Authorized JavaScript origins":
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Add redirect URIs:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   
   **Important**: The scope `https://www.googleapis.com/auth/calendar` provides:
   - ✅ **Full calendar access** (read, write, delete events)
   - ✅ **Create new events** in user's calendar
   - ✅ **Modify existing events** (time, location, attendees)
   - ✅ **Delete events** when needed
   - ✅ **Access all calendar metadata**

4. **Create API Key**
   - Click "Create Credentials" > "API key"
   - Restrict the key to Google Calendar API for security

5. **Update Environment Variables**
   ```bash
   REACT_APP_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   REACT_APP_GOOGLE_API_KEY=your-api-key
   ```

## Outlook Calendar Setup

1. **Go to Azure Portal**
   - Visit: https://portal.azure.com/
   - Navigate to "Azure Active Directory" > "App registrations"

2. **Create App Registration**
   - Click "New registration"
   - Name: "Allie Calendar Integration"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: 
     - Type: "Single-page application (SPA)"
     - URI: `http://localhost:3000` (add production URL later)

3. **Configure API Permissions**
   - Go to "API permissions"
   - Click "Add a permission"
   - Choose "Microsoft Graph"
   - Select "Delegated permissions"
   - Add: `Calendars.ReadWrite`
   - Grant admin consent if required

4. **Update Environment Variables**
   ```bash
   REACT_APP_OUTLOOK_CLIENT_ID=your-outlook-client-id
   ```

## User Experience

After setup, users will see:

### Google Calendar
- Simple "Connect with Google" button
- Standard Google OAuth flow (like the screenshot you showed)
- No technical fields to fill out

### Outlook Calendar  
- Simple "Connect with Outlook" button
- Standard Microsoft OAuth flow
- Works with both Office 365 and personal Outlook.com accounts

## Features

- **One-click connection** - No technical knowledge required
- **Two-way sync** - Events sync in both directions
- **Secure OAuth** - Industry standard authentication
- **Visual feedback** - Clear connection status and error messages
- **Easy disconnect** - Simple button to remove connections

## Development Notes

The credentials in `.env` are placeholder values. Replace them with your actual OAuth credentials before deploying to production.

For development, you can use test credentials that redirect to localhost:3000.