import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Brain, Sparkles, Scale, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  ArrowRight, X, BarChart3, MessageCircle, Mail, TrendingUp, Users, Home,
  Heart, Share2, Twitter, Facebook, Linkedin, Copy, Check, Clock, Target,
  Zap, AlertCircle, CheckCircle, User, Plus
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

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
const Avatar = ({ name, color = 'purple', size = 120, isSelected = false, showCheck = false }) => {
  const colors = {
    purple: 'from-purple-400 to-purple-600',
    blue: 'from-blue-400 to-blue-600',
    green: 'from-green-400 to-green-600',
    pink: 'from-pink-400 to-pink-600',
    yellow: 'from-yellow-400 to-yellow-600'
  };

  const ringColors = {
    purple: 'ring-purple-500',
    blue: 'ring-blue-500',
    green: 'ring-green-500',
    pink: 'ring-pink-500',
    yellow: 'ring-yellow-500'
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden transition-all ${
        isSelected ? `ring-4 ring-offset-4 scale-105 ${ringColors[color]}` : ''
      }`}
      style={{ width: size, height: size }}
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
      {showCheck && (
        <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1.5 shadow-lg border-2 border-white">
          <Check size={20} className="text-white" strokeWidth={3} />
        </div>
      )}
    </div>
  );
};

// Slide-out forecast drawer component
const ForecastDrawer = ({ isOpen, onClose, results, partnerNames }) => {
  if (!results) return null;

  // Prepare data for radar chart - format like the app's balance tab
  const radarData = [
    {
      category: 'Visible\nHousehold',
      [partnerNames.partner1]: results.categories['Visible Household Tasks']?.partner1Share || 0,
      [partnerNames.partner2]: results.categories['Visible Household Tasks']?.partner2Share || 0
    },
    {
      category: 'Invisible\nHousehold',
      [partnerNames.partner1]: results.categories['Invisible Household Tasks']?.partner1Share || 0,
      [partnerNames.partner2]: results.categories['Invisible Household Tasks']?.partner2Share || 0
    },
    {
      category: 'Visible\nParental',
      [partnerNames.partner1]: results.categories['Visible Parental Tasks']?.partner1Share || 0,
      [partnerNames.partner2]: results.categories['Visible Parental Tasks']?.partner2Share || 0
    },
    {
      category: 'Invisible\nParental',
      [partnerNames.partner1]: results.categories['Invisible Parental Tasks']?.partner1Share || 0,
      [partnerNames.partner2]: results.categories['Invisible Parental Tasks']?.partner2Share || 0
    }
  ];

  const getImbalanceColor = (balance) => {
    if (balance >= 80) return 'text-green-600';
    if (balance >= 60) return 'text-yellow-600';
    if (balance >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className={`fixed right-0 top-0 h-full bg-white shadow-2xl z-50 transition-transform duration-300 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`} style={{ width: '420px' }}>
      <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Live Balance Forecast</h3>
              <button onClick={onClose} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {results.overallBalance}%
              </div>
              <div className="text-white/90">Overall Balance Score</div>
            </div>
          </div>

          {/* Radar Chart */}
          <div className="p-6 bg-gray-50">
            <h4 className="font-medium text-gray-700 mb-4">Real-time Balance by Category</h4>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid
                  stroke="#e5e7eb"
                  radialLines={false}
                />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 12 }}
                  className="text-gray-600"
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                  tickCount={5}
                  axisLine={false}
                />
                <Radar
                  name={partnerNames.partner1}
                  dataKey={partnerNames.partner1}
                  stroke="#9333ea"
                  fill="#9333ea"
                  fillOpacity={0.5}
                  strokeWidth={2}
                />
                <Radar
                  name={partnerNames.partner2}
                  dataKey={partnerNames.partner2}
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.5}
                  strokeWidth={2}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Breakdown */}
          <div className="p-6 space-y-4">
            <h4 className="font-medium text-gray-700 mb-4">Category Details</h4>
            {Object.entries(results.categories).map(([category, data]) => (
              <div key={category} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm text-gray-800">{category}</h5>
                  <span className={`text-sm font-bold ${getImbalanceColor(data.balance)}`}>
                    {data.balance}% balanced
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{partnerNames.partner1}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${data.partner1Share}%` }}
                        />
                      </div>
                      <span className="font-medium w-12 text-right">{data.partner1Share}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{partnerNames.partner2}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${data.partner2Share}%` }}
                        />
                      </div>
                      <span className="font-medium w-12 text-right">{data.partner2Share}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Biggest Imbalance Alert */}
          {results.biggestImbalance && results.biggestImbalance.difference > 20 && (
            <div className="mx-6 mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="text-orange-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h5 className="font-medium text-orange-900 mb-1">Biggest Imbalance Detected</h5>
                  <p className="text-sm text-orange-700">
                    {results.biggestImbalance.partner1Share > 60 ? partnerNames.partner1 : partnerNames.partner2} is
                    handling {Math.max(results.biggestImbalance.partner1Share, results.biggestImbalance.partner2Share)}%
                    of {results.biggestImbalance.category.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

// Main Quiz Component
const EnhancedQuickBalanceQuiz = ({ onClose }) => {
  const navigate = useNavigate();

  // State management
  const [currentMember, setCurrentMember] = useState(null); // Current person taking quiz
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [partnerNames, setPartnerNames] = useState({ partner1: '', partner2: '' });
  const [childrenNames, setChildrenNames] = useState([]);
  const [childCount, setChildCount] = useState(0);
  const [responses, setResponses] = useState({});
  const [showNameEntry, setShowNameEntry] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [balanceResults, setBalanceResults] = useState(null);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showForecastDrawer, setShowForecastDrawer] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('quickBalanceQuizData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      if (parsed.timestamp && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) { // 24 hours
        setResponses(parsed.responses || {});
        setPartnerNames(parsed.partnerNames || { partner1: '', partner2: '' });
        setChildrenNames(parsed.childrenNames || []);
        setChildCount(parsed.childCount || 0);
        if (parsed.partnerNames?.partner1 && parsed.partnerNames?.partner2) {
          setShowNameEntry(false);
          // Set first incomplete member as current
          const members = getAllMembers(parsed.partnerNames, parsed.childrenNames);
          const incompleteMember = members.find(m => !isMemberComplete(m, parsed.responses));

          if (!incompleteMember) {
            // All members complete - go straight to results
            setCurrentMember(members[0]);
            // We'll trigger results calculation after state updates
          } else {
            setCurrentMember(incompleteMember);
          }
        }
      } else {
        // Clear old data
        localStorage.removeItem('quickBalanceQuizData');
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!showNameEntry && (partnerNames.partner1 || partnerNames.partner2)) {
      const dataToSave = {
        responses,
        partnerNames,
        childrenNames,
        childCount,
        timestamp: Date.now()
      };
      localStorage.setItem('quickBalanceQuizData', JSON.stringify(dataToSave));
    }
  }, [responses, partnerNames, childrenNames, childCount, showNameEntry]);

  // Clear localStorage only when browser/tab is closed
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Clear quiz data when browser/tab is closing
      localStorage.removeItem('quickBalanceQuizData');
    };

    // Add event listener for browser/tab close
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Check if all members are complete and show results
  useEffect(() => {
    if (!showNameEntry && currentMember && allMembers.length > 0 && !showResults) {
      const allComplete = allMembers.every(m => isMemberComplete(m));
      if (allComplete) {
        // Small delay to ensure state is ready
        setTimeout(() => {
          calculateFinalResults();
        }, 100);
      }
    }
  }, [currentMember, responses, showNameEntry, showResults]);

  // Helper functions
  const getAllMembers = (names = partnerNames, children = childrenNames) => {
    const members = [];
    if (names.partner1) members.push({ name: names.partner1, type: 'parent', id: 'partner1', color: 'purple' });
    if (names.partner2) members.push({ name: names.partner2, type: 'parent', id: 'partner2', color: 'blue' });
    children.forEach((child, idx) => {
      if (child) members.push({ name: child, type: 'child', id: `child${idx}`, color: 'green' });
    });
    return members;
  };

  const isMemberComplete = (member, resp = responses) => {
    const memberResponses = resp[member.id] || {};
    return Object.keys(memberResponses).length === surveyQuestions.length;
  };

  const getCurrentMemberResponses = () => {
    if (!currentMember) return {};
    return responses[currentMember.id] || {};
  };

  // Calculate current state
  const allMembers = getAllMembers();
  const currentQuestion = surveyQuestions[currentQuestionIndex];
  const currentMemberResponses = getCurrentMemberResponses();
  const currentMemberResponseCount = Object.keys(currentMemberResponses).length;
  const progress = ((currentQuestionIndex + 1) / surveyQuestions.length) * 100;

  // Calculate total responses for forecast drawer
  const totalResponses = useMemo(() => {
    return Object.values(responses).reduce((sum, memberResponses) => {
      return sum + Object.keys(memberResponses).length;
    }, 0);
  }, [responses]);

  // Calculate live balance results
  const liveBalanceResults = useMemo(() => {
    if (totalResponses < 10) return null;

    const categories = {
      'Visible Household Tasks': { partner1: 0, partner2: 0, both: 0, total: 0 },
      'Invisible Household Tasks': { partner1: 0, partner2: 0, both: 0, total: 0 },
      'Visible Parental Tasks': { partner1: 0, partner2: 0, both: 0, total: 0 },
      'Invisible Parental Tasks': { partner1: 0, partner2: 0, both: 0, total: 0 }
    };

    // Process all responses
    surveyQuestions.forEach(question => {
      const category = categories[question.category];

      // Process each member's responses
      Object.entries(responses).forEach(([memberId, memberResponses]) => {
        const answer = memberResponses[question.id];
        if (answer === partnerNames.partner1) {
          category.partner1 += question.weight;
        } else if (answer === partnerNames.partner2) {
          category.partner2 += question.weight;
        } else if (answer === 'Both Equally') {
          category.both += question.weight;
        }
        if (answer) {
          category.total += question.weight;
        }
      });
    });

    // Calculate balance percentages
    const results = {};
    let overallImbalance = 0;
    let biggestImbalance = { category: '', difference: 0 };

    Object.entries(categories).forEach(([categoryName, data]) => {
      if (data.total > 0) {
        // Calculate raw percentages
        const partner1Raw = (data.partner1 / data.total) * 100;
        const partner2Raw = (data.partner2 / data.total) * 100;
        const bothRaw = (data.both / data.total) * 100;

        // Round them
        let partner1Share = Math.round(partner1Raw);
        let partner2Share = Math.round(partner2Raw);
        let bothShare = Math.round(bothRaw);

        // Ensure they sum to 100%
        const sum = partner1Share + partner2Share + bothShare;
        if (sum !== 100 && sum > 0) {
          // Adjust the largest value to make it exactly 100%
          const diff = 100 - sum;
          if (partner1Share >= partner2Share && partner1Share >= bothShare) {
            partner1Share += diff;
          } else if (partner2Share >= bothShare) {
            partner2Share += diff;
          } else {
            bothShare += diff;
          }
        }

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
          partner1Share,
          partner2Share,
          bothShare,
          balance: Math.max(0, 100 - imbalance)
        };
      }
    });

    const overallBalance = Math.max(0, Math.round(100 - (overallImbalance / 4)));

    return {
      categories: results,
      overallBalance,
      biggestImbalance
    };
  }, [responses, totalResponses, partnerNames]);

  // Auto-show forecast drawer after 10 responses
  useEffect(() => {
    if (totalResponses === 10 && !showForecastDrawer && !showResults) {
      setShowForecastDrawer(true);
    }
  }, [totalResponses, showForecastDrawer, showResults]);

  // Handle answer selection with animation
  const handleSelectAnswer = (answer) => {
    if (!currentMember) return;

    setIsAnimating(true);
    setSelectedAnswer(answer);

    // Save response
    setTimeout(() => {
      setResponses(prev => ({
        ...prev,
        [currentMember.id]: {
          ...prev[currentMember.id],
          [currentQuestion.id]: answer
        }
      }));

      // Auto-advance after animation
      setTimeout(() => {
        if (currentQuestionIndex < surveyQuestions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
          setSelectedAnswer(null);
        } else {
          // Current member finished
          handleMemberComplete();
        }
        setIsAnimating(false);
      }, 300);
    }, 500);
  };

  // Handle member completion
  const handleMemberComplete = () => {
    const incompleteMember = allMembers.find(m => m.id !== currentMember.id && !isMemberComplete(m));
    if (incompleteMember) {
      setCurrentMember(incompleteMember);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
    } else {
      // All members complete
      calculateFinalResults();
    }
  };

  // Switch to different member
  const switchMember = (member) => {
    if (!isMemberComplete(member)) {
      setCurrentMember(member);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
    } else if (allMembers.every(m => isMemberComplete(m))) {
      // If switching to a complete member and all are complete, show results
      calculateFinalResults();
    }
  };

  // Calculate final results
  const calculateFinalResults = () => {
    const results = liveBalanceResults || calculateResults();
    setBalanceResults(results);
    setShowResults(true);
  };

  // Calculate results (fallback if not using live)
  const calculateResults = () => {
    // Same calculation as liveBalanceResults
    const categories = {
      'Visible Household Tasks': { partner1: 0, partner2: 0, both: 0, total: 0 },
      'Invisible Household Tasks': { partner1: 0, partner2: 0, both: 0, total: 0 },
      'Visible Parental Tasks': { partner1: 0, partner2: 0, both: 0, total: 0 },
      'Invisible Parental Tasks': { partner1: 0, partner2: 0, both: 0, total: 0 }
    };

    surveyQuestions.forEach(question => {
      const category = categories[question.category];
      Object.entries(responses).forEach(([memberId, memberResponses]) => {
        const answer = memberResponses[question.id];
        if (answer === partnerNames.partner1) {
          category.partner1 += question.weight;
        } else if (answer === partnerNames.partner2) {
          category.partner2 += question.weight;
        } else if (answer === 'Both Equally') {
          category.both += question.weight;
        }
        if (answer) category.total += question.weight;
      });
    });

    const results = {};
    let overallImbalance = 0;
    let biggestImbalance = { category: '', difference: 0 };

    Object.entries(categories).forEach(([categoryName, data]) => {
      if (data.total > 0) {
        const partner1Share = Math.round((data.partner1 / data.total) * 100);
        const partner2Share = Math.round((data.partner2 / data.total) * 100);
        const bothShare = Math.round((data.both / data.total) * 100);
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
          partner1Share,
          partner2Share,
          bothShare,
          balance: Math.max(0, 100 - imbalance),
          rawData: data
        };
      }
    });

    const overallBalance = Math.max(0, Math.round(100 - (overallImbalance / 4)));
    const habits = generateHabits(results, partnerNames);

    return {
      categories: results,
      overallBalance,
      biggestImbalance,
      habitRecommendations: habits  // Firebase function expects this name
    };
  };

  // Generate personalized habit recommendations (3 for each partner)
  const generateHabits = (categoryResults, names) => {
    const habits = [];

    // Find the most imbalanced categories
    const imbalancedCategories = Object.entries(categoryResults)
      .map(([category, data]) => ({
        category,
        data,
        imbalance: Math.abs(data.partner1Share - data.partner2Share)
      }))
      .sort((a, b) => b.imbalance - a.imbalance);

    // Generate habits for the top 2 most imbalanced categories
    imbalancedCategories.slice(0, 2).forEach(({ category, data }) => {
      const overloadedPartner = data.partner1Share > data.partner2Share ? names.partner1 : names.partner2;
      const underloadedPartner = data.partner1Share > data.partner2Share ? names.partner2 : names.partner1;
      const difference = Math.abs(data.partner1Share - data.partner2Share);

        const categoryHabits = {
          'Visible Household Tasks': [
            {
              title: `${underloadedPartner} takes over dishwashing duties`,
              description: 'Handle all evening dish cleanup 3 nights per week',
              time: '20 min/day',
              impact: Math.round(difference * 0.3)
            },
            {
              title: `${underloadedPartner} owns weekend meal prep`,
              description: 'Plan and prepare all weekend meals for the family',
              time: '2 hours/week',
              impact: Math.round(difference * 0.4)
            }
          ],
          'Invisible Household Tasks': [
            {
              title: `${underloadedPartner} manages monthly bills`,
              description: 'Take ownership of all bill payments and budget tracking',
              time: '1 hour/week',
              impact: Math.round(difference * 0.5)
            },
            {
              title: `${underloadedPartner} handles meal planning`,
              description: 'Plan weekly meals and create shopping lists',
              time: '30 min/week',
              impact: Math.round(difference * 0.4)
            }
          ],
          'Visible Parental Tasks': [
            {
              title: `${underloadedPartner} does morning routines`,
              description: 'Handle wake-up, breakfast, and school prep 3 days/week',
              time: '45 min/day',
              impact: Math.round(difference * 0.4)
            },
            {
              title: `${underloadedPartner} takes weekend activities`,
              description: 'Drive to all weekend sports and activities',
              time: '3 hours/week',
              impact: Math.round(difference * 0.3)
            }
          ],
          'Invisible Parental Tasks': [
            {
              title: `${underloadedPartner} owns school communications`,
              description: 'Manage all teacher emails and school portal',
              time: '30 min/week',
              impact: Math.round(difference * 0.5)
            },
            {
              title: `${underloadedPartner} tracks appointments`,
              description: 'Schedule and manage all medical/dental visits',
              time: '1 hour/month',
              impact: Math.round(difference * 0.4)
            }
          ]
        };

      if (categoryHabits[category]) {
        habits.push(...categoryHabits[category].map(habit => ({
          ...habit,
          category,
          partner: underloadedPartner,
          forPartner: underloadedPartner  // Who should do this habit
        })));
      }
    });

    // Return top 6 habits (3 for each partner) sorted by impact
    // Ensure we have at least 6 habits by duplicating if necessary
    const sortedHabits = habits.sort((a, b) => b.impact - a.impact);

    // If we don't have enough habits, generate more generic ones
    if (sortedHabits.length < 6) {
      const partner1Habits = sortedHabits.filter(h => h.forPartner === names.partner1);
      const partner2Habits = sortedHabits.filter(h => h.forPartner === names.partner2);

      // Add generic habits if needed
      if (partner1Habits.length < 3) {
        sortedHabits.push({
          title: `${names.partner1} schedules weekly check-ins`,
          description: 'Set aside 15 minutes weekly to review task distribution',
          time: '15 min/week',
          impact: 10,
          forPartner: names.partner1
        });
      }
      if (partner2Habits.length < 3) {
        sortedHabits.push({
          title: `${names.partner2} creates shared task list`,
          description: 'Maintain a visible list of household responsibilities',
          time: '10 min/week',
          impact: 10,
          forPartner: names.partner2
        });
      }
    }

    return sortedHabits.slice(0, 6);
  };

  // Handle email capture - format and send results
  const handleEmailCapture = async () => {
    if (!email) return;

    setIsSaving(true);
    try {
      // Format the email content
      const formatEmailContent = () => {
        const biggest = balanceResults?.biggestImbalance;
        const overloaded = biggest?.partner1Share > biggest?.partner2Share
          ? partnerNames.partner1 : partnerNames.partner2;

        let html = `
          <h2>Your Family Balance Report</h2>
          <p><strong>Overall Balance Score: ${balanceResults?.overallBalance}%</strong></p>

          <h3>Key Finding:</h3>
          <p>${overloaded} is carrying ${Math.max(biggest?.partner1Share || 0, biggest?.partner2Share || 0)}%
          of ${biggest?.category}</p>

          <h3>Category Breakdown:</h3>
          <ul>
        `;

        Object.entries(balanceResults?.categories || {}).forEach(([category, data]) => {
          html += `<li><strong>${category}:</strong>
            ${partnerNames.partner1} ${data.partner1Share}% |
            ${partnerNames.partner2} ${data.partner2Share}% |
            Shared ${data.bothShare}%</li>`;
        });

        html += `</ul>
          <h3>Top 3 Recommendations:</h3>
          <ol>`;

        (balanceResults?.habitRecommendations || []).forEach(habit => {
          html += `<li><strong>${habit.title}</strong><br>
            ${habit.description}<br>
            <em>Impact: ${habit.impact}</em></li>`;
        });

        html += `</ol>
          <p>Ready to balance your family's mental load?
          <a href="https://checkallie.com">Sign up for Allie</a></p>`;

        return html;
      };

      // Send email via Firebase Function
      // Call the existing sendQuizReport function (in europe-west1)
      try {
        const response = await fetch('https://europe-west1-parentload-ba995.cloudfunctions.net/sendQuizReport', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            partnerNames,
            results: balanceResults,
            quizId: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          })
        });

        if (!response.ok) {
          console.error('Email send failed:', await response.text());
        }
      } catch (emailError) {
        console.error('Could not send email:', emailError);
        // Continue anyway - don't block the user
      }

      // DON'T clear localStorage - keep data until browser closes
      // localStorage.removeItem('quickBalanceQuizData');

      // Stay on the report page - don't navigate away
      // Only navigate to onboarding when they click "Start Trial"
      setShowEmailCapture(false);

      // Show success message in-app (not browser alert)
      setEmailSentSuccess(true);
      setTimeout(() => setEmailSentSuccess(false), 5000);
    } catch (error) {
      console.error('Error processing request:', error);
      // Don't show alert for navigation errors
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
      handleMemberComplete();
    }
  };

  // Keyboard shortcuts - use first letter of names
  useEffect(() => {
    if (showNameEntry || showResults || isAnimating || !currentMember || !currentQuestion) return;

    const handleKeyPress = (e) => {
      // Get first letters (case-insensitive)
      const partner1Key = partnerNames.partner1?.charAt(0).toLowerCase();
      const partner2Key = partnerNames.partner2?.charAt(0).toLowerCase();

      const key = e.key.toLowerCase();

      // Check for partner 1 shortcut
      if (key === partner1Key && partnerNames.partner1) {
        handleSelectAnswer(partnerNames.partner1);
      }
      // Check for partner 2 shortcut
      else if (key === partner2Key && partnerNames.partner2) {
        handleSelectAnswer(partnerNames.partner2);
      }
      // 'b' for Both Equally
      else if (key === 'b') {
        handleSelectAnswer('Both Equally');
      }
      // Arrow keys for navigation
      else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
      else if (e.key === 'ArrowRight' && currentMemberResponses[currentQuestion?.id]) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showNameEntry, showResults, isAnimating, currentMember, partnerNames, currentQuestion, currentMemberResponses, handleSelectAnswer, handlePrevious, handleNext]);

  // Render name entry screen
  if (showNameEntry) {
    return <NameEntryScreen
      partnerNames={partnerNames}
      setPartnerNames={setPartnerNames}
      childCount={childCount}
      setChildCount={setChildCount}
      childrenNames={childrenNames}
      setChildrenNames={setChildrenNames}
      onComplete={() => {
        const members = getAllMembers();
        setCurrentMember(members[0]);
        setShowNameEntry(false);
      }}
      onClose={onClose}
    />;
  }

  // Render results screen
  if (showResults && balanceResults) {
    return <ComprehensiveResults
      results={balanceResults}
      partnerNames={partnerNames}
      responses={responses}
      onClose={onClose}
      showEmailCapture={showEmailCapture}
      setShowEmailCapture={setShowEmailCapture}
      email={email}
      setEmail={setEmail}
      handleEmailCapture={handleEmailCapture}
      isSaving={isSaving}
      expandedCategory={expandedCategory}
      setExpandedCategory={setExpandedCategory}
      allMembers={allMembers}
      emailSentSuccess={emailSentSuccess}
    />;
  }

  // Render main quiz interface
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white relative overflow-hidden">
      {/* Main content wrapper that shifts when drawer opens */}
      <div className={`transition-all duration-300 ${
        showForecastDrawer ? 'mr-[420px]' : 'mr-0'
      }`}>
      {/* Header - Fixed single X button issue */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-30">
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

            {/* Member Switcher */}
            <div className="flex items-center gap-2">
              {allMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => switchMember(member)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                    currentMember?.id === member.id
                      ? 'bg-purple-600 text-white'
                      : isMemberComplete(member)
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Avatar
                    name={member.name}
                    color={member.color}
                    size={20}
                    showCheck={isMemberComplete(member)}
                  />
                  <span>{member.name}</span>
                  <span className="text-xs opacity-75">
                    ({Object.keys(responses[member.id] || {}).length}/{surveyQuestions.length})
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {totalResponses >= 10 && !showResults && (
                <button
                  onClick={() => setShowForecastDrawer(!showForecastDrawer)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                >
                  <TrendingUp size={18} />
                  <span>Balance Forecast</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-2"
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
              {currentMember?.name}'s Turn
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
                <p className="text-xs text-gray-500 mt-1">Press {partnerNames.partner1.charAt(0).toUpperCase()}</p>
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
                <p className="text-xs text-gray-500 mt-1">Press B</p>
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
                <p className="text-xs text-gray-500 mt-1">Press {partnerNames.partner2.charAt(0).toUpperCase()}</p>
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

      {/* Forecast Drawer - slides in from right */}
      <ForecastDrawer
        isOpen={showForecastDrawer}
        onClose={() => setShowForecastDrawer(false)}
        results={liveBalanceResults}
        partnerNames={partnerNames}
      />
    </div>
  );
};

// Name Entry Screen Component
const NameEntryScreen = ({ partnerNames, setPartnerNames, childCount, setChildCount, childrenNames, setChildrenNames, onComplete, onClose }) => {
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
          onClick={onComplete}
          disabled={!partnerNames.partner1.trim() || !partnerNames.partner2.trim()}
          className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Quiz
        </button>
      </div>
    </div>
  );
};

// Comprehensive Results Component (like Balance & Habits tab)
const ComprehensiveResults = ({
  results,
  partnerNames,
  responses,
  onClose,
  showEmailCapture,
  setShowEmailCapture,
  email,
  setEmail,
  handleEmailCapture,
  isSaving,
  expandedCategory,
  setExpandedCategory,
  allMembers,
  emailSentSuccess
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const getImbalanceColor = (balance) => {
    if (balance >= 80) return 'text-green-600';
    if (balance >= 60) return 'text-yellow-600';
    if (balance >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBalanceStatus = (balance) => {
    if (balance >= 80) return { text: 'Excellent', color: 'text-green-600', bg: 'bg-green-50' };
    if (balance >= 60) return { text: 'Good', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (balance >= 40) return { text: 'Needs Attention', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { text: 'Critical', color: 'text-red-600', bg: 'bg-red-50' };
  };

  // Get questions for a category
  const getCategoryQuestions = (category) => {
    return surveyQuestions.filter(q => q.category === category);
  };

  // Calculate detailed breakdown for a category
  const getCategoryBreakdown = (category) => {
    const questions = getCategoryQuestions(category);
    const breakdown = questions.map(question => {
      const answers = {};
      Object.entries(responses).forEach(([memberId, memberResponses]) => {
        const answer = memberResponses[question.id];
        if (answer) {
          answers[memberId] = answer;
        }
      });
      return {
        question: question.text,
        emoji: question.emoji,
        weight: question.weight,
        answers
      };
    });
    return breakdown;
  };

  // Social sharing
  const shareText = `We just discovered our family balance score is ${results.overallBalance}%! Take the quiz to find your invisible imbalances:`;
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
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                <Brain size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Your Family Balance Report</h1>
                <p className="text-sm text-gray-600">Comprehensive mental load analysis</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-2">
              <X size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overall Score Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 mb-4">
              <span className={`text-5xl font-bold ${getImbalanceColor(results.overallBalance)}`}>
                {results.overallBalance}%
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-2">Overall Family Balance</h2>
            <p className="text-lg text-gray-600">
              Your family's mental load distribution score
            </p>
            <div className={`inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full ${getBalanceStatus(results.overallBalance).bg}`}>
              <CheckCircle className={`${getBalanceStatus(results.overallBalance).color}`} size={20} />
              <span className={`font-medium ${getBalanceStatus(results.overallBalance).color}`}>
                {getBalanceStatus(results.overallBalance).text}
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {Object.values(responses).reduce((sum, r) => sum + Object.keys(r).length, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Responses</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {allMembers.length}
              </div>
              <div className="text-sm text-gray-600">Family Members</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {results.habits?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Recommended Habits</div>
            </div>
          </div>

          {/* Biggest Imbalance Alert */}
          {results.biggestImbalance && results.biggestImbalance.difference > 20 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start">
                <AlertCircle className="text-red-600 mr-3 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h3 className="font-medium text-red-900 mb-1">Critical Imbalance Detected</h3>
                  <p className="text-red-700">
                    {results.biggestImbalance.partner1Share > 60 ? partnerNames.partner1 : partnerNames.partner2} is
                    carrying {Math.max(results.biggestImbalance.partner1Share, results.biggestImbalance.partner2Share)}%
                    of {results.biggestImbalance.category.toLowerCase()}. This needs immediate attention.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Category Cards with Deep Dive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {Object.entries(results.categories).map(([category, data]) => {
            const status = getBalanceStatus(data.balance);
            const isExpanded = expandedCategory === category;
            const breakdown = isExpanded ? getCategoryBreakdown(category) : null;

            return (
              <div key={category} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Category Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{category}</h3>
                      <div className={`inline-flex items-center gap-1 mt-1 text-sm ${status.color}`}>
                        {data.balance >= 60 ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                        <span>{status.text} - {data.balance}% balanced</span>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>

                  {/* Balance Bars */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 w-20">{partnerNames.partner1}</span>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${data.partner1Share}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-bold text-purple-600 w-12 text-right">{data.partner1Share}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 w-20">{partnerNames.partner2}</span>
                      <div className="flex-1 mx-3">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${data.partner2Share}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-bold text-blue-600 w-12 text-right">{data.partner2Share}%</span>
                    </div>
                    {data.bothShare > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-20">Shared</span>
                        <div className="flex-1 mx-3">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gray-500 h-3 rounded-full transition-all duration-500"
                              style={{ width: `${data.bothShare}%` }}
                            />
                          </div>
                        </div>
                        <span className="font-bold text-gray-600 w-12 text-right">{data.bothShare}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && breakdown && (
                  <div className="border-t border-gray-200">
                    <div className="p-6 bg-gray-50">
                      <h4 className="font-medium text-gray-700 mb-4">Task Breakdown</h4>
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {breakdown.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3">
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">{item.emoji}</span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 mb-2">{item.question}</p>
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(item.answers).map(([memberId, answer]) => {
                                    const member = allMembers.find(m => m.id === memberId);
                                    return (
                                      <span key={memberId} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                        {member?.name}: <strong>{answer}</strong>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">Weight: {item.weight}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggested Habits for this Category */}
                    {results.habits && results.habits.filter(h => h.category === category).length > 0 && (
                      <div className="p-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-700 mb-4">Recommended Habits to Improve Balance</h4>
                        <div className="space-y-3">
                          {results.habits.filter(h => h.category === category).map((habit, idx) => (
                            <div key={idx} className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-bold text-purple-900 mb-1">{habit.title}</h5>
                                  <p className="text-sm text-purple-700 mb-2">{habit.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-purple-600">
                                    <span className="flex items-center gap-1">
                                      <Clock size={14} />
                                      {habit.time}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Target size={14} />
                                      +{habit.impact}% balance
                                    </span>
                                  </div>
                                </div>
                                <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700">
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Top 3 Habits Section */}
        {results.habits && results.habits.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Top Habits to Improve Balance</h2>
                <p className="text-gray-600">Start with these high-impact changes</p>
              </div>
              <Zap className="text-yellow-500" size={32} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {results.habits.slice(0, 3).map((habit, idx) => (
                <div key={idx} className="relative bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                  <div className="absolute top-4 right-4 text-3xl">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <h3 className="font-bold text-lg mb-2 pr-8">{habit.title}</h3>
                  <p className="text-sm text-gray-700 mb-4">{habit.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="text-gray-500" size={16} />
                      <span>{habit.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Target className="text-gray-500" size={16} />
                      <span className="font-medium text-green-600">+{habit.impact}% balance improvement</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="text-gray-500" size={16} />
                      <span>Assigned to: {habit.partner}</span>
                    </div>
                  </div>
                  <button className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                    <Plus size={16} />
                    Add to My Habits
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col items-center text-center">
            <h3 className="text-xl font-bold mb-2">Ready to Balance Your Family's Mental Load?</h3>
            <p className="text-gray-600 mb-6">Get personalized support and automated task management with Allie</p>

            {!showEmailCapture ? (
              <div className="flex flex-wrap gap-4 justify-center">
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
                <button
                  onClick={() => {
                    localStorage.removeItem('quickBalanceQuizData');
                    window.location.href = '/onboarding';
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Check size={20} />
                  Start Free Trial
                </button>
              </div>
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
                    {isSaving ? 'Sending...' : 'Send & Continue'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  We'll email your report and start your free trial
                </p>
                {emailSentSuccess && (
                  <div className="mt-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                    ✓ Your report has been emailed! Check your inbox.
                  </div>
                )}
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

export default EnhancedQuickBalanceQuiz;