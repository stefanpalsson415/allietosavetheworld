const neo4j = require('neo4j-driver');

async function testQuery() {
  const driver = neo4j.driver(
    'neo4j+s://c82dff38.databases.neo4j.io',
    neo4j.auth.basic('neo4j', 'process.env.NEO4J_PASSWORD || 'YOUR_PASSWORD_HERE'')
  );

  const session = driver.session();

  try {
    // Test the exact query used in knowledge-graph.js
    const query = `
      MATCH (n1)-[rel]->(n2)
      WHERE n1.familyId = $familyId AND n2.familyId = $familyId
      RETURN collect({
        source: id(startNode(rel)),
        target: id(endNode(rel)),
        type: type(rel),
        properties: properties(rel)
      }) as relationships
    `;

    const result = await session.run(query, { familyId: 'palsson_family_simulation' });

    console.log('Query result:');
    console.log(`Records: ${result.records.length}`);

    if (result.records.length > 0) {
      const rels = result.records[0].get('relationships');
      console.log(`\nRelationships type: ${typeof rels}`);
      console.log(`Relationships is array: ${Array.isArray(rels)}`);
      console.log(`Relationships length: ${rels ? rels.length : 'null'}`);

      if (rels && rels.length > 0) {
        console.log(`\nFirst 3 relationships:`);
        rels.slice(0, 3).forEach((rel, i) => {
          console.log(`\n${i+1}. ${JSON.stringify(rel, null, 2)}`);
        });
      } else {
        console.log(`\nRelationships array is empty or null`);
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }

  process.exit(0);
}

testQuery().catch(console.error);
