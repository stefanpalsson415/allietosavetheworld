/**
 * Investor Deck Slide Configuration
 * 
 * This file contains the centralized configuration for all investor deck slides.
 * IMPORTANT: This file should ONLY be edited by Claude or with careful version control.
 * 
 * Each slide has:
 * - id: Unique numeric identifier (DO NOT CHANGE THESE)
 * - title: Display title of the slide
 * - section: Grouping category 
 * - componentPath: Path to the slide component file (relative to investorSlides folder)
 * - active: Whether the slide should be shown in the deck
 * - order: Presentation order (can be reordered)
 * - lastEditedBy: Tracking who made the last content change
 * - lastEdited: When the slide was last edited
 */

export const investorSlidesConfig = [
  {
    id: 1,
    title: "Opening Impact",
    section: "intro",
    componentPath: null, // Custom rendering for title slide
    active: true,
    order: 1,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  // Problem Section
  {
    id: 2,
    title: "Problem Summary",
    section: "problem",
    componentPath: "./ProblemSummarySlide",
    active: true,
    order: 2,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 3,
    title: "Parental Gap Data",
    section: "problem",
    componentPath: "./ParentalGapSlide",
    active: true,
    order: 3,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 4,
    title: "Generational Imbalance Cycle",
    section: "problem",
    componentPath: "./GenerationalImbalanceSlide",
    active: true,
    order: 4,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 5,
    title: "Children as Agents of Change",
    section: "problem",
    componentPath: null, // Custom breaking the cycle slide
    active: true,
    order: 5,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 6,
    title: "The Sibling Advantage",
    section: "problem",
    componentPath: "./SiblingDynamicsSlide",
    active: true,
    order: 6,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 7,
    title: "Workload Visualization",
    section: "problem",
    componentPath: "./WorkloadVisualizationSlide",
    active: true,
    order: 7,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 8,
    title: "Mental Load Assessment",
    section: "problem",
    componentPath: "./MentalLoadAssessmentSlide",
    active: true,
    order: 8,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 9,
    title: "Time Value Analysis",
    section: "problem",
    componentPath: "./TimeValueAnalysisSlide",
    active: true,
    order: 9,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 10,
    title: "Relationship Impact",
    section: "problem",
    componentPath: "./RelationshipImpactSlide",
    active: true,
    order: 10,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 11,
    title: "Global Crisis Impact",
    section: "problem",
    componentPath: "./GlobalCrisisImpactSlide",
    active: true,
    order: 11,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 12,
    title: "Perception Gap",
    section: "problem",
    componentPath: "./PerceptionGapSlide",
    active: true,
    order: 12,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 13,
    title: "Demographic Crisis",
    section: "problem",
    componentPath: "./DemographicCrisisSlide",
    active: true,
    order: 13,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 14,
    title: "Macro Tailwinds",
    section: "problem",
    componentPath: "./MacroTailwindsSlide",
    active: true,
    order: 14,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 15,
    title: "The Invisible Crisis",
    section: "problem",
    componentPath: "./InvisibleCrisisSlide",
    active: true,
    order: 15,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 16,
    title: "Business Case Validation",
    section: "problem",
    componentPath: "./BusinessCaseValidationSlide",
    active: true,
    order: 16,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 17,
    title: "Understanding Parental Mental Load",
    section: "problem",
    componentPath: "./ParentalMentalLoadSlide",
    active: true,
    order: 17,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  // Solution Section
  {
    id: 18,
    title: "The Power of Awareness",
    section: "solution",
    componentPath: "./AwarenessFirstSlide",
    active: true,
    order: 18,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 19,
    title: "Solution Summary",
    section: "solution",
    componentPath: "./SolutionSummarySlide",
    active: true,
    order: 19,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 20,
    title: "Scientific Foundation",
    section: "solution",
    componentPath: "./ScientificFoundationSlide",
    active: true,
    order: 20,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 21,
    title: "Personalized Approach",
    section: "solution",
    componentPath: "./PersonalizedApproachSlide",
    active: true,
    order: 21,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 22,
    title: "Family Flywheel - Trust Layers",
    section: "solution",
    componentPath: "./FamilyFlywheelSlide1",
    active: true,
    order: 22,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 23,
    title: "Family Data Graph",
    section: "solution",
    componentPath: "./FamilyFlywheelSlide2",
    active: true,
    order: 23,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 24,
    title: "Lifetime Value Model",
    section: "solution",
    componentPath: "./FamilyFlywheelSlide3",
    active: true,
    order: 24,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 25,
    title: "LTV Expansion Path",
    section: "solution",
    componentPath: "./LTVExpansionSlide",
    active: true,
    order: 25,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 26,
    title: "Data Value",
    section: "solution",
    componentPath: "./DataValueSlide",
    active: true,
    order: 26,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 27,
    title: "Technology Stack",
    section: "solution",
    componentPath: "./TechnologyStackSlide",
    active: true,
    order: 27,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  // Market Section
  {
    id: 28,
    title: "Competitive Landscape",
    section: "market",
    componentPath: "./CompetitorLandscapeSlide",
    active: true,
    order: 28,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 29,
    title: "Market Validation",
    section: "market",
    componentPath: "./MarketValidationSlide",
    active: true,
    order: 29,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 30,
    title: "Market Summary",
    section: "market",
    componentPath: "./MarketSummarySlide",
    active: true,
    order: 30,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 31,
    title: "Market Size",
    section: "market",
    componentPath: "./MarketSizeSlide",
    active: true,
    order: 31,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  // Product & Roadmap Section
  {
    id: 32,
    title: "Product Roadmap",
    section: "roadmap",
    componentPath: "./ProductRoadmapSlide",
    active: true,
    order: 32,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  // Traction Section
  {
    id: 33,
    title: "Initial Traction",
    section: "traction",
    componentPath: "./InitialTractionSlide",
    active: true,
    order: 33,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  {
    id: 34,
    title: "Traction Summary",
    section: "traction",
    componentPath: "./TractionSummarySlide",
    active: true,
    order: 34,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  // Team Section
  {
    id: 35,
    title: "Team & Advisors",
    section: "team",
    componentPath: "./TeamAdvisorsSlide",
    active: true,
    order: 35,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  // Financial Section
  {
    id: 36,
    title: "Financial Projections",
    section: "financials",
    componentPath: "./FinancialProjectionsSlide",
    active: true,
    order: 36,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  },
  // Conclusion
  {
    id: 37,
    title: "Next Steps",
    section: "conclusion",
    componentPath: "./NextStepsSlide",
    active: true,
    order: 37,
    lastEditedBy: "claude",
    lastEdited: "2025-05-12"
  }
];

/**
 * Helper Functions for Slide Management
 * These functions should only be used by authorized systems
 */

// Get all active slides in presentation order
export const getActiveSlides = () => {
  return [...investorSlidesConfig]
    .filter(slide => slide.active)
    .sort((a, b) => a.order - b.order);
};

// Get slides grouped by section
export const getSlidesBySection = () => {
  const sections = {};
  
  investorSlidesConfig.forEach(slide => {
    if (!sections[slide.section]) {
      sections[slide.section] = [];
    }
    sections[slide.section].push(slide);
  });
  
  // Sort slides within each section
  Object.keys(sections).forEach(section => {
    sections[section].sort((a, b) => a.order - b.order);
  });
  
  return sections;
};

// Find a slide by ID
export const getSlideById = (id) => {
  return investorSlidesConfig.find(slide => slide.id === id);
};

// Get the maximum order value
export const getMaxOrder = () => {
  return Math.max(...investorSlidesConfig.map(slide => slide.order));
};

// Get the next available ID
export const getNextAvailableId = () => {
  return Math.max(...investorSlidesConfig.map(slide => slide.id)) + 1;
};

// Export version for tracking
export const CONFIG_VERSION = "1.0.0";