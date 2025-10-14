// src/components/kanban/AIKanbanBoard.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import { 
  DndContext, 
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  PointerSensor
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  horizontalListSortingStrategy,
  verticalListSortingStrategy 
} from '@dnd-kit/sortable';
import { 
  Plus, 
  Calendar, 
  AlertCircle, 
  Search,
  Filter,
  Sparkles,
  Clock,
  Users,
  CheckCircle2,
  Circle,
  ArrowRight,
  Bot,
  CalendarDays
} from 'lucide-react';
import { db } from '../../services/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  where,
  serverTimestamp,
  addDoc,
  writeBatch,
  orderBy,
  getDoc,
  setDoc,
  getDocs,
  limit
} from 'firebase/firestore';
import UserAvatar from '../common/UserAvatar';
import ClaudeService from '../../services/ClaudeService';
import CalendarService from '../../services/CalendarService';
import eventStore from '../../services/EventStore';
import FamilyKnowledgeGraph from '../../services/FamilyKnowledgeGraph';
import confetti from 'canvas-confetti';
import AITaskCard from './AITaskCard';
import AITaskColumn from './AITaskColumn';
import AITaskCreator from './AITaskCreator';
import TaskDrawer from './TaskDrawer';

// Power Features: Track mental load from task activities
const trackMentalLoadActivity = async (familyId, userId, activityType, taskData) => {
  try {
    const { default: InvisibleLoadForensicsService } = await import('../../services/forensics/InvisibleLoadForensicsService');
    await InvisibleLoadForensicsService.logActivity(familyId, {
      type: 'task_management',
      subtype: activityType, // 'task_created', 'task_completed', 'task_reassigned'
      userId,
      metadata: {
        taskTitle: taskData.title,
        category: taskData.category,
        assignedTo: taskData.assignedTo,
        priority: taskData.priority,
        cognitiveLoad: activityType === 'task_created' ? 5 : activityType === 'task_completed' ? -3 : 2
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.log('Power Features tracking not available:', error);
  }
};

const AIKanbanBoard = () => {
  const { familyId, familyMembers, selectedUser } = useFamily();
  const { currentUser } = useAuth();
  const { openDrawerWithPrompt } = useChatDrawer();
  
  // Default board columns configuration
  const defaultBoardColumns = [
    { 
      id: 'backlog', 
      title: 'Backlog', 
      color: 'gray',
      description: 'Future tasks and ideas'
    },
    { 
      id: 'this-week', 
      title: 'This Week', 
      color: 'purple',
      description: 'Focus for the week'
    },
    { 
      id: 'today', 
      title: 'Today', 
      color: 'blue',
      description: 'Daily priorities'
    },
    { 
      id: 'in-progress', 
      title: 'In Progress', 
      color: 'yellow',
      description: 'Currently working on'
    },
    { 
      id: 'done', 
      title: 'Done', 
      color: 'green',
      description: 'Completed tasks'
    }
  ];
  
  // Board columns state (can be customized)
  const [boardColumns, setBoardColumns] = useState(defaultBoardColumns);
  
  // State management
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    assignee: null,
    hasDate: null,
    category: null
  });
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [usingFallbackSuggestions, setUsingFallbackSuggestions] = useState(false);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [hasMoreArchived, setHasMoreArchived] = useState(true);
  const [lastArchivedDoc, setLastArchivedDoc] = useState(null);
  // Removed showAddCard and addCardColumnId - now using TaskDrawer for all task operations
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDrawer, setShowTaskDrawer] = useState(false);
  
  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );
  
  // Load board settings (column names)
  useEffect(() => {
    if (!familyId) return;
    
    const loadBoardSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'kanbanSettings', familyId));
        if (settingsDoc.exists() && settingsDoc.data().columns) {
          // Merge custom column titles with default structure
          const customColumns = boardColumns.map(col => {
            const custom = settingsDoc.data().columns.find(c => c.id === col.id);
            return custom ? { ...col, ...custom } : col;
          });
          setBoardColumns(customColumns);
        }
      } catch (error) {
        console.error('Error loading board settings:', error);
      }
    };
    
    loadBoardSettings();
  }, [familyId]);
  
  // Save column title
  const updateColumnTitle = async (columnId, newTitle) => {
    try {
      // Update local state
      const updatedColumns = boardColumns.map(col => 
        col.id === columnId ? { ...col, title: newTitle } : col
      );
      setBoardColumns(updatedColumns);
      
      // Save to Firestore
      await setDoc(doc(db, 'kanbanSettings', familyId), {
        columns: updatedColumns.map(col => ({
          id: col.id,
          title: col.title
        })),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating column title:', error);
    }
  };
  
  // Load tasks from Firestore with pagination and limits
  useEffect(() => {
    if (!familyId) return;
    
    setLoading(true);
    
    // Simple query without complex filters
    const q = query(
      collection(db, "kanbanTasks"),
      where("familyId", "==", familyId)
    );
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const loadedTasks = [];
        snapshot.forEach((doc) => {
          const taskData = doc.data();
          // Filter out archived tasks client-side
          if (taskData.status !== 'archived') {
            loadedTasks.push({
              id: doc.id,
              ...taskData
            });
          }
        });
        
        // Sort by position for kanban board
        const sortedTasks = loadedTasks.sort((a, b) => (a.position || 0) - (b.position || 0));
        setTasks(sortedTasks);
        setLoading(false);
        
        // Check for tasks that should move based on dates
        checkTasksForDateMovement(sortedTasks);
      },
      (error) => {
        console.error("Error loading tasks:", error);
        setLoading(false);
      }
    );
    
    // Listen for Allie task events
    const handleAllieTask = (event) => {
      console.log('🎯 AIKanbanBoard: Received allie-create-task event:', event.detail);
      if (event.detail) {
        // The event detail IS the task data
        createTaskFromAllie(event.detail);
      }
    };
    
    window.addEventListener('allie-create-task', handleAllieTask);
    
    return () => {
      unsubscribe();
      window.removeEventListener('allie-create-task', handleAllieTask);
    };
  }, [familyId]);
  
  // Check if tasks should be moved based on their dates
  const checkTasksForDateMovement = (taskList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const batch = writeBatch(db);
    let hasUpdates = false;
    
    taskList.forEach(task => {
      if (task.dueDate && task.column === 'this-week') {
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        
        // Move to today if due today
        if (taskDate.getTime() === today.getTime()) {
          batch.update(doc(db, "kanbanTasks", task.id), {
            column: 'today',
            movedAt: serverTimestamp(),
            movedBy: 'system'
          });
          hasUpdates = true;
        }
      }
    });
    
    if (hasUpdates) {
      batch.commit();
    }
  };
  
  // Load archived tasks on demand
  const loadArchivedTasks = async () => {
    if (!familyId || !hasMoreArchived) return;
    
    try {
      const q = query(
        collection(db, 'kanbanTasks'),
        where('familyId', '==', familyId),
        where('status', '==', 'archived'),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      const newArchivedTasks = [];
      
      snapshot.forEach((doc) => {
        newArchivedTasks.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      if (newArchivedTasks.length > 0) {
        setArchivedTasks(prev => [...prev, ...newArchivedTasks]);
        setHasMoreArchived(newArchivedTasks.length === 20);
      } else {
        setHasMoreArchived(false);
      }
    } catch (error) {
      console.error('Error loading archived tasks:', error);
    }
  };
  
  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!task.title.toLowerCase().includes(searchLower) && 
            !task.description?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Assignee filter
      if (filters.assignee && task.assignedTo !== filters.assignee) {
        return false;
      }
      
      // Date filter
      if (filters.hasDate !== null) {
        const hasDate = !!task.dueDate;
        if (filters.hasDate !== hasDate) {
          return false;
        }
      }
      
      // Category filter
      if (filters.category && task.category !== filters.category) {
        return false;
      }
      
      return true;
    });
  }, [tasks, filters]);
  
  // Get tasks by column
  const getTasksByColumn = useCallback((columnId) => {
    return filteredTasks
      .filter(task => task.column === columnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [filteredTasks]);
  
  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    console.log('Drag started:', active.id);
    setActiveId(active.id);
  };
  
  // Handle drag end
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    console.log('Drag ended:', { activeId: active?.id, overId: over?.id });
    
    if (!over) {
      console.log('No drop target');
      setActiveId(null);
      return;
    }
    
    const activeTask = tasks.find(t => t.id === active.id);
    let overColumn = null;
    
    // Check if dropped on a column directly
    if (over.data?.current?.type === 'column') {
      overColumn = over.id;
    } 
    // Check if dropped on a task within a column
    else if (over.data?.current?.type === 'task') {
      overColumn = over.data.current.column;
    }
    
    console.log('Active task:', activeTask?.title, 'Target column:', overColumn);
    
    if (!activeTask || !overColumn) {
      console.log('Missing task or column');
      setActiveId(null);
      return;
    }
    
    // Update task position
    try {
      const oldColumn = activeTask.column;
      
      if (oldColumn !== overColumn) {
        // Moving to a different column
        console.log(`Moving task "${activeTask.title}" from ${oldColumn} to ${overColumn}`);
        
        // Update in Firestore
        await updateDoc(doc(db, "kanbanTasks", activeTask.id), {
          column: overColumn,
          position: Date.now(),
          updatedAt: serverTimestamp(),
          updatedBy: currentUser?.uid || 'unknown'
        });
        
        console.log('Task moved successfully in Firestore');
        
        // Celebrate if moved to done
        if (overColumn === 'done' && oldColumn !== 'done') {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });

          // Add to knowledge graph as completed
          await addCompletionToKnowledgeGraph(activeTask);

          // Track mental load reduction (Power Features)
          await trackMentalLoadActivity(familyId, currentUser?.uid, 'task_completed', activeTask);
        }
        
        // Update calendar if task has a date
        if (activeTask.dueDate && activeTask.calendarEventId) {
          await updateCalendarEvent(activeTask, overColumn);
        }
      } else {
        console.log('Task dropped in same column, no update needed');
      }
    } catch (error) {
      console.error("Error moving task:", error);
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: `Failed to move task: ${error.message}`,
          type: 'error'
        }
      }));
    }
    
    setActiveId(null);
  };
  
  // Handle quick add task from column
  const handleQuickAddTask = (columnId) => {
    // Open TaskDrawer with new task for the specific column
    setSelectedTask({
      id: null,
      title: '',
      description: '',
      priority: 'medium',
      column: columnId,
      assignedTo: [],
      dueDate: null,
      subtasks: [],
      isNew: true
    });
    setShowTaskDrawer(true);
  };
  
  // Handle task selection for detail view
  const handleTaskSelect = useCallback((task) => {
    console.log('Task selected:', task.title);
    console.log('Full task object:', task);
    console.log('Setting drawer state to true');
    setSelectedTask(task);
    setShowTaskDrawer(true);
  }, []);
  
  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('Drawer state changed:', { 
      showTaskDrawer, 
      selectedTask: selectedTask?.title,
      selectedTaskType: typeof selectedTask,
      selectedTaskKeys: selectedTask ? Object.keys(selectedTask) : 'null'
    });
  }, [showTaskDrawer, selectedTask]);

  // Listen for open-task-drawer events (from AllieChat View button)
  useEffect(() => {
    const handleOpenTaskDrawer = (event) => {
      console.log('📂 AIKanbanBoard: Received open-task-drawer event:', event.detail);
      if (event.detail?.taskId) {
        // Find the task in our tasks array or use the provided taskData
        const task = tasks.find(t => t.id === event.detail.taskId) || event.detail.taskData;
        if (task) {
          console.log('Opening task drawer for:', task.title);
          handleTaskSelect(task);
        } else {
          console.log('Task not found:', event.detail.taskId);
        }
      }
    };
    
    window.addEventListener('open-task-drawer', handleOpenTaskDrawer);
    
    return () => {
      window.removeEventListener('open-task-drawer', handleOpenTaskDrawer);
    };
  }, [tasks, handleTaskSelect]);

  // Create task from Allie
  const createTaskFromAllie = async (taskData) => {
    console.log('🚀 Creating task from Allie with data:', taskData);
    try {
      const newTask = {
        title: taskData.title,
        description: taskData.description || '',
        assignedTo: taskData.assignedTo || null,
        category: taskData.category || 'general',
        priority: taskData.priority || 'medium',
        column: taskData.urgent ? 'today' : 'this-week',
        dueDate: taskData.dueDate || null,
        familyId,
        createdBy: 'allie',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        position: Date.now(),
        status: 'active',
        fromAllie: true
      };
      
      console.log('📝 Creating task with data:', newTask);
      
      const docRef = await addDoc(collection(db, "kanbanTasks"), newTask);
      console.log('✅ Task created successfully with ID:', docRef.id);

      // Track mental load increase (Power Features)
      await trackMentalLoadActivity(familyId, currentUser?.uid, 'task_created', newTask);

      // Create calendar event if date provided
      if (newTask.dueDate) {
        await createCalendarEvent({ ...newTask, id: docRef.id });
      }
      
      // Show success message
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: {
          message: `Task "${newTask.title}" created by Allie`,
          type: 'success'
        }
      }));
      
      // Force refresh the task list
      console.log('🔄 Task creation complete, data should refresh automatically via Firestore listener');
      
    } catch (error) {
      console.error("❌ Error creating task from Allie:", error);
    }
  };
  
  // Get AI suggestions for tasks
  const getAISuggestions = async () => {
    console.log('🤖 Getting AI suggestions with Co-Ownership intelligence...');
    setShowAISuggestions(true);

    try {
      // Get Co-Ownership data for intelligent task distribution
      let coOwnershipData = null;
      try {
        const { default: IntelligentDistributionService } = await import('../../services/IntelligentDistributionService');
        coOwnershipData = await IntelligentDistributionService.getWorkloadBalance(familyId);
      } catch (error) {
        console.log('Co-Ownership service not available, continuing without it');
      }

      // Get family context for Claude
      const familyContext = {
        familyName: familyMembers[0]?.familyName || 'the family',
        members: familyMembers.map(m => ({
          name: m.name,
          role: m.role,
          age: m.age || null,
          currentLoad: coOwnershipData?.memberLoads?.[m.id] || 0
        })),
        currentTasks: tasks.map(t => ({
          title: t.title,
          assignedTo: familyMembers.find(m => m.id === t.assignedTo)?.name || 'Unassigned',
          category: t.category,
          dueDate: t.dueDate,
          column: t.column
        })),
        taskStats: {
          totalTasks: tasks.length,
          todayTasks: tasks.filter(t => t.column === 'today').length,
          overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length,
          completedThisWeek: tasks.filter(t => t.column === 'done').length
        },
        coOwnership: coOwnershipData ? {
          equalityScore: coOwnershipData.equalityScore || 0,
          overloadedMembers: coOwnershipData.overloadedMembers || [],
          underutilizedMembers: coOwnershipData.underutilizedMembers || [],
          suggestedRotations: coOwnershipData.upcomingRotations || []
        } : null
      };
      
      const prompt = `You are helping the ${familyContext.familyName} family manage their tasks with Co-Ownership intelligence. Based on their current situation, suggest 4-5 specific, actionable tasks.

Family Members & Mental Load:
${familyContext.members.map(m => `- ${m.name} (${m.role}${m.age ? ', age ' + m.age : ''})${m.currentLoad ? ` - Current Mental Load: ${Math.round(m.currentLoad * 100)}%` : ''}`).join('\n')}

Current Task Load:
- Total active tasks: ${familyContext.taskStats.totalTasks}
- Tasks for today: ${familyContext.taskStats.todayTasks}
- Overdue tasks: ${familyContext.taskStats.overdueTasks}
- Completed this week: ${familyContext.taskStats.completedThisWeek}

Current Tasks by Person:
${Object.entries(
  familyContext.currentTasks.reduce((acc, task) => {
    acc[task.assignedTo] = (acc[task.assignedTo] || 0) + 1;
    return acc;
  }, {})
).map(([person, count]) => `- ${person}: ${count} tasks`).join('\n')}

${familyContext.coOwnership ? `
Co-Ownership Intelligence:
- Family Equality Score: ${Math.round(familyContext.coOwnership.equalityScore)}%
${familyContext.coOwnership.overloadedMembers.length > 0 ? `- Overloaded: ${familyContext.coOwnership.overloadedMembers.join(', ')}` : ''}
${familyContext.coOwnership.underutilizedMembers.length > 0 ? `- Could take on more: ${familyContext.coOwnership.underutilizedMembers.join(', ')}` : ''}
${familyContext.coOwnership.suggestedRotations.length > 0 ? `- Upcoming domain rotations: ${familyContext.coOwnership.suggestedRotations.map(r => r.domain).join(', ')}` : ''}
` : ''}

Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}.

Suggest tasks that:
1. **Redistribute mental load** - Assign to underutilized members or those with lower current load
2. Balance the workload fairly across family members
3. Address any gaps in household management
4. Include age-appropriate tasks for children
5. Consider the current day/time of week
6. Support family wellbeing and co-ownership mindset

For each task, provide:
- title: Clear, specific task name
- description: Brief explanation (1-2 sentences)
- assignedTo: Specific family member name (or "Everyone" for family tasks)
- category: household/parenting/health/errands/personal/general
- priority: high/medium/low
- dueDate: Specific date in YYYY-MM-DD format (only if time-sensitive)

Return ONLY a JSON array of task objects. No other text.`;

      console.log('📤 Sending request to Claude...');
      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7 }
      );
      
      console.log('📥 Claude response received:', response);
      
      // Parse the response
      let suggestions;
      try {
        // Extract JSON from response in case Claude added any extra text
        const jsonMatch = response.match(/\[.*\]/s);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[0]);
        } else {
          suggestions = JSON.parse(response);
        }
      } catch (parseError) {
        console.error('Error parsing Claude response:', parseError);
        throw parseError;
      }
      
      console.log('✅ AI suggestions parsed successfully:', suggestions);
      setAiSuggestions(suggestions);
      setUsingFallbackSuggestions(false);
    } catch (error) {
      console.error("❌ Error getting AI suggestions:", error);
      
      // Fall back to smart local suggestions
      console.log('⚡ Using fallback suggestions...');
      const smartSuggestions = generateSmartSuggestions();
      console.log('💡 Fallback suggestions generated:', smartSuggestions);
      setAiSuggestions(smartSuggestions);
      setUsingFallbackSuggestions(true);
    }
  };
  
  // Generate smart suggestions based on current context
  const generateSmartSuggestions = () => {
    const children = familyMembers.filter(m => m.role === 'child');
    const adults = familyMembers.filter(m => m.role === 'parent' || m.role === 'adult');
    
    // Analyze current tasks to provide complementary suggestions
    const currentCategories = tasks.map(t => t.category);
    const currentAssignees = tasks.map(t => t.assignedTo).filter(Boolean);
    
    // Count tasks per person
    const taskCounts = {};
    familyMembers.forEach(member => {
      taskCounts[member.id] = currentAssignees.filter(id => id === member.id).length;
    });
    
    // Find who has fewer tasks
    const lessLoadedMembers = familyMembers
      .filter(m => taskCounts[m.id] < 3)
      .sort((a, b) => taskCounts[a.id] - taskCounts[b.id]);
    
    // Day of week specific suggestions
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isWeekday = !isWeekend;
    
    // Time-sensitive suggestions
    const suggestions = [];
    
    // Weekend vs weekday specific tasks
    if (isWeekend) {
      suggestions.push({
        title: "Family fun activity planning",
        description: "Research and plan a fun weekend activity for the whole family",
        assignedTo: children.length > 0 ? children[0].name : adults[0]?.name || "Family",
        category: "general",
        priority: "medium",
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      
      suggestions.push({
        title: "Weekly home reset",
        description: "Tidy common areas, prep for the week ahead",
        assignedTo: "Everyone",
        category: "household",
        priority: "medium"
      });
    } else {
      suggestions.push({
        title: "Check school/work schedules",
        description: "Review upcoming events and deadlines for the week",
        assignedTo: adults[0]?.name || "Parent",
        category: "parenting",
        priority: "high",
        dueDate: new Date().toISOString().split('T')[0]
      });
    }
    
    // Balance workload suggestions
    if (lessLoadedMembers.length > 0) {
      const member = lessLoadedMembers[0];
      if (member.role === 'child' && member.age >= 6) {
        suggestions.push({
          title: "Help with dinner prep",
          description: `${member.name} can help with simple dinner preparation tasks`,
          assignedTo: member.name,
          category: "household",
          priority: "low"
        });
      }
    }
    
    // Category balance suggestions
    if (!currentCategories.includes('health')) {
      suggestions.push({
        title: "Schedule family health check-ups",
        description: "Book dental/doctor appointments for family members who need them",
        assignedTo: adults[0]?.name || "Parent",
        category: "health",
        priority: "medium",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
    
    if (!currentCategories.includes('errands')) {
      suggestions.push({
        title: "Grocery shopping list",
        description: "Create shopping list and plan grocery run",
        assignedTo: adults[0]?.name || "Parent",
        category: "errands",
        priority: "medium",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
    
    // Seasonal suggestions
    const month = new Date().getMonth();
    if (month >= 8 && month <= 10) { // Sept-Nov
      suggestions.push({
        title: "Plan holiday activities",
        description: "Start planning for upcoming holiday season activities and gifts",
        assignedTo: "Family",
        category: "general",
        priority: "low",
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
    
    // Return top 4-5 most relevant suggestions
    return suggestions.slice(0, 5);
  };
  
  // Keep old function for backwards compatibility
  const generateFallbackSuggestions = () => {
    const children = familyMembers.filter(m => m.role === 'child');
    const adults = familyMembers.filter(m => m.role === 'parent' || m.role === 'adult');
    
    const suggestions = [
      {
        title: "Weekly meal planning",
        description: "Plan and prep meals for the upcoming week",
        assignedTo: adults[0]?.name || "Parent",
        category: "household",
        priority: "medium"
      },
      {
        title: "Organize school supplies",
        description: "Check and organize backpacks and school supplies",
        assignedTo: children[0]?.name || "Child",
        category: "parenting",
        priority: "medium"
      },
      {
        title: "Schedule family meeting",
        description: "Plan a family meeting to discuss goals and schedules",
        assignedTo: adults[0]?.name || "Parent",
        category: "general",
        priority: "low",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Next week
      },
      {
        title: "Tidy common areas",
        description: "Clean and organize living room and kitchen",
        assignedTo: "Everyone",
        category: "household",
        priority: "medium"
      },
      {
        title: "Plan weekend activity",
        description: "Choose and plan a fun family activity for the weekend",
        assignedTo: children.length > 0 ? children[0].name : adults[0]?.name || "Family",
        category: "general",
        priority: "low"
      }
    ];
    
    return suggestions.slice(0, Math.min(4, suggestions.length));
  };
  
  // Create calendar event for task
  const createCalendarEvent = async (task) => {
    try {
      const event = await eventStore.addEvent({
        title: `Task: ${task.title}`,
        start: { dateTime: new Date(task.dueDate).toISOString() },
        end: { dateTime: new Date(task.dueDate).toISOString() },
        allDay: true,
        category: 'task',
        relatedTaskId: task.id,
        description: task.description || '',
        attendees: task.assignedTo ? [task.assignedTo] : [],
        userId: currentUser?.uid,
        familyId
      });
      
      // Update task with calendar event ID
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        calendarEventId: event.id
      });
      
      console.log('✅ Calendar event created successfully:', event.id);
    } catch (error) {
      console.warn("⚠️ Error creating calendar event:", error.message);
    }
  };
  
  // Update calendar event when task moves
  const updateCalendarEvent = async (task, newColumn) => {
    if (!task.calendarEventId) return;
    
    try {
      const updates = {
        title: `Task: ${task.title}${newColumn === 'done' ? ' ✓' : ''}`,
        category: newColumn === 'done' ? 'completed-task' : 'task'
      };
      
      await eventStore.updateEvent(task.calendarEventId, updates);
    } catch (error) {
      console.error("Error updating calendar event:", error);
    }
  };
  
  // Add completed task to knowledge graph
  const addCompletionToKnowledgeGraph = async (task) => {
    try {
      const kg = FamilyKnowledgeGraph;
      await kg.addEntity(familyId, {
        id: `completion_${task.id}_${Date.now()}`,
        type: 'achievement',
        properties: {
          title: `Completed: ${task.title}`,
          completedBy: task.assignedTo,
          completedAt: new Date().toISOString(),
          taskCategory: task.category
        }
      });
    } catch (error) {
      console.error("Error adding to knowledge graph:", error);
    }
  };
  
  // Active task for drag overlay
  const activeTask = useMemo(
    () => tasks.find(t => t.id === activeId),
    [activeId, tasks]
  );
  
  // Handle save from add card modal
  // Removed handleSaveTask - now handled directly in TaskDrawer
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-100 min-h-screen w-full" style={{ margin: 0, padding: 0 }}>

      {/* Header */}
      <div className="border-b bg-white">
        <div className="flex items-center justify-between mb-4 px-4 pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <CheckCircle2 className="text-indigo-600 mr-2" size={24} />
              <h2 className="text-xl font-semibold">Family Task Board</h2>
            </div>
            <button
              onClick={getAISuggestions}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              <Sparkles size={16} className="mr-1" />
              AI Suggestions
            </button>
          </div>
          
          <button
            onClick={() => {
              // Open TaskDrawer with empty task for creation
              setSelectedTask({
                id: null, // null ID indicates new task
                title: '',
                description: '',
                priority: 'medium',
                column: 'backlog',
                assignedTo: [],
                dueDate: null,
                subtasks: [],
                isNew: true // Flag to indicate this is a new task
              });
              setShowTaskDrawer(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <Plus size={20} className="mr-1" />
            Add Task
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4 px-4 pb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <select
            value={filters.assignee || ''}
            onChange={(e) => setFilters({ ...filters, assignee: e.target.value || null })}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Members</option>
            {familyMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
          
          <button
            onClick={() => setFilters({ ...filters, hasDate: filters.hasDate === null ? true : null })}
            className={`px-3 py-2 rounded-lg border flex items-center ${
              filters.hasDate ? 'bg-indigo-100 border-indigo-300' : ''
            }`}
          >
            <CalendarDays size={18} className="mr-1" />
            With Dates
          </button>
        </div>
      </div>
      
      {/* AI Suggestions */}
      {console.log('🎯 Rendering AI suggestions section:', { showAISuggestions, suggestionsCount: aiSuggestions.length })}
      {showAISuggestions && aiSuggestions.length > 0 && (
        <div className="p-4 bg-indigo-50 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center">
              <Bot className="mr-2" size={18} />
              {usingFallbackSuggestions ? 'Smart Task Suggestions' : 'AI Suggested Tasks'}
            </h3>
            <button
              onClick={() => setShowAISuggestions(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Hide
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {aiSuggestions.map((suggestion, index) => (
              <div
                key={index}
                className="bg-white p-3 rounded-lg border hover:border-indigo-300 cursor-pointer"
                onClick={() => {
                  // Create a task creation prompt with the suggestion details
                  const prompt = `Create a task with the following details:
Title: ${suggestion.title}
Description: ${suggestion.description}
Assigned to: ${suggestion.assignedTo}
Category: ${suggestion.category}
Priority: ${suggestion.priority}
${suggestion.dueDate ? `Due date: ${suggestion.dueDate}` : ''}`;
                  
                  openDrawerWithPrompt(prompt, { context: 'task_creation', suggestion });
                }}
              >
                <h4 className="font-medium text-sm">{suggestion.title}</h4>
                <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                <div className="flex items-center mt-2 text-xs text-gray-500">
                  <Users size={12} className="mr-1" />
                  {suggestion.assignedTo}
                  {suggestion.dueDate && (
                    <>
                      <Calendar size={12} className="ml-2 mr-1" />
                      {new Date(suggestion.dueDate).toLocaleDateString()}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Board - Full width with horizontal scroll, columns with small padding */}
      <div className="flex-1 overflow-x-auto" style={{ width: '100%', margin: 0, padding: 0 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full min-h-[600px] gap-4" style={{ width: '100%', margin: 0, padding: '1rem 0.5rem' }}>
            {boardColumns.map(column => (
              <AITaskColumn
                key={column.id}
                column={column}
                tasks={getTasksByColumn(column.id)}
                onUpdateTitle={(newTitle) => updateColumnTitle(column.id, newTitle)}
                onAddTask={(columnId) => handleQuickAddTask(columnId)}
                onTaskSelect={handleTaskSelect}
              />
            ))}
          </div>
          
          <DragOverlay>
            {activeTask && (
              <AITaskCard
                task={activeTask}
                isDragging
                onTaskSelect={handleTaskSelect}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
      
      {/* Task Drawer - handles both viewing/editing existing tasks and creating new ones */}
      <TaskDrawer
        isOpen={showTaskDrawer}
        onClose={() => {
          console.log('Closing task drawer');
          setShowTaskDrawer(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        onUpdate={(updatedTask) => {
          console.log('Task updated in drawer:', updatedTask);
          // Update selectedTask immediately with the updates
          setSelectedTask(prev => prev ? { ...prev, ...updatedTask } : updatedTask);

          // Also schedule a refresh from Firestore in case there were server-side changes
          setTimeout(() => {
            const freshTask = tasks.find(t => t.id === updatedTask.id);
            if (freshTask) {
              setSelectedTask(freshTask);
            }
          }, 500);
        }}
      />
      
      {/* Yellow test drawer removed - TaskDetailDrawer should work now */}
    </div>
  );
};

export default AIKanbanBoard;