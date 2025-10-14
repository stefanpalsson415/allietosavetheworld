// src/services/forensics/InvisibleLoadForensicsService.js
import { db } from '../firebase';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import allieHarmonyDetective from '../agents/AllieHarmonyDetectiveAgent';
import powerFeaturesKnowledgeGraph from '../quantum/PowerFeaturesKnowledgeGraphIntegration';
import CognitiveLoadQuantifier from './CognitiveLoadQuantifier';

/**
 * Invisible Load Forensics Service
 *
 * Transforms Allie into a detective that uncovers hidden cognitive labor by
 * cross-referencing survey responses with actual behavioral data, revealing
 * the true distribution of mental load with dramatic "evidence presentations."
 *
 * Core functionality:
 * 1. Multi-modal data fusion from surveys, calendar, messages, email, tasks
 * 2. Discrepancy detection between self-reports and actual behavior
 * 3. Cognitive load quantification algorithms
 * 4. Dramatic "reveal moments" with evidence presentation
 */
class InvisibleLoadForensicsService {
  constructor() {
    this.cognitiveLoadQuantifier = new CognitiveLoadQuantifier();
    this.detective = allieHarmonyDetective;

    // Data source handlers
    this.dataSources = {
      surveys: new SurveyDataSource(),
      calendar: new CalendarDataSource(),
      messages: new MessageDataSource(),
      email: new EmailDataSource(),
      tasks: new TaskDataSource()
    };

    // Evidence type classifications
    this.evidenceTypes = {
      HIDDEN_PLANNING: {
        name: 'hidden_planning',
        description: 'Planning work that happens invisibly',
        weight: 0.9
      },
      UNACKNOWLEDGED_COORDINATION: {
        name: 'unacknowledged_coordination',
        description: 'Coordination work that goes unrecognized',
        weight: 0.85
      },
      INVISIBLE_ANTICIPATION: {
        name: 'invisible_anticipation',
        description: 'Anticipatory thinking and preparation',
        weight: 0.8
      },
      EMOTIONAL_LABOR: {
        name: 'emotional_labor',
        description: 'Emotional support and regulation work',
        weight: 0.9
      },
      MENTAL_TRACKING: {
        name: 'mental_tracking',
        description: 'Keeping track of details and information',
        weight: 0.75
      },
      DECISION_MAKING: {
        name: 'decision_making',
        description: 'Making decisions and choices for the family',
        weight: 0.8
      },
      INFORMATION_SYNTHESIS: {
        name: 'information_synthesis',
        description: 'Connecting information from multiple sources',
        weight: 0.85
      }
    };

    // Investigation cache
    this.investigationCache = new Map();
    this.activeInvestigations = new Map();
  }

  /**
   * Conduct comprehensive forensic analysis of family's invisible load
   * @param {string} familyId - Family identifier
   * @param {string} memberId - Optional: specific member to investigate
   * @param {Object} options - Investigation options
   * @returns {Promise<Object>} Complete forensics investigation results
   */
  async conductForensicAnalysis(familyId, memberId = null, options = {}) {
    console.log(`🔍 Starting forensic analysis for family ${familyId}`);

    try {
      const investigationId = `inv_${familyId}_${Date.now()}`;

      // Mark investigation as active
      this.activeInvestigations.set(investigationId, {
        familyId,
        memberId,
        status: 'in_progress',
        startTime: new Date()
      });

      // 1. Collect all family survey self-reports
      const selfReports = await this.getSelfReportedLoad(familyId, memberId);
      console.log(`📋 Collected ${Object.keys(selfReports).length} self-reports`);

      // 2. Gather actual behavioral data from multiple sources
      const actualData = await this.gatherMultiModalEvidence(familyId, memberId);
      console.log(`📊 Gathered multi-modal evidence`);

      // 3. Detect discrepancies between reports and reality
      const discrepancies = await this.detectDiscrepancies(selfReports, actualData);
      console.log(`⚖️ Found ${discrepancies.length} discrepancies`);

      // 4. Quantify hidden cognitive load
      const hiddenLoad = await this.quantifyHiddenCognitiveLoad(discrepancies, actualData);
      console.log(`🧠 Quantified hidden load: ${hiddenLoad.totalScore}`);

      // 5. Generate compelling evidence presentation
      const evidence = await this.generateEvidencePresentation(hiddenLoad, discrepancies, actualData);
      console.log(`🎯 Generated ${evidence.length} pieces of evidence`);

      // 6. Create revelation moments for dramatic impact
      const revelationMoments = await this.createRevelationMoments(evidence, hiddenLoad);
      console.log(`✨ Created ${revelationMoments.length} revelation moments`);

      // 7. Compile complete investigation results
      const investigationResults = {
        investigationId,
        familyId,
        memberId,
        timestamp: new Date(),

        // Core findings
        selfReports,
        actualData,
        discrepancies,
        hiddenLoad,
        evidence,
        revelationMoments,

        // Summary metrics
        overallImbalance: this.calculateOverallImbalance(hiddenLoad),
        hiddenLoadPercentage: this.calculateHiddenLoadPercentage(hiddenLoad),
        investigationScore: this.calculateInvestigationScore(evidence),

        // Actionable insights
        recommendations: await this.generateRecommendations(hiddenLoad, discrepancies),

        // Detective narrative
        narrative: await this.generateDetectiveNarrative(investigationResults)
      };

      // 8. Store in knowledge graph
      await powerFeaturesKnowledgeGraph.integrateForensicsData(familyId, investigationResults);

      // 9. Cache results
      this.investigationCache.set(investigationId, investigationResults);

      // 10. Mark investigation complete
      this.activeInvestigations.set(investigationId, {
        ...this.activeInvestigations.get(investigationId),
        status: 'completed',
        endTime: new Date()
      });

      console.log(`✅ Forensic analysis complete: ${investigationId}`);
      return investigationResults;

    } catch (error) {
      console.error('🚨 Forensic analysis failed:', error);
      throw new Error(`Forensic analysis failed: ${error.message}`);
    }
  }

  /**
   * Get self-reported load distribution from surveys AND interview insights
   * @param {string} familyId - Family identifier
   * @param {string} memberId - Optional member filter
   * @returns {Promise<Object>} Self-reported load data
   */
  async getSelfReportedLoad(familyId, memberId = null) {
    try {
      const selfReports = {
        sources: {
          surveys: {},
          interviews: {}
        },
        combined: {}
      };

      // STEP 1: Get interview insights (highest quality data)
      const interviewInsights = await powerFeaturesKnowledgeGraph.getInterviewInsights(familyId);
      if (interviewInsights) {
        console.log('📝 Loading interview insights into forensic analysis');

        // Extract invisible work patterns from interviews
        if (interviewInsights.invisibleWorkPatterns) {
          selfReports.sources.interviews.invisibleWork = interviewInsights.invisibleWorkPatterns;

          // Add mental load distribution from interviews
          if (interviewInsights.invisibleWorkPatterns.mentalLoadDistribution) {
            selfReports.combined.mentalLoadDistribution = interviewInsights.invisibleWorkPatterns.mentalLoadDistribution;
          }

          // Add identified patterns
          if (interviewInsights.invisibleWorkPatterns.identifiedPatterns) {
            selfReports.sources.interviews.patterns = interviewInsights.invisibleWorkPatterns.identifiedPatterns;
          }
        }

        // Extract stress capacity data from interviews
        if (interviewInsights.stressCapacityData) {
          selfReports.sources.interviews.stressCapacity = interviewInsights.stressCapacityData;
        }

        // Extract decision-making patterns from interviews
        if (interviewInsights.decisionMakingStyles) {
          selfReports.sources.interviews.decisionMaking = interviewInsights.decisionMakingStyles;
        }

        // Add interview-specific insights for individuals
        if (interviewInsights.interviewInsights) {
          Object.entries(interviewInsights.interviewInsights).forEach(([interviewType, data]) => {
            if (data.participantSpecificInsights) {
              selfReports.sources.interviews[interviewType] = data.participantSpecificInsights;
            }
          });
        }
      }

      // STEP 2: Query recent survey responses
      let surveysQuery = query(
        collection(db, 'surveyResponses'),
        where('familyId', '==', familyId),
        orderBy('completedAt', 'desc'),
        limit(10)
      );

      if (memberId) {
        surveysQuery = query(
          collection(db, 'surveyResponses'),
          where('familyId', '==', familyId),
          where('userId', '==', memberId),
          orderBy('completedAt', 'desc'),
          limit(5)
        );
      }

      const surveysSnapshot = await getDocs(surveysQuery);
      const surveys = surveysSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Extract load-related responses from surveys
      for (const survey of surveys) {
        if (survey.responses) {
          for (const [questionId, response] of Object.entries(survey.responses)) {
            // Map responses to load categories
            const loadCategory = this.mapQuestionToLoadCategory(questionId, response);
            if (loadCategory) {
              selfReports.sources.surveys[`${survey.userId}_${loadCategory}`] = {
                userId: survey.userId,
                category: loadCategory,
                reported: response,
                questionId,
                surveyId: survey.id,
                timestamp: survey.completedAt
              };
            }
          }
        }
      }

      return selfReports;

    } catch (error) {
      console.error('Error getting self-reported load:', error);
      return {};
    }
  }

  /**
   * Gather multi-modal evidence from all family data sources
   * @param {string} familyId - Family identifier
   * @param {string} memberId - Optional member filter
   * @returns {Promise<Object>} Comprehensive evidence data
   */
  async gatherMultiModalEvidence(familyId, memberId = null) {
    console.log(`📡 Gathering multi-modal evidence for family ${familyId}`);

    try {
      const evidence = {};

      // Parallel data collection for performance
      const [
        calendarEvidence,
        messageEvidence,
        taskEvidence,
        emailEvidence,
        temporalEvidence
      ] = await Promise.all([
        this.dataSources.calendar.analyzePatterns(familyId, memberId),
        this.dataSources.messages.analyzePatterns(familyId, memberId),
        this.dataSources.tasks.analyzePatterns(familyId, memberId),
        this.dataSources.email.analyzePatterns(familyId, memberId),
        this.analyzeTemporalPatterns(familyId, memberId)
      ]);

      evidence.calendar = calendarEvidence;
      evidence.messages = messageEvidence;
      evidence.tasks = taskEvidence;
      evidence.email = emailEvidence;
      evidence.temporal = temporalEvidence;

      // Calculate member-specific metrics
      if (memberId) {
        evidence.memberSpecific = await this.calculateMemberSpecificMetrics(
          familyId,
          memberId,
          evidence
        );
      }

      // Cross-reference and validate data
      evidence.crossReferences = await this.crossReferenceDataSources(evidence);

      console.log(`📊 Multi-modal evidence gathered successfully`);
      return evidence;

    } catch (error) {
      console.error('Error gathering multi-modal evidence:', error);
      return {};
    }
  }

  /**
   * Detect discrepancies between self-reports and actual data
   * @param {Object} selfReports - Survey self-reports
   * @param {Object} actualData - Behavioral evidence
   * @returns {Promise<Array>} Array of discrepancies found
   */
  async detectDiscrepancies(selfReports, actualData) {
    console.log(`⚖️ Detecting discrepancies between reports and reality`);

    const discrepancies = [];

    try {
      // Check each self-report against actual data
      for (const [reportKey, report] of Object.entries(selfReports)) {
        const actualMetric = this.findCorrespondingActualData(report, actualData);

        if (actualMetric) {
          const discrepancy = await this.calculateDiscrepancy(report, actualMetric);

          if (discrepancy.significance > 0.3) { // Significant discrepancy threshold
            discrepancies.push({
              id: `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: this.classifyDiscrepancyType(discrepancy),
              report,
              actual: actualMetric,
              discrepancy,
              evidence: await this.generateDiscrepancyEvidence(report, actualMetric),
              impact: this.calculateDiscrepancyImpact(discrepancy),
              timestamp: new Date()
            });
          }
        }
      }

      // Look for patterns in discrepancies
      const patterns = this.identifyDiscrepancyPatterns(discrepancies);

      console.log(`⚖️ Found ${discrepancies.length} significant discrepancies`);
      return discrepancies.map(d => ({ ...d, patterns }));

    } catch (error) {
      console.error('Error detecting discrepancies:', error);
      return [];
    }
  }

  /**
   * Quantify hidden cognitive load using advanced algorithms
   * @param {Array} discrepancies - Detected discrepancies
   * @param {Object} actualData - Behavioral evidence
   * @returns {Promise<Object>} Quantified hidden load metrics
   */
  async quantifyHiddenCognitiveLoad(discrepancies, actualData) {
    console.log(`🧠 Quantifying hidden cognitive load`);

    try {
      const hiddenLoad = {
        totalScore: 0,
        categoryBreakdown: {},
        memberBreakdown: {},
        timeDistribution: {},
        complexityFactors: {},
        invisibilityFactors: {}
      };

      // Use cognitive load quantifier for detailed analysis
      const quantificationResults = await this.cognitiveLoadQuantifier.quantifyLoad({
        discrepancies,
        actualData,
        evidenceTypes: this.evidenceTypes
      });

      hiddenLoad.totalScore = quantificationResults.totalScore;
      hiddenLoad.categoryBreakdown = quantificationResults.categoryBreakdown;
      hiddenLoad.memberBreakdown = quantificationResults.memberBreakdown;

      // Calculate additional hidden load factors
      hiddenLoad.anticipatoryLoad = await this.calculateAnticipatoryLoad(actualData);
      hiddenLoad.coordinationLoad = await this.calculateCoordinationLoad(actualData);
      hiddenLoad.emotionalLoad = await this.calculateEmotionalLoad(actualData);
      hiddenLoad.informationLoad = await this.calculateInformationLoad(actualData);

      // Analyze temporal distribution
      hiddenLoad.timeDistribution = await this.analyzeTemporalLoadDistribution(actualData);

      // Calculate complexity multipliers
      hiddenLoad.complexityFactors = await this.calculateComplexityFactors(actualData);

      // Assess invisibility factors
      hiddenLoad.invisibilityFactors = await this.assessInvisibilityFactors(discrepancies);

      console.log(`🧠 Hidden load quantification complete: ${hiddenLoad.totalScore}`);
      return hiddenLoad;

    } catch (error) {
      console.error('Error quantifying hidden cognitive load:', error);
      return { totalScore: 0, categoryBreakdown: {}, memberBreakdown: {} };
    }
  }

  /**
   * Generate compelling evidence presentation for dramatic reveals
   * @param {Object} hiddenLoad - Quantified hidden load
   * @param {Array} discrepancies - Found discrepancies
   * @param {Object} actualData - Behavioral evidence
   * @returns {Promise<Array>} Array of evidence pieces
   */
  async generateEvidencePresentation(hiddenLoad, discrepancies, actualData) {
    console.log(`🎯 Generating evidence presentation`);

    const evidence = [];

    try {
      // Generate evidence for each discrepancy
      for (const discrepancy of discrepancies) {
        const evidencePiece = {
          id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: discrepancy.type,
          title: this.generateEvidenceTitle(discrepancy),
          description: this.generateEvidenceDescription(discrepancy),
          strength: this.calculateEvidenceStrength(discrepancy),
          dataPoints: await this.generateEvidenceDataPoints(discrepancy, actualData),
          visualization: this.generateEvidenceVisualization(discrepancy),
          impact: discrepancy.impact,
          source: 'forensic_analysis',
          timestamp: new Date()
        };

        evidence.push(evidencePiece);
      }

      // Generate aggregate evidence pieces
      const aggregateEvidence = await this.generateAggregateEvidence(hiddenLoad, actualData);
      evidence.push(...aggregateEvidence);

      // Generate surprise evidence (unexpected findings)
      const surpriseEvidence = await this.generateSurpriseEvidence(hiddenLoad, actualData);
      evidence.push(...surpriseEvidence);

      console.log(`🎯 Generated ${evidence.length} pieces of evidence`);
      return evidence;

    } catch (error) {
      console.error('Error generating evidence presentation:', error);
      return [];
    }
  }

  /**
   * Create revelation moments for dramatic family insights
   * @param {Array} evidence - Generated evidence
   * @param {Object} hiddenLoad - Hidden load metrics
   * @returns {Promise<Array>} Array of revelation moments
   */
  async createRevelationMoments(evidence, hiddenLoad) {
    console.log(`✨ Creating revelation moments`);

    const revelations = [];

    try {
      // Top discrepancy revelation
      const topEvidence = evidence.sort((a, b) => b.strength - a.strength)[0];
      if (topEvidence) {
        revelations.push({
          id: `rev_${Date.now()}_top`,
          type: 'major_discrepancy',
          title: this.generateRevelationTitle(topEvidence),
          description: this.generateRevelationDescription(topEvidence),
          impact: 'high',
          surprise: this.calculateSurpriseLevel(topEvidence),
          actionable: this.generateActionableInsights(topEvidence),
          emotionalResonance: this.calculateEmotionalResonance(topEvidence),
          timestamp: new Date()
        });
      }

      // Hidden workload revelation
      if (hiddenLoad.totalScore > 50) {
        revelations.push({
          id: `rev_${Date.now()}_hidden`,
          type: 'hidden_workload',
          title: "The Hidden Work That No One Sees",
          description: this.generateHiddenWorkloadDescription(hiddenLoad),
          impact: 'high',
          surprise: 'medium',
          actionable: this.generateHiddenWorkloadActions(hiddenLoad),
          emotionalResonance: 'high',
          timestamp: new Date()
        });
      }

      // Pattern revelation
      const patterns = this.identifyRevealablePatterns(evidence, hiddenLoad);
      if (patterns.length > 0) {
        revelations.push({
          id: `rev_${Date.now()}_pattern`,
          type: 'behavioral_pattern',
          title: "Your Family's Hidden Pattern",
          description: this.generatePatternDescription(patterns),
          impact: 'medium',
          surprise: 'high',
          actionable: this.generatePatternActions(patterns),
          emotionalResonance: 'medium',
          timestamp: new Date()
        });
      }

      console.log(`✨ Created ${revelations.length} revelation moments`);
      return revelations;

    } catch (error) {
      console.error('Error creating revelation moments:', error);
      return [];
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Map survey question to load category
   */
  mapQuestionToLoadCategory(questionId, response) {
    // Implementation would map specific questions to load categories
    // Based on your existing survey structure
    const categoryMappings = {
      'scheduling': 'coordination',
      'planning': 'planning',
      'remembering': 'tracking',
      'coordinating': 'coordination',
      'anticipating': 'anticipation'
    };

    for (const [keyword, category] of Object.entries(categoryMappings)) {
      if (questionId.toLowerCase().includes(keyword)) {
        return category;
      }
    }

    return null;
  }

  /**
   * Find corresponding actual data for a self-report
   */
  findCorrespondingActualData(report, actualData) {
    // Implementation would match self-reports to actual behavioral data
    // This is a placeholder for the complex matching logic
    return actualData.calendar?.coordination || null;
  }

  /**
   * Calculate discrepancy between report and actual
   */
  async calculateDiscrepancy(report, actual) {
    const reportedValue = this.normalizeReportedValue(report.reported);
    const actualValue = this.normalizeActualValue(actual);

    const difference = Math.abs(actualValue - reportedValue);
    const significance = difference / Math.max(actualValue, reportedValue, 0.1);

    return {
      reported: reportedValue,
      actual: actualValue,
      difference,
      significance,
      direction: actualValue > reportedValue ? 'underreported' : 'overreported'
    };
  }

  /**
   * Normalize reported survey values to 0-1 scale
   */
  normalizeReportedValue(reported) {
    // Convert survey responses to normalized values
    if (typeof reported === 'string') {
      const mappings = {
        'never': 0,
        'rarely': 0.2,
        'sometimes': 0.4,
        'often': 0.6,
        'usually': 0.8,
        'always': 1.0
      };
      return mappings[reported.toLowerCase()] || 0.5;
    }

    if (typeof reported === 'number') {
      return Math.min(1, Math.max(0, reported / 100));
    }

    return 0.5; // Default middle value
  }

  /**
   * Normalize actual behavioral values to 0-1 scale
   */
  normalizeActualValue(actual) {
    // Convert behavioral metrics to normalized values
    if (actual && typeof actual === 'object') {
      return actual.normalized || actual.percentage / 100 || 0;
    }

    if (typeof actual === 'number') {
      return Math.min(1, Math.max(0, actual));
    }

    return 0;
  }

  /**
   * Calculate overall imbalance score
   */
  calculateOverallImbalance(hiddenLoad) {
    return hiddenLoad.totalScore / 100; // Convert to 0-1 scale
  }

  /**
   * Calculate hidden load percentage
   */
  calculateHiddenLoadPercentage(hiddenLoad) {
    const totalLoad = hiddenLoad.totalScore + 100; // Assume 100 base load
    return (hiddenLoad.totalScore / totalLoad) * 100;
  }

  /**
   * Calculate investigation quality score
   */
  calculateInvestigationScore(evidence) {
    if (evidence.length === 0) return 0;

    const avgStrength = evidence.reduce((sum, ev) => sum + ev.strength, 0) / evidence.length;
    const varietyBonus = Math.min(evidence.length / 10, 1); // Bonus for variety

    return Math.round((avgStrength * 70 + varietyBonus * 30));
  }

  /**
   * Generate actionable recommendations
   */
  async generateRecommendations(hiddenLoad, discrepancies) {
    const recommendations = [];

    // Generate recommendations based on findings
    if (hiddenLoad.totalScore > 70) {
      recommendations.push({
        type: 'immediate',
        title: 'Redistribute Cognitive Load',
        description: 'Urgent action needed to rebalance mental workload',
        actions: ['Schedule load redistribution meeting', 'Identify 3 tasks to transfer']
      });
    }

    if (discrepancies.length > 3) {
      recommendations.push({
        type: 'awareness',
        title: 'Increase Load Visibility',
        description: 'Make invisible work more visible to family members',
        actions: ['Share investigation results', 'Create visibility systems']
      });
    }

    return recommendations;
  }

  /**
   * Get investigation results by ID
   */
  async getInvestigationResults(investigationId) {
    return this.investigationCache.get(investigationId) || null;
  }

  /**
   * Get recent investigations for family
   */
  async getRecentInvestigations(familyId, limit = 5) {
    const investigations = [];

    for (const [id, investigation] of this.investigationCache) {
      if (investigation.familyId === familyId) {
        investigations.push({ id, ...investigation });
      }
    }

    return investigations
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }
}

// Data source classes (simplified implementations)
class SurveyDataSource {
  async analyzePatterns(familyId, memberId) {
    // Analyze survey response patterns
    return { responsePatterns: [], consistency: 0.8 };
  }
}

class CalendarDataSource {
  async analyzePatterns(familyId, memberId) {
    // Analyze calendar creation and management patterns
    return {
      coordination: { percentage: 85, normalized: 0.85 },
      complexity: 0.7,
      anticipatoryPlanning: 0.6
    };
  }
}

class MessageDataSource {
  async analyzePatterns(familyId, memberId) {
    // Analyze message coordination patterns
    return {
      coordinationMessages: [],
      planningMessages: [],
      reminderMessages: []
    };
  }
}

class EmailDataSource {
  async analyzePatterns(familyId, memberId) {
    // Analyze email management patterns
    return {
      schoolEmails: [],
      appointmentEmails: [],
      coordinationEmails: []
    };
  }
}

class TaskDataSource {
  async analyzePatterns(familyId, memberId) {
    // Analyze task creation and management patterns
    return {
      taskCreation: [],
      taskAssignment: [],
      taskCompletion: []
    };
  }
}

export default InvisibleLoadForensicsService;
export { InvisibleLoadForensicsService };