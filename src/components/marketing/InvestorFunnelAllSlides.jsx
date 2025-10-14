import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, ArrowLeft, Check, Brain, Heart, Scale,
    Clock, BarChart, Users, Command, Calendar,
    FileText, MessageSquare, Database, Activity, Shield,
    Zap, Star, Target, Lock, Award, ChevronRight,
    ChevronDown, ChevronUp, AlertTriangle, RefreshCw,
    PlusCircle, Layers, Key, Sparkles, CheckCircle,
    Camera, Code, DollarSign, TrendingUp, HelpCircle,
    Eye
  } from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Legend, 
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, PieChart, Pie,
  Cell, LineChart, Line
} from 'recharts';
// Password protection removed

// Import the ProgressBar
import ProgressBar, { getSlideSection } from './investorSlides/ProgressBar';

// Import ALL slide components
import BusinessCaseValidationSlide from './investorSlides/BusinessCaseValidationSlide';
import CompetitorLandscapeSlide from './investorSlides/CompetitorLandscapeSlide';
import DataValueSlide from './investorSlides/DataValueSlide';
import FamilyFlywheelSlide1 from './investorSlides/FamilyFlywheelSlide1';
import FamilyFlywheelSlide2 from './investorSlides/FamilyFlywheelSlide2';
import FamilyFlywheelSlide3 from './investorSlides/FamilyFlywheelSlide3';
import FinancialProjectionsSlide from './investorSlides/FinancialProjectionsSlide';
import GenerationalImbalanceSlide from './investorSlides/GenerationalImbalanceSlide';
import InitialTractionSlide from './investorSlides/InitialTractionSlide';
import LTVExpansionSlide from './investorSlides/LTVExpansionSlide';
import MacroTailwindsSlide from './investorSlides/MacroTailwindsSlide';
import MarketSizeSlide from './investorSlides/MarketSizeSlide';
import MarketSummarySlide from './investorSlides/MarketSummarySlide';
import MentalLoadAssessmentSlide from './investorSlides/MentalLoadAssessmentSlide';
import NextStepsSlide from './investorSlides/NextStepsSlide';
import ParentalGapSlide from './investorSlides/ParentalGapSlide';
import PersonalizedApproachSlide from './investorSlides/PersonalizedApproachSlide';
import ProblemSummarySlide from './investorSlides/ProblemSummarySlide';
import ProductRoadmapSlide from './investorSlides/ProductRoadmapSlide';
import ScientificFoundationSlide from './investorSlides/ScientificFoundationSlide';
import SiblingDynamicsSlide from './investorSlides/SiblingDynamicsSlide';
import SolutionSummarySlide from './investorSlides/SolutionSummarySlide';
import TeamAdvisorsSlide from './investorSlides/TeamAdvisorsSlide';
import TechnologyStackSlide from './investorSlides/TechnologyStackSlide';
import TimeValueAnalysisSlide from './investorSlides/TimeValueAnalysisSlide';
import TractionSummarySlide from './investorSlides/TractionSummarySlide';
import WorkloadVisualizationSlide from './investorSlides/WorkloadVisualizationSlide';
import AwarenessFirstSlide from './investorSlides/AwarenessFirstSlide';

const InvestorFunnelComprehensive = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [slideHistory, setSlideHistory] = useState([]);
  const [showSlideMenu, setShowSlideMenu] = useState(false);
  const [activeDot, setActiveDot] = useState(null);
  const slideRef = useRef(null);

  // Configure total number of slides
  const totalSlides = 100; // Expanded to accommodate ALL slides from all versions

  // Handle authorization
  const handleAuthorization = (isAuth) => {
    setIsAuthorized(isAuth);
    if (isAuth) {
      setCurrentSlide(1);
    }
  };

  // Navigate to next slide
  const nextSlide = () => {
    if (currentSlide < totalSlides) {
      setSlideHistory([...slideHistory, currentSlide]);
      setCurrentSlide(currentSlide + 1);
      setShowNotification(false);
    }
  };

  // Navigate to previous slide
  const prevSlide = () => {
    if (currentSlide > 1) {
      const newHistory = [...slideHistory];
      newHistory.pop();
      setSlideHistory(newHistory);
      setCurrentSlide(currentSlide - 1);
      setShowNotification(false);
    }
  };

  // Jump to a specific slide
  const goToSlide = (slideNumber) => {
    if (slideNumber >= 1 && slideNumber <= totalSlides) {
      setSlideHistory([...slideHistory, currentSlide]);
      setCurrentSlide(slideNumber);
      setShowNotification(false);
      setShowSlideMenu(false);
    }
  };

  // Show notification
  const displayNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        prevSlide();
      } else if (e.key === 'Escape') {
        navigate('/');
      } else if (e.key >= '0' && e.key <= '9') {
        const num = parseInt(e.key);
        if (num >= 0 && num <= totalSlides) {
          goToSlide(num);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSlide, slideHistory, navigate]);

  // Render notification
  const renderNotification = () => {
    if (showNotification) {
      return (
        <div className="fixed top-4 right-4 bg-white shadow-lg rounded-lg p-4 z-50 max-w-md animate-fade-in">
          <div className="flex items-center">
            <div className="mr-3 text-blue-500">
              <InfoIcon size={24} />
            </div>
            <div>
              <h3 className="font-medium text-gray-800">Notification</h3>
              <p className="text-gray-600">{notificationMessage}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get current section for progress bar
  const getCurrentSection = () => {
    if (currentSlide <= 11) return 'problem';
    if (currentSlide <= 24) return 'solution'; // Increased by 1 to account for AwarenessFirstSlide
    if (currentSlide <= 30) return 'market';   // Increased by 1
    if (currentSlide <= 34) return 'traction'; // Increased by 1
    if (currentSlide <= 37) return 'team';     // Increased by 1
    return 'financials';
  };

  // Configure sections for progress bar
  const sections = ['problem', 'solution', 'market', 'traction', 'team', 'financials'];
  const currentSection = getCurrentSection();
  const sectionIndex = sections.indexOf(currentSection);
  const progressPercentage = ((sectionIndex + 1) / sections.length) * 100;

  // Password protection removed as requested
  useEffect(() => {
    setIsAuthorized(true);
  }, []);

  // InfoIcon component for notifications
  const InfoIcon = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  );

  // Render the current slide
  const renderSlide = () => {
    // If it's the title slide
    if (currentSlide === 1) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-gradient-to-br from-purple-50 to-indigo-100">
          {/* Slide number overlay */}
          <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md">
            1
          </div>

          <div className="mb-8">
            <img src="/logo512.png" alt="Parentload Logo" className="w-32 h-32 mx-auto" />
          </div>
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Parentload</h1>
          <h2 className="text-3xl font-semibold text-purple-700 mb-8">AI Family Assistant</h2>
          <div className="max-w-3xl">
            <p className="text-xl text-gray-700 mb-6">
              Creating harmony in family life through AI-powered
              coordination, personalized support, and practical solutions
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <div className="bg-white p-4 rounded-lg shadow-md cursor-pointer" onClick={() => setCurrentSlide(12)}>
                <Brain size={32} className="text-indigo-600 mb-2 mx-auto" />
                <p className="text-gray-700 font-medium">AI Family Concierge</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md cursor-pointer" onClick={() => setCurrentSlide(12)}>
                <Clock size={32} className="text-indigo-600 mb-2 mx-auto" />
                <p className="text-gray-700 font-medium">Time-Saving</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md cursor-pointer hover:bg-indigo-50 transition-colors" onClick={() => setCurrentSlide(12)}>
                <Heart size={32} className="text-indigo-600 mb-2 mx-auto" />
                <p className="text-gray-700 font-medium">Relationship Harmony</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md cursor-pointer" onClick={() => setCurrentSlide(12)}>
                <BarChart size={32} className="text-indigo-600 mb-2 mx-auto" />
                <p className="text-gray-700 font-medium">Family Data Hub</p>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => setCurrentSlide(12)}
                className="px-6 py-3 bg-purple-600 text-white rounded-full shadow-lg hover:bg-purple-700 transition-colors flex items-center"
              >
                <Eye className="mr-2" /> View Awareness First Research
              </button>
            </div>
          </div>
          <div className="mt-16 animate-bounce">
            <p className="text-gray-500">Press Space or Right Arrow to continue</p>
            <ChevronDown size={24} className="mx-auto mt-2 text-gray-400" />
          </div>
        </div>
      );
    }

    // Use existing slides as imported components
    switch(currentSlide) {
      // Problem slides
      case 2:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              2
            </div>
            <ProblemSummarySlide />
          </div>
        );
      case 3:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              3
            </div>
            <ParentalGapSlide />
          </div>
        );
      case 4:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              4
            </div>
            <GenerationalImbalanceSlide />
          </div>
        );
      case 5:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              5
            </div>
            <MentalLoadAssessmentSlide />
          </div>
        );
      case 6:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              6
            </div>
            <WorkloadVisualizationSlide />
          </div>
        );
      case 7:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              7
            </div>
            <MacroTailwindsSlide />
          </div>
        );
      case 8:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              8
            </div>
            <CompetitorLandscapeSlide />
          </div>
        );
      case 9:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              9
            </div>
            <SiblingDynamicsSlide />
          </div>
        );
      case 10:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              10
            </div>
            <TimeValueAnalysisSlide />
          </div>
        );
      case 11:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              11
            </div>
            <BusinessCaseValidationSlide />
          </div>
        );

      // Solution slides
      case 12:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              12
            </div>
            <AwarenessFirstSlide />
          </div>
        );
      case 13:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              13
            </div>
            <SolutionSummarySlide />
          </div>
        );
      case 14:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              14
            </div>
            <PersonalizedApproachSlide />
          </div>
        );
      case 15:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              15
            </div>
            <FamilyFlywheelSlide1 />
          </div>
        );
      case 16:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              16
            </div>
            <FamilyFlywheelSlide2 />
          </div>
        );
      case 17:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              17
            </div>
            <FamilyFlywheelSlide3 />
          </div>
        );
      case 18:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              18
            </div>
            <DataValueSlide />
          </div>
        );
      case 18:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              18
            </div>
            <LTVExpansionSlide />
          </div>
        );
      case 19:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              19
            </div>
            <ProductRoadmapSlide />
          </div>
        );
      case 20:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              20
            </div>
            <TechnologyStackSlide />
          </div>
        );
      case 21:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              21
            </div>
            <ScientificFoundationSlide />
          </div>
        );

      // Market slides
      case 22:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              22
            </div>
            <MarketSummarySlide />
          </div>
        );
      case 23:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              23
            </div>
            <MarketSizeSlide />
          </div>
        );
      
      // 10K Families, 24 Months, &lt;$50K Cash Slide
      case 24:
        return (
          <div className="flex flex-col h-full p-16 bg-gradient-to-br from-indigo-50 to-purple-100 relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              24
            </div>
            <h1 className="text-3xl font-bold text-indigo-800 mb-8">10K Families, 24 Months, &lt;$50K Cash</h1>
            
            <div className="grid grid-cols-3 gap-8 mb-10">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Initial Traction</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <Check size={18} className="text-green-500 mr-2" />
                    <span>200 families onboarded from waitlist</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={18} className="text-green-500 mr-2" />
                    <span>95% retention rate first three months</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={18} className="text-green-500 mr-2" />
                    <span>83% weekly active users</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Growth Plan</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <Check size={18} className="text-green-500 mr-2" />
                    <span>Onboard 10,000 families by Q2 2026</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={18} className="text-green-500 mr-2" />
                    <span>Target 70% organic acquisition through referrals</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={18} className="text-green-500 mr-2" />
                    <span>Expand to 3 key metro markets</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Financial Efficiency</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <Check size={18} className="text-green-500 mr-2" />
                    <span>$18 CAC from early marketing tests</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={18} className="text-green-500 mr-2" />
                    <span>$375 annual subscription ($31.25/mo)</span>
                  </li>
                  <li className="flex items-center">
                    <Check size={18} className="text-green-500 mr-2" />
                    <span>20.8x LTV:CAC ratio</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-md mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">$50K Cash Runway Allocation</h3>
              <div className="grid grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                  <p className="font-medium">$20K</p>
                  <p className="text-sm text-gray-600">AI Infrastructure</p>
                </div>
                <div className="text-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                  <p className="font-medium">$15K</p>
                  <p className="text-sm text-gray-600">Marketing</p>
                </div>
                <div className="text-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                  </div>
                  <p className="font-medium">$10K</p>
                  <p className="text-sm text-gray-600">Development</p>
                </div>
                <div className="text-center">
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                  <p className="font-medium">$5K</p>
                  <p className="text-sm text-gray-600">Operations</p>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
              <h3 className="text-xl font-semibold text-indigo-800 mb-3">Key Milestones</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mb-2">1</div>
                  <p className="text-center text-sm">1K families by Q4 2024</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mb-2">2</div>
                  <p className="text-center text-sm">3K families by Q2 2025</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mb-2">3</div>
                  <p className="text-center text-sm">Break-even by Q4 2025</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold mb-2">4</div>
                  <p className="text-center text-sm">10K families by Q2 2026</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      // Traction slides
      case 25:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              25
            </div>
            <InitialTractionSlide />
          </div>
        );
      case 26:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              26
            </div>
            <TractionSummarySlide />
          </div>
        );

      // Onion Flywheel Slide 1
      case 27:
        return (
          <div className="flex flex-col h-full p-16 bg-gradient-to-br from-indigo-50 to-purple-100 relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              27
            </div>
            <h1 className="text-3xl font-bold text-indigo-800 mb-8">Onion Flywheel: Data-Driven LTV Growth (1/2)</h1>
            
            <div className="grid grid-cols-2 gap-8 mb-10">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Data Collection Layers</h3>
                <div className="relative">
                  {/* Onion layer visualization */}
                  <div className="flex items-center justify-center">
                    <div className="w-64 h-64 rounded-full bg-indigo-100 flex items-center justify-center relative">
                      <div className="w-48 h-48 rounded-full bg-indigo-200 flex items-center justify-center">
                        <div className="w-32 h-32 rounded-full bg-indigo-300 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full bg-indigo-400 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-500"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Layer labels */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-xs font-medium text-indigo-900">
                          Core<br/>Profile
                        </div>
                      </div>
                      
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 flex items-center justify-center">
                        <div className="text-center text-xs font-medium text-indigo-900 rotate-45">
                          Explicit<br/>Preferences
                        </div>
                      </div>
                      
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 flex items-center justify-center">
                        <div className="text-center text-xs font-medium text-indigo-900 -rotate-45">
                          Behavioral<br/>Patterns
                        </div>
                      </div>
                      
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 flex items-center justify-center">
                        <div className="text-center text-xs font-medium text-indigo-900">
                          Contextual<br/>Intelligence
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Value Creation from Data</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="mt-1 mr-3 p-1 bg-indigo-100 rounded-full">
                      <Check size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Core Profile</p>
                      <p className="text-sm text-gray-600">Basic family information creates foundation for personalization</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="mt-1 mr-3 p-1 bg-indigo-100 rounded-full">
                      <Check size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Explicit Preferences</p>
                      <p className="text-sm text-gray-600">Survey responses and direct settings improve AI accuracy by 38%</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="mt-1 mr-3 p-1 bg-indigo-100 rounded-full">
                      <Check size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Behavioral Patterns</p>
                      <p className="text-sm text-gray-600">Usage patterns enable proactive support, increasing LTV by 65%</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="mt-1 mr-3 p-1 bg-indigo-100 rounded-full">
                      <Check size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Contextual Intelligence</p>
                      <p className="text-sm text-gray-600">Relationship dynamics + external data = 87% higher retention rates</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
              <h3 className="text-xl font-semibold text-indigo-800 mb-3">Compounding Value</h3>
              <p className="text-gray-700 mb-4">
                Our data strategy creates a self-reinforcing cycle: better data → more personalized experience → deeper engagement → richer data → expanding LTV
              </p>
              <div className="grid grid-cols-4 gap-6 mt-4">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-2">
                    <Database size={24} className="text-white" />
                  </div>
                  <p className="text-center text-sm font-medium">Data Collection</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-2">
                    <Brain size={24} className="text-white" />
                  </div>
                  <p className="text-center text-sm font-medium">AI Processing</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-2">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  <p className="text-center text-sm font-medium">Personalization</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-2">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <p className="text-center text-sm font-medium">Increasing LTV</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      // Onion Flywheel Slide 2
      case 28:
        return (
          <div className="flex flex-col h-full p-16 bg-gradient-to-br from-indigo-50 to-purple-100 relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              28
            </div>
            <h1 className="text-3xl font-bold text-indigo-800 mb-8">Onion Flywheel: Data-Driven LTV Growth (2/2)</h1>
            
            <div className="grid grid-cols-2 gap-8 mb-10">              
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">LTV Expansion Metrics</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Year 1 LTV</span>
                      <span className="text-sm font-medium">$375</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Year 2 LTV</span>
                      <span className="text-sm font-medium">$825</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '44%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Year 3 LTV</span>
                      <span className="text-sm font-medium">$1,350</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">Year 5 LTV</span>
                      <span className="text-sm font-medium">$1,875</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Value-Added Services</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="mt-1 mr-3 p-1 bg-indigo-100 rounded-full">
                      <PlusCircle size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Premium Integrations ($5/mo)</p>
                      <p className="text-sm text-gray-600">Enhanced school connections, medical systems, premium calendars</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="mt-1 mr-3 p-1 bg-indigo-100 rounded-full">
                      <PlusCircle size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Family Meeting Pro ($8/mo)</p>
                      <p className="text-sm text-gray-600">AI-facilitated family meetings with preparation and follow-up</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="mt-1 mr-3 p-1 bg-indigo-100 rounded-full">
                      <PlusCircle size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Relationship Analytics ($10/mo)</p>
                      <p className="text-sm text-gray-600">Advanced insights from family interactions and patterns</p>
                    </div>
                  </li>
                  
                  <li className="flex items-start">
                    <div className="mt-1 mr-3 p-1 bg-indigo-100 rounded-full">
                      <PlusCircle size={16} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Provider Network ($15/mo)</p>
                      <p className="text-sm text-gray-600">Vetted family service providers with integrated scheduling</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
              <h3 className="text-xl font-semibold text-indigo-800 mb-3">Key LTV Drivers</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800">Retention Rate</h4>
                    <span className="text-sm font-bold text-indigo-600">+12%</span>
                  </div>
                  <p className="text-sm text-gray-600">Per data layer added to user profile</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800">Upsell Conversion</h4>
                    <span className="text-sm font-bold text-indigo-600">29%</span>
                  </div>
                  <p className="text-sm text-gray-600">From core plan to premium features</p>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-800">Network Effect</h4>
                    <span className="text-sm font-bold text-indigo-600">2.3x</span>
                  </div>
                  <p className="text-sm text-gray-600">Average referrals per annual user</p>
                </div>
              </div>
            </div>
          </div>
        );
      
      // Team slides
      case 29:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              29
            </div>
            <TeamAdvisorsSlide />
          </div>
        );

      // Financial slide
      case 30:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              30
            </div>
            <FinancialProjectionsSlide />
          </div>
        );

      // Final slide
      case 31:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              31
            </div>
            <NextStepsSlide />
          </div>
        );

      // Additional slides from investorSlides folder
      case 32:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              32
            </div>
            <InitialTractionSlide />
          </div>
        );
      case 33:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              33
            </div>
            <MarketSizeSlide />
          </div>
        );
      case 34:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              34
            </div>
            <MentalLoadAssessmentSlide />
          </div>
        );
      case 35:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              35
            </div>
            <ScientificFoundationSlide />
          </div>
        );
      case 36:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              36
            </div>
            <MarketSummarySlide />
          </div>
        );
      case 37:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              37
            </div>
            <TractionSummarySlide />
          </div>
        );
      case 38:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              38
            </div>
            <TechnologyStackSlide />
          </div>
        );
      case 39:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              39
            </div>
            <SolutionSummarySlide />
          </div>
        );
      case 40:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              40
            </div>
            <ProblemSummarySlide />
          </div>
        );

      // Additional slides (41-60) using different combinations of existing components
      case 41:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              41
            </div>
            <BusinessCaseValidationSlide />
          </div>
        );
      case 42:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              42
            </div>
            <CompetitorLandscapeSlide />
          </div>
        );
      case 43:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              43
            </div>
            <DataValueSlide />
          </div>
        );
      case 44:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              44
            </div>
            <FamilyFlywheelSlide1 />
          </div>
        );
      case 45:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              45
            </div>
            <FamilyFlywheelSlide2 />
          </div>
        );
      case 46:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              46
            </div>
            <FamilyFlywheelSlide3 />
          </div>
        );
      case 47:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              47
            </div>
            <FinancialProjectionsSlide />
          </div>
        );
      case 48:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              48
            </div>
            <GenerationalImbalanceSlide />
          </div>
        );
      case 49:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              49
            </div>
            <InitialTractionSlide />
          </div>
        );
      case 50:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              50
            </div>
            <LTVExpansionSlide />
          </div>
        );
      case 51:
        return (
          <div className="flex flex-col h-full p-16 bg-gradient-to-br from-indigo-50 to-purple-100 relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              51
            </div>
            <h1 className="text-3xl font-bold text-indigo-800 mb-8">AI Technology and Product Roadmap</h1>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">AI Cost Curve Benefits</h3>
                <p className="text-gray-700 mb-4">
                  Rapid cost reduction in LLM inference means we can provide increasingly powerful capabilities without raising prices
                </p>
                <div className="relative h-48 mt-4">
                  <div className="absolute left-0 bottom-0 w-full h-px bg-gray-300"></div>
                  <div className="absolute left-0 bottom-0 h-full w-px bg-gray-300"></div>

                  {/* Curve */}
                  <div className="absolute bottom-0 left-0 w-full h-full">
                    <svg viewBox="0 0 100 48" className="w-full h-full">
                      <path
                        d="M0,10 C20,15 40,25 100,48"
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>

                  {/* Cost label */}
                  <div className="absolute top-0 -left-12 text-sm text-gray-600">
                    Cost per <br/>token
                  </div>

                  {/* Time label */}
                  <div className="absolute bottom-[-20px] right-0 text-sm text-gray-600">
                    Time →
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Product Roadmap Highlights</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Q4 2024: Event Forecasting</p>
                      <p className="text-sm text-gray-600">Predict likely events needing scheduling and proactively suggest them</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Q1 2025: Pattern Recognition Engine</p>
                      <p className="text-sm text-gray-600">Identify recurrent family patterns and offer personalized strategies</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Q2 2025: Emotional Intelligence Layer</p>
                      <p className="text-sm text-gray-600">Detect emotion in text/voice and adapt response style appropriately</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2 mt-0.5">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Q3 2025: Multi-modal Input/Output</p>
                      <p className="text-sm text-gray-600">Process photos, voice, and video for richer interaction</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-200">
              <h3 className="text-xl font-semibold text-indigo-800 mb-3">Technical Advantage</h3>
              <p className="text-gray-700 mb-4">
                Our proprietary family data model and relationship context awareness creates a 14-month lead over potential competitors
              </p>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <div className="text-lg font-bold text-indigo-700">125+</div>
                  <div className="text-xs text-gray-600">Family context entities</div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <div className="text-lg font-bold text-indigo-700">83%</div>
                  <div className="text-xs text-gray-600">Inference optimization</div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <div className="text-lg font-bold text-indigo-700">1.2M</div>
                  <div className="text-xs text-gray-600">Training examples</div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <div className="text-lg font-bold text-indigo-700">4</div>
                  <div className="text-xs text-gray-600">Pending patents</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 52:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              52
            </div>
            <MacroTailwindsSlide />
          </div>
        );
      case 53:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              53
            </div>
            <MarketSizeSlide />
          </div>
        );
      case 54:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              54
            </div>
            <MarketSummarySlide />
          </div>
        );
      case 55:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              55
            </div>
            <MentalLoadAssessmentSlide />
          </div>
        );
      case 56:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              56
            </div>
            <NextStepsSlide />
          </div>
        );
      case 57:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              57
            </div>
            <ParentalGapSlide />
          </div>
        );
      case 58:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              58
            </div>
            <PersonalizedApproachSlide />
          </div>
        );
      case 59:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              59
            </div>
            <ProductRoadmapSlide />
          </div>
        );
      case 60:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              60
            </div>
            <SolutionSummarySlide />
          </div>
        );

      // Additional custom slides from InvestorFunnelFixed.jsx
      case 61:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              61
            </div>
            <div className="min-h-[80vh] flex flex-col justify-center px-8 bg-gradient-to-br from-indigo-50 to-purple-100">
              <h2 className="text-3xl md:text-4xl font-light mb-6">The Invisible Crisis in Modern Families</h2>

              <div className="bg-white p-6 rounded-lg mb-8 shadow-md">
                <h3 className="text-xl font-medium mb-4">The Statistics</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-indigo-700 mb-2">78%</div>
                    <p className="text-gray-600">of parents report losing sleep due to juggling family responsibilities</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-indigo-700 mb-2">65%</div>
                    <p className="text-gray-600">of couples report relationship strain from uneven workload distribution</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-indigo-700 mb-2">83%</div>
                    <p className="text-gray-600">of familial tasks remain undocumented but consume significant time</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-medium mb-4">The Reality</h3>
                <p className="mb-4 text-gray-700">Modern families face unprecedented coordination challenges without adequate tools:</p>
                <ul className="space-y-2 ml-6 text-gray-700 list-disc">
                  <li>Over 50% of working parents feel constantly behind on family responsibilities</li>
                  <li>Average parent manages 30+ upcoming family events simultaneously</li>
                  <li>Cognitive overhead of family management = 15-20 hours/week of mental load</li>
                  <li>Existing products solve individual tasks but not the macro coordination challenge</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 62:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              62
            </div>
            <div className="min-h-[80vh] flex flex-col justify-center px-8 bg-gradient-to-br from-indigo-50 to-purple-100">
              <h2 className="text-3xl md:text-4xl font-light mb-6">A Global Crisis with Personal Impact</h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-medium mb-4">The Global Trend</h3>
                  <p className="mb-4 text-gray-700">Parents worldwide are struggling with the increasing complexity of raising children in the digital age:</p>
                  <ul className="space-y-2 ml-6 text-gray-700 list-disc">
                    <li>Decreasing extended family support due to geographic mobility</li>
                    <li>Increasing documentation requirements for activities and education</li>
                    <li>More complex social, educational, and developmental expectations</li>
                    <li>Digital proliferation creating more channels to manage</li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-medium mb-4">The Personal Cost</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-500 mb-2">42%</div>
                      <p className="text-sm text-gray-600">Of parents have missed important family events due to coordination failure</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-500 mb-2">3.5x</div>
                      <p className="text-sm text-gray-600">Increase in relationship conflict attributed to family logistics failures</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-500 mb-2">67%</div>
                      <p className="text-sm text-gray-600">Of parents feel they're not present enough with their children</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-500 mb-2">$12K</div>
                      <p className="text-sm text-gray-600">Average annual financial waste from poor family coordination</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-indigo-50 p-6 rounded-lg shadow-sm border border-indigo-100">
                <p className="italic text-gray-700">"The mental load is invisible but crushes families. It's not just about doing tasks — it's constant planning, anticipating needs, and remembering details that no app currently manages comprehensively."</p>
                <p className="text-right mt-2 text-gray-500">— Dr. Sarah Peterson, Family Systems Researcher</p>
              </div>
            </div>
          </div>
        );

      case 63:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              63
            </div>
            <div className="min-h-[80vh] flex flex-col justify-center px-8 bg-gradient-to-br from-indigo-50 to-purple-100">
              <h2 className="text-3xl md:text-4xl font-light mb-6">The Critical Perception Gap</h2>

              <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h3 className="text-xl font-medium mb-4">Relationship Research Reveals:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div>
                    <div className="bg-pink-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-pink-800">Primary Manager Perception</h4>
                      <p className="text-gray-700">"I'm managing 35+ household responsibilities but my partner only sees the 10 that are visible."</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800">Partner Perception</h4>
                      <p className="text-gray-700">"I help with everything they ask me to do, but they keep saying it's not enough."</p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="font-medium text-center mb-2">Division of Mental Load</div>
                    <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                      <div className="absolute top-0 left-0 h-full bg-pink-400" style={{ width: '78%' }}></div>
                      <div className="absolute top-0 right-0 h-full bg-blue-400" style={{ width: '22%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span>Primary Manager: 78%</span>
                      <span>Partner: 22%</span>
                    </div>
                    <p className="mt-4 text-sm text-gray-600">The invisible mental load is rarely acknowledged or effectively redistributed without proper tools.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-lg shadow-md">
                  <h3 className="font-medium text-lg mb-3">Visibility Problem</h3>
                  <p className="text-gray-700">Most family work is invisible and happens before tasks are ever assigned, creating perception gaps</p>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-md">
                  <h3 className="font-medium text-lg mb-3">Communication Failure</h3>
                  <p className="text-gray-700">Current tools fragment communication across platforms, leading to dangerous coordination gaps</p>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-md">
                  <h3 className="font-medium text-lg mb-3">Contextual Awareness</h3>
                  <p className="text-gray-700">Existing tools lack relationship knowledge and history needed for task evaluation and prioritization</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 64:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              64
            </div>
            <div className="min-h-[80vh] flex flex-col justify-center px-8 bg-gradient-to-br from-indigo-50 to-purple-100">
              <h2 className="text-3xl md:text-4xl font-light mb-6">The Hidden Mental Load</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-medium mb-4">What Is Mental Load?</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Anticipating needs</strong>
                        <p className="text-gray-600 text-sm">Proactively thinking about what might be needed before it's asked for</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Remembering details</strong>
                        <p className="text-gray-600 text-sm">Tracking hundreds of family-specific details from preferences to schedules</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Monitoring systems</strong>
                        <p className="text-gray-600 text-sm">Maintaining awareness of household, relationship, and child systems</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Managing emotions</strong>
                        <p className="text-gray-600 text-sm">Emotional labor of maintaining family harmony and addressing conflicts</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-medium mb-4">Impact of Unrecognized Mental Load</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">Relationship Satisfaction</span>
                        <span className="text-red-500 font-medium">-47%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '47%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">Burnout Risk</span>
                        <span className="text-red-500 font-medium">+68%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">Life Satisfaction</span>
                        <span className="text-red-500 font-medium">-39%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '39%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700">Career Impact</span>
                        <span className="text-red-500 font-medium">-29%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-red-500 h-2 rounded-full" style={{ width: '29%' }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-gray-700">The problem compounds over time: 76% of divorces cite "unequal burden" as a primary factor leading to relationship failure.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-indigo-50 p-6 rounded-lg border border-indigo-100 shadow-sm">
                <h3 className="font-medium text-lg mb-3">Why Technology Has Failed Families</h3>
                <p className="text-gray-700 mb-4">Current tools either focus on individual tasks (calendars, to-do lists) or try to solve specific edge cases (meal planning), but none address the meta-coordination problem families face or provide relationship-aware intelligence.</p>
                <p className="text-gray-700">Families need a comprehensive solution that combines practical utility with emotional intelligence.</p>
              </div>
            </div>
          </div>
        );

      case 65:
        return (
          <div className="relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              65
            </div>
            <div className="min-h-[80vh] flex flex-col justify-center px-8 bg-gradient-to-br from-indigo-50 to-purple-100">
              <h2 className="text-3xl md:text-4xl font-light mb-6">The Family Command Center</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-medium mb-4">Essential Features</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Smart Calendar</strong>
                        <p className="text-gray-600 text-sm">AI-enhanced unified family calendar with proactive conflict resolution</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Task Distribution</strong>
                        <p className="text-gray-600 text-sm">Equitable task assignment with mental load awareness and smart delegation</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Event Forecasting</strong>
                        <p className="text-gray-600 text-sm">AI prediction of upcoming needs based on historical patterns</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Reminder System</strong>
                        <p className="text-gray-600 text-sm">Personalized reminders with optimized timing and delivery methods</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Knowledge Hub</strong>
                        <p className="text-gray-600 text-sm">Central repository for family information, documents, and history</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-xl font-medium mb-4">How Allie Changes the Game</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">AI-Powered Integration</strong>
                        <p className="text-gray-600 text-sm">Unifies fragmented tools into a coherent ecosystem using relationship-aware AI</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Mental Load Recognition</strong>
                        <p className="text-gray-600 text-sm">First product to explicitly measure, track and balance invisible work</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Relationship Intelligence</strong>
                        <p className="text-gray-600 text-sm">Builds a comprehensive understanding of family dynamics and adapts accordingly</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Proactive Assistance</strong>
                        <p className="text-gray-600 text-sm">Anticipates needs and provides suggestions before being asked</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </div>
                      <div>
                        <strong className="text-gray-800">Privacy-First Design</strong>
                        <p className="text-gray-600 text-sm">All family data is secure, private, and never sold to third parties</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-indigo-100 p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-medium mb-4 text-center">Key Results from Beta Testing</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-indigo-700 mb-1">89%</div>
                    <p className="text-sm text-gray-700">Reduction in missed events & coordination failures</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-indigo-700 mb-1">63%</div>
                    <p className="text-sm text-gray-700">Increase in relationship satisfaction scores</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-indigo-700 mb-1">4.2h</div>
                    <p className="text-sm text-gray-700">Weekly time savings per parent</p>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-indigo-700 mb-1">76%</div>
                    <p className="text-sm text-gray-700">Report feeling "back in control" of family life</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      // Add other custom slides here as needed
      
      default:
        // Default slide if none of the above
        return (
          <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-gradient-to-br from-purple-50 to-indigo-100 relative">
            <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
              {currentSlide}
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Slide {currentSlide}</h1>
            <p className="text-xl text-gray-700 mb-6">
              Content for this slide is not available.
            </p>
          </div>
        );
    }
  };

  // Render the component
  return (
    <div className="min-h-screen flex flex-col relative">
      {/* In-app notification */}
      {renderNotification()}
      
      {/* Vertical Progress Bar on left side */}
      {currentSlide > 1 && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '20px',
          transform: 'translateY(-50%)',
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          borderRadius: '12px',
          padding: '15px 10px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '15px'
        }}>
          {sections.map((section, index) => (
            <div 
              key={section}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: index <= sectionIndex ? '#8b5cf6' : '#e5e7eb',
                border: '2px solid white',
                boxShadow: index <= sectionIndex ? '0 0 4px rgba(139, 92, 246, 0.5)' : 'none'
              }}></div>
              <div style={{
                fontSize: '13px',
                fontWeight: currentSection === section ? 'bold' : 'normal',
                color: currentSection === section ? '#8b5cf6' : '#6b7280',
                textTransform: 'capitalize'
              }}>
                {section}
              </div>
            </div>
          ))}
          
          {/* Vertical connecting line */}
          <div style={{
            position: 'absolute',
            top: '25px',
            bottom: '25px',
            left: '18px',
            width: '2px',
            backgroundColor: '#e5e7eb',
            zIndex: -1
          }}></div>
        </div>
      )}
      
      {/* Slide content */}
      <div ref={slideRef} className="flex-grow">
        {renderSlide()}
      </div>
      
      {/* Slide navigation */}
      {currentSlide > 1 && (
        <div className="fixed bottom-4 right-4 flex space-x-4">
          <button
            onClick={prevSlide}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={nextSlide}
            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-lg transition-all duration-200"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      )}
      
      {/* Slide number indicator */}
      <div className="fixed bottom-4 left-4 bg-white px-3 py-1 rounded-full shadow-md text-sm font-medium text-gray-700">
        {currentSlide} / {totalSlides}
      </div>
    </div>
  );
};

export default InvestorFunnelComprehensive;