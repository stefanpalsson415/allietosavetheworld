// override-claude-service.js
// Creates a direct override for the Claude service generateResponse method

const fs = require('fs');
const path = require('path');

// Path to target file
const targetFile = path.join(__dirname, 'src', 'services', 'ClaudeService.js');
console.log(`Attempting to patch: ${targetFile}`);

try {
  // Read file content
  const content = fs.readFileSync(targetFile, 'utf8');
  
  // Create backup if needed
  const backupFile = `${targetFile}.bak`;
  if (!fs.existsSync(backupFile)) {
    fs.writeFileSync(backupFile, content);
    console.log(`Created backup at: ${backupFile}`);
  }
  
  // Find the generateResponse method
  const methodPattern = /async\s+generateResponse\s*\(/;
  const methodMatch = content.match(methodPattern);
  
  if (!methodMatch) {
    throw new Error('Could not find generateResponse method in ClaudeService.js');
  }
  
  const methodStart = methodMatch.index;
  
  // Find the end of the method (next method or end of class)
  let methodEnd = content.indexOf('async', methodStart + 20);
  if (methodEnd === -1) {
    // If not found, look for end of class
    methodEnd = content.lastIndexOf('}');
  }
  
  if (methodEnd === -1) {
    throw new Error('Could not find end of generateResponse method');
  }
  
  // Find the last closing brace before the next method
  const lastBrace = content.lastIndexOf('}', methodEnd);
  if (lastBrace === -1) {
    throw new Error('Could not find closing brace for generateResponse method');
  }
  
  // Extract the method name and signature
  const methodSignatureEnd = content.indexOf('{', methodStart);
  const methodSignature = content.substring(methodStart, methodSignatureEnd + 1);
  
  // Create new implementation
  const newImplementation = `${methodSignature}
    // PATCHED IMPLEMENTATION - simplified direct API call
    console.log("🔄 PATCHED generateResponse being called");
    
    try {
      // Ensure messages are in the correct format for Claude API
      if (!Array.isArray(messages)) {
        console.warn("⚠️ Messages not in array format, converting...");
        messages = [{ role: 'user', content: messages }];
      }
      
      // Log the first message for debugging
      if (messages.length > 0) {
        const firstMsg = messages[0];
        console.log(\`First message - role: \${firstMsg.role}, content: \${typeof firstMsg.content === 'string' ? firstMsg.content.substring(0, 50) + '...' : '[complex content]'}\`);
      }
      
      // Check for mock or disabled mode
      if (this.mockMode || this.disableAICalls) {
        console.log("Using mock mode - returning placeholder");
        return "This is a mock response from Claude. The API is currently in mock mode or disabled.";
      }
      
      // Prepare request body
      const requestBody = {
        model: this.model,
        max_tokens: options?.max_tokens || 1000,
        temperature: options?.temperature || 0.7,
        messages: messages
      };
      
      // Add system message if provided
      if (context && context.system) {
        requestBody.system = context.system;
      }
      
      // Diagnose issue in the console
      console.log("🔍 Claude model:", this.model);
      console.log("🔍 Request to proxy URL:", this.proxyUrl);
      
      // Make the request to our proxy server
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      // Check for error response
      if (!response.ok) {
        const errorText = await response.text();
        console.error(\`❌ API request failed with status \${response.status}:\`, errorText);
        throw new Error(\`API request failed with status \${response.status}: \${errorText}\`);
      }
      
      // Parse the response
      const result = await response.json();
      
      // Extract text from Claude's response
      if (result && result.content && result.content.length > 0) {
        console.log("✅ Successfully received Claude API response");
        return result.content[0].text;
      }
      
      // Fallback if no content found
      console.warn("⚠️ No content found in API response:", result);
      return "I received an empty response. Please try again with your question.";
    } catch (error) {
      console.error("❌ Error in generateResponse:", error);
      throw error;
    }
  }`;
  
  // Replace the method in the file
  const newContent = content.substring(0, methodStart) + newImplementation + content.substring(lastBrace + 1);
  
  // Write the modified file
  fs.writeFileSync(targetFile, newContent);
  console.log("✅ Successfully patched ClaudeService.generateResponse method");
  
  console.log(`
=== NEXT STEPS ===
1. Restart your proxy server: ./start-proxy.sh
2. Restart your React app: npm start
3. Test with the chat interface again

The patched ClaudeService.generateResponse method now makes direct API requests
in a simplified way that should bypass any formatting issues. This should solve
the problems with Claude API integration.
  `);
  
} catch (error) {
  console.error('❌ Error patching ClaudeService:', error);
}