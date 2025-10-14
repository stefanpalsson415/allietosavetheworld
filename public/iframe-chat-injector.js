/**
 * iframe-chat-injector.js - SIMPLIFIED VERSION
 * 
 * This script injects a chat panel that slides in from the right
 * Works on dashboard pages only
 */
(function() {
  console.log("Simple chat panel injector loaded");
  
  // Only run on dashboard pages
  const isDashboardPage = window.location.pathname === '/dashboard' || 
                         window.location.pathname.startsWith('/dashboard/');
  
  if (!isDashboardPage && !window.location.pathname.includes('/iframe-chat-test')) {
    console.log("Not on dashboard page, chat panel disabled");
    return;
  }
  
  // Create the chat panel
  const panel = document.createElement('div');
  panel.id = 'simple-chat-panel';
  panel.style.position = 'fixed';
  panel.style.top = '0';
  panel.style.right = '-350px'; // Start off-screen
  panel.style.width = '350px';
  panel.style.height = '100%';
  panel.style.backgroundColor = 'white';
  panel.style.boxShadow = '-2px 0 10px rgba(0, 0, 0, 0.1)';
  panel.style.transition = 'right 0.3s ease';
  panel.style.zIndex = '9999';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.borderLeft = '1px solid #e5e7eb';
  
  // Create header
  const header = document.createElement('div');
  header.style.height = '56px';
  header.style.padding = '0 16px';
  header.style.backgroundColor = '#F7F7F7';
  header.style.borderBottom = '1px solid #E5E7EB';
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  
  const title = document.createElement('h3');
  title.innerText = 'Chat with Allie';
  title.style.margin = '0';
  title.style.fontSize = '16px';
  title.style.fontWeight = '500';
  
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '×';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '24px';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.padding = '0 8px';
  closeBtn.onclick = closeChat;
  
  header.appendChild(title);
  header.appendChild(closeBtn);
  panel.appendChild(header);
  
  // Create chat content
  const content = document.createElement('div');
  content.style.flex = '1';
  content.style.padding = '16px';
  content.style.overflowY = 'auto';
  content.style.backgroundColor = '#F7F7F7';
  
  const message = document.createElement('div');
  message.style.backgroundColor = 'white';
  message.style.padding = '12px';
  message.style.borderRadius = '4px';
  message.style.marginBottom = '8px';
  message.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
  message.innerText = 'Hi there! How can I help you today?';
  
  content.appendChild(message);
  panel.appendChild(content);
  
  // Create input area
  const inputArea = document.createElement('div');
  inputArea.style.padding = '16px';
  inputArea.style.borderTop = '1px solid #e5e7eb';
  inputArea.style.display = 'flex';
  
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type a message...';
  input.style.flex = '1';
  input.style.padding = '8px 12px';
  input.style.border = '1px solid #d1d5db';
  input.style.borderRadius = '4px';
  input.style.marginRight = '8px';
  
  const sendBtn = document.createElement('button');
  sendBtn.innerText = 'Send';
  sendBtn.style.backgroundColor = '#0F62FE';
  sendBtn.style.color = 'white';
  sendBtn.style.border = 'none';
  sendBtn.style.borderRadius = '4px';
  sendBtn.style.padding = '8px 16px';
  sendBtn.style.cursor = 'pointer';
  
  inputArea.appendChild(input);
  inputArea.appendChild(sendBtn);
  panel.appendChild(inputArea);
  
  // Add to document
  document.body.appendChild(panel);
  
  // Create toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'chat-toggle-btn';
  toggleBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
  toggleBtn.style.position = 'fixed';
  toggleBtn.style.bottom = '24px';
  toggleBtn.style.right = '24px';
  toggleBtn.style.width = '56px';
  toggleBtn.style.height = '56px';
  toggleBtn.style.borderRadius = '50%';
  toggleBtn.style.backgroundColor = '#0F62FE';
  toggleBtn.style.color = 'white';
  toggleBtn.style.border = 'none';
  toggleBtn.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.zIndex = '9998';
  toggleBtn.style.display = 'flex';
  toggleBtn.style.alignItems = 'center';
  toggleBtn.style.justifyContent = 'center';
  toggleBtn.onclick = openChat;
  
  document.body.appendChild(toggleBtn);
  
  // Track state
  let isOpen = false;
  
  // Open and close functions
  function openChat() {
    panel.style.right = '0';
    toggleBtn.style.display = 'none';
    isOpen = true;
    
    // Add offset to content but don't throw it all the way to the left
    document.documentElement.style.setProperty('--content-right-margin', '350px');
    document.body.classList.add('chat-open');
  }
  
  function closeChat() {
    panel.style.right = '-350px';
    toggleBtn.style.display = 'flex';
    isOpen = false;
    
    // Remove offset from content
    document.documentElement.style.setProperty('--content-right-margin', '0');
    document.body.classList.remove('chat-open');
  }
  
  // Add global event listeners
  window.addEventListener('open-allie-chat', function() {
    console.log("Received open-allie-chat event");
    openChat();
  });
  
  // Document click for navigation buttons
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('chat-toggle-button') || 
        e.target.closest('[data-chat-toggle="true"]') ||
        e.target.hasAttribute('data-chat-toggle')) {
      console.log("Detected chat button click via global handler");
      openChat();
    }
  }, true);
  
  // Add small bit of CSS directly to document
  const style = document.createElement('style');
  style.textContent = `
    .chat-open .flex-1.flex.flex-col > .flex-1 {
      margin-right: var(--content-right-margin, 0) !important;
      transition: margin-right 0.3s ease !important;
    }
    
    .chat-open .h-14.border-b {
      width: calc(100% - var(--content-right-margin, 0)) !important;
      transition: width 0.3s ease !important;
    }
  `;
  document.head.appendChild(style);
  
  // Expose global methods
  window.openAllieChat = openChat;
  window.closeAllieChat = closeChat;
})();