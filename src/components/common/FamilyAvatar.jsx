// src/components/common/FamilyAvatar.jsx
import React, { useState } from 'react';

const FamilyAvatar = ({ familyName, familyPicture, size = 128, className = "" }) => {
  const [imageError, setImageError] = useState(false);
  
  // Generate consistent color based on family name
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
  
  // Get family initial from family name
  const getFamilyInitial = (name) => {
    if (!name) return 'F';
    return name.charAt(0).toUpperCase();
  };
  
  // Check if we have a valid family picture
  const hasValidImage = familyPicture && 
                       familyPicture !== '' && 
                       !familyPicture.includes('/favicon.ico') &&
                       !familyPicture.includes('placeholder') &&
                       !familyPicture.includes('default') &&
                       !imageError;
  
  // Set styles as inline for consistent sizing
  const avatarStyle = {
    width: `${size}px`,
    height: `${size}px`,
    fontSize: `${size/2.5}px` // Scale font size based on avatar size
  };
  
  if (hasValidImage) {
    return (
      <div 
        className={`rounded-xl overflow-hidden ${className}`}
        style={avatarStyle}
      >
        <img 
          src={familyPicture} 
          alt={`${familyName} Family`} 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  } else {
    // Fallback to colored block with family initial
    const colorClass = generateColor(familyName || 'Family');
    return (
      <div 
        className={`rounded-xl flex items-center justify-center text-white font-medium ${colorClass} ${className}`}
        style={avatarStyle}
      >
        {getFamilyInitial(familyName)}
      </div>
    );
  }
};

export default FamilyAvatar;