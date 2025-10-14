import React from 'react';
import { Brain, Sparkles } from 'lucide-react';

// Animated Allie character component
export const AllieCharacter = ({ mood = 'happy', size = 'md', animate = false }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const moodColors = {
    curious: 'from-purple-400 to-indigo-600',
    happy: 'from-pink-400 to-rose-600',
    helpful: 'from-blue-400 to-cyan-600',
    celebrating: 'from-amber-400 to-yellow-600'
  };

  const iconSizes = {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64
  };

  return (
    <div className={`relative ${animate ? 'animate-bounce' : ''}`}>
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${moodColors[mood]} shadow-lg flex items-center justify-center`}>
        <Brain className="text-white" size={iconSizes[size]} />
      </div>
      {mood === 'celebrating' && (
        <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={20} />
      )}
    </div>
  );
};

// Optimized Family member component with lazy image loading
export const FamilyMember = ({ role, mood = 'neutral', size = 'md', name }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36'
  };

  const moodStyles = {
    stressed: 'border-red-300 shadow-red-200',
    neutral: 'border-gray-300 shadow-gray-200',
    happy: 'border-green-300 shadow-green-200'
  };

  // Use optimized image URLs (you'll need to create these)
  const getImageUrl = (person, quality = 'thumb') => {
    // Return thumbnail for initial load, full image will be loaded on demand
    const extension = quality === 'thumb' ? '-thumb.jpg' : '.jpg';
    return `/family-photos/${person}${extension}`;
  };

  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageSrc, setImageSrc] = React.useState(getImageUrl(role, 'thumb'));

  React.useEffect(() => {
    // Load full image after component mounts
    if (size === 'xl' || size === 'lg') {
      const img = new Image();
      img.src = getImageUrl(role, 'full');
      img.onload = () => {
        setImageSrc(img.src);
        setImageLoaded(true);
      };
    }
  }, [role, size]);

  return (
    <div className="text-center">
      <div className={`${sizeClasses[size]} rounded-full border-4 ${moodStyles[mood]} overflow-hidden shadow-lg transition-all duration-500 mx-auto`}>
        {imageSrc ? (
          <img 
            src={imageSrc}
            alt={name || role}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-90'}`}
            loading="lazy"
            onError={(e) => {
              // Fallback to initials
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center"><span class="text-2xl font-bold text-gray-600">${name ? name[0] : role[0].toUpperCase()}</span></div>`;
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-600">
              {name ? name[0] : role[0].toUpperCase()}
            </span>
          </div>
        )}
      </div>
      {name && (
        <p className="mt-2 text-base font-medium text-gray-700">{name}</p>
      )}
    </div>
  );
};