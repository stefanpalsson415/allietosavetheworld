# 🔒 Security Fixes for Production Launch

## CRITICAL - Fix Before Launch

### 1. Remove Hardcoded API Keys
**File**: `/server/production-server.js`

**Current Issue**: API keys exposed in source code
```javascript
// DANGER - Currently hardcoded
const INTERNAL_API_KEY = 'sk-ant-api03-xxx...';
const SALES_API_KEY = 'sk-ant-api03-yyy...';
```

**Fix**:
```javascript
// Use environment variables instead
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const SALES_API_KEY = process.env.SALES_API_KEY;

if (!INTERNAL_API_KEY || !SALES_API_KEY) {
  console.error('API keys not configured');
  process.exit(1);
}
```

**Deploy with secrets**:
```bash
# Set in Cloud Run
gcloud run services update allie-claude-api \
  --set-env-vars INTERNAL_API_KEY=your-key,SALES_API_KEY=your-key \
  --region us-central1
```

### 2. Fix Firestore Security Rules
**File**: `/firestore.rules`

**Current Issue**: Anyone can read/write all data
```javascript
// DANGER - Too permissive
allow read: if true;
allow write: if true;
```

**Fix - Secure rules**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isFamilyMember(familyId) {
      return isAuthenticated() && 
        request.auth.uid in get(/databases/$(database)/documents/families/$(familyId)).data.members;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Families - only members can read/write
    match /families/{familyId} {
      allow read: if isAuthenticated() && isFamilyMember(familyId);
      allow write: if isAuthenticated() && isFamilyMember(familyId);
    }
    
    // Users - only self can write
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Tasks - family members only
    match /kanbanTasks/{taskId} {
      allow read: if isAuthenticated() && 
        isFamilyMember(resource.data.familyId);
      allow write: if isAuthenticated() && 
        isFamilyMember(resource.data.familyId);
    }
    
    // Events - family members only
    match /events/{eventId} {
      allow read: if isAuthenticated() && 
        isFamilyMember(resource.data.familyId);
      allow write: if isAuthenticated() && 
        isFamilyMember(resource.data.familyId);
    }
    
    // Email/SMS inbox - webhook write, family read
    match /emailInbox/{emailId} {
      allow read: if isAuthenticated() && 
        isFamilyMember(resource.data.familyId);
      allow create: if true; // Allow webhook
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    match /smsInbox/{smsId} {
      allow read: if isAuthenticated() && 
        isFamilyMember(resource.data.familyId);
      allow create: if true; // Allow webhook
      allow update: if isAuthenticated();
      allow delete: if isAuthenticated();
    }
    
    // Chat messages - family members only
    match /chatMessages/{messageId} {
      allow read: if isAuthenticated() && 
        isFamilyMember(resource.data.familyId);
      allow write: if isAuthenticated() && 
        isFamilyMember(request.resource.data.familyId);
    }
    
    // OTP codes - public for auth flow
    match /otpCodes/{email} {
      allow read: if true;
      allow write: if true;
      // Add TTL to auto-delete after 10 minutes
    }
  }
}
```

### 3. Fix CORS Configuration
**File**: `/server/production-server.js`

**Current Issue**: Allows all origins
```javascript
// DANGER - Allows all
callback(null, true); // Allow all for now
```

**Fix**:
```javascript
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://parentload-ba995.web.app',
      'https://checkallie.com',
      'https://www.checkallie.com'
    ];
    
    // Block unknown origins in production
    if (process.env.NODE_ENV === 'production') {
      if (!origin || allowedOrigins.indexOf(origin) === -1) {
        callback(new Error('Not allowed by CORS'));
        return;
      }
    }
    
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

### 4. Add Rate Limiting
**Install**:
```bash
npm install express-rate-limit
```

**Implement**:
```javascript
const rateLimit = require('express-rate-limit');

// General rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

// Strict limit for API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per minute
  message: 'API rate limit exceeded'
});

app.use('/api/', apiLimiter);
app.use(limiter);
```

### 5. Add Input Validation
**Install**:
```bash
npm install express-validator helmet
```

**Implement**:
```javascript
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// Input validation example
app.post('/api/claude',
  body('messages').isArray().withMessage('Messages must be an array'),
  body('model').isString().trim().escape(),
  body('max_tokens').isInt({ min: 1, max: 4096 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process request
  }
);
```

### 6. Secure Sensitive Data
**Remove console.logs in production**:
```javascript
// Create secure logger
const logger = {
  log: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  error: (...args) => {
    // Log errors but sanitize sensitive data
    const sanitized = args.map(arg => {
      if (typeof arg === 'object') {
        // Remove sensitive fields
        const { password, apiKey, token, ...safe } = arg;
        return safe;
      }
      return arg;
    });
    console.error(...sanitized);
  }
};
```

## Additional Security Measures

### 7. Enable Firebase App Check
```javascript
// In your Firebase config
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
  isTokenAutoRefreshEnabled: true
});
```

### 8. Add Security Headers
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### 9. Implement Session Management
```javascript
const session = require('express-session');
const FirestoreStore = require('firestore-store')(session);

app.use(session({
  store: new FirestoreStore({
    database: firestore
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // HTTPS only
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));
```

### 10. Add Monitoring
- Enable Cloud Logging
- Set up alerts for suspicious activity
- Monitor API usage and errors
- Enable Firebase Performance Monitoring

## Testing Security

### Run Security Audit
```bash
npm audit
npm audit fix
```

### Test OWASP Top 10
1. Injection attacks
2. Broken authentication
3. Sensitive data exposure
4. XML external entities
5. Broken access control
6. Security misconfiguration
7. Cross-site scripting (XSS)
8. Insecure deserialization
9. Using components with known vulnerabilities
10. Insufficient logging & monitoring

## Deployment Checklist

- [ ] Remove all hardcoded API keys
- [ ] Update Firestore security rules
- [ ] Configure CORS properly
- [ ] Add rate limiting
- [ ] Implement input validation
- [ ] Add security headers
- [ ] Enable HTTPS only
- [ ] Remove debug console.logs
- [ ] Enable Firebase App Check
- [ ] Set up monitoring and alerts
- [ ] Test all security measures
- [ ] Document security procedures

## Emergency Response Plan

If a security breach occurs:
1. Rotate all API keys immediately
2. Review audit logs
3. Disable affected features
4. Notify users if data was compromised
5. Document the incident
6. Implement fixes
7. Conduct post-mortem

## Support

For security questions or to report vulnerabilities:
- Email: security@checkallie.com
- Use responsible disclosure