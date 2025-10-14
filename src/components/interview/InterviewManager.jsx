import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import InterviewLauncher from './InterviewLauncher';
import InterviewChat from './InterviewChat';
import InterviewResults from './InterviewResults';
import interviewOrchestrator from '../../services/InterviewOrchestrator';

const InterviewManager = () => {
  const { currentUser, familyData } = useAuth();
  const [currentView, setCurrentView] = useState('launcher'); // launcher, interview, results
  const [activeSession, setActiveSession] = useState(null);
  const [completedInterviews, setCompletedInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interview states
  const [interviewData, setInterviewData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [resultsSessionId, setResultsSessionId] = useState(null);

  // Use familyData instead of selectedFamily
  const familyId = familyData?.id || familyData?.familyId;
  const familyMembers = familyData?.members || [];

  useEffect(() => {
    if (familyId) {
      loadCompletedInterviews();
    } else {
      // If no family ID, stop loading
      setLoading(false);
    }
  }, [familyId]);

  const loadCompletedInterviews = async () => {
    if (!familyId) {
      console.log('No family ID available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Loading interviews for family:', familyId);
      const interviewsRef = collection(db, 'interviews');
      const completedQuery = query(
        interviewsRef,
        where('familyId', '==', familyId),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(completedQuery);
      const interviews = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCompletedInterviews(interviews);
      console.log(`Loaded ${interviews.length} completed interviews`);
    } catch (error) {
      console.error('Error loading completed interviews:', error);

      // Check if it's an index error
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.log('Firestore index needed. Trying simple query instead.');

        // Try a simpler query without the compound where/orderBy
        try {
          const interviewsRefSimple = collection(db, 'interviews');
          const simpleQuery = query(
            interviewsRefSimple,
            where('familyId', '==', familyId)
          );

          const simpleSnapshot = await getDocs(simpleQuery);
          const allInterviews = simpleSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Filter and sort in memory
          const completed = allInterviews
            .filter(interview => interview.status === 'completed')
            .sort((a, b) => {
              const aTime = a.completedAt?.seconds || 0;
              const bTime = b.completedAt?.seconds || 0;
              return bTime - aTime;
            })
            .slice(0, 10);

          setCompletedInterviews(completed);
          console.log(`Loaded ${completed.length} completed interviews (simple query)`);
        } catch (simpleError) {
          console.error('Simple query also failed:', simpleError);
          setCompletedInterviews([]);
        }
      } else {
        // For any other error, just set empty array
        setCompletedInterviews([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchInterview = async (interviewConfig) => {
    try {
      console.log('Launching interview:', interviewConfig);

      // Start the interview session
      const sessionResult = await interviewOrchestrator.startInterviewSession(
        interviewConfig.interviewType,
        interviewConfig.participants,
        interviewConfig.familyId,
        interviewConfig.interviewData
      );

      if (sessionResult.status === 'success') {
        // Set up interview state
        setInterviewData(interviewConfig.interviewData);
        setParticipants(interviewConfig.participants);
        setSessionId(sessionResult.sessionId);
        setActiveSession(sessionResult);

        // Switch to interview view
        setCurrentView('interview');
      } else {
        console.error('Failed to start interview session:', sessionResult);
        alert('Failed to start interview. Please try again.');
      }
    } catch (error) {
      console.error('Error launching interview:', error);
      alert('Error starting interview: ' + error.message);
    }
  };

  const handleCompleteInterview = async (completionData) => {
    console.log('Interview completed:', completionData);

    try {
      // Process the completed interview
      const completionResult = await interviewOrchestrator.completeInterview(
        completionData.sessionId
      );

      if (completionResult.type === 'complete') {
        // Set up results view
        setResultsSessionId(completionData.sessionId);
        setCurrentView('results');

        // Clean up interview state
        setActiveSession(null);
        setInterviewData(null);
        setParticipants([]);
        setSessionId(null);

        // Reload completed interviews
        await loadCompletedInterviews();
      }
    } catch (error) {
      console.error('Error completing interview:', error);
      // Still show results even if processing failed
      setResultsSessionId(completionData.sessionId);
      setCurrentView('results');
    }
  };

  const handlePauseInterview = async (pauseData) => {
    console.log('Interview paused:', pauseData);

    try {
      await interviewOrchestrator.pauseSession(pauseData.sessionId);

      // Save pause state and return to launcher
      setActiveSession({ ...activeSession, paused: true });
      setCurrentView('launcher');
    } catch (error) {
      console.error('Error pausing interview:', error);
    }
  };

  const handleCloseResults = () => {
    setResultsSessionId(null);
    setCurrentView('launcher');
  };

  const handleScheduleFollowUp = (interviewType) => {
    console.log('Scheduling follow-up for:', interviewType);
    // TODO: Implement follow-up scheduling
    alert(`Follow-up interview for ${interviewType} scheduled! (Feature coming soon)`);
  };

  const handleViewPastResults = (interviewId) => {
    setResultsSessionId(interviewId);
    setCurrentView('results');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-600">Loading family interviews...</span>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50">
      {currentView === 'launcher' && (
        <div>
          {/* Past Interviews Summary */}
          {completedInterviews.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Interview Results ({completedInterviews.length})
                </h2>
                <button
                  onClick={() => setCurrentView('history')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All →
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedInterviews.slice(0, 3).map(interview => {
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

                  const formatDate = (timestamp) => {
                    if (!timestamp) return 'Unknown';
                    let date;
                    if (timestamp.seconds) {
                      date = new Date(timestamp.seconds * 1000);
                    } else {
                      date = new Date(timestamp);
                    }
                    return date.toLocaleDateString();
                  };

                  return (
                    <div
                      key={interview.id}
                      onClick={() => handleViewPastResults(interview.id)}
                      className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">
                          {getInterviewIcon(interview.interviewType)}
                        </span>
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">
                            {interview.metadata?.interviewTitle || interview.interviewType}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatDate(interview.completedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {interview.participants?.length} participant(s) • {interview.responses?.length} responses
                      </div>
                      {interview.insights?.overallScore && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-600">Score:</div>
                          <div className={`text-sm font-semibold ${
                            interview.insights.overallScore >= 8 ? 'text-green-600' :
                            interview.insights.overallScore >= 6 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {interview.insights.overallScore}/10
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Main Interview Launcher */}
          <InterviewLauncher onLaunchInterview={handleLaunchInterview} />
        </div>
      )}

      {currentView === 'interview' && interviewData && participants && sessionId && (
        <div className="h-full">
          <InterviewChat
            interviewData={interviewData}
            participants={participants}
            sessionId={sessionId}
            onCompleteInterview={handleCompleteInterview}
            onPauseInterview={handlePauseInterview}
          />
        </div>
      )}

      {currentView === 'results' && resultsSessionId && (
        <InterviewResults
          sessionId={resultsSessionId}
          onClose={handleCloseResults}
          onScheduleFollowUp={handleScheduleFollowUp}
        />
      )}

      {currentView === 'history' && (
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Interview History</h1>
            <button
              onClick={() => setCurrentView('launcher')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ← Back to Discovery Sessions
            </button>
          </div>

          <div className="space-y-4">
            {completedInterviews.map(interview => {
              const getInterviewTitle = (type) => {
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

              const formatDate = (timestamp) => {
                if (!timestamp) return 'Unknown';
                let date;
                if (timestamp.seconds) {
                  date = new Date(timestamp.seconds * 1000);
                } else {
                  date = new Date(timestamp);
                }
                return date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });
              };

              const formatDuration = (milliseconds) => {
                if (!milliseconds) return 'Unknown';
                const minutes = Math.floor(milliseconds / 60000);
                const seconds = Math.floor((milliseconds % 60000) / 1000);
                return `${minutes}m ${seconds}s`;
              };

              return (
                <div
                  key={interview.id}
                  className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="text-3xl mr-4">{getInterviewIcon(interview.interviewType)}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {getInterviewTitle(interview.interviewType)}
                        </h3>
                        <div className="text-sm text-gray-600 space-x-4 mb-2">
                          <span>📅 {formatDate(interview.completedAt)}</span>
                          <span>⏱️ {formatDuration(interview.totalDuration)}</span>
                          <span>💬 {interview.responses?.length || 0} responses</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Participants: {interview.participants?.map(p => p.name).join(', ')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {interview.insights?.overallScore && (
                        <div className="text-right">
                          <div className={`text-xl font-bold ${
                            interview.insights.overallScore >= 8 ? 'text-green-600' :
                            interview.insights.overallScore >= 6 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {interview.insights.overallScore}/10
                          </div>
                          <div className="text-xs text-gray-500">Score</div>
                        </div>
                      )}
                      <button
                        onClick={() => handleViewPastResults(interview.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        View Results
                      </button>
                    </div>
                  </div>

                  {/* Quick insights preview */}
                  {interview.insights && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        {interview.insights.keyPatterns?.length > 0 && (
                          <div>
                            <div className="font-medium text-gray-900 mb-1">Key Patterns</div>
                            <div className="text-gray-600">
                              {interview.insights.keyPatterns.slice(0, 2).map((pattern, i) => (
                                <div key={i} className="truncate">• {pattern.pattern}</div>
                              ))}
                              {interview.insights.keyPatterns.length > 2 && (
                                <div className="text-gray-400">...and {interview.insights.keyPatterns.length - 2} more</div>
                              )}
                            </div>
                          </div>
                        )}

                        {interview.insights.strengths?.length > 0 && (
                          <div>
                            <div className="font-medium text-gray-900 mb-1">Strengths</div>
                            <div className="text-gray-600">
                              {interview.insights.strengths.slice(0, 2).map((strength, i) => (
                                <div key={i} className="truncate">• {strength}</div>
                              ))}
                              {interview.insights.strengths.length > 2 && (
                                <div className="text-gray-400">...and {interview.insights.strengths.length - 2} more</div>
                              )}
                            </div>
                          </div>
                        )}

                        {interview.insights.actionItems?.length > 0 && (
                          <div>
                            <div className="font-medium text-gray-900 mb-1">Action Items</div>
                            <div className="text-gray-600">
                              {interview.insights.actionItems.slice(0, 2).map((action, i) => (
                                <div key={i} className="truncate">• {action.action}</div>
                              ))}
                              {interview.insights.actionItems.length > 2 && (
                                <div className="text-gray-400">...and {interview.insights.actionItems.length - 2} more</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {completedInterviews.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🎙️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Interviews Yet</h3>
                <p className="text-gray-600 mb-4">
                  You haven't completed any family discovery sessions yet.
                </p>
                <button
                  onClick={() => setCurrentView('launcher')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Your First Interview
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewManager;