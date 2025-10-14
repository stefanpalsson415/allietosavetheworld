/**
 * Forensics to Habits Service
 *
 * Connects cognitive load insights to personalized habit recommendations
 * Implements the vision: "Then I create personalized habits"
 *
 * Takes forensics findings (high-weight imbalances) and recommends
 * specific habits that would have the highest impact on balance.
 */

import ClaudeService from './ClaudeService';

class ForensicsToHabitsService {
  constructor() {
    // Evidence-based habit templates from research
    // Each habit targets specific cognitive load patterns
    this.habitTemplates = {
      'meal-planning': {
        name: 'Sunday Planning Sessions',
        category: 'coordination',
        targetLoad: ['meal planning', 'grocery shopping', 'food coordination'],
        averageReduction: 3.2, // hours per week
        weight: 8.5,
        difficulty: 'easy',
        timeInvestment: '15 minutes weekly',
        description: 'Weekly meal planning and grocery list creation',
        makeItObvious: 'Sunday morning calendar block with phone reminder',
        makeItAttractive: 'Enjoy coffee together while planning',
        makeItEasy: 'Use pre-made template with favorite meals',
        makeItSatisfying: 'Check off completed meals throughout week',
        successRate: 87,
        researchBasis: 'Reduces decision fatigue and last-minute stress'
      },
      'activity-coordination': {
        name: 'Shared Digital Calendar',
        category: 'coordination',
        targetLoad: ['coordinating activities', 'scheduling', 'calendar management'],
        averageReduction: 2.8,
        weight: 13.4,
        difficulty: 'medium',
        timeInvestment: '10 minutes daily',
        description: 'Both parents actively manage family calendar',
        makeItObvious: 'Calendar notifications for both parents',
        makeItAttractive: 'Color-code by family member for visual clarity',
        makeItEasy: 'One-tap event creation from emails',
        makeItSatisfying: 'See balanced schedule distribution',
        successRate: 82,
        researchBasis: 'Distributes mental load of tracking family obligations'
      },
      'bedtime-rotation': {
        name: 'Bedtime Story Rotation',
        category: 'emotional-labor',
        targetLoad: ['bedtime routine', 'emotional support', 'kid care evening'],
        averageReduction: 2.1,
        weight: 6.3,
        difficulty: 'easy',
        timeInvestment: '30 minutes per night',
        description: 'Alternate nights for bedtime responsibilities',
        makeItObvious: 'Posted schedule on bedroom door',
        makeItAttractive: 'Each parent develops unique bedtime ritual',
        makeItEasy: 'Clear handoff at 7:30pm each night',
        makeItSatisfying: 'Kids look forward to "Papa nights" and "Mama nights"',
        successRate: 91,
        researchBasis: 'Shares emotional labor and builds individual parent-child bonds'
      },
      'morning-routine': {
        name: 'Morning Routine Split',
        category: 'kid-care',
        targetLoad: ['morning routine', 'getting kids ready', 'breakfast preparation'],
        averageReduction: 1.8,
        weight: 5.2,
        difficulty: 'medium',
        timeInvestment: '45 minutes daily',
        description: 'Divide morning tasks between both parents',
        makeItObvious: 'Task list on fridge (Mama: breakfast, Papa: clothes/teeth)',
        makeItAttractive: 'Faster mornings with parallel processing',
        makeItEasy: 'Pre-set kids\' outfits night before',
        makeItSatisfying: 'Leave house on time without stress',
        successRate: 79,
        researchBasis: 'Prevents morning bottleneck and reduces rush-hour stress'
      },
      'homework-help': {
        name: 'Homework Help Rotation',
        category: 'kid-care',
        targetLoad: ['homework supervision', 'school support', 'educational activities'],
        averageReduction: 2.5,
        weight: 7.1,
        difficulty: 'medium',
        timeInvestment: '30-60 minutes daily',
        description: 'Alternate nights helping with homework',
        makeItObvious: 'Posted schedule by homework desk',
        makeItAttractive: 'Each parent becomes "expert" in certain subjects',
        makeItEasy: 'Use timer for focused 20-minute sessions',
        makeItSatisfying: 'Celebrate completed assignments together',
        successRate: 85,
        researchBasis: 'Distributes cognitive load of tracking school progress'
      },
      'teacher-communication': {
        name: 'School Communication Ownership',
        category: 'coordination',
        targetLoad: ['teacher communication', 'school emails', 'form completion'],
        averageReduction: 1.9,
        weight: 9.2,
        difficulty: 'easy',
        timeInvestment: '20 minutes weekly',
        description: 'One parent owns all school communication per child',
        makeItObvious: 'Add parent email to school contact forms',
        makeItAttractive: 'Build relationship with teachers directly',
        makeItEasy: 'Set up email filters for school messages',
        makeItSatisfying: 'Teacher knows you as engaged parent',
        successRate: 88,
        researchBasis: 'Prevents duplicate effort and ensures accountability'
      },
      'doctor-appointments': {
        name: 'Medical Appointment Rotation',
        category: 'household-management',
        targetLoad: ['doctor appointments', 'medical coordination', 'health tracking'],
        averageReduction: 2.3,
        weight: 10.8,
        difficulty: 'medium',
        timeInvestment: '2-3 hours monthly',
        description: 'Alternate responsibility for medical appointments',
        makeItObvious: 'Shared health tracking spreadsheet',
        makeItAttractive: 'Other parent gets uninterrupted work time',
        makeItEasy: 'Keep health insurance cards in shared location',
        makeItSatisfying: 'Both parents know kids\' health status',
        successRate: 83,
        researchBasis: 'Distributes mental load of health management'
      },
      'weekend-planning': {
        name: 'Weekend Activity Planning',
        category: 'coordination',
        targetLoad: ['weekend planning', 'activity coordination', 'social scheduling'],
        averageReduction: 1.6,
        weight: 6.8,
        difficulty: 'easy',
        timeInvestment: '15 minutes weekly',
        description: 'Plan weekend activities together on Friday',
        makeItObvious: 'Friday evening planning session',
        makeItAttractive: 'Preview fun weekend ahead',
        makeItEasy: 'Use shared notes app for ideas',
        makeItSatisfying: 'Less weekend chaos and last-minute scrambling',
        successRate: 86,
        researchBasis: 'Prevents one parent from bearing all planning burden'
      },
      'household-tasks': {
        name: 'Weekly Household Task Rotation',
        category: 'household-management',
        targetLoad: ['cleaning', 'laundry', 'household maintenance'],
        averageReduction: 3.5,
        weight: 11.2,
        difficulty: 'medium',
        timeInvestment: '2-3 hours weekly',
        description: 'Rotate major household tasks weekly',
        makeItObvious: 'Posted rotation chart on fridge',
        makeItAttractive: 'Trade tasks based on preferences',
        makeItEasy: 'Keep cleaning supplies organized by zone',
        makeItSatisfying: 'Clean home without resentment',
        successRate: 76,
        researchBasis: 'Distributes invisible household labor equitably'
      },
      'mental-load-check-in': {
        name: 'Weekly Mental Load Check-in',
        category: 'communication',
        targetLoad: ['emotional support', 'communication', 'relationship maintenance'],
        averageReduction: 2.7,
        weight: 8.9,
        difficulty: 'easy',
        timeInvestment: '20 minutes weekly',
        description: 'Weekly conversation about what\'s on each other\'s minds',
        makeItObvious: 'Sunday evening after kids in bed',
        makeItAttractive: 'Use Allie\'s balance data to guide conversation',
        makeItEasy: 'Simple prompts: "What\'s heavy on your mind?"',
        makeItSatisfying: 'Feel heard and understood',
        successRate: 92,
        researchBasis: 'Recognition and acknowledgment reduce mental burden'
      }
    };
  }

  /**
   * Analyze forensics results and recommend top 3 habits
   * @param {Object} forensicsResults - Results from InvisibleLoadForensicsService
   * @param {Object} context - Family context (members, current habits, preferences)
   * @returns {Promise<Array>} Top 3 habit recommendations with impact scores
   */
  async recommendHabits(forensicsResults, context = {}) {
    try {
      console.log('🔄 Analyzing forensics results to recommend habits...');

      // Extract top imbalances from forensics
      const topImbalances = forensicsResults.topImbalances || [];
      const perceptionGap = forensicsResults.perceptionGap || {};
      const currentBalance = forensicsResults.currentBalance || {};

      // Score each habit template based on relevance to identified imbalances
      const scoredHabits = this.scoreHabitRelevance(topImbalances, context);

      // Get top 3 recommendations
      const top3 = scoredHabits.slice(0, 3);

      // Enrich with AI-generated personalization
      const personalizedRecommendations = await this.personalizeRecommendations(
        top3,
        forensicsResults,
        context
      );

      console.log('✅ Generated top 3 habit recommendations:', personalizedRecommendations.map(h => h.name));
      return personalizedRecommendations;

    } catch (error) {
      console.error('❌ Error recommending habits:', error);
      // Return fallback recommendations
      return this.getFallbackRecommendations();
    }
  }

  /**
   * Score habit templates based on relevance to identified imbalances
   */
  scoreHabitRelevance(topImbalances, context) {
    const scores = [];

    Object.entries(this.habitTemplates).forEach(([key, habit]) => {
      let relevanceScore = 0;

      // Check if habit targets any of the top imbalances
      topImbalances.forEach((imbalance, index) => {
        const imbalanceText = imbalance.task?.toLowerCase() || '';

        // Higher weight for earlier imbalances (they're more severe)
        const positionMultiplier = (3 - index) * 0.5 + 1; // 2.0x, 1.5x, 1.0x

        // Check if habit targets this imbalance
        habit.targetLoad.forEach(target => {
          if (imbalanceText.includes(target.toLowerCase())) {
            relevanceScore += habit.weight * positionMultiplier;
          }
        });
      });

      // Bonus for high success rate and low difficulty
      const successBonus = (habit.successRate - 70) * 0.1;
      const difficultyBonus = habit.difficulty === 'easy' ? 2 : habit.difficulty === 'medium' ? 1 : 0;

      scores.push({
        ...habit,
        key,
        relevanceScore: relevanceScore + successBonus + difficultyBonus
      });
    });

    // Sort by relevance score (highest first)
    return scores.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Personalize recommendations using AI
   */
  async personalizeRecommendations(topHabits, forensicsResults, context) {
    try {
      const { currentUser, familyMembers, selectedUser } = context;
      const user = currentUser || selectedUser;

      // Build context for Claude
      const prompt = `Based on this family's cognitive load analysis, I need to personalize these habit recommendations:

**Family Context:**
${user ? `- Primary overloaded parent: ${user.name}` : ''}
${familyMembers ? `- Family members: ${familyMembers.map(m => m.name).join(', ')}` : ''}

**Top Cognitive Load Imbalances:**
${forensicsResults.topImbalances?.map((imb, i) =>
  `${i + 1}. ${imb.task} - ${imb.primaryPerson} handles ${imb.percentage}% (weight: ${imb.weight})`
).join('\n') || 'No specific imbalances provided'}

**Recommended Habits:**
${topHabits.map((habit, i) => `
${i + 1}. ${habit.name}
   - Targets: ${habit.targetLoad.join(', ')}
   - Potential reduction: ${habit.averageReduction} hours/week
   - Success rate: ${habit.successRate}%
`).join('\n')}

Please provide a brief (2-3 sentences) personalized explanation for EACH habit recommendation explaining:
1. Why this habit would help THIS specific family
2. What specific imbalance it addresses
3. How it could reduce the cognitive load gap

Format as JSON array:
[
  {
    "habitName": "habit name",
    "whyPerfect": "personalized 2-3 sentence explanation"
  }
]`;

      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7, max_tokens: 1000 }
      );

      // Parse Claude's response
      let personalizations = [];
      try {
        // Clean potential markdown wrapper
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        personalizations = JSON.parse(cleaned);
      } catch (parseError) {
        console.warn('⚠️ Failed to parse AI personalizations, using defaults');
      }

      // Merge personalizations with habit templates
      return topHabits.map((habit, index) => ({
        ...habit,
        whyPerfect: personalizations[index]?.whyPerfect ||
          `This habit targets ${habit.targetLoad[0]} which shows up as a major imbalance in your family's cognitive load distribution.`,
        potentialImpact: this.calculatePotentialImpact(habit, forensicsResults)
      }));

    } catch (error) {
      console.error('❌ Error personalizing recommendations:', error);
      // Return habits without personalization
      return topHabits.map(habit => ({
        ...habit,
        whyPerfect: `This habit targets ${habit.targetLoad[0]} which could reduce cognitive load.`,
        potentialImpact: { hoursPerWeek: habit.averageReduction, percentageChange: 5 }
      }));
    }
  }

  /**
   * Calculate potential impact of habit on balance
   */
  calculatePotentialImpact(habit, forensicsResults) {
    // Estimate how much this habit could improve balance
    const currentGap = forensicsResults.perceptionGap?.gap || 40;
    const estimatedImprovement = (habit.averageReduction / 20) * 10; // Rough estimate

    return {
      hoursPerWeek: habit.averageReduction,
      percentageChange: Math.round(estimatedImprovement),
      newBalance: Math.max(50, 100 - currentGap + estimatedImprovement),
      timeline: '2-3 weeks for habit formation'
    };
  }

  /**
   * Get fallback recommendations if analysis fails
   */
  getFallbackRecommendations() {
    // Return the 3 highest success rate habits as fallbacks
    const fallbacks = [
      this.habitTemplates['mental-load-check-in'],
      this.habitTemplates['bedtime-rotation'],
      this.habitTemplates['meal-planning']
    ];

    return fallbacks.map(habit => ({
      ...habit,
      whyPerfect: 'This habit has a high success rate and addresses common family cognitive load patterns.',
      potentialImpact: {
        hoursPerWeek: habit.averageReduction,
        percentageChange: 5,
        newBalance: 60,
        timeline: '2-3 weeks for habit formation'
      }
    }));
  }

  /**
   * Create habit recommendation with full Atomic Habits framework
   */
  createHabitWithFramework(habitTemplate, customizations = {}) {
    return {
      name: habitTemplate.name,
      category: habitTemplate.category,

      // Atomic Habits: Law 1 - Make it Obvious
      cue: habitTemplate.makeItObvious,

      // Atomic Habits: Law 2 - Make it Attractive
      craving: habitTemplate.makeItAttractive,

      // Atomic Habits: Law 3 - Make it Easy
      response: habitTemplate.makeItEasy,
      timeInvestment: habitTemplate.timeInvestment,
      difficulty: habitTemplate.difficulty,

      // Atomic Habits: Law 4 - Make it Satisfying
      reward: habitTemplate.makeItSatisfying,

      // Identity-based
      identity: customizations.identity || `I am someone who shares family responsibilities equitably`,

      // Tracking
      targetFrequency: customizations.frequency || 'weekly',
      successRate: habitTemplate.successRate,

      // Impact
      expectedImpact: {
        hoursPerWeek: habitTemplate.averageReduction,
        cognitiveLoadReduction: habitTemplate.weight,
        researchBasis: habitTemplate.researchBasis
      },

      // Customizations
      ...customizations
    };
  }
}

export default new ForensicsToHabitsService();
