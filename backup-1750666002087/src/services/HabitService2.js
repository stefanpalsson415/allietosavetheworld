// HabitService2.js - New habit system based on Atomic Habits principles
import { 
  doc, collection, getDoc, setDoc, updateDoc, deleteDoc,
  query, where, getDocs, orderBy, limit, serverTimestamp,
  arrayUnion, increment, writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import CalendarService from './CalendarService';
import ChoreService from './ChoreService';

class HabitService2 {
  constructor() {
    this.collectionName = 'habits2';
    this.defaultMilestones = [10, 20, 30, 40, 50, 60];
    this.visualizationTypes = ['mountain', 'treehouse'];
  }

  // Create a new habit with Four Laws configuration
  async createHabit(habitData, familyId, userId, userInfo = null) {
    try {
      const habitId = `habit_${Date.now()}`;
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userData = userDoc.data();
      
      // Get the correct role from userInfo if provided, otherwise from userData
      let userRole = userInfo?.roleType || userInfo?.role || userData?.roleType || userData?.role || 'parent';
      
      // Ensure we have mama/papa instead of generic 'parent'
      if (userRole === 'parent') {
        // Try to determine from displayName or userInfo name
        const displayName = (userInfo?.name || userData?.displayName || '').toLowerCase();
        if (displayName.includes('mama') || displayName.includes('mom') || displayName.includes('kimberly')) {
          userRole = 'mama';
        } else if (displayName.includes('papa') || displayName.includes('dad') || displayName.includes('stefan')) {
          userRole = 'papa';
        } else {
          // Default to mama if can't determine
          userRole = 'mama';
        }
      }
      
      // Ensure lowercase for consistency with FamilyHabitsView
      userRole = userRole.toLowerCase();
      
      const newHabit = {
        habitId,
        familyId,
        
        // Basic Info
        title: habitData.title,
        description: habitData.description,
        category: habitData.category,
        createdBy: userId,
        createdByName: userData?.displayName || 'Parent',
        createdByRole: userRole,
        createdAt: serverTimestamp(),
        
        // Four Laws Configuration
        fourLaws: {
          obvious: habitData.fourLaws.obvious || [],
          attractive: habitData.fourLaws.attractive || [],
          easy: habitData.fourLaws.easy || [],
          satisfying: habitData.fourLaws.satisfying || []
        },
        
        // Identity & Scaling
        identityStatement: habitData.identityStatement,
        twoMinuteVersion: habitData.twoMinuteVersion,
        fullVersion: habitData.fullVersion || habitData.description,
        
        // Scheduling
        schedule: {
          frequency: habitData.schedule.frequency || 'daily',
          daysOfWeek: habitData.schedule.daysOfWeek || [1,2,3,4,5],
          timeOfDay: habitData.schedule.timeOfDay,
          duration: habitData.schedule.duration || 10,
          reminder: habitData.schedule.reminder !== false,
          reminderMinutesBefore: habitData.schedule.reminderMinutesBefore || 15
        },
        
        // Progress Tracking
        completions: [],
        totalCompletions: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        
        // Progress Visualization
        progressVisualization: {
          type: habitData.visualizationType || 'mountain',
          currentLevel: 0,
          contributions: []
        },
        
        // Calendar Integration
        calendarEvents: [],
        
        // Child Participation
        kidsCanHelp: habitData.kidsCanHelp !== false,
        currentHelper: null,
        helpRequested: false,
        childHelpers: [],
        
        // Status
        status: 'active',
        graduatedAt: null,
        graduationCertificateUrl: null,
        missedDates: [],
        
        // Analytics
        averageCompletionTime: 0,
        completionRate: 0,
        peakCompletionHour: null,
        totalTimeSaved: 0
      };
      
      // Save to Firestore
      const habitRef = doc(collection(db, 'families', familyId, this.collectionName), habitId);
      await setDoc(habitRef, newHabit);
      
      console.log('Habit created successfully:', {
        habitId,
        familyId,
        title: newHabit.title,
        createdByRole: userRole,
        userInfo: userInfo?.name,
        collectionPath: `families/${familyId}/${this.collectionName}/${habitId}`
      });
      
      // Create calendar events
      await this.createCalendarEvents(newHabit, familyId);
      
      // Create habit helper chore template
      if (newHabit.kidsCanHelp) {
        await this.createHabitHelperChore(newHabit, familyId);
      }
      
      return newHabit;
    } catch (error) {
      console.error('Error creating habit:', error);
      throw error;
    }
  }

  // Create calendar events for the habit
  async createCalendarEvents(habit, familyId) {
    try {
      const calendarEvent = {
        title: `${habit.createdByRole === 'mama' ? '👩' : '👨'} ${habit.title}`,
        eventType: 'habit',
        habitId: habit.habitId,
        duration: habit.schedule.duration,
        color: '#10B981', // Green
        metadata: {
          isHabit: true,
          habitId: habit.habitId,
          canKidsHelp: habit.kidsCanHelp,
          twoMinuteVersion: habit.twoMinuteVersion
        }
      };

      // Set recurrence based on schedule
      if (habit.schedule.frequency === 'daily') {
        calendarEvent.recurrence = {
          frequency: 'daily',
          daysOfWeek: habit.schedule.daysOfWeek
        };
        calendarEvent.start = { 
          dateTime: this.getNextOccurrence(habit.schedule.timeOfDay || '9:00 AM', habit.schedule.daysOfWeek) 
        };
      } else if (habit.schedule.frequency === 'weekly') {
        calendarEvent.recurrence = {
          frequency: 'weekly'
        };
        calendarEvent.start = { 
          dateTime: this.getNextWeeklyOccurrence(habit.schedule.timeOfDay || '9:00 AM') 
        };
      }

      // Add reminder if enabled
      if (habit.schedule.reminder) {
        calendarEvent.reminders = {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: habit.schedule.reminderMinutesBefore }
          ]
        };
      }

      const event = await CalendarService.addEvent(calendarEvent, habit.createdBy, familyId);
      
      // Store calendar event reference if event was created successfully
      if (event && event.eventId) {
        await updateDoc(doc(db, 'families', familyId, this.collectionName, habit.habitId), {
          calendarEvents: arrayUnion({
            eventId: event.eventId,
            createdAt: new Date()
          })
        });
      }

      return event;
    } catch (error) {
      console.error('Error creating calendar events:', error);
      // Non-critical error, continue
    }
  }

  // Create habit helper chore template
  async createHabitHelperChore(habit, familyId) {
    try {
      const choreTemplate = {
        templateId: `habit_helper_${habit.habitId}`,
        familyId,
        title: `Help with: ${habit.title}`,
        description: `Help ${habit.createdByName} complete their ${habit.title} habit`,
        category: 'Habit Helper',
        icon: '🤝',
        bucksValue: 4, // Higher than regular chores (3)
        isHabitHelper: true,
        linkedHabitId: habit.habitId,
        dynamicTitle: true,
        estimatedMinutes: habit.schedule.duration,
        isActive: true
      };

      await ChoreService.createChoreTemplate(familyId, choreTemplate);
    } catch (error) {
      console.error('Error creating habit helper chore:', error);
      // Non-critical error, continue
    }
  }

  // Complete a habit (by parent or with child help)
  async completeHabit(habitId, familyId, completionData) {
    try {
      const habitRef = doc(db, 'families', familyId, this.collectionName, habitId);
      const habitDoc = await getDoc(habitRef);
      
      if (!habitDoc.exists()) {
        throw new Error('Habit not found');
      }

      const habit = habitDoc.data();
      const now = new Date();
      
      // Create completion record
      const completion = {
        completionId: `completion_${Date.now()}`,
        date: now,
        completionType: completionData.helperId ? 'childHelped' : 'parent',
        helperId: completionData.helperId || null,
        helperName: completionData.helperName || null,
        duration: completionData.duration || habit.schedule.duration,
        reflection: completionData.reflection || '',
        voiceNote: completionData.voiceNote || null,
        usedTwoMinuteVersion: completionData.usedTwoMinuteVersion || false
      };

      // Update streaks
      const lastCompleted = habit.lastCompletedDate?.toDate();
      const daysSinceLastCompletion = lastCompleted ? 
        Math.floor((now - lastCompleted) / (1000 * 60 * 60 * 24)) : 999;
      
      let newStreak = habit.currentStreak;
      if (daysSinceLastCompletion <= 1) {
        newStreak = habit.currentStreak + 1;
      } else if (daysSinceLastCompletion === 2 && habit.missedDates.length < 2) {
        // Never miss twice rule - maintain streak if only missed one day
        newStreak = habit.currentStreak + 1;
      } else {
        newStreak = 1;
      }

      // Update progress visualization
      const updatedContributions = [...(habit.progressVisualization.contributions || [])];
      const contributorIndex = updatedContributions.findIndex(
        c => c.userId === (completionData.helperId || completionData.userId)
      );
      
      if (contributorIndex >= 0) {
        updatedContributions[contributorIndex].pieces += 1;
      } else {
        updatedContributions.push({
          userId: completionData.helperId || completionData.userId,
          pieces: 1
        });
      }

      // Check for milestones
      const newTotalCompletions = habit.totalCompletions + 1;
      const milestone = this.defaultMilestones.find(m => 
        m === newTotalCompletions && !habit.completions.some(c => c.milestone === m)
      );

      // Update habit
      const updates = {
        completions: arrayUnion(completion),
        totalCompletions: increment(1),
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, habit.longestStreak),
        lastCompletedDate: serverTimestamp(),
        'progressVisualization.currentLevel': newTotalCompletions,
        'progressVisualization.contributions': updatedContributions,
        averageCompletionTime: this.calculateNewAverage(
          habit.averageCompletionTime,
          habit.totalCompletions,
          completionData.duration || habit.schedule.duration
        )
      };

      // Graduate habit if reached 60 completions
      if (newTotalCompletions === 60) {
        updates.status = 'graduated';
        updates.graduatedAt = serverTimestamp();
      }

      await updateDoc(habitRef, updates);

      // Update child helper stats if applicable
      if (completionData.helperId) {
        await this.updateChildHelperStats(habitId, familyId, completionData.helperId);
        
        // Create chore completion for payment
        await this.createChoreCompletionForHelper(habit, completionData, familyId);
      }

      // Update calendar event as completed
      await this.markCalendarEventCompleted(habitId, familyId, completionData);

      return {
        success: true,
        milestone,
        newStreak,
        totalCompletions: newTotalCompletions,
        graduated: newTotalCompletions === 60
      };
    } catch (error) {
      console.error('Error completing habit:', error);
      throw error;
    }
  }

  // Update child helper statistics
  async updateChildHelperStats(habitId, familyId, childId) {
    try {
      const habitRef = doc(db, 'families', familyId, this.collectionName, habitId);
      const habitDoc = await getDoc(habitRef);
      const habit = habitDoc.data();

      const childHelpers = habit.childHelpers || [];
      const helperIndex = childHelpers.findIndex(h => h.childId === childId);

      if (helperIndex >= 0) {
        childHelpers[helperIndex].helpCount += 1;
        childHelpers[helperIndex].lastHelped = new Date();
      } else {
        childHelpers.push({
          childId,
          helpCount: 1,
          lastHelped: new Date(),
          voiceNotes: []
        });
      }

      await updateDoc(habitRef, {
        childHelpers,
        totalTimeSaved: increment(habit.schedule.duration)
      });
    } catch (error) {
      console.error('Error updating child helper stats:', error);
    }
  }

  // Create chore completion for helper payment
  async createChoreCompletionForHelper(habit, completionData, familyId) {
    try {
      const choreInstance = {
        templateId: `habit_helper_${habit.habitId}`,
        childId: completionData.helperId,
        familyId,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        completedAt: serverTimestamp(),
        completedBy: completionData.helperId,
        bucksEarned: 4,
        notes: completionData.voiceNote || `Helped with ${habit.title}`,
        isHabitHelper: true,
        linkedHabitId: habit.habitId
      };

      await ChoreService.completeChore(choreInstance, familyId);
    } catch (error) {
      console.error('Error creating chore completion:', error);
    }
  }

  // Mark calendar event as completed
  async markCalendarEventCompleted(habitId, familyId, completionData) {
    try {
      // TODO: Implement calendar event marking when CalendarService.getEventsForDate is available
      // For now, we'll skip marking calendar events as completed
      // This doesn't affect habit completion tracking, only the calendar visual indicator
      
      /* Future implementation:
      const today = new Date().toISOString().split('T')[0];
      const events = await CalendarService.getEventsForDate(today, familyId);
      
      const habitEvent = events.find(e => 
        e.metadata?.habitId === habitId && !e.completed
      );

      if (habitEvent) {
        await CalendarService.updateEvent(habitEvent.id, {
          completed: true,
          completedBy: completionData.helperId || completionData.userId,
          completionType: completionData.helperId ? 'childHelped' : 'parent'
        }, familyId);
      }
      */
    } catch (error) {
      console.error('Error marking calendar event:', error);
    }
  }

  // Get habits for a family
  async getFamilyHabits(familyId, options = {}) {
    try {
      const habitsRef = collection(db, 'families', familyId, this.collectionName);
      let q = query(habitsRef);

      // Apply filters
      if (options.status) {
        q = query(q, where('status', '==', options.status));
      }
      if (options.createdBy) {
        q = query(q, where('createdBy', '==', options.createdBy));
      }
      if (options.needsHelp) {
        q = query(q, where('helpRequested', '==', true));
      }

      // Apply ordering
      q = query(q, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting family habits:', error);
      return [];
    }
  }

  // Get available habits for a child to help with
  async getAvailableHabitsForHelper(familyId, childId) {
    try {
      const habits = await this.getFamilyHabits(familyId, { status: 'active' });
      const today = new Date().toISOString().split('T')[0];
      
      // Filter habits that:
      // 1. Allow kids to help
      // 2. Are scheduled for today
      // 3. Haven't been completed today
      // 4. Aren't currently claimed by another child
      return habits.filter(habit => {
        if (!habit.kidsCanHelp) return false;
        if (habit.currentHelper && habit.currentHelper !== childId) return false;
        
        // Check if scheduled for today
        const dayOfWeek = new Date().getDay();
        if (!habit.schedule.daysOfWeek.includes(dayOfWeek)) return false;
        
        // Check if already completed today
        const todayCompletion = habit.completions?.find(c => 
          c.date.toDate().toISOString().split('T')[0] === today
        );
        
        return !todayCompletion;
      });
    } catch (error) {
      console.error('Error getting available habits for helper:', error);
      return [];
    }
  }

  // Claim a habit to help with
  async claimHabitToHelp(habitId, familyId, childId) {
    try {
      const habitRef = doc(db, 'families', familyId, this.collectionName, habitId);
      await updateDoc(habitRef, {
        currentHelper: childId,
        helpRequested: true
      });
      return true;
    } catch (error) {
      console.error('Error claiming habit:', error);
      throw error;
    }
  }

  // Release claimed habit
  async releaseHabitClaim(habitId, familyId) {
    try {
      const habitRef = doc(db, 'families', familyId, this.collectionName, habitId);
      await updateDoc(habitRef, {
        currentHelper: null,
        helpRequested: false
      });
      return true;
    } catch (error) {
      console.error('Error releasing habit claim:', error);
      throw error;
    }
  }

  // Helper methods
  getNextOccurrence(timeOfDay, daysOfWeek) {
    const now = new Date();
    
    // Validate timeOfDay
    if (!timeOfDay || typeof timeOfDay !== 'string' || !timeOfDay.includes(':')) {
      console.warn('Invalid timeOfDay:', timeOfDay, '- using default 9:00 AM');
      timeOfDay = '9:00';
    }
    
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      date.setHours(hours, minutes, 0, 0);
      
      if (daysOfWeek.includes(date.getDay()) && date > now) {
        return date;
      }
    }
    
    return now;
  }

  getNextWeeklyOccurrence(timeOfDay) {
    const now = new Date();
    
    // Validate timeOfDay
    if (!timeOfDay || typeof timeOfDay !== 'string' || !timeOfDay.includes(':')) {
      console.warn('Invalid timeOfDay:', timeOfDay, '- using default 9:00 AM');
      timeOfDay = '9:00';
    }
    
    const [hours, minutes] = timeOfDay.split(':').map(Number);
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 7);
    }
    
    return next;
  }

  calculateNewAverage(currentAvg, currentCount, newValue) {
    return ((currentAvg * currentCount) + newValue) / (currentCount + 1);
  }

  // Get habit by ID
  async getHabitById(habitId, familyId) {
    try {
      const habitRef = doc(db, 'families', familyId, this.collectionName, habitId);
      const habitDoc = await getDoc(habitRef);
      
      if (!habitDoc.exists()) {
        return null;
      }
      
      return { id: habitDoc.id, ...habitDoc.data() };
    } catch (error) {
      console.error('Error getting habit:', error);
      return null;
    }
  }

  // Update habit settings
  async updateHabitSettings(habitId, familyId, updates) {
    try {
      const habitRef = doc(db, 'families', familyId, this.collectionName, habitId);
      await updateDoc(habitRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error updating habit settings:', error);
      throw error;
    }
  }

  // Delete habit
  async deleteHabit(habitId, familyId) {
    try {
      const habitRef = doc(db, 'families', familyId, this.collectionName, habitId);
      await deleteDoc(habitRef);
      
      // Also delete associated chore template
      try {
        await ChoreService.deleteChoreTemplate(familyId, `habit_helper_${habitId}`);
      } catch (error) {
        console.warn('Error deleting associated chore template:', error);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting habit:', error);
      throw error;
    }
  }
}

// Export singleton instance
const habitService2 = new HabitService2();
export default habitService2;