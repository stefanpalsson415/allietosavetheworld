#!/usr/bin/env node
/**
 * KimberlyAgent - Mom agent with relief transformation arc
 *
 * Key Traits:
 * - Chief Mental Load Officer (87% initially)
 * - Always the one who remembers everything
 * - Anticipates needs 3-7 days in advance
 * - Creates 85% of family tasks (invisible labor)
 * - Stressed about logistics and coordination
 * - Transformation: Mental load decreases from 87% → 62% (RELIEF!)
 */

const PersonaAgent = require('./PersonaAgent');

class KimberlyAgent extends PersonaAgent {
  constructor(userId) {
    super({
      userId: userId,
      name: 'Kimberly',
      role: 'parent',
      age: 36,
      initialMentalLoad: 0.87, // Very high initially, drops to 0.62 (relief!)

      personality: {
        helpfulness: 1.00,        // Maxed out - helps everyone
        awareness: 0.95,          // Very high - sees all needs
        followThrough: 0.98,      // Almost perfect execution
        initiative: 0.95,         // Proactive - doesn't wait to be asked
        detailOrientation: 0.90   // Highly detail-oriented
      },

      behaviorPatterns: {
        taskCreationRate: 0.85,              // Creates 85% of family tasks
        anticipationWindow: '3-7 days',      // Plans ahead
        calendarCheckFrequency: 'daily',     // Checks multiple times per day
        surveyCompletionRate: 0.95,          // Almost always completes
        documentUploadLikelihood: 0.90,      // Uploads almost everything
        responseStyle: 'detailed'            // Provides full context
      }
    });

    // Kimberly-specific traits
    this.invisibleLaborTypes = [
      'anticipation',    // "We need to think about summer camp registration"
      'monitoring',      // "Did Tegner bring home his science project?"
      'coordination',    // "Who's taking Lillian to volleyball?"
      'planning',        // "Oly needs gift for Jake's party next weekend"
      'documentation'    // "Upload vaccination records for science camp"
    ];

    this.coordinationBurden = {
      kidsActivities: {
        hours: 6.5, // Hours/week coordinating 3 kids' activities
        weight: 13.4 // Invisible labor weight score
      },
      permissionSlips: {
        annual: 25, // Permission slips per year
        lastMinute: 0.60 // 60% uploaded day-before deadline initially
      },
      medicalRecords: {
        maintained: true,
        recall: 'perfect' // Knows all kids' vaccination dates
      }
    };

    // Stress patterns
    this.stressors = [
      'Coordinating 3 kids\' activities',
      'Remembering everyone\'s schedules',
      'Stefan not seeing invisible work',
      'Last-minute permission slips',
      'Feeling like the only one who notices things'
    ];

    // Transformation tracking
    this.transformationPhase = 'chaos'; // chaos → discovery → integration → balanced → thriving
    this.reliefMetrics = {
      tasksSharedWithStefan: 0,
      allieHandledCoordination: 0,
      stressReductionPercent: 0
    };
  }

  /**
   * Kimberly-specific decision-making
   */
  async decideNextAction(context) {
    // Kimberly anticipates needs before they're urgent
    const anticipationBoost = this.personality.awareness * 0.8;

    // More likely to create tasks in the morning (planning ahead)
    const currentHour = new Date().getHours();
    const morningBoost = (currentHour >= 6 && currentHour <= 9) ? 1.4 : 1.0;

    // Temporarily boost initiative for decision
    const originalInitiative = this.personality.initiative;
    this.personality.initiative = Math.min(1.0, originalInitiative * morningBoost * anticipationBoost);

    // Call parent decision-making
    const decision = await super.decideNextAction(context);

    // Restore original initiative
    this.personality.initiative = originalInitiative;

    // Kimberly includes MORE context in task creation
    if (decision.action === 'create_task') {
      decision.data.context = this.addDetailedContext(decision.data);
      decision.data.anticipatedIssues = this.anticipateIssues(decision.data);
    }

    return decision;
  }

  /**
   * Add detailed context (Kimberly's detailed communication style)
   */
  addDetailedContext(taskData) {
    // Example: "Lillian has volleyball at 4pm" becomes...
    return `${taskData.title}. Note: We need to leave by 3:30 because traffic is heavy on Tuesdays. She also needs her water bottle (check if it's clean) and her knee pads (last saw them in the laundry room). Coach mentioned they're working on serves this week, so she might want to practice beforehand.`;
  }

  /**
   * Anticipate issues ahead of time
   */
  anticipateIssues(taskData) {
    const issues = [];

    // Check for conflicts with other family members
    if (taskData.category === 'coordination') {
      issues.push('Potential conflict with Oly\'s science club');
      issues.push('Stefan might have late meeting that day');
    }

    // Check for missing prerequisites
    if (taskData.category === 'activity') {
      issues.push('Need to verify registration is paid');
      issues.push('Check if permission slip was signed');
    }

    return issues;
  }

  /**
   * Kimberly's transformation through phases
   */
  advancePhase(newPhase) {
    this.transformationPhase = newPhase;

    switch (newPhase) {
      case 'discovery':
        // Stefan realizes the gap - validation!
        this.currentState.mood = 'validated';
        this.currentState.stress = 0.75; // Slightly less stressed (feeling seen)
        console.log(`💗 Kimberly: "Finally! Someone sees how much I've been carrying..."`);
        break;

      case 'integration':
        // Stefan takes on science club + swimming
        this.currentState.mentalLoad = 0.72; // Drops from 0.87
        this.reliefMetrics.tasksSharedWithStefan = 15;
        this.coordinationBurden.kidsActivities.hours = 4.5; // Down from 6.5
        console.log(`😌 Kimberly: "It helps SO much that Stefan handles Oly and Tegner now"`);
        break;

      case 'balanced':
        // Allie handling coordination, Stefan proactive
        this.currentState.mentalLoad = 0.62; // Significant relief!
        this.currentState.stress = 0.40;
        this.reliefMetrics.allieHandledCoordination = 80; // Allie handles 80%
        this.reliefMetrics.stressReductionPercent = 54; // 54% stress reduction
        this.coordinationBurden.permissionSlips.lastMinute = 0.10; // Only 10% last-minute now
        console.log(`⚖️ Kimberly: Mental load balanced (62% vs Stefan's 48%)`);
        break;

      case 'thriving':
        // Peak relief - energized and supported
        this.currentState.mentalLoad = 0.58;
        this.currentState.stress = 0.25;
        this.currentState.mood = 'energized';
        this.currentState.energy = 0.90;
        console.log(`🎉 Kimberly: "I actually have energy for myself now!"`);
        break;
    }
  }

  /**
   * Generate Kimberly's typical invisible labor tasks
   */
  generateTypicalTasks() {
    const invisibleLaborTasks = [
      // Anticipation (3-7 days ahead)
      {
        title: 'Research summer camp options for Oly',
        category: 'anticipation',
        anticipationDays: 90,
        weight: 9.2,
        frequency: 'annual'
      },
      {
        title: 'Coordinate who takes Lillian to volleyball Thursday',
        category: 'coordination',
        anticipationDays: 3,
        weight: 8.2,
        frequency: 'weekly'
      },

      // Monitoring (invisible checking)
      {
        title: 'Check if Tegner has clean swim clothes for tomorrow',
        category: 'monitoring',
        weight: 3.1,
        frequency: 'weekly'
      },
      {
        title: 'Verify Oly brought home science project materials',
        category: 'monitoring',
        weight: 4.5,
        frequency: 'as_needed'
      },

      // Documentation
      {
        title: 'Upload Oly\'s vaccination records for science camp',
        category: 'admin',
        deadline: '2025-12-01',
        weight: 11.3,
        anticipationDays: 14
      },
      {
        title: 'Find Lillian\'s immunization card for volleyball',
        category: 'admin',
        weight: 7.8,
        frequency: 'annual'
      },

      // Planning (gift-buying, party logistics)
      {
        title: 'Buy cowboy-themed gift for Jake\'s birthday (Oly\'s classmate)',
        category: 'planning',
        budget: '$20-30',
        theme: 'western',
        anticipationDays: 7,
        weight: 6.4
      },

      // Coordination (heavyweight tasks)
      {
        title: 'Coordinate 3 kids\' activities for the week',
        category: 'coordination',
        hours: 6.5,
        weight: 13.4, // Heaviest task!
        frequency: 'weekly',
        subtasks: [
          'Lillian volleyball 2x/week',
          'Oly science club Thursday 3:30pm',
          'Tegner swimming Wednesday',
          'Carpools',
          'Gear/equipment check',
          'Schedule conflicts'
        ]
      }
    ];

    // Filter by transformation phase
    if (this.transformationPhase === 'balanced' || this.transformationPhase === 'thriving') {
      // Allie handles most coordination, Stefan handles some
      return invisibleLaborTasks.filter(t =>
        t.category !== 'coordination' || t.weight < 10
      );
    }

    return invisibleLaborTasks;
  }

  /**
   * Kimberly's calendar interaction (checks DAILY, multiple times)
   */
  async checkCalendar() {
    const timesPerDay = this.transformationPhase === 'chaos' ? 4 : 2;

    // What Kimberly notices (sees EVERYTHING)
    const notices = [
      'All kids\' activities',
      'Potential scheduling conflicts',
      'Permission slip deadlines',
      'Gift-buying needs for upcoming parties',
      'Doctor appointment reminders',
      'Stefan\'s work calendar (to coordinate)',
      'Gaps where someone needs pickup',
      'Weather for outdoor activities'
    ];

    return {
      checked: true,
      timesPerDay: timesPerDay,
      frequency: 'multiple_daily',
      notices: notices,
      mentalLoad: this.currentState.mentalLoad
    };
  }

  /**
   * Survey response - Detailed and reflective
   */
  async completeSurvey(surveyType) {
    const shouldComplete = Math.random() < this.behaviorPatterns.surveyCompletionRate;

    if (!shouldComplete) {
      // Rare, but happens when truly overwhelmed
      return {
        completed: false,
        reason: 'Too many urgent things happening right now',
        guilt: 0.8 // Feels guilty for not completing
      };
    }

    // Kimberly's survey responses are detailed and honest
    const responses = {
      'weekly_checkin': {
        time: '15 minutes', // Takes full version
        completeness: 'detailed', // Answers all open-ended questions
        honesty: 0.95,
        emotionalDepth: 'high',
        providesExamples: true
      },
      'fair_play_assessment': {
        time: '60 minutes', // Thorough
        completeness: 'exhaustive',
        honesty: 0.98,
        emotionalResponse: 'validating', // "Finally someone asks about this!"
        detailLevel: 'comprehensive'
      },
      'balance_check': {
        time: '12 minutes',
        completeness: 'detailed',
        honesty: 0.92,
        selfAwareness: 0.95
      }
    };

    return {
      completed: true,
      ...responses[surveyType],
      responseStyle: 'detailed'
    };
  }

  /**
   * Document upload behavior - Proactive and organized
   */
  async uploadDocument(documentType) {
    const shouldUpload = Math.random() < this.behaviorPatterns.documentUploadLikelihood;

    if (!shouldUpload) {
      return {
        uploaded: false,
        reason: 'Will do it later tonight',
        actuallyDoesItLater: true
      };
    }

    // Kimberly uploads with full context
    const uploadPatterns = {
      'vaccination_card': {
        timing: 'proactive', // Uploads before it's needed
        organization: 'tagged_by_child',
        notes: `Tegner's vaccination card - all doses current. Next due: DTaP booster age 11.`,
        relatedDocuments: ['doctor_contact', 'insurance_card']
      },
      'permission_slip': {
        timing: this.transformationPhase === 'chaos' ? 'day_before' : '3_days_ahead',
        signedBy: 'both_parents', // Remembers to get Stefan's signature
        notes: 'Signed, dated, emergency contact verified',
        reminderSet: true
      },
      'report_card': {
        timing: 'same_day',
        organization: 'by_semester',
        notes: 'Q2 2025 - Math improved, reading excellent, teacher comments attached',
        followUpTasks: ['Schedule parent-teacher if needed']
      }
    };

    return {
      uploaded: true,
      ...uploadPatterns[documentType],
      anticipationDays: this.transformationPhase === 'chaos' ? 0 : 7
    };
  }

  /**
   * Invisible labor that goes unnoticed
   */
  performInvisibleLabor() {
    const tasks = [
      'Notice Lillian\'s water bottle is in the car',
      'Remember Oly needs poster board for Thursday',
      'Check if Tegner\'s swim goggles are in the bag',
      'Coordinate carpool with other volleyball parents',
      'Research if Jake likes Lego for birthday gift',
      'Check weather for Saturday soccer game',
      'Remember Stefan has late meeting Tuesday',
      'Plan dinner around kids\' activity schedule',
      'Notice we\'re low on sunscreen',
      'Remember to ask about Lillian\'s friend situation at school'
    ];

    // These tasks happen continuously but aren't logged
    // Until Allie starts tracking them!

    return {
      tasksPerformed: tasks.length,
      visibility: 0.15, // Only 15% of this gets noticed
      mentalLoadContribution: tasks.length * 0.02,
      stefanAwareness: this.transformationPhase === 'chaos' ? 0.10 : 0.75
    };
  }
}

module.exports = KimberlyAgent;
