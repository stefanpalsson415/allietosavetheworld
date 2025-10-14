import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import { useEvents } from '../../contexts/EventContext';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import { useNavigate } from 'react-router-dom';
import ChoreService from '../../services/ChoreService';
import QuantumKnowledgeGraph from '../../services/QuantumKnowledgeGraph';
import { 
  Search, MessageSquare, Clock, Calendar, ChevronRight, 
  FileText, Users, Settings, Plus, Sparkles,
  BarChart3, ClipboardList
} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO, startOfDay, endOfDay } from 'date-fns';

const NotionHomePage = () => {
  const { currentUser } = useAuth();
  const { familyMembers, familyName } = useFamily();
  const eventData = useEvents();
  const events = eventData?.events || [];
  const { openDrawerWithPrompt } = useChatDrawer();
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [familyStats, setFamilyStats] = useState({
    harmony: 100,
    tasksCompleted: 0,
    familyTime: 0
  });
  const [recentlyVisited, setRecentlyVisited] = useState([]);
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  // Get greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();
    const name = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'there';
    
    if (hour < 12) return `Good morning, ${name}`;
    if (hour < 17) return `Good afternoon, ${name}`;
    if (hour < 21) return `Good evening, ${name}`;
    return `Good night, ${name}`;
  };
  
  // Load recently visited from localStorage and set defaults
  useEffect(() => {
    const visited = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
    const defaultItems = [
      { 
        id: 'calendar', 
        title: 'Family Calendar', 
        type: 'calendar', 
        icon: Calendar,
        path: '/dashboard?tab=calendar',
        lastVisited: new Date().toISOString()
      },
      { 
        id: 'tasks', 
        title: 'Task Board', 
        type: 'tasks', 
        icon: ClipboardList,
        path: '/dashboard?tab=tasks',
        lastVisited: new Date().toISOString()
      },
      { 
        id: 'knowledge', 
        title: 'Knowledge Graph', 
        type: 'knowledge', 
        icon: Sparkles,
        path: '/dashboard?tab=powerfulKnowledgeGraph',
        lastVisited: new Date().toISOString()
      },
      { 
        id: 'survey', 
        title: 'Family Survey', 
        type: 'survey', 
        icon: BarChart3,
        path: '/dashboard?tab=survey',
        lastVisited: new Date().toISOString()
      }
    ];
    
    // Merge visited with defaults
    const merged = defaultItems.map(item => {
      const visitedItem = visited.find(v => v.id === item.id);
      return visitedItem || item;
    });
    
    setRecentlyVisited(merged.sort((a, b) => 
      new Date(b.lastVisited) - new Date(a.lastVisited)
    ).slice(0, 4));
  }, []);
  
  // Track visits
  const trackVisit = (item) => {
    const visited = JSON.parse(localStorage.getItem('recentlyVisited') || '[]');
    const updated = visited.filter(v => v.id !== item.id);
    updated.unshift({ ...item, lastVisited: new Date().toISOString() });
    localStorage.setItem('recentlyVisited', JSON.stringify(updated.slice(0, 8)));
  };
  
  // Get upcoming events
  const getUpcomingEvents = () => {
    if (!events || events.length === 0) return [];
    
    const now = new Date();
    const upcoming = events
      .filter(event => {
        try {
          const eventDate = event.start ? new Date(event.start) : null;
          return eventDate && eventDate > now;
        } catch (e) {
          return false;
        }
      })
      .sort((a, b) => new Date(a.start) - new Date(b.start))
      .slice(0, 5);
    
    return upcoming;
  };
  
  const upcomingEvents = getUpcomingEvents();
  
  // Load family stats
  useEffect(() => {
    const loadFamilyStats = async () => {
      if (!currentUser?.uid) return;
      
      try {
        // Get tasks data
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);
        
        // Get completed tasks for today
        const completedTasks = await ChoreService.getCompletedChoresForDateRange(
          currentUser.uid,
          startOfToday,
          endOfToday
        );
        
        // Get total tasks for today
        const allTasks = await ChoreService.getChoresForDate(currentUser.uid, today);
        
        const tasksCompleted = allTasks.length > 0 
          ? Math.round((completedTasks.length / allTasks.length) * 100)
          : 0;
        
        // Get family harmony from knowledge graph
        const insights = await QuantumKnowledgeGraph.getFamilyInsights(currentUser.uid);
        
        setFamilyStats({
          harmony: insights?.harmony || 100,
          tasksCompleted,
          familyTime: insights?.familyTime || 0
        });
      } catch (error) {
        console.error('Error loading family stats:', error);
      }
    };
    
    loadFamilyStats();
  }, [currentUser]);
  
  // Format event date
  const formatEventDate = (dateString) => {
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      return format(date, 'EEEE, MMMM d');
    } catch (e) {
      return 'Unknown date';
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      openDrawerWithPrompt('general', searchQuery);
      setSearchQuery('');
    }
  };
  
  // Navigate to tab
  const navigateToTab = (path, item) => {
    trackVisit(item);
    navigate(path);
  };
  
  return (
    <div className="min-h-screen bg-[#FBFBFA]">
      <div className="max-w-[900px] mx-auto px-4 py-8">
        {/* Header with greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-4xl">☀️</span>
            {getGreeting()}
          </h1>
        </div>
        
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
              onClick={() => openDrawerWithPrompt('general', '')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Ask
            </button>
            <button 
              onClick={() => openDrawerWithPrompt('research', '')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Research
            </button>
            <button 
              onClick={() => navigate('/dashboard?tab=tasks')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Build
            </button>
          </div>
        </div>

        {/* Recently Visited */}
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

        {/* Upcoming Events */}
        <section className="mb-10">
          <h3 className="text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Upcoming events
          </h3>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No upcoming events</p>
              </div>
            ) : (
              <>
                {upcomingEvents.map((event, index) => {
                  const eventDate = event.start ? new Date(event.start) : new Date();
                  const dateLabel = formatEventDate(event.start);
                  
                  return (
                    <div key={event.id || index}>
                      {(index === 0 || formatEventDate(upcomingEvents[index - 1].start) !== dateLabel) && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-red-500">{dateLabel}</span>
                          <div className="flex-1 h-[1px] bg-gray-200"></div>
                        </div>
                      )}
                      
                      <div className="pl-4 pb-2">
                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer group">
                          <div className={`w-1 h-12 rounded-full ${event.color || 'bg-yellow-400'}`}></div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{event.title}</h4>
                            <p className="text-sm text-gray-500">
                              {format(eventDate, 'h:mm a')}
                              {event.end && ` - ${format(new Date(event.end), 'h:mm a')}`}
                              {event.location && ` • ${event.location}`}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </section>

        {/* Bottom Section - Allie Chat and Family Snapshot */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allie AI Assistant */}
          <div className="bg-blue-50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Hi, I'm Allie!</h3>
            <div className="flex items-center gap-2 text-gray-600 mb-4">
              <MessageSquare className="w-5 h-5" />
              <p className="text-sm">Your family AI assistant</p>
            </div>
            <p className="text-gray-600 mb-4">I'm here to help with anything you need. Just ask!</p>
            <button
              onClick={() => openDrawerWithPrompt('general', '')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Chat with Allie
            </button>
          </div>

          {/* Family Snapshot */}
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Family Snapshot</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Family Harmony</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${familyStats.harmony}%` }}></div>
                  </div>
                  <span className="text-sm font-medium">{familyStats.harmony}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Tasks Completed</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${familyStats.tasksCompleted}%` }}></div>
                  </div>
                  <span className="text-sm font-medium">{familyStats.tasksCompleted}%</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Family Time</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${familyStats.familyTime}%` }}></div>
                  </div>
                  <span className="text-sm font-medium">{familyStats.familyTime}%</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/dashboard?tab=powerfulKnowledgeGraph')}
              className="mt-4 text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-1"
            >
              View detailed insights
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotionHomePage;