import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import UserAvatar from '../common/UserAvatar';

const InterviewResults = ({ sessionId, onClose, onScheduleFollowUp }) => {
  const [sessionData, setSessionData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionItemStatuses, setActionItemStatuses] = useState({});

  useEffect(() => {
    if (sessionId) {
      loadSessionData();
    }
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      const sessionDoc = await getDoc(doc(db, 'interviews', sessionId));

      if (sessionDoc.exists()) {
        const data = sessionDoc.data();
        setSessionData(data);
        setInsights(data.insights || null);

        // Initialize action item statuses
        if (data.insights?.actionItems) {
          const statuses = {};
          data.insights.actionItems.forEach(item => {
            statuses[item.action] = 'pending';
          });
          setActionItemStatuses(statuses);
        }
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';

    let date;
    if (timestamp.seconds) {
      // Firestore timestamp
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleString();
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInterviewTypeTitle = (type) => {
    const titles = {
      'invisible_work_discovery': 'Invisible Work Discovery',
      'stress_capacity': 'Stress & Capacity',
      'decision_making_styles': 'Decision-Making Styles',
      'family_rules_archaeology': 'Family Rules Archaeology',
      'future_selves_visioning': 'Future Selves Visioning'
    };
    return titles[type] || type;
  };

  const getInterviewIcon = (type) => {
    const icons = {
      'invisible_work_discovery': '🔍',
      'stress_capacity': '💫',
      'decision_making_styles': '⚖️',
      'family_rules_archaeology': '📜',
      'future_selves_visioning': '🔮'
    };
    return icons[type] || '🎙️';
  };

  const toggleActionItem = (actionText) => {
    setActionItemStatuses(prev => ({
      ...prev,
      [actionText]: prev[actionText] === 'completed' ? 'pending' : 'completed'
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Loading interview results...</span>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Interview results not found.</p>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="text-4xl mr-4">{getInterviewIcon(sessionData.interviewType)}</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {getInterviewTypeTitle(sessionData.interviewType)} - Results
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>📅 {formatDate(sessionData.completedAt)}</span>
                <span>⏱️ Duration: {formatDuration(sessionData.totalDuration)}</span>
                <span>💬 {sessionData.responses?.length || 0} responses</span>
              </div>
            </div>
          </div>

          {insights && (
            <div className="text-right">
              <div className="text-3xl font-bold">
                <span className={getScoreColor(insights.overallScore)}>
                  {insights.overallScore}/10
                </span>
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="mt-4">
          <div className="text-sm text-gray-600 mb-2">Participants:</div>
          <div className="flex space-x-3">
            {sessionData.participants?.map(participant => (
              <div key={participant.userId} className="flex items-center space-x-2 bg-white rounded-full px-3 py-1">
                <UserAvatar user={participant} size={24} />
                <span className="text-sm font-medium">{participant.name}</span>
                <span className="text-xs text-gray-500">({participant.role})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
        {['overview', 'insights', 'actions', 'responses'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && insights && (
        <div className="space-y-6">
          {/* Key Patterns */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              🔍 Key Patterns Identified
            </h3>
            <div className="space-y-3">
              {insights.keyPatterns?.map((pattern, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{pattern.pattern}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      pattern.impact === 'high' ? 'bg-red-100 text-red-800' :
                      pattern.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {pattern.impact} impact
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{pattern.evidence}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Growth Areas */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                💪 Family Strengths
              </h3>
              <ul className="space-y-2">
                {insights.strengths?.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-2">✓</span>
                    <span className="text-green-800">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth Areas */}
            <div className="bg-orange-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                🌱 Growth Opportunities
              </h3>
              <div className="space-y-3">
                {insights.growthAreas?.map((area, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-orange-200">
                    <div className="font-medium text-gray-900 mb-1">{area.area}</div>
                    <div className="text-sm text-gray-600">{area.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Celebration Points */}
          {insights.celebrationPoints?.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
                🎉 Celebration Points
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {insights.celebrationPoints.map((point, index) => (
                  <div key={index} className="flex items-center bg-white rounded-lg p-3 border border-yellow-200">
                    <span className="text-2xl mr-3">🌟</span>
                    <span className="text-yellow-800">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red Flags */}
          {insights.redFlags?.length > 0 && (
            <div className="bg-red-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                ⚠️ Areas of Concern
              </h3>
              <div className="space-y-2">
                {insights.redFlags.map((flag, index) => (
                  <div key={index} className="flex items-start bg-white rounded-lg p-3 border border-red-200">
                    <span className="text-red-600 mr-2">⚠️</span>
                    <span className="text-red-800">{flag}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'actions' && insights?.actionItems && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              🎯 Recommended Actions ({insights.actionItems.length})
            </h3>
            <div className="text-sm text-gray-600">
              {Object.values(actionItemStatuses).filter(status => status === 'completed').length} completed
            </div>
          </div>

          {insights.actionItems.map((action, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 transition-all ${
                actionItemStatuses[action.action] === 'completed'
                  ? 'bg-green-50 border-green-200 opacity-75'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start">
                    <button
                      onClick={() => toggleActionItem(action.action)}
                      className={`mr-3 mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        actionItemStatuses[action.action] === 'completed'
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {actionItemStatuses[action.action] === 'completed' && '✓'}
                    </button>
                    <div className="flex-1">
                      <h4 className={`font-medium mb-2 ${
                        actionItemStatuses[action.action] === 'completed'
                          ? 'line-through text-gray-600'
                          : 'text-gray-900'
                      }`}>
                        {action.action}
                      </h4>
                      <div className="text-sm text-gray-600 mb-3">
                        <strong>Expected Outcome:</strong> {action.expectedOutcome}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm ml-8">
                    <span className={`px-2 py-1 rounded-full border ${getPriorityColor(action.priority)}`}>
                      {action.priority} priority
                    </span>
                    <span className="text-gray-600">
                      <strong>Assigned to:</strong> {action.assignedTo}
                    </span>
                    <span className="text-gray-600">
                      <strong>Effort:</strong> {action.estimatedEffort}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'insights' && insights && (
        <div className="space-y-6">
          {/* Detailed Insights */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Detailed Analysis</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 mb-4">
                Based on your interview responses, here's what we've learned about your family dynamics:
              </p>

              {/* Custom insights based on interview type */}
              {sessionData.interviewType === 'invisible_work_discovery' && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Mental Load Distribution</h4>
                  <p className="text-gray-700">
                    Your responses reveal patterns in how invisible work is distributed across family members...
                  </p>
                </div>
              )}

              {sessionData.interviewType === 'stress_capacity' && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Stress Response Patterns</h4>
                  <p className="text-gray-700">
                    We identified key stress indicators and coping mechanisms...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">🚀 Next Steps</h3>
            <ul className="space-y-2">
              {insights.nextSteps?.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">{index + 1}.</span>
                  <span className="text-blue-800">{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'responses' && sessionData.responses && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💬 Interview Conversation ({sessionData.responses.length} responses)
          </h3>

          {sessionData.responses.map((response, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <div className="mb-3">
                <h4 className="font-medium text-purple-900 mb-2">
                  Q{index + 1}: {response.question}
                </h4>
              </div>

              <div className="bg-white rounded-lg p-4 border border-gray-200 mb-3">
                <div className="flex items-center mb-2">
                  {response.speaker && (
                    <UserAvatar user={response.speaker} size={24} className="mr-2" />
                  )}
                  <span className="font-medium text-gray-900">
                    {response.speaker?.name || 'Response'}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({response.inputType})
                  </span>
                </div>
                <p className="text-gray-800">{response.response}</p>
              </div>

              {/* Analysis */}
              {response.analysis && (
                <div className="text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <span>Sentiment: {response.analysis.sentiment?.toFixed(2)}</span>
                    <span>Tone: {response.analysis.emotionalTone}</span>
                    {response.analysis.keyThemes?.length > 0 && (
                      <span>Themes: {response.analysis.keyThemes.join(', ')}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Interview completed on {formatDate(sessionData.completedAt)}
        </div>

        <div className="space-x-3">
          {onScheduleFollowUp && (
            <button
              onClick={() => onScheduleFollowUp(sessionData.interviewType)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📅 Schedule Follow-up
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            🖨️ Print Results
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewResults;