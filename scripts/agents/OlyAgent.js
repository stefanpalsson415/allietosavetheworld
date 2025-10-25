#!/usr/bin/env node
/**
 * OlyAgent - Middle child (11 years old)
 *
 * Key Traits:
 * - Wants to help but doesn't always know how
 * - Science-oriented (science club, experiments)
 * - Curious and asks lots of questions
 * - Social (birthday parties, playdates)
 * - Develops study time habit with Allie's help
 */

const ChildAgent = require('./ChildAgent');

class OlyAgent extends ChildAgent {
  constructor(userId) {
    super({
      userId: userId,
      name: 'Oly',
      age: 11,

      personality: {
        helpfulness: 0.70,    // Wants to help! (grows to 0.85)
        curiosity: 0.90,      // Very curious
        initiative: 0.50      // Needs guidance (grows to 0.70)
      },

      activities: [
        { type: 'academic', name: 'Science club', frequency: 'weekly', day: 4, time: '15:30', location: 'library' },
        { type: 'hobby', name: 'Science experiments with Tegner', frequency: 'as_wanted' },
        { type: 'social', name: 'Birthday parties', frequency: 'occasional' }
      ],

      choreHabits: [
        { title: 'Study time', schedule: 'weekly', frequency: '4x/week', startHour: 16, endHour: 17, duration: 30 }
      ],

      interests: [
        'science',
        'experiments',
        'animals',
        'space',
        'building things',
        'friends'
      ],

      school: {
        grade: '6th Grade',
        subjects: ['Math', 'Science', 'English', 'Social Studies'],
        favorite: 'Science',
        strengths: ['Critical thinking', 'Curiosity', 'Problem-solving']
      }
    });

    // Oly-specific traits
    this.questionFrequency = 'very_high'; // Asks LOTS of questions
    this.scienceEnthusiasm = 0.95;
    this.helpfulness = 0.70; // Wants to help (grows to 0.85)

    // Social calendar
    this.upcomingParties = [
      { friendName: 'Jake', date: '2025-03-15', theme: 'cowboy', giftNeeded: true }
    ];

    // Growth arc
    this.transformationArc = {
      chaos: 'Eager to help but disorganized',
      discovery: 'Loves Allie\'s science experiment suggestions',
      integration: 'Study time habit forming',
      balanced: 'Consistent study routine, helps Tegner with experiments',
      thriving: 'Contributing & Proud - science mentor to Tegner'
    };
  }

  /**
   * Oly asks LOTS of questions
   */
  async askAllieQuestion(topic = null) {
    const scienceQuestions = [
      'Why is the sky blue?',
      'How do rockets work?',
      'What makes things glow in the dark?',
      'Can you help me plan a volcano experiment?',
      'What\'s the best way to grow crystals?',
      'How do animals see in the dark?',
      'Why do plants need sunlight?'
    ];

    const homeworkQuestions = [
      'Can you help me with this math problem?',
      'What\'s a good topic for my science project?',
      'How should I study for my test?'
    ];

    const activityQuestions = [
      'What should Tegner and I do for science experiment today?',
      'I\'m bored, what activities haven\'t I tried?',
      'What should I practice before science club?'
    ];

    const allQuestions = topic === 'science' ? scienceQuestions
      : topic === 'homework' ? homeworkQuestions
        : topic === 'activity' ? activityQuestions
          : [...scienceQuestions, ...homeworkQuestions, ...activityQuestions];

    const question = allQuestions[Math.floor(Math.random() * allQuestions.length)];

    return {
      question: question,
      topic: topic || 'science',
      responseStyle: 'tween', // Curious, short-medium responses
      attentionSpan: 33, // Minutes (age * 3)
      enthusiasm: this.scienceEnthusiasm,
      followUpQuestions: 2 // Always asks follow-ups!
    };
  }

  /**
   * Oly's response to Allie (enthusiastic!)
   */
  async respondToAllie(suggestion) {
    const baseResponse = await super.respondToSuggestion(suggestion);

    // Oly LOVES science-related suggestions
    if (suggestion.type === 'science_experiment' || suggestion.type === 'learning') {
      return {
        accepted: true,
        confidence: 0.95,
        reasoning: 'Science is awesome!',
        responseText: 'Yes! Can we do it now?',
        enthusiasm: 'very_high'
      };
    }

    return baseResponse;
  }

  /**
   * Generate Oly's typical week
   */
  generateWeeklySchedule() {
    return {
      monday: [
        { time: '07:30', activity: 'Get ready for school' },
        { time: '08:30-15:00', activity: 'School' },
        { time: '16:00-16:30', activity: 'Study time' },
        { time: '17:00-18:00', activity: 'Free play / experiments' }
      ],
      tuesday: [
        { time: '08:30-15:00', activity: 'School' },
        { time: '16:00-16:30', activity: 'Study time' },
        { time: '17:00-18:00', activity: 'Play with Tegner' }
      ],
      wednesday: [
        { time: '08:30-15:00', activity: 'School' },
        { time: '16:00-16:30', activity: 'Study time' },
        { time: '17:00-18:00', activity: 'Science experiments' }
      ],
      thursday: [
        { time: '08:30-15:00', activity: 'School' },
        { time: '15:30-16:30', activity: 'Science club' },
        { time: '17:00-18:00', activity: 'Homework' }
      ],
      friday: [
        { time: '08:30-15:00', activity: 'School' },
        { time: '16:00-16:30', activity: 'Study time' },
        { time: '17:00-19:00', activity: 'Free time' }
      ],
      saturday: [
        { time: '10:00-12:00', activity: 'Science experiments with Tegner' },
        { time: '14:00-16:00', activity: 'Friends / Birthday parties' }
      ],
      sunday: [
        { time: '10:00-12:00', activity: 'Family time' },
        { time: '14:00-16:00', activity: 'Reading / Projects' }
      ]
    };
  }

  /**
   * Oly's transformation phases
   */
  advancePhase(newPhase) {
    super.advancePhase(newPhase);

    switch (newPhase) {
      case 'discovery':
        console.log(`🔬 Oly: "Allie knows SO MUCH about science!"`);
        break;

      case 'integration':
        this.personality.helpfulness = 0.78;
        this.personality.initiative = 0.60;
        // Study time habit forming
        this.choreHabits[0].completionRate = 0.75;
        console.log(`📚 Oly: Developing consistent study time habit`);
        break;

      case 'balanced':
        this.personality.helpfulness = 0.85;
        this.personality.initiative = 0.70;
        // Study habit established, helps Tegner with science
        this.choreHabits[0].completionRate = 0.90;
        console.log(`🧪 Oly: Study routine established, teaches Tegner science experiments`);
        break;

      case 'thriving':
        this.personality.helpfulness = 0.88;
        console.log(`🏆 Oly: "Contributing & Proud" - science mentor to Tegner`);
        break;
    }
  }

  /**
   * Science experiment generation (Oly's favorite!)
   */
  async requestScienceExperiment() {
    const experiments = [
      {
        title: 'Volcano eruption',
        materials: ['baking soda', 'vinegar', 'food coloring', 'dish soap'],
        duration: 30,
        messiness: 'medium',
        learningGoal: 'Chemical reactions'
      },
      {
        title: 'Crystal growing',
        materials: ['borax', 'hot water', 'pipe cleaners', 'food coloring'],
        duration: '24 hours',
        messiness: 'low',
        learningGoal: 'Crystallization process'
      },
      {
        title: 'Homemade slime',
        materials: ['glue', 'borax', 'water', 'food coloring'],
        duration: 20,
        messiness: 'high',
        learningGoal: 'Polymers and viscosity'
      },
      {
        title: 'Balloon rocket',
        materials: ['balloon', 'string', 'straw', 'tape'],
        duration: 15,
        messiness: 'low',
        learningGoal: 'Newton\'s laws of motion'
      }
    ];

    const experiment = experiments[Math.floor(Math.random() * experiments.length)];

    return {
      experiment: experiment,
      enthusiasm: 0.95,
      willingToHelp: true,
      includesTegner: Math.random() < 0.70, // 70% chance Tegner joins
      questionCount: 3 // Will ask 3 follow-up questions
    };
  }

  /**
   * Birthday party gift coordination
   */
  async coordinateBirthdayParty(party) {
    // Needs help from parents (gift buying, theme understanding)
    return {
      needsHelp: true,
      helpNeededFor: ['Gift ideas', 'Gift budget', 'Transportation'],
      giftPreferences: party.theme ? `Something ${party.theme}-themed` : 'Toys or games',
      budget: '$20-30',
      excitement: 0.90
    };
  }
}

module.exports = OlyAgent;
