// src/services/CrossFamilyLearningService.js
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { createHash } from '../utils/privacyUtils';

/**
 * Service for cross-family learning with privacy preservation
 * Enables families to benefit from collective insights without exposing individual data
 */
class CrossFamilyLearningService {
  constructor() {
    this.anonymizationSalt = process.env.REACT_APP_ANONYMIZATION_SALT || 'default-salt';
    this.minimumFamiliesForSharing = 5; // Need at least 5 families for pattern to be shareable
    this.privacyThreshold = 0.8; // 80% confidence before sharing a pattern
  }

  /**
   * Contribute family learning data in anonymized format
   * @param {string} familyId - Family ID (will be hashed)
   * @param {Object} learningData - Data to contribute
   * @returns {Promise<boolean>} Success status
   */
  async contributeLearningData(familyId, learningData) {
    try {
      // Generate anonymous family ID
      const anonymousId = await this.generateAnonymousId(familyId);
      
      // Anonymize the learning data
      const anonymizedData = this.anonymizeLearningData(learningData, familyId);
      
      // Store in cross-family collection
      const docRef = doc(db, "crossFamilyLearning", `${anonymousId}_${Date.now()}`);
      await setDoc(docRef, {
        anonymousId,
        contributedAt: serverTimestamp(),
        dataType: learningData.type || 'general',
        patterns: anonymizedData.patterns,
        metrics: anonymizedData.metrics,
        insights: anonymizedData.insights,
        familyProfile: anonymizedData.profile
      });

      console.log("Successfully contributed anonymized learning data");
      return true;
    } catch (error) {
      console.error("Error contributing learning data:", error);
      return false;
    }
  }

  /**
   * Get aggregated insights from similar families
   * @param {Object} familyProfile - Current family's profile
   * @param {string} insightType - Type of insights to retrieve
   * @returns {Promise<Object>} Aggregated insights
   */
  async getAggregatedInsights(familyProfile, insightType = 'all') {
    try {
      // Find similar family profiles
      const similarProfiles = await this.findSimilarFamilyProfiles(familyProfile);
      
      if (similarProfiles.length < this.minimumFamiliesForSharing) {
        console.log("Not enough similar families for meaningful insights");
        return {
          available: false,
          reason: "insufficient_data",
          minimumRequired: this.minimumFamiliesForSharing,
          currentCount: similarProfiles.length
        };
      }

      // Aggregate insights from similar families
      const aggregatedInsights = await this.aggregateInsights(
        similarProfiles,
        insightType,
        familyProfile
      );

      // Apply privacy filters
      const filteredInsights = this.applyPrivacyFilters(aggregatedInsights);

      return {
        available: true,
        insights: filteredInsights,
        confidence: this.calculateConfidence(similarProfiles.length),
        basedOnFamilies: similarProfiles.length
      };
    } catch (error) {
      console.error("Error getting aggregated insights:", error);
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Generate anonymous ID from family ID
   * @private
   */
  async generateAnonymousId(familyId) {
    // Use a one-way hash to ensure anonymity
    return await createHash(`${familyId}${this.anonymizationSalt}`);
  }

  /**
   * Anonymize learning data before sharing
   * @private
   */
  anonymizeLearningData(learningData, familyId) {
    const anonymized = {
      patterns: {},
      metrics: {},
      insights: [],
      profile: {}
    };

    // Anonymize patterns
    if (learningData.patterns) {
      anonymized.patterns = this.anonymizePatterns(learningData.patterns);
    }

    // Anonymize metrics (remove exact values, use ranges)
    if (learningData.metrics) {
      anonymized.metrics = this.anonymizeMetrics(learningData.metrics);
    }

    // Anonymize insights (remove identifying information)
    if (learningData.insights) {
      anonymized.insights = this.anonymizeInsights(learningData.insights);
    }

    // Create anonymous family profile
    if (learningData.familyProfile) {
      anonymized.profile = this.createAnonymousProfile(learningData.familyProfile);
    }

    return anonymized;
  }

  /**
   * Anonymize pattern data
   * @private
   */
  anonymizePatterns(patterns) {
    const anonymized = {};

    Object.entries(patterns).forEach(([key, value]) => {
      // Remove specific question IDs, keep only categories
      if (key.includes('category')) {
        anonymized[key] = value;
      }
      
      // Convert specific percentages to ranges
      if (typeof value === 'number') {
        anonymized[key] = this.numberToRange(value);
      }
      
      // Keep boolean patterns
      if (typeof value === 'boolean') {
        anonymized[key] = value;
      }
    });

    return anonymized;
  }

  /**
   * Anonymize metrics by converting to ranges
   * @private
   */
  anonymizeMetrics(metrics) {
    const anonymized = {};

    Object.entries(metrics).forEach(([key, value]) => {
      if (typeof value === 'number') {
        // Convert to ranges for privacy
        if (key.includes('accuracy') || key.includes('percentage')) {
          anonymized[key] = this.percentageToRange(value);
        } else if (key.includes('count') || key.includes('total')) {
          anonymized[key] = this.countToRange(value);
        } else {
          anonymized[key] = this.numberToRange(value);
        }
      } else if (typeof value === 'string' && !this.containsIdentifyingInfo(value)) {
        anonymized[key] = value;
      }
    });

    return anonymized;
  }

  /**
   * Anonymize insights by removing identifying information
   * @private
   */
  anonymizeInsights(insights) {
    return insights
      .filter(insight => !this.containsIdentifyingInfo(insight))
      .map(insight => {
        if (typeof insight === 'string') {
          return this.sanitizeText(insight);
        }
        if (typeof insight === 'object') {
          return {
            type: insight.type,
            category: insight.category,
            impact: insight.impact,
            // Remove specific values, keep only patterns
            pattern: insight.pattern || 'general'
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  /**
   * Create anonymous family profile
   * @private
   */
  createAnonymousProfile(profile) {
    return {
      familySize: this.countToRange(profile.memberCount || 4),
      childrenAgeRange: this.ageRangeToCategory(profile.childrenAges || []),
      region: this.generalizeLocation(profile.location),
      surveyCount: this.countToRange(profile.surveysCompleted || 0),
      activeMonths: this.countToRange(profile.monthsActive || 0),
      priorityAreas: profile.priorities ? profile.priorities.slice(0, 2) : []
    };
  }

  /**
   * Find similar family profiles for comparison
   * @private
   */
  async findSimilarFamilyProfiles(targetProfile) {
    try {
      // Query for families with similar characteristics
      const q = query(
        collection(db, "crossFamilyLearning"),
        orderBy("contributedAt", "desc"),
        limit(100) // Get recent contributions
      );

      const snapshot = await getDocs(q);
      const similarProfiles = [];
      const seenFamilies = new Set();

      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Avoid duplicate families
        if (seenFamilies.has(data.anonymousId)) return;
        seenFamilies.add(data.anonymousId);

        // Calculate similarity score
        const similarity = this.calculateProfileSimilarity(
          targetProfile,
          data.familyProfile
        );

        if (similarity > 0.7) { // 70% similarity threshold
          similarProfiles.push({
            ...data,
            similarityScore: similarity
          });
        }
      });

      // Sort by similarity and return top matches
      return similarProfiles
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, 20); // Top 20 similar families
    } catch (error) {
      console.error("Error finding similar profiles:", error);
      return [];
    }
  }

  /**
   * Calculate similarity between two family profiles
   * @private
   */
  calculateProfileSimilarity(profile1, profile2) {
    if (!profile1 || !profile2) return 0;

    let similarityScore = 0;
    let factorsCompared = 0;

    // Compare family size
    if (profile1.familySize && profile2.familySize) {
      if (profile1.familySize === profile2.familySize) {
        similarityScore += 0.3;
      }
      factorsCompared++;
    }

    // Compare children age ranges
    if (profile1.childrenAgeRange && profile2.childrenAgeRange) {
      if (profile1.childrenAgeRange === profile2.childrenAgeRange) {
        similarityScore += 0.3;
      }
      factorsCompared++;
    }

    // Compare regions
    if (profile1.region && profile2.region) {
      if (profile1.region === profile2.region) {
        similarityScore += 0.1;
      }
      factorsCompared++;
    }

    // Compare priority areas
    if (profile1.priorityAreas && profile2.priorityAreas) {
      const sharedPriorities = profile1.priorityAreas.filter(p => 
        profile2.priorityAreas.includes(p)
      ).length;
      
      if (sharedPriorities > 0) {
        similarityScore += 0.3 * (sharedPriorities / profile1.priorityAreas.length);
      }
      factorsCompared++;
    }

    return factorsCompared > 0 ? similarityScore / factorsCompared : 0;
  }

  /**
   * Aggregate insights from similar families
   * @private
   */
  async aggregateInsights(similarProfiles, insightType, targetProfile) {
    const aggregated = {
      patterns: {},
      recommendations: [],
      successFactors: [],
      commonChallenges: [],
      effectiveQuestions: [],
      improvementTimelines: {}
    };

    // Count pattern occurrences
    const patternCounts = {};
    const recommendationCounts = {};
    const challengeCounts = {};

    similarProfiles.forEach(profile => {
      // Aggregate patterns
      if (profile.patterns) {
        Object.entries(profile.patterns).forEach(([pattern, value]) => {
          if (!patternCounts[pattern]) patternCounts[pattern] = { count: 0, values: [] };
          patternCounts[pattern].count++;
          patternCounts[pattern].values.push(value);
        });
      }

      // Aggregate insights
      if (profile.insights) {
        profile.insights.forEach(insight => {
          if (insight.type === 'recommendation') {
            const key = insight.pattern || insight.category;
            recommendationCounts[key] = (recommendationCounts[key] || 0) + 1;
          }
          if (insight.type === 'challenge') {
            const key = insight.pattern || insight.category;
            challengeCounts[key] = (challengeCounts[key] || 0) + 1;
          }
        });
      }
    });

    // Convert counts to insights (only include if enough families share the pattern)
    const minFamilies = Math.max(3, similarProfiles.length * 0.3); // 30% of families

    // Process patterns
    Object.entries(patternCounts).forEach(([pattern, data]) => {
      if (data.count >= minFamilies) {
        aggregated.patterns[pattern] = {
          prevalence: (data.count / similarProfiles.length * 100).toFixed(0) + '%',
          confidence: this.calculateConfidence(data.count),
          trend: this.identifyTrend(data.values)
        };
      }
    });

    // Process recommendations
    Object.entries(recommendationCounts).forEach(([rec, count]) => {
      if (count >= minFamilies) {
        aggregated.recommendations.push({
          type: rec,
          supportedByFamilies: `${(count / similarProfiles.length * 100).toFixed(0)}%`,
          strength: count >= similarProfiles.length * 0.5 ? 'strong' : 'moderate'
        });
      }
    });

    // Process challenges
    Object.entries(challengeCounts).forEach(([challenge, count]) => {
      if (count >= minFamilies) {
        aggregated.commonChallenges.push({
          type: challenge,
          frequency: `${(count / similarProfiles.length * 100).toFixed(0)}%`,
          severity: count >= similarProfiles.length * 0.6 ? 'common' : 'occasional'
        });
      }
    });

    return aggregated;
  }

  /**
   * Apply privacy filters to aggregated insights
   * @private
   */
  applyPrivacyFilters(insights) {
    const filtered = { ...insights };

    // Remove any patterns that might be too specific
    if (filtered.patterns) {
      Object.keys(filtered.patterns).forEach(pattern => {
        if (this.isTooSpecific(pattern)) {
          delete filtered.patterns[pattern];
        }
      });
    }

    // Generalize recommendations
    if (filtered.recommendations) {
      filtered.recommendations = filtered.recommendations.map(rec => ({
        ...rec,
        // Remove specific percentages, keep only ranges
        supportedByFamilies: this.generalizePercentage(rec.supportedByFamilies)
      }));
    }

    return filtered;
  }

  /**
   * Utility methods for privacy preservation
   * @private
   */
  numberToRange(num) {
    if (num < 5) return 'very_low';
    if (num < 20) return 'low';
    if (num < 50) return 'moderate';
    if (num < 80) return 'high';
    return 'very_high';
  }

  percentageToRange(percentage) {
    if (percentage < 20) return 'very_low';
    if (percentage < 40) return 'low';
    if (percentage < 60) return 'moderate';
    if (percentage < 80) return 'high';
    return 'very_high';
  }

  countToRange(count) {
    if (count <= 2) return 'small';
    if (count <= 4) return 'medium';
    if (count <= 6) return 'large';
    return 'very_large';
  }

  ageRangeToCategory(ages) {
    if (!ages || ages.length === 0) return 'unknown';
    
    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);
    
    if (maxAge <= 5) return 'young_children';
    if (minAge >= 13) return 'teenagers';
    if (maxAge <= 12) return 'school_age';
    return 'mixed_ages';
  }

  generalizeLocation(location) {
    if (!location) return 'unknown';
    
    // Only keep broad region, not specific city/state
    if (location.toLowerCase().includes('urban')) return 'urban';
    if (location.toLowerCase().includes('suburban')) return 'suburban';
    if (location.toLowerCase().includes('rural')) return 'rural';
    
    // Default to region based on timezone or country
    return 'general';
  }

  containsIdentifyingInfo(text) {
    if (typeof text !== 'string') return false;
    
    // Check for potential PII patterns
    const piiPatterns = [
      /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/, // Names
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // Phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Emails
      /\b\d{1,5}\s+[A-Za-z\s]+\b/, // Addresses
    ];
    
    return piiPatterns.some(pattern => pattern.test(text));
  }

  sanitizeText(text) {
    // Remove any potential identifying information
    return text
      .replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, '[NAME]')
      .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{1,5}\s+[A-Za-z\s]+\b/g, '[ADDRESS]');
  }

  isTooSpecific(pattern) {
    // Check if pattern contains specific identifiers
    const specificPatterns = ['questionId', 'familyId', 'userId', 'exact_'];
    return specificPatterns.some(sp => pattern.includes(sp));
  }

  generalizePercentage(percentage) {
    if (typeof percentage !== 'string') return percentage;
    
    const num = parseInt(percentage);
    if (num < 30) return 'Some families';
    if (num < 50) return 'Many families';
    if (num < 70) return 'Most families';
    return 'Nearly all families';
  }

  calculateConfidence(sampleSize) {
    if (sampleSize < 5) return 'low';
    if (sampleSize < 10) return 'moderate';
    if (sampleSize < 20) return 'high';
    return 'very_high';
  }

  identifyTrend(values) {
    if (!values || values.length < 3) return 'insufficient_data';
    
    // Count occurrences of each value
    const valueCounts = {};
    values.forEach(v => {
      valueCounts[v] = (valueCounts[v] || 0) + 1;
    });
    
    // Find most common value
    const mostCommon = Object.entries(valueCounts)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (mostCommon && mostCommon[1] > values.length * 0.6) {
      return `commonly_${mostCommon[0]}`;
    }
    
    return 'varied';
  }

  /**
   * Get learning recommendations based on cross-family insights
   * @param {Object} familyProfile - Current family profile
   * @param {Object} currentChallenges - Current challenges faced
   * @returns {Promise<Array>} Personalized recommendations
   */
  async getLearningRecommendations(familyProfile, currentChallenges) {
    try {
      const insights = await this.getAggregatedInsights(familyProfile, 'solutions');
      
      if (!insights.available) {
        return [];
      }

      const recommendations = [];

      // Match current challenges with successful patterns from other families
      currentChallenges.forEach(challenge => {
        const relevantPatterns = Object.entries(insights.insights.patterns)
          .filter(([pattern, data]) => 
            pattern.toLowerCase().includes(challenge.toLowerCase()) &&
            data.confidence !== 'low'
          );

        relevantPatterns.forEach(([pattern, data]) => {
          recommendations.push({
            challenge: challenge,
            solution: pattern,
            successRate: data.prevalence,
            confidence: data.confidence,
            basedOn: `${insights.basedOnFamilies} similar families`
          });
        });
      });

      // Add general recommendations
      insights.insights.recommendations.forEach(rec => {
        if (rec.strength === 'strong') {
          recommendations.push({
            type: 'general',
            recommendation: rec.type,
            support: rec.supportedByFamilies,
            priority: 'high'
          });
        }
      });

      return recommendations.slice(0, 5); // Top 5 recommendations
    } catch (error) {
      console.error("Error getting learning recommendations:", error);
      return [];
    }
  }
}

export default new CrossFamilyLearningService();