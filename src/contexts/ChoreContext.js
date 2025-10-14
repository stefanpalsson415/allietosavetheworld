// src/contexts/ChoreContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useFamily } from './FamilyContext';
import ChoreService from '../services/ChoreService';
import RewardService from '../services/RewardService';
import BucksService from '../services/BucksService';

// Create the context
const ChoreContext = createContext();

// Custom hook to use the chore context
export function useChore() {
  return useContext(ChoreContext);
}

// Provider component
export function ChoreProvider({ children }) {
  const { familyId, selectedUser, familyMembers } = useFamily();
  
  // State for chores
  const [choreTemplates, setChoreTemplates] = useState([]);
  const [childChores, setChildChores] = useState([]);
  const [choresByTimeOfDay, setChoresByTimeOfDay] = useState({
    morning: [],
    afternoon: [],
    evening: [],
    anytime: []
  });
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [isLoadingChores, setIsLoadingChores] = useState(true);
  const [choreError, setChoreError] = useState(null);
  
  // State for rewards
  const [rewardTemplates, setRewardTemplates] = useState([]);
  const [childRewards, setChildRewards] = useState([]);
  const [rewardsByCategory, setRewardsByCategory] = useState({
    activities: [],
    items: [],
    privileges: [],
    other: []
  });
  const [pendingRewardApprovals, setPendingRewardApprovals] = useState([]);
  const [isLoadingRewards, setIsLoadingRewards] = useState(true);
  const [rewardError, setRewardError] = useState(null);
  
  // State for Palsson Bucks
  const [bucksBalance, setBucksBalance] = useState(0);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [isLoadingBucks, setIsLoadingBucks] = useState(true);
  const [bucksError, setBucksError] = useState(null);
  
  // State for child selection
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  
  // Effect to set selectedChildId when selectedUser changes
  useEffect(() => {
    if (selectedUser && selectedUser.role === 'child') {
      setSelectedChildId(selectedUser.id);
    } else if (familyMembers && familyMembers.length > 0) {
      // If selected user is a parent, try to find a child
      // familyMembers might be an object - convert to array first
      const members = typeof familyMembers === 'object' && !Array.isArray(familyMembers)
        ? Object.values(familyMembers)
        : familyMembers;
      const firstChild = (Array.isArray(members) ? members : []).find(member => member.role === 'child');
      if (firstChild) {
        setSelectedChildId(firstChild.id);
      } else {
        setSelectedChildId(null);
      }
    } else {
      setSelectedChildId(null);
    }
  }, [selectedUser, familyMembers]);
  
  // Effect to set selectedChild when selectedChildId changes
  useEffect(() => {
    if (selectedChildId && familyMembers) {
      // familyMembers might be an object - convert to array first
      const members = typeof familyMembers === 'object' && !Array.isArray(familyMembers)
        ? Object.values(familyMembers)
        : familyMembers;
      const child = (Array.isArray(members) ? members : []).find(member => member.id === selectedChildId);
      setSelectedChild(child || null);
    } else {
      setSelectedChild(null);
    }
  }, [selectedChildId, familyMembers]);
  
  // Load chore templates
  const loadChoreTemplates = useCallback(async () => {
    if (!familyId) return;
    
    try {
      setIsLoadingChores(true);
      const templates = await ChoreService.getChoreTemplates(familyId);
      setChoreTemplates(templates);
      setChoreError(null);
    } catch (error) {
      console.error("Error loading chore templates:", error);
      setChoreError("Failed to load chore templates");
    } finally {
      setIsLoadingChores(false);
    }
  }, [familyId]);
  
  // Load chores for selected child
  const loadChildChores = useCallback(async (date = new Date()) => {
    if (!familyId || !selectedChildId) return;
    
    try {
      setIsLoadingChores(true);
      
      // Only generate instances if we're loading for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const loadDate = new Date(date);
      loadDate.setHours(0, 0, 0, 0);
      
      if (loadDate.getTime() === today.getTime()) {
        // Check if we need to generate chores for today
        await ChoreService.generateChoreInstances(familyId, date);
      }
      
      // Load chores for the child and date
      const chores = await ChoreService.getChoreInstancesForChild(familyId, selectedChildId, date);
      setChildChores(chores);
      
      // Organize chores by time of day with deduplication
      const choresToday = {
        morning: [],
        afternoon: [],
        evening: [],
        anytime: []
      };
      
      // Deduplicate chores - use a Map to keep only one instance of each template
      const templateMap = new Map();
      
      chores.forEach(chore => {
        const templateId = chore.templateId;
        const timeOfDay = chore.timeOfDay || 'anytime';
        
        // Only add it if we don't already have this template in this time slot
        if (!templateMap.has(`${timeOfDay}-${templateId}`)) {
          templateMap.set(`${timeOfDay}-${templateId}`, chore);
          choresToday[timeOfDay].push(chore);
        }
      });
      
      setChoresByTimeOfDay(choresToday);
      setChoreError(null);
    } catch (error) {
      console.error("Error loading child chores:", error);
      setChoreError("Failed to load chores");
    } finally {
      setIsLoadingChores(false);
    }
  }, [familyId, selectedChildId]);
  
  // Load pending approvals
  const loadPendingApprovals = useCallback(async () => {
    if (!familyId) return;
    
    try {
      const pending = await ChoreService.getChoresPendingApproval(familyId);
      setPendingApprovals(pending);
    } catch (error) {
      console.error("Error loading pending approvals:", error);
    }
  }, [familyId]);
  
  // Load reward templates
  const loadRewardTemplates = useCallback(async () => {
    if (!familyId) return;
    
    try {
      setIsLoadingRewards(true);
      const templates = await RewardService.getRewardTemplates(familyId);
      setRewardTemplates(templates);
      
      // Organize rewards by category
      const rewardsByCat = {
        activities: [],
        items: [],
        privileges: [],
        other: []
      };
      
      templates.forEach(reward => {
        const category = reward.category || 'other';
        // Ensure the category exists in our rewardsByCat object
        if (!rewardsByCat[category]) {
          rewardsByCat[category] = [];
        }
        rewardsByCat[category].push(reward);
      });
      
      setRewardsByCategory(rewardsByCat);
      setRewardError(null);
    } catch (error) {
      console.error("Error loading reward templates:", error);
      setRewardError("Failed to load rewards");
    } finally {
      setIsLoadingRewards(false);
    }
  }, [familyId]);
  
  // Load rewards for selected child
  const loadChildRewards = useCallback(async () => {
    if (!familyId || !selectedChildId) return;
    
    try {
      setIsLoadingRewards(true);
      const rewards = await RewardService.getChildRewards(familyId, selectedChildId);
      setChildRewards(rewards);
      setRewardError(null);
    } catch (error) {
      console.error("Error loading child rewards:", error);
      setRewardError("Failed to load rewards");
    } finally {
      setIsLoadingRewards(false);
    }
  }, [familyId, selectedChildId]);
  
  // Load pending reward approvals
  const loadPendingRewardApprovals = useCallback(async () => {
    if (!familyId) return;
    
    try {
      const pending = await RewardService.getRewardsPendingApproval(familyId);
      setPendingRewardApprovals(pending);
    } catch (error) {
      console.error("Error loading pending reward approvals:", error);
    }
  }, [familyId]);
  
  // Load Palsson Bucks balance
  const loadBucksBalance = useCallback(async () => {
    if (!familyId || !selectedChildId) return;
    
    try {
      setIsLoadingBucks(true);
      
      // Use getChildBalance which handles initialization automatically
      const currentBalance = await BucksService.getChildBalance(familyId, selectedChildId);
      setBucksBalance(currentBalance);
      
      // Get transaction history
      const transactions = await BucksService.getTransactionHistory(familyId, selectedChildId, 20);
      setTransactionHistory(transactions);
      
      setBucksError(null);
    } catch (error) {
      console.error("Error loading Palsson Bucks balance:", error);
      setBucksError("Failed to load Palsson Bucks balance");
      setBucksBalance(0); // Set to 0 on error
    } finally {
      setIsLoadingBucks(false);
    }
  }, [familyId, selectedChildId]);
  
  // Load all data when familyId and selectedChildId change
  useEffect(() => {
    if (familyId) {
      loadChoreTemplates();
      loadRewardTemplates();
      loadPendingApprovals();
      loadPendingRewardApprovals();
      
      if (selectedChildId) {
        loadChildChores();
        loadChildRewards();
        loadBucksBalance();
      }
    }
  }, [
    familyId, 
    selectedChildId, 
    loadChoreTemplates, 
    loadChildChores, 
    loadPendingApprovals,
    loadRewardTemplates,
    loadChildRewards,
    loadPendingRewardApprovals,
    loadBucksBalance
  ]);
  
  // ---- Chore Actions ----
  
  // Create a new chore template
  const createChoreTemplate = async (templateData, iconFile) => {
    if (!familyId) {
      console.error("[DEBUG] createChoreTemplate failed: No family ID available");
      throw new Error("No family ID available");
    }
    
    console.log(`[DEBUG] createChoreTemplate called with:`, {
      familyId,
      templateData,
      hasIconFile: !!iconFile
    });
    
    try {
      console.log(`[DEBUG] Calling ChoreService.createChoreTemplate with familyId:`, familyId);
      console.log(`[DEBUG] Template data being sent:`, templateData);
      const templateId = await ChoreService.createChoreTemplate(familyId, templateData);
      console.log(`[DEBUG] ChoreService.createChoreTemplate returned templateId:`, templateId);
      
      if (iconFile) {
        console.log(`[DEBUG] Uploading icon for templateId:`, templateId);
        await ChoreService.uploadChoreIcon(familyId, templateId, iconFile);
      }
      
      // Reload templates
      console.log(`[DEBUG] Reloading chore templates after creation`);
      loadChoreTemplates();
      
      return templateId;
    } catch (error) {
      console.error("[DEBUG] Error creating chore template:", error);
      setChoreError("Failed to create chore template");
      throw error;
    }
  };
  
  // Update a chore template
  const updateChoreTemplate = async (templateId, updateData, iconFile) => {
    if (!familyId) throw new Error("No family ID available");
    
    try {
      // Update template data
      await ChoreService.updateChoreTemplate(templateId, updateData);
      
      // Upload new icon if provided
      if (iconFile) {
        await ChoreService.uploadChoreIcon(familyId, templateId, iconFile);
      }
      
      // Reload templates
      loadChoreTemplates();
      
      return templateId;
    } catch (error) {
      console.error("Error updating chore template:", error);
      setChoreError("Failed to update chore template");
      throw error;
    }
  };
  
  // Toggle chore template active status
  const toggleChoreActive = async (templateId, isActive) => {
    if (!familyId) throw new Error("No family ID available");
    
    try {
      if (isActive) {
        // Activate chore template
        await ChoreService.updateChoreTemplate(templateId, {
          isArchived: false
        });
      } else {
        // Deactivate chore template
        await ChoreService.archiveChoreTemplate(templateId);
      }
      
      // Reload templates
      loadChoreTemplates();
      
      return templateId;
    } catch (error) {
      console.error("Error toggling chore template active status:", error);
      setChoreError("Failed to update chore template");
      throw error;
    }
  };
  
  // Create a chore schedule
  const createChoreSchedule = async (templateId, childId, scheduleData) => {
    if (!familyId) throw new Error("No family ID available");
    
    try {
      const scheduleId = await ChoreService.createChoreSchedule(
        familyId,
        templateId,
        childId,
        scheduleData
      );
      
      // Reload chores for the selected child
      if (childId === selectedChildId) {
        loadChildChores();
      }
      
      return scheduleId;
    } catch (error) {
      console.error("Error creating chore schedule:", error);
      setChoreError("Failed to create chore schedule");
      throw error;
    }
  };
  
  // Complete a chore
  const completeChore = async (choreId, completionData, photoFile) => {
    try {
      const result = await ChoreService.completeChoreInstance(
        choreId,
        completionData,
        photoFile
      );
      
      // Reload chores
      loadChildChores();
      
      return result;
    } catch (error) {
      console.error("Error completing chore:", error);
      setChoreError("Failed to complete chore");
      throw error;
    }
  };
  
  // Approve a chore
  const approveChore = async (choreId, parentId, approvalData) => {
    try {
      const result = await ChoreService.approveChoreInstance(
        choreId,
        parentId,
        approvalData
      );
      
      // Create a Palsson Bucks transaction for the approved chore
      if (result && result.childId) {
        try {
          await BucksService.rewardChore(
            familyId,
            result.childId,
            choreId,
            result.bucksAwarded,
            parentId
          );
          
          // Reload balance if this is for the selected child
          if (result.childId === selectedChildId) {
            loadBucksBalance();
          }
        } catch (bucksError) {
          console.error("Error rewarding Palsson Bucks:", bucksError);
        }
      }
      
      // Reload pending approvals
      loadPendingApprovals();
      
      // Reload chores if this is for the selected child
      if (result.childId === selectedChildId) {
        loadChildChores();
      }
      
      return result;
    } catch (error) {
      console.error("Error approving chore:", error);
      setChoreError("Failed to approve chore");
      throw error;
    }
  };
  
  // Add a tip to a completed chore
  const tipChore = async (choreId, childId, amount, parentId) => {
    try {
      // Add the tip
      const result = await BucksService.tipChore(
        familyId,
        childId,
        choreId,
        amount,
        parentId
      );
      
      // Reload balance if this is for the selected child
      if (childId === selectedChildId) {
        loadBucksBalance();
      }
      
      return result;
    } catch (error) {
      console.error("Error tipping chore:", error);
      setBucksError("Failed to add tip");
      throw error;
    }
  };
  
  // Reject a chore
  const rejectChore = async (choreId, parentId, rejectionData) => {
    try {
      const result = await ChoreService.rejectChoreInstance(
        choreId,
        parentId,
        rejectionData
      );
      
      // Reload pending approvals
      loadPendingApprovals();
      
      // Reload chores if this is for the selected child
      if (result.childId === selectedChildId) {
        loadChildChores();
      }
      
      return result;
    } catch (error) {
      console.error("Error rejecting chore:", error);
      setChoreError("Failed to reject chore");
      throw error;
    }
  };
  
  // ---- Reward Actions ----
  
  // Create a new reward template
  const createRewardTemplate = async (templateData, imageFile) => {
    if (!familyId) {
      console.error("[DEBUG] createRewardTemplate failed: No family ID available");
      throw new Error("No family ID available");
    }
    
    console.log(`[DEBUG] createRewardTemplate called with:`, {
      familyId,
      templateData,
      hasImageFile: !!imageFile
    });
    
    try {
      console.log(`[DEBUG] Calling RewardService.createRewardTemplate with familyId:`, familyId);
      console.log(`[DEBUG] Template data being sent:`, templateData);
      const templateId = await RewardService.createRewardTemplate(
        familyId,
        templateData,
        imageFile
      );
      console.log(`[DEBUG] RewardService.createRewardTemplate returned templateId:`, templateId);
      
      // Reload templates
      console.log(`[DEBUG] Reloading reward templates after creation`);
      loadRewardTemplates();
      
      return templateId;
    } catch (error) {
      console.error("[DEBUG] Error creating reward template:", error);
      setRewardError("Failed to create reward template");
      throw error;
    }
  };
  
  // Update a reward template
  const updateRewardTemplate = async (templateId, updateData, imageFile) => {
    if (!familyId) throw new Error("No family ID available");
    
    try {
      await RewardService.updateRewardTemplate(
        templateId,
        updateData,
        imageFile
      );
      
      // Reload templates
      loadRewardTemplates();
      
      return templateId;
    } catch (error) {
      console.error("Error updating reward template:", error);
      setRewardError("Failed to update reward template");
      throw error;
    }
  };
  
  // Toggle reward template active status
  const toggleRewardActive = async (templateId, isActive) => {
    if (!familyId) throw new Error("No family ID available");
    
    try {
      if (isActive) {
        // Activate reward template
        await RewardService.updateRewardTemplate(templateId, {
          isActive: true
        });
      } else {
        // Deactivate reward template
        await RewardService.deactivateRewardTemplate(templateId);
      }
      
      // Reload templates
      loadRewardTemplates();
      
      return templateId;
    } catch (error) {
      console.error("Error toggling reward template active status:", error);
      setRewardError("Failed to update reward template");
      throw error;
    }
  };
  
  // Request a reward (child purchases a reward)
  const requestReward = async (templateId, requestData) => {
    if (!familyId || !selectedChildId) throw new Error("No family or child ID available");
    
    try {
      // Get the template to check the price
      const template = rewardTemplates.find(t => t.id === templateId);
      
      if (!template) {
        throw new Error("Reward template not found");
      }
      
      // Get the price from various possible properties
      const rewardPrice = template.price || template.bucksPrice || template.bucksValue || 50;
      
      // Check if child has enough Palsson Bucks
      if (bucksBalance < rewardPrice) {
        throw new Error("Not enough Palsson Bucks");
      }
      
      // Request the reward
      const rewardId = await RewardService.requestReward(
        familyId,
        selectedChildId,
        templateId,
        requestData
      );
      
      // Spend Palsson Bucks
      await BucksService.spendOnReward(
        familyId,
        selectedChildId,
        rewardId,
        rewardPrice
      );
      
      // Reload rewards and balance
      loadChildRewards();
      loadBucksBalance();
      
      return rewardId;
    } catch (error) {
      console.error("Error requesting reward:", error);
      setRewardError("Failed to request reward");
      throw error;
    }
  };
  
  // Approve a reward request
  const approveReward = async (rewardId, parentId, approvalData) => {
    try {
      const result = await RewardService.approveRewardRequest(
        rewardId,
        parentId,
        approvalData
      );
      
      // Reload pending approvals
      loadPendingRewardApprovals();
      
      // Reload rewards if this is for the selected child
      if (result.childId === selectedChildId) {
        loadChildRewards();
      }
      
      return result;
    } catch (error) {
      console.error("Error approving reward:", error);
      setRewardError("Failed to approve reward");
      throw error;
    }
  };
  
  // Reject a reward request
  const rejectReward = async (rewardId, parentId, rejectionData) => {
    try {
      const result = await RewardService.rejectRewardRequest(
        rewardId,
        parentId,
        rejectionData
      );
      
      // Refund Palsson Bucks
      if (result && result.childId) {
        try {
          await BucksService.refundReward(
            familyId,
            result.childId,
            rewardId,
            result.bucksPrice,
            parentId
          );
          
          // Reload balance if this is for the selected child
          if (result.childId === selectedChildId) {
            loadBucksBalance();
          }
        } catch (bucksError) {
          console.error("Error refunding Palsson Bucks:", bucksError);
        }
      }
      
      // Reload pending approvals
      loadPendingRewardApprovals();
      
      // Reload rewards if this is for the selected child
      if (result.childId === selectedChildId) {
        loadChildRewards();
      }
      
      return result;
    } catch (error) {
      console.error("Error rejecting reward:", error);
      setRewardError("Failed to reject reward");
      throw error;
    }
  };
  
  // Fulfill a reward
  const fulfillReward = async (rewardId, parentId, fulfillmentData) => {
    try {
      const result = await RewardService.fulfillReward(
        rewardId,
        parentId,
        fulfillmentData
      );
      
      // Reload rewards if this is for the selected child
      if (result.childId === selectedChildId) {
        loadChildRewards();
      }
      
      return result;
    } catch (error) {
      console.error("Error fulfilling reward:", error);
      setRewardError("Failed to fulfill reward");
      throw error;
    }
  };
  
  // Add memories to a fulfilled reward
  const addRewardMemories = async (rewardId, memoryData, photoFiles) => {
    try {
      const result = await RewardService.addRewardMemories(
        rewardId,
        memoryData,
        photoFiles
      );
      
      // Reload rewards
      loadChildRewards();
      
      return result;
    } catch (error) {
      console.error("Error adding reward memories:", error);
      setRewardError("Failed to add memories");
      throw error;
    }
  };
  
  // ---- Palsson Bucks Actions ----
  
  // Manually adjust balance
  const adjustBucksBalance = async (childId, amount, reason, parentId) => {
    try {
      const result = await BucksService.adjustBalance(
        familyId,
        childId,
        amount,
        reason,
        parentId
      );
      
      // Reload balance if this is for the selected child
      if (childId === selectedChildId) {
        loadBucksBalance();
      }
      
      return result;
    } catch (error) {
      console.error("Error adjusting Palsson Bucks balance:", error);
      setBucksError("Failed to adjust balance");
      throw error;
    }
  };
  
  // ---- Child Selection Actions ----
  
  // Set the selected child
  const selectChild = (childId) => {
    setSelectedChildId(childId);
  };
  
  // Function to mark a chore as completed
  const markChoreAsCompleted = async (choreId, photoFile, notes, mood) => {
    try {
      const completionData = {
        proofType: 'photo',
        note: notes || '',
        mood: mood || 'happy'
      };
      
      const result = await completeChore(choreId, completionData, photoFile);
      return result;
    } catch (error) {
      console.error('Error marking chore as completed:', error);
      setChoreError('Failed to complete chore');
      throw error;
    }
  };
  
  // Get chores by time of day for a specific date and child
  const getChoresByTimeOfDay = (date = new Date(), childId = selectedChildId) => {
    // If no date or childId, return empty result
    if (!date || !childId) {
      return {
        morning: [],
        afternoon: [],
        evening: [],
        anytime: []
      };
    }
    
    // If it's the selected child, return the existing state
    if (childId === selectedChildId) {
      return choresByTimeOfDay;
    }
    
    // Otherwise, filter childChores by time of day
    const chores = childChores.filter(chore => {
      const choreDate = chore.date;
      return (
        choreDate.getFullYear() === date.getFullYear() &&
        choreDate.getMonth() === date.getMonth() &&
        choreDate.getDate() === date.getDate()
      );
    });
    
    const result = {
      morning: [],
      afternoon: [],
      evening: [],
      anytime: []
    };
    
    chores.forEach(chore => {
      const timeOfDay = chore.timeOfDay || 'anytime';
      result[timeOfDay].push(chore);
    });
    
    return result;
  };
  
  // Get Bucks transactions for a child
  const getBucksTransactions = async (childId = selectedChildId, limit = 20) => {
    try {
      if (!familyId || !childId) return [];
      
      const transactions = await BucksService.getTransactionHistory(familyId, childId, limit);
      return transactions;
    } catch (error) {
      console.error('Error getting Bucks transactions:', error);
      setBucksError('Failed to load transaction history');
      return [];
    }
  };
  
  // Get a child's Palsson Bucks balance
  const getChildBucksBalance = async (childId = selectedChildId) => {
    try {
      if (!childId || !familyId) return 0;
      
      // If it's the selected child, return the existing state
      if (childId === selectedChildId) {
        return bucksBalance;
      }
      
      // Otherwise, fetch the balance using getChildBalance which handles initialization
      const balance = await BucksService.getChildBalance(familyId, childId);
      return balance;
    } catch (error) {
      console.error('Error getting child bucks balance:', error);
      return 0;
    }
  };
  
  // Create a calendar event for a chore completion or reward fulfillment
  const createCalendarEvent = async (type, instanceData, familyId) => {
    try {
      if (!familyId || !instanceData) return null;
      
      // Import CalendarService dynamically to avoid circular dependencies
      const CalendarService = (await import('../services/CalendarService')).default;
      
      let eventData = null;
      
      if (type === 'chore') {
        // Create event for chore
        const template = await ChoreService.getChoreTemplate(instanceData.templateId);
        const childData = await ChoreService.getChildData(familyId, instanceData.childId);
        
        eventData = {
          title: `Chore: ${template.title} for ${childData.name}`,
          start: {
            dateTime: instanceData.completedAt || new Date(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: new Date(new Date(instanceData.completedAt || new Date()).getTime() + 30 * 60000), // 30 minutes later
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          description: `${template.description}

Completed by: ${childData.name}
Bucks earned: ${instanceData.bucksAwarded}`,
          location: '',
          isAllDay: false,
          attendees: [
            { id: instanceData.childId, name: childData.name }
          ],
          category: 'chore',
          eventType: 'chore',
          familyId: familyId,
          metadata: {
            choreInstanceId: instanceData.id,
            choreTemplateId: instanceData.templateId,
            childId: instanceData.childId
          }
        };
      } else if (type === 'reward') {
        // Create event for reward
        const template = await RewardService.getRewardTemplate(instanceData.templateId);
        const childData = await RewardService.getChildData(familyId, instanceData.childId);
        
        const startTime = instanceData.fulfillmentStatus?.scheduledDate || new Date();
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + (template.estimatedDuration || 60));
        
        eventData = {
          title: `Reward: ${template.title} for ${childData.name}`,
          start: {
            dateTime: startTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: endTime,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          description: `${template.description}

Requested by: ${childData.name}
Bucks spent: ${instanceData.bucksPrice}`,
          location: '',
          isAllDay: false,
          attendees: [
            { id: instanceData.childId, name: childData.name }
          ],
          category: 'reward',
          eventType: 'reward',
          familyId: familyId,
          metadata: {
            rewardInstanceId: instanceData.id,
            rewardTemplateId: instanceData.templateId,
            childId: instanceData.childId
          }
        };
      }
      
      if (eventData) {
        // First parent in the family
        // familyMembers might be an object - convert to array first
        const members = typeof familyMembers === 'object' && !Array.isArray(familyMembers)
          ? Object.values(familyMembers)
          : familyMembers;
        const firstParent = (Array.isArray(members) ? members : []).find(member => member.role === 'parent');
        if (firstParent) {
          eventData.attendees.push({ id: firstParent.id, name: firstParent.name });
          return await CalendarService.addEvent(eventData, firstParent.id);
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error creating calendar event for ${type}:`, error);
      return null;
    }
  };

  // Value object to be provided
  const value = {
    // Chore state
    choreTemplates,
    childChores,
    choresByTimeOfDay,
    pendingApprovals,
    isLoadingChores,
    choreError,
    
    // Reward state
    rewardTemplates,
    childRewards,
    rewardsByCategory,
    pendingRewardApprovals,
    isLoadingRewards,
    rewardError,
    
    // Palsson Bucks state
    bucksBalance,
    transactionHistory,
    isLoadingBucks,
    bucksError,
    
    // Child selection state
    selectedChildId,
    selectedChild,
    
    // Chore actions
    loadChoreTemplates,
    loadChildChores,
    loadPendingApprovals,
    createChoreTemplate,
    updateChoreTemplate,
    toggleChoreActive,
    createChoreSchedule,
    completeChore,
    approveChore,
    tipChore,
    rejectChore,
    markChoreAsCompleted,
    getChoresByTimeOfDay,
    
    // Reward actions
    loadRewardTemplates,
    loadChildRewards,
    loadPendingRewardApprovals,
    createRewardTemplate,
    updateRewardTemplate,
    toggleRewardActive,
    requestReward,
    purchaseReward: requestReward, // Alias for consistency
    approveReward,
    rejectReward,
    fulfillReward,
    addRewardMemories,
    getAvailableRewards: () => rewardTemplates, // Convenience getter
    getPendingRewards: () => childRewards.filter(r => r.status === 'pending'), // Convenience getter
    
    // Palsson Bucks actions
    loadBucksBalance,
    adjustBucksBalance,
    getChildBucksBalance,
    getBucksTransactions,
    getFamilyBucksBalances: async () => {
      if (!familyId) return [];
      try {
        return await BucksService.getFamilyBalances(familyId);
      } catch (error) {
        console.error('Error getting family balances:', error);
        return [];
      }
    },
    getBucksStatistics: async () => {
      if (!familyId) return null;
      try {
        return await BucksService.getBucksStatistics(familyId);
      } catch (error) {
        console.error('Error getting bucks statistics:', error);
        return null;
      }
    },
    updateBucksSettings: async (settings) => {
      if (!familyId) throw new Error("No family ID available");
      try {
        return await BucksService.updateBucksSettings(familyId, settings);
      } catch (error) {
        console.error('Error updating bucks settings:', error);
        throw error;
      }
    },
    
    // Calendar integration
    createCalendarEvent,
    
    // Child selection actions
    selectChild,
    
    // Reload functions
    refreshChores: loadChildChores,
    refreshRewards: loadChildRewards,
    refreshBalance: loadBucksBalance
  };

  return (
    <ChoreContext.Provider value={value}>
      {children}
    </ChoreContext.Provider>
  );
}

export default ChoreContext;