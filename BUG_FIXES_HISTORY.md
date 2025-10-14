# Bug Fixes and Update History

This file contains the detailed history of bug fixes and major updates to the Allie/Parentload codebase.

## 2025-09-13 - SMS Verification Production Deployment
- **Fixed SMS Not Actually Sending**: Firebase Functions were only storing codes, not sending SMS
- **Updated Frontend URLs**: Changed to use Firebase Functions directly in production
- **Removed Production Skips**: Eliminated all "skip SMS in production" logic
- **Deployment**: Both Functions and frontend deployed to production
- **Result**: SMS verification fully functional at checkallie.com

## 2025-09-12 - Session 14 - Web Search Fixes
- **Fixed Web Search Not Executing**: Changed from client-side to server-side specification
- **Identity Verification**: Added strict identity checks before saving search results
- **Rate Limit Handling**: Reduced context messages to avoid 429 errors

## 2025-09-11 - Session 13 - Complete GEDCOM Import
- **Full Data Import**: 3,174 individuals with all GEDCOM data preserved
- **Fixed Date Parsing**: Extracted 'parsed' property from date objects
- **Relationship Mapping**: Parent-child, siblings, spouses all mapped
- **UI Enhancements**: Added ProfileConnections, fixed NaN displays
- **Data Structure**: familyTrees collection with full subcollections

## 2025-09-10 - Session 12 - Thread Message Fixes
- **Fixed User Data**: Thread messages now show correct names/avatars
- **Simplified Logic**: Uses FamilyContext instead of complex extraction
- **Fixed Thread Reopening**: "View thread" button now works properly

## 2025-09-09 - Sessions 10 & 11 - Slack-Style Thread Panel
- **Complete Implementation**: Thread panel slides in from right
- **Fixed Reply Button**: ResizableChatDrawer now passes onThreadOpen
- **Smooth Animations**: Main chat shifts left when thread opens
- **Result**: Perfect Slack-style side-by-side layout

## 2025-09-07 - Sessions 8 & 9 - Major Messaging & Event Fixes
### Messaging System
- **Slack-like System**: Complete threaded messaging with @ mentions
- **@ Mention Dropdown**: Fixed detection, keyboard navigation
- **Notifications**: Browser and in-app notifications
- **Dashboard Integration**: Messages in home dashboard action boxes

### Event Fixes
- **Event Year Parsing**: Fixed 2001 year bug (now uses current year)
- **Unified Inbox Events**: Fixed using EventStore.addEvent
- **Message Chunking**: Multi-action responses split into bubbles
- **Attendee Extraction**: Auto-extracts family members from events

## 2025-09-05 - Session 7 - TaskDrawer Integration
- **Document Hub**: Full TaskDrawer replaces simple form
- **Auto-Close Fix**: Drawer stays open until manually closed
- **Component Architecture**: Direct rendering without AIKanbanBoard

## 2025-09-01 - Sessions 1-5 - Document & Contact Management
### Session 5 - Document Processing
- **1MB Limit Fix**: Images to Firebase Storage, not Firestore
- **AI Analysis Display**: Comprehensive analysis in DocumentDetailDrawer
- **Medical Records**: Automatic parsing of vaccines, appointments

### Session 4 - Knowledge Graph
- **Consolidation**: Single QuantumKnowledgeGraph source of truth
- **PDF.js Fix**: Updated to version 5.x compatibility
- **Integration**: Documents properly integrate with Knowledge Graph

### Session 3 - Contact Auto-Assignment
- **Claude API Fix**: System prompts via context parameter
- **Auto-Assignment**: Contacts assign to mentioned family members
- **Smart Matching**: Finds family members by name variations

### Session 2 - Contact System Overhaul
- **Add Contact Button**: Fixed in Document Hub
- **Natural Language**: Create contacts via Allie chat
- **Google Places**: Address autocomplete in ContactModal

### Session 1 - Calendar Fixes
- **Today Button**: Properly scrolls to current date
- **Form Persistence**: Stays open after update
- **Event Data**: Fixed description/location saving
- **Family Avatars**: Added to event guest selection

## 2025-08-31 - Critical Production Fixes
- **Claude API 401 Fix**: New Cloud Run service with hardcoded keys
- **Model Configuration**: Opus 4.1 for internal, Sonnet 3.5 for sales
- **Google Maps Migration**: Complete switch from Mapbox
- **Place Management**: Full CRUD with tags and associations

## Earlier Sessions - Foundation Work
- **Email System**: SendGrid integration with translation support
- **SMS Integration**: Twilio setup with phone verification
- **Calendar Sync**: Two-way Google Calendar synchronization
- **Firebase Rules**: Comprehensive permission system
- **Dashboard**: Notion-style interface with tabs
- **Onboarding**: Complete flow with OTP verification

## Common Quick Fixes

### Permission Errors
```javascript
// In firestore.rules
match /collectionName/{docId} {
  allow read: if true;
  allow write: if true;  // Or if request.auth != null
}
// Deploy: firebase deploy --only firestore:rules
```

### Force UI Refresh
```javascript
window.dispatchEvent(new CustomEvent('force-refresh'));
```

### Auth Context Recovery
```javascript
const familyId = this.authContext?.familyId ||
  localStorage.getItem('selectedFamilyId') ||
  localStorage.getItem('currentFamilyId');
```

For more recent fixes and updates, check git history:
```bash
git log --oneline -n 50
```