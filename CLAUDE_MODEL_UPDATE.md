# Claude Model Update - Claude Sonnet 4

## Model Updated
The application has been updated to use the latest Claude model: `claude-sonnet-4-20250514`

## Files Updated
1. **src/services/ClaudeService.js** - Main Claude service used throughout the app
   - Changed from `claude-3-5-sonnet-20241022` to `claude-sonnet-4-20250514`

2. **server/inbound-email-webhook-simple.js** - Email processing webhook
   - Updated model for processing incoming emails

3. **server/server-simple.js** - API key test endpoint
   - Updated model for connection testing

## How to Apply Changes

### Frontend (React App)
The React app will automatically use the new model on the next API call since ClaudeService.js has been updated.

### Backend (Proxy Server)
You need to restart the proxy server for the changes to take effect:

```bash
# Stop the current proxy server (Ctrl+C in the terminal running it)
# Then restart it:
cd /Users/stefanpalsson/parentload\ copy/parentload-clean
npm run proxy
```

## Benefits of Claude Sonnet 4
- Latest model with improved capabilities
- Better understanding and reasoning
- Enhanced vision capabilities for image processing
- Improved response quality and accuracy

## Testing
After restarting the proxy, test the new model by:
1. Sending a test email to your family email address
2. Using the chat feature in the app
3. Creating a calendar event through Allie

All AI features in the app will now use the Claude Sonnet 4 model!