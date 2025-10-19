/**
 * InvisibleLaborEngine.js
 *
 * Core engine for detecting and quantifying invisible labor in family systems.
 * Implements research-backed algorithms from Fair Play framework and academic studies.
 *
 * Key Metrics:
 * - Anticipation Burden: Who notices tasks before assignment (proactive cognitive load)
 * - Monitoring Overhead: Follow-up burden ("nagging coefficient")
 * - Decision-Research Gap: Invisible research vs visible decision authority
 * - Fair Play Phase Distribution: Conception + Planning (invisible) vs Execution (visible)
 */

import { executeQuery } from '../CypherQueries.js';
import neo4jService from '../Neo4jService.js';

class InvisibleLaborEngine {
  /**
   * Analyze who notices and creates tasks proactively
   * Research: 60-70% of household cognitive labor is anticipation
   */
  async analyzeAnticipationBurden(familyId) {
    const data = await executeQuery('anticipationBurden', { familyId }, neo4jService);

    if (!data || data.length === 0) {
      return {
        primaryAnticipator: null,
        anticipationGap: 0,
        insight: 'No anticipation data available yet.',
        severity: 'none'
      };
    }

    const totalTasks = data.reduce((sum, d) => sum + d.tasks_anticipated, 0);
    const primaryAnticipator = data[0];
    const anticipationPercentage = (primaryAnticipator.tasks_anticipated / totalTasks) * 100;

    // Calculate gap: How unequal is the distribution?
    const anticipationGap = this._calculateGiniCoefficient(
      data.map(d => d.tasks_anticipated)
    );

    return {
      primaryAnticipator: {
        name: primaryAnticipator.person,
        tasksAnticipated: primaryAnticipator.tasks_anticipated,
        percentage: anticipationPercentage,
        avgLeadTimeDays: primaryAnticipator.avg_lead_time_days,
        burden: primaryAnticipator.anticipation_burden
      },
      anticipationGap,
      allPeople: data,
      insight: this._generateAnticipationInsight(primaryAnticipator, anticipationPercentage, anticipationGap),
      severity: this._calculateSeverity(anticipationGap),
      recommendation: this._generateAnticipationRecommendation(anticipationGap, data)
    };
  }

  /**
   * Analyze monitoring overhead ("nagging coefficient")
   * Research: Primary caregivers spend 2-5 hours/week following up on incomplete tasks
   */
  async analyzeMonitoringOverhead(familyId) {
    const data = await executeQuery('monitoringOverhead', { familyId }, neo4jService);

    if (!data || data.length === 0) {
      return {
        primaryMonitor: null,
        naggingCoefficient: 0,
        insight: 'No monitoring data available yet.',
        severity: 'none'
      };
    }

    const primaryMonitor = data[0];

    return {
      primaryMonitor: {
        name: primaryMonitor.monitor,
        monitoringActions: primaryMonitor.monitoring_actions,
        hoursPerWeek: primaryMonitor.monitoring_hours_per_week,
        avgInterventionsPerTask: primaryMonitor.avg_interventions_per_task,
        naggingHoursPerWeek: primaryMonitor.nagging_hours_per_week
      },
      naggingCoefficient: primaryMonitor.nagging_hours_per_week,
      allMonitors: data,
      insight: this._generateMonitoringInsight(primaryMonitor),
      severity: this._calculateMonitoringSeverity(primaryMonitor.nagging_hours_per_week),
      recommendation: this._generateMonitoringRecommendation(primaryMonitor)
    };
  }

  /**
   * Analyze decision-research gap
   * Research: Women do 73% of household research but make only 47% of final decisions
   */
  async analyzeDecisionResearchGap(familyId) {
    const data = await executeQuery('decisionResearchGap', { familyId }, neo4jService);

    if (!data || data.length === 0) {
      return {
        gaps: [],
        insight: 'No decision-research data available yet.',
        severity: 'none'
      };
    }

    const totalResearchMinutes = data.reduce((sum, d) => sum + d.invisible_research_minutes, 0);

    return {
      gaps: data.map(d => ({
        researcher: d.researcher,
        decider: d.decider,
        invisibleResearchMinutes: d.invisible_research_minutes,
        decisionsResearchedNotMade: d.decisions_researched_not_made,
        percentageOfTotalResearch: (d.invisible_research_minutes / totalResearchMinutes) * 100
      })),
      totalResearchMinutes,
      insight: this._generateDecisionResearchInsight(data),
      severity: this._calculateDecisionResearchSeverity(data),
      recommendation: this._generateDecisionResearchRecommendation(data)
    };
  }

  /**
   * Analyze task creation vs execution split
   * Research: 60% cognitive load (creation) vs 40% execution despite 50/50 execution split
   */
  async analyzeTaskCreationVsExecution(familyId) {
    const data = await executeQuery('taskCreationVsExecution', { familyId }, neo4jService);

    if (!data || data.length === 0) {
      return {
        splits: [],
        insight: 'No task creation/execution data available yet.',
        severity: 'none'
      };
    }

    return {
      splits: data.map(d => ({
        person: d.person,
        creationRatio: (d.creation_ratio * 100).toFixed(1),
        executionRatio: (d.execution_ratio * 100).toFixed(1),
        cognitiveLoad: d.creation_ratio * 0.6 + d.execution_ratio * 0.4  // Research-backed weighting
      })),
      insight: this._generateTaskSplitInsight(data),
      severity: this._calculateTaskSplitSeverity(data),
      recommendation: this._generateTaskSplitRecommendation(data)
    };
  }

  /**
   * Analyze Fair Play phase distribution
   * Research: 65-85% of household work is in invisible phases (conception + planning)
   */
  async analyzeFairPlayPhases(familyId) {
    const data = await executeQuery('fairPlayPhaseDistribution', { familyId }, neo4jService);

    if (!data || data.length === 0) {
      return {
        distributions: [],
        insight: 'No Fair Play phase data available yet.',
        severity: 'none'
      };
    }

    return {
      distributions: data.map(d => ({
        person: d.name,
        invisibleLaborMinutes: d.invisible_labor_minutes,
        visibleLaborMinutes: d.visible_labor_minutes,
        invisiblePercentage: (d.invisible_percentage * 100).toFixed(1),
        totalMinutes: d.invisible_labor_minutes + d.visible_labor_minutes
      })),
      insight: this._generateFairPlayInsight(data),
      severity: this._calculateFairPlaySeverity(data),
      recommendation: this._generateFairPlayRecommendation(data)
    };
  }

  /**
   * Get comprehensive invisible labor report
   * Combines all metrics into unified analysis
   */
  async getComprehensiveReport(familyId) {
    const [anticipation, monitoring, decisionResearch, taskSplit, fairPlay] = await Promise.all([
      this.analyzeAnticipationBurden(familyId),
      this.analyzeMonitoringOverhead(familyId),
      this.analyzeDecisionResearchGap(familyId),
      this.analyzeTaskCreationVsExecution(familyId),
      this.analyzeFairPlayPhases(familyId)
    ]);

    return {
      anticipation,
      monitoring,
      decisionResearch,
      taskSplit,
      fairPlay,
      summary: this._generateComprehensiveSummary({
        anticipation,
        monitoring,
        decisionResearch,
        taskSplit,
        fairPlay
      }),
      overallSeverity: this._calculateOverallSeverity({
        anticipation,
        monitoring,
        decisionResearch,
        taskSplit,
        fairPlay
      }),
      topRecommendations: this._generateTopRecommendations({
        anticipation,
        monitoring,
        decisionResearch,
        taskSplit,
        fairPlay
      })
    };
  }

  // ============= Helper Methods =============

  _calculateGiniCoefficient(values) {
    if (values.length === 0) return 0;

    const sorted = values.sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);

    if (sum === 0) return 0;

    let numerator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (i + 1) * sorted[i];
    }

    return (2 * numerator) / (n * sum) - (n + 1) / n;
  }

  _generateAnticipationInsight(primary, percentage, gap) {
    const gapDescription = gap > 0.4 ? 'very unequal' : gap > 0.25 ? 'moderately unequal' : 'relatively balanced';

    return `${primary.person} notices ${percentage.toFixed(0)}% of tasks that need doing before anyone assigns them (${primary.tasks_anticipated} tasks), with an average lead time of ${primary.avg_lead_time_days?.toFixed(1)} days. This distribution is ${gapDescription} (Gini coefficient: ${gap.toFixed(2)}), indicating significant invisible cognitive labor.`;
  }

  _generateMonitoringInsight(primary) {
    const hoursPerWeek = primary.nagging_hours_per_week || 0;
    const actionsPerMonth = primary.monitoring_actions || 0;

    return `${primary.monitor} spends ${hoursPerWeek.toFixed(1)} hours per week following up on incomplete tasks (${actionsPerMonth} monitoring actions/month), with an average of ${primary.avg_interventions_per_task?.toFixed(1)} interventions per task. This "nagging coefficient" represents significant invisible emotional labor.`;
  }

  _generateDecisionResearchInsight(data) {
    if (data.length === 0) return 'No decision-research gaps detected.';

    const topGap = data[0];
    const hoursSpent = (topGap.invisible_research_minutes / 60).toFixed(1);

    return `${topGap.researcher} spent ${hoursSpent} hours researching ${topGap.decisions_researched_not_made} decisions that ${topGap.decider} ultimately made. This research labor is invisible but critical to decision quality.`;
  }

  _generateTaskSplitInsight(data) {
    const topCreator = data.sort((a, b) => b.creation_ratio - a.creation_ratio)[0];
    const creationPct = (topCreator.creation_ratio * 100).toFixed(0);
    const executionPct = (topCreator.execution_ratio * 100).toFixed(0);

    return `${topCreator.person} creates ${creationPct}% of tasks but executes only ${executionPct}%, indicating a ${creationPct}/${executionPct} cognitive load split. Research shows task creation carries 60% of the cognitive burden despite 50/50 execution.`;
  }

  _generateFairPlayInsight(data) {
    if (data.length === 0) return 'No Fair Play data available.';

    const topInvisible = data.sort((a, b) => b.invisible_percentage - a.invisible_percentage)[0];
    const invisiblePct = (topInvisible.invisible_percentage * 100).toFixed(0);

    return `${topInvisible.name} spends ${invisiblePct}% of their household work time on invisible phases (conception + planning) vs ${(100 - invisiblePct)}% on visible execution. Research shows 65-85% of household work should be invisible.`;
  }

  _calculateSeverity(giniCoefficient) {
    if (giniCoefficient > 0.4) return 'high';
    if (giniCoefficient > 0.25) return 'medium';
    return 'low';
  }

  _calculateMonitoringSeverity(hoursPerWeek) {
    if (hoursPerWeek > 4) return 'high';
    if (hoursPerWeek > 2) return 'medium';
    return 'low';
  }

  _calculateDecisionResearchSeverity(data) {
    if (data.length === 0) return 'none';
    const maxHours = Math.max(...data.map(d => d.invisible_research_minutes / 60));
    if (maxHours > 3) return 'high';
    if (maxHours > 1.5) return 'medium';
    return 'low';
  }

  _calculateTaskSplitSeverity(data) {
    const maxGap = Math.max(...data.map(d => Math.abs(d.creation_ratio - d.execution_ratio)));
    if (maxGap > 0.3) return 'high';
    if (maxGap > 0.15) return 'medium';
    return 'low';
  }

  _calculateFairPlaySeverity(data) {
    if (data.length === 0) return 'none';
    const maxInvisible = Math.max(...data.map(d => d.invisible_percentage));
    if (maxInvisible > 0.8) return 'high';
    if (maxInvisible > 0.65) return 'medium';
    return 'low';
  }

  _calculateOverallSeverity(metrics) {
    const severities = {
      high: 3,
      medium: 2,
      low: 1,
      none: 0
    };

    const scores = [
      severities[metrics.anticipation.severity],
      severities[metrics.monitoring.severity],
      severities[metrics.decisionResearch.severity],
      severities[metrics.taskSplit.severity],
      severities[metrics.fairPlay.severity]
    ];

    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    if (avgScore >= 0.5) return 'low';
    return 'none';
  }

  _generateAnticipationRecommendation(gap, data) {
    if (gap < 0.25) return 'Anticipation burden is relatively balanced. Continue current practices.';

    const topTwo = data.slice(0, 2);
    return `Consider explicitly sharing task anticipation responsibilities between ${topTwo[0].person} and ${topTwo[1].person}. Use shared calendars and checklists to distribute the cognitive load of noticing what needs to be done.`;
  }

  _generateMonitoringRecommendation(primary) {
    if (primary.nagging_hours_per_week < 2) {
      return 'Monitoring overhead is manageable. Current task ownership is working well.';
    }

    return `${primary.monitor} is spending ${primary.nagging_hours_per_week.toFixed(1)} hours/week on follow-ups. Consider using automated reminders, clearer deadlines, and transferring full ownership (conception + planning + execution) of tasks to reduce monitoring burden.`;
  }

  _generateDecisionResearchRecommendation(data) {
    if (data.length === 0) return 'No decision-research gaps to address.';

    const topGap = data[0];
    return `${topGap.researcher} is doing significant invisible research work. Consider: 1) Sharing research duties 50/50, 2) Having ${topGap.decider} take on full decision ownership (research + decide), or 3) Explicitly acknowledging and valuing research time as equal to decision-making.`;
  }

  _generateTaskSplitRecommendation(data) {
    const topCreator = data.sort((a, b) => b.creation_ratio - a.creation_ratio)[0];

    if (topCreator.creation_ratio < 0.6) {
      return 'Task creation/execution split is balanced. Continue current approach.';
    }

    return `${topCreator.person} creates most tasks. Consider: 1) Encouraging others to proactively create tasks they notice, 2) Rotating "family manager" role weekly, or 3) Using Fair Play card system to distribute conception phase ownership.`;
  }

  _generateFairPlayRecommendation(data) {
    if (data.length === 0) return 'Start tracking Fair Play phases to understand invisible labor.';

    const topInvisible = data.sort((a, b) => b.invisible_percentage - a.invisible_percentage)[0];

    if (topInvisible.invisible_percentage < 0.7) {
      return 'Fair Play phase distribution is healthy. Invisible labor is being recognized.';
    }

    return `${topInvisible.name}'s work is ${(topInvisible.invisible_percentage * 100).toFixed(0)}% invisible. Use Fair Play card system to transfer full ownership of cards (all 3 phases) rather than just execution, making invisible work visible and valued.`;
  }

  _generateComprehensiveSummary(metrics) {
    const highSeverityAreas = [];

    if (metrics.anticipation.severity === 'high') {
      highSeverityAreas.push(`anticipation burden (${metrics.anticipation.primaryAnticipator?.percentage?.toFixed(0)}% carried by ${metrics.anticipation.primaryAnticipator?.name})`);
    }
    if (metrics.monitoring.severity === 'high') {
      highSeverityAreas.push(`monitoring overhead (${metrics.monitoring.naggingCoefficient?.toFixed(1)} hours/week)`);
    }
    if (metrics.decisionResearch.severity === 'high') {
      highSeverityAreas.push('decision-research gap');
    }

    if (highSeverityAreas.length === 0) {
      return 'Your family has a relatively balanced distribution of invisible labor. Continue monitoring and making small adjustments as needed.';
    }

    return `Your family shows high invisible labor imbalance in: ${highSeverityAreas.join(', ')}. These patterns are common but addressable through explicit task ownership, automated systems, and recognition of invisible work.`;
  }

  _generateTopRecommendations(metrics) {
    const recommendations = [];

    // Prioritize by severity
    if (metrics.monitoring.severity === 'high') {
      recommendations.push({
        priority: 1,
        area: 'Monitoring Overhead',
        action: metrics.monitoring.recommendation,
        impact: 'high',
        timeToImplement: 'immediate'
      });
    }

    if (metrics.anticipation.severity === 'high') {
      recommendations.push({
        priority: 2,
        area: 'Anticipation Burden',
        action: metrics.anticipation.recommendation,
        impact: 'high',
        timeToImplement: '1-2 weeks'
      });
    }

    if (metrics.fairPlay.severity === 'high') {
      recommendations.push({
        priority: 3,
        area: 'Fair Play Phases',
        action: metrics.fairPlay.recommendation,
        impact: 'medium',
        timeToImplement: '2-4 weeks'
      });
    }

    return recommendations.slice(0, 3);  // Top 3 recommendations
  }
}

export default new InvisibleLaborEngine();
