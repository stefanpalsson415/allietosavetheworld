// src/services/dna/RealTimeFamilyDNATracker.js
import {
  doc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { PowerFeaturesKnowledgeGraphIntegration } from '../quantum/PowerFeaturesKnowledgeGraphIntegration.js';
import ClaudeService from '../ClaudeService.js';

/**
 * Real-Time Family DNA Evolution Tracking System
 *
 * Monitors and tracks changes in family behavioral patterns over time,
 * providing insights into relationship evolution, communication development,
 * and family system maturation.
 */
export class RealTimeFamilyDNATracker {
  constructor() {
    this.powerKG = new PowerFeaturesKnowledgeGraphIntegration();
    this.activeTrackers = new Map(); // familyId -> unsubscribe function
    this.evolutionHistory = new Map(); // familyId -> evolution data
    this.patternDetectors = new Map(); // familyId -> pattern detection state

    // DNA evolution parameters
    this.trackingIntervals = {
      immediate: 60000,      // 1 minute - immediate pattern changes
      shortTerm: 300000,     // 5 minutes - behavioral shifts
      mediumTerm: 1800000,   // 30 minutes - communication patterns
      longTerm: 86400000     // 24 hours - relationship evolution
    };

    // Pattern sensitivity thresholds
    this.evolutionThresholds = {
      communication: 0.15,    // 15% change triggers evolution
      decisionMaking: 0.20,   // 20% change in decision patterns
      conflictResolution: 0.25, // 25% change in conflict handling
      emotionalSupport: 0.18, // 18% change in support patterns
      taskDistribution: 0.22  // 22% change in task sharing
    };
  }

  /**
   * Start real-time DNA tracking for a family
   */
  async startTracking(familyId) {
    try {
      console.log(`🧬 Starting DNA evolution tracking for family: ${familyId}`);

      // Initialize family DNA baseline if not exists
      await this.initializeFamilyDNABaseline(familyId);

      // Set up real-time listeners for all data sources
      const unsubscribes = await Promise.all([
        this.trackCommunicationEvolution(familyId),
        this.trackDecisionMakingEvolution(familyId),
        this.trackConflictResolutionEvolution(familyId),
        this.trackEmotionalSupportEvolution(familyId),
        this.trackTaskDistributionEvolution(familyId)
      ]);

      // Store unsubscribe functions
      this.activeTrackers.set(familyId, () => {
        unsubscribes.forEach(unsub => unsub());
      });

      // Start periodic evolution analysis
      this.startEvolutionCycles(familyId);

      return { success: true, trackingActive: true };
    } catch (error) {
      console.error('Error starting DNA tracking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop tracking for a family
   */
  stopTracking(familyId) {
    const unsubscribe = this.activeTrackers.get(familyId);
    if (unsubscribe) {
      unsubscribe();
      this.activeTrackers.delete(familyId);
      this.evolutionHistory.delete(familyId);
      this.patternDetectors.delete(familyId);
    }
  }

  /**
   * Initialize baseline DNA profile for family
   */
  async initializeFamilyDNABaseline(familyId) {
    try {
      // Get current family data to establish baseline
      const currentData = await this.gatherCurrentFamilyData(familyId);

      // Generate initial DNA sequence
      const initialDNA = await this.generateDNASequence(currentData);

      // Store baseline in Quantum Knowledge Graph
      await this.powerKG.integrateDNAData(familyId, {
        dnaSequence: initialDNA.sequence,
        patterns: initialDNA.patterns,
        baseline: true,
        timestamp: new Date(),
        evolutionStage: 'Forming',
        confidence: initialDNA.confidence || 0.7
      });

      // Initialize evolution history
      this.evolutionHistory.set(familyId, {
        baseline: initialDNA,
        snapshots: [],
        evolutionEvents: [],
        currentStage: 'Forming',
        lastAnalysis: new Date()
      });

      console.log(`📊 Baseline DNA established for family ${familyId}:`, initialDNA.sequence);
      return initialDNA;
    } catch (error) {
      console.error('Error initializing DNA baseline:', error);
      throw error;
    }
  }

  /**
   * Track communication pattern evolution
   */
  async trackCommunicationEvolution(familyId) {
    const messagesQuery = query(
      collection(db, 'messages'),
      where('familyId', '==', familyId),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    return onSnapshot(messagesQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        await this.analyzeCommunicationEvolution(familyId, messages);
      }
    });
  }

  /**
   * Track decision making pattern evolution
   */
  async trackDecisionMakingEvolution(familyId) {
    const tasksQuery = query(
      collection(db, 'kanbanTasks'),
      where('familyId', '==', familyId),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    return onSnapshot(tasksQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        await this.analyzeDecisionMakingEvolution(familyId, tasks);
      }
    });
  }

  /**
   * Track conflict resolution evolution
   */
  async trackConflictResolutionEvolution(familyId) {
    // Monitor survey responses related to conflict
    const surveysQuery = query(
      collection(db, 'surveyResponses'),
      where('familyId', '==', familyId),
      where('category', '==', 'conflict'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    return onSnapshot(surveysQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const responses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        await this.analyzeConflictResolutionEvolution(familyId, responses);
      }
    });
  }

  /**
   * Track emotional support pattern evolution
   */
  async trackEmotionalSupportEvolution(familyId) {
    // Monitor Claude chat interactions for emotional content
    const chatQuery = query(
      collection(db, 'chatHistory'),
      where('familyId', '==', familyId),
      orderBy('timestamp', 'desc'),
      limit(40)
    );

    return onSnapshot(chatQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const chats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        await this.analyzeEmotionalSupportEvolution(familyId, chats);
      }
    });
  }

  /**
   * Track task distribution evolution
   */
  async trackTaskDistributionEvolution(familyId) {
    const eventsQuery = query(
      collection(db, 'events'),
      where('familyId', '==', familyId),
      orderBy('startTime', 'desc'),
      limit(25)
    );

    return onSnapshot(eventsQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        await this.analyzeTaskDistributionEvolution(familyId, events);
      }
    });
  }

  /**
   * Analyze communication evolution from recent messages
   */
  async analyzeCommunicationEvolution(familyId, messages) {
    try {
      const patterns = await this.extractCommunicationPatterns(messages);
      const evolution = this.evolutionHistory.get(familyId);

      if (evolution) {
        const baseline = evolution.baseline.patterns.find(p => p.category === 'communication');
        const change = this.calculatePatternChange(baseline, patterns);

        if (change.magnitude > this.evolutionThresholds.communication) {
          await this.recordEvolutionEvent(familyId, {
            type: 'communication_evolution',
            change: change,
            patterns: patterns,
            timestamp: new Date(),
            significance: change.magnitude > 0.3 ? 'major' : 'minor'
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing communication evolution:', error);
    }
  }

  /**
   * Extract communication patterns from messages
   */
  async extractCommunicationPatterns(messages) {
    const recentMessages = messages.slice(0, 20);

    // Analyze with Claude for pattern extraction
    const analysis = await ClaudeService.analyze({
      prompt: `Analyze these family messages for communication patterns:

        Messages: ${JSON.stringify(recentMessages.map(m => ({
          sender: m.senderName,
          content: m.content,
          timestamp: m.timestamp
        })))}

        Extract:
        1. Communication style (direct, supportive, collaborative, etc.)
        2. Emotional tone patterns
        3. Response time patterns
        4. Topic preference patterns
        5. Decision making involvement

        Return JSON with pattern values and confidence scores.`,
      data: { messages: recentMessages },
      mode: 'pattern_analysis'
    });

    return {
      category: 'communication',
      style: analysis.style || 'Unknown',
      tone: analysis.tone || 'Neutral',
      responsiveness: analysis.responsiveness || 0.5,
      collaboration: analysis.collaboration || 0.5,
      confidence: analysis.confidence || 0.6,
      timestamp: new Date()
    };
  }

  /**
   * Analyze decision making evolution from tasks
   */
  async analyzeDecisionMakingEvolution(familyId, tasks) {
    try {
      const patterns = await this.extractDecisionMakingPatterns(tasks);
      const evolution = this.evolutionHistory.get(familyId);

      if (evolution) {
        const baseline = evolution.baseline.patterns.find(p => p.category === 'decisionMaking');
        const change = this.calculatePatternChange(baseline, patterns);

        if (change.magnitude > this.evolutionThresholds.decisionMaking) {
          await this.recordEvolutionEvent(familyId, {
            type: 'decision_evolution',
            change: change,
            patterns: patterns,
            timestamp: new Date(),
            significance: change.magnitude > 0.35 ? 'major' : 'minor'
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing decision making evolution:', error);
    }
  }

  /**
   * Extract decision making patterns from tasks
   */
  async extractDecisionMakingPatterns(tasks) {
    const recentTasks = tasks.slice(0, 15);

    return {
      category: 'decisionMaking',
      autonomy: this.calculateAutonomyLevel(recentTasks),
      collaboration: this.calculateCollaborationLevel(recentTasks),
      speed: this.calculateDecisionSpeed(recentTasks),
      consensus: this.calculateConsensusLevel(recentTasks),
      confidence: 0.7,
      timestamp: new Date()
    };
  }

  /**
   * Generate current DNA sequence from patterns
   */
  async generateDNASequence(data) {
    try {
      const analysis = await ClaudeService.analyze({
        prompt: `Generate a Family DNA sequence from this behavioral data:

        Data: ${JSON.stringify(data)}

        Create a DNA sequence like "COLLABORATIVE-SUPPORTIVE-ADAPTIVE" that captures:
        1. Primary communication style
        2. Decision making approach
        3. Conflict resolution style
        4. Emotional support pattern
        5. Task distribution method

        Return JSON with:
        - sequence: DNA string with 3-5 key traits joined by hyphens
        - patterns: array of pattern objects with name, value, strength
        - confidence: 0-1 confidence score
        - evolutionStage: Forming/Growing/Mature/Adapting`,
        data: data,
        mode: 'dna_generation'
      });

      return {
        sequence: analysis.sequence || 'DEVELOPING-LEARNING-ADAPTING',
        patterns: analysis.patterns || [],
        confidence: analysis.confidence || 0.7,
        evolutionStage: analysis.evolutionStage || 'Forming'
      };
    } catch (error) {
      console.error('Error generating DNA sequence:', error);
      return {
        sequence: 'DEVELOPING-LEARNING-ADAPTING',
        patterns: [],
        confidence: 0.5,
        evolutionStage: 'Forming'
      };
    }
  }

  /**
   * Calculate pattern change between baseline and current
   */
  calculatePatternChange(baseline, current) {
    if (!baseline || !current) {
      return { magnitude: 0, direction: 'stable', details: {} };
    }

    // Compare key metrics
    const changes = {};
    const metrics = ['style', 'tone', 'responsiveness', 'collaboration', 'autonomy', 'speed'];

    metrics.forEach(metric => {
      if (baseline[metric] !== undefined && current[metric] !== undefined) {
        const baselineValue = typeof baseline[metric] === 'string' ?
          this.stringToNumeric(baseline[metric]) : baseline[metric];
        const currentValue = typeof current[metric] === 'string' ?
          this.stringToNumeric(current[metric]) : current[metric];

        changes[metric] = Math.abs(currentValue - baselineValue);
      }
    });

    const avgChange = Object.values(changes).reduce((sum, val) => sum + val, 0) / Object.keys(changes).length;

    return {
      magnitude: avgChange || 0,
      direction: avgChange > 0.1 ? 'evolving' : 'stable',
      details: changes
    };
  }

  /**
   * Record significant evolution event
   */
  async recordEvolutionEvent(familyId, event) {
    try {
      // Store in Firestore
      await addDoc(collection(db, 'familyDNAEvolution'), {
        familyId,
        ...event,
        timestamp: serverTimestamp()
      });

      // Update evolution history
      const evolution = this.evolutionHistory.get(familyId);
      if (evolution) {
        evolution.evolutionEvents.push(event);
        evolution.lastAnalysis = new Date();

        // Check if this triggers stage evolution
        await this.checkStageEvolution(familyId, event);
      }

      // Store in Quantum Knowledge Graph
      await this.powerKG.addNode(familyId, {
        type: 'quantum_dna_evolution',
        subtype: event.type,
        metadata: {
          change: event.change,
          patterns: event.patterns,
          significance: event.significance,
          evolutionStage: evolution?.currentStage || 'Unknown'
        },
        timestamp: event.timestamp,
        connections: [
          { type: 'EVOLUTION_OF', targetType: 'quantum_family_dna' }
        ]
      });

      console.log(`🧬 DNA Evolution Event recorded for ${familyId}:`, event.type);
    } catch (error) {
      console.error('Error recording evolution event:', error);
    }
  }

  /**
   * Check if family should evolve to next stage
   */
  async checkStageEvolution(familyId, event) {
    const evolution = this.evolutionHistory.get(familyId);
    if (!evolution) return;

    const significantEvents = evolution.evolutionEvents.filter(e =>
      e.significance === 'major' &&
      Date.now() - new Date(e.timestamp).getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );

    const stageProgression = {
      'Forming': { next: 'Growing', threshold: 3 },
      'Growing': { next: 'Mature', threshold: 5 },
      'Mature': { next: 'Adapting', threshold: 4 },
      'Adapting': { next: 'Mature', threshold: 6 }
    };

    const currentStage = evolution.currentStage;
    const progression = stageProgression[currentStage];

    if (progression && significantEvents.length >= progression.threshold) {
      await this.evolveFamilyStage(familyId, progression.next);
    }
  }

  /**
   * Evolve family to next developmental stage
   */
  async evolveFamilyStage(familyId, newStage) {
    try {
      const evolution = this.evolutionHistory.get(familyId);
      const oldStage = evolution.currentStage;

      evolution.currentStage = newStage;

      // Generate new DNA sequence for evolved stage
      const currentData = await this.gatherCurrentFamilyData(familyId);
      const evolvedDNA = await this.generateDNASequence({
        ...currentData,
        evolutionStage: newStage,
        previousStage: oldStage
      });

      // Record stage evolution event
      await addDoc(collection(db, 'familyDNAEvolution'), {
        familyId,
        type: 'stage_evolution',
        fromStage: oldStage,
        toStage: newStage,
        newDNA: evolvedDNA,
        timestamp: serverTimestamp(),
        significance: 'major'
      });

      // Update Quantum Knowledge Graph
      await this.powerKG.integrateDNAData(familyId, {
        dnaSequence: evolvedDNA.sequence,
        patterns: evolvedDNA.patterns,
        evolutionStage: newStage,
        previousStage: oldStage,
        timestamp: new Date(),
        confidence: evolvedDNA.confidence,
        stageEvolution: true
      });

      console.log(`🚀 Family ${familyId} evolved from ${oldStage} to ${newStage}!`);

      // Trigger celebration/notification
      this.triggerEvolutionCelebration(familyId, oldStage, newStage);

    } catch (error) {
      console.error('Error evolving family stage:', error);
    }
  }

  /**
   * Trigger evolution celebration
   */
  triggerEvolutionCelebration(familyId, oldStage, newStage) {
    // Dispatch custom event for UI to show celebration
    window.dispatchEvent(new CustomEvent('family-dna-evolution', {
      detail: {
        familyId,
        fromStage: oldStage,
        toStage: newStage,
        timestamp: new Date()
      }
    }));
  }

  /**
   * Start periodic evolution analysis cycles
   */
  startEvolutionCycles(familyId) {
    // Immediate pattern detection (1 minute)
    const immediateInterval = setInterval(async () => {
      await this.runImmediateAnalysis(familyId);
    }, this.trackingIntervals.immediate);

    // Store interval references for cleanup
    if (!this.patternDetectors.has(familyId)) {
      this.patternDetectors.set(familyId, {
        immediate: immediateInterval
      });
    }
  }

  /**
   * Run immediate pattern analysis
   */
  async runImmediateAnalysis(familyId) {
    try {
      // Quick pattern check for recent activity
      const recentData = await this.gatherRecentActivity(familyId, 5); // Last 5 minutes

      if (recentData.hasActivity) {
        // Look for immediate pattern shifts
        await this.detectImmediatePatternShifts(familyId, recentData);
      }
    } catch (error) {
      console.error('Error in immediate analysis:', error);
    }
  }

  /**
   * Gather current family data for analysis
   */
  async gatherCurrentFamilyData(familyId) {
    const [messages, tasks, events, surveys] = await Promise.all([
      this.getRecentMessages(familyId, 30),
      this.getRecentTasks(familyId, 20),
      this.getRecentEvents(familyId, 15),
      this.getRecentSurveys(familyId, 10)
    ]);

    return {
      messages,
      tasks,
      events,
      surveys,
      timestamp: new Date(),
      familyId
    };
  }

  /**
   * Get current DNA snapshot for dashboard
   */
  async getCurrentDNASnapshot(familyId) {
    try {
      const evolution = this.evolutionHistory.get(familyId);

      if (!evolution) {
        // Initialize if not tracked yet
        await this.initializeFamilyDNABaseline(familyId);
        return this.evolutionHistory.get(familyId)?.baseline;
      }

      // Generate current snapshot
      const currentData = await this.gatherCurrentFamilyData(familyId);
      const currentDNA = await this.generateDNASequence(currentData);

      return {
        ...currentDNA,
        evolutionStage: evolution.currentStage,
        recentEvents: evolution.evolutionEvents.slice(-3),
        trackingActive: this.activeTrackers.has(familyId),
        lastAnalysis: evolution.lastAnalysis
      };
    } catch (error) {
      console.error('Error getting DNA snapshot:', error);
      return null;
    }
  }

  /**
   * Helper methods for pattern analysis
   */
  calculateAutonomyLevel(tasks) {
    if (!tasks.length) return 0.5;
    const selfAssigned = tasks.filter(t => t.assignedBy === t.assignedTo).length;
    return Math.min(selfAssigned / tasks.length, 1.0);
  }

  calculateCollaborationLevel(tasks) {
    if (!tasks.length) return 0.5;
    const collaborative = tasks.filter(t =>
      t.tags?.includes('collaboration') ||
      t.description?.toLowerCase().includes('together')
    ).length;
    return Math.min(collaborative / tasks.length, 1.0);
  }

  calculateDecisionSpeed(tasks) {
    if (!tasks.length) return 0.5;
    const avgDecisionTime = tasks.reduce((sum, task) => {
      const created = new Date(task.createdAt);
      const updated = new Date(task.updatedAt || task.createdAt);
      return sum + (updated - created);
    }, 0) / tasks.length;

    // Convert to 0-1 scale (faster = higher score)
    const maxTime = 24 * 60 * 60 * 1000; // 24 hours
    return Math.max(0, 1 - (avgDecisionTime / maxTime));
  }

  calculateConsensusLevel(tasks) {
    if (!tasks.length) return 0.5;
    // Estimate consensus based on task completion and minimal reassignments
    const completed = tasks.filter(t => t.status === 'done').length;
    return Math.min(completed / tasks.length, 1.0);
  }

  stringToNumeric(str) {
    const mappings = {
      'low': 0.2, 'minimal': 0.2, 'poor': 0.2,
      'medium': 0.5, 'moderate': 0.5, 'average': 0.5,
      'high': 0.8, 'strong': 0.8, 'excellent': 0.8,
      'direct': 0.7, 'supportive': 0.8, 'collaborative': 0.9,
      'neutral': 0.5, 'positive': 0.7, 'negative': 0.3
    };
    return mappings[str.toLowerCase()] || 0.5;
  }

  // Utility methods for data gathering
  async getRecentMessages(familyId, limit) {
    try {
      const q = query(
        collection(db, 'messages'),
        where('familyId', '==', familyId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting recent messages:', error);
      return [];
    }
  }

  async getRecentTasks(familyId, limit) {
    try {
      const q = query(
        collection(db, 'kanbanTasks'),
        where('familyId', '==', familyId),
        orderBy('createdAt', 'desc'),
        limit(limit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting recent tasks:', error);
      return [];
    }
  }

  async getRecentEvents(familyId, limit) {
    try {
      const q = query(
        collection(db, 'events'),
        where('familyId', '==', familyId),
        orderBy('startTime', 'desc'),
        limit(limit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting recent events:', error);
      return [];
    }
  }

  async getRecentSurveys(familyId, limit) {
    try {
      const q = query(
        collection(db, 'surveyResponses'),
        where('familyId', '==', familyId),
        orderBy('timestamp', 'desc'),
        limit(limit)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting recent surveys:', error);
      return [];
    }
  }

  async gatherRecentActivity(familyId, minutes) {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    const [messages, tasks, events] = await Promise.all([
      this.getActivitySince(familyId, 'messages', since),
      this.getActivitySince(familyId, 'kanbanTasks', since),
      this.getActivitySince(familyId, 'events', since)
    ]);

    return {
      hasActivity: messages.length > 0 || tasks.length > 0 || events.length > 0,
      messages,
      tasks,
      events,
      timestamp: new Date()
    };
  }

  async getActivitySince(familyId, collectionName, since) {
    try {
      const timeField = collectionName === 'messages' ? 'timestamp' :
                       collectionName === 'kanbanTasks' ? 'updatedAt' : 'startTime';

      const q = query(
        collection(db, collectionName),
        where('familyId', '==', familyId),
        where(timeField, '>=', since)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error getting ${collectionName} activity:`, error);
      return [];
    }
  }

  async detectImmediatePatternShifts(familyId, recentData) {
    // Look for sudden changes in communication, decision making, etc.
    // This would implement immediate pattern detection logic
    console.log(`🔍 Detecting immediate pattern shifts for ${familyId}`);
  }
}

// Export singleton instance and class
export const familyDNATracker = new RealTimeFamilyDNATracker();
export default familyDNATracker;