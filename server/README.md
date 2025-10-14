# Parentload Backend Server

This server handles SMS (Twilio) and Email (SendGrid) integration for Parentload.

## Current Status ✅
- SendGrid email sending is working
- OTP generation and verification is working
- Server runs on port 3001
- CORS is configured for the React app on port 3000

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token  # REGENERATE THIS - CURRENT ONE IS COMPROMISED
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=your@email.com

# Server
PORT=3001
FRONTEND_URL=http://localhost:3000
```

## Running the Server

### Development Mode
```bash
# Start server
npm start

# Or with nodemon for auto-restart
npm run dev

# Run the simple working server directly
node server-simple.js
```

### Test the Server
```bash
# Run all tests (starts server, runs tests, then stops)
./test-all.sh

# Or test manually while server is running:
curl http://localhost:3001/api/test

# Send test OTP
curl -X POST http://localhost:3001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","userName":"Your Name"}'
```

## API Endpoints

### Authentication
- `POST /api/auth/send-otp` - Send OTP to email
- `POST /api/auth/verify-otp` - Verify OTP code
- `POST /api/auth/resend-otp` - Resend OTP

### Twilio
- `POST /api/twilio/send-verification` - Send SMS verification
- `POST /api/twilio/verify-code` - Verify SMS code
- `POST /api/twilio/incoming-sms` - Webhook for incoming SMS

### SendGrid
- `POST /api/sendgrid/incoming-email` - Webhook for incoming emails
- `POST /api/sendgrid/create-family-email` - Create family email address

### Testing
- `GET /api/test` - Check server status
- `POST /api/twilio/test` - Check Twilio configuration
- `POST /api/sendgrid/test` - Check SendGrid configuration

## Webhooks Setup

### Twilio
1. Go to Twilio Console > Phone Numbers
2. Click on your phone number
3. Set Webhook URL for incoming messages:
   ```
   https://your-domain.com/api/twilio/incoming-sms
   ```

### SendGrid
1. Go to SendGrid > Settings > Inbound Parse
2. Add your domain
3. Set webhook URL:
   ```
   https://your-domain.com/api/sendgrid/incoming-email
   ```

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env` files
- Regenerate compromised tokens immediately
- Use environment variables for all secrets
- Enable CORS only for your frontend domain in production