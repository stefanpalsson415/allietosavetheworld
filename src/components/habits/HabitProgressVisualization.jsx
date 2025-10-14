// HabitProgressVisualization.jsx - Mountain and Treehouse progress visualizations
import React, { useEffect, useState } from 'react';
import { X, Flag, Award, Users } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import confetti from 'canvas-confetti';

const HabitProgressVisualization = ({ habit, familyMembers, onClose }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const milestones = [10, 20, 30, 40, 50, 60];
  
  useEffect(() => {
    // Animate progress on mount
    const timer = setTimeout(() => {
      setAnimatedProgress(habit.totalCompletions);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [habit.totalCompletions]);

  const triggerCelebration = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const renderMountainVisualization = () => {
    const progress = (animatedProgress / 60) * 100;
    
    return (
      <div className="relative h-96 bg-gradient-to-b from-blue-100 to-blue-50 rounded-lg overflow-hidden">
        {/* Sky and clouds */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-20 w-20 h-10 bg-white rounded-full opacity-70"></div>
          <div className="absolute top-20 right-16 w-24 h-12 bg-white rounded-full opacity-60"></div>
        </div>

        {/* Mountain */}
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
          {/* Mountain shape */}
          <path
            d="M 50 350 L 200 50 L 350 350 Z"
            fill="#8B7355"
            stroke="#6B5D4F"
            strokeWidth="2"
          />
          
          {/* Snow cap */}
          <path
            d="M 200 50 L 150 150 L 250 150 Z"
            fill="white"
            opacity="0.9"
          />
          
          {/* Progress path */}
          <path
            d="M 50 350 Q 125 250 200 150 T 350 350"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
            strokeDasharray="5,5"
          />
          
          {/* Animated progress line */}
          <path
            d="M 50 350 Q 125 250 200 150 T 350 350"
            fill="none"
            stroke="#10B981"
            strokeWidth="6"
            strokeDasharray={`${progress * 5} 1000`}
            className="transition-all duration-1000"
          />
          
          {/* Milestone flags */}
          {milestones.map((milestone, index) => {
            const position = (milestone / 60) * 100;
            const x = 50 + (position * 3);
            const y = 350 - (position * 3);
            const reached = animatedProgress >= milestone;
            
            return (
              <g key={milestone}>
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={reached ? '#10B981' : '#E5E7EB'}
                  stroke="white"
                  strokeWidth="2"
                />
                {(milestone === 30 || milestone === 60) && (
                  <text
                    x={x}
                    y={y - 15}
                    textAnchor="middle"
                    className="text-xs font-bold fill-gray-700"
                  >
                    {milestone}
                  </text>
                )}
              </g>
            );
          })}
          
          {/* Climber avatars */}
          {habit.progressVisualization.contributions.map((contrib, index) => {
            const member = familyMembers.find(m => m.id === contrib.userId);
            if (!member) return null;
            
            const position = (contrib.pieces / 60) * 100;
            const x = 50 + (position * 3);
            const y = 350 - (position * 3) - 20;
            
            return (
              <g key={contrib.userId}>
                <foreignObject x={x - 15} y={y - 15} width="30" height="30">
                  <UserAvatar user={member} size="xs" />
                </foreignObject>
                <text
                  x={x}
                  y={y + 25}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {contrib.pieces}
                </text>
              </g>
            );
          })}
          
          {/* Summit flag */}
          {animatedProgress >= 60 && (
            <g className="animate-bounce">
              <line x1="350" y1="350" x2="350" y2="320" stroke="#374151" strokeWidth="2" />
              <path d="M 350 320 L 370 330 L 350 340 Z" fill="#EF4444" />
            </g>
          )}
        </svg>

        {/* Progress text */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
          <div className="text-lg font-bold text-gray-800">
            Day {animatedProgress} of 60
          </div>
          <div className="text-sm text-gray-600">
            {60 - animatedProgress} days to summit!
          </div>
          {habit.currentStreak > 0 && (
            <div className="text-sm text-orange-600 mt-1">
              🔥 {habit.currentStreak} day streak
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTreehouseVisualization = () => {
    const progress = animatedProgress;
    
    return (
      <div className="relative h-96 bg-gradient-to-b from-sky-100 to-green-50 rounded-lg overflow-hidden">
        {/* Tree trunk */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-48 bg-gradient-to-b from-amber-700 to-amber-800 rounded-t-lg"></div>
        
        {/* Tree leaves */}
        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 w-64 h-32 bg-green-600 rounded-full opacity-80"></div>
        
        {/* Treehouse components */}
        <div className="absolute bottom-48 left-1/2 transform -translate-x-1/2">
          {/* Foundation (1-15) */}
          {progress >= 1 && (
            <div className="relative">
              <div className="w-48 h-4 bg-amber-600 rounded"></div>
              {Array.from({ length: Math.min(progress, 15) }).map((_, i) => (
                <div
                  key={`foundation-${i}`}
                  className="absolute w-3 h-3 bg-amber-700 rounded"
                  style={{
                    left: `${(i % 5) * 40}px`,
                    top: `${Math.floor(i / 5) * -4}px`
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Walls (16-30) */}
          {progress >= 16 && (
            <div className="absolute -top-16 w-48">
              <div className="h-16 bg-yellow-700 rounded-t-lg">
                {Array.from({ length: Math.min(progress - 15, 15) }).map((_, i) => (
                  <div
                    key={`wall-${i}`}
                    className="inline-block w-3 h-3 bg-yellow-800 rounded m-0.5"
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Roof (31-45) */}
          {progress >= 31 && (
            <div className="absolute -top-28 left-1/2 transform -translate-x-1/2">
              <div 
                className="w-0 h-0 border-l-[80px] border-r-[80px] border-b-[40px] 
                          border-l-transparent border-r-transparent border-b-red-600"
              >
                {Array.from({ length: Math.min(progress - 30, 15) }).map((_, i) => (
                  <div
                    key={`roof-${i}`}
                    className="absolute w-2 h-2 bg-red-700 rounded-full"
                    style={{
                      left: `${70 + (i % 5) * 12}px`,
                      top: `${10 + Math.floor(i / 5) * 8}px`
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Decorations (46-60) */}
          {progress >= 46 && (
            <div className="absolute -top-8 left-0 w-full">
              {progress >= 50 && (
                <div className="absolute -left-4 top-0 w-8 h-8 bg-yellow-400 rounded-full animate-pulse"></div>
              )}
              {progress >= 55 && (
                <div className="absolute -right-4 top-0 w-6 h-6 bg-blue-400 rounded animate-spin-slow"></div>
              )}
              {progress >= 60 && (
                <div className="absolute left-1/2 -top-12 transform -translate-x-1/2">
                  <Flag className="w-8 h-8 text-red-500 animate-bounce" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contributors */}
        <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow-lg">
          <div className="text-sm font-medium mb-2">Builders:</div>
          <div className="space-y-1">
            {habit.progressVisualization.contributions.map(contrib => {
              const member = familyMembers.find(m => m.id === contrib.userId);
              return member ? (
                <div key={contrib.userId} className="flex items-center">
                  <UserAvatar user={member} size="xs" className="mr-2" />
                  <span className="text-xs">{contrib.pieces} pieces</span>
                </div>
              ) : null;
            })}
          </div>
        </div>

        {/* Progress text */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
          <div className="text-lg font-bold text-gray-800">
            {animatedProgress} pieces built
          </div>
          <div className="text-sm text-gray-600">
            {60 - animatedProgress} pieces to complete!
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{habit.title} Progress</h3>
          <p className="text-sm text-gray-600">{habit.identityStatement}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <div className="p-4">
        {habit.progressVisualization.type === 'mountain' ? 
          renderMountainVisualization() : 
          renderTreehouseVisualization()
        }
        
        {/* Milestone achievements */}
        <div className="mt-6 grid grid-cols-6 gap-2">
          {milestones.map(milestone => {
            const reached = habit.totalCompletions >= milestone;
            return (
              <div
                key={milestone}
                className={`
                  text-center p-2 rounded-lg transition-all
                  ${reached ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}
                `}
              >
                <div className="text-xs font-medium">Day {milestone}</div>
                <Award className={`w-6 h-6 mx-auto mt-1 ${reached ? 'text-green-600' : 'text-gray-300'}`} />
              </div>
            );
          })}
        </div>
        
        {/* Test celebration button */}
        {habit.totalCompletions > 0 && habit.totalCompletions % 10 === 0 && (
          <div className="mt-4 p-4 bg-purple-50 rounded-lg text-center">
            <p className="text-purple-700 font-medium mb-2">
              🎉 Milestone Achieved: {habit.totalCompletions} Days!
            </p>
            <button
              onClick={triggerCelebration}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Celebrate Again!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitProgressVisualization;