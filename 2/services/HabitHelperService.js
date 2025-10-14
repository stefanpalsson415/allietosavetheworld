// src/services/HabitHelperService.js
import { doc, getDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, setDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Service for managing habit helpers
 */
class HabitHelperService {
  /**
   * Assign a child as a helper for a specific habit
   * Tries multiple potential database paths to handle different database structures
   */
  async assignChildToHabit(familyId, habitId, childId, helperRole) {
    console.log(`Assigning child ${childId} as helper for habit ${habitId} in family ${familyId}`);
    
    if (!familyId || !habitId || !childId) {
      console.error("Missing required parameters:", { familyId, habitId, childId });
      throw new Error("Missing required parameters");
    }
    
    // Data to save
    const helperData = {
      helperChild: childId,
      helperRole: helperRole,
      lastUpdated: serverTimestamp()
    };
    
    // List of potential strategies to try
    const strategies = [
      this.tryUpdateHabitDirectly,
      this.tryUpdateHabitInFamilyCollection,
      this.tryUpdateFamilyHabitsArray,
      this.tryUpdateUserHabitsCollection
    ];
    
    let lastError = null;
    
    // Try each strategy in order
    for (const strategy of strategies) {
      try {
        const result = await strategy.call(this, familyId, habitId, helperData);
        console.log(`Successfully updated habit using strategy: ${strategy.name}`);
        return result;
      } catch (error) {
        console.log(`Strategy ${strategy.name} failed:`, error);
        lastError = error;
      }
    }
    
    // If we get here, all strategies failed
    console.error("All strategies failed for updating habit:", lastError);
    throw new Error(`Failed to assign helper: ${lastError?.message || "Unknown error"}`);
  }
  
  /**
   * Strategy 1: Update habit directly in top-level habits collection
   */
  async tryUpdateHabitDirectly(familyId, habitId, helperData) {
    const habitRef = doc(db, 'habits', habitId);
    
    // First check if the document exists
    const habitDoc = await getDoc(habitRef);
    if (!habitDoc.exists()) {
      throw new Error("Habit not found in habits collection");
    }
    
    // Add the familyId to ensure it's associated with the right family
    await updateDoc(habitRef, {
      ...helperData,
      familyId: familyId
    });
    
    return { success: true, strategy: "direct_habit" };
  }
  
  /**
   * Strategy 2: Update habit in nested families/{familyId}/habits/{habitId} collection
   */
  async tryUpdateHabitInFamilyCollection(familyId, habitId, helperData) {
    const habitRef = doc(db, 'families', familyId, 'habits', habitId);
    
    // First check if the document exists
    const habitDoc = await getDoc(habitRef);
    if (!habitDoc.exists()) {
      throw new Error("Habit not found in families/{familyId}/habits collection");
    }
    
    await updateDoc(habitRef, helperData);
    return { success: true, strategy: "family_habits_collection" };
  }
  
  /**
   * Strategy 3: Update habits array inside family document
   */
  async tryUpdateFamilyHabitsArray(familyId, habitId, helperData) {
    const familyRef = doc(db, 'families', familyId);
    
    // Get the family document
    const familyDoc = await getDoc(familyRef);
    if (!familyDoc.exists()) {
      throw new Error("Family document not found");
    }
    
    const familyData = familyDoc.data();
    
    // Check if the family has a habits array
    if (!familyData.habits || !Array.isArray(familyData.habits)) {
      throw new Error("Family does not have a habits array field");
    }
    
    // Find and update the specific habit
    const updatedHabits = familyData.habits.map(habit => {
      if (habit.id === habitId) {
        return {
          ...habit,
          helperChild: helperData.helperChild,
          helperRole: helperData.helperRole,
          lastUpdated: new Date().toISOString() // Can't use serverTimestamp here as it's a special type
        };
      }
      return habit;
    });
    
    // Update the family document
    await updateDoc(familyRef, { habits: updatedHabits });
    return { success: true, strategy: "family_habits_array" };
  }
  
  /**
   * Strategy 4: Update in user's habits collection (users/{userId}/habits/{habitId})
   */
  async tryUpdateUserHabitsCollection(familyId, habitId, helperData) {
    // Get all family member users first
    const membersQuery = query(
      collection(db, 'users'),
      where('familyId', '==', familyId)
    );
    
    const membersSnapshot = await getDocs(membersQuery);
    if (membersSnapshot.empty) {
      throw new Error("No users found for family");
    }
    
    let foundHabit = false;
    
    // Try updating the habit in each user's collection
    for (const memberDoc of membersSnapshot.docs) {
      const userId = memberDoc.id;
      const habitRef = doc(db, 'users', userId, 'habits', habitId);
      
      try {
        const habitDoc = await getDoc(habitRef);
        if (habitDoc.exists()) {
          await updateDoc(habitRef, helperData);
          foundHabit = true;
          console.log(`Updated habit in user collection for user: ${userId}`);
        }
      } catch (error) {
        console.log(`Error updating habit for user ${userId}:`, error);
      }
    }
    
    if (!foundHabit) {
      throw new Error("Habit not found in any user's habits collection");
    }
    
    return { success: true, strategy: "user_habits_collection" };
  }
  
  /**
   * Get all helpers assigned to a family's habits
   */
  async getHabitHelpers(familyId) {
    if (!familyId) return [];
    
    try {
      // Try to get habits from family collection first
      const habitsQuery = query(
        collection(db, 'families', familyId, 'habits')
      );
      
      const habitsSnapshot = await getDocs(habitsQuery);
      if (!habitsSnapshot.empty) {
        return habitsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(habit => habit.helperChild);
      }
      
      // If no habits found in collection, try the family document
      const familyRef = doc(db, 'families', familyId);
      const familyDoc = await getDoc(familyRef);
      
      if (familyDoc.exists()) {
        const familyData = familyDoc.data();
        if (familyData.habits && Array.isArray(familyData.habits)) {
          return familyData.habits.filter(habit => habit.helperChild);
        }
      }
      
      // If still nothing, look for top-level habits
      const topLevelHabitsQuery = query(
        collection(db, 'habits'),
        where('familyId', '==', familyId)
      );
      
      const topLevelSnapshot = await getDocs(topLevelHabitsQuery);
      if (!topLevelSnapshot.empty) {
        return topLevelSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(habit => habit.helperChild);
      }
      
      return [];
    } catch (error) {
      console.error("Error fetching habit helpers:", error);
      return [];
    }
  }
}

export default new HabitHelperService();