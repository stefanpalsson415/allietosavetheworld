// Palsson Family - Year-Long Simulation Data
// Created from year-long simulation (1,819 tasks, 1,325 events)

// ============================================
// FAMILY MEMBERS
// ============================================

// Parents
CREATE (stefan:Person {
  id: 'stefan_palsson_agent',
  name: 'Stefan',
  familyId: 'palsson_family_simulation',
  role: 'parent',
  isParent: true,
  email: 'stefan@palssonfamily.com',
  age: 42,
  cognitiveLoadScore: 0.45,
  stressLevel: 0.52,
  allie_interactions: 450,
  created_at: '2024-01-01T00:00:00Z'
});

CREATE (kimberly:Person {
  id: 'kimberly_palsson_agent',
  name: 'Kimberly',
  familyId: 'palsson_family_simulation',
  role: 'parent',
  isParent: true,
  email: 'kimberly@palssonfamily.com',
  age: 40,
  cognitiveLoadScore: 0.85,
  stressLevel: 0.78,
  allie_interactions: 1240,
  created_at: '2024-01-01T00:00:00Z'
});

// Children
CREATE (oly:Person {
  id: 'oly_palsson_agent',
  name: 'Oly',
  familyId: 'palsson_family_simulation',
  role: 'child',
  isParent: false,
  age: 15,
  grade: '10th',
  interests: ['soccer', 'gaming', 'music'],
  academic_performance: 'good',
  personality_traits: ['athletic', 'social', 'energetic'],
  challenges: ['homework_focus', 'room_cleaning'],
  created_at: '2024-01-01T00:00:00Z'
});

CREATE (lily:Person {
  id: 'lily_palsson_agent',
  name: 'Lily',
  familyId: 'palsson_family_simulation',
  role: 'child',
  isParent: false,
  age: 12,
  grade: '7th',
  interests: ['art', 'reading', 'dance'],
  academic_performance: 'excellent',
  personality_traits: ['creative', 'responsible', 'quiet'],
  challenges: ['social_anxiety', 'perfectionism'],
  created_at: '2024-01-01T00:00:00Z'
});

CREATE (emil:Person {
  id: 'emil_palsson_agent',
  name: 'Emil',
  familyId: 'palsson_family_simulation',
  role: 'child',
  isParent: false,
  age: 9,
  grade: '4th',
  interests: ['lego', 'science', 'sports'],
  academic_performance: 'good',
  personality_traits: ['curious', 'energetic', 'friendly'],
  challenges: ['bedtime_routine', 'attention_span'],
  created_at: '2024-01-01T00:00:00Z'
});

// ============================================
// FAMILY RELATIONSHIPS
// ============================================

MATCH (stefan:Person {id: 'stefan_palsson_agent'})
MATCH (kimberly:Person {id: 'kimberly_palsson_agent'})
MATCH (oly:Person {id: 'oly_palsson_agent'})
MATCH (lily:Person {id: 'lily_palsson_agent'})
MATCH (emil:Person {id: 'emil_palsson_agent'})

CREATE (stefan)-[:PARENT_OF]->(oly);
CREATE (stefan)-[:PARENT_OF]->(lily);
CREATE (stefan)-[:PARENT_OF]->(emil);
CREATE (kimberly)-[:PARENT_OF]->(oly);
CREATE (kimberly)-[:PARENT_OF]->(lily);
CREATE (kimberly)-[:PARENT_OF]->(emil);

// ============================================
// SAMPLE TASKS (Representing 1,819 total tasks)
// ============================================
// NOTE: Upload script will load actual tasks from Firestore
// These are just representative samples to show patterns

// Week 1 - January Tasks
CREATE (task1:Task {
  id: 'task_palsson_jan_week1_school_forms',
  title: 'Complete school permission slips for all 3 kids',
  description: 'Winter field trips - need signatures by Friday',
  familyId: 'palsson_family_simulation',
  priority: 'high',
  status: 'done',
  createdAt: '2024-01-08T20:00:00Z',
  completedAt: '2024-01-10T07:30:00Z',
  createdBy: 'kimberly_palsson_agent',
  assignedTo: 'kimberly_palsson_agent',
  complexityScore: 0.6,
  cognitiveLoad: 0.4,
  conceptionTime: 15,
  planningTime: 25,
  executionTime: 35
});

CREATE (task2:Task {
  id: 'task_palsson_jan_week1_grocery',
  title: 'Weekly grocery shopping',
  description: 'Meal plan for the week + special items for Lily birthday party',
  familyId: 'palsson_family_simulation',
  priority: 'high',
  status: 'done',
  createdAt: '2024-01-06T18:30:00Z',
  completedAt: '2024-01-07T10:00:00Z',
  createdBy: 'kimberly_palsson_agent',
  assignedTo: 'stefan_palsson_agent',
  complexityScore: 0.7,
  cognitiveLoad: 0.5,
  conceptionTime: 30,
  planningTime: 45,
  executionTime: 90
});

// Week 2 - January Tasks
CREATE (task3:Task {
  id: 'task_palsson_jan_week2_dentist',
  title: 'Schedule 6-month dental checkups',
  description: 'All 3 kids need cleanings before summer',
  familyId: 'palsson_family_simulation',
  priority: 'medium',
  status: 'done',
  createdAt: '2024-01-12T09:00:00Z',
  completedAt: '2024-01-15T14:00:00Z',
  createdBy: 'kimberly_palsson_agent',
  assignedTo: 'kimberly_palsson_agent',
  complexityScore: 0.8,
  cognitiveLoad: 0.6,
  conceptionTime: 20,
  planningTime: 40,
  executionTime: 60
});

CREATE (task4:Task {
  id: 'task_palsson_jan_week2_soccer',
  title: 'Register Oly for spring soccer league',
  description: 'Early bird registration ends Friday',
  familyId: 'palsson_family_simulation',
  priority: 'high',
  status: 'done',
  createdAt: '2024-01-13T19:30:00Z',
  completedAt: '2024-01-14T11:00:00Z',
  createdBy: 'kimberly_palsson_agent',
  assignedTo: 'stefan_palsson_agent',
  complexityScore: 0.5,
  cognitiveLoad: 0.3,
  conceptionTime: 10,
  planningTime: 20,
  executionTime: 30
});

// Week 3 - January Tasks
CREATE (task5:Task {
  id: 'task_palsson_jan_week3_birthday',
  title: 'Plan and organize Lily 12th birthday party',
  description: 'Invitations, cake, decorations, activities for 15 kids',
  familyId: 'palsson_family_simulation',
  priority: 'high',
  status: 'done',
  createdAt: '2024-01-15T21:00:00Z',
  completedAt: '2024-01-25T16:00:00Z',
  createdBy: 'kimberly_palsson_agent',
  assignedTo: 'kimberly_palsson_agent',
  complexityScore: 0.9,
  cognitiveLoad: 0.8,
  conceptionTime: 60,
  planningTime: 120,
  executionTime: 240
});

// ============================================
// TASK RELATIONSHIPS
// ============================================

// Task 1 relationships
MATCH (kimberly:Person {id: 'kimberly_palsson_agent'})
MATCH (task1:Task {id: 'task_palsson_jan_week1_school_forms'})
CREATE (kimberly)-[:CREATED]->(task1);
CREATE (kimberly)-[:ANTICIPATES {leadTimeDays: 2}]->(task1);

// Task 2 relationships (Kimberly creates, Stefan executes)
MATCH (kimberly:Person {id: 'kimberly_palsson_agent'})
MATCH (stefan:Person {id: 'stefan_palsson_agent'})
MATCH (task2:Task {id: 'task_palsson_jan_week1_grocery'})
CREATE (kimberly)-[:CREATED]->(task2);
CREATE (kimberly)-[:ANTICIPATES {leadTimeDays: 1}]->(task2);
CREATE (stefan)-[:ASSIGNED_TO]->(task2);

// Task 3 relationships
MATCH (kimberly:Person {id: 'kimberly_palsson_agent'})
MATCH (task3:Task {id: 'task_palsson_jan_week2_dentist'})
CREATE (kimberly)-[:CREATED]->(task3);
CREATE (kimberly)-[:ANTICIPATES {leadTimeDays: 3}]->(task3);

// Task 4 relationships (Kimberly creates, Stefan executes)
MATCH (kimberly:Person {id: 'kimberly_palsson_agent'})
MATCH (stefan:Person {id: 'stefan_palsson_agent'})
MATCH (task4:Task {id: 'task_palsson_jan_week2_soccer'})
CREATE (kimberly)-[:CREATED]->(task4);
CREATE (kimberly)-[:ANTICIPATES {leadTimeDays: 1}]->(task4);
CREATE (stefan)-[:ASSIGNED_TO]->(task4);

// Task 5 relationships
MATCH (kimberly:Person {id: 'kimberly_palsson_agent'})
MATCH (task5:Task {id: 'task_palsson_jan_week3_birthday'})
CREATE (kimberly)-[:CREATED]->(task5);
CREATE (kimberly)-[:ANTICIPATES {leadTimeDays: 10}]->(task5);

// ============================================
// FAIR PLAY RESPONSIBILITIES
// ============================================

// Kimberly's primary responsibilities
CREATE (resp1:Responsibility {
  id: 'resp_palsson_medical',
  name: 'Medical Appointments',
  familyId: 'palsson_family_simulation',
  fair_play_card_id: 'FP_046',
  owner: 'kimberly_palsson_agent',
  conception_owner: 'kimberly_palsson_agent',
  planning_owner: 'kimberly_palsson_agent',
  execution_owner: 'kimberly_palsson_agent',
  full_ownership: true,
  invisible_labor_percentage: 0.75,
  time_investment_per_week: 120,
  created_at: '2024-01-01T00:00:00Z'
});

CREATE (resp2:Responsibility {
  id: 'resp_palsson_school_coordination',
  name: 'School Coordination',
  familyId: 'palsson_family_simulation',
  fair_play_card_id: 'FP_025',
  owner: 'kimberly_palsson_agent',
  conception_owner: 'kimberly_palsson_agent',
  planning_owner: 'kimberly_palsson_agent',
  execution_owner: 'kimberly_palsson_agent',
  full_ownership: true,
  invisible_labor_percentage: 0.8,
  time_investment_per_week: 240,
  created_at: '2024-01-01T00:00:00Z'
});

CREATE (resp3:Responsibility {
  id: 'resp_palsson_meal_planning',
  name: 'Meal Planning',
  familyId: 'palsson_family_simulation',
  fair_play_card_id: 'FP_048',
  owner: 'kimberly_palsson_agent',
  conception_owner: 'kimberly_palsson_agent',
  planning_owner: 'kimberly_palsson_agent',
  execution_owner: 'stefan_palsson_agent',
  full_ownership: false,
  invisible_labor_percentage: 0.65,
  time_investment_per_week: 180,
  created_at: '2024-01-01T00:00:00Z'
});

// Stefan's primary responsibilities
CREATE (resp4:Responsibility {
  id: 'resp_palsson_home_maintenance',
  name: 'Home Maintenance',
  familyId: 'palsson_family_simulation',
  fair_play_card_id: 'FP_015',
  owner: 'stefan_palsson_agent',
  conception_owner: 'stefan_palsson_agent',
  planning_owner: 'stefan_palsson_agent',
  execution_owner: 'stefan_palsson_agent',
  full_ownership: true,
  invisible_labor_percentage: 0.5,
  time_investment_per_week: 120,
  created_at: '2024-01-01T00:00:00Z'
});

CREATE (resp5:Responsibility {
  id: 'resp_palsson_sports_activities',
  name: 'Sports & Activities',
  familyId: 'palsson_family_simulation',
  fair_play_card_id: 'FP_024',
  owner: 'stefan_palsson_agent',
  conception_owner: 'kimberly_palsson_agent',
  planning_owner: 'kimberly_palsson_agent',
  execution_owner: 'stefan_palsson_agent',
  full_ownership: false,
  invisible_labor_percentage: 0.6,
  time_investment_per_week: 200,
  created_at: '2024-01-01T00:00:00Z'
});

// ============================================
// RESPONSIBILITY OWNERSHIP
// ============================================

MATCH (kimberly:Person {id: 'kimberly_palsson_agent'})
MATCH (stefan:Person {id: 'stefan_palsson_agent'})
MATCH (resp1:Responsibility {id: 'resp_palsson_medical'})
MATCH (resp2:Responsibility {id: 'resp_palsson_school_coordination'})
MATCH (resp3:Responsibility {id: 'resp_palsson_meal_planning'})
MATCH (resp4:Responsibility {id: 'resp_palsson_home_maintenance'})
MATCH (resp5:Responsibility {id: 'resp_palsson_sports_activities'})

CREATE (kimberly)-[:OWNS]->(resp1);
CREATE (kimberly)-[:OWNS]->(resp2);
CREATE (kimberly)-[:OWNS]->(resp3);
CREATE (stefan)-[:OWNS]->(resp4);
CREATE (stefan)-[:OWNS]->(resp5);

// ============================================
// VERIFICATION QUERY
// ============================================

RETURN 'Palsson family data loaded successfully!' AS status;
