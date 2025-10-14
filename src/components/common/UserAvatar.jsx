// src/components/common/UserAvatar.jsx
import React, { useState, useEffect } from 'react';

// Use the global profile image cache from window if available
// This ensures consistency with profileUtils.js
let profileImageCache;
let recentlyClearedCache;

try {
  if (typeof window !== 'undefined' && window._profileImageCache) {
    profileImageCache = window._profileImageCache;
    recentlyClearedCache = window._recentlyClearedCache || new Map();
  } else {
    profileImageCache = new Map();
    recentlyClearedCache = new Map();
  }
} catch (e) {
  profileImageCache = new Map();
  recentlyClearedCache = new Map();
}

// Export a function to clear cache for a specific user
export const clearUserAvatarCache = (userId) => {
  if (userId) {
    profileImageCache.delete(userId);
    // Mark as recently cleared to prevent re-caching
    if (recentlyClearedCache) {
      recentlyClearedCache.set(userId, Date.now());
    }
  }
};

// Export a function to clear all cache
export const clearAllAvatarCache = () => {
  profileImageCache.clear();
};

const UserAvatar = ({ user, size = 40, className = "" }) => {
  const [imageError, setImageError] = useState(false);
  
  // Generate consistent color based on user ID or name
  const generateColor = (str) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 
      'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-cyan-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };
  
  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Get user identifier for caching
  const getUserIdentifier = (user) => {
    return user?.id || 
           user?.userId || 
           user?.email || 
           (user?.name && user.name.replace(/\s+/g, '_').toLowerCase()) || 
           'unknown';
  };
  
  // Get profile image immediately (no useEffect needed)
  const getProfileImage = () => {
    if (!user) return null;
    
    const userIdentifier = getUserIdentifier(user);
    
    // First check cache
    const cachedImage = profileImageCache.get(userIdentifier);
    
    // Find the first valid profile image from the user object
    const profileImage = user.profilePictureUrl ||
                         user.profilePicture || 
                         user.profilePhoto || 
                         user.photoURL || 
                         user.avatar ||
                         user.picture ||
                         user.image;
                         
    // Exclude placeholder images
    const isValidImage = profileImage && 
                         !(profileImage.includes && profileImage.includes('/api/placeholder')) && 
                         !(profileImage.includes && profileImage.includes('placeholder')) &&
                         !(profileImage.includes && profileImage.includes('default'));
    
    if (isValidImage) {
      // Update cache if needed
      if (cachedImage !== profileImage) {
        profileImageCache.set(userIdentifier, profileImage);
      }
      return profileImage;
    }
    
    // Return cached image if no valid image in user object
    return cachedImage || null;
  };
  
  const profileImageUrl = getProfileImage();
  
  // Preload image to make it appear faster
  useEffect(() => {
    if (profileImageUrl && typeof Image !== 'undefined') {
      const img = new Image();
      img.src = profileImageUrl;
    }
  }, [profileImageUrl]);
  
  // Set styles as inline for consistent sizing
  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size/2.5}px` // Scale font size based on avatar size
  };
  
  // Check if we have a valid image
  if (profileImageUrl && !imageError) {
    return (
      <div 
        className={`rounded-full overflow-hidden ${className}`}
        style={avatarStyle}
      >
        <img 
          src={profileImageUrl} 
          alt={user?.name || 'User'} 
          className="w-full h-full object-cover"
          onError={() => {
            setImageError(true);
            // Remove invalid image from cache
            profileImageCache.delete(getUserIdentifier(user));
          }}
        />
      </div>
    );
  } else {
    // Fallback to colored circle with initials
    const colorClass = generateColor(user?.id || user?.name || 'user');
    return (
      <div 
        className={`rounded-full flex items-center justify-center text-white font-medium ${colorClass} ${className}`}
        style={avatarStyle}
      >
        {getInitials(user?.name || '?')}
      </div>
    );
  }
};

export default UserAvatar;