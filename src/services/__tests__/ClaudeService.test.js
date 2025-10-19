/**
 * Unit Tests for ClaudeService.js
 *
 * Critical AI service - Allie cannot respond without this.
 * Tests the actual methods: generateResponse, sendMessage, cleanResponse, buildFamilyContext
 *
 * Total: 20 test cases
 */

import claudeService from '../ClaudeService';
import { createMockClaudeResponse, createMockFamily } from '../../test-utils/testHelpers';

// Mock NeutralVoiceService
jest.mock('../NeutralVoiceService', () => ({
  default: {
    neutralizeMessage: jest.fn((text) => text)
  }
}));

// Mock config
jest.mock('../../config', () => ({
  default: {
    backend: {
      claudeUrl: 'http://localhost:3002/api/claude'
    }
  }
}));

// Mock Firestore (not used in these tests but may be imported)
jest.mock('../firebase', () => ({
  db: {},
  auth: {}
}));

describe('ClaudeService', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  // ============================================================================
  // generateResponse() Tests
  // ============================================================================
  describe('generateResponse()', () => {

    test('should generate response for valid messages', async () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const mockResponse = createMockClaudeResponse('Hello! How can I help?');

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await claudeService.generateResponse(messages);

      expect(result).toBe('Hello! How can I help?');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/claude'),
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    test('should handle empty messages array', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockClaudeResponse('Response'))
        })
      );

      const result = await claudeService.generateResponse([]);

      expect(result).toBeTruthy();
    });

    test('should include system context when provided', async () => {
      const messages = [{ role: 'user', content: 'Test' }];
      const context = { system: 'You are a helpful assistant.' };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockClaudeResponse('Response'))
        })
      );

      await claudeService.generateResponse(messages, context);

      expect(global.fetch).toHaveBeenCalled();
      const callArgs = global.fetch.mock.calls[0][1];
      const body = JSON.parse(callArgs.body);
      expect(body.system).toBe('You are a helpful assistant.');
    });

    test('should handle API errors', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Server error')
        })
      );

      await expect(claudeService.generateResponse(messages)).rejects.toThrow();
    });

    test('should handle network errors', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      global.fetch = jest.fn(() => Promise.reject(new Error('Network failed')));

      await expect(claudeService.generateResponse(messages)).rejects.toThrow();
    });

    test('should handle tool use responses', async () => {
      const messages = [{ role: 'user', content: 'Search for information' }];
      const mockResponse = {
        content: [
          { type: 'tool_use', name: 'web_search', input: {} },
          { type: 'text', text: 'Here are the results' }
        ]
      };

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await claudeService.generateResponse(messages);

      expect(result).toContain('Here are the results');
    });

    test('should handle empty API response', async () => {
      const messages = [{ role: 'user', content: 'Test' }];

      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ content: [] })
        })
      );

      const result = await claudeService.generateResponse(messages);

      expect(result).toContain('couldn\'t generate a response');
    });
  });

  // ============================================================================
  // sendMessage() Tests
  // ============================================================================
  describe('sendMessage()', () => {

    test('should send message with family context', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockClaudeResponse('Response'))
        })
      );

      const result = await claudeService.sendMessage(
        'Hello',
        'user',
        'test-family-123',
        {
          currentUser: { name: 'Test User', role: 'parent' },
          familyMembers: []
        }
      );

      expect(result).toBeTruthy();
      expect(global.fetch).toHaveBeenCalled();
    });

    test('should work without family context', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createMockClaudeResponse('Response'))
        })
      );

      const result = await claudeService.sendMessage('Hello');

      expect(result).toBeTruthy();
    });
  });

  // ============================================================================
  // cleanResponse() Tests
  // ============================================================================
  describe('cleanResponse()', () => {

    test('should remove <thinking> tags', () => {
      const text = 'Hello <thinking>internal thoughts</thinking> world';
      const cleaned = claudeService.cleanResponse(text);

      expect(cleaned).not.toContain('<thinking>');
      expect(cleaned).not.toContain('internal thoughts');
      expect(cleaned).toContain('Hello');
      expect(cleaned).toContain('world');
    });

    test('should remove <store_family_data> tags', () => {
      const text = 'Data <store_family_data>{"name":"Test"}</store_family_data> end';
      const cleaned = claudeService.cleanResponse(text);

      expect(cleaned).not.toContain('<store_family_data>');
      expect(cleaned).not.toContain('{"name":"Test"}');
      expect(cleaned).toContain('Data');
      expect(cleaned).toContain('end');
    });

    test('should remove <reflection> tags', () => {
      const text = 'Text <reflection>analyzing...</reflection> more';
      const cleaned = claudeService.cleanResponse(text);

      expect(cleaned).not.toContain('<reflection>');
      expect(cleaned).not.toContain('analyzing');
    });

    test('should handle multiple tag types', () => {
      const text = '<thinking>think</thinking><store_family_data>data</store_family_data>Result';
      const cleaned = claudeService.cleanResponse(text);

      expect(cleaned).not.toContain('<thinking>');
      expect(cleaned).not.toContain('<store_family_data>');
      expect(cleaned).toContain('Result');
    });

    test('should handle nested tags', () => {
      const text = '<thinking>outer <thinking>inner</thinking> middle</thinking>Text';
      const cleaned = claudeService.cleanResponse(text);

      expect(cleaned).not.toContain('<thinking>');
      expect(cleaned).toContain('Text');
    });
  });

  // ============================================================================
  // buildFamilyContext() Tests
  // ============================================================================
  describe('buildFamilyContext()', () => {

    test('should build context with current user', async () => {
      const context = {
        currentUser: { name: 'Test Parent', role: 'parent', age: 35 }
      };

      const result = await claudeService.buildFamilyContext('family-123', context);

      expect(result).toContain('Test Parent');
      expect(result).toContain('parent');
    });

    test('should build context with family members', async () => {
      const context = {
        familyMembers: [
          { name: 'Parent 1', role: 'parent' },
          { name: 'Child 1', role: 'child', age: 10 }
        ]
      };

      const result = await claudeService.buildFamilyContext('family-123', context);

      expect(result).toContain('Parent 1');
      expect(result).toContain('Child 1');
      expect(result).toContain('Family members');
    });

    test('should handle empty context', async () => {
      const result = await claudeService.buildFamilyContext('family-123', {});

      expect(result).toContain('Allie');
      expect(result).toBeTruthy();
    });

    test('should handle null additionalContext', async () => {
      const result = await claudeService.buildFamilyContext('family-123', null);

      // Should return empty string on null context (graceful degradation)
      expect(typeof result).toBe('string');
    });
  });

  // ============================================================================
  // testConnection() Tests
  // ============================================================================
  describe('testConnection()', () => {

    test('should return true on successful connection', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true
        })
      );

      const result = await claudeService.testConnection();

      expect(result).toBe(true);
    });

    test('should return false on failed connection', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500
        })
      );

      const result = await claudeService.testConnection();

      expect(result).toBe(false);
    });

    test('should handle network errors', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

      const result = await claudeService.testConnection();

      expect(result).toBe(false);
    });
  });

  // ============================================================================
  // testConnectionWithRetry() Tests
  // ============================================================================
  describe('testConnectionWithRetry()', () => {

    test('should succeed on first attempt', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true
        })
      );

      const result = await claudeService.testConnectionWithRetry(3, 100);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure then succeed', async () => {
      let attempts = 0;
      global.fetch = jest.fn(() => {
        attempts++;
        return Promise.resolve({
          ok: attempts >= 2
        });
      });

      const result = await claudeService.testConnectionWithRetry(3, 10);

      expect(result).toBe(true);
      expect(attempts).toBe(2);
    });

    test('should fail after max retries', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: false
        })
      );

      const result = await claudeService.testConnectionWithRetry(2, 10);

      expect(result).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
