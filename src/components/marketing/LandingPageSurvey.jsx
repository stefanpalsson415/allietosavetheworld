import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ArrowLeft, Scale, BarChart3, Users, ChevronLeft, ChevronRight,
  Sparkles, MessageCircle, Brain, X
} from 'lucide-react';

const LandingPageSurvey = ({ onComplete, onClose }) => {
  // Clear any old quiz data when component mounts
  useEffect(() => {
    // Clear old QuickBalanceQuiz data
    localStorage.removeItem('quickQuizProgress');
    console.log('Cleared old quiz cache');
  }, []);
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
  const [isAnimating, setIsAnimating] = useState(false);
  const [showNameEntry, setShowNameEntry] = useState(true);
  const [partnerNames, setPartnerNames] = useState({
    partner1: '',
    partner2: ''
  });

  // Calculate progress
  const currentQuestion = surveyQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / surveyQuestions.length) * 100;

  // Handle name submission
  const handleNameSubmit = () => {
    if (partnerNames.partner1.trim() && partnerNames.partner2.trim()) {
      setShowNameEntry(false);
    }
  };

  // Handle answer selection
  const handleSelectAnswer = (answer) => {
    setIsAnimating(true);
    setSelectedAnswer(answer);

    // Save response
    setResponses(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));

    // Auto-advance after animation
    setTimeout(() => {
      if (currentQuestionIndex < surveyQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        // All done!
        handleComplete();
      }
      setIsAnimating(false);
    }, 800);
  };

  // Handle navigation
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestion = surveyQuestions[currentQuestionIndex - 1];
      setSelectedAnswer(responses[prevQuestion.id] || null);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < surveyQuestions.length - 1 && responses[currentQuestion.id]) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestion = surveyQuestions[currentQuestionIndex + 1];
      setSelectedAnswer(responses[nextQuestion.id] || null);
    }
  };

  const handleComplete = () => {
    // Calculate simple balance score
    let partner1Score = 0;
    let partner2Score = 0;
    let shareScore = 0;

    Object.values(responses).forEach(answer => {
      if (answer === partnerNames.partner1) {
        partner1Score++;
      } else if (answer === partnerNames.partner2) {
        partner2Score++;
      } else {
        shareScore++;
      }
    });

    const results = {
      partner1: { name: partnerNames.partner1, score: partner1Score },
      partner2: { name: partnerNames.partner2, score: partner2Score },
      shared: shareScore,
      totalQuestions: surveyQuestions.length
    };

    onComplete(results);
  };

  // Render name entry screen
  if (showNameEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>

          {/* Allie Branding */}
          <div className="flex items-center gap-2 mb-6">
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

          <h2 className="text-3xl font-bold mb-6 text-center">Quick Balance Check</h2>
          <p className="text-gray-600 mb-6 text-center">
            Let's discover who's carrying the mental load in your family
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner 1 Name
              </label>
              <input
                type="text"
                value={partnerNames.partner1}
                onChange={(e) => setPartnerNames(prev => ({ ...prev, partner1: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Sarah"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner 2 Name
              </label>
              <input
                type="text"
                value={partnerNames.partner2}
                onChange={(e) => setPartnerNames(prev => ({ ...prev, partner2: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., John"
              />
            </div>
          </div>

          <button
            onClick={handleNameSubmit}
            disabled={!partnerNames.partner1.trim() || !partnerNames.partner2.trim()}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            Start Survey
          </button>
        </div>
      </div>
    );
  }

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
                <span className="font-bold text-xl">Balance Check</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
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
              Mental Load Survey
            </h2>
            <span className="text-sm text-gray-600">
              Question {currentQuestionIndex + 1} of {surveyQuestions.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
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
              {/* Partner 1 */}
              <div className="text-center">
                <button
                  onClick={() => handleSelectAnswer(partnerNames.partner1)}
                  disabled={isAnimating}
                  className={`relative w-56 h-56 rounded-full overflow-hidden transition-all ${
                    selectedAnswer === partnerNames.partner1
                      ? 'ring-4 ring-purple-500 ring-offset-4 scale-105'
                      : 'hover:ring-4 hover:ring-purple-200 hover:ring-offset-4'
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {partnerNames.partner1.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {selectedAnswer === partnerNames.partner1 && (
                    <div className="absolute inset-0 bg-purple-500 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-white rounded-full p-2">
                        <Sparkles className="text-purple-500" size={24} />
                      </div>
                    </div>
                  )}
                </button>
                <p className="mt-3 font-medium text-gray-800">{partnerNames.partner1}</p>
              </div>

              {/* Share Option */}
              <div className="text-center">
                <button
                  onClick={() => handleSelectAnswer('Share')}
                  disabled={isAnimating}
                  className={`w-36 h-36 rounded-full bg-white border-4 transition-all flex flex-col items-center justify-center ${
                    selectedAnswer === 'Share'
                      ? 'border-gray-600 bg-gray-100 scale-105'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Scale size={40} className="text-gray-600 mb-1" />
                  <span className="text-sm font-medium">Share</span>
                </button>
              </div>

              {/* Partner 2 */}
              <div className="text-center">
                <button
                  onClick={() => handleSelectAnswer(partnerNames.partner2)}
                  disabled={isAnimating}
                  className={`relative w-56 h-56 rounded-full overflow-hidden transition-all ${
                    selectedAnswer === partnerNames.partner2
                      ? 'ring-4 ring-blue-500 ring-offset-4 scale-105'
                      : 'hover:ring-4 hover:ring-blue-200 hover:ring-offset-4'
                  }`}
                >
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">
                      {partnerNames.partner2.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {selectedAnswer === partnerNames.partner2 && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <div className="bg-white rounded-full p-2">
                        <Sparkles className="text-blue-500" size={24} />
                      </div>
                    </div>
                  )}
                </button>
                <p className="mt-3 font-medium text-gray-800">{partnerNames.partner2}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
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

            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === surveyQuestions.length - 1 || !responses[currentQuestion.id]}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                currentQuestionIndex === surveyQuestions.length - 1 || !responses[currentQuestion.id]
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              Next
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageSurvey;