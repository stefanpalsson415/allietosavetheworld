// src/components/survey/AdaptiveSurveyDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Award, 
  Users, 
  BarChart3, 
  Target,
  Lightbulb,
  ChevronRight,
  Brain,
  Sparkles,
  Shield
} from 'lucide-react';
import { useAdaptiveSurvey } from '../../hooks/useAdaptiveSurvey';

/**
 * Dashboard component showcasing Phase 2 adaptive survey features
 */
const AdaptiveSurveyDashboard = ({ surveyId, onStartSurvey }) => {
  const {
    isLoading,
    error,
    progressLevel,
    effectiveness,
    crossFamilyInsights,
    getFormattedInsights,
    analyzeQuestionEffectiveness,
    getCrossFamilyInsights
  } = useAdaptiveSurvey();

  const [activeTab, setActiveTab] = useState('progress');
  const insights = getFormattedInsights();

  // Load data on mount
  useEffect(() => {
    if (surveyId) {
      analyzeQuestionEffectiveness(surveyId);
    }
    getCrossFamilyInsights('all');
  }, [surveyId, analyzeQuestionEffectiveness, getCrossFamilyInsights]);

  const renderProgressTab = () => {
    if (!progressLevel) return <LoadingState />;

    const levelNames = {
      1: 'Awareness',
      2: 'Recognition', 
      3: 'Planning',
      4: 'Implementation',
      5: 'Optimization'
    };

    const levelDescriptions = {
      1: 'Discovering current patterns and building awareness',
      2: 'Recognizing imbalances and their impact on your family',
      3: 'Planning strategic changes to improve balance',
      4: 'Implementing changes and tracking progress',
      5: 'Optimizing for long-term sustainability'
    };

    return (
      <div className="space-y-6">
        {/* Current Level */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Your Survey Journey</h3>
            <Award className="w-6 h-6 text-purple-600" />
          </div>
          
          <div className="mb-4">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-3xl">{getProgressIcon(progressLevel.currentLevel)}</span>
              <div>
                <p className="text-xl font-bold">
                  Level {progressLevel.currentLevel}: {levelNames[progressLevel.currentLevel]}
                </p>
                <p className="text-sm text-gray-600">
                  {levelDescriptions[progressLevel.currentLevel]}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress to Next Level</span>
              <span>{progressLevel.readyToProgress ? 'Ready!' : `${Math.round((progressLevel.averageAccuracy / 100) * 100)}%`}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${progressLevel.readyToProgress ? 100 : (progressLevel.averageAccuracy || 0)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{progressLevel.surveysCompleted}</p>
              <p className="text-sm text-gray-600">Surveys</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{progressLevel.averageAccuracy?.toFixed(0)}%</p>
              <p className="text-sm text-gray-600">Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {progressLevel.improvementRate > 0 ? '+' : ''}{progressLevel.improvementRate}
              </p>
              <p className="text-sm text-gray-600">Growth</p>
            </div>
          </div>
        </div>

        {/* Strengths & Challenges */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">Strengths</h4>
            <ul className="space-y-1">
              {progressLevel.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-green-700 flex items-center">
                  <CheckIcon className="w-4 h-4 mr-2" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="font-semibold text-orange-800 mb-2">Focus Areas</h4>
            <ul className="space-y-1">
              {progressLevel.challenges.map((challenge, idx) => (
                <li key={idx} className="text-sm text-orange-700 flex items-center">
                  <Target className="w-4 h-4 mr-2" />
                  {challenge}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Level-Up Call to Action */}
        {progressLevel.readyToProgress && (
          <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-1">Ready to Level Up! 🎉</h3>
                <p className="text-green-50">
                  Your next survey will include {levelNames[progressLevel.currentLevel + 1]} questions
                </p>
              </div>
              <button
                onClick={onStartSurvey}
                className="bg-white text-green-600 px-4 py-2 rounded-lg font-semibold hover:bg-green-50 transition"
              >
                Start Survey
                <ChevronRight className="inline w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEffectivenessTab = () => {
    if (!effectiveness) return <LoadingState />;

    return (
      <div className="space-y-6">
        {/* Top Performing Questions */}
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-purple-600" />
            Questions That Drive Change
          </h3>
          
          <div className="space-y-3">
            {effectiveness.topPerformers.map((question, idx) => (
              <div key={idx} className="border-l-4 border-purple-500 pl-4 py-2">
                <p className="font-medium text-sm">{question.text}</p>
                <div className="flex items-center mt-1 space-x-4">
                  <span className="text-xs text-gray-600">{question.category}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    question.impact === 'high' ? 'bg-green-100 text-green-800' :
                    question.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {question.impact} impact
                  </span>
                  <span className="text-xs text-purple-600 font-semibold">
                    Score: {question.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pattern Insights */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Brain className="w-5 h-5 mr-2 text-blue-600" />
            Effectiveness Patterns
          </h3>
          
          <div className="space-y-3">
            {effectiveness.insights.map((insight, idx) => (
              <div key={idx} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  insight.impact === 'positive' ? 'bg-green-500' :
                  insight.impact === 'concern' ? 'bg-red-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{insight.message}</p>
                  {insight.recommendation && (
                    <p className="text-sm text-gray-600 mt-1">
                      💡 {insight.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Effectiveness */}
        {effectiveness.patterns?.categoryEffectiveness && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">Category Effectiveness</h3>
            <div className="space-y-3">
              {Object.entries(effectiveness.patterns.categoryEffectiveness).map(([category, data]) => (
                <div key={category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{category}</span>
                    <span className="text-sm text-gray-600">
                      {data.effectivenessRate}% effective
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        parseFloat(data.effectivenessRate) > 70 ? 'bg-green-500' :
                        parseFloat(data.effectivenessRate) > 40 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${data.effectivenessRate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCommunityTab = () => {
    if (!crossFamilyInsights || !crossFamilyInsights.available) {
      return (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Building Community Insights</h3>
          <p className="text-gray-600">
            We need more families to participate before we can share anonymized insights.
            Your data is helping build this knowledge base!
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Required: {crossFamilyInsights.minimumRequired || 5} families • 
            Current: {crossFamilyInsights.currentCount || 0}
          </div>
        </div>
      );
    }

    const { insights } = crossFamilyInsights;

    return (
      <div className="space-y-6">
        {/* Privacy Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-blue-900">Your Privacy is Protected</p>
              <p className="text-blue-800 mt-1">
                All insights are anonymized and aggregated from {crossFamilyInsights.basedOnFamilies} similar families.
                No individual family data is ever shared.
              </p>
            </div>
          </div>
        </div>

        {/* Common Patterns */}
        {insights.patterns && Object.keys(insights.patterns).length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
              Common Patterns in Similar Families
            </h3>
            
            <div className="space-y-3">
              {Object.entries(insights.patterns).slice(0, 5).map(([pattern, data]) => (
                <div key={pattern} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium capitalize">
                    {pattern.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      {data.prevalence} of families
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      data.confidence === 'high' ? 'bg-green-100 text-green-800' :
                      data.confidence === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {data.confidence} confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations from Community */}
        {insights.recommendations && insights.recommendations.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2 text-purple-600" />
              What Works for Similar Families
            </h3>
            
            <div className="space-y-3">
              {insights.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    rec.strength === 'strong' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">
                      {rec.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {rec.supportedByFamilies} found this helpful
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Challenges */}
        {insights.commonChallenges && insights.commonChallenges.length > 0 && (
          <div className="bg-orange-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Common Challenges</h3>
            <p className="text-sm text-gray-600 mb-3">You're not alone in facing these:</p>
            <div className="space-y-2">
              {insights.commonChallenges.map((challenge, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{challenge.type.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-orange-700">{challenge.frequency}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const CheckIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );

  const LoadingState = () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
    </div>
  );

  const getProgressIcon = (level) => {
    const icons = {
      1: '🌱',
      2: '🌿',
      3: '🌳',
      4: '🎯',
      5: '🏆'
    };
    return icons[level] || '❓';
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-semibold">Error loading adaptive features</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Adaptive Survey Intelligence</h2>
        <p className="text-gray-600 mt-1">
          Your surveys evolve with your family's journey
        </p>
      </div>

      {/* Insights Summary */}
      {insights.length > 0 && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {insights.slice(0, 3).map((insight, idx) => (
            <div key={idx} className="bg-white rounded-lg border p-4">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{insight.icon}</span>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${insight.color}`}>
                    {insight.title}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b">
          <div className="flex space-x-1 p-1">
            <button
              onClick={() => setActiveTab('progress')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'progress'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Progress
            </button>
            <button
              onClick={() => setActiveTab('effectiveness')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'effectiveness'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Effectiveness
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'community'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              Community
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <LoadingState />
          ) : (
            <>
              {activeTab === 'progress' && renderProgressTab()}
              {activeTab === 'effectiveness' && renderEffectivenessTab()}
              {activeTab === 'community' && renderCommunityTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdaptiveSurveyDashboard;