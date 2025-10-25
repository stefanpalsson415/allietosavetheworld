/**
 * KnowledgeGraphService.js
 *
 * Frontend service for Knowledge Graph API calls
 * Production-ready with error handling and caching
 */

class KnowledgeGraphService {
  constructor() {
    // Use environment variable for API URL (falls back to localhost for dev)
    this.apiUrl = process.env.REACT_APP_CLOUD_RUN_URL || 'http://localhost:8080';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get invisible labor analysis for family
   */
  async getInvisibleLaborAnalysis(familyId) {
    const cacheKey = `invisible_labor_${familyId}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiUrl}/api/knowledge-graph/invisible-labor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ familyId })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this._setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get invisible labor analysis:', error);
      throw error;
    }
  }

  /**
   * Get invisible labor analysis by category
   * Returns array of category breakdowns for survey personalization
   * Format: [{category, anticipation, monitoring, execution}, ...]
   */
  async getInvisibleLaborByCategory(familyId) {
    const cacheKey = `invisible_labor_category_${familyId}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiUrl}/api/knowledge-graph/invisible-labor-by-category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ familyId })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this._setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get category-based invisible labor:', error);
      throw error;
    }
  }

  /**
   * Get coordination analysis for family
   */
  async getCoordinationAnalysis(familyId) {
    const cacheKey = `coordination_${familyId}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiUrl}/api/knowledge-graph/coordination`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ familyId })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this._setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get coordination analysis:', error);
      throw error;
    }
  }

  /**
   * Get temporal patterns (when tasks are created)
   */
  async getTemporalPatterns(familyId, startDate = null, endDate = null) {
    try {
      const response = await fetch(`${this.apiUrl}/api/knowledge-graph/temporal-patterns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ familyId, startDate, endDate })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get temporal patterns:', error);
      throw error;
    }
  }

  /**
   * Get graph data for visualization
   * Returns nodes and links formatted for D3.js
   */
  async getGraphData(familyId) {
    const cacheKey = `graph_data_${familyId}`;
    const cached = this._getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.apiUrl}/api/knowledge-graph/graph-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ familyId })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this._setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to get graph data:', error);
      throw error;
    }
  }

  /**
   * Sync family data from Firestore to Neo4j
   */
  async syncFamilyData(familyId) {
    try {
      const response = await fetch(`${this.apiUrl}/api/knowledge-graph/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ familyId })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Clear cache after sync
      this._clearFamilyCache(familyId);

      return await response.json();
    } catch (error) {
      console.error('Failed to sync family data:', error);
      throw error;
    }
  }

  /**
   * Get insights for a specific node (person, task, etc)
   */
  async getNodeInsights(familyId, nodeId, nodeType) {
    try {
      const response = await fetch(`${this.apiUrl}/api/knowledge-graph/node-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ familyId, nodeId, nodeType })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get node insights:', error);
      throw error;
    }
  }

  /**
   * Query knowledge graph using natural language
   * Phase 1: Intent classification + template queries
   */
  async queryNaturalLanguage(question, familyId, userId = null, userName = null) {
    try {
      const response = await fetch(`${this.apiUrl}/api/knowledge-graph/natural-language`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          familyId,
          userId,
          userName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to query knowledge graph with natural language:', error);
      return {
        success: false,
        error: error.message,
        question
      };
    }
  }

  // Cache helpers
  _getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const { data, timestamp } = cached;
    if (Date.now() - timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return data;
  }

  _setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  _clearFamilyCache(familyId) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.includes(familyId)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clearCache() {
    this.cache.clear();
  }

  /**
   * Get temporal analysis (historical patterns, trends, heat maps)
   */
  async getTemporalAnalysis(familyId, daysBack = 30) {
    const cacheKey = `temporal-${familyId}-${daysBack}`;

    if (this.cache.has(cacheKey)) {
      console.log('📦 Using cached temporal analysis');
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/knowledge-graph/temporal-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ familyId, daysBack })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      this.cache.set(cacheKey, data);

      return data;
    } catch (error) {
      console.error('Error fetching temporal analysis:', error);
      throw error;
    }
  }

  /**
   * Get predictive insights (task predictions, burnout risks, conflict detection)
   */
  async getPredictiveInsights(familyId, daysAhead = 7) {
    const cacheKey = `predictive-${familyId}-${daysAhead}`;

    // Cache for shorter time (2 minutes) since predictions should be more real-time
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < 2 * 60 * 1000) { // 2 minute cache
        console.log('📦 Using cached predictive insights');
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/knowledge-graph/predictive-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ familyId, daysAhead })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      this._setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching predictive insights:', error);
      throw error;
    }
  }
}

// Singleton instance
const knowledgeGraphService = new KnowledgeGraphService();

export default knowledgeGraphService;
