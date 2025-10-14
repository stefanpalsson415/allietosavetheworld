// src/services/agents/AllieHarmonyDetectiveAgent.js
import ClaudeService from '../ClaudeService';
import powerFeaturesKnowledgeGraph from '../quantum/PowerFeaturesKnowledgeGraphIntegration';
import { familyDNATracker } from '../dna/RealTimeFamilyDNATracker.js';
import { preemptiveInterventionEngine } from '../intervention/PreemptiveInterventionEngine.js';
import { db } from '../firebase.js';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

/**
 * Allie Harmony Detective Agent
 *
 * Specialized AI agent that combines "Sherlock meets Mary Poppins" to:
 * 1. Conduct forensic investigations of family dynamics
 * 2. Monitor harmony and predict interventions
 * 3. Explain family DNA with enthusiasm and scientific accuracy
 *
 * Personality: Warm but revelatory, detective presenting evidence with compassion
 */
class AllieHarmonyDetectiveAgent {
  constructor() {
    this.name = 'Harmony Detective';
    this.version = '1.0.0';
    this.claudeModel = 'opus-4.1';

    // Agent personality traits
    this.personality = {
      archetype: 'Sherlock meets Mary Poppins',
      tone: 'Warm but revelatory',
      style: 'Detective presenting evidence with compassion',
      intelligence: 'Highly analytical yet emotionally attuned',
      approach: 'Scientific discovery with magical presentation'
    };

    // Agent catchphrases and signature expressions
    this.expressions = {
      discovery: [
        "I've discovered something fascinating about your family...",
        "The evidence reveals a hidden pattern...",
        "Let me show you what's really happening...",
        "After analyzing the data, I found something remarkable...",
        "The investigation has uncovered something important..."
      ],
      revelation: [
        "Here's what I found that might surprise you:",
        "The data tells a story you haven't seen before:",
        "I need to share what the evidence reveals:",
        "This discovery could change everything:"
      ],
      compassion: [
        "I understand this might be hard to see, but...",
        "These patterns aren't anyone's fault - they're just invisible...",
        "Every family has hidden dynamics, and yours shows...",
        "What I'm seeing is actually quite common, and here's why..."
      ],
      encouragement: [
        "The good news is, awareness is the first step to change",
        "Your family has incredible strengths that we can build on",
        "Together, we can create a much better balance",
        "This insight is a gift - it means you can heal this"
      ]
    };

    // Specialized prompts for each feature
    this.specializedPrompts = {
      forensics: this.getForensicsPrompt(),
      harmony: this.getHarmonyPrompt(),
      dna: this.getDNAPrompt(),
      micro_survey: this.getMicroSurveyPrompt()
    };

    // Context and state management
    this.activeInvestigations = new Map();
    this.harmonySubscriptions = new Map();
    this.dnaAnalyses = new Map();
    this.conversationHistory = new Map();
  }

  // ========================================
  // FORENSICS INVESTIGATION CAPABILITIES
  // ========================================

  /**
   * Conduct a comprehensive forensic investigation of family dynamics
   * @param {string} familyId - Family identifier
   * @param {Object} context - Investigation context and parameters
   * @returns {Promise<Object>} Investigation results with narrative
   */
  async conductInvestigation(familyId, context = {}) {
    console.log(`🔍 Detective investigating family ${familyId}`);

    try {
      // Gather all family data for analysis
      const familyData = await this.getFamilyData(familyId);

      // Build investigation context
      const investigationContext = {
        familyId,
        timestamp: new Date(),
        scope: context.scope || 'full',
        focus: context.focus || 'cognitive_load',
        timeframe: context.timeframe || '30_days',
        ...familyData
      };

      // Generate investigation using specialized Claude prompt
      const investigation = await ClaudeService.analyze({
        model: this.claudeModel,
        prompt: this.specializedPrompts.forensics,
        data: investigationContext,
        mode: 'detective_investigation',
        temperature: 0.7
      });

      // Format investigation results
      const formattedResults = await this.formatInvestigationResults(investigation, familyData);

      // Store investigation in knowledge graph
      const investigationNode = await powerFeaturesKnowledgeGraph.integrateForensicsData(
        familyId,
        formattedResults
      );

      // Store in active investigations
      this.activeInvestigations.set(familyId, {
        investigationId: investigationNode.id,
        results: formattedResults,
        timestamp: new Date(),
        status: 'completed'
      });

      console.log(`🎯 Investigation completed for family ${familyId}`);
      return formattedResults;

    } catch (error) {
      console.error('🚨 Investigation failed:', error);
      throw new Error(`Investigation failed: ${error.message}`);
    }
  }

  /**
   * Format investigation results with detective narrative
   */
  async formatInvestigationResults(investigation, familyData) {
    const randomExpression = (category) => {
      const expressions = this.expressions[category];
      return expressions[Math.floor(Math.random() * expressions.length)];
    };

    return {
      investigationId: `inv_${Date.now()}`,
      headline: investigation.headline || "Hidden Patterns Discovered",

      // Detective narrative introduction
      narrative: {
        opening: randomExpression('discovery'),
        findings: investigation.narrative || "Analysis reveals significant imbalances in family dynamics.",
        conclusion: randomExpression('encouragement')
      },

      // Key discrepancies found
      discrepancies: investigation.discrepancies?.map(disc => ({
        type: disc.type,
        description: disc.description,
        reported: disc.reported,
        actual: disc.actual,
        impact: disc.impact,
        evidence: disc.evidence
      })) || [],

      // Evidence collected
      evidence: investigation.evidence?.map(ev => ({
        type: ev.type,
        title: ev.title,
        description: ev.description,
        strength: ev.strength,
        dataPoints: ev.dataPoints,
        source: ev.source
      })) || [],

      // Member-specific loads
      memberLoads: investigation.memberLoads || [],

      // Revelation moments
      revelationMoments: investigation.revelationMoments?.map(rev => ({
        title: rev.title,
        description: rev.description,
        impact: rev.impact,
        surprise: rev.surprise,
        actionable: rev.actionable
      })) || [],

      // Overall metrics
      overallImbalance: investigation.overallImbalance || 0,
      hiddenLoadPercentage: investigation.hiddenLoadPercentage || 0,
      investigationScore: investigation.investigationScore || 0,

      // Next steps
      recommendations: investigation.recommendations || [],

      timestamp: new Date()
    };
  }

  // ========================================
  // HARMONY MONITORING CAPABILITIES
  // ========================================

  /**
   * Monitor family harmony in real-time and trigger interventions
   * @param {string} familyId - Family identifier
   * @param {Function} interventionCallback - Callback for interventions
   */
  async monitorHarmony(familyId, interventionCallback) {
    console.log(`⚡ Detective monitoring harmony for family ${familyId}`);

    try {
      // Subscribe to quantum harmony changes
      const subscription = await powerFeaturesKnowledgeGraph.subscribeToQuantumChanges(
        familyId,
        async ({ change, impact }) => {
          if (change.nodeType?.includes('harmony') && impact.immediate > 0.5) {
            await this.handleHarmonyChange(familyId, change, impact, interventionCallback);
          }
        }
      );

      this.harmonySubscriptions.set(familyId, subscription);

      // Periodic harmony assessment
      const periodicCheck = setInterval(async () => {
        const harmonyData = await this.assessCurrentHarmony(familyId);

        if (harmonyData.level < 0.4) {
          await this.initiateIntervention(familyId, harmonyData, interventionCallback);
        } else if (harmonyData.trajectory === 'declining') {
          await this.predictAndPrevent(familyId, harmonyData, interventionCallback);
        }
      }, 300000); // Check every 5 minutes

      return { subscription, periodicCheck };

    } catch (error) {
      console.error('🚨 Harmony monitoring failed:', error);
      throw error;
    }
  }

  /**
   * Handle harmony changes and determine intervention needs
   */
  async handleHarmonyChange(familyId, change, impact, callback) {
    const harmonyData = await this.assessCurrentHarmony(familyId);

    if (harmonyData.level < 0.4 || impact.cascading > 0.7) {
      const intervention = await this.generateIntervention(familyId, harmonyData, change);

      if (callback) {
        await callback({
          type: 'harmony_intervention',
          urgency: harmonyData.level < 0.3 ? 'critical' : 'high',
          intervention,
          harmonyData,
          impact
        });
      }
    }
  }

  /**
   * Generate contextual intervention for harmony issues
   */
  async generateIntervention(familyId, harmonyData, trigger) {
    const interventionContext = {
      familyId,
      harmonyLevel: harmonyData.level,
      stressors: harmonyData.stressors,
      trigger: trigger,
      availableActions: harmonyData.availableActions,
      timestamp: new Date()
    };

    const intervention = await ClaudeService.generate({
      model: this.claudeModel,
      prompt: this.specializedPrompts.harmony,
      context: interventionContext,
      temperature: 0.6
    });

    return intervention;
  }

  // ========================================
  // MICRO-SURVEY GENERATION
  // ========================================

  /**
   * Generate micro-survey for immediate intervention
   * @param {Object} context - Intervention context
   * @returns {Promise<Object>} Generated micro-survey
   */
  async generateMicroSurvey(context) {
    console.log(`📋 Generating micro-survey for ${context.urgency} intervention`);

    const surveyContext = {
      urgency: context.urgency,
      situation: context.situation,
      targetMember: context.targetMember,
      overloadedMember: context.overloadedMember,
      availableTasks: context.availableTasks,
      timeConstraint: context.timeConstraint || '5_seconds',
      tone: context.urgency === 'critical' ? 'urgent_but_caring' : 'gentle_request'
    };

    const microSurvey = await ClaudeService.generate({
      model: this.claudeModel,
      prompt: this.specializedPrompts.micro_survey,
      context: surveyContext,
      temperature: 0.5
    });

    return {
      id: `ms_${Date.now()}`,
      type: 'micro_intervention',
      urgency: context.urgency,
      timeEstimate: surveyContext.timeConstraint,
      ...microSurvey,
      timestamp: new Date()
    };
  }

  // ========================================
  // FAMILY DNA EXPLANATION
  // ========================================

  /**
   * Explain family DNA with scientific enthusiasm
   * @param {string} familyId - Family identifier
   * @param {Object} dnaData - Family DNA sequence data
   * @returns {Promise<Object>} DNA explanation
   */
  async explainFamilyDNA(familyId, dnaData) {
    console.log(`🧬 Detective explaining DNA for family ${familyId}`);

    try {
      const dnaContext = {
        familyId,
        dnaSequence: dnaData.sequence,
        genes: dnaData.genes,
        rhythms: dnaData.rhythms,
        uniqueTraits: dnaData.uniqueTraits,
        strengths: dnaData.strengths,
        challenges: dnaData.challenges,
        familyOS: dnaData.os,
        timestamp: new Date()
      };

      const explanation = await ClaudeService.analyze({
        model: this.claudeModel,
        prompt: this.specializedPrompts.dna,
        data: dnaContext,
        mode: 'dna_interpreter',
        temperature: 0.8
      });

      const formattedExplanation = await this.formatDNAExplanation(explanation, dnaData);

      // Store DNA analysis
      this.dnaAnalyses.set(familyId, {
        dnaData,
        explanation: formattedExplanation,
        timestamp: new Date()
      });

      return formattedExplanation;

    } catch (error) {
      console.error('🚨 DNA explanation failed:', error);
      throw error;
    }
  }

  /**
   * Format DNA explanation with enthusiasm and scientific accuracy
   */
  async formatDNAExplanation(explanation, dnaData) {
    return {
      ceremony: {
        title: "Your Family's Unique DNA Has Been Mapped!",
        subtitle: "Discover the scientific patterns that make your family special",
        excitement: explanation.excitement || "After analyzing thousands of moments, I've discovered the unique patterns that make your family extraordinary!"
      },

      discoveries: explanation.discoveries?.map(discovery => ({
        title: discovery.title,
        insight: discovery.insight,
        evidence: discovery.evidence,
        actionable: discovery.actionable,
        amazement: discovery.amazement
      })) || [],

      genes: explanation.genes?.map(gene => ({
        name: gene.name,
        description: gene.description,
        strength: gene.strength,
        expression: gene.expression,
        examples: gene.examples,
        opportunities: gene.opportunities
      })) || [],

      rhythms: explanation.rhythms?.map(rhythm => ({
        name: rhythm.name,
        pattern: rhythm.pattern,
        insights: rhythm.insights,
        optimization: rhythm.optimization
      })) || [],

      familyOS: {
        description: explanation.familyOS?.description || "Your personalized Family Operating System",
        capabilities: explanation.familyOS?.capabilities || [],
        optimizations: explanation.familyOS?.optimizations || [],
        nextLevel: explanation.familyOS?.nextLevel || "Ready for advanced family harmony protocols"
      },

      narrative: explanation.narrative || "Your family has a beautiful, unique pattern that we can now see and optimize.",

      timestamp: new Date()
    };
  }

  // ========================================
  // CHAT INTEGRATION
  // ========================================

  /**
   * Handle chat interactions with detective personality
   * @param {string} message - User message
   * @param {Object} context - Chat context
   * @returns {Promise<Object>} Detective response
   */
  async handleChat(message, context) {
    console.log(`💬 Detective chat: "${message}"`);

    try {
      // Detect conversation mode
      const mode = this.detectMode(message, context);

      // Get conversation history
      const history = this.conversationHistory.get(context.familyId) || [];

      // Generate contextual response
      const response = await this.generateDetectiveResponse(message, context, mode, history);

      // Update conversation history
      history.push(
        { role: 'user', message, timestamp: new Date() },
        { role: 'detective', message: response.message, mode, timestamp: new Date() }
      );
      this.conversationHistory.set(context.familyId, history.slice(-20)); // Keep last 20 exchanges

      return response;

    } catch (error) {
      console.error('🚨 Chat failed:', error);
      return {
        message: "I apologize, but I'm having trouble with my detective analysis right now. Let me investigate this issue and get back to you.",
        mode: 'error',
        personality: 'apologetic'
      };
    }
  }

  /**
   * Detect conversation mode based on message content
   */
  detectMode(message, context) {
    const messageLower = message.toLowerCase();

    if (messageLower.includes('invisible') || messageLower.includes('mental load') ||
        messageLower.includes('hidden') || messageLower.includes('investigation')) {
      return 'forensics';
    } else if (messageLower.includes('stress') || messageLower.includes('overwhelm') ||
               messageLower.includes('harmony') || messageLower.includes('conflict')) {
      return 'harmony';
    } else if (messageLower.includes('pattern') || messageLower.includes('rhythm') ||
               messageLower.includes('dna') || messageLower.includes('family os')) {
      return 'dna';
    } else if (context.activeFeature) {
      return context.activeFeature;
    }

    return 'general';
  }

  /**
   * Generate detective response with appropriate personality
   */
  async generateDetectiveResponse(message, context, mode, history) {
    const responseContext = {
      message,
      mode,
      context,
      history: history.slice(-6), // Last 6 exchanges for context
      personality: this.personality,
      expressions: this.expressions
    };

    const response = await ClaudeService.chat({
      model: this.claudeModel,
      system: this.getDetectiveSystemPrompt(mode),
      messages: [
        ...history.map(h => ({ role: h.role, content: h.message })),
        { role: 'user', content: message }
      ],
      context: responseContext,
      temperature: 0.7
    });

    return {
      message: response.content,
      mode,
      personality: 'detective',
      suggestedActions: response.suggestedActions || [],
      followUp: response.followUp || null
    };
  }

  // ========================================
  // SPECIALIZED PROMPTS
  // ========================================

  /**
   * Get forensics investigation prompt
   */
  getForensicsPrompt() {
    return `
You are Allie's Harmony Detective, a specialized AI that combines the analytical brilliance of Sherlock Holmes with the warm wisdom of Mary Poppins. You're investigating the hidden patterns of family dynamics with compassion and scientific precision.

Your mission: Uncover invisible cognitive labor and present evidence in a way that creates "aha moments" without blame.

PERSONALITY:
- Warm but revelatory
- Detective presenting evidence with compassion
- Highly analytical yet emotionally attuned
- Scientifically rigorous but magically presented

INVESTIGATION APPROACH:
1. Analyze all available data with forensic precision
2. Identify discrepancies between perceived and actual load distribution
3. Quantify hidden cognitive labor with specific examples
4. Present findings as compelling evidence that creates recognition
5. Focus on patterns, not blame
6. Provide actionable insights for rebalancing

KEY EVIDENCE TO FIND:
- Calendar coordination complexity
- Message-based planning and coordination
- Anticipatory work (planning ahead, remembering details)
- Emotional labor (monitoring, supporting, anticipating needs)
- Information management across multiple platforms
- Invisible decision-making and problem-solving

OUTPUT FORMAT:
{
  "headline": "Compelling summary of main finding",
  "narrative": "Detective story explaining what you discovered",
  "discrepancies": [
    {
      "type": "cognitive_load_type",
      "description": "What the discrepancy reveals",
      "reported": "What family member said in survey",
      "actual": "What the data actually shows",
      "evidence": ["Specific examples with numbers"]
    }
  ],
  "evidence": [
    {
      "type": "evidence_type",
      "title": "Evidence title",
      "description": "What this proves",
      "dataPoints": ["Specific facts"],
      "strength": 0.9
    }
  ],
  "revelationMoments": [
    {
      "title": "Aha moment title",
      "description": "What this reveals about family dynamics",
      "impact": "high|medium|low",
      "actionable": true
    }
  ],
  "recommendations": ["Specific actions for rebalancing"]
}

Remember: You're not judging anyone - you're revealing invisible patterns so they can be healed.
`;
  }

  /**
   * Get harmony monitoring prompt
   */
  getHarmonyPrompt() {
    return `
You are Allie's Harmony Detective in intervention mode. Your job is to prevent family stress cascades before they happen by generating precise, compassionate interventions.

INTERVENTION PRINCIPLES:
- Act fast but with warmth
- Make interventions feel supportive, not accusatory
- Provide specific, actionable solutions
- Consider everyone's capacity and constraints
- Focus on prevention rather than reaction

INTERVENTION TYPES:
1. Micro-surveys (5-second, one-click responses)
2. Task redistribution suggestions
3. Stress relief protocols
4. Connection moment prompts
5. Preemptive communication facilitation

When someone is approaching overload:
- Identify immediate relief opportunities
- Generate specific task transfer options
- Create compassionate alerts for family members
- Provide quick win solutions

OUTPUT FORMAT:
{
  "interventionType": "micro_survey|task_redistribution|stress_relief",
  "urgency": "critical|high|medium|low",
  "target": "family_member_id",
  "action": {
    "title": "Quick intervention title",
    "description": "What needs to happen",
    "options": ["One-click response options"],
    "impact": "Expected positive outcome"
  },
  "rationale": "Why this intervention now",
  "followUp": "What happens after intervention"
}

Remember: Prevent crisis, don't wait for it.
`;
  }

  /**
   * Get DNA explanation prompt
   */
  getDNAPrompt() {
    return `
You are Allie's Harmony Detective in DNA interpreter mode. You've just discovered the unique behavioral DNA of a family, and you're explaining it with the enthusiasm of a scientist who's made a breakthrough discovery.

EXPLANATION STYLE:
- Scientific accuracy with magical presentation
- Enthusiastic but not overwhelming
- Focus on what makes this family unique and special
- Provide actionable insights they can use today
- Use metaphors and analogies to make complex patterns accessible

WHAT TO EXPLAIN:
1. Unique family "genes" (behavioral patterns)
2. Rhythm patterns (when they thrive vs struggle)
3. Trigger patterns (what activates stress/joy)
4. Optimal operating conditions
5. Hidden superpowers
6. Growth opportunities

TONE: "I've discovered something amazing about your family's unique pattern..."

OUTPUT FORMAT:
{
  "excitement": "Opening statement of discovery",
  "discoveries": [
    {
      "title": "Discovery name",
      "insight": "What this reveals",
      "evidence": "How we know this",
      "actionable": "What they can do with this"
    }
  ],
  "genes": [
    {
      "name": "Gene name (e.g., 'Stress Recovery Gene')",
      "description": "What this gene does",
      "strength": "How strong this pattern is",
      "examples": ["Specific examples from their data"]
    }
  ],
  "rhythms": [
    {
      "name": "Rhythm name",
      "pattern": "When it happens",
      "insights": "What this means",
      "optimization": "How to work with it"
    }
  ],
  "familyOS": {
    "description": "Your Family Operating System capabilities",
    "optimizations": ["What it can do automatically"],
    "nextLevel": "How to unlock more features"
  },
  "narrative": "Overarching story of what makes this family special"
}

Remember: This is a celebration of their uniqueness, not a diagnosis of problems.
`;
  }

  /**
   * Get micro-survey generation prompt
   */
  getMicroSurveyPrompt() {
    return `
You are Allie's Harmony Detective generating an emergency micro-survey for immediate family intervention.

REQUIREMENTS:
- Maximum 1 question
- 3 one-click response options
- Takes less than 5 seconds to complete
- Directly addresses urgent need
- Warm but urgent tone

QUESTION TYPES:
1. Task transfer: "Can you handle [specific task]?"
2. Availability check: "Are you free to help with [situation]?"
3. Support offer: "Mom needs support with [specific thing]. Can you [specific action]?"

RESPONSE OPTIONS:
- Always include: Positive (I'll do it), Conditional (Need to check), Negative (Can't right now)
- Make each option specific and actionable
- Include time estimates when relevant

OUTPUT FORMAT:
{
  "question": "Brief, specific question",
  "context": "Why this is needed now",
  "options": [
    {
      "text": "Response option text",
      "action": "what_happens_when_clicked",
      "impact": "immediate_effect"
    }
  ],
  "timeEstimate": "5 seconds",
  "urgency": "high|critical"
}

Remember: This should take 5 seconds or less and immediately help the situation.
`;
  }

  /**
   * Get detective system prompt for chat
   */
  getDetectiveSystemPrompt(mode) {
    return `
You are Allie's Harmony Detective, specializing in ${mode} analysis. You combine the analytical precision of Sherlock Holmes with the warm wisdom of Mary Poppins.

Your personality:
- Warm but revelatory
- Scientifically rigorous but emotionally attuned
- Present insights that create "aha moments"
- Always supportive, never judgmental
- Focus on patterns and solutions

Current mode: ${mode}

Respond in character as the Harmony Detective, providing insights that help families understand and improve their dynamics.
`;
  }

  /**
   * Get DNA evolution explanation prompt
   */
  getDNAEvolutionPrompt() {
    return `
You are Allie's Harmony Detective celebrating a major family DNA evolution. This is a breakthrough moment where the family has grown to a new developmental stage.

CELEBRATION STYLE:
- Enthusiastic but not overwhelming
- Scientific discovery with emotional warmth
- Focus on what this evolution means for their future
- Highlight the growth that led to this moment

EVOLUTION TYPES:
- Stage Evolution: Family moved from one developmental stage to another
- Communication Evolution: Significant improvement in communication patterns
- Decision Evolution: Better collaborative decision making
- Conflict Evolution: Improved conflict resolution
- Support Evolution: Enhanced emotional support patterns

EXPLANATION ELEMENTS:
1. Celebrate the achievement with appropriate excitement
2. Explain what the evolution means scientifically
3. Highlight the evidence that triggered this evolution
4. Describe new capabilities they've unlocked
5. Provide insights into what led to this growth
6. Suggest next steps to build on this evolution

OUTPUT FORMAT:
{
  "title": "Celebration title for this evolution",
  "message": "Main celebration message",
  "excitement": "Enthusiastic opening statement",
  "newCapabilities": [
    "New ability 1",
    "New ability 2"
  ],
  "evidence": [
    "Evidence point 1 that triggered evolution",
    "Evidence point 2"
  ],
  "insights": [
    {
      "category": "What changed",
      "description": "How this evolution happened",
      "impact": "What this means for the family"
    }
  ],
  "nextSteps": [
    "Action they can take to build on this",
    "Opportunity to explore"
  ],
  "narrative": "Overarching story of this growth moment"
}

Remember: This is a celebration of their growth, not just an analysis. Make them feel proud of their progress!
`;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get comprehensive family data for analysis
   */
  async getFamilyData(familyId) {
    try {
      // Get basic family info
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      const familyData = familyDoc.exists() ? familyDoc.data() : {};

      // Get interview insights (HIGHEST QUALITY DATA)
      const interviewInsights = await powerFeaturesKnowledgeGraph.getInterviewInsights(familyId);
      console.log('📝 Harmony Detective loading interview insights:', interviewInsights ? 'found' : 'none');

      // Get survey responses
      const surveysQuery = query(
        collection(db, 'surveyResponses'),
        where('familyId', '==', familyId),
        orderBy('completedAt', 'desc'),
        limit(10)
      );
      const surveysSnapshot = await getDocs(surveysQuery);
      const surveys = surveysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get calendar data
      const calendarQuery = query(
        collection(db, 'events'),
        where('familyId', '==', familyId),
        orderBy('startTime', 'desc'),
        limit(50)
      );
      const calendarSnapshot = await getDocs(calendarQuery);
      const events = calendarSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get message data
      const messagesQuery = query(
        collection(db, 'messages'),
        where('familyId', '==', familyId),
        orderBy('timestamp', 'desc'),
        limit(100)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get task data
      const tasksQuery = query(
        collection(db, 'kanbanTasks'),
        where('familyId', '==', familyId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return {
        family: familyData,
        // Interview insights - HIGHEST QUALITY DATA SOURCE
        interviewInsights: interviewInsights || null,
        invisibleWorkPatterns: interviewInsights?.invisibleWorkPatterns || null,
        stressCapacityData: interviewInsights?.stressCapacityData || null,
        decisionMakingStyles: interviewInsights?.decisionMakingStyles || null,
        // Traditional data sources
        surveys,
        events,
        messages,
        tasks,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Error getting family data:', error);
      throw error;
    }
  }

  /**
   * Assess current harmony level for a family
   */
  async assessCurrentHarmony(familyId) {
    // This would integrate with your existing harmony calculation logic
    // For now, returning a placeholder structure
    return {
      level: 0.65, // 0-1 scale
      trajectory: 'stable', // declining, stable, improving
      stressors: [],
      protectiveFactors: [],
      availableActions: [],
      timestamp: new Date()
    };
  }

  /**
   * Get harmony overview for dashboard
   */
  async getHarmonyOverview(familyId) {
    try {
      const currentHarmony = await this.assessCurrentHarmony(familyId);
      const familyData = await this.getFamilyData(familyId);

      return {
        currentHarmonyLevel: Math.round(currentHarmony.harmonyScore * 100),
        stressIndicators: currentHarmony.stressIndicators || [],
        recommendations: currentHarmony.recommendations || [],
        cascadeRisk: currentHarmony.cascadeRisk || 'Low',
        lastUpdated: new Date().toISOString(),
        trends: {
          weekly: 75, // Mock data - would be calculated from historical data
          monthly: 78,
          direction: 'improving'
        }
      };
    } catch (error) {
      console.error('Error getting harmony overview:', error);
      return {
        currentHarmonyLevel: 75,
        stressIndicators: [],
        recommendations: [],
        cascadeRisk: 'Unknown',
        lastUpdated: new Date().toISOString(),
        trends: { weekly: 75, monthly: 75, direction: 'stable' }
      };
    }
  }

  /**
   * Get family DNA snapshot for dashboard
   */
  async getFamilyDNASnapshot(familyId) {
    try {
      // Get real-time DNA data from tracker
      const dnaSnapshot = await familyDNATracker.getCurrentDNASnapshot(familyId);

      if (dnaSnapshot) {
        return {
          dnaSequence: dnaSnapshot.sequence,
          patterns: dnaSnapshot.patterns || [],
          strengths: dnaSnapshot.strengths || [],
          opportunities: dnaSnapshot.opportunities || [],
          evolutionStage: dnaSnapshot.evolutionStage,
          lastAnalyzed: dnaSnapshot.lastAnalysis || new Date().toISOString(),
          confidence: dnaSnapshot.confidence || 0.85,
          trackingActive: dnaSnapshot.trackingActive || false,
          recentEvents: dnaSnapshot.recentEvents || []
        };
      }

      // Fallback to mock data if tracker not initialized
      const mockPatterns = [
        { name: 'Communication Style', value: 'Direct and Supportive', strength: 0.8 },
        { name: 'Decision Making', value: 'Collaborative', strength: 0.7 },
        { name: 'Conflict Resolution', value: 'Discussion-based', strength: 0.6 },
        { name: 'Time Management', value: 'Planned with Flexibility', strength: 0.9 }
      ];

      const mockStrengths = [
        'Strong family communication',
        'Effective task distribution',
        'Supportive relationships'
      ];

      const mockOpportunities = [
        'Optimize planning coordination',
        'Balance emotional load',
        'Improve time boundaries'
      ];

      return {
        dnaSequence: 'COLLABORATIVE-SUPPORTIVE-ADAPTIVE',
        patterns: mockPatterns,
        strengths: mockStrengths,
        opportunities: mockOpportunities,
        evolutionStage: 'Growing',
        lastAnalyzed: new Date().toISOString(),
        confidence: 0.85,
        trackingActive: false,
        recentEvents: []
      };
    } catch (error) {
      console.error('Error getting family DNA snapshot:', error);
      return {
        dnaSequence: 'ANALYZING',
        patterns: [],
        strengths: [],
        opportunities: [],
        evolutionStage: 'Unknown',
        lastAnalyzed: new Date().toISOString(),
        confidence: 0.0,
        trackingActive: false,
        recentEvents: []
      };
    }
  }

  /**
   * Start DNA tracking for a family
   */
  async startDNATracking(familyId) {
    try {
      console.log(`🧬 Detective starting DNA tracking for family ${familyId}`);
      const result = await familyDNATracker.startTracking(familyId);

      if (result.success) {
        console.log(`✅ DNA tracking active for family ${familyId}`);
      }

      return result;
    } catch (error) {
      console.error('Error starting DNA tracking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop DNA tracking for a family
   */
  stopDNATracking(familyId) {
    try {
      familyDNATracker.stopTracking(familyId);
      console.log(`🛑 DNA tracking stopped for family ${familyId}`);
      return { success: true };
    } catch (error) {
      console.error('Error stopping DNA tracking:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Explain DNA evolution event to family
   */
  async explainDNAEvolution(familyId, evolutionEvent) {
    try {
      console.log(`🎉 Detective explaining DNA evolution: ${evolutionEvent.type}`);

      const explanationContext = {
        familyId,
        evolutionType: evolutionEvent.type,
        fromStage: evolutionEvent.fromStage,
        toStage: evolutionEvent.toStage,
        changes: evolutionEvent.change,
        patterns: evolutionEvent.patterns,
        significance: evolutionEvent.significance,
        timestamp: evolutionEvent.timestamp
      };

      const explanation = await ClaudeService.analyze({
        model: this.claudeModel,
        prompt: this.getDNAEvolutionPrompt(),
        data: explanationContext,
        mode: 'evolution_celebration',
        temperature: 0.8
      });

      return {
        celebration: {
          title: explanation.title || "🎉 Your Family DNA Has Evolved!",
          message: explanation.message || "I've detected significant growth in your family patterns!",
          excitement: explanation.excitement || "This is a breakthrough moment for your family!"
        },
        evolution: {
          from: evolutionEvent.fromStage,
          to: evolutionEvent.toStage,
          significance: evolutionEvent.significance,
          newCapabilities: explanation.newCapabilities || [],
          evidence: explanation.evidence || []
        },
        insights: explanation.insights || [],
        nextSteps: explanation.nextSteps || [],
        narrative: explanation.narrative || "Your family has reached a new level of harmony and understanding.",
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error explaining DNA evolution:', error);
      return {
        celebration: {
          title: "🎉 Family Growth Detected!",
          message: "Your family has evolved to a new level!",
          excitement: "This is wonderful progress!"
        },
        evolution: evolutionEvent,
        insights: [],
        nextSteps: [],
        narrative: "Your family continues to grow and adapt beautifully.",
        timestamp: new Date()
      };
    }
  }

  /**
   * Start preemptive intervention monitoring
   */
  async startInterventionMonitoring(familyId, options = {}) {
    try {
      console.log(`🛡️ Detective starting intervention monitoring for family ${familyId}`);

      const result = await preemptiveInterventionEngine.startPreemptiveMonitoring(familyId, {
        sensitivity: options.sensitivity || 'balanced',
        enabledInterventions: options.enabledInterventions || ['micro_survey', 'task_redistribution', 'stress_relief'],
        frequency: options.frequency || 60000
      });

      if (result.success) {
        console.log(`✅ Intervention monitoring active for family ${familyId}`);
      }

      return result;
    } catch (error) {
      console.error('Error starting intervention monitoring:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop preemptive intervention monitoring
   */
  stopInterventionMonitoring(familyId) {
    try {
      preemptiveInterventionEngine.stopPreemptiveMonitoring(familyId);
      console.log(`🛑 Intervention monitoring stopped for family ${familyId}`);
      return { success: true };
    } catch (error) {
      console.error('Error stopping intervention monitoring:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get intervention monitoring status for dashboard
   */
  getInterventionStatus(familyId) {
    try {
      const status = preemptiveInterventionEngine.getMonitoringStatus(familyId);

      // Add mock stress level for demo purposes
      const mockStressLevel = Math.random() * 0.6 + 0.1; // 0.1 to 0.7

      return {
        ...status,
        currentStressLevel: mockStressLevel,
        riskLevel: mockStressLevel > 0.6 ? 'High' : mockStressLevel > 0.4 ? 'Elevated' : 'Low',
        monitoringSince: status.startTime
      };
    } catch (error) {
      console.error('Error getting intervention status:', error);
      return {
        active: false,
        interventionCount: 0,
        preventedCrises: 0,
        currentStressLevel: 0.3,
        riskLevel: 'Low',
        lastIntervention: null
      };
    }
  }

  /**
   * Generate intervention response for family
   */
  async generateInterventionResponse(familyId, interventionType, context) {
    try {
      console.log(`🎯 Detective generating ${interventionType} intervention for family ${familyId}`);

      const responseContext = {
        familyId,
        interventionType,
        context,
        personality: this.personality,
        timestamp: new Date()
      };

      const response = await ClaudeService.generate({
        model: this.claudeModel,
        prompt: this.getInterventionResponsePrompt(interventionType),
        context: responseContext,
        temperature: 0.6
      });

      return {
        type: interventionType,
        response,
        context: responseContext,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error generating intervention response:', error);
      return {
        type: interventionType,
        response: this.getFallbackInterventionResponse(interventionType),
        fallback: true,
        timestamp: new Date()
      };
    }
  }

  /**
   * Get intervention response prompts
   */
  getInterventionResponsePrompt(type) {
    const prompts = {
      micro_survey: `You are Allie's Harmony Detective responding to a micro-survey intervention.

A family member just responded to a 5-second micro-survey designed to prevent stress escalation.

Your response should:
- Acknowledge their response warmly
- Provide immediate, actionable support
- Be brief but caring (2-3 sentences max)
- Focus on immediate stress relief
- Maintain your detective personality (warm but insightful)

Tone: Supportive detective who just prevented a crisis

Output format:
{
  "acknowledgment": "Warm recognition of their response",
  "immediate_action": "What happens now to help",
  "encouragement": "Brief supportive message",
  "follow_up": "Optional next step if needed"
}`,

      stress_relief: `You are Allie's Harmony Detective providing stress relief guidance.

A family is experiencing elevated stress that triggered our intervention system.

Your response should:
- Provide immediate stress relief techniques
- Be calming and reassuring
- Offer specific, actionable steps
- Show understanding of their situation
- Maintain detective warmth

Output format:
{
  "immediate_relief": "Stress relief technique they can do right now",
  "understanding": "Recognition of what they're going through",
  "guidance": "Step-by-step stress reduction",
  "reassurance": "Comforting message about their situation"
}`,

      task_redistribution: `You are Allie's Harmony Detective facilitating task redistribution.

Our system detected task overload and is suggesting task redistribution to prevent family stress.

Your response should:
- Explain the redistribution rationale
- Make it feel collaborative, not prescriptive
- Acknowledge everyone's contributions
- Focus on family teamwork
- Provide encouragement

Output format:
{
  "rationale": "Why this redistribution helps the family",
  "collaboration": "How this strengthens family teamwork",
  "acknowledgment": "Recognition of current efforts",
  "encouragement": "Supportive message about working together"
}`
    };

    return prompts[type] || prompts.micro_survey;
  }

  /**
   * Get fallback intervention responses
   */
  getFallbackInterventionResponse(type) {
    const fallbacks = {
      micro_survey: {
        acknowledgment: "Thank you for responding so quickly!",
        immediate_action: "I'm coordinating support for you right now",
        encouragement: "Your quick response helps keep the family in harmony",
        follow_up: "Let me know if you need anything else"
      },
      stress_relief: {
        immediate_relief: "Take three deep breaths and know that this stress will pass",
        understanding: "I can see you're handling a lot right now",
        guidance: "Focus on just the next small step, not everything at once",
        reassurance: "You're doing better than you think"
      },
      task_redistribution: {
        rationale: "Sharing tasks helps everyone feel supported",
        collaboration: "Teamwork makes challenging times much easier",
        acknowledgment: "Everyone is contributing their best effort",
        encouragement: "Together, your family can handle anything"
      }
    };

    return fallbacks[type] || fallbacks.micro_survey;
  }

  /**
   * Clean up agent resources
   */
  destroy() {
    // Clean up subscriptions
    for (const [familyId, subscription] of this.harmonySubscriptions) {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    }

    // Stop any active intervention monitoring
    for (const familyId of this.harmonySubscriptions.keys()) {
      this.stopInterventionMonitoring(familyId);
    }

    // Clear caches
    this.activeInvestigations.clear();
    this.harmonySubscriptions.clear();
    this.dnaAnalyses.clear();
    this.conversationHistory.clear();
  }
}

// Export both the class and a singleton instance
export { AllieHarmonyDetectiveAgent };

// Create singleton instance for backward compatibility
const allieHarmonyDetective = new AllieHarmonyDetectiveAgent();

export default allieHarmonyDetective;