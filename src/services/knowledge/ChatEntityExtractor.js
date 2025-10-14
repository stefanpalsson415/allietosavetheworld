/**
 * ChatEntityExtractor.js
 * 
 * Specialized entity extractor for chat messages and conversations.
 * Analyzes chat content to extract mentioned entities and relationships.
 */

import EntityExtractor from './EntityExtractor';

class ChatEntityExtractor extends EntityExtractor {
  constructor() {
    super();
    
    // Intent patterns for different types of requests or mentions
    this.intentPatterns = [
      {
        intent: 'schedule_event',
        patterns: [
          /(?:add|create|schedule)(?:\s+a|\s+an)?\s+(?:event|appointment|meeting)/i,
          /(?:need|want)(?:\s+to)?\s+(?:add|create|schedule)(?:\s+a|\s+an)?\s+(?:event|appointment|meeting)/i,
          /(?:put|add)(?:\s+this)?\s+(?:on|to|in)(?:\s+the|my)?\s+calendar/i
        ],
        confidence: 0.85
      },
      {
        intent: 'task_creation',
        patterns: [
          /(?:add|create)(?:\s+a|\s+an)?\s+(?:task|todo|to-do|reminder)/i,
          /(?:need|want)(?:\s+to)?\s+(?:add|create)(?:\s+a|\s+an)?\s+(?:task|todo|to-do|reminder)/i,
          /(?:remind|remember)(?:\s+me|\s+us)?\s+to\s+([^\.]+)/i
        ],
        confidence: 0.85
      },
      {
        intent: 'task_assignment',
        patterns: [
          /(?:assign)(?:\s+this)?\s+(?:task|todo|to-do|job)(?:\s+to)\s+([A-Z][a-zA-Z\s]+)/i,
          /([A-Z][a-zA-Z\s]+)(?:\s+(?:should|will|needs to))(?:\s+(?:do|handle|take care of|be responsible for))\s+([^\.]+)/i,
          /(?:can|could)\s+([A-Z][a-zA-Z\s]+)(?:\s+(?:do|handle|take care of|be responsible for))\s+([^\.]+)\?/i
        ],
        confidence: 0.8
      },
      {
        intent: 'location_mention',
        patterns: [
          /(?:at|in|near)\s+([A-Z][a-zA-Z\s\-'&]+)(?=[\.,;:\s])/i,
          /(?:going|gone|travel|visit)(?:\s+to)?\s+([A-Z][a-zA-Z\s\-'&]+)(?=[\.,;:\s])/i
        ],
        confidence: 0.7
      },
      {
        intent: 'relationships',
        patterns: [
          /([A-Z][a-zA-Z\s]+)(?:'s|\s+is\s+(?:my|the))?\s+(?:husband|wife|spouse|partner|mother|father|parent|child|son|daughter|brother|sister|sibling)/i
        ],
        confidence: 0.9
      }
    ];
  }
  
  /**
   * Extract entities from chat message
   * @param {Object} message - The message to analyze
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction result with entities and relationships
   */
  async extract(message, options = {}) {
    const result = {
      entities: [],
      relationships: [],
      metadata: {
        source: 'chat',
        messageId: message.id || 'unknown',
        extractorVersion: '1.0',
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      // Get message content
      let content;
      
      if (typeof message === 'string') {
        // Plain text message
        content = message;
      } else if (message.content) {
        // Message with content field
        content = message.content;
      } else if (message.text) {
        // Message with text field
        content = message.text;
      } else if (message.message) {
        // Message wrapped in message field
        content = message.message;
      } else {
        throw new Error('Unable to extract content from message');
      }
      
      // Extract communication entity
      const communicationEntity = this.createEntity('communication', {
        type: 'message',
        timestamp: message.timestamp || message.createdAt || new Date().toISOString(),
        content: content,
        participants: message.participants || message.sender ? [message.sender] : [],
        subject: message.subject || ''
      });
      
      if (communicationEntity) {
        communicationEntity.id = message.id || `msg_${Date.now()}`;
        result.entities.push(communicationEntity);
      }
      
      // Extract dates
      const dates = this.extractDates(content);
      
      // Extract times
      const times = this.extractTimes(content);
      
      // Extract locations
      const locations = this.extractLocations(content, options.knownLocations || []);
      
      // Extract people
      const people = this.extractPeople(content, options.knownPeople || []);
      
      // Detect intents
      const intents = this.detectIntents(content);
      
      // Add location entities
      locations.forEach(location => {
        if (location.type === 'extracted_location' && location.confidence >= this.confidenceThreshold) {
          const locationEntity = this.createEntity('location', {
            name: location.name,
            type: 'extracted',
            source: 'chat'
          }, location.confidence);
          
          locationEntity.id = this.generateReferenceId('location', location.name);
          result.entities.push(locationEntity);
        }
      });
      
      // Add person entities
      people.forEach(person => {
        if (person.type === 'extracted_person' && person.confidence >= this.confidenceThreshold) {
          const personEntity = this.createEntity('person', {
            name: person.name,
            source: 'chat'
          }, person.confidence);
          
          personEntity.id = this.generateReferenceId('person', person.name);
          result.entities.push(personEntity);
          
          // Add participation relationship to the communication
          result.relationships.push(
            this.createRelationship(
              personEntity.id,
              communicationEntity.id,
              'participated_in',
              {
                role: person.name === (message.sender?.name || message.sender) ? 'sender' : 'mentioned',
                sentiment: 'neutral' // Would be determined by sentiment analysis in production
              },
              person.confidence * 0.9
            )
          );
        }
      });
      
      // Process intents
      if (intents.length > 0) {
        // Handle schedule_event intent
        const scheduleEventIntent = intents.find(i => i.intent === 'schedule_event');
        if (scheduleEventIntent) {
          // Create event if we have date
          if (dates.length > 0) {
            const eventEntity = this.createEntity('event', {
              title: this.extractEventTitle(content) || 'Mentioned Event',
              startDate: dates[0].value,
              startTime: times.length > 0 ? times[0].value : null,
              description: content,
              status: 'tentative',
              eventType: 'extracted',
              source: 'chat'
            }, scheduleEventIntent.confidence * 0.8);
            
            if (eventEntity) {
              eventEntity.id = this.generateReferenceId('event', `event_${dates[0].value}_${times.length > 0 ? times[0].value : 'unknown'}`);
              result.entities.push(eventEntity);
              
              // Associate event with mentioned people
              people.forEach(person => {
                if (person.id) {
                  result.relationships.push(
                    this.createRelationship(
                      person.id,
                      eventEntity.id,
                      'attends',
                      {
                        role: 'participant',
                        confirmed: false
                      },
                      Math.min(person.confidence, scheduleEventIntent.confidence) * 0.7
                    )
                  );
                }
              });
              
              // Associate event with mentioned locations
              locations.forEach(location => {
                if (location.id) {
                  result.relationships.push(
                    this.createRelationship(
                      eventEntity.id,
                      location.id,
                      'occurs_at',
                      {
                        confirmed: false
                      },
                      Math.min(location.confidence, scheduleEventIntent.confidence) * 0.7
                    )
                  );
                }
              });
            }
          }
        }
        
        // Handle task_creation intent
        const taskCreationIntent = intents.find(i => i.intent === 'task_creation');
        if (taskCreationIntent) {
          const taskTitle = this.extractTaskTitle(content);
          
          if (taskTitle) {
            const taskEntity = this.createEntity('task', {
              title: taskTitle,
              description: content,
              status: 'pending',
              dueDate: dates.length > 0 ? dates[0].value : null,
              taskType: 'extracted',
              source: 'chat'
            }, taskCreationIntent.confidence * 0.8);
            
            if (taskEntity) {
              taskEntity.id = this.generateReferenceId('task', `task_${taskTitle}`);
              result.entities.push(taskEntity);
              
              // Associate task with message sender as creator
              if (message.sender) {
                const senderId = options.knownPeople ? 
                  options.knownPeople.find(p => p.name === message.sender)?.id :
                  this.generateReferenceId('person', message.sender);
                
                if (senderId) {
                  result.relationships.push(
                    this.createRelationship(
                      taskEntity.id,
                      senderId,
                      'created_by',
                      {
                        date: message.timestamp || message.createdAt || new Date().toISOString()
                      },
                      taskCreationIntent.confidence * 0.8
                    )
                  );
                }
              }
            }
          }
        }
        
        // Handle task_assignment intent
        const taskAssignmentIntent = intents.find(i => i.intent === 'task_assignment');
        if (taskAssignmentIntent && taskAssignmentIntent.matches && taskAssignmentIntent.matches.length >= 2) {
          const assigneeName = taskAssignmentIntent.matches[0];
          const taskDescription = taskAssignmentIntent.matches[1];
          
          if (assigneeName && taskDescription) {
            // Create task entity if not already created
            let taskEntity;
            const existingTaskEntity = result.entities.find(e => e.type === 'task');
            
            if (existingTaskEntity) {
              taskEntity = existingTaskEntity;
            } else {
              taskEntity = this.createEntity('task', {
                title: taskDescription,
                description: content,
                status: 'pending',
                dueDate: dates.length > 0 ? dates[0].value : null,
                taskType: 'assigned',
                source: 'chat'
              }, taskAssignmentIntent.confidence * 0.8);
              
              if (taskEntity) {
                taskEntity.id = this.generateReferenceId('task', `task_${taskDescription}`);
                result.entities.push(taskEntity);
              }
            }
            
            // Add assignment relationship
            if (taskEntity) {
              const assigneeId = options.knownPeople ? 
                options.knownPeople.find(p => p.name === assigneeName)?.id :
                this.generateReferenceId('person', assigneeName);
              
              if (assigneeId) {
                result.relationships.push(
                  this.createRelationship(
                    taskEntity.id,
                    assigneeId,
                    'assigned_to',
                    {
                      assignedDate: message.timestamp || message.createdAt || new Date().toISOString(),
                      voluntary: false
                    },
                    taskAssignmentIntent.confidence * 0.8
                  )
                );
              }
            }
          }
        }
        
        // Handle relationship mentions
        const relationshipIntent = intents.find(i => i.intent === 'relationships');
        if (relationshipIntent && relationshipIntent.matches && relationshipIntent.matches.length >= 2) {
          const personName = relationshipIntent.matches[0];
          const relationship = relationshipIntent.matches[1].toLowerCase();
          
          // We'd need additional context to process this fully
          // In production, would store this as potential relationship information
          // to be verified by the user
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error extracting entities from chat:', error);
      result.metadata.error = error.message;
      return result;
    }
  }
  
  /**
   * Detect intents in text
   * @param {string} text - Text to analyze
   * @returns {Array} Array of detected intents
   */
  detectIntents(text) {
    const detectedIntents = [];
    
    this.intentPatterns.forEach(intentPattern => {
      intentPattern.patterns.forEach(pattern => {
        const matches = text.match(pattern);
        
        if (matches) {
          // Extract captured groups as matches
          const capturedMatches = matches.slice(1).filter(Boolean).map(m => m.trim());
          
          detectedIntents.push({
            intent: intentPattern.intent,
            confidence: intentPattern.confidence,
            pattern: pattern.toString(),
            matches: capturedMatches
          });
        }
      });
    });
    
    return detectedIntents;
  }
  
  /**
   * Extract task title from text
   * @param {string} text - Text to analyze
   * @returns {string|null} Extracted task title
   */
  extractTaskTitle(text) {
    // Look for patterns like "add a task to X" or "remind me to X"
    const patterns = [
      /(?:add|create)(?:\s+a|\s+an)?\s+(?:task|todo|to-do|reminder)(?:\s+to)?\s+([^\.]+)/i,
      /(?:remind|remember)(?:\s+me|\s+us)?\s+to\s+([^\.]+)/i,
      /(?:need|want)(?:\s+to)?\s+(?:add|create)(?:\s+a|\s+an)?\s+(?:task|todo|to-do|reminder)(?:\s+to)?\s+([^\.]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }
  
  /**
   * Extract event title from text
   * @param {string} text - Text to analyze
   * @returns {string|null} Extracted event title
   */
  extractEventTitle(text) {
    // Look for patterns like "schedule an event for X" or "add X to calendar"
    const patterns = [
      /(?:add|create|schedule)(?:\s+a|\s+an)?\s+(?:event|appointment|meeting)(?:\s+for)?\s+([^\.]+?)(?:\s+on|\s+at|\s+with|\s+in|\.)/i,
      /(?:put|add)\s+([^\.]+?)(?:\s+on|\s+to|\s+in)(?:\s+the|my)?\s+calendar/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    return null;
  }
  
  /**
   * Process a conversation to extract entities and context
   * @param {Array} messages - Array of chat messages
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Merged extraction results
   */
  async processConversation(messages, options = {}) {
    const conversationResult = {
      entities: {},
      relationships: [],
      metadata: {
        source: 'conversation',
        messageCount: messages.length,
        extractorVersion: '1.0',
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      // Process each message
      const messageResults = await Promise.all(
        messages.map(message => this.extract(message, options))
      );
      
      // Merge entities (using ID as key to prevent duplicates)
      messageResults.forEach(result => {
        result.entities.forEach(entity => {
          conversationResult.entities[entity.id] = entity;
        });
        
        // Add relationships
        conversationResult.relationships.push(...result.relationships);
      });
      
      // Convert entities object to array
      const entitiesArray = Object.values(conversationResult.entities);
      
      // Deduplicate relationships
      const uniqueRelationships = [];
      const relationshipMap = {};
      
      conversationResult.relationships.forEach(rel => {
        const relKey = `${rel.sourceId}-${rel.type}-${rel.targetId}`;
        
        if (!relationshipMap[relKey]) {
          relationshipMap[relKey] = rel;
          uniqueRelationships.push(rel);
        } else {
          // If duplicate, take the one with higher confidence
          if (rel.metadata.confidence > relationshipMap[relKey].metadata.confidence) {
            const index = uniqueRelationships.findIndex(r => 
              r.sourceId === rel.sourceId && r.type === rel.type && r.targetId === rel.targetId
            );
            if (index !== -1) {
              uniqueRelationships[index] = rel;
              relationshipMap[relKey] = rel;
            }
          }
        }
      });
      
      return {
        entities: entitiesArray,
        relationships: uniqueRelationships,
        metadata: conversationResult.metadata
      };
    } catch (error) {
      console.error('Error processing conversation:', error);
      conversationResult.metadata.error = error.message;
      return {
        entities: Object.values(conversationResult.entities),
        relationships: conversationResult.relationships,
        metadata: conversationResult.metadata
      };
    }
  }
}

export default ChatEntityExtractor;