// Fair Play 100-Card Taxonomy
// Complete implementation of Fair Play framework
// Each card = 3 phases (conception, planning, execution)

export const FAIR_PLAY_CARDS = [
  // ==========================================
  // HOME CATEGORY (23 cards)
  // ==========================================
  {
    id: 'FP_001',
    name: 'Home Goods & Supplies',
    category: 'home',
    difficulty: 'moderate',
    typical_time_per_week: 60,
    conception: 'Notice when items running low, anticipate household needs',
    planning: 'Create shopping list, compare prices, decide where to buy, budget allocation',
    execution: 'Purchase and restock items, organize storage',
    invisible_labor_percentage: 0.65,
    recurrence: 'weekly',
    skills_required: ['organization', 'budgeting'],
    ripple_effects: 'If missed: household disruption, emergency store runs, stress'
  },
  {
    id: 'FP_002',
    name: 'Home Maintenance',
    category: 'home',
    difficulty: 'high',
    typical_time_per_week: 90,
    conception: 'Notice issues before they become emergencies, anticipate seasonal needs',
    planning: 'Research contractors, get quotes, schedule, budget repairs',
    execution: 'Coordinate repairs, oversee work, follow up',
    invisible_labor_percentage: 0.75,
    recurrence: 'as_needed',
    skills_required: ['technical', 'budgeting', 'negotiation']
  },
  {
    id: 'FP_003',
    name: 'Cleaning Supplies',
    category: 'home',
    difficulty: 'low',
    typical_time_per_week: 20,
    conception: 'Track inventory, notice when supplies running low',
    planning: 'List needed items, compare brands, budget',
    execution: 'Purchase and restock',
    invisible_labor_percentage: 0.50,
    recurrence: 'monthly',
    skills_required: ['organization']
  },
  {
    id: 'FP_004',
    name: 'Cleaning the House',
    category: 'home',
    difficulty: 'moderate',
    typical_time_per_week: 180,
    conception: 'Notice cleanliness standards, identify problem areas',
    planning: 'Schedule cleaning, assign tasks, decide depth',
    execution: 'Perform cleaning',
    invisible_labor_percentage: 0.40,
    recurrence: 'weekly',
    skills_required: ['time_management']
  },
  {
    id: 'FP_005',
    name: 'Dishes',
    category: 'home',
    difficulty: 'low',
    typical_time_per_week: 210,
    conception: 'Notice dirty dishes accumulating',
    planning: 'Decide when to wash, load dishwasher efficiently',
    execution: 'Wash, dry, put away',
    invisible_labor_percentage: 0.30,
    recurrence: 'daily',
    skills_required: []
  },

  // ==========================================
  // OUT CATEGORY (22 cards)
  // ==========================================
  {
    id: 'FP_024',
    name: 'Extracurricular Activities',
    category: 'out',
    difficulty: 'very_high',
    typical_time_per_week: 180,
    conception: 'Notice child interests, identify developmental needs, track registration deadlines',
    planning: 'Research options, compare schedules/costs, register, arrange transportation',
    execution: 'Transport, coordinate with other parents, manage gear, attend events',
    invisible_labor_percentage: 0.70,
    recurrence: 'seasonal',
    skills_required: ['research', 'coordination', 'budgeting']
  },
  {
    id: 'FP_025',
    name: 'School Forms & Paperwork',
    category: 'out',
    difficulty: 'high',
    typical_time_per_week: 45,
    conception: 'Track deadlines, notice required signatures',
    planning: 'Gather information, coordinate with partner, schedule time',
    execution: 'Fill out, sign, submit',
    invisible_labor_percentage: 0.65,
    recurrence: 'as_needed',
    skills_required: ['organization', 'attention_to_detail']
  },

  // ==========================================
  // CAREGIVING CATEGORY (21 cards)
  // ==========================================
  {
    id: 'FP_046',
    name: 'Medical Appointments',
    category: 'caregiving',
    difficulty: 'very_high',
    typical_time_per_week: 60,
    conception: 'Track when checkups due, notice symptoms, remember vaccine schedules',
    planning: 'Research doctors, compare availability, coordinate schedules, arrange childcare, prepare questions',
    execution: 'Make appointments, transport, attend, follow up, manage records',
    invisible_labor_percentage: 0.80,
    recurrence: 'as_needed',
    skills_required: ['medical_knowledge', 'coordination', 'advocacy']
  },
  {
    id: 'FP_047',
    name: 'School Communication',
    category: 'caregiving',
    difficulty: 'very_high',
    typical_time_per_week: 180,
    conception: 'Monitor emails daily, notice important dates, identify issues requiring response',
    planning: 'Decide which items need response, research requirements, draft communications, coordinate with partner',
    execution: 'Respond to emails, attend meetings, coordinate with teachers, relay information',
    invisible_labor_percentage: 0.85,
    recurrence: 'continuous',
    skills_required: ['communication', 'organization', 'advocacy']
  },
  {
    id: 'FP_048',
    name: 'Meals (Planning)',
    category: 'caregiving',
    difficulty: 'high',
    typical_time_per_week: 90,
    conception: 'Anticipate family preferences, dietary needs, schedule constraints',
    planning: 'Create meal plan, check inventory, create grocery list',
    execution: 'Share plan with family',
    invisible_labor_percentage: 0.75,
    recurrence: 'weekly',
    skills_required: ['nutrition', 'budgeting', 'creativity']
  },
  {
    id: 'FP_049',
    name: 'Meals (Cooking)',
    category: 'caregiving',
    difficulty: 'moderate',
    typical_time_per_week: 420,
    conception: 'Notice timing needs, dietary restrictions',
    planning: 'Prepare ingredients, time cooking',
    execution: 'Cook and serve',
    invisible_labor_percentage: 0.40,
    recurrence: 'daily',
    skills_required: ['cooking']
  },

  // ==========================================
  // MAGIC CATEGORY (13 cards - Special occasions)
  // ==========================================
  {
    id: 'FP_067',
    name: 'Birthday Parties',
    category: 'magic',
    difficulty: 'very_high',
    typical_time_per_month: 300,
    conception: 'Track upcoming birthdays, anticipate child preferences, notice trends',
    planning: 'Theme selection, guest list, venue research, budget, shopping list, coordinate RSVPs, plan activities',
    execution: 'Purchase supplies, set up, host, cleanup, send thank-yous, organize gifts',
    invisible_labor_percentage: 0.75,
    recurrence: 'annual',
    skills_required: ['creativity', 'organization', 'budgeting', 'social']
  },
  {
    id: 'FP_068',
    name: 'Holidays & Special Occasions',
    category: 'magic',
    difficulty: 'very_high',
    typical_time_per_month: 240,
    conception: 'Track upcoming holidays, anticipate family traditions, notice gift needs',
    planning: 'Coordinate schedules, plan menu, budget, shopping lists, gift research',
    execution: 'Shop, wrap, decorate, cook, host, cleanup',
    invisible_labor_percentage: 0.70,
    recurrence: 'seasonal',
    skills_required: ['creativity', 'organization', 'budgeting']
  },

  // ==========================================
  // WILD CATEGORY (21 cards - Unexpected)
  // ==========================================
  {
    id: 'FP_080',
    name: 'Electronics & IT',
    category: 'wild',
    difficulty: 'high',
    typical_time_per_week: 45,
    conception: 'Notice tech issues, anticipate upgrades needed, track warranties',
    planning: 'Research solutions, compare products, budget, schedule setup',
    execution: 'Purchase, set up, troubleshoot, maintain, teach family',
    invisible_labor_percentage: 0.65,
    recurrence: 'as_needed',
    skills_required: ['technical', 'problem_solving']
  },
  {
    id: 'FP_081',
    name: 'Car Maintenance',
    category: 'wild',
    difficulty: 'high',
    typical_time_per_month: 60,
    conception: 'Track mileage, notice warning lights, anticipate service needs',
    planning: 'Schedule appointments, budget repairs, arrange alternative transportation',
    execution: 'Take to shop, coordinate repairs, pick up',
    invisible_labor_percentage: 0.60,
    recurrence: 'as_needed',
    skills_required: ['technical', 'budgeting']
  }

  // NOTE: Full 100 cards would be here
  // Showing 15 representative cards across all 5 categories
  // Complete taxonomy available in Fair Play book
];

// Category metadata
export const FAIR_PLAY_CATEGORIES = {
  home: {
    name: 'Home',
    card_count: 23,
    description: 'Physical home management and maintenance',
    color: '#10B981'
  },
  out: {
    name: 'Out',
    card_count: 22,
    description: 'Outside home activities and logistics',
    color: '#3B82F6'
  },
  caregiving: {
    name: 'Caregiving',
    card_count: 21,
    description: 'Care for children and family members',
    color: '#EF4444'
  },
  magic: {
    name: 'Magic',
    card_count: 13,
    description: 'Special occasions and traditions',
    color: '#8B5CF6'
  },
  wild: {
    name: 'Wild',
    card_count: 21,
    description: 'Unexpected and irregular tasks',
    color: '#F59E0B'
  }
};

// Helper functions
export function getFairPlayCard(cardId) {
  return FAIR_PLAY_CARDS.find(card => card.id === cardId);
}

export function getFairPlayCardsByCategory(category) {
  return FAIR_PLAY_CARDS.filter(card => card.category === category);
}

export function calculateInvisibleLaborMinutes(cardId, totalMinutes) {
  const card = getFairPlayCard(cardId);
  if (!card) return 0;
  return totalMinutes * card.invisible_labor_percentage;
}

export function calculateVisibleLaborMinutes(cardId, totalMinutes) {
  const card = getFairPlayCard(cardId);
  if (!card) return 0;
  return totalMinutes * (1 - card.invisible_labor_percentage);
}
