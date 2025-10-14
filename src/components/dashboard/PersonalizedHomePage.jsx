import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Heart, Calendar, CheckCircle, AlertCircle, TrendingUp,
  Users, Clock, MapPin, BookOpen, Award, Shield, MessageSquare,
  Activity, Lightbulb, ChevronRight, Eye, Brain, Zap, Target,
  Smile, Star, Trophy, Gift, PieChart, BarChart3, Home, User,
  ClipboardList
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import { useSurveyDrawer } from '../../contexts/SurveyDrawerContext';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, differenceInMinutes } from 'date-fns';
import TrustVisualization from '../home/TrustVisualization';
import SurveyEngineKnowledgeGraphSync from '../../services/SurveyEngineKnowledgeGraphSync';
import OnboardingHomePage from './OnboardingHomePage';

// Check if framer-motion is available, otherwise provide fallbacks
let motion;
try {
  const framerMotion = require('framer-motion');
  motion = framerMotion.motion;
} catch (e) {
  console.warn('framer-motion not installed, using fallback components');
  // Create simple replacements for motion components
  motion = {
    div: ({ initial, animate, transition, ...props }) => <div {...props} />,
    button: ({ initial, animate, transition, ...props }) => <button {...props} />
  };
}

const PersonalizedHomePage = () => {
  const { currentUser } = useAuth();
  const { familyMembers, familyName, taskRecommendations, selectedUser } = useFamily();
  const { events } = useEvents();
  const { openDrawerWithPrompt } = useChatDrawer();
  const { openSurveyDrawer } = useSurveyDrawer();
  const navigate = useNavigate();
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState(null);
  const [showInsightDetails, setShowInsightDetails] = useState({});
  const [loadingInsights, setLoadingInsights] = useState(true);
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Sync survey engine data to knowledge graph on load
  useEffect(() => {
    if (currentUser?.uid) {
      // Debounce the sync to prevent multiple calls
      const syncTimeout = setTimeout(() => {
        // Only sync if not already syncing
        const lastSync = localStorage.getItem('lastSurveySync');
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        
        if (!lastSync || (now - parseInt(lastSync)) > oneHour) {
          localStorage.setItem('lastSurveySync', now.toString());
          
          SurveyEngineKnowledgeGraphSync.syncAllSurveyData(currentUser.uid)
            .then(results => {
              console.log('Survey data synced to knowledge graph:', results);
            })
            .catch(error => {
              console.error('Error syncing survey data:', error);
              // Remove the timestamp on error so it can retry
              localStorage.removeItem('lastSurveySync');
            });
        }
      }, 2000); // Wait 2 seconds before syncing
      
      // Cleanup on unmount
      return () => {
        clearTimeout(syncTimeout);
      };
    }
  }, [currentUser?.uid]);
  
  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = currentTime.getHours();
    const name = selectedUser?.name || currentUser?.displayName || 'Friend';
    
    if (hour < 12) return `Good morning, ${name}! ☀️`;
    if (hour < 17) return `Good afternoon, ${name}! 🌤️`;
    if (hour < 21) return `Good evening, ${name}! 🌅`;
    return `Good night, ${name}! 🌙`;
  };
  
  // Get personalized insights for each family member
  const getMemberInsights = (member) => {
    const insights = [];
    
    // Tasks insight
    const memberTasks = taskRecommendations?.filter(t => 
      t.assignedTo === member.id || t.assignedToName === member.name
    ) || [];
    const incompleteTasks = memberTasks.filter(t => !t.completed);
    const completedToday = memberTasks.filter(t => 
      t.completed && new Date(t.completedAt).toDateString() === currentTime.toDateString()
    );
    
    if (incompleteTasks.length > 0) {
      insights.push({
        type: 'tasks',
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        title: `${incompleteTasks.length} tasks to do`,
        description: `Next: ${incompleteTasks[0]?.title || 'Check your tasks'}`,
        action: () => openDrawerWithPrompt(`Show me ${member.name}'s tasks for today`),
        priority: incompleteTasks.some(t => t.priority === 'high') ? 'high' : 'medium'
      });
    }
    
    // Today's events
    const todayEvents = events?.filter(e => {
      const eventDate = new Date(e.dateTime);
      return eventDate.toDateString() === currentTime.toDateString() &&
             (e.attendees?.includes(member.id) || e.createdBy === member.id);
    }) || [];
    
    if (todayEvents.length > 0) {
      const nextEvent = todayEvents.find(e => new Date(e.dateTime) > currentTime);
      insights.push({
        type: 'calendar',
        icon: Calendar,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        title: `${todayEvents.length} events today`,
        description: nextEvent ? `Next: ${nextEvent.title} at ${format(new Date(nextEvent.dateTime), 'h:mm a')}` : 'View your schedule',
        action: () => openDrawerWithPrompt(`Show me ${member.name}'s calendar for today`),
        priority: nextEvent && differenceInMinutes(new Date(nextEvent.dateTime), currentTime) < 60 ? 'high' : 'medium'
      });
    }
    
    // Achievements
    if (completedToday.length >= 3) {
      insights.push({
        type: 'achievement',
        icon: Trophy,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        title: '🏆 On fire today!',
        description: `${completedToday.length} tasks completed! Keep it up!`,
        action: () => openDrawerWithPrompt(`Celebrate ${member.name}'s achievements today`),
        priority: 'low'
      });
    }
    
    // Health & Wellness (for parents)
    if (member.role === 'parent') {
      insights.push({
        type: 'wellness',
        icon: Heart,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        title: 'Family wellness check',
        description: 'How is everyone feeling today?',
        action: () => openDrawerWithPrompt('Let\'s do a family wellness check-in'),
        priority: 'low'
      });
    }
    
    // Learning opportunities (for children)
    if (member.role === 'child') {
      insights.push({
        type: 'learning',
        icon: BookOpen,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        title: 'Today\'s learning',
        description: 'Ready for today\'s activities?',
        action: () => openDrawerWithPrompt(`Show me learning activities for ${member.name}`),
        priority: 'medium'
      });
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };
  
  // Get family-wide insights
  const getFamilyInsights = () => {
    const insights = [];
    
    // Upcoming family events
    const familyEvents = events?.filter(e => {
      const eventDate = new Date(e.dateTime);
      return eventDate > currentTime && 
             eventDate < addDays(currentTime, 7) &&
             e.attendees?.length > 1;
    }) || [];
    
    if (familyEvents.length > 0) {
      insights.push({
        icon: Users,
        color: 'text-indigo-600',
        title: `${familyEvents.length} family activities this week`,
        description: familyEvents[0].title,
        action: () => openDrawerWithPrompt('Show me upcoming family events')
      });
    }
    
    // Calculate real family streak based on task completion
    const calculateFamilyStreak = () => {
      let streak = 0;
      const today = new Date();
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        
        const dayTasks = taskRecommendations?.filter(t => {
          const taskDate = new Date(t.completedAt || t.createdAt);
          return taskDate.toDateString() === checkDate.toDateString() && t.completed;
        }) || [];
        
        if (dayTasks.length > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }
      
      return streak;
    };
    
    const activeDays = calculateFamilyStreak();
    if (activeDays > 0) {
      insights.push({
        icon: Zap,
        color: 'text-orange-600',
        title: `${activeDays} day family streak! 🔥`,
        description: 'Keep up the great work!',
        action: () => openDrawerWithPrompt('Show me our family activity stats')
      });
    }
    
    // AI suggestion based on actual data
    const needsFamilyTime = familyEvents.length === 0;
    const taskLoad = taskRecommendations?.filter(t => !t.completed).length || 0;
    
    if (needsFamilyTime) {
      insights.push({
        icon: Lightbulb,
        color: 'text-purple-600',
        title: 'Allie suggests',
        description: 'Schedule some family time this week',
        action: () => openDrawerWithPrompt('Help me plan family activities')
      });
    } else if (taskLoad > 10) {
      insights.push({
        icon: Lightbulb,
        color: 'text-purple-600',
        title: 'Allie suggests',
        description: 'Let\'s prioritize your tasks together',
        action: () => openDrawerWithPrompt('Help me manage our task backlog')
      });
    }
    
    return insights;
  };
  
  // Trust indicators
  const trustIndicators = [
    {
      icon: Shield,
      title: 'Transparent AI',
      description: 'See how Allie makes decisions',
      action: () => openDrawerWithPrompt('Show me how you work, Allie')
    },
    {
      icon: Award,
      title: 'Evidence-based',
      description: 'Backed by research & best practices',
      action: () => openDrawerWithPrompt('Tell me about your credentials')
    },
    {
      icon: Heart,
      title: 'Always here',
      description: 'Consistent support for your family',
      action: () => openDrawerWithPrompt('How can you help our family today?')
    }
  ];
  
  const allMembers = [
    { id: 'family', name: familyName || 'Our Family', role: 'family', icon: Home },
    ...familyMembers
  ];
  
  const currentMember = selectedMember || allMembers[0];
  const memberInsights = currentMember.id === 'family' 
    ? getFamilyInsights() 
    : getMemberInsights(currentMember);
  
  // Check if family needs onboarding
  const hasCompletedSurvey = familyMembers?.some(member => 
    member.completed || member.surveyCompleted || member.initialSurveyCompleted
  );
  const hasProfilePhotos = familyMembers?.some(member => member.profilePictureUrl);
  const hasMinimalData = hasCompletedSurvey || (events && events.length > 0) || (taskRecommendations && taskRecommendations.length > 0);
  
  // Handle survey navigation
  const handleStartSurvey = () => {
    // Open survey drawer for initial assessment
    openSurveyDrawer('initial', selectedUser?.id);
  };
  
  // Don't show onboarding page anymore - always show the main dashboard
  // Users can access survey through the Survey tab
  // if (!hasMinimalData) {
  //   return <OnboardingHomePage onStartSurvey={handleStartSurvey} />;
  // }
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
        {/* Header with Greeting */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-semibold text-gray-900 mb-1">{getGreeting()}</h1>
          <p className="text-sm text-gray-500">
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </p>
        </motion.div>
        
        {/* Welcome prompt for new families */}
        {!hasCompletedSurvey && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-start gap-4">
              <div className="text-2xl">👋</div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Welcome to your family dashboard!</h2>
                <p className="text-gray-700 mb-4">
                  Get started by taking a quick survey to help us personalize your experience and provide better recommendations for your family.
                </p>
                <button
                  onClick={handleStartSurvey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <ClipboardList size={18} />
                  Take Initial Survey
                </button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Family Member Selector */}
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto">
            {allMembers.map((member, index) => {
              const Icon = member.icon || User;
              const isSelected = currentMember.id === member.id;
              
              return (
                <motion.button
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedMember(member)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    isSelected 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {member.profilePicture ? (
                      <img 
                        src={member.profilePicture} 
                        alt={member.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Icon size={14} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
                    )}
                  </div>
                  <span className="font-medium">
                    {member.name}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* Main Content Grid - Responsive with chat drawer consideration */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 transition-all duration-300">
          {/* Left Column - Personal Insights */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Sparkles className="mr-2 text-gray-400" size={20} />
                {currentMember.id === 'family' ? 'Family Overview' : `${currentMember.name}'s Day`}
              </h2>
              
              <div className="space-y-1">
                {memberInsights.map((insight, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={insight.action}
                    className="group flex items-center gap-3 p-3 rounded-md hover:bg-gray-50 cursor-pointer transition-all"
                  >
                    <div className="p-1.5 rounded-md bg-gray-50">
                      <insight.icon size={16} className="text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{insight.title}</h3>
                      <p className="text-xs text-gray-500 truncate">{insight.description}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* Visual Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Activity className="mr-2 text-gray-400" size={20} />
                Weekly Progress
              </h2>
              
              <div className="space-y-4">
                {/* Weekly Calendar Strip */}
                <div className="flex justify-between">
                  {[...Array(7)].map((_, i) => {
                    const date = addDays(startOfWeek(currentTime), i);
                    const isToday = date.toDateString() === currentTime.toDateString();
                    const dayTasks = taskRecommendations?.filter(t => {
                      const taskDate = new Date(t.dueDate || t.createdAt);
                      return taskDate.toDateString() === date.toDateString() &&
                             (currentMember.id === 'family' || 
                              t.assignedTo === currentMember.id || 
                              t.assignedToName === currentMember.name);
                    }) || [];
                    const completedCount = dayTasks.filter(t => t.completed).length;
                    const totalCount = dayTasks.length;
                    
                    return (
                      <div key={i} className="flex flex-col items-center">
                        <span className="text-xs text-gray-500 mb-1">
                          {format(date, 'EEE')}
                        </span>
                        <div className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium ${
                          isToday ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700'
                        }`}>
                          {format(date, 'd')}
                        </div>
                        {totalCount > 0 && (
                          <div className="mt-1 text-xs">
                            <span className={completedCount === totalCount ? 'text-green-600' : 'text-gray-500'}>
                              {completedCount}/{totalCount}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Progress Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-900">
                      {taskRecommendations?.filter(t => t.completed).length || 0}
                    </div>
                    <div className="text-xs text-gray-500">Tasks Done</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-900">
                      {events?.filter(e => new Date(e.dateTime).toDateString() === currentTime.toDateString()).length || 0}
                    </div>
                    <div className="text-xs text-gray-500">Events Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-semibold text-gray-900">
                      {(() => {
                        // Calculate real streak based on user's activity
                        let streak = 0;
                        const today = new Date();
                        
                        for (let i = 0; i < 30; i++) {
                          const checkDate = new Date(today);
                          checkDate.setDate(today.getDate() - i);
                          
                          const dayActivity = taskRecommendations?.filter(t => {
                            const taskDate = new Date(t.completedAt || t.createdAt);
                            return taskDate.toDateString() === checkDate.toDateString() && 
                                   t.completed &&
                                   (currentMember.id === 'family' || 
                                    t.assignedTo === currentMember.id || 
                                    t.assignedToName === currentMember.name);
                          }) || [];
                          
                          const dayEvents = events?.filter(e => {
                            const eventDate = new Date(e.dateTime);
                            return eventDate.toDateString() === checkDate.toDateString() &&
                                   (currentMember.id === 'family' || 
                                    e.attendees?.includes(currentMember.id) || 
                                    e.createdBy === currentMember.id);
                          }) || [];
                          
                          if (dayActivity.length > 0 || dayEvents.length > 0) {
                            streak++;
                          } else if (i > 0) {
                            break;
                          }
                        }
                        
                        return streak;
                      })()}
                    </div>
                    <div className="text-xs text-gray-500">Day Streak</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Right Column - Trust & Help */}
          <div className="space-y-6">
            {/* Trust Indicators - Simplified for column layout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="mr-2 text-gray-400" size={20} />
                Why families trust us
              </h3>
              
              {/* Interactive Trust Metrics */}
              <div className="space-y-3">
                {/* Transparency Score */}
                <div className="p-3 border border-gray-100 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Transparency</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">94%</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    See exactly how Allie works
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">342</p>
                      <p className="text-gray-500">Questions Asked</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">156</p>
                      <p className="text-gray-500">Sources Cited</p>
                    </div>
                  </div>
                </div>

                {/* Consistency Score */}
                <div className="p-3 border border-gray-100 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Consistency</span>
                    </div>
                    <span className="text-sm font-semibold text-pink-600">92%</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    Building trust every day
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">47 days</p>
                      <p className="text-gray-500">Together</p>
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">8 sec</p>
                      <p className="text-gray-500">Avg Response</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => openDrawerWithPrompt('Show me the full transparency report with all your data sources and decision-making process')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center w-full"
                >
                  <Eye size={16} className="mr-1" />
                  View full transparency report
                </button>
              </div>
            </motion.div>
            
            {/* Allie Assistant Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-6"
            >
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <MessageSquare size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Hi, I'm Allie!</h3>
                  <p className="text-xs text-gray-600">Your family AI assistant</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">
                I'm here to help with anything you need. Just ask!
              </p>
              
              <button
                onClick={() => openDrawerWithPrompt('Hi Allie!')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Chat with Allie
              </button>
            </motion.div>
            
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-gray-200 rounded-lg p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Family Snapshot
              </h3>
              
              <div className="space-y-3">
                {/* Calculate real metrics */}
                {(() => {
                  const totalTasks = taskRecommendations?.length || 0;
                  const completedTasks = taskRecommendations?.filter(t => t.completed).length || 0;
                  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                  
                  const todayEvents = events?.filter(e => 
                    new Date(e.dateTime).toDateString() === currentTime.toDateString()
                  ).length || 0;
                  
                  const familyEvents = events?.filter(e => 
                    e.attendees?.length > 1 && new Date(e.dateTime) > currentTime
                  ).length || 0;
                  
                  // Family harmony based on task distribution and completion
                  const memberTaskCounts = {};
                  familyMembers.forEach(member => {
                    const memberTasks = taskRecommendations?.filter(t => 
                      t.assignedTo === member.id || t.assignedToName === member.name
                    ) || [];
                    memberTaskCounts[member.id] = {
                      total: memberTasks.length,
                      completed: memberTasks.filter(t => t.completed).length
                    };
                  });
                  
                  // Calculate harmony based on balanced task distribution and completion rates
                  const taskCounts = Object.values(memberTaskCounts).map(m => m.total);
                  const avgTasks = taskCounts.reduce((a, b) => a + b, 0) / (taskCounts.length || 1);
                  const variance = taskCounts.reduce((sum, count) => sum + Math.pow(count - avgTasks, 2), 0) / (taskCounts.length || 1);
                  const harmonyScore = Math.max(0, Math.min(100, 100 - (variance * 10)));
                  
                  // Family time percentage based on shared events
                  const totalEvents = events?.length || 0;
                  const sharedEvents = events?.filter(e => e.attendees?.length > 1).length || 0;
                  const familyTimePercent = totalEvents > 0 ? Math.round((sharedEvents / totalEvents) * 100) : 0;
                  
                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Family Harmony</span>
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-2 bg-green-500 rounded-full transition-all duration-500"
                              style={{ width: `${harmonyScore}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{Math.round(harmonyScore)}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Tasks Completed</span>
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-2 bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${taskCompletionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{taskCompletionRate}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Family Time</span>
                        <div className="flex items-center">
                          <div className="w-24 h-2 bg-gray-200 rounded-full mr-2">
                            <div 
                              className="h-2 bg-purple-500 rounded-full transition-all duration-500"
                              style={{ width: `${familyTimePercent}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{familyTimePercent}%</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              
              <button
                onClick={() => openDrawerWithPrompt('Show me detailed family analytics')}
                className="mt-4 text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                View detailed insights →
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalizedHomePage;