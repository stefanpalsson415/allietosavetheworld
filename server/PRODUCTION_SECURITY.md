# Production Security for Webhooks

## SendGrid Inbound Parse Security

SendGrid Inbound Parse doesn't use webhook secrets, but you should still secure it in production:

### 1. Use a Secret URL Path
Add a unique token to your webhook URL that acts like a password:

```javascript
// In your .env (production)
INBOUND_EMAIL_TOKEN=your-random-string-here-xyz789abc

// In your server
app.post(`/api/emails/inbound/${process.env.INBOUND_EMAIL_TOKEN}`, upload.any(), async (req, res) => {
  // Process email
});

// Your webhook URL becomes:
// https://your-domain.com/api/emails/inbound/your-random-string-here-xyz789abc
```

### 2. IP Whitelisting (Recommended)
```javascript
// middleware/sendgrid-ip-check.js
const ipRangeCheck = require('ip-range-check');

// SendGrid's IP ranges (check their docs for updates)
const SENDGRID_IPS = [
  '149.72.0.0/16',
  '167.89.0.0/17',
  '167.89.128.0/18',
  '167.89.192.0/19',
  '167.89.224.0/20',
  '167.89.240.0/21',
  '167.89.248.0/22',
  '167.89.252.0/23',
  '167.89.254.0/24',
  '168.245.0.0/17',
  '168.245.128.0/20',
  '168.245.144.0/21',
  '168.245.152.0/22',
  '168.245.156.0/23',
  '168.245.158.0/24',
  '168.245.159.0/25',
  '168.245.159.128/26',
  '168.245.159.192/27',
  '168.245.159.224/28',
  '168.245.159.240/29',
  '168.245.159.248/30',
  '168.245.159.252/31',
  '168.245.159.254/32',
  '192.254.112.0/20',
  '208.117.48.0/20',
  '50.31.32.0/19',
  '69.162.98.0/24'
];

const verifySendGridIP = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  
  if (process.env.NODE_ENV === 'development') {
    // Skip IP check in development
    return next();
  }
  
  const isValid = SENDGRID_IPS.some(range => ipRangeCheck(clientIP, range));
  
  if (!isValid) {
    console.error(`Unauthorized IP attempted webhook access: ${clientIP}`);
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  next();
};

module.exports = verifySendGridIP;
```

### 3. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const inboundEmailLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per minute
  message: 'Too many requests'
});

app.use('/api/emails/inbound', inboundEmailLimiter);
```

### 4. Request Validation
```javascript
const validateInboundEmail = (req, res, next) => {
  // Check required fields from SendGrid
  const required = ['headers', 'to', 'from', 'subject'];
  
  for (const field of required) {
    if (!req.body[field]) {
      console.error(`Missing required field: ${field}`);
      return res.status(400).json({ error: 'Invalid request' });
    }
  }
  
  // Validate your domain
  const envelope = JSON.parse(req.body.envelope || '{}');
  const toEmail = envelope.to?.[0] || '';
  
  if (!toEmail.endsWith('@families.checkallie.com')) {
    console.error(`Invalid recipient domain: ${toEmail}`);
    return res.status(400).json({ error: 'Invalid recipient' });
  }
  
  next();
};
```

## Twilio Webhook Security

Twilio DOES provide webhook signatures!

### 1. Validate Twilio Signatures
```javascript
const twilio = require('twilio');

const validateTwilioWebhook = (req, res, next) => {
  const twilioSignature = req.headers['x-twilio-signature'];
  const url = `https://${req.headers.host}${req.originalUrl}`;
  const params = req.body;
  
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    twilioSignature,
    url,
    params
  );
  
  if (!isValid && process.env.NODE_ENV === 'production') {
    console.error('Invalid Twilio signature');
    return res.status(403).send('Forbidden');
  }
  
  next();
};
```

## Updated Production .env

```env
# Production Environment
NODE_ENV=production
PORT=3001

# Domain
DOMAIN=https://your-app.com

# SendGrid
SENDGRID_API_KEY=SG.your-production-key
SENDGRID_FROM_EMAIL=noreply@checkallie.com
INBOUND_EMAIL_TOKEN=generate-random-string-here

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Database
DATABASE_URL=your-production-db
REDIS_URL=your-redis-instance

# Security
CORS_ORIGIN=https://your-app.com
SESSION_SECRET=your-session-secret
```

## Complete Secure Implementation

```javascript
// server/secure-webhooks.js
const express = require('express');
const router = express.Router();
const verifySendGridIP = require('./middleware/sendgrid-ip-check');
const validateTwilioWebhook = require('./middleware/twilio-webhook-check');
const validateInboundEmail = require('./middleware/validate-inbound-email');
const inboundEmailLimiter = require('./middleware/rate-limiters');

// SendGrid Inbound Parse - Secured
router.post(
  `/emails/inbound/${process.env.INBOUND_EMAIL_TOKEN}`,
  verifySendGridIP,
  inboundEmailLimiter,
  validateInboundEmail,
  upload.any(),
  async (req, res) => {
    // Your existing webhook handler
  }
);

// Twilio SMS Webhook - Secured
router.post(
  '/sms/inbound',
  validateTwilioWebhook,
  async (req, res) => {
    // Your existing webhook handler
  }
);

module.exports = router;
```

## Deployment Checklist

- [ ] Generate random INBOUND_EMAIL_TOKEN
- [ ] Update SendGrid webhook URL with token
- [ ] Enable IP whitelisting for SendGrid
- [ ] Enable Twilio signature validation
- [ ] Set up rate limiting
- [ ] Use HTTPS only
- [ ] Monitor webhook endpoints
- [ ] Set up error alerting
- [ ] Test with webhook simulation tools

## Additional Security Tips

1. **Log Everything**: Keep audit logs of all webhook activity
2. **Monitor Anomalies**: Alert on unusual patterns
3. **Fail Gracefully**: Always return 200 OK to prevent retries
4. **Backup Processing**: Queue messages for reprocessing if needed
5. **Regular Updates**: Keep SendGrid IP list updated