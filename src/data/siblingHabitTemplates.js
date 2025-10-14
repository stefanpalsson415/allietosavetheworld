// Sibling-focused habit templates based on NYT research insights
export const siblingHabitTemplates = {
  // Spillover Effect Habits
  spilloverHabits: [
    {
      id: 'reading_buddies',
      name: 'Reading Buddies',
      category: 'academic_spillover',
      description: 'Older sibling reads with younger sibling for 20 minutes',
      targetAgeGap: [2, 6],
      benefits: {
        olderChild: 'Improves reading fluency and patience',
        youngerChild: 'Accelerates reading development by 40%',
        parentTimeSaved: 2.5 // hours per week
      },
      implementation: {
        frequency: 'daily',
        duration: 20,
        bestTime: 'before_bed',
        materials: ['age-appropriate books', 'cozy reading spot'],
        parentSetup: 5 // minutes
      },
      successMetrics: {
        youngerReadingLevel: '+2 months per month',
        olderConfidence: '+15%',
        siblingBonding: 'high'
      },
      tips: [
        'Let older child choose books sometimes',
        'Create a special reading corner',
        'Celebrate finishing books together'
      ]
    },
    {
      id: 'homework_helper',
      name: 'Homework Helper Hour',
      category: 'academic_spillover',
      description: 'Siblings work on homework together with older helping younger',
      targetAgeGap: [2, 5],
      benefits: {
        olderChild: 'Reinforces own learning through teaching',
        youngerChild: 'Gets personalized help in comfortable setting',
        parentTimeSaved: 3 // hours per week
      },
      implementation: {
        frequency: 'weekdays',
        duration: 45,
        bestTime: 'after_school',
        materials: ['shared workspace', 'extra supplies'],
        parentSetup: 10
      },
      successMetrics: {
        homeworkCompletion: '+95%',
        gradeImprovement: '+1 letter grade',
        parentStress: '-60%'
      }
    },
    {
      id: 'math_games_mentor',
      name: 'Math Games Mentor',
      category: 'academic_spillover',
      description: 'Turn math practice into fun sibling games',
      targetAgeGap: [1, 4],
      benefits: {
        olderChild: 'Strengthens mental math and leadership',
        youngerChild: 'Makes math fun and less intimidating',
        parentTimeSaved: 2 // hours per week
      },
      activities: [
        'Math dice games',
        'Store keeper role play',
        'Math scavenger hunts',
        'Cooking measurements together'
      ]
    }
  ],

  // Natural Teaching Habits
  teachingHabits: [
    {
      id: 'sports_coach',
      name: 'Sibling Sports Coach',
      category: 'athletic_teaching',
      description: 'Older sibling coaches younger in sports basics',
      targetAgeGap: [2, 5],
      benefits: {
        olderChild: 'Develops coaching and patience skills',
        youngerChild: 'Less pressure than formal coaching',
        parentTimeSaved: 4 // hours per week
      },
      sports: [
        { name: 'Soccer', skills: ['dribbling', 'passing', 'shooting'] },
        { name: 'Basketball', skills: ['dribbling', 'shooting form', 'passing'] },
        { name: 'Swimming', skills: ['floating', 'basic strokes', 'water safety'] },
        { name: 'Biking', skills: ['balance', 'steering', 'safety rules'] }
      ],
      implementation: {
        frequency: '3x_week',
        duration: 30,
        location: 'backyard_or_park',
        parentSupervision: 'minimal'
      }
    },
    {
      id: 'music_mentorship',
      name: 'Music Mentorship',
      category: 'creative_teaching',
      description: 'Musical siblings share their skills',
      targetAgeGap: [1, 8],
      activities: [
        'Instrument basics',
        'Rhythm games',
        'Song writing together',
        'Mini concerts for family'
      ],
      benefits: {
        olderChild: 'Reinforces music theory and technique',
        youngerChild: 'Early music exposure with patient teacher',
        parentTimeSaved: 3 // hours per week
      }
    },
    {
      id: 'tech_tutor',
      name: 'Tech Tutor Time',
      category: 'practical_teaching',
      description: 'Older sibling teaches computer skills and digital literacy',
      targetAgeGap: [3, 7],
      skills: [
        'Basic typing',
        'Educational apps',
        'Internet safety',
        'Creative tools (drawing, music apps)',
        'Basic coding games'
      ],
      benefits: {
        olderChild: 'Develops teaching and technical communication',
        youngerChild: 'Learns from peer who understands their level',
        parentTimeSaved: 2.5 // hours per week
      }
    }
  ],

  // Collaboration Habits
  collaborationHabits: [
    {
      id: 'chef_siblings',
      name: 'Chef Siblings',
      category: 'life_skills',
      description: 'Cook or bake together weekly',
      allAges: true,
      activities: [
        'Simple breakfast prep',
        'Sandwich making station',
        'Cookie baking',
        'Salad bar creation',
        'Pizza making night'
      ],
      benefits: {
        allChildren: 'Learn cooking, math, following directions',
        familyBenefit: 'Meal prep help',
        parentTimeSaved: 3 // hours per week
      },
      implementation: {
        frequency: 'weekly',
        duration: 60,
        supervision: 'nearby_but_not_active'
      }
    },
    {
      id: 'sibling_business',
      name: 'Sibling Mini-Business',
      category: 'entrepreneurship',
      description: 'Run a small business together',
      examples: [
        'Lemonade stand',
        'Pet sitting service',
        'Craft sales',
        'Garden produce stand',
        'Car wash service'
      ],
      benefits: {
        allChildren: 'Learn money, teamwork, responsibility',
        parentTimeSaved: 5 // hours per week during active times
      },
      skills: [
        'Money counting',
        'Customer service',
        'Planning and organization',
        'Fair profit sharing',
        'Marketing basics'
      ]
    },
    {
      id: 'room_cleaning_crew',
      name: 'Room Cleaning Crew',
      category: 'responsibility',
      description: 'Siblings team up to clean each others rooms',
      implementation: {
        frequency: 'weekly',
        duration: 30,
        rotation: 'alternate_rooms',
        reward: 'joint_reward_for_both_rooms_clean'
      },
      benefits: {
        allChildren: 'Learn organization and helping others',
        parentTimeSaved: 2 // hours per week
      }
    }
  ],

  // Differentiation Support Habits
  differentiationHabits: [
    {
      id: 'unique_talent_show',
      name: 'Family Talent Showcase',
      category: 'differentiation',
      description: 'Each sibling develops and shares their unique talent monthly',
      format: {
        preparation: 'Individual practice with sibling support',
        presentation: 'Monthly family show',
        roles: 'Rotate MC, lighting, audience'
      },
      benefits: {
        allChildren: 'Celebrates unique strengths, reduces competition',
        familyBenefit: 'Regular family entertainment'
      }
    },
    {
      id: 'expertise_exchange',
      name: 'Expertise Exchange',
      category: 'differentiation',
      description: 'Siblings teach each other their specialty',
      examples: [
        'Artist sibling teaches athlete sibling to draw',
        'Math whiz helps creative sibling with homework',
        'Social butterfly helps shy sibling make friends'
      ],
      implementation: {
        frequency: 'biweekly',
        duration: 45,
        structure: '20min teach, 20min practice, 5min celebrate'
      }
    }
  ],

  // Emotional Support Habits
  emotionalSupportHabits: [
    {
      id: 'sibling_check_in',
      name: 'Sibling Check-in Circle',
      category: 'emotional_support',
      description: 'Weekly emotion sharing and support session',
      structure: {
        opening: 'Rose, thorn, and bud sharing',
        middle: 'Problem solving together',
        closing: 'Appreciation round'
      },
      benefits: {
        allChildren: 'Emotional intelligence and empathy',
        parentTimeSaved: 1.5 // hours per week of emotional labor
      }
    },
    {
      id: 'buddy_system',
      name: 'Sibling Buddy System',
      category: 'emotional_support',
      description: 'Pair siblings for mutual support',
      scenarios: [
        'First day of school',
        'Doctor visits',
        'New activities',
        'Social challenges'
      ],
      implementation: {
        assignment: 'Rotate buddies monthly',
        responsibilities: 'Check in daily, offer encouragement'
      }
    }
  ],

  // Challenge-Based Habits
  challengeHabits: [
    {
      id: 'sibling_olympics',
      name: 'Weekly Sibling Olympics',
      category: 'physical_collaboration',
      description: 'Fun physical challenges that require teamwork',
      challenges: [
        'Three-legged races',
        'Collaborative obstacle courses',
        'Team scavenger hunts',
        'Dance routine creation',
        'Fort building contests'
      ],
      benefits: {
        allChildren: 'Physical activity, teamwork, problem-solving',
        parentTimeSaved: 3 // hours of entertainment planning
      }
    },
    {
      id: 'creative_collaboration',
      name: 'Creative Project Partners',
      category: 'creative_collaboration',
      description: 'Monthly creative projects done together',
      projects: [
        'Stop-motion movie',
        'Comic book creation',
        'Song/rap writing',
        'Science experiments',
        'Invention prototypes'
      ],
      structure: {
        week1: 'Brainstorm and plan',
        week2: 'Create and build',
        week3: 'Refine and practice',
        week4: 'Present to family'
      }
    }
  ]
};

// Helper function to get age-appropriate habits
export const getAgeAppropriateHabits = (child1Age, child2Age) => {
  const ageDiff = Math.abs(child1Age - child2Age);
  const appropriate = [];

  Object.values(siblingHabitTemplates).forEach(category => {
    category.forEach(habit => {
      if (habit.allAges) {
        appropriate.push(habit);
      } else if (habit.targetAgeGap) {
        const [minGap, maxGap] = habit.targetAgeGap;
        if (ageDiff >= minGap && ageDiff <= maxGap) {
          appropriate.push(habit);
        }
      }
    });
  });

  return appropriate;
};

// Helper function to calculate total time saved
export const calculateWeeklyTimeSaved = (selectedHabits) => {
  return selectedHabits.reduce((total, habit) => {
    return total + (habit.benefits?.parentTimeSaved || 0);
  }, 0);
};

// Helper function to get habits by benefit type
export const getHabitsByBenefit = (benefitType) => {
  const habits = [];
  
  Object.values(siblingHabitTemplates).forEach(category => {
    category.forEach(habit => {
      if (benefitType === 'time_saving' && habit.benefits?.parentTimeSaved > 2) {
        habits.push(habit);
      } else if (benefitType === 'academic' && habit.category?.includes('academic')) {
        habits.push(habit);
      } else if (benefitType === 'emotional' && habit.category?.includes('emotional')) {
        habits.push(habit);
      }
    });
  });

  return habits.sort((a, b) => 
    (b.benefits?.parentTimeSaved || 0) - (a.benefits?.parentTimeSaved || 0)
  );
};