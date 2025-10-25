const neo4j = require('neo4j-driver');

async function testNode4814() {
  const driver = neo4j.driver(
    'neo4j+s://c82dff38.databases.neo4j.io',
    neo4j.auth.basic('neo4j', 'process.env.NEO4J_PASSWORD || 'YOUR_PASSWORD_HERE'')
  );

  const session = driver.session();

  try {
    console.log('🔍 Testing node 4814...\n');

    // 1. Check if node 4814 exists
    const nodeCheck = await session.run(`
      MATCH (n)
      WHERE id(n) = 4814
      RETURN n, labels(n) as labels, properties(n) as props
    `);

    if (nodeCheck.records.length > 0) {
      const node = nodeCheck.records[0].get('n');
      const labels = nodeCheck.records[0].get('labels');
      const props = nodeCheck.records[0].get('props');

      console.log('✅ Node 4814 EXISTS in Neo4j');
      console.log('Labels:', labels);
      console.log('Properties:', JSON.stringify(props, null, 2));
      console.log('Has familyId?', props.familyId ? `YES: ${props.familyId}` : 'NO');
    } else {
      console.log('❌ Node 4814 does NOT exist in Neo4j');
      await session.close();
      await driver.close();
      process.exit(0);
    }

    // 2. Test the nodes query from knowledge-graph.js
    console.log('\n📊 Testing nodes query (current implementation)...\n');
    const nodesQuery = `
      MATCH (n1)-[rel]->(n2)
      WHERE n1.familyId = $familyId OR n2.familyId = $familyId
      WITH collect(DISTINCT n1) + collect(DISTINCT n2) AS allNodes
      UNWIND allNodes AS node
      WITH DISTINCT node
      RETURN collect(node) as nodes
    `;

    const nodesResult = await session.run(nodesQuery, { familyId: 'palsson_family_simulation' });
    const nodes = nodesResult.records[0].get('nodes');
    const nodeIds = nodes.map(n => n.identity.toNumber());

    console.log(`Total nodes returned: ${nodes.length}`);
    console.log(`Node 4814 in result? ${nodeIds.includes(4814) ? 'YES ✅' : 'NO ❌'}`);

    // 3. Check what relationships node 4814 has
    console.log('\n🔗 Checking relationships for node 4814...\n');
    const relsCheck = await session.run(`
      MATCH (n)
      WHERE id(n) = 4814
      MATCH (n)-[r]-(other)
      RETURN type(r) as relType,
             id(startNode(r)) as startId,
             id(endNode(r)) as endId,
             other.familyId as otherFamilyId
      LIMIT 5
    `);

    console.log('Relationships:');
    relsCheck.records.forEach(record => {
      console.log(`  ${record.get('relType')}: ${record.get('startId').toNumber()} → ${record.get('endId').toNumber()}`);
      console.log(`    Other node has familyId? ${record.get('otherFamilyId') || 'NO'}`);
    });

    // 4. Test alternative query that includes ALL nodes (not just those in relationships)
    console.log('\n💡 Testing alternative query (include nodes without familyId)...\n');
    const altQuery = `
      MATCH (n)
      WHERE n.familyId = $familyId
         OR EXISTS {
           MATCH (n)-[]-(other)
           WHERE other.familyId = $familyId
         }
      RETURN collect(n) as nodes
    `;

    const altResult = await session.run(altQuery, { familyId: 'palsson_family_simulation' });
    const altNodes = altResult.records[0].get('nodes');
    const altNodeIds = altNodes.map(n => n.identity.toNumber());

    console.log(`Total nodes returned: ${altNodes.length}`);
    console.log(`Node 4814 in result? ${altNodeIds.includes(4814) ? 'YES ✅' : 'NO ❌'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await session.close();
    await driver.close();
  }

  process.exit(0);
}

testNode4814().catch(console.error);
