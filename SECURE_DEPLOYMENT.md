# 🔒 Secure Deployment Guide for Production Launch

## ✅ Security Fixes Completed

### 1. ✅ API Keys Moved to Environment Variables
- Removed hardcoded API keys from `production-server.js`
- Server now requires environment variables: `INTERNAL_API_KEY` and `SALES_API_KEY`
- Server will exit if keys are not configured

### 2. ✅ CORS Configuration Secured
- Only allows specific production domains
- Blocks all unauthorized origins in production
- Localhost only allowed in development mode

### 3. ✅ Firestore Security Rules Updated
- Removed overly permissive `allow write: if true` rules
- Added authentication checks for all sensitive operations
- Family-based access control implemented
- Webhooks can still create entries (emails, SMS, tasks)

### 4. ✅ Rate Limiting Implemented
- General limit: 100 requests per 15 minutes per IP
- API limit: 10 requests per minute for Claude endpoints
- Prevents abuse and DDoS attacks

### 5. ✅ Input Validation Added
- All API inputs validated with express-validator
- Messages must be arrays
- Model must be a valid string
- Max tokens limited to 4096

### 6. ✅ Security Headers Added
- Helmet.js for comprehensive security headers
- CSP (Content Security Policy) configured
- X-Frame-Options: DENY (prevents clickjacking)
- X-XSS-Protection enabled
- Strict-Transport-Security for HTTPS enforcement

## 🚀 Deployment Steps

### Step 1: Set Environment Variables for Cloud Run

```bash
# Set the API keys in Cloud Run (replace with your actual keys)
gcloud run services update allie-claude-api \
  --set-env-vars INTERNAL_API_KEY="sk-ant-api03-YOUR-INTERNAL-KEY",SALES_API_KEY="sk-ant-api03-YOUR-SALES-KEY",NODE_ENV="production" \
  --region us-central1
```

### Step 2: Deploy Firestore Security Rules

```bash
# Deploy the updated security rules
firebase deploy --only firestore:rules
```

### Step 3: Deploy Backend Server to Cloud Run

```bash
cd server
gcloud run deploy allie-claude-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --quiet
```

### Step 4: Build and Deploy Frontend

```bash
# Build production frontend
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Step 5: Verify Security Configuration

```bash
# Test that API keys are required
curl https://allie-claude-api-363935868004.us-central1.run.app/health

# Test CORS is blocking unauthorized domains
curl -H "Origin: https://evil-site.com" \
  https://allie-claude-api-363935868004.us-central1.run.app/api/claude/test

# Should get CORS error
```

## 🔍 Post-Deployment Security Checklist

- [ ] Verify API keys are NOT visible in source code
- [ ] Test that only authorized domains can access the API
- [ ] Confirm Firestore rules prevent unauthorized access
- [ ] Check rate limiting is working (try rapid requests)
- [ ] Verify security headers in browser DevTools
- [ ] Test authentication flow with a new user
- [ ] Monitor Cloud Run logs for any errors
- [ ] Set up alerting for suspicious activity

## 📊 Monitoring & Alerts

### Set Up Cloud Monitoring
```bash
# Create alert for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=YOUR_CHANNEL_ID \
  --display-name="High Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=0.05
```

### Monitor API Usage
- Check Cloud Run metrics dashboard
- Monitor Firestore usage and costs
- Review Claude API usage in Anthropic console

## 🚨 Emergency Response Plan

If you detect a security breach:

1. **Immediately rotate API keys:**
```bash
# Generate new keys in Anthropic console
# Update Cloud Run with new keys
gcloud run services update allie-claude-api \
  --set-env-vars INTERNAL_API_KEY="NEW_KEY",SALES_API_KEY="NEW_KEY" \
  --region us-central1
```

2. **Review logs:**
```bash
gcloud run services logs read allie-claude-api \
  --region us-central1 \
  --limit 100
```

3. **Temporarily disable service if needed:**
```bash
gcloud run services update allie-claude-api \
  --max-instances 0 \
  --region us-central1
```

## 🛡️ Additional Security Recommendations

### Still TODO (Lower Priority):
1. **Enable Firebase App Check** - Prevents abuse of Firebase services
2. **Add Web Application Firewall (WAF)** - Consider Cloudflare for DDoS protection
3. **Implement Session Management** - Add proper session handling with expiry
4. **Enable Audit Logging** - Track all sensitive operations
5. **Add Secrets Manager** - Use Google Secret Manager instead of env vars
6. **Regular Security Audits** - Schedule quarterly security reviews

## 📝 Notes

- API keys are now required as environment variables
- The server will NOT start without proper API keys configured
- CORS will block all unauthorized domains in production
- Rate limiting prevents API abuse
- All user inputs are validated and sanitized
- Security headers protect against common web vulnerabilities

## Support

For security issues or questions:
- Email: security@checkallie.com
- Use responsible disclosure for vulnerabilities

---
*Security updates completed: 2025-09-12*
*Ready for production launch with enhanced security* 🚀