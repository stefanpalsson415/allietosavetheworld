// replace-service.js
// This script will completely replace the EnhancedChatService.js file with a simplified version

const fs = require('fs');
const path = require('path');

// Path to the target file
const targetFile = path.join(__dirname, 'src', 'services', 'EnhancedChatService.js');
console.log(`Attempting to replace: ${targetFile}`);

// Create backup of existing file if we haven't already
const backupFile = targetFile + '.original';
if (!fs.existsSync(backupFile)) {
  try {
    const content = fs.readFileSync(targetFile, 'utf8');
    fs.writeFileSync(backupFile, content);
    console.log(`Original file backed up to: ${backupFile}`);
  } catch (error) {
    console.error('Failed to create backup:', error);
    process.exit(1);
  }
}

// Simplified implementation
const newImplementation = `// src/services/EnhancedChatService.js - SIMPLIFIED VERSION
import { db, auth } from './firebase';
import ClaudeService from './ClaudeService';

// Firestore imports
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc,
  doc, 
  limit, 
  serverTimestamp,
} from 'firebase/firestore';

class EnhancedChatService {
  constructor() {
    this.conversationContext = {};
    this.recentResponses = [];
    
    // Initialize authContext for Firebase operations
    this.authContext = {
      userId: null,
      familyId: null,
      timestamp: Date.now()
    };
    
    // Add a reference to current user from auth
    if (auth.currentUser) {
      this.currentUser = auth.currentUser;
      this.authContext.userId = auth.currentUser.uid;
      console.log("👤 EnhancedChatService initialized with user:", auth.currentUser.uid);
      
      // Try to get familyId from localStorage
      if (typeof window !== 'undefined') {
        const storedFamilyId = localStorage.getItem('selectedFamilyId') || localStorage.getItem('currentFamilyId');
        if (storedFamilyId) {
          this.authContext.familyId = storedFamilyId;
          console.log("👪 Initialized with familyId from localStorage:", storedFamilyId);
        }
      }
    }
    
    // Listen for auth state changes
    auth.onAuthStateChanged(user => {
      this.currentUser = user;
      if (user) {
        this.authContext.userId = user.uid;
        this.authContext.timestamp = Date.now();
      } else {
        this.authContext.userId = null;
      }
      console.log("👤 EnhancedChatService updated auth state:", user?.uid);
    });
  }
  
  /**
   * Set authentication context for Firebase operations
   * @param {object} authContext - Auth context with userId and familyId
   */
  setAuthContext(authContext) {
    if (!authContext) return;
    
    console.log("🔐 Setting auth context in EnhancedChatService:", {
      userId: authContext.userId,
      familyId: authContext.familyId,
      hasValues: !!authContext.userId || !!authContext.familyId
    });
    
    this.authContext = {
      ...this.authContext,
      ...authContext,
      lastUpdated: Date.now()
    };
    
    // Save the userId for direct Firebase operations
    if (authContext.userId) {
      console.log("🔐 Updated userId in EnhancedChatService:", authContext.userId);
    }
    
    if (authContext.familyId) {
      console.log("🔐 Updated familyId in EnhancedChatService:", authContext.familyId);
    }
  }
  
  /**
   * Get AI response for a user message using direct Claude API calls
   * @param {string} message - User message
   * @param {string} familyId - Family ID
   * @param {Array} context - Previous messages for context
   * @returns {Promise<string>} AI response
   */
  async getAIResponse(message, familyId, context = []) {
    console.log("🔄 EnhancedChatService.getAIResponse - DIRECT IMPLEMENTATION");
    console.log("🔍 Processing message:", message.substring(0, 100) + (message.length > 100 ? "..." : ""));
    
    try {
      // Make sure we have a familyId
      if (!familyId) {
        console.warn("⚠️ No familyId provided to getAIResponse - Using fallbacks");
        familyId = this.authContext?.familyId || 
                 (typeof window !== 'undefined' && localStorage.getItem('selectedFamilyId')) || 
                 (typeof window !== 'undefined' && localStorage.getItem('currentFamilyId'));
                 
        if (!familyId) {
          console.error("❌ Could not determine familyId from any source");
          return "I'm having trouble accessing your family information. Please try again or reload the page.";
        }
      }
      
      // Get family context for the system prompt
      const familyContext = await this.getFamilyContext(familyId);
      
      // Format messages for Claude API
      const messages = [];
      
      // Add conversation context as separate messages
      if (context && context.length > 0) {
        // Get the last 8 messages for context
        const recentContext = context.slice(-8);
        
        for (const msg of recentContext) {
          messages.push({
            role: msg.sender === 'allie' ? 'assistant' : 'user',
            content: msg.text
          });
        }
      }
      
      // Add current message
      messages.push({ role: 'user', content: message });
      
      console.log("📨 Sending request with messages:", messages.length);
      
      // Create system message with family context
      const systemPrompt = \`You are Allie, a helpful family assistant specialized in calendar management and family organization.

FAMILY CONTEXT:
Name: \${familyContext.familyName || 'Your family'}
Members: \${familyContext.familyMembers?.map(m => \`\${m.name} (\${m.role})\`).join(', ') || 'Your family members'}

CRITICAL INSTRUCTIONS:
1. For calendar events, always specify title, date, time, and any relevant details
2. When asked to book a dentist appointment or any appointment, provide precise details
3. For questions about family balance, provide insights based on task distribution
4. Be specific about child names when mentioned in requests
5. Never repeat yourself - provide unique responses
6. Be direct, concise, and helpful

YOUR TASK:
Provide a helpful, accurate response to the user's message.
\`;

      // Direct call to Claude API via ClaudeService
      const options = { temperature: 0.7 };
      const response = await ClaudeService.generateResponse(
        messages,
        { system: systemPrompt },
        options
      );
      
      console.log("✅ Received response from Claude API");
      return response;
      
    } catch (error) {
      console.error("❌ Error in direct ClaudeAPI call:", error);
      
      // Try one more direct call with minimal context as final fallback
      try {
        console.log("🔄 Attempting minimal direct Claude API call...");
        
        const fallbackResponse = await ClaudeService.generateResponse(
          [{ role: 'user', content: message }],
          { 
            system: "You are Allie, a helpful family assistant. Answer the user's question directly."
          },
          { temperature: 0.8 }
        );
        
        if (fallbackResponse) {
          console.log("✅ Fallback direct call succeeded");
          return fallbackResponse;
        }
      } catch (fallbackError) {
        console.error("❌ Fallback call also failed:", fallbackError);
      }
      
      return "I'm sorry, I encountered an error processing your request. Please try again. (Error: " + error.message + ")";
    }
  }
  
  /**
   * Get family context for better personalization
   * @param {string} familyId - Family ID 
   * @returns {Promise<Object>} Family context data
   */
  async getFamilyContext(familyId) {
    try {
      if (!familyId) {
        console.error("No familyId provided to getFamilyContext");
        return {
          familyId: null,
          familyName: "Your family",
          adults: 2,
          children: [],
          familyMembers: [],
          currentWeek: 1
        };
      }
      
      console.log("Getting family context for:", familyId);
      
      // Get family document
      const familyDoc = await getDoc(doc(db, "families", familyId));
      if (!familyDoc.exists()) {
        console.error("Family document not found:", familyId);
        return {
          familyId,
          familyName: "Your family",
          adults: 2,
          children: [],
          familyMembers: [],
          currentWeek: 1
        };
      }
      
      const familyData = familyDoc.data();
      
      // Get family members
      const membersQuery = query(
        collection(db, "users"),
        where("familyId", "==", familyId)
      );
      
      const membersSnapshot = await getDocs(membersQuery);
      const familyMembers = membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: doc.data().role || 'member'
      }));
      
      // Count adults and children
      const adults = familyMembers.filter(m => m.role === 'parent' || m.role === 'adult').length;
      const children = familyMembers.filter(m => m.role === 'child');
      
      // Simple data for now
      return {
        familyId,
        familyName: familyData.name || "Your family",
        adults,
        children,
        familyMembers,
        currentWeek: familyData.currentWeek || 1
      };
    } catch (error) {
      console.error("Error in getFamilyContext:", error);
      return {
        familyId,
        familyName: "Your family",
        adults: 2,
        children: [],
        familyMembers: [],
        currentWeek: 1
      };
    }
  }
}

export default new EnhancedChatService();`;

// Write the new implementation
try {
  fs.writeFileSync(targetFile, newImplementation);
  console.log('✅ Service successfully replaced with simplified implementation!');
  
  console.log(`
=== NEXT STEPS ===
1. Restart your proxy server: ./start-proxy.sh
2. Restart your React app: npm start
3. Test with the chat interface again

The new implementation completely bypasses complex intent detection and directly calls
the Claude API with proper formatting and context. This should fix the issues with
repeated responses, bad parsing, and fallback messages.
  `);
} catch (error) {
  console.error('❌ Error replacing file:', error);
}