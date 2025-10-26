/**
 * EventRoleIntelligenceService.js
 *
 * Allie's intelligence layer for event role auto-suggestion.
 * Analyzes survey responses + event history + Knowledge Graph data
 * to suggest appropriate role assignments with confidence scores.
 */

import {
  EVENT_ROLES,
  ROLE_CATEGORIES,
  getRoleByName,
  calculateRoleCognitiveLoad,
  detectRoleImbalance
} from '../types/eventRoles';
import KnowledgeGraphService from './KnowledgeGraphService';
import { db } from './firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

class EventRoleIntelligenceService {
  constructor() {
    this.patternCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Main entry point: Suggest role assignments for an event
   * @param {Object} event - Event object with title, category, attendees
   * @param {string} familyId - Family ID
   * @returns {Promise<Object>} Suggested role assignments with confidence scores
   */
  async suggestRolesForEvent(event, familyId) {
    try {
      // Gather intelligence from 3 sources in parallel
      const [
        surveyPatterns,
        eventHistory,
        kgInsights
      ] = await Promise.all([
        this.getSurveyRolePatterns(familyId),
        this.getEventRoleHistory(familyId, event.category),
        this.getKnowledgeGraphRoleInsights(familyId)
      ]);

      // Analyze event type and generate suggestions
      const suggestions = this.generateRoleSuggestions({
        event,
        surveyPatterns,
        eventHistory,
        kgInsights
      });

      // Detect potential imbalances before suggesting
      const imbalanceCheck = this.checkPreAssignmentBalance(suggestions, kgInsights);

      return {
        success: true,
        suggestions,
        imbalanceWarning: imbalanceCheck.hasWarning ? imbalanceCheck.message : null,
        confidence: this.calculateOverallConfidence(suggestions),
        requiresConfirmation: true, // Always ask for confirmation
        dataSources: {
          surveyResponses: surveyPatterns.responseCount,
          historicalEvents: eventHistory.length,
          knowledgeGraphNodes: kgInsights.totalRolesPerformed || 0
        }
      };
    } catch (error) {
      console.error('❌ Error suggesting roles:', error);
      return {
        success: false,
        error: error.message,
        suggestions: []
      };
    }
  }

  /**
   * Get role patterns from survey responses
   */
  async getSurveyRolePatterns(familyId) {
    try {
      // Check cache first
      const cacheKey = `survey_patterns_${familyId}`;
      const cached = this.patternCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }

      // Query latest survey responses
      const surveyQuery = query(
        collection(db, 'surveyResponses'),
        where('familyId', '==', familyId),
        orderBy('completedAt', 'desc'),
        limit(5)
      );
      const surveySnapshot = await getDocs(surveyQuery);

      const patterns = {
        responseCount: surveySnapshot.size,
        roleFrequency: {} // userId -> roleName -> count
      };

      // Extract role-related questions from surveys
      surveySnapshot.forEach(doc => {
        const survey = doc.data();
        const responses = survey.responses || {};

        // Map survey questions to event roles
        Object.entries(responses).forEach(([question, answer]) => {
          const roleMapping = this.mapQuestionToRole(question);
          if (roleMapping) {
            const userId = this.extractUserIdFromAnswer(answer, survey);
            if (userId) {
              if (!patterns.roleFrequency[userId]) {
                patterns.roleFrequency[userId] = {};
              }
              patterns.roleFrequency[userId][roleMapping] =
                (patterns.roleFrequency[userId][roleMapping] || 0) + 1;
            }
          }
        });
      });

      // Cache results
      this.patternCache.set(cacheKey, {
        data: patterns,
        timestamp: Date.now()
      });

      return patterns;
    } catch (error) {
      console.error('❌ Error getting survey patterns:', error);
      return { responseCount: 0, roleFrequency: {} };
    }
  }

  /**
   * Get historical event role assignments
   */
  async getEventRoleHistory(familyId, eventCategory) {
    try {
      const cacheKey = `event_history_${familyId}_${eventCategory || 'all'}`;
      const cached = this.patternCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }

      // Query recent events with role assignments
      const eventsQuery = query(
        collection(db, 'events'),
        where('familyId', '==', familyId),
        where('status', 'in', ['active', 'confirmed']),
        orderBy('startTime', 'desc'),
        limit(50)
      );

      const eventSnapshot = await getDocs(eventsQuery);

      const history = eventSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(event => event.roleAssignments && event.roleAssignments.length > 0);

      // Cache results
      this.patternCache.set(cacheKey, {
        data: history,
        timestamp: Date.now()
      });

      return history;
    } catch (error) {
      console.error('❌ Error getting event history:', error);
      return [];
    }
  }

  /**
   * Get Knowledge Graph role insights
   */
  async getKnowledgeGraphRoleInsights(familyId) {
    try {
      const cacheKey = `kg_insights_${familyId}`;
      const cached = this.patternCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }

      // Query both KG endpoints in parallel
      const [distribution, invisibleLabor] = await Promise.all([
        KnowledgeGraphService.getEventRoleDistribution(familyId),
        KnowledgeGraphService.getInvisibleEventLabor(familyId)
      ]);

      const insights = {
        distribution: distribution.data || {},
        invisibleLabor: invisibleLabor.data || {},
        totalRolesPerformed: distribution.data?.byPerson?.reduce(
          (sum, person) => sum + (person.totalRoles || 0), 0
        ) || 0
      };

      // Cache results
      this.patternCache.set(cacheKey, {
        data: insights,
        timestamp: Date.now()
      });

      return insights;
    } catch (error) {
      console.error('❌ Error getting KG insights:', error);
      return { distribution: {}, invisibleLabor: {}, totalRolesPerformed: 0 };
    }
  }

  /**
   * Generate role suggestions based on all data sources
   */
  generateRoleSuggestions({ event, surveyPatterns, eventHistory, kgInsights }) {
    const suggestions = [];
    const attendees = event.attendees || [];

    // For each attendee, suggest roles based on patterns
    attendees.forEach(attendeeId => {
      const attendeeSuggestions = this.suggestRolesForPerson({
        userId: attendeeId,
        event,
        surveyPatterns,
        eventHistory,
        kgInsights
      });

      if (attendeeSuggestions.length > 0) {
        suggestions.push({
          userId: attendeeId,
          suggestedRoles: attendeeSuggestions
        });
      }
    });

    // Ensure balance - if one person has too many high-load roles, redistribute
    return this.balanceSuggestions(suggestions);
  }

  /**
   * Suggest roles for a specific person
   */
  suggestRolesForPerson({ userId, event, surveyPatterns, eventHistory, kgInsights }) {
    const suggestions = [];

    // Strategy 1: Survey-based suggestions
    const surveyFreq = surveyPatterns.roleFrequency[userId] || {};
    Object.entries(surveyFreq).forEach(([roleName, count]) => {
      suggestions.push({
        roleName,
        category: this.getRoleCategory(roleName),
        confidence: Math.min(0.9, 0.5 + (count * 0.1)), // Max 0.9
        source: 'survey',
        reason: `Mentioned in ${count} recent survey${count > 1 ? 's' : ''}`
      });
    });

    // Strategy 2: Historical pattern matching
    const similarEvents = eventHistory.filter(e =>
      this.isSimilarEvent(e, event)
    );

    similarEvents.forEach(pastEvent => {
      const userAssignment = pastEvent.roleAssignments?.find(
        ra => ra.userId === userId
      );

      if (userAssignment) {
        userAssignment.specificRoles.forEach(roleName => {
          const existing = suggestions.find(s => s.roleName === roleName);
          if (existing) {
            existing.confidence = Math.min(0.95, existing.confidence + 0.1);
            existing.reason += ` + Historical pattern`;
          } else {
            suggestions.push({
              roleName,
              category: this.getRoleCategory(roleName),
              confidence: 0.7,
              source: 'history',
              reason: 'Performed this role in similar past events'
            });
          }
        });
      }
    });

    // Strategy 3: Balance-based suggestions (avoid overloading)
    const currentLoad = kgInsights.distribution.byPerson?.find(
      p => p.userId === userId
    );

    if (currentLoad && currentLoad.totalCognitiveLoad > 50) {
      // Suggest low-load roles only
      suggestions.forEach(s => {
        const role = getRoleByName(s.roleName);
        if (role && role.cognitiveLoadWeight >= 4) {
          s.confidence *= 0.5; // Reduce confidence for high-load roles
          s.reason += ' (Note: Consider lighter roles to balance load)';
        }
      });
    }

    // Sort by confidence and return top 3
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  }

  /**
   * Balance suggestions across people to avoid imbalance
   */
  balanceSuggestions(suggestions) {
    // Calculate total cognitive load per person
    const loads = suggestions.map(s => ({
      userId: s.userId,
      load: s.suggestedRoles.reduce((sum, role) => {
        const roleData = getRoleByName(role.roleName);
        return sum + (roleData?.cognitiveLoadWeight || 0);
      }, 0)
    }));

    const maxLoad = Math.max(...loads.map(l => l.load));
    const minLoad = Math.min(...loads.map(l => l.load));

    // If imbalanced (2x difference), redistribute
    if (maxLoad >= minLoad * 2) {
      const overloadedPerson = loads.find(l => l.load === maxLoad);
      const underloadedPerson = loads.find(l => l.load === minLoad);

      // Move one high-load role from overloaded to underloaded
      const overloadedSuggestions = suggestions.find(
        s => s.userId === overloadedPerson.userId
      );
      const highLoadRole = overloadedSuggestions.suggestedRoles
        .sort((a, b) => {
          const roleA = getRoleByName(a.roleName);
          const roleB = getRoleByName(b.roleName);
          return (roleB?.cognitiveLoadWeight || 0) - (roleA?.cognitiveLoadWeight || 0);
        })[0];

      if (highLoadRole) {
        // Remove from overloaded
        overloadedSuggestions.suggestedRoles =
          overloadedSuggestions.suggestedRoles.filter(r => r !== highLoadRole);

        // Add to underloaded
        const underloadedSuggestions = suggestions.find(
          s => s.userId === underloadedPerson.userId
        );
        underloadedSuggestions.suggestedRoles.push({
          ...highLoadRole,
          reason: highLoadRole.reason + ' (Rebalanced for fairness)'
        });
      }
    }

    return suggestions;
  }

  /**
   * Check if suggested assignments would create imbalance
   */
  checkPreAssignmentBalance(suggestions, kgInsights) {
    const currentDistribution = kgInsights.distribution.byPerson || [];

    // Calculate what loads would be AFTER assignment
    const projectedLoads = suggestions.map(s => {
      const currentLoad = currentDistribution.find(p => p.userId === s.userId);
      const additionalLoad = s.suggestedRoles.reduce((sum, role) => {
        const roleData = getRoleByName(role.roleName);
        return sum + (roleData?.cognitiveLoadWeight || 0);
      }, 0);

      return {
        userId: s.userId,
        currentLoad: currentLoad?.totalCognitiveLoad || 0,
        additionalLoad,
        projectedLoad: (currentLoad?.totalCognitiveLoad || 0) + additionalLoad
      };
    });

    const maxProjected = Math.max(...projectedLoads.map(p => p.projectedLoad));
    const minProjected = Math.min(...projectedLoads.map(p => p.projectedLoad));

    if (maxProjected >= minProjected * 2) {
      const overloaded = projectedLoads.find(p => p.projectedLoad === maxProjected);
      return {
        hasWarning: true,
        message: `⚠️ This assignment would give one person 2x more event load than others. Consider redistributing roles for balance.`
      };
    }

    return { hasWarning: false };
  }

  /**
   * Calculate overall confidence score (0-1)
   */
  calculateOverallConfidence(suggestions) {
    if (suggestions.length === 0) return 0;

    const avgConfidence = suggestions.reduce((sum, s) => {
      const roleAvg = s.suggestedRoles.reduce((rSum, r) => rSum + r.confidence, 0) /
        (s.suggestedRoles.length || 1);
      return sum + roleAvg;
    }, 0) / suggestions.length;

    return Math.round(avgConfidence * 100) / 100;
  }

  /**
   * Helper: Map survey question to event role
   */
  mapQuestionToRole(question) {
    const mapping = {
      'drive': 'Driver',
      'carpool': 'Carpool Coordinator',
      'supervise': 'Lead Parent',
      'snack': 'Snack Master',
      'gear': 'Gear Manager',
      'outfit': 'Outfit Coordinator',
      'money': 'Treasurer',
      'setup': 'Setup Crew',
      'cleanup': 'Cleanup Captain',
      'communicate': 'Team Parent Liaison',
      'coordinate': 'Social Coordinator',
      'notes': 'Appointment Advocate',
      'questions': 'Question Asker',
      'comfort': 'Comfort Provider'
    };

    const lowerQuestion = question.toLowerCase();
    for (const [keyword, roleName] of Object.entries(mapping)) {
      if (lowerQuestion.includes(keyword)) {
        return roleName;
      }
    }

    return null;
  }

  /**
   * Helper: Extract userId from survey answer
   */
  extractUserIdFromAnswer(answer, survey) {
    // Survey answers format: "Stefan", "Kimberly", "Both", "Stefan (80%), Kimberly (20%)"
    // Try to match to familyMembers
    if (typeof answer === 'string') {
      // Simple name matching - would need family members list for real implementation
      return answer.toLowerCase().includes('stefan') ? 'stefan_id' :
             answer.toLowerCase().includes('kimberly') ? 'kimberly_id' : null;
    }
    return null;
  }

  /**
   * Helper: Get role category from role name
   */
  getRoleCategory(roleName) {
    const role = getRoleByName(roleName);
    return role?.category || 'unknown';
  }

  /**
   * Helper: Check if two events are similar
   */
  isSimilarEvent(event1, event2) {
    // Compare categories if available
    if (event1.category && event2.category) {
      return event1.category === event2.category;
    }

    // Compare titles (loose matching)
    const title1 = (event1.title || '').toLowerCase();
    const title2 = (event2.title || '').toLowerCase();

    const keywords = ['practice', 'game', 'appointment', 'party', 'meeting', 'lesson'];
    for (const keyword of keywords) {
      if (title1.includes(keyword) && title2.includes(keyword)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.patternCache.clear();
  }
}

// Export singleton instance
const eventRoleIntelligenceService = new EventRoleIntelligenceService();
export default eventRoleIntelligenceService;
