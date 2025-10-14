// src/utils/ClaudeApiTester.js
/**
 * Utility for testing Claude API connectivity
 * This can be used to diagnose connection issues between the app and Claude API
 */

class ClaudeApiTester {
  /**
   * Test Claude API connection
   * @param {string} apiUrl - URL of the proxy server (e.g. http://localhost:3001/api/claude)
   * @returns {Promise<Object>} - Test results
   */
  static async testConnection(apiUrl) {
    console.log(`🧪 Testing Claude API connection to: ${apiUrl}`);
    
    try {
      // First test the /test endpoint to see if the proxy is running
      const testUrl = `${apiUrl}/test`;
      console.log(`Testing proxy server at: ${testUrl}`);
      
      const testStartTime = Date.now();
      const proxyResponse = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-cache'
      });
      const proxyLatency = Date.now() - testStartTime;
      
      if (!proxyResponse.ok) {
        return {
          success: false,
          message: `Proxy server test failed with status: ${proxyResponse.status}`,
          stage: 'proxy_test',
          latency: {
            proxy: proxyLatency
          }
        };
      }
      
      const proxyData = await proxyResponse.json();
      console.log(`✅ Proxy server is running. Response:`, proxyData);
      
      // If the API key test shows a failure, return those details
      if (proxyData.apiTest && proxyData.apiTest.status === 'failed') {
        return {
          success: false,
          message: `API key validation failed: ${proxyData.apiTest.details?.error || 'Unknown error'}`,
          stage: 'api_key_validation',
          proxyResponse: proxyData,
          latency: {
            proxy: proxyLatency
          }
        };
      }
      
      // If we get here, try a full message generation
      console.log(`Testing full message generation...`);
      const messageStartTime = Date.now();
      
      const messageResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 30,
          messages: [
            {
              role: "user",
              content: "Say hello and confirm the API is working properly."
            }
          ]
        })
      });
      
      const messageLatency = Date.now() - messageStartTime;
      
      if (!messageResponse.ok) {
        let errorText = 'Unknown error';
        try {
          const errorData = await messageResponse.json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          errorText = await messageResponse.text();
        }
        
        return {
          success: false,
          message: `Message generation failed with status: ${messageResponse.status}`,
          details: errorText,
          stage: 'message_generation',
          latency: {
            proxy: proxyLatency,
            message: messageLatency
          }
        };
      }
      
      const messageData = await messageResponse.json();
      const content = messageData.content ? messageData.content[0]?.text : 'No content returned';
      
      return {
        success: true,
        message: 'Claude API connection successful',
        content: content,
        model: messageData.model,
        latency: {
          proxy: proxyLatency,
          message: messageLatency,
          total: proxyLatency + messageLatency
        }
      };
      
    } catch (error) {
      console.error(`❌ Error testing Claude API:`, error);
      
      return {
        success: false,
        message: `Error testing Claude API: ${error.message}`,
        error: error,
        stage: 'connection',
        details: {
          name: error.name,
          stack: error.stack
        }
      };
    }
  }
  
  /**
   * Check if the current browser environment supports all required features
   * @returns {Object} Support status for various features
   */
  static checkEnvironmentSupport() {
    return {
      fetch: typeof fetch !== 'undefined',
      promises: typeof Promise !== 'undefined',
      async: typeof async function() {} !== 'undefined',
      json: typeof JSON !== 'undefined',
      localStorage: typeof localStorage !== 'undefined',
      cors: true, // We can't detect this directly, but assume it's supported
    };
  }
}

export default ClaudeApiTester;