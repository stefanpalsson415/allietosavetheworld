/**
 * MessageEnhancer.js
 * 
 * This service enriches text messages with interactive components
 * based on message content and context.
 */

// Helper function to extract an address from text
const extractAddress = (text) => {
  // Simple logic to detect addresses - could be enhanced with regex
  const addressLines = text.split('\n')
    .filter(line => 
      line.includes('Location') || 
      (line.includes('Address') && !line.includes('email')) ||
      line.match(/\d+\s+[A-Za-z]+\s+(St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard)/)
    );
  
  if (addressLines.length > 0) {
    // Extract just the address portion
    const addressText = addressLines[0]
      .replace(/^Location:\s*/i, '')
      .replace(/^Address:\s*/i, '')
      .trim();
      
    return addressText;
  }
  
  return null;
};

// Helper function to extract an event date and time
const extractDateTime = (text) => {
  // Simple date extraction - could be enhanced with a date parsing library
  const dateLines = text.split('\n')
    .filter(line => 
      line.includes('Date') || 
      line.includes('When') ||
      line.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(st|nd|rd|th)?(,)? \d{4}/i)
    );
  
  if (dateLines.length > 0) {
    // Extract just the date portion
    const dateText = dateLines[0]
      .replace(/^Date:\s*/i, '')
      .replace(/^When:\s*/i, '')
      .trim();
      
    return dateText;
  }
  
  return null;
};

/**
 * Enhance a message with interactive components based on its content.
 * 
 * @param {Object} message - The message object to enhance
 * @param {Object} context - Additional context (family members, event details, etc.)
 * @param {Object} adaptationParams - Optional adaptation parameters from feedback learning
 * @returns {Object} - Enhanced message with added components
 */
export const enhanceMessage = (message, context = {}, adaptationParams = null) => {
  // Only enhance Allie's messages
  if (message.sender !== 'allie') {
    return message;
  }
  
  // Clone message to avoid mutations
  const enhancedMessage = { ...message };
  
  // Initialize components array if not present
  if (!enhancedMessage.components) {
    enhancedMessage.components = [];
  }
  
  // Add components based on message content
  const text = message.text || '';
  const eventDetails = message.eventData || context.eventDetails;
  
  // Apply any adaptations based on user feedback preferences
  if (adaptationParams) {
    // Apply detail level adaptation to message
    if (adaptationParams.detailLevel === 'simpler' && enhancedMessage.text) {
      // We could add logic here to simplify text, but we'll focus on component changes
    } else if (adaptationParams.detailLevel === 'detailed' && enhancedMessage.text) {
      // We could add logic here to make text more detailed
    }
  }
  
  // Add map preview for location-based events
  // But check if this is a topic the user wants to avoid
  const shouldShowMap = !adaptationParams?.avoidAreas?.includes('map') && 
                        !adaptationParams?.avoidAreas?.includes('location');
  
  if (shouldShowMap && (eventDetails?.location || extractAddress(text))) {
    const location = eventDetails?.location || extractAddress(text);
    if (location) {
      enhancedMessage.components.push({
        type: 'map_preview',
        location: location,
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(location)}`,
        directions: {
          url: `https://maps.google.com/maps?daddr=${encodeURIComponent(location)}`,
          durationText: '15 min'
        }
      });
    }
  }
  
  // Add event card for event confirmations
  // Only if the user hasn't given negative feedback on event cards
  const shouldShowEventCard = !adaptationParams?.avoidAreas?.includes('event_card') && 
                             !adaptationParams?.avoidAreas?.includes('calendar');
  
  if (shouldShowEventCard && eventDetails && text.includes('set up') && (text.includes('calendar') || text.includes('event'))) {
    enhancedMessage.components.push({
      type: 'event_card',
      event: {
        ...eventDetails,
        title: eventDetails.title || 'Event',
        dateTime: eventDetails.dateTime || new Date().toISOString(),
        location: eventDetails.location || 'No location specified'
      }
    });
  }
  
  // Add preparation checklist for upcoming events
  // But check if the user prefers more or fewer details
  const shouldShowChecklist = !adaptationParams?.avoidAreas?.includes('checklist') &&
                              adaptationParams?.detailLevel !== 'simpler';
  
  if (shouldShowChecklist && eventDetails && (text.includes('bring') || text.includes('need') || text.includes('require'))) {
    const items = [];
    
    // Extract items to bring - could be based on event type
    if (eventDetails.specialItems && typeof eventDetails.specialItems === 'string') {
      // Split special items by commas or newlines
      const specialItems = eventDetails.specialItems
        .split(/[,\n]/)
        .map(item => item.trim())
        .filter(item => item.length > 0);
        
      specialItems.forEach(item => {
        items.push({
          text: item,
          subtext: 'Required'
        });
      });
    }
    
    // Add event-type specific common items
    if (eventDetails.eventType === 'birthday' || 
       (eventDetails.title && eventDetails.title.toLowerCase().includes('birthday'))) {
      if (eventDetails.needsGift) {
        items.push({
          text: 'Gift for birthday child',
          subtext: 'Required'
        });
      }
    } else if (eventDetails.eventType === 'doctor_appointment') {
      items.push({
        text: 'Insurance card',
        subtext: 'Required'
      });
      items.push({
        text: 'Medical history',
        subtext: 'If requested'
      });
    } else if (eventDetails.eventType === 'sports_event') {
      items.push({
        text: 'Water bottle',
        subtext: 'Recommended'
      });
      if (eventDetails.equipment) {
        // Add equipment items
        if (Array.isArray(eventDetails.equipment)) {
          eventDetails.equipment.forEach(item => {
            if (item !== 'other') {
              items.push({
                text: item.replace('_', ' '),
                subtext: 'Required'
              });
            }
          });
        }
      }
    }
    
    // Only add the checklist if we have items
    if (items.length > 0) {
      enhancedMessage.components.push({
        type: 'prep_checklist',
        event: {
          title: eventDetails.title || 'Event',
          dateTime: eventDetails.dateTime || new Date().toISOString()
        },
        items: items
      });
    }
  }
  
  // Add quick replies for some messages
  // Check if user has expressed preference for quick replies
  const shouldShowQuickReplies = (
    !adaptationParams?.avoidAreas?.includes('quick_replies') &&
    (adaptationParams?.focusAreas?.includes('quick_replies') || !adaptationParams)
  );
  
  if (shouldShowQuickReplies && (text.includes('question') || text.includes('?'))) {
    // Extract options from the message
    const options = [];
    
    // Check for follow-up questions
    if (message.followUpQuestion?.options) {
      message.followUpQuestion.options.forEach(option => {
        options.push({
          label: option.name,
          value: option.id
        });
      });
    } else if (text.includes('yes') && text.includes('no')) {
      // Add generic yes/no options
      options.push({ label: 'Yes', value: 'yes' });
      options.push({ label: 'No', value: 'no' });
    }
    
    // Only add quick replies if we have options
    if (options.length > 0) {
      enhancedMessage.components.push({
        type: 'quick_replies',
        options: options
      });
    }
  }
  
  return enhancedMessage;
};

/**
 * Creates a complete message with rich components for event summaries
 * 
 * @param {Object} eventDetails - Event details object
 * @param {String} summaryText - Text summary to include
 * @param {Object} context - Additional context (family members, adaptationParams, etc.)
 * @returns {Object} - Complete message object with rich components
 */
export const createEventSummaryMessage = (eventDetails, summaryText, context = {}) => {
  const message = {
    sender: 'allie',
    userName: 'Allie',
    text: summaryText,
    timestamp: new Date().toISOString(),
    eventData: eventDetails,
    components: []
  };
  
  // Add family ID if available
  if (context.familyId) {
    message.familyId = context.familyId;
  }
  
  // Add conversation ID if available for feedback tracking
  if (context.conversationId) {
    message.conversationId = context.conversationId;
  }
  
  // Enhance with components, passing any adaptation parameters
  return enhanceMessage(message, context, context.adaptationParams);
};

export default {
  enhanceMessage,
  createEventSummaryMessage
};