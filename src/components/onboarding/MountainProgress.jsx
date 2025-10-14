import React from 'react';

const MountainProgress = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;
  
  return (
    <div className="relative w-full h-64 overflow-hidden">
      {/* Clean gradient background - transparent since parent has the gradient */}
      <div className="absolute inset-0" />
      
      {/* Sun - separate element to maintain perfect circle */}
      {progress > 30 && (
        <div 
          className="absolute"
          style={{
            right: '10%',
            top: '35%',
            transform: 'translate(50%, -50%)'
          }}
        >
          {/* Sun glow */}
          <div className="absolute w-48 h-48 rounded-full bg-yellow-400 opacity-20 -inset-6" />
          {/* Sun */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-200 via-yellow-300 to-yellow-400 shadow-lg" />
        </div>
      )}
      
      <svg
        viewBox="0 0 1200 400"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
      >
        {/* Gradient definitions */}
        <defs>
          {/* Simple mountain gradients */}
          <linearGradient id="mountain1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0e7ff" />
            <stop offset="100%" stopColor="#c7d2fe" />
          </linearGradient>
          
          <linearGradient id="mountain2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c7d2fe" />
            <stop offset="100%" stopColor="#a5b4fc" />
          </linearGradient>
          
          <linearGradient id="mountain3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          
          {/* Progress clip */}
          <clipPath id="progressClip">
            <rect x="0" y="0" width={`${progress}%`} height="400" />
          </clipPath>
          
          {/* Bottom fade mask */}
          <linearGradient id="bottomFade" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="70%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="fadeMask">
            <rect x="0" y="0" width="1200" height="400" fill="url(#bottomFade)" />
          </mask>
        </defs>
        
        {/* Mountain outlines - always visible */}
        <g>
          {/* Back layer outline - more peaks */}
          <path
            d="M 0 400 L 100 180 L 200 200 L 300 140 L 400 190 L 500 130 L 600 170 L 700 120 L 800 150 L 900 110 L 1000 160 L 1100 140 L 1200 180 L 1200 400 Z"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
          />
          
          {/* Middle layer outline - more peaks */}
          <path
            d="M 0 400 L 80 240 L 180 220 L 280 180 L 380 230 L 480 170 L 580 210 L 680 160 L 780 200 L 880 150 L 980 190 L 1080 170 L 1200 200 L 1200 400 Z"
            fill="none"
            stroke="#ddd6fe"
            strokeWidth="2"
          />
          
          {/* Front layer outline - more peaks */}
          <path
            d="M 0 400 L 120 280 L 240 240 L 360 260 L 480 220 L 600 250 L 720 210 L 840 240 L 960 200 L 1080 230 L 1200 210 L 1200 400 Z"
            fill="none"
            stroke="#c7d2fe"
            strokeWidth="2"
          />
        </g>
        
        {/* Mountain layers revealed with progress */}
        <g clipPath="url(#progressClip)">
          {/* Back layer - matching outline */}
          <path
            d="M 0 400 L 100 180 L 200 200 L 300 140 L 400 190 L 500 130 L 600 170 L 700 120 L 800 150 L 900 110 L 1000 160 L 1100 140 L 1200 180 L 1200 400 Z"
            fill="url(#mountain1)"
          />
          
          {/* Middle layer - matching outline */}
          <path
            d="M 0 400 L 80 240 L 180 220 L 280 180 L 380 230 L 480 170 L 580 210 L 680 160 L 780 200 L 880 150 L 980 190 L 1080 170 L 1200 200 L 1200 400 Z"
            fill="url(#mountain2)"
          />
          
          {/* Front layer - matching outline */}
          <path
            d="M 0 400 L 120 280 L 240 240 L 360 260 L 480 220 L 600 250 L 720 210 L 840 240 L 960 200 L 1080 230 L 1200 210 L 1200 400 Z"
            fill="url(#mountain3)"
          />
        </g>
        
      </svg>
      
      {/* Progress text */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-20">
        <div className="inline-block bg-white/90 backdrop-blur-sm px-6 py-2 rounded-full shadow-lg border border-gray-200">
          <span className="text-gray-800 text-lg font-medium font-roboto">
            Step {currentStep} of {totalSteps}
          </span>
        </div>
      </div>
      
      {/* Optional: Northern lights effect at high progress */}
      {progress > 80 && (
        <div className="absolute top-0 left-0 right-0 h-32 opacity-30">
          <div className="h-full bg-gradient-to-b from-green-400 via-blue-400 to-transparent animate-pulse" />
        </div>
      )}
    </div>
  );
};

export default MountainProgress;