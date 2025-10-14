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
import PasswordProtection from '../shared/PasswordProtection';
import ProgressBar, { getSlideSection } from './investorSlides/ProgressBar';

// Import all slide components
import CompetitorLandscapeSlide from './investorSlides/CompetitorLandscapeSlide';
import BusinessCaseValidationSlide from './investorSlides/BusinessCaseValidationSlide';
import FamilyFlywheelSlide1 from './investorSlides/FamilyFlywheelSlide1';
import FamilyFlywheelSlide2 from './investorSlides/FamilyFlywheelSlide2';
import FamilyFlywheelSlide3 from './investorSlides/FamilyFlywheelSlide3';
import LTVExpansionSlide from './investorSlides/LTVExpansionSlide';
import ParentalGapSlide from './investorSlides/ParentalGapSlide';
import GenerationalImbalanceSlide from './investorSlides/GenerationalImbalanceSlide';
import SiblingDynamicsSlide from './investorSlides/SiblingDynamicsSlide';
import SolutionSummarySlide from './investorSlides/SolutionSummarySlide';
import AwarenessFirstSlide from './investorSlides/AwarenessFirstSlide';

// Define slide data structure
const slides = [
  {
    id: 1,
    title: "Opening Impact",
    component: null, // Will be rendered through switch statement for legacy slides
    hasInteractiveElements: false
  },
  {
    id: 2,
    title: "The Invisible Crisis",
    component: null,
    hasInteractiveElements: false
  },
  {
    id: 3,
    title: "Global Crisis Impact",
    component: null,
    hasInteractiveElements: false
  },
  {
    id: 4, 
    title: "Perception Gap",
    component: null,
    hasInteractiveElements: true
  },
  {
    id: 5,
    title: "Parental Gap Data",
    component: ParentalGapSlide,
    hasInteractiveElements: true
  },
  {
    id: 6,
    title: "Generational Cycle",
    component: GenerationalImbalanceSlide,
    hasInteractiveElements: true
  },
  {
    id: 7,
    title: "Breaking the Cycle: Children as Agents of Change",
    component: null, // Custom JSX in renderSlideContent
    hasInteractiveElements: true,
    isCustomRender: true
  },
  {
    id: 8,
    title: "The Sibling Advantage",
    component: SiblingDynamicsSlide,
    hasInteractiveElements: true
  },
  {
    id: 9,
    title: "Workload Visualization",
    component: null,
    hasInteractiveElements: false
  },
  {
    id: 10,
    title: "Time Value Analysis",
    component: null,
    hasInteractiveElements: false
  },
  {
    id: 11,
    title: "Relationship Impact",
    component: null, // Custom JSX in renderSlideContent
    hasInteractiveElements: false,
    isCustomRender: true
  },
  {
    id: 12,
    title: "Scientific Foundation",
    component: null,
    hasInteractiveElements: false
  },
  {
    id: 13,
    title: "Personalized Approach",
    component: null,
    hasInteractiveElements: false
  },
  {
    id: 14,
    title: "The Power of Awareness",
    component: AwarenessFirstSlide,
    hasInteractiveElements: true
  },
  {
    id: 15,
    title: "Solution Summary",
    component: SolutionSummarySlide,
    hasInteractiveElements: true
  },
  {
    id: 15,
    title: "Family Flywheel - Trust Layers",
    component: FamilyFlywheelSlide1,
    hasInteractiveElements: true
  },
  {
    id: 16,
    title: "Family Data Graph",
    component: FamilyFlywheelSlide2,
    hasInteractiveElements: true
  },
  {
    id: 17,
    title: "Lifetime Value Model",
    component: FamilyFlywheelSlide3,
    hasInteractiveElements: true
  },
  {
    id: 18,
    title: "LTV Expansion Path",
    component: LTVExpansionSlide,
    hasInteractiveElements: true
  },
  {
    id: 19,
    title: "Competitive Landscape",
    component: CompetitorLandscapeSlide,
    hasInteractiveElements: true
  },
  {
    id: 20,
    title: "Market Validation",
    component: BusinessCaseValidationSlide,
    hasInteractiveElements: true
  },
  {
    id: 21,
    title: "Technology Stack",
    component: null,
    hasInteractiveElements: false
  },
  {
    id: 22,
    title: "Team & Advisors",
    component: null,
    hasInteractiveElements: false
  },
  {
    id: 23,
    title: "Product Roadmap",
    component: null,
    hasInteractiveElements: false
  },
  {
    id: 24,
    title: "Mental Load Assessment",
    component: null,
    hasInteractiveElements: false
  },
  {
    id: 25,
    title: "Financial Projections",
    component: null,
    hasInteractiveElements: false
  },
  {
    id: 26,
    title: "Initial Traction",
    component: null,
    hasInteractiveElements: false
  },
  {
    id: 27,
    title: "Next Steps",
    component: null,
    hasInteractiveElements: false
  }
];

// Get title by slide id
const getSlideTitle = (slideId) => {
  const slide = slides.find(s => s.id === slideId);
  return slide ? slide.title : `Slide ${slideId}`;
};

// Check if slide has interactive elements
const hasInteractiveElements = (slideId) => {
  const slide = slides.find(s => s.id === slideId);
  return slide ? slide.hasInteractiveElements : false;
};

const InvestorFunnel = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [revealAnswers, setRevealAnswers] = useState({});
  const [taskSelections, setTaskSelections] = useState({});
  const [activeScienceCard, setActiveScienceCard] = useState(null);
  const [activeCommandCenter, setActiveCommandCenter] = useState('calendar');
  const [financialView, setFinancialView] = useState('revenue');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notification, setNotification] = useState(null);
  const [interactionNotifShown, setInteractionNotifShown] = useState(false);
  const [previousSlide, setPreviousSlide] = useState(1);
  
  const totalSlides = slides.length;
  
  // Function to render notification with improved positioning
  const renderNotification = () => {
    if (!notification) return null;
    if (typeof notification !== 'object' || !notification.message) return null;
    
    return (
      <div className="fixed top-24 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg bg-purple-100 text-purple-800 flex items-center justify-between">
        <div className="flex items-center">
          <span className="mr-2">
            {notification.type === 'info' ? <HelpCircle size={16} /> : <AlertTriangle size={16} />}
          </span>
          <p>{notification.message}</p>
        </div>
        <button onClick={() => setNotification(null)} className="ml-4">
          <ChevronUp size={20} />
        </button>
      </div>
    );
  };
  
  // Updated: Show notification only when navigating to a new slide with interactive elements
  useEffect(() => {
    // Only show notification when:
    // 1. User has moved to a new slide (currentSlide !== previousSlide)
    // 2. Current slide has interactive elements
    // 3. Notification hasn't been shown yet
    if (currentSlide !== previousSlide && 
        currentSlide > 3 && 
        hasInteractiveElements(currentSlide) && 
        !interactionNotifShown) {
      setTimeout(() => {
        // Make sure we're setting a proper object with message and type
        const notifObject = {
          message: 'Click on the elements to explore more details!',
          type: 'info'
        };
        setNotification(notifObject);
        // Only show the notification once per session
        setInteractionNotifShown(true);
      }, 1000);
    }
    
    // Update document title based on current slide
    document.title = `Investor Presentation: ${getSlideTitle(currentSlide) || 'Allie'}`;
    
  }, [currentSlide, previousSlide, interactionNotifShown]);
  
  // Navigate through demo steps
  const nextSlide = () => {
    // Update previous slide state for notification control
    setPreviousSlide(currentSlide);
    
    let newSlide = currentSlide + 1;
    if (newSlide <= totalSlides) {
      setCurrentSlide(newSlide);
    }
  };
  
  const prevSlide = () => {
    // Update previous slide state for notification control
    setPreviousSlide(currentSlide);
    
    let newSlide = currentSlide - 1;
    if (newSlide >= 1) {
      setCurrentSlide(newSlide);
    }
  };
  
  const goToSlide = (slide) => {
    // Update previous slide state for notification control
    setPreviousSlide(currentSlide);
    
    if (slide >= 1 && slide <= totalSlides) {
      setCurrentSlide(slide);
    }
  };
  
  // Render specialized custom slides
  const renderCustomSlide = (slideId) => {
    switch(slideId) {
      case 7: // Breaking the Cycle: Children as Agents of Change
        return (
          <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-light mb-6">Breaking the Cycle: Children as Agents of Change</h2>
              
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Left column */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-xl font-medium mb-3">Children Inherit Equity Models</h3>
                    <p className="text-gray-700 mb-3">
                      Research shows children who grow up seeing equitable division of 
                      cognitive labor are 4.2× more likely to create balanced partnerships as adults.
                    </p>
                    <div className="bg-indigo-50 p-3 rounded">
                      <p className="text-sm text-indigo-700">
                        <strong>Key insight:</strong> Breaking gender imbalance is both a 
                        present-tense family problem AND a generational opportunity.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-xl font-medium mb-3">Breaking Gender Script Formation</h3>
                    <p className="text-gray-700 mb-3">
                      Children begin forming gender scripts for household roles between ages 3-7. 
                      Allie creates visibility that helps parents model balanced roles during this critical window.
                    </p>
                    <div className="flex items-center text-green-700 mt-4">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <p className="text-sm">Creates immediate impact with long-term effects</p>
                    </div>
                  </div>
                </div>
                
                {/* Right column */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-xl font-medium mb-3">Children's Direct Input</h3>
                    <p className="text-gray-700 mb-3">
                      Allie's kid-friendly surveys capture children's interests, concerns, and activities, 
                      generating insights to relieve parents from constant preference-tracking.
                    </p>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="bg-purple-100 p-2 rounded text-center">
                        <p className="text-xs font-medium text-purple-700">Interest Tracking</p>
                      </div>
                      <div className="bg-blue-100 p-2 rounded text-center">
                        <p className="text-xs font-medium text-blue-700">Activity Preferences</p>
                      </div>
                      <div className="bg-pink-100 p-2 rounded text-center">
                        <p className="text-xs font-medium text-pink-700">Emotional Check-ins</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black p-5 rounded-lg text-white">
                    <h3 className="text-xl font-medium mb-3">Long-Term Market Opportunity</h3>
                    <p className="text-gray-300 mb-4">
                      Children who grow up with Allie will expect similar tools as adults.
                      We're creating tomorrow's users by solving today's problems.
                    </p>
                    <div className="flex justify-between text-center">
                      <div>
                        <p className="text-2xl font-semibold">73%</p>
                        <p className="text-xs text-gray-400">of Gen Z expect tech solutions</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">12yr</p>
                        <p className="text-xs text-gray-400">customer lifetime value</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">2.3×</p>
                        <p className="text-xs text-gray-400">higher adoption rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-2">Our Double-Impact Thesis</h3>
                <p>
                  By helping today's parents balance workload, we simultaneously reshape expectations for the next generation,
                  creating a virtuous cycle that expands our addressable market over time.
                </p>
              </div>
            </div>
          </div>
        );
      
      case 11: // Relationship Impact
        return (
          <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-light mb-6">Relationship Impact</h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h3 className="text-xl font-medium mb-3">Balance Leads to Better Relationships</h3>
                  <p className="text-gray-700 mb-3">
                    Equitable sharing of mental load correlates with:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="mr-2 flex-shrink-0 text-purple-600">•</div>
                      <p className="text-sm">Higher relationship satisfaction (+42%)</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 flex-shrink-0 text-purple-600">•</div>
                      <p className="text-sm">Reduced conflict over household tasks (-67%)</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 flex-shrink-0 text-purple-600">•</div>
                      <p className="text-sm">Improved intimacy and connection (+38%)</p>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h3 className="text-xl font-medium mb-3">Impact Metrics</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Reduced resentment</span>
                        <span>-78%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '78%'}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Communication improvement</span>
                        <span>+53%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '53%'}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Shared problem-solving</span>
                        <span>+61%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '61%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div>Slide content not found</div>;
    }
  };
  
  // Main slide rendering function
  const renderSlideContent = () => {
    const slide = slides.find(s => s.id === currentSlide);
    
    if (!slide) {
      return <div>Slide not found</div>;
    }
    
    // If slide has a direct component, render it
    if (slide.component) {
      const SlideComponent = slide.component;
      return <SlideComponent />;
    }
    
    // If slide has custom rendering logic
    if (slide.isCustomRender) {
      return renderCustomSlide(slide.id);
    }
    
    // For legacy slides, use the switch statement
    switch(currentSlide) {
      // Slide 1: Opening Impact
      case 1:
        return (
          <div className="min-h-[80vh] flex items-center justify-center bg-black text-white px-8">
            {/* ...existing slide content... */}
            <h1 className="text-6xl font-light">Allie Investor Deck</h1>
          </div>
        );
      
      // Add all other case statements for legacy slides...
      
      default:
        return <div>Slide {currentSlide}: {slide.title}</div>;
    }
  };
  
  // Navigation component
  const Navigation = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-10">
      <button
        onClick={prevSlide}
        disabled={currentSlide <= 1}
        className={`px-4 py-2 rounded-lg flex items-center ${
          currentSlide <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-800 hover:bg-gray-100'
        }`}
      >
        <ArrowLeft size={18} className="mr-2" />
        Previous
      </button>
      
      <div className="text-sm font-medium">
        <span>{currentSlide}: {getSlideTitle(currentSlide)}</span>
      </div>
      
      <button
        onClick={nextSlide}
        disabled={currentSlide >= totalSlides}
        className={`px-4 py-2 rounded-lg flex items-center ${
          currentSlide >= totalSlides ? 'text-gray-300 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'
        }`}
      >
        Next
        <ArrowRight size={18} className="ml-2" />
      </button>
    </div>
  );
  
  // Simple function to determine current section
  const getCurrentSection = () => {
    if (currentSlide <= 11) return 'problem';
    if (currentSlide <= 23) return 'solution';
    if (currentSlide <= 19) return 'market';
    if (currentSlide <= 25) return 'traction';
    if (currentSlide === 21) return 'team';
    if (currentSlide === 26) return 'financials';
    return 'problem';
  };
  
  // Calculate progress percentage (1-6 for 6 sections)
  const sections = ['problem', 'solution', 'market', 'traction', 'team', 'financials'];
  const currentSection = getCurrentSection();
  const sectionIndex = sections.indexOf(currentSection);
  const progressPercentage = ((sectionIndex + 1) / sections.length) * 100;
  
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
            zIndex: '-1'
          }}></div>
          
          {/* Progress line */}
          <div style={{
            position: 'absolute',
            top: '25px',
            height: `${(sectionIndex / (sections.length - 1)) * 100}%`,
            left: '18px',
            width: '2px',
            backgroundColor: '#8b5cf6',
            zIndex: '0',
            transition: 'height 0.5s ease-out'
          }}></div>
        </div>
      )}
      
      {/* Navigation controls */}
      <div className="fixed bottom-4 left-0 right-0 z-50 flex justify-center">
        <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
          <button
            onClick={prevSlide}
            disabled={currentSlide <= 1}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentSlide <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-800 hover:bg-gray-100'
            }`}
          >
            <ArrowLeft size={18} />
          </button>
          
          <span className="text-sm font-medium px-2">
            {currentSlide} / {totalSlides}
          </span>
          
          <button
            onClick={nextSlide}
            disabled={currentSlide >= totalSlides}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentSlide >= totalSlides ? 'text-gray-300 cursor-not-allowed' : 'text-purple-600 hover:bg-purple-100'
            }`}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      
      {/* Main slide content */}
      <div>
        {renderSlideContent()}
      </div>
    </div>
  );
};

export default InvestorFunnel;