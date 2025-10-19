// Load Fair Play 100-Card Taxonomy into Neo4j
// Run after indexes and constraints are created

// ==========================================
// HOME CATEGORY (23 cards)
// ==========================================

CREATE (fp001:FairPlayCard {
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
});

CREATE (fp002:FairPlayCard {
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
});

// [Additional cards would continue here - showing structure]

// ==========================================
// Create Category Nodes
// ==========================================

CREATE (homeCategory:Category {
  name: 'Home',
  card_count: 23,
  description: 'Physical home management and maintenance',
  color: '#10B981'
});

CREATE (outCategory:Category {
  name: 'Out',
  card_count: 22,
  description: 'Outside home activities and logistics',
  color: '#3B82F6'
});

CREATE (caregivingCategory:Category {
  name: 'Caregiving',
  card_count: 21,
  description: 'Care for children and family members',
  color: '#EF4444'
});

CREATE (magicCategory:Category {
  name: 'Magic',
  card_count: 13,
  description: 'Special occasions and traditions',
  color: '#8B5CF6'
});

CREATE (wildCategory:Category {
  name: 'Wild',
  card_count: 21,
  description: 'Unexpected and irregular tasks',
  color: '#F59E0B'
});

// ==========================================
// Link Cards to Categories
// ==========================================

MATCH (card:FairPlayCard {category: 'home'})
MATCH (cat:Category {name: 'Home'})
CREATE (card)-[:PART_OF]->(cat);

MATCH (card:FairPlayCard {category: 'out'})
MATCH (cat:Category {name: 'Out'})
CREATE (card)-[:PART_OF]->(cat);

MATCH (card:FairPlayCard {category: 'caregiving'})
MATCH (cat:Category {name: 'Caregiving'})
CREATE (card)-[:PART_OF]->(cat);

MATCH (card:FairPlayCard {category: 'magic'})
MATCH (cat:Category {name: 'Magic'})
CREATE (card)-[:PART_OF]->(cat);

MATCH (card:FairPlayCard {category: 'wild'})
MATCH (cat:Category {name: 'Wild'})
CREATE (card)-[:PART_OF]->(cat);
