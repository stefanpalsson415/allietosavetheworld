import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain, Heart, Calendar, FileText, Sparkles, Users, Gift,
  MessageCircle, Phone, Mail, Camera, ArrowDown, CheckCircle,
  Loader2, Home, TrendingUp, Star, Zap, Shield, Clock,
  Baby, BarChart3, Lightbulb, HeartHandshake, ChevronDown,
  ClipboardList, Globe, TrendingDown, X, RotateCw, Vote, Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/mobile-viewport-fix.css';
import SalesAllieChat from '../chat/SalesAllieChat';
import QuickBalanceQuiz from './QuickBalanceQuiz';
import LandingPageSurvey from './LandingPageSurvey';
import ModernQuickBalanceQuiz from './ModernQuickBalanceQuiz';
import EnhancedQuickBalanceQuiz from './EnhancedQuickBalanceQuiz';

// Animated Allie character component
const AllieCharacter = ({ mood = 'happy', size = 'md', animate = false }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  };

  const moodColors = {
    curious: 'from-purple-400 to-indigo-600',
    happy: 'from-pink-400 to-rose-600',
    helpful: 'from-blue-400 to-cyan-600',
    celebrating: 'from-amber-400 to-yellow-600'
  };

  return (
    <div className={`relative ${animate ? 'animate-bounce' : ''}`}>
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${moodColors[mood]} shadow-lg flex items-center justify-center`}>
        <Brain className="text-white" size={size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 32 : 24} />
      </div>
      {mood === 'celebrating' && (
        <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={20} />
      )}
    </div>
  );
};

// Family member illustrations - Using real Palsson family photos
const FamilyMember = ({ role, mood = 'neutral', size = 'md', name }) => {
  const sizeClasses = {
    sm: 'w-16 h-16',    // was 20, now 16 (20% smaller)
    md: 'w-20 h-20',    // was 28, now 20 (28% smaller)
    lg: 'w-24 h-24',    // was 32, now 24 (25% smaller)
    xl: 'w-36 h-36'     // was 48, now 36 (25% smaller)
  };

  const moodStyles = {
    stressed: 'border-red-300 shadow-red-200',
    neutral: 'border-gray-300 shadow-gray-200',
    happy: 'border-green-300 shadow-green-200'
  };

  const familyPhotos = {
    stefan: '/family-photos/stefan.jpg',
    kimberly: '/family-photos/kimberly.jpg',
    lillian: '/family-photos/lillian.jpg',
    oly: '/family-photos/oly.jpg', // You'll need to save Oly's photo here
    tegner: '/family-photos/tegner.jpg'
  };

  // For Oly, we'll use the uploaded image or a placeholder
  const getPhotoUrl = () => {
    if (role === 'oly') {
      return familyPhotos.oly;
    }
    return familyPhotos[role] || null;
  };

  const photoUrl = getPhotoUrl();

  return (
    <div className="text-center">
      <div className={`${sizeClasses[size]} rounded-full border-4 ${moodStyles[mood]} overflow-hidden shadow-lg transition-all duration-500 mx-auto`}>
        {photoUrl ? (
          <img 
            src={photoUrl} 
            alt={name || role}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center"><span class="text-2xl font-bold text-gray-600">${name ? name[0] : role[0].toUpperCase()}</span></div>`;
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-600">
              {name ? name[0] : role[0].toUpperCase()}
            </span>
          </div>
        )}
      </div>
      {name && (
        <p className="mt-2 text-base font-medium text-gray-700">{name}</p>
      )}
    </div>
  );
};

const StorytellingHomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuiz, setShowQuiz] = useState(false);
  const [useModernQuiz, setUseModernQuiz] = useState(false); // Set to false to use the full QuickBalanceQuiz with all features
  const [isNavigating, setIsNavigating] = useState(false);

  // Check if we're in incognito mode or if the user is actually logged in
  const isActuallyLoggedIn = currentUser && currentUser.uid;

  // Helper function to navigate with loading state
  const handleNavigate = (path) => {
    console.log('🚀 Navigating to:', path);
    setIsNavigating(true);
    navigate(path);
  };

  // Ensure component is visible after mounting
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Development helper: Press Shift+Ctrl+Q to clear all quiz/onboarding data
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.shiftKey && e.ctrlKey && e.key === 'Q') {
        console.log('Clearing all quiz and onboarding data...');
        localStorage.removeItem('quickQuizProgress');
        localStorage.removeItem('onboardingProgress');
        localStorage.removeItem('pendingFamilyData');
        localStorage.removeItem('lastCreatedFamilyId');
        localStorage.removeItem('selectedFamilyId');
        localStorage.removeItem('directFamilyAccess');
        alert('Quiz and onboarding cache cleared!');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Track scroll progress with throttling
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            const progress = Math.min((window.scrollY / totalHeight) * 100, 100);
            setScrollProgress(progress);
            
            // Determine active section
            const sectionHeight = totalHeight / 10; // 10 story sections
            const currentSection = Math.min(Math.floor(window.scrollY / sectionHeight), 9);
            setActiveSection(currentSection);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show a simple loading state to prevent white screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AllieCharacter mood="happy" size="lg" animate={true} />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-full-height bg-white overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Scroll Progress Bar - Hide on mobile Safari to avoid rendering issues */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50 hidden sm:block">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold cursor-pointer" onClick={() => navigate('/')}>Allie</h1>
          <div className="flex items-center space-x-2 sm:space-x-6">
            <button 
              onClick={() => navigate('/vision')}
              className="text-sm sm:text-base text-gray-700 hover:text-black transition-colors hidden sm:block"
            >
              Long Vision
            </button>
            <button
              onClick={() => navigate('/investors')}
              className="text-sm sm:text-base text-gray-700 hover:text-black transition-colors hidden sm:block"
            >
              Investors
            </button>
            <button
              onClick={() => navigate('/blog')}
              className="text-sm sm:text-base text-gray-700 hover:text-black transition-colors hidden sm:block"
            >
              Blog
            </button>
            {isActuallyLoggedIn ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors sm:bg-transparent sm:px-0 sm:text-base sm:hover:text-black"
                >
                  Log In
                </button>
                <button
                  onClick={() => handleNavigate('/onboarding')}
                  disabled={isNavigating}
                  className="px-4 sm:px-4 py-2 sm:py-2 text-sm sm:text-base bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isNavigating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Get Started'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Section 1: Enter Allie - MOVED TO TOP */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 bg-black text-white" style={{ WebkitBackfaceVisibility: 'hidden', backgroundColor: '#000000' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <AllieCharacter mood="curious" size="xl" animate={true} />
          </div>

          <h2 className="font-bold mb-8" style={{fontSize: 'clamp(3rem, 8vw, 10rem)', lineHeight: '1'}}>
            Hello, I'm <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Allie</span>
          </h2>

          <p className="text-2xl mb-12 text-gray-300 max-w-2xl mx-auto">
            I'm here to help your family find balance. Let me show you how we'll transform
            your daily chaos into harmony, one small step at a time.
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-base">
            <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
              <Brain className="mr-2" size={16} />
              AI-Powered
            </div>
            <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
              <Heart className="mr-2" size={16} />
              Family-First
            </div>
            <div className="flex items-center bg-white/10 px-4 py-2 rounded-full">
              <Shield className="mr-2" size={16} />
              Research-Backed
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: The Stressed Family (was Section 1) */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 pt-32 md:pt-24">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
            Every family has their version of <span className="text-red-500 break-normal">overwhelm</span>.<br />
            This is ours - and it's probably a lot like yours.
          </h1>
          
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div>
              <FamilyMember role="stefan" mood="stressed" size="xl" name="Stefan" />
              <p className="text-xs text-red-500 mt-1">Juggling too much</p>
            </div>
            <div>
              <FamilyMember role="kimberly" mood="stressed" size="xl" name="Kimberly" />
              <p className="text-xs text-red-500 mt-1">Carrying mental load</p>
            </div>
            <div>
              <FamilyMember role="lillian" mood="neutral" size="xl" name="Lillian (14)" />
              <p className="text-xs text-gray-500 mt-1">Busy with school</p>
            </div>
            <div>
              <FamilyMember role="oly" mood="neutral" size="xl" name="Oly (11)" />
              <p className="text-xs text-gray-500 mt-1">Wants to help</p>
            </div>
            <div>
              <FamilyMember role="tegner" mood="neutral" size="xl" name="Tegner (7)" />
              <p className="text-xs text-gray-500 mt-1">Full of energy</p>
            </div>
          </div>

          <div className="space-y-6 text-lg text-gray-700 mb-12">
            {/* Parent quotes */}
            <div className="space-y-4 pb-4 border-b border-gray-200">
              <p className="flex items-center justify-center font-medium">
                <Heart className="mr-2 text-red-500" size={20} />
                "I feel like I'm always the one who remembers everything" - Kimberly
              </p>
              <p className="flex items-center justify-center font-medium">
                <Brain className="mr-2 text-red-500" size={20} />
                "I want to help more but I don't know what needs to be done" - Stefan
              </p>
            </div>
            
            {/* Kids quotes */}
            <div className="space-y-4">
              <p className="flex items-center justify-center">
                <Clock className="mr-2 text-red-500" size={20} />
                "Who's taking Lillian to volleyball practice?"
              </p>
              <p className="flex items-center justify-center">
                <FileText className="mr-2 text-red-500" size={20} />
                "Did anyone see Oly's science fair permission slip?"
              </p>
              <p className="flex items-center justify-center">
                <Brain className="mr-2 text-red-500" size={20} />
                "Tegner has swimming, but when was that again?"
              </p>
            </div>
          </div>

          <ChevronDown className="mx-auto text-gray-400" size={32} />
        </div>
      </section>

      {/* Section 3: The Problem (was Section 2) */}
      <section className="min-h-[120vh] md:min-h-[120vh] min-h-[120svh] px-4 sm:px-6 relative overflow-hidden bg-black">
        {/* Earth Image Container - Full background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full max-w-[1600px] h-full max-h-[1600px] aspect-square rounded-full overflow-hidden">
            <img 
              src="/earth-image.jpg" 
              alt="Earth from space showing global impact"
              className="w-full h-full object-cover opacity-90"
              loading="lazy"
              onError={(e) => {
                console.warn('Earth image failed to load');
                e.target.style.display = 'none';
                e.target.parentElement.style.background = 'radial-gradient(circle, #1a1a2e 0%, #000 100%)';
              }}
            />
          </div>
        </div>

        {/* Title with black blob background */}
        <div className="pt-32 pb-20 text-center relative z-20">
          <div className="inline-block">
            <div className="absolute inset-0 bg-black rounded-full blur-3xl scale-125 opacity-80"></div>
            <h2 className="relative font-bold text-white max-w-6xl mx-auto px-4 sm:px-8" style={{fontSize: 'clamp(2rem, 6vw, 7.5rem)', lineHeight: '1'}}>
              The invisible workload is <span className="text-red-500">crushing</span> families worldwide
            </h2>
          </div>
        </div>

        {/* Content Container */}
        <div className="relative z-10" style={{marginTop: '100px'}}>

          {/* Content overlay */}
          <div className="max-w-6xl mx-auto relative z-10">
            {/* Moved white box to top */}
            <div className="text-center bg-white p-6 rounded-2xl shadow-lg mb-12">
              <p className="text-xl text-gray-700 mb-6">
                This isn't just our story. It's a <span className="font-medium">global demographic crisis</span>.
              </p>
              <p className="text-base text-gray-600">
                Countries with better family support show 16% higher birth rates and stronger economies
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Left: Family Impact */}
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-3xl font-bold mb-6">The Palsson Family Impact</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Kimberly's mental load</span>
                    <span className="text-red-500 font-medium">87%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Stefan's work-life balance</span>
                    <span className="text-red-500 font-medium">Poor</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Family stress level</span>
                    <span className="text-red-500 font-medium">High</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Quality time together</span>
                    <span className="text-red-500 font-medium">-42%</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-base text-gray-700">
                    <strong>Hidden costs:</strong> Less sleep, more conflicts, career impacts, kids learning stress patterns
                  </p>
                </div>
              </div>

              {/* Right: Global Impact */}
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-3xl font-bold mb-6">The Global Crisis</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-base font-medium text-gray-700">Birth Rate Collapse</p>
                    <p className="text-xs text-gray-600">From 5.1 → 2.4 births per woman since 1970</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-red-500 h-2 rounded-full" style={{width: '47%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-base font-medium text-gray-700">Young Adults Avoiding Parenthood</p>
                    <p className="text-xs text-gray-600">73% cite "overwhelming responsibilities"</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-red-500 h-2 rounded-full" style={{width: '73%'}}></div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-base font-medium text-gray-700">Economic Impact</p>
                    <p className="text-xs text-gray-600">$178B addressable market for solutions</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-amber-50 rounded-lg">
                <p className="text-base text-gray-700">
                  <strong>The vicious cycle:</strong> Mental load → fewer children → more pressure → demographic crisis
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* Section 4: Understanding the Family */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold mb-6" style={{fontSize: 'clamp(1.75rem, 4vw, 5rem)', lineHeight: '1.1'}}>
              First, I <span className="text-purple-600">understand</span> your family
            </h2>
            <p className="text-2xl text-gray-600">I ask the right questions to see the full picture</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="bg-purple-50 p-6 rounded-2xl">
                <h3 className="font-medium mb-3 flex items-center">
                  <MessageCircle className="mr-2 text-purple-600" size={20} />
                  Smart Survey Questions
                </h3>
                <p className="text-gray-700">
                  "Who usually plans the weekly meals?" reveals invisible mental labor
                </p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-2xl">
                <h3 className="font-medium mb-3 flex items-center">
                  <BarChart3 className="mr-2 text-purple-600" size={20} />
                  Task Weight Analysis
                </h3>
                <p className="text-gray-700">
                  Daily invisible tasks weigh 13.4x more than quarterly visible ones
                </p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-2xl">
                <h3 className="font-medium mb-3 flex items-center">
                  <Users className="mr-2 text-purple-600" size={20} />
                  Everyone Participates
                </h3>
                <p className="text-gray-700">
                  Kids share their perspective with fun, age-appropriate questions
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-8 rounded-2xl">
              <div className="flex justify-between items-center mb-6">
                <AllieCharacter mood="curious" size="md" />
                <div className="space-y-2">
                  <FamilyMember role="kimberly" mood="neutral" size="sm" />
                  <FamilyMember role="stefan" mood="neutral" size="sm" />
                </div>
              </div>
              
              <div className="bg-white/80 p-4 rounded-lg shadow-sm">
                <p className="text-base text-gray-700 mb-2">
                  <strong>Allie:</strong> "I see that coordinating 3 kids' activities takes 6+ hours weekly 
                  and falls 85% on Kimberly. Between volleyball, science club, and swimming, 
                  this invisible work has a weight score of 13.4 - one of the heaviest tasks in your household."
                </p>
                <div className="flex justify-between text-xs text-gray-600 mt-3">
                  <span>Task Weight: 13.4</span>
                  <span>Imbalance: 85%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: The Perception Gap - Awareness Before Action (was Section 4.5) */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold mb-6" style={{fontSize: 'clamp(1.75rem, 4vw, 5rem)', lineHeight: '1.1'}}>
              Before I fix it, I help you <span className="text-indigo-600">see</span> the problem
            </h2>
            <p className="text-2xl text-gray-600">You can't solve what you can't see. I'm your independent family partner.</p>
          </div>

          {/* Moved 37% improvement box here */}
          <div className="text-center bg-white p-6 rounded-2xl shadow-sm mb-12">
            <p className="text-lg text-gray-700 mb-2">
              <strong>Recognition alone creates 37% improvement in relationship satisfaction</strong>
            </p>
            <p className="text-gray-600">
              Once you can see the problem clearly, you can finally solve it together
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-12">
            {/* Left: The Problem */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <Brain className="text-red-600" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">The Invisible Work Problem</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Mental load is invisible cognitive labor - remembering, planning, coordinating. 
                  It's "underground work" that rarely gets seen or measured by others.
                </p>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-base text-red-800 font-medium">The Perception Gap:</p>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base">What Kimberly carries:</span>
                      <span className="text-red-600 font-bold">87%</span>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{width: '87%'}}></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base">What Stefan thinks she carries:</span>
                      <span className="text-red-600 font-bold">43%</span>
                    </div>
                    <div className="w-full bg-red-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{width: '43%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                    <MessageCircle className="text-amber-600" size={24} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Why Families Can't Fix It Alone</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="text-amber-600 font-bold mr-2 mt-1">•</span>
                    <div>
                      <p className="font-medium text-gray-800">No shared language</p>
                      <p className="text-base text-gray-600">72% lack vocabulary to discuss cognitive labor</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-amber-600 font-bold mr-2 mt-1">•</span>
                    <div>
                      <p className="font-medium text-gray-800">Only discuss during conflicts</p>
                      <p className="text-base text-gray-600">81% only talk about it when fighting</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="text-amber-600 font-bold mr-2 mt-1">•</span>
                    <div>
                      <p className="font-medium text-gray-800">Unclear expectations</p>
                      <p className="text-base text-gray-600">67% never discussed task ownership</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Allie's Solution */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-200">
                <div className="flex items-center mb-4">
                  <AllieCharacter mood="helpful" size="md" />
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold mb-2">I Create Awareness First</h3>
                    <p className="text-gray-600">Your independent family partner</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <CheckCircle className="text-green-600 mr-3 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-medium">Quantify invisible work</p>
                      <p className="text-base text-gray-600">I track and measure cognitive labor objectively</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-600 mr-3 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-medium">Visualize the load distribution</p>
                      <p className="text-base text-gray-600">Show exactly who carries what mental burden</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-600 mr-3 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-medium">Create shared family knowledge</p>
                      <p className="text-base text-gray-600">Build a system that outlasts individual memory</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <CheckCircle className="text-green-600 mr-3 mt-1 flex-shrink-0" size={20} />
                    <div>
                      <p className="font-medium">Enable neutral conversations</p>
                      <p className="text-base text-gray-600">Use data, not emotions, to discuss workload</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h4 className="font-medium mb-3">The "Aha!" Moment</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex space-x-2 mr-4">
                      <FamilyMember role="stefan" mood="neutral" size="sm" />
                      <FamilyMember role="kimberly" mood="neutral" size="sm" />
                    </div>
                    <div>
                      <p className="text-base text-gray-700 italic">
                        "I had no idea Kimberly was managing so much in her head. I thought we were 
                        pretty equal because I do the dishes and laundry, but seeing the mental load 
                        breakdown... wow. Now I understand why she always seems stressed about logistics."
                      </p>
                      <p className="text-xs text-gray-500 mt-2">- Stefan, after seeing Allie's analysis</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quiz Section - Don't See the Problem? */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-br from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-bold mb-6 text-white" style={{fontSize: 'clamp(1.75rem, 4vw, 5rem)', lineHeight: '1.1'}}>
            Don't See the Problem in Your Family?
          </h2>
          <p className="text-xl text-gray-100 mb-8">
            Take our 5-minute balance quiz to discover the invisible imbalances in your household
          </p>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="text-left">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle className="text-green-500" size={20} />
                  What You'll Discover
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    Your family's invisible load distribution
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    Balance scores across 4 key categories
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500 mt-1">•</span>
                    Personalized habit recommendations
                  </li>
                </ul>
              </div>

              <div className="text-left">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Clock className="text-blue-500" size={20} />
                  How It Works
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">1.</span>
                    Both partners answer 40 quick questions
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">2.</span>
                    See your balance visualization instantly
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">3.</span>
                    Get 3 targeted habits to improve balance
                  </li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setShowQuiz(true)}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-2xl hover:from-cyan-600 hover:to-teal-600 transition-all transform hover:scale-105"
            >
              <Sparkles className="text-white" size={24} />
              Take the Free Balance Quiz
              <ArrowDown className="animate-bounce text-white" size={20} />
            </button>

            <p className="text-sm text-gray-500 mt-4">
              No signup required • 100% anonymous • Get results instantly
            </p>
          </div>
        </div>

        {/* Scroll prompt for those who already see the problem */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
          <p className="text-white/90 text-lg font-medium mb-2">
            Already see the problem? Keep scrolling
          </p>
          <ChevronDown className="animate-bounce text-white/80 mx-auto" size={32} />
        </div>
      </section>

      {/* Big message for those who see the problem */}
      <section className="py-20 px-4 sm:px-6 bg-gradient-to-b from-purple-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-white font-bold" style={{fontSize: 'clamp(2.5rem, 6vw, 4rem)', lineHeight: '1.2'}}>
            Already see the problem in your family?
          </h2>
          <p className="text-white/90 text-2xl mt-6 mb-8">
            Keep scrolling to see how Allie can help! 👇
          </p>
          <ChevronDown className="animate-bounce text-white mx-auto" size={48} />
        </div>
      </section>

      {/* Section 6: Building Habits (was Section 5) */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold mb-6" style={{fontSize: 'clamp(1.75rem, 4vw, 5rem)', lineHeight: '1.1'}}>
              Then I create <span className="text-green-600">personalized habits</span>
            </h2>
            <p className="text-2xl text-gray-600">Small changes that target your heaviest burdens</p>
            <p className="text-lg text-gray-500 mt-4 max-w-3xl mx-auto">
              The goal isn't perfect 50/50 balance—it's building real partnership through small acts of support.
              When we step up without being asked, we show our love through action, not just words.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="text-green-600" size={24} />
              </div>
              <h3 className="font-medium mb-2">Sunday Planning Sessions</h3>
              <p className="text-base text-gray-600 mb-3">
                15-minute family meeting to distribute weekly meal planning
              </p>
              <div className="text-xs bg-green-50 p-2 rounded">
                <span className="font-medium">Impact:</span> Reduces mental load by 3.2 hours/week
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Phone className="text-blue-600" size={24} />
              </div>
              <h3 className="font-medium mb-2">Activity Coordination</h3>
              <p className="text-base text-gray-600 mb-3">
                Stefan handles Oly's science club and Tegner's swimming logistics
              </p>
              <div className="text-xs bg-blue-50 p-2 rounded">
                <span className="font-medium">Impact:</span> Balances invisible communication tasks
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="text-amber-600" size={24} />
              </div>
              <h3 className="font-medium mb-2">Bedtime Story Shifts</h3>
              <p className="text-base text-gray-600 mb-3">
                Alternate who handles emotional bedtime routines
              </p>
              <div className="text-xs bg-amber-50 p-2 rounded">
                <span className="font-medium">Impact:</span> Shares emotional labor equally
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-2xl text-center">
            <p className="text-xl text-gray-700 mb-6">
              Each habit targets your specific high-weight imbalances
            </p>
            <div className="flex justify-center space-x-8">
              <div>
                <p className="text-3xl font-bold text-green-600">87%</p>
                <p className="text-base text-gray-600">Success Rate</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-600">2-3</p>
                <p className="text-base text-gray-600">Weeks to Form</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600">15min</p>
                <p className="text-base text-gray-600">Daily Investment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 6: Information Capture & AI Parsing */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold mb-6" style={{fontSize: 'clamp(1.75rem, 4vw, 5rem)', lineHeight: '1.1'}}>
              Now I help <span className="text-amber-600">carry some of the load!</span>
            </h2>
            <p className="text-2xl text-gray-600 mb-8">Every piece of information gets parsed, understood, and actioned</p>
            
            {/* Information Overload Problem */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-3xl mx-auto mb-8">
              <h3 className="text-3xl font-bold text-red-800 mb-6">The Information Overload</h3>
              <p className="text-gray-700 mb-4">The biggest contributor to parental imbalance:</p>
              <div className="grid md:grid-cols-3 gap-4 text-base">
                <div className="flex items-start">
                  <Brain className="text-red-600 mr-2 mt-1 flex-shrink-0" size={16} />
                  <span>Remembering thousands of critical details</span>
                </div>
                <div className="flex items-start">
                  <FileText className="text-red-600 mr-2 mt-1 flex-shrink-0" size={16} />
                  <span>Information scattered across emails, texts, and papers</span>
                </div>
                <div className="flex items-start">
                  <Heart className="text-red-600 mr-2 mt-1 flex-shrink-0" size={16} />
                  <span>Mental burden of being the family's memory</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual flow diagram */}
          <div className="mb-16">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-12 rounded-3xl">
              <div className="grid md:grid-cols-3 gap-8 items-center">
                {/* Left - Input Sources */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold mb-6 text-center">What comes in...</h4>
                  <div className="space-y-3">
                    <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                      <Camera className="text-amber-600 mr-3" size={24} />
                      <span className="text-base">Photos & Screenshots</span>
                    </div>
                    <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                      <Mail className="text-blue-600 mr-3" size={24} />
                      <span className="text-base">Emails & Attachments</span>
                    </div>
                    <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                      <Phone className="text-green-600 mr-3" size={24} />
                      <span className="text-base">Texts & WhatsApp</span>
                    </div>
                    <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                      <FileText className="text-purple-600 mr-3" size={24} />
                      <span className="text-base">Documents & PDFs</span>
                    </div>
                    <div className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                      <MessageCircle className="text-pink-600 mr-3" size={24} />
                      <span className="text-base">Voice Notes & Calls</span>
                    </div>
                  </div>
                </div>

                {/* Center - Allie Processing */}
                <div className="text-center relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-dashed border-amber-300"></div>
                  </div>
                  <div className="relative bg-white rounded-2xl p-6 shadow-lg mx-auto inline-block">
                    <AllieCharacter mood="helpful" size="lg" />
                    <div className="mt-3">
                      <p className="text-lg font-bold">ALLIE AI</p>
                      <p className="text-base text-gray-600">Powered by Claude 4.1 Opus</p>
                      <div className="mt-3 space-y-1">
                        <p className="text-xs text-amber-600">✓ Parses everything</p>
                        <p className="text-xs text-amber-600">✓ Understands context</p>
                        <p className="text-xs text-amber-600">✓ Creates actions</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right - What Allie Does */}
                <div className="space-y-4">
                  <h4 className="text-xl font-bold mb-6 text-center">What I create...</h4>
                  <div className="space-y-3">
                    <div className="flex items-center bg-green-50 p-3 rounded-lg shadow-sm">
                      <CheckCircle className="text-green-600 mr-3" size={24} />
                      <span className="text-base">Calendar events</span>
                    </div>
                    <div className="flex items-center bg-green-50 p-3 rounded-lg shadow-sm">
                      <ClipboardList className="text-green-600 mr-3" size={24} />
                      <span className="text-base">Task reminders</span>
                    </div>
                    <div className="flex items-center bg-green-50 p-3 rounded-lg shadow-sm">
                      <Users className="text-green-600 mr-3" size={24} />
                      <span className="text-base">Contact updates</span>
                    </div>
                    <div className="flex items-center bg-green-50 p-3 rounded-lg shadow-sm">
                      <Brain className="text-green-600 mr-3" size={24} />
                      <span className="text-base">Smart insights</span>
                    </div>
                    <div className="flex items-center bg-green-50 p-3 rounded-lg shadow-sm">
                      <Heart className="text-green-600 mr-3" size={24} />
                      <span className="text-base">Family knowledge</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="font-bold text-center" style={{fontSize: 'clamp(1.75rem, 4vw, 5rem)', lineHeight: '1.1'}}>See how my Claude 4.1 Opus brain parses everything</h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Vaccine Record Example */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-2xl">
                <div className="flex items-center mb-4">
                  <FileText className="text-purple-600 mr-2" size={24} />
                  <h4 className="font-medium">Vaccine Record Photo</h4>
                </div>
                <div className="bg-white/80 p-4 rounded-lg mb-4">
                  <p className="text-xs text-gray-500 mb-2">What you upload:</p>
                  <p className="text-base text-gray-700 italic">"Photo of Tegner's immunization card"</p>
                </div>
                <div className="space-y-2">
                  <p className="text-base font-medium text-purple-700">What I extract:</p>
                  <div className="pl-4 space-y-1 text-base">
                    <p>👦 <span className="font-medium">Child:</span> Tegner Palsson</p>
                    <p>💉 <span className="font-medium">Vaccines:</span> DTaP (5 doses), MMR (2 doses)</p>
                    <p>👨‍⚕️ <span className="font-medium">Doctor:</span> Dr. Sarah Chen</p>
                    <p>🏥 <span className="font-medium">Clinic:</span> Stanford Pediatrics, Palo Alto</p>
                    <p>📅 <span className="font-medium">Next Due:</span> Tdap booster at age 11</p>
                    <p>✅ <span className="font-medium">Action:</span> Set reminder for April 2027</p>
                  </div>
                </div>
              </div>

              {/* Birthday Invite Example */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-2xl">
                <div className="flex items-center mb-4">
                  <Mail className="text-pink-600 mr-2" size={24} />
                  <h4 className="font-medium">Birthday Party Email</h4>
                </div>
                <div className="bg-white/80 p-4 rounded-lg mb-4">
                  <p className="text-xs text-gray-500 mb-2">What arrives:</p>
                  <p className="text-base text-gray-700 italic">"You're invited to Jake's 8th birthday party! Cowboy theme..."</p>
                </div>
                <div className="space-y-2">
                  <p className="text-base font-medium text-pink-700">What I understand:</p>
                  <div className="pl-4 space-y-1 text-base">
                    <p>🎉 <span className="font-medium">Event:</span> Jake's 8th Birthday</p>
                    <p>👦 <span className="font-medium">For:</span> Oly (Jake's classmate)</p>
                    <p>📅 <span className="font-medium">When:</span> Saturday, March 15, 2pm</p>
                    <p>🤠 <span className="font-medium">Theme:</span> Cowboy/Western</p>
                    <p>🎁 <span className="font-medium">Gift Task:</span> Buy cowboy-themed gift ($20-30)</p>
                    <p>📝 <span className="font-medium">RSVP:</span> Due by March 8 (auto-drafted)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* More examples */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-2xl">
              <h4 className="text-2xl font-bold mb-8 text-center">I'm your AI Super Nanny who never forgets</h4>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Brain className="text-amber-600" size={32} />
                  </div>
                  <p className="font-medium mb-2">School Forms</p>
                  <p className="text-base text-gray-600">
                    Permission slips → Extract dates, requirements, auto-fill repetitive info
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Heart className="text-orange-600" size={32} />
                  </div>
                  <p className="font-medium mb-2">Medical Info</p>
                  <p className="text-base text-gray-600">
                    Doctor notes → Track medications, allergies, follow-ups, insurance
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Calendar className="text-red-600" size={32} />
                  </div>
                  <p className="font-medium mb-2">Activities</p>
                  <p className="text-base text-gray-600">
                    Sports schedules → Games, practices, equipment needs, carpools
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-lg text-gray-700">
              Every document, photo, email, and text becomes <span className="font-medium text-amber-600">actionable family intelligence</span>
            </p>
          </div>
        </div>
      </section>

      {/* Section 7: Living Calendar */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold mb-6" style={{fontSize: 'clamp(1.75rem, 4vw, 5rem)', lineHeight: '1.1'}}>
              Your calendar becomes <span className="text-blue-600">alive</span> with me
            </h2>
            <p className="text-2xl text-gray-600">I catch every event, from any source</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg mb-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-base font-medium text-blue-900 mb-2">From a group text:</p>
                  <p className="text-xs text-gray-600 italic">
                    "Oly's science club presentation moved to Thursday 3:30pm in the library - bring poster board!"
                  </p>
                </div>
                
                <div className="flex items-center justify-center my-4">
                  <ArrowDown className="text-blue-600" size={24} />
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-base font-medium text-green-900 mb-2">Automatically added:</p>
                  <div className="flex items-center justify-between text-xs">
                    <span>📅 Oly's Science Presentation</span>
                    <span>Thu, 3:30pm</span>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    📍 School Library | 📝 Bring poster board
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Smart Event Detection</p>
                    <p className="text-base text-gray-600">From texts, emails, photos, voice</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Family-Wide Visibility</p>
                    <p className="text-base text-gray-600">Everyone sees their commitments</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Brain className="text-purple-600" size={20} />
                  </div>
                  <div>
                    <p className="font-medium">Intelligent Reminders</p>
                    <p className="text-base text-gray-600">Based on your family's patterns</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg text-gray-700">
              No more "I forgot" or "You didn't tell me" moments
            </p>
          </div>
        </div>
      </section>

      {/* NEW Section: The Real Problem Nobody's Solving */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bold mb-8" style={{fontSize: 'clamp(2rem, 5vw, 5.5rem)', lineHeight: '1.05'}}>
              Other apps organize tasks.<br/>
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                I redistribute mental load.
              </span>
            </h2>
            <p className="text-2xl text-gray-700 max-w-3xl mx-auto">
              The invisible burden of managing a household—the noticing, planning, researching,
              and coordinating—shouldn't fall on one person's shoulders.
            </p>
          </div>

          {/* The Problem Visualization */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Traditional Apps */}
            <div className="bg-white/80 backdrop-blur rounded-2xl p-8 shadow-xl border border-gray-200">
              <h3 className="text-xl font-bold mb-6 text-gray-900 flex items-center">
                <X className="text-red-500 mr-2" size={24} />
                How other apps work
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-800">One "family manager" does everything</p>
                    <p className="text-sm text-gray-600">Mom becomes the household CEO while others are helpers</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-800">Mental work stays invisible</p>
                    <p className="text-sm text-gray-600">Who noticed the dentist reminder? Who researched camps?</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium text-gray-800">Reinforces existing imbalances</p>
                    <p className="text-sm text-gray-600">71% of mental load on mothers, 29% on fathers</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <p className="text-sm text-red-800 font-medium">Result: Burnout, resentment, and "You should've asked"</p>
              </div>
            </div>

            {/* Allie's Approach */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 shadow-xl text-white">
              <h3 className="text-xl font-bold mb-6 flex items-center">
                <CheckCircle className="text-white mr-2" size={24} />
                How Allie works differently
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">True co-ownership by design</p>
                    <p className="text-sm text-purple-100">No primary account holder—authority rotates by domain</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Makes invisible work visible</p>
                    <p className="text-sm text-purple-100">Tracks who planned, researched, and coordinated—not just who did</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Actively rebalances your family</p>
                    <p className="text-sm text-purple-100">AI suggests: "Papa could take this medical appointment"</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/20 backdrop-blur rounded-lg p-4 border border-white/30">
                <p className="text-sm font-medium">Result: True partnership and shared mental freedom</p>
              </div>
            </div>
          </div>

          {/* Key Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                71%
              </div>
              <p className="text-gray-700">of mental load on mothers</p>
              <p className="text-sm text-gray-500 mt-1">USC Research, 2024</p>
            </div>

            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                2.5x
              </div>
              <p className="text-gray-700">more cognitive labor for women</p>
              <p className="text-sm text-gray-500 mt-1">Even in "equal" households</p>
            </div>

            <div className="text-center">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                87%
              </div>
              <p className="text-gray-700">report mental load causes burnout</p>
              <p className="text-sm text-gray-500 mt-1">Bright Horizons Study</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl text-gray-700 font-medium">
              Stop being the household manager. <span className="text-purple-600">Start being a partner.</span>
            </p>
          </div>
        </div>
      </section>

      {/* NEW Section: How Allie Creates Balance */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bold mb-8" style={{fontSize: 'clamp(2rem, 5vw, 5.5rem)', lineHeight: '1.05'}}>
              Watch mental load <span className="text-green-600">rebalance</span> automatically
            </h2>
            <p className="text-2xl text-gray-600 max-w-3xl mx-auto">
              I don't just track tasks—I actively redistribute the invisible work of running your household
            </p>
          </div>

          {/* Interactive Example Flow */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl p-8 md:p-12 mb-12">
            <div className="max-w-4xl mx-auto">
              {/* Email Arrives */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <h3 className="ml-3 text-lg font-bold">Email arrives about school field trip</h3>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <Mail className="text-gray-400 mt-1" size={20} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">From: Westwood Elementary</p>
                      <p className="text-sm text-gray-600">Subject: 3rd Grade Science Museum Trip - Permission Required</p>
                      <p className="text-xs text-gray-500 mt-1">Includes: Permission form, $15 fee, lunch arrangements, volunteer request...</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allie Analyzes */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <h3 className="ml-3 text-lg font-bold">I analyze your family's patterns</h3>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-purple-900 mb-2">Current Balance Check:</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">School coordination (Mama):</span>
                          <span className="font-medium text-red-600">92%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Medical tasks (Mama):</span>
                          <span className="font-medium text-orange-600">88%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Activities (Papa):</span>
                          <span className="font-medium text-green-600">45%</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-900 mb-2">Mental Load This Week:</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Mama:</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-red-500 h-2 rounded-full" style={{width: '78%'}}></div>
                            </div>
                            <span className="font-medium">78%</span>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Papa:</span>
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{width: '22%'}}></div>
                            </div>
                            <span className="font-medium">22%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allie Suggests */}
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <h3 className="ml-3 text-lg font-bold">I suggest a rebalancing action</h3>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-start space-x-3 mb-4">
                    <Sparkles className="text-yellow-300" size={24} />
                    <div>
                      <p className="font-bold text-lg mb-2">Rebalancing Opportunity Detected!</p>
                      <p className="text-green-100">
                        "Since Mama has handled 92% of school coordination this month,
                        I suggest Papa takes ownership of this field trip—from permission form to payment to volunteering decision."
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white/20 backdrop-blur rounded-lg p-3">
                      <p className="text-xs font-medium mb-1">Tasks Created for Papa:</p>
                      <ul className="text-xs space-y-1 text-green-100">
                        <li>✓ Review & sign permission form</li>
                        <li>✓ Submit $15 payment</li>
                        <li>✓ Decide on lunch option</li>
                        <li>✓ Consider volunteering</li>
                      </ul>
                    </div>

                    <div className="bg-white/20 backdrop-blur rounded-lg p-3">
                      <p className="text-xs font-medium mb-1">Mental Work Tracked:</p>
                      <ul className="text-xs space-y-1 text-green-100">
                        <li>• Reading full email (5 min)</li>
                        <li>• Reviewing form (10 min)</li>
                        <li>• Payment decision (5 min)</li>
                        <li>• Calendar check (5 min)</li>
                      </ul>
                    </div>

                    <div className="bg-white/20 backdrop-blur rounded-lg p-3">
                      <p className="text-xs font-medium mb-1">New Balance:</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Mama:</span>
                          <span className="font-bold">71% ↓</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Papa:</span>
                          <span className="font-bold">29% ↑</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div>
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <h3 className="ml-3 text-lg font-bold">Balance restored, partnership strengthened</h3>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-green-600">100%</p>
                        <p className="text-xs text-gray-600">Task Completion</p>
                      </div>
                      <Plus className="text-gray-400" size={20} />
                      <div className="text-center">
                        <p className="text-3xl font-bold text-purple-600">Fair</p>
                        <p className="text-xs text-gray-600">Distribution</p>
                      </div>
                      <Plus className="text-gray-400" size={20} />
                      <div className="text-center">
                        <p className="text-3xl font-bold text-pink-600">Visible</p>
                        <p className="text-xs text-gray-600">Mental Work</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700">= True Partnership</p>
                      <p className="text-xs text-gray-500">No more "default parent"</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <RotateCw className="text-purple-600" size={32} />
              </div>
              <h4 className="font-bold mb-2">Domain Rotation</h4>
              <p className="text-sm text-gray-600">
                Meal planning, medical, school—responsibilities rotate automatically
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Vote className="text-blue-600" size={32} />
              </div>
              <h4 className="font-bold mb-2">Family Consensus</h4>
              <p className="text-sm text-gray-600">
                Major decisions require input from all stakeholders, not just one
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Brain className="text-orange-600" size={32} />
              </div>
              <h4 className="font-bold mb-2">Cognitive Tracking</h4>
              <p className="text-sm text-gray-600">
                Values the mental work of planning as much as physical execution
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="text-green-600" size={32} />
              </div>
              <h4 className="font-bold mb-2">Equality Score</h4>
              <p className="text-sm text-gray-600">
                Track your family's balance and celebrate progress toward equality
              </p>
            </div>
          </div>

          <div className="text-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8">
            <p className="text-2xl font-bold mb-2">
              The only family AI that makes <span className="text-purple-600">partnership</span> inevitable
            </p>
            <p className="text-lg text-gray-600">
              Not through good intentions, but through intelligent system design
            </p>
          </div>
        </div>
      </section>

      {/* Section 7.5: The Quantum Knowledge Graph */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-20 bg-black text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-bold mb-8 leading-tight" style={{fontSize: 'clamp(1.75rem, 4vw, 5rem)', lineHeight: '1.1'}}>
              Everything connects in <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Allie's mind</span>
            </h2>
            <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
              Your family's quantum knowledge graph - where every document, conversation, 
              event, and memory forms a living, breathing intelligence
            </p>
          </div>

          {/* Knowledge Graph Grid - Jigsaw Puzzle Layout */}
          <div className="relative mb-16">
            <div className="w-full max-w-5xl mx-auto">
              <div className="grid grid-cols-3 grid-rows-3 gap-0 h-[600px]">
                
                {/* Top Row */}
                <div className="bg-gradient-to-br from-purple-600 to-purple-800 p-8 flex flex-col items-center justify-center text-white border border-purple-500">
                  <FileText className="mb-4" size={48} />
                  <h3 className="text-2xl font-bold mb-3">Documents</h3>
                  <p className="text-purple-200">847 files</p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-600 to-orange-700 p-8 flex flex-col items-center justify-center text-white border border-orange-500">
                  <Camera className="mb-4" size={48} />
                  <h3 className="text-2xl font-bold mb-3">Memories</h3>
                  <p className="text-orange-200">1,892 photos</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-600 to-green-800 p-8 flex flex-col items-center justify-center text-white border border-green-500">
                  <MessageCircle className="mb-4" size={48} />
                  <h3 className="text-2xl font-bold mb-3">Conversations</h3>
                  <p className="text-green-200">5,123 chats</p>
                </div>
                
                {/* Middle Row */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 flex flex-col items-center justify-center text-white border border-indigo-500">
                  <Users className="mb-4" size={48} />
                  <h3 className="text-2xl font-bold mb-3">Relationships</h3>
                  <p className="text-indigo-200">5 family</p>
                </div>
                
                {/* Central Allie Brain */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 flex flex-col items-center justify-center text-white border border-blue-500 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 animate-pulse"></div>
                  <AllieCharacter mood="helpful" size="lg" animate={false} />
                  <h3 className="text-xl font-medium mt-4">ALLIE AI</h3>
                  <p className="text-blue-200 text-base">Powered by Claude 4.1 Opus</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 flex flex-col items-center justify-center text-white border border-blue-500">
                  <Calendar className="mb-4" size={48} />
                  <h3 className="text-xl font-medium mb-2">Events</h3>
                  <p className="text-blue-200">2,341 tracked</p>
                </div>
                
                {/* Bottom Row */}
                <div className="bg-gradient-to-br from-pink-600 to-pink-800 p-8 flex flex-col items-center justify-center text-white border border-pink-500">
                  <Heart className="mb-4" size={48} />
                  <h3 className="text-xl font-medium mb-2">Habits</h3>
                  <p className="text-pink-200">43 active</p>
                </div>
                
                <div className="bg-gradient-to-br from-gray-700 to-gray-900 p-8 flex flex-col items-center justify-center text-white border border-gray-600">
                  <Sparkles className="mb-4" size={48} />
                  <h3 className="text-xl font-medium mb-2">Insights</h3>
                  <p className="text-gray-300">156 this month</p>
                </div>
                
                <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-8 flex flex-col items-center justify-center text-white border border-teal-500" style={{ WebkitBackfaceVisibility: 'hidden', WebkitTransform: 'translate3d(0,0,0)' }}>
                  <CheckCircle className="mb-4" size={48} />
                  <h3 className="text-xl font-medium mb-2">Actions</h3>
                  <p className="text-teal-200">Growing daily</p>
                </div>
                
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h3 className="text-2xl font-bold mb-6">Not just storage. Understanding.</h3>
              <p className="text-gray-300 mb-6">
                Traditional systems store your data in silos. Allie's quantum knowledge graph 
                creates a living web of connections - understanding not just what you save, 
                but why it matters to your family.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Sparkles className="text-purple-400 mr-3 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium">Contextual Intelligence</p>
                    <p className="text-base text-gray-400">Every piece of information gains meaning from its connections</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Brain className="text-blue-400 mr-3 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium">Pattern Recognition</p>
                    <p className="text-base text-gray-400">Discovers hidden relationships you'd never notice</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Lightbulb className="text-amber-400 mr-3 mt-1 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium">Proactive Insights</p>
                    <p className="text-base text-gray-400">Surfaces relevant information before you need it</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
              <h4 className="text-xl font-bold mb-6">The Palsson Family Graph</h4>
              <div className="space-y-4 text-base">
                <p className="text-purple-300">
                  <strong>Nodes:</strong> 3,847 connected memories
                </p>
                <p className="text-blue-300">
                  <strong>Relationships:</strong> 12,493 meaningful connections
                </p>
                <p className="text-green-300">
                  <strong>Patterns:</strong> 47 recurring family rhythms
                </p>
                <p className="text-amber-300">
                  <strong>Insights:</strong> 156 proactive suggestions this month
                </p>
              </div>
              <div className="mt-6 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <p className="text-xs text-purple-300">
                  Latest insight: "Tegner's swimming progress correlates with Stefan's 
                  Wednesday work-from-home schedule. Consider making it their special routine."
                </p>
              </div>
            </div>
          </div>

          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8 text-center">Real magic for real families</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 p-6 rounded-2xl border border-purple-500/20">
                <h4 className="font-medium mb-3 flex items-center">
                  <Calendar className="mr-2 text-purple-400" size={20} />
                  The Birthday Planner's Dream
                </h4>
                <p className="text-gray-300 text-base mb-3">
                  "What did Lillian want for her birthday last year that we didn't get?"
                </p>
                <p className="text-purple-300 text-base">
                  Allie instantly connects: Last year's wishlist → current interests → 
                  recent conversations → perfect gift ideas ranked by excitement level
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-900/20 to-green-900/20 p-6 rounded-2xl border border-blue-500/20">
                <h4 className="font-medium mb-3 flex items-center">
                  <FileText className="mr-2 text-blue-400" size={20} />
                  The Permission Slip Time Machine
                </h4>
                <p className="text-gray-300 text-base mb-3">
                  "We need Oly's vaccination records for science camp"
                </p>
                <p className="text-blue-300 text-base">
                  Allie navigates: Medical folder → latest records → camp requirements → 
                  pre-filled forms ready to print with all required documentation
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-900/20 to-amber-900/20 p-6 rounded-2xl border border-green-500/20">
                <h4 className="font-medium mb-3 flex items-center">
                  <TrendingUp className="mr-2 text-green-400" size={20} />
                  The Habit Breakthrough Detector
                </h4>
                <p className="text-gray-300 text-base mb-3">
                  "Why is bedtime suddenly working better?"
                </p>
                <p className="text-green-300 text-base">
                  Allie reveals: New 7pm dinner time → less screen time → 
                  calmer evenings → Tegner's sleep improved 40% when Stefan reads stories
                </p>
              </div>

              <div className="bg-gradient-to-br from-amber-900/20 to-rose-900/20 p-6 rounded-2xl border border-amber-500/20">
                <h4 className="font-medium mb-3 flex items-center">
                  <Star className="mr-2 text-amber-400" size={20} />
                  The "Mom, I'm Bored" Solver
                </h4>
                <p className="text-gray-300 text-base mb-3">
                  Tegner: "There's nothing to dooooo!"
                </p>
                <p className="text-amber-300 text-base">
                  Allie suggests: "Last Tuesday you loved the science experiment with Oly. 
                  I found 3 similar activities you haven't tried, plus Oly's free right now!"
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-2xl text-gray-300 mb-4">
              Your family's collective intelligence, always learning, always growing
            </p>
            <p className="text-lg text-gray-400">
              Every interaction makes Allie smarter about what matters to <span className="text-purple-400">your family</span>
            </p>
          </div>
        </div>
      </section>

      {/* Section 8: Kids Love It */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold mb-6" style={{fontSize: 'clamp(1.75rem, 4vw, 5rem)', lineHeight: '1.1'}}>
              Kids <span className="text-pink-600">love</span> helping with me
            </h2>
            <p className="text-2xl text-gray-600">Chores become adventures, not arguments</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-8 rounded-2xl">
              <h3 className="text-xl font-medium mb-6 flex items-center">
                <Star className="mr-2 text-pink-600" size={24} />
                Chore Adventures
              </h3>
              
              <div className="space-y-4">
                <div className="bg-white/80 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Water her refillable flower</span>
                    <span className="text-green-600 text-base">+20 Bucks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FamilyMember role="lillian" mood="happy" size="sm" />
                    <span className="text-base text-gray-600">Lillian's Plant Care</span>
                  </div>
                </div>
                
                <div className="bg-white/80 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">30 minutes of homework</span>
                    <span className="text-green-600 text-base">+25 Bucks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FamilyMember role="oly" mood="happy" size="sm" />
                    <span className="text-base text-gray-600">Oly's Study Time</span>
                  </div>
                </div>
                
                <div className="bg-white/80 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Feed doggies</span>
                    <span className="text-green-600 text-base">+15 Bucks</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FamilyMember role="tegner" mood="happy" size="sm" />
                    <span className="text-base text-gray-600">Tegner's Morning Chore</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-base text-gray-600">Total Family Bucks Earned</p>
                <p className="text-3xl font-bold text-pink-600">247</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-8 rounded-2xl">
              <h3 className="text-xl font-medium mb-6 flex items-center">
                <Gift className="mr-2 text-amber-600" size={24} />
                Reward Marketplace
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">⏰</div>
                  <p className="text-base font-medium">Extra Screen Time</p>
                  <p className="text-xs text-amber-600">30 Bucks</p>
                </div>
                
                <div className="bg-white/80 p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">☕</div>
                  <p className="text-base font-medium">Starbucks eGift Card</p>
                  <p className="text-xs text-amber-600">100 Bucks</p>
                </div>
                
                <div className="bg-white/80 p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">🃏</div>
                  <p className="text-base font-medium">Pokemon Cards Pack</p>
                  <p className="text-xs text-amber-600">75 Bucks</p>
                </div>
                
                <div className="bg-white/80 p-4 rounded-lg text-center">
                  <div className="text-2xl mb-2">🛍️</div>
                  <p className="text-base font-medium">Target Gift Card ($10)</p>
                  <p className="text-xs text-amber-600">150 Bucks</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-6 rounded-2xl text-center">
            <p className="text-lg text-gray-700">
              Kids learn responsibility while parents get help - everyone wins!
            </p>
          </div>
        </div>
      </section>

      {/* Section 9: Understanding Dynamics */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-bold mb-6" style={{fontSize: 'clamp(1.75rem, 4vw, 5rem)', lineHeight: '1.1'}}>
              I understand your family's <span className="text-indigo-600">unique dynamics</span>
            </h2>
            <p className="text-2xl text-gray-600">Every change considers your relationships</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HeartHandshake className="text-indigo-600" size={32} />
                </div>
                <h3 className="font-medium mb-2">Sibling Dynamics</h3>
                <p className="text-base text-gray-600">
                  I track fairness between siblings to prevent "it's not fair" moments
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Brain className="text-purple-600" size={32} />
                </div>
                <h3 className="font-medium mb-2">Parent Preferences</h3>
                <p className="text-base text-gray-600">
                  I learn who prefers which tasks and suggest swaps that work for both
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Baby className="text-pink-600" size={32} />
                </div>
                <h3 className="font-medium mb-2">Age Adaptation</h3>
                <p className="text-base text-gray-600">
                  As kids grow, I adjust responsibilities and rewards automatically
                </p>
              </div>
            </div>
            
            <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg">
              <p className="text-center text-lg text-gray-700">
                I'm not just tracking tasks - I'm strengthening your family bonds
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 10: The Happy Family */}
      <section className="min-h-screen md:min-h-screen min-h-[100svh] flex items-center justify-center px-4 sm:px-6 py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="font-bold mb-12" style={{fontSize: 'clamp(1.75rem, 4vw, 5rem)', lineHeight: '1.1'}}>
            Your family, <span className="text-green-600">transformed</span>
          </h2>
          
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div>
              <FamilyMember role="stefan" mood="happy" size="xl" name="Stefan" />
              <p className="text-xs text-green-600 mt-1">Balanced & Present</p>
            </div>
            <div>
              <FamilyMember role="kimberly" mood="happy" size="xl" name="Kimberly" />
              <p className="text-xs text-green-600 mt-1">Energized & Supported</p>
            </div>
            <div>
              <FamilyMember role="lillian" mood="happy" size="xl" name="Lillian" />
              <p className="text-xs text-green-600 mt-1">Independent & Helpful</p>
            </div>
            <div>
              <FamilyMember role="oly" mood="happy" size="xl" name="Oly" />
              <p className="text-xs text-green-600 mt-1">Contributing & Proud</p>
            </div>
            <div>
              <FamilyMember role="tegner" mood="happy" size="xl" name="Tegner" />
              <p className="text-xs text-green-600 mt-1">Engaged & Learning</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-white/80 p-6 rounded-2xl">
              <div className="text-3xl font-bold text-green-600 mb-2">87%</div>
              <p className="text-base text-gray-600">Less mental clutter</p>
            </div>
            <div className="bg-white/80 p-6 rounded-2xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">4.8hrs</div>
              <p className="text-base text-gray-600">Saved weekly</p>
            </div>
            <div className="bg-white/80 p-6 rounded-2xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">92%</div>
              <p className="text-base text-gray-600">Fewer conflicts</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg mb-12 max-w-2xl mx-auto">
            <AllieCharacter mood="celebrating" size="md" animate={false} />
            <p className="mt-6 text-lg text-gray-700">
              "Together, we've created a family where everyone contributes, 
              everyone is heard, and everyone thrives."
            </p>
            <p className="mt-2 text-base text-gray-500">- Allie</p>
          </div>

          <div className="space-y-4 text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
            <p className="flex items-center justify-center">
              <CheckCircle className="mr-2 text-green-600" size={20} />
              Invisible work is now visible and valued
            </p>
            <p className="flex items-center justify-center">
              <CheckCircle className="mr-2 text-green-600" size={20} />
              Mental load is shared, not shouldered alone
            </p>
            <p className="flex items-center justify-center">
              <CheckCircle className="mr-2 text-green-600" size={20} />
              Kids are learning balance for their future
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-2xl font-bold">Ready to transform your family?</h3>
            <button
              onClick={() => navigate('/onboarding')}
              className="px-8 py-4 bg-black text-white rounded-lg text-lg hover:bg-gray-800 transition-all transform hover:scale-105"
            >
              Start Your Journey with Allie
            </button>
            <p className="text-base text-gray-600">
              Join thousands of families finding balance together
            </p>
          </div>
        </div>
      </section>

      {/* Sales Allie Chat - Replaces the simple floating button */}
      <SalesAllieChat />

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setShowQuiz(false)}
            />

            {/* Quiz Container */}
            <div className="relative z-10 w-full h-full">
              <EnhancedQuickBalanceQuiz onClose={() => setShowQuiz(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorytellingHomePage;