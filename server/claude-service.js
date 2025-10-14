const axios = require('axios');

class ClaudeService {
  constructor() {
    this.apiKey = process.env.REACT_APP_CLAUDE_API_KEY || process.env.CLAUDE_API_KEY;
  }

  async processImageWithPrompt(base64Image, mimeType, prompt) {
    if (!this.apiKey) {
      console.warn('Claude API key not configured');
      return 'Image received but Claude API is not configured. Please set CLAUDE_API_KEY environment variable.';
    }

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mimeType,
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('Claude API error:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new ClaudeService();