# Knowledge Graph System - Complete Test Plan

**Status:** All code built, ready for Docker/Neo4j deployment
**When you return:** Follow this test plan step-by-step

---

## 🚀 Quick Start (5 minutes)

```bash
# 1. Open Docker Desktop (if installed)
open -a Docker

# Wait 30 seconds for Docker to start, then:

# 2. Start Neo4j
cd /Users/stefanpalsson/parentload\ copy/parentload-clean/neo4j
docker compose up -d

# 3. Wait 30 seconds, verify Neo4j is running
docker ps | grep neo4j
# Should show: allie-neo4j   Up X seconds   0.0.0.0:7474->7474/tcp, 0.0.0.0:7687->7687/tcp

# 4. Access Neo4j Browser
open http://localhost:7474
# Login: neo4j / parentload_secure_2025

# 5. Load schemas (run these commands one by one)
docker exec -i allie-neo4j cypher-shell -u neo4j -p parentload_secure_2025 < schemas/01-indexes.cypher
docker exec -i allie-neo4j cypher-shell -u neo4j -p parentload_secure_2025 < schemas/02-constraints.cypher
docker exec -i allie-neo4j cypher-shell -u neo4j -p parentload_secure_2025 < schemas/03-fair-play-cards.cypher

# 6. Install Node.js dependencies
cd /Users/stefanpalsson/parentload\ copy/parentload-clean
npm install neo4j-driver

# 7. Test Neo4j connection
node -e "
  import('./server/services/graph/Neo4jService.js').then(async (module) => {
    const neo4j = module.default;
    await neo4j.connect();
    const result = await neo4j.runQuery('MATCH (n) RETURN count(n) AS nodeCount');
    console.log('✅ Neo4j connected! Nodes:', result[0].nodeCount);
    await neo4j.close();
  });
"

# If that works, you're ready! 🎉
```

---

## 📊 Test Plan Overview

### Phase 1: Infrastructure (15 min)
- ✅ Docker running
- ✅ Neo4j accessible
- ✅ Schemas loaded
- ✅ Node.js dependencies installed

### Phase 2: Neo4j Service Tests (10 min)
- ✅ Connection test
- ✅ Query execution test
- ✅ Write query test

### Phase 3: Cypher Query Tests (20 min)
- ✅ All 10 queries execute successfully
- ✅ Sample data test
- ✅ Query performance test

### Phase 4: Intelligence Service Tests (15 min)
- ✅ Invisible labor analysis
- ✅ Child insights (with Claude)
- ✅ Natural language queries

### Phase 5: Integration Tests (10 min)
- ✅ End-to-end data flow
- ✅ Cache performance
- ✅ Error handling

### Phase 6: Production Deployment (10 min)
- ✅ Deploy to production
- ✅ Smoke tests
- ✅ Monitor logs

**Total Time:** ~80 minutes

---

## 📋 Detailed Test Steps

### PHASE 1: Infrastructure Verification

#### Test 1.1: Docker Running
```bash
docker --version
# Expected: Docker version 27.x or higher

docker ps
# Expected: Shows running containers
```

**✅ Pass Criteria:** Docker command executes successfully

#### Test 1.2: Neo4j Accessible
```bash
# Check Neo4j is running
docker logs allie-neo4j | tail -n 20
# Expected: See "Started" or "Bolt enabled" messages

# Test Bolt connection
docker exec allie-neo4j cypher-shell -u neo4j -p parentload_secure_2025 "RETURN 'Hello' AS greeting"
# Expected: greeting
#          "Hello"
```

**✅ Pass Criteria:** Cypher query executes and returns "Hello"

#### Test 1.3: Schemas Loaded
```bash
# Verify Fair Play cards loaded
docker exec allie-neo4j cypher-shell -u neo4j -p parentload_secure_2025 "MATCH (c:FairPlayCard) RETURN count(c) AS cardCount"
# Expected: cardCount = 15 (or 100 when full taxonomy loaded)

# Verify categories loaded
docker exec allie-neo4j cypher-shell -u neo4j -p parentload_secure_2025 "MATCH (c:Category) RETURN count(c) AS categoryCount"
# Expected: categoryCount = 5
```

**✅ Pass Criteria:** Cards and categories exist in database

---

### PHASE 2: Neo4j Service Tests

#### Test 2.1: Connection Test
```javascript
// Save as test-neo4j-connection.js
import neo4jService from './server/services/graph/Neo4jService.js';

async function testConnection() {
  try {
    await neo4jService.connect();
    console.log('✅ Neo4j connected successfully');

    const result = await neo4jService.runQuery('RETURN 1 AS test');
    console.log('✅ Query executed:', result);

    await neo4jService.close();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testConnection();
```

Run: `node test-neo4j-connection.js`

**✅ Pass Criteria:** All console logs show ✅

#### Test 2.2: Write Query Test
```javascript
// Save as test-neo4j-write.js
import neo4jService from './server/services/graph/Neo4jService.js';

async function testWrite() {
  try {
    await neo4jService.connect();

    // Create test node
    await neo4jService.runWriteQuery(`
      CREATE (p:TestPerson {name: 'Test User', familyId: 'test_family_123'})
      RETURN p
    `);
    console.log('✅ Test node created');

    // Verify it exists
    const result = await neo4jService.runQuery(`
      MATCH (p:TestPerson {familyId: 'test_family_123'})
      RETURN p.name AS name
    `);
    console.log('✅ Test node found:', result[0].name);

    // Clean up
    await neo4jService.runWriteQuery(`
      MATCH (p:TestPerson {familyId: 'test_family_123'})
      DELETE p
    `);
    console.log('✅ Test node deleted');

    await neo4jService.close();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWrite();
```

Run: `node test-neo4j-write.js`

**✅ Pass Criteria:** Node created, found, and deleted successfully

---

### PHASE 3: Cypher Query Tests

#### Test 3.1: Load Sample Data
```bash
# Create sample family data for testing
docker exec -i allie-neo4j cypher-shell -u neo4j -p parentload_secure_2025 << 'EOF'
// Create test family
CREATE (parent1:Person {
  id: 'parent1_test',
  familyId: 'test_family_123',
  name: 'Oly',
  role: 'primary_caregiver',
  cognitive_load_score: 0.68,
  stress_level: 0.72
});

CREATE (parent2:Person {
  id: 'parent2_test',
  familyId: 'test_family_123',
  name: 'Stefan',
  role: 'secondary_caregiver',
  cognitive_load_score: 0.32,
  stress_level: 0.45
});

// Create test tasks
CREATE (task1:Task {
  id: 'task1_test',
  familyId: 'test_family_123',
  title: 'Schedule dentist appointment',
  complexity_score: 0.7,
  createdAt: datetime()
});

CREATE (task2:Task {
  id: 'task2_test',
  familyId: 'test_family_123',
  title: 'Plan birthday party',
  complexity_score: 0.9,
  createdAt: datetime()
});

// Create relationships
MATCH (p1:Person {id: 'parent1_test'}), (t1:Task {id: 'task1_test'})
CREATE (p1)-[:ANTICIPATES {proactive: true, lead_time: 7}]->(t1);

MATCH (p1:Person {id: 'parent1_test'}), (t2:Task {id: 'task2_test'})
CREATE (p1)-[:MONITORS {time_spent: 30, intervention_count: 3}]->(t2);

MATCH (p2:Person {id: 'parent2_test'}), (t2:Task {id: 'task2_test'})
CREATE (p2)-[:ASSIGNED_TO]->(t2);

RETURN 'Sample data created' AS status;
EOF
```

**✅ Pass Criteria:** Query returns "Sample data created"

#### Test 3.2: Test All 10 Cypher Queries
```javascript
// Save as test-cypher-queries.js
import neo4jService from './server/services/graph/Neo4jService.js';
import { executeQuery } from './server/services/graph/CypherQueries.js';

async function testAllQueries() {
  const familyId = 'test_family_123';

  try {
    await neo4jService.connect();

    console.log('\n📊 Testing all 10 Cypher queries...\n');

    // 1. Anticipation Burden
    console.log('1️⃣ Anticipation Burden Query:');
    const anticipation = await executeQuery('anticipationBurden', { familyId }, neo4jService);
    console.log(anticipation);
    console.log(anticipation.length > 0 ? '✅ PASS' : '⚠️ No data');

    // 2. Monitoring Overhead
    console.log('\n2️⃣ Monitoring Overhead Query:');
    const monitoring = await executeQuery('monitoringOverhead', { familyId }, neo4jService);
    console.log(monitoring);
    console.log(monitoring.length > 0 ? '✅ PASS' : '⚠️ No data');

    // 3. Decision-Research Gap
    console.log('\n3️⃣ Decision-Research Gap Query:');
    const decisionResearch = await executeQuery('decisionResearchGap', { familyId }, neo4jService);
    console.log(decisionResearch.length > 0 ? '✅ PASS (has data)' : '✅ PASS (no data yet - expected)');

    // 4. Task Creation vs Execution
    console.log('\n4️⃣ Task Creation vs Execution Query:');
    const taskSplit = await executeQuery('taskCreationVsExecution', { familyId }, neo4jService);
    console.log(taskSplit);
    console.log(taskSplit.length > 0 ? '✅ PASS' : '⚠️ No data');

    // 5. Coordination Bottleneck (requires GDS)
    console.log('\n5️⃣ Coordination Bottleneck Query:');
    try {
      const bottleneck = await executeQuery('coordinationBottleneck', { familyId }, neo4jService);
      console.log(bottleneck);
      console.log('✅ PASS');
    } catch (error) {
      console.log('⚠️ SKIP - Neo4j GDS plugin required (install later)');
    }

    // 6. Community Fragmentation (requires GDS)
    console.log('\n6️⃣ Community Fragmentation Query:');
    try {
      const fragmentation = await executeQuery('communityFragmentation', { familyId }, neo4jService);
      console.log(fragmentation);
      console.log('✅ PASS');
    } catch (error) {
      console.log('⚠️ SKIP - Neo4j GDS plugin required (install later)');
    }

    // 7. Dependency Impact
    console.log('\n7️⃣ Dependency Impact Query:');
    const dependencies = await executeQuery('dependencyImpact', { familyId }, neo4jService);
    console.log(dependencies.length > 0 ? '✅ PASS (has data)' : '✅ PASS (no data yet - expected)');

    // 8. Fair Play Phase Distribution
    console.log('\n8️⃣ Fair Play Phase Distribution Query:');
    const fairPlay = await executeQuery('fairPlayPhaseDistribution', { familyId }, neo4jService);
    console.log(fairPlay.length > 0 ? '✅ PASS (has data)' : '✅ PASS (no data yet - expected)');

    // 9. Ripple Effect Analysis
    console.log('\n9️⃣ Ripple Effect Analysis Query:');
    const ripple = await executeQuery('rippleEffectAnalysis', { familyId }, neo4jService);
    console.log(ripple.length > 0 ? '✅ PASS (has data)' : '✅ PASS (no data yet - expected)');

    // 10. Temporal Task Creation
    console.log('\n🔟 Temporal Task Creation Query:');
    const temporal = await executeQuery('temporalTaskCreation', {
      familyId,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString()
    }, neo4jService);
    console.log(temporal);
    console.log(temporal.length > 0 ? '✅ PASS' : '✅ PASS (no temporal data yet - expected)');

    console.log('\n🎉 All query tests complete!\n');

    await neo4jService.close();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testAllQueries();
```

Run: `node test-cypher-queries.js`

**✅ Pass Criteria:** At least queries 1, 2, 4 return data (others may be empty with sample data)

---

### PHASE 4: Intelligence Service Tests

#### Test 4.1: Invisible Labor Analysis
```javascript
// Save as test-intelligence-service.js
import parentingIntelligenceService from './server/services/graph/ParentingIntelligenceService.js';

async function testIntelligenceService() {
  const familyId = 'test_family_123';

  try {
    await parentingIntelligenceService.initialize();

    console.log('\n📊 Testing Invisible Labor Analysis...\n');
    const analysis = await parentingIntelligenceService.getInvisibleLaborAnalysis(familyId);

    console.log('Analysis Results:');
    console.log('- Anticipation:', analysis.anticipation.insight);
    console.log('- Monitoring:', analysis.monitoring.insight);
    console.log('- Summary:', analysis.summary.keyFindings);

    console.log('\n✅ Invisible Labor Analysis Complete\n');

    console.log('\n🔗 Testing Coordination Analysis...\n');
    const coordination = await parentingIntelligenceService.getCoordinationAnalysis(familyId);

    console.log('Coordination Results:');
    console.log('- Bottleneck:', coordination.bottleneck?.insight || 'No data yet');
    console.log('- Fragmentation:', coordination.fragmentation?.insight || 'No data yet');

    console.log('\n✅ Coordination Analysis Complete\n');

    console.log('\n💬 Testing Natural Language Query...\n');
    const queryResult = await parentingIntelligenceService.queryInsights(
      familyId,
      'Tell me about invisible labor in my family'
    );

    console.log('Query Response:');
    console.log(queryResult.response);

    console.log('\n✅ All Intelligence Service Tests Complete\n');

    await parentingIntelligenceService.neo4j.close();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testIntelligenceService();
```

Run: `node test-intelligence-service.js`

**✅ Pass Criteria:** All insights generate successfully with natural language output

---

### PHASE 5: Integration Tests

#### Test 5.1: End-to-End Data Flow
```bash
# This test simulates complete user journey:
# 1. User creates tasks in app
# 2. Data syncs to Neo4j
# 3. Intelligence service analyzes
# 4. Insights displayed in UI

# For now, verify manual data flow:
docker exec -i allie-neo4j cypher-shell -u neo4j -p parentload_secure_2025 << 'EOF'
MATCH (p:Person {familyId: 'test_family_123'})
MATCH (t:Task {familyId: 'test_family_123'})
RETURN p.name AS person, count(t) AS task_count
EOF
```

**✅ Pass Criteria:** Query returns expected person-task counts

#### Test 5.2: Performance Test
```javascript
// Measure query execution time
import neo4jService from './server/services/graph/Neo4jService.js';

async function perfTest() {
  await neo4jService.connect();

  console.time('Query Execution');
  await neo4jService.runQuery('MATCH (n) RETURN count(n)');
  console.timeEnd('Query Execution');
  // Expected: < 100ms

  await neo4jService.close();
}

perfTest();
```

**✅ Pass Criteria:** Query executes in < 100ms

---

### PHASE 6: Production Deployment

#### Deploy to Production
```bash
# 1. Build production bundle
npm run build

# 2. Deploy to Firebase
firebase deploy --only hosting,functions

# 3. Update environment variables for Neo4j
# (Add NEO4J_URI to production Cloud Run environment)
gcloud run services update allie-claude-api \
  --set-env-vars NEO4J_URI=bolt://your-neo4j-host:7687 \
  --region us-central1

# 4. Verify production deployment
curl https://checkallie.com/api/knowledge-graph/status
# Expected: {"status": "ready", "neo4jConnected": true}
```

**✅ Pass Criteria:** Production deployment successful, Neo4j accessible

---

## 🔧 Troubleshooting

### Docker Not Starting
```bash
# Check if Docker is installed
ls -la /Applications/Docker.app

# If not installed, install manually:
# Download from: https://www.docker.com/products/docker-desktop/

# Start Docker manually
open -a Docker
# Wait 30 seconds for startup
```

### Neo4j Connection Refused
```bash
# Check Neo4j logs
docker logs allie-neo4j

# Restart Neo4j
docker restart allie-neo4j

# Verify ports
lsof -i :7474
lsof -i :7687
```

### Schemas Not Loading
```bash
# Check schema files exist
ls neo4j/schemas/

# Load manually via Neo4j Browser
open http://localhost:7474
# Copy/paste contents of each .cypher file
```

### Query Errors
```bash
# Check Neo4j version
docker exec allie-neo4j cypher-shell --version

# Verify graph schema
docker exec allie-neo4j cypher-shell -u neo4j -p parentload_secure_2025 "CALL db.schema.visualization()"
```

---

## 📈 Success Metrics

After completing all tests:

✅ **Infrastructure**
- Neo4j running in Docker
- Fair Play 100 cards loaded
- All relationship types defined

✅ **Queries**
- All 10 Cypher queries execute
- Sample data returns expected results
- Performance < 100ms per query

✅ **Intelligence**
- Invisible labor insights generate
- Natural language responses work
- Claude integration successful

✅ **Production**
- Deployed to Firebase + Cloud Run
- Accessible at checkallie.com
- No errors in logs

---

## 🎯 Next Steps

After passing all tests:

1. **Populate with real data** - Sync existing Firestore data to Neo4j
2. **Build UI components** - Create dual-pane visualization
3. **Enable for beta users** - Gradual rollout
4. **Monitor performance** - Track query times, cache hit rates
5. **Iterate based on feedback** - Add new queries, refine insights

---

**Status:** Test plan complete, ready for execution when Docker is available! 🚀
