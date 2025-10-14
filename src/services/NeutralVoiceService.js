/**
 * Neutral Voice Service
 *
 * Ensures Allie speaks as a neutral third party, not as a judge
 * Implements "gentle start-up" communication patterns
 * Converts blame-focused language to system-focused language
 *
 * Philosophy: Allie is an independent family partner who creates
 * curiosity rather than defensiveness, collaboration rather than blame
 *
 * Research basis: Dr. Julie Gottman's "gentle start-up" approach
 * Impact: Enables non-defensive conversations about cognitive load
 */

class NeutralVoiceService {
  constructor() {
    // Blame patterns to detect and transform
    this.blamePatterns = [
      // Direct accusations
      { pattern: /you (don't|never|always|aren't|won't)\s+(\w+)/gi, type: 'accusation' },
      { pattern: /you need to\s+(\w+)/gi, type: 'directive' },
      { pattern: /you should\s+(\w+)/gi, type: 'directive' },
      { pattern: /(you're|you are)\s+(not|never)\s+(\w+)/gi, type: 'accusation' },

      // Comparative blame
      { pattern: /(you|they)\s+only\s+(\w+)/gi, type: 'minimization' },
      { pattern: /(you|they)\s+just\s+(\w+)/gi, type: 'minimization' },

      // Implicit blame
      { pattern: /why (don't|won't|can't)\s+you\s+(\w+)/gi, type: 'interrogation' },
      { pattern: /how come you (don't|won't|can't)\s+(\w+)/gi, type: 'interrogation' },

      // Partner comparison
      { pattern: /(mom|dad|mother|father|mama|papa)\s+(doesn't|won't|isn't|never)\s+(\w+)/gi, type: 'person-blame' },
      { pattern: /(mom|dad|mother|father|mama|papa)\s+only\s+(\w+)/gi, type: 'person-blame' }
    ];

    // Neutral framing templates
    this.neutralTemplates = {
      // Pattern observations (not accusations)
      observation: [
        "I've noticed that {task} tends to fall primarily on {person}.",
        "It looks like {task} is currently handled by {person}.",
        "The data shows {task} happens mostly when {person} initiates it.",
        "I observe that {task} follows a pattern where {person} takes the lead."
      ],

      // System-focused (not person-focused)
      system: [
        "The current system for {task} creates an imbalance.",
        "How {task} is organized right now puts more cognitive load on one person.",
        "The way {task} is structured makes it harder to share the mental work.",
        "This pattern around {task} concentrates responsibility in one place."
      ],

      // Collaboration prompts (not directives)
      collaboration: [
        "How could we share {task} more evenly?",
        "What if we tried {suggestion} for {task}?",
        "I wonder if {suggestion} would help with {task}?",
        "Would it work to {suggestion} for {task}?"
      ],

      // Gentle start-up (not confrontation)
      gentleStartup: [
        "I've been tracking {task}, and I'm noticing a pattern.",
        "Something interesting about {task} - can we talk about it?",
        "I want to share what I'm seeing with {task}.",
        "There's a pattern with {task} that might be worth discussing."
      ],

      // Data-driven (not emotion-driven)
      dataFocused: [
        "Based on the past {timeframe}, {task} has been handled {distribution}.",
        "The numbers show {task} breaks down as: {stats}.",
        "Looking at {timeframe} of data: {task} shows {pattern}.",
        "The measurement reveals {task} is distributed {distribution}."
      ],

      // Impact-focused (not blame-focused)
      impact: [
        "This pattern with {task} affects family harmony by {impact}.",
        "The way {task} is handled creates {impact} for the family.",
        "When {task} falls primarily on one person, it leads to {impact}.",
        "The current approach to {task} has been creating {impact}."
      ]
    };
  }

  /**
   * Main method: Filter any message through neutral voice
   * @param {string} message - Raw message that might contain blame
   * @param {object} context - Context about the conversation
   * @returns {string} - Neutralized, collaboration-focused message
   */
  neutralizeMessage(message, context = {}) {
    let neutralized = message;

    // Step 1: Detect and remove blame patterns
    const blameDetected = this.detectBlamePatterns(message);

    if (blameDetected.hasBlame) {
      console.log('⚠️ Blame detected in message:', blameDetected.patterns);

      // Step 2: Transform blame to observation
      neutralized = this.transformBlameToObservation(message, blameDetected, context);
    }

    // Step 3: Ensure system-focused language
    neutralized = this.ensureSystemFocus(neutralized, context);

    // Step 4: Add collaboration prompt
    neutralized = this.addCollaborationPrompt(neutralized, context);

    // Step 5: Verify gentle start-up
    neutralized = this.ensureGentleStartup(neutralized, context);

    return neutralized;
  }

  /**
   * Detect blame patterns in message
   */
  detectBlamePatterns(message) {
    const detected = {
      hasBlame: false,
      patterns: [],
      severity: 'none'
    };

    this.blamePatterns.forEach(({ pattern, type }) => {
      const matches = message.match(pattern);
      if (matches) {
        detected.hasBlame = true;
        detected.patterns.push({
          type,
          matched: matches,
          pattern: pattern.source
        });
      }
    });

    // Calculate severity
    if (detected.patterns.length === 0) {
      detected.severity = 'none';
    } else if (detected.patterns.length <= 2) {
      detected.severity = 'mild';
    } else if (detected.patterns.length <= 4) {
      detected.severity = 'moderate';
    } else {
      detected.severity = 'high';
    }

    return detected;
  }

  /**
   * Transform blame-focused language to observation-focused
   */
  transformBlameToObservation(message, blameDetected, context) {
    let transformed = message;

    blameDetected.patterns.forEach(({ type, matched }) => {
      switch (type) {
        case 'accusation':
          // "You don't help" → "I've noticed that {task} tends to fall on one person"
          matched.forEach(match => {
            const observation = this.getRandomTemplate('observation', context);
            transformed = transformed.replace(match, observation);
          });
          break;

        case 'directive':
          // "You need to do X" → "How could we share X?"
          matched.forEach(match => {
            const collaboration = this.getRandomTemplate('collaboration', context);
            transformed = transformed.replace(match, collaboration);
          });
          break;

        case 'person-blame':
          // "Mom doesn't do X" → "The current system for X creates imbalance"
          matched.forEach(match => {
            const systemFocus = this.getRandomTemplate('system', context);
            transformed = transformed.replace(match, systemFocus);
          });
          break;

        case 'interrogation':
          // "Why don't you X?" → "I'm noticing a pattern with X"
          matched.forEach(match => {
            const gentleStart = this.getRandomTemplate('gentleStartup', context);
            transformed = transformed.replace(match, gentleStart);
          });
          break;

        case 'minimization':
          // "You only do X" → "Based on the data, X is distributed..."
          matched.forEach(match => {
            const dataFocus = this.getRandomTemplate('dataFocused', context);
            transformed = transformed.replace(match, dataFocus);
          });
          break;
      }
    });

    return transformed;
  }

  /**
   * Ensure message uses system-focused language (patterns, not people)
   */
  ensureSystemFocus(message, context) {
    let systemFocused = message;

    // Replace person-focused with system-focused
    const replacements = [
      { from: /(\w+) isn't helping enough/gi, to: "the current system creates imbalance" },
      { from: /(\w+) needs to do more/gi, to: "we could redistribute this work" },
      { from: /(\w+) is carrying too much/gi, to: "the cognitive load is concentrated" },
      { from: /it's (\w+)'s fault/gi, to: "the current pattern creates" },
      { from: /(\w+) should handle/gi, to: "this could be shared by" }
    ];

    replacements.forEach(({ from, to }) => {
      systemFocused = systemFocused.replace(from, to);
    });

    return systemFocused;
  }

  /**
   * Add collaboration prompt to message
   */
  addCollaborationPrompt(message, context) {
    // If message doesn't already have a question, add one
    if (!message.includes('?') && !message.includes('Would it') && !message.includes('How could')) {
      const collaborationPrompt = this.getRandomTemplate('collaboration', context);
      return `${message}\n\n${collaborationPrompt}`;
    }

    return message;
  }

  /**
   * Ensure gentle start-up framing
   */
  ensureGentleStartup(message, context) {
    // Gentle start-up components:
    // 1. Start with observation, not criticism
    // 2. Use "I" statements, not "You" accusations
    // 3. Express need, not judgment
    // 4. Be polite and appreciative

    // If message starts harshly, soften it
    const harshStarts = [
      /^you\s+/i,
      /^why\s+/i,
      /^(\w+)\s+never\s+/i,
      /^(\w+)\s+always\s+/i,
      /^(\w+)\s+doesn't\s+/i
    ];

    for (const harsh of harshStarts) {
      if (harsh.test(message)) {
        // Prepend with gentle observation
        const gentleIntro = this.getRandomTemplate('gentleStartup', context);
        message = `${gentleIntro}\n\n${message.replace(harsh, '')}`;
        break;
      }
    }

    return message;
  }

  /**
   * Get random template and fill with context
   */
  getRandomTemplate(category, context = {}) {
    const templates = this.neutralTemplates[category];
    if (!templates || templates.length === 0) {
      return '';
    }

    const template = templates[Math.floor(Math.random() * templates.length)];

    // Fill template with context
    return this.fillTemplate(template, context);
  }

  /**
   * Fill template with context variables
   */
  fillTemplate(template, context) {
    let filled = template;

    // Replace context variables
    filled = filled.replace(/{task}/g, context.task || 'this task');
    filled = filled.replace(/{person}/g, context.person || 'one person');
    filled = filled.replace(/{suggestion}/g, context.suggestion || 'trying a different approach');
    filled = filled.replace(/{timeframe}/g, context.timeframe || 'the past month');
    filled = filled.replace(/{distribution}/g, context.distribution || 'unevenly');
    filled = filled.replace(/{stats}/g, context.stats || 'significant imbalance');
    filled = filled.replace(/{pattern}/g, context.pattern || 'concentration of responsibility');
    filled = filled.replace(/{impact}/g, context.impact || 'increased stress');

    return filled;
  }

  /**
   * Create neutral observation about cognitive load
   * @param {object} params - Observation parameters
   * @returns {string} - Neutral, data-driven observation
   */
  createObservation({ task, primaryPerson, percentage, context }) {
    const templates = [
      `I've noticed that ${task} falls primarily on ${primaryPerson}. The data shows ${percentage}% of this cognitive load is concentrated there. ${context || ''}`,

      `Looking at ${task}: ${primaryPerson} is handling ${percentage}% of this mental work. This pattern creates cognitive load concentration. ${context || ''}`,

      `The current system for ${task} has ${primaryPerson} managing ${percentage}% of it. I'm wondering if there's a way to distribute this more evenly. ${context || ''}`,

      `Something I've observed: ${task} is ${percentage}% managed by ${primaryPerson}. This kind of cognitive load imbalance affects family harmony. ${context || ''}`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Create collaboration invitation (not directive)
   * @param {object} params - Suggestion parameters
   * @returns {string} - Inviting, collaborative suggestion
   */
  createCollaborationInvitation({ task, suggestion, benefit }) {
    const templates = [
      `How could we share ${task} more evenly? ${suggestion} might help - it would ${benefit}.`,

      `I'm wondering if ${suggestion} would work for ${task}? The benefit would be ${benefit}.`,

      `What if we tried ${suggestion} for ${task}? That way, we could ${benefit}.`,

      `${task} could benefit from ${suggestion}. Would that feel fair? It would ${benefit}.`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Test if message is blame-free
   * @param {string} message - Message to test
   * @returns {object} - Test results
   */
  testMessageNeutrality(message) {
    const blameDetected = this.detectBlamePatterns(message);

    const hasYouStatements = (message.match(/\byou\s+/gi) || []).length;
    const hasWeStatements = (message.match(/\bwe\s+/gi) || []).length;
    const hasIStatements = (message.match(/\bI\s+/gi) || []).length;

    const hasQuestions = message.includes('?');
    const hasDirectives = /\b(should|must|need to|have to)\b/gi.test(message);
    const hasSystemFocus = /\b(pattern|system|current approach|the way this)\b/gi.test(message);

    return {
      isNeutral: !blameDetected.hasBlame && hasQuestions && hasSystemFocus,
      blameSeverity: blameDetected.severity,
      blamePatterns: blameDetected.patterns.length,
      youStatements: hasYouStatements,
      weStatements: hasWeStatements,
      iStatements: hasIStatements,
      hasQuestions,
      hasDirectives,
      hasSystemFocus,
      score: this.calculateNeutralityScore({
        blameDetected,
        hasYouStatements,
        hasWeStatements,
        hasQuestions,
        hasDirectives,
        hasSystemFocus
      }),
      recommendations: this.getImprovementRecommendations({
        blameDetected,
        hasQuestions,
        hasDirectives,
        hasSystemFocus
      })
    };
  }

  /**
   * Calculate neutrality score (0-100)
   */
  calculateNeutralityScore(factors) {
    let score = 100;

    // Deduct for blame patterns
    score -= factors.blameDetected.patterns.length * 20;

    // Deduct for excessive "you" statements
    score -= Math.min(factors.hasYouStatements * 5, 30);

    // Deduct for directives
    if (factors.hasDirectives) score -= 15;

    // Add for collaborative elements
    if (factors.hasQuestions) score += 10;
    if (factors.hasSystemFocus) score += 15;
    if (factors.hasWeStatements > 0) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get recommendations for improving message neutrality
   */
  getImprovementRecommendations(factors) {
    const recommendations = [];

    if (factors.blameDetected.hasBlame) {
      recommendations.push('Remove accusatory language - focus on patterns, not people');
    }

    if (!factors.hasQuestions) {
      recommendations.push('Add collaborative questions - invite partnership instead of directing');
    }

    if (factors.hasDirectives) {
      recommendations.push('Replace "should/must" with "could we" - make it a conversation');
    }

    if (!factors.hasSystemFocus) {
      recommendations.push('Shift from person-focus to system-focus - discuss patterns, not individuals');
    }

    return recommendations;
  }
}

// Export singleton instance
const neutralVoiceService = new NeutralVoiceService();
export default neutralVoiceService;
