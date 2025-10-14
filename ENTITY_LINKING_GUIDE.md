# Entity Linking System - Integration Guide

## Overview
The Entity Linking System allows calendar events to be connected with documents, contacts, and tasks, creating a comprehensive knowledge graph of family activities.

## Architecture

### EventDrawer UI
- **Location**: `/src/components/calendar/EventDrawer.jsx`
- **Features**:
  - Google Places autocomplete for locations
  - Google Calendar-style date/time picker
  - Attached Items section showing linked documents, contacts, and tasks
  - Auto-save with 3-second debounce

### EventEntityService
- **Location**: `/src/services/EventEntityService.js`
- **Methods**:
  - `linkDocument(eventId, documentId, documentData, familyId)` - Link document to event
  - `linkContact(eventId, contactId, contactData, familyId)` - Link contact to event
  - `linkTask(eventId, taskId, taskData, familyId)` - Link task to event
  - `autoLinkFromEmailProcessing(eventId, emailData, createdEntities, familyId)` - Auto-link during AI processing
  - `getLinkedEntities(eventId)` - Retrieve all linked entities
  - `findRelatedEvents(entityId, entityType, familyId)` - Find events related to an entity

### Knowledge Graph Integration
All entity links are automatically stored in the Quantum Knowledge Graph with:
- **Relationship types**: `hasAttachment`, `involves`, `requires`
- **Strength**: 1.0 (full connection)
- **Metadata**: Linked by (user/ai), timestamp

## Data Schema

### Events Collection
```javascript
{
  id: "eventId",
  title: "Doctor Appointment for Lillian",
  location: "Children's Medical Center",
  locationDetails: {
    placeId: "ChIJ...",
    name: "Children's Medical Center",
    address: "123 Main St, Dallas, TX",
    coordinates: { lat: 32.xxx, lng: -96.xxx }
  },
  startTime: Timestamp,
  endTime: Timestamp,
  linkedDocuments: [
    {
      id: "docId",
      name: "Insurance Form.pdf",
      type: "document",
      linkedAt: "2025-10-05T..."
    }
  ],
  linkedContacts: [
    {
      id: "contactId",
      name: "Dr. Smith",
      type: "doctor",
      linkedAt: "2025-10-05T..."
    }
  ],
  linkedTasks: [
    {
      id: "taskId",
      title: "Bring insurance card",
      status: "upcoming",
      linkedAt: "2025-10-05T..."
    }
  ]
}
```

## Usage Examples

### 1. Auto-Link During AI Email Processing

When AI processes an email and creates an event, it should automatically link related entities:

```javascript
// In FixedUniversalAIProcessor.js or similar
import EventEntityService from './EventEntityService';

// After event is created by Allie
const eventId = createdEvent.id;
const emailData = {
  id: item.id,
  subject: item.subject,
  from: item.from
};

const createdEntities = {
  contacts: [
    { id: 'contact123', name: 'Dr. Smith', type: 'doctor' }
  ],
  tasks: [
    { id: 'task456', title: 'Bring insurance card' }
  ]
};

// Auto-link everything
const result = await EventEntityService.autoLinkFromEmailProcessing(
  eventId,
  emailData,
  createdEntities,
  familyId
);

console.log(`✅ Linked ${result.linkedCount} entities:`, result.linkedTypes);
```

### 2. Manual Linking from UI

Users can link entities manually from the Unified Inbox or Task Board:

```javascript
// In UnifiedInbox.jsx - Add "Link to Event" button
const handleLinkToEvent = async (item, eventId) => {
  const result = await EventEntityService.linkDocument(
    eventId,
    item.id,
    {
      name: item.subject || item.fileName,
      type: item.source // 'email', 'upload', etc.
    },
    familyId
  );

  if (result.success) {
    console.log('✅ Linked successfully');
  }
};
```

### 3. Finding Related Events

When viewing a document or contact, find all related events:

```javascript
const result = await EventEntityService.findRelatedEvents(
  documentId,
  'document',
  familyId
);

console.log(`Found ${result.count} related events:`, result.eventIds);
```

## Knowledge Graph Queries

The system automatically creates bidirectional relationships:

```javascript
// Find all documents attached to an event
const relationships = await QuantumKnowledgeGraph.getRelationships(familyId, {
  nodeId: eventId,
  nodeType: 'event'
});

// Find all events for a specific doctor
const doctorEvents = await EventEntityService.findRelatedEvents(
  doctorId,
  'person',
  familyId
);
```

## AI Processor Integration Points

### When Processing Email/Document:
1. **Extract entities** (contacts, tasks, events)
2. **Create entities** in Firestore
3. **If event created**, call `autoLinkFromEmailProcessing()`
4. **Result**: Event automatically connected to source document, contacts, and tasks

### Example Flow:
```
Email: "Lillian has a doctor appointment with Dr. Smith on Oct 10 at 3pm. Bring insurance card."

AI Processing:
1. Creates event: "Doctor Appointment for Lillian"
2. Creates contact: "Dr. Smith" (type: doctor)
3. Creates task: "Bring insurance card"
4. Auto-links all three to the event
5. Updates Knowledge Graph with relationships
```

## Benefits

1. **Complete Context**: Events show all related information in one place
2. **Smart Suggestions**: AI can suggest related items based on graph connections
3. **Easy Navigation**: Click linked items to jump between related entities
4. **Knowledge Graph**: Builds family activity patterns over time
5. **Search**: Find events by any linked entity (document, contact, task)

## Future Enhancements

- [ ] Bi-directional linking UI (from task/doc, link to event)
- [ ] Smart suggestions when creating events
- [ ] Batch linking operations
- [ ] Visual relationship graph viewer
- [ ] Automatic duplicate detection using graph patterns
