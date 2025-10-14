# Complete Email System Setup Guide

## Overview

This guide will help you set up the complete email system for Parentload using:
- **SendGrid** for sending emails and receiving inbound emails
- **Twilio** for SMS/MMS support
- **ngrok** with custom domain `tunnel.checkallie.com` for webhooks

## Prerequisites

- [x] SendGrid account with API key
- [x] Twilio account with phone number
- [x] ngrok account with custom domain
- [x] Node.js installed
- [x] Domain email address (stefan@checkallie.com)

## Step 1: Start the Server

```bash
cd server
./manage-servers.sh start
```

This will:
1. Start the backend server on port 3002
2. Start ngrok tunnel with your custom domain
3. Show all the webhook URLs

## Step 2: Configure SendGrid Inbound Parse

1. **Go to SendGrid Inbound Parse Settings:**
   https://app.sendgrid.com/settings/parse

2. **Add Host & URL:**
   - **Subdomain**: `family` (or leave blank for all emails)
   - **Domain**: `checkallie.com`
   - **Destination URL**: `https://tunnel.checkallie.com/api/inbound/email`
   
3. **Settings:**
   - ✅ Check "POST the raw, full MIME message"
   - ✅ Check "Check incoming emails for spam"

4. **Save** the configuration

## Step 3: Configure Twilio SMS/MMS

1. **Go to Twilio Phone Numbers:**
   https://console.twilio.com/console/phone-numbers/incoming

2. **Click on your phone number** (+17197486209)

3. **Configure Messaging:**
   - **A message comes in**: 
     - Webhook: `https://tunnel.checkallie.com/api/inbound/sms`
     - HTTP: POST
   
4. **Save** the configuration

## Step 4: Test the System

### Test Email Reception

1. **Send a test email to:**
   ```
   stefan@checkallie.com
   ```
   
   Subject: `Test from [Your Email]`
   Body: `This is a test email to Allie`

2. **Check server logs:**
   ```bash
   # In another terminal
   cd server
   ./manage-servers.sh logs
   ```

3. **Expected result:**
   - Email should be received by the webhook
   - Server should log the email details
   - You should see the parsed content

### Test SMS Reception

1. **Send a test SMS to:** +17197486209
   
   Message: `Test SMS to Allie`

2. **Check server logs** for the received message

### Test with Script

Run the comprehensive test:
```bash
cd server
./test-tunnel-domain.sh
```

## Step 5: Family Email Setup

Each family can have their own email address:

1. **Create family email:**
   ```bash
   # This happens automatically when a family is created
   # Format: family-{familyId}@checkallie.com
   ```

2. **Family members can email their family address:**
   - Emails are parsed and stored in Firebase
   - Allie can read and respond to these emails

## Troubleshooting

### Server not starting
```bash
# Check if port is in use
lsof -i:3002

# Kill any existing process
./manage-servers.sh stop
./manage-servers.sh start
```

### ngrok not working
```bash
# Make sure you're logged in
ngrok config add-authtoken YOUR_TOKEN

# Check ngrok status
curl https://tunnel.checkallie.com/api/test
```

### Emails not being received
1. Check SendGrid Inbound Parse settings
2. Verify MX records for your domain
3. Check server logs for errors
4. Test webhook directly:
   ```bash
   curl -X POST https://tunnel.checkallie.com/api/inbound/email \
     -H "Content-Type: application/json" \
     -d '{"test": true}'
   ```

### SMS not being received
1. Check Twilio webhook configuration
2. Verify phone number is active
3. Check server logs
4. Test webhook directly:
   ```bash
   curl -X POST https://tunnel.checkallie.com/api/inbound/sms \
     -H "Content-Type: application/json" \
     -d '{"From": "+1234567890", "Body": "Test"}'
   ```

## Security Notes

1. **Token Security:**
   - The webhook URLs can include a security token
   - Production URL: `https://tunnel.checkallie.com/api/inbound/email/YOUR_TOKEN`

2. **HTTPS Only:**
   - Always use HTTPS URLs for webhooks
   - ngrok provides SSL automatically

3. **Domain Verification:**
   - Your custom domain ensures consistent webhook URLs
   - No need to update URLs when restarting ngrok

## Daily Operations

### Starting the system
```bash
cd server
./manage-servers.sh start
```

### Checking status
```bash
./manage-servers.sh status
```

### Viewing logs
```bash
./manage-servers.sh logs
```

### Stopping the system
```bash
./manage-servers.sh stop
```

## Next Steps

1. ✅ Server is running with custom domain
2. ✅ SendGrid is configured for inbound email
3. ✅ Twilio is configured for SMS/MMS
4. 🔄 Test sending emails to stefan@checkallie.com
5. 🔄 Test sending SMS to +17197486209
6. 🔄 Monitor logs for incoming messages

## Support

If you encounter any issues:
1. Check the server logs
2. Run the test script: `./test-tunnel-domain.sh`
3. Verify webhook URLs in SendGrid and Twilio
4. Check that ngrok is running with your custom domain