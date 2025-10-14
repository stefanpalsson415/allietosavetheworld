// src/services/GiftCurationEngine.js
import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import ClaudeService from './ClaudeService';
import ChildInterestService from './ChildInterestService';
import QuantumKnowledgeGraph from './QuantumKnowledgeGraph';

/**
 * Gift Curation Engine
 * AI-powered gift recommendation system that learns from child preferences,
 * detects patterns, and provides personalized gift suggestions
 */
class GiftCurationEngine {
  constructor() {
    this.minConfidenceThreshold = 0.7;
    this.giftRadarThreshold = 3; // Number of mentions to trigger alert
    this.priceCategories = {
      budget: { min: 0, max: 25, label: 'Budget-Friendly' },
      moderate: { min: 25, max: 100, label: 'Moderate' },
      premium: { min: 100, max: 500, label: 'Premium' },
      luxury: { min: 500, max: null, label: 'Luxury' }
    };
  }

  /**
   * Build comprehensive child context for recommendations
   */
  async buildChildContext(familyId, childId) {
    try {
      // Get basic child info
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      const familyData = familyDoc.data();
      const child = familyData?.familyMembers?.find(m => m.id === childId);

      if (!child) {
        console.warn('Child not found:', childId);
        return null;
      }

      // Get child's interests from ChildInterestService
      const interests = await ChildInterestService.getChildInterests(familyId, childId);

      // Get quantum context for deeper insights
      const quantumContext = await QuantumKnowledgeGraph.getChildContext(childId);

      // Get recent conversations and activities
      const recentActivity = await this.getRecentChildActivity(familyId, childId);

      // Get sibling data for differentiation
      const siblings = familyData?.familyMembers?.filter(m =>
        m.id !== childId && m.role === 'child'
      ) || [];

      const siblingInterests = {};
      for (const sibling of siblings) {
        siblingInterests[sibling.id] = await ChildInterestService.getChildInterests(
          familyId,
          sibling.id
        );
      }

      return {
        child,
        interests,
        quantumContext,
        recentActivity,
        siblings,
        siblingInterests,
        familyId,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error building child context:', error);
      return null;
    }
  }

  /**
   * Get recent child activity from various sources
   */
  async getRecentChildActivity(familyId, childId) {
    try {
      const activities = {
        conversations: [],
        searches: [],
        interactions: [],
        mentions: []
      };

      // Get recent chat messages mentioning this child
      const messagesQuery = query(
        collection(db, 'families', familyId, 'messages'),
        where('metadata.mentionedMembers', 'array-contains', childId),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      activities.conversations = messagesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return activities;
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return {
        conversations: [],
        searches: [],
        interactions: [],
        mentions: []
      };
    }
  }

  /**
   * Generate AI-powered gift recommendations
   */
  async generateRecommendations(childId, options = {}) {
    try {
      const familyId = options.familyId || localStorage.getItem('selectedFamilyId');
      const context = await this.buildChildContext(familyId, childId);

      if (!context) {
        throw new Error('Unable to build child context');
      }

      // Use AI to generate recommendations
      const prompt = this.buildRecommendationPrompt(context, options);
      const aiResponse = await ClaudeService.sendMessage({
        prompt,
        systemPrompt: `You are an expert gift curator for children.
          Analyze the child's interests, age, and recent activities to suggest perfect gifts.
          Consider developmental appropriateness, educational value, and uniqueness.
          Ensure suggestions are different from what siblings might receive.`,
        temperature: 0.8
      });

      // Parse and structure recommendations
      const recommendations = await this.parseAIRecommendations(aiResponse.content, context);

      // Calculate reasoning and scores
      const enrichedRecommendations = await this.enrichRecommendations(recommendations, context);

      // Ensure sibling differentiation
      const uniqueRecommendations = await this.ensureUniqueness(
        enrichedRecommendations,
        context
      );

      // Optimize for budget if specified
      const finalRecommendations = options.budget
        ? await this.optimizeForBudget(uniqueRecommendations, options.budget)
        : uniqueRecommendations;

      // Store recommendations for learning
      await this.storeRecommendations(familyId, childId, finalRecommendations);

      return {
        recommendations: finalRecommendations,
        reasoning: await this.explainRecommendations(finalRecommendations, context),
        siblingDifferentiation: await this.getSiblingDifferentiation(
          finalRecommendations,
          context
        ),
        priceOptimization: this.getPriceBreakdown(finalRecommendations),
        educationalValue: await this.assessEducationalImpact(finalRecommendations, context)
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Build prompt for AI recommendation
   */
  buildRecommendationPrompt(context, options) {
    const { child, interests, quantumContext, recentActivity } = context;

    let prompt = `Generate gift recommendations for ${child.name}, age ${child.age || 'unknown'}.\n\n`;

    prompt += `Current Interests:\n`;
    if (interests && interests.length > 0) {
      interests.forEach(interest => {
        prompt += `- ${interest.name} (${interest.category}) - Rating: ${interest.rating || 'liked'}\n`;
      });
    } else {
      prompt += `- No specific interests recorded yet\n`;
    }

    if (quantumContext?.patterns?.length > 0) {
      prompt += `\nBehavioral Patterns:\n`;
      quantumContext.patterns.forEach(pattern => {
        prompt += `- ${pattern.text}\n`;
      });
    }

    if (recentActivity?.conversations?.length > 0) {
      prompt += `\nRecent Mentions/Conversations:\n`;
      recentActivity.conversations.slice(0, 5).forEach(conv => {
        prompt += `- "${conv.text?.substring(0, 100)}..."\n`;
      });
    }

    if (options.occasion) {
      prompt += `\nOccasion: ${options.occasion}\n`;
    }

    if (options.budget) {
      prompt += `Budget Range: $${options.budget.min} - $${options.budget.max}\n`;
    }

    prompt += `\nPlease suggest 5-7 specific gift ideas with:
    1. Product name and brief description
    2. Why it matches this child's interests
    3. Approximate price range
    4. Age appropriateness
    5. Educational or developmental benefits
    6. Where to buy (store or online)`;

    return prompt;
  }

  /**
   * Parse AI recommendations into structured format
   */
  async parseAIRecommendations(aiContent, context) {
    try {
      // Extract gift recommendations from AI response
      const recommendations = [];

      // Simple parsing - in production, use more sophisticated NLP
      const lines = aiContent.split('\n');
      let currentRec = null;

      for (const line of lines) {
        if (line.match(/^\d+\./)) {
          if (currentRec) recommendations.push(currentRec);
          currentRec = {
            id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: line.replace(/^\d+\.\s*/, '').split('-')[0].trim(),
            description: '',
            price: null,
            category: '',
            matchScore: 0,
            educationalValue: 0,
            whereToBuy: []
          };
        } else if (currentRec && line.includes('Why:')) {
          currentRec.reasoning = line.replace('Why:', '').trim();
        } else if (currentRec && line.includes('Price:')) {
          const priceMatch = line.match(/\$(\d+)/);
          if (priceMatch) currentRec.price = parseInt(priceMatch[1]);
        } else if (currentRec && line.includes('Buy:')) {
          currentRec.whereToBuy = line.replace('Buy:', '').trim().split(',').map(s => s.trim());
        } else if (currentRec && line.trim()) {
          currentRec.description += line.trim() + ' ';
        }
      }

      if (currentRec) recommendations.push(currentRec);

      return recommendations;
    } catch (error) {
      console.error('Error parsing AI recommendations:', error);
      return [];
    }
  }

  /**
   * Enrich recommendations with additional data
   */
  async enrichRecommendations(recommendations, context) {
    return recommendations.map(rec => ({
      ...rec,
      matchScore: this.calculateMatchScore(rec, context),
      uniquenessScore: this.calculateUniquenessScore(rec, context),
      trendingScore: this.calculateTrendingScore(rec),
      educationalValue: this.assessEducationalValue(rec, context),
      ageAppropriateness: this.checkAgeAppropriateness(rec, context.child.age),
      metadata: {
        generatedAt: new Date(),
        childId: context.child.id,
        childAge: context.child.age,
        occasion: context.occasion
      }
    }));
  }

  /**
   * Calculate match score based on interests
   */
  calculateMatchScore(recommendation, context) {
    let score = 0.5; // Base score

    // Check interest alignment
    if (context.interests) {
      for (const interest of context.interests) {
        if (recommendation.name?.toLowerCase().includes(interest.name?.toLowerCase()) ||
            recommendation.description?.toLowerCase().includes(interest.name?.toLowerCase())) {
          score += 0.2;
        }
      }
    }

    // Check quantum patterns
    if (context.quantumContext?.patterns) {
      for (const pattern of context.quantumContext.patterns) {
        if (recommendation.reasoning?.includes(pattern.type)) {
          score += 0.1;
        }
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Calculate uniqueness score
   */
  calculateUniquenessScore(recommendation, context) {
    let score = 1.0;

    // Check against sibling interests
    if (context.siblingInterests) {
      for (const siblingId in context.siblingInterests) {
        const siblingInterests = context.siblingInterests[siblingId];
        for (const interest of siblingInterests) {
          if (recommendation.category === interest.category) {
            score -= 0.1;
          }
        }
      }
    }

    return Math.max(score, 0.3);
  }

  /**
   * Calculate trending score
   */
  calculateTrendingScore(recommendation) {
    // In production, integrate with external trend APIs
    // For now, return a random score
    return 0.5 + Math.random() * 0.5;
  }

  /**
   * Assess educational value
   */
  assessEducationalValue(recommendation, context) {
    const educationalKeywords = [
      'stem', 'science', 'learning', 'educational', 'creative',
      'problem-solving', 'critical thinking', 'motor skills',
      'cognitive', 'development'
    ];

    let score = 0;
    const text = `${recommendation.name} ${recommendation.description}`.toLowerCase();

    for (const keyword of educationalKeywords) {
      if (text.includes(keyword)) {
        score += 0.2;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Check age appropriateness
   */
  checkAgeAppropriateness(recommendation, childAge) {
    if (!childAge) return { appropriate: true, confidence: 0.5 };

    // Simple age check - in production, use more sophisticated logic
    const ageRangeMatch = recommendation.description?.match(/ages?\s*(\d+)[\s-]+(\d+)/i);
    if (ageRangeMatch) {
      const minAge = parseInt(ageRangeMatch[1]);
      const maxAge = parseInt(ageRangeMatch[2]);
      const appropriate = childAge >= minAge && childAge <= maxAge;
      return { appropriate, confidence: 0.9, minAge, maxAge };
    }

    return { appropriate: true, confidence: 0.5 };
  }

  /**
   * Ensure recommendations are unique from siblings
   */
  async ensureUniqueness(recommendations, context) {
    if (!context.siblings || context.siblings.length === 0) {
      return recommendations;
    }

    return recommendations.map(rec => ({
      ...rec,
      siblingConflict: this.checkSiblingConflict(rec, context),
      alternativeSuggestion: rec.uniquenessScore < 0.5
        ? this.generateAlternative(rec, context)
        : null
    }));
  }

  /**
   * Check for sibling conflicts
   */
  checkSiblingConflict(recommendation, context) {
    const conflicts = [];

    for (const sibling of context.siblings) {
      const siblingInterests = context.siblingInterests[sibling.id] || [];
      for (const interest of siblingInterests) {
        if (interest.category === recommendation.category &&
            interest.rating === 'love') {
          conflicts.push({
            siblingName: sibling.name,
            conflictType: 'same_category',
            severity: 'medium'
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Generate alternative suggestion
   */
  generateAlternative(recommendation, context) {
    // In production, use AI to generate alternatives
    return {
      suggestion: `Consider a unique variation of ${recommendation.name}`,
      reason: 'To differentiate from sibling preferences'
    };
  }

  /**
   * Optimize recommendations for budget
   */
  async optimizeForBudget(recommendations, budget) {
    const inBudget = recommendations.filter(rec =>
      rec.price >= budget.min && rec.price <= budget.max
    );

    const sorted = inBudget.sort((a, b) =>
      (b.matchScore * b.educationalValue) - (a.matchScore * a.educationalValue)
    );

    return sorted.slice(0, 5);
  }

  /**
   * Explain recommendations
   */
  async explainRecommendations(recommendations, context) {
    const explanations = [];

    for (const rec of recommendations) {
      explanations.push({
        giftId: rec.id,
        name: rec.name,
        reasoning: rec.reasoning || 'Matches child interests',
        scores: {
          match: rec.matchScore,
          uniqueness: rec.uniquenessScore,
          educational: rec.educationalValue,
          trending: rec.trendingScore
        },
        whyPerfect: this.generateWhyPerfect(rec, context)
      });
    }

    return explanations;
  }

  /**
   * Generate "why perfect" explanation
   */
  generateWhyPerfect(recommendation, context) {
    const reasons = [];

    if (recommendation.matchScore > 0.8) {
      reasons.push(`Perfectly aligns with ${context.child.name}'s interests`);
    }
    if (recommendation.educationalValue > 0.7) {
      reasons.push('High educational value');
    }
    if (recommendation.uniquenessScore > 0.8) {
      reasons.push('Unique from sibling gifts');
    }
    if (recommendation.trendingScore > 0.8) {
      reasons.push('Currently trending');
    }

    return reasons.join(', ');
  }

  /**
   * Get sibling differentiation analysis
   */
  async getSiblingDifferentiation(recommendations, context) {
    if (!context.siblings || context.siblings.length === 0) {
      return { hasSiblings: false };
    }

    return {
      hasSiblings: true,
      siblings: context.siblings.map(sibling => sibling.name),
      differentiationStrategy: 'Category and style variation',
      conflictsAvoided: recommendations.filter(r => r.siblingConflict?.length > 0).length,
      uniqueCategories: [...new Set(recommendations.map(r => r.category))]
    };
  }

  /**
   * Get price breakdown
   */
  getPriceBreakdown(recommendations) {
    const prices = recommendations.map(r => r.price).filter(p => p !== null);

    if (prices.length === 0) {
      return { available: false };
    }

    return {
      available: true,
      lowest: Math.min(...prices),
      highest: Math.max(...prices),
      average: prices.reduce((a, b) => a + b, 0) / prices.length,
      distribution: this.getPriceDistribution(recommendations)
    };
  }

  /**
   * Get price distribution
   */
  getPriceDistribution(recommendations) {
    const distribution = {};

    for (const category in this.priceCategories) {
      const range = this.priceCategories[category];
      distribution[category] = recommendations.filter(r => {
        if (r.price === null) return false;
        if (range.max === null) return r.price >= range.min;
        return r.price >= range.min && r.price < range.max;
      }).length;
    }

    return distribution;
  }

  /**
   * Assess educational impact
   */
  async assessEducationalImpact(recommendations, context) {
    const impacts = [];

    for (const rec of recommendations) {
      impacts.push({
        giftName: rec.name,
        educationalScore: rec.educationalValue,
        developmentalAreas: this.identifyDevelopmentalAreas(rec),
        skillsEnhanced: this.identifySkills(rec),
        learningStyle: this.matchLearningStyle(rec, context)
      });
    }

    return impacts;
  }

  /**
   * Identify developmental areas
   */
  identifyDevelopmentalAreas(recommendation) {
    const areas = [];
    const text = `${recommendation.name} ${recommendation.description}`.toLowerCase();

    if (text.includes('motor') || text.includes('physical')) {
      areas.push('Physical Development');
    }
    if (text.includes('cognitive') || text.includes('problem')) {
      areas.push('Cognitive Development');
    }
    if (text.includes('social') || text.includes('team')) {
      areas.push('Social Skills');
    }
    if (text.includes('creative') || text.includes('art')) {
      areas.push('Creativity');
    }
    if (text.includes('stem') || text.includes('science')) {
      areas.push('STEM Learning');
    }

    return areas.length > 0 ? areas : ['General Development'];
  }

  /**
   * Identify skills enhanced
   */
  identifySkills(recommendation) {
    const skills = [];
    const text = `${recommendation.name} ${recommendation.description}`.toLowerCase();

    const skillKeywords = {
      'problem-solving': 'Problem Solving',
      'critical thinking': 'Critical Thinking',
      'creativity': 'Creative Expression',
      'communication': 'Communication',
      'collaboration': 'Teamwork',
      'fine motor': 'Fine Motor Skills',
      'gross motor': 'Gross Motor Skills',
      'reading': 'Literacy',
      'math': 'Numeracy',
      'science': 'Scientific Thinking'
    };

    for (const [keyword, skill] of Object.entries(skillKeywords)) {
      if (text.includes(keyword)) {
        skills.push(skill);
      }
    }

    return skills.length > 0 ? skills : ['General Skills'];
  }

  /**
   * Match learning style
   */
  matchLearningStyle(recommendation, context) {
    // Determine learning style from recommendation type
    const text = `${recommendation.name} ${recommendation.description}`.toLowerCase();

    if (text.includes('hands-on') || text.includes('build')) {
      return 'Kinesthetic';
    }
    if (text.includes('visual') || text.includes('picture')) {
      return 'Visual';
    }
    if (text.includes('audio') || text.includes('music')) {
      return 'Auditory';
    }
    if (text.includes('read') || text.includes('book')) {
      return 'Reading/Writing';
    }

    return 'Multi-modal';
  }

  /**
   * Detect gift radar alerts
   */
  async detectGiftRadarAlerts(familyId, childId, conversations) {
    try {
      const patterns = await this.findPatterns(conversations);
      const alerts = [];

      for (const pattern of patterns) {
        if (pattern.frequency >= this.giftRadarThreshold) {
          alerts.push({
            type: 'gift_radar',
            childId,
            alert: `${pattern.childName || 'Child'} mentioned "${pattern.topic}" ${pattern.frequency} times recently!`,
            confidence: pattern.confidence,
            suggestedAction: pattern.action || 'Consider adding to gift list',
            detectedAt: new Date(),
            pattern
          });
        }
      }

      // Store alerts
      if (alerts.length > 0) {
        await this.storeAlerts(familyId, childId, alerts);
      }

      return alerts;
    } catch (error) {
      console.error('Error detecting gift radar alerts:', error);
      return [];
    }
  }

  /**
   * Find patterns in conversations
   */
  async findPatterns(conversations) {
    const topicCounts = {};
    const patterns = [];

    for (const conv of conversations) {
      // Extract topics using simple keyword matching
      // In production, use NLP for better extraction
      const text = conv.text?.toLowerCase() || '';
      const topics = this.extractTopics(text);

      for (const topic of topics) {
        if (!topicCounts[topic]) {
          topicCounts[topic] = { count: 0, mentions: [] };
        }
        topicCounts[topic].count++;
        topicCounts[topic].mentions.push({
          text: conv.text,
          timestamp: conv.timestamp
        });
      }
    }

    // Convert to patterns
    for (const [topic, data] of Object.entries(topicCounts)) {
      if (data.count >= 2) {
        patterns.push({
          topic,
          frequency: data.count,
          confidence: Math.min(data.count / 10, 1.0),
          mentions: data.mentions,
          action: this.suggestAction(topic, data.count)
        });
      }
    }

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Extract topics from text
   */
  extractTopics(text) {
    // Simple keyword extraction - in production use NLP
    const topics = [];
    const giftKeywords = [
      'want', 'wish', 'like', 'love', 'need', 'dream',
      'favorite', 'cool', 'awesome', 'amazing'
    ];

    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      if (giftKeywords.includes(words[i])) {
        // Get the next few words as potential topic
        const topic = words.slice(i + 1, i + 4).join(' ');
        if (topic && topic.length > 3) {
          topics.push(topic);
        }
      }
    }

    return topics;
  }

  /**
   * Suggest action based on pattern
   */
  suggestAction(topic, frequency) {
    if (frequency >= 5) {
      return `High interest detected! Add "${topic}" to priority gift list`;
    }
    if (frequency >= 3) {
      return `Growing interest in "${topic}" - consider for upcoming occasion`;
    }
    return `Monitor interest in "${topic}"`;
  }

  /**
   * Store recommendations for learning
   */
  async storeRecommendations(familyId, childId, recommendations) {
    try {
      const docRef = doc(
        db,
        'families',
        familyId,
        'giftRecommendations',
        `${childId}_${Date.now()}`
      );

      await setDoc(docRef, {
        childId,
        recommendations,
        generatedAt: serverTimestamp(),
        version: '2.0'
      });
    } catch (error) {
      console.error('Error storing recommendations:', error);
    }
  }

  /**
   * Store gift radar alerts
   */
  async storeAlerts(familyId, childId, alerts) {
    try {
      for (const alert of alerts) {
        const docRef = doc(
          db,
          'families',
          familyId,
          'giftAlerts',
          `${childId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        );

        await setDoc(docRef, {
          ...alert,
          familyId,
          childId,
          createdAt: serverTimestamp(),
          dismissed: false
        });
      }
    } catch (error) {
      console.error('Error storing alerts:', error);
    }
  }
}

export default new GiftCurationEngine();