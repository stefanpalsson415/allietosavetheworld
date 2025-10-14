# Email Testing Guide

## Current Status
The email system is now set up to:
1. Receive emails at `palsson@families.checkallie.com`
2. Parse email content with Claude AI
3. Create suggested actions (calendar events & tasks)
4. Allow users to review and execute actions

## Testing Steps

### 1. Start the Services
```bash
cd "/Users/stefanpalsson/parentload copy/parentload-clean"
./start-simple.sh
```

### 2. Send a Test Email from Browser Console
Open the browser console at http://localhost:3000 and run:

```javascript
// Load the test script
const script = document.createElement('script');
script.src = '/test-email-content.js';
document.head.appendChild(script);

// Or run directly:
(async function() {
  console.log('📧 Testing email content capture...');
  
  try {
    const testEmail = {
      to: 'palsson@families.checkallie.com',
      from: 'stefan@example.com',
      subject: 'Birthday Party Invitation - Tegner',
      text: 'Hi! You are invited to Tegner\'s birthday party on June 17th at 3pm at Jump Yard. Please RSVP by June 10th. Activities include trampolining, games, and pizza!',
      envelope: JSON.stringify({
        to: ['palsson@families.checkallie.com'],
        from: 'stefan@example.com'
      })
    };
    
    console.log('Sending test email...');
    
    const response = await fetch('http://localhost:3002/api/emails/inbound', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testEmail)
    });
    
    console.log('Response:', response.status);
    
    if (response.ok) {
      console.log('✅ Email sent! Wait a few seconds then refresh the inbox.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
```

### 3. Check the Email in the Inbox
1. Go to the Dashboard
2. Click on the "Allie Drive" tab (inbox icon)
3. Look for your test email
4. Click on it to see the AI analysis and suggested actions

### 4. Test the Suggested Actions
When you click on an email with suggested actions, you should see:
- A "What Allie Can Do" section
- An "Apply All" button to execute all actions
- Individual "Do It" buttons for each action

### 5. Troubleshooting

#### Email Not Showing Up
1. Check the backend logs: `tail -f /tmp/backend.log`
2. Make sure the family email prefix is set correctly
3. Try clicking the Refresh button in the inbox

#### Email Shows "No content"
This has been fixed. The webhook now properly extracts content from the `text` and `html` fields.

#### Actions Not Working
1. Make sure you're logged in (check for currentUser)
2. Check browser console for errors
3. Verify the family members are loaded

#### Server Issues
If servers aren't running properly:
```bash
# Kill all processes
pkill -f "node.*server-simple.js"
pkill -f "node.*simple-proxy.js"
lsof -ti:3000 | xargs kill -9

# Restart
./start-simple.sh
```

## Real Email Testing

To test with real emails from SendGrid:
1. Send an email to `palsson@families.checkallie.com`
2. The ngrok tunnel must be running for SendGrid to reach your webhook
3. Check the webhook URL is configured in SendGrid settings

## What's Working Now

✅ Email content is properly captured
✅ Claude AI analyzes emails and extracts events/tasks
✅ Suggested actions are displayed in the UI
✅ Users can review and apply actions individually or all at once
✅ Calendar events and kanban tasks are created with proper data
✅ The refresh button works without getting stuck
✅ Server status indicator shows service health

## Next Steps

- Test with more complex emails (multiple events, attachments)
- Add email reply functionality
- Implement email categorization and filtering
- Add notification when new emails arrive