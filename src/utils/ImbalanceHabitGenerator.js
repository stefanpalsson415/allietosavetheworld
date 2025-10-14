// src/utils/ImbalanceHabitGenerator.js

import { SUB_CATEGORY_DEFINITIONS } from './SubCategoryDefinitions';

/**
 * Utility for generating habit recommendations based on specific imbalance categories and subcategories
 */

// Templates for habits by category
const HABIT_TEMPLATES = {
  "Visible Household Tasks": [
    {
      title: "Daily Tidying Team-Up",
      description: "Spend 10 minutes a day tidying a shared space together",
      cue: "After dinner each evening",
      action: "Set a 10-minute timer and tidy together",
      reward: "Enjoy a clean space and shared accomplishment",
      identity: "We share household responsibility fairly",
      category: "Visible Household Tasks",
      explanation: "This habit addresses the imbalance in visible household tasks by creating a consistent, shared responsibility routine.",
      research: "Families who practice daily joint tidying report 35% fewer conflicts about household cleanliness."
    },
    {
      title: "Cooking Role Reversal",
      description: "Switch cooking responsibilities on specific days",
      cue: "On designated days (Tuesday, Thursday, Saturday)",
      action: "The parent who cooks less often prepares the meal",
      reward: "Experience new cooking styles and appreciate each other's efforts",
      identity: "We both contribute to feeding our family",
      category: "Visible Household Tasks",
      explanation: "This habit helps balance the cooking workload by establishing clear days for role reversal.",
      research: "Families with shared cooking responsibilities report 42% better satisfaction with division of household labor."
    },
    {
      title: "Laundry Load Sharing",
      description: "Alternate laundry responsibilities by load type",
      cue: "When laundry basket reaches 75% full",
      action: "Follow the weekly laundry schedule for washing, folding and putting away",
      reward: "Clear laundry baskets and organized clothing storage",
      identity: "We maintain our home together as equals",
      category: "Visible Household Tasks", 
      explanation: "This habit establishes clear ownership of laundry responsibilities to create better balance.",
      research: "Explicit laundry systems reduce mental load for the primary caregiver by up to 27%."
    }
  ],
  "Invisible Household Tasks": [
    {
      title: "Weekly Meal Planning Session",
      description: "Collaborate on planning meals for the upcoming week",
      cue: "Sunday morning during breakfast",
      action: "Spend 20 minutes planning meals and creating a shopping list together",
      reward: "Reduced daily decision fatigue and more organized grocery shopping",
      identity: "We plan ahead to reduce household stress",
      category: "Invisible Household Tasks",
      explanation: "This habit distributes the mental load of meal planning between both parents.",
      research: "Families with consistent meal planning routines report 32% less dinnertime stress and 27% fewer last-minute food decisions."
    },
    {
      title: "Shared Calendar Review",
      description: "Review and update the family calendar together",
      cue: "Every Sunday evening",
      action: "Spend 15 minutes reviewing upcoming events and coordinating logistics",
      reward: "Feeling prepared and aligned on the week ahead",
      identity: "We manage our family schedule as partners",
      category: "Invisible Household Tasks",
      explanation: "This habit distributes the invisible work of schedule management more evenly.",
      research: "Regular calendar reviews reduce scheduling conflicts by 45% and decrease appointment-related stress by 38%."
    },
    {
      title: "Household Supply Management",
      description: "Share responsibility for tracking and restocking household supplies",
      cue: "After using the last of any item",
      action: "Add it to the shared shopping list immediately",
      reward: "Never run out of essential items unexpectedly",
      identity: "We both take responsibility for household needs",
      category: "Invisible Household Tasks",
      explanation: "This habit balances the mental load of tracking and managing household supplies.",
      research: "Shared responsibility for household inventory management reduces one partner's mental load by up to 40%."
    }
  ],
  "Visible Parental Tasks": [
    {
      title: "Morning Routine Tag-Team",
      description: "Alternate specific morning childcare responsibilities",
      cue: "Upon waking up each morning",
      action: "Follow the agreed morning responsibility chart",
      reward: "Smoother mornings with balanced workload",
      identity: "We are equal partners in childcare",
      category: "Visible Parental Tasks",
      explanation: "This habit creates clear ownership of morning childcare tasks to ensure balance.",
      research: "Explicit morning task division reduces parental stress by 30% and morning conflicts by 45%."
    },
    {
      title: "Bedtime Routine Sharing",
      description: "Take turns leading different parts of the bedtime routine",
      cue: "30 minutes before children's bedtime",
      action: "Each parent handles their designated bedtime responsibilities",
      reward: "Quality time with children and shared evening workload",
      identity: "We both actively parent during key transitions",
      category: "Visible Parental Tasks",
      explanation: "This habit ensures both parents participate in the important bedtime ritual.",
      research: "Children whose parents share bedtime routines show 28% better sleep patterns and security attachment."
    },
    {
      title: "Weekend Activity Leadership",
      description: "Alternate planning and leading weekend activities with the children",
      cue: "Friday evening planning session",
      action: "The designated parent plans and leads a weekend activity",
      reward: "More diverse experiences for children and balanced planning load",
      identity: "We both create meaningful experiences for our children",
      category: "Visible Parental Tasks",
      explanation: "This habit balances the responsibility of planning and executing family activities.",
      research: "Children exposed to different parental activity styles show 35% better adaptability and social skills."
    }
  ],
  "Invisible Parental Tasks": [
    {
      title: "School Communication Check-in",
      description: "Share the responsibility of managing school communications",
      cue: "When school emails arrive or every Tuesday and Thursday",
      action: "Review school communications and update the shared notes",
      reward: "Both parents stay informed about school matters",
      identity: "We are equally involved in our children's education",
      category: "Invisible Parental Tasks",
      explanation: "This habit distributes the hidden mental load of tracking school information.",
      research: "Balanced engagement with school communications leads to 47% better academic outcomes for children."
    },
    {
      title: "Child Health Coordination",
      description: "Share the responsibility of tracking and managing children's health needs",
      cue: "Sunday evening check-in",
      action: "Review health calendar, medications, and upcoming appointments together",
      reward: "Peace of mind knowing health needs are covered by both parents",
      identity: "We both take responsibility for our children's wellbeing",
      category: "Invisible Parental Tasks",
      explanation: "This habit ensures both parents are knowledgeable about and involved in health decisions.",
      research: "Children whose parents equally manage health matters show 33% better health outcomes and adherence to care plans."
    },
    {
      title: "Gift and Special Occasion Planning",
      description: "Alternate responsibility for planning gifts and special occasions",
      cue: "One month before birthdays or holidays",
      action: "The designated parent takes lead on planning and preparation",
      reward: "More diverse celebrations and shared mental load",
      identity: "We both create special memories for our family",
      category: "Invisible Parental Tasks",
      explanation: "This habit balances the often-overlooked work of planning celebrations and selecting gifts.",
      research: "Shared responsibility for special occasions reduces one parent's mental load by 38% and increases celebration satisfaction."
    }
  ]
};

// Subcategory-specific habit templates
const SUB_CATEGORY_HABIT_TEMPLATES = {
  "Invisible Parental Tasks": {
    "worrying": [
      {
        title: "Weekly Worry Check-In",
        description: "Share concerns about kids' wellbeing together",
        cue: "Sunday evening after kids are in bed",
        action: "Spend 15 minutes discussing any worries about the children",
        reward: "Shared peace of mind and reduced anxiety burden",
        identity: "We share the emotional load of parenting",
        research: "Parents who share worries report 40% less parenting-related anxiety."
      },
      {
        title: "Child Health Journal",
        description: "Both parents track health observations in a shared journal",
        cue: "After any health-related incident or concern",
        action: "Write observations in the shared health journal",
        reward: "Both parents stay informed about health patterns",
        identity: "We both monitor our children's wellbeing",
        research: "Shared health tracking improves early problem detection by 35%."
      }
    ],
    "planning_ahead": [
      {
        title: "Sunday Schedule Sync",
        description: "Plan the week's kid activities together",
        cue: "Sunday morning over coffee",
        action: "Review and plan all children's activities for the week",
        reward: "No scheduling surprises and shared mental load",
        identity: "We coordinate our children's lives as a team",
        research: "Joint scheduling reduces forgotten appointments by 65%."
      }
    ],
    "remembering": [
      {
        title: "Memory Share System",
        description: "Use a shared app for all child-related reminders",
        cue: "Whenever you think of something to remember",
        action: "Add it to the shared family app immediately",
        reward: "Nothing falls through the cracks",
        identity: "We both take responsibility for remembering",
        research: "Shared reminder systems reduce mental load by 45%."
      }
    ],
    "emotional_support": [
      {
        title: "Emotion Coach Trade-Off",
        description: "Alternate who handles emotional meltdowns",
        cue: "When a child has big feelings",
        action: "Take turns being the primary emotion coach",
        reward: "Both parents develop emotional support skills",
        identity: "We both guide our children through emotions",
        research: "Children with two engaged emotion coaches show 30% better emotional regulation."
      }
    ],
    "anticipating": [
      {
        title: "Needs Prediction Practice",
        description: "Share observations about children's patterns",
        cue: "During evening check-in",
        action: "Share one thing you noticed about each child's needs today",
        reward: "Both parents become attuned to subtle cues",
        identity: "We both anticipate our children's needs",
        research: "Shared observation improves need anticipation accuracy by 40%."
      }
    ],
    "mediating": [
      {
        title: "Conflict Resolution Rotation",
        description: "Take turns mediating sibling disputes",
        cue: "When children argue",
        action: "Alternate who steps in to mediate",
        reward: "Both parents develop mediation skills",
        identity: "We both teach conflict resolution",
        research: "Consistent mediation from both parents reduces sibling conflicts by 25%."
      }
    ]
  },
  "Visible Parental Tasks": {
    "driving": [
      {
        title: "Transportation Tuesday/Thursday",
        description: "Designate driving days for each parent",
        cue: "Weekly schedule planning",
        action: "Each parent owns specific driving days",
        reward: "Predictable schedule and shared driving load",
        identity: "We share transportation duties equally",
        research: "Clear driving schedules reduce last-minute stress by 50%."
      }
    ],
    "homework": [
      {
        title: "Subject Specialization",
        description: "Each parent leads help with specific subjects",
        cue: "Homework time",
        action: "Parent A helps with math/science, Parent B with reading/writing",
        reward: "Children benefit from each parent's strengths",
        identity: "We both support our children's education",
        research: "Subject specialization improves homework efficiency by 35%."
      }
    ],
    "events": [
      {
        title: "Event Attendance Alternation",
        description: "Take turns attending school events",
        cue: "When school events are announced",
        action: "Alternate who attends or both attend when possible",
        reward: "Both parents stay connected to school life",
        identity: "We're both involved in our children's school",
        research: "Equal parent involvement improves children's school engagement by 40%."
      }
    ],
    "meals": [
      {
        title: "Breakfast & Lunch Division",
        description: "One parent owns breakfast, the other lunch prep",
        cue: "Daily meal times",
        action: "Stick to assigned meal responsibilities",
        reward: "Clear ownership and reduced morning stress",
        identity: "We both nourish our children",
        research: "Clear meal responsibilities reduce morning conflicts by 60%."
      }
    ],
    "activities": [
      {
        title: "Activity Leadership Swap",
        description: "Alternate who leads weekend activities",
        cue: "Weekend planning",
        action: "Take turns planning and leading family activities",
        reward: "Children experience both parents' activity styles",
        identity: "We both create fun experiences",
        research: "Varied activity leadership enhances children's adaptability by 30%."
      }
    ],
    "bedtime": [
      {
        title: "Bedtime Story Sharing",
        description: "Alternate bedtime routine nights",
        cue: "7:30 PM each night",
        action: "Follow the bedtime routine schedule",
        reward: "Special bonding time with each parent",
        identity: "We both guide our children to sleep",
        research: "Children with bedtime routines from both parents sleep 25% better."
      }
    ]
  },
  "Invisible Household Tasks": {
    "meal_planning": [
      {
        title: "Menu Planning Monday",
        description: "Plan weekly meals together",
        cue: "Monday evening",
        action: "Spend 20 minutes planning meals and making grocery list",
        reward: "Shared mental load and varied meal ideas",
        identity: "We plan our family's nutrition together",
        research: "Joint meal planning reduces food waste by 30% and decision fatigue by 40%."
      }
    ],
    "scheduling": [
      {
        title: "Calendar Commander Rotation",
        description: "Alternate monthly calendar management",
        cue: "First day of each month",
        action: "Designated parent manages all scheduling that month",
        reward: "Both parents understand scheduling complexity",
        identity: "We both manage our family's time",
        research: "Rotating schedule management increases appreciation by 50%."
      }
    ],
    "research": [
      {
        title: "Research Task Division",
        description: "Split research tasks by category",
        cue: "When research is needed",
        action: "Parent A researches medical/educational, Parent B handles home/activities",
        reward: "Efficient research and shared knowledge load",
        identity: "We both invest time in family decisions",
        research: "Divided research tasks save 3 hours per week on average."
      }
    ],
    "tracking": [
      {
        title: "Supply Scout Sundays",
        description: "Both parents check different areas for needed supplies",
        cue: "Sunday morning",
        action: "Each parent scouts assigned areas and updates shopping list",
        reward: "Never run out of essentials",
        identity: "We both monitor household needs",
        research: "Shared tracking reduces emergency shopping trips by 70%."
      }
    ],
    "organizing": [
      {
        title: "Zone Organization System",
        description: "Each parent owns organization of specific zones",
        cue: "Weekly tidying time",
        action: "Maintain organization in your assigned zones",
        reward: "Consistently organized home",
        identity: "We both create order in our home",
        research: "Zone-based organization reduces clutter arguments by 55%."
      }
    ],
    "budgeting": [
      {
        title: "Financial Friday Check-In",
        description: "Review finances together weekly",
        cue: "Friday after kids' bedtime",
        action: "Spend 30 minutes reviewing budget and expenses",
        reward: "Shared financial awareness and reduced money stress",
        identity: "We manage our finances as partners",
        research: "Weekly financial check-ins reduce money conflicts by 65%."
      }
    ]
  },
  "Visible Household Tasks": {
    "cleaning": [
      {
        title: "Clean Team Time",
        description: "Clean together for 15 minutes daily",
        cue: "After dinner",
        action: "Set timer and clean side-by-side",
        reward: "Faster cleaning and shared accomplishment",
        identity: "We maintain our home together",
        research: "Cleaning together reduces individual cleaning time by 40%."
      }
    ],
    "laundry": [
      {
        title: "Laundry Load Trade-Off",
        description: "Alternate who does complete laundry cycles",
        cue: "When hamper is full",
        action: "Check whose turn and complete full cycle",
        reward: "Equal laundry responsibility",
        identity: "We both keep our family's clothes clean",
        research: "Clear laundry ownership reduces clothing backlog by 50%."
      }
    ],
    "groceries": [
      {
        title: "Grocery Shopping Shifts",
        description: "Alternate weekly grocery runs",
        cue: "Saturday morning",
        action: "Designated shopper handles all grocery shopping",
        reward: "Shared shopping burden and time savings",
        identity: "We both provide for our family",
        research: "Alternating grocery duty saves 2 hours per parent weekly."
      }
    ],
    "cooking": [
      {
        title: "Chef Night Rotation",
        description: "Designated cooking nights for each parent",
        cue: "Meal planning time",
        action: "Each parent cooks on their designated nights",
        reward: "Variety in meals and shared cooking load",
        identity: "We both nourish our family",
        research: "Cooking rotation increases meal satisfaction by 35%."
      }
    ],
    "repairs": [
      {
        title: "Fix-It Friday Partnership",
        description: "Tackle repairs together weekly",
        cue: "Friday evening",
        action: "Work on home repairs as a team",
        reward: "Shared skills and faster repairs",
        identity: "We both maintain our home",
        research: "Joint repair time reduces fix-it backlog by 60%."
      }
    ],
    "yard": [
      {
        title: "Outdoor Task Division",
        description: "Split yard work by task type",
        cue: "Weekend yard work time",
        action: "Each parent owns specific outdoor tasks",
        reward: "Efficient yard maintenance",
        identity: "We both care for our outdoor space",
        research: "Task specialization reduces yard work time by 30%."
      }
    ]
  }
};

/**
 * Generate a habit recommendation based on the most imbalanced category
 * @param {string} category - The category with the greatest imbalance
 * @param {number} imbalancePercent - The percentage of imbalance (0-100)
 * @param {string} dominantRole - Which parent is currently doing more (Mama/Papa)
 * @param {string} currentParentRole - The role of the current user (Mama/Papa)
 * @param {string} subcategory - Optional specific subcategory to target
 * @returns {Object} A habit recommendation with explanation
 */
export const generateHabitForCategory = (category, imbalancePercent, dominantRole, currentParentRole, subcategory = null) => {
  // If subcategory is provided, use subcategory-specific habits
  let templates;
  if (subcategory && SUB_CATEGORY_HABIT_TEMPLATES[category]?.[subcategory]) {
    templates = SUB_CATEGORY_HABIT_TEMPLATES[category][subcategory];
  } else {
    // Fall back to category-level templates
    templates = HABIT_TEMPLATES[category] || HABIT_TEMPLATES["Invisible Household Tasks"];
  }
  
  // If no specific category match, use a general template
  if (!templates || templates.length === 0) {
    return generateDefaultHabit(imbalancePercent, dominantRole, currentParentRole);
  }
  
  // Pick a template randomly to provide variety
  const template = templates[Math.floor(Math.random() * templates.length)];
  
  // Create a unique ID
  const habitId = `imbalance-habit-${Date.now()}`;
  
  // Customize the explanation based on the user's role
  let customExplanation = "";
  
  if (currentParentRole === dominantRole) {
    // This is the parent doing more work
    customExplanation = `This habit was selected because our analysis shows you're handling ${imbalancePercent}% more of the ${category.toLowerCase()} than your partner. This habit will make this work more efficient and help distribute it more evenly.`;
  } else {
    // This is the parent doing less work
    customExplanation = `This habit was selected because our analysis shows your partner is handling ${imbalancePercent}% more of the ${category.toLowerCase()} than you. This habit will help you take on more responsibility in this area.`;
  }
  
  // Generate the complete habit
  return {
    id: habitId,
    title: template.title,
    description: template.description,
    cue: template.cue,
    action: template.action,
    reward: template.reward,
    identity: template.identity,
    category: template.category,
    imbalanceCategory: category,
    imbalancePercent: imbalancePercent,
    dominantRole: dominantRole,
    streak: 0,
    record: 0,
    progress: 0,
    completed: false,
    isUserGenerated: false,
    lastCompleted: null,
    habitExplanation: customExplanation,
    habitResearch: template.research,
    insight: `${customExplanation} ${template.research}`,
    atomicSteps: [
      {
        id: `${habitId}-step-1`,
        title: template.cue,
        description: "Choose a consistent time that works for your schedule",
        completed: false
      },
      {
        id: `${habitId}-step-2`,
        title: template.action,
        description: "Complete this action mindfully and consistently",
        completed: false
      },
      {
        id: `${habitId}-step-3`,
        title: template.reward,
        description: "Take a moment to appreciate this benefit",
        completed: false
      }
    ],
    completionInstances: []
  };
};

/**
 * Generate a default habit recommendation when no specific category is provided
 * @param {number} imbalancePercent - The percentage of overall imbalance (0-100)
 * @param {string} dominantRole - Which parent is currently doing more (Mama/Papa)
 * @param {string} currentParentRole - The role of the current user (Mama/Papa)
 * @returns {Object} A general habit recommendation with explanation
 */
const generateDefaultHabit = (imbalancePercent = 0, dominantRole = "Equal", currentParentRole = "Parent") => {
  // Create a unique ID
  const habitId = `default-habit-${Date.now()}`;
  
  // Default habit focused on mental load sharing
  const title = "Family Task Check-in";
  let explanation = "";
  
  if (imbalancePercent > 10) {
    if (currentParentRole === dominantRole) {
      // This is the parent doing more work
      explanation = `This habit was selected because our analysis shows you're handling ${imbalancePercent}% more of the overall family workload. This check-in habit creates a structured way to balance responsibilities more evenly.`;
    } else {
      // This is the parent doing less work
      explanation = `This habit was selected because our analysis shows your partner is handling ${imbalancePercent}% more of the overall family workload. This check-in habit helps you take on a more balanced share of responsibilities.`;
    }
  } else {
    // Fairly balanced workload
    explanation = "This habit was selected to help maintain your family's balanced workload and establish a formal check-in to prevent future imbalances.";
  }
  
  return {
    id: habitId,
    title: title,
    description: "Weekly review of family task distribution to maintain balance",
    cue: "Sunday evening",
    action: "Spend 15 minutes reviewing the past week's tasks and planning the upcoming week",
    reward: "Peace of mind from clear expectations and balanced workload",
    identity: "We actively maintain balance in our family responsibilities",
    category: "Invisible Household Tasks",
    streak: 0,
    record: 0,
    progress: 0,
    completed: false,
    isUserGenerated: false,
    lastCompleted: null,
    habitExplanation: explanation,
    habitResearch: "Families who conduct regular workload check-ins report 40% fewer conflicts about task division and 35% higher satisfaction with fairness.",
    insight: `${explanation} Families who conduct regular workload check-ins report 40% fewer conflicts about task division and 35% higher satisfaction with fairness.`,
    atomicSteps: [
      {
        id: `${habitId}-step-1`,
        title: "Sunday evening",
        description: "Choose a consistent time when you're both available",
        completed: false
      },
      {
        id: `${habitId}-step-2`,
        title: "Spend 15 minutes reviewing the past week's tasks and planning the upcoming week",
        description: "Use a shared list or calendar to track tasks",
        completed: false
      },
      {
        id: `${habitId}-step-3`,
        title: "Peace of mind from clear expectations and balanced workload",
        description: "Recognize the benefit of clear communication",
        completed: false
      }
    ],
    completionInstances: []
  };
};

/**
 * Generate a habit recommendation based on subcategory imbalance
 * @param {Object} subcategoryData - Data about the imbalanced subcategory
 * @param {string} currentParentRole - The role of the current user (Mama/Papa)
 * @returns {Object} A habit recommendation with explanation
 */
export const generateHabitForSubcategory = (subcategoryData, currentParentRole) => {
  const {
    category,
    subcategoryId,
    subcategoryLabel,
    imbalancePercent,
    dominantRole
  } = subcategoryData;
  
  // Use the subcategory-specific generator
  return generateHabitForCategory(
    category,
    imbalancePercent,
    dominantRole,
    currentParentRole,
    subcategoryId
  );
};

export default {
  generateHabitForCategory,
  generateHabitForSubcategory,
  generateDefaultHabit,
  HABIT_TEMPLATES,
  SUB_CATEGORY_HABIT_TEMPLATES
};