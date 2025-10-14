// src/components/survey/CleanPersonalizedKidSurvey.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Gift, AlertCircle, X, Star, Trophy, ThumbsUp, School,
  ArrowRight, Check, Sparkles, Heart, BookOpen,  
  Lightbulb, ShoppingBag
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';
import childInterestService from '../../services/ChildInterestService';

// Define constants outside the component
const categoryIcons = {
  toys: "🎁",
  characters: "⭐",
  animals: "🦁",
  sensory: "👐",
  books: "📚",
  lego: "🧱",
  games: "🎮",
  sports: "🏀",
  science: "🔬",
  arts: "🎨",
  tech: "📱",
  coding: "💻",
  fashion: "👕",
  music: "🎵",
  collecting: "🏆",
  default: "🏷️"
};

// Educational areas
const educationalAreas = [
  { id: "reading", name: "Reading & Literature", icon: <BookOpen size={24} />, color: "bg-blue-100 text-blue-800" },
  { id: "math", name: "Math & Numbers", icon: "🔢", color: "bg-purple-100 text-purple-800" },
  { id: "science", name: "Science & Discovery", icon: <Lightbulb size={24} />, color: "bg-green-100 text-green-800" },
  { id: "logic", name: "Logic & Problem Solving", icon: "🧩", color: "bg-amber-100 text-amber-800" },
  { id: "social", name: "Social & Emotional", icon: <Heart size={24} />, color: "bg-red-100 text-red-800" },
  { id: "creativity", name: "Creativity & Arts", icon: "🎨", color: "bg-indigo-100 text-indigo-800" },
  { id: "language", name: "Language & Communication", icon: "💬", color: "bg-emerald-100 text-emerald-800" },
  { id: "physical", name: "Physical & Coordination", icon: "🏃‍♂️", color: "bg-orange-100 text-orange-800" }
];

// Area descriptions
const areaDescriptions = {
  reading: "Reading comprehension, vocabulary, and enjoyment of books",
  math: "Number sense, mathematical thinking, and problem-solving",
  science: "Scientific inquiry, curiosity, and understanding natural world", 
  logic: "Critical thinking, patterns, and analytical reasoning",
  social: "Emotional intelligence, empathy, and social interactions",
  creativity: "Creative expression, imagination, and artistic abilities",
  language: "Communication skills, vocabulary, and language development",
  physical: "Coordination, movement, and physical development"
};

/**
 * A clean, simplified personalized kid survey component
 * 
 * @param {Function} onClose - Callback when survey is closed
 * @param {string} initialChildId - Initial child ID
 */
const CleanPersonalizedKidSurvey = ({ onClose, initialChildId = null }) => {
  // Context hooks
  const { 
    familyMembers,
    familyId,
    location
  } = useFamily();
  
  // State hooks
  const [activeStep, setActiveStep] = useState(0);
  const [activeChild, setActiveChild] = useState(initialChildId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Survey data
  const [childInterests, setChildInterests] = useState([]);
  const [childEducationalNeeds, setChildEducationalNeeds] = useState({
    strengths: [],
    challenges: [],
    preferences: []
  });
  const [siblingPreferences, setSiblingPreferences] = useState([]);
  const [educationalSelections, setEducationalSelections] = useState({});
  const [recommendations, setRecommendations] = useState({
    gifts: [],
    activities: [],
    educationalResources: [],
    insights: []
  });
  
  // Get active child data
  const activeChildData = useMemo(() => {
    return familyMembers.find(m => m.id === activeChild);
  }, [familyMembers, activeChild]);
  
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
  
  // Load child data when activeChild changes
  useEffect(() => {
    if (familyId && activeChild) {
      loadChildData();
      loadSiblingPreferences();
    }
  }, [familyId, activeChild]);
  
  // Load child data
  const loadChildData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get child interests
      const interests = await childInterestService.getChildInterests(familyId, activeChild);
      setChildInterests(interests);
      
      // If no interests yet, add sample ones for testing
      if (interests.length < 5 && activeChildData) {
        const age = parseInt(activeChildData.age) || 10;
        await childInterestService.addSampleInterests(familyId, activeChild, age);
        const updatedInterests = await childInterestService.getChildInterests(familyId, activeChild);
        setChildInterests(updatedInterests);
      }
      
      // Generate sample educational needs based on age
      if (activeChildData) {
        const age = parseInt(activeChildData.age) || 10;
        
        let needs = { strengths: [], challenges: [], preferences: [] };
        
        if (age <= 5) {
          needs = {
            strengths: ["creativity", "social"],
            challenges: ["language"],
            preferences: ["visual", "hands-on"]
          };
        } else if (age <= 8) {
          needs = {
            strengths: ["reading", "creativity"],
            challenges: ["math"],
            preferences: ["interactive", "visual"]
          };
        } else if (age <= 12) {
          needs = {
            strengths: ["science", "logic"],
            challenges: ["language", "social"],
            preferences: ["interactive", "hands-on"]
          };
        } else {
          needs = {
            strengths: ["logic", "language"],
            challenges: ["creativity"],
            preferences: ["self-directed", "digital"]
          };
        }
        
        setChildEducationalNeeds(needs);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading child data:", error);
      setError("Failed to load child information. Please try again.");
      setIsLoading(false);
    }
  }, [familyId, activeChild, activeChildData]);
  
  // Load sibling preferences
  const loadSiblingPreferences = useCallback(async () => {
    if (!familyId || !activeChild) return;
    
    try {
      // Find siblings of active child
      const siblings = familyMembers.filter(
        member => member.role === 'child' && member.id !== activeChild
      );
      
      // If no siblings, return empty array
      if (siblings.length === 0) {
        setSiblingPreferences([]);
        return;
      }
      
      // Get top interests for each sibling
      const siblingsWithPreferences = await Promise.all(
        siblings.map(async (sibling) => {
          const interests = await childInterestService.getChildInterests(familyId, sibling.id);
          const classifiedInterests = await childInterestService.getClassifiedInterests(familyId, sibling.id);
          
          // Get top interests (loves and top 3 likes)
          const topInterests = [
            ...(classifiedInterests.loves || []),
            ...(classifiedInterests.likes || []).slice(0, 3)
          ];
          
          return {
            siblingId: sibling.id,
            siblingName: sibling.name,
            siblingAge: sibling.age,
            topInterests: topInterests
          };
        })
      );
      
      setSiblingPreferences(siblingsWithPreferences);
    } catch (error) {
      console.error("Error loading sibling preferences:", error);
      // Don't show error to user, just log it
    }
  }, [familyId, activeChild, familyMembers]);
  
  // Handle educational selection
  const handleEducationalSelection = useCallback((areaId, selection) => {
    setEducationalSelections(prev => ({
      ...prev,
      [areaId]: selection
    }));
  }, []);
  
  // Progress to next step
  const handleNext = useCallback(() => {
    setActiveStep(prev => prev + 1);
  }, []);
  
  // Generate recommendations
  const generateRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get base recommendations from service
      const baseRecommendations = await childInterestService.getPersonalizedRecommendations(
        familyId, 
        activeChild
      );
      
      // Extract strengths and challenge areas
      const strengths = [];
      const challenges = [];
      
      Object.entries(educationalSelections).forEach(([areaId, selection]) => {
        if (selection === 'strength') {
          strengths.push(areaId);
        } else if (selection === 'challenge') {
          challenges.push(areaId);
        }
      });
      
      // Generate educational resources
      const educationalResources = generateEducationalResources(
        challenges,
        strengths,
        baseRecommendations.topInterests?.map(i => i.name) || []
      );
      
      // Generate combined insights
      const combinedInsights = [
        ...(baseRecommendations.insights || []),
        ...generateCombinedInsights(
          baseRecommendations.topInterests || [], 
          strengths, 
          challenges
        )
      ];
      
      // Set recommendations
      setRecommendations({
        gifts: baseRecommendations.gifts || [],
        activities: baseRecommendations.activities || [],
        educationalResources,
        insights: combinedInsights
      });
      
      // Proceed to final step
      setActiveStep(4);
      setIsLoading(false);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      setError("There was an error generating recommendations. Please try again.");
      setIsLoading(false);
    }
  }, [familyId, activeChild, educationalSelections]);
  
  // Generate educational resources 
  const generateEducationalResources = useCallback((challenges, strengths, topInterests) => {
    const resources = [];
    
    // Generate resources for each challenge area
    challenges.forEach(challengeArea => {
      // Find a matching educational area
      const area = educationalAreas.find(a => a.id === challengeArea);
      if (!area) return;
      
      // Try to match with a top interest to personalize
      const matchedInterest = topInterests.length > 0 
        ? topInterests[Math.floor(Math.random() * topInterests.length)]
        : "interests";
      
      resources.push({
        id: `resource_${challengeArea}_${Date.now()}`,
        title: `${matchedInterest} ${area.name} Activity`,
        description: `A fun way to build ${area.name} skills using your child's interest in ${matchedInterest}`,
        type: "interactive",
        areaId: challengeArea,
        area: area.name,
        icon: area.icon,
        color: area.color,
        linkText: "Explore activity",
        interestMatch: matchedInterest
      });
      
      // Add a second resource that's more general
      resources.push({
        id: `resource_gen_${challengeArea}_${Date.now()}`,
        title: `${area.name} Building Blocks`,
        description: `Essential activities to help your child develop stronger ${area.name} skills`,
        type: "toolkit",
        areaId: challengeArea,
        area: area.name,
        icon: area.icon,
        color: area.color,
        linkText: "View toolkit",
        interestMatch: null
      });
    });
    
    // Add a few resources that build on strengths
    strengths.slice(0, 2).forEach(strengthArea => {
      // Find a matching educational area
      const area = educationalAreas.find(a => a.id === strengthArea);
      if (!area) return;
      
      resources.push({
        id: `resource_strength_${strengthArea}_${Date.now()}`,
        title: `Advanced ${area.name} Exploration`,
        description: `Activities that build on your child's strengths in ${area.name}`,
        type: "advanced",
        areaId: strengthArea,
        area: area.name,
        icon: area.icon,
        color: area.color,
        linkText: "Explore activities",
        interestMatch: null
      });
    });
    
    return resources;
  }, []);
  
  // Generate insights
  const generateCombinedInsights = useCallback((topInterests, strengths, challenges) => {
    const insights = [];
    
    // Generate insight connecting top interest with a challenge area
    if (topInterests.length > 0 && challenges.length > 0) {
      const topInterest = topInterests[0];
      const challengeArea = educationalAreas.find(a => a.id === challenges[0]);
      
      if (topInterest && challengeArea) {
        insights.push({
          type: "interestEducationConnection",
          title: "Interest-Based Learning",
          description: `Your child's interest in ${topInterest.name} can be a great way to build ${challengeArea.name} skills through engaging activities they'll enjoy.`
        });
      }
    }
    
    // Generate insight about strength-challenge balance
    if (strengths.length > 0 && challenges.length > 0) {
      const strength = educationalAreas.find(a => a.id === strengths[0]);
      const challenge = educationalAreas.find(a => a.id === challenges[0]);
      
      if (strength && challenge) {
        insights.push({
          type: "strengthChallengeBalance",
          title: "Balanced Development",
          description: `Building on your child's strengths in ${strength.name} while supporting growth in ${challenge.name} creates a well-rounded learning experience.`
        });
      }
    }
    
    // Add a sibling-related insight if applicable
    if (siblingPreferences.length > 0) {
      insights.push({
        type: "siblingConnection",
        title: "Sibling Learning Together",
        description: `Consider activities that involve both your children, allowing them to share interests while supporting each other's unique development needs.`
      });
    }
    
    return insights;
  }, [siblingPreferences]);
  
  // Calculate progress percentage
  const calculateProgress = useCallback(() => {
    if (activeStep === 0) return 0;
    if (activeStep === 1) return 25;
    if (activeStep === 2) return 50;
    if (activeStep === 3) {
      const totalAreas = educationalAreas.length;
      const selectedAreas = Object.keys(educationalSelections).length;
      return 50 + ((selectedAreas / totalAreas) * 25);
    }
    if (activeStep === 4) return 100;
    return 0;
  }, [activeStep, educationalSelections]);
  
  // Complete educational assessment
  const completeEducationalAssessment = useCallback(() => {
    generateRecommendations();
  }, [generateRecommendations]);
  
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
        
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg p-4 mb-6 flex items-start">
            <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1 font-roboto">Error</p>
              <p className="text-sm font-roboto">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-700 flex items-center">
            {activeStep === 0 && <span className="flex items-center"><Sparkles size={24} className="text-yellow-500 mr-2" />Personalized Kid Survey</span>}
            {activeStep === 1 && <span className="flex items-center"><Star size={24} className="text-yellow-500 mr-2" />Interest Discovery</span>}
            {activeStep === 2 && <span className="flex items-center"><Check size={24} className="text-green-500 mr-2" />Great Progress!</span>}
            {activeStep === 3 && <span className="flex items-center"><School size={24} className="text-blue-500 mr-2" />Learning Style</span>}
            {activeStep === 4 && <span className="flex items-center"><Trophy size={24} className="text-yellow-500 mr-2" />Personalized Recommendations</span>}
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
        
        {/* Interest Discovery - Step 1 (simplified version for now) */}
        {activeStep === 1 && (
          <div className="text-center py-6">
            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Star size={40} className="text-purple-700" />
            </div>
            
            <h3 className="text-xl font-bold mb-3 text-purple-700">
              Understanding {activeChildData?.name || 'your child'}'s Interests
            </h3>
            
            <p className="text-gray-600 mb-6 max-w-xl mx-auto">
              We've gathered information about your child's interests from previous surveys and activities.
              Let's continue to learn about their learning style.
            </p>
            
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-6 max-w-xl mx-auto">
              <p className="text-blue-700 mb-4">
                We've found {childInterests.length} interests for {activeChildData?.name || 'your child'}, 
                including top categories like toys, games, and characters.
              </p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {childInterests.slice(0, 5).map((interest, index) => (
                  <span key={index} className="bg-white px-3 py-1 rounded-full text-sm border border-blue-200 text-blue-700">
                    {interest.name}
                  </span>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium flex items-center mx-auto shadow-md hover:shadow-lg transition-all"
            >
              Continue to Learning Style
              <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        )}
        
        {/* Transition screen - Step 2 */}
        {activeStep === 2 && (
          <div className="text-center py-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Check size={46} className="text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-3 text-green-600">
              Great progress! Interest information collected!
            </h3>
            
            <p className="text-gray-600 mb-6 text-lg max-w-xl mx-auto">
              Now let's understand how {activeChildData?.name || 'your child'} learns best, so we can
              recommend gifts and activities that support their development.
            </p>
            
            {/* Continue button */}
            <button
              onClick={handleNext}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium text-lg flex items-center mx-auto shadow-md hover:shadow-lg transition-all"
            >
              Continue to Learning Style
              <ArrowRight size={20} className="ml-2" />
            </button>
          </div>
        )}
        
        {/* Educational Assessment - Step 3 */}
        {activeStep === 3 && (
          <div className="py-4">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold mb-3">How does {activeChildData?.name || 'your child'} learn best?</h3>
              <p className="text-gray-600 max-w-xl mx-auto">
                Help us understand your child's learning strengths and challenges. For each area,
                indicate whether it's a strength or an area they need more support with.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {educationalAreas.map(area => (
                <div key={area.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start mb-3">
                    <div className={`rounded-full p-2 mr-3 ${area.color}`}>
                      {area.icon}
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-lg">{area.name}</h4>
                      <p className="text-sm text-gray-600">
                        {areaDescriptions[area.id] || "Skills and abilities in this learning area"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center ${
                        educationalSelections[area.id] === 'strength'
                          ? 'bg-green-600 text-white' 
                          : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                      }`}
                      onClick={() => handleEducationalSelection(area.id, 'strength')}
                    >
                      <ThumbsUp size={16} className="mr-2" />
                      Strength
                    </button>
                    
                    <button
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center ${
                        educationalSelections[area.id] === 'challenge'
                          ? 'bg-orange-600 text-white' 
                          : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                      }`}
                      onClick={() => handleEducationalSelection(area.id, 'challenge')}
                    >
                      <BookOpen size={16} className="mr-2" />
                      Needs Support
                    </button>
                    
                    <button
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center ${
                        educationalSelections[area.id] === 'neutral'
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                      }`}
                      onClick={() => handleEducationalSelection(area.id, 'neutral')}
                    >
                      Average
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Continue button */}
            <div className="text-center">
              <button
                onClick={completeEducationalAssessment}
                disabled={Object.keys(educationalSelections).length < 2 || isLoading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-medium text-lg flex items-center mx-auto shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Recommendations
                <ArrowRight size={20} className="ml-2" />
              </button>
              
              {Object.keys(educationalSelections).length < 2 && (
                <p className="text-orange-600 text-sm mt-2">Please select at least 2 areas to continue</p>
              )}
            </div>
          </div>
        )}
        
        {/* Recommendations - Step 4 */}
        {activeStep === 4 && (
          <div className="py-4">
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold mb-3">Personalized Recommendations for {activeChildData?.name || 'Your Child'}</h3>
              <p className="text-gray-600 max-w-xl mx-auto">
                Based on your child's interests, learning style, and developmental needs, 
                here are personalized recommendations just for them.
              </p>
            </div>
            
            {/* Insights */}
            <div className="mb-8">
              <h4 className="text-lg font-medium text-purple-800 mb-4 flex items-center">
                <Sparkles size={22} className="text-purple-500 mr-2" />
                Personalized Insights
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.insights.map((insight, index) => (
                  <div 
                    key={`insight_${index}`} 
                    className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-100"
                  >
                    <h5 className="font-medium text-purple-800 mb-1">{insight.title}</h5>
                    <p className="text-sm text-purple-700">{insight.description}</p>
                  </div>
                ))}
                
                {recommendations.insights.length === 0 && (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    Complete more surveys to get personalized insights
                  </div>
                )}
              </div>
            </div>
            
            {/* Gift Recommendations */}
            <div className="mb-8">
              <h4 className="text-lg font-medium text-green-800 mb-4 flex items-center">
                <Gift size={22} className="text-green-500 mr-2" />
                Gift Ideas
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.gifts.map((gift, index) => (
                  <div 
                    key={`gift_${index}`}
                    className="border border-green-200 rounded-lg p-4 hover:border-green-400 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start">
                      <div className="rounded-full p-2 mr-2 bg-green-100 text-green-700">
                        <ShoppingBag size={14} />
                      </div>
                      
                      <div className="flex-grow">
                        <h5 className="font-medium">{gift.title}</h5>
                        <p className="text-sm text-gray-600 mb-1">{gift.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                            {gift.priceRange || "$25-50"}
                          </span>
                          {gift.brand && (
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                              {gift.brand}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {recommendations.gifts.length === 0 && (
                  <div className="col-span-3 text-center py-4 text-gray-500">
                    Complete interest surveys to get personalized gift recommendations
                  </div>
                )}
              </div>
            </div>
            
            {/* Educational Resources */}
            <div className="mb-8">
              <h4 className="text-lg font-medium text-blue-800 mb-4 flex items-center">
                <School size={22} className="text-blue-500 mr-2" />
                Educational Resources
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.educationalResources.map((resource, index) => (
                  <div 
                    key={`resource_${index}`}
                    className={`border rounded-lg p-4 hover:shadow-sm transition-all ${
                      resource.areaId === 'reading' ? 'border-blue-200 hover:border-blue-400' :
                      resource.areaId === 'math' ? 'border-purple-200 hover:border-purple-400' :
                      resource.areaId === 'science' ? 'border-green-200 hover:border-green-400' :
                      resource.areaId === 'logic' ? 'border-amber-200 hover:border-amber-400' :
                      resource.areaId === 'social' ? 'border-red-200 hover:border-red-400' :
                      resource.areaId === 'creativity' ? 'border-indigo-200 hover:border-indigo-400' :
                      'border-teal-200 hover:border-teal-400'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`rounded-full p-2 mr-3 ${resource.color}`}>
                        {resource.icon}
                      </div>
                      
                      <div className="flex-grow">
                        <h5 className="font-medium">{resource.title}</h5>
                        <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                            {resource.type}
                          </span>
                          
                          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center">
                            {resource.linkText}
                            <ArrowRight size={14} className="ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {recommendations.educationalResources.length === 0 && (
                  <div className="col-span-2 text-center py-4 text-gray-500">
                    Select learning areas to get educational resource recommendations
                  </div>
                )}
              </div>
            </div>
            
            {/* Finish button */}
            <div className="text-center mt-8">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-medium text-lg flex items-center mx-auto shadow-md hover:shadow-lg transition-all"
              >
                Finish & Save Results
                <Check size={20} className="ml-2" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CleanPersonalizedKidSurvey;