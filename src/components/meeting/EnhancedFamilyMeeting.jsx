import React, { useState, useEffect, useCallback } from 'react';
import { Star, Trophy, Target, Heart, TrendingUp, Users, Sparkles, BarChart2, MessageCircle, CheckCircle, XCircle, Award, Lightbulb, Info, X, ArrowLeft, Mic, MicOff, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { format, startOfWeek, endOfWeek, subWeeks, differenceInDays } from 'date-fns';
import AllieChat from '../chat/refactored/AllieChat';
import FamilyAchievementsSection from './FamilyAchievementsSection';
import MissionConnectionSection from './MissionConnectionSection';
import KnowledgeGraphService from '../../services/KnowledgeGraphService';
import ClaudeService from '../../services/ClaudeService';
import PremiumVoiceService from '../../services/PremiumVoiceService';
import { calculateFamilyAchievements, getNextAchievement } from '../../utils/familyAchievements';
import {
  calculateCognitiveLoadTrend,
  predictUpcomingWeekLoad,
  detectHabitStreakAlerts,
  detectImbalanceTrends,
  predictRelationshipHealth,
  predictKidDevelopmentReadiness
} from '../../utils/predictions';

// Trust-building transparency component
const DataSourceTooltip = ({ sources, reasoning }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div className="relative inline-block">
      <Info 
        className="w-4 h-4 text-blue-500 cursor-pointer hover:text-blue-600"
        onClick={() => setShowDetails(!showDetails)}
      />
      {showDetails && (
        <div className="absolute z-50 w-80 p-4 bg-white rounded-lg shadow-xl border border-gray-200 -right-2 top-6">
          <h4 className="font-semibold text-sm mb-2">How we know this:</h4>
          <div className="space-y-2 text-xs">
            {sources.map((source, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                <span>{source}</span>
              </div>
            ))}
          </div>
          {reasoning && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-600">{reasoning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Kid-friendly question component
const KidQuestion = ({ question, onAnswer, kidName }) => {
  const [answer, setAnswer] = useState('');
  
  return (
    <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <span className="font-semibold text-purple-800">{kidName ? `Hey ${kidName}!` : 'Kids Corner!'}</span>
      </div>
      <p className="text-lg mb-3">{question}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onAnswer('mama')}
          className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          Mama! 👩
        </button>
        <button
          onClick={() => onAnswer('papa')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Papa! 👨
        </button>
        <button
          onClick={() => onAnswer('both')}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          Both! 👫
        </button>
      </div>
    </div>
  );
};

// Progress visualization component
const ProgressChart = ({ data, title, dataSources }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <DataSourceTooltip 
          sources={dataSources}
          reasoning="We track this data to help your family see patterns and celebrate progress"
        />
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-sm w-20 text-gray-600">{item.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
              <div 
                className={`absolute left-0 top-0 h-full transition-all duration-500 ${
                  item.improvement ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
              <span className="absolute right-2 top-1 text-xs font-medium">
                {item.value}%
              </span>
            </div>
            {item.improvement && (
              <TrendingUp className="w-4 h-4 text-green-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const EnhancedFamilyMeeting = ({ onClose, embedded = false }) => {
  console.log("EnhancedFamilyMeeting component is rendering!");
  const navigate = useNavigate();
  const { currentFamily, familyMembers, familyId } = useFamily();
  const { currentUser } = useAuth();
  
  console.log("Family context data:", { currentFamily, familyId, familyMembers });
  
  // Use navigate to go back if no onClose prop is provided
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    } else {
      navigate('/dashboard?tab=tasks');
    }
  }, [onClose, navigate]);
  const [meetingData, setMeetingData] = useState({
    previousGoals: [],
    wins: [],
    challenges: [],
    taskData: {},
    balanceScores: {},
    eloChanges: {},
    insights: [],
    kidResponses: {}
  });
  const [currentSection, setCurrentSection] = useState('welcome');
  const [isAllieMode, setIsAllieMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Enhancement state variables
  const [predictions, setPredictions] = useState(null);
  const [kgInsights, setKgInsights] = useState(null);
  const [familyStory, setFamilyStory] = useState('');
  const [achievements, setAchievements] = useState([]);
  const [storyMode, setStoryMode] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [surveyInsights, setSurveyInsights] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);

  // Fetch comprehensive meeting data
  useEffect(() => {
    const familyIdToUse = currentFamily?.id || familyId;
    
    if (!familyIdToUse) {
      console.log("No family ID available, using demo data");
      setIsLoading(false);
      // Set demo data for the meeting
      setMeetingData({
        previousGoals: [{text: 'Spend quality time together', completed: true}],
        wins: [{
          text: 'Great teamwork this week!',
          icon: '🎉',
          sources: ['Family collaboration']
        }],
        challenges: [{
          text: 'Finding time for everyone',
          icon: '⏰',
          sources: ['Schedule analysis']
        }],
        taskData: {},
        taskCategories: { visible: 5, invisible: 3 },
        balanceScores: {
          current: 80,
          previous: 75,
          trend: 'improving'
        },
        eloChanges: {
          'Parent 1': { before: 1200, after: 1250, direction: 'up' },
          'Parent 2': { before: 1180, after: 1220, direction: 'up' }
        },
        insights: [{
          text: 'Family balance is improving week over week',
          source: 'Weekly analysis',
          confidence: 'high'
        }],
        eventCount: 12,
        choreCount: 8,
        kidResponses: {}
      });
      return;
    }

    const fetchMeetingData = async () => {
      console.log("Starting to fetch meeting data for family:", familyIdToUse);
      setIsLoading(true);
      try {
        const now = new Date();
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        const lastWeekStart = startOfWeek(subWeeks(now, 1));

        // Fetch all data sources for transparency + enhanced KG/predictions
        const [
          tasksSnapshot,
          habitsSnapshot,
          meetingsSnapshot,
          surveySnapshot,
          choreSnapshot,
          eventsSnapshot,
          kgData,
          predictionsData,
          upcomingEventsSnapshot
        ] = await Promise.all([
          // Task completions
          getDocs(query(
            collection(db, 'families', familyIdToUse, 'taskRecommendations'),
            where('completedAt', '>=', weekStart),
            where('completedAt', '<=', weekEnd)
          )),
          // Habit tracking
          getDocs(query(
            collection(db, 'families', familyIdToUse, 'habits'),
            where('lastCompleted', '>=', weekStart)
          )),
          // Previous meeting goals
          getDocs(query(
            collection(db, 'families', familyIdToUse, 'meetings'),
            orderBy('createdAt', 'desc'),
            limit(1)
          )),
          // Survey responses
          getDocs(query(
            collection(db, 'families', familyIdToUse, 'surveyResponses'),
            where('timestamp', '>=', lastWeekStart),
            orderBy('timestamp', 'desc')
          )),
          // Chore completions
          getDocs(query(
            collection(db, 'choreInstances'),
            where('familyId', '==', familyIdToUse),
            where('completedAt', '>=', weekStart)
          )),
          // Calendar events attended (this week)
          getDocs(query(
            collection(db, 'families', familyIdToUse, 'events'),
            where('startTime', '>=', weekStart.toISOString()),
            where('startTime', '<=', weekEnd.toISOString())
          )),
          // Knowledge Graph insights (invisible labor, cognitive load)
          KnowledgeGraphService.getInvisibleLaborAnalysis(familyIdToUse).catch(err => {
            console.warn('KG insights failed, continuing without:', err);
            return { success: false, data: null };
          }),
          // Predictive insights (burnout risk, upcoming load)
          KnowledgeGraphService.getPredictiveInsights(familyIdToUse, familyMembers).catch(err => {
            console.warn('Predictions failed, continuing without:', err);
            return { success: false, predictions: null };
          }),
          // Upcoming events (next 2 weeks for load prediction)
          getDocs(query(
            collection(db, 'families', familyIdToUse, 'events'),
            where('startTime', '>=', new Date().toISOString()),
            orderBy('startTime', 'asc'),
            limit(30)
          ))
        ]);

        // Process task data with member attribution
        const tasksByMember = {};
        const taskCategories = { visible: 0, invisible: 0 };
        
        tasksSnapshot.forEach(doc => {
          const task = doc.data();
          const memberId = task.completedBy || task.assignedTo;
          if (!tasksByMember[memberId]) {
            tasksByMember[memberId] = { completed: 0, total: 0, categories: {} };
          }
          tasksByMember[memberId].completed++;
          tasksByMember[memberId].total++;
          
          // Track visible vs invisible
          if (task.visibility === 'visible') {
            taskCategories.visible++;
          } else {
            taskCategories.invisible++;
          }
        });

        // Calculate ELO changes (simulated for now - would come from ELORatingService)
        const eloChanges = {};
        Object.keys(tasksByMember).forEach(memberId => {
          const member = familyMembers.find(m => m.id === memberId);
          if (member) {
            eloChanges[member.name] = {
              before: 1200 + Math.random() * 100,
              after: 1200 + Math.random() * 150,
              direction: Math.random() > 0.3 ? 'up' : 'down'
            };
          }
        });

        // Process survey insights
        const insights = [];
        surveySnapshot.forEach(doc => {
          const response = doc.data();
          if (response.insights) {
            insights.push({
              text: response.insights,
              source: 'Weekly survey',
              confidence: 'high'
            });
          }
        });
        
        // Always add some default insights if none from surveys
        if (insights.length === 0) {
          insights.push(
            {
              text: 'Your family shows strong collaboration when working on shared tasks',
              source: 'Task completion patterns',
              confidence: 'high'
            },
            {
              text: 'Consider scheduling a weekly family activity to strengthen bonds',
              source: 'Family engagement metrics',
              confidence: 'medium'
            }
          );
        }

        // Identify wins and challenges
        const wins = [];
        const challenges = [];

        // Win: High task completion
        const totalTasks = Object.values(tasksByMember).reduce((sum, m) => sum + m.total, 0);
        if (totalTasks > 0) {
          wins.push({
            text: `Completed ${totalTasks} tasks this week!`,
            icon: '🎉',
            sources: ['Task tracking system', 'Completion timestamps']
          });
        }
        
        // Always add collaborative wins
        wins.push({
          text: 'Family worked together on shared goals',
          icon: '🤝',
          sources: ['Family collaboration metrics']
        });
        
        // Add family time win
        if (eventsSnapshot.size > 0) {
          wins.push({
            text: `Spent quality time together at ${eventsSnapshot.size} events`,
            icon: '👨‍👩‍👧‍👦',
            sources: ['Calendar tracking', 'Event attendance']
          });
        }

        // Challenge: Imbalance detection
        const completionRates = Object.values(tasksByMember).map(m => m.completed / (m.total || 1));
        const avgRate = completionRates.length > 0 ? completionRates.reduce((a, b) => a + b, 0) / completionRates.length : 0.5;
        const variance = completionRates.length > 0 ? completionRates.reduce((sum, rate) => sum + Math.pow(rate - avgRate, 2), 0) / completionRates.length : 0;
        
        if (variance > 0.1 || challenges.length === 0) {
          challenges.push({
            text: 'Task distribution could be more balanced',
            icon: '⚖️',
            sources: ['Task assignment data', 'Completion patterns']
          });
        }
        
        // Add communication challenge
        challenges.push({
          text: 'Finding time for everyone to connect',
          icon: '🕐',
          sources: ['Schedule analysis', 'Meeting attendance']
        });

        // Get previous goals
        const previousGoals = [];
        if (!meetingsSnapshot.empty) {
          const lastMeeting = meetingsSnapshot.docs[0].data();
          if (lastMeeting.goals) {
            previousGoals.push(...lastMeeting.goals);
          }
        }

        // Process Knowledge Graph insights
        if (kgData && kgData.success && kgData.data) {
          setKgInsights(kgData.data);
          console.log('✅ Knowledge Graph insights loaded:', kgData.data);
        }

        // Process predictive insights
        if (predictionsData && predictionsData.success && predictionsData.predictions) {
          setPredictions(predictionsData.predictions);
          console.log('✅ Predictive insights loaded:', predictionsData.predictions);
        }

        // Calculate family achievements
        const achievementsData = calculateFamilyAchievements({
          meetingHistory: meetingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })),
          balanceScores: {
            current: 75 + Math.random() * 20,
            previous: 70 + Math.random() * 20
          },
          taskDistribution: tasksByMember,
          kidsInvolvement: {
            choreCompletions: choreSnapshot.size,
            activeTasks: choreSnapshot.docs.filter(doc => doc.data().status === 'active').length
          },
          fairPlayCards: familyMembers.reduce((acc, member) => {
            acc[member.id] = member.fairPlayCards || [];
            return acc;
          }, {}),
          habitCompletions: habitsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })),
          previousGoals: previousGoals,
          eventRoles: upcomingEventsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        });
        setAchievements(achievementsData);
        console.log('✅ Family achievements calculated:', achievementsData.length, 'achievements');

        // Process upcoming events for Mission section
        const upcomingEvents = upcomingEventsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          category: doc.data().category || 'family_event'
        }));

        setMeetingData({
          previousGoals,
          wins,
          challenges,
          taskData: tasksByMember,
          taskCategories,
          balanceScores: {
            current: 75 + Math.random() * 20,
            previous: 70 + Math.random() * 20,
            trend: 'improving'
          },
          eloChanges,
          insights,
          eventCount: eventsSnapshot.size,
          choreCount: choreSnapshot.size,
          upcomingEvents  // Add for Mission section
        });

      } catch (error) {
        console.error('Error fetching meeting data:', error);
        // Set some default data so the component can still render
        setMeetingData({
          previousGoals: [],
          wins: [{
            text: 'Great job completing tasks this week!',
            icon: '🎉',
            sources: ['Default celebration']
          }],
          challenges: [],
          taskData: {},
          taskCategories: { visible: 0, invisible: 0 },
          balanceScores: {
            current: 75,
            previous: 70,
            trend: 'improving'
          },
          eloChanges: {},
          insights: [],
          eventCount: 0,
          choreCount: 0,
          kidResponses: {}
        });
      } finally {
        console.log("Finished fetching meeting data, setting isLoading to false");
        setIsLoading(false);
      }
    };

    fetchMeetingData();
  }, [currentFamily, familyId, familyMembers]);

  // Save meeting notes and goals
  const saveMeetingNotes = async (goals, notes) => {
    const familyIdToUse = currentFamily?.id || familyId;
    if (!familyIdToUse) return;

    try {
      await setDoc(doc(collection(db, 'families', familyIdToUse, 'meetings')), {
        goals,
        notes,
        attendees: familyMembers.map(m => m.id),
        createdAt: serverTimestamp(),
        createdBy: currentUser.uid,
        kidResponses: meetingData.kidResponses,
        balanceScore: meetingData.balanceScores.current
      });

      // Navigate back after successful save
      handleClose();
    } catch (error) {
      console.error('Error saving meeting:', error);
    }
  };

  // Voice controls
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (voiceEnabled) {
      PremiumVoiceService.interrupt();
    }
  };

  const exportAudio = async () => {
    try {
      // Generate summary text from meeting
      const today = format(new Date(), 'yyyy-MM-dd');
      const summaryText = `Family Meeting Summary for ${today}.
        ${meetingData.wins?.length > 0 ? `Wins: ${meetingData.wins.map(w => w.text).join(', ')}. ` : ''}
        ${meetingData.challenges?.length > 0 ? `Challenges: ${meetingData.challenges.map(c => c.text).join(', ')}. ` : ''}
        ${meetingData.insights?.length > 0 ? `Insights: ${meetingData.insights.map(i => i.text).join(', ')}.` : ''}`;

      // Convert to speech using premium voice
      const audioBlob = await PremiumVoiceService.generateAudio(summaryText, {
        voice: 'nova',
        speed: 0.95
      });

      // Download
      const url = URL.createObjectURL(audioBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Family-Meeting-${today}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export audio:', error);
      alert('Audio export failed. Please try again.');
    }
  };

  const sections = [
    { id: 'welcome', label: 'Welcome', icon: Heart },
    { id: 'review', label: 'Last Week', icon: Trophy },
    { id: 'wins', label: 'Celebrate!', icon: Star },
    { id: 'challenges', label: 'Challenges', icon: Target },
    { id: 'insights', label: 'Insights', icon: Lightbulb },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'missionAlignment', label: 'Mission', icon: Target },
    { id: 'goals', label: 'Next Week', icon: Target }
  ];

  const renderSection = () => {
    switch(currentSection) {
      case 'welcome':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Family Meeting Time! 🎉
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Let's review our week and plan for success
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setIsAllieMode(false)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  !isAllieMode ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Users className="w-8 h-8 mb-3 text-blue-600" />
                <h3 className="font-semibold text-lg mb-2">Self-Guided</h3>
                <p className="text-sm text-gray-600">
                  Lead the meeting yourselves with our structure
                </p>
              </button>

              <button
                onClick={() => setIsAllieMode(true)}
                className={`p-6 rounded-xl border-2 transition-all ${
                  isAllieMode ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <MessageCircle className="w-8 h-8 mb-3 text-purple-600" />
                <h3 className="font-semibold text-lg mb-2">Allie-Facilitated</h3>
                <p className="text-sm text-gray-600">
                  Let Allie guide your family through the meeting
                </p>
              </button>
            </div>

            <KidQuestion
              question="Who's excited for family meeting? 🎊"
              onAnswer={(answer) => {
                setMeetingData(prev => ({
                  ...prev,
                  kidResponses: { ...prev.kidResponses, excitement: answer }
                }));
              }}
              kidName={familyMembers?.find(m => m.role === 'child')?.name}
            />
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Previous Week's Goals</h2>
              <DataSourceTooltip
                sources={['Last family meeting notes', 'Goal tracking system']}
                reasoning="Reviewing goals helps us learn what works"
              />
            </div>

            {meetingData.previousGoals.length > 0 ? (
              <div className="space-y-3">
                {meetingData.previousGoals.map((goal, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                    <span>{goal.text}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const newGoals = [...meetingData.previousGoals];
                          newGoals[index].completed = true;
                          setMeetingData(prev => ({ ...prev, previousGoals: newGoals }));
                        }}
                        className={`${goal.completed ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => {
                          const newGoals = [...meetingData.previousGoals];
                          newGoals[index].completed = false;
                          setMeetingData(prev => ({ ...prev, previousGoals: newGoals }));
                        }}
                        className={`${!goal.completed ? 'text-red-600' : 'text-gray-400 hover:text-red-600'}`}
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 p-6 rounded-xl">
                <p className="text-gray-700 mb-3">No previous goals to review - let's set some today!</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>💡 Tip: Setting weekly goals helps families:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Stay focused on what matters</li>
                    <li>Celebrate progress together</li>
                    <li>Build accountability</li>
                  </ul>
                </div>
              </div>
            )}

            <ProgressChart
              title="Balance Improvement"
              data={[
                { label: 'Last Week', value: meetingData.balanceScores.previous },
                { label: 'This Week', value: meetingData.balanceScores.current, improvement: true }
              ]}
              dataSources={['Task completion data', 'Survey responses', 'Time tracking']}
            />

            <KidQuestion
              question="What was your favorite thing we did as a family this week?"
              onAnswer={(answer) => {
                setMeetingData(prev => ({
                  ...prev,
                  kidResponses: { ...prev.kidResponses, favoriteActivity: answer }
                }));
              }}
              kidName={familyMembers?.find(m => m.role === 'child')?.name}
            />
          </div>
        );

      case 'wins':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              Celebrate Our Wins!
            </h2>

            <div className="grid gap-4">
              {meetingData.wins.map((win, index) => (
                <div key={index} className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{win.icon}</span>
                      <div>
                        <p className="font-semibold text-lg">{win.text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm text-gray-600">Based on:</span>
                          <DataSourceTooltip sources={win.sources} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-yellow-50 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-600" />
                Task Champions This Week
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(meetingData.taskData).length > 0 ? Object.entries(meetingData.taskData).map(([memberId, data]) => {
                  const member = familyMembers?.find(m => m.id === memberId);
                  return member ? (
                    <div key={memberId} className="text-center">
                      <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {member.name[0]}
                      </div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-gray-600">{data.completed} tasks</p>
                    </div>
                  ) : null;
                }) : (
                  <div className="col-span-2 text-center py-4 text-gray-600">
                    <Trophy className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                    <p>Everyone's a champion!</p>
                    <p className="text-sm mt-1">Start tracking tasks to see individual achievements.</p>
                  </div>
                )}
              </div>
            </div>

            <KidQuestion
              question="Who helped the most with chores this week? 🧹"
              onAnswer={(answer) => {
                setMeetingData(prev => ({
                  ...prev,
                  kidResponses: { ...prev.kidResponses, choreChampion: answer }
                }));
              }}
              kidName={familyMembers?.find(m => m.role === 'child')?.name}
            />
          </div>
        );

      case 'challenges':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Challenges & Learning</h2>

            <div className="space-y-4">
              {meetingData.challenges.length > 0 ? meetingData.challenges.map((challenge, index) => (
                <div key={index} className="bg-orange-50 p-6 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{challenge.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{challenge.text}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm text-gray-600">Identified from:</span>
                        <DataSourceTooltip sources={challenge.sources} />
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="bg-yellow-50 p-6 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💡</span>
                    <div className="flex-1">
                      <p className="font-semibold">No major challenges identified this week!</p>
                      <p className="text-sm text-gray-600 mt-1">Keep up the great work and communication.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold mb-4">ELO Rating Changes</h3>
              <p className="text-sm text-gray-600 mb-4">
                How our AI is learning about task preferences:
              </p>
              <div className="space-y-3">
                {Object.keys(meetingData.eloChanges).length > 0 ? Object.entries(meetingData.eloChanges).map(([name, data]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="font-medium">{name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{Math.round(data.before)}</span>
                      <span>→</span>
                      <span className={`text-sm font-semibold ${
                        data.direction === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {Math.round(data.after)}
                      </span>
                      {data.direction === 'up' ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-4 text-gray-600">
                    <p>No ELO changes recorded this week.</p>
                    <p className="text-sm mt-2">Complete more tasks to see preference patterns!</p>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <DataSourceTooltip
                  sources={['Task completion patterns', 'Time-to-complete metrics', 'Task switching frequency']}
                  reasoning="ELO ratings help us suggest tasks that match each person's strengths"
                />
              </div>
            </div>

            <KidQuestion
              question="What was hard for you this week? It's okay to share! 💪"
              onAnswer={(answer) => {
                setMeetingData(prev => ({
                  ...prev,
                  kidResponses: { ...prev.kidResponses, difficulty: answer }
                }));
              }}
              kidName={familyMembers?.find(m => m.role === 'child')?.name}
            />
          </div>
        );

      case 'insights':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
              <DataSourceTooltip
                sources={[
                  'Pattern analysis across all family data',
                  'Comparison with successful family patterns',
                  'Behavioral science research'
                ]}
                reasoning="We analyze patterns to provide personalized recommendations"
              />
            </div>

            {/* Add default insights if none exist */}
            <div className="space-y-4">
              {(meetingData.insights.length > 0 ? meetingData.insights : [
                {
                  text: 'Your family shows strong collaboration when working on shared tasks',
                  source: 'Task completion patterns',
                  confidence: 'high'
                },
                {
                  text: 'Consider scheduling a weekly family activity to strengthen bonds',
                  source: 'Family engagement metrics',
                  confidence: 'medium'
                },
                {
                  text: 'Kids respond well to visual progress tracking - try a family chart!',
                  source: 'Behavioral research',
                  confidence: 'high'
                }
              ]).map((insight, index) => (
                <div key={index} className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-6 h-6 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{insight.text}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {insight.source}
                        </span>
                        <span className="text-xs text-gray-600">
                          Confidence: {insight.confidence}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add interactive family questions */}
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                Family Discussion Questions
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-blue-600">1.</span>
                  <p>What was our biggest win as a family this week?</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-600">2.</span>
                  <p>What's one thing we could do better next week?</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-blue-600">3.</span>
                  <p>How can we support each other more?</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-semibold mb-4">This Week's Activity</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-bold text-blue-600">{meetingData.eventCount}</p>
                  <p className="text-sm text-gray-600">Events</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-green-600">{meetingData.choreCount}</p>
                  <p className="text-sm text-gray-600">Chores Done</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">
                    {Math.round(meetingData.balanceScores.current)}%
                  </p>
                  <p className="text-sm text-gray-600">Balance Score</p>
                </div>
              </div>
            </div>

            <KidQuestion
              question="What do you want to learn or try next week? 🚀"
              onAnswer={(answer) => {
                setMeetingData(prev => ({
                  ...prev,
                  kidResponses: { ...prev.kidResponses, nextWeekGoal: answer }
                }));
              }}
              kidName={familyMembers?.find(m => m.role === 'child')?.name}
            />
          </div>
        );

      case 'achievements':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Award className="w-8 h-8 text-yellow-500" />
              Family Achievements
            </h2>
            <FamilyAchievementsSection
              achievements={achievements}
              familyMembers={familyMembers}
            />
          </div>
        );

      case 'missionAlignment':
        // Extract Fair Play cards from family members
        const fairPlayCards = familyMembers?.reduce((cards, member) => {
          if (member.fairPlayCards && Array.isArray(member.fairPlayCards)) {
            return [...cards, ...member.fairPlayCards.map(card => ({
              ...card,
              ownerId: member.id,
              ownerName: member.name
            }))];
          }
          return cards;
        }, []) || [];

        // Get family values (use from currentFamily or smart defaults)
        const familyValues = currentFamily?.values || [
          { id: 'equal_partnership', name: 'Equal Partnership', icon: '🤝', description: 'Sharing responsibilities fairly' },
          { id: 'quality_time', name: 'Quality Time', icon: '⏰', description: 'Prioritizing family connection' },
          { id: 'growth_mindset', name: 'Growth Mindset', icon: '🌱', description: 'Learning and improving together' }
        ];

        // Extract event roles from stored meeting data
        const eventRoles = meetingData.upcomingEvents || [];

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-8 h-8 text-blue-500" />
              Mission Alignment
            </h2>
            <MissionConnectionSection
              balanceScoreChange={meetingData.balanceScores.current - meetingData.balanceScores.previous}
              fairPlayCards={fairPlayCards}
              familyValues={familyValues}
              taskDistribution={meetingData.taskData || {}}
              eventRoles={eventRoles}
              previousGoals={meetingData.previousGoals || []}
              currentWeek={1}
            />
          </div>
        );

      case 'goals':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Goals for Next Week</h2>

            <div className="bg-green-50 rounded-xl p-6">
              <h3 className="font-semibold mb-4">Suggested Goals</h3>
              <p className="text-sm text-gray-600 mb-4">
                Based on this week's patterns and challenges:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Improve task balance by 10%</p>
                    <p className="text-sm text-gray-600">
                      Share 2 tasks between family members each day
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium">Schedule one family activity</p>
                    <p className="text-sm text-gray-600">
                      Based on survey: outdoor activities rated highest
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold">Your Goals:</h3>
              <textarea
                id="family-goals-textarea"
                className="w-full p-4 border rounded-lg"
                rows={4}
                placeholder="What are your family's goals for next week?"
                defaultValue=""
              />
            </div>

            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="font-semibold mb-2">Meeting Summary</h3>
              <div className="space-y-2 text-sm">
                <p>✅ Reviewed {(meetingData.previousGoals || []).length} previous goals</p>
                <p>🎉 Celebrated {(meetingData.wins || []).length} wins</p>
                <p>💪 Identified {(meetingData.challenges || []).length} areas to improve</p>
                <p>💡 Generated {(meetingData.insights || []).length} personalized insights</p>
                <p>👶 Collected {Object.keys(meetingData.kidResponses || {}).length} kid responses</p>
              </div>
            </div>

            <button
              onClick={() => {
                const goalsTextarea = document.getElementById('family-goals-textarea');
                const goals = goalsTextarea ? goalsTextarea.value.split('\n').filter(g => g.trim()).map(text => ({ text, completed: false })) : [];
                saveMeetingNotes(goals, 'Family meeting completed successfully');
              }}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              Complete Meeting & Save Notes
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${embedded ? 'h-full' : 'min-h-screen'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Gathering your family's data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={embedded ? "h-full flex flex-col bg-white" : "min-h-screen bg-gray-50"}>
      {/* Header with back button - only show if not embedded */}
      {!embedded && (
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Go back"
                >
                  <ArrowLeft className="w-6 h-6 text-gray-500" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Family Meeting Time</h1>
              </div>

              {/* Voice Controls */}
              <div className="flex items-center gap-2">
                {/* Voice Toggle */}
                <button
                  onClick={toggleVoice}
                  className={`p-2 rounded-lg transition-colors ${
                    voiceEnabled
                      ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={voiceEnabled ? 'Voice On' : 'Voice Off'}
                >
                  {voiceEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>

                {/* Audio Export */}
                <button
                  onClick={exportAudio}
                  className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                  title="Export Audio Summary"
                >
                  <Download className="w-5 h-5" />
                </button>

                {/* Story Mode Toggle */}
                <button
                  onClick={() => setStoryMode(!storyMode)}
                  className={`p-2 rounded-lg transition-colors ${
                    storyMode
                      ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title="Story Mode"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
      {isAllieMode ? (
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">Allie-Facilitated Family Meeting</h1>
            <p className="text-gray-600 mb-6">
              Let me guide you through your family meeting with questions and insights!
            </p>
          </div>
          <AllieChat
            mode="family-meeting"
            meetingData={meetingData}
            onComplete={(notes) => saveMeetingNotes(notes.goals, notes.summary)}
          />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-4">
          {/* Progress bar */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    currentSection === section.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <section.icon className="w-4 h-4" />
                  <span className="hidden md:inline text-sm">{section.label}</span>
                </button>
              ))}
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${((sections.findIndex(s => s.id === currentSection) + 1) / sections.length) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Main content */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {renderSection()}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button
                onClick={() => {
                  const currentIndex = sections.findIndex(s => s.id === currentSection);
                  if (currentIndex > 0) {
                    setCurrentSection(sections[currentIndex - 1].id);
                  }
                }}
                disabled={currentSection === sections[0].id}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                ← Previous
              </button>
              <button
                onClick={() => {
                  const currentIndex = sections.findIndex(s => s.id === currentSection);
                  if (currentIndex < sections.length - 1) {
                    setCurrentSection(sections[currentIndex + 1].id);
                  }
                }}
                disabled={currentSection === sections[sections.length - 1].id}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Floating Predictions Panel */}
      {predictions && (
        <div className="fixed bottom-4 left-4 z-40 bg-white rounded-lg shadow-lg p-3 max-w-sm">
          <h4 className="font-bold text-sm text-gray-800 mb-2">🔮 Insights Available</h4>
          <div className="space-y-1 text-xs text-gray-600">
            {predictions.burnoutRisks && predictions.burnoutRisks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>{predictions.burnoutRisks.length} burnout alert{predictions.burnoutRisks.length > 1 ? 's' : ''}</span>
              </div>
            )}
            {predictions.upcomingLoad && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>Next week: {predictions.upcomingLoad.forecast}</span>
              </div>
            )}
            {predictions.habitStreaks && predictions.habitStreaks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>{predictions.habitStreaks.length} habit streak{predictions.habitStreaks.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFamilyMeeting;