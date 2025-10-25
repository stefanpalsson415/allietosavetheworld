const neo4j = require('neo4j-driver');

async function testQuery() {
  const driver = neo4j.driver(
    'neo4j+s://c82dff38.databases.neo4j.io',
    neo4j.auth.basic('neo4j', 'process.env.NEO4J_PASSWORD || 'YOUR_PASSWORD_HERE'')
  );

  const session = driver.session();

  try {
    // Test the new nodes query
    console.log('Testing new nodes query...\n');

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

    console.log(`Nodes returned: ${nodes.length}`);
    console.log(`First few node IDs: ${nodes.slice(0, 5).map(n => n.identity.toNumber())}`);

    // Test relationships query
    console.log('\nTesting relationships query...\n');

    const relsQuery = `
      MATCH (n1)-[rel]->(n2)
      WHERE n1.familyId = $familyId OR n2.familyId = $familyId
      WITH startNode(rel) AS n1, endNode(rel) AS n2, rel
      RETURN collect({
        source: toInteger(id(n1)),
        target: toInteger(id(n2)),
        relType: type(rel)
      }) as relationships
    `;

    const relsResult = await session.run(relsQuery, { familyId: 'palsson_family_simulation' });
    const rels = relsResult.records[0].get('relationships');

    console.log(`Relationships returned: ${rels.length}`);
    console.log(`First few relationships: ${JSON.stringify(rels.slice(0, 3), null, 2)}`);

    // Check for node ID 4814
    const nodeIds = new Set(nodes.map(n => n.identity.toNumber()));
    const linkIds = new Set();
    rels.forEach(r => {
      linkIds.add(r.source);
      linkIds.add(r.target);
    });

    const missing = Array.from(linkIds).filter(id => !nodeIds.has(id));

    console.log(`\n📊 Analysis:`);
    console.log(`Node IDs found: ${nodeIds.size}`);
    console.log(`Link IDs referenced: ${linkIds.size}`);
    console.log(`Missing node IDs: ${missing.length}`);
    console.log(`Node 4814 exists: ${nodeIds.has(4814)}`);

    if (missing.length > 0) {
      console.log(`\n❌ Missing IDs (first 10): ${missing.slice(0, 10)}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await session.close();
    await driver.close();
  }

  process.exit(0);
}

testQuery().catch(console.error);
