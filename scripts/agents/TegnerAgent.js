#!/usr/bin/env node
/**
 * TegnerAgent - Youngest child (7 years old)
 *
 * Key Traits:
 * - Full of energy
 * - Gets bored easily ("There's nothing to dooooo!")
 * - Loves science experiments with Oly
 * - Swimming lessons with Stefan (Wednesdays - special routine)
 * - Simple morning chore
 * - Sleep improves 40% when Stefan reads stories
 */

const ChildAgent = require('./ChildAgent');

class TegnerAgent extends ChildAgent {
  constructor(userId) {
    super({
      userId: userId,
      name: 'Tegner',
      age: 7,

      personality: {
        helpfulness: 0.35,    // Young, limited (grows to 0.60)
        curiosity: 0.95,      // Very high curiosity
        energy: 0.95,         // Very high energy
        initiative: 0.28      // Low (grows to 0.50)
      },

      activities: [
        { type: 'sport', name: 'Swimming', frequency: 'weekly', day: 3, time: '16:00', duration: 60, withParent: 'Stefan' },
        { type: 'play', name: 'Science experiments with Oly', frequency: 'as_wanted', enthusiasm: 0.90 },
        { type: 'play', name: 'Free play', frequency: 'daily', duration: 120 }
      ],

      choreHabits: [
        { title: 'Morning chore', schedule: 'weekly', frequency: '5x/week', startHour: 7, endHour: 8, duration: 5, task: 'Put shoes in closet' }
      ],

      interests: [
        'swimming',
        'science experiments',
        'dinosaurs',
        'playing',
        'building',
        'running around'
      ],

      school: {
        grade: '2nd Grade',
        subjects: ['Reading', 'Math', 'Science', 'Art'],
        favorite: 'Science',
        strengths: ['Energy', 'Enthusiasm', 'Creativity']
      }
    });

    // Tegner-specific traits
    this.energyLevel = 0.95; // VERY high
    this.boredomThreshold = 8; // Gets bored quickly (15 - age = 8)
    this.attentionSpan = 21; // Minutes (age * 3 = 21 min)

    // Sleep pattern (improves with Stefan's bedtime routine)
    this.sleepQuality = 0.60; // Starts at 60%, improves to 84% (40% improvement!)
    this.bedtimeRoutine = {
      hasRoutine: false, // Becomes true in integration phase
      stefanReadsStories: false,
      consistency: 0.40
    };

    // Special routine with Stefan (swimming Wednesdays)
    this.stefanBonding = {
      activity: 'Swimming',
      day: 'Wednesday',
      specialRoutine: true,
      bondingLevel: 0.85 // High - they love this time together
    };

    // Growth arc
    this.transformationArc = {
      chaos: 'Chaotic energy, frequent boredom',
      discovery: 'Loves Allie\'s activity suggestions',
      integration: 'Morning chore starting, bedtime routine with Stefan',
      balanced: 'Consistent morning chore, sleep improved 40%',
      thriving: 'Engaged & Learning - loves his routines'
    };
  }

  /**
   * Tegner gets bored FAST
   */
  tick(minutesElapsed) {
    super.tick(minutesElapsed);

    // Tegner's boredom increases VERY quickly
    const minutesSinceActivity = (Date.now() - this.lastActivityChange) / 60000;

    if (minutesSinceActivity > 15) {
      // Boredom spikes
      this.boredomLevel = Math.min(10, this.boredomLevel + (minutesElapsed * 0.8));
    }

    // High energy means he needs constant stimulation
    if (this.boredomLevel > this.boredomThreshold) {
      this.currentState.mood = 'restless';
    }
  }

  /**
   * Tegner's classic boredom expression
   */
  expressBoredom() {
    const expressions = [
      'There\'s nothing to dooooo!',
      'I\'m bored!',
      'Can I do something?',
      'What can I play?',
      'Mooooom, I\'m bored!'
    ];

    return {
      expression: expressions[Math.floor(Math.random() * expressions.length)],
      volume: 'loud',
      frequency: 'very_high',
      needsImmediateActivity: true,
      boredomLevel: this.boredomLevel
    };
  }

  /**
   * Allie suggests activities (Tegner's favorite!)
   */
  async askAllieForActivity() {
    const request = await super.askAllieForActivity();

    // Tegner needs IMMEDIATE suggestions
    return {
      ...request,
      urgency: 'high',
      preferredActivities: [
        'Science experiments with Oly',
        'Building things',
        'Running around outside',
        'Playing with toys',
        'Drawing/coloring'
      ],
      attentionSpan: this.attentionSpan,
      energyLevel: this.energyLevel
    };
  }

  /**
   * Tegner's typical day
   */
  generateDailySchedule() {
    return {
      '07:00': 'Wake up (high energy!)',
      '07:15': 'Morning chore (put shoes in closet)',
      '07:30': 'Breakfast',
      '08:00': 'School bus',
      '08:30-14:30': 'School (2nd grade)',
      '15:00': 'Get home - ENERGY SPIKE',
      '15:30': 'Snack + free play',
      '16:00': this.isWednesday() ? 'SWIMMING WITH STEFAN!' : 'Play time',
      '17:00': 'Play / Science experiments / Boredom',
      '18:00': 'Dinner',
      '19:00': 'Play / Bath',
      '20:00': this.bedtimeRoutine.stefanReadsStories ? 'Story time with Stefan' : 'Bedtime (resist)',
      '20:30': 'Sleep (quality: ' + (this.sleepQuality * 100).toFixed(0) + '%)'
    };
  }

  isWednesday() {
    return new Date().getDay() === 3;
  }

  /**
   * Swimming with Stefan (special bonding time)
   */
  async swimmingWithStefan() {
    return {
      activity: 'Swimming lessons',
      day: 'Wednesday',
      time: '16:00',
      duration: 60,
      withParent: 'Stefan',
      enthusiasm: 0.95,
      bondingLevel: this.stefanBonding.bondingLevel,
      progressNote: this.transformationPhase === 'balanced'
        ? 'Swimming progress correlates with Stefan\'s Wednesday work-from-home schedule'
        : 'Loves swimming time with Dad!',
      specialRoutine: true
    };
  }

  /**
   * Bedtime routine with Stefan (sleep improves 40%!)
   */
  async bedtimeRoutine() {
    if (this.bedtimeRoutine.stefanReadsStories) {
      return {
        routine: 'Stefan reads stories',
        duration: 20,
        consistency: this.bedtimeRoutine.consistency,
        sleepImprovement: 0.40, // 40% improvement!
        currentSleepQuality: this.sleepQuality,
        mood: 'calm',
        bondingWithStefan: true
      };
    } else {
      return {
        routine: 'None',
        sleepQuality: 0.60,
        mood: 'resistant',
        resistance: 0.70 // Resists bedtime
      };
    }
  }

  /**
   * Tegner's transformation phases
   */
  advancePhase(newPhase) {
    super.advancePhase(newPhase);

    switch (newPhase) {
      case 'discovery':
        console.log(`🏊 Tegner: "Allie knows fun stuff to do!"`);
        break;

      case 'integration':
        this.personality.helpfulness = 0.45;
        // Morning chore starting
        this.choreHabits[0].completionRate = 0.60;
        // Bedtime routine starts
        this.bedtimeRoutine.hasRoutine = true;
        this.bedtimeRoutine.stefanReadsStories = true;
        this.bedtimeRoutine.consistency = 0.70;
        this.sleepQuality = 0.70; // Improving
        console.log(`📚 Tegner: Morning chore starting, bedtime routine with Stefan`);
        break;

      case 'balanced':
        this.personality.helpfulness = 0.55;
        this.personality.initiative = 0.45;
        // Morning chore consistent
        this.choreHabits[0].completionRate = 0.80;
        // Sleep improved 40%!
        this.bedtimeRoutine.consistency = 0.90;
        this.sleepQuality = 0.84; // 40% improvement from 0.60!
        console.log(`😴 Tegner: Morning chore consistent, sleep improved 40% with Stefan's stories`);
        break;

      case 'thriving':
        this.personality.helpfulness = 0.60;
        this.personality.initiative = 0.50;
        console.log(`🏆 Tegner: "Engaged & Learning" - loves his routines`);
        break;
    }
  }

  /**
   * Science experiments with Oly (Tegner LOVES these!)
   */
  async scienceExperimentWithOly(experiment) {
    return {
      experiment: experiment.title,
      withSibling: 'Oly',
      enthusiasm: 0.92,
      attentionSpan: this.attentionSpan, // 21 minutes
      messLevel: 'high', // Tegner makes things messy!
      learningEngagement: 0.75,
      favoriteType: 'Anything that explodes or bubbles',
      asks: 'Can we do another one?'
    };
  }

  /**
   * Morning chore (simple task)
   */
  async doMorningChore() {
    const willDo = Math.random() < this.ageBasedTraits.responsibility;

    if (willDo) {
      return {
        completed: true,
        task: 'Put shoes in closet',
        duration: 5,
        quality: 'okay', // Gets it done but not perfectly
        needsReminder: Math.random() < 0.40, // 40% chance needs reminder
        mood: 'neutral'
      };
    } else {
      return {
        completed: false,
        reason: 'Forgot / Got distracted',
        distraction: 'Playing with toys',
        needsParentReminder: true
      };
    }
  }
}

module.exports = TegnerAgent;
