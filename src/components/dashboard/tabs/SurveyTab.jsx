// src/components/dashboard/tabs/SurveyTab.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../../contexts/FamilyContext';
import { useSurvey } from '../../../contexts/SurveyContext';
import SurveyScreen from '../../survey/SurveyScreen';
import WeeklyCheckInScreen from '../../survey/WeeklyCheckInScreen';
import CleanInterestSurveyModal from '../../survey/CleanInterestSurveyModal';
import CleanPersonalizedKidSurvey from '../../survey/CleanPersonalizedKidSurvey';
import { ChevronLeft, Users, ClipboardList, CheckCircle, Circle, Clock, ChevronRight, Award, Check, Calendar, Target, TrendingUp, BarChart3, Sparkles, ThumbsUp, Gift, School, Star, Heart } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import DatabaseService from '../../../services/DatabaseService';
import ChildInterestService from '../../../services/ChildInterestService';

const SurveyTab = () => {
  const { 
    selectedUser, 
    familyMembers, 
    familyId,
    currentWeek, 
    surveySchedule,
    weekStatus,
    surveyResponses 
  } = useFamily();
  const { surveyType } = useSurvey();
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyHistory, setSurveyHistory] = useState([]);
  const [nextSurveyDate, setNextSurveyDate] = useState(null);
  const [isInitialSurveyComplete, setIsInitialSurveyComplete] = useState(false);
  
  // Kid survey states
  const [showKidInterestSurvey, setShowKidInterestSurvey] = useState(false);
  const [showPersonalizedKidSurvey, setShowPersonalizedKidSurvey] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState(null);
  const [childSurveyData, setChildSurveyData] = useState({});
  const [childInterests, setChildInterests] = useState({});
  
  // Load survey history and check completion status
  useEffect(() => {
    const loadSurveyData = async () => {
      if (!familyId) return;
      
      try {
        // Check if initial survey is complete
        const initialComplete = familyMembers?.every(member => 
          member.surveyCompleted || member.initialSurveyCompleted
        ) || false;
        setIsInitialSurveyComplete(initialComplete);
        
        // Load survey history
        const history = await DatabaseService.getSurveyHistory(familyId);
        setSurveyHistory(history || []);
        
        // Calculate next survey date based on current cycle
        if (currentWeek > 1) {
          // Each cycle is typically 7-14 days
          const daysPerCycle = 7; // This could be configurable
          const nextDate = addDays(new Date(), daysPerCycle);
          setNextSurveyDate(nextDate);
        }
      } catch (error) {
        console.error('Error loading survey data:', error);
      }
    };
    
    loadSurveyData();
  }, [familyId, familyMembers, currentWeek]);
  
  // Load child survey data when family changes
  useEffect(() => {
    const loadChildSurveyData = async () => {
      if (!familyId) return;
      
      try {
        const children = familyMembers?.filter(m => m.role === 'child') || [];
        const surveyData = {};
        const interestsData = {};
        
        for (const child of children) {
          // Get child interests and survey status
          const interests = await ChildInterestService.getChildInterests(familyId, child.id);
          const classified = await ChildInterestService.getClassifiedInterests(familyId, child.id);
          
          interestsData[child.id] = {
            interests,
            classified,
            totalComparisons: interests.reduce((sum, i) => sum + (i.comparisons || 0), 0)
          };
          
          // Check if child has completed surveys
          surveyData[child.id] = {
            hasInterestSurvey: interests.length > 0 && interests.some(i => i.comparisons > 0),
            hasPersonalizedSurvey: child.personalizedSurveyCompleted || false,
            lastSurveyDate: child.lastSurveyDate || null
          };
        }
        
        setChildSurveyData(surveyData);
        setChildInterests(interestsData);
      } catch (error) {
        console.error('Error loading child survey data:', error);
      }
    };
    
    loadChildSurveyData();
  }, [familyId, familyMembers]);
  
  const handleStartSurvey = () => {
    setShowSurvey(true);
  };
  
  const handleCloseSurvey = () => {
    setShowSurvey(false);
  };
  
  // Kid survey handlers
  const handleStartKidInterestSurvey = (childId) => {
    setSelectedChildId(childId);
    setShowKidInterestSurvey(true);
  };
  
  const handleStartPersonalizedKidSurvey = (childId) => {
    setSelectedChildId(childId);
    setShowPersonalizedKidSurvey(true);
  };
  
  const handleCloseKidSurveys = () => {
    setShowKidInterestSurvey(false);
    setShowPersonalizedKidSurvey(false);
    setSelectedChildId(null);
    
    // Reload child data after survey completion
    const loadChildData = async () => {
      if (!familyId) return;
      
      try {
        const children = familyMembers?.filter(m => m.role === 'child') || [];
        const interestsData = {};
        
        for (const child of children) {
          const interests = await ChildInterestService.getChildInterests(familyId, child.id);
          const classified = await ChildInterestService.getClassifiedInterests(familyId, child.id);
          
          interestsData[child.id] = {
            interests,
            classified,
            totalComparisons: interests.reduce((sum, i) => sum + (i.comparisons || 0), 0)
          };
        }
        
        setChildInterests(interestsData);
      } catch (error) {
        console.error('Error reloading child data:', error);
      }
    };
    
    loadChildData();
  };
  
  const handleKidInterestSurveyComplete = async (results) => {
    // The CleanInterestSurveyModal will handle saving to the database
    // We just need to close the modal and refresh data
    handleCloseKidSurveys();
  };
  
  // Get interest pairs for kid survey
  const getInterestPairsForChild = (childId) => {
    const childData = childInterests[childId];
    if (!childData || !childData.interests || childData.interests.length < 2) {
      return [];
    }
    
    // Generate pairs from interests
    const interests = childData.interests;
    const pairs = [];
    
    // Create all possible pairs
    for (let i = 0; i < interests.length; i++) {
      for (let j = i + 1; j < interests.length; j++) {
        pairs.push([interests[i], interests[j]]);
      }
    }
    
    // Shuffle and limit to 10 pairs for a quick survey
    return pairs.sort(() => Math.random() - 0.5).slice(0, 10);
  };
  
  // Get selected child data
  const getSelectedChild = () => {
    return familyMembers?.find(m => m.id === selectedChildId);
  };
  
  // Check if current user is a child
  const isChildUser = selectedUser?.role === 'child';
  
  // Determine which survey to show
  if (showSurvey) {
    if (currentWeek === 1 && !isInitialSurveyComplete) {
      return <SurveyScreen />;
    } else {
      return <WeeklyCheckInScreen onClose={handleCloseSurvey} />;
    }
  }
  
  // Show kid interest survey modal
  if (showKidInterestSurvey && selectedChildId) {
    const selectedChild = getSelectedChild();
    const interestPairs = getInterestPairsForChild(selectedChildId);
    
    return (
      <CleanInterestSurveyModal
        interestPairs={interestPairs}
        onComplete={handleKidInterestSurveyComplete}
        onCancel={handleCloseKidSurveys}
        childName={selectedChild?.name}
        childId={selectedChildId}
        questionPrompts={[
          `Which one does ${selectedChild?.name} like more?`,
          `What's more fun for ${selectedChild?.name}?`,
          `Which would ${selectedChild?.name} choose?`,
          `What interests ${selectedChild?.name} more?`,
          `Which one makes ${selectedChild?.name} happier?`
        ]}
      />
    );
  }
  
  // Show personalized kid survey modal
  if (showPersonalizedKidSurvey && selectedChildId) {
    return (
      <CleanPersonalizedKidSurvey
        onClose={handleCloseKidSurveys}
        initialChildId={selectedChildId}
      />
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Notion-style header */}
        <div className="mb-12">
          <h1 className="text-[40px] font-bold text-[#37352F] mb-3">📋 Surveys</h1>
          <p className="text-lg text-[#37352F]/60">
            {isChildUser 
              ? "Discover interests and create personalized gift ideas"
              : "Build a personalized family workload balance through quick assessments"
            }
          </p>
        </div>
      
        {/* Current Survey Card - Dynamic based on user type */}
        <div className="mb-8">
          {isChildUser ? (
            // Kid Survey Options
            <div className="space-y-4">
              {/* Quick Interest Survey Card */}
              <div className="group cursor-pointer" onClick={() => handleStartKidInterestSurvey(selectedUser.id)}>
                <div className="p-6 border border-[#E3E2E0] rounded-lg hover:shadow-lg transition-all duration-200 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="text-2xl mr-3">👍</div>
                        <div>
                          <h2 className="text-xl font-semibold text-[#37352F]">Quick Interest Survey</h2>
                          <p className="text-sm text-[#37352F]/60 mt-1">Discover what you love with fun thumbs up/down choices</p>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex items-center space-x-4 mt-4">
                        {childSurveyData[selectedUser?.id]?.hasInterestSurvey ? (
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle size={16} />
                            <span className="text-sm font-medium">
                              {childInterests[selectedUser?.id]?.totalComparisons || 0} comparisons made
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-amber-600">
                            <Sparkles size={16} />
                            <span className="text-sm font-medium">5 minutes of fun!</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-6 flex items-center">
                      <div className="px-4 py-2 bg-[#F7F7F5] group-hover:bg-[#37352F] text-[#37352F] group-hover:text-white rounded-md transition-all duration-200 flex items-center">
                        {childInterests[selectedUser?.id]?.interests?.length >= 2 ? 'Continue' : 'Start'} Survey
                        <ChevronRight size={16} className="ml-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Personalized Discovery Survey Card */}
              <div className="group cursor-pointer" onClick={() => handleStartPersonalizedKidSurvey(selectedUser.id)}>
                <div className="p-6 border border-[#E3E2E0] rounded-lg hover:shadow-lg transition-all duration-200 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className="text-2xl mr-3">🌟</div>
                        <div>
                          <h2 className="text-xl font-semibold text-[#37352F]">Personalized Discovery</h2>
                          <p className="text-sm text-[#37352F]/60 mt-1">Deep dive into your interests and learning style for perfect gift ideas</p>
                        </div>
                      </div>
                      
                      {/* Status Badge */}
                      <div className="flex items-center space-x-4 mt-4">
                        {childSurveyData[selectedUser?.id]?.hasPersonalizedSurvey ? (
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle size={16} />
                            <span className="text-sm font-medium">Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-purple-600">
                            <Star size={16} />
                            <span className="text-sm font-medium">10 minutes - Get personalized recommendations!</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-6 flex items-center">
                      <div className="px-4 py-2 bg-purple-100 group-hover:bg-purple-600 text-purple-700 group-hover:text-white rounded-md transition-all duration-200 flex items-center">
                        Explore
                        <ChevronRight size={16} className="ml-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Interest Results Summary */}
              {childInterests[selectedUser?.id]?.classified && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-100">
                  <h3 className="text-lg font-semibold text-[#37352F] mb-4 flex items-center">
                    <Gift size={20} className="mr-2 text-purple-600" />
                    Your Interest Profile
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Loves */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-medium text-green-700 mb-2 flex items-center">
                        <Heart size={16} className="mr-1" />
                        You Love
                      </h4>
                      <div className="space-y-1">
                        {childInterests[selectedUser?.id]?.classified.loves?.slice(0, 3).map((interest, idx) => (
                          <div key={idx} className="text-sm text-gray-700">{interest.name}</div>
                        )) || <div className="text-sm text-gray-500">Take surveys to discover!</div>}
                      </div>
                    </div>
                    
                    {/* Likes */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-medium text-blue-700 mb-2 flex items-center">
                        <ThumbsUp size={16} className="mr-1" />
                        You Like
                      </h4>
                      <div className="space-y-1">
                        {childInterests[selectedUser?.id]?.classified.likes?.slice(0, 3).map((interest, idx) => (
                          <div key={idx} className="text-sm text-gray-700">{interest.name}</div>
                        )) || <div className="text-sm text-gray-500">More to explore!</div>}
                      </div>
                    </div>
                    
                    {/* Gift Ideas Ready */}
                    <div className="bg-white p-4 rounded-lg">
                      <h4 className="font-medium text-purple-700 mb-2 flex items-center">
                        <Sparkles size={16} className="mr-1" />
                        Gift Ideas Status
                      </h4>
                      <div className="text-sm">
                        {childInterests[selectedUser?.id]?.totalComparisons >= 10 ? (
                          <span className="text-green-600 font-medium">✓ Ready for parents!</span>
                        ) : (
                          <span className="text-amber-600">
                            {10 - (childInterests[selectedUser?.id]?.totalComparisons || 0)} more comparisons needed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (currentWeek === 1 && !isInitialSurveyComplete) ? (
            // Initial Assessment Card
            <div className="group cursor-pointer" onClick={handleStartSurvey}>
              <div className="p-6 border border-[#E3E2E0] rounded-lg hover:shadow-lg transition-all duration-200 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="text-2xl mr-3">🎯</div>
                      <div>
                        <h2 className="text-xl font-semibold text-[#37352F]">Initial Family Assessment</h2>
                        <p className="text-sm text-[#37352F]/60 mt-1">Get personalized recommendations based on your family's unique dynamics</p>
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div className="flex items-center space-x-4 mt-4">
                      {selectedUser?.surveyCompleted ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckCircle size={16} />
                          <span className="text-sm font-medium">Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-amber-600">
                          <Clock size={16} />
                          <span className="text-sm font-medium">10 minutes to complete</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-6 flex items-center">
                    <div className="px-4 py-2 bg-[#F7F7F5] group-hover:bg-[#37352F] text-[#37352F] group-hover:text-white rounded-md transition-all duration-200 flex items-center">
                      {selectedUser?.surveyCompleted ? 'Retake' : 'Start'} Survey
                      <ChevronRight size={16} className="ml-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Between Cycles Card
            <div className="space-y-4">
              {/* Current Cycle Status */}
              <div className="p-6 border border-[#E3E2E0] rounded-lg bg-[#F7F7F5]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className="text-2xl mr-3">📊</div>
                      <div>
                        <h2 className="text-xl font-semibold text-[#37352F]">Cycle {currentWeek} Progress</h2>
                        <p className="text-sm text-[#37352F]/60 mt-1">You're currently in Family Cycle {currentWeek}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Target size={16} className="text-[#37352F]/60" />
                          <span className="text-sm font-medium text-[#37352F]/60">Current Focus</span>
                        </div>
                        <p className="text-[#37352F] font-medium">
                          {currentWeek <= 7 ? 'Building Habits' : 
                           currentWeek <= 14 ? 'Refining Balance' : 
                           'Maintaining Progress'}
                        </p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar size={16} className="text-[#37352F]/60" />
                          <span className="text-sm font-medium text-[#37352F]/60">Next Survey</span>
                        </div>
                        <p className="text-[#37352F] font-medium">
                          {nextSurveyDate ? (
                            <>
                              {format(nextSurveyDate, 'MMM d')}
                              <span className="text-sm text-[#37352F]/60 ml-1">
                                ({differenceInDays(nextSurveyDate, new Date())} days)
                              </span>
                            </>
                          ) : (
                            'Coming Soon'
                          )}
                        </p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp size={16} className="text-[#37352F]/60" />
                          <span className="text-sm font-medium text-[#37352F]/60">Surveys Completed</span>
                        </div>
                        <p className="text-[#37352F] font-medium">{surveyHistory.length || currentWeek - 1}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Take Weekly Check-in Button (if available) */}
              {weekStatus?.[currentWeek]?.step >= 2 && !weekStatus?.[currentWeek]?.surveyCompleted && (
                <div className="group cursor-pointer" onClick={handleStartSurvey}>
                  <div className="p-6 border border-[#E3E2E0] rounded-lg hover:shadow-lg transition-all duration-200 bg-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <div className="text-2xl mr-3">📝</div>
                          <div>
                            <h3 className="text-lg font-semibold text-[#37352F]">Weekly Check-In Available</h3>
                            <p className="text-sm text-[#37352F]/60 mt-1">Share your perspective on this week's progress</p>
                          </div>
                        </div>
                      </div>
                      <div className="ml-6 flex items-center">
                        <div className="px-4 py-2 bg-[#37352F] text-white rounded-md flex items-center">
                          Take Check-In
                          <ChevronRight size={16} className="ml-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Family Overview Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[#37352F] mb-4">
            {isChildUser ? 'Your Surveys' : 'Family Survey Progress'}
          </h3>
          
          {isChildUser ? (
            // Show only current child's data
            <div className="bg-white p-6 rounded-lg border border-[#E3E2E0]">
              <div className="text-center">
                <h4 className="font-medium text-[#37352F] mb-2">Your Survey History</h4>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Interest Comparisons</span>
                    <span className="text-sm text-[#37352F]/60">
                      {childInterests[selectedUser?.id]?.totalComparisons || 0} completed
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span className="text-sm font-medium">Personalized Survey</span>
                    <span className="text-sm text-[#37352F]/60">
                      {childSurveyData[selectedUser?.id]?.hasPersonalizedSurvey ? '✓ Completed' : 'Not started'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Show all family members with enhanced child data for parents
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {familyMembers?.map((member) => {
                const isCompleted = member.surveyCompleted || member.initialSurveyCompleted;
                const isCurrentUser = member.id === selectedUser?.id;
                const isChild = member.role === 'child';
                
                return (
                  <div 
                    key={member.id} 
                    className={`p-4 border rounded-lg transition-all ${
                      isCurrentUser 
                        ? 'border-[#37352F] bg-[#F7F7F5]' 
                        : 'border-[#E3E2E0] bg-white hover:shadow-sm'
                    } ${isChild && !isCurrentUser ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (isChild && !isCurrentUser) {
                        // Allow parents to start surveys for their children
                        handleStartPersonalizedKidSurvey(member.id);
                      }
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {member.profilePictureUrl ? (
                          <img 
                            src={member.profilePictureUrl} 
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-[#E3E2E0] flex items-center justify-center">
                            <span className="text-sm font-semibold text-[#37352F]/60">
                              {member.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {(isCompleted || (isChild && childSurveyData[member.id]?.hasInterestSurvey)) && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check size={12} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-[#37352F]">{member.name}</div>
                        <div className="text-xs text-[#37352F]/60 capitalize">{member.role}</div>
                      </div>
                      {isCurrentUser && (
                        <div className="px-2 py-1 bg-[#37352F] text-white text-xs rounded">You</div>
                      )}
                    </div>
                    
                    <div className="mt-3 text-sm">
                      {isChild ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#37352F]/60">Interests:</span>
                            <span className="text-xs font-medium">
                              {childInterests[member.id]?.interests?.length || 0} tracked
                            </span>
                          </div>
                          {childInterests[member.id]?.totalComparisons > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[#37352F]/60">Comparisons:</span>
                              <span className="text-xs font-medium text-green-600">
                                {childInterests[member.id]?.totalComparisons}
                              </span>
                            </div>
                          )}
                          {!isCurrentUser && (
                            <div className="text-xs text-blue-600 mt-2">Click to manage →</div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {isCompleted ? (
                            <div className="text-green-600">✓ Completed</div>
                          ) : (
                            <div className="text-[#37352F]/40">Not started</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Insights from Last Survey */}
        {currentWeek > 1 && surveyResponses && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#37352F] mb-4">Insights from Your Journey</h3>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">💡</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[#37352F] mb-2">Key Findings</h4>
                  <ul className="space-y-2 text-sm text-[#37352F]/70">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      Your family has completed {currentWeek - 1} cycles of habit building
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      Continue practicing your current habits until the next check-in
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">•</span>
                      Allie is learning from your progress to suggest better habits each cycle
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Past Survey Results (if any) */}
        {surveyHistory.length > 0 && currentWeek > 1 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#37352F] mb-4">Survey History</h3>
            <div className="space-y-3">
              {surveyHistory.slice(0, 3).map((survey, index) => (
                <div key={survey.id || index} className="p-4 border border-[#E3E2E0] rounded-lg bg-white hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#F7F7F5] rounded-full flex items-center justify-center">
                        <BarChart3 size={20} className="text-[#37352F]/60" />
                      </div>
                      <div>
                        <div className="font-medium text-[#37352F]">
                          Cycle {survey.cycle || index + 1} Survey
                        </div>
                        <div className="text-sm text-[#37352F]/60">
                          Completed {survey.completedDate ? format(new Date(survey.completedDate), 'MMM d, yyyy') : 'Recently'}
                        </div>
                      </div>
                    </div>
                    <CheckCircle size={20} className="text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* What to Expect / How It Works */}
        <div className="bg-[#F7F7F5] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#37352F] mb-4">
            {isChildUser ? 'How Gift Surveys Work' : (currentWeek === 1 && !isInitialSurveyComplete) ? 'What to expect' : 'How the cycle works'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {isChildUser ? (
              <>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">👍</div>
                  <div>
                    <div className="font-medium text-[#37352F] mb-1">Quick Choices</div>
                    <p className="text-sm text-[#37352F]/60">Compare things you might like with simple thumbs up/down</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <div className="font-medium text-[#37352F] mb-1">Learn Your Style</div>
                    <p className="text-sm text-[#37352F]/60">Discover how you learn best and what activities you enjoy</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🎁</div>
                  <div>
                    <div className="font-medium text-[#37352F] mb-1">Perfect Gifts</div>
                    <p className="text-sm text-[#37352F]/60">Help your parents find gifts and activities you'll love</p>
                  </div>
                </div>
              </>
            ) : (currentWeek === 1 && !isInitialSurveyComplete) ? (
              <>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">⏱️</div>
                  <div>
                    <div className="font-medium text-[#37352F] mb-1">Quick & Easy</div>
                    <p className="text-sm text-[#37352F]/60">Complete in just 10 minutes with simple questions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <div className="font-medium text-[#37352F] mb-1">Personalized</div>
                    <p className="text-sm text-[#37352F]/60">Questions adapt to your family's unique situation</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">📊</div>
                  <div>
                    <div className="font-medium text-[#37352F] mb-1">Instant Insights</div>
                    <p className="text-sm text-[#37352F]/60">See your family balance projection in real-time</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🔄</div>
                  <div>
                    <div className="font-medium text-[#37352F] mb-1">Build Habits</div>
                    <p className="text-sm text-[#37352F]/60">Practice new habits for 5-7 days with your family</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">📝</div>
                  <div>
                    <div className="font-medium text-[#37352F] mb-1">Check Progress</div>
                    <p className="text-sm text-[#37352F]/60">Take a quick survey to see what's working</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">🎯</div>
                  <div>
                    <div className="font-medium text-[#37352F] mb-1">Refine & Improve</div>
                    <p className="text-sm text-[#37352F]/60">Get new habits based on your family's progress</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurveyTab;