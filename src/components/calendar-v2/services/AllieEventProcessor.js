// AI-powered event processing with Allie integration
import AllieAIService from '../../../services/AllieAIService';

export class AllieEventProcessor {
  constructor(familyId) {
    this.familyId = familyId;
  }

  // Process natural language input to extract event details
  async processNaturalLanguage(text) {
    try {
      // Use AllieAIService to extract event information
      const extractedData = await AllieAIService.extractEventFromText(this.familyId, text);
      
      // Parse the response and structure it
      const eventData = this.parseEventData(extractedData);
      
      // Generate follow-up questions if needed
      const followUpQuestions = this.generateFollowUpQuestions(eventData);
      
      // Check for potential conflicts
      const conflicts = await this.checkForConflicts(eventData);
      
      return {
        eventData,
        followUpQuestions,
        conflicts,
        confidence: this.calculateConfidence(eventData)
      };
    } catch (error) {
      console.error('Error processing natural language:', error);
      return null;
    }
  }

  parseEventData(rawData) {
    // Default event structure
    const event = {
      title: '',
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
      category: 'general',
      location: '',
      description: '',
      attendees: [],
      recurrence: 'none'
    };

    // Extract title
    if (rawData.title) {
      event.title = rawData.title;
    } else if (rawData.what) {
      event.title = rawData.what;
    }

    // Extract date and time
    if (rawData.when) {
      const parsedDate = this.parseDateTime(rawData.when);
      if (parsedDate) {
        event.startTime = parsedDate.start;
        event.endTime = parsedDate.end;
      }
    }

    // Extract location
    if (rawData.where) {
      event.location = rawData.where;
    }

    // Determine category
    event.category = this.categorizeEvent(event.title, rawData);

    // Extract attendees
    if (rawData.who) {
      event.attendees = this.parseAttendees(rawData.who);
    }

    // Check for recurrence patterns
    if (rawData.recurrence || this.detectRecurrence(event.title)) {
      event.recurrence = this.parseRecurrence(rawData.recurrence || event.title);
    }

    return event;
  }

  parseDateTime(whenString) {
    const now = new Date();
    const result = { start: null, end: null };

    // Common patterns
    const patterns = {
      // Tomorrow at 3pm
      tomorrow: /tomorrow\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
      // Next Monday at 2:30
      nextDay: /next\s+(\w+)\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
      // This Friday
      thisDay: /this\s+(\w+)/i,
      // At 3pm
      timeOnly: /(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
      // In 2 hours
      relative: /in\s+(\d+)\s+(hour|minute|day|week)s?/i,
      // Every Tuesday
      recurring: /every\s+(\w+)/i
    };

    // Try to match patterns
    for (const [type, pattern] of Object.entries(patterns)) {
      const match = whenString.match(pattern);
      if (match) {
        switch (type) {
          case 'tomorrow':
            result.start = new Date(now);
            result.start.setDate(result.start.getDate() + 1);
            result.start.setHours(this.parseHour(match[1], match[3]), parseInt(match[2] || 0), 0, 0);
            break;
          case 'relative':
            result.start = new Date(now);
            const amount = parseInt(match[1]);
            const unit = match[2];
            if (unit === 'hour') {
              result.start.setHours(result.start.getHours() + amount);
            } else if (unit === 'day') {
              result.start.setDate(result.start.getDate() + amount);
            }
            break;
          // Add more cases as needed
        }
        
        // Default to 1 hour duration if no end time specified
        if (result.start && !result.end) {
          result.end = new Date(result.start.getTime() + 60 * 60 * 1000);
        }
        break;
      }
    }

    return result.start ? result : null;
  }

  parseHour(hour, ampm) {
    let h = parseInt(hour);
    if (ampm) {
      if (ampm.toLowerCase() === 'pm' && h !== 12) {
        h += 12;
      } else if (ampm.toLowerCase() === 'am' && h === 12) {
        h = 0;
      }
    }
    return h;
  }

  categorizeEvent(title, data) {
    const categories = {
      medical: /doctor|dentist|appointment|checkup|therapy|medical/i,
      school: /school|class|teacher|homework|test|exam|quiz/i,
      sports: /practice|game|soccer|baseball|basketball|football|sports/i,
      birthday: /birthday|party|celebration/i,
      work: /meeting|work|office|interview|deadline/i,
      family: /family|dinner|reunion|visit/i,
      social: /friend|playdate|hangout|movie|lunch/i
    };

    const text = `${title} ${data.description || ''}`.toLowerCase();
    
    for (const [category, pattern] of Object.entries(categories)) {
      if (pattern.test(text)) {
        return category;
      }
    }

    return 'general';
  }

  parseAttendees(whoString) {
    // This would integrate with family member data
    // For now, return empty array
    return [];
  }

  detectRecurrence(text) {
    const recurringPatterns = /every|weekly|daily|monthly|yearly|recurring/i;
    return recurringPatterns.test(text);
  }

  parseRecurrence(text) {
    if (/daily|every\s*day/i.test(text)) return 'daily';
    if (/weekly|every\s*week/i.test(text)) return 'weekly';
    if (/monthly|every\s*month/i.test(text)) return 'monthly';
    if (/yearly|every\s*year/i.test(text)) return 'yearly';
    return 'none';
  }

  generateFollowUpQuestions(eventData) {
    const questions = [];

    // If no title, ask for it
    if (!eventData.title) {
      questions.push({
        id: 'title',
        question: 'What would you like to call this event?',
        type: 'text',
        required: true
      });
    }

    // If no time specified, ask
    if (!eventData.startTime || eventData.startTime.getTime() === new Date().getTime()) {
      questions.push({
        id: 'time',
        question: 'What time should this event start?',
        type: 'datetime',
        required: true
      });
    }

    // For certain categories, ask specific questions
    if (eventData.category === 'medical') {
      questions.push({
        id: 'insurance',
        question: 'Do you need to bring insurance cards?',
        type: 'boolean',
        required: false
      });
    }

    if (eventData.category === 'birthday') {
      questions.push({
        id: 'gift',
        question: 'Would you like a reminder to buy a gift?',
        type: 'boolean',
        required: false
      });
    }

    // Ask about attendees if none specified
    if (eventData.attendees.length === 0) {
      questions.push({
        id: 'attendees',
        question: 'Who should attend this event?',
        type: 'multiselect',
        options: [], // Will be populated with family members
        required: false
      });
    }

    return questions;
  }

  async checkForConflicts(eventData) {
    // This would check against existing calendar events
    // For now, return empty array
    return [];
  }

  calculateConfidence(eventData) {
    let score = 0;
    let total = 0;

    // Check each field
    if (eventData.title) { score += 1; }
    total += 1;

    if (eventData.startTime && eventData.startTime.getTime() !== new Date().getTime()) { score += 1; }
    total += 1;

    if (eventData.category !== 'general') { score += 1; }
    total += 1;

    if (eventData.location) { score += 1; }
    total += 1;

    return score / total;
  }
}