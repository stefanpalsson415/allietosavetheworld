/**
 * AllieMemoryService - 4-Tier Memory Architecture
 *
 * Memory Tiers:
 * 1. Working Memory - Immediate context (in-memory, 5-10 items)
 * 2. Episodic Memory - Recent interactions (Redis, 24-48 hours)
 * 3. Semantic Memory - Knowledge base (Pinecone vector DB)
 * 4. Procedural Memory - Action patterns (Firestore)
 */

const admin = require('firebase-admin');
const Redis = require('redis');
const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');

class AllieMemoryService {
  constructor(config = {}) {
    // Initialize services
    this.db = admin.firestore();

    // Redis configuration
    this.redisConfig = {
      url: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      password: config.redisPassword || process.env.REDIS_PASSWORD,
      ...config.redis
    };

    // Pinecone configuration
    this.pineconeConfig = {
      apiKey: config.pineconeApiKey || process.env.PINECONE_API_KEY,
      environment: config.pineconeEnvironment || process.env.PINECONE_ENVIRONMENT,
      indexName: config.pineconeIndex || process.env.PINECONE_INDEX || 'allie-memory'
    };

    // OpenAI configuration (for embeddings)
    this.openaiConfig = {
      apiKey: config.openaiApiKey || process.env.OPENAI_API_KEY
    };

    // Memory limits
    this.limits = {
      workingMemory: config.workingMemoryLimit || 10,
      episodicMemoryTTL: config.episodicTTL || 48 * 60 * 60, // 48 hours in seconds
      semanticMemoryLimit: config.semanticLimit || 100,
      proceduralMemoryLimit: config.proceduralLimit || 50
    };

    // In-memory working memory
    this.workingMemory = new Map();

    // Initialize connections
    this.initializeConnections();
  }

  async initializeConnections() {
    try {
      // Initialize Redis - skip in production Cloud Run
      const isCloudRun = process.env.K_SERVICE !== undefined;
      if (this.redisConfig.url && !isCloudRun) {
        try {
          this.redis = Redis.createClient(this.redisConfig);
          this.redis.on('error', (err) => console.error('Redis Error:', err));
          this.redis.on('connect', () => console.log('✅ Redis connected'));
          await this.redis.connect();
        } catch (redisError) {
          console.warn('⚠️ Redis connection failed - episodic memory will use Firestore fallback', redisError.message);
          this.redis = null;
        }
      } else {
        console.log('ℹ️ Redis disabled - episodic memory will use Firestore');
      }

      // Initialize Pinecone
      if (this.pineconeConfig.apiKey) {
        this.pinecone = new Pinecone({
          apiKey: this.pineconeConfig.apiKey
        });

        // Get or create index
        try {
          this.pineconeIndex = this.pinecone.Index(this.pineconeConfig.indexName);
          console.log('✅ Pinecone connected');
        } catch (error) {
          console.warn('⚠️ Pinecone index not found, creating...');
          await this.createPineconeIndex();
        }
      } else {
        console.warn('⚠️ Pinecone not configured - semantic memory disabled');
      }

      // Initialize OpenAI
      if (this.openaiConfig.apiKey) {
        this.openai = new OpenAI(this.openaiConfig);
        console.log('✅ OpenAI configured for embeddings');
      } else {
        console.warn('⚠️ OpenAI not configured - semantic search disabled');
      }

    } catch (error) {
      console.error('Memory service initialization error:', error);
    }
  }

  async createPineconeIndex() {
    try {
      await this.pinecone.createIndex({
        name: this.pineconeConfig.indexName,
        dimension: 1536, // OpenAI embedding dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-west-2'
          }
        }
      });

      // Wait for index to be ready
      await new Promise(resolve => setTimeout(resolve, 10000));

      this.pineconeIndex = this.pinecone.Index(this.pineconeConfig.indexName);
      console.log('✅ Pinecone index created');
    } catch (error) {
      console.error('Failed to create Pinecone index:', error);
    }
  }

  // ========== WORKING MEMORY (Tier 1) ==========

  addToWorkingMemory(familyId, key, value) {
    const memoryKey = `${familyId}:${key}`;

    // Get or create family's working memory
    if (!this.workingMemory.has(familyId)) {
      this.workingMemory.set(familyId, new Map());
    }

    const familyMemory = this.workingMemory.get(familyId);

    // Enforce memory limit (FIFO)
    if (familyMemory.size >= this.limits.workingMemory) {
      const firstKey = familyMemory.keys().next().value;
      familyMemory.delete(firstKey);
    }

    // Add new memory with timestamp
    familyMemory.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0
    });

    console.log(`Working memory updated for ${familyId}: ${key}`);
  }

  getFromWorkingMemory(familyId, key) {
    const familyMemory = this.workingMemory.get(familyId);
    if (!familyMemory) return null;

    const memory = familyMemory.get(key);
    if (memory) {
      memory.accessCount++;
      memory.lastAccessed = Date.now();
      return memory.value;
    }

    return null;
  }

  getWorkingMemoryContext(familyId) {
    const familyMemory = this.workingMemory.get(familyId);
    if (!familyMemory) return [];

    return Array.from(familyMemory.entries()).map(([key, data]) => ({
      key,
      value: data.value,
      timestamp: data.timestamp,
      accessCount: data.accessCount
    }));
  }

  // ========== EPISODIC MEMORY (Tier 2) ==========

  async addToEpisodicMemory(familyId, interaction) {
    if (!this.redis) return;

    const key = `episodic:${familyId}:${Date.now()}`;
    const value = JSON.stringify({
      ...interaction,
      timestamp: new Date().toISOString()
    });

    try {
      // Store with TTL
      await this.redis.setEx(key, this.limits.episodicMemoryTTL, value);

      // Add to sorted set for easy retrieval
      await this.redis.zAdd(`episodic:${familyId}:index`, {
        score: Date.now(),
        value: key
      });

      console.log(`Episodic memory stored for ${familyId}`);
    } catch (error) {
      console.error('Episodic memory storage failed:', error);
    }
  }

  async getRecentEpisodicMemory(familyId, limit = 10) {
    if (!this.redis) return [];

    try {
      // Get most recent keys from sorted set
      const keys = await this.redis.zRange(
        `episodic:${familyId}:index`,
        -limit,
        -1,
        { REV: true }
      );

      // Fetch actual memories
      const memories = [];
      for (const key of keys) {
        const value = await this.redis.get(key);
        if (value) {
          memories.push(JSON.parse(value));
        }
      }

      return memories;
    } catch (error) {
      console.error('Episodic memory retrieval failed:', error);
      return [];
    }
  }

  // ========== SEMANTIC MEMORY (Tier 3) ==========

  async addToSemanticMemory(familyId, content, metadata = {}) {
    if (!this.pinecone || !this.openai) return;

    try {
      // Generate embedding
      const embedding = await this.generateEmbedding(content);

      // Create unique ID
      const id = `${familyId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Upsert to Pinecone
      await this.pineconeIndex.upsert([{
        id,
        values: embedding,
        metadata: {
          familyId,
          content,
          ...metadata,
          timestamp: new Date().toISOString()
        }
      }]);

      console.log(`Semantic memory stored for ${familyId}`);
      return id;
    } catch (error) {
      console.error('Semantic memory storage failed:', error);
    }
  }

  async searchSemanticMemory(familyId, query, limit = 5) {
    if (!this.pinecone || !this.openai) return [];

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Search Pinecone
      const results = await this.pineconeIndex.query({
        vector: queryEmbedding,
        filter: { familyId },
        topK: limit,
        includeMetadata: true
      });

      return results.matches.map(match => ({
        score: match.score,
        content: match.metadata.content,
        metadata: match.metadata
      }));
    } catch (error) {
      console.error('Semantic memory search failed:', error);
      return [];
    }
  }

  async generateEmbedding(text) {
    const response = await this.openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text
    });

    return response.data[0].embedding;
  }

  // ========== PROCEDURAL MEMORY (Tier 4) ==========

  async addToProceduralMemory(familyId, pattern) {
    try {
      const docRef = await this.db.collection('procedural_memory').add({
        familyId,
        pattern,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        executionCount: 0,
        successRate: 0
      });

      console.log(`Procedural memory stored for ${familyId}: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('Procedural memory storage failed:', error);
    }
  }

  async getProceduralPatterns(familyId, context = {}) {
    try {
      const snapshot = await this.db.collection('procedural_memory')
        .where('familyId', '==', familyId)
        .orderBy('successRate', 'desc')
        .orderBy('executionCount', 'desc')
        .limit(this.limits.proceduralMemoryLimit)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Procedural memory retrieval failed:', error);
      return [];
    }
  }

  async updateProceduralPattern(patternId, success) {
    try {
      const docRef = this.db.collection('procedural_memory').doc(patternId);
      const doc = await docRef.get();

      if (!doc.exists) return;

      const data = doc.data();
      const newCount = (data.executionCount || 0) + 1;
      const successCount = (data.successCount || 0) + (success ? 1 : 0);
      const successRate = successCount / newCount;

      await docRef.update({
        executionCount: newCount,
        successCount,
        successRate,
        lastExecuted: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Procedural pattern ${patternId} updated: ${successRate * 100}% success rate`);
    } catch (error) {
      console.error('Procedural pattern update failed:', error);
    }
  }

  // ========== UNIFIED MEMORY INTERFACE ==========

  async getFullMemoryContext(familyId, query = null) {
    const context = {
      working: [],
      episodic: [],
      semantic: [],
      procedural: []
    };

    // Get working memory
    context.working = this.getWorkingMemoryContext(familyId);

    // Get recent episodic memory
    context.episodic = await this.getRecentEpisodicMemory(familyId, 5);

    // Search semantic memory if query provided
    if (query) {
      context.semantic = await this.searchSemanticMemory(familyId, query, 3);
    }

    // Get relevant procedural patterns
    context.procedural = await this.getProceduralPatterns(familyId);

    return context;
  }

  async storeInteraction(familyId, userId, message, response, toolsUsed = []) {
    const interaction = {
      familyId,
      userId,
      message,
      response,
      toolsUsed,
      timestamp: new Date().toISOString()
    };

    // Add to working memory (most recent)
    this.addToWorkingMemory(familyId, `last_interaction`, {
      message: message.substring(0, 100),
      timestamp: Date.now()
    });

    // Add to episodic memory (24-48 hours)
    await this.addToEpisodicMemory(familyId, interaction);

    // Add to semantic memory if significant
    if (toolsUsed.length > 0 || message.length > 50) {
      const content = `User: ${message}\nAllie: ${response}\nTools: ${toolsUsed.join(', ')}`;
      await this.addToSemanticMemory(familyId, content, {
        userId,
        hasTools: toolsUsed.length > 0,
        messageLength: message.length
      });
    }

    // Update procedural patterns if tools were used successfully
    if (toolsUsed.length > 0) {
      const pattern = {
        trigger: message,
        actions: toolsUsed,
        context: { userId }
      };
      await this.addToProceduralMemory(familyId, pattern);
    }
  }

  /**
   * Store task completion pattern for learning
   * @param {string} familyId - Family ID
   * @param {object} taskData - Task information
   */
  async storeTaskPattern(familyId, taskData) {
    try {
      const pattern = {
        familyId,
        taskTitle: taskData.title,
        category: taskData.category,
        assignedTo: taskData.assignedTo,
        priority: taskData.priority,
        completionTime: taskData.completionTime || null,
        dayOfWeek: new Date().getDay(),
        hourOfDay: new Date().getHours(),
        timestamp: Date.now()
      };

      // Store in Firestore (procedural memory)
      await this.db.collection('taskPatterns').add(pattern);

      // Store in Pinecone for semantic search
      if (this.pineconeIndex && this.openai) {
        const embedding = await this.createEmbedding(
          `${taskData.category} task: ${taskData.title} assigned to ${taskData.assignedTo}`
        );

        await this.pineconeIndex.upsert([{
          id: `task_${familyId}_${Date.now()}`,
          values: embedding,
          metadata: {
            type: 'task_pattern',
            familyId,
            taskTitle: taskData.title,
            category: taskData.category,
            assignedTo: taskData.assignedTo,
            timestamp: Date.now()
          }
        }]);
      }

      // Store in Redis for quick access (episodic memory)
      if (this.redis) {
        const key = `task_history:${familyId}`;
        await this.redis.lPush(key, JSON.stringify(pattern));
        await this.redis.lTrim(key, 0, 99); // Keep last 100 tasks
        await this.redis.expire(key, this.limits.episodicMemoryTTL);
      }

      console.log(`✅ Stored task pattern for ${taskData.title}`);
    } catch (error) {
      console.error('Error storing task pattern:', error);
    }
  }

  /**
   * Recall task patterns for intelligent suggestions
   * @param {string} familyId - Family ID
   * @param {object} context - Current context (time, workload, etc.)
   * @returns {Promise<Array>} Relevant task patterns
   */
  async recallTaskPatterns(familyId, context = {}) {
    try {
      const patterns = [];

      // Get recent patterns from Redis (fast)
      if (this.redis) {
        try {
          const key = `task_history:${familyId}`;
          const recentTasks = await this.redis.lRange(key, 0, 19); // Last 20 tasks
          patterns.push(...recentTasks.map(t => JSON.parse(t)));
        } catch (redisError) {
          console.warn('Redis recall failed, using Firestore');
        }
      }

      // If Redis unavailable, get from Firestore
      if (patterns.length === 0) {
        const snapshot = await this.db.collection('taskPatterns')
          .where('familyId', '==', familyId)
          .orderBy('timestamp', 'desc')
          .limit(20)
          .get();

        patterns.push(...snapshot.docs.map(doc => doc.data()));
      }

      // Analyze patterns
      const analysis = {
        commonCategories: this.findCommonCategories(patterns),
        preferredTimes: this.findPreferredTimes(patterns),
        workloadDistribution: this.analyzeWorkloadDistribution(patterns),
        avgCompletionTime: this.calculateAvgCompletionTime(patterns),
        recentTrends: patterns.slice(0, 10)
      };

      return analysis;
    } catch (error) {
      console.error('Error recalling task patterns:', error);
      return { commonCategories: [], preferredTimes: {}, workloadDistribution: {}, recentTrends: [] };
    }
  }

  /**
   * Find common task categories
   */
  findCommonCategories(patterns) {
    const categoryCounts = {};
    patterns.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });
    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category]) => category);
  }

  /**
   * Find preferred task completion times
   */
  findPreferredTimes(patterns) {
    const hourCounts = {};
    patterns.forEach(p => {
      const hour = p.hourOfDay;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    return hourCounts;
  }

  /**
   * Analyze workload distribution across family members
   */
  analyzeWorkloadDistribution(patterns) {
    const distribution = {};
    patterns.forEach(p => {
      distribution[p.assignedTo] = (distribution[p.assignedTo] || 0) + 1;
    });
    return distribution;
  }

  /**
   * Calculate average task completion time
   */
  calculateAvgCompletionTime(patterns) {
    const timesWithCompletion = patterns.filter(p => p.completionTime);
    if (timesWithCompletion.length === 0) return null;

    const sum = timesWithCompletion.reduce((acc, p) => acc + p.completionTime, 0);
    return sum / timesWithCompletion.length;
  }

  // Cleanup method
  async cleanup() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

module.exports = AllieMemoryService;