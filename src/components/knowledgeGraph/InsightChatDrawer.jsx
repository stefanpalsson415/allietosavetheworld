/**
 * InsightChatDrawer.jsx
 *
 * Chat interface for exploring knowledge graph insights.
 * Similar design to InterviewChat but focused on insights and analysis.
 *
 * Features:
 * - Suggested insights/questions
 * - Natural language queries
 * - Context from selected nodes
 * - Voice + text input
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import claudeService from '../../services/ClaudeService';

const InsightChatDrawer = ({ selectedNode, insights, suggestedQuestions, onClose, familyId }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate welcome message
  useEffect(() => {
    const welcomeMessage = generateWelcomeMessage();
    setMessages([{
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }]);
  }, []);

  // Update context when node is selected
  useEffect(() => {
    if (selectedNode) {
      const nodeContext = generateNodeContextMessage(selectedNode);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: nodeContext,
        timestamp: new Date()
      }]);
    }
  }, [selectedNode]);

  function generateWelcomeMessage() {
    let message = `# 🧠 Welcome to Your Family Knowledge Graph\n\n`;
    message += `I can help you understand the patterns, insights, and connections in your family's data.\n\n`;

    // Add insights summary
    if (insights?.summary) {
      message += `## 📊 Quick Summary\n${insights.summary}\n\n`;
    }

    message += `**Try asking:**\n`;
    message += `- "Show me invisible labor patterns"\n`;
    message += `- "Who is our coordination bottleneck?"\n`;
    message += `- "What hidden talents do my kids have?"\n`;
    message += `- "When do we create most tasks?"\n\n`;
    message += `Or click a suggested insight below! 👇`;

    return message;
  }

  function generateNodeContextMessage(node) {
    let message = `# ${node.icon} ${node.label}\n\n`;

    if (node.type === 'person') {
      message += `**Type:** Family Member\n`;
      if (node.tasksAnticipated) {
        message += `**Tasks Anticipated:** ${node.tasksAnticipated}\n`;
        message += `**Burden Score:** ${node.burden?.toFixed(2) || 'N/A'}\n\n`;
        message += `This person notices ${node.tasksAnticipated} tasks proactively before anyone assigns them. `;
        message += `This represents significant invisible cognitive labor.\n\n`;
      }
      message += `**Ask me:**\n`;
      message += `- "What patterns do you see for ${node.label}?"\n`;
      message += `- "How can we reduce ${node.label}'s burden?"\n`;
      message += `- "Show me ${node.label}'s coordination patterns"\n`;
    } else if (node.type === 'task') {
      message += `**Type:** Task\n`;
      if (node.fairPlayCard) {
        message += `**Fair Play Card:** ${node.fairPlayCard}\n\n`;
      }
      message += `**Ask me:**\n`;
      message += `- "Who usually handles ${node.label}?"\n`;
      message += `- "What's the invisible labor in ${node.label}?"\n`;
      message += `- "How can we automate ${node.label}?"\n`;
    } else if (node.type === 'category') {
      message += `**Type:** Fair Play Category\n\n`;
      message += `This category represents a domain of household responsibilities.\n\n`;
      message += `**Ask me:**\n`;
      message += `- "Who owns most cards in ${node.label}?"\n`;
      message += `- "Show me ${node.label} task distribution"\n`;
    }

    return message;
  }

  async function handleSendMessage(messageText = null) {
    const text = messageText || inputValue.trim();
    if (!text) return;

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: text,
      timestamp: new Date()
    }]);

    setInputValue('');
    setIsLoading(true);

    try {
      // Build context for Claude
      const context = buildClaudeContext(text);

      // Send to Claude
      const response = await claudeService.sendMessage([
        { role: 'user', content: context }
      ], {
        temperature: 0.7,
        max_tokens: 2000
      });

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.content,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('Failed to get insights:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I apologize, but I encountered an error generating insights. Please try again.`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  function buildClaudeContext(userQuery) {
    let context = `You are Allie, an AI family assistant analyzing a family's knowledge graph.\n\n`;

    // Add insights data
    if (insights) {
      context += `## Invisible Labor Analysis\n`;
      if (insights.anticipation) {
        context += `**Anticipation Burden:**\n`;
        context += `- Primary: ${insights.anticipation.primaryAnticipator?.name} (${insights.anticipation.primaryAnticipator?.percentage.toFixed(0)}% of tasks)\n`;
        context += `- Severity: ${insights.anticipation.severity}\n`;
        context += `- Insight: ${insights.anticipation.insight}\n\n`;
      }

      if (insights.monitoring) {
        context += `**Monitoring Overhead:**\n`;
        context += `- Primary: ${insights.monitoring.primaryMonitor?.name}\n`;
        context += `- Hours/week: ${insights.monitoring.naggingCoefficient?.toFixed(1)}\n`;
        context += `- Insight: ${insights.monitoring.insight}\n\n`;
      }
    }

    // Add selected node context
    if (selectedNode) {
      context += `## Currently Viewing\n`;
      context += `Node: ${selectedNode.label} (${selectedNode.type})\n\n`;
    }

    context += `## User Question\n${userQuery}\n\n`;
    context += `Provide a warm, insightful response that:\n`;
    context += `1. Answers the specific question with data\n`;
    context += `2. Explains the pattern or insight\n`;
    context += `3. Offers actionable recommendations\n`;
    context += `4. Uses markdown formatting for readability\n\n`;
    context += `Keep responses concise (2-3 paragraphs max) and focus on actionable insights.`;

    return context;
  }

  function handleSuggestedQuestion(question) {
    handleSendMessage(question.text);
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-xl">💬</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Insight Chat</h2>
            <p className="text-xs text-slate-500">Ask me about your family patterns</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="w-8 h-8 rounded-lg hover:bg-white/50 flex items-center justify-center text-slate-400 hover:text-slate-600"
        >
          ✕
        </motion.button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: msg.content.replace(/\n/g, '<br/>')
                      .replace(/##\s(.+)/g, '<h2 class="text-base font-semibold mt-3 mb-2">$1</h2>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/- (.+)/g, '• $1')
                  }}
                />
                <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-slate-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-slate-500">Analyzing...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {suggestedQuestions && suggestedQuestions.length > 0 && (
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 mb-2 font-medium">Suggested insights:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.slice(0, 3).map(q => (
              <motion.button
                key={q.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSuggestedQuestion(q)}
                className="text-xs px-3 py-1.5 rounded-full bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 transition-all flex items-center gap-1"
              >
                <span>{q.icon}</span>
                <span>{q.text}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask about patterns, insights, recommendations..."
            className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-indigo-300 rounded-xl text-sm outline-none transition-all"
            disabled={isLoading}
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-slate-300 disabled:to-slate-400 rounded-xl flex items-center justify-center text-white shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed"
          >
            <span className="text-xl">→</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default InsightChatDrawer;
