# Current State Documentation - June 22, 2025

## Working Features
- User authentication and family creation
- Allie Chat for natural language interactions
- Basic dashboard with tabs
- Chore and reward system
- Knowledge graph visualization
- Document upload and OCR
- SMS integration (with Twilio)
- Email integration (with SendGrid)

## Known Issues
1. **Calendar System**
   - Multiple event systems (EventStore, CalendarService, MasterCalendarService)
   - Event IDs confusion (id, firestoreId, universalId)
   - CalendarProvider using wrong auth hook property
   - Events not displaying properly

2. **State Management**
   - Multiple competing contexts (EventContext, NewEventContext, UnifiedEventContext)
   - Circuit breaker triggering too often
   - Duplicate event loading attempts

3. **Technical Debt**
   - Too many one-off fix files
   - Multiple versions of similar services
   - Inconsistent error handling
   - Mixed TypeScript/JavaScript files

## Database Collections
- users
- families
- events
- providers
- habits
- choreTemplates
- choreInstances
- rewardTemplates
- rewardInstances
- bucksTransactions
- messages
- documents
- familyDocuments
- tasks

## External Services
- Firebase Auth
- Firestore Database
- Firebase Storage
- Claude API (via proxy)
- SendGrid (email)
- Twilio (SMS)
- Google Maps API (optional)

## Critical Files to Preserve
- /src/services/firebase.js - Core Firebase config
- /src/contexts/AuthContext.js - Authentication
- /src/contexts/FamilyContext.js - Family management
- /src/components/chat/AllieChat.jsx - Main AI interface
- /src/services/ClaudeService.js - AI integration