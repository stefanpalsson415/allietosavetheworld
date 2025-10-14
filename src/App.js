import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FamilyProvider } from './contexts/FamilyContext';
import { SurveyProvider } from './contexts/SurveyContext';
import { ChoreProvider } from './contexts/ChoreContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ChatDrawerProvider } from './contexts/ChatDrawerContext';
import { SurveyDrawerProvider } from './contexts/SurveyDrawerContext';
import { useFamily } from './contexts/FamilyContext';
import { useAuth } from './contexts/AuthContext';
import { eventLoopGuard } from './event-loop-guard'; // Import event loop protection
import './event-loop-guard-enhanced';
import { responsiveHelper } from './utils/responsiveHelper'; // Import responsive helper
import { setupCalendarRefreshListener } from './utils/calendarRefreshHelper'; // Import calendar refresh helper
import { Calendar as CalendarV2, CalendarProvider } from './components/calendar-v2';
import './styles/atomicHabits.css';
import './styles/notion.css';
import './styles/notion-chat.css';
import './styles/landing-animations.css';
import { EventProvider } from './contexts/EventContext';
import { NewEventProvider } from './contexts/NewEventContext';
import { UnifiedEventProvider, useUnifiedEvent } from './contexts/UnifiedEventContext';
import AIOrchestrator from './services/AIOrchestrator';
// Import Task Weight API integrations
import './index.extensions';
import { preloadFamilyMemberProfiles } from './utils/profileUtils';
import EnhancedChatService from './services/EnhancedChatService';
import { isMobileDevice } from './utils/mobileDetection';

// Import styles
import './styles/smooth-transitions.css'; // Import smooth transitions for chore loading
import './styles/google-places-fix.css'; // Fix for Google Places autocomplete dropdown

// Create a loading component for Suspense fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// Lazy load all route components for code splitting
const AboutUsPage = lazy(() => import('./components/marketing/AboutUsPage'));
const NewAboutUsPage = lazy(() => import('./components/marketing/NewAboutUsPage'));
const NotionStyleAboutPage = lazy(() => import('./components/marketing/NotionStyleAboutPage'));
const FamilyMemory = lazy(() => import('./components/marketing/FamilyMemoryPage'));
const HowThisWorksScreen = lazy(() => import('./components/education/HowThisWorksScreen'));
const InvestorFunnel = lazy(() => import('./components/marketing/InvestorFunnelWithProgressBar'));
const InvestorFunnelAllSlides = lazy(() => import('./components/marketing/InvestorFunnelAllSlides'));
const InvestorFunnelV2 = lazy(() => import('./components/marketing/InvestorFunnelV2'));
const InvestorFunnelV3 = lazy(() => import('./components/marketing/InvestorFunnelV3'));
const InvestorFunnelV4 = lazy(() => import('./components/marketing/investorFunnelV4/InvestorFunnelV4'));
const InvestorAccessPage = lazy(() => import('./components/marketing/InvestorAccessPage'));
const InvestorSlideshow = lazy(() => import('./components/marketing/InvestorSlideshow'));
const InvestorPage = lazy(() => import('./components/marketing/InvestorPage'));

const ProductOverviewPage = lazy(() => import('./components/marketing/ProductOverviewPage'));
const BlogHomePage = lazy(() => import('./components/blog/BlogHomePage'));
const NotionBlogHomePage = lazy(() => import('./components/blog/NotionBlogHomePage'));
const BlogListPage = lazy(() => import('./components/blog/BlogListPage'));
const BlogArticlePage = lazy(() => import('./components/blog/BlogArticlePage'));
const BlogPostPage = lazy(() => import('./components/blog/BlogPostPage'));
const MiniSurvey = lazy(() => import('./components/survey/MiniSurvey'));
const MiniResultsScreen = lazy(() => import('./components/survey/MiniResultsScreen'));
const FamilySelectionScreen = lazy(() => import('./components/user/FamilySelectionScreen'));
const NotionFamilySelectionScreen = lazy(() => import('./components/user/NotionFamilySelectionScreen'));
const SurveyScreen = lazy(() => import('./components/survey/SurveyScreen'));
const DashboardScreen = lazy(() => import('./components/dashboard/DashboardScreen'));
const NotionDashboard = lazy(() => import('./components/dashboard/NotionDashboard'));
const DashboardWrapper = lazy(() => import('./components/dashboard/DashboardWrapper'));
const WeeklyCheckInScreen = lazy(() => import('./components/survey/WeeklyCheckInScreen'));
const LoadingScreen = lazy(() => import('./components/common/LoadingScreen'));
const UserSignupScreen = lazy(() => import('./components/user/UserSignupScreen'));
const UserSettingsScreen = lazy(() => import('./components/user/UserSettingsScreen'));
const KidFriendlySurvey = lazy(() => import('./components/survey/KidFriendlySurvey'));
const FamilySurveyDashboard = lazy(() => import('./components/survey/FamilySurveyDashboard'));
const PaymentScreen = lazy(() => import('./components/payment/PaymentScreen'));
const LandingPage = lazy(() => import('./components/marketing/LandingPage'));
const NewLandingPage = lazy(() => import('./components/marketing/NewLandingPage'));
const ExcitingLandingPage = lazy(() => import('./components/marketing/ExcitingLandingPage'));
const StorytellingHomePage = lazy(() => import('./components/marketing/QuickFixStorytellingHomePage'));
const LongVisionDocument = lazy(() => import('./components/marketing/LongVisionDocument'));
const PersonalizedHomePage = lazy(() => import('./components/dashboard/PersonalizedHomePage'));
const OnboardingFlow = lazy(() => import('./components/onboarding/OnboardingFlow'));
const ModernOnboardingFlow = lazy(() => import('./components/onboarding/ModernOnboardingFlow'));
const RelationshipFeaturesPage = lazy(() => import('./components/marketing/RelationshipFeaturesPage'));
const AIAssistantPage = lazy(() => import('./components/marketing/AIAssistantPage'));

// Lazy load heavy components
const RevisedFloatingCalendarWidget = lazy(() => import('./components/calendar/RevisedFloatingCalendarWidget'));
const NewFloatingCalendarWidget = lazy(() => import('./components/calendar/NewFloatingCalendarWidget'));
const NotionFloatingCalendarWidget = lazy(() => import('./components/calendar/NotionFloatingCalendarWidget'));
const EmailOptIn = lazy(() => import('./components/marketing/EmailOptIn'));
const ClaudeDebugger = lazy(() => import('./components/debug/ClaudeDebugger'));
const FamilyAllieDrive = lazy(() => import('./components/document/FamilyAllieDrive'));
const AIDebugPanel = lazy(() => import('./components/debug/AIDebugPanel'));

// Lazy load components that aren't needed immediately
const ResponsiveChatWrapper = lazy(() => import('./components/chat/ResponsiveChatWrapper'));
const ResizableChatDrawer = lazy(() => import('./components/chat/ResizableChatDrawer'));
const SurveyDrawer = lazy(() => import('./components/survey/SurveyDrawer'));
const ServerStatus = lazy(() => import('./components/common/ServerStatus'));
const MobileChatView = lazy(() => import('./components/mobile/MobileChatView'));

// Import provider fix for Allie chat (this can fail with ESLint issues)
try {
  import('./services/provider-fix').catch(e => console.error("Error loading provider-fix:", e));
} catch (error) {
  console.error("Failed to import provider-fix:", error);
}

// Removed old test script loading - these files no longer exist and were causing errors

// Allie chat fix is now properly implemented in source code
// No need to dynamically load an external fix script anymore
console.log("Using integrated event loop protection");

// Error fixing is now handled properly in the source code
// No need for external fix-errors.js script

// Import test provider functionality
try {
  import('./test-allie-provider').catch(e => console.log("Optional test script not loaded"));
  import('./test-provider-page').catch(e => console.log("Optional test page not loaded"));
} catch (e) {
  console.log("Optional tests not loaded");
}

// Helper function to update the favicon
const updateFavicon = (imageUrl) => {
  let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  link.href = imageUrl;
  document.getElementsByTagName('head')[0].appendChild(link);
};





function GoogleMapsApiLoader() {
  useEffect(() => {
    // Only load if not already loaded
    if (window.google && window.google.maps) {
      console.log("Google Maps API already loaded");
      // Still dispatch the event to make sure components know it's ready
      window.dispatchEvent(new Event('google-maps-api-loaded'));
      return;
    }
    
    // Create a clean load function following Google's recommended pattern
    const loadGoogleMapsApi = () => {
      // Get API key from environment variables
      const apiKey = process.env.REACT_APP_GOOGLE_API_KEY || '';
      
      if (!apiKey) {
        // Silently fall back to mock mode - this is expected in development
        console.log("Google Maps running in mock mode (no API key configured)");
        window.googleMapsLoadFailed = true;
        window.googleMapsMockMode = true;
        return Promise.resolve(); // Don't reject - just use mock mode
      }
      
      return new Promise((resolve, reject) => {
        try {
          // Set a global callback that will be called when the API loads
          window.initGoogleMapsApi = () => {
            console.log("Google Maps API loaded successfully");
            
            try {
              // Use window.google to access the global Google object
              if (window.google && window.google.maps) {
                console.log("Maps object available, attempting to load Places library");
                
                // Check if Places is already available
                if (window.google.maps.places) {
                  console.log("Places library already available");
                  window.dispatchEvent(new Event('google-maps-api-loaded'));
                  resolve(true);
                  return;
                }
                
                // Import the places library using the recommended method
                window.google.maps.importLibrary("places").then((placesLibrary) => {
                  console.log("Places library loaded successfully:", placesLibrary);
                  
                  // Check if the PlaceAutocompleteElement is available
                  if (window.google.maps.places.PlaceAutocompleteElement) {
                    console.log("PlaceAutocompleteElement is available (new API)");
                  } else {
                    console.log("PlaceAutocompleteElement not available, will use Autocomplete instead (legacy API)");
                  }
                  
                  // Dispatch an event to notify components that the API is loaded
                  window.dispatchEvent(new Event('google-maps-api-loaded'));
                  resolve(true);
                }).catch(error => {
                  console.error("Error importing Places library:", error);
                  // Even if the modern API fails, we can try to use the legacy approach
                  if (window.google.maps.places && window.google.maps.places.Autocomplete) {
                    console.log("Falling back to legacy Autocomplete API");
                    window.dispatchEvent(new Event('google-maps-api-loaded'));
                    resolve(true);
                  } else {
                    reject(error);
                  }
                });
              } else {
                console.error("Google Maps API not available on window object");
                reject(new Error("Google Maps API not available"));
              }
            } catch (error) {
              console.error("Error initializing Places library:", error);
              reject(error);
            }
          };          
          // Create and append the script tag - use recommended loading pattern
          const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initGoogleMapsApi&v=weekly&libraries=places,maps,geocoding`;
script.async = true;
script.defer = true;
          
          // Handle loading errors
          script.onerror = (err) => {
            console.error("Error loading Google Maps API", err);
            window.googleMapsLoadFailed = true;
            reject(new Error("Failed to load Google Maps API"));
          };
          
          // Check for existing script to avoid duplicates
          if (document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js"]`)) {
            console.warn("Google Maps script already exists in DOM, not adding again");
            return;
          }
          
          document.head.appendChild(script);
        } catch (err) {
          console.error("Error setting up Google Maps API:", err);
          reject(err);
        }
      });
    };
    

    AIOrchestrator.initialize()
    .then(result => {
      if (result.success) {
        console.log("✅ AI Orchestrator initialized successfully");
      } else {
        console.warn("⚠️ AI Orchestrator initialization failed:", result.error);
      }
    })
    .catch(error => {
      console.error("❌ Error initializing AI:", error);
    });


    // Load the API and handle errors gracefully
    loadGoogleMapsApi().then(() => {
      console.log("Google Maps initialization complete");
    }).catch(error => {
      // This is not really an error - just means we're in mock mode
      console.log("Google Maps using mock mode:", error?.message || "No API key");
      window.googleMapsLoadFailed = true;
    });
    
    // Handle API authentication failures
    window.gm_authFailure = () => {
      console.warn("Google Maps API authentication failed - using fallback mode");
      window.googleMapsAuthFailed = true;
    };
    
    return () => {
      // Clean up
      if (window.initGoogleMapsApi) {
        delete window.initGoogleMapsApi;
      }
      if (window.gm_authFailure) {
        delete window.gm_authFailure;
      }
      // We don't remove the script on unmount to prevent repeated loading
    };
  }, []);
  
  return null; // This component doesn't render anything
}

// App Routes Component - Used after context providers are set up
// Component to initialize UnifiedEventContext with EnhancedChatService
function UnifiedEventInitializer({ children }) {
  const unifiedEvent = useUnifiedEvent();
  
  useEffect(() => {
    if (unifiedEvent) {
      console.log("Setting UnifiedEventContext on EnhancedChatService");
      EnhancedChatService.setUnifiedEventContext(unifiedEvent);
    }
  }, [unifiedEvent]);
  
  return <>{children}</>;
}

// Keyboard shortcut listener component
function KeyboardShortcutListener() {
  const { openEventParser } = useUnifiedEvent();
  
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl/Cmd + E to open event parser
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        openEventParser();
      }
      
      // Ctrl/Cmd + Shift + E to open event parser with clipboard content
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'E') {
        event.preventDefault();
        navigator.clipboard.readText().then(text => {
          openEventParser(text);
        }).catch(() => {
          openEventParser();
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openEventParser]);
  
  return null;
}

function AppRoutes() {
  const { selectedUser, familyPicture, familyMembers } = useFamily();
  const { currentUser } = useAuth();

  // Detect if user is on mobile device
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    // Check on mount and window resize
    const checkMobile = () => {
      setIsMobile(isMobileDevice());
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Preload family member profile images for consistent display - only once
  useEffect(() => {
    if (Array.isArray(familyMembers) && familyMembers.length > 0) {
      // Only preload if we have actual profile images
      const hasImages = familyMembers.some(m => m.profilePicture || m.profilePictureUrl);
      if (hasImages) {
        console.log(`Preloading profile images for ${familyMembers.length} family members`);
        preloadFamilyMemberProfiles(familyMembers);
      }
    }
  }, []); // Empty deps - only run once on mount

  useEffect(() => {
    // Check for required environment variables on startup
    if (!process.env.REACT_APP_GOOGLE_API_KEY || !process.env.REACT_APP_GOOGLE_CLIENT_ID) {
      // This is fine - we support mock mode for development
      console.log("Google services running in mock mode (no API keys configured)");
    } else {
      console.log("Google API credentials found - full integration enabled");
    }
  }, []);
  
  // Update favicon based on user login status and family picture
  useEffect(() => {
    if (currentUser && familyPicture) {
      // User is logged in and family has a picture - use it as favicon
      updateFavicon(familyPicture);
    } else {
      // User not logged in, reset to default favicon
      updateFavicon('/favicon.svg');
    }
  }, [currentUser, familyPicture]);

  // Determine if calendar widget should be shown
  const showCalendarWidget = !!currentUser && !!selectedUser && window.location.pathname === '/dashboard';

  return (
    <>
      {/* Add the Google Maps API Loader */}
      <GoogleMapsApiLoader />
      <KeyboardShortcutListener />
      
      <Routes>
        <Route path="/" element={
          <Suspense fallback={<LoadingFallback />}>
            <StorytellingHomePage />
          </Suspense>
        } />
        <Route path="/story" element={
          <Suspense fallback={<LoadingFallback />}>
            <StorytellingHomePage />
          </Suspense>
        } />
        <Route path="/vision" element={
          <Suspense fallback={<LoadingFallback />}>
            <LongVisionDocument />
          </Suspense>
        } />
        <Route path="/exciting" element={
          <Suspense fallback={<LoadingFallback />}>
            <ExcitingLandingPage />
          </Suspense>
        } />
        <Route path="/login" element={
          <Suspense fallback={<LoadingFallback />}>
            <NotionFamilySelectionScreen />
          </Suspense>
        } />
        <Route path="/classic-login" element={
          <Suspense fallback={<LoadingFallback />}>
            <FamilySelectionScreen />
          </Suspense>
        } />
        <Route path="/onboarding" element={
          <Suspense fallback={<LoadingFallback />}>
            <OnboardingFlow />
          </Suspense>
        } />
        <Route path="/signup" element={
          <Suspense fallback={<LoadingFallback />}>
            <UserSignupScreen />
          </Suspense>
        } />
        <Route path="/email-opt-in" element={
          <Suspense fallback={<LoadingFallback />}>
            <EmailOptIn />
          </Suspense>
        } />
        <Route path="/survey-dashboard" element={
          <Suspense fallback={<LoadingFallback />}>
            <FamilySurveyDashboard />
          </Suspense>
        } />
        <Route path="/user/settings" element={
          <Suspense fallback={<LoadingFallback />}>
            <UserSettingsScreen />
          </Suspense>
        } />
        
        {/* Dashboard route - mobile shows chat-only, desktop shows full dashboard */}
        <Route path="/dashboard" element={
          <Suspense fallback={<LoadingFallback />}>
            {isMobile && currentUser ? (
              <MobileChatView />
            ) : (
              <DashboardWrapper />
            )}
          </Suspense>
        } />
        
        {/* Family meeting route */}
        <Route path="/family-meeting" element={
          <Suspense fallback={<LoadingScreen />}>
            {React.createElement(lazy(() => import('./components/meeting/EnhancedFamilyMeeting')))}
          </Suspense>
        } />
        
        <Route path="/how-it-works" element={
          <Suspense fallback={<LoadingFallback />}>
            <HowThisWorksScreen />
          </Suspense>
        } />
        <Route path="/family-command-center" element={
          <Suspense fallback={<LoadingFallback />}>
            <RelationshipFeaturesPage />
          </Suspense>
        } />
        <Route path="/ai-assistant" element={
          <Suspense fallback={<LoadingFallback />}>
            <AIAssistantPage />
          </Suspense>
        } />
        <Route path="/about-us" element={
          <Suspense fallback={<LoadingFallback />}>
            <NotionStyleAboutPage />
          </Suspense>
        } />
        <Route path="/family-memory" element={
          <Suspense fallback={<LoadingFallback />}>
            <FamilyMemory />
          </Suspense>
        } />
        <Route path="/product-overview" element={
          <Suspense fallback={<LoadingFallback />}>
            <ProductOverviewPage />
          </Suspense>
        } />
        <Route path="/blog" element={
          <Suspense fallback={<LoadingFallback />}>
            <BlogListPage />
          </Suspense>
        } />
        <Route path="/blog/:slug" element={
          <Suspense fallback={<LoadingFallback />}>
            <BlogPostPage />
          </Suspense>
        } />
        <Route path="/debug/ai" element={
          <Suspense fallback={<LoadingFallback />}>
            <AIDebugPanel />
          </Suspense>
        } />
        <Route path="/investors" element={
          <Suspense fallback={<LoadingFallback />}>
            <InvestorPage />
          </Suspense>
        } />

        <Route path="/survey" element={
          <Suspense fallback={<LoadingFallback />}>
            <SurveyScreen mode="initial" />
          </Suspense>
        } />
        
        {/* Add a dedicated route for kid-survey with better path protection */}
        <Route path="/kid-survey" element={
          localStorage.getItem('selectedUserId') ? (
            <Suspense fallback={<LoadingFallback />}>
              <KidFriendlySurvey surveyType="initial" />
            </Suspense>
          ) : (
            <Navigate to="/login" />
          )
        } />
        <Route path="/mini-survey" element={
          <Suspense fallback={<LoadingFallback />}>
            <MiniSurvey />
          </Suspense>
        } />
        <Route path="/survey/mini" element={
          <Suspense fallback={<LoadingFallback />}>
            <MiniSurvey />
          </Suspense>
        } />
        <Route path="/mini-results" element={
          <Suspense fallback={<LoadingFallback />}>
            <MiniResultsScreen />
          </Suspense>
        } />
        <Route path="/payment" element={
          <Suspense fallback={<LoadingFallback />}>
            <PaymentScreen />
          </Suspense>
        } />
        <Route path="/home" element={
          <Suspense fallback={<LoadingFallback />}>
            <PersonalizedHomePage />
          </Suspense>
        } />
        <Route path="/dashboard" element={<DashboardWrapper />} />
        <Route path="/classic-dashboard" element={
          <Suspense fallback={<LoadingFallback />}>
            <DashboardScreen />
          </Suspense>
        } />
        <Route path="/chat" element={
          <Suspense fallback={<LoadingFallback />}>
            <ResponsiveChatWrapper />
          </Suspense>
        } />
        <Route path="/debug/claude" element={
          <Suspense fallback={<LoadingFallback />}>
            <ClaudeDebugger />
          </Suspense>
        } />
        <Route path="/investor" element={
          <Suspense fallback={<LoadingFallback />}>
            <InvestorFunnel />
          </Suspense>
        } />
        <Route path="/investor/all" element={
          <Suspense fallback={<LoadingFallback />}>
            <InvestorFunnelAllSlides />
          </Suspense>
        } />
        <Route path="/investor/v2" element={
          <Suspense fallback={<LoadingFallback />}>
            <InvestorFunnelV2 />
          </Suspense>
        } />
        <Route path="/investor/v3" element={
          <Suspense fallback={<LoadingFallback />}>
            <InvestorFunnelV3 />
          </Suspense>
        } />
        <Route path="/investor/v4" element={
          <Suspense fallback={<LoadingFallback />}>
            <InvestorFunnelV4 />
          </Suspense>
        } />
        <Route path="/investor-funnel-v4" element={
          <Suspense fallback={<LoadingFallback />}>
            <InvestorFunnelV4 />
          </Suspense>
        } />
        <Route path="/investor/access" element={
          <Suspense fallback={<LoadingFallback />}>
            <InvestorAccessPage />
          </Suspense>
        } />
        <Route path="/investor/slideshow" element={
          <Suspense fallback={<LoadingFallback />}>
            <InvestorSlideshow />
          </Suspense>
        } />
        <Route path="/debug/ai" element={
          <Suspense fallback={<LoadingFallback />}>
            <AIDebugPanel />
          </Suspense>
        } />
        
        {/* Test route for Notion Chat */}
        <Route path="/test/notion-chat" element={
          <Suspense fallback={<LoadingScreen />}>
            {React.createElement(lazy(() => import('./tests/NotionChatTest')))}
          </Suspense>
        } />
        
        {/* Test route for Chat Panel */}
        <Route path="/test/chat-panel" element={
          <Suspense fallback={<LoadingScreen />}>
            {React.createElement(lazy(() => import('./tests/ChatPanelTest')))}
          </Suspense>
        } />
        
        {/* Demo route for the Google-style date time picker */}
        <Route path="/demo/date-picker" element={
          <Suspense fallback={<LoadingScreen />}>
            {React.createElement(lazy(() => import('./components/calendar/GoogleStyleDateTimePickerDemo')))}
          </Suspense>
        } />
        
        {/* Demo route for the Google-style calendar */}
        <Route path="/demo/calendar" element={
          <Suspense fallback={<LoadingFallback />}>
            <div className="w-full h-screen p-4">
              <RevisedFloatingCalendarWidget embedded={true} />
            </div>
          </Suspense>
        } />
        
        {/* Demo route for Calendar V2 */}
        <Route path="/demo/calendar-v2" element={
          <CalendarProvider>
            <div className="w-full h-screen p-4">
              <CalendarV2 />
            </div>
          </CalendarProvider>
        } />
        
        {/* Demo route for multimodal understanding pipeline */}
        <Route path="/demo/multimodal" element={
          <Suspense fallback={<LoadingScreen />}>
            {React.createElement(lazy(() => import('./tests/MultimodalPipelineTest')))}
          </Suspense>
        } />

        {/* Test route for simple conversation flow */}
        <Route path="/test/conversation" element={
          <Suspense fallback={<LoadingScreen />}>
            {React.createElement(lazy(() => import('./components/testing/SimpleConversationTest')))}
          </Suspense>
        } />
        
        {/* Route for weekly check-in - directs kids to kid-friendly version */}
        <Route path="/weekly-check-in" element={
          selectedUser?.role === 'child'
            ? <KidFriendlySurvey surveyType="weekly" />
            : <SurveyScreen mode="weekly" />
        } />

        {/* Test route for providers */}
        <Route path="/test-providers" element={
          <Suspense fallback={<LoadingScreen />}>
            {React.createElement(lazy(() => import('./components/document/SimpleProviderDirectory')))}
          </Suspense>
        } />

        <Route path="/loading" element={
          <Suspense fallback={<LoadingFallback />}>
            <LoadingScreen />
          </Suspense>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {/* We now have a full calendar tab, so no need for the floating widget */}
      
      {/* Server Status Indicator */}
      <Suspense fallback={null}>
        <ServerStatus />
      </Suspense>
    </>
  );
// Event loop protection is loaded via import at the top of the file

}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorDetails: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console and potentially a monitoring service
    console.error("Error in application:", error, errorInfo);
    this.setState({ 
      errorDetails: error.message,
      errorInfo: errorInfo
    });
  }

  handleReset = () => {
    // Clear any stored state that might be causing issues
    try {
      localStorage.removeItem('directFamilyAccess');
      localStorage.removeItem('selectedFamilyId');
      sessionStorage.clear();
    } catch (e) {
      console.error("Error clearing storage:", e);
    }
    
    // Reload the page
    window.location.href = '/';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-roboto">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h2 className="text-2xl font-bold mb-4 font-roboto">Something went wrong</h2>
            
            {this.state.errorDetails && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded border border-red-200 text-sm overflow-auto">
                <p className="font-medium mb-1">Error:</p>
                <p className="font-roboto">{this.state.errorDetails}</p>
              </div>
            )}
            
            <p className="mb-4 font-roboto">Please try one of the following:</p>
            <ul className="list-disc pl-5 mb-6 space-y-2 font-roboto">
              <li>Refresh the page</li>
              <li>Clear your browser cache</li>
              <li>Log out and log back in</li>
            </ul>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 font-roboto"
              >
                Refresh Page
              </button>
              
              <button 
                onClick={this.handleReset} 
                className="px-4 py-2 border border-black text-black rounded hover:bg-gray-50 font-roboto"
              >
                Reset & Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}

function App() {
  console.log("App rendering..."); 
  
  // Initialize chat system and layout adjustments
  React.useEffect(() => {
    // Make sure the Notion chat CSS is properly applied
    document.body.classList.add('notion-enabled');
    
    // Initialize responsive helper
    responsiveHelper.init();
    
    // Initialize calendar refresh listener
    setupCalendarRefreshListener();
    
    // Debug the chat panel initialization
    console.log("App initialized: Setting up chat panel system");
    
    // Add a direct event listener to debug if events are firing
    window.addEventListener('open-allie-chat', () => {
      console.log("App detected open-allie-chat event");
    });
    
    // Family meeting is now handled directly in NotionDashboard component
    
    console.log("Using built-in NotionStyleChatPanel component for chat functionality");
    
    // Using permanent fixes in the component files instead of client-side scripts
    
    return () => {
      document.body.classList.remove('notion-enabled');
      window.removeEventListener('open-allie-chat', () => {});
      window.removeEventListener('open-family-meeting', () => {});
    };
  }, []);
  
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <FamilyProvider>
            <SurveyProvider>
              <ChoreProvider>
                {/* Unified event system that bridges old and new */}
                <UnifiedEventProvider>
                  {/* We're keeping the old EventProvider for backward compatibility during transition */}
                  <EventProvider>
                    {/* New EventProvider for the improved calendar system */}
                    <NewEventProvider>
                      <NotificationProvider>
                        <ChatDrawerProvider>
                          <SurveyDrawerProvider>
                            <UnifiedEventInitializer>
                              <div className="App app-container">
                                <AppRoutes />
                                {/* Global Drawers - outside of main content flow */}
                                {/* ResizableChatDrawer uses REFACTORED AllieChat */}
                                <Suspense fallback={null}>
                                  <ResizableChatDrawer />
                                </Suspense>
                                <Suspense fallback={null}>
                                  <SurveyDrawer />
                                </Suspense>
                              </div>
                            </UnifiedEventInitializer>
                          </SurveyDrawerProvider>
                        </ChatDrawerProvider>
                      </NotificationProvider>
                    </NewEventProvider>
                  </EventProvider>
                </UnifiedEventProvider>
              </ChoreProvider>
            </SurveyProvider>
          </FamilyProvider>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default App;