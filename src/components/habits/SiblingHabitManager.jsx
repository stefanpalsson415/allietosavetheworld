import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Progress } from '../common/Progress';
import { 
  Users, 
  Clock, 
  Star, 
  Trophy, 
  Sparkles,
  TrendingUp,
  Heart,
  Target,
  Calendar,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { 
  siblingHabitTemplates, 
  getAgeAppropriateHabits,
  calculateWeeklyTimeSaved,
  getHabitsByBenefit
} from '../../data/siblingHabitTemplates';
import SiblingDynamicsService from '../../services/SiblingDynamicsService';

const SiblingHabitManager = () => {
  const { currentFamily } = useFamily();
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [activeHabits, setActiveHabits] = useState([]);
  const [recommendedHabits, setRecommendedHabits] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (currentFamily?.children?.length > 1) {
      loadRecommendations();
      loadActiveHabits();
    }
  }, [currentFamily]);

  const loadRecommendations = () => {
    // Get age-appropriate habits for all sibling pairs
    const allRecommendations = [];
    const children = currentFamily.children || [];

    for (let i = 0; i < children.length; i++) {
      for (let j = i + 1; j < children.length; j++) {
        const appropriate = getAgeAppropriateHabits(
          children[i].age,
          children[j].age
        );
        
        appropriate.forEach(habit => {
          allRecommendations.push({
            ...habit,
            participants: [children[i].id, children[j].id],
            participantNames: [children[i].name, children[j].name]
          });
        });
      }
    }

    // Remove duplicates and sort by time saved
    const unique = Array.from(new Set(allRecommendations.map(h => h.id)))
      .map(id => allRecommendations.find(h => h.id === id))
      .sort((a, b) => (b.benefits?.parentTimeSaved || 0) - (a.benefits?.parentTimeSaved || 0));

    setRecommendedHabits(unique.slice(0, 6));
  };

  const loadActiveHabits = async () => {
    // In real implementation, load from database
    // For now, use mock data
    setActiveHabits([]);
  };

  const activateHabit = async (habit) => {
    // Create habit instance in database
    const habitInstance = {
      templateId: habit.id,
      familyId: currentFamily.id,
      participants: habit.participants,
      startDate: new Date(),
      status: 'active',
      progress: {
        completions: 0,
        streak: 0,
        lastCompleted: null
      }
    };

    // Track as sibling collaboration
    await SiblingDynamicsService.recordSiblingCollaboration(
      currentFamily.id,
      habit.participants,
      `Started habit: ${habit.name}`,
      { 
        habitId: habit.id,
        expectedTimeSaved: habit.benefits?.parentTimeSaved 
      }
    );

    setActiveHabits([...activeHabits, { ...habit, ...habitInstance }]);
    setShowAddModal(false);
  };

  const completeHabitSession = async (habit) => {
    // Update progress
    const updated = activeHabits.map(h => {
      if (h.id === habit.id) {
        return {
          ...h,
          progress: {
            completions: h.progress.completions + 1,
            streak: h.progress.streak + 1,
            lastCompleted: new Date()
          }
        };
      }
      return h;
    });

    setActiveHabits(updated);

    // Track completion
    await SiblingDynamicsService.recordSiblingCollaboration(
      currentFamily.id,
      habit.participants,
      habit.name,
      {
        completed: true,
        duration: habit.implementation?.duration,
        parentTimeSaved: habit.benefits?.parentTimeSaved / 7 // Daily savings
      }
    );
  };

  const getFilteredHabits = () => {
    let allHabits = [];
    
    switch (filter) {
      case 'academic':
        allHabits = getHabitsByBenefit('academic');
        break;
      case 'time_saving':
        allHabits = getHabitsByBenefit('time_saving');
        break;
      case 'emotional':
        allHabits = getHabitsByBenefit('emotional');
        break;
      default:
        Object.values(siblingHabitTemplates).forEach(category => {
          allHabits = [...allHabits, ...category];
        });
    }

    return allHabits;
  };

  const totalWeeklyTimeSaved = calculateWeeklyTimeSaved(activeHabits);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
              <Users className="w-6 h-6" />
              Sibling Power Habits
            </h2>
            <p className="text-gray-600">
              Build stronger bonds while saving parent time
            </p>
          </div>
          <Button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Habit
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-white/70 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              Weekly Time Saved
            </div>
            <div className="text-xl font-bold text-green-600">
              {totalWeeklyTimeSaved.toFixed(1)}h
            </div>
          </div>
          <div className="bg-white/70 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Trophy className="w-4 h-4" />
              Active Habits
            </div>
            <div className="text-xl font-bold text-blue-600">
              {activeHabits.length}
            </div>
          </div>
          <div className="bg-white/70 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="w-4 h-4" />
              Total Completions
            </div>
            <div className="text-xl font-bold text-purple-600">
              {activeHabits.reduce((sum, h) => sum + (h.progress?.completions || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Active Habits */}
      {activeHabits.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Active Sibling Habits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeHabits.map((habit) => (
              <Card key={habit.id} className="border-2 border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{habit.name}</CardTitle>
                    <Badge className="bg-green-100 text-green-700">
                      {habit.progress.streak} day streak
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{habit.description}</p>
                  
                  {/* Participants */}
                  <div className="flex items-center gap-2 mb-3">
                    {habit.participantNames.map((name, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        {idx > 0 && <span className="text-gray-400">+</span>}
                        <div className="px-3 py-1 bg-blue-100 rounded-full text-sm">
                          {name}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span>Saves {habit.benefits?.parentTimeSaved}h/week</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>{habit.implementation?.frequency}</span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span>This week</span>
                      <span>{Math.min(habit.progress.completions, 7)}/7</span>
                    </div>
                    <Progress 
                      value={(Math.min(habit.progress.completions, 7) / 7) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Action Button */}
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={() => completeHabitSession(habit)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Complete Today's Session
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Habits */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Recommended for Your Family
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedHabits.map((habit) => (
            <Card key={habit.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{habit.name}</CardTitle>
                <Badge variant="outline">{habit.category}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">{habit.description}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Clock className="w-4 h-4" />
                    <span>Saves {habit.benefits?.parentTimeSaved}h/week</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>{habit.benefits?.olderChild}</span>
                  </div>
                </div>

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => activateHabit(habit)}
                >
                  Start This Habit
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Choose a Sibling Habit</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  ✕
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 mb-6">
                {['all', 'time_saving', 'academic', 'emotional'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === f
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Habit List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getFilteredHabits().map((habit) => (
                  <Card 
                    key={habit.id} 
                    className="cursor-pointer hover:border-blue-300 transition-colors"
                    onClick={() => activateHabit(habit)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{habit.name}</CardTitle>
                        {habit.benefits?.parentTimeSaved && (
                          <Badge className="bg-green-100 text-green-700">
                            -{habit.benefits.parentTimeSaved}h/wk
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">{habit.description}</p>
                      
                      {habit.targetAgeGap && (
                        <p className="text-xs text-gray-500">
                          Best for siblings {habit.targetAgeGap[0]}-{habit.targetAgeGap[1]} years apart
                        </p>
                      )}
                      
                      {habit.activities && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Activities:</p>
                          <div className="flex flex-wrap gap-1">
                            {habit.activities.slice(0, 3).map((activity, idx) => (
                              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiblingHabitManager;