import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, ChevronRight, User, Star, TrendingUp } from 'lucide-react';
import { useSurvey } from '../../../contexts/SurveyContext';
import { useFamily } from '../../../contexts/FamilyContext';
import UserAvatar from '../../common/UserAvatar';
import DatabaseService from '../../../services/DatabaseService';

const NotionSurveyTab = () => {
  const [surveyHistory, setSurveyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const { familyId, familyMembers, currentWeek } = useFamily();
  const { startSurvey } = useSurvey();

  const surveyTypes = [
    { 
      id: 'initial', 
      name: 'Initial Assessment', 
      description: 'Get personalized recommendations based on your family\'s unique dynamics',
      color: 'bg-blue-100 text-blue-700',
      icon: Calendar,
      frequency: 'One-time'
    },
    { 
      id: 'weekly-checkin', 
      name: 'Weekly Check-in', 
      description: 'Quick weekly emotional and relationship check-in',
      color: 'bg-green-100 text-green-700',
      icon: CheckCircle,
      frequency: 'Weekly'
    }
  ];

  useEffect(() => {
    const loadSurveyData = async () => {
      if (!familyId) return;
      
      try {
        // Load survey history using existing service
        const history = await DatabaseService.getSurveyHistory(familyId);
        setSurveyHistory(history || []);
      } catch (error) {
        console.error('Error loading survey data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSurveyData();
  }, [familyId]);

  const getMemberSurveyStatus = (member) => {
    // Check if member has completed initial survey
    return member.surveyCompleted || member.initialSurveyCompleted || false;
  };

  const handleStartSurvey = (member) => {
    // For now, start the initial survey if not completed
    if (!getMemberSurveyStatus(member)) {
      startSurvey('initial', member.id);
    } else {
      startSurvey('weekly-checkin', member.id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Family Survey Library</h2>

        {/* Family Members Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {familyMembers?.map((member) => {
            const hasCompletedInitial = getMemberSurveyStatus(member);
            
            return (
              <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Member Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <UserAvatar user={member} size="large" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-sm text-gray-500">{member.role || 'Family Member'}</p>
                    </div>
                    {hasCompletedInitial && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">Active</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Survey Status */}
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Initial Survey Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Initial Assessment</h4>
                          <p className="text-sm text-gray-500">
                            {hasCompletedInitial ? 'Completed' : 'Not started'}
                          </p>
                        </div>
                      </div>
                      {hasCompletedInitial ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <button
                          onClick={() => handleStartSurvey(member)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Start
                        </button>
                      )}
                    </div>

                    {/* Weekly Check-in Status (only show if initial is complete) */}
                    {hasCompletedInitial && currentWeek > 1 && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-100 text-green-700">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">Weekly Check-in</h4>
                            <p className="text-sm text-gray-500">Cycle {currentWeek}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartSurvey(member)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          Check In
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Member Progress */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-900">
                        {hasCompletedInitial ? `Cycle ${currentWeek || 1}` : 'Getting Started'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {(!familyMembers || familyMembers.length === 0) && !loading && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No family members yet</h3>
            <p className="text-gray-500">Waiting for family data to load...</p>
          </div>
        )}

        {/* Survey History Summary */}
        {surveyHistory.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Survey Activity</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {surveyHistory.length} surveys completed
                  </p>
                  <p className="text-sm text-gray-500">
                    Keep up the great work on your family journey!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotionSurveyTab;