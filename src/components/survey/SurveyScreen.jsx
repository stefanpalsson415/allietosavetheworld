// src/components/survey/SurveyScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LogOut, Info, HelpCircle, Scale, Brain, Heart, Clock, ArrowLeft, 
  ArrowRight, Check, X, Edit, ChevronDown, ChevronUp, Eye, BarChart3,
  Users, Zap, ClipboardCheck
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useSurvey } from '../../contexts/SurveyContext';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import QuestionFeedbackPanel from './QuestionFeedbackPanel';
import ProjectedBalanceRadar from './ProjectedBalanceRadar';
import FamilyKnowledgeGraph from '../../services/FamilyKnowledgeGraph';
import UserAvatar from '../common/UserAvatar';
import { db } from '../../services/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import KidQuestionSimplifier from '../../services/KidQuestionSimplifier';
import { useSurveyPersistence } from '../../hooks/useSurveyPersistence';


const SurveyScreen = ({ mode = 'initial' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openDrawer, openDrawerWithPrompt } = useChatDrawer();
  const { 
    selectedUser,
    familyMembers,
    completeInitialSurvey,
    completeWeeklyCheckIn,
    saveSurveyProgress,
    familyPriorities,
    familyName,
    familyId,
    currentWeek,
    selectFamilyMember,
    taskRecommendations,
  surveyResponses,
  getWeekHistoryData,
  loadFreshFamilyData
  } = useFamily();
  
  const { 
    fullQuestionSet,
    currentSurveyResponses,
    updateSurveyResponse,
    resetSurvey,
    getSurveyProgress,
    updateQuestionWeight,
    selectPersonalizedInitialQuestions,
    getPersonalizedInitialQuestions,
    getFilteredQuestionsForAdult,
    setFamilyData,
    generateWeeklyQuestions,
    generateDynamicQuestions, // NEW: AI-powered questions
    setCurrentSurveyResponses,
    setCurrentPersonalizedQuestions // Track personalized questions
  } = useSurvey();

  // State to manage personalized questions
  const [personalizedQuestions, setPersonalizedQuestions] = useState([]);
  const [isPersonalizationLoaded, setIsPersonalizationLoaded] = useState(false);
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);
  const [siblingInsights, setSiblingInsights] = useState({});
  const [showSiblingContext, setShowSiblingContext] = useState(false);

  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedParent, setSelectedParent] = useState(null);
  const [viewingQuestionList, setViewingQuestionList] = useState(false);
  const [showWeightMetrics, setShowWeightMetrics] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [editingWeight, setEditingWeight] = useState(false);

  // In-app notification state
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');

  // Resume loading state
  const [isResuming, setIsResuming] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(''); // 'info', 'success', 'warning', 'error'
  const [saveErrors, setSaveErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [hasWeightChanges, setHasWeightChanges] = useState(false);
  const [weightBeingEdited, setWeightBeingEdited] = useState(null);
  const [showProjectedBalance, setShowProjectedBalance] = useState(false);
  const [showBalanceWidget, setShowBalanceWidget] = useState(true);

  const keyboardInitialized = useRef(false);
  const autoSaveIntervalRef = useRef(null);
  const hasLoadedProgress = useRef(false);
  const prevUserId = useRef(null);
  
  // CRITICAL: Track user-specific responses locally to prevent cross-user contamination
  const [localUserResponses, setLocalUserResponses] = useState({});
  
  // Use survey persistence hook
  const { responseCount: persistedResponseCount, hasLoadedFromDb } = useSurveyPersistence(selectedUser, mode);
  
  const [localCurrentQuestion, setLocalCurrentQuestion] = useState(null);

  // Get the current question, either from local state or the personalized questions array
  const currentQuestion = localCurrentQuestion || 
    (personalizedQuestions.length > 0 ? 
      personalizedQuestions[currentQuestionIndex] : 
      fullQuestionSet[currentQuestionIndex]);
  
  // Update selectedParent when question changes
  useEffect(() => {
    if (currentQuestion && localUserResponses[currentQuestion.id]) {
      setSelectedParent(localUserResponses[currentQuestion.id]);
    } else {
      setSelectedParent(null);
    }
  }, [currentQuestion?.id, localUserResponses]);

  // Function to update current question (for weight editing)
  const setCurrentQuestion = (updatedQuestion) => {
    setLocalCurrentQuestion(updatedQuestion);
    setHasWeightChanges(true);
  };

  // Removed walkthrough - tutorials are now in personal settings

  // Ensure we have the correct selected user on mount
  useEffect(() => {
    if (familyMembers.length > 0) {
      const storedUserId = localStorage.getItem('selectedUserId');
      if (storedUserId && (!selectedUser || selectedUser.id !== storedUserId)) {
        const userToSelect = familyMembers.find(m => m.id === storedUserId);
        if (userToSelect) {
          console.log("Restoring correct user for survey:", userToSelect.name);
          selectFamilyMember(userToSelect);
        }
      }
    }
  }, [familyMembers]);

  // DISABLED: This was causing cross-user contamination by loading mixed survey data
  // The useSurveyPersistence hook and localStorage loading handle user-specific data properly


  // Redirect if no user is selected
  useEffect(() => {
    if (!selectedUser) {
      navigate('/');
    }
  }, [selectedUser, navigate]);
  
  // Check survey access rules
  useEffect(() => {
    if (!selectedUser) return;
    
    // For weekly mode, ensure initial survey is complete first
    if (mode === 'weekly') {
      // Check if initial survey is complete
      if (!selectedUser.surveys?.initial?.completed) {
        console.log("Initial survey not complete, redirecting to initial survey");
        navigate('/survey');
        return;
      }
      
      // Check if this week's survey is already completed
      if (selectedUser.weeklyCompleted && 
          selectedUser.weeklyCompleted[currentWeek-1]?.completed) {
        alert("You've already completed this week's check-in!");
        navigate('/dashboard');
      }
    }
  }, [selectedUser, currentWeek, navigate, mode]);

  // UNIFIED SURVEY INITIALIZATION - Single source of truth that eliminates race conditions
  useEffect(() => {
    const initializeSurvey = async () => {
      // Early exit conditions
      if (isPersonalizationLoaded || !familyId || !selectedUser) {
        return;
      }

      console.log(`🔄 Starting unified survey initialization for ${selectedUser.name} (${mode} mode)`);

      // STEP 1: Check for saved progress first (highest priority)
      // Use the same key format as getStorageKey() for consistency
      // NOTE: Using currentWeek from context, not a local calculation
      const progressKey = mode === 'initial'
        ? `surveyInProgress_${selectedUser.id}`
        : `weeklyCheckIn_${currentWeek}_${selectedUser.id}`;
      const questionCacheKey = `survey_questions_${familyId}_${selectedUser.id}`;

      console.log(`🔍 Looking for saved progress with key: "${progressKey}" (currentWeek from context: ${currentWeek})`);

      try {
        const savedProgress = localStorage.getItem(progressKey);
        const cachedQuestions = localStorage.getItem(questionCacheKey);

        if (savedProgress) {
          const progressData = JSON.parse(savedProgress);
          const isRecent = Date.now() - progressData.timestamp < 24 * 60 * 60 * 1000;

          // If we have recent saved progress, prioritize loading that
          if (isRecent && progressData.responses && Object.keys(progressData.responses).length > 0) {
            console.log(`✅ Found saved progress with ${Object.keys(progressData.responses).length} responses`);
            setIsResuming(true);
            setLoadingMessage('Loading your saved progress...');

            // STEP 2: Try to load cached questions for the saved progress
            let questionsToUse = null;
            if (cachedQuestions) {
              try {
                const cachedData = JSON.parse(cachedQuestions);
                if (cachedData.questions && cachedData.questions.length > 0) {
                  console.log(`✅ Using ${cachedData.questions.length} cached questions`);
                  questionsToUse = cachedData.questions;
                }
              } catch (e) {
                console.warn('⚠️ Cached questions corrupted, using defaults');
              }
            }

            // STEP 3: If no cached questions, use default questions for resume
            if (!questionsToUse) {
              console.log('📋 Using default questions for resume (no cached questions)');
              questionsToUse = selectPersonalizedInitialQuestions(fullQuestionSet, null, 72); // Full question count for proper resume
            }

            // STEP 4: Load saved progress with questions
            setPersonalizedQuestions(questionsToUse);
            setCurrentPersonalizedQuestions(questionsToUse); // Share with context

            // STEP 5: Restore user state from saved progress
            const responseCount = Object.keys(progressData.responses).length;

            // Validate saved progress isn't corrupted
            if (responseCount > 150) {
              console.warn('⚠️ Too many responses, clearing corrupt data');
              localStorage.removeItem(progressKey);
              setPersonalizedQuestions(questionsToUse);
              setIsPersonalizationLoaded(true);
              setIsResuming(false);
              setLoadingMessage('');
              return;
            }

            // Find the last answered question to set proper index
            let lastAnsweredIndex = -1;
            questionsToUse.forEach((question, index) => {
              if (progressData.responses[question.id]) {
                lastAnsweredIndex = Math.max(lastAnsweredIndex, index);
              }
            });

            // Load the responses and set current position
            setLocalUserResponses(progressData.responses);
            setCurrentSurveyResponses(progressData.responses);

            if (lastAnsweredIndex >= 0) {
              const nextIndex = Math.min(lastAnsweredIndex + 1, questionsToUse.length - 1);
              console.log(`📍 Resuming from question ${nextIndex + 1} of ${questionsToUse.length}`);
              setCurrentQuestionIndex(nextIndex);
            } else {
              console.log('📍 Starting from beginning (no answered questions found)');
              setCurrentQuestionIndex(0);
            }

            setLastSaved(new Date(progressData.timestamp));
            setIsPersonalizationLoaded(true);
            setIsResuming(false);
            setLoadingMessage('');
            return; // SUCCESS: Resume with saved progress fully loaded
          }
        }
      } catch (e) {
        console.warn('⚠️ Error checking saved progress:', e);
      }

      // STEP 4: No saved progress - check for fresh cached questions
      try {
        const cachedQuestions = localStorage.getItem(questionCacheKey);
        if (cachedQuestions) {
          const cachedData = JSON.parse(cachedQuestions);
          const isRecent = Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000;

          if (isRecent && cachedData.questions && cachedData.questions.length >= 72) {
            console.log(`✅ Using fresh cached questions (${cachedData.questions.length})`);
            setPersonalizedQuestions(cachedData.questions);
            setCurrentPersonalizedQuestions(cachedData.questions); // Share with context
            setIsPersonalizationLoaded(true);
            return; // SUCCESS: Fresh start with cached questions
          } else if (cachedData.questions && cachedData.questions.length < 72) {
            console.log(`⚠️ Cached questions (${cachedData.questions.length}) less than required (72), regenerating...`);
          }
        }
      } catch (e) {
        console.warn('⚠️ Cached questions corrupted');
      }

      // STEP 5: Last resort - generate new questions via API
      console.log('🤖 Generating new personalized questions...');
      setLoadingMessage('Creating personalized questions for your family...');

      // Prepare family data for personalization
      const familyData = {
        familyName: familyName,
        familyId: familyId,
        parents: familyMembers.filter(m => m.role === 'parent').map(p => ({
          name: p.name,
          role: p.roleType || 'parent'
        })),
        children: familyMembers.filter(m => m.role === 'child').map(c => ({
          name: c.name,
          age: c.age || 10
        })),
        priorities: familyPriorities,
        communication: { style: "open" }
      };

      setFamilyData(familyData);

      // STEP 6: Generate new questions based on mode
      if (mode === 'initial') {
        try {
          console.log('🤖 Generating AI-powered personalized questions...');
          const dynamicQuestions = await generateDynamicQuestions(familyId, selectedUser.id, 72); // Full question count restored

          if (dynamicQuestions && dynamicQuestions.length > 0) {
            console.log(`✅ Generated ${dynamicQuestions.length} AI-powered questions`);
            let personalized = dynamicQuestions;

            // Process for children
            if (selectedUser?.role === 'child') {
              const childAge = parseInt(selectedUser.age) || 10;
              personalized = personalized.map(q => {
                try {
                  const simplifiedText = KidQuestionSimplifier.simplifyQuestionForChild(q, childAge, selectedUser.name);
                  return { ...q, originalText: q.text, text: simplifiedText };
                } catch (error) {
                  let text = q.text.startsWith('Who ') ? q.text.replace(/^Who /, 'Which parent ') : q.text;
                  return { ...q, originalText: q.text, text: text };
                }
              });
            }

            // Apply final filtering
            try {
              const filteredQuestions = await getFilteredQuestionsForAdult(familyId, personalized, selectedUser?.id);
              console.log(`✅ Finalized ${filteredQuestions.length} personalized questions`);
              setPersonalizedQuestions(filteredQuestions);
            } catch (error) {
              console.warn('⚠️ Filtering failed, using unfiltered questions');
              setPersonalizedQuestions(personalized);
            }
          } else {
            throw new Error('No dynamic questions generated');
          }
        } catch (error) {
          console.warn('⚠️ AI generation failed, using static fallback:', error);

          // Static fallback
          let personalized = selectPersonalizedInitialQuestions(fullQuestionSet, familyData);

          if (selectedUser?.role === 'child') {
            const childAge = parseInt(selectedUser.age) || 10;
            personalized = personalized.map(q => {
              try {
                const simplifiedText = KidQuestionSimplifier.simplifyQuestionForChild(q, childAge, selectedUser.name);
                return { ...q, originalText: q.text, text: simplifiedText };
              } catch (error) {
                let text = q.text.startsWith('Who ') ? q.text.replace(/^Who /, 'Which parent ') : q.text;
                return { ...q, originalText: q.text, text: text };
              }
            });
          }

          setPersonalizedQuestions(personalized);
        }
      } else if (mode === 'weekly') {
        try {
          console.log('📅 Generating weekly questions...');
          const previousResponses = surveyResponses || {};
          const taskCompletionData = taskRecommendations?.filter(task => task.completed) || [];
          let previousWeekData = null;

          if (currentWeek > 1) {
            previousWeekData = getWeekHistoryData(currentWeek - 1);
          }

          const weeklyQuestions = await generateWeeklyQuestions(
            currentWeek,
            selectedUser?.role === 'child',
            familyData,
            previousResponses,
            taskCompletionData,
            selectedUser?.id
          );

          console.log(`✅ Generated ${weeklyQuestions?.length || 0} weekly questions for week ${currentWeek}`);

          let finalQuestions = weeklyQuestions && weeklyQuestions.length > 0 ?
            weeklyQuestions : fullQuestionSet.slice(0, 20);

          // Simplify for children
          if (selectedUser?.role === 'child' && finalQuestions) {
            const childAge = parseInt(selectedUser.age) || 10;
            finalQuestions = finalQuestions.map(q => {
              try {
                const simplifiedText = KidQuestionSimplifier.simplifyQuestionForChild(q, childAge, selectedUser.name);
                return { ...q, originalText: q.text, text: simplifiedText };
              } catch (error) {
                let text = q.text.startsWith('Who ') ? q.text.replace(/^Who /, 'Which parent ') : q.text;
                return { ...q, originalText: q.text, text: text };
              }
            });
          }

          setPersonalizedQuestions(finalQuestions);
        } catch (error) {
          console.warn('⚠️ Weekly generation failed, using fallback:', error);
          setPersonalizedQuestions(fullQuestionSet.slice(0, 20));
        }
      }

      // STEP 7: Mark as loaded and clear loading state
      setIsPersonalizationLoaded(true);
      setLoadingMessage('');
      console.log('✅ Survey initialization complete!');
    };

    // Execute the unified initialization
    initializeSurvey();
  }, [
    familyId,
    selectedUser?.id,
    mode,
    isPersonalizationLoaded // Only re-run if not loaded yet
  ]);
  
  
  // Load sibling insights for personalized questions
  useEffect(() => {
    const loadSiblingInsights = async () => {
      if (!familyId || !selectedUser?.id) return;
      
      try {
        const knowledgeGraph = FamilyKnowledgeGraph;
        
        // Check if this is a parent answering about children
        const children = familyMembers.filter(m => m.role === 'child');
        if (children.length >= 2) {
          const insights = {};
          
          for (const child of children) {
            const dynamics = await knowledgeGraph.getSiblingDynamics(familyId, child.id);
            insights[child.id] = {
              siblings: dynamics.siblings,
              influences: dynamics.influences,
              teaching: dynamics.teaching,
              collaborations: dynamics.collaborations
            };
          }
          
          setSiblingInsights(insights);
          setShowSiblingContext(true);
        }
      } catch (error) {
        console.error('Error loading sibling insights:', error);
      }
    };
    
    loadSiblingInsights();
  }, [familyId, selectedUser?.id, familyMembers]);

  // Show projected balance after answering 10 questions
  useEffect(() => {
    const answeredCount = Object.keys(localUserResponses).length;
    // For inline display
    if (answeredCount >= 10 && !showProjectedBalance) {
      setShowProjectedBalance(true);
    }
    
    // For widget - we always show the widget, but it only displays projection after 10 questions
    if (answeredCount >= 1 && !showBalanceWidget) {
      setShowBalanceWidget(true);
    }
  }, [localUserResponses, showProjectedBalance, showBalanceWidget]);
  
  // Set up storage and progress key based on mode and user
  const getStorageKey = () => {
    if (!selectedUser) return null;
    return mode === 'initial' 
      ? `surveyInProgress_${selectedUser.id}` 
      : `weeklyCheckIn_${currentWeek}_${selectedUser.id}`;
  };
  
  // REMOVED: Duplicate saved progress loading useEffect that was causing race conditions
  // All progress loading is now handled in the unified initialization above

  // Auto-save function - moved here to avoid temporal dead zone in production build
  const handleAutoSave = useCallback(async () => {
    if (!selectedUser || isSaving) return;

    // Don't auto-save if user has already completed the survey
    if (selectedUser.surveys?.initial?.completed) {
      console.log(`Skipping auto-save: user ${selectedUser.id} has already completed survey`);
      return;
    }

    // Don't auto-save empty responses - use local responses
    const responseCount = Object.keys(localUserResponses).length;
    if (responseCount === 0) {
      return;
    }

    setIsSaving(true);

    try {
      const storageKey = getStorageKey();
      console.log(`Auto-saving ${mode} progress for user:`, selectedUser.id, `(${responseCount} responses)`);
      await saveSurveyProgress(selectedUser.id, localUserResponses);

      // Store survey in progress flag with responses
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify({
          userId: selectedUser.id,
          timestamp: new Date().getTime(),
          responses: localUserResponses,
          lastQuestionIndex: currentQuestionIndex
        }));
      }

      setLastSaved(new Date());
      console.log(`${mode} progress auto-saved for user:`, selectedUser.id);
    } catch (error) {
      console.error(`Error auto-saving ${mode} progress:`, error);
    } finally {
      setIsSaving(false);
    }
  }, [
    selectedUser,
    localUserResponses,
    saveSurveyProgress,
    isSaving,
    mode,
    currentQuestionIndex
  ]);

  // Setup auto-save functionality
  useEffect(() => {
    if (selectedUser && autoSaveEnabled) {
      // Clear any existing interval
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      
      // Set up auto-save every 30 seconds
      autoSaveIntervalRef.current = setInterval(() => {
        // Only auto-save if we have responses and aren't in the middle of processing
        if (
          selectedUser &&
          Object.keys(localUserResponses).length > 0 &&  // Changed to use localUserResponses
          !isProcessing &&
          !isSaving
        ) {
          handleAutoSave();
        }
      }, 30000); // 30 seconds
    }
    
    // Cleanup interval on unmount
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [selectedUser, autoSaveEnabled, localUserResponses, isProcessing, isSaving, handleAutoSave]);
  
  // Function to clear user survey data from Firebase
  const clearUserSurveyData = async (userId) => {
    try {
      const docId = `${familyId}-${userId}-initial`;
      const docRef = doc(db, 'surveyResponses', docId);
      await deleteDoc(docRef);
      console.log(`Cleared Firebase survey data for user: ${userId}`);
    } catch (error) {
      console.log(`No Firebase data to clear for user: ${userId}`, error);
    }
  };

  // Reset on user change
  useEffect(() => {
    if (selectedUser?.id) {
      // Check if this is a true user change or just initial load/resume
      const isUserChange = prevUserId.current !== null && prevUserId.current !== selectedUser.id;

      if (isUserChange) {
        console.log('User changed from', prevUserId.current, 'to:', selectedUser.name, selectedUser.id);

        // Reset everything for the new user
        hasLoadedProgress.current = false;
        setIsPersonalizationLoaded(false);
        setPersonalizedQuestions([]);
        setCurrentQuestionIndex(0);
        setSelectedParent(null);
        resetSurvey();
        // IMPORTANT: Also clear the context responses to prevent cross-user contamination
        setCurrentSurveyResponses({});
        // CRITICAL: Clear local user responses immediately
        setLocalUserResponses({});
        console.log('Cleared all responses for new user:', selectedUser.name);

        // Clear any auto-save interval
        if (autoSaveIntervalRef.current) {
          clearInterval(autoSaveIntervalRef.current);
        }
      } else if (prevUserId.current === null) {
        console.log('Initial user set to:', selectedUser.name, selectedUser.id);
      } else {
        console.log('Same user resuming survey:', selectedUser.name, selectedUser.id);
      }

      // Update the previous user id
      prevUserId.current = selectedUser.id;
    }
  }, [selectedUser?.id, resetSurvey, setCurrentSurveyResponses, familyId]);
  
  // Find all parents first
  const allParents = familyMembers.filter(m => m.role === 'parent');
  
  // Find parent users based on roleType or order
  // Parent 1 is typically Papa/Dad, Parent 2 is typically Mama/Mom
  let parent1 = familyMembers.find(m => 
    m.roleType === 'Papa' || 
    m.roleType === 'Dad' ||
    m.roleType === 'Parent 1'
  );
  
  let parent2 = familyMembers.find(m => 
    m.roleType === 'Mama' || 
    m.roleType === 'Mom' ||
    m.roleType === 'Parent 2'
  );
  
  // If we couldn't find by roleType, use the order in the array
  if (!parent1 && !parent2 && allParents.length >= 2) {
    parent1 = allParents[0];
    parent2 = allParents[1];
  } else if (!parent1 && parent2) {
    // If we only found parent2, find the other parent
    parent1 = allParents.find(p => p.id !== parent2.id);
  } else if (parent1 && !parent2) {
    // If we only found parent1, find the other parent
    parent2 = allParents.find(p => p.id !== parent1.id);
  }
  
  // Default to any available parents if still not found
  if (!parent1) parent1 = allParents[0];
  if (!parent2) parent2 = allParents[1] || allParents[0];
  
  // Assign to mama/papa based on convention (can be swapped by families)
  const mamaUser = parent2;
  const papaUser = parent1;
  
  // Force load fresh family data on mount to ensure profile pictures are loaded
  useEffect(() => {
    if (loadFreshFamilyData && familyId) {
      console.log('Survey screen mounting - forcing fresh family data load to get profile pictures...');
      loadFreshFamilyData(true); // Pass true to force reload even if data exists
    }
  }, [familyId]); // Run when familyId is available

  
  // Get children from family members for sibling context
  const children = familyMembers.filter(m => m.role === 'child');
  
  // Debug logging to see what fields are available
  useEffect(() => {
    if (papaUser && mamaUser) {
      console.log('=== Parent Avatar Debug ===');
      console.log('Papa user:', papaUser.name);
      console.log('  - profilePicture:', papaUser.profilePicture);
      console.log('  - profilePictureUrl:', papaUser.profilePictureUrl);
      console.log('Mama user:', mamaUser.name);
      console.log('  - profilePicture:', mamaUser.profilePicture);
      console.log('  - profilePictureUrl:', mamaUser.profilePictureUrl);
      console.log('Total family members:', familyMembers.length);
      console.log('=========================');
    }
  }, [papaUser, mamaUser, familyMembers]);
  
  // Set up keyboard shortcuts with debouncing
  useEffect(() => {
    // Function to handle key press
    const handleKeyPress = (e) => {
      if (viewingQuestionList || isProcessing) return;
      
      // 'M' key selects Mama
      if (e.key.toLowerCase() === 'm') {
        handleSelectParent('Mama');
      }
      // 'P' key selects Papa
      else if (e.key.toLowerCase() === 'p') {
        handleSelectParent('Papa');
      }
      // 'S' key selects Share/Draw
      else if (e.key.toLowerCase() === 's' && !(e.ctrlKey || e.metaKey)) {
        handleSelectParent('Draw');
      }
      // Left arrow for previous question
      else if (e.key === 'ArrowLeft') {
        if (currentQuestionIndex > 0) {
          handlePrevious();
        }
      }
      // Right arrow for next question (skip)
      else if (e.key === 'ArrowRight') {
        handleSkip();
      }
      // 'S' key to manually save progress
      else if (e.key.toLowerCase() === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleManualSave();
      }
    };
    
    setLocalCurrentQuestion(null);

    // Set a small timeout to ensure component is fully rendered
    const timer = setTimeout(() => {
      // Clean up previous listeners if they exist
      if (keyboardInitialized.current) {
        window.removeEventListener('keydown', handleKeyPress);
      }
      
      // Add new listener
      window.addEventListener('keydown', handleKeyPress);
      keyboardInitialized.current = true;
    }, 200);
    
    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (keyboardInitialized.current) {
        window.removeEventListener('keydown', handleKeyPress);
      }
    };
  }, [currentQuestionIndex, viewingQuestionList, isProcessing]);
  
  // Parent profile images with fallbacks
  const parents = {
    mama: {
      name: mamaUser?.name || 'Mama',
      image: mamaUser?.profilePicture || mamaUser?.profilePictureUrl || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48Y2lyY2xlIGN4PSIxMjgiIGN5PSIxMjgiIHI9IjEyOCIgZmlsbD0iI2U5YjFkYSIvPjxjaXJjbGUgY3g9IjEyOCIgY3k9IjkwIiByPSI0MCIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0yMTUsMTcyLjVjMCwzNS05NSwzNS05NSwzNXMtOTUsMC05NS0zNWMwLTIzLjMsOTUtMTAsOTUtMTBTMjE1LDE0OS4yLDIxNSwxNzyuNVoiIGZpbGw9IiNmZmYiLz48L3N2Zz4='
    },
    papa: {
      name: papaUser?.name || 'Papa',
      image: papaUser?.profilePicture || papaUser?.profilePictureUrl || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij48Y2lyY2xlIGN4PSIxMjgiIGN5PSIxMjgiIHI9IjEyOCIgZmlsbD0iIzg0YzRlMiIvPjxjaXJjbGUgY3g9IjEyOCIgY3k9IjkwIiByPSI0MCIgZmlsbD0iI2ZmZiIvPjxwYXRoIGQ9Ik0yMTUsMTcyLjVjMCwzNS05NSwzNS05NSwzNXMtOTUsMC05NS0zNWMwLTIzLjMsOTUtMTAsOTUtMTBTMjE1LDE0OS4yLDIxNSwxNzIuNVoiIGZpbGw9IiNmZmYiLz48L3N2Zz4='
    }
  };
  // Auto-save function has been moved earlier in the file to avoid temporal dead zone
  
  // Manual save function
  const handleManualSave = async () => {
    if (!selectedUser || isSaving) return;
    
    setIsSaving(true);
    
    try {
      const storageKey = getStorageKey();
      console.log(`Manually saving ${mode} progress for user:`, selectedUser.id);
      await saveSurveyProgress(selectedUser.id, localUserResponses);
      
      // Store survey in progress flag with responses
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify({
          userId: selectedUser.id,
          timestamp: new Date().getTime(),
          responses: localUserResponses,
          lastQuestionIndex: currentQuestionIndex
        }));
      }
      
      setLastSaved(new Date());
      console.log(`${mode} progress saved manually for user:`, selectedUser.id);
    } catch (error) {
      console.error(`Error saving ${mode} progress:`, error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle parent selection
  const handleSelectParent = (parent) => {
    if (isProcessing) return; // Prevent multiple selections while processing
    setIsProcessing(true);
    
    setSelectedParent(parent);
    
    // Save response with full question data for dynamic questions
    if (currentQuestion) {
      // CRITICAL FIX: Update local user responses to prevent cross-user contamination
      const updatedResponses = {
        ...localUserResponses,
        [currentQuestion.id]: parent
      };
      setLocalUserResponses(updatedResponses);
      console.log(`Updated local responses for ${selectedUser.name}: ${Object.keys(updatedResponses).length} total responses`);
      
      // Also update survey context
      updateSurveyResponse(currentQuestion.id, parent, currentQuestion);
      
      // Wait a bit to show selection, then proceed
      setTimeout(() => {
        // Get the right questions array
        const questionsArray = personalizedQuestions.length > 0 ? 
  personalizedQuestions : (mode === 'initial' ? fullQuestionSet : generateWeeklyQuestions(currentWeek));
          
        if (currentQuestionIndex < questionsArray.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSelectedParent(null);
          setShowWeightMetrics(false);
        } else {
          // Survey completed - pass the updated responses directly to avoid async state issues
          console.log(`Survey completed! Passing ${Object.keys(updatedResponses).length} responses to completion`);
          handleCompleteSurveyWithResponses(updatedResponses);
        }
        setIsProcessing(false); // Reset processing state
      }, 800);
    }
  };
  
  // Complete the survey with specific responses (to avoid async state issues)
  const handleCompleteSurveyWithResponses = async (finalResponses) => {
    if (isProcessing || isSubmitting) return; // Prevent multiple submissions
    
    // Set flags to show we're submitting
    setIsProcessing(true);
    setIsSubmitting(true);
    
    try {
      console.log(`Starting ${mode} completion process for user:`, selectedUser.id);
      console.log(`Final response count from parameter: ${Object.keys(finalResponses).length}`);
      
      // Save the final responses directly
      await saveSurveyProgress(selectedUser.id, finalResponses);
      console.log(`${mode} progress saved with ${Object.keys(finalResponses).length} responses`);
      
      // Then show loading screen to provide visual feedback
      navigate('/loading');
      
      // Wait a moment before completing to ensure UI update happens
      setTimeout(async () => {
        try {
          console.log(`Completing ${mode} survey for user:`, selectedUser.id);
          console.log(`Responses being passed to completion: ${Object.keys(finalResponses).length}`);
          
          let result;
          
          // Call the appropriate completion method based on mode
          if (mode === 'initial') {
            // Pass skipSave=true since we already saved the responses above
            result = await completeInitialSurvey(selectedUser.id, finalResponses, true);
          } else if (mode === 'weekly') {
            result = await completeWeeklyCheckIn(selectedUser.id, currentWeek, finalResponses);
          }
          
          if (!result) {
            throw new Error(`${mode} completion failed`);
          }
          
          // Success! Remove the in-progress flag
          const storageKey = getStorageKey();
          if (storageKey) {
            localStorage.removeItem(storageKey);
          }
          
          console.log(`${mode} completed successfully for user:`, selectedUser.id);
          
          // Final navigation depends on mode and completion status
          if (mode === 'initial') {
            // Check if all family members have completed the initial survey
            const allCompleted = familyMembers.every(member => 
              member.completed || member.id === selectedUser.id
            );
            
            console.log(`All members completed initial survey? ${allCompleted}`);
            
            // Navigate based on completion status
            setTimeout(() => {
              if (allCompleted) {
                console.log("All members completed - going to dashboard");
                navigate('/dashboard', { replace: true });
              } else {
                console.log("Some members still need to complete - going to wait screen");
                navigate('/login', { 
                  state: { 
                    directAccess: true,
                    showCompletionScreen: true
                  }, 
                  replace: true 
                });
              }
            }, 1500);
          } else {
            // For weekly check-ins, always go to dashboard
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
          }
        } catch (submitError) {
          console.error(`Error in delayed ${mode} completion:`, submitError);
          // Navigate back with error message
          navigate(`/${mode === 'initial' ? 'survey' : 'weekly-checkin'}`, { 
            state: { error: `Failed to complete ${mode} survey. Please try again.` }
          });
        } finally {
          setIsSubmitting(false);
          setIsProcessing(false);
        }
      }, 500);
    } catch (error) {
      console.error(`Error initiating ${mode} completion:`, error);
      alert(`There was an error saving your ${mode} survey. Please try again.`);
      setIsSubmitting(false);
      setIsProcessing(false);
      
      // Stay on current question
      navigate(mode === 'initial' ? '/survey' : '/weekly-checkin');
    }
  };

  // Complete the survey based on mode (legacy function for backward compatibility)
  const handleCompleteSurvey = async () => {
    if (isProcessing || isSubmitting) return; // Prevent multiple submissions
    
    // Set flags to show we're submitting
    setIsProcessing(true);
    setIsSubmitting(true);
    
    try {
      console.log(`Starting ${mode} completion process for user:`, selectedUser.id);
      console.log(`Final response count: ${Object.keys(localUserResponses).length}`);
      
      // First, save the current survey state before navigating
      await handleManualSave();
      
      // Then show loading screen to provide visual feedback
      navigate('/loading');
      
      // Wait a moment before completing to ensure UI update happens
      setTimeout(async () => {
        try {
          console.log(`Completing ${mode} survey for user:`, selectedUser.id);
          console.log(`Responses being passed to completion: ${Object.keys(localUserResponses).length}`);
          
          let result;
          
          // Call the appropriate completion method based on mode
          if (mode === 'initial') {
            // Pass skipSave=true since we already saved the responses in handleManualSave
            result = await completeInitialSurvey(selectedUser.id, localUserResponses, true);
          } else if (mode === 'weekly') {
            result = await completeWeeklyCheckIn(selectedUser.id, currentWeek, localUserResponses);
          }
          
          if (!result) {
            throw new Error(`${mode} completion failed`);
          }
          
          // Success! Remove the in-progress flag
          const storageKey = getStorageKey();
          if (storageKey) {
            localStorage.removeItem(storageKey);
          }
          
          console.log(`${mode} completed successfully for user:`, selectedUser.id);
          
          // Final navigation depends on mode and completion status
          if (mode === 'initial') {
            // Check if all family members have completed the initial survey
            const allCompleted = familyMembers.every(member => 
              member.completed || member.id === selectedUser.id
            );
            
            console.log(`All members completed initial survey? ${allCompleted}`);
            
            // Navigate based on completion status
            setTimeout(() => {
              if (allCompleted) {
                console.log("All members completed - going to dashboard");
                navigate('/dashboard', { replace: true });
              } else {
                console.log("Some members still need to complete - going to wait screen");
                navigate('/login', { 
                  state: { 
                    directAccess: true,
                    showCompletionScreen: true
                  }, 
                  replace: true 
                });
              }
            }, 1500);
          } else {
            // For weekly check-ins, always go to dashboard
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
          }
        } catch (submitError) {
          console.error(`Error in delayed ${mode} completion:`, submitError);
          // Navigate back with error message
          navigate(`/${mode === 'initial' ? 'survey' : 'weekly-checkin'}`, { 
            state: { error: `Failed to complete ${mode} survey. Please try again.` }
          });
        } finally {
          setIsSubmitting(false);
          setIsProcessing(false);
        }
      }, 500);
    } catch (error) {
      console.error(`Error initiating ${mode} completion:`, error);
      alert(`There was an error saving your ${mode} survey. Please try again.`);
      setIsSubmitting(false);
      setIsProcessing(false);
      
      // Stay on current question
      navigate(mode === 'initial' ? '/survey' : '/weekly-checkin');
    }
  };
  
  // Move to previous question
  const handlePrevious = () => {
    // If we're editing weights, prompt to save or discard changes
    if (editingWeight && hasWeightChanges) {
      if (window.confirm("You have unsaved weight changes. Save changes before going back?")) {
        handleSaveWeightChanges();
      } else {
        handleCancelWeightEditing();
      }
    }
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prevIndex => prevIndex - 1);
      
      // Get the right questions array
      const questionsArray = personalizedQuestions.length > 0 ? 
        personalizedQuestions : (mode === 'initial' ? fullQuestionSet : []);
        
      setSelectedParent(localUserResponses[questionsArray[currentQuestionIndex - 1].id] || null);
      setShowWeightMetrics(false);
    }
  };
  

  // Toggle question list view
  const toggleQuestionList = () => {
    // If we're editing weights, prompt to save or discard changes
    if (editingWeight && hasWeightChanges) {
      if (window.confirm("You have unsaved weight changes. Save changes before viewing question list?")) {
        handleSaveWeightChanges();
      } else {
        handleCancelWeightEditing();
      }
    }
    
    setViewingQuestionList(!viewingQuestionList);
  };
  
  // Jump to specific question
  const jumpToQuestion = (index) => {
    // If we're editing weights, prompt to save or discard changes
    if (editingWeight && hasWeightChanges) {
      if (window.confirm("You have unsaved weight changes. Save changes before jumping to another question?")) {
        handleSaveWeightChanges();
      } else {
        handleCancelWeightEditing();
      }
    }
    
    setCurrentQuestionIndex(index);
    
    // Get the right questions array
    const questionsArray = personalizedQuestions.length > 0 ? 
      personalizedQuestions : (mode === 'initial' ? fullQuestionSet : []);
      
    setSelectedParent(localUserResponses[questionsArray[index].id] || null);
    setViewingQuestionList(false);
    setShowWeightMetrics(false);
  };
  
  // Handle pause/exit
  const handlePause = async () => {
    if (isProcessing) return; // Prevent multiple actions while processing
    
    // If we're editing weights, prompt to save or discard changes
    if (editingWeight && hasWeightChanges) {
      if (window.confirm("You have unsaved weight changes. Save changes before exiting?")) {
        handleSaveWeightChanges();
      } else {
        handleCancelWeightEditing();
      }
    }
    
    setIsProcessing(true);
    
    try {
      // Save the current progress without marking as completed
      // NOTE: Using localUserResponses, not currentSurveyResponses!
      if (selectedUser && Object.keys(localUserResponses).length > 0) {
        const storageKey = getStorageKey();
        console.log(`💾 Saving ${mode} progress before pausing for user:`, selectedUser.id);
        console.log(`💾 Storage key for saving: "${storageKey}" (currentWeek from context: ${currentWeek})`);
        console.log(`💾 Saving ${Object.keys(localUserResponses).length} responses`);
        await saveSurveyProgress(selectedUser.id, localUserResponses);
        console.log(`✅ Progress saved successfully for user:`, selectedUser.id);

        // Store progress in localStorage
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify({
            userId: selectedUser.id,
            timestamp: new Date().getTime(),
            responses: localUserResponses,
            lastQuestionIndex: currentQuestionIndex
          }));
        }
      }
      
      // Navigate to dashboard Balance & Habits tab
      navigate('/dashboard');
    } catch (error) {
      console.error(`Error saving ${mode} progress:`, error);
      // Use in-app notification instead of browser alert
      setShowNotification(true);
      setNotificationMessage('There was an error saving your progress, but you can continue later.');
      setNotificationType('warning');
      // Wait 3 seconds then navigate
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Skip question
  const handleSkip = () => {
    // If we're editing weights, prompt to save or discard changes
    if (editingWeight && hasWeightChanges) {
      if (window.confirm("You have unsaved weight changes. Save changes before continuing?")) {
        handleSaveWeightChanges();
      } else {
        handleCancelWeightEditing();
      }
    }
    
    // Get the right questions array
    const questionsArray = personalizedQuestions.length > 0 ? 
      personalizedQuestions : (mode === 'initial' ? fullQuestionSet : []);
      
    if (currentQuestionIndex < questionsArray.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedParent(null);
      setShowWeightMetrics(false);
    } else {
      // Survey completed - but verify we have enough responses
      const totalResponses = Object.keys(currentSurveyResponses).length;
      if (mode === 'initial' && totalResponses < 72) {
        // Don't complete if we don't have all 72 responses
        alert(`You've only answered ${totalResponses} out of 72 questions. Please continue to complete all questions.`);
        // Loop back to first unanswered question
        const firstUnanswered = questionsArray.findIndex((q, idx) => !currentSurveyResponses[q.id]);
        if (firstUnanswered >= 0) {
          setCurrentQuestionIndex(firstUnanswered);
        }
      } else {
        // Survey truly completed
        handleCompleteSurvey();
      }
    }
  };
  
  // Handle saving weight changes
  const handleSaveWeightChanges = () => {
    if (hasWeightChanges) {
      // Weight changes are already saved through the updateQuestionWeight function
      // Just need to update UI state
      setEditingWeight(false);
      setHasWeightChanges(false);
      
      // Show a save confirmation
      const saveNotification = document.createElement('div');
      saveNotification.className = 'fixed top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded shadow-md z-50 flex items-center font-roboto';
      saveNotification.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>Weight changes saved successfully';
      document.body.appendChild(saveNotification);
      
      // Remove after 3 seconds
      setTimeout(() => {
        if (document.body.contains(saveNotification)) {
          document.body.removeChild(saveNotification);
        }
      }, 3000);
    } else {
      setEditingWeight(false);
    }
  };

  // Cancel weight editing
  const handleCancelWeightEditing = () => {
    // Reset the current question to its original state
    setLocalCurrentQuestion(null);
    setEditingWeight(false);
    setHasWeightChanges(false);
  };
  
  // Handle logout/switch user
  const handleLogout = () => {
    navigate('/login');
  };
  
  // Calculate progress
  // For initial survey, we always have 72 questions (even while loading)
  const totalQuestionCount = mode === 'initial' ? 72 : personalizedQuestions.length;
  const questionsToUse = personalizedQuestions.length > 0 ?
    personalizedQuestions : [];

  // Calculate progress based on current question index
  const progress = totalQuestionCount > 0
    ? Math.min(((currentQuestionIndex + 1) / totalQuestionCount) * 100, 100)
    : 0;
  
  // Get weight impact color
  const getWeightImpactColor = (weight) => {
    const numWeight = parseFloat(weight);
    if (numWeight >= 12) return "text-red-600 bg-red-100";
    if (numWeight >= 9) return "text-orange-600 bg-orange-100";
    if (numWeight >= 6) return "text-amber-600 bg-amber-100";
    return "text-blue-600 bg-blue-100";
  };
  
  // Get weight impact text
  const getWeightImpactText = (weight) => {
    const numWeight = parseFloat(weight);
    if (numWeight >= 12) return "Very High";
    if (numWeight >= 9) return "High";
    if (numWeight >= 6) return "Medium";
    return "Standard";
  };
  
  // Get icon for weight factor
  const getWeightFactorIcon = (factor) => {
    switch(factor) {
      case 'frequency':
        return <Clock size={14} className="mr-1" />;
      case 'invisibility':
        return <Brain size={14} className="mr-1" />;
      case 'emotionalLabor':
        return <Heart size={14} className="mr-1" />;
      default:
        return <Scale size={14} className="mr-1" />;
    }
  };
  
  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get total family survey responses across all members
  const getTotalFamilyResponses = () => {
    // Count current user's responses
    const currentUserResponses = Object.keys(currentSurveyResponses).length;
    
    // Count all stored survey responses from the family context
    // The surveyResponses object from FamilyContext contains actual responses loaded from the database
    const storedResponses = Object.keys(surveyResponses || {}).length;
    
    // If we have responsesByMember data from the database, use that for accurate counts
    if (surveyResponses && surveyResponses.responsesByMember) {
      let totalResponses = 0;
      Object.values(surveyResponses.responsesByMember).forEach(memberResponses => {
        totalResponses += Object.keys(memberResponses).length;
      });
      return totalResponses;
    }
    
    // Otherwise, return the count of all responses (avoiding double counting)
    return Math.max(currentUserResponses, storedResponses);
  };
  
  // Get random color class based on name (deterministic)
  const getRandomColorClass = (name) => {
    const colors = [
      'bg-gradient-to-br from-emerald-400 to-teal-400',
      'bg-gradient-to-br from-orange-400 to-red-400', 
      'bg-gradient-to-br from-violet-400 to-purple-400',
      'bg-gradient-to-br from-amber-400 to-yellow-400',
      'bg-gradient-to-br from-cyan-400 to-blue-400',
      'bg-gradient-to-br from-rose-400 to-pink-400',
      'bg-gradient-to-br from-lime-400 to-green-400',
      'bg-gradient-to-br from-indigo-400 to-blue-400'
    ];
    
    // Use name to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // ✅ CRITICAL: Only block on missing selectedUser (essential data)
  // Don't block on currentQuestion - let component render with available data
  // This prevents infinite loading when question loading fails or times out
  if (!selectedUser) {
    return <div className="flex items-center justify-center h-screen font-roboto">Loading...</div>;
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-white font-roboto survey-container">
      {/* Loading overlay for resuming */}
      {(isResuming || (loadingMessage && personalizedQuestions.length === 0)) && (
        <div className="fixed inset-0 bg-white bg-opacity-95 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-800">
                {loadingMessage || 'Loading your saved progress...'}
              </p>
              {isResuming && currentSurveyResponses && Object.keys(currentSurveyResponses).length > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Found {Object.keys(currentSurveyResponses).length} saved responses
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* In-app notification */}
      {showNotification && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-lg transition-all duration-300 ${
          notificationType === 'success' ? 'bg-green-100 border border-green-400 text-green-700' :
          notificationType === 'warning' ? 'bg-yellow-100 border border-yellow-400 text-yellow-700' :
          notificationType === 'error' ? 'bg-red-100 border border-red-400 text-red-700' :
          'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium">{notificationMessage}</p>
            <button
              onClick={() => setShowNotification(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Floating vote counter */}
      <div className="fixed top-4 right-4 z-40 bg-white rounded-lg shadow-lg p-3 border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="bg-purple-100 rounded-full p-2">
            <ClipboardCheck size={20} className="text-purple-600" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-800">
              {Object.keys(localUserResponses).length} / {questionsToUse.length}
            </div>
            <div className="text-xs text-gray-500">
              votes recorded
            </div>
          </div>
        </div>
      </div>

      {/* Content area - scrollable */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {!currentQuestion && questionsToUse.length === 0 ? (
          // ✅ CRITICAL: Show loading state when questions haven't loaded yet
          // This prevents crashes when currentQuestion is undefined
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-800">Loading survey questions...</p>
              <p className="text-sm text-gray-500 mt-2">
                {personalizedQuestions.length === 0 && 'Personalizing questions for you'}
              </p>
            </div>
          </div>
        ) : viewingQuestionList ? (
          // Question list view
          <div className="p-4 overflow-y-auto h-full">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">
                    All Questions ({questionsToUse.length}) 
                    {personalizedQuestions.length > 0 && mode === 'initial' && " - Personalized"}
                    {mode === 'weekly' && ` - Week ${currentWeek}`}
                  </h2>
                  <button 
                    onClick={toggleQuestionList}
                    className="text-blue-600 text-sm"
                  >
                    Back to Survey
                  </button>
                </div>
                  
                <div className="space-y-1 max-h-[70vh] overflow-y-auto">
                  {questionsToUse.map((q, index) => {
                    const answered = localUserResponses[q.id] !== undefined;
                    return (
                      <div 
                        key={q.id} 
                        className={`p-3 rounded text-sm ${
                          index === currentQuestionIndex 
                            ? 'bg-blue-100 border-l-4 border-blue-500' 
                            : answered 
                              ? 'bg-green-50' 
                              : 'bg-gray-50'
                        } cursor-pointer`}
                        onClick={() => jumpToQuestion(index)}
                      >
                        <div className="flex items-center">
                          <span className="w-6 text-right mr-2">{index + 1}.</span>
                          <div className="flex-1">
                            <p>{(() => {
                              // Simplify for kids in the question list too
                              if (selectedUser?.role === 'child') {
                                const childAge = parseInt(selectedUser.age) || 10;
                                try {
                                  return KidQuestionSimplifier.simplifyQuestionForChild(q, childAge, selectedUser.name);
                                } catch (error) {
                                  let text = q.text;
                                  if (text.startsWith('Who ')) {
                                    text = text.replace(/^Who /, 'Which parent ');
                                  }
                                  return text;
                                }
                              }
                              return q.text;
                            })()}</p>
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <span className="mr-3">{q.category}</span>
                              {q.totalWeight && (
                                <span className={`ml-auto px-1.5 py-0.5 rounded-full text-xs flex items-center ${getWeightImpactColor(q.totalWeight)}`}>
                                  <Scale size={10} className="mr-1" />
                                  Impact: {getWeightImpactText(q.totalWeight)}
                                </span>
                              )}
                            </div>
                          </div>
                          {answered && (
                            <div className="flex-shrink-0 ml-2">
                              <span className={`px-2 py-1 text-xs rounded ${
                                localUserResponses[q.id] === 'Mama'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {localUserResponses[q.id]}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : !currentQuestion ? (
          // ✅ Show loading if we somehow got here without a current question
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-800">Loading current question...</p>
            </div>
          </div>
        ) : (
          // Main survey view
          <div className="flex-1 flex flex-col p-4">
            <div className="max-w-3xl mx-auto w-full">
              {/* Large question at the top */}
              <div className="mb-4 mt-8">
                <h1 className="text-4xl font-bold text-gray-900 text-left mb-1">
                  {(() => {
                    // Check if user is a child and simplify the question
                    if (selectedUser?.role === 'child') {
                      const childAge = parseInt(selectedUser.age) || 10;
                      try {
                        return KidQuestionSimplifier.simplifyQuestionForChild(currentQuestion, childAge, selectedUser.name);
                      } catch (error) {
                        // Fallback: at least replace "Who" with "Which parent"
                        let text = currentQuestion.text;
                        if (text.startsWith('Who ')) {
                          text = text.replace(/^Who /, 'Which parent ');
                        }
                        return text;
                      }
                    }
                    return currentQuestion.text;
                  })()}
                </h1>
                <p className="text-sm text-gray-500 text-left">
                  {currentQuestion.category}
                </p>

              </div>

              {/* Combined Category & Task Info Panel */}
              <div className="mb-3">
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                  {/* Category Explanation */}
                  <p className="text-sm text-gray-700 mb-3">
                    {(() => {
                      switch (currentQuestion.category) {
                        case "Visible Household Tasks":
                          return "These questions focus on observable household responsibilities like cooking, cleaning, and maintenance. Understanding who handles these tasks helps reveal patterns in day-to-day household management.";
                        case "Invisible Household Tasks":
                          return "These questions target the mental load and planning work that often goes unnoticed - like remembering appointments, planning meals, or coordinating schedules. This invisible work is crucial for family functioning.";
                        case "Visible Parental Tasks":
                          return "These questions explore observable parenting activities like school pickups, bedtime routines, and attending events. They help identify patterns in hands-on parenting responsibilities.";
                        case "Invisible Parental Tasks":
                          return "These questions focus on the mental and emotional labor of parenting - planning activities, remembering important dates, worrying about development, and coordinating with schools and activities.";
                        default:
                          return "This question helps us understand how responsibilities are distributed in your family.";
                      }
                    })()}
                  </p>

                  {/* Divider */}
                  <div className="border-t border-gray-300 my-2"></div>

                  {/* Task Weight Explanation */}
                  <p className="text-xs text-gray-600 mb-2">{currentQuestion.weightExplanation}</p>

                  {/* Weight factors with icons */}
                  <div className="flex flex-wrap gap-1 text-xs">
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-100 rounded-full">
                      <Clock size={10} className="mr-1" />
                      {currentQuestion.frequency}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 bg-purple-100 rounded-full">
                      <Eye size={10} className="mr-1" />
                      {currentQuestion.invisibility === 'highly' ? 'visible' : currentQuestion.invisibility}
                    </span>
                    {(currentQuestion.emotionalLabor === 'high' || currentQuestion.emotionalLabor === 'extreme') && (
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-red-100 rounded-full">
                        <Heart size={10} className="mr-1" />
                        high emotion
                      </span>
                    )}
                    {currentQuestion.childDevelopment === 'high' && (
                      <span className="inline-flex items-center px-1.5 py-0.5 bg-green-100 rounded-full">
                        <Brain size={10} className="mr-1" />
                        teaches kids
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Sibling Context Display */}
              {showSiblingContext && currentQuestion.text && (
                (() => {
                  // Check if this question is about a specific child
                  const childrenNames = children.map(c => c.name);
                  const mentionedChild = childrenNames.find(name => 
                    currentQuestion.text.toLowerCase().includes(name.toLowerCase())
                  );
                  
                  if (mentionedChild) {
                    const childId = children.find(c => c.name === mentionedChild)?.id;
                    const childInsights = siblingInsights[childId];
                    
                    if (childInsights && (childInsights.influences.length > 0 || childInsights.teaching.length > 0)) {
                      return (
                        <div className="mb-3 bg-purple-50 p-3 rounded-md border border-purple-200">
                          <div className="flex items-start gap-2">
                            <Users size={16} className="text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-purple-800 mb-1">Sibling Context</p>
                              
                              {childInsights.influences.length > 0 && (
                                <div className="text-xs text-purple-700 mb-1">
                                  <span className="font-medium">{mentionedChild}</span> is influenced by siblings in:
                                  <ul className="ml-3 mt-0.5">
                                    {childInsights.influences.slice(0, 2).map((influence, idx) => (
                                      <li key={idx} className="flex items-center gap-1">
                                        <Zap size={10} />
                                        {influence.relationship?.properties?.type || 'general areas'}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {childInsights.teaching.length > 0 && (
                                <div className="text-xs text-purple-700">
                                  <span className="font-medium">{mentionedChild}</span> teaches:
                                  <ul className="ml-3 mt-0.5">
                                    {childInsights.teaching.slice(0, 2).map((teach, idx) => (
                                      <li key={idx} className="flex items-center gap-1">
                                        <Users size={10} />
                                        {teach.entity.properties.name} ({teach.relationship?.properties?.skill || 'various skills'})
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  }
                  return null;
                })()
              )}
              {/* Parent selection */}
              <div className="mt-8 mb-8">
                <div className="flex justify-center items-center parent-selection">
                  <div className="flex w-full max-w-lg justify-between items-center">
                    {/* Mama */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleSelectParent('Mama')}
                        className={`rounded-full focus:outline-none border-8 overflow-hidden transition-all ${
                          selectedParent === 'Mama' 
                            ? 'border-purple-500 scale-105 shadow-lg shadow-purple-200' 
                            : 'border-purple-400 hover:border-purple-500 hover:shadow-lg hover:shadow-purple-200'
                        }`}
                      >
                        <UserAvatar 
                          user={mamaUser || { name: 'Mama', id: 'mama' }} 
                          size={192}
                        />
                      </button>
                      <p className="mt-2 font-medium">{parents.mama.name}</p>
                      <p className="text-xs text-gray-500">(press 'M' key)</p>
                    </div>
                    
                    {/* Draw/Share button in the middle */}
                    <div className="flex flex-col items-center mx-4">
                      <button
                        onClick={() => handleSelectParent('Draw')}
                        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full focus:outline-none border-4 transition-all ${
                          selectedParent === 'Draw' 
                            ? 'border-gray-600 scale-105 bg-gray-100' 
                            : 'border-gray-300 hover:border-gray-400 bg-white'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center h-full">
                          <Scale size={24} className="text-gray-600 mb-1" />
                          <span className="text-xs font-medium text-gray-700">Share</span>
                        </div>
                      </button>
                      <p className="text-xs text-gray-500 mt-2">(press 'S' key)</p>
                    </div>
                    
                    {/* Papa */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => handleSelectParent('Papa')}
                        className={`rounded-full focus:outline-none border-8 overflow-hidden transition-all ${
                          selectedParent === 'Papa' 
                            ? 'border-blue-500 scale-105 shadow-lg shadow-blue-200' 
                            : 'border-blue-400 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-200'
                        }`}
                      >
                        <UserAvatar 
                          user={papaUser || { name: 'Papa', id: 'papa' }} 
                          size={192}
                        />
                      </button>
                      <p className="mt-2 font-medium">{parents.papa.name}</p>
                      <p className="text-xs text-gray-500">(press 'P' key)</p>
                    </div>
                  </div>
                </div>
                
              </div>
              
              {/* Progress bar */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <p className="font-medium text-sm">
                    Question {currentQuestionIndex + 1} of {totalQuestionCount}
                  </p>
                  {/* Show saved indicator if we have responses */}
                  {Object.keys(localUserResponses).length > 0 && lastSaved && (
                    <span className="text-xs text-gray-500">
                      (auto-saved)
                    </span>
                  )}
                  {/* Restore Progress button removed - progress is now automatically restored */}
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-black transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              
              {/* Action buttons at bottom */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex flex-col space-y-3">
                  {/* Weight customization and feedback */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowWeightMetrics(!showWeightMetrics)}
                      className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center"
                    >
                      <Scale size={14} className="mr-2" />
                      {showWeightMetrics ? 'Hide' : 'Customize'} Task Weight
                    </button>
                  </div>
                  
                  {/* Survey navigation info */}
                  <div className="flex justify-center space-x-4 text-sm">
                    <button
                      onClick={toggleQuestionList}
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <Eye size={14} className="mr-1" />
                      View All Questions
                    </button>
                    <button
                      onClick={() => openDrawerWithPrompt('Show me our family balance forecast based on the survey responses so far')}
                      disabled={getTotalFamilyResponses() < 10}
                      className={`flex items-center ${
                        getTotalFamilyResponses() >= 10
                          ? 'text-blue-600 hover:underline cursor-pointer'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                      title={getTotalFamilyResponses() < 10 ? `Family needs ${10 - getTotalFamilyResponses()} more responses to see forecast` : ''}
                    >
                      <BarChart3 size={14} className="mr-1" />
                      View Balance Forecast
                    </button>
                    {lastSaved && (
                      <span className="text-gray-500">
                        Saved {formatTime(lastSaved)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Weight metrics visualization */}
              {showWeightMetrics && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md border relative weight-customization">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium flex items-center">
                        <Scale size={16} className="mr-2 text-gray-700" />
                        Task Weight Analysis
                      </h4>
                      {editingWeight ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={handleSaveWeightChanges}
                            className="flex items-center text-xs text-green-600 hover:text-green-800 bg-green-50 px-2 py-1 rounded"
                          >
                            <Check size={12} className="mr-1" />
                            Save Changes
                          </button>
                          <button
                            onClick={handleCancelWeightEditing}
                            className="flex items-center text-xs text-red-600 hover:text-red-800 bg-red-50 px-2 py-1 rounded"
                          >
                            <X size={12} className="mr-1" />
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingWeight(!editingWeight)}
                          className="text-xs text-blue-600 flex items-center bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                        >
                          <Edit size={12} className="mr-1" />
                          Adjust Weights
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Base Time:</span>
                          {editingWeight ? (
                            <div className="flex items-center">
                              <button
                                className="px-1 bg-gray-200 text-gray-700 rounded-l"
                                onClick={() => {
                                  if (currentQuestion.baseWeight > 1) {
                                    const result = updateQuestionWeight(
                                      currentQuestion.id,
                                      'baseWeight',
                                      Math.max(1, currentQuestion.baseWeight - 1)
                                    );
                                    if (result) {
                                      // Update the current question with new weights
                                      setCurrentQuestion(result.updatedQuestion);
                                    }
                                  }
                                }}
                              >
                                -
                              </button>
                              <span className="font-medium px-2">{currentQuestion.baseWeight}/5</span>
                              <button
                                className="px-1 bg-gray-200 text-gray-700 rounded-r"
                                onClick={() => {
                                  if (currentQuestion.baseWeight < 5) {
                                    const result = updateQuestionWeight(
                                      currentQuestion.id,
                                      'baseWeight',
                                      Math.min(5, currentQuestion.baseWeight + 1)
                                    );
                                    if (result) {
                                      // Update the current question with new weights
                                      setCurrentQuestion(result.updatedQuestion);
                                    }
                                  }
                                }}
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <span className="font-medium">{currentQuestion.baseWeight}/5</span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 mt-1 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500" 
                            style={{ width: `${(currentQuestion.baseWeight / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Frequency:</span>
                          {editingWeight ? (
                            <div className="flex items-center">
                              <select
                                className="text-xs p-1 border rounded"
                                value={currentQuestion.frequency}
                                onChange={(e) => {
                                  const result = updateQuestionWeight(
                                    currentQuestion.id,
                                    'frequency',
                                    e.target.value
                                  );
                                  if (result) {
                                    // Update the current question with new weights
                                    setCurrentQuestion(result.updatedQuestion);
                                  }
                                }}
                              >
                                <option value="daily">Daily</option>
                                <option value="several">Several Times Weekly</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                              </select>
                            </div>
                          ) : (
                            <span className="font-medium">{currentQuestion.frequency}</span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 mt-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-green-500 h-full rounded-full" 
                            style={{ 
                              width: `${
                                currentQuestion.frequency === 'daily' ? 100 :
                                currentQuestion.frequency === 'several' ? 80 :
                                currentQuestion.frequency === 'weekly' ? 60 :
                                currentQuestion.frequency === 'monthly' ? 40 : 
                                20
                              }%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Invisibility:</span>
                          {editingWeight ? (
                            <div className="flex items-center">
                              <select
                                className="text-xs p-1 border rounded"
                                value={currentQuestion.invisibility}
                                onChange={(e) => {
                                  const result = updateQuestionWeight(
                                    currentQuestion.id,
                                    'invisibility',
                                    e.target.value
                                  );
                                  if (result) {
                                    // Update the current question with new weights
                                    setCurrentQuestion(result.updatedQuestion);
                                  }
                                }}
                              >
                                <option value="highly">Highly Visible</option>
                                <option value="partially">Partially Visible</option>
                                <option value="mostly">Mostly Invisible</option>
                                <option value="completely">Completely Invisible</option>
                              </select>
                            </div>
                          ) : (
                            <span className="font-medium">{currentQuestion.invisibility}</span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 mt-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-purple-500 h-full rounded-full" 
                            style={{ 
                              width: `${
                                currentQuestion.invisibility === 'completely' ? 100 :
                                currentQuestion.invisibility === 'mostly' ? 75 :
                                currentQuestion.invisibility === 'partially' ? 50 : 
                                25
                              }%` 
                            }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Emotional Labor:</span>
                          {editingWeight ? (
                            <div className="flex items-center">
                              <select
                                className="text-xs p-1 border rounded"
                                value={currentQuestion.emotionalLabor}
                                onChange={(e) => {
                                  const result = updateQuestionWeight(
                                    currentQuestion.id,
                                    'emotionalLabor',
                                    e.target.value
                                  );
                                  if (result) {
                                    // Update the current question with new weights
                                    setCurrentQuestion(result.updatedQuestion);
                                  }
                                }}
                              >
                                <option value="minimal">Minimal</option>
                                <option value="low">Low</option>
                                <option value="moderate">Moderate</option>
                                <option value="high">High</option>
                                <option value="extreme">Extreme</option>
                              </select>
                            </div>
                          ) : (
                            <span className="font-medium">{currentQuestion.emotionalLabor}</span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 mt-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-red-500 h-full rounded-full" 
                            style={{ 
                              width: `${
                                currentQuestion.emotionalLabor === 'extreme' ? 100 :
                                currentQuestion.emotionalLabor === 'high' ? 80 :
                                currentQuestion.emotionalLabor === 'moderate' ? 60 :
                                currentQuestion.emotionalLabor === 'low' ? 40 : 
                                20
                              }%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Total Weight Impact:</span>
                        <span className="font-bold">{parseFloat(currentQuestion.totalWeight).toFixed(1)}</span>
                      </div>
                    </div>
                    {editingWeight && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md text-xs text-blue-700">
                        <p>Adjusting weights will help Allie understand how you prioritize different tasks. Similar tasks will be updated with your preferences.</p>
                      </div>
                    )}
                  </div>
                )}
              
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with navigation - fixed at bottom */}
      <div className="border-t bg-white p-3 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex justify-between">
          <button 
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0 || isProcessing || isSubmitting}
            className={`px-4 py-2 border rounded flex items-center ${
              currentQuestionIndex === 0 || isProcessing || isSubmitting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white hover:bg-gray-50'
            }`}
          >
            <ArrowLeft size={16} className="mr-1" />
            Previous
          </button>
          <button 
            className={`px-4 py-2 border rounded ${
              isProcessing || isSubmitting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white hover:bg-gray-50'
            }`}
            onClick={handlePause}
            disabled={isProcessing || isSubmitting}
          >
            {mode === 'initial' ? 'Pause Survey' : 'Save & Exit'}
          </button>
          <button 
            className={`px-4 py-2 border rounded flex items-center ${
              isProcessing || isSubmitting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white hover:bg-gray-50'
            }`}
            onClick={handleSkip}
            disabled={isProcessing || isSubmitting}
          >
            Skip
            <ArrowRight size={16} className="ml-1" />
          </button>
        </div>
      </div>

    </div>
  );
};

export default SurveyScreen;