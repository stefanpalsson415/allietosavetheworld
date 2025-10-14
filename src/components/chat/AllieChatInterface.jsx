import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, Heart, ThumbsUp, ThumbsDown, Shirt, Gift,
  Camera, Mic, Send, Plus, X, Star, TrendingUp, Award,
  ShoppingCart, Package, Zap, Users, Brain, Target
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import ClaudeService from '../../services/ClaudeService';
import ChildInterestService from '../../services/ChildInterestService';
import QuantumKnowledgeGraph from '../../services/QuantumKnowledgeGraph';
import { motion, AnimatePresence } from 'framer-motion';

const AllieChatInterface = ({
  mode = 'gift_discovery',
  childId,
  onComplete,
  onClose
}) => {
  const { familyMembers, familyId } = useFamily();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [currentContext, setCurrentContext] = useState({});
  const [streamingMessage, setStreamingMessage] = useState('');
  const [points, setPoints] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const messageEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const child = familyMembers?.find(m => m.id === childId);

  // Conversation modes with different personalities
  const conversationModes = {
    gift_discovery: {
      greeting: `Hey ${child?.name}! 🎁 I'm super excited to learn about all the awesome things you love! Want to play a fun game where you tell me about your favorite stuff?`,
      personality: 'enthusiastic',
      quickActions: [
        { icon: '🎮', text: 'Games & Toys', action: 'explore_games' },
        { icon: '📚', text: 'Books & Stories', action: 'explore_books' },
        { icon: '🎨', text: 'Arts & Crafts', action: 'explore_arts' },
        { icon: '⚽', text: 'Sports & Outside', action: 'explore_sports' }
      ],
      rewards: { per_interaction: 10, bonus_detailed: 20 }
    },
    wardrobe_planning: {
      greeting: `Hi ${child?.name}! 👕 Let's make getting dressed super fun! I can help you pick awesome outfits or organize your closet like a fashion pro!`,
      personality: 'playful',
      quickActions: [
        { icon: '☀️', text: "Today's Outfit", action: 'pick_outfit' },
        { icon: '📸', text: 'Show My Clothes', action: 'photo_clothes' },
        { icon: '🎨', text: 'Mix & Match', action: 'mix_match' },
        { icon: '♻️', text: 'Too Small Box', action: 'outgrown' }
      ],
      rewards: { per_interaction: 15, outfit_creation: 25 }
    },
    outfit_selection: {
      greeting: `Good morning ${child?.name}! 🌟 Ready to look amazing today? Let me help you pick the perfect outfit!`,
      personality: 'energetic',
      weatherAware: true,
      quickActions: [
        { icon: '🌈', text: 'Colorful Day', action: 'colorful_outfit' },
        { icon: '😎', text: 'Super Cool', action: 'cool_outfit' },
        { icon: '🏃', text: 'Ready to Play', action: 'active_outfit' },
        { icon: '✨', text: 'Special Day', action: 'special_outfit' }
      ],
      rewards: { daily_selection: 20, creative_combo: 30 }
    }
  };

  // Initialize conversation
  useEffect(() => {
    if (child && mode) {
      const modeConfig = conversationModes[mode];
      setMessages([{
        id: 'greeting',
        sender: 'allie',
        text: modeConfig.greeting,
        timestamp: new Date(),
        animated: true
      }]);

      // Load child context from Quantum Knowledge Graph
      loadChildContext();
    }
  }, [child, mode]);

  // Load child's context and preferences
  const loadChildContext = async () => {
    try {
      const context = await QuantumKnowledgeGraph.getChildContext(childId);
      const interests = await ChildInterestService.getChildInterests(familyId, childId);

      setCurrentContext({
        ...context,
        interests,
        recentInteractions: context.recentInteractions || [],
        preferences: context.preferences || {}
      });
    } catch (error) {
      console.error('Error loading child context:', error);
    }
  };

  // Handle voice input
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Try Chrome!');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText(transcript);
      setIsListening(false);
      handleSendMessage(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Handle quick action buttons
  const handleQuickAction = async (action) => {
    const actionMessages = {
      explore_games: "I love playing games! Tell me about your favorites!",
      explore_books: "Books are amazing! What stories do you like?",
      explore_arts: "Art is so cool! Do you like drawing or making things?",
      explore_sports: "Sports are fun! What do you like to play?",
      pick_outfit: "Let's pick a great outfit for today!",
      photo_clothes: "Show me your clothes and I'll help organize them!",
      mix_match: "Let's create some awesome outfit combinations!",
      outgrown: "Let's find clothes that don't fit anymore to donate!",
      colorful_outfit: "I want to wear lots of colors today!",
      cool_outfit: "Make me look super cool!",
      active_outfit: "I need clothes for playing and running!",
      special_outfit: "Today is special, I need to look my best!"
    };

    const userMessage = actionMessages[action] || "Let's do this!";
    handleSendMessage(userMessage);

    // Award points for engagement
    awardPoints('quick_action', 5);
  };

  // Send message to Allie
  const handleSendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsThinking(true);
    setShowQuickActions(false);

    try {
      // Build conversation context
      const conversationContext = {
        mode,
        childName: child.name,
        childAge: child.age || 7,
        currentContext,
        recentMessages: messages.slice(-5),
        timestamp: new Date().toISOString()
      };

      // Generate Allie's response
      const prompt = buildPrompt(text, conversationContext);
      const response = await ClaudeService.sendMessage(prompt, null, familyId);

      // Process and extract insights
      const processedResponse = await processResponse(response, text);

      // Add Allie's response with streaming animation
      const allieMessage = {
        id: Date.now() + 1,
        sender: 'allie',
        text: processedResponse.message,
        timestamp: new Date(),
        insights: processedResponse.insights,
        suggestions: processedResponse.suggestions,
        animated: true
      };

      setMessages(prev => [...prev, allieMessage]);

      // Award points based on interaction quality
      if (processedResponse.insights.length > 0) {
        awardPoints('detailed_response', 20);
      } else {
        awardPoints('interaction', 10);
      }

      // Update Quantum Knowledge Graph
      await updateKnowledgeGraph(text, processedResponse);

    } catch (error) {
      console.error('Error getting Allie response:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'allie',
        text: "Oops! My brain got a bit fuzzy. Can you tell me that again?",
        timestamp: new Date(),
        error: true
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  // Build AI prompt based on mode and context
  const buildPrompt = (userInput, context) => {
    const basePrompt = `You are Allie, a fun and friendly AI companion talking to ${context.childName}, age ${context.childAge}.
    Current mode: ${mode}

    Previous context: ${JSON.stringify(context.currentContext.preferences || {})}
    Recent interactions: ${context.recentMessages.map(m => `${m.sender}: ${m.text}`).join('\n')}

    User said: "${userInput}"

    Respond in a fun, age-appropriate way. Be enthusiastic and encouraging!
    Extract any preferences or interests mentioned.
    If discussing items (toys, clothes, etc.), note specific brands or types.
    Keep response under 3 sentences for young children.

    Return JSON:
    {
      "message": "Your fun response here",
      "insights": ["interest or preference detected"],
      "suggestions": ["optional follow-up questions or activities"],
      "entities": {
        "interests": [],
        "brands": [],
        "activities": [],
        "preferences": {}
      }
    }`;

    return basePrompt;
  };

  // Process AI response and extract actionable data
  const processResponse = async (response, userInput) => {
    try {
      const parsed = JSON.parse(response.text);

      // Store insights in database
      if (parsed.entities?.interests?.length > 0) {
        for (const interest of parsed.entities.interests) {
          await ChildInterestService.addInterest(familyId, childId, {
            name: interest,
            category: mode === 'gift_discovery' ? 'toy' : 'clothing',
            source: 'conversation',
            confidence: 0.8
          });
        }
      }

      return {
        message: parsed.message,
        insights: parsed.insights || [],
        suggestions: parsed.suggestions || []
      };
    } catch (error) {
      // Fallback for non-JSON responses
      return {
        message: response.text,
        insights: [],
        suggestions: []
      };
    }
  };

  // Update Quantum Knowledge Graph with interaction data
  const updateKnowledgeGraph = async (userInput, response) => {
    try {
      await QuantumKnowledgeGraph.update({
        child: childId,
        node: `interactions.${mode}`,
        value: {
          input: userInput,
          response: response.message,
          insights: response.insights,
          timestamp: Date.now()
        },
        confidence: 0.9,
        source: 'allie_chat'
      });
    } catch (error) {
      console.error('Error updating knowledge graph:', error);
    }
  };

  // Award points and check achievements
  const awardPoints = (action, amount) => {
    setPoints(prev => prev + amount);

    // Check for achievements
    checkAchievements(action, points + amount);
  };

  // Check and award achievements
  const checkAchievements = (action, totalPoints) => {
    const newAchievements = [];

    if (totalPoints >= 100 && !achievements.includes('first_100')) {
      newAchievements.push({
        id: 'first_100',
        title: 'Super Chatter!',
        description: 'Earned 100 points talking with Allie!',
        icon: '🌟'
      });
    }

    if (totalPoints >= 500 && !achievements.includes('expert_500')) {
      newAchievements.push({
        id: 'expert_500',
        title: 'Allie Expert!',
        description: '500 points! You\'re amazing!',
        icon: '🏆'
      });
    }

    if (newAchievements.length > 0) {
      setAchievements(prev => [...prev, ...newAchievements.map(a => a.id)]);
      // Show achievement notification
      newAchievements.forEach(achievement => {
        setTimeout(() => {
          alert(`🎉 Achievement Unlocked: ${achievement.title}!`);
        }, 500);
      });
    }
  };

  // Scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">
              {mode === 'gift_discovery' && "Allie's Wish Workshop"}
              {mode === 'wardrobe_planning' && "Allie's Style Studio"}
              {mode === 'outfit_selection' && "Outfit Picker"}
            </h3>
            <p className="text-sm text-gray-600">Chatting with {child?.name}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Points Display */}
          <div className="flex items-center space-x-1 bg-yellow-100 px-3 py-1 rounded-full">
            <Star className="text-yellow-600" size={16} />
            <span className="text-sm font-bold text-yellow-800">{points}</span>
          </div>

          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.sender === 'user'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white shadow-md'
              }`}>
                {message.sender === 'allie' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="text-purple-500" size={16} />
                    <span className="text-sm font-semibold text-purple-600">Allie</span>
                  </div>
                )}

                <p className={`text-sm ${message.sender === 'user' ? 'text-white' : 'text-gray-800'}`}>
                  {message.text}
                </p>

                {/* Show insights if available */}
                {message.insights && message.insights.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">Learned:</p>
                    {message.insights.map((insight, idx) => (
                      <span key={idx} className="inline-block text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full mr-1 mt-1">
                        {insight}
                      </span>
                    ))}
                  </div>
                )}

                {/* Show suggestions */}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {message.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(suggestion)}
                        className="block w-full text-left text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 px-3 py-2 rounded-lg transition"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white shadow-md px-4 py-3 rounded-2xl">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messageEndRef} />
      </div>

      {/* Quick Actions */}
      {showQuickActions && conversationModes[mode]?.quickActions && (
        <div className="px-6 py-3 bg-white border-t">
          <p className="text-xs text-gray-500 mb-2">Quick choices:</p>
          <div className="flex flex-wrap gap-2">
            {conversationModes[mode].quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.action)}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 px-3 py-2 rounded-full transition"
              >
                <span className="text-lg">{action.icon}</span>
                <span className="text-sm font-medium text-gray-700">{action.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white border-t px-6 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => alert('Photo feature coming soon!')}
            className="p-2 text-gray-500 hover:text-purple-600 transition"
          >
            <Camera size={20} />
          </button>

          <button
            onClick={startListening}
            className={`p-2 transition ${
              isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-purple-600'
            }`}
          >
            <Mic size={20} />
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Tell Allie something fun about you...`}
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim() || isThinking}
            className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AllieChatInterface;