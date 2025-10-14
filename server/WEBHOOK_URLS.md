# Webhook URLs Configuration

## Production Webhook URLs (Fixed Domain)

### SendGrid Inbound Parse
- **Development URL**: `https://tunnel.checkallie.com/api/inbound/email`
- **Production URL (with token)**: `https://tunnel.checkallie.com/api/inbound/email/956efd786d1627b507c8fa65953b4110a51dbbcd5b6c2583fa4bb0d8186b299b`
- **Configure at**: https://app.sendgrid.com/settings/parse

### Twilio SMS Webhook
- **URL**: `https://tunnel.checkallie.com/api/inbound/sms`
- **Configure at**: https://console.twilio.com/console/phone-numbers/incoming

### Twilio MMS Webhook (for images)
- **URL**: `https://tunnel.checkallie.com/api/inbound/mms`
- **Configure at**: Same as SMS webhook in Twilio console

## ngrok Setup with Custom Domain

1. Install ngrok: https://ngrok.com/download
2. Make sure you're logged into ngrok: `ngrok config add-authtoken YOUR_TOKEN`
3. The custom domain is already configured: `tunnel.checkallie.com`
4. Start with: `./manage-servers.sh start`

## Server Management

Use the `manage-servers.sh` script for easy management:

```bash
# Start backend server and ngrok tunnel
./manage-servers.sh start

# Stop all services
./manage-servers.sh stop

# Restart services
./manage-servers.sh restart

# Check status and URLs
./manage-servers.sh status

# Test webhook endpoints
./manage-servers.sh test
```

## Quick Start

1. **Start the services:**
   ```bash
   cd server
   ./manage-servers.sh start
   ```

2. **Update SendGrid webhook URL:**
   - Go to: https://app.sendgrid.com/settings/parse
   - Set URL to: `https://tunnel.checkallie.com/api/inbound/email`
   - Or for production security: `https://tunnel.checkallie.com/api/inbound/email/956efd786d1627b507c8fa65953b4110a51dbbcd5b6c2583fa4bb0d8186b299b`

3. **Update Twilio webhook URL:**
   - Go to: https://console.twilio.com/console/phone-numbers/incoming
   - Click on your phone number
   - Set "A message comes in" webhook to: `https://tunnel.checkallie.com/api/inbound/sms`
   - HTTP method: POST

## Security Notes

- The domain `tunnel.checkallie.com` is permanent and won't change
- Always use HTTPS URLs for webhooks
- The token in the URL provides additional security for production
- Both routes work simultaneously (with and without token)

## Your Configuration

```
INBOUND_EMAIL_TOKEN=956efd786d1627b507c8fa65953b4110a51dbbcd5b6c2583fa4bb0d8186b299b
NGROK_DOMAIN=tunnel.checkallie.com
SERVER_PORT=3002
```

## Testing

After starting the server:

1. **Test local server:**
   ```bash
   curl http://localhost:3002/api/test
   ```

2. **Test ngrok tunnel:**
   ```bash
   curl https://tunnel.checkallie.com/api/test
   ```

3. **Test webhook endpoints:**
   ```bash
   ./manage-servers.sh test
   ```

## To Rotate Security Token (if needed)

1. Generate new token:
   ```bash
   openssl rand -hex 32
   ```

2. Update .env file:
   ```
   INBOUND_EMAIL_TOKEN=new-token-here
   ```

3. Update webhook URL in SendGrid dashboard

4. Restart server:
   ```bash
   ./manage-servers.sh restart
   ```