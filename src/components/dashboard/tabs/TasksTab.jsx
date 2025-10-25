// src/components/dashboard/tabs/TasksTab.jsx
// Fixed import to include useCallback
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Calendar, CheckCircle, X, Plus, Award, Flame, 
  Zap, Info, ChevronDown, ChevronUp, MessageSquare,
  Check, RefreshCw, Edit, Trash, Clock, Scale,
  HelpCircle, ArrowRight, Database, Wrench, BarChart2,
  Eye, EyeOff, Brain
} from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
import { useSurvey } from '../../../contexts/SurveyContext';
import { useChatDrawer } from '../../../contexts/ChatDrawerContext';
import DatabaseService from '../../../services/DatabaseService';
import AllieAIService from '../../../services/AllieAIService';
import HabitGenerationService from '../../../services/HabitGenerationService';
import HabitCyclesService from '../../../services/HabitCyclesService';
import { doc, getDoc, updateDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import confetti from 'canvas-confetti';
import { 
  EventManager as EnhancedEventManager, 
  FloatingCalendar
} from '../../../components/calendar';
import CalendarService from '../../../services/CalendarService';
import { useAuth } from '../../../contexts/AuthContext';
import { useEvents } from '../../../contexts/EventContext';
import CycleJourney from '../../cycles/CycleJourney';
import EventDrawer from '../../calendar/EventDrawer';
import eventStore from '../../../services/EventStore';
import { useCycleDueDate } from '../../../hooks/useEvent';
import { knowledgeBase } from '../../../data/AllieKnowledgeBase';
import HabitHelperSection from '../HabitHelperSection';
import FourCategoryRadar from '../FourCategoryRadar';
import { 
  analyzeTaskImbalances, 
  generatePersonalizedExplanation, 
  findMostAppropriateHabit 
} from '../../../utils/SurveyAnalysisUtil';
import { format } from 'date-fns';
import { Target, Heart, Users, Sparkles } from 'lucide-react';
import ELORatingService from '../../../services/ELORatingService';
import FamilyHabitsView from '../../habits/FamilyHabitsView';
import HabitDrawer from '../../habits/HabitDrawer';
import SubCategoryAnalyzer from '../../../services/SubCategoryAnalyzer';
import SurveyResponseCategorizer from '../../../utils/SurveyResponseCategorizer';
import HabitService2 from '../../../services/HabitService2';

// Create a memoized version of CycleJourney to prevent unnecessary re-renders
const MemoizedCycleJourney = React.memo(CycleJourney, (prevProps, nextProps) => {
  // Custom comparison function to prevent re-renders when data hasn't meaningfully changed
  return (
    prevProps.cycleType === nextProps.cycleType &&
    prevProps.currentCycle === nextProps.currentCycle &&
    prevProps.loading === nextProps.loading &&
    prevProps.error === nextProps.error &&
    prevProps.dueDate === nextProps.dueDate &&
    // Deep compare only the essential parts of cycleData
    prevProps.cycleData?.meeting?.completed === nextProps.cycleData?.meeting?.completed &&
    prevProps.cycleData?.meeting?.scheduledDate === nextProps.cycleData?.meeting?.scheduledDate &&
    prevProps.cycleData?.survey?.completed === nextProps.cycleData?.survey?.completed &&
    prevProps.cycleData?.step === nextProps.cycleData?.step &&
    // Check if member progress has actually changed
    JSON.stringify(prevProps.memberProgress) === JSON.stringify(nextProps.memberProgress) &&
    // Check if family members have changed
    prevProps.familyMembers?.length === nextProps.familyMembers?.length &&
    prevProps.currentUser?.id === nextProps.currentUser?.id
  );
});

// Helper function to format dates consistently
const formatDate = (date) => {
  if (!date) return "Not scheduled yet";
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric'
  });
};

// Helper function to calculate days since a date
const daysSince = (dateString) => {
  if (!dateString) return 0;
  
  const date = new Date(dateString);
  const today = new Date();
  
  // Reset hours to compare just the dates
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = today - date;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

// Removed custom avatar helpers - using shared UserAvatar component if needed

// Helper function to calculate total habit completions from both old and new systems
const calculateTotalCompletions = (userId, completedHabitInstances, habits2Completions, habits2FullData = [], allLoadedHabits = []) => {
  // Count from OLD system (completionInstances)
  const oldSystemCompletions = Object.values(completedHabitInstances)
    .filter(instances => instances.some(instance => instance.userId === userId))
    .map(instances => instances.filter(instance => instance.userId === userId).length)
    .reduce((max, count) => Math.max(max, count), 0);

  // Count from NEW system (HabitService2 completions)
  // For HabitService2, we need to count completions for habits created by this user
  // habits2FullData contains the full habit objects with createdBy field
  let newSystemCompletions = 0;

  habits2FullData.forEach(habit => {
    if (habit.createdBy === userId && habit.completions && Array.isArray(habit.completions)) {
      // Count how many times this user completed their own habit
      newSystemCompletions = Math.max(newSystemCompletions, habit.completions.length);
    }
  });

  // Count from HabitCyclesService system (habits with completionCount field)
  let cyclesSystemCompletions = 0;
  allLoadedHabits.forEach(habit => {
    // Check if this habit belongs to the user
    // habit.userId is like 'stefan_palsson_agent', userId parameter is the family member's id
    if (habit.userId === userId || habit.createdBy === userId) {
      // If habit has completionCount field, use it
      if (habit.completionCount && typeof habit.completionCount === 'number') {
        cyclesSystemCompletions = Math.max(cyclesSystemCompletions, habit.completionCount);
      }
    }
  });

  console.log(`User ${userId} completions:`, {
    oldSystem: oldSystemCompletions,
    newSystem: newSystemCompletions,
    cyclesSystem: cyclesSystemCompletions,
    total: oldSystemCompletions + newSystemCompletions + cyclesSystemCompletions
  });

  return oldSystemCompletions + newSystemCompletions + cyclesSystemCompletions;
};

const TasksTab = ({ onStartWeeklyCheckIn, onOpenFamilyMeeting, onSwitchTab }) => {
  const { openDrawerWithPrompt } = useChatDrawer();
  const {
    selectedUser,
    familyMembers,
    currentWeek,
    completedWeeks,
    familyId,
    familyName,
    familyPicture,
    addTaskComment,
    updateTaskCompletion,
    updateSubtaskCompletion,
    updateSurveySchedule,
    loadCurrentWeekTasks,
    getWeekHistoryData,
    getWeekStatus,
    surveySchedule,
    weekStatus,
    weightedScores,
    taskRecommendations,
    surveyResponses
  } = useFamily();

  // Get personalized questions from SurveyContext
  const { currentPersonalizedQuestions, fullQuestionSet } = useSurvey();
  
  // Get family data from auth context for onboarding preferences
  const { familyData } = useAuth();

  // Main states
  const [habits, setHabits] = useState([]);
  const [allParentHabits, setAllParentHabits] = useState([]); // Store all parents' habits for completion tracking
  const [loading, setLoading] = useState(true);
  const [celebrations, setCelebrations] = useState([]);
  const [showAllieCoaching, setShowAllieCoaching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allieIsThinking, setAllieIsThinking] = useState(false);
  const [expandedHabitId, setExpandedHabitId] = useState(null);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [reflection, setReflection] = useState('');
  const [showEnhancedHabits, setShowEnhancedHabits] = useState(true);
  // Event drawer state for Family Meeting date changes
  const [isEventDrawerOpen, setIsEventDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  // Calendar modal removed - navigation to calendar tab instead
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null
  });
  const [datePickerDate, setDatePickerDate] = useState(null);
  const [familyStreak, setFamilyStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [surveyDue, setSurveyDue] = useState(null);
  const [daysUntilSurvey, setDaysUntilSurvey] = useState(null);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const { currentUser } = useAuth();
  const [existingDueDateEvent, setExistingDueDateEvent] = useState(null);
  const [cycleData, setCycleData] = useState(null);
const [meetingDate, setMeetingDate] = useState(null);
const { dueEvent, dueDate } = useCycleDueDate(familyId, currentWeek);



  
  // Cycle progress tracking
  const [cycleStep, setCycleStep] = useState(1);
  const [memberProgress, setMemberProgress] = useState({});
  const [completedHabitInstances, setCompletedHabitInstances] = useState({});
  const [habits2Completions, setHabits2Completions] = useState({}); // New HabitService2 completions
  const [habits2FullData, setHabits2FullData] = useState([]); // Full HabitService2 data with createdBy
  const [canTakeSurvey, setCanTakeSurvey] = useState(false);
  const [hasCompletedSurvey, setHasCompletedSurvey] = useState(false);
  const [canScheduleMeeting, setCanScheduleMeeting] = useState(false);
  
  // ELO ratings state
  const [eloRatings, setEloRatings] = useState(null);
  const [eloLoading, setEloLoading] = useState(false);
  
  // All family survey responses with member metadata
  const [allFamilySurveyResponses, setAllFamilySurveyResponses] = useState({});

  // HabitDrawer state for creating new habits from suggestions
  const [showNewHabitDrawer, setShowNewHabitDrawer] = useState(false);
  const [newHabitTemplate, setNewHabitTemplate] = useState(null);
  const [surveyDataLoading, setSurveyDataLoading] = useState(true);
  
  // Task imbalance analysis from survey data
  const surveyAnalysis = useMemo(() => {
    if (surveyResponses && Object.keys(surveyResponses).length > 0) {
      return analyzeTaskImbalances(surveyResponses);
    }
    return null;
  }, [surveyResponses]);
  
  // All child helper functionality is now handled by the HabitHelperSection component
  
 
    useEffect(() => {
      // If we have a due date from the event hook and it's different from the survey due
      if (dueDate && (!surveyDue || Math.abs(dueDate.getTime() - surveyDue.getTime()) > 60000)) {
        console.log("Syncing date from calendar event:", dueDate, "Current state:", surveyDue);
        
        // Update the state
        setSurveyDue(dueDate);
        
        // Also update database records
        updateSurveySchedule(currentWeek, dueDate).catch(error => {
          console.error("Error updating survey schedule:", error);
        });
      }
    }, [dueDate, surveyDue, currentWeek]);
 
    // Add this useEffect near other useEffects in TasksTab.jsx
useEffect(() => {
  // Check if we need to synchronize the due date from calendar events
  const synchronizeDueDateFromCalendar = async () => {
    if (!familyId || !currentUser) return;
    
    try {
      // Find the existing due date event
      const existingEvent = await findExistingDueDateEvent();
      
      if (existingEvent) {
        // Extract date from event
        let eventDate;
        if (existingEvent.start?.dateTime) {
          eventDate = new Date(existingEvent.start.dateTime);
        } else if (existingEvent.dateTime) {
          eventDate = new Date(existingEvent.dateTime);
        } else if (existingEvent.dateObj) {
          eventDate = new Date(existingEvent.dateObj);
        }
        
        // If we found a valid date and it's different from the current surveyDue
        if (eventDate && (!surveyDue || 
            Math.abs(eventDate.getTime() - surveyDue.getTime()) > 60000)) {
          console.log("Synchronizing due date from calendar event:", 
                     eventDate, "Current surveyDue:", surveyDue);
          
          // Check if the event date is in the past
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          eventDate.setHours(0, 0, 0, 0);
          
          if (eventDate < today) {
            console.log("Calendar event date is in the past, updating to future date");
            
            // Set a new date 7 days from today
            const newEventDate = new Date();
            newEventDate.setDate(newEventDate.getDate() + 7);
            newEventDate.setHours(18, 0, 0, 0); // Set to 6 PM
            
            // Update the calendar event with the new date
            await updateCycleDueDate(newEventDate, {
              ...existingEvent,
              title: existingEvent.title || `Cycle ${currentWeek} Due Date`
            });
            
            // Update our local state
            setSurveyDue(newEventDate);
            
            // Update the database
            await updateSurveySchedule(currentWeek, newEventDate);
            
            // Update week status
            const updatedStatus = {
              ...weekStatus,
              [currentWeek]: {
                ...weekStatus[currentWeek],
                scheduledDate: newEventDate.toISOString()
              }
            };
            
            await DatabaseService.saveFamilyData({
              weekStatus: updatedStatus,
              updatedAt: new Date().toISOString()
            }, familyId);
            
            console.log("Successfully updated past date to future date");
          } else {
            // Date is valid, use it as is
            // Update our local state
            setSurveyDue(eventDate);
            
            // Also update the database to maintain consistency
            try {
              await updateSurveySchedule(currentWeek, eventDate);
              
              // Update week status as well
              const updatedStatus = {
                ...weekStatus,
                [currentWeek]: {
                  ...weekStatus[currentWeek],
                  scheduledDate: eventDate.toISOString()
                }
              };
              
              await DatabaseService.saveFamilyData({
                weekStatus: updatedStatus,
                updatedAt: new Date().toISOString()
              }, familyId);
              
              console.log("Successfully synchronized due date from calendar");
            } catch (updateError) {
              console.error("Error synchronizing due date:", updateError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking for calendar event sync:", error);
    }
  };
  
  synchronizeDueDateFromCalendar();
}, [familyId, currentUser, currentWeek]);
  


// Validate if a habit is appropriate for the parent
const validateHabitAppropriateForParent = (habit, parent) => {
  if (!habit || !parent) return false;
  
  // 1. Check for meeting action items or inappropriate types
  if (habit.title?.includes('Meeting Action Item') || 
      habit.category?.includes('Meeting') ||
      habit.type?.includes('meeting_action')) {
    return false;
  }
  
  // 2. Make sure the habit is assigned to the correct person
  const isForThisParent = 
    habit.assignedTo === (parent?.roleType || parent?.role) || 
    habit.assignedToName === parent?.name ||
    habit.assignedTo === "Everyone";
  
  if (!isForThisParent) {
    return false;
  }
  
  // 3. Check if the habit has proper structure for atomic habits
  if (!habit.title || 
      !habit.description || 
      !(habit.cue || habit.atomicSteps?.[0]?.title) || 
      !(habit.action || habit.atomicSteps?.[1]?.title) || 
      !(habit.reward || habit.atomicSteps?.[2]?.title)) {
    return false;
  }
  
  // 4. Make sure it's a valid habit type
  const isValidHabitType = 
    habit.category?.includes('Habit') || 
    habit.type?.includes('habit') || 
    habit.title?.includes('Habit') ||
    habit.category?.includes('Tasks') ||
    habit.category?.includes('Balance') ||
    habit.category?.includes('Planning');
  
  if (!isValidHabitType) {
    return false;
  }
  
  return true;
};

// Extract loadData function outside useEffect so it can be called from other places
const loadData = async () => {
  try {
    setLoading(true);
    console.log(`Loading habits for Week ${currentWeek}, user:`, selectedUser?.name);
    
    if (familyId) {
        // Load tasks from database
        const tasks = await loadCurrentWeekTasks();
        
        // Also load habits from HabitCyclesService
        const habitsFromService = await HabitCyclesService.getHabits(familyId, currentWeek.toString());

        // Store ALL parent habits for completion tracking (before filtering)
        const parentHabits = habitsFromService.filter(habit =>
          habit.assignedTo === 'papa' ||
          habit.assignedTo === 'mama' ||
          habit.role === 'parent'
        );
        setAllParentHabits(parentHabits);

        // Filter habits from service for the current user (for display)
        const userHabitsFromService = habitsFromService.filter(habit =>
          habit.assignedTo === (selectedUser?.roleType || selectedUser?.role) ||
          habit.assignedToName === selectedUser?.name ||
          habit.assignedTo === "Everyone"
        );
        
        // First apply basic filters to exclude obviously invalid tasks
        const potentialHabits = tasks.filter(task => 
          // Exclude kid-related tasks
          !task.category?.includes('Kid') && 
          !task.title?.includes('Kid') &&
          !task.title?.includes('Child') &&
          
          // Exclude meeting action items 
          !task.title?.includes('Meeting Action Item') &&
          !task.type?.includes('meeting_action') &&
          !task.category?.includes('Meeting')
        );
        
        // Apply more advanced validation to ensure tasks are proper habits
        const adultHabits = potentialHabits.filter(task => 
          validateHabitAppropriateForParent(task, selectedUser)
        );
        
        // Combine habits from both sources
        const allHabits = [...userHabitsFromService, ...adultHabits];
        
        // Check for streak data in database
        const streakData = await loadStreakData();
        
        // Transform tasks into habit format with completion tracking
        const formattedHabits = await Promise.all(allHabits.map(async (task) => {
          // Skip tasks that are not for the current user
          const isForSelectedUser = 
            task.assignedTo === (selectedUser?.roleType || selectedUser?.role) || 
            task.assignedToName === selectedUser?.name ||
            task.assignedTo === "Everyone";
            
          if (!isForSelectedUser) {
            return null;
          }
          
          // Get streak data for this habit
          const streak = streakData[task.id] || 0;
          const record = streakData[`${task.id}_record`] || streak;
          
          // Calculate progress based on subtasks
          const completedSubtasks = task.subTasks?.filter(st => st.completed)?.length || 0;
          const totalSubtasks = task.subTasks?.length || 1;
          const progress = task.completed ? 100 : Math.round((completedSubtasks / totalSubtasks) * 100);
          
          // Get completion instances for this habit
          const completionInstances = await getHabitCompletionInstances(task.id) || [];
          
          // Create the habit object
          return {
            id: task.id,
            title: task.title ? task.title.replace(/Week \d+: /g, '') : "Task",
            description: task.description ? task.description.replace(/for this week/g, 'consistently') : "Description unavailable",
            cue: task.subTasks?.[0]?.title || "After breakfast",
            action: task.subTasks?.[1]?.title || task.title || "Complete task",
            reward: task.subTasks?.[2]?.title || "Feel accomplished and balanced",
            identity: task.focusArea 
              ? `I am someone who values ${task.focusArea.toLowerCase()}` 
              : "I am someone who values family balance",
            assignedTo: task.assignedTo,
            assignedToName: task.assignedToName,
            category: task.category,
            insight: task.insight || task.aiInsight || "",
            completed: task.completed,
            comments: task.comments || [],
            streak: streak,
            record: record,
            progress: progress,
            lastCompleted: task.completedDate || null,
            atomicSteps: task.subTasks?.map(st => ({
              id: st.id,
              title: st.title,
              description: st.description,
              completed: st.completed || false
            })) || [],
            isUserGenerated: task.isUserGenerated || false,
            completionInstances: completionInstances
          };
        }));
        
        // Filter out null values
        const filteredAdultHabits = formattedHabits.filter(Boolean);
            
        // Check if we have any valid habits after filtering
        let usableHabits = [...filteredAdultHabits];

        if (filteredAdultHabits.length === 0) {
          console.log("No valid habits found, trying Claude-generated personalized habits");
          
          try {
            // Try to generate personalized habits using Claude
            const parentRole = selectedUser?.roleType || selectedUser?.role || "parent";
            
            // Generate personalized habits based on survey data and imbalances
            const generatedHabits = await HabitGenerationService.generatePersonalizedHabits(
              familyId,
              selectedUser,
              surveyResponses,
              weightedScores
            );
            
            if (generatedHabits && generatedHabits.length > 0) {
              console.log("Successfully generated personalized habits with Claude:", generatedHabits);
              usableHabits = generatedHabits;
            } else {
              // If generation fails, show empty state instead of fallback
              console.log("Habit generation failed - user should select from Allie or radar chart");
              usableHabits = [];
            }
          } catch (error) {
            console.error("Error generating personalized habits:", error);
            // Show empty state if generation fails
            usableHabits = [];
          }
        }
            
        // Only show one system-generated habit plus any user-generated habits
        const systemHabit = usableHabits.find(h => !h.isUserGenerated);
        const userHabits = usableHabits.filter(h => h.isUserGenerated);
            
        // Combine, putting uncompleted first
        const finalHabits = [systemHabit, ...userHabits].filter(Boolean).sort((a, b) => {
          if (a.completed && !b.completed) return 1;
          if (!a.completed && b.completed) return -1;
          return 0;
        });

        setHabits(finalHabits);
                
        // Load family streaks
        await loadFamilyStreaks();
        
        // Calculate when the next survey is due
        calculateNextSurveyDue();
        
        // Load cycle progress
        await loadCycleProgress();
        
        // Track habit completion instances (OLD SYSTEM)
        const allInstances = {};
        filteredAdultHabits.forEach(habit => {
          allInstances[habit.id] = habit.completionInstances || [];
        });
        setCompletedHabitInstances(allInstances);

        // Also load completions from NEW HabitService2 system
        try {
          const habits2 = await HabitService2.getFamilyHabits(familyId);
          const habits2CompletionsMap = {};

          // Store full data for createdBy checking
          setHabits2FullData(habits2);

          // Count completions per user for each habit
          habits2.forEach(habit => {
            if (habit.completions && Array.isArray(habit.completions)) {
              habits2CompletionsMap[habit.habitId] = habit.completions;
            }
          });

          setHabits2Completions(habits2CompletionsMap);
          console.log('Loaded HabitService2 data:', {
            totalHabits: habits2.length,
            habitsWithCompletions: Object.keys(habits2CompletionsMap).length,
            fullData: habits2
          });
        } catch (error) {
          console.error('Error loading HabitService2 completions:', error);
        }

        // For parents: Check if they have enough habit completions
        // For children: Check if parents have completed their habits
        if (selectedUser && selectedUser.role === 'parent') {
          // Check this specific parent's habits
          const parentHabits = Object.values(allInstances).filter(instances => 
            instances.some(instance => instance.userId === selectedUser.id));
          const hasEnoughCompletions = parentHabits.some(instances => instances.length >= 5);
          setCanTakeSurvey(hasEnoughCompletions);
        } else // For children: Check if parents have completed their habits OR surveys
        if (selectedUser && selectedUser.role === 'child') {
          // For children, they can take survey if ANY of these conditions are true:
          // 1. Any parent has completed enough habits (step >= 2)
          // 2. Any parent has completed their survey
          // 3. Overall cycle step is at least 2
          const parents = familyMembers.filter(m => m.role === 'parent');
          const anyParentCompleted = parents.some(parent => {
            // Check various parent progress indicators:
            // 1. Member progress step is 2 or higher
            const hasProgressStep = memberProgress[parent.id]?.step >= 2;
            // 2. Survey is marked as completed in member progress
            const hasSurveyCompleted = memberProgress[parent.id]?.completedSurvey;
            // 3. Weekly completed array shows survey done
            const hasWeeklyCompleted = parent.weeklyCompleted && 
                                      parent.weeklyCompleted[currentWeek-1]?.completed;
            // 4. Parent's UI shows "Survey Done" text
            const hasUISurveyDone = parent.role === 'parent' && 
                                  (parent.surveyDone || parent.status === 'Survey Done');
            
            return hasProgressStep || hasSurveyCompleted || hasWeeklyCompleted || hasUISurveyDone;
          });
          
          // If any parent completed OR cycle is in survey phase, enable survey for child
          const shouldAllowSurvey = anyParentCompleted || cycleStep >= 2;
          
          // Debug log
          console.log("Child survey eligibility check:", {
            parents: parents.map(p => p.name),
            anyParentCompleted,
            cycleStep,
            shouldAllowSurvey
          });
          
          setCanTakeSurvey(shouldAllowSurvey);
        }

        // Check if current user has already FULLY completed the survey for this week
// Only mark as completed if explicitly completed=true, not just any value
const userHasCompletedSurvey = selectedUser && 
selectedUser.weeklyCompleted && 
selectedUser.weeklyCompleted[currentWeek-1]?.completed === true;
setHasCompletedSurvey(userHasCompletedSurvey);

// If user has 5+ habit completions, always allow survey access regardless of partial completion
if (selectedUser && selectedUser.role === 'parent') {
const userHabits = Object.values(completedHabitInstances)
  .filter(instances => instances.some(instance => instance.userId === selectedUser.id));
const hasEnoughHabits = userHabits.some(instances => instances.length >= 5);

// Always enable survey if they have enough habits, even if partially completed
if (hasEnoughHabits) {
  setCanTakeSurvey(true);
}
}

        // Load ELO ratings
        try {
          setEloLoading(true);
          const ratings = await ELORatingService.getFamilyRatings(familyId);
          setEloRatings(ratings);
          console.log('Loaded ELO ratings:', ratings);
        } catch (eloError) {
          console.error('Error loading ELO ratings:', eloError);
          setEloRatings(null);
        } finally {
          setEloLoading(false);
        }
                
        setLoading(false);
      }
    } catch (error) {
      console.error("Error loading habits:", error);
      setHabits([]);
      setLoading(false);
    }
  };
  
  // Add useEffect to call the loadData function when dependencies change
  useEffect(() => {
    loadData();
  }, [familyId, currentWeek, selectedUser]);

  // CRITICAL FIX: Ensure loading is set to false once essential data is available
  // This prevents the infinite loading screen issue
  useEffect(() => {
    // If we have familyMembers and memberProgress data, we can show the UI
    // Don't wait for ALL data to load - show what we have
    if (familyMembers && familyMembers.length > 0 && memberProgress && Object.keys(memberProgress).length > 0) {
      // Set a small timeout to ensure React has rendered the data
      const timeout = setTimeout(() => {
        setLoading(false);
        console.log('✅ Loading complete - showing UI with available data');
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [familyMembers, memberProgress]);

  // Load all family survey responses with member metadata
  useEffect(() => {
    const loadAllSurveyResponses = async () => {
      if (!familyId || !familyMembers || familyMembers.length === 0) return;
      
      setSurveyDataLoading(true);
      try {
        // Load ALL survey responses for the family at once
        const surveyData = await DatabaseService.loadSurveyResponses(familyId, true);

        if (!surveyData || !surveyData.allResponses) {
          console.log('No survey responses found');
          setAllFamilySurveyResponses({});
          setSurveyDataLoading(false);
          return;
        }

        // The allResponses object already contains all family member responses
        // with keys in format: memberId_questionId
        const allResponses = surveyData.allResponses;

        // Set basic responses immediately for faster initial rendering
        setAllFamilySurveyResponses(allResponses);
        setSurveyDataLoading(false);
        
        // First, categorize responses for each member
        const categorizedByMember = {};
        const memberResponses = {};
        
        // Group responses by member
        Object.entries(allResponses).forEach(([key, responseData]) => {
          const underscoreIndex = key.indexOf('_');
          if (underscoreIndex > 0) {
            const memberId = key.substring(0, underscoreIndex);
            const questionId = key.substring(underscoreIndex + 1);
            
            if (!memberResponses[memberId]) {
              memberResponses[memberId] = {};
            }
            memberResponses[memberId][questionId] = typeof responseData === 'object' ? responseData.answer : responseData;
          }
        });
        
        // Categorize all members' responses in parallel for speed
        const categorizePromises = Object.entries(memberResponses).map(async ([memberId, responses]) => {
          try {
            const categorized = await SurveyResponseCategorizer.categorizeResponses(
              responses,
              familyId,
              memberId
            );
            return { memberId, categorized };
          } catch (error) {
            console.error(`Error categorizing responses for member ${memberId}:`, error);
            return { memberId, categorized: null };
          }
        });

        // Wait for all categorizations to complete in parallel
        const categorizeResults = await Promise.all(categorizePromises);

        // Build the categorizedByMember object from results
        categorizeResults.forEach(({ memberId, categorized }) => {
          if (categorized) {
            categorizedByMember[memberId] = categorized;
          }
        });
        
        // Enrich responses with member metadata AND category information
        const enrichedResponses = {};
        
        Object.entries(allResponses).forEach(([key, responseData]) => {
          // Extract memberId from the key (format: memberId_questionId)
          const underscoreIndex = key.indexOf('_');
          if (underscoreIndex > 0) {
            const memberId = key.substring(0, underscoreIndex);
            const questionId = key.substring(underscoreIndex + 1);
            
            // Find the member
            const member = familyMembers.find(m => m.id === memberId);
            
            // Get category information from categorized data
            const categoryInfo = categorizedByMember[memberId]?.categorizedResponses?.[questionId] || {};
            
            if (member) {
              const enrichedResponse = {
                ...(typeof responseData === 'object' ? responseData : { answer: responseData }),
                memberId: member.id,
                memberName: member.name,
                memberRole: member.role || member.roleType || 'parent',
                isParent: member.role === 'parent',
                isChild: member.role === 'child',
                // Add category metadata
                category: categoryInfo.category || 'Unknown',
                subcategory: categoryInfo.subcategory || null,
                subcategoryLabel: categoryInfo.subcategoryLabel || null,
                weight: categoryInfo.weight || 1
              };
              
              // Keep the same key format
              enrichedResponses[key] = enrichedResponse;
            } else {
              // Keep responses even if member not found
              enrichedResponses[key] = {
                ...(typeof responseData === 'object' ? responseData : { answer: responseData }),
                category: categoryInfo.category || 'Unknown',
                subcategory: categoryInfo.subcategory || null,
                weight: categoryInfo.weight || 1
              };
            }
          } else {
            // Keep responses that don't follow the expected format
            enrichedResponses[key] = responseData;
          }
        });
        
        console.log('Loaded all family survey responses with categories:', {
          totalResponses: Object.keys(enrichedResponses).length,
          byMember: familyMembers.map(m => ({
            name: m.name,
            role: m.role,
            count: Object.keys(enrichedResponses).filter(k => k.startsWith(m.id + '_')).length
          })),
          sampleCategorized: Object.entries(enrichedResponses).slice(0, 5).map(([k, v]) => ({
            key: k,
            category: v.category,
            subcategory: v.subcategory
          }))
        });

        // Update with enriched responses (this replaces the basic ones)
        setAllFamilySurveyResponses(enrichedResponses);
      } catch (error) {
        console.error('Error loading all survey responses:', error);
        setSurveyDataLoading(false);
      }
    };
    
    loadAllSurveyResponses();
  }, [familyId, familyMembers]);
  
  // Listen for Allie event updates and manual date change confirmations
  useEffect(() => {
    const handleAllieEventUpdate = async (event) => {
      console.log('Received Allie event update:', event.detail);
      
      // Check if this is for our cycle due date
      const eventContext = JSON.parse(sessionStorage.getItem('alliePendingEvent') || '{}');
      if (eventContext.type === 'cycle-due-date' && eventContext.cycleNumber === currentWeek) {
        // Extract the new date from Allie's response
        if (event.detail && event.detail.date) {
          const newDate = new Date(event.detail.date);
          console.log('Updating cycle due date to:', newDate);
          
          // Update the due date using our existing function
          const success = await updateCycleDueDate(newDate, eventContext);
          
          if (success) {
            // Clear the pending event
            sessionStorage.removeItem('alliePendingEvent');
            
            // Force refresh to show new date
            loadData();
            findExistingDueDateEvent();
          }
        }
      }
    };
    
    // Also listen for manual date changes from Allie's chat
    const handleManualDateChange = async (event) => {
      console.log('Manual date change detected:', event.detail);
      if (event.detail && event.detail.newDate) {
        const newDate = new Date(event.detail.newDate);
        const eventContext = JSON.parse(sessionStorage.getItem('alliePendingEvent') || '{}');
        
        if (eventContext.type === 'cycle-due-date' && eventContext.cycleNumber === currentWeek) {
          console.log('Manually updating cycle due date to:', newDate);
          
          // Update the due date
          const success = await updateCycleDueDate(newDate, eventContext);
          
          if (success) {
            sessionStorage.removeItem('alliePendingEvent');
            loadData();
            findExistingDueDateEvent();
          }
        }
      }
    };
    
    // Handle family meeting date updates from Allie
    const handleFamilyMeetingUpdate = async (event) => {
      console.log('Family meeting date updated by Allie:', event.detail);
      
      // Check if this is an error response
      if (event.detail && event.detail.success === false) {
        console.error('Calendar event creation failed:', event.detail.error);
        return;
      }
      
      // Check if we have a valid date
      if (event.detail && event.detail.date) {
        const newDate = new Date(event.detail.date);
        
        // Validate the date
        if (isNaN(newDate.getTime())) {
          console.error('Invalid date received:', event.detail.date);
          return;
        }
        
        console.log('Setting new meeting date:', newDate);
        
        // Update the meeting date in state
        setMeetingDate(newDate);
        setSurveyDue(newDate); // Also update surveyDue which is used for display
        
        // Update in the database
        try {
          const familyRef = doc(db, "families", familyId);
          await updateDoc(familyRef, {
            [`cycleProgress.${currentWeek}.meeting.scheduledDate`]: newDate.toISOString(),
            [`cycleProgress.${currentWeek}.meeting.scheduled`]: true
          });
          
          // Show success message
          createCelebration("Meeting Scheduled!", true, `Family meeting scheduled for ${format(newDate, 'EEEE, MMMM d')} at ${event.detail.time || '7:00 PM'}`);
          
          // Force refresh
          await loadCycleProgress();
        } catch (error) {
          console.error("Error updating meeting date:", error);
        }
      }
    };
    
    // Listen for multiple possible events
    window.addEventListener('allie-update-event', handleAllieEventUpdate);
    window.addEventListener('allie-schedule-meeting', handleAllieEventUpdate);
    window.addEventListener('cycle-date-changed', handleManualDateChange);
    window.addEventListener('family-meeting-updated', handleFamilyMeetingUpdate);
    window.addEventListener('family-meeting-date-updated', handleFamilyMeetingUpdate);
    window.addEventListener('allie-event-created', handleFamilyMeetingUpdate);
    
    return () => {
      window.removeEventListener('allie-update-event', handleAllieEventUpdate);
      window.removeEventListener('allie-schedule-meeting', handleAllieEventUpdate);
      window.removeEventListener('cycle-date-changed', handleManualDateChange);
      window.removeEventListener('family-meeting-updated', handleFamilyMeetingUpdate);
      window.removeEventListener('family-meeting-date-updated', handleFamilyMeetingUpdate);
      window.removeEventListener('allie-event-created', handleFamilyMeetingUpdate);
    };
  }, [currentWeek, familyId]);

// Add this near other utility functions in TasksTab.jsx (before the useEffect that calls it)
const initialSyncDueDate = async () => {
  if (!familyId || !currentUser) return;
  
  try {
    // Load events and find the due date event
    const events = await eventStore.getEventsForUser(currentUser.id);
    const dueEvent = events.find(event => 
      event.category === 'cycle-due-date' && 
      event.cycleNumber === currentWeek
    );
    
    if (dueEvent) {
      console.log("Initial sync found due date event:", dueEvent);
      
      // Extract date from the event
      let eventDate;
      if (dueEvent.start?.dateTime) {
        eventDate = new Date(dueEvent.start.dateTime);
      } else if (dueEvent.dateTime) {
        eventDate = new Date(dueEvent.dateTime);
      } else if (dueEvent.dateObj) {
        eventDate = new Date(dueEvent.dateObj);
      }
      
      if (eventDate && !isNaN(eventDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        
        // Check if the event date is in the past
        if (eventDate < today) {
          console.log("Event date is in the past, updating to future date");
          
          // Set a new date 7 days from today
          const newEventDate = new Date();
          newEventDate.setDate(newEventDate.getDate() + 7);
          newEventDate.setHours(18, 0, 0, 0); // Set to 6 PM
          
          // Update the event with the new date
          await updateCycleDueDate(newEventDate, {
            ...dueEvent,
            title: dueEvent.title || `Cycle ${currentWeek} Due Date`
          });
          
          setSurveyDue(newEventDate);
          await updateSurveySchedule(currentWeek, newEventDate);
        } else {
          console.log("Setting surveyDue directly from event store:", eventDate);
          setSurveyDue(eventDate);
          
          // Also update database for completeness
          await updateSurveySchedule(currentWeek, eventDate);
        }
      }
    }
  } catch (error) {
    console.error("Error in initial sync:", error);
  }
};

// In src/components/dashboard/tabs/TasksTab.jsx
// Add this new useEffect near other useEffects

// NEW CODE (replacement for the useEffect in TasksTab.jsx)
useEffect(() => {
  // Handle events from the calendar component
  const handleCalendarUpdate = (e) => {
    if (e.detail?.cycleUpdate) {
      console.log("Received calendar cycle date update event");
      
      // Use a debounced update to prevent multiple rapid refreshes
      clearTimeout(window.cycleDueUpdateTimeout);
      window.cycleDueUpdateTimeout = setTimeout(() => {
        // Refresh survey due date
        calculateNextSurveyDue();
        // Reload cycle progress
        loadCycleProgress();
      }, 300);
    }
  };
  
  const handleCycleDateUpdate = (e) => {
    if (e.detail?.date) {
      console.log("Direct cycle date update:", e.detail.date);
      
      // Immediately update the UI
      setSurveyDue(e.detail.date);
      
      // Only update DB and force refresh if this isn't a silent update
      if (!e.detail.silent) {
        // Update in the DB for persistence
        updateSurveySchedule(currentWeek, e.detail.date);
      }
    }
  };
  
  // Add event listeners with more targeted approach
  window.addEventListener('calendar-event-updated', handleCalendarUpdate);
  window.addEventListener('cycle-date-updated', handleCycleDateUpdate);
  
  // Cleanup
  return () => {
    window.removeEventListener('calendar-event-updated', handleCalendarUpdate);
    window.removeEventListener('cycle-date-updated', handleCycleDateUpdate);
    clearTimeout(window.cycleDueUpdateTimeout);
  };
}, [currentWeek]);

// This is the fixed placement for the useEffect that was incorrectly inside loadData
useEffect(() => {
  if (familyId && currentUser && currentWeek) {
    initialSyncDueDate();
  }
}, [familyId, currentUser, currentWeek]);
  
  // Load streak data from database
  const loadStreakData = async () => {
    try {
      if (!familyId) return {};
      
      // Query streaks collection 
      const streaksDoc = await getDoc(doc(db, "families", familyId));
      if (!streaksDoc.exists()) return {};
      
      const streakData = streaksDoc.data().habitStreaks || {};
      return streakData;
    } catch (error) {
      console.error("Error loading streak data:", error);
      return {};
    }
  };
  
  // Load completion instances for a habit
  const getHabitCompletionInstances = async (habitId) => {
    try {
      if (!familyId) return [];
      
      const habitDoc = await getDoc(doc(db, "families", familyId, "habitInstances", habitId));
      if (!habitDoc.exists()) return [];
      
      return habitDoc.data().instances || [];
    } catch (error) {
      console.error(`Error loading completion instances for habit ${habitId}:`, error);
      return [];
    }
  };
  
// Generate personalized habit explanation based on family data
const generateHabitExplanation = (habit) => {
  if (!habit || !familyId) return null;
  
  try {
    // 1. Get category-specific imbalance data
    const habitCategory = habit.category || "Household Tasks";
    let categoryImbalance = 0;
    let dominantRole = "Mama";
    let imbalancePercent = 0;
    
    // Extract imbalance data if available from weighted scores
    if (weightedScores && weightedScores.categoryBalance) {
      const categoryData = Object.entries(weightedScores.categoryBalance)
        .find(([category]) => category.includes(habitCategory.replace(" Tasks", "")));
      
      if (categoryData) {
        const [_, scores] = categoryData;
        imbalancePercent = scores.imbalance?.toFixed(1) || 0;
        dominantRole = scores.mama > scores.papa ? "Mama" : "Papa";
        categoryImbalance = Math.abs(scores.mama - scores.papa).toFixed(1);
      }
    }
    
    // 2. Get family-specific details
    const totalFamilyMembers = familyMembers?.length || 2;
    const childrenCount = familyMembers?.filter(m => m.role === 'child').length || 0;
    const completedTasks = taskRecommendations?.filter(t => t.completed)?.length || 0;
    const totalTasks = taskRecommendations?.length || 0;
    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    // 3. Get habit-specific insights
    const habitCompletions = completedHabitInstances[habit.id]?.length || 0;
    const daysSinceLastHabit = habit.lastCompleted ? daysSince(habit.lastCompleted) : null;
    
    // 4. Get relevant research from knowledge base
    let researchInsight = "";
    if (habitCategory.includes("Household")) {
      researchInsight = knowledgeBase.whitepapers?.research?.mentalLoad || 
        "Research shows the mental load of household management falls disproportionately on women in 83% of families.";
    } else if (habitCategory.includes("Parental")) {
      researchInsight = knowledgeBase.whitepapers?.research?.childDevelopment || 
        "Children who witness balanced household responsibilities are 3x more likely to establish equitable relationships as adults.";
    } else {
      researchInsight = knowledgeBase.whitepapers?.research?.relationshipImpact || 
        "Studies indicate that imbalanced household responsibilities increase relationship conflict by 67%.";
    }
    
    // 5. Generate personalized explanation
    let explanation = ``;
    
    // First part: Parent-to-parent comparison with specific data
    const currentParentRole = selectedUser?.roleType || selectedUser?.role || "parent";
    const otherParentRole = currentParentRole === "Mama" ? "Papa" : "Mama";
    
    // Check if we have a custom explanation from Claude or the habit generation
    if (habit.habitExplanation) {
      explanation += `Allie selected <strong>${habit.title}</strong> for you because ${habit.habitExplanation} `;
    }
    // If no custom explanation, use imbalance data
    else if (imbalancePercent > 20) {
      if (dominantRole === currentParentRole) {
        explanation += `Allie selected <strong>${habit.title}</strong> for you because our data shows you're currently handling ${categoryImbalance}% more of the ${habitCategory.toLowerCase()} than ${otherParentRole}. `;
      } else {
        explanation += `Allie selected <strong>${habit.title}</strong> for you because ${dominantRole} is currently handling ${categoryImbalance}% more of the ${habitCategory.toLowerCase()} than you. This habit will help you take on more responsibility in this area. `;
      }
    } else if (completionRate < 50) {
      explanation += `Allie selected <strong>${habit.title}</strong> because your family's current task completion rate is ${completionRate}%, and this habit will help you both manage ${habitCategory.toLowerCase()} more efficiently. `;
    } else {
      explanation += `Allie selected <strong>${habit.title}</strong> based on your family's specific needs with ${childrenCount} ${childrenCount === 1 ? 'child' : 'children'} and the patterns we've identified in your survey responses. `;
    }
    
    // Second part: Research-backed insight
    if (habit.habitResearch) {
      explanation += `${habit.habitResearch} `;
    } else {
      explanation += `${researchInsight.substring(0, researchInsight.indexOf('.') + 1)} `;
    }
    
    // Third part: Personalized benefit for this specific family
    if (habitCompletions > 0) {
      explanation += `You've practiced this habit ${habitCompletions} ${habitCompletions === 1 ? 'time' : 'times'}, which has already improved your family balance by an estimated ${Math.min(habitCompletions * 2, 15)}%.`;
    } else if (daysSinceLastHabit !== null && daysSinceLastHabit > 2) {
      explanation += `It's been ${daysSinceLastHabit} days since you last practiced this habit. For maximum benefit, aim for consistent daily practice.`;
    } else {
      // If we have a custom habit, use a more personalized benefit statement
      if (habit.habitExplanation) {
        explanation += `Consistent practice of this habit can help restore balance in your family's workload distribution and reduce stress.`;
      } else {
        explanation += `Families with your profile who practice this habit consistently typically see a 23% reduction in workload stress and a 17% improvement in task-sharing equality.`;
      }
    }
    
    return explanation;
  } catch (error) {
    console.error("Error generating habit explanation:", error);
    return "This habit was selected to help improve your family's workload balance based on your unique survey responses and family composition.";
  }
};


const findExistingDueDateEvent = async () => {
  if (!familyId || !currentUser) return null;
  
  try {
    // Get all events from CalendarService with a wider date range
    const events = await CalendarService.getEventsForUser(
      currentUser.uid,
      new Date(new Date().setDate(new Date().getDate() - 90)), // 90 days ago
      new Date(new Date().setDate(new Date().getDate() + 180))  // 180 days ahead
    );
    
    console.log("All calendar events found:", events.length);
    
    // FIRST PRIORITY: Look for universalId with specific format
    const universalIdToFind = `cycle-due-date-${familyId}-${currentWeek}`;
    let dueDateEvent = events.find(event => event.universalId === universalIdToFind);
    
    if (dueDateEvent) {
      console.log("Found due date event by universalId:", dueDateEvent);
      setExistingDueDateEvent(dueDateEvent);
      return dueDateEvent;
    }
    
    // SECOND PRIORITY: Search by title containing "Cycle X Due Date"
    const titlePattern = new RegExp(`Cycle\\s*${currentWeek}\\s*Due\\s*Date`, 'i');
    dueDateEvent = events.find(event => 
      (event.title && titlePattern.test(event.title)) || 
      (event.summary && titlePattern.test(event.summary))
    );
    
    if (dueDateEvent) {
      console.log("Found due date event by title pattern:", dueDateEvent);
      setExistingDueDateEvent(dueDateEvent);
      return dueDateEvent;
    }
    
    // THIRD PRIORITY: Check for cycle due date in category and current cycle number
    const dueDateEvents = events.filter(event => {
      // Check for cycle due date in category or eventType
      const isCycleDueDate = 
        event.category === 'cycle-due-date' || 
        event.eventType === 'cycle-due-date';
        
      // Check for current cycle number in various fields
      const isCurrentCycle = 
        event.cycleNumber === currentWeek || 
        (event.universalId && event.universalId.includes(`-${currentWeek}`));
        
      return isCycleDueDate && isCurrentCycle;
    });
    
    if (dueDateEvents.length > 0) {
      // Sort by recency (most recently updated first)
      dueDateEvents.sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0);
        const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0);
        return dateB - dateA;
      });
      
      console.log("Found existing due date event:", dueDateEvents[0]);
      setExistingDueDateEvent(dueDateEvents[0]);
      return dueDateEvents[0];
    }
    
    console.log("No existing due date event found for cycle", currentWeek);
    return null;
  } catch (error) {
    console.error("Error finding existing due date event:", error);
    return null;
  }
};
  



  // Load family streaks from database
  const loadFamilyStreaks = async () => {
    try {
      if (!familyId) return;
      
      // Get family document
      const docRef = doc(db, "families", familyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFamilyStreak(data.currentStreak || 0);
        setLongestStreak(data.longestStreak || 0);
      } else {
        // Default values if not found
        setFamilyStreak(0);
        setLongestStreak(0);
      }
    } catch (error) {
      console.error("Error loading family streaks:", error);
      // Set default values
      setFamilyStreak(0);
      setLongestStreak(0);
    }
  };
  
  const loadCycleProgress = async () => {
    try {
      if (!familyId) return;
      
      // Get family document
      const docRef = doc(db, "families", familyId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Get cycle data
        const cycleData = data.cycleProgress?.[currentWeek] || {
          step: 1,
          memberProgress: {}
        };
        setCycleData(cycleData);
        
        // Determine the current family-wide step based on progress
        let currentFamilyStep = cycleData.step || 1;
        
        // Initialize member progress with accurate step status
        const progress = {};
        familyMembers.forEach(member => {
          // Get stored progress or create default
          const memberData = cycleData.memberProgress?.[member.id] || {
            step: 1,
            completedSurvey: false,
            completedMeeting: false
          };
          
          // NEW CODE (replace with this)
// For parents, check if they've completed habits requirement and surveys
if (member.role === 'parent') {
  // Check for ANY of these indicators that survey is completed (using OR instead of AND)
  const surveyFullyCompleted =
    memberData.completedSurvey === true ||
    member.weeklyCompleted?.[currentWeek-1]?.completed === true ||
    (member.status && member.status.toLowerCase().includes("survey done"));

  // Always check for habit completions
  const parentHabits = Object.values(completedHabitInstances)
    .filter(instances => instances.some(instance =>
      instance.userId === member.id));

  const hasCompletedHabits = parentHabits.some(instances => instances.length >= 5);

  if (surveyFullyCompleted) {
    // If survey is completed by ANY measure, set to step 3 (meeting phase)
    memberData.step = 3;
    memberData.completedSurvey = true;

  } else if (memberData.step >= 2) {
    // If Firestore already has step 2 or higher, trust that (admin/demo data)
    // Don't downgrade based on habit checks
    if (member.id === selectedUser?.id) {
      setCanTakeSurvey(true);
    }

  } else if (hasCompletedHabits) {
    // If not fully completed but has enough habit completions, enable survey
    memberData.step = 2; // Ready for survey

    // Force canTakeSurvey to true for this case - this ensures partially
    // completed surveys can be resumed
    if (member.id === selectedUser?.id) {
      setCanTakeSurvey(true);
    }

  } else {
    memberData.step = 1; // Still doing habits
  }
}
          // For children, check if they've completed their survey
          else if (member.role === 'child') {
            // Child's step is based on survey completion - check multiple indicators
            const surveyCompleted = 
              memberData.completedSurvey || 
              member.weeklyCompleted?.[currentWeek-1]?.completed ||
              (member.status && member.status.toLowerCase().includes("survey done"));
            
            if (surveyCompleted) {
              memberData.step = 3; // Move to step 3 if survey completed
              memberData.completedSurvey = true; // Make sure this is set
            } else {
              memberData.step = 2; // Otherwise remain at step 2 (survey phase)
            }
          }
          
          progress[member.id] = memberData;
        });
        
        setMemberProgress(progress);
        
        // Compute overall cycle step based on member progress
        const allMembersProgress = Object.values(progress);
        const allCompletedHabits = allMembersProgress.every(p => p.step >= 2);
        const allCompletedSurveys = allMembersProgress.every(p => p.completedSurvey);
        
        // Update cycle step based on global progress
        if (allCompletedSurveys) {
          currentFamilyStep = 3; // Ready for family meeting
        } else if (allCompletedHabits) {
          currentFamilyStep = 2; // Survey phase
        } else {
          currentFamilyStep = 1; // Habit building phase
        }
        
        setCycleStep(currentFamilyStep);
        
        // Check if all family members have completed surveys to enable meeting
        const allSurveysCompleted = familyMembers.every(member => {
          // Check multiple indicators of survey completion
          const hasCompletedSurvey = 
            progress[member.id]?.completedSurvey || 
            member.weeklyCompleted?.[currentWeek-1]?.completed ||
            (member.status && member.status.toLowerCase().includes("survey done"));
          
          return hasCompletedSurvey;
        });
        
        setCanScheduleMeeting(allSurveysCompleted);
        
        // Update cycle progress data in Firebase if needed
        // This only updates step to 3 to make the meeting available
        // It does NOT mark the meeting as completed!
        if (allSurveysCompleted && cycleStep < 3) {
          try {
            const familyRef = doc(db, "families", familyId);
            
            // Update the cycle progress to move to step 3
            await updateDoc(familyRef, {
              [`cycleProgress.${currentWeek}.step`]: 3,
              // Explicitly set meeting.completed to false to clear any incorrect state
              [`cycleProgress.${currentWeek}.meeting.completed`]: false
            });
            
            // Also update local state
            setCycleStep(3);
          } catch (error) {
            console.error("Error updating cycle progress:", error);
          }
        }
        
        // Update cycle step based on global progress
        if (allCompletedSurveys) {
          currentFamilyStep = 3; // Ready for family meeting
        } else if (allCompletedHabits) {
          currentFamilyStep = 2; // Survey phase
        } else {
          currentFamilyStep = 1; // Habit building phase
        }
        
        setCycleStep(currentFamilyStep);
        
       // NEW CODE (replace with this)
// Update survey availability based on user role
if (selectedUser?.role === 'parent') {
  // For parents: Check if this specific parent has completed enough habits
  const currentUserProgress = progress[selectedUser.id];
  setCanTakeSurvey(currentUserProgress && currentUserProgress.step >= 2);
} else if (selectedUser?.role === 'child') {
  // For children: Always allow taking survey if ANY of these conditions are true:
  // 1. Any parent has completed habits (step >= 2)
  // 2. Overall cycle step is at least 2
  // 3. Any parent has completed survey 
  
  // Detailed logging for parent progress status
  familyMembers
    .filter(m => m.role === 'parent')
    .forEach(parent => {
      console.log(`Parent ${parent.name} survey eligibility:`, {
        id: parent.id,
        progressStep: progress[parent.id]?.step || 'unknown',
        completedSurvey: progress[parent.id]?.completedSurvey || false,
        weeklyCompleted: parent.weeklyCompleted?.[currentWeek-1]?.completed || false,
        status: parent.status || 'unknown'
      });
    });
  
  const anyParentCompleted = familyMembers
    .filter(m => m.role === 'parent')
    .some(parent => {
      // Check multiple indicators of completion (any of them)
      const completedByStep = progress[parent.id]?.step >= 2;
      const completedBySurveyFlag = progress[parent.id]?.completedSurvey === true;
      const completedByWeekly = parent.weeklyCompleted?.[currentWeek-1]?.completed === true;
      
      // If any indicator shows completion, consider it completed
      return completedByStep || completedBySurveyFlag || completedByWeekly;
    });
  
  // Always enable survey for children if cycle is at step 2+ OR any parent has made progress
  const shouldEnableSurvey = anyParentCompleted || currentFamilyStep >= 2;
  setCanTakeSurvey(shouldEnableSurvey);
  
  // Log debug info with more details
  console.log("Child survey availability:", {
    anyParentCompleted,
    currentFamilyStep,
    canTakeSurvey: shouldEnableSurvey
  });
  
  // Force to true for debug if any parent is at step 2+
  if (familyMembers.filter(m => m.role === 'parent').some(p => progress[p.id]?.step >= 2)) {
    console.log("Forcing canTakeSurvey=true because at least one parent is at step 2+");
    setCanTakeSurvey(true);
  }
}
        
        // Double-check survey availability - if user has enough habits, always enable survey
        if (selectedUser?.role === 'parent') {
          const userHabits = Object.values(completedHabitInstances)
            .filter(instances => instances.some(instance => instance.userId === selectedUser.id));
          const hasEnoughHabits = userHabits.some(instances => instances.length >= 5);
          
          // If they have enough habits, force enable survey regardless of other conditions
          if (hasEnoughHabits) {
            setCanTakeSurvey(true);
            console.log("Forcing canTakeSurvey=true because user has 5+ habit completions");
          }
        }
      }
    } catch (error) {
      console.error("Error loading cycle progress:", error);
    }
  };
  
  // Calculate next survey due date
  const calculateNextSurveyDue = () => {
    if (!surveySchedule) return;
    
    const nextWeek = currentWeek;
    const scheduledDate = surveySchedule[nextWeek];
    
    if (scheduledDate) {
      const dueDate = new Date(scheduledDate);
      const today = new Date();
      
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      // Check if the scheduled date is in the past
      if (dueDate < today) {
        console.log(`Scheduled date ${dueDate.toLocaleDateString()} is in the past, updating to future date`);
        
        // Set a new date 7 days from today
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + 7);
        newDueDate.setHours(18, 0, 0, 0); // Set to 6 PM
        
        // Update the survey schedule
        updateSurveySchedule(nextWeek, newDueDate);
        setSurveyDue(newDueDate);
        
        // Calculate days until new survey date
        const diffTime = newDueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysUntilSurvey(diffDays);
      } else {
        // Date is valid (in the future)
        setSurveyDue(dueDate);
        
        // Calculate days until survey
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setDaysUntilSurvey(diffDays);
      }
    } else {
      // No scheduled date exists, create one for 7 days from now
      console.log(`No scheduled date for week ${nextWeek}, creating new date`);
      
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 7);
      newDueDate.setHours(18, 0, 0, 0); // Set to 6 PM
      
      // Update the survey schedule
      updateSurveySchedule(nextWeek, newDueDate);
      setSurveyDue(newDueDate);
      
      // Calculate days until new survey date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = newDueDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilSurvey(diffDays);
    }
  };
  
 // Replace the updateCycleDueDate function in src/components/dashboard/tabs/TasksTab.jsx

const updateCycleDueDate = async (newDate, eventDetails = {}) => {
  if (!familyId || !currentUser) return false;
  
  try {
    setIsProcessing(true);
    
    // Validate the date - ensure it's a valid Date object
    if (!(newDate instanceof Date) || isNaN(newDate.getTime())) {
      throw new Error("Invalid date provided");
    }
    
    console.log(`Updating cycle due date to: ${newDate.toLocaleDateString()}`, 
      `Using event type: ${eventDetails.eventType || 'cycle-due-date'}`,
      `Using category: ${eventDetails.category || 'cycle-due-date'}`);
    
    // Create a simple event object
    const dueDateEvent = {
      ...eventDetails,
      title: eventDetails.title || `Cycle ${currentWeek} Due Date`,
      description: eventDetails.description || `Family meeting for Cycle ${currentWeek} to discuss survey results and set goals.`,
      dateTime: newDate.toISOString(),
      category: eventDetails.category || 'cycle-due-date',
      eventType: eventDetails.eventType || 'cycle-due-date',
      cycleNumber: currentWeek,
      universalId: `cycle-due-date-${familyId}-${currentWeek}`
    };
    
    // Use the EventStore directly
    let result;
    if (existingDueDateEvent && existingDueDateEvent.firestoreId) {
      // Update existing event
      // Create the update object with all necessary fields
      const updateObj = {
        ...dueDateEvent,
        // Ensure we include the start and end fields
        start: {
          dateTime: newDate.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: new Date(newDate.getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };
      
      // Log the complete update object
      console.log("Update object for eventStore.updateEvent:", updateObj);
      
      result = await eventStore.updateEvent(
        existingDueDateEvent.firestoreId, 
        updateObj,
        currentUser.uid
      );
    } else {
      // Create new event
      result = await eventStore.addEvent(dueDateEvent, currentUser.uid, familyId);
    }
    
    if (!result.success) {
      throw new Error(result.error || "Failed to update calendar");
    }
    
    // Update UI state
    setSurveyDue(newDate);
    
    // Update survey schedule in database for consistency
    await updateSurveySchedule(currentWeek, newDate);
    
    // Also update week status
    const updatedStatus = {
      ...weekStatus,
      [currentWeek]: {
        ...weekStatus[currentWeek],
        scheduledDate: newDate.toISOString()
      }
    };
    
    await DatabaseService.saveFamilyData({
      weekStatus: updatedStatus,
      updatedAt: new Date().toISOString()
    }, familyId);
    
    // Success message
    createCelebration(
      `Meeting Scheduled`, 
      true, 
      `Cycle ${currentWeek} meeting scheduled for ${newDate.toLocaleDateString()}`
    );
    
    setIsProcessing(false);
    return true;
  } catch (error) {
    console.error("Error updating cycle due date:", error);
    createCelebration("Update Failed", false, error.message || "Unknown error");
    setIsProcessing(false);
    return false;
  }
};

// src/components/dashboard/tabs/TasksTab.jsx (add this new function)

const cleanupDuplicateDueDateEvents = async () => {
  if (!familyId || !currentUser) return;
  
  try {
    console.log("Running duplicate event cleanup");
    
    // Get all events from CalendarService
    const events = await CalendarService.getEventsForUser(
      currentUser.uid,
      new Date(new Date().setDate(new Date().getDate() - 90)), // 90 days ago
      new Date(new Date().setDate(new Date().getDate() + 180))  // 180 days ahead
    );
    
    // Filter for current cycle due date events
    const titlePattern = new RegExp(`Cycle\\s*${currentWeek}\\s*Due\\s*Date`, 'i');
    const dueDateEvents = events.filter(event => 
      (event.category === 'cycle-due-date' || event.eventType === 'cycle-due-date' ||
       (event.title && titlePattern.test(event.title)) || 
       (event.summary && titlePattern.test(event.summary)))
    );
    
    if (dueDateEvents.length <= 1) {
      console.log("No duplicate events found. Nothing to clean up.");
      return;
    }
    
    console.log(`Found ${dueDateEvents.length} due date events for cycle ${currentWeek}. Keeping the newest.`);
    
    // Sort by date (most recent first)
    dueDateEvents.sort((a, b) => {
      // If there's a date difference, use that
      if (a.dateObj && b.dateObj) {
        return new Date(b.dateObj) - new Date(a.dateObj);
      }
      
      // Otherwise sort by creation/update time
      const timeA = a.updatedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.createdAt || 0;
      return new Date(timeB) - new Date(timeA);
    });
    
    // Keep the first (newest) event, delete others
    const keepEvent = dueDateEvents[0];
    const deleteEvents = dueDateEvents.slice(1);
    
    console.log(`Keeping event: ${keepEvent.title} (${keepEvent.firestoreId || keepEvent.id})`);
    console.log(`Deleting ${deleteEvents.length} duplicate events`);
    
    // Delete duplicates
    for (const event of deleteEvents) {
      if (event.firestoreId) {
        await CalendarService.deleteEvent(event.firestoreId, currentUser.uid);
        console.log(`Deleted duplicate event: ${event.title} (${event.firestoreId})`);
      }
    }
    
    // Force refresh calendar
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('force-calendar-refresh'));
    }
    
    console.log("Duplicate cleanup complete");
  } catch (error) {
    console.error("Error cleaning up duplicate events:", error);
  }
};


// Add this function to TasksTab.jsx - much simpler and more direct approach
const forceCalendarDateSync = async () => {
  try {
    // Get events directly from CalendarService
    const events = await CalendarService.getEventsForUser(
      currentUser.uid,
      new Date(new Date().setDate(new Date().getDate() - 90)), // 90 days ago
      new Date(new Date().setDate(new Date().getDate() + 180))  // 180 days ahead
    );
    
    console.log("Attempting direct calendar sync with", events.length, "events");
    
    // Find cycle due date event for current week
    const dueEvent = events.find(event => 
      (event.category === 'cycle-due-date' || event.eventType === 'cycle-due-date') && 
      (event.cycleNumber === currentWeek || 
      (event.title && event.title.includes(`Cycle ${currentWeek}`)))
    );
    
    if (dueEvent) {
      console.log("Found calendar event for sync:", dueEvent);
      
      // Get the date from the event
      let eventDate;
      if (dueEvent.start?.dateTime) {
        eventDate = new Date(dueEvent.start.dateTime);
      } else if (dueEvent.dateTime) {
        eventDate = new Date(dueEvent.dateTime);
      } else if (dueEvent.dateObj) {
        eventDate = new Date(dueEvent.dateObj);
      }
      
      if (eventDate && !isNaN(eventDate.getTime())) {
        console.log("Directly setting surveyDue to calendar date:", eventDate);
        setSurveyDue(eventDate);
        
        // Force refresh UI
        setTimeout(() => {
          calculateNextSurveyDue();
        }, 100);
        
        return eventDate;
      }
    }
    return null;
  } catch (error) {
    console.error("Error in direct calendar sync:", error);
    return null;
  }
};


  // Create a celebration notification
  const createCelebration = (habitTitle, success = true, customMessage = null) => {
    const newCelebration = {
      id: Date.now(),
      title: habitTitle,
      message: customMessage || generateCelebrationMessage(habitTitle),
      success: success
    };
    
    setCelebrations(prev => [newCelebration, ...prev]);
    
    // Remove celebration after 5 seconds
    setTimeout(() => {
      setCelebrations(prev => prev.filter(c => c.id !== newCelebration.id));
    }, 5000);
  };
  
  // Generate a random celebration message
  const generateCelebrationMessage = (title) => {
    const messages = [
      `Great job on ${title}! You're building a positive habit!`,
      `Way to go! Your consistency with ${title} is inspiring!`,
      `You completed ${title}! Small actions, big results!`,
      `Another step toward becoming the person you want to be!`,
      `That's ${familyStreak + 1} days in a row! Keep it up!`
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  };
  
  // Launch confetti effect
  const launchConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };
  
  const recordHabitInstance = async (habitId, reflectionNote = "") => {
    if (!familyId || !selectedUser) return;
    
    try {
      setIsProcessing(true);
      console.log(`Recording habit instance for habit ${habitId}`);
      
      // Create the new instance data
      const newInstance = {
        timestamp: new Date().toISOString(),
        userId: selectedUser.id,
        userName: selectedUser.name,
        notes: reflectionNote || ""
      };
      
      // Get current instances
      const currentInstances = completedHabitInstances[habitId] || [];
      const updatedInstances = [...currentInstances, newInstance];
      
      console.log(`Current instances: ${currentInstances.length}, Updated: ${updatedInstances.length}`);
      
      // Create a reference to the habit instances document
      const habitInstanceRef = doc(db, "families", familyId, "habitInstances", habitId);
      
      try {
        // First, check if the document exists
        const docSnap = await getDoc(habitInstanceRef);
        
        if (docSnap.exists()) {
          // Update existing document
          await updateDoc(habitInstanceRef, {
            instances: updatedInstances
          });
        } else {
          // Create new document
          await setDoc(habitInstanceRef, {
            instances: updatedInstances
          });
        }
        
        console.log("Database updated successfully");
        
        // Also update the task's completion status if this is the first completion
        if (currentInstances.length === 0) {
          try {
            const familyRef = doc(db, "families", familyId);
            const familyDoc = await getDoc(familyRef);
            
            if (familyDoc.exists()) {
              const tasks = familyDoc.data().tasks || [];
              const updatedTasks = tasks.map(task => {
                if (task.id === habitId) {
                  // Update the first subtask as completed
                  const updatedSubTasks = task.subTasks?.map((st, idx) => 
                    idx === 0 ? {...st, completed: true} : st
                  ) || [];
                  
                  return {
                    ...task,
                    subTasks: updatedSubTasks,
                    lastCompleted: newInstance.timestamp
                  };
                }
                return task;
              });
              
              await updateDoc(familyRef, {
                tasks: updatedTasks
              });
              
              console.log("Task updated with completion status");
            }
          } catch (taskError) {
            console.error("Error updating task:", taskError);
          }
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        createCelebration("Error", false, "Failed to save your habit completion.");
        setIsProcessing(false);
        return false;
      }
      
      // First update the completedHabitInstances in a separate state update
      setCompletedHabitInstances(prev => {
        const newState = {...prev};
        newState[habitId] = updatedInstances;
        return newState;
      });
      
      // Update the tracking count in habits state
      const habit = habits.find(h => h.id === habitId);
      if (habit) {
        // Create a fresh copy of the habits array with defensive programming
        const updatedHabits = habits.map(h => {
          if (h.id === habitId) {
            return {
              ...h,
              completionInstances: updatedInstances || [], // Ensure this isn't undefined
              lastCompleted: newInstance.timestamp,
              // Also increment streak with safer math
              streak: (h.streak || 0) + 1,
              record: Math.max((h.streak || 0) + 1, h.record || 0)
            };
          }
          return h;
        });
        
        // Set the updated habits
        setHabits(updatedHabits);
        
        // Create celebration
        createCelebration(habit.title, true);
        
        // Also update the habit streaks in the database
        try {
          const familyRef = doc(db, "families", familyId);
          await updateDoc(familyRef, {
            [`habitStreaks.${habitId}`]: increment(1),
            [`habitStreaks.${habitId}_record`]: (habit.streak + 1 > (habit.record || 0)) ? habit.streak + 1 : increment(0)
          });
          
          console.log("Habit streaks updated in database");
        } catch (streakError) {
          console.error("Error updating habit streaks:", streakError);
        }
        
        // Milestone reached - 5 or more completions
        if (updatedInstances.length >= 5) {
          try {
            // Update the parent's cycle step in Firebase
            const familyRef = doc(db, "families", familyId);
            
            // First, get current cycle progress
            const familyDoc = await getDoc(familyRef);
            const currentCycleProgress = familyDoc.data()?.cycleProgress || {};
            const cycleProgressData = currentCycleProgress[currentWeek] || {
              step: 1,
              memberProgress: {}
            };
            
            // Update this parent's progress
            cycleProgressData.memberProgress = {
              ...(cycleProgressData.memberProgress || {}),
              [selectedUser.id]: {
                ...(cycleProgressData.memberProgress?.[selectedUser.id] || {}),
                step: 2
              }
            };
            
            // Check if all parents have reached step 2
            const allParents = familyMembers.filter(m => m.role === 'parent');
            const allParentsReady = allParents.every(parent => {
              // Either this parent we're updating, or already at step 2+
              return parent.id === selectedUser.id || 
                    (cycleProgressData.memberProgress?.[parent.id]?.step >= 2);
            });
            
            // If all parents have reached 5 completions, move whole cycle to step 2
            if (allParentsReady) {
              cycleProgressData.step = 2;
            }
            
            // Save to Firebase
            await updateDoc(familyRef, {
              [`cycleProgress.${currentWeek}`]: cycleProgressData
            });
            
            // Update local state
            setMemberProgress(prev => ({
              ...prev,
              [selectedUser.id]: {
                ...prev[selectedUser.id],
                step: 2
              }
            }));
            
            // If moved to step 2, update cycle step
            if (allParentsReady) {
              setCycleStep(2);
            }
            
            // Trigger cycle progress refresh
            loadCycleProgress();
          } catch (error) {
            console.error("Error updating cycle progress:", error);
          }
          
          // Check if survey is already completed before showing celebrations
  const userProgress = memberProgress[selectedUser.id] || {};
  const hasAlreadyCompletedSurvey = 
    userProgress.completedSurvey === true || 
    (selectedUser.weeklyCompleted && 
     selectedUser.weeklyCompleted[currentWeek-1]?.completed === true);
  
  if (!hasAlreadyCompletedSurvey) {
    // Only launch confetti and show celebration if survey isn't completed yet
    launchConfetti();
    
    // Enable survey
    setCanTakeSurvey(true);
    
    // Show special celebration
    createCelebration("Survey Unlocked!", true, "You've completed a habit 5 times! Click 'Take Survey' when you're ready.");
    
    // DO NOT auto-open the survey - let the user click the button when they're ready
  } else {
    // Still enable the survey button in case they want to review their answers
    setCanTakeSurvey(true);
  }
        }
        // Other milestone - 11 completions (mastery)
        else if (updatedInstances.length === 11) {
          launchConfetti();
          createCelebration("Habit Mastered!", true, "You've mastered this habit! Great job!");
        }
      }
      
      // Reset reflection
      setReflection('');
      
      setIsProcessing(false);
      return true;
    } catch (error) {
      console.error("Error recording habit instance:", error);
      createCelebration("Error", false, "Failed to record habit completion.");
      setIsProcessing(false);
      return false;
    }
  };
  
  // Save reflection after completing a habit
  const saveReflection = async () => {
    if (!reflection.trim() || !selectedHabit) return;
    
    try {
      // Save the comment
      await addTaskComment(selectedHabit.id, reflection);
      
      // Add to local state
      const updatedHabits = habits.map(h => {
        if (h.id === selectedHabit.id) {
          return {
            ...h,
            comments: [...(h.comments || []), {
              id: Date.now(),
              userId: selectedUser.id,
              userName: selectedUser.name,
              text: reflection,
              timestamp: new Date().toISOString()
            }]
          };
        }
        return h;
      });
      
      setHabits(updatedHabits);
      setReflection('');
      setExpandedHabitId(null);
      
      // Show success message
      createCelebration("Reflection Saved", true);
    } catch (error) {
      console.error("Error saving reflection:", error);
    }
  };
  

  /* const createNewHabit = async (isRefresh = false) => {
    try {
      setAllieIsThinking(true);
      
      // More varied habit options for better user experience
      const habitOptions = [
        {
          title: "Family Calendar Check-in",
          description: "Take a moment each day to review the family calendar",
          cue: "After breakfast",
          action: "Check the family calendar for today's events",
          reward: "Feel organized and prepared for the day",
          identity: "I am someone who stays on top of family commitments"
        },
        {
          title: "Evening Tidy-up",
          description: "Spend 5 minutes tidying a shared family space",
          cue: "After dinner",
          action: "Set a 5-minute timer and tidy one area",
          reward: "Enjoy a cleaner space and reduced stress",
          identity: "I am someone who contributes to family organization"
        },
        {
          title: "Meal Planning Check-in",
          description: "Review upcoming meal plans and grocery needs",
          cue: "Before breakfast",
          action: "Check meal plan and shopping list",
          reward: "Feel prepared and reduce decision fatigue",
          identity: "I am someone who helps manage family nutrition"
        }
      ];
      
      // Select a habit option (randomly if refreshing, first option if new)
      const selectedOption = isRefresh 
        ? habitOptions[Math.floor(Math.random() * habitOptions.length)]
        : habitOptions[0];
      
      // Destructure the selected habit data
      const { title, description, cue, action, reward, identity } = selectedOption;
      
      // Create the habit subtasks
      const subTasks = [
        { title: cue, description: "This is your trigger" },
        { title: action, description: "This is the habit action" },
        { title: reward, description: "This is your reward" }
      ];
      
      try {
        // Create the habit in the tasks array of the family document
        const familyRef = doc(db, "families", familyId);
        const familyDoc = await getDoc(familyRef);
        
        if (!familyDoc.exists()) {
          throw new Error("Family document not found");
        }
        
        // Get current tasks
        const currentTasks = familyDoc.data().tasks || [];
        
        // Clear previous non-user habit instances from state if refreshing
        if (isRefresh) {
          const systemHabit = habits.find(h => !h.isUserGenerated);
          if (systemHabit) {
            // Clear the completions from state
            setCompletedHabitInstances(prev => {
              const newState = {...prev};
              delete newState[systemHabit.id];
              return newState;
            });
            
            // Attempt to clean up old habit instances in database
            try {
              const habitInstanceRef = doc(db, "families", familyId, "habitInstances", systemHabit.id);
              await updateDoc(habitInstanceRef, {
                instances: [],
                refreshed: true,
                refreshedAt: new Date().toISOString()
              });
            } catch (cleanupError) {
              console.warn("Non-critical error cleaning up old habit:", cleanupError);
              // Continue even if this fails
            }
          }
        }
        
        // If refreshing, first remove the initial habit
        let updatedTasks = [...currentTasks];
        if (isRefresh) {
          // Find and remove ALL non-user-generated habits to prevent duplicates
          const systemHabitIds = habits
            .filter(h => !h.isUserGenerated)
            .map(h => h.id);
          
          // Remove all system-generated habits from the tasks array
          updatedTasks = updatedTasks.filter(t => !systemHabitIds.includes(t.id));
        }
        
        // Generate a unique ID
        const taskId = `habit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        
        // Create the new habit with the ID
        const newHabit = {
          id: taskId,
          title: title,
          description: description,
          cue: cue,
          action: action,
          reward: reward,
          identity: identity,
          assignedTo: selectedUser?.roleType || selectedUser?.role || "Everyone",
          assignedToName: selectedUser?.name || "Everyone",
          category: identity.includes("parent") ? "Parental Tasks" : "Household Tasks",
          insight: `This habit helps build your identity as someone who values family balance.`,
          completed: false,
          comments: [],
          streak: 0,
          record: 0,
          progress: 0,
          lastCompleted: null,
          isUserGenerated: !isRefresh, // If refreshing, this is the new initial habit
          subTasks: subTasks.map((st, idx) => ({
            id: `${taskId}-step-${idx + 1}`,
            title: st.title,
            description: st.description,
            completed: false
          }))
        };
        
        // Update the tasks array
        await updateDoc(familyRef, {
          tasks: [...updatedTasks, newHabit]
        });
        
        // Set up empty habit instances
await setDoc(doc(db, "families", familyId, "habitInstances", taskId), {
  instances: [],
  createdAt: new Date().toISOString(),
  isSystemGenerated: !newHabit.isUserGenerated
});

// Create a version of the habit with completionInstances explicitly set
const habitWithCompletions = {
  ...newHabit,
  completionInstances: [] // Explicitly ensure this is set
};

// Update both state variables BEFORE updating the UI
// First update the tracking instances
setCompletedHabitInstances(prev => ({
  ...prev,
  [taskId]: []
}));

// Then update the habits state to avoid race conditions
if (isRefresh) {
  // Replace the initial habit
  setHabits(prev => {
    const filtered = prev.filter(h => h.isUserGenerated);
    return [habitWithCompletions, ...filtered];
  });
  createCelebration("Habit refreshed!", true);
} else {
  // Add to habits as user-generated
  setHabits(prev => [
    habitWithCompletions,
    ...prev
  ]);
  createCelebration("New habit created!", true);
}
        
        setShowAddHabit(false);
      } catch (dbError) {
        console.error("Database error creating habit:", dbError);
        throw dbError;
      }
      
      setAllieIsThinking(false);
      return true;
    } catch (error) {
      console.error("Error creating new habit:", error);
      setAllieIsThinking(false);
      createCelebration("Error", false, "Could not create habit. Please try again later.");
      return false;
    }
  }; */
        
 
  
  // Delete habit
  const deleteHabit = async (habitId) => {
    try {
      if (!familyId || !habitId) return;
      
      // Show confirmation modal instead of browser confirm
      setConfirmModal({
        show: true,
        title: 'Delete Habit',
        message: 'Are you sure you want to delete this habit?',
        onConfirm: async () => {
          try {
            // Delete from HabitCyclesService
            await HabitCyclesService.deleteHabit(habitId, familyId);
            
            // Also try to delete from tasks collection (for backwards compatibility)
            const familyRef = doc(db, "families", familyId);
            const familyDoc = await getDoc(familyRef);
            
            if (familyDoc.exists()) {
              const currentTasks = familyDoc.data().tasks || [];
              console.log(`[DEBUG] Current tasks count: ${currentTasks.length}`);
              console.log(`[DEBUG] Looking for habit with id: ${habitId}`);
              
              const habitToDelete = currentTasks.find(t => t.id === habitId);
              if (habitToDelete) {
                console.log(`[DEBUG] Found habit in tasks array:`, habitToDelete.title);
              } else {
                console.log(`[DEBUG] Habit NOT found in tasks array`);
                // Try to find by title as fallback
                const habitByTitle = currentTasks.find(t => 
                  t.title && t.title.toLowerCase().includes('invisible parenting')
                );
                if (habitByTitle) {
                  console.log(`[DEBUG] Found habit by title with id: ${habitByTitle.id}`);
                }
              }
              
              const updatedTasks = currentTasks.filter(t => t.id !== habitId);
              console.log(`[DEBUG] Updated tasks count: ${updatedTasks.length}`);
              
              await updateDoc(familyRef, {
                tasks: updatedTasks,
                updatedAt: new Date().toISOString()
              });
            }
            
            // Remove from completedHabitInstances state
            setCompletedHabitInstances(prev => {
              const newState = {...prev};
              delete newState[habitId];
              return newState;
            });
            
            // Show success notification
            createCelebration("Habit deleted", true, "The habit has been removed successfully");
            
            // Reload all data to ensure consistency
            await loadData();
            
            // Close modal
            setConfirmModal({ show: false, title: '', message: '', onConfirm: null, onCancel: null });
          } catch (error) {
            console.error("Error deleting habit:", error);
            createCelebration("Error", false, "Failed to delete the habit. Please try again.");
            setConfirmModal({ show: false, title: '', message: '', onConfirm: null, onCancel: null });
          }
        },
        onCancel: () => {
          setConfirmModal({ show: false, title: '', message: '', onConfirm: null, onCancel: null });
        }
      });
    } catch (error) {
      console.error("Error in deleteHabit:", error);
      createCelebration("Error", false, "Failed to delete the habit");
    }
  };
  
  // Check if habit has any completions
  const hasCompletedInstances = (habitId) => {
    return (completedHabitInstances[habitId]?.length || 0) > 0;
  };

  const handleStartSurvey = () => {
    // Only check for FULLY completed surveys, not partially completed ones
    const userProgress = memberProgress[selectedUser.id] || {};
    
    // Look for definite completion markers, not just progress markers
    const hasFullyCompleted = 
      // Check for explicit true completion flag
      (userProgress.completedSurvey === true) || 
      // Check weekly completed explicitly marked as true
      (selectedUser.weeklyCompleted && 
       selectedUser.weeklyCompleted[currentWeek-1]?.completed === true);
    
    // Don't use step >= 3 since that might be triggered by partial completion
    
    // Already completed check - only block if FULLY completed
    if (hasFullyCompleted) {
      createCelebration("Already Completed", false, "You've already completed the survey for this cycle.");
      return;
    }
    
    if (selectedUser.role === 'parent') {
      // For parents: Check if they personally have enough habits
      const parentHabits = Object.values(completedHabitInstances).filter(instances => 
        instances.some(instance => instance.userId === selectedUser.id));
      const hasEnoughCompletions = parentHabits.some(instances => instances.length >= 5);
      
      if (hasEnoughCompletions) {
        onStartWeeklyCheckIn();
      } else {
        createCelebration("Not Ready Yet", false, "Complete a habit at least 5 times to unlock the survey.");
      }
    } else {
      // For children: They can ALWAYS take the survey - they start at step 2
      // No need to wait for parents to complete habits
      onStartWeeklyCheckIn();
    }
  };
  
  // Trigger Allie chat with drawer
  const triggerAllieChat = (message, options = {}) => {
    console.log("Triggering Allie chat with message:", message, "options:", options);
    
    // Use the ChatDrawer context to open the drawer with the prompt and options
    openDrawerWithPrompt(message, options);
    
    // Show a subtle confirmation to the user
    createCelebration("Asking Allie", true, "Opening chat...");
  };
  
  // Filter for all family members (both adults and children)
  const displayedMembers = familyMembers.filter(m => m.role === 'parent' || m.role === 'child');
  
  // Filter habits for the current user
  const userHabits = habits.filter(habit => 
    habit.assignedTo === (selectedUser?.roleType || selectedUser?.role) || 
    habit.assignedToName === selectedUser?.name ||
    habit.assignedTo === "Everyone"
  );
  
  // Memoize the cycleData object to prevent recreating it on every render
  const memoizedCycleData = useMemo(() => ({
    meeting: {
      scheduled: !!meetingDate,
      scheduledDate: meetingDate || null,
      completed: cycleData?.meeting?.completed === true
    },
    survey: {
      enabled: canTakeSurvey,
      completed: selectedUser?.weeklyCompleted?.[currentWeek-1]?.completed === true
    },
    step: cycleStep,
    stepComplete: {
      1: Object.values(completedHabitInstances).some(instances => 
          instances && instances.some(instance => 
            instance.userId === selectedUser?.id) && 
          instances.length >= 5
        ),
      2: selectedUser?.weeklyCompleted?.[currentWeek-1]?.completed === true,
      3: cycleData?.meeting?.completed === true
    }
  }), [meetingDate, cycleData, canTakeSurvey, selectedUser, currentWeek, cycleStep, completedHabitInstances]);
  
  // Memoize the onStartStep callback
  const handleStartStep = useCallback((action, step) => {
    if (action === "habit") {
      // Scroll to habits section first
      setTimeout(() => {
        const habitsSection = document.getElementById('family-habits-section');
        if (habitsSection) {
          habitsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      // Find first uncompleted habit
      const firstHabit = habits.find(h => !h.completed);
      if (firstHabit) {
        setSelectedHabit(firstHabit);
        setExpandedHabitId(firstHabit.id);
        // Then scroll to the specific habit
        setTimeout(() => {
          const habitElement = document.getElementById(`habit-${firstHabit.id}`);
          if (habitElement) {
            habitElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
        (() => {
          // Guide user to select a habit through proper channels
          const habitSection = document.getElementById('current-habits-section');
          if (habitSection) {
            habitSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            createCelebration("Select a Habit", true, "Choose a habit from Allie or the radar chart below");
          }
        })();
      }
    }
    else if (action === "survey") handleStartSurvey();
    else if (action === "meeting") onOpenFamilyMeeting();
  }, [habits, handleStartSurvey, onOpenFamilyMeeting, createCelebration]);
  
  return (
    <div
      className="bg-white rounded-lg shadow overflow-y-auto font-roboto transition-all duration-300 ease-in-out"
      style={{
        marginRight: showNewHabitDrawer ? '80px' : '0'
      }}
    >
      {/* Replace with CycleJourney component */}
      <MemoizedCycleJourney
        cycleType="family"
        currentCycle={currentWeek}
        cycleData={memoizedCycleData}
        familyMembers={familyMembers}
        currentUser={selectedUser}
        memberProgress={memberProgress}
        completedHabitInstances={completedHabitInstances}
        onStartStep={handleStartStep}
        dueDate={surveyDue instanceof Date ? surveyDue : (surveyDue ? new Date(surveyDue) : null)}
        onChangeDueDate={() => {
          console.log('Change due date clicked - opening Event Drawer');

          // If there's an existing event, open it for editing
          if (existingDueDateEvent) {
            setSelectedEvent(existingDueDateEvent);
            setIsEventDrawerOpen(true);
          } else {
            // Create a new event template for the family meeting
            const newEvent = {
              title: `Cycle ${currentWeek} Family Meeting`,
              description: `Discuss survey results and plan improvements for Cycle ${currentWeek}.`,
              startDate: surveyDue ? new Date(surveyDue) : new Date(),
              endDate: surveyDue ? new Date(new Date(surveyDue).getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000), // 1 hour duration
              allDay: false,
              attendees: familyMembers.map(m => m.id),
              userId: currentUser?.id,
              familyId: familyId
            };
            setSelectedEvent(newEvent);
            setIsEventDrawerOpen(true);
          }
        }}
        loading={loading}
      />

      {/* Habit Completion Progress Counter - Compact with Avatars */}
      {selectedUser?.role === 'parent' && (
        <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Show parent avatars with completion counts */}
              {familyMembers
                .filter(m => m.role === 'parent')
                .map(parent => {
                  const parentCompletions = calculateTotalCompletions(
                    parent.id,
                    completedHabitInstances,
                    habits2Completions,
                    habits2FullData,
                    allParentHabits
                  );

                  return (
                    <div key={parent.id} className="relative">
                      <div className={`w-10 h-10 rounded-full overflow-hidden border-2 ${
                        parentCompletions >= 5 ? 'border-green-500' : 'border-gray-300'
                      }`}>
                        {parent.profilePicture || parent.profilePictureUrl ? (
                          <img
                            src={parent.profilePicture || parent.profilePictureUrl}
                            alt={parent.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm">
                            {parent.name?.[0]?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        parentCompletions >= 5 ? 'bg-green-500' : 'bg-purple-500'
                      }`}>
                        {parentCompletions}
                      </div>
                    </div>
                  );
                })}
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-900">
                  Complete 5 habits to unlock Family Survey
                </span>
                {(() => {
                  const userCompletions = calculateTotalCompletions(
                    selectedUser.id,
                    completedHabitInstances,
                    habits2Completions,
                    habits2FullData,
                    allParentHabits
                  );

                  if (userCompletions >= 5) {
                    return <span className="text-xs text-green-600 font-medium">✓ You're ready!</span>;
                  } else {
                    return <span className="text-xs text-gray-600">{5 - userCompletions} more to go!</span>;
                  }
                })()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const userCompletions = calculateTotalCompletions(
                  selectedUser.id,
                  completedHabitInstances,
                  habits2Completions,
                  habits2FullData,
                  allParentHabits
                );

                const progressPercent = Math.min((userCompletions / 5) * 100, 100);

                return (
                  <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Task Calendar Integration removed per user request */}

      {/* Family Priorities Section - Display onboarding preferences */}
      {/* Your Family's Priorities section - commented out as requested
      {familyData?.priorities && (familyData.priorities.highestPriority || familyData.priorities.secondaryPriority || familyData.priorities.tertiaryPriority) && (
        <div className="p-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
                <Target size={20} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 text-sm mb-2">
                  Your Family's Priorities
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥇</span>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Top Priority:</span> Invisible Parental Tasks
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥈</span>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Secondary:</span> Visible Parental Tasks
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥉</span>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Also Important:</span> Invisible Household Tasks
                    </p>
                  </div>
                </div>
                {familyData.communication?.style && (
                  <div className="mt-3 pt-3 border-t border-purple-100">
                    <p className="text-xs text-gray-600">
                      <Heart size={14} className="inline mr-1 text-pink-500" />
                      Communication Style: <span className="font-medium">{familyData.communication.style}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Four Category Radar Chart */}
      <div className="p-4 border-t border-gray-200" id="four-category-radar">
        {/* Fun explanation box - commented out as requested
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center flex-shrink-0">
              <Zap size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-sm mb-1">
                Two Ways to Create Your Perfect Habit! 🎯
              </h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-lg">🤖</span>
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Let Allie Choose:</span> Click "Let Allie Choose For Me" below and our AI will analyze your family's unique needs to suggest the perfect habit
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-lg">🎨</span>
                  <p className="text-xs text-gray-700">
                    <span className="font-medium">Pick From Radar Chart:</span> Explore the categories below to see your family's workload balance and select habits that address your specific imbalances
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div> */}
        
        {eloLoading && (
          <div className="mb-4 text-center text-sm text-gray-600">
            Loading ELO ratings...
          </div>
        )}

        {/* Family Task Balance Section with Instructions - Only for parents */}
        {selectedUser?.role === 'parent' && (
        <div id="family-task-balance-section" className="mb-8">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <Info className="w-5 h-5 mr-2 text-purple-600" />
              How to Create Balanced Family Habits
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <strong>1. Understanding the Chart:</strong> The radar chart below shows who does what in your family.
                Bigger shapes mean more responsibility. The goal is balanced, not perfect symmetry.
              </p>
              <p>
                <strong>2. Click a Category:</strong> Select any of the 4 main categories (like "Visible Household Tasks")
                to see detailed breakdowns and imbalances.
              </p>
              <p>
                <strong>3. Choose a Habit:</strong> Pick from 3 personalized suggestions based on your family's actual imbalances.
                Click "Refresh" for more options.
              </p>
              <p>
                <strong>4. Complete 5 Times:</strong> Each parent needs to complete their chosen habit 5 times to unlock
                the Family Survey and move to the next cycle. Kids can help too!
              </p>
            </div>
          </div>

          <FourCategoryRadar
          surveyData={(() => {
            // Use all family survey responses with member metadata if available
            const responsesToUse = allFamilySurveyResponses && Object.keys(allFamilySurveyResponses).length > 0
              ? allFamilySurveyResponses
              : (surveyResponses || {});

            // Use personalized questions if available, otherwise fall back to full question set
            const questionsToUse = currentPersonalizedQuestions || fullQuestionSet || [];

            console.log('FourCategoryRadar data source:', {
              usingAllFamilyResponses: !!(allFamilySurveyResponses && Object.keys(allFamilySurveyResponses).length > 0),
              responseCount: Object.keys(responsesToUse).length,
              loading: surveyDataLoading,
              questionsAvailable: questionsToUse.length,
              usingPersonalized: !!currentPersonalizedQuestions
            });
            
            // Process actual survey responses from the database
            if (Object.keys(responsesToUse).length > 0) {
              
              // Initialize category counts
              const categoryData = {
                invisible_parenting: { mama: 0, papa: 0, both: 0, total: 0 },
                visible_parenting: { mama: 0, papa: 0, both: 0, total: 0 },
                invisible_household: { mama: 0, papa: 0, both: 0, total: 0 },
                visible_household: { mama: 0, papa: 0, both: 0, total: 0 }
              };
              
              // Process each survey response
              Object.entries(responsesToUse).forEach(([questionId, responseData]) => {
                let answer, category;

                // Remove member prefix if present (e.g., "userId_questionId" -> "questionId")
                // Handle multiple underscores in the key (e.g., "familyId_userId_questionId")
                const parts = questionId.split('_');
                const cleanQuestionId = parts[parts.length - 1]; // Get the last part as the question ID

                // Handle both simple and enriched response formats
                if (typeof responseData === 'string') {
                  answer = responseData;

                  // Try to find the question in our questions array to get its actual category
                  let question = null;
                  if (questionsToUse && questionsToUse.length > 0) {
                    // First try exact match
                    question = questionsToUse.find(q => q.id === cleanQuestionId);

                    // If not found, try with various ID formats
                    if (!question) {
                      // Try batch format (qbatch1, qbatch2, etc.)
                      if (cleanQuestionId.startsWith('qbatch')) {
                        const batchMatch = cleanQuestionId.match(/qbatch(\d+)/);
                        if (batchMatch) {
                          const batchNum = parseInt(batchMatch[1], 10);
                          const baseQuestionNum = (batchNum - 1) * 18 + 1;
                          // Try to find by batch pattern
                          question = questionsToUse.find(q =>
                            q.id && (q.id.startsWith(`batch${batchNum}_`) || q.id === `q${baseQuestionNum}`)
                          );
                        }
                      }

                      // Try by question number
                      if (!question) {
                        const qNum = parseInt(cleanQuestionId.replace(/[^0-9]/g, ''));
                        if (!isNaN(qNum) && qNum > 0 && qNum <= questionsToUse.length) {
                          question = questionsToUse[qNum - 1];
                        }
                      }
                    }
                  }

                  // If we found the question, use its category
                  if (question && question.category) {
                    const questionCategory = question.category.toLowerCase();

                    // Map the question category to our four main categories
                    if (questionCategory.includes('invisible') && questionCategory.includes('parent')) {
                      category = 'invisible_parenting';
                    } else if (questionCategory.includes('visible') && questionCategory.includes('parent')) {
                      category = 'visible_parenting';
                    } else if (questionCategory.includes('invisible') && (questionCategory.includes('household') || questionCategory.includes('cognitive'))) {
                      category = 'invisible_household';
                    } else if (questionCategory.includes('visible') && questionCategory.includes('household')) {
                      category = 'visible_household';
                    } else if (questionCategory === 'cognitive labor') {
                      category = 'invisible_household';
                    } else if (questionCategory === 'household management') {
                      category = 'visible_household';
                    }
                  }

                  // Fallback to hardcoded ranges if no question found
                  if (!category) {
                    const qNum = parseInt(cleanQuestionId.replace(/[^0-9]/g, ''));

                    if (!isNaN(qNum)) {
                      // Map based on question number ranges
                      // Standard survey is 72 questions (18 per category)
                      if (qNum >= 1 && qNum <= 18) {
                        category = 'visible_household';
                      } else if (qNum >= 19 && qNum <= 36) {
                        category = 'invisible_household';
                      } else if (qNum >= 37 && qNum <= 54) {
                        category = 'visible_parenting';
                      } else if (qNum >= 55 && qNum <= 72) {
                        category = 'invisible_parenting';
                      } else if (qNum > 72) {
                        // For dynamic questions beyond 72, use a repeating pattern
                        const adjustedNum = ((qNum - 73) % 72) + 1;
                        if (adjustedNum >= 1 && adjustedNum <= 18) {
                          category = 'visible_household';
                        } else if (adjustedNum >= 19 && adjustedNum <= 36) {
                          category = 'invisible_household';
                        } else if (adjustedNum >= 37 && adjustedNum <= 54) {
                          category = 'visible_parenting';
                        } else if (adjustedNum >= 55 && adjustedNum <= 72) {
                          category = 'invisible_parenting';
                        }
                      }
                    }
                  }
                } else if (typeof responseData === 'object' && responseData.answer) {
                  answer = responseData.answer;
                  category = responseData.category;
                  
                  // Map category names to match what the radar chart expects
                  const categoryMapping = {
                    'Invisible Parental Tasks': 'invisible_parenting',
                    'Visible Parental Tasks': 'visible_parenting',
                    'Invisible Household Tasks': 'invisible_household',
                    'Visible Household Tasks': 'visible_household',
                    'cognitive_labor': 'invisible_household',
                    'household_management': 'visible_household'
                  };
                  
                  if (categoryMapping[category]) {
                    category = categoryMapping[category];
                  }
                  
                  // If category is still "Unknown", try to derive it from question ID
                  if (category === 'Unknown' || !category) {
                    const qNum = parseInt(cleanQuestionId.replace(/[^0-9]/g, ''));
                    if (!isNaN(qNum)) {
                      if (qNum >= 1 && qNum <= 18) {
                        category = 'visible_household';
                      } else if (qNum >= 19 && qNum <= 36) {
                        category = 'invisible_household';
                      } else if (qNum >= 37 && qNum <= 54) {
                        category = 'visible_parenting';
                      } else if (qNum >= 55 && qNum <= 72) {
                        category = 'invisible_parenting';
                      } else if (qNum > 72) {
                        const adjustedNum = ((qNum - 73) % 72) + 1;
                        if (adjustedNum >= 1 && adjustedNum <= 18) {
                          category = 'visible_household';
                        } else if (adjustedNum >= 19 && adjustedNum <= 36) {
                          category = 'invisible_household';
                        } else if (adjustedNum >= 37 && adjustedNum <= 54) {
                          category = 'visible_parenting';
                        } else if (adjustedNum >= 55 && adjustedNum <= 72) {
                          category = 'invisible_parenting';
                        }
                      }
                    }
                  }
                }
                
                // Extract weight from response data
                let weight = 1;
                if (typeof responseData === 'object' && responseData.weight) {
                  weight = responseData.weight;
                }
                
                // Validate we have a valid category
                const isValidCategory = category && categoryData[category];
                
                // Count weighted responses by category
                if (isValidCategory && answer && answer !== 'N/A' && answer !== 'NA' && answer !== 'Not applicable') {
                  // Normalize answer format
                  let normalizedAnswer = answer.toString().toLowerCase().trim();

                  // MEMBER ID MAPPING: Convert member IDs to mama/papa roles
                  // Survey responses may contain member IDs like "kimberly_palsson_agent" instead of "mama"
                  // We need to map these to roles based on familyMembers data
                  if (familyMembers && familyMembers.length > 0) {
                    // Try to find a matching family member by userId
                    const matchingMember = familyMembers.find(member =>
                      member.userId && normalizedAnswer.includes(member.userId.toLowerCase())
                    );

                    if (matchingMember) {
                      // Found a member match - convert to mama/papa based on role
                      const role = matchingMember.role?.toLowerCase() || '';
                      const name = matchingMember.name?.toLowerCase() || '';

                      // Determine mama/papa based on role and name
                      // First parent alphabetically becomes "mama", second becomes "papa"
                      const parents = familyMembers.filter(m => m.role === 'parent' || m.isParent);
                      if (parents.length >= 2) {
                        const sortedParents = [...parents].sort((a, b) =>
                          (a.name || '').localeCompare(b.name || '')
                        );

                        if (matchingMember.userId === sortedParents[0].userId) {
                          normalizedAnswer = 'mama';
                        } else if (matchingMember.userId === sortedParents[1].userId) {
                          normalizedAnswer = 'papa';
                        }
                      } else if (role === 'parent' || matchingMember.isParent) {
                        // Only one parent, default to mama
                        normalizedAnswer = 'mama';
                      }

                      // Log only first 3 mappings to avoid console spam
                      if (Object.keys(responsesToUse).indexOf(questionId) < 3) {
                        console.log(`Mapped member ID "${answer}" to role "${normalizedAnswer}" for ${matchingMember.name}`);
                      }
                    }
                  }

                  if (normalizedAnswer === 'mama' || normalizedAnswer === 'mother' || normalizedAnswer === 'mom') {
                    categoryData[category].mama += weight;
                  } else if (normalizedAnswer === 'papa' || normalizedAnswer === 'father' || normalizedAnswer === 'dad') {
                    categoryData[category].papa += weight;
                  } else if (normalizedAnswer === 'both' || normalizedAnswer === 'both equally' || normalizedAnswer === 'draw' || normalizedAnswer === 'tie') {
                    // Treat "Draw" as "Both equally" - split 50/50
                    categoryData[category].both += weight;
                  } else {
                    // Log only first 3 unrecognized answers to avoid console spam
                    if (Object.keys(responsesToUse).indexOf(questionId) < 3) {
                      console.log('Unrecognized answer format:', answer, 'for question:', cleanQuestionId);
                    }
                  }
                  categoryData[category].total += weight;
                } else {
                  // Debug why responses are being skipped - log first 20 for debugging
                  if (Object.keys(responsesToUse).indexOf(questionId) < 20) {
                    console.log('Skipped response:', {
                      questionId,
                      cleanQuestionId,
                      category,
                      isValidCategory,
                      answer,
                      responseData: typeof responseData === 'object' ? responseData : {value: responseData}
                    });
                  }
                }
              });
              
              // Debug: Log category distribution with actual values
              const processedCount = Object.values(categoryData).reduce((sum, cat) => sum + cat.total, 0);
              console.log('Category distribution after processing:');
              console.log('- invisible_parenting:', JSON.stringify(categoryData.invisible_parenting));
              console.log('- visible_parenting:', JSON.stringify(categoryData.visible_parenting));
              console.log('- invisible_household:', JSON.stringify(categoryData.invisible_household));
              console.log('- visible_household:', JSON.stringify(categoryData.visible_household));
              console.log('- totalResponses:', Object.keys(responsesToUse).length);
              console.log('- processedResponses:', processedCount);
              
              // Log sample responses to debug
              const sampleResponses = Object.entries(responsesToUse).slice(0, 5);
              console.log('Sample responses:');
              sampleResponses.forEach(([k, v]) => {
                console.log(`  ${k}:`, {
                  answer: v.answer || v,
                  category: v.category,
                  memberName: v.memberName,
                  rawValue: v
                });
              });
              
              // If no responses were processed, log why
              if (processedCount === 0) {
                console.error('WARNING: No responses were processed! Check category assignments.');
                // Force process at least some data for debugging
                Object.entries(responsesToUse).slice(0, 10).forEach(([key, value]) => {
                  console.error('Failed to process:', key, value);
                });
              }
              
              // Calculate percentages
              const result = {
                mama: {},
                papa: {},
                subcategoryAnalysis: {}
              };
              
              Object.entries(categoryData).forEach(([category, counts]) => {
                if (counts.total > 0) {
                  // Calculate who does what percentage
                  // For "Both" responses, split 50/50
                  const mamaTotal = counts.mama + (counts.both * 0.5);
                  const papaTotal = counts.papa + (counts.both * 0.5);
                  const total = mamaTotal + papaTotal;
                  
                  if (total > 0) {
                    result.mama[category] = Math.round((mamaTotal / total) * 100);
                    result.papa[category] = Math.round((papaTotal / total) * 100);
                  } else {
                    result.mama[category] = 50;
                    result.papa[category] = 50;
                  }
                } else {
                  // No data for this category, default to 50/50
                  result.mama[category] = 50;
                  result.papa[category] = 50;
                }
              });
              
              // Add subcategory analysis for when categories are clicked
              try {
                const subcategoryAnalysis = SubCategoryAnalyzer.analyzeSubCategories(responsesToUse);
                result.subcategoryAnalysis = subcategoryAnalysis;
              } catch (error) {
                console.error('Error analyzing subcategories:', error);
              }
              
              // Add the raw responses for filtering by member role
              result.rawResponses = responsesToUse;
              result.hasEnrichedData = !!allFamilySurveyResponses;
              result.fullQuestions = questionsToUse; // Pass the actual questions

              console.log('Final radar chart data:', {
                mama: result.mama,
                papa: result.papa,
                hasData: Object.keys(result.mama).length > 0,
                mamaValues: JSON.stringify(result.mama),
                papaValues: JSON.stringify(result.papa),
                questionsIncluded: questionsToUse.length
              });

              return result;
            }
            
            // Only fallback to demo data if we're sure there's no data loading
            if (!surveyDataLoading && Object.keys(allFamilySurveyResponses || {}).length === 0) {
              console.log('No survey responses found and not loading, using demo data for radar chart');
              return {
                mama: {
                  invisible_parenting: 70,    // Show realistic workload imbalances
                  visible_parenting: 35,
                  invisible_household: 80,
                  visible_household: 25
                },
                papa: {
                  invisible_parenting: 30,    // Complementary values showing typical family patterns
                  visible_parenting: 65,
                  invisible_household: 20,
                  visible_household: 75
                },
                fullQuestions: questionsToUse // Include questions even for demo data
              };
            }

            // If still loading, return varied demo data to show chart shape
            console.log('Survey data is still loading...');
            return {
              mama: {
                invisible_parenting: 70,    // Show realistic workload imbalances while loading
                visible_parenting: 35,
                invisible_household: 80,
                visible_household: 25
              },
              papa: {
                invisible_parenting: 30,    // Complementary values showing typical family patterns
                visible_parenting: 65,
                invisible_household: 20,
                visible_household: 75
              },
              fullQuestions: questionsToUse, // Include questions
              loading: true
            };
          })()}
          onSelectHabit={(habit) => {
            console.log("Selected habit from radar chart:", habit);

            // Generate AI-suggested Four Laws based on habit context
            const categoryMap = {
              'Invisible Parenting Tasks': 'parenting',
              'Visible Parenting Tasks': 'parenting',
              'Invisible Household Tasks': 'household',
              'Visible Household Tasks': 'household'
            };

            const category = categoryMap[habit.category] || 'personal';

            // Generate context-aware suggestions for Four Laws
            const obviousSuggestions = [
              "Set a daily reminder 15 minutes before ideal time",
              `Place visual cue in ${category === 'household' ? 'common area' : 'family calendar'}`,
              habit.context?.targetParent ? `Share calendar with ${habit.context.targetParent}` : "Add to shared family calendar"
            ].filter(Boolean);

            const attractiveSuggestions = [
              "Pair with existing enjoyable routine (habit stacking)",
              habit.context?.targetParent ? `Alternate with ${habit.context.targetParent} weekly` : "Make it a team effort",
              habit.context?.hasKids ? "Involve kids to make it more fun" : "Reward yourself after completion"
            ].filter(Boolean);

            const easySuggestions = [
              `Start with just ${Math.min(2, parseInt(habit.duration) || 2)} minutes`,
              "Prepare everything needed the night before",
              "Break into smaller steps if feeling overwhelmed",
              category === 'household' ? "Keep supplies in easy-to-reach location" : "Simplify the first step as much as possible"
            ];

            const satisfyingSuggestions = [
              "Track completion on family calendar",
              "Celebrate weekly streaks with family",
              habit.context?.imbalanceLevel > 30 ? "Notice improved balance in relationship" : "Feel proud of contributing to family harmony",
              "Share wins in weekly family meeting"
            ].filter(Boolean);

            // Create AI-suggested habit template
            const aiSuggestedHabit = {
              title: habit.title,
              description: habit.description || `Help with ${habit.title.toLowerCase()}`,
              category: category,
              identityStatement: `I am someone who ${habit.title.toLowerCase()} regularly`,
              twoMinuteVersion: `Spend 2 minutes on ${habit.title.toLowerCase()}`,
              fullVersion: habit.description || habit.title,
              fourLaws: {
                obvious: obviousSuggestions.slice(0, 3),
                attractive: attractiveSuggestions.slice(0, 3),
                easy: easySuggestions.slice(0, 3),
                satisfying: satisfyingSuggestions.slice(0, 3)
              },
              schedule: {
                frequency: habit.frequency || 'daily',
                daysOfWeek: [1, 2, 3, 4, 5], // Weekdays by default
                timeOfDay: category === 'parenting' ? 'morning' : 'evening',
                duration: parseInt(habit.duration) || 10,
                reminder: true,
                reminderMinutesBefore: 15
              },
              kidsCanHelp: habit.context?.hasKids || false,
              context: habit.context // Preserve original context
            };

            // Open HabitDrawer with AI suggestions
            setNewHabitTemplate(aiSuggestedHabit);
            setShowNewHabitDrawer(true);
          }}
          selectedPerson="both"
          familyMembers={familyMembers}
        />
      </div>
      )}

      {/* Current habits section */}
<div className="p-4" id="current-habits-section">
  <div className="flex justify-between items-center mb-4">
    <h3 className="font-medium text-lg">Family Habits Journey</h3>
    <div className="flex space-x-2">
    </div>
  </div>
  
  {/* Family Habits View */}
  <div id="family-habits-section">
    <FamilyHabitsView />
  </div>
</div>

{/* Old habits section removed - using new FamilyHabitsView */}

{/* Removed old habit UI code - now using FamilyHabitsView component above */}

      {/* Allie chat integration */}
      <div className="mt-4 p-4 border-t">
        <div className="flex items-start">
          <MessageSquare size={20} className="text-black mt-1 mr-3" />
          <div>
            <h3 className="font-medium">Allie Coaching</h3>
            <p className="text-sm text-gray-600 mt-1">
              Get personalized advice from Allie on how to build lasting habits
            </p>
            <button
              onClick={() => triggerAllieChat("I want to build better habits to improve family balance. Can you give me some tips based on Atomic Habits principles?")}
              className="mt-3 px-4 py-2 bg-black text-white rounded flex items-center hover:bg-gray-800"
            >
              Chat with Allie
            </button>
          </div>
        </div>
      </div>
    </div>
      
      {/* Celebration messages */}
      <div className="fixed bottom-4 right-4 space-y-2 z-30">
        {celebrations.map(celebration => (
          <div 
            key={celebration.id} 
            className={`p-3 rounded-lg shadow-lg animation-bounce-in max-w-xs ${
              celebration.success ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'
            }`}
          >
            <div className="flex items-center">
              {celebration.success ? (
                <Check className="text-white mr-2" size={18} />
              ) : (
                <Info className="text-white mr-2" size={18} />
              )}
              <div>
                <div className="font-medium">{celebration.title}</div>
                <div className="text-sm">{celebration.message}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      

{/* The Child Helper Assignment Modal is now handled by the HabitHelperSection component */}

{/* Calendar modal removed - now navigates to calendar tab instead */}
      
      <style>{`
        @keyframes bounceIn {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1); }
        }
  
        
        /* New animations for habit card */
        .streak-badge {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(251, 191, 36, 0); }
          100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); }
        }
        
        .completion-button {
          transition: all 0.2s ease;
        }
  
        .completion-button:hover {
          transform: scale(1.05);
        }
  
        .identity-badge {
          position: relative;
          overflow: hidden;
        }
        
        .identity-badge:after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg, 
            rgba(255, 255, 255, 0) 0%, 
            rgba(255, 255, 255, 0.2) 50%, 
            rgba(255, 255, 255, 0) 100%
          );
          animation: shine 3s infinite;
        }
        
              
              @keyframes shine {
          to {
            left: 100%;
          }
        }
        
        .pulse-animation {
          animation: pulseBg 2s infinite;
        }
        
              @keyframes pulseBg {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
        }
`}</style>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">{confirmModal.title}</h3>
            <p className="text-gray-600 mb-6">{confirmModal.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={confirmModal.onCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HabitDrawer for creating new habits from suggestions */}
      <HabitDrawer
        isOpen={showNewHabitDrawer}
        onClose={() => {
          setShowNewHabitDrawer(false);
          setNewHabitTemplate(null);
        }}
        habit={newHabitTemplate}
        onUpdate={(newHabit) => {
          // Refresh habits list if needed
          if (newHabit) {
            // Habit was created successfully
            setHabits(prev => [...prev, newHabit]);
          }
          setShowNewHabitDrawer(false);
          setNewHabitTemplate(null);
        }}
        isNewHabit={true}
      />

      {/* EventDrawer for Family Meeting date changes */}
      <EventDrawer
        isOpen={isEventDrawerOpen}
        onClose={() => {
          setIsEventDrawerOpen(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onUpdate={(updatedEvent) => {
          setSelectedEvent(updatedEvent);
          // Optionally refresh events or cycle data here
        }}
      />
    </div>
  );
};

export default TasksTab;