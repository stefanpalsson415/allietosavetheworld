import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/mobile-viewport-fix.css';

// Lazy load heavy components
const HeroSection = lazy(() => import('./sections/HeroSection'));
const ProblemSection = lazy(() => import('./sections/ProblemSection'));
const IntroAllieSection = lazy(() => import('./sections/IntroAllieSection'));
const UnderstandingSection = lazy(() => import('./sections/UnderstandingSection'));
const AwarenessSection = lazy(() => import('./sections/AwarenessSection'));
const HabitsSection = lazy(() => import('./sections/HabitsSection'));
const AIParsingSection = lazy(() => import('./sections/AIParsingSection'));
const CalendarSection = lazy(() => import('./sections/CalendarSection'));
const KnowledgeGraphSection = lazy(() => import('./sections/KnowledgeGraphSection'));
const KidsSection = lazy(() => import('./sections/KidsSection'));
const DynamicsSection = lazy(() => import('./sections/DynamicsSection'));
const TransformationSection = lazy(() => import('./sections/TransformationSection'));

// Simple loading component
const SectionLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
  </div>
);

const OptimizedStorytellingHomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [visibleSections, setVisibleSections] = useState(new Set([0])); // Start with first section visible
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  
  const isActuallyLoggedIn = currentUser && currentUser.uid;

  // Optimized scroll handler with debouncing
  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          // Only update if scroll changed significantly (10px)
          if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            
            if (totalHeight > 0) {
              const progress = Math.min((currentScrollY / totalHeight) * 100, 100);
              setScrollProgress(progress);
              
              // Calculate which sections should be visible (current + next 2)
              const sectionHeight = totalHeight / 12; // 12 sections
              const currentSection = Math.floor(currentScrollY / sectionHeight);
              
              setVisibleSections(new Set([
                Math.max(0, currentSection - 1),
                currentSection,
                currentSection + 1,
                currentSection + 2
              ]));
              
              lastScrollY.current = currentScrollY;
            }
          }
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    // Add passive listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial check
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="mobile-full-height bg-white overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', minHeight: '100vh' }}>
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
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
                  className="text-sm sm:text-base text-gray-700 hover:text-black transition-colors hidden sm:block"
                >
                  Log In
                </button>
                <button 
                  onClick={() => navigate('/onboarding')}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Sections - Only render when visible */}
      <Suspense fallback={<SectionLoader />}>
        {visibleSections.has(0) && <HeroSection />}
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        {visibleSections.has(1) && <ProblemSection />}
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        {visibleSections.has(2) && <IntroAllieSection />}
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        {visibleSections.has(3) && <UnderstandingSection />}
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        {visibleSections.has(4) && <AwarenessSection />}
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        {visibleSections.has(5) && <HabitsSection />}
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        {visibleSections.has(6) && <AIParsingSection />}
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        {visibleSections.has(7) && <CalendarSection />}
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        {visibleSections.has(8) && <KnowledgeGraphSection />}
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        {visibleSections.has(9) && <KidsSection />}
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        {visibleSections.has(10) && <DynamicsSection />}
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        {visibleSections.has(11) && <TransformationSection navigate={navigate} />}
      </Suspense>

      {/* Floating Allie Assistant */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => navigate('/onboarding')}
          className="bg-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110"
          aria-label="Start with Allie"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-600 shadow-lg flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
};

export default OptimizedStorytellingHomePage;