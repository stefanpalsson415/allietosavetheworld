// src/hooks/useHabitHelpers.js
import { useState, useEffect } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import HabitHelperService from '../services/HabitHelperService';

/**
 * Hook to load and manage habit helpers
 */
export const useHabitHelpers = () => {
  const { familyId, familyMembers } = useFamily();
  const [habitHelpers, setHabitHelpers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load helpers when family ID changes
  useEffect(() => {
    if (!familyId) {
      setLoading(false);
      return;
    }

    const loadHabitHelpers = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Loading habit helpers for family:", familyId);
        
        const helpers = await HabitHelperService.getHabitHelpers(familyId);
        console.log("Found habit helpers:", helpers);
        
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
      } catch (err) {
        console.error("Error loading habit helpers:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHabitHelpers();
  }, [familyId]);

  // Function to get the helper for a specific habit
  const getHelperForHabit = (habitId) => {
    if (!habitId || !habitHelpers[habitId]) return null;
    
    const helper = habitHelpers[habitId];
    const childData = familyMembers?.find(m => m.id === helper.childId);
    
    return {
      childId: helper.childId,
      role: helper.role,
      childData
    };
  };

  // Function to update a helper in state
  const updateHelper = (habitId, childId, role) => {
    setHabitHelpers(prev => ({
      ...prev,
      [habitId]: {
        childId,
        role,
        lastUpdated: new Date().toISOString()
      }
    }));
  };

  return {
    habitHelpers,
    getHelperForHabit,
    updateHelper,
    loading,
    error
  };
};