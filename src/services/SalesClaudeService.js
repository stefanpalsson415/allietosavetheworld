// Sales-specific Claude service that uses the public sales endpoint
class SalesClaudeService {
  constructor() {
    // Use the NEW backend URL
    this.backendUrl = process.env.REACT_APP_BACKEND_URL || 
                      (window.location.hostname === 'localhost' 
                        ? 'http://localhost:3002' 
                        : 'https://allie-claude-api-4eckwlczwa-uc.a.run.app');
  }

  async generateResponse(messages, context = {}, options = {}) {
    try {
      console.log('🎯 SalesClaudeService - Using dedicated sales endpoint');
      
      // Use the sales-specific endpoint
      const url = `${this.backendUrl}/api/claude/sales`;
      
      const requestBody = {
        model: options.model || "claude-3-5-sonnet-20241022",
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7,
        messages: messages,
        ...(context.system && { system: context.system })
      };

      console.log('📤 Sending sales chat request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Sales API request failed:', errorData);
        throw new Error(`Sales API request failed: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      if (data.content && data.content[0] && data.content[0].text) {
        return data.content[0].text;
      } else {
        throw new Error('Unexpected response format from sales API');
      }
    } catch (error) {
      console.error('❌ Error in sales generateResponse:', error);
      throw error;
    }
  }
}

// Export as singleton
export default new SalesClaudeService();