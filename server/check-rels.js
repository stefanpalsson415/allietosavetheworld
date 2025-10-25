const neo4j = require('neo4j-driver');

async function checkRels() {
  const driver = neo4j.driver(
    'neo4j+s://c82dff38.databases.neo4j.io',
    neo4j.auth.basic('neo4j', 'process.env.NEO4J_PASSWORD || 'YOUR_PASSWORD_HERE'')
  );

  const session = driver.session();

  try {
    // Count total relationships
    const result = await session.run(`
      MATCH ()-[r]->()
      RETURN count(r) as total
    `);

    const total = result.records[0].get('total').toNumber();
    console.log(`Total relationships in Neo4j: ${total}`);

    // Count relationships for palsson_family_simulation
    const familyResult = await session.run(`
      MATCH (n1)-[rel]->(n2)
      WHERE n1.familyId = $familyId OR n2.familyId = $familyId
      RETURN count(rel) as total
    `, { familyId: 'palsson_family_simulation' });

    const familyTotal = familyResult.records[0].get('total').toNumber();
    console.log(`Relationships for palsson_family_simulation: ${familyTotal}`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }

  process.exit(0);
}

checkRels().catch(console.error);
