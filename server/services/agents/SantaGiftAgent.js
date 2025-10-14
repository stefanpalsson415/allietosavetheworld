// server/services/agents/SantaGiftAgent.js
// SANTA - Smart Autonomous Network for Toy Acquisition
// Core agent for discovering mind-blowing gifts that make kids incredibly happy

const AllieMemoryService = require('../AllieMemoryService');
const ReActReasoningService = require('../ReActReasoningService');
const ProgressiveAutonomyService = require('../ProgressiveAutonomyService');
const PredictiveAnalyticsService = require('../PredictiveAnalyticsService');
const admin = require('firebase-admin');

class SantaGiftAgent {
  constructor(config) {
    this.config = config;
    this.db = admin.firestore();

    // Inherit all base agent capabilities
    this.memory = new AllieMemoryService(config);
    this.reasoning = new ReActReasoningService(config);
    this.autonomy = new ProgressiveAutonomyService(config);
    this.predictive = new PredictiveAnalyticsService(config);

    // Gift discovery modes
    this.discoveryModes = {
      PERFECT_STORM: 'perfect_storm',    // Hits multiple interests
      HIDDEN_GEM: 'hidden_gem',          // Unknown but perfect
      EDUCATIONAL: 'educational_trojan', // Fun but educational
      TRENDING: 'trending_now',          // What's hot right now
      CLASSIC: 'timeless_classic'        // Always works
    };

    // Initialize sub-services
    this.initializeServices();
  }

  initializeServices() {
    // These will be implemented next
    const InterestIntersectionEngine = require('./InterestIntersectionEngine');
    const ProductHunterService = require('./ProductHunterService');
    const MarketIntelligenceService = require('./MarketIntelligenceService');

    this.interestEngine = new InterestIntersectionEngine();
    this.productHunter = new ProductHunterService(this.config);
    this.marketIntel = new MarketIntelligenceService(this.config);
  }

  /**
   * Main method - Get top 3 mind-blowing gifts for a child
   * This is what gets called when parent asks "What should I get Emma?"
   */
  async getTop3BirthdayGifts(childId, familyId, options = {}) {
    console.log(`🎅 SANTA: Finding perfect birthday gifts for child ${childId}`);

    try {
      // Step 1: Build comprehensive child context
      const childContext = await this.buildChildContext(childId, familyId);

      if (!childContext) {
        throw new Error('Unable to build child context');
      }

      // Step 2: Use reasoning to understand what would be perfect
      const giftStrategy = await this.reasoning.reason(
        `Find 3 perfect birthday gifts for ${childContext.name} who loves ${childContext.topInterests.join(', ')}`,
        {
          childContext,
          occasion: 'birthday',
          urgency: options.urgency || 'normal'
        },
        await this.memory.getFullMemoryContext(familyId, `birthday gift for ${childContext.name}`)
      );

      // Step 3: Run parallel discovery missions
      const discoveries = await this.runParallelDiscovery(childContext, giftStrategy);

      // Step 4: Score and rank all discoveries
      const scored = await this.scoreGifts(discoveries, childContext);

      // Step 5: Select top 3 with diversity
      const top3 = this.selectTop3WithDiversity(scored);

      // Step 6: Generate compelling narratives
      const giftsWithNarratives = await this.generateNarratives(top3, childContext);

      // Step 7: Store in memory for learning
      await this.storeGiftDiscovery(giftsWithNarratives, childContext, familyId);

      // Step 8: Format response for Allie
      return this.formatGiftResponse(giftsWithNarratives, childContext);

    } catch (error) {
      console.error('SANTA Error:', error);
      // Fallback to basic recommendations
      return this.getFallbackRecommendations(childId);
    }
  }

  /**
   * Build comprehensive child context from all data sources
   */
  async buildChildContext(childId, familyId) {
    // Get basic child info
    const familyDoc = await this.db.collection('families').doc(familyId).get();
    const familyData = familyDoc.data();
    const child = familyData?.familyMembers?.find(m => m.id === childId);

    if (!child) {
      console.warn('Child not found:', childId);
      return null;
    }

    // Get interview insights for richer child understanding
    let interviewInsights = null;
    let childSpecificInsights = null;
    try {
      const kgDoc = await this.db.collection('knowledgeGraphs').doc(familyId).get();
      if (kgDoc.exists) {
        const kgData = kgDoc.data();
        interviewInsights = kgData.interviewInsights || null;

        // Extract child-specific insights from interviews
        if (interviewInsights) {
          childSpecificInsights = {};
          Object.entries(interviewInsights).forEach(([interviewType, data]) => {
            if (data.participantSpecificInsights && data.participantSpecificInsights[child.name]) {
              childSpecificInsights[interviewType] = data.participantSpecificInsights[child.name];
            }
          });
        }
        console.log('🎅 SANTA: Loaded interview insights for gift personalization');
      }
    } catch (error) {
      console.warn('Could not load interview insights:', error);
    }

    // Get interests from multiple sources
    const interests = await this.getComprehensiveInterests(childId, familyId);

    // Get recent activity and mentions
    const recentActivity = await this.getRecentActivity(childId, familyId);

    // Get gift history to avoid repeats
    const giftHistory = await this.getGiftHistory(childId, familyId);

    // Get sibling data for differentiation
    const siblings = familyData?.familyMembers?.filter(m =>
      m.id !== childId && m.role === 'child'
    ) || [];

    // Calculate age
    const age = child.birthdate ?
      Math.floor((Date.now() - new Date(child.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) :
      7; // Default age

    return {
      id: childId,
      name: child.name,
      age,
      interests,
      topInterests: interests.slice(0, 5).map(i => i.name),
      recentActivity,
      giftHistory,
      siblings,
      preferences: child.preferences || {},
      // Interview insights for deeper personalization
      interviewInsights: childSpecificInsights,
      timestamp: new Date()
    };
  }

  /**
   * Get comprehensive interests from all sources
   */
  async getComprehensiveInterests(childId, familyId) {
    const interests = [];

    // 1. Get from child interests subcollection (survey data)
    try {
      const interestsRef = this.db
        .collection('families')
        .doc(familyId)
        .collection('childInterests')
        .doc(childId)
        .collection('interests');

      const snapshot = await interestsRef.orderBy('rating', 'desc').limit(20).get();

      snapshot.forEach(doc => {
        const data = doc.data();
        interests.push({
          id: doc.id,
          name: data.name,
          category: data.category,
          rating: data.rating || 'love',
          score: this.getInterestScore(data),
          source: 'survey',
          lastUpdated: data.updatedAt || data.createdAt
        });
      });
    } catch (error) {
      console.error('Error fetching interests:', error);
    }

    // 2. Extract interests from recent conversations (semantic memory)
    const semanticInterests = await this.extractInterestsFromMemory(childId, familyId);
    interests.push(...semanticInterests);

    // 3. Sort by score and recency
    return this.rankInterests(interests);
  }

  /**
   * Get recent activity and mentions
   */
  async getRecentActivity(childId, familyId) {
    const activities = [];

    // Get recent messages mentioning the child
    try {
      const messagesRef = this.db
        .collection('families')
        .doc(familyId)
        .collection('messages')
        .where('metadata.mentionedMembers', 'array-contains', childId)
        .orderBy('timestamp', 'desc')
        .limit(10);

      const snapshot = await messagesRef.get();

      snapshot.forEach(doc => {
        const data = doc.data();
        activities.push({
          type: 'mention',
          content: data.content,
          timestamp: data.timestamp,
          context: this.extractGiftContext(data.content)
        });
      });
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }

    return activities;
  }

  /**
   * Run parallel discovery missions using different strategies
   */
  async runParallelDiscovery(childContext, strategy) {
    console.log('🔍 SANTA: Running parallel discovery missions...');

    const missions = [
      // Mission 1: Find perfect interest intersections
      this.discoveryPerfectStorm(childContext),

      // Mission 2: Find hidden gems
      this.discoveryHiddenGem(childContext),

      // Mission 3: Find educational trojans
      this.discoveryEducationalTrojan(childContext),

      // Mission 4: Find trending items
      this.discoveryTrending(childContext),

      // Mission 5: Use predictive analytics
      this.discoveryPredictive(childContext)
    ];

    // Run all missions in parallel for speed
    const results = await Promise.allSettled(missions);

    // Flatten and filter successful discoveries
    const discoveries = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        discoveries.push(...(Array.isArray(result.value) ? result.value : [result.value]));
      } else if (result.status === 'rejected') {
        console.warn(`Discovery mission ${index + 1} failed:`, result.reason);
      }
    });

    return discoveries;
  }

  /**
   * Discovery Mission: Perfect Storm (multiple interest matches)
   */
  async discoveryPerfectStorm(childContext) {
    const intersections = await this.interestEngine.generateIntersections(childContext.interests);
    const products = await this.productHunter.searchProducts(intersections.top3);

    return products.map(product => ({
      ...product,
      discoveryType: this.discoveryModes.PERFECT_STORM,
      matchedInterests: intersections.find(i => i.query === product.searchQuery)?.interests || []
    }));
  }

  /**
   * Discovery Mission: Hidden Gems
   */
  async discoveryHiddenGem(childContext) {
    // Search for unique, lesser-known products
    const queries = childContext.topInterests.map(interest =>
      `unique ${interest} gift ideas kids love`
    );

    const products = await this.productHunter.searchSpecialtyStores(queries);

    return products.map(product => ({
      ...product,
      discoveryType: this.discoveryModes.HIDDEN_GEM,
      uniqueness: 'high'
    }));
  }

  /**
   * Discovery Mission: Educational Trojans
   */
  async discoveryEducationalTrojan(childContext) {
    const educationalQueries = childContext.topInterests.map(interest =>
      `educational ${interest} toys STEM learning`
    );

    const products = await this.productHunter.searchEducationalStores(educationalQueries);

    return products.map(product => ({
      ...product,
      discoveryType: this.discoveryModes.EDUCATIONAL,
      educationalValue: this.extractEducationalValue(product)
    }));
  }

  /**
   * Score gifts based on multiple factors
   */
  async scoreGifts(gifts, childContext) {
    return gifts.map(gift => {
      let score = 0;

      // Interest match score (0-40 points)
      const interestMatch = this.calculateInterestMatch(gift, childContext);
      score += interestMatch * 40;

      // Recency boost (0-20 points)
      const recencyScore = this.calculateRecencyScore(gift, childContext.recentActivity);
      score += recencyScore * 20;

      // Uniqueness factor (0-20 points)
      if (gift.discoveryType === this.discoveryModes.HIDDEN_GEM) {
        score += 20;
      } else if (gift.uniqueness === 'medium') {
        score += 10;
      }

      // Age appropriateness (0-10 points)
      if (this.isAgeAppropriate(gift, childContext.age)) {
        score += 10;
      }

      // Price value (0-10 points)
      if (gift.discount && gift.discount > 0.2) {
        score += 10;
      }

      return {
        ...gift,
        score,
        confidence: score / 100
      };
    }).sort((a, b) => b.score - a.score);
  }

  /**
   * Select top 3 gifts ensuring diversity
   */
  selectTop3WithDiversity(scoredGifts) {
    const selected = [];
    const usedTypes = new Set();

    // First, get the absolute best
    if (scoredGifts.length > 0) {
      selected.push(scoredGifts[0]);
      usedTypes.add(scoredGifts[0].discoveryType);
    }

    // Then get best of different types for diversity
    for (const gift of scoredGifts.slice(1)) {
      if (!usedTypes.has(gift.discoveryType) && selected.length < 3) {
        selected.push(gift);
        usedTypes.add(gift.discoveryType);
      }
    }

    // Fill remaining slots with next best
    for (const gift of scoredGifts.slice(1)) {
      if (selected.length < 3 && !selected.includes(gift)) {
        selected.push(gift);
      }
    }

    return selected;
  }

  /**
   * Generate compelling narratives for each gift
   */
  async generateNarratives(gifts, childContext) {
    return gifts.map((gift, index) => {
      const narrative = this.createNarrative(gift, childContext, index + 1);
      const quickReason = this.getQuickReason(gift, index);

      return {
        ...gift,
        rank: index + 1,
        narrative,
        quickReason,
        whyPerfect: this.explainWhyPerfect(gift, childContext)
      };
    });
  }

  /**
   * Create compelling narrative for a gift
   */
  createNarrative(gift, childContext, rank) {
    const narratives = {
      [this.discoveryModes.PERFECT_STORM]:
        `This brilliantly combines ${childContext.name}'s love of ${gift.matchedInterests.join(' AND ')} in one amazing gift! It's like we read their mind!`,

      [this.discoveryModes.HIDDEN_GEM]:
        `Most parents don't know about this, but kids who love ${gift.matchedInterests[0]} are going crazy for these! ${childContext.name} will be the first to have one!`,

      [this.discoveryModes.EDUCATIONAL]:
        `It looks like pure fun, but secretly teaches ${gift.educationalValue}! ${childContext.name} will play for hours while learning!`,

      [this.discoveryModes.TRENDING]:
        `This is what all the kids are talking about right now! Perfect timing for ${childContext.name}'s birthday!`,

      [this.discoveryModes.CLASSIC]:
        `A timeless choice that never fails! Every kid who loves ${gift.matchedInterests[0]} treasures one of these!`
    };

    return narratives[gift.discoveryType] || narratives[this.discoveryModes.PERFECT_STORM];
  }

  /**
   * Get quick reason based on rank
   */
  getQuickReason(gift, rank) {
    const reasons = [
      "🎯 PERFECT MATCH - Hits all their current obsessions!",
      "💎 HIDDEN GEM - They don't know they want this yet!",
      "🚀 NEXT LEVEL - Takes their interests to new heights!"
    ];

    return reasons[rank] || reasons[2];
  }

  /**
   * Store discovery in memory for learning
   */
  async storeGiftDiscovery(gifts, childContext, familyId) {
    // Store in episodic memory for recent context
    await this.memory.storeEpisode(familyId, {
      type: 'gift_discovery',
      childId: childContext.id,
      childName: childContext.name,
      occasion: 'birthday',
      discoveries: gifts.map(g => ({
        name: g.name,
        score: g.score,
        type: g.discoveryType
      })),
      timestamp: Date.now()
    });

    // Store in semantic memory for long-term learning
    for (const gift of gifts) {
      await this.memory.storeSemanticKnowledge(familyId, {
        content: `${childContext.name} was recommended ${gift.name} for birthday, matching interests: ${gift.matchedInterests?.join(', ')}`,
        type: 'gift_recommendation',
        entities: [childContext.id, ...gift.matchedInterests],
        importance: gift.confidence
      });
    }
  }

  /**
   * Format response for Allie chat
   */
  formatGiftResponse(gifts, childContext) {
    return {
      success: true,
      childName: childContext.name,
      occasion: 'birthday',
      gifts: gifts.map(gift => ({
        rank: gift.rank,
        product: {
          name: gift.name,
          price: gift.price,
          originalPrice: gift.originalPrice,
          image: gift.image,
          url: gift.url,
          availability: gift.availability
        },
        narrative: gift.narrative,
        quickReason: gift.quickReason,
        whyPerfect: gift.whyPerfect,
        matchedInterests: gift.matchedInterests,
        confidence: gift.confidence,
        discoveryType: gift.discoveryType
      })),
      introMessage: this.generateIntroMessage(childContext),
      timestamp: Date.now()
    };
  }

  /**
   * Generate intro message for Allie
   */
  generateIntroMessage(childContext) {
    const messages = [
      `Oh ${childContext.name}'s birthday! 🎂 I've been noticing they've been super into ${childContext.topInterests.slice(0, 2).join(' and ')} lately. I found 3 gifts that will absolutely blow their mind...`,

      `Perfect timing! Based on what ${childContext.name} has been loving recently, I found 3 incredible birthday gifts they're going to flip over...`,

      `${childContext.name}'s birthday! 🎉 They've been obsessed with ${childContext.topInterests[0]} lately - I found 3 gifts that perfectly match what they want right now...`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Helper methods
  getInterestScore(interestData) {
    // Convert rating to score
    const ratingScores = { love: 1.0, like: 0.7, neutral: 0.5 };
    return ratingScores[interestData.rating] || 0.5;
  }

  extractGiftContext(content) {
    // Extract gift-related context from message
    const giftKeywords = ['want', 'wish', 'like', 'love', 'need', 'birthday', 'christmas'];
    const found = giftKeywords.filter(keyword =>
      content.toLowerCase().includes(keyword)
    );
    return found.length > 0 ? found : null;
  }

  rankInterests(interests) {
    // Sort by score and recency
    return interests.sort((a, b) => {
      // First by score
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // Then by recency
      return (b.lastUpdated || 0) - (a.lastUpdated || 0);
    });
  }

  calculateInterestMatch(gift, childContext) {
    if (!gift.matchedInterests) return 0;

    const topInterests = childContext.topInterests;
    let matchScore = 0;

    gift.matchedInterests.forEach(interest => {
      const index = topInterests.indexOf(interest);
      if (index !== -1) {
        // Higher score for higher-ranked interests
        matchScore += (1 - index * 0.1);
      }
    });

    return Math.min(matchScore / gift.matchedInterests.length, 1);
  }

  calculateRecencyScore(gift, recentActivity) {
    if (!recentActivity || recentActivity.length === 0) return 0;

    let recencyScore = 0;
    const giftKeywords = gift.name.toLowerCase().split(' ');

    recentActivity.forEach(activity => {
      const activityContent = activity.content?.toLowerCase() || '';
      giftKeywords.forEach(keyword => {
        if (activityContent.includes(keyword)) {
          recencyScore += 0.5;
        }
      });
    });

    return Math.min(recencyScore, 1);
  }

  isAgeAppropriate(gift, childAge) {
    if (!gift.ageRange) return true; // Assume appropriate if not specified

    const [minAge, maxAge] = gift.ageRange;
    return childAge >= minAge && childAge <= maxAge;
  }

  extractEducationalValue(product) {
    const educational = [];
    const keywords = {
      'STEM': ['science', 'technology', 'engineering', 'math', 'coding', 'robot'],
      'Creativity': ['art', 'craft', 'design', 'create', 'build', 'make'],
      'Problem Solving': ['puzzle', 'logic', 'solve', 'think', 'challenge'],
      'Motor Skills': ['build', 'construct', 'assemble', 'coordinate'],
      'Reading': ['book', 'story', 'read', 'literacy'],
      'Social Skills': ['team', 'collaborate', 'share', 'together']
    };

    const productText = (product.name + ' ' + product.description).toLowerCase();

    Object.entries(keywords).forEach(([skill, words]) => {
      if (words.some(word => productText.includes(word))) {
        educational.push(skill);
      }
    });

    return educational.join(', ') || 'General Learning';
  }

  explainWhyPerfect(gift, childContext) {
    const reasons = [];

    // Interest matches
    if (gift.matchedInterests && gift.matchedInterests.length > 0) {
      reasons.push(`Matches ${childContext.name}'s love of ${gift.matchedInterests.join(' and ')}`);
    }

    // Age appropriate
    if (this.isAgeAppropriate(gift, childContext.age)) {
      reasons.push(`Perfect for age ${childContext.age}`);
    }

    // Educational value
    if (gift.educationalValue) {
      reasons.push(`Secretly teaches ${gift.educationalValue}`);
    }

    // Price value
    if (gift.discount && gift.discount > 0.2) {
      reasons.push(`Great value - ${Math.round(gift.discount * 100)}% off!`);
    }

    return reasons.join('. ');
  }

  async extractInterestsFromMemory(childId, familyId) {
    // This would query semantic memory for interest patterns
    // For now, return empty array - to be implemented with Pinecone
    return [];
  }

  async getGiftHistory(childId, familyId) {
    // Query past gift recommendations and purchases
    // For now, return empty array
    return [];
  }

  async discoveryTrending(childContext) {
    // Search for trending items
    // Placeholder for now
    return [];
  }

  async discoveryPredictive(childContext) {
    // Use predictive analytics
    // Placeholder for now
    return [];
  }

  async getFallbackRecommendations(childId) {
    // Basic fallback if main system fails
    return {
      success: false,
      message: "I'm having trouble accessing gift data right now. Try asking again in a moment!",
      gifts: []
    };
  }
}

module.exports = SantaGiftAgent;