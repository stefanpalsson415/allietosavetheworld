// src/components/cycles/LazyCycleJourney.jsx
import React, { Suspense, lazy } from 'react';

// Lazy load the optimized component
const OptimizedCycleJourney = lazy(() => import('./OptimizedCycleJourney'));

// Simple loading placeholder
const LoadingPlaceholder = () => (
  <div className="bg-white rounded-lg shadow p-6 mb-6">
    <div className="flex justify-between items-center mb-4">
      <div>
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 w-64 bg-gray-100 rounded mt-2 animate-pulse"></div>
      </div>
      <div className="h-8 w-32 bg-purple-100 rounded-full animate-pulse"></div>
    </div>
    
    <div className="grid grid-cols-3 gap-4 mt-6">
      {[1, 2, 3].map(i => (
        <div key={i} className="bg-gray-50 rounded-md p-4 animate-pulse">
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 mr-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="flex flex-wrap mb-2">
            {[...Array(i)].map((_, idx) => (
              <div 
                key={idx} 
                className="w-8 h-8 rounded-full bg-gray-200 mr-1 mt-1"
              ></div>
            ))}
          </div>
          <div className="h-3 w-full bg-gray-100 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

// Component wrapper with error boundary
const LazyCycleJourney = (props) => {
  return (
    <Suspense fallback={<LoadingPlaceholder />}>
      <OptimizedCycleJourney {...props} />
    </Suspense>
  );
};

export default LazyCycleJourney;