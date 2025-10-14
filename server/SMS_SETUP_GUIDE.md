# SMS/MMS Setup Guide for Allie

## Overview
You can now text Allie to:
- Send reminders and create tasks
- Text photos of schedules, flyers, or documents
- Create calendar events
- Get quick responses from Allie

## Current Setup Status

### ✅ What's Already Done:
1. **Twilio Configuration** - Your credentials are set up in `.env`
2. **SMS Webhook Handler** - Complete handler at `/api/sms/inbound`
3. **Firebase Integration** - SMS messages save to `smsInbox` collection
4. **Unified Inbox** - SMS/MMS appear alongside emails in the inbox
5. **Image Processing** - MMS images are saved to family documents
6. **AI Processing** - Basic intent detection for reminders, appointments, etc.

### 🔧 What You Need to Do:

## Step 1: Configure Twilio Webhook

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your number: **+1 (719) 748-6209**
4. In the **Messaging** section, set:
   - **A message comes in**: 
     - Webhook: `https://YOUR-NGROK-URL.ngrok-free.app/api/sms/inbound`
     - HTTP Method: `POST`
   - Save the configuration

## Step 2: Test the Server

1. Start all servers:
```bash
cd /Users/stefanpalsson/parentload\ copy/parentload-clean
./manage-servers.sh
```

2. Test the SMS endpoint:
```bash
curl http://localhost:3002/api/sms/test
```

You should see:
```json
{
  "success": true,
  "message": "SMS webhook is ready",
  "twilioNumber": "+17197486209",
  "configured": true
}
```

## Step 3: Send a Test SMS

1. From your phone, text to **+1 (719) 748-6209**:
   - "Remind me to pick up milk"
   - "Doctor appointment tomorrow at 2pm"
   - Send a photo of a flyer or schedule

2. Check the app:
   - Open the Unified Inbox
   - You should see your SMS appear
   - Allie will process it and create tasks/events

## Step 4: Features Available

### Text Commands:
- **Reminders**: "Remind me to...", "Don't forget...", "Remember to..."
  - Creates a task in your family kanban board
  
- **Appointments**: "Appointment", "Meeting", "Doctor visit"
  - Creates a calendar event (currently set for next day)
  
- **Activities**: "Soccer practice", "Game at..."
  - Creates activity events

- **Images**: Send photos of:
  - School flyers
  - Sports schedules
  - Medical forms
  - Any document

### Allie's Responses:
- ✅ "I've added that to your family tasks!"
- 📅 "I've added the appointment to your calendar!"
- ⚽ "Sports activity added to the calendar!"
- 📸 "I've saved your image(s) to the family drive!"

## Step 5: Production Setup (When Ready)

### For Fixed Ngrok Domain:
1. Update Twilio webhook to your fixed domain
2. Set environment variable:
   ```bash
   export NGROK_DOMAIN=your-domain.ngrok-free.app
   ```

### For Production Deployment:
1. Deploy server to cloud (Heroku, AWS, etc.)
2. Update Twilio webhook to production URL
3. Enable Twilio webhook validation
4. Set up monitoring and alerts

## Troubleshooting

### SMS Not Appearing:
1. Check ngrok is running: `http://localhost:4040`
2. Verify webhook URL in Twilio matches ngrok URL
3. Check server logs for incoming webhooks
4. Verify family has `emailPrefix: 'palsson'` in Firestore

### Images Not Processing:
1. Ensure MMS is enabled on your Twilio number
2. Check image URLs are accessible
3. Verify `familyDocuments` collection permissions

### No Response SMS:
1. Check Twilio auth token is correct
2. Verify phone number format includes country code
3. Check Twilio account has SMS credits

## Advanced Features (Coming Soon)

1. **Claude Vision Integration**
   - Process images with AI to extract text
   - Automatically create events from photographed schedules
   
2. **Smart Context**
   - Remember previous conversations
   - Understand family member names
   
3. **Voice Transcription**
   - Send voice messages to Allie
   - Get transcribed and processed

## Testing Different Scenarios

```bash
# Test reminder
"Remind me to call the dentist tomorrow"

# Test appointment
"Doctor appointment next Tuesday at 3pm"

# Test with image
[Photo of soccer schedule] "Here's Tegner's soccer schedule"

# Test general note
"Tegner needs new cleats size 4"
```

## Security Notes

⚠️ **IMPORTANT**: Your Twilio auth token in `.env` has been exposed. Please:
1. Go to Twilio Console
2. Navigate to Account → API keys & tokens
3. Create a new auth token
4. Update the `.env` file with the new token
5. Never commit `.env` files to version control

## Next Steps

1. Test SMS functionality
2. Configure production deployment
3. Add more intelligent AI processing
4. Integrate with Claude for vision processing of images