// src/components/reward/SpotifyRewardCard.jsx
import React, { useState, useRef } from 'react';
import { 
  DollarSign, 
  Clock, 
  AlertCircle,
  ImagePlus,
  Trash2,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * SpotifyRewardCard component displays a reward styled to match chore cards
 * 
 * @param {Object} props
 * @param {Object} props.reward - The reward object with details
 * @param {Function} props.onClick - Function to call when the card is clicked
 * @param {Boolean} props.disabled - Whether the card is disabled/non-interactive
 * @param {Number} props.bucksBalance - Current Palsson Bucks balance for affordability check
 * @param {Boolean} props.isAdmin - Whether card is used in admin interface
 * @param {Function} props.onImageAdded - Function called when an image is added to the reward
 */
const SpotifyRewardCard = ({ reward, onClick, disabled = false, bucksBalance = 0, isAdmin = false, onImageAdded, onDelete }) => {
  // State for drag interactions and confirmations
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const fileInputRef = useRef(null);
  
  if (!reward) return null;
  
  // Get the price from various possible properties
  const rewardPrice = reward.price || reward.bucksPrice || reward.bucksValue || 50;
  
  // Is this reward affordable?
  const isAffordable = bucksBalance >= rewardPrice;
  const isPurchased = reward.status === 'pending' || reward.status === 'approved';
  
  // Get the icon emoji for the category
  const getCategoryEmoji = () => {
    switch (reward.category) {
      case 'activities':
        return '🎮';
      case 'items':
        return '🎁';
      case 'privileges':
        return '👑';
      case 'special events':
        return '🌟';
      default:
        return '🎯';
    }
  };
  
  // Handle click, but only if the card is not disabled
  const handleClick = () => {
    if (!disabled && onClick && isAffordable && !isPurchased) {
      onClick(reward);
    }
  };
  
  return (
    <motion.div 
      whileHover={!disabled && isAffordable && !isPurchased ? { scale: 1.02 } : {}}
      whileTap={!disabled && isAffordable && !isPurchased ? { scale: 0.98 } : {}}
      className={`relative overflow-hidden rounded-lg border transition-all cursor-pointer ${
        isPurchased
          ? 'bg-gray-50 border-gray-200' 
          : isAffordable
            ? 'bg-white border-gray-300 hover:border-purple-400 hover:shadow-md'
            : 'bg-gray-50 border-gray-200 opacity-75'
      }`}
      onClick={handleClick}
      data-reward-id={reward.id}
    >
      {/* Add a prominent price badge in the top-right corner for child view */}
      {!isAdmin && reward.status !== 'pending' && (
        <div className="absolute top-2 right-2 z-20 bg-green-600 text-white rounded-lg px-3 py-2 shadow-lg flex items-center">
          <DollarSign size={20} className="mr-1" />
          <span className="text-xl font-bold">{rewardPrice}</span>
        </div>
      )}
      
      <div className="flex items-center gap-3 p-4">
        {/* Completion/Purchase indicator */}
        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
          isPurchased
            ? 'bg-green-500 border-green-500'
            : isAffordable
              ? 'border-gray-400 hover:border-purple-500'
              : 'border-gray-300'
        }`}>
          {isPurchased && <Check size={20} className="text-white" />}
          {!isPurchased && !isAffordable && <AlertCircle size={16} className="text-gray-400" />}
        </div>
        
        {/* Reward image/icon */}
        <div className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center relative ${isDraggingOver ? 'ring-2 ring-blue-500' : ''}`}
          onDragOver={(e) => {
            if (isAdmin && !disabled) {
              e.preventDefault();
              setIsDraggingOver(true);
            }
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={(e) => {
            if (isAdmin && !disabled) {
              e.preventDefault();
              setIsDraggingOver(false);
              setIsProcessingImage(true);
              
              // Process dropped files
              const files = e.dataTransfer.files;
              if (files.length > 0 && files[0].type.startsWith('image/')) {
                const file = files[0];
                const reader = new FileReader();
                
                reader.onload = (event) => {
                  if (onImageAdded) {
                    onImageAdded(reward.id, event.target.result, file);
                  }
                  setIsProcessingImage(false);
                };
                
                reader.onerror = () => {
                  console.error('Error reading file');
                  setIsProcessingImage(false);
                };
                
                reader.readAsDataURL(file);
              } else {
                setIsProcessingImage(false);
              }
            }
          }}
          onClick={(e) => {
            if (isAdmin && !disabled) {
              // Stop propagation to prevent card click
              e.stopPropagation();
              // Trigger file input click
              fileInputRef.current?.click();
            }
          }}
        >
          {/* Hidden file input for image upload */}
          {isAdmin && !disabled && (
            <input 
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.length > 0) {
                  setIsProcessingImage(true);
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  
                  reader.onload = (event) => {
                    if (onImageAdded) {
                      onImageAdded(reward.id, event.target.result, file);
                    }
                    setIsProcessingImage(false);
                  };
                  
                  reader.onerror = () => {
                    console.error('Error reading file');
                    setIsProcessingImage(false);
                  };
                  
                  reader.readAsDataURL(file);
                }
              }}
            />
          )}
          
          {reward.imageUrl ? (
            <img 
              src={reward.imageUrl} 
              alt={reward.title || reward.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                // Show emoji as fallback if image fails
                if (e.target.parentElement) {
                  e.target.parentElement.innerHTML = `<span class="text-2xl">${getCategoryEmoji()}</span>`;
                }
              }}
            />
          ) : (
            <span className="text-2xl">{getCategoryEmoji()}</span>
          )}
          
          {/* Processing indicator */}
          {isProcessingImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
          
          {/* Admin upload overlay */}
          {isAdmin && !disabled && !isProcessingImage && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group">
              <ImagePlus size={20} className="text-white" />
            </div>
          )}
        </div>
        
        {/* Reward content */}
        <div className="flex-1">
          <h4 className={`font-medium ${isPurchased ? 'line-through text-gray-500' : ''}`}>
            {reward.title || reward.name}
          </h4>
          {reward.description && (
            <p className={`text-sm ${isPurchased ? 'text-gray-400' : 'text-gray-600'}`}>
              {reward.description}
            </p>
          )}
          
          {/* Category and status info */}
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isPurchased ? 'bg-gray-100 text-gray-500' : `bg-${getCategoryColor(reward.category)}-100 text-${getCategoryColor(reward.category)}-700`
            }`}>
              {reward.category}
            </span>
            
            {reward.status === 'pending' && (
              <span className="text-xs text-amber-500 flex items-center">
                <Clock size={12} className="mr-1" />
                Pending
              </span>
            )}
            
            {reward.status === 'approved' && (
              <span className="text-xs text-green-500 flex items-center">
                <Check size={12} className="mr-1" />
                Approved
              </span>
            )}
          </div>
        </div>
        
        {/* Price badge - only show for admin view */}
        {isAdmin && (
          <div className={`flex items-center gap-1 px-3 py-2 rounded-lg ${
            isPurchased ? 'bg-gray-100' : isAffordable ? 'bg-green-100' : 'bg-gray-100'
          }`}>
            <DollarSign size={18} className={isPurchased ? 'text-gray-400' : isAffordable ? 'text-green-600' : 'text-gray-400'} />
            <span className={`text-lg font-bold ${
              isPurchased ? 'text-gray-400' : isAffordable ? 'text-green-600' : 'text-gray-400'
            }`}>
              {rewardPrice}
            </span>
          </div>
        )}
        
        {/* Admin delete button */}
        {isAdmin && !disabled && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      
      {/* Delete confirmation dialog */}
      {isAdmin && !disabled && showDeleteConfirm && (
        <div className="absolute inset-0 bg-white/95 flex items-center justify-center z-30 rounded-lg">
          <div className="bg-white rounded-lg shadow-lg p-4 mx-4 border">
            <h3 className="font-medium mb-2">Delete this reward?</h3>
            <div className="flex justify-end space-x-2 mt-3">
              <button
                className="px-3 py-1 bg-gray-200 rounded-md text-sm hover:bg-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete) {
                    onDelete(reward.id);
                  }
                  setShowDeleteConfirm(false);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Helper function to get a color based on category
export const getCategoryColor = (category) => {
  switch (category) {
    case 'activities':
      return 'orange';
    case 'items':
      return 'purple';
    case 'privileges':
      return 'green';
    case 'special events':
      return 'yellow';
    default:
      return 'gray';
  }
};

export default SpotifyRewardCard;