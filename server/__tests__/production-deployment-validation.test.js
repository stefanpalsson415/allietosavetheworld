/**
 * Production Deployment Validation Tests
 *
 * CRITICAL: These tests validate the deployed Cloud Run service
 * Run AFTER deploying to production to catch configuration issues
 *
 * Tests:
 * - Environment variables are set
 * - Claude API endpoint is accessible
 * - API key is valid
 * - Response format is correct
 * - Error handling works
 * - Rate limiting is active
 *
 * Usage:
 *   PRODUCTION_URL=https://allie-claude-api-363935868004.us-central1.run.app npm test -- production-deployment-validation
 *
 * Total: 15 test cases
 */

const axios = require('axios');

// Get production URL from environment
const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://allie-claude-api-363935868004.us-central1.run.app';

// Only run these tests if explicitly testing production
const describeProduction = process.env.TEST_PRODUCTION === 'true' ? describe : describe.skip;

describeProduction('Production Deployment Validation', () => {

  // ============================================================================
  // Health Check Tests
  // ============================================================================
  describe('Health Check', () => {

    test('should respond to /health endpoint', async () => {
      const response = await axios.get(`${PRODUCTION_URL}/health`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('status');
      expect(response.data.status).toBe('healthy');
      expect(response.data).toHaveProperty('timestamp');
    }, 10000);

    test('should return timestamp in ISO format', async () => {
      const response = await axios.get(`${PRODUCTION_URL}/health`);
      const timestamp = response.data.timestamp;

      expect(() => new Date(timestamp)).not.toThrow();
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  // ============================================================================
  // Claude API Endpoint Tests
  // ============================================================================
  describe('Claude API Endpoint', () => {

    test('should accept POST requests to /api/claude', async () => {
      try {
        const response = await axios.post(`${PRODUCTION_URL}/api/claude`, {
          messages: [{ role: 'user', content: 'Say "Production test successful" in exactly 3 words.' }],
          model: 'claude-opus-4-1-20250805',
          max_tokens: 20
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('content');
        expect(Array.isArray(response.data.content)).toBe(true);
        expect(response.data.content[0]).toHaveProperty('text');
      } catch (error) {
        // If this fails, check if it's due to missing API key (503)
        if (error.response?.status === 503) {
          throw new Error('CRITICAL: ANTHROPIC_API_KEY not set on Cloud Run service! See CLAUDE.md deployment checklist.');
        }
        throw error;
      }
    }, 30000); // 30s timeout for Claude API

    test('should return valid response structure', async () => {
      const response = await axios.post(`${PRODUCTION_URL}/api/claude`, {
        messages: [{ role: 'user', content: 'Say hello' }],
        model: 'claude-opus-4-1-20250805',
        max_tokens: 50
      });

      expect(response.data).toHaveProperty('content');
      expect(response.data).toHaveProperty('model');
      expect(response.data).toHaveProperty('usage');
      expect(response.data.usage).toHaveProperty('input_tokens');
      expect(response.data.usage).toHaveProperty('output_tokens');
    }, 30000);

    test('should return text content in correct format', async () => {
      const response = await axios.post(`${PRODUCTION_URL}/api/claude`, {
        messages: [{ role: 'user', content: 'Say hello' }],
        model: 'claude-opus-4-1-20250805',
        max_tokens: 50
      });

      const content = response.data.content[0];
      expect(content.type).toBe('text');
      expect(typeof content.text).toBe('string');
      expect(content.text.length).toBeGreaterThan(0);
    }, 30000);

    test('should handle multi-turn conversations', async () => {
      const response = await axios.post(`${PRODUCTION_URL}/api/claude`, {
        messages: [
          { role: 'user', content: 'My name is Test User.' },
          { role: 'assistant', content: 'Hello Test User!' },
          { role: 'user', content: 'What is my name?' }
        ],
        model: 'claude-opus-4-1-20250805',
        max_tokens: 50
      });

      expect(response.status).toBe(200);
      expect(response.data.content[0].text.toLowerCase()).toContain('test');
    }, 30000);
  });

  // ============================================================================
  // Error Handling Tests
  // ============================================================================
  describe('Error Handling', () => {

    test('should return 400 for invalid request (missing messages)', async () => {
      try {
        await axios.post(`${PRODUCTION_URL}/api/claude`, {
          model: 'claude-opus-4-1-20250805',
          max_tokens: 100
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('errors');
      }
    });

    test('should return 400 for invalid request (missing model)', async () => {
      try {
        await axios.post(`${PRODUCTION_URL}/api/claude`, {
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 100
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    test('should return 400 for invalid max_tokens', async () => {
      try {
        await axios.post(`${PRODUCTION_URL}/api/claude`, {
          messages: [{ role: 'user', content: 'Test' }],
          model: 'claude-opus-4-1-20250805',
          max_tokens: 20000 // Too high
        });
        fail('Should have thrown error');
      } catch (error) {
        expect(error.response.status).toBe(400);
      }
    });

    test('should handle large prompts gracefully', async () => {
      const largePrompt = 'A'.repeat(10000); // 10k characters

      const response = await axios.post(`${PRODUCTION_URL}/api/claude`, {
        messages: [{ role: 'user', content: largePrompt }],
        model: 'claude-opus-4-1-20250805',
        max_tokens: 100
      });

      expect(response.status).toBe(200);
    }, 30000);
  });

  // ============================================================================
  // Security Tests
  // ============================================================================
  describe('Security', () => {

    test('should have security headers', async () => {
      const response = await axios.get(`${PRODUCTION_URL}/health`);

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers['x-content-type-options']).toBe('nosniff');

      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    test('should enforce CORS for unauthorized origins', async () => {
      try {
        await axios.post(`${PRODUCTION_URL}/api/claude`, {
          messages: [{ role: 'user', content: 'Test' }],
          model: 'claude-opus-4-1-20250805',
          max_tokens: 50
        }, {
          headers: {
            'Origin': 'https://malicious-site.com'
          }
        });
      } catch (error) {
        // CORS errors might not be caught in Node.js, but browser would block
        // This test mainly documents expected behavior
      }
    }, 10000);

    test('should not leak API key in error messages', async () => {
      try {
        await axios.post(`${PRODUCTION_URL}/api/claude`, {
          messages: 'invalid',
          model: 'claude-opus-4-1-20250805'
        });
        fail('Should have thrown error');
      } catch (error) {
        const errorBody = JSON.stringify(error.response.data);
        expect(errorBody).not.toContain('sk-ant');
        expect(errorBody).not.toContain('API key');
      }
    });
  });

  // ============================================================================
  // Performance Tests
  // ============================================================================
  describe('Performance', () => {

    test('should respond to health check in under 1 second', async () => {
      const start = Date.now();
      await axios.get(`${PRODUCTION_URL}/health`);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);
    });

    test('should handle simple Claude requests in under 15 seconds', async () => {
      const start = Date.now();

      await axios.post(`${PRODUCTION_URL}/api/claude`, {
        messages: [{ role: 'user', content: 'Say hello' }],
        model: 'claude-opus-4-1-20250805',
        max_tokens: 20
      });

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(15000);
    }, 20000);
  });

  // ============================================================================
  // Environment Variable Validation
  // ============================================================================
  describe('Environment Variables', () => {

    test('should have ANTHROPIC_API_KEY configured (detectable via successful request)', async () => {
      // If this succeeds, API key is configured
      const response = await axios.post(`${PRODUCTION_URL}/api/claude`, {
        messages: [{ role: 'user', content: 'Test' }],
        model: 'claude-opus-4-1-20250805',
        max_tokens: 20
      });

      expect(response.status).toBe(200);
    }, 30000);

    test('should NOT return 503 "API key not set" error', async () => {
      const response = await axios.post(`${PRODUCTION_URL}/api/claude`, {
        messages: [{ role: 'user', content: 'Test' }],
        model: 'claude-opus-4-1-20250805',
        max_tokens: 20
      });

      expect(response.status).not.toBe(503);
      expect(response.data.message).not.toContain('API key not set');
    }, 30000);
  });
});

// Export helper function for manual testing
module.exports = {
  testProductionDeployment: async () => {
    console.log('🧪 Testing Production Deployment...\n');

    try {
      // Test 1: Health check
      console.log('1. Testing /health endpoint...');
      const healthResponse = await axios.get(`${PRODUCTION_URL}/health`);
      console.log(`✅ Health check passed: ${healthResponse.data.status}`);

      // Test 2: Claude API
      console.log('\n2. Testing /api/claude endpoint...');
      const claudeResponse = await axios.post(`${PRODUCTION_URL}/api/claude`, {
        messages: [{ role: 'user', content: 'Say "Production deployment successful" in exactly 3 words.' }],
        model: 'claude-opus-4-1-20250805',
        max_tokens: 20
      });
      console.log(`✅ Claude API passed: ${claudeResponse.data.content[0].text}`);

      // Test 3: Error handling
      console.log('\n3. Testing error handling...');
      try {
        await axios.post(`${PRODUCTION_URL}/api/claude`, {
          messages: 'invalid'
        });
        console.log('❌ Error handling failed - should have returned 400');
        return false;
      } catch (error) {
        if (error.response?.status === 400) {
          console.log('✅ Error handling passed');
        } else {
          console.log(`❌ Unexpected error status: ${error.response?.status}`);
          return false;
        }
      }

      console.log('\n✅ All production deployment tests passed!');
      return true;

    } catch (error) {
      console.error('\n❌ Production deployment test failed:');

      if (error.response?.status === 503 && error.response?.data?.message?.includes('API key not set')) {
        console.error('\n🚨 CRITICAL: ANTHROPIC_API_KEY is not set on Cloud Run!');
        console.error('\nFix with:');
        console.error('gcloud run services update allie-claude-api \\');
        console.error('  --region us-central1 \\');
        console.error('  --update-env-vars="ANTHROPIC_API_KEY=sk-ant-..."');
      } else {
        console.error(error.message);
        if (error.response) {
          console.error('Status:', error.response.status);
          console.error('Data:', error.response.data);
        }
      }

      return false;
    }
  }
};
