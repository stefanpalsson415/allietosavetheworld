/**
 * ClaudeService Stub for Server-Side Knowledge Graph
 *
 * Minimal implementation to satisfy imports from ParentingIntelligenceService
 * Returns simple responses without actual AI generation
 */

class ClaudeService {
  /**
   * Generate a simple response (stub implementation)
   * @param {string} prompt - The prompt to send
   * @param {object} options - Options (model, max_tokens, etc.)
   * @returns {Promise<string>} - Simple response
   */
  static async generateResponse(prompt, options = {}) {
    // For now, return a simple placeholder response
    // This allows the knowledge graph to load data without AI insights
    console.log('⚠️ ClaudeService stub called - AI insights disabled in this environment');
    console.log('   Prompt:', prompt.substring(0, 100) + '...');

    return 'AI insights generation is not available in the current environment. ' +
           'The knowledge graph data is available, but natural language insights require ' +
           'the full ClaudeService implementation with API keys.';
  }
}

export default ClaudeService;
