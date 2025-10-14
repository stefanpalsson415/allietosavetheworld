# Email Architecture for Parentload Families

## Goal
Each family member can forward emails to Allie, and those emails get processed and added to the family calendar/tasks.

## Option 1: Single Family Email (Recommended) ⭐
**Pattern**: `familyname@allie.family`

### How it works:
1. One email per family: `smithfamily@allie.family`
2. All family members forward to this single address
3. Allie processes and adds to shared family calendar
4. Can still identify sender from the "From" field

### Pros:
- Simple to manage (1 email per family)
- Encourages family sharing
- Lower complexity
- Easier to remember

### Cons:
- Less personal
- Can't have individual preferences

### Implementation:
```javascript
// Generate family email on signup
const familyEmail = `${familyName.toLowerCase()}@allie.family`;

// When email arrives, check sender
const sender = parseEmailHeaders(email).from;
const familyMember = await findFamilyMemberByEmail(sender);
```

## Option 2: Individual Member Emails
**Pattern**: `firstname.familyname@allie.family`

### Examples:
- `john.smith@allie.family`
- `mary.smith@allie.family`
- `kids.smith@allie.family`

### Pros:
- Personal to each member
- Can have individual preferences
- Privacy within family

### Cons:
- More complex to manage
- More DNS entries needed
- Harder to remember multiple addresses

## Option 3: Plus Addressing (Best Balance) ⭐⭐
**Pattern**: `familyname+membername@allie.family`

### Examples:
- `smith+john@allie.family`
- `smith+mary@allie.family`
- `smith+soccer@allie.family` (for specific activities)

### How it works:
```javascript
// Parse the email address
const [familyPart, domain] = email.split('@');
const [familyName, memberTag] = familyPart.split('+');

// Route to family calendar with member context
const family = await findFamilyByName(familyName);
const context = memberTag || 'general';
```

### Pros:
- One DNS entry per family
- Unlimited sub-addresses
- Can categorize by person OR activity
- Works with Gmail-style plus addressing

### Cons:
- Some email providers don't support plus addressing
- Slightly longer addresses

## Option 4: Catch-All with Smart Routing ⭐⭐⭐
**Pattern**: `anything@familyname.allie.family`

### Examples:
- `john@smith.allie.family`
- `soccer@smith.allie.family`
- `school@smith.allie.family`

### Implementation:
1. Create subdomain per family: `smith.allie.family`
2. Set up catch-all forwarding to your server
3. Parse and route based on the prefix

### Pros:
- Maximum flexibility
- Natural feeling addresses
- Can create unlimited variations
- Easy to remember pattern

### Cons:
- Requires subdomain per family
- More complex DNS setup
- May hit DNS limits with many families

## Recommended Implementation

### Phase 1: Start Simple
Use **Option 1** (Single Family Email):
```javascript
// When family signs up
async function createFamilyEmail(familyId, familyName) {
  const email = `${familyName.toLowerCase().replace(/\s+/g, '')}@allie.family`;
  
  // Store in database
  await db.collection('families').doc(familyId).update({
    familyEmail: email,
    emailCreated: new Date()
  });
  
  // No DNS changes needed - use catch-all
  return email;
}
```

### Phase 2: Add Plus Addressing
Enhance with **Option 3** for power users:
```javascript
// Process incoming email
async function processInboundEmail(toAddress, fromAddress, content) {
  const [localPart, domain] = toAddress.split('@');
  const [familyName, tag] = localPart.split('+');
  
  const family = await findFamilyByEmailPrefix(familyName);
  
  // Use tag for context
  const context = {
    family: family.id,
    sender: fromAddress,
    category: tag || 'general',
    originalTo: toAddress
  };
  
  // Process with Allie
  await processWithAllie(content, context);
}
```

## DNS Setup for Catch-All

### For allie.family domain:
```
MX Records:
- Priority: 10, Value: mx.sendgrid.net

TXT Record (SPF):
- v=spf1 include:sendgrid.net ~all

CNAME Records (for authentication):
- As provided by SendGrid domain authentication
```

### SendGrid Inbound Parse Config:
1. **Host**: (blank) or *
2. **Domain**: allie.family
3. **URL**: https://your-server.com/api/emails/inbound
4. **Spam Check**: Yes
5. **Raw Content**: Yes (for attachments)

## Smart Email Processing

```javascript
// Intelligent routing based on content
async function routeEmail(email) {
  const { to, from, subject, body, attachments } = email;
  
  // Identify family
  const family = await identifyFamily(to);
  
  // Identify sender (family member or external)
  const sender = await identifyFamilyMember(from, family.id);
  
  // Categorize content
  const category = await categorizeEmail(subject, body);
  // Returns: 'school', 'sports', 'medical', 'social', 'other'
  
  // Extract events/tasks
  const items = await extractItems(body, attachments);
  
  // Add to family calendar with context
  for (const item of items) {
    await createCalendarEvent({
      ...item,
      familyId: family.id,
      createdBy: sender?.id || 'external',
      source: 'email',
      category: category,
      originalEmail: email.id
    });
  }
  
  // Send confirmation
  await sendConfirmation(from, items);
}
```

## Best Practice Recommendations

1. **Start with Option 1** (single family email)
2. **Monitor usage** to see if families want individual addresses
3. **Add plus addressing** as a power feature
4. **Consider subdomains** only for enterprise/premium families

## Example Welcome Email

```
Welcome to Parentload!

Your family email is: smithfamily@allie.family

How to use it:
📧 Forward any email with events, schedules, or tasks
📎 Include PDFs, images, or documents
🏷️ Use tags: smithfamily+soccer@allie.family for soccer-related emails
📅 Allie will automatically add events to your family calendar

Try it now! Forward your kid's school schedule and watch the magic happen.
```