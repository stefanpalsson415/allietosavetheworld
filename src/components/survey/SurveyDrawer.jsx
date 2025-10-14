import React, { useState, useEffect, lazy, Suspense } from 'react';
import { X, ChevronLeft, CheckCircle, Calendar, User } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useSurvey } from '../../contexts/SurveyContext';
import { useSurveyDrawer } from '../../contexts/SurveyDrawerContext';
import SurveyScreen from './SurveyScreen';
import WeeklyCheckInScreen from './WeeklyCheckInScreen';
import UserAvatar from '../common/UserAvatar';

// Lazy load kid survey components
const CleanInterestSurveyModal = lazy(() => import('./CleanInterestSurveyModal'));
const CleanPersonalizedKidSurvey = lazy(() => import('./CleanPersonalizedKidSurvey'));
const AIKidInterestSurvey = lazy(() => import('./AIKidInterestSurvey'));

const SurveyDrawer = () => {
  const { isOpen, surveyType, memberId, closeSurveyDrawer } = useSurveyDrawer();
  const { familyMembers, currentWeek } = useFamily();
  const [selectedSurvey, setSelectedSurvey] = useState(surveyType);
  const [selectedMember, setSelectedMember] = useState(memberId);
  const [showSurveyList, setShowSurveyList] = useState(!surveyType);

  useEffect(() => {
    if (surveyType && memberId) {
      setSelectedSurvey(surveyType);
      setSelectedMember(memberId);
      setShowSurveyList(false);
    }
  }, [surveyType, memberId]);

  const handleBack = () => {
    setShowSurveyList(true);
    setSelectedSurvey(null);
    setSelectedMember(null);
  };

  const handleSelectSurvey = (type, member) => {
    setSelectedSurvey(type);
    setSelectedMember(member);
    setShowSurveyList(false);
  };

  const renderSurveyContent = () => {
    if (showSurveyList) {
      return (
        <div className="h-full flex flex-col">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Select a Survey</h2>
            <p className="text-sm text-gray-600 mt-1">Choose a family member and survey type</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {familyMembers?.map((member) => (
                <div key={member.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <UserAvatar user={member} size={40} />
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Initial Survey */}
                    {!(member.surveyCompleted || member.initialSurveyCompleted) && (
                      <button
                        onClick={() => handleSelectSurvey('initial', member.id)}
                        className="w-full text-left p-3 bg-white rounded-lg border hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">Initial Assessment</span>
                          </div>
                          <ChevronLeft className="w-4 h-4 rotate-180 text-gray-400" />
                        </div>
                      </button>
                    )}
                    
                    {/* Weekly Check-in */}
                    {(member.surveyCompleted || member.initialSurveyCompleted) && currentWeek > 1 && (
                      <button
                        onClick={() => handleSelectSurvey('weekly', member.id)}
                        className="w-full text-left p-3 bg-white rounded-lg border hover:border-green-500 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium">Weekly Check-in</span>
                          </div>
                          <ChevronLeft className="w-4 h-4 rotate-180 text-gray-400" />
                        </div>
                      </button>
                    )}
                    
                    {/* Kid Surveys */}
                    {member.role === 'child' && (
                      <>
                        <button
                          onClick={() => handleSelectSurvey('kid-interest', member.id)}
                          className="w-full text-left p-3 bg-white rounded-lg border hover:border-purple-500 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👍</span>
                              <span className="text-sm font-medium">Interest Survey</span>
                            </div>
                            <ChevronLeft className="w-4 h-4 rotate-180 text-gray-400" />
                          </div>
                        </button>
                        
                        <button
                          onClick={() => handleSelectSurvey('kid-personalized', member.id)}
                          className="w-full text-left p-3 bg-white rounded-lg border hover:border-purple-500 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">🌟</span>
                              <span className="text-sm font-medium">Personalized Discovery</span>
                            </div>
                            <ChevronLeft className="w-4 h-4 rotate-180 text-gray-400" />
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Render specific survey based on selection
    const member = familyMembers?.find(m => m.id === selectedMember);
    
    switch (selectedSurvey) {
      case 'initial':
        return (
          <div className="h-full overflow-y-auto">
            <SurveyScreen />
          </div>
        );
        
      case 'weekly':
        return (
          <div className="h-full overflow-y-auto">
            <WeeklyCheckInScreen onClose={closeSurveyDrawer} />
          </div>
        );
        
      case 'kid-interest':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <AIKidInterestSurvey
              childId={selectedMember}
              onComplete={closeSurveyDrawer}
              onCancel={closeSurveyDrawer}
            />
          </Suspense>
        );
        
      case 'kid-personalized':
        return (
          <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            <CleanPersonalizedKidSurvey
              onClose={closeSurveyDrawer}
              initialChildId={selectedMember}
            />
          </Suspense>
        );
        
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeSurveyDrawer}
      />
      
      {/* Drawer */}
      <div className={`fixed left-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {!showSurveyList && (
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h2 className="text-lg font-semibold">Surveys</h2>
            </div>
            <button
              onClick={closeSurveyDrawer}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {renderSurveyContent()}
          </div>
        </div>
      </div>
    </>
  );
};

export default SurveyDrawer;