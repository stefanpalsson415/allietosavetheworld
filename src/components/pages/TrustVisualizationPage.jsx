// src/components/pages/TrustVisualizationPage.jsx
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import TrustVisualization from '../home/TrustVisualization';

const TrustVisualizationPage = () => {
  const { currentUser } = useAuth();
  const { familyMembers } = useFamily();

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              Trust & Transparency Report
            </h1>
            <div className="w-24" /> {/* Spacer for centering */}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
        <TrustVisualization 
          familyData={{
            id: currentUser?.uid,
            daysActive: Math.floor((new Date() - new Date(currentUser?.metadata?.creationTime || Date.now())) / (1000 * 60 * 60 * 24)),
            familyMembers: familyMembers,
            children: familyMembers?.filter(m => m.role === 'child'),
            location: 'United States' // This would come from family profile
          }}
          surveyStats={{
            surveysCompleted: 12, // This would come from survey context
            averageAccuracy: 85,
            lastSurveyDate: new Date()
          }}
          aiInteractions={{
            questionsAsked: 342,
            sourcesCited: 156,
            explanationsProvided: 89,
            auditTrailAccessed: 23,
            avgResponseTime: '8 seconds',
            personalizationScore: 92,
            followUpRate: 87
          }}
        />
      </div>
    </div>
  );
};

export default TrustVisualizationPage;