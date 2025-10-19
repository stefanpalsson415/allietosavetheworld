/**
 * Upload Test Data to Neo4j Aura
 *
 * Connects to Neo4j Aura instance and loads the Rodriguez family test data
 */

const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');

// Neo4j Aura Connection Details
const AURA_URI = 'neo4j+s://c82dff38.databases.neo4j.io';
const AURA_USER = 'neo4j';
const AURA_PASSWORD = 'process.env.NEO4J_PASSWORD || 'YOUR_PASSWORD_HERE'';

console.log('\n🚀 Uploading Rodriguez Family Test Data to Neo4j Aura...\n');

async function uploadData() {
  let driver;

  try {
    // Step 1: Connect to Neo4j Aura
    console.log('📡 Connecting to Neo4j Aura...');
    console.log(`   URI: ${AURA_URI}`);

    driver = neo4j.driver(
      AURA_URI,
      neo4j.auth.basic(AURA_USER, AURA_PASSWORD)
    );

    // Verify connection
    await driver.verifyConnectivity();
    console.log('✅ Connected to Neo4j Aura\n');

    const session = driver.session();

    try {
      // Step 2: Load schema files first
      console.log('📋 Step 1: Loading Schema...');

      // Load indexes
      const indexesPath = path.join(__dirname, '../neo4j/schemas/01-indexes.cypher');
      const indexesCypher = fs.readFileSync(indexesPath, 'utf8');

      // Split by semicolon and execute each statement
      const indexStatements = indexesCypher
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('//'));

      for (const statement of indexStatements) {
        if (statement) {
          try {
            await session.run(statement);
            console.log(`   ✓ Index created`);
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`   ⚠️  Index already exists (skipping)`);
            } else {
              console.error(`   ❌ Error creating index: ${error.message}`);
            }
          }
        }
      }

      // Load constraints
      const constraintsPath = path.join(__dirname, '../neo4j/schemas/02-constraints.cypher');
      const constraintsCypher = fs.readFileSync(constraintsPath, 'utf8');

      const constraintStatements = constraintsCypher
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('//'));

      for (const statement of constraintStatements) {
        if (statement) {
          try {
            await session.run(statement);
            console.log(`   ✓ Constraint created`);
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log(`   ⚠️  Constraint already exists (skipping)`);
            } else {
              console.error(`   ❌ Error creating constraint: ${error.message}`);
            }
          }
        }
      }

      console.log('✅ Schema loaded\n');

      // Step 3: Load Fair Play cards (optional - skip if not present)
      console.log('📋 Step 2: Loading Fair Play Cards...');
      const fairPlayPath = path.join(__dirname, '../neo4j/seed-data/fair-play-cards.cypher');

      if (fs.existsSync(fairPlayPath)) {
        const fairPlayCypher = fs.readFileSync(fairPlayPath, 'utf8');
        await session.run(fairPlayCypher);
        console.log('✅ Fair Play cards loaded\n');
      } else {
        console.log('⚠️  Fair Play cards file not found (skipping - not required for testing)\n');
      }

      // Step 4: Load test family data
      console.log('📋 Step 3: Loading Rodriguez Family Test Data...');
      const testDataPath = path.join(__dirname, '../neo4j/test-data/super-active-family.cypher');
      const testDataCypher = fs.readFileSync(testDataPath, 'utf8');

      // Parse Cypher file into individual statements
      // Strategy: Split by lines, then group into complete statements
      const lines = testDataCypher.split('\n');
      const statements = [];
      let currentStatement = [];
      let inStatement = false;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines and comments when not in a statement
        if (!inStatement && (line === '' || line.startsWith('//'))) {
          continue;
        }

        // Start of a new statement (CREATE, MATCH, RETURN, etc.)
        if (line.match(/^(CREATE|MATCH|RETURN|MERGE|WITH)/i)) {
          inStatement = true;
          currentStatement.push(line);
        } else if (inStatement) {
          currentStatement.push(line);

          // End of statement (line ends with semicolon or closing brace followed by semicolon)
          if (line.endsWith(';') || (line.endsWith('}') && !lines[i + 1]?.trim().startsWith('}'))) {
            // Check if next line is a continuation (starts with keyword or is part of MATCH...CREATE)
            const nextLine = lines[i + 1]?.trim();
            const isMultiLineStatement = nextLine && !nextLine.match(/^(CREATE|MATCH|RETURN|MERGE|WITH|\/\/)/i) && nextLine !== '';

            if (!isMultiLineStatement || line.endsWith(';')) {
              // Complete statement - add to array
              const stmt = currentStatement.join('\n').trim();
              if (stmt) {
                statements.push(stmt.replace(/;$/, '')); // Remove trailing semicolon
              }
              currentStatement = [];
              inStatement = false;
            }
          }
        }
      }

      // Add any remaining statement
      if (currentStatement.length > 0) {
        const stmt = currentStatement.join('\n').trim();
        if (stmt) {
          statements.push(stmt.replace(/;$/, ''));
        }
      }

      console.log(`   Found ${statements.length} statements to execute\n`);

      // Execute each statement
      let successCount = 0;
      let lastResult = null;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        try {
          const result = await session.run(statement);
          successCount++;

          // Show progress every 5 statements
          if ((i + 1) % 5 === 0) {
            console.log(`   ✓ Executed ${i + 1}/${statements.length} statements`);
          }

          // Save last result (should be the RETURN statement)
          if (statement.includes('RETURN')) {
            lastResult = result;
          }
        } catch (error) {
          console.error(`   ❌ Error in statement ${i + 1}:`, error.message);
          console.error(`   Statement: ${statement.substring(0, 100)}...`);
        }
      }

      console.log(`\n✅ Executed ${successCount}/${statements.length} statements successfully`);

      if (lastResult && lastResult.records && lastResult.records.length > 0) {
        const status = lastResult.records[0].get('status');
        console.log(`✅ ${status}\n`);
      }

      // Step 5: Verify data
      console.log('🔍 Step 4: Verifying Data...');

      const countQuery = `
        MATCH (n)
        WHERE n.familyId = 'rodriguez_family_001'
        RETURN labels(n)[0] AS type, count(n) AS count
        ORDER BY count DESC
      `;

      const countResult = await session.run(countQuery);

      console.log('\n📊 Data Summary:');
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      countResult.records.forEach(record => {
        const type = record.get('type');
        const count = record.get('count').toNumber();
        console.log(`   ${type.padEnd(20)} ${count}`);
      });
      console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      // Test a knowledge graph query
      console.log('🧪 Step 5: Testing Knowledge Graph Query...');

      const testQuery = `
        MATCH (maria:Person {name: 'Maria Rodriguez'})
        OPTIONAL MATCH (maria)-[a:ANTICIPATES]->(task:Task)
        OPTIONAL MATCH (maria)-[m:MONITORS]->(monitoredTask:Task)
        RETURN
          maria.name AS person,
          maria.cognitiveLoadScore AS cognitiveLoad,
          count(DISTINCT a) AS tasksAnticipated,
          count(DISTINCT m) AS tasksMonitored,
          maria.allie_interactions AS allieUsage
      `;

      const testResult = await session.run(testQuery);

      if (testResult.records.length > 0) {
        const record = testResult.records[0];
        console.log('\n📈 Maria\'s Invisible Labor Profile:');
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Name:              ${record.get('person')}`);
        console.log(`   Cognitive Load:    ${(record.get('cognitiveLoad') * 100).toFixed(0)}%`);
        console.log(`   Tasks Anticipated: ${record.get('tasksAnticipated').toNumber()}`);
        console.log(`   Tasks Monitored:   ${record.get('tasksMonitored').toNumber()}`);
        console.log(`   Allie Usage:       ${record.get('allieUsage').toNumber()} interactions`);
        console.log('   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      }

      console.log('✅ ============================================');
      console.log('✅ All Data Uploaded Successfully!');
      console.log('✅ ============================================\n');

      console.log('🌐 Next Steps:');
      console.log('   1. Update Cloud Run environment variables:');
      console.log(`      NEO4J_URI="${AURA_URI}"`);
      console.log(`      NEO4J_USER="${AURA_USER}"`);
      console.log(`      NEO4J_PASSWORD="${AURA_PASSWORD}"`);
      console.log('');
      console.log('   2. Uncomment knowledge graph routes in server/production-server.js');
      console.log('   3. Redeploy backend: gcloud run deploy allie-claude-api');
      console.log('   4. Test at: https://checkallie.com/knowledge-graph');
      console.log('');

    } finally {
      await session.close();
    }

  } catch (error) {
    console.error('\n❌ Error uploading data:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    if (driver) {
      await driver.close();
    }
  }
}

// Run the upload
uploadData()
  .then(() => {
    console.log('✅ Script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
