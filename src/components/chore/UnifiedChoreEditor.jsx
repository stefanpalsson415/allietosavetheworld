import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  DollarSign, 
  Users, 
  Image as ImageIcon,
  Check,
  AlertCircle,
  Repeat,
  CalendarDays,
  User,
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  Square,
  Info
} from 'lucide-react';
import { useChore } from '../../contexts/ChoreContext';
import { useFamily } from '../../contexts/FamilyContext';
import ChoreService from '../../services/ChoreService';
import UserAvatar from '../common/UserAvatar';

const UnifiedChoreEditor = ({ 
  isOpen, 
  onClose, 
  selectedChoreIds = [],
  choreTemplates = [],
  onSave 
}) => {
  const { familyMembers, familyId } = useFamily();
  const { loadChoreTemplates } = useChore();
  
  // Get children only
  const childrenOnly = familyMembers.filter(member => member.role === 'child');
  
  // Determine if we're in bulk edit mode
  const isBulkEdit = selectedChoreIds.length > 1;
  const choreId = selectedChoreIds.length === 1 ? selectedChoreIds[0] : null;
  const selectedChores = choreTemplates.filter(chore => selectedChoreIds.includes(chore.id));
  
  // Form state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Unified form data
  const [formData, setFormData] = useState({
    // Single edit only fields
    title: '',
    description: '',
    imageUrl: null,
    
    // Shared fields
    timeOfDay: 'morning',
    rewardValue: 1,
    isRequired: false,
    recurrence: 'daily',
    daysOfWeek: [],
    isActive: true,
    assignedToIds: []
  });
  
  // Track which fields are being changed in bulk edit
  const [bulkChanges, setBulkChanges] = useState({
    isActive: false,
    assignedToIds: false,
    rewardValue: false,
    recurrence: false,
    timeOfDay: false
  });
  
  // Load chore data if editing single chore
  useEffect(() => {
    if (choreId && isOpen && !isBulkEdit) {
      loadChoreData();
    } else if (isOpen && !choreId && !isBulkEdit) {
      // Reset form for new chore
      resetForm();
    } else if (isBulkEdit && isOpen) {
      // For bulk edit, set common values if they exist
      loadBulkData();
    }
  }, [choreId, isOpen, isBulkEdit, selectedChoreIds]);
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: null,
      timeOfDay: 'morning',
      rewardValue: 1,
      isRequired: false,
      recurrence: 'daily',
      daysOfWeek: [],
      isActive: true,
      assignedToIds: []
    });
    setBulkChanges({
      isActive: false,
      assignedToIds: false,
      rewardValue: false,
      recurrence: false,
      timeOfDay: false
    });
    setError(null);
  };
  
  const loadChoreData = async () => {
    try {
      setLoading(true);
      const template = await ChoreService.getChoreTemplate(choreId);
      setFormData({
        title: template.title || '',
        description: template.description || '',
        imageUrl: template.customIconUrl || template.imageUrl || null,
        timeOfDay: template.timeOfDay || 'morning',
        rewardValue: template.rewardValue || template.bucksReward || 1,
        isRequired: template.isRequired || false,
        recurrence: template.recurrence || 'daily',
        daysOfWeek: template.daysOfWeek || [],
        isActive: template.isActive !== false,
        assignedToIds: template.assignedToIds || []
      });
    } catch (error) {
      console.error('Error loading chore:', error);
      setError('Failed to load chore data');
    } finally {
      setLoading(false);
    }
  };
  
  const loadBulkData = () => {
    // Find common values across selected chores
    if (selectedChores.length === 0) return;
    
    // Get the first chore as a baseline
    const firstChore = selectedChores[0];
    
    // Check which values are common across all selected chores
    const commonTimeOfDay = selectedChores.every(c => c.timeOfDay === firstChore.timeOfDay) ? firstChore.timeOfDay : '';
    const commonRewardValue = selectedChores.every(c => (c.rewardValue || c.bucksReward) === (firstChore.rewardValue || firstChore.bucksReward)) ? (firstChore.rewardValue || firstChore.bucksReward) : '';
    const commonRecurrence = selectedChores.every(c => c.recurrence === firstChore.recurrence) ? firstChore.recurrence : '';
    const commonIsActive = selectedChores.every(c => c.isActive === firstChore.isActive) ? firstChore.isActive : null;
    
    // For assigned children, show those that are assigned to ALL selected chores
    const commonAssignedIds = firstChore.assignedToIds?.filter(childId =>
      selectedChores.every(chore => chore.assignedToIds?.includes(childId))
    ) || [];
    
    setFormData({
      title: '',
      description: '',
      imageUrl: null,
      timeOfDay: commonTimeOfDay || 'morning',
      rewardValue: commonRewardValue || '',
      isRequired: false,
      recurrence: commonRecurrence || '',
      daysOfWeek: [],
      isActive: commonIsActive !== null ? commonIsActive : true,
      assignedToIds: commonAssignedIds
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);
    
    try {
      if (isBulkEdit) {
        // Build updates object only with explicitly changed values
        const updates = {};
        
        if (bulkChanges.isActive) updates.isActive = formData.isActive;
        if (bulkChanges.assignedToIds) updates.assignedToIds = formData.assignedToIds;
        if (bulkChanges.rewardValue) updates.bucksReward = parseInt(formData.rewardValue);
        if (bulkChanges.recurrence) updates.recurrence = formData.recurrence;
        if (bulkChanges.timeOfDay) updates.timeOfDay = formData.timeOfDay;
        
        // Apply updates to each selected chore
        const updatePromises = selectedChoreIds.map(choreId => 
          ChoreService.updateChoreTemplate(choreId, updates)
        );
        
        await Promise.all(updatePromises);
        
        // If activating chores, create schedules
        if (updates.isActive === true) {
          for (const choreId of selectedChoreIds) {
            const chore = choreTemplates.find(c => c.id === choreId);
            const assignedChildren = updates.assignedToIds || chore.assignedToIds || [];
            
            for (const childId of assignedChildren) {
              try {
                await ChoreService.createChoreSchedule(
                  familyId,
                  choreId,
                  childId,
                  {
                    type: 'repeating',
                    frequency: updates.recurrence || chore.recurrence || 'daily',
                    timeOfDay: updates.timeOfDay || chore.timeOfDay || 'anytime'
                  }
                );
              } catch (err) {
                console.error(`Error creating schedule for chore ${choreId}:`, err);
              }
            }
          }
        }
      } else {
        // Single chore edit/create logic (existing code)
        const choreData = {
          title: formData.title,
          description: formData.description,
          timeOfDay: formData.timeOfDay,
          bucksReward: parseInt(formData.rewardValue),
          isRequired: formData.isRequired,
          recurrence: formData.recurrence,
          daysOfWeek: formData.daysOfWeek,
          isActive: formData.isActive,
          assignedToIds: formData.assignedToIds,
          customIconUrl: formData.imageUrl
        };
        
        if (choreId) {
          // Update existing chore
          await ChoreService.updateChoreTemplate(choreId, choreData);
        } else {
          // Create new chore
          await ChoreService.createChoreTemplate({
            ...choreData,
            familyId
          });
        }
        
        // Create schedules if active and assigned
        if (choreData.isActive && choreData.assignedToIds.length > 0) {
          const targetChoreId = choreId || 'new-chore-id'; // Would need to get the new ID
          for (const childId of choreData.assignedToIds) {
            try {
              await ChoreService.createChoreSchedule(
                familyId,
                targetChoreId,
                childId,
                {
                  type: 'repeating',
                  frequency: choreData.recurrence,
                  timeOfDay: choreData.timeOfDay
                }
              );
            } catch (err) {
              console.error('Error creating schedule:', err);
            }
          }
        }
      }
      
      await loadChoreTemplates();
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleChildAssignment = (childId) => {
    setFormData(prev => ({
      ...prev,
      assignedToIds: prev.assignedToIds.includes(childId)
        ? prev.assignedToIds.filter(id => id !== childId)
        : [...prev.assignedToIds, childId]
    }));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed left-60 top-0 h-full w-80 bg-[#FBFBFA] border-r border-[#E3E2E0] shadow-xl z-50 flex flex-col overflow-hidden">
      {/* Header - Notion style */}
      <div className="p-4 border-b border-[#E3E2E0] bg-white">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-semibold text-[#37352F]">
            {isBulkEdit 
              ? `Edit ${selectedChoreIds.length} Chores` 
              : choreId 
                ? 'Edit Chore' 
                : 'Create New Chore'
            }
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#37352F]/5 rounded-md transition-colors"
          >
            <X size={18} className="text-[#37352F]/60" />
          </button>
        </div>
        
        {isBulkEdit && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start">
              <Info size={14} className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                Only common fields can be edited. Title, description, and image are disabled in bulk edit mode.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && !formData.title && !isBulkEdit ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                <AlertCircle size={14} className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
            
            {/* Basic Information - Only for single edit */}
            {!isBulkEdit && (
              <div>
                <h3 className="text-[13px] font-medium text-[#37352F] mb-3">Basic Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#37352F]/60 uppercase tracking-wider mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 text-[13px] border border-[#E3E2E0] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      required={!isBulkEdit}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-medium text-[#37352F]/60 uppercase tracking-wider mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 text-[13px] border border-[#E3E2E0] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Active Status Toggle */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[13px] font-medium text-[#37352F] flex items-center">
                  <ToggleLeft size={16} className="mr-2" />
                  Active Status
                </h3>
                {isBulkEdit && (
                  <button
                    type="button"
                    onClick={() => setBulkChanges(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className="flex items-center"
                  >
                    {bulkChanges.isActive ? (
                      <CheckSquare size={16} className="text-blue-600" />
                    ) : (
                      <Square size={16} className="text-[#37352F]/40" />
                    )}
                    <span className="text-[11px] text-[#37352F]/60 ml-1">Apply</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                disabled={isBulkEdit && !bulkChanges.isActive}
                className={`w-full py-2 px-3 rounded-md border text-[13px] font-medium transition-colors ${
                  isBulkEdit && !bulkChanges.isActive
                    ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
                    : formData.isActive 
                      ? 'bg-green-50 border-green-500 text-green-700' 
                      : 'bg-gray-50 border-gray-300 text-gray-600'
                }`}
              >
                {formData.isActive ? (
                  <>
                    <Check size={14} className="inline mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <X size={14} className="inline mr-1" />
                    Inactive
                  </>
                )}
              </button>
            </div>
            
            {/* Settings */}
            <div>
              <h3 className="text-[13px] font-medium text-[#37352F] mb-3">Settings</h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-[#37352F]/60 uppercase tracking-wider">
                      <Clock size={12} className="inline mr-1" />
                      Time of Day
                    </label>
                    {isBulkEdit && (
                      <button
                        type="button"
                        onClick={() => setBulkChanges(prev => ({ ...prev, timeOfDay: !prev.timeOfDay }))}
                        className="flex items-center"
                      >
                        {bulkChanges.timeOfDay ? (
                          <CheckSquare size={14} className="text-blue-600" />
                        ) : (
                          <Square size={14} className="text-[#37352F]/40" />
                        )}
                        <span className="text-[10px] text-[#37352F]/60 ml-1">Apply</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={formData.timeOfDay}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeOfDay: e.target.value }))}
                    disabled={isBulkEdit && !bulkChanges.timeOfDay}
                    className={`w-full px-3 py-2 text-[13px] border border-[#E3E2E0] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                      isBulkEdit && !bulkChanges.timeOfDay ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">Select time</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-[#37352F]/60 uppercase tracking-wider">
                      <DollarSign size={12} className="inline mr-1" />
                      Palsson Bucks
                    </label>
                    {isBulkEdit && (
                      <button
                        type="button"
                        onClick={() => setBulkChanges(prev => ({ ...prev, rewardValue: !prev.rewardValue }))}
                        className="flex items-center"
                      >
                        {bulkChanges.rewardValue ? (
                          <CheckSquare size={14} className="text-blue-600" />
                        ) : (
                          <Square size={14} className="text-[#37352F]/40" />
                        )}
                        <span className="text-[10px] text-[#37352F]/60 ml-1">Apply</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.rewardValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, rewardValue: e.target.value }))}
                    disabled={isBulkEdit && !bulkChanges.rewardValue}
                    className={`w-full px-3 py-2 text-[13px] border border-[#E3E2E0] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                      isBulkEdit && !bulkChanges.rewardValue ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-[#37352F]/60 uppercase tracking-wider">
                      <Calendar size={12} className="inline mr-1" />
                      Recurrence
                    </label>
                    {isBulkEdit && (
                      <button
                        type="button"
                        onClick={() => setBulkChanges(prev => ({ ...prev, recurrence: !prev.recurrence }))}
                        className="flex items-center"
                      >
                        {bulkChanges.recurrence ? (
                          <CheckSquare size={14} className="text-blue-600" />
                        ) : (
                          <Square size={14} className="text-[#37352F]/40" />
                        )}
                        <span className="text-[10px] text-[#37352F]/60 ml-1">Apply</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={formData.recurrence}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurrence: e.target.value }))}
                    disabled={isBulkEdit && !bulkChanges.recurrence}
                    className={`w-full px-3 py-2 text-[13px] border border-[#E3E2E0] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                      isBulkEdit && !bulkChanges.recurrence ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">Select recurrence</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="weekdays">Weekdays Only</option>
                    <option value="asNeeded">As Needed</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Assignment */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-medium text-[#37352F] flex items-center">
                  <Users size={16} className="mr-2" />
                  Assign To Children
                </h3>
                {isBulkEdit && (
                  <button
                    type="button"
                    onClick={() => setBulkChanges(prev => ({ ...prev, assignedToIds: !prev.assignedToIds }))}
                    className="flex items-center"
                  >
                    {bulkChanges.assignedToIds ? (
                      <CheckSquare size={16} className="text-blue-600" />
                    ) : (
                      <Square size={16} className="text-[#37352F]/40" />
                    )}
                    <span className="text-[11px] text-[#37352F]/60 ml-1">Apply</span>
                  </button>
                )}
              </div>
              
              <div className={`space-y-1 ${isBulkEdit && !bulkChanges.assignedToIds ? 'opacity-50' : ''}`}>
                {childrenOnly.map(child => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => toggleChildAssignment(child.id)}
                    disabled={isBulkEdit && !bulkChanges.assignedToIds}
                    className={`w-full flex items-center p-2 rounded-md transition-colors ${
                      formData.assignedToIds.includes(child.id)
                        ? 'bg-white border border-blue-500'
                        : 'hover:bg-[#37352F]/5'
                    } ${isBulkEdit && !bulkChanges.assignedToIds ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className="w-5 h-5 mr-2">
                      {formData.assignedToIds.includes(child.id) ? (
                        <CheckSquare size={18} className="text-blue-600" />
                      ) : (
                        <Square size={18} className="text-[#37352F]/40" />
                      )}
                    </div>
                    <UserAvatar user={child} size={24} className="mr-2" />
                    <span className="text-[13px] text-[#37352F]">{child.name}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Summary for bulk edit */}
            {isBulkEdit && (
              <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <h4 className="text-[12px] font-medium text-amber-900 mb-2">Changes to Apply:</h4>
                <ul className="space-y-1 text-[11px] text-amber-800">
                  {bulkChanges.isActive && (
                    <li>• Active Status → {formData.isActive ? 'Active' : 'Inactive'}</li>
                  )}
                  {bulkChanges.assignedToIds && (
                    <li>• Assign to {formData.assignedToIds.length} children</li>
                  )}
                  {bulkChanges.timeOfDay && (
                    <li>• Time of Day → {formData.timeOfDay || 'Not set'}</li>
                  )}
                  {bulkChanges.rewardValue && (
                    <li>• Palsson Bucks → {formData.rewardValue}</li>
                  )}
                  {bulkChanges.recurrence && (
                    <li>• Recurrence → {formData.recurrence || 'Not set'}</li>
                  )}
                  {!Object.values(bulkChanges).some(v => v) && (
                    <li className="text-amber-600">No changes selected</li>
                  )}
                </ul>
              </div>
            )}
          </form>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-[#E3E2E0] bg-white">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-3 py-2 text-[13px] border border-[#E3E2E0] rounded-md text-[#37352F]/60 hover:bg-[#37352F]/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isProcessing || (!isBulkEdit && !formData.title) || (isBulkEdit && !Object.values(bulkChanges).some(v => v))}
            className={`flex-1 px-3 py-2 text-[13px] rounded-md font-medium transition-colors ${
              isProcessing || (!isBulkEdit && !formData.title) || (isBulkEdit && !Object.values(bulkChanges).some(v => v))
                ? 'bg-[#E3E2E0] text-[#37352F]/40 cursor-not-allowed'
                : 'bg-[#37352F] text-white hover:bg-[#37352F]/90'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⟳</span>
                Saving...
              </span>
            ) : (
              isBulkEdit ? 'Apply Changes' : (choreId ? 'Update Chore' : 'Create Chore')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedChoreEditor;