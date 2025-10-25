#!/usr/bin/env node
/**
 * LillianAgent - Oldest child (14 years old)
 *
 * Key Traits:
 * - Independent and helpful (after transformation)
 * - Busy with school and volleyball
 * - Initially skeptical of Allie → becomes engaged user
 * - Develops plant care habit
 * - Starts helping with younger siblings
 */

const ChildAgent = require('./ChildAgent');

class LillianAgent extends ChildAgent {
  constructor(userId) {
    super({
      userId: userId,
      name: 'Lillian',
      age: 14,

      personality: {
        helpfulness: 0.65,    // Grows to 0.85
        curiosity: 0.60,      // Moderate
        independence: 0.80    // High
      },

      activities: [
        { type: 'sport', name: 'Volleyball', frequency: '2x/week', day1: 2, day2: 4, time: '16:00' },
        { type: 'social', name: 'Friends', frequency: 'weekends' },
        { type: 'school', name: 'Homework', frequency: 'daily', duration: 90 }
      ],

      choreHabits: [
        { title: 'Water plants', schedule: 'daily', startHour: 17, endHour: 19, duration: 5 }
      ],

      interests: [
        'volleyball',
        'plants',
        'music',
        'friends',
        'reading'
      ],

      school: {
        grade: '9th Grade',
        gpa: 3.7,
        subjects: ['English', 'Algebra II', 'Biology', 'History', 'Spanish']
      }
    });

    // Lillian-specific traits
    this.allieSkepticism = 0.70; // Initially skeptical (70%), decreases to 0.10
    this.socialPriority = 0.85;  // Friends are very important
    this.academicFocus = 0.80;   // School is important

    // Growth arc
    this.transformationArc = {
      chaos: 'Minimal participation, focused on own activities',
      discovery: 'Curious about Allie, still skeptical',
      integration: 'Starts using Allie for homework help',
      balanced: 'Plant care habit established, helps with siblings',
      thriving: 'Independent & Helpful - family contributor'
    };
  }

  /**
   * Lillian's reaction to Allie (skeptical → engaged)
   */
  async respondToAllie(suggestion) {
    // Skepticism decreases over time
    const baseResponse = await super.respondToSuggestion(suggestion);

    if (this.transformationPhase === 'chaos' || this.transformationPhase === 'discovery') {
      // Initially skeptical
      if (Math.random() < this.allieSkepticism) {
        return {
          accepted: false,
          confidence: 0.3,
          reasoning: 'Not sure about this AI thing',
          responseText: this.age === 14 ? 'I guess...' : 'Do I have to?'
        };
      }
    }

    // After integration phase, becomes engaged
    return baseResponse;
  }

  /**
   * Generate Lillian's typical week
   */
  generateWeeklySchedule() {
    return {
      monday: [
        { time: '07:00', activity: 'Get ready for school' },
        { time: '08:00-15:00', activity: 'School' },
        { time: '16:00-18:00', activity: 'Homework' },
        { time: '17:30', activity: 'Water plants' }
      ],
      tuesday: [
        { time: '08:00-15:00', activity: 'School' },
        { time: '16:00-17:30', activity: 'Volleyball practice' },
        { time: '18:00-19:00', activity: 'Homework' }
      ],
      wednesday: [
        { time: '08:00-15:00', activity: 'School' },
        { time: '16:00-18:00', activity: 'Homework / Friends' },
        { time: '17:30', activity: 'Water plants' }
      ],
      thursday: [
        { time: '08:00-15:00', activity: 'School' },
        { time: '16:00-17:30', activity: 'Volleyball practice' },
        { time: '18:00-19:00', activity: 'Homework' }
      ],
      friday: [
        { time: '08:00-15:00', activity: 'School' },
        { time: '16:00-20:00', activity: 'Social time' }
      ],
      saturday: [
        { time: '10:00-12:00', activity: 'Volleyball games (sometimes)' },
        { time: '14:00-18:00', activity: 'Friends' }
      ],
      sunday: [
        { time: '10:00-12:00', activity: 'Family time' },
        { time: '14:00-17:00', activity: 'Homework / Reading' },
        { time: '17:30', activity: 'Water plants' }
      ]
    };
  }

  /**
   * Lillian's transformation phases
   */
  advancePhase(newPhase) {
    super.advancePhase(newPhase);

    switch (newPhase) {
      case 'discovery':
        this.allieSkepticism = 0.50; // Still skeptical but curious
        console.log(`🤔 Lillian: "Okay, maybe Allie isn't totally useless..."`);
        break;

      case 'integration':
        this.allieSkepticism = 0.25;
        this.personality.helpfulness = 0.75;
        // Starts asking Allie for homework help
        console.log(`📱 Lillian: Using Allie for study planning`);
        break;

      case 'balanced':
        this.allieSkepticism = 0.10;
        this.personality.helpfulness = 0.85;
        // Plant care habit fully established
        // Starts helping with younger siblings
        console.log(`🌱 Lillian: Plant care habit established, helps with Oly and Tegner`);
        break;

      case 'thriving':
        this.allieSkepticism = 0.05;
        this.personality.helpfulness = 0.90;
        console.log(`⭐ Lillian: "Independent & Helpful" - family contributor`);
        break;
    }
  }

  /**
   * Lillian asking Allie for help (teen style)
   */
  async askAllieQuestion(topic) {
    const questions = {
      homework: [
        'Can you help me organize my study schedule for finals?',
        'What\'s the best way to remember all these biology terms?',
        'I need to finish an essay by Friday, help me plan it out'
      ],
      plants: [
        'How often should I water the succulents?',
        'My fern is looking droopy, what should I do?',
        'What plants would be good for my room?'
      ],
      volleyball: [
        'What should I eat before volleyball practice?',
        'I want to improve my serves, any tips on practice routines?'
      ],
      friends: [
        'I need gift ideas for Emma\'s birthday',
        'What are some fun things to do with friends this weekend?'
      ]
    };

    const topicQuestions = questions[topic] || ['What should I do?'];
    const question = topicQuestions[Math.floor(Math.random() * topicQuestions.length)];

    return {
      question: question,
      topic: topic,
      responseStyle: 'teen', // Thoughtful, medium-length responses
      attentionSpan: 45, // Minutes
      engagement: 1.0 - this.allieSkepticism
    };
  }
}

module.exports = LillianAgent;
