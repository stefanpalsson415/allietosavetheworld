// HabitCard2.jsx - Simplified habit card for the new system
import React, { useState } from 'react';
import { Check, Clock, Users, Calendar, TrendingUp, Mic, ChevronRight, Archive, X } from 'lucide-react';
import HabitService2 from '../../services/HabitService2';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';

const HabitCard2 = ({ habit, onComplete, onSelect, onArchive, familyMembers }) => {
  const { currentUser } = useAuth();
  const [completing, setCompleting] = useState(false);
  const [showVoiceNote, setShowVoiceNote] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  
  const isScheduledToday = habit.schedule.daysOfWeek.includes(new Date().getDay());
  const isCompletedToday = habit.lastCompletedDate?.toDate().toISOString().split('T')[0] === 
    new Date().toISOString().split('T')[0];
  const progressPercentage = Math.min((habit.totalCompletions / 60) * 100, 100);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const completionData = {
        userId: currentUser.uid,
        duration: habit.schedule.duration,
        reflection: voiceNote || '',
        voiceNote: voiceNote || null,
        usedTwoMinuteVersion: false
      };

      const result = await HabitService2.completeHabit(
        habit.habitId, 
        habit.familyId, 
        completionData
      );

      // Pass the result to parent component
      onComplete(result);
    } catch (error) {
      console.error('Error completing habit:', error);
    } finally {
      setCompleting(false);
      setShowVoiceNote(false);
      setVoiceNote('');
    }
  };


  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceNote(transcript);
      };

      recognition.start();
    } else {
      alert('Voice input not supported in this browser');
    }
  };

  const handleArchive = async () => {
    try {
      await HabitService2.archiveHabit(habit.habitId, habit.familyId);
      setShowArchiveModal(false);
      if (onArchive) {
        onArchive(habit.habitId);
      }
    } catch (error) {
      console.error('Error archiving habit:', error);
      alert('Failed to archive habit. Please try again.');
    }
  };

  // Only show archive button if current user is the habit owner
  // Check multiple possible userId fields for backward compatibility
  const canArchive = habit.userId === currentUser?.uid ||
                     habit.createdBy === currentUser?.uid ||
                     habit.ownerId === currentUser?.uid;

  // Debug logging to see what's going on
  if (!canArchive) {
    console.log('Archive button hidden. Habit:', {
      habitId: habit.habitId,
      habitUserId: habit.userId,
      habitCreatedBy: habit.createdBy,
      habitOwnerId: habit.ownerId,
      currentUserId: currentUser?.uid
    });
  }

  return (
    <div className={`
      bg-white rounded-lg p-4 border-2 transition-all cursor-pointer
      ${isScheduledToday && !isCompletedToday ? 'border-green-400 shadow-md' : 'border-gray-200'}
      ${isCompletedToday ? 'bg-green-50 border-green-300' : ''}
      hover:shadow-lg
    `}>
      <div onClick={onSelect}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800">{habit.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{habit.identityStatement}</p>
          </div>
          <div className="flex items-center space-x-2">
            {habit.currentStreak > 0 && (
              <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                🔥 {habit.currentStreak}
              </div>
            )}
            {habit.kidsCanHelp && (
              <div className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                <Users className="w-3 h-3 inline mr-1" />
                Kids can help
              </div>
            )}
            {canArchive && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowArchiveModal(true);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Archive habit"
              >
                <Archive className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Schedule Info */}
        <div className="flex items-center text-sm text-gray-500 mb-3">
          <Clock className="w-4 h-4 mr-1" />
          <span>{habit.schedule.timeOfDay}</span>
          <span className="mx-2">•</span>
          <span>{habit.schedule.duration} min</span>
          {isScheduledToday && (
            <>
              <span className="mx-2">•</span>
              <span className="text-green-600 font-medium">Today</span>
            </>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-600">Progress to mastery</span>
            <span className="font-medium">{habit.totalCompletions}/60</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 rounded-full h-2 transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Helper Avatars */}
        {habit.childHelpers && habit.childHelpers.length > 0 && (
          <div className="flex items-center mb-3">
            <span className="text-xs text-gray-600 mr-2">Helpers:</span>
            <div className="flex -space-x-2">
              {habit.childHelpers.slice(0, 3).map(helper => {
                const child = familyMembers.find(m => m.id === helper.childId);
                return child ? (
                  <UserAvatar 
                    key={helper.childId} 
                    user={child} 
                    size="xs"
                    className="ring-2 ring-white"
                  />
                ) : null;
              })}
              {habit.childHelpers.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-300 text-xs flex items-center justify-center ring-2 ring-white">
                  +{habit.childHelpers.length - 3}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isScheduledToday && !isCompletedToday && (
        <div className="border-t pt-3 mt-3">
          {!showVoiceNote ? (
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete();
                }}
                disabled={completing}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <Check className="w-4 h-4 mr-1" />
                {completing ? 'Completing...' : 'Complete'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowVoiceNote(true);
                }}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                title="Add voice note"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={voiceNote}
                  onChange={(e) => setVoiceNote(e.target.value)}
                  placeholder="Add a reflection..."
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVoiceInput();
                  }}
                  className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleComplete();
                  }}
                  disabled={completing}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {completing ? 'Saving...' : 'Complete with note'}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVoiceNote(false);
                    setVoiceNote('');
                  }}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed Today Badge */}
      {isCompletedToday && (
        <div className="border-t pt-3 mt-3">
          <div className="flex items-center justify-center text-green-600">
            <Check className="w-5 h-5 mr-2" />
            <span className="font-medium">Completed today!</span>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            e.stopPropagation();
            setShowArchiveModal(false);
          }}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Archive Habit?</h3>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to archive "<strong>{habit.title}</strong>"?
              You can have a few habits open at a time. Archived habits won't be deleted
              and can be restored later.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitCard2;