// src/utils/profileUtils.js

/**
 * Utility functions for handling user profile images consistently
 * throughout the application
 */

// Access the global profile image cache from UserAvatar component
// This is a reference to the same Map object used in UserAvatar.jsx
let profileImageCache;
let recentlyClearedCache; // Track recently cleared entries

try {
  // Initialize if not already available
  if (typeof window !== 'undefined') {
    window._profileImageCache = window._profileImageCache || new Map();
    window._recentlyClearedCache = window._recentlyClearedCache || new Map();
    profileImageCache = window._profileImageCache;
    recentlyClearedCache = window._recentlyClearedCache;
  } else {
    // Fallback for SSR environments
    profileImageCache = new Map();
    recentlyClearedCache = new Map();
  }
} catch (e) {
  // Fallback if window is not available or access is restricted
  profileImageCache = new Map();
  recentlyClearedCache = new Map();
  console.warn('Using local profile image cache');
}

/**
 * Extracts a valid user identifier from a user object
 * @param {Object} user - The user object
 * @returns {string} A consistent identifier for the user
 */
export const getUserIdentifier = (user) => {
  if (!user) return 'unknown';
  
  return user.id || 
         user.userId || 
         user.email || 
         (user.name && user.name.replace(/\s+/g, '_').toLowerCase()) || 
         'unknown';
};

/**
 * Finds the best profile image URL from a user object
 * @param {Object} user - The user object
 * @returns {string|null} The profile image URL or null if none found
 */
export const findProfileImageUrl = (user) => {
  if (!user) return null;
  
  // Check all possible profile image properties
  const profileImage = user.profilePicture || 
                       user.profilePhoto || 
                       user.photoURL || 
                       user.avatar ||
                       user.picture ||
                       user.image;
                       
  // Exclude placeholder images
  if (profileImage && 
     !(profileImage.includes && profileImage.includes('/api/placeholder')) && 
     !(profileImage.includes && profileImage.includes('placeholder')) &&
     !(profileImage.includes && profileImage.includes('default'))) {
    return profileImage;
  }
  
  return null;
};

/**
 * Updates the profile image cache with a user's image
 * @param {Object} user - The user object
 * @param {string} imageUrl - The image URL to cache
 */
export const updateProfileImageCache = (user, imageUrl) => {
  if (!user || !imageUrl) return;
  
  const userId = getUserIdentifier(user);
  profileImageCache.set(userId, imageUrl);
};

/**
 * Preloads all family member profiles into the cache to ensure consistency
 * @param {Array} familyMembers - Array of family member objects
 */
export const preloadFamilyMemberProfiles = (familyMembers) => {
  if (!Array.isArray(familyMembers) || !familyMembers.length) return;
  
  // Clean up old cleared entries (older than 5 seconds)
  const now = Date.now();
  for (const [userId, timestamp] of recentlyClearedCache.entries()) {
    if (now - timestamp > 5000) {
      recentlyClearedCache.delete(userId);
    }
  }
  
  // First pass: Cache all valid profile images
  familyMembers.forEach(member => {
    const userId = getUserIdentifier(member);
    
    // Skip if this was recently cleared (within last 5 seconds)
    if (recentlyClearedCache.has(userId)) {
      return;
    }
    
    const imageUrl = findProfileImageUrl(member);
    if (imageUrl) {
      profileImageCache.set(userId, imageUrl);
    }
  });
  
  // Debug log
  console.log(`Preloaded ${profileImageCache.size} profile images into cache`);
};

/**
 * Clears the profile image cache for a specific user
 * @param {string} userId - The user ID to clear from cache
 */
export const clearProfileImageCache = (userId) => {
  if (userId && profileImageCache) {
    profileImageCache.delete(userId);
    // Mark this as recently cleared to prevent immediate re-caching
    recentlyClearedCache.set(userId, Date.now());
    console.log(`Cleared profile image cache for user: ${userId}`);
  }
};

/**
 * Synchronizes family member profile images across their various instances
 * to ensure consistency throughout the application
 * @param {Array} familyMembers - Array of family member objects
 * @param {Array} events - Optional array of events to also update
 */
export const synchronizeFamilyMemberImages = (familyMembers, events = []) => {
  if (!Array.isArray(familyMembers) || !familyMembers.length) return;
  
  // Build a map of user IDs to their profile images
  const profileMap = new Map();
  
  // First pass: Collect the best image for each family member
  familyMembers.forEach(member => {
    const imageUrl = findProfileImageUrl(member);
    if (imageUrl) {
      const userId = getUserIdentifier(member);
      profileMap.set(userId, imageUrl);
      
      // Also map by name for more flexible matching
      if (member.name) {
        profileMap.set(member.name.toLowerCase(), imageUrl);
      }
    }
  });
  
  // Second pass: Ensure all family members have consistent images
  familyMembers.forEach(member => {
    const userId = getUserIdentifier(member);
    const bestImage = profileMap.get(userId);
    
    if (bestImage) {
      // Consistent update across all image fields
      member.profilePicture = bestImage;
      member.photoURL = bestImage;
      member.avatar = bestImage;
      
      // Update the global cache
      profileImageCache.set(userId, bestImage);
    }
  });
  
  // If events are provided, also update attendees
  if (Array.isArray(events) && events.length > 0) {
    events.forEach(event => {
      if (Array.isArray(event.attendees)) {
        event.attendees.forEach(attendee => {
          const attendeeId = getUserIdentifier(attendee);
          const bestImage = profileMap.get(attendeeId) || 
                           (attendee.name && profileMap.get(attendee.name.toLowerCase()));
          
          if (bestImage) {
            attendee.profilePicture = bestImage;
            attendee.photoURL = bestImage;
            attendee.avatar = bestImage;
          }
        });
      }
    });
  }
  
  return { familyMembers, events };
};

export default {
  preloadFamilyMemberProfiles,
  synchronizeFamilyMemberImages,
  getUserIdentifier,
  findProfileImageUrl,
  updateProfileImageCache
};