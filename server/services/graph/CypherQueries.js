// Complete Cypher Query Implementation
// All 10 queries from research paper

export const CYPHER_QUERIES = {

  // ==========================================
  // 1. ANTICIPATION BURDEN
  // Who notices what needs doing before anyone assigns it?
  // ==========================================
  anticipationBurden: `
    MATCH (p:Person)-[a:ANTICIPATES {proactive: true}]->(t:Task)
    WHERE p.familyId = $familyId
      AND NOT exists { (:Person)-[:ASSIGNED_TO]->(t) }
    RETURN p.name AS person,
           count(t) AS tasks_anticipated,
           sum(t.complexity_score) AS anticipation_burden,
           avg(a.lead_time) AS avg_lead_time_days,
           collect(t.title)[0..5] AS sample_tasks
    ORDER BY anticipation_burden DESC
  `,

  // ==========================================
  // 2. MONITORING OVERHEAD ("Nagging Coefficient")
  // Who follows up on others' incomplete tasks?
  // ==========================================
  monitoringOverhead: `
    MATCH (monitor:Person)-[m:MONITORS]->(t:Task)-[:ASSIGNED_TO]->(assignee:Person)
    WHERE monitor <> assignee
      AND monitor.familyId = $familyId
    RETURN monitor.name AS monitor,
           count(m) AS monitoring_actions,
           collect(DISTINCT assignee.name) AS people_monitored,
           sum(m.time_spent) AS monitoring_hours_per_week,
           avg(m.intervention_count) AS avg_interventions_per_task,
           (toFloat(sum(m.time_spent)) / 60) AS nagging_hours_per_week
    ORDER BY monitoring_hours_per_week DESC
  `,

  // ==========================================
  // 3. DECISION-RESEARCH GAP
  // Who does research vs who makes final decision?
  // ==========================================
  decisionResearchGap: `
    MATCH (researcher:Person)-[i:IDENTIFIES_OPTIONS]->(d:Decision)-[:DECIDES]-(decider:Person)
    WHERE researcher <> decider
      AND researcher.familyId = $familyId
    RETURN researcher.name AS researcher,
           decider.name AS decider,
           count(d) AS decisions_researched_not_made,
           sum(i.time_spent) AS invisible_research_minutes,
           avg(i.options_count) AS avg_options_generated,
           (toFloat(sum(i.time_spent)) / 60) AS invisible_research_hours,
           collect(d.title)[0..5] AS sample_decisions
    ORDER BY invisible_research_minutes DESC
  `,

  // ==========================================
  // 4. TASK CREATION VS EXECUTION SPLIT
  // 60/40 cognitive load despite 50/50 execution
  // ==========================================
  taskCreationVsExecution: `
    MATCH (p:Person)
    WHERE p.familyId = $familyId

    OPTIONAL MATCH (p)-[:ANTICIPATES]->(created:Task)
    WITH p, count(created) AS tasks_created

    OPTIONAL MATCH (p)-[:EXECUTES]->(executed:Task)
    WITH p, tasks_created, count(executed) AS tasks_executed

    OPTIONAL MATCH (p)-[:MONITORS]->(:Task)
    WITH p, tasks_created, tasks_executed, count(*) AS tasks_monitored

    WITH p, tasks_created, tasks_executed, tasks_monitored,
         (tasks_created + tasks_executed) AS total_task_interactions

    RETURN p.name AS person,
           tasks_created,
           tasks_executed,
           tasks_monitored,
           CASE WHEN total_task_interactions > 0
             THEN toFloat(tasks_created) / total_task_interactions
             ELSE 0.0 END AS creation_ratio,
           CASE WHEN total_task_interactions > 0
             THEN toFloat(tasks_executed) / total_task_interactions
             ELSE 0.0 END AS execution_ratio,
           CASE WHEN total_task_interactions > 0
             THEN toFloat(tasks_monitored) / total_task_interactions
             ELSE 0.0 END AS monitoring_ratio
    ORDER BY creation_ratio DESC
  `,

  // ==========================================
  // 5. BETWEENNESS CENTRALITY (Coordination Bottleneck)
  // Who is critical in task/info flow?
  // ==========================================
  coordinationBottleneck: `
    CALL gds.betweenness.stream('family_network', {
      relationshipTypes: ['COORDINATES', 'MONITORS', 'TRIGGERS', 'DEPENDS_ON']
    })
    YIELD nodeId, score
    MATCH (p:Person)
    WHERE id(p) = nodeId AND p.familyId = $familyId
    RETURN p.name AS person,
           score AS coordination_burden,
           p.cognitive_load_score AS current_load,
           p.stress_level AS stress_level
    ORDER BY score DESC
    LIMIT 5
  `,

  // ==========================================
  // 6. COMMUNITY FRAGMENTATION (Context-Switching)
  // How scattered are someone's tasks across domains?
  // ==========================================
  communityFragmentation: `
    CALL gds.louvain.stream('task_network')
    YIELD nodeId, communityId
    MATCH (t:Task)-[:ASSIGNED_TO]->(p:Person)
    WHERE id(t) = nodeId AND p.familyId = $familyId
    RETURN p.name AS person,
           count(DISTINCT communityId) AS task_clusters,
           collect(DISTINCT communityId) AS cluster_ids,
           count(t) AS total_tasks,
           toFloat(count(DISTINCT communityId)) / count(t) AS fragmentation_score
    ORDER BY task_clusters DESC
  `,

  // ==========================================
  // 7. DEPENDENCY CHAINS (Single Point of Failure)
  // What breaks if person X is unavailable?
  // ==========================================
  dependencyImpact: `
    MATCH path = (p:Person)-[:ASSIGNED_TO]->(t:Task)<-[:DEPENDS_ON*1..3]-(dependent:Task)
    WHERE p.familyId = $familyId
    RETURN p.name AS person,
           count(DISTINCT dependent) AS dependent_tasks,
           collect(DISTINCT dependent.title)[0..5] AS sample_dependencies,
           max(length(path)) AS max_chain_length,
           avg(length(path)) AS avg_chain_length
    ORDER BY dependent_tasks DESC
    LIMIT 5
  `,

  // ==========================================
  // 8. FAIR PLAY PHASE DISTRIBUTION
  // Invisible (conception + planning) vs visible (execution) work
  // ==========================================
  fairPlayPhaseDistribution: `
    MATCH (p:Person)-[:EXECUTES|ANTICIPATES|MONITORS]->(t:Task)
    WHERE p.familyId = $familyId AND t.fairPlayCardId IS NOT NULL

    WITH p,
         sum(t.conceptionPhase.time) AS conception_time,
         sum(t.planningPhase.time) AS planning_time,
         sum(t.executionPhase.time) AS execution_time

    WITH p, conception_time, planning_time, execution_time,
         (conception_time + planning_time + execution_time) AS total_time

    RETURN p.name AS person,
           conception_time + planning_time AS invisible_labor_minutes,
           execution_time AS visible_labor_minutes,
           total_time AS total_minutes,
           CASE WHEN total_time > 0
             THEN toFloat(conception_time + planning_time) / total_time
             ELSE 0.0 END AS invisible_percentage,
           CASE WHEN total_time > 0
             THEN toFloat(execution_time) / total_time
             ELSE 0.0 END AS visible_percentage
    ORDER BY invisible_percentage DESC
  `,

  // ==========================================
  // 9. RIPPLE EFFECT ANALYSIS
  // How do disruptions cascade?
  // ==========================================
  rippleEffectAnalysis: `
    MATCH (trigger:Event)-[r:RIPPLE_EFFECTS*1..3]->(impacted:Event)
    WHERE trigger.familyId = $familyId
    RETURN trigger.title AS triggering_event,
           count(DISTINCT impacted) AS impacted_events,
           max(length(r)) AS max_ripple_depth,
           avg([rel in r | rel.severity]) AS avg_severity,
           collect(DISTINCT impacted.title)[0..5] AS sample_impacts
    ORDER BY impacted_events DESC
    LIMIT 10
  `,

  // ==========================================
  // 10. TEMPORAL TASK CREATION PATTERN
  // When do tasks get created? (Sunday night spike?)
  // ==========================================
  temporalTaskCreation: `
    MATCH (p:Person)-[:ANTICIPATES]->(t:Task)
    WHERE p.familyId = $familyId
      AND t.createdAt >= datetime($startDate)
      AND t.createdAt <= datetime($endDate)

    WITH p, t,
         datetime(t.createdAt).dayOfWeek AS day_of_week,
         datetime(t.createdAt).hour AS hour_of_day

    RETURN p.name AS person,
           day_of_week,
           CASE day_of_week
             WHEN 1 THEN 'Monday'
             WHEN 2 THEN 'Tuesday'
             WHEN 3 THEN 'Wednesday'
             WHEN 4 THEN 'Thursday'
             WHEN 5 THEN 'Friday'
             WHEN 6 THEN 'Saturday'
             WHEN 7 THEN 'Sunday'
           END AS day_name,
           hour_of_day,
           count(t) AS tasks_created,
           sum(t.complexity_score) AS total_complexity
    ORDER BY day_of_week, hour_of_day
  `
};

// Helper function to execute queries with Neo4jService
export async function executeQuery(queryName, params, neo4jService) {
  const cypher = CYPHER_QUERIES[queryName];

  if (!cypher) {
    throw new Error(`Query "${queryName}" not found`);
  }

  return await neo4jService.runQuery(cypher, params);
}

export default CYPHER_QUERIES;
