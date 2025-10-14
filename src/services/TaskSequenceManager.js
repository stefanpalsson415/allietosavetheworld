// src/services/TaskSequenceManager.js
import { db } from './firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, serverTimestamp, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import TaskPrioritizer from './TaskPrioritizer';
import TaskAnalyzer from './TaskAnalyzer';
import WorkloadBalanceDetector from './WorkloadBalanceDetector';
import { v4 as uuidv4 } from 'uuid';

/**
 * TaskSequenceManager service
 * Manages task sequences with dependencies, adaptive reminders, and smart delegation
 */
class TaskSequenceManager {
  constructor() {
    this.sequencesCollection = collection(db, "taskSequences");
    this.tasksCollection = collection(db, "tasks");
    this.familyProfilesCollection = collection(db, "familyProfiles");
  }
  
  /**
   * Create a new task sequence
   * @param {string} familyId - The family ID
   * @param {string} userId - The user ID
   * @param {Object} sequenceData - Task sequence data
   * @returns {Promise<Object>} Created sequence info
   */
  async createTaskSequence(familyId, userId, sequenceData) {
    try {
      // Generate sequence ID
      const sequenceId = uuidv4();
      
      // Prepare sequence document
      const sequence = {
        id: sequenceId,
        familyId,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        title: sequenceData.title || 'Untitled Sequence',
        description: sequenceData.description || '',
        category: sequenceData.category || 'Uncategorized',
        status: 'active',
        completionPercentage: 0,
        tasks: [],
        reminderStrategy: sequenceData.reminderStrategy || 'standard',
        delegationStrategy: sequenceData.delegationStrategy || 'manual',
        dueDate: sequenceData.dueDate || null,
        tags: sequenceData.tags || [],
        parentSequenceId: sequenceData.parentSequenceId || null,
        priority: sequenceData.priority || 'medium',
        
        // Tracking fields
        lastUpdatedBy: userId,
        startDate: sequenceData.startDate || new Date().toISOString(),
        completedDate: null,
        actualCompletionTime: null,
        estimatedCompletionTime: sequenceData.estimatedCompletionTime || null,
        
        // Metadata
        metadata: {
          difficulty: sequenceData.metadata?.difficulty || 'medium',
          recurrence: sequenceData.metadata?.recurrence || null,
          lastOccurrence: null,
          nextOccurrence: null,
          progressHistory: []
        }
      };
      
      // Add tasks to the sequence if provided
      if (sequenceData.tasks && Array.isArray(sequenceData.tasks)) {
        // First, create all tasks in the database
        const taskIds = await this.createSequenceTasks(
          familyId, 
          userId, 
          sequenceId, 
          sequenceData.tasks
        );
        
        // Add task IDs to the sequence
        sequence.tasks = taskIds;
      }
      
      // Save the sequence document
      await setDoc(doc(this.sequencesCollection, sequenceId), sequence);
      
      // Return the created sequence ID
      return {
        success: true,
        sequenceId,
        taskCount: sequence.tasks.length
      };
    } catch (error) {
      console.error("Error creating task sequence:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Create tasks for a sequence
   * @param {string} familyId - The family ID
   * @param {string} userId - The user ID
   * @param {string} sequenceId - The sequence ID
   * @param {Array} tasks - Task data array
   * @returns {Promise<Array>} Created task IDs
   */
  async createSequenceTasks(familyId, userId, sequenceId, tasks) {
    const taskIds = [];
    
    // Process tasks in order
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      
      // Generate task ID
      const taskId = uuidv4();
      
      // Determine task dependencies
      let dependencies = [];
      
      // If dependsOn is provided, use it
      if (task.dependsOn && Array.isArray(task.dependsOn)) {
        // Filter dependencies to only include existing tasks
        dependencies = task.dependsOn.filter(depId => taskIds.includes(depId));
      } 
      // Otherwise, if sequential flag is true, depend on previous task
      else if (task.sequential && i > 0) {
        dependencies = [taskIds[i - 1]];
      }
      
      // Prepare task object
      const taskObj = {
        id: taskId,
        familyId,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        title: task.title || `Task ${i + 1}`,
        description: task.description || '',
        category: task.category || 'Uncategorized',
        status: 'pending',
        priority: task.priority || 'medium',
        dueDate: task.dueDate || null,
        assignedTo: task.assignedTo || null,
        sequenceId,
        dependencies,
        completed: false,
        completedDate: null,
        completedBy: null,
        position: i,
        estimatedDuration: task.estimatedDuration || 30, // minutes
        actualDuration: null,
        
        // Subtasks if available
        subTasks: task.subTasks || [],
        
        // Additional metadata
        metadata: {
          difficulty: task.metadata?.difficulty || 'medium',
          importance: task.metadata?.importance || 'medium',
          notes: task.metadata?.notes || '',
          tags: task.metadata?.tags || [],
          customFields: task.metadata?.customFields || {}
        },
        
        // Reminder configuration
        reminderSettings: task.reminderSettings || {
          strategy: 'standard',
          reminderTimes: [], // Will be populated by the reminder adaptation system
          lastReminderSent: null,
          reminderCount: 0,
          snoozeCount: 0
        }
      };
      
      // Save task to database
      await setDoc(doc(this.tasksCollection, taskId), taskObj);
      
      // Add task ID to the list
      taskIds.push(taskId);
    }
    
    return taskIds;
  }
  
  /**
   * Get a task sequence by ID
   * @param {string} sequenceId - The sequence ID
   * @returns {Promise<Object>} Sequence data with expanded tasks
   */
  async getTaskSequence(sequenceId) {
    try {
      // Get sequence document
      const sequenceDoc = await getDoc(doc(this.sequencesCollection, sequenceId));
      
      if (!sequenceDoc.exists()) {
        throw new Error(`Sequence with ID ${sequenceId} not found`);
      }
      
      const sequence = sequenceDoc.data();
      
      // Get all tasks for this sequence
      const tasks = [];
      
      for (const taskId of sequence.tasks) {
        const taskDoc = await getDoc(doc(this.tasksCollection, taskId));
        
        if (taskDoc.exists()) {
          tasks.push(taskDoc.data());
        }
      }
      
      // Sort tasks by position
      tasks.sort((a, b) => a.position - b.position);
      
      // Update the tasks array with full task objects
      return {
        ...sequence,
        tasks
      };
    } catch (error) {
      console.error("Error getting task sequence:", error);
      return null;
    }
  }
  
  /**
   * Update a task sequence
   * @param {string} sequenceId - The sequence ID
   * @param {string} userId - The user ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  async updateTaskSequence(sequenceId, userId, updateData) {
    try {
      // Get sequence document
      const sequenceDoc = await getDoc(doc(this.sequencesCollection, sequenceId));
      
      if (!sequenceDoc.exists()) {
        throw new Error(`Sequence with ID ${sequenceId} not found`);
      }
      
      // Prepare update object
      const update = {
        ...updateData,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: userId
      };
      
      // Remove tasks field if present (tasks are updated separately)
      if (update.tasks) {
        delete update.tasks;
      }
      
      // Update sequence
      await updateDoc(doc(this.sequencesCollection, sequenceId), update);
      
      return { success: true };
    } catch (error) {
      console.error("Error updating task sequence:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Delete a task sequence
   * @param {string} sequenceId - The sequence ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteTaskSequence(sequenceId, userId) {
    try {
      // Get sequence document to get the task IDs
      const sequenceDoc = await getDoc(doc(this.sequencesCollection, sequenceId));
      
      if (!sequenceDoc.exists()) {
        throw new Error(`Sequence with ID ${sequenceId} not found`);
      }
      
      const sequence = sequenceDoc.data();
      
      // Delete all tasks in the sequence
      for (const taskId of sequence.tasks) {
        await deleteDoc(doc(this.tasksCollection, taskId));
      }
      
      // Delete the sequence
      await deleteDoc(doc(this.sequencesCollection, sequenceId));
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting task sequence:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Add task to sequence
   * @param {string} sequenceId - The sequence ID
   * @param {string} userId - The user ID
   * @param {Object} taskData - Task data
   * @returns {Promise<Object>} Add result
   */
  async addTaskToSequence(sequenceId, userId, taskData) {
    try {
      // Get sequence document
      const sequenceDoc = await getDoc(doc(this.sequencesCollection, sequenceId));
      
      if (!sequenceDoc.exists()) {
        throw new Error(`Sequence with ID ${sequenceId} not found`);
      }
      
      const sequence = sequenceDoc.data();
      
      // Generate task ID
      const taskId = uuidv4();
      
      // Prepare task object
      const taskObj = {
        id: taskId,
        familyId: sequence.familyId,
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        title: taskData.title || `Task ${sequence.tasks.length + 1}`,
        description: taskData.description || '',
        category: taskData.category || sequence.category || 'Uncategorized',
        status: 'pending',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate || null,
        assignedTo: taskData.assignedTo || null,
        sequenceId,
        dependencies: taskData.dependencies || [],
        completed: false,
        completedDate: null,
        completedBy: null,
        position: sequence.tasks.length,
        estimatedDuration: taskData.estimatedDuration || 30, // minutes
        actualDuration: null,
        
        // Subtasks if available
        subTasks: taskData.subTasks || [],
        
        // Additional metadata
        metadata: {
          difficulty: taskData.metadata?.difficulty || 'medium',
          importance: taskData.metadata?.importance || 'medium',
          notes: taskData.metadata?.notes || '',
          tags: taskData.metadata?.tags || [],
          customFields: taskData.metadata?.customFields || {}
        },
        
        // Reminder configuration
        reminderSettings: taskData.reminderSettings || {
          strategy: 'standard',
          reminderTimes: [], // Will be populated by the reminder adaptation system
          lastReminderSent: null,
          reminderCount: 0,
          snoozeCount: 0
        }
      };
      
      // Save task to database
      await setDoc(doc(this.tasksCollection, taskId), taskObj);
      
      // Update sequence with new task ID
      await updateDoc(doc(this.sequencesCollection, sequenceId), {
        tasks: arrayUnion(taskId),
        updatedAt: serverTimestamp(),
        lastUpdatedBy: userId
      });
      
      // Recalculate sequence completion percentage
      await this.updateSequenceCompletionPercentage(sequenceId);
      
      return { success: true, taskId };
    } catch (error) {
      console.error("Error adding task to sequence:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Remove task from sequence
   * @param {string} sequenceId - The sequence ID
   * @param {string} taskId - The task ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} Remove result
   */
  async removeTaskFromSequence(sequenceId, taskId, userId) {
    try {
      // Get sequence document
      const sequenceDoc = await getDoc(doc(this.sequencesCollection, sequenceId));
      
      if (!sequenceDoc.exists()) {
        throw new Error(`Sequence with ID ${sequenceId} not found`);
      }
      
      // Remove task from sequence
      await updateDoc(doc(this.sequencesCollection, sequenceId), {
        tasks: arrayRemove(taskId),
        updatedAt: serverTimestamp(),
        lastUpdatedBy: userId
      });
      
      // Delete the task
      await deleteDoc(doc(this.tasksCollection, taskId));
      
      // Update dependencies in other tasks
      const tasksQuery = query(
        this.tasksCollection, 
        where("sequenceId", "==", sequenceId)
      );
      
      const taskDocs = await getDocs(tasksQuery);
      
      taskDocs.forEach(async (taskDoc) => {
        const task = taskDoc.data();
        
        // If this task depends on the removed task, remove the dependency
        if (task.dependencies && task.dependencies.includes(taskId)) {
          await updateDoc(doc(this.tasksCollection, task.id), {
            dependencies: arrayRemove(taskId)
          });
        }
      });
      
      // Recalculate sequence completion percentage
      await this.updateSequenceCompletionPercentage(sequenceId);
      
      return { success: true };
    } catch (error) {
      console.error("Error removing task from sequence:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update task in sequence
   * @param {string} taskId - The task ID
   * @param {string} userId - The user ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Update result
   */
  async updateTask(taskId, userId, updateData) {
    try {
      // Get task document
      const taskDoc = await getDoc(doc(this.tasksCollection, taskId));
      
      if (!taskDoc.exists()) {
        throw new Error(`Task with ID ${taskId} not found`);
      }
      
      // Get current task data
      const currentTask = taskDoc.data();
      
      // Prepare update object
      const update = {
        ...updateData,
        updatedAt: serverTimestamp()
      };
      
      // Special handling for completion status
      if (update.completed !== undefined && update.completed !== currentTask.completed) {
        if (update.completed) {
          // Task was marked as completed
          update.completedDate = new Date().toISOString();
          update.completedBy = userId;
          update.status = 'completed';
        } else {
          // Task was unmarked as completed
          update.completedDate = null;
          update.completedBy = null;
          update.status = 'pending';
        }
      }
      
      // Update the task
      await updateDoc(doc(this.tasksCollection, taskId), update);
      
      // If completion status changed, update sequence completion percentage
      if (update.completed !== undefined && update.completed !== currentTask.completed) {
        await this.updateSequenceCompletionPercentage(currentTask.sequenceId);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Error updating task:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Update sequence completion percentage
   * @param {string} sequenceId - The sequence ID
   * @returns {Promise<void>}
   */
  async updateSequenceCompletionPercentage(sequenceId) {
    try {
      // Get sequence document
      const sequenceDoc = await getDoc(doc(this.sequencesCollection, sequenceId));
      
      if (!sequenceDoc.exists()) {
        throw new Error(`Sequence with ID ${sequenceId} not found`);
      }
      
      const sequence = sequenceDoc.data();
      
      // Get all tasks for this sequence
      const tasks = [];
      let completedCount = 0;
      
      for (const taskId of sequence.tasks) {
        const taskDoc = await getDoc(doc(this.tasksCollection, taskId));
        
        if (taskDoc.exists()) {
          const task = taskDoc.data();
          tasks.push(task);
          
          if (task.completed) {
            completedCount++;
          }
        }
      }
      
      // Calculate completion percentage
      const totalTasks = tasks.length;
      const completionPercentage = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;
      
      // Update sequence
      await updateDoc(doc(this.sequencesCollection, sequenceId), {
        completionPercentage,
        
        // If all tasks are completed, update sequence status
        ...(completionPercentage === 100 ? {
          status: 'completed',
          completedDate: new Date().toISOString()
        } : {})
      });
      
      // Update progress history
      await updateDoc(doc(this.sequencesCollection, sequenceId), {
        'metadata.progressHistory': arrayUnion({
          date: new Date().toISOString(),
          percentage: completionPercentage
        })
      });
      
    } catch (error) {
      console.error("Error updating sequence completion percentage:", error);
    }
  }
  
  /**
   * Reorder tasks in a sequence
   * @param {string} sequenceId - The sequence ID
   * @param {string} userId - The user ID
   * @param {Array} taskIds - Ordered array of task IDs
   * @returns {Promise<Object>} Reorder result
   */
  async reorderSequenceTasks(sequenceId, userId, taskIds) {
    try {
      // Get sequence document
      const sequenceDoc = await getDoc(doc(this.sequencesCollection, sequenceId));
      
      if (!sequenceDoc.exists()) {
        throw new Error(`Sequence with ID ${sequenceId} not found`);
      }
      
      const sequence = sequenceDoc.data();
      
      // Ensure all taskIds are part of the sequence
      const invalidTaskIds = taskIds.filter(id => !sequence.tasks.includes(id));
      if (invalidTaskIds.length > 0) {
        throw new Error(`Some task IDs are not part of the sequence: ${invalidTaskIds.join(', ')}`);
      }
      
      // Update task positions
      for (let i = 0; i < taskIds.length; i++) {
        await updateDoc(doc(this.tasksCollection, taskIds[i]), {
          position: i
        });
      }
      
      // Update sequence task order
      await updateDoc(doc(this.sequencesCollection, sequenceId), {
        tasks: taskIds,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: userId
      });
      
      return { success: true };
    } catch (error) {
      console.error("Error reordering sequence tasks:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }
  
  /**
   * Get sequences for a family
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Array of sequences
   */
  async getSequencesForFamily(familyId) {
    try {
      // Query sequences for this family
      const sequencesQuery = query(
        this.sequencesCollection,
        where("familyId", "==", familyId)
      );
      
      const sequenceDocs = await getDocs(sequencesQuery);
      
      // Convert to array
      const sequences = [];
      
      sequenceDocs.forEach((doc) => {
        sequences.push(doc.data());
      });
      
      // Calculate the next actionable task for each sequence
      for (let i = 0; i < sequences.length; i++) {
        const sequence = sequences[i];
        
        // Only calculate for active sequences
        if (sequence.status === 'active') {
          // Get the next actionable task
          const nextTask = await this.getNextActionableTask(sequence.id);
          
          // Add to sequence object
          sequence.nextActionableTask = nextTask;
        }
      }
      
      return sequences;
    } catch (error) {
      console.error("Error getting sequences for family:", error);
      return [];
    }
  }
  
  /**
   * Get next actionable task in a sequence
   * @param {string} sequenceId - The sequence ID
   * @returns {Promise<Object>} Next actionable task
   */
  async getNextActionableTask(sequenceId) {
    try {
      // Get sequence document
      const sequenceDoc = await getDoc(doc(this.sequencesCollection, sequenceId));
      
      if (!sequenceDoc.exists()) {
        throw new Error(`Sequence with ID ${sequenceId} not found`);
      }
      
      const sequence = sequenceDoc.data();
      
      // Get all tasks for this sequence
      const tasks = [];
      
      for (const taskId of sequence.tasks) {
        const taskDoc = await getDoc(doc(this.tasksCollection, taskId));
        
        if (taskDoc.exists()) {
          tasks.push(taskDoc.data());
        }
      }
      
      // Sort tasks by position
      tasks.sort((a, b) => a.position - b.position);
      
      // Find first incomplete task with no incomplete dependencies
      for (const task of tasks) {
        if (!task.completed) {
          // Check if all dependencies are satisfied
          const hasPendingDependencies = task.dependencies.some(depId => {
            const depTask = tasks.find(t => t.id === depId);
            return depTask && !depTask.completed;
          });
          
          if (!hasPendingDependencies) {
            return task;
          }
        }
      }
      
      // No actionable task found
      return null;
    } catch (error) {
      console.error("Error getting next actionable task:", error);
      return null;
    }
  }
  
  /**
   * Generate adaptive reminders for tasks
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Reminders to send
   */
  async generateAdaptiveReminders(familyId) {
    try {
      // Get all active task sequences for this family
      const sequencesQuery = query(
        this.sequencesCollection,
        where("familyId", "==", familyId),
        where("status", "==", "active")
      );
      
      const sequenceDocs = await getDocs(sequencesQuery);
      const sequences = [];
      
      sequenceDocs.forEach((doc) => {
        sequences.push(doc.data());
      });
      
      // Get all pending tasks
      const reminders = [];
      
      for (const sequence of sequences) {
        // Get the next actionable task
        const nextTask = await this.getNextActionableTask(sequence.id);
        
        if (nextTask) {
          // Calculate if a reminder should be sent
          const shouldRemind = await this.shouldSendReminder(nextTask, sequence);
          
          if (shouldRemind) {
            // Generate a personalized reminder message
            const reminderMessage = await this.generateReminderMessage(nextTask, sequence);
            
            reminders.push({
              taskId: nextTask.id,
              sequenceId: sequence.id,
              sequenceTitle: sequence.title,
              taskTitle: nextTask.title,
              assignedTo: nextTask.assignedTo,
              message: reminderMessage,
              priority: nextTask.priority,
              dueDate: nextTask.dueDate
            });
            
            // Update reminder tracking
            await updateDoc(doc(this.tasksCollection, nextTask.id), {
              'reminderSettings.lastReminderSent': new Date().toISOString(),
              'reminderSettings.reminderCount': (nextTask.reminderSettings.reminderCount || 0) + 1
            });
          }
        }
      }
      
      return reminders;
    } catch (error) {
      console.error("Error generating adaptive reminders:", error);
      return [];
    }
  }
  
  /**
   * Determine if a reminder should be sent for a task
   * @param {Object} task - The task object
   * @param {Object} sequence - The sequence object
   * @returns {Promise<boolean>} Whether to send a reminder
   */
  async shouldSendReminder(task, sequence) {
    // Don't remind for completed tasks
    if (task.completed) {
      return false;
    }
    
    // Get reminder strategy
    const reminderStrategy = task.reminderSettings?.strategy || sequence.reminderStrategy || 'standard';
    
    // Get the last reminder time
    const lastReminderSent = task.reminderSettings?.lastReminderSent 
      ? new Date(task.reminderSettings.lastReminderSent) 
      : null;
    
    const now = new Date();
    
    // Different strategies have different reminder logic
    switch (reminderStrategy) {
      case 'standard':
        // Standard reminders based on priority and due date
        if (!lastReminderSent) {
          // First reminder - send it!
          return true;
        }
        
        // Calculate hours since last reminder
        const hoursSinceLastReminder = (now - lastReminderSent) / (1000 * 60 * 60);
        
        // Reminder frequency based on priority
        let reminderFrequencyHours = 24; // Default: daily reminders
        
        if (task.priority === 'critical') {
          reminderFrequencyHours = 4;  // Every 4 hours for critical tasks
        } else if (task.priority === 'high') {
          reminderFrequencyHours = 8;  // Every 8 hours for high priority
        } else if (task.priority === 'low') {
          reminderFrequencyHours = 48; // Every 2 days for low priority
        }
        
        // Due date handling
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
          
          // For soon-to-be-due tasks, increase frequency
          if (hoursUntilDue < 24) {
            reminderFrequencyHours = Math.min(reminderFrequencyHours, 2); // At least every 2 hours
          } else if (hoursUntilDue < 48) {
            reminderFrequencyHours = Math.min(reminderFrequencyHours, 4); // At least every 4 hours
          }
          
          // For overdue tasks, increase frequency further
          if (hoursUntilDue < 0) {
            reminderFrequencyHours = 2; // Every 2 hours for overdue tasks
          }
        }
        
        // Send a reminder if enough time has passed
        return hoursSinceLastReminder >= reminderFrequencyHours;
      
      case 'adaptive':
        // Adaptive strategy based on family patterns and preferences
        if (!lastReminderSent) {
          // First reminder - send it!
          return true;
        }
        
        // Get hours since last reminder
        const hoursSinceReminder = (now - lastReminderSent) / (1000 * 60 * 60);
        
        // Base reminder interval on task importance
        let baseInterval = 24; // Default
        
        if (task.priority === 'critical') {
          baseInterval = 6;
        } else if (task.priority === 'high') {
          baseInterval = 12;
        } else if (task.priority === 'low') {
          baseInterval = 48;
        }
        
        // Adjust based on reminder response history
        const reminderCount = task.reminderSettings?.reminderCount || 0;
        const snoozeCount = task.reminderSettings?.snoozeCount || 0;
        
        // If repeatedly snoozed, increase interval (user needs more time)
        if (snoozeCount > 2) {
          baseInterval *= 1.5;
        }
        
        // If many reminders sent without completion, increase interval (avoid notification fatigue)
        if (reminderCount > 5) {
          baseInterval *= 1.3;
        }
        
        // Due date handling
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
          
          // For soon-to-be-due tasks, decrease interval (increase frequency)
          if (hoursUntilDue < 24) {
            baseInterval = Math.min(baseInterval, 3);
          } else if (hoursUntilDue < 48) {
            baseInterval = Math.min(baseInterval, 6);
          }
          
          // For overdue tasks, decrease interval further
          if (hoursUntilDue < 0) {
            baseInterval = Math.min(baseInterval, 2);
          }
        }
        
        return hoursSinceReminder >= baseInterval;
      
      case 'minimal':
        // Minimal strategy - less frequent reminders
        if (!lastReminderSent) {
          // First reminder - send it!
          return true;
        }
        
        // Get days since last reminder
        const daysSinceReminder = (now - lastReminderSent) / (1000 * 60 * 60 * 24);
        
        // Only remind once per day at most, except for critical tasks
        if (task.priority === 'critical') {
          return daysSinceReminder >= 0.5; // Twice a day for critical tasks
        }
        
        return daysSinceReminder >= 1; // Once per day for other tasks
      
      default:
        // Default to standard behavior
        return true;
    }
  }
  
  /**
   * Generate a personalized reminder message
   * @param {Object} task - The task object
   * @param {Object} sequence - The sequence object
   * @returns {Promise<string>} Personalized reminder message
   */
  async generateReminderMessage(task, sequence) {
    // Base message
    let message = `Reminder: "${task.title}" from sequence "${sequence.title}"`;
    
    // Add urgency information
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
      
      if (hoursUntilDue < 0) {
        // Overdue
        const daysOverdue = Math.abs(hoursUntilDue / 24).toFixed(1);
        message += ` is overdue by ${daysOverdue} days!`;
      } else if (hoursUntilDue < 24) {
        // Due today
        message += ` is due within ${Math.round(hoursUntilDue)} hours!`;
      } else {
        // Due in the future
        const daysUntilDue = (hoursUntilDue / 24).toFixed(1);
        message += ` is due in ${daysUntilDue} days.`;
      }
    }
    
    // Add dependency information
    if (task.dependencies && task.dependencies.length > 0) {
      message += " All prerequisites are now complete, so you can start working on this task.";
    }
    
    // Add progress information
    message += ` The sequence is ${Math.round(sequence.completionPercentage)}% complete.`;
    
    // Add encouragement based on priority
    if (task.priority === 'critical') {
      message += " This task is critical for your family workflow.";
    } else if (task.priority === 'high') {
      message += " Completing this important task will significantly help your family.";
    }
    
    return message;
  }
  
  /**
   * Suggest optimal task delegation
   * @param {string} familyId - The family ID
   * @param {Array} tasks - Tasks to delegate
   * @param {Object} familyMembers - Family members data
   * @returns {Promise<Object>} Delegation suggestions
   */
  async suggestTaskDelegation(familyId, tasks, familyMembers) {
    try {
      // Get family profiles and historical tasks for workload analysis
      const [historicalTasks, familyProfiles] = await Promise.all([
        this.getHistoricalTasks(familyId),
        this.getFamilyProfiles(familyId)
      ]);
      
      // Get survey responses and priorities from family profiles
      const surveyResponses = {};
      const familyPriorities = {};
      
      // Analyze current workload balance
      const workloadAnalysis = WorkloadBalanceDetector.detectImbalance(
        historicalTasks,
        surveyResponses,
        familyPriorities,
        familyMembers
      );
      
      // Calculate schedule availability
      const availabilityMap = await this.calculateAvailability(familyId, familyMembers);
      
      // Create a delegation plan for each task
      const delegationPlan = {};
      
      for (const task of tasks) {
        let bestAssignee = null;
        let bestScore = -1;
        let assignmentReason = '';
        
        // Calculate assignment score for each family member
        for (const member of familyMembers) {
          // Skip non-parent members for now (children, etc.)
          if (member.role !== 'parent') continue;
          
          // Calculate base score for this member
          let score = 0;
          
          // Factor 1: Workload balance (30%)
          // Prefer assigning to the less burdened parent
          const parentType = member.parentType || 'Mama'; // Mama or Papa
          const balanceScore = parentType === 'Mama' 
            ? 100 - workloadAnalysis.combinedAnalysis.overallBalance.mama
            : 100 - workloadAnalysis.combinedAnalysis.overallBalance.papa;
          
          score += balanceScore * 0.3;
          
          // Factor 2: Category balance (20%)
          // Prefer assigning to the parent who does less in this category
          const category = task.category || 'Uncategorized';
          let categoryScore = 50; // Default balanced score
          
          if (workloadAnalysis.combinedAnalysis.categoryBalance[category]) {
            categoryScore = parentType === 'Mama'
              ? 100 - workloadAnalysis.combinedAnalysis.categoryBalance[category].mama
              : 100 - workloadAnalysis.combinedAnalysis.categoryBalance[category].papa;
          }
          
          score += categoryScore * 0.2;
          
          // Factor 3: Availability (25%)
          // Prefer assigning to the parent who is more available
          const availability = availabilityMap[member.id] || 50; // Default to 50% availability
          score += availability * 0.25;
          
          // Factor 4: Skill match (15%)
          // Prefer assigning to the parent who is good at this type of task
          let skillScore = 50; // Default neutral score
          
          // Check member profile for skills
          const profile = familyProfiles.find(p => p.memberId === member.id);
          
          if (profile && profile.skills) {
            // Check for category-specific skills
            const categorySkill = profile.skills.find(s => 
              s.category === category || s.tags?.includes(category)
            );
            
            if (categorySkill) {
              skillScore = categorySkill.level * 20; // Convert 1-5 scale to 0-100
            }
          }
          
          score += skillScore * 0.15;
          
          // Factor 5: Historical success (10%)
          // Prefer assigning to the parent who completes these tasks successfully
          let successScore = 50; // Default neutral score
          
          // Count completed similar tasks
          const similarTasks = historicalTasks.filter(t => 
            t.category === category && t.assignedTo === parentType
          );
          
          if (similarTasks.length > 0) {
            const completedCount = similarTasks.filter(t => t.completed).length;
            successScore = similarTasks.length > 0 
              ? (completedCount / similarTasks.length) * 100
              : 50;
          }
          
          score += successScore * 0.1;
          
          // Update best assignee if score is higher
          if (score > bestScore) {
            bestScore = score;
            bestAssignee = member.id;
            
            // Generate reason based on dominant factors
            const topFactor = Math.max(
              balanceScore * 0.3,
              categoryScore * 0.2,
              availability * 0.25,
              skillScore * 0.15,
              successScore * 0.1
            );
            
            if (topFactor === balanceScore * 0.3) {
              assignmentReason = `${parentType} has a lighter overall workload (${Math.round(balanceScore)}% available)`;
            } else if (topFactor === categoryScore * 0.2) {
              assignmentReason = `${parentType} handles fewer ${category} tasks right now`;
            } else if (topFactor === availability * 0.25) {
              assignmentReason = `${parentType} has more availability in their schedule (${Math.round(availability)}%)`;
            } else if (topFactor === skillScore * 0.15) {
              assignmentReason = `${parentType} has skills that match this task type`;
            } else {
              assignmentReason = `${parentType} has a good track record completing similar tasks`;
            }
          }
        }
        
        // Store delegation suggestion
        delegationPlan[task.id] = {
          taskId: task.id,
          title: task.title,
          category: task.category,
          suggestedAssignee: bestAssignee,
          score: bestScore,
          reason: assignmentReason
        };
      }
      
      return delegationPlan;
    } catch (error) {
      console.error("Error suggesting task delegation:", error);
      return {};
    }
  }
  
  /**
   * Calculate availability for family members
   * @param {string} familyId - The family ID
   * @param {Array} familyMembers - Family members data
   * @returns {Promise<Object>} Availability map
   */
  async calculateAvailability(familyId, familyMembers) {
    // This is a simplified availability calculation
    // In a real implementation, this would consider calendar events, work schedules, etc.
    
    const availabilityMap = {};
    
    for (const member of familyMembers) {
      // Default to 50% availability
      availabilityMap[member.id] = 50;
      
      // Fetch tasks assigned to this member
      const tasksQuery = query(
        this.tasksCollection,
        where("familyId", "==", familyId),
        where("assignedTo", "==", member.parentType || member.id),
        where("completed", "==", false)
      );
      
      const taskDocs = await getDocs(tasksQuery);
      
      // Count active tasks
      const assignedTaskCount = taskDocs.size;
      
      // Adjust availability based on task count
      if (assignedTaskCount > 10) {
        availabilityMap[member.id] = 10; // Very low availability
      } else if (assignedTaskCount > 5) {
        availabilityMap[member.id] = 30; // Low availability
      } else if (assignedTaskCount > 2) {
        availabilityMap[member.id] = 50; // Medium availability
      } else {
        availabilityMap[member.id] = 80; // High availability
      }
      
      // TODO: Consider calendar events for more accurate availability
    }
    
    return availabilityMap;
  }
  
  /**
   * Get historical tasks for a family
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Historical tasks
   */
  async getHistoricalTasks(familyId) {
    try {
      // Query tasks for this family
      const tasksQuery = query(
        this.tasksCollection,
        where("familyId", "==", familyId)
      );
      
      const taskDocs = await getDocs(tasksQuery);
      
      // Convert to array
      const tasks = [];
      
      taskDocs.forEach((doc) => {
        tasks.push(doc.data());
      });
      
      return tasks;
    } catch (error) {
      console.error("Error getting historical tasks:", error);
      return [];
    }
  }
  
  /**
   * Get family profiles
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Family profiles
   */
  async getFamilyProfiles(familyId) {
    try {
      // Query profiles for this family
      const profilesQuery = query(
        this.familyProfilesCollection,
        where("familyId", "==", familyId)
      );
      
      const profileDocs = await getDocs(profilesQuery);
      
      // Convert to array
      const profiles = [];
      
      profileDocs.forEach((doc) => {
        profiles.push(doc.data());
      });
      
      return profiles;
    } catch (error) {
      console.error("Error getting family profiles:", error);
      return [];
    }
  }
  
  /**
   * Generate a shopping list from task dependencies
   * @param {string} sequenceId - The sequence ID
   * @returns {Promise<Object>} Shopping list items
   */
  async generateShoppingList(sequenceId) {
    try {
      // Get the full sequence with tasks
      const sequence = await this.getTaskSequence(sequenceId);
      
      if (!sequence) {
        throw new Error(`Sequence with ID ${sequenceId} not found`);
      }
      
      // Extract shopping items from task descriptions, subtasks, etc.
      const shoppingItems = [];
      
      for (const task of sequence.tasks) {
        // Look for shopping items in task title and description
        const combinedText = `${task.title} ${task.description}`.toLowerCase();
        
        // Check for phrases indicating needed items
        const itemPhrases = [
          'need to buy', 'purchase', 'get', 'pick up', 'buy', 'shop for'
        ];
        
        for (const phrase of itemPhrases) {
          if (combinedText.includes(phrase)) {
            // Extract the items that follow the phrase
            const itemsStart = combinedText.indexOf(phrase) + phrase.length;
            const itemsPart = combinedText.substring(itemsStart);
            
            // Extract items from this part
            const items = this.extractItemsFromText(itemsPart);
            
            // Add items to the list with task reference
            for (const item of items) {
              shoppingItems.push({
                name: item,
                taskId: task.id,
                taskTitle: task.title,
                category: this.categorizeShoppingItem(item),
                optional: combinedText.includes('optional') || combinedText.includes('if available')
              });
            }
          }
        }
        
        // Check subtasks for shopping items
        if (task.subTasks && task.subTasks.length > 0) {
          for (const subtask of task.subTasks) {
            if (typeof subtask === 'string') {
              const subtaskText = subtask.toLowerCase();
              
              // Check if this subtask is a shopping item
              if (itemPhrases.some(phrase => subtaskText.includes(phrase)) ||
                  subtaskText.startsWith('buy') || 
                  subtaskText.startsWith('get') || 
                  subtaskText.startsWith('purchase')) {
                
                // Extract the item
                const item = this.cleanItemText(subtaskText);
                
                shoppingItems.push({
                  name: item,
                  taskId: task.id,
                  taskTitle: task.title,
                  category: this.categorizeShoppingItem(item),
                  optional: subtaskText.includes('optional') || subtaskText.includes('if available')
                });
              }
            }
          }
        }
      }
      
      // Group items by category
      const groupedItems = {};
      
      for (const item of shoppingItems) {
        if (!groupedItems[item.category]) {
          groupedItems[item.category] = [];
        }
        
        groupedItems[item.category].push(item);
      }
      
      return {
        sequenceId,
        sequenceTitle: sequence.title,
        items: shoppingItems,
        groupedItems
      };
    } catch (error) {
      console.error("Error generating shopping list:", error);
      return {
        sequenceId,
        sequenceTitle: '',
        items: [],
        groupedItems: {}
      };
    }
  }
  
  /**
   * Extract shopping items from text
   * @param {string} text - Text to extract items from
   * @returns {Array} Extracted items
   */
  extractItemsFromText(text) {
    // Split by common delimiters
    const delimiters = [',', ';', 'and', '&', '\n', '-'];
    let items = [text];
    
    for (const delimiter of delimiters) {
      const newItems = [];
      for (const item of items) {
        if (item.includes(delimiter)) {
          newItems.push(...item.split(delimiter).map(i => i.trim()).filter(i => i));
        } else {
          newItems.push(item);
        }
      }
      items = newItems;
    }
    
    // Clean up items
    return items.map(item => this.cleanItemText(item)).filter(item => item.length > 1);
  }
  
  /**
   * Clean up item text
   * @param {string} itemText - Text to clean
   * @returns {string} Cleaned text
   */
  cleanItemText(itemText) {
    // Remove common phrases
    const phrasesToRemove = [
      'need to buy', 'need to get', 'need to purchase',
      'buy', 'get', 'purchase', 'pick up', 'shop for'
    ];
    
    let cleaned = itemText.trim();
    
    for (const phrase of phrasesToRemove) {
      if (cleaned.startsWith(phrase)) {
        cleaned = cleaned.substring(phrase.length).trim();
      }
    }
    
    // Remove leading/trailing punctuation
    cleaned = cleaned.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    
    // Capitalize first letter
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  
  /**
   * Categorize a shopping item
   * @param {string} item - Item to categorize
   * @returns {string} Category
   */
  categorizeShoppingItem(item) {
    // Simple categorization based on keywords
    const lowerItem = item.toLowerCase();
    
    // Food categories
    if (lowerItem.includes('milk') || 
        lowerItem.includes('cheese') || 
        lowerItem.includes('yogurt')) {
      return 'Dairy';
    }
    
    if (lowerItem.includes('bread') || 
        lowerItem.includes('flour') || 
        lowerItem.includes('cereal')) {
      return 'Bakery';
    }
    
    if (lowerItem.includes('apple') || 
        lowerItem.includes('banana') || 
        lowerItem.includes('fruit') || 
        lowerItem.includes('vegetable')) {
      return 'Produce';
    }
    
    if (lowerItem.includes('meat') || 
        lowerItem.includes('chicken') || 
        lowerItem.includes('beef') || 
        lowerItem.includes('pork')) {
      return 'Meat';
    }
    
    // Household categories
    if (lowerItem.includes('soap') || 
        lowerItem.includes('cleaner') || 
        lowerItem.includes('detergent')) {
      return 'Cleaning';
    }
    
    if (lowerItem.includes('paper') || 
        lowerItem.includes('pencil') || 
        lowerItem.includes('notebook')) {
      return 'Office Supplies';
    }
    
    // Default category
    return 'Other';
  }
}

export default new TaskSequenceManager();