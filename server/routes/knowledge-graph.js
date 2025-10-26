/**
 * Knowledge Graph API Routes
 * Production-ready endpoints for graph visualization and insights
 */

const express = require('express');
const router = express.Router();

// Import services - Now using CommonJS require()
const neo4jService = require('../services/graph/Neo4jService');

console.log('✅ Knowledge Graph routes loaded with Neo4jService');

/**
 * POST /api/knowledge-graph/invisible-labor
 * Get invisible labor analysis for a family
 */
router.post('/invisible-labor', async (req, res) => {
  try {
    const { familyId } = req.body;

    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }

    // Query Neo4j for invisible labor analysis
    // This is a simplified version - full ParentingIntelligenceService can be added later
    const query = `
      MATCH (p:Person {familyId: $familyId})
      OPTIONAL MATCH (p)-[:CREATED]->(t:Task)
      RETURN p.name as name, count(t) as taskCount,
             avg(t.cognitiveLoad) as avgLoad
      ORDER BY taskCount DESC
    `;

    const results = await neo4jService.runQuery(query, { familyId });

    res.json({
      success: true,
      data: {
        analysis: results,
        summary: `Found ${results.length} family members with task data`
      }
    });
  } catch (error) {
    console.error('Error getting invisible labor analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-graph/coordination
 * Get coordination analysis for a family
 */
router.post('/coordination', async (req, res) => {
  try {
    const { familyId } = req.body;

    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }

    // Query Neo4j for coordination patterns
    // Count events organized by each person
    const query = `
      MATCH (p:Person {familyId: $familyId})
      OPTIONAL MATCH (p)-[:ORGANIZES]->(e:Event)
      RETURN p.name as name, count(e) as eventsOrganized
      ORDER BY eventsOrganized DESC
    `;

    const results = await neo4jService.runQuery(query, { familyId });

    res.json({
      success: true,
      data: {
        coordination: results,
        summary: `Found ${results.length} family members organizing events`
      }
    });
  } catch (error) {
    console.error('Error getting coordination analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-graph/invisible-labor-by-category
 * Get invisible labor analysis broken down by category (Home, Kids, Work, Self)
 * Format optimized for survey personalization
 * Returns array of category breakdowns with anticipation, monitoring, execution metrics
 */
router.post('/invisible-labor-by-category', async (req, res) => {
  try {
    const { familyId } = req.body;

    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }

    // Query Neo4j for category-based analysis
    // ✅ CRITICAL FIX: Use CREATED relationship (what neo4j-sync actually creates)
    // In our data model: CREATED = who anticipated/initiated the task
    const query = `
      MATCH (p:Person {familyId: $familyId})
      OPTIONAL MATCH (p)-[created:CREATED]->(t:Task)

      WITH p.name as person,
           t.category as category,
           count(DISTINCT created) as anticipated,
           count(DISTINCT CASE WHEN t.completed = true THEN created ELSE null END) as executed,
           0 as monitored
      WHERE category IS NOT NULL

      WITH category,
           collect({
             person: person,
             anticipated: anticipated,
             monitored: monitored,
             executed: executed
           }) as personData

      // Calculate totals and find leaders per category
      WITH category, personData,
           [p IN personData | p.anticipated] as anticipationCounts,
           [p IN personData | p.monitored] as monitoringCounts,
           [p IN personData | p.executed] as executionCounts,
           reduce(s = 0, p IN personData | s + p.anticipated) as totalAnticipation,
           reduce(s = 0, p IN personData | s + p.monitored) as totalMonitoring,
           reduce(s = 0, p IN personData | s + p.executed) as totalExecution,
           reduce(max = 0, p IN personData | CASE WHEN p.anticipated > max THEN p.anticipated ELSE max END) as maxAnticipation,
           reduce(max = 0, p IN personData | CASE WHEN p.monitored > max THEN p.monitored ELSE max END) as maxMonitoring,
           reduce(max = 0, p IN personData | CASE WHEN p.executed > max THEN p.executed ELSE max END) as maxExecution

      RETURN category,
             {
               leader: head([p IN personData WHERE p.anticipated = maxAnticipation | p.person]),
               percentageDifference: CASE
                 WHEN totalAnticipation > 0 AND maxAnticipation > 0
                 THEN toFloat(maxAnticipation) / totalAnticipation * 100 - 50.0
                 ELSE 0
               END,
               tasks: maxAnticipation
             } as anticipation,
             {
               leader: head([p IN personData WHERE p.monitored = maxMonitoring | p.person]),
               percentageDifference: CASE
                 WHEN totalMonitoring > 0 AND maxMonitoring > 0
                 THEN toFloat(maxMonitoring) / totalMonitoring * 100 - 50.0
                 ELSE 0
               END,
               checks: maxMonitoring
             } as monitoring,
             {
               leader: head([p IN personData WHERE p.executed = maxExecution | p.person]),
               percentageDifference: CASE
                 WHEN totalExecution > 0 AND maxExecution > 0
                 THEN toFloat(maxExecution) / totalExecution * 100 - 50.0
                 ELSE 0
               END,
               completed: maxExecution
             } as execution
    `;

    const results = await neo4jService.runQuery(query, { familyId });

    // Return array directly (not wrapped in object)
    res.json({
      success: true,
      data: results  // Array of {category, anticipation, monitoring, execution}
    });
  } catch (error) {
    console.error('Error getting category-based invisible labor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-graph/temporal-patterns
 * Get temporal patterns (when tasks are created)
 */
router.post('/temporal-patterns', async (req, res) => {
  try {
    const { familyId, startDate, endDate } = req.body;

    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }

    // Query Neo4j for task creation patterns over time
    const query = `
      MATCH (t:Task {familyId: $familyId})
      WHERE t.createdAt IS NOT NULL
      RETURN t.createdAt as timestamp, count(t) as count
      ORDER BY t.createdAt DESC
      LIMIT 100
    `;

    const results = await neo4jService.runQuery(query, { familyId });

    res.json({
      success: true,
      data: {
        patterns: results,
        summary: `Found ${results.length} temporal data points`
      }
    });
  } catch (error) {
    console.error('Error getting temporal patterns:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-graph/graph-data
 * Get graph data for D3.js visualization
 * Returns nodes and links formatted for force-directed graph
 */
router.post('/graph-data', async (req, res) => {
  try {
    const { familyId, includeGranularData = false, includeAllNodes = false } = req.body;

    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }

    // Performance optimization: Exclude heavy node types by default
    // - SurveyResponse + Question = 16,200+ nodes (only with includeGranularData=true)
    // - Task + Event = 4,500+ nodes (only with includeAllNodes=true)
    // Default view: Only show Person, Family, Survey nodes (~235 nodes) for fast loading
    let excludedLabels = [];

    if (!includeGranularData) {
      excludedLabels.push('SurveyResponse', 'Question');
    }

    if (!includeAllNodes) {
      excludedLabels.push('Task', 'Event');
    }

    const excludeClause = excludedLabels.length > 0
      ? `AND NOT ANY(label IN labels(node) WHERE label IN $excludedLabels)`
      : '';

    // Query Neo4j for all relevant nodes and relationships
    // CRITICAL: Get ALL nodes involved in relationships, not just those with familyId
    // Some nodes (like FairPlayCard) don't have familyId but are connected to family nodes
    const nodesQuery = `
      MATCH (n1)-[rel]->(n2)
      WHERE n1.familyId = $familyId OR n2.familyId = $familyId
      WITH collect(DISTINCT n1) + collect(DISTINCT n2) AS allNodes
      UNWIND allNodes AS node
      WITH DISTINCT node
      WHERE true ${excludeClause}
      RETURN collect(node) as nodes
    `;

    const relsQuery = `
      MATCH (n1)-[rel]->(n2)
      WHERE (n1.familyId = $familyId OR n2.familyId = $familyId)
        ${excludeClause.replace('node', 'n1').replace('node', 'n2')}
      WITH startNode(rel) AS n1, endNode(rel) AS n2, rel
      WHERE true ${excludeClause.replace('node', 'n1')}
        AND true ${excludeClause.replace('node', 'n2')}
      RETURN collect({
        sourceId: id(n1),
        targetId: id(n2),
        relType: type(rel),
        properties: properties(rel)
      }) as relationships
    `;

    // Run both queries
    const queryParams = { familyId, excludedLabels };
    const [nodesResult, relsResult] = await Promise.all([
      neo4jService.runQuery(nodesQuery, queryParams),
      neo4jService.runQuery(relsQuery, queryParams)
    ]);

    // Transform to D3.js format
    const nodes = [];
    const relationships = [];

    // Process nodes
    console.log('📊 [GRAPH-DATA] nodesResult structure:', {
      length: nodesResult.length,
      hasNodes: nodesResult.length > 0 && nodesResult[0] ? !!nodesResult[0].nodes : false,
      nodesLength: nodesResult.length > 0 && nodesResult[0] && nodesResult[0].nodes ? nodesResult[0].nodes.length : 0,
      firstNodeId: nodesResult.length > 0 && nodesResult[0] && nodesResult[0].nodes && nodesResult[0].nodes[0] ? nodesResult[0].nodes[0]._id : 'none'
    });

    if (nodesResult.length > 0 && nodesResult[0].nodes) {
      console.log(`📊 [GRAPH-DATA] Processing ${nodesResult[0].nodes.length} nodes...`);

      nodesResult[0].nodes.forEach((node, index) => {
        // Log first 3 nodes for debugging
        if (index < 3) {
          console.log(`📊 [GRAPH-DATA] Node ${index}:`, {
            id: node._id,
            type: node._labels ? node._labels[0] : 'no labels',
            name: node.name || 'no name',
            familyId: node.familyId || 'no familyId'
          });
        }

        // Determine node type from Neo4j labels
        const labels = node._labels || [];
        const nodeType = labels[0]?.toLowerCase() || 'unknown';

        // Determine node label
        let label = 'Unknown';
        if (node.name) label = node.name;
        else if (node.title) label = node.title;
        else if (node.cardName) label = node.cardName;
        else if (nodeType === 'survey') {
          // Survey nodes: Create meaningful label from surveyType and cycleNumber
          const surveyType = node.surveyType || 'Survey';
          const cycleNum = node.cycleNumber || '';
          label = cycleNum ? `${surveyType} #${cycleNum}` : surveyType;
        }

        // Extract all node properties except the ones we're explicitly setting
        const { _id, _labels, ...nodeProperties } = node;

        nodes.push({
          id: node._id,  // Use Neo4j internal ID (MUST come last to avoid being overwritten)
          type: nodeType,
          label: label,
          ...nodeProperties,
          // Re-assert id to ensure it's not overwritten by nodeProperties
          id: node._id
        });
      });

      console.log(`✅ [GRAPH-DATA] Successfully added ${nodes.length} nodes`);
    } else {
      console.log('⚠️ [GRAPH-DATA] No nodes in nodesResult');
    }

    // Process relationships
    console.log('📊 [GRAPH-DATA] relsResult structure:', {
      length: relsResult.length,
      hasRelationships: relsResult.length > 0 && relsResult[0] ? !!relsResult[0].relationships : false,
      relationshipsLength: relsResult.length > 0 && relsResult[0] && relsResult[0].relationships ? relsResult[0].relationships.length : 0,
      firstRel: relsResult.length > 0 && relsResult[0] && relsResult[0].relationships && relsResult[0].relationships[0] ? relsResult[0].relationships[0] : 'none'
    });

    if (relsResult.length > 0 && relsResult[0].relationships) {
      console.log(`📊 [GRAPH-DATA] Processing ${relsResult[0].relationships.length} relationships...`);

      relsResult[0].relationships.forEach((rel, index) => {
        // sourceId and targetId are already converted to numbers by Neo4jService
        // Log first 3 relationships for debugging
        if (index < 3) {
          console.log(`📊 [GRAPH-DATA] Rel ${index}:`, {
            sourceId: rel.sourceId,
            sourceType: typeof rel.sourceId,
            targetId: rel.targetId,
            targetType: typeof rel.targetId,
            relType: rel.relType,
            hasProperties: !!rel.properties
          });
        }

        // Ensure sourceId and targetId exist and are valid
        if (rel.sourceId !== undefined && rel.targetId !== undefined && rel.relType) {
          const cleanRel = {
            source: rel.sourceId,  // Rename to 'source' for D3.js
            target: rel.targetId,  // Rename to 'target' for D3.js
            type: rel.relType
          };

          // Add properties if they exist
          if (rel.properties) {
            Object.assign(cleanRel, rel.properties);
          }

          relationships.push(cleanRel);
        }
      });

      console.log(`✅ [GRAPH-DATA] Successfully added ${relationships.length} relationships`);
    } else {
      console.log('⚠️ [GRAPH-DATA] No relationships in relsResult');
    }

    res.json({
      success: true,
      data: {
        nodes,
        links: relationships  // Frontend expects 'links', not 'relationships'
      }
    });
  } catch (error) {
    console.error('Error getting graph data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-graph/sync
 * Sync family data from Firestore to Neo4j
 * NOTE: Sync happens automatically via Cloud Functions - this endpoint is informational
 */
router.post('/sync', async (req, res) => {
  try {
    const { familyId } = req.body;

    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }

    // Sync happens automatically via Cloud Functions (syncFamilyToNeo4j, syncTaskToNeo4j, syncEventToNeo4j)
    // This endpoint provides sync status information

    // Query Neo4j to check current sync status
    const query = `
      MATCH (f:Family {familyId: $familyId})
      OPTIONAL MATCH (f)<-[:MEMBER_OF]-(p:Person)
      OPTIONAL MATCH (p)-[:CREATED]->(t:Task)
      OPTIONAL MATCH (p)-[:ORGANIZES]->(e:Event)
      RETURN
        count(DISTINCT p) as personCount,
        count(DISTINCT t) as taskCount,
        count(DISTINCT e) as eventCount
    `;

    const results = await neo4jService.runQuery(query, { familyId });
    const stats = results[0] || { personCount: 0, taskCount: 0, eventCount: 0 };

    res.json({
      success: true,
      data: {
        message: 'Data syncs automatically via Cloud Functions',
        currentStatus: stats,
        note: 'Create/update data in Firestore to trigger automatic sync'
      }
    });
  } catch (error) {
    console.error('Error checking sync status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-graph/node-insights
 * Get insights for a specific node (person, task, etc)
 */
router.post('/node-insights', async (req, res) => {
  try {
    const { familyId, nodeId, nodeType } = req.body;

    if (!familyId || !nodeId || !nodeType) {
      return res.status(400).json({
        error: 'familyId, nodeId, and nodeType are required'
      });
    }

    // Build query based on node type
    let query = '';
    let insights = {};

    switch (nodeType) {
      case 'person':
        query = `
          MATCH (p:Person {id: $nodeId, familyId: $familyId})

          // Count tasks anticipated
          OPTIONAL MATCH (p)-[ant:ANTICIPATES]->(task:Task)

          // Count tasks monitored
          OPTIONAL MATCH (p)-[mon:MONITORS]->(monitoredTask:Task)

          // Count tasks executed
          OPTIONAL MATCH (p)-[exec:EXECUTES]->(executedTask:Task)

          RETURN
            p,
            count(DISTINCT ant) as tasksAnticipated,
            count(DISTINCT mon) as tasksMonitored,
            count(DISTINCT exec) as tasksExecuted
        `;

        const personResults = await neo4jService.runQuery(query, { nodeId, familyId });
        if (personResults.length > 0) {
          insights = personResults[0];
        }
        break;

      case 'task':
        query = `
          MATCH (t:Task {id: $nodeId, familyId: $familyId})

          // Who anticipated this task?
          OPTIONAL MATCH (anticipator:Person)-[ant:ANTICIPATES]->(t)

          // Who executed it?
          OPTIONAL MATCH (executor:Person)-[exec:EXECUTES]->(t)

          // Which Fair Play card?
          OPTIONAL MATCH (t)-[:BELONGS_TO]->(card:FairPlayCard)

          RETURN
            t,
            anticipator.name as anticipatedBy,
            executor.name as executedBy,
            card.name as fairPlayCard
        `;

        const taskResults = await neo4jService.runQuery(query, { nodeId, familyId });
        if (taskResults.length > 0) {
          insights = taskResults[0];
        }
        break;

      default:
        return res.status(400).json({ error: 'Invalid nodeType' });
    }

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error getting node insights:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-graph/temporal-analysis
 * Get comprehensive temporal analysis (trends, patterns, heat maps)
 * TODO: Requires TemporalAnalysisService to be converted to CommonJS
 */
router.post('/temporal-analysis', async (req, res) => {
  try {
    const { familyId, daysBack = 30 } = req.body;

    if (!familyId) {
      return res.status(400).json({
        error: 'familyId is required'
      });
    }

    // Simplified temporal analysis using direct Neo4j query
    const query = `
      MATCH (t:Task {familyId: $familyId})
      WHERE t.createdAt IS NOT NULL
      WITH t, duration.between(t.createdAt, datetime()).days AS daysAgo
      WHERE daysAgo <= $daysBack
      RETURN
        date(t.createdAt) as date,
        count(t) as taskCount
      ORDER BY date DESC
    `;

    const results = await neo4jService.runQuery(query, { familyId, daysBack });

    res.json({
      success: true,
      data: {
        dailyPatterns: results,
        daysAnalyzed: daysBack
      }
    });
  } catch (error) {
    console.error('Error getting temporal analysis:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-graph/predictive-insights
 * Get predictive insights (task predictions, burnout risks, conflict detection)
 * TODO: Requires PredictiveInsightsService to be converted to CommonJS
 */
router.post('/predictive-insights', async (req, res) => {
  try {
    const { familyId, daysAhead = 7 } = req.body;

    if (!familyId) {
      return res.status(400).json({
        error: 'familyId is required'
      });
    }

    // Simplified predictive insights using direct Neo4j query
    // Identify people with high cognitive load (potential burnout risk)
    const query = `
      MATCH (p:Person {familyId: $familyId})
      OPTIONAL MATCH (p)-[:CREATED]->(t:Task)
      WITH p, count(t) as taskCount, avg(t.cognitiveLoad) as avgLoad
      WHERE taskCount > 0
      RETURN
        p.name as name,
        taskCount,
        avgLoad,
        CASE
          WHEN avgLoad > 0.7 THEN 'high'
          WHEN avgLoad > 0.4 THEN 'medium'
          ELSE 'low'
        END as burnoutRisk
      ORDER BY avgLoad DESC
    `;

    const results = await neo4jService.runQuery(query, { familyId });

    res.json({
      success: true,
      data: {
        predictions: results,
        daysAhead: daysAhead
      }
    });
  } catch (error) {
    console.error('Error getting predictive insights:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/knowledge-graph/natural-language
 * Process natural language questions and return graph insights
 * Uses NaturalLanguageCypherService for intelligent intent classification
 *
 * Example: "Why am I so tired?" → Returns anticipation burden + monitoring overhead data
 */
router.post('/natural-language', async (req, res) => {
  try {
    const { question, familyId, userId, userName } = req.body;

    // Validate inputs
    if (!question || !familyId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: question and familyId are required'
      });
    }

    console.log(`📝 Natural language query from ${userName || userId}: "${question}"`);

    // Dynamically import NaturalLanguageCypherService (ES module)
    let NaturalLanguageCypherService;
    try {
      const module = await import('../services/graph/NaturalLanguageCypherService.js');
      NaturalLanguageCypherService = module.default;
    } catch (importError) {
      console.error('❌ Failed to import NaturalLanguageCypherService:', importError);
      // Fallback to simple query
      throw new Error('Natural language processing service unavailable');
    }

    // Use the sophisticated service with intent classification
    const result = await NaturalLanguageCypherService.processNaturalLanguageQuery(
      question,
      { familyId, userId, userName }
    );

    res.json(result);

  } catch (error) {
    console.error('Error processing natural language query:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      question: req.body.question
    });
  }
});

// ========================================
// EVENT ROLE ANALYSIS ENDPOINTS
// ========================================

/**
 * GET /api/knowledge-graph/event-role-distribution
 *
 * Analyzes who performs which event roles, how often, and cognitive load impact
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     byPerson: [
 *       {
 *         person: "Kimberly",
 *         totalRoles: 45,
 *         totalCognitiveLoad: 180,
 *         avgLoadPerEvent: 4.0,
 *         topRoles: [
 *           { role: "Carpool Coordinator", count: 15, load: 75 },
 *           { role: "Snack Master", count: 12, load: 36 }
 *         ]
 *       }
 *     ],
 *     byRole: [
 *       {
 *         role: "Driver",
 *         totalCount: 30,
 *         distribution: [
 *           { person: "Stefan", count: 18, percentage: 60 },
 *           { person: "Kimberly", count: 12, percentage: 40 }
 *         ]
 *       }
 *     ],
 *     imbalances: [
 *       {
 *         role: "Carpool Coordinator",
 *         leader: "Kimberly",
 *         percentage: 95,
 *         cognitiveLoad: 5,
 *         severity: "high"
 *       }
 *     ]
 *   }
 * }
 */
router.post('/event-role-distribution', async (req, res) => {
  try {
    const { familyId } = req.body;

    if (!familyId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: familyId'
      });
    }

    console.log(`📊 Analyzing event role distribution for family: ${familyId}`);

    // Query 1: Role distribution by person
    const byPersonQuery = `
      MATCH (p:Person {familyId: $familyId})-[r:PERFORMED_ROLE]->(e:Event)
      WITH p, r.category as category, r.roleName as roleName, count(r) as roleCount,
           sum(r.cognitiveLoadWeight) as totalLoad
      WITH p,
           sum(roleCount) as totalRoles,
           sum(totalLoad) as totalCognitiveLoad,
           collect({
             role: roleName,
             category: category,
             count: roleCount,
             load: totalLoad
           }) as roles
      RETURN p.name as person,
             p.userId as userId,
             totalRoles,
             totalCognitiveLoad,
             toFloat(totalCognitiveLoad) / toFloat(totalRoles) as avgLoadPerEvent,
             [role IN roles | role][0..5] as topRoles
      ORDER BY totalCognitiveLoad DESC
    `;

    const byPersonResult = await neo4jService.runQuery(byPersonQuery, { familyId });

    // Query 2: Role distribution by role type
    const byRoleQuery = `
      MATCH (p:Person {familyId: $familyId})-[r:PERFORMED_ROLE]->(e:Event)
      WITH r.roleName as role, r.category as category, r.cognitiveLoadWeight as weight,
           p.name as person, count(r) as personCount
      WITH role, category, weight, collect({person: person, count: personCount}) as distribution,
           sum(personCount) as totalCount
      WITH role, category, weight, totalCount, distribution,
           [d IN distribution |
             d {.*, percentage: toFloat(d.count) / toFloat(totalCount) * 100}
           ] as distributionWithPercentage
      RETURN role,
             category,
             weight as cognitiveLoadWeight,
             totalCount,
             distributionWithPercentage as distribution
      ORDER BY totalCount DESC
    `;

    const byRoleResult = await neo4jService.runQuery(byRoleQuery, { familyId });

    // Query 3: Detect imbalances (one person does 70%+ of a high-load role)
    const imbalancesQuery = `
      MATCH (p:Person {familyId: $familyId})-[r:PERFORMED_ROLE]->(e:Event)
      WHERE r.cognitiveLoadWeight >= 4
      WITH r.roleName as role, r.cognitiveLoadWeight as load, r.category as category,
           p.name as person, count(r) as personCount
      WITH role, load, category, collect({person: person, count: personCount}) as distribution,
           sum(personCount) as totalCount
      WITH role, load, category, totalCount, distribution,
           [d IN distribution WHERE toFloat(d.count) / toFloat(totalCount) >= 0.7 |
             d {.*, percentage: toFloat(d.count) / toFloat(totalCount) * 100}
           ][0] as leader
      WHERE leader IS NOT NULL
      RETURN role,
             category,
             load as cognitiveLoadWeight,
             leader.person as leader,
             toInteger(leader.percentage) as percentage,
             CASE
               WHEN leader.percentage >= 90 THEN 'critical'
               WHEN leader.percentage >= 80 THEN 'high'
               ELSE 'moderate'
             END as severity
      ORDER BY leader.percentage DESC, load DESC
    `;

    const imbalancesResult = await neo4jService.runQuery(imbalancesQuery, { familyId });

    res.json({
      success: true,
      data: {
        byPerson: byPersonResult,
        byRole: byRoleResult,
        imbalances: imbalancesResult
      },
      metadata: {
        familyId,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error analyzing event role distribution:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/knowledge-graph/invisible-event-labor
 *
 * Focuses on HIGH cognitive load event roles (preparation, communication, special needs)
 * These are the INVISIBLE tasks that create mental load
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     summary: {
 *       totalInvisibleRoles: 150,
 *       byPerson: [
 *         {
 *           person: "Kimberly",
 *           invisibleRoles: 120,
 *           percentage: 80,
 *           avgCognitiveLoad: 4.5,
 *           burnoutRisk: "high"
 *         }
 *       ]
 *     },
 *     byCategory: [
 *       {
 *         category: "communication",
 *         leader: "Kimberly",
 *         leaderPercentage: 95,
 *         roles: ["Team Parent Liaison", "Social Coordinator"]
 *       }
 *     ],
 *     recommendations: [
 *       {
 *         action: "redistribute",
 *         role: "Carpool Coordinator",
 *         from: "Kimberly",
 *         to: "Stefan",
 *         reason: "Kimberly has 95% of communication roles (burnout risk)"
 *       }
 *     ]
 *   }
 * }
 */
router.post('/invisible-event-labor', async (req, res) => {
  try {
    const { familyId } = req.body;

    if (!familyId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: familyId'
      });
    }

    console.log(`🔍 Analyzing invisible event labor for family: ${familyId}`);

    // Focus on high cognitive load categories: preparation, communication, special_circumstance
    const invisibleCategories = ['preparation', 'communication', 'special_circumstance'];

    // Query 1: Summary by person
    const summaryQuery = `
      MATCH (p:Person {familyId: $familyId})-[r:PERFORMED_ROLE]->(e:Event)
      WHERE r.category IN $invisibleCategories
      WITH p, count(r) as invisibleRoles, sum(r.cognitiveLoadWeight) as totalLoad
      WITH p, invisibleRoles, totalLoad,
           toFloat(totalLoad) / toFloat(invisibleRoles) as avgLoad,
           sum(invisibleRoles) OVER () as familyTotal
      WITH p, invisibleRoles, totalLoad, avgLoad,
           toFloat(invisibleRoles) / toFloat(familyTotal) * 100 as percentage
      RETURN p.name as person,
             p.userId as userId,
             invisibleRoles,
             toInteger(percentage) as percentage,
             toFloat(avgLoad) as avgCognitiveLoad,
             CASE
               WHEN percentage >= 75 THEN 'high'
               WHEN percentage >= 60 THEN 'moderate'
               ELSE 'low'
             END as burnoutRisk
      ORDER BY invisibleRoles DESC
    `;

    const summaryResult = await neo4jService.runQuery(summaryQuery, {
      familyId,
      invisibleCategories
    });

    // Query 2: By category (which categories are most imbalanced)
    const byCategoryQuery = `
      MATCH (p:Person {familyId: $familyId})-[r:PERFORMED_ROLE]->(e:Event)
      WHERE r.category IN $invisibleCategories
      WITH r.category as category, p.name as person, count(r) as roleCount,
           collect(DISTINCT r.roleName) as roles
      WITH category, collect({person: person, count: roleCount}) as distribution,
           sum(roleCount) as totalCount, collect(DISTINCT roles) as allRoles
      WITH category, totalCount, distribution, reduce(acc=[], role IN allRoles | acc + role) as uniqueRoles,
           [d IN distribution WHERE toFloat(d.count) / toFloat(totalCount) >= 0.6 |
             d {.*, percentage: toInteger(toFloat(d.count) / toFloat(totalCount) * 100)}
           ][0] as leader
      WHERE leader IS NOT NULL
      RETURN category,
             leader.person as leader,
             leader.percentage as leaderPercentage,
             uniqueRoles[0..5] as topRoles,
             totalCount
      ORDER BY leader.percentage DESC
    `;

    const byCategoryResult = await neo4jService.runQuery(byCategoryQuery, {
      familyId,
      invisibleCategories
    });

    // Query 3: Generate recommendations
    const recommendationsQuery = `
      MATCH (p:Person {familyId: $familyId})-[r:PERFORMED_ROLE]->(e:Event)
      WHERE r.category IN $invisibleCategories AND r.cognitiveLoadWeight >= 4
      WITH r.roleName as role, p.name as person, count(r) as roleCount
      WITH role, collect({person: person, count: roleCount}) as distribution,
           sum(roleCount) as totalCount
      WITH role, distribution, totalCount,
           [d IN distribution WHERE toFloat(d.count) / toFloat(totalCount) >= 0.7][0] as overloadedPerson,
           [d IN distribution WHERE toFloat(d.count) / toFloat(totalCount) < 0.3][0] as underloadedPerson
      WHERE overloadedPerson IS NOT NULL AND underloadedPerson IS NOT NULL
      RETURN 'redistribute' as action,
             role,
             overloadedPerson.person as from,
             underloadedPerson.person as to,
             'Overloaded person has ' + toString(toInteger(toFloat(overloadedPerson.count) / toFloat(totalCount) * 100)) + '% of this role' as reason
      LIMIT 5
    `;

    const recommendationsResult = await neo4jService.runQuery(recommendationsQuery, {
      familyId,
      invisibleCategories
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalInvisibleRoles: summaryResult.reduce((sum, p) => sum + p.invisibleRoles, 0),
          byPerson: summaryResult
        },
        byCategory: byCategoryResult,
        recommendations: recommendationsResult
      },
      metadata: {
        familyId,
        invisibleCategories,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error analyzing invisible event labor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
