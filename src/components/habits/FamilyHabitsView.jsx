// FamilyHabitsView.jsx - New simplified habit system with family collaboration
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import HabitService2 from '../../services/HabitService2';
// import HabitProgressVisualization from './HabitProgressVisualization'; // COMMENTED OUT - visualization disabled
import HabitCard2 from './HabitCard2';
import HabitDrawer from './HabitDrawer';
import MilestoneCelebration from './MilestoneCelebration';
import { Plus, Users, Calendar, Target, TrendingUp, Award, X } from 'lucide-react';
import AllieChat from '../chat/refactored/AllieChat';

const FamilyHabitsView = () => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser, currentUserProfile } = useAuth();

  // Check if current user is a parent
  const isParent = currentUserProfile?.role === 'parent' || currentUserProfile?.isParent;
  const [habits, setHabits] = useState([]);
  const [filter, setFilter] = useState('all'); // all, today, needsHelp
  const [loading, setLoading] = useState(true);
  const [showHabitSetup, setShowHabitSetup] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [showHabitDrawer, setShowHabitDrawer] = useState(false);
  const [familyStats, setFamilyStats] = useState({
    totalHabits: 0,
    completedToday: 0,
    currentStreaks: 0,
    graduatedHabits: 0
  });
  const [showMilestoneCelebration, setShowMilestoneCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState(null);

  useEffect(() => {
    // First run migration to fix existing habits, then load
    const initializeHabits = async () => {
      if (!familyId) return;

      try {
        // Run migration to fix any habits with wrong roles
        const updateCount = await HabitService2.migrateHabitRoles(familyId);
        if (updateCount > 0) {
          console.log(`Migrated ${updateCount} habits with corrected roles`);
        }
      } catch (error) {
        console.error('Error running habit migration:', error);
      }

      // Then load habits
      await loadFamilyHabits();
    };

    initializeHabits();
  }, [familyId]);
  
  // Listen for habit creation events
  useEffect(() => {
    const handleHabitCreated = (event) => {
      console.log('Habit created event received:', event.detail);
      // Reload habits when a new one is created
      loadFamilyHabits();
    };
    
    window.addEventListener('habit-created', handleHabitCreated);
    
    return () => {
      window.removeEventListener('habit-created', handleHabitCreated);
    };
  }, [familyId]);

  const loadFamilyHabits = async () => {
    if (!familyId) return;
    
    try {
      setLoading(true);
      const allHabits = await HabitService2.getFamilyHabits(familyId);
      console.log('Loaded habits:', allHabits.map(h => ({
        title: h.title,
        createdByRole: h.createdByRole,
        status: h.status,
        createdBy: h.createdBy,
        createdByName: h.createdByName
      })));
      
      // Debug specific habit filtering
      console.log('Mama habits:', allHabits.filter(h => h.createdByRole === 'mama').length);
      console.log('Papa habits:', allHabits.filter(h => h.createdByRole === 'papa').length);
      console.log('Active habits:', allHabits.filter(h => h.status === 'active').length);
      
      setHabits(allHabits);
      
      // Calculate family stats
      const today = new Date().toISOString().split('T')[0];
      const stats = {
        totalHabits: allHabits.filter(h => h.status === 'active').length,
        completedToday: allHabits.filter(h => 
          h.lastCompletedDate?.toDate().toISOString().split('T')[0] === today
        ).length,
        currentStreaks: allHabits.filter(h => h.currentStreak > 0).length,
        graduatedHabits: allHabits.filter(h => h.status === 'graduated').length
      };
      setFamilyStats(stats);
    } catch (error) {
      console.error('Error loading habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHabits = () => {
    switch (filter) {
      case 'today':
        const today = new Date().getDay();
        return habits.filter(h => 
          h.status === 'active' && 
          h.schedule.daysOfWeek.includes(today)
        );
      case 'needsHelp':
        return habits.filter(h => 
          h.status === 'active' && 
          h.kidsCanHelp && 
          !h.currentHelper
        );
      default:
        return habits.filter(h => h.status === 'active');
    }
  };

  const getParentHabits = (parentRole) => {
    return getFilteredHabits().filter(h => {
      // Check if createdByRole matches
      if (h.createdByRole === parentRole) return true;
      
      // Fallback: check by user name if createdByRole is missing
      if (!h.createdByRole && h.createdByName) {
        const name = h.createdByName.toLowerCase();
        if (parentRole === 'mama' && (name.includes('kim') || name.includes('mom') || name.includes('mama'))) {
          return true;
        }
        if (parentRole === 'papa' && (name.includes('stefan') || name.includes('dad') || name.includes('papa'))) {
          return true;
        }
      }
      
      // Additional fallback: if no role set and we're looking for papa habits
      // (This is for habits created before the role was properly set)
      if (!h.createdByRole && parentRole === 'papa') {
        // Check if created by Stefan based on userId
        const papaUser = familyMembers?.find(m => 
          m.role === 'parent' && 
          (m.name?.toLowerCase().includes('stefan') || m.name?.toLowerCase() === 'papa')
        );
        if (papaUser && h.createdBy === papaUser.id) {
          return true;
        }
      }
      
      return false;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="family-habits-view">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Family Habits Journey</h2>
            <p className="text-gray-600 mt-1">
              {isParent ? 'Building better habits together, one day at a time' : 'Help your parents with their habits and earn rewards!'}
            </p>
          </div>
          {isParent && (
            <button
              onClick={() => {
                // Scroll to radar chart section for habit creation
                const radarSection = document.getElementById('family-task-balance-section');
                if (radarSection) {
                  radarSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  // Fallback: Dispatch event to open Allie chat with explanation
                  window.dispatchEvent(new CustomEvent('allie-new-prompt', {
                    detail: {
                      prompt: 'explain-habit-creation',
                      isHabitSetupRequest: true
                    }
                  }));
                }
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Habit
            </button>
          )}
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg p-4 text-center">
            <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{familyStats.totalHabits}</div>
            <div className="text-sm text-gray-600">Active Habits</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{familyStats.completedToday}</div>
            <div className="text-sm text-gray-600">Done Today</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{familyStats.currentStreaks}</div>
            <div className="text-sm text-gray-600">Active Streaks</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{familyStats.graduatedHabits}</div>
            <div className="text-sm text-gray-600">Mastered</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Habits
        </button>
        <button
          onClick={() => setFilter('today')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'today' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Today's Habits
        </button>
        <button
          onClick={() => setFilter('needsHelp')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'needsHelp' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1" />
          Can Help
        </button>
      </div>

      {/* Parent Habits Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Mom's Habits */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="text-2xl mr-2">👩</span>
            Mom's Habits
          </h3>
          <div className="space-y-3">
            {getParentHabits('mama').length === 0 ? (
              <p className="text-gray-500 text-center py-4">No habits yet</p>
            ) : (
              getParentHabits('mama').map(habit => (
                <HabitCard2
                  key={habit.habitId}
                  habit={habit}
                  onComplete={async (result) => {
                    // Check if this completion resulted in a milestone
                    if (result && result.milestone) {
                      setCelebrationData({
                        habit: habit,
                        milestone: result.milestone
                      });
                      setShowMilestoneCelebration(true);
                    }
                    // Reload habits to update UI
                    loadFamilyHabits();
                  }}
                  onSelect={() => {
                    setSelectedHabit(habit);
                    setShowHabitDrawer(true);

                    // Auto-fire message to Allie
                    window.dispatchEvent(new CustomEvent('allie-new-prompt', {
                      detail: {
                        prompt: `Tell me about my habit: "${habit.title}". Show current progress and give me encouragement!`,
                        autoSend: true
                      }
                    }));
                  }}
                  onArchive={async (habitId) => {
                    // Remove from local state immediately for instant UI feedback
                    setHabits(prev => prev.filter(h => h.habitId !== habitId));
                  }}
                  familyMembers={familyMembers}
                />
              ))
            )}
          </div>
        </div>

        {/* Dad's Habits */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="text-2xl mr-2">👨</span>
            Dad's Habits
          </h3>
          <div className="space-y-3">
            {getParentHabits('papa').length === 0 ? (
              <p className="text-gray-500 text-center py-4">No habits yet</p>
            ) : (
              getParentHabits('papa').map(habit => (
                <HabitCard2
                  key={habit.habitId}
                  habit={habit}
                  onComplete={async (result) => {
                    // Check if this completion resulted in a milestone
                    if (result && result.milestone) {
                      setCelebrationData({
                        habit: habit,
                        milestone: result.milestone
                      });
                      setShowMilestoneCelebration(true);
                    }
                    // Reload habits to update UI
                    loadFamilyHabits();
                  }}
                  onSelect={() => {
                    setSelectedHabit(habit);
                    setShowHabitDrawer(true);

                    // Auto-fire message to Allie
                    window.dispatchEvent(new CustomEvent('allie-new-prompt', {
                      detail: {
                        prompt: `Tell me about my habit: "${habit.title}". Show current progress and give me encouragement!`,
                        autoSend: true
                      }
                    }));
                  }}
                  onArchive={async (habitId) => {
                    // Remove from local state immediately for instant UI feedback
                    setHabits(prev => prev.filter(h => h.habitId !== habitId));
                  }}
                  familyMembers={familyMembers}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Habit Detail Drawer */}
      <HabitDrawer
        isOpen={showHabitDrawer}
        onClose={() => {
          setShowHabitDrawer(false);
          setSelectedHabit(null);
        }}
        habit={selectedHabit}
        onUpdate={(updatedHabit) => {
          if (updatedHabit === null) {
            // Habit was deleted
            loadFamilyHabits();
          } else {
            // Habit was updated
            setHabits(prev => prev.map(h =>
              h.habitId === updatedHabit.habitId ? updatedHabit : h
            ));
          }
        }}
      />

      {/* Recently Graduated Habits */}
      {habits.filter(h => h.status === 'graduated').length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Award className="w-6 h-6 text-yellow-600 mr-2" />
            Habit Hall of Fame
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.filter(h => h.status === 'graduated').map(habit => (
              <div key={habit.habitId} className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{habit.title}</h4>
                  <span className="text-2xl">🏆</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{habit.identityStatement}</p>
                <div className="text-xs text-gray-500">
                  Mastered on {habit.graduatedAt?.toDate().toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Habit Setup Modal */}
      {showHabitSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Create New Habit with Allie</h2>
                <button
                  onClick={() => setShowHabitSetup(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Allie will guide you through setting up your habit using the Four Laws of behavior change.
              </p>
              <AllieChat 
                embedded={true}
                initialMessage="I'd like to create a new habit"
                onHabitCreated={() => {
                  setShowHabitSetup(false);
                  loadFamilyHabits();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Milestone Celebration Modal */}
      {showMilestoneCelebration && celebrationData && (
        <MilestoneCelebration
          habit={celebrationData.habit}
          milestone={celebrationData.milestone}
          familyMembers={familyMembers}
          onClose={() => {
            setShowMilestoneCelebration(false);
            setCelebrationData(null);
          }}
          onShare={() => {
            // Create a family notification
            console.log('Sharing milestone with family:', celebrationData);
            // TODO: Implement family notification system
          }}
        />
      )}
    </div>
  );
};

export default FamilyHabitsView;