/**
 * NaturalLanguageCypherService.js
 *
 * Phase 1: Intent classification and template query execution
 * Converts natural language questions to Neo4j graph insights
 *
 * Example: "Why am I so tired?" → anticipation burden + monitoring overhead data
 */

import neo4jService from './Neo4jService.js';
import { executeQuery, CYPHER_QUERIES } from './CypherQueries.js';

// Import Claude API for dynamic Cypher generation (Phase 2)
let ClaudeService;
try {
  const claudeModule = await import('../ClaudeService.js');
  ClaudeService = claudeModule.default;
} catch (error) {
  console.warn('⚠️ ClaudeService not available - Phase 2 dynamic generation disabled');
}

class NaturalLanguageCypherService {
  constructor() {
    this.neo4j = neo4jService;
    this.claudeService = ClaudeService;
    this.enableDynamicGeneration = !!ClaudeService; // Phase 2 feature flag

    // Phase 4: Query caching for performance
    this.queryCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.cypherCache = new Map(); // Cache generated Cypher queries
    this.performanceMetrics = {
      templateQueries: { count: 0, totalTime: 0 },
      dynamicQueries: { count: 0, totalTime: 0 },
      cacheHits: 0
    };

    // Intent patterns for common questions
    this.intentPatterns = {
      anticipation: {
        regex: /notice|see|think ahead|plan|mental load|invisible|remember/i,
        templates: ['anticipationBurden'],
        description: 'Questions about noticing and planning tasks',
        confidence: 0.9
      },

      monitoring: {
        regex: /check|follow up|nag|remind|chase|monitor|track/i,
        templates: ['monitoringOverhead'],
        description: 'Questions about following up on tasks',
        confidence: 0.9
      },

      burnout: {
        regex: /tired|exhaust|overwhelm|too much|stress|burnout|worn out/i,
        templates: ['anticipationBurden', 'monitoringOverhead', 'taskCreationVsExecution'],
        description: 'Questions about feeling overwhelmed',
        confidence: 0.85
      },

      bottleneck: {
        regex: /stuck|waiting|depend|block|bottleneck|critical/i,
        templates: ['coordinationBottleneck', 'dependencyImpact'],
        description: 'Questions about coordination and dependencies',
        confidence: 0.85
      },

      fairness: {
        regex: /fair|equal|balance|share|split|equitable/i,
        templates: ['fairPlayPhaseDistribution', 'taskCreationVsExecution'],
        description: 'Questions about workload distribution',
        confidence: 0.9
      },

      temporal: {
        regex: /when|time|pattern|schedule|routine|sunday|weekend/i,
        templates: ['temporalTaskCreation'],
        description: 'Questions about timing patterns',
        confidence: 0.8
      },

      research: {
        regex: /research|decide|decision|option|choice/i,
        templates: ['decisionResearchGap'],
        description: 'Questions about decision-making burden',
        confidence: 0.85
      }
    };
  }

  /**
   * Main entry point: Process natural language question
   * Phase 4: Added caching and performance tracking
   */
  async processNaturalLanguageQuery(question, familyContext) {
    const startTime = Date.now();
    console.log(`📝 Processing question: "${question}"`);
    console.log(`👨‍👩‍👧‍👦 Family context:`, familyContext);

    // Phase 4: Check cache first
    const cacheKey = `${familyContext.familyId}:${question.toLowerCase()}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      this.performanceMetrics.cacheHits++;
      console.log(`📦 Cache hit! Returning cached result`);
      return {
        ...cached,
        cached: true,
        cacheAge: Date.now() - cached.cachedAt
      };
    }

    try {
      // Step 1: Classify intent
      const intent = await this.classifyIntent(question);
      console.log(`🎯 Intent classified:`, intent);

      let results;
      let method;
      let queryStartTime;

      // Step 2: Try template queries first (Phase 1)
      if (intent.type !== 'general' && intent.confidence >= 0.7) {
        // High confidence - use template queries
        queryStartTime = Date.now();
        results = await this.executeTemplateQueries(intent, familyContext);
        method = 'template';
        this._trackPerformance('templateQueries', Date.now() - queryStartTime);
        console.log(`✅ Template query results:`, results.length, 'records');
      } else if (this.enableDynamicGeneration) {
        // Low confidence or general query - use dynamic Cypher generation (Phase 2)
        console.log(`🤖 Generating dynamic Cypher query with Claude API`);
        queryStartTime = Date.now();
        const dynamicResult = await this.generateAndExecuteCypher(question, familyContext);
        results = dynamicResult.results;
        method = 'dynamic';
        this._trackPerformance('dynamicQueries', Date.now() - queryStartTime);
        console.log(`✅ Dynamic query results:`, results.length, 'records');
      } else {
        // Fallback to template queries even with low confidence
        queryStartTime = Date.now();
        results = await this.executeTemplateQueries(intent, familyContext);
        method = 'template_fallback';
        this._trackPerformance('templateQueries', Date.now() - queryStartTime);
        console.log(`⚠️ Using template fallback:`, results.length, 'records');
      }

      // Step 3: Format for conversation
      const formatted = this.formatResults(results, question, intent);

      const response = {
        success: true,
        question,
        intent: intent.type,
        confidence: intent.confidence,
        method,
        data: formatted,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      };

      // Phase 4: Cache the result
      this._setCache(cacheKey, response);

      return response;

    } catch (error) {
      console.error('❌ Error processing natural language query:', error);

      return {
        success: false,
        question,
        error: error.message,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Classify user intent using pattern matching
   */
  async classifyIntent(question) {
    const lowerQuestion = question.toLowerCase();

    // Try each pattern
    for (const [intentType, config] of Object.entries(this.intentPatterns)) {
      if (config.regex.test(lowerQuestion)) {
        return {
          type: intentType,
          templates: config.templates,
          description: config.description,
          confidence: config.confidence,
          matchedPattern: config.regex.toString()
        };
      }
    }

    // Default: General insight query
    return {
      type: 'general',
      templates: ['anticipationBurden', 'taskCreationVsExecution'],
      description: 'General family insights',
      confidence: 0.5
    };
  }

  /**
   * Execute template queries from CypherQueries.js
   */
  async executeTemplateQueries(intent, familyContext) {
    const { familyId } = familyContext;

    // Execute all relevant templates
    const queryPromises = intent.templates.map(async (templateName) => {
      console.log(`🔍 Executing template: ${templateName}`);

      try {
        const results = await executeQuery(templateName, { familyId }, this.neo4j);

        return {
          template: templateName,
          success: true,
          data: results,
          recordCount: results.length
        };
      } catch (error) {
        console.error(`Error executing ${templateName}:`, error);

        return {
          template: templateName,
          success: false,
          error: error.message
        };
      }
    });

    const results = await Promise.all(queryPromises);

    // Flatten successful results
    return results
      .filter(r => r.success)
      .flatMap(r => r.data.map(record => ({
        ...record,
        _source: r.template
      })));
  }

  /**
   * Format results for conversational response
   */
  formatResults(results, question, intent) {
    if (results.length === 0) {
      return {
        summary: "No data found for this question. The family might not have enough activity in the knowledge graph yet.",
        keyInsights: [],
        rawData: []
      };
    }

    // Extract key metrics based on intent type
    const keyInsights = this.extractKeyInsights(results, intent.type);

    return {
      summary: this.generateSummary(results, intent.type),
      keyInsights,
      rawData: results.slice(0, 10), // Limit to top 10 for conversation
      totalRecords: results.length
    };
  }

  /**
   * Extract key insights based on intent
   */
  extractKeyInsights(results, intentType) {
    const insights = [];

    switch (intentType) {
      case 'anticipation':
      case 'burnout':
        // Find person with highest anticipation burden
        const byPerson = results.filter(r => r.person);
        if (byPerson.length > 0) {
          const sorted = byPerson.sort((a, b) =>
            (b.tasks_anticipated || b.anticipation_burden || 0) -
            (a.tasks_anticipated || a.anticipation_burden || 0)
          );

          insights.push({
            type: 'anticipation_leader',
            person: sorted[0].person,
            value: sorted[0].tasks_anticipated || sorted[0].anticipation_burden,
            metric: sorted[0].tasks_anticipated ? 'tasks_anticipated' : 'anticipation_burden'
          });
        }
        break;

      case 'monitoring':
        // Find person with most monitoring overhead
        const monitors = results.filter(r => r.monitor);
        if (monitors.length > 0) {
          const sorted = monitors.sort((a, b) =>
            (b.monitoring_actions || b.nagging_hours_per_week || 0) -
            (a.monitoring_actions || a.nagging_hours_per_week || 0)
          );

          insights.push({
            type: 'monitoring_leader',
            person: sorted[0].monitor,
            value: sorted[0].monitoring_actions || sorted[0].nagging_hours_per_week,
            metric: sorted[0].monitoring_actions ? 'monitoring_actions' : 'nagging_hours_per_week'
          });
        }
        break;

      case 'fairness':
        // Compare creation vs execution ratios
        const people = results.filter(r => r.person && r.creation_ratio !== undefined);
        if (people.length >= 2) {
          people.sort((a, b) => b.creation_ratio - a.creation_ratio);

          insights.push({
            type: 'creation_imbalance',
            highest: {
              person: people[0].person,
              creationRatio: people[0].creation_ratio
            },
            lowest: {
              person: people[people.length - 1].person,
              creationRatio: people[people.length - 1].creation_ratio
            },
            gap: people[0].creation_ratio - people[people.length - 1].creation_ratio
          });
        }
        break;
    }

    return insights;
  }

  /**
   * Phase 2: Generate and execute dynamic Cypher query using Claude API
   */
  async generateAndExecuteCypher(question, familyContext) {
    const { familyId } = familyContext;

    // Build few-shot examples for Claude
    const fewShotExamples = this.buildFewShotExamples();

    // Build schema description
    const schemaDescription = `
# Neo4j Graph Schema

## Node Types:
- Person: {userId, name, role, familyId, cognitiveLoad}
- Task: {taskId, title, category, familyId, createdAt, cognitiveLoad}
- Responsibility: {cardName, category, minimumStandard}

## Relationship Types:
- (Person)-[:CREATED]->(Task)
- (Person)-[:ANTICIPATES]->(Task)
- (Person)-[:MONITORS]->(Task)
- (Person)-[:EXECUTES]->(Task)
- (Person)-[:OWNS]->(Responsibility)
- (Task)-[:BELONGS_TO]->(Responsibility)
- (Person)-[:PARENT_OF]->(Person)

## Family ID:
All queries must filter by familyId: "${familyId}"
`;

    // Claude prompt for Cypher generation
    const prompt = `You are a Neo4j Cypher query generator. Convert the natural language question to a Cypher query.

${schemaDescription}

${fewShotExamples}

Now generate a Cypher query for this question:
Question: "${question}"

Requirements:
1. ALWAYS filter by familyId: "${familyId}"
2. Return results as simple objects (not Neo4j node objects)
3. Use clear property names in RETURN clause
4. Handle null values gracefully
5. Limit results to 100 records max
6. **CRITICAL:** Use ONLY read operations (MATCH, WHERE, RETURN). DO NOT use CREATE, DELETE, DETACH, REMOVE, SET, or MERGE

Return ONLY the Cypher query, no explanation or markdown formatting.`;

    try {
      // Call Claude API to generate Cypher
      const cypherQuery = await this.claudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { temperature: 0.1, max_tokens: 500 }
      );

      console.log(`🔍 Generated Cypher:`, cypherQuery);

      // Validate and clean query
      const cleanedQuery = this.validateCypher(cypherQuery, familyId);

      // Execute query
      const results = await this.neo4j.runQuery(cleanedQuery, { familyId });

      return {
        success: true,
        generatedCypher: cleanedQuery,
        results,
        method: 'dynamic'
      };

    } catch (error) {
      console.error('Error generating/executing dynamic Cypher:', error);
      throw new Error(`Dynamic query generation failed: ${error.message}`);
    }
  }

  /**
   * Build few-shot examples for Claude
   */
  buildFewShotExamples() {
    return `
## Example 1:
Question: "How many tasks did Stefan create last week?"
Cypher:
MATCH (p:Person {name: 'Stefan', familyId: $familyId})-[:CREATED]->(t:Task)
WHERE datetime(t.createdAt) >= datetime() - duration({days: 7})
RETURN p.name AS person, count(t) AS taskCount

## Example 2:
Question: "Who creates the most tasks on Sundays?"
Cypher:
MATCH (p:Person {familyId: $familyId})-[:CREATED]->(t:Task)
WHERE datetime(t.createdAt).dayOfWeek = 1
WITH p, count(t) AS taskCount
RETURN p.name AS person, taskCount
ORDER BY taskCount DESC
LIMIT 1

## Example 3:
Question: "What tasks are monitored by Maria?"
Cypher:
MATCH (p:Person {name: 'Maria', familyId: $familyId})-[:MONITORS]->(t:Task)
RETURN t.title AS task, t.category AS category, t.createdAt AS created
LIMIT 100

## Example 4:
Question: "Show me all parents in the family"
Cypher:
MATCH (p:Person {familyId: $familyId})
WHERE p.role = 'parent' OR p.isParent = true
RETURN p.name AS person, p.role AS role
`;
  }

  /**
   * Validate and clean generated Cypher query
   */
  validateCypher(cypher, familyId) {
    // Remove markdown code blocks if present
    let cleaned = cypher.replace(/```cypher\n?/g, '').replace(/```\n?/g, '').trim();

    // Ensure familyId filter exists
    if (!cleaned.includes('familyId')) {
      throw new Error('Generated query missing familyId filter - security violation');
    }

    // Block dangerous operations (as standalone Cypher commands)
    // Match these keywords only when they appear as Cypher commands (not in property names like "createdAt")
    const dangerous = [
      /\bDELETE\b/i,
      /\bDETACH\s+DELETE\b/i,
      /\bREMOVE\b/i,
      /\bSET\b/i,
      /\bCREATE\b/i,  // Matches CREATE but not createdAt
      /\bMERGE\b/i
    ];

    for (const pattern of dangerous) {
      if (pattern.test(cleaned)) {
        throw new Error(`Generated query contains forbidden operation: ${pattern.source}`);
      }
    }

    // Ensure LIMIT is present
    if (!cleaned.toUpperCase().includes('LIMIT')) {
      cleaned += '\nLIMIT 100';
    }

    return cleaned;
  }

  /**
   * Generate human-readable summary
   */
  generateSummary(results, intentType) {
    const count = results.length;

    switch (intentType) {
      case 'anticipation':
        return `Found ${count} data points about task anticipation and mental load patterns.`;

      case 'monitoring':
        return `Found ${count} data points about task monitoring and follow-up patterns.`;

      case 'burnout':
        return `Analyzed ${count} data points related to cognitive load and burnout risk.`;

      case 'fairness':
        return `Found ${count} data points about workload distribution and fairness.`;

      case 'bottleneck':
        return `Identified ${count} potential bottlenecks and dependencies.`;

      case 'temporal':
        return `Found ${count} temporal patterns in task creation and scheduling.`;

      default:
        return `Retrieved ${count} data points from the family knowledge graph.`;
    }
  }

  /**
   * Phase 4: Cache management methods
   */
  _getFromCache(key) {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    if (Date.now() - timestamp > this.cacheTimeout) {
      this.queryCache.delete(key);
      return null;
    }

    return data;
  }

  _setCache(key, data) {
    this.queryCache.set(key, {
      data: { ...data, cachedAt: Date.now() },
      timestamp: Date.now()
    });
  }

  _trackPerformance(metricType, duration) {
    if (this.performanceMetrics[metricType]) {
      this.performanceMetrics[metricType].count++;
      this.performanceMetrics[metricType].totalTime += duration;
    }
  }

  /**
   * Phase 4: Get performance metrics
   */
  getPerformanceMetrics() {
    const metrics = {
      ...this.performanceMetrics,
      averageTemplateTime: this.performanceMetrics.templateQueries.count > 0
        ? Math.round(this.performanceMetrics.templateQueries.totalTime / this.performanceMetrics.templateQueries.count)
        : 0,
      averageDynamicTime: this.performanceMetrics.dynamicQueries.count > 0
        ? Math.round(this.performanceMetrics.dynamicQueries.totalTime / this.performanceMetrics.dynamicQueries.count)
        : 0,
      cacheHitRate: this.performanceMetrics.cacheHits > 0
        ? Math.round((this.performanceMetrics.cacheHits / (this.performanceMetrics.cacheHits + this.performanceMetrics.templateQueries.count + this.performanceMetrics.dynamicQueries.count)) * 100)
        : 0
    };

    return metrics;
  }

  /**
   * Phase 4: Clear cache
   */
  clearCache() {
    this.queryCache.clear();
    this.cypherCache.clear();
    console.log('🧹 Cache cleared');
  }
}

// Singleton instance
const naturalLanguageCypherService = new NaturalLanguageCypherService();

export default naturalLanguageCypherService;
