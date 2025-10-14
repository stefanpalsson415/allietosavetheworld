// Add this import to AllieChat.jsx at the top
import MessageTracker from './tracking';

// tracking.js - Adds diagnostic tracking to chat functionality
class MessageTracker {
  static instance;
  
  constructor() {
    this.messages = [];
    this.apiCalls = [];
    this.errors = [];
    
    // Create debug element once DOM is ready
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.createDebugUI();
      });
    }
  }
  
  static getInstance() {
    if (!MessageTracker.instance) {
      MessageTracker.instance = new MessageTracker();
    }
    return MessageTracker.instance;
  }
  
  // Track user message
  trackUserMessage(message) {
    this.messages.push({
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    this.updateDebugUI();
    return message;
  }
  
  // Track API call
  trackApiCall(requestData) {
    const requestId = Date.now().toString();
    this.apiCalls.push({
      id: requestId,
      request: requestData,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
    this.updateDebugUI();
    return requestId;
  }
  
  // Update API call with response
  trackApiResponse(requestId, responseData, success = true) {
    const callIndex = this.apiCalls.findIndex(call => call.id === requestId);
    if (callIndex !== -1) {
      this.apiCalls[callIndex].response = responseData;
      this.apiCalls[callIndex].status = success ? 'success' : 'error';
      this.apiCalls[callIndex].completedAt = new Date().toISOString();
    }
    this.updateDebugUI();
  }
  
  // Track error
  trackError(error, context = {}) {
    this.errors.push({
      error: error.message || String(error),
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
    this.updateDebugUI();
  }
  
  // Track assistant response
  trackAssistantMessage(message) {
    this.messages.push({
      type: 'assistant',
      content: message,
      timestamp: new Date().toISOString()
    });
    this.updateDebugUI();
    return message;
  }
  
  // Create debug UI element
  createDebugUI() {
    const container = document.createElement('div');
    container.id = 'message-tracker-debug';
    container.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: #f0f0f0; padding: 5px; border-radius: 5px; font-size: 12px; font-family: monospace; z-index: 9999; opacity: 0.8; display: none;';
    
    const toggleButton = document.createElement('button');
    toggleButton.innerText = '🐞 Debug';
    toggleButton.style.cssText = 'position: fixed; bottom: 10px; right: 10px; z-index: 10000; padding: 5px; border: none; background: #007bff; color: white; border-radius: 5px; cursor: pointer;';
    
    toggleButton.addEventListener('click', () => {
      container.style.display = container.style.display === 'none' ? 'block' : 'none';
    });
    
    const content = document.createElement('div');
    content.id = 'message-tracker-content';
    content.style.cssText = 'max-height: 300px; overflow-y: auto; padding: 10px;';
    
    container.appendChild(content);
    document.body.appendChild(container);
    document.body.appendChild(toggleButton);
    
    this.debugContainer = content;
    this.updateDebugUI();
  }
  
  // Update debug UI with current state
  updateDebugUI() {
    if (!this.debugContainer) return;
    
    const content = `
      <h3>Message Tracker</h3>
      <div>
        <strong>Messages:</strong> ${this.messages.length}
        <button onclick="window.messageTracker.downloadLogs()">Download Logs</button>
      </div>
      <div>
        <strong>API Calls:</strong> ${this.apiCalls.length}
        <ul>
          ${this.apiCalls.slice(-3).map(call => `
            <li>
              ${call.status === 'success' ? '✅' : call.status === 'error' ? '❌' : '⏳'}
              ${new Date(call.timestamp).toLocaleTimeString()}
              ${call.request ? call.request.substring(0, 30) + '...' : 'No data'}
            </li>
          `).join('')}
        </ul>
      </div>
      <div>
        <strong>Errors:</strong> ${this.errors.length}
        ${this.errors.length > 0 ? `<p>Last error: ${this.errors[this.errors.length - 1].error}</p>` : ''}
      </div>
    `;
    
    this.debugContainer.innerHTML = content;
    
    // Add to global scope for console access
    window.messageTracker = this;
  }
  
  // Download logs for debugging
  downloadLogs() {
    const logData = {
      messages: this.messages,
      apiCalls: this.apiCalls,
      errors: this.errors,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }
}

export default MessageTracker.getInstance();