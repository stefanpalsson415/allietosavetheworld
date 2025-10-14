// src/hooks/useEnhancedHabitHelpers.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import HabitHelperService from '../services/HabitHelperService';
import HabitCyclesService from '../services/HabitCyclesService';

/**
 * Enhanced hook to streamline habit management functionality
 * Combines habit helpers, cycle management, and habit operations
 */
const useEnhancedHabitHelpers = () => {
  const { familyId, familyMembers } = useFamily();
  
  // Habit helpers state
  const [habitHelpers, setHabitHelpers] = useState({});
  const [allHabits, setAllHabits] = useState([]);
  const [activeHabits, setActiveHabits] = useState([]);
  const [archivedHabits, setArchivedHabits] = useState([]);
  
  // Track loading and error states for different operations
  const [loadingState, setLoadingState] = useState({
    helpers: true,
    habits: true,
    operations: false
  });
  
  const [errorState, setErrorState] = useState({
    helpers: null,
    habits: null,
    operations: null
  });

  // Status tracking
  const [statusMessages, setStatusMessages] = useState([]);
  const [operationInProgress, setOperationInProgress] = useState(false);
  
  // Memoized flag for any loading in progress
  const isLoading = useMemo(() => 
    Object.values(loadingState).some(state => state === true), 
    [loadingState]
  );
  
  // Load helpers when family ID changes
  useEffect(() => {
    if (!familyId) {
      setLoadingState(prev => ({ ...prev, helpers: false }));
      return;
    }

    const loadHabitHelpers = async () => {
      try {
        setLoadingState(prev => ({ ...prev, helpers: true }));
        setErrorState(prev => ({ ...prev, helpers: null }));
        
        addStatusMessage("Loading habit helpers...");
        const helpers = await HabitHelperService.getHabitHelpers(familyId);
        
        // Convert to a lookup object for easier access
        const helperMap = {};
        helpers.forEach(habit => {
          if (habit.id && habit.helperChild) {
            helperMap[habit.id] = {
              childId: habit.helperChild,
              role: habit.helperRole,
              lastUpdated: habit.lastUpdated
            };
          }
        });
        
        setHabitHelpers(helperMap);
        addStatusMessage(`Loaded ${Object.keys(helperMap).length} habit helpers`);
      } catch (err) {
        console.error("Error loading habit helpers:", err);
        setErrorState(prev => ({ ...prev, helpers: err.message }));
        addStatusMessage("Error loading habit helpers", "error");
      } finally {
        setLoadingState(prev => ({ ...prev, helpers: false }));
      }
    };

    loadHabitHelpers();
  }, [familyId]);

  // Load all habits when family ID changes
  useEffect(() => {
    if (!familyId) {
      setLoadingState(prev => ({ ...prev, habits: false }));
      return;
    }

    const loadAllHabits = async () => {
      try {
        setLoadingState(prev => ({ ...prev, habits: true }));
        setErrorState(prev => ({ ...prev, habits: null }));
        
        addStatusMessage("Loading family habits...");
        const habits = await HabitCyclesService.getHabits(familyId);
        
        setAllHabits(habits);
        
        // Separate active and archived habits
        const active = habits.filter(h => h.status !== 'archived' && !h.archived);
        const archived = habits.filter(h => h.status === 'archived' || h.archived);
        
        setActiveHabits(active);
        setArchivedHabits(archived);
        
        addStatusMessage(`Loaded ${habits.length} habits (${active.length} active)`);
      } catch (err) {
        console.error("Error loading habits:", err);
        setErrorState(prev => ({ ...prev, habits: err.message }));
        addStatusMessage("Error loading habits", "error");
      } finally {
        setLoadingState(prev => ({ ...prev, habits: false }));
      }
    };

    loadAllHabits();
  }, [familyId]);

  // Add a status message
  const addStatusMessage = useCallback((message, type = "info") => {
    const id = Date.now();
    setStatusMessages(prev => [
      ...prev, 
      { id, message, type, timestamp: new Date() }
    ]);
    
    // Auto-remove info messages after 5 seconds
    if (type === "info") {
      setTimeout(() => {
        setStatusMessages(prev => prev.filter(msg => msg.id !== id));
      }, 5000);
    }
  }, []);

  // Clear all status messages
  const clearStatusMessages = useCallback(() => {
    setStatusMessages([]);
  }, []);
  
  // Enhanced function to get the helper for a specific habit with more details
  const getHelperForHabit = useCallback((habitId) => {
    if (!habitId || !habitHelpers[habitId]) return null;
    
    const helper = habitHelpers[habitId];
    const childData = familyMembers?.find(m => m.id === helper.childId);
    
    return {
      childId: helper.childId,
      role: helper.role,
      childData,
      lastUpdated: helper.lastUpdated
    };
  }, [habitHelpers, familyMembers]);

  // Function to assign a child as a helper for a habit
  const assignHelper = useCallback(async (habitId, childId, role) => {
    if (!familyId || !habitId || !childId) {
      addStatusMessage("Missing required parameters for assigning helper", "error");
      return false;
    }
    
    try {
      setOperationInProgress(true);
      setLoadingState(prev => ({ ...prev, operations: true }));
      setErrorState(prev => ({ ...prev, operations: null }));
      
      addStatusMessage(`Assigning helper for habit ${habitId}...`);
      
      // Call the service
      await HabitHelperService.assignChildToHabit(familyId, habitId, childId, role);
      
      // Update local state
      setHabitHelpers(prev => ({
        ...prev,
        [habitId]: {
          childId,
          role,
          lastUpdated: new Date().toISOString()
        }
      }));
      
      addStatusMessage("Helper assigned successfully", "success");
      return true;
    } catch (err) {
      console.error("Error assigning helper:", err);
      setErrorState(prev => ({ ...prev, operations: err.message }));
      addStatusMessage(`Error assigning helper: ${err.message}`, "error");
      return false;
    } finally {
      setLoadingState(prev => ({ ...prev, operations: false }));
      setOperationInProgress(false);
    }
  }, [familyId, addStatusMessage]);

  // Track habit completion
  const trackHabitCompletion = useCallback(async (habitId, completionData) => {
    if (!familyId || !habitId) {
      addStatusMessage("Missing required parameters for tracking completion", "error");
      return false;
    }
    
    try {
      setOperationInProgress(true);
      setLoadingState(prev => ({ ...prev, operations: true }));
      setErrorState(prev => ({ ...prev, operations: null }));
      
      addStatusMessage(`Tracking completion for habit ${habitId}...`);
      
      // Add familyId to the data
      const enhancedData = {
        ...completionData,
        familyId
      };
      
      // Call the service
      const updatedHabit = await HabitCyclesService.trackHabitCompletion(habitId, enhancedData);
      
      // Update local state
      setAllHabits(prev => 
        prev.map(h => h.id === habitId ? updatedHabit : h)
      );
      
      setActiveHabits(prev => 
        prev.map(h => h.id === habitId ? updatedHabit : h)
      );
      
      addStatusMessage("Habit completion tracked successfully", "success");
      return updatedHabit;
    } catch (err) {
      console.error("Error tracking habit completion:", err);
      setErrorState(prev => ({ ...prev, operations: err.message }));
      addStatusMessage(`Error tracking habit completion: ${err.message}`, "error");
      return false;
    } finally {
      setLoadingState(prev => ({ ...prev, operations: false }));
      setOperationInProgress(false);
    }
  }, [familyId, addStatusMessage]);

  // Create a new habit
  const createHabit = useCallback(async (habitData) => {
    if (!familyId) {
      addStatusMessage("Missing familyId for creating habit", "error");
      return false;
    }
    
    try {
      setOperationInProgress(true);
      setLoadingState(prev => ({ ...prev, operations: true }));
      setErrorState(prev => ({ ...prev, operations: null }));
      
      addStatusMessage(`Creating new habit...`);
      
      // Add familyId to the data
      const enhancedData = {
        ...habitData,
        familyId,
        createdAt: new Date().toISOString()
      };
      
      // Call the service
      const newHabit = await HabitCyclesService.createHabit(enhancedData);
      
      // Update local state
      setAllHabits(prev => [...prev, newHabit]);
      setActiveHabits(prev => [...prev, newHabit]);
      
      addStatusMessage("Habit created successfully", "success");
      return newHabit;
    } catch (err) {
      console.error("Error creating habit:", err);
      setErrorState(prev => ({ ...prev, operations: err.message }));
      addStatusMessage(`Error creating habit: ${err.message}`, "error");
      return false;
    } finally {
      setLoadingState(prev => ({ ...prev, operations: false }));
      setOperationInProgress(false);
    }
  }, [familyId, addStatusMessage]);

  // Batch operations
  const batchAssignHelpers = useCallback(async (assignments) => {
    if (!familyId || !assignments || assignments.length === 0) {
      addStatusMessage("No helper assignments provided", "error");
      return false;
    }
    
    try {
      setOperationInProgress(true);
      setLoadingState(prev => ({ ...prev, operations: true }));
      setErrorState(prev => ({ ...prev, operations: null }));
      
      addStatusMessage(`Assigning ${assignments.length} helpers in batch...`);
      
      const results = [];
      let successCount = 0;
      
      for (const assignment of assignments) {
        const { habitId, childId, role } = assignment;
        
        try {
          await HabitHelperService.assignChildToHabit(familyId, habitId, childId, role);
          results.push({ habitId, success: true });
          successCount++;
          
          // Update local state
          setHabitHelpers(prev => ({
            ...prev,
            [habitId]: {
              childId,
              role,
              lastUpdated: new Date().toISOString()
            }
          }));
        } catch (err) {
          console.error(`Error assigning helper for habit ${habitId}:`, err);
          results.push({ habitId, success: false, error: err.message });
        }
      }
      
      addStatusMessage(`Batch completed: ${successCount}/${assignments.length} successful`, 
        successCount === assignments.length ? "success" : "warning");
      
      return results;
    } catch (err) {
      console.error("Error in batch assignments:", err);
      setErrorState(prev => ({ ...prev, operations: err.message }));
      addStatusMessage(`Error in batch operations: ${err.message}`, "error");
      return false;
    } finally {
      setLoadingState(prev => ({ ...prev, operations: false }));
      setOperationInProgress(false);
    }
  }, [familyId, addStatusMessage]);

  // Reload all data
  const refreshData = useCallback(async () => {
    if (!familyId) return;
    
    try {
      setLoadingState({ helpers: true, habits: true, operations: false });
      setErrorState({ helpers: null, habits: null, operations: null });
      
      addStatusMessage("Refreshing all habit data...");
      
      // Load helpers
      const helpers = await HabitHelperService.getHabitHelpers(familyId);
      
      // Convert to a lookup object for easier access
      const helperMap = {};
      helpers.forEach(habit => {
        if (habit.id && habit.helperChild) {
          helperMap[habit.id] = {
            childId: habit.helperChild,
            role: habit.helperRole,
            lastUpdated: habit.lastUpdated
          };
        }
      });
      
      setHabitHelpers(helperMap);
      
      // Load habits
      const habits = await HabitCyclesService.getHabits(familyId);
      
      setAllHabits(habits);
      
      // Separate active and archived habits
      const active = habits.filter(h => h.status !== 'archived' && !h.archived);
      const archived = habits.filter(h => h.status === 'archived' || h.archived);
      
      setActiveHabits(active);
      setArchivedHabits(archived);
      
      addStatusMessage("Data refreshed successfully", "success");
    } catch (err) {
      console.error("Error refreshing data:", err);
      setErrorState(prev => ({ ...prev, operations: err.message }));
      addStatusMessage(`Error refreshing data: ${err.message}`, "error");
    } finally {
      setLoadingState({ helpers: false, habits: false, operations: false });
    }
  }, [familyId, addStatusMessage]);

  // Get habits with helper info combined
  const getHabitsWithHelperInfo = useMemo(() => {
    return activeHabits.map(habit => {
      const helper = getHelperForHabit(habit.id);
      return {
        ...habit,
        helper: helper ? {
          childId: helper.childId,
          role: helper.role,
          childData: helper.childData
        } : null
      };
    });
  }, [activeHabits, getHelperForHabit]);

  // Get habits by category
  const getHabitsByCategory = useCallback((category) => {
    if (!category) return activeHabits;
    
    return activeHabits.filter(habit => 
      habit.category === category || 
      (habit.categories && habit.categories.includes(category))
    );
  }, [activeHabits]);

  // Get habits by assigned member
  const getHabitsByMember = useCallback((memberId) => {
    if (!memberId) return [];
    
    return activeHabits.filter(habit => 
      habit.assignedTo === memberId || 
      (habit.assignedToId && habit.assignedToId === memberId)
    );
  }, [activeHabits]);

  // Get habits with helper matching a specific child
  const getHabitsWithHelper = useCallback((childId) => {
    if (!childId) return [];
    
    const habitIds = Object.entries(habitHelpers)
      .filter(([_, helper]) => helper.childId === childId)
      .map(([habitId]) => habitId);
    
    return activeHabits.filter(habit => habitIds.includes(habit.id));
  }, [habitHelpers, activeHabits]);

  // Check if a habit is in a streak (3+ consecutive completions)
  const isHabitInStreak = useCallback((habitId) => {
    if (!habitId) return false;
    
    const habit = activeHabits.find(h => h.id === habitId);
    if (!habit) return false;
    
    // Count recent completions
    const completions = habit.completionInstances || [];
    
    if (completions.length < 3) return false;
    
    // Sort by date descending
    const sortedCompletions = [...completions].sort((a, b) => {
      const dateA = a.completedAt ? new Date(a.completedAt) : new Date(0);
      const dateB = b.completedAt ? new Date(b.completedAt) : new Date(0);
      return dateB - dateA;
    });
    
    // Check the 3 most recent
    const recent = sortedCompletions.slice(0, 3);
    
    // Ensure they are within 3 days of each other
    const dates = recent.map(c => new Date(c.completedAt));
    
    // Check consecutive days
    for (let i = 1; i < dates.length; i++) {
      const diffDays = Math.abs(Math.round((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24)));
      if (diffDays > 3) return false;
    }
    
    return true;
  }, [activeHabits]);

  return {
    // Data
    habitHelpers,
    allHabits,
    activeHabits,
    archivedHabits,
    getHabitsWithHelperInfo,
    
    // Helper management
    getHelperForHabit,
    assignHelper,
    batchAssignHelpers,
    
    // Habit operations
    createHabit,
    trackHabitCompletion,
    
    // Filtering
    getHabitsByCategory,
    getHabitsByMember,
    getHabitsWithHelper,
    
    // Analysis
    isHabitInStreak,
    
    // Status
    isLoading,
    loadingState,
    errorState,
    operationInProgress,
    statusMessages,
    clearStatusMessages,
    
    // Utilities
    refreshData
  };
};

export default useEnhancedHabitHelpers;