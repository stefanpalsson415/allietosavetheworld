// src/components/survey/FloatingBalanceWidget.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Scale, ChevronDown, ChevronUp, X, Maximize, Minimize } from 'lucide-react';
import ProjectedBalanceRadar from './ProjectedBalanceRadar';
// Import SurveyContext to access current responses
import { useSurvey } from '../../contexts/SurveyContext';
import { useFamily } from '../../contexts/FamilyContext';

const FloatingBalanceWidget = ({ 
  answeredQuestions = [], 
  totalQuestions = [], 
  historicalData = [],
  familyPriorities = {},
  onClose,
  currentQuestionIndex
}) => {
  // Get current survey responses and family data from contexts
  const { currentSurveyResponses } = useSurvey() || {};
  const { surveyResponses, familyMembers } = useFamily() || {};
  // Component state
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [height, setHeight] = useState(480);
  const [width, setWidth] = useState(350);
  const [isHighlighted, setIsHighlighted] = useState(false);
  
  // References for resize handling
  const widgetRef = useRef(null);
  const resizingRef = useRef({
    isResizing: false,
    startX: null,
    startY: null,
    startWidth: null,
    startHeight: null
  });
  
  // Handle resize start
  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    resizingRef.current = {
      isResizing: true,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: width,
      startHeight: height
    };
    
    // Add document-level event listeners
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  };
  
  // Handle resize move
  const handleResizeMove = (e) => {
    if (!resizingRef.current.isResizing) return;
    
    const { direction, startX, startY, startWidth, startHeight } = resizingRef.current;
    
    if (direction === 'right') {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(280, Math.min(600, startWidth + deltaX));
      setWidth(newWidth);
    }
    
    if (direction === 'bottom') {
      // For top handle, reverse the direction (negative deltaY)
      const deltaY = startY - e.clientY;
      const newHeight = Math.max(250, Math.min(800, startHeight + deltaY));
      setHeight(newHeight);
    }
  };
  
  // Handle resize end
  const handleResizeEnd = () => {
    resizingRef.current.isResizing = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
  };
  
  // Clean up event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, []);
  
  // Flash widget when new data comes in
  useEffect(() => {
    if (answeredQuestions.length > 0) {
      setIsHighlighted(true);
      const timer = setTimeout(() => {
        setIsHighlighted(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [answeredQuestions.length]);
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Toggle fullscreen
  const toggleFullscreen = (e) => {
    e.stopPropagation();
    setIsFullscreen(!isFullscreen);
    
    if (!isFullscreen) {
      // Store current dimensions to restore later
      widgetRef.current.dataset.prevHeight = height;
      widgetRef.current.dataset.prevWidth = width;
      
      // Set fullscreen dimensions
      setHeight(window.innerHeight - 96);
      setWidth(window.innerWidth - 48);
    } else {
      // Restore previous dimensions
      setHeight(parseInt(widgetRef.current.dataset.prevHeight || 400));
      setWidth(parseInt(widgetRef.current.dataset.prevWidth || 320));
    }
  };
  
  // Calculate completion percentage
  const completionPercentage = Math.round((answeredQuestions.length / totalQuestions.length) * 100) || 0;
  
  // Filter to only count actual question responses (Mama/Papa)
  // We need to accept both question objects and simple response objects
  const validResponses = answeredQuestions.filter(q => 
    (q.response === 'Mama' || q.response === 'Papa') || 
    (q.id && (currentSurveyResponses?.[q.id] === 'Mama' || currentSurveyResponses?.[q.id] === 'Papa'))
  );
  const shouldShowContent = validResponses.length >= 10;
  
  // Get confidence level
  const getConfidence = () => {
    const percentage = (answeredQuestions.length / totalQuestions.length) * 100;
    if (percentage >= 70) return { level: 'High', color: 'bg-green-100 text-green-700' };
    if (percentage >= 40) return { level: 'Medium', color: 'bg-amber-100 text-amber-700' };
    return { level: 'Low', color: 'bg-red-100 text-red-700' };
  };
  
  const confidence = getConfidence();
  
  return (
    <div 
      ref={widgetRef}
      className={`fixed transition-all duration-300 z-50 rounded-lg shadow-lg ${
        isFullscreen 
          ? 'inset-8' 
          : isExpanded 
            ? 'left-4 bottom-16' 
            : 'left-4 bottom-16'
      } ${isHighlighted ? 'ring-4 ring-blue-400' : ''}`}
      style={{ 
        height: isFullscreen ? 'auto' : isExpanded ? `${height}px` : '64px',
        width: isFullscreen ? 'auto' : isExpanded ? `${width}px` : '280px',
        position: 'fixed'
      }}
    >
      {/* Main widget content */}
      <div className={`w-full h-full flex flex-col overflow-hidden rounded-lg ${
        shouldShowContent ? 'bg-white' : 'bg-gray-50'
      }`}>
        {/* Header - always visible */}
        <div 
          className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
            shouldShowContent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}
          onClick={toggleExpanded}
        >
          <div className="flex items-center">
            <Scale size={18} className="mr-2" />
            <div>
              <div className="font-medium">Family Balance</div>
              <div className="text-xs opacity-90">
                {shouldShowContent 
                  ? `${currentQuestionIndex !== undefined ? (currentQuestionIndex + 1) : validResponses.length} of ${totalQuestions.length} questions answered`
                  : `Answer ${Math.max(0, 10 - validResponses.length)} more questions to see projection`
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            {shouldShowContent && isExpanded && (
              <button 
                onClick={toggleFullscreen}
                className="p-1 hover:bg-blue-700 rounded mr-1"
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            )}
            
            <button className="p-1">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-1 w-full bg-gray-200">
          <div 
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
        
        {/* Content area - only visible when expanded */}
        {isExpanded && (
          <div className="flex-1 overflow-auto p-4">
            {shouldShowContent ? (
              <ProjectedBalanceRadar
                answeredQuestions={validResponses}
                totalQuestions={totalQuestions}
                historicalData={historicalData}
                familyPriorities={familyPriorities}
                isWidget={true}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <Scale size={32} className="text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-800 mb-2">Almost there!</h3>
                  <p className="text-sm text-gray-600">
                    Answer {Math.max(0, 10 - validResponses.length)} more questions to see your projected family balance.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Resize handlers - only visible when expanded and not fullscreen */}
        {isExpanded && !isFullscreen && (
          <>
            {/* Top resize handle with visible indicator */}
            <div
              className="absolute top-0 left-0 right-0 h-4 cursor-ns-resize hover:bg-blue-50 flex items-center justify-center"
              onMouseDown={(e) => handleResizeStart(e, 'bottom')}
            >
              <div className="w-10 h-1 bg-gray-400 rounded-full"></div>
            </div>
            
            {/* Right resize handle with visible indicator */}
            <div
              className="absolute top-0 bottom-0 right-0 w-4 cursor-ew-resize hover:bg-blue-50 flex items-center"
              onMouseDown={(e) => handleResizeStart(e, 'right')}
            >
              <div className="h-10 w-1 bg-gray-400 rounded-full mx-auto"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FloatingBalanceWidget;