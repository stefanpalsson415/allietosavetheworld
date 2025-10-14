# Contact Form Fix Summary

## Issue
When clicking "Add Contact" button in the Family Contacts section, it was sending a chat message "I'd like to add a new contact" instead of directly showing the contact creation form.

## Root Cause
The FamilyDocumentHub was using `openDrawerWithPrompt()` which sends a text message to Allie, rather than dispatching the proper event to show the contact form.

## Fix Applied
Changed the "Add Contact" button in FamilyDocumentHub to dispatch a 'open-chat-event' with type 'add-contact', matching the behavior of the UnifiedInbox:

```javascript
// Old approach (sends chat message):
openDrawerWithPrompt("I'd like to add a new contact", {
  intent: 'contact_creation',
  showForm: true
});

// New approach (shows form directly):
const event = new CustomEvent('open-chat-event', {
  detail: { 
    type: 'add-contact',
    data: {} // Empty initial data for new contact
  }
});
window.dispatchEvent(event);
```

## How It Works Now
1. User clicks "Add Contact" button
2. Custom event is dispatched with type 'add-contact'
3. AllieChat's event handler receives the event
4. Contact creation form is shown directly (no chat conversation)
5. User fills out the form and saves

This matches the behavior of event creation and task creation, providing a consistent user experience.