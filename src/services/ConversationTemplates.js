/**
 * ConversationTemplates.js
 * 
 * This service provides structured conversation flows for different event types,
 * ensuring consistent, comprehensive follow-up questions tailored to each event context.
 */

// Import any necessary dependencies
import { format } from 'date-fns';

// Temporary fix to avoid undefined references
const familyMembers = [];

// Base template for common questions across all event types
const baseTemplate = {
  // Common fields that should be collected for any event
  commonFields: [
    'title',
    'dateTime',
    'endDateTime',
    'location',
    'description',
    'attendees'
  ],
  
  // Common follow-up questions applicable to most events
  commonQuestions: [
    {
      id: 'transportation',
      text: 'Who will be handling transportation for this event?',
      applicable: (eventDetails) => 
        eventDetails.location && 
        !eventDetails.isVirtual && 
        eventDetails.childName,
      options: (familyMembers) => 
        familyMembers
          .filter(m => m.role === 'parent')
          .map(p => ({ id: p.id, name: p.name }))
          .concat([
            { id: 'both_parents', name: 'Both parents' },
            { id: 'other', name: 'Someone else' }
          ])
    },
    {
      id: 'reminder_timing',
      text: 'How much advance notice would you like for this event?',
      applicable: (eventDetails) => true,
      options: () => [
        { id: '15min', name: '15 minutes before' },
        { id: '1hour', name: '1 hour before' },
        { id: '1day', name: '1 day before' },
        { id: 'custom', name: 'Custom timing' }
      ]
    }
  ]
};

// ========== EVENT-SPECIFIC TEMPLATES ==========

// Birthday party template
const birthdayPartyTemplate = {
  eventType: 'birthday_party',
  detectionKeywords: ['birthday', 'bday', 'party', 'celebrate'],
  
  // Additional fields specific to birthday parties
  additionalFields: [
    'hostName',
    'birthdayChildName',
    'birthdayChildAge',
    'rsvpDeadline',
    'rsvpContact'
  ],
  
  // Birthday-specific follow-up questions
  questions: [
    {
      id: 'attendees',
      text: (eventDetails) => 
        `Which parent(s) will be taking ${eventDetails.childName || 'your child'} to ${eventDetails.title || 'this birthday party'}?`,
      priority: 'high',
      options: (familyMembers) => 
        familyMembers
          .filter(m => m.role === 'parent')
          .map(p => ({ id: p.id, name: p.name }))
          .concat({ id: 'both', name: 'Both parents' })
    },
    {
      id: 'gift',
      text: (eventDetails) => 
        `Do you need to buy a gift for ${eventDetails.title || 'this birthday party'}?`,
      priority: 'high',
      options: () => [
        { id: 'yes', name: 'Yes, remind me to buy a gift' },
        { id: 'no', name: 'No gift needed' }
      ],
      followUp: {
        conditionField: 'gift',
        conditionValue: 'yes',
        question: {
          id: 'gift_reminder',
          text: 'When would you like to be reminded to buy a gift?',
          options: () => [
            { id: 'day_before', name: 'Day before the event' },
            { id: 'three_days', name: '3 days before' },
            { id: 'week_before', name: 'A week before' }
          ]
        }
      }
    },
    {
      id: 'special_items',
      text: (eventDetails) =>
        `Does ${eventDetails.childName || 'your child'} need to wear something specific or bring anything special to this event?`,
      priority: 'medium',
      options: () => [
        { id: 'yes', name: 'Yes, I need to note special requirements' },
        { id: 'no', name: 'Nothing special needed' }
      ],
      followUp: {
        conditionField: 'special_items',
        conditionValue: 'yes',
        freeform: true,
        question: {
          id: 'special_items_details',
          text: (eventDetails) => 
            `What specific items or clothing does ${eventDetails.childName || 'your child'} need to bring?`
        }
      }
    },
    {
      id: 'allergies',
      text: (eventDetails) =>
        `Does ${eventDetails.childName || 'your child'} have any allergies or dietary restrictions we should note for this party?`,
      priority: 'medium',
      options: () => [
        { id: 'yes', name: 'Yes, there are allergies to note' },
        { id: 'no', name: 'No allergies or restrictions' }
      ],
      followUp: {
        conditionField: 'allergies',
        conditionValue: 'yes',
        freeform: true,
        question: {
          id: 'allergy_details',
          text: 'What allergies or dietary restrictions should be noted?'
        }
      }
    },
    {
      id: 'rsvp',
      text: 'Would you like a reminder to RSVP for this event?',
      applicable: (eventDetails) => 
        eventDetails.rsvpDeadline || eventDetails.rsvpContact,
      priority: 'medium',
      options: () => [
        { id: 'yes', name: 'Yes, remind me to RSVP' },
        { id: 'no', name: 'No need, I\'ll handle it' }
      ],
      followUp: {
        conditionField: 'rsvp',
        conditionValue: 'yes',
        question: {
          id: 'rsvp_timing',
          text: 'When would you like to be reminded to RSVP?',
          options: () => [
            { id: 'today', name: 'Today' },
            { id: 'tomorrow', name: 'Tomorrow' },
            { id: 'three_days', name: 'In 3 days' }
          ]
        }
      }
    }
  ],
  
  // Customized summary template specific to birthday parties
  summaryTemplate: (eventDetails) => {
    let summary = `✅ Great! I've set up the birthday party for **${eventDetails.title}** in your calendar.\n\n`;
    
    // Core event details
    summary += `**When**: ${formatDate(eventDetails.dateTime)} at ${formatTime(eventDetails.dateTime)}`;
    if (eventDetails.endDateTime) {
      summary += ` - ${formatTime(eventDetails.endDateTime)}`;
    }
    summary += '\n';
    
    // Attendance information
    if (eventDetails.attendingParentNames) {
      summary += `**Who's going**: ${eventDetails.attendingParentNames} with ${eventDetails.childName || 'your child'}\n`;
    }
    
    // Location with map link
    if (eventDetails.location) {
      summary += `**Location**: ${eventDetails.location}\n`;
      if (!eventDetails.location.includes('http') && 
          !eventDetails.location.includes('www.') &&
          !eventDetails.location.toLowerCase().includes('zoom')) {
        summary += `[View on Google Maps](https://maps.google.com/?q=${encodeURIComponent(eventDetails.location)})\n`;
      }
    }
    
    // Host information
    if (eventDetails.hostName) {
      summary += `**Host**: ${eventDetails.hostName}\n`;
    }
    
    // RSVP details
    if (eventDetails.rsvpDeadline || eventDetails.rsvpContact) {
      summary += `**RSVP**: `;
      if (eventDetails.rsvpDeadline) {
        summary += `By ${formatDate(eventDetails.rsvpDeadline)} `;
      }
      if (eventDetails.rsvpContact) {
        summary += `to ${eventDetails.rsvpContact}`;
      }
      summary += '\n';
    }
    
    // Gift information
    if (eventDetails.needsGift === true) {
      let giftTimingText = '';
      if (eventDetails.giftReminderType === 'day_before') {
        giftTimingText = ' (reminder set for the day before)';
      } else if (eventDetails.giftReminderType === 'three_days') {
        giftTimingText = ' (reminder set for 3 days before)';
      } else if (eventDetails.giftReminderType === 'week_before') {
        giftTimingText = ' (reminder set for a week before)';
      } else {
        giftTimingText = ' (reminder added to your tasks)';
      }
      
      summary += `**Gift**: Remember to buy a gift${giftTimingText}\n`;
    } else if (eventDetails.needsGift === false) {
      summary += `**Gift**: No gift needed\n`;
    }
    
    // Special items
    if (eventDetails.specialItems && eventDetails.specialItems !== false) {
      summary += `**Special items**: ${eventDetails.specialItems}\n`;
    }
    
    // Allergies
    if (eventDetails.allergies && eventDetails.allergies !== false) {
      summary += `**Allergies/Diet**: ${eventDetails.allergies}\n`;
    }
    
    // Contact information
    if (eventDetails.contactInfo) {
      summary += `**Contact**: ${eventDetails.contactInfo}\n`;
    }
    
    // Translation note if applicable
    if (eventDetails.originalLanguage && eventDetails.originalLanguage.toLowerCase() !== 'english') {
      summary += `\n_Note: The original invitation was in ${eventDetails.originalLanguage}._\n`;
    }
    
    // Final note
    summary += `\nYou can find all these details in your family calendar. Is there anything else about this birthday party you'd like me to help with?`;
    
    return summary;
  }
};

// Doctor's appointment template
const doctorAppointmentTemplate = {
  eventType: 'doctor_appointment',
  detectionKeywords: ['doctor', 'dr.', 'medical', 'appointment', 'check-up', 'checkup', 'pediatric', 'clinic', 'hospital'],
  
  additionalFields: [
    'doctorName',
    'medicalFacility',
    'appointmentType',
    'insuranceRequired',
    'preparationInstructions',
    'followUpNeeded'
  ],
  
  questions: [
    {
      id: 'attendees',
      text: (eventDetails) => 
        `Which parent will accompany ${eventDetails.childName || 'your child'} to this ${eventDetails.appointmentType || 'medical'} appointment?`,
      priority: 'high',
      options: (familyMembers) => 
        familyMembers
          .filter(m => m.role === 'parent')
          .map(p => ({ id: p.id, name: p.name }))
          .concat({ id: 'both', name: 'Both parents' })
    },
    {
      id: 'documents',
      text: 'What documents do you need to bring to this appointment?',
      priority: 'high',
      multiSelect: true,
      options: () => [
        { id: 'insurance_card', name: 'Insurance card' },
        { id: 'id', name: 'ID/Driver\'s license' },
        { id: 'medical_records', name: 'Medical records' },
        { id: 'vaccination_records', name: 'Vaccination records' },
        { id: 'referral', name: 'Referral documents' },
        { id: 'previous_tests', name: 'Previous test results' },
        { id: 'medication_list', name: 'Current medications list' },
        { id: 'other', name: 'Other documents' }
      ],
      followUp: {
        conditionField: 'documents',
        conditionValue: 'other',
        freeform: true,
        question: {
          id: 'other_documents',
          text: 'What other documents do you need to bring?'
        }
      }
    },
    {
      id: 'preparation',
      text: 'Are there any special preparations needed for this appointment?',
      priority: 'medium',
      options: () => [
        { id: 'yes', name: 'Yes, there are preparations' },
        { id: 'no', name: 'No special preparations' }
      ],
      followUp: {
        conditionField: 'preparation',
        conditionValue: 'yes',
        freeform: true,
        question: {
          id: 'preparation_details',
          text: 'What preparations are needed for this appointment?'
        }
      }
    },
    {
      id: 'arrival_time',
      text: 'How early should you arrive before the scheduled appointment time?',
      priority: 'medium',
      options: () => [
        { id: '10min', name: '10 minutes early' },
        { id: '15min', name: '15 minutes early' },
        { id: '30min', name: '30 minutes early' },
        { id: 'other', name: 'Other timing' }
      ],
      followUp: {
        conditionField: 'arrival_time',
        conditionValue: 'other',
        freeform: true,
        question: {
          id: 'arrival_time_custom',
          text: 'How early should you arrive?'
        }
      }
    },
    {
      id: 'questions',
      text: 'Would you like to prepare questions for the doctor in advance?',
      priority: 'low',
      options: () => [
        { id: 'yes', name: 'Yes, I want to add questions' },
        { id: 'no', name: 'No, not needed' }
      ],
      followUp: {
        conditionField: 'questions',
        conditionValue: 'yes',
        freeform: true,
        question: {
          id: 'questions_list',
          text: 'What questions would you like to remember to ask the doctor?'
        }
      }
    }
  ],
  
  // Customized summary template for medical appointments
  summaryTemplate: (eventDetails) => {
    let summary = `✅ I've scheduled the ${eventDetails.appointmentType || 'medical'} appointment with ${eventDetails.doctorName || 'the doctor'} in your calendar.\n\n`;
    
    // Core event details
    summary += `**When**: ${formatDate(eventDetails.dateTime)} at ${formatTime(eventDetails.dateTime)}\n`;
    
    // Arrival time
    const arrivalMap = {
      '10min': '10 minutes early',
      '15min': '15 minutes early',
      '30min': '30 minutes early'
    };
    const arrivalTime = eventDetails.arrival_time_custom || arrivalMap[eventDetails.arrival_time] || '15 minutes early';
    summary += `**Arrival**: ${arrivalTime} (${calculateArrivalTime(eventDetails.dateTime, arrivalTime)})\n`;
    
    // Attendance information
    if (eventDetails.attendingParentNames) {
      summary += `**Who's going**: ${eventDetails.attendingParentNames} with ${eventDetails.childName || 'your child'}\n`;
    }
    
    // Location information
    if (eventDetails.location || eventDetails.medicalFacility) {
      summary += `**Location**: ${eventDetails.medicalFacility || eventDetails.location}\n`;
      if (eventDetails.location && !eventDetails.location.includes('http') && !eventDetails.location.includes('www.')) {
        summary += `[View on Google Maps](https://maps.google.com/?q=${encodeURIComponent(eventDetails.location)})\n`;
      }
    }
    
    // Documents to bring
    if (eventDetails.documents && eventDetails.documents.length > 0) {
      summary += '**Bring**:\n';
      const documentMap = {
        'insurance_card': 'Insurance card',
        'id': 'ID/Driver\'s license',
        'medical_records': 'Medical records',
        'vaccination_records': 'Vaccination records',
        'referral': 'Referral documents',
        'previous_tests': 'Previous test results',
        'medication_list': 'Current medications list'
      };
      
      eventDetails.documents.forEach(doc => {
        summary += `- ${documentMap[doc] || doc}\n`;
      });
      
      if (eventDetails.other_documents) {
        summary += `- ${eventDetails.other_documents}\n`;
      }
    }
    
    // Preparation instructions
    if (eventDetails.preparation_details || eventDetails.preparationInstructions) {
      summary += `**Preparation**: ${eventDetails.preparation_details || eventDetails.preparationInstructions}\n`;
    }
    
    // Questions for the doctor
    if (eventDetails.questions_list) {
      summary += '**Questions to ask**:\n';
      const questions = eventDetails.questions_list.split('\n');
      questions.forEach((q, i) => {
        if (q.trim()) {
          summary += `${i+1}. ${q.trim()}\n`;
        }
      });
    }
    
    // Final notes
    summary += `\nThe appointment details have been added to your family calendar with appropriate reminders. Do you need any other information about this medical appointment?`;
    
    return summary;
  }
};

// School event template
const schoolEventTemplate = {
  eventType: 'school_event',
  detectionKeywords: ['school', 'class', 'classroom', 'grade', 'teacher', 'concert', 'performance', 'conference', 'PTA'],
  
  additionalFields: [
    'teacher',
    'grade',
    'schoolName',
    'eventCategory', // 'performance', 'conference', 'meeting', etc.
    'dresscode',
    'audienceLimit'
  ],
  
  questions: [
    {
      id: 'attendees',
      text: (eventDetails) => {
        if (eventDetails.eventCategory === 'conference' || eventDetails.eventCategory === 'meeting') {
          return `Which parent(s) will attend this ${eventDetails.eventCategory || 'school event'}?`;
        } else {
          return `Which family members will attend this ${eventDetails.title || 'school event'}?`;
        }
      },
      priority: 'high',
      multiSelect: true,
      options: (familyMembers) => {
        // For performances, allow any family member
        const options = familyMembers.map(m => ({ id: m.id, name: m.name }));
        
        // Add combined options
        options.push({ id: 'both_parents', name: 'Both parents' });
        options.push({ id: 'whole_family', name: 'Whole family' });
        
        return options;
      }
    },
    {
      id: 'special_requirements',
      text: (eventDetails) => {
        if (eventDetails.eventCategory === 'performance') {
          return `Does ${eventDetails.childName || 'your child'} need to wear something specific or bring anything for this performance?`;
        } else {
          return 'Are there any special requirements for this event?';
        }
      },
      priority: 'high',
      options: () => [
        { id: 'yes', name: 'Yes, there are special requirements' },
        { id: 'no', name: 'No special requirements' }
      ],
      followUp: {
        conditionField: 'special_requirements',
        conditionValue: 'yes',
        freeform: true,
        question: {
          id: 'requirements_details',
          text: 'What are the special requirements?'
        }
      }
    },
    {
      id: 'arrival_time',
      text: (eventDetails) => {
        if (eventDetails.eventCategory === 'performance') {
          return `When does ${eventDetails.childName || 'your child'} need to arrive for this performance?`;
        } else {
          return 'What time should you arrive for this event?';
        }
      },
      priority: 'medium',
      options: (eventDetails) => {
        const baseTime = new Date(eventDetails.dateTime);
        
        // Calculate arrival time options based on event time
        const options = [];
        
        // 30 minutes before
        const thirtyMin = new Date(baseTime);
        thirtyMin.setMinutes(baseTime.getMinutes() - 30);
        options.push({ id: '30min', name: `30 minutes before (${formatTime(thirtyMin)})` });
        
        // 15 minutes before
        const fifteenMin = new Date(baseTime);
        fifteenMin.setMinutes(baseTime.getMinutes() - 15);
        options.push({ id: '15min', name: `15 minutes before (${formatTime(fifteenMin)})` });
        
        // Same time
        options.push({ id: 'same', name: `Same time (${formatTime(baseTime)})` });
        
        // Custom time
        options.push({ id: 'other', name: 'Other time' });
        
        return options;
      },
      followUp: {
        conditionField: 'arrival_time',
        conditionValue: 'other',
        freeform: true,
        question: {
          id: 'arrival_time_custom',
          text: 'What time should you arrive?'
        }
      }
    },
    {
      id: 'early_pickup',
      text: (eventDetails) => {
        if (eventDetails.eventCategory === 'performance' && eventDetails.childName) {
          return `Will ${eventDetails.childName} need to leave school early for this event?`;
        } else {
          return null; // Skip this question if not applicable
        }
      },
      applicable: (eventDetails) => 
        eventDetails.eventCategory === 'performance' && Boolean(eventDetails.childName),
      priority: 'medium',
      options: () => [
        { id: 'yes', name: 'Yes, early pickup needed' },
        { id: 'no', name: 'No early pickup needed' }
      ],
      followUp: {
        conditionField: 'early_pickup',
        conditionValue: 'yes',
        freeform: true,
        question: {
          id: 'pickup_time',
          text: 'What time do you need to pick them up from school?'
        }
      }
    }
  ],
  
  // Customized summary template for school events
  summaryTemplate: (eventDetails) => {
    const eventTypeName = eventDetails.eventCategory === 'performance' ? 'performance' :
                         eventDetails.eventCategory === 'conference' ? 'conference' :
                         'school event';
    
    let summary = `✅ I've added the ${eventDetails.title || eventTypeName} to your calendar.\n\n`;
    
    // Core event details
    summary += `**When**: ${formatDate(eventDetails.dateTime)} at ${formatTime(eventDetails.dateTime)}`;
    if (eventDetails.endDateTime) {
      summary += ` - ${formatTime(eventDetails.endDateTime)}`;
    }
    summary += '\n';
    
    // Arrival time
    let arrivalTimeText = '';
    if (eventDetails.arrival_time === 'same') {
      arrivalTimeText = `${formatTime(eventDetails.dateTime)} (same as event time)`;
    } else if (eventDetails.arrival_time === '15min') {
      const arrivalTime = new Date(new Date(eventDetails.dateTime).getTime() - 15 * 60000);
      arrivalTimeText = `${formatTime(arrivalTime)} (15 minutes early)`;
    } else if (eventDetails.arrival_time === '30min') {
      const arrivalTime = new Date(new Date(eventDetails.dateTime).getTime() - 30 * 60000);
      arrivalTimeText = `${formatTime(arrivalTime)} (30 minutes early)`;
    } else if (eventDetails.arrival_time_custom) {
      arrivalTimeText = eventDetails.arrival_time_custom;
    }
    
    if (arrivalTimeText) {
      summary += `**Arrival time**: ${arrivalTimeText}\n`;
    }
    
    // Early pickup information
    if (eventDetails.early_pickup === 'yes' && eventDetails.pickup_time) {
      summary += `**Early pickup**: ${eventDetails.pickup_time}\n`;
    }
    
    // Location information
    if (eventDetails.location || eventDetails.schoolName) {
      summary += `**Location**: ${eventDetails.location || eventDetails.schoolName}\n`;
      if (eventDetails.location && !eventDetails.location.includes('http') && !eventDetails.location.includes('www.')) {
        summary += `[View on Google Maps](https://maps.google.com/?q=${encodeURIComponent(eventDetails.location)})\n`;
      }
    }
    
    // Who's attending
    if (eventDetails.attendees) {
      let attendeeText = '';
      if (eventDetails.attendees.includes('whole_family')) {
        attendeeText = 'Whole family';
      } else if (eventDetails.attendees.includes('both_parents')) {
        attendeeText = 'Both parents';
        if (eventDetails.attendees.length > 1) {
          attendeeText += ' and ';
          const otherAttendees = eventDetails.attendees
            .filter(a => a !== 'both_parents')
            .map(a => {
              const member = (familyMembers || []).find(m => m.id === a);
              return member ? member.name : a;
            });
          attendeeText += otherAttendees.join(', ');
        }
      } else {
        attendeeText = eventDetails.attendees
          .map(a => {
            const member = (familyMembers || []).find(m => m.id === a);
            return member ? member.name : a;
          })
          .join(', ');
      }
      
      summary += `**Who's attending**: ${attendeeText}\n`;
    }
    
    // Special requirements
    if (eventDetails.requirements_details) {
      summary += `**Special requirements**: ${eventDetails.requirements_details}\n`;
    } else if (eventDetails.dresscode) {
      summary += `**Dress code**: ${eventDetails.dresscode}\n`;
    }
    
    // Teacher information
    if (eventDetails.teacher) {
      summary += `**Teacher**: ${eventDetails.teacher}\n`;
    }
    
    // Final notes
    summary += `\nAll details have been added to your family calendar with appropriate reminders. Is there anything else you need to know about this ${eventTypeName}?`;
    
    return summary;
  }
};

// Sports event template
const sportsEventTemplate = {
  eventType: 'sports_event',
  detectionKeywords: ['game', 'match', 'practice', 'soccer', 'football', 'baseball', 'basketball', 'hockey', 'swim', 'swimming', 'tournament', 'team'],
  
  additionalFields: [
    'sportType',
    'teamName',
    'opponent',
    'coachName',
    'coachContact',
    'isHome',
    'uniformRequired'
  ],
  
  questions: [
    {
      id: 'event_type',
      text: 'What type of sports event is this?',
      priority: 'high',
      options: () => [
        { id: 'game', name: 'Game/Match' },
        { id: 'practice', name: 'Practice' },
        { id: 'tournament', name: 'Tournament' },
        { id: 'tryout', name: 'Tryout' },
        { id: 'other', name: 'Other' }
      ],
      followUp: {
        conditionField: 'event_type',
        conditionValue: 'other',
        freeform: true,
        question: {
          id: 'event_type_custom',
          text: 'What type of sports event is this?'
        }
      }
    },
    {
      id: 'equipment',
      text: (eventDetails) => 
        `What equipment does ${eventDetails.childName || 'your child'} need to bring for this ${eventDetails.sportType || 'sports'} ${eventDetails.event_type || 'event'}?`,
      priority: 'high',
      multiSelect: true,
      customOptions: (eventDetails) => {
        // Provide sport-specific equipment options based on the sport type
        const sportType = (eventDetails.sportType || '').toLowerCase();
        
        if (sportType.includes('soccer')) {
          return [
            { id: 'cleats', name: 'Soccer cleats' },
            { id: 'shin_guards', name: 'Shin guards' },
            { id: 'uniform', name: 'Team uniform' },
            { id: 'water_bottle', name: 'Water bottle' },
            { id: 'soccer_ball', name: 'Soccer ball' },
            { id: 'jacket', name: 'Jacket/sweatshirt' },
            { id: 'other', name: 'Other items' }
          ];
        } else if (sportType.includes('swim')) {
          return [
            { id: 'swimsuit', name: 'Swimsuit' },
            { id: 'goggles', name: 'Goggles' },
            { id: 'swim_cap', name: 'Swim cap' },
            { id: 'towel', name: 'Towel' },
            { id: 'water_bottle', name: 'Water bottle' },
            { id: 'other', name: 'Other items' }
          ];
        } else if (sportType.includes('baseball')) {
          return [
            { id: 'glove', name: 'Baseball glove' },
            { id: 'bat', name: 'Baseball bat' },
            { id: 'helmet', name: 'Batting helmet' },
            { id: 'cleats', name: 'Cleats' },
            { id: 'uniform', name: 'Team uniform' },
            { id: 'water_bottle', name: 'Water bottle' },
            { id: 'other', name: 'Other items' }
          ];
        } else {
          // Generic equipment options
          return [
            { id: 'uniform', name: 'Team uniform' },
            { id: 'water_bottle', name: 'Water bottle' },
            { id: 'equipment_bag', name: 'Equipment bag' },
            { id: 'other', name: 'Other items' }
          ];
        }
      },
      followUp: {
        conditionField: 'equipment',
        conditionValue: 'other',
        freeform: true,
        question: {
          id: 'equipment_custom',
          text: 'What other items are needed?'
        }
      }
    },
    {
      id: 'transportation',
      text: (eventDetails) => 
        `Who will be taking ${eventDetails.childName || 'your child'} to this ${eventDetails.sportType || 'sports'} ${eventDetails.event_type || 'event'}?`,
      priority: 'high',
      options: (familyMembers) => [
        ...familyMembers
          .filter(m => m.role === 'parent')
          .map(p => ({ id: p.id, name: p.name })),
        { id: 'both_parents', name: 'Both parents' },
        { id: 'carpool', name: 'Carpool with other family' }
      ],
      followUp: {
        conditionField: 'transportation',
        conditionValue: 'carpool',
        freeform: true,
        question: {
          id: 'carpool_details',
          text: 'What are the carpool arrangements?'
        }
      }
    },
    {
      id: 'arrival_time',
      text: 'How early should you arrive before the scheduled start time?',
      priority: 'medium',
      options: (eventDetails) => {
        const eventType = eventDetails.event_type || '';
        // For games, suggest arriving earlier than for practices
        if (eventType === 'game' || eventType === 'tournament') {
          return [
            { id: '45min', name: '45 minutes early' },
            { id: '30min', name: '30 minutes early' },
            { id: '15min', name: '15 minutes early' },
            { id: 'other', name: 'Other timing' }
          ];
        } else {
          return [
            { id: '15min', name: '15 minutes early' },
            { id: '10min', name: '10 minutes early' },
            { id: '5min', name: '5 minutes early' },
            { id: 'other', name: 'Other timing' }
          ];
        }
      },
      followUp: {
        conditionField: 'arrival_time',
        conditionValue: 'other',
        freeform: true,
        question: {
          id: 'arrival_time_custom',
          text: 'How early should you arrive?'
        }
      }
    },
    {
      id: 'spectators',
      text: 'Will other family members be attending to watch?',
      applicable: (eventDetails) => 
        eventDetails.event_type === 'game' || 
        eventDetails.event_type === 'tournament',
      priority: 'low',
      options: () => [
        { id: 'yes', name: 'Yes, others will attend' },
        { id: 'no', name: 'No, just the driver' }
      ],
      followUp: {
        conditionField: 'spectators',
        conditionValue: 'yes',
        question: {
          id: 'spectator_list',
          text: 'Who else will be attending?',
          multiSelect: true,
          options: (familyMembers, eventDetails) => {
            // Filter out the already selected transportation person
            return familyMembers
              .filter(m => m.id !== eventDetails.transportation && m.id !== 'carpool')
              .map(m => ({ id: m.id, name: m.name }));
          }
        }
      }
    }
  ],
  
  // Customized summary template for sports events
  summaryTemplate: (eventDetails) => {
    const sportName = eventDetails.sportType || 'sports';
    const eventTypeName = eventDetails.event_type === 'game' ? 'game' :
                         eventDetails.event_type === 'practice' ? 'practice' :
                         eventDetails.event_type === 'tournament' ? 'tournament' :
                         eventDetails.event_type === 'tryout' ? 'tryout' :
                         eventDetails.event_type_custom || 'event';
    
    let summary = `✅ I've added the ${sportName} ${eventTypeName} to your calendar.\n\n`;
    
    // Core event details
    summary += `**When**: ${formatDate(eventDetails.dateTime)} at ${formatTime(eventDetails.dateTime)}`;
    if (eventDetails.endDateTime) {
      summary += ` - ${formatTime(eventDetails.endDateTime)}`;
    }
    summary += '\n';
    
    // Team details
    if (eventDetails.teamName) {
      summary += `**Team**: ${eventDetails.teamName}`;
      if (eventDetails.opponent && (eventDetails.event_type === 'game' || eventDetails.event_type === 'tournament')) {
        summary += ` vs. ${eventDetails.opponent}`;
      }
      summary += '\n';
    }
    
    // Arrival time
    const arrivalMap = {
      '5min': '5 minutes early',
      '10min': '10 minutes early',
      '15min': '15 minutes early',
      '30min': '30 minutes early',
      '45min': '45 minutes early'
    };
    const arrivalTime = eventDetails.arrival_time_custom || arrivalMap[eventDetails.arrival_time] || '15 minutes early';
    summary += `**Arrival**: ${arrivalTime} (${calculateArrivalTime(eventDetails.dateTime, arrivalTime)})\n`;
    
    // Location information
    if (eventDetails.location) {
      summary += `**Location**: ${eventDetails.location}\n`;
      if (!eventDetails.location.includes('http') && !eventDetails.location.includes('www.')) {
        summary += `[View on Google Maps](https://maps.google.com/?q=${encodeURIComponent(eventDetails.location)})\n`;
      }
    }
    
    // Transportation
    let transportationText = '';
    if (eventDetails.transportation === 'both_parents') {
      transportationText = 'Both parents';
    } else if (eventDetails.transportation === 'carpool') {
      transportationText = `Carpool${eventDetails.carpool_details ? ': ' + eventDetails.carpool_details : ''}`;
    } else {
      const parent = (familyMembers || []).find(m => m.id === eventDetails.transportation);
      transportationText = parent ? parent.name : eventDetails.transportation;
    }
    
    if (transportationText) {
      summary += `**Transportation**: ${transportationText}\n`;
    }
    
    // Equipment needed
    if (eventDetails.equipment && eventDetails.equipment.length > 0) {
      summary += '**Equipment needed**:\n';
      
      // Create a map of equipment IDs to display names
      const equipmentMap = {};
      const customOptions = sportsEventTemplate.questions.find(q => q.id === 'equipment').customOptions(eventDetails);
      customOptions.forEach(opt => {
        equipmentMap[opt.id] = opt.name;
      });
      
      // List each equipment item
      eventDetails.equipment.forEach(item => {
        if (item !== 'other') {
          summary += `- ${equipmentMap[item] || item}\n`;
        }
      });
      
      // Add custom equipment if specified
      if (eventDetails.equipment_custom) {
        summary += `- ${eventDetails.equipment_custom}\n`;
      }
    }
    
    // Coach information
    if (eventDetails.coachName) {
      summary += `**Coach**: ${eventDetails.coachName}`;
      if (eventDetails.coachContact) {
        summary += ` (${eventDetails.coachContact})`;
      }
      summary += '\n';
    }
    
    // Spectators
    if (eventDetails.spectators === 'yes' && eventDetails.spectator_list && eventDetails.spectator_list.length > 0) {
      const spectatorNames = eventDetails.spectator_list.map(id => {
        const member = (familyMembers || []).find(m => m.id === id);
        return member ? member.name : id;
      }).join(', ');
      
      summary += `**Also attending**: ${spectatorNames}\n`;
    }
    
    // Final notes
    summary += `\nAll details have been added to your family calendar with appropriate reminders. I've set a reminder for ${arrivalTime} with a checklist of items to bring. Is there anything else you need to know about this ${sportName} ${eventTypeName}?`;
    
    return summary;
  }
};

// Helper functions for the templates
function formatDate(dateString) {
  if (!dateString) return 'unknown date';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'unknown date';
  
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

function calculateArrivalTime(dateString, arrivalDescription) {
  if (!dateString) return 'unknown time';
  
  const eventTime = new Date(dateString);
  if (isNaN(eventTime.getTime())) return 'unknown time';
  
  // Parse the arrival description
  let minutesEarly = 15; // Default
  
  if (arrivalDescription.includes('45 minute')) {
    minutesEarly = 45;
  } else if (arrivalDescription.includes('30 minute')) {
    minutesEarly = 30;
  } else if (arrivalDescription.includes('15 minute')) {
    minutesEarly = 15;
  } else if (arrivalDescription.includes('10 minute')) {
    minutesEarly = 10;
  } else if (arrivalDescription.includes('5 minute')) {
    minutesEarly = 5;
  }
  
  // Calculate arrival time
  const arrivalTime = new Date(eventTime);
  arrivalTime.setMinutes(eventTime.getMinutes() - minutesEarly);
  
  return arrivalTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
}

// Export the conversation templates
export const eventTemplates = {
  birthdayPartyTemplate,
  doctorAppointmentTemplate,
  schoolEventTemplate,
  sportsEventTemplate,
  // Add more templates as they are developed
};

// Template selection function
export function detectEventType(eventDetails) {
  // Extract text content for keyword matching
  const textContent = [
    eventDetails.title || '',
    eventDetails.description || '',
    eventDetails.location || '',
    eventDetails.originalText || ''
  ].join(' ').toLowerCase();
  
  // Create a scoring system for each template type
  const scores = {};
  
  // Check each template's keywords
  for (const [templateId, template] of Object.entries(eventTemplates)) {
    scores[templateId] = 0;
    
    // Check for keyword matches
    for (const keyword of template.detectionKeywords) {
      if (textContent.includes(keyword.toLowerCase())) {
        scores[templateId] += 1;
      }
    }
    
    // Check for specific field matches
    for (const field of template.additionalFields || []) {
      if (eventDetails[field]) {
        scores[templateId] += 2; // Fields are stronger indicators than keywords
      }
    }
  }
  
  // Get the template with the highest score
  let bestMatch = null;
  let highestScore = 0;
  
  for (const [templateId, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestMatch = templateId;
    }
  }
  
  // If score is too low, use a default template
  if (highestScore < 2) {
    return 'default';
  }
  
  return bestMatch;
}

// Function to generate questions for a specific event
export function generateQuestions(eventDetails, familyMembers, adaptationParams = null) {
  // Detect the event type
  const eventType = detectEventType(eventDetails);
  const template = eventTemplates[eventType] || baseTemplate;
  
  // Combine common questions with template-specific questions
  let allQuestions = [...baseTemplate.commonQuestions];
  
  if (template.questions) {
    allQuestions = [...allQuestions, ...template.questions];
  }
  
  // Filter questions by applicability
  allQuestions = allQuestions.filter(question => {
    // Skip if the question has no text
    if (typeof question.text === 'function') {
      const questionText = question.text(eventDetails);
      if (!questionText) return false;
    } else if (!question.text) {
      return false;
    }
    
    // Check if the question is applicable to this event
    if (typeof question.applicable === 'function') {
      return question.applicable(eventDetails);
    }
    
    return true;
  });
  
  // Process question text that might be functions
  allQuestions = allQuestions.map(question => {
    const processedQuestion = {...question};
    
    // Process text if it's a function
    if (typeof question.text === 'function') {
      processedQuestion.text = question.text(eventDetails);
    }
    
    // Process options if they're a function
    if (typeof question.options === 'function') {
      processedQuestion.options = question.options(familyMembers, eventDetails);
    } else if (typeof question.customOptions === 'function') {
      processedQuestion.options = question.customOptions(eventDetails);
    }
    
    // Process follow-up questions the same way
    if (question.followUp) {
      const followUp = {...question.followUp};
      
      if (followUp.question) {
        const processedFollowUp = {...followUp.question};
        
        if (typeof followUp.question.text === 'function') {
          processedFollowUp.text = followUp.question.text(eventDetails);
        }
        
        if (typeof followUp.question.options === 'function') {
          processedFollowUp.options = followUp.question.options(familyMembers, eventDetails);
        }
        
        followUp.question = processedFollowUp;
      }
      
      processedQuestion.followUp = followUp;
    }
    
    return processedQuestion;
  });
  
  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  allQuestions.sort((a, b) => {
    const priorityA = priorityOrder[a.priority || 'medium'] || 1;
    const priorityB = priorityOrder[b.priority || 'medium'] || 1;
    return priorityA - priorityB;
  });
  
  // Apply feedback-based adaptations if provided
  if (adaptationParams) {
    allQuestions = applyAdaptations(allQuestions, adaptationParams, eventType);
  }
  
  return {
    questions: allQuestions,
    eventType,
    template
  };
}

// Helper function to apply adaptations based on feedback
function applyAdaptations(questions, adaptationParams, eventType) {
  // Create a copy of the questions to avoid mutating the originals
  let adaptedQuestions = [...questions];
  
  // Apply question count adaptation
  if (adaptationParams.questionCount === 'fewer') {
    // Keep only essential questions and high priority ones
    adaptedQuestions = adaptedQuestions.filter(q => 
      q.essential || q.priority === 'high' || q.id === 'title' || q.id === 'dateTime'
    );
    
    // Include some medium priority questions if they're relevant to this event type
    const mediumQuestions = questions.filter(q => 
      !adaptedQuestions.includes(q) && 
      q.priority === 'medium' && 
      (q.relevantTo?.includes(eventType) || !q.relevantTo)
    );
    
    // Add up to 2 medium priority questions
    adaptedQuestions = [...adaptedQuestions, ...mediumQuestions.slice(0, 2)];
  } else if (adaptationParams.questionCount === 'more') {
    // Keep all questions, in the original order (already handled by returning all questions)
  }
  
  // Apply detail level adaptation
  adaptedQuestions = adaptedQuestions.map(question => {
    const adaptedQuestion = { ...question };
    
    if (adaptationParams.detailLevel === 'simpler') {
      // Simplify question text if a simpler version is available
      if (adaptedQuestion.simplifiedText) {
        adaptedQuestion.text = adaptedQuestion.simplifiedText;
      }
      
      // Simplify options if available
      if (adaptedQuestion.options && adaptedQuestion.simplifiedOptions) {
        adaptedQuestion.options = adaptedQuestion.simplifiedOptions;
      }
    } else if (adaptationParams.detailLevel === 'detailed') {
      // Use more detailed question text if available
      if (adaptedQuestion.detailedText) {
        adaptedQuestion.text = adaptedQuestion.detailedText;
      }
    }
    
    return adaptedQuestion;
  });
  
  // Apply focus areas prioritization
  if (adaptationParams.focusAreas.length > 0) {
    // Helper function to check if a question relates to a focus area
    const isQuestionInFocusArea = (question) => {
      const questionText = (question.text || '').toLowerCase();
      return adaptationParams.focusAreas.some(area => 
        questionText.includes(area.toLowerCase()) || 
        (question.topics && question.topics.some(t => t.toLowerCase() === area.toLowerCase()))
      );
    };
    
    // Prioritize questions that relate to focus areas
    adaptedQuestions.sort((a, b) => {
      const aIsFocus = isQuestionInFocusArea(a);
      const bIsFocus = isQuestionInFocusArea(b);
      
      if (aIsFocus && !bIsFocus) return -1;
      if (!aIsFocus && bIsFocus) return 1;
      
      // If both or neither are in focus, maintain the original priority order
      const priorityA = { high: 0, medium: 1, low: 2 }[a.priority || 'medium'] || 1;
      const priorityB = { high: 0, medium: 1, low: 2 }[b.priority || 'medium'] || 1;
      return priorityA - priorityB;
    });
  }
  
  // Apply avoid areas filtering
  if (adaptationParams.avoidAreas.length > 0) {
    // Helper function to check if a question relates to an avoid area
    const isQuestionInAvoidArea = (question) => {
      const questionText = (question.text || '').toLowerCase();
      return adaptationParams.avoidAreas.some(area => 
        questionText.includes(area.toLowerCase()) || 
        (question.topics && question.topics.some(t => t.toLowerCase() === area.toLowerCase()))
      );
    };
    
    // De-prioritize questions that relate to avoid areas (move them to the end)
    // but keep essential ones
    const avoidQuestions = adaptedQuestions.filter(q => isQuestionInAvoidArea(q) && !q.essential);
    const otherQuestions = adaptedQuestions.filter(q => !isQuestionInAvoidArea(q) || q.essential);
    
    adaptedQuestions = [...otherQuestions, ...avoidQuestions];
  }
  
  return adaptedQuestions;
}

// Function to generate a summary for a specific event
export function generateSummary(eventDetails, eventType, familyMembers) {
  // Get the appropriate template
  const templateKey = eventType || detectEventType(eventDetails);
  const template = eventTemplates[templateKey];
  
  if (template && template.summaryTemplate) {
    // Use the template's custom summary function
    return template.summaryTemplate(eventDetails, familyMembers);
  }
  
  // Fallback to a generic summary
  let summary = `✅ I've added ${eventDetails.title || 'the event'} to your calendar.\n\n`;
  
  // Core event details
  summary += `**When**: ${formatDate(eventDetails.dateTime)} at ${formatTime(eventDetails.dateTime)}`;
  if (eventDetails.endDateTime) {
    summary += ` - ${formatTime(eventDetails.endDateTime)}`;
  }
  summary += '\n';
  
  // Location 
  if (eventDetails.location) {
    summary += `**Location**: ${eventDetails.location}\n`;
    if (!eventDetails.location.includes('http') && !eventDetails.location.includes('www.')) {
      summary += `[View on Google Maps](https://maps.google.com/?q=${encodeURIComponent(eventDetails.location)})\n`;
    }
  }
  
  // Description
  if (eventDetails.description) {
    summary += `**Details**: ${eventDetails.description}\n`;
  }
  
  // Final note
  summary += `\nThe event has been added to your family calendar. Is there anything else you'd like to know about this event?`;
  
  return summary;
}

export default {
  baseTemplate,
  eventTemplates,
  detectEventType,
  generateQuestions,
  generateSummary
};