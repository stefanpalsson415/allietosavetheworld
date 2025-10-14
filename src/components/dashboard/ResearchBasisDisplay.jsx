// src/components/dashboard/ResearchBasisDisplay.jsx
import React, { useState } from 'react';
import { Info, BookOpen, ExternalLink, ChevronDown } from 'lucide-react';
import TASK_IMPACT_RESEARCH from '../../data/ResearchBackedTaskImpact';

/**
 * ResearchBasisDisplay Component
 * 
 * Shows the research basis for task weight calculations
 * Displays citations and key findings that justify impact levels
 */
const ResearchBasisDisplay = ({ task, impactLevel, className = '' }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  // Get research basis for the impact level
  const researchBasis = impactLevel ? 
    TASK_IMPACT_RESEARCH.getResearchBasis(impactLevel) : 
    [];
  
  // Get full impact mapping for this level
  const impactMapping = impactLevel ? 
    TASK_IMPACT_RESEARCH.taskImpactMapping[impactLevel] : 
    null;
  
  if (!impactMapping || !researchBasis.length) {
    return null;
  }
  
  return (
    <div className={`bg-blue-50 rounded-lg p-3 ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center">
          <BookOpen className="text-blue-600 mr-2" size={16} />
          <span className="text-sm font-medium text-gray-900">
            Research-Backed Impact: {impactLevel.charAt(0).toUpperCase() + impactLevel.slice(1)}
          </span>
        </div>
        <ChevronDown
          className={`text-gray-500 transition-transform ${showDetails ? 'rotate-180' : ''}`}
          size={16}
        />
      </button>
      
      {showDetails && (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-gray-700">
            {impactMapping.description}
          </p>
          
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Research Citations:</h4>
            <ul className="space-y-2">
              {researchBasis.map((citation, idx) => (
                <li key={idx} className="text-xs text-gray-600 flex items-start">
                  <span className="mr-1">•</span>
                  <span>{citation}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Show quantitative findings if high impact */}
          {impactLevel === 'high' && (
            <div className="bg-white bg-opacity-50 rounded p-2">
              <h4 className="text-xs font-medium text-gray-700 mb-1">Key Statistics:</h4>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• 59% of women do more household chores vs. 6% of men</li>
                <li>• Only 38% of women satisfied with chore division</li>
                <li>• 90% of mothers feel solely responsible for schedules</li>
                <li>• Women's workload increases 64% after having children</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ResearchInsightsPanel Component
 * 
 * Displays key research insights about household labor
 */
export const ResearchInsightsPanel = ({ className = '' }) => {
  const [selectedInsight, setSelectedInsight] = useState(0);
  const insights = TASK_IMPACT_RESEARCH.keyInsights;
  
  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <BookOpen className="text-blue-600 mr-2" size={20} />
        <h3 className="text-lg font-medium text-gray-900">Research Insights</h3>
      </div>
      
      <div className="space-y-4">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedInsight === idx ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedInsight(idx)}
          >
            <h4 className="font-medium text-gray-900 mb-2">{insight.title}</h4>
            <p className="text-sm text-gray-700 mb-1">{insight.insight}</p>
            <p className="text-xs text-gray-500">Source: {insight.source}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start">
          <Info className="text-gray-600 mt-0.5 mr-2 flex-shrink-0" size={16} />
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">About Our Research</p>
            <p>
              Task weights are based on peer-reviewed academic studies that quantify
              the relationship between household task distribution and relationship
              satisfaction. This ensures our system reflects real-world impacts,
              not assumptions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchBasisDisplay;