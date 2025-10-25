#!/usr/bin/env node
/**
 * PersonaAgent - Base class for all family member agents
 *
 * Each agent has:
 * - Personality traits that influence decisions
 * - Current state (mood, energy, stress)
 * - Decision-making powered by Claude API
 * - Realistic behavior patterns
 */

const Anthropic = require('@anthropic-ai/sdk');

class PersonaAgent {
  constructor(profile) {
    this.userId = profile.userId;
    this.name = profile.name;
    this.role = profile.role; // 'parent' | 'child'
    this.age = profile.age;

    // Personality traits (0-1 scale)
    this.personality = {
      helpfulness: profile.personality?.helpfulness || 0.7,
      awareness: profile.personality?.awareness || 0.5,
      followThrough: profile.personality?.followThrough || 0.7,
      initiative: profile.personality?.initiative || 0.5,
      detailOrientation: profile.personality?.detailOrientation || 0.5,
      ...profile.personality
    };

    // Behavior patterns
    this.behaviorPatterns = {
      taskCreationRate: profile.behaviorPatterns?.taskCreationRate || 0.5,
      calendarCheckFrequency: profile.behaviorPatterns?.calendarCheckFrequency || 'weekly',
      surveyCompletionRate: profile.behaviorPatterns?.surveyCompletionRate || 0.7,
      documentUploadLikelihood: profile.behaviorPatterns?.documentUploadLikelihood || 0.5,
      responseStyle: profile.behaviorPatterns?.responseStyle || 'medium',
      ...profile.behaviorPatterns
    };

    // Current state (changes over time)
    this.currentState = {
      mood: 'neutral', // 'stressed' | 'neutral' | 'happy'
      energy: 1.0, // 0-1 scale
      stress: 0.5, // 0-1 scale
      mentalLoad: profile.initialMentalLoad || 0.5,
      lastAction: null,
      lastActionTime: null
    };

    // Decision history (for learning patterns)
    this.decisionHistory = [];

    // Initialize Claude client
    this.claude = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  /**
   * Core decision-making - Uses Claude API with persona-specific prompt
   */
  async decideNextAction(context) {
    const personaPrompt = this.buildPersonaPrompt(context);

    try {
      const response = await this.claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: personaPrompt
        }]
      });

      const decision = this.parseDecisionResponse(response.content[0].text);

      // Log decision for history
      this.decisionHistory.push({
        timestamp: new Date().toISOString(),
        context: context.situation,
        decision: decision,
        mood: this.currentState.mood,
        stress: this.currentState.stress
      });

      return decision;

    } catch (error) {
      console.error(`❌ ${this.name} decision-making error:`, error.message);
      // Fallback to rule-based decision if API fails
      return this.fallbackDecision(context);
    }
  }

  /**
   * Build Claude prompt with persona characteristics
   */
  buildPersonaPrompt(context) {
    return `You are ${this.name}, a ${this.age ? this.age + '-year-old' : ''} ${this.role} in the Palsson family.

**Your Personality:**
- Helpfulness: ${(this.personality.helpfulness * 100).toFixed(0)}%
- Awareness of family needs: ${(this.personality.awareness * 100).toFixed(0)}%
- Follow-through: ${(this.personality.followThrough * 100).toFixed(0)}%
- Initiative: ${(this.personality.initiative * 100).toFixed(0)}%
- Detail orientation: ${(this.personality.detailOrientation * 100).toFixed(0)}%

**Your Current State:**
- Mood: ${this.currentState.mood}
- Energy level: ${(this.currentState.energy * 100).toFixed(0)}%
- Stress level: ${(this.currentState.stress * 100).toFixed(0)}%
- Mental load: ${(this.currentState.mentalLoad * 100).toFixed(0)}%

**Current Situation:**
${context.situation}

**Available Actions:**
${context.availableActions.map((action, i) => `${i + 1}. ${action.type}: ${action.description}`).join('\n')}

**Your Behavior Patterns:**
- Task creation rate: ${(this.behaviorPatterns.taskCreationRate * 100).toFixed(0)}%
- Survey completion rate: ${(this.behaviorPatterns.surveyCompletionRate * 100).toFixed(0)}%
- Response style: ${this.behaviorPatterns.responseStyle}

Based on your personality and current state, what would you realistically do?

Respond in JSON format:
{
  "action": "action_type",
  "details": {
    "title": "what you're doing",
    "reasoning": "why this fits your personality",
    "urgency": "low|medium|high",
    "responseText": "what you would say/write"
  }
}`;
  }

  /**
   * Parse Claude's response into structured decision
   */
  parseDecisionResponse(responseText) {
    try {
      // Extract JSON from response (handles markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const decision = JSON.parse(jsonMatch[0]);
      return {
        action: decision.action,
        data: decision.details,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.warn(`⚠️ Could not parse Claude response, using fallback`);
      return this.fallbackDecision({ situation: 'parsing_error' });
    }
  }

  /**
   * Fallback decision-making (rule-based, no API)
   */
  fallbackDecision(context) {
    // Simple rule: Higher stress = more likely to defer/skip tasks
    const shouldAct = Math.random() > this.currentState.stress;

    if (!shouldAct) {
      return {
        action: 'wait',
        data: {
          title: 'Too stressed to act right now',
          reasoning: `Stress level ${(this.currentState.stress * 100).toFixed(0)}% - need a break`,
          urgency: 'low'
        },
        timestamp: new Date().toISOString()
      };
    }

    // Default action based on role
    if (this.role === 'parent') {
      return {
        action: 'check_calendar',
        data: {
          title: 'Check family calendar',
          reasoning: 'Default parent action when uncertain',
          urgency: 'medium'
        },
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        action: 'wait',
        data: {
          title: 'Continue current activity',
          reasoning: 'Default child action',
          urgency: 'low'
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simulate time passage - Updates mood, energy, stress
   */
  tick(minutesElapsed) {
    // Energy decreases throughout day, resets at night
    const currentHour = new Date().getHours();
    if (currentHour >= 6 && currentHour <= 22) {
      // Awake hours: energy gradually decreases
      this.currentState.energy = Math.max(0.1, this.currentState.energy - (minutesElapsed / 960)); // 960 = 16 hours
    } else {
      // Sleeping: energy restores
      this.currentState.energy = Math.min(1.0, this.currentState.energy + (minutesElapsed / 480)); // 480 = 8 hours
    }

    // Stress influenced by mental load
    const stressFromLoad = this.currentState.mentalLoad * 0.7;
    this.currentState.stress = Math.max(0, Math.min(1.0, stressFromLoad + (Math.random() * 0.1 - 0.05)));

    // Mood follows stress (inverse relationship)
    if (this.currentState.stress > 0.7) {
      this.currentState.mood = 'stressed';
    } else if (this.currentState.stress < 0.3) {
      this.currentState.mood = 'happy';
    } else {
      this.currentState.mood = 'neutral';
    }
  }

  /**
   * Respond to Allie's suggestion
   */
  async respondToSuggestion(suggestion) {
    // Acceptance rate influenced by personality
    const baseAcceptanceRate = this.personality.helpfulness * 0.5 + this.personality.awareness * 0.5;

    // Stress reduces acceptance (too overwhelmed)
    const stressPenalty = this.currentState.stress * 0.3;

    const acceptanceProbability = Math.max(0.1, baseAcceptanceRate - stressPenalty);
    const accepted = Math.random() < acceptanceProbability;

    return {
      accepted,
      confidence: acceptanceProbability,
      reasoning: accepted
        ? `This aligns with my desire to help (${(this.personality.helpfulness * 100).toFixed(0)}% helpful)`
        : `I'm too stressed (${(this.currentState.stress * 100).toFixed(0)}%) to take this on right now`,
      responseText: this.generateResponseText(suggestion, accepted)
    };
  }

  /**
   * Generate realistic response text based on personality
   */
  generateResponseText(suggestion, accepted) {
    const responseStyles = {
      brief: accepted ? ['Got it', 'On it', 'Done', 'Sure', 'OK'] : ['Can\'t', 'Not now', 'Maybe later'],
      medium: accepted ? ['I can do that', 'Sounds good', 'Will do', 'Happy to help'] : ['I don\'t think I can right now', 'Maybe another time', 'I\'m swamped'],
      detailed: accepted
        ? ['I can definitely handle that, just need to coordinate timing', 'Great suggestion, I\'ll add it to my list', 'Perfect, I was thinking about this too']
        : ['I appreciate the suggestion but I\'m already at capacity', 'I want to help but I need to focus on my current commitments', 'Let me revisit this when things calm down']
    };

    const style = this.behaviorPatterns.responseStyle;
    const options = responseStyles[style] || responseStyles.medium;

    return options[Math.floor(Math.random() * options.length)];
  }

  /**
   * Get current state summary
   */
  getState() {
    return {
      name: this.name,
      role: this.role,
      age: this.age,
      mood: this.currentState.mood,
      energy: this.currentState.energy,
      stress: this.currentState.stress,
      mentalLoad: this.currentState.mentalLoad,
      lastAction: this.currentState.lastAction,
      decisionCount: this.decisionHistory.length
    };
  }

  /**
   * Update state after action
   */
  updateState(action, outcome) {
    this.currentState.lastAction = action;
    this.currentState.lastActionTime = new Date().toISOString();

    // Successful actions reduce stress slightly
    if (outcome === 'success') {
      this.currentState.stress = Math.max(0, this.currentState.stress - 0.05);
    } else if (outcome === 'failure') {
      this.currentState.stress = Math.min(1.0, this.currentState.stress + 0.1);
    }
  }
}

module.exports = PersonaAgent;
