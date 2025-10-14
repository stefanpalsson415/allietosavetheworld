// src/components/chore/ChoreCard.jsx
import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  DollarSign,
  ThumbsUp,
  MoreHorizontal,
  BookOpen,
  CalendarClock,
  RotateCcw,
  Star,
  StarHalf,
  Flower,
  Trophy,
  ShieldCheck
} from 'lucide-react';

/**
 * ChoreCard component displays an individual chore with its details
 * 
 * @param {Object} props
 * @param {Object} props.chore - The chore object with details
 * @param {Function} props.onClick - Function to call when the card is clicked
 * @param {Boolean} props.disabled - Whether the card is disabled/non-interactive
 */
const ChoreCard = ({ chore, onClick, disabled = false }) => {
  if (!chore) return null;
  
  // Status indicators with appropriate colors
  const getStatusIndicator = () => {
    switch (chore.status) {
      case 'completed':
        return (
          <div className="absolute top-2 right-2 bg-blue-100 text-blue-700 rounded-full p-1">
            <CheckCircle size={18} />
          </div>
        );
      case 'approved':
        return (
          <div className="absolute top-2 right-2 bg-green-100 text-green-700 rounded-full p-1">
            <ThumbsUp size={18} />
          </div>
        );
      case 'rejected':
        return (
          <div className="absolute top-2 right-2 bg-red-100 text-red-700 rounded-full p-1">
            <AlertCircle size={18} />
          </div>
        );
      case 'overdue':
        return (
          <div className="absolute top-2 right-2 bg-amber-100 text-amber-700 rounded-full p-1">
            <Clock size={18} />
          </div>
        );
      default:
        return null;
    }
  };
  
  // Get appropriate icon based on chore category or type
  const getChoreIcon = () => {
    const iconProps = { size: 24, className: "text-gray-600" };
    
    switch (chore.category) {
      case 'cleaning':
        return <Flower {...iconProps} className="text-purple-500" />;
      case 'responsibility':
        return <ShieldCheck {...iconProps} className="text-blue-500" />;
      case 'homework':
        return <BookOpen {...iconProps} className="text-amber-500" />;
      case 'recurring':
        return <RotateCcw {...iconProps} className="text-green-500" />;
      case 'special':
        return <Star {...iconProps} className="text-yellow-500" />;
      case 'challenge':
        return <Trophy {...iconProps} className="text-orange-500" />;
      default:
        return <StarHalf {...iconProps} className="text-gray-500" />;
    }
  };
  
  // Formatted time, if available
  const formattedTime = chore.dueTime 
    ? new Date(`2000-01-01T${chore.dueTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;
  
  // Streak indicator - shows number of consecutive days this chore was completed
  const streakIndicator = chore.streak && chore.streak > 2 ? (
    <div className="flex items-center text-amber-600 text-xs font-medium">
      <RotateCcw size={14} className="mr-1" /> 
      <span>{chore.streak} day streak</span>
    </div>
  ) : null;
  
  // Handle click, but only if the card is not disabled
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(chore);
    }
  };
  
  // Card classes change based on status
  const getCardClasses = () => {
    const baseClasses = "relative flex flex-col p-4 rounded-lg shadow-sm transition-transform transform";
    const interactiveClasses = !disabled ? "hover:shadow-md cursor-pointer hover:-translate-y-1" : "opacity-80";
    
    // Add status-specific styling
    let statusClasses = "bg-white border";
    if (chore.status === 'completed') {
      statusClasses = "bg-blue-50 border-blue-200";
    } else if (chore.status === 'approved') {
      statusClasses = "bg-green-50 border-green-200";
    } else if (chore.status === 'rejected') {
      statusClasses = "bg-red-50 border-red-200";
    } else if (chore.status === 'overdue') {
      statusClasses = "bg-amber-50 border-amber-200";
    } else {
      statusClasses = "bg-white border-gray-200";
    }
    
    return `${baseClasses} ${statusClasses} ${interactiveClasses}`;
  };
  
  return (
    <div 
      className={getCardClasses()}
      onClick={handleClick}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-disabled={disabled}
      data-chore-id={chore.id}
    >
      {/* Status Indicator */}
      {getStatusIndicator()}
      
      {/* Chore Icon and Title */}
      <div className="flex items-center mb-2">
        {getChoreIcon()}
        <h3 className="ml-2 font-bold text-lg text-gray-800 line-clamp-1">{chore.title}</h3>
      </div>
      
      {/* Description with limited lines */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{chore.description || "Complete this chore to earn Palsson Bucks!"}</p>
      
      {/* Due Time if available */}
      {formattedTime && (
        <div className="flex items-center text-gray-600 text-xs mb-2">
          <CalendarClock size={14} className="mr-1" />
          <span>Due by {formattedTime}</span>
        </div>
      )}
      
      {/* Streak indicator */}
      {streakIndicator}
      
      {/* Reward amount */}
      <div className="mt-auto pt-2 flex items-center">
        <div className="flex items-center bg-green-100 px-2 py-1 rounded">
          <DollarSign size={14} className="text-green-600" />
          <span className="font-bold text-green-700">{chore.bucksAwarded}</span>
        </div>
        
        {/* Action hint for pending chores */}
        {chore.status === 'pending' && (
          <div className="ml-auto text-xs text-blue-600 flex items-center">
            <span>Tap to complete</span>
          </div>
        )}
        
        {/* Approved timestamp if approved */}
        {chore.status === 'approved' && chore.approvedTimestamp && (
          <div className="ml-auto text-xs text-green-600">
            Approved
          </div>
        )}
      </div>
    </div>
  );
};

export default ChoreCard;