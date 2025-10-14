// src/utils/SubCategoryDefinitions.js

/**
 * Comprehensive definition of all 24 subcategories across the 4 main categories
 * Each subcategory includes metadata for question generation and habit recommendations
 */

export const SUB_CATEGORY_DEFINITIONS = {
  "Invisible Parental Tasks": {
    subcategories: [
      {
        id: 'worrying',
        label: 'Worrying About Kids',
        detail: 'Concerns about health, friendships, development, school performance, and future',
        time: 'Constant mental load',
        questionExamples: [
          "Who worries about whether the children are making friends at school?",
          "Who loses sleep thinking about the children's health or development?",
          "Who researches potential problems the children might face?"
        ],
        weight: { base: 5, emotionalLabor: 'extreme', invisibility: 'completely' }
      },
      {
        id: 'planning_ahead',
        label: 'Planning Kids\' Schedules',
        detail: 'Doctor appointments, school events, activities, playdates, birthday parties',
        time: '1-2 hours/week',
        questionExamples: [
          "Who keeps track of upcoming school events and deadlines?",
          "Who schedules doctor and dentist appointments for the children?",
          "Who coordinates playdates and social activities?"
        ],
        weight: { base: 4, emotionalLabor: 'high', invisibility: 'mostly' }
      },
      {
        id: 'remembering',
        label: 'Remembering Everything',
        detail: 'Permission slips, spirit days, friend birthdays, favorite foods, doctor appointments',
        time: 'Continuous mental energy',
        questionExamples: [
          "Who remembers which child likes which foods?",
          "Who keeps track of permission slips and school forms?",
          "Who remembers classmates' names and birthdays?"
        ],
        weight: { base: 5, emotionalLabor: 'high', invisibility: 'completely' }
      },
      {
        id: 'emotional_support',
        label: 'Emotional Support',
        detail: 'Comforting upset children, building confidence, processing big feelings',
        time: '1-3 hours/day',
        questionExamples: [
          "Who helps children process their emotions when upset?",
          "Who notices when a child needs emotional support?",
          "Who teaches children how to handle difficult feelings?"
        ],
        weight: { base: 5, emotionalLabor: 'extreme', invisibility: 'mostly' }
      },
      {
        id: 'anticipating',
        label: 'Anticipating Needs',
        detail: 'Knowing when they need a snack, rest, or attention before meltdowns',
        time: 'All day awareness',
        questionExamples: [
          "Who notices when children are getting hungry or tired?",
          "Who predicts and prevents meltdowns before they happen?",
          "Who knows which child needs extra attention today?"
        ],
        weight: { base: 4, emotionalLabor: 'high', invisibility: 'completely' }
      },
      {
        id: 'mediating',
        label: 'Mediating Conflicts',
        detail: 'Sibling disputes, friend drama, teaching conflict resolution skills',
        time: '30-60 min/day',
        questionExamples: [
          "Who mediates when siblings fight?",
          "Who helps resolve conflicts with friends?",
          "Who teaches children conflict resolution skills?"
        ],
        weight: { base: 3, emotionalLabor: 'high', invisibility: 'partially' }
      }
    ]
  },
  "Visible Parental Tasks": {
    subcategories: [
      {
        id: 'driving',
        label: 'Driving to Activities',
        detail: 'School dropoffs, sports practice, music lessons, playdates',
        time: '1-2 hours/day',
        questionExamples: [
          "Who drives children to school?",
          "Who handles transportation to extracurricular activities?",
          "Who drives for playdates and social events?"
        ],
        weight: { base: 4, emotionalLabor: 'minimal', invisibility: 'highly_visible' }
      },
      {
        id: 'homework',
        label: 'Homework Help',
        detail: 'Checking assignments, explaining concepts, project assistance, reading together',
        time: '30-90 min/day',
        questionExamples: [
          "Who helps with daily homework?",
          "Who assists with school projects?",
          "Who reads with the children?"
        ],
        weight: { base: 3, emotionalLabor: 'moderate', invisibility: 'highly_visible' }
      },
      {
        id: 'events',
        label: 'Attending School Events',
        detail: 'School plays, sports games, parent-teacher conferences, field trips',
        time: '3-5 hours/week',
        questionExamples: [
          "Who attends parent-teacher conferences?",
          "Who goes to school performances and events?",
          "Who volunteers for field trips?"
        ],
        weight: { base: 2, emotionalLabor: 'minimal', invisibility: 'highly_visible' }
      },
      {
        id: 'meals',
        label: 'Making Kids\' Meals',
        detail: 'Breakfast prep, packing lunches, snacks, special dietary needs',
        time: '1-2 hours/day',
        questionExamples: [
          "Who makes breakfast for the children?",
          "Who packs school lunches?",
          "Who prepares snacks and manages dietary restrictions?"
        ],
        weight: { base: 4, emotionalLabor: 'moderate', invisibility: 'highly_visible' }
      },
      {
        id: 'activities',
        label: 'Activity Supervision',
        detail: 'Playdates, park visits, crafts, sports practice, screen time monitoring',
        time: '2-4 hours/day',
        questionExamples: [
          "Who supervises outdoor play?",
          "Who manages screen time limits?",
          "Who organizes craft activities?"
        ],
        weight: { base: 4, emotionalLabor: 'moderate', invisibility: 'highly_visible' }
      },
      {
        id: 'bedtime',
        label: 'Bedtime Routines',
        detail: 'Bath time, story reading, tucking in, and getting kids settled for sleep',
        time: '45-60 min/night',
        questionExamples: [
          "Who handles bath time?",
          "Who reads bedtime stories?",
          "Who manages the bedtime routine?"
        ],
        weight: { base: 3, emotionalLabor: 'moderate', invisibility: 'highly_visible' }
      }
    ]
  },
  "Invisible Household Tasks": {
    subcategories: [
      {
        id: 'meal_planning',
        label: 'Meal Planning',
        detail: 'Planning weekly meals, dietary needs, grocery lists, recipe research',
        time: '1-2 hours/week',
        questionExamples: [
          "Who plans what meals to cook each week?",
          "Who creates the grocery shopping list?",
          "Who researches new recipes?"
        ],
        weight: { base: 3, emotionalLabor: 'moderate', invisibility: 'completely' }
      },
      {
        id: 'scheduling',
        label: 'Managing Schedules',
        detail: 'Coordinating family calendars, appointments, and avoiding conflicts',
        time: '30-45 min/day',
        questionExamples: [
          "Who maintains the family calendar?",
          "Who coordinates everyone's schedules?",
          "Who prevents scheduling conflicts?"
        ],
        weight: { base: 4, emotionalLabor: 'high', invisibility: 'completely' }
      },
      {
        id: 'research',
        label: 'Researching Services',
        detail: 'Finding contractors, comparing prices, reading reviews, getting quotes',
        time: '2-3 hours/week',
        questionExamples: [
          "Who researches service providers?",
          "Who compares prices and reads reviews?",
          "Who schedules home maintenance?"
        ],
        weight: { base: 3, emotionalLabor: 'moderate', invisibility: 'completely' }
      },
      {
        id: 'tracking',
        label: 'Tracking Household Needs',
        detail: 'Monitoring supplies, maintenance schedules, expiration dates',
        time: '20-30 min/day',
        questionExamples: [
          "Who notices when household supplies run low?",
          "Who tracks home maintenance needs?",
          "Who monitors expiration dates?"
        ],
        weight: { base: 3, emotionalLabor: 'minimal', invisibility: 'completely' }
      },
      {
        id: 'organizing',
        label: 'Organizing Systems',
        detail: 'Creating and maintaining household routines, storage, paperwork systems',
        time: '1-2 hours/week',
        questionExamples: [
          "Who organizes household paperwork?",
          "Who creates and maintains filing systems?",
          "Who establishes household routines?"
        ],
        weight: { base: 3, emotionalLabor: 'moderate', invisibility: 'mostly' }
      },
      {
        id: 'budgeting',
        label: 'Financial Planning',
        detail: 'Managing family budget, bills, savings, expenses, and financial goals',
        time: '1-2 hours/week',
        questionExamples: [
          "Who manages the household budget?",
          "Who pays the bills?",
          "Who tracks family expenses?"
        ],
        weight: { base: 4, emotionalLabor: 'high', invisibility: 'completely' }
      }
    ]
  },
  "Visible Household Tasks": {
    subcategories: [
      {
        id: 'cleaning',
        label: 'Cleaning',
        detail: 'Daily tidying, weekly deep cleans, maintaining organized spaces',
        time: '1-2 hours/day',
        questionExamples: [
          "Who cleans the kitchen after meals?",
          "Who vacuums and mops floors?",
          "Who cleans bathrooms?"
        ],
        weight: { base: 4, emotionalLabor: 'minimal', invisibility: 'highly_visible' }
      },
      {
        id: 'laundry',
        label: 'Laundry',
        detail: 'Washing, drying, folding, and putting away family clothes and linens',
        time: '45-60 min/load',
        questionExamples: [
          "Who washes the clothes?",
          "Who folds and puts away laundry?",
          "Who manages bedding and towels?"
        ],
        weight: { base: 3, emotionalLabor: 'minimal', invisibility: 'highly_visible' }
      },
      {
        id: 'groceries',
        label: 'Grocery Shopping',
        detail: 'Shopping for food and household items, putting groceries away',
        time: '2-3 hours/week',
        questionExamples: [
          "Who does the grocery shopping?",
          "Who puts groceries away?",
          "Who shops for household supplies?"
        ],
        weight: { base: 3, emotionalLabor: 'minimal', invisibility: 'highly_visible' }
      },
      {
        id: 'cooking',
        label: 'Cooking',
        detail: 'Preparing meals, cooking dinner, meal prep for the week',
        time: '1-2 hours/day',
        questionExamples: [
          "Who cooks dinner?",
          "Who prepares breakfast?",
          "Who does meal prep?"
        ],
        weight: { base: 4, emotionalLabor: 'moderate', invisibility: 'highly_visible' }
      },
      {
        id: 'repairs',
        label: 'Home Repairs',
        detail: 'Fixing things, basic maintenance, meeting repair people',
        time: '2-4 hours/week',
        questionExamples: [
          "Who fixes things when they break?",
          "Who handles home maintenance?",
          "Who meets with repair services?"
        ],
        weight: { base: 2, emotionalLabor: 'minimal', invisibility: 'highly_visible' }
      },
      {
        id: 'yard',
        label: 'Yard Work',
        detail: 'Mowing, gardening, snow removal, outdoor maintenance',
        time: '2-3 hours/week',
        questionExamples: [
          "Who mows the lawn?",
          "Who maintains the garden?",
          "Who handles snow removal?"
        ],
        weight: { base: 3, emotionalLabor: 'minimal', invisibility: 'highly_visible' }
      }
    ]
  }
};

/**
 * Get all subcategories as a flat array
 */
export const getAllSubCategories = () => {
  const allSubCategories = [];
  Object.entries(SUB_CATEGORY_DEFINITIONS).forEach(([category, data]) => {
    data.subcategories.forEach(sub => {
      allSubCategories.push({
        ...sub,
        parentCategory: category
      });
    });
  });
  return allSubCategories;
};

/**
 * Get subcategory by ID
 */
export const getSubCategoryById = (subcategoryId) => {
  for (const [category, data] of Object.entries(SUB_CATEGORY_DEFINITIONS)) {
    const found = data.subcategories.find(sub => sub.id === subcategoryId);
    if (found) {
      return {
        ...found,
        parentCategory: category
      };
    }
  }
  return null;
};

/**
 * Get question distribution for survey generation
 * For 72 questions: 3 per subcategory
 * For 20 questions: ~1 per subcategory with priority weighting
 */
export const getQuestionDistribution = (totalQuestions = 72) => {
  const distribution = {};
  const subcategoryCount = 24;
  const baseQuestionsPerSubcategory = Math.floor(totalQuestions / subcategoryCount);
  const remainder = totalQuestions % subcategoryCount;
  
  let questionIndex = 0;
  Object.entries(SUB_CATEGORY_DEFINITIONS).forEach(([category, data]) => {
    distribution[category] = {};
    data.subcategories.forEach((sub, index) => {
      // Add base questions
      distribution[category][sub.id] = baseQuestionsPerSubcategory;
      
      // Distribute remainder to high-weight subcategories
      if (questionIndex < remainder && sub.weight.base >= 4) {
        distribution[category][sub.id]++;
        questionIndex++;
      }
    });
  });
  
  return distribution;
};

export default SUB_CATEGORY_DEFINITIONS;