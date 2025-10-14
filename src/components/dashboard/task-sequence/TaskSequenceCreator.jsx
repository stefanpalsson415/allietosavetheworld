// src/components/dashboard/task-sequence/TaskSequenceCreator.jsx
import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  AlertCircle 
} from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
import { useAuth } from '../../../contexts/AuthContext';
import TaskSequenceManager from '../../../services/TaskSequenceManager';

/**
 * Component to create a new task sequence
 */
const TaskSequenceCreator = ({ onCancel, onSequenceCreated }) => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  
  // State for the form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Personal');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [tasks, setTasks] = useState([
    // Initialize with one empty task
    {
      id: 'temp-1',
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      assignedTo: '',
      dependencies: [],
      sequential: true,
      subTasks: []
    }
  ]);
  
  // State for the UI
  const [showTaskDetail, setShowTaskDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Common categories
  const categories = [
    'Personal',
    'Family',
    'Work',
    'Home Improvement',
    'Travel',
    'Event Planning',
    'Health',
    'Education',
    'Finance',
    'Shopping'
  ];
  
  // Priorities
  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];
  
  // Task detail panel toggle
  const toggleTaskDetail = (taskId) => {
    if (showTaskDetail === taskId) {
      setShowTaskDetail(null);
    } else {
      setShowTaskDetail(taskId);
    }
  };
  
  // Add a new task
  const addTask = () => {
    const newTask = {
      id: `temp-${tasks.length + 1}`,
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      assignedTo: '',
      dependencies: [],
      sequential: true,
      subTasks: []
    };
    
    setTasks([...tasks, newTask]);
    setShowTaskDetail(newTask.id);
  };
  
  // Remove a task
  const removeTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    
    // If we were showing this task's details, hide the panel
    if (showTaskDetail === taskId) {
      setShowTaskDetail(null);
    }
    
    // Update dependencies in other tasks
    setTasks(prevTasks => 
      prevTasks.map(task => ({
        ...task,
        dependencies: task.dependencies.filter(depId => depId !== taskId)
      }))
    );
  };
  
  // Move task up
  const moveTaskUp = (index) => {
    if (index === 0) return;
    
    const newTasks = [...tasks];
    const temp = newTasks[index];
    newTasks[index] = newTasks[index - 1];
    newTasks[index - 1] = temp;
    
    setTasks(newTasks);
  };
  
  // Move task down
  const moveTaskDown = (index) => {
    if (index === tasks.length - 1) return;
    
    const newTasks = [...tasks];
    const temp = newTasks[index];
    newTasks[index] = newTasks[index + 1];
    newTasks[index + 1] = temp;
    
    setTasks(newTasks);
  };
  
  // Update task data
  const updateTask = (taskId, field, value) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, [field]: value } : task
      )
    );
  };
  
  // Add subtask
  const addSubtask = (taskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subTasks: [
              ...task.subTasks,
              {
                id: `subtask-${task.id}-${task.subTasks.length + 1}`,
                title: '',
                completed: false
              }
            ]
          };
        }
        return task;
      })
    );
  };
  
  // Remove subtask
  const removeSubtask = (taskId, subtaskId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subTasks: task.subTasks.filter(subtask => subtask.id !== subtaskId)
          };
        }
        return task;
      })
    );
  };
  
  // Update subtask
  const updateSubtask = (taskId, subtaskId, field, value) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          return {
            ...task,
            subTasks: task.subTasks.map(subtask => 
              subtask.id === subtaskId ? { ...subtask, [field]: value } : subtask
            )
          };
        }
        return task;
      })
    );
  };
  
  // Toggle dependency
  const toggleDependency = (taskId, dependencyId) => {
    setTasks(prevTasks => 
      prevTasks.map(task => {
        if (task.id === taskId) {
          const dependencies = [...task.dependencies];
          
          if (dependencies.includes(dependencyId)) {
            // Remove dependency
            return {
              ...task,
              dependencies: dependencies.filter(id => id !== dependencyId)
            };
          } else {
            // Add dependency
            return {
              ...task,
              dependencies: [...dependencies, dependencyId]
            };
          }
        }
        return task;
      })
    );
  };
  
  // Toggle sequential for all tasks
  const toggleAllSequential = (value) => {
    setTasks(prevTasks => 
      prevTasks.map(task => ({
        ...task,
        sequential: value
      }))
    );
  };
  
  // Form validation
  const validateForm = () => {
    if (!title.trim()) {
      setError("Sequence title is required");
      return false;
    }
    
    if (tasks.length === 0) {
      setError("At least one task is required");
      return false;
    }
    
    for (const task of tasks) {
      if (!task.title.trim()) {
        setError("All tasks must have a title");
        return false;
      }
    }
    
    setError(null);
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare sequence data
      const sequenceData = {
        title,
        description,
        category,
        dueDate: dueDate || null,
        priority,
        tasks: tasks.map(task => ({
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate || null,
          assignedTo: task.assignedTo || null,
          dependencies: task.dependencies,
          sequential: task.sequential,
          subTasks: task.subTasks.map(subtask => ({
            title: subtask.title,
            completed: subtask.completed
          }))
        })),
        reminderStrategy: 'adaptive',
        delegationStrategy: 'auto'
      };
      
      // Create the sequence
      const result = await TaskSequenceManager.createTaskSequence(
        familyId,
        currentUser.uid,
        sequenceData
      );
      
      if (result.success) {
        // Notify parent component
        onSequenceCreated(result.sequenceId);
      } else {
        setError(result.error || "Failed to create sequence");
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error creating sequence:", err);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Create New Task Sequence</h3>
        <button 
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        {/* Sequence details */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium mb-4">Sequence Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter sequence title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Description */}
            <div className="col-span-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter sequence description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {/* Due Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {priorities.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sequential toggle for all tasks */}
            <div className="flex items-center">
              <label className="text-sm font-medium text-gray-700 mr-4">
                Task Dependencies:
              </label>
              <div className="flex items-center space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={tasks.every(task => task.sequential)}
                    onChange={() => toggleAllSequential(true)}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Sequential</span>
                </label>
                
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    checked={!tasks.every(task => task.sequential)}
                    onChange={() => toggleAllSequential(false)}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-700">Custom Dependencies</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tasks section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium">Tasks</h4>
            <button
              type="button"
              onClick={addTask}
              className="px-3 py-1 bg-blue-500 text-white rounded-md flex items-center hover:bg-blue-600"
            >
              <Plus size={16} className="mr-1" />
              Add Task
            </button>
          </div>
          
          {/* Tasks list */}
          <div className="space-y-3">
            {tasks.map((task, index) => (
              <div 
                key={task.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Task header */}
                <div className="flex items-center bg-gray-50 p-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={task.title}
                      onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                      placeholder="Task title"
                      className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-3">
                    {/* Move up/down */}
                    <button
                      type="button"
                      onClick={() => moveTaskUp(index)}
                      disabled={index === 0}
                      className={`p-1 rounded ${
                        index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <ArrowUp size={16} />
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => moveTaskDown(index)}
                      disabled={index === tasks.length - 1}
                      className={`p-1 rounded ${
                        index === tasks.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <ArrowDown size={16} />
                    </button>
                    
                    {/* Edit/delete */}
                    <button
                      type="button"
                      onClick={() => toggleTaskDetail(task.id)}
                      className="p-1 rounded text-blue-500 hover:bg-blue-100"
                    >
                      {showTaskDetail === task.id ? (
                        <X size={16} />
                      ) : (
                        <Plus size={16} />
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => removeTask(task.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-100"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Task details */}
                {showTaskDetail === task.id && (
                  <div className="p-3 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      {/* Description */}
                      <div className="col-span-full">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Description
                        </label>
                        <textarea
                          value={task.description}
                          onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                          placeholder="Task description"
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          rows={2}
                        />
                      </div>
                      
                      {/* Due Date */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={task.dueDate}
                          onChange={(e) => updateTask(task.id, 'dueDate', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* Priority */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Priority
                        </label>
                        <select
                          value={task.priority}
                          onChange={(e) => updateTask(task.id, 'priority', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {priorities.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Assigned To */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Assigned To
                        </label>
                        <select
                          value={task.assignedTo}
                          onChange={(e) => updateTask(task.id, 'assignedTo', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {familyMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Dependencies */}
                      {!task.sequential && index > 0 && (
                        <div className="col-span-full">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Dependencies
                          </label>
                          <div className="p-2 border border-gray-200 rounded-md bg-gray-50 max-h-40 overflow-y-auto">
                            {tasks.slice(0, index).map((depTask) => (
                              <label 
                                key={depTask.id} 
                                className="flex items-center space-x-2 mb-1 text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={task.dependencies.includes(depTask.id)}
                                  onChange={() => toggleDependency(task.id, depTask.id)}
                                  className="form-checkbox h-4 w-4 text-blue-500 rounded"
                                />
                                <span>{depTask.title || `Task ${tasks.indexOf(depTask) + 1}`}</span>
                              </label>
                            ))}
                            {tasks.slice(0, index).length === 0 && (
                              <p className="text-sm text-gray-500">No previous tasks available</p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Subtasks */}
                      <div className="col-span-full mt-2">
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-xs font-medium text-gray-600">
                            Subtasks
                          </label>
                          <button
                            type="button"
                            onClick={() => addSubtask(task.id)}
                            className="text-xs flex items-center text-blue-500 hover:text-blue-700"
                          >
                            <Plus size={12} className="mr-1" />
                            Add Subtask
                          </button>
                        </div>
                        
                        {task.subTasks.length === 0 ? (
                          <p className="text-sm text-gray-500">No subtasks added</p>
                        ) : (
                          <div className="space-y-2">
                            {task.subTasks.map((subtask) => (
                              <div 
                                key={subtask.id}
                                className="flex items-center"
                              >
                                <input
                                  type="text"
                                  value={subtask.title}
                                  onChange={(e) => updateSubtask(task.id, subtask.id, 'title', e.target.value)}
                                  placeholder="Subtask title"
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeSubtask(task.id, subtask.id)}
                                  className="ml-2 p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {tasks.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500 mb-2">No tasks added yet</p>
              <button
                type="button"
                onClick={addTask}
                className="px-3 py-1 bg-blue-500 text-white rounded-md inline-flex items-center hover:bg-blue-600"
              >
                <Plus size={16} className="mr-1" />
                Add Task
              </button>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Creating...
              </>
            ) : (
              'Create Sequence'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskSequenceCreator;