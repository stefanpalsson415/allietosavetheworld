// Neo4j Constraints for Data Integrity
// Run these SECOND before loading data

// Person constraints
CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE;

// Task constraints
CREATE CONSTRAINT task_id_unique IF NOT EXISTS FOR (t:Task) REQUIRE t.id IS UNIQUE;

// Event constraints
CREATE CONSTRAINT event_id_unique IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE;

// Fair Play Card constraints
CREATE CONSTRAINT fair_play_card_id_unique IF NOT EXISTS FOR (c:FairPlayCard) REQUIRE c.id IS UNIQUE;

// Decision constraints
CREATE CONSTRAINT decision_id_unique IF NOT EXISTS FOR (d:Decision) REQUIRE d.id IS UNIQUE;

// Responsibility constraints
CREATE CONSTRAINT responsibility_id_unique IF NOT EXISTS FOR (r:Responsibility) REQUIRE r.id IS UNIQUE;

// Category constraints
CREATE CONSTRAINT category_name_unique IF NOT EXISTS FOR (c:Category) REQUIRE c.name IS UNIQUE;

RETURN 'Constraints created' AS status;
