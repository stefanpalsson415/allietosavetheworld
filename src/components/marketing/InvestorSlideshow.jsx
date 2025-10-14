import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react';
import slideService from './investorFunnelV4/slideService';

/**
 * InvestorSlideshow - Read-only version of the investor slide deck
 * A simplified slideshow for investors that only allows viewing slides,
 * not editing or rearranging them, but with a navigation sidebar.
 */
const InvestorSlideshow = () => {
  const navigate = useNavigate();
  const [activeSlides, setActiveSlides] = useState([]);
  const [slidesBySection, setSlidesBySection] = useState({});
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slideComponents, setSlideComponents] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [loading, setLoading] = useState(true);
  const [sectionDescriptions, setSectionDescriptions] = useState({});

  // Initialize slide data
  useEffect(() => {
    loadSlides();
  }, []);

  // Format section names for display
  const formatSectionName = (sectionName) => {
    return sectionDescriptions[sectionName] || 
      sectionName
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
  };

  // Load slides from the service
  const loadSlides = () => {
    setLoading(true);
    try {
      // We intentionally do not use activeSlides from localStorage
      // Instead, we fetch from the default slide config
      const defaultConfig = require('./investorFunnelV4/slideConfig').default;
      
      // Only get slides marked as active in the default config
      const activeFromDefault = defaultConfig.slides.filter(slide => slide.active === true);
      setActiveSlides(activeFromDefault);

      // Group active slides by section
      const sectionMap = {};
      activeFromDefault.forEach(slide => {
        if (!sectionMap[slide.section]) {
          sectionMap[slide.section] = [];
        }
        sectionMap[slide.section].push(slide);
      });

      // Sort slides within each section by order
      Object.keys(sectionMap).forEach(section => {
        sectionMap[section].sort((a, b) => a.order - b.order);
      });
      
      setSlidesBySection(sectionMap);

      // Initialize expanded sections - all expanded by default
      const initialExpandedSections = {};
      Object.keys(sectionMap).forEach(section => {
        initialExpandedSections[section] = true;
      });
      setExpandedSections(initialExpandedSections);

      // Set section descriptions
      const defaultSectionDescriptions = {
        'intro': 'Introduction',
        'problem': 'Problem Statement',
        'solution': 'Our Solution',
        'market': 'Market Analysis',
        'growth': 'Growth Strategy',
        'monetization': 'Monetization',
        'team': 'Team & Advisors',
        'financing': 'Financing & Next Steps',
      };
      setSectionDescriptions(defaultSectionDescriptions);

      // Load slide components dynamically
      const components = {};
      activeFromDefault.forEach(slide => {
        if (slide.componentPath) {
          // Use dynamic import to lazy load the slide components
          components[slide.id] = React.lazy(() => 
            import(`./investorFunnelV4/slides/${slide.componentPath}.jsx`)
              .catch(err => {
                console.error(`Error loading slide component ${slide.componentPath}:`, err);
                return { default: () => (
                  <div className="p-4">
                    <h2 className="text-xl font-bold text-red-600">Slide Component Error</h2>
                    <p>Unable to load this slide's component.</p>
                  </div>
                )};
              })
          );
        }
      });
      setSlideComponents(components);
    } catch (error) {
      console.error("Error loading slides:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const goToNextSlide = () => {
    if (currentSlideIndex < activeSlides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  // Toggle section expanded state
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (e.key === 'Escape') {
        navigate('/');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [goToNextSlide, goToPrevSlide, navigate]);

  // Get current slide component
  const getCurrentSlide = () => {
    if (activeSlides.length === 0 || loading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-700 mb-4"></div>
          <p className="text-lg text-gray-700">Loading slides...</p>
        </div>
      );
    }

    const slide = activeSlides[currentSlideIndex];
    if (!slide) return null;

    // Handle dynamic component loading
    if (slideComponents[slide.id]) {
      const SlideComponent = slideComponents[slide.id];
      return (
        <React.Suspense fallback={
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-700"></div>
          </div>
        }>
          <SlideComponent />
        </React.Suspense>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-2xl font-bold text-gray-800 mb-4">Slide Not Found</div>
        <p className="text-gray-600">The requested slide could not be loaded.</p>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 overflow-hidden flex flex-col`}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Slide Navigator</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2">
          {Object.keys(slidesBySection).map(section => (
            <div key={section} className="mb-2">
              <div 
                className="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleSection(section)}
              >
                <div className="mr-2">
                  {expandedSections[section] ? (
                    <ChevronDown size={16} className="text-gray-500" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-500" />
                  )}
                </div>
                <h3 className="font-medium text-gray-700">{formatSectionName(section)}</h3>
                <div className="ml-auto text-xs text-gray-500">
                  {slidesBySection[section].length}
                </div>
              </div>
              
              {expandedSections[section] && (
                <div className="pl-4 pr-2 py-2">
                  {slidesBySection[section].map(slide => {
                    const slideIndex = activeSlides.findIndex(s => s.id === slide.id);
                    const isCurrent = slideIndex === currentSlideIndex;
                    
                    return (
                      <div
                        key={slide.id}
                        className={`${isCurrent ? 'bg-purple-50 border-l-2 border-purple-500' : 'bg-white'} 
                          p-2 mb-1 rounded cursor-pointer hover:bg-purple-50 transition-all duration-150`}
                        onClick={() => setCurrentSlideIndex(slideIndex)}
                      >
                        <div className="text-sm truncate">
                          {slide.title}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4 text-gray-500 hover:text-gray-700"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
            </button>
            <h1 className="text-xl font-semibold text-gray-800">Allie Investor Deck</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              {activeSlides.length > 0 ? `Slide ${currentSlideIndex + 1} of ${activeSlides.length}` : 'Loading...'}
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={goToPrevSlide}
                disabled={currentSlideIndex === 0}
                className={`p-2 rounded-md ${currentSlideIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Previous slide"
              >
                <ArrowLeft size={20} />
              </button>
              
              <button 
                onClick={goToNextSlide}
                disabled={currentSlideIndex === activeSlides.length - 1}
                className={`p-2 rounded-md ${currentSlideIndex === activeSlides.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}`}
                aria-label="Next slide"
              >
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Slide content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8 h-full">
            <div className="bg-white rounded-lg shadow-lg h-full p-10 max-w-6xl mx-auto overflow-auto">
              {getCurrentSlide()}
            </div>
          </div>
        </div>
        
        {/* Bottom controls */}
        <div className="bg-white border-t border-gray-200 p-2 flex justify-center">
          <div className="flex space-x-4">
            {activeSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlideIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  currentSlideIndex === index ? 'bg-purple-600' : 'bg-gray-300'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorSlideshow;