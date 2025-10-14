import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight, ArrowLeft, Scale, BarChart3, Users, ChevronLeft, ChevronRight,
  Sparkles, MessageCircle, Brain
} from 'lucide-react';
import SalesAllieChat from '../chat/SalesAllieChat';
import UserAvatar from '../common/UserAvatar';

const OnboardingSurvey = ({ familyData, onComplete, onBack }) => {
  // Survey questions focused on mental load distribution
  const surveyQuestions = [
    {
      id: 'q1',
      text: "Who typically remembers doctor appointments and schedules them?",
      category: "Healthcare Management",
      emoji: "🏥"
    },
    {
      id: 'q2',
      text: "Who keeps track of what groceries need to be bought?",
      category: "Household Management",
      emoji: "🛒"
    },
    {
      id: 'q3',
      text: "Who plans and organizes family social activities?",
      category: "Social Coordination",
      emoji: "🎉"
    },
    {
      id: 'q4',
      text: "Who manages the kids' school communications and events?",
      category: "Education Management",
      emoji: "📚"
    },
    {
      id: 'q5',
      text: "Who notices when household supplies are running low?",
      category: "Household Management",
      emoji: "🧻"
    },
    {
      id: 'q6',
      text: "Who researches and books family vacations?",
      category: "Planning & Research",
      emoji: "✈️"
    },
    {
      id: 'q7',
      text: "Who keeps track of kids' clothing sizes and needs?",
      category: "Child Care",
      emoji: "👕"
    },
    {
      id: 'q8',
      text: "Who manages gift-giving for birthdays and holidays?",
      category: "Social Coordination",
      emoji: "🎁"
    },
    {
      id: 'q9',
      text: "Who coordinates with babysitters or childcare?",
      category: "Child Care",
      emoji: "👶"
    },
    {
      id: 'q10',
      text: "Who handles meal planning for the week?",
      category: "Nutrition Management",
      emoji: "🍽️"
    }
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [currentMember, setCurrentMember] = useState(null);
  const [showAllie, setShowAllie] = useState(false);
  const [showBalanceForecast, setShowBalanceForecast] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Extract parents and children from familyData
  const parents = familyData.parents || [];
  const children = familyData.children || [];
  const allMembers = [...parents, ...children];

  // Initialize with first member
  useEffect(() => {
    if (!currentMember && allMembers.length > 0) {
      // Start with first parent if available
      const firstParent = parents[0] || allMembers[0];
      setCurrentMember(firstParent);
    }
  }, [allMembers]);

  // Calculate progress
  const currentQuestion = surveyQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / surveyQuestions.length) * 100;
  const totalResponses = Object.keys(responses).length;

  // Get member-specific responses
  const getMemberResponses = (member) => {
    if (!member) return {};
    const memberKey = member.email || member.name;
    return responses[memberKey] || {};
  };

  const currentMemberResponses = getMemberResponses(currentMember);
  const currentMemberResponseCount = Object.keys(currentMemberResponses).length;

  // Handle answer selection
  const handleSelectAnswer = (answer) => {
    if (!currentMember) return;

    setIsAnimating(true);
    setSelectedAnswer(answer);

    // Save response for current member
    const memberKey = currentMember.email || currentMember.name;
    const memberResponses = responses[memberKey] || {};

    setResponses(prev => ({
      ...prev,
      [memberKey]: {
        ...memberResponses,
        [currentQuestion.id]: answer
      }
    }));

    // Auto-advance after animation
    setTimeout(() => {
      if (currentQuestionIndex < surveyQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        // Check if other members need to take the quiz
        const incompleteMember = allMembers.find(member => {
          const memberKey = member.email || member.name;
          const memberResponses = responses[memberKey] || {};
          return Object.keys(memberResponses).length < surveyQuestions.length;
        });

        if (incompleteMember && incompleteMember !== currentMember) {
          // Switch to next member and restart
          setCurrentMember(incompleteMember);
          setCurrentQuestionIndex(0);
          setSelectedAnswer(null);
        } else {
          // All done!
          handleComplete();
        }
      }
      setIsAnimating(false);
    }, 800);
  };

  // Switch family member
  const switchMember = (member) => {
    setCurrentMember(member);
    // Reset to first unanswered question for this member
    const memberKey = member.email || member.name;
    const memberResponses = responses[memberKey] || {};

    let firstUnanswered = 0;
    for (let i = 0; i < surveyQuestions.length; i++) {
      if (!memberResponses[surveyQuestions[i].id]) {
        firstUnanswered = i;
        break;
      }
    }
    setCurrentQuestionIndex(firstUnanswered);
    setSelectedAnswer(null);
  };

  // Handle navigation
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestion = surveyQuestions[currentQuestionIndex - 1];
      setSelectedAnswer(currentMemberResponses[prevQuestion.id] || null);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < surveyQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestion = surveyQuestions[currentQuestionIndex + 1];
      setSelectedAnswer(currentMemberResponses[nextQuestion.id] || null);
    }
  };

  const handleComplete = () => {
    // Format responses for submission
    const formattedResponses = {};
    Object.keys(responses).forEach(memberKey => {
      const memberResponses = responses[memberKey];
      Object.keys(memberResponses).forEach(questionId => {
        const key = `${memberKey}_${questionId}`;
        formattedResponses[key] = memberResponses[questionId];
      });
    });

    onComplete(formattedResponses);
  };

  // Check if we can show balance forecast (need 10+ responses)
  const canShowForecast = totalResponses >= 10;

  // Get parent display objects
  const parent1 = parents[0] || { name: 'Parent 1', email: 'parent1@family.com' };
  const parent2 = parents[1] || { name: 'Parent 2', email: 'parent2@family.com' };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Allie Branding */}
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Brain size={24} className="text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">Hello, I'm</div>
                  <div className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent -mt-1">
                    Allie
                  </div>
                </div>
              </div>

              <button
                onClick={onBack}
                className="flex items-center text-gray-600 hover:text-gray-800 ml-4"
              >
                <ChevronLeft size={20} className="mr-1" />
                Back
              </button>
            </div>

            {/* Member Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 mr-2">Taking survey as:</span>
              <div className="flex gap-2">
                {allMembers.map((member, idx) => {
                  const memberKey = member.email || member.name;
                  const memberResponses = responses[memberKey] || {};
                  const responseCount = Object.keys(memberResponses).length;
                  const isComplete = responseCount === surveyQuestions.length;

                  return (
                    <button
                      key={idx}
                      onClick={() => !isComplete && switchMember(member)}
                      disabled={isComplete}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
                        currentMember === member
                          ? 'bg-purple-600 text-white'
                          : isComplete
                          ? 'bg-green-100 text-green-700 cursor-not-allowed'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <UserAvatar user={member} size={20} />
                      <span>{member.name}</span>
                      {responseCount > 0 && (
                        <span className="text-xs opacity-75">
                          ({responseCount}/{surveyQuestions.length})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowAllie(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200"
            >
              <MessageCircle size={16} />
              <span className="text-sm">Ask Allie</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-800">
              Challenge Areas Survey
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {surveyQuestions.length}
              </span>
              <div className="bg-purple-100 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-purple-700">
                  {currentMemberResponseCount} votes
                </span>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${(currentMemberResponseCount / surveyQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">{currentQuestion.emoji}</div>
            <div className="text-sm text-gray-500 mb-2">{currentQuestion.category}</div>
            <h3 className="text-2xl font-semibold text-gray-800">
              {currentQuestion.text}
            </h3>
          </div>

          {/* Answer Options */}
          <div className="flex justify-center items-center mt-12">
            <div className="flex items-center gap-8">
              {/* Parent 1 */}
              <div className="text-center">
                <button
                  onClick={() => handleSelectAnswer(parent1.name)}
                  disabled={isAnimating}
                  className={`relative rounded-full overflow-hidden transition-all ${
                    selectedAnswer === parent1.name || currentMemberResponses[currentQuestion.id] === parent1.name
                      ? 'ring-4 ring-purple-500 ring-offset-4 scale-105'
                      : 'hover:ring-4 hover:ring-purple-200 hover:ring-offset-4'
                  }`}
                >
                  <UserAvatar user={parent1} size={120} />
                  {(selectedAnswer === parent1.name || currentMemberResponses[currentQuestion.id] === parent1.name) && (
                    <div className="absolute inset-0 bg-purple-500 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-white rounded-full p-2">
                        <Sparkles className="text-purple-500" size={24} />
                      </div>
                    </div>
                  )}
                </button>
                <p className="mt-3 font-medium text-gray-800">{parent1.name}</p>
              </div>

              {/* Share Option */}
              <div className="text-center">
                <button
                  onClick={() => handleSelectAnswer('Share')}
                  disabled={isAnimating}
                  className={`w-24 h-24 rounded-full bg-white border-4 transition-all flex flex-col items-center justify-center ${
                    selectedAnswer === 'Share' || currentMemberResponses[currentQuestion.id] === 'Share'
                      ? 'border-gray-600 bg-gray-100 scale-105'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Scale size={28} className="text-gray-600 mb-1" />
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>

              {/* Parent 2 */}
              <div className="text-center">
                <button
                  onClick={() => handleSelectAnswer(parent2.name)}
                  disabled={isAnimating}
                  className={`relative rounded-full overflow-hidden transition-all ${
                    selectedAnswer === parent2.name || currentMemberResponses[currentQuestion.id] === parent2.name
                      ? 'ring-4 ring-blue-500 ring-offset-4 scale-105'
                      : 'hover:ring-4 hover:ring-blue-200 hover:ring-offset-4'
                  }`}
                >
                  <UserAvatar user={parent2} size={120} />
                  {(selectedAnswer === parent2.name || currentMemberResponses[currentQuestion.id] === parent2.name) && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-white rounded-full p-2">
                        <Sparkles className="text-blue-500" size={24} />
                      </div>
                    </div>
                  )}
                </button>
                <p className="mt-3 font-medium text-gray-800">{parent2.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation and Actions */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentQuestionIndex === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-100 text-gray-700'
              }`}
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowBalanceForecast(!showBalanceForecast)}
                disabled={!canShowForecast}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  canShowForecast
                    ? 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={!canShowForecast ? `Need ${10 - totalResponses} more responses` : ''}
              >
                <BarChart3 size={16} />
                View Balance Forecast
              </button>
            </div>

            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === surveyQuestions.length - 1 || !currentMemberResponses[currentQuestion.id]}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentQuestionIndex === surveyQuestions.length - 1 || !currentMemberResponses[currentQuestion.id]
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              Next
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Balance Forecast Preview */}
        {showBalanceForecast && canShowForecast && (
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="mr-2" size={20} />
              Family Balance Forecast
            </h3>
            <div className="space-y-3">
              {parents.map((parent, idx) => {
                const parentKey = parent.email || parent.name;
                const parentResponses = responses[parentKey] || {};
                const parentScore = Object.values(parentResponses).filter(v => v === parent.name).length;
                const shareScore = Object.values(parentResponses).filter(v => v === 'Share').length;

                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{parent.name}</span>
                      <span className="text-sm text-gray-600">{parentScore} tasks</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          idx === 0 ? 'bg-purple-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(parentScore / surveyQuestions.length) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">
                  Based on current responses, your family is tracking towards a
                  <span className="font-semibold text-purple-600"> balanced distribution</span> of responsibilities.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sales Allie Chat Drawer */}
      {showAllie && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowAllie(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">Chat with Allie</h3>
                <button
                  onClick={() => setShowAllie(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <SalesAllieChat
                  isOpen={true}
                  onClose={() => setShowAllie(false)}
                  context={{
                    surveyProgress: currentMemberResponseCount,
                    totalQuestions: surveyQuestions.length,
                    currentQuestion: currentQuestion.text
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingSurvey;