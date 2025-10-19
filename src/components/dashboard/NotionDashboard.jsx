// src/components/dashboard/NotionDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar, Heart, AlertCircle, Gift, Database, FileText, User,
  Plus, RefreshCw, ChevronRight, Layers, Users
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useEvents } from '../../contexts/EventContext';
import { useUnifiedEvent } from '../../contexts/UnifiedEventContext';
import NotionLayout from '../layout/NotionLayout';
import NotionCard, { NotionPill, NotionProgressBar } from '../common/NotionCard';
import UserAvatar from '../common/UserAvatar';

// Import the tabs
import RefreshedDashboardTab from './tabs/RefreshedDashboardTab';
import HomeTab from './tabs/HomeTab';
import TasksTab from './tabs/TasksTab';
import AIKanbanBoard from '../kanban/AIKanbanBoard';
import RelationshipTab from './tabs/RelationshipTab';
import ChildrenTrackingTab from './tabs/ChildrenTrackingTab';
import TaskSequencesTab from './tabs/TaskSequencesTab';
import NotionCalendarTab from './tabs/NotionCalendarTab';
// Old knowledge graph tabs - replaced with new Knowledge Graph system
// import KnowledgeTab from './tabs/KnowledgeTab';
// import PowerfulKnowledgeGraphTab from './tabs/PowerfulKnowledgeGraphTab';
import KnowledgeGraphHub from '../knowledgeGraph/KnowledgeGraphHub';
import AllieChatTab from './tabs/AllieChatTab';
import KidsSectionAdminTab from './tabs/ChoreAndRewardAdminTab';  // Note: file name unchanged, component renamed
// Import chore-related tabs
import { ChoreTab, BucksManagementTab, RewardsTab } from './tabs/chore';
import SimpleChoreTab from './tabs/SimpleChoreTab';
import ClosetCompanionTab from './tabs/ClosetCompanionTab';
import NewGiftIdeasTrackerTab from './tabs/NewGiftIdeasTrackerTab';
import SiblingDynamicsTab from './tabs/SiblingDynamicsTab';
import FamilyTreeTab from './tabs/FamilyTreeTab';
// import FamilyTreeTab from './tabs/FamilyTreeTabSimple';
import FamilyDocumentHub from '../documents/FamilyDocumentHub';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import HabitHelperTab from '../habits/HabitHelperTab';
import UserSettingsScreen from '../user/UserSettingsScreen';
import CoOwnershipDashboard from '../coOwnership/CoOwnershipDashboard';
// import SurveyStatusChecker from './SurveyStatusChecker'; // Disabled - dev tool only
// Family meeting is now handled via routing

const NotionDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedUser, familyMembers, taskRecommendations, familyId } = useFamily();
  const { events, refreshEvents } = useEvents();
  const { openFamilyMeeting } = useChatDrawer();
  const [activeTab, setActiveTab] = useState('home');
  const [showRelationshipTab, setShowRelationshipTab] = useState(false);
  const [showTaskSequencesTab, setShowTaskSequencesTab] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Load tab visibility settings from localStorage
  useEffect(() => {
    const storedRelationshipTab = localStorage.getItem('showRelationshipTab');
    const storedTaskSequencesTab = localStorage.getItem('showTaskSequencesTab');

    // Default to FALSE (OFF) for new families - only show if explicitly enabled
    setShowRelationshipTab(storedRelationshipTab === 'true');
    setShowTaskSequencesTab(storedTaskSequencesTab === 'true');
  }, []);
  
  // Listen for custom event to open family meeting from calendar tab
  useEffect(() => {
    const handleOpenMeetingFromCalendar = () => {
      console.log("NotionDashboard: Received event to open family meeting from calendar");
      openFamilyMeeting();
    };
    
    window.addEventListener('open-family-meeting-from-calendar', handleOpenMeetingFromCalendar);
    
    return () => {
      window.removeEventListener('open-family-meeting-from-calendar', handleOpenMeetingFromCalendar);
    };
  }, [openFamilyMeeting]);
  
  // Set tab based on URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    
    // Handle tab selection
    if (tab && ['dashboard', 'home', 'tasks', 'taskboard', 'relationship', 'sequences', 'calendar', 'documents', 'knowledge', 'powerfulKnowledgeGraph', 'chat', 'chore-admin', 'chores', 'rewards', 'bucks', 'wardrobe', 'gifts', 'siblings', 'family-tree', 'habit-helper', 'co-ownership', 'coownership'].includes(tab)) {
      setActiveTab(tab === 'coownership' ? 'co-ownership' : tab);
    }

    // Check for openMeeting parameter to open family meeting in drawer
    const openMeeting = params.get('openMeeting');
    if (openMeeting === 'true') {
      console.log("NotionDashboard: Detected openMeeting parameter, opening in drawer");
      openFamilyMeeting();
      // Remove the parameter from the URL
      params.delete('openMeeting');
      navigate(`/dashboard?${params.toString()}`, { replace: true });
    }
  }, [location.search, navigate, openFamilyMeeting]);
  
  // Listen for settings open event
  useEffect(() => {
    const handleOpenSettings = (event) => {
      console.log("NotionDashboard: Opening settings modal", event.detail);
      setShowSettings(true);
      
      // If a specific tab is requested, dispatch event to switch to it after modal opens
      if (event.detail && event.detail.tab) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('switch-settings-tab', { detail: { tab: event.detail.tab } }));
        }, 100);
      }
    };
    
    window.addEventListener('open-settings-modal', handleOpenSettings);
    
    return () => {
      window.removeEventListener('open-settings-modal', handleOpenSettings);
    };
  }, []);

  // Listen for navigate-to-tab event (from UnifiedInbox when viewing tasks)
  useEffect(() => {
    const handleNavigateToTab = (event) => {
      console.log("NotionDashboard: Navigate to tab event:", event.detail);
      if (event.detail && event.detail.tab) {
        setActiveTab(event.detail.tab);
      }
    };
    
    window.addEventListener('navigate-to-tab', handleNavigateToTab);
    
    return () => {
      window.removeEventListener('navigate-to-tab', handleNavigateToTab);
    };
  }, []);
  
  // Helper to get upcoming events
  const getUpcomingEvents = () => {
    if (!events) return [];
    
    const now = new Date();
    return events
      .filter(event => new Date(event.dateTime) > now)
      .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime))
      .slice(0, 3);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not scheduled";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: 'numeric' 
    });
  };
  
  // Get incomplete tasks count
  const getIncompleteTasks = () => {
    if (!taskRecommendations) return [];
    return taskRecommendations.filter(task => !task.completed);
  };
  
  // Render tab content based on active tab
  const renderTabContent = () => {
    console.log(`Rendering tab content for activeTab: ${activeTab}`);
    
    switch (activeTab) {
      case 'dashboard':
        return <RefreshedDashboardTab />;
      case 'home':
        return <HomeTab />;
      case 'tasks':
        return <TasksTab onOpenFamilyMeeting={handleOpenFamilyMeeting} onStartWeeklyCheckIn={handleStartWeeklyCheckIn} />;
      case 'taskboard':
        return <AIKanbanBoard />;
      case 'relationship':
        return showRelationshipTab ? <RelationshipTab /> : <TasksTab onOpenFamilyMeeting={handleOpenFamilyMeeting} onStartWeeklyCheckIn={handleStartWeeklyCheckIn} />;
      case 'calendar':
        return <NotionCalendarTab />;
      case 'documents':
        return <FamilyDocumentHub />;
      case 'knowledge':
        // New Knowledge Graph with D3.js visualization + chat interface
        return <KnowledgeGraphHub />;
      case 'powerfulKnowledgeGraph':
        // Redirect to new knowledge graph
        return <KnowledgeGraphHub />;
      case 'co-ownership':
      case 'coownership':
        return <CoOwnershipDashboard />;
      case 'sequences':
        return showTaskSequencesTab ? <TaskSequencesTab /> : <TasksTab onOpenFamilyMeeting={handleOpenFamilyMeeting} onStartWeeklyCheckIn={handleStartWeeklyCheckIn} />;
      case 'chat':
        console.log("Rendering AllieChatTab");
        return <AllieChatTab />;
      // Parent admin panel  
      case 'chore-admin':
        return selectedUser?.role === 'parent' ? <KidsSectionAdminTab /> : <TasksTab onOpenFamilyMeeting={handleOpenFamilyMeeting} onStartWeeklyCheckIn={handleStartWeeklyCheckIn} />;
      // Add chore-related tabs
      case 'chores':
        return <SimpleChoreTab />;
      case 'rewards':
        return <RewardsTab />;
      case 'bucks':
        return <BucksManagementTab />;
      case 'wardrobe':
        return <ClosetCompanionTab />;
      case 'gifts':
        return <NewGiftIdeasTrackerTab />;
      case 'siblings':
        return <SiblingDynamicsTab />;
      case 'family-tree':
        return <FamilyTreeTab />;
      case 'habit-helper':
        return <HabitHelperTab />;
      default:
        console.log(`Using default tab (TasksTab) for unknown tab: ${activeTab}`);
        return <TasksTab onOpenFamilyMeeting={handleOpenFamilyMeeting} onStartWeeklyCheckIn={handleStartWeeklyCheckIn} />;
    }
  };
  
  // Handle opening a family meeting
  const handleOpenFamilyMeeting = useCallback(() => {
    console.log("NotionDashboard: Opening family meeting in chat drawer");
    
    // Open the family meeting in the chat drawer
    openFamilyMeeting();
  }, [openFamilyMeeting]);
  
  
  // Handle starting the weekly check-in
  const handleStartWeeklyCheckIn = () => {
    window.dispatchEvent(new CustomEvent('start-weekly-check-in'));
  };
  
  // Handle tab change with URL update
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/dashboard?tab=${tab}`, { replace: true });
  };
  
  return (
    <>
      <NotionLayout title={
      activeTab === 'home' ? "Home" :
      activeTab === 'tasks' ? "Balance & Habits" :
      activeTab === 'dashboard' ? "Family Dashboard" :
      activeTab === 'relationship' ? "Strong Relationship" :
      activeTab === 'calendar' ? "Family Calendar" :
      activeTab === 'documents' ? "Document Hub" :
      activeTab === 'taskboard' ? "Task Board" :
      activeTab === 'knowledge' ? "Knowledge Graph" :
      activeTab === 'powerfulKnowledgeGraph' ? "Family Insights" :
      activeTab === 'co-ownership' ? "Mental Load Redistribution" :
      activeTab === 'coownership' ? "Mental Load Redistribution" :
      activeTab === 'sequences' ? "Task Sequences" :
      activeTab === 'chat' ? "Allie Chat" :
      activeTab === 'chore-admin' ? "Kids Section Admin" :
      activeTab === 'chores' ? "Chore Chart" :
      activeTab === 'rewards' ? "Reward Party" :
      activeTab === 'bucks' ? "My Palsson Bucks" :
      activeTab === 'wardrobe' ? "Closet Companion" :
      activeTab === 'gifts' ? "Gift Wishes" :
      activeTab === 'siblings' ? "Sibling Dynamics" :
      activeTab === 'family-tree' ? "Family Tree" :
      activeTab === 'habit-helper' ? "Habit Helper" : "Dashboard"
    }>
      {/* Use full width for calendar, taskboard, knowledge graph, and co-ownership, constrained width for others */}
      {(activeTab === 'calendar' || activeTab === 'taskboard' || activeTab === 'knowledge' || activeTab === 'powerfulKnowledgeGraph' || activeTab === 'co-ownership' || activeTab === 'coownership') ? (
        <div className={`h-full w-full relative full-width-tab ${activeTab === 'taskboard' ? 'bg-gray-100 taskboard-container' : ''}`} style={{ minHeight: 'calc(100vh - 3.5rem)', maxWidth: 'none', margin: 0, padding: 0 }}>
          {renderTabContent()}
        </div>
      ) : (
        <div className="px-8 py-8 bg-white">
          <div className="max-w-6xl mx-auto">
            {renderTabContent()}
          </div>
        </div>
      )}
      
      {/* Chat Drawer is now global ResizableChatDrawer in App.js */}
    </NotionLayout>
    
    {/* Settings Modal */}
    {showSettings && (
      <UserSettingsScreen onClose={() => setShowSettings(false)} />
    )}
    
    {/* Survey Status Checker Button - Disabled */}
    {/* <SurveyStatusChecker /> */}
    </>
  );
};

export default NotionDashboard;