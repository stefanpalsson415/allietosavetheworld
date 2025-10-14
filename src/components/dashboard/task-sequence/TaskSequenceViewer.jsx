// src/components/dashboard/task-sequence/TaskSequenceViewer.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowDownCircle, 
  ArrowRightCircle, 
  Calendar, 
  Tag, 
  User, 
  ShoppingBag, 
  MoreHorizontal,
  PlusCircle,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
import { useAuth } from '../../../contexts/AuthContext';
import TaskSequenceManager from '../../../services/TaskSequenceManager';
import UserAvatar from '../../common/UserAvatar';

/**
 * Component to view and interact with task sequences
 */
const TaskSequenceViewer = ({ sequenceId, onClose }) => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  
  // State
  const [sequence, setSequence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState({});
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [shoppingList, setShoppingList] = useState(null);
  const [delegationSuggestions, setDelegationSuggestions] = useState(null);
  const [showDelegationSuggestions, setShowDelegationSuggestions] = useState(false);
  
  // Load sequence data
  useEffect(() => {
    const loadSequence = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const sequenceData = await TaskSequenceManager.getTaskSequence(sequenceId);
        
        if (sequenceData) {
          setSequence(sequenceData);
          
          // Initialize expanded state for each task
          const expanded = {};
          sequenceData.tasks.forEach(task => {
            expanded[task.id] = false;
          });
          setExpandedTasks(expanded);
        } else {
          setError("Sequence not found");
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading sequence:", err);
        setError("Failed to load sequence");
        setLoading(false);
      }
    };
    
    if (sequenceId && familyId) {
      loadSequence();
    }
  }, [sequenceId, familyId]);
  
  // Toggle task expansion
  const toggleTaskExpansion = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };
  
  // Handle task completion toggle
  const handleTaskCompletion = async (taskId, completed) => {
    try {
      const result = await TaskSequenceManager.updateTask(taskId, currentUser.uid, {
        completed
      });
      
      if (result.success) {
        // Refresh sequence data
        const updatedSequence = await TaskSequenceManager.getTaskSequence(sequenceId);
        setSequence(updatedSequence);
      } else {
        setError("Failed to update task");
      }
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task");
    }
  };
  
  // Handle subtask completion toggle
  const handleSubtaskCompletion = async (taskId, subtaskId, completed) => {
    try {
      // Find the task
      const task = sequence.tasks.find(t => t.id === taskId);
      
      if (!task) return;
      
      // Update the subtask
      const updatedSubtasks = task.subTasks.map(subtask => 
        subtask.id === subtaskId ? { ...subtask, completed } : subtask
      );
      
      // Check if all subtasks are completed
      const allCompleted = updatedSubtasks.every(subtask => subtask.completed);
      
      // Update the task
      const result = await TaskSequenceManager.updateTask(taskId, currentUser.uid, {
        subTasks: updatedSubtasks,
        completed: allCompleted
      });
      
      if (result.success) {
        // Refresh sequence data
        const updatedSequence = await TaskSequenceManager.getTaskSequence(sequenceId);
        setSequence(updatedSequence);
      } else {
        setError("Failed to update task");
      }
    } catch (err) {
      console.error("Error updating subtask:", err);
      setError("Failed to update subtask");
    }
  };
  
  // Generate shopping list
  const handleGenerateShoppingList = async () => {
    try {
      setLoading(true);
      
      const list = await TaskSequenceManager.generateShoppingList(sequenceId);
      
      setShoppingList(list);
      setShowShoppingList(true);
      setLoading(false);
    } catch (err) {
      console.error("Error generating shopping list:", err);
      setError("Failed to generate shopping list");
      setLoading(false);
    }
  };
  
  // Generate delegation suggestions
  const handleGenerateDelegationSuggestions = async () => {
    try {
      setLoading(true);
      
      // Get suggestions for incomplete tasks
      const incompleteTasks = sequence.tasks.filter(task => !task.completed);
      
      const suggestions = await TaskSequenceManager.suggestTaskDelegation(
        familyId, 
        incompleteTasks,
        familyMembers
      );
      
      setDelegationSuggestions(suggestions);
      setShowDelegationSuggestions(true);
      setLoading(false);
    } catch (err) {
      console.error("Error generating delegation suggestions:", err);
      setError("Failed to generate delegation suggestions");
      setLoading(false);
    }
  };
  
  // Apply delegation suggestion
  const handleApplyDelegation = async (taskId, assigneeId) => {
    try {
      const result = await TaskSequenceManager.updateTask(taskId, currentUser.uid, {
        assignedTo: assigneeId
      });
      
      if (result.success) {
        // Refresh sequence data
        const updatedSequence = await TaskSequenceManager.getTaskSequence(sequenceId);
        setSequence(updatedSequence);
        
        // Hide delegation suggestions
        setShowDelegationSuggestions(false);
      } else {
        setError("Failed to update task assignment");
      }
    } catch (err) {
      console.error("Error updating task assignment:", err);
      setError("Failed to update task assignment");
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-blue-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };
  
  // Get priority label
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'critical':
        return 'Critical';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Normal';
    }
  };
  
  // Get assignee name
  const getAssigneeName = (assigneeId) => {
    if (!assigneeId) return "Unassigned";
    
    const member = familyMembers.find(m => m.id === assigneeId);
    return member ? member.name : "Unknown";
  };
  
  // Check if a task is actionable (has no incomplete dependencies)
  const isTaskActionable = (task) => {
    if (!task.dependencies || task.dependencies.length === 0) return true;
    
    return !task.dependencies.some(depId => {
      const depTask = sequence.tasks.find(t => t.id === depId);
      return depTask && !depTask.completed;
    });
  };
  
  // Check if a task is overdue
  const isTaskOverdue = (task) => {
    if (!task.dueDate || task.completed) return false;
    
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    
    return dueDate < now;
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Loading Task Sequence...</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Error</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        </div>
      </div>
    );
  }
  
  // Render sequence not found
  if (!sequence) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Sequence Not Found</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="bg-yellow-50 text-yellow-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            The requested task sequence could not be found.
          </div>
        </div>
      </div>
    );
  }
  
  // Render shopping list
  const renderShoppingList = () => {
    if (!shoppingList || shoppingList.items.length === 0) {
      return (
        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
          <p className="text-yellow-700">No shopping items found in this sequence.</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-bold mb-2">Shopping List</h4>
        
        {Object.entries(shoppingList.groupedItems).map(([category, items]) => (
          <div key={category} className="mb-4">
            <h5 className="font-medium text-gray-700 mb-2">{category}</h5>
            <ul className="list-disc pl-5 space-y-1">
              {items.map((item, index) => (
                <li key={index} className="text-gray-600">
                  {item.name} {item.optional && <span className="text-gray-400">(optional)</span>}
                  <span className="text-gray-400 text-xs ml-2">
                    - from {item.taskTitle}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        
        <div className="flex justify-end mt-2">
          <button
            onClick={() => setShowShoppingList(false)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Hide Shopping List
          </button>
        </div>
      </div>
    );
  };
  
  // Render delegation suggestions
  const renderDelegationSuggestions = () => {
    if (!delegationSuggestions || Object.keys(delegationSuggestions).length === 0) {
      return (
        <div className="bg-yellow-50 p-4 rounded-lg mb-4">
          <p className="text-yellow-700">No delegation suggestions available.</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h4 className="text-lg font-bold mb-2">Suggested Task Assignments</h4>
        
        <div className="space-y-3">
          {Object.values(delegationSuggestions).map((suggestion) => (
            <div key={suggestion.taskId} className="p-3 border border-gray-100 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{suggestion.title}</p>
                  <p className="text-sm text-gray-500">
                    Suggested: <span className="font-medium">{getAssigneeName(suggestion.suggestedAssignee)}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Reason: {suggestion.reason}
                  </p>
                </div>
                <button
                  onClick={() => handleApplyDelegation(suggestion.taskId, suggestion.suggestedAssignee)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                >
                  Assign
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end mt-2">
          <button
            onClick={() => setShowDelegationSuggestions(false)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Hide Suggestions
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">{sequence.title}</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Description and metadata */}
      <div className="mb-6">
        <p className="text-gray-600 mb-3">{sequence.description}</p>
        
        {/* Info pills */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center text-sm px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
            <Tag size={14} className="mr-1" />
            {sequence.category}
          </div>
          
          <div className="flex items-center text-sm px-2 py-1 bg-gray-50 text-gray-700 rounded-md">
            <Clock size={14} className="mr-1" />
            {sequence.status.charAt(0).toUpperCase() + sequence.status.slice(1)}
          </div>
          
          {sequence.dueDate && (
            <div className="flex items-center text-sm px-2 py-1 bg-yellow-50 text-yellow-700 rounded-md">
              <Calendar size={14} className="mr-1" />
              Due: {formatDate(sequence.dueDate)}
            </div>
          )}
          
          <div className="flex items-center text-sm px-2 py-1 bg-green-50 text-green-700 rounded-md">
            <CheckCircle size={14} className="mr-1" />
            {Math.round(sequence.completionPercentage)}% Complete
          </div>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex flex-wrap mb-6 gap-2">
        <button
          onClick={handleGenerateShoppingList}
          className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
        >
          <ShoppingBag size={16} className="mr-2 text-blue-500" />
          <span>Generate Shopping List</span>
        </button>
        
        <button
          onClick={handleGenerateDelegationSuggestions}
          className="flex items-center px-3 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50"
        >
          <User size={16} className="mr-2 text-green-500" />
          <span>Suggest Task Delegation</span>
        </button>
      </div>
      
      {/* Shopping list */}
      {showShoppingList && renderShoppingList()}
      
      {/* Delegation suggestions */}
      {showDelegationSuggestions && renderDelegationSuggestions()}
      
      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${sequence.completionPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Tasks list */}
      <div className="space-y-3">
        {sequence.tasks.map((task) => (
          <div 
            key={task.id}
            className={`border rounded-lg overflow-hidden ${
              isTaskActionable(task) ? 'border-blue-200' : 'border-gray-200'
            } ${task.completed ? 'bg-gray-50' : 'bg-white'}`}
          >
            {/* Task header */}
            <div 
              className={`flex items-center p-3 cursor-pointer ${
                isTaskActionable(task) && !task.completed ? 'hover:bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleTaskExpansion(task.id)}
            >
              {/* Completion checkbox */}
              <div className="mr-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskCompletion(task.id, !task.completed);
                  }}
                  disabled={!isTaskActionable(task)}
                  className={`rounded-full p-1 ${
                    task.completed 
                      ? 'text-green-500 hover:text-green-600' 
                      : isTaskActionable(task)
                        ? 'text-gray-400 hover:text-gray-600'
                        : 'text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle size={20} className="fill-green-500 text-white" />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                </button>
              </div>
              
              {/* Task title and metadata */}
              <div className="flex-1">
                <h4 className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                  {task.title}
                </h4>
                
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                  {/* Priority */}
                  <span className={`${getPriorityColor(task.priority)}`}>
                    {getPriorityLabel(task.priority)}
                  </span>
                  
                  {/* Due date */}
                  {task.dueDate && (
                    <span className={`flex items-center ${
                      isTaskOverdue(task) ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      <Clock size={12} className="mr-1" />
                      {formatDate(task.dueDate)}
                      {isTaskOverdue(task) && ' (Overdue)'}
                    </span>
                  )}
                  
                  {/* Assignee */}
                  {task.assignedTo && (
                    <span className="flex items-center text-gray-500">
                      <User size={12} className="mr-1" />
                      {getAssigneeName(task.assignedTo)}
                    </span>
                  )}
                  
                  {/* Dependencies */}
                  {task.dependencies && task.dependencies.length > 0 && !isTaskActionable(task) && (
                    <span className="flex items-center text-amber-500">
                      <AlertCircle size={12} className="mr-1" />
                      Waiting on prerequisites
                    </span>
                  )}
                </div>
              </div>
              
              {/* Expand/collapse indicator */}
              <div>
                {expandedTasks[task.id] ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </div>
            </div>
            
            {/* Task details (expanded) */}
            {expandedTasks[task.id] && (
              <div className="border-t border-gray-100 p-3 bg-gray-50">
                {/* Description */}
                {task.description && (
                  <div className="mb-3">
                    <p className="text-gray-600 text-sm">{task.description}</p>
                  </div>
                )}
                
                {/* Subtasks */}
                {task.subTasks && task.subTasks.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Subtasks</h5>
                    <ul className="space-y-2">
                      {task.subTasks.map((subtask) => (
                        <li key={subtask.id} className="flex items-start">
                          <button
                            onClick={() => handleSubtaskCompletion(task.id, subtask.id, !subtask.completed)}
                            className={`mr-2 mt-0.5 rounded-full p-0.5 ${
                              subtask.completed 
                                ? 'text-green-500 hover:text-green-600' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {subtask.completed ? (
                              <CheckCircle size={16} className="fill-green-500 text-white" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                          </button>
                          <span className={`text-sm ${subtask.completed ? 'text-gray-500 line-through' : 'text-gray-700'}`}>
                            {subtask.title}
                            {subtask.description && (
                              <p className="text-xs text-gray-500 mt-0.5">{subtask.description}</p>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Dependencies */}
                {task.dependencies && task.dependencies.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Prerequisites</h5>
                    <ul className="space-y-1">
                      {task.dependencies.map((depId) => {
                        const depTask = sequence.tasks.find(t => t.id === depId);
                        return depTask ? (
                          <li key={depId} className="flex items-center text-sm">
                            {depTask.completed ? (
                              <CheckCircle size={14} className="mr-1 text-green-500" />
                            ) : (
                              <Clock size={14} className="mr-1 text-amber-500" />
                            )}
                            <span className={depTask.completed ? 'text-gray-500' : 'text-gray-700'}>
                              {depTask.title}
                            </span>
                          </li>
                        ) : null;
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {sequence.tasks.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-gray-500">No tasks in this sequence yet.</p>
        </div>
      )}
    </div>
  );
};

export default TaskSequenceViewer;