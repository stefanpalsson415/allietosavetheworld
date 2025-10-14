import React from 'react';
import { Check, Clock, DollarSign, Star, Lock, CheckCircle } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

const SpotifyChoreCard = ({ 
  chore, 
  onClick, 
  isAdmin = false, 
  disabled = false,
  onDelete,
  onImageAdded
}) => {
  // Determine the status of the chore
  const isCompleted = chore.status === 'completed' || chore.status === 'approved';
  const isPending = chore.status === 'pending';
  const isActive = chore.isActive !== false;
  
  // Safely access nested properties with fallbacks
  const title = chore.title || chore.template?.title || chore.name || "Untitled Chore";
  const description = chore.description || chore.template?.description || chore.details || "";
  const bucksReward = chore.bucksAwarded || chore.bucksReward || chore.rewardValue || chore.template?.bucksReward || 1;
  const timeOfDay = chore.timeOfDay || chore.template?.timeOfDay || 'anytime';
  
  // Image URL with multiple fallbacks
  const imageUrl = chore.imageUrl || 
                  chore.customIconUrl || 
                  chore.template?.imageUrl || 
                  chore.template?.customIconUrl ||
                  chore.templateData?.imageUrl ||
                  chore.templateData?.customIconUrl;
  
  // Time icons
  const timeIcons = {
    morning: '🌅',
    afternoon: '☀️',
    evening: '🌙',
    anytime: '⭐'
  };
  
  // Status colors and styles
  const getStatusStyles = () => {
    if (isCompleted) {
      return {
        border: 'border-green-500',
        bg: 'bg-green-50',
        text: 'text-green-700',
        badge: 'bg-green-500'
      };
    }
    if (isPending) {
      return {
        border: 'border-yellow-500',
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        badge: 'bg-yellow-500'
      };
    }
    if (!isActive && isAdmin) {
      return {
        border: 'border-gray-300',
        bg: 'bg-gray-50',
        text: 'text-gray-500',
        badge: 'bg-gray-400'
      };
    }
    return {
      border: 'border-gray-200',
      bg: 'bg-white',
      text: 'text-gray-700',
      badge: 'bg-blue-500'
    };
  };
  
  const styles = getStatusStyles();
  
  return (
    <div 
      className={`relative rounded-lg shadow-md overflow-hidden transition-all duration-300 cursor-pointer h-full flex flex-col
        ${styles.bg} ${styles.border} border-2
        ${disabled ? 'opacity-75 cursor-not-allowed' : 'hover:shadow-lg hover:scale-105'}
        ${isCompleted && !isAdmin ? 'ring-2 ring-green-400 ring-offset-2' : ''}
      `}
      onClick={disabled ? undefined : onClick}
    >
      {/* Image section with overlay for completed status */}
      <div className={`relative ${isAdmin ? 'h-56' : 'h-40'} bg-gradient-to-br from-gray-100 to-gray-200`}>
        {imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              alt={title}
              className={`w-full h-full object-cover ${isCompleted ? 'opacity-70' : ''}`}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="hidden w-full h-full items-center justify-center text-6xl bg-gradient-to-br from-blue-100 to-purple-100">
              {timeIcons[timeOfDay]}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-blue-100 to-purple-100">
            {timeIcons[timeOfDay]}
          </div>
        )}
        
        {/* Completed overlay - only for child view */}
        {isCompleted && !isAdmin && (
          <div className="absolute inset-0 bg-green-500 bg-opacity-30 flex items-center justify-center">
            <div className="bg-white rounded-full p-3 shadow-lg">
              <CheckCircle size={48} className="text-green-500" />
            </div>
          </div>
        )}
        
        {/* Pending approval badge */}
        {isPending && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
            <Clock size={12} className="mr-1" />
            Pending
          </div>
        )}
        
        {/* Admin controls */}
        {isAdmin && (
          <div className="absolute top-2 left-2 flex space-x-2">
            {onImageAdded && (
              <label className="p-2 bg-white rounded-full shadow-md cursor-pointer hover:bg-gray-100">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && onImageAdded) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        onImageAdded(chore.id, reader.result, file);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </label>
            )}
          </div>
        )}
        
        {/* Dollar amount badge for admin view - moved to bottom center */}
        {isAdmin && (
          <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-green-500 text-white text-base font-bold px-4 py-1.5 rounded-full flex items-center shadow-lg">
            <DollarSign size={18} className="mr-1" />
            {bucksReward}
          </div>
        )}
      </div>
      
      {/* Content section - flex-1 to fill remaining space */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <h3 className={`font-semibold text-base mb-1 ${styles.text} ${isCompleted ? 'line-through' : ''}`}>
            {title}
          </h3>
          {description && (
            <p className={`text-sm line-clamp-2 ${isCompleted ? 'text-gray-500 line-through' : 'text-gray-600'}`}>
              {description}
            </p>
          )}
        </div>
        
        {/* Info badges - only show for child view */}
        {!isAdmin && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-2">
              <div className={`flex items-center ${styles.badge} text-white text-xs px-2 py-1 rounded-full`}>
                <DollarSign size={12} className="mr-1" />
                {bucksReward} {bucksReward === 1 ? 'Buck' : 'Bucks'}
              </div>
              <div className="flex items-center bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                <Clock size={12} className="mr-1" />
                {timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}
              </div>
            </div>
          </div>
        )}
        
        
        {/* Status text */}
        {isCompleted && (
          <div className="text-center mt-3">
            <span className="text-green-600 font-medium text-sm">
              ✓ Completed!
            </span>
          </div>
        )}
        
        {!isActive && isAdmin && (
          <div className="text-center mt-3">
            <span className="text-gray-500 text-sm flex items-center justify-center">
              <Lock size={14} className="mr-1" />
              Inactive
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpotifyChoreCard;