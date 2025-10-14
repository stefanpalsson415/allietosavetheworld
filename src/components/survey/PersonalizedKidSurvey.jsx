// src/components/survey/PersonalizedKidSurvey.jsx
import React, { useState, useEffect } from 'react';
import { 
  Gift, AlertCircle, X, Star, Trophy, ThumbsUp, School,
  ArrowRight, Check, Sparkles
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';

// Simplified minimal component version to fix hook issues
const PersonalizedKidSurvey = ({ onClose, initialChildId = null }) => {
  // Context hooks
  const { 
    familyMembers,
    familyId
  } = useFamily();
  
  // Basic state
  const [activeChild, setActiveChild] = useState(initialChildId);
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get active child data
  const activeChildData = familyMembers.find(m => m.id === activeChild);
  
  // Effect to set initial child if not provided
  useEffect(() => {
    if (!activeChild && familyMembers.length > 0) {
      const children = familyMembers.filter(member => member.role === 'child');
      if (children.length > 0) {
        const storedChildId = localStorage.getItem('selectedChildId');
        if (storedChildId && children.find(c => c.id === storedChildId)) {
          setActiveChild(storedChildId);
        } else {
          setActiveChild(children[0].id);
        }
      }
    }
  }, [familyMembers, activeChild]);
  
  // Progress handler
  const handleNext = () => {
    setActiveStep(activeStep + 1);
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    return Math.min(100, activeStep * 25);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-lg">
            <div className="p-4 rounded-lg bg-white shadow-lg">
              <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-700 font-roboto text-center">Loading...</p>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-700 flex items-center">
            <Sparkles size={24} className="text-yellow-500 mr-2" />
            Personalized Kid Survey
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-purple-800 bg-purple-100 px-3 py-1 rounded-full text-sm">
              Step {activeStep + 1} of 4
            </span>
            <span className="text-sm font-medium text-indigo-600">
              {Math.round(calculateProgress())}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500" 
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
        </div>
        
        {/* Welcome / Child Selection (Step 0) */}
        {activeStep === 0 && (
          <div className="text-center py-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Sparkles size={46} className="text-white" />
            </div>
            
            <h3 className="text-xl font-bold mb-3">Let's discover your child's interests & learning style</h3>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              This personalized survey will help us understand what your child loves, how they learn best, 
              and provide customized gift and activity recommendations.
            </p>
            
            {/* Child selection */}
            <div className="mb-8">
              <h4 className="font-medium text-gray-700 mb-3">Select a child:</h4>
              <div className="flex flex-wrap justify-center gap-3">
                {familyMembers
                  .filter(member => member.role === 'child')
                  .map(child => (
                    <button
                      key={child.id}
                      onClick={() => setActiveChild(child.id)}
                      className={`flex flex-col items-center p-4 rounded-xl transition-all ${
                        activeChild === child.id 
                          ? 'bg-indigo-50 border-2 border-indigo-300 ring-2 ring-indigo-200' 
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <UserAvatar user={child} size={64} className="mb-3" />
                      <span className="font-medium">{child.name}</span>
                      <span className="text-sm text-gray-500">{child.age ? `${child.age} years old` : ''}</span>
                    </button>
                  ))}
              </div>
            </div>
            
            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star size={24} className="text-purple-700" />
                </div>
                <h4 className="font-medium text-purple-800 mb-1">Discover Interests</h4>
                <p className="text-sm text-purple-700">Find what brings your child joy and excitement</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <School size={24} className="text-blue-700" />
                </div>
                <h4 className="font-medium text-blue-800 mb-1">Learning Style</h4>
                <p className="text-sm text-blue-700">Understand how your child learns best</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gift size={24} className="text-green-700" />
                </div>
                <h4 className="font-medium text-green-800 mb-1">Perfect Gifts</h4>
                <p className="text-sm text-green-700">Get personalized gift and activity ideas</p>
              </div>
            </div>
            
            {/* Start button */}
            <button
              onClick={handleNext}
              disabled={!activeChild || isLoading}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium text-lg flex items-center mx-auto shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Survey
              <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        )}
        
        {/* Placeholder for other steps (We'll add these back once basic component works) */}
        {activeStep > 0 && (
          <div className="text-center py-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Check size={46} className="text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-3 text-green-600">
              Step {activeStep} placeholder
            </h3>
            
            <p className="text-gray-600 mb-6 text-lg max-w-xl mx-auto">
              This is a simplified version while we fix the hook issues.
            </p>
            
            {/* Continue button */}
            <button
              onClick={activeStep < 3 ? handleNext : onClose}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium text-lg flex items-center mx-auto shadow-md hover:shadow-lg transition-all"
            >
              {activeStep < 3 ? 'Continue' : 'Finish'}
              <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalizedKidSurvey;