import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import { useNavigate } from 'react-router-dom';
import {
  Search, MessageSquare, Clock, Calendar, ChevronRight,
  Plus, Sparkles, BarChart3, ClipboardList, CheckCircle,
  Circle, Camera, Users, FileText, Star, AtSign, Reply,
  Mic, UserCircle, Brain, TestTube
} from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import ChoreService from '../../services/ChoreService';
import QuantumKnowledgeGraph from '../../services/QuantumKnowledgeGraph';
import WeeklyTimelineView from './WeeklyTimelineView';
import ELOImbalanceDisplay from './ELOImbalanceDisplay';
import messageService from '../../services/MessageService';
import { formatDistanceToNow } from 'date-fns';
import FamilyDiscoveryDrawer from '../interview/FamilyDiscoveryDrawer';
import UserAvatar from '../common/UserAvatar';
import TestConversationDrawer from '../testing/TestConversationDrawer';

const BasicNotionHomePage = () => {
  const { currentUser } = useAuth();
  const { familyMembers, selectedUser, familyId, familyName } = useFamily();
  const { openDrawer, openDrawerWithPrompt, openInterview, resetToChat } = useChatDrawer();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDiscoveryDrawer, setShowDiscoveryDrawer] = useState(false);
  const [showTestDrawer, setShowTestDrawer] = useState(false);
  const [familyStats, setFamilyStats] = useState({
    harmony: 100,
    tasksCompleted: 0,
    familyTime: 0
  });
  const [recentlyVisited, setRecentlyVisited] = useState([]);
  const [dashboardMessages, setDashboardMessages] = useState([]);
  const [showAllTodos, setShowAllTodos] = useState(false);
  
  // Initialize with basic checklist items that expand as completed
  const getInitialChecklistItems = (membersWithoutSurvey = [], currentUserId = null, membersWithoutDiscovery = [], membersWithoutProfile = [], interviewsStarted = {}) => {
    const items = [];

    // HIGHEST PRIORITY: Family Surveys (moved to top per user request)
    // Create individual survey items for each family member who hasn't completed it
    if (membersWithoutSurvey.length > 0) {
      membersWithoutSurvey.forEach((member, index) => {
        const isCurrentUser = member.id === currentUserId;
        items.push({
          id: `survey-${member.id}`,
          title: isCurrentUser
            ? 'Take the Initial Family Survey'
            : `${member.name || 'Family Member'} - Complete Survey`,
          description: isCurrentUser
            ? 'Help us understand your family dynamics and preferences'
            : `Waiting for ${member.name || 'family member'} to complete their survey`,
          completed: false,
          icon: BarChart3,
          action: isCurrentUser
            ? () => navigate('/survey')
            : () => openDrawerWithPrompt(`How can I remind ${member.name} to complete their survey?`),
          category: 'survey',
          priority: 0.1 + index * 0.01, // Highest priority - surveys before interviews
          memberName: member.name,
          isCurrentUser,
          memberRole: member.role || 'family member'
        });
      });
    }

    // HIGH PRIORITY: Family Discovery Interviews for those who need them
    if (membersWithoutDiscovery.length > 0) {
      membersWithoutDiscovery.forEach((member, index) => {
        const isCurrentUser = member.id === currentUserId;
        const interviewId = `discovery-${member.id}`;
        const hasStarted = interviewsStarted[interviewId];

        items.push({
          id: interviewId,
          title: isCurrentUser
            ? 'Complete Your Family Discovery Interview'
            : `${member.name || 'Family Member'} - Family Discovery Interview`,
          description: hasStarted
            ? (isCurrentUser
                ? '▶️ Interview in progress - Continue when ready'
                : `▶️ ${member.name || 'Family member'} started their interview`)
            : (isCurrentUser
                ? 'Share your childhood memories and family stories (15 mins)'
                : `${member.name || 'Family member'} needs to complete their discovery interview`),
          completed: false,
          icon: Brain,
          action: () => {
            // Open Family Discovery drawer
            setShowDiscoveryDrawer(true);
          },
          category: 'urgent',
          priority: 0.5 + index * 0.01, // Second priority - after surveys
          memberName: member.name,
          member: member, // Add full member object for avatar
          isCurrentUser,
          memberRole: member.role || 'family member',
          requiresAction: true,
          urgency: hasStarted ? 'orange' : 'red' // Orange if started, red if not
        });
      });
    }

    // HIGH PRIORITY: In-Depth Profile Builder Interviews
    if (membersWithoutProfile.length > 0) {
      membersWithoutProfile.forEach((member, index) => {
        const isCurrentUser = member.id === currentUserId;
        const interviewId = `profile-${member.id}`;
        const hasStarted = interviewsStarted[interviewId];

        items.push({
          id: interviewId,
          title: isCurrentUser
            ? 'Complete Your Personal Profile Interview'
            : `${member.name || 'Family Member'} - Profile Interview`,
          description: hasStarted
            ? (isCurrentUser
                ? '▶️ Interview in progress - Continue when ready'
                : `▶️ ${member.name || 'Family member'} started their interview`)
            : (isCurrentUser
                ? 'Tell Allie about your preferences and routines (10 mins)'
                : `${member.name || 'Family member'} needs to complete their profile interview`),
          completed: false,
          icon: UserCircle,
          action: () => {
            // Open Family Discovery drawer (Personal Profile Interview is now one of the 6 discovery types)
            setShowDiscoveryDrawer(true);
          },
          category: 'urgent',
          priority: 1 + index * 0.01, // Third priority - after surveys and discovery
          memberName: member.name,
          member: member, // Add full member object for avatar
          isCurrentUser,
          memberRole: member.role || 'family member',
          requiresAction: true,
          urgency: hasStarted ? 'orange' : 'yellow' // Orange if started, yellow if not
        });
      });
    }

    // Add photo upload item
    items.push({
      id: 'add-family-photos',
      title: 'Add Family Photos',
      description: 'Upload photos to personalize your family experience',
      completed: false,
      icon: Camera,
      action: () => {
        // Dispatch event to open settings modal
        window.dispatchEvent(new CustomEvent('open-settings-modal', { detail: { tab: 'personal' } }));
      },
      category: 'personalize',
      priority: 2
    });

    return items;
  };

  const getExtendedChecklistItems = () => {
    return [
      {
        id: 'invite-family-members',
        title: 'Invite All Family Members',
        description: 'Make sure everyone in your family has access',
        completed: false,
        icon: Users,
        action: () => openDrawerWithPrompt('How can I invite other family members to join our family account?'),
        category: 'setup',
        priority: 3
      },
      {
        id: 'create-first-event',
        title: 'Create Your First Family Event',
        description: 'Add an upcoming family activity or appointment',
        completed: false,
        icon: Calendar,
        action: () => navigate('/dashboard?tab=calendar'),
        category: 'organize',
        priority: 4
      },
      {
        id: 'explore-knowledge-graph',
        title: 'Explore Your Family Insights',
        description: 'See how our AI understands your family dynamics',
        completed: false,
        icon: Sparkles,
        action: () => navigate('/dashboard?tab=powerfulKnowledgeGraph'),
        category: 'discover',
        priority: 5
      },
      {
        id: 'set-up-first-habit',
        title: 'Set Up Your First Family Habit',
        description: 'Create a positive habit to track together',
        completed: false,
        icon: Star,
        action: () => navigate('/dashboard?tab=habit-helper'),
        category: 'grow',
        priority: 6
      }
    ];
  };

  const [onboardingChecklist, setOnboardingChecklist] = useState([]);
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Fetch messages for dashboard display
  useEffect(() => {
    const fetchDashboardMessages = async () => {
      if (!familyId || !currentUser) return;
      
      const userId = selectedUser?.id || currentUser.uid;
      const messages = await messageService.getMessagesForDashboard(familyId, userId, 4);
      
      // Convert messages to dashboard action items
      const messageItems = messages.map(msg => {
        // Try to find the actual user name from family members
        const sender = familyMembers.find(m => m.id === msg.userId) ||
                      familyMembers.find(m => m.id === msg.userName);
        const senderName = sender?.name || msg.userName || 'Someone';

        return {
          id: `msg-${msg.id}`,
          title: (msg.mentions && msg.mentions.includes(userId))
            ? `@${selectedUser?.name || 'You'} mentioned by ${senderName}`
            : `Message from ${senderName || 'someone'}`,
          description: msg.content || 'Click to view message',
          completed: false,
          icon: (msg.mentions && msg.mentions.includes(userId)) ? AtSign : msg.replyCount > 0 ? Reply : MessageSquare,
          action: async () => {
            // Mark message as read
            const messageId = msg.id;
            const currentUserId = selectedUser?.id || currentUser.uid;
            await messageService.markAsRead(messageId, currentUserId);

            // Reset to chat mode first (close interview if open)
            resetToChat();

            // Open drawer
            console.log('📂 Opening chat drawer from dashboard...');
            openDrawer();

            // Open thread in Allie Chat (after brief delay)
            const threadId = msg.threadId || msg.id;
            console.log('📬 Opening thread from dashboard:', threadId);
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('navigate-to-chat-thread', {
                detail: { threadId }
              }));
            }, 100);

            // Refresh dashboard messages to remove the read one
            fetchDashboardMessages();
          },
          category: 'message',
          priority: msg.priority === 'urgent' ? 0 : msg.priority === 'high' ? 0.5 : 1,
          timestamp: msg.timestamp,
          isUnread: !msg.read || !msg.read.includes(userId),
          replyCount: msg.replyCount || 0,
          requiresAction: msg.requiresAction
        };
      });
      
      setDashboardMessages(messageItems);
    };
    
    fetchDashboardMessages();
    
    // Subscribe to real-time updates
    if (familyId) {
      const unsubscribe = messageService.subscribeToMessages(familyId, (messages) => {
        // Filter for dashboard-worthy messages
        const userId = selectedUser?.id || currentUser?.uid;
        const importantMessages = messages.filter(msg => {
          // Only show messages that are RELEVANT to this specific user
          const isMentioned = msg.mentions && msg.mentions.includes(userId);
          const isOwnMessage = msg.userId === userId;
          const isUnread = !msg.read || !msg.read.includes(userId);

          return isUnread && (isMentioned || isOwnMessage);
        }).slice(0, 4);

        const messageItems = importantMessages.map(msg => {
          // Try to find the actual user name from family members
          const sender = familyMembers.find(m => m.id === msg.userId) ||
                        familyMembers.find(m => m.id === msg.userName);
          const senderName = sender?.name || msg.userName || 'Someone';

          return {
            id: `msg-${msg.id}`,
            title: (msg.mentions && msg.mentions.includes(userId))
              ? `@${selectedUser?.name || 'You'} mentioned by ${senderName}`
              : `Message from ${senderName || 'someone'}`,
            description: msg.content || 'Click to view message',
            completed: false,
            icon: (msg.mentions && msg.mentions.includes(userId)) ? AtSign : msg.replyCount > 0 ? Reply : MessageSquare,
            action: async () => {
              // Mark message as read
              const messageId = msg.id;
              const currentUserId = selectedUser?.id || currentUser?.uid;
              await messageService.markAsRead(messageId, currentUserId);

              // Reset to chat mode first (close interview if open)
              resetToChat();

              // Open drawer
              console.log('📂 Opening chat drawer from dashboard (realtime)...');
              openDrawer();

              // Open thread in Allie Chat (after brief delay)
              const threadId = msg.threadId || msg.id;
              console.log('📬 Opening thread from dashboard:', threadId);
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('navigate-to-chat-thread', {
                  detail: { threadId }
                }));
              }, 100);

              // Remove this message from dashboard by updating state
              setDashboardMessages(prev => prev.filter(item => item.id !== `msg-${messageId}`));
            },
            category: 'message',
            priority: msg.priority === 'urgent' ? 0 : msg.priority === 'high' ? 0.5 : 1,
            timestamp: msg.timestamp,
            isUnread: !msg.read || !msg.read.includes(userId),
            replyCount: msg.replyCount || 0,
            requiresAction: msg.requiresAction
          };
        });

        setDashboardMessages(messageItems);
      });
      
      return () => unsubscribe();
    }
  }, [familyId, currentUser, selectedUser, openDrawerWithPrompt, familyMembers]);
  
  // Icon mapping
  const iconMap = {
    calendar: Calendar,
    tasks: ClipboardList,
    knowledge: Sparkles,
    survey: BarChart3
  };
  
  // Load recently visited from localStorage
  useEffect(() => {
    const visited = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
    
    // Only show actually visited items, add icons
    const visitedWithIcons = visited.map(item => ({
      ...item,
      icon: iconMap[item.iconName] || iconMap['tasks'] // fallback icon
    }));
    
    setRecentlyVisited(visitedWithIcons.sort((a, b) => 
      new Date(b.lastVisited) - new Date(a.lastVisited)
    ).slice(0, 4));
  }, []);

  // Load onboarding checklist state from localStorage and check actual completion status
  useEffect(() => {
    const updateChecklistStatus = async () => {
      if (!familyId) return;
      
      const savedChecklist = localStorage.getItem(`onboardingChecklist_${familyId}`);
      let completedIds = [];
      
      if (savedChecklist) {
        try {
          completedIds = JSON.parse(savedChecklist);
        } catch (error) {
          console.error('Error loading onboarding checklist:', error);
        }
      }
      
      // Check actual survey completion status for all family members
      // Use selectedUser if available, otherwise fall back to currentUser
      const activeUserId = selectedUser?.id || currentUser?.uid;
      const currentMember = familyMembers.find(member => member.id === activeUserId);
      const isSurveyCompleted = currentMember?.surveys?.initial?.completed || false;
      
      // Get list of family members who haven't completed the survey
      const membersWithoutSurvey = familyMembers.filter(member =>
        !member.surveys?.initial?.completed
      );

      // Get list of family members who haven't completed discovery interviews
      const membersWithoutDiscovery = familyMembers.filter(member =>
        !member.interviews?.discovery?.completed
      );

      // Get list of family members who haven't completed profile interviews
      const membersWithoutProfile = familyMembers.filter(member =>
        !member.interviews?.profile?.completed && !member.enhancedProfile?.completed
      );

      // Track which interviews have been started (for progress indicators)
      const interviewsStarted = {};

      // Check for paused interview sessions in Firestore
      try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db } = await import('../../services/firebase');

        const sessionsRef = collection(db, 'interviewSessions');
        const pausedQuery = query(
          sessionsRef,
          where('familyId', '==', familyId),
          where('status', '==', 'paused')
        );

        const snapshot = await getDocs(pausedQuery);
        snapshot.forEach(doc => {
          const session = doc.data();
          // Session ID format: interview_{timestamp}_{type}_{familyId}
          // Extract type (e.g., "invisible_work_discovery")
          const parts = doc.id.split('_');
          if (parts.length >= 4) {
            const type = parts.slice(2, -1).join('_'); // Get everything between timestamp and familyId

            // Map to our interview types
            if (type.includes('discovery') || type.includes('invisible_work')) {
              // Mark discovery interview as started for this participant
              session.participants?.forEach(participant => {
                interviewsStarted[`discovery-${participant.userId}`] = true;
              });
            } else if (type.includes('profile')) {
              session.participants?.forEach(participant => {
                interviewsStarted[`profile-${participant.userId}`] = true;
              });
            }
          }
        });
      } catch (error) {
        console.warn('Could not load paused interview sessions:', error);
      }

      // Also check member.interviews fields (legacy)
      familyMembers.forEach(member => {
        if (member.interviews?.discovery?.started && !member.interviews?.discovery?.completed) {
          interviewsStarted[`discovery-${member.id}`] = true;
        }
        if ((member.interviews?.profile?.started || member.enhancedProfile?.started) &&
            !member.interviews?.profile?.completed && !member.enhancedProfile?.completed) {
          interviewsStarted[`profile-${member.id}`] = true;
        }
      });

      // Mark individual survey items as completed
      familyMembers.forEach(member => {
        const surveyItemId = `survey-${member.id}`;
        if (member.surveys?.initial?.completed && !completedIds.includes(surveyItemId)) {
          completedIds.push(surveyItemId);
        }

        // Mark discovery interview items as completed
        const discoveryItemId = `discovery-${member.id}`;
        if (member.interviews?.discovery?.completed && !completedIds.includes(discoveryItemId)) {
          completedIds.push(discoveryItemId);
        }

        // Mark profile interview items as completed
        const profileItemId = `profile-${member.id}`;
        if ((member.interviews?.profile?.completed || member.enhancedProfile?.completed) && !completedIds.includes(profileItemId)) {
          completedIds.push(profileItemId);
        }
      });
      
      // Check if current user has uploaded their profile photo
      const currentMemberData = familyMembers.find(member => member.id === activeUserId);
      const hasCurrentUserPhoto = currentMemberData?.profilePicture && 
        currentMemberData.profilePicture !== '' && 
        !currentMemberData.profilePicture.includes('placeholder') &&
        !currentMemberData.profilePicture.includes('default');
      
      // Only mark as complete if the current user has uploaded their photo
      if (hasCurrentUserPhoto && !completedIds.includes('add-family-photos')) {
        completedIds.push('add-family-photos');
        localStorage.setItem(`onboardingChecklist_${familyId}`, JSON.stringify(completedIds));
      }
      
      // Remove from completed if the current user doesn't have a photo
      if (!hasCurrentUserPhoto && completedIds.includes('add-family-photos')) {
        completedIds = completedIds.filter(id => id !== 'add-family-photos');
        localStorage.setItem(`onboardingChecklist_${familyId}`, JSON.stringify(completedIds));
      }
      
      // Save updated completed IDs
      localStorage.setItem(`onboardingChecklist_${familyId}`, JSON.stringify(completedIds));
      
      // Check if all surveys and photos are completed
      const allSurveysCompleted = membersWithoutSurvey.length === 0;
      const basicCompleted = allSurveysCompleted && completedIds.includes('add-family-photos');
      
      // Sort members to put active user first
      const sortedMembersWithoutSurvey = [...membersWithoutSurvey].sort((a, b) => {
        if (a.id === activeUserId) return -1;
        if (b.id === activeUserId) return 1;
        return 0;
      });

      const sortedMembersWithoutDiscovery = [...membersWithoutDiscovery].sort((a, b) => {
        if (a.id === activeUserId) return -1;
        if (b.id === activeUserId) return 1;
        return 0;
      });

      const sortedMembersWithoutProfile = [...membersWithoutProfile].sort((a, b) => {
        if (a.id === activeUserId) return -1;
        if (b.id === activeUserId) return 1;
        return 0;
      });

      // Create the appropriate checklist based on completion status
      let checklistItems = getInitialChecklistItems(
        sortedMembersWithoutSurvey,
        activeUserId,
        sortedMembersWithoutDiscovery,
        sortedMembersWithoutProfile,
        interviewsStarted
      );
      if (basicCompleted) {
        // Add extended items if basic ones are done
        checklistItems = [...checklistItems, ...getExtendedChecklistItems()];
      }
      
      // Mark completed items
      const updatedChecklist = checklistItems.map(item => ({
        ...item,
        completed: completedIds.includes(item.id)
      }));
      
      setOnboardingChecklist(updatedChecklist);
    };
    
    updateChecklistStatus();
  }, [familyId, familyMembers, currentUser, selectedUser]);
  
  // Load family stats
  useEffect(() => {
    const loadFamilyStats = async () => {
      if (!currentUser?.uid || !familyId) return;
      
      try {
        // Get tasks data
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);
        
        // Get completed tasks for today
        const completedChores = await ChoreService.getCompletedChoresForFamily(
          familyId,  // Use familyId instead of user ID
          today
        );
        
        // For now, just show the number of completed tasks
        // We'd need additional methods to get total assigned tasks
        const tasksCompleted = completedChores?.length || 0;

        // DISABLED: QuantumKG is legacy system, replaced by Neo4j Knowledge Graph
        // const insights = await QuantumKnowledgeGraph.getFamilyInsights(familyId);

        setFamilyStats({
          harmony: 85, // Use default value instead of loading from QuantumKG
          tasksCompleted: Math.min(tasksCompleted * 20, 100), // Convert count to percentage
          familyTime: 75 // Use default value instead of loading from QuantumKG
        });
      } catch (error) {
        console.error('Error loading family stats:', error);
        // Keep default values on error
      }
    };
    
    loadFamilyStats();
  }, [currentUser, familyId]);
  
  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();
    // Try to get the name from selectedUser first (which shows Stefan in top-left)
    const name = selectedUser?.name || 
                 selectedUser?.displayName || 
                 currentUser?.displayName || 
                 currentUser?.email?.split('@')[0] || 
                 'there';
    
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    if (hour < 21) return `Good evening, ${name}`;
    return `Good night, ${name}`;
  };
  
  // Handle search
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Don't automatically send to chat
      // Just keep the search query for the buttons to use
    }
  };
  
  // Track visits
  const trackVisit = (item) => {
    const visited = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
    const updated = visited.filter(v => v.id !== item.id);
    // Don't store the icon component, only the iconName
    const { icon, ...itemWithoutIcon } = item;
    updated.unshift({ ...itemWithoutIcon, lastVisited: new Date().toISOString() });
    localStorage.setItem('recentlyVisited', JSON.stringify(updated.slice(0, 8)));
  };
  
  // Navigate to tab
  const navigateToTab = (path, item) => {
    if (item) trackVisit(item);
    navigate(path);
  };
  
  // Mark checklist item as complete
  const markChecklistItemComplete = (itemId) => {
    if (!familyId) return;
    
    const savedChecklist = localStorage.getItem(`onboardingChecklist_${familyId}`);
    let completedIds = [];
    
    if (savedChecklist) {
      try {
        completedIds = JSON.parse(savedChecklist);
      } catch (error) {
        console.error('Error loading onboarding checklist:', error);
      }
    }
    
    if (!completedIds.includes(itemId)) {
      completedIds.push(itemId);
      localStorage.setItem(`onboardingChecklist_${familyId}`, JSON.stringify(completedIds));
      
      // Update local state
      setOnboardingChecklist(prev => prev.map(item => ({
        ...item,
        completed: item.id === itemId ? true : item.completed
      })));
    }
  };
  
  // Get incomplete checklist items
  const incompleteItems = onboardingChecklist.filter(item => !item.completed);
  const completionPercentage = Math.round(((onboardingChecklist.length - incompleteItems.length) / onboardingChecklist.length) * 100);
  
  // Check if whole family has completed surveys
  const checkWholeFamilyCompleted = () => {
    if (!familyMembers || familyMembers.length === 0) return false;
    
    // Get all adults (parents) - they need to complete the initial survey
    const adults = familyMembers.filter(member => member.role === 'parent');
    
    // Check if all adults have completed their initial surveys
    const allAdultsCompleted = adults.length > 0 && adults.every(adult => 
      adult.surveys?.initial?.completed === true
    );
    
    return allAdultsCompleted;
  };
  
  const wholeFamilyCompleted = checkWholeFamilyCompleted();
  
  return (
    <div>
      <div className="max-w-[900px] mx-auto">
        {/* Header with greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-4xl">☀️</span>
            {getGreeting()}
          </h1>
        </div>

        {/* Upcoming Events - Horizontal Weekly View */}
        {wholeFamilyCompleted && (
          <section className="mb-8">
            <WeeklyTimelineView />
          </section>
        )}

        {/* Two Column Layout: App To Dos & Notification Inbox */}
        {(incompleteItems.length > 0 || dashboardMessages.length > 0) && (
          <section className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 shadow-sm">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-blue-600" />
                    Welcome to Your Family Hub!
                  </h3>
                  <p className="text-gray-600 mt-1">Stay on top of your tasks and notifications</p>
                </div>
                {incompleteItems.length > 0 && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{completionPercentage}%</div>
                    <div className="text-sm text-gray-500">Complete</div>
                  </div>
                )}
              </div>
              
              {/* Survey Status Summary */}
              {(() => {
                const surveyItems = incompleteItems.filter(item => item.category === 'survey');
                const completedSurveys = familyMembers.filter(member => 
                  member.surveys?.initial?.completed
                );
                
                if (surveyItems.length > 0 || completedSurveys.length > 0) {
                  return (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Family Survey Status
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {familyMembers.map(member => {
                          const isCompleted = member.surveys?.initial?.completed;
                          const isActiveUser = member.id === (selectedUser?.id || currentUser?.uid);
                          return (
                            <div
                              key={member.id}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                isCompleted
                                  ? 'bg-green-100 text-green-700'
                                  : isActiveUser
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <Circle className="w-3 h-3" />
                              )}
                              {member.name || 'Family Member'}
                              {isActiveUser && ' (You)'}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
              
              {incompleteItems.length > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              )}

              {/* Two Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: App To Dos */}
                {incompleteItems.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                      <ClipboardList className="w-4 h-4" />
                      App To Do's
                    </h4>
                    <div className="space-y-2">
                      {(showAllTodos ? incompleteItems : incompleteItems.slice(0, 6)).map((item) => {
                        const Icon = item.icon;
                        const isSurveyItem = item.category === 'survey';
                        const isOtherMemberSurvey = isSurveyItem && !item.isCurrentUser;
                        const hasMember = item.member && !item.isCurrentUser; // Show avatar for other members

                        // Get ring color based on urgency
                        const getRingColor = () => {
                          if (!item.urgency) return '';
                          if (item.urgency === 'red') return 'ring-2 ring-red-500';
                          if (item.urgency === 'yellow') return 'ring-2 ring-yellow-500';
                          if (item.urgency === 'green') return 'ring-2 ring-green-500';
                          return '';
                        };

                        return (
                          <button
                            key={item.id}
                            onClick={() => item.action()}
                            className={`flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-md transition-all text-left group w-full ${
                              isOtherMemberSurvey
                                ? 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            {hasMember ? (
                              // Show UserAvatar with colored ring for person-specific items
                              <div className={`flex-shrink-0 rounded-full ${getRingColor()}`}>
                                <UserAvatar user={item.member} size={40} />
                              </div>
                            ) : (
                              // Show icon for generic items
                              <div className={`p-2 rounded-lg transition-colors ${
                                isOtherMemberSurvey
                                  ? 'bg-gray-200 group-hover:bg-gray-300'
                                  : 'bg-blue-100 group-hover:bg-blue-200'
                              }`}>
                                <Icon className={`w-5 h-5 ${
                                  isOtherMemberSurvey ? 'text-gray-600' : 'text-blue-600'
                                }`} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                              <p className="text-xs text-gray-500 truncate">{item.description}</p>

                              {/* Survey progress */}
                              {isOtherMemberSurvey && (
                                <p className="text-xs text-gray-400 mt-1 truncate">
                                  {(() => {
                                    const member = familyMembers.find(m => m.id === item.id.replace('survey-', ''));
                                    const responseCount = member?.surveys?.initial?.responseCount || 0;
                                    const totalQuestions = 72;
                                    const percentage = Math.round((responseCount / totalQuestions) * 100);

                                    if (responseCount > 0) {
                                      return `${item.memberName} has completed ${percentage}% of the survey`;
                                    }
                                    return 'Click to send a reminder';
                                  })()}
                                </p>
                              )}
                            </div>
                            <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${
                              isOtherMemberSurvey
                                ? 'text-gray-300 group-hover:text-gray-500'
                                : 'text-gray-400 group-hover:text-blue-600'
                            }`} />
                          </button>
                        );
                      })}
                    </div>

                    {incompleteItems.length > 6 && (
                      <button
                        onClick={() => setShowAllTodos(!showAllTodos)}
                        className="text-xs text-blue-600 hover:text-blue-700 mt-2 w-full text-center py-2 hover:bg-blue-50 rounded-md transition-colors font-medium"
                      >
                        {showAllTodos
                          ? 'Show less'
                          : `+${incompleteItems.length - 6} more to complete - Click to view all`
                        }
                      </button>
                    )}
                  </div>
                )}

                {/* Right Column: Notification Inbox */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                    <MessageSquare className="w-4 h-4" />
                    Notification Inbox
                  </h4>

                  {dashboardMessages.length > 0 ? (
                    <div className="space-y-2">
                      {dashboardMessages.slice(0, 6).map((item) => {
                        const Icon = item.icon;

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              item.action();
                              // Mark message as read
                              if (item.isUnread) {
                                const messageId = item.id.replace('msg-', '');
                                const userId = selectedUser?.id || currentUser?.uid;
                                messageService.markAsRead(messageId, userId);
                              }
                            }}
                            className={`flex items-center gap-3 p-3 bg-white rounded-lg border hover:shadow-md transition-all text-left group relative w-full ${
                              item.isUnread
                                ? 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            {/* Unread indicator */}
                            {item.isUnread && (
                              <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            )}

                            <div className={`p-2 rounded-lg transition-colors ${
                              item.isUnread
                                ? 'bg-blue-200 group-hover:bg-blue-300'
                                : 'bg-gray-100 group-hover:bg-gray-200'
                            }`}>
                              <Icon className={`w-5 h-5 ${
                                item.isUnread ? 'text-blue-600' : 'text-gray-600'
                              }`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                              <p className="text-xs text-gray-500 truncate">{item.description}</p>

                              {/* Message metadata */}
                              <div className="flex items-center gap-3 mt-1">
                                {item.timestamp && (
                                  <p className="text-xs text-gray-400 truncate">
                                    {formatDistanceToNow(item.timestamp.toDate ? item.timestamp.toDate() : new Date(item.timestamp), { addSuffix: true })}
                                  </p>
                                )}
                                {item.replyCount > 0 && (
                                  <p className="text-xs text-blue-600 font-medium flex-shrink-0">
                                    {item.replyCount} {item.replyCount === 1 ? 'reply' : 'replies'}
                                  </p>
                                )}
                                {item.requiresAction && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded flex-shrink-0">
                                    Action needed
                                  </span>
                                )}
                              </div>
                            </div>

                            <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-colors ${
                              item.isUnread
                                ? 'text-blue-400 group-hover:text-blue-600'
                                : 'text-gray-400 group-hover:text-gray-600'
                            }`} />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 bg-white rounded-lg border border-gray-200 text-center">
                      <MessageSquare className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No new notifications</p>
                      <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                    </div>
                  )}

                  {dashboardMessages.length > 6 && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      +{dashboardMessages.length - 6} more notifications
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Search/Command Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Ask or find anything from your workspace..."
              className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 placeholder-gray-400"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            <button 
              onClick={() => {
                if (searchQuery.trim()) {
                  // Send a clear search request to Allie
                  const searchMessage = `Please search for "${searchQuery}" in our family's documents, events, appointments, and any other stored information.`;
                  openDrawerWithPrompt(searchMessage);
                  setSearchQuery('');
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search Allie App
            </button>
            <button 
              onClick={() => {
                if (searchQuery.trim()) {
                  // Send the query directly to Claude
                  openDrawerWithPrompt(searchQuery);
                  setSearchQuery('');
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Ask Claude
            </button>
          </div>
        </div>

        {/* Recently Visited - only show if there are actually visited items */}
        {recentlyVisited.length > 0 && (
          <section className="mb-10">
            <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Recently visited
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentlyVisited.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateToTab(item.path, item)}
                    className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all hover:scale-105 text-left group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                      <Plus className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">{item.title}</h4>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Quick Actions - Always visible */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/dashboard?tab=tasks')}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all hover:scale-105 text-left group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <h4 className="text-sm font-medium text-gray-900">View Tasks</h4>
            </button>

            <button
              onClick={() => navigate('/dashboard?tab=calendar')}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all hover:scale-105 text-left group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Calendar</h4>
            </button>

            <button
              onClick={() => openDrawerWithPrompt('What should our family do this weekend?')}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all hover:scale-105 text-left group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Ask Allie</h4>
            </button>

            <button
              onClick={() => setShowTestDrawer(true)}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all hover:scale-105 text-left group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <TestTube className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <h4 className="text-sm font-medium text-gray-900">🧪 Test Voice</h4>
            </button>

            <button
              onClick={() => navigate('/dashboard?tab=powerfulKnowledgeGraph')}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all hover:scale-105 text-left group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                  <Sparkles className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
              <h4 className="text-sm font-medium text-gray-900">Insights</h4>
            </button>
          </div>
        </section>

        {/* Main Content Area - Always show something */}
        {wholeFamilyCompleted ? (
          <></>
        ) : (
          /* Show helpful content before surveys are complete */
          <section className="mb-10">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Family Journey Begins!</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Complete Your Family Survey</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Once all family members complete their surveys, you'll unlock personalized insights, 
                      task balance analytics, and AI-powered recommendations.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Upcoming Features</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Calendar integration, habit tracking, and family meeting scheduling will be available 
                      after survey completion.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Invite Family Members</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Make sure everyone in your family has joined so you can work together towards 
                      better balance and harmony.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* Family Discovery Drawer */}
      <FamilyDiscoveryDrawer
        isOpen={showDiscoveryDrawer}
        onClose={() => setShowDiscoveryDrawer(false)}
        onStartInterview={(interviewConfig) => {
          // Close discovery drawer and open interview in chat drawer
          setShowDiscoveryDrawer(false);
          openInterview(interviewConfig);
        }}
      />

      {/* Test Conversation Drawer */}
      <TestConversationDrawer
        isOpen={showTestDrawer}
        onClose={() => setShowTestDrawer(false)}
      />
    </div>
  );
};

export default BasicNotionHomePage;