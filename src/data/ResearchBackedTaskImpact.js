// src/data/ResearchBackedTaskImpact.js

/**
 * Research-Backed Task Impact Mapping
 * 
 * This file maps household tasks to relationship strain impact levels based on
 * empirical research. The impact levels are used in the task weighting system
 * to accurately reflect how different types of work affect family relationships.
 * 
 * Last Updated: 2025-01-28
 */

export const TASK_IMPACT_RESEARCH = {
  citations: {
    carlson2020: {
      authors: "Carlson, D.L., Petts, R.J., & Pepin, J.R.",
      year: 2020,
      title: "Men and Women Agree: During the COVID-19 Pandemic Men Are Doing More at Home",
      journal: "SocArXiv",
      keyFinding: "Routine housework tasks are at the center of gender inequality at home and is the area most contested within couples"
    },
    daminger2019: {
      authors: "Daminger, A.",
      year: 2019,
      title: "The Cognitive Dimension of Household Labor",
      journal: "American Sociological Review",
      keyFinding: "Women complete more total cognitive labor in 26 of 32 couples studied; mental load is a significant source of inequality"
    },
    degroot2020: {
      authors: "DeGroot, J.M. & Vik, T.A.",
      year: 2020,
      title: "The Weight of Our Household Rests on My Shoulders: Inequity in Family Work",
      journal: "Journal of Family Issues",
      keyFinding: "Mental labor is exhausting, frustrating, and energy-consuming, significantly impacting well-being"
    },
    pew2020: {
      authors: "Pew Research Center",
      year: 2020,
      title: "How Americans view gender equality at home",
      keyFinding: "59% of women report doing more household chores vs. only 6% of men; only 38% of women are very satisfied with chore division"
    },
    brighthorizons2017: {
      authors: "Bright Horizons",
      year: 2017,
      title: "Modern Family Index",
      keyFinding: "Nearly 90% of mothers feel solely responsible for organizing family schedules; 72% of working moms feel responsible for kids' schedules"
    },
    sullivan1997: {
      authors: "Sullivan, O.",
      year: 1997,
      title: "Time Waits for No (Wo)Man: An Investigation of the Gendered Experience of Domestic Time",
      journal: "Sociology",
      keyFinding: "Women's leisure time is more frequently interrupted than men's, contributing to chronic stress"
    },
    ogolsky2014: {
      authors: "Ogolsky, B.G., Dennison, R.P., & Monk, J.K.",
      year: 2014,
      title: "The Role of Couple Discrepancies in Cognitive and Behavioral Egalitarianism in Marital Quality",
      journal: "Sex Roles",
      keyFinding: "Couples who agree household labor should be divided equally report higher satisfaction"
    }
  },

  // Quantitative findings from research
  quantitativeFindings: {
    relationshipSatisfactionCorrelations: {
      partnerSatisfaction: 0.56, // r = .56 (p < .001)
      feelingsOfEquity: 0.31,    // r = .31 (p < .001)
      communicationQuality: 0.53  // r = .53 (p < .001)
    },
    workloadIncrease: {
      womenTransitionToParenthood: 64, // percentage increase
      menTransitionToParenthood: 37    // percentage increase
    },
    timeInvestment: {
      womenWeeklyHours: 26, // UK average unpaid housework
      menWeeklyHours: 16    // UK average unpaid housework
    },
    mentalLoadBurden: {
      mothersResponsibleForSchedules: 90, // percentage
      workingMomsBurnout: 52              // percentage
    }
  },

  // Task categories mapped to research-backed impact levels
  taskImpactMapping: {
    // HIGH IMPACT - Tasks most likely to cause relationship strain
    high: {
      description: "Daily repetitive tasks and mental load that research shows cause the most relationship conflict",
      multiplier: 1.3,
      categories: [
        "Daily Cooking and Meal Preparation",
        "Daily Cleaning and Tidying",
        "Laundry and Clothing Management",
        "Dishes and Kitchen Cleanup",
        "Mental Load - Planning and Organizing",
        "Mental Load - Scheduling and Coordination",
        "Mental Load - Anticipating Family Needs",
        "Daily Childcare Routines",
        "Nighttime Parenting Duties",
        "School-Related Planning and Communication"
      ],
      researchBasis: [
        "Carlson et al. (2020) - Routine housework at center of gender inequality",
        "Daminger (2019) - Women complete more cognitive labor in 81% of couples",
        "Pew Research (2020) - Only 38% of women satisfied with chore division"
      ]
    },

    // MEDIUM IMPACT - Tasks with moderate relationship strain
    medium: {
      description: "Invisible tasks and intermittent work that contribute to overall burden",
      multiplier: 1.15,
      categories: [
        "Grocery Shopping and Meal Planning",
        "Household Supply Management",
        "Appointment Scheduling and Management",
        "Deep Cleaning and Organizing",
        "Seasonal Household Tasks",
        "Gift Planning and Holiday Coordination",
        "Extended Family Communication",
        "Pet Care Responsibilities",
        "Bill Payment and Routine Finances",
        "Home Maintenance Coordination"
      ],
      researchBasis: [
        "DeGroot & Vik (2020) - Mental labor is exhausting and energy-consuming",
        "Sullivan (1997) - Women's time more frequently interrupted",
        "Bright Horizons - 72% of moms handle scheduling responsibilities"
      ]
    },

    // LOW IMPACT - Tasks less likely to cause relationship strain
    standard: {
      description: "Gender-neutral or traditionally masculine tasks that cause less conflict",
      multiplier: 1.0,
      categories: [
        "Car Maintenance and Repairs",
        "Yard Work and Lawn Care",
        "Home Repairs and DIY Projects",
        "Major Financial Planning",
        "Investment Management",
        "Vacation Planning (Collaborative)",
        "Major Purchase Decisions",
        "Technology Setup and Maintenance",
        "Garage and Storage Organization",
        "Outdoor Equipment Maintenance"
      ],
      researchBasis: [
        "Gallup data - Men lead in car maintenance (69%) and yardwork (59%)",
        "Daminger (2019) - Decision-making often collaborative",
        "Research shows 'nonroutine' tasks cause less daily conflict"
      ]
    }
  },

  // Helper function to determine impact level for a given task
  getTaskImpactLevel(taskDescription, taskCategory) {
    // Check if task matches high impact categories
    for (const category of this.taskImpactMapping.high.categories) {
      if (taskDescription.toLowerCase().includes(category.toLowerCase()) ||
          taskCategory?.toLowerCase().includes(category.toLowerCase())) {
        return 'high';
      }
    }

    // Check if task matches medium impact categories
    for (const category of this.taskImpactMapping.medium.categories) {
      if (taskDescription.toLowerCase().includes(category.toLowerCase()) ||
          taskCategory?.toLowerCase().includes(category.toLowerCase())) {
        return 'medium';
      }
    }

    // Default to standard impact
    return 'standard';
  },

  // Get multiplier for a given impact level
  getImpactMultiplier(impactLevel) {
    return this.taskImpactMapping[impactLevel]?.multiplier || 1.0;
  },

  // Get research basis for a given impact level
  getResearchBasis(impactLevel) {
    return this.taskImpactMapping[impactLevel]?.researchBasis || [];
  },

  // Key insights for UI display
  keyInsights: [
    {
      title: "Daily Tasks Matter Most",
      insight: "Research shows that daily, repetitive tasks like cooking and cleaning create the most relationship strain when unequally distributed.",
      source: "Carlson et al., 2020"
    },
    {
      title: "Mental Load is Real",
      insight: "90% of mothers feel solely responsible for organizing family schedules, leading to burnout and relationship dissatisfaction.",
      source: "Bright Horizons, 2017"
    },
    {
      title: "Fairness Over Equality",
      insight: "Perceived fairness in task distribution matters more for relationship satisfaction than achieving a perfect 50/50 split.",
      source: "Ogolsky et al., 2014"
    },
    {
      title: "Invisible Work Hurts",
      insight: "Tasks that go unnoticed (planning, organizing, anticipating needs) are exhausting and significantly impact well-being.",
      source: "DeGroot & Vik, 2020"
    }
  ]
};

// Export helper functions for easy use
export const getTaskImpactLevel = (task, category) => 
  TASK_IMPACT_RESEARCH.getTaskImpactLevel(task, category);

export const getImpactMultiplier = (level) => 
  TASK_IMPACT_RESEARCH.getImpactMultiplier(level);

export const getResearchBasis = (level) => 
  TASK_IMPACT_RESEARCH.getResearchBasis(level);

export default TASK_IMPACT_RESEARCH;