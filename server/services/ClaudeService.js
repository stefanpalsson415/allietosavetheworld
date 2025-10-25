/**
 * ClaudeService for Server-Side Knowledge Graph
 *
 * Full implementation with Anthropic SDK for dynamic Cypher generation (Phase 2)
 */

import Anthropic from '@anthropic-ai/sdk';

class ClaudeService {
  constructor() {
    const apiKey = process.env.INTERNAL_API_KEY || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      console.warn('⚠️ No Anthropic API key found - dynamic Cypher generation disabled');
      this.client = null;
      this.enabled = false;
    } else {
      this.client = new Anthropic({ apiKey });
      this.enabled = true;
      console.log('✅ ClaudeService initialized with Anthropic API');
    }

    this.model = 'claude-opus-4-20250514'; // Latest Opus model
  }

  /**
   * Generate a response from Claude API
   * @param {string|Array} prompt - The prompt (string or array of messages)
   * @param {object} options - Options (temperature, max_tokens, etc.)
   * @returns {Promise<string>} - Claude's response
   */
  static async generateResponse(prompt, options = {}) {
    const instance = new ClaudeService();

    if (!instance.enabled) {
      console.log('⚠️ ClaudeService disabled - falling back to template queries');
      throw new Error('Claude API not available - use template queries instead');
    }

    try {
      // Handle both string and array of messages formats
      let messages;
      if (Array.isArray(prompt)) {
        messages = prompt;
      } else if (typeof prompt === 'string') {
        messages = [{ role: 'user', content: prompt }];
      } else {
        throw new Error('Invalid prompt format');
      }

      console.log('🤖 Calling Claude API for dynamic Cypher generation...');

      const response = await instance.client.messages.create({
        model: instance.model,
        max_tokens: options.max_tokens || 500,
        temperature: options.temperature || 0.1,
        messages: messages
      });

      // Extract text from response
      const text = response.content[0]?.text || '';

      console.log('✅ Claude API response received:', text.substring(0, 100) + '...');

      return text;

    } catch (error) {
      console.error('❌ Claude API error:', error.message);
      throw error;
    }
  }

  /**
   * Instance method for backward compatibility
   */
  async generateResponse(prompt, options = {}) {
    return ClaudeService.generateResponse(prompt, options);
  }
}

export default ClaudeService;
