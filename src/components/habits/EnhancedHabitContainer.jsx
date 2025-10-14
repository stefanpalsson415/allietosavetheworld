// src/components/habits/EnhancedHabitContainer.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import HabitQuestView from './HabitQuestView';
import HabitDJPanel from './HabitDJPanel';
import HabitBankDashboard from './HabitBankDashboard';
import HabitCard from '../dashboard/HabitCard';
import { Gamepad2, Music, PiggyBank, Plus, ChevronRight, Sparkles } from 'lucide-react';
import HabitCyclesService from '../../services/HabitCyclesService';
import HabitQuestService from '../../services/HabitQuestService';
import HabitDJService from '../../services/HabitDJService';
import HabitBankService from '../../services/HabitBankService';

const EnhancedHabitContainer = ({ 
  currentWeek, 
  selectedUser,
  onHabitComplete,
  onHabitUpdate 
}) => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  const [activeView, setActiveView] = useState('overview'); // overview, quest, dj, bank
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeQuests: 0,
    todaysSessions: 0,
    totalWealth: 0,
    weeklyGrowth: 0
  });

  // Load habits and stats
  useEffect(() => {
    loadHabitsAndStats();
  }, [familyId, currentWeek, selectedUser]);

  const loadHabitsAndStats = async () => {
    if (!familyId) return;
    
    try {
      setLoading(true);
      
      // Load habits
      const userHabits = await HabitCyclesService.getHabits(familyId, currentWeek?.toString());
      
      const filteredHabits = userHabits.filter(habit => 
        habit.assignedTo === (selectedUser?.roleType || selectedUser?.role) || 
        habit.assignedToName === selectedUser?.name ||
        habit.assignedTo === "Everyone"
      );
      setHabits(filteredHabits);
      
      // Load stats
      await loadStats();
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Get quest stats
      const quests = await HabitQuestService.getActiveQuests(familyId);
      
      // Get today's DJ sessions
      const sessions = await HabitDJService.getTodaysSessions(currentUser?.uid, familyId);
      
      // Get bank stats
      const bankData = await HabitBankService.initializeHabitBank(familyId);
      const totalWealth = bankData.accounts.reduce((sum, acc) => sum + acc.balance, 0);
      const weeklyGrowth = bankData.portfolio.projectedGrowth?.oneWeek || 0;
      
      setStats({
        activeQuests: quests.length,
        todaysSessions: sessions.length,
        totalWealth,
        weeklyGrowth
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleHabitComplete = async (habitId, reflection) => {
    try {
      // Regular habit completion
      await onHabitComplete(habitId, reflection);
      
      // Update quest progress
      const questProgress = await HabitQuestService.trackQuestProgress(
        habitId, 
        currentUser?.uid, 
        familyId, 
        reflection
      );
      
      // Make bank deposit
      const quality = reflection ? 5 : 3; // Higher quality if reflection provided
      const deposit = await HabitBankService.makeDeposit(
        habitId,
        currentUser?.uid,
        familyId,
        quality
      );
      
      // Show celebration if achievements unlocked
      if (questProgress?.newChapters?.length > 0 || deposit?.unlockedRewards?.length > 0) {
        showCelebration(questProgress, deposit);
      }
      
      // Reload stats
      await loadStats();
    } catch (error) {
      console.error('Error completing habit:', error);
    }
  };

  const showCelebration = (questProgress, deposit) => {
    // Dispatch custom event for celebration animations
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('habit-achievement', {
        detail: {
          chapters: questProgress?.newChapters || [],
          rewards: deposit?.unlockedRewards || [],
          newBalance: deposit?.newBalance || 0
        }
      }));
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => setActiveView('quest')}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-4 hover:shadow-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Gamepad2 className="w-6 h-6 mr-2" />
                <span className="font-medium">Quest Mode</span>
              </div>
              <div className="text-2xl font-bold">{stats.activeQuests}</div>
              <div className="text-sm opacity-90">Active Adventures</div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setActiveView('dj')}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg p-4 hover:shadow-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Music className="w-6 h-6 mr-2" />
                <span className="font-medium">Habit DJ</span>
              </div>
              <div className="text-2xl font-bold">{stats.todaysSessions}</div>
              <div className="text-sm opacity-90">Sessions Today</div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>

        <button
          onClick={() => setActiveView('bank')}
          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg p-4 hover:shadow-lg transition-all transform hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <PiggyBank className="w-6 h-6 mr-2" />
                <span className="font-medium">Habit Bank</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalWealth}</div>
              <div className="text-sm opacity-90">Total Wealth</div>
            </div>
            <ChevronRight className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Sparkles className="w-5 h-5 text-purple-600 mr-2" />
            <span className="font-medium text-gray-800">
              Ready for today's habit practice?
            </span>
          </div>
          <button
            onClick={() => setActiveView('dj')}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors"
          >
            Start 2-min Session
          </button>
        </div>
      </div>

      {/* Habits List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Habits</h3>
        {habits.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-4">No habits yet. Let's create your first one!</p>
            <button
              onClick={() => {
                // Trigger habit creation flow
                if (onHabitUpdate) {
                  onHabitUpdate({ action: 'create' });
                }
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Habit
            </button>
          </div>
        ) : (
          habits.map(habit => (
            <div key={habit.id} className="relative">
              <HabitCard
                habit={habit}
                onComplete={handleHabitComplete}
                onEdit={(habitId) => onHabitUpdate({ action: 'edit', habitId })}
                onDelete={(habitId) => onHabitUpdate({ action: 'delete', habitId })}
              />
              {/* Quest indicator */}
              {habit.questId && (
                <div className="absolute top-2 right-2">
                  <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                    <Gamepad2 className="w-3 h-3 mr-1" />
                    Quest Active
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="enhanced-habit-container">
      {/* Navigation */}
      {activeView !== 'overview' && (
        <button
          onClick={() => setActiveView('overview')}
          className="mb-4 text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
        >
          <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
          Back to Overview
        </button>
      )}

      {/* Active View */}
      {activeView === 'overview' && renderOverview()}
      
      {activeView === 'quest' && (
        <HabitQuestView
          habits={habits}
          familyId={familyId}
          userId={currentUser?.uid}
          familyMembers={familyMembers}
          onBack={() => setActiveView('overview')}
        />
      )}
      
      {activeView === 'dj' && (
        <HabitDJPanel
          habits={habits}
          familyId={familyId}
          userId={currentUser?.uid}
          onBack={() => setActiveView('overview')}
          onSessionComplete={loadStats}
        />
      )}
      
      {activeView === 'bank' && (
        <HabitBankDashboard
          familyId={familyId}
          userId={currentUser?.uid}
          onBack={() => setActiveView('overview')}
          onWithdrawal={loadStats}
        />
      )}
    </div>
  );
};

export default EnhancedHabitContainer;