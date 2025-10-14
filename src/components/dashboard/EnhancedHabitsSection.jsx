// src/components/dashboard/EnhancedHabitsSection.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Info, Plus, RefreshCw, Award, 
  BarChart2, ChevronDown, ChevronUp,
  AlertTriangle, Check, Clock, Calendar,
  User, CheckCircle, Activity, Loader,
  ArrowRight, X
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useNotification } from '../../contexts/NotificationContext';
import EnhancedImbalanceRadarChart from './EnhancedImbalanceRadarChart';
import FilterableRadarChart from './FilterableRadarChart';
import useEnhancedHabitHelpers from '../../hooks/useEnhancedHabitHelpers';
import UserAvatar from '../common/UserAvatar';
import HabitGenerationService from '../../services/HabitGenerationService';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { generateHabitForCategory } from '../../utils/ImbalanceHabitGenerator';
import { analyzeTaskImbalances } from '../../utils/SurveyAnalysisUtil';
import NotionCard, { NotionPill, NotionProgressBar } from '../common/NotionCard';
import { NotionButton, NotionBadge } from '../common/NotionUI';

const EnhancedHabitsSection = ({ 
  onCreateHabit, 
  onRefreshHabits,
  onCategorySelect,
  showInfoModal,
  userHabits = [],
  onMarkHabitComplete
}) => {
  const { 
    selectedUser, 
    familyId, 
    surveyResponses,
    weightedScores,
    familyMembers
  } = useFamily();
  
  // Use notification context
  const { createNotification, createCelebration } = useNotification();
  
  // Use the enhanced habit helpers hook to streamline habit management
  const { 
    activeHabits,
    getHabitsWithHelperInfo,
    getHelperForHabit,
    assignHelper,
    trackHabitCompletion,
    refreshData,
    isLoading,
    loadingState,
    errorState,
    statusMessages,
    clearStatusMessages,
    isHabitInStreak
  } = useEnhancedHabitHelpers();
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [generatedHabit, setGeneratedHabit] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Create synthetic survey data for demonstration or when no real data exists
  const createSyntheticData = useCallback(() => {
    console.log("Creating synthetic survey data");
    
    // The parent role determines how the imbalance is presented
    const isParentMama = selectedUser?.roleType === "Mama";
    
    return {
      imbalances: [
        {
          category: "Visible Household Tasks",
          imbalancePercent: 25,
          dominantRole: "Mama",
          mamaPercent: 62,
          papaPercent: 38
        },
        {
          category: "Invisible Household Tasks",
          imbalancePercent: 30,
          dominantRole: "Mama",
          mamaPercent: 65,
          papaPercent: 35
        },
        {
          category: "Visible Parental Tasks",
          imbalancePercent: 15,
          dominantRole: "Papa",
          mamaPercent: 42,
          papaPercent: 58
        },
        {
          category: "Invisible Parental Tasks",
          imbalancePercent: 40,
          dominantRole: "Mama",
          mamaPercent: 70,
          papaPercent: 30
        }
      ],
      mostImbalancedCategory: {
        category: "Invisible Parental Tasks",
        imbalancePercent: 40,
        dominantRole: "Mama",
        mamaPercent: 70,
        papaPercent: 30
      },
      hasSignificantImbalance: true,
      overallImbalance: {
        mamaPercent: 60,
        papaPercent: 40,
        imbalancePercent: 20,
        dominantRole: "Mama",
        leastInvolvedRole: isParentMama ? "Papa" : "Mama"
      }
    };
  }, [selectedUser?.roleType]);
  
  // Analyze survey data with robust fallbacks
  const surveyAnalysis = useMemo(() => {
    console.log("Analyzing survey data");
    
    // Check if we have any real survey responses
    if (!surveyResponses || Object.keys(surveyResponses).length === 0) {
      console.log("No survey responses found, using synthetic data");
      return createSyntheticData();
    }
    
    // Try to analyze real survey data
    try {
      const analysis = analyzeTaskImbalances(surveyResponses);
      
      // Validate that analysis has the expected data structure
      if (!analysis || !analysis.imbalances || analysis.imbalances.length === 0) {
        console.log("Analysis returned no imbalances, using synthetic data");
        return createSyntheticData();
      }
      
      console.log("Using real survey analysis");
      return analysis;
    } catch (error) {
      console.error("Error analyzing survey data:", error);
      // Fallback to synthetic data on error
      console.log("Using synthetic survey data due to error");
      return createSyntheticData();
    }
  }, [surveyResponses, createSyntheticData]);
  
  // Effect to show imbalance chart when analysis reveals significant imbalance
  useEffect(() => {
    if (surveyAnalysis && surveyAnalysis.mostImbalancedCategory) {
      // Auto-expand if there's a significant imbalance (>15%)
      if (surveyAnalysis.mostImbalancedCategory.imbalancePercent > 15) {
        setShowChart(true);
        
        // Auto-select the most imbalanced category
        if (!selectedCategory) {
          setSelectedCategory(surveyAnalysis.mostImbalancedCategory.category);
        }
      }
    }
  }, [surveyAnalysis, selectedCategory]);
  
  // Handle category selection from the radar chart
  const handleCategorySelect = async (category) => {
    setLoading(true);
    setSelectedCategory(category);
    
    try {
      // Get the dominant role and imbalance percent for this category
      const categoryData = surveyAnalysis?.imbalances?.find(i => i.category === category);
      
      if (categoryData) {
        // Generate a habit for the selected category
        const habit = generateHabitForCategory(
          category,
          categoryData.imbalancePercent,
          categoryData.dominantRole,
          selectedUser?.roleType || 'Parent'
        );
        
        setGeneratedHabit(habit);
        
        // Store the generated habit in Firestore for persistence
        if (familyId) {
          const habitId = `gen-habit-${Date.now()}`;
          const habitRef = doc(db, "families", familyId, "habits", habitId);
          
          // Store with additional metadata
          await setDoc(habitRef, {
            ...habit,
            id: habitId,
            generatedAt: serverTimestamp(),
            userId: selectedUser?.id,
            familyId: familyId,
            userName: selectedUser?.name,
            userRole: selectedUser?.roleType || 'Parent',
            imbalanceData: {
              category: category,
              imbalancePercent: categoryData.imbalancePercent,
              dominantRole: categoryData.dominantRole
            }
          });
          
          console.log(`Stored generated habit for category ${category}`);
        }
      } else {
        console.log(`No imbalance data found for category: ${category}`);
        
        // Generate a default habit if no specific data
        const habit = generateHabitForCategory(
          "Invisible Household Tasks", 
          20, 
          "Mama", 
          selectedUser?.roleType || 'Parent'
        );
        
        setGeneratedHabit(habit);
      }
    } catch (error) {
      console.error("Error generating habit for category:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding the generated habit
  const handleAddGeneratedHabit = () => {
    console.log("handleAddGeneratedHabit called", { generatedHabit: !!generatedHabit, onCreateHabit: !!onCreateHabit });
    
    if (generatedHabit && onCreateHabit) {
      try {
        // Create a unique ID for this habit that's guaranteed to be unique
        const habitId = `habit-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
        
        // Build a completely standalone habit object with all required fields
        const habitToAdd = {
          id: habitId,
          title: generatedHabit.title || "New Habit",
          description: generatedHabit.description || "",
          cue: generatedHabit.cue || "",
          action: generatedHabit.action || "",
          reward: generatedHabit.reward || "",
          identity: generatedHabit.identity || "",
          category: generatedHabit.category || "Balance Habit",
          completed: false,
          streak: 0,
          record: 0,
          progress: 0,
          isUserGenerated: true,
          lastCompleted: null,
          habitExplanation: generatedHabit.habitExplanation || "",
          habitResearch: generatedHabit.habitResearch || "",
          // Add explicit subTasks array for compatibility
          subTasks: [
            { id: `${habitId}-step-1`, title: generatedHabit.cue || "Set a consistent time", completed: false },
            { id: `${habitId}-step-2`, title: generatedHabit.action || "Perform the action", completed: false },
            { id: `${habitId}-step-3`, title: generatedHabit.reward || "Enjoy the benefit", completed: false }
          ]
        };
        
        console.log("About to call onCreateHabit with:", habitToAdd);
        
        // Call the parent handler directly with our fully-formed habit
        onCreateHabit(habitToAdd);
        
        // Show a notification to confirm the habit was added
        createCelebration("Habit Created", true, `"${habitToAdd.title}" has been added to your list.`);
        
        // Clear the generated habit from this component
        setGeneratedHabit(null);
      } catch (error) {
        console.error("Error in handleAddGeneratedHabit:", error);
        createCelebration("Error", false, "There was an error adding your habit. Please try again.");
      }
    } else {
      console.error("Missing generatedHabit or onCreateHabit:", { 
        generatedHabit: !!generatedHabit, 
        onCreateHabit: !!onCreateHabit 
      });
      
      if (!generatedHabit) {
        createNotification("No habit selected to add. Please select a habit first.", "warning");
      } else if (!onCreateHabit) {
        createNotification("Unable to add habit due to a technical issue. Please refresh the page and try again.", "error");
      }
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Never";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Toggle chart visibility
  const toggleChart = () => {
    const newChartState = !showChart;
    setShowChart(newChartState);
    
    // If showing chart, always select the most imbalanced category
    if (newChartState) {
      if (surveyAnalysis?.mostImbalancedCategory) {
        setSelectedCategory(surveyAnalysis.mostImbalancedCategory.category);
        
        // If we have imbalance data, automatically generate a recommendation
        if (!generatedHabit) {
          setTimeout(() => {
            handleCategorySelect(surveyAnalysis.mostImbalancedCategory.category);
          }, 100);
        }
      } else if (surveyAnalysis?.imbalances && surveyAnalysis.imbalances.length > 0) {
        // If no "most imbalanced" but we have categories, pick the first one
        setSelectedCategory(surveyAnalysis.imbalances[0].category);
      }
    }
  };

  // Close the generated habit recommendation
  const closeGeneratedHabit = () => {
    setGeneratedHabit(null);
  };
  
  return (
    <NotionCard 
      title="Your Current Habits"
      icon={<Activity size={20} className="text-gray-600" />}
      actions={
        <>
          <NotionButton 
            variant={showChart ? "primary" : "default"}
            size="sm"
            icon={<BarChart2 size={16} />}
            onClick={toggleChart}
            className="mr-1"
          >
            {showChart ? 'Hide Chart' : 'Show Chart'}
          </NotionButton>
          <NotionButton 
            variant="outline"
            size="sm"
            icon={<RefreshCw size={16} className={loading ? 'animate-spin' : ''} />}
            onClick={onRefreshHabits}
            disabled={loading}
          >
            Refresh
          </NotionButton>
          <NotionButton 
            variant="subtle"
            size="sm"
            icon={isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-1"
          >
            {isExpanded ? 'Less' : 'More'}
          </NotionButton>
        </>
      }
      className="mb-6"
    >
      {/* Subtitle */}
      <p className="text-sm text-gray-500 -mt-2 mb-4">
        Build consistent habits to balance family workload
      </p>
      
      {/* Expanded information section */}
      {isExpanded && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-100">
          <h3 className="font-medium text-gray-800 mb-2">About Habit Recommendations</h3>
          <p className="text-sm text-gray-600 mb-3">
            Allie analyzes your survey responses to identify imbalances in family workload 
            and recommends habits to address these specific areas.
          </p>
          
          <div className="p-3 bg-blue-50 rounded-md text-sm">
            <div className="flex">
              <Info size={18} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-800">
                  <strong>How habit recommendations work:</strong> Your survey responses reveal where workload imbalances 
                  exist between parents. Habits are recommended specifically to address the categories with the 
                  greatest imbalance, helping you create lasting change in these areas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filterable Radar Chart or Direct Imbalance Chart */}
      {showChart && (
        <div className="border border-gray-100 bg-gray-50 rounded-md p-4 mb-6">
          {/* If showInfoModal is provided, use a complete FilterableRadarChart for better UX */}
          {showInfoModal ? (
            <div className="mb-3">
              <FilterableRadarChart
                onCategorySelect={(category) => {
                  handleCategorySelect(category);
                  if (onCategorySelect) {
                    onCategorySelect(category);
                  }
                }}
                showInfoModal={showInfoModal}
              />
            </div>
          ) : (
            /* Otherwise use the simpler EnhancedImbalanceRadarChart */
            <EnhancedImbalanceRadarChart
              surveyResponses={surveyResponses}
              onCategorySelect={(category) => {
                handleCategorySelect(category);
                if (onCategorySelect) {
                  onCategorySelect(category);
                }
              }}
            />
          )}
        </div>
      )}
      
      {/* Generated habit recommendation */}
      {generatedHabit && (
        <NotionCard
          title={`Recommended Habit for ${selectedCategory || "Balance Improvement"}`}
          className="mb-6 border-amber-200"
          actions={
            <>
              <NotionButton
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={handleAddGeneratedHabit}
              >
                Add This Habit
              </NotionButton>
              <NotionButton
                variant="subtle"
                size="sm"
                icon={<X size={16} />}
                onClick={closeGeneratedHabit}
              >
                Close
              </NotionButton>
            </>
          }
        >
          <div className="mb-4">
            <h4 className="font-semibold text-gray-800 mb-1">{generatedHabit.title}</h4>
            <p className="text-gray-600 mb-3">{generatedHabit.description}</p>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="text-xs text-gray-600 font-medium mb-1">Cue</div>
                <div className="text-sm">{generatedHabit.cue}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="text-xs text-gray-600 font-medium mb-1">Action</div>
                <div className="text-sm">{generatedHabit.action}</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                <div className="text-xs text-gray-600 font-medium mb-1">Reward</div>
                <div className="text-sm">{generatedHabit.reward}</div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm">
              <div className="font-medium mb-1 text-blue-800">Why this habit is recommended:</div>
              <p className="text-blue-700" dangerouslySetInnerHTML={{ __html: generatedHabit.habitExplanation }} />
              <p className="mt-2 text-blue-600 text-xs italic">{generatedHabit.habitResearch}</p>
            </div>
          </div>
        </NotionCard>
      )}

      {/* Enhanced Habit Helpers Section */}
      {isExpanded && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-800 flex items-center">
              <Activity size={18} className="mr-2 text-gray-600" />
              Habit Helpers
            </h3>
            
            <NotionButton 
              variant="subtle"
              size="sm"
              icon={<RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />}
              onClick={refreshData}
              disabled={isLoading}
            >
              Refresh
            </NotionButton>
          </div>
          
          {/* Status Messages */}
          {statusMessages.length > 0 && (
            <div className="mb-4 max-h-32 overflow-y-auto">
              {statusMessages.map(message => (
                <div 
                  key={message.id}
                  className={`mb-2 p-2 rounded-md text-sm flex items-center
                    ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 
                      message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 
                      message.type === 'warning' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                      'bg-blue-50 text-blue-700 border border-blue-100'}`}
                >
                  {message.type === 'error' ? <AlertTriangle size={14} className="mr-1.5" /> :
                   message.type === 'success' ? <CheckCircle size={14} className="mr-1.5" /> :
                   message.type === 'warning' ? <AlertTriangle size={14} className="mr-1.5" /> :
                   <Info size={14} className="mr-1.5" />}
                  {message.message}
                </div>
              ))}
              {statusMessages.length > 1 && (
                <NotionButton 
                  variant="link"
                  size="sm"
                  onClick={clearStatusMessages}
                >
                  Clear messages
                </NotionButton>
              )}
            </div>
          )}
          
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center p-3 bg-gray-50 rounded-md mb-4 border border-gray-100">
              <Loader size={16} className="animate-spin mr-2 text-blue-500" />
              <span className="text-sm text-gray-600">
                {loadingState.helpers ? "Loading helpers..." : 
                 loadingState.habits ? "Loading habits..." : 
                 "Processing..."}
              </span>
            </div>
          )}
          
          {/* Habit Helpers List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getHabitsWithHelperInfo.slice(0, 4).map(habit => {
              const inStreak = isHabitInStreak(habit.id);
              
              return (
                <NotionCard 
                  key={habit.id}
                  hover={true}
                  className={`border ${inStreak ? 'border-amber-200' : 'border-gray-200'}`}
                  noPadding
                >
                  <div className="p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-gray-800 flex items-center">
                        {habit.title}
                        {inStreak && (
                          <NotionBadge color="yellow" className="ml-2">
                            <span className="flex items-center">
                              <Award size={12} className="mr-1" /> Streak!
                            </span>
                          </NotionBadge>
                        )}
                      </h4>
                      
                      {/* Helper Badge */}
                      {habit.helper ? (
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
                          <UserAvatar 
                            user={habit.helper.childData} 
                            size={16} 
                            className="mr-1"
                          />
                          <span className="text-xs text-gray-700">
                            {habit.helper.childData?.name || 'Helper'}
                          </span>
                        </div>
                      ) : (
                        <NotionButton
                          variant="link"
                          size="sm"
                          icon={<Plus size={14} />}
                          onClick={() => {
                            createNotification("Assign a helper to this habit by clicking the 'Assign Helper' button.", "info");
                          }}
                        >
                          Add Helper
                        </NotionButton>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{habit.description}</p>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        <NotionProgressBar 
                          value={habit.progress || 0} 
                          max={5} 
                          color="blue" 
                          showLabel 
                          label="Progress" 
                        />
                      </div>
                      
                      <NotionButton
                        variant="primary"
                        size="sm"
                        icon={<CheckCircle size={14} />}
                        onClick={() => trackHabitCompletion(habit.id, { notes: "Completed via dashboard", difficulty: 3 })}
                      >
                        Complete
                      </NotionButton>
                    </div>
                  </div>
                </NotionCard>
              );
            })}
          </div>
          
          {getHabitsWithHelperInfo.length > 4 && (
            <div className="mt-4 text-center">
              <NotionButton
                variant="link"
                size="sm"
                icon={<ArrowRight size={16} />}
              >
                View all {getHabitsWithHelperInfo.length} habits
              </NotionButton>
            </div>
          )}
          
          {getHabitsWithHelperInfo.length === 0 && (
            <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-md border border-gray-100">
              <p className="mb-3">No active habits found</p>
              <NotionButton
                variant="primary"
                size="md"
                icon={<Plus size={16} />}
              >
                Create New Habit
              </NotionButton>
            </div>
          )}
        </div>
      )}
    </NotionCard>
  );
};

export default EnhancedHabitsSection;