// BlogAIService.js - AI-powered blog content enhancement
// Uses existing ClaudeService to generate summaries and takeaways

import ClaudeService from './ClaudeService';

/**
 * BlogAIService - Generates AI summaries and extracts key takeaways from blog posts
 * Following CLAUDE.md service layer patterns
 */
class BlogAIService {
  /**
   * Generate "Allie's Take" summary for a blog post
   * @param {string} title - Blog post title
   * @param {string} content - Full blog post content (HTML or markdown)
   * @param {string} category - Post category
   * @returns {Promise<string>} AI-generated summary
   */
  async generateSummary(title, content, category) {
    try {
      // Clean HTML tags from content for better AI processing
      const cleanContent = this._stripHtml(content);

      const prompt = `You are Allie, an AI family assistant. Summarize this blog post in 2-3 sentences from your perspective.
Be warm, helpful, and speak directly to busy parents. Focus on the practical value and why this matters for family life.

Title: ${title}
Category: ${category}

Content:
${cleanContent.substring(0, 3000)} ${cleanContent.length > 3000 ? '...' : ''}

Your summary (2-3 sentences, conversational tone):`;

      const response = await ClaudeService.sendMessage(prompt);

      // Extract just the summary text, remove any internal tags
      return this._cleanResponse(response);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      throw new Error('Failed to generate summary');
    }
  }

  /**
   * Extract key takeaways from blog post content
   * @param {string} title - Blog post title
   * @param {string} content - Full blog post content
   * @param {number} count - Number of takeaways (default 5)
   * @returns {Promise<Array<string>>} Array of key takeaway strings
   */
  async extractKeyTakeaways(title, content, count = 5) {
    try {
      const cleanContent = this._stripHtml(content);

      const prompt = `Extract the ${count} most important, actionable takeaways from this blog post.
Each takeaway should be a single, clear sentence that busy parents can quickly understand and remember.

Title: ${title}

Content:
${cleanContent.substring(0, 4000)} ${cleanContent.length > 4000 ? '...' : ''}

Return ONLY the takeaways as a numbered list (1., 2., 3., etc.), nothing else.`;

      const response = await ClaudeService.sendMessage(prompt);

      // Parse the numbered list into an array
      return this._parseListResponse(response, count);
    } catch (error) {
      console.error('Error extracting takeaways:', error);
      throw new Error('Failed to extract takeaways');
    }
  }

  /**
   * Generate both summary and takeaways in one call (more efficient)
   * @param {string} title - Blog post title
   * @param {string} content - Full blog post content
   * @param {string} category - Post category
   * @param {number} takeawayCount - Number of takeaways
   * @returns {Promise<{summary: string, takeaways: Array<string>}>}
   */
  async generatePostEnhancements(title, content, category, takeawayCount = 5) {
    try {
      const cleanContent = this._stripHtml(content);

      const prompt = `You are Allie, an AI family assistant. Analyze this blog post and provide:

1. A warm, conversational summary (2-3 sentences from your perspective)
2. ${takeawayCount} key actionable takeaways for busy parents

Title: ${title}
Category: ${category}

Content:
${cleanContent.substring(0, 4000)} ${cleanContent.length > 4000 ? '...' : ''}

Format your response EXACTLY like this:

SUMMARY:
[Your 2-3 sentence summary here]

TAKEAWAYS:
1. [First takeaway]
2. [Second takeaway]
3. [Third takeaway]
4. [Fourth takeaway]
5. [Fifth takeaway]`;

      const response = await ClaudeService.sendMessage(prompt);

      return this._parseEnhancementsResponse(response, takeawayCount);
    } catch (error) {
      console.error('Error generating post enhancements:', error);
      throw new Error('Failed to generate post enhancements');
    }
  }

  /**
   * Strip HTML tags from content
   * @private
   */
  _stripHtml(html) {
    if (!html) return '';
    // Remove HTML tags
    const text = html.replace(/<[^>]*>/g, ' ');
    // Remove extra whitespace
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Clean AI response (remove internal tags like <thinking>, etc.)
   * @private
   */
  _cleanResponse(response) {
    if (!response) return '';

    // Remove internal XML tags that Claude might use
    let cleaned = response
      .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
      .replace(/<reflection>[\s\S]*?<\/reflection>/gi, '')
      .replace(/<planning>[\s\S]*?<\/planning>/gi, '')
      .replace(/<data_type>[\s\S]*?<\/data_type>/gi, '')
      .trim();

    return cleaned;
  }

  /**
   * Parse numbered list response into array
   * @private
   */
  _parseListResponse(response, expectedCount) {
    const cleaned = this._cleanResponse(response);

    // Split by newlines and filter for numbered items
    const lines = cleaned.split('\n');
    const takeaways = [];

    for (const line of lines) {
      // Match lines that start with a number followed by period or parenthesis
      const match = line.match(/^\s*\d+[\.)]\s*(.+)$/);
      if (match && match[1]) {
        takeaways.push(match[1].trim());
      }
    }

    // If we didn't get enough, try splitting by digits
    if (takeaways.length < expectedCount) {
      const fallbackMatches = cleaned.match(/\d+[\.)]\s*([^\d]+)/g);
      if (fallbackMatches) {
        return fallbackMatches.slice(0, expectedCount).map(m =>
          m.replace(/^\d+[\.)]\s*/, '').trim()
        );
      }
    }

    return takeaways.slice(0, expectedCount);
  }

  /**
   * Parse combined summary and takeaways response
   * @private
   */
  _parseEnhancementsResponse(response, expectedCount) {
    const cleaned = this._cleanResponse(response);

    // Extract summary (everything between SUMMARY: and TAKEAWAYS:)
    const summaryMatch = cleaned.match(/SUMMARY:\s*([\s\S]*?)(?=TAKEAWAYS:|$)/i);
    const summary = summaryMatch ? summaryMatch[1].trim() : '';

    // Extract takeaways section
    const takeawaysMatch = cleaned.match(/TAKEAWAYS:\s*([\s\S]*?)$/i);
    const takeawaysText = takeawaysMatch ? takeawaysMatch[1] : '';

    // Parse takeaways list
    const takeaways = this._parseListResponse(takeawaysText, expectedCount);

    return {
      summary: summary || 'AI summary not available',
      takeaways: takeaways.length > 0 ? takeaways : [
        'Key insights from this article',
        'Practical tips for busy families',
        'Strategies to reduce mental load'
      ]
    };
  }

  /**
   * Suggest meta description based on content
   * @param {string} title - Blog post title
   * @param {string} content - Full content
   * @returns {Promise<string>} SEO-optimized meta description (150-160 chars)
   */
  async generateMetaDescription(title, content) {
    try {
      const cleanContent = this._stripHtml(content);

      const prompt = `Create an SEO-optimized meta description (150-160 characters) for this blog post.
Make it compelling and include relevant keywords for family management, mental load, and parenting.

Title: ${title}
Content: ${cleanContent.substring(0, 2000)}...

Meta description (150-160 chars):`;

      const response = await ClaudeService.sendMessage(prompt);
      const cleaned = this._cleanResponse(response);

      // Trim to max 160 characters
      return cleaned.substring(0, 160);
    } catch (error) {
      console.error('Error generating meta description:', error);
      throw new Error('Failed to generate meta description');
    }
  }

  /**
   * Suggest tags based on content
   * @param {string} title - Blog post title
   * @param {string} content - Full content
   * @param {number} count - Number of tags to suggest
   * @returns {Promise<Array<string>>} Array of suggested tags
   */
  async suggestTags(title, content, count = 5) {
    try {
      const cleanContent = this._stripHtml(content);

      const prompt = `Suggest ${count} relevant tags for this blog post.
Tags should be single words or short phrases related to family management, parenting, mental load, work-life balance, etc.

Title: ${title}
Content: ${cleanContent.substring(0, 2000)}...

Suggested tags (comma-separated, lowercase):`;

      const response = await ClaudeService.sendMessage(prompt);
      const cleaned = this._cleanResponse(response);

      // Parse comma-separated tags
      return cleaned
        .split(',')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .slice(0, count);
    } catch (error) {
      console.error('Error suggesting tags:', error);
      throw new Error('Failed to suggest tags');
    }
  }
}

export default new BlogAIService();
