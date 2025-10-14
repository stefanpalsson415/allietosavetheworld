/**
 * Task Weight API - Microservice for advanced task weight calculations
 * 
 * This service provides calculation, storage, and learning for family task weights.
 * It serves as a foundation for the family balance personalization platform.
 */

// Core dependencies
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const admin = require('firebase-admin');
const winston = require('winston');

// Import our custom modules
const weightCalculator = require('./lib/weight-calculator');
const versionManager = require('./lib/version-manager');
const familyProfiler = require('./lib/family-profiler');
const dataStorage = require('./lib/data-storage');
const weightEvolution = require('./lib/weight-evolution');
const burnoutPrevention = require('./lib/burnout-prevention');
const lifeStageAdapter = require('./lib/life-stage-adapter');
const culturalContext = require('./lib/cultural-context');
const relationshipStyle = require('./lib/relationship-style');
const logger = require('./lib/logger');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin SDK if not running in cloud functions
if (!process.env.FIREBASE_FUNCTION) {
  admin.initializeApp({
    credential: process.env.FIREBASE_SERVICE_ACCOUNT 
      ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
      : admin.credential.applicationDefault()
  });
}

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger.requestLogger);

// --------------- Helper Functions ---------------

/**
 * Generate priority recommendations from all analysis systems
 * @param {Object} burnoutAssessment - Burnout risk assessment
 * @param {Object} lifeStageAnalysis - Life stage analysis
 * @param {Object} culturalAnalysis - Cultural context analysis
 * @param {Object} relationshipAnalysis - Relationship style analysis
 * @returns {Array} Priority recommendations
 */
function generatePriorityRecommendations(
  burnoutAssessment,
  lifeStageAnalysis,
  culturalAnalysis,
  relationshipAnalysis
) {
  const recommendations = [];
  
  // Add burnout interventions (highest priority if severe or high risk)
  if (burnoutAssessment && burnoutAssessment.hasRisk && 
      (burnoutAssessment.riskLevel === 'severe' || burnoutAssessment.riskLevel === 'high')) {
    
    // Get high priority interventions
    const interventions = burnoutAssessment.interventions || [];
    const highPriorityInterventions = interventions.filter(i => i.priority === 'high');
    
    // Add up to 2 high priority burnout interventions
    highPriorityInterventions.slice(0, 2).forEach(intervention => {
      recommendations.push({
        source: 'burnout',
        priority: 'critical',
        title: intervention.message,
        description: intervention.description,
        actions: intervention.suggestedActions,
        category: 'Burnout Prevention'
      });
    });
  }
  
  // Add life stage transition recommendations (high priority)
  if (lifeStageAnalysis && lifeStageAnalysis.transitions && lifeStageAnalysis.transitions.length > 0) {
    // Sort transitions by intensity
    const transitions = [...lifeStageAnalysis.transitions];
    transitions.sort((a, b) => {
      const intensityOrder = { high: 3, moderate: 2, low: 1 };
      return intensityOrder[b.intensityLevel || 'moderate'] - intensityOrder[a.intensityLevel || 'moderate'];
    });
    
    // Add the most significant transition
    const topTransition = transitions[0];
    
    recommendations.push({
      source: 'lifestage',
      priority: 'high',
      title: `Supporting ${topTransition.type.replace(/_/g, ' ')}`,
      description: topTransition.description,
      category: 'Life Stage Adaptation'
    });
  }
  
  // Add relationship recommendations (medium-high priority)
  if (relationshipAnalysis && relationshipAnalysis.insights && relationshipAnalysis.insights.length > 0) {
    // Find the most relevant insight
    const relationshipInsight = relationshipAnalysis.insights[0];
    
    recommendations.push({
      source: 'relationship',
      priority: 'medium',
      title: relationshipInsight.topic,
      description: relationshipInsight.insight,
      category: 'Relationship Dynamics'
    });
  }
  
  // Add cultural context recommendations (medium priority)
  if (culturalAnalysis && culturalAnalysis.insights && culturalAnalysis.insights.length > 0) {
    // Find the most relevant insight
    const culturalInsight = culturalAnalysis.insights[0];
    
    recommendations.push({
      source: 'culture',
      priority: 'medium',
      title: culturalInsight.topic,
      description: culturalInsight.insight,
      category: 'Cultural Context'
    });
  }
  
  // Add moderate burnout risk recommendations if not already handled
  if (burnoutAssessment && burnoutAssessment.hasRisk && 
      burnoutAssessment.riskLevel === 'moderate' &&
      !recommendations.some(r => r.source === 'burnout')) {
    
    const interventions = burnoutAssessment.interventions || [];
    const intervention = interventions[0];
    
    if (intervention) {
      recommendations.push({
        source: 'burnout',
        priority: 'medium',
        title: intervention.message,
        description: intervention.description,
        actions: intervention.suggestedActions,
        category: 'Workload Management'
      });
    }
  }
  
  // Sort by priority
  const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
  recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  
  // Return top 3-5 recommendations
  return recommendations.slice(0, 5);
}

// --------------- API Routes ---------------

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

/**
 * Calculate weight for a single task
 */
app.post('/calculate', async (req, res) => {
  try {
    const { task, familyId, familyPriorities, version } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task data is required' });
    }
    
    // Get requested version or use latest
    const calculatorVersion = version || await versionManager.getLatestVersion();
    
    // Get family profile if familyId is provided
    let familyProfile = null;
    if (familyId) {
      familyProfile = await familyProfiler.getFamilyProfile(familyId);
    }
    
    // Calculate the weight
    const result = await weightCalculator.calculateTaskWeight(
      task, 
      familyPriorities, 
      familyProfile,
      calculatorVersion
    );
    
    // Log calculation for learning system
    await dataStorage.logCalculation(task, result, familyId);
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in weight calculation', { error: error.message });
    res.status(500).json({ error: 'Failed to calculate task weight', details: error.message });
  }
});

/**
 * Calculate enhanced weight for a single task
 * Incorporates all adaptation systems (life stage, cultural context, relationship style)
 */
app.post('/calculate/enhanced', async (req, res) => {
  try {
    const { task, familyId, familyPriorities, parentType, version } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task data is required' });
    }
    
    if (!familyId) {
      return res.status(400).json({ error: 'Family ID is required for enhanced calculation' });
    }
    
    // Get requested version or use latest
    const calculatorVersion = version || await versionManager.getLatestVersion();
    
    // Get family profile data
    const familyProfile = await familyProfiler.getFamilyProfile(familyId);
    
    // Calculate base weight
    let result = await weightCalculator.calculateTaskWeight(
      task, 
      familyPriorities, 
      familyProfile,
      calculatorVersion
    );
    
    // Get analysis data from each system (in parallel)
    const [
      lifeStageAnalysis,
      culturalAnalysis,
      relationshipAnalysis
    ] = await Promise.all([
      lifeStageAdapter.getLatestLifeStageAnalysis(familyId).catch(() => null),
      culturalContext.getLatestCulturalAnalysis(familyId).catch(() => null),
      relationshipStyle.getLatestRelationshipAnalysis(familyId).catch(() => null)
    ]);
    
    // Apply life stage adaptation
    let adjustedTask = { ...task, baseWeight: result.weight };
    
    // Track all applied adaptations
    const adaptations = [];
    
    // 1. Apply life stage adjustments if available
    if (lifeStageAnalysis && lifeStageAnalysis.weightAdjustments) {
      const beforeWeight = adjustedTask.baseWeight;
      adjustedTask = lifeStageAdapter.applyLifeStageAdjustments(
        adjustedTask,
        lifeStageAnalysis.weightAdjustments
      );
      
      // Record adaptation if applied
      if (adjustedTask.adjustmentContext) {
        adaptations.push({
          type: 'life_stage',
          beforeWeight,
          afterWeight: adjustedTask.baseWeight,
          multiplier: adjustedTask.adjustmentContext.multiplier,
          context: lifeStageAnalysis.lifeStages.map(s => s.lifeStage).join(', ')
        });
        
        // Clear context for next adaptation
        delete adjustedTask.adjustmentContext;
      }
    }
    
    // 2. Apply cultural context adjustments if available
    if (culturalAnalysis && culturalAnalysis.weightAdjustments) {
      const beforeWeight = adjustedTask.baseWeight;
      adjustedTask = culturalContext.applyCulturalAdjustments(
        adjustedTask,
        culturalAnalysis.weightAdjustments
      );
      
      // Record adaptation if applied
      if (adjustedTask.adjustmentContext) {
        adaptations.push({
          type: 'cultural_context',
          beforeWeight,
          afterWeight: adjustedTask.baseWeight,
          multiplier: adjustedTask.adjustmentContext.multiplier,
          context: culturalAnalysis.valueSystem
        });
        
        // Clear context for next adaptation
        delete adjustedTask.adjustmentContext;
      }
    }
    
    // 3. Apply relationship style adjustments if available and parentType specified
    if (relationshipAnalysis && relationshipAnalysis.weightAdjustments && parentType) {
      const beforeWeight = adjustedTask.baseWeight;
      adjustedTask = relationshipStyle.applyStyleAdjustments(
        adjustedTask,
        parentType,
        relationshipAnalysis.weightAdjustments
      );
      
      // Record adaptation if applied
      if (adjustedTask.adjustmentContext) {
        adaptations.push({
          type: 'relationship_style',
          beforeWeight,
          afterWeight: adjustedTask.baseWeight,
          multiplier: adjustedTask.adjustmentContext.multiplier,
          context: relationshipAnalysis.style,
          parentType
        });
        
        // Clear context
        delete adjustedTask.adjustmentContext;
      }
    }
    
    // Update result with enhanced weight and adaptations
    result.enhancedWeight = adjustedTask.baseWeight;
    result.weightAdaptations = adaptations;
    
    // Calculate total adaptation factor
    if (adaptations.length > 0) {
      result.totalAdaptationFactor = Math.round((result.enhancedWeight / result.weight) * 100) / 100;
    } else {
      result.totalAdaptationFactor = 1.0;
    }
    
    // Log the enhanced calculation
    await dataStorage.logCalculation(
      { ...task, enhancedCalculation: true }, 
      result, 
      familyId
    );
    
    res.status(200).json(result);
  } catch (error) {
    logger.error('Error in enhanced weight calculation', { error: error.message });
    res.status(500).json({ error: 'Failed to calculate enhanced task weight', details: error.message });
  }
});

/**
 * Calculate weights for multiple tasks (batch)
 */
app.post('/calculate/batch', async (req, res) => {
  try {
    const { tasks, familyId, familyPriorities, version } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }
    
    // Get requested version or use latest
    const calculatorVersion = version || await versionManager.getLatestVersion();
    
    // Get family profile if familyId is provided
    let familyProfile = null;
    if (familyId) {
      familyProfile = await familyProfiler.getFamilyProfile(familyId);
    }
    
    // Calculate weights for all tasks
    const results = await Promise.all(tasks.map(task => 
      weightCalculator.calculateTaskWeight(
        task, 
        familyPriorities, 
        familyProfile,
        calculatorVersion
      )
    ));
    
    // Log calculations for learning system
    await dataStorage.logBatchCalculation(tasks, results, familyId);
    
    res.status(200).json(results);
  } catch (error) {
    logger.error('Error in batch weight calculation', { error: error.message });
    res.status(500).json({ error: 'Failed to calculate task weights', details: error.message });
  }
});

/**
 * Calculate enhanced weights for multiple tasks (batch)
 * Incorporates all adaptation systems for each task
 */
app.post('/calculate/enhanced/batch', async (req, res) => {
  try {
    const { tasks, familyId, familyPriorities, parentType, version } = req.body;
    
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Tasks array is required' });
    }
    
    if (!familyId) {
      return res.status(400).json({ error: 'Family ID is required for enhanced calculation' });
    }
    
    // Get requested version or use latest
    const calculatorVersion = version || await versionManager.getLatestVersion();
    
    // Get family profile data
    const familyProfile = await familyProfiler.getFamilyProfile(familyId);
    
    // Calculate base weights for all tasks
    const baseResults = await Promise.all(tasks.map(task => 
      weightCalculator.calculateTaskWeight(
        task, 
        familyPriorities, 
        familyProfile,
        calculatorVersion
      )
    ));
    
    // Get analysis data from each system (in parallel, once for the whole batch)
    const [
      lifeStageAnalysis,
      culturalAnalysis,
      relationshipAnalysis
    ] = await Promise.all([
      lifeStageAdapter.getLatestLifeStageAnalysis(familyId).catch(() => null),
      culturalContext.getLatestCulturalAnalysis(familyId).catch(() => null),
      relationshipStyle.getLatestRelationshipAnalysis(familyId).catch(() => null)
    ]);
    
    // Apply adaptations to each result
    const enhancedResults = baseResults.map((result, index) => {
      const task = tasks[index];
      let adjustedTask = { ...task, baseWeight: result.weight };
      const adaptations = [];
      
      // 1. Apply life stage adjustments if available
      if (lifeStageAnalysis && lifeStageAnalysis.weightAdjustments) {
        const beforeWeight = adjustedTask.baseWeight;
        adjustedTask = lifeStageAdapter.applyLifeStageAdjustments(
          adjustedTask,
          lifeStageAnalysis.weightAdjustments
        );
        
        // Record adaptation if applied
        if (adjustedTask.adjustmentContext) {
          adaptations.push({
            type: 'life_stage',
            beforeWeight,
            afterWeight: adjustedTask.baseWeight,
            multiplier: adjustedTask.adjustmentContext.multiplier,
            context: lifeStageAnalysis.lifeStages.map(s => s.lifeStage).join(', ')
          });
          
          // Clear context for next adaptation
          delete adjustedTask.adjustmentContext;
        }
      }
      
      // 2. Apply cultural context adjustments if available
      if (culturalAnalysis && culturalAnalysis.weightAdjustments) {
        const beforeWeight = adjustedTask.baseWeight;
        adjustedTask = culturalContext.applyCulturalAdjustments(
          adjustedTask,
          culturalAnalysis.weightAdjustments
        );
        
        // Record adaptation if applied
        if (adjustedTask.adjustmentContext) {
          adaptations.push({
            type: 'cultural_context',
            beforeWeight,
            afterWeight: adjustedTask.baseWeight,
            multiplier: adjustedTask.adjustmentContext.multiplier,
            context: culturalAnalysis.valueSystem
          });
          
          // Clear context for next adaptation
          delete adjustedTask.adjustmentContext;
        }
      }
      
      // 3. Apply relationship style adjustments if available and parentType specified
      if (relationshipAnalysis && relationshipAnalysis.weightAdjustments && parentType) {
        const beforeWeight = adjustedTask.baseWeight;
        adjustedTask = relationshipStyle.applyStyleAdjustments(
          adjustedTask,
          parentType,
          relationshipAnalysis.weightAdjustments
        );
        
        // Record adaptation if applied
        if (adjustedTask.adjustmentContext) {
          adaptations.push({
            type: 'relationship_style',
            beforeWeight,
            afterWeight: adjustedTask.baseWeight,
            multiplier: adjustedTask.adjustmentContext.multiplier,
            context: relationshipAnalysis.style,
            parentType
          });
          
          // Clear context
          delete adjustedTask.adjustmentContext;
        }
      }
      
      // Update result with enhanced weight and adaptations
      const enhancedResult = { ...result };
      enhancedResult.enhancedWeight = adjustedTask.baseWeight;
      enhancedResult.weightAdaptations = adaptations;
      
      // Calculate total adaptation factor
      if (adaptations.length > 0) {
        enhancedResult.totalAdaptationFactor = Math.round((enhancedResult.enhancedWeight / result.weight) * 100) / 100;
      } else {
        enhancedResult.totalAdaptationFactor = 1.0;
      }
      
      return enhancedResult;
    });
    
    // Log the enhanced calculations
    await dataStorage.logBatchCalculation(
      tasks.map(task => ({ ...task, enhancedCalculation: true })),
      enhancedResults,
      familyId
    );
    
    res.status(200).json(enhancedResults);
  } catch (error) {
    logger.error('Error in enhanced batch calculation', { error: error.message });
    res.status(500).json({ error: 'Failed to calculate enhanced task weights', details: error.message });
  }
});

/**
 * Calculate survey balance based on responses
 */
app.post('/calculate/balance', async (req, res) => {
  try {
    const { fullQuestionSet, responses, familyPriorities, familyId, version } = req.body;
    
    if (!fullQuestionSet || !responses) {
      return res.status(400).json({ error: 'Question set and responses are required' });
    }
    
    // Get requested version or use latest
    const calculatorVersion = version || await versionManager.getLatestVersion();
    
    // Calculate balance scores
    const balanceScores = await weightCalculator.calculateBalanceScores(
      fullQuestionSet, 
      responses, 
      familyPriorities,
      calculatorVersion
    );
    
    // Store results for learning if familyId provided
    if (familyId) {
      await dataStorage.storeBalanceResults(familyId, balanceScores);
    }
    
    res.status(200).json(balanceScores);
  } catch (error) {
    logger.error('Error in balance calculation', { error: error.message });
    res.status(500).json({ error: 'Failed to calculate balance scores', details: error.message });
  }
});

/**
 * Get task weight calculation history for a specific task
 */
app.get('/history/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    const { limit } = req.query;
    
    const history = await dataStorage.getTaskHistory(taskId, limit);
    
    res.status(200).json(history);
  } catch (error) {
    logger.error('Error retrieving task history', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve task history', details: error.message });
  }
});

/**
 * Get available calculator versions
 */
app.get('/versions', async (req, res) => {
  try {
    const versions = await versionManager.getVersions();
    res.status(200).json(versions);
  } catch (error) {
    logger.error('Error retrieving calculator versions', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve calculator versions', details: error.message });
  }
});

/**
 * Submit feedback for task weights to improve the system
 */
app.post('/feedback', async (req, res) => {
  try {
    const { taskId, calculatedWeight, suggestedWeight, familyId, notes } = req.body;
    
    if (!taskId || !calculatedWeight || !suggestedWeight) {
      return res.status(400).json({ error: 'Task ID, calculated weight, and suggested weight are required' });
    }
    
    await dataStorage.storeFeedback(taskId, calculatedWeight, suggestedWeight, familyId, notes);
    
    res.status(200).json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    logger.error('Error storing weight feedback', { error: error.message });
    res.status(500).json({ error: 'Failed to submit feedback', details: error.message });
  }
});

/**
 * Get family-specific weight profile
 */
app.get('/family/:familyId/profile', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const profile = await familyProfiler.getFamilyProfile(familyId);
    
    res.status(200).json(profile);
  } catch (error) {
    logger.error('Error retrieving family profile', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve family profile', details: error.message });
  }
});

/**
 * Get comprehensive family insights
 * Combines data from all analysis systems
 */
app.get('/family/:familyId/insights', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    // Run all analysis in parallel
    const [
      profile,
      burnoutAssessment,
      lifeStageAnalysis,
      culturalAnalysis,
      relationshipAnalysis
    ] = await Promise.all([
      familyProfiler.getFamilyProfile(familyId),
      burnoutPrevention.getLatestBurnoutAssessment(familyId).catch(() => null),
      lifeStageAdapter.getLatestLifeStageAnalysis(familyId).catch(() => null),
      culturalContext.getLatestCulturalAnalysis(familyId).catch(() => null),
      relationshipStyle.getLatestRelationshipAnalysis(familyId).catch(() => null)
    ]);
    
    // Combine insights from all sources
    const insights = {
      familyId,
      generatedAt: new Date().toISOString(),
      profile: {
        familyType: profile.familyType,
        childrenCount: profile.childrenLifeStages?.length || 0,
        workloadPreference: profile.workloadPreference
      },
      burnout: burnoutAssessment ? {
        riskLevel: burnoutAssessment.riskLevel,
        hasRisk: burnoutAssessment.hasRisk,
        atRiskParent: burnoutAssessment.atRiskParent,
        riskSignals: burnoutAssessment.riskSignals,
        interventions: burnoutAssessment.interventions
      } : null,
      lifeStage: lifeStageAnalysis ? {
        lifeStages: lifeStageAnalysis.lifeStages,
        transitions: lifeStageAnalysis.transitions,
        weightAdjustments: lifeStageAnalysis.weightAdjustments
      } : null,
      culturalContext: culturalAnalysis ? {
        valueSystem: culturalAnalysis.valueSystem,
        insights: culturalAnalysis.insights,
        specialTasks: culturalAnalysis.specialTasks
      } : null,
      relationshipStyle: relationshipAnalysis ? {
        style: relationshipAnalysis.style,
        communicationPattern: relationshipAnalysis.communicationPattern,
        conflictStyle: relationshipAnalysis.conflictStyle,
        insights: relationshipAnalysis.insights
      } : null
    };
    
    // Generate integrated recommendations
    insights.priorityRecommendations = generatePriorityRecommendations(
      burnoutAssessment,
      lifeStageAnalysis,
      culturalAnalysis,
      relationshipAnalysis
    );
    
    res.status(200).json(insights);
  } catch (error) {
    logger.error('Error retrieving family insights', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve family insights', details: error.message });
  }
});

/**
 * Update family-specific weight adjustments
 */
app.put('/family/:familyId/adjustments', async (req, res) => {
  try {
    const { familyId } = req.params;
    const { adjustments } = req.body;
    
    if (!adjustments) {
      return res.status(400).json({ error: 'Adjustments data is required' });
    }
    
    await familyProfiler.updateWeightAdjustments(familyId, adjustments);
    
    res.status(200).json({ success: true, message: 'Family weight adjustments updated' });
  } catch (error) {
    logger.error('Error updating family weight adjustments', { error: error.message });
    res.status(500).json({ error: 'Failed to update family weight adjustments', details: error.message });
  }
});

/**
 * Burnout Prevention Endpoints
 */

/**
 * Assess burnout risk for a family
 */
app.post('/burnout/assess/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const assessment = await burnoutPrevention.assessBurnoutRisk(familyId);
    res.status(200).json(assessment);
  } catch (error) {
    logger.error('Error assessing burnout risk', { error: error.message });
    res.status(500).json({ error: 'Failed to assess burnout risk', details: error.message });
  }
});

/**
 * Get latest burnout assessment for a family
 */
app.get('/burnout/latest/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const assessment = await burnoutPrevention.getLatestBurnoutAssessment(familyId);
    res.status(200).json(assessment);
  } catch (error) {
    logger.error('Error retrieving burnout assessment', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve burnout assessment', details: error.message });
  }
});

/**
 * Get burnout assessment history for a family
 */
app.get('/burnout/history/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    const { limit } = req.query;
    
    const history = await burnoutPrevention.getBurnoutHistory(familyId, limit);
    res.status(200).json(history);
  } catch (error) {
    logger.error('Error retrieving burnout history', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve burnout history', details: error.message });
  }
});

/**
 * Track intervention implementation
 */
app.post('/burnout/intervention/track', async (req, res) => {
  try {
    const { familyId, interventionType, status, notes } = req.body;
    
    if (!familyId || !interventionType || !status) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const trackingId = await burnoutPrevention.trackIntervention(
      familyId, interventionType, status, notes
    );
    
    res.status(200).json({ 
      success: true, 
      trackingId,
      message: 'Intervention tracking recorded' 
    });
  } catch (error) {
    logger.error('Error tracking intervention', { error: error.message });
    res.status(500).json({ error: 'Failed to track intervention', details: error.message });
  }
});

/**
 * Analyze intervention effectiveness
 * Admin only endpoint
 */
app.get('/burnout/intervention/effectiveness', async (req, res) => {
  try {
    // Verify admin authorization
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const analysis = await burnoutPrevention.analyzeInterventionEffectiveness();
    res.status(200).json(analysis);
  } catch (error) {
    logger.error('Error analyzing intervention effectiveness', { error: error.message });
    res.status(500).json({ error: 'Failed to analyze intervention effectiveness', details: error.message });
  }
});

/**
 * Check for burnout alert for a family
 */
app.get('/burnout/alert/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const alert = await burnoutPrevention.checkForBurnoutAlert(familyId);
    res.status(200).json(alert || { familyId, hasAlert: false });
  } catch (error) {
    logger.error('Error checking for burnout alert', { error: error.message });
    res.status(500).json({ error: 'Failed to check for burnout alert', details: error.message });
  }
});

/**
 * Life Stage Adaptation Endpoints
 */

/**
 * Analyze life stages for a family
 */
app.post('/lifestage/analyze/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const analysis = await lifeStageAdapter.analyzeLifeStages(familyId);
    res.status(200).json(analysis);
  } catch (error) {
    logger.error('Error analyzing life stages', { error: error.message });
    res.status(500).json({ error: 'Failed to analyze life stages', details: error.message });
  }
});

/**
 * Get latest life stage analysis for a family
 */
app.get('/lifestage/latest/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const analysis = await lifeStageAdapter.getLatestLifeStageAnalysis(familyId);
    res.status(200).json(analysis);
  } catch (error) {
    logger.error('Error retrieving life stage analysis', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve life stage analysis', details: error.message });
  }
});

/**
 * Get content recommendations based on life stages
 */
app.get('/lifestage/recommendations/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const recommendations = await lifeStageAdapter.generateLifeStageRecommendations(familyId);
    res.status(200).json(recommendations);
  } catch (error) {
    logger.error('Error generating life stage recommendations', { error: error.message });
    res.status(500).json({ error: 'Failed to generate life stage recommendations', details: error.message });
  }
});

/**
 * Cultural Context Endpoints
 */

/**
 * Analyze cultural context for a family
 */
app.post('/culture/analyze/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const analysis = await culturalContext.analyzeCulturalContext(familyId);
    res.status(200).json(analysis);
  } catch (error) {
    logger.error('Error analyzing cultural context', { error: error.message });
    res.status(500).json({ error: 'Failed to analyze cultural context', details: error.message });
  }
});

/**
 * Get latest cultural context analysis for a family
 */
app.get('/culture/latest/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const analysis = await culturalContext.getLatestCulturalAnalysis(familyId);
    res.status(200).json(analysis);
  } catch (error) {
    logger.error('Error retrieving cultural analysis', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve cultural analysis', details: error.message });
  }
});

/**
 * Get cultural suggestions for a specific topic
 */
app.get('/culture/suggestions/:familyId/:topic', async (req, res) => {
  try {
    const { familyId, topic } = req.params;
    
    const suggestions = await culturalContext.generateCulturalSuggestions(familyId, topic);
    res.status(200).json(suggestions);
  } catch (error) {
    logger.error('Error generating cultural suggestions', { error: error.message });
    res.status(500).json({ error: 'Failed to generate cultural suggestions', details: error.message });
  }
});

/**
 * Relationship Style Endpoints
 */

/**
 * Analyze relationship style for a family
 */
app.post('/relationship/analyze/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const analysis = await relationshipStyle.analyzeRelationshipStyle(familyId);
    res.status(200).json(analysis);
  } catch (error) {
    logger.error('Error analyzing relationship style', { error: error.message });
    res.status(500).json({ error: 'Failed to analyze relationship style', details: error.message });
  }
});

/**
 * Get latest relationship style analysis for a family
 */
app.get('/relationship/latest/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const analysis = await relationshipStyle.getLatestRelationshipAnalysis(familyId);
    res.status(200).json(analysis);
  } catch (error) {
    logger.error('Error retrieving relationship analysis', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve relationship analysis', details: error.message });
  }
});

/**
 * Get recommendations based on relationship style
 */
app.get('/relationship/recommendations/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    const recommendations = await relationshipStyle.generateStyleRecommendations(familyId);
    res.status(200).json(recommendations);
  } catch (error) {
    logger.error('Error generating relationship recommendations', { error: error.message });
    res.status(500).json({ error: 'Failed to generate relationship recommendations', details: error.message });
  }
});

/**
 * Weight Evolution Endpoints
 */

/**
 * Process pending weight feedback and learn from it
 * Admin only endpoint
 */
app.post('/evolution/process-feedback', async (req, res) => {
  try {
    // Verify admin authorization
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const results = await weightEvolution.processFeedbackBatch();
    res.status(200).json(results);
  } catch (error) {
    logger.error('Error processing feedback', { error: error.message });
    res.status(500).json({ error: 'Failed to process feedback', details: error.message });
  }
});

/**
 * Analyze correlations between family profiles and task weights
 * Admin only endpoint
 */
app.get('/evolution/profile-correlations', async (req, res) => {
  try {
    // Verify admin authorization
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const results = await weightEvolution.analyzeProfileCorrelations();
    res.status(200).json(results);
  } catch (error) {
    logger.error('Error analyzing profile correlations', { error: error.message });
    res.status(500).json({ error: 'Failed to analyze profile correlations', details: error.message });
  }
});

/**
 * Run a full weight evolution cycle
 * Admin only endpoint
 */
app.post('/evolution/cycle', async (req, res) => {
  try {
    // Verify admin authorization
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const results = await weightEvolution.runEvolutionCycle();
    res.status(200).json(results);
  } catch (error) {
    logger.error('Error running evolution cycle', { error: error.message });
    res.status(500).json({ error: 'Failed to run evolution cycle', details: error.message });
  }
});

/**
 * Get task evolution history
 */
app.get('/evolution/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Get all adjustment history for this task
    const taskDoc = await admin.firestore()
      .collection('tasks')
      .doc(taskId)
      .get();
    
    if (!taskDoc.exists) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = taskDoc.data();
    const evolutionHistory = task.adjustmentHistory || [];
    
    res.status(200).json({
      taskId,
      currentWeight: task.baseWeight,
      evolutionHistory
    });
  } catch (error) {
    logger.error('Error retrieving task evolution', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve task evolution', details: error.message });
  }
});

/**
 * Get family-specific weight evolution
 */
app.get('/evolution/family/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    // Get family profile
    const profileDoc = await admin.firestore()
      .collection('weightProfiles')
      .doc(familyId)
      .get();
    
    if (!profileDoc.exists) {
      return res.status(404).json({ error: 'Family profile not found' });
    }
    
    const profile = profileDoc.data();
    
    // Get family feedback history
    const feedbackSnapshot = await admin.firestore()
      .collection('weightFeedback')
      .where('familyId', '==', familyId)
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();
    
    const feedbackHistory = [];
    feedbackSnapshot.forEach(doc => {
      feedbackHistory.push({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toISOString() || null
      });
    });
    
    res.status(200).json({
      familyId,
      taskAdjustments: profile.taskAdjustments || [],
      categoryAdjustments: profile.categoryAdjustments || {},
      feedbackHistory,
      lastUpdated: profile.lastUpdated
    });
  } catch (error) {
    logger.error('Error retrieving family evolution', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve family evolution', details: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled API error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server if not running as a module
if (!module.parent) {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => {
    logger.info(`Task Weight API server running on port ${PORT}`);
  });
}

// Export for Firebase Functions
module.exports = app;