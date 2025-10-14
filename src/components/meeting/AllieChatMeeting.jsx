// src/components/meeting/AllieChatMeeting.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import FamilyBalanceChart from './FamilyBalanceChart';
import { MessageSquare, Save, Download, CheckCircle, Clock, ThumbsUp, ThumbsDown, Calendar, PlusCircle, User, Star } from 'lucide-react';
import ClaudeService from '../../services/ClaudeService';
import DatabaseService from '../../services/DatabaseService';

const AllieChatMeeting = ({ onClose }) => {
  const { 
    currentWeek, 
    saveFamilyMeetingNotes, 
    familyMembers, 
    surveyResponses,
    completedWeeks,
    completeWeek,
    familyId,
    weekHistory,
    habitRecommendations: taskRecommendations, // Using the renamed variable
    previousCompletedGoals
  } = useFamily();

  // Reference for automatic scrolling
  const messagesEndRef = useRef(null);
  
  // State for the meeting
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [currentStage, setCurrentStage] = useState('intro');
  const [meetingNotes, setMeetingNotes] = useState({
    wentWell: '',
    couldImprove: '',
    actionItems: '',
    nextWeekGoals: '',
    additionalNotes: '',
    kidsInput: '',
    balanceReflection: '',
    previousGoalsStatus: {}
  });
  const [loading, setLoading] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [suggestedResponses, setSuggestedResponses] = useState([]);
  const [habitCompletionStats, setHabitCompletionStats] = useState(null);
  const [previousGoals, setPreviousGoals] = useState([]);
  const [shownUIs, setShownUIs] = useState({
    chart: false,
    previousGoals: false,
    habitStats: false,
    suggestionChips: false
  });
  
  // Stages of the meeting with more detailed progression
  const stages = [
    'intro',
    'previousGoals',  // New stage for reviewing previous goals
    'habitCompletion', // New stage for habit completion stats
    'wentWell',
    'couldImprove',
    'actionItems',
    'kidsCorner',
    'nextWeekGoals',
    'summary'
  ];
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load habit completion stats
  useEffect(() => {
    const loadHabitCompletionStats = async () => {
      try {
        // Get habit completion stats for the current week
        const stats = {
          total: 0,
          completed: 0,
          byParent: { mama: 0, papa: 0 },
          byCategory: {},
          habitHelperCount: 0,
          habitHelperList: []
        };
        
        // Count completed habits and get details
        if (taskRecommendations && taskRecommendations.length > 0) {
          stats.total = taskRecommendations.length;
          
          // Process each habit
          taskRecommendations.forEach(habit => {
            // Count completed habits
            if (habit.completed) {
              stats.completed++;
              
              // Count by parent
              const assignedTo = habit.assignedTo?.toLowerCase() || '';
              if (assignedTo.includes('mama') || assignedTo.includes('mom')) {
                stats.byParent.mama++;
              } else if (assignedTo.includes('papa') || assignedTo.includes('dad')) {
                stats.byParent.papa++;
              }
              
              // Count by category
              const category = habit.category || 'Other';
              stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
            }
            
            // Count habits with helpers
            if (habit.helpers && habit.helpers.length > 0) {
              stats.habitHelperCount++;
              
              // Store habit details for display
              stats.habitHelperList.push({
                title: habit.title,
                assignedTo: habit.assignedTo,
                helpers: habit.helpers,
                completed: habit.completed
              });
            }
          });
        }
        
        setHabitCompletionStats(stats);
        console.log("Loaded habit completion stats:", stats);
      } catch (error) {
        console.error("Error loading habit completion stats:", error);
      }
    };
    
    // Load previous week's goals
    const loadPreviousGoals = async () => {
      try {
        // Only load previous goals if we're past week 1
        if (currentWeek > 1) {
          const familyDoc = await DatabaseService.getDoc(`families/${familyId}`);
          if (familyDoc && familyDoc.weekGoals) {
            const prevWeekGoals = familyDoc.weekGoals[`week${currentWeek - 1}`] || [];
            if (prevWeekGoals.length > 0) {
              setPreviousGoals(prevWeekGoals);
              
              // Initialize status of each goal as 'pending'
              const initialStatus = {};
              prevWeekGoals.forEach(goal => {
                initialStatus[goal] = 'pending';
              });
              
              setMeetingNotes(prev => ({
                ...prev,
                previousGoalsStatus: initialStatus
              }));
              
              console.log(`Loaded ${prevWeekGoals.length} goals from previous week`);
            }
          }
        }
      } catch (error) {
        console.error("Error loading previous week goals:", error);
      }
    };
    
    loadHabitCompletionStats();
    loadPreviousGoals();
  }, [currentWeek, taskRecommendations, familyId]);
  
  // Initialize the chat with a welcome message
  useEffect(() => {
    initializeChat();
  }, []);
  
  // Initialize the chat with Allie's welcome
  const initializeChat = () => {
    // Get family member names for personalization
    const parents = familyMembers.filter(member => 
      member.role === 'parent' || member.role === 'Mama' || member.role === 'Papa'
    );
    const parentNames = parents.map(parent => parent.name).join(' and ');
    
    // Personalized welcome message
    const welcomeMessage = {
      sender: 'allie',
      content: `Welcome to your Week ${currentWeek} Family Meeting, ${parentNames}! 👋\n\nI'm Allie, and I'll guide you through this meeting to help your family celebrate wins, address challenges, and plan improvements for better balance in the upcoming week. This should take about 10-15 minutes, and we'll cover a few key areas to make sure your family is thriving.`,
      timestamp: new Date()
    };
    
    setMessages([welcomeMessage]);
    setSuggestedResponses([
      'We\'re ready to get started!',
      'What are we covering today?',
      'How does this work?'
    ]);
    
    // Start at intro stage
    setCurrentStage('intro');
  };
  
  // Handle user input
  const handleUserInput = (e) => {
    setUserInput(e.target.value);
  };
  
  // Send a message (from input box)
  const sendMessage = () => {
    if (!userInput.trim()) return;
    
    // Use the message handler with the input text
    handleUserMessage(userInput);
    
    // Clear input
    setUserInput('');
  };
  
  // Handle user message (from input or quick replies)
  const handleUserMessage = (messageText) => {
    // Add user message
    const newMessage = {
      sender: 'user',
      content: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Update meeting notes based on current stage
    updateMeetingNotes(messageText);
    
    // Process the message and determine next steps
    setLoading(true);
    setSuggestedResponses([]); // Clear quick replies when user responds
    
    // Process the user message with Claude for more natural responses
    processUserMessageWithClaude(messageText, currentStage);
  };
  
  // Process user message with Claude for more natural responses
  const processUserMessageWithClaude = async (userMessage, stage) => {
    try {
      // Create context for Claude
      const contextInfo = {
        familyId,
        familyMembers,
        currentWeek,
        stage,
        meetingNotes,
        previousMessages: messages.slice(-5), // Last 5 messages for context
        habitStats: habitCompletionStats,
        previousGoals
      };
      
      // Create a system prompt that guides Claude's response
      const systemPrompt = `You are Allie, an AI family assistant helping guide a family through their weekly meeting. This is week ${currentWeek} of their family journey. 
      
You're currently at the '${stage}' stage of the meeting.

Make your responses warm, encouraging, and family-friendly. Keep them concise but personalized - use family members' names when appropriate.

After your response, suggest 2-3 options for how the family might respond, phrased in their voice.

Current meeting notes:
${JSON.stringify(meetingNotes, null, 2)}`;

      // Get a personalized response from Claude
      const claudeResponse = await ClaudeService.getChatResponse(
        userMessage,
        systemPrompt,
        JSON.stringify(contextInfo)
      );
      
      // Process Claude's response to extract the main message and suggested responses
      const { mainResponse, suggestedReplies } = parseClaudeResponse(claudeResponse);
      
      // Add Allie's response to the messages
      const allieResponse = {
        sender: 'allie',
        content: mainResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, allieResponse]);
      
      // Set suggested responses
      if (suggestedReplies.length > 0) {
        setSuggestedResponses(suggestedReplies);
      } else {
        // Default suggested responses based on stage
        setSuggestedResponses(getDefaultSuggestedResponses(stage));
      }
      
      // Advance to next stage if appropriate
      checkAndAdvanceStage(stage, userMessage);
      
    } catch (error) {
      console.error("Error processing message with Claude:", error);
      
      // Fallback to standard response
      processStandardStageResponse(userMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Parse Claude's response to extract main message and suggested replies
  const parseClaudeResponse = (response) => {
    // Default values
    let mainResponse = response;
    let suggestedReplies = [];
    
    // Try to extract suggested replies if they're in the format:
    // [SUGGESTIONS]: option 1, option 2, option 3
    const suggestionRegex = /\[SUGGESTIONS\]:\s*(.*?)(?:\n|$)/;
    const match = response.match(suggestionRegex);
    
    if (match && match[1]) {
      // Remove the suggestions from the main response
      mainResponse = response.replace(suggestionRegex, '').trim();
      
      // Parse the suggestions
      suggestedReplies = match[1].split(',').map(s => s.trim());
    } else {
      // Alternative format: look for numbered suggestions at the end
      const lines = response.split('\n');
      const possibleSuggestions = [];
      
      // Check the last few lines for numbered or bulleted suggestions
      for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
        const line = lines[i].trim();
        if (line.match(/^(\d+[\.\):]|[-•*])\s+.+/) && line.length < 100) {
          possibleSuggestions.unshift(line.replace(/^(\d+[\.\):]|[-•*])\s+/, ''));
        } else if (possibleSuggestions.length > 0) {
          // Stop looking once we hit a non-suggestion line after finding suggestions
          break;
        }
      }
      
      if (possibleSuggestions.length > 0) {
        suggestedReplies = possibleSuggestions;
        // Remove the suggestions from the main response
        mainResponse = lines.slice(0, lines.length - possibleSuggestions.length).join('\n').trim();
      }
    }
    
    return { mainResponse, suggestedReplies };
  };
  
  // Get default suggested responses based on the current stage
  const getDefaultSuggestedResponses = (stage) => {
    switch (stage) {
      case 'intro':
        return ['We\'re ready to get started!', 'What will we cover today?'];
      case 'previousGoals':
        return ['We completed most of our goals', 'We struggled with these goals', 'Let\'s discuss each one'];
      case 'habitCompletion':
        return ['That looks accurate', 'Let\'s talk about this more', 'This is interesting'];
      case 'wentWell':
        return ['We balanced chores better', 'Communication improved', 'Our kids helped out more'];
      case 'couldImprove':
        return ['We need to communicate better', 'Mornings are still stressful', 'We need better planning'];
      case 'actionItems':
        return ['Let\'s create a shared calendar', 'We need a morning routine', 'Weekly planning sessions'];
      case 'kidsCorner':
        return ['They noticed we were less stressed', 'They liked helping more', 'They want more family time'];
      case 'nextWeekGoals':
        return ['Balance morning responsibilities', 'Have more family meals', 'Plan our week together'];
      case 'summary':
        return ['Looks good!', 'Can we add one more thing?', 'Let\'s complete the meeting'];
      default:
        return ['Tell me more', 'That makes sense', 'Let\'s continue'];
    }
  };
  
  // Check if we should advance to the next stage based on user message
  const checkAndAdvanceStage = (stage, userMessage) => {
    // Only advance if we get a substantive response (more than 10 characters)
    const isSubstantiveResponse = userMessage.trim().length > 10;
    
    // Don't auto-advance if the user is asking a question
    const isQuestion = userMessage.trim().endsWith('?');
    
    if (isSubstantiveResponse && !isQuestion) {
      // Move to next stage and show appropriate UI
      const currentIndex = stages.indexOf(stage);
      if (currentIndex >= 0 && currentIndex < stages.length - 1) {
        const nextStage = stages[currentIndex + 1];
        
        // If this is the first time moving to this stage, show appropriate UI components
        showStageSpecificUI(nextStage);
        
        // Set the next stage
        setCurrentStage(nextStage);
        
        // Send an introductory message for the new stage
        sendStageIntroduction(nextStage);
      }
    }
  };
  
  // Show UI components specific to the stage
  const showStageSpecificUI = (stage) => {
    switch(stage) {
      case 'previousGoals':
        if (!shownUIs.previousGoals && previousGoals.length > 0) {
          // Show the previous goals UI component
          setMessages(prev => [...prev, {
            sender: 'allie',
            content: `Here are the goals you set in your previous meeting:`,
            component: <PreviousGoalsReview 
              goals={previousGoals}
              statusMap={meetingNotes.previousGoalsStatus}
              onStatusChange={handlePreviousGoalStatusChange}
            />,
            timestamp: new Date()
          }]);
          setShownUIs(prev => ({ ...prev, previousGoals: true }));
        }
        break;
        
      case 'habitCompletion':
        if (!shownUIs.habitStats && habitCompletionStats) {
          // Show the habit completion stats UI component
          setMessages(prev => [...prev, {
            sender: 'allie',
            content: `Here's a summary of your family's habit completion for the week:`,
            component: <HabitCompletionSummary stats={habitCompletionStats} />,
            timestamp: new Date()
          }]);
          setShownUIs(prev => ({ ...prev, habitStats: true }));
        }
        break;
        
      case 'wentWell':
        if (!shownUIs.chart) {
          // Show the family balance chart
          setMessages(prev => [...prev, {
            sender: 'allie',
            content: `Here's your family balance journey so far:`,
            component: <FamilyBalanceChart weekHistory={weekHistory} completedWeeks={completedWeeks} />,
            timestamp: new Date()
          }]);
          setShownUIs(prev => ({ ...prev, chart: true }));
        }
        break;
        
      default:
        break;
    }
  };
  
  // Send an introductory message for a new stage
  const sendStageIntroduction = (stage) => {
    let introMessage;
    
    switch(stage) {
      case 'previousGoals':
        introMessage = previousGoals.length > 0 
          ? `Let's start by reviewing the goals you set in last week's meeting. How did your family do with these?` 
          : `Since this is your first meeting, we don't have previous goals to review. Let's look at your progress so far.`;
        break;
        
      case 'habitCompletion':
        introMessage = `Now, let's look at your family's habit completion for the week. This gives us a good picture of how you're balancing responsibilities.`;
        break;
        
      case 'wentWell':
        introMessage = `Great! Now, let's talk about what went well this week. What are some successes your family experienced with workload sharing or habit completion?`;
        break;
        
      case 'couldImprove':
        introMessage = `Thank you for sharing those successes! Now, let's discuss what could be improved. What challenges did your family face with workload balance this week?`;
        break;
        
      case 'actionItems':
        introMessage = `Based on these challenges, let's create some specific action items. What concrete steps will your family take to improve balance?`;
        break;
        
      case 'kidsCorner':
        introMessage = `Now let's include the kids' perspective. What did your children notice about family responsibilities this week? What feedback did they share?`;
        break;
        
      case 'nextWeekGoals':
        introMessage = `Finally, let's set some goals for the upcoming week. What are your family's top priorities for Week ${currentWeek + 1}?`;
        break;
        
      case 'summary':
        // Generate a summary for review
        const summary = generateMeetingSummary();
        introMessage = `Excellent! I've prepared a summary of our meeting:\n\n${summary}\n\nIs there anything you'd like to add or change before we complete the meeting?`;
        break;
        
      default:
        introMessage = `Let's continue with our family meeting.`;
    }
    
    // Send the introduction message
    if (introMessage) {
      const newMessage = {
        sender: 'allie',
        content: introMessage,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newMessage]);
    }
  };
  
  // Fallback to standard responses if Claude is unavailable
  const processStandardStageResponse = (userMessage) => {
    let response;
    let nextStage = currentStage;
    
    // Based on current stage, generate a response and determine next stage
    switch (currentStage) {
      case 'intro':
        response = `Great! Let's get started with your Week ${currentWeek} family meeting.`;
        nextStage = 'previousGoals';
        break;
        
      case 'previousGoals':
        response = `Thanks for reviewing your previous goals. This reflection helps track your family's progress.`;
        nextStage = 'habitCompletion';
        break;
        
      case 'habitCompletion':
        response = `Thanks for reviewing your habit completion. Now, let's talk about what went well this week with your family balance.`;
        nextStage = 'wentWell';
        break;
        
      case 'wentWell':
        response = `Thank you for sharing what went well! It's important to celebrate these wins.\n\nNow, let's talk about what could improve. What challenges did your family face with workload sharing this week?`;
        nextStage = 'couldImprove';
        break;
        
      case 'couldImprove':
        response = `I appreciate your honesty about the challenges. Identifying areas for improvement is the first step to making positive changes.\n\nLet's move on to action items. What specific changes would your family like to commit to for next week?`;
        nextStage = 'actionItems';
        break;
        
      case 'actionItems':
        response = `Those are great action items! I'll make sure to save these for your next week's plan.\n\nNow let's hear from the kids. What did the children observe about family responsibilities this week?`;
        nextStage = 'kidsCorner';
        break;
        
      case 'kidsCorner':
        response = `Thank you for including the kids' perspectives! This helps everyone feel valued and heard.\n\nFinally, let's set some goals for next week. What are your family's top priorities for the coming week?`;
        nextStage = 'nextWeekGoals';
        break;
        
      case 'nextWeekGoals':
        // Generate a summary for review
        const summary = generateMeetingSummary();
        response = `Great goals! I've prepared a summary of our meeting for your review:\n\n${summary}\n\nIs there anything you'd like to add or change before we complete the meeting?`;
        nextStage = 'summary';
        break;
        
      case 'summary':
        response = `Thank you for a productive family meeting! I've saved all your notes and will use them to help track your progress.\n\nYou can now complete this week's cycle or download a summary of the meeting.`;
        nextStage = 'completed';
        break;
        
      default:
        response = `I'm not sure what stage we're at. Let's start again with what went well this week.`;
        nextStage = 'wentWell';
    }
    
    // Add Allie's response
    const newResponse = {
      sender: 'allie',
      content: response,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newResponse]);
    setCurrentStage(nextStage);
    
    // Set suggested responses based on the new stage
    setSuggestedResponses(getDefaultSuggestedResponses(nextStage));
    
    // If we've completed all stages, save the meeting notes
    if (nextStage === 'completed') {
      saveFamilyMeetingNotes(currentWeek, meetingNotes);
    }
  };
  
  // Handle previous goal status changes
  const handlePreviousGoalStatusChange = (goal, status) => {
    setMeetingNotes(prev => ({
      ...prev,
      previousGoalsStatus: {
        ...prev.previousGoalsStatus,
        [goal]: status
      }
    }));
  };
  
  // Update meeting notes based on current stage
  const updateMeetingNotes = (input) => {
    const stageToFieldMap = {
      'wentWell': 'wentWell',
      'couldImprove': 'couldImprove',
      'actionItems': 'actionItems',
      'kidsCorner': 'kidsInput',
      'nextWeekGoals': 'nextWeekGoals',
      'summary': 'additionalNotes'
    };
    
    const field = stageToFieldMap[currentStage];
    if (field) {
      setMeetingNotes(prev => {
        // If this field already has content, append the new input
        if (prev[field]) {
          return {
            ...prev,
            [field]: `${prev[field]}\n${input}`
          };
        }
        
        // Otherwise, set the input as the content
        return {
          ...prev,
          [field]: input
        };
      });
    }
  };
  
  // Generate a meeting summary
  const generateMeetingSummary = () => {
    // Create sections array with only non-empty sections
    const sections = [];
    
    // Previous goals section
    if (previousGoals.length > 0) {
      const goalStatusTexts = previousGoals.map(goal => {
        const status = meetingNotes.previousGoalsStatus[goal] || 'pending';
        let statusText = '⏳ Not reviewed';
        
        if (status === 'completed') {
          statusText = '✅ Completed';
        } else if (status === 'partial') {
          statusText = '🔶 Partially completed';
        } else if (status === 'not_completed') {
          statusText = '❌ Not completed';
        }
        
        return `${goal} - ${statusText}`;
      });
      
      sections.push(`## Previous Week's Goals\n${goalStatusTexts.join('\n')}`);
    }
    
    // Habit completion section
    if (habitCompletionStats) {
      const completionRate = habitCompletionStats.total > 0 
        ? Math.round((habitCompletionStats.completed / habitCompletionStats.total) * 100) 
        : 0;
      
      sections.push(`## Habit Completion\nCompletion Rate: ${completionRate}% (${habitCompletionStats.completed} of ${habitCompletionStats.total} habits)`);
      
      if (habitCompletionStats.habitHelperCount > 0) {
        sections.push(`${habitCompletionStats.habitHelperCount} habits had children helping!`);
      }
    }
    
    // What went well section
    if (meetingNotes.wentWell) {
      sections.push(`## What Went Well\n${meetingNotes.wentWell}`);
    }
    
    // What could improve section
    if (meetingNotes.couldImprove) {
      sections.push(`## What Could Improve\n${meetingNotes.couldImprove}`);
    }
    
    // Action items section
    if (meetingNotes.actionItems) {
      sections.push(`## Action Items\n${meetingNotes.actionItems}`);
    }
    
    // Kids' corner section
    if (meetingNotes.kidsInput) {
      sections.push(`## Kids' Corner\n${meetingNotes.kidsInput}`);
    }
    
    // Next week's goals section
    if (meetingNotes.nextWeekGoals) {
      sections.push(`## Next Week's Goals\n${meetingNotes.nextWeekGoals}`);
    }
    
    // Additional notes section
    if (meetingNotes.additionalNotes) {
      sections.push(`## Additional Notes\n${meetingNotes.additionalNotes}`);
    }
    
    return sections.join('\n\n');
  };
  
  // Add selected action items to the Kanban board
  const addActionsToKanban = async () => {
    try {
      if (!meetingNotes.actionItems) {
        return true; // No action items to add
      }
      
      // Get current date and format it
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString();
      
      // Split action items by line breaks
      const actionItems = meetingNotes.actionItems.split('\n').filter(Boolean);
      
      // Skip if no action items
      if (actionItems.length === 0) {
        console.log("No action items to add to Kanban");
        return true;
      }
      
      // Use robust method to get kanban reference
      try {
        // First, try using the direct kanban collection
        const { collection, addDoc } = await import('firebase/firestore');
        const { db } = await import('../../services/firebase');
        
        const kanbanCollection = collection(db, `families/${familyId}/kanban`);
        
        // Add each action item to the Kanban board
        const actionPromises = actionItems.map(async (actionItem) => {
          // Create a new Kanban card
          const newCard = {
            title: actionItem,
            description: `Created during Family Meeting Week ${currentWeek}`,
            status: 'todo',
            createdAt: formattedDate,
            assignedTo: [], // Will be assigned during the meeting
            category: 'family',
            priority: 'medium',
            tags: ['family-meeting', `week-${currentWeek}`],
            source: 'family-meeting'
          };
          
          // Add the card to the Kanban collection
          return addDoc(kanbanCollection, newCard);
        });
        
        // Wait for all cards to be added
        await Promise.all(actionPromises);
        console.log(`Added ${actionItems.length} action items to Kanban board`);
        
        return true;
      } catch (firestoreError) {
        console.warn("Error using Firestore for Kanban, trying DatabaseService:", firestoreError);
        
        // Fall back to database service if it has the right methods
        if (typeof DatabaseService.addKanbanCard === 'function') {
          // Use DatabaseService method as backup
          const actionPromises = actionItems.map(async (actionItem) => {
            return DatabaseService.addKanbanCard(familyId, {
              title: actionItem,
              description: `Created during Family Meeting Week ${currentWeek}`,
              status: 'todo',
              createdAt: formattedDate,
              assignedTo: [],
              category: 'family',
              priority: 'medium',
              tags: ['family-meeting', `week-${currentWeek}`],
              source: 'family-meeting'
            });
          });
          
          // Wait for all cards to be added
          await Promise.all(actionPromises);
          console.log(`Added ${actionItems.length} action items to Kanban board using DatabaseService`);
          
          return true;
        } else if (typeof DatabaseService.getKanbanBoardRef === 'function') {
          // Try the old way using DatabaseService.getKanbanBoardRef as a last resort
          const kanbanRef = DatabaseService.getKanbanBoardRef(familyId);
          
          // Add each action item to the Kanban board
          const actionPromises = actionItems.map(async (actionItem) => {
            // Create a new Kanban card
            const newCard = {
              id: DatabaseService.generateId(),
              title: actionItem,
              description: `Created during Family Meeting Week ${currentWeek}`,
              status: 'todo',
              createdAt: formattedDate,
              assignedTo: [], // Will be assigned during the meeting
              category: 'family',
              priority: 'medium',
              tags: ['family-meeting', `week-${currentWeek}`],
              source: 'family-meeting'
            };
            
            // Add the card to the Kanban board
            return kanbanRef.child(newCard.id).set(newCard);
          });
          
          // Wait for all cards to be added
          await Promise.all(actionPromises);
          console.log(`Added ${actionItems.length} action items to Kanban board using getKanbanBoardRef`);
          
          return true;
        } else {
          throw new Error("No viable method to add Kanban cards");
        }
      }
    } catch (error) {
      console.error("Error adding actions to Kanban:", error);
      
      // Create a user-friendly error message instead of showing technical error
      alert("We couldn't add your action items to the Kanban board. Your meeting data has been saved, but you'll need to manually add action items to your tasks.");
      
      return false;
    }
  };
  
  // Update previous goal statuses in Kanban board
  const updatePreviousGoalsInKanban = async () => {
    // Only proceed if we have previous goals with statuses
    if (previousGoals.length === 0) {
      return true;
    }
    
    try {
      // Get current date for updates
      const currentDate = new Date().toISOString();
      
      // Try using direct Firestore access first
      try {
        const { collection, getDocs, query, where, updateDoc, doc, addDoc } = await import('firebase/firestore');
        const { db } = await import('../../services/firebase');
        
        // Get the kanban collection reference
        const kanbanCollection = collection(db, `families/${familyId}/kanban`);
        
        // Get all kanban items for this family
        const kanbanSnapshot = await getDocs(kanbanCollection);
        const kanbanItems = [];
        
        kanbanSnapshot.forEach(doc => {
          kanbanItems.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Track goals we've processed
        const updatedGoals = [];
        const newGoalPromises = [];
        
        // Process each goal status
        for (const [goal, status] of Object.entries(meetingNotes.previousGoalsStatus)) {
          // Skip pending status as it's the default
          if (status === 'pending') continue;
          
          // Look for existing kanban cards with this goal title
          let matchFound = false;
          
          for (const card of kanbanItems) {
            // Check if this card matches our goal
            if (card.title === goal || 
                (card.tags?.includes(`week-${currentWeek - 1}`) && 
                card.source === 'family-meeting')) {
              
              // Update kanban card status based on goal status
              const cardStatus = 
                status === 'completed' ? 'done' : 
                status === 'partial' ? 'in-progress' : 
                'todo';
              
              // Prepare updated tag list
              const updatedTags = [...(card.tags || [])];
              if (!updatedTags.includes(`reviewed-week-${currentWeek}`)) {
                updatedTags.push(`reviewed-week-${currentWeek}`);
              }
              
              // Update the card
              const cardRef = doc(db, `families/${familyId}/kanban/${card.id}`);
              await updateDoc(cardRef, {
                status: cardStatus,
                lastUpdated: currentDate,
                tags: updatedTags
              });
              
              matchFound = true;
              updatedGoals.push(goal);
              break; // Found a match, move to next goal
            }
          }
          
          // If no matching card found, potentially create a new one
          if (!matchFound && (status === 'completed' || status === 'partial')) {
            // Create a new card for completed/partial goals to track the achievement
            const newCard = {
              title: goal,
              description: `Previous week goal reviewed during Family Meeting Week ${currentWeek}`,
              status: status === 'completed' ? 'done' : 'in-progress',
              createdAt: currentDate,
              lastUpdated: currentDate,
              assignedTo: [],
              category: 'family',
              priority: 'medium',
              tags: ['family-meeting', `week-${currentWeek - 1}`, `reviewed-week-${currentWeek}`],
              source: 'family-meeting-review'
            };
            
            // Add the card to the Kanban board
            newGoalPromises.push(addDoc(kanbanCollection, newCard));
            updatedGoals.push(goal);
          }
        }
        
        // Wait for all new goal cards to be added
        if (newGoalPromises.length > 0) {
          await Promise.all(newGoalPromises);
        }
        
        console.log(`Updated ${updatedGoals.length} previous week goals in Kanban board`);
        return true;
        
      } catch (firestoreError) {
        console.warn("Error using Firestore for updating goals in Kanban, trying alternative:", firestoreError);
        
        // Try alternative implementation if available
        if (typeof DatabaseService.updateKanbanCard === 'function' &&
            typeof DatabaseService.getKanbanCards === 'function') {
          
          // Get all kanban items for this family
          const kanbanItems = await DatabaseService.getKanbanCards(familyId);
          const updatedGoals = [];
          
          // Process each goal status
          for (const [goal, status] of Object.entries(meetingNotes.previousGoalsStatus)) {
            // Skip pending status as it's the default
            if (status === 'pending') continue;
            
            // Look for existing kanban cards with this goal title
            let matchFound = false;
            
            for (const card of kanbanItems) {
              // Check if this card matches our goal
              if (card.title === goal || 
                  (card.tags?.includes(`week-${currentWeek - 1}`) && 
                  card.source === 'family-meeting')) {
                
                // Update kanban card status based on goal status
                const cardStatus = 
                  status === 'completed' ? 'done' : 
                  status === 'partial' ? 'in-progress' : 
                  'todo';
                
                // Update the card
                await DatabaseService.updateKanbanCard(familyId, card.id, {
                  status: cardStatus,
                  lastUpdated: currentDate,
                  tags: [...(card.tags || []), `reviewed-week-${currentWeek}`]
                });
                
                matchFound = true;
                updatedGoals.push(goal);
                break; // Found a match, move to next goal
              }
            }
            
            // If no matching card found, potentially create a new one
            if (!matchFound && (status === 'completed' || status === 'partial')) {
              // Create a new card for completed/partial goals
              await DatabaseService.addKanbanCard(familyId, {
                title: goal,
                description: `Previous week goal reviewed during Family Meeting Week ${currentWeek}`,
                status: status === 'completed' ? 'done' : 'in-progress',
                createdAt: currentDate,
                lastUpdated: currentDate,
                assignedTo: [],
                category: 'family',
                priority: 'medium',
                tags: ['family-meeting', `week-${currentWeek - 1}`, `reviewed-week-${currentWeek}`],
                source: 'family-meeting-review'
              });
              
              updatedGoals.push(goal);
            }
          }
          
          console.log(`Updated ${updatedGoals.length} previous week goals in Kanban board using DatabaseService`);
          return true;
        } else if (typeof DatabaseService.getKanbanBoardRef === 'function') {
          // Fall back to the original implementation using DatabaseService.getKanbanBoardRef
          const kanbanRef = DatabaseService.getKanbanBoardRef(familyId);
          
          // First, query existing kanban items that might match our goals
          const snapshot = await kanbanRef.once('value');
          const kanbanItems = snapshot.val() || {};
          
          // Look for cards that match our previous goals
          const updatedGoals = [];
          
          Object.entries(meetingNotes.previousGoalsStatus).forEach(([goal, status]) => {
            // Skip pending status as it's the default
            if (status === 'pending') return;
            
            // Look for existing kanban cards with this goal title
            let matchFound = false;
            
            Object.entries(kanbanItems).forEach(([cardId, cardData]) => {
              // Check if this card matches our goal
              if (cardData.title === goal || 
                  cardData.tags?.includes(`week-${currentWeek - 1}`) && 
                  cardData.source === 'family-meeting') {
                
                // Update kanban card status based on goal status
                const cardStatus = 
                  status === 'completed' ? 'done' : 
                  status === 'partial' ? 'in-progress' : 
                  'todo';
                
                // Update the card
                kanbanRef.child(cardId).update({
                  status: cardStatus,
                  lastUpdated: currentDate,
                  tags: [...(cardData.tags || []), `reviewed-week-${currentWeek}`]
                });
                
                matchFound = true;
                updatedGoals.push(goal);
              }
            });
            
            // If no matching card found, potentially create a new one
            if (!matchFound && (status === 'completed' || status === 'partial')) {
              // Create a new card for completed/partial goals to track the achievement
              const newCard = {
                id: DatabaseService.generateId(),
                title: goal,
                description: `Previous week goal reviewed during Family Meeting Week ${currentWeek}`,
                status: status === 'completed' ? 'done' : 'in-progress',
                createdAt: currentDate,
                assignedTo: [],
                category: 'family',
                priority: 'medium',
                tags: ['family-meeting', `week-${currentWeek - 1}`, `reviewed-week-${currentWeek}`],
                source: 'family-meeting-review'
              };
              
              // Add the card to the Kanban board
              kanbanRef.child(newCard.id).set(newCard);
              updatedGoals.push(goal);
            }
          });
          
          console.log(`Updated ${updatedGoals.length} previous week goals in Kanban board using getKanbanBoardRef`);
          return true;
        } else {
          throw new Error("No viable method to update Kanban cards");
        }
      }
    } catch (error) {
      console.error("Error updating previous goals in Kanban:", error);
      
      // User-friendly error message
      alert("We couldn't update your previous goals in the Kanban board, but your meeting data has been saved.");
      
      // Still return true so the meeting can complete
      return true;
    }
  };
  
  // Handle meeting completion
  const handleCompleteMeeting = async () => {
    setIsCompleting(true);
    
    try {
      // Save final notes
      await saveFamilyMeetingNotes(currentWeek, meetingNotes);
      
      // Update previous goals status in Kanban
      if (previousGoals.length > 0) {
        const updateResult = await updatePreviousGoalsInKanban();
        if (updateResult) {
          console.log("Successfully updated previous week goals in Kanban board");
        }
      }
      
      // Add action items to Kanban board
      const kanbanResult = await addActionsToKanban();
      if (kanbanResult) {
        console.log("Successfully added action items to Kanban board");
      }
      
      // Store goals for tracking in the next meeting
      if (meetingNotes.nextWeekGoals) {
        const nextWeekGoals = meetingNotes.nextWeekGoals.split('\n').filter(Boolean);
        
        if (nextWeekGoals.length > 0) {
          // Store goals in the family document for next week's meeting
          await DatabaseService.updateDoc(`families/${familyId}`, {
            [`weekGoals.week${currentWeek + 1}`]: nextWeekGoals,
            [`lastUpdated`]: new Date().toISOString()
          });
          console.log(`Stored ${nextWeekGoals.length} goals for week ${currentWeek + 1}`);
        }
      }
      
      // Complete the week
      await completeWeek(currentWeek);
      
      // Add a completion message
      const completionMessage = {
        sender: 'allie',
        content: `🎉 Week ${currentWeek} has been completed successfully! You're now moving to Week ${currentWeek + 1}.\n\nI've saved all your meeting notes, added your action items to the Kanban board, and stored your goals for next week's review. Great job on completing your family meeting!`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, completionMessage]);
      
      // Close after a delay
      setTimeout(() => {
        onClose();
      }, 5000);
    } catch (error) {
      console.error("Error completing meeting:", error);
      
      // Add an error message
      const errorMessage = {
        sender: 'allie',
        content: `There was an error completing the week. Please try again.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsCompleting(false);
    }
  };
  
  // Download meeting summary
  const handleDownloadSummary = () => {
    const summary = generateMeetingSummary();
    const blob = new Blob([summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Family-Meeting-Week-${currentWeek}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Component to display previous goals and allow status updates
  const PreviousGoalsReview = ({ goals, statusMap, onStatusChange }) => {
    return (
      <div className="bg-indigo-50 p-4 rounded-lg my-2 max-w-md">
        <h3 className="text-lg font-bold mb-2">Last Week's Goals</h3>
        <div className="space-y-3">
          {goals.map((goal, index) => (
            <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
              <p className="font-medium mb-2">{goal}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-3 py-1 rounded-full text-xs ${
                    statusMap[goal] === 'completed' 
                      ? 'bg-green-100 text-green-800 font-medium' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => onStatusChange(goal, 'completed')}
                >
                  Completed
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-xs ${
                    statusMap[goal] === 'partial' 
                      ? 'bg-yellow-100 text-yellow-800 font-medium' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => onStatusChange(goal, 'partial')}
                >
                  Partially Done
                </button>
                <button
                  className={`px-3 py-1 rounded-full text-xs ${
                    statusMap[goal] === 'not_completed' 
                      ? 'bg-red-100 text-red-800 font-medium' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => onStatusChange(goal, 'not_completed')}
                >
                  Not Completed
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Component to display habit completion statistics
  const HabitCompletionSummary = ({ stats }) => {
    if (!stats) return null;
    
    // Calculate completion percentage
    const completionPercentage = stats.total > 0 ? 
      Math.round((stats.completed / stats.total) * 100) : 0;
    
    return (
      <div className="bg-green-50 p-4 rounded-lg my-2 max-w-md">
        <h3 className="text-lg font-bold mb-2">Habit Completion</h3>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1 bg-white p-3 rounded-lg shadow-sm text-center">
            <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
            <div className="text-2xl font-bold text-green-600">{completionPercentage}%</div>
            <p className="text-xs text-gray-500">{stats.completed} of {stats.total} habits</p>
          </div>
          
          <div className="flex-1 bg-white p-3 rounded-lg shadow-sm">
            <p className="text-sm text-gray-600 mb-1">By Parent</p>
            <div className="flex justify-around text-center">
              <div>
                <p className="text-purple-600 font-medium">{stats.byParent.mama}</p>
                <p className="text-xs">Mama</p>
              </div>
              <div>
                <p className="text-blue-600 font-medium">{stats.byParent.papa}</p>
                <p className="text-xs">Papa</p>
              </div>
            </div>
          </div>
        </div>
        
        {stats.habitHelperCount > 0 && (
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <p className="text-sm font-medium mb-1">
              {stats.habitHelperCount} habits had children helping!
            </p>
            <div className="mt-2 text-xs text-gray-600">
              Children helping with habits improves family balance and teaches responsibility.
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold font-roboto">
              <span className="text-purple-600">Allie-Guided</span> Week {currentWeek} Family Meeting
            </h2>
            <div className="flex items-center text-gray-600 text-sm">
              <Clock size={16} className="mr-1" />
              <span className="font-roboto">10-15 minutes</span>
              <div className="ml-4 flex items-center">
                <MessageSquare size={16} className="mr-1 text-purple-600" />
                <span className="font-roboto text-purple-600">Interactive guidance</span>
              </div>
            </div>
          </div>
          
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"></path>
              <path d="M6 6L18 18"></path>
            </svg>
          </button>
        </div>
        
        {/* Progress indicator */}
        <div className="px-4 pt-2">
          <div className="flex items-center text-xs text-gray-500 mb-1">
            <span className="mr-2">Meeting progress:</span>
            <span className="text-purple-600 font-medium">
              {currentStage === 'completed' ? 'Complete!' : `${stages.indexOf(currentStage) + 1} of ${stages.length}`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-purple-600 h-1.5 rounded-full"
              style={{ 
                width: currentStage === 'completed' 
                  ? '100%' 
                  : `${((stages.indexOf(currentStage) + 1) / stages.length) * 100}%`
              }}
            ></div>
          </div>
        </div>
        
        {/* Chat messages */}
        <div className="p-4 space-y-4 mb-24">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`p-3 rounded-lg ${msg.sender === 'user' 
                  ? 'bg-purple-500 text-white max-w-[75%]' 
                  : 'bg-gray-100 text-gray-800 max-w-[85%]'
                }`}
              >
                <div className="whitespace-pre-line">{msg.content}</div>
                {msg.component && (
                  <div className="mt-2">
                    {msg.component}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Dummy div for scroll anchoring */}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Quick reply suggestions */}
        {suggestedResponses.length > 0 && currentStage !== 'completed' && (
          <div className="fixed bottom-20 left-0 right-0 px-4 py-2 flex flex-wrap justify-center gap-2 bg-white bg-opacity-95 border-t border-gray-200">
            {suggestedResponses.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleUserMessage(suggestion)}
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 text-sm rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        
        {/* Input area */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex items-center space-x-2">
          {currentStage === 'completed' ? (
            <div className="w-full flex space-x-2">
              <button
                onClick={handleDownloadSummary}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center"
              >
                <Download size={18} className="mr-2" />
                Download Summary
              </button>
              <button
                onClick={handleCompleteMeeting}
                disabled={isCompleting}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg flex items-center justify-center transition-all"
              >
                {isCompleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Completing Week {currentWeek}...
                  </>
                ) : (
                  <>
                    <Star size={18} className="mr-2" />
                    Complete Week {currentWeek}
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              <input
                type="text"
                value={userInput}
                onChange={handleUserInput}
                placeholder="Type your response..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="p-3 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors"
                disabled={loading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllieChatMeeting;