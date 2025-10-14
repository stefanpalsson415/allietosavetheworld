// src/components/dashboard/task-sequence/TaskSequenceManager.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Layers, 
  Search, 
  Calendar, 
  Tag, 
  X, 
  Edit, 
  Trash, 
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
import { useAuth } from '../../../contexts/AuthContext';
import TaskSequenceManagerService from '../../../services/TaskSequenceManager';
import TaskSequenceViewer from './TaskSequenceViewer';
import TaskSequenceCreator from './TaskSequenceCreator';

/**
 * Component to manage task sequences
 */
const TaskSequenceManager = () => {
  const { familyId } = useFamily();
  const { currentUser } = useAuth();
  
  // State
  const [sequences, setSequences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Load sequences
  useEffect(() => {
    const loadSequences = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!familyId) {
          setLoading(false);
          return;
        }
        
        const sequencesData = await TaskSequenceManagerService.getSequencesForFamily(familyId);
        setSequences(sequencesData);
        setLoading(false);
      } catch (err) {
        console.error("Error loading sequences:", err);
        setError("Failed to load sequences");
        setLoading(false);
      }
    };
    
    loadSequences();
  }, [familyId]);
  
  // Filter and sort sequences
  const filteredSequences = sequences
    .filter(sequence => {
      // Apply search term filter
      if (searchTerm && !sequence.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !sequence.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Apply category filter
      if (categoryFilter && sequence.category !== categoryFilter) {
        return false;
      }
      
      // Apply status filter
      if (statusFilter && sequence.status !== statusFilter) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by status (active first)
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      
      // Then by completion percentage (less complete first)
      return a.completionPercentage - b.completionPercentage;
    });
  
  // Handle sequence selection
  const handleSelectSequence = (sequenceId) => {
    setSelectedSequence(sequenceId);
    setShowCreateForm(false);
  };
  
  // Handle sequence deletion
  const handleDeleteSequence = async (sequenceId, event) => {
    event.stopPropagation(); // Prevent selecting the sequence
    
    if (!window.confirm('Are you sure you want to delete this sequence? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      
      const result = await TaskSequenceManagerService.deleteTaskSequence(sequenceId, currentUser.uid);
      
      if (result.success) {
        // Remove from state
        setSequences(prev => prev.filter(seq => seq.id !== sequenceId));
        
        // If this was the selected sequence, clear selection
        if (selectedSequence === sequenceId) {
          setSelectedSequence(null);
        }
      } else {
        setError("Failed to delete sequence");
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error deleting sequence:", err);
      setError("Failed to delete sequence");
      setLoading(false);
    }
  };
  
  // Handle sequence creation
  const handleSequenceCreated = async (sequenceId) => {
    try {
      // Reload sequences
      const sequencesData = await TaskSequenceManagerService.getSequencesForFamily(familyId);
      setSequences(sequencesData);
      
      // Select the new sequence
      setSelectedSequence(sequenceId);
      setShowCreateForm(false);
    } catch (err) {
      console.error("Error after sequence creation:", err);
    }
  };
  
  // Create task sequence form handlers
  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setSelectedSequence(null);
  };
  
  const handleCancelCreate = () => {
    setShowCreateForm(false);
  };
  
  // Get unique categories for filter
  const uniqueCategories = [...new Set(sequences.map(seq => seq.category))];
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold font-roboto">Task Sequences</h2>
        <button 
          onClick={handleShowCreateForm}
          className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center hover:bg-blue-600"
        >
          <Plus size={16} className="mr-1" />
          New Sequence
        </button>
      </div>
      
      {/* Information banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 flex items-start">
        <AlertCircle size={24} className="text-blue-500 flex-shrink-0 mr-3" />
        <div>
          <h3 className="font-medium text-blue-700 mb-1">About Task Sequences</h3>
          <p className="text-sm text-blue-600">
            Task sequences are groups of related tasks with dependencies between them. They help you manage complex workflows like home renovations, family trips, or recurring chores. Create a sequence, add tasks with dependencies, and track your progress.
          </p>
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search sequences..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        
        <div className="mt-2 flex justify-between items-center">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="text-sm text-blue-600 flex items-center hover:text-blue-800"
          >
            {showFilters ? (
              <>
                <ChevronUp size={16} className="mr-1" />
                Hide Filters
              </>
            ) : (
              <>
                <ChevronDown size={16} className="mr-1" />
                Show Filters
              </>
            )}
          </button>
          
          {(categoryFilter || statusFilter) && (
            <button 
              onClick={() => {
                setCategoryFilter('');
                setStatusFilter('');
              }}
              className="text-sm text-red-600 flex items-center hover:text-red-800"
            >
              <X size={16} className="mr-1" />
              Clear Filters
            </button>
          )}
        </div>
        
        {showFilters && (
          <div className="mt-3 flex flex-wrap gap-3">
            {/* Category filter */}
            <div>
              <label className="text-sm text-gray-600 block mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                <option value="">All Categories</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            {/* Status filter */}
            <div>
              <label className="text-sm text-gray-600 block mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Main content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left sidebar: Sequences list */}
        <div className="w-full md:w-1/3">
          {loading && sequences.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle size={20} className="mr-2" />
                {error}
              </div>
            </div>
          ) : filteredSequences.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <Layers size={40} className="text-gray-400 mx-auto mb-3" />
              <h3 className="text-gray-700 text-lg font-medium mb-1">No Sequences Found</h3>
              <p className="text-gray-500 mb-4">
                {sequences.length === 0
                  ? "You haven't created any task sequences yet."
                  : "No sequences match your filters."}
              </p>
              {sequences.length === 0 && (
                <button
                  onClick={handleShowCreateForm}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md inline-flex items-center hover:bg-blue-600"
                >
                  <Plus size={16} className="mr-1" />
                  Create Sequence
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3 overflow-auto max-h-[600px] pr-2">
              {filteredSequences.map((sequence) => (
                <div
                  key={sequence.id}
                  onClick={() => handleSelectSequence(sequence.id)}
                  className={`p-3 border rounded-md cursor-pointer ${
                    selectedSequence === sequence.id
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium text-gray-800">{sequence.title}</h3>
                    <button
                      onClick={(e) => handleDeleteSequence(sequence.id, e)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-500 line-clamp-2">
                    {sequence.description || "No description"}
                  </div>
                  
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="flex items-center text-xs text-gray-500">
                      <Tag size={12} className="mr-1" />
                      {sequence.category}
                    </span>
                    
                    {sequence.dueDate && (
                      <span className="flex items-center text-xs text-gray-500">
                        <Calendar size={12} className="mr-1" />
                        {formatDate(sequence.dueDate)}
                      </span>
                    )}
                    
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      sequence.status === 'active' ? 'bg-green-100 text-green-700' :
                      sequence.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {sequence.status.charAt(0).toUpperCase() + sequence.status.slice(1)}
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-gray-500">{Math.round(sequence.completionPercentage)}% complete</span>
                      <span className="text-gray-500">
                        {sequence.tasks?.filter(t => t.completed)?.length || 0}/{sequence.tasks?.length || 0} tasks
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${sequence.completionPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Right content: Selected sequence or create form */}
        <div className="w-full md:w-2/3">
          {showCreateForm ? (
            <TaskSequenceCreator
              onCancel={handleCancelCreate}
              onSequenceCreated={handleSequenceCreated}
            />
          ) : selectedSequence ? (
            <TaskSequenceViewer
              sequenceId={selectedSequence}
              onClose={() => setSelectedSequence(null)}
            />
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg text-center h-full flex items-center justify-center">
              <div>
                <Layers size={48} className="text-gray-400 mx-auto mb-3" />
                <h3 className="text-gray-700 text-lg font-medium mb-1">No Sequence Selected</h3>
                <p className="text-gray-500 mb-4">
                  Select a sequence from the list to view its details, or create a new sequence.
                </p>
                <button
                  onClick={handleShowCreateForm}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md inline-flex items-center hover:bg-blue-600"
                >
                  <Plus size={16} className="mr-1" />
                  Create Sequence
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskSequenceManager;