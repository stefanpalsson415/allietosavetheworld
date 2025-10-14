import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Check, Brain, Heart, Scale,
  Clock, BarChart, Users, Command, Calendar,
  FileText, MessageSquare, Database, Activity, Shield,
  Zap, Star, Target, Lock, Award, ChevronRight,
  ChevronDown, ChevronUp, AlertTriangle, RefreshCw,
  PlusCircle, Layers, Key, Sparkles, CheckCircle,
  Camera, Code, DollarSign, TrendingUp, HelpCircle,
  Eye, Home, List, Settings, Menu, X, Save, Printer
} from 'lucide-react';

// Import ALL unique slide components
import AwarenessFirstSlide from './investorSlides/AwarenessFirstSlide';
import BusinessCaseValidationSlide from './investorSlides/BusinessCaseValidationSlide';
import CompetitorLandscapeSlide from './investorSlides/CompetitorLandscapeSlide';
import DataValueSlide from './investorSlides/DataValueSlide';
import FamilyFlywheelSlide1 from './investorSlides/FamilyFlywheelSlide1';
import FamilyFlywheelSlide2 from './investorSlides/FamilyFlywheelSlide2';
import FamilyFlywheelSlide3 from './investorSlides/FamilyFlywheelSlide3';
import FinancialProjectionsSlide from './investorSlides/FinancialProjectionsSlide';
import GenerationalImbalanceSlide from './investorSlides/GenerationalImbalanceSlide';
import GlobalCrisisImpactSlide from './investorSlides/GlobalCrisisImpactSlide';
import PerceptionGapSlide from './investorSlides/PerceptionGapSlide';
import RelationshipImpactSlide from './investorSlides/RelationshipImpactSlide';
import InvisibleCrisisSlide from './investorSlides/InvisibleCrisisSlide';
import MarketValidationSlide from './investorSlides/MarketValidationSlide';
import InitialTractionSlide from './investorSlides/InitialTractionSlide';
import LTVExpansionSlide from './investorSlides/LTVExpansionSlide';
import MacroTailwindsSlide from './investorSlides/MacroTailwindsSlide';
import DemographicCrisisSlide from './investorSlides/DemographicCrisisSlide';
import MarketSizeSlide from './investorSlides/MarketSizeSlide';
import MarketSummarySlide from './investorSlides/MarketSummarySlide';
import MentalLoadAssessmentSlide from './investorSlides/MentalLoadAssessmentSlide';
import NextStepsSlide from './investorSlides/NextStepsSlide';
import ParentalGapSlide from './investorSlides/ParentalGapSlide';
import ParentalLoadTypesSlide from './investorSlides/ParentalLoadTypesSlide';
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
import ParentalMentalLoadSlide from './investorSlides/ParentalMentalLoadSlide';

// CSS for drag and drop
const dragDropStyles = `
  .drag-over {
    border: 2px dashed #a855f7 !important;
    background-color: #f3e8ff !important;
    transform: translateY(2px);
    box-shadow: 0 3px 10px rgba(168, 85, 247, 0.2);
  }

  [draggable] {
    cursor: grab;
  }

  [draggable]:active {
    cursor: grabbing;
  }

  .slide-card {
    transition: all 0.2s ease;
  }

  .slide-card:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  }
`;

const InvestorFunnelV2 = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(1);
  const [showSlideMenu, setShowSlideMenu] = useState(false);
  const [slideSearch, setSlideSearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [draggedSlide, setDraggedSlide] = useState(null);
  
  // Load slides from localStorage or use default slides
  const loadSlidesFromStorage = () => {
    try {
      const savedSlides = localStorage.getItem('investorSlides');
      if (savedSlides) {
        // Parse the JSON string
        const parsedSlides = JSON.parse(savedSlides);

        // Convert component strings back to actual components
        return parsedSlides.map(slide => {
          if (slide.componentName) {
            // Map component name string back to the actual component
            const componentMap = {
              'ProblemSummarySlide': ProblemSummarySlide,
              'ParentalGapSlide': ParentalGapSlide,
              'GenerationalImbalanceSlide': GenerationalImbalanceSlide,
              'SiblingDynamicsSlide': SiblingDynamicsSlide,
              'WorkloadVisualizationSlide': WorkloadVisualizationSlide,
              'MentalLoadAssessmentSlide': MentalLoadAssessmentSlide,
              'TimeValueAnalysisSlide': TimeValueAnalysisSlide,
              'RelationshipImpactSlide': RelationshipImpactSlide,
              'GlobalCrisisImpactSlide': GlobalCrisisImpactSlide,
              'PerceptionGapSlide': PerceptionGapSlide,
              'DemographicCrisisSlide': DemographicCrisisSlide,
              'MacroTailwindsSlide': MacroTailwindsSlide,
              'InvisibleCrisisSlide': InvisibleCrisisSlide,
              'BusinessCaseValidationSlide': BusinessCaseValidationSlide,
              'AwarenessFirstSlide': AwarenessFirstSlide,
              'SolutionSummarySlide': SolutionSummarySlide,
              'ScientificFoundationSlide': ScientificFoundationSlide,
              'PersonalizedApproachSlide': PersonalizedApproachSlide,
              'FamilyFlywheelSlide1': FamilyFlywheelSlide1,
              'FamilyFlywheelSlide2': FamilyFlywheelSlide2,
              'FamilyFlywheelSlide3': FamilyFlywheelSlide3,
              'LTVExpansionSlide': LTVExpansionSlide,
              'DataValueSlide': DataValueSlide,
              'TechnologyStackSlide': TechnologyStackSlide,
              'CompetitorLandscapeSlide': CompetitorLandscapeSlide,
              'MarketValidationSlide': MarketValidationSlide,
              'MarketSummarySlide': MarketSummarySlide,
              'MarketSizeSlide': MarketSizeSlide,
              'ProductRoadmapSlide': ProductRoadmapSlide,
              'InitialTractionSlide': InitialTractionSlide,
              'TractionSummarySlide': TractionSummarySlide,
              'TeamAdvisorsSlide': TeamAdvisorsSlide,
              'FinancialProjectionsSlide': FinancialProjectionsSlide,
              'NextStepsSlide': NextStepsSlide,
              'ParentalMentalLoadSlide': ParentalMentalLoadSlide
            };
            return {
              ...slide,
              component: componentMap[slide.componentName] || null,
              componentName: undefined // Remove the componentName property
            };
          }
          return slide;
        });
      }
    } catch (error) {
      console.error("Error loading slides from localStorage:", error);
    }

    // Return default slides if nothing in localStorage or error occurs
    return defaultSlides;
  };

  // Function to save slides to localStorage
  const saveSlides = (slidesToSave = slides) => {
    if (!slidesToSave || slidesToSave.length === 0) {
      console.warn('No slides to save');
      return false;
    }
    try {
      // We need to convert component references to strings for localStorage
      const slidesForStorage = slidesToSave.map(slide => {
        if (slide.component) {
          // Find the component name by checking against all imported components
          let componentName = null;
          if (slide.component === ProblemSummarySlide) componentName = 'ProblemSummarySlide';
          else if (slide.component === ParentalGapSlide) componentName = 'ParentalGapSlide';
          else if (slide.component === GenerationalImbalanceSlide) componentName = 'GenerationalImbalanceSlide';
          else if (slide.component === SiblingDynamicsSlide) componentName = 'SiblingDynamicsSlide';
          else if (slide.component === WorkloadVisualizationSlide) componentName = 'WorkloadVisualizationSlide';
          else if (slide.component === MentalLoadAssessmentSlide) componentName = 'MentalLoadAssessmentSlide';
          else if (slide.component === TimeValueAnalysisSlide) componentName = 'TimeValueAnalysisSlide';
          else if (slide.component === RelationshipImpactSlide) componentName = 'RelationshipImpactSlide';
          else if (slide.component === GlobalCrisisImpactSlide) componentName = 'GlobalCrisisImpactSlide';
          else if (slide.component === PerceptionGapSlide) componentName = 'PerceptionGapSlide';
          else if (slide.component === DemographicCrisisSlide) componentName = 'DemographicCrisisSlide';
          else if (slide.component === MacroTailwindsSlide) componentName = 'MacroTailwindsSlide';
          else if (slide.component === InvisibleCrisisSlide) componentName = 'InvisibleCrisisSlide';
          else if (slide.component === BusinessCaseValidationSlide) componentName = 'BusinessCaseValidationSlide';
          else if (slide.component === AwarenessFirstSlide) componentName = 'AwarenessFirstSlide';
          else if (slide.component === SolutionSummarySlide) componentName = 'SolutionSummarySlide';
          else if (slide.component === ScientificFoundationSlide) componentName = 'ScientificFoundationSlide';
          else if (slide.component === PersonalizedApproachSlide) componentName = 'PersonalizedApproachSlide';
          else if (slide.component === FamilyFlywheelSlide1) componentName = 'FamilyFlywheelSlide1';
          else if (slide.component === FamilyFlywheelSlide2) componentName = 'FamilyFlywheelSlide2';
          else if (slide.component === FamilyFlywheelSlide3) componentName = 'FamilyFlywheelSlide3';
          else if (slide.component === LTVExpansionSlide) componentName = 'LTVExpansionSlide';
          else if (slide.component === DataValueSlide) componentName = 'DataValueSlide';
          else if (slide.component === TechnologyStackSlide) componentName = 'TechnologyStackSlide';
          else if (slide.component === CompetitorLandscapeSlide) componentName = 'CompetitorLandscapeSlide';
          else if (slide.component === MarketValidationSlide) componentName = 'MarketValidationSlide';
          else if (slide.component === MarketSummarySlide) componentName = 'MarketSummarySlide';
          else if (slide.component === MarketSizeSlide) componentName = 'MarketSizeSlide';
          else if (slide.component === ProductRoadmapSlide) componentName = 'ProductRoadmapSlide';
          else if (slide.component === InitialTractionSlide) componentName = 'InitialTractionSlide';
          else if (slide.component === TractionSummarySlide) componentName = 'TractionSummarySlide';
          else if (slide.component === TeamAdvisorsSlide) componentName = 'TeamAdvisorsSlide';
          else if (slide.component === FinancialProjectionsSlide) componentName = 'FinancialProjectionsSlide';
          else if (slide.component === NextStepsSlide) componentName = 'NextStepsSlide';
          else if (slide.component === ParentalMentalLoadSlide) componentName = 'ParentalMentalLoadSlide';

          return {
            ...slide,
            component: undefined, // Remove the component reference
            componentName // Add the component name string
          };
        }
        return slide;
      });

      // Convert to JSON string and save to localStorage
      const slidesJSON = JSON.stringify(slidesForStorage);
      localStorage.setItem('investorSlides', slidesJSON);

      console.log(`${slidesForStorage.length} slides saved to localStorage (${(slidesJSON.length / 1024).toFixed(1)}KB)`);
      return true;
    } catch (error) {
      console.error('Error saving slides to localStorage:', error);
      // If there's an error due to localStorage quota exceeded, try to clean up
      if (error.name === 'QuotaExceededError' || error.name === 'QUOTA_EXCEEDED_ERR') {
        alert('Storage quota exceeded. Try clearing some browser data.');
      }
      return false;
    }
  };

  // Context menu for slide operations
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    slideId: null,
    x: 0,
    y: 0
  });

  // Handle context menu open
  const handleContextMenu = (e, slideId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      slideId,
      x: e.clientX,
      y: e.clientY
    });
  };

  // Handle context menu close
  const closeContextMenu = () => {
    setContextMenu({
      visible: false,
      slideId: null,
      x: 0,
      y: 0
    });
  };

  // Handle click outside to close context menu
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        closeContextMenu();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.visible]);

  // Default slides definition
  const defaultSlides = [
      {
        id: 1,
        title: "Opening Impact",
        section: "intro",
        component: null // Custom rendering for title slide
      },
      // Problem Section
      {
        id: 2,
        title: "Problem Summary",
        section: "problem",
        component: ProblemSummarySlide
      },
    {
      id: 3,
      title: "Parental Gap Data",
      section: "problem",
      component: ParentalGapSlide
    },
    {
      id: 4,
      title: "Generational Imbalance Cycle",
      section: "problem",
      component: GenerationalImbalanceSlide
    },
    {
      id: 5,
      title: "Children as Agents of Change",
      section: "problem",
      component: null // Custom breaking the cycle slide
    },
    {
      id: 6,
      title: "The Sibling Advantage",
      section: "problem",
      component: SiblingDynamicsSlide
    },
    {
      id: 7,
      title: "Workload Visualization",
      section: "problem",
      component: WorkloadVisualizationSlide
    },
    {
      id: 8,
      title: "Mental Load Assessment",
      section: "problem",
      component: MentalLoadAssessmentSlide
    },
    {
      id: 9,
      title: "Time Value Analysis",
      section: "problem",
      component: TimeValueAnalysisSlide
    },
    {
      id: 10,
      title: "Relationship Impact",
      section: "problem",
      component: RelationshipImpactSlide
    },
    {
      id: 11,
      title: "Global Crisis Impact",
      section: "problem",
      component: GlobalCrisisImpactSlide
    },
    {
      id: 12,
      title: "Perception Gap",
      section: "problem",
      component: PerceptionGapSlide
    },
    {
      id: 13,
      title: "Demographic Crisis",
      section: "problem",
      component: DemographicCrisisSlide
    },
    {
      id: 14,
      title: "Macro Tailwinds",
      section: "problem",
      component: MacroTailwindsSlide
    },
    {
      id: 15,
      title: "The Invisible Crisis",
      section: "problem",
      component: InvisibleCrisisSlide
    },
    {
      id: 16,
      title: "Business Case Validation",
      section: "problem",
      component: BusinessCaseValidationSlide
    },
    // Solution Section
    {
      id: 17,
      title: "The Power of Awareness",
      section: "solution",
      component: AwarenessFirstSlide
    },
    {
      id: 18,
      title: "Solution Summary",
      section: "solution",
      component: SolutionSummarySlide
    },
    {
      id: 19,
      title: "Scientific Foundation",
      section: "solution",
      component: ScientificFoundationSlide
    },
    {
      id: 20,
      title: "Personalized Approach",
      section: "solution",
      component: PersonalizedApproachSlide
    },
    {
      id: 21,
      title: "Family Flywheel - Trust Layers",
      section: "solution",
      component: FamilyFlywheelSlide1
    },
    {
      id: 22,
      title: "Family Data Graph",
      section: "solution",
      component: FamilyFlywheelSlide2
    },
    {
      id: 23,
      title: "Lifetime Value Model",
      section: "solution",
      component: FamilyFlywheelSlide3
    },
    {
      id: 24,
      title: "LTV Expansion Path",
      section: "solution",
      component: LTVExpansionSlide
    },
    {
      id: 25,
      title: "Data Value",
      section: "solution",
      component: DataValueSlide
    },
    {
      id: 26,
      title: "Technology Stack",
      section: "solution",
      component: TechnologyStackSlide
    },
    // Market Section
    {
      id: 27,
      title: "Competitive Landscape",
      section: "market",
      component: CompetitorLandscapeSlide
    },
    {
      id: 28,
      title: "Market Validation",
      section: "market",
      component: MarketValidationSlide
    },
    {
      id: 29,
      title: "Market Summary",
      section: "market",
      component: MarketSummarySlide
    },
    {
      id: 30,
      title: "Market Size",
      section: "market",
      component: MarketSizeSlide
    },
    // Product & Roadmap Section
    {
      id: 31,
      title: "Product Roadmap",
      section: "roadmap",
      component: ProductRoadmapSlide
    },
    // Traction Section
    {
      id: 32,
      title: "Initial Traction",
      section: "traction",
      component: InitialTractionSlide
    },
    {
      id: 33,
      title: "Traction Summary",
      section: "traction",
      component: TractionSummarySlide
    },
    // Team Section
    {
      id: 34,
      title: "Team & Advisors",
      section: "team",
      component: TeamAdvisorsSlide
    },
    // Financial Section
    {
      id: 35,
      title: "Financial Projections",
      section: "financials",
      component: FinancialProjectionsSlide
    },
    // Conclusion
    {
      id: 36,
      title: "Next Steps",
      section: "conclusion",
      component: NextStepsSlide
    },
    // Understanding Parental Mental Load slide - moved from the end to ensure visibility
    {
      id: 16.5, // This creates a position between slides 16 and 17, with a specific ID we can use in the switch case
      title: "Understanding Parental Mental Load",
      section: "problem", // Keeping it in the problem section
      component: null // Setting to null so we can use custom rendering, which is more reliable
    },
    {
      id: 38,
      title: "Breaking the Cycle: Review",
      section: "conclusion",
      component: null
    }
  ];

  const [slides, setSlides] = useState(loadSlidesFromStorage());

  // Update document title based on current slide
  useEffect(() => {
    const currentSlideObj = slides.find(s => s.id === currentSlide);
    document.title = currentSlideObj ? 
      `Slide ${currentSlide}: ${currentSlideObj.title}` : 
      'Investor Presentation';
  }, [currentSlide, slides]);

  // Navigation functions
  const goToNextSlide = () => {
    if (currentSlide < slides.length) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const goToPreviousSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const goToSlide = (slideNumber) => {
    if (slideNumber >= 1 && slideNumber <= slides.length) {
      setCurrentSlide(slideNumber);
      setShowSlideMenu(false);
    }
  };

  // Add a save message display
  const [saveMessage, setSaveMessage] = useState('');

  // Function to restore essential slides if they're missing
  const ensureEssentialSlidesExist = (currentSlides) => {
    let updatedSlides = [...currentSlides];
    let madeChanges = false;

    // Check if slide with id=1 exists
    const hasFirstSlide = updatedSlides.some(slide => slide.id === 1);
    if (!hasFirstSlide) {
      // First slide is missing, add it back from the default slides
      const firstSlide = defaultSlides.find(slide => slide.id === 1);
      if (firstSlide) {
        updatedSlides = [firstSlide, ...updatedSlides];
        madeChanges = true;
      }
    }

    // Check if the mental load slide (id=16.5) exists
    const hasMentalLoadSlide = updatedSlides.some(slide => slide.id === 16.5);
    if (!hasMentalLoadSlide) {
      // Mental load slide is missing, add it back
      const mentalLoadSlide = defaultSlides.find(slide => slide.id === 16.5);
      if (mentalLoadSlide) {
        // Find the right position to insert it - after slide 16 if exists, or at the end
        const slide16Index = updatedSlides.findIndex(s => s.id === 16);
        if (slide16Index !== -1) {
          updatedSlides = [
            ...updatedSlides.slice(0, slide16Index + 1),
            mentalLoadSlide,
            ...updatedSlides.slice(slide16Index + 1)
          ];
        } else {
          updatedSlides.push(mentalLoadSlide);
        }
        madeChanges = true;
      }
    }

    // If we made changes, update state and save
    if (madeChanges) {
      setSlides(updatedSlides);
      saveSlides(updatedSlides);
    }

    return updatedSlides;
  };

  // Save slides to localStorage when the component mounts to ensure they're preserved
  useEffect(() => {
    const initialSave = () => {
      // Ensure essential slides exist before saving
      const checkedSlides = ensureEssentialSlidesExist(slides);
      saveSlides(checkedSlides);
      console.log('Initial slides saved to localStorage');
    };

    // Use a slight delay to make sure slides are fully loaded
    const timer = setTimeout(initialSave, 500);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowRight' || event.key === ' ') {
        goToNextSlide();
      } else if (event.key === 'ArrowLeft') {
        goToPreviousSlide();
      } else if (event.key >= '1' && event.key <= '9') {
        // Direct slide access for slides 1-9 using number keys
        const num = parseInt(event.key, 10);
        if (num >= 0 && num <= slides.length) {
          goToSlide(num);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentSlide, slides.length]);

  // PowerPoint-like slide management functions
  const addSlideAfter = (afterId) => {
    const newSlideId = Math.max(...slides.map(s => s.id)) + 1;
    const insertIndex = slides.findIndex(s => s.id === afterId) + 1;
    
    const newSlide = {
      id: newSlideId,
      title: `New Slide ${newSlideId}`,
      section: slides[insertIndex-1].section, // Use same section as previous slide
      component: null // Empty slide initially
    };
    
    const updatedSlides = [
      ...slides.slice(0, insertIndex),
      newSlide,
      ...slides.slice(insertIndex)
    ];

    setSlides(updatedSlides);
    saveSlides(updatedSlides);
    setCurrentSlide(newSlideId);
  };

  const deleteSlide = (slideId) => {
    if (slides.length <= 1) {
      alert("Cannot delete the only slide.");
      return;
    }

    // Always show confirmation dialog before deleting
    const isConfirmed = window.confirm(`Are you sure you want to delete slide #${slideId}? This action cannot be undone.`);
    if (!isConfirmed) {
      return; // User cancelled the delete operation
    }

    // Special protection for the opening slide (slide 1)
    if (slideId === 1) {
      const doubleConfirm = window.confirm("WARNING: You're about to delete the opening slide. This is usually not recommended. Are you absolutely sure?");
      if (!doubleConfirm) {
        return; // User cancelled the deletion of the important slide
      }
    }

    const slideIndex = slides.findIndex(s => s.id === slideId);
    const updatedSlides = slides.filter(s => s.id !== slideId);

    setSlides(updatedSlides);
    saveSlides(updatedSlides);

    // Navigate to next or previous slide if current slide is deleted
    if (currentSlide === slideId) {
      const newIndex = Math.min(slideIndex, updatedSlides.length - 1);
      setCurrentSlide(updatedSlides[newIndex].id);
    }
  };

  const updateSlideTitle = (slideId, newTitle) => {
    const updatedSlides = slides.map(slide =>
      slide.id === slideId ? { ...slide, title: newTitle } : slide
    );
    setSlides(updatedSlides);
    saveSlides(updatedSlides);
  };
  
  const moveSlide = (slideId, direction) => {
    const slideIndex = slides.findIndex(s => s.id === slideId);
    if ((direction === 'up' && slideIndex === 0) ||
        (direction === 'down' && slideIndex === slides.length - 1)) {
      return; // Cannot move beyond boundaries
    }

    const newIndex = direction === 'up' ? slideIndex - 1 : slideIndex + 1;
    const updatedSlides = [...slides];
    const [movedSlide] = updatedSlides.splice(slideIndex, 1);
    updatedSlides.splice(newIndex, 0, movedSlide);

    setSlides(updatedSlides);
    saveSlides(updatedSlides);
  };

  // Move slide to appendix section
  const moveToAppendix = (slideId) => {
    const updatedSlides = slides.map(slide =>
      slide.id === slideId ? { ...slide, section: 'appendix' } : slide
    );
    setSlides(updatedSlides);
    saveSlides(updatedSlides);
  };

  // Add an empty slide to appendix
  const addEmptyAppendixSlide = () => {
    const newSlideId = Math.max(...slides.map(s => s.id)) + 1;
    const newSlide = {
      id: newSlideId,
      title: `Appendix Slide ${newSlideId}`,
      section: 'appendix',
      component: null // Empty slide
    };

    const updatedSlides = [...slides, newSlide];
    setSlides(updatedSlides);
    saveSlides(updatedSlides);
    setCurrentSlide(newSlideId);
  };

  // Drag and drop handlers
  const handleDragStart = (e, slide) => {
    setDraggedSlide(slide);
    e.dataTransfer.effectAllowed = 'move';
    // Add a subtle transparency to the dragged element
    setTimeout(() => {
      e.target.style.opacity = '0.6';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    e.target.style.transform = 'none';

    // Clean up any drag-over styles that might remain
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });

    // Reset the dragged slide state
    setDraggedSlide(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
  };

  const handleDrop = (e, targetSlide) => {
    e.preventDefault();

    // Remove any lingering drag-over styles
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });

    if (!draggedSlide || draggedSlide.id === targetSlide.id) {
      return;
    }

    const updatedSlides = [...slides];
    const sourceIndex = updatedSlides.findIndex(s => s.id === draggedSlide.id);
    const targetIndex = updatedSlides.findIndex(s => s.id === targetSlide.id);

    // Get a copy of the dragged slide
    const draggedSlideObj = {...updatedSlides[sourceIndex]};

    // Determine what section this slide should now belong to
    // Use the target slide's section to allow cross-section movement
    draggedSlideObj.section = targetSlide.section;

    // Remove the source slide
    updatedSlides.splice(sourceIndex, 1);

    // Insert at target position
    updatedSlides.splice(targetIndex, 0, draggedSlideObj);

    // Reassign slide IDs to maintain sequential numbering
    // We do this in a separate loop to ensure all slides are properly numbered
    const reorderedSlides = updatedSlides.map((slide, index) => ({
      ...slide,
      id: index + 1
    }));

    setSlides(reorderedSlides);

    // Save the updated slides to localStorage
    saveSlides(reorderedSlides);

    // Update current slide if it was affected
    if (currentSlide === draggedSlide.id) {
      setCurrentSlide(targetIndex + 1);
    } else if (currentSlide > sourceIndex && currentSlide <= targetIndex) {
      setCurrentSlide(currentSlide - 1);
    } else if (currentSlide < sourceIndex && currentSlide >= targetIndex) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleDragEnter = (e) => {
    // Ensure we're targeting the correct element
    const target = e.currentTarget;
    if (target) {
      // Remove any existing drag-over styles first
      document.querySelectorAll('.drag-over').forEach(el => {
        if (el !== target) el.classList.remove('drag-over');
      });
      target.classList.add('drag-over');
    }
  };

  const handleDragLeave = (e) => {
    const target = e.currentTarget;
    if (target) {
      target.classList.remove('drag-over');
    }
  };

  // Filtered slides for search
  const filteredSlides = slideSearch
    ? slides.filter(slide => 
        slide.title.toLowerCase().includes(slideSearch.toLowerCase()) ||
        slide.id.toString().includes(slideSearch)
      )
    : slides;

  // Get section title
  const getSectionTitle = (section) => {
    switch(section) {
      case 'intro': return 'Introduction';
      case 'problem': return 'Problem Statement';
      case 'solution': return 'Our Solution';
      case 'market': return 'Market Analysis';
      case 'traction': return 'Traction & Growth';
      case 'team': return 'Team & Advisors';
      case 'financials': return 'Financial Projections';
      case 'conclusion': return 'Conclusion';
      case 'appendix': return 'Appendix';
      default: return 'Other';
    }
  };

  // Group slides by section for the sidebar
  const slidesBySection = slides.reduce((acc, slide) => {
    const section = slide.section || 'other';
    if (!acc[section]) acc[section] = [];
    acc[section].push(slide);
    return acc;
  }, {});

  // Render the current slide
  const renderCurrentSlide = () => {
    const slide = slides.find(s => s.id === currentSlide);
    
    if (!slide) {
      return <div className="flex items-center justify-center h-full">Slide not found</div>;
    }
    
    // Title slide (special case)
    if (currentSlide === 1) {
      return (
        <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-0">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-light mb-6 text-purple-600 text-center">ALLIE</h2>

            <div className="mb-12">
              <h3 className="text-xl font-medium mb-8 text-center">The AI-powered mental load solution</h3>

              {/* Key Message/Quote */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-8 rounded-xl mb-12 border border-purple-100">
                <blockquote className="text-2xl font-light italic leading-relaxed text-gray-800">
                  "The greatest burden families face isn't visible until it's gone. <span className="text-purple-600 font-medium">We've made it visible.</span>"
                </blockquote>
                <div className="mt-4 text-right text-gray-500">
                  — Kimberly Palsson, CEO
                </div>
              </div>

              {/* Allie Personality Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 mb-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="flex-shrink-0 bg-purple-100 rounded-full p-6">
                    <Heart className="h-12 w-12 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-3 text-purple-700">Meet Allie</h3>
                    <p className="text-gray-700 mb-3">
                      Allie is your family's trusted third partner who brings awareness by making the invisible visible.
                      She picks up the loose ends of parenting that often fall through the cracks,
                      understanding your unique family needs and patterns.
                    </p>
                    <p className="text-gray-700">
                      By creating transparency and balance between parents, Allie brings back the joy of
                      family time—turning administrative burdens into meaningful moments that matter.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-start">
                    <div className="mr-3 flex-shrink-0 bg-purple-100 p-2 rounded-full">
                      <Check size={16} className="text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-700">Transforms family coordination from a burden to a seamless experience</p>
                  </div>
                  <div className="flex items-start">
                    <div className="mr-3 flex-shrink-0 bg-purple-100 p-2 rounded-full">
                      <Check size={16} className="text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-700">Creates a shared understanding between parents without blame</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Opportunity Box */}
            <div className="bg-purple-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-4 text-center">Our Opportunity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="text-3xl font-bold mb-1">$42B</div>
                  <div className="text-sm opacity-90">family management market growing at 17% annually</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">94%</div>
                  <div className="text-sm opacity-90">of millennial parents actively seeking mental load solutions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">3-5yr</div>
                  <div className="text-sm opacity-90">technology advantage through our proprietary AI approach</div>
                </div>
              </div>
            </div>

            {/* Footnotes */}
            <div className="text-xs text-gray-500 mt-8 text-right">
              <div>May 2025 • Investor Presentation</div>
            </div>
          </div>
        </div>
      );
    }
    
    // For component-based slides
    if (slide.component) {
      const SlideComponent = slide.component;
      return (
        <div className="relative">
          <div className="absolute top-4 left-4 bg-indigo-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-md z-50">
            {slide.id}
          </div>
          <SlideComponent />
        </div>
      );
    }
    
    // For custom slides (without specific components)
    // Render different content based on slide id
    switch(slide.id) {
      case 3: // Understanding Parental Mental Load (in position 3 according to UI)
        return (
          <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-light mb-6">Understanding Parental Mental Load</h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium">The Invisible Component</h3>
                  </div>

                  <p className="text-gray-700 mb-4">
                    The invisible mental load encompasses the cognitive and emotional labor that powers
                    family life but remains largely unseen. This mental burden disproportionately
                    falls on one parent, typically without recognition.
                  </p>

                  <div className="bg-purple-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium mb-2">Key Characteristics</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="mr-2 text-purple-600">•</div>
                        <p className="text-sm">Happens inside one's head—invisible to others</p>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 text-purple-600">•</div>
                        <p className="text-sm">Continuous with no clear start or finish</p>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 text-purple-600">•</div>
                        <p className="text-sm">Difficult to measure or delegate</p>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 text-purple-600">•</div>
                        <p className="text-sm">Rarely acknowledged as "real work"</p>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-xl font-medium mb-3">The 4 Types of Mental Load</h3>

                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Anticipatory Load</h4>
                          <p className="text-sm text-gray-700">
                            The constant work of forecasting future needs and planning ahead
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Monitoring Load</h4>
                          <p className="text-sm text-gray-700">
                            Tracking numerous details, schedules, and requirements
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-yellow-100 p-2 rounded-full mr-3 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Communication Load</h4>
                          <p className="text-sm text-gray-700">
                            Effort required to coordinate between family members, school, and others
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-pink-100 p-2 rounded-full mr-3 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Emotional Load</h4>
                          <p className="text-sm text-gray-700">
                            Maintaining family well-being, processing emotions, and preserving relationships
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black p-5 rounded-lg text-white">
                    <h3 className="text-xl font-medium mb-3">The Impact of Unseen Labor</h3>
                    <p className="text-gray-300 mb-4">
                      The invisible mental load creates significant economic and quality-of-life costs for families:
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-2xl font-semibold">23.4</p>
                        <p className="text-xs text-gray-400">hours/week spent on mental load</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">68%</p>
                        <p className="text-xs text-gray-400">of carriers report burnout</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">$12K+</p>
                        <p className="text-xs text-gray-400">annual value of this labor</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-6 rounded-lg">
                <h3 className="text-xl font-medium mb-4">The Allie Advantage</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                    <h4 className="font-medium text-center mb-2">Visibility</h4>
                    <p className="text-sm text-center">
                      Allie makes the invisible visible by quantifying, tracking, and displaying mental load in real-time
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                    <h4 className="font-medium text-center mb-2">Distribution</h4>
                    <p className="text-sm text-center">
                      Creates fair workload sharing through automated task allocation and reminders
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                    <h4 className="font-medium text-center mb-2">Optimization</h4>
                    <p className="text-sm text-center">
                      Identifies redundancies and provides intelligent automation to reduce overall family burden
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5: // Children as Agents of Change - This is slide #5 in the code but might appear differently in the browser
        return (
          <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-light mb-6">Breaking the Cycle: Children as Agents of Change</h2>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Left column */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-xl font-medium mb-3">Children Help Parents vs Doing More Chores</h3>
                    <p className="text-gray-700 mb-3">
                      Our research shows that while getting children to do more chores themselves is difficult,
                      getting them to help parents with existing chores is substantially easier and more effective.
                    </p>
                    <div className="bg-indigo-50 p-3 rounded">
                      <p className="text-sm text-indigo-700">
                        <strong>Key insight:</strong> Children are more engaged when they feel like
                        collaborative partners rather than assigned task-takers.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-xl font-medium mb-3">Breaking the Generational Problem</h3>
                    <p className="text-gray-700 mb-3">
                      By involving children in workload awareness, we're addressing both today's imbalance
                      and tomorrow's expectations. Children who participate in family equity are 3.8× more
                      likely to create balanced partnerships as adults.
                    </p>
                    <div className="flex items-center text-green-700 mt-4">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <p className="text-sm">Creates immediate impact with long-term generational effects</p>
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-xl font-medium mb-3">Beta Test Success: Kids Love to Grade Parents</h3>
                    <p className="text-gray-700 mb-3">
                      Our beta testing revealed a surprising insight: children's <span className="font-semibold">favorite feature</span>
                      was the ability to grade and survey their parents on household tasks and responsibilities.
                    </p>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-sm text-purple-700">
                        <strong>Beta test feedback:</strong> "My kids are actually reminding ME to log tasks
                        in Allie because they love giving me feedback scores!"
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="bg-purple-100 p-2 rounded text-center">
                        <p className="text-xs font-medium text-purple-700">89% Engagement</p>
                      </div>
                      <div className="bg-blue-100 p-2 rounded text-center">
                        <p className="text-xs font-medium text-blue-700">Top Kid Feature</p>
                      </div>
                      <div className="bg-pink-100 p-2 rounded text-center">
                        <p className="text-xs font-medium text-pink-700">42% More Awareness</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black p-5 rounded-lg text-white">
                    <h3 className="text-xl font-medium mb-3">Building Stronger Family Units</h3>
                    <p className="text-gray-300 mb-4">
                      Working together as a family to understand and balance parental load creates
                      more cohesive family units. Our data shows families experience:
                    </p>
                    <div className="flex justify-between text-center">
                      <div>
                        <p className="text-2xl font-semibold">67%</p>
                        <p className="text-xs text-gray-400">increased family satisfaction</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">53%</p>
                        <p className="text-xs text-gray-400">more quality time together</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">71%</p>
                        <p className="text-xs text-gray-400">better family communication</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-2">Our Family Transformation Thesis</h3>
                <p>
                  By making children active participants rather than passive observers, we transform family dynamics
                  today while simultaneously reshaping expectations for the next generation. Children don't just
                  inherit balanced households—they help create them.
                </p>
              </div>
            </div>
          </div>
        );

      case 9: // Adding a case for slide #9 if that's what's showing in the browser
        return (
          <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-light mb-6">Children as Agents of Change</h2>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Left column */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-xl font-medium mb-3">Children Help Parents vs Doing More Chores</h3>
                    <p className="text-gray-700 mb-3">
                      Our research shows that while getting children to do more chores themselves is difficult,
                      getting them to help parents with existing chores is substantially easier and more effective.
                    </p>
                    <div className="bg-indigo-50 p-3 rounded">
                      <p className="text-sm text-indigo-700">
                        <strong>Key insight:</strong> Children are more engaged when they feel like
                        collaborative partners rather than assigned task-takers.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-xl font-medium mb-3">Breaking the Generational Problem</h3>
                    <p className="text-gray-700 mb-3">
                      By involving children in workload awareness, we're addressing both today's imbalance
                      and tomorrow's expectations. Children who participate in family equity are 3.8× more
                      likely to create balanced partnerships as adults.
                    </p>
                    <div className="flex items-center text-green-700 mt-4">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <p className="text-sm">Creates immediate impact with long-term generational effects</p>
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-xl font-medium mb-3">Beta Test Success: Kids Love to Grade Parents</h3>
                    <p className="text-gray-700 mb-3">
                      Our beta testing revealed a surprising insight: children's <span className="font-semibold">favorite feature</span>
                      was the ability to grade and survey their parents on household tasks and responsibilities.
                    </p>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-sm text-purple-700">
                        <strong>Beta test feedback:</strong> "My kids are actually reminding ME to log tasks
                        in Allie because they love giving me feedback scores!"
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      <div className="bg-purple-100 p-2 rounded text-center">
                        <p className="text-xs font-medium text-purple-700">89% Engagement</p>
                      </div>
                      <div className="bg-blue-100 p-2 rounded text-center">
                        <p className="text-xs font-medium text-blue-700">Top Kid Feature</p>
                      </div>
                      <div className="bg-pink-100 p-2 rounded text-center">
                        <p className="text-xs font-medium text-pink-700">42% More Awareness</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black p-5 rounded-lg text-white">
                    <h3 className="text-xl font-medium mb-3">Building Stronger Family Units</h3>
                    <p className="text-gray-300 mb-4">
                      Working together as a family to understand and balance parental load creates
                      more cohesive family units. Our data shows families experience:
                    </p>
                    <div className="flex justify-between text-center">
                      <div>
                        <p className="text-2xl font-semibold">67%</p>
                        <p className="text-xs text-gray-400">increased family satisfaction</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">53%</p>
                        <p className="text-xs text-gray-400">more quality time together</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">71%</p>
                        <p className="text-xs text-gray-400">better family communication</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-2">Our Family Transformation Thesis</h3>
                <p>
                  By making children active participants rather than passive observers, we transform family dynamics
                  today while simultaneously reshaping expectations for the next generation. Children don't just
                  inherit balanced households—they help create them.
                </p>
              </div>
            </div>
          </div>
        );

      case 16.5: // Understanding Parental Mental Load (positioned right after the problem section)
        return (
          <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-light mb-6">Understanding Parental Mental Load</h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                        <line x1="7" y1="7" x2="7.01" y2="7"></line>
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium">The Invisible Component</h3>
                  </div>

                  <p className="text-gray-700 mb-4">
                    The invisible mental load encompasses the cognitive and emotional labor that powers
                    family life but remains largely unseen. This mental burden disproportionately
                    falls on one parent, typically without recognition.
                  </p>

                  <div className="bg-purple-50 p-4 rounded-lg mb-4">
                    <h4 className="font-medium mb-2">Key Characteristics</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="mr-2 text-purple-600">•</div>
                        <p className="text-sm">Happens inside one's head—invisible to others</p>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 text-purple-600">•</div>
                        <p className="text-sm">Continuous with no clear start or finish</p>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 text-purple-600">•</div>
                        <p className="text-sm">Difficult to measure or delegate</p>
                      </li>
                      <li className="flex items-start">
                        <div className="mr-2 text-purple-600">•</div>
                        <p className="text-sm">Rarely acknowledged as "real work"</p>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-lg shadow-sm">
                    <h3 className="text-xl font-medium mb-3">The 4 Types of Mental Load</h3>

                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Anticipatory Load</h4>
                          <p className="text-sm text-gray-700">
                            The constant work of forecasting future needs and planning ahead
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-green-100 p-2 rounded-full mr-3 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Monitoring Load</h4>
                          <p className="text-sm text-gray-700">
                            Tracking numerous details, schedules, and requirements
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-yellow-100 p-2 rounded-full mr-3 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Communication Load</h4>
                          <p className="text-sm text-gray-700">
                            Effort required to coordinate between family members, school, and others
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start">
                        <div className="bg-pink-100 p-2 rounded-full mr-3 flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-600">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium mb-1">Emotional Load</h4>
                          <p className="text-sm text-gray-700">
                            Maintaining family well-being, processing emotions, and preserving relationships
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black p-5 rounded-lg text-white">
                    <h3 className="text-xl font-medium mb-3">The Impact of Unseen Labor</h3>
                    <p className="text-gray-300 mb-4">
                      The invisible mental load creates significant economic and quality-of-life costs for families:
                    </p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-2xl font-semibold">23.4</p>
                        <p className="text-xs text-gray-400">hours/week spent on mental load</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">68%</p>
                        <p className="text-xs text-gray-400">of carriers report burnout</p>
                      </div>
                      <div>
                        <p className="text-2xl font-semibold">$12K+</p>
                        <p className="text-xs text-gray-400">annual value of this labor</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-6 rounded-lg">
                <h3 className="text-xl font-medium mb-4">The Allie Advantage</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                    <h4 className="font-medium text-center mb-2">Visibility</h4>
                    <p className="text-sm text-center">
                      Allie makes the invisible visible by quantifying, tracking, and displaying mental load in real-time
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                    <h4 className="font-medium text-center mb-2">Distribution</h4>
                    <p className="text-sm text-center">
                      Creates fair workload sharing through automated task allocation and reminders
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                    <h4 className="font-medium text-center mb-2">Optimization</h4>
                    <p className="text-sm text-center">
                      Identifies redundancies and provides intelligent automation to reduce overall family burden
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 38: // Breaking the Cycle: Review
        return (
          <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-light mb-6">Breaking the Cycle: Review</h2>

              <div className="bg-gradient-to-r from-purple-700 to-indigo-700 text-white p-6 rounded-lg mb-8">
                <h3 className="text-xl font-medium mb-4 text-center">Key Takeaways</h3>
                <p className="mb-6 text-center">
                  Allie transforms family dynamics by addressing parental mental load imbalance through visibility,
                  communication, and collaborative solutions that involve all family members.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-purple-600">Problem</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="text-purple-600 mr-2">•</div>
                      <p className="text-sm text-gray-700">Mental load remains largely invisible, creating relationship strain</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-purple-600 mr-2">•</div>
                      <p className="text-sm text-gray-700">Anticipatory, monitoring, communication and emotional labor are unevenly distributed</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-purple-600 mr-2">•</div>
                      <p className="text-sm text-gray-700">Children inherit unbalanced models, perpetuating the cycle</p>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-green-600">Solution</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="text-green-600 mr-2">•</div>
                      <p className="text-sm text-gray-700">Allie makes invisible mental load visible and measurable</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-green-600 mr-2">•</div>
                      <p className="text-sm text-gray-700">Distribution systems create equitable sharing of all labor types</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-green-600 mr-2">•</div>
                      <p className="text-sm text-gray-700">Children become part of the solution through age-appropriate engagement</p>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-3 text-blue-600">Impact</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="text-blue-600 mr-2">•</div>
                      <p className="text-sm text-gray-700">67% increase in family satisfaction and relationship quality</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-blue-600 mr-2">•</div>
                      <p className="text-sm text-gray-700">23.4 hours per week reclaimed from unnecessary mental load</p>
                    </li>
                    <li className="flex items-start">
                      <div className="text-blue-600 mr-2">•</div>
                      <p className="text-sm text-gray-700">Next generation inherits balanced models of family responsibility</p>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 text-center">
                <h3 className="text-xl font-medium mb-4">Join us in transforming family dynamics</h3>
                <p className="text-gray-700 max-w-3xl mx-auto">
                  With Allie, we're not just improving today's families—we're reshaping expectations for
                  the next generation. Our solution creates sustainable balance that works for each family's
                  unique situation while building a foundation for lasting cultural change.
                </p>
              </div>
            </div>
          </div>
        );

      case 10: // Relationship Impact
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

      // For other slides without specific components (placeholder)
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[80vh] p-8">
            <h2 className="text-3xl font-light mb-8">{slide.title}</h2>
            <div className="bg-gray-100 p-8 rounded-lg max-w-2xl w-full text-center">
              <p className="text-gray-500">This is a placeholder for slide #{slide.id}</p>
              <p className="text-gray-400 text-sm mt-4">
                Edit this slide through Claude by requesting to add content to Slide #{slide.id}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: dragDropStyles }} />

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed bg-white shadow-lg rounded-md border border-gray-200 py-1 z-50"
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
            onClick={() => {
              moveToAppendix(contextMenu.slideId);
              closeContextMenu();
            }}
          >
            <span className="mr-2 text-gray-500">+</span>
            Move to Appendix
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
            onClick={() => {
              const slideObj = slides.find(s => s.id === contextMenu.slideId);
              if (slideObj) {
                const newTitle = prompt('Enter new title:', slideObj.title);
                if (newTitle && newTitle.trim() !== '') {
                  updateSlideTitle(contextMenu.slideId, newTitle.trim());
                }
              }
              closeContextMenu();
            }}
          >
            <span className="mr-2 text-gray-500">✎</span>
            Rename
          </button>
          <button
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600 flex items-center"
            onClick={() => {
              deleteSlide(contextMenu.slideId); // This now has its own confirmation logic
              closeContextMenu();
            }}
          >
            <span className="mr-2">×</span>
            Delete
          </button>
        </div>
      )}
      {/* Sidebar with slide thumbnails */}
      {sidebarOpen && (
        <div className="w-64 bg-white shadow-md flex-shrink-0 h-full overflow-y-auto z-20">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium">Slide Navigator</h2>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={18} />
              </button>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search slides..." 
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={slideSearch}
                onChange={(e) => setSlideSearch(e.target.value)}
              />
              {slideSearch && (
                <button 
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setSlideSearch('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
          
          <div className="p-4">
            {Object.entries(slidesBySection).map(([section, sectionSlides]) => (
              <div key={section} className="mb-4">
                <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
                  {getSectionTitle(section)}
                </h3>
                <div className="space-y-1">
                  {sectionSlides.map(slide => (
                    <div
                      key={slide.id}
                      className={`flex items-center p-2 rounded-md slide-card ${
                        currentSlide === slide.id ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-100'
                      } ${draggedSlide?.id === slide.id ? 'opacity-60' : ''} transition-all relative`}
                      onClick={() => goToSlide(slide.id)}
                      onContextMenu={(e) => handleContextMenu(e, slide.id)}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, slide)}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragEnter}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, slide)}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center mr-2 text-xs font-medium">
                        {slide.id}
                      </div>
                      <span className="text-sm truncate">{slide.title}</span>

                      {/* Small menu icon */}
                      <button
                        className="ml-auto text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 focus:outline-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContextMenu(e, slide.id);
                        }}
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white shadow-sm p-4 flex items-center justify-between z-10">
          {!sidebarOpen && (
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <Menu size={20} />
            </button>
          )}
          
          <div className="flex items-center">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-md hover:bg-gray-100 mr-2"
              title="Home"
            >
              <Home size={20} />
            </button>

            <button
              onClick={() => {
                // Find the mental load slide and navigate to it
                const mentalLoadSlide = slides.find(slide => slide.id === 16.5);
                if (mentalLoadSlide) {
                  setCurrentSlide(16.5);
                  setSaveMessage('Navigated to Mental Load slide');
                  setTimeout(() => setSaveMessage(''), 2000);
                } else {
                  alert("Mental Load slide not found. Try using the Reset button to restore all slides.");
                }
              }}
              className="p-2 rounded-md hover:bg-purple-100 mr-2 flex items-center"
              title="Go to Mental Load Slide"
            >
              <Brain size={18} className="text-purple-600 mr-1" />
              <span className="text-sm">Mental Load</span>
            </button>

            <button
              onClick={() => {
                saveSlides(slides);
                setSaveMessage('Slides saved!');
                setTimeout(() => setSaveMessage(''), 2000);
              }}
              className="p-2 rounded-md hover:bg-green-100 mr-2 flex items-center"
              title="Save slides"
            >
              <Save size={18} className="text-green-600 mr-1" />
              <span className="text-sm">Save</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to reset all slides to default? This will discard any custom changes.")) {
                  setSlides(defaultSlides);
                  saveSlides(defaultSlides);
                  setSaveMessage('Reset to defaults!');
                  setTimeout(() => setSaveMessage(''), 2000);
                  // Also reset the current slide to 1
                  setCurrentSlide(1);
                }
              }}
              className="p-2 rounded-md hover:bg-red-100 mr-2 flex items-center"
              title="Reset to default slides"
            >
              <RefreshCw size={18} className="text-red-600 mr-1" />
              <span className="text-sm">Reset</span>
            </button>

            <button
              onClick={() => {
                // Create a new window for printing
                const printWindow = window.open('', '_blank');

                // Start building the HTML content
                let printContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Allie Investor Presentation - All Slides</title>
                  <style>
                    body {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
                      color: #333;
                      line-height: 1.5;
                      margin: 0;
                      padding: 40px;
                      background-color: #f5f7fa;
                    }
                    h1, h2, h3, h4, h5, h6 {
                      margin-top: 0;
                      font-weight: 400;
                      color: #1f2937;
                    }
                    .slide {
                      padding: 30px;
                      margin-bottom: 30px;
                      background: white;
                      border-radius: 10px;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                      position: relative;
                      overflow: hidden;
                      border: 1px solid #eaecef;
                    }
                    .slide-number {
                      position: absolute;
                      top: 20px;
                      right: 20px;
                      background: #6366f1;
                      color: white;
                      font-weight: bold;
                      padding: 8px 16px;
                      border-radius: 20px;
                      box-shadow: 0 2px 6px rgba(99,102,241,0.3);
                      font-size: 16px;
                    }
                    .slide-title {
                      font-size: 28px;
                      margin-bottom: 30px;
                      font-weight: 300;
                      color: #1f2937;
                      padding-bottom: 12px;
                      border-bottom: 1px solid #eaecef;
                    }
                    .section-title {
                      background: linear-gradient(to right, #f9fafb, #f3f4f6);
                      padding: 15px 30px;
                      margin: 40px 0 20px;
                      font-size: 20px;
                      font-weight: 500;
                      border-left: 5px solid #6366f1;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                      border-radius: 0 8px 8px 0;
                      color: #4b5563;
                    }
                    h1 {
                      text-align: center;
                      margin-bottom: 50px;
                      font-size: 36px;
                      font-weight: 300;
                      color: #6366f1;
                      letter-spacing: -0.5px;
                    }
                    .print-button {
                      position: fixed;
                      top: 30px;
                      right: 30px;
                      background: #6366f1;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      font-size: 16px;
                      cursor: pointer;
                      border-radius: 6px;
                      z-index: 1000;
                      box-shadow: 0 4px 12px rgba(99,102,241,0.2);
                      transition: all 0.3s ease;
                      font-weight: 500;
                    }
                    .print-button:hover {
                      background: #4f46e5;
                      transform: translateY(-2px);
                      box-shadow: 0 6px 16px rgba(79,70,229,0.3);
                    }
                    .grid {
                      display: grid;
                      grid-template-columns: repeat(2, 1fr);
                      gap: 25px;
                    }
                    .box, .card {
                      padding: 25px;
                      background: #f9fafb;
                      border-radius: 8px;
                      margin-bottom: 20px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                      border: 1px solid #eaecef;
                    }
                    .highlight-box {
                      background: linear-gradient(135deg, #6366f1, #8b5cf6);
                      color: white;
                      padding: 25px;
                      border-radius: 8px;
                      margin: 30px 0;
                      box-shadow: 0 4px 12px rgba(139,92,246,0.2);
                    }
                    ul, ol {
                      padding-left: 25px;
                    }
                    li {
                      margin-bottom: 8px;
                    }
                    strong {
                      font-weight: 600;
                    }
                    blockquote {
                      border-left: 4px solid #6366f1;
                      margin-left: 0;
                      padding-left: 20px;
                      font-style: italic;
                      color: #4b5563;
                    }
                    @media print {
                      @page {
                        margin: 1cm;
                        size: auto;
                      }
                      body {
                        padding: 0;
                        background: white;
                      }
                      .print-button, .no-print {
                        display: none !important;
                      }
                      .slide {
                        box-shadow: none;
                        margin-bottom: 30px;
                        border: 1px solid #eaecef;
                        page-break-inside: avoid;
                      }
                      .section-title {
                        background: #f9fafb;
                        box-shadow: none;
                        page-break-before: auto;
                        page-break-inside: avoid;
                      }
                    }
                  </style>
                </head>
                <body>
                  <div style="text-align: center; margin-bottom: 30px;" class="no-print">
                    <button class="print-button" onclick="window.print()">Print to PDF</button>
                    <h1>Allie Investor Presentation</h1>
                    <p style="max-width: 800px; margin: 0 auto 30px; color: #6b7280;">All slides are displayed on this single page for easy viewing and printing. Use your browser's Print function or the button above to save as PDF.</p>
                  </div>
                `;

                // Add all slides to the print content
                let currentSection = '';

                slides.forEach((slide, index) => {
                  // If this is a new section, add a section header
                  if (slide.section !== currentSection) {
                    currentSection = slide.section;
                    printContent += `
                      <div class="section-title">
                        ${getSectionTitle(currentSection)}
                      </div>
                    `;
                  }

                  // Add the slide content
                  printContent += `
                    <div class="slide">
                      <div class="slide-number">${slide.id}</div>
                      <h2 class="slide-title">${slide.title}</h2>
                      <div class="slide-content">
                        ${
                          // Generate specific content based on slide ID
                          slide.id === 1 ? `
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                <h3 style="margin-top: 0;">The AI-powered mental load solution</h3>
                                <blockquote style="font-style: italic; color: #6366f1; font-size: 18px; margin: 20px 0; padding-left: 20px; border-left: 4px solid #6366f1;">
                                  "The greatest burden families face isn't visible until it's gone. <strong>We've made it visible.</strong>"
                                </blockquote>
                                <div style="text-align: right; font-size: 14px; color: #666;">— Kimberly Palsson, CEO</div>
                              </div>

                              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                <h3 style="margin-top: 0;">Meet Allie</h3>
                                <p>
                                  Allie is your family's trusted third partner who brings awareness by making the invisible visible.
                                  She picks up the loose ends of parenting that often fall through the cracks,
                                  understanding your unique family needs and patterns.
                                </p>
                              </div>
                            </div>

                            <div style="background: linear-gradient(to right, #6366f1, #8b5cf6); color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                              <h3 style="margin-top: 0; text-align: center;">Our Opportunity</h3>
                              <div style="display: flex; justify-content: space-between; text-align: center;">
                                <div>
                                  <div style="font-size: 24px; font-weight: bold;">$42B</div>
                                  <div style="font-size: 14px;">family management market</div>
                                </div>
                                <div>
                                  <div style="font-size: 24px; font-weight: bold;">94%</div>
                                  <div style="font-size: 14px;">of millennial parents seeking solutions</div>
                                </div>
                                <div>
                                  <div style="font-size: 24px; font-weight: bold;">3-5yr</div>
                                  <div style="font-size: 14px;">technology advantage</div>
                                </div>
                              </div>
                            </div>
                          ` :

                          slide.id === 3 ? `
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                              <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                <h3 style="margin-top: 0;">The Invisible Component</h3>
                                <p>
                                  The invisible mental load encompasses the cognitive and emotional labor that powers
                                  family life but remains largely unseen. This mental burden disproportionately
                                  falls on one parent, typically without recognition.
                                </p>
                                <ul>
                                  <li>Happens inside one's head—invisible to others</li>
                                  <li>Continuous with no clear start or finish</li>
                                  <li>Difficult to measure or delegate</li>
                                  <li>Rarely acknowledged as "real work"</li>
                                </ul>
                              </div>

                              <div>
                                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px;">
                                  <h3 style="margin-top: 0;">The 4 Types of Mental Load</h3>
                                  <ul style="padding-left: 20px;">
                                    <li><strong>Anticipatory Load</strong> - Forecasting future needs</li>
                                    <li><strong>Monitoring Load</strong> - Tracking details and schedules</li>
                                    <li><strong>Communication Load</strong> - Coordinating between family members</li>
                                    <li><strong>Emotional Load</strong> - Maintaining relationships</li>
                                  </ul>
                                </div>

                                <div style="background: black; color: white; padding: 20px; border-radius: 8px;">
                                  <h3 style="margin-top: 0;">The Impact of Unseen Labor</h3>
                                  <div style="display: flex; justify-content: space-between; text-align: center;">
                                    <div>
                                      <div style="font-size: 18px; font-weight: bold;">23.4</div>
                                      <div style="font-size: 12px; color: #aaa;">hours/week</div>
                                    </div>
                                    <div>
                                      <div style="font-size: 18px; font-weight: bold;">68%</div>
                                      <div style="font-size: 12px; color: #aaa;">report burnout</div>
                                    </div>
                                    <div>
                                      <div style="font-size: 18px; font-weight: bold;">$12K+</div>
                                      <div style="font-size: 12px; color: #aaa;">annual value</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ` :

                          (slide.id === 5 || slide.id === 9) ? `
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                              <div>
                                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px;">
                                  <h3 style="margin-top: 0;">Children Help Parents vs Doing More Chores</h3>
                                  <p>
                                    Our research shows that while getting children to do more chores themselves is difficult,
                                    getting them to help parents with existing chores is substantially easier and more effective.
                                  </p>
                                  <div style="background: #eef2ff; padding: 10px; border-radius: 8px; margin-top: 10px;">
                                    <strong>Key insight:</strong> Children are more engaged when they feel like
                                    collaborative partners rather than assigned task-takers.
                                  </div>
                                </div>

                                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                                  <h3 style="margin-top: 0;">Breaking the Generational Problem</h3>
                                  <p>
                                    By involving children in workload awareness, we're addressing both today's imbalance
                                    and tomorrow's expectations. Children who participate in family equity are 3.8× more
                                    likely to create balanced partnerships as adults.
                                  </p>
                                </div>
                              </div>

                              <div>
                                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px;">
                                  <h3 style="margin-top: 0;">Beta Test Success: Kids Love to Grade Parents</h3>
                                  <p>
                                    Our beta testing revealed a surprising insight: children's <strong>favorite feature</strong>
                                    was the ability to grade and survey their parents on household tasks and responsibilities.
                                  </p>
                                  <div style="background: #eef2ff; padding: 10px; border-radius: 8px; margin-top: 10px;">
                                    <strong>Beta test feedback:</strong> "My kids are actually reminding ME to log tasks
                                    in Allie because they love giving me feedback scores!"
                                  </div>
                                </div>

                                <div style="background: black; color: white; padding: 20px; border-radius: 8px;">
                                  <h3 style="margin-top: 0;">Building Stronger Family Units</h3>
                                  <p style="color: #ccc; font-size: 14px;">
                                    Working together as a family to understand and balance parental load creates
                                    more cohesive family units. Our data shows families experience:
                                  </p>
                                  <div style="display: flex; justify-content: space-between; text-align: center; margin-top: 10px;">
                                    <div>
                                      <div style="font-size: 18px; font-weight: bold;">67%</div>
                                      <div style="font-size: 12px; color: #aaa;">satisfaction</div>
                                    </div>
                                    <div>
                                      <div style="font-size: 18px; font-weight: bold;">53%</div>
                                      <div style="font-size: 12px; color: #aaa;">quality time</div>
                                    </div>
                                    <div>
                                      <div style="font-size: 18px; font-weight: bold;">71%</div>
                                      <div style="font-size: 12px; color: #aaa;">communication</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div style="background: linear-gradient(to right, #6366f1, #8b5cf6); color: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                              <h3 style="margin-top: 0;">Our Family Transformation Thesis</h3>
                              <p>
                                By making children active participants rather than passive observers, we transform family dynamics
                                today while simultaneously reshaping expectations for the next generation. Children don't just
                                inherit balanced households—they help create them.
                              </p>
                            </div>
                          ` :

                          // Default content for other slides
                          `
                            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                              <p>
                                This slide contains detailed content about "${slide.title}".
                                <br><br>
                                For the full experience with all interactive elements and precise formatting,
                                please view the slide in the main presentation.
                              </p>
                              <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #6366f1;">
                                <strong>Slide Summary</strong>
                                <ul style="margin-top: 10px;">
                                  <li>Section: ${getSectionTitle(slide.section)}</li>
                                  <li>Slide ID: ${slide.id}</li>
                                  <li>Slide has ${slide.component ? 'a component-based' : 'a custom'} implementation</li>
                                </ul>
                              </div>
                            </div>
                          `
                        }
                      </div>
                    </div>
                  `;
                });

                // Close the HTML
                printContent += `
                  <script>
                    // Auto-show print dialog when the page loads
                    window.onload = function() {
                      // Give a small delay to ensure everything is rendered
                      setTimeout(() => {
                        document.querySelector('.print-button').innerHTML = "Print to PDF";
                      }, 500);
                    };
                  </script>
                </body>
                </html>
                `;

                // Write the content to the new window
                printWindow.document.write(printContent);
                printWindow.document.close();

                setSaveMessage('Print view opened!');
                setTimeout(() => setSaveMessage(''), 2000);
              }}
              className="p-2 rounded-md hover:bg-blue-100 mr-2 flex items-center"
              title="View all slides on one page for printing"
            >
              <Printer size={18} className="text-blue-600 mr-1" />
              <span className="text-sm">View All Slides</span>
            </button>

            {saveMessage && (
              <span className="text-xs text-green-600 animate-pulse mr-2">{saveMessage}</span>
            )}
            
            <div className="flex items-center border rounded-md overflow-hidden">
              <button 
                className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                onClick={goToPreviousSlide}
                disabled={currentSlide <= 1}
              >
                <ArrowLeft size={16} />
              </button>
              
              <div className="relative">
                <button 
                  className="px-3 py-2 flex items-center hover:bg-gray-50"
                  onClick={() => setShowSlideMenu(!showSlideMenu)}
                >
                  <span className="text-sm font-medium mr-1">
                    {currentSlide} / {slides.length}
                  </span>
                  {showSlideMenu ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
                
                {showSlideMenu && (
                  <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-md mt-1 border z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <input 
                        type="text" 
                        placeholder="Go to slide..." 
                        className="w-full px-3 py-2 border rounded-md text-sm mb-2"
                        value={slideSearch}
                        onChange={(e) => setSlideSearch(e.target.value)}
                      />
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {filteredSlides.map(slide => (
                        <button 
                          key={slide.id}
                          className={`w-full text-left p-2 text-sm hover:bg-gray-100 flex items-center ${
                            currentSlide === slide.id ? 'bg-purple-50 text-purple-800' : ''
                          }`}
                          onClick={() => goToSlide(slide.id)}
                        >
                          <span className="w-6 inline-block">{slide.id}.</span>
                          <span className="truncate">{slide.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                onClick={goToNextSlide}
                disabled={currentSlide >= slides.length}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={() => addSlideAfter(currentSlide)}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
              title="Add slide after current"
            >
              <PlusCircle size={20} />
            </button>
            <button 
              onClick={() => deleteSlide(currentSlide)}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
              title="Delete current slide"
            >
              <X size={20} />
            </button>
            <button 
              onClick={() => moveSlide(currentSlide, 'up')}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-50"
              disabled={slides.findIndex(s => s.id === currentSlide) === 0}
              title="Move slide up"
            >
              <ChevronUp size={20} />
            </button>
            <button 
              onClick={() => moveSlide(currentSlide, 'down')}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-600 disabled:opacity-50"
              disabled={slides.findIndex(s => s.id === currentSlide) === slides.length - 1}
              title="Move slide down"
            >
              <ChevronDown size={20} />
            </button>
          </div>
        </header>
        
        {/* Slide content */}
        <main className="flex-1 overflow-y-auto bg-gray-200">
          <div className="max-w-screen-xl mx-auto p-4">
            <div className="bg-white w-full rounded-lg shadow-lg overflow-y-auto">
              {renderCurrentSlide()}
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t px-4 py-2 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Edit this presentation with Claude Code
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={goToPreviousSlide} 
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
              disabled={currentSlide <= 1}
            >
              <ArrowLeft size={16} />
            </button>
            <button 
              onClick={goToNextSlide}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
              disabled={currentSlide >= slides.length}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default InvestorFunnelV2;