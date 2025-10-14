# View Buttons Fix Complete

## Summary of Changes

### Problem
The blue "View" buttons in the UnifiedInbox were not opening the Allie chat drawer properly. When clicked, they were dispatching events but the drawer wasn't responding.

### Root Cause
1. **Event Name Mismatch**: UnifiedInbox was dispatching `open-allie-chat` events, but AllieChat was listening for `open-chat-event` events.
2. **Missing ChatDrawerContext Integration**: The event handler in AllieChat needed to call `openDrawer()` from the ChatDrawerContext.

### Fixes Applied

#### 1. Updated AllieChat.jsx (lines 807-905)
- Added event listener for `open-chat-event` 
- Integrated ChatDrawerContext with `openDrawer()` call
- Added proper handling for both `view-completed` and `add-contact` event types
- Shows event/contact/task details when View is clicked
- Shows contact creation form when Add contact is clicked

#### 2. Updated UnifiedInbox.jsx 
- Changed all `open-allie-chat` events to `open-chat-event`
- Updated event detail structure to match what AllieChat expects:
  ```javascript
  // For View buttons:
  {
    type: 'view-completed',
    itemType: action.type || 'event',
    itemId: action.id || `action-${idx}`,
    title: action.title,
    data: action.data || action
  }
  
  // For Add contact:
  {
    type: 'add-contact',
    data: action.data || {}
  }
  ```

### How It Works Now

1. **View Button Click**:
   - User clicks View on a completed action
   - UnifiedInbox dispatches `open-chat-event` with item details
   - AllieChat receives event and calls `openDrawer()`
   - Chat drawer opens showing the item details
   - User sees a message like "Here are the details for the event..."
   - Can edit the item if needed

2. **Add Contact Button Click**:
   - User clicks "Do It" on an Add contact action
   - UnifiedInbox dispatches `open-chat-event` with contact data
   - AllieChat receives event and calls `openDrawer()`
   - Chat drawer opens with an intro message
   - Contact creation form appears pre-filled with parsed data
   - User can review and save the contact

### Testing

Two test scripts have been created:
1. `/public/test-view-buttons.js` - Initial diagnostic script
2. `/public/test-view-buttons-fixed.js` - Verification script

To test:
1. Open the app and navigate to the Document Hub
2. Process an email/SMS that creates events or finds contacts
3. Click the blue "View" buttons on completed actions
4. Verify the chat drawer opens with the correct content
5. For contacts, verify the form appears instead of just chat

### No Temporary Fixes Needed

This is a permanent fix in the source code. No browser console scripts or temporary patches are required.