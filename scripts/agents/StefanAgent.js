#!/usr/bin/env node
/**
 * StefanAgent - Dad agent with transformation arc
 *
 * Key Traits:
 * - Well-intentioned but initially low awareness (30%)
 * - Underestimates invisible labor (thinks Kimberly has 43%, she actually has 87%)
 * - Handles visible tasks well (dishes, laundry)
 * - Creates only 15% of tasks initially
 * - Transformation: Awareness grows from 30% → 80% with Allie's help
 */

const PersonaAgent = require('./PersonaAgent');

class StefanAgent extends PersonaAgent {
  constructor(userId) {
    super({
      userId: userId,
      name: 'Stefan',
      role: 'parent',
      age: 38,
      initialMentalLoad: 0.30, // Starts low, grows to 0.48 (balanced)

      personality: {
        helpfulness: 0.80,        // Genuinely wants to help
        awareness: 0.30,          // LOW - doesn't see invisible labor (grows to 0.80!)
        followThrough: 0.90,      // Excellent once task is assigned
        initiative: 0.40,         // Needs prompting (grows to 0.70)
        detailOrientation: 0.50   // Medium - misses some details
      },

      behaviorPatterns: {
        taskCreationRate: 0.15,              // Creates 15% of tasks (grows to 0.40)
        calendarCheckFrequency: 'weekly',    // Only checks weekly initially (becomes daily)
        surveyCompletionRate: 0.50,          // Skips half of surveys (grows to 0.85)
        documentUploadLikelihood: 0.20,      // Rarely uploads docs (grows to 0.60)
        responseStyle: 'brief'               // "Got it", "On it", "Done"
      }
    });

    // Stefan-specific traits
    this.perceptionGap = 0.44; // Thinks Kimberly has 43% load, actually 87% (44 point gap)
    this.visibleTaskPreference = 0.85; // Strongly prefers visible tasks (dishes, laundry)
    this.workLifeBalance = 'poor'; // Struggles initially
    this.assignedActivities = ['oly_science_club', 'tegner_swimming']; // Takes on with Allie's help

    // Growth tracking
    this.awarenessGrowthRate = 0.10; // Gains 10% awareness per month with Allie
    this.transformationPhase = 'chaos'; // chaos → discovery → integration → balanced → thriving
  }

  /**
   * Stefan-specific decision-making
   */
  async decideNextAction(context) {
    // Override: Stefan more likely to act on weekends
    const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
    const weekendBoost = isWeekend ? 1.3 : 1.0;

    // More likely to respond to explicit assignments
    if (context.situation.includes('assigned') || context.situation.includes('Allie suggests')) {
      this.personality.initiative = Math.min(1.0, this.personality.initiative * 1.5);
    }

    // Call parent decision-making
    const decision = await super.decideNextAction(context);

    // Stefan underestimates time for invisible labor tasks
    if (decision.action === 'create_task' && decision.data.category === 'coordination') {
      decision.data.estimatedTime = decision.data.actualTime * 0.4; // Thinks it takes 40% of actual time
    }

    return decision;
  }

  /**
   * Stefan's transformation through phases
   */
  advancePhase(newPhase) {
    this.transformationPhase = newPhase;

    switch (newPhase) {
      case 'discovery':
        // After interview, awareness starts growing
        this.personality.awareness = 0.55;
        this.perceptionGap = 0.30; // Realizes gap is larger than thought
        this.currentState.mood = 'surprised';
        console.log(`📊 Stefan: "Wow, I had no idea Kimberly was managing so much in her head..."`);
        break;

      case 'integration':
        // Takes on science club + swimming
        this.personality.awareness = 0.70;
        this.personality.initiative = 0.65;
        this.behaviorPatterns.taskCreationRate = 0.30;
        this.currentState.mentalLoad = 0.42; // Taking on more
        console.log(`✅ Stefan: Taking on Oly's science club and Tegner's swimming logistics`);
        break;

      case 'balanced':
        // Mental load approaching balance
        this.personality.awareness = 0.80;
        this.personality.initiative = 0.70;
        this.behaviorPatterns.taskCreationRate = 0.40;
        this.behaviorPatterns.calendarCheckFrequency = 'daily';
        this.behaviorPatterns.surveyCompletionRate = 0.85;
        this.currentState.mentalLoad = 0.48;
        this.workLifeBalance = 'good';
        console.log(`⚖️ Stefan: Mental load balanced (48% vs Kimberly's 62%)`);
        break;

      case 'thriving':
        // Peak performance
        this.personality.awareness = 0.85;
        this.personality.initiative = 0.75;
        this.behaviorPatterns.documentUploadLikelihood = 0.70;
        this.currentState.mood = 'happy';
        this.workLifeBalance = 'excellent';
        console.log(`🎯 Stefan: "I actually know what needs to be done now!"`);
        break;
    }
  }

  /**
   * Stefan's response to seeing invisible labor analysis
   */
  async reactToInvisibleLaborInsight(analysis) {
    // This is the "aha moment" from the landing page
    const kimberlyActualLoad = analysis.kimberly.mentalLoad;
    const stefanThoughtSheHad = 0.43;
    const gap = kimberlyActualLoad - stefanThoughtSheHad;

    console.log(`\n💡 Stefan's Realization Moment:`);
    console.log(`   Thought Kimberly had: ${(stefanThoughtSheHad * 100).toFixed(0)}%`);
    console.log(`   She actually has: ${(kimberlyActualLoad * 100).toFixed(0)}%`);
    console.log(`   Gap: ${(gap * 100).toFixed(0)} percentage points!\n`);

    // This triggers transformation to 'discovery' phase
    this.advancePhase('discovery');

    return {
      responseText: `I had no idea Kimberly was managing so much in her head. I thought we were pretty equal because I do the dishes and laundry, but seeing the mental load breakdown... wow. Now I understand why she always seems stressed about logistics.`,
      emotionalImpact: 'profound',
      behaviorChange: 'immediate',
      awarenessIncrease: 0.25
    };
  }

  /**
   * Generate Stefan-specific tasks
   */
  generateTypicalTasks() {
    const typicalTasks = [
      // Visible tasks he does well
      { title: 'Do the dishes', category: 'chore', frequency: 'daily', completionRate: 0.95 },
      { title: 'Laundry', category: 'chore', frequency: 'weekly', completionRate: 0.90 },
      { title: 'Grocery shopping', category: 'errand', frequency: 'weekly', completionRate: 0.85 },

      // Tasks he takes on with Allie (integration phase)
      { title: 'Take Oly to science club Thursday 3:30pm', category: 'coordination', frequency: 'weekly', assignedBy: 'Allie' },
      { title: 'Tegner swimming Wednesday afternoon', category: 'coordination', frequency: 'weekly', assignedBy: 'Allie' },

      // Weekend tasks
      { title: 'Yard work', category: 'maintenance', frequency: 'weekly', completionRate: 0.80 },
      { title: 'Car maintenance', category: 'maintenance', frequency: 'monthly', completionRate: 0.85 }
    ];

    // Filter by current transformation phase
    if (this.transformationPhase === 'chaos' || this.transformationPhase === 'discovery') {
      // Only visible tasks
      return typicalTasks.filter(t => ['chore', 'errand', 'maintenance'].includes(t.category));
    } else {
      // Include coordination tasks
      return typicalTasks;
    }
  }

  /**
   * Stefan's calendar interaction pattern
   */
  async checkCalendar() {
    if (this.behaviorPatterns.calendarCheckFrequency === 'weekly') {
      // Only checks on Sundays initially
      const isSunday = new Date().getDay() === 0;
      if (!isSunday) {
        return { checked: false, reason: 'Not my usual check day' };
      }
    }

    // What Stefan notices in calendar (depends on awareness)
    const notices = [];
    const awarenessLevel = this.personality.awareness;

    if (awarenessLevel > 0.3) {
      notices.push('My assigned pickups');
    }
    if (awarenessLevel > 0.5) {
      notices.push('Kids\' activity conflicts');
    }
    if (awarenessLevel > 0.7) {
      notices.push('Upcoming permission slip deadlines');
    }
    if (awarenessLevel > 0.8) {
      notices.push('Kimberly\'s gaps where I could help');
    }

    return {
      checked: true,
      frequency: this.behaviorPatterns.calendarCheckFrequency,
      notices: notices,
      awarenessLevel: awarenessLevel
    };
  }

  /**
   * Survey response style
   */
  async completeSurvey(surveyType) {
    const shouldComplete = Math.random() < this.behaviorPatterns.surveyCompletionRate;

    if (!shouldComplete) {
      return {
        completed: false,
        reason: 'Too busy right now',
        timing: 'Maybe later'
      };
    }

    // Stefan's survey responses are brief but honest
    const responses = {
      'weekly_checkin': {
        time: '5 minutes', // Uses 5-min version
        completeness: 'basic', // Skips open-ended questions
        honesty: 0.85
      },
      'fair_play_assessment': {
        time: '45 minutes', // Realizes gaps mid-survey
        completeness: 'full',
        honesty: 0.90,
        midSurveyRealization: true, // "Wait, Kimberly does ALL of this?"
        emotionalResponse: 'eye-opening'
      },
      'balance_check': {
        time: '7 minutes',
        completeness: 'basic',
        honesty: 0.80
      }
    };

    return {
      completed: true,
      ...responses[surveyType],
      responseStyle: 'brief'
    };
  }
}

module.exports = StefanAgent;
