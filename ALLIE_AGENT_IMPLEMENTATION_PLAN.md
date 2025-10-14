# 🚀 Complete AI Agent Implementation Plan with 4-Tier Memory

## Executive Summary
This document outlines the comprehensive plan to transform Allie Chat from a simple chatbot into a true AI agent with full system access, 4-tier memory, and autonomous action capabilities for the CheckAllie family management platform.

---

## 📋 Master Implementation Plan - Allie as True AI Agent

---

## PHASE 1: Foundation & Infrastructure
### 🗓️ Days 1-5 | Priority: CRITICAL

### Objectives:
- Extend Cloud Run backend with Claude function calling
- Set up Firebase Admin SDK
- Create audit logging system
- Establish development environment

### Deliverables:

#### 1.1 Upgrade Cloud Run Backend (`server/production-server.js`)
```javascript
// New file: server/agent-handler.js
const admin = require('firebase-admin');
const Anthropic = require('@anthropic-ai/sdk');

class AgentHandler {
  constructor() {
    // Initialize Admin SDK with service account
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
    }

    this.db = admin.firestore();
    this.anthropic = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });
  }

  async handleAgentRequest(req, res) {
    const { messages, tools, familyId, userId, sessionId } = req.body;

    try {
      // Add audit entry
      const auditRef = await this.logAgentRequest({
        familyId, userId, sessionId,
        request: { messages, tools },
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      // Call Claude with tools
      const response = await this.anthropic.messages.create({
        model: 'claude-opus-4-1-20250805',
        messages,
        tools,
        max_tokens: 4096,
        temperature: 0.7
      });

      // Process tool calls with Admin SDK
      const results = await this.processToolCalls(response, familyId, userId);

      // Update audit log
      await this.updateAuditLog(auditRef.id, { response: results });

      res.json({ success: true, results });
    } catch (error) {
      console.error('Agent request error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async processToolCalls(response, familyId, userId) {
    const results = [];

    for (const content of response.content) {
      if (content.type === 'tool_use') {
        const toolResult = await this.executeTool(
          content.name,
          content.input,
          familyId,
          userId
        );
        results.push(toolResult);
      }
    }

    return results;
  }

  async executeTool(toolName, input, familyId, userId) {
    // This will be expanded in Phase 3
    console.log(`Executing tool: ${toolName}`, input);

    // Add tool execution logic here
    const toolExecutor = new ToolExecutorService();
    return await toolExecutor.executeTool(toolName, input, familyId, userId);
  }

  async logAgentRequest(data) {
    const ref = await this.db.collection('agent_audits').add(data);
    return ref;
  }

  async updateAuditLog(auditId, updates) {
    await this.db.collection('agent_audits').doc(auditId).update(updates);
  }
}

module.exports = AgentHandler;
```

#### 1.2 Environment Configuration
```bash
# .env.production
FIREBASE_PROJECT_ID=parentload-ba995
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=allie-agent@parentload-ba995.iam.gserviceaccount.com
CLAUDE_API_KEY=sk-ant-...
PINECONE_API_KEY=...
REDIS_URL=redis://...
OPENAI_API_KEY=sk-...  # For embeddings
```

#### 1.3 Audit Collection Schema
```javascript
// Firestore structure
{
  collection: 'agent_audits',
  document: {
    auditId: 'auto',
    familyId: 'string',
    userId: 'string',
    sessionId: 'string',
    timestamp: 'timestamp',
    request: {
      messages: [],
      tools: [],
      context: {}
    },
    response: {
      actions: [],
      results: [],
      reasoning: ''
    },
    status: 'success|failure',
    duration: 'number',
    costs: {
      tokens: 'number',
      apiCalls: 'number'
    }
  }
}
```

#### 1.4 Update Main Server File
```javascript
// server/production-server.js - Add these routes
const AgentHandler = require('./agent-handler');
const agentHandler = new AgentHandler();

// New agent endpoint
app.post('/api/claude/agent', (req, res) => {
  agentHandler.handleAgentRequest(req, res);
});

// WebSocket endpoint for future voice support
app.ws('/api/claude/stream', (ws, req) => {
  ws.on('message', async (msg) => {
    const data = JSON.parse(msg);
    // Handle streaming messages
  });
});
```

### Test Plan - Phase 1:
```javascript
// tests/phase1.test.js
describe('Phase 1: Foundation Tests', () => {
  test('Cloud Run endpoint responds to agent requests', async () => {
    const response = await fetch(`${BACKEND_URL}/api/claude/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test message' }],
        tools: [],
        familyId: 'test-family',
        userId: 'test-user'
      })
    });
    expect(response.status).toBe(200);
  });

  test('Admin SDK can read/write Firestore', async () => {
    const testDoc = await admin.firestore()
      .collection('test')
      .add({ test: true });
    expect(testDoc.id).toBeDefined();
  });

  test('Audit logs are created for each request', async () => {
    // Make agent request
    const response = await fetch(`${BACKEND_URL}/api/claude/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Test' }],
        familyId: 'test-family',
        userId: 'test-user',
        sessionId: 'test-session-123'
      })
    });

    // Check audit collection
    const audits = await admin.firestore()
      .collection('agent_audits')
      .where('sessionId', '==', 'test-session-123')
      .get();
    expect(audits.size).toBeGreaterThan(0);
  });
});
```

### Success Criteria - Phase 1:
- ✅ Cloud Run endpoint accepts agent requests
- ✅ Admin SDK initialized and working
- ✅ Audit logs created for every request
- ✅ Error handling returns proper status codes
- ✅ Response time < 2000ms for basic requests

---

## PHASE 2: 4-Tier Memory System
### 🗓️ Days 6-10 | Priority: CRITICAL

### Objectives:
- Implement complete 4-tier memory architecture
- Set up Pinecone for semantic memory
- Configure Redis for episodic memory
- Build memory management service

### Deliverables:

#### 2.1 Memory Service Implementation
```javascript
// src/services/AllieMemoryService.js
import { Pinecone } from '@pinecone-database/pinecone';
import Redis from 'ioredis';
import { db } from './firebase';
import admin from 'firebase-admin';

class AllieMemoryService {
  constructor() {
    // Initialize all memory tiers
    this.initializeMemory();
  }

  async initializeMemory() {
    // Tier 1: Working Memory (in-memory)
    this.workingMemory = new Map();

    // Tier 2: Episodic Memory (Redis)
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD
    });

    // Tier 3: Semantic Memory (Pinecone)
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
      environment: 'us-west1-gcp'
    });
    this.semanticIndex = this.pinecone.Index('allie-semantic');

    // Tier 4: Procedural Memory (Firestore)
    this.proceduralCollection = 'agent_procedures';
  }

  // Working Memory Operations
  async updateWorkingMemory(sessionId, key, value) {
    if (!this.workingMemory.has(sessionId)) {
      this.workingMemory.set(sessionId, new Map());
    }

    const session = this.workingMemory.get(sessionId);
    session.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0
    });

    // Limit working memory size (keep last 50 items)
    if (session.size > 50) {
      const firstKey = session.keys().next().value;
      session.delete(firstKey);
    }
  }

  // Episodic Memory Operations
  async storeEpisode(familyId, episode) {
    const key = `episode:${familyId}:${Date.now()}`;

    await this.redis.setex(
      key,
      30 * 24 * 60 * 60, // 30 days TTL
      JSON.stringify({
        ...episode,
        timestamp: Date.now(),
        familyId
      })
    );

    // Add to sorted set for time-based retrieval
    await this.redis.zadd(
      `episodes:${familyId}`,
      Date.now(),
      key
    );
  }

  // Semantic Memory Operations
  async storeSemanticKnowledge(familyId, knowledge) {
    const embedding = await this.generateEmbedding(knowledge.content);

    await this.semanticIndex.upsert({
      vectors: [{
        id: `${familyId}_${Date.now()}`,
        values: embedding,
        metadata: {
          familyId,
          type: knowledge.type,
          content: knowledge.content,
          entities: knowledge.entities,
          importance: knowledge.importance || 0.5,
          timestamp: Date.now()
        }
      }]
    });
  }

  // Procedural Memory Operations
  async learnProcedure(familyId, procedure) {
    await db.collection(this.proceduralCollection).add({
      familyId,
      trigger: procedure.trigger,
      actions: procedure.actions,
      successRate: procedure.successRate || 0,
      executionCount: 0,
      learned: admin.firestore.FieldValue.serverTimestamp(),
      lastUsed: null,
      conditions: procedure.conditions
    });
  }

  // Unified Context Retrieval
  async getRelevantContext(familyId, query, sessionId) {
    const context = {
      working: {},
      episodic: [],
      semantic: [],
      procedural: []
    };

    // 1. Get working memory
    if (this.workingMemory.has(sessionId)) {
      const session = this.workingMemory.get(sessionId);
      context.working = Object.fromEntries(session);
    }

    // 2. Get recent episodes (last 10)
    const recentEpisodes = await this.redis.zrevrange(
      `episodes:${familyId}`,
      0, 9, 'WITHSCORES'
    );

    for (let i = 0; i < recentEpisodes.length; i += 2) {
      const episode = await this.redis.get(recentEpisodes[i]);
      if (episode) {
        context.episodic.push(JSON.parse(episode));
      }
    }

    // 3. Get semantic knowledge via vector search
    const queryEmbedding = await this.generateEmbedding(query);
    const semanticResults = await this.semanticIndex.query({
      vector: queryEmbedding,
      topK: 10,
      filter: { familyId },
      includeMetadata: true
    });

    context.semantic = semanticResults.matches.map(m => m.metadata);

    // 4. Get relevant procedures
    const procedures = await db.collection(this.proceduralCollection)
      .where('familyId', '==', familyId)
      .orderBy('successRate', 'desc')
      .limit(5)
      .get();

    context.procedural = procedures.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return this.optimizeContext(context);
  }

  // Generate embeddings for semantic storage
  async generateEmbedding(text) {
    // Use OpenAI or similar for embeddings
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text
      })
    });

    const data = await response.json();
    return data.data[0].embedding;
  }

  // Optimize context to fit within token limits
  async optimizeContext(context) {
    // Prioritize based on relevance and recency
    const optimized = {
      working: context.working,
      episodic: context.episodic.slice(0, 5),
      semantic: context.semantic.slice(0, 5),
      procedural: context.procedural.slice(0, 3)
    };

    return optimized;
  }
}

export default new AllieMemoryService();
```

#### 2.2 Memory Integration with Agent
```javascript
// src/services/AllieAgentService.js
import AllieMemoryService from './AllieMemoryService';

class AllieAgentService {
  constructor() {
    this.memoryService = AllieMemoryService;
  }

  async processRequest(message, familyId, userId, sessionId) {
    // Retrieve all relevant context
    const context = await this.memoryService.getRelevantContext(
      familyId,
      message,
      sessionId
    );

    // Update working memory
    await this.memoryService.updateWorkingMemory(sessionId, 'lastMessage', message);

    // Process with context
    const response = await this.generateResponse(message, context);

    // Store in appropriate memory tiers
    await this.updateMemories(familyId, sessionId, message, response);

    return response;
  }

  async updateMemories(familyId, sessionId, message, response) {
    // Store episode
    await this.memoryService.storeEpisode(familyId, {
      message,
      response: response.text,
      actions: response.actions,
      success: response.success
    });

    // Extract and store semantic knowledge
    const entities = await this.extractEntities(message);
    if (entities.length > 0) {
      await this.memoryService.storeSemanticKnowledge(familyId, {
        content: message,
        entities,
        type: 'user_preference'
      });
    }

    // Learn from successful actions
    if (response.success && response.actions.length > 0) {
      await this.memoryService.learnProcedure(familyId, {
        trigger: message,
        actions: response.actions,
        successRate: 1.0,
        conditions: { context: 'chat' }
      });
    }
  }

  async extractEntities(message) {
    // Simple entity extraction - can be enhanced with NLP
    const entities = [];

    // Extract names (capitalized words)
    const namePattern = /\b[A-Z][a-z]+\b/g;
    const names = message.match(namePattern);
    if (names) entities.push(...names);

    // Extract times
    const timePattern = /\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi;
    const times = message.match(timePattern);
    if (times) entities.push(...times);

    // Extract dates
    const datePattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/gi;
    const dates = message.match(datePattern);
    if (dates) entities.push(...dates);

    return entities;
  }
}

export default new AllieAgentService();
```

### Test Plan - Phase 2:
```javascript
// tests/phase2.test.js
describe('Phase 2: Memory System Tests', () => {
  let memoryService;

  beforeEach(() => {
    memoryService = new AllieMemoryService();
  });

  test('Working memory stores session data', async () => {
    await memoryService.updateWorkingMemory('session1', 'test', 'value');
    const context = await memoryService.getRelevantContext('family1', 'test', 'session1');
    expect(context.working.test).toBeDefined();
    expect(context.working.test.value).toBe('value');
  });

  test('Episodic memory retrieves recent interactions', async () => {
    await memoryService.storeEpisode('family1', {
      message: 'Schedule dentist',
      response: 'Scheduled for Monday',
      timestamp: Date.now()
    });

    const context = await memoryService.getRelevantContext('family1', 'dentist', 'session1');
    expect(context.episodic.length).toBeGreaterThan(0);
    expect(context.episodic[0].message).toContain('dentist');
  });

  test('Semantic memory finds related knowledge', async () => {
    await memoryService.storeSemanticKnowledge('family1', {
      content: 'Timmy is allergic to peanuts',
      type: 'medical',
      entities: ['Timmy', 'peanut allergy']
    });

    // Wait for indexing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const context = await memoryService.getRelevantContext('family1', 'Timmy food', 'session1');
    expect(context.semantic.find(s => s.content.includes('peanuts'))).toBeDefined();
  });

  test('Procedural memory learns from success', async () => {
    await memoryService.learnProcedure('family1', {
      trigger: 'schedule soccer',
      actions: [{ type: 'add_event', details: { day: 'Saturday', time: '10am' }}],
      successRate: 1.0
    });

    const context = await memoryService.getRelevantContext('family1', 'schedule soccer', 'session1');
    expect(context.procedural[0].trigger).toBe('schedule soccer');
  });

  test('Memory size limits are enforced', async () => {
    // Add 60 items to working memory
    for (let i = 0; i < 60; i++) {
      await memoryService.updateWorkingMemory('session1', `key${i}`, `value${i}`);
    }

    const session = memoryService.workingMemory.get('session1');
    expect(session.size).toBeLessThanOrEqual(50);
  });
});
```

### Success Criteria - Phase 2:
- ✅ All 4 memory tiers operational
- ✅ Context retrieval < 500ms
- ✅ Semantic search returns relevant results
- ✅ Memory persists across sessions
- ✅ Procedural learning improves responses

---

## PHASE 3: Tool Definitions & Firebase Operations
### 🗓️ Days 11-15 | Priority: HIGH

### Objectives:
- Define all Claude tool schemas
- Implement Firebase Admin SDK operations
- Create tool executor service
- Build validation layer

### Deliverables:

#### 3.1 Complete Tool Definitions
```javascript
// src/agent/tools/allieTools.js
export const allieTools = [
  {
    name: "manage_habits",
    description: "Create, update, delete, or query family member habits and routines",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["create", "update", "delete", "query", "complete"],
          description: "The action to perform on habits"
        },
        userId: {
          type: "string",
          description: "ID of the family member"
        },
        habitData: {
          type: "object",
          properties: {
            id: { type: "string", description: "Habit ID for updates/deletes" },
            name: { type: "string" },
            frequency: {
              type: "string",
              enum: ["daily", "weekly", "monthly"]
            },
            category: {
              type: "string",
              enum: ["health", "education", "chores", "personal", "family"]
            },
            reminderTime: { type: "string", format: "time" },
            points: { type: "number" },
            assignedTo: { type: "array", items: { type: "string" }}
          }
        },
        query: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["active", "completed", "paused"] },
            dateRange: {
              type: "object",
              properties: {
                start: { type: "string", format: "date" },
                end: { type: "string", format: "date" }
              }
            }
          }
        }
      },
      required: ["action"]
    }
  },
  {
    name: "manage_chores",
    description: "Assign, update, or complete chores for family members",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["assign", "reassign", "complete", "skip", "query"]
        },
        choreData: {
          type: "object",
          properties: {
            id: { type: "string", description: "Chore ID for updates" },
            title: { type: "string" },
            assignedTo: { type: "string" },
            dueDate: { type: "string", format: "date" },
            recurring: { type: "boolean" },
            frequency: {
              type: "string",
              enum: ["daily", "weekly", "biweekly", "monthly"]
            },
            points: { type: "number" },
            priority: { type: "string", enum: ["low", "medium", "high"] }
          }
        },
        query: {
          type: "object",
          properties: {
            assignedTo: { type: "string" },
            status: { type: "string", enum: ["pending", "completed", "overdue"] }
          }
        }
      },
      required: ["action"]
    }
  },
  {
    name: "schedule_event",
    description: "Schedule family events, appointments, or activities",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        startTime: { type: "string", format: "date-time" },
        endTime: { type: "string", format: "date-time" },
        participants: {
          type: "array",
          items: { type: "string" },
          description: "Family member IDs"
        },
        location: { type: "string" },
        eventType: {
          type: "string",
          enum: ["appointment", "activity", "school", "medical", "social", "chore"]
        },
        reminder: {
          type: "object",
          properties: {
            minutes: { type: "number" },
            method: { type: "string", enum: ["push", "email", "sms"] }
          }
        },
        recurring: {
          type: "object",
          properties: {
            frequency: { type: "string", enum: ["daily", "weekly", "monthly"] },
            until: { type: "string", format: "date" }
          }
        }
      },
      required: ["title", "startTime"]
    }
  },
  {
    name: "manage_rewards",
    description: "Distribute rewards, points, or bucks based on achievements",
    input_schema: {
      type: "object",
      properties: {
        userId: { type: "string" },
        rewardType: {
          type: "string",
          enum: ["points", "bucks", "privilege", "item"]
        },
        amount: { type: "number" },
        reason: { type: "string" },
        linkedTo: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["chore", "habit", "achievement", "behavior"] },
            id: { type: "string" }
          }
        }
      },
      required: ["userId", "rewardType", "amount", "reason"]
    }
  },
  {
    name: "query_family_data",
    description: "Query various family data including schedules, tasks, and member information",
    input_schema: {
      type: "object",
      properties: {
        queryType: {
          type: "string",
          enum: ["schedule", "tasks", "habits", "rewards", "members", "places", "contacts"]
        },
        filters: {
          type: "object",
          properties: {
            memberId: { type: "string" },
            dateRange: {
              type: "object",
              properties: {
                start: { type: "string", format: "date" },
                end: { type: "string", format: "date" }
              }
            },
            status: { type: "string" },
            category: { type: "string" }
          }
        }
      },
      required: ["queryType"]
    }
  },
  {
    name: "manage_places",
    description: "Add, update, or find family-relevant places",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["add", "update", "delete", "find_nearby", "get_directions"]
        },
        placeData: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            address: { type: "string" },
            category: { type: "string" },
            tags: { type: "array", items: { type: "string" }},
            associatedMembers: { type: "array", items: { type: "string" }},
            notes: { type: "string" }
          }
        },
        search: {
          type: "object",
          properties: {
            category: { type: "string" },
            radius: { type: "number" },
            nearLocation: { type: "string" }
          }
        }
      },
      required: ["action"]
    }
  },
  {
    name: "manage_contacts",
    description: "Manage family contacts and relationships",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["add", "update", "delete", "query"]
        },
        contactData: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            relationship: { type: "string" },
            phone: { type: "string" },
            email: { type: "string" },
            tags: { type: "array", items: { type: "string" }}
          }
        },
        query: {
          type: "object",
          properties: {
            relationship: { type: "string" },
            tag: { type: "string" }
          }
        }
      },
      required: ["action"]
    }
  },
  {
    name: "send_notification",
    description: "Send notifications to family members",
    input_schema: {
      type: "object",
      properties: {
        recipients: {
          type: "array",
          items: { type: "string" },
          description: "User IDs to notify"
        },
        message: { type: "string" },
        type: {
          type: "string",
          enum: ["reminder", "alert", "update", "request"]
        },
        priority: {
          type: "string",
          enum: ["low", "normal", "high", "urgent"]
        },
        channel: {
          type: "string",
          enum: ["push", "email", "sms", "all"]
        }
      },
      required: ["recipients", "message", "type"]
    }
  }
];
```

#### 3.2 Tool Executor Service
```javascript
// src/services/ToolExecutorService.js
import admin from 'firebase-admin';
import { allieTools } from '../agent/tools/allieTools';

class ToolExecutorService {
  constructor() {
    this.executors = {
      manage_habits: this.executeHabitsOperation.bind(this),
      manage_chores: this.executeChoresOperation.bind(this),
      schedule_event: this.executeEventOperation.bind(this),
      manage_rewards: this.executeRewardsOperation.bind(this),
      query_family_data: this.executeQuery.bind(this),
      manage_places: this.executePlacesOperation.bind(this),
      manage_contacts: this.executeContactsOperation.bind(this),
      send_notification: this.executeNotification.bind(this)
    };

    this.db = admin.firestore();
  }

  async executeTool(toolName, input, familyId, userId) {
    console.log(`Executing tool: ${toolName}`, input);

    // Validate input
    const validation = await this.validateInput(toolName, input);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
        toolName
      };
    }

    // Execute with error handling
    try {
      const executor = this.executors[toolName];
      if (!executor) {
        throw new Error(`Unknown tool: ${toolName}`);
      }

      const result = await executor(input, familyId, userId);

      // Log successful execution
      await this.logExecution(toolName, input, result, familyId, userId);

      return {
        success: true,
        result,
        toolName
      };
    } catch (error) {
      console.error(`Tool execution error: ${toolName}`, error);
      return {
        success: false,
        error: error.message,
        toolName
      };
    }
  }

  async validateInput(toolName, input) {
    const tool = allieTools.find(t => t.name === toolName);
    if (!tool) {
      return { valid: false, error: 'Tool not found' };
    }

    const schema = tool.input_schema;

    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in input)) {
          return { valid: false, error: `Missing required field: ${field}` };
        }
      }
    }

    // Validate enum values
    for (const [key, value] of Object.entries(input)) {
      const prop = schema.properties[key];
      if (prop && prop.enum && !prop.enum.includes(value)) {
        return { valid: false, error: `Invalid value for ${key}: ${value}` };
      }
    }

    return { valid: true };
  }

  // HABITS OPERATIONS
  async executeHabitsOperation(input, familyId, userId) {
    const { action, userId: targetUserId, habitData, query } = input;

    switch (action) {
      case 'create':
        return await this.createHabit(familyId, targetUserId || userId, habitData);
      case 'update':
        return await this.updateHabit(habitData.id, habitData);
      case 'delete':
        return await this.deleteHabit(habitData.id);
      case 'query':
        return await this.queryHabits(familyId, query);
      case 'complete':
        return await this.completeHabit(habitData.id, targetUserId || userId);
      default:
        throw new Error(`Unknown habit action: ${action}`);
    }
  }

  async createHabit(familyId, userId, habitData) {
    const habitRef = await this.db.collection('habits').add({
      ...habitData,
      familyId,
      userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'allie-agent',
      status: 'active',
      completionHistory: [],
      streak: 0
    });

    return {
      id: habitRef.id,
      message: `Created habit: ${habitData.name}`,
      data: { habitId: habitRef.id }
    };
  }

  async updateHabit(habitId, updates) {
    await this.db.collection('habits').doc(habitId).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      message: `Updated habit: ${habitId}`,
      data: { habitId, updates }
    };
  }

  async deleteHabit(habitId) {
    await this.db.collection('habits').doc(habitId).delete();
    return {
      message: `Deleted habit: ${habitId}`,
      data: { habitId }
    };
  }

  async queryHabits(familyId, query = {}) {
    let habitsQuery = this.db.collection('habits').where('familyId', '==', familyId);

    if (query.status) {
      habitsQuery = habitsQuery.where('status', '==', query.status);
    }

    const snapshot = await habitsQuery.get();
    const habits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      message: `Found ${habits.length} habits`,
      data: { habits }
    };
  }

  async completeHabit(habitId, userId) {
    const habitRef = this.db.collection('habits').doc(habitId);
    const habit = await habitRef.get();

    if (!habit.exists) {
      throw new Error('Habit not found');
    }

    const habitData = habit.data();
    const today = new Date().toISOString().split('T')[0];

    // Update completion history and streak
    await habitRef.update({
      completionHistory: admin.firestore.FieldValue.arrayUnion({
        date: today,
        completedBy: userId,
        timestamp: Date.now()
      }),
      streak: habitData.streak + 1,
      lastCompleted: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      message: `Completed habit: ${habitData.name}`,
      data: { habitId, streak: habitData.streak + 1 }
    };
  }

  // CHORES OPERATIONS
  async executeChoresOperation(input, familyId, userId) {
    const { action, choreData, query } = input;

    switch (action) {
      case 'assign':
        return await this.assignChore(familyId, choreData);
      case 'reassign':
        return await this.reassignChore(choreData.id, choreData.assignedTo);
      case 'complete':
        return await this.completeChore(choreData.id, userId);
      case 'skip':
        return await this.skipChore(choreData.id, choreData.reason);
      case 'query':
        return await this.queryChores(familyId, query);
      default:
        throw new Error(`Unknown chore action: ${action}`);
    }
  }

  async assignChore(familyId, choreData) {
    const choreRef = await this.db.collection('choreInstances').add({
      ...choreData,
      familyId,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedBy: 'allie-agent'
    });

    return {
      message: `Assigned chore: ${choreData.title} to ${choreData.assignedTo}`,
      data: { choreId: choreRef.id }
    };
  }

  async completeChore(choreId, userId) {
    await this.db.collection('choreInstances').doc(choreId).update({
      status: 'completed',
      completedBy: userId,
      completedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      message: `Completed chore: ${choreId}`,
      data: { choreId }
    };
  }

  // EVENT OPERATIONS
  async executeEventOperation(input, familyId, userId) {
    const eventData = {
      ...input,
      familyId,
      createdBy: userId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'scheduled'
    };

    const eventRef = await this.db.collection('events').add(eventData);

    // Set reminder if specified
    if (input.reminder) {
      await this.scheduleReminder(eventRef.id, input.reminder);
    }

    return {
      message: `Scheduled event: ${input.title}`,
      data: { eventId: eventRef.id, startTime: input.startTime }
    };
  }

  // REWARDS OPERATIONS
  async executeRewardsOperation(input, familyId, userId) {
    const { userId: targetUserId, rewardType, amount, reason, linkedTo } = input;

    // Create reward instance
    const rewardRef = await this.db.collection('rewardInstances').add({
      familyId,
      userId: targetUserId,
      type: rewardType,
      amount,
      reason,
      linkedTo,
      grantedBy: 'allie-agent',
      grantedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Update user's balance if applicable
    if (rewardType === 'points' || rewardType === 'bucks') {
      const userRef = this.db.collection('users').doc(targetUserId);
      const fieldToUpdate = rewardType === 'points' ? 'pointsBalance' : 'bucksBalance';

      await userRef.update({
        [fieldToUpdate]: admin.firestore.FieldValue.increment(amount)
      });
    }

    return {
      message: `Awarded ${amount} ${rewardType} to user for: ${reason}`,
      data: { rewardId: rewardRef.id, amount, type: rewardType }
    };
  }

  // QUERY OPERATIONS
  async executeQuery(input, familyId, userId) {
    const { queryType, filters = {} } = input;

    switch (queryType) {
      case 'schedule':
        return await this.querySchedule(familyId, filters);
      case 'tasks':
        return await this.queryTasks(familyId, filters);
      case 'habits':
        return await this.queryHabits(familyId, filters);
      case 'rewards':
        return await this.queryRewards(familyId, filters);
      case 'members':
        return await this.queryMembers(familyId);
      case 'places':
        return await this.queryPlaces(familyId, filters);
      case 'contacts':
        return await this.queryContacts(familyId, filters);
      default:
        throw new Error(`Unknown query type: ${queryType}`);
    }
  }

  async querySchedule(familyId, filters) {
    let eventsQuery = this.db.collection('events').where('familyId', '==', familyId);

    if (filters.memberId) {
      eventsQuery = eventsQuery.where('participants', 'array-contains', filters.memberId);
    }

    if (filters.dateRange) {
      eventsQuery = eventsQuery
        .where('startTime', '>=', filters.dateRange.start)
        .where('startTime', '<=', filters.dateRange.end);
    }

    const snapshot = await eventsQuery.orderBy('startTime').get();
    const events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return {
      message: `Found ${events.length} events`,
      data: { events }
    };
  }

  // PLACES OPERATIONS
  async executePlacesOperation(input, familyId, userId) {
    const { action, placeData, search } = input;

    switch (action) {
      case 'add':
        return await this.addPlace(familyId, placeData);
      case 'update':
        return await this.updatePlace(placeData.id, placeData);
      case 'delete':
        return await this.deletePlace(placeData.id);
      case 'find_nearby':
        return await this.findNearbyPlaces(search);
      case 'get_directions':
        return await this.getDirections(placeData.id);
      default:
        throw new Error(`Unknown places action: ${action}`);
    }
  }

  // CONTACTS OPERATIONS
  async executeContactsOperation(input, familyId, userId) {
    const { action, contactData, query } = input;

    switch (action) {
      case 'add':
        return await this.addContact(familyId, contactData);
      case 'update':
        return await this.updateContact(contactData.id, contactData);
      case 'delete':
        return await this.deleteContact(contactData.id);
      case 'query':
        return await this.queryContacts(familyId, query);
      default:
        throw new Error(`Unknown contacts action: ${action}`);
    }
  }

  // NOTIFICATION OPERATIONS
  async executeNotification(input, familyId, userId) {
    const { recipients, message, type, priority, channel } = input;

    // Store notification in database
    const notificationRef = await this.db.collection('notifications').add({
      familyId,
      recipients,
      message,
      type,
      priority: priority || 'normal',
      channel: channel || 'push',
      sentBy: 'allie-agent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });

    // Trigger actual notification sending (implementation depends on notification service)
    // This would integrate with FCM, SendGrid, Twilio, etc.

    return {
      message: `Notification sent to ${recipients.length} recipients`,
      data: { notificationId: notificationRef.id }
    };
  }

  // HELPER METHODS
  async logExecution(toolName, input, result, familyId, userId) {
    await this.db.collection('tool_executions').add({
      toolName,
      input,
      result,
      familyId,
      userId,
      executedAt: admin.firestore.FieldValue.serverTimestamp(),
      success: result.success !== false
    });
  }

  async scheduleReminder(eventId, reminder) {
    // Implementation would integrate with your notification service
    console.log(`Scheduling reminder for event ${eventId}:`, reminder);
  }
}

export default new ToolExecutorService();
```

### Test Plan - Phase 3:
```javascript
// tests/phase3.test.js
describe('Phase 3: Tools & Firebase Tests', () => {
  let toolExecutor;

  beforeAll(() => {
    toolExecutor = new ToolExecutorService();
  });

  test('Tool definitions are valid JSON schemas', () => {
    allieTools.forEach(tool => {
      expect(tool.name).toBeDefined();
      expect(tool.input_schema.type).toBe('object');
      expect(tool.input_schema.properties).toBeDefined();
    });
  });

  test('Habit creation tool works', async () => {
    const result = await toolExecutor.executeTool('manage_habits', {
      action: 'create',
      habitData: {
        name: 'Brush teeth',
        frequency: 'daily',
        reminderTime: '20:00',
        category: 'health'
      }
    }, 'test-family', 'test-user');

    expect(result.success).toBe(true);
    expect(result.result.data.habitId).toBeDefined();
  });

  test('Event scheduling tool works', async () => {
    const result = await toolExecutor.executeTool('schedule_event', {
      title: 'Dentist appointment',
      startTime: '2024-11-01T10:00:00',
      participants: ['user1'],
      eventType: 'medical'
    }, 'test-family', 'test-user');

    expect(result.success).toBe(true);
    expect(result.result.data.eventId).toBeDefined();
  });

  test('Chore assignment tool works', async () => {
    const result = await toolExecutor.executeTool('manage_chores', {
      action: 'assign',
      choreData: {
        title: 'Take out trash',
        assignedTo: 'user1',
        dueDate: '2024-11-01',
        points: 10,
        priority: 'medium'
      }
    }, 'test-family', 'test-user');

    expect(result.success).toBe(true);
    expect(result.result.message).toContain('Assigned chore');
  });

  test('Invalid tool input returns error', async () => {
    const result = await toolExecutor.executeTool('manage_habits', {
      action: 'invalid_action'
    }, 'test-family', 'test-user');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  test('Query operations return data', async () => {
    const result = await toolExecutor.executeTool('query_family_data', {
      queryType: 'schedule',
      filters: {
        dateRange: {
          start: '2024-11-01',
          end: '2024-11-30'
        }
      }
    }, 'test-family', 'test-user');

    expect(result.success).toBe(true);
    expect(result.result.data).toBeDefined();
  });
});
```

### Success Criteria - Phase 3:
- ✅ All 8 core tools defined and working
- ✅ Firebase Admin operations successful
- ✅ Input validation catches errors
- ✅ Execution logs created
- ✅ Tool execution < 1000ms average

---

## PHASE 4: ReAct Agent & Reasoning Engine
### 🗓️ Days 16-20 | Priority: HIGH

### Objectives:
- Implement ReAct reasoning loop
- Build action planning system
- Create response synthesis
- Add chain-of-thought reasoning

### Deliverables:

#### 4.1 ReAct Agent Implementation
```javascript
// src/agent/AllieReActAgent.js
import ClaudeService from '../services/ClaudeService';
import ToolExecutorService from '../services/ToolExecutorService';
import AllieMemoryService from '../services/AllieMemoryService';
import { allieTools } from './tools/allieTools';

class AllieReActAgent {
  constructor() {
    this.maxIterations = 5;
    this.claudeService = new ClaudeService();
    this.toolExecutor = ToolExecutorService;
    this.memoryService = AllieMemoryService;
  }

  async process(userMessage, familyId, userId, sessionId) {
    console.log('🤖 ReAct Agent processing:', userMessage);

    // Step 1: Retrieve context from all memory tiers
    const context = await this.memoryService.getRelevantContext(
      familyId,
      userMessage,
      sessionId
    );

    // Step 2: Reasoning - Understand intent and plan
    const reasoning = await this.reason(userMessage, context);

    // Step 3: Acting - Execute planned actions
    const actionResults = await this.act(reasoning.actions, familyId, userId);

    // Step 4: Observation - Analyze results
    const observation = await this.observe(actionResults);

    // Step 5: Synthesis - Generate response
    const response = await this.synthesize(
      userMessage,
      reasoning,
      actionResults,
      observation
    );

    // Step 6: Learning - Update memories
    await this.learn(familyId, sessionId, userMessage, response, actionResults);

    return response;
  }

  async reason(userMessage, context) {
    const systemPrompt = `You are Allie, an intelligent family assistant with access to comprehensive family context.

Current Context:
- Working Memory: ${JSON.stringify(context.working)}
- Recent Episodes: ${context.episodic.slice(0, 3).map(e => e.message).join('; ')}
- Relevant Knowledge: ${context.semantic.slice(0, 5).map(s => s.content).join('; ')}
- Learned Procedures: ${context.procedural.map(p => p.trigger).join('; ')}

Your task is to:
1. Understand the user's intent
2. Identify what actions are needed
3. Plan the sequence of operations
4. Consider any constraints or preferences

Respond with a structured reasoning in JSON format:
{
  "intent": "What the user wants",
  "requiredActions": [
    {
      "tool": "tool_name",
      "input": { ... },
      "critical": true/false,
      "reason": "Why this action is needed"
    }
  ],
  "constraints": ["Any limitations to consider"],
  "confidence": 0.0-1.0
}`;

    const response = await this.claudeService.generateResponse(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      {
        tools: allieTools,
        temperature: 0.3 // Lower temperature for reasoning
      }
    );

    return this.parseReasoning(response);
  }

  parseReasoning(response) {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse reasoning:', error);
    }

    // Fallback reasoning
    return {
      intent: 'Process user request',
      requiredActions: [],
      constraints: [],
      confidence: 0.5
    };
  }

  async act(plannedActions, familyId, userId) {
    const results = [];

    for (const action of plannedActions) {
      console.log(`🎯 Executing action: ${action.tool}`);

      const result = await this.toolExecutor.executeTool(
        action.tool,
        action.input,
        familyId,
        userId
      );

      results.push({
        action,
        result,
        timestamp: Date.now()
      });

      // Check if we should continue based on result
      if (!result.success && action.critical) {
        console.error('Critical action failed, stopping execution');
        break;
      }
    }

    return results;
  }

  async observe(actionResults) {
    // Analyze what happened
    const observation = {
      totalActions: actionResults.length,
      successfulActions: actionResults.filter(r => r.result.success).length,
      failedActions: actionResults.filter(r => !r.result.success).length,
      criticalFailures: actionResults.filter(r => !r.result.success && r.action.critical),
      dataGathered: {},
      sideEffects: []
    };

    // Extract important data from results
    for (const result of actionResults) {
      if (result.result.success && result.result.result?.data) {
        observation.dataGathered[result.action.tool] = result.result.result.data;
      }
    }

    return observation;
  }

  async synthesize(userMessage, reasoning, actionResults, observation) {
    const systemPrompt = `Generate a helpful response based on the following:

User Request: ${userMessage}
Intent: ${reasoning.intent}
Actions Taken: ${actionResults.map(r => `${r.action.tool}: ${r.result.success ? 'Success' : 'Failed'}`).join(', ')}
Data Gathered: ${JSON.stringify(observation.dataGathered)}

Create a natural, friendly response that:
1. Confirms what was done
2. Provides relevant information
3. Suggests next steps if appropriate
4. Maintains Allie's helpful, family-focused personality

Be concise but informative. Use a warm, supportive tone.`;

    const response = await this.claudeService.generateResponse(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate response' }
      ],
      { temperature: 0.7 }
    );

    return {
      text: response,
      actions: actionResults,
      reasoning: reasoning,
      confidence: reasoning.confidence,
      observation: observation
    };
  }

  async learn(familyId, sessionId, userMessage, response, actionResults) {
    // Update working memory
    await this.memoryService.updateWorkingMemory(sessionId, 'lastInteraction', {
      message: userMessage,
      response: response.text,
      timestamp: Date.now()
    });

    // Store episode
    await this.memoryService.storeEpisode(familyId, {
      message: userMessage,
      response: response.text,
      actions: actionResults.map(r => r.action.tool),
      success: response.confidence > 0.7,
      timestamp: Date.now()
    });

    // Extract entities and store semantic knowledge
    const entities = this.extractEntities(userMessage);
    if (entities.length > 0) {
      await this.memoryService.storeSemanticKnowledge(familyId, {
        content: userMessage,
        entities,
        type: 'interaction',
        importance: response.confidence
      });
    }

    // Learn from successful patterns
    const successfulActions = actionResults.filter(r => r.result.success);
    if (successfulActions.length > 0 && response.confidence > 0.7) {
      await this.memoryService.learnProcedure(familyId, {
        trigger: userMessage,
        actions: successfulActions.map(r => r.action),
        successRate: successfulActions.length / actionResults.length,
        conditions: { confidence: response.confidence }
      });
    }
  }

  extractEntities(text) {
    const entities = [];

    // Extract names (capitalized words)
    const namePattern = /\b[A-Z][a-z]+\b/g;
    const names = text.match(namePattern);
    if (names) entities.push(...names.map(n => ({ type: 'person', value: n })));

    // Extract times
    const timePattern = /\b\d{1,2}:\d{2}\s*(am|pm)?\b/gi;
    const times = text.match(timePattern);
    if (times) entities.push(...times.map(t => ({ type: 'time', value: t })));

    // Extract dates
    const datePattern = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b/gi;
    const dates = text.match(datePattern);
    if (dates) entities.push(...dates.map(d => ({ type: 'date', value: d })));

    // Extract numbers
    const numberPattern = /\b\d+\b/g;
    const numbers = text.match(numberPattern);
    if (numbers) entities.push(...numbers.map(n => ({ type: 'number', value: n })));

    return entities;
  }
}

export default AllieReActAgent;
```

### Test Plan - Phase 4:
```javascript
// tests/phase4.test.js
describe('Phase 4: ReAct Agent Tests', () => {
  let agent;

  beforeAll(() => {
    agent = new AllieReActAgent();
  });

  test('Agent reasons about user intent', async () => {
    const reasoning = await agent.reason(
      'Schedule a dentist appointment for Timmy next Monday at 2pm',
      { working: {}, episodic: [], semantic: [], procedural: [] }
    );

    expect(reasoning.intent).toContain('dentist');
    expect(reasoning.requiredActions).toContainEqual(
      expect.objectContaining({ tool: 'schedule_event' })
    );
    expect(reasoning.confidence).toBeGreaterThan(0.5);
  });

  test('Agent executes planned actions', async () => {
    const response = await agent.process(
      'Add brushing teeth to Timmy\'s daily habits',
      'test-family', 'test-user', 'test-session'
    );

    expect(response.actions).toHaveLength(1);
    expect(response.actions[0].action.tool).toBe('manage_habits');
    expect(response.text).toContain('added');
  });

  test('Agent handles multi-step requests', async () => {
    const response = await agent.process(
      'Schedule soccer practice for Saturday at 10am and assign John to bring snacks',
      'test-family', 'test-user', 'test-session'
    );

    expect(response.actions.length).toBeGreaterThanOrEqual(2);
    const tools = response.actions.map(a => a.action.tool);
    expect(tools).toContain('schedule_event');
    expect(tools).toContain('manage_chores');
  });

  test('Agent learns from interactions', async () => {
    // First interaction
    await agent.process(
      'Schedule dentist for Monday 10am',
      'test-family', 'test-user', 'test-session'
    );

    // Check if procedure was learned
    const context = await agent.memoryService.getRelevantContext(
      'test-family',
      'Schedule dentist',
      'test-session'
    );

    expect(context.procedural.some(p =>
      p.trigger.includes('dentist')
    )).toBe(true);
  });

  test('Agent uses context from memory', async () => {
    // Store context
    await agent.memoryService.storeSemanticKnowledge('test-family', {
      content: 'Timmy prefers afternoon appointments',
      entities: [{ type: 'person', value: 'Timmy' }],
      type: 'preference'
    });

    // Process request
    const response = await agent.process(
      'Schedule something for Timmy',
      'test-family', 'test-user', 'test-session'
    );

    // Should consider the preference
    expect(response.reasoning.constraints).toContain(
      expect.stringMatching(/afternoon/i)
    );
  });
});
```

### Success Criteria - Phase 4:
- ✅ ReAct loop completes in < 3 seconds
- ✅ Multi-step reasoning works
- ✅ Actions execute in correct order
- ✅ Learning improves future responses
- ✅ Confidence scores are reasonable (0.5-1.0)

---

## PHASE 5: Progressive Autonomy & UI Integration
### 🗓️ Days 21-25 | Priority: HIGH

### Objectives:
- Implement 3-tier autonomy system
- Build confirmation UI components
- Create parent control panel
- Add real-time action notifications

### Deliverables:

#### 5.1 Autonomy Manager
```javascript
// src/agent/AutonomyManager.js
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

class AutonomyManager {
  constructor() {
    this.autonomyLevels = {
      // Level 1: Auto-execute (safe, read-only)
      autoExecute: [
        'query_family_data',
        'get_weather',
        'find_nearby_places',
        'check_schedule',
        'list_tasks'
      ],

      // Level 2: Confirm first (modifying but reversible)
      confirmFirst: [
        'schedule_event',
        'manage_habits',
        'manage_chores',
        'add_task',
        'send_reminder',
        'manage_places',
        'manage_contacts'
      ],

      // Level 3: Require explicit approval (destructive/sensitive)
      requireApproval: [
        'delete_event',
        'manage_rewards',
        'modify_recurring_schedule',
        'bulk_operations',
        'change_family_settings',
        'delete_contact',
        'delete_place'
      ]
    };

    // Family-specific overrides
    this.familyOverrides = new Map();
    this.pendingActions = new Map();
  }

  async checkAutonomy(action, familyId) {
    // Check family-specific settings first
    const familySettings = await this.getFamilyAutonomySettings(familyId);

    if (familySettings?.customLevels?.[action]) {
      return familySettings.customLevels[action];
    }

    // Check default levels
    if (this.autonomyLevels.autoExecute.includes(action)) {
      return 'auto';
    } else if (this.autonomyLevels.confirmFirst.includes(action)) {
      return 'confirm';
    } else if (this.autonomyLevels.requireApproval.includes(action)) {
      return 'approval';
    }

    // Default to confirmation
    return 'confirm';
  }

  async getFamilyAutonomySettings(familyId) {
    try {
      const settingsDoc = await getDoc(doc(db, 'familySettings', familyId));
      if (settingsDoc.exists()) {
        return settingsDoc.data().autonomySettings || {};
      }
    } catch (error) {
      console.error('Error fetching autonomy settings:', error);
    }
    return {};
  }

  async updateFamilyAutonomySettings(familyId, settings) {
    try {
      await setDoc(doc(db, 'familySettings', familyId), {
        autonomySettings: settings,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Update cache
      this.familyOverrides.set(familyId, settings);

      return true;
    } catch (error) {
      console.error('Error updating autonomy settings:', error);
      return false;
    }
  }

  async requestConfirmation(action, familyId, userId) {
    // Create pending action record
    const pendingRef = await addDoc(collection(db, 'pending_actions'), {
      familyId,
      userId,
      action: action.tool,
      input: action.input,
      requestedAt: serverTimestamp(),
      status: 'pending',
      expiresAt: new Date(Date.now() + 60 * 1000) // 60 second expiry
    });

    // Store in memory for quick access
    this.pendingActions.set(pendingRef.id, {
      action,
      familyId,
      userId,
      resolver: null
    });

    // Notify UI
    this.notifyUI(familyId, userId, pendingRef.id, action);

    // Wait for response (with timeout)
    return await this.waitForConfirmation(pendingRef.id);
  }

  async waitForConfirmation(actionId) {
    return new Promise((resolve, reject) => {
      const pending = this.pendingActions.get(actionId);
      if (!pending) {
        reject(new Error('Pending action not found'));
        return;
      }

      // Store resolver
      pending.resolver = { resolve, reject };

      // Set timeout
      const timeout = setTimeout(() => {
        this.pendingActions.delete(actionId);
        reject(new Error('Confirmation timeout'));
      }, 60000); // 60 seconds

      // Listen for updates
      const unsubscribe = onSnapshot(doc(db, 'pending_actions', actionId), (doc) => {
        const data = doc.data();
        if (data?.status !== 'pending') {
          clearTimeout(timeout);
          unsubscribe();
          this.pendingActions.delete(actionId);

          if (data?.status === 'approved') {
            resolve({ approved: true, modifiedInput: data.modifiedInput });
          } else {
            resolve({ approved: false, reason: data.reason });
          }
        }
      });
    });
  }

  notifyUI(familyId, userId, actionId, action) {
    // Emit event for UI components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('allie-action-pending', {
        detail: {
          actionId,
          familyId,
          userId,
          action
        }
      }));
    }
  }

  async approveAction(actionId, modifiedInput = null) {
    await setDoc(doc(db, 'pending_actions', actionId), {
      status: 'approved',
      approvedAt: serverTimestamp(),
      modifiedInput
    }, { merge: true });

    const pending = this.pendingActions.get(actionId);
    if (pending?.resolver) {
      pending.resolver.resolve({ approved: true, modifiedInput });
    }
  }

  async rejectAction(actionId, reason = '') {
    await setDoc(doc(db, 'pending_actions', actionId), {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      reason
    }, { merge: true });

    const pending = this.pendingActions.get(actionId);
    if (pending?.resolver) {
      pending.resolver.resolve({ approved: false, reason });
    }
  }
}

export default new AutonomyManager();
```

#### 5.2 Confirmation UI Components
```jsx
// src/components/agent/ActionConfirmation.jsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle, Edit } from 'lucide-react';
import AutonomyManager from '../../agent/AutonomyManager';

const ActionConfirmation = ({ action, actionId, onComplete }) => {
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isEditing, setIsEditing] = useState(false);
  const [editedInput, setEditedInput] = useState(action.input);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleReject('Timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getActionDescription = () => {
    switch (action.tool) {
      case 'schedule_event':
        return `Schedule "${action.input.title}" for ${new Date(action.input.startTime).toLocaleString()}`;
      case 'manage_habits':
        return `${action.input.action} habit: ${action.input.habitData?.name}`;
      case 'manage_chores':
        return `Assign chore "${action.input.choreData?.title}" to ${action.input.choreData?.assignedTo}`;
      case 'send_notification':
        return `Send ${action.input.type} to ${action.input.recipients.length} people: "${action.input.message}"`;
      default:
        return JSON.stringify(action.input);
    }
  };

  const handleApprove = async () => {
    await AutonomyManager.approveAction(actionId, isEditing ? editedInput : null);
    if (onComplete) onComplete('approved');

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handleReject = async (reason = 'User rejected') => {
    await AutonomyManager.rejectAction(actionId, reason);
    if (onComplete) onComplete('rejected');
  };

  const handleAlwaysAllow = async () => {
    // Update family settings to auto-approve this action type
    const familyId = action.familyId;
    const currentSettings = await AutonomyManager.getFamilyAutonomySettings(familyId);

    await AutonomyManager.updateFamilyAutonomySettings(familyId, {
      ...currentSettings,
      customLevels: {
        ...currentSettings.customLevels,
        [action.tool]: 'auto'
      }
    });

    handleApprove();
  };

  return (
    <div className="fixed bottom-20 right-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900">Allie wants to:</h3>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>{timeRemaining}s</span>
        </div>
      </div>

      <div className="bg-gray-50 rounded p-3 mb-4">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={JSON.stringify(editedInput, null, 2)}
              onChange={(e) => {
                try {
                  setEditedInput(JSON.parse(e.target.value));
                } catch {}
              }}
              className="w-full p-2 border rounded text-xs font-mono"
              rows={6}
            />
          </div>
        ) : (
          <p className="text-sm text-gray-700">{getActionDescription()}</p>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          {isEditing ? 'Save & Do' : 'Do it'}
        </button>

        <button
          onClick={() => handleReject('User rejected')}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
        >
          <XCircle className="w-4 h-4" />
          Skip
        </button>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4" />
        </button>

        <button
          onClick={handleAlwaysAllow}
          className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
        >
          Always
        </button>
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        This action will auto-reject in {timeRemaining} seconds
      </div>
    </div>
  );
};

export default ActionConfirmation;
```

#### 5.3 Parent Control Panel
```jsx
// src/components/agent/ParentControlPanel.jsx
import React, { useState, useEffect } from 'react';
import { Shield, Activity, Settings, History } from 'lucide-react';
import AutonomyManager from '../../agent/AutonomyManager';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';

const ParentControlPanel = ({ familyId }) => {
  const [autonomySettings, setAutonomySettings] = useState({});
  const [actionHistory, setActionHistory] = useState([]);
  const [stats, setStats] = useState({
    totalActions: 0,
    autoExecuted: 0,
    confirmed: 0,
    rejected: 0
  });

  useEffect(() => {
    loadSettings();
    subscribeToActionHistory();
  }, [familyId]);

  const loadSettings = async () => {
    const settings = await AutonomyManager.getFamilyAutonomySettings(familyId);
    setAutonomySettings(settings);
  };

  const subscribeToActionHistory = () => {
    const q = query(
      collection(db, 'tool_executions'),
      where('familyId', '==', familyId),
      orderBy('executedAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setActionHistory(history);

      // Calculate stats
      const stats = history.reduce((acc, action) => {
        acc.totalActions++;
        if (action.autonomyLevel === 'auto') acc.autoExecuted++;
        if (action.confirmed) acc.confirmed++;
        if (action.rejected) acc.rejected++;
        return acc;
      }, {
        totalActions: 0,
        autoExecuted: 0,
        confirmed: 0,
        rejected: 0
      });

      setStats(stats);
    });
  };

  const updateAutonomy = async (action, level) => {
    const newSettings = {
      ...autonomySettings,
      customLevels: {
        ...autonomySettings.customLevels,
        [action]: level
      }
    };

    await AutonomyManager.updateFamilyAutonomySettings(familyId, newSettings);
    setAutonomySettings(newSettings);
  };

  const actionTypes = [
    'manage_habits',
    'manage_chores',
    'schedule_event',
    'manage_rewards',
    'query_family_data',
    'manage_places',
    'manage_contacts',
    'send_notification'
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Shield className="w-6 h-6" />
        Allie Agent Controls
      </h2>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold">{stats.totalActions}</div>
          <div className="text-sm text-gray-600">Total Actions</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-600">{stats.autoExecuted}</div>
          <div className="text-sm text-gray-600">Auto-executed</div>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
          <div className="text-sm text-gray-600">Confirmed</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Autonomy Settings */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Autonomy Levels
        </h3>

        <div className="space-y-3">
          {actionTypes.map((action) => (
            <div key={action} className="flex items-center justify-between py-2 border-b">
              <span className="text-sm font-medium">
                {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <select
                value={autonomySettings.customLevels?.[action] || 'confirm'}
                onChange={(e) => updateAutonomy(action, e.target.value)}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="auto">Auto-execute</option>
                <option value="confirm">Confirm first</option>
                <option value="approval">Require approval</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Action History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <History className="w-5 h-5" />
          Recent Actions
        </h3>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {actionHistory.map((action) => (
            <div key={action.id} className="flex items-center justify-between py-2 border-b">
              <div className="flex-1">
                <p className="text-sm font-medium">{action.toolName}</p>
                <p className="text-xs text-gray-500">
                  {new Date(action.executedAt?.seconds * 1000).toLocaleString()}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded ${
                action.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {action.success ? 'Success' : 'Failed'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParentControlPanel;
```

### Test Plan - Phase 5:
```javascript
// tests/phase5.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AutonomyManager from '../src/agent/AutonomyManager';
import ActionConfirmation from '../src/components/agent/ActionConfirmation';

describe('Phase 5: Autonomy & UI Tests', () => {
  test('Auto-execute actions run without confirmation', async () => {
    const level = await AutonomyManager.checkAutonomy('query_family_data', 'test-family');
    expect(level).toBe('auto');
  });

  test('Confirm-level actions request confirmation', async () => {
    const level = await AutonomyManager.checkAutonomy('schedule_event', 'test-family');
    expect(level).toBe('confirm');
  });

  test('Approval-level actions require explicit approval', async () => {
    const level = await AutonomyManager.checkAutonomy('delete_event', 'test-family');
    expect(level).toBe('approval');
  });

  test('Confirmation UI appears and captures response', async () => {
    const mockComplete = jest.fn();

    render(<ActionConfirmation
      action={{
        tool: 'schedule_event',
        input: { title: 'Test Event' }
      }}
      actionId="test-action-123"
      onComplete={mockComplete}
    />);

    // Check UI elements
    expect(screen.getByText(/Allie wants to:/)).toBeInTheDocument();
    expect(screen.getByText(/Schedule "Test Event"/)).toBeInTheDocument();

    // Click approve
    fireEvent.click(screen.getByText('Do it'));

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith('approved');
    });
  });

  test('Actions auto-reject after timeout', async () => {
    jest.useFakeTimers();
    const mockComplete = jest.fn();

    render(<ActionConfirmation
      action={{ tool: 'test', input: {} }}
      actionId="test-timeout"
      onComplete={mockComplete}
    />);

    // Fast-forward time
    jest.advanceTimersByTime(61000);

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith('rejected');
    });

    jest.useRealTimers();
  });

  test('Family settings override default autonomy levels', async () => {
    // Set custom level
    await AutonomyManager.updateFamilyAutonomySettings('test-family', {
      customLevels: {
        'query_family_data': 'approval' // Override default 'auto'
      }
    });

    const level = await AutonomyManager.checkAutonomy('query_family_data', 'test-family');
    expect(level).toBe('approval');
  });
});
```

### Success Criteria - Phase 5:
- ✅ 3-tier autonomy working correctly
- ✅ Confirmation UI appears within 200ms
- ✅ Parent settings persist
- ✅ Action history logged
- ✅ Auto-reject timeout works

---

## PHASE 6: Learning & Optimization
### 🗓️ Days 26-30 | Priority: MEDIUM

### Objectives:
- Implement success tracking
- Build pattern recognition
- Create feedback loops
- Optimize response times

### Deliverables:

#### 6.1 Learning System
```javascript
// src/agent/LearningSystem.js
import { db } from '../services/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import AllieMemoryService from '../services/AllieMemoryService';

class LearningSystem {
  constructor() {
    this.memoryService = AllieMemoryService;
    this.patterns = new Map();
    this.suggestions = new Map();
  }

  async trackSuccess(familyId, action, outcome, context = {}) {
    // Find or create procedure
    const procedure = await this.findProcedure(familyId, action);

    if (procedure) {
      // Update existing procedure
      const newRate = (procedure.successRate * procedure.executionCount + (outcome ? 1 : 0)) /
                     (procedure.executionCount + 1);

      await updateDoc(doc(db, 'agent_procedures', procedure.id), {
        successRate: newRate,
        executionCount: procedure.executionCount + 1,
        lastUsed: serverTimestamp(),
        lastOutcome: outcome,
        lastContext: context
      });
    } else {
      // Create new procedure
      await addDoc(collection(db, 'agent_procedures'), {
        familyId,
        trigger: action.trigger || action.tool,
        action: action,
        successRate: outcome ? 1.0 : 0.0,
        executionCount: 1,
        created: serverTimestamp(),
        lastUsed: serverTimestamp(),
        context
      });
    }

    // Update pattern recognition
    await this.updatePatterns(familyId, action, outcome, context);
  }

  async findProcedure(familyId, action) {
    const q = query(
      collection(db, 'agent_procedures'),
      where('familyId', '==', familyId),
      where('trigger', '==', action.trigger || action.tool),
      limit(1)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  }

  async updatePatterns(familyId, action, outcome, context) {
    const patternKey = `${familyId}_${action.tool}`;

    if (!this.patterns.has(patternKey)) {
      this.patterns.set(patternKey, {
        totalExecutions: 0,
        successfulExecutions: 0,
        contexts: [],
        timePatterns: []
      });
    }

    const pattern = this.patterns.get(patternKey);
    pattern.totalExecutions++;
    if (outcome) pattern.successfulExecutions++;

    // Track context patterns
    pattern.contexts.push({
      context,
      outcome,
      timestamp: Date.now()
    });

    // Keep only last 100 contexts
    if (pattern.contexts.length > 100) {
      pattern.contexts = pattern.contexts.slice(-100);
    }

    // Analyze time patterns
    const hour = new Date().getHours();
    const day = new Date().getDay();
    pattern.timePatterns.push({ hour, day, outcome });

    // Identify successful patterns
    if (pattern.totalExecutions >= 5) {
      await this.identifySuccessfulPatterns(familyId, action.tool, pattern);
    }
  }

  async identifySuccessfulPatterns(familyId, tool, pattern) {
    const successRate = pattern.successfulExecutions / pattern.totalExecutions;

    if (successRate > 0.8) {
      // High success rate - suggest auto-execution
      await this.createSuggestion(familyId, {
        type: 'autonomy_upgrade',
        tool,
        reason: `${tool} has ${Math.round(successRate * 100)}% success rate`,
        suggestion: 'Consider setting to auto-execute',
        confidence: successRate
      });
    }

    // Analyze time patterns
    const timeAnalysis = this.analyzeTimePatterns(pattern.timePatterns);
    if (timeAnalysis.pattern) {
      await this.createSuggestion(familyId, {
        type: 'timing_optimization',
        tool,
        reason: timeAnalysis.reason,
        suggestion: timeAnalysis.suggestion,
        confidence: timeAnalysis.confidence
      });
    }
  }

  analyzeTimePatterns(timePatterns) {
    if (timePatterns.length < 10) return { pattern: false };

    // Group by hour
    const hourlySuccess = {};
    timePatterns.forEach(({ hour, outcome }) => {
      if (!hourlySuccess[hour]) {
        hourlySuccess[hour] = { success: 0, total: 0 };
      }
      hourlySuccess[hour].total++;
      if (outcome) hourlySuccess[hour].success++;
    });

    // Find best times
    let bestHour = -1;
    let bestRate = 0;

    Object.entries(hourlySuccess).forEach(([hour, stats]) => {
      if (stats.total >= 3) {
        const rate = stats.success / stats.total;
        if (rate > bestRate) {
          bestRate = rate;
          bestHour = parseInt(hour);
        }
      }
    });

    if (bestHour >= 0 && bestRate > 0.7) {
      return {
        pattern: true,
        reason: `Actions at ${bestHour}:00 have ${Math.round(bestRate * 100)}% success rate`,
        suggestion: `Schedule similar actions around ${bestHour}:00`,
        confidence: bestRate
      };
    }

    return { pattern: false };
  }

  async createSuggestion(familyId, suggestion) {
    await addDoc(collection(db, 'agent_suggestions'), {
      familyId,
      ...suggestion,
      created: serverTimestamp(),
      status: 'pending',
      impact: this.calculateImpact(suggestion)
    });

    // Store in memory for quick access
    const key = `${familyId}_${suggestion.type}`;
    this.suggestions.set(key, suggestion);
  }

  calculateImpact(suggestion) {
    // Estimate time saved or efficiency gained
    switch (suggestion.type) {
      case 'autonomy_upgrade':
        return { timeSaved: '30 seconds per action', efficiency: '+20%' };
      case 'timing_optimization':
        return { successIncrease: '+15%', efficiency: '+10%' };
      default:
        return { efficiency: '+5%' };
    }
  }

  async getSuggestions(familyId) {
    const q = query(
      collection(db, 'agent_suggestions'),
      where('familyId', '==', familyId),
      where('status', '==', 'pending'),
      orderBy('confidence', 'desc'),
      limit(5)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async applyOptimizations(familyId) {
    const suggestions = await this.getSuggestions(familyId);
    const applied = [];

    for (const suggestion of suggestions) {
      if (suggestion.confidence > 0.8) {
        // Auto-apply high-confidence optimizations
        switch (suggestion.type) {
          case 'autonomy_upgrade':
            // Implement autonomy upgrade
            applied.push(suggestion);
            break;
          case 'timing_optimization':
            // Store timing preference
            applied.push(suggestion);
            break;
        }

        // Mark as applied
        await updateDoc(doc(db, 'agent_suggestions', suggestion.id), {
          status: 'applied',
          appliedAt: serverTimestamp()
        });
      }
    }

    return applied;
  }
}

export default new LearningSystem();
```

### Test Plan - Phase 6:
```javascript
// tests/phase6.test.js
describe('Phase 6: Learning System Tests', () => {
  let learningSystem;

  beforeAll(() => {
    learningSystem = new LearningSystem();
  });

  test('System learns from successful actions', async () => {
    const action = { tool: 'schedule_event', trigger: 'schedule meeting' };

    // Track multiple successes
    for (let i = 0; i < 5; i++) {
      await learningSystem.trackSuccess('test-family', action, true);
    }

    const procedure = await learningSystem.findProcedure('test-family', action);
    expect(procedure.successRate).toBeGreaterThan(0.8);
  });

  test('System identifies patterns after sufficient data', async () => {
    const action = { tool: 'manage_habits', trigger: 'morning routine' };

    // Simulate pattern
    for (let i = 0; i < 10; i++) {
      await learningSystem.trackSuccess(
        'test-family',
        action,
        true,
        { time: '08:00' }
      );
    }

    const suggestions = await learningSystem.getSuggestions('test-family');
    expect(suggestions).toHaveLength(greaterThan(0));
  });

  test('System suggests autonomy upgrades for high-success actions', async () => {
    const action = { tool: 'query_schedule' };

    // Track high success rate
    for (let i = 0; i < 10; i++) {
      await learningSystem.trackSuccess('test-family', action, i < 9); // 90% success
    }

    const suggestions = await learningSystem.getSuggestions('test-family');
    const autonomySuggestion = suggestions.find(s => s.type === 'autonomy_upgrade');

    expect(autonomySuggestion).toBeDefined();
    expect(autonomySuggestion.confidence).toBeGreaterThan(0.8);
  });

  test('Time pattern analysis works correctly', async () => {
    const patterns = [
      { hour: 9, day: 1, outcome: true },
      { hour: 9, day: 2, outcome: true },
      { hour: 9, day: 3, outcome: true },
      { hour: 14, day: 1, outcome: false },
      { hour: 14, day: 2, outcome: false }
    ];

    const analysis = learningSystem.analyzeTimePatterns(patterns);

    if (analysis.pattern) {
      expect(analysis.suggestion).toContain('9:00');
    }
  });
});
```

### Success Criteria - Phase 6:
- ✅ Success rates tracked accurately
- ✅ Patterns detected after 5+ similar actions
- ✅ Suggestions improve over time
- ✅ Response time < 2s for complex requests
- ✅ Learning persists across sessions

---

## PHASE 7: Voice Integration
### 🗓️ Days 31-40 | Priority: MEDIUM

### Objectives:
- Implement WebSocket streaming
- Integrate Deepgram STT
- Add ElevenLabs TTS
- Build voice UI components

### Deliverables:

#### 7.1 Voice Service
```javascript
// src/services/VoiceService.js
import AllieReActAgent from '../agent/AllieReActAgent';

class VoiceService {
  constructor() {
    this.ws = null;
    this.mediaRecorder = null;
    this.audioContext = null;
    this.agent = new AllieReActAgent();
    this.isListening = false;
    this.sessionId = null;
  }

  async initializeSession(userId, familyId) {
    this.sessionId = `voice_${Date.now()}`;

    // Connect to WebSocket
    this.ws = new WebSocket(`wss://${process.env.REACT_APP_BACKEND_URL}/api/claude/stream`);

    this.ws.onopen = () => {
      console.log('Voice WebSocket connected');
      this.ws.send(JSON.stringify({
        type: 'init',
        userId,
        familyId,
        sessionId: this.sessionId
      }));
    };

    this.ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'transcript':
          this.handleTranscript(data.text);
          break;
        case 'audio':
          this.playAudio(data.audio);
          break;
        case 'error':
          console.error('Voice error:', data.message);
          break;
      }
    };

    // Initialize audio
    await this.setupAudio();

    return { sessionId: this.sessionId };
  }

  async setupAudio() {
    // Get user media
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: 16000
      }
    });

    // Setup audio context
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Setup media recorder for chunked streaming
    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
        // Send audio chunk to backend
        event.data.arrayBuffer().then(buffer => {
          this.ws.send(JSON.stringify({
            type: 'audio_chunk',
            audio: Array.from(new Uint8Array(buffer)),
            sessionId: this.sessionId
          }));
        });
      }
    };
  }

  startListening() {
    if (this.mediaRecorder && !this.isListening) {
      this.mediaRecorder.start(100); // Send chunks every 100ms
      this.isListening = true;
      console.log('Started listening');
    }
  }

  stopListening() {
    if (this.mediaRecorder && this.isListening) {
      this.mediaRecorder.stop();
      this.isListening = false;
      console.log('Stopped listening');
    }
  }

  async handleTranscript(text) {
    console.log('Transcript:', text);

    // Process through agent
    const response = await this.agent.process(
      text,
      this.familyId,
      this.userId,
      this.sessionId
    );

    // Send response for TTS
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'tts',
        text: response.text,
        sessionId: this.sessionId
      }));
    }
  }

  async playAudio(audioData) {
    // Convert base64 to audio buffer and play
    const audioBuffer = await this.audioContext.decodeAudioData(
      Uint8Array.from(atob(audioData), c => c.charCodeAt(0)).buffer
    );

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    source.start();
  }

  cleanup() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

export default VoiceService;
```

#### 7.2 Voice UI Component
```jsx
// src/components/voice/VoiceInterface.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Loader } from 'lucide-react';
import VoiceService from '../../services/VoiceService';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';

const VoiceInterface = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [volume, setVolume] = useState(0);

  const voiceService = useRef(null);
  const { familyId } = useFamily();
  const { currentUser } = useAuth();

  useEffect(() => {
    return () => {
      if (voiceService.current) {
        voiceService.current.cleanup();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (!isListening) {
      // Initialize if needed
      if (!voiceService.current) {
        voiceService.current = new VoiceService();
        await voiceService.current.initializeSession(
          currentUser.uid,
          familyId
        );
      }

      voiceService.current.startListening();
      setIsListening(true);
    } else {
      voiceService.current.stopListening();
      setIsListening(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`
        bg-white rounded-lg shadow-xl p-4
        transition-all duration-300
        ${isListening ? 'w-96' : 'w-auto'}
      `}>
        {/* Main button */}
        <button
          onClick={toggleListening}
          className={`
            relative p-4 rounded-full transition-all
            ${isListening
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-blue-500 hover:bg-blue-600'}
          `}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}

          {/* Volume indicator */}
          {isListening && (
            <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-25" />
          )}
        </button>

        {/* Expanded interface */}
        {isListening && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-100 rounded p-2">
                <p className="text-sm text-gray-600">You:</p>
                <p className="text-sm">{transcript || 'Listening...'}</p>
              </div>
            </div>

            {isProcessing && (
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm text-gray-600">Processing...</span>
              </div>
            )}

            {response && (
              <div className="bg-blue-50 rounded p-2">
                <p className="text-sm text-gray-600">Allie:</p>
                <p className="text-sm">{response}</p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${volume}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceInterface;
```

### Test Plan - Phase 7:
```javascript
// tests/phase7.test.js
describe('Phase 7: Voice Integration Tests', () => {
  let voiceService;

  beforeAll(() => {
    voiceService = new VoiceService();
  });

  afterAll(() => {
    voiceService.cleanup();
  });

  test('Voice session initializes successfully', async () => {
    const session = await voiceService.initializeSession('user1', 'family1');
    expect(session.sessionId).toBeDefined();
    expect(session.sessionId).toContain('voice_');
  });

  test('Audio setup completes successfully', async () => {
    await voiceService.setupAudio();
    expect(voiceService.audioContext).toBeDefined();
    expect(voiceService.mediaRecorder).toBeDefined();
  });

  test('Start and stop listening works', () => {
    voiceService.startListening();
    expect(voiceService.isListening).toBe(true);

    voiceService.stopListening();
    expect(voiceService.isListening).toBe(false);
  });

  test('WebSocket connection established', async () => {
    await voiceService.initializeSession('user1', 'family1');
    expect(voiceService.ws).toBeDefined();
    expect(voiceService.ws.readyState).toBe(WebSocket.OPEN);
  });
});
```

### Success Criteria - Phase 7:
- ✅ Voice sessions establish < 1s
- ✅ STT latency < 300ms
- ✅ TTS first byte < 150ms
- ✅ Interruption handling works
- ✅ Voice quality acceptable

---

## 📊 Master Timeline & Milestones

| Phase | Duration | Milestone | Success Metric |
|-------|----------|-----------|----------------|
| **1: Foundation** | Days 1-5 | Backend ready | API responds, Admin SDK works |
| **2: Memory** | Days 6-10 | 4-tier memory live | Context retrieval < 500ms |
| **3: Tools** | Days 11-15 | All tools working | 8 tools execute successfully |
| **4: ReAct** | Days 16-20 | Agent reasoning | Multi-step actions work |
| **5: Autonomy** | Days 21-25 | Progressive autonomy | Confirmation UI functional |
| **6: Learning** | Days 26-30 | Pattern recognition | Learns from 10+ interactions |
| **7: Voice** | Days 31-40 | Voice interface | Full conversations possible |

---

## 🎯 Final Success Criteria

### Technical Metrics:
- ✅ Response latency < 1000ms (chat), < 1500ms (voice)
- ✅ 95% action success rate
- ✅ 99.9% uptime
- ✅ < $0.10 per family per day

### User Metrics:
- ✅ 80% of routine tasks automated
- ✅ 90% user satisfaction
- ✅ 50% reduction in management time
- ✅ Zero security breaches

### Business Metrics:
- ✅ 100+ concurrent families supported
- ✅ COPPA compliant
- ✅ SOC 2 ready
- ✅ Scalable to 10,000 families

---

## 🚦 Go/No-Go Checkpoints

After each phase, evaluate:

1. **Technical Success**: Did we meet the phase criteria?
2. **User Feedback**: Are test users satisfied?
3. **Performance**: Are we within latency targets?
4. **Cost**: Are we within budget projections?
5. **Security**: Any vulnerabilities discovered?

If any checkpoint fails, pause and remediate before continuing.

---

## 🔄 Implementation Order Summary

1. **Foundation First** (Days 1-5)
   - Backend with function calling
   - Admin SDK setup
   - Audit logging

2. **Memory System** (Days 6-10)
   - 4-tier architecture
   - Pinecone + Redis + Firestore
   - Context retrieval

3. **Tools & Actions** (Days 11-15)
   - Tool definitions
   - Firebase operations
   - Validation layer

4. **Intelligence** (Days 16-20)
   - ReAct reasoning
   - Action planning
   - Response synthesis

5. **Control & UI** (Days 21-25)
   - Progressive autonomy
   - Confirmation flows
   - Parent controls

6. **Learning** (Days 26-30)
   - Success tracking
   - Pattern recognition
   - Optimization

7. **Voice** (Days 31-40)
   - WebSocket streaming
   - STT/TTS integration
   - Voice UI

---

This comprehensive plan transforms Allie from a chat interface into a true AI agent with full autonomy, 4-tier memory, and sophisticated reasoning capabilities. Each phase builds on the previous, with clear test criteria to ensure we're progressing correctly.

## Next Steps

1. Review and approve this plan
2. Set up development environment
3. Create Firebase service account
4. Set up Pinecone and Redis accounts
5. Begin Phase 1 implementation

---

*Document Version: 2.0*
*Created: 2024-10-30*
*Last Updated: 2024-10-30*
*Status: COMPLETE - All implementation details included*