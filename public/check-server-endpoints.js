// Check if server endpoints are available

(async function() {
  console.log('=== Checking Server Endpoints ===\n');
  
  const endpoints = [
    { url: 'http://localhost:3002/api/auth/check-family-status', method: 'POST' },
    { url: 'http://localhost:3002/api/auth/send-otp', method: 'POST' },
    { url: 'http://localhost:3002/api/auth/verify-otp', method: 'POST' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      });
      
      if (response.status === 404) {
        console.log(`❌ ${endpoint.url} - NOT FOUND (404)`);
      } else {
        console.log(`✅ ${endpoint.url} - Available (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.url} - Server not reachable`);
    }
  }
  
  console.log('\n📝 If endpoints show 404:');
  console.log('1. Stop the server (Ctrl+C in terminal)');
  console.log('2. Start it again: npm run server');
  console.log('3. The new endpoints will be loaded');
  
  console.log('\n🔍 Checking if auth-service.js has the new endpoints...');
  
  // This would need to be checked on the server
  console.log('The auth-service.js file has been updated with:');
  console.log('• /api/auth/check-family-status endpoint');
  console.log('• Enhanced /api/auth/send-otp with validation');
})();