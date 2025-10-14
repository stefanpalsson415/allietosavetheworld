import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Calendar, CheckCircle, X, Clock, Sparkles, Star, 
  Users, ChevronRight, ChevronLeft, User, Save, 
  MessageSquare, Award, Download, CheckCheck, Info
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useSurvey } from '../../contexts/SurveyContext';
import AllieAIService from '../../services/AllieAIService';
import CalendarService from '../../services/CalendarService';
import { useAuth } from '../../contexts/AuthContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import confetti from 'canvas-confetti';
import DatabaseService from '../../services/DatabaseService';
import FamilyBalanceChart from './FamilyBalanceChart';




// Save indicator component for autosave functionality
const SaveIndicator = ({ saving, saved }) => (
  <div className="flex items-center text-xs animate-fade-in">
    {saving ? (
      <span className="text-blue-600 flex items-center">
        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
        Saving...
      </span>
    ) : saved ? (
      <span className="text-green-600 flex items-center">
        <CheckCircle size={12} className="mr-1" />
        Saved
      </span>
    ) : null}
  </div>
);

// Component to display previous week's goals and allow status updates
const PreviousGoalsReview = ({ goals, statusMap, onStatusChange }) => {
  // Status options for each goal
  const statusOptions = [
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'partial', label: 'Partially Done', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'not_completed', label: 'Not Completed', color: 'bg-red-100 text-red-800' }
  ];

  return (
    <div className="bg-indigo-50 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-bold mb-3 flex items-center">
        <Award size={20} className="mr-2 text-indigo-600" />
        Last Week's Goals Review
      </h3>
      <p className="text-sm text-indigo-700 mb-4">
        Let's review the goals you set last week. How did your family do with these?
      </p>
      
      <div className="space-y-4">
        {goals.map((goal, index) => (
          <div key={index} className="bg-white p-3 rounded-lg shadow-sm">
            <p className="font-medium mb-2">{goal}</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map(option => (
                <button
                  key={option.value}
                  className={`px-3 py-1 rounded-full text-xs ${
                    statusMap[goal] === option.value ? 
                    option.color + ' font-medium' : 
                    'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => onStatusChange(goal, option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-indigo-700">
        <p>Reviewing your goals helps track progress over time and improves your family's accountability.</p>
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
  
  // Get categories sorted by completion count
  const sortedCategories = Object.entries(stats.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3); // Top 3 categories
    
  return (
    <div className="bg-green-50 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-bold mb-3 flex items-center">
        <CheckCheck size={20} className="mr-2 text-green-600" />
        Habit Completion Summary
      </h3>
      
      <div className="flex flex-col sm:flex-row gap-4">
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
        <div className="mt-4 bg-white p-3 rounded-lg shadow-sm">
          <p className="text-sm font-medium mb-2">Habit Helper Stats</p>
          <p className="text-sm">{stats.habitHelperCount} habits had children helping this week!</p>
          
          <div className="mt-2 space-y-2">
            {stats.habitHelperList.map((habit, index) => (
              <div key={index} className={`p-2 rounded ${habit.completed ? 'bg-green-50' : 'bg-gray-50'}`}>
                <p className="text-sm font-medium">{habit.title}</p>
                <div className="flex text-xs mt-1">
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    {habit.assignedTo}
                  </span>
                  <span className="mx-1">•</span>
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                    Helpers: {habit.helpers.join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {sortedCategories.length > 0 && (
        <div className="mt-4 bg-white p-3 rounded-lg shadow-sm">
          <p className="text-sm font-medium mb-2">Top Categories</p>
          <div className="space-y-1">
            {sortedCategories.map(([category, count], index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{category}</span>
                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                  {count} completed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Confetti effect component for celebration moments
const Fireworks = () => {
  useEffect(() => {
    // Create confetti effect with various colors
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    
    const createConfetti = () => {
      for (let i = 0; i < 150; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        confetti.style.opacity = Math.random() + 0.5;
        document.getElementById('confetti-container').appendChild(confetti);
        
        // Remove after animation completes
        setTimeout(() => {
          confetti.remove();
        }, 3000);
      }
    };
    
    // Create confetti at regular intervals
    const interval = setInterval(createConfetti, 300);
    
    // Play celebration sound if available
    try {
      const audio = new Audio('/sounds/celebration.mp3');
      audio.volume = 0.6;
      audio.play().catch(e => console.log("Audio play failed:", e));
    } catch (e) {
      console.log("Audio not available");
    }
    
    // Cleanup
    return () => {
      clearInterval(interval);
      const container = document.getElementById('confetti-container');
      if (container) {
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
      }
    };
  }, []);
  
  return (
    <div 
      id="confetti-container" 
      className="fixed inset-0 pointer-events-none z-50"
      style={{ perspective: '700px' }}
    >
      <style jsx="true">{`
        .confetti {
          position: absolute;
          width: 10px;
          height: 10px;
          top: -10px;
          animation: confetti-fall 3s linear forwards;
        }
        
        @keyframes confetti-fall {
          0% {
            top: -10px;
            transform: translateZ(0) rotate(0deg);
          }
          100% {
            top: 100vh;
            transform: translateZ(400px) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
};


// Main component for the family meeting
const FamilyMeetingScreen = ({ onClose }) => {
  // Contexts
  const { 
    currentWeek, 
    saveFamilyMeetingNotes, 
    familyMembers, 
    surveyResponses,
    completedWeeks,
    completeWeek,
    familyId,
    weekHistory,
    habitRecommendations: taskRecommendations // Renamed to align with shift to habits
  } = useFamily();
  
  const { fullQuestionSet } = useSurvey();
  const { currentUser } = useAuth();

  // Screen state
  const [currentScreen, setCurrentScreen] = useState('intro'); // 'intro', 'meeting', or 'summary'
  
  // Meeting notes state
  const [meetingNotes, setMeetingNotes] = useState({
    wentWell: '',
    couldImprove: '',
    actionItems: '',
    nextWeekGoals: '',
    additionalNotes: '',
    kidsInput: '', // New field for kids section
    balanceReflection: '' // New field for balance reflection
  });
  
  // Current section for the meeting screen
  const [activeSection, setActiveSection] = useState('wentWell');
  
  // State for selected items from suggestions
  const [selectedActionItems, setSelectedActionItems] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  
  // State for previous week's goals tracking
  const [previousWeekGoals, setPreviousWeekGoals] = useState([]);
  const [previousGoalsStatus, setPreviousGoalsStatus] = useState({});
  const [showPreviousGoals, setShowPreviousGoals] = useState(false);
  const [habitCompletionStats, setHabitCompletionStats] = useState(null);
  
  // Operation states
  const [saving, setSaving] = useState(false);
  const [savedRecently, setSavedRecently] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [agenda, setAgenda] = useState(null);
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [loadingError, setLoadingError] = useState(null);
  const [isAddingToCalendar, setIsAddingToCalendar] = useState(false);
  
  // Refs
  const saveTimeoutRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);

  // Load meeting agenda and previous data
  useEffect(() => {
    if (!familyId || !currentWeek) return;
    
    const loadAgenda = async () => {
      try {
        setLoadingAgenda(true);
        setLoadingError(null);
        
        // Get AI generated meeting agenda
        const meetingAgenda = await AllieAIService.generateFamilyMeetingAgenda(
          familyId,
          currentWeek
        );
        
        setAgenda(meetingAgenda);
        setLoadingAgenda(false);
      } catch (error) {
        console.error("Error loading meeting agenda:", error);
        setLoadingError("Failed to load meeting agenda. Please try again.");
        setLoadingAgenda(false);
      }
    };
    
    const loadPreviousGoals = async () => {
      // Only load previous goals if we're past week 1
      if (currentWeek > 1) {
        try {
          const familyDoc = await DatabaseService.getDoc(`families/${familyId}`);
          if (familyDoc && familyDoc.weekGoals) {
            const prevWeekGoals = familyDoc.weekGoals[`week${currentWeek - 1}`] || [];
            if (prevWeekGoals.length > 0) {
              setPreviousWeekGoals(prevWeekGoals);
              setShowPreviousGoals(true);
              
              // Initialize status of each goal as 'pending'
              const initialStatus = {};
              prevWeekGoals.forEach(goal => {
                initialStatus[goal] = 'pending';
              });
              setPreviousGoalsStatus(initialStatus);
              
              console.log(`Loaded ${prevWeekGoals.length} goals from previous week`);
            }
          }
        } catch (error) {
          console.error("Error loading previous week goals:", error);
        }
      }
    };
    
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
    
    // Check for existing meeting notes to restore
    const checkExistingNotes = async () => {
      try {
        const existingNotes = await DatabaseService.getFamilyMeetingNotes(familyId, currentWeek);
        if (existingNotes) {
          // Restore notes
          setMeetingNotes(prev => ({
            ...prev,
            ...existingNotes
          }));
          
          // Restore selected items if they exist
          const actionItems = existingNotes.actionItems?.split('\n').filter(Boolean) || [];
          const goals = existingNotes.nextWeekGoals?.split('\n').filter(Boolean) || [];
          
          setSelectedActionItems(actionItems);
          setSelectedGoals(goals);
          
          // Restore previous goals status if available
          if (existingNotes.previousGoalsStatus) {
            setPreviousGoalsStatus(existingNotes.previousGoalsStatus);
          }
          
          console.log("Restored existing meeting notes");
        }
      } catch (error) {
        console.error("Error checking existing notes:", error);
      }
    };
    
    // Run all data loading functions
    loadAgenda();
    loadPreviousGoals();
    loadHabitCompletionStats();
    checkExistingNotes();
    
    // Setup autosave interval
    autoSaveIntervalRef.current = setInterval(() => {
      handleAutosave();
    }, 30000); // Autosave every 30 seconds
    
    return () => {
      // Clean up
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    };
  }, [familyId, currentWeek, taskRecommendations]);

  const generateAIInsights = useCallback(() => {
    // Analyze survey data to find insights based on actual data
    const insights = {
      successInsights: [],
      challengeInsights: [],
      actionInsights: []
    };
    
    try {
      console.log("Generating insights from habit data:", taskRecommendations);
      console.log("Week history:", weekHistory);
      
      // Check for habit completion patterns
      const completedHabits = taskRecommendations?.filter(t => t.completed) || [];
      const incompleteHabits = taskRecommendations?.filter(t => !t.completed) || [];
      
      if (completedHabits.length > 0) {
        // Success insights based on completed habits
        insights.successInsights.push(
          `${completedHabits.length} of ${taskRecommendations?.length || 0} habits completed this week`
        );
        
        // Check which parent completed more habits
        const mamaCompletedCount = completedHabits.filter(t => t.assignedTo === 'Mama').length;
        const papaCompletedCount = completedHabits.filter(t => t.assignedTo === 'Papa').length;
        
        if (mamaCompletedCount > papaCompletedCount) {
          insights.successInsights.push(`Mama completed ${mamaCompletedCount} habits this week`);
        } else if (papaCompletedCount > mamaCompletedCount) {
          insights.successInsights.push(`Papa completed ${papaCompletedCount} habits this week`);
        } else if (mamaCompletedCount > 0) {
          insights.successInsights.push(`Both parents completed an equal number of habits`);
        }
      }
      
      // Analyze balance changes from survey data - prioritize weighted scores
      if (weekHistory && Object.keys(weekHistory).length > 1) {
        // Get last two weeks of data to compare
        const weeks = Object.keys(weekHistory)
          .filter(key => key.startsWith('week'))
          .map(key => parseInt(key.replace('week', '')))
          .sort((a, b) => b - a); // Sort descending
        
        if (weeks.length >= 2) {
          const currentWeekData = weekHistory[`week${weeks[0]}`];
          const prevWeekData = weekHistory[`week${weeks[1]}`];
          
          // GET BALANCE DATA - PRIORITIZE WEIGHTED SCORES
          let currentBalance, prevBalance;
          
          // For current week - check sources in priority order
          if (currentWeekData?.weightedScores?.overallBalance) {
            console.log("Using weighted scores for current week balance");
            currentBalance = currentWeekData.weightedScores.overallBalance;
          } else if (currentWeekData?.balance) {
            console.log("Using standard balance for current week");
            currentBalance = currentWeekData.balance;
          } else if (currentWeekData?.surveyResponses) {
            console.log("Calculating balance from survey responses for current week");
            // Calculate from responses if needed - use a more accurate method
            const responseCount = Object.keys(currentWeekData.surveyResponses).length;
            let mamaCount = 0;
            
            Object.values(currentWeekData.surveyResponses).forEach(val => {
              if (String(val).toLowerCase().includes('mama') || 
                  String(val).toLowerCase().includes('mom')) {
                mamaCount++;
              }
            });
            
            currentBalance = {
              mama: responseCount > 0 ? (mamaCount / responseCount) * 100 : 50,
              papa: responseCount > 0 ? ((responseCount - mamaCount) / responseCount) * 100 : 50
            };
          } else {
            console.log("No balance data for current week, using default 50/50");
            currentBalance = { mama: 50, papa: 50 };
          }
          
          // For previous week - similar logic with priority order
          if (prevWeekData?.weightedScores?.overallBalance) {
            console.log("Using weighted scores for previous week balance");
            prevBalance = prevWeekData.weightedScores.overallBalance;
          } else if (prevWeekData?.balance) {
            console.log("Using standard balance for previous week");
            prevBalance = prevWeekData.balance;
          } else if (prevWeekData?.surveyResponses) {
            console.log("Calculating balance from survey responses for previous week");
            // Calculate from responses if needed
            const responseCount = Object.keys(prevWeekData.surveyResponses).length;
            let mamaCount = 0;
            
            Object.values(prevWeekData.surveyResponses).forEach(val => {
              if (String(val).toLowerCase().includes('mama') || 
                  String(val).toLowerCase().includes('mom')) {
                mamaCount++;
              }
            });
            
            prevBalance = {
              mama: responseCount > 0 ? (mamaCount / responseCount) * 100 : 50,
              papa: responseCount > 0 ? ((responseCount - mamaCount) / responseCount) * 100 : 50
            };
          } else {
            console.log("No balance data for previous week, using default 50/50");
            prevBalance = { mama: 50, papa: 50 };
          }
          
          console.log("Balance comparison data:", {
            current: currentBalance,
            previous: prevBalance
          });
          
          // Calculate imbalance changes
          const currentImbalance = Math.abs(currentBalance.mama - 50);
          const prevImbalance = Math.abs(prevBalance.mama - 50);
          const imbalanceChange = Math.abs(currentImbalance - prevImbalance).toFixed(1);
          
          if (currentImbalance < prevImbalance && Math.abs(currentImbalance - prevImbalance) >= 2) {
            insights.successInsights.push(
              `Family balance improved by ${imbalanceChange}% since last week`
            );
          } else if (currentImbalance > prevImbalance && Math.abs(currentImbalance - prevImbalance) >= 2) {
            insights.challengeInsights.push(
              `Balance decreased by ${imbalanceChange}% since last week`
            );
          } else {
            insights.successInsights.push(
              `Your family's balance has remained stable this week`
            );
          }
        }
      }
      
      // Get current balance from weighted scores or calculate it
      let currentBalanceData;
      
      // Try to get weighted scores first (most accurate)
      if (weekHistory?.[`week${currentWeek}`]?.weightedScores?.categoryBalance) {
        console.log("Using category weighted scores for insights");
        currentBalanceData = weekHistory[`week${currentWeek}`].weightedScores.categoryBalance;
        
        // Find most imbalanced category
        let mostImbalancedCategory = null;
        let highestImbalance = 0;
        
        Object.entries(currentBalanceData).forEach(([category, data]) => {
          if (data.imbalance > highestImbalance) {
            highestImbalance = data.imbalance;
            mostImbalancedCategory = {
              name: category,
              imbalance: data.imbalance,
              mamaPercent: data.mama,
              papaPercent: data.papa,
              questionCount: data.questionCount || 0
            };
          }
        });
        
        if (mostImbalancedCategory && mostImbalancedCategory.imbalance > 20) {
          const dominantParent = mostImbalancedCategory.mamaPercent > mostImbalancedCategory.papaPercent ? 'Mama' : 'Papa';
          const dominantPercent = dominantParent === 'Mama' ? 
            Math.round(mostImbalancedCategory.mamaPercent) : 
            Math.round(mostImbalancedCategory.papaPercent);
          
          insights.challengeInsights.push(
            `${mostImbalancedCategory.name} shows a ${Math.round(mostImbalancedCategory.imbalance)}% imbalance with ${dominantParent} handling ${dominantPercent}% of habits`
          );
        }
      } else {
        // Fall back to analyzing raw survey responses
        console.log("Falling back to raw survey analysis for balance insights");
        const surveyResponses = Object.entries(weekHistory?.initial?.surveyResponses || {})
          .concat(Object.entries(weekHistory?.[`week${currentWeek}`]?.surveyResponses || {}));
        
        if (surveyResponses.length > 0) {
          // Count Mama vs Papa responses
          let mamaCount = 0;
          let totalCount = 0;
          
          surveyResponses.forEach(([_, value]) => {
            const valueStr = String(value || '').toLowerCase();
            if (valueStr === 'mama' || valueStr === 'papa' || 
                valueStr.includes('mama') || valueStr.includes('papa') ||
                valueStr.includes('mom') || valueStr.includes('dad')) {
              totalCount++;
              if (valueStr === 'mama' || valueStr.includes('mama') || valueStr.includes('mom')) {
                mamaCount++;
              }
            }
          });
          
          if (totalCount > 0) {
            const mamaPercent = Math.round((mamaCount / totalCount) * 100);
            const papaPercent = 100 - mamaPercent;
            const imbalance = Math.abs(mamaPercent - 50);
            
            if (imbalance > 20) {
              const dominantParent = mamaPercent > 50 ? 'Mama' : 'Papa';
              insights.challengeInsights.push(
                `Survey responses show ${dominantParent} is handling ${dominantParent === 'Mama' ? mamaPercent : papaPercent}% of habits`
              );
            } else {
              insights.successInsights.push(
                `Your family has achieved a good balance with only ${imbalance}% difference between parents`
              );
            }
          }
        }
      }
      
      // Analyze incomplete habits for challenges
      if (incompleteHabits.length > 0) {
        const categories = incompleteHabits.map(t => t.category || 'Other');
        const categoryCounts = {};
        
        categories.forEach(cat => {
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        
        // Find most challenging category
        const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
        if (sortedCategories.length > 0) {
          insights.challengeInsights.push(
            `${sortedCategories[0][0]} has the most incomplete habits (${sortedCategories[0][1]})`
          );
        }
      }
      
      // Generate action insights based on our analysis
      if (insights.challengeInsights.length > 0) {
        // Create actions based on challenges
        insights.actionInsights.push(
          "Focus on better sharing of habits in the most imbalanced category"
        );
        
        // Add specific action based on the top challenge
        const topChallenge = insights.challengeInsights[0].toLowerCase();
        
        if (topChallenge.includes('balance decreased')) {
          insights.actionInsights.push(
            "Schedule a midweek check-in to adjust workload sharing before issues grow"
          );
        } else if (topChallenge.includes('incomplete habits')) {
          insights.actionInsights.push(
            "Break down complex habits into smaller steps for easier completion"
          );
        } else if (topChallenge.includes('handling')) {
          const overloadedParent = topChallenge.includes('mama') ? 'Mama' : 'Papa';
          const otherParent = overloadedParent === 'Mama' ? 'Papa' : 'Mama';
          insights.actionInsights.push(
            `Have ${otherParent} take over two habits normally handled by ${overloadedParent} this week`
          );
        }
      }
      
      // Ensure we have at least one insight in each category
      if (insights.successInsights.length === 0) {
        insights.successInsights.push("Taking time for family meetings is a success in itself");
      }
      if (insights.challengeInsights.length === 0) {
        insights.challengeInsights.push("Consider identifying one area where balance could be improved");
      }
      if (insights.actionInsights.length === 0) {
        insights.actionInsights.push(
          "Continue building positive habits for better family balance",
          "Try weekly check-ins to discuss habit distribution"
        );
      }
      
    } catch (error) {
      console.error("Error generating insights:", error);
      // Provide fallback insights
      insights.successInsights = [
        "Completing family meetings consistently is a success",
        "Every discussion about balance is a step toward improvement",
        "Acknowledging both parents' contributions builds mutual appreciation"
      ];
      insights.challengeInsights = [
        "Improving balance requires consistent effort",
        "Building new habits takes time and patience",
        "Communication about workload is often challenging but worthwhile"
      ];
      insights.actionInsights = [
        "Set specific goals for the coming week",
        "Choose one imbalanced area to focus on improving",
        "Create a shared system for tracking household responsibilities"
      ];
    }
    
    return insights;
  }, [weekHistory, taskRecommendations, currentWeek]);

  // Generate suggested action items based on family data
  // NEW CODE
const getSuggestedActionItems = useCallback(() => {
  const insights = generateAIInsights();
  
  // Create a Set to prevent duplicates
  const actionItemsSet = new Set();
  
  // Add insight-based actions
  insights.actionInsights.forEach(insight => {
    actionItemsSet.add(insight);
  });
  
  // Add habit-based actions
  const incompleteHabits = taskRecommendations?.filter(t => !t.completed) || [];
  incompleteHabits.slice(0, 2).forEach(habit => {
    // Clean habit title to remove week prefix
    const cleanTitle = habit.title.replace(/Week \d+: /g, '');
    actionItemsSet.add(`Complete "${cleanTitle}" together as a family`);
  });
  
  // Add some standard action items if we don't have enough
  if (actionItemsSet.size < 5) {
    const standardItems = [
      "Schedule a weekly 15-minute planning session",
      "Create a shared digital calendar for all family activities",
      "Implement a 15-minute daily cleanup where everyone participates",
      "Set up a meal planning session with both parents involved",
      "Review the family calendar together every Sunday evening"
    ];
    
    // Add standard items until we have 5
    for (let i = 0; i < standardItems.length && actionItemsSet.size < 5; i++) {
      actionItemsSet.add(standardItems[i]);
    }
  }
  
  // Convert back to array and return
  return Array.from(actionItemsSet);
}, [taskRecommendations, generateAIInsights]);

  // Generate suggested goals based on family data
  const getSuggestedGoals = useCallback(() => {
    // Analyze survey data to create personalized goals
    const goals = [];
    
    // Try to extract imbalanced categories from survey data
    try {
      if (surveyResponses) {
        // Count responses by category
        const categories = {
          "Visible Household Tasks": { mama: 0, papa: 0, total: 0 },
          "Invisible Household Tasks": { mama: 0, papa: 0, total: 0 },
          "Visible Parental Tasks": { mama: 0, papa: 0, total: 0 },
          "Invisible Parental Tasks": { mama: 0, papa: 0, total: 0 }
        };
        
        // Analyze survey responses to determine balance by category
        Object.entries(surveyResponses).forEach(([key, value]) => {
          if (value !== 'Mama' && value !== 'Papa') return;
          
          // Find question category from fullQuestionSet if possible
          const questionId = key.includes('-') ? key.split('-').pop() : key;
          const question = fullQuestionSet.find(q => q.id === questionId);
          
          if (question && categories[question.category]) {
            categories[question.category].total++;
            if (value === 'Mama') {
              categories[question.category].mama++;
            }
          }
        });
        
        // Calculate imbalance for each category
        const imbalances = [];
        Object.entries(categories).forEach(([category, counts]) => {
          if (counts.total > 0) {
            const mamaPercent = Math.round((counts.mama / counts.total) * 100);
            const papaPercent = 100 - mamaPercent;
            const imbalance = Math.abs(mamaPercent - 50);
            
            imbalances.push({
              category,
              mamaPercent,
              papaPercent,
              imbalance,
              dominant: mamaPercent > 50 ? 'Mama' : 'Papa'
            });
          }
        });
        
        // Sort by imbalance (highest first)
        imbalances.sort((a, b) => b.imbalance - a.imbalance);
        
        // Create goals based on imbalances
        if (imbalances.length > 0) {
          const topImbalance = imbalances[0];
          
          if (topImbalance.imbalance > 20) {
            const lessDoingParent = topImbalance.dominant === 'Mama' ? 'Papa' : 'Mama';
            
            goals.push(
              `Reduce ${topImbalance.dominant}'s ${topImbalance.category} workload by 10% this week`,
              `Have ${lessDoingParent} take the lead on 2 ${topImbalance.category.toLowerCase()} this week`
            );
          }
        }
      }
    } catch (error) {
      console.error("Error analyzing survey data for goals:", error);
    }
    
    // Add goals based on habits if available
    if (taskRecommendations && taskRecommendations.length > 0) {
      goals.push(`Complete at least ${Math.ceil(taskRecommendations.length * 0.8)} habits this week`);
    }
    
    // Add some standard goals if we don't have enough
    if (goals.length < 5) {
      const standardGoals = [
        "Have one parent take a full day off from household responsibilities",
        "Create a rotating schedule for managing household finances",
        "Complete morning routines without reminders from either parent",
        "Make sure both parents attend at least one school function",
        "Have Papa handle emotional support for at least one child crisis",
        "Have Mama take a break from planning activities for one full day"
      ];
      
      // Add standard goals until we have 5
      for (let i = 0; i < standardGoals.length && goals.length < 5; i++) {
        if (!goals.includes(standardGoals[i])) {
          goals.push(standardGoals[i]);
        }
      }
    }
    
    return goals;
  }, [surveyResponses, fullQuestionSet, taskRecommendations]);

  // Handle input changes
  const handleInputChange = (section, value) => {
    setMeetingNotes(prev => ({
      ...prev,
      [section]: value
    }));
    
    // Schedule autosave
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(() => {
      handleAutosave();
    }, 2000); // Debounce for 2 seconds
  };
  
  // Handle autosave
  const handleAutosave = useCallback(async () => {
    if (!familyId || !currentWeek) return;
    
    try {
      setSaving(true);
      
      // Combine selected and custom action items and goals
      const formattedNotes = {
        ...meetingNotes,
        actionItems: [...selectedActionItems, meetingNotes.actionItems].filter(Boolean).join('\n'),
        nextWeekGoals: [...selectedGoals, meetingNotes.nextWeekGoals].filter(Boolean).join('\n'),
        // Include previous goals status if relevant
        ...(showPreviousGoals ? { previousGoalsStatus } : {})
      };
      
      await saveFamilyMeetingNotes(currentWeek, formattedNotes);
      
      setSaving(false);
      setSavedRecently(true);
      
      // Reset saved indicator after 3 seconds
      setTimeout(() => {
        setSavedRecently(false);
      }, 3000);
    } catch (error) {
      console.error("Error autosaving meeting notes:", error);
      setSaving(false);
    }
  }, [
    familyId, 
    currentWeek, 
    meetingNotes, 
    selectedActionItems, 
    selectedGoals, 
    showPreviousGoals, 
    previousGoalsStatus, 
    saveFamilyMeetingNotes
  ]);

  // Manual save
  const handleSave = async () => {
    await handleAutosave();
  };
  
  // Navigation between sections
  const navigateToSection = (section) => {
    // Save current state first
    handleAutosave();
    
    // Then navigate
    setActiveSection(section);
    
    // Scroll to top
    window.scrollTo(0, 0);
  };
  
  // Validate meeting data before proceeding
  const validateMeetingData = () => {
    // Check that required sections have data
    const hasWentWellData = !!meetingNotes.wentWell?.trim();
    const hasCouldImproveData = !!meetingNotes.couldImprove?.trim();
    
    // Check that at least one action item is selected or custom action items are added
    const hasActionItems = selectedActionItems.length > 0 || !!meetingNotes.actionItems?.trim();
    
    // Check that at least one goal is selected or custom goals are added
    const hasGoals = selectedGoals.length > 0 || !!meetingNotes.nextWeekGoals?.trim();
    
    // Return validation result with specific messages
    if (!hasWentWellData) {
      return { isValid: false, message: "Please add notes about what went well before proceeding." };
    } else if (!hasCouldImproveData) {
      return { isValid: false, message: "Please add notes about what could improve before proceeding." };
    } else if (!hasActionItems) {
      return { isValid: false, message: "Please select or add at least one action item before proceeding." };
    } else if (!hasGoals) {
      return { isValid: false, message: "Please select or add at least one goal for next week before proceeding." };
    }
    
    return { isValid: true };
  };
  
  // Navigate to next screen
  const goToNextScreen = () => {
    handleAutosave(); // Save first
    
    if (currentScreen === 'intro') {
      setCurrentScreen('meeting');
    } else if (currentScreen === 'meeting') {
      // Validate data before going to summary
      const validation = validateMeetingData();
      
      if (!validation.isValid) {
        // Show validation message
        alert(validation.message);
        return;
      }
      
      setCurrentScreen('summary');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
  };
  
  // Navigate to previous screen
  const goToPreviousScreen = () => {
    handleAutosave(); // Save first
    
    if (currentScreen === 'summary') {
      setCurrentScreen('meeting');
    } else if (currentScreen === 'meeting') {
      setCurrentScreen('intro');
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
  };
  
  // Add meeting to calendar
  const addMeetingToCalendar = async () => {
    try {
      setIsAddingToCalendar(true);
      
      // Create a meeting date (default to next week, same day)
      const meetingDate = new Date();
      meetingDate.setDate(meetingDate.getDate() + 7); // One week later
      meetingDate.setHours(19, 0, 0, 0); // 7 PM
      
      // Get all family member IDs for attendees to ensure everyone is included
      const allFamilyMemberIds = familyMembers.map(member => member.id);
      
      // Use CalendarService to add the event
      const result = await CalendarService.addEvent(
        {
          title: `Family Meeting - Cycle ${currentWeek + 1}`,
          summary: `Family Meeting - Cycle ${currentWeek + 1}`,
          description: 'Weekly family meeting to discuss habit balance and set goals for the coming week.',
          start: {
            dateTime: meetingDate.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          end: {
            dateTime: new Date(meetingDate.getTime() + 30 * 60 * 1000).toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
          },
          // IMPORTANT: Ensure these are correctly set for family meetings
          category: 'meeting',
          eventType: 'meeting',
          isFamilyMeeting: true,  // Add a flag to identify family meetings
          linkedEntity: {
            type: 'meeting',
            id: currentWeek + 1
          },
          // Add all family members as attendees (include IDs directly to ensure proper selection)
          attendees: allFamilyMemberIds,
          // Also include the detailed attendee objects for rendering
          attendeeDetails: familyMembers.map(member => ({
            id: member.id,
            name: member.name,
            profilePicture: member.profilePicture,
            role: member.role
          })),
          attendingParentId: 'both',
          universalId: `family-meeting-${familyId}-${currentWeek + 1}`
        },
        currentUser.uid
      );
      
      setIsAddingToCalendar(false);
      
      if (result.success) {
        alert("Next family meeting added to your calendar!");
      } else {
        alert("Couldn't add to calendar. Please try again.");
      }
    } catch (error) {
      console.error("Error adding meeting to calendar:", error);
      alert("There was an error adding the meeting to your calendar.");
      setIsAddingToCalendar(false);
    }
  };
  
  // Add selected action items to the Kanban board
  const addActionsToKanban = async () => {
    try {
      // Check if we have any action items
      const allActionItems = [...selectedActionItems];
      if (meetingNotes.actionItems?.trim()) {
        // Split custom action items by line breaks if multiple
        const customItems = meetingNotes.actionItems.trim().split('\n').filter(Boolean);
        allActionItems.push(...customItems);
      }
      
      // Skip if no action items
      if (allActionItems.length === 0) {
        console.log("No action items to add to Kanban");
        return true;
      }

      // Get current date and format it
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString();
      
      // Use robust method to get kanban reference
      try {
        // First, try using the direct kanban collection
        const { collection, addDoc } = await import('firebase/firestore');
        const { db } = await import('../../services/firebase');
        
        const kanbanCollection = collection(db, `families/${familyId}/kanban`);
        
        // Add each action item to the Kanban board
        const actionPromises = allActionItems.map(async (actionItem) => {
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
        console.log(`Added ${allActionItems.length} action items to Kanban board`);
        
        return true;
      } catch (firestoreError) {
        console.warn("Error using Firestore for Kanban, trying DatabaseService:", firestoreError);
        
        // Fall back to database service if it has the right methods
        if (typeof DatabaseService.addKanbanCard === 'function') {
          // Use DatabaseService method as backup
          const actionPromises = allActionItems.map(async (actionItem) => {
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
          console.log(`Added ${allActionItems.length} action items to Kanban board using DatabaseService`);
          
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
    if (!showPreviousGoals || previousWeekGoals.length === 0) {
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
        for (const [goal, status] of Object.entries(previousGoalsStatus)) {
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
          for (const [goal, status] of Object.entries(previousGoalsStatus)) {
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
  
  // Complete family meeting and cycle
  const handleCompleteMeeting = async () => {
    // Save one last time
    await handleAutosave();
    
    setIsCompleting(true);
    
    try {
      console.log(`Starting to complete Week ${currentWeek}`);
      
      // First, update previous goals status in Kanban
      if (showPreviousGoals && previousWeekGoals.length > 0) {
        const updateResult = await updatePreviousGoalsInKanban();
        if (updateResult) {
          console.log("Successfully updated previous week goals in Kanban board");
        }
      }
      
      // Add selected action items to the Kanban board
      const kanbanResult = await addActionsToKanban();
      if (kanbanResult) {
        console.log("Successfully added action items to Kanban board");
      }
      
      // Store goals for tracking in the next meeting
      const allGoals = [...selectedGoals];
      if (meetingNotes.nextWeekGoals?.trim()) {
        const customGoals = meetingNotes.nextWeekGoals.trim().split('\n').filter(Boolean);
        allGoals.push(...customGoals);
      }
      
      if (allGoals.length > 0) {
        // Store goals in the family document for next week's meeting
        await DatabaseService.updateDoc(`families/${familyId}`, {
          [`weekGoals.week${currentWeek + 1}`]: allGoals,
          [`lastUpdated`]: new Date().toISOString()
        });
        console.log(`Stored ${allGoals.length} goals for week ${currentWeek + 1}`);
      }
      
      // Complete the week - this should:
      // 1. Mark the week as completed
      // 2. Create a historical record
      // 3. Advance to the next week
      const result = await completeWeek(currentWeek);
      
      console.log(`Week ${currentWeek} completed successfully:`, result);
      console.log(`Moving to Week ${currentWeek + 1}`);
      
      // Show celebration animation
      setShowCelebration(true);
      
      // Close dialog after celebration (5 seconds)
      setTimeout(() => {
        console.log("Closing meeting dialog after completion");
        onClose();
      }, 5000);
    } catch (error) {
      console.error("Error completing week:", error);
      alert("There was an error completing the week. Please try again.");
      setIsCompleting(false);
    }
  };
  
  // Handle downloadable summary
  const handleDownloadSummary = () => {
    try {
      // Create a text summary of the meeting
      let summary = `# Family Meeting Summary - Week ${currentWeek}\n\n`;
      summary += `Date: ${new Date().toLocaleDateString()}\n\n`;
      
      summary += `## What Went Well\n${meetingNotes.wentWell || "No notes"}\n\n`;
      summary += `## What Could Improve\n${meetingNotes.couldImprove || "No notes"}\n\n`;
      
      summary += "## Action Items\n";
      const actionItems = [...selectedActionItems];
      if (meetingNotes.actionItems) actionItems.push(meetingNotes.actionItems);
      actionItems.forEach(item => {
        summary += `- ${item}\n`;
      });
      summary += "\n";
      
      summary += "## Next Week's Goals\n";
      const goals = [...selectedGoals];
      if (meetingNotes.nextWeekGoals) goals.push(meetingNotes.nextWeekGoals);
      goals.forEach(goal => {
        summary += `- ${goal}\n`;
      });
      summary += "\n";
      
      if (meetingNotes.kidsInput) {
        summary += `## Kids' Corner\n${meetingNotes.kidsInput}\n\n`;
      }
      
      if (meetingNotes.additionalNotes) {
        summary += `## Additional Notes\n${meetingNotes.additionalNotes}\n\n`;
      }
      
      // Create a blob and download it
      const blob = new Blob([summary], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Family-Meeting-Week-${currentWeek}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Show feedback
      alert("Summary downloaded successfully!");
    } catch (error) {
      console.error("Error downloading summary:", error);
      alert("There was an error downloading the summary.");
    }
  };

  // Launch confetti effect
  const launchConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };
  
  // The UI will render different screens based on the currentScreen state
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header - consistent across screens */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl font-bold font-roboto">Week {currentWeek} Family Meeting</h2>
            <div className="flex items-center text-gray-600 text-sm">
              <Clock size={16} className="mr-1" />
              <span className="font-roboto">30 minutes</span>
              <div className="ml-4">
                <SaveIndicator saving={saving} saved={savedRecently} />
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm flex items-center"
              title="Save your progress"
            >
              <Save size={16} className="mr-1" />
              Save
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Content area - changes based on current screen */}
        {currentScreen === 'intro' && (
  /* Introduction Screen */
  <div className="p-6 space-y-6">
    <div className="text-center mb-8">
      <h2 className="text-2xl font-bold mb-2">Welcome to Your Family Meeting</h2>
      <p className="text-gray-600 text-sm max-w-lg mx-auto">
        This meeting will help your family celebrate wins, address challenges, 
        and plan improvements for better balance in the upcoming week.
      </p>
    </div>
    
    {loadingAgenda ? (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    ) : loadingError ? (
      <div className="bg-red-50 p-4 rounded-lg text-red-700 text-center">
        {loadingError}
        <button 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 block mx-auto"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    ) : (
      <>
        {/* AI-Generated Agenda Preview */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-sm">
          <div className="flex items-start mb-4">
            <div className="bg-blue-500 p-2 rounded-lg mr-3">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-800">AI-Generated Meeting Agenda</h3>
              <p className="text-sm text-blue-600">
                Based on your family's survey data and habit history, we've created a personalized meeting agenda.
              </p>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            {agenda?.sections?.map((section, index) => (
              <div key={index} className="bg-white rounded p-3 shadow-sm">
                <h4 className="font-medium mb-1">{section.title}</h4>
                <p className="text-sm text-gray-600">{section.description || ""}</p>
              </div>
            ))}
            
            {!agenda?.sections && (
              <div className="bg-white p-4 rounded-lg">
                <p className="text-center text-gray-600">Your agenda is still being prepared.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Balance Chart */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-3">Your Family Balance Journey</h3>
          <FamilyBalanceChart 
            weekHistory={weekHistory}
            completedWeeks={completedWeeks}
          />
          <p className="text-sm text-gray-500 mt-2">
            This chart shows your progress toward a balanced workload in your family.
          </p>
        </div>
        
        {/* Sprint Retrospective Explanation */}
        <div className="border p-4 rounded-lg mt-6">
          <h3 className="font-bold mb-2">About Sprint Retrospectives</h3>
          <p className="text-sm text-gray-600 mb-3">
            We use a "sprint retrospective" format that professional teams use to improve how they work together.
            This simple structure helps families reflect on what's working and what needs improvement.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">✓ What Went Well</span>
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded">⚠ What Could Improve</span>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">→ Action Items</span>
          </div>
        </div>
      </>
    )}
    
    {/* Navigation Buttons with Meeting Type Selection */}
    <div className="flex flex-col pt-6 space-y-4">
      <h3 className="text-lg font-medium text-center mb-2">How would you like to run this meeting?</h3>
      
      <button
        onClick={goToNextScreen}
        disabled={loadingAgenda}
        className="w-full flex items-center justify-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"
      >
        <Users size={20} className="mr-2" />
        Start Structured Meeting
        <ChevronRight size={18} className="ml-2" />
      </button>
      
      <button
  onClick={() => {
    // Close this meeting modal
    onClose();
    
    // Option 1: Dispatch the open-allie-chat event (works with AllieChat widget)
    window.dispatchEvent(new CustomEvent('open-allie-chat', { 
      detail: { 
        message: "Hi Allie, can you guide me through our family meeting for Week " + currentWeek + "? We want to discuss our family balance, celebrate wins, and plan improvements."
      }
    }));
    
    // Option 2: Set state in parent component to show AllieChatMeeting
    // Uncomment the next line if you're directly controlling the AllieChatMeeting component from the parent
    // onOpenAllieMeeting && onOpenAllieMeeting();
  }}
  disabled={loadingAgenda}
  className="w-full flex items-center justify-center bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-70"
>
  <MessageSquare size={20} className="mr-2" />
  Let Allie Guide Your Meeting
</button>
    </div>
  </div>
)}        
        {currentScreen === 'meeting' && (
          /* Interactive Meeting Screen */
          <div className="p-6">
            {/* Progress Tabs */}
            <div className="flex border-b mb-6">
              <button
                onClick={() => navigateToSection('wentWell')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeSection === 'wentWell' 
                    ? 'border-green-500 text-green-600' 
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                What Went Well
              </button>
              <button
                onClick={() => navigateToSection('couldImprove')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeSection === 'couldImprove' 
                    ? 'border-amber-500 text-amber-600' 
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                What Could Improve
              </button>
              <button
                onClick={() => navigateToSection('actionItems')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeSection === 'actionItems' 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                Action Items
              </button>
              <button
                onClick={() => navigateToSection('kidsCorner')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeSection === 'kidsCorner' 
                    ? 'border-purple-500 text-purple-600' 
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                Kids' Corner
              </button>
              <button
                onClick={() => navigateToSection('nextWeekGoals')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeSection === 'nextWeekGoals' 
                    ? 'border-indigo-500 text-indigo-600' 
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                Next Week's Goals
              </button>
            </div>
            
            {/* Active Section Content */}
            {activeSection === 'wentWell' && (
              <div className="p-4 border rounded-lg bg-green-50">
                <h4 className="font-medium mb-2 flex items-center text-green-800 font-roboto">
                  <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mr-2 text-green-600">✓</span>
                  What Went Well
                </h4>
                <p className="text-sm text-green-700 mb-3 font-roboto">
                  Celebrate your family's wins this week! What are you proud of? What balanced habits did you accomplish?
                </p>
                
                {/* Habit Completion Summary */}
                {habitCompletionStats && <HabitCompletionSummary stats={habitCompletionStats} />}
                
                {/* Previous Week Goals Review */}
                {showPreviousGoals && previousWeekGoals.length > 0 && (
                  <PreviousGoalsReview 
                    goals={previousWeekGoals} 
                    statusMap={previousGoalsStatus} 
                    onStatusChange={(goal, status) => {
                      setPreviousGoalsStatus(prev => ({
                        ...prev,
                        [goal]: status
                      }));
                      // Trigger autosave after updating goal status
                      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                      saveTimeoutRef.current = setTimeout(() => {
                        handleAutosave();
                      }, 1000);
                    }}
                  />
                )}
                
                {/* AI Suggested Discussion Points */}
                <div className="mb-4 p-3 bg-white rounded-lg border border-green-200">
                  <h5 className="text-sm font-medium text-green-800 mb-2">Discussion Points:</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {(() => {
                      // First try to get items from the agenda
                      const agendaItems = agenda?.sections?.find(s => s.title?.includes("Went Well"))?.items;
                      
                      // If we have agenda items, use those
                      if (agendaItems && agendaItems.length > 0) {
                        return agendaItems.map((item, i) => (
                          <li key={i} className="text-sm">{item}</li>
                        ));
                      }
                      
                      // Otherwise, generate insights
                      const insights = generateAIInsights().successInsights;
                      
                      // If we have insights, use those
                      if (insights && insights.length > 0) {
                        return insights.map((insight, i) => (
                          <li key={i} className="text-sm">{insight}</li>
                        ));
                      }
                      
                      // If all else fails, provide default discussion points
                      return [
                        "Discuss habits that were completed successfully this week",
                        "Share a moment when you felt family workload was well-balanced", 
                        "Talk about how habit helpers contributed to your family balance",
                        "Acknowledge specific positive contributions from each family member"
                      ].map((fallback, i) => (
                        <li key={i} className="text-sm">{fallback}</li>
                      ));
                    })()}
                  </ul>
                </div>
                
                <textarea
                  placeholder="Share your family's successes this week..."
                  className="w-full p-3 border border-green-200 rounded-md h-32 bg-white font-roboto"
                  value={meetingNotes.wentWell || ''}
                  onChange={(e) => handleInputChange('wentWell', e.target.value)}
                />
                
                {/* Navigation Buttons */}
                <div className="flex justify-between mt-4">
                  <div></div> {/* Empty div for spacing */}
                  <button
                    onClick={() => navigateToSection('couldImprove')}
                    className="flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-black"
                  >
                    Next Section
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            )}
            
            {activeSection === 'couldImprove' && (
              <div className="p-4 border rounded-lg bg-amber-50">
                <h4 className="font-medium mb-2 flex items-center text-amber-800 font-roboto">
                  <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center mr-2 text-amber-600">⚠</span>
                  What Could Improve
                </h4>
                <p className="text-sm text-amber-700 mb-3 font-roboto">
                  What challenges did your family face? Where do you see room for better balance?
                </p>
                
                {/* AI Suggested Discussion Points */}
                <div className="mb-4 p-3 bg-white rounded-lg border border-amber-200">
                  <h5 className="text-sm font-medium text-amber-800 mb-2">Discussion Points:</h5>
                  <ul className="list-disc pl-5 space-y-1">
                    {agenda?.sections?.find(s => s.title?.includes("Improve") || s.title?.includes("Challenge"))?.items?.map((item, i) => (
                      <li key={i} className="text-sm">{item}</li>
                    )) || generateAIInsights().challengeInsights.map((insight, i) => (
                      <li key={i} className="text-sm">{insight}</li>
                    ))}
                  </ul>
                </div>
                
                <textarea
                  placeholder="Discuss areas where your family could improve next week..."
                  className="w-full p-3 border border-amber-200 rounded-md h-32 bg-white font-roboto"
                  value={meetingNotes.couldImprove || ''}
                  onChange={(e) => handleInputChange('couldImprove', e.target.value)}
                />
                
                {/* Navigation Buttons */}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => navigateToSection('wentWell')}
                    className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => navigateToSection('actionItems')}
                    className="flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-black"
                  >
                    Next Section
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            )}
            
            {activeSection === 'actionItems' && (
              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="font-medium mb-2 flex items-center text-blue-800 font-roboto">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 text-blue-600">→</span>
                  Action Items
                </h4>
                <p className="text-sm text-blue-700 mb-3 font-roboto">
                  What specific habit changes will your family commit to next week? Who will do what?
                </p>
                
                {/* Suggested Action Items */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium mb-2 font-roboto">Suggested Action Items (Select up to 3):</h5>
                  <div className="space-y-2">
                    {getSuggestedActionItems().map((item, index) => (
                      <div 
                        key={index}
                        className={`p-2 rounded border cursor-pointer ${
                          selectedActionItems.includes(item) 
                            ? 'bg-blue-100 border-blue-400' 
                            : 'bg-white hover:bg-blue-50'
                        }`}
                        onClick={() => {
                          if (selectedActionItems.includes(item)) {
                            setSelectedActionItems(prev => prev.filter(i => i !== item));
                          } else if (selectedActionItems.length < 3) {
                            setSelectedActionItems(prev => [...prev, item]);
                          }
                        }}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                            selectedActionItems.includes(item) ? 'bg-blue-500 border-blue-500 text-white' : 'border-gray-400'
                          }`}>
                            {selectedActionItems.includes(item) && '✓'}
                          </div>
                          <span className="text-sm font-roboto">{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Custom Action Items */}
                <textarea
                  placeholder="Add your own action items here..."
                  className="w-full p-3 border border-blue-200 rounded-md h-24 bg-white font-roboto"
                  value={meetingNotes.actionItems || ''}
                  onChange={(e) => handleInputChange('actionItems', e.target.value)}
                />
                
                {/* Navigation Buttons */}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => navigateToSection('couldImprove')}
                    className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => navigateToSection('kidsCorner')}
                    className="flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-black"
                  >
                    Next Section
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            )}
            
            {activeSection === 'kidsCorner' && (
              <div className="p-4 border rounded-lg bg-purple-50">
                <h4 className="font-medium mb-2 flex items-center text-purple-800 font-roboto">
                  <span className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center mr-2 text-purple-600">🙂</span>
                  Kids' Corner
                </h4>
                <p className="text-sm text-purple-700 mb-3 font-roboto">
                  Get your kids involved! These fun questions help children understand family balance.
                </p>
                
                {/* Kid-friendly questions */}
                <div className="mb-4 bg-white p-4 rounded-lg border border-purple-200">
                  <h5 className="text-base font-medium text-purple-800 mb-3">Ask your kids:</h5>
                  <div className="space-y-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <p className="text-sm font-medium">If our family was a sports team, what position would each person play?</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <p className="text-sm font-medium">What's one thing you wish mom and dad would do more together?</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <p className="text-sm font-medium">What's your favorite family chore to help with?</p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <p className="text-sm font-medium">If you could change one family rule, what would it be?</p>
                    </div>
                  </div>
                </div>
                
                <textarea
                  placeholder="Write down what your kids say here..."
                  className="w-full p-3 border border-purple-200 rounded-md h-32 bg-white font-roboto"
                  value={meetingNotes.kidsInput || ''}
                  onChange={(e) => handleInputChange('kidsInput', e.target.value)}
                />
                
                {/* Navigation Buttons */}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => navigateToSection('actionItems')}
                    className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={() => navigateToSection('nextWeekGoals')}
                    className="flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-black"
                  >
                    Next Section
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            )}
            
            {activeSection === 'nextWeekGoals' && (
              <div className="p-4 border rounded-lg bg-indigo-50">
                <h4 className="font-medium mb-2 flex items-center text-indigo-800 font-roboto">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center mr-2 text-indigo-600">🎯</span>
                  Next Week's Goals
                </h4>
                <p className="text-sm text-indigo-700 mb-3 font-roboto">
                  What would a successful Week {currentWeek + 1} look like for your family?
                </p>
                
                {/* Suggested Goals */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium mb-2 font-roboto">Suggested Goals (Select up to 2):</h5>
                  <div className="space-y-2">
                    {getSuggestedGoals().map((goal, index) => (
                      <div 
                        key={index}
                        className={`p-2 rounded border cursor-pointer ${
                          selectedGoals.includes(goal) 
                            ? 'bg-indigo-100 border-indigo-400' 
                            : 'bg-white hover:bg-indigo-50'
                        }`}
                        onClick={() => {
                          if (selectedGoals.includes(goal)) {
                            setSelectedGoals(prev => prev.filter(g => g !== goal));
                          } else if (selectedGoals.length < 2) {
                            setSelectedGoals(prev => [...prev, goal]);
                          }
                        }}
                      >
                        <div className="flex items-center">
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-2 ${
                            selectedGoals.includes(goal) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-400'
                          }`}>
                            {selectedGoals.includes(goal) && '✓'}
                          </div>
                          <span className="text-sm font-roboto">{goal}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <textarea
                  placeholder="Add your own goals here..."
                  className="w-full p-3 border border-indigo-200 rounded-md h-24 bg-white font-roboto"
                  value={meetingNotes.nextWeekGoals || ''}
                  onChange={(e) => handleInputChange('nextWeekGoals', e.target.value)}
                />
                
                {/* Additional Notes */}
                <div className="mt-4">
                  <h5 className="text-sm font-medium mb-2 font-roboto">Additional Notes (Optional):</h5>
                  <textarea
                    placeholder="Any other comments or observations from the family meeting..."
                    className="w-full p-3 border rounded-md h-24 bg-white font-roboto"
                    value={meetingNotes.additionalNotes || ''}
                    onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
                  />
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => navigateToSection('kidsCorner')}
                    className="flex items-center bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous
                  </button>
                  <button
                    onClick={goToNextScreen}
                    className="flex items-center bg-gray-800 text-white px-4 py-2 rounded hover:bg-black"
                  >
                    Summary
                    <ChevronRight size={16} className="ml-1" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Continue/Back Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={goToPreviousScreen}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center"
              >
                <ChevronLeft size={18} className="mr-1" />
                Back to Intro
              </button>
              <button
                onClick={goToNextScreen}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 flex items-center"
              >
                Continue to Summary
                <ChevronRight size={18} className="ml-1" />
              </button>
            </div>
          </div>
        )}
        
        {currentScreen === 'summary' && (
          /* Summary Screen */
          <div className="p-6">
            <h3 className="text-xl font-bold mb-6 text-center">Meeting Summary</h3>
            
            {/* All sections summary */}
            <div className="space-y-6 mb-8">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium flex items-center mb-2">
                  <CheckCircle size={18} className="mr-2 text-green-600" />
                  What Went Well
                </h4>
                
                {/* Previous Goals Review Summary */}
                {showPreviousGoals && previousWeekGoals.length > 0 && (
                  <div className="mb-4 bg-blue-50 p-3 rounded-lg">
                    <h5 className="text-sm font-medium mb-2">Previous Week's Goals:</h5>
                    <ul className="list-disc pl-5 space-y-1">
                      {previousWeekGoals.map((goal, idx) => {
                        const status = previousGoalsStatus[goal] || 'pending';
                        let statusLabel = 'Not reviewed';
                        let statusColor = 'text-gray-500';
                        
                        if (status === 'completed') {
                          statusLabel = 'Completed';
                          statusColor = 'text-green-600 font-medium';
                        } else if (status === 'partial') {
                          statusLabel = 'Partially Done';
                          statusColor = 'text-yellow-600';
                        } else if (status === 'not_completed') {
                          statusLabel = 'Not Completed';
                          statusColor = 'text-red-600';
                        }
                        
                        return (
                          <li key={idx} className="text-sm flex items-center justify-between">
                            <span>{goal}</span>
                            <span className={statusColor}>{statusLabel}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                
                {/* Habit Completion Summary */}
                {habitCompletionStats && (
                  <div className="mb-4 bg-green-50 p-3 rounded-lg">
                    <h5 className="text-sm font-medium mb-2">Habit Completion:</h5>
                    <div className="flex justify-between text-sm">
                      <span>Completion Rate: {habitCompletionStats.total > 0 ? 
                        Math.round((habitCompletionStats.completed / habitCompletionStats.total) * 100) : 0}%</span>
                      <span>({habitCompletionStats.completed} of {habitCompletionStats.total} habits)</span>
                    </div>
                    
                    {habitCompletionStats.habitHelperCount > 0 && (
                      <p className="text-sm mt-1">
                        {habitCompletionStats.habitHelperCount} habits had children helping!
                      </p>
                    )}
                  </div>
                )}
                
                <p className="text-sm whitespace-pre-line">
                  {meetingNotes.wentWell || "No notes recorded."}
                </p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-medium flex items-center mb-2">
                  <Info size={18} className="mr-2 text-amber-600" />
                  What Could Improve
                </h4>
                <p className="text-sm whitespace-pre-line">
                  {meetingNotes.couldImprove || "No notes recorded."}
                </p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium flex items-center mb-2">
                  <CheckCheck size={18} className="mr-2 text-blue-600" />
                  Action Items
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {selectedActionItems.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                  {meetingNotes.actionItems && (
                    <li className="whitespace-pre-line">{meetingNotes.actionItems}</li>
                  )}
                  {selectedActionItems.length === 0 && !meetingNotes.actionItems && (
                    <li className="text-gray-500">No action items recorded.</li>
                  )}
                </ul>
              </div>
              
              {meetingNotes.kidsInput && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium flex items-center mb-2">
                    <Users size={18} className="mr-2 text-purple-600" />
                    Kids' Corner
                  </h4>
                  <p className="text-sm whitespace-pre-line">
                    {meetingNotes.kidsInput}
                  </p>
                </div>
              )}
              
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium flex items-center mb-2">
                  <Award size={18} className="mr-2 text-indigo-600" />
                  Next Week's Goals
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {selectedGoals.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                  {meetingNotes.nextWeekGoals && (
                    <li className="whitespace-pre-line">{meetingNotes.nextWeekGoals}</li>
                  )}
                  {selectedGoals.length === 0 && !meetingNotes.nextWeekGoals && (
                    <li className="text-gray-500">No goals recorded.</li>
                  )}
                </ul>
              </div>
              
              {meetingNotes.additionalNotes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Additional Notes</h4>
                  <p className="text-sm whitespace-pre-line">
                    {meetingNotes.additionalNotes}
                  </p>
                </div>
              )}
            </div>
            
            {/* Action buttons */}
            <div className="flex flex-col space-y-4">
              <button
                onClick={addMeetingToCalendar}
                disabled={isAddingToCalendar}
                className="w-full py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isAddingToCalendar ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Adding to Calendar...
                  </>
                ) : (
                  <>
                    <Calendar size={20} className="mr-2" />
                    Schedule Next Meeting
                  </>
                )}
              </button>
              
              <button
                onClick={handleDownloadSummary}
                className="w-full py-3 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50"
              >
                <Download size={20} className="mr-2" />
                Download Summary
              </button>
              
              <button
                onClick={handleCompleteMeeting}
                disabled={isCompleting}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                {isCompleting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Completing Week {currentWeek}...
                  </>
                ) : (
                  <>
                    <Star className="mr-2" size={20} />
                    Complete Week Together
                    <Users className="ml-2" size={20} />
                  </>
                )}
              </button>
            </div>
            
            {/* Navigation Back */}
            <div className="flex justify-start mt-6">
              <button
                onClick={goToPreviousScreen}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 flex items-center"
              >
                <ChevronLeft size={18} className="mr-1" />
                Back to Meeting
              </button>
            </div>
          </div>
        )}
        
        {/* Celebration Animation */}
        {showCelebration && <Fireworks />}
      </div>
    </div>
  );
};

export default FamilyMeetingScreen;