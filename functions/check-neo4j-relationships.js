const neo4j = require('neo4j-driver');

async function checkRelationships() {
  console.log('🔍 Checking Neo4j relationships...\n');

  const driver = neo4j.driver(
    'neo4j+s://c82dff38.databases.neo4j.io',
    neo4j.auth.basic('neo4j', 'process.env.NEO4J_PASSWORD || 'YOUR_PASSWORD_HERE'')
  );

  const session = driver.session();

  try {
    // Count total relationships
    const totalResult = await session.run(`
      MATCH ()-[r]->()
      RETURN count(r) as total
    `);
    const totalRels = totalResult.records[0].get('total').toNumber();
    console.log(`Total relationships: ${totalRels}`);

    // Count by type
    const typeResult = await session.run(`
      MATCH ()-[r]->()
      RETURN type(r) as relType, count(r) as count
      ORDER BY count DESC
    `);

    console.log('\nRelationships by type:');
    typeResult.records.forEach(record => {
      const type = record.get('relType');
      const count = record.get('count').toNumber();
      console.log(`  ${type}: ${count}`);
    });

    // Count nodes by type
    const nodesResult = await session.run(`
      MATCH (n)
      RETURN labels(n)[0] as label, count(n) as count
      ORDER BY count DESC
    `);

    console.log('\nNodes by type:');
    nodesResult.records.forEach(record => {
      const label = record.get('label');
      const count = record.get('count').toNumber();
      console.log(`  ${label}: ${count}`);
    });

    // Sample some CREATED relationships
    console.log('\nSample CREATED relationships:');
    const createdSample = await session.run(`
      MATCH (p:Person)-[r:CREATED]->(t:Task)
      RETURN p.name as person, t.title as task
      LIMIT 5
    `);

    if (createdSample.records.length > 0) {
      createdSample.records.forEach(record => {
        console.log(`  ${record.get('person')} → ${record.get('task')}`);
      });
    } else {
      console.log('  (none found)');
    }

    // Sample some ORGANIZES relationships
    console.log('\nSample ORGANIZES relationships:');
    const organizesSample = await session.run(`
      MATCH (p:Person)-[r:ORGANIZES]->(e:Event)
      RETURN p.name as person, e.title as event
      LIMIT 5
    `);

    if (organizesSample.records.length > 0) {
      organizesSample.records.forEach(record => {
        console.log(`  ${record.get('person')} → ${record.get('event')}`);
      });
    } else {
      console.log('  (none found)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await session.close();
    await driver.close();
  }

  process.exit(0);
}

checkRelationships().catch(console.error);
