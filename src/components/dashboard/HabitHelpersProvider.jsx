// src/components/dashboard/HabitHelpersProvider.jsx
import React, { useEffect, useState } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useHabitHelpers } from '../../hooks/useHabitHelpers';

/**
 * This component enhances habits with helper data loaded from Firebase
 * It ensures habit helpers persist across sessions
 */
const HabitHelpersProvider = ({ habits, onHabitsUpdate, children }) => {
  const [enhancedHabits, setEnhancedHabits] = useState(habits || []);
  const { familyMembers } = useFamily();
  const { habitHelpers, loading } = useHabitHelpers();
  
  // Update the habits with helper data
  useEffect(() => {
    if (loading || !habits || !familyMembers) return;
    
    const updatedHabits = habits.map(habit => {
      // If this habit already has a helper, keep it
      if (habit.helperChild) {
        return habit;
      }
      
      // Check if there's a helper for this habit in our loaded data
      const helper = habitHelpers[habit.id];
      if (!helper) {
        return habit;
      }
      
      // Find the child in family members
      const helperChild = familyMembers.find(m => m.id === helper.childId);
      const helperName = helperChild?.name || 'Helper';
      
      // Return updated habit with helper data
      return {
        ...habit,
        helperChild: helper.childId,
        helperRole: helper.role,
        helperName
      };
    });
    
    // Only update if something changed
    const hasChanges = JSON.stringify(updatedHabits) !== JSON.stringify(enhancedHabits);
    if (hasChanges) {
      console.log("Updating habits with helper data:", updatedHabits);
      setEnhancedHabits(updatedHabits);
      
      // Notify parent component
      if (onHabitsUpdate) {
        onHabitsUpdate(updatedHabits);
      }
    }
  }, [habits, habitHelpers, loading, familyMembers, onHabitsUpdate]);
  
  // Render children with enhanced habits
  return children(enhancedHabits);
};

export default HabitHelpersProvider;