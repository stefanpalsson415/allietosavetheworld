// src/components/survey/CorrelationInsightsDisplay.jsx
import React from 'react';
import { AlertCircle, CheckCircle, TrendingUp, Eye, Users, Target } from 'lucide-react';

/**
 * Component to display survey-task correlation insights
 * Shows how well survey responses match actual task completion
 */
const CorrelationInsightsDisplay = ({ correlationData, onClose }) => {
  if (!correlationData) return null;

  const insights = correlationData.getFormattedInsights();
  if (!insights) return null;

  const { summary, categoryBreakdown, recommendations } = insights;
  
  // Determine overall status color and icon
  const getStatusColor = (accuracy) => {
    if (accuracy >= 80) return 'text-green-600';
    if (accuracy >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (accuracy) => {
    if (accuracy >= 80) return <CheckCircle className="w-6 h-6" />;
    if (accuracy >= 60) return <AlertCircle className="w-6 h-6" />;
    return <AlertCircle className="w-6 h-6" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Survey vs Reality Analysis
          </h2>
          <p className="text-gray-600 mt-1">
            How well your survey responses match actual task completion
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Close</span>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Overall Accuracy Score */}
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={getStatusColor(summary.accuracy)}>
              {getStatusIcon(summary.accuracy)}
            </div>
            <div>
              <h3 className="text-lg font-semibold">Overall Accuracy</h3>
              <p className="text-3xl font-bold mt-1">{summary.accuracy}%</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {summary.matchCount} matches / {summary.mismatchCount} mismatches
            </p>
            <p className={`text-sm font-semibold mt-1 ${
              summary.status === 'good' ? 'text-green-600' : 'text-orange-600'
            }`}>
              {summary.status === 'good' ? 'Good Alignment' : 'Needs Attention'}
            </p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Accuracy by Category</h3>
        <div className="space-y-3">
          {categoryBreakdown.map(({ category, accuracy, status }) => (
            <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span className="text-sm font-medium">{category}</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      accuracy >= 70 ? 'bg-green-500' : 
                      accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {accuracy}%
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  status === 'aligned' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Insights */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
        <div className="space-y-3">
          {insights.insights.map((insight, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              insight.type === 'positive' ? 'bg-green-50 border-green-200' :
              insight.type === 'concern' ? 'bg-red-50 border-red-200' :
              insight.type === 'imbalance' ? 'bg-orange-50 border-orange-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{insight.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{insight.message}</p>
                  {insight.perception && (
                    <p className="text-sm mt-1 text-gray-600">
                      Perception: {insight.perception}
                    </p>
                  )}
                  {insight.reality && (
                    <p className="text-sm text-gray-700 font-medium">
                      Reality: {insight.reality}
                    </p>
                  )}
                </div>
                {insight.impact && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                    insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {insight.impact} impact
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Target className={`w-5 h-5 mt-0.5 ${
                    rec.priority === 'high' ? 'text-red-600' :
                    rec.priority === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium">{rec.action}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {rec.priority} priority
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{rec.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <Eye className="inline w-4 h-4 mr-1" />
          This analysis helps identify gaps between perception and reality
        </div>
        <div className="space-x-3">
          <button
            onClick={() => {
              // Implement share functionality
              console.log("Share insights with family");
            }}
            className="px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700"
          >
            <Users className="inline w-4 h-4 mr-1" />
            Share with Family
          </button>
          <button
            onClick={() => {
              // Implement progress tracking
              console.log("Track progress over time");
            }}
            className="px-4 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <TrendingUp className="inline w-4 h-4 mr-1" />
            Track Progress
          </button>
        </div>
      </div>
    </div>
  );
};

export default CorrelationInsightsDisplay;