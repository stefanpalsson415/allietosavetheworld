// src/hooks/useHabitCycles.js
import { useState, useEffect, useCallback } from 'react';
import { useFamily } from '../contexts/FamilyContext';
import { format, addDays, parseISO, isAfter } from 'date-fns';

/**
 * Hook to manage habit cycles and transitions
 */
const useHabitCycles = (habitService) => {
  const { familyId } = useFamily();
  const [currentCycle, setCurrentCycle] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCycleTransition, setShowCycleTransition] = useState(false);
  const [currentHabits, setCurrentHabits] = useState([]);

  // Load current cycle and cycles history
  useEffect(() => {
    if (!familyId || !habitService) return;

    const loadCycles = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current cycle and history
        const [cycleData, habitsData] = await Promise.all([
          habitService.getHabitCycles(familyId),
          habitService.getHabits(familyId)
        ]);
        
        const sortedCycles = cycleData.sort(
          (a, b) => parseISO(b.startDate) - parseISO(a.startDate)
        );
        
        setCycles(sortedCycles);
        setCurrentHabits(habitsData);
        
        // Set current cycle (most recent)
        if (sortedCycles.length > 0) {
          setCurrentCycle(sortedCycles[0]);
          
          // Check if we need to start a new cycle
          const now = new Date();
          const cycleEndDate = parseISO(sortedCycles[0].endDate);
          
          if (isAfter(now, cycleEndDate)) {
            // We're past the cycle end date, show transition dialog
            setShowCycleTransition(true);
          }
        }
      } catch (err) {
        console.error("Error loading habit cycles:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCycles();
  }, [familyId, habitService]);

  // Create a new cycle based on carried over habits
  const startNewCycle = useCallback(async (habitsToCarryOver) => {
    if (!familyId || !habitService) return;
    
    try {
      setLoading(true);
      
      // Default cycle length (28 days)
      const cycleDuration = 28;
      const startDate = new Date();
      const endDate = addDays(startDate, cycleDuration);
      
      // Create new cycle
      const newCycleData = {
        familyId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        name: `Cycle ${cycles.length + 1}`,
        status: 'active'
      };
      
      const newCycle = await habitService.createHabitCycle(newCycleData);
      
      // Carry over selected habits
      if (habitsToCarryOver && habitsToCarryOver.length > 0) {
        for (const habit of habitsToCarryOver) {
          await habitService.createHabit({
            ...habit,
            id: undefined, // Remove original ID to create a new habit
            cycleId: newCycle.id,
            startDate: startDate.toISOString(),
            progress: 0,
            dailyTracking: {},
            carryOver: true,
            previousHabitId: habit.id
          });
        }
      }
      
      // Archive previous cycle
      if (currentCycle) {
        await habitService.updateHabitCycle(currentCycle.id, {
          status: 'completed'
        });
      }
      
      // Reload cycles and habits
      const [refreshedCycles, refreshedHabits] = await Promise.all([
        habitService.getHabitCycles(familyId),
        habitService.getHabits(familyId)
      ]);
      
      const sortedCycles = refreshedCycles.sort(
        (a, b) => parseISO(b.startDate) - parseISO(a.startDate)
      );
      
      setCycles(sortedCycles);
      setCurrentCycle(sortedCycles[0]);
      setCurrentHabits(refreshedHabits);
      setShowCycleTransition(false);
      
      return newCycle;
    } catch (err) {
      console.error("Error starting new cycle:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [familyId, habitService, currentCycle, cycles.length]);

  // Format dates for presentation
  const getFormattedDates = useCallback(() => {
    if (!currentCycle) return { cycleEndDate: '', cycleStartDate: '' };
    
    const endDate = parseISO(currentCycle.endDate);
    const nextStartDate = addDays(endDate, 1);
    
    return {
      cycleEndDate: format(endDate, 'MMM dd, yyyy'),
      cycleStartDate: format(nextStartDate, 'MMM dd, yyyy')
    };
  }, [currentCycle]);

  return {
    currentCycle,
    cycles,
    currentHabits,
    loading,
    error,
    showCycleTransition,
    startNewCycle,
    getFormattedDates,
    dismissTransition: () => setShowCycleTransition(false)
  };
};

export default useHabitCycles;