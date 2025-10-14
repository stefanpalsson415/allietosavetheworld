# Webhook Setup Guide for Parentload

## Overview
This guide walks you through setting up SendGrid Inbound Parse and Twilio SMS webhooks for Parentload.

## 1. DNS Setup for Email (families.checkallie.com)

### Add MX Record
1. Go to your DNS provider (where checkallie.com is registered)
2. Add a new MX record:
   ```
   Type: MX
   Name: families (this creates families.checkallie.com)
   Priority: 10
   Value: mx.sendgrid.net
   ```

### Verify DNS
```bash
# Check MX record (may take 5-30 minutes to propagate)
dig MX families.checkallie.com

# Should return:
# families.checkallie.com. 300 IN MX 10 mx.sendgrid.net.
```

## 2. SendGrid Inbound Parse Setup

### Step 1: Domain Authentication
1. Log into SendGrid Dashboard
2. Go to **Settings > Sender Authentication**
3. Click **Authenticate Your Domain**
4. Choose your DNS provider
5. Add the CNAME records they provide to your DNS

### Step 2: Configure Inbound Parse
1. Go to **Settings > Inbound Parse**
2. Click **Add Host & URL**
3. Configure:
   - **Subdomain**: `families`
   - **Domain**: `checkallie.com` (select from dropdown)
   - **Destination URL**: 
     - Development: `https://YOUR-NGROK-URL.ngrok.io/api/emails/inbound`
     - Production: `https://your-server.com/api/emails/inbound`
   - ✅ **Check**: POST the raw, full MIME message
   - ✅ **Check**: Check incoming email for spam
4. Click **Add**

### Step 3: Test Email Forwarding
```bash
# Send a test email to any address at your domain
echo "Test email body" | mail -s "Test Subject" test@families.checkallie.com

# Check your server logs
# You should see: "📧 Incoming email received"
```

## 3. Twilio SMS Webhook Setup

### Step 1: Get Your Twilio Phone Number
1. Log into Twilio Console
2. Go to **Phone Numbers > Manage > Active Numbers**
3. Click on your phone number

### Step 2: Configure Webhook
1. In the **Messaging** section:
   - **A message comes in**: 
     - Webhook: `https://your-server.com/api/sms/inbound`
     - Method: `HTTP POST`
2. Click **Save**

### Step 3: Test SMS
1. Text your Twilio number
2. Check server logs for: "📱 Incoming SMS received"

## 4. Local Development with ngrok

### Install ngrok
```bash
# macOS
brew install ngrok

# or download from https://ngrok.com
```

### Expose Your Local Server
```bash
# Start your server
cd server && npm start

# In another terminal, expose port 3001
ngrok http 3001

# You'll get a URL like: https://abc123.ngrok.io
```

### Update Webhook URLs
Use your ngrok URL for webhooks:
- SendGrid: `https://abc123.ngrok.io/api/emails/inbound`
- Twilio: `https://abc123.ngrok.io/api/sms/inbound`

## 5. Production Deployment

### Server Requirements
- HTTPS endpoint (required by both SendGrid and Twilio)
- Public IP address
- Port 443 open
- Valid SSL certificate

### Environment Variables
```env
# Production .env
NODE_ENV=production
PORT=3001

# SendGrid
SENDGRID_API_KEY=your-api-key
SENDGRID_FROM_EMAIL=noreply@checkallie.com

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Database
DATABASE_URL=your-database-url
REDIS_URL=your-redis-url
```

### Security Considerations

1. **Validate Webhook Sources**:
   ```javascript
   // For Twilio
   const twilioSignature = req.headers['x-twilio-signature'];
   const isValid = twilio.validateRequest(
     authToken,
     twilioSignature,
     url,
     params
   );
   ```

2. **Rate Limiting**:
   ```javascript
   const rateLimit = require('express-rate-limit');
   const limiter = rateLimit({
     windowMs: 1 * 60 * 1000, // 1 minute
     max: 100 // limit each IP to 100 requests per minute
   });
   app.use('/api/emails/inbound', limiter);
   ```

3. **IP Whitelisting** (optional):
   - SendGrid IPs: Check their documentation
   - Twilio IPs: Available in their security guide

## 6. Monitor and Debug

### Check Webhook Activity

**SendGrid**:
1. Go to **Activity Feed**
2. Filter by "Inbound Parse"
3. Check for errors

**Twilio**:
1. Go to **Monitor > Logs > Errors**
2. Check webhook failures

### Debug Tips
1. Log all incoming webhook data
2. Use request bin for testing: https://requestbin.com
3. Check server logs for processing errors
4. Monitor your inbox endpoint: `/api/family/inbox`

## 7. Testing Checklist

- [ ] DNS MX record resolves correctly
- [ ] SendGrid domain authenticated
- [ ] Can receive emails at test@families.checkallie.com
- [ ] Email webhook processes and stores messages
- [ ] SMS webhook receives and processes texts
- [ ] Family inbox shows processed messages
- [ ] Allie actions are created correctly
- [ ] Response SMS/emails are sent

## Common Issues

### Emails Not Arriving
- Check MX record propagation (can take up to 48 hours)
- Verify domain authentication in SendGrid
- Check spam folder
- Ensure webhook URL is publicly accessible

### SMS Not Working
- Verify Twilio phone number is active
- Check webhook URL is HTTPS
- Ensure ngrok is running (for local dev)
- Check Twilio error logs

### Webhook Failures
- Always return 200 OK status
- Handle errors gracefully
- Log everything for debugging
- Check server is accessible from internet