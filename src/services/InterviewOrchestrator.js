import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import ClaudeService from './ClaudeService';

class InterviewOrchestrator {
  constructor() {
    this.activeSessions = new Map(); // Track active sessions
    this.questionBanks = new Map(); // Pre-loaded question sets
    this.initializeQuestionBanks();
  }

  initializeQuestionBanks() {
    // Pre-defined question banks for each interview type
    this.questionBanks.set('invisible_work_discovery', {
      baseQuestions: [
        "Walk me through your morning routine - what are you thinking about before anyone else wakes up?",
        "When you're grocery shopping, what decisions are you making beyond just buying food?",
        "Tell me about a time when something 'just happened' in your family - like clean clothes appearing or a birthday being remembered.",
        "What would happen if you didn't do [specific task] for a week?",
        "What family responsibilities do you think about but never actually discuss?",
        "How do you keep track of everything that needs to happen in your family?",
        "What invisible work do you think your partner doesn't fully see or understand?",
        "Tell me about the mental energy it takes to coordinate your family's schedule.",
        "What family management tasks cause you the most stress or mental load?",
        "How do you handle the emotional needs of your family members throughout the day?"
      ],
      followUpQuestions: [
        "Can you give me a specific example of that?",
        "How does that make you feel when it happens?",
        "What would need to change for that to be easier?",
        "Have you ever talked about this with your partner?",
        "What would be the ideal way to handle that situation?"
      ],
      branchingRules: [
        {
          trigger: 'stress|overwhelm|exhausted',
          followUp: "It sounds like that creates some stress for you. Can you tell me more about what that feels like?"
        },
        {
          trigger: 'partner|spouse|husband|wife',
          followUp: "How do you think your partner views this responsibility? Have you discussed it together?"
        },
        {
          trigger: 'kids|children',
          followUp: "How aware do you think your children are of all this behind-the-scenes work?"
        }
      ]
    });

    this.questionBanks.set('stress_capacity', {
      baseQuestions: [
        "What does it feel like in your body when the house gets really busy?",
        "If your family was a weather forecast, what would today look like?",
        "When grown-ups are stressed, how can you tell? What do they do differently?",
        "What's something that helps you feel calm when everything feels too much?",
        "If you could give your parents a magic button to make one thing easier, what would it do?",
        "What's the busiest time of day in your house? What's that like for you?",
        "When you need some quiet time, where do you go or what do you do?",
        "How do you let people know when you're feeling overwhelmed?",
        "What makes you feel safe and peaceful in your family?",
        "If you could change one thing about how your family handles busy times, what would it be?"
      ],
      followUpQuestions: [
        "Tell me more about that feeling.",
        "What happens next when you feel that way?",
        "Who in your family is best at helping when you feel like that?",
        "Have you told your parents about this feeling before?",
        "What would make that situation better for you?"
      ]
    });

    // Add other interview types...
    this.questionBanks.set('decision_making_styles', {
      baseQuestions: [
        "Walk me through the last big decision you made together. Who brought it up? How did it evolve?",
        "What decisions do you each 'own' without needing to discuss?",
        "Tell me about a time when you thought you agreed on something but realized you had different expectations.",
        "What family decisions tend to get stuck or delayed?",
        "How do you handle disagreements when kids are watching?",
        "What's your process for making financial decisions together?",
        "How do you decide when to involve the kids in family decisions?",
        "What decisions cause the most tension or conflict between you?",
        "How have your decision-making patterns changed since becoming parents?",
        "What would improve your decision-making process as a couple?"
      ]
    });

    this.questionBanks.set('family_rules_archaeology', {
      baseQuestions: [
        "What's a rule in your family that you've never actually said out loud?",
        "If a new family moved in and wanted to fit in with your family, what would they need to know?",
        "What happens in your family when someone breaks an unspoken rule?",
        "What family traditions or habits would you be sad to lose?",
        "If your family had a motto, what would it be?",
        "What rules from your childhood do you find yourself repeating in your own family?",
        "What unspoken expectations do you have for each family member?",
        "How does your family handle mistakes or when someone messes up?",
        "What values are most important in how your family operates?",
        "What would a stranger notice about how your family interacts?"
      ]
    });

    this.questionBanks.set('future_selves_visioning', {
      baseQuestions: [
        "Fast-forward 5 years - what does a perfect Saturday look like for your family?",
        "What skills are you hoping your kids develop that you didn't have growing up?",
        "What family pattern from your childhood do you want to break or continue?",
        "If you could wave a magic wand and change one thing about your family dynamic, what would it be?",
        "What does 'family success' mean to you?",
        "How do you want your children to describe their childhood when they're adults?",
        "What family traditions do you hope to create or continue?",
        "What challenges do you think your family might face in the next few years?",
        "How do you want to grow as a parent/partner over the next 5 years?",
        "What legacy do you want to leave for your children?"
      ]
    });
  }

  async startInterviewSession(interviewType, participants, familyId, interviewData, conductedBy = null) {
    try {
      const sessionId = `interview_${Date.now()}_${interviewType}_${familyId}`;

      // Create session document in Firestore
      const sessionData = {
        id: sessionId,
        familyId,
        interviewType,
        status: 'active',
        conductedBy: conductedBy ? {
          userId: conductedBy.id || conductedBy.userId,
          name: conductedBy.name,
          role: conductedBy.isParent ? 'parent' : 'child'
        } : null, // Track who is actually conducting the interview
        participants: participants.map(p => ({
          userId: p.id,
          name: p.name,
          role: p.isParent ? 'parent' : 'child',
          age: p.age || null
        })),
        startedAt: serverTimestamp(),
        completedAt: null,
        totalDuration: null,
        responses: [],
        currentQuestionIndex: 0,
        metadata: {
          interviewTitle: interviewData.title,
          estimatedDuration: interviewData.duration,
          participantCount: participants.length
        }
      };

      await setDoc(doc(db, 'interviews', sessionId), sessionData);

      // Store session in memory for quick access
      this.activeSessions.set(sessionId, {
        ...sessionData,
        questionBank: this.questionBanks.get(interviewType),
        familyContext: await this.getFamilyContext(familyId),
        startTime: Date.now()
      });

      console.log(`Started interview session: ${sessionId}`);
      return {
        sessionId,
        status: 'success',
        message: 'Interview session started successfully'
      };

    } catch (error) {
      console.error('Error starting interview session:', error);
      throw new Error(`Failed to start interview: ${error.message}`);
    }
  }

  async getFamilyContext(familyId) {
    try {
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      if (familyDoc.exists()) {
        const familyData = familyDoc.data();
        return {
          familyName: familyData.familyName || 'Family',
          members: familyData.members || [],
          children: familyData.members?.filter(m => !m.isParent) || [],
          parents: familyData.members?.filter(m => m.isParent) || [],
          createdAt: familyData.createdAt
        };
      }
      return {};
    } catch (error) {
      console.error('Error fetching family context:', error);
      return {};
    }
  }

  async processInterviewResponse(sessionId, response, context = {}) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Analyze the response using Claude
      const analysis = await this.analyzeResponse(response, session, context);

      // Store the response
      const responseData = {
        questionIndex: session.currentQuestionIndex,
        question: session.questionBank.baseQuestions[session.currentQuestionIndex],
        response: response.text || response,
        speaker: response.speaker || context.speaker,
        timestamp: new Date(),
        inputType: response.inputType || 'text',
        analysis: analysis,
        sentiment: analysis.sentiment || 0,
        keyThemes: analysis.keyThemes || [],
        emotionalTone: analysis.emotionalTone || 'neutral'
      };

      // Update session in memory and Firestore
      session.responses.push(responseData);
      session.currentQuestionIndex += 1;

      await this.updateSessionInFirestore(sessionId, {
        responses: session.responses,
        currentQuestionIndex: session.currentQuestionIndex,
        lastUpdated: serverTimestamp()
      });

      // Determine next question or completion
      let nextAction;
      if (session.currentQuestionIndex >= session.questionBank.baseQuestions.length) {
        nextAction = await this.completeInterview(sessionId);
      } else {
        nextAction = await this.getNextQuestion(sessionId, responseData);
      }

      return {
        status: 'success',
        analysis,
        nextAction,
        progress: {
          completed: session.currentQuestionIndex,
          total: session.questionBank.baseQuestions.length,
          percentage: Math.round((session.currentQuestionIndex / session.questionBank.baseQuestions.length) * 100)
        }
      };

    } catch (error) {
      console.error('Error processing interview response:', error);
      throw error;
    }
  }

  async analyzeResponse(response, session, context) {
    try {
      const analysisPrompt = `
Analyze this interview response for family dynamics insights:

Interview Type: ${session.interviewType}
Question: ${session.questionBank.baseQuestions[session.currentQuestionIndex]}
Response: ${typeof response === 'string' ? response : response.text}
Family Context: ${JSON.stringify(session.familyContext, null, 2)}
Participant: ${context.speaker?.name || 'Unknown'}

Please analyze for:
1. Key themes and patterns (max 5)
2. Emotional undertones (scale -1 to 1, where -1 is negative, 0 is neutral, 1 is positive)
3. Invisible work indicators (if applicable)
4. Family dynamics insights
5. Stress or capacity signals
6. Follow-up question suggestions (if needed)

Return as JSON with this structure:
{
  "keyThemes": ["theme1", "theme2"],
  "sentiment": 0.5,
  "emotionalTone": "positive/neutral/concerned",
  "insights": ["insight1", "insight2"],
  "invisibleWorkSignals": ["signal1", "signal2"],
  "stressSignals": ["signal1"],
  "followUpSuggestions": ["question1"],
  "confidence": 0.8
}
`;

      const claudeResponse = await ClaudeService.sendMessage(
        analysisPrompt,
        session.familyId,
        { maxTokens: 1000, temperature: 0.3 }
      );

      // Parse Claude's response
      let analysis;
      try {
        // Clean the response if it has markdown formatting
        let cleanResponse = claudeResponse;
        if (claudeResponse.includes('```json')) {
          cleanResponse = claudeResponse.match(/```json\n(.*?)\n```/s)?.[1] || claudeResponse;
        }
        analysis = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.warn('Could not parse Claude analysis response:', parseError);
        // Fallback analysis
        analysis = {
          keyThemes: ['family_dynamics'],
          sentiment: 0,
          emotionalTone: 'neutral',
          insights: ['Response captured for analysis'],
          invisibleWorkSignals: [],
          stressSignals: [],
          followUpSuggestions: [],
          confidence: 0.5
        };
      }

      return analysis;

    } catch (error) {
      console.error('Error analyzing response:', error);
      // Return basic analysis if Claude fails
      return {
        keyThemes: ['family_response'],
        sentiment: 0,
        emotionalTone: 'neutral',
        insights: [],
        invisibleWorkSignals: [],
        stressSignals: [],
        followUpSuggestions: [],
        confidence: 0.3,
        error: error.message
      };
    }
  }

  async getNextQuestion(sessionId, lastResponse) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const currentQuestionIndex = session.currentQuestionIndex;
    const questionBank = session.questionBank;

    // Check if we have more base questions
    if (currentQuestionIndex >= questionBank.baseQuestions.length) {
      return { type: 'complete' };
    }

    // Get the next base question
    const nextQuestion = questionBank.baseQuestions[currentQuestionIndex];

    // Personalize the question for the family
    const personalizedQuestion = await this.personalizeQuestion(
      nextQuestion,
      session.familyContext,
      session.participants
    );

    return {
      type: 'question',
      question: personalizedQuestion,
      questionIndex: currentQuestionIndex,
      isFollowUp: false
    };
  }

  async personalizeQuestion(baseQuestion, familyContext, participants) {
    // Replace generic placeholders with family-specific information
    let personalizedQ = baseQuestion;

    // Replace generic terms with specific family member names
    if (familyContext.children && familyContext.children.length > 0) {
      const childNames = familyContext.children.map(c => c.name);
      personalizedQ = personalizedQ.replace(/\bkids\b/g, childNames.join(' and '));
      personalizedQ = personalizedQ.replace(/\bchildren\b/g, childNames.join(' and '));
    }

    // Handle partner references for couple interviews
    if (participants.length === 2) {
      const partnerName = participants[1]?.name || 'your partner';
      personalizedQ = personalizedQ.replace(/your partner/g, partnerName);
      personalizedQ = personalizedQ.replace(/your spouse/g, partnerName);
    }

    // Add specific task examples based on family context
    if (personalizedQ.includes('[specific task]')) {
      const commonTasks = ['meal planning', 'laundry management', 'scheduling appointments', 'managing social plans'];
      const randomTask = commonTasks[Math.floor(Math.random() * commonTasks.length)];
      personalizedQ = personalizedQ.replace('[specific task]', randomTask);
    }

    return personalizedQ;
  }

  async completeInterview(sessionId) {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const endTime = Date.now();
      const duration = endTime - session.startTime;

      // Generate comprehensive insights
      const insights = await this.generateInsights(session);

      // Update session status
      const completionData = {
        status: 'completed',
        completedAt: serverTimestamp(),
        totalDuration: duration,
        insights: insights,
        summary: {
          totalResponses: session.responses.length,
          averageResponseLength: this.calculateAverageResponseLength(session.responses),
          keyThemes: this.extractOverallThemes(session.responses),
          sentiment: this.calculateOverallSentiment(session.responses)
        }
      };

      await this.updateSessionInFirestore(sessionId, completionData);

      // Update family knowledge graph
      await this.updateFamilyKnowledgeGraph(session.familyId, insights, session.interviewType);

      // Clean up active session
      this.activeSessions.delete(sessionId);

      return {
        type: 'complete',
        insights: insights,
        summary: completionData.summary,
        sessionId: sessionId
      };

    } catch (error) {
      console.error('Error completing interview:', error);
      throw error;
    }
  }

  async generateInsights(session) {
    try {
      const insightsPrompt = `
Analyze this complete ${session.interviewType} interview and generate actionable family insights:

Interview Type: ${session.interviewType}
Family Context: ${JSON.stringify(session.familyContext, null, 2)}
Participants: ${session.participants.map(p => `${p.name} (${p.role})`).join(', ')}

Responses:
${session.responses.map((r, i) => `
Q${i + 1}: ${r.question}
Response: ${r.response}
Analysis: ${JSON.stringify(r.analysis)}
`).join('\n')}

Generate comprehensive insights with:
1. Key Patterns Identified (3-5 patterns)
2. Family Strengths Discovered
3. Areas for Growth/Optimization
4. Specific Actionable Recommendations (3-5 actions)
5. Red Flags or Concerns (if any)
6. Celebration Points (positive discoveries)

Format as JSON:
{
  "keyPatterns": [
    {"pattern": "description", "evidence": "supporting data", "impact": "high/medium/low"}
  ],
  "strengths": ["strength1", "strength2"],
  "growthAreas": [
    {"area": "description", "recommendation": "specific action", "priority": "high/medium/low"}
  ],
  "actionItems": [
    {
      "action": "specific task",
      "assignedTo": "family member or 'family'",
      "priority": "high/medium/low",
      "estimatedEffort": "low/medium/high",
      "expectedOutcome": "benefit description"
    }
  ],
  "redFlags": ["concern1"],
  "celebrationPoints": ["positive1", "positive2"],
  "overallScore": 7.5,
  "nextSteps": ["step1", "step2"]
}
`;

      const claudeResponse = await ClaudeService.sendMessage(
        insightsPrompt,
        session.familyId,
        { maxTokens: 2000, temperature: 0.4 }
      );

      // Parse insights
      let insights;
      try {
        let cleanResponse = claudeResponse;
        if (claudeResponse.includes('```json')) {
          cleanResponse = claudeResponse.match(/```json\n(.*?)\n```/s)?.[1] || claudeResponse;
        }
        insights = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.warn('Could not parse insights response:', parseError);
        // Fallback insights
        insights = {
          keyPatterns: [{ pattern: 'Interview completed successfully', evidence: 'All responses captured', impact: 'medium' }],
          strengths: ['Family engagement in interview process'],
          growthAreas: [{ area: 'Continued family development', recommendation: 'Regular check-ins', priority: 'medium' }],
          actionItems: [],
          redFlags: [],
          celebrationPoints: ['Completed interview together'],
          overallScore: 7.0,
          nextSteps: ['Review interview results', 'Implement suggested changes']
        };
      }

      return insights;

    } catch (error) {
      console.error('Error generating insights:', error);
      // Return basic insights
      return {
        keyPatterns: [],
        strengths: ['Family participation'],
        growthAreas: [],
        actionItems: [],
        redFlags: [],
        celebrationPoints: ['Interview completed'],
        overallScore: 7.0,
        nextSteps: ['Review results'],
        error: error.message
      };
    }
  }

  async updateSessionInFirestore(sessionId, updates) {
    try {
      await updateDoc(doc(db, 'interviews', sessionId), {
        ...updates,
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating session in Firestore:', error);
      throw error;
    }
  }

  async updateFamilyKnowledgeGraph(familyId, insights, interviewType) {
    try {
      // Get existing knowledge graph
      const kgRef = doc(db, 'knowledgeGraphs', familyId);
      const kgDoc = await getDoc(kgRef);

      let existingGraph = {};
      if (kgDoc.exists()) {
        existingGraph = kgDoc.data();
      }

      // Get the session to access participant details
      const session = Array.from(this.activeSessions.values()).find(s => s.familyId === familyId);

      // Extract person-specific insights
      const participantInsights = session ? this.extractParticipantInsights(session, insights) : {};

      // Add interview learnings to knowledge graph
      const interviewLearnings = {
        [`${interviewType}_insights`]: {
          ...insights,
          participants: session?.participants || [],
          participantSpecificInsights: participantInsights,
          lastUpdated: new Date(),
          interviewDate: new Date()
        }
      };

      const updatedGraph = {
        ...existingGraph,
        interviewInsights: {
          ...existingGraph.interviewInsights,
          ...interviewLearnings
        },
        // Store aggregated patterns for quick access
        invisibleWorkPatterns: this.mergeInvisibleWorkPatterns(
          existingGraph.invisibleWorkPatterns,
          interviewType,
          insights
        ),
        stressCapacityData: this.mergeStressCapacityData(
          existingGraph.stressCapacityData,
          interviewType,
          insights,
          participantInsights
        ),
        decisionMakingStyles: this.mergeDecisionMakingStyles(
          existingGraph.decisionMakingStyles,
          interviewType,
          insights
        ),
        lastUpdated: serverTimestamp()
      };

      await setDoc(kgRef, updatedGraph, { merge: true });

      console.log(`✅ Updated knowledge graph with ${interviewType} insights for family ${familyId}`);

    } catch (error) {
      console.error('Error updating family knowledge graph:', error);
      // Don't throw - this is supplementary
    }
  }

  extractParticipantInsights(session, insights) {
    const participantInsights = {};

    session.participants.forEach(participant => {
      const participantResponses = session.responses.filter(
        r => r.speaker === participant.name || r.speaker?.name === participant.name
      );

      if (participantResponses.length > 0) {
        participantInsights[participant.name] = {
          role: participant.role,
          keyThemes: this.extractThemesForParticipant(participantResponses),
          stressSignals: this.extractStressSignals(participantResponses),
          invisibleWorkSignals: this.extractInvisibleWorkSignals(participantResponses),
          overallSentiment: this.calculateParticipantSentiment(participantResponses)
        };
      }
    });

    return participantInsights;
  }

  extractThemesForParticipant(responses) {
    const allThemes = responses.flatMap(r => r.analysis?.keyThemes || []);
    const themeCount = {};
    allThemes.forEach(theme => {
      themeCount[theme] = (themeCount[theme] || 0) + 1;
    });
    return Object.entries(themeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  extractStressSignals(responses) {
    return responses.flatMap(r => r.analysis?.stressSignals || []);
  }

  extractInvisibleWorkSignals(responses) {
    return responses.flatMap(r => r.analysis?.invisibleWorkSignals || []);
  }

  calculateParticipantSentiment(responses) {
    if (responses.length === 0) return 0;
    const totalSentiment = responses.reduce((sum, r) => sum + (r.sentiment || 0), 0);
    return totalSentiment / responses.length;
  }

  mergeInvisibleWorkPatterns(existing = {}, interviewType, insights) {
    if (interviewType !== 'invisible_work_discovery') return existing;

    return {
      ...existing,
      lastInterviewDate: new Date(),
      identifiedPatterns: [
        ...(existing.identifiedPatterns || []),
        ...(insights.keyPatterns || []).filter(p => p.impact === 'high')
      ].slice(-10), // Keep last 10 high-impact patterns
      mentalLoadDistribution: this.extractMentalLoadDistribution(insights)
    };
  }

  mergeStressCapacityData(existing = {}, interviewType, insights, participantInsights) {
    if (interviewType !== 'stress_capacity') return existing;

    return {
      ...existing,
      lastInterviewDate: new Date(),
      childStressIndicators: Object.entries(participantInsights)
        .filter(([name, data]) => data.role === 'child')
        .map(([name, data]) => ({
          childName: name,
          stressSignals: data.stressSignals,
          overallLevel: data.overallSentiment < -0.3 ? 'high' : data.overallSentiment < 0 ? 'medium' : 'low'
        }))
    };
  }

  mergeDecisionMakingStyles(existing = {}, interviewType, insights) {
    if (interviewType !== 'decision_making_styles') return existing;

    return {
      ...existing,
      lastInterviewDate: new Date(),
      identifiedStyles: insights.keyPatterns?.map(p => p.pattern) || [],
      bottlenecks: insights.growthAreas?.filter(a => a.priority === 'high') || []
    };
  }

  extractMentalLoadDistribution(insights) {
    const distribution = {};
    insights.keyPatterns?.forEach(pattern => {
      const match = pattern.pattern.match(/(\w+)\s+handles?\s+(\d+)%/i);
      if (match) {
        distribution[match[1]] = parseInt(match[2]);
      }
    });
    return distribution;
  }

  // Utility methods
  calculateAverageResponseLength(responses) {
    if (responses.length === 0) return 0;
    const totalLength = responses.reduce((sum, r) => sum + (r.response?.length || 0), 0);
    return Math.round(totalLength / responses.length);
  }

  extractOverallThemes(responses) {
    const allThemes = responses.flatMap(r => r.analysis?.keyThemes || []);
    const themeCount = {};
    allThemes.forEach(theme => {
      themeCount[theme] = (themeCount[theme] || 0) + 1;
    });

    return Object.entries(themeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme);
  }

  calculateOverallSentiment(responses) {
    if (responses.length === 0) return 0;
    const sentiments = responses.map(r => r.analysis?.sentiment || 0);
    return sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
  }

  // Session management methods
  getActiveSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }

  async pauseSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'paused';
      session.pausedAt = Date.now();
      await this.updateSessionInFirestore(sessionId, {
        status: 'paused',
        pausedAt: serverTimestamp()
      });
    }
  }

  async resumeSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'active';
      session.resumedAt = Date.now();
      await this.updateSessionInFirestore(sessionId, {
        status: 'active',
        resumedAt: serverTimestamp()
      });
    }
  }
}

// Export singleton instance
const interviewOrchestrator = new InterviewOrchestrator();
export default interviewOrchestrator;