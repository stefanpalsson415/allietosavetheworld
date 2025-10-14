// src/services/RelatedEventDetector.js
import EventStore from './EventStore';
import EventRelationshipGraph from './EventRelationshipGraph';
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
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { addDays, differenceInDays, isSameDay, format, parseISO } from 'date-fns';
import ProactiveAlertSystem from './ProactiveAlertSystem';

/**
 * RelatedEventDetector service
 * Analyzes events to detect potential relationships and creates suggestions
 * for users to confirm or reject
 */
class RelatedEventDetector {
  constructor() {
    this.suggestionsCollection = collection(db, "relationshipSuggestions");
    
    // Patterns for detecting different types of events
    this.eventPatterns = {
      medical: {
        keywords: ['doctor', 'dentist', 'therapy', 'hospital', 'clinic', 'appointment', 'checkup', 'follow-up', 'medical', 'health'],
        excludeKeywords: ['class', 'lesson'],
        regex: /doctor|dentist|therapy|hospital|clinic|appointment|checkup|follow-?up|medical|health/i
      },
      
      school: {
        keywords: ['school', 'class', 'lecture', 'seminar', 'study', 'homework', 'project', 'exam', 'test', 'assignment', 'presentation'],
        excludeKeywords: ['doctor', 'hospital'],
        regex: /school|class|lecture|seminar|study|homework|project|exam|test|assignment|presentation/i
      },
      
      sports: {
        keywords: ['soccer', 'football', 'baseball', 'basketball', 'hockey', 'swimming', 'tennis', 'golf', 'practice', 'game', 'match', 'tournament'],
        excludeKeywords: [],
        regex: /soccer|football|baseball|basketball|hockey|swim|tennis|golf|practice|game|match|tournament/i
      },
      
      shopping: {
        keywords: ['shopping', 'store', 'mall', 'market', 'buy', 'purchase', 'shop'],
        excludeKeywords: [],
        regex: /shopping|store|mall|market|buy|purchase|shop/i
      },
      
      transportation: {
        keywords: ['pickup', 'dropoff', 'carpool', 'drive', 'ride', 'airport', 'flight'],
        excludeKeywords: [],
        regex: /pickup|pick-?up|dropoff|drop-?off|carpool|drive|ride|airport|flight/i
      }
    };
  }
  
  /**
   * Analyzes a set of events and detects potential relationships
   * @param {string} familyId - The family ID
   * @param {Date} startDate - The start date for analysis
   * @param {Date} endDate - The end date for analysis
   * @param {boolean} createSuggestions - Whether to create suggestion documents
   * @returns {Promise<Array>} Detected potential relationships
   */
  async detectRelationships(familyId, startDate = new Date(), endDate = null, createSuggestions = true) {
    try {
      // If no end date is provided, default to 30 days from start
      if (!endDate) {
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30);
      }
      
      // Get suggestions from event relationship graph
      const suggestedRelationships = await EventRelationshipGraph.suggestRelationships(
        familyId, startDate, endDate
      );
      
      // If we want to create suggestion documents
      if (createSuggestions && suggestedRelationships.length > 0) {
        await this.createRelationshipSuggestions(familyId, suggestedRelationships);
      }
      
      return suggestedRelationships;
    } catch (error) {
      console.error("Error detecting relationships:", error);
      return [];
    }
  }
  
  /**
   * Creates suggestion documents for potential relationships
   * @param {string} familyId - The family ID
   * @param {Array} suggestedRelationships - The suggested relationships
   * @returns {Promise<Object>} The result of creating suggestions
   */
  async createRelationshipSuggestions(familyId, suggestedRelationships) {
    try {
      const createdSuggestions = [];
      
      for (const suggestion of suggestedRelationships) {
        // Check if this suggestion already exists
        const existingQuery = query(
          this.suggestionsCollection,
          where("familyId", "==", familyId),
          where("sourceEventId", "==", suggestion.sourceEventId),
          where("targetEventId", "==", suggestion.targetEventId),
          where("relationshipType", "==", suggestion.relationshipType)
        );
        
        const existingSnapshot = await getDocs(existingQuery);
        
        // Skip if this suggestion already exists
        if (!existingSnapshot.empty) {
          continue;
        }
        
        // Create a new suggestion document
        const suggestionDoc = {
          id: uuidv4(),
          familyId,
          sourceEventId: suggestion.sourceEventId,
          sourceEventTitle: suggestion.sourceEventTitle,
          targetEventId: suggestion.targetEventId,
          targetEventTitle: suggestion.targetEventTitle,
          relationshipType: suggestion.relationshipType,
          typeName: suggestion.typeName,
          confidence: suggestion.confidence,
          reason: suggestion.reason,
          status: 'pending', // pending, accepted, rejected
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        // Save the suggestion
        await setDoc(doc(this.suggestionsCollection, suggestionDoc.id), suggestionDoc);
        
        createdSuggestions.push(suggestionDoc);
      }
      
      // If we created any new suggestions, create a proactive alert
      if (createdSuggestions.length > 0) {
        await this.createRelationshipAlert(familyId, createdSuggestions);
      }
      
      return {
        success: true,
        count: createdSuggestions.length,
        suggestions: createdSuggestions
      };
    } catch (error) {
      console.error("Error creating relationship suggestions:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Creates a proactive alert for newly detected relationships
   * @param {string} familyId - The family ID
   * @param {Array} suggestions - The relationship suggestions
   * @returns {Promise<Object>} The result of creating the alert
   */
  async createRelationshipAlert(familyId, suggestions) {
    try {
      // Group suggestions by type for better presentation
      const groupedSuggestions = {};
      
      for (const suggestion of suggestions) {
        if (!groupedSuggestions[suggestion.relationshipType]) {
          groupedSuggestions[suggestion.relationshipType] = [];
        }
        
        groupedSuggestions[suggestion.relationshipType].push(suggestion);
      }
      
      // Build alert message
      let message = 'Allie has detected potential event relationships that could help your family coordination:\n\n';
      
      for (const type in groupedSuggestions) {
        const typeSuggestions = groupedSuggestions[type];
        const typeName = typeSuggestions[0].typeName;
        
        message += `**${typeName} Relationships**\n`;
        
        for (const suggestion of typeSuggestions) {
          message += `• "${suggestion.sourceEventTitle}" and "${suggestion.targetEventTitle}"\n`;
        }
        
        message += '\n';
      }
      
      message += 'Would you like to review these suggestions? They can help with planning and coordination.';
      
      // Create alert data
      const alertData = {
        title: 'Event Relationships Detected',
        message,
        priority: 3, // Medium priority
        expiration: addDays(new Date(), 7), // Expires in 7 days
        actionType: 'view_event_relationships',
        actionData: {
          suggestionIds: suggestions.map(s => s.id)
        }
      };
      
      // Create the alert
      const result = await ProactiveAlertSystem.createAlert(
        familyId,
        'SCHEDULE_OPTIMIZATION',
        alertData
      );
      
      return result;
    } catch (error) {
      console.error("Error creating relationship alert:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Gets all pending relationship suggestions for a family
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Pending suggestions
   */
  async getPendingSuggestions(familyId) {
    try {
      const suggestionsQuery = query(
        this.suggestionsCollection,
        where("familyId", "==", familyId),
        where("status", "==", "pending"),
        orderBy("confidence", "desc")
      );
      
      const snapshot = await getDocs(suggestionsQuery);
      const suggestions = [];
      
      snapshot.forEach(doc => {
        suggestions.push(doc.data());
      });
      
      return suggestions;
    } catch (error) {
      console.error("Error getting pending suggestions:", error);
      return [];
    }
  }
  
  /**
   * Accepts a relationship suggestion and creates the relationship
   * @param {string} suggestionId - The suggestion ID
   * @returns {Promise<Object>} The result of accepting the suggestion
   */
  async acceptSuggestion(suggestionId) {
    try {
      // Get the suggestion
      const suggestionDoc = await getDoc(doc(this.suggestionsCollection, suggestionId));
      
      if (!suggestionDoc.exists()) {
        throw new Error(`Suggestion ${suggestionId} not found`);
      }
      
      const suggestion = suggestionDoc.data();
      
      // Create the relationship
      const result = await EventRelationshipGraph.createRelationship(
        suggestion.familyId,
        suggestion.sourceEventId,
        suggestion.targetEventId,
        suggestion.relationshipType,
        {
          confidence: suggestion.confidence,
          reason: suggestion.reason,
          acceptedAt: new Date().toISOString()
        }
      );
      
      // Update the suggestion status
      await updateDoc(doc(this.suggestionsCollection, suggestionId), {
        status: 'accepted',
        updatedAt: serverTimestamp()
      });
      
      return {
        success: true,
        relationshipId: result.relationshipId,
        relationship: result.relationship
      };
    } catch (error) {
      console.error("Error accepting suggestion:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Rejects a relationship suggestion
   * @param {string} suggestionId - The suggestion ID
   * @returns {Promise<Object>} The result of rejecting the suggestion
   */
  async rejectSuggestion(suggestionId) {
    try {
      // Update the suggestion status
      await updateDoc(doc(this.suggestionsCollection, suggestionId), {
        status: 'rejected',
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error rejecting suggestion:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Identifies events that should be linked to a newly created event
   * @param {string} familyId - The family ID
   * @param {Object} newEvent - The newly created event
   * @returns {Promise<Array>} Potentially related events
   */
  async identifyRelatedEvents(familyId, newEvent) {
    try {
      // Check event type to determine relationships to look for
      const eventType = this.detectEventType(newEvent);
      
      // Different logic based on event type
      let potentiallyRelatedEvents = [];
      
      switch (eventType) {
        case 'medical':
          potentiallyRelatedEvents = await this.findRelatedMedicalEvents(familyId, newEvent);
          break;
        case 'school':
          potentiallyRelatedEvents = await this.findRelatedSchoolEvents(familyId, newEvent);
          break;
        case 'sports':
          potentiallyRelatedEvents = await this.findRelatedSportsEvents(familyId, newEvent);
          break;
        case 'shopping':
          potentiallyRelatedEvents = await this.findRelatedShoppingEvents(familyId, newEvent);
          break;
        case 'transportation':
          potentiallyRelatedEvents = await this.findRelatedTransportationEvents(familyId, newEvent);
          break;
        default:
          // Generic relationship finding for other event types
          potentiallyRelatedEvents = await this.findGenericRelatedEvents(familyId, newEvent);
      }
      
      return potentiallyRelatedEvents;
    } catch (error) {
      console.error("Error identifying related events:", error);
      return [];
    }
  }
  
  /**
   * Detects the type of an event based on its details
   * @param {Object} event - The event to analyze
   * @returns {string} The detected event type
   */
  detectEventType(event) {
    const title = (event.title || '').toLowerCase();
    const description = (event.description || '').toLowerCase();
    const category = (event.category || '').toLowerCase();
    const type = (event.type || '').toLowerCase();
    
    // First check if the event already has a type or category
    if (['medical', 'school', 'sports', 'shopping', 'transportation'].includes(type)) {
      return type;
    }
    
    if (['medical', 'school', 'sports', 'shopping', 'transportation'].includes(category)) {
      return category;
    }
    
    // Check against our pattern matchers
    for (const [eventType, pattern] of Object.entries(this.eventPatterns)) {
      // Check title and description against regex
      if (pattern.regex.test(title) || pattern.regex.test(description)) {
        // Check for exclude keywords
        let excluded = false;
        for (const excludeWord of pattern.excludeKeywords) {
          if (title.includes(excludeWord) || description.includes(excludeWord)) {
            excluded = true;
            break;
          }
        }
        
        if (!excluded) {
          return eventType;
        }
      }
    }
    
    // Default to generic if no match
    return 'generic';
  }
  
  /**
   * Finds events related to a medical event
   * @param {string} familyId - The family ID
   * @param {Object} event - The medical event
   * @returns {Promise<Array>} Potentially related events
   */
  async findRelatedMedicalEvents(familyId, event) {
    try {
      const eventDate = new Date(event.startDate || event.start || event.date);
      
      // Look for previous and future appointments in a 90-day window
      const startDate = new Date(eventDate);
      startDate.setDate(startDate.getDate() - 45); // 45 days before
      
      const endDate = new Date(eventDate);
      endDate.setDate(endDate.getDate() + 45); // 45 days after
      
      // Get all events in the window
      const events = await EventStore.getEvents(familyId, startDate, endDate);
      
      // Filter to medical events
      const medicalEvents = events.filter(e => 
        e.id !== event.id && // Not the same event
        (e.type === 'medical' || 
         e.category === 'medical' || 
         this.eventPatterns.medical.regex.test(e.title) || 
         this.eventPatterns.medical.regex.test(e.description || ''))
      );
      
      // Look for events related to same medical issue/location
      const relatedEvents = [];
      const eventTitle = event.title.toLowerCase();
      const eventLocation = (event.location || '').toLowerCase();
      
      for (const medicalEvent of medicalEvents) {
        const medTitle = medicalEvent.title.toLowerCase();
        const medLocation = (medicalEvent.location || '').toLowerCase();
        
        let confidence = 0;
        let reason = '';
        
        // Check for naming patterns suggesting follow-up
        if (/follow-?up|check-?up/i.test(medTitle) || /follow-?up|check-?up/i.test(eventTitle)) {
          confidence += 0.4;
          reason += 'Follow-up appointment pattern detected. ';
        }
        
        // Check for same location/provider
        if (eventLocation && medLocation && eventLocation === medLocation) {
          confidence += 0.3;
          reason += 'Same medical provider/location. ';
        }
        
        // Check for keyword similarity
        const eventWords = eventTitle.split(/\s+/).filter(w => w.length > 3);
        const medWords = medTitle.split(/\s+/).filter(w => w.length > 3);
        
        let sharedWords = 0;
        for (const word of eventWords) {
          if (medWords.includes(word)) {
            sharedWords++;
          }
        }
        
        if (sharedWords > 0) {
          confidence += 0.1 * sharedWords;
          reason += `${sharedWords} shared keywords. `;
        }
        
        // Add to results if confidence is high enough
        if (confidence >= 0.3) {
          relatedEvents.push({
            event: medicalEvent,
            relationshipType: differenceInDays(new Date(medicalEvent.startDate || medicalEvent.start || medicalEvent.date), eventDate) > 0 ? 'SEQUENTIAL' : 'RELATED',
            confidence,
            reason: reason.trim()
          });
        }
      }
      
      // Sort by confidence
      return relatedEvents.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error("Error finding related medical events:", error);
      return [];
    }
  }
  
  /**
   * Finds events related to a school event
   * @param {string} familyId - The family ID
   * @param {Object} event - The school event
   * @returns {Promise<Array>} Potentially related events
   */
  async findRelatedSchoolEvents(familyId, event) {
    try {
      const eventDate = new Date(event.startDate || event.start || event.date);
      
      // Look for events in a 14-day window around the event
      const startDate = new Date(eventDate);
      startDate.setDate(startDate.getDate() - 7); // 7 days before
      
      const endDate = new Date(eventDate);
      endDate.setDate(endDate.getDate() + 7); // 7 days after
      
      // Get all events in the window
      const events = await EventStore.getEvents(familyId, startDate, endDate);
      
      // Check if this is a project/deadline event
      const isProjectEvent = /project|deadline|presentation|exam|test|assignment/i.test(event.title);
      
      const relatedEvents = [];
      const eventTitle = event.title.toLowerCase();
      
      for (const otherEvent of events) {
        if (otherEvent.id === event.id) continue; // Skip the same event
        
        const otherTitle = otherEvent.title.toLowerCase();
        let confidence = 0;
        let reason = '';
        let relationshipType = 'RELATED';
        
        // If this is a project event, look for preparation events
        if (isProjectEvent) {
          // Look for shopping/preparation events
          if (this.eventPatterns.shopping.regex.test(otherTitle)) {
            const eventWords = eventTitle.split(/\s+/).filter(w => w.length > 3);
            const otherWords = otherTitle.split(/\s+/).filter(w => w.length > 3);
            
            // Check for shared keywords
            let sharedWords = 0;
            for (const word of eventWords) {
              if (otherWords.includes(word)) {
                sharedWords++;
              }
            }
            
            if (sharedWords > 0) {
              confidence += 0.2 * sharedWords;
              reason += `Shopping event with ${sharedWords} shared keywords. `;
              relationshipType = 'REQUIRES';
            }
          }
          
          // Look for related homework/study sessions
          if (/homework|study|prep/i.test(otherTitle)) {
            confidence += 0.3;
            reason += 'Related study/homework session. ';
            relationshipType = 'PARENT_CHILD';
          }
        } else {
          // For regular school events, look for other events at same location
          if (event.location && otherEvent.location && event.location === otherEvent.location) {
            confidence += 0.2;
            reason += 'Same location. ';
          }
          
          // Check for recurring pattern (same day of week)
          const eventDay = eventDate.getDay();
          const otherDay = new Date(otherEvent.startDate || otherEvent.start || otherEvent.date).getDay();
          
          if (eventDay === otherDay) {
            confidence += 0.1;
            reason += 'Same day of week. ';
          }
        }
        
        // Add to results if confidence is high enough
        if (confidence >= 0.2) {
          relatedEvents.push({
            event: otherEvent,
            relationshipType,
            confidence,
            reason: reason.trim()
          });
        }
      }
      
      // Sort by confidence
      return relatedEvents.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error("Error finding related school events:", error);
      return [];
    }
  }
  
  /**
   * Finds events related to a sports event
   * @param {string} familyId - The family ID
   * @param {Object} event - The sports event
   * @returns {Promise<Array>} Potentially related events
   */
  async findRelatedSportsEvents(familyId, event) {
    try {
      const eventDate = new Date(event.startDate || event.start || event.date);
      
      // Look for events in a 14-day window
      const startDate = new Date(eventDate);
      startDate.setDate(startDate.getDate() - 7);
      
      const endDate = new Date(eventDate);
      endDate.setDate(endDate.getDate() + 7);
      
      // Get all events in the window
      const events = await EventStore.getEvents(familyId, startDate, endDate);
      
      const relatedEvents = [];
      const eventTitle = event.title.toLowerCase();
      
      // Determine the sport type
      let sportType = 'general';
      for (const keyword of ['soccer', 'football', 'baseball', 'basketball', 'hockey', 'swim', 'tennis', 'golf']) {
        if (eventTitle.includes(keyword)) {
          sportType = keyword;
          break;
        }
      }
      
      // Determine if this is a practice or game
      const isPractice = /practice|training|lesson/i.test(eventTitle);
      const isGame = /game|match|tournament|competition/i.test(eventTitle);
      
      for (const otherEvent of events) {
        if (otherEvent.id === event.id) continue;
        
        const otherTitle = otherEvent.title.toLowerCase();
        let confidence = 0;
        let reason = '';
        let relationshipType = 'RELATED';
        
        // Check if other event is related to same sport
        if (otherTitle.includes(sportType)) {
          confidence += 0.3;
          reason += `Same sport (${sportType}). `;
          
          // If this is a practice and other is a game (or vice versa)
          if (isPractice && /game|match|tournament|competition/i.test(otherTitle)) {
            confidence += 0.2;
            reason += 'Practice related to game. ';
            relationshipType = 'SEQUENTIAL';
          } else if (isGame && /practice|training|lesson/i.test(otherTitle)) {
            confidence += 0.2;
            reason += 'Game related to practice. ';
            relationshipType = 'SEQUENTIAL';
          }
          
          // Same location suggests stronger relationship
          if (event.location && otherEvent.location && event.location === otherEvent.location) {
            confidence += 0.2;
            reason += 'Same location. ';
          }
          
          // Check for equipment requirements
          if (this.eventPatterns.shopping.regex.test(otherTitle)) {
            if (otherTitle.includes(sportType)) {
              confidence += 0.2;
              reason += 'Related equipment shopping. ';
              relationshipType = 'REQUIRES';
            }
          }
          
          // Same participants suggests stronger relationship
          if (event.participantIds && otherEvent.participantIds) {
            const sameParticipants = event.participantIds.filter(id => 
              otherEvent.participantIds.includes(id)
            );
            
            if (sameParticipants.length > 0) {
              confidence += 0.2;
              reason += 'Same participants. ';
            }
          }
        }
        
        // Add to results if confidence is high enough
        if (confidence >= 0.3) {
          relatedEvents.push({
            event: otherEvent,
            relationshipType,
            confidence,
            reason: reason.trim()
          });
        }
      }
      
      // Sort by confidence
      return relatedEvents.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error("Error finding related sports events:", error);
      return [];
    }
  }
  
  /**
   * Finds events related to a shopping event
   * @param {string} familyId - The family ID
   * @param {Object} event - The shopping event
   * @returns {Promise<Array>} Potentially related events
   */
  async findRelatedShoppingEvents(familyId, event) {
    try {
      const eventDate = new Date(event.startDate || event.start || event.date);
      
      // Look for events in a 7-day window after the shopping
      const startDate = new Date(eventDate);
      startDate.setDate(startDate.getDate() - 1);
      
      const endDate = new Date(eventDate);
      endDate.setDate(endDate.getDate() + 7);
      
      // Get all events in the window
      const events = await EventStore.getEvents(familyId, startDate, endDate);
      
      const relatedEvents = [];
      const eventTitle = event.title.toLowerCase();
      
      // Extract shopping item keywords
      const shoppingItemWords = eventTitle
        .replace(/shopping|buy|purchase|store|shop|at|for/gi, '')
        .trim()
        .split(/\s+/)
        .filter(w => w.length > 2);
      
      for (const otherEvent of events) {
        if (otherEvent.id === event.id) continue;
        
        const otherTitle = otherEvent.title.toLowerCase();
        let confidence = 0;
        let reason = '';
        
        // Check if shopping keywords match other event
        let matchedWords = 0;
        for (const word of shoppingItemWords) {
          if (otherTitle.includes(word)) {
            matchedWords++;
          }
        }
        
        if (matchedWords > 0) {
          confidence += 0.15 * matchedWords;
          reason += `${matchedWords} matching shopping items. `;
        }
        
        // Shopping followed by event suggests requirement relationship
        if (differenceInDays(new Date(otherEvent.startDate || otherEvent.start || otherEvent.date), eventDate) > 0) {
          confidence += 0.2;
          reason += 'Shopping preceding event. ';
        }
        
        // Add to results if confidence is high enough
        if (confidence >= 0.2) {
          relatedEvents.push({
            event: otherEvent,
            relationshipType: 'REQUIRES',
            confidence,
            reason: reason.trim()
          });
        }
      }
      
      // Sort by confidence
      return relatedEvents.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error("Error finding related shopping events:", error);
      return [];
    }
  }
  
  /**
   * Finds events related to a transportation event
   * @param {string} familyId - The family ID
   * @param {Object} event - The transportation event
   * @returns {Promise<Array>} Potentially related events
   */
  async findRelatedTransportationEvents(familyId, event) {
    try {
      const eventDate = new Date(event.startDate || event.start || event.date);
      
      // Look for events on the same day
      const dayStart = new Date(eventDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(eventDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Get all events on the same day
      const events = await EventStore.getEvents(familyId, dayStart, dayEnd);
      
      const relatedEvents = [];
      const eventTitle = event.title.toLowerCase();
      const isPickup = /pickup|pick-?up/i.test(eventTitle);
      const isDropoff = /dropoff|drop-?off/i.test(eventTitle);
      
      // Extract location and person information
      const eventWords = eventTitle.split(/\s+/).filter(w => w.length > 2);
      
      for (const otherEvent of events) {
        if (otherEvent.id === event.id) continue;
        
        const otherTitle = otherEvent.title.toLowerCase();
        let confidence = 0;
        let reason = '';
        
        // Check for complementary transportation (pickup/dropoff pair)
        if (isPickup && /dropoff|drop-?off/i.test(otherTitle)) {
          confidence += 0.4;
          reason += 'Pickup paired with dropoff. ';
        } else if (isDropoff && /pickup|pick-?up/i.test(otherTitle)) {
          confidence += 0.4;
          reason += 'Dropoff paired with pickup. ';
        }
        
        // Check for matching location or person
        const otherWords = otherTitle.split(/\s+/).filter(w => w.length > 2);
        let matchedWords = 0;
        
        for (const word of eventWords) {
          if (otherWords.includes(word)) {
            matchedWords++;
          }
        }
        
        if (matchedWords > 0) {
          confidence += 0.1 * matchedWords;
          reason += `${matchedWords} matching words. `;
        }
        
        // Same location suggests transportation relationship
        if (event.location && otherEvent.location && event.location === otherEvent.location) {
          confidence += 0.3;
          reason += 'Same location. ';
        }
        
        // Time proximity suggests relationship
        const eventTime = eventDate.getHours() * 60 + eventDate.getMinutes();
        const otherTime = new Date(otherEvent.startDate || otherEvent.start || otherEvent.date).getHours() * 60 + 
                         new Date(otherEvent.startDate || otherEvent.start || otherEvent.date).getMinutes();
        
        const timeDiff = Math.abs(eventTime - otherTime);
        
        if (timeDiff <= 120) { // Within 2 hours
          confidence += 0.3;
          reason += 'Close in time (within 2 hours). ';
        }
        
        // Add to results if confidence is high enough
        if (confidence >= 0.3) {
          relatedEvents.push({
            event: otherEvent,
            relationshipType: 'TRANSPORTATION',
            confidence,
            reason: reason.trim()
          });
        }
      }
      
      // Sort by confidence
      return relatedEvents.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error("Error finding related transportation events:", error);
      return [];
    }
  }
  
  /**
   * Finds events generically related to any event
   * @param {string} familyId - The family ID
   * @param {Object} event - The event
   * @returns {Promise<Array>} Potentially related events
   */
  async findGenericRelatedEvents(familyId, event) {
    try {
      const eventDate = new Date(event.startDate || event.start || event.date);
      
      // Look for events in a 7-day window
      const startDate = new Date(eventDate);
      startDate.setDate(startDate.getDate() - 3);
      
      const endDate = new Date(eventDate);
      endDate.setDate(endDate.getDate() + 3);
      
      // Get all events in the window
      const events = await EventStore.getEvents(familyId, startDate, endDate);
      
      const relatedEvents = [];
      const eventTitle = event.title.toLowerCase();
      const eventWords = eventTitle.split(/\s+/).filter(w => w.length > 3);
      
      for (const otherEvent of events) {
        if (otherEvent.id === event.id) continue;
        
        const otherTitle = otherEvent.title.toLowerCase();
        const otherWords = otherTitle.split(/\s+/).filter(w => w.length > 3);
        
        let confidence = 0;
        let reason = '';
        let relationshipType = 'RELATED';
        
        // Check for shared keywords
        let sharedWords = 0;
        for (const word of eventWords) {
          if (otherWords.includes(word)) {
            sharedWords++;
          }
        }
        
        if (sharedWords > 0) {
          confidence += 0.1 * sharedWords;
          reason += `${sharedWords} shared keywords. `;
        }
        
        // Same location
        if (event.location && otherEvent.location && event.location === otherEvent.location) {
          confidence += 0.2;
          reason += 'Same location. ';
        }
        
        // Same participants
        if (event.participantIds && otherEvent.participantIds) {
          const sameParticipants = event.participantIds.filter(id => 
            otherEvent.participantIds.includes(id)
          );
          
          if (sameParticipants.length > 0) {
            confidence += 0.1 * sameParticipants.length;
            reason += `${sameParticipants.length} same participants. `;
          }
        }
        
        // Sequential events on same day
        if (isSameDay(eventDate, new Date(otherEvent.startDate || otherEvent.start || otherEvent.date))) {
          confidence += 0.2;
          reason += 'Same day events. ';
          relationshipType = 'SEQUENTIAL';
        }
        
        // Add to results if confidence is high enough
        if (confidence >= 0.3) {
          relatedEvents.push({
            event: otherEvent,
            relationshipType,
            confidence,
            reason: reason.trim()
          });
        }
      }
      
      // Sort by confidence
      return relatedEvents.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error("Error finding generic related events:", error);
      return [];
    }
  }
  /**
   * Detects relationships for a specific event and categorizes them
   * @param {Object} event - The event to find relationships for
   * @param {Array} allEvents - All events to check against
   * @returns {Object} Categorized related events
   */
  async detectRelationshipsForEvent(event, allEvents) {
    try {
      if (!event || !event.id || allEvents.length === 0) {
        return {};
      }
      
      // Categorize related events
      const result = {
        sequential: [],   // Events that come before or after this one
        thematic: [],     // Events with similar themes or categories
        causal: [],       // Events with causal relationships (requires/enables)
        participants: []  // Events with shared participants
      };
      
      const eventDate = new Date(event.startDate || event.start || event.dateTime || event.date);
      const eventTitle = (event.title || '').toLowerCase();
      const eventCategory = (event.category || event.eventType || '').toLowerCase();
      const eventLocation = (event.location || '').toLowerCase();
      const eventParticipants = event.attendees || event.participants || [];
      
      // Extract significant words from the title
      const titleWords = eventTitle.split(/\s+/).filter(w => w.length > 3);
      
      // Process each event
      for (const otherEvent of allEvents) {
        // Skip the same event
        if (otherEvent.id === event.id) continue;
        
        const otherDate = new Date(otherEvent.startDate || otherEvent.start || otherEvent.dateTime || otherEvent.date);
        const otherTitle = (otherEvent.title || '').toLowerCase();
        const otherCategory = (otherEvent.category || otherEvent.eventType || '').toLowerCase();
        const otherLocation = (otherEvent.location || '').toLowerCase();
        const otherParticipants = otherEvent.attendees || otherEvent.participants || [];
        
        // Check for sequential events
        const dayDifference = Math.abs(differenceInDays(eventDate, otherDate));
        
        if (dayDifference <= 14) { // Within 2 weeks
          // Events that are part of a sequence
          if (
            // Follow-up appointments
            /follow-?up|check-?up/i.test(otherTitle) || 
            /follow-?up|check-?up/i.test(eventTitle) ||
            // Regular weekly events
            (isSameDay(new Date(eventDate.setDate(eventDate.getDate() + 7)), otherDate) && eventTitle === otherTitle)
          ) {
            const relationship = otherDate > eventDate ? 'after' : 'before';
            
            result.sequential.push({
              ...otherEvent,
              relationship,
              confidence: 0.8,
              reason: /follow-?up|check-?up/i.test(otherTitle) ? 'Follow-up event' : 'Regular weekly event'
            });
            
            continue; // Skip other categories
          }
        }
        
        // Check for thematic similarity (same category or similar content)
        if (
          // Same explicit category
          (eventCategory && otherCategory && eventCategory === otherCategory) ||
          // Similar title words
          (() => {
            const otherWords = otherTitle.split(/\s+/).filter(w => w.length > 3);
            const sharedWords = titleWords.filter(word => otherWords.includes(word));
            return sharedWords.length >= 2;
          })()
        ) {
          result.thematic.push({
            ...otherEvent,
            confidence: 0.7,
            reason: eventCategory === otherCategory 
              ? `Same category: ${eventCategory}`
              : 'Similar event content'
          });
          
          continue; // Skip other categories
        }
        
        // Check for causal relationships (requires/enables)
        if (
          // Shopping before event suggests requirement
          (/shopping|buy|purchase/i.test(otherTitle) && otherDate < eventDate) ||
          // Preparation events
          (/prep|prepare|setup/i.test(otherTitle) && otherDate < eventDate)
        ) {
          result.causal.push({
            ...otherEvent,
            relationship: 'dependency',
            confidence: 0.7,
            reason: /shopping|buy|purchase/i.test(otherTitle) 
              ? 'Shopping for this event' 
              : 'Preparation for this event'
          });
          
          continue; // Skip other categories
        }
        
        // Check for shared participants
        if (eventParticipants.length > 0 && otherParticipants.length > 0) {
          // Find shared participant IDs
          const getParticipantIds = (participants) => {
            return participants.map(p => p.id || p);
          };
          
          const eventParticipantIds = getParticipantIds(eventParticipants);
          const otherParticipantIds = getParticipantIds(otherParticipants);
          
          const sharedParticipants = eventParticipantIds.filter(id => 
            otherParticipantIds.includes(id)
          );
          
          if (sharedParticipants.length > 0) {
            result.participants.push({
              ...otherEvent,
              sharedParticipants,
              confidence: 0.5 + (0.1 * sharedParticipants.length),
              reason: `${sharedParticipants.length} shared participants`
            });
          }
        }
      }
      
      return result;
    } catch (error) {
      console.error("Error detecting relationships for event:", error);
      return {};
    }
  }
}

export default new RelatedEventDetector();