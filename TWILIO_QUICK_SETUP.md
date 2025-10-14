# Quick Twilio Setup Guide

## What You Need to Configure

To enable SMS phone verification with Twilio, you need to:

### 1. Create a `.env` file in the `server/` directory:

```bash
cd server
touch .env
```

### 2. Add these environment variables to `server/.env`:

```
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid (if you have it)
SENDGRID_API_KEY=your_sendgrid_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Claude API (already in your main .env)
REACT_APP_CLAUDE_API_KEY=your_claude_key_here
```

### 3. Get Your Twilio Credentials:

1. **Sign up for Twilio** at https://www.twilio.com/try-twilio
   - You get $15 free credit to start
   
2. **From your Twilio Console** (https://console.twilio.com):
   - **Account SID**: Found on the dashboard homepage
   - **Auth Token**: Click "View" on the dashboard to reveal it
   - **Phone Number**: Buy a phone number ($1/month) or use the trial number

### 4. Restart Your Servers:

After adding the `.env` file, restart using:

```bash
./start-simple.sh
```

## How to Test

### Option 1: With Twilio Configured
1. Enter your real phone number in the verification form
2. Click "Send Code"
3. You'll receive an SMS with a 4-digit code
4. Enter the code to verify

### Option 2: Without Twilio (Demo Mode)
1. Enter any valid phone number format
2. Click "Send Code"
3. Open browser console (F12)
4. Look for the message: `🔐 Verification code for +1XXXXXXXXXX: XXXX`
5. Enter that 4-digit code

## Verification Features

- **Phone Validation**: Real-time validation as you type
- **Country Support**: 140+ countries with proper formatting
- **Visual Feedback**: Green ✓ for valid, red ⚠️ for invalid numbers
- **International Format**: Shows full number with country code

## Cost Considerations

- **Twilio Trial**: Free $15 credit (hundreds of SMS)
- **Phone Number**: $1/month for a US number
- **SMS Cost**: ~$0.0075 per SMS in the US
- **International**: Varies by country (typically $0.01-0.10)

## Troubleshooting

### Server Not Finding Twilio
Make sure the `.env` file is in the `server/` directory, not the root directory.

### "Twilio service not available"
Check the console when starting `./start-simple.sh`. You should see:
```
📱 Twilio: ✅ Configured
📞 Twilio Phone: +1234567890
```

### SMS Not Sending
1. Check Twilio console for errors
2. Verify your account isn't in trial restrictions
3. For trial accounts, you can only send to verified numbers

## Security Notes

- Never commit the `.env` file to git (it's already in `.gitignore`)
- The verification codes expire after 5 minutes
- Codes are 4 digits in demo mode, can be 6 digits in production
- Phone numbers are stored encrypted in Firebase

## Additional Features

Once phone verification is working, users can:
- Text Allie directly at your Twilio number
- Send photos via MMS
- Receive SMS notifications from Allie
- Get reminders and updates via text