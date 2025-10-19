// Parenting Intelligence Service - Main Orchestrator
// Production-ready, scalable, Neo4j-powered

import neo4jService from './Neo4jService.js';
import { executeQuery } from './CypherQueries.js';
import ClaudeService from '../ClaudeService.js';
import invisibleLaborEngine from './invisibleLabor/InvisibleLaborEngine.js';
import dataAggregationService from './invisibleLabor/DataAggregationService.js';

class ParentingIntelligenceService {
  constructor() {
    this.neo4j = neo4jService;
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.insightCache = new Map();
  }

  /**
   * Initialize service (connect to Neo4j)
   */
  async initialize() {
    await this.neo4j.connect();
    console.log('✅ Parenting Intelligence Service initialized');
  }

  // ==========================================
  // INVISIBLE LABOR INSIGHTS
  // ==========================================

  /**
   * Get complete invisible labor analysis for family
   * Now delegates to InvisibleLaborEngine for specialized analysis
   */
  async getInvisibleLaborAnalysis(familyId) {
    const cacheKey = `invisible_labor_${familyId}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    console.log(`📊 Analyzing invisible labor for family ${familyId}...`);

    // Use specialized InvisibleLaborEngine for comprehensive analysis
    const analysis = await invisibleLaborEngine.getComprehensiveReport(familyId);

    this._setCache(cacheKey, analysis);
    return analysis;
  }

  /**
   * Sync family data from Firestore to Neo4j graph
   * Essential for keeping graph up-to-date with real-time changes
   */
  async syncFamilyData(familyId) {
    return await dataAggregationService.syncFamilyData(familyId);
  }

  /**
   * Get coordination burden analysis
   */
  async getCoordinationAnalysis(familyId) {
    console.log(`🔗 Analyzing coordination patterns for family ${familyId}...`);

    const [bottleneck, fragmentation, dependencies] = await Promise.all([
      executeQuery('coordinationBottleneck', { familyId }, this.neo4j),
      executeQuery('communityFragmentation', { familyId }, this.neo4j),
      executeQuery('dependencyImpact', { familyId }, this.neo4j)
    ]);

    return {
      familyId,
      generatedAt: new Date().toISOString(),

      // Who is the coordination bottleneck?
      bottleneck: {
        data: bottleneck,
        insight: this._generateBottleneckInsight(bottleneck)
      },

      // How fragmented are tasks across domains?
      fragmentation: {
        data: fragmentation,
        insight: this._generateFragmentationInsight(fragmentation)
      },

      // Dependency chains (single points of failure)
      dependencies: {
        data: dependencies,
        insight: this._generateDependencyInsight(dependencies)
      }
    };
  }

  /**
   * Get temporal patterns (when tasks get created)
   */
  async getTemporalPatterns(familyId, startDate, endDate) {
    console.log(`📅 Analyzing temporal patterns for family ${familyId}...`);

    const patterns = await executeQuery('temporalTaskCreation', {
      familyId,
      startDate: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: endDate || new Date().toISOString()
    }, this.neo4j);

    return {
      familyId,
      dateRange: { startDate, endDate },
      patterns,
      insight: this._generateTemporalInsight(patterns)
    };
  }

  // ==========================================
  // CHILD INSIGHTS
  // ==========================================

  /**
   * Get deep child insights (personality, talents, challenges)
   */
  async getChildInsights(familyId, childId) {
    const cacheKey = `child_insights_${childId}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    console.log(`👶 Generating child insights for ${childId}...`);

    // Get child data from graph
    const childData = await this._getChildContext(familyId, childId);

    // Generate insights using Claude
    const insights = await this._generateChildInsightsWithClaude(childData);

    const result = {
      childId,
      childName: childData.name,
      familyId,
      generatedAt: new Date().toISOString(),
      insights,
      confidence: this._calculateAverageConfidence(insights)
    };

    this._setCache(cacheKey, result);
    return result;
  }

  // ==========================================
  // NATURAL LANGUAGE QUERY
  // ==========================================

  /**
   * Answer natural language questions about family graph
   */
  async queryInsights(familyId, naturalLanguageQuery) {
    console.log(`💬 Query: "${naturalLanguageQuery}"`);

    // Determine query type
    const queryType = this._classifyQuery(naturalLanguageQuery);

    let results;

    switch (queryType) {
      case 'invisible_labor':
        results = await this.getInvisibleLaborAnalysis(familyId);
        break;

      case 'coordination':
        results = await this.getCoordinationAnalysis(familyId);
        break;

      case 'child_insights':
        const childMatch = naturalLanguageQuery.match(/about\s+(\w+)/i);
        const childName = childMatch ? childMatch[1] : null;
        if (childName) {
          const childId = await this._findChildIdByName(familyId, childName);
          results = await this.getChildInsights(familyId, childId);
        }
        break;

      case 'temporal':
        results = await this.getTemporalPatterns(familyId);
        break;

      default:
        results = await this.getInvisibleLaborAnalysis(familyId);
    }

    // Generate natural language response
    const response = await this._generateNaturalLanguageResponse(naturalLanguageQuery, results);

    return {
      query: naturalLanguageQuery,
      queryType,
      results,
      response,
      generatedAt: new Date().toISOString()
    };
  }

  // ==========================================
  // HELPER FUNCTIONS - INSIGHT GENERATION
  // ==========================================

  _generateAnticipationInsight(data) {
    if (!data || data.length === 0) {
      return 'No anticipation data available yet.';
    }

    const topAnticipator = data[0];
    const totalTasks = data.reduce((sum, p) => sum + p.tasks_anticipated, 0);
    const percentage = ((topAnticipator.tasks_anticipated / totalTasks) * 100).toFixed(0);

    return `${topAnticipator.person} notices ${percentage}% of tasks that need doing before anyone assigns them (${topAnticipator.tasks_anticipated} tasks), with an average lead time of ${topAnticipator.avg_lead_time_days?.toFixed(1)} days. This is significant invisible labor.`;
  }

  _generateMonitoringInsight(data) {
    if (!data || data.length === 0) {
      return 'No monitoring data available yet.';
    }

    const topMonitor = data[0];

    return `${topMonitor.monitor} spends ${topMonitor.nagging_hours_per_week?.toFixed(1)} hours per week following up on others' incomplete tasks (${topMonitor.monitoring_actions} monitoring actions). They monitor: ${topMonitor.people_monitored?.join(', ')}. This "nagging coefficient" represents invisible emotional labor.`;
  }

  _generateDecisionResearchInsight(data) {
    if (!data || data.length === 0) {
      return 'No decision-research gap data available yet.';
    }

    const top = data[0];

    return `${top.researcher} spends ${top.invisible_research_hours?.toFixed(1)} hours researching options for decisions that ${top.decider} ultimately makes (${top.decisions_researched_not_made} decisions). This research labor is invisible and uncredited.`;
  }

  _generateCreationVsExecutionInsight(data) {
    if (!data || data.length === 0) {
      return 'No task creation/execution data available yet.';
    }

    const sorted = [...data].sort((a, b) => b.creation_ratio - a.creation_ratio);
    const topCreator = sorted[0];
    const topExecutor = [...data].sort((a, b) => b.execution_ratio - a.execution_ratio)[0];

    const creationPercent = (topCreator.creation_ratio * 100).toFixed(0);
    const executionPercent = (topExecutor.execution_ratio * 100).toFixed(0);

    return `${topCreator.person} creates ${creationPercent}% of tasks while ${topExecutor.person} executes ${executionPercent}%. This is the classic 60/40 cognitive load split: task execution may look equal, but task creation (noticing what needs doing) is invisible labor that falls disproportionately on one person.`;
  }

  _generateFairPlayInsight(data) {
    if (!data || data.length === 0) {
      return 'No Fair Play phase data available yet.';
    }

    const topInvisible = [...data].sort((a, b) => b.invisible_percentage - a.invisible_percentage)[0];
    const invisiblePercent = (topInvisible.invisible_percentage * 100).toFixed(0);

    return `${topInvisible.person} spends ${invisiblePercent}% of their family work time on invisible labor (conception + planning phases) vs only ${(topInvisible.visible_percentage * 100).toFixed(0)}% on visible execution. That's ${topInvisible.invisible_labor_minutes} minutes/week of invisible work.`;
  }

  _generateInvisibleLaborSummary(data) {
    return {
      keyFindings: [
        'Task execution may look equal, but cognitive load is not',
        'Anticipation, monitoring, and research are significant invisible labor',
        'Fair Play framework reveals 60-75% of work is in conception/planning phases'
      ],
      recommendations: [
        'Redistribute anticipation burden: share "noticing" responsibilities',
        'Reduce monitoring: assign complete ownership (all 3 phases)',
        'Value research labor: if you research, you should decide'
      ]
    };
  }

  _generateBottleneckInsight(data) {
    if (!data || data.length === 0) return 'No coordination data available yet.';

    const top = data[0];
    return `${top.person} has the highest coordination burden (betweenness centrality: ${top.coordination_burden?.toFixed(2)}). They are critical in the family's task/information flow - if unavailable, workflows break. Current cognitive load: ${(top.current_load * 100).toFixed(0)}%, stress: ${(top.stress_level * 100).toFixed(0)}%.`;
  }

  _generateFragmentationInsight(data) {
    if (!data || data.length === 0) return 'No fragmentation data available yet.';

    const mostFragmented = [...data].sort((a, b) => b.fragmentation_score - a.fragmentation_score)[0];

    return `${mostFragmented.person} has tasks scattered across ${mostFragmented.task_clusters} different domains (fragmentation score: ${mostFragmented.fragmentation_score?.toFixed(2)}). High fragmentation means high context-switching burden. Healthier distribution: complete ownership of fewer domains.`;
  }

  _generateDependencyInsight(data) {
    if (!data || data.length === 0) return 'No dependency data available yet.';

    const top = data[0];
    return `${top.person} is a single point of failure for ${top.dependent_tasks} tasks. If they're unavailable, these tasks (and their downstream dependencies) can't proceed. Maximum dependency chain length: ${top.max_chain_length} tasks deep.`;
  }

  _generateTemporalInsight(data) {
    if (!data || data.length === 0) return 'No temporal pattern data available yet.';

    // Find peak creation time
    const sorted = [...data].sort((a, b) => b.tasks_created - a.tasks_created);
    const peak = sorted[0];

    return `Peak task creation: ${peak.day_name} at ${peak.hour_of_day}:00 (${peak.tasks_created} tasks). This "Sunday night planning session" pattern is common - one person frontloads cognitive work for the week.`;
  }

  // ==========================================
  // CHILD INSIGHTS WITH CLAUDE
  // ==========================================

  async _generateChildInsightsWithClaude(childData) {
    const prompt = `Analyze this child's data and provide deep psychological insights:

Child: ${childData.name}, Age: ${childData.age}

Recent Activities: ${JSON.stringify(childData.recentActivities)}
Interests: ${JSON.stringify(childData.interests)}
Parent Observations: ${JSON.stringify(childData.parentObservations)}

Generate 5 insights:
1. Core personality traits (Big 5)
2. Hidden talents or strengths
3. Potential challenges
4. Communication style
5. Emotional patterns

Format as JSON with confidence scores (0-1).`;

    try {
      const response = await ClaudeService.generateResponse(prompt, {
        model: 'claude-opus-4.1',
        max_tokens: 2000,
        temperature: 0.3
      });

      return JSON.parse(response.content);
    } catch (error) {
      console.error('Claude insight generation failed:', error.message);
      return [];
    }
  }

  async _getChildContext(familyId, childId) {
    // Query Neo4j for child data
    const query = `
      MATCH (c:Person {id: $childId, familyId: $familyId})
      OPTIONAL MATCH (c)-[:PARTICIPATES_IN]->(activity:Event)
      OPTIONAL MATCH (c)-[:HAS_INTEREST]->(interest:Interest)
      RETURN c, collect(DISTINCT activity) AS activities, collect(DISTINCT interest) AS interests
    `;

    const result = await this.neo4j.runQuery(query, { familyId, childId });
    return result[0] || {};
  }

  // ==========================================
  // CACHE HELPERS
  // ==========================================

  _getFromCache(key) {
    const cached = this.insightCache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > this.cacheTimeout) {
      this.insightCache.delete(key);
      return null;
    }

    return cached.data;
  }

  _setCache(key, data) {
    this.insightCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  _calculateAverageConfidence(insights) {
    if (!insights || insights.length === 0) return 0;
    const sum = insights.reduce((acc, i) => acc + (i.confidence || 0), 0);
    return sum / insights.length;
  }

  _classifyQuery(query) {
    const lower = query.toLowerCase();

    if (lower.includes('invisible') || lower.includes('labor') || lower.includes('burden')) {
      return 'invisible_labor';
    }

    if (lower.includes('coordination') || lower.includes('bottleneck')) {
      return 'coordination';
    }

    if (lower.includes('child') || lower.includes('about ')) {
      return 'child_insights';
    }

    if (lower.includes('when') || lower.includes('pattern') || lower.includes('time')) {
      return 'temporal';
    }

    return 'invisible_labor'; // default
  }

  async _findChildIdByName(familyId, childName) {
    const query = `
      MATCH (c:Person {familyId: $familyId})
      WHERE toLower(c.name) CONTAINS toLower($childName) AND c.role = 'child'
      RETURN c.id AS childId
      LIMIT 1
    `;

    const result = await this.neo4j.runQuery(query, { familyId, childName });
    return result[0]?.childId;
  }

  async _generateNaturalLanguageResponse(query, results) {
    // Use Claude to generate conversational response
    const prompt = `The user asked: "${query}"

Here are the results: ${JSON.stringify(results, null, 2)}

Generate a conversational, empathetic response (2-3 paragraphs) explaining these insights in plain language. Focus on actionable takeaways.`;

    try {
      const response = await ClaudeService.generateResponse(prompt, {
        model: 'claude-opus-4.1',
        max_tokens: 500,
        temperature: 0.5
      });

      return response.content;
    } catch (error) {
      console.error('Natural language generation failed:', error.message);
      return 'Here are the insights from your query...';
    }
  }
}

// Singleton instance
const parentingIntelligenceService = new ParentingIntelligenceService();

export default parentingIntelligenceService;
