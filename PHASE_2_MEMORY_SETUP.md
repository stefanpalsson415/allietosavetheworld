# Phase 2: Memory System Setup Guide

## 🧠 4-Tier Memory Architecture is Ready!

The memory system is fully implemented but requires external services to be fully functional. Here's what you need to set up:

## 1. Redis Setup (for Episodic Memory)

### Option A: Install Redis Locally (Recommended for Development)
```bash
# Install Redis with Homebrew
brew install redis

# Start Redis service
brew services start redis

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

### Option B: Use Redis Cloud (Free Tier)
1. Go to https://redis.com/try-free/
2. Sign up for free account
3. Create a new database (free tier: 30MB)
4. Copy your connection details:
   - Endpoint URL
   - Port
   - Password
5. Add to your `.env` file:
```env
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_ENDPOINT:PORT
```

## 2. Pinecone Setup (for Semantic Memory) - REQUIRED

1. **Sign up at**: https://www.pinecone.io/
2. **Create free account** (no credit card needed)
3. **Get your credentials**:
   - Go to API Keys section
   - Copy your API Key
   - Note your Environment (e.g., "us-west1-gcp")
4. **Create an index** (optional - the code will create it):
   - Name: `allie-memory`
   - Dimensions: `1536`
   - Metric: `cosine`
5. **Add to your `.env` file**:
```env
PINECONE_API_KEY=your-api-key-here
PINECONE_ENVIRONMENT=us-west1-gcp  # or your environment
PINECONE_INDEX=allie-memory
```

## 3. OpenAI Setup (for Embeddings) - REQUIRED

1. **Sign up at**: https://platform.openai.com/
2. **Add payment method** (embeddings are very cheap ~$0.0001 per 1K tokens)
3. **Create API Key**:
   - Go to API Keys section
   - Create new secret key
   - Copy immediately (won't be shown again)
4. **Add to your `.env` file**:
```env
OPENAI_API_KEY=sk-...your-key-here
```

## 4. Update Your Server `.env` File

Add these lines to `/server/.env`:

```env
# Memory System Configuration
# Redis (Local or Cloud)
REDIS_URL=redis://localhost:6379
# Or for Redis Cloud:
# REDIS_URL=redis://default:password@redis-cloud-url:port

# Pinecone (Required)
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=us-west1-gcp
PINECONE_INDEX=allie-memory

# OpenAI (Required)
OPENAI_API_KEY=sk-your-openai-api-key
```

## 5. Test the Memory System

Once you have the services configured:

```bash
# 1. Restart the server to load new environment variables
cd server
node production-server.js

# 2. Run the memory test suite
node test-memory.js
```

## What Works Without External Services?

Even without Redis/Pinecone/OpenAI, the system will still work with:
- ✅ **Working Memory** - In-memory storage (resets on server restart)
- ✅ **Procedural Memory** - Stored in Firestore
- ⚠️ **Episodic Memory** - Disabled without Redis
- ⚠️ **Semantic Memory** - Disabled without Pinecone + OpenAI

## Memory System Features

### Working Memory (Tier 1)
- Stores last 10 interactions per family
- Immediate context for current conversation
- In-memory, fast access

### Episodic Memory (Tier 2)
- Stores interactions for 24-48 hours
- Recent conversation history
- Requires Redis

### Semantic Memory (Tier 3)
- Long-term knowledge storage
- Vector similarity search
- Requires Pinecone + OpenAI

### Procedural Memory (Tier 4)
- Learned action patterns
- Success rate tracking
- Stored in Firestore (works out of the box!)

## Cost Estimates

- **Redis Cloud**: FREE (30MB free tier)
- **Pinecone**: FREE (100K vectors free tier)
- **OpenAI Embeddings**: ~$0.01 per 1000 interactions

Total monthly cost for a family: **< $1**

## Quick Test Commands

```bash
# Test basic agent with memory
curl -X POST http://localhost:3002/api/claude/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Remember that my birthday is next Tuesday",
    "userId": "test-user",
    "familyId": "test-family",
    "context": {
      "userName": "Test User",
      "familyName": "Test Family"
    }
  }'

# Follow up to test memory
curl -X POST http://localhost:3002/api/claude/agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What did I tell you about next week?",
    "userId": "test-user",
    "familyId": "test-family",
    "context": {
      "userName": "Test User",
      "familyName": "Test Family"
    }
  }'
```

## Next Steps

Once you have the external services set up:
1. The agent will automatically start using all 4 memory tiers
2. Each family's interactions will be remembered
3. The agent will learn patterns and improve over time
4. Semantic search will enable intelligent knowledge retrieval

---

**Setup Time**: ~15 minutes
**Monthly Cost**: < $1 (mostly free tier)
**Status**: Code complete, waiting for API keys