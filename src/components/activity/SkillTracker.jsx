import React, { useState, useEffect } from 'react';
import { Award, Search, Plus, Edit, ChevronDown, ChevronUp, X, Star, Clock, LineChart, BarChart2 } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import ActivityManager from '../../services/ActivityManager';
import { format } from 'date-fns';

const SkillTracker = ({ skills: initialSkills, onUpdateSkill }) => {
  const { selectedUser, familyMembers } = useFamily();
  const [skillData, setSkillData] = useState({ individual: [], grouped: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [expandedSkills, setExpandedSkills] = useState({});
  const [activities, setActivities] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list, grid, chart
  const [groupBy, setGroupBy] = useState('category'); // category, activity, level
  
  // Children from family members
  const children = familyMembers?.filter(member => 
    member.relationship === 'child' || 
    member.relationship === 'son' || 
    member.relationship === 'daughter'
  ) || [];
  
  // Forms state
  const [skillForm, setSkillForm] = useState({
    activityId: '',
    name: '',
    category: '',
    description: '',
    level: 1,
    targetLevel: 5,
    progress: 0,
    notes: ''
  });
  
  const [assessmentForm, setAssessmentForm] = useState({
    level: 1,
    progress: 0,
    notes: '',
    assessor: ''
  });
  
  useEffect(() => {
    if (initialSkills) {
      setSkillData(initialSkills);
    } else if (selectedUser?.familyId) {
      // Set active child to the selected user if they are a child,
      // otherwise default to the first child in the family
      if (selectedUser.relationship === 'child' || 
          selectedUser.relationship === 'son' || 
          selectedUser.relationship === 'daughter') {
        setActiveChild(selectedUser.id);
      } else if (children.length > 0) {
        setActiveChild(children[0].id);
      }
    }
  }, [selectedUser, initialSkills, children]);
  
  useEffect(() => {
    if (activeChild) {
      loadSkills();
    }
    
    loadActivities();
  }, [activeChild]);
  
  const loadSkills = async () => {
    if (!activeChild) return;
    
    setIsLoading(true);
    
    try {
      const skillProgress = await ActivityManager.getSkillProgress(activeChild);
      setSkillData(skillProgress);
    } catch (error) {
      console.error('Error loading skill progress:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadActivities = async () => {
    if (!selectedUser?.familyId) return;
    
    try {
      // Get activities for the current child or all children if parent
      const filterParams = {
        isActive: true
      };
      
      if (activeChild) {
        filterParams.participantId = activeChild;
      }
      
      const activityList = await ActivityManager.getActivitiesForFamily(
        selectedUser.familyId,
        filterParams
      );
      
      setActivities(activityList);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };
  
  const handleInputChange = (formName, e) => {
    const { name, value, type } = e.target;
    
    if (formName === 'skill') {
      setSkillForm(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value, 10) || 0 : value
      }));
    } else if (formName === 'assessment') {
      setAssessmentForm(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value, 10) || 0 : value
      }));
    }
  };
  
  const toggleExpandSkill = (skillId) => {
    setExpandedSkills(prev => ({
      ...prev,
      [skillId]: !prev[skillId]
    }));
  };
  
  const handleAddSkill = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const selectedActivity = activities.find(a => a.id === skillForm.activityId);
      
      if (!selectedActivity) {
        throw new Error('Activity not found');
      }
      
      // Get current skills tracking data
      const currentSkillsTracking = selectedActivity.skillsTracking || {
        enabled: true,
        skills: []
      };
      
      // Prepare the new skill data
      const newSkill = {
        id: showEditForm && selectedSkill ? selectedSkill.id : `skill-${Date.now()}`,
        name: skillForm.name,
        category: skillForm.category,
        description: skillForm.description,
        level: skillForm.level,
        targetLevel: skillForm.targetLevel,
        progress: skillForm.progress,
        notes: skillForm.notes,
        assessments: showEditForm && selectedSkill && selectedSkill.assessments ? selectedSkill.assessments : []
      };
      
      // Update skills in the activity
      let updatedSkills;
      
      if (showEditForm && selectedSkill) {
        // Edit existing skill
        updatedSkills = currentSkillsTracking.skills.map(skill => 
          skill.id === selectedSkill.id ? newSkill : skill
        );
      } else {
        // Add new skill
        updatedSkills = [...currentSkillsTracking.skills, newSkill];
      }
      
      // Update skills tracking in activity
      const updatedSkillsTracking = {
        ...currentSkillsTracking,
        enabled: true,
        skills: updatedSkills
      };
      
      await ActivityManager.updateSkillsTracking(selectedActivity.id, updatedSkillsTracking);
      
      // Refresh data
      await loadSkills();
      
      // Call the callback if provided
      if (onUpdateSkill) {
        onUpdateSkill(selectedActivity.id, updatedSkillsTracking);
      }
      
      // Reset form and state
      resetSkillForm();
    } catch (error) {
      console.error('Error saving skill:', error);
      alert('Failed to save skill. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRecordAssessment = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!selectedSkill) {
        throw new Error('No skill selected');
      }
      
      // Prepare assessment data
      const assessment = {
        level: assessmentForm.level,
        progress: assessmentForm.progress,
        notes: assessmentForm.notes,
        assessor: assessmentForm.assessor || selectedUser.name
      };
      
      // Record the assessment
      await ActivityManager.recordSkillAssessment(
        selectedSkill.activityId,
        selectedSkill.id,
        assessment
      );
      
      // Refresh data
      await loadSkills();
      
      // Reset form and state
      resetAssessmentForm();
    } catch (error) {
      console.error('Error recording assessment:', error);
      alert('Failed to record assessment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditSkill = (skill) => {
    setSelectedSkill(skill);
    setSkillForm({
      activityId: skill.activityId,
      name: skill.name,
      category: skill.category || '',
      description: skill.description || '',
      level: skill.level || 1,
      targetLevel: skill.targetLevel || 5,
      progress: skill.progress || 0,
      notes: skill.notes || ''
    });
    setShowEditForm(true);
    setShowAddForm(false);
    setShowAssessmentForm(false);
  };
  
  const handleRecordAssessmentClick = (skill) => {
    setSelectedSkill(skill);
    setAssessmentForm({
      level: skill.level || 1,
      progress: skill.progress || 0,
      notes: '',
      assessor: selectedUser.name
    });
    setShowAssessmentForm(true);
    setShowAddForm(false);
    setShowEditForm(false);
  };
  
  const resetSkillForm = () => {
    setSkillForm({
      activityId: '',
      name: '',
      category: '',
      description: '',
      level: 1,
      targetLevel: 5,
      progress: 0,
      notes: ''
    });
    setSelectedSkill(null);
    setShowAddForm(false);
    setShowEditForm(false);
  };
  
  const resetAssessmentForm = () => {
    setAssessmentForm({
      level: 1,
      progress: 0,
      notes: '',
      assessor: ''
    });
    setSelectedSkill(null);
    setShowAssessmentForm(false);
  };
  
  // Filter skills based on search term
  const filteredSkills = skillData.individual.filter(skill => {
    if (!searchTerm) return true;
    
    return (
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.activityName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });
  
  // Group skills based on selected grouping
  const groupedSkills = filteredSkills.reduce((groups, skill) => {
    let groupKey;
    
    switch (groupBy) {
      case 'category':
        groupKey = skill.category || 'Uncategorized';
        break;
      case 'activity':
        groupKey = skill.activityName || 'Unknown Activity';
        break;
      case 'level':
        if (skill.level <= 1) {
          groupKey = 'Beginner';
        } else if (skill.level <= 3) {
          groupKey = 'Intermediate';
        } else {
          groupKey = 'Advanced';
        }
        break;
      default:
        groupKey = 'All Skills';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(skill);
    return groups;
  }, {});
  
  // Generate group headers
  const groupHeaders = Object.keys(groupedSkills).sort();
  
  const EmptyStateMessage = () => (
    <div className="text-center py-8">
      <Award size={48} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Skills Being Tracked</h3>
      <p className="text-gray-500 mb-6">
        {searchTerm
          ? 'Try adjusting your search term'
          : 'Track progress on skills for activities, sports, lessons, and more'}
      </p>
      <button
        onClick={() => {
          setShowAddForm(true);
          setShowEditForm(false);
          setShowAssessmentForm(false);
        }}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
      >
        <Plus size={16} className="mr-2" />
        Add Skill
      </button>
    </div>
  );
  
  // Render the skill card component
  const SkillCard = ({ skill }) => {
    const progressPercentage = skill.progress || 0;
    const lastAssessment = skill.assessments && skill.assessments.length > 0 
      ? skill.assessments[skill.assessments.length - 1] 
      : null;
    
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <h3 className="font-medium text-gray-900">{skill.name}</h3>
              {skill.category && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                  {skill.category}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">{skill.activityName}</p>
            {skill.description && (
              <p className="text-sm text-gray-500 mt-1">{skill.description}</p>
            )}
          </div>
          
          <div className="flex flex-col items-end">
            <div className="flex items-center">
              {[...Array(skill.level)].map((_, i) => (
                <Star key={i} size={16} className="text-yellow-400 fill-current" />
              ))}
              {[...Array(skill.targetLevel - skill.level)].map((_, i) => (
                <Star key={i + skill.level} size={16} className="text-gray-300" />
              ))}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Level {skill.level}/{skill.targetLevel}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Last assessment info and button to expand */}
        <div className="mt-3 flex justify-between items-center">
          <button
            onClick={() => toggleExpandSkill(skill.id)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            {expandedSkills[skill.id] ? (
              <>
                <ChevronUp size={16} className="mr-1" />
                Hide History
              </>
            ) : (
              <>
                <ChevronDown size={16} className="mr-1" />
                Show History
              </>
            )}
          </button>
          
          {lastAssessment && (
            <div className="text-xs text-gray-500 flex items-center">
              <Clock size={12} className="mr-1" />
              Last assessed: {format(lastAssessment.date.toDate(), 'MMM d, yyyy')}
            </div>
          )}
        </div>
        
        {/* Expanded assessment history */}
        {expandedSkills[skill.id] && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Assessment History</h4>
            
            {skill.assessments && skill.assessments.length > 0 ? (
              <div className="space-y-3">
                {skill.assessments.slice().reverse().map((assessment, index) => (
                  <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                    <div className="flex justify-between">
                      <div className="font-medium">Level {assessment.level}</div>
                      <div className="text-gray-500">{format(assessment.date.toDate(), 'MMM d, yyyy')}</div>
                    </div>
                    <div className="text-gray-600 mt-1">Progress: {assessment.progress}%</div>
                    {assessment.notes && (
                      <div className="text-gray-500 mt-1 text-xs">{assessment.notes}</div>
                    )}
                    {assessment.assessor && (
                      <div className="text-gray-500 mt-1 text-xs">By: {assessment.assessor}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No assessment history available.</p>
            )}
          </div>
        )}
        
        {/* Actions */}
        <div className="mt-3 flex justify-end space-x-2">
          <button
            onClick={() => handleEditSkill(skill)}
            className="inline-flex items-center px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            <Edit size={12} className="mr-1" />
            Edit
          </button>
          <button
            onClick={() => handleRecordAssessmentClick(skill)}
            className="inline-flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Award size={12} className="mr-1" />
            Record Assessment
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3 sm:mb-0">Skill Development</h2>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search skills..."
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md"
            />
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <button
            onClick={() => {
              setShowAddForm(true);
              setShowEditForm(false);
              setShowAssessmentForm(false);
            }}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            <Plus size={16} className="mr-1" />
            Add
          </button>
        </div>
      </div>
      
      {/* Child selector (if parent) */}
      {selectedUser && (selectedUser.role === 'parent' || selectedUser.relationship === 'parent') && children.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Child:</label>
          <div className="flex flex-wrap gap-2">
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setActiveChild(child.id)}
                className={`px-3 py-2 rounded-lg text-sm ${
                  activeChild === child.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {child.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Add/Edit Skill Form */}
      {(showAddForm || showEditForm) && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {showEditForm ? 'Edit Skill' : 'Add New Skill'}
            </h3>
            <button
              onClick={resetSkillForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleAddSkill}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity*
                </label>
                <select
                  name="activityId"
                  value={skillForm.activityId}
                  onChange={(e) => handleInputChange('skill', e)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  disabled={showEditForm}
                >
                  <option value="">Select an activity</option>
                  {activities.map(activity => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name} ({activity.participantName})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={skillForm.name}
                  onChange={(e) => handleInputChange('skill', e)}
                  placeholder="e.g. Forehand Stroke, Dribbling"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={skillForm.category}
                  onChange={(e) => handleInputChange('skill', e)}
                  placeholder="e.g. Technical, Physical, Musical"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={skillForm.description}
                  onChange={(e) => handleInputChange('skill', e)}
                  placeholder="Brief description of the skill"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Level
                </label>
                <input
                  type="number"
                  name="level"
                  value={skillForm.level}
                  onChange={(e) => handleInputChange('skill', e)}
                  min="1"
                  max={skillForm.targetLevel}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Level
                </label>
                <input
                  type="number"
                  name="targetLevel"
                  value={skillForm.targetLevel}
                  onChange={(e) => handleInputChange('skill', e)}
                  min={skillForm.level}
                  max="10"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress (%)
                </label>
                <input
                  type="number"
                  name="progress"
                  value={skillForm.progress}
                  onChange={(e) => handleInputChange('skill', e)}
                  min="0"
                  max="100"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={skillForm.notes}
                onChange={(e) => handleInputChange('skill', e)}
                rows={2}
                placeholder="Any additional notes about this skill..."
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetSkillForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md mr-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : (showEditForm ? 'Update' : 'Add')}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Record Assessment Form */}
      {showAssessmentForm && selectedSkill && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Record Assessment for {selectedSkill.name}
            </h3>
            <button
              onClick={resetAssessmentForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleRecordAssessment}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Level
                </label>
                <input
                  type="number"
                  name="level"
                  value={assessmentForm.level}
                  onChange={(e) => handleInputChange('assessment', e)}
                  min="1"
                  max={selectedSkill.targetLevel}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Previous: {selectedSkill.level} / Target: {selectedSkill.targetLevel}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress (%)
                </label>
                <input
                  type="number"
                  name="progress"
                  value={assessmentForm.progress}
                  onChange={(e) => handleInputChange('assessment', e)}
                  min="0"
                  max="100"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Previous: {selectedSkill.progress}%
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assessor
                </label>
                <input
                  type="text"
                  name="assessor"
                  value={assessmentForm.assessor}
                  onChange={(e) => handleInputChange('assessment', e)}
                  placeholder="Who performed this assessment?"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assessment Notes
              </label>
              <textarea
                name="notes"
                value={assessmentForm.notes}
                onChange={(e) => handleInputChange('assessment', e)}
                rows={2}
                placeholder="Notes about this assessment..."
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetAssessmentForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md mr-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Record Assessment'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* View controls */}
      <div className="mb-4 flex flex-wrap justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 text-sm rounded-md flex items-center ${
              viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Award size={16} className="mr-1" />
            List
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 text-sm rounded-md flex items-center ${
              viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart2 size={16} className="mr-1" />
            Grid
          </button>
          <button
            onClick={() => setViewMode('chart')}
            className={`p-2 text-sm rounded-md flex items-center ${
              viewMode === 'chart' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LineChart size={16} className="mr-1" />
            Chart
          </button>
        </div>
        
        <div className="flex items-center mt-2 sm:mt-0">
          <span className="text-sm text-gray-600 mr-2">Group by:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="category">Category</option>
            <option value="activity">Activity</option>
            <option value="level">Level</option>
            <option value="none">No Grouping</option>
          </select>
        </div>
      </div>
      
      {/* Skills List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredSkills.length === 0 ? (
        <EmptyStateMessage />
      ) : viewMode === 'list' ? (
        // List view
        groupBy === 'none' ? (
          <div className="space-y-4">
            {filteredSkills.map(skill => (
              <SkillCard key={skill.id} skill={skill} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {groupHeaders.map(header => (
              <div key={header}>
                <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-gray-200 pb-2">
                  {header}
                </h3>
                <div className="space-y-4">
                  {groupedSkills[header].map(skill => (
                    <SkillCard key={skill.id} skill={skill} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      ) : viewMode === 'grid' ? (
        // Grid view (simplified cards in a grid layout)
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map(skill => (
            <div key={skill.id} className="border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-gray-900">{skill.name}</h3>
                  <p className="text-xs text-gray-600">{skill.activityName}</p>
                </div>
                <div className="text-sm font-medium">
                  {skill.level}/{skill.targetLevel}
                </div>
              </div>
              <div className="mt-2 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600"
                  style={{ width: `${skill.progress || 0}%` }}
                ></div>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => handleRecordAssessmentClick(skill)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Assess
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Chart view (simplified visualization)
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Skill Progress</h3>
          <div className="h-64 flex items-end space-x-2">
            {filteredSkills.map(skill => (
              <div key={skill.id} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-600 rounded-t transition-all duration-500 cursor-pointer hover:bg-blue-700"
                  style={{ height: `${(skill.progress || 0) / 100 * 200}px` }}
                  onClick={() => handleRecordAssessmentClick(skill)}
                ></div>
                <div className="mt-2 text-xs text-gray-600 truncate w-full text-center" title={skill.name}>
                  {skill.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillTracker;