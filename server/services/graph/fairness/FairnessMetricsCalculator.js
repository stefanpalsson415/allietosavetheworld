/**
 * FairnessMetricsCalculator.js
 *
 * Calculates multiple fairness metrics for household labor distribution.
 * Goes beyond simple "50/50" to measure actual equity.
 *
 * Metrics Calculated:
 * 1. Gini Coefficient - Inequality in task distribution (0 = perfect equality, 1 = one person does everything)
 * 2. Theil Index - Entropy-based inequality measure (sensitive to extremes)
 * 3. Equity vs Equality - Accounts for different work capacities/preferences
 * 4. Fair Play Distribution - Are cards fully owned or split?
 * 5. Household Democracy Index - Do both partners have equal say?
 *
 * Research Foundation:
 * - Income inequality metrics (Gini, Theil)
 * - Distributive justice theory (Rawls, Sen)
 * - Fair Play methodology (Eve Rodsky)
 * - Household bargaining models (economics)
 */

class FairnessMetricsCalculator {
  /**
   * Calculate comprehensive fairness metrics
   */
  calculateFairnessMetrics(familyData) {
    console.log(`⚖️ [Fairness] Calculating fairness metrics...`);

    const metrics = {
      generatedAt: new Date().toISOString(),

      // Core inequality metrics
      giniCoefficient: this.calculateGiniCoefficient(familyData.taskDistribution),
      theilIndex: this.calculateTheilIndex(familyData.taskDistribution),

      // Invisible labor metrics
      invisibleLaborEquity: this.calculateInvisibleLaborEquity(familyData),

      // Fair Play specific metrics
      fairPlayDistribution: this.analyzeFairPlayDistribution(familyData),

      // Decision-making equity
      householdDemocracyIndex: this.calculateDemocracyIndex(familyData),

      // Comprehensive assessment
      overallFairnessScore: null,  // Will be calculated
      interpretation: null,
      recommendations: []
    };

    // Calculate overall score (weighted average of all metrics)
    metrics.overallFairnessScore = this._calculateOverallScore(metrics);
    metrics.interpretation = this._interpretFairness(metrics);
    metrics.recommendations = this._generateFairnessRecommendations(metrics);

    return metrics;
  }

  /**
   * Gini Coefficient: Most widely used inequality metric
   * Formula: (Sum of absolute differences) / (2 * n * sum)
   *
   * Interpretation:
   * 0.0 - 0.2: Very equitable
   * 0.2 - 0.3: Equitable
   * 0.3 - 0.4: Moderately unequal
   * 0.4 - 0.6: Unequal
   * 0.6 - 1.0: Very unequal
   */
  calculateGiniCoefficient(taskDistribution) {
    if (!taskDistribution || Object.keys(taskDistribution).length === 0) {
      return { score: null, interpretation: 'Not enough data' };
    }

    const values = Object.values(taskDistribution);
    const n = values.length;

    if (n < 2) {
      return { score: 0, interpretation: 'Only one person (N/A)' };
    }

    const sorted = values.sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    if (sum === 0) {
      return { score: 0, interpretation: 'No tasks yet' };
    }

    // Gini formula
    let numerator = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        numerator += Math.abs(sorted[i] - sorted[j]);
      }
    }

    const gini = numerator / (2 * n * sum);

    return {
      score: gini,
      interpretation: this._interpretGini(gini),
      details: {
        formula: '(Sum of absolute differences) / (2 * n * sum)',
        range: '0 (perfect equality) to 1 (maximum inequality)',
        comparison: `Similar to Gini coefficient for ${this._findCountryComparison(gini)}`
      }
    };
  }

  /**
   * Theil Index: Entropy-based inequality measure
   * More sensitive to extremes than Gini
   *
   * Formula: (1/n) * Σ(xi/μ * ln(xi/μ))
   * where xi = individual's share, μ = mean share
   */
  calculateTheilIndex(taskDistribution) {
    if (!taskDistribution || Object.keys(taskDistribution).length === 0) {
      return { score: null, interpretation: 'Not enough data' };
    }

    const values = Object.values(taskDistribution);
    const n = values.length;

    if (n < 2) {
      return { score: 0, interpretation: 'Only one person (N/A)' };
    }

    const sum = values.reduce((a, b) => a + b, 0);
    if (sum === 0) {
      return { score: 0, interpretation: 'No tasks yet' };
    }

    const mean = sum / n;

    // Theil formula
    let theil = 0;
    for (const value of values) {
      if (value > 0) {  // Avoid ln(0)
        const share = value / mean;
        theil += (share) * Math.log(share);
      }
    }
    theil = theil / n;

    return {
      score: theil,
      interpretation: this._interpretTheil(theil),
      details: {
        formula: '(1/n) * Σ(xi/μ * ln(xi/μ))',
        range: '0 (perfect equality) to ln(n) (maximum inequality)',
        maxPossible: Math.log(n).toFixed(2),
        sensitivity: 'More sensitive to extremes than Gini coefficient'
      }
    };
  }

  /**
   * Invisible Labor Equity
   * Measures fairness of invisible work (anticipation, monitoring, research)
   */
  calculateInvisibleLaborEquity(familyData) {
    const invisibleMetrics = familyData.invisibleLaborMetrics || {};

    // Weight different types of invisible labor
    const weights = {
      anticipation: 0.4,   // Highest weight (proactive thinking)
      monitoring: 0.3,     // High weight (follow-up burden)
      research: 0.2,       // Medium weight (decision support)
      coordination: 0.1    // Lower weight (can be automated)
    };

    let weightedScore = 0;
    let totalWeight = 0;

    if (invisibleMetrics.anticipation) {
      weightedScore += invisibleMetrics.anticipation.giniCoefficient * weights.anticipation;
      totalWeight += weights.anticipation;
    }
    if (invisibleMetrics.monitoring) {
      weightedScore += invisibleMetrics.monitoring.giniCoefficient * weights.monitoring;
      totalWeight += weights.monitoring;
    }
    if (invisibleMetrics.research) {
      weightedScore += invisibleMetrics.research.giniCoefficient * weights.research;
      totalWeight += weights.research;
    }
    if (invisibleMetrics.coordination) {
      weightedScore += invisibleMetrics.coordination.giniCoefficient * weights.coordination;
      totalWeight += weights.coordination;
    }

    const invisibleGini = totalWeight > 0 ? weightedScore / totalWeight : null;

    return {
      score: invisibleGini,
      interpretation: invisibleGini ? this._interpretGini(invisibleGini) : 'Not enough data',
      breakdown: {
        anticipation: invisibleMetrics.anticipation?.giniCoefficient || null,
        monitoring: invisibleMetrics.monitoring?.giniCoefficient || null,
        research: invisibleMetrics.research?.giniCoefficient || null,
        coordination: invisibleMetrics.coordination?.giniCoefficient || null
      },
      insight: this._generateInvisibleLaborInsight(invisibleMetrics)
    };
  }

  /**
   * Fair Play Distribution Analysis
   * Are Fair Play cards fully owned (good) or split (bad)?
   */
  analyzeFairPlayDistribution(familyData) {
    const cardOwnership = familyData.fairPlayCardOwnership || {};

    let fullyOwned = 0;
    let splitOwnership = 0;
    let totalCards = Object.keys(cardOwnership).length;

    for (const [cardId, ownership] of Object.entries(cardOwnership)) {
      if (ownership.allThreePhasesOwnedBySamePerson) {
        fullyOwned++;
      } else {
        splitOwnership++;
      }
    }

    const fullOwnershipPercentage = totalCards > 0 ? (fullyOwned / totalCards * 100) : 0;

    return {
      totalCards,
      fullyOwned,
      splitOwnership,
      fullOwnershipPercentage,
      interpretation: this._interpretFairPlayDistribution(fullOwnershipPercentage),
      insight: `${fullyOwned} cards are fully owned (conception + planning + execution by same person), ${splitOwnership} have split ownership. Fair Play methodology recommends 100% full ownership to reduce coordination burden.`,
      recommendation: splitOwnership > 0
        ? `Transfer ${splitOwnership} split-ownership cards to full ownership (all 3 phases to one person)`
        : 'Excellent - all cards have full ownership!'
    };
  }

  /**
   * Household Democracy Index
   * Measures equality in decision-making power
   */
  calculateDemocracyIndex(familyData) {
    const decisions = familyData.decisions || [];

    if (decisions.length === 0) {
      return {
        score: null,
        interpretation: 'Not enough decision data yet'
      };
    }

    // Count decisions by person
    const decisionCounts = {};
    for (const decision of decisions) {
      const decider = decision.decider;
      decisionCounts[decider] = (decisionCounts[decider] || 0) + 1;
    }

    // Calculate Gini for decision-making
    const gini = this.calculateGiniCoefficient(decisionCounts);

    // Also consider: Do both partners have veto power? (qualitative)
    const vetoEquality = familyData.vetoEquality || 'unknown';

    return {
      score: 1 - gini.score,  // Invert: Higher score = more democratic
      giniCoefficient: gini.score,
      interpretation: this._interpretDemocracy(1 - gini.score),
      decisionDistribution: decisionCounts,
      vetoEquality,
      insight: this._generateDemocracyInsight(decisionCounts, gini.score)
    };
  }

  // ============= Interpretation Methods =============

  _interpretGini(gini) {
    if (gini < 0.2) return 'Very equitable';
    if (gini < 0.3) return 'Equitable';
    if (gini < 0.4) return 'Moderately unequal';
    if (gini < 0.6) return 'Unequal';
    return 'Very unequal';
  }

  _interpretTheil(theil) {
    if (theil < 0.1) return 'Very equitable';
    if (theil < 0.2) return 'Equitable';
    if (theil < 0.3) return 'Moderately unequal';
    if (theil < 0.5) return 'Unequal';
    return 'Very unequal';
  }

  _interpretFairPlayDistribution(percentage) {
    if (percentage >= 90) return 'Excellent - minimal coordination burden';
    if (percentage >= 70) return 'Good - some split ownership to address';
    if (percentage >= 50) return 'Fair - significant coordination burden';
    return 'Poor - high coordination burden from split ownership';
  }

  _interpretDemocracy(score) {
    if (score >= 0.8) return 'Very democratic';
    if (score >= 0.6) return 'Democratic';
    if (score >= 0.4) return 'Moderately democratic';
    if (score >= 0.2) return 'Undemocratic';
    return 'Very undemocratic';
  }

  _findCountryComparison(gini) {
    // Compare to country Gini coefficients (income inequality)
    if (gini < 0.25) return 'Denmark (very equal)';
    if (gini < 0.30) return 'Germany (equal)';
    if (gini < 0.35) return 'France (moderately equal)';
    if (gini < 0.40) return 'United Kingdom (moderately unequal)';
    if (gini < 0.45) return 'United States (unequal)';
    return 'South Africa (very unequal)';
  }

  _generateInvisibleLaborInsight(invisibleMetrics) {
    const issues = [];

    if (invisibleMetrics.anticipation?.giniCoefficient > 0.4) {
      issues.push('anticipation burden is very unequal');
    }
    if (invisibleMetrics.monitoring?.giniCoefficient > 0.4) {
      issues.push('monitoring burden is very unequal');
    }
    if (invisibleMetrics.research?.giniCoefficient > 0.4) {
      issues.push('research labor is very unequal');
    }

    if (issues.length === 0) {
      return 'Invisible labor is relatively well-distributed.';
    }

    return `Invisible labor inequality detected: ${issues.join(', ')}. This creates unseen burden that execution metrics don't capture.`;
  }

  _generateDemocracyInsight(decisionCounts, gini) {
    const people = Object.keys(decisionCounts);

    if (people.length < 2) {
      return 'Only one person is making decisions - this is not democratic.';
    }

    const [person1, person2] = people;
    const count1 = decisionCounts[person1];
    const count2 = decisionCounts[person2];

    const ratio = Math.max(count1, count2) / Math.min(count1, count2);

    if (ratio <= 1.5) {
      return `Decision-making is balanced: ${person1} (${count1} decisions) and ${person2} (${count2} decisions). This supports household democracy.`;
    } else {
      return `Decision-making is unbalanced: ${count1 > count2 ? person1 : person2} makes ${ratio.toFixed(1)}x more decisions. Consider rotating decision authority or using Fair Play card system.`;
    }
  }

  _calculateOverallScore(metrics) {
    const weights = {
      gini: 0.3,
      theil: 0.2,
      invisibleLabor: 0.3,
      fairPlay: 0.1,
      democracy: 0.1
    };

    let weightedSum = 0;
    let totalWeight = 0;

    // Gini (invert: lower is better → higher score)
    if (metrics.giniCoefficient.score !== null) {
      weightedSum += (1 - metrics.giniCoefficient.score) * weights.gini;
      totalWeight += weights.gini;
    }

    // Theil (invert and normalize to 0-1)
    if (metrics.theilIndex.score !== null) {
      const maxTheil = Math.log(2);  // Assuming 2 people
      const normalized = 1 - (metrics.theilIndex.score / maxTheil);
      weightedSum += normalized * weights.theil;
      totalWeight += weights.theil;
    }

    // Invisible labor (invert Gini)
    if (metrics.invisibleLaborEquity.score !== null) {
      weightedSum += (1 - metrics.invisibleLaborEquity.score) * weights.invisibleLabor;
      totalWeight += weights.invisibleLabor;
    }

    // Fair Play (already 0-100, normalize to 0-1)
    if (metrics.fairPlayDistribution.fullOwnershipPercentage !== null) {
      weightedSum += (metrics.fairPlayDistribution.fullOwnershipPercentage / 100) * weights.fairPlay;
      totalWeight += weights.fairPlay;
    }

    // Democracy (already 0-1)
    if (metrics.householdDemocracyIndex.score !== null) {
      weightedSum += metrics.householdDemocracyIndex.score * weights.democracy;
      totalWeight += weights.democracy;
    }

    const overallScore = totalWeight > 0 ? (weightedSum / totalWeight * 100) : null;

    return {
      score: overallScore,
      interpretation: this._interpretOverallFairness(overallScore),
      breakdown: {
        gini: metrics.giniCoefficient.score,
        theil: metrics.theilIndex.score,
        invisibleLabor: metrics.invisibleLaborEquity.score,
        fairPlay: metrics.fairPlayDistribution.fullOwnershipPercentage,
        democracy: metrics.householdDemocracyIndex.score
      }
    };
  }

  _interpretOverallFairness(score) {
    if (score === null) return 'Not enough data to calculate';
    if (score >= 80) return 'Very fair household';
    if (score >= 60) return 'Fair household';
    if (score >= 40) return 'Moderately unfair household';
    if (score >= 20) return 'Unfair household';
    return 'Very unfair household';
  }

  _interpretFairness(metrics) {
    const insights = [];

    // Highlight main issues
    if (metrics.giniCoefficient.score > 0.4) {
      insights.push(`Task distribution is unequal (Gini: ${metrics.giniCoefficient.score.toFixed(2)})`);
    }

    if (metrics.invisibleLaborEquity.score > 0.4) {
      insights.push('Invisible labor burden is concentrated on one person');
    }

    if (metrics.fairPlayDistribution.fullOwnershipPercentage < 70) {
      insights.push(`${metrics.fairPlayDistribution.splitOwnership} Fair Play cards have split ownership (creates coordination burden)`);
    }

    if (metrics.householdDemocracyIndex.score < 0.6) {
      insights.push('Decision-making power is unbalanced');
    }

    if (insights.length === 0) {
      return 'Your household has healthy fairness across multiple dimensions. Continue current practices.';
    }

    return `Key fairness issues: ${insights.join(', ')}. These patterns are addressable through Fair Play methodology and task rebalancing.`;
  }

  _generateFairnessRecommendations(metrics) {
    const recommendations = [];

    // High Gini → Rebalance tasks
    if (metrics.giniCoefficient.score > 0.4) {
      recommendations.push({
        priority: 'critical',
        area: 'Task distribution',
        issue: `Gini coefficient of ${metrics.giniCoefficient.score.toFixed(2)} indicates very unequal distribution`,
        action: 'Transfer 3-5 Fair Play cards to balance workload',
        expectedImprovement: 'Reduce Gini to <0.3 (equitable range)'
      });
    }

    // High invisible labor inequality → Make visible
    if (metrics.invisibleLaborEquity.score > 0.4) {
      recommendations.push({
        priority: 'critical',
        area: 'Invisible labor',
        issue: 'Anticipation, monitoring, and research burden is concentrated',
        action: 'Use Fair Play methodology to make invisible work visible and valued',
        expectedImprovement: 'Reduce invisible labor Gini to <0.3'
      });
    }

    // Low Fair Play ownership → Consolidate
    if (metrics.fairPlayDistribution.fullOwnershipPercentage < 70) {
      recommendations.push({
        priority: 'high',
        area: 'Fair Play ownership',
        issue: `${metrics.fairPlayDistribution.splitOwnership} cards have split ownership`,
        action: 'Transfer all 3 phases (conception + planning + execution) to single owner per card',
        expectedImprovement: 'Reduce coordination burden by 50-70%'
      });
    }

    // Low democracy → Balance decisions
    if (metrics.householdDemocracyIndex.score < 0.6) {
      recommendations.push({
        priority: 'medium',
        area: 'Decision-making',
        issue: 'One person makes most decisions',
        action: 'Rotate decision authority by Fair Play card category',
        expectedImprovement: 'Increase democracy index to >0.7'
      });
    }

    return recommendations;
  }
}

export default new FairnessMetricsCalculator();
