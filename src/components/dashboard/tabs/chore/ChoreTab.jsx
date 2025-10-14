import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Calendar, Clock, Sun, Sunset, Moon, Star, CheckCircle2, AlertCircle, Users, Trophy, PartyPopper, Sparkles, RefreshCw } from 'lucide-react';
import { useFamily } from '../../../../contexts/FamilyContext';
import { useChore } from '../../../../contexts/ChoreContext';
import SpotifyChoreCard from '../../../chore/SpotifyChoreCard';
import ChoreCompletionModal from '../../../chore/ChoreCompletionModal';
import BucksBalanceDisplay from '../../../bucks/BucksBalanceDisplay';
import UserAvatar from '../../../common/UserAvatar';
import { cleanupExcessiveChoreInstances, recreateChoreInstances, needsCleanup } from '../../../../utils/choreCleanup';
import '../../../../styles/celebration-animations.css';

// Fun celebration component with animations - memoized to prevent unnecessary re-renders
const CelebrationAnimation = React.memo(({ isVisible, onAnimationComplete }) => {
  const [animation, setAnimation] = useState('');
  
  // Generate a random animation type
  useEffect(() => {
    if (isVisible) {
      const animations = ['confetti', 'fireworks', 'stars'];
      const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
      setAnimation(randomAnimation);
      
      // Hide animation after 3 seconds
      const timer = setTimeout(() => {
        if (onAnimationComplete) onAnimationComplete();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onAnimationComplete]);
  
  if (!isVisible) return null;
  
  // Different animation styles
  const renderAnimation = () => {
    switch (animation) {
      case 'confetti':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
            <div className="confetti-container">
              {Array(30).fill().map((_, i) => (
                <div 
                  key={i}
                  className="confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '-10vh',
                    animationDelay: `${Math.random() * 3}s`,
                    backgroundColor: ['#ffcc00', '#ff6699', '#66ff99', '#6699ff'][Math.floor(Math.random() * 4)]
                  }}
                />
              ))}
            </div>
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-green-500 text-white text-2xl font-bold px-8 py-4 rounded-lg shadow-lg animate-bounce">
                <div className="flex items-center">
                  <Trophy size={32} className="mr-3" />
                  <span>GREAT JOB!</span>
                  <PartyPopper size={32} className="ml-3" />
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'fireworks':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
            <div className="fireworks-container">
              {Array(10).fill().map((_, i) => (
                <div 
                  key={i}
                  className="firework"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 50 + 30}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    '--size': `${Math.random() * 3 + 1}rem`,
                    '--color': [`#ff5252`, `#66bb6a`, `#29b6f6`, `#ffd54f`][Math.floor(Math.random() * 4)]
                  }}
                />
              ))}
            </div>
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-blue-500 text-white text-2xl font-bold px-8 py-4 rounded-lg shadow-lg animate-pulse">
                <div className="flex items-center">
                  <PartyPopper size={32} className="mr-3" />
                  <span>AWESOME!</span>
                  <PartyPopper size={32} className="ml-3" />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'stars':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
            <div className="stars-container">
              {Array(20).fill().map((_, i) => (
                <div 
                  key={i}
                  className="star-animation"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    '--size': `${Math.random() * 2 + 1}rem`
                  }}
                >
                  <Sparkles size={24} className="text-yellow-400" />
                </div>
              ))}
            </div>
            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-purple-500 text-white text-2xl font-bold px-8 py-4 rounded-lg shadow-lg animate-wiggle">
                <div className="flex items-center">
                  <Star size={32} className="mr-3 text-yellow-300" />
                  <span>AMAZING!</span>
                  <Star size={32} className="ml-3 text-yellow-300" />
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };
  
  return renderAnimation();
});

// Child-friendly chore tab component - memoized for performance
const ChildChoreTab = React.memo(({ selectedUser, selectedDate, setSelectedDate, choresByTimeOfDay, bucksBalance, progress, handleChoreClick, isLoading = false, handleCleanupChores, isCleaningUp }) => {
  // Create refs for each time section
  const morningRef = useRef(null);
  const afternoonRef = useRef(null);
  const eveningRef = useRef(null);
  const anytimeRef = useRef(null);
  
  // Auto-scroll to appropriate time section based on current time
  useEffect(() => {
    const currentHour = new Date().getHours();
    let targetRef = null;
    
    if (currentHour >= 16) { // After 4 PM
      targetRef = eveningRef;
    } else if (currentHour >= 12) { // After noon
      targetRef = afternoonRef;
    } else {
      targetRef = morningRef;
    }
    
    // Scroll to the target section with smooth behavior
    if (targetRef && targetRef.current) {
      setTimeout(() => {
        targetRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest' 
        });
      }, 300); // Small delay to ensure content is rendered
    }
  }, [selectedDate]); // Re-run when date changes
  
  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Helper function to render loading skeletons for chore cards
  const renderSkeletons = (count = 3) => {
    return Array(count).fill().map((_, index) => (
      <div 
        key={`skeleton-${index}`} 
        className="w-64 h-64 flex-shrink-0 animate-pulse"
      >
        <div className="h-full rounded-md shadow-md overflow-hidden">
          {/* Image skeleton */}
          <div className="w-full aspect-square bg-gradient-to-br from-gray-300 to-gray-200"></div>
          {/* Content skeleton */}
          <div className="p-3 bg-white">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
            <div className="flex justify-between">
              <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
              <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    ));
  };
  
  // Memoize navigation functions to avoid recreation on each render
  const goToPreviousDay = useCallback(() => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prevDay);
  }, [selectedDate, setSelectedDate]);
  
  const goToNextDay = useCallback(() => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    setSelectedDate(nextDay);
  }, [selectedDate, setSelectedDate]);
  
  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, [setSelectedDate]);
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with date navigation and balance */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="mr-4">
            <h1 className="text-2xl font-bold">{selectedUser.name}'s Chore Chart</h1>
            <div className="flex items-center mt-1 text-gray-600">
              <Calendar size={16} className="mr-1" />
              <span>{formatDate(selectedDate)}</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={goToPreviousDay}
              className="p-2 rounded hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <button 
              onClick={goToToday}
              className="px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
            >
              Today
            </button>
            
            <button 
              onClick={goToNextDay}
              className="p-2 rounded hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
        
      </div>
      
      
      {/* Help message if no chores exist */}
      {!isLoading && Object.values(choresByTimeOfDay).every(chores => chores.length === 0) && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <div className="mb-3">
            <Calendar className="w-12 h-12 text-blue-400 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-blue-900 mb-2">No Chores Assigned Yet!</h3>
          <p className="text-blue-700 mb-4">
            Ask your parents to create some chores for you in the Chore & Reward Admin panel.
          </p>
          <p className="text-sm text-blue-600">
            Once they do, your daily chores will appear here!
          </p>
          {/* Cleanup button for when there are data issues */}
          <button
            onClick={handleCleanupChores}
            disabled={isCleaningUp}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isCleaningUp ? 'animate-spin' : ''} />
            {isCleaningUp ? 'Cleaning up...' : 'Refresh Chores'}
          </button>
        </div>
      )}
      
      {/* Chores sections by time of day - stacked vertically */}
      <div className="flex flex-col gap-6">
        {/* Morning chores */}
        <div ref={morningRef} className="bg-white rounded-lg shadow-md p-4 border-t-4 border-yellow-400">
          <div className="flex items-center mb-3">
            <Sun size={20} className="mr-2 text-yellow-500" />
            <h2 className="text-lg font-medium">Morning Chores</h2>
            <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs py-1 px-2 rounded-full">
              {choresByTimeOfDay.morning.filter(c => c.status === 'approved' || c.status === 'completed').length} / {choresByTimeOfDay.morning.length}
            </span>
          </div>
          
          {(isLoading) ? (
            <div className="flex overflow-x-auto pb-4 space-x-4 skeleton-pulse">
              {renderSkeletons(3)}
            </div>
          ) : choresByTimeOfDay.morning.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No morning chores for today</p>
          ) : (
            <div className="flex overflow-x-auto pb-4 space-x-4 stagger-fade-in">
              {choresByTimeOfDay.morning.map(chore => (
                <div className="w-64 flex-shrink-0 scale-in" key={chore.id}>
                  <SpotifyChoreCard 
                    chore={chore} // The chores are now pre-processed in loadChores
                    onClick={() => handleChoreClick(chore)}
                    disabled={chore.status === 'completed' || chore.status === 'approved'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Afternoon chores */}
        <div ref={afternoonRef} className="bg-white rounded-lg shadow-md p-4 border-t-4 border-orange-400">
          <div className="flex items-center mb-3">
            <Sunset size={20} className="mr-2 text-orange-500" />
            <h2 className="text-lg font-medium">Afternoon Chores</h2>
            <span className="ml-auto bg-orange-100 text-orange-800 text-xs py-1 px-2 rounded-full">
              {choresByTimeOfDay.afternoon.filter(c => c.status === 'approved' || c.status === 'completed').length} / {choresByTimeOfDay.afternoon.length}
            </span>
          </div>
          
          {(isLoading) ? (
            <div className="flex overflow-x-auto pb-4 space-x-4 skeleton-pulse">
              {renderSkeletons(3)}
            </div>
          ) : choresByTimeOfDay.afternoon.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No afternoon chores for today</p>
          ) : (
            <div className="flex overflow-x-auto pb-4 space-x-4 stagger-fade-in">
              {choresByTimeOfDay.afternoon.map(chore => (
                <div className="w-64 flex-shrink-0 scale-in" key={chore.id}>
                  <SpotifyChoreCard 
                    chore={chore} // Pre-processed in loadChores
                    onClick={() => handleChoreClick(chore)}
                    disabled={chore.status === 'completed' || chore.status === 'approved'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Evening chores */}
        <div ref={eveningRef} className="bg-white rounded-lg shadow-md p-4 border-t-4 border-blue-400">
          <div className="flex items-center mb-3">
            <Moon size={20} className="mr-2 text-blue-500" />
            <h2 className="text-lg font-medium">Evening Chores</h2>
            <span className="ml-auto bg-blue-100 text-blue-800 text-xs py-1 px-2 rounded-full">
              {choresByTimeOfDay.evening.filter(c => c.status === 'approved' || c.status === 'completed').length} / {choresByTimeOfDay.evening.length}
            </span>
          </div>
          
          {(isLoading) ? (
            <div className="flex overflow-x-auto pb-4 space-x-4 skeleton-pulse">
              {renderSkeletons(3)}
            </div>
          ) : choresByTimeOfDay.evening.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No evening chores for today</p>
          ) : (
            <div className="flex overflow-x-auto pb-4 space-x-4 stagger-fade-in">
              {choresByTimeOfDay.evening.map(chore => (
                <div className="w-64 flex-shrink-0 scale-in" key={chore.id}>
                  <SpotifyChoreCard 
                    chore={chore} // Pre-processed in loadChores
                    onClick={() => handleChoreClick(chore)}
                    disabled={chore.status === 'completed' || chore.status === 'approved'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Anytime chores */}
        <div ref={anytimeRef} className="bg-white rounded-lg shadow-md p-4 border-t-4 border-purple-400">
          <div className="flex items-center mb-3">
            <Star size={20} className="mr-2 text-purple-500" />
            <h2 className="text-lg font-medium">Anytime Chores</h2>
            <span className="ml-auto bg-purple-100 text-purple-800 text-xs py-1 px-2 rounded-full">
              {choresByTimeOfDay.anytime.filter(c => c.status === 'approved' || c.status === 'completed').length} / {choresByTimeOfDay.anytime.length}
            </span>
          </div>
          
          {(isLoading) ? (
            <div className="flex overflow-x-auto pb-4 space-x-4 skeleton-pulse">
              {renderSkeletons(3)}
            </div>
          ) : choresByTimeOfDay.anytime.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No anytime chores for today</p>
          ) : (
            <div className="flex overflow-x-auto pb-4 space-x-4 stagger-fade-in">
              {choresByTimeOfDay.anytime.map(chore => (
                <div className="w-64 flex-shrink-0 scale-in" key={chore.id}>
                  <SpotifyChoreCard 
                    chore={chore} // Pre-processed in loadChores
                    onClick={() => handleChoreClick(chore)}
                    disabled={chore.status === 'completed' || chore.status === 'approved'}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Motivational message */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100 fade-in">
        <div className="flex items-start">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            {progress >= 70 ? (
              <CheckCircle2 size={24} className="text-green-500" />
            ) : (
              <AlertCircle size={24} className="text-blue-500" />
            )}
          </div>
          <div>
            <h3 className="font-medium text-blue-800">
              {progress >= 70 
                ? "Great job today!" 
                : "Keep up the good work!"}
            </h3>
            <p className="text-blue-600 text-sm mt-1">
              {progress >= 70 
                ? `You've completed ${progress}% of your chores. You're amazing!` 
                : `You've completed ${progress}% of your chores. Keep going!`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

// Parent chore overview
const ParentChoreOverview = ({ selectedDate, setSelectedDate, familyMembers, allChildrenChores }) => {
  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Navigate to previous day
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(selectedDate.getDate() - 1);
    setSelectedDate(prevDay);
  };
  
  // Navigate to next day
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(selectedDate.getDate() + 1);
    setSelectedDate(nextDay);
  };
  
  // Go to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // Get child family members only
  const childrenOnly = familyMembers.filter(member => member.role === 'child');
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with date navigation */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Family Chore Progress</h1>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={goToPreviousDay}
              className="p-2 rounded hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <div className="flex items-center text-gray-600">
              <Calendar size={16} className="mr-1" />
              <span>{formatDate(selectedDate)}</span>
            </div>
            
            <button 
              onClick={goToToday}
              className="px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
            >
              Today
            </button>
            
            <button 
              onClick={goToNextDay}
              className="p-2 rounded hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
        
        <p className="text-gray-600 mt-1">Overview of chores for all children</p>
      </div>
      
      {/* Family members chore summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {childrenOnly.map(child => {
          // Calculate child's progress
          const childChores = allChildrenChores[child.id] || { 
            morning: [], afternoon: [], evening: [], anytime: [] 
          };
          
          const totalChores = Object.values(childChores).flat().length;
          const completedChores = Object.values(childChores)
            .flat()
            .filter(chore => chore.status === 'approved' || chore.status === 'completed')
            .length;
          
          const progress = totalChores > 0 
            ? Math.round((completedChores / totalChores) * 100) 
            : 0;
          
          return (
            <div 
              key={child.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="p-4 flex items-center">
                <UserAvatar user={child} size={48} className="mr-3" />
                <div className="flex-1">
                  <h3 className="font-medium">{child.name}</h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="mr-2">Progress: {progress}%</span>
                    <span>
                      {completedChores} / {totalChores} chores
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Summary by time of day */}
              <div className="border-t border-gray-100 grid grid-cols-4 divide-x divide-gray-100">
                <div className="p-2 text-center">
                  <div className="text-xs text-gray-500">Morning</div>
                  <div className="font-medium text-sm">
                    {childChores.morning.filter(c => c.status === 'approved' || c.status === 'completed').length} / {childChores.morning.length}
                  </div>
                </div>
                
                <div className="p-2 text-center">
                  <div className="text-xs text-gray-500">Afternoon</div>
                  <div className="font-medium text-sm">
                    {childChores.afternoon.filter(c => c.status === 'approved' || c.status === 'completed').length} / {childChores.afternoon.length}
                  </div>
                </div>
                
                <div className="p-2 text-center">
                  <div className="text-xs text-gray-500">Evening</div>
                  <div className="font-medium text-sm">
                    {childChores.evening.filter(c => c.status === 'approved' || c.status === 'completed').length} / {childChores.evening.length}
                  </div>
                </div>
                
                <div className="p-2 text-center">
                  <div className="text-xs text-gray-500">Anytime</div>
                  <div className="font-medium text-sm">
                    {childChores.anytime.filter(c => c.status === 'approved' || c.status === 'completed').length} / {childChores.anytime.length}
                  </div>
                </div>
              </div>
              
              {/* View button */}
              <div className="border-t border-gray-100 p-2">
                <button 
                  className="w-full py-1.5 text-center text-sm text-blue-600 hover:bg-blue-50 rounded"
                  onClick={() => {
                    // View child's chores - in a real implementation, this would navigate to the child's view
                    console.log(`View ${child.name}'s chores`);
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          );
        })}
        
        {childrenOnly.length === 0 && (
          <div className="col-span-3 py-8 text-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-center mb-3">
              <Users size={36} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No children added to your family yet</p>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">
              Add Family Member
            </button>
          </div>
        )}
      </div>
      
      {/* Pending approvals section */}
      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">Pending Chore Approvals</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {/* This would be populated with actual pending approvals */}
            <div className="p-4 flex items-center">
              <div className="flex-1">
                <p className="text-gray-500 text-center py-4">No pending approvals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick links to admin */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-800">Need to manage chores?</h3>
            <p className="text-blue-600 text-sm mt-1">
              Use the Chore & Reward Admin panel to create, edit and manage all chores and rewards.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard?tab=chore-admin'}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg"
          >
            Go to Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
};

// Main ChoreTab component with role-specific views
const ChoreTab = () => {
  // State for loading data with controlled transitions
  const [isLoading, setIsLoading] = useState(true);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [renderStabilized, setRenderStabilized] = useState(false);
  const { selectedUser, familyMembers, familyId } = useFamily();
  const { 
    childChores, 
    loadChildChores, 
    getChoresByTimeOfDay,
    markChoreAsCompleted,
    getChildBucksBalance,
    createCalendarEvent,
    selectChild
  } = useChore();
  
  // State for chores data
  const [choresByTimeOfDay, setChoresByTimeOfDay] = useState({
    morning: [],
    afternoon: [],
    evening: [],
    anytime: []
  });
  
  // State for all children's chores (for parent view)
  const [allChildrenChores, setAllChildrenChores] = useState({});
  
  // Loading skeleton state - controlled for smooth transitions
  const [showSkeleton, setShowSkeleton] = useState(true);
  
  // State for date navigation
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bucksBalance, setBucksBalance] = useState(0);
  
  // State for chore completion modal
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedChore, setSelectedChore] = useState(null);
  
  // Handle opening the completion modal
  const handleChoreClick = (chore) => {
    setSelectedChore(chore);
    setShowCompletionModal(true);
  };
  
  // State for celebration animation
  const [showCelebration, setShowCelebration] = useState(false);
  
  // State for cleanup
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  
  // Handle cleanup of excessive chore instances
  const handleCleanupChores = async () => {
    if (isCleaningUp) return;
    
    setIsCleaningUp(true);
    try {
      // Use familyId from component scope
      if (!familyId) {
        console.error('No family ID available');
        return;
      }
      
      // Cleanup duplicates and recreate instances
      const result = await recreateChoreInstances(
        familyId, 
        selectedUser.id,
        selectedDate
      );
      
      console.log('[CLEANUP] Cleanup completed:', result);
      
      // Reload the chores after cleanup
      await loadChildChores(selectedUser.id, selectedDate);
      
      // Show success message
      alert('Chores have been cleaned up and refreshed!');
    } catch (error) {
      console.error('Error cleaning up chores:', error);
      alert('Failed to cleanup chores. Please try again.');
    } finally {
      setIsCleaningUp(false);
    }
  };
  
  // Handle chore completion
  const handleChoreComplete = async (choreId, photoEvidence, notes, mood) => {
    try {
      const result = await markChoreAsCompleted(choreId, photoEvidence, notes, mood);
      setShowCompletionModal(false);
      
      // Show celebration animation
      setShowCelebration(true);
      
      // Update the local state immediately for instant feedback
      setChoresByTimeOfDay(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(timeOfDay => {
          updated[timeOfDay] = updated[timeOfDay].map(chore => 
            chore.id === choreId 
              ? { ...chore, status: 'pending', bucksAwarded: result.bucksAwarded }
              : chore
          );
        });
        return updated;
      });
      
      // No need to reload - state is already updated optimistically
      
      // Skip calendar event creation here to prevent loops
      // Calendar events should be created by the service layer
      
      // Play celebratory sound (optional)
      try {
        const audio = new Audio();
        // Randomize the celebration sound
        const sounds = [
          'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3',
          'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
          'https://assets.mixkit.co/sfx/preview/mixkit-fairy-arcade-sparkle-866.mp3',
          'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3'
        ];
        audio.src = sounds[Math.floor(Math.random() * sounds.length)];
        audio.volume = 0.5;
        await audio.play();
      } catch (audioError) {
        console.log('Audio could not be played (this is often due to browser autoplay restrictions)');
      }
      
      // Show completion success message (optional)
      console.log('Chore completed successfully!', result);
    } catch (error) {
      console.error('Error completing chore:', error);
    }
  };
  
  // Simplified image preloading with lazy loading support
  const preloadImages = useCallback((chores) => {
    // Only preload critical images (first 3 chores visible in viewport)
    const criticalChores = chores.slice(0, 3);
    const imageUrls = new Set();
    
    // Extract only critical image URLs
    criticalChores.forEach(chore => {
      const url = chore.template?.customIconUrl || chore.imageUrl || chore.template?.imageUrl;
      if (url && typeof url === 'string' && url.startsWith('http')) {
        imageUrls.add(url);
      }
    });
    
    if (imageUrls.size === 0) {
      setImagesPreloaded(true);
      return;
    }
    
    // Use Promise.allSettled for better error handling
    const imagePromises = Array.from(imageUrls).map(url => 
      new Promise((resolve) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = () => {
          console.warn(`Failed to preload: ${url}`);
          resolve(); // Continue even on error
        };
        
        img.src = url;
      })
    );
    
    // Set timeout to avoid blocking UI for too long (reduced from 2000ms to 500ms)
    const timeoutPromise = new Promise(resolve => setTimeout(resolve, 500));
    
    // Race between image loading and timeout
    Promise.race([
      Promise.allSettled(imagePromises),
      timeoutPromise
    ]).then(() => {
      setImagesPreloaded(true);
    });
  }, []);
  
  // Load chores for the selected date - optimized with parallel processing and batched updates
  const loadChores = useCallback(async () => {
    if (!selectedUser) return;
    
    // Start with loading state - show skeleton UI while loading
    setIsLoading(true);
    setShowSkeleton(true);
    
    if (selectedUser.role === 'child') {
      // Child view - load just their chores
      try {
        // Set timeout to prevent hanging
        const loadTimeout = setTimeout(() => {
          console.warn('Chore loading taking too long, continuing...');
          setIsLoading(false);
          setShowSkeleton(false);
        }, 5000); // 5 second timeout
        
        // Show a loading state
        setChoresByTimeOfDay({
          morning: [],
          afternoon: [],
          evening: [],
          anytime: []
        });
        
        // Check if cleanup is needed before loading
        if (familyId) {
          const cleanupNeeded = await needsCleanup(familyId, selectedDate);
          if (cleanupNeeded) {
            console.log('[CHORE TAB] Duplicates detected, running automatic cleanup...');
            try {
              await recreateChoreInstances(familyId, selectedUser.id, selectedDate);
              console.log('[CHORE TAB] Automatic cleanup completed');
            } catch (error) {
              console.error('[CHORE TAB] Automatic cleanup failed:', error);
            }
          }
        }
        
        // Load all data in parallel
        const [_, balance] = await Promise.all([
          loadChildChores(selectedDate),
          getChildBucksBalance()
        ]);
        
        clearTimeout(loadTimeout);
        
        // Get chores organized by time of day
        const choresByTime = getChoresByTimeOfDay(selectedDate);
        
        // Process and enrich all chores at once for better performance
        const processedChoresByTime = {};
        
        // Process each time slot
        Object.keys(choresByTime).forEach(timeOfDay => {
          // Create deep copies of all chores with properly propagated image paths
          const processedChores = choresByTime[timeOfDay].map(chore => {
            const enrichedChore = {
              ...JSON.parse(JSON.stringify(chore)), // Deep copy to avoid reference issues
            };
            
            // Set robust fallbacks for missing data
            enrichedChore.title = enrichedChore.template?.title || enrichedChore.title || enrichedChore.name || "Chore";
            enrichedChore.description = enrichedChore.template?.description || enrichedChore.description || enrichedChore.details || "Complete this chore";
            
            // Handle all image URL paths with multiple redundant fallbacks
            if (enrichedChore.template?.customIconUrl) {
              const templateImageUrl = enrichedChore.template.customIconUrl;
              enrichedChore.imageUrl = templateImageUrl;
              enrichedChore.customIconUrl = templateImageUrl;
              enrichedChore.template.imageUrl = templateImageUrl;
            } else if (enrichedChore.imageUrl || enrichedChore.customIconUrl) {
              const choreImageUrl = enrichedChore.imageUrl || enrichedChore.customIconUrl;
              enrichedChore.imageUrl = choreImageUrl;
              enrichedChore.customIconUrl = choreImageUrl;
              if (!enrichedChore.template) enrichedChore.template = {};
              enrichedChore.template.customIconUrl = choreImageUrl;
              enrichedChore.template.imageUrl = choreImageUrl;
            } else {
              if (!enrichedChore.template) enrichedChore.template = {};
              enrichedChore.template.icon = enrichedChore.template.icon || "task";
            }
            
            return enrichedChore;
          });
          
          processedChoresByTime[timeOfDay] = processedChores;
        });
        
        // Preload all images before updating state
        const allChores = [
          ...processedChoresByTime.morning,
          ...processedChoresByTime.afternoon,
          ...processedChoresByTime.evening,
          ...processedChoresByTime.anytime
        ];
        
        // Start preloading images immediately and track when complete
        preloadImages(allChores);
        
        // Batch state updates to avoid multiple renders
        // This improves performance significantly by reducing render cycles
        const batchStateUpdate = () => {
          // Set all state changes in a single batch
          setChoresByTimeOfDay(processedChoresByTime);
          setBucksBalance(balance);
          setImagesPreloaded(true);
        };
        
        // Perform batched update
        batchStateUpdate();
        
        // Once data is loaded, set render stabilized to true to prevent future flickering
        // This ensures we only show loading skeletons on first load, then maintain stable rendering
        setRenderStabilized(true);
        
        // Allow a small delay for all images to preload before removing loading state
        // The skeleton continues to show during this delay period for a smoother transition
        setTimeout(() => {
          setIsLoading(false);
          // Additional slight delay before hiding skeleton for smooth transition
          setTimeout(() => {
            setShowSkeleton(false);
          }, 100);
        }, 200);
      } catch (error) {
        console.error('Error loading chores:', error);
        setIsLoading(false);
      }
    } else {
      // Parent view - load chores for all children
      try {
        const childrenOnly = familyMembers.filter(member => member.role === 'child');
        const allChores = {};
        
        // For each child, load their chores
        for (const child of childrenOnly) {
          // Select the child first
          await selectChild(child.id);
          
          // Load their chores
          await loadChildChores(selectedDate);
          
          // Get chores organized by time of day for this child
          const childChores = getChoresByTimeOfDay(selectedDate);
          allChores[child.id] = childChores;
        }
        
        setAllChildrenChores(allChores);
        // End loading state
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading all children chores:', error);
        setIsLoading(false);
      }
    }
  }, [
    selectedUser, 
    selectedDate, 
    loadChildChores, 
    getChoresByTimeOfDay, 
    getChildBucksBalance, 
    familyMembers, 
    selectChild,
    familyId,
    preloadImages
  ]);
  
  // Load chores when component mounts or date/user changes
  // Fixed useEffect with proper dependencies array
  useEffect(() => {
    // Reset image preload status whenever we load new chores
    setImagesPreloaded(false);
    // Only show skeleton if needed
    setShowSkeleton(!renderStabilized);
    loadChores();
    
    // Add cleanup function to handle component unmount or reload
    return () => {
      // Cancel any pending operations if component unmounts mid-load
      setImagesPreloaded(false);
      // We don't reset renderStabilized here to maintain stable rendering
    };
  }, [selectedUser?.id, selectedDate.toDateString()]); // Only depend on user ID and date string to prevent infinite loops
  
  // Calculate progress percentages
  const calculateProgress = () => {
    const totalChores = Object.values(choresByTimeOfDay).flat().length;
    const completedChores = Object.values(choresByTimeOfDay)
      .flat()
      .filter(chore => chore.status === 'completed' || chore.status === 'approved')
      .length;
    
    return totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0;
  };
  
  const progress = calculateProgress();
  
  // If no user is selected, show a message
  if (!selectedUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Please select a family member to view their chores.</p>
      </div>
    );
  }
  
  // Render different views based on user role
  if (selectedUser.role === 'child') {
    return (
      <>
        <ChildChoreTab 
          selectedUser={selectedUser}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          choresByTimeOfDay={choresByTimeOfDay}
          bucksBalance={bucksBalance}
          progress={progress}
          handleChoreClick={handleChoreClick}
          isLoading={isLoading}
          handleCleanupChores={handleCleanupChores}
          isCleaningUp={isCleaningUp}
        />
        
        {/* Chore completion modal with enhanced image handling */}
        {showCompletionModal && selectedChore && (
          <ChoreCompletionModal
            chore={{
              // Create deep copy to avoid reference issues
              ...JSON.parse(JSON.stringify(selectedChore)),
              // Set title and description with fallbacks
              title: selectedChore.template?.title || selectedChore.title || selectedChore.name || "Chore",
              description: selectedChore.template?.description || selectedChore.description || selectedChore.details || "Complete this chore",
              // Set all image URL fields
              imageUrl: selectedChore.template?.customIconUrl || selectedChore.imageUrl || selectedChore.customIconUrl || null,
              customIconUrl: selectedChore.template?.customIconUrl || selectedChore.customIconUrl || selectedChore.imageUrl || null,
              // Ensure template exists with image URLs
              template: selectedChore.template ? {
                ...selectedChore.template,
                customIconUrl: selectedChore.template.customIconUrl || selectedChore.imageUrl || selectedChore.customIconUrl || null,
                imageUrl: selectedChore.template.imageUrl || selectedChore.template.customIconUrl || selectedChore.imageUrl || selectedChore.customIconUrl || null
              } : {
                customIconUrl: selectedChore.imageUrl || selectedChore.customIconUrl || null,
                imageUrl: selectedChore.imageUrl || selectedChore.customIconUrl || null,
                title: selectedChore.title || selectedChore.name || "Chore",
                description: selectedChore.description || selectedChore.details || "Complete this chore"
              }
            }}
            onClose={() => setShowCompletionModal(false)}
            onComplete={handleChoreComplete}
          />
        )}
        
        {/* Celebration animation */}
        <CelebrationAnimation 
          isVisible={showCelebration} 
          onAnimationComplete={() => setShowCelebration(false)} 
        />
      </>
    );
  } else {
    // Parent view
    return (
      <ParentChoreOverview
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        familyMembers={familyMembers}
        allChildrenChores={allChildrenChores}
      />
    );
  }
};

export default ChoreTab;