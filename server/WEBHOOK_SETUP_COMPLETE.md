# Webhook Setup Complete! 🎉

Your permanent webhook URLs are now configured with `tunnel.checkallie.com`!

## Your Webhook URLs

### SendGrid (Email)
**Inbound Parse URL:**
```
https://tunnel.checkallie.com/api/emails/inbound
```

**With Security Token (for production):**
```
https://tunnel.checkallie.com/api/emails/inbound/956efd786d1627b507c8fa65953b4110a51dbbcd5b6c2583fa4bb0d8186b299b
```

### Twilio (SMS/MMS)
**SMS Webhook URL:**
```
https://tunnel.checkallie.com/api/sms/inbound
```

## Current Status

✅ **Backend Server**: Running on port 3002
✅ **Ngrok Tunnel**: Active at tunnel.checkallie.com
✅ **Custom Domain**: Configured and working

## Update Your Services

### 1. SendGrid Configuration
1. Go to [SendGrid Inbound Parse](https://app.sendgrid.com/settings/parse)
2. Edit your existing webhook
3. Update the URL to: `https://tunnel.checkallie.com/api/emails/inbound`
4. Save

### 2. Twilio Configuration
1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to Phone Numbers → Active Numbers → +17197486209
3. Update "A message comes in" webhook to: `https://tunnel.checkallie.com/api/sms/inbound`
4. Save

## Test Everything

### Test Email:
Send an email to: `palsson@families.checkallie.com`

### Test SMS:
Send a text to: `+1 (719) 748-6209`

### Test Endpoints:
```bash
# Test server is up
curl https://tunnel.checkallie.com/api/test

# Test SMS endpoint
curl https://tunnel.checkallie.com/api/sms/test

# Test email endpoint
curl https://tunnel.checkallie.com/api/emails/test
```

## Monitor Activity

View real-time webhook activity:
```
http://localhost:4040
```

## Benefits of This Setup

1. **Permanent URLs** - No more updating webhooks when restarting ngrok!
2. **Custom Domain** - Professional `tunnel.checkallie.com` instead of random ngrok URLs
3. **Always Available** - As long as your server is running, webhooks work
4. **Easy Development** - Test webhooks locally without deployment

## Server Management

```bash
# Start everything
cd server
./manage-servers.sh start

# Check status
./manage-servers.sh status

# View logs
./manage-servers.sh logs

# Stop everything
./manage-servers.sh stop
```

## Next Steps

1. Update SendGrid webhook URL ✓
2. Update Twilio webhook URL ✓
3. Send test email to `palsson@families.checkallie.com`
4. Send test SMS to `+1 (719) 748-6209`
5. Check Unified Inbox in the app

Your webhooks are now permanently set up! 🚀