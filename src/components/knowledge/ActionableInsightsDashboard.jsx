/**
 * ActionableInsightsDashboard.jsx
 * 
 * Dashboard component for displaying ML-powered actionable insights
 * and recommendations based on the family knowledge graph.
 */

import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import ActionableSuggestionsEngine from '../../services/knowledge/ActionableSuggestionsEngine';
import MachineLearningService from '../../services/knowledge/MachineLearningService';
import SuggestionManager from './SuggestionManager';

const ActionableInsightsDashboard = () => {
  const { currentUser } = useAuth();
  const { familyId, familyMembers } = useFamily();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [activeTab, setActiveTab] = useState('suggestions');
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Initialize the ML service
        await MachineLearningService.initialize();
        
        // Check initialization status
        const initialized = MachineLearningService.isInitialized();
        setIsInitialized(initialized);
        
        // Get model info
        if (initialized) {
          setModelInfo({
            version: MachineLearningService.getModelVersion()
          });
        }
        
        // Initialize the suggestions engine
        await ActionableSuggestionsEngine.initialize();
      } catch (error) {
        console.error('Error initializing ActionableInsightsDashboard:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);
  
  // Handle generating new suggestions
  const handleGenerateSuggestions = async () => {
    if (!familyId) return;
    
    setIsLoading(true);
    try {
      const result = await ActionableSuggestionsEngine.generateSuggestions(
        familyId,
        { immediate: true }
      );
      
      return result;
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Actionable ML Insights</h1>
          
          <div className="flex items-center">
            {modelInfo && (
              <span className="text-sm text-gray-500 mr-4">
                ML Model {isInitialized ? '✓' : '✗'} • v{modelInfo.version}
              </span>
            )}
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">
          Machine learning powered recommendations that adapt to your family's unique patterns
          and provide personalized suggestions for improving family life.
        </p>
      </div>
      
      {/* Tab navigation */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'suggestions' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
        </button>
        <button
          className={`py-2 px-4 mr-2 ${activeTab === 'ml_insights' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('ml_insights')}
        >
          ML Insights
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'settings' ? 'border-b-2 border-blue-500 font-semibold' : 'text-gray-500'}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>
      
      {activeTab === 'suggestions' && (
        <SuggestionManager
          familyId={familyId}
          onGenerateSuggestions={handleGenerateSuggestions}
        />
      )}
      
      {activeTab === 'ml_insights' && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Machine Learning Insights</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">How It Works</h3>
            <p className="text-gray-600">
              Our machine learning system analyzes patterns in your family's activities, 
              tasks, and interactions to generate personalized recommendations. The system
              learns from your feedback to improve suggestions over time.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Data Sources</h4>
              <ul className="list-disc pl-5 text-gray-600 text-sm">
                <li>Family calendar events</li>
                <li>Task assignments and completions</li>
                <li>Family interactions and feedback</li>
                <li>Document analysis</li>
                <li>Historical patterns</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">Learning Process</h4>
              <ul className="list-disc pl-5 text-gray-600 text-sm">
                <li>Pattern recognition in family activities</li>
                <li>Feedback collection on suggestions</li>
                <li>Implementation success tracking</li>
                <li>Progressive model improvement</li>
                <li>Personalization to your family's needs</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-2">Model Information</h3>
            
            {isInitialized ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-600">Model Version</h4>
                  <p className="text-lg">{modelInfo?.version}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-600">Suggestion Types</h4>
                  <p className="text-lg">9</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-600">Confidence Threshold</h4>
                  <p className="text-lg">75%</p>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium">Model Not Fully Initialized</h4>
                <p className="text-sm text-gray-600">
                  The machine learning model is not currently initialized. 
                  Suggestions will use basic heuristics until the model is available.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">ML Settings</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Data & Privacy</h3>
            <p className="text-gray-600 mb-4">
              Control how your family data is used for machine learning and personalization.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enable-ml"
                  defaultChecked={true}
                  className="mr-2"
                />
                <label htmlFor="enable-ml" className="text-sm">
                  Enable machine learning for suggestions
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="store-feedback"
                  defaultChecked={true}
                  className="mr-2"
                />
                <label htmlFor="store-feedback" className="text-sm">
                  Store feedback for model improvement
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="on-device"
                  defaultChecked={true}
                  className="mr-2"
                />
                <label htmlFor="on-device" className="text-sm">
                  Process data on-device when possible (privacy-preserving)
                </label>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Suggestion Preferences</h3>
            <p className="text-gray-600 mb-4">
              Configure which types of suggestions you'd like to receive.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(ActionableSuggestionsEngine.suggestionTypes || {}).map(([key, type]) => (
                <div key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`suggestion-type-${type}`}
                    defaultChecked={true}
                    className="mr-2"
                  />
                  <label htmlFor={`suggestion-type-${type}`} className="text-sm">
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Advanced Options</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Confidence Threshold
                </label>
                <select 
                  className="border rounded w-full p-2"
                  defaultValue="medium"
                >
                  <option value="very_high">Very High (90%+)</option>
                  <option value="high">High (75%+)</option>
                  <option value="medium">Medium (50%+)</option>
                  <option value="low">Low (All Suggestions)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Only show suggestions above this confidence level
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Suggestion Frequency
                </label>
                <select 
                  className="border rounded w-full p-2"
                  defaultValue="weekly"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  How often to generate new suggestions
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionableInsightsDashboard;