import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Heart, TrendingUp, Users, Calendar, CheckCircle, 
  Activity, Award, Target, ArrowRight, Star, 
  AlertCircle, Clock, Brain, Sparkles, Info,
  ChevronRight, Home, BarChart3, UserCircle,
  Lightbulb, Plus, MessageSquare, History,
  Zap, Baby, LayoutGrid, GraduationCap
} from 'lucide-react';
import { useFamily } from '../../../contexts/FamilyContext';
// Remove the import since we'll calculate balance differently
import DatabaseService from '../../../services/DatabaseService';
import AllieAIService from '../../../services/AllieAIService';
import HabitCyclesService from '../../../services/HabitCyclesService';
import QuantumKnowledgeGraph from '../../../services/QuantumKnowledgeGraph';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import HarmonyPulse from '../HarmonyPulse';
import MemberJourneys from '../MemberJourneys';
import ChildDevelopmentTracker from '../ChildDevelopmentTracker';
import ELOTugOfWar from '../ELOTugOfWar';
import ELORatingsDisplay from '../ELORatingsDisplay';
import FourCategoryRadar from '../FourCategoryRadar';
import FamilyInsightsDashboard from '../FamilyInsightsDashboard';

const RefreshedDashboardTab = () => {
  const { 
    familyId,
    familyName,
    familyMembers,
    surveyResponses,
    completedWeeks, 
    currentWeek,
    taskRecommendations,
    weekHistory,
    loadCurrentWeekTasks
  } = useFamily();

  // State
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  const [balanceMetrics, setBalanceMetrics] = useState(null);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberStats, setMemberStats] = useState({});
  const [aiInsights, setAiInsights] = useState([]);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState(false);
  const [aiInsightsAttempted, setAiInsightsAttempted] = useState(false);
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [familyEvents, setFamilyEvents] = useState([]);
  const [siblingDynamics, setSiblingDynamics] = useState(null);
  const [loadingSiblingData, setLoadingSiblingData] = useState(false);
  const [selectedHistoricalWeek, setSelectedHistoricalWeek] = useState(null);

  // Get parents and children
  const parents = useMemo(() => familyMembers.filter(m => m.role === 'parent'), [familyMembers]);
  const children = useMemo(() => familyMembers.filter(m => m.role === 'child'), [familyMembers]);

  // Calculate balance scores from actual survey responses
  const calculateTaskBalance = useCallback(() => {
    // Default balanced state
    const defaultBalance = {
      overallBalance: 50,
      visibleBalance: 50,
      invisibleBalance: 50,
      cognitiveBalance: 50,
      householdBalance: 50
    };

    if (!surveyResponses || Object.keys(surveyResponses).length === 0) {
      console.log('No survey responses available for balance calculation');
      return defaultBalance;
    }

    // Initialize category counts for survey responses
    const categoryData = {
      visible_household: { mama: 0, papa: 0, both: 0, total: 0 },
      invisible_household: { mama: 0, papa: 0, both: 0, total: 0 },
      visible_parenting: { mama: 0, papa: 0, both: 0, total: 0 },
      invisible_parenting: { mama: 0, papa: 0, both: 0, total: 0 }
    };

    // Process survey responses
    Object.entries(surveyResponses).forEach(([questionId, answer]) => {
      if (!answer || answer === 'N/A') return;
      
      // Extract question number
      const qNum = parseInt(questionId.replace(/[^0-9]/g, ''));
      if (isNaN(qNum)) return;
      
      // Map question to category based on standard survey structure
      let category;
      if (qNum >= 1 && qNum <= 18) {
        category = 'visible_household';
      } else if (qNum >= 19 && qNum <= 36) {
        category = 'invisible_household';
      } else if (qNum >= 37 && qNum <= 54) {
        category = 'visible_parenting';
      } else if (qNum >= 55 && qNum <= 72) {
        category = 'invisible_parenting';
      }
      
      if (!category || !categoryData[category]) return;
      
      // Count responses
      const normalizedAnswer = answer.toString().toLowerCase().trim();
      if (normalizedAnswer === 'mama' || normalizedAnswer === 'mother' || normalizedAnswer === 'mom') {
        categoryData[category].mama++;
      } else if (normalizedAnswer === 'papa' || normalizedAnswer === 'father' || normalizedAnswer === 'dad') {
        categoryData[category].papa++;
      } else if (normalizedAnswer === 'both' || normalizedAnswer === 'both equally' || normalizedAnswer === 'draw' || normalizedAnswer === 'tie') {
        categoryData[category].both++;
      }
      categoryData[category].total++;
    });

    // Calculate balance percentages for each category
    const calculateCategoryBalance = (category) => {
      if (category.total === 0) return 50;
      
      // Calculate who does more
      const mamaTotal = category.mama + (category.both * 0.5);
      const papaTotal = category.papa + (category.both * 0.5);
      const total = mamaTotal + papaTotal;
      
      if (total === 0) return 50;
      
      // Balance is how close to 50/50 the distribution is
      // 100% = perfect balance, 0% = complete imbalance
      const mamaPercent = (mamaTotal / total) * 100;
      const imbalance = Math.abs(mamaPercent - 50);
      const balance = Math.round(100 - (imbalance * 2)); // Convert imbalance to balance score
      
      return Math.max(0, Math.min(100, balance));
    };

    const visibleHouseholdBalance = calculateCategoryBalance(categoryData.visible_household);
    const invisibleHouseholdBalance = calculateCategoryBalance(categoryData.invisible_household);
    const visibleParentingBalance = calculateCategoryBalance(categoryData.visible_parenting);
    const invisibleParentingBalance = calculateCategoryBalance(categoryData.invisible_parenting);

    // Overall balance is weighted average
    const overallBalance = Math.round(
      (visibleHouseholdBalance * 0.2 + 
       invisibleHouseholdBalance * 0.3 + // Weight invisible tasks higher
       visibleParentingBalance * 0.2 + 
       invisibleParentingBalance * 0.3) // Weight invisible tasks higher
    );

    console.log('Balance calculation from survey data:', {
      responses: Object.keys(surveyResponses).length,
      categoryData,
      balances: {
        visibleHousehold: visibleHouseholdBalance,
        invisibleHousehold: invisibleHouseholdBalance,
        visibleParenting: visibleParentingBalance,
        invisibleParenting: invisibleParentingBalance,
        overall: overallBalance
      }
    });

    return {
      overallBalance,
      visibleBalance: Math.round((visibleHouseholdBalance + visibleParentingBalance) / 2),
      invisibleBalance: Math.round((invisibleHouseholdBalance + invisibleParentingBalance) / 2),
      cognitiveBalance: invisibleParentingBalance, // Cognitive load is primarily invisible parenting
      householdBalance: Math.round((visibleHouseholdBalance + invisibleHouseholdBalance) / 2)
    };
  }, [surveyResponses]);

  // Load AI insights - with error handling and retry prevention
  const loadAIInsights = useCallback(async () => {
    if (!familyId || !balanceMetrics) return;

    // Prevent multiple simultaneous requests
    if (loadingInsights) return;

    setLoadingInsights(true);
    setAiInsightsError(false);
    setAiInsightsAttempted(true);

    try {
      const insights = await AllieAIService.generateInsights({
        familyId,
        balanceMetrics,
        taskRecommendations,
        surveyResponses,
        weekHistory,
        completedWeeks
      });

      // Filter and format insights
      const formattedInsights = insights
        .filter(insight => insight.priority === 'high' || insight.priority === 'medium')
        .slice(0, 3)
        .map(insight => ({
          ...insight,
          icon: insight.type === 'balance' ? Heart :
                insight.type === 'workload' ? Activity :
                insight.type === 'progress' ? TrendingUp : Lightbulb
        }));

      setAiInsights(formattedInsights);
    } catch (error) {
      console.error("Error loading AI insights:", error);
      setAiInsightsError(true);
      // Set some default insights to prevent infinite retries
      setAiInsights([]);
    } finally {
      setLoadingInsights(false);
    }
  }, [familyId, balanceMetrics, taskRecommendations, surveyResponses, weekHistory, completedWeeks, loadingInsights]);

  // Calculate harmony score - moved before loadFamilyEvents
  const harmonyScore = useMemo(() => {
    if (!balanceMetrics) return 50;
    
    // Calculate based on various balance metrics
    const scores = [
      balanceMetrics.overallBalance || 50,
      balanceMetrics.visibleBalance || 50,
      balanceMetrics.invisibleBalance || 50,
      balanceMetrics.cognitiveBalance || 50
    ];
    
    // Weight invisible and cognitive labor more heavily
    const weightedScore = (
      scores[0] * 0.2 + // overall
      scores[1] * 0.2 + // visible
      scores[2] * 0.3 + // invisible (higher weight)
      scores[3] * 0.3   // cognitive (higher weight)
    );
    
    return Math.round(weightedScore);
  }, [balanceMetrics]);

  // Load family events for timeline
  const loadFamilyEvents = useCallback(async () => {
    if (!familyId) return;
    
    try {
      const events = [];
      const now = new Date();
      
      // Add survey completion events
      if (completedWeeks && completedWeeks > 0) {
        events.push({
          date: `Week ${completedWeeks}`,
          event: `Completed Week ${completedWeeks} Survey`,
          icon: CheckCircle,
          color: 'green',
          timestamp: now.getTime() - (2 * 24 * 60 * 60 * 1000) // 2 days ago
        });
      }
      
      // Add habit cycle events
      if (taskRecommendations && taskRecommendations.length > 0) {
        const activeTasks = taskRecommendations.filter(t => !t.completed).length;
        if (activeTasks > 0) {
          events.push({
            date: 'This week',
            event: `${activeTasks} active habits in progress`,
            icon: Zap,
            color: 'yellow',
            timestamp: now.getTime() - (5 * 24 * 60 * 60 * 1000) // 5 days ago
          });
        }
      }
      
      // Add harmony score milestones
      if (harmonyScore >= 80) {
        events.push({
          date: 'Recently',
          event: `Achieved ${harmonyScore}% harmony score!`,
          icon: Heart,
          color: 'purple',
          timestamp: now.getTime() - (7 * 24 * 60 * 60 * 1000) // 1 week ago
        });
      }
      
      // Add family creation event
      events.push({
        date: 'Beginning',
        event: `${familyName} family created`,
        icon: Users,
        color: 'blue',
        timestamp: now.getTime() - (30 * 24 * 60 * 60 * 1000) // 30 days ago
      });
      
      // Sort by timestamp
      events.sort((a, b) => b.timestamp - a.timestamp);
      
      // Format dates
      const formattedEvents = events.map(event => ({
        ...event,
        date: formatEventDate(event.timestamp)
      }));
      
      setFamilyEvents(formattedEvents);
    } catch (error) {
      console.error("Error loading family events:", error);
    }
  }, [familyId, completedWeeks, taskRecommendations, harmonyScore, familyName]);

  // Format event date
  const formatEventDate = (timestamp) => {
    const now = new Date();
    const eventDate = new Date(timestamp);
    const diffInDays = Math.floor((now - eventDate) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 14) return '1 week ago';
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  // Load sibling dynamics data
  const loadSiblingDynamics = useCallback(async () => {
    if (!familyId || children.length < 2) return;
    
    setLoadingSiblingData(true);
    try {
      const knowledgeGraph = QuantumKnowledgeGraph;
      const dynamics = {
        spilloverEffects: [],
        teachingRelationships: [],
        collaborations: [],
        totalTimeSaved: 0
      };
      
      // Load dynamics for each child
      for (const child of children) {
        const childDynamics = await knowledgeGraph.getSiblingDynamics(familyId, child.id);
        
        // Count spillover effects
        if (childDynamics.influences.length > 0) {
          dynamics.spilloverEffects.push({
            child: child.name,
            influences: childDynamics.influences
          });
        }
        
        // Count teaching relationships
        if (childDynamics.teaching.length > 0) {
          dynamics.teachingRelationships.push({
            teacher: child.name,
            students: childDynamics.teaching.map(t => t.entity.properties.name)
          });
          // Estimate time saved (2 hours per teaching relationship per week)
          dynamics.totalTimeSaved += childDynamics.teaching.length * 2;
        }
        
        // Count collaborations
        if (childDynamics.collaborations.length > 0) {
          dynamics.collaborations.push({
            child: child.name,
            partners: childDynamics.collaborations
          });
        }
      }
      
      setSiblingDynamics(dynamics);
    } catch (error) {
      console.error('Error loading sibling dynamics:', error);
    } finally {
      setLoadingSiblingData(false);
    }
  }, [familyId, children]);

  // Create habit from insight
  const createHabitFromInsight = useCallback(async (insight) => {
    if (!familyId) return;
    
    try {
      const habitData = {
        title: insight.habitTitle || insight.title,
        description: insight.habitDescription || insight.description,
        category: insight.category || 'Invisible Parental Tasks',
        assignedTo: insight.assignTo || parents[0]?.roleType,
        assignedToName: insight.assignToName || parents[0]?.name,
        focusArea: insight.focusArea || 'Balance Improvement',
        isAIGenerated: true,
        aiInsight: insight.insight,
        weight: insight.weight || 3,
        timeCommitment: insight.timeCommitment || '15 mins',
        createdAt: new Date().toISOString()
      };

      await HabitCyclesService.addHabit(familyId, currentWeek.toString(), habitData);
      await loadCurrentWeekTasks();
      
      setShowInsightModal(false);
      setSelectedInsight(null);
    } catch (error) {
      console.error("Error creating habit from insight:", error);
    }
  }, [familyId, currentWeek, parents, loadCurrentWeekTasks]);

  // Calculate current balance metrics from survey data
  useEffect(() => {
    const metrics = calculateTaskBalance();
    setBalanceMetrics(metrics);
  }, [calculateTaskBalance]);

  // Load weekly progress data
  useEffect(() => {
    const loadWeeklyData = async () => {
      if (!familyId) return;
      
      setLoading(true);
      try {
        // Get last 4 weeks of data
        const weeks = Array.isArray(weekHistory) ? weekHistory : [];
        const recentWeeks = weeks.length > 0 
          ? weeks.slice(-4).map(week => ({
              week: `Week ${week?.weekNumber || 0}`,
              balance: week?.balanceScore || 50,
              tasksCompleted: week?.tasksCompleted || 0,
              harmonyScore: week?.harmonyScore || 0
            }))
          : [];
        
        setWeeklyProgress(recentWeeks);

        // Calculate member statistics
        const stats = {};
        familyMembers.forEach(member => {
          const memberTasks = taskRecommendations?.filter(t => 
            t.assignedToName === member.name || t.assignedTo === member.roleType
          ) || [];
          
          stats[member.id] = {
            tasksAssigned: memberTasks.length,
            tasksCompleted: memberTasks.filter(t => t.completed).length,
            workload: memberTasks.reduce((sum, t) => sum + (t.weight || 1), 0)
          };
        });
        setMemberStats(stats);

      } catch (error) {
        console.error("Error loading weekly data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWeeklyData();
  }, [familyId, weekHistory, taskRecommendations, familyMembers]);

  // Load AI insights when balance metrics are available - only once
  useEffect(() => {
    if (balanceMetrics && !aiInsightsAttempted) {
      loadAIInsights();
    }
  }, [balanceMetrics, aiInsightsAttempted]); // Removed loadAIInsights from deps to prevent infinite loop

  // Load family events
  useEffect(() => {
    loadFamilyEvents();
  }, [loadFamilyEvents]);

  // Load sibling dynamics when children are available
  useEffect(() => {
    if (children.length >= 2 && !loadingSiblingData) {
      loadSiblingDynamics();
    }
  }, [children.length, loadingSiblingData, loadSiblingDynamics]);

  // Get active habits count
  const activeHabits = useMemo(() => {
    return taskRecommendations?.filter(t => !t.completed).length || 0;
  }, [taskRecommendations]);

  // Get completion rate
  const completionRate = useMemo(() => {
    if (!taskRecommendations || taskRecommendations.length === 0) return 0;
    const completed = taskRecommendations.filter(t => t.completed).length;
    return Math.round((completed / taskRecommendations.length) * 100);
  }, [taskRecommendations]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm text-gray-600">
              {entry.name}: {entry.value}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Radar chart data for balance visualization
  const radarData = useMemo(() => {
    const defaultData = [
      { category: 'Visible Tasks', value: 50, description: 'Physical tasks everyone can see' },
      { category: 'Invisible Tasks', value: 50, description: 'Planning, organizing, emotional labor' },
      { category: 'Cognitive Load', value: 50, description: 'Mental work and remembering' },
      { category: 'Household', value: 50, description: 'Home maintenance and chores' }
    ];
    
    if (!balanceMetrics) return defaultData;
    
    // Show imbalance: lower score = more imbalanced
    return [
      { 
        category: 'Visible Tasks', 
        value: balanceMetrics.visibleBalance || 50,
        description: 'Physical tasks everyone can see'
      },
      { 
        category: 'Invisible Tasks', 
        value: balanceMetrics.invisibleBalance || 50,
        description: 'Planning, organizing, emotional labor'
      },
      { 
        category: 'Cognitive Load', 
        value: balanceMetrics.cognitiveBalance || 50,
        description: 'Mental work and remembering'
      },
      { 
        category: 'Household', 
        value: balanceMetrics.householdBalance || 50,
        description: 'Home maintenance and chores'
      }
    ];
  }, [balanceMetrics]);

  // Calculate weekly balance history from week history
  const weeklyBalanceHistory = useMemo(() => {
    const history = [];
    
    if (Array.isArray(weekHistory) && weekHistory.length > 0) {
      weekHistory.forEach((week, index) => {
        // Try to get balance data from week
        let weekData = {
          week: `Week ${week.weekNumber || index + 1}`,
          visible: 50,
          invisible: 50,
          overall: 50
        };
        
        // If week has balance data, use it
        if (week.balanceMetrics) {
          weekData.visible = week.balanceMetrics.visibleBalance || 50;
          weekData.invisible = week.balanceMetrics.invisibleBalance || 50;
          weekData.overall = week.balanceMetrics.overallBalance || 50;
        } else if (week.balanceScore) {
          // Fallback to single balance score
          weekData.overall = week.balanceScore;
          weekData.visible = week.balanceScore;
          weekData.invisible = week.balanceScore;
        }
        
        history.push(weekData);
      });
    }
    
    // Add current week if we have balance metrics
    if (balanceMetrics) {
      history.push({
        week: `Week ${currentWeek || history.length + 1}`,
        visible: balanceMetrics.visibleBalance || 50,
        invisible: balanceMetrics.invisibleBalance || 50,
        overall: balanceMetrics.overallBalance || 50
      });
    }
    
    // If no history, create sample progression
    if (history.length === 0) {
      const weeks = 5;
      const startBalance = 30;
      const currentBalance = balanceMetrics?.overallBalance || 50;
      const increment = (currentBalance - startBalance) / (weeks - 1);
      
      for (let i = 0; i < weeks; i++) {
        const balance = Math.round(startBalance + (i * increment));
        history.push({
          week: `Week ${i + 1}`,
          visible: balance - 5 + Math.random() * 10,
          invisible: balance - 5 + Math.random() * 10,
          overall: balance
        });
      }
    }
    
    // Keep only last 8 weeks
    return history.slice(-8);
  }, [weekHistory, balanceMetrics, currentWeek]);

  // Transform balance history for radar chart display
  const historicalRadarData = useMemo(() => {
    if (!radarData || radarData.length === 0) return [];
    
    // Transform weeklyBalanceHistory into radar-compatible format
    return weeklyBalanceHistory.map((week) => ({
      week: week.week,
      'visibletasks': week.visible || 50,
      'invisibletasks': week.invisible || 50,
      'cognitiveload': week.invisible || 50, // Cognitive load correlates with invisible tasks
      'household': Math.round((week.visible + week.invisible) / 2) || 50,
      overall: week.overall || 50
    }));
  }, [weeklyBalanceHistory, radarData]);

  // Set initial selected week when data loads
  useEffect(() => {
    if (historicalRadarData.length > 0 && !selectedHistoricalWeek) {
      setSelectedHistoricalWeek(historicalRadarData[historicalRadarData.length - 1].week);
    }
  }, [historicalRadarData, selectedHistoricalWeek]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 transition-all duration-300">
      {/* FAMILY INSIGHTS - THE CORE PRODUCT EXPERIENCE */}
      {/* This is the FIRST thing users see - Recognition before Action */}
      <FamilyInsightsDashboard balanceMetrics={balanceMetrics} />

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Welcome back, {familyName} Family! 👋
            </h2>
            <p className="text-gray-600 mt-1">
              Here's how your family is doing this week
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Week {currentWeek}</span>
            <Calendar size={20} className="text-gray-400" />
          </div>
        </div>
      </div>

      {/* Key Metrics Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {/* Harmony Score */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Heart size={24} className="text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">This week</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{harmonyScore}%</h3>
          <p className="text-sm text-gray-600 mt-1">Family Harmony Score</p>
          <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${harmonyScore}%` }}
            />
          </div>
        </div>

        {/* Active Habits */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity size={24} className="text-blue-600" />
            </div>
            <span className="text-sm text-green-600 font-medium">Active</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{activeHabits}</h3>
          <p className="text-sm text-gray-600 mt-1">Habits in Progress</p>
          <button className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center">
            View all habits
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Overall</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{completionRate}%</h3>
          <p className="text-sm text-gray-600 mt-1">Tasks Completed</p>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp size={16} className="text-green-600 mr-1" />
            <span className="text-green-600">+5% from last week</span>
          </div>
        </div>

        {/* Family Members */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Users size={24} className="text-orange-600" />
            </div>
            <Award size={20} className="text-yellow-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{familyMembers.length}</h3>
          <p className="text-sm text-gray-600 mt-1">Family Members</p>
          <div className="mt-4 flex -space-x-2">
            {familyMembers.slice(0, 4).map((member) => (
              <div
                key={member.id}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 border-2 border-white flex items-center justify-center"
                title={member.name}
              >
                <span className="text-xs text-white font-medium">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
            ))}
            {familyMembers.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                <span className="text-xs text-gray-600">+{familyMembers.length - 4}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Balance Overview with Four Category Radar */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Task Balance Overview</h3>
              <p className="text-sm text-gray-600 mt-1">
                How well tasks are distributed across categories
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Info size={16} className="text-gray-400" />
              <span className="text-sm text-gray-500">Based on survey responses</span>
            </div>
          </div>

          {/* Four Category Radar Component */}
          <FourCategoryRadar
            surveyData={{
              rawResponses: surveyResponses,
              hasEnrichedData: false,
              membershipData: familyMembers.map(member => ({
                memberId: member.id,
                memberName: member.name,
                memberRole: member.role || 'parent',
                roleType: member.roleType || member.name
              }))
            }}
            familyMembers={familyMembers}
            className="mb-6"
            initialFilter="family"
            onSelectHabit={null} // No habit selection needed
          />
        </div>

        {/* Historical Balance Trends - Radar Chart */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <History className="mr-2 text-indigo-600" size={20} />
                Balance Evolution
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                See how task distribution has evolved from your initial survey
              </p>
            </div>
            <div className="flex items-center gap-2">
              {historicalRadarData.length > 0 && (
                <select
                  value={selectedHistoricalWeek}
                  onChange={(e) => setSelectedHistoricalWeek(e.target.value)}
                  className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {historicalRadarData.map((week, index) => (
                    <option key={week.week} value={week.week}>
                      {index === 0 ? 'Initial Survey' : week.week}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="relative">
            {/* Radar Chart showing historical data */}
            <div className="flex justify-center">
              <svg width={400} height={400} className="overflow-visible">
                {/* Grid circles */}
                {[...Array(4)].map((_, i) => (
                  <circle
                    key={i}
                    cx={200}
                    cy={200}
                    r={(140 / 4) * (i + 1)}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="0.5"
                  />
                ))}

                {/* Grid lines for categories */}
                {radarData.map((cat, index) => {
                  const angle = (index * 2 * Math.PI) / radarData.length - Math.PI / 2;
                  const x = 200 + 140 * Math.cos(angle);
                  const y = 200 + 140 * Math.sin(angle);
                  return (
                    <line
                      key={cat.category}
                      x1={200}
                      y1={200}
                      x2={x}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeWidth="0.5"
                    />
                  );
                })}

                {/* Historical data paths */}
                {historicalRadarData.map((weekData, weekIndex) => {
                  const isSelected = weekData.week === selectedHistoricalWeek;
                  const opacity = isSelected ? 0.8 : 0.2;
                  const strokeWidth = isSelected ? 2 : 1;
                  
                  // Generate path for this week's data
                  const path = radarData.map((cat, index) => {
                    const angle = (index * 2 * Math.PI) / radarData.length - Math.PI / 2;
                    const value = weekData[cat.category.toLowerCase().replace(' ', '')] || 50;
                    const radius = (value / 100) * 140;
                    const x = 200 + radius * Math.cos(angle);
                    const y = 200 + radius * Math.sin(angle);
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ') + ' Z';

                  // Color based on week index
                  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
                  const color = colors[weekIndex % colors.length];

                  return (
                    <g key={weekData.week}>
                      <path
                        d={path}
                        fill={color}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        opacity={opacity}
                        className="transition-all duration-300"
                      />
                      {isSelected && (
                        // Show dots on selected week
                        radarData.map((cat, index) => {
                          const angle = (index * 2 * Math.PI) / radarData.length - Math.PI / 2;
                          const value = weekData[cat.category.toLowerCase().replace(' ', '')] || 50;
                          const radius = (value / 100) * 140;
                          const x = 200 + radius * Math.cos(angle);
                          const y = 200 + radius * Math.sin(angle);
                          return (
                            <circle
                              key={cat.category}
                              cx={x}
                              cy={y}
                              r={4}
                              fill={color}
                              stroke="white"
                              strokeWidth={2}
                            />
                          );
                        })
                      )}
                    </g>
                  );
                })}

                {/* Category labels */}
                {radarData.map((cat, index) => {
                  const angle = (index * 2 * Math.PI) / radarData.length - Math.PI / 2;
                  const labelRadius = 165;
                  const x = 200 + labelRadius * Math.cos(angle);
                  const y = 200 + labelRadius * Math.sin(angle);
                  
                  return (
                    <text
                      key={cat.category}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs fill-gray-700 font-medium"
                    >
                      {cat.category}
                    </text>
                  );
                })}

                {/* Scale labels */}
                {[25, 50, 75, 100].map((value, i) => (
                  <text
                    key={value}
                    x={200}
                    y={200 - (140 / 4) * (i + 1) - 5}
                    textAnchor="middle"
                    className="text-[10px] fill-gray-400"
                  >
                    {value}%
                  </text>
                ))}
              </svg>
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {historicalRadarData.map((weekData, index) => {
                const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
                const color = colors[index % colors.length];
                const isSelected = weekData.week === selectedHistoricalWeek;
                
                return (
                  <button
                    key={weekData.week}
                    onClick={() => setSelectedHistoricalWeek(weekData.week)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                      isSelected 
                        ? 'bg-gray-100 ring-2 ring-gray-300' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-gray-700">
                      {index === 0 ? 'Initial Survey' : weekData.week}
                    </span>
                    {weekData.overall && (
                      <span className="text-xs text-gray-500">
                        ({weekData.overall}% balanced)
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Balance Insights */}
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <TrendingUp size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-indigo-900">
                  Progress Analysis
                </h4>
                <p className="text-sm text-indigo-700 mt-1">
                  {(() => {
                    const firstWeek = historicalRadarData[0]?.overall || 50;
                    const currentBalance = balanceMetrics?.overallBalance || 50;
                    const improvement = currentBalance - firstWeek;
                    
                    if (improvement > 10) {
                      return `Excellent progress! You've improved balance by ${improvement}% since your initial survey. Keep redistributing those invisible tasks!`;
                    } else if (improvement > 0) {
                      return `Good start! You've improved by ${improvement}% since beginning. Focus on invisible parental tasks for bigger gains.`;
                    } else {
                      return `Time to refocus. Your balance has decreased by ${Math.abs(improvement)}% since starting. Consider redistributing invisible tasks.`;
                    }
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ELO Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ELOTugOfWar />
        <ELORatingsDisplay />
      </div>

      {/* Sibling Dynamics Widget */}
      {children.length >= 2 && siblingDynamics && (
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Users className="mr-2 text-purple-600" size={20} />
                Sibling Dynamics
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                How your children support and influence each other
              </p>
            </div>
            {siblingDynamics.totalTimeSaved > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{siblingDynamics.totalTimeSaved}h</div>
                <div className="text-xs text-gray-500">saved per week</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Teaching Relationships */}
            {siblingDynamics.teachingRelationships.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <GraduationCap size={20} className="text-blue-600" />
                  <h4 className="font-medium text-gray-900">Peer Teaching</h4>
                </div>
                <div className="space-y-2">
                  {siblingDynamics.teachingRelationships.slice(0, 3).map((teach, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium text-blue-700">{teach.teacher}</span>
                      <span className="text-gray-600"> teaches </span>
                      <span className="text-blue-600">{teach.students.join(', ')}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  65% more effective than parent-led teaching
                </p>
              </div>
            )}

            {/* Spillover Effects */}
            {siblingDynamics.spilloverEffects.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={20} className="text-purple-600" />
                  <h4 className="font-medium text-gray-900">Positive Influences</h4>
                </div>
                <div className="space-y-2">
                  {siblingDynamics.spilloverEffects.slice(0, 3).map((effect, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium text-purple-700">{effect.child}</span>
                      <span className="text-gray-600"> inspires siblings in </span>
                      <span className="text-purple-600">
                        {effect.influences[0]?.relationship?.properties?.type || 'multiple areas'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Academic success cascades to younger siblings
                </p>
              </div>
            )}

            {/* Collaboration Patterns */}
            {siblingDynamics.collaborations.length > 0 ? (
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={20} className="text-green-600" />
                  <h4 className="font-medium text-gray-900">Collaborations</h4>
                </div>
                <div className="space-y-2">
                  {siblingDynamics.collaborations.slice(0, 3).map((collab, idx) => (
                    <div key={idx} className="text-sm">
                      <span className="font-medium text-green-700">{collab.child}</span>
                      <span className="text-gray-600"> works with siblings on </span>
                      <span className="text-green-600">shared activities</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  Building teamwork and social skills
                </p>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={20} className="text-gray-600" />
                  <h4 className="font-medium text-gray-900">Opportunity</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Create more opportunities for sibling collaboration
                </p>
                <button 
                  onClick={async () => {
                    setLoadingSiblingData(true);
                    try {
                      const insights = await AllieAIService.generateInsights({
                        familyId,
                        type: 'sibling-dynamics',
                        children: children.map(c => ({ id: c.id, name: c.name, age: c.age })),
                        focus: 'collaboration-opportunities'
                      });
                      
                      // Format as sibling dynamics suggestions
                      if (insights && insights.length > 0) {
                        const formattedInsights = insights.map(insight => ({
                          ...insight,
                          icon: Users,
                          category: 'sibling-dynamics',
                          priority: 'high'
                        }));
                        
                        // Show the first suggestion in a modal
                        setSelectedInsight(formattedInsights[0]);
                        setShowInsightModal(true);
                        
                        // Also update the general insights
                        setAiInsights(prev => [...formattedInsights, ...prev].slice(0, 5));
                      }
                    } catch (error) {
                      console.error("Error generating sibling suggestions:", error);
                    } finally {
                      setLoadingSiblingData(false);
                    }
                  }}
                  disabled={loadingSiblingData}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingSiblingData ? 'Generating...' : 'Get suggestions →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weekly Progress */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Weekly Progress</h3>
            <p className="text-sm text-gray-600 mt-1">
              Family harmony and task completion trends
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            {['week', 'month'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedTimeframe(period)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeframe === period
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {weeklyProgress.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyProgress}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#8b5cf6"
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 size={48} className="text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No progress data available yet</p>
              <p className="text-sm text-gray-400 mt-2">Complete weekly surveys to track your progress</p>
            </div>
          </div>
        )}
      </div>


      {/* AI Insights Section */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
            <p className="text-sm text-gray-600 mt-1">
              Personalized recommendations based on your family's data
            </p>
          </div>
          <button 
            onClick={loadAIInsights}
            disabled={loadingInsights}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
          >
            {loadingInsights ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
            ) : (
              <>
                <Sparkles size={16} className="mr-1" />
                Refresh insights
              </>
            )}
          </button>
        </div>

        {loadingInsights && aiInsights.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-100 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : aiInsights.length > 0 ? (
          <div className="space-y-3">
            {aiInsights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedInsight(insight);
                    setShowInsightModal(true);
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      insight.priority === 'high' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      <Icon size={20} className={
                        insight.priority === 'high' ? 'text-purple-600' : 'text-blue-600'
                      } />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {insight.description}
                      </p>
                      <div className="flex items-center mt-2 text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          insight.priority === 'high' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {insight.priority} priority
                        </span>
                        {insight.category && (
                          <span className="ml-2 text-gray-500">
                            {insight.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-600 transition-colors mt-1" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Lightbulb size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Gathering insights from your family data...</p>
            <p className="text-sm text-gray-400 mt-2">Complete more surveys to get personalized recommendations</p>
          </div>
        )}
      </div>

      {/* Enhanced Dashboard Sections */}
      <HarmonyPulse />
      
      <MemberJourneys />
      
      {children.length > 0 && <ChildDevelopmentTracker />}
      
      {/* Timeline & History */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <History className="mr-2 text-indigo-600" size={20} />
              Family Timeline
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Your family's journey and milestones
            </p>
          </div>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all history
          </button>
        </div>
        
        {familyEvents.length > 0 ? (
          <div className="space-y-4">
            {/* Recent milestones */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              
              {familyEvents.slice(0, 5).map((item, idx) => {
                const Icon = item.icon;
                const colorClasses = {
                  green: 'bg-green-100 text-green-600',
                  yellow: 'bg-yellow-100 text-yellow-600',
                  blue: 'bg-blue-100 text-blue-600',
                  purple: 'bg-purple-100 text-purple-600'
                };
                const bgColor = colorClasses[item.color] || 'bg-gray-100 text-gray-600';
                
                return (
                  <div key={idx} className="relative flex items-start space-x-3 pb-4">
                    <div className={`absolute left-0 w-8 h-8 rounded-full ${bgColor.split(' ')[0]} border-4 border-white flex items-center justify-center`}>
                      <Icon size={16} className={bgColor.split(' ')[1]} />
                    </div>
                    <div className="ml-12">
                      <p className="text-sm font-medium text-gray-900">{item.event}</p>
                      <p className="text-xs text-gray-500">{item.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No events recorded yet</p>
            <p className="text-sm text-gray-400 mt-2">Complete surveys and tasks to build your family timeline</p>
          </div>
        )}
      </div>
      
      {/* Impact Hub */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <LayoutGrid className="mr-2 text-green-600" size={20} />
              Impact Hub
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              See how your habits create positive change
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity size={20} className="text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{taskRecommendations?.filter(t => t.completed).length || 0}</span>
            </div>
            <h4 className="font-medium text-gray-900">Tasks Completed</h4>
            <p className="text-sm text-gray-600 mt-1">This week's achievements</p>
          </div>
          
          <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock size={20} className="text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{Math.round((taskRecommendations?.reduce((sum, t) => sum + (t.weight || 1), 0) || 0) * 15)}</span>
            </div>
            <h4 className="font-medium text-gray-900">Minutes Saved</h4>
            <p className="text-sm text-gray-600 mt-1">Through better balance</p>
          </div>
          
          <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star size={20} className="text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{completedWeeks || 0}</span>
            </div>
            <h4 className="font-medium text-gray-900">Weeks Completed</h4>
            <p className="text-sm text-gray-600 mt-1">Consistent progress</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Responsive */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <button 
            className="bg-white rounded-lg p-4 text-left hover:shadow-md transition-shadow group"
            onClick={() => window.dispatchEvent(new CustomEvent('open-family-meeting'))}
          >
            <div className="flex items-center justify-between mb-2">
              <Calendar size={20} className="text-purple-600" />
              <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h4 className="font-medium text-gray-900">Schedule Family Meeting</h4>
            <p className="text-sm text-gray-600 mt-1">Plan your weekly check-in</p>
          </button>

          <button 
            className="bg-white rounded-lg p-4 text-left hover:shadow-md transition-shadow group"
            onClick={() => window.dispatchEvent(new CustomEvent('open-allie-chat'))}
          >
            <div className="flex items-center justify-between mb-2">
              <MessageSquare size={20} className="text-blue-600" />
              <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h4 className="font-medium text-gray-900">Chat with Allie</h4>
            <p className="text-sm text-gray-600 mt-1">Get personalized help and advice</p>
          </button>

          <button 
            className="bg-white rounded-lg p-4 text-left hover:shadow-md transition-shadow group"
            onClick={() => {
              // Navigate to survey tab to set priorities
              const surveyTab = document.querySelector('[data-tab="survey"]');
              if (surveyTab) surveyTab.click();
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Target size={20} className="text-green-600" />
              <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h4 className="font-medium text-gray-900">Set Family Goals</h4>
            <p className="text-sm text-gray-600 mt-1">Define what matters most</p>
          </button>
        </div>
      </div>

      {/* Insight Modal */}
      {showInsightModal && selectedInsight && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedInsight.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedInsight.insight || selectedInsight.description}
            </p>
            
            {selectedInsight.habitTitle && (
              <div className="bg-purple-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-purple-900 mb-2">
                  Suggested Habit: {selectedInsight.habitTitle}
                </h4>
                <p className="text-sm text-purple-700">
                  {selectedInsight.habitDescription}
                </p>
              </div>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => createHabitFromInsight(selectedInsight)}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
              >
                <Plus size={16} className="mr-2" />
                Create Habit
              </button>
              <button
                onClick={() => {
                  setShowInsightModal(false);
                  setSelectedInsight(null);
                }}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefreshedDashboardTab;