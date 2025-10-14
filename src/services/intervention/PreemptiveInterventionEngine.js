// src/services/intervention/PreemptiveInterventionEngine.js
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
import { AdvancedHarmonyPredictionEngine } from '../harmony/AdvancedHarmonyPredictionEngine.js';
import { familyDNATracker } from '../dna/RealTimeFamilyDNATracker.js';
import ClaudeService from '../ClaudeService.js';

/**
 * Preemptive Intervention Engine
 *
 * Prevents family stress cascades before they happen through:
 * 1. Real-time stress pattern detection
 * 2. 5-second micro-survey interventions
 * 3. Intelligent task redistribution
 * 4. Proactive harmony optimization
 */
export class PreemptiveInterventionEngine {
  constructor() {
    this.powerKG = new PowerFeaturesKnowledgeGraphIntegration();
    this.harmonyEngine = new AdvancedHarmonyPredictionEngine();

    // Active monitoring state
    this.activeMonitoring = new Map(); // familyId -> monitoring config
    this.interventionQueue = new Map(); // familyId -> pending interventions
    this.recentInterventions = new Map(); // familyId -> recent intervention history

    // Intervention thresholds and timing
    this.stressThresholds = {
      critical: 0.85,    // Immediate intervention required
      high: 0.70,        // Quick intervention needed
      elevated: 0.55,    // Gentle intervention suggested
      baseline: 0.40     // Normal monitoring
    };

    // Micro-survey response time goals
    this.responseTimeTargets = {
      critical: 5000,    // 5 seconds - crisis prevention
      high: 15000,       // 15 seconds - stress relief
      elevated: 60000,   // 1 minute - gentle nudge
      baseline: 300000   // 5 minutes - routine check
    };

    // Intervention types and their effectiveness
    this.interventionTypes = {
      micro_survey: {
        effectiveness: 0.8,
        responseTime: 5000,
        cooldown: 300000 // 5 minutes between micro-surveys
      },
      task_redistribution: {
        effectiveness: 0.9,
        responseTime: 10000,
        cooldown: 600000 // 10 minutes between redistributions
      },
      stress_relief: {
        effectiveness: 0.7,
        responseTime: 30000,
        cooldown: 900000 // 15 minutes between stress relief
      },
      communication_prompt: {
        effectiveness: 0.6,
        responseTime: 60000,
        cooldown: 1800000 // 30 minutes between prompts
      }
    };
  }

  /**
   * Start preemptive monitoring for a family
   */
  async startPreemptiveMonitoring(familyId, options = {}) {
    try {
      console.log(`🛡️ Starting preemptive intervention monitoring for family: ${familyId}`);

      // Initialize monitoring configuration
      const monitoringConfig = {
        familyId,
        startTime: new Date(),
        sensitivity: options.sensitivity || 'balanced', // strict, balanced, relaxed
        interventionTypes: options.enabledInterventions || ['micro_survey', 'task_redistribution', 'stress_relief'],
        monitoringFrequency: options.frequency || 60000, // Check every minute
        active: true
      };

      // Set up real-time listeners
      const listeners = await this.setupRealTimeListeners(familyId, monitoringConfig);

      // Start prediction engine integration
      await this.harmonyEngine.startRealTimeMonitoring(familyId);

      // Store monitoring config
      this.activeMonitoring.set(familyId, {
        ...monitoringConfig,
        listeners,
        lastCheck: new Date(),
        interventionCount: 0,
        preventedCrises: 0
      });

      // Initialize intervention tracking
      this.interventionQueue.set(familyId, []);
      this.recentInterventions.set(familyId, []);

      // Start monitoring cycle
      this.startMonitoringCycle(familyId);

      return { success: true, monitoring: 'active' };
    } catch (error) {
      console.error('Error starting preemptive monitoring:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Setup real-time listeners for stress indicators
   */
  async setupRealTimeListeners(familyId, config) {
    const listeners = [];

    // Listen for message sentiment changes
    const messagesListener = onSnapshot(
      query(
        collection(db, 'messages'),
        where('familyId', '==', familyId),
        orderBy('timestamp', 'desc'),
        limit(10)
      ),
      (snapshot) => {
        if (!snapshot.empty) {
          this.analyzeMessageSentiment(familyId, snapshot.docs.map(doc => doc.data()));
        }
      }
    );
    listeners.push(messagesListener);

    // Listen for task overload indicators
    const tasksListener = onSnapshot(
      query(
        collection(db, 'kanbanTasks'),
        where('familyId', '==', familyId),
        where('status', '!=', 'done'),
        orderBy('createdAt', 'desc')
      ),
      (snapshot) => {
        if (!snapshot.empty) {
          this.analyzeTaskLoad(familyId, snapshot.docs.map(doc => doc.data()));
        }
      }
    );
    listeners.push(tasksListener);

    // Listen for calendar pressure
    const eventsListener = onSnapshot(
      query(
        collection(db, 'events'),
        where('familyId', '==', familyId),
        where('startTime', '>=', new Date()),
        orderBy('startTime', 'asc'),
        limit(20)
      ),
      (snapshot) => {
        if (!snapshot.empty) {
          this.analyzeCalendarPressure(familyId, snapshot.docs.map(doc => doc.data()));
        }
      }
    );
    listeners.push(eventsListener);

    return listeners;
  }

  /**
   * Start monitoring cycle for continuous assessment
   */
  startMonitoringCycle(familyId) {
    const config = this.activeMonitoring.get(familyId);
    if (!config) return;

    const monitoringInterval = setInterval(async () => {
      if (!this.activeMonitoring.has(familyId)) {
        clearInterval(monitoringInterval);
        return;
      }

      await this.runPreventionCycle(familyId);
    }, config.monitoringFrequency);

    // Store interval reference for cleanup
    config.monitoringInterval = monitoringInterval;
  }

  /**
   * Main prevention cycle - assesses and intervenes
   */
  async runPreventionCycle(familyId) {
    try {
      const config = this.activeMonitoring.get(familyId);
      if (!config || !config.active) return;

      // 1. Get current stress assessment from harmony engine
      const currentPrediction = await this.harmonyEngine.runPredictionCycle(familyId);

      // 2. Analyze immediate stress indicators
      const stressIndicators = await this.analyzeCurrentStressState(familyId);

      // 3. Calculate intervention urgency
      const urgency = this.calculateInterventionUrgency(currentPrediction, stressIndicators);

      // 4. Determine if intervention is needed
      if (urgency.level !== 'baseline') {
        await this.executePreventiveIntervention(familyId, urgency, stressIndicators);
      }

      // 5. Update monitoring stats
      config.lastCheck = new Date();

      console.log(`🔍 Prevention cycle completed for ${familyId}: ${urgency.level} urgency`);

    } catch (error) {
      console.error('Error in prevention cycle:', error);
    }
  }

  /**
   * Analyze current family stress state
   */
  async analyzeCurrentStressState(familyId) {
    try {
      // Get recent family activity
      const [messages, tasks, events] = await Promise.all([
        this.getRecentMessages(familyId, 15),
        this.getActiveTasks(familyId),
        this.getUpcomingEvents(familyId, 7) // Next 7 days
      ]);

      // Analyze stress indicators
      const indicators = {
        communicationStress: await this.analyzeCommunicationStress(messages),
        taskOverload: await this.analyzeTaskOverload(tasks),
        timePreasure: await this.analyzeTimePressure(events),
        emotionalTension: await this.analyzeEmotionalTension(messages),
        timestamp: new Date()
      };

      // Calculate overall stress score
      indicators.overallStress = this.calculateOverallStress(indicators);

      return indicators;
    } catch (error) {
      console.error('Error analyzing stress state:', error);
      return { overallStress: 0.3, timestamp: new Date() }; // Safe default
    }
  }

  /**
   * Calculate intervention urgency based on multiple factors
   */
  calculateInterventionUrgency(prediction, stressIndicators) {
    // Combine harmony prediction with real-time stress indicators
    const harmonyRisk = prediction?.cascadeRisk?.immediate || 0;
    const stressLevel = stressIndicators.overallStress || 0;

    // Weight recent intervention history
    const recentInterventions = this.recentInterventions.get(prediction.familyId) || [];
    const recentInterventionCount = recentInterventions.filter(
      i => Date.now() - new Date(i.timestamp).getTime() < 3600000 // Last hour
    ).length;

    // Reduce urgency if too many recent interventions
    const interventionFatigue = Math.max(0, recentInterventionCount - 2) * 0.1;

    // Calculate combined urgency score
    const urgencyScore = Math.max(0, (harmonyRisk * 0.6 + stressLevel * 0.4) - interventionFatigue);

    // Determine urgency level
    let level = 'baseline';
    if (urgencyScore >= this.stressThresholds.critical) level = 'critical';
    else if (urgencyScore >= this.stressThresholds.high) level = 'high';
    else if (urgencyScore >= this.stressThresholds.elevated) level = 'elevated';

    return {
      level,
      score: urgencyScore,
      factors: {
        harmonyRisk,
        stressLevel,
        interventionFatigue,
        recentInterventions: recentInterventionCount
      },
      recommendation: this.getInterventionRecommendation(level, stressIndicators)
    };
  }

  /**
   * Execute preventive intervention based on urgency
   */
  async executePreventiveIntervention(familyId, urgency, stressIndicators) {
    try {
      console.log(`🚨 Executing ${urgency.level} intervention for family ${familyId}`);

      // Select best intervention type
      const interventionType = this.selectOptimalIntervention(urgency, stressIndicators);

      // Check cooldown periods
      if (!this.isInterventionReady(familyId, interventionType)) {
        console.log(`⏳ Intervention ${interventionType} on cooldown for ${familyId}`);
        return;
      }

      // Generate intervention
      const intervention = await this.generateIntervention(familyId, interventionType, urgency, stressIndicators);

      // Queue for immediate delivery
      await this.queueIntervention(familyId, intervention);

      // Execute intervention
      await this.deliverIntervention(familyId, intervention);

      // Record intervention
      await this.recordIntervention(familyId, intervention, urgency);

      return { success: true, intervention };
    } catch (error) {
      console.error('Error executing intervention:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Select optimal intervention type for situation
   */
  selectOptimalIntervention(urgency, stressIndicators) {
    const { level } = urgency;
    const { communicationStress, taskOverload, timePreasure, emotionalTension } = stressIndicators;

    // Critical situations need immediate micro-surveys
    if (level === 'critical') {
      if (taskOverload > 0.8) return 'task_redistribution';
      if (emotionalTension > 0.7) return 'micro_survey';
      return 'stress_relief';
    }

    // High stress situations
    if (level === 'high') {
      if (taskOverload > 0.6 && timePreasure > 0.6) return 'task_redistribution';
      if (communicationStress > 0.7) return 'communication_prompt';
      return 'micro_survey';
    }

    // Elevated stress - gentle interventions
    if (level === 'elevated') {
      if (taskOverload > 0.5) return 'task_redistribution';
      if (communicationStress > 0.5) return 'communication_prompt';
      return 'stress_relief';
    }

    return 'micro_survey'; // Default
  }

  /**
   * Generate contextual intervention using Claude
   */
  async generateIntervention(familyId, type, urgency, stressIndicators) {
    try {
      const interventionContext = {
        familyId,
        type,
        urgency: urgency.level,
        urgencyScore: urgency.score,
        stressIndicators,
        timestamp: new Date(),
        targetResponseTime: this.responseTimeTargets[urgency.level]
      };

      const prompt = this.getInterventionPrompt(type);

      const generatedIntervention = await ClaudeService.generate({
        prompt,
        context: interventionContext,
        mode: 'intervention_generation',
        temperature: 0.6
      });

      return {
        id: `intervention_${Date.now()}`,
        type,
        urgency: urgency.level,
        urgencyScore: urgency.score,
        context: interventionContext,
        content: generatedIntervention,
        targetResponseTime: this.responseTimeTargets[urgency.level],
        createdAt: new Date(),
        status: 'pending'
      };
    } catch (error) {
      console.error('Error generating intervention:', error);
      // Fallback to template intervention
      return this.getFallbackIntervention(familyId, type, urgency);
    }
  }

  /**
   * Deliver intervention to family
   */
  async deliverIntervention(familyId, intervention) {
    try {
      // Store intervention in Firestore for UI pickup
      const interventionDoc = await addDoc(collection(db, 'activeInterventions'), {
        familyId,
        ...intervention,
        deliveredAt: serverTimestamp(),
        status: 'active'
      });

      // Trigger real-time UI notification
      window.dispatchEvent(new CustomEvent('preemptive-intervention', {
        detail: {
          familyId,
          intervention: {
            ...intervention,
            id: interventionDoc.id
          }
        }
      }));

      // Store in Quantum Knowledge Graph
      await this.powerKG.addNode(familyId, {
        type: 'quantum_intervention',
        subtype: intervention.type,
        metadata: {
          urgency: intervention.urgency,
          urgencyScore: intervention.urgencyScore,
          targetResponseTime: intervention.targetResponseTime,
          stressFactors: intervention.context.stressIndicators
        },
        timestamp: intervention.createdAt,
        connections: [
          { type: 'PREVENTS', targetType: 'quantum_stress_cascade' }
        ]
      });

      console.log(`✅ Intervention delivered: ${intervention.type} for family ${familyId}`);
      return { success: true, interventionId: interventionDoc.id };
    } catch (error) {
      console.error('Error delivering intervention:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Micro-survey specific generation
   */
  async generateMicroSurvey(familyId, urgency, stressIndicators) {
    const { taskOverload, emotionalTension, timePreasure } = stressIndicators;

    // Determine survey focus
    let focus = 'general_support';
    if (taskOverload > 0.7) focus = 'task_relief';
    else if (emotionalTension > 0.6) focus = 'emotional_support';
    else if (timePreasure > 0.6) focus = 'time_management';

    const surveyContext = {
      familyId,
      focus,
      urgency: urgency.level,
      targetTime: 5, // seconds
      stressFactors: stressIndicators
    };

    const survey = await ClaudeService.generate({
      prompt: this.getMicroSurveyPrompt(),
      context: surveyContext,
      mode: 'micro_survey_generation',
      temperature: 0.5
    });

    return {
      ...survey,
      type: 'micro_survey',
      focus,
      maxResponseTime: 5000,
      urgency: urgency.level
    };
  }

  /**
   * Stress analysis methods
   */
  async analyzeCommunicationStress(messages) {
    if (!messages.length) return 0.2;

    // Analyze recent message patterns for stress indicators
    const stressKeywords = ['stressed', 'overwhelmed', 'tired', 'frustrated', 'busy', 'crazy', 'help', 'urgent'];
    const totalMessages = messages.length;
    const stressMessages = messages.filter(msg =>
      stressKeywords.some(keyword =>
        msg.content?.toLowerCase().includes(keyword)
      )
    ).length;

    // Calculate communication frequency (too much or too little can indicate stress)
    const timeSpan = Date.now() - new Date(messages[messages.length - 1].timestamp).getTime();
    const messagesPerHour = (totalMessages / (timeSpan / 3600000));

    // Normal range is 1-5 messages per hour
    const frequencyStress = messagesPerHour > 8 ? 0.3 : messagesPerHour < 0.5 ? 0.2 : 0;

    const keywordStress = Math.min(stressMessages / totalMessages, 0.5);

    return Math.min(keywordStress + frequencyStress, 1.0);
  }

  async analyzeTaskOverload(tasks) {
    if (!tasks.length) return 0.1;

    const now = new Date();
    const overdueTasks = tasks.filter(task => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null;
      return dueDate && dueDate < now;
    });

    const urgentTasks = tasks.filter(task =>
      task.priority === 'high' || task.tags?.includes('urgent')
    );

    const memberTaskCounts = tasks.reduce((acc, task) => {
      const assignee = task.assignedTo || 'unassigned';
      acc[assignee] = (acc[assignee] || 0) + 1;
      return acc;
    }, {});

    // Calculate overload factors
    const overdueRatio = overdueTasks.length / tasks.length;
    const urgentRatio = urgentTasks.length / tasks.length;
    const maxTasksPerMember = Math.max(...Object.values(memberTaskCounts));
    const averageTasksPerMember = Object.values(memberTaskCounts).reduce((a, b) => a + b, 0) / Object.keys(memberTaskCounts).length;
    const taskImbalance = maxTasksPerMember > averageTasksPerMember * 2 ? 0.3 : 0;

    return Math.min(overdueRatio * 0.4 + urgentRatio * 0.3 + taskImbalance, 1.0);
  }

  async analyzeTimePressure(events) {
    if (!events.length) return 0.1;

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const eventsToday = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= now && eventDate <= next24Hours;
    });

    const eventsThisWeek = events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate >= now && eventDate <= next7Days;
    });

    // Calculate time pressure factors
    const dailyPressure = Math.min(eventsToday.length / 5, 1.0); // More than 5 events per day is high pressure
    const weeklyPressure = Math.min(eventsThisWeek.length / 20, 0.5); // More than 20 events per week adds pressure

    return Math.min(dailyPressure * 0.7 + weeklyPressure * 0.3, 1.0);
  }

  async analyzeEmotionalTension(messages) {
    if (!messages.length) return 0.2;

    // Look for emotional tension indicators
    const tensionKeywords = ['angry', 'upset', 'frustrated', 'annoyed', 'mad', 'disappointed', 'worried', 'anxious'];
    const positiveKeywords = ['happy', 'great', 'awesome', 'love', 'excited', 'good', 'thanks', 'appreciate'];

    const tensionMessages = messages.filter(msg =>
      tensionKeywords.some(keyword => msg.content?.toLowerCase().includes(keyword))
    ).length;

    const positiveMessages = messages.filter(msg =>
      positiveKeywords.some(keyword => msg.content?.toLowerCase().includes(keyword))
    ).length;

    const tensionRatio = tensionMessages / messages.length;
    const positiveRatio = positiveMessages / messages.length;

    // High tension, low positive = emotional tension
    return Math.min(tensionRatio * 0.8 - positiveRatio * 0.2, 1.0);
  }

  calculateOverallStress(indicators) {
    const weights = {
      communicationStress: 0.25,
      taskOverload: 0.30,
      timePreasure: 0.25,
      emotionalTension: 0.20
    };

    return Math.min(
      Object.keys(weights).reduce((total, key) => {
        return total + (indicators[key] || 0) * weights[key];
      }, 0),
      1.0
    );
  }

  /**
   * Intervention prompts
   */
  getInterventionPrompt(type) {
    const prompts = {
      micro_survey: `Generate a 5-second micro-survey for family stress intervention.

Requirements:
- Single question only
- 3 one-click response options
- Takes exactly 5 seconds to complete
- Directly addresses the stress situation
- Warm, supportive tone
- Immediately actionable

Context will include stress indicators and urgency level.

Output format:
{
  "question": "Brief, caring question",
  "options": [
    {"text": "Option 1", "action": "what_happens", "impact": "immediate_relief"},
    {"text": "Option 2", "action": "what_happens", "impact": "moderate_help"},
    {"text": "Option 3", "action": "what_happens", "impact": "gentle_support"}
  ],
  "explanation": "Why this intervention now",
  "followUp": "What happens after response"
}`,

      task_redistribution: `Generate intelligent task redistribution for stress relief.

Requirements:
- Identify overloaded family member
- Suggest specific tasks to redistribute
- Provide immediate relief options
- Consider family member availability
- Include rationale for changes

Output format:
{
  "overloadedMember": "member_id",
  "redistributions": [
    {
      "task": "task_description",
      "from": "current_assignee",
      "to": "suggested_assignee",
      "reason": "why_this_helps",
      "urgency": "how_soon"
    }
  ],
  "immediateActions": ["quick_relief_action_1", "quick_relief_action_2"],
  "explanation": "How this prevents stress cascade"
}`,

      stress_relief: `Generate immediate stress relief intervention.

Requirements:
- Provide instant stress reduction techniques
- Tailor to current family situation
- Include micro-break suggestions
- Focus on immediate relief (next 5-15 minutes)
- Consider time constraints

Output format:
{
  "immediateRelief": {
    "technique": "stress_relief_method",
    "duration": "time_needed",
    "instructions": "step_by_step"
  },
  "quickWins": ["easy_task_1", "easy_task_2"],
  "support": {
    "message": "encouraging_words",
    "resources": ["helpful_resource_1", "helpful_resource_2"]
  }
}`,

      communication_prompt: `Generate communication facilitation prompt.

Requirements:
- Encourage positive family communication
- Address communication stress indicators
- Provide conversation starters
- Foster understanding and connection
- Prevent miscommunication escalation

Output format:
{
  "prompt": {
    "situation": "current_communication_issue",
    "suggestion": "how_to_address_it",
    "script": "example_conversation_starter"
  },
  "techniques": ["communication_technique_1", "communication_technique_2"],
  "outcomes": "expected_improvement"
}`
    };

    return prompts[type] || prompts.micro_survey;
  }

  getMicroSurveyPrompt() {
    return `You are generating emergency micro-surveys for family crisis prevention.

This is critical: the survey must take exactly 5 seconds and prevent family stress from escalating.

REQUIREMENTS:
- ONE question only (< 15 words)
- THREE response options (each < 5 words)
- Addresses immediate stress situation
- Provides instant relief pathway
- Warm but urgent tone

RESPONSE FORMAT:
{
  "question": "Can I help with dinner prep?",
  "options": [
    {"text": "Yes please!", "action": "assign_help", "impact": "immediate_relief"},
    {"text": "Maybe later", "action": "schedule_help", "impact": "planned_support"},
    {"text": "I'm okay", "action": "gentle_check", "impact": "emotional_support"}
  ],
  "timeEstimate": "5 seconds",
  "purpose": "Prevent dinner stress cascade"
}

Remember: This could prevent a family argument. Make it count.`;
  }

  /**
   * Utility methods
   */
  isInterventionReady(familyId, type) {
    const recent = this.recentInterventions.get(familyId) || [];
    const lastIntervention = recent.find(i => i.type === type);

    if (!lastIntervention) return true;

    const cooldownPeriod = this.interventionTypes[type].cooldown;
    const timeSinceLastIntervention = Date.now() - new Date(lastIntervention.timestamp).getTime();

    return timeSinceLastIntervention >= cooldownPeriod;
  }

  async queueIntervention(familyId, intervention) {
    const queue = this.interventionQueue.get(familyId) || [];
    queue.push(intervention);
    this.interventionQueue.set(familyId, queue);
  }

  async recordIntervention(familyId, intervention, urgency) {
    const recent = this.recentInterventions.get(familyId) || [];
    recent.push({
      ...intervention,
      urgency,
      timestamp: new Date()
    });

    // Keep only last 20 interventions
    this.recentInterventions.set(familyId, recent.slice(-20));

    // Update monitoring stats
    const config = this.activeMonitoring.get(familyId);
    if (config) {
      config.interventionCount++;
      if (urgency.level === 'critical') {
        config.preventedCrises++;
      }
    }
  }

  getFallbackIntervention(familyId, type, urgency) {
    const fallbacks = {
      micro_survey: {
        question: "Can someone help with the current task?",
        options: [
          { text: "I can help", action: "offer_help", impact: "immediate_relief" },
          { text: "In 10 mins", action: "schedule_help", impact: "planned_support" },
          { text: "Later today", action: "defer_help", impact: "gentle_support" }
        ],
        timeEstimate: "5 seconds"
      },
      stress_relief: {
        technique: "Take 3 deep breaths",
        duration: "30 seconds",
        message: "You're doing great, this stress will pass"
      }
    };

    return {
      id: `fallback_${Date.now()}`,
      type,
      urgency: urgency.level,
      content: fallbacks[type] || fallbacks.micro_survey,
      fallback: true,
      createdAt: new Date()
    };
  }

  getInterventionRecommendation(level, indicators) {
    const recommendations = {
      critical: "Immediate intervention required - high risk of family conflict",
      high: "Quick intervention needed - stress levels approaching crisis",
      elevated: "Gentle intervention suggested - early stress indicators detected",
      baseline: "Continue monitoring - normal stress levels"
    };
    return recommendations[level];
  }

  /**
   * Data retrieval helpers
   */
  async getRecentMessages(familyId, limit = 10) {
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

  async getActiveTasks(familyId) {
    try {
      const q = query(
        collection(db, 'kanbanTasks'),
        where('familyId', '==', familyId),
        where('status', '!=', 'done')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting active tasks:', error);
      return [];
    }
  }

  async getUpcomingEvents(familyId, days = 7) {
    try {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + days * 24 * 60 * 60 * 1000);

      const q = query(
        collection(db, 'events'),
        where('familyId', '==', familyId),
        where('startTime', '>=', startTime),
        where('startTime', '<=', endTime),
        orderBy('startTime', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  }

  /**
   * Stop monitoring for a family
   */
  stopPreemptiveMonitoring(familyId) {
    const config = this.activeMonitoring.get(familyId);
    if (config) {
      // Clean up listeners
      config.listeners?.forEach(listener => listener());

      // Clear monitoring interval
      if (config.monitoringInterval) {
        clearInterval(config.monitoringInterval);
      }

      // Remove from active monitoring
      this.activeMonitoring.delete(familyId);
      this.interventionQueue.delete(familyId);

      console.log(`🛑 Preemptive monitoring stopped for family ${familyId}`);
    }
  }

  /**
   * Get monitoring status for dashboard
   */
  getMonitoringStatus(familyId) {
    const config = this.activeMonitoring.get(familyId);
    const recent = this.recentInterventions.get(familyId) || [];

    if (!config) {
      return {
        active: false,
        interventionCount: 0,
        preventedCrises: 0,
        lastIntervention: null
      };
    }

    return {
      active: config.active,
      startTime: config.startTime,
      interventionCount: config.interventionCount || 0,
      preventedCrises: config.preventedCrises || 0,
      lastIntervention: recent[recent.length - 1] || null,
      lastCheck: config.lastCheck,
      monitoringFrequency: config.monitoringFrequency
    };
  }
}

// Export singleton instance and class
export const preemptiveInterventionEngine = new PreemptiveInterventionEngine();
export default preemptiveInterventionEngine;