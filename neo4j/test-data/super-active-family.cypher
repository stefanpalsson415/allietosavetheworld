// Super-Active Family - 100 Days of Heavy Allie Usage
// The Rodriguez Family: 2 parents, 3 kids, extensive interaction history
//
// Data includes:
// - 4 complete interview rounds
// - 100+ calendar events
// - 150+ tasks
// - 50+ documents
// - Daily habits tracked for 100 days
// - Email/SMS interactions
// - Multiple surveys completed
//
// This family uses Allie multiple times per day for 100 days!

// ============================================
// FAMILY MEMBERS
// ============================================

// Parent 1: Maria Rodriguez (Primary Caregiver, High Invisible Labor Burden)
CREATE (maria:Person {
  id: 'parent_maria_rodriguez',
  familyId: 'rodriguez_family_001',
  name: 'Maria Rodriguez',
  email: 'maria@rodriguez.family',
  role: 'primary_caregiver',
  age: 38,
  isParent: true,
  cognitiveLoadScore: 0.78,  // Very high burden
  stressLevel: 0.71,
  skills: ['organization', 'communication', 'medical_knowledge', 'teaching', 'project_management'],
  allie_interactions: 847,  // Used Allie 847 times in 100 days
  created_at: '2024-07-10T00:00:00Z'
});

// Parent 2: Carlos Rodriguez (Secondary Caregiver, Technical Work)
CREATE (carlos:Person {
  id: 'parent_carlos_rodriguez',
  familyId: 'rodriguez_family_001',
  name: 'Carlos Rodriguez',
  email: 'carlos@rodriguez.family',
  role: 'secondary_caregiver',
  age: 40,
  isParent: true,
  cognitiveLoadScore: 0.42,  // Moderate burden
  stressLevel: 0.38,
  skills: ['tech_support', 'home_maintenance', 'cooking', 'financial_planning'],
  allie_interactions: 423,  // Used Allie 423 times in 100 days
  created_at: '2024-07-10T00:00:00Z'
});

// Child 1: Sofia Rodriguez (14, Responsible oldest)
CREATE (sofia:Person {
  id: 'child_sofia_rodriguez',
  familyId: 'rodriguez_family_001',
  name: 'Sofia Rodriguez',
  age: 14,
  grade: '9th',
  isParent: false,
  role: 'child',
  personality_traits: ['responsible', 'academic', 'introverted', 'creative'],
  interests: ['debate', 'writing', 'coding', 'photography', 'volunteer_work'],
  challenges: ['perfectionism', 'social_anxiety', 'teen_independence_struggles'],
  academic_performance: 'excellent',
  created_at: '2024-07-10T00:00:00Z'
});

// Child 2: Diego Rodriguez (11, Energetic middle child)
CREATE (diego:Person {
  id: 'child_diego_rodriguez',
  familyId: 'rodriguez_family_001',
  name: 'Diego Rodriguez',
  age: 11,
  grade: '6th',
  isParent: false,
  role: 'child',
  personality_traits: ['energetic', 'social', 'athletic', 'spontaneous'],
  interests: ['soccer', 'basketball', 'video_games', 'skateboarding', 'drums'],
  challenges: ['focus_issues', 'homework_resistance', 'sibling_rivalry'],
  academic_performance: 'average',
  created_at: '2024-07-10T00:00:00Z'
});

// Child 3: Luna Rodriguez (7, Sensitive youngest)
CREATE (luna:Person {
  id: 'child_luna_rodriguez',
  familyId: 'rodriguez_family_001',
  name: 'Luna Rodriguez',
  age: 7,
  grade: '2nd',
  isParent: false,
  role: 'child',
  personality_traits: ['sensitive', 'imaginative', 'empathetic', 'shy'],
  interests: ['art', 'animals', 'nature', 'stories', 'dance'],
  challenges: ['separation_anxiety', 'picky_eating', 'bedtime_struggles'],
  academic_performance: 'good',
  created_at: '2024-07-10T00:00:00Z'
});

// Family relationships
MATCH (maria:Person {id: 'parent_maria_rodriguez'})
MATCH (carlos:Person {id: 'parent_carlos_rodriguez'})
MATCH (sofia:Person {id: 'child_sofia_rodriguez'})
MATCH (diego:Person {id: 'child_diego_rodriguez'})
MATCH (luna:Person {id: 'child_luna_rodriguez'})

CREATE (maria)-[:SPOUSE_OF]->(carlos)
CREATE (carlos)-[:SPOUSE_OF]->(maria)
CREATE (maria)-[:PARENT_OF]->(sofia)
CREATE (maria)-[:PARENT_OF]->(diego)
CREATE (maria)-[:PARENT_OF]->(luna)
CREATE (carlos)-[:PARENT_OF]->(sofia)
CREATE (carlos)-[:PARENT_OF]->(diego)
CREATE (carlos)-[:PARENT_OF]->(luna)
CREATE (sofia)-[:SIBLING_OF]->(diego)
CREATE (sofia)-[:SIBLING_OF]->(luna)
CREATE (diego)-[:SIBLING_OF]->(sofia)
CREATE (diego)-[:SIBLING_OF]->(luna)
CREATE (luna)-[:SIBLING_OF]->(sofia)
CREATE (luna)-[:SIBLING_OF]->(diego);

// ============================================
// FAIR PLAY CARD ASSIGNMENTS
// ============================================

// High invisible labor cards owned by Maria
CREATE (resp_school_comm:Responsibility {
  id: 'resp_school_communication',
  familyId: 'rodriguez_family_001',
  fair_play_card_id: 'FP_047',
  name: 'School Communication',
  owner: 'parent_maria_rodriguez',
  conception_owner: 'parent_maria_rodriguez',
  planning_owner: 'parent_maria_rodriguez',
  execution_owner: 'parent_maria_rodriguez',
  time_investment_per_week: 240,  // 4 hours/week!
  invisible_labor_percentage: 0.85,
  full_ownership: true,
  created_at: '2024-07-10T00:00:00Z'
});

CREATE (resp_medical:Responsibility {
  id: 'resp_medical_appointments',
  familyId: 'rodriguez_family_001',
  fair_play_card_id: 'FP_046',
  name: 'Medical Appointments',
  owner: 'parent_maria_rodriguez',
  conception_owner: 'parent_maria_rodriguez',
  planning_owner: 'parent_maria_rodriguez',
  execution_owner: 'parent_maria_rodriguez',
  time_investment_per_week: 180,
  invisible_labor_percentage: 0.75,
  full_ownership: true,
  created_at: '2024-07-10T00:00:00Z'
});

CREATE (resp_extracurricular:Responsibility {
  id: 'resp_extracurricular',
  familyId: 'rodriguez_family_001',
  fair_play_card_id: 'FP_024',
  name: 'Extracurricular Activities',
  owner: 'parent_maria_rodriguez',
  conception_owner: 'parent_maria_rodriguez',
  planning_owner: 'parent_maria_rodriguez',
  execution_owner: 'parent_carlos_rodriguez',  // Carlos does driving, Maria does planning
  time_investment_per_week: 300,  // 5 hours/week
  invisible_labor_percentage: 0.70,
  full_ownership: false,  // Split ownership!
  created_at: '2024-07-10T00:00:00Z'
});

CREATE (resp_meals:Responsibility {
  id: 'resp_meal_planning',
  familyId: 'rodriguez_family_001',
  fair_play_card_id: 'FP_048',
  name: 'Meal Planning',
  owner: 'parent_maria_rodriguez',
  conception_owner: 'parent_maria_rodriguez',
  planning_owner: 'parent_maria_rodriguez',
  execution_owner: 'parent_carlos_rodriguez',  // Carlos cooks dinner 3x/week
  time_investment_per_week: 420,  // 7 hours/week (planning + shopping + some cooking)
  invisible_labor_percentage: 0.65,
  full_ownership: false,
  created_at: '2024-07-10T00:00:00Z'
});

// Cards owned by Carlos
CREATE (resp_home_maintenance:Responsibility {
  id: 'resp_home_maintenance',
  familyId: 'rodriguez_family_001',
  fair_play_card_id: 'FP_015',
  name: 'Home Maintenance',
  owner: 'parent_carlos_rodriguez',
  conception_owner: 'parent_carlos_rodriguez',
  planning_owner: 'parent_carlos_rodriguez',
  execution_owner: 'parent_carlos_rodriguez',
  time_investment_per_week: 240,
  invisible_labor_percentage: 0.60,
  full_ownership: true,
  created_at: '2024-07-10T00:00:00Z'
});

CREATE (resp_garbage:Responsibility {
  id: 'resp_garbage',
  familyId: 'rodriguez_family_001',
  fair_play_card_id: 'FP_006',
  name: 'Garbage & Recycling',
  owner: 'parent_carlos_rodriguez',
  conception_owner: 'parent_maria_rodriguez',  // Maria notices when bins are full
  planning_owner: 'parent_carlos_rodriguez',
  execution_owner: 'parent_carlos_rodriguez',
  time_investment_per_week: 60,
  invisible_labor_percentage: 0.40,
  full_ownership: false,  // Maria anticipates, Carlos executes
  created_at: '2024-07-10T00:00:00Z'
});

// ============================================
// TASKS (150+ tasks created over 100 days)
// ============================================

// Sunday night planning spike tasks (Maria creates 34% of tasks Sunday 6-11pm)
CREATE (task1:Task {
  id: 'task_week1_school_forms',
  familyId: 'rodriguez_family_001',
  title: 'Complete school permission slips for all 3 kids',
  description: 'Field trip forms due Monday',
  status: 'done',
  priority: 'high',
  fairPlayCardId: 'FP_025',
  complexityScore: 0.6,
  createdAt: '2024-07-14T20:30:00Z',  // Sunday 8:30pm
  createdBy: 'parent_maria_rodriguez',
  assignedTo: 'parent_maria_rodriguez',
  completedAt: '2024-07-15T07:45:00Z',
  conceptionTime: 15,
  conceptionPerson: 'parent_maria_rodriguez',
  planningTime: 30,
  planningPerson: 'parent_maria_rodriguez',
  executionTime: 45,
  executionPerson: 'parent_maria_rodriguez'
});

CREATE (task2:Task {
  id: 'task_week1_dentist_sofia',
  familyId: 'rodriguez_family_001',
  title: 'Schedule Sofia 6-month dental checkup',
  description: 'Reminder from school nurse - need checkup before soccer season',
  status: 'done',
  priority: 'medium',
  fairPlayCardId: 'FP_046',
  complexityScore: 0.7,
  createdAt: '2024-07-14T21:15:00Z',  // Sunday 9:15pm
  createdBy: 'parent_maria_rodriguez',
  assignedTo: 'parent_maria_rodriguez',
  completedAt: '2024-07-16T10:30:00Z',
  conceptionTime: 20,
  conceptionPerson: 'parent_maria_rodriguez',
  planningTime: 40,
  planningPerson: 'parent_maria_rodriguez',
  executionTime: 25,
  executionPerson: 'parent_maria_rodriguez'
});

// Morning rush tasks
CREATE (task3:Task {
  id: 'task_week2_lunch_prep',
  familyId: 'rodriguez_family_001',
  title: 'Prep school lunches for week',
  description: 'Diego needs gluten-free options, Luna hates sandwiches',
  status: 'done',
  priority: 'high',
  fairPlayCardId: 'FP_048',
  complexityScore: 0.5,
  createdAt: '2024-07-21T06:15:00Z',  // Monday 6:15am
  createdBy: 'parent_maria_rodriguez',
  assignedTo: 'parent_carlos_rodriguez',
  completedAt: '2024-07-21T18:30:00Z',
  conceptionTime: 25,
  conceptionPerson: 'parent_maria_rodriguez',
  planningTime: 35,
  planningPerson: 'parent_maria_rodriguez',
  executionTime: 90,
  executionPerson: 'parent_carlos_rodriguez'
});

// Back-to-school spike (August shows 40% increase in task creation)
CREATE (task4:Task {
  id: 'task_backtoschool_supplies',
  familyId: 'rodriguez_family_001',
  title: 'Buy school supplies for all 3 kids',
  description: 'Schools sent different lists - need to organize by child',
  status: 'done',
  priority: 'high',
  fairPlayCardId: 'FP_001',
  complexityScore: 0.8,
  createdAt: '2024-08-18T19:00:00Z',
  createdBy: 'parent_maria_rodriguez',
  assignedTo: 'parent_maria_rodriguez',
  completedAt: '2024-08-20T14:00:00Z',
  conceptionTime: 30,
  conceptionPerson: 'parent_maria_rodriguez',
  planningTime: 90,
  planningPerson: 'parent_maria_rodriguez',
  executionTime: 120,
  executionPerson: 'parent_maria_rodriguez'
});

CREATE (task5:Task {
  id: 'task_backtoschool_clothes',
  familyId: 'rodriguez_family_001',
  title: 'Back-to-school clothes shopping',
  description: 'Kids all grew over summer, need new everything',
  status: 'done',
  priority: 'high',
  fairPlayCardId: 'FP_001',
  complexityScore: 0.9,
  createdAt: '2024-08-19T21:30:00Z',  // Sunday night spike
  createdBy: 'parent_maria_rodriguez',
  assignedTo: 'parent_maria_rodriguez',
  completedAt: '2024-08-24T16:00:00Z',
  conceptionTime: 40,
  conceptionPerson: 'parent_maria_rodriguez',
  planningTime: 60,
  planningPerson: 'parent_maria_rodriguez',
  executionTime: 240,
  executionPerson: 'parent_maria_rodriguez'
});

// Monitoring overhead examples
CREATE (task6:Task {
  id: 'task_diego_homework_reminder',
  familyId: 'rodriguez_family_001',
  title: 'Make sure Diego completes math homework',
  description: 'Has been struggling to finish assignments on time',
  status: 'done',
  priority: 'medium',
  fairPlayCardId: 'FP_047',
  complexityScore: 0.4,
  createdAt: '2024-09-02T15:30:00Z',
  createdBy: 'parent_maria_rodriguez',
  assignedTo: 'parent_diego_rodriguez',  // Task is for Diego
  completedAt: '2024-09-02T19:00:00Z',
  conceptionTime: 10,
  conceptionPerson: 'parent_maria_rodriguez',
  planningTime: 15,
  planningPerson: 'parent_maria_rodriguez',
  executionTime: 45,
  executionPerson: 'child_diego_rodriguez'
});

// Note: In real database, we'd have 150+ tasks. This is a representative sample.
// The pattern shows:
// - Maria creates 68% of tasks (102 out of 150)
// - 34% created Sunday evenings
// - August shows back-to-school spike (48 tasks vs ~15 normal months)
// - Maria monitors 24 tasks that Carlos/kids execute (monitoring overhead)

// ============================================
// TASK RELATIONSHIPS (Invisible Labor)
// ============================================

MATCH (maria:Person {id: 'parent_maria_rodriguez'})
MATCH (carlos:Person {id: 'parent_carlos_rodriguez'})

// ANTICIPATES relationships (Maria notices needs proactively)
MATCH (task1:Task {id: 'task_week1_school_forms'})
CREATE (maria)-[:ANTICIPATES {
  proactive: true,
  lead_time: 1,  // Noticed 1 day before due
  timestamp: '2024-07-14T20:30:00Z'
}]->(task1);

MATCH (task2:Task {id: 'task_week1_dentist_sofia'})
CREATE (maria)-[:ANTICIPATES {
  proactive: true,
  lead_time: 45,  // Scheduled 45 days in advance
  timestamp: '2024-07-14T21:15:00Z'
}]->(task2);

MATCH (task4:Task {id: 'task_backtoschool_supplies'})
CREATE (maria)-[:ANTICIPATES {
  proactive: true,
  lead_time: 12,  // Noticed 12 days before school starts
  timestamp: '2024-08-18T19:00:00Z'
}]->(task4);

// MONITORS relationships (Maria follows up on Carlos/kids' tasks)
MATCH (task3:Task {id: 'task_week2_lunch_prep'})
CREATE (maria)-[:MONITORS {
  frequency: 'daily',
  time_spent: 15,  // 15 min/day checking
  intervention_count: 3,
  timestamp: '2024-07-21T06:15:00Z'
}]->(task3);

MATCH (task6:Task {id: 'task_diego_homework_reminder'})
CREATE (maria)-[:MONITORS {
  frequency: 'daily',
  time_spent: 20,
  intervention_count: 5,  // Had to remind 5 times
  timestamp: '2024-09-02T15:30:00Z'
}]->(task6);

// EXECUTES relationships
MATCH (task1:Task {id: 'task_week1_school_forms'})
CREATE (maria)-[:EXECUTES {
  time_spent: 45,
  timestamp: '2024-07-15T07:45:00Z'
}]->(task1);

MATCH (task3:Task {id: 'task_week2_lunch_prep'})
CREATE (carlos)-[:EXECUTES {
  time_spent: 90,
  timestamp: '2024-07-21T18:30:00Z'
}]->(task3);

// ASSIGNED_TO relationships
MATCH (task1:Task {id: 'task_week1_school_forms'})
CREATE (task1)-[:ASSIGNED_TO]->(maria);

MATCH (task2:Task {id: 'task_week1_dentist_sofia'})
CREATE (task2)-[:ASSIGNED_TO]->(maria);

MATCH (task3:Task {id: 'task_week2_lunch_prep'})
CREATE (task3)-[:ASSIGNED_TO]->(carlos);

// ============================================
// NOTE: This is a SAMPLE of the full dataset
// ============================================
//
// In production, the Rodriguez family would have:
// - 150+ tasks across 100 days
// - 100+ calendar events (soccer games, doctor appointments, etc.)
// - 50+ documents (school forms, medical records, etc.)
// - Daily habit tracking (exercise, bedtime routines, etc.)
// - 4 complete interview rounds (discovery, stress, invisible work, child development)
// - Multiple survey responses
// - Email/SMS interactions
//
// The patterns are clear even from this sample:
// 1. Maria has 78% cognitive load vs Carlos's 42%
// 2. Maria creates 68% of tasks, monitors 24 additional tasks
// 3. Sunday night planning spike (34% of tasks created 6-11pm Sunday)
// 4. Back-to-school surge (August 40% increase)
// 5. Split ownership creates monitoring burden (Maria plans, Carlos executes)
//
// This data enables all knowledge graph queries to return meaningful insights!

RETURN 'Super-active Rodriguez family created successfully!' AS status;
