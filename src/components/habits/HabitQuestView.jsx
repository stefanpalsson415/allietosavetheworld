// src/components/habits/HabitQuestView.jsx
import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, Trophy, Shield, Zap, Users, BookOpen, 
  ChevronRight, Lock, Star, Award, Sparkles 
} from 'lucide-react';
import HabitQuestService from '../../services/HabitQuestService';
import UserAvatar from '../common/UserAvatar';

const HabitQuestView = ({ habits, familyId, userId, familyMembers, onBack }) => {
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateQuest, setShowCreateQuest] = useState(false);

  useEffect(() => {
    loadQuests();
  }, [familyId]);

  const loadQuests = async () => {
    try {
      setLoading(true);
      const activeQuests = await HabitQuestService.getActiveQuests(familyId);
      setQuests(activeQuests);
      if (activeQuests.length > 0 && !selectedQuest) {
        setSelectedQuest(activeQuests[0]);
      }
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const createQuest = async (habitId) => {
    try {
      // Check if this is a template habit ID
      let actualHabitId = habitId;
      
      if (habitId === 'managing-schedules' || habitId === 'paying-bills') {
        // Create a new habit from template first
        const habitTemplate = {
          id: habitId,
          title: habitId === 'managing-schedules' ? 'Managing Schedules' : 'Paying Bills',
          description: habitId === 'managing-schedules' 
            ? 'Coordinating family calendars, activities, appointments, and avoiding conflicts'
            : 'Work on paying bills as part of Household Management',
          category: habitId === 'managing-schedules' ? 'Invisible Household Tasks' : 'Visible Household Tasks',
          frequency: 'Weekly',
          familyId: familyId
        };
        
        // For now, use the template ID directly
        actualHabitId = habitId;
      }
      
      const quest = await HabitQuestService.createHabitQuest(actualHabitId, familyId);
      await loadQuests();
      setSelectedQuest(quest);
      setShowCreateQuest(false);
    } catch (error) {
      console.error('Error creating quest:', error);
    }
  };

  const grantPowerUp = async (questId, type) => {
    try {
      await HabitQuestService.grantPowerUp(questId, type, userId, familyId);
      await loadQuests();
    } catch (error) {
      console.error('Error granting power-up:', error);
    }
  };

  const startLiveSession = async (questId, habitId) => {
    try {
      // Build participants array with complete data
      const currentUser = familyMembers.find(m => m.id === userId);
      const otherMembers = familyMembers.filter(m => m.id !== userId).slice(0, 2);
      
      const participants = [
        { 
          userId: userId,
          name: currentUser?.name || 'You'
        },
        ...otherMembers.map(member => ({
          userId: member.id,
          name: member.name
        }))
      ];
      
      await HabitQuestService.startLivePracticeSession(habitId, familyId, participants);
      // Would trigger video/audio in production
      alert('Live practice session started! Family members have been notified.');
    } catch (error) {
      console.error('Error starting live session:', error);
    }
  };

  const renderQuestMap = (quest) => {
    if (!quest) return null;

    return (
      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{quest.questName}</h3>
        
        {/* Progress Path */}
        <div className="relative">
          <div className="absolute top-8 left-8 right-8 h-1 bg-gray-300 rounded-full"></div>
          <div 
            className="absolute top-8 left-8 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
            style={{ width: `${(quest.familyProgress.currentChapter / quest.storyChapters.length) * 100}%` }}
          ></div>
          
          <div className="relative flex justify-between">
            {quest.storyChapters.map((chapter, index) => {
              const isUnlocked = chapter.unlocked;
              const isCurrent = index === quest.familyProgress.currentChapter;
              
              return (
                <div key={chapter.chapterId} className="flex flex-col items-center">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center transition-all
                    ${isUnlocked ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' : 'bg-gray-300 text-gray-500'}
                    ${isCurrent ? 'ring-4 ring-purple-300 ring-offset-2' : ''}
                  `}>
                    {isUnlocked ? (
                      <BookOpen className="w-6 h-6" />
                    ) : (
                      <Lock className="w-6 h-6" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium">
                      {isUnlocked ? chapter.title : `Day ${chapter.unlockDay}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Chapter Story */}
        {quest.familyProgress.currentChapter > 0 && (
          <div className="mt-8 bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <Sparkles className="w-5 h-5 text-purple-500 mr-2" />
              <h4 className="font-medium">Current Chapter</h4>
            </div>
            <p className="text-gray-700">
              {quest.storyChapters[quest.familyProgress.currentChapter - 1]?.narrative}
            </p>
          </div>
        )}

        {/* Family Progress */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{quest.familyProgress.totalXP}</div>
            <div className="text-sm text-gray-600">Total XP</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <Star className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{quest.familyProgress.collectiveStreak}</div>
            <div className="text-sm text-gray-600">Day Streak</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{quest.familyProgress.achievements.length}</div>
            <div className="text-sm text-gray-600">Achievements</div>
          </div>
        </div>
      </div>
    );
  };

  const renderParticipants = (quest) => {
    if (!quest || !quest.participants) return null;

    return (
      <div className="bg-white rounded-lg p-6 mt-4">
        <h3 className="text-lg font-semibold mb-4">Quest Party</h3>
        <div className="space-y-3">
          {quest.participants.map(participant => {
            const member = familyMembers.find(m => m.id === participant.userId);
            if (!member) return null;
            
            return (
              <div key={participant.userId} className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserAvatar user={member} size="sm" className="mr-3" />
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-600">
                      {participant.role} • {participant.xp} XP
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {participant.contributions} contributions
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPowerUps = (quest) => {
    if (!quest) return null;

    const powerUpTypes = [
      { type: 'streak_shield', name: 'Streak Shield', icon: Shield, color: 'blue' },
      { type: 'double_xp', name: 'Double XP', icon: Zap, color: 'yellow' },
      { type: 'helper_boost', name: 'Helper Boost', icon: Users, color: 'green' }
    ];

    const activePowerUps = quest.powerUps.filter(p => p.active);

    return (
      <div className="bg-white rounded-lg p-6 mt-4">
        <h3 className="text-lg font-semibold mb-4">Power-Ups</h3>
        
        {/* Active Power-Ups */}
        {activePowerUps.length > 0 && (
          <div className="mb-4">
            <div className="text-sm text-gray-600 mb-2">Active</div>
            <div className="flex flex-wrap gap-2">
              {activePowerUps.map((powerUp, index) => {
                const type = powerUpTypes.find(t => t.type === powerUp.type);
                const Icon = type?.icon || Shield;
                
                return (
                  <div
                    key={index}
                    className={`bg-${type?.color || 'gray'}-100 text-${type?.color || 'gray'}-700 px-3 py-2 rounded-lg flex items-center`}
                  >
                    <Icon className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">{type?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Grant Power-Ups (for kids) */}
        <div>
          <div className="text-sm text-gray-600 mb-2">Grant to Parents</div>
          <div className="grid grid-cols-3 gap-2">
            {powerUpTypes.map(type => {
              const Icon = type.icon;
              return (
                <button
                  key={type.type}
                  onClick={() => grantPowerUp(quest.questId, type.type)}
                  className={`bg-gray-50 hover:bg-${type.color}-50 border-2 border-transparent hover:border-${type.color}-200 rounded-lg p-3 transition-all text-center`}
                >
                  <Icon className={`w-6 h-6 mx-auto mb-1 text-${type.color}-500`} />
                  <div className="text-xs font-medium">{type.name}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="habit-quest-view">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Gamepad2 className="w-8 h-8 mr-2 text-purple-600" />
          Family Habit Quests
        </h2>
        <button
          onClick={() => setShowCreateQuest(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Start New Quest
        </button>
      </div>

      {quests.length === 0 ? (
        <div className="bg-purple-50 rounded-lg p-8 text-center">
          <Gamepad2 className="w-16 h-16 text-purple-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Active Quests</h3>
          <p className="text-gray-600 mb-4">
            Start a family quest to make habits more exciting!
          </p>
          <button
            onClick={() => setShowCreateQuest(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Your First Quest
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quest List */}
          <div className="lg:col-span-2">
            {/* Quest Selection Tabs */}
            {quests.length > 1 && (
              <div className="flex space-x-2 mb-4 overflow-x-auto">
                {quests.map(quest => (
                  <button
                    key={quest.questId}
                    onClick={() => setSelectedQuest(quest)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedQuest?.questId === quest.questId
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {quest.questName}
                  </button>
                ))}
              </div>
            )}
            
            {/* Quest Map */}
            {renderQuestMap(selectedQuest)}
            
            {/* Live Session Button */}
            {selectedQuest && (
              <button
                onClick={() => {
                  console.log('Starting live session for quest:', selectedQuest);
                  console.log('Available habits:', habits);
                  
                  // Use the habitId directly from the quest
                  const habitId = selectedQuest.habitId;
                  
                  if (habitId) {
                    startLiveSession(selectedQuest.questId, habitId);
                  } else {
                    console.error('No habitId found for quest:', selectedQuest);
                    alert('Unable to start session - no habit associated with this quest');
                  }
                }}
                className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center"
              >
                <Users className="w-5 h-5 mr-2" />
                Start Family Practice Session
              </button>
            )}
          </div>
          
          {/* Side Panels */}
          <div className="space-y-4">
            {renderParticipants(selectedQuest)}
            {renderPowerUps(selectedQuest)}
          </div>
        </div>
      )}

      {/* Create Quest Modal */}
      {showCreateQuest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Choose a Habit for Your Quest</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {/* Show predefined habit templates if no habits exist */}
              {habits.length === 0 ? (
                <>
                  <button
                    onClick={() => createQuest('managing-schedules')}
                    className="w-full text-left p-3 rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
                  >
                    <div className="font-medium">Managing Schedules</div>
                    <div className="text-sm text-gray-600">Coordinating family calendars, activities, appointments, and avoiding conflicts</div>
                  </button>
                  <button
                    onClick={() => createQuest('paying-bills')}
                    className="w-full text-left p-3 rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
                  >
                    <div className="font-medium">Paying Bills</div>
                    <div className="text-sm text-gray-600">Work on paying bills as part of Household Management</div>
                  </button>
                </>
              ) : (
                /* Show existing habits */
                habits.filter(h => !quests.some(q => q.habitId === h.id)).map(habit => (
                  <button
                    key={habit.id}
                    onClick={() => createQuest(habit.id)}
                    className="w-full text-left p-3 rounded-lg hover:bg-purple-50 transition-colors border border-gray-200"
                  >
                    <div className="font-medium">{habit.title}</div>
                    <div className="text-sm text-gray-600">{habit.description}</div>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowCreateQuest(false)}
              className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitQuestView;