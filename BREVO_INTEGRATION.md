# Brevo Integration for checkallie.com

This document outlines the implementation of Brevo for transactional emails and SMS in the Allie application.

## Overview

Brevo is integrated to provide reliable delivery of:
- Transactional emails (password reset, welcome emails, notifications)
- SMS messages (appointment reminders, notifications)

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```
# Brevo API Keys
REACT_APP_BREVO_API_KEY=your_brevo_api_key_here

# Template IDs (optional, will use fallback templates if not provided)
REACT_APP_BREVO_PASSWORD_RESET_TEMPLATE_ID=123
REACT_APP_BREVO_WELCOME_TEMPLATE_ID=456
```

### Credentials

- **SMTP Server:** smtp-relay.brevo.com
- **Port:** 587
- **Login:** 8c07f7001@smtp-brevo.com
- **API Key:** jFJN4Z1K5AmvzXE6

## Features Implemented

1. **Transactional Email Sending**
   - Password reset emails
   - Welcome emails
   - Notification emails
   - Fallback templates when Brevo templates aren't available

2. **SMS Messaging**
   - Transactional SMS sending
   - SMS delivery tracking

3. **Webhooks**
   - Email delivery event tracking (delivered, bounced, spam, etc.)
   - SMS delivery event tracking
   - User email/phone validation based on delivery events

4. **Integration Points**
   - Direct integration with Firebase Auth for password reset
   - Custom branded emails via Brevo templates
   - Fallback to existing email endpoints if Brevo is unavailable

## Implementation Files

1. **Services**
   - `src/services/BrevoService.js` - Core service for Brevo API integration
   - `src/utils/EmailUtils.js` - Updated to integrate with Brevo

2. **Server Routes**
   - `server/brevo-webhook.js` - Webhook handlers for Brevo events
   - `server/index.js` - Updated to include Brevo webhook routes

3. **Components**
   - `src/components/settings/PasswordResetComponent.jsx` - UI for password reset
   - `src/components/user/UserSettingsScreen.jsx` - Integration of password reset UI

## Usage Examples

### Sending a Transactional Email

```javascript
import BrevoService from '../services/BrevoService';

// Send an email using a template
await BrevoService.sendEmail({
  to: 'user@example.com',
  templateId: 123,
  params: {
    firstName: 'John',
    confirmationLink: 'https://checkallie.com/confirm?token=abc123'
  }
});

// Send an email with custom HTML
await BrevoService.sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to Allie!',
  html: '<h1>Welcome!</h1><p>Thank you for joining Allie.</p>'
});
```

### Sending an SMS

```javascript
import BrevoService from '../services/BrevoService';

// Send a transactional SMS
await BrevoService.sendSms({
  to: '+15551234567',
  content: 'Your appointment is tomorrow at 3 PM. Reply YES to confirm.'
});
```

## Webhook Configuration

In Brevo's dashboard:

1. Go to SMTP & API > Event Webhooks
2. Create two webhooks:
   - Email events: https://checkallie.com/api/webhooks/brevo/email
   - SMS events: https://checkallie.com/api/webhooks/brevo/sms

Select the following events:
- Email: delivered, hardBounce, softBounce, blocked, spam, opened, clicked
- SMS: delivered, hardBounce, softBounce, blocked, rejected

## Next Steps

1. Create templates in Brevo for common emails (password reset, welcome, etc.)
2. Configure 10-DLC for US SMS sending
3. Set up monitoring for email/SMS delivery rates
4. Implement email template editor in admin dashboard

## Resources

- [Brevo API Documentation](https://developers.brevo.com/docs)
- [Brevo Node.js SDK](https://github.com/sendinblue/APIv3-nodejs-library)
- [SMTP & API Settings in Brevo](https://app.brevo.com/smtp/settings)