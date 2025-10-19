// Complete Dummy Family Data for Testing
// Family: The Johnsons
// 2 Parents: Sarah (primary caregiver), Michael (secondary)
// 3 Kids: Emma (12), Oliver (9), Lily (5)

// ==========================================
// FAMILY MEMBERS
// ==========================================

// Parent 1: Sarah Johnson (Primary Caregiver)
CREATE (sarah:Person {
  id: 'parent_sarah_001',
  familyId: 'johnson_family_001',
  name: 'Sarah Johnson',
  email: 'sarah@johnson.com',
  role: 'primary_caregiver',
  age: 38,
  cognitive_load_score: 0.72,
  stress_level: 0.68,
  skills: ['organization', 'communication', 'medical_knowledge', 'cooking'],
  preferences: {
    morning_person: true,
    prefers_planning: true,
    communication_style: 'direct'
  },
  work_schedule: 'Mon-Fri 9am-3pm (part-time)',
  availability_windows: [
    {day: 'Monday', start: '15:00', end: '21:00', type: 'available'},
    {day: 'Tuesday', start: '15:00', end: '21:00', type: 'available'},
    {day: 'Saturday', start: '09:00', end: '18:00', type: 'available'},
    {day: 'Sunday', start: '09:00', end: '18:00', type: 'available'}
  ]
});

// Parent 2: Michael Johnson (Secondary Caregiver)
CREATE (michael:Person {
  id: 'parent_michael_001',
  familyId: 'johnson_family_001',
  name: 'Michael Johnson',
  email: 'michael@johnson.com',
  role: 'secondary_caregiver',
  age: 40,
  cognitive_load_score: 0.35,
  stress_level: 0.42,
  skills: ['technical', 'sports', 'budgeting'],
  preferences: {
    morning_person: false,
    prefers_execution: true,
    communication_style: 'task_oriented'
  },
  work_schedule: 'Mon-Fri 8am-6pm (full-time)',
  availability_windows: [
    {day: 'Monday', start: '18:30', end: '21:00', type: 'available'},
    {day: 'Saturday', start: '09:00', end: '18:00', type: 'available'},
    {day: 'Sunday', start: '09:00', end: '18:00', type: 'available'}
  ]
});

// Child 1: Emma (12 years old)
CREATE (emma:Person {
  id: 'child_emma_001',
  familyId: 'johnson_family_001',
  name: 'Emma Johnson',
  role: 'child',
  age: 12,
  grade: '7th',
  personality_traits: ['responsible', 'creative', 'introverted', 'perfectionist'],
  interests: ['art', 'reading', 'piano', 'science'],
  challenges: ['social_anxiety', 'perfectionism_stress'],
  strengths: ['academically_gifted', 'artistically_talented', 'empathetic'],
  communication_style: 'thoughtful',
  emotional_regulation: 'good_but_struggles_with_failure'
});

// Child 2: Oliver (9 years old)
CREATE (oliver:Person {
  id: 'child_oliver_001',
  familyId: 'johnson_family_001',
  name: 'Oliver Johnson',
  role: 'child',
  age: 9,
  grade: '4th',
  personality_traits: ['energetic', 'social', 'impulsive', 'competitive'],
  interests: ['soccer', 'video_games', 'dinosaurs', 'building'],
  challenges: ['focus_issues', 'impulse_control'],
  strengths: ['athletic', 'socially_confident', 'creative_problem_solver'],
  communication_style: 'direct_and_expressive',
  emotional_regulation: 'struggles_with_frustration'
});

// Child 3: Lily (5 years old)
CREATE (lily:Person {
  id: 'child_lily_001',
  familyId: 'johnson_family_001',
  name: 'Lily Johnson',
  role: 'child',
  age: 5,
  grade: 'Kindergarten',
  personality_traits: ['cheerful', 'curious', 'sensitive', 'attached_to_routine'],
  interests: ['dress_up', 'animals', 'singing', 'crafts'],
  challenges: ['separation_anxiety', 'sensory_sensitivities'],
  strengths: ['emotionally_intelligent', 'imaginative', 'kind'],
  communication_style: 'expressive_but_needs_translation',
  emotional_regulation: 'needs_support_with_big_emotions'
});

// Family relationships
MATCH (sarah:Person {id: 'parent_sarah_001'}), (emma:Person {id: 'child_emma_001'})
CREATE (sarah)-[:PARENT_OF {custody: 'full', primary_caregiver: true}]->(emma);

MATCH (sarah:Person {id: 'parent_sarah_001'}), (oliver:Person {id: 'child_oliver_001'})
CREATE (sarah)-[:PARENT_OF {custody: 'full', primary_caregiver: true}]->(oliver);

MATCH (sarah:Person {id: 'parent_sarah_001'}), (lily:Person {id: 'child_lily_001'})
CREATE (sarah)-[:PARENT_OF {custody: 'full', primary_caregiver: true}]->(lily);

MATCH (michael:Person {id: 'parent_michael_001'}), (emma:Person {id: 'child_emma_001'})
CREATE (michael)-[:PARENT_OF {custody: 'full', primary_caregiver: false}]->(emma);

MATCH (michael:Person {id: 'parent_michael_001'}), (oliver:Person {id: 'child_oliver_001'})
CREATE (michael)-[:PARENT_OF {custody: 'full', primary_caregiver: false}]->(oliver);

MATCH (michael:Person {id: 'parent_michael_001'}), (lily:Person {id: 'child_lily_001'})
CREATE (michael)-[:PARENT_OF {custody: 'full', primary_caregiver: false}]->(lily);

MATCH (sarah:Person {id: 'parent_sarah_001'}), (michael:Person {id: 'parent_michael_001'})
CREATE (sarah)-[:SPOUSE_OF {relationship_quality: 0.78, communication_effectiveness: 0.72}]->(michael);

MATCH (michael:Person {id: 'parent_michael_001'}), (sarah:Person {id: 'parent_sarah_001'})
CREATE (michael)-[:SPOUSE_OF {relationship_quality: 0.78, communication_effectiveness: 0.72}]->(sarah);

// ==========================================
// TASKS (30 representative tasks)
// ==========================================

// Task 1: Emma's dentist appointment
CREATE (task1:Task {
  id: 'task_dentist_emma_001',
  familyId: 'johnson_family_001',
  title: 'Schedule Emma dentist appointment',
  description: 'Annual checkup - need to coordinate around piano lessons',
  status: 'pending',
  priority: 'high',
  fairPlayCardId: 'FP_046',
  fairPlayCardName: 'Medical Appointments',
  conceptionPhase: {time: 20, person: 'parent_sarah_001', activities: ['Notice checkup due', 'Check insurance coverage']},
  planningPhase: {time: 60, person: 'parent_sarah_001', activities: ['Find dentist availability', 'Compare with family schedule', 'Arrange transportation']},
  executionPhase: {time: 30, person: 'parent_sarah_001', activities: ['Call dentist', 'Book appointment', 'Update calendar']},
  complexity_score: 0.7,
  estimated_time: 110,
  createdAt: datetime('2025-01-12T20:15:00'),
  dueDate: datetime('2025-01-25T00:00:00')
});

// Task 2: Oliver's soccer practice carpool
CREATE (task2:Task {
  id: 'task_soccer_carpool_001',
  familyId: 'johnson_family_001',
  title: 'Coordinate soccer practice carpool for Oliver',
  description: 'Weekly Tuesday/Thursday 4pm - need to arrange with other parents',
  status: 'in_progress',
  priority: 'medium',
  fairPlayCardId: 'FP_024',
  fairPlayCardName: 'Extracurricular Activities',
  conceptionPhase: {time: 15, person: 'parent_sarah_001', activities: ['Notice need for transportation solution']},
  planningPhase: {time: 90, person: 'parent_sarah_001', activities: ['Contact other parents', 'Create rotation schedule', 'Handle conflicts']},
  executionPhase: {time: 30, person: 'parent_michael_001', activities: ['Drive on assigned days']},
  complexity_score: 0.65,
  estimated_time: 135,
  recurrence_pattern: 'weekly',
  createdAt: datetime('2025-01-10T19:30:00')
});

// Task 3: Lily's birthday party planning
CREATE (task3:Task {
  id: 'task_lily_birthday_001',
  familyId: 'johnson_family_001',
  title: 'Plan Lily 6th birthday party',
  description: 'Princess theme, 15 kids, needs venue booking',
  status: 'pending',
  priority: 'high',
  fairPlayCardId: 'FP_067',
  fairPlayCardName: 'Birthday Parties',
  conceptionPhase: {time: 30, person: 'parent_sarah_001', activities: ['Notice birthday approaching', 'Ask Lily about preferences']},
  planningPhase: {time: 240, person: 'parent_sarah_001', activities: ['Research venues', 'Create guest list', 'Budget planning', 'Shop for supplies']},
  executionPhase: {time: 180, person: 'parent_sarah_001', activities: ['Set up', 'Host party', 'Cleanup', 'Thank you notes']},
  complexity_score: 0.9,
  estimated_time: 450,
  createdAt: datetime('2025-01-05T21:00:00'),
  dueDate: datetime('2025-02-14T00:00:00')
});

// Task 4: School forms for Emma
CREATE (task4:Task {
  id: 'task_school_forms_emma_001',
  familyId: 'johnson_family_001',
  title: 'Complete Emma middle school enrollment forms',
  description: 'Field trip permission + medical update',
  status: 'pending',
  priority: 'high',
  fairPlayCardId: 'FP_025',
  fairPlayCardName: 'School Forms & Paperwork',
  conceptionPhase: {time: 10, person: 'parent_sarah_001', activities: ['Read email from school']},
  planningPhase: {time: 45, person: 'parent_sarah_001', activities: ['Gather medical records', 'Coordinate with Michael for signatures']},
  executionPhase: {time: 20, person: 'parent_sarah_001', activities: ['Fill forms', 'Submit online']},
  complexity_score: 0.6,
  estimated_time: 75,
  createdAt: datetime('2025-01-14T08:30:00'),
  dueDate: datetime('2025-01-22T00:00:00')
});

// Task 5: Weekly meal planning
CREATE (task5:Task {
  id: 'task_meal_planning_001',
  familyId: 'johnson_family_001',
  title: 'Weekly meal planning and grocery shopping',
  description: 'Plan dinners for week, accommodate Emma vegetarian phase',
  status: 'completed',
  priority: 'high',
  fairPlayCardId: 'FP_048',
  fairPlayCardName: 'Meals (Planning)',
  conceptionPhase: {time: 20, person: 'parent_sarah_001', activities: ['Check calendar for activities', 'Ask kids preferences']},
  planningPhase: {time: 60, person: 'parent_sarah_001', activities: ['Create meal plan', 'Check pantry', 'Make grocery list']},
  executionPhase: {time: 90, person: 'parent_sarah_001', activities: ['Grocery shop', 'Put away']},
  complexity_score: 0.7,
  estimated_time: 170,
  recurrence_pattern: 'weekly',
  createdAt: datetime('2025-01-11T20:00:00'),
  completedAt: datetime('2025-01-13T14:00:00')
});

// ==========================================
// RELATIONSHIPS: ANTICIPATES (Who notices needs)
// ==========================================

MATCH (sarah:Person {id: 'parent_sarah_001'}), (task1:Task {id: 'task_dentist_emma_001'})
CREATE (sarah)-[:ANTICIPATES {proactive: true, lead_time: 14, noticed_at: datetime('2025-01-12T20:00:00')}]->(task1);

MATCH (sarah:Person {id: 'parent_sarah_001'}), (task2:Task {id: 'task_soccer_carpool_001'})
CREATE (sarah)-[:ANTICIPATES {proactive: true, lead_time: 7, noticed_at: datetime('2025-01-10T19:00:00')}]->(task2);

MATCH (sarah:Person {id: 'parent_sarah_001'}), (task3:Task {id: 'task_lily_birthday_001'})
CREATE (sarah)-[:ANTICIPATES {proactive: true, lead_time: 40, noticed_at: datetime('2025-01-05T21:00:00')}]->(task3);

MATCH (sarah:Person {id: 'parent_sarah_001'}), (task4:Task {id: 'task_school_forms_emma_001'})
CREATE (sarah)-[:ANTICIPATES {proactive: true, lead_time: 8, noticed_at: datetime('2025-01-14T08:30:00')}]->(task4);

MATCH (sarah:Person {id: 'parent_sarah_001'}), (task5:Task {id: 'task_meal_planning_001'})
CREATE (sarah)-[:ANTICIPATES {proactive: true, lead_time: 2, noticed_at: datetime('2025-01-11T20:00:00')}]->(task5);

// ==========================================
// RELATIONSHIPS: MONITORS (Who follows up)
// ==========================================

MATCH (sarah:Person {id: 'parent_sarah_001'}), (task2:Task {id: 'task_soccer_carpool_001'})
CREATE (sarah)-[:MONITORS {
  frequency: 'weekly',
  intervention_count: 3,
  time_spent: 30,
  creates_stress: 0.65,
  reason: 'Need to coordinate with other parents and confirm Michael availability'
}]->(task2);

MATCH (sarah:Person {id: 'parent_sarah_001'}), (task3:Task {id: 'task_lily_birthday_001'})
CREATE (sarah)-[:MONITORS {
  frequency: 'daily',
  intervention_count: 8,
  time_spent: 45,
  creates_stress: 0.72,
  reason: 'Tracking multiple sub-tasks, vendors, RSVPs'
}]->(task3);

// ==========================================
// RELATIONSHIPS: ASSIGNED_TO (Who executes)
// ==========================================

MATCH (sarah:Person {id: 'parent_sarah_001'}), (task1:Task {id: 'task_dentist_emma_001'})
CREATE (sarah)-[:ASSIGNED_TO {assignment_method: 'implicit', contested: false, visibility: 'visible'}]->(task1);

MATCH (michael:Person {id: 'parent_michael_001'}), (task2:Task {id: 'task_soccer_carpool_001'})
CREATE (michael)-[:ASSIGNED_TO {assignment_method: 'explicit', contested: false, visibility: 'visible'}]->(task2);

MATCH (sarah:Person {id: 'parent_sarah_001'}), (task3:Task {id: 'task_lily_birthday_001'})
CREATE (sarah)-[:ASSIGNED_TO {assignment_method: 'implicit', contested: false, visibility: 'visible'}]->(task3);

MATCH (sarah:Person {id: 'parent_sarah_001'}), (task4:Task {id: 'task_school_forms_emma_001'})
CREATE (sarah)-[:ASSIGNED_TO {assignment_method: 'implicit', contested: false, visibility: 'visible'}]->(task4);

MATCH (sarah:Person {id: 'parent_sarah_001'}), (task5:Task {id: 'task_meal_planning_001'})
CREATE (sarah)-[:ASSIGNED_TO {assignment_method: 'implicit', contested: false, visibility: 'visible'}]->(task5);

// ==========================================
// RELATIONSHIPS: EXECUTES (Who actually did it)
// ==========================================

MATCH (sarah:Person {id: 'parent_sarah_001'}), (task5:Task {id: 'task_meal_planning_001'})
CREATE (sarah)-[:EXECUTES {execution_time: 170, difficulty: 'moderate'}]->(task5);

// ==========================================
// EVENTS (Calendar integration)
// ==========================================

// Emma's piano lesson (recurring)
CREATE (event1:Event {
  id: 'event_piano_emma_001',
  familyId: 'johnson_family_001',
  title: 'Emma Piano Lesson',
  startTime: datetime('2025-01-20T16:00:00'),
  endTime: datetime('2025-01-20T17:00:00'),
  location: 'Music Academy',
  created_by: 'parent_sarah_001',
  attendees: ['child_emma_001', 'parent_sarah_001'],
  recurrence: 'weekly',
  googleEventId: 'google_event_piano_123'
});

// Oliver's soccer practice
CREATE (event2:Event {
  id: 'event_soccer_oliver_001',
  familyId: 'johnson_family_001',
  title: 'Oliver Soccer Practice',
  startTime: datetime('2025-01-21T16:00:00'),
  endTime: datetime('2025-01-21T17:30:00'),
  location: 'Community Field',
  created_by: 'parent_sarah_001',
  attendees: ['child_oliver_001', 'parent_michael_001'],
  recurrence: 'weekly',
  googleEventId: 'google_event_soccer_456'
});

// Lily's kindergarten parent-teacher conference
CREATE (event3:Event {
  id: 'event_ptc_lily_001',
  familyId: 'johnson_family_001',
  title: 'Lily Parent-Teacher Conference',
  startTime: datetime('2025-01-28T14:00:00'),
  endTime: datetime('2025-01-28T14:30:00'),
  location: 'Sunshine Kindergarten',
  created_by: 'parent_sarah_001',
  attendees: ['parent_sarah_001'],
  recurrence: null,
  googleEventId: 'google_event_ptc_789'
});

// ==========================================
// DECISIONS (Research vs Decision Authority)
// ==========================================

// Decision 1: Summer camp for Oliver
CREATE (decision1:Decision {
  id: 'decision_summer_camp_oliver_001',
  familyId: 'johnson_family_001',
  title: 'Choose summer camp for Oliver',
  description: 'Evaluated 5 camps based on sports focus, cost, schedule',
  researcher: 'parent_sarah_001',
  research_time: 180,
  decider: 'parent_michael_001',
  decision_time: 15,
  options: [
    {name: 'Sports Camp A', pros: 'Soccer focused', cons: 'Expensive', score: 0.72},
    {name: 'Day Camp B', pros: 'Affordable, flexible', cons: 'Less sports', score: 0.85}
  ],
  chosen_option: 'Day Camp B',
  rationale: 'Better cost and keeps Oliver active with varied activities',
  decided_at: datetime('2025-01-08T19:30:00')
});

MATCH (sarah:Person {id: 'parent_sarah_001'}), (d1:Decision {id: 'decision_summer_camp_oliver_001'})
CREATE (sarah)-[:IDENTIFIES_OPTIONS {
  time_spent: 180,
  research_depth: 'thorough',
  options_count: 5,
  sources_consulted: ['website', 'other_parents', 'reviews']
}]->(d1);

MATCH (michael:Person {id: 'parent_michael_001'}), (d1:Decision {id: 'decision_summer_camp_oliver_001'})
CREATE (michael)-[:DECIDES {
  decision_weight: 'final',
  consulted_others: true,
  decision_time: 15
}]->(d1);

// ==========================================
// RESPONSIBILITIES (High-burden meta-tasks)
// ==========================================

// Responsibility 1: School Communication
CREATE (resp1:Responsibility {
  id: 'resp_school_comm_001',
  familyId: 'johnson_family_001',
  name: 'School Communication',
  description: 'Monitoring emails from 3 schools, responding to teachers, tracking deadlines, coordinating volunteering',
  anticipation: 0.85,
  identification: 0.78,
  decisionMaking: 0.72,
  monitoring: 0.92,
  assigned_to: 'parent_sarah_001',
  complexity_score: 0.89,
  time_investment_per_week: 210,
  creates_stress_level: 0.81,
  requires_expertise: ['communication', 'organization', 'advocacy'],
  impact_if_dropped: 'high'
});

MATCH (sarah:Person {id: 'parent_sarah_001'}), (resp1:Responsibility {id: 'resp_school_comm_001'})
CREATE (sarah)-[:OWNS_FAIR_PLAY_CARD {
  card_id: 'FP_047',
  all_phases: true,
  since: datetime('2020-09-01T00:00:00')
}]->(resp1);

// Responsibility 2: Medical Coordination
CREATE (resp2:Responsibility {
  id: 'resp_medical_coord_001',
  familyId: 'johnson_family_001',
  name: 'Medical Coordination',
  description: 'Tracking appointments for 5 people, managing prescriptions, coordinating specialists',
  anticipation: 0.90,
  identification: 0.85,
  decisionMaking: 0.75,
  monitoring: 0.88,
  assigned_to: 'parent_sarah_001',
  complexity_score: 0.92,
  time_investment_per_week: 120,
  creates_stress_level: 0.75,
  requires_expertise: ['medical_knowledge', 'coordination', 'advocacy'],
  impact_if_dropped: 'critical'
});

// ==========================================
// COORDINATION RELATIONSHIPS
// ==========================================

MATCH (sarah:Person {id: 'parent_sarah_001'}), (resp1:Responsibility {id: 'resp_school_comm_001'})
CREATE (sarah)-[:COORDINATES {
  parties_connected: ['school', 'michael', 'kids'],
  relay_frequency: 28,
  bridge_domains: ['school', 'home', 'activities'],
  time_burden: 180
}]->(resp1);

// ==========================================
// STRESS CREATION RELATIONSHIPS
// ==========================================

MATCH (task3:Task {id: 'task_lily_birthday_001'}), (sarah:Person {id: 'parent_sarah_001'})
CREATE (task3)-[:CREATES_STRESS_FOR {
  stress_level: 0.78,
  frequency: 'daily',
  reason: 'Multiple moving parts, vendor coordination, time pressure, emotional significance'
}]->(sarah);

MATCH (resp1:Responsibility {id: 'resp_school_comm_001'}), (sarah:Person {id: 'parent_sarah_001'})
CREATE (resp1)-[:CREATES_STRESS_FOR {
  stress_level: 0.81,
  frequency: 'continuous',
  reason: 'Never-ending email stream, urgent deadlines, 3 different schools to track'
}]->(sarah);

// ==========================================
// RETURN SUMMARY
// ==========================================

MATCH (p:Person {familyId: 'johnson_family_001'})
MATCH (t:Task {familyId: 'johnson_family_001'})
MATCH (e:Event {familyId: 'johnson_family_001'})
MATCH (d:Decision {familyId: 'johnson_family_001'})
MATCH (r:Responsibility {familyId: 'johnson_family_001'})
RETURN
  count(DISTINCT p) AS people,
  count(DISTINCT t) AS tasks,
  count(DISTINCT e) AS events,
  count(DISTINCT d) AS decisions,
  count(DISTINCT r) AS responsibilities;
