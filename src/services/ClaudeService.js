// src/services/ClaudeService.js - SIMPLIFIED
// This is a simplified version that makes direct API calls to the Claude API
import config from '../config';
import neutralVoiceService from './NeutralVoiceService';

class ClaudeService {
  constructor() {
    // Set backend URL from config with fallback - UPDATED PRODUCTION URL (Oct 19, 2025)
    const backendUrl = config?.backend?.claudeUrl || (
      process.env.NODE_ENV === 'production'
        ? 'https://allie-claude-api-363935868004.us-central1.run.app/api/claude'
        : 'http://localhost:3002/api/claude'
    );
    this.proxyUrl = backendUrl;
    
    // Set Claude model - using Claude Opus 4.1 (most capable model - best for internal users)
    this.model = 'claude-opus-4-1-20250805';
    
    // Default settings
    this.mockMode = false;
    this.debugMode = true;
    
    console.log(`ClaudeService initialized with backend URL: ${this.proxyUrl}`);
  }
  
  /**
   * Legacy method for backward compatibility
   * @param {string} prompt - The prompt text
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Claude's response text
   */
  async getCompletion(prompt, options = {}) {
    console.log("🔄 ClaudeService.getCompletion - Legacy method called");
    
    // Convert to new format and call generateResponse
    const messages = [{ role: 'user', content: prompt }];
    return this.generateResponse(messages, {}, options);
  }
  
  /**
   * Send message method for AllieAIService compatibility
   * @param {string} prompt - The prompt text
   * @param {string} role - The role (not used, kept for compatibility)
   * @param {string} familyId - Optional family ID for context enrichment
   * @param {Object} additionalContext - Additional context like current user, family members, etc.
   * @returns {Promise<string>} Claude's response text
   */
  async sendMessage(prompt, role = 'user', familyId = null, additionalContext = {}) {
    console.log("🔄 ClaudeService.sendMessage - Called for AllieAIService");

    // Build enriched context if family info is provided
    let systemContext = '';
    if (familyId && additionalContext) {
      systemContext = await this.buildFamilyContext(familyId, additionalContext);
    }

    // Convert to new format and call generateResponse with system context
    const messages = [{ role: 'user', content: prompt }];
    const context = systemContext ? { system: systemContext } : {};

    return this.generateResponse(messages, context, {});
  }
  
  /**
   * Generate a response from Claude API
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} context - Context object with system prompt and tools
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Claude's response text
   */
  async generateResponse(messages, context = {}, options = {}) {
    // Rate limiting - wait if necessary
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before making request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
    console.log("🔄 ClaudeService.generateResponse - Simple direct implementation");
    
    try {
      // Ensure messages are in the correct format
      if (!Array.isArray(messages)) {
        console.warn("⚠️ Messages not provided as array, converting...");
        messages = [{ role: 'user', content: String(messages) }];
      }
      
      // Check if any message contains image content
      const hasImages = messages.some(msg => 
        Array.isArray(msg.content) && 
        msg.content.some(block => block.type === 'image')
      );
      
      if (hasImages) {
        console.log("📸 Message contains images, using Claude's vision capabilities");
      }
      
      // Debug log
      console.log(`Sending ${messages.length} messages to Claude API`);
      
      // Prepare request body
      // Allow model override from context (for web search with Sonnet)
      const modelToUse = context?.model || this.model;
      if (context?.model) {
        console.log(`🔄 Using override model: ${context.model} instead of default: ${this.model}`);
      }
      
      const maxTokens = context.max_tokens || options.max_tokens || 4096;
      console.log(`🎯 Using max_tokens: ${maxTokens} (from ${context.max_tokens ? 'context' : options.max_tokens ? 'options' : 'default'})`);

      const requestBody = {
        model: modelToUse,
        max_tokens: maxTokens,
        temperature: context.temperature || options.temperature || 0.7,
        messages: messages
      };
      
      // Add system message if provided
      if (context && context.system) {
        requestBody.system = context.system;
      }
      
      // Add tools if provided (for web search)
      if (context && context.tools && context.tools.length > 0) {
        requestBody.tools = context.tools;
        console.log("🔧 Including tools in request:", context.tools.map(t => t.name).join(', '));
      }
      
      // Make the request - backend handles API key
      console.log("📤 Sending request to:", this.proxyUrl);
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      // Check for errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API request failed with status ${response.status}:`, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      // Parse the response
      const result = await response.json();
      
      // Handle tool use responses (like web search)
      if (result && result.content) {
        // Log the full response structure for debugging
        console.log("📊 Full response structure:", JSON.stringify(result.content.map(c => ({
          type: c.type,
          hasText: !!c.text,
          hasInput: !!c.input,
          name: c.name
        }))));
        
        // Check for tool uses (both client-side and server-side)
        const toolUses = result.content.filter(c => c.type === 'tool_use' || c.type === 'server_tool_use');
        const textContent = result.content.filter(c => c.type === 'text');
        const searchResults = result.content.filter(c => c.type === 'web_search_tool_result');
        
        if (toolUses.length > 0 || searchResults.length > 0) {
          console.log("🔧 Tools detected:", {
            toolUses: toolUses.map(t => t.name || 'server_tool'),
            searchResults: searchResults.length
          });
          
          // For server-side web search, results are integrated into text blocks
          let fullResponse = '';
          
          // Collect all text content (includes integrated search results)
          for (const content of result.content) {
            if (content.type === 'text' && content.text) {
              fullResponse += content.text + '\n';
              
              // Log if citations are present
              if (content.citations) {
                console.log("📚 Citations found:", content.citations.length);
              }
            }
          }
          
          if (fullResponse.trim()) {
            // Clean up any XML-like tags that shouldn't be shown to users
            fullResponse = this.cleanResponse(fullResponse);
            console.log("✅ Claude API response received (with web search):", fullResponse.substring(0, 100) + "...");
            console.log("📏 Full response length:", fullResponse.length);
            return fullResponse.trim();
          }
        }
        
        // Standard text response without tools
        if (textContent.length > 0) {
          let responseText = textContent.map(c => c.text).join('\n');
          // Clean up any XML-like tags that shouldn't be shown to users
          responseText = this.cleanResponse(responseText);
          console.log("✅ Claude API response received:", responseText.substring(0, 50) + "...");
          return responseText;
        } else if (result.content.length > 0 && result.content[0].text) {
          // Fallback for standard response format
          let responseText = result.content[0].text;
          // Clean up any XML-like tags that shouldn't be shown to users
          responseText = this.cleanResponse(responseText);
          console.log("✅ Claude API response received:", responseText.substring(0, 50) + "...");
          return responseText;
        }
      }
      
      // Fallback for empty response
      console.warn("⚠️ Received empty response from Claude API");
      return "I'm sorry, I couldn't generate a response at this time.";
    } catch (error) {
      console.error("❌ Error in generateResponse:", error);
      throw error;
    }
  }
  
  /**
   * Clean response text by removing internal XML-like tags AND ensuring neutral voice
   * @param {string} text - The response text to clean
   * @returns {string} Cleaned and neutralized text
   */
  cleanResponse(text) {
    // Step 1: Remove various internal tags that shouldn't be displayed to users
    // These include memory storage tags, thinking blocks, and other internal processing
    const tagsToRemove = [
      /<store_family_data>[\s\S]*?<\/store_family_data>/gi,
      /<thinking>[\s\S]*?<\/thinking>/gi,
      /<reflection>[\s\S]*?<\/reflection>/gi,
      /<internal>[\s\S]*?<\/internal>/gi,
      /<metadata>[\s\S]*?<\/metadata>/gi,
      /<data_type>[\s\S]*?<\/data_type>/gi,
      /<content>[\s\S]*?<\/content>/gi,
      /<store_memory>[\s\S]*?<\/store_memory>/gi,
      /<update_memory>[\s\S]*?<\/update_memory>/gi,
      /<process_intent>[\s\S]*?<\/process_intent>/gi
    ];

    let cleanedText = text;
    for (const pattern of tagsToRemove) {
      cleanedText = cleanedText.replace(pattern, '');
    }

    // Also clean up any leftover empty lines
    cleanedText = cleanedText.replace(/^\s*[\r\n]/gm, '').trim();

    // Step 2: CRITICAL - Ensure neutral, blame-free voice
    // Allie must speak as a neutral third party, not as judge
    // This creates curiosity rather than defensiveness
    try {
      cleanedText = neutralVoiceService.neutralizeMessage(cleanedText);
      console.log('✅ Message neutralized through NeutralVoiceService');
    } catch (error) {
      console.warn('⚠️ NeutralVoiceService failed, using original text:', error);
      // If neutralization fails, continue with cleaned text
    }

    return cleanedText;
  }

  /**
   * Test connection to Claude API
   * @returns {Promise<boolean>} Success status
   */
  /**
   * Build enriched family context for Claude
   * @param {string} familyId - The family ID
   * @param {Object} additionalContext - Additional context data
   * @returns {Promise<string>} System prompt with family context
   */
  async buildFamilyContext(familyId, additionalContext) {
    try {
      const { currentUser, familyMembers, selectedUser } = additionalContext;

      // Build comprehensive family context
      let contextString = `You are Allie, a helpful AI assistant for this family.\n\n`;

      // Add current user context
      if (currentUser || selectedUser) {
        const user = currentUser || selectedUser;
        contextString += `Current user talking to you: ${user.name}`;
        if (user.role) contextString += ` (${user.role})`;
        if (user.age) contextString += `, age ${user.age}`;
        contextString += '\n';

        // Add user's preferences if available
        if (user.preferences) {
          contextString += `${user.name}'s preferences:\n`;
          if (user.preferences.taskPreferences?.length > 0) {
            contextString += `- Preferred tasks: ${user.preferences.taskPreferences.join(', ')}\n`;
          }
          if (user.preferences.tasksToAvoid?.length > 0) {
            contextString += `- Tasks to avoid: ${user.preferences.tasksToAvoid.join(', ')}\n`;
          }
          if (user.preferences.workingHours) {
            contextString += `- Working hours: ${user.preferences.workingHours}\n`;
          }
          if (user.preferences.completionStyle) {
            contextString += `- Completion style: ${user.preferences.completionStyle}\n`;
          }
        }
        contextString += '\n';
      }

      // Add family members context
      if (familyMembers && familyMembers.length > 0) {
        contextString += `Family members:\n`;
        for (const member of familyMembers) {
          contextString += `- ${member.name}`;
          if (member.role) contextString += ` (${member.role})`;
          if (member.age) contextString += `, age ${member.age}`;

          // Add member's key preferences if available
          if (member.preferences) {
            const prefs = [];
            if (member.preferences.taskPreferences?.length > 0) {
              prefs.push(`likes ${member.preferences.taskPreferences.slice(0, 3).join(', ')}`);
            }
            if (member.preferences.completionStyle) {
              prefs.push(`${member.preferences.completionStyle} completion style`);
            }
            if (prefs.length > 0) {
              contextString += ` - ${prefs.join(', ')}`;
            }
          }
          contextString += '\n';
        }
        contextString += '\n';
      }

      // Add any profile data if available
      try {
        // Try to load enhanced profiles if FamilyProfileService is available
        const FamilyProfileService = (await import('./FamilyProfileService')).default;

        // Get current user's enhanced profile if available
        if ((currentUser || selectedUser)?.profileId) {
          const profile = await FamilyProfileService.getEnhancedProfile((currentUser || selectedUser).profileId);
          if (profile?.preferences) {
            contextString += 'Additional context from profile:\n';
            if (profile.preferences.hobbies?.length > 0) {
              contextString += `- Hobbies: ${profile.preferences.hobbies.join(', ')}\n`;
            }
            if (profile.preferences.goals?.length > 0) {
              contextString += `- Goals: ${profile.preferences.goals.join(', ')}\n`;
            }
          }
        }
      } catch (error) {
        // Silently fail if profile service is not available
        console.log('Enhanced profiles not loaded for context');
      }

      contextString += `\n=== KNOWLEDGE GRAPH CAPABILITIES ===

You have access to the family's Knowledge Graph via Neo4j, which provides real-time insights about:

1. **Invisible Labor Analysis** - Who notices tasks that need doing, who coordinates family activities, who monitors ongoing situations
   - Use when users ask: "Who does more?", "Who notices things?", "Why am I so overwhelmed?"
   - Data includes: anticipation patterns, monitoring burden, coordination bottlenecks

2. **Cognitive Load Distribution** - Who's carrying the mental load in different areas
   - Use when users ask: "Who's most stressed?", "Who should I delegate to?", "Am I doing too much?"
   - Data includes: task cognitive load, responsibility ownership, burnout risks

3. **Task Creation Patterns** - When are tasks created, by whom, in what categories
   - Use when users ask: "When do we create most tasks?", "What patterns do we have?", "Why are mornings chaotic?"
   - Data includes: temporal patterns, category distribution, creation frequency

4. **Coordination Bottlenecks** - Who everyone relies on, who's the information hub
   - Use when users ask: "Who's the bottleneck?", "Why does everything go through me?", "Who knows what's happening?"
   - Data includes: relationship centrality, information flow, dependency patterns

5. **Predictive Insights** - Upcoming conflicts, burnout risks, recommended interventions
   - Use proactively when you notice high cognitive load or imbalance patterns
   - Data includes: conflict predictions, burnout alerts, recommended habit changes

**When to Use Knowledge Graph Data:**
- User asks about workload distribution or balance
- User asks about family patterns or "who does what"
- User expresses feeling overwhelmed or asks for help delegating
- User wants to understand invisible labor or mental load
- You notice high cognitive load in the context data

**How to Present Knowledge Graph Insights:**
- Use neutral, system-focused language (avoid blame)
- Focus on patterns and data, not judgment
- Offer actionable recommendations based on insights
- Example: "The Knowledge Graph shows Sarah creates 78% of tasks, which may contribute to feeling overwhelmed. Let's explore delegation strategies."

\n`;

      contextString += '\nImportant: Tailor your responses to be appropriate for the current user. If talking to a child, use simpler language. Be aware of each family member\'s preferences and personality.\n';

      return contextString;
    } catch (error) {
      console.error('Error building family context:', error);
      return ''; // Return empty string on error
    }
  }

  async testConnection() {
    try {
      console.log("🧪 Testing Claude API connection...");
      
      // Simple test request
      const response = await fetch(`${this.proxyUrl}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        console.log("✅ Claude API connection test passed!");
        return true;
      } else {
        console.warn(`❌ Claude API connection test failed with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error("❌ Claude API connectivity test failed:", error);
      return false;
    }
  }
  
  /**
   * Test connection to Claude API with retry logic
   * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
   * @param {number} retryDelay - Delay between retries in milliseconds (default: 1000)
   * @returns {Promise<boolean>} Success status
   */
  async testConnectionWithRetry(maxRetries = 3, retryDelay = 1000) {
    console.log(`🔄 Testing Claude API connection with retry (max ${maxRetries} attempts)...`);
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const success = await this.testConnection();
        
        if (success) {
          console.log(`✅ Connection test succeeded on attempt ${attempt}`);
          this.initialized = true;
          return true;
        }
        
        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          console.log(`⏳ Attempt ${attempt} failed, retrying in ${retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } catch (error) {
        console.error(`❌ Connection test attempt ${attempt} failed:`, error);
        
        // If not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
    
    console.error(`❌ All ${maxRetries} connection attempts failed`);
    this.initialized = false;
    return false;
  }

  /**
   * Generate personalized family story narrative for meetings
   * Uses Claude AI to transform data into emotional, engaging storytelling
   * @param {Object} familyData - Complete family meeting data
   * @returns {Promise<string>} Story narrative
   */
  async generateFamilyStoryNarrative(familyData) {
    const {
      familyMembers = [],
      balanceScoreChange = 0,
      taskCompletions = {},
      habitsCompleted = {},
      kgInsights = {},
      previousGoals = [],
      wins = [],
      challenges = [],
      kidResponses = {},
      eventRoles = [],
      currentWeek = 1
    } = familyData;

    // Build narrative prompt
    const systemPrompt = `You are Allie, an AI family assistant with a gift for storytelling. You transform family data into compelling narratives that help families see themselves as protagonists in their own story of growth and balance.

Your storytelling style:
- Use "Hero's Journey" narrative structure when appropriate
- Make data feel emotionally resonant and meaningful
- Celebrate small wins as turning points in the larger story
- Frame challenges as plot obstacles to overcome together
- Include specific names, numbers, and details to make it personal
- Write in present tense for immediacy ("This week, Sarah discovers...")
- Keep paragraphs short (2-3 sentences) for readability
- End with foreshadowing or a call to action for next week

Tone: Warm, encouraging, observant, occasionally poetic, always specific.`;

    const userPrompt = `Generate a personalized story narrative for this family's Week ${currentWeek} meeting:

FAMILY MEMBERS:
${familyMembers.map(m => `- ${m.name} (${m.role}${m.age ? `, age ${m.age}` : ''})`).join('\n')}

BALANCE SCORE CHANGE:
From ${balanceScoreChange > 0 ? 'previous score' : 'current score'} to current: ${balanceScoreChange > 0 ? '+' : ''}${Math.round(balanceScoreChange)} points

TASK COMPLETIONS:
${Object.entries(taskCompletions).map(([name, count]) => `${name}: ${count} tasks completed`).join('\n')}

HABITS COMPLETED:
${Object.entries(habitsCompleted).map(([habit, status]) => `${habit}: ${status.completed}/${status.total}`).join('\n')}

KNOWLEDGE GRAPH INSIGHTS:
${kgInsights.invisibleLabor ? `Invisible Labor: ${kgInsights.invisibleLabor[0]?.leader} anticipates ${kgInsights.invisibleLabor[0]?.anticipation} tasks (${kgInsights.invisibleLabor[0]?.percentageDifference}% of family load)` : 'No invisible labor data'}

EVENT ROLES:
${eventRoles.length > 0 ? `${eventRoles.length} events tracked with role assignments` : 'No event role tracking'}

PREVIOUS GOALS:
${previousGoals.map(g => `- ${g.goal} (${g.status})`).join('\n') || 'No previous goals'}

WINS THIS WEEK:
${wins.map(w => `- ${w}`).join('\n') || 'No specific wins recorded'}

CHALLENGES THIS WEEK:
${challenges.map(c => `- ${c}`).join('\n') || 'No specific challenges recorded'}

KIDS' RESPONSES:
${Object.entries(kidResponses).map(([question, answer]) => `${question}: "${answer}"`).join('\n') || 'No kids responses recorded'}

Generate a 3-5 paragraph story that:
1. Opens with this week's theme or defining moment
2. Highlights the journey (what changed, who grew, what was overcome)
3. Celebrates specific wins with data
4. Acknowledges challenges with empathy
5. Ends with momentum toward next week

Make it feel like a chapter in their family's story, not just a data summary.`;

    try {
      const response = await this.generateResponse(
        [{ role: 'user', content: userPrompt }],
        {
          model: 'claude-opus-4-1-20250805', // Use Opus for best storytelling
          system: systemPrompt,
          max_tokens: 1500,
          temperature: 0.8 // Higher temperature for more creative storytelling
        }
      );

      // Clean response
      let narrative = this._cleanResponse(response);

      // Remove any meta-commentary
      narrative = narrative.replace(/\[.*?\]/g, '').trim();

      return narrative;
    } catch (error) {
      console.error('Failed to generate family story narrative:', error);

      // Fallback to simple summary
      return this._generateFallbackNarrative(familyData);
    }
  }

  /**
   * Fallback narrative generation (no AI)
   * @private
   */
  _generateFallbackNarrative(familyData) {
    const {
      familyMembers = [],
      balanceScoreChange = 0,
      wins = [],
      challenges = [],
      currentWeek = 1
    } = familyData;

    const parentNames = familyMembers
      .filter(m => m.role === 'parent' || m.isParent)
      .map(m => m.name)
      .join(' and ');

    let narrative = `Week ${currentWeek} for the ${familyMembers[0]?.name || ''} family.\n\n`;

    if (balanceScoreChange > 10) {
      narrative += `This was a breakthrough week. Balance improved by ${Math.round(balanceScoreChange)} points - a significant shift toward equity.\n\n`;
    } else if (balanceScoreChange > 0) {
      narrative += `Steady progress this week, with balance improving by ${Math.round(balanceScoreChange)} points.\n\n`;
    } else if (balanceScoreChange < 0) {
      narrative += `This week presented challenges, with balance dipping ${Math.abs(Math.round(balanceScoreChange))} points.\n\n`;
    }

    if (wins.length > 0) {
      narrative += `Key wins: ${wins.join(', ')}.\n\n`;
    }

    if (challenges.length > 0) {
      narrative += `Challenges faced: ${challenges.join(', ')}.\n\n`;
    }

    narrative += `${parentNames}, you're on a journey toward better balance. Every week brings new insights and growth.`;

    return narrative;
  }
}

export default new ClaudeService();