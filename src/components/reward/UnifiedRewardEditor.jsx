import React, { useState, useEffect } from 'react';
import { 
  X, 
  Gift, 
  DollarSign, 
  Users, 
  Image as ImageIcon,
  Check,
  AlertCircle,
  Tag,
  Star,
  CheckSquare,
  Square,
  Info,
  ToggleLeft
} from 'lucide-react';
import { useChore } from '../../contexts/ChoreContext';
import { useFamily } from '../../contexts/FamilyContext';
import RewardService from '../../services/RewardService';
import UserAvatar from '../common/UserAvatar';

const UnifiedRewardEditor = ({ 
  isOpen, 
  onClose, 
  selectedRewardIds = [],
  rewardTemplates = [],
  onSave 
}) => {
  const { familyMembers, familyId } = useFamily();
  const { loadRewardTemplates } = useChore();
  
  // Get children only
  const childrenOnly = familyMembers.filter(member => member.role === 'child');
  
  // Determine if we're in bulk edit mode
  const isBulkEdit = selectedRewardIds.length > 1;
  const rewardId = selectedRewardIds.length === 1 ? selectedRewardIds[0] : null;
  const selectedRewards = rewardTemplates.filter(reward => selectedRewardIds.includes(reward.id));
  
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
    price: 50,
    category: 'items',
    isActive: true,
    availableToIds: []
  });
  
  // Track which fields are being changed in bulk edit
  const [bulkChanges, setBulkChanges] = useState({
    isActive: false,
    availableToIds: false,
    price: false,
    category: false
  });
  
  // Load reward data if editing single reward
  useEffect(() => {
    if (rewardId && isOpen && !isBulkEdit) {
      loadRewardData();
    } else if (isOpen && !rewardId && !isBulkEdit) {
      // Reset form for new reward
      resetForm();
    } else if (isBulkEdit && isOpen) {
      // For bulk edit, set common values if they exist
      loadBulkData();
    }
  }, [rewardId, isOpen, isBulkEdit, selectedRewardIds]);
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      imageUrl: null,
      price: 50,
      category: 'items',
      isActive: true,
      availableToIds: []
    });
    setBulkChanges({
      isActive: false,
      availableToIds: false,
      price: false,
      category: false
    });
    setError(null);
  };
  
  const loadRewardData = async () => {
    try {
      setLoading(true);
      const template = await RewardService.getRewardTemplate(rewardId);
      setFormData({
        title: template.title || '',
        description: template.description || '',
        imageUrl: template.imageUrl || null,
        price: template.bucksPrice || template.price || 50,
        category: template.category || 'items',
        isActive: template.isActive !== false,
        availableToIds: template.availableToIds || []
      });
    } catch (error) {
      console.error('Error loading reward:', error);
      setError('Failed to load reward data');
    } finally {
      setLoading(false);
    }
  };
  
  const loadBulkData = () => {
    // Find common values across selected rewards
    if (selectedRewards.length === 0) return;
    
    // Get the first reward as a baseline
    const firstReward = selectedRewards[0];
    
    // Check which values are common across all selected rewards
    const commonPrice = selectedRewards.every(r => (r.bucksPrice || r.price) === (firstReward.bucksPrice || firstReward.price)) ? (firstReward.bucksPrice || firstReward.price) : '';
    const commonCategory = selectedRewards.every(r => r.category === firstReward.category) ? firstReward.category : '';
    const commonIsActive = selectedRewards.every(r => r.isActive === firstReward.isActive) ? firstReward.isActive : null;
    
    // For available children, show those that are available to ALL selected rewards
    const commonAvailableIds = firstReward.availableToIds?.filter(childId =>
      selectedRewards.every(reward => reward.availableToIds?.includes(childId))
    ) || [];
    
    setFormData({
      title: '',
      description: '',
      imageUrl: null,
      price: commonPrice || '',
      category: commonCategory || 'items',
      isActive: commonIsActive !== null ? commonIsActive : true,
      availableToIds: commonAvailableIds
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
        if (bulkChanges.availableToIds) updates.availableToIds = formData.availableToIds;
        if (bulkChanges.price) updates.bucksPrice = parseInt(formData.price);
        if (bulkChanges.category) updates.category = formData.category;
        
        // Apply updates to each selected reward
        const updatePromises = selectedRewardIds.map(rewardId => 
          RewardService.updateRewardTemplate(rewardId, updates, null)
        );
        
        await Promise.all(updatePromises);
      } else {
        // Single reward edit/create logic
        const rewardData = {
          title: formData.title,
          description: formData.description,
          bucksPrice: parseInt(formData.price),
          category: formData.category,
          isActive: formData.isActive,
          availableToIds: formData.availableToIds,
          imageUrl: formData.imageUrl
        };
        
        if (rewardId) {
          // Update existing reward
          await RewardService.updateRewardTemplate(rewardId, rewardData, null);
        } else {
          // Create new reward
          await RewardService.createRewardTemplate({
            ...rewardData,
            familyId
          }, null);
        }
      }
      
      await loadRewardTemplates();
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const toggleChildAvailability = (childId) => {
    setFormData(prev => ({
      ...prev,
      availableToIds: prev.availableToIds.includes(childId)
        ? prev.availableToIds.filter(id => id !== childId)
        : [...prev.availableToIds, childId]
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
              ? `Edit ${selectedRewardIds.length} Rewards` 
              : rewardId 
                ? 'Edit Reward' 
                : 'Create New Reward'
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
          <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-md">
            <div className="flex items-start">
              <Info size={14} className="text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-xs text-purple-700">
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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
                      className="w-full px-3 py-2 text-[13px] border border-[#E3E2E0] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
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
                      className="w-full px-3 py-2 text-[13px] border border-[#E3E2E0] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
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
                      <CheckSquare size={16} className="text-purple-600" />
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
                      <DollarSign size={12} className="inline mr-1" />
                      Price (Bucks)
                    </label>
                    {isBulkEdit && (
                      <button
                        type="button"
                        onClick={() => setBulkChanges(prev => ({ ...prev, price: !prev.price }))}
                        className="flex items-center"
                      >
                        {bulkChanges.price ? (
                          <CheckSquare size={14} className="text-purple-600" />
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
                    max="1000"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    disabled={isBulkEdit && !bulkChanges.price}
                    className={`w-full px-3 py-2 text-[13px] border border-[#E3E2E0] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white ${
                      isBulkEdit && !bulkChanges.price ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-[#37352F]/60 uppercase tracking-wider">
                      <Tag size={12} className="inline mr-1" />
                      Category
                    </label>
                    {isBulkEdit && (
                      <button
                        type="button"
                        onClick={() => setBulkChanges(prev => ({ ...prev, category: !prev.category }))}
                        className="flex items-center"
                      >
                        {bulkChanges.category ? (
                          <CheckSquare size={14} className="text-purple-600" />
                        ) : (
                          <Square size={14} className="text-[#37352F]/40" />
                        )}
                        <span className="text-[10px] text-[#37352F]/60 ml-1">Apply</span>
                      </button>
                    )}
                  </div>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    disabled={isBulkEdit && !bulkChanges.category}
                    className={`w-full px-3 py-2 text-[13px] border border-[#E3E2E0] rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white ${
                      isBulkEdit && !bulkChanges.category ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="items">Items</option>
                    <option value="activities">Activities</option>
                    <option value="privileges">Privileges</option>
                    <option value="special events">Special Events</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Availability */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-medium text-[#37352F] flex items-center">
                  <Users size={16} className="mr-2" />
                  Available To
                </h3>
                {isBulkEdit && (
                  <button
                    type="button"
                    onClick={() => setBulkChanges(prev => ({ ...prev, availableToIds: !prev.availableToIds }))}
                    className="flex items-center"
                  >
                    {bulkChanges.availableToIds ? (
                      <CheckSquare size={16} className="text-purple-600" />
                    ) : (
                      <Square size={16} className="text-[#37352F]/40" />
                    )}
                    <span className="text-[11px] text-[#37352F]/60 ml-1">Apply</span>
                  </button>
                )}
              </div>
              
              <div className={`space-y-1 ${isBulkEdit && !bulkChanges.availableToIds ? 'opacity-50' : ''}`}>
                {childrenOnly.map(child => (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => toggleChildAvailability(child.id)}
                    disabled={isBulkEdit && !bulkChanges.availableToIds}
                    className={`w-full flex items-center p-2 rounded-md transition-colors ${
                      formData.availableToIds.includes(child.id)
                        ? 'bg-white border border-purple-500'
                        : 'hover:bg-[#37352F]/5'
                    } ${isBulkEdit && !bulkChanges.availableToIds ? 'cursor-not-allowed' : ''}`}
                  >
                    <div className="w-5 h-5 mr-2">
                      {formData.availableToIds.includes(child.id) ? (
                        <CheckSquare size={18} className="text-purple-600" />
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
              <div className="mt-6 p-3 bg-purple-50 border border-purple-200 rounded-md">
                <h4 className="text-[12px] font-medium text-purple-900 mb-2">Changes to Apply:</h4>
                <ul className="space-y-1 text-[11px] text-purple-800">
                  {bulkChanges.isActive && (
                    <li>• Active Status → {formData.isActive ? 'Active' : 'Inactive'}</li>
                  )}
                  {bulkChanges.availableToIds && (
                    <li>• Available to {formData.availableToIds.length} children</li>
                  )}
                  {bulkChanges.price && (
                    <li>• Price → {formData.price} Bucks</li>
                  )}
                  {bulkChanges.category && (
                    <li>• Category → {formData.category}</li>
                  )}
                  {!Object.values(bulkChanges).some(v => v) && (
                    <li className="text-purple-600">No changes selected</li>
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
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <span className="animate-spin mr-2">⟳</span>
                Saving...
              </span>
            ) : (
              isBulkEdit ? 'Apply Changes' : (rewardId ? 'Update Reward' : 'Create Reward')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedRewardEditor;