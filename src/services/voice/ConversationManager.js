/**
 * Conversation Manager Service
 *
 * Preserves conversation context for natural multi-turn conversations:
 * - Conversation buffer with sliding window
 * - Turn tracking and numbering
 * - Context-aware message preparation
 * - Session management
 */

class ConversationManager {
  constructor() {
    // Conversation state
    this.conversationBuffer = [];
    this.currentSession = null;
    this.turnCount = 0;

    // Configuration
    this.config = {
      maxTurns: 10,           // Keep last 10 turns in context
      sessionTimeout: 300000, // 5 minutes of inactivity = new session
      minContextTurns: 3      // Minimum turns to send as context
    };

    // Timing
    this.lastInteractionTime = Date.now();
    this.sessionStartTime = null;
  }

  /**
   * Start a new conversation session
   * @param {Object} metadata - Session metadata (user, topic, etc.)
   * @returns {string} - Session ID
   */
  startSession(metadata = {}) {
    const sessionId = `session_${Date.now()}`;

    this.currentSession = {
      id: sessionId,
      startedAt: Date.now(),
      metadata,
      turns: 0
    };

    this.conversationBuffer = [];
    this.turnCount = 0;
    this.sessionStartTime = Date.now();
    this.lastInteractionTime = Date.now();

    console.log('💬 New conversation session started:', sessionId);
    return sessionId;
  }

  /**
   * Add user input to conversation
   * @param {string} transcript - User's spoken input
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - Message object
   */
  addUserInput(transcript, metadata = {}) {
    this.checkSessionTimeout();

    const message = {
      role: 'user',
      content: transcript,
      timestamp: Date.now(),
      turn: ++this.turnCount,
      metadata: {
        ...metadata,
        inputType: 'voice',
        sessionId: this.currentSession?.id
      }
    };

    this.conversationBuffer.push(message);
    this.trimBuffer();
    this.lastInteractionTime = Date.now();

    if (this.currentSession) {
      this.currentSession.turns++;
    }

    console.log(`💬 User input added (turn ${this.turnCount}):`, transcript.substring(0, 50) + '...');
    return message;
  }

  /**
   * Add AI response to conversation
   * @param {string} response - AI's response
   * @param {Object} metadata - Additional metadata
   * @returns {Object} - Message object
   */
  addAIResponse(response, metadata = {}) {
    const message = {
      role: 'assistant',
      content: response,
      timestamp: Date.now(),
      turn: this.turnCount,
      metadata: {
        ...metadata,
        sessionId: this.currentSession?.id
      }
    };

    this.conversationBuffer.push(message);
    this.trimBuffer();
    this.lastInteractionTime = Date.now();

    console.log(`💬 AI response added (turn ${this.turnCount}):`, response.substring(0, 50) + '...');
    return message;
  }

  /**
   * Get conversation context for AI
   * @param {number} turns - Number of recent turns to include (default: config.maxTurns)
   * @returns {Array} - Context messages for AI
   */
  getContext(turns = null) {
    const numTurns = turns || this.config.maxTurns;
    const context = this.conversationBuffer.slice(-numTurns * 2); // *2 for user+assistant pairs

    console.log(`💬 Getting context: ${context.length} messages (${Math.floor(context.length / 2)} turns)`);
    return context;
  }

  /**
   * Prepare messages for Claude API
   * @param {string} newUserInput - New user input to add
   * @returns {Array} - Messages array for Claude API
   */
  prepareMessagesForAPI(newUserInput) {
    this.checkSessionTimeout();

    // Add new user input
    this.addUserInput(newUserInput);

    // Get recent context
    const context = this.getContext();

    // Format for Claude API
    const messages = context.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    console.log(`💬 Prepared ${messages.length} messages for API`);
    return messages;
  }

  /**
   * Get conversation summary
   * @returns {Object} - Summary statistics
   */
  getSummary() {
    return {
      sessionId: this.currentSession?.id,
      totalTurns: this.turnCount,
      bufferSize: this.conversationBuffer.length,
      sessionDuration: this.currentSession ? Date.now() - this.sessionStartTime : 0,
      timeSinceLastInteraction: Date.now() - this.lastInteractionTime,
      isActive: this.isSessionActive()
    };
  }

  /**
   * Check if session is still active
   * @returns {boolean}
   */
  isSessionActive() {
    if (!this.currentSession) {
      return false;
    }

    const timeSinceLastInteraction = Date.now() - this.lastInteractionTime;
    return timeSinceLastInteraction < this.config.sessionTimeout;
  }

  /**
   * Check for session timeout and start new session if needed
   */
  checkSessionTimeout() {
    if (!this.isSessionActive() && this.currentSession) {
      console.log('💬 Session timed out, starting new session');
      this.startSession(this.currentSession.metadata);
    }
  }

  /**
   * Trim conversation buffer to max turns
   */
  trimBuffer() {
    const maxMessages = this.config.maxTurns * 2; // User + assistant pairs

    if (this.conversationBuffer.length > maxMessages) {
      const removed = this.conversationBuffer.length - maxMessages;
      this.conversationBuffer = this.conversationBuffer.slice(-maxMessages);
      console.log(`💬 Trimmed ${removed} old messages from buffer`);
    }
  }

  /**
   * Clear conversation history
   */
  clear() {
    const oldSessionId = this.currentSession?.id;

    this.conversationBuffer = [];
    this.currentSession = null;
    this.turnCount = 0;
    this.sessionStartTime = null;

    console.log('💬 Conversation cleared:', oldSessionId);
  }

  /**
   * Update configuration
   * @param {Object} config - New configuration values
   */
  updateConfig(config) {
    this.config = {
      ...this.config,
      ...config
    };
    console.log('🔧 Conversation manager config updated:', this.config);
  }

  /**
   * Get full conversation history
   * @returns {Array} - All messages in buffer
   */
  getHistory() {
    return [...this.conversationBuffer];
  }

  /**
   * Export conversation for analysis
   * @returns {Object} - Exportable conversation data
   */
  export() {
    return {
      session: this.currentSession,
      messages: this.conversationBuffer,
      summary: this.getSummary(),
      exportedAt: Date.now()
    };
  }

  /**
   * Import conversation from export
   * @param {Object} data - Exported conversation data
   */
  import(data) {
    if (data.session) {
      this.currentSession = data.session;
    }
    if (data.messages) {
      this.conversationBuffer = data.messages;
      this.turnCount = Math.max(...data.messages.map(m => m.turn || 0));
    }
    this.lastInteractionTime = Date.now();

    console.log('💬 Conversation imported:', data.session?.id);
  }
}

// Export singleton instance
const conversationManager = new ConversationManager();
export default conversationManager;
