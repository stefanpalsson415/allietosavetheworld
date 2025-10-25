#!/usr/bin/env node
/**
 * ChildAgent - Base class for kid agents (Lillian, Oly, Tegner)
 *
 * Key Traits:
 * - Age-appropriate responsibility levels
 * - Simpler decision trees than adults
 * - Growth over time (becoming more helpful)
 * - Activity-driven (school, sports, hobbies)
 * - Boredom patterns (younger kids bore faster)
 */

const PersonaAgent = require('./PersonaAgent');

class ChildAgent extends PersonaAgent {
  constructor(profile) {
    // Calculate age-appropriate personality traits
    const ageBasedTraits = {
      responsibility: Math.min(0.9, profile.age * 0.05),  // 14yo = 0.70, 7yo = 0.35
      initiative: Math.min(0.8, profile.age * 0.04),       // 14yo = 0.56, 7yo = 0.28
      curiosity: Math.max(0.5, 1.0 - (profile.age * 0.03)), // Younger = more curious
      attentionSpan: Math.min(45, profile.age * 3),         // Minutes
      boredomThreshold: Math.max(5, 15 - profile.age)       // Lower = bores faster
    };

    super({
      userId: profile.userId,
      name: profile.name,
      role: 'child',
      age: profile.age,
      initialMentalLoad: 0.10, // Kids have minimal mental load

      personality: {
        helpfulness: profile.personality?.helpfulness || ageBasedTraits.responsibility,
        awareness: ageBasedTraits.responsibility * 0.8, // Kids less aware than they are responsible
        followThrough: ageBasedTraits.responsibility,
        initiative: ageBasedTraits.initiative,
        detailOrientation: ageBasedTraits.responsibility * 0.7,
        curiosity: ageBasedTraits.curiosity
      },

      behaviorPatterns: {
        taskCreationRate: 0.05,                    // Kids create few tasks
        choreCompletionRate: ageBasedTraits.responsibility,
        surveyParticipation: profile.age >= 10,    // Only 10+ do surveys
        responseStyle: profile.age >= 12 ? 'medium' : 'brief',
        ...profile.behaviorPatterns
      }
    });

    // Child-specific traits
    this.ageBasedTraits = ageBasedTraits;
    this.activities = profile.activities || [];
    this.interests = profile.interests || [];
    this.school = profile.school || { grade: `Grade ${profile.age - 6}` };

    // Chore habits (develop over time)
    this.choreHabits = profile.choreHabits || [];
    this.choreCompletionHistory = [];

    // Boredom state
    this.boredomLevel = 0; // 0-10 scale
    this.lastActivityChange = Date.now();

    // Growth tracking
    this.responsibilityGrowthRate = 0.02; // Gains 2% responsibility per month
    this.transformationPhase = 'chaos'; // chaos → integration → balanced → thriving
  }

  /**
   * Child-specific decision-making (simpler than adults)
   */
  async decideNextAction(context) {
    // Children's decisions are more reactive than proactive
    const isReactive = Math.random() < 0.7; // 70% of child actions are reactive

    if (isReactive) {
      // Respond to what's happening now
      if (this.boredomLevel > this.ageBasedTraits.boredomThreshold) {
        return {
          action: 'express_boredom',
          data: {
            title: 'I\'m bored!',
            responseText: this.age < 10 ? 'There\'s nothing to dooooo!' : 'What is there to do?',
            urgency: 'medium'
          },
          timestamp: new Date().toISOString()
        };
      }

      // Check for assigned chores
      if (this.choreHabits.length > 0) {
        const currentChore = this.getCurrentChore();
        if (currentChore) {
          return {
            action: 'complete_chore',
            data: currentChore,
            timestamp: new Date().toISOString()
          };
        }
      }
    }

    // Otherwise use parent's decision-making (simplified for kids)
    return await super.decideNextAction(context);
  }

  /**
   * Check if child has a chore to do now
   */
  getCurrentChore() {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    for (const habit of this.choreHabits) {
      if (habit.schedule === 'daily') {
        if (currentHour >= habit.startHour && currentHour < habit.endHour) {
          return {
            title: habit.title,
            category: 'chore',
            completionLikelihood: this.ageBasedTraits.responsibility,
            duration: habit.duration
          };
        }
      } else if (habit.schedule === 'weekly' && currentDay === habit.dayOfWeek) {
        if (currentHour >= habit.startHour && currentHour < habit.endHour) {
          return {
            title: habit.title,
            category: 'chore',
            completionLikelihood: this.ageBasedTraits.responsibility,
            duration: habit.duration
          };
        }
      }
    }

    return null;
  }

  /**
   * Complete a chore
   */
  async completeChore(chore) {
    const willComplete = Math.random() < this.ageBasedTraits.responsibility;

    if (willComplete) {
      // Track completion
      this.choreCompletionHistory.push({
        chore: chore.title,
        completedAt: new Date().toISOString(),
        quality: this.ageBasedTraits.responsibility > 0.7 ? 'good' : 'okay'
      });

      // Reduces boredom
      this.boredomLevel = Math.max(0, this.boredomLevel - 3);

      return {
        completed: true,
        quality: this.ageBasedTraits.responsibility > 0.7 ? 'good' : 'okay',
        mood: 'proud',
        responseText: this.age >= 12 ? 'Done!' : 'I did it!'
      };
    } else {
      // Forgot or got distracted
      return {
        completed: false,
        reason: this.age < 10 ? 'Got distracted' : 'Forgot',
        needsReminder: true
      };
    }
  }

  /**
   * Ask Allie for activity suggestions when bored
   */
  async askAllieForActivity() {
    const requestTypes = [
      'What should I do?',
      'I\'m bored, any ideas?',
      'Can you suggest something fun?',
      'What activities haven\'t I tried?'
    ];

    return {
      request: requestTypes[Math.floor(Math.random() * requestTypes.length)],
      interests: this.interests,
      previousActivities: this.choreCompletionHistory.map(h => h.chore),
      boredomLevel: this.boredomLevel
    };
  }

  /**
   * Update boredom level over time
   */
  tick(minutesElapsed) {
    // Call parent tick for energy/stress
    super.tick(minutesElapsed);

    // Boredom increases when not doing activities
    const minutesSinceActivity = (Date.now() - this.lastActivityChange) / 60000;

    if (minutesSinceActivity > 30) {
      // Boredom increases faster for younger kids
      const boredomRate = (15 - this.age) / 10; // 7yo = 0.8/min, 14yo = 0.1/min
      this.boredomLevel = Math.min(10, this.boredomLevel + (minutesElapsed * boredomRate));
    }

    // Boredom decreases during activities
    const currentChore = this.getCurrentChore();
    if (currentChore) {
      this.boredomLevel = Math.max(0, this.boredomLevel - minutesElapsed * 0.2);
      this.lastActivityChange = Date.now();
    }
  }

  /**
   * Child's transformation through phases (growing responsibility)
   */
  advancePhase(newPhase) {
    this.transformationPhase = newPhase;

    switch (newPhase) {
      case 'integration':
        // Starts developing chore habits with Allie's help
        this.ageBasedTraits.responsibility += 0.10;
        this.personality.helpfulness += 0.15;
        console.log(`📚 ${this.name}: Starting to build helpful habits`);
        break;

      case 'balanced':
        // Consistent chore completion, contributing to family
        this.ageBasedTraits.responsibility += 0.15;
        this.personality.initiative += 0.20;
        this.behaviorPatterns.choreCompletionRate += 0.25;
        console.log(`⭐ ${this.name}: Becoming a reliable contributor`);
        break;

      case 'thriving':
        // Peak performance - helpful, responsible, proud
        this.ageBasedTraits.responsibility += 0.10;
        this.currentState.mood = 'proud';
        console.log(`🏆 ${this.name}: Contributing & Proud`);
        break;
    }

    // Update personality traits based on age-based growth
    this.personality.helpfulness = this.ageBasedTraits.responsibility;
    this.personality.awareness = this.ageBasedTraits.responsibility * 0.8;
    this.personality.followThrough = this.ageBasedTraits.responsibility;
  }

  /**
   * Generate age-appropriate activities
   */
  generateActivities() {
    // Activities vary by age
    if (this.age >= 12) {
      // Teenagers (Lillian)
      return [
        { type: 'sport', name: 'Volleyball', frequency: '2x/week', commitment: 'high' },
        { type: 'hobby', name: 'Plant care', frequency: 'daily', commitment: 'medium' },
        { type: 'social', name: 'Friends', frequency: 'weekends', commitment: 'high' },
        { type: 'school', name: 'Homework', frequency: 'daily', commitment: 'high' }
      ];
    } else if (this.age >= 9) {
      // Tweens (Oly)
      return [
        { type: 'academic', name: 'Science club', frequency: 'weekly', commitment: 'high' },
        { type: 'hobby', name: 'Science experiments', frequency: 'as_wanted', commitment: 'medium' },
        { type: 'study', name: 'Study time', frequency: '4x/week', commitment: 'medium' },
        { type: 'social', name: 'Playdates', frequency: 'occasional', commitment: 'medium' }
      ];
    } else {
      // Young kids (Tegner)
      return [
        { type: 'sport', name: 'Swimming', frequency: 'weekly', commitment: 'medium' },
        { type: 'play', name: 'Science experiments with Oly', frequency: 'as_wanted', commitment: 'high' },
        { type: 'chore', name: 'Morning chore', frequency: '5x/week', commitment: 'low' },
        { type: 'play', name: 'Free play', frequency: 'daily', commitment: 'high' }
      ];
    }
  }

  /**
   * Interact with Allie (age-appropriate)
   */
  async chatWithAllie(message) {
    const responseComplexity = this.age >= 12 ? 'teen' : this.age >= 9 ? 'tween' : 'child';

    const patterns = {
      teen: {
        questionStyle: 'thoughtful',
        responseLength: 'medium',
        topics: ['homework', 'friends', 'activities', 'responsibilities']
      },
      tween: {
        questionStyle: 'curious',
        responseLength: 'short-medium',
        topics: ['science', 'school', 'games', 'siblings']
      },
      child: {
        questionStyle: 'simple',
        responseLength: 'short',
        topics: ['activities', 'boredom', 'play', 'food']
      }
    };

    return {
      messageStyle: patterns[responseComplexity],
      attentionSpan: this.ageBasedTraits.attentionSpan,
      interests: this.interests
    };
  }
}

module.exports = ChildAgent;
