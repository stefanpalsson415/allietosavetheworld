// MessageRouter.js - Centralized message routing service
// This service handles all intent detection and routing for Allie chat

import IntentActionService from './IntentActionService';
import CalendarService from './CalendarService';
import ClaudeService from './ClaudeService';

class MessageRouter {
  constructor() {
    this.routes = [
      {
        name: 'event_creation',
        priority: 1,
        patterns: [
          /\b(create|add|schedule|book|set up|make)\b.*\b(event|appointment|meeting|match|game|practice|lesson|class|session)\b/i,
          /\b(tennis|soccer|baseball|basketball|football|hockey|swim|dance|music|piano|guitar|tutoring|swedish|math|english)\s+(match|game|practice|lesson|class|session)\b/i,
          /\b(has|have|got)\s+(a|an)\s+.*\b(appointment|meeting|lesson|session|class|practice|game|match)\b/i,
          /\bdentist|doctor|orthodontist|therapist|counselor|vet\b.*\b(appointment|visit|checkup|check-up)\b/i,
          /\b(appointment|meeting|event|session|lesson|class)\s+(for|with|at|on)\b/i,
          /\b(tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|next month)\s+at\s+\d/i,
          /\b(tutoring|lesson|class|practice|session|appointment|meeting)\b.*\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/i,
        ],
        handler: 'handleEventCreation'
      },
      {
        name: 'task_creation',
        priority: 2,
        patterns: [
          /\b(create|add|make|set)\b.*\b(task|todo|to-do|reminder)\b/i,
          /\bremind\s+(me|us|someone)\s+to\b/i,
          /\bneed\s+to\s+(do|complete|finish)\b/i,
          /\b(task|todo):\s+/i
        ],
        handler: 'handleTaskCreation'
      },
      {
        name: 'contact_creation',
        priority: 3,
        patterns: [
          /\b(add|create|save|store)\b.*\b(contact|babysitter|doctor|teacher|coach|therapist)\b/i,
          /\b(babysitter|nanny|caregiver|doctor|dentist|teacher|coach|tutor)\b.*\b(name|number|phone|email)\b/i,
          /\bsave.*\b(his|her|their)\s+(number|phone|email|contact)\b/i
        ],
        handler: 'handleContactCreation'
      },
      {
        name: 'place_creation',
        priority: 4,
        patterns: [
          /\b(add|save|remember|store)\b.*\b(place|location|address|school|park|restaurant|store)\b/i,
          /\b(school|park|playground|restaurant|cafe|store|shop|gym|library)\s+(at|on|near)\b/i,
          /\bremember\s+this\s+(place|location|address)\b/i
        ],
        handler: 'handlePlaceCreation'
      },
      {
        name: 'query_calendar',
        priority: 5,
        patterns: [
          /\b(what|when|show|list|display)\b.*\b(events?|appointments?|calendar|schedule)\b/i,
          /\b(do|does)\s+(i|we|anyone)\s+have\b.*\b(today|tomorrow|this week|next week)\b/i,
          /\bwhat's\s+(on|happening|scheduled)\b/i,
          /\b(free|available|busy)\s+(time|slot|day)\b/i
        ],
        handler: 'handleCalendarQuery'
      },
      {
        name: 'query_tasks',
        priority: 6,
        patterns: [
          /\b(what|show|list|display|check)\b.*\b(tasks?|todos?|to-dos?|kanban|board)\b/i,
          /\bkanba[nm]\s+board\b/i, // Handle typo "kanbam"
          /\b(do|does)\s+(i|we)\s+have\b.*\b(tasks?|todos?)\b/i,
          /\bmy\s+(tasks?|todos?|to-dos?)\b/i,
          /\btask\s+(board|list)\b/i,
          /\bwhat\s+tasks?\b/i
        ],
        handler: 'handleTaskQuery'
      },
      {
        name: 'phone_verification',
        priority: 10, // Lower priority
        patterns: [
          /\b(verify|add|set up|configure)\s+(my|phone|sms|text)\b/i,
          /\btext\s+(me|messages?|sms)\b/i,
          /\bphone\s+(number|verification)\b/i
        ],
        handler: 'handlePhoneVerification'
      }
    ];
  }

  /**
   * Route a message to the appropriate handler
   * @param {string} message - The user's message
   * @param {object} context - Context including familyId, userId, etc.
   * @returns {Promise<object>} Result of routing
   */
  async routeMessage(message, context) {
    console.log('🚦 MessageRouter: Routing message:', message.substring(0, 50));
    
    // Check each route in priority order
    for (const route of this.routes.sort((a, b) => a.priority - b.priority)) {
      for (const pattern of route.patterns) {
        if (pattern.test(message)) {
          console.log(`✅ MessageRouter: Matched route '${route.name}'`);
          
          try {
            const result = await this[route.handler](message, context);
            return {
              handled: true,
              route: route.name,
              result
            };
          } catch (error) {
            console.error(`❌ MessageRouter: Error in ${route.handler}:`, error);
            return {
              handled: false,
              error: error.message
            };
          }
        }
      }
    }
    
    console.log('🔄 MessageRouter: No specific route matched, using general chat');
    return {
      handled: false,
      route: 'general_chat'
    };
  }

  /**
   * Handle event creation requests
   */
  async handleEventCreation(message, context) {
    const { familyId, userId } = context;
    
    console.log('📅 MessageRouter: Handling event creation');
    
    // Use IntentActionService to handle the event
    const result = await IntentActionService.handleAddEvent(message, familyId, userId);
    
    if (result.success) {
      // Trigger calendar refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
      }
    }
    
    return {
      type: 'event',
      success: result.success,
      message: result.message || result.error
    };
  }

  /**
   * Handle task creation requests
   */
  async handleTaskCreation(message, context) {
    const { familyId, userId } = context;
    
    console.log('📝 MessageRouter: Handling task creation');
    
    // Extract task details using Claude
    const extractPrompt = `Extract task details from: "${message}"
    Return as JSON: { "title": "task title", "assignedTo": "person name or null", "priority": "high/medium/low", "dueDate": "date or null" }`;
    
    const response = await ClaudeService.generateResponse(
      [{ role: 'user', content: extractPrompt }],
      { temperature: 0.3 }
    );
    
    const taskDetails = JSON.parse(response.match(/\{[\s\S]*\}/)?.[0] || '{}');
    
    // Create task event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('allie-create-task', {
        detail: { task: taskDetails }
      }));
    }
    
    return {
      type: 'task',
      success: true,
      message: `✅ I've created the task: "${taskDetails.title}"`
    };
  }

  /**
   * Handle contact creation requests
   */
  async handleContactCreation(message, context) {
    console.log('👥 MessageRouter: Handling contact creation');
    
    const result = await IntentActionService.handleAddContact(message, context);
    
    return {
      type: 'contact',
      success: result.success,
      message: result.message || result.error
    };
  }

  /**
   * Handle place creation requests
   */
  async handlePlaceCreation(message, context) {
    console.log('📍 MessageRouter: Handling place creation');
    
    const result = await IntentActionService.handleAddPlace(message, context.familyId, context.userId);
    
    return {
      type: 'place',
      success: result.success,
      message: result.message || result.error
    };
  }

  /**
   * Handle calendar queries
   */
  async handleCalendarQuery(message, context) {
    console.log('📅 MessageRouter: Handling calendar query');

    const result = await IntentActionService.handleQueryCalendar(message, context.familyId, context.userId);

    return {
      type: 'query',
      success: result.success,
      message: result.message || result.error
    };
  }

  /**
   * Handle task queries
   */
  async handleTaskQuery(message, context) {
    console.log('📋 MessageRouter: Handling task query');

    const result = await IntentActionService.handleQueryTasks(message, context.familyId, context.userId);

    return {
      type: 'query',
      success: result.success,
      message: result.message || result.error,
      data: result.data
    };
  }

  /**
   * Handle phone verification requests
   */
  async handlePhoneVerification(message, context) {
    console.log('📱 MessageRouter: Handling phone verification');
    
    return {
      type: 'phone_verification',
      success: true,
      message: "I'll help you set up phone verification.",
      action: 'show_phone_verification_modal'
    };
  }

  /**
   * Check if a message matches any known patterns
   */
  matchesAnyPattern(message) {
    for (const route of this.routes) {
      for (const pattern of route.patterns) {
        if (pattern.test(message)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Get suggested intent for a message (for debugging)
   */
  getSuggestedIntent(message) {
    for (const route of this.routes.sort((a, b) => a.priority - b.priority)) {
      for (const pattern of route.patterns) {
        if (pattern.test(message)) {
          return route.name;
        }
      }
    }
    return 'general_chat';
  }
}

// Export singleton instance
const messageRouter = new MessageRouter();
export default messageRouter;