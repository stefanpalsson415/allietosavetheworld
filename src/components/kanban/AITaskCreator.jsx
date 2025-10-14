// src/components/kanban/AITaskCreator.jsx
import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Sparkles,
  Clock,
  Flag
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import ClaudeService from '../../services/ClaudeService';
import { useFamily } from '../../contexts/FamilyContext';

const AITaskCreator = ({ onClose, onSave, familyMembers, suggestion }) => {
  const { familyId } = useFamily();
  const [task, setTask] = useState({
    title: '',
    description: '',
    assignedTo: null,
    category: 'general',
    priority: 'medium',
    dueDate: null,
    estimatedTime: null,
    column: 'this-week'
  });
  
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Pre-fill with suggestion if provided
  useEffect(() => {
    if (suggestion) {
      setTask({
        ...task,
        title: suggestion.title || '',
        description: suggestion.description || '',
        assignedTo: familyMembers.find(m => m.name === suggestion.assignedTo)?.id || null,
        category: suggestion.category || 'general',
        priority: suggestion.priority || 'medium',
        dueDate: suggestion.dueDate || null
      });
      // Clear the suggestion
      window.aiTaskSuggestion = null;
    }
  }, [suggestion]);
  
  // Categories
  const categories = [
    { id: 'household', label: 'Household', icon: '🏠' },
    { id: 'parenting', label: 'Parenting', icon: '👶' },
    { id: 'work', label: 'Work', icon: '💼' },
    { id: 'personal', label: 'Personal', icon: '👤' },
    { id: 'errands', label: 'Errands', icon: '🚗' },
    { id: 'health', label: 'Health', icon: '❤️' },
    { id: 'general', label: 'General', icon: '📋' }
  ];
  
  // AI-powered task enhancement
  const enhanceWithAI = async () => {
    if (!task.title) {
      setErrors({ title: 'Please enter a title first' });
      return;
    }
    
    setAiSuggesting(true);
    try {
      const prompt = `Given this task title: "${task.title}"
      
Suggest:
1. A clear, actionable description (2-3 sentences)
2. The best category from: household, parenting, work, personal, errands, health, general
3. Priority level: high, medium, or low
4. Estimated time in minutes
5. Whether this needs a due date (yes/no)
6. If yes, suggest a reasonable timeframe (today, tomorrow, this week, next week)

Context: This is for a family task management system. ${
  task.assignedTo ? `Assigned to: ${familyMembers.find(m => m.id === task.assignedTo)?.name}` : ''
}

Return as JSON with fields: description, category, priority, estimatedTime, needsDueDate, suggestedTimeframe`;

      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7 }
      );
      
      const suggestions = JSON.parse(response);
      
      // Update task with AI suggestions
      setTask(prev => ({
        ...prev,
        description: suggestions.description || prev.description,
        category: suggestions.category || prev.category,
        priority: suggestions.priority || prev.priority,
        estimatedTime: suggestions.estimatedTime || prev.estimatedTime
      }));
      
      // Show AI feedback
      setShowAIAssist(true);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
    } finally {
      setAiSuggesting(false);
    }
  };
  
  // Validate form
  const validate = () => {
    const newErrors = {};
    if (!task.title.trim()) newErrors.title = 'Title is required';
    if (task.title.length > 100) newErrors.title = 'Title too long';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle save
  const handleSave = () => {
    if (!validate()) return;
    
    // Determine initial column based on due date
    let column = task.column;
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate.getTime() === today.getTime()) {
        column = 'today';
      } else if (dueDate.getTime() < today.getTime() + 7 * 24 * 60 * 60 * 1000) {
        column = 'this-week';
      }
    }
    
    onSave({
      ...task,
      column,
      title: task.title.trim(),
      description: task.description.trim()
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create New Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <input
                type="text"
                value={task.title}
                onChange={(e) => setTask({ ...task, title: e.target.value })}
                className={`flex-1 px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.title ? 'border-red-500' : ''
                }`}
                placeholder="What needs to be done?"
              />
              <button
                onClick={enhanceWithAI}
                disabled={aiSuggesting}
                className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-r-lg hover:bg-indigo-200 flex items-center"
              >
                <Sparkles size={18} className="mr-1" />
                {aiSuggesting ? 'Thinking...' : 'AI Assist'}
              </button>
            </div>
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title}</p>
            )}
          </div>
          
          {/* AI Assist Message */}
          {showAIAssist && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-sm">
              <div className="flex items-center text-indigo-700 mb-1">
                <Sparkles size={16} className="mr-1" />
                AI has enhanced your task details
              </div>
              <p className="text-xs text-indigo-600">
                Review the suggestions below and modify as needed.
              </p>
            </div>
          )}
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={task.description}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="Add more details..."
            />
          </div>
          
          {/* Assignee and Category */}
          <div className="grid grid-cols-2 gap-4">
            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <User size={16} className="inline mr-1" />
                Assign to
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => setTask({ ...task, assignedTo: null })}
                  className={`w-full text-left px-3 py-2 rounded-lg border ${
                    !task.assignedTo ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                  }`}
                >
                  Unassigned
                </button>
                {familyMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => setTask({ ...task, assignedTo: member.id })}
                    className={`w-full text-left px-3 py-2 rounded-lg border flex items-center ${
                      task.assignedTo === member.id ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <UserAvatar user={member} size="xs" />
                    <span className="ml-2">{member.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag size={16} className="inline mr-1" />
                Category
              </label>
              <div className="space-y-2">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setTask({ ...task, category: cat.id })}
                    className={`w-full text-left px-3 py-2 rounded-lg border flex items-center ${
                      task.category === cat.id ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{cat.icon}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Due Date and Priority */}
          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={16} className="inline mr-1" />
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={task.dueDate || ''}
                onChange={(e) => setTask({ ...task, dueDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Flag size={16} className="inline mr-1" />
                Priority
              </label>
              <div className="flex space-x-2">
                {['low', 'medium', 'high'].map(priority => (
                  <button
                    key={priority}
                    onClick={() => setTask({ ...task, priority })}
                    className={`flex-1 px-3 py-2 rounded-lg border capitalize ${
                      task.priority === priority
                        ? priority === 'high' 
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : priority === 'medium'
                          ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                          : 'border-green-500 bg-green-50 text-green-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {priority}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Estimated Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={16} className="inline mr-1" />
              Estimated Time (Optional)
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={task.estimatedTime || ''}
                onChange={(e) => setTask({ ...task, estimatedTime: parseInt(e.target.value) || null })}
                className="w-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="30"
                min="5"
                step="5"
              />
              <span className="text-gray-600">minutes</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Create Task
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITaskCreator;