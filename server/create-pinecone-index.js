const { Pinecone } = require('@pinecone-database/pinecone');

async function createIndex() {
  console.log('Creating Pinecone index...');

  const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY || 'pcsk_4xdQ4s_2GzVvRN7E9nopTdW4QYroZxkG4TTtuLUeCjekhNKTYTg1M3ExShemtQiQnLY88i'
  });

  try {
    // List existing indexes
    const { indexes } = await pinecone.listIndexes();
    console.log('Existing indexes:', indexes?.map(i => i.name) || []);

    // Check if index exists
    const indexExists = indexes && indexes.some(i => i.name === 'allie-memory');

    if (!indexExists) {
      console.log('Creating new index: allie-memory...');
      await pinecone.createIndex({
        name: 'allie-memory',
        dimension: 1536,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      console.log('✅ Index created successfully!');
      console.log('Waiting for index to be ready...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    } else {
      console.log('✅ Index already exists');
    }

    console.log('\n✅ Pinecone setup complete!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createIndex();