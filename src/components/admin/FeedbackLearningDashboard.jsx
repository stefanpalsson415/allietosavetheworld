import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import FeedbackLearningService, { FEEDBACK_TYPES } from '../../services/FeedbackLearningService';
import { firebase } from '../../services/firebase';

/**
 * FeedbackLearningDashboard - Dashboard for monitoring and analyzing user feedback
 * 
 * This component provides administrators with insights into:
 * - Overall feedback metrics
 * - User satisfaction trends
 * - Common issues reported by users
 * - Specific conversation and question feedback
 * - Adaptation suggestions based on feedback patterns
 */
const FeedbackLearningDashboard = () => {
  const { familyId } = useParams();
  const [loading, setLoading] = useState(true);
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackMetrics, setFeedbackMetrics] = useState({
    totalFeedback: 0,
    positivePercentage: 0,
    negativePercentage: 0,
    confusingPercentage: 0,
    incorrectPercentage: 0,
    greatPercentage: 0,
  });
  const [feedbackByDate, setFeedbackByDate] = useState([]);
  const [topIssues, setTopIssues] = useState([]);
  const [adaptationSuggestions, setAdaptationSuggestions] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationAnalysis, setConversationAnalysis] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days
  
  // Fetch feedback data when component mounts or date range changes
  useEffect(() => {
    const fetchFeedbackData = async () => {
      setLoading(true);
      
      try {
        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange, 10));
        
        // Get feedback collection reference
        const feedbackCollection = firebase.firestore().collection('feedback');
        
        // Build query
        let query = feedbackCollection
          .where('timestamp', '>=', startDate)
          .where('timestamp', '<=', endDate)
          .orderBy('timestamp', 'desc')
          .limit(500); // Limit to 500 most recent entries
        
        // Add familyId filter if provided
        if (familyId) {
          query = query.where('userId', '==', familyId);
        }
        
        // Execute query
        const feedbackSnapshot = await query.get();
        
        // Process feedback data
        const feedback = [];
        feedbackSnapshot.forEach(doc => {
          feedback.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        
        setFeedbackData(feedback);
        processMetrics(feedback);
      } catch (error) {
        console.error('Error fetching feedback data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeedbackData();
  }, [familyId, dateRange]);
  
  // Process feedback metrics
  const processMetrics = (feedback) => {
    if (!feedback.length) {
      setFeedbackMetrics({
        totalFeedback: 0,
        positivePercentage: 0,
        negativePercentage: 0,
        confusingPercentage: 0,
        incorrectPercentage: 0,
        greatPercentage: 0,
      });
      return;
    }
    
    // Count feedback by type
    const typeCounts = {
      [FEEDBACK_TYPES.HELPFUL]: 0,
      [FEEDBACK_TYPES.NOT_HELPFUL]: 0,
      [FEEDBACK_TYPES.CONFUSING]: 0,
      [FEEDBACK_TYPES.INCORRECT]: 0,
      [FEEDBACK_TYPES.GREAT]: 0,
    };
    
    // Process explicit feedback
    const explicitFeedback = feedback.filter(item => item.source === 'explicit');
    explicitFeedback.forEach(item => {
      if (item.feedbackType) {
        typeCounts[item.feedbackType] = (typeCounts[item.feedbackType] || 0) + 1;
      }
    });
    
    // Calculate percentages
    const totalFeedback = Object.values(typeCounts).reduce((sum, count) => sum + count, 0);
    const getPercentage = (count) => (totalFeedback > 0 ? Math.round((count / totalFeedback) * 100) : 0);
    
    setFeedbackMetrics({
      totalFeedback,
      positivePercentage: getPercentage(typeCounts[FEEDBACK_TYPES.HELPFUL]),
      negativePercentage: getPercentage(typeCounts[FEEDBACK_TYPES.NOT_HELPFUL]),
      confusingPercentage: getPercentage(typeCounts[FEEDBACK_TYPES.CONFUSING]),
      incorrectPercentage: getPercentage(typeCounts[FEEDBACK_TYPES.INCORRECT]),
      greatPercentage: getPercentage(typeCounts[FEEDBACK_TYPES.GREAT]),
    });
    
    // Process feedback by date
    processFeedbackByDate(feedback);
    
    // Process top issues
    processTopIssues(feedback);
    
    // Generate adaptation suggestions
    generateAdaptationSuggestions(feedback);
  };
  
  // Process feedback data by date
  const processFeedbackByDate = (feedback) => {
    const dateMap = new Map();
    
    feedback.forEach(item => {
      if (item.timestamp) {
        // Convert Firebase timestamp to Date
        const date = item.timestamp.toDate ? item.timestamp.toDate() : new Date(item.timestamp);
        const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!dateMap.has(dateString)) {
          dateMap.set(dateString, {
            date: dateString,
            total: 0,
            positive: 0,
            negative: 0,
            great: 0,
          });
        }
        
        const dateStats = dateMap.get(dateString);
        dateStats.total += 1;
        
        if (item.feedbackType === FEEDBACK_TYPES.HELPFUL) {
          dateStats.positive += 1;
        } else if (item.feedbackType === FEEDBACK_TYPES.GREAT) {
          dateStats.great += 1;
          dateStats.positive += 1; // Great is also positive
        } else if (
          item.feedbackType === FEEDBACK_TYPES.NOT_HELPFUL ||
          item.feedbackType === FEEDBACK_TYPES.CONFUSING ||
          item.feedbackType === FEEDBACK_TYPES.INCORRECT
        ) {
          dateStats.negative += 1;
        }
      }
    });
    
    // Convert map to array and sort by date
    const feedbackByDate = Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    setFeedbackByDate(feedbackByDate);
  };
  
  // Process top issues from feedback
  const processTopIssues = (feedback) => {
    // Get all feedback with comments
    const feedbackWithComments = feedback.filter(
      item => item.additionalInfo && item.additionalInfo.comment && item.additionalInfo.comment.trim()
    );
    
    // Extract common themes and issues
    const issues = {};
    
    feedbackWithComments.forEach(item => {
      const comment = item.additionalInfo.comment.toLowerCase();
      
      // Check for common issue keywords
      const checkKeywords = (keywords, category) => {
        for (const keyword of keywords) {
          if (comment.includes(keyword)) {
            issues[category] = (issues[category] || 0) + 1;
            return true;
          }
        }
        return false;
      };
      
      // Define issue categories and keywords
      const issueCategories = [
        {
          category: 'Too many questions',
          keywords: ['too many questions', 'too much questioning', 'asking too much', 'too many follow ups']
        },
        {
          category: 'Confusing responses',
          keywords: ['confusing', 'unclear', 'don\'t understand', 'hard to follow']
        },
        {
          category: 'Incorrect information',
          keywords: ['wrong', 'incorrect', 'not right', 'inaccurate', 'mistake', 'error']
        },
        {
          category: 'Calendar issues',
          keywords: ['calendar', 'schedule', 'appointment', 'event', 'time', 'date']
        },
        {
          category: 'School events',
          keywords: ['school', 'class', 'teacher', 'homework', 'assignment']
        },
        {
          category: 'Medical appointments',
          keywords: ['doctor', 'medical', 'health', 'appointment', 'prescription']
        },
        {
          category: 'Not detailed enough',
          keywords: ['more detail', 'more information', 'not enough detail', 'too vague']
        },
        {
          category: 'Too detailed',
          keywords: ['too detailed', 'too much detail', 'too much information']
        }
      ];
      
      // Check each category
      let foundCategory = false;
      for (const { category, keywords } of issueCategories) {
        if (checkKeywords(keywords, category)) {
          foundCategory = true;
          break;
        }
      }
      
      // If no category was found, increment "Other issues"
      if (!foundCategory) {
        issues['Other issues'] = (issues['Other issues'] || 0) + 1;
      }
    });
    
    // Convert issues object to array and sort by count
    const topIssues = Object.entries(issues)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 issues
    
    setTopIssues(topIssues);
  };
  
  // Generate adaptation suggestions based on feedback
  const generateAdaptationSuggestions = (feedback) => {
    // Analyze feedback for patterns
    const patterns = {
      tooManyQuestions: 0,
      tooFewQuestions: 0,
      tooDetailed: 0,
      notDetailedEnough: 0,
      topics: {}
    };
    
    let patternCounts = {
      questionCount: 0,
      detailLevel: 0
    };
    
    // Process detailed feedback options
    feedback.forEach(item => {
      if (item.additionalInfo) {
        // Question count patterns
        if (item.additionalInfo.tooManyQuestions) {
          patterns.tooManyQuestions++;
          patternCounts.questionCount++;
        }
        if (item.additionalInfo.tooFewQuestions) {
          patterns.tooFewQuestions++;
          patternCounts.questionCount++;
        }
        
        // Detail level patterns
        if (item.additionalInfo.tooDetailed) {
          patterns.tooDetailed++;
          patternCounts.detailLevel++;
        }
        if (item.additionalInfo.notDetailedEnough) {
          patterns.notDetailedEnough++;
          patternCounts.detailLevel++;
        }
        
        // Process topics feedback
        if (item.additionalInfo.topics && Array.isArray(item.additionalInfo.topics)) {
          item.additionalInfo.topics.forEach(topic => {
            // Track topic counts by feedback type
            if (!patterns.topics[topic]) {
              patterns.topics[topic] = {
                positive: 0,
                negative: 0,
                total: 0
              };
            }
            
            patterns.topics[topic].total++;
            
            if (
              item.feedbackType === FEEDBACK_TYPES.HELPFUL || 
              item.feedbackType === FEEDBACK_TYPES.GREAT
            ) {
              patterns.topics[topic].positive++;
            } else if (
              item.feedbackType === FEEDBACK_TYPES.NOT_HELPFUL || 
              item.feedbackType === FEEDBACK_TYPES.CONFUSING ||
              item.feedbackType === FEEDBACK_TYPES.INCORRECT
            ) {
              patterns.topics[topic].negative++;
            }
          });
        }
      }
    });
    
    // Generate suggestions based on patterns
    const suggestions = [];
    
    // Question count suggestions
    if (patternCounts.questionCount >= 5) {
      if (patterns.tooManyQuestions > patterns.tooFewQuestions * 2) {
        suggestions.push({
          category: 'Question Count',
          suggestion: 'Reduce the number of follow-up questions. Users find the current questioning excessive.',
          confidence: 'high'
        });
      } else if (patterns.tooFewQuestions > patterns.tooManyQuestions * 2) {
        suggestions.push({
          category: 'Question Count',
          suggestion: 'Increase the number of clarifying questions. Users want more guidance.',
          confidence: 'high'
        });
      }
    }
    
    // Detail level suggestions
    if (patternCounts.detailLevel >= 5) {
      if (patterns.tooDetailed > patterns.notDetailedEnough * 2) {
        suggestions.push({
          category: 'Detail Level',
          suggestion: 'Simplify responses. Users find the current level of detail overwhelming.',
          confidence: 'high'
        });
      } else if (patterns.notDetailedEnough > patterns.tooDetailed * 2) {
        suggestions.push({
          category: 'Detail Level',
          suggestion: 'Provide more comprehensive information. Users want more details in responses.',
          confidence: 'high'
        });
      }
    }
    
    // Topic-specific suggestions
    const topicSuggestions = Object.entries(patterns.topics)
      .filter(([_, stats]) => stats.total >= 3) // Topics with at least 3 mentions
      .map(([topic, stats]) => {
        const positiveRatio = stats.positive / stats.total;
        const negativeRatio = stats.negative / stats.total;
        
        if (positiveRatio >= 0.7) {
          return {
            category: 'Topic Focus',
            suggestion: `Emphasize "${topic}" topics. Users find this content particularly helpful.`,
            confidence: stats.total >= 5 ? 'high' : 'medium'
          };
        } else if (negativeRatio >= 0.7) {
          return {
            category: 'Topic Improvement',
            suggestion: `Improve responses about "${topic}". Users are consistently dissatisfied with this content.`,
            confidence: stats.total >= 5 ? 'high' : 'medium'
          };
        }
        
        return null;
      })
      .filter(Boolean);
    
    setAdaptationSuggestions([...suggestions, ...topicSuggestions]);
  };
  
  // Handle conversation selection
  const handleConversationSelect = async (conversationId) => {
    setSelectedConversation(conversationId);
    
    try {
      // Analyze conversation feedback
      const analysis = await FeedbackLearningService.analyzeConversation(conversationId);
      setConversationAnalysis(analysis);
    } catch (error) {
      console.error('Error analyzing conversation:', error);
      setConversationAnalysis(null);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Feedback Learning Dashboard</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Feedback Learning Dashboard</h1>
      
      {/* Date range selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="180">Last 180 days</option>
        </select>
      </div>
      
      {/* Overview metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Feedback Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total Feedback</div>
            <div className="text-2xl font-bold">{feedbackMetrics.totalFeedback}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Positive</div>
            <div className="text-2xl font-bold text-green-600">{feedbackMetrics.positivePercentage}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Negative</div>
            <div className="text-2xl font-bold text-red-600">{feedbackMetrics.negativePercentage}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Confusing</div>
            <div className="text-2xl font-bold text-yellow-600">{feedbackMetrics.confusingPercentage}%</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Great</div>
            <div className="text-2xl font-bold text-blue-600">{feedbackMetrics.greatPercentage}%</div>
          </div>
        </div>
      </div>
      
      {/* Feedback trends */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Feedback Trends</h2>
        {feedbackByDate.length > 0 ? (
          <div className="bg-white p-4 rounded-lg shadow">
            {/* Simplified chart - could be replaced with a proper chart library */}
            <div className="h-64 flex items-end space-x-1">
              {feedbackByDate.map((day) => {
                const positiveHeight = (day.positive / day.total) * 100;
                const negativeHeight = (day.negative / day.total) * 100;
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center">
                    <div className="flex flex-col w-full h-48">
                      <div 
                        className="bg-green-500"
                        style={{ height: `${positiveHeight}%` }}
                      />
                      <div 
                        className="bg-red-500"
                        style={{ height: `${negativeHeight}%` }}
                      />
                    </div>
                    <div className="text-xs mt-1 transform -rotate-45 origin-top-left">{day.date.slice(5)}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-center mt-6 space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 mr-1"></div>
                <span className="text-sm">Positive</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 mr-1"></div>
                <span className="text-sm">Negative</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
            No trend data available
          </div>
        )}
      </div>
      
      {/* Top issues and suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top issues */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Top Issues</h2>
          {topIssues.length > 0 ? (
            <ul className="bg-white rounded-lg shadow divide-y">
              {topIssues.map((issue, index) => (
                <li key={index} className="p-4">
                  <div className="flex justify-between">
                    <span>{issue.issue}</span>
                    <span className="font-medium">{issue.count}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
              No issues identified
            </div>
          )}
        </div>
        
        {/* Adaptation suggestions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Adaptation Suggestions</h2>
          {adaptationSuggestions.length > 0 ? (
            <ul className="bg-white rounded-lg shadow divide-y">
              {adaptationSuggestions.map((suggestion, index) => (
                <li key={index} className="p-4">
                  <div className="flex items-start">
                    <div className={`w-2 h-2 rounded-full mt-1 mr-2 ${
                      suggestion.confidence === 'high' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <div className="font-medium text-sm">{suggestion.category}</div>
                      <div>{suggestion.suggestion}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-white p-4 rounded-lg shadow text-center text-gray-500">
              No adaptation suggestions available
            </div>
          )}
        </div>
      </div>
      
      {/* Recent feedback */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Feedback</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {feedbackData.slice(0, 10).map((feedback) => (
                <tr key={feedback.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      feedback.feedbackType === FEEDBACK_TYPES.HELPFUL ? 'bg-green-100 text-green-800' :
                      feedback.feedbackType === FEEDBACK_TYPES.GREAT ? 'bg-blue-100 text-blue-800' :
                      feedback.feedbackType === FEEDBACK_TYPES.NOT_HELPFUL ? 'bg-red-100 text-red-800' :
                      feedback.feedbackType === FEEDBACK_TYPES.CONFUSING ? 'bg-yellow-100 text-yellow-800' :
                      feedback.feedbackType === FEEDBACK_TYPES.INCORRECT ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {feedback.feedbackType || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {feedback.timestamp ? new Date(
                      feedback.timestamp.toDate ? feedback.timestamp.toDate() : feedback.timestamp
                    ).toLocaleString() : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                    {feedback.additionalInfo?.comment || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleConversationSelect(feedback.conversationId)}
                      className="text-blue-600 hover:text-blue-900"
                      disabled={!feedback.conversationId}
                    >
                      View Conversation
                    </button>
                  </td>
                </tr>
              ))}
              {feedbackData.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    No feedback data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Conversation analysis */}
      {selectedConversation && conversationAnalysis && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Conversation Analysis</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium mb-4">Conversation Metrics</h3>
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {conversationAnalysis.scoreMetrics.helpfulness}%
                </div>
                <div className="text-sm text-gray-500">Helpfulness</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {conversationAnalysis.scoreMetrics.clarity}%
                </div>
                <div className="text-sm text-gray-500">Clarity</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {conversationAnalysis.scoreMetrics.accuracy}%
                </div>
                <div className="text-sm text-gray-500">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {conversationAnalysis.scoreMetrics.efficiency}%
                </div>
                <div className="text-sm text-gray-500">Efficiency</div>
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-4">Insights</h3>
            {conversationAnalysis.insights.length > 0 ? (
              <ul className="space-y-2">
                {conversationAnalysis.insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-5 w-5 text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="ml-2">{insight}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No specific insights available for this conversation.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackLearningDashboard;