// src/services/EventRelationshipGraph.js
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import EventStore from './EventStore';

/**
 * EventRelationshipGraph service
 * Tracks and manages relationships between events such as:
 * - Parent/child relationships (e.g., project and related tasks)
 * - Sequential relationships (e.g., appointment and follow-up)
 * - Requirement relationships (e.g., event requires shopping trip)
 * - Transportation linkages (e.g., one parent drops off, another picks up)
 */
class EventRelationshipGraph {
  constructor() {
    this.relationshipsCollection = collection(db, "eventRelationships");
    
    // Define relationship types with their properties
    this.relationshipTypes = {
      // Parent/child relationships
      PARENT_CHILD: {
        id: 'parent_child',
        name: 'Parent/Child',
        description: 'A hierarchical relationship where one event is a parent of another',
        directional: true,
        examples: ['Project deadline and related tasks', 'Season and individual games']
      },
      
      // Sequential relationships
      SEQUENTIAL: {
        id: 'sequential',
        name: 'Sequential',
        description: 'One event follows another in a sequence',
        directional: true,
        examples: ['Doctor appointment and follow-up', 'Project planning and execution']
      },
      
      // Requirement relationships
      REQUIRES: {
        id: 'requires',
        name: 'Requires',
        description: 'One event requires another to be completed',
        directional: true,
        examples: ['Party requires shopping trip', 'School play requires costume preparation']
      },
      
      // Transportation linkages
      TRANSPORTATION: {
        id: 'transportation',
        name: 'Transportation',
        description: 'Events connected by transportation needs',
        directional: false,
        examples: ['School and sports practice on same day', 'Multiple children\'s activities in different locations']
      },
      
      // Equipment sharing
      SHARED_EQUIPMENT: {
        id: 'shared_equipment',
        name: 'Shared Equipment',
        description: 'Events that share the same equipment requirements',
        directional: false,
        examples: ['Multiple sports practices requiring the same gear', 'School projects using same supplies']
      },
      
      // Related events
      RELATED: {
        id: 'related',
        name: 'Related',
        description: 'Events that are related but not in a specific hierarchical or sequential way',
        directional: false,
        examples: ['Multiple appointments for same medical issue', 'Related school activities']
      }
    };
  }
  
  /**
   * Creates a new relationship between events
   * @param {string} familyId - The family ID
   * @param {string} sourceEventId - The source event ID
   * @param {string} targetEventId - The target event ID
   * @param {string} relationshipType - The type of relationship
   * @param {Object} metadata - Optional metadata about the relationship
   * @returns {Promise<Object>} Created relationship info
   */
  async createRelationship(familyId, sourceEventId, targetEventId, relationshipType, metadata = {}) {
    try {
      // Validate the relationship type
      if (!this.relationshipTypes[relationshipType]) {
        throw new Error(`Invalid relationship type: ${relationshipType}`);
      }
      
      // Validate that events exist
      const sourceEvent = await EventStore.getEventById(sourceEventId);
      const targetEvent = await EventStore.getEventById(targetEventId);
      
      if (!sourceEvent) {
        throw new Error(`Source event ${sourceEventId} not found`);
      }
      
      if (!targetEvent) {
        throw new Error(`Target event ${targetEventId} not found`);
      }
      
      // Generate relationship ID
      const relationshipId = uuidv4();
      
      // Create relationship document
      const relationship = {
        id: relationshipId,
        familyId,
        sourceEventId,
        targetEventId,
        relationshipType,
        typeName: this.relationshipTypes[relationshipType].name,
        isDirectional: this.relationshipTypes[relationshipType].directional,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        metadata: {
          ...metadata,
          sourceEventTitle: sourceEvent.title,
          targetEventTitle: targetEvent.title,
          sourceEventDate: sourceEvent.startDate || sourceEvent.start,
          targetEventDate: targetEvent.startDate || targetEvent.start
        }
      };
      
      // Save the relationship
      await setDoc(doc(this.relationshipsCollection, relationshipId), relationship);
      
      return {
        success: true,
        relationshipId,
        relationship
      };
    } catch (error) {
      console.error("Error creating relationship:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Updates an existing relationship
   * @param {string} relationshipId - The relationship ID
   * @param {Object} updates - The updates to apply
   * @returns {Promise<Object>} Update result
   */
  async updateRelationship(relationshipId, updates) {
    try {
      // Prepare updates with timestamp
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      // Update the relationship
      await updateDoc(doc(this.relationshipsCollection, relationshipId), updateData);
      
      return { success: true };
    } catch (error) {
      console.error("Error updating relationship:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Deletes a relationship
   * @param {string} relationshipId - The relationship ID
   * @returns {Promise<Object>} Deletion result
   */
  async deleteRelationship(relationshipId) {
    try {
      await deleteDoc(doc(this.relationshipsCollection, relationshipId));
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting relationship:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Gets all relationships for a specific event
   * @param {string} familyId - The family ID
   * @param {string} eventId - The event ID
   * @returns {Promise<Array>} Relationships for the event
   */
  async getRelationshipsForEvent(familyId, eventId) {
    try {
      // Query relationships where this event is either source or target
      const sourceQuery = query(
        this.relationshipsCollection,
        where("familyId", "==", familyId),
        where("sourceEventId", "==", eventId)
      );
      
      const targetQuery = query(
        this.relationshipsCollection,
        where("familyId", "==", familyId),
        where("targetEventId", "==", eventId)
      );
      
      // Get relationships where event is source
      const sourceSnapshot = await getDocs(sourceQuery);
      const sourceRelationships = [];
      sourceSnapshot.forEach(doc => {
        const data = doc.data();
        sourceRelationships.push({
          ...data,
          direction: 'outgoing'
        });
      });
      
      // Get relationships where event is target
      const targetSnapshot = await getDocs(targetQuery);
      const targetRelationships = [];
      targetSnapshot.forEach(doc => {
        const data = doc.data();
        targetRelationships.push({
          ...data,
          direction: 'incoming'
        });
      });
      
      // Combine and return all relationships
      return [...sourceRelationships, ...targetRelationships];
    } catch (error) {
      console.error("Error getting relationships for event:", error);
      return [];
    }
  }
  
  /**
   * Gets all relationships of a specific type for a family
   * @param {string} familyId - The family ID
   * @param {string} relationshipType - The relationship type
   * @returns {Promise<Array>} Relationships of the specified type
   */
  async getRelationshipsByType(familyId, relationshipType) {
    try {
      const relationshipsQuery = query(
        this.relationshipsCollection,
        where("familyId", "==", familyId),
        where("relationshipType", "==", relationshipType)
      );
      
      const snapshot = await getDocs(relationshipsQuery);
      const relationships = [];
      
      snapshot.forEach(doc => {
        relationships.push(doc.data());
      });
      
      return relationships;
    } catch (error) {
      console.error(`Error getting ${relationshipType} relationships:`, error);
      return [];
    }
  }
  
  /**
   * Gets all related events for a specific event
   * @param {string} familyId - The family ID
   * @param {string} eventId - The event ID
   * @returns {Promise<Array>} Related events with relationship info
   */
  async getRelatedEvents(familyId, eventId) {
    try {
      // Get all relationships for this event
      const relationships = await this.getRelationshipsForEvent(familyId, eventId);
      
      // No relationships found
      if (relationships.length === 0) {
        return [];
      }
      
      // Collect event IDs to fetch
      const relatedEventIds = new Set();
      const relationshipMap = new Map();
      
      // Process each relationship
      relationships.forEach(relationship => {
        let relatedEventId;
        
        // Determine the related event based on direction
        if (relationship.sourceEventId === eventId) {
          relatedEventId = relationship.targetEventId;
        } else {
          relatedEventId = relationship.sourceEventId;
        }
        
        // Add to set of IDs to fetch
        relatedEventIds.add(relatedEventId);
        
        // Store relationship info for this event
        relationshipMap.set(relatedEventId, {
          relationshipId: relationship.id,
          relationshipType: relationship.relationshipType,
          typeName: relationship.typeName,
          direction: relationship.direction,
          metadata: relationship.metadata
        });
      });
      
      // Fetch all related events
      const relatedEvents = [];
      
      // Fetch each event
      for (const relatedEventId of relatedEventIds) {
        try {
          const event = await EventStore.getEventById(relatedEventId);
          
          if (event) {
            // Add relationship info to the event
            relatedEvents.push({
              ...event,
              relationship: relationshipMap.get(relatedEventId)
            });
          }
        } catch (error) {
          console.error(`Error fetching event ${relatedEventId}:`, error);
        }
      }
      
      return relatedEvents;
    } catch (error) {
      console.error("Error getting related events:", error);
      return [];
    }
  }
  
  /**
   * Gets events that have a specific relationship with a given event
   * @param {string} familyId - The family ID
   * @param {string} eventId - The event ID
   * @param {string} relationshipType - The relationship type
   * @param {string} direction - The direction ('incoming', 'outgoing', or 'both')
   * @returns {Promise<Array>} Related events of the specified type
   */
  async getRelatedEventsByType(familyId, eventId, relationshipType, direction = 'both') {
    try {
      // Get all relationships for this event
      const relationships = await this.getRelationshipsForEvent(familyId, eventId);
      
      // Filter by relationship type and direction
      const filteredRelationships = relationships.filter(relationship => {
        if (relationship.relationshipType !== relationshipType) {
          return false;
        }
        
        if (direction === 'both') {
          return true;
        }
        
        return relationship.direction === direction;
      });
      
      // No matching relationships
      if (filteredRelationships.length === 0) {
        return [];
      }
      
      // Collect event IDs to fetch
      const relatedEventIds = new Set();
      const relationshipMap = new Map();
      
      // Process each relationship
      filteredRelationships.forEach(relationship => {
        let relatedEventId;
        
        // Determine the related event based on direction
        if (relationship.sourceEventId === eventId) {
          relatedEventId = relationship.targetEventId;
        } else {
          relatedEventId = relationship.sourceEventId;
        }
        
        // Add to set of IDs to fetch
        relatedEventIds.add(relatedEventId);
        
        // Store relationship info for this event
        relationshipMap.set(relatedEventId, {
          relationshipId: relationship.id,
          relationshipType: relationship.relationshipType,
          typeName: relationship.typeName,
          direction: relationship.direction,
          metadata: relationship.metadata
        });
      });
      
      // Fetch each event
      const relatedEvents = [];
      for (const relatedEventId of relatedEventIds) {
        try {
          const event = await EventStore.getEventById(relatedEventId);
          
          if (event) {
            // Add relationship info to the event
            relatedEvents.push({
              ...event,
              relationship: relationshipMap.get(relatedEventId)
            });
          }
        } catch (error) {
          console.error(`Error fetching event ${relatedEventId}:`, error);
        }
      }
      
      return relatedEvents;
    } catch (error) {
      console.error(`Error getting related events by type ${relationshipType}:`, error);
      return [];
    }
  }
  
  /**
   * Suggests potential relationships between events based on various heuristics
   * @param {string} familyId - The family ID
   * @param {Date} startDate - The start date for the time range to analyze (defaults to 30 days ago)
   * @param {Date} endDate - The end date for the time range to analyze (defaults to today)
   * @returns {Promise<Array>} Suggested relationships
   */
  async suggestRelationships(familyId, startDate = null, endDate = null) {
    try {
      // Default to analyzing the last 30 days
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30); // 30 days ago
      }
      
      // If no end date is provided, default to today
      if (!endDate) {
        endDate = new Date(); // Today
      }
      
      // Get all events in the time range - use appropriate method from EventStore
      // Check if getEventsForFamily exists, otherwise use getEventsForDateRange
      const events = EventStore.getEventsForDateRange 
        ? await EventStore.getEventsForDateRange(startDate, endDate, familyId)
        : [];
      
      if (events.length === 0) {
        console.warn("No events found in the specified date range");
      }
      
      // If we have too few events, can't suggest many relationships
      if (events.length < 2) {
        return [];
      }
      
      const suggestedRelationships = [];
      
      // Look for sequential medical appointments (appointment followed by follow-up)
      const medicalEvents = events.filter(event => 
        event.type === 'medical' || 
        event.category === 'medical' || 
        /doctor|dentist|therapy|hospital|clinic|appointment|checkup|follow-up/i.test(event.title)
      );
      
      // Sort by date
      medicalEvents.sort((a, b) => {
        const dateA = new Date(a.startDate || a.start || a.date);
        const dateB = new Date(b.startDate || b.start || b.date);
        return dateA - dateB;
      });
      
      // Look for sequential appointments
      for (let i = 0; i < medicalEvents.length - 1; i++) {
        for (let j = i + 1; j < medicalEvents.length; j++) {
          const event1 = medicalEvents[i];
          const event2 = medicalEvents[j];
          
          // Check if titles suggest follow-up relationship
          const isFollowUp = 
            /follow-?up|check-?up/i.test(event2.title) || 
            (event1.title.includes(event2.title) || event2.title.includes(event1.title));
          
          if (isFollowUp) {
            suggestedRelationships.push({
              sourceEventId: event1.id,
              sourceEventTitle: event1.title,
              targetEventId: event2.id,
              targetEventTitle: event2.title,
              relationshipType: 'SEQUENTIAL',
              typeName: this.relationshipTypes['SEQUENTIAL'].name,
              confidence: 0.8,
              reason: 'Follow-up medical appointment detected'
            });
          }
        }
      }
      
      // Look for transportation relationships (close times, different locations)
      for (let i = 0; i < events.length - 1; i++) {
        for (let j = i + 1; j < events.length; j++) {
          const event1 = events[i];
          const event2 = events[j];
          
          // If events have the same date or consecutive dates
          const date1 = new Date(event1.startDate || event1.start || event1.date);
          const date2 = new Date(event2.startDate || event2.start || event2.date);
          
          // Check if same day or consecutive days
          const daysDiff = Math.abs(
            Math.round((date2 - date1) / (1000 * 60 * 60 * 24))
          );
          
          if (daysDiff <= 1) {
            // Check if different locations
            const location1 = event1.location || '';
            const location2 = event2.location || '';
            
            if (location1 && location2 && location1 !== location2) {
              // Check if times are close (within 3 hours)
              const time1 = date1.getHours() * 60 + date1.getMinutes();
              const time2 = date2.getHours() * 60 + date2.getMinutes();
              const timeDiff = Math.abs(time1 - time2);
              
              if (timeDiff <= 180) { // 3 hours
                suggestedRelationships.push({
                  sourceEventId: event1.id,
                  sourceEventTitle: event1.title,
                  targetEventId: event2.id,
                  targetEventTitle: event2.title,
                  relationshipType: 'TRANSPORTATION',
                  typeName: this.relationshipTypes['TRANSPORTATION'].name,
                  confidence: 0.7,
                  reason: 'Events at different locations close in time'
                });
              }
            }
          }
        }
      }
      
      // Look for parent/child relationships (project deadlines and related events)
      const projectEvents = events.filter(event => 
        /project|deadline|presentation|exam|assignment|paper|report/i.test(event.title)
      );
      
      const otherEvents = events.filter(event => 
        !/project|deadline|presentation|exam|assignment|paper|report/i.test(event.title)
      );
      
      // Check for potential parent/child relationships
      for (const projectEvent of projectEvents) {
        const projectKeywords = projectEvent.title.toLowerCase().split(/\s+/);
        
        for (const otherEvent of otherEvents) {
          // Look for keyword matches suggesting relationship
          const otherTitle = otherEvent.title.toLowerCase();
          let matchCount = 0;
          
          for (const keyword of projectKeywords) {
            if (keyword.length > 3 && otherTitle.includes(keyword)) {
              matchCount++;
            }
          }
          
          // If we have good keyword matches
          if (matchCount >= 2) {
            suggestedRelationships.push({
              sourceEventId: projectEvent.id,
              sourceEventTitle: projectEvent.title,
              targetEventId: otherEvent.id,
              targetEventTitle: otherEvent.title,
              relationshipType: 'PARENT_CHILD',
              typeName: this.relationshipTypes['PARENT_CHILD'].name,
              confidence: 0.6,
              reason: 'Keyword similarity suggests related events'
            });
          }
        }
      }
      
      // Look for shared equipment relationships (sports activities)
      const sportsEvents = events.filter(event => 
        /sports|soccer|football|baseball|basketball|hockey|swim|tennis|golf|practice|game|match|tournament/i.test(event.title)
      );
      
      // Group by sport type
      const sportGroups = {};
      
      for (const event of sportsEvents) {
        const title = event.title.toLowerCase();
        let sportType = 'general';
        
        // Identify sport type
        if (title.includes('soccer')) sportType = 'soccer';
        else if (title.includes('baseball')) sportType = 'baseball';
        else if (title.includes('basketball')) sportType = 'basketball';
        else if (title.includes('football')) sportType = 'football';
        else if (title.includes('hockey')) sportType = 'hockey';
        else if (title.includes('swim')) sportType = 'swimming';
        else if (title.includes('tennis')) sportType = 'tennis';
        else if (title.includes('golf')) sportType = 'golf';
        
        if (!sportGroups[sportType]) {
          sportGroups[sportType] = [];
        }
        
        sportGroups[sportType].push(event);
      }
      
      // Create shared equipment relationships within each sport group
      for (const sportType in sportGroups) {
        const events = sportGroups[sportType];
        
        if (events.length >= 2) {
          // Connect all events in the group (not every pair)
          // Just connect adjacent events in time to avoid too many connections
          events.sort((a, b) => {
            const dateA = new Date(a.startDate || a.start || a.date);
            const dateB = new Date(b.startDate || b.start || b.date);
            return dateA - dateB;
          });
          
          for (let i = 0; i < events.length - 1; i++) {
            suggestedRelationships.push({
              sourceEventId: events[i].id,
              sourceEventTitle: events[i].title,
              targetEventId: events[i+1].id,
              targetEventTitle: events[i+1].title,
              relationshipType: 'SHARED_EQUIPMENT',
              typeName: this.relationshipTypes['SHARED_EQUIPMENT'].name,
              confidence: 0.75,
              reason: `Related ${sportType} activities may share equipment`
            });
          }
        }
      }
      
      return suggestedRelationships;
    } catch (error) {
      console.error("Error suggesting relationships:", error);
      return [];
    }
  }
  
  /**
   * Find transitive relationships (A is related to B, B is related to C, so A might be related to C)
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Transitively related events
   */
  async findTransitiveRelationships(familyId) {
    try {
      // Get all relationships for this family
      const relationshipsQuery = query(
        this.relationshipsCollection,
        where("familyId", "==", familyId)
      );
      
      const snapshot = await getDocs(relationshipsQuery);
      const relationships = [];
      
      snapshot.forEach(doc => {
        relationships.push(doc.data());
      });
      
      // Build a graph of relationships
      const graph = new Map();
      
      // Function to add a node and edge to the graph
      const addEdge = (from, to, relationship) => {
        if (!graph.has(from)) {
          graph.set(from, []);
        }
        
        graph.get(from).push({
          eventId: to,
          relationship
        });
      };
      
      // Add all relationships to the graph
      for (const relationship of relationships) {
        // Add bidirectional edges for non-directional relationships
        if (!relationship.isDirectional) {
          addEdge(relationship.sourceEventId, relationship.targetEventId, relationship);
          addEdge(relationship.targetEventId, relationship.sourceEventId, relationship);
        } else {
          addEdge(relationship.sourceEventId, relationship.targetEventId, relationship);
        }
      }
      
      // Find transitive relationships using depth-limited search
      const transitiveRelationships = [];
      
      // For each node in the graph
      for (const [eventId, edges] of graph.entries()) {
        // Skip nodes with only one connection
        if (edges.length < 2) continue;
        
        // For each pair of connections
        for (let i = 0; i < edges.length; i++) {
          for (let j = i + 1; j < edges.length; j++) {
            const edge1 = edges[i];
            const edge2 = edges[j];
            
            // If the relationship types are compatible for transitivity
            if (this.areRelationshipsTransitive(edge1.relationship, edge2.relationship)) {
              transitiveRelationships.push({
                eventIds: [edge1.eventId, eventId, edge2.eventId],
                reason: `Transitive relationship through ${eventId}`,
                confidence: 0.6,
                relationships: [edge1.relationship, edge2.relationship]
              });
            }
          }
        }
      }
      
      return transitiveRelationships;
    } catch (error) {
      console.error("Error finding transitive relationships:", error);
      return [];
    }
  }
  
  /**
   * Determines if two relationships can form a transitive relationship
   * @param {Object} rel1 - First relationship
   * @param {Object} rel2 - Second relationship
   * @returns {boolean} Whether the relationships can be transitive
   */
  areRelationshipsTransitive(rel1, rel2) {
    // Define which relationship types can be transitive
    const transitivityRules = {
      // Parent/child relationships are transitive
      'PARENT_CHILD': ['PARENT_CHILD'],
      
      // Sequential relationships are transitive
      'SEQUENTIAL': ['SEQUENTIAL'],
      
      // Requirements relationships are transitive
      'REQUIRES': ['REQUIRES'],
      
      // Transportation relationships might be transitive
      'TRANSPORTATION': ['TRANSPORTATION'],
      
      // Shared equipment relationships are transitive
      'SHARED_EQUIPMENT': ['SHARED_EQUIPMENT'],
      
      // Related relationships aren't strongly transitive
      'RELATED': []
    };
    
    // Check if the second relationship type is in the transitivity list for the first
    return transitivityRules[rel1.relationshipType]?.includes(rel2.relationshipType) || false;
  }
  
  /**
   * Export all relationships for a family as a graph visualization format
   * @param {string} familyId - The family ID
   * @returns {Promise<Object>} Graph data for visualization
   */
  async exportRelationshipGraph(familyId) {
    try {
      // Get all relationships for this family
      const relationshipsQuery = query(
        this.relationshipsCollection,
        where("familyId", "==", familyId)
      );
      
      const snapshot = await getDocs(relationshipsQuery);
      const relationships = [];
      
      snapshot.forEach(doc => {
        relationships.push(doc.data());
      });
      
      // Collect all unique event IDs
      const eventIds = new Set();
      
      for (const relationship of relationships) {
        eventIds.add(relationship.sourceEventId);
        eventIds.add(relationship.targetEventId);
      }
      
      // Fetch all events
      const events = [];
      
      for (const eventId of eventIds) {
        try {
          // Fix: Call EventStore.getEventById with the correct parameters
          const event = await EventStore.getEventById(eventId);
          
          if (event) {
            events.push(event);
          } else {
            console.log(`Event not found: ${eventId}`);
          }
        } catch (error) {
          console.error(`Error fetching event ${eventId}:`, error);
        }
      }
      
      // Create nodes and edges for the graph
      const nodes = events.map(event => ({
        id: event.id,
        label: event.title,
        type: event.type || 'event',
        date: event.startDate || event.start || event.date
      }));
      
      const edges = relationships.map(relationship => ({
        id: relationship.id,
        source: relationship.sourceEventId,
        target: relationship.targetEventId,
        label: relationship.typeName,
        type: relationship.relationshipType,
        directional: relationship.isDirectional
      }));
      
      return {
        nodes,
        edges
      };
    } catch (error) {
      console.error("Error exporting relationship graph:", error);
      return { nodes: [], edges: [] };
    }
  }
  /**
   * Gets event connections in a format suitable for the RelatedEventsPanel
   * @param {string} eventId - The event ID
   * @returns {Promise<Object>} Categorized event connections
   */
  async getEventConnections(eventId) {
    try {
      // Query relationships for this event
      const sourceQuery = query(
        this.relationshipsCollection,
        where("sourceEventId", "==", eventId)
      );
      
      const targetQuery = query(
        this.relationshipsCollection,
        where("targetEventId", "==", eventId)
      );
      
      // Get relationships where event is source
      const sourceSnapshot = await getDocs(sourceQuery);
      const sourceRelationships = [];
      sourceSnapshot.forEach(doc => {
        sourceRelationships.push(doc.data());
      });
      
      // Get relationships where event is target
      const targetSnapshot = await getDocs(targetQuery);
      const targetRelationships = [];
      targetSnapshot.forEach(doc => {
        targetRelationships.push(doc.data());
      });
      
      // Combine all relationships
      const allRelationships = [...sourceRelationships, ...targetRelationships];
      
      // If no relationships, return empty result
      if (allRelationships.length === 0) {
        return {};
      }
      
      // Get all related event IDs
      const relatedEventIds = new Set();
      
      // Add related event IDs
      allRelationships.forEach(rel => {
        if (rel.sourceEventId === eventId) {
          relatedEventIds.add(rel.targetEventId);
        } else {
          relatedEventIds.add(rel.sourceEventId);
        }
      });
      
      // Fetch all related events
      const relatedEvents = {};
      
      for (const id of relatedEventIds) {
        // Get event from EventStore or Firestore
        try {
          const event = await EventStore.getEventById(id);
          if (event) {
            relatedEvents[id] = event;
          }
        } catch (err) {
          console.error(`Error fetching event ${id}:`, err);
        }
      }
      
      // Categorize relationships
      const categorizedEvents = {
        sequential: [],
        thematic: [],
        causal: [],
        participants: []
      };
      
      allRelationships.forEach(rel => {
        // Get the related event ID (the one that's not the input event ID)
        const relatedEventId = rel.sourceEventId === eventId ? rel.targetEventId : rel.sourceEventId;
        
        // Get the related event
        const relatedEvent = relatedEvents[relatedEventId];
        if (!relatedEvent) return; // Skip if event not found
        
        // Determine relationship direction
        const direction = rel.sourceEventId === eventId ? 'outgoing' : 'incoming';
        
        // Categorize based on relationship type
        switch (rel.relationshipType) {
          case 'SEQUENTIAL':
            categorizedEvents.sequential.push({
              ...relatedEvent,
              relationship: direction === 'outgoing' ? 'after' : 'before',
              relationshipId: rel.id
            });
            break;
            
          case 'PARENT_CHILD':
            // Parent/child can be considered thematic
            categorizedEvents.thematic.push({
              ...relatedEvent,
              category: direction === 'outgoing' ? 'Child event' : 'Parent event',
              relationshipId: rel.id
            });
            break;
            
          case 'REQUIRES':
            categorizedEvents.causal.push({
              ...relatedEvent,
              relationship: direction === 'outgoing' ? 'dependency' : 'enables',
              relationshipId: rel.id
            });
            break;
            
          case 'SHARED_EQUIPMENT':
          case 'TRANSPORTATION':
            // These are participant-related
            categorizedEvents.participants.push({
              ...relatedEvent,
              relationshipId: rel.id
            });
            break;
            
          default:
            // Default to thematic
            categorizedEvents.thematic.push({
              ...relatedEvent,
              category: rel.relationshipType,
              relationshipId: rel.id
            });
        }
      });
      
      // Filter out empty categories
      const result = {};
      Object.entries(categorizedEvents).forEach(([key, value]) => {
        if (value.length > 0) {
          result[key] = value;
        }
      });
      
      return result;
    } catch (error) {
      console.error("Error getting event connections:", error);
      return {};
    }
  }
}

export default new EventRelationshipGraph();