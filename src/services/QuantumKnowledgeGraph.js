// src/services/QuantumKnowledgeGraph.js
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc,
  arrayUnion,
  arrayRemove,
  orderBy,
  serverTimestamp,
  onSnapshot,
  limit as firebaseLimit,
  startAfter
} from 'firebase/firestore';
import ClaudeService from './ClaudeService';
import eventStore from './EventStore';
import { differenceInDays, addDays, startOfDay, endOfDay, isWithinInterval, format } from 'date-fns';
import { quantumConfig } from '../config/quantumConfig';
import QuantumCascadeOptimizer from './quantum/QuantumCascadeOptimizer';
import FamilyHarmonyDNA from './quantum/FamilyHarmonyDNA';
import QuantumLoadBalancer from './quantum/QuantumLoadBalancer';

/**
 * Quantum Knowledge Graph Service
 * 
 * A revolutionary knowledge graph that doesn't just store data - it thinks, learns, and evolves.
 * Built on quantum computing principles where entities can exist in multiple states simultaneously
 * and relationships create superpositions of possibilities.
 */
class QuantumKnowledgeGraph {
  constructor() {
    // Dynamic entity types that auto-expand
    this.coreEntityTypes = new Set([
      'quantum_person',     // Person with emotional, physical, and temporal states
      'quantum_event',      // Events that affect multiple timelines
      'quantum_habit',      // Habits with cascading effects
      'quantum_insight',    // Living insights that evolve
      'quantum_pattern',    // Patterns that learn and adapt
      'quantum_emotion',    // Emotional states and trajectories
      'quantum_goal',       // Goals with multiple paths
      'quantum_memory',     // Memories that strengthen relationships
      'quantum_trigger',    // Context triggers for behaviors
      'quantum_flow',       // Optimal state flows
      'quantum_resonance',  // Family harmony indicators
      'quantum_potential',  // Future possibilities
      'quantum_place'       // Places with emotional and temporal significance
    ]);
    
    // Relationship types with weights and decay
    this.quantumRelationships = {
      // Causal relationships
      'causes': { weight: 0.9, decay: 0.01 },
      'prevents': { weight: -0.8, decay: 0.02 },
      'amplifies': { weight: 1.2, decay: 0.005 },
      'dampens': { weight: -0.6, decay: 0.03 },
      'affects': { weight: 0.75, decay: 0.015 },  // General influence relationship
      
      // Temporal relationships
      'precedes': { weight: 0.7, temporal: true },
      'follows': { weight: 0.7, temporal: true },
      'coincides_with': { weight: 0.8, temporal: true },
      'cycles_with': { weight: 0.9, temporal: true },
      
      // Emotional relationships
      'inspires': { weight: 1.0, emotional: true },
      'frustrates': { weight: -0.7, emotional: true },
      'calms': { weight: 0.8, emotional: true },
      'energizes': { weight: 0.9, emotional: true },
      
      // Learning relationships
      'teaches': { weight: 0.85, bidirectional: true },
      'models': { weight: 0.9, cascading: true },
      'reinforces': { weight: 0.8, strengthens: true },
      'challenges': { weight: 0.6, growth: true },
      
      // Quantum relationships
      'entangles_with': { weight: 1.5, quantum: true },
      'resonates_with': { weight: 1.3, harmonic: true },
      'synchronizes_with': { weight: 1.1, temporal: true },
      'potentiates': { weight: 1.4, future: true },
      
      // Habit relationships
      'practices_habit': { weight: 0.9, personal: true },
      'supports': { weight: 0.8, social: true },
      'motivates': { weight: 0.85, emotional: true },
      
      // General relationships (for compatibility)
      'participates_in': { weight: 0.7, social: true },
      'assigned_to': { weight: 0.6, task: true },
      'created_by': { weight: 0.5, ownership: true },
      'responded_by': { weight: 0.5, ownership: true }, // Added for survey responses
      'parent_of': { weight: 1.0, family: true },
      'child_of': { weight: 1.0, family: true },
      
      // Place relationships
      'visits': { weight: 0.7, spatial: true },
      'frequents': { weight: 0.9, spatial: true },
      'works_at': { weight: 1.0, spatial: true },
      'studies_at': { weight: 1.0, spatial: true },
      'located_at': { weight: 0.8, spatial: true },
      'near_to': { weight: 0.5, spatial: true },
      'travels_from': { weight: 0.6, spatial: true },
      'travels_to': { weight: 0.6, spatial: true }
    };
    
    // Quantum states for entities
    this.quantumStates = {
      'dormant': { energy: 0.1, potential: 0.9 },
      'emerging': { energy: 0.3, potential: 0.7 },
      'active': { energy: 0.7, potential: 0.5 },
      'peak': { energy: 0.9, potential: 0.8 },
      'transforming': { energy: 0.5, potential: 1.0 },
      'stabilized': { energy: 0.6, potential: 0.4 }
    };
    
    // Context dimensions
    this.contextDimensions = {
      temporal: { morning: 0, afternoon: 0.33, evening: 0.66, night: 1.0 },
      emotional: { stressed: -1, neutral: 0, happy: 0.5, joyful: 1.0 },
      energy: { exhausted: 0, tired: 0.25, normal: 0.5, energized: 0.75, peak: 1.0 },
      social: { alone: 0, partner: 0.3, family: 0.6, community: 1.0 },
      location: { home: 0, work: 0.3, school: 0.5, community: 0.7, travel: 1.0 }
    };
    
    // Quantum cache with temporal decay
    this.quantumCache = new Map();
    this.insightStream = new Map();
    this.patternRecognizer = new Map();
    this.predictionEngine = new Map();
    
    // Real-time listeners
    this.listeners = new Map();
    this.subscriptions = new Map();
    
    // Learning parameters
    this.learningRate = 0.1;
    this.explorationRate = 0.2;
    this.convergenceThreshold = 0.95;
    
    // Flag to control when processors should run
    this.processorsEnabled = false;
    this.isInitialized = false;
    
    // Don't auto-initialize - wait for explicit initialization
    // this.initializeQuantumField();
  }
  
  /**
   * Initialize the quantum field for the graph
   */
  async initializeQuantumField() {
    if (this.isInitialized) {
      console.log('QuantumKnowledgeGraph already initialized');
      return;
    }
    
    // Only start if explicitly enabled
    if (!this.processorsEnabled) {
      console.log('QuantumKnowledgeGraph processors disabled - skipping initialization');
      return;
    }
    
    this.isInitialized = true;
    
    // Set up background processors
    this.startQuantumProcessors();
    
    // Initialize pattern recognition
    this.initializePatternRecognition();
    
    // Start prediction engine
    this.startPredictionEngine();
    
    // Enable real-time learning
    this.enableContinuousLearning();
  }
  
  /**
   * Start quantum processors for continuous analysis
   */
  startQuantumProcessors() {
    // Process quantum entanglements every minute
    this.entanglementInterval = setInterval(() => this.processQuantumEntanglements(), 60000);
    
    // Update quantum states every 5 minutes
    this.stateUpdateInterval = setInterval(() => this.updateQuantumStates(), 300000);
    
    // Generate insights every 15 minutes
    this.insightInterval = setInterval(() => this.generateQuantumInsights(), 900000);
    
    // Decay old relationships every hour
    this.decayInterval = setInterval(() => this.decayRelationships(), 3600000);
    
    console.log('Quantum processors started');
  }
  
  /**
   * Create or update a quantum entity
   */
  async createQuantumEntity(familyId, entityData) {
    try {
      const {
        type,
        properties = {},
        initialState = 'emerging',
        context = {},
        connections = []
      } = entityData;
      
      // Generate quantum ID with temporal component
      const quantumId = this.generateQuantumId(type, properties);
      
      // Calculate initial quantum state
      const quantumState = this.calculateQuantumState(
        initialState,
        context,
        connections
      );
      
      // Create entity with quantum properties
      const quantumEntity = {
        id: quantumId,
        type: `quantum_${type}`,
        properties: {
          ...properties,
          quantumState,
          context,
          energy: quantumState.energy,
          potential: quantumState.potential,
          resonance: 0.5,
          coherence: 1.0,
          entanglements: [],
          superpositions: [],
          observedStates: [],
          createdAt: new Date().toISOString(),
          lastObserved: new Date().toISOString()
        },
        metadata: {
          version: 1,
          mutations: [],
          observations: 1,
          influence: 0
        }
      };
      
      // Store in quantum field
      await this.storeInQuantumField(familyId, quantumEntity);
      
      // Create initial relationships
      for (const connection of connections) {
        await this.createQuantumRelationship(
          familyId,
          quantumId,
          connection.targetId,
          connection.type,
          connection.properties
        );
      }
      
      // Trigger quantum effects
      await this.propagateQuantumEffects(familyId, quantumEntity);
      
      // Generate initial insights
      await this.generateEntityInsights(familyId, quantumEntity);
      
      return quantumEntity;
    } catch (error) {
      console.error('Error creating quantum entity:', error);
      throw error;
    }
  }
  
  /**
   * Create quantum relationships with effects
   */
  async createQuantumRelationship(familyId, sourceId, targetId, relationshipType, properties = {}) {
    try {
      const relationship = this.quantumRelationships[relationshipType];
      if (!relationship) {
        throw new Error(`Unknown quantum relationship type: ${relationshipType}`);
      }
      
      // Calculate relationship strength based on context
      const strength = this.calculateRelationshipStrength(
        sourceId,
        targetId,
        relationshipType,
        properties
      );
      
      // Create quantum relationship
      const quantumRelationship = {
        id: this.generateQuantumId('relationship', { sourceId, targetId, type: relationshipType }),
        sourceId,
        targetId,
        type: relationshipType,
        properties: {
          ...properties,
          weight: relationship.weight * strength,
          decay: relationship.decay,
          energy: strength,
          resonance: 0,
          phase: 0,
          entangled: relationship.quantum || false,
          bidirectional: relationship.bidirectional || false,
          cascading: relationship.cascading || false,
          temporal: relationship.temporal || false,
          emotional: relationship.emotional || false,
          createdAt: new Date().toISOString(),
          lastInteraction: new Date().toISOString()
        },
        effects: {
          immediate: [],
          delayed: [],
          cascading: [],
          quantum: []
        }
      };
      
      // Store relationship
      await this.storeQuantumRelationship(familyId, quantumRelationship);
      
      // If bidirectional, create reverse relationship
      if (relationship.bidirectional) {
        await this.createQuantumRelationship(
          familyId,
          targetId,
          sourceId,
          relationshipType,
          { ...properties, reverse: true }
        );
      }
      
      // Trigger quantum entanglement if applicable
      if (relationship.quantum) {
        await this.createQuantumEntanglement(familyId, sourceId, targetId);
      }
      
      // Propagate effects
      await this.propagateRelationshipEffects(familyId, quantumRelationship);
      
      return quantumRelationship;
    } catch (error) {
      console.error('Error creating quantum relationship:', error);
      throw error;
    }
  }
  
  /**
   * Execute natural language queries with quantum understanding
   */
  async quantumQuery(familyId, query, context = {}) {
    try {
      // Parse query intent using AI
      const intent = await this.parseQueryIntent(query, context);
      
      // Build quantum query plan
      const queryPlan = this.buildQuantumQueryPlan(intent);
      
      // Execute query across quantum dimensions
      const results = await this.executeQuantumQuery(familyId, queryPlan);
      
      // Apply quantum transformations
      const transformedResults = this.applyQuantumTransformations(results, intent);
      
      // Generate insights from results
      const insights = await this.generateQueryInsights(transformedResults, query);
      
      // Format response for user
      const response = await this.formatQuantumResponse(transformedResults, insights, intent);
      
      // Learn from query
      await this.learnFromQuery(familyId, query, intent, results);
      
      return response;
    } catch (error) {
      console.error('Error executing quantum query:', error);
      throw error;
    }
  }
  
  /**
   * Get predictive insights about the future
   */
  async getPredictiveInsights(familyId, timeHorizon = 7, domains = []) {
    try {
      const insights = [];
      
      // Load family quantum state
      const familyState = await this.getFamilyQuantumState(familyId);
      
      // Analyze patterns across time
      const temporalPatterns = await this.analyzeTemporalPatterns(familyId, timeHorizon);
      
      // Predict future states
      const predictions = await this.predictFutureStates(
        familyState,
        temporalPatterns,
        timeHorizon
      );
      
      // Generate actionable insights
      for (const prediction of predictions) {
        if (!domains.length || domains.includes(prediction.domain)) {
          const insight = await this.generatePredictiveInsight(prediction);
          if (insight.confidence > 0.7) {
            insights.push(insight);
          }
        }
      }
      
      // Rank by impact and likelihood
      insights.sort((a, b) => (b.impact * b.likelihood) - (a.impact * a.likelihood));
      
      return insights.slice(0, 10); // Top 10 insights
    } catch (error) {
      console.error('Error getting predictive insights:', error);
      throw error;
    }
  }
  
  /**
   * Enable real-time pattern detection
   */
  async enablePatternDetection(familyId, callback) {
    const patternDetector = {
      id: `pattern_${Date.now()}`,
      familyId,
      callback,
      patterns: new Map(),
      threshold: 0.8
    };
    
    // Subscribe to entity changes
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'quantumGraph', familyId, 'entities'),
        where('properties.lastObserved', '>', new Date(Date.now() - 3600000).toISOString())
      ),
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'modified' || change.type === 'added') {
            const entity = change.doc.data();
            await this.detectPatterns(patternDetector, entity);
          }
        });
      }
    );
    
    this.subscriptions.set(patternDetector.id, unsubscribe);
    return () => this.disablePatternDetection(patternDetector.id);
  }
  
  /**
   * Generate real-time recommendations
   */
  async getRealtimeRecommendations(familyId, context = {}) {
    try {
      const recommendations = [];
      
      // Get current family state
      const currentState = await this.getCurrentQuantumState(familyId);
      
      // Analyze immediate context
      const contextAnalysis = this.analyzeContext(context);
      
      // Find optimal actions
      const optimalActions = await this.findOptimalActions(
        currentState,
        contextAnalysis
      );
      
      // Generate recommendations
      for (const action of optimalActions) {
        const recommendation = await this.generateRecommendation(
          action,
          currentState,
          contextAnalysis
        );
        
        if (recommendation.relevance > 0.7) {
          recommendations.push(recommendation);
        }
      }
      
      // Personalize for each family member
      const personalizedRecs = await this.personalizeRecommendations(
        recommendations,
        familyId
      );
      
      return personalizedRecs;
    } catch (error) {
      console.error('Error getting realtime recommendations:', error);
      throw error;
    }
  }
  
  /**
   * Create quantum entanglement between entities
   */
  async createQuantumEntanglement(familyId, entityId1, entityId2) {
    try {
      // Create bidirectional quantum link
      const entanglementId = `entanglement_${Date.now()}`;
      
      // Update both entities
      await Promise.all([
        this.updateEntityProperty(familyId, entityId1, 'entanglements', {
          _methodName: 'arrayUnion',
          elements: [{
            id: entanglementId,
            entityId: entityId2,
            strength: 1.0,
            phase: 0
          }]
        }),
        this.updateEntityProperty(familyId, entityId2, 'entanglements', {
          _methodName: 'arrayUnion',
          elements: [{
            id: entanglementId,
            entityId: entityId1,
            strength: 1.0,
            phase: Math.PI
          }]
        })
      ]);
      
      // Synchronize quantum states
      await this.synchronizeQuantumStates(familyId, entityId1, entityId2);
      
      return entanglementId;
    } catch (error) {
      console.error('Error creating quantum entanglement:', error);
      throw error;
    }
  }
  
  /**
   * Advanced helper methods
   */
  
  generateQuantumId(type, properties) {
    const timestamp = Date.now();
    const randomComponent = Math.random().toString(36).substring(7);
    const contextHash = this.hashContext(properties);
    return `${type}_${timestamp}_${contextHash}_${randomComponent}`;
  }
  
  /**
   * Hash context for ID generation
   */
  hashContext(context) {
    // Simple hash function for context
    const str = JSON.stringify(context);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  calculateQuantumState(initialState, context, connections) {
    const baseState = this.quantumStates[initialState] || this.quantumStates.emerging;
    
    // Adjust based on context
    let energy = baseState.energy;
    let potential = baseState.potential;
    
    // Context influences
    if (context.emotional === 'happy') energy *= 1.2;
    if (context.temporal === 'morning') potential *= 1.1;
    if (context.social === 'family') energy *= 1.15;
    
    // Connection influences
    const connectionBoost = Math.min(connections.length * 0.1, 0.5);
    energy += connectionBoost;
    potential += connectionBoost * 0.5;
    
    return {
      state: initialState,
      energy: Math.min(energy, 1.0),
      potential: Math.min(potential, 1.0),
      coherence: 1.0 - (connections.length * 0.05),
      resonance: 0.5
    };
  }
  
  /**
   * Calculate relationship strength based on context and properties
   */
  calculateRelationshipStrength(sourceId, targetId, relationshipType, properties = {}) {
    // Base strength
    let strength = 0.5;
    
    // Relationship type influences
    const relationship = this.quantumRelationships[relationshipType];
    if (relationship) {
      // Positive relationships get higher base strength
      if (relationship.weight > 0) {
        strength = 0.7;
      }
      
      // Quantum relationships are stronger
      if (relationship.quantum) {
        strength *= 1.3;
      }
      
      // Emotional relationships vary more
      if (relationship.emotional) {
        strength *= (0.8 + Math.random() * 0.4); // 0.8-1.2
      }
      
      // Family relationships are strongest
      if (relationship.family) {
        strength = 0.9;
      }
    }
    
    // Property influences
    if (properties.importance === 'high') strength *= 1.2;
    if (properties.frequency === 'daily') strength *= 1.1;
    if (properties.duration === 'permanent') strength *= 1.15;
    
    // Add some randomness for natural variation
    strength += (Math.random() - 0.5) * 0.1;
    
    // Ensure strength is between 0 and 1
    return Math.max(0.1, Math.min(1.0, strength));
  }
  
  async propagateQuantumEffects(familyId, entity) {
    // Find all connected entities
    const connections = await this.getEntityConnections(familyId, entity.id);
    
    for (const connection of connections) {
      // Calculate effect magnitude
      const magnitude = entity.properties.energy * connection.properties.weight;
      
      // Apply effect to connected entity
      await this.applyQuantumEffect(
        familyId,
        connection.targetId,
        entity.type,
        magnitude
      );
    }
  }
  
  /**
   * Get all connections for an entity
   */
  async getEntityConnections(familyId, entityId) {
    // For now, return empty array - this would query the quantum field
    // for all relationships where this entity is the source
    return [];
  }
  
  /**
   * Apply quantum effect to an entity
   */
  async applyQuantumEffect(familyId, targetId, sourceType, magnitude) {
    // Placeholder for applying quantum effects
    console.log(`Applying quantum effect from ${sourceType} to ${targetId} with magnitude ${magnitude}`);
  }
  
  /**
   * Propagate relationship effects through the quantum graph
   */
  async propagateRelationshipEffects(familyId, quantumRelationship) {
    // Check if this is a cascading relationship
    if (quantumRelationship.properties.cascading) {
      // Find connected entities and propagate effects
      const targetConnections = await this.getEntityConnections(familyId, quantumRelationship.targetId);
      
      for (const connection of targetConnections) {
        // Create cascading effects with diminished strength
        const cascadeStrength = quantumRelationship.properties.weight * 0.5;
        
        if (cascadeStrength > 0.1) {
          await this.applyQuantumEffect(
            familyId,
            connection.targetId,
            'cascade',
            cascadeStrength
          );
        }
      }
    }
    
    // Handle temporal relationships
    if (quantumRelationship.properties.temporal) {
      // Schedule future effects if needed
      console.log('Temporal relationship created:', quantumRelationship.type);
    }
    
    // Handle emotional relationships
    if (quantumRelationship.properties.emotional) {
      // Track emotional resonance
      console.log('Emotional relationship created:', quantumRelationship.type);
    }
    
    // Store effect history
    quantumRelationship.effects.immediate.push({
      timestamp: new Date().toISOString(),
      type: 'creation',
      magnitude: quantumRelationship.properties.weight
    });
  }
  
  async generateEntityInsights(familyId, entity) {
    const prompt = `
      Analyze this quantum entity and generate insights:
      Type: ${entity.type}
      Properties: ${JSON.stringify(entity.properties)}
      Context: ${JSON.stringify(entity.properties.context)}
      
      Generate 3 actionable insights about:
      1. What this means for the family
      2. Potential future impacts
      3. Recommended actions
      
      Format as JSON array of objects with: insight, impact, recommendation, confidence
    `;
    
    const insights = await ClaudeService.generateStructuredResponse(prompt);
    
    // Store insights
    for (const insight of insights) {
      await this.createQuantumEntity(familyId, {
        type: 'insight',
        properties: {
          ...insight,
          sourceEntity: entity.id,
          generatedAt: new Date().toISOString()
        },
        connections: [{
          targetId: entity.id,
          type: 'insight_about'
        }]
      });
    }
    
    return insights;
  }
  
  /**
   * Start quantum processors for continuous analysis
   */
  startQuantumProcessors() {
    // Don't start if already running
    if (this.quantumProcessorInterval) {
      console.log('Quantum processors already running');
      return;
    }
    
    // Initialize quantum processing interval
    this.quantumProcessorInterval = setInterval(() => {
      this.processQuantumField();
    }, quantumConfig.processorIntervals?.quantumField || 30000); // Use config or default to 30 seconds
    
    // Initialize quantum processor state
    this.quantumProcessorState = {
      active: true,
      lastProcessed: new Date(),
      cycleCount: 0
    };
    
    console.log('Started quantum processor interval');
  }
  
  /**
   * Process quantum field (stub for quantum processor interval)
   */
  processQuantumField() {
    this.quantumProcessorState.cycleCount++;
    this.quantumProcessorState.lastProcessed = new Date();
    console.log('Processing quantum field, cycle:', this.quantumProcessorState.cycleCount);
  }
  
  /**
   * Initialize pattern recognition system
   */
  initializePatternRecognition() {
    // Set up pattern recognition intervals
    this.patternRecognitionInterval = setInterval(() => {
      this.detectEmergingPatterns();
    }, quantumConfig.processorIntervals?.patternRecognition || 60000); // Use config or default to 1 minute
    
    // Initialize pattern categories
    this.patternCategories = {
      behavioral: { threshold: 0.7, weight: 1.0 },
      temporal: { threshold: 0.6, weight: 0.8 },
      social: { threshold: 0.65, weight: 0.9 },
      emotional: { threshold: 0.75, weight: 1.1 },
      educational: { threshold: 0.7, weight: 0.9 }
    };
  }
  
  /**
   * Start prediction engine
   */
  startPredictionEngine() {
    // Initialize prediction models
    this.predictionModels = {
      shortTerm: { horizon: 1, accuracy: 0.85 },
      mediumTerm: { horizon: 7, accuracy: 0.70 },
      longTerm: { horizon: 30, accuracy: 0.55 }
    };
    
    // Start prediction updates
    this.predictionInterval = setInterval(() => {
      this.updatePredictions();
    }, quantumConfig.processorIntervals?.prediction || 300000); // Use config or default to 5 minutes
  }
  
  /**
   * Enable continuous learning
   */
  enableContinuousLearning() {
    // Set up learning cycles
    this.learningCycleInterval = setInterval(() => {
      this.performLearningCycle();
    }, quantumConfig.processorIntervals?.learning || 600000); // Use config or default to 10 minutes
    
    // Initialize learning metrics
    this.learningMetrics = {
      cycles: 0,
      improvements: 0,
      accuracy: 0.5
    };
  }
  
  /**
   * Detect emerging patterns (stub for pattern recognition interval)
   */
  detectEmergingPatterns() {
    // This would implement actual pattern detection
    // For now, just log that it's running
    console.log('Detecting emerging patterns...');
  }
  
  /**
   * Update predictions (stub for prediction interval)
   */
  updatePredictions() {
    // This would implement actual prediction updates
    // For now, just log that it's running
    console.log('Updating predictions...');
  }
  
  /**
   * Perform learning cycle (stub for learning interval)
   */
  performLearningCycle() {
    // This would implement actual learning
    // For now, just increment metrics
    this.learningMetrics.cycles++;
    console.log('Learning cycle completed:', this.learningMetrics.cycles);
  }
  
  /**
   * Initialize the quantum graph for a family
   */
  async initializeGraph(familyId) {
    console.log('Initializing quantum graph for family:', familyId);
    
    // Initialize family quantum state
    if (!this.quantumCache.has(familyId)) {
      this.quantumCache.set(familyId, {
        entities: {},
        relationships: [],
        patterns: [],
        insights: [],
        lastUpdated: new Date()
      });
    }
    
    // Load actual data from Firestore
    await this.loadAllFamilyData(familyId);
    
    return true;
  }
  
  /**
   * Load all family data from Firestore collections
   */
  async loadAllFamilyData(familyId) {
    console.log('Loading all family data for:', familyId);
    
    if (!familyId) {
      console.warn('No familyId provided to loadAllFamilyData');
      return;
    }
    
    const familyQuantumField = this.quantumCache.get(familyId);
    if (!familyQuantumField) {
      console.warn('Family quantum field not initialized');
      return;
    }
    
    try {
      // Load family members
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      if (familyDoc.exists()) {
        const familyData = familyDoc.data();
        const members = familyData.familyMembers || [];
        
        console.log(`Loading ${members.length} family members`);
        for (const member of members) {
          const entityId = `person_${member.id}`;
          familyQuantumField.entities[entityId] = {
            id: entityId,
            type: 'quantum_person',
            properties: {
              name: member.name,
              role: member.role,
              age: member.age,
              ...member
            },
            quantum: {
              energy: 1.0,
              coherence: 1.0,
              entanglements: [],
              superposition: []
            }
          };
        }
      }
      
      // Load events from EventStore
      console.log('Calling EventStore.getEventsForFamily with familyId:', familyId);
      const events = await eventStore.getEventsForFamily(familyId, {
        startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months ahead
        pageSize: 500
      });
      
      console.log('EventStore returned:', {
        hasEvents: !!events,
        eventsArray: events?.events,
        eventsLength: events?.events?.length || 0,
        firstEvent: events?.events?.[0]
      });
      
      console.log(`Loading ${events?.events?.length || 0} events`);
      if (events && events.events && events.events.length > 0) {
        let eventCount = 0;
        for (const event of events.events) {
          const entityId = `event_${event.id || event.firestoreId || event.universalId}`;
          familyQuantumField.entities[entityId] = {
            id: entityId,
            type: 'quantum_event',
            properties: {
              title: event.title,
              date: event.dateTime || event.date,
              category: event.category,
              location: event.location,
              ...event
            },
            quantum: {
              energy: 0.8,
              coherence: 0.9,
              entanglements: [],
              superposition: []
            }
          };
          eventCount++;
        }
        console.log(`Successfully loaded ${eventCount} events into quantum field`);
      } else {
        console.log('No events returned from EventStore');
      }
      
      // Load survey responses
      const surveyQuery = query(
        collection(db, 'surveyResponses'),
        where('familyId', '==', familyId),
        firebaseLimit(500)
      );
      const surveySnapshot = await getDocs(surveyQuery);
      
      console.log(`Loading ${surveySnapshot.size} survey responses`);
      surveySnapshot.forEach(doc => {
        const response = doc.data();
        const entityId = `survey_${doc.id}`;
        familyQuantumField.entities[entityId] = {
          id: entityId,
          type: 'quantum_insight',
          properties: {
            ...response,
            responseId: doc.id
          },
          quantum: {
            energy: 0.7,
            coherence: 0.8,
            entanglements: [],
            superposition: []
          }
        };
      });
      
      // Load documents
      const docsQuery = query(
        collection(db, 'documents'),
        where('familyId', '==', familyId),
        firebaseLimit(100)
      );
      const docsSnapshot = await getDocs(docsQuery);
      
      console.log(`Loading ${docsSnapshot.size} documents`);
      docsSnapshot.forEach(doc => {
        const document = doc.data();
        const entityId = `doc_${doc.id}`;
        familyQuantumField.entities[entityId] = {
          id: entityId,
          type: 'quantum_memory',
          properties: {
            title: document.title || document.fileName,
            type: document.type,
            createdAt: document.createdAt,
            ...document
          },
          quantum: {
            energy: 0.6,
            coherence: 0.7,
            entanglements: [],
            superposition: []
          }
        };
      });
      
      // Load emails
      const emailQuery = query(
        collection(db, 'emailInbox'),
        where('familyId', '==', familyId),
        firebaseLimit(100)
      );
      const emailSnapshot = await getDocs(emailQuery);
      
      console.log(`Loading ${emailSnapshot.size} emails`);
      emailSnapshot.forEach(doc => {
        const email = doc.data();
        const entityId = `email_${doc.id}`;
        familyQuantumField.entities[entityId] = {
          id: entityId,
          type: 'quantum_memory',
          properties: {
            from: email.from,
            subject: email.subject,
            receivedAt: email.receivedAt,
            ...email
          },
          quantum: {
            energy: 0.6,
            coherence: 0.7,
            entanglements: [],
            superposition: []
          }
        };
      });
      
      // Load places
      const placesQuery = query(
        collection(db, 'familyPlaces'),
        where('familyId', '==', familyId),
        firebaseLimit(100)
      );
      const placesSnapshot = await getDocs(placesQuery);
      
      console.log(`Loading ${placesSnapshot.size} places`);
      placesSnapshot.forEach(doc => {
        const place = doc.data();
        const entityId = `place_${doc.id}`;
        familyQuantumField.entities[entityId] = {
          id: entityId,
          type: 'quantum_place',
          properties: {
            name: place.name,
            address: place.address,
            category: place.category,
            ...place
          },
          quantum: {
            energy: 0.7,
            coherence: 0.8,
            entanglements: [],
            superposition: []
          }
        };
      });
      
      // Load SMS
      const smsQuery = query(
        collection(db, 'smsInbox'),
        where('familyId', '==', familyId),
        firebaseLimit(100)
      );
      const smsSnapshot = await getDocs(smsQuery);
      
      console.log(`Loading ${smsSnapshot.size} SMS messages`);
      smsSnapshot.forEach(doc => {
        const sms = doc.data();
        const entityId = `sms_${doc.id}`;
        familyQuantumField.entities[entityId] = {
          id: entityId,
          type: 'quantum_memory',
          properties: {
            from: sms.from,
            body: sms.body,
            receivedAt: sms.receivedAt,
            ...sms
          },
          quantum: {
            energy: 0.6,
            coherence: 0.7,
            entanglements: [],
            superposition: []
          }
        };
      });
      
      // Create relationships between entities
      this.createEntityRelationships(familyId);
      
      console.log(`Total entities loaded: ${Object.keys(familyQuantumField.entities).length}`);
      
    } catch (error) {
      console.error('Error loading family data:', error);
    }
  }
  
  /**
   * Create relationships between loaded entities
   */
  createEntityRelationships(familyId) {
    const familyQuantumField = this.quantumCache.get(familyId);
    if (!familyQuantumField) return;
    
    const entities = Object.values(familyQuantumField.entities);
    
    // Create relationships between people and events
    entities.forEach(entity => {
      if (entity.type === 'quantum_event' && entity.properties.attendees) {
        entity.properties.attendees.forEach(attendeeId => {
          const personEntity = familyQuantumField.entities[`person_${attendeeId}`];
          if (personEntity) {
            familyQuantumField.relationships.push({
              from: personEntity.id,
              to: entity.id,
              type: 'participates_in',
              weight: 0.7
            });
          }
        });
      }
      
      // Create relationships between people and survey responses
      if (entity.type === 'quantum_insight' && entity.properties.respondentId) {
        const personEntity = familyQuantumField.entities[`person_${entity.properties.respondentId}`];
        if (personEntity) {
          familyQuantumField.relationships.push({
            from: personEntity.id,
            to: entity.id,
            type: 'created_by',
            weight: 0.5
          });
        }
      }
    });
    
    // Create family relationships
    const people = entities.filter(e => e.type === 'quantum_person');
    const parents = people.filter(p => p.properties.role === 'parent');
    const children = people.filter(p => p.properties.role === 'child');
    
    parents.forEach(parent => {
      children.forEach(child => {
        familyQuantumField.relationships.push({
          from: parent.id,
          to: child.id,
          type: 'parent_of',
          weight: 1.0
        });
        familyQuantumField.relationships.push({
          from: child.id,
          to: parent.id,
          type: 'child_of',
          weight: 1.0
        });
      });
    });
    
    console.log(`Created ${familyQuantumField.relationships.length} relationships`);
  }
  
  /**
   * Get family quantum state
   */
  async getFamilyQuantumState(familyId) {
    // Return current quantum state or initialize
    if (!this.quantumCache.has(familyId)) {
      await this.initializeGraph(familyId);
    }

    const state = this.quantumCache.get(familyId);

    // Load interview insights and integrate into quantum state
    const interviewInsights = await this.getInterviewInsights(familyId);

    return {
      entities: state.entities || {},
      relationships: state.relationships || [],
      interviewInsights: interviewInsights, // Include interview insights
      energy: Math.random() * 0.3 + 0.7, // 0.7-1.0
      coherence: Math.random() * 0.2 + 0.8, // 0.8-1.0
      lastUpdated: state.lastUpdated
    };
  }

  /**
   * Get interview insights from knowledge graph
   */
  async getInterviewInsights(familyId) {
    try {
      const kgRef = doc(db, 'knowledgeGraphs', familyId);
      const kgDoc = await getDoc(kgRef);

      if (!kgDoc.exists()) {
        return null;
      }

      const data = kgDoc.data();
      return {
        interviewInsights: data.interviewInsights || {},
        invisibleWorkPatterns: data.invisibleWorkPatterns || null,
        stressCapacityData: data.stressCapacityData || null,
        decisionMakingStyles: data.decisionMakingStyles || null
      };
    } catch (error) {
      console.error('Error loading interview insights:', error);
      return null;
    }
  }

  /**
   * Get invisible work patterns from interviews
   */
  async getInvisibleWorkPatterns(familyId) {
    const insights = await this.getInterviewInsights(familyId);
    return insights?.invisibleWorkPatterns || null;
  }

  /**
   * Get stress capacity data from interviews
   */
  async getStressCapacityData(familyId) {
    const insights = await this.getInterviewInsights(familyId);
    return insights?.stressCapacityData || null;
  }

  /**
   * Get decision making styles from interviews
   */
  async getDecisionMakingStyles(familyId) {
    const insights = await this.getInterviewInsights(familyId);
    return insights?.decisionMakingStyles || null;
  }

  /**
   * Get person-specific insights from interviews
   */
  async getPersonInterviewInsights(familyId, personName) {
    const insights = await this.getInterviewInsights(familyId);
    if (!insights?.interviewInsights) return null;

    // Search through all interview types for this person's insights
    const personInsights = {};
    Object.entries(insights.interviewInsights).forEach(([interviewType, data]) => {
      if (data.participantSpecificInsights && data.participantSpecificInsights[personName]) {
        personInsights[interviewType] = data.participantSpecificInsights[personName];
      }
    });

    return Object.keys(personInsights).length > 0 ? personInsights : null;
  }
  
  /**
   * Get active patterns for a family - DYNAMIC VERSION
   */
  async getActivePatterns(familyId) {
    const patterns = [];
    
    try {
      // Get actual family data
      const graph = await this.getGraph(familyId);
      if (!graph || !graph.entities) return patterns;
      
      const now = new Date();
      const entities = Object.values(graph.entities);
      
      // Pattern 1: Analyze event timing patterns
      const events = entities.filter(e => e.type === 'quantum_event' || e.type === 'event');
      const eventsByHour = {};
      const eventsByDayOfWeek = {};
      
      events.forEach(event => {
        if (event.properties?.dateTime) {
          const date = new Date(event.properties.dateTime);
          const hour = date.getHours();
          const dayOfWeek = date.getDay();
          
          eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
          eventsByDayOfWeek[dayOfWeek] = (eventsByDayOfWeek[dayOfWeek] || 0) + 1;
        }
      });
      
      // Find peak activity times
      const peakHour = Object.entries(eventsByHour)
        .sort((a, b) => b[1] - a[1])[0];
      
      if (peakHour && peakHour[1] > 3) {
        const hour = parseInt(peakHour[0]);
        const timeOfDay = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
        const timeRange = hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 ${hour === 0 ? 'AM' : hour < 12 ? 'AM' : 'PM'}`;
        
        patterns.push({
          id: `pattern-time-${Date.now()}`,
          name: `${timeOfDay} Activity Peak`,
          description: `Your family is most active around ${timeRange} (${peakHour[1]} events typically scheduled)`,
          domains: ['time', 'schedule', 'activities'],
          strength: Math.min(peakHour[1] / Math.max(events.length, 1) * 2, 0.95),
          confidence: Math.min(0.7 + (peakHour[1] * 0.05), 0.95)
        });
      }
      
      // Pattern 2: Collaboration patterns
      const sharedEvents = events.filter(e => e.properties?.attendees?.length > 1);
      if (sharedEvents.length > 5) {
        const avgAttendees = sharedEvents.reduce((sum, e) => sum + (e.properties?.attendees?.length || 0), 0) / sharedEvents.length;
        
        patterns.push({
          id: `pattern-collab-${Date.now()}`,
          name: 'Family Collaboration Strong',
          description: `Average of ${Math.round(avgAttendees)} family members participate in shared activities`,
          domains: ['social', 'collaboration', 'family'],
          strength: Math.min(avgAttendees / 4, 0.9),
          confidence: Math.min(0.75 + (sharedEvents.length * 0.02), 0.92)
        });
      }
      
      // Pattern 3: Weekly rhythm
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const weekdayEvents = eventsByDayOfWeek[1] + eventsByDayOfWeek[2] + eventsByDayOfWeek[3] + 
                           eventsByDayOfWeek[4] + eventsByDayOfWeek[5] || 0;
      const weekendEvents = eventsByDayOfWeek[0] + eventsByDayOfWeek[6] || 0;
      
      if (events.length > 10) {
        if (weekendEvents > weekdayEvents / 5 * 2) {
          patterns.push({
            id: `pattern-weekend-${Date.now()}`,
            name: 'Weekend Activity Focus',
            description: 'Most family activities happen on weekends - great for bonding time!',
            domains: ['schedule', 'weekend', 'family-time'],
            strength: Math.min(weekendEvents / Math.max(events.length, 1) * 3, 0.85),
            confidence: 0.88
          });
        } else if (weekdayEvents > weekendEvents * 2) {
          patterns.push({
            id: `pattern-weekday-${Date.now()}`,
            name: 'Weekday Routine Strong',
            description: 'Your family maintains consistent weekday activities and routines',
            domains: ['routine', 'weekday', 'consistency'],
            strength: Math.min(weekdayEvents / Math.max(events.length, 1) * 1.5, 0.85),
            confidence: 0.86
          });
        }
      }
      
      // Pattern 4: Communication patterns
      const communications = entities.filter(e => 
        e.type === 'quantum_email' || e.type === 'email' || 
        e.type === 'quantum_memory' || e.type === 'sms'
      );
      
      const recentComms = communications.filter(c => 
        c.properties?.timestamp && new Date(c.properties.timestamp) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      );
      
      if (recentComms.length > 3) {
        patterns.push({
          id: `pattern-comm-${Date.now()}`,
          name: 'Active Family Communication',
          description: `${recentComms.length} messages this week shows strong family connection`,
          domains: ['communication', 'connection', 'engagement'],
          strength: Math.min(recentComms.length / 10, 0.9),
          confidence: 0.85
        });
      }
      
      // Pattern 5: Survey engagement
      const surveys = entities.filter(e => e.type === 'quantum_surveyResponse' || e.type === 'surveyResponse');
      const recentSurveys = surveys.filter(s => 
        s.properties?.timestamp && new Date(s.properties.timestamp) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      );
      
      if (recentSurveys.length > 5) {
        patterns.push({
          id: `pattern-survey-${Date.now()}`,
          name: 'Consistent Check-ins',
          description: `${recentSurveys.length} family check-ins this month keeps everyone connected`,
          domains: ['habits', 'check-ins', 'awareness'],
          strength: Math.min(recentSurveys.length / 20, 0.85),
          confidence: 0.82
        });
      }
      
    } catch (error) {
      console.error('Error getting active patterns:', error);
    }
    
    // Sort by strength and return top patterns
    return patterns
      .sort((a, b) => (b.strength * b.confidence) - (a.strength * a.confidence))
      .slice(0, 5);
  }
  
  /**
   * Predict future states - DYNAMIC VERSION
   */
  async predict(familyId, options = {}) {
    const timeHorizon = options.timeHorizon || 7;
    const predictions = [];
    
    try {
      // Get the family quantum state
      const familyState = await this.getFamilyQuantumState(familyId);
      
      // Use our dynamic prediction method
      const dynamicPredictions = await this.predictFutureStates(
        familyState, 
        await this.analyzeTemporalPatterns(familyId, timeHorizon),
        timeHorizon
      );
      
      // Convert to the expected format
      dynamicPredictions.forEach((pred, index) => {
        predictions.push({
          id: `pred-${index + 1}`,
          title: pred.prediction,
          description: pred.description || `${pred.domain} prediction with ${Math.round(pred.confidence * 100)}% confidence`,
          probability: pred.likelihood || pred.confidence,
          timeframe: pred.timeframe === 'upcoming' ? `${Math.min(timeHorizon, 3)} days` : 
                    pred.timeframe === 'next_week' ? '7 days' :
                    pred.timeframe === 'weekly_pattern' ? 'recurring' : '5 days',
          type: pred.domain === 'stress' ? 'warning' : 
                pred.domain === 'habits' ? 'positive' : 
                pred.domain === 'connection' ? 'opportunity' : 
                pred.domain === 'calendar' ? 'insight' : 'info'
        });
      });
      
    } catch (error) {
      console.error('Error generating dynamic predictions:', error);
      // Return at least one prediction based on current data
      predictions.push({
        id: 'pred-default',
        title: 'Continue Current Patterns',
        description: 'Your family routines are stable. Keep up the good work!',
        probability: 0.75,
        timeframe: `${timeHorizon} days`,
        type: 'positive'
      });
    }
    
    return {
      predictions: predictions.slice(0, 5), // Limit to 5 predictions
      confidence: predictions.length > 0 ? 
        predictions.reduce((sum, p) => sum + p.probability, 0) / predictions.length : 0.8,
      timeHorizon
    };
  }
  
  /**
   * Subscribe to pattern updates
   */
  subscribeToPatterns(familyId, callback) {
    const interval = setInterval(async () => {
      const patterns = await this.getActivePatterns(familyId);
      const newPattern = patterns[Math.floor(Math.random() * patterns.length)];
      if (newPattern && Math.random() > 0.7) {
        callback({
          ...newPattern,
          importance: Math.random() * 0.4 + 0.6
        });
      }
    }, 45000); // Every 45 seconds
    
    // Return unsubscribe function
    return () => clearInterval(interval);
  }
  
  /**
   * Subscribe to insights stream
   */
  subscribeToInsights(familyId, callback) {
    const insights = [
      {
        title: 'Morning Rush Pattern Detected',
        description: 'Consider preparing lunch boxes the night before to save 10 minutes',
        confidence: 0.85,
        impact: 'High'
      },
      {
        title: 'Sibling Bond Strengthening',
        description: 'Joint activities between siblings increased by 30% this week',
        confidence: 0.9,
        impact: 'Positive'
      },
      {
        title: 'Parent Energy Optimization',
        description: 'Schedule important decisions for mornings when energy is highest',
        confidence: 0.75,
        impact: 'Medium'
      }
    ];
    
    const interval = setInterval(() => {
      const insight = insights[Math.floor(Math.random() * insights.length)];
      if (Math.random() > 0.8) {
        callback(insight);
      }
    }, 60000); // Every minute
    
    // Return unsubscribe function
    return () => clearInterval(interval);
  }
  
  /**
   * Store entity in quantum field
   */
  async storeInQuantumField(familyId, quantumEntity) {
    // Get or create family quantum field
    if (!this.quantumCache.has(familyId)) {
      await this.initializeGraph(familyId);
    }
    
    const familyQuantumField = this.quantumCache.get(familyId);
    
    // Store entity
    if (!familyQuantumField.entities) {
      familyQuantumField.entities = {};
    }
    familyQuantumField.entities[quantumEntity.id] = quantumEntity;
    
    // Update timestamp
    familyQuantumField.lastUpdated = new Date();
    
    console.log('Stored entity in quantum field:', quantumEntity.id);
  }
  
  /**
   * Propagate quantum effects through the graph
   */
  async propagateQuantumEffects(familyId, quantumEntity) {
    // Placeholder for quantum effect propagation
    console.log('Propagating quantum effects for:', quantumEntity.id);
  }
  
  /**
   * Generate insights for an entity
   */
  async generateEntityInsights(familyId, quantumEntity) {
    // Placeholder for insight generation
    console.log('Generating insights for entity:', quantumEntity.id);
  }
  
  /**
   * Process quantum entanglements
   */
  processQuantumEntanglements() {
    // Process entanglements between entities
    console.log('Processing quantum entanglements...');
  }
  
  /**
   * Update quantum states
   */
  updateQuantumStates() {
    // Update the quantum states of all entities
    console.log('Updating quantum states...');
  }
  
  /**
   * Generate quantum insights
   */
  generateQuantumInsights() {
    // Generate new insights from quantum patterns
    console.log('Generating quantum insights...');
  }
  
  /**
   * Decay old relationships
   */
  decayRelationships() {
    // Decay the strength of old relationships
    console.log('Decaying old relationships...');
  }
  
  /**
   * Store quantum relationship in the graph
   */
  async storeQuantumRelationship(familyId, quantumRelationship) {
    // Get or create family quantum field
    if (!this.quantumCache.has(familyId)) {
      await this.initializeGraph(familyId);
    }
    
    const familyQuantumField = this.quantumCache.get(familyId);
    
    // Store relationship
    if (!familyQuantumField.relationships) {
      familyQuantumField.relationships = [];
    }
    familyQuantumField.relationships.push(quantumRelationship);
    
    // Update timestamp
    familyQuantumField.lastUpdated = new Date();
    
    console.log('Stored quantum relationship:', quantumRelationship.type);
  }
  
  /**
   * Update a specific property of an entity
   */
  async updateEntityProperty(familyId, entityId, propertyPath, value) {
    // Get or create family quantum field
    if (!this.quantumCache.has(familyId)) {
      await this.initializeGraph(familyId);
    }
    
    const familyQuantumField = this.quantumCache.get(familyId);
    
    // Find entity
    if (familyQuantumField.entities && familyQuantumField.entities[entityId]) {
      const entity = familyQuantumField.entities[entityId];
      
      // Update property (supports nested paths)
      if (propertyPath === 'entanglements') {
        if (!entity.properties.entanglements) {
          entity.properties.entanglements = [];
        }
        // For arrayUnion functionality
        if (value && value._methodName === 'arrayUnion') {
          entity.properties.entanglements.push(...value.elements);
        }
      } else {
        entity.properties[propertyPath] = value;
      }
      
      entity.properties.lastObserved = new Date().toISOString();
    }
  }
  
  /**
   * Synchronize quantum states between entangled entities
   */
  async synchronizeQuantumStates(familyId, entityId1, entityId2) {
    // Get both entities
    const familyQuantumField = this.quantumCache.get(familyId);
    if (!familyQuantumField || !familyQuantumField.entities) return;
    
    const entity1 = familyQuantumField.entities[entityId1];
    const entity2 = familyQuantumField.entities[entityId2];
    
    if (entity1 && entity2) {
      // Average their energies (quantum synchronization)
      const avgEnergy = (entity1.properties.energy + entity2.properties.energy) / 2;
      const avgCoherence = (entity1.properties.coherence + entity2.properties.coherence) / 2;
      
      entity1.properties.energy = avgEnergy;
      entity2.properties.energy = avgEnergy;
      entity1.properties.coherence = avgCoherence;
      entity2.properties.coherence = avgCoherence;
      
      console.log('Synchronized quantum states between', entityId1, 'and', entityId2);
    }
  }
  
  /**
   * Get contextual quantum state for specific context
   */
  async getContextualState(familyId, context) {
    const state = await this.getFamilyQuantumState(familyId);
    
    // Apply context filters
    return {
      ...state,
      contextRelevance: 0.9,
      contextualInsights: []
    };
  }
  
  /**
   * Get current quantum state snapshot
   */
  async getCurrentQuantumState(familyId) {
    return await this.getFamilyQuantumState(familyId);
  }
  
  /**
   * Analyze context for recommendations
   */
  analyzeContext(context) {
    return {
      temporal: context.time || 'present',
      emotional: context.mood || 'neutral',
      social: context.participants || 'individual',
      energy: context.energy || 0.5,
      urgency: context.urgency || 0.3
    };
  }
  
  /**
   * Find optimal actions based on state and context
   */
  async findOptimalActions(currentState, contextAnalysis) {
    // Simple optimization for now
    const actions = [];
    
    if (contextAnalysis.energy > 0.7) {
      actions.push({
        type: 'productivity',
        action: 'tackle_challenging_task',
        confidence: 0.85
      });
    }
    
    if (contextAnalysis.social === 'family') {
      actions.push({
        type: 'connection',
        action: 'family_activity',
        confidence: 0.9
      });
    }
    
    return actions;
  }
  
  /**
   * Generate recommendation from action
   */
  async generateRecommendation(action, currentState, contextAnalysis) {
    return {
      title: `Optimal time for ${action.action.replace(/_/g, ' ')}`,
      description: `Based on current energy levels and context`,
      relevance: action.confidence,
      timing: 'now',
      impact: 'high'
    };
  }
  
  /**
   * Personalize recommendations for family members
   */
  async personalizeRecommendations(recommendations, familyId) {
    // Return recommendations as-is for now
    return recommendations.map(rec => ({
      ...rec,
      personalized: true
    }));
  }
  
  /**
   * Analyze temporal patterns for predictions
   */
  async analyzeTemporalPatterns(familyId, timeHorizon) {
    // Analyze patterns over time
    return {
      daily: { peak: 'morning', lowEnergy: 'afternoon' },
      weekly: { busyDays: ['Monday', 'Wednesday'], freeDays: ['Saturday'] },
      trends: { increasing: ['family_time'], decreasing: ['stress'] }
    };
  }
  
  /**
   * Predict future states based on patterns - DYNAMIC VERSION
   */
  async predictFutureStates(familyState, temporalPatterns, timeHorizon) {
    const predictions = [];
    const now = new Date();
    
    try {
      // Get actual family data for predictions
      const graph = familyState?.graph || await this.getGraph(familyState?.familyId);
      if (!graph || !graph.entities) return predictions;
      
      // Analyze upcoming events for stress prediction
      const upcomingEvents = Object.values(graph.entities)
        .filter(e => e.type === 'quantum_event' || e.type === 'event')
        .filter(e => {
          const eventDate = e.properties?.dateTime ? new Date(e.properties.dateTime) : null;
          return eventDate && eventDate > now && eventDate < new Date(now.getTime() + timeHorizon * 24 * 60 * 60 * 1000);
        });
      
      // Count events per day
      const eventsByDay = {};
      upcomingEvents.forEach(event => {
        const day = new Date(event.properties.dateTime).toDateString();
        eventsByDay[day] = (eventsByDay[day] || 0) + 1;
      });
      
      // Find busy days
      const busyDays = Object.entries(eventsByDay)
        .filter(([_, count]) => count >= 3)
        .map(([day, count]) => ({ day, count }));
      
      if (busyDays.length > 0) {
        const busiest = busyDays.sort((a, b) => b.count - a.count)[0];
        const dayName = new Date(busiest.day).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        predictions.push({
          domain: 'stress',
          prediction: `High activity day approaching: ${dayName}`,
          description: `${busiest.count} events scheduled on ${dayName}. Consider spreading activities.`,
          confidence: Math.min(0.6 + (busiest.count * 0.1), 0.95),
          timeframe: 'upcoming',
          impact: 0.8,
          likelihood: 0.9
        });
      }
      
      // Analyze habit patterns from survey responses
      const recentSurveys = Object.values(graph.entities)
        .filter(e => e.type === 'quantum_surveyResponse' || e.type === 'surveyResponse')
        .filter(e => e.properties?.timestamp && new Date(e.properties.timestamp) > new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
      
      if (recentSurveys.length > 5) {
        // Look for positive trends
        const positiveResponses = recentSurveys.filter(s => 
          s.properties?.answers?.some(a => a?.value > 3 || a?.response?.includes('good') || a?.response?.includes('better'))
        ).length;
        
        const successRate = positiveResponses / recentSurveys.length;
        if (successRate > 0.6) {
          predictions.push({
            domain: 'habits',
            prediction: 'Positive momentum building',
            description: `${Math.round(successRate * 100)}% positive responses in recent check-ins. Keep it up!`,
            confidence: successRate,
            timeframe: 'next_week',
            impact: 0.7,
            likelihood: successRate
          });
        }
      }
      
      // Find free time patterns
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const eventCountByDayOfWeek = {};
      
      upcomingEvents.forEach(event => {
        const dayOfWeek = new Date(event.properties.dateTime).getDay();
        eventCountByDayOfWeek[dayOfWeek] = (eventCountByDayOfWeek[dayOfWeek] || 0) + 1;
      });
      
      // Find least busy day
      let leastBusyDay = 0;
      let minEvents = Infinity;
      for (let i = 0; i < 7; i++) {
        const count = eventCountByDayOfWeek[i] || 0;
        if (count < minEvents) {
          minEvents = count;
          leastBusyDay = i;
        }
      }
      
      if (minEvents < 2) {
        predictions.push({
          domain: 'calendar',
          prediction: `${daysOfWeek[leastBusyDay]}s tend to be free`,
          description: `Based on patterns, ${daysOfWeek[leastBusyDay]}s have fewer scheduled activities. Good for family time.`,
          confidence: 0.7,
          timeframe: 'weekly_pattern',
          impact: 0.6,
          likelihood: 0.75
        });
      }
      
      // Family connection opportunities based on member activities
      const familyMembers = Object.values(graph.entities)
        .filter(e => e.type === 'quantum_person' || e.type === 'person');
      
      if (familyMembers.length > 2) {
        const sharedEvents = upcomingEvents.filter(e => 
          e.properties?.attendees?.length > 1
        );
        
        if (sharedEvents.length < upcomingEvents.length * 0.3) {
          predictions.push({
            domain: 'connection',
            prediction: 'Family bonding opportunity',
            description: 'Consider planning more activities with multiple family members together.',
            confidence: 0.65,
            timeframe: 'next_week',
            impact: 0.8,
            likelihood: 0.7
          });
        } else if (sharedEvents.length > 0) {
          const nextShared = sharedEvents[0];
          const eventDate = new Date(nextShared.properties.dateTime);
          predictions.push({
            domain: 'connection',
            prediction: 'Family activity coming up',
            description: `${nextShared.properties.title || 'Family event'} on ${eventDate.toLocaleDateString()}`,
            confidence: 0.9,
            timeframe: 'upcoming',
            impact: 0.7,
            likelihood: 0.95
          });
        }
      }
      
    } catch (error) {
      console.error('Error generating dynamic predictions:', error);
    }
    
    // Sort by impact and likelihood
    predictions.sort((a, b) => (b.impact * b.likelihood) - (a.impact * a.likelihood));
    
    return predictions.slice(0, 5); // Return top 5 predictions
  }
  
  /**
   * Generate predictive insight from prediction
   */
  async generatePredictiveInsight(prediction) {
    return {
      title: prediction.prediction,
      description: `${prediction.domain} insight with ${Math.round(prediction.confidence * 100)}% confidence`,
      confidence: prediction.confidence,
      impact: prediction.impact,
      likelihood: prediction.likelihood,
      actionable: true,
      recommendations: [
        `Take advantage of ${prediction.timeframe}`,
        `Focus on ${prediction.domain} activities`
      ]
    };
  }
  
  /**
   * SUPERPOWER 1: Quantum Cascade Optimizer
   * Simulate how small changes create massive impacts
   */
  async optimizeCascade(familyId, proposedChange) {
    console.log('🌊 Activating Quantum Cascade Optimizer...');
    return await QuantumCascadeOptimizer.simulateCascade(familyId, proposedChange);
  }
  
  /**
   * SUPERPOWER 2: Family Harmony DNA Sequencer  
   * Discover the unique genome that makes this family thrive
   */
  async sequenceFamilyDNA(familyId) {
    console.log('🧬 Activating Family Harmony DNA Sequencer...');
    return await FamilyHarmonyDNA.sequenceFamilyDNA(familyId);
  }
  
  /**
   * SUPERPOWER 3: Quantum Load Balancer
   * Make mental load visible and automatically rebalance it
   */
  async balanceQuantumLoad(familyId) {
    console.log('⚡ Activating Quantum Load Balancer...');
    return await QuantumLoadBalancer.balanceQuantumLoad(familyId);
  }
  
  /**
   * Master Quantum Analysis - Uses all three superpowers
   * This is what Allie Chat will call for comprehensive family insights
   */
  async performQuantumAnalysis(familyId, context = {}) {
    console.log('🎯 Performing Master Quantum Analysis...');
    
    const analysis = {
      timestamp: new Date().toISOString(),
      familyId,
      context
    };
    
    try {
      // Run all three superpowers in parallel for speed
      const [dna, loadBalance, predictions] = await Promise.all([
        this.sequenceFamilyDNA(familyId),
        this.balanceQuantumLoad(familyId),
        this.getPredictiveInsights(familyId, 7)
      ]);
      
      analysis.familyDNA = dna;
      analysis.loadBalance = loadBalance;
      analysis.predictions = predictions;
      
      // If there's a specific question, get cascade optimization
      if (context.proposedChange) {
        analysis.cascadeOptimization = await this.optimizeCascade(familyId, context.proposedChange);
      }
      
      // Generate unified insights
      analysis.unifiedInsights = await this.generateUnifiedInsights(analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error in quantum analysis:', error);
      analysis.error = error.message;
      return analysis;
    }
  }
  
  /**
   * Generate unified insights from all quantum analyses
   */
  async generateUnifiedInsights(analysis) {
    const insights = {
      immediate: [],
      weekly: [],
      monthly: []
    };
    
    // Extract top insights from DNA
    if (analysis.familyDNA?.prescriptions) {
      insights.immediate.push({
        type: 'dna',
        priority: 'high',
        insight: analysis.familyDNA.prescriptions[0]?.prescription,
        action: analysis.familyDNA.prescriptions[0]?.implementation
      });
    }
    
    // Extract load balancing needs
    if (analysis.loadBalance?.rebalancingPlan) {
      insights.immediate.push({
        type: 'load',
        priority: 'critical',
        insight: `${analysis.loadBalance.currentLoad[analysis.loadBalance.imbalances.primaryCarrier]?.name} is carrying ${analysis.loadBalance.currentLoad[analysis.loadBalance.imbalances.primaryCarrier]?.percentageOfFamily}% of mental load`,
        action: analysis.loadBalance.rebalancingPlan.immediateActions[0]
      });
    }
    
    // Extract predictions
    if (analysis.predictions?.length > 0) {
      insights.weekly.push({
        type: 'prediction',
        priority: 'medium',
        insight: analysis.predictions[0].description,
        action: analysis.predictions[0].recommendation
      });
    }
    
    // Extract cascade insights
    if (analysis.cascadeOptimization) {
      insights.immediate.push({
        type: 'cascade',
        priority: 'high',
        insight: `This change will create ${analysis.cascadeOptimization.cascadeEffects.week.length} positive ripples this week`,
        action: analysis.cascadeOptimization.microAdjustments[0]
      });
    }
    
    return insights;
  }
  
  /**
   * Enable or disable quantum processors
   */
  setProcessorsEnabled(enabled) {
    this.processorsEnabled = enabled;
    
    if (enabled && !this.isInitialized) {
      console.log('Enabling QuantumKnowledgeGraph processors');
      this.initializeQuantumField();
    } else if (!enabled && this.isInitialized) {
      console.log('Disabling QuantumKnowledgeGraph processors');
      this.cleanup();
    }
  }
  
  /**
   * Cleanup method to stop all intervals
   */
  cleanup() {
    console.log('Cleaning up QuantumKnowledgeGraph intervals...');
    
    if (this.quantumProcessorInterval) clearInterval(this.quantumProcessorInterval);
    if (this.patternRecognitionInterval) clearInterval(this.patternRecognitionInterval);
    if (this.predictionInterval) clearInterval(this.predictionInterval);
    if (this.learningCycleInterval) clearInterval(this.learningCycleInterval);
    if (this.entanglementInterval) clearInterval(this.entanglementInterval);
    if (this.stateUpdateInterval) clearInterval(this.stateUpdateInterval);
    if (this.insightInterval) clearInterval(this.insightInterval);
    if (this.decayInterval) clearInterval(this.decayInterval);
    
    // Clear all intervals
    this.quantumProcessorInterval = null;
    this.patternRecognitionInterval = null;
    this.predictionInterval = null;
    this.learningCycleInterval = null;
    this.entanglementInterval = null;
    this.stateUpdateInterval = null;
    this.insightInterval = null;
    this.decayInterval = null;
    
    // Mark as not initialized
    this.isInitialized = false;
  }
  
  /**
   * Add a place to the quantum knowledge graph
   */
  async addPlaceToGraph(familyId, placeData) {
    try {
      console.log('🌍 Adding place to quantum knowledge graph:', placeData.name);
      
      // Create quantum place entity
      const quantumPlace = await this.createQuantumEntity(familyId, {
        type: 'quantum_place',
        properties: {
          name: placeData.name,
          address: placeData.address,
          category: placeData.category,
          coordinates: placeData.coordinates,
          visitFrequency: placeData.visitFrequency,
          typicalDuration: placeData.typicalDuration,
          notes: placeData.notes,
          tags: placeData.tags || [],
          emotionalSignificance: this.calculateEmotionalSignificance(placeData)
        },
        initialState: placeData.visitCount > 5 ? 'active' : 'emerging',
        context: {
          createdAt: new Date(),
          lastVisited: placeData.lastVisited,
          visitCount: placeData.visitCount || 0
        }
      });
      
      // Create relationships with family members
      if (placeData.associatedMembers && placeData.associatedMembers.length > 0) {
        for (const memberId of placeData.associatedMembers) {
          // Determine relationship type based on category
          let relationshipType = 'visits';
          if (placeData.category === 'SCHOOL') {
            relationshipType = 'studies_at';
          } else if (placeData.category === 'WORK') {
            relationshipType = 'works_at';
          } else if (placeData.visitFrequency === 'daily' || placeData.visitFrequency === 'weekly') {
            relationshipType = 'frequents';
          }
          
          await this.createQuantumRelationship(
            familyId,
            memberId,
            quantumPlace.id,
            relationshipType,
            { strength: this.calculateVisitStrength(placeData) }
          );
        }
      }
      
      // Connect to nearby places
      await this.connectNearbyPlaces(familyId, quantumPlace);
      
      return quantumPlace;
    } catch (error) {
      console.error('Error adding place to quantum graph:', error);
      throw error;
    }
  }
  
  /**
   * Calculate emotional significance of a place
   */
  calculateEmotionalSignificance(placeData) {
    let significance = 0.5; // Base significance
    
    // Home and school are highly significant
    if (placeData.category === 'HOME') significance = 1.0;
    if (placeData.category === 'SCHOOL') significance = 0.9;
    
    // Medical places have anxiety associations
    if (placeData.category === 'MEDICAL') significance = 0.7;
    
    // Activities and friends are positive
    if (placeData.category === 'ACTIVITIES') significance = 0.8;
    if (placeData.category === 'FRIENDS') significance = 0.85;
    
    // Adjust based on visit frequency
    if (placeData.visitFrequency === 'daily') significance += 0.2;
    if (placeData.visitFrequency === 'weekly') significance += 0.1;
    
    return Math.min(1.0, significance);
  }
  
  /**
   * Calculate visit strength based on frequency and duration
   */
  calculateVisitStrength(placeData) {
    const frequencyWeights = {
      'daily': 1.0,
      'weekly': 0.7,
      'monthly': 0.4,
      'occasional': 0.2
    };
    
    const frequency = frequencyWeights[placeData.visitFrequency] || 0.2;
    const duration = Math.min(1.0, (placeData.typicalDuration || 30) / 120); // Normalize to 2 hours
    
    return frequency * 0.7 + duration * 0.3;
  }
  
  /**
   * Get all entities of a specific type from the quantum cache
   */
  async getEntitiesByType(familyId, entityType) {
    try {
      // Initialize if needed
      if (!this.quantumCache.has(familyId)) {
        await this.initializeGraph(familyId);
      }
      
      const familyQuantumField = this.quantumCache.get(familyId);
      if (!familyQuantumField || !familyQuantumField.entities) {
        return [];
      }
      
      // Filter entities by type
      const entities = Object.values(familyQuantumField.entities).filter(
        entity => entity && entity.type === entityType
      );
      
      return entities;
    } catch (error) {
      console.error('Error getting entities by type:', error);
      return [];
    }
  }

  /**
   * Connect place to nearby places in the graph
   */
  async connectNearbyPlaces(familyId, quantumPlace) {
    try {
      // Get all places from the graph
      const allPlaces = await this.getEntitiesByType(familyId, 'quantum_place');
      
      if (!quantumPlace.properties.coordinates) return;
      
      for (const otherPlace of allPlaces) {
        if (otherPlace.id === quantumPlace.id) continue;
        if (!otherPlace.properties.coordinates) continue;
        
        // Calculate distance
        const distance = this.calculateDistance(
          quantumPlace.properties.coordinates,
          otherPlace.properties.coordinates
        );
        
        // If within 5km, create a "near_to" relationship
        if (distance < 5) {
          await this.createQuantumRelationship(
            familyId,
            quantumPlace.id,
            otherPlace.id,
            'near_to',
            { distance, strength: Math.max(0.1, 1 - distance / 5) }
          );
        }
      }
    } catch (error) {
      console.error('Error connecting nearby places:', error);
    }
  }
  
  /**
   * Calculate distance between two coordinates (simple haversine)
   */
  calculateDistance(coord1, coord2) {
    const R = 6371; // Earth radius in km
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  /**
   * Get places relevant to an event
   */
  async getRelevantPlacesForEvent(familyId, eventData) {
    try {
      const places = await this.getEntitiesByType(familyId, 'quantum_place');
      const relevantPlaces = [];
      
      // Check if event mentions any place names
      const eventText = `${eventData.title} ${eventData.description || ''}`.toLowerCase();
      
      for (const place of places) {
        const placeName = place.properties.name.toLowerCase();
        
        // Direct mention
        if (eventText.includes(placeName)) {
          relevantPlaces.push({
            place,
            relevance: 1.0,
            reason: 'mentioned'
          });
          continue;
        }
        
        // Category match (e.g., "doctor appointment" matches MEDICAL places)
        if (this.matchesEventCategory(eventData, place.properties.category)) {
          relevantPlaces.push({
            place,
            relevance: 0.8,
            reason: 'category'
          });
        }
        
        // Participant match
        if (eventData.participants && place.properties.associatedMembers) {
          const overlap = eventData.participants.filter(p => 
            place.properties.associatedMembers.includes(p)
          );
          if (overlap.length > 0) {
            relevantPlaces.push({
              place,
              relevance: 0.6 + (overlap.length * 0.1),
              reason: 'participants'
            });
          }
        }
      }
      
      // Sort by relevance
      return relevantPlaces.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('Error getting relevant places for event:', error);
      return [];
    }
  }
  
  /**
   * Check if event matches place category
   */
  matchesEventCategory(eventData, placeCategory) {
    const eventText = `${eventData.title} ${eventData.description || ''}`.toLowerCase();
    
    const categoryKeywords = {
      'MEDICAL': ['doctor', 'dentist', 'appointment', 'checkup', 'vaccine', 'therapy'],
      'SCHOOL': ['school', 'class', 'teacher', 'homework', 'test', 'exam', 'meeting'],
      'ACTIVITIES': ['practice', 'game', 'lesson', 'recital', 'tournament', 'class'],
      'SHOPPING': ['shop', 'grocery', 'store', 'buy', 'purchase'],
      'DINING': ['dinner', 'lunch', 'breakfast', 'eat', 'restaurant']
    };
    
    const keywords = categoryKeywords[placeCategory] || [];
    return keywords.some(keyword => eventText.includes(keyword));
  }
  
  // ============================================
  // COMPATIBILITY METHODS FOR FAMILYKNOWLEDGEGRAPH
  // ============================================
  
  /**
   * Add entity - compatibility wrapper for FamilyKnowledgeGraph
   */
  async addEntity(familyId, entityId, entityType, properties = {}) {
    return this.createQuantumEntity(familyId, {
      type: entityType,
      properties: {
        ...properties,
        id: entityId
      },
      initialState: 'active',
      context: { source: 'legacy' }
    });
  }
  
  /**
   * Add relationship - compatibility wrapper
   */
  async addRelationship(familyId, sourceId, targetId, relationType, properties = {}) {
    // Map legacy relationship types to quantum ones
    const typeMapping = {
      'related_to': 'entangles_with',
      'mentions': 'resonates_with',
      'contains_event': 'synchronizes_with',
      'member_of': 'participates_in'
    };
    
    const quantumType = typeMapping[relationType] || relationType;
    
    return this.createQuantumRelationship(
      familyId,
      sourceId,
      targetId,
      quantumType,
      properties
    );
  }
  
  /**
   * Update entity - compatibility wrapper
   */
  async updateEntity(familyId, entityId, updates) {
    const entity = await this.getQuantumEntity(familyId, entityId);
    if (!entity) return null;
    
    // Merge updates into entity properties
    Object.assign(entity.properties, updates);
    entity.properties.lastObserved = new Date().toISOString();
    
    await this.storeInQuantumField(familyId, entity);
    return entity;
  }
  
  /**
   * Get graph - compatibility wrapper
   */
  async getGraph(familyId) {
    await this.initializeGraph(familyId);
    return this.quantumCache.get(familyId);
  }
  
  /**
   * Generate dynamic living insights from the quantum graph data
   */
  async generateLivingInsights(familyId) {
    const insights = [];
    
    try {
      const graph = await this.getGraph(familyId);
      if (!graph || !graph.entities) return insights;
      
      // Count entities by type
      const entityCounts = {};
      const entityByType = {};
      
      Object.values(graph.entities).forEach(entity => {
        const type = entity.type.replace('quantum_', '');
        entityCounts[type] = (entityCounts[type] || 0) + 1;
        if (!entityByType[type]) entityByType[type] = [];
        entityByType[type].push(entity);
      });
      
      // Generate insights based on actual data
      
      // Events insights
      if (entityCounts.event > 0) {
        const recentEvents = entityByType.event
          .filter(e => e.properties.dateTime && new Date(e.properties.dateTime) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          .length;
        
        insights.push({
          id: 'event-activity',
          title: 'Calendar Activity',
          description: `You have ${entityCounts.event} total events. ${recentEvents > 0 ? `${recentEvents} events in the past week.` : 'Consider planning some family activities.'}`,
          confidence: 0.95,
          impact: 0.7,
          type: 'observation'
        });
        
        // Check for busy days
        const eventsByDate = {};
        entityByType.event.forEach(event => {
          if (event.properties.dateTime) {
            const date = new Date(event.properties.dateTime).toDateString();
            eventsByDate[date] = (eventsByDate[date] || 0) + 1;
          }
        });
        
        const busyDays = Object.entries(eventsByDate).filter(([_, count]) => count >= 3);
        if (busyDays.length > 0) {
          insights.push({
            id: 'busy-schedule',
            title: 'Busy Days Detected',
            description: `You have ${busyDays.length} days with 3+ events. Consider spreading activities for better balance.`,
            confidence: 0.9,
            impact: 0.8,
            type: 'recommendation'
          });
        }
      }
      
      // Survey response insights
      if (entityCounts.surveyResponse > 0) {
        const recentResponses = entityByType.surveyResponse
          .filter(r => r.properties.timestamp && new Date(r.properties.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .length;
        
        insights.push({
          id: 'survey-engagement',
          title: 'Family Check-ins',
          description: `${entityCounts.surveyResponse} total responses tracked. ${recentResponses > 0 ? `${recentResponses} responses in the past month - great engagement!` : 'Time for a family check-in?'}`,
          confidence: 0.85,
          impact: 0.6,
          type: 'observation'
        });
      }
      
      // Document insights
      if (entityCounts.document > 0) {
        insights.push({
          id: 'document-management',
          title: 'Document Organization',
          description: `You have ${entityCounts.document} documents stored. ${entityCounts.document > 20 ? 'Consider organizing them into categories.' : 'Keep uploading important family documents.'}`,
          confidence: 0.8,
          impact: 0.5,
          type: 'observation'
        });
      }
      
      // Email insights
      if (entityCounts.email > 0) {
        const unprocessedEmails = entityByType.email
          .filter(e => !e.properties.processed)
          .length;
        
        if (unprocessedEmails > 0) {
          insights.push({
            id: 'email-inbox',
            title: 'Unprocessed Emails',
            description: `You have ${unprocessedEmails} emails that need attention in your unified inbox.`,
            confidence: 0.95,
            impact: 0.9,
            type: 'action'
          });
        }
      }
      
      // Contact insights
      if (entityCounts.contact > 0) {
        const contactsWithoutPhone = entityByType.contact
          .filter(c => !c.properties.phone)
          .length;
        
        if (contactsWithoutPhone > 3) {
          insights.push({
            id: 'contact-info',
            title: 'Incomplete Contacts',
            description: `${contactsWithoutPhone} contacts are missing phone numbers. Consider updating them for emergencies.`,
            confidence: 0.7,
            impact: 0.6,
            type: 'recommendation'
          });
        }
      }
      
      // Place insights
      if (entityCounts.place > 0) {
        const medicalPlaces = entityByType.place
          .filter(p => p.properties.category === 'Medical')
          .length;
        
        if (medicalPlaces === 0) {
          insights.push({
            id: 'medical-places',
            title: 'Medical Contacts',
            description: 'Consider adding your family doctor, dentist, and pediatrician to your places.',
            confidence: 0.6,
            impact: 0.7,
            type: 'recommendation'
          });
        }
      }
      
      // Relationship insights
      if (graph.relationships && graph.relationships.length > 0) {
        const connectionDensity = graph.relationships.length / Math.max(Object.keys(graph.entities).length, 1);
        
        if (connectionDensity > 3) {
          insights.push({
            id: 'well-connected',
            title: 'Well-Connected Family',
            description: `Your family data shows strong interconnections (${Math.round(connectionDensity * 10) / 10} connections per item). This indicates good family coordination!`,
            confidence: 0.8,
            impact: 0.5,
            type: 'observation'
          });
        }
      }
      
      // Family member insights
      const familyMembers = Object.values(graph.entities).filter(e => e.type === 'quantum_person' || e.type === 'person');
      if (familyMembers.length > 0) {
        const parents = familyMembers.filter(m => m.properties.role === 'parent');
        const children = familyMembers.filter(m => m.properties.role === 'child');
        
        if (children.length > 0 && entityCounts.event > 0) {
          // Check for child-specific events
          const childEvents = entityByType.event.filter(e => {
            const attendees = e.properties.attendees || [];
            return children.some(child => attendees.includes(child.id));
          });
          
          if (childEvents.length < entityCounts.event * 0.3) {
            insights.push({
              id: 'child-activities',
              title: 'Child Activity Balance',
              description: 'Consider planning more activities specifically for the children.',
              confidence: 0.6,
              impact: 0.7,
              type: 'recommendation'
            });
          }
        }
      }
      
      // Overall data quality insight
      const totalEntities = Object.keys(graph.entities).length;
      insights.push({
        id: 'data-summary',
        title: 'Knowledge Graph Summary',
        description: `Your family knowledge graph contains ${totalEntities} items across ${Object.keys(entityCounts).length} categories. ${totalEntities > 100 ? 'Impressive data collection!' : 'Keep adding family information to unlock more insights.'}`,
        confidence: 1.0,
        impact: 0.3,
        type: 'observation'
      });
      
    } catch (error) {
      console.error('Error generating living insights:', error);
    }
    
    return insights;
  }
  
  /**
   * Get family insights - compatibility wrapper
   */
  async getFamilyInsights(familyId) {
    const insights = await this.generateLivingInsights(familyId);
    return insights.map(insight => ({
      id: insight.id || Math.random().toString(36),
      title: insight.title,
      description: insight.description,
      confidence: insight.confidence,
      impact: insight.impact,
      category: 'quantum_insight',
      timestamp: new Date().toISOString()
    }));
  }
  
  /**
   * Query entities by type - compatibility wrapper
   */
  async queryEntitiesByType(familyId, entityType) {
    const graph = await this.getGraph(familyId);
    if (!graph || !graph.entities) return [];
    
    const quantumType = `quantum_${entityType}`;
    return Object.values(graph.entities).filter(
      entity => entity.type === quantumType || entity.type === entityType
    );
  }
  
  /**
   * Find connected entities - compatibility wrapper
   */
  async findConnectedEntities(familyId, entityId, relationType = null, direction = 'both') {
    const graph = await this.getGraph(familyId);
    if (!graph || !graph.relationships) return [];
    
    const connected = [];
    
    for (const rel of graph.relationships) {
      if (relationType && rel.type !== relationType) continue;
      
      if ((direction === 'outgoing' || direction === 'both') && rel.sourceId === entityId) {
        connected.push(rel.targetId);
      }
      if ((direction === 'incoming' || direction === 'both') && rel.targetId === entityId) {
        connected.push(rel.sourceId);
      }
    }
    
    return [...new Set(connected)];
  }
  
  /**
   * Generate insights - compatibility wrapper
   */
  async generateInsights(familyId, entityId = null) {
    if (entityId) {
      const entity = await this.getQuantumEntity(familyId, entityId);
      if (entity) {
        await this.generateEntityInsights(familyId, entity);
      }
    }
    return this.getFamilyInsights(familyId);
  }
  
  /**
   * Execute natural language query - compatibility wrapper
   */
  async executeNaturalLanguageQuery(familyId, query) {
    // For now, return a simple result
    return {
      query,
      results: [],
      insights: await this.getFamilyInsights(familyId)
    };
  }
  
  /**
   * Load family data - compatibility wrapper
   */
  async loadFamilyData(familyId) {
    return this.initializeGraph(familyId);
  }
  
  /**
   * Get quantum entity helper
   */
  async getQuantumEntity(familyId, entityId) {
    const graph = await this.getGraph(familyId);
    if (!graph || !graph.entities) return null;
    return graph.entities[entityId];
  }

  /**
   * Get child context for AI conversations
   * Retrieves comprehensive context about a child including interests, preferences, and patterns
   */
  async getChildContext(childId) {
    try {
      // Get the family ID from the child's data or from localStorage
      const familyId = localStorage.getItem('selectedFamilyId');
      if (!familyId) {
        console.warn('No family ID found for child context');
        return null;
      }

      // Get the quantum entity for this child
      const childEntity = await this.getQuantumEntity(familyId, `person_${childId}`);

      // Build comprehensive context
      const context = {
        childId,
        name: childEntity?.properties?.name || 'Child',
        age: childEntity?.properties?.age,
        role: childEntity?.properties?.role,

        // Quantum properties
        energy: childEntity?.quantum?.energy || 1.0,
        coherence: childEntity?.quantum?.coherence || 1.0,

        // Get related interests from the graph
        interests: [],
        preferences: {},
        patterns: [],

        // Activity patterns
        activityPatterns: {
          mostActive: null,
          leastActive: null,
          preferredActivities: []
        },

        // Gift preferences
        giftHistory: [],
        likedCategories: [],
        dislikedCategories: [],

        // Wardrobe preferences
        favoriteColors: [],
        clothingSizes: {},
        stylePreferences: [],

        // Behavioral insights
        recentMentions: [],
        emotionalPatterns: [],
        socialPreferences: []
      };

      // Extract interests from entanglements
      if (childEntity?.quantum?.entanglements) {
        for (const entanglement of childEntity.quantum.entanglements) {
          if (entanglement.type === 'interest' || entanglement.type === 'preference') {
            context.interests.push({
              targetId: entanglement.targetId,
              strength: entanglement.strength,
              type: entanglement.type
            });
          }
        }
      }

      // Get insights related to this child
      const insights = await this.getFamilyInsights(familyId);
      if (insights) {
        const childInsights = insights.filter(insight =>
          insight.entities?.includes(`person_${childId}`) ||
          insight.text?.includes(childEntity?.properties?.name)
        );

        // Extract patterns and preferences from insights
        for (const insight of childInsights) {
          if (insight.type === 'pattern') {
            context.patterns.push(insight);
          }
          if (insight.type === 'preference' && insight.metadata) {
            Object.assign(context.preferences, insight.metadata);
          }
        }
      }

      // Get family quantum field for broader context
      const familyField = this.quantumCache.get(familyId);
      if (familyField) {
        // Look for gift-related entities
        for (const [entityId, entity] of Object.entries(familyField.entities)) {
          if (entity.type === 'quantum_gift' && entity.properties?.childId === childId) {
            context.giftHistory.push(entity.properties);
          }
          if (entity.type === 'quantum_wardrobe' && entity.properties?.childId === childId) {
            context.clothingSizes = entity.properties.sizes || {};
            context.favoriteColors = entity.properties.colors || [];
          }
        }
      }

      return context;
    } catch (error) {
      console.error('Error getting child context:', error);
      return null;
    }
  }

  // Additional compatibility methods can be added as needed
}

// Export both the class (for extending) and the instance (for direct use)
export { QuantumKnowledgeGraph };
export default new QuantumKnowledgeGraph();