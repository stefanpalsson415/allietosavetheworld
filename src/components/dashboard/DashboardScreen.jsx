import React, { useState, useEffect } from 'react';
import { LogOut, Filter, Settings, Users, Heart, Info, Calendar, Bell, MessageSquare, Clipboard, Award, Layers, Dumbbell, Link, DollarSign, CheckSquare, LayoutGrid, Inbox, Trees } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import DashboardTab from './tabs/DashboardTab';
import TasksTab from './tabs/TasksTab';
import TaskBoardTab from './tabs/TaskBoardTab';
import RelationshipTab from './tabs/RelationshipTab';
import PowerFeaturesTab from './tabs/PowerFeaturesTab';
import CoOwnershipDashboard from '../coOwnership/CoOwnershipDashboard';
import AIKanbanBoard from '../kanban/AIKanbanBoard';
import HowThisWorksScreen from '../education/HowThisWorksScreen';
import PersonalizedApproachScreen from '../education/PersonalizedApproachScreen';
import UserSettingsScreen from '../user/UserSettingsScreen';
import FamilyMeetingScreen from '../meeting/FamilyMeetingScreen';
import AllieChatMeeting from '../meeting/AllieChatMeeting';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import AllieChat from '../chat/refactored/AllieChat';
import RelationshipMeetingScreen from '../meeting/RelationshipMeetingScreen';
import DashboardTutorial from '../onboarding/DashboardTutorial';
import ErrorBoundary from '../common/ErrorBoundary';
import ChildrenTrackingTab from './tabs/ChildrenTrackingTab';
import TaskSequencesTab from './tabs/TaskSequencesTab';
import ActivityTab from './tabs/ActivityTab';
import SurveyScreen from '../survey/SurveyScreen';
//import ClaudeService from '../../services/ClaudeService';
import { FloatingCalendar, EventRelationshipViewer } from '../calendar';
import UserAvatar from '../common/UserAvatar';
import { db, auth } from '../../services/firebase';
import ProactiveAlertsWidget from '../notifications/ProactiveAlertsWidget';
import { ChoreTab, BucksManagementTab, RewardsTab } from './tabs/chore';
import SimpleChoreTab from './tabs/SimpleChoreTab';
import FamilyInbox from '../inbox/FamilyInbox';
import FamilyTreeTab from './tabs/FamilyTreeTab';







const DashboardScreen = ({ onOpenFamilyMeeting }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const { 
    selectedUser, 
    familyMembers,
    completedWeeks,
    currentWeek,
    familyName,
    familyId,
    familyPicture,
    taskRecommendations
  } = useFamily();
  
  const { loadFamilyData, currentUser } = useAuth();
  const [showMeetingTypeModal, setShowMeetingTypeModal] = useState(false);


  const [aiInsights, setAiInsights] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeComponent, setActiveComponent] = useState(null);
  const [showFamilyMeeting, setShowFamilyMeeting] = useState(false);
  const [meetingType, setMeetingType] = useState('standard'); // 'standard' or 'chat'
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [insights, setInsights] = useState([]);
  const [showRelationshipMeeting, setShowRelationshipMeeting] = useState(false);
  const [showEventRelationships, setShowEventRelationships] = useState(false);
  const [notifications, setNotifications] = useState({
    tasks: 0,
    taskBoard: 0,
    relationships: 0,
    dashboard: 0,
    tokens: 0
  });
  const [showRelationshipTab, setShowRelationshipTab] = useState(true);
  const [showTaskSequencesTab, setShowTaskSequencesTab] = useState(true);

  //const [allieAIService, setAllieAIService] = useState(null);

  // Calculate notifications
  useEffect(() => {
    // Count incomplete tasks for task tab notification
    const incompleteTasks = taskRecommendations ? 
      taskRecommendations.filter(t => !t.completed && canCompleteTask(t)).length : 0;
    
    // Simple placeholder for relationship notifications (replace with real logic)
    const relationshipNotifs = selectedUser?.role === 'parent' ? 2 : 0;
    
    setNotifications({
      tasks: incompleteTasks,
      taskBoard: 0,  // Will be populated by Kanban board tasks
      relationships: relationshipNotifs, 
      dashboard: 0,  // Add dashboard notifications if needed
      tokens: 0      // Add token notifications if needed
    });
    
    // Load tab visibility preferences from localStorage and user settings
    const storedRelationshipTab = localStorage.getItem('showRelationshipTab');
    const storedTaskSequencesTab = localStorage.getItem('showTaskSequencesTab');
    
    // Check localStorage first (for immediate changes), then user settings (for persistence)
    const shouldShowRelationshipTab = storedRelationshipTab !== null 
      ? storedRelationshipTab === 'true' 
      : selectedUser?.settings?.showRelationshipTab !== false;
      
    const shouldShowTaskSequencesTab = storedTaskSequencesTab !== null 
      ? storedTaskSequencesTab === 'true' 
      : selectedUser?.settings?.showTaskSequencesTab !== false;
    
    setShowRelationshipTab(shouldShowRelationshipTab);
    setShowTaskSequencesTab(shouldShowTaskSequencesTab);
    
    // If the currently active tab is being hidden, switch to the main tasks tab
    if ((activeTab === 'relationship' && !shouldShowRelationshipTab) || 
        (activeTab === 'sequences' && !shouldShowTaskSequencesTab)) {
      setActiveTab('tasks');
    }
    
  }, [taskRecommendations, selectedUser, activeTab]);

  // Check if user can complete a task (helper for notifications)
  const canCompleteTask = (task) => {
    return selectedUser && 
           selectedUser.role === 'parent' && 
           (selectedUser.name === task.assignedToName || 
            selectedUser.roleType === task.assignedTo);
  };

  // Check if we should show the tutorial
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem('dashboardTutorialCompleted');
    const isFirstDashboardVisit = !tutorialCompleted;
    
    if (isFirstDashboardVisit) {
      // We'll show the tutorial after a small delay to ensure dashboard is fully loaded
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Set tab based on URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');

    if (tab && ['dashboard', 'tasks', 'relationship', 'children', 'sequences', 'power-features', 'co-ownership', 'coownership'].includes(tab)) {
      // Handle both 'coownership' (from URL) and 'co-ownership' (internal)
      setActiveTab(tab === 'coownership' ? 'co-ownership' : tab);
    }
  }, [location]);

  // Listen for tab switch events
  useEffect(() => {
    const handleTabSwitch = (event) => {
      if (event.detail && event.detail.tab) {
        setActiveTab(event.detail.tab);
      }
    };

    const dashboardElement = document.querySelector('[data-dashboard-container]');
    if (dashboardElement) {
      dashboardElement.addEventListener('switch-tab', handleTabSwitch);
    }

    return () => {
      if (dashboardElement) {
        dashboardElement.removeEventListener('switch-tab', handleTabSwitch);
      }
    };
  }, []);

  // Consolidated family loading from all possible sources
  useEffect(() => {
    const loadFamilyFromAllSources = async () => {
      // Don't try loading if we already have data or are already loading
      if (loadingFamily || (selectedUser && familyMembers && familyMembers.length > 0)) {
        console.log("Family already loaded or loading in progress, skipping additional loading attempts");
        return;
      }
      
      setLoadingFamily(true);
      setLoadError(null);
      
      try {
        // Check URL parameters first
        const params = new URLSearchParams(window.location.search);
        const urlFamilyId = params.get('forceFamilyId') || params.get('family');
        
        // Then check router state
        const routerFamilyId = location.state?.directAccess && location.state?.familyId;
        
        // Then check localStorage
        let storageFamilyId;
        try {
          const directAccess = localStorage.getItem('directFamilyAccess');
          if (directAccess) {
            const { familyId, timestamp } = JSON.parse(directAccess);
            // Check if this is recent (within last 30 seconds)
            const now = new Date().getTime();
            if (now - timestamp < 30000) {
              storageFamilyId = familyId;
            } else {
              localStorage.removeItem('directFamilyAccess');
            }
          }
        } catch (e) {
          console.error("Error reading from localStorage:", e);
          localStorage.removeItem('directFamilyAccess');
        }
        
        // Then check regular localStorage
        const regularStorageFamilyId = localStorage.getItem('selectedFamilyId');
        
        // Use the first valid ID we find, in priority order
        const familyIdToLoad = urlFamilyId || routerFamilyId || storageFamilyId || regularStorageFamilyId;
        
        if (familyIdToLoad) {
          console.log("Loading family from detected source:", familyIdToLoad);
          await loadFamilyData(familyIdToLoad);
          console.log("Family loaded successfully");
          
          // Clear storage after successful load
          if (regularStorageFamilyId) {
            localStorage.removeItem('selectedFamilyId');
          }
          if (storageFamilyId) {
            localStorage.removeItem('directFamilyAccess');
          }
        }
      } catch (error) {
        console.error("Error in family loading process:", error);
        setLoadError(error.message || "Failed to load family data");
      } finally {
        setLoadingFamily(false);
      }
    };
    
    loadFamilyFromAllSources();
  }, [selectedUser, familyMembers, location, loadFamilyData, familyId, currentWeek]);

  const loadDashboardData = async () => {
    try {
      // If we need to load family data, do it here
      if (familyId) {
        console.log(`Loading dashboard data for family: ${familyId}`);
        
        // Any other data loading you need to do...
        
        // Load AI insights using dynamic import
        if (currentWeek) {
          try {
            console.log("Loading AI insights...");
            // Dynamically import to avoid circular dependencies
            const module = await import('../../services/AllieAIService');
            const AllieAIService = module.default;
            
            const aiInsights = await AllieAIService.generateDashboardInsights(
              familyId,
              currentWeek
            );
            
            // Handle both array format and object with insights property
            if (Array.isArray(aiInsights)) {
              setInsights(aiInsights);
            } else if (aiInsights && aiInsights.insights && Array.isArray(aiInsights.insights)) {
              setInsights(aiInsights.insights);
            }
            
            console.log("AI insights loaded:", aiInsights);
          } catch (insightError) {
            console.error("Error loading AI insights:", insightError);
            // Failure to load insights shouldn't block the whole dashboard
          }
        } else {
          console.log("Skipping AI insights - missing currentWeek data");
        }
      } else {
        console.warn("No family ID available, can't load dashboard data");
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  };

  // In DashboardScreen.jsx - Add this to the useEffect that loads the dashboard
  useEffect(() => {
    // Modified to use dynamic import with proper error handling
    const testClaudeConnection = async () => {
      try {
        // Use dynamic import to avoid circular dependencies
        const ClaudeModule = await import('../../services/ClaudeService.js');
        const ClaudeService = ClaudeModule.default;
        
        console.log("Testing Claude API connection...");
        // Only call testConnection if it exists
        if (ClaudeService && typeof ClaudeService.testConnection === 'function') {
          const result = await ClaudeService.testConnection();
          console.log("Claude API connection test result:", result);
        } else {
          console.log("Claude service loaded but testConnection method not found");
        }
      } catch (error) {
        console.error("Error testing Claude connection:", error);
      }
    };
    
    testClaudeConnection();
  }, []);

  // Load AI insights directly without maintaining service reference in state
useEffect(() => {
  const loadAIInsights = async () => {
    if (!familyId || !currentWeek) return;
    
    try {
      // Use dynamic import instead of maintaining service in state
      const module = await import('../../services/AllieAIService');
      const AllieAIService = module.default;
      console.log("AllieAIService loaded successfully");
      
      // Generate dashboard insights
      const insights = await AllieAIService.generateDashboardInsights(familyId, currentWeek);
      
      if (insights) {
        // Handle both array format and object with insights property
        if (Array.isArray(insights)) {
          setAiInsights(insights);
        } else if (insights.insights && Array.isArray(insights.insights)) {
          setAiInsights(insights.insights);
        }
        console.log("AI insights loaded successfully");
      }
    } catch (error) {
      console.error("Error loading AI insights:", error);
    }
  };
  
  loadAIInsights();
}, [familyId, currentWeek]);
  





  // Redirect if no user is selected after loading attempt completes
  // Redirect if no user is selected or initial survey incomplete
  useEffect(() => {
    if (!selectedUser && !loadingFamily) {
      navigate('/');
      return;
    }
    
    // If user exists but hasn't completed initial survey, redirect to survey
    if (selectedUser && !loadingFamily && !selectedUser.completed) {
      console.log("User hasn't completed initial survey, redirecting to survey");
      navigate('/survey');
    }
  }, [selectedUser, navigate, loadingFamily]);
  
  // Handle logout/switch user
  const handleLogout = () => {
    navigate('/login');
  };
  
  const handleOpenRelationshipMeeting = () => {
    setShowRelationshipMeeting(true);
  };
  
  const handleCloseRelationshipMeeting = () => {
    setShowRelationshipMeeting(false);
  };

  // Start weekly check-in
  const handleStartWeeklyCheckIn = () => {
    navigate('/weekly-check-in');
  };

  // Handle settings toggle
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };
  
  const handleOpenFamilyMeeting = () => {
    console.log("Opening family meeting");
    // Always start with the standard meeting's intro screen
    // User will choose between standard and chat there
    setMeetingType('standard');
    setShowFamilyMeeting(true);
  };


// Add this function to handle meeting type selection
const selectMeetingType = (type) => {
  console.log(`Selected meeting type: ${type}`);
  setMeetingType(type);
  setShowMeetingTypeModal(false);
  setShowFamilyMeeting(true);
};
  
  const handleCloseFamilyMeeting = () => {
    console.log("Closing family meeting dialog");
    setShowFamilyMeeting(false);
  };
  
  // If still loading, show a loading indicator
  if (loadingFamily) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent border-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-roboto">Loading your family data...</p>
          <p className="text-sm text-gray-500 font-roboto mt-2">This will just take a moment</p>
        </div>
      </div>
    );
  }
  
  // If we have a load error, show error screen
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 font-roboto">Error Loading Family</h2>
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">
            {loadError}
          </div>
          <p className="mb-4 font-roboto">Please try the following:</p>
          <ul className="list-disc pl-5 mb-6 space-y-2 font-roboto">
            <li>Check your internet connection</li>
            <li>Refresh the page</li>
            <li>Log in again</li>
          </ul>
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 font-roboto"
            >
              Refresh Page
            </button>
            <button 
              onClick={handleLogout} 
              className="px-4 py-2 border border-black text-black rounded hover:bg-gray-50 font-roboto"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  const openFamilyMeeting = (type = 'standard') => {
    setMeetingType(type);
    setShowFamilyMeeting(true);
  };
  
  {/* Family Meeting Modal */}
{showFamilyMeeting && (
  <FamilyMeetingScreen onClose={handleCloseFamilyMeeting} />
)}
  
  {/* Meeting Type Selection Modal */}
{showMeetingTypeModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg max-w-md w-full p-6">
      <h3 className="text-xl font-bold mb-4">Select Meeting Type</h3>
      <p className="text-gray-600 mb-6">How would you like to run your family meeting?</p>
      
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => selectMeetingType('standard')}
          className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
        >
          <div className="p-3 bg-blue-100 rounded-full mr-4">
            <Users size={24} className="text-blue-600" />
          </div>
          <div className="text-left">
            <h4 className="font-medium mb-1">Structured Meeting</h4>
            <p className="text-sm text-gray-500">Guided format with steps for discussion</p>
          </div>
        </button>
        
        <button
          onClick={() => selectMeetingType('chat')}
          className="flex items-center p-4 border rounded-lg hover:bg-gray-50"
        >
          <div className="p-3 bg-purple-100 rounded-full mr-4">
            <MessageSquare size={24} className="text-purple-600" />
          </div>
          <div className="text-left">
            <h4 className="font-medium mb-1">Allie Chat Meeting</h4>
            <p className="text-sm text-gray-500">Let Allie guide your meeting conversation-style</p>
          </div>
        </button>
      </div>
      
      <button
        onClick={() => setShowMeetingTypeModal(false)}
        className="mt-6 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
    </div>
  </div>
)}



  /// Generate tab content based on active tab
const renderTabContent = () => {
  switch (activeTab) {
    case 'how-it-works':
      return <HowThisWorksScreen />;
    case 'personalized':
      return <PersonalizedApproachScreen />;
    case 'relationship':
      return <RelationshipTab onOpenRelationshipMeeting={handleOpenRelationshipMeeting} />;
    case 'dashboard':
      return <DashboardTab />;
    case 'power-features':
      return <PowerFeaturesTab />;
    case 'co-ownership':
      return <CoOwnershipDashboard />;
    case 'tasks':
      return <TasksTab
        onStartWeeklyCheckIn={handleStartWeeklyCheckIn}
        onOpenFamilyMeeting={handleOpenFamilyMeeting}
        onSwitchTab={(tab) => setActiveTab(tab)}
      />;
    case 'task-board':
      return <AIKanbanBoard />;
    case 'children':
      return <ChildrenTrackingTab />;
    case 'sequences':
      return <TaskSequencesTab />;
    // New chore management tabs
    case 'chores':
      return <SimpleChoreTab />;
    case 'rewards':
      return <RewardsTab />;
    case 'bucks':
      return <BucksManagementTab />;
    case 'family-tree':
      return <FamilyTreeTab />;
    default:
      return <div>Select a tab</div>;
  }
};
  
  
  // If no user is selected, return loading
  if (!selectedUser) {
    return <div className="flex items-center justify-center h-screen font-roboto">Loading...</div>;
  }

  // Format family name for display
  const displayFamilyName = familyName || "Family";
  const formattedFamilyName = `${displayFamilyName} Family AI Balancer`;
  
  // Calculate heights for fixed elements
  const headerHeight = "96px"; // Increased height for better spacing
  const navHeight = "80px";    // Increased height for larger navigation tabs
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" data-dashboard-container>
      {/* Header */}
<div className="fixed top-0 left-0 right-0 z-20 bg-black text-white py-4 px-6 shadow-md" style={{ height: headerHeight }}>
  <div className="container mx-auto flex justify-between items-center">
    <div className="flex items-center space-x-4">
      {/* Family photo - UPDATED to use UserAvatar */}
      <div className="hidden md:block">
        <UserAvatar 
          user={{ 
            name: familyName || 'Family', 
            profilePicture: familyPicture,
            id: familyId 
          }} 
          size={48} 
          className="border-2 border-white shadow-lg rounded-lg"
        />
      </div>
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold font-roboto">Allie</h1>
        <p className="text-sm font-roboto">Balance family responsibilities together</p>
        <p className="text-xs text-gray-300 font-roboto mt-1">The {familyName ? familyName.split(' ')[0] : ''} Family</p>
      </div>
    </div>
    <div className="flex items-center space-x-4">
      {/* User avatar - UPDATED to use UserAvatar */}
      <div 
        onClick={toggleSettings}
        className="cursor-pointer flex items-center space-x-2"
      >
        <UserAvatar 
          user={selectedUser} 
          size={36} 
          className="border-2 border-white"
        />
        <span className="font-roboto">{selectedUser.name}</span>
      </div>
      <button 
        onClick={handleLogout}
        className="flex items-center text-sm bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded font-roboto"
      >
        <LogOut size={14} className="mr-2" />
        Switch User
      </button>
      <button 
        onClick={async () => {
          try {
            const ClaudeService = (await import('../../services/ClaudeService')).default;
            console.log("Testing proxy connection directly...");
            const result = await ClaudeService.testProxyConnection();
            console.log("Proxy test result:", result);
            alert("Proxy test result: " + (result ? "Success" : "Failed"));
          } catch (error) {
            console.error("Error testing proxy:", error);
            alert("Error testing proxy: " + error.message);
          }
        }}
        className="px-3 py-2 bg-red-600 text-white text-xs rounded"
      >
        Test Proxy
      </button>
    </div>
  </div>
</div>
      
      {/* Navigation Tabs */}
<div 
  className="fixed left-0 right-0 z-10 bg-white shadow-md" 
  style={{ top: headerHeight, height: navHeight }}
>
  <div className="container mx-auto flex overflow-x-auto px-6 py-3">
    <button 
      id="tasks-tab"
      className={`px-8 py-3 text-lg font-medium whitespace-nowrap font-roboto rounded-lg transition-all mx-2 relative ${
        activeTab === 'tasks' 
          ? 'bg-black text-white shadow-sm' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
      onClick={() => setActiveTab('tasks')}
    >
      Balance & Habits
      {notifications.tasks > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
          {notifications.tasks}
        </span>
      )}
    </button>
    
    <button 
      id="task-board-tab"
      className={`px-8 py-3 text-lg font-medium whitespace-nowrap font-roboto rounded-lg transition-all mx-2 relative flex items-center ${
        activeTab === 'task-board' 
          ? 'bg-black text-white shadow-sm' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
      onClick={() => setActiveTab('task-board')}
    >
      <LayoutGrid size={20} className="mr-2" />
      Task Board
      {notifications.taskBoard > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
          {notifications.taskBoard}
        </span>
      )}
    </button>
    
    <button 
      id="dashboard-tab"
      className={`px-8 py-3 text-lg font-medium whitespace-nowrap font-roboto rounded-lg transition-all mx-2 ${
        activeTab === 'dashboard' 
          ? 'bg-black text-white shadow-sm' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
      onClick={() => setActiveTab('dashboard')}
    >
      Family Dashboard
    </button>

    <button
      id="power-features-tab"
      className={`px-8 py-3 text-lg font-medium whitespace-nowrap font-roboto rounded-lg transition-all mx-2 relative ${
        activeTab === 'power-features'
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
          : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-purple-700'
      }`}
      onClick={() => setActiveTab('power-features')}
    >
      <span className="flex items-center">
        ✨ Power Features
      </span>
    </button>

    <button
      id="co-ownership-tab"
      className={`px-8 py-3 text-lg font-medium whitespace-nowrap font-roboto rounded-lg transition-all mx-2 relative ${
        activeTab === 'co-ownership'
          ? 'bg-gradient-to-r from-purple-600 to-teal-600 text-white shadow-lg'
          : 'text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-teal-50 hover:text-purple-700'
      }`}
      onClick={() => setActiveTab('co-ownership')}
    >
      <span className="flex items-center gap-2">
        <Users className="w-5 h-5" />
        Co-Ownership
      </span>
    </button>

    {/* Relationship Tab - Only shown if enabled in settings */}
    {selectedUser && showRelationshipTab && (
      <button 
        id="relationship-tab"
        className={`px-8 py-3 text-lg font-medium whitespace-nowrap font-roboto rounded-lg transition-all mx-2 relative ${
          activeTab === 'relationship' 
            ? 'bg-black text-white shadow-sm' 
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => setActiveTab('relationship')}
      >
        Strong Relationship
        {notifications.relationships > 0 && selectedUser.role === 'parent' && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {notifications.relationships}
          </span>
        )}
      </button>
    )}
    
    

    {/* Children Tracking Tab */}
    <button 
      id="children-tab"
      className={`px-8 py-3 text-lg font-medium whitespace-nowrap font-roboto rounded-lg transition-all mx-2 ${
        activeTab === 'children' 
          ? 'bg-black text-white shadow-sm' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
      onClick={() => setActiveTab('children')}
    >
      Family Command Center
    </button>
    
    {/* Task Sequences Tab - Only shown if enabled in settings */}
    {showTaskSequencesTab && (
      <button
        id="sequences-tab"
        className={`px-8 py-3 text-lg font-medium whitespace-nowrap font-roboto rounded-lg transition-all mx-2 flex items-center ${
          activeTab === 'sequences'
            ? 'bg-black text-white shadow-sm'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
        onClick={() => setActiveTab('sequences')}
      >
        <Layers size={20} className="mr-2" /> Task Sequences
      </button>
    )}

    {/* Activities Tab - Moved to Family Command Center */}

    {/* Chores Tab */}
    <button 
      id="chores-tab"
      className={`px-8 py-3 text-lg font-medium whitespace-nowrap font-roboto rounded-lg transition-all mx-2 flex items-center ${
        activeTab === 'chores' 
          ? 'bg-black text-white shadow-sm' 
          : 'text-gray-700 hover:bg-gray-100'
      }`}
      onClick={() => setActiveTab('chores')}
    >
      <CheckSquare size={20} className="mr-2" /> Chore Chart
    </button>
    
  </div>
</div>
      
      {/* Main Content */}
      <div 
        className="container mx-auto px-4 pb-6" 
        style={{ paddingTop: `calc(${headerHeight} + ${navHeight} + 1rem)` }}
      >
        <ErrorBoundary>
          {/* Tab content */}
          {renderTabContent()}
        </ErrorBoundary>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <UserSettingsScreen onClose={toggleSettings} />
      )}

      {/* Family Meeting Modal */}
      {showFamilyMeeting && (
        <FamilyMeetingScreen onClose={handleCloseFamilyMeeting} />
      )}

      {/* Relationship Meeting Modal */}
      {showRelationshipMeeting && (
        <RelationshipMeetingScreen onClose={handleCloseRelationshipMeeting} />
      )}
      
      {/* Event Relationship Viewer */}
      {showEventRelationships && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-5/6 flex flex-col overflow-hidden">
            <EventRelationshipViewer 
              onClose={() => setShowEventRelationships(false)}
              onSelectEvent={(eventId) => {
                // In a real implementation, you might navigate to the event
                console.log(`Selected event from graph: ${eventId}`);
                window.dispatchEvent(new CustomEvent('show-calendar-event', { 
                  detail: { eventId } 
                }));
                setShowEventRelationships(false);
              }}
            />
          </div>
        </div>
      )}
      
      {/* Allie Chat Widget - Commented out to prevent conflict with TaskDrawer */}
      {/* <div id="chat-button">
        <AllieChat />
      </div> */}
      
      {/* Calendar widget is now being rendered by App.js using the new component */}
      
      {/* Proactive Alerts Widget */}
      <ProactiveAlertsWidget 
        position="bottom-left"
        onSelectEvent={(eventId) => {
          // In a real implementation, you might navigate to the event or open the calendar
          console.log(`Opening event: ${eventId}`);
          // For example, show a calendar view focused on this event
          window.dispatchEvent(new CustomEvent('show-calendar-event', { 
            detail: { eventId } 
          }));
        }}
      />
      
      {/* Event Relationship Button */}
      <div className="fixed bottom-36 left-4 z-30">
        <button
          onClick={() => setShowEventRelationships(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg flex items-center justify-center"
          title="View Event Relationships"
        >
          <Link size={20} />
        </button>
      </div>
      
      {/* Tutorial */}
      {showTutorial && (
        <DashboardTutorial 
          onComplete={() => setShowTutorial(false)} 
        />
      )}
    </div>
  );
};

export default DashboardScreen;