/**
 * chat-iframe-bridge.js
 * 
 * This script provides a bridge between the iframe chat panel and the 
 * main application's chat service
 * ONLY activates on dashboard pages to prevent interference with other pages
 */
(function() {
  console.log("Chat iframe bridge loaded");
  
  // Check if we're on a dashboard page - ONLY activate on dashboard
  const isDashboardPage = window.location.pathname === '/dashboard' || 
                         window.location.pathname.startsWith('/dashboard/') ||
                         window.location.pathname === '/test/notion-chat' ||
                         window.location.pathname === '/test/chat-panel' ||
                         // Special case: always run in iframe regardless of path
                         (window !== window.parent);
  
  // If not on dashboard, exit early
  if (!isDashboardPage) {
    console.log("Not on dashboard page, chat bridge disabled");
    return;
  }
  
  console.log("Chat bridge activated for dashboard or iframe");
  
  // Check if we're in the iframe context
  const isInIframe = window !== window.parent;
  
  if (!isInIframe) {
    console.log("Bridge script running in parent context");
    
    // In the parent, listen for messages from the iframe
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'chat-message') {
        console.log("Received chat message from iframe:", event.data.message);
        // Pass to the main app's chat service if available
        if (window.EnhancedChatService && window.EnhancedChatService.sendMessage) {
          window.EnhancedChatService.sendMessage(event.data.message, {})
            .then(response => {
              console.log("Got response from chat service:", response);
              // Send response back to iframe
              const iframe = document.getElementById('allie-chat-iframe');
              if (iframe) {
                iframe.contentWindow.postMessage({
                  type: 'chat-response',
                  response: response
                }, '*');
              }
            })
            .catch(error => {
              console.error("Error from chat service:", error);
              // Send error back to iframe
              const iframe = document.getElementById('allie-chat-iframe');
              if (iframe) {
                iframe.contentWindow.postMessage({
                  type: 'chat-error',
                  error: "I'm sorry, I encountered an error. Please try again."
                }, '*');
              }
            });
        } else {
          console.log("EnhancedChatService not found in parent window");
          // Send a mock response back
          const iframe = document.getElementById('allie-chat-iframe');
          if (iframe) {
            iframe.contentWindow.postMessage({
              type: 'chat-response',
              response: `I received your message: "${event.data.message}". However, the chat service is not available right now.`
            }, '*');
          }
        }
      }
    });
    
    // Expose EnhancedChatService globally for easier access from iframe bridge
    window.addEventListener('load', function() {
      if (window.EnhancedChatService) {
        console.log("EnhancedChatService is available");
      } else {
        // Try to find it in the window object
        try {
          const services = require('./services/EnhancedChatService');
          if (services && services.default) {
            window.EnhancedChatService = services.default;
            console.log("Manually attached EnhancedChatService to window");
          }
        } catch (e) {
          console.log("Could not load EnhancedChatService:", e);
        }
      }
    });
  } else {
    console.log("Bridge script running in iframe context");
    
    // In the iframe, provide a function to send messages to the parent
    window.sendMessageToParent = function(message) {
      console.log("Sending message to parent:", message);
      window.parent.postMessage({
        type: 'chat-message',
        message: message
      }, '*');
    };
    
    // Listen for responses from the parent
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'chat-response') {
        console.log("Received response from parent:", event.data.response);
        
        // Add the response to the chat UI
        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
          const botMessageHtml = `
            <div class="message">
              <div class="avatar">A</div>
              <div class="message-content">
                <div style="font-size: 14px;">${event.data.response}</div>
              </div>
            </div>
          `;
          
          messagesContainer.innerHTML += botMessageHtml;
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      } else if (event.data && event.data.type === 'chat-error') {
        console.log("Received error from parent:", event.data.error);
        
        // Add the error to the chat UI
        const messagesContainer = document.querySelector('.messages-container');
        if (messagesContainer) {
          const errorMessageHtml = `
            <div class="message">
              <div class="avatar">A</div>
              <div class="message-content">
                <div style="font-size: 14px; color: #EF4444;">${event.data.error}</div>
              </div>
            </div>
          `;
          
          messagesContainer.innerHTML += errorMessageHtml;
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }
    });
    
    // Enhance the existing sendMessage function if we're in the iframe
    const originalSendMessage = window.sendMessage;
    if (originalSendMessage) {
      window.sendMessage = function() {
        // Call the original function first
        originalSendMessage();
        
        // Get the message text
        const inputElement = document.getElementById('messageInput');
        if (inputElement && inputElement.value.trim()) {
          // Send it to the parent
          window.sendMessageToParent(inputElement.value.trim());
        }
      };
      
      console.log("Enhanced sendMessage function in iframe");
    }
  }
})();