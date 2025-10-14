# Update Claude API Keys on Cloud Run

## Overview
We need to configure two separate Claude API keys on the backend server:
1. **ANTHROPIC_API_KEY** - For the sales/marketing chat (public endpoint)
2. **REACT_APP_CLAUDE_API_KEY** - For internal app features (authenticated users)

## Current Backend Configuration

The backend server (`server/index.js`) uses these keys as follows:
- `/api/sales/claude` endpoint uses `ANTHROPIC_API_KEY`
- `/api/claude` endpoint uses `REACT_APP_CLAUDE_API_KEY`

## Manual Update Instructions

### Option 1: Using Google Cloud Console (Web Interface)

1. **Go to Cloud Run Service**
   - Navigate to: https://console.cloud.google.com/run/detail/us-central1/parentload-backend/revisions?project=parentload-ba995
   
2. **Edit and Deploy New Revision**
   - Click "EDIT & DEPLOY NEW REVISION" button at the top
   
3. **Update Environment Variables**
   - Scroll down to "Environment variables" section
   - Keep existing `ANTHROPIC_API_KEY` (for sales endpoint)
   - Add new variable:
     - Name: `REACT_APP_CLAUDE_API_KEY`
     - Value: [Your internal Claude API key]
   - Keep `NODE_ENV` set to `production`
   
4. **Deploy**
   - Click "DEPLOY" at the bottom
   - Wait for deployment to complete

### Option 2: Using gcloud CLI (After Authentication)

```bash
# First authenticate
gcloud auth login

# Set project
gcloud config set project parentload-ba995

# Update environment variables (replace with actual API keys)
gcloud run services update parentload-backend \
  --region=us-central1 \
  --update-env-vars "ANTHROPIC_API_KEY=[SALES_API_KEY]" \
  --update-env-vars "REACT_APP_CLAUDE_API_KEY=[INTERNAL_API_KEY]" \
  --update-env-vars "NODE_ENV=production"
```

## Testing After Update

### Test Sales Endpoint
```bash
curl -X POST https://parentload-backend-363935868004.us-central1.run.app/api/sales/claude \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"claude-3-5-sonnet-20241022","max_tokens":10}'
```

### Test Internal Endpoint
```bash
curl -X POST https://parentload-backend-363935868004.us-central1.run.app/api/claude \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}],"model":"claude-3-5-sonnet-20241022","max_tokens":10}'
```

## Expected Behavior After Update

1. **Sales Chat** (https://checkallie.com)
   - Should continue working with `ANTHROPIC_API_KEY`
   - No changes to existing functionality
   
2. **Internal Features** (logged-in users)
   - Document Hub AI processing should work
   - Allie Chat should work for authenticated users
   - No more "CONFIGURATION ERROR" messages

## Important Notes

- Both API keys should be different for security and usage tracking
- The sales API key is for public-facing features
- The internal API key is for authenticated user features
- Make sure to use Claude API keys that have sufficient quota

## Verification

After updating, verify both endpoints work:
1. Test the sales chat on https://checkallie.com
2. Test the Document Hub by adding a test email (use debug button)
3. Verify no "CONFIGURATION ERROR" appears in the UI