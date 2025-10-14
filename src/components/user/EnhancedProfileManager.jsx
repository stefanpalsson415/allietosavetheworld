import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useFamily } from '../../contexts/FamilyContext';
import FamilyProfileService, { PROFILE_ATTRIBUTES } from '../../services/FamilyProfileService';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Clipboard, CheckCircle, X, Edit2, Save, UserPlus, Search, Plus } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import QuantumKnowledgeGraph from '../../services/QuantumKnowledgeGraph';
import AIQuestionGenerator from '../../services/AIQuestionGenerator';
import AdaptiveLearningEngine from '../../services/AdaptiveLearningEngine';

// NotionMultiSelect Component - Mimics Notion's multi-select style
const NotionMultiSelect = ({ value = [], onChange, options = [], placeholder = 'Select...', allowCreate = true, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [localOptions, setLocalOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = localOptions.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase()) && !value.includes(opt)
  );

  const handleToggle = (option) => {
    if (value.includes(option)) {
      onChange(value.filter(v => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  const handleCreate = () => {
    if (search.trim() && !localOptions.includes(search.trim())) {
      const newOption = search.trim();
      setLocalOptions([...localOptions, newOption]);
      onChange([...value, newOption]);
      setSearch('');
    }
  };

  const handleRemove = (option, e) => {
    e.stopPropagation();
    onChange(value.filter(v => v !== option));
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div 
        className="w-full min-h-[42px] px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors bg-white flex items-center gap-2 flex-wrap"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
      >
        {value.length > 0 ? (
          <>
            {value.map(item => (
              <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md text-sm">
                <span className="capitalize">{item.replace('_', ' ')}</span>
                <button
                  className="hover:bg-indigo-200 rounded p-0.5 transition-colors"
                  onClick={(e) => handleRemove(item, e)}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-300"
                placeholder="Search or create..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && allowCreate && search.trim()) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {/* Selected items first */}
            {value.map(option => (
              <div
                key={option}
                className="px-3 py-2 text-sm bg-indigo-50 cursor-pointer transition-colors capitalize flex items-center justify-between group hover:bg-indigo-100"
                onClick={() => handleToggle(option)}
              >
                <span>{option.replace('_', ' ')}</span>
                <CheckCircle size={16} className="text-indigo-600" />
              </div>
            ))}
            
            {/* Available options */}
            {filteredOptions.map(option => (
              <div
                key={option}
                className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer transition-colors capitalize"
                onClick={() => handleToggle(option)}
              >
                {option.replace('_', ' ')}
              </div>
            ))}
            
            {allowCreate && search.trim() && !localOptions.includes(search.trim()) && (
              <div
                className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-100 flex items-center gap-2 text-gray-600"
                onClick={handleCreate}
              >
                <Plus size={14} />
                Create "{search.trim()}"
              </div>
            )}
            
            {filteredOptions.length === 0 && value.length === 0 && (!allowCreate || !search.trim()) && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// NotionSelect Component - Mimics Notion's select style
const NotionSelect = ({ value, onChange, options = [], placeholder = 'Select...', allowCreate = true, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [localOptions, setLocalOptions] = useState(options);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = localOptions.filter(opt => 
    opt.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearch('');
  };

  const handleCreate = () => {
    if (search.trim() && !localOptions.includes(search.trim())) {
      const newOption = search.trim();
      setLocalOptions([...localOptions, newOption]);
      handleSelect(newOption);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <div 
        className="w-full px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 transition-colors bg-white flex items-center justify-between group"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
      >
        {value ? (
          <div className="flex items-center justify-between w-full">
            <span className="text-gray-900 capitalize">{value.replace('_', ' ')}</span>
            <button
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-100 rounded"
              onClick={handleClear}
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-gray-300"
                placeholder="Search or create..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && allowCreate && search.trim()) {
                    e.preventDefault();
                    handleCreate();
                  }
                }}
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.map(option => (
              <div
                key={option}
                className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer transition-colors capitalize"
                onClick={() => handleSelect(option)}
              >
                {option.replace('_', ' ')}
              </div>
            ))}
            
            {allowCreate && search.trim() && !filteredOptions.includes(search.trim()) && (
              <div
                className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-100 flex items-center gap-2 text-gray-600"
                onClick={handleCreate}
              >
                <Plus size={14} />
                Create "{search.trim()}"
              </div>
            )}
            
            {filteredOptions.length === 0 && (!allowCreate || !search.trim()) && (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">
                No options found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * EnhancedProfileManager - Component for viewing and managing enhanced family profiles
 * 
 * This component provides a comprehensive UI for:
 * - Viewing detailed profile information for each family member
 * - Editing profile sections
 * - Adding new profile information
 * - Tracking profile completeness
 */
const EnhancedProfileManager = ({ memberId, onUpdate = null }) => {
  const { familyId, familyMembers } = useFamily();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileId, setProfileId] = useState(null);
  const [completeness, setCompleteness] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  // Start with all sections in edit mode by default
  const [editMode, setEditMode] = useState({
    basicInfo: true,
    preferences: true,
    schedulePatterns: true,
    taskPatterns: true,
    skillsInterests: true,
    goals: true,
    health: true
  });
  const [formData, setFormData] = useState({
    basicInfo: {},
    preferences: {},
    schedulePatterns: {},
    insights: {},
    lifestyle: {},
    health: {}
  });
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [saveTimeout, setSaveTimeout] = useState({});
  
  const member = familyMembers.find(m => m.id === memberId);
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && onUpdate) {
        onUpdate();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onUpdate]);
  
  // Load the member's enhanced profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!familyId || !memberId || !member) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Get family data to find profile ID
        const familyData = await FamilyProfileService.getFamilyProfiles(familyId);
        
        if (!familyData || !familyData[memberId]) {
          // No profile found, initialize one
          const profileIds = await FamilyProfileService.initializeProfiles(familyId, [member]);
          if (profileIds && profileIds[memberId]) {
            setProfileId(profileIds[memberId]);
            
            // Load the newly created profile
            const newProfile = await FamilyProfileService.getEnhancedProfile(profileIds[memberId]);
            if (newProfile) {
              setProfile(newProfile);
              setCompleteness(newProfile.base?.profileCompleteness || 0);
            }
          }
        } else {
          // Profile exists, load it
          setProfile(familyData[memberId]);
          setProfileId(familyData[memberId].base?.id);
          setCompleteness(familyData[memberId].base?.profileCompleteness || 0);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    // Only run if we have the required data
    if (familyId && memberId && member) {
      loadProfile();
    }
  }, [familyId, memberId, member]);
  
  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      const initialFormData = {
        basicInfo: { ...(profile.base || {}) },
        preferences: { ...(profile.preferences || {}) },
        schedulePatterns: { ...(profile.patterns?.schedule || {}) },
        taskPatterns: { ...(profile.patterns?.taskPerformance || {}) },
        communication: { ...(profile.patterns?.communication || {}) },
        lifestyle: { ...(profile.lifestyle || {}) },
        health: { ...(profile.lifestyle?.health || {}) },
        skillsInterests: { ...(profile.insights || {}) },
        insights: { ...(profile.insights || {}) },
        goals: Array.isArray(profile?.insights?.goals) ? [...profile.insights.goals] : [],
      };

      setFormData(initialFormData);
    } else {
      // If no profile, keep the default initialized structure
      setFormData({
        basicInfo: {},
        preferences: {},
        schedulePatterns: {},
        taskPatterns: {},
        communication: {},
        lifestyle: {},
        health: {},
        skillsInterests: {},
        insights: {},
        goals: []
      });
    }
  }, [profile]);
  
  // Toggle edit mode for a section
  const toggleEditMode = (section) => {
    setEditMode(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Handle form field changes with auto-save
  const handleChange = (section, field, value) => {
    // Update form data
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));

    // Clear any existing save timeout for this section
    if (saveTimeout[section]) {
      clearTimeout(saveTimeout[section]);
    }

    // Reset saved indicator
    setSaved(prev => ({ ...prev, [section]: false }));

    // Set a new timeout to auto-save after 1 second of no changes
    const timeout = setTimeout(() => {
      handleSave(section);
    }, 1000);

    setSaveTimeout(prev => ({ ...prev, [section]: timeout }));
  };
  
  // Auto-save function
  const handleSave = async (section) => {
    try {
      setSaving(prev => ({ ...prev, [section]: true }));
      setSaved(prev => ({ ...prev, [section]: false }));

      // Map section to profile attribute
      const attributeMap = {
        basicInfo: PROFILE_ATTRIBUTES.BASIC_INFO,
        preferences: PROFILE_ATTRIBUTES.PREFERENCES,
        schedulePatterns: PROFILE_ATTRIBUTES.SCHEDULE_PATTERNS,
        taskPatterns: 'taskPatterns',
        skillsInterests: PROFILE_ATTRIBUTES.SKILLS_INTERESTS,
        goals: PROFILE_ATTRIBUTES.GOALS,
        health: PROFILE_ATTRIBUTES.HEALTH
      };

      const profileAttribute = attributeMap[section];
      const data = formData[section];

      if (!profileId || !data) {
        console.error('Missing profile ID or data for section:', section);
        setSaving(prev => ({ ...prev, [section]: false }));
        return;
      }

      // Update the profile section
      await FamilyProfileService.updateProfileSection(profileId, profileAttribute, data);

      // Update local state to show saved
      setSaving(prev => ({ ...prev, [section]: false }));
      setSaved(prev => ({ ...prev, [section]: true }));

      // Clear saved indicator after 3 seconds
      setTimeout(() => {
        setSaved(prev => ({ ...prev, [section]: false }));
      }, 3000);

      // Reload profile to update completeness
      const updatedProfile = await FamilyProfileService.getEnhancedProfile(profileId);
      setProfile(updatedProfile);
      setCompleteness(updatedProfile.base.profileCompleteness || 0);

      // Notify parent component if needed
      if (onUpdate) {
        onUpdate(updatedProfile);
      }
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      setSaving(prev => ({ ...prev, [section]: false }));
      setError(`Failed to save ${section}: ${error.message}`);
    }
  };

  // Handle saving a section (kept for compatibility with Save buttons)
  const handleSaveSection = async (section) => {
    try {
      setError(null);
      
      // Determine which profile attribute to update based on section
      let profileAttribute;
      let data;
      
      switch (section) {
        case 'basicInfo':
          profileAttribute = PROFILE_ATTRIBUTES.BASIC_INFO;
          data = formData.basicInfo;
          break;
        case 'preferences':
          profileAttribute = PROFILE_ATTRIBUTES.PREFERENCES;
          data = formData.preferences;
          break;
        case 'schedulePatterns':
          profileAttribute = PROFILE_ATTRIBUTES.SCHEDULE_PATTERNS;
          data = { schedule: formData.schedulePatterns };
          break;
        case 'taskPatterns':
          profileAttribute = PROFILE_ATTRIBUTES.SCHEDULE_PATTERNS;
          data = { taskPerformance: formData.taskPatterns };
          break;
        case 'communication':
          profileAttribute = PROFILE_ATTRIBUTES.SCHEDULE_PATTERNS;
          data = { communication: formData.communication };
          break;
        case 'health':
          profileAttribute = PROFILE_ATTRIBUTES.HEALTH;
          data = { health: formData.health };
          break;
        case 'skillsInterests':
          profileAttribute = PROFILE_ATTRIBUTES.SKILLS_INTERESTS;
          data = formData.skillsInterests;
          break;
        case 'goals':
          profileAttribute = PROFILE_ATTRIBUTES.GOALS;
          data = { goals: formData.goals };
          break;
        default:
          throw new Error(`Unknown section: ${section}`);
      }
      
      // Update the profile section
      await FamilyProfileService.updateProfileSection(profileId, profileAttribute, data);
      
      // Reload the profile to get updated data
      const updatedProfile = await FamilyProfileService.getEnhancedProfile(profileId);
      setProfile(updatedProfile);
      setCompleteness(updatedProfile.base.profileCompleteness || 0);
      
      // Integrate with AI services
      try {
        // Update Quantum Knowledge Graph
        await QuantumKnowledgeGraph.updateMemberProfile(memberId, data);
        
        // Update AI Question Generator context
        await AIQuestionGenerator.updateUserContext(memberId, data);
        
        // Process with Adaptive Learning Engine
        await AdaptiveLearningEngine.processProfileUpdate(memberId, data);
      } catch (integrationError) {
        console.error('Error updating AI services:', integrationError);
        // Continue anyway - don't block the UI update
      }
      
      // Exit edit mode
      toggleEditMode(section);
      
      // Notify parent component if needed
      if (onUpdate) {
        onUpdate(updatedProfile);
      }
    } catch (err) {
      console.error('Error saving profile section:', err);
      setError('Failed to save changes. Please try again.');
    }
  };
  
  // Add a new skill/interest
  const handleAddSkill = (skill) => {
    if (!skill.trim()) return;
    
    const updatedSkills = [
      ...(formData.skillsInterests.skills || []),
      skill.trim()
    ];
    
    handleChange('skillsInterests', 'skills', updatedSkills);
  };
  
  // Add a new goal
  const handleAddGoal = (goal) => {
    if (!goal.trim()) return;
    
    const newGoal = {
      id: `goal-${Date.now()}`,
      content: goal.trim(),
      created: new Date().toISOString(),
      status: 'active'
    };
    
    const updatedGoals = [
      ...(formData.goals || []),
      newGoal
    ];
    
    setFormData(prev => ({
      ...prev,
      goals: updatedGoals
    }));
  };
  
  // Remove a skill
  const handleRemoveSkill = (index) => {
    const updatedSkills = [...formData.skillsInterests.skills];
    updatedSkills.splice(index, 1);
    handleChange('skillsInterests', 'skills', updatedSkills);
  };
  
  // Remove a goal
  const handleRemoveGoal = (goalId) => {
    const updatedGoals = formData.goals.filter(goal => goal.id !== goalId);
    setFormData(prev => ({
      ...prev,
      goals: updatedGoals
    }));
  };
  
  if (loading || !profile) {
    return <div className="p-4 bg-white rounded-lg shadow-md">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-lg shadow-md">
        {error}
        <button
          className="ml-4 px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200"
          onClick={() => setError(null)}
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="p-4 bg-white rounded-lg shadow-md">
        <p>No profile found for this family member.</p>
        <button
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => FamilyProfileService.initializeProfiles(familyId, [member])}
        >
          Create Profile
        </button>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
      {/* Invisible backdrop for clicking outside */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={(e) => {
          // Only close if clicking the backdrop, not content
          if (e.target === e.currentTarget && onUpdate) {
            onUpdate();
          }
        }}
      />
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative z-10">
        {/* Modern Profile Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          {/* Close button */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              if (onUpdate) {
                onUpdate();
              }
            }}
            className="absolute top-4 right-4 p-2 bg-white hover:bg-gray-100 rounded-lg transition-colors shadow-md z-[100]"
            type="button"
            aria-label="Close profile builder"
          >
            <X size={20} className="text-gray-700" />
          </button>
          
          <div className="flex items-center gap-6">
            {/* Profile Image */}
            <div className="relative">
              <UserAvatar 
                user={member}
                size="lg"
                className="w-24 h-24 rounded-2xl ring-4 ring-white ring-opacity-30"
              />
              <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-lg shadow-lg text-gray-700 hover:bg-gray-100 transition-colors">
                <Edit2 size={14} />
              </button>
            </div>
            
            {/* Profile Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{member.name}</h2>
              <p className="text-indigo-100 capitalize mb-4">{member.role}</p>
              
              {/* Progress indicator */}
              <div className="max-w-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-indigo-100">Profile Completeness</span>
                  <span className="text-sm font-semibold">{completeness}%</span>
                </div>
                <div className="w-full h-2 bg-white bg-opacity-20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Modern Tabs */}
        <Tabs 
          selectedIndex={activeTab} 
          onSelect={index => setActiveTab(index)}
          className=""
        >
          <TabList className="flex px-6 pt-6 pb-0 gap-1 border-b border-gray-200 overflow-x-auto">
            <Tab className="px-4 py-2.5 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap rounded-t-lg" selectedClassName="bg-gray-100 text-gray-900 border-b-2 border-indigo-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                Basic Info
              </div>
            </Tab>
            <Tab className="px-4 py-2.5 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap rounded-t-lg" selectedClassName="bg-gray-100 text-gray-900 border-b-2 border-indigo-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                Preferences
              </div>
            </Tab>
            <Tab className="px-4 py-2.5 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap rounded-t-lg" selectedClassName="bg-gray-100 text-gray-900 border-b-2 border-indigo-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                Schedule
              </div>
            </Tab>
            <Tab className="px-4 py-2.5 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap rounded-t-lg" selectedClassName="bg-gray-100 text-gray-900 border-b-2 border-indigo-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Tasks
              </div>
            </Tab>
            <Tab className="px-4 py-2.5 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap rounded-t-lg" selectedClassName="bg-gray-100 text-gray-900 border-b-2 border-indigo-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                Skills
              </div>
            </Tab>
            <Tab className="px-4 py-2.5 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap rounded-t-lg" selectedClassName="bg-gray-100 text-gray-900 border-b-2 border-indigo-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                Goals
              </div>
            </Tab>
            <Tab className="px-4 py-2.5 cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap rounded-t-lg" selectedClassName="bg-gray-100 text-gray-900 border-b-2 border-indigo-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                Health
              </div>
            </Tab>
          </TabList>
        
          {/* Basic Info Tab - Modern Design */}
          <TabPanel>
            <div className="p-6 max-h-[calc(90vh-280px)] overflow-y-auto">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                    <p className="text-sm text-gray-600 mt-1">Personal details and preferences</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {saving.basicInfo ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                        Saving...
                      </span>
                    ) : saved.basicInfo ? (
                      <span className="flex items-center gap-2 text-green-600">
                        <CheckCircle size={16} />
                        Saved
                      </span>
                    ) : null}
                  </div>
                </div>
            
                {/* Always show editable fields */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Enter full name"
                            value={formData.basicInfo?.name || ''}
                            onChange={(e) => handleChange('basicInfo', 'name', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nickname</label>
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            placeholder="Preferred nickname"
                            value={formData.basicInfo?.nickname || ''}
                            onChange={(e) => handleChange('basicInfo', 'nickname', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                        rows={4}
                        placeholder="Tell us a bit about yourself..."
                        value={formData.basicInfo?.bio || ''}
                        onChange={(e) => handleChange('basicInfo', 'bio', e.target.value)}
                      />
                      <p className="mt-1 text-xs text-gray-500">A brief description to help Allie understand preferences and personality</p>
                    </div>
                </div>
            </div>
          </div>
        </TabPanel>
        
        {/* Preferences Tab */}
        <TabPanel>
          <div className="p-6 max-h-[calc(90vh-280px)] overflow-y-auto">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Personal Preferences</h3>
                  <p className="text-sm text-gray-600 mt-1">Communication, decision-making, and work styles</p>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    editMode.preferences 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  onClick={() => toggleEditMode('preferences')}
                >
                  {editMode.preferences ? (
                    <>
                      <X size={16} /> Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 size={16} /> Edit
                    </>
                  )}
                </button>
              </div>
            
            {editMode.preferences ? (
              // Edit mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Communication Style</label>
                    <NotionSelect
                      value={formData.preferences?.communicationStyle || ''}
                      onChange={(value) => handleChange('preferences', 'communicationStyle', value)}
                      options={['direct', 'supportive', 'analytical', 'expressive']}
                      placeholder="Select communication style..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Decision Making Style</label>
                    <NotionSelect
                      value={formData.preferences?.decisionMakingStyle || ''}
                      onChange={(value) => handleChange('preferences', 'decisionMakingStyle', value)}
                      options={['logical', 'intuitive', 'collaborative', 'decisive']}
                      placeholder="Select decision style..."
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Learning Style</label>
                    <NotionSelect
                      value={formData.preferences?.learningStyle || ''}
                      onChange={(value) => handleChange('preferences', 'learningStyle', value)}
                      options={['visual', 'auditory', 'reading', 'kinesthetic']}
                      placeholder="Select learning style..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Management Style</label>
                    <NotionSelect
                      value={formData.preferences?.timeManagementStyle || ''}
                      onChange={(value) => handleChange('preferences', 'timeManagementStyle', value)}
                      options={['planner', 'prioritizer', 'flexible', 'last_minute']}
                      placeholder="Select time management style..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivation Factors</label>
                  <NotionMultiSelect
                    value={formData.preferences?.motivationFactors || []}
                    onChange={(value) => handleChange('preferences', 'motivationFactors', value)}
                    options={['achievement', 'recognition', 'responsibility', 'growth', 'connection', 'security', 'autonomy', 'mastery', 'purpose', 'competition', 'collaboration']}
                    placeholder="Select motivation factors..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stress Responses</label>
                  <NotionSelect
                    value={formData.preferences?.stressResponses || ''}
                    onChange={(value) => handleChange('preferences', 'stressResponses', value)}
                    options={['fight', 'flight', 'freeze', 'fawn']}
                    placeholder="Select stress response..."
                  />
                </div>
                
                {member.role === 'parent' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parenting Style</label>
                    <NotionSelect
                      value={formData.preferences.parenting?.style || ''}
                      onChange={(value) => {
                        const updated = {
                          ...(formData.preferences.parenting || {}),
                          style: value
                        };
                        handleChange('preferences', 'parenting', updated);
                      }}
                      options={['authoritative', 'authoritarian', 'permissive', 'uninvolved']}
                      placeholder="Select parenting style..."
                    />
                  </div>
                )}
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                    onClick={() => toggleEditMode('preferences')}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors flex items-center gap-2"
                    onClick={() => handleSaveSection('preferences')}
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              // View mode - Modern Cards
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600">💬</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Communication Style</div>
                        <div className="font-medium text-gray-900 capitalize">{profile.preferences?.communicationStyle || 'Not set'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600">🧠</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Decision Making</div>
                        <div className="font-medium text-gray-900 capitalize">{profile.preferences?.decisionMakingStyle || 'Not set'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600">📚</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Learning Style</div>
                        <div className="font-medium text-gray-900 capitalize">{profile.preferences?.learningStyle || 'Not set'}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span className="text-yellow-600">⏰</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Time Management</div>
                        <div className="font-medium text-gray-900 capitalize">
                          {profile.preferences?.timeManagementStyle?.replace('_', ' ') || 'Not set'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-600">✨</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Motivation Factors</div>
                      <div className="flex flex-wrap gap-2">
                        {profile.preferences?.motivationFactors?.length > 0 ? (
                          profile.preferences.motivationFactors.map(factor => (
                            <span key={factor} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium capitalize">
                              {factor}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No motivation factors specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <span className="text-red-600">🛡️</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Stress Response</div>
                        <div className="font-medium text-gray-900 capitalize">{profile.preferences?.stressResponses || 'Not set'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {member.role === 'parent' && (
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <span className="text-orange-600">👨‍👩‍👧‍👦</span>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 uppercase tracking-wider">Parenting Style</div>
                          <div className="font-medium text-gray-900 capitalize">{profile.preferences?.parenting?.style || 'Not set'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            </div>
          </div>
        </TabPanel>
        
        {/* Schedule Tab */}
        <TabPanel>
          <div className="p-6 max-h-[calc(90vh-280px)] overflow-y-auto">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Schedule Patterns</h3>
                  <p className="text-sm text-gray-600 mt-1">Daily routines and common activities</p>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    editMode.schedulePatterns 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  onClick={() => toggleEditMode('schedulePatterns')}
                >
                  {editMode.schedulePatterns ? (
                    <>
                      <X size={16} /> Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 size={16} /> Edit
                    </>
                  )}
                </button>
              </div>
            
            {editMode.schedulePatterns ? (
              // Edit mode - Notion Style
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Common Activities</label>
                  <NotionMultiSelect
                    value={formData.schedulePatterns?.commonActivities || []}
                    onChange={(value) => handleChange('schedulePatterns', 'commonActivities', value)}
                    options={[
                      'School', 'Work', 'Sports', 'Music lessons', 'Art class', 
                      'Dance', 'Swimming', 'Soccer', 'Basketball', 'Piano',
                      'Homework', 'Reading', 'Gaming', 'TV time', 'Family dinner',
                      'Playtime', 'Nap time', 'Study group', 'Tutoring', 'Gym'
                    ]}
                    placeholder="Select or add activities..."
                    allowCreate={true}
                  />
                  <p className="mt-1 text-xs text-gray-500">Add regular activities to help Allie understand daily routines</p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                        <span className="text-blue-600 text-xs">☀️</span>
                      </div>
                      Weekday Schedule
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Wake Time</label>
                        <div className="relative">
                          <input
                            type="time"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            value={formData.schedulePatterns?.weekdayPatterns?.wakeTime || ''}
                            onChange={(e) => {
                              const updated = {
                                ...(formData.schedulePatterns?.weekdayPatterns || {}),
                                wakeTime: e.target.value
                              };
                              handleChange('schedulePatterns', 'weekdayPatterns', updated);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bedtime</label>
                        <div className="relative">
                          <input
                            type="time"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            value={formData.schedulePatterns?.weekdayPatterns?.bedTime || ''}
                            onChange={(e) => {
                              const updated = {
                                ...(formData.schedulePatterns?.weekdayPatterns || {}),
                                bedTime: e.target.value
                              };
                              handleChange('schedulePatterns', 'weekdayPatterns', updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                        <span className="text-purple-600 text-xs">🌙</span>
                      </div>
                      Weekend Schedule
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Wake Time</label>
                        <div className="relative">
                          <input
                            type="time"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            value={formData.schedulePatterns?.weekendPatterns?.wakeTime || ''}
                            onChange={(e) => {
                              const updated = {
                                ...(formData.schedulePatterns?.weekendPatterns || {}),
                                wakeTime: e.target.value
                              };
                              handleChange('schedulePatterns', 'weekendPatterns', updated);
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bedtime</label>
                        <div className="relative">
                          <input
                            type="time"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                            value={formData.schedulePatterns?.weekendPatterns?.bedTime || ''}
                            onChange={(e) => {
                              const updated = {
                                ...(formData.schedulePatterns?.weekendPatterns || {}),
                                bedTime: e.target.value
                              };
                              handleChange('schedulePatterns', 'weekendPatterns', updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                    onClick={() => toggleEditMode('schedulePatterns')}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors flex items-center gap-2"
                    onClick={() => handleSaveSection('schedulePatterns')}
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              // View mode - Notion Style
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600">📅</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Common Activities</div>
                      <div className="flex flex-wrap gap-2">
                        {profile.patterns?.schedule?.commonActivities?.length > 0 ? (
                          profile.patterns.schedule.commonActivities.map((activity, index) => (
                            <span key={index} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              {activity}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No common activities recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <span className="text-yellow-600">☀️</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Weekday Schedule</div>
                      </div>
                    </div>
                    <div className="space-y-2 pl-10">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Wake:</span>
                        <span className="font-medium text-gray-900">
                          {profile.patterns?.schedule?.weekdayPatterns?.wakeTime || 'Not set'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Sleep:</span>
                        <span className="font-medium text-gray-900">
                          {profile.patterns?.schedule?.weekdayPatterns?.bedTime || 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600">🌙</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Weekend Schedule</div>
                      </div>
                    </div>
                    <div className="space-y-2 pl-10">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Wake:</span>
                        <span className="font-medium text-gray-900">
                          {profile.patterns?.schedule?.weekendPatterns?.wakeTime || 'Not set'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Sleep:</span>
                        <span className="font-medium text-gray-900">
                          {profile.patterns?.schedule?.weekendPatterns?.bedTime || 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 italic flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">💡</span>
                    Schedule patterns help Allie make better suggestions for family activities and task assignments based on availability.
                  </p>
                </div>
              </div>
            )}
            </div>
          </div>
        </TabPanel>
        
        {/* Tasks Tab */}
        <TabPanel>
          <div className="p-6 max-h-[calc(90vh-280px)] overflow-y-auto">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Task Preferences</h3>
                  <p className="text-sm text-gray-600 mt-1">Work style and task preferences</p>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    editMode.taskPatterns 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  onClick={() => toggleEditMode('taskPatterns')}
                >
                  {editMode.taskPatterns ? (
                    <>
                      <X size={16} /> Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 size={16} /> Edit
                    </>
                  )}
                </button>
              </div>
            
            {editMode.taskPatterns ? (
              // Edit mode - Notion Style
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Task Types</label>
                  <NotionMultiSelect
                    value={formData.taskPatterns.preferredTasks || []}
                    onChange={(value) => handleChange('taskPatterns', 'preferredTasks', value)}
                    options={[
                      'Organizing', 'Cleaning', 'Cooking', 'Shopping', 'Planning',
                      'Outdoor tasks', 'Creative tasks', 'Technical tasks', 'Administrative',
                      'Teaching', 'Physical labor', 'Research', 'Communication',
                      'Problem solving', 'Design', 'Writing', 'Analysis'
                    ]}
                    placeholder="Select tasks you enjoy..."
                    allowCreate={true}
                  />
                  <p className="mt-1 text-xs text-gray-500">Tasks you generally enjoy or are good at</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tasks to Avoid</label>
                  <NotionMultiSelect
                    value={formData.taskPatterns.avoidedTasks || []}
                    onChange={(value) => handleChange('taskPatterns', 'avoidedTasks', value)}
                    options={[
                      'Heavy lifting', 'Phone calls', 'Paperwork', 'Driving',
                      'Public speaking', 'Detailed work', 'Repetitive tasks',
                      'Time-sensitive tasks', 'Group coordination', 'Budgeting'
                    ]}
                    placeholder="Select tasks you prefer to avoid..."
                    allowCreate={true}
                  />
                  <p className="mt-1 text-xs text-gray-500">Tasks that are challenging or less preferred</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Working Hours</label>
                    <NotionSelect
                      value={formData.taskPatterns.preferredWorkingHours || ''}
                      onChange={(value) => handleChange('taskPatterns', 'preferredWorkingHours', value)}
                      options={[
                        'early_morning',
                        'morning',
                        'afternoon',
                        'evening',
                        'night',
                        'flexible'
                      ]}
                      placeholder="Select preferred time..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Work Environment</label>
                    <NotionSelect
                      value={formData.taskPatterns.workEnvironment || ''}
                      onChange={(value) => handleChange('taskPatterns', 'workEnvironment', value)}
                      options={[
                        'quiet_focused',
                        'collaborative',
                        'background_music',
                        'outdoors',
                        'flexible'
                      ]}
                      placeholder="Select environment..."
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Completion Style</label>
                  <NotionSelect
                    value={formData.taskPatterns.completionStyle || ''}
                    onChange={(value) => handleChange('taskPatterns', 'completionStyle', value)}
                    options={[
                      'one_at_a_time',
                      'multitasking',
                      'batch_similar',
                      'deadline_driven',
                      'priority_based'
                    ]}
                    placeholder="Select your style..."
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                    onClick={() => toggleEditMode('taskPatterns')}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors flex items-center gap-2"
                    onClick={() => handleSaveSection('taskPatterns')}
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              // View mode - Notion Style
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600">✓</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Preferred Tasks</div>
                      <div className="flex flex-wrap gap-2">
                        {profile.patterns?.taskPerformance?.preferredTasks?.length > 0 ? (
                          profile.patterns.taskPerformance.preferredTasks.map((task, index) => (
                            <span key={index} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              {task}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No preferred tasks recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600">✗</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Tasks to Avoid</div>
                      <div className="flex flex-wrap gap-2">
                        {profile.patterns?.taskPerformance?.avoidedTasks?.length > 0 ? (
                          profile.patterns.taskPerformance.avoidedTasks.map((task, index) => (
                            <span key={index} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                              {task}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No avoided tasks recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600">⏰</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Working Hours</div>
                        <div className="font-medium text-gray-900 capitalize">
                          {profile.patterns?.taskPerformance?.preferredWorkingHours?.replace('_', ' ') || 'Not set'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <span className="text-purple-600">🏢</span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider">Environment</div>
                        <div className="font-medium text-gray-900 capitalize">
                          {profile.patterns?.taskPerformance?.workEnvironment?.replace('_', ' ') || 'Not set'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-600">📋</span>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider">Completion Style</div>
                      <div className="font-medium text-gray-900 capitalize">
                        {profile.patterns?.taskPerformance?.completionStyle?.replace('_', ' ') || 'Not set'}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 italic flex items-start gap-2">
                    <span className="text-green-600 mt-0.5">💡</span>
                    Task preferences help Allie make fair and suitable task assignments based on everyone's strengths and preferences.
                  </p>
                </div>
              </div>
            )}
            </div>
          </div>
        </TabPanel>
        
        {/* Skills & Interests Tab */}
        <TabPanel>
          <div className="p-6 max-h-[calc(90vh-280px)] overflow-y-auto">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Skills & Interests</h3>
                  <p className="text-sm text-gray-600 mt-1">Abilities, strengths, and areas of interest</p>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    editMode.skillsInterests 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  onClick={() => toggleEditMode('skillsInterests')}
                >
                  {editMode.skillsInterests ? (
                    <>
                      <X size={16} /> Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 size={16} /> Edit
                    </>
                  )}
                </button>
              </div>
            
            {editMode.skillsInterests ? (
              // Edit mode - Notion Style
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technical Skills</label>
                  <NotionMultiSelect
                    value={formData.skillsInterests.technicalSkills || []}
                    onChange={(value) => handleChange('skillsInterests', 'technicalSkills', value)}
                    options={[
                      'Programming', 'Data Analysis', 'Design', 'Marketing', 'Sales',
                      'Writing', 'Teaching', 'Research', 'Engineering', 'Finance',
                      'Project Management', 'Photography', 'Video Editing', 'Web Development',
                      'Mobile Development', 'Database Management', 'Cloud Computing'
                    ]}
                    placeholder="Select or add technical skills..."
                    allowCreate={true}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Soft Skills</label>
                  <NotionMultiSelect
                    value={formData.skillsInterests.softSkills || []}
                    onChange={(value) => handleChange('skillsInterests', 'softSkills', value)}
                    options={[
                      'Leadership', 'Communication', 'Problem Solving', 'Creativity',
                      'Time Management', 'Adaptability', 'Teamwork', 'Critical Thinking',
                      'Emotional Intelligence', 'Conflict Resolution', 'Negotiation',
                      'Public Speaking', 'Active Listening', 'Mentoring', 'Empathy'
                    ]}
                    placeholder="Select or add soft skills..."
                    allowCreate={true}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interests & Hobbies</label>
                  <NotionMultiSelect
                    value={formData.skillsInterests.interests || []}
                    onChange={(value) => handleChange('skillsInterests', 'interests', value)}
                    options={[
                      'Reading', 'Sports', 'Music', 'Art', 'Cooking', 'Travel',
                      'Gaming', 'Gardening', 'DIY Projects', 'Fitness', 'Movies',
                      'Technology', 'Fashion', 'Nature', 'Volunteering', 'Collecting',
                      'Photography', 'Podcasts', 'Board Games', 'Meditation'
                    ]}
                    placeholder="Select or add interests..."
                    allowCreate={true}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Key Strengths</label>
                  <NotionMultiSelect
                    value={formData.skillsInterests.strengths || []}
                    onChange={(value) => handleChange('skillsInterests', 'strengths', value)}
                    options={[
                      'Detail-oriented', 'Big picture thinking', 'Fast learner',
                      'Self-motivated', 'Reliable', 'Innovative', 'Patient',
                      'Organized', 'Flexible', 'Persistent', 'Collaborative',
                      'Results-driven', 'Analytical', 'Creative problem solver'
                    ]}
                    placeholder="Select or add strengths..."
                    allowCreate={true}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Areas for Growth</label>
                  <NotionMultiSelect
                    value={formData.skillsInterests.challenges || []}
                    onChange={(value) => handleChange('skillsInterests', 'challenges', value)}
                    options={[
                      'Time management', 'Public speaking', 'Delegation',
                      'Attention to detail', 'Patience', 'Technical skills',
                      'Communication', 'Organization', 'Stress management',
                      'Conflict resolution', 'Decision making', 'Networking'
                    ]}
                    placeholder="Select or add areas for growth..."
                    allowCreate={true}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                    onClick={() => toggleEditMode('skillsInterests')}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors flex items-center gap-2"
                    onClick={() => handleSaveSection('skillsInterests')}
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              // View mode - Notion Style
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600">💻</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Technical Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {profile.insights?.technicalSkills?.length > 0 ? (
                          profile.insights.technicalSkills.map((skill, index) => (
                            <span key={index} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                              {skill}
                            </span>
                          ))
                        ) : profile.insights?.skills?.length > 0 ? (
                          profile.insights.skills.map((skill, index) => (
                            <span key={index} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No technical skills recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600">🤝</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Soft Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {profile.insights?.softSkills?.length > 0 ? (
                          profile.insights.softSkills.map((skill, index) => (
                            <span key={index} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No soft skills recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-yellow-600">⭐</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Interests & Hobbies</div>
                      <div className="flex flex-wrap gap-2">
                        {profile.insights?.interests?.length > 0 ? (
                          profile.insights.interests.map((interest, index) => (
                            <span key={index} className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                              {interest}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No interests recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600">💪</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Key Strengths</div>
                        <div className="space-y-1">
                          {profile.insights?.strengths?.length > 0 ? (
                            profile.insights.strengths.map((strength, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                <span className="text-sm text-gray-700">{strength}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">No strengths recorded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-orange-600">🌱</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Areas for Growth</div>
                        <div className="space-y-1">
                          {profile.insights?.challenges?.length > 0 ? (
                            profile.insights.challenges.map((challenge, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                                <span className="text-sm text-gray-700">{challenge}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">No areas for growth recorded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800 italic flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">💡</span>
                    Skills and interests help Allie suggest relevant activities, learning opportunities, and match tasks to abilities.
                  </p>
                </div>
              </div>
            )}
            </div>
          </div>
        </TabPanel>
        
        {/* Goals Tab */}
        <TabPanel>
          <div className="p-6 max-h-[calc(90vh-280px)] overflow-y-auto">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Personal Goals</h3>
                  <p className="text-sm text-gray-600 mt-1">Track personal, family, and professional aspirations</p>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    editMode.goals 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  onClick={() => toggleEditMode('goals')}
                >
                  {editMode.goals ? (
                    <>
                      <X size={16} /> Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 size={16} /> Edit
                    </>
                  )}
                </button>
              </div>
            
            {editMode.goals ? (
              // Edit mode - Notion Style
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Add New Goal</label>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        className="flex-grow px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        placeholder="Enter a goal..."
                        value={formData.newGoal || ''}
                        onChange={(e) => setFormData({...formData, newGoal: e.target.value})}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && formData.newGoal?.trim()) {
                            e.preventDefault();
                            handleAddGoal(formData.newGoal);
                            setFormData({...formData, newGoal: ''});
                          }
                        }}
                      />
                      <button
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 font-medium text-sm transition-colors flex items-center gap-2"
                        onClick={() => {
                          if (formData.newGoal?.trim()) {
                            handleAddGoal(formData.newGoal);
                            setFormData({...formData, newGoal: ''});
                          }
                        }}
                      >
                        <Plus size={16} /> Add Goal
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <NotionSelect
                        value={formData.goalCategory || ''}
                        onChange={(value) => setFormData({...formData, goalCategory: value})}
                        options={['personal', 'family', 'professional', 'health', 'education', 'financial']}
                        placeholder="Select category..."
                        className="w-48"
                      />
                      <NotionSelect
                        value={formData.goalTimeframe || ''}
                        onChange={(value) => setFormData({...formData, goalTimeframe: value})}
                        options={['short_term', 'medium_term', 'long_term']}
                        placeholder="Select timeframe..."
                        className="w-48"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Current Goals</label>
                  
                  {formData.goals?.length > 0 ? (
                    <div className="space-y-3">
                      {formData.goals.map((goal) => (
                        <div key={goal.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                          <div className="flex items-start gap-3">
                            <button
                              className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                goal.status === 'completed' 
                                  ? 'bg-green-500 border-green-500' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                              onClick={() => {
                                const updatedGoals = formData.goals.map(g => 
                                  g.id === goal.id 
                                    ? { ...g, status: g.status === 'completed' ? 'active' : 'completed' }
                                    : g
                                );
                                setFormData(prev => ({ ...prev, goals: updatedGoals }));
                              }}
                            >
                              {goal.status === 'completed' && (
                                <CheckCircle size={14} className="text-white" />
                              )}
                            </button>
                            <div className="flex-grow">
                              <div className={`text-gray-900 ${goal.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                                {goal.content}
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs text-gray-500">
                                  Added {new Date(goal.created).toLocaleDateString()}
                                </span>
                                {goal.category && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                                    {goal.category.replace('_', ' ')}
                                  </span>
                                )}
                                {goal.timeframe && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full capitalize">
                                    {goal.timeframe.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                              onClick={() => handleRemoveGoal(goal.id)}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-dashed border-gray-300 p-8">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                          <span className="text-gray-400 text-xl">🎯</span>
                        </div>
                        <div className="text-gray-500 font-medium">No goals added yet</div>
                        <div className="text-sm text-gray-400 mt-1">
                          Start by adding personal, family, or professional goals above
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                    onClick={() => toggleEditMode('goals')}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors flex items-center gap-2"
                    onClick={() => handleSaveSection('goals')}
                  >
                    <Save size={16} /> Save Goals
                  </button>
                </div>
              </div>
            ) : (
              // View mode - Notion Style
              <div className="space-y-4">
                {profile.insights?.goals?.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            <span className="text-green-600">✓</span>
                          </div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">Completed</span>
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">
                          {profile?.insights?.goals?.filter(g => g.status === 'completed').length || 0}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                            <span className="text-blue-600">⚡</span>
                          </div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">Active</span>
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">
                          {profile?.insights?.goals?.filter(g => g.status !== 'completed').length || 0}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                            <span className="text-purple-600">🎯</span>
                          </div>
                          <span className="text-xs text-gray-500 uppercase tracking-wider">Total</span>
                        </div>
                        <div className="text-2xl font-semibold text-gray-900">
                          {profile?.insights?.goals?.length || 0}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {profile?.insights?.goals?.map((goal) => (
                        <div key={goal.id} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {goal.status === 'completed' ? (
                                <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                                  <CheckCircle size={14} className="text-white" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-300 rounded"></div>
                              )}
                            </div>
                            <div className="flex-grow">
                              <div className={`text-gray-900 ${goal.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                                {goal.content}
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs text-gray-500">
                                  {new Date(goal.created).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </span>
                                {goal.category && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                                    {goal.category.replace('_', ' ')}
                                  </span>
                                )}
                                {goal.timeframe && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full capitalize">
                                    {goal.timeframe.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-lg border border-dashed border-gray-300 p-12">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <span className="text-gray-400 text-3xl">🎯</span>
                      </div>
                      <div className="text-gray-500 font-medium text-lg">No goals recorded yet</div>
                      <div className="text-sm text-gray-400 mt-2">
                        Click Edit to start adding personal, family, or professional goals
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-sm text-orange-800 italic flex items-start gap-2">
                    <span className="text-orange-600 mt-0.5">💡</span>
                    Goals help Allie provide personalized support and track progress toward what matters most to you.
                  </p>
                </div>
              </div>
            )}
            </div>
          </div>
        </TabPanel>
        
        {/* Health Tab */}
        <TabPanel>
          <div className="p-6 max-h-[calc(90vh-280px)] overflow-y-auto">
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Health Information</h3>
                  <p className="text-sm text-gray-600 mt-1">Important health details for better family planning</p>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                    editMode.health 
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  onClick={() => toggleEditMode('health')}
                >
                  {editMode.health ? (
                    <>
                      <X size={16} /> Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 size={16} /> Edit
                    </>
                  )}
                </button>
              </div>
            
            {editMode.health ? (
              // Edit mode - Notion Style
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
                  <NotionMultiSelect
                    value={formData.health?.allergies?.split(',').map(a => a.trim()).filter(Boolean) || []}
                    onChange={(value) => handleChange('health', 'allergies', value.join(', '))}
                    options={[
                      'Peanuts', 'Tree nuts', 'Milk', 'Eggs', 'Wheat', 'Soy',
                      'Fish', 'Shellfish', 'Sesame', 'Latex', 'Penicillin',
                      'Bee stings', 'Pollen', 'Dust mites', 'Pet dander'
                    ]}
                    placeholder="Select or add allergies..."
                    allowCreate={true}
                  />
                  <p className="mt-1 text-xs text-gray-500">Important for meal planning and activity suggestions</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Preferences</label>
                  <NotionMultiSelect
                    value={formData.health?.dietaryRestrictions?.split(',').map(d => d.trim()).filter(Boolean) || []}
                    onChange={(value) => handleChange('health', 'dietaryRestrictions', value.join(', '))}
                    options={[
                      'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free',
                      'Kosher', 'Halal', 'Low sodium', 'Diabetic-friendly',
                      'Keto', 'Paleo', 'Low FODMAP', 'Nut-free'
                    ]}
                    placeholder="Select dietary preferences..."
                    allowCreate={true}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
                  <NotionMultiSelect
                    value={formData.health?.conditions?.split(',').map(c => c.trim()).filter(Boolean) || []}
                    onChange={(value) => handleChange('health', 'conditions', value.join(', '))}
                    options={[
                      'Asthma', 'Diabetes', 'Heart condition', 'Epilepsy',
                      'ADHD', 'Autism', 'Anxiety', 'Depression', 'Migraine',
                      'Arthritis', 'High blood pressure', 'Sleep apnea'
                    ]}
                    placeholder="Select or add conditions..."
                    allowCreate={true}
                  />
                  <p className="mt-1 text-xs text-gray-500">Helps with activity planning and reminder settings</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medications</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                    rows={3}
                    value={formData.health?.medications || ''}
                    onChange={(e) => handleChange('health', 'medications', e.target.value)}
                    placeholder="List current medications and dosages..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Information</label>
                  <div className="space-y-3">
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Emergency contact name and phone..."
                      value={formData.health?.emergencyContact || ''}
                      onChange={(e) => handleChange('health', 'emergencyContact', e.target.value)}
                    />
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Preferred hospital/clinic..."
                      value={formData.health?.preferredHospital || ''}
                      onChange={(e) => handleChange('health', 'preferredHospital', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Health Notes</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                    rows={3}
                    value={formData.health?.considerations || ''}
                    onChange={(e) => handleChange('health', 'considerations', e.target.value)}
                    placeholder="Any other health considerations (mobility, sensory sensitivities, etc.)..."
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                    onClick={() => toggleEditMode('health')}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm transition-colors flex items-center gap-2"
                    onClick={() => handleSaveSection('health')}
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              // View mode - Notion Style
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-red-600">🚨</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Allergies</div>
                      <div className="flex flex-wrap gap-2">
                        {profile.lifestyle?.health?.allergies ? (
                          profile.lifestyle.health.allergies.split(',').map((allergy, index) => (
                            <span key={index} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                              {allergy.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No allergies recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600">🥗</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Dietary Preferences</div>
                      <div className="flex flex-wrap gap-2">
                        {profile.lifestyle?.health?.dietaryRestrictions ? (
                          profile.lifestyle.health.dietaryRestrictions.split(',').map((diet, index) => (
                            <span key={index} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              {diet.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400">No dietary preferences recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600">⚕️</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Medical Conditions</div>
                        <div className="space-y-1">
                          {profile.lifestyle?.health?.conditions ? (
                            profile.lifestyle.health.conditions.split(',').map((condition, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                <span className="text-sm text-gray-700">{condition.trim()}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-gray-400 text-sm">No conditions recorded</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600">💊</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Medications</div>
                        <div className="text-sm text-gray-700">
                          {profile.lifestyle?.health?.medications || 
                           <span className="text-gray-400">No medications recorded</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-600">📱</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Emergency Information</div>
                      <div className="space-y-2">
                        {profile.lifestyle?.health?.emergencyContact && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Contact:</span>
                            <span className="text-sm text-gray-700">{profile?.lifestyle?.health?.emergencyContact}</span>
                          </div>
                        )}
                        {profile.lifestyle?.health?.preferredHospital && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Hospital:</span>
                            <span className="text-sm text-gray-700">{profile?.lifestyle?.health?.preferredHospital}</span>
                          </div>
                        )}
                        {!profile.lifestyle?.health?.emergencyContact && !profile.lifestyle?.health?.preferredHospital && (
                          <span className="text-gray-400 text-sm">No emergency information recorded</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {profile.lifestyle?.health?.considerations && (
                  <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-yellow-600">📝</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Additional Notes</div>
                        <div className="text-sm text-gray-700 leading-relaxed">
                          {profile?.lifestyle?.health?.considerations}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800 italic flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">💡</span>
                    Health information helps Allie provide safe activity suggestions, meal planning, and important reminders tailored to your family's needs.
                  </p>
                </div>
              </div>
            )}
            </div>
          </div>
        </TabPanel>
        </Tabs>
      </div>
    </div>
  );
};

EnhancedProfileManager.propTypes = {
  memberId: PropTypes.string.isRequired,
  onUpdate: PropTypes.func,
};

export default EnhancedProfileManager;