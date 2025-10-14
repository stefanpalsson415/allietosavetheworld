// src/services/ClaudeDirectService.js
/**
 * Primary Claude-based understanding service for Allie
 * Processes all user messages through Claude first, before any custom logic
 * This service handles message intent detection and entity extraction
 */
import ClaudeService from './ClaudeService';
import ClaudeResponseParser from './ClaudeResponseParser';
import { ActionTypes } from '../utils/ActionTypes';
import CalendarService from './CalendarService';

class ClaudeDirectService {
  constructor() {
    // Initialize Claude service
    this.claudeService = ClaudeService;
    this.responseParser = ClaudeResponseParser;
    
    // Track service state for debugging
    this.lastProcessedMessage = {
      text: null,
      timestamp: null,
      intent: null
    };
  }

  /**
   * Process a user message directly through Claude
   * @param {string} message - User's message
   * @param {string} familyId - Family identifier
   * @param {Array} context - Previous messages for context
   * @returns {Object} Intent and entity information
   */
  async processMessage(message, familyId, context = []) {
    console.log("🟢 Processing message with Claude-first approach:", message);
    
    try {
      // Check if this is a repeated message
      const isRepeatedMessage = this.isRepeatedMessage(message, context);
      if (isRepeatedMessage) {
        console.log("⚠️ Detected repeated message, will adjust handling");
      }
      
      // Step 1: Intent classification with Claude
      const intent = await this.classifyIntent(message);
      console.log("🟢 Claude intent classification result:", intent);
      
      // Special handling for calendar-related intents
      if (intent.type === 'ADD_EVENT' || 
          intent.type === 'QUERY_CALENDAR' || 
          intent.type === 'SCHEDULE_DATE_NIGHT') {
        
        // Check for recent calendar events if this is a query
        if (intent.type === 'QUERY_CALENDAR') {
          try {
            // Get recent calendar events to enhance response
            const now = new Date();
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + 14); // Look two weeks ahead
            
            const events = await CalendarService.getEventsForDateRange(
              now, 
              futureDate, 
              familyId
            );
            
            if (events && events.length > 0) {
              console.log(`📅 Found ${events.length} upcoming events that might be relevant`);
              // We'll attach this to the entity extraction result
              this.recentEvents = events.slice(0, 5); // Limit to 5 most recent
            }
          } catch (calendarError) {
            console.error("Error fetching calendar events:", calendarError);
          }
        }
      }
      
      // Step 2: Entity extraction for the identified intent
      const entities = await this.extractEntities(message, intent.type);
      console.log("🟢 Claude entity extraction result:", entities);
      
      // Add recent events to entity response for calendar queries
      if (intent.type === 'QUERY_CALENDAR' && this.recentEvents) {
        entities.recentEvents = this.recentEvents;
      }
      
      // Step 3: Determine if this is an action or information request
      const responseType = await this.determineResponseType(message);
      console.log("🟢 Claude response type analysis:", responseType);
      
      // Step 4: Check for repetition in context and adjust confidence if needed
      let adjustedConfidence = intent.confidence;
      if (isRepeatedMessage) {
        // For repeated messages, we'll lower confidence in the same intent
        // to encourage trying a different approach
        if (this.lastProcessedMessage && this.lastProcessedMessage.intent === intent.type) {
          adjustedConfidence = Math.max(0.4, intent.confidence * 0.8);
          console.log(`⚠️ Adjusted confidence for repeated message: ${intent.confidence} -> ${adjustedConfidence}`);
        }
      }
      
      // Update tracking state
      this.lastProcessedMessage = {
        text: message,
        timestamp: new Date().toISOString(),
        intent: intent.type,
        entities,
        responseType: responseType.type
      };
      
      // Return comprehensive understanding results
      return {
        intent: intent.type,
        confidence: adjustedConfidence,
        action: this.mapIntentToAction(intent.type),
        entities,
        responseType: responseType.type,
        isAction: responseType.type === 'action',
        isInformation: responseType.type === 'information',
        originalMessage: message,
        processed: true,
        repeated: isRepeatedMessage
      };
    } catch (error) {
      console.error("❌ Error in Claude-first processing:", error);
      return {
        intent: 'unknown',
        confidence: 0,
        error: error.message,
        processed: false,
        originalMessage: message
      };
    }
  }
  
  /**
   * Check if a message is repeated from previous context
   * @param {string} message - Current message
   * @param {Array} context - Previous message context
   * @returns {boolean} True if message is repeated
   */
  isRepeatedMessage(message, context = []) {
    if (!context || context.length === 0) return false;
    
    const normalizedMessage = message.trim().toLowerCase();
    
    // Look for the exact same message in recent context
    const userMessages = context
      .filter(msg => msg.sender !== 'allie')
      .map(msg => msg.text?.trim().toLowerCase());
    
    return userMessages.includes(normalizedMessage);
  }

  /**
   * Classify the intent of a message using Claude
   * @param {string} message - User message
   * @returns {Object} Intent type and confidence
   */
  async classifyIntent(message) {
    const systemPrompt = `You are the intent classification system for Allie, a family assistant app.
    
TASK: Determine the primary intent of the user's message.

Supported intents:
- ADD_PROVIDER: Adding a provider (doctor, babysitter, coach, teacher, etc)
- ADD_EVENT: Adding a calendar event or appointment
- ADD_TASK: Adding a task or to-do item
- QUERY_CALENDAR: Question about calendar or schedule
- QUERY_PROVIDERS: Question about family providers
- QUERY_TASKS: Question about tasks or to-dos
- SCHEDULE_DATE_NIGHT: Planning couple time 
- TRACK_GROWTH: Recording child growth metrics

CRITICAL RULES:
1. ALWAYS use ONLY one of the exact intent labels listed above
2. ANY request about babysitters is ALWAYS ADD_PROVIDER
3. Be especially attentive to differentiating providers from events

Format your response as a JSON object with:
- intent: The intent label
- confidence: Number from 0-1 indicating confidence level

Example 1: "Can you add a new babysitter for Lily named Martha?"
Response: {"intent": "ADD_PROVIDER", "confidence": 0.95}

Example 2: "Schedule a dentist appointment for next Tuesday at 3pm"
Response: {"intent": "ADD_EVENT", "confidence": 0.9}`;

    try {
      const response = await this.claudeService.generateResponse(
        [{ role: 'user', content: message }],
        { system: systemPrompt },
        { temperature: 0.1 }
      );
      
      // Parse intent from response
      const parsedIntent = this.responseParser.safelyParseJSON(response, {
        intent: 'unknown',
        confidence: 0.3
      });
      
      return {
        type: parsedIntent.intent || 'unknown',
        confidence: parsedIntent.confidence || 0.3,
        rawResponse: response
      };
    } catch (error) {
      console.error("Error classifying intent with Claude:", error);
      return { type: 'unknown', confidence: 0, error: error.message };
    }
  }

  /**
   * Extract entities based on the identified intent
   * @param {string} message - User message
   * @param {string} intentType - The identified intent type
   * @returns {Object} Extracted entities
   */
  async extractEntities(message, intentType) {
    let entityType = 'unknown';
    let extractionPrompt = '';
    
    // Determine entity type and extraction prompt based on intent
    switch (intentType) {
      case 'ADD_PROVIDER':
        entityType = 'provider';
        extractionPrompt = this.getProviderExtractionPrompt();
        break;
        
      case 'ADD_EVENT':
      case 'SCHEDULE_DATE_NIGHT':
        entityType = 'event';
        extractionPrompt = this.getEventExtractionPrompt();
        break;
        
      case 'ADD_TASK':
        entityType = 'task';
        extractionPrompt = this.getTaskExtractionPrompt();
        break;
        
      case 'TRACK_GROWTH':
        entityType = 'growth';
        extractionPrompt = this.getGrowthExtractionPrompt();
        break;
        
      default:
        // For query intents, we don't need detailed extraction
        return { entityType: 'query' };
    }
    
    try {
      const response = await this.claudeService.generateResponse(
        [{ role: 'user', content: message }],
        { system: extractionPrompt },
        { temperature: 0.2 }
      );
      
      // Parse entities from response
      const extractedEntities = this.responseParser.extractEntity(response, entityType);
      
      return {
        ...extractedEntities,
        entityType,
        rawText: message
      };
    } catch (error) {
      console.error(`Error extracting ${entityType} entities:`, error);
      return { entityType, error: error.message };
    }
  }
  
  /**
   * Determine if the message requires an action or is an information request
   * @param {string} message - User message
   * @returns {Object} Response type analysis
   */
  async determineResponseType(message) {
    const systemPrompt = `You are analyzing a user message to determine whether it requires:
1. An ACTION (adding something, changing something, creating something)
2. INFORMATION (answering a question, providing data)
3. CONVERSATION (general chat, greeting, etc.)

Respond with a JSON object containing:
- type: "action", "information", or "conversation"
- confidence: Number from 0-1 indicating confidence level`;

    try {
      const response = await this.claudeService.generateResponse(
        [{ role: 'user', content: message }],
        { system: systemPrompt },
        { temperature: 0.1 }
      );
      
      const analysis = this.responseParser.safelyParseJSON(response, {
        type: 'conversation',
        confidence: 0.5
      });
      
      return analysis;
    } catch (error) {
      console.error("Error determining response type:", error);
      return { type: 'conversation', confidence: 0.5 };
    }
  }
  
  /**
   * Map intent type to action type
   * @param {string} intentType - Intent type from classification
   * @returns {string} Action type for the system
   */
  mapIntentToAction(intentType) {
    const intentToActionMap = {
      'ADD_PROVIDER': ActionTypes.ADD_PROVIDER,
      'ADD_EVENT': ActionTypes.ADD_EVENT,
      'ADD_TASK': ActionTypes.ADD_TASK,
      'QUERY_CALENDAR': ActionTypes.QUERY_CALENDAR,
      'QUERY_PROVIDERS': ActionTypes.QUERY_PROVIDERS,
      'QUERY_TASKS': ActionTypes.QUERY_TASKS,
      'SCHEDULE_DATE_NIGHT': ActionTypes.SCHEDULE_DATE_NIGHT,
      'TRACK_GROWTH': ActionTypes.TRACK_GROWTH
    };
    
    return intentToActionMap[intentType] || null;
  }
  
  // Specialized extraction prompts
  
  getProviderExtractionPrompt() {
    return `You are extracting provider information from a user message.
Extract the following details in JSON format:
- name: Provider's full name
- type: Provider type (medical, childcare, education, coach, etc.)
- specialty: More specific detail (pediatrician, swimming coach, etc.)
- forChild: Which child this provider is for
- email: Provider email if mentioned
- phone: Provider phone if mentioned

IMPORTANT: 
- For babysitters, ALWAYS set type to "childcare"
- Pay special attention to which child the provider is for`;
  }
  
  getEventExtractionPrompt() {
    // Get current date for date reference
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0'); // JS months are 0-indexed
    const currentDay = today.getDate().toString().padStart(2, '0');
    
    // Calculate dates for common references
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowMonth = (tomorrow.getMonth() + 1).toString().padStart(2, '0');
    const tomorrowDay = tomorrow.getDate().toString().padStart(2, '0');
    
    // Calculate dates for next week days
    const nextThursday = new Date(today);
    nextThursday.setDate(today.getDate() + (4 - today.getDay() + 7) % 7);
    
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7);
    
    return `You are a highly precise event extraction system for a calendar application.

TODAY'S DATE: ${currentYear}-${currentMonth}-${currentDay}
CURRENT YEAR: ${currentYear}
NEXT YEAR: ${currentYear + 1}

YOUR TASK: Extract exact event details from the user message with perfect accuracy.

OUTPUT REQUIREMENTS:
1. Produce valid JSON with these fields:
   - title: The clear event name/description (REQUIRED)
   - date: Exact date in YYYY-MM-DD format (REQUIRED)
   - time: Start time in 24-hour format (HH:MM) (if specified)
   - childName: Name of child mentioned (if applicable)
   - eventType: Category (e.g., "appointment", "meeting", "doctor") (if clear)
   - location: Location (if specified)

2. DATE PARSING RULES - CRITICAL:
   - American format: MM/DD/YYYY or MM-DD-YYYY → YYYY-MM-DD  
   - European format: DD/MM/YYYY or DD-MM-YYYY → YYYY-MM-DD
   - If year not specified, use current year
   - Named days ("Thursday", "next Friday", etc.) → convert to exact date
   - "today" → ${currentYear}-${currentMonth}-${currentDay}
   - "tomorrow" → ${tomorrow.getFullYear()}-${tomorrowMonth}-${tomorrowDay}
   - "next Thursday" → ${nextThursday.getFullYear()}-${(nextThursday.getMonth() + 1).toString().padStart(2, '0')}-${nextThursday.getDate().toString().padStart(2, '0')}
   - "next week" → add 7 days to today

3. TIME PARSING RULES:
   - "3pm" → "15:00"
   - "3:30pm" → "15:30"
   - "morning" → "09:00"
   - "afternoon" → "14:00"
   - "evening" → "18:00" 
   - If no time specified, OMIT time field

CRITICAL: When a message contains phrases like "dentist appointment for [name]" or specific requests with a child's name, ALWAYS include the child's name as "childName" and set "eventType" to the appropriate category (e.g., "appointment", "doctor", "school").

EXAMPLES OF PERFECT EXTRACTION:

Message: "can you book a dentist appt for lilly next thurs at 3pm?"
Output: {
  "title": "Dentist Appointment",
  "date": "${nextThursday.getFullYear()}-${(nextThursday.getMonth() + 1).toString().padStart(2, '0')}-${nextThursday.getDate().toString().padStart(2, '0')}",
  "time": "15:00",
  "childName": "Lilly",
  "eventType": "doctor"
}

Message: "Schedule soccer practice on 5/10/2025"
Output: {
  "title": "Soccer Practice",
  "date": "2025-05-10",
  "eventType": "sport"
}

RESPONSE FORMAT: JSON object only, no additional text.`;
  }
  
  getTaskExtractionPrompt() {
    return `You are extracting task information from a user message.
Extract the following details in JSON format:
- title: Short task title
- description: Full task description
- assignedTo: Who the task is assigned to
- dueDate: When the task is due (YYYY-MM-DD format)
- priority: Task priority (high, medium, low)
- category: Task category if apparent (household, childcare, etc.)

IMPORTANT:
- Be concise with the title, but descriptive with the description
- If assignedTo isn't specified, set it to null`;
  }
  
  getGrowthExtractionPrompt() {
    return `You are extracting child growth information from a user message.
Extract the following details in JSON format:
- childName: Name of the child
- measurement: Type of measurement (height, weight, etc.)
- value: The numerical value
- unit: The unit (cm, kg, lb, etc.)
- date: When measurement was taken (YYYY-MM-DD format)

IMPORTANT:
- Be precise about which child this is for
- Ensure units are standardized`;
  }
}

export default new ClaudeDirectService();