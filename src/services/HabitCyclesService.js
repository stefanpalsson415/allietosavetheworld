// src/services/HabitCyclesService.js
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  writeBatch,
  setDoc
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Service for managing habit cycles including creation, transitions, and history
 */
class HabitCyclesService {
  /**
   * Get a single habit by ID
   * @param {string} habitId - The habit ID
   * @param {string} familyId - Optional family ID for better lookup
   * @returns {Promise<object|null>} - The habit object or null if not found
   */
  async getHabitById(habitId, familyId = null) {
    try {
      if (!habitId) throw new Error("Habit ID is required");
      
      // If it's a template habit ID, return a template
      if (habitId === 'managing-schedules') {
        return {
          id: habitId,
          title: 'Managing Schedules',
          description: 'Coordinating family calendars, activities, appointments, and avoiding conflicts',
          category: 'Invisible Household Tasks',
          frequency: 'Weekly',
          template: true
        };
      } else if (habitId === 'paying-bills') {
        return {
          id: habitId,
          title: 'Paying Bills',
          description: 'Work on paying bills as part of Household Management',
          category: 'Visible Household Tasks',
          frequency: 'Weekly',
          template: true
        };
      }
      
      // Try to find in family's habits collection first
      if (familyId) {
        try {
          const habitRef = doc(db, 'families', familyId, 'habits', habitId);
          const habitDoc = await getDoc(habitRef);
          
          if (habitDoc.exists()) {
            return { id: habitDoc.id, ...habitDoc.data() };
          }
        } catch (error) {
          console.warn("Error checking family habits collection:", error);
        }
      }
      
      // Try top-level habits collection
      try {
        const habitRef = doc(db, 'habits', habitId);
        const habitDoc = await getDoc(habitRef);
        
        if (habitDoc.exists()) {
          return { id: habitDoc.id, ...habitDoc.data() };
        }
      } catch (error) {
        console.warn("Error checking top-level habits collection:", error);
      }
      
      // If we still haven't found it and have a familyId, search all family habits
      if (familyId) {
        const allHabits = await this.getHabits(familyId);
        const foundHabit = allHabits.find(h => h.id === habitId);
        if (foundHabit) {
          return foundHabit;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting habit by ID:", error);
      throw error;
    }
  }

  /**
   * Get all habits for a family 
   * @param {string} familyId - The family ID
   * @param {string} cycleId - Optional cycle ID to filter by
   * @param {string} userId - Optional user ID to filter by
   * @returns {Promise<Array>} - Array of habits
   */
  async getHabits(familyId, cycleId = null, userId = null) {
    try {
      if (!familyId) throw new Error("Family ID is required");
      
      // Initialize array to store all habits from different sources
      let allHabits = [];
      
      // Try to fetch from the preferred structure (families/familyId/habits)
      try {
        let habitsQuery;
        if (cycleId) {
          habitsQuery = query(
            collection(db, 'families', familyId, 'habits'),
            where('cycleId', '==', cycleId)
          );
        } else {
          habitsQuery = query(
            collection(db, 'families', familyId, 'habits'),
            orderBy('startDate', 'desc')
          );
        }
        
        const habitsSnapshot = await getDocs(habitsQuery);
        
        if (!habitsSnapshot.empty) {
          const familyHabits = habitsSnapshot.docs.map(doc => {
            const habitData = doc.data();
            const habit = { 
              id: doc.id, 
              ...habitData, 
              source: 'family',
              _firestoreDocId: doc.id // Store the actual Firestore document ID
            };
            
            // Debug logging for the problematic habit
            if (habit.id === 'invisible_parenting_emotional_support' || 
                habitData.id === 'invisible_parenting_emotional_support' ||
                habit.title?.toLowerCase().includes('invisible parenting')) {
              console.log(`[DEBUG] Found invisible parenting habit in family collection:`, {
                firestoreDocId: doc.id,
                habitId: habit.id,
                dataId: habitData.id,
                title: habit.title,
                source: 'family'
              });
            }
            
            return habit;
          });
          allHabits = [...allHabits, ...familyHabits];
        }
      } catch (error) {
        console.warn("Error getting habits from family collection:", error);
      }
      
      // Fetch from user's habits collection if userId is provided
      if (userId) {
        try {
          // Look up the user
          const userDoc = await getDoc(doc(db, 'users', userId));
          
          if (userDoc.exists()) {
            // Check for habits in the user document
            const userData = userDoc.data();
            
            // Try to get habits from the user habits collection
            try {
              const userHabitsQuery = query(
                collection(db, 'users', userId, 'habits')
              );
              
              const userHabitsSnapshot = await getDocs(userHabitsQuery);
              
              if (!userHabitsSnapshot.empty) {
                const userHabits = userHabitsSnapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                  source: 'user_collection'
                }));
                
                // Filter by cycleId if needed
                const filteredHabits = cycleId ? 
                  userHabits.filter(h => h.cycleId === cycleId) : userHabits;
                
                // Add to all habits
                allHabits = [...allHabits, ...filteredHabits];
              }
            } catch (subColError) {
              console.warn("Error getting habits from user subcollection:", subColError);
            }
            
            // Also check habits embedded in the user document
            if (userData.habits && typeof userData.habits === 'object') {
              const embeddedHabits = Object.values(userData.habits).map(h => ({
                ...h,
                source: 'user_embedded'
              }));
              
              // Add to all habits
              allHabits = [...allHabits, ...embeddedHabits];
            }
          }
        } catch (userError) {
          console.warn("Error getting user document for habits:", userError);
        }
      }
      
      // Fallback to top-level habits collection (habits) with familyId filter
      try {
        let habitsQuery;
        if (cycleId) {
          habitsQuery = query(
            collection(db, 'habits'),
            where('familyId', '==', familyId),
            where('cycleId', '==', cycleId)
          );
        } else {
          habitsQuery = query(
            collection(db, 'habits'),
            where('familyId', '==', familyId),
            orderBy('startDate', 'desc')
          );
        }
        
        const topLevelSnapshot = await getDocs(habitsQuery);
        
        if (!topLevelSnapshot.empty) {
          const topLevelHabits = topLevelSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            source: 'top_level'
          }));
          
          // Add to all habits
          allHabits = [...allHabits, ...topLevelHabits];
        }
      } catch (error) {
        console.warn("Error getting habits from top-level collection:", error);
      }
      
      // Final fallback - look in the family document itself for an array of habits
      try {
        const familyRef = doc(db, 'families', familyId);
        const familyDoc = await getDoc(familyRef);
        
        if (familyDoc.exists()) {
          const familyData = familyDoc.data();
          if (familyData.habits && Array.isArray(familyData.habits)) {
            const embeddedHabits = familyData.habits
              .filter(habit => !cycleId || habit.cycleId === cycleId)
              .map(habit => ({
                ...habit,
                source: 'family_embedded'
              }));
            
            // Add to all habits
            allHabits = [...allHabits, ...embeddedHabits];
          }
        }
      } catch (error) {
        console.warn("Error getting habits from family document:", error);
      }
      
      // Deduplicate habits based on id
      const uniqueHabits = [];
      const seenIds = new Set();
      
      for (const habit of allHabits) {
        if (habit.id && !seenIds.has(habit.id)) {
          seenIds.add(habit.id);
          uniqueHabits.push(habit);
        } else if (!habit.id) {
          // No id, just add it
          uniqueHabits.push(habit);
        }
      }
      
      
      // Debug: Log where each habit is coming from
      if (uniqueHabits.find(h => h.id === 'invisible_parenting_emotional_support')) {
        console.log('[DEBUG] Found invisible_parenting_emotional_support habit from sources:');
        allHabits.filter(h => h.id === 'invisible_parenting_emotional_support').forEach(h => {
          console.log(`  - Source: ${h.source}`);
        });
      }
      
      return uniqueHabits;
    } catch (error) {
      console.error("Error getting habits:", error);
      throw error;
    }
  }

  /**
   * Get a single habit by ID
   * @param {string} habitId - The habit ID
   * @param {string} familyId - The family ID
   * @returns {Promise<object|null>} - The habit object or null if not found
   */
  async getHabitById(habitId, familyId) {
    try {
      if (!habitId || !familyId) throw new Error("Habit ID and Family ID are required");
      
      // Check if this is a template habit ID
      if (habitId === 'managing-schedules' || habitId === 'paying-bills') {
        // Return a template habit object
        return {
          id: habitId,
          title: habitId === 'managing-schedules' ? 'Managing Schedules' : 'Paying Bills',
          description: habitId === 'managing-schedules' 
            ? 'Coordinating family calendars, activities, appointments, and avoiding conflicts'
            : 'Work on paying bills as part of Household Management',
          category: habitId === 'managing-schedules' ? 'Invisible Household Tasks' : 'Visible Household Tasks',
          frequency: 'Weekly',
          familyId: familyId,
          isTemplate: true
        };
      }
      
      // First try the family's habits collection
      try {
        const habitDoc = await getDoc(doc(db, 'families', familyId, 'habits', habitId));
        if (habitDoc.exists()) {
          return { id: habitDoc.id, ...habitDoc.data() };
        }
      } catch (error) {
        console.warn("Error getting habit from family collection:", error);
      }
      
      // Try top-level habits collection
      try {
        const habitDoc = await getDoc(doc(db, 'habits', habitId));
        if (habitDoc.exists() && habitDoc.data().familyId === familyId) {
          return { id: habitDoc.id, ...habitDoc.data() };
        }
      } catch (error) {
        console.warn("Error getting habit from top-level collection:", error);
      }
      
      // Search for habit by querying collections
      const habits = await this.getHabits(familyId);
      const habit = habits.find(h => h.id === habitId);
      
      return habit || null;
    } catch (error) {
      console.error("Error getting habit by ID:", error);
      throw error;
    }
  }

  /**
   * Get all habit cycles for a family
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} - Array of habit cycles
   */
  async getHabitCycles(familyId) {
    try {
      if (!familyId) throw new Error("Family ID is required");
      
      // Try to fetch from the preferred structure (families/familyId/habitCycles)
      const cyclesQuery = query(
        collection(db, 'families', familyId, 'habitCycles'),
        orderBy('startDate', 'desc')
      );
      
      const cyclesSnapshot = await getDocs(cyclesQuery);
      
      // If we found cycles in the preferred location, return them
      if (!cyclesSnapshot.empty) {
        return cyclesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      // Fallback to top-level habitCycles collection
      const topLevelQuery = query(
        collection(db, 'habitCycles'),
        where('familyId', '==', familyId),
        orderBy('startDate', 'desc')
      );
      
      const topLevelSnapshot = await getDocs(topLevelQuery);
      
      if (!topLevelSnapshot.empty) {
        return topLevelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      // Final fallback - look in the family document for cycles
      const familyRef = doc(db, 'families', familyId);
      const familyDoc = await getDoc(familyRef);
      
      if (familyDoc.exists()) {
        const familyData = familyDoc.data();
        if (familyData.habitCycles && Array.isArray(familyData.habitCycles)) {
          return familyData.habitCycles.sort((a, b) => 
            new Date(b.startDate) - new Date(a.startDate)
          );
        }
      }
      
      // If we've tried everything and found nothing, return empty array
      return [];
    } catch (error) {
      console.error("Error getting habit cycles:", error);
      throw error;
    }
  }

  /**
   * Create a new habit cycle
   * @param {object} cycleData - The cycle data
   * @returns {Promise<object>} - The created cycle
   */
  async createHabitCycle(cycleData) {
    try {
      if (!cycleData.familyId) throw new Error("Family ID is required");
      
      // Ensure required fields are present
      const requiredCycleData = {
        ...cycleData,
        startDate: cycleData.startDate || new Date().toISOString(),
        endDate: cycleData.endDate,
        name: cycleData.name || `Cycle ${new Date().toLocaleDateString()}`,
        status: cycleData.status || 'active',
        createdAt: serverTimestamp()
      };
      
      // Try to create in the preferred structure (families/familyId/habitCycles)
      let cycleRef;
      try {
        cycleRef = await addDoc(
          collection(db, 'families', cycleData.familyId, 'habitCycles'),
          requiredCycleData
        );
        
        return { id: cycleRef.id, ...requiredCycleData };
      } catch (innerError) {
        console.warn("Could not add to nested collection, trying top-level:", innerError);
        
        // Fallback to top-level habitCycles collection
        cycleRef = await addDoc(
          collection(db, 'habitCycles'),
          requiredCycleData
        );
        
        return { id: cycleRef.id, ...requiredCycleData };
      }
    } catch (error) {
      console.error("Error creating habit cycle:", error);
      throw error;
    }
  }

  /**
   * Update an existing habit cycle
   * @param {string} cycleId - The cycle ID
   * @param {object} cycleData - The updated cycle data
   * @returns {Promise<void>}
   */
  async updateHabitCycle(cycleId, cycleData) {
    try {
      if (!cycleId) throw new Error("Cycle ID is required");
      
      // Try to update in all possible locations
      const strategies = [
        // 1. Try nested collection
        async () => {
          if (!cycleData.familyId) {
            throw new Error("Family ID required for nested update");
          }
          
          const cycleRef = doc(db, 'families', cycleData.familyId, 'habitCycles', cycleId);
          const cycleDoc = await getDoc(cycleRef);
          
          if (cycleDoc.exists()) {
            await updateDoc(cycleRef, {
              ...cycleData,
              updatedAt: serverTimestamp()
            });
            return true;
          }
          
          return false;
        },
        
        // 2. Try top-level collection
        async () => {
          const cycleRef = doc(db, 'habitCycles', cycleId);
          const cycleDoc = await getDoc(cycleRef);
          
          if (cycleDoc.exists()) {
            await updateDoc(cycleRef, {
              ...cycleData,
              updatedAt: serverTimestamp()
            });
            return true;
          }
          
          return false;
        },
        
        // 3. Try updating in family document array
        async () => {
          if (!cycleData.familyId) {
            throw new Error("Family ID required for array update");
          }
          
          const familyRef = doc(db, 'families', cycleData.familyId);
          const familyDoc = await getDoc(familyRef);
          
          if (familyDoc.exists()) {
            const familyData = familyDoc.data();
            
            if (familyData.habitCycles && Array.isArray(familyData.habitCycles)) {
              const updatedCycles = familyData.habitCycles.map(cycle => {
                if (cycle.id === cycleId) {
                  return {
                    ...cycle,
                    ...cycleData,
                    updatedAt: new Date().toISOString() // Can't use serverTimestamp here
                  };
                }
                return cycle;
              });
              
              await updateDoc(familyRef, { habitCycles: updatedCycles });
              return true;
            }
          }
          
          return false;
        }
      ];
      
      // Try each strategy in order
      for (const strategy of strategies) {
        try {
          const success = await strategy();
          if (success) return;
        } catch (strategyError) {
          console.warn("Strategy failed:", strategyError);
        }
      }
      
      throw new Error("Could not update cycle in any location");
    } catch (error) {
      console.error("Error updating habit cycle:", error);
      throw error;
    }
  }

  /**
   * Create a new habit within a cycle
   * @param {object} habitData - The habit data
   * @returns {Promise<object>} - The created habit
   */
  async createHabit(habitData) {
    try {
      if (!habitData.familyId) throw new Error("Family ID is required");
      
      // Ensure required fields are present
      const requiredHabitData = {
        ...habitData,
        startDate: habitData.startDate || new Date().toISOString(),
        createdAt: serverTimestamp(),
        progress: habitData.progress || 0,
        streak: habitData.streak || 0,
        record: habitData.record || 0
      };
      
      // Get the userId or assignedTo data to link this habit to a specific user
      const userId = habitData.userId || habitData.createdBy || 
                    (habitData.assignedTo ? `user_${habitData.assignedTo}` : null) ||
                    (habitData.assignedToName ? `user_${habitData.assignedToName.replace(/\s+/g, '_')}` : null);
      
      // If we have userId, add it to the habitData
      if (userId) {
        requiredHabitData.userId = userId;
      }
      
      let habitRef;
      const batch = writeBatch(db);
      let habitId = null;
      let createdHabit = null;
      
      try {
        // First create in the family's habits collection
        habitRef = await addDoc(
          collection(db, 'families', habitData.familyId, 'habits'),
          requiredHabitData
        );
        
        habitId = habitRef.id;
        createdHabit = { id: habitId, ...requiredHabitData };
        
        // If we have a user ID, also save to the user's habits collection
        if (userId && habitData.assignedTo) {
          console.log(`Saving habit to user profile: ${userId}`);
          
          // First, try to find the user document
          try {
            // First try to lookup the user in the users collection
            const usersQuery = query(
              collection(db, 'users'),
              where('role', '==', habitData.assignedTo)
            );
            
            const usersSnapshot = await getDocs(usersQuery);
            
            if (!usersSnapshot.empty) {
              // Found the user, add the habit to their habits collection
              const user = usersSnapshot.docs[0];
              const userHabitRef = doc(db, 'users', user.id, 'habits', habitId);
              
              batch.set(userHabitRef, {
                ...requiredHabitData,
                id: habitId,
                createdAt: serverTimestamp()
              });
              
              // Also update the user's document with a reference to this habit
              batch.update(doc(db, 'users', user.id), {
                [`habits.${habitId}`]: {
                  id: habitId,
                  title: requiredHabitData.title,
                  createdAt: new Date().toISOString(),
                  isActive: true
                }
              });
            }
          } catch (userError) {
            console.warn("Could not save habit to user profile:", userError);
          }
        }
        
        // Commit all the batch operations
        await batch.commit();
        
        return createdHabit;
      } catch (innerError) {
        console.warn("Could not add to nested collection, trying top-level:", innerError);
        
        // If we already created a habit but failed on user assignment, return that
        if (createdHabit) {
          console.warn("Habit was created but user assignment failed. Returning the created habit.");
          return createdHabit;
        }
        
        // Otherwise, fallback to top-level habits collection
        habitRef = await addDoc(
          collection(db, 'habits'),
          requiredHabitData
        );
        
        habitId = habitRef.id;
        
        // Try to save to user's collection if we have a userId
        if (userId && habitData.assignedTo) {
          try {
            // Look up the user
            const usersQuery = query(
              collection(db, 'users'),
              where('role', '==', habitData.assignedTo)
            );
            
            const usersSnapshot = await getDocs(usersQuery);
            
            if (!usersSnapshot.empty) {
              // Found the user, add the habit to their habits subcollection
              const user = usersSnapshot.docs[0];
              const userHabitRef = doc(db, 'users', user.id, 'habits', habitId);
              
              await setDoc(userHabitRef, {
                ...requiredHabitData,
                id: habitId,
                createdAt: serverTimestamp()
              });
              
              // Also update the user's document with a reference to this habit
              await updateDoc(doc(db, 'users', user.id), {
                [`habits.${habitId}`]: {
                  id: habitId,
                  title: requiredHabitData.title,
                  createdAt: new Date().toISOString(),
                  isActive: true
                }
              });
            }
          } catch (userError) {
            console.warn("Could not save habit to user profile on fallback:", userError);
          }
        }
        
        return { id: habitId, ...requiredHabitData };
      }
    } catch (error) {
      console.error("Error creating habit:", error);
      throw error;
    }
  }

  /**
   * Delete a habit
   * @param {string} habitId - The habit ID to delete
   * @param {string} familyId - The family ID
   * @returns {Promise<void>}
   */
  async deleteHabit(habitId, familyId) {
    try {
      if (!habitId || !familyId) throw new Error("Habit ID and Family ID are required");
      
      console.log(`[DEBUG] Starting deletion of habit ${habitId} from family ${familyId}`);
      
      // Create batch first
      const batch = writeBatch(db);
      
      // First, gather information about the habit from all possible locations
      let habitData = null;
      let foundInFamilyCollection = false;
      let actualFirestoreDocId = null;
      
      // Check family's habits collection
      const familyHabitRef = doc(db, 'families', familyId, 'habits', habitId);
      const familyHabitDoc = await getDoc(familyHabitRef);
      
      if (familyHabitDoc.exists()) {
        habitData = familyHabitDoc.data();
        foundInFamilyCollection = true;
        actualFirestoreDocId = habitId;
        console.log(`[DEBUG] Found habit in families/${familyId}/habits collection with doc ID: ${habitId}`);
      } else {
        // If not found by habitId as doc ID, search the collection for the habit
        console.log(`[DEBUG] Habit not found with doc ID ${habitId}, searching collection...`);
        
        const habitsQuery = query(
          collection(db, 'families', familyId, 'habits')
        );
        const habitsSnapshot = await getDocs(habitsQuery);
        
        for (const doc of habitsSnapshot.docs) {
          const docData = doc.data();
          if (docData.id === habitId || 
              (docData.title && docData.title.toLowerCase().includes('invisible parenting'))) {
            console.log(`[DEBUG] Found habit with different doc ID:`, {
              firestoreDocId: doc.id,
              habitId: docData.id,
              title: docData.title
            });
            
            habitData = docData;
            foundInFamilyCollection = true;
            actualFirestoreDocId = doc.id;
            break;
          }
        }
      }
      
      // Delete from family's habits collection
      if (foundInFamilyCollection && actualFirestoreDocId) {
        const actualRef = doc(db, 'families', familyId, 'habits', actualFirestoreDocId);
        batch.delete(actualRef);
        console.log(`[DEBUG] Added deletion for families/${familyId}/habits/${actualFirestoreDocId}`);
      }
      
      // Delete from top-level habits collection
      try {
        const topLevelRef = doc(db, 'habits', habitId);
        batch.delete(topLevelRef);
        console.log(`[DEBUG] Added deletion for top-level habits/${habitId}`);
      } catch (error) {
        console.warn("Error preparing deletion from top-level habits:", error);
      }
      
      // Delete from user's habits collection if we have userId
      if (habitData && habitData.userId) {
        try {
          const userHabitRef = doc(db, 'users', habitData.userId, 'habits', habitId);
          batch.delete(userHabitRef);
          console.log(`[DEBUG] Added deletion for users/${habitData.userId}/habits/${habitId}`);
        } catch (error) {
          console.warn("Error preparing deletion from user habits:", error);
        }
      }
      
      // IMPORTANT: Also remove from embedded habits array in family document
      try {
        const familyRef = doc(db, 'families', familyId);
        const familyDoc = await getDoc(familyRef);
        
        if (familyDoc.exists()) {
          const familyData = familyDoc.data();
          if (familyData.habits && Array.isArray(familyData.habits)) {
            // Filter out the habit to be deleted
            const updatedHabits = familyData.habits.filter(habit => habit.id !== habitId);
            
            // Update the family document with the filtered habits array
            batch.update(familyRef, { habits: updatedHabits });
            
            console.log(`Removed habit ${habitId} from family embedded habits array`);
          }
        }
      } catch (error) {
        console.warn("Error removing from family embedded habits:", error);
      }
      
      // ALSO remove from user document's embedded habits if present
      try {
        // Get all family members to check their embedded habits
        const membersSnapshot = await getDocs(collection(db, 'families', familyId, 'members'));
        
        for (const memberDoc of membersSnapshot.docs) {
          const userId = memberDoc.id;
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Check if user has embedded habits object
            if (userData.habits && typeof userData.habits === 'object') {
              const updatedHabits = { ...userData.habits };
              
              // Remove the habit if it exists
              delete updatedHabits[habitId];
              
              // Also check for habits stored with different keys
              for (const key in updatedHabits) {
                if (updatedHabits[key].id === habitId) {
                  delete updatedHabits[key];
                }
              }
              
              // Update the user document
              batch.update(userRef, { habits: updatedHabits });
              console.log(`Removed habit ${habitId} from user ${userId} embedded habits`);
            }
          }
        }
      } catch (error) {
        console.warn("Error removing from user embedded habits:", error);
      }
      
      // Commit all deletes and updates
      console.log(`[DEBUG] Committing batch with all deletions...`);
      try {
        await batch.commit();
        console.log(`[DEBUG] Batch commit successful`);
      } catch (commitError) {
        console.error(`[DEBUG] Batch commit failed:`, commitError);
        throw commitError;
      }
      
      console.log(`Habit ${habitId} deleted successfully from all locations`);
    } catch (error) {
      console.error("Error deleting habit:", error);
      throw error;
    }
  }

  /**
   * Archive habits from a completed cycle
   * @param {string} familyId - The family ID 
   * @param {string} cycleId - The cycle ID to archive
   * @returns {Promise<void>}
   */
  async archiveHabits(familyId, cycleId) {
    try {
      if (!familyId || !cycleId) throw new Error("Family ID and Cycle ID are required");
      
      // Get habits from the cycle
      const habits = await this.getHabits(familyId, cycleId);
      
      if (habits.length === 0) return;
      
      // Update each habit to archived status
      const batch = writeBatch(db);
      
      for (const habit of habits) {
        // Try to determine which collection the habit is in
        if (habit.id && habit.id.includes('-')) {
          // Likely a document ID - try both potential locations
          try {
            // First try families collection
            const habitRef = doc(db, 'families', familyId, 'habits', habit.id);
            const habitDoc = await getDoc(habitRef);
            
            if (habitDoc.exists()) {
              batch.update(habitRef, { 
                status: 'archived',
                archivedAt: serverTimestamp()
              });
              continue;
            }
            
            // Then try top-level collection
            const topLevelRef = doc(db, 'habits', habit.id);
            const topLevelDoc = await getDoc(topLevelRef);
            
            if (topLevelDoc.exists()) {
              batch.update(topLevelRef, { 
                status: 'archived',
                archivedAt: serverTimestamp()
              });
            }
          } catch (err) {
            console.error("Error archiving habit:", habit.id, err);
          }
        }
      }
      
      // Commit the batch updates
      await batch.commit();
    } catch (error) {
      console.error("Error archiving habits:", error);
      throw error;
    }
  }

  /**
   * Track habit completion in a given cycle
   * @param {string} habitId - The habit ID
   * @param {object} completionData - The completion data  
   * @returns {Promise<object>} - Updated habit
   */
  async trackHabitCompletion(habitId, completionData) {
    try {
      if (!habitId) throw new Error("Habit ID is required");
      
      // Get the habit first to identify where it's stored
      let habitRef;
      let habitDoc;
      let habitData;
      
      // Try the families collection first
      try {
        habitRef = doc(db, 'families', completionData.familyId, 'habits', habitId);
        habitDoc = await getDoc(habitRef);
        
        if (habitDoc.exists()) {
          habitData = habitDoc.data();
        }
      } catch (err) {
        console.log("Could not find habit in families collection:", err);
      }
      
      // If not found, try the top-level collection
      if (!habitData) {
        try {
          habitRef = doc(db, 'habits', habitId);
          habitDoc = await getDoc(habitRef);
          
          if (habitDoc.exists()) {
            habitData = habitDoc.data();
          }
        } catch (err) {
          console.log("Could not find habit in top-level collection:", err);
        }
      }
      
      if (!habitData) {
        throw new Error("Habit not found");
      }
      
      // Track completion
      const now = new Date();
      const instance = {
        completedAt: now.toISOString(),
        dayOfWeek: now.getDay(),
        notes: completionData.notes || '',
        difficulty: completionData.difficulty || 3,
        timestamp: serverTimestamp()
      };
      
      // Update the habit with the completion
      const completionInstances = [...(habitData.completionInstances || []), instance];
      const progress = Math.min((habitData.progress || 0) + 1, 5); // Cap at 5 for standard habits
      const streak = progress >= 5 ? (habitData.streak || 0) + 1 : habitData.streak || 0;
      const record = Math.max(streak, habitData.record || 0);
      
      const updates = {
        completionInstances,
        progress,
        streak,
        record,
        lastCompleted: now.toISOString(),
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(habitRef, updates);
      
      return {
        ...habitData,
        ...updates,
        id: habitId
      };
    } catch (error) {
      console.error("Error tracking habit completion:", error);
      throw error;
    }
  }
}

export default new HabitCyclesService();