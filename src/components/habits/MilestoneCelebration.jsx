// MilestoneCelebration.jsx - Celebration modal for habit milestones
import React, { useEffect, useState } from 'react';
import { X, Award, Star, Trophy, Sparkles, Users } from 'lucide-react';
import confetti from 'canvas-confetti';
import UserAvatar from '../common/UserAvatar';

const MilestoneCelebration = ({ 
  habit, 
  milestone, 
  familyMembers, 
  onClose, 
  onShare 
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  
  useEffect(() => {
    // Start animation after mount
    setTimeout(() => setShowAnimation(true), 100);
    
    // Trigger confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const getMilestoneMessage = () => {
    switch(milestone) {
      case 10:
        return {
          title: "First Summit Reached! 🏔️",
          message: "10 days strong! You're building momentum.",
          icon: <Star className="w-16 h-16 text-yellow-500" />
        };
      case 20:
        return {
          title: "Climbing Higher! ⛰️",
          message: "20 days! This is becoming part of who you are.",
          icon: <Award className="w-16 h-16 text-blue-500" />
        };
      case 30:
        return {
          title: "Halfway to Mastery! 🎯",
          message: "30 days! You're halfway to making this automatic.",
          icon: <Trophy className="w-16 h-16 text-purple-500" />
        };
      case 40:
        return {
          title: "Excellence in Progress! 💪",
          message: "40 days! Your consistency is inspiring.",
          icon: <Sparkles className="w-16 h-16 text-green-500" />
        };
      case 50:
        return {
          title: "Final Push! 🚀",
          message: "50 days! Just 10 more to habit mastery!",
          icon: <Star className="w-16 h-16 text-orange-500" />
        };
      case 60:
        return {
          title: "HABIT MASTERED! 🏆",
          message: "60 days! You've done it! This habit is now part of your identity.",
          icon: <Trophy className="w-16 h-16 text-gold animate-pulse" />
        };
      default:
        return {
          title: "Milestone Reached!",
          message: `${milestone} completions!`,
          icon: <Award className="w-16 h-16 text-blue-500" />
        };
    }
  };

  const { title, message, icon } = getMilestoneMessage();

  // Get contributors
  const contributors = habit.progressVisualization?.contributions || [];
  const topContributors = contributors
    .sort((a, b) => b.pieces - a.pieces)
    .slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-500 ${
        showAnimation ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
      }`}>
        {/* Header */}
        <div className="relative p-6 text-center border-b">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex justify-center mb-4">
            {icon}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {title}
          </h2>
          
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        {/* Habit Info */}
        <div className="p-6 border-b">
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg text-gray-800">
              {habit.title}
            </h3>
            <p className="text-sm text-gray-600 italic mt-1">
              "{habit.identityStatement}"
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {habit.totalCompletions}
              </div>
              <div className="text-xs text-gray-500">Total Days</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                🔥 {habit.currentStreak}
              </div>
              <div className="text-xs text-gray-500">Current Streak</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(habit.averageCompletionTime || habit.schedule.duration)}m
              </div>
              <div className="text-xs text-gray-500">Avg Time</div>
            </div>
          </div>
        </div>

        {/* Contributors */}
        {topContributors.length > 0 && (
          <div className="p-6 border-b">
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              Top Contributors
            </h4>
            <div className="space-y-2">
              {topContributors.map(contributor => {
                const member = familyMembers.find(m => m.id === contributor.userId);
                if (!member) return null;
                
                return (
                  <div key={contributor.userId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UserAvatar user={member} size="sm" className="mr-2" />
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {contributor.pieces} {habit.progressVisualization.type === 'mountain' ? 'steps' : 'pieces'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 space-y-3">
          {milestone === 60 && (
            <button
              onClick={() => {
                // Generate and download certificate
                window.open(`/habit-certificate?habitId=${habit.habitId}&familyId=${habit.familyId}`, '_blank');
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              🏆 Download Graduation Certificate
            </button>
          )}
          
          <button
            onClick={() => {
              onShare();
              onClose();
            }}
            className="w-full bg-blue-100 text-blue-700 py-3 rounded-lg font-medium hover:bg-blue-200 transition-colors"
          >
            Share with Family
          </button>
          
          <button
            onClick={onClose}
            className="w-full text-gray-600 py-2 hover:text-gray-800 transition-colors"
          >
            Continue
          </button>
        </div>

        {/* Special message for 60-day completion */}
        {milestone === 60 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 text-center text-sm text-gray-700">
            <p className="font-medium mb-1">🎓 Habit Graduate!</p>
            <p>You can continue tracking or start a new habit journey!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MilestoneCelebration;