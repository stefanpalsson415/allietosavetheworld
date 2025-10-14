/**
 * Investor Deck V4 Slide Configuration
 * 
 * This file contains the centralized configuration for all investor deck slides.
 * Each slide has:
 * - id: Unique numeric identifier
 * - title: Display title of the slide
 * - section: Grouping category 
 * - componentPath: Path to the slide component file (relative to slides folder)
 * - active: Whether the slide should be shown in the deck
 * - order: Presentation order (can be reordered)
 * - lastEditedBy: Tracking who made the last content change
 * - lastEdited: When the slide was last edited
 */

const slideConfig = {
  slides: [
    // Intro Section
    {
      id: 1,
      title: "Allie Summary Slide",
      section: "intro",
      componentPath: "AllieIntroSlide",
      active: true,
      order: 1,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 45,
      title: "One Pager Summary",
      section: "intro",
      componentPath: "OnePagerSlide",
      active: true,
      order: 1.5,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 46,
      title: "Comprehensive Investment Summary",
      section: "intro",
      componentPath: "ComprehensiveSummarySlide",
      active: true,
      order: 1.7,
      lastEditedBy: "claude",
      lastEdited: "2025-05-22"
    },
    
    // Problem Section
    {
      id: 2,
      title: "Problem Summary",
      section: "problem",
      componentPath: "ProblemSummarySlide",
      active: true,
      order: 2,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 3,
      title: "Understanding Parental Mental Load",
      section: "problem",
      componentPath: "ParentalMentalLoadSlide",
      active: true,
      order: 3,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 4,
      title: "Perception Gap",
      section: "problem",
      componentPath: "PerceptionGapSlide",
      active: true,
      order: 4,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 5,
      title: "Invisible Crisis & Global Crisis Impact",
      section: "problem",
      componentPath: "InvisibleCrisisSlide",
      active: true,
      order: 5,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 6,
      title: "Demographic Crisis",
      section: "problem",
      componentPath: "DemographicCrisisSlide",
      active: true,
      order: 6,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 7,
      title: "Actual Parental Gap",
      section: "problem",
      componentPath: "ParentalGapSlide",
      active: true,
      order: 7,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 8,
      title: "Generational Imbalance",
      section: "problem",
      componentPath: "GenerationalImbalanceSlide",
      active: true,
      order: 8,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 9,
      title: "Relationship Impact",
      section: "problem",
      componentPath: "RelationshipImpactSlide",
      active: true,
      order: 9,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    
    // Solution Section
    {
      id: 10,
      title: "Solution Summary",
      section: "solution",
      componentPath: "SolutionSummarySlide",
      active: true,
      order: 10,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 11,
      title: "Scientific Foundation",
      section: "solution",
      componentPath: "ScientificFoundationSlide",
      active: true,
      order: 11,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 12,
      title: "Awareness First",
      section: "solution",
      componentPath: "AwarenessFirstSlide",
      active: true,
      order: 12,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 13,
      title: "Collective Intelligence",
      section: "solution",
      componentPath: "CollectiveIntelligenceSlide",
      active: true,
      order: 13,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 14,
      title: "Family Knowledge Graph",
      section: "solution",
      componentPath: "DataAndKnowledgeGraphSlide",
      active: true,
      order: 14,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 15,
      title: "Task Inequality",
      section: "solution",
      componentPath: "TaskInequalitySlide",
      active: true,
      order: 15,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 16,
      title: "Task Weighting Algorithm",
      section: "solution",
      componentPath: "TaskWeightingMetricsSlide",
      active: true,
      order: 16,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 17,
      title: "Mental Load Assessment",
      section: "solution",
      componentPath: "MentalLoadAssessmentSlide",
      active: true,
      order: 17,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 18,
      title: "Change Engine",
      section: "solution",
      componentPath: "ChangeEngineSlide",
      active: true,
      order: 18,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 19,
      title: "Family Command Center",
      section: "solution",
      componentPath: "FamilyCommandCenterSlide",
      active: true,
      order: 19,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 20,
      title: "Sibling Dynamics",
      section: "solution",
      componentPath: "SiblingDynamicsSlide",
      active: true,
      order: 20,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 21,
      title: "Workload Visualization",
      section: "solution",
      componentPath: "WorkloadVisualizationSlide",
      active: true,
      order: 21,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 22,
      title: "Product Demo",
      section: "solution",
      componentPath: "ProductDemoSlide",
      active: true,
      order: 22,
      lastEditedBy: "claude",
      lastEdited: "2025-05-14"
    },
    
    // Market Section
    {
      id: 23,
      title: "Market Summary",
      section: "market",
      componentPath: "MarketSummarySlide",
      active: true,
      order: 23,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 24,
      title: "Market Size",
      section: "market",
      componentPath: "MarketSizeSlide",
      active: true,
      order: 24,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 25,
      title: "Competitive Positioning",
      section: "market",
      componentPath: "CompetitivePositioningSlide",
      active: true,
      order: 25,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 26,
      title: "Market Validation & Business Case",
      section: "market",
      componentPath: "MarketValidationSlide",
      active: true,
      order: 26,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 27,
      title: "Business Model",
      section: "market",
      componentPath: "BusinessModelSlide",
      active: true,
      order: 27,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 28,
      title: "Competitor Landscape",
      section: "market",
      componentPath: "CompetitorLandscapeSlide",
      active: true,
      order: 28,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 29,
      title: "Macro Tailwinds",
      section: "market",
      componentPath: "MacroTailwindsSlide",
      active: true,
      order: 29,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    
    // Growth Section
    {
      id: 30,
      title: "Growth Summary",
      section: "growth",
      componentPath: "GrowthSummarySlide",
      active: true,
      order: 30,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 31,
      title: "Organic Growth Bet",
      section: "growth",
      componentPath: "OrganicGrowthSlide",
      active: true,
      order: 31,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 32,
      title: "Free and Paid Tier",
      section: "growth",
      componentPath: "FreePaidTierSlide",
      active: true,
      order: 32,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 33,
      title: "Allie as a Utility",
      section: "growth",
      componentPath: "AllieUtilitySlide",
      active: true,
      order: 33,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 34,
      title: "Growth to 10K Subscribers",
      section: "growth",
      componentPath: "GrowthToTenKSlide",
      active: true,
      order: 34,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    
    // Monetization Section
    {
      id: 35,
      title: "Monetization Summary",
      section: "monetization",
      componentPath: "MonetizationSummarySlide",
      active: true,
      order: 35,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 36,
      title: "Data Value",
      section: "monetization",
      componentPath: "DataValueSlide",
      active: true,
      order: 36,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 37,
      title: "Family Flywheel",
      section: "monetization",
      componentPath: "FamilyFlywheelSlide",
      active: true,
      order: 37,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 38,
      title: "LTV Expansion",
      section: "monetization",
      componentPath: "LTVExpansionSlide",
      active: true,
      order: 38,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    
    // Team Section
    {
      id: 39,
      title: "Team & Advisors",
      section: "team",
      componentPath: "TeamAdvisorsSlide",
      active: true,
      order: 39,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    
    // Financing Section
    {
      id: 40,
      title: "Financing Summary",
      section: "financing",
      componentPath: "FinancingSummarySlide",
      active: true,
      order: 40,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 41,
      title: "Financial Projections",
      section: "financing",
      componentPath: "FinancialProjectionsSlide",
      active: true,
      order: 41,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 42,
      title: "Product Roadmap",
      section: "financing",
      componentPath: "ProductRoadmapSlide",
      active: true,
      order: 42,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 43,
      title: "Next Steps",
      section: "financing",
      componentPath: "NextStepsSlide",
      active: true,
      order: 43,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    },
    {
      id: 44,
      title: "Thank You",
      section: "financing",
      componentPath: "ThankYouSlide",
      active: true,
      order: 44,
      lastEditedBy: "claude",
      lastEdited: "2025-05-13"
    }
  ]
};

export default slideConfig;