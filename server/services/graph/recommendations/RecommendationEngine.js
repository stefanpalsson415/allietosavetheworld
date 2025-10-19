/**
 * RecommendationEngine.js
 *
 * Generates actionable recommendations for rebalancing household labor.
 * Uses knowledge graph insights to propose Fair Play card swaps, automation,
 * and routine establishment.
 *
 * Research Foundation:
 * - Fair Play methodology (Eve Rodsky)
 * - Behavioral economics (nudge theory)
 * - Habit formation (Clear, Fogg)
 *
 * Recommendation Types:
 * 1. Task Rebalancing - Specific Fair Play card swaps
 * 2. Automation - Which tasks can be automated/outsourced
 * 3. Routine Establishment - Reduce coordination through habits
 * 4. Load Balancing - Even cognitive load distribution
 * 5. Dependency Breaking - Reduce blocking chains
 */

import neo4jService from '../Neo4jService.js';
import { FAIR_PLAY_CARDS, FAIR_PLAY_CATEGORIES } from '../../../config/fairPlayTaxonomy.js';

class RecommendationEngine {
  constructor() {
    this.neo4j = neo4jService;
  }

  /**
   * Generate comprehensive rebalancing recommendations
   */
  async generateRecommendations(familyId, insights) {
    console.log(`💡 [Recommendations] Generating recommendations for family ${familyId}...`);

    const recommendations = [];

    // 1. Task rebalancing (Fair Play card swaps)
    if (insights.invisibleLabor) {
      const rebalancing = await this._generateRebalancingRecommendations(
        familyId,
        insights.invisibleLabor
      );
      recommendations.push(...rebalancing);
    }

    // 2. Automation opportunities
    const automation = await this._generateAutomationRecommendations(familyId, insights);
    recommendations.push(...automation);

    // 3. Routine establishment
    const routines = await this._generateRoutineRecommendations(familyId, insights);
    recommendations.push(...routines);

    // 4. Coordination reduction
    if (insights.coordination) {
      const coordination = await this._generateCoordinationRecommendations(
        familyId,
        insights.coordination
      );
      recommendations.push(...coordination);
    }

    // 5. Dependency breaking
    if (insights.coordination?.dependencies) {
      const dependency = await this._generateDependencyRecommendations(
        familyId,
        insights.coordination.dependencies
      );
      recommendations.push(...dependency);
    }

    // Sort by priority (critical → high → medium → low)
    const sorted = this._sortByPriority(recommendations);

    return {
      familyId,
      generatedAt: new Date().toISOString(),
      totalRecommendations: sorted.length,
      recommendations: sorted,
      summary: this._generateRecommendationSummary(sorted)
    };
  }

  /**
   * Generate Fair Play card swap recommendations
   */
  async _generateRebalancingRecommendations(familyId, invisibleLaborAnalysis) {
    const recommendations = [];

    // High anticipation burden → Transfer full Fair Play cards
    if (invisibleLaborAnalysis.anticipation?.severity === 'high') {
      const primary = invisibleLaborAnalysis.anticipation.primaryAnticipator;

      recommendations.push({
        id: `rebalance_anticipation_${Date.now()}`,
        type: 'task_rebalancing',
        priority: 'critical',
        category: 'Fair Play card transfer',
        title: `Transfer 3-5 Fair Play cards from ${primary.name}`,
        description: `${primary.name} is noticing ${primary.tasksAnticipated} tasks proactively (${primary.percentage.toFixed(0)}% of all tasks). This is significant invisible labor.`,
        action: {
          what: 'Transfer FULL ownership (conception + planning + execution) of 3-5 Fair Play cards',
          who: `From ${primary.name} to partner`,
          how: [
            'Use Fair Play card deck to identify cards currently owned by ${primary.name}',
            'Select 3-5 cards that partner has skills for',
            'Transfer ALL 3 phases (not just execution)',
            'Set clear ownership: "This is YOUR card now"'
          ],
          suggestedCards: this._suggestCardsToTransfer(invisibleLaborAnalysis)
        },
        impact: {
          anticipationReduction: '20-30%',
          timeReclaimed: '2-4 hours/week',
          stressReduction: 'high'
        },
        timeframe: '1-2 weeks',
        difficulty: 'medium',
        successMetrics: [
          'Partner creates tasks in transferred categories without prompting',
          'Anticipation burden Gini coefficient drops below 0.3',
          'Primary anticipator reports reduced mental load'
        ]
      });
    }

    // High monitoring overhead → Transfer tasks being monitored
    if (invisibleLaborAnalysis.monitoring?.severity === 'high') {
      const monitor = invisibleLaborAnalysis.monitoring.primaryMonitor;

      recommendations.push({
        id: `rebalance_monitoring_${Date.now()}`,
        type: 'task_rebalancing',
        priority: 'critical',
        category: 'Reduce monitoring burden',
        title: `Eliminate monitoring burden for ${monitor.name}`,
        description: `${monitor.name} spends ${monitor.naggingHoursPerWeek.toFixed(1)} hours/week following up on tasks (${monitor.monitoringActions} actions/month). This "nagging coefficient" is unsustainable.`,
        action: {
          what: 'Transfer FULL ownership of tasks currently being monitored',
          who: `From split ownership to single owner`,
          how: [
            'Identify all tasks ${monitor.name} monitors but doesn\'t execute',
            'Transfer conception + planning + execution to current executor',
            'OR transfer all 3 phases back to ${monitor.name} (if executor can\'t handle conception)',
            'Use automated reminders instead of human monitoring'
          ],
          automationOpportunities: [
            'Shared calendar with automatic reminders',
            'Task management app with due date notifications',
            'Recurring tasks on autopilot (no monitoring needed)'
          ]
        },
        impact: {
          monitoringReduction: '70-90%',
          timeReclaimed: `${monitor.naggingHoursPerWeek.toFixed(1)} hours/week`,
          relationshipImprovement: 'high (reduces "nagging" dynamic)'
        },
        timeframe: 'immediate',
        difficulty: 'low (mostly process change)',
        successMetrics: [
          'Monitoring actions drop to <5/month',
          'Tasks completed without follow-up',
          'Partner reports increased ownership'
        ]
      });
    }

    // Decision-research gap → Transfer research labor
    if (invisibleLaborAnalysis.decisionResearch?.gaps?.length > 0) {
      const gap = invisibleLaborAnalysis.decisionResearch.gaps[0];

      recommendations.push({
        id: `rebalance_research_${Date.now()}`,
        type: 'task_rebalancing',
        priority: 'high',
        category: 'Decision-research alignment',
        title: `Align research and decision authority`,
        description: `${gap.researcher} spent ${(gap.invisibleResearchMinutes / 60).toFixed(1)} hours researching ${gap.decisionsResearchedNotMade} decisions that ${gap.decider} made. This invisible labor should be valued or redistributed.`,
        action: {
          what: 'Align research responsibility with decision authority',
          who: `${gap.researcher} and ${gap.decider}`,
          how: [
            'Option 1: ${gap.decider} does own research (full ownership)',
            'Option 2: ${gap.researcher} makes final decisions (owns full card)',
            'Option 3: Explicitly value research time as equal to decision-making'
          ],
          fairPlayAlignment: 'Conception (research) should go with Planning and Execution'
        },
        impact: {
          researchBurdenReduction: '50%',
          timeReclaimed: `${(gap.invisibleResearchMinutes / 60).toFixed(1)} hours on next decision`,
          equity: 'high (makes invisible labor visible)'
        },
        timeframe: '1-2 weeks',
        difficulty: 'medium (requires mindset shift)',
        successMetrics: [
          'Research and decision ownership align',
          'Fewer split-ownership decisions',
          'Both partners report fairness improvement'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate automation recommendations
   */
  async _generateAutomationRecommendations(familyId, insights) {
    const recommendations = [];

    // High-burden tasks that can be automated
    const automatable = [
      {
        task: 'Grocery shopping',
        solution: 'Online grocery delivery (Instacart, Amazon Fresh)',
        timeReclaimed: '2-3 hours/week',
        fairPlayCard: 'FP_001'
      },
      {
        task: 'Meal planning',
        solution: 'Meal kit service (HelloFresh, Blue Apron)',
        timeReclaimed: '1-2 hours/week',
        fairPlayCard: 'FP_048'
      },
      {
        task: 'Bill payment',
        solution: 'Autopay for all recurring bills',
        timeReclaimed: '30 min/month',
        fairPlayCard: 'FP_014'
      },
      {
        task: 'Calendar coordination',
        solution: 'Shared Google Calendar with automatic sync',
        timeReclaimed: '1-2 hours/week',
        fairPlayCard: 'FP_025'
      }
    ];

    automatable.forEach(auto => {
      recommendations.push({
        id: `automation_${auto.fairPlayCard}_${Date.now()}`,
        type: 'automation',
        priority: 'high',
        category: 'Outsource/automate',
        title: `Automate: ${auto.task}`,
        description: `${auto.task} is recurring cognitive load that can be automated.`,
        action: {
          what: `Implement ${auto.solution}`,
          how: [
            `Research ${auto.solution} options (1 hour)`,
            'Set up account and first order/payment',
            'Establish routine (weekly/monthly)',
            'Monitor for 1 month, then autopilot'
          ]
        },
        impact: {
          timeReclaimed: auto.timeReclaimed,
          mentalLoadReduction: 'medium-high',
          costVsBenefit: 'Usually worth it (time is money)'
        },
        timeframe: '1 week to set up',
        difficulty: 'low',
        successMetrics: [
          `${auto.task} happens without human intervention`,
          'No weekly planning required',
          'Family reports reduced stress'
        ]
      });
    });

    return recommendations;
  }

  /**
   * Generate routine establishment recommendations
   */
  async _generateRoutineRecommendations(familyId, insights) {
    const recommendations = [];

    // Reduce coordination through consistent routines
    recommendations.push({
      id: `routine_morning_${Date.now()}`,
      type: 'routine_establishment',
      priority: 'high',
      category: 'Habit formation',
      title: 'Establish morning routine (reduce coordination)',
      description: 'Morning chaos creates coordination burden. Consistent routines eliminate 80% of morning decisions.',
      action: {
        what: 'Create standard morning routine for all family members',
        how: [
          'Document current morning chaos (what causes stress?)',
          'Design ideal routine with time blocks',
          'Use visual checklists for kids',
          'Habit stack: "After breakfast, brush teeth"',
          'Practice for 2 weeks (habit formation time)'
        ],
        examples: [
          '6:30am - Wake up, no negotiation',
          '7:00am - Breakfast (prepped night before)',
          '7:30am - Dress + backpack check',
          '8:00am - Leave for school'
        ]
      },
      impact: {
        coordinationReduction: '80% in mornings',
        timeReclaimed: '30-45 min/day',
        stressReduction: 'very high (predictability reduces anxiety)'
      },
      timeframe: '2 weeks to establish',
      difficulty: 'medium (requires consistency)',
      successMetrics: [
        'Morning runs smoothly without verbal coordination',
        'Kids follow routine independently',
        'No missed items/late arrivals'
      ]
    });

    // Sunday planning routine
    if (insights.temporalPatterns?.taskCreation?.sundayNightSpike) {
      recommendations.push({
        id: `routine_sunday_planning_${Date.now()}`,
        type: 'routine_establishment',
        priority: 'medium',
        category: 'Weekly planning habit',
        title: 'Formalize Sunday planning routine (make it efficient)',
        description: `${insights.temporalPatterns.taskCreation.sundayNightPercentage}% of tasks are created Sunday nights. Make this planning time efficient and shared.`,
        action: {
          what: 'Weekly family planning meeting (15-30 min)',
          when: 'Sunday 7pm (after dinner, before wind-down)',
          how: [
            'Review upcoming week calendar (both partners)',
            'Identify potential conflicts/gaps',
            'Assign Fair Play cards for week',
            'Create shared task list',
            'Set next week\'s priorities'
          ]
        },
        impact: {
          planningEfficiency: '2x (30 min together vs 60 min solo)',
          anticipationSharing: 'high (both partners notice needs)',
          weekStartStress: 'reduced (prepared vs reactive)'
        },
        timeframe: '1 week to start',
        difficulty: 'low (just needs calendar block)',
        successMetrics: [
          'Both partners attend weekly',
          'Week feels more prepared',
          'Fewer Monday morning surprises'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate coordination reduction recommendations
   */
  async _generateCoordinationRecommendations(familyId, coordinationAnalysis) {
    const recommendations = [];

    // High bottleneck → Delegate coordination authority
    if (coordinationAnalysis.bottlenecks?.severity === 'high') {
      const bottleneck = coordinationAnalysis.bottlenecks.primaryBottleneck;

      recommendations.push({
        id: `coordination_bottleneck_${Date.now()}`,
        type: 'coordination_reduction',
        priority: 'critical',
        category: 'Delegation',
        title: `Reduce ${bottleneck.person}'s coordination burden`,
        description: `${bottleneck.person} is the family coordination hub (betweenness score: ${bottleneck.score.toFixed(2)}). Most coordination flows through them, creating bottleneck.`,
        action: {
          what: 'Distribute coordination authority',
          how: [
            'Identify tasks requiring ${bottleneck.person}\'s coordination',
            'Transfer full task ownership (eliminates need for coordination)',
            'Use shared systems (calendar, task app) instead of verbal coordination',
            'Establish standard routines (no coordination needed once established)'
          ],
          systemsToImplement: [
            'Shared Google Calendar (auto-sync)',
            'Family command center (physical or digital)',
            'Asana/Trello for task ownership',
            'Standard meal rotation (no daily "what\'s for dinner?")'
          ]
        },
        impact: {
          coordinationReduction: '40-60%',
          timeReclaimed: '3-5 hours/week',
          bottleneckElimination: 'high'
        },
        timeframe: '2-4 weeks',
        difficulty: 'medium (requires systems + mindset shift)',
        successMetrics: [
          'Betweenness centrality score drops below 0.3',
          'Tasks complete without ${bottleneck.person} involvement',
          'Partner reports increased autonomy'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Generate dependency breaking recommendations
   */
  async _generateDependencyRecommendations(familyId, dependencyAnalysis) {
    const recommendations = [];

    if (dependencyAnalysis.totalChains > 5) {
      recommendations.push({
        id: `dependency_parallel_${Date.now()}`,
        type: 'dependency_breaking',
        priority: 'high',
        category: 'Parallelization',
        title: 'Break dependency chains (enable parallel work)',
        description: `${dependencyAnalysis.totalChains} dependency chains create delays. Breaking chains enables parallel task completion.`,
        action: {
          what: 'Identify and break longest dependency chains',
          how: [
            'Find critical path (longest chain)',
            'Identify which dependencies are real vs artificial',
            'Add buffer time between dependent tasks',
            'Create backup plans for high-risk steps',
            'Enable parallel work where possible'
          ],
          example: 'Instead of A→B→C→D, restructure as A→B + C→D (parallel)'
        },
        impact: {
          timeReduction: '30-50% (parallelization)',
          flexibilityIncrease: 'high (multiple people can work)',
          singlePointsOfFailure: 'reduced'
        },
        timeframe: '1-2 weeks',
        difficulty: 'medium',
        successMetrics: [
          'Dependency chains < 3 steps',
          'Tasks complete in parallel',
          'Fewer delays from blocking'
        ]
      });
    }

    return recommendations;
  }

  // ============= Helper Methods =============

  _suggestCardsToTransfer(invisibleLaborAnalysis) {
    // Suggest specific Fair Play cards based on current burden
    const suggestions = [];

    // High anticipation burden → Suggest caregiving cards (high conception phase)
    if (invisibleLaborAnalysis.anticipation?.severity === 'high') {
      suggestions.push(
        { id: 'FP_046', name: 'Medical Appointments', reason: 'High anticipation burden (notices needs early)' },
        { id: 'FP_047', name: 'School Communication', reason: '85% invisible labor (conception + planning)' },
        { id: 'FP_025', name: 'Extracurricular Logistics', reason: 'Requires proactive planning' }
      );
    }

    // High monitoring → Suggest execution-heavy cards (reduce split ownership)
    if (invisibleLaborAnalysis.monitoring?.severity === 'high') {
      suggestions.push(
        { id: 'FP_001', name: 'Home Goods & Supplies', reason: 'Currently split (one notices, one buys)' },
        { id: 'FP_048', name: 'Meals Planning', reason: 'Transfer full meal ownership (plan + shop + cook)' }
      );
    }

    return suggestions.slice(0, 5);
  }

  _sortByPriority(recommendations) {
    const priorityOrder = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3
    };

    return recommendations.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  _generateRecommendationSummary(recommendations) {
    const critical = recommendations.filter(r => r.priority === 'critical').length;
    const high = recommendations.filter(r => r.priority === 'high').length;

    const totalTimeReclaimed = recommendations
      .map(r => this._extractTimeValue(r.impact?.timeReclaimed))
      .reduce((sum, hours) => sum + hours, 0);

    return {
      criticalActions: critical,
      highPriorityActions: high,
      totalRecommendations: recommendations.length,
      estimatedTimeReclaimed: `${totalTimeReclaimed.toFixed(1)} hours/week`,
      quickWins: recommendations.filter(r => r.difficulty === 'low' && r.priority === 'high').length,
      message: critical > 0
        ? `${critical} critical actions require immediate attention. Implementing top 3 recommendations could reclaim ${totalTimeReclaimed.toFixed(1)} hours/week.`
        : `${high} high-priority opportunities to reduce mental load and improve household equity.`
    };
  }

  _extractTimeValue(timeString) {
    if (!timeString) return 0;

    // Extract numeric value from "2-3 hours/week" or "30 min/month"
    const match = timeString.match(/(\d+(?:\.\d+)?)/);
    if (!match) return 0;

    const value = parseFloat(match[1]);

    // Convert to hours/week
    if (timeString.includes('min/month')) {
      return (value / 60) / 4;  // minutes per month → hours per week
    } else if (timeString.includes('min/day')) {
      return (value / 60) * 7;  // minutes per day → hours per week
    } else if (timeString.includes('hours/week')) {
      return value;
    } else if (timeString.includes('hours/month')) {
      return value / 4;
    }

    return value;  // Default: assume hours/week
  }
}

export default new RecommendationEngine();
