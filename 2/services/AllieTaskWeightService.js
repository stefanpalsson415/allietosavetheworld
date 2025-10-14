// src/services/AllieTaskWeightService.js

import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import axios from 'axios';

// Task Weight API configuration
const API_BASE_URL = process.env.REACT_APP_TASK_WEIGHT_API_URL || 'http://localhost:3002';

/**
 * Service for interacting with the Task Weight API
 * Provides enhanced task weight calculations and family insights
 */
class AllieTaskWeightService {
  constructor() {
    this.apiBaseUrl = API_BASE_URL;
    this.insightsCache = {};
  }

  /**
   * Get the API base URL
   * @returns {string} The API base URL
   */
  getApiBaseUrl() {
    return this.apiBaseUrl;
  }

  /**
   * Calculate enhanced task weight
   * @param {Object} task - Task to calculate weight for
   * @param {string} familyId - Family identifier
   * @param {string} parentType - Parent type (mama or papa)
   * @returns {Promise<Object>} Calculated weight result
   */
  async calculateTaskWeight(task, familyId, parentType) {
    try {
      const url = `${this.apiBaseUrl}/calculate/enhanced`;
      
      // Get family priorities from Firestore
      let familyPriorities = null;
      if (familyId) {
        const familyDoc = await getDoc(doc(db, "families", familyId));
        if (familyDoc.exists()) {
          familyPriorities = familyDoc.data().priorities || null;
        }
      }
      
      const response = await axios.post(url, {
        task,
        familyId,
        familyPriorities,
        parentType,
        version: 'latest'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error calculating task weight:', error);
      throw error;
    }
  }

  /**
   * Calculate weights for multiple tasks in batch
   * @param {Array} tasks - Array of tasks
   * @param {string} familyId - Family identifier
   * @param {string} parentType - Parent type (mama or papa)
   * @returns {Promise<Array>} Array of weight results
   */
  async calculateBatchWeights(tasks, familyId, parentType) {
    try {
      const url = `${this.apiBaseUrl}/calculate/enhanced/batch`;
      
      // Get family priorities from Firestore
      let familyPriorities = null;
      if (familyId) {
        const familyDoc = await getDoc(doc(db, "families", familyId));
        if (familyDoc.exists()) {
          familyPriorities = familyDoc.data().priorities || null;
        }
      }
      
      const response = await axios.post(url, {
        tasks,
        familyId,
        familyPriorities,
        parentType,
        version: 'latest'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error calculating batch weights:', error);
      throw error;
    }
  }

  /**
   * Calculate balance scores based on survey responses
   * @param {Array} questionSet - Full set of questions
   * @param {Object} responses - Survey responses
   * @param {string} familyId - Family identifier
   * @returns {Promise<Object>} Balance score results
   */
  async calculateBalanceScores(questionSet, responses, familyId) {
    try {
      const url = `${this.apiBaseUrl}/calculate/balance`;
      
      // Get family priorities from Firestore
      let familyPriorities = null;
      if (familyId) {
        const familyDoc = await getDoc(doc(db, "families", familyId));
        if (familyDoc.exists()) {
          familyPriorities = familyDoc.data().priorities || null;
        }
      }
      
      const response = await axios.post(url, {
        fullQuestionSet: questionSet,
        responses,
        familyPriorities,
        familyId,
        version: 'latest'
      });
      
      // Store results in Firestore
      if (familyId) {
        await updateDoc(doc(db, "families", familyId), {
          weightedScores: response.data,
          balanceUpdatedAt: new Date().toISOString()
        });
      }
      
      return response.data;
    } catch (error) {
      console.error('Error calculating balance scores:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive family insights
   * @param {string} familyId - Family identifier
   * @param {boolean} useCache - Whether to use cached insights
   * @returns {Promise<Object>} Family insights
   */
  async getFamilyInsights(familyId, useCache = true) {
    try {
      // Check cache if requested
      if (useCache && this.insightsCache[familyId]) {
        const cacheAge = Date.now() - this.insightsCache[familyId].timestamp;
        // Use cache if less than 15 minutes old
        if (cacheAge < 900000) {
          return this.insightsCache[familyId].data;
        }
      }
      
      const url = `${this.apiBaseUrl}/family/${familyId}/insights`;
      const response = await axios.get(url);
      
      // Cache the insights
      this.insightsCache[familyId] = {
        data: response.data,
        timestamp: Date.now()
      };
      
      // Also store in Firestore for future reference
      await setDoc(doc(db, "familyInsights", familyId), {
        ...response.data,
        storedAt: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching family insights:', error);
      throw error;
    }
  }

  /**
   * Check for burnout alerts
   * @param {string} familyId - Family identifier
   * @returns {Promise<Object>} Burnout alert data if present
   */
  async checkBurnoutAlert(familyId) {
    try {
      const url = `${this.apiBaseUrl}/burnout/alert/${familyId}`;
      const response = await axios.get(url);
      
      return response.data;
    } catch (error) {
      console.error('Error checking burnout alert:', error);
      return null;
    }
  }

  /**
   * Get life stage recommendations
   * @param {string} familyId - Family identifier
   * @returns {Promise<Object>} Life stage recommendations
   */
  async getLifeStageRecommendations(familyId) {
    try {
      const url = `${this.apiBaseUrl}/lifestage/recommendations/${familyId}`;
      const response = await axios.get(url);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching life stage recommendations:', error);
      return null;
    }
  }

  /**
   * Get cultural suggestions for a specific topic
   * @param {string} familyId - Family identifier
   * @param {string} topic - Topic area
   * @returns {Promise<Object>} Cultural suggestions
   */
  async getCulturalSuggestions(familyId, topic) {
    try {
      const url = `${this.apiBaseUrl}/culture/suggestions/${familyId}/${topic}`;
      const response = await axios.get(url);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching cultural suggestions:', error);
      return null;
    }
  }

  /**
   * Get relationship style recommendations
   * @param {string} familyId - Family identifier
   * @returns {Promise<Object>} Relationship recommendations
   */
  async getRelationshipRecommendations(familyId) {
    try {
      const url = `${this.apiBaseUrl}/relationship/recommendations/${familyId}`;
      const response = await axios.get(url);
      
      return response.data;
    } catch (error) {
      console.error('Error fetching relationship recommendations:', error);
      return null;
    }
  }

  /**
   * Submit feedback on task weight
   * @param {string} taskId - Task identifier
   * @param {number} calculatedWeight - Weight from calculation
   * @param {number} suggestedWeight - Weight suggested by user
   * @param {string} familyId - Family identifier
   * @param {string} notes - Optional feedback notes
   * @returns {Promise<Object>} Feedback result
   */
  async submitWeightFeedback(taskId, calculatedWeight, suggestedWeight, familyId, notes = null) {
    try {
      const url = `${this.apiBaseUrl}/feedback`;
      const response = await axios.post(url, {
        taskId,
        calculatedWeight,
        suggestedWeight,
        familyId,
        notes
      });
      
      return response.data;
    } catch (error) {
      console.error('Error submitting weight feedback:', error);
      throw error;
    }
  }

  /**
   * Track intervention implementation
   * @param {string} familyId - Family identifier
   * @param {string} interventionType - Type of intervention
   * @param {string} status - Implementation status
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Tracking result
   */
  async trackIntervention(familyId, interventionType, status, notes = null) {
    try {
      const url = `${this.apiBaseUrl}/burnout/intervention/track`;
      const response = await axios.post(url, {
        familyId,
        interventionType,
        status,
        notes
      });
      
      return response.data;
    } catch (error) {
      console.error('Error tracking intervention:', error);
      throw error;
    }
  }
}

export default new AllieTaskWeightService();