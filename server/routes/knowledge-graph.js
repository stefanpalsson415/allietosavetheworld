/**
 * Knowledge Graph API Routes
 * Production-ready endpoints for graph visualization and insights
 */

const express = require('express');
const router = express.Router();

// Import services (will be converted to ES modules)
let ParentingIntelligenceService;
let neo4jService;

// Dynamic import for ES modules
(async () => {
  try {
    const parentingModule = await import('../services/graph/ParentingIntelligenceService.js');
    ParentingIntelligenceService = parentingModule.default;

    const neo4jModule = await import('../services/graph/Neo4jService.js');
    neo4jService = neo4jModule.default;

    // Initialize Neo4j connection (optional - gracefully fail if not available)
    try {
      await ParentingIntelligenceService.initialize();
      console.log('✅ Knowledge Graph routes initialized with Neo4j');
    } catch (error) {
      console.warn('⚠️ Neo4j not available - Knowledge Graph will use mock data');
      console.warn('Set NEO4J_URI environment variable to enable Neo4j connection');
    }
  } catch (error) {
    console.error('❌ Failed to load Knowledge Graph services:', error);
    console.warn('Knowledge Graph endpoints will return 503 Service Unavailable');
  }
})();

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

    if (!ParentingIntelligenceService) {
      return res.status(503).json({
        success: false,
        error: 'Knowledge Graph service not available',
        message: 'Neo4j database connection required. Please contact support.'
      });
    }

    const analysis = await ParentingIntelligenceService.getInvisibleLaborAnalysis(familyId);

    res.json({
      success: true,
      data: analysis
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

    const analysis = await ParentingIntelligenceService.getCoordinationAnalysis(familyId);

    res.json({
      success: true,
      data: analysis
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
 * POST /api/knowledge-graph/temporal-patterns
 * Get temporal patterns (when tasks are created)
 */
router.post('/temporal-patterns', async (req, res) => {
  try {
    const { familyId, startDate, endDate } = req.body;

    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }

    const patterns = await ParentingIntelligenceService.getTemporalPatterns(
      familyId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: patterns
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
    const { familyId } = req.body;

    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }

    // Query Neo4j for all relevant nodes and relationships
    const query = `
      // Get all family members
      MATCH (p:Person {familyId: $familyId})

      // Get all tasks
      OPTIONAL MATCH (t:Task {familyId: $familyId})

      // Get all responsibilities
      OPTIONAL MATCH (r:Responsibility {familyId: $familyId})

      // Get all relationships
      OPTIONAL MATCH (p)-[rel]-(connected)
      WHERE connected.familyId = $familyId OR connected:FairPlayCard

      RETURN
        collect(DISTINCT p) as persons,
        collect(DISTINCT t) as tasks,
        collect(DISTINCT r) as responsibilities,
        collect(DISTINCT {
          source: startNode(rel).id,
          target: endNode(rel).id,
          type: type(rel),
          properties: properties(rel)
        }) as relationships
    `;

    const results = await neo4jService.runQuery(query, { familyId });

    // Transform to D3.js format
    const nodes = [];
    const links = [];

    if (results.length > 0) {
      const data = results[0];

      // Add person nodes
      if (data.persons) {
        data.persons.forEach(person => {
          nodes.push({
            id: person.id,
            type: 'person',
            label: person.name,
            ...person
          });
        });
      }

      // Add task nodes
      if (data.tasks) {
        data.tasks.forEach(task => {
          nodes.push({
            id: task.id,
            type: 'task',
            label: task.title || task.name,
            ...task
          });
        });
      }

      // Add responsibility nodes
      if (data.responsibilities) {
        data.responsibilities.forEach(resp => {
          nodes.push({
            id: resp.id,
            type: 'responsibility',
            label: resp.name,
            ...resp
          });
        });
      }

      // Add relationships as links
      if (data.relationships) {
        data.relationships.forEach(rel => {
          if (rel.source && rel.target) {
            links.push({
              source: rel.source,
              target: rel.target,
              type: rel.type,
              ...rel.properties
            });
          }
        });
      }
    }

    res.json({
      success: true,
      data: {
        nodes,
        links
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
 */
router.post('/sync', async (req, res) => {
  try {
    const { familyId } = req.body;

    if (!familyId) {
      return res.status(400).json({ error: 'familyId is required' });
    }

    const result = await ParentingIntelligenceService.syncFamilyData(familyId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error syncing family data:', error);
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
 */
router.post('/temporal-analysis', async (req, res) => {
  try {
    const { familyId, daysBack = 30 } = req.body;

    if (!familyId) {
      return res.status(400).json({
        error: 'familyId is required'
      });
    }

    // Import temporal analysis service
    const temporalAnalysisService = await import('../services/graph/TemporalAnalysisService.js').then(m => m.default);

    const temporalSummary = await temporalAnalysisService.getTemporalSummary(familyId, daysBack);

    res.json({
      success: true,
      data: temporalSummary
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
 */
router.post('/predictive-insights', async (req, res) => {
  try {
    const { familyId, daysAhead = 7 } = req.body;

    if (!familyId) {
      return res.status(400).json({
        error: 'familyId is required'
      });
    }

    // Import predictive insights service
    const predictiveInsightsService = await import('../services/graph/PredictiveInsightsService.js').then(m => m.default);

    const insights = await predictiveInsightsService.getPredictiveInsights(familyId, daysAhead);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Error getting predictive insights:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
