// src/components/habits/HabitDJPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  Music, Play, Pause, ThumbsUp, Clock, Award, 
  BarChart3, Calendar, Sparkles, Volume2, Radio
} from 'lucide-react';
import HabitDJService from '../../services/HabitDJService';
import UserAvatar from '../common/UserAvatar';

const HabitDJPanel = ({ habits, familyId, userId, onBack, onSessionComplete }) => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [djSettings, setDjSettings] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [optimalTimes, setOptimalTimes] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  
  // Debug logging
  useEffect(() => {
    console.log('HabitDJPanel props:', { habits, familyId, userId });
  }, [habits, familyId, userId]);
  
  // If no habits exist, provide example habits with clear indication
  const displayHabits = habits && habits.length > 0 ? habits : [
    {
      id: 'example-1',
      title: 'Example: Morning Routine',
      description: 'Create your own habits in the Tasks tab to see them here',
      isExample: true
    },
    {
      id: 'example-2',
      title: 'Example: Evening Cleanup',
      description: 'These are just examples - add real habits to get started',
      isExample: true
    }
  ];

  useEffect(() => {
    initializeDJ();
    loadLeaderboard();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, familyId]);

  useEffect(() => {
    if (activeSession && isPlaying) {
      intervalRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [activeSession, isPlaying]);

  const initializeDJ = async () => {
    try {
      const settings = await HabitDJService.initializeDJSettings(userId, familyId);
      setDjSettings(settings);
      
      if (habits && habits.length > 0 && !habits[0].isExample) {
        const times = await HabitDJService.learnOptimalTimes(userId, habits[0].id, familyId);
        setOptimalTimes(times);
      }
    } catch (error) {
      console.error('Error initializing DJ:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const board = await HabitDJService.getFamilyLeaderboard(familyId, 'week');
      setLeaderboard(board);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  const startSession = async () => {
    if (!selectedHabit) {
      alert('Please select a habit first!');
      return;
    }
    
    if (!userId || !familyId) {
      console.error('Missing userId or familyId:', { userId, familyId });
      alert('Unable to start session. Please ensure you are logged in.');
      return;
    }

    try {
      const session = await HabitDJService.startMicroSession(
        selectedHabit.id,
        userId,
        familyId,
        { duration: djSettings?.adaptiveSettings?.preferredSessionLength || 180 }
      );
      
      setActiveSession(session);
      setIsPlaying(true);
      setSessionTime(0);
      
      // Play music (in production, would use real audio)
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.log('Audio playback not available:', err);
        });
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const pauseSession = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const resumeSession = () => {
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play().catch(err => {
        console.log('Audio playback not available:', err);
      });
    }
  };

  const completeSession = async () => {
    if (!activeSession) return;

    try {
      const quality = 5; // In production, would ask user
      const result = await HabitDJService.completeSession(
        activeSession.session.sessionId,
        sessionTime,
        quality,
        'Great session!'
      );
      
      alert(`Session complete! You earned ${result.score} points!`);
      
      setActiveSession(null);
      setIsPlaying(false);
      setSessionTime(0);
      
      await loadLeaderboard();
      if (onSessionComplete) onSessionComplete();
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  const sendKudos = async (sessionId) => {
    try {
      await HabitDJService.sendKudos(sessionId, userId, '🎉');
      alert('Kudos sent!');
    } catch (error) {
      console.error('Error sending kudos:', error);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMicroPlayer = () => {
    if (!activeSession) return null;

    const progress = (sessionTime / activeSession.session.plannedDuration) * 100;
    const visualization = activeSession.visualizations;

    return (
      <div 
        className="bg-gradient-to-br rounded-lg p-6 text-white"
        style={{ 
          background: `linear-gradient(135deg, ${visualization.backgroundColor} 0%, ${visualization.waveColor} 100%)` 
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">{activeSession.session.prompt}</h3>
            <p className="opacity-90">{selectedHabit?.title}</p>
          </div>
          <div className="text-2xl font-mono">
            {formatTime(sessionTime)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white bg-opacity-20 rounded-full h-3 mb-4">
          <div 
            className="bg-white rounded-full h-full transition-all duration-1000"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Voice Guidance */}
        <div className="mb-4 text-center">
          {activeSession.voiceGuidance.map((guide, index) => {
            if (sessionTime >= guide.time && sessionTime < guide.time + 5) {
              return (
                <p key={index} className="text-lg animate-pulse">
                  {guide.text}
                </p>
              );
            }
            return null;
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={isPlaying ? pauseSession : resumeSession}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-4 transition-all"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </button>
          
          {sessionTime >= activeSession.session.plannedDuration && (
            <button
              onClick={completeSession}
              className="bg-white text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all"
            >
              Complete Session
            </button>
          )}
        </div>

        {/* Kudos received */}
        {activeSession.session.kudosReceived?.length > 0 && (
          <div className="mt-4 flex items-center justify-center space-x-2">
            {activeSession.session.kudosReceived.map((kudos, index) => (
              <span key={index} className="text-2xl animate-bounce">
                {kudos.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderOptimalTimes = () => (
    <div className="bg-blue-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-blue-600" />
        Your Optimal Practice Times
      </h3>
      {optimalTimes.length > 0 ? (
        <div className="space-y-3">
          {optimalTimes.map((time, index) => (
            <div key={index} className="bg-white rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{time.label}</div>
                <div className="text-sm text-gray-600">{time.contextTrigger}</div>
              </div>
              <div className="text-sm font-medium text-blue-600">
                {Math.round(time.score)}% match
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">
          Complete a few sessions and I'll learn your best practice times!
        </p>
      )}
    </div>
  );

  const renderLeaderboard = () => (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Award className="w-5 h-5 mr-2 text-yellow-500" />
        Family Leaderboard
      </h3>
      <div className="space-y-3">
        {leaderboard.map((entry, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
          return (
            <div key={entry.userId} className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-xl mr-2">{medal}</span>
                <div>
                  <div className="font-medium">{entry.name}</div>
                  <div className="text-sm text-gray-600">
                    {entry.sessionCount} sessions • {entry.totalKudos} kudos
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">{entry.totalScore}</div>
                <div className="text-xs text-gray-600">points</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSessionSelector = () => (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Choose Your Practice</h3>
      
      {/* Quick Sessions */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">Quick Sessions</div>
        <div className="grid grid-cols-3 gap-2">
          {[30, 60, 120, 180, 300, 600].map(seconds => (
            <button
              key={seconds}
              onClick={() => {
                if (djSettings) {
                  djSettings.adaptiveSettings.preferredSessionLength = seconds;
                  setDjSettings({...djSettings});
                }
              }}
              className={`p-3 rounded-lg border-2 transition-all ${
                djSettings?.adaptiveSettings?.preferredSessionLength === seconds
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium">{seconds >= 60 ? `${seconds/60}m` : `${seconds}s`}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Habit Selection */}
      <div>
        <div className="text-sm text-gray-600 mb-2">Select Habit</div>
        <div className="space-y-2">
          {displayHabits.map(habit => (
            <button
              key={habit.id}
              onClick={() => {
                if (!habit.isExample) {
                  setSelectedHabit(habit);
                } else {
                  alert('Please create real habits in the Tasks tab first!');
                }
              }}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                selectedHabit?.id === habit.id
                  ? 'border-blue-500 bg-blue-50'
                  : habit.isExample 
                    ? 'border-gray-200 bg-gray-50 opacity-60'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
              disabled={habit.isExample}
            >
              <div className="font-medium">
                {habit.title}
                {habit.isExample && <span className="text-xs text-gray-500 ml-2">(Example)</span>}
              </div>
              <div className="text-sm text-gray-600">{habit.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={startSession}
        disabled={!selectedHabit || activeSession}
        className="mt-6 w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        <Play className="w-5 h-5 mr-2" />
        Start DJ Session
      </button>
    </div>
  );

  return (
    <div className="habit-dj-panel">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Music className="w-8 h-8 mr-2 text-blue-600" />
          Habit DJ
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="text-gray-600 hover:text-gray-800"
          >
            <Volume2 className="w-6 h-6" />
          </button>
          <Radio className="w-6 h-6 text-blue-600 animate-pulse" />
        </div>
      </div>

      {/* Hidden audio element - audio file can be added later */}
      {/* <audio ref={audioRef} loop>
        <source src="/audio/habit-dj-default.mp3" type="audio/mpeg" />
      </audio> */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {activeSession ? renderMicroPlayer() : renderSessionSelector()}
          {renderOptimalTimes()}
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {renderLeaderboard()}
          
          {/* Live Sessions */}
          <div className="bg-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
              Live Now
            </h3>
            <p className="text-gray-600 text-sm">
              No family members are practicing right now. Start a session to inspire others!
            </p>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">DJ Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Energy Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {['calm', 'moderate', 'energetic'].map(level => (
                    <button
                      key={level}
                      onClick={() => {
                        // Update energy preference
                      }}
                      className="p-2 rounded-lg border-2 border-gray-200 hover:border-blue-500 capitalize"
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Music Genres</label>
                <div className="space-y-2">
                  {['Motivational', 'Chill Beats', 'Nature Sounds', 'Classical', 'Your Spotify'].map(genre => (
                    <label key={genre} className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span>{genre}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowSettings(false)}
              className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitDJPanel;