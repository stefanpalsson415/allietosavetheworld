// HabitHelperTab.jsx - Kids can see and help with parent habits
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import HabitService2 from '../../services/HabitService2';
import UserAvatar from '../common/UserAvatar';
import { Users, Clock, Award, Mic, Check, Calendar, DollarSign } from 'lucide-react';

const HabitHelperTab = () => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  const [availableHabits, setAvailableHabits] = useState([]);
  const [claimedHabit, setClaimedHabit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [recordingVoice, setRecordingVoice] = useState(false);

  useEffect(() => {
    loadAvailableHabits();
  }, [familyId, currentUser]);

  const loadAvailableHabits = async () => {
    if (!familyId || !currentUser) return;
    
    try {
      setLoading(true);
      const habits = await HabitService2.getAvailableHabitsForHelper(familyId, currentUser.uid);
      setAvailableHabits(habits);
      
      // Check if any habit is already claimed by this child
      const claimed = habits.find(h => h.currentHelper === currentUser.uid);
      setClaimedHabit(claimed || null);
    } catch (error) {
      console.error('Error loading available habits:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimHabit = async (habit) => {
    try {
      await HabitService2.claimHabitToHelp(habit.habitId, familyId, currentUser.uid);
      setClaimedHabit(habit);
      await loadAvailableHabits();
    } catch (error) {
      console.error('Error claiming habit:', error);
      alert('Could not claim this habit. Someone else might be helping already.');
    }
  };

  const releaseHabit = async () => {
    if (!claimedHabit) return;
    
    try {
      await HabitService2.releaseHabitClaim(claimedHabit.habitId, familyId);
      setClaimedHabit(null);
      await loadAvailableHabits();
    } catch (error) {
      console.error('Error releasing habit:', error);
    }
  };

  const completeHabitWithHelp = async () => {
    if (!claimedHabit) return;
    
    setCompleting(true);
    try {
      const completionData = {
        helperId: currentUser.uid,
        helperName: currentUser.displayName || 'Helper',
        duration: claimedHabit.schedule.duration,
        voiceNote: voiceNote || null,
        reflection: voiceNote || `Helped with ${claimedHabit.title}`
      };

      await HabitService2.completeHabit(
        claimedHabit.habitId,
        familyId,
        completionData
      );

      // Show success message
      alert(`Great job! You earned 4 Palsson Bucks for helping! 🎉`);
      
      // Reset
      setClaimedHabit(null);
      setVoiceNote('');
      await loadAvailableHabits();
    } catch (error) {
      console.error('Error completing habit:', error);
      alert('There was an error. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  const startVoiceRecording = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onstart = () => {
        setRecordingVoice(true);
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceNote(transcript);
        setRecordingVoice(false);
      };
      
      recognition.onerror = () => {
        setRecordingVoice(false);
        alert('Could not record voice. Try typing instead!');
      };
      
      recognition.start();
    } else {
      alert('Voice recording not supported. Please type your message!');
    }
  };

  const getParentName = (habit) => {
    const parent = familyMembers.find(m => m.id === habit.createdBy);
    return parent?.name || habit.createdByName || 'Parent';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="habit-helper-tab p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Users className="w-8 h-8 mr-2 text-blue-600" />
          Be a Habit Helper!
        </h2>
        <p className="text-gray-700">
          Help your parents with their habits and earn 4 Palsson Bucks! 
          Choose a habit below to get started.
        </p>
      </div>

      {/* Currently Helping */}
      {claimedHabit && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 text-green-800">
            You're Helping With:
          </h3>
          
          <div className="bg-white rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-lg">{claimedHabit.title}</h4>
                <p className="text-gray-600 text-sm mt-1">
                  For: {getParentName(claimedHabit)}
                </p>
              </div>
              <div className="text-right">
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  4 Bucks
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              <Clock className="w-4 h-4 inline mr-1" />
              {claimedHabit.schedule.duration} minutes
            </div>
            
            {/* Voice Note Section */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">
                Tell us how you helped! (optional)
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={voiceNote}
                  onChange={(e) => setVoiceNote(e.target.value)}
                  placeholder="Type or use voice..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                />
                <button
                  onClick={startVoiceRecording}
                  disabled={recordingVoice}
                  className={`p-2 rounded-lg transition-colors ${
                    recordingVoice 
                      ? 'bg-red-100 text-red-600 animate-pulse' 
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={completeHabitWithHelp}
              disabled={completing}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {completing ? (
                'Saving...'
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  I Helped!
                </>
              )}
            </button>
            <button
              onClick={releaseHabit}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Available Habits */}
      {!claimedHabit && (
        <div>
          <h3 className="text-lg font-semibold mb-4">
            Today's Habits You Can Help With:
          </h3>
          
          {availableHabits.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">
                No habits need help right now. Check back later!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableHabits.map(habit => (
                <div
                  key={habit.habitId}
                  className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => claimHabit(habit)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{habit.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Help {getParentName(habit)}
                      </p>
                    </div>
                    <UserAvatar 
                      user={familyMembers.find(m => m.id === habit.createdBy)} 
                      size="sm"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-600">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {habit.schedule.duration} min
                    </div>
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                      <DollarSign className="w-3 h-3 inline mr-1" />
                      4 Bucks
                    </div>
                  </div>
                  
                  {habit.twoMinuteVersion && (
                    <div className="mt-3 text-xs text-gray-500 italic">
                      Quick version: {habit.twoMinuteVersion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Helper Stats */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Award className="w-6 h-6 mr-2 text-blue-600" />
          Your Helper Stats
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {availableHabits.reduce((total, habit) => 
                total + (habit.childHelpers?.find(h => h.childId === currentUser.uid)?.helpCount || 0)
              , 0)}
            </div>
            <div className="text-sm text-gray-600">Times Helped</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {availableHabits.reduce((total, habit) => 
                total + (habit.childHelpers?.find(h => h.childId === currentUser.uid)?.helpCount || 0) * 4
              , 0)}
            </div>
            <div className="text-sm text-gray-600">Bucks Earned</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {availableHabits.filter(habit => 
                habit.childHelpers?.some(h => h.childId === currentUser.uid)
              ).length}
            </div>
            <div className="text-sm text-gray-600">Habits Helped</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitHelperTab;