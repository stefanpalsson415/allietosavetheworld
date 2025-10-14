// src/hooks/useHabitManager.js
import { useState, useCallback, useEffect } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { doc, getDoc, collection, getDocs, query, where, 
         setDoc, updateDoc, increment, serverTimestamp, 
         orderBy, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { generateHabitForCategory } from '../utils/ImbalanceHabitGenerator';
import HabitGenerationService from '../services/HabitGenerationService';

/**
 * Custom hook for managing habits in the family context
 * Provides functions for creating, tracking, and completing habits
 */
const useHabitManager = () => {
  const { family, selectedUser, createCelebration } = useFamily();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userHabits, setUserHabits] = useState([]);
  const [currentWeek, setCurrentWeek] = useState(1);

  // Load habits on mount
  useEffect(() => {
    if (family?.id && selectedUser?.id) {
      fetchHabits();
      
      // Try to determine current week from localStorage or defaults to 1
      const storedWeek = localStorage.getItem('currentCycleWeek');
      if (storedWeek) {
        setCurrentWeek(parseInt(storedWeek, 10) || 1);
      }
    }
  }, [family?.id, selectedUser?.id]);

  /**
   * Fetch habits for the current user and family
   */
  const fetchHabits = useCallback(async () => {
    if (!family?.id) return [];
    
    setLoading(true);
    setError(null);
    
    try {
      // Get habit summary for streak data
      const habitSummaryRef = doc(db, 'families', family.id, 'habitSummary', 'stats');
      const habitSummaryDoc = await getDoc(habitSummaryRef);
      const streakData = habitSummaryDoc.exists() ? habitSummaryDoc.data() : {};
      
      // Query habits collection
      const habitsQuery = query(
        collection(db, 'families', family.id, 'habits'),
        where('archived', '!=', true)
      );
      
      const habitsSnapshot = await getDocs(habitsQuery);
      const habitsList = [];
      
      for (const doc of habitsSnapshot.docs) {
        const habitData = doc.data();
        
        // Skip if this habit isn't for the current user and not a family habit
        if (habitData.assignedTo && 
            habitData.assignedTo !== selectedUser.id && 
            habitData.assignedTo !== selectedUser.roleType) {
          continue;
        }
        
        // Get streak data
        const streak = streakData[doc.id] || 0;
        const record = streakData[`${doc.id}_record`] || streak;
        
        // Calculate progress
        const completedSubtasks = habitData.subTasks?.filter(st => st.completed)?.length || 0;
        const totalSubtasks = habitData.subTasks?.length || 1;
        const progress = habitData.completed ? 100 : Math.round((completedSubtasks / totalSubtasks) * 100);
        
        // Get completion instances
        const completionInstances = await getHabitCompletionInstances(doc.id) || [];
        
        // Create habit object
        const habit = {
          id: doc.id,
          title: habitData.title || "Habit",
          description: habitData.description || "",
          cue: habitData.cue || habitData.subTasks?.[0]?.title || "",
          action: habitData.action || habitData.subTasks?.[1]?.title || "",
          reward: habitData.reward || habitData.subTasks?.[2]?.title || "",
          identity: habitData.identity || habitData.focusArea || "",
          assignedTo: habitData.assignedTo,
          assignedToName: habitData.assignedToName,
          category: habitData.category || "",
          focusArea: habitData.focusArea || "",
          insight: habitData.insight || habitData.habitExplanation || "",
          completed: habitData.completed || false,
          streak: streak || 0,
          record: record || 0,
          progress: progress,
          practiceCount: completionInstances.length,
          lastCompleted: habitData.lastCompleted || null,
          isUserGenerated: habitData.isUserGenerated === true,
          completionInstances,
          atomicSteps: habitData.subTasks || [
            { id: `${doc.id}-step-1`, title: habitData.cue || "Set a cue", completed: false },
            { id: `${doc.id}-step-2`, title: habitData.action || "Take action", completed: false },
            { id: `${doc.id}-step-3`, title: habitData.reward || "Enjoy reward", completed: false }
          ]
        };
        
        habitsList.push(habit);
      }
      
      setUserHabits(habitsList);
      setLoading(false);
      return habitsList;
    } catch (err) {
      console.error("Error fetching habits:", err);
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, [family?.id, selectedUser?.id, selectedUser?.roleType]);

  /**
   * Get completion instances for a specific habit
   */
  const getHabitCompletionInstances = async (habitId) => {
    if (!family?.id) return [];
    
    try {
      const result = [];
      
      // Get the habit completions
      const habitCompletionsRef = doc(db, 'families', family.id, 'habits', habitId, 'completions', 'instances');
      const habitCompletionsDoc = await getDoc(habitCompletionsRef);
      
      if (habitCompletionsDoc.exists()) {
        const data = habitCompletionsDoc.data();
        
        // Convert to array
        Object.keys(data).forEach(key => {
          if (key !== 'count') {
            result.push({
              id: key,
              ...data[key]
            });
          }
        });
        
        // Sort by timestamp descending
        result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
      
      return result;
    } catch (error) {
      console.error("Error getting habit completion instances:", error);
      return [];
    }
  };

  /**
   * Create a new habit for the current user
   */
  const createHabit = useCallback(async (categoryId, customHabit = null) => {
    if (!family?.id || !selectedUser?.id) {
      setError("Missing family or user information");
      return null;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create a unique ID for this habit
      const habitId = `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Use provided custom habit or generate one
      let habitData = customHabit;
      
      if (!habitData) {
        // Generate a habit based on category
        const generated = await HabitGenerationService.generateHabit({
          userId: selectedUser.id,
          family: family,
          userName: selectedUser.name,
          userRole: selectedUser.roleType,
          category: categoryId,
          aiContext: `Create a small, easy to start atomic habit that helps balance family workload for the ${categoryId} category.`
        });
        
        habitData = generated.habit;
      }
      
      // Initialize the habit document
      const habitDoc = {
        id: habitId,
        title: habitData.title || `New ${categoryId} Habit`,
        description: habitData.description || "A new habit to build family balance",
        cue: habitData.cue || "After a specific trigger",
        action: habitData.action || "Perform this action",
        reward: habitData.reward || "Enjoy this benefit",
        identity: habitData.identity || `I am someone who values ${categoryId}`,
        category: categoryId || habitData.category || "Balance Habit",
        focusArea: habitData.focusArea || categoryId,
        assignedTo: selectedUser.id,
        assignedToName: selectedUser.name,
        assignedToRole: selectedUser.roleType,
        completed: false,
        archived: false,
        isUserGenerated: true,
        createdAt: serverTimestamp(),
        createdBy: selectedUser.id,
        insight: habitData.habitExplanation || "",
        habitResearch: habitData.habitResearch || "",
        subTasks: [
          { id: `${habitId}-step-1`, title: habitData.cue || "After a specific trigger", completed: false },
          { id: `${habitId}-step-2`, title: habitData.action || "Perform this action", completed: false },
          { id: `${habitId}-step-3`, title: habitData.reward || "Enjoy this benefit", completed: false }
        ]
      };
      
      // Save to database
      const habitRef = doc(db, 'families', family.id, 'habits', habitId);
      await setDoc(habitRef, habitDoc);
      
      // Update local state
      const newHabit = {
        ...habitDoc,
        streak: 0,
        record: 0,
        progress: 0,
        practiceCount: 0,
        completionInstances: [],
        atomicSteps: habitDoc.subTasks
      };
      
      setUserHabits(prev => [newHabit, ...prev]);
      setLoading(false);
      
      return newHabit;
    } catch (err) {
      console.error("Error creating habit:", err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, [family?.id, selectedUser?.id, selectedUser?.name, selectedUser?.roleType]);

  /**
   * Record a habit practice completion
   */
  const recordHabitPractice = useCallback(async (habitId, notes = "") => {
    if (!family?.id || !selectedUser?.id) {
      setError("Missing family or user information");
      return false;
    }
    
    if (!habitId) {
      setError("No habit ID provided");
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Create timestamp
      const timestamp = new Date().toISOString();
      
      // Create a unique ID for this completion
      const completionId = `comp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // Update the habit document first (mark as completed)
      const habitRef = doc(db, 'families', family.id, 'habits', habitId);
      await updateDoc(habitRef, {
        completed: true,
        lastCompleted: timestamp
      });
      
      // Add the completion instance in a subcollection
      const habitCompletionsRef = doc(db, 'families', family.id, 'habits', habitId, 'completions', 'instances');
      
      // Create instance data
      const instanceData = {
        [completionId]: {
          timestamp,
          userId: selectedUser.id,
          userName: selectedUser.name || 'Family Member',
          notes: notes || ''
        }
      };
      
      // First try updating
      try {
        await updateDoc(habitCompletionsRef, {
          ...instanceData,
          count: increment(1)
        });
      } catch (error) {
        // If doesn't exist yet, create
        await setDoc(habitCompletionsRef, {
          ...instanceData,
          count: 1
        });
      }
      
      // Update streak in family habits summary
      const summaryRef = doc(db, 'families', family.id, 'habitSummary', 'stats');
      
      // Get current data
      const summaryDoc = await getDoc(summaryRef);
      let currentData = {};
      
      if (summaryDoc.exists()) {
        currentData = summaryDoc.data();
      }
      
      // Update streaks
      const currentHabitStreak = (currentData[habitId] || 0) + 1;
      const currentHabitRecord = Math.max(currentHabitStreak, currentData[`${habitId}_record`] || 0);
      
      // Update the summary document
      const updateData = {
        [habitId]: currentHabitStreak,
        [`${habitId}_record`]: currentHabitRecord,
        [`${habitId}_last`]: timestamp,
        lastUpdated: serverTimestamp()
      };
      
      // Also update family streak if this is a family habit
      if (currentData.familyHabitIds?.includes(habitId)) {
        const currentFamilyStreak = (currentData.familyStreak || 0) + 1;
        const currentFamilyRecord = Math.max(currentFamilyStreak, currentData.familyLongestStreak || 0);
        
        updateData.familyStreak = currentFamilyStreak;
        updateData.familyLongestStreak = currentFamilyRecord;
        updateData.familyLastCompleted = timestamp;
      }
      
      await updateDoc(summaryRef, updateData);
      
      // Update local state
      setUserHabits(prevHabits => 
        prevHabits.map(habit => 
          habit.id === habitId 
            ? {
                ...habit, 
                completed: true,
                lastCompleted: timestamp,
                streak: currentHabitStreak,
                record: currentHabitRecord,
                practiceCount: (habit.practiceCount || 0) + 1,
                completionInstances: [
                  {
                    id: completionId,
                    timestamp,
                    userId: selectedUser.id,
                    userName: selectedUser.name || 'Family Member',
                    notes: notes || ''
                  },
                  ...habit.completionInstances || []
                ]
              }
            : habit
        )
      );
      
      setLoading(false);
      
      // Find the updated habit to check completions
      const updatedHabit = userHabits.find(h => h.id === habitId);
      const updatedCount = (updatedHabit?.practiceCount || 0) + 1;
      
      // Check if this completes the 5 practices threshold
      if (updatedCount >= 5) {
        // Handle cycle progression
        try {
          // Create the user progress document in the cycle collection
          const cycleRef = doc(db, 'families', family.id, 'cycles', `cycle_${currentWeek}`);
          const cycleDoc = await getDoc(cycleRef);
          
          // Create base document if it doesn't exist
          if (!cycleDoc.exists()) {
            await setDoc(cycleRef, {
              cycleNumber: currentWeek,
              startDate: new Date().toISOString(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              memberProgress: {}
            });
          }
          
          // Update the member progress subdocument
          await updateDoc(cycleRef, {
            [`memberProgress.${selectedUser.id}`]: {
              step: 2, // Completed habit practices, ready for survey
              habitCompleted: true,
              habitCompletedDate: timestamp,
              habitId: habitId,
              practiceCount: updatedCount,
              updatedAt: serverTimestamp()
            },
            updatedAt: serverTimestamp()
          });
          
          // Show celebration
          if (createCelebration) {
            createCelebration("Practices Completed!", true, 
              "You've completed all required habit practices for this cycle. The survey is now available!");
          }
        } catch (err) {
          console.error("Error updating cycle progress:", err);
        }
      } else if (updatedCount === 4) {
        // Almost there notification
        if (createCelebration) {
          createCelebration("Almost There!", true, 
            "You're one practice away from completing your habit requirement for this cycle!");
        }
      }
      
      return true;
    } catch (err) {
      console.error("Error recording habit practice:", err);
      setError(err.message);
      setLoading(false);
      return false;
    }
  }, [family?.id, selectedUser?.id, selectedUser?.name, userHabits, createCelebration, currentWeek]);

  /**
   * Get personalized habit suggestions based on imbalance data
   */
  const getHabitSuggestions = useCallback(async (imbalanceData) => {
    if (!imbalanceData) {
      setError("No imbalance data provided");
      return [];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get the dominant category with highest imbalance
      const categories = imbalanceData.imbalances || [];
      if (!categories.length) return [];
      
      // Sort by imbalance percentage (highest first)
      categories.sort((a, b) => b.imbalancePercent - a.imbalancePercent);
      
      // Generate habits for top categories
      const suggestions = [];
      
      for (let i = 0; i < Math.min(3, categories.length); i++) {
        const category = categories[i];
        if (category.imbalancePercent < 5) continue; // Skip if minimal imbalance
        
        // Generate a habit for this category
        const habitData = generateHabitForCategory(
          category.category,
          category.imbalancePercent,
          category.dominantRole,
          selectedUser?.roleType || 'Parent'
        );
        
        if (habitData) {
          suggestions.push({
            ...habitData,
            category: category.category,
            imbalancePercent: category.imbalancePercent,
            dominantRole: category.dominantRole
          });
        }
      }
      
      setLoading(false);
      return suggestions;
    } catch (err) {
      console.error("Error getting habit suggestions:", err);
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, [selectedUser?.roleType]);

  /**
   * Carry over a habit to the next cycle
   */
  const carryOverHabit = useCallback(async (habitId) => {
    if (!family?.id || !selectedUser?.id) {
      setError("Missing family or user information");
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get the current habit
      const habitRef = doc(db, 'families', family.id, 'habits', habitId);
      const habitDoc = await getDoc(habitRef);
      
      if (!habitDoc.exists()) {
        throw new Error("Habit not found");
      }
      
      const habitData = habitDoc.data();
      
      // Create a new habit ID for the carried over habit
      const newHabitId = `habit-${Date.now()}-carry-${Math.random().toString(36).substr(2, 5)}`;
      
      // Copy the habit data but reset practice count and completion status
      const newHabitData = {
        ...habitData,
        id: newHabitId,
        completed: false,
        carriedOver: true,
        carriedOverFrom: habitId,
        previousCycle: habitData.cycle || "unknown",
        cycle: habitData.cycle ? habitData.cycle + 1 : 1,
        createdAt: serverTimestamp(),
        lastCompleted: null
      };
      
      // Create the new habit document
      const newHabitRef = doc(db, 'families', family.id, 'habits', newHabitId);
      await setDoc(newHabitRef, newHabitData);
      
      // Mark the old habit as archived
      await updateDoc(habitRef, {
        archived: true,
        archivedAt: serverTimestamp(),
        archivedReason: "carried-over",
        carriedOverTo: newHabitId
      });
      
      // Update local state
      const newHabit = {
        ...newHabitData,
        streak: 0, // Reset streak for the new cycle
        record: habitData.record || 0, // Keep the record
        progress: 0,
        practiceCount: 0,
        completionInstances: [],
        atomicSteps: habitData.subTasks || [
          { id: `${newHabitId}-step-1`, title: habitData.cue || "Set a cue", completed: false },
          { id: `${newHabitId}-step-2`, title: habitData.action || "Take action", completed: false },
          { id: `${newHabitId}-step-3`, title: habitData.reward || "Enjoy reward", completed: false }
        ]
      };
      
      // Update local state
      setUserHabits(prev => {
        // Remove old habit and add new one
        const filtered = prev.filter(h => h.id !== habitId);
        return [newHabit, ...filtered];
      });
      
      setLoading(false);
      return newHabit;
    } catch (err) {
      console.error("Error carrying over habit:", err);
      setError(err.message);
      setLoading(false);
      return false;
    }
  }, [family?.id, selectedUser?.id]);

  /**
   * Reset current habit with confirmation flow
   */
  const resetHabit = useCallback(async (habitId) => {
    if (!family?.id || !selectedUser?.id) {
      setError("Missing family or user information");
      return false;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get the current habit
      const habitRef = doc(db, 'families', family.id, 'habits', habitId);
      const habitDoc = await getDoc(habitRef);
      
      if (!habitDoc.exists()) {
        throw new Error("Habit not found");
      }
      
      // Mark the habit as archived
      await updateDoc(habitRef, {
        archived: true,
        archivedAt: serverTimestamp(),
        archivedReason: "reset",
        resetBy: selectedUser.id
      });
      
      // Update local state
      setUserHabits(prev => prev.filter(h => h.id !== habitId));
      
      setLoading(false);
      return true;
    } catch (err) {
      console.error("Error resetting habit:", err);
      setError(err.message);
      setLoading(false);
      return false;
    }
  }, [family?.id, selectedUser?.id]);

  /**
   * Get habit history with streak information
   */
  const getHabitHistory = useCallback(async () => {
    if (!family?.id) {
      setError("Missing family information");
      return [];
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Get all habits including archived ones
      const habitsQuery = query(
        collection(db, 'families', family.id, 'habits'),
        orderBy('createdAt', 'desc'),
        limit(50) // Limit to last 50 habits for performance
      );
      
      const habitsSnapshot = await getDocs(habitsQuery);
      const habitsList = [];
      
      // Get streak data
      const habitSummaryRef = doc(db, 'families', family.id, 'habitSummary', 'stats');
      const habitSummaryDoc = await getDoc(habitSummaryRef);
      const streakData = habitSummaryDoc.exists() ? habitSummaryDoc.data() : {};
      
      for (const doc of habitsSnapshot.docs) {
        const habitData = doc.data();
        
        // Skip if this habit isn't for the current user and not a family habit
        if (habitData.assignedTo && 
            habitData.assignedTo !== selectedUser.id && 
            habitData.assignedTo !== selectedUser.roleType) {
          continue;
        }
        
        // Get streak data
        const streak = streakData[doc.id] || 0;
        const record = streakData[`${doc.id}_record`] || streak;
        
        // Get completion count
        const completionInstances = await getHabitCompletionInstances(doc.id) || [];
        
        // Create habit history object
        const habit = {
          id: doc.id,
          title: habitData.title || "Habit",
          description: habitData.description || "",
          category: habitData.category || "",
          archived: habitData.archived || false,
          createdAt: habitData.createdAt ? new Date(habitData.createdAt.toDate()) : null,
          archivedAt: habitData.archivedAt ? new Date(habitData.archivedAt.toDate()) : null,
          archivedReason: habitData.archivedReason || null,
          streak: streak || 0,
          record: record || 0,
          completionCount: completionInstances.length,
          lastCompleted: habitData.lastCompleted ? new Date(habitData.lastCompleted) : null,
          carriedOver: habitData.carriedOver || false,
          carriedOverFrom: habitData.carriedOverFrom || null,
          carriedOverTo: habitData.carriedOverTo || null,
          cycle: habitData.cycle || null
        };
        
        habitsList.push(habit);
      }
      
      setLoading(false);
      return habitsList;
    } catch (err) {
      console.error("Error getting habit history:", err);
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, [family?.id, selectedUser?.id, selectedUser?.roleType]);

  /**
   * Save current habit for next cycle
   */
  const saveHabitForNextCycle = useCallback(async (habitId) => {
    // This is just an alias for carryOverHabit with a clearer name
    return carryOverHabit(habitId);
  }, [carryOverHabit]);

  // Return the hook interface
  return {
    userHabits,
    loading,
    error,
    createHabit,
    recordHabitPractice,
    getHabitSuggestions,
    carryOverHabit,
    resetHabit,
    getHabitHistory,
    fetchHabits,
    saveHabitForNextCycle,
    currentWeek
  };
};

export default useHabitManager;