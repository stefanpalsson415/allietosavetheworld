// This is a combined version with the vertical progress bar

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowRight, ArrowLeft, Check, Brain, Heart, Scale, 
    Clock, BarChart, Users, Command, Calendar, 
    FileText, MessageSquare, Database, Activity, Shield, 
    Zap, Star, Target, Lock, Award, ChevronRight,
    ChevronDown, ChevronUp, AlertTriangle, RefreshCw,
    PlusCircle, Layers, Key, Sparkles, CheckCircle,
    Camera, Code, DollarSign, TrendingUp, HelpCircle
  } from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, Legend, 
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, Tooltip, PieChart, Pie,
  Cell, LineChart, Line
} from 'recharts';

// Import components
import CompetitorLandscapeSlide from './investorSlides/CompetitorLandscapeSlide';
import BusinessCaseValidationSlide from './investorSlides/BusinessCaseValidationSlide';
import FamilyFlywheelSlide1 from './investorSlides/FamilyFlywheelSlide1';
import FamilyFlywheelSlide2 from './investorSlides/FamilyFlywheelSlide2';
import FamilyFlywheelSlide3 from './investorSlides/FamilyFlywheelSlide3';
import MacroTailwindsSlide from './investorSlides/MacroTailwindsSlide';
import ParentalGapSlide from './investorSlides/ParentalGapSlide';
import GenerationalImbalanceSlide from './investorSlides/GenerationalImbalanceSlide';
import SiblingDynamicsSlide from './investorSlides/SiblingDynamicsSlide';
import MarketSizeSlide from './investorSlides/MarketSizeSlide';
import WorkloadVisualizationSlide from './investorSlides/WorkloadVisualizationSlide';
import PersonalizedApproachSlide from './investorSlides/PersonalizedApproachSlide';
import ProblemSummarySlide from './investorSlides/ProblemSummarySlide';

// Import all other slide components
import InitialTractionSlide from './investorSlides/InitialTractionSlide';
import MarketSummarySlide from './investorSlides/MarketSummarySlide';
import MentalLoadAssessmentSlide from './investorSlides/MentalLoadAssessmentSlide';
import NextStepsSlide from './investorSlides/NextStepsSlide';
import DataValueSlide from './investorSlides/DataValueSlide';
import LTVExpansionSlide from './investorSlides/LTVExpansionSlide';
import ProductRoadmapSlide from './investorSlides/ProductRoadmapSlide';
import ScientificFoundationSlide from './investorSlides/ScientificFoundationSlide';
import SolutionSummarySlide from './investorSlides/SolutionSummarySlide';
import TeamAdvisorsSlide from './investorSlides/TeamAdvisorsSlide';
import TechnologyStackSlide from './investorSlides/TechnologyStackSlide';
import TimeValueAnalysisSlide from './investorSlides/TimeValueAnalysisSlide';
import TractionSummarySlide from './investorSlides/TractionSummarySlide';
import FinancialProjectionsSlide from './investorSlides/FinancialProjectionsSlide';

const InvestorFunnelWithProgressBar = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [feedback, setFeedback] = useState({ data: {}, sent: false });
  const [showSlideMenu, setShowSlideMenu] = useState(false);
  const [notification, setNotification] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const slideRef = useRef(null);
  
  const totalSlides = 40; // Adjust based on your actual slide count

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
        if (num >= 0 && num <= 9) {
          goToSlide(num);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, navigate]);

  // Handle quiz answer selection
  const handleQuizAnswer = (question, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [question]: answer
    }));
  };

  // Navigate to next slide
  const nextSlide = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  // Navigate to previous slide
  const prevSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Navigate to a specific slide
  const goToSlide = (slideNum) => {
    if (slideNum >= 1 && slideNum <= totalSlides) {
      setCurrentSlide(slideNum);
    }
  };

  // Function to render notification
  const renderNotification = () => {
    if (!notification) return null;
    
    return (
      <div className="fixed top-24 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg bg-purple-100 text-purple-800 flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2">
            <AlertTriangle size={16} />
          </span>
          <p>{notification.message}</p>
        </div>
        <button onClick={() => setNotification(null)} className="ml-4">
          <ChevronUp size={20} />
        </button>
      </div>
    );
  };

  // Define sections for progress bar
  const sections = ['problem', 'solution', 'market', 'traction', 'team', 'financials'];
  
  // Get current section
  const getCurrentSection = () => {
    if (currentSlide <= 11) return 'problem';
    if (currentSlide <= 23) return 'solution';
    if (currentSlide <= 29) return 'market';
    if (currentSlide <= 33) return 'traction';
    if (currentSlide <= 36) return 'team';
    return 'financials';
  };
  
  const currentSection = getCurrentSection();
  const sectionIndex = sections.indexOf(currentSection);

  // Render the slides
  const renderSlide = () => {
    // Title slide
    if (currentSlide === 1) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center bg-black text-white px-8">
          <div className="max-w-4xl text-center">
            <h1 className="text-6xl md:text-8xl font-light mb-6 opacity-90">Allie</h1>
            <h2 className="text-xl md:text-3xl font-light mb-8 opacity-80">Your Family's Private AI Partner</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-900 bg-opacity-30 flex items-center justify-center mb-3">
                  <Brain size={32} className="text-indigo-300" />
                </div>
                <span className="text-sm font-light opacity-80">AI-Powered</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-900 bg-opacity-30 flex items-center justify-center mb-3">
                  <Heart size={32} className="text-indigo-300" />
                </div>
                <span className="text-sm font-light opacity-80">Relationship-Aware</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-900 bg-opacity-30 flex items-center justify-center mb-3">
                  <Shield size={32} className="text-indigo-300" />
                </div>
                <span className="text-sm font-light opacity-80">Private & Secure</span>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-900 bg-opacity-30 flex items-center justify-center mb-3">
                  <Clock size={32} className="text-indigo-300" />
                </div>
                <span className="text-sm font-light opacity-80">Time-Saving</span>
              </div>
            </div>
            
            <div className="text-sm font-light opacity-50 animate-pulse">
              Press space bar or arrow keys to navigate
            </div>
          </div>
        </div>
      );
    }

    // For remaining slides, use the switch statement
    switch(currentSlide) {
      // Slide 2: Problem Summary
      case 2:
        return <ProblemSummarySlide />;
        
      // Slide 3: Parental Gap
      case 3:
        return <ParentalGapSlide />;
          
      // Slide 4: Generational Imbalance 
      case 4:
        return <GenerationalImbalanceSlide />;
            
      // Slide 5: Mental Load Assessment
      case 5:
        return <MentalLoadAssessmentSlide />;
              
      // Slide 6: Workload Visualization
      case 6:
        return <WorkloadVisualizationSlide />;

      // Slide 7: Macro Tailwinds
      case 7:
        return <MacroTailwindsSlide />;

      // Slide 8: Competitor Landscape
      case 8:
        return <CompetitorLandscapeSlide />;
            
      // Slide 9: Sibling Dynamics
      case 9:
        return <SiblingDynamicsSlide />;

      // Slide 10: Time Value Analysis
      case 10:
        return <TimeValueAnalysisSlide />;

      // Slide 11: Business Case Validation
      case 11:
        return <BusinessCaseValidationSlide />; 
        
      // Slide 12: Solution Summary
      case 12:
        return <SolutionSummarySlide />;
        
      // Slide 13: Personalized Approach
      case 13:
        return <PersonalizedApproachSlide />;
      
      // Slide 14-16: Family Flywheel 1-3
      case 14:
        return <FamilyFlywheelSlide1 />;
      case 15:
        return <FamilyFlywheelSlide2 />;
      case 16:
        return <FamilyFlywheelSlide3 />;
      
      // Slide 17: Data Value
      case 17:
        return <DataValueSlide />;
        
      // Slide 18: LTV Expansion
      case 18:
        return <LTVExpansionSlide />;
        
      // Slide 19: Product Roadmap
      case 19:
        return <ProductRoadmapSlide />;
        
      // Slide 20: Technology Stack
      case 20:
        return <TechnologyStackSlide />;
      
      // Slide 21: Scientific Foundation
      case 21:
        return <ScientificFoundationSlide />;
      
      // Slide 22: Market Summary
      case 22:
        return <MarketSummarySlide />;
        
      // Slide 23: Market Size
      case 23:
        return <MarketSizeSlide />;
      
      // Slide 24: 10K Families, 24 Months, <$50K Cash
      case 24:
        return (
          <div className="min-h-[80vh] flex flex-col justify-center px-8 bg-gradient-to-br from-indigo-50 to-purple-100">
            <h2 className="text-3xl md:text-4xl font-light mb-6">10K Families, 24 Months, &lt;$50K Cash</h2>
            
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

      // Slide 25: Initial Traction
      case 25:
        return <InitialTractionSlide />;
        
      // Slide 26: Traction Summary
      case 26:
        return <TractionSummarySlide />;
      
      // Slide 27: Onion Flywheel Part 1
      case 27:
        return (
          <div className="min-h-[80vh] flex flex-col justify-center px-8 bg-gradient-to-br from-indigo-50 to-purple-100">
            <h2 className="text-3xl md:text-4xl font-light mb-6">Onion Flywheel: Data-Driven LTV Growth (1/2)</h2>
            
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
            
      // Slide 28: Onion Flywheel Part 2
      case 28:
        return (
          <div className="min-h-[80vh] flex flex-col justify-center px-8 bg-gradient-to-br from-indigo-50 to-purple-100">
            <h2 className="text-3xl md:text-4xl font-light mb-6">Onion Flywheel: Data-Driven LTV Growth (2/2)</h2>
            
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
      
      // Slide 29: Team Advisors 
      case 29:
        return <TeamAdvisorsSlide />;

      // Slide 30: Financial Projections
      case 30:
        return <FinancialProjectionsSlide />;

      // Slide 31: Next Steps
      case 31:
        return <NextStepsSlide />;
      
      // Default 
      default:
        return (
          <div className="min-h-[80vh] flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <h2 className="text-3xl font-semibold text-gray-800 mb-4">Slide {currentSlide}</h2>
              <p className="text-gray-500">This slide is under construction.</p>
            </div>
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
      <div className="flex-grow">
        {renderSlide()}
      </div>
      
      {/* Navigation buttons */}
      <div className="fixed bottom-8 right-8 flex gap-4">
        {currentSlide > 1 && (
          <button 
            onClick={prevSlide}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white shadow-lg transition-all"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        
        <button 
          onClick={nextSlide}
          className="p-3 bg-indigo-600 hover:bg-indigo-700 rounded-full text-white shadow-lg transition-all"
        >
          <ArrowRight size={24} />
        </button>
      </div>
      
      {/* Slide counter */}
      <div className="fixed bottom-8 left-8 bg-white px-3 py-1 rounded-full shadow text-sm font-medium">
        {currentSlide} / {totalSlides}
      </div>
    </div>
  );
};

export default InvestorFunnelWithProgressBar;