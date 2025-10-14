import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send, Sparkles, ChevronRight, Brain, Heart, Shield, Clock, DollarSign, Users, Baby, Calendar, FileText, BarChart3, Lightbulb, ArrowRight, CheckCircle } from 'lucide-react';
import SalesClaudeService from '../../services/SalesClaudeService';
import '../../styles/sales-allie-chat.css';

// Allie character component
const AllieCharacter = ({ mood = 'happy', size = 'md', animate = false }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const moodColors = {
    curious: 'from-purple-400 to-indigo-600',
    happy: 'from-pink-400 to-rose-600',
    helpful: 'from-blue-400 to-cyan-600',
    celebrating: 'from-amber-400 to-yellow-600'
  };

  return (
    <div className={`relative ${animate ? 'animate-bounce' : ''}`}>
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${moodColors[mood]} shadow-lg flex items-center justify-center`}>
        <Brain className="text-white" size={size === 'lg' ? 32 : size === 'md' ? 24 : 16} />
      </div>
      {mood === 'celebrating' && (
        <Sparkles className="absolute -top-1 -right-1 text-yellow-400 animate-pulse" size={12} />
      )}
    </div>
  );
};

// Sales-focused Allie Chat Component
const SalesAllieChat = () => {
  // Check if mobile before initializing state
  const checkIfMobile = () => window.innerWidth <= 768;

  // Check if user explicitly closed it before
  const wasClosedByUser = localStorage.getItem('sales-allie-chat-closed') === 'true';

  // ALWAYS start closed
  const [isOpen, setIsOpen] = useState(() => {
    console.log('SalesAllieChat: Initializing as CLOSED');
    return false; // Always start closed, no exceptions
  });
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [hasAskedForPainPoints, setHasAskedForPainPoints] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true);
  const [conversationStage, setConversationStage] = useState('initial'); // initial, interested, ready
  const [hasShownCTA, setHasShownCTA] = useState(false);
  const [isMobile, setIsMobile] = useState(checkIfMobile());
  
  const messagesEndRef = useRef(null);
  const claudeService = useRef(SalesClaudeService); // Use the sales-specific service
  const chatRef = useRef(null);
  const navigate = useNavigate();

  // Detect window resize
  useEffect(() => {
    const checkResize = () => {
      const nowMobile = window.innerWidth <= 768;
      setIsMobile(nowMobile);

      // If resized to mobile, ensure it's closed
      if (nowMobile && isOpen) {
        console.log('SalesAllieChat: Window resized to mobile, closing chat');
        setIsOpen(false);
        localStorage.setItem('sales-allie-chat-closed', 'true');
        document.body.classList.remove('sales-allie-chat-open');
      }
    };

    checkResize(); // Check on mount
    window.addEventListener('resize', checkResize);
    return () => window.removeEventListener('resize', checkResize);
  }, [isOpen]);

  // Suggested questions
  const suggestedQuestions = [
    { icon: <DollarSign size={16} />, text: "What's included in the $19/month?" },
    { icon: <Brain size={16} />, text: "How does Allie measure mental load?" },
    { icon: <Users size={16} />, text: "How is this different from other family apps?" },
    { icon: <BarChart3 size={16} />, text: "Show me the science behind task weights" },
  ];

  // Initialize conversation on mount
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        role: 'assistant',
        content: "Hi! I'm Allie 👋 I help families balance their mental load using AI. What would you like to know about how I can help your family?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
      setConversationId(`sales-${Date.now()}`);
    }
  }, [isOpen]);


  // Handle body class for page slide effect
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('sales-allie-chat-open');
    } else {
      document.body.classList.remove('sales-allie-chat-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('sales-allie-chat-open');
    };
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save conversation to localStorage
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      localStorage.setItem(`allie-sales-chat-${conversationId}`, JSON.stringify({
        messages,
        userInfo,
        timestamp: new Date()
      }));
    }
  }, [messages, conversationId, userInfo]);

  // Track analytics
  const trackEvent = (eventName, properties = {}) => {
    if (window.gtag) {
      window.gtag('event', eventName, {
        event_category: 'Sales Chat',
        ...properties
      });
    }
    console.log('Sales Chat Event:', eventName, properties);
  };

  const handleSendMessage = async (messageText = input) => {
    if (!messageText.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setShowSuggestedQuestions(false);

    trackEvent('message_sent', { message_type: 'user', content_preview: messageText.substring(0, 50) });

    try {
      // Generate AI response
      const systemPrompt = `You are Allie, an AI assistant helping families balance their mental load. You're speaking to a potential customer on the landing page.

IMPORTANT CONTEXT:
- Allie costs $19/month per family (unlimited family members)
- 30-day money-back guarantee, cancel anytime
- Currently in beta with early access families
- Setup takes about 10 minutes

KEY FEATURES:
1. Mental Load Measurement: Uses ELO-based task weight system to quantify invisible work
2. AI Parsing: Claude 4 parses emails, texts, photos, documents to extract actionable items
3. Habit Formation: Personalized habits that target heaviest imbalances
4. Family Knowledge Graph: Everything connects - Neo4j powers intelligent insights
5. Kids Engagement: Chore system with Family Bucks rewards
6. Calendar Intelligence: Auto-creates events from any communication

DIFFERENTIATORS:
- Only app that quantifies invisible mental labor
- Addresses root cause (awareness) before solutions
- AI understands context, not just task lists
- Whole family participates (including kids)
- Based on research about mental load and family dynamics

YOUR ROLE:
- Be warm, empathetic, and understanding of parental struggles
- Use specific examples from the Palsson family story when relevant
- Ask probing questions about their pain points
- Quantify benefits (hours saved, stress reduced)
- Address objections honestly
- Keep responses concise but informative

CONVERSION STRATEGY:
- After answering 2-3 questions, mention the free trial naturally
- If they express strong interest or frustration with current situation, suggest trying Allie
- Use phrases like: "Would you like to see how Allie works for your family?" or "Ready to take 10 minutes to set up your family's command center?"
- Always end responses that mention the trial with: [CTA_BUTTON]
- When they seem ready to convert, use: [START_TRIAL_BUTTON]

If asked about technical details, you can reference:
- Claude 4 (Opus) powers the AI
- Neo4j graph database for knowledge
- Firebase for real-time sync
- Bank-level encryption for data

Current conversation context: ${JSON.stringify(userInfo)}
Has asked about pain points: ${hasAskedForPainPoints}`;

      const response = await claudeService.current.generateResponse(
        [...messages, userMessage].map(m => ({
          role: m.role,
          content: m.content
        })),
        { system: systemPrompt },
        { max_tokens: 500, temperature: 0.7 }
      );

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Check if we should ask about pain points
      if (!hasAskedForPainPoints && messages.length > 4) {
        setHasAskedForPainPoints(true);
        setTimeout(() => {
          const followUpMessage = {
            id: Date.now() + 2,
            role: 'assistant',
            content: "By the way, I'm curious - what's the biggest challenge you're facing with managing your family's schedule and tasks right now?",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, followUpMessage]);
        }, 2000);
      }

      // Check if we should show conversion CTA
      if (!hasShownCTA && messages.length > 6 && response.toLowerCase().includes('trial')) {
        setHasShownCTA(true);
        setConversationStage('ready');
      }

      trackEvent('message_received', { message_type: 'ai', response_length: response.length });

    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedQuestion = (question) => {
    trackEvent('suggested_question_clicked', { question: question.text });
    handleSendMessage(question.text);
  };

  // Don't render anything on mobile
  if (isMobile) {
    console.log('SalesAllieChat: Mobile device, not rendering chat UI');
    return null;
  }

  return (
    <>
      {/* Chat Panel */}
      <div
        ref={chatRef}
        className={`sales-allie-chat fixed top-0 right-0 h-full z-50 bg-white border-l border-gray-200 shadow-xl transition-all duration-300 ease-in-out ${
          isOpen
            ? (isMobile ? 'w-full translate-x-0' : 'w-[360px] translate-x-0')
            : (isMobile ? 'w-full translate-x-full' : 'w-[360px] translate-x-full')
        }`}
      >
        {/* Header */}
        <div className="h-16 bg-gradient-to-r from-purple-600 to-pink-600 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AllieCharacter mood="helpful" size="md" />
            <div>
              <h3 className="font-bold text-white">Chat with Allie</h3>
              <p className="text-xs text-purple-100">Your AI Family Assistant</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Close button clicked - forcing close'); // Debug log
              setIsOpen(false);
              localStorage.setItem('sales-allie-chat-closed', 'true');
              // Also remove the body class immediately
              document.body.classList.remove('sales-allie-chat-open');
              trackEvent('chat_closed');
            }}
            className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
            aria-label="Close chat"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Messages Container */}
        <div className="h-[calc(100%-64px-80px)] overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {message.content.split('[CTA_BUTTON]')[0].split('[START_TRIAL_BUTTON]')[0]}
                </p>
                {message.content.includes('[CTA_BUTTON]') && (
                  <button
                    onClick={() => {
                      trackEvent('cta_clicked', { type: 'learn_more' });
                      handleSendMessage("I'd like to learn more about the free trial");
                    }}
                    className="mt-2 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Sparkles size={16} />
                    Learn More About Free Trial
                  </button>
                )}
                {message.content.includes('[START_TRIAL_BUTTON]') && (
                  <button
                    onClick={() => {
                      trackEvent('start_trial_clicked');
                      navigate('/onboarding');
                    }}
                    className="mt-2 w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 animate-pulse"
                  >
                    <CheckCircle size={16} />
                    Start Your Free Trial Now
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Questions */}
          {showSuggestedQuestions && messages.length <= 2 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs text-gray-500 font-medium">Popular questions:</p>
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors flex items-center space-x-2 group"
                >
                  <span className="text-purple-600 group-hover:text-purple-700">{question.icon}</span>
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">{question.text}</span>
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Section with Input and CTA */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          {/* Ready to Start CTA */}
          {messages.length > 4 && (
            <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
              <button
                onClick={() => {
                  trackEvent('chat_cta_clicked', { messages_count: messages.length });
                  window.location.href = '/onboarding';
                }}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all flex items-center justify-center space-x-2 group"
              >
                <span>Ready to balance your family?</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
          
          {/* Input Area */}
          <div className="p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask me anything about Allie..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={loading || !input.trim()}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating "Talk to Allie" Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => {
              setIsOpen(true);
              localStorage.removeItem('sales-allie-chat-closed');
              trackEvent('chat_opened', { trigger: 'floating_button' });
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center space-x-3 group"
          >
            <AllieCharacter mood="happy" size="sm" />
            <span className="font-medium">Talk to Allie</span>
            <Sparkles size={16} className="group-hover:animate-pulse" />
          </button>
        </div>
      )}
    </>
  );
};

export default SalesAllieChat;