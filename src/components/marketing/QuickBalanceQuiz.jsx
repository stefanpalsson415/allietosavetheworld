import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowLeft, Users, Brain, Home, Baby,
  Eye, EyeOff, CheckCircle, Mail, Share2, ChevronRight,
  Sparkles, TrendingUp, Clock, BarChart3, Twitter, Facebook, Linkedin, Copy
} from 'lucide-react';
import {
  ResponsiveContainer, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Define all 40 questions covering all aspects of parental load
const QUIZ_QUESTIONS = [
  // VISIBLE HOUSEHOLD TASKS (10 questions)
  { id: 'vh_1', category: 'visible_household', text: "Who usually cooks dinner for the family?", weight: 3 },
  { id: 'vh_2', category: 'visible_household', text: "Who does the grocery shopping?", weight: 2 },
  { id: 'vh_3', category: 'visible_household', text: "Who washes the dishes after meals?", weight: 2 },
  { id: 'vh_4', category: 'visible_household', text: "Who does the laundry (washing, drying, folding)?", weight: 3 },
  { id: 'vh_5', category: 'visible_household', text: "Who cleans the bathrooms?", weight: 2 },
  { id: 'vh_6', category: 'visible_household', text: "Who vacuums and mops the floors?", weight: 2 },
  { id: 'vh_7', category: 'visible_household', text: "Who takes out the trash and recycling?", weight: 1 },
  { id: 'vh_8', category: 'visible_household', text: "Who handles yard work or outdoor maintenance?", weight: 2 },
  { id: 'vh_9', category: 'visible_household', text: "Who makes the beds and tidies bedrooms?", weight: 1 },
  { id: 'vh_10', category: 'visible_household', text: "Who manages pet care (feeding, walking, vet visits)?", weight: 2 },

  // INVISIBLE HOUSEHOLD TASKS (10 questions)
  { id: 'ih_1', category: 'invisible_household', text: "Who creates the weekly meal plan?", weight: 4 },
  { id: 'ih_2', category: 'invisible_household', text: "Who manages the family calendar and schedules?", weight: 5 },
  { id: 'ih_3', category: 'invisible_household', text: "Who keeps track of household supplies and makes shopping lists?", weight: 3 },
  { id: 'ih_4', category: 'invisible_household', text: "Who remembers and plans for birthdays and special occasions?", weight: 4 },
  { id: 'ih_5', category: 'invisible_household', text: "Who researches products before major purchases?", weight: 3 },
  { id: 'ih_6', category: 'invisible_household', text: "Who handles household finances and pays bills?", weight: 5 },
  { id: 'ih_7', category: 'invisible_household', text: "Who coordinates home repairs and maintenance schedules?", weight: 3 },
  { id: 'ih_8', category: 'invisible_household', text: "Who manages family medical records and insurance?", weight: 4 },
  { id: 'ih_9', category: 'invisible_household', text: "Who maintains relationships with extended family?", weight: 3 },
  { id: 'ih_10', category: 'invisible_household', text: "Who plans and organizes family vacations?", weight: 3 },

  // VISIBLE PARENTAL TASKS (10 questions)
  { id: 'vp_1', category: 'visible_parental', text: "Who drives children to school and activities?", weight: 3 },
  { id: 'vp_2', category: 'visible_parental', text: "Who helps with homework and school projects?", weight: 4 },
  { id: 'vp_3', category: 'visible_parental', text: "Who prepares school lunches and snacks?", weight: 3 },
  { id: 'vp_4', category: 'visible_parental', text: "Who handles morning routines (getting kids ready)?", weight: 4 },
  { id: 'vp_5', category: 'visible_parental', text: "Who manages bedtime routines?", weight: 4 },
  { id: 'vp_6', category: 'visible_parental', text: "Who attends school events and parent-teacher conferences?", weight: 3 },
  { id: 'vp_7', category: 'visible_parental', text: "Who takes children to medical appointments?", weight: 3 },
  { id: 'vp_8', category: 'visible_parental', text: "Who supervises playdates and social activities?", weight: 3 },
  { id: 'vp_9', category: 'visible_parental', text: "Who shops for children's clothes and supplies?", weight: 2 },
  { id: 'vp_10', category: 'visible_parental', text: "Who handles discipline and behavior management?", weight: 4 },

  // INVISIBLE PARENTAL TASKS (10 questions)
  { id: 'ip_1', category: 'invisible_parental', text: "Who notices when a child is struggling emotionally?", weight: 5 },
  { id: 'ip_2', category: 'invisible_parental', text: "Who researches parenting strategies and child development?", weight: 4 },
  { id: 'ip_3', category: 'invisible_parental', text: "Who tracks each child's emotional triggers and needs?", weight: 5 },
  { id: 'ip_4', category: 'invisible_parental', text: "Who coordinates with teachers about academic progress?", weight: 4 },
  { id: 'ip_5', category: 'invisible_parental', text: "Who anticipates developmental milestones and needs?", weight: 4 },
  { id: 'ip_6', category: 'invisible_parental', text: "Who manages screen time and technology boundaries?", weight: 3 },
  { id: 'ip_7', category: 'invisible_parental', text: "Who plans for children's future (college, savings)?", weight: 4 },
  { id: 'ip_8', category: 'invisible_parental', text: "Who mediates sibling conflicts?", weight: 4 },
  { id: 'ip_9', category: 'invisible_parental', text: "Who monitors children's friendships and social dynamics?", weight: 4 },
  { id: 'ip_10', category: 'invisible_parental', text: "Who carries the worry about children's wellbeing?", weight: 5 }
];

const QuickBalanceQuiz = ({ onClose }) => {
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

  // Save progress to localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('quickQuizProgress');
    if (savedState) {
      const parsed = JSON.parse(savedState);
      setResponses(parsed.responses || { partner1: {}, partner2: {}, children: {} });
      setPartnerNames(parsed.partnerNames || { partner1: '', partner2: '' });
      setChildrenNames(parsed.childrenNames || []);
      setChildCount(parsed.childCount || 0);
      setCurrentPartner(parsed.currentPartner || 1);
      setCurrentQuestionIndex(parsed.currentQuestionIndex || 0);
      if (parsed.partnerNames?.partner1 && parsed.partnerNames?.partner2) {
        setShowNameEntry(false);
      }
    }
  }, []);

  // Save progress on change
  useEffect(() => {
    if (!showNameEntry && !showResults) {
      localStorage.setItem('quickQuizProgress', JSON.stringify({
        responses,
        partnerNames,
        childrenNames,
        childCount,
        currentPartner,
        currentQuestionIndex
      }));
    }
  }, [responses, partnerNames, currentPartner, currentQuestionIndex, showNameEntry, showResults]);

  // Handle name submission
  const handleNameSubmit = () => {
    if (partnerNames.partner1.trim() && partnerNames.partner2.trim()) {
      setShowNameEntry(false);
    }
  };

  // Handle answer selection
  const handleAnswer = (answer) => {
    const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];

    if (isChildrenPhase) {
      // Child is answering
      const childName = childrenNames[currentChild];
      setResponses(prev => ({
        ...prev,
        children: {
          ...prev.children,
          [childName]: {
            ...prev.children[childName],
            [currentQuestion.id]: answer
          }
        }
      }));

      // Move to next question or next child
      if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else if (currentChild < childrenNames.filter(n => n.trim()).length - 1) {
        // Switch to next child
        setCurrentChild(currentChild + 1);
        setCurrentQuestionIndex(0);
      } else {
        // All children complete - calculate results
        calculateResults();
      }
    } else {
      // Partner is answering
      const partnerKey = `partner${currentPartner}`;
      setResponses(prev => ({
        ...prev,
        [partnerKey]: {
          ...prev[partnerKey],
          [currentQuestion.id]: answer
        }
      }));

      // Move to next question or partner
      if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else if (currentPartner === 1) {
        // Switch to partner 2
        setCurrentPartner(2);
        setCurrentQuestionIndex(0);
      } else if (childrenNames.filter(n => n.trim()).length > 0) {
        // Switch to children phase if there are children
        setIsChildrenPhase(true);
        setCurrentChild(0);
        setCurrentQuestionIndex(0);
      } else {
        // No children - calculate results
        calculateResults();
      }
    }
  };

  // Calculate balance scores
  const calculateResults = () => {
    const results = calculateBalance(responses, partnerNames);
    setBalanceResults(results);
    setShowResults(true);
    localStorage.removeItem('quickQuizProgress');
  };

  // Calculate balance from responses
  const calculateBalance = (responses, names) => {
    const categories = {
      visible_household: { partner1: 0, partner2: 0, both: 0, total: 0, weight: 0 },
      invisible_household: { partner1: 0, partner2: 0, both: 0, total: 0, weight: 0 },
      visible_parental: { partner1: 0, partner2: 0, both: 0, total: 0, weight: 0 },
      invisible_parental: { partner1: 0, partner2: 0, both: 0, total: 0, weight: 0 }
    };

    // Process responses from both partners
    ['partner1', 'partner2'].forEach(partner => {
      Object.entries(responses[partner] || {}).forEach(([questionId, answer]) => {
        const question = QUIZ_QUESTIONS.find(q => q.id === questionId);
        if (!question) return;

        const category = categories[question.category];
        if (!category) return;

        category.total++;
        category.weight += question.weight;

        if (answer === 'partner1') {
          category.partner1 += question.weight;
        } else if (answer === 'partner2') {
          category.partner2 += question.weight;
        } else if (answer === 'both') {
          category.both += question.weight;
        }
      });
    });

    // Calculate balance percentages for each category
    const calculateCategoryBalance = (category) => {
      if (category.weight === 0) return { balance: 50, partner1Share: 50, partner2Share: 50 };

      const partner1Total = category.partner1 + (category.both * 0.5);
      const partner2Total = category.partner2 + (category.both * 0.5);
      const total = partner1Total + partner2Total;

      if (total === 0) return { balance: 50, partner1Share: 50, partner2Share: 50 };

      const partner1Share = Math.round((partner1Total / total) * 100);
      const partner2Share = Math.round((partner2Total / total) * 100);
      const imbalance = Math.abs(partner1Share - 50);
      const balance = Math.round(100 - (imbalance * 2));

      return {
        balance: Math.max(0, Math.min(100, balance)),
        partner1Share,
        partner2Share
      };
    };

    // Calculate scores for each category
    const visibleHousehold = calculateCategoryBalance(categories.visible_household);
    const invisibleHousehold = calculateCategoryBalance(categories.invisible_household);
    const visibleParental = calculateCategoryBalance(categories.visible_parental);
    const invisibleParental = calculateCategoryBalance(categories.invisible_parental);

    // Calculate overall balance (weighted average)
    const overallBalance = Math.round(
      (visibleHousehold.balance * 0.2 +
       invisibleHousehold.balance * 0.3 +
       visibleParental.balance * 0.2 +
       invisibleParental.balance * 0.3)
    );

    // Find biggest imbalance
    const imbalances = [
      { category: 'Invisible Household Tasks', ...invisibleHousehold },
      { category: 'Invisible Parental Tasks', ...invisibleParental },
      { category: 'Visible Household Tasks', ...visibleHousehold },
      { category: 'Visible Parental Tasks', ...visibleParental }
    ];

    const biggestImbalance = imbalances.reduce((prev, curr) =>
      curr.balance < prev.balance ? curr : prev
    );

    // Generate habit suggestions based on imbalances
    const habits = generateHabitSuggestions(imbalances, names);

    return {
      overallBalance,
      categories: {
        visibleHousehold,
        invisibleHousehold,
        visibleParental,
        invisibleParental
      },
      biggestImbalance,
      habits,
      radarData: [
        { category: 'Invisible\nParental', partner1: invisibleParental.partner1Share, partner2: invisibleParental.partner2Share },
        { category: 'Visible\nHousehold', partner1: visibleHousehold.partner1Share, partner2: visibleHousehold.partner2Share },
        { category: 'Invisible\nHousehold', partner1: invisibleHousehold.partner1Share, partner2: invisibleHousehold.partner2Share },
        { category: 'Visible\nParental', partner1: visibleParental.partner1Share, partner2: visibleParental.partner2Share }
      ]
    };
  };

  // Generate personalized habit suggestions
  const generateHabitSuggestions = (imbalances, names) => {
    const suggestions = [];

    imbalances.sort((a, b) => a.balance - b.balance);

    for (let i = 0; i < Math.min(3, imbalances.length); i++) {
      const category = imbalances[i];
      const overloadedPartner = category.partner1Share > 60 ? names.partner1 : names.partner2;
      const underloadedPartner = category.partner1Share > 60 ? names.partner2 : names.partner1;

      let habit = {
        category: category.category,
        current: `${overloadedPartner} handles ${Math.max(category.partner1Share, category.partner2Share)}%`,
        target: '50-50 split',
        impact: `${Math.round((100 - category.balance) / 2)}%`
      };

      // Specific habit recommendations based on category
      if (category.category === 'Invisible Household Tasks') {
        habit.title = `${underloadedPartner} Takes On Weekly Meal Planning`;
        habit.description = 'Plan meals together every Sunday for 30 minutes';
        habit.timeCommitment = '30 min/week';
      } else if (category.category === 'Invisible Parental Tasks') {
        habit.title = `${underloadedPartner} Manages School Communications`;
        habit.description = 'Take ownership of teacher emails and school updates';
        habit.timeCommitment = '15 min/day';
      } else if (category.category === 'Visible Household Tasks') {
        habit.title = `${underloadedPartner} Owns Dinner Prep 3x/Week`;
        habit.description = 'Cook dinner Monday, Wednesday, Friday';
        habit.timeCommitment = '45 min/meal';
      } else {
        habit.title = `${underloadedPartner} Handles Morning Routines`;
        habit.description = 'Get kids ready for school every other day';
        habit.timeCommitment = '30 min/day';
      }

      suggestions.push(habit);
    }

    return suggestions;
  };

  // Save results to database and send email
  const handleEmailCapture = async () => {
    if (!email) return;

    setIsSaving(true);
    try {
      const quizData = {
        email,
        partnerNames,
        results: balanceResults,
        responses,
        timestamp: serverTimestamp(),
        source: 'homepage_quiz',
        converted: false
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'quiz_results'), quizData);
      const quizId = docRef.id;

      // Send email via Firebase Function
      try {
        const response = await fetch('https://europe-west1-parentload-ba995.cloudfunctions.net/sendQuizReport', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            partnerNames,
            results: balanceResults,
            quizId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send email');
        }

        alert('Report sent to your email! Check your inbox.');
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        alert('Results saved! We had trouble sending the email, but you can still start your free trial.');
      }

      if (onClose) onClose();
    } catch (error) {
      console.error('Error saving quiz results:', error);
      alert('Error saving results. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Render name entry screen
  if (showNameEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
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

          <h2 className="text-3xl font-bold mb-6 text-center">Let's Get Started!</h2>
          <p className="text-gray-600 mb-6 text-center">
            Enter your names to personalize the quiz
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

            {/* Kids Section */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many children do you have? (Optional)
              </label>
              <select
                value={childCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value);
                  setChildCount(count);
                  setChildrenNames(Array(count).fill(''));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value={0}>No children</option>
                <option value={1}>1 child</option>
                <option value={2}>2 children</option>
                <option value={3}>3 children</option>
                <option value={4}>4 children</option>
                <option value={5}>5 children</option>
                <option value={6}>6+ children</option>
              </select>
            </div>

            {/* Child name inputs */}
            {childCount > 0 && (
              <div className="space-y-2">
                {Array.from({ length: childCount }, (_, i) => (
                  <div key={i}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Child {i + 1} Name
                    </label>
                    <input
                      type="text"
                      value={childrenNames[i] || ''}
                      onChange={(e) => {
                        const newNames = [...childrenNames];
                        newNames[i] = e.target.value;
                        setChildrenNames(newNames);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder={`e.g., ${['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan'][i] || 'Child'}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleNameSubmit}
            disabled={!partnerNames.partner1.trim() || !partnerNames.partner2.trim()}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
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
      onEmailCapture={() => setShowEmailCapture(true)}
      showEmailCapture={showEmailCapture}
      email={email}
      setEmail={setEmail}
      handleEmailCapture={handleEmailCapture}
      isSaving={isSaving}
    />;
  }

  // Render quiz questions
  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];

  // Calculate overall progress
  const totalParticipants = 2 + childrenNames.filter(n => n.trim()).length;
  const currentParticipantIndex = isChildrenPhase ? 2 + currentChild : currentPartner - 1;
  const questionProgress = (currentQuestionIndex + 1) / QUIZ_QUESTIONS.length;
  const participantProgress = currentParticipantIndex / totalParticipants;
  const overallProgress = (participantProgress + questionProgress / totalParticipants) * 100;

  // Get current responder name
  const currentResponderName = isChildrenPhase
    ? childrenNames[currentChild]
    : partnerNames[`partner${currentPartner}`];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">
              {currentResponderName}'s Turn {isChildrenPhase && '(Child)'}
            </span>
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <h3 className="text-2xl font-semibold mb-8 text-center text-gray-800">
          {currentQuestion.text}
        </h3>

        {/* Answer options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleAnswer('partner1')}
            className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">👩</div>
            <div className="font-medium">{partnerNames.partner1}</div>
          </button>

          <button
            onClick={() => handleAnswer('both')}
            className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">👫</div>
            <div className="font-medium">Both Equally</div>
          </button>

          <button
            onClick={() => handleAnswer('partner2')}
            className="group p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:shadow-lg transition-all"
          >
            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">👨</div>
            <div className="font-medium">{partnerNames.partner2}</div>
          </button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => {
              if (currentQuestionIndex > 0) {
                setCurrentQuestionIndex(currentQuestionIndex - 1);
              } else if (currentPartner === 2) {
                setCurrentPartner(1);
                setCurrentQuestionIndex(QUIZ_QUESTIONS.length - 1);
              }
            }}
            disabled={currentPartner === 1 && currentQuestionIndex === 0}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 disabled:opacity-30"
          >
            <ArrowLeft size={20} />
            Previous
          </button>

          <button
            onClick={() => setCurrentQuestionIndex(Math.min(currentQuestionIndex + 1, QUIZ_QUESTIONS.length - 1))}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            Skip
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// Separate Results Component
const QuizResults = ({ results, partnerNames, onEmailCapture, showEmailCapture, email, setEmail, handleEmailCapture, isSaving }) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const getImbalanceColor = (balance) => {
    if (balance >= 80) return 'text-green-600';
    if (balance >= 60) return 'text-yellow-600';
    if (balance >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

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
        {/* Main insight */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Your Family Balance Score: <span className={getImbalanceColor(results.overallBalance)}>{results.overallBalance}%</span>
          </h1>
          <p className="text-xl text-gray-600">
            {results.biggestImbalance.partner1Share > 60 ? partnerNames.partner1 : partnerNames.partner2} is carrying {Math.max(results.biggestImbalance.partner1Share, results.biggestImbalance.partner2Share)}%
            of the {results.biggestImbalance.category.toLowerCase()}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Radar Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">Family Task Balance</h3>
            <div className="text-sm text-gray-600 text-center mb-4">Based on the Four Categories framework</div>

            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={results.radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="category" className="text-sm" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name={partnerNames.partner1}
                  dataKey="partner1"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                />
                <Radar
                  name={partnerNames.partner2}
                  dataKey="partner2"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>

            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm">{partnerNames.partner1}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm">{partnerNames.partner2}</span>
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Category Breakdown</h3>
            <div className="space-y-4">
              {[
                { name: 'Invisible Parental Tasks', data: results.categories.invisibleParental, icon: <Brain className="text-purple-600" /> },
                { name: 'Invisible Household Tasks', data: results.categories.invisibleHousehold, icon: <Eye className="text-indigo-600" /> },
                { name: 'Visible Parental Tasks', data: results.categories.visibleParental, icon: <Baby className="text-blue-600" /> },
                { name: 'Visible Household Tasks', data: results.categories.visibleHousehold, icon: <Home className="text-green-600" /> }
              ].map((category, idx) => (
                <div key={idx} className="border-b last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {category.icon}
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className={`font-bold ${getImbalanceColor(category.data.balance)}`}>
                      {category.data.balance}% balanced
                    </span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="text-gray-600">
                      {partnerNames.partner1}: {category.data.partner1Share}%
                    </span>
                    <span className="text-gray-400">|</span>
                    <span className="text-gray-600">
                      {partnerNames.partner2}: {category.data.partner2Share}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Habit Recommendations */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Your Top 3 Habit Recommendations</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {results.habits.map((habit, idx) => (
              <div key={idx} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-lg">{habit.title}</h4>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm">
                    {habit.impact} impact
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3">{habit.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current:</span>
                    <span className="font-medium">{habit.current}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Goal:</span>
                    <span className="font-medium text-green-600">{habit.target}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time needed:</span>
                    <span className="font-medium">{habit.timeCommitment}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Social Sharing Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Share Your Results</h3>
            <button
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              <Share2 size={20} />
              Share Results
            </button>
          </div>

          {showShareMenu && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                onClick={() => handleShare('twitter')}
                className="flex items-center justify-center gap-2 p-3 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
              >
                <Twitter size={20} className="text-sky-500" />
                <span>Twitter</span>
              </button>
              <button
                onClick={() => handleShare('facebook')}
                className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Facebook size={20} className="text-blue-600" />
                <span>Facebook</span>
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="flex items-center justify-center gap-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Linkedin size={20} className="text-blue-700" />
                <span>LinkedIn</span>
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="flex items-center justify-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Copy size={20} className="text-gray-600" />
                <span>{copySuccess ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          )}

          {!showShareMenu && (
            <p className="text-sm text-gray-600">
              Help other families discover their invisible imbalances by sharing your results
            </p>
          )}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Fix This Imbalance?</h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of families using Allie to create lasting balance
          </p>

          {!showEmailCapture ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.href = '/signup'}
                className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Start Free Trial
              </button>
              <button
                onClick={onEmailCapture}
                className="px-8 py-3 bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800 transition-all"
              >
                Email Me This Report
              </button>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-gray-800"
                />
                <button
                  onClick={handleEmailCapture}
                  disabled={!email || isSaving}
                  className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Sending...' : 'Send Report'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickBalanceQuiz;