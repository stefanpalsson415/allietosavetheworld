// Neo4j Indexes for Performance
// Run these FIRST before loading data

// Person indexes
CREATE INDEX person_family_id IF NOT EXISTS FOR (p:Person) ON (p.familyId);
CREATE INDEX person_name IF NOT EXISTS FOR (p:Person) ON (p.name);
CREATE INDEX person_role IF NOT EXISTS FOR (p:Person) ON (p.role);

// Task indexes
CREATE INDEX task_family_id IF NOT EXISTS FOR (t:Task) ON (t.familyId);
CREATE INDEX task_status IF NOT EXISTS FOR (t:Task) ON (t.status);
CREATE INDEX task_fair_play_card IF NOT EXISTS FOR (t:Task) ON (t.fairPlayCardId);
CREATE INDEX task_created_at IF NOT EXISTS FOR (t:Task) ON (t.createdAt);

// Event indexes
CREATE INDEX event_family_id IF NOT EXISTS FOR (e:Event) ON (e.familyId);
CREATE INDEX event_start_time IF NOT EXISTS FOR (e:Event) ON (e.startTime);

// Fair Play Card indexes
// Note: c.id has a uniqueness constraint in 02-constraints.cypher which creates its own index
CREATE INDEX fair_play_card_category IF NOT EXISTS FOR (c:FairPlayCard) ON (c.category);

// Decision indexes
CREATE INDEX decision_family_id IF NOT EXISTS FOR (d:Decision) ON (d.familyId);

// Responsibility indexes
CREATE INDEX responsibility_family_id IF NOT EXISTS FOR (r:Responsibility) ON (r.familyId);

RETURN 'Indexes created' AS status;
