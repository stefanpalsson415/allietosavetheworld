// src/components/dashboard/tabs/ChoreTab.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useChore } from '../../../contexts/ChoreContext';
import { useFamily } from '../../../contexts/FamilyContext';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Sun, 
  Coffee, 
  Moon, 
  Clock,
  ChevronDown, 
  DollarSign,
  CheckCircle,
  X
} from 'lucide-react';
import { ChoreCard, ChoreCompletionModal, SpotifyChoreCard } from '../../chore';
import UserAvatar from '../../common/UserAvatar';

const ChoreTab = () => {
  const { 
    childChores, 
    choresByTimeOfDay, 
    isLoadingChores, 
    choreError, 
    loadChildChores,
    bucksBalance,
    selectedChild,
    selectedChildId,
    selectChild,
    refreshChores
  } = useChore();
  
  const { familyMembers } = useFamily();
  
  // State for date and completion modal
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [selectedChore, setSelectedChore] = useState(null);
  const [childDropdownOpen, setChildDropdownOpen] = useState(false);
  
  // Format the current date for display
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  
  // Load chores for the selected date when date changes or child changes
  useEffect(() => {
    if (selectedChildId) {
      loadChildChores(selectedDate);
    }
  }, [selectedDate, selectedChildId, loadChildChores]);
  
  // Previous and next date handlers
  const goToPrevDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };
  
  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };
  
  // Return to today
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // Handle clicking on a chore to complete it (memoized for performance)
  const handleChoreClick = useCallback((chore) => {
    setSelectedChore(chore);
    setShowCompletionModal(true);
  }, []);
  
  // Handle completion modal close
  const handleCloseModal = () => {
    setShowCompletionModal(false);
    setSelectedChore(null);
  };
  
  // Handle child selection
  const handleChildSelect = (childId) => {
    selectChild(childId);
    setChildDropdownOpen(false);
  };
  
  // Filter childFamilyMembers to only include children
  const childrenFamilyMembers = familyMembers.filter(member => member.role === 'child');
  
  // Get the status counts - memoized to prevent recalculation on every render
  const getStatusCounts = useMemo(() => {
    const total = childChores.length;
    const completed = childChores.filter(chore => 
      chore.status === 'completed' || chore.status === 'approved'
    ).length;
    const pending = childChores.filter(chore => chore.status === 'pending').length;
    const pendingApproval = childChores.filter(chore => chore.status === 'completed').length;
    
    return { total, completed, pending, pendingApproval };
  }, [childChores]);
  
  const { total, completed, pending, pendingApproval } = getStatusCounts;
  
  // Get time of day section headings with icons - memoized to prevent recreating array on every render
  const timeOfDaySections = useMemo(() => [
    { 
      id: 'morning', 
      title: 'Morning Routine', 
      icon: <Sun size={20} className="text-yellow-500 mr-2" />,
      description: 'Start your day on the right track'
    },
    { 
      id: 'afternoon', 
      title: 'Afternoon Tasks', 
      icon: <Coffee size={20} className="text-orange-500 mr-2" />,
      description: 'Things to do after school'
    },
    { 
      id: 'evening', 
      title: 'Evening Checklist', 
      icon: <Moon size={20} className="text-indigo-600 mr-2" />,
      description: 'Before bedtime'
    },
    { 
      id: 'anytime', 
      title: 'Anytime Chores', 
      icon: <Clock size={20} className="text-gray-500 mr-2" />,
      description: 'Complete whenever you have time'
    }
  ], []);
  
  // If loading, show skeleton UI instead of spinner for better UX
  if (isLoadingChores) {
    return (
      <div className="h-full">
        {/* Header skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="flex items-center">
            <div className="h-10 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
        
        {/* Progress summary skeleton */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 animate-pulse">
          <div className="flex flex-wrap gap-4">
            {Array(4).fill().map((_, i) => (
              <div key={i} className="flex-1 min-w-[120px]">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16 mt-1"></div>
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 bg-gray-200 rounded-full"></div>
        </div>
        
        {/* Chore sections skeleton */}
        {Array(3).fill().map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 mb-6 animate-pulse">
            <div className="flex items-center mb-2">
              <div className="h-6 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill().map((_, j) => (
                <div key={j} className="aspect-square bg-gray-200 rounded-md h-64"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // If error, show error message
  if (choreError) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{choreError}</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with date navigation and balance info */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold mb-1">Chore Chart</h1>
          <div className="flex items-center">
            <button onClick={goToPrevDay} className="p-1 text-gray-600 hover:text-blue-600">
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={goToToday}
              className="flex items-center px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded mx-2"
            >
              <Calendar size={14} className="mr-1" />
              <span>{formattedDate}</span>
            </button>
            <button onClick={goToNextDay} className="p-1 text-gray-600 hover:text-blue-600">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-start sm:items-center">
          {/* Child selector */}
          <div className="relative mr-4">
            <button 
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"
              onClick={() => setChildDropdownOpen(!childDropdownOpen)}
            >
              {selectedChild && <UserAvatar user={selectedChild} size={24} className="mr-2" />}
              <span className="font-medium">{selectedChild?.name || 'Select Child'}</span>
              <ChevronDown size={16} />
            </button>
            
            {childDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-30">
                {childrenFamilyMembers.map(child => (
                  <button
                    key={child.id}
                    className="flex items-center w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                    onClick={() => handleChildSelect(child.id)}
                  >
                    <UserAvatar user={child} size={20} className="mr-2" />
                    <span>{child.name}</span>
                    {selectedChildId === child.id && (
                      <CheckCircle size={14} className="ml-auto text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Palsson Bucks display */}
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center">
            <DollarSign size={18} className="text-green-600 mr-1" />
            <span className="font-bold text-green-700">{bucksBalance}</span>
            <span className="ml-1 text-green-700">Bucks</span>
          </div>
        </div>
      </div>
      
      {/* Progress summary */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[120px]">
            <div className="text-sm font-medium text-gray-500">Completed</div>
            <div className="mt-1 flex items-center">
              <span className="text-2xl font-bold text-blue-600">{completed}</span>
              <span className="ml-1 text-gray-500">/ {total}</span>
            </div>
          </div>
          
          <div className="flex-1 min-w-[120px]">
            <div className="text-sm font-medium text-gray-500">Pending</div>
            <div className="mt-1 text-2xl font-bold text-amber-500">{pending}</div>
          </div>
          
          <div className="flex-1 min-w-[120px]">
            <div className="text-sm font-medium text-gray-500">Awaiting Approval</div>
            <div className="mt-1 text-2xl font-bold text-purple-500">{pendingApproval}</div>
          </div>
          
          <div className="flex-1 min-w-[120px]">
            <div className="text-sm font-medium text-gray-500">Earning Potential</div>
            <div className="mt-1 flex items-center">
              <DollarSign size={18} className="text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {childChores
                  .filter(chore => chore.status === 'pending')
                  .reduce((sum, chore) => sum + chore.bucksAwarded, 0)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500" 
            style={{ width: `${total > 0 ? (completed / total * 100) : 0}%` }}
          ></div>
        </div>
      </div>
      
      {/* Time of day sections with chore lists */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 gap-6">
          {timeOfDaySections.map(section => {
            const sectionChores = choresByTimeOfDay[section.id] || [];
            
            // Skip sections with no chores
            if (sectionChores.length === 0) return null;
            
            return (
              <div 
                key={section.id} 
                className="bg-white rounded-lg shadow-sm p-4"
              >
                <div className="flex items-center mb-2">
                  {section.icon}
                  <h2 className="text-lg font-bold">{section.title}</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">{section.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sectionChores.map(chore => (
                    <SpotifyChoreCard 
                      key={chore.id} 
                      chore={chore} 
                      onClick={() => handleChoreClick(chore)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          
          {/* If no chores for the day */}
          {total === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <h3 className="text-lg font-medium text-gray-700 mb-2">No chores for today!</h3>
              <p className="text-gray-500">
                Enjoy your free time or check if there are any upcoming chores for tomorrow.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Chore completion modal */}
      {showCompletionModal && selectedChore && (
        <ChoreCompletionModal
          chore={selectedChore}
          onClose={handleCloseModal}
          onComplete={() => {
            handleCloseModal();
            refreshChores();
          }}
        />
      )}
    </div>
  );
};

export default ChoreTab;