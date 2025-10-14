# Twilio & Firebase Auth Setup Guide

## 1. Install Required Packages

```bash
# Backend packages
cd server
npm install twilio @sendgrid/mail firebase-admin dotenv express body-parser

# Frontend packages (in root)
cd ..
npm install libphonenumber-js  # For phone number formatting
```

## 2. Set Up Twilio Account

1. Sign up at https://www.twilio.com
2. Get a phone number from Twilio Console
3. Copy your credentials:
   - Account SID
   - Auth Token
   - Phone Number

## 3. Configure Webhooks

### Twilio SMS Webhook
1. Go to Twilio Console → Phone Numbers → Your Number
2. Set webhook URL for "A message comes in":
   ```
   https://your-domain.com/api/twilio/incoming-sms
   ```
3. Method: HTTP POST

### SendGrid Inbound Parse (for email receiving)
1. Sign up at https://sendgrid.com
2. Go to Settings → Inbound Parse
3. Add Host & URL:
   - Host: `allie.yourdomain.com`
   - URL: `https://your-domain.com/api/sendgrid/incoming-email`

## 4. Update Firebase Security Rules

Add to your Firestore rules:

```javascript
// SMS Messages
match /smsMessages/{messageId} {
  allow read: if request.auth != null && 
    (request.auth.uid == resource.data.userId || 
     request.auth.uid in resource.data.familyMembers);
  allow create: if false; // Only server can create
}

// Allie Tasks
match /allieTasks/{taskId} {
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow write: if false; // Only server can write
}
```

## 5. Deploy Firebase Functions

```bash
# Update functions/index.js to include Twilio routes
cd functions
npm install twilio @sendgrid/mail

# Deploy
firebase deploy --only functions
```

## 6. Environment Setup

Create `.env` file in server directory:

```env
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
SENDGRID_WEBHOOK_SECRET=whsec_xxxxx

# Firebase Admin
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
```

## 7. Test the Setup

### Test Magic Link:
```javascript
import MagicLinkService from './services/MagicLinkService';

// Send magic link
const result = await MagicLinkService.sendMagicLink('user@example.com');

// Check if current page is magic link callback
if (MagicLinkService.isSignInLink()) {
  const result = await MagicLinkService.completeMagicLinkSignIn();
}
```

### Test SMS:
```bash
# Send test SMS via curl
curl -X POST http://localhost:3001/api/twilio/send-verification \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "userId": "test-user"}'
```

## 8. Production Checklist

- [ ] Set up SSL certificate for webhooks
- [ ] Configure Firebase App Check
- [ ] Set up rate limiting for SMS
- [ ] Configure Twilio Verify (better than custom verification)
- [ ] Set up monitoring and alerts
- [ ] Configure backup phone numbers
- [ ] Set up SMS templates for different languages

## 9. Cost Estimates

### Twilio Pricing:
- SMS: ~$0.0075 per message (US)
- Phone Number: $1/month
- Verify API: $0.05 per verification

### SendGrid Pricing:
- Free tier: 100 emails/day
- Essentials: $19.95/month for 50k emails

### Firebase Auth:
- Free tier: 10k verifications/month
- Pay as you go: $0.01 per verification

## 10. Advanced Features

### Family-Specific Phone Numbers
```javascript
// Provision a number for each family
const twilioNumber = await client.incomingPhoneNumbers.create({
  phoneNumber: await client.availablePhoneNumbers('US')
    .local
    .list({ limit: 1 })
    .then(numbers => numbers[0].phoneNumber),
  smsUrl: 'https://your-domain.com/api/twilio/incoming-sms',
  smsMethod: 'POST'
});
```

### SMS Commands
- "add event [details]" → Creates calendar event
- "remind me [task]" → Creates reminder
- "ask [question]" → Gets Allie response
- Photo of schedule → OCR and parse events