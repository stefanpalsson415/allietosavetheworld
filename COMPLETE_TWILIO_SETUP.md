# Complete Twilio Setup for SMS to Allie

## Current Status
✅ Claude API updated to use claude-3-opus-20240229 (Claude 4.1)
✅ Cloud Run has REACT_APP_CLAUDE_API_KEY configured
✅ Twilio phone number configured: +1 (719) 748-6209
❌ Twilio credentials need to be added to Cloud Run

## What You Need to Do

### 1. Get Your Twilio Credentials
1. Go to [Twilio Console](https://console.twilio.com)
2. Find your **Account SID** (starts with AC...)
3. Find your **Auth Token** (click to reveal)

### 2. Add Twilio Credentials to Cloud Run

Run this command with your actual credentials:

```bash
gcloud run services update parentload-backend \
  --region=us-central1 \
  --update-env-vars="TWILIO_ACCOUNT_SID=YOUR_ACCOUNT_SID_HERE,TWILIO_AUTH_TOKEN=YOUR_AUTH_TOKEN_HERE"
```

### 3. Verify Twilio Webhook Configuration
1. Go to [Twilio Phone Numbers](https://console.twilio.com/us1/develop/phone-numbers/manage/incoming)
2. Click on **+1 (719) 748-6209**
3. In the **Messaging Configuration** section, ensure:
   - **A message comes in** webhook is set to:
     ```
     https://parentload-backend-363935868004.us-central1.run.app/api/sms/inbound
     ```
   - Method: **HTTP POST**

### 4. Test the Complete System

#### Test SMS Processing:
1. Send a test SMS to **+1 (719) 748-6209** with:
   ```
   Remind me: Tennis lesson for Tegner next Thursday at 3pm at the club
   ```

2. You should receive a response like:
   ```
   Got it! I'm processing your message...
   ```

3. Check your app to see:
   - The message appears in the Unified Inbox
   - A calendar event was created
   - A task/reminder was added

#### Test Email Processing:
1. Send an email to: **palsson@families.checkallie.com**
2. Check the Unified Inbox to see it processed

## How the System Works

### SMS Flow:
1. User texts +1 (719) 748-6209
2. Twilio receives the SMS
3. Twilio sends webhook to your Cloud Run backend
4. Backend processes with Claude 4.1 to extract:
   - Calendar events
   - Tasks/reminders
   - Contacts
5. Data is saved to Firestore
6. Response SMS is sent back to user
7. Message appears in Unified Inbox

### Email Flow:
1. User emails palsson@families.checkallie.com
2. SendGrid receives the email
3. SendGrid sends webhook to your Cloud Run backend
4. Backend processes with Claude 4.1
5. Data saved to Firestore
6. Email appears in Unified Inbox

## Troubleshooting

### If SMS doesn't work:
1. Check Cloud Run logs:
   ```bash
   gcloud run logs read parentload-backend --region=us-central1 --limit=50
   ```

2. Verify environment variables:
   ```bash
   gcloud run services describe parentload-backend --region=us-central1 --format="value(spec.template.spec.containers[0].env[].name)"
   ```
   Should include:
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER
   - REACT_APP_CLAUDE_API_KEY

### If messages don't appear in inbox:
1. Check Firestore collections:
   - `smsInbox` - for SMS messages
   - `emailInbox` - for emails
   - `events` - for extracted calendar events
   - `kanbanTasks` - for extracted tasks

2. Verify family ID linkage in the database

## Success Indicators
✅ SMS to +1 (719) 748-6209 gets a response
✅ Messages appear in Unified Inbox
✅ Calendar events are automatically created
✅ Tasks are added to the task board
✅ Knowledge Graph processes the information