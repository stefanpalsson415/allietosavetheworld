import React, { useState, useEffect } from 'react';
import {
  Brain, Sparkles, Scale, ChevronLeft, ChevronRight,
  ArrowRight, X, BarChart3, MessageCircle, Mail,
  Share2, Twitter, Facebook, Linkedin, Copy, Check,
  TrendingUp, Users, Home, Heart
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from 'recharts';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Question data - Same comprehensive 40 questions
const surveyQuestions = [
  // Visible Household Tasks (weight 1-2)
  { id: 'vh1', text: "Who does the dishes?", category: 'Visible Household Tasks', weight: 1, emoji: '🍽️' },
  { id: 'vh2', text: "Who does the laundry?", category: 'Visible Household Tasks', weight: 2, emoji: '🧺' },
  { id: 'vh3', text: "Who vacuums and mops?", category: 'Visible Household Tasks', weight: 1, emoji: '🧹' },
  { id: 'vh4', text: "Who cooks meals?", category: 'Visible Household Tasks', weight: 2, emoji: '👨‍🍳' },
  { id: 'vh5', text: "Who takes out the trash?", category: 'Visible Household Tasks', weight: 1, emoji: '🗑️' },
  { id: 'vh6', text: "Who maintains the yard/garden?", category: 'Visible Household Tasks', weight: 1, emoji: '🌿' },
  { id: 'vh7', text: "Who grocery shops?", category: 'Visible Household Tasks', weight: 2, emoji: '🛒' },
  { id: 'vh8', text: "Who handles home repairs?", category: 'Visible Household Tasks', weight: 2, emoji: '🔧' },
  { id: 'vh9', text: "Who cleans bathrooms?", category: 'Visible Household Tasks', weight: 1, emoji: '🚿' },
  { id: 'vh10', text: "Who organizes closets and storage?", category: 'Visible Household Tasks', weight: 1, emoji: '📦' },

  // Invisible Household Tasks (weight 3-5)
  { id: 'ih1', text: "Who manages the family calendar?", category: 'Invisible Household Tasks', weight: 5, emoji: '📅' },
  { id: 'ih2', text: "Who pays bills and manages finances?", category: 'Invisible Household Tasks', weight: 4, emoji: '💰' },
  { id: 'ih3', text: "Who plans weekly meals?", category: 'Invisible Household Tasks', weight: 4, emoji: '📝' },
  { id: 'ih4', text: "Who keeps track of household supplies and makes shopping lists?", category: 'Invisible Household Tasks', weight: 3, emoji: '📋' },
  { id: 'ih5', text: "Who researches and schedules home maintenance?", category: 'Invisible Household Tasks', weight: 3, emoji: '🏠' },
  { id: 'ih6', text: "Who remembers and plans for special occasions?", category: 'Invisible Household Tasks', weight: 4, emoji: '🎉' },
  { id: 'ih7', text: "Who manages important documents?", category: 'Invisible Household Tasks', weight: 3, emoji: '📂' },
  { id: 'ih8', text: "Who coordinates with service providers (plumbers, electricians)?", category: 'Invisible Household Tasks', weight: 3, emoji: '👷' },
  { id: 'ih9', text: "Who tracks household budget and expenses?", category: 'Invisible Household Tasks', weight: 4, emoji: '💳' },
  { id: 'ih10', text: "Who plans and books family vacations?", category: 'Invisible Household Tasks', weight: 4, emoji: '✈️' },

  // Visible Parental Tasks (weight 1-2)
  { id: 'vp1', text: "Who drives kids to activities?", category: 'Visible Parental Tasks', weight: 2, emoji: '🚗' },
  { id: 'vp2', text: "Who helps with homework?", category: 'Visible Parental Tasks', weight: 2, emoji: '📚' },
  { id: 'vp3', text: "Who does bedtime routines?", category: 'Visible Parental Tasks', weight: 2, emoji: '🛏️' },
  { id: 'vp4', text: "Who prepares school lunches?", category: 'Visible Parental Tasks', weight: 1, emoji: '🥪' },
  { id: 'vp5', text: "Who attends school events?", category: 'Visible Parental Tasks', weight: 2, emoji: '🏫' },
  { id: 'vp6', text: "Who plays with the kids?", category: 'Visible Parental Tasks', weight: 1, emoji: '🎮' },
  { id: 'vp7', text: "Who bathes the children?", category: 'Visible Parental Tasks', weight: 1, emoji: '🛁' },
  { id: 'vp8', text: "Who reads bedtime stories?", category: 'Visible Parental Tasks', weight: 1, emoji: '📖' },
  { id: 'vp9', text: "Who handles morning routines?", category: 'Visible Parental Tasks', weight: 2, emoji: '☀️' },
  { id: 'vp10', text: "Who stays home when kids are sick?", category: 'Visible Parental Tasks', weight: 2, emoji: '🤒' },

  // Invisible Parental Tasks (weight 4-5)
  { id: 'ip1', text: "Who tracks kids' emotional well-being?", category: 'Invisible Parental Tasks', weight: 5, emoji: '❤️' },
  { id: 'ip2', text: "Who schedules doctor appointments?", category: 'Invisible Parental Tasks', weight: 4, emoji: '👨‍⚕️' },
  { id: 'ip3', text: "Who researches schools and programs?", category: 'Invisible Parental Tasks', weight: 4, emoji: '🔍' },
  { id: 'ip4', text: "Who manages kids' social calendars?", category: 'Invisible Parental Tasks', weight: 4, emoji: '👫' },
  { id: 'ip5', text: "Who worries about developmental milestones?", category: 'Invisible Parental Tasks', weight: 5, emoji: '📊' },
  { id: 'ip6', text: "Who communicates with teachers?", category: 'Invisible Parental Tasks', weight: 4, emoji: '👩‍🏫' },
  { id: 'ip7', text: "Who buys clothes and tracks sizes?", category: 'Invisible Parental Tasks', weight: 3, emoji: '👕' },
  { id: 'ip8', text: "Who plans birthday parties?", category: 'Invisible Parental Tasks', weight: 4, emoji: '🎂' },
  { id: 'ip9', text: "Who manages screen time and rules?", category: 'Invisible Parental Tasks', weight: 4, emoji: '📱' },
  { id: 'ip10', text: "Who researches parenting strategies?", category: 'Invisible Parental Tasks', weight: 4, emoji: '📚' }
];

// Modern avatar component
const Avatar = ({ name, color = 'purple', size = 120, isSelected = false }) => {
  const colors = {
    purple: 'from-purple-400 to-purple-600',
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    pink: 'from-pink-400 to-pink-600',
    yellow: 'from-yellow-400 to-yellow-600'
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden transition-all ${
        isSelected ? 'ring-4 ring-offset-4 scale-105' : ''
      }`}
      style={{
        width: size,
        height: size,
        ringColor: isSelected ? (color === 'purple' ? '#9333ea' : '#3b82f6') : ''
      }}
    >
      <div className={`w-full h-full bg-gradient-to-br ${colors[color]} flex items-center justify-center`}>
        <span className="text-white font-bold" style={{ fontSize: size / 3 }}>
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
      {isSelected && (
        <div className="absolute inset-0 bg-white bg-opacity-20 flex items-center justify-center">
          <div className="bg-white rounded-full p-2">
            <Sparkles className={color === 'purple' ? 'text-purple-500' : 'text-blue-500'} size={24} />
          </div>
        </div>
      )}
    </div>
  );
};

const ModernQuickBalanceQuiz = ({ onClose }) => {
  // State management
  const [currentPartner, setCurrentPartner] = useState(1);
  const [currentChild, setCurrentChild] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isChildrenPhase, setIsChildrenPhase] = useState(false);
  const [partnerNames, setPartnerNames] = useState({
    partner1: '',
    partner2: ''
  });
  const [childrenNames, setChildrenNames] = useState([]);
  const [childCount, setChildCount] = useState(0);
  const [responses, setResponses] = useState({
    partner1: {},
    partner2: {},
    children: {}
  });
  const [showNameEntry, setShowNameEntry] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [balanceResults, setBalanceResults] = useState(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Current state helpers
  const currentQuestion = surveyQuestions[currentQuestionIndex];
  const totalResponses = Object.keys(responses.partner1).length + Object.keys(responses.partner2).length;
  const canShowForecast = totalResponses >= 10;

  // Get current member responses
  const getCurrentMemberResponses = () => {
    if (isChildrenPhase) {
      return responses.children[childrenNames[currentChild]] || {};
    }
    return currentPartner === 1 ? responses.partner1 : responses.partner2;
  };

  const currentMemberResponses = getCurrentMemberResponses();
  const currentMemberResponseCount = Object.keys(currentMemberResponses).length;

  // Calculate progress
  const progress = ((currentQuestionIndex + 1) / surveyQuestions.length) * 100;

  // Handle answer selection with animation
  const handleSelectAnswer = (answer) => {
    setIsAnimating(true);
    setSelectedAnswer(answer);

    // Save response
    setTimeout(() => {
      if (isChildrenPhase) {
        setResponses(prev => ({
          ...prev,
          children: {
            ...prev.children,
            [childrenNames[currentChild]]: {
              ...prev.children[childrenNames[currentChild]],
              [currentQuestion.id]: answer
            }
          }
        }));
      } else {
        const partnerKey = currentPartner === 1 ? 'partner1' : 'partner2';
        setResponses(prev => ({
          ...prev,
          [partnerKey]: {
            ...prev[partnerKey],
            [currentQuestion.id]: answer
          }
        }));
      }

      // Auto-advance after animation
      setTimeout(() => {
        if (currentQuestionIndex < surveyQuestions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswer(null);
        } else {
          handlePhaseComplete();
        }
        setIsAnimating(false);
      }, 300);
    }, 500);
  };

  // Handle phase completion
  const handlePhaseComplete = () => {
    if (!isChildrenPhase && currentPartner === 1) {
      // Partner 1 done, switch to Partner 2
      setCurrentPartner(2);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
    } else if (!isChildrenPhase && currentPartner === 2 && childCount > 0) {
      // Partner 2 done, switch to children if any
      setIsChildrenPhase(true);
      setCurrentChild(0);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
    } else if (isChildrenPhase && currentChild < childCount - 1) {
      // Current child done, switch to next child
      setCurrentChild(prev => prev + 1);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
    } else {
      // All done, calculate results
      calculateResults();
    }
  };

  // Calculate balance results
  const calculateResults = () => {
    const categories = {
      'Visible Household Tasks': { partner1: 0, partner2: 0, both: 0, total: 0 },
      'Invisible Household Tasks': { partner1: 0, partner2: 0, both: 0, total: 0 },
      'Visible Parental Tasks': { partner1: 0, partner2: 0, both: 0, total: 0 },
      'Invisible Parental Tasks': { partner1: 0, partner2: 0, both: 0, total: 0 }
    };

    // Process all responses
    surveyQuestions.forEach(question => {
      const category = categories[question.category];

      // Count partner 1 responses
      const p1Answer = responses.partner1[question.id];
      if (p1Answer === partnerNames.partner1) {
        category.partner1 += question.weight;
      } else if (p1Answer === partnerNames.partner2) {
        category.partner2 += question.weight;
      } else if (p1Answer === 'Both Equally') {
        category.both += question.weight;
      }

      // Count partner 2 responses
      const p2Answer = responses.partner2[question.id];
      if (p2Answer === partnerNames.partner1) {
        category.partner1 += question.weight;
      } else if (p2Answer === partnerNames.partner2) {
        category.partner2 += question.weight;
      } else if (p2Answer === 'Both Equally') {
        category.both += question.weight;
      }

      category.total += question.weight * 2; // Both partners answered
    });

    // Calculate balance percentages
    const results = {};
    let overallImbalance = 0;
    let biggestImbalance = { category: '', difference: 0 };

    Object.entries(categories).forEach(([categoryName, data]) => {
      if (data.total > 0) {
        const partner1Share = ((data.partner1 / data.total) * 100).toFixed(0);
        const partner2Share = ((data.partner2 / data.total) * 100).toFixed(0);
        const bothShare = ((data.both / data.total) * 100).toFixed(0);

        const imbalance = Math.abs(partner1Share - partner2Share);
        overallImbalance += imbalance;

        if (imbalance > biggestImbalance.difference) {
          biggestImbalance = {
            category: categoryName,
            difference: imbalance,
            partner1Share,
            partner2Share
          };
        }

        results[categoryName] = {
          partner1Share: parseInt(partner1Share),
          partner2Share: parseInt(partner2Share),
          bothShare: parseInt(bothShare),
          balance: Math.max(0, 100 - imbalance)
        };
      }
    });

    const overallBalance = Math.max(0, Math.round(100 - (overallImbalance / 4)));

    // Generate personalized habits
    const habits = generateHabits(results, partnerNames);

    setBalanceResults({
      categories: results,
      overallBalance,
      biggestImbalance,
      habits
    });
    setShowResults(true);
  };

  // Generate personalized habit recommendations
  const generateHabits = (categoryResults, names) => {
    const habits = [];

    Object.entries(categoryResults).forEach(([category, data]) => {
      if (data.balance < 60) {
        const overloadedPartner = data.partner1Share > data.partner2Share ? names.partner1 : names.partner2;
        const underloadedPartner = data.partner1Share > data.partner2Share ? names.partner2 : names.partner1;

        const categoryHabits = {
          'Visible Household Tasks': [
            `${underloadedPartner} takes over dishwashing duties 3 nights per week`,
            `${underloadedPartner} handles all weekend meal prep`,
            `${underloadedPartner} owns grocery shopping every other week`
          ],
          'Invisible Household Tasks': [
            `${underloadedPartner} manages bill payments and budget tracking`,
            `${underloadedPartner} takes ownership of meal planning`,
            `${underloadedPartner} handles all appointment scheduling`
          ],
          'Visible Parental Tasks': [
            `${underloadedPartner} handles morning routines 3 days per week`,
            `${underloadedPartner} takes all weekend activity driving`,
            `${underloadedPartner} owns bedtime routines on weekdays`
          ],
          'Invisible Parental Tasks': [
            `${underloadedPartner} leads weekly family planning meetings`,
            `${underloadedPartner} manages all school communications`,
            `${underloadedPartner} tracks and orders kids' clothing needs`
          ]
        };

        if (categoryHabits[category]) {
          habits.push({
            title: categoryHabits[category][0],
            category,
            impact: `+${Math.round((100 - data.balance) / 2)}% balance`,
            time: '30 min/day'
          });
        }
      }
    });

    return habits.slice(0, 3);
  };

  // Handle email capture
  const handleEmailCapture = async () => {
    if (!email) return;

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'quiz_results'), {
        email,
        results: balanceResults,
        partnerNames,
        responses,
        timestamp: new Date()
      });

      alert('Results saved! Check your email for the full report.');
      setShowEmailCapture(false);
    } catch (error) {
      console.error('Error saving results:', error);
      alert('Error saving results. Please try again.');
    }
    setIsSaving(false);
  };

  // Navigation handlers
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestion = surveyQuestions[currentQuestionIndex - 1];
      setSelectedAnswer(currentMemberResponses[prevQuestion.id] || null);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < surveyQuestions.length - 1 && currentMemberResponses[currentQuestion.id]) {
      setCurrentQuestionIndex(prev => prev + 1);
      const nextQuestion = surveyQuestions[currentQuestionIndex + 1];
      setSelectedAnswer(currentMemberResponses[nextQuestion.id] || null);
    }
  };

  const handleSkip = () => {
    if (currentQuestionIndex < surveyQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer(null);
    } else {
      handlePhaseComplete();
    }
  };

  // Render name entry screen
  if (showNameEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>

          <div className="flex items-center gap-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain size={28} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-800">Hello, I'm</div>
              <div className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Allie
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-2">Family Balance Quiz</h2>
          <p className="text-gray-600 mb-6">
            Let's discover who's carrying the invisible load in your family. Both partners will answer 40 questions about household and parenting responsibilities.
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many children? (Optional)
              </label>
              <select
                value={childCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  setChildCount(count);
                  setChildrenNames(Array(count).fill('').map((_, i) => `Child ${i + 1}`));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={0}>No children</option>
                <option value={1}>1 child</option>
                <option value={2}>2 children</option>
                <option value={3}>3 children</option>
                <option value={4}>4 children</option>
                <option value={5}>5 children</option>
                <option value={6}>6 children</option>
              </select>
            </div>

            {childCount > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Children's Names</label>
                {childrenNames.map((name, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      const newNames = [...childrenNames];
                      newNames[idx] = e.target.value;
                      setChildrenNames(newNames);
                    }}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    placeholder={`Child ${idx + 1} name`}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowNameEntry(false)}
            disabled={!partnerNames.partner1.trim() || !partnerNames.partner2.trim()}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // Render results screen
  if (showResults && balanceResults) {
    return <QuizResults
      results={balanceResults}
      partnerNames={partnerNames}
      onClose={onClose}
      showEmailCapture={showEmailCapture}
      setShowEmailCapture={setShowEmailCapture}
      email={email}
      setEmail={setEmail}
      handleEmailCapture={handleEmailCapture}
      isSaving={isSaving}
    />;
  }

  // Get current person's name
  const getCurrentPersonName = () => {
    if (isChildrenPhase) {
      return childrenNames[currentChild];
    }
    return currentPartner === 1 ? partnerNames.partner1 : partnerNames.partner2;
  };

  // Render main quiz interface
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Brain size={24} className="text-white" />
                </div>
                <span className="font-bold text-xl">Balance Quiz</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {canShowForecast && !showResults && (
                <button
                  onClick={calculateResults}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  <TrendingUp size={18} />
                  <span>View Balance Forecast</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-800">
              {getCurrentPersonName()}'s Turn
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {surveyQuestions.length}
              </span>
              <div className="bg-purple-100 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-purple-700">
                  {currentMemberResponseCount} answered
                </span>
              </div>
            </div>
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
                  className="hover:scale-105 transition-transform"
                >
                  <Avatar
                    name={partnerNames.partner1}
                    color="purple"
                    isSelected={selectedAnswer === partnerNames.partner1 || currentMemberResponses[currentQuestion.id] === partnerNames.partner1}
                  />
                </button>
                <p className="mt-3 font-medium text-gray-800">{partnerNames.partner1}</p>
              </div>

              {/* Both Equally */}
              <div className="text-center">
                <button
                  onClick={() => handleSelectAnswer('Both Equally')}
                  disabled={isAnimating}
                  className={`w-24 h-24 rounded-full bg-white border-4 transition-all flex flex-col items-center justify-center ${
                    selectedAnswer === 'Both Equally' || currentMemberResponses[currentQuestion.id] === 'Both Equally'
                      ? 'border-gray-600 bg-gray-100 scale-105'
                      : 'border-gray-300 hover:border-gray-400 hover:scale-105'
                  }`}
                >
                  <Scale size={28} className="text-gray-600 mb-1" />
                  <span className="text-sm font-medium">Both Equally</span>
                </button>
              </div>

              {/* Partner 2 */}
              <div className="text-center">
                <button
                  onClick={() => handleSelectAnswer(partnerNames.partner2)}
                  disabled={isAnimating}
                  className="hover:scale-105 transition-transform"
                >
                  <Avatar
                    name={partnerNames.partner2}
                    color="blue"
                    isSelected={selectedAnswer === partnerNames.partner2 || currentMemberResponses[currentQuestion.id] === partnerNames.partner2}
                  />
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
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 px-4 py-2"
            >
              Skip
            </button>

            <button
              onClick={handleNext}
              disabled={!currentMemberResponses[currentQuestion.id]}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                !currentMemberResponses[currentQuestion.id]
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Separate Results Component with modern design
const QuizResults = ({ results, partnerNames, onClose, showEmailCapture, setShowEmailCapture, email, setEmail, handleEmailCapture, isSaving }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const getImbalanceColor = (balance) => {
    if (balance >= 80) return 'text-green-600';
    if (balance >= 60) return 'text-yellow-600';
    if (balance >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  // Prepare data for radar chart
  const radarData = Object.entries(results.categories).map(([category, data]) => ({
    category: category.split(' ').slice(0, 2).join(' '),
    [partnerNames.partner1]: data.partner1Share,
    [partnerNames.partner2]: data.partner2Share,
    balance: data.balance
  }));

  // Social sharing functions
  const shareText = `We just discovered our family balance score is ${results.overallBalance}%! ${
    results.biggestImbalance.partner1Share > 60 ? partnerNames.partner1 : partnerNames.partner2
  } is carrying ${Math.max(results.biggestImbalance.partner1Share, results.biggestImbalance.partner2Share)}% of the ${
    results.biggestImbalance.category.toLowerCase()
  }. Take the quiz to find your invisible imbalances:`;

  const shareUrl = 'https://checkallie.com';

  const handleShare = (platform) => {
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
        break;
      default:
        break;
    }
    setShowShareMenu(false);
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
              <Brain size={28} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold">Your Family Balance Report</h1>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={28} />
          </button>
        </div>

        {/* Main Insight Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-5xl font-bold mb-4">
              <span className={getImbalanceColor(results.overallBalance)}>
                {results.overallBalance}%
              </span>
              <span className="text-gray-700 text-3xl ml-3">Balanced</span>
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              Your family's mental load distribution score
            </p>

            {results.biggestImbalance && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-2xl mx-auto">
                <p className="text-lg font-medium text-red-800">
                  Biggest Imbalance: {results.biggestImbalance.category}
                </p>
                <p className="text-gray-700 mt-1">
                  {results.biggestImbalance.partner1Share > 60 ? partnerNames.partner1 : partnerNames.partner2} is
                  carrying {Math.max(results.biggestImbalance.partner1Share, results.biggestImbalance.partner2Share)}% of this category
                </p>
              </div>
            )}
          </div>

          {/* Radar Chart */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-center">Balance by Category</h3>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="category" className="text-sm" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name={partnerNames.partner1}
                  dataKey={partnerNames.partner1}
                  stroke="#9333ea"
                  fill="#9333ea"
                  fillOpacity={0.3}
                />
                <Radar
                  name={partnerNames.partner2}
                  dataKey={partnerNames.partner2}
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {Object.entries(results.categories).map(([category, data]) => (
            <div key={category} className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-lg mb-4">{category}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{partnerNames.partner1}</span>
                  <span className="font-bold text-purple-600">{data.partner1Share}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">{partnerNames.partner2}</span>
                  <span className="font-bold text-blue-600">{data.partner2Share}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Shared Equally</span>
                  <span className="font-bold text-gray-600">{data.bothShare}%</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Balance Score</span>
                    <span className={`font-bold ${getImbalanceColor(data.balance)}`}>
                      {data.balance}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Habit Recommendations */}
        {results.habits && results.habits.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Recommended Habits to Improve Balance</h2>
            <div className="space-y-4">
              {results.habits.map((habit, idx) => (
                <div key={idx} className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">{habit.title}</h3>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>⏱ {habit.time}</span>
                        <span>📊 {habit.impact}</span>
                        <span>📂 {habit.category}</span>
                      </div>
                    </div>
                    <div className="text-3xl">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-wrap gap-4 justify-center">
            {!showEmailCapture ? (
              <>
                <button
                  onClick={() => setShowEmailCapture(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Mail size={20} />
                  Email Me This Report
                </button>
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Share2 size={20} />
                  Share Results
                </button>
                <a
                  href="/onboarding"
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check size={20} />
                  Start Free Trial
                </a>
              </>
            ) : (
              <div className="w-full max-w-md">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleEmailCapture}
                    disabled={isSaving || !email}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Sending...' : 'Send Report'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Share Menu */}
          {showShareMenu && (
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={() => handleShare('twitter')}
                className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
                title="Share on Twitter"
              >
                <Twitter size={20} />
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
                title="Share on Facebook"
              >
                <Facebook size={20} />
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
                title="Share on LinkedIn"
              >
                <Linkedin size={20} />
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="p-3 bg-gray-100 rounded-lg hover:bg-gray-200"
                title="Copy link"
              >
                {copySuccess ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernQuickBalanceQuiz;