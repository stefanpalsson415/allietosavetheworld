# Email Setup for checkallie.com

## You have several options with your existing domain:

### Option 1: Subdomain (Recommended) ✅
**Pattern**: `familyname@families.checkallie.com`

Examples:
- `smith@families.checkallie.com`
- `johnson@families.checkallie.com`

**Pros**:
- Keeps your main domain email (stefan@checkallie.com) separate
- Clear purpose: "families" subdomain
- Professional appearance
- Easy to set up

### Option 2: Plus Addressing on Main Domain
**Pattern**: `families+familyname@checkallie.com`

Examples:
- `families+smith@checkallie.com`
- `families+johnson@checkallie.com`

**Pros**:
- No DNS changes needed
- Works immediately
- Good for testing

**Cons**:
- Longer email addresses
- Some email clients don't support plus addressing

### Option 3: Prefix Pattern
**Pattern**: `familyname-family@checkallie.com`

Examples:
- `smith-family@checkallie.com`
- `johnson-family@checkallie.com`

**Pros**:
- Works on main domain
- Clear what it's for

## Recommended Setup: families.checkallie.com

Here's how to set it up:

### 1. DNS Configuration (in your DNS provider)

Add these records for the subdomain:

```
# MX Record for families.checkallie.com
Type: MX
Name: families
Priority: 10
Value: mx.sendgrid.net

# CNAME for SendGrid domain authentication (they'll give you these)
Type: CNAME
Name: em1234.families
Value: u1234567.wl123.sendgrid.net

# SPF Record (if needed)
Type: TXT
Name: families
Value: "v=spf1 include:sendgrid.net ~all"
```

### 2. SendGrid Inbound Parse Setup

1. Go to **SendGrid Dashboard > Settings > Inbound Parse**
2. Click **"Add Host & URL"**
3. Configure:
   - **Subdomain**: `families`
   - **Domain**: `checkallie.com` (select from dropdown after domain verification)
   - **Destination URL**: `https://your-server.com/api/emails/inbound`
   - ✅ Check **"POST the raw, full MIME message"**
   - ✅ Check **"Check incoming emails for spam"**

### 3. Update Your Code

```javascript
// Update the email generation
function generateFamilyEmail(familyName, familyId) {
  const cleanName = familyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  
  const shortId = familyId.substring(0, 6);
  
  // Using families.checkallie.com
  return `${cleanName}@families.checkallie.com`;
  
  // Or with ID for uniqueness
  return `${cleanName}-${shortId}@families.checkallie.com`;
}
```

## Testing Before Going Live

### 1. Start with Plus Addressing (Immediate Testing)
```javascript
// For testing - works right now!
const testEmail = 'stefan+testfamily@checkallie.com';
```

### 2. Use ngrok for local webhook testing
```bash
# Install ngrok
brew install ngrok

# Start your server
cd server && npm start

# Expose your local server
ngrok http 3001

# Use the ngrok URL in SendGrid
# Example: https://abc123.ngrok.io/api/emails/inbound
```

### 3. Send a test email
```bash
# From any email client, send to:
stefan+testfamily@checkallie.com

# Subject: Test
# Body: Add soccer practice every Tuesday at 4pm
```

## Implementation Timeline

### Phase 1: Development (Now)
- Use plus addressing: `families+familyname@checkallie.com`
- No DNS changes needed
- Test the full flow

### Phase 2: Staging 
- Set up `families.checkallie.com` subdomain
- Configure SendGrid Inbound Parse
- Test with real family emails

### Phase 3: Production
- Enable for all users
- Generate emails like: `smith@families.checkallie.com`
- Add to onboarding flow

## Cost Considerations

- **SendGrid Inbound Parse**: Free (included with your plan)
- **DNS**: No extra cost (using existing domain)
- **No email hosting needed**: You're not creating mailboxes

## Family Instructions

```
Your Family Email: smith@families.checkallie.com

How to use it:
1. Save this email to your contacts as "Allie Family"
2. Forward any emails with events, schedules, or tasks
3. Include attachments like PDFs or images
4. Allie will automatically process and add to your calendar

Try it: Forward your child's school schedule now!
```