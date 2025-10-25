/**
 * PredictiveInsightsService.js
 *
 * Analyzes historical family patterns to predict future needs and detect potential issues.
 * Uses statistical methods and pattern recognition for proactive interventions.
 *
 * Features:
 * - Task creation predictions (when tasks are likely to be created)
 * - Coordination conflict detection (potential bottlenecks)
 * - Anticipation burden forecasting (who will notice tasks)
 * - Burnout risk assessment (cognitive load trends)
 * - Proactive intervention suggestions
 */

import neo4jService from './Neo4jService.js';

class PredictiveInsightsService {
  /**
   * Predict when tasks are likely to be created based on historical patterns
   * Returns predictions for next 7 days with confidence scores
   */
  async predictTaskCreation(familyId, daysAhead = 7) {
    const session = await neo4jService.getSession();

    try {
      // Analyze task creation patterns from last 30 days
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const result = await session.run(`
        MATCH (p:Person)-[:CREATED]->(t:Task)
        WHERE p.familyId = $familyId
          AND datetime(t.createdAt) >= datetime($startDate)
          AND datetime(t.createdAt) <= datetime($endDate)
        WITH datetime(t.createdAt) AS createdTime
        WITH createdTime.dayOfWeek AS dayOfWeek,
             createdTime.hour AS hour,
             count(*) AS frequency
        RETURN dayOfWeek, hour, frequency
        ORDER BY frequency DESC
      `, { familyId, startDate, endDate });

      // Build frequency map by day and hour
      const frequencyMap = {};
      let totalTasks = 0;

      result.records.forEach(record => {
        const day = record.get('dayOfWeek').toNumber();
        const hour = record.get('hour').toNumber();
        const freq = record.get('frequency').toNumber();

        const key = `${day}-${hour}`;
        frequencyMap[key] = freq;
        totalTasks += freq;
      });

      // Generate predictions for next 7 days
      const predictions = [];
      const now = new Date();

      for (let i = 1; i <= daysAhead; i++) {
        const targetDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
        const dayOfWeek = targetDate.getDay() + 1; // 1-7 (Neo4j format)

        // Find peak hours for this day of week
        const dayPattern = [];
        for (let hour = 0; hour < 24; hour++) {
          const key = `${dayOfWeek}-${hour}`;
          const frequency = frequencyMap[key] || 0;
          if (frequency > 0) {
            dayPattern.push({
              hour,
              frequency,
              confidence: frequency / totalTasks
            });
          }
        }

        // Sort by frequency to get peak hours
        dayPattern.sort((a, b) => b.frequency - a.frequency);

        if (dayPattern.length > 0) {
          predictions.push({
            date: targetDate.toISOString().split('T')[0],
            dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][targetDate.getDay()],
            peakHours: dayPattern.slice(0, 3).map(p => ({
              hour: p.hour,
              timeRange: `${p.hour}:00-${p.hour + 1}:00`,
              expectedTasks: Math.round(p.frequency / 4), // Average per week
              confidence: p.confidence
            })),
            totalExpected: Math.round(dayPattern.reduce((sum, p) => sum + p.frequency, 0) / 4),
            confidence: dayPattern[0]?.confidence || 0
          });
        }
      }

      return predictions;
    } finally {
      await session.close();
    }
  }

  /**
   * Detect potential coordination conflicts
   * Identifies situations where multiple people might create conflicting tasks
   */
  async detectCoordinationConflicts(familyId) {
    const session = await neo4jService.getSession();

    try {
      // Find tasks with multiple people involved in different phases
      const result = await session.run(`
        MATCH (p:Person)-[:CREATED]->(t:Task)
        WHERE p.familyId = $familyId
          AND datetime(t.createdAt) >= datetime() - duration({days: 7})

        // Find who executed vs who anticipated
        OPTIONAL MATCH (anticipator:Person)-[:ANTICIPATES]->(t)
        OPTIONAL MATCH (executor:Person)-[:EXECUTES]->(t)

        WITH t, p.name AS creator,
             collect(DISTINCT anticipator.name) AS anticipators,
             collect(DISTINCT executor.name) AS executors
        WHERE size(anticipators) > 1 OR size(executors) > 1

        RETURN t.title AS task,
               t.createdAt AS createdAt,
               creator,
               anticipators,
               executors,
               size(anticipators) + size(executors) AS peopleInvolved
        ORDER BY peopleInvolved DESC
        LIMIT 10
      `, { familyId });

      const conflicts = result.records.map(record => {
        const peopleInvolved = record.get('peopleInvolved').toNumber();

        return {
          task: record.get('task'),
          createdAt: record.get('createdAt'),
          creator: record.get('creator'),
          anticipators: record.get('anticipators'),
          executors: record.get('executors'),
          peopleInvolved,
          severity: peopleInvolved > 3 ? 'high' : peopleInvolved > 2 ? 'medium' : 'low',
          recommendation: this._generateConflictRecommendation(peopleInvolved)
        };
      });

      return conflicts;
    } finally {
      await session.close();
    }
  }

  /**
   * Forecast anticipation burden
   * Predicts who will notice and create tasks based on historical patterns
   */
  async forecastAnticipationBurden(familyId, daysAhead = 7) {
    const session = await neo4jService.getSession();

    try {
      // Analyze task creation by person over last 30 days
      const result = await session.run(`
        MATCH (p:Person)-[:CREATED]->(t:Task)
        WHERE p.familyId = $familyId
          AND datetime(t.createdAt) >= datetime() - duration({days: 30})
        WITH p, count(t) AS tasksCreated
        WITH collect({
          userId: p.userId,
          name: p.name,
          tasksCreated: tasksCreated
        }) AS creators,
        reduce(total = 0, c IN collect(tasksCreated) | total + c) AS totalTasks
        UNWIND creators AS creator
        RETURN creator.userId AS userId,
               creator.name AS name,
               creator.tasksCreated AS tasksCreated,
               toFloat(creator.tasksCreated) / totalTasks AS share
        ORDER BY share DESC
      `, { familyId });

      // Build forecasts based on historical shares
      const forecasts = result.records.map(record => {
        const share = record.get('share');
        const tasksCreated = record.get('tasksCreated').toNumber();
        const avgPerDay = tasksCreated / 30;

        return {
          userId: record.get('userId'),
          name: record.get('name'),
          currentShare: share,
          historicalTasksPerDay: avgPerDay,
          predictedTasksNext7Days: Math.round(avgPerDay * daysAhead),
          burnoutRisk: this._assessBurnoutRisk(share, avgPerDay),
          recommendation: this._generateBurdenRecommendation(share, avgPerDay)
        };
      });

      return forecasts;
    } finally {
      await session.close();
    }
  }

  /**
   * Assess burnout risk based on cognitive load trends
   * Returns individuals at risk of burnout
   */
  async assessBurnoutRisk(familyId) {
    const session = await neo4jService.getSession();

    try {
      // Analyze cognitive load trends over last 14 days
      const result = await session.run(`
        MATCH (p:Person)-[:CREATED]->(t:Task)
        WHERE p.familyId = $familyId
          AND datetime(t.createdAt) >= datetime() - duration({days: 14})
        WITH p,
             date(datetime(t.createdAt)) AS taskDate,
             count(t) AS dailyTasks
        WITH p,
             collect(dailyTasks) AS dailyTaskCounts,
             avg(dailyTasks) AS avgDaily,
             max(dailyTasks) AS maxDaily
        RETURN p.userId AS userId,
               p.name AS name,
               avgDaily,
               maxDaily,
               dailyTaskCounts
      `, { familyId });

      const riskAssessments = result.records.map(record => {
        const avgDaily = Number(record.get('avgDaily'));
        const maxDaily = Number(record.get('maxDaily'));
        const dailyCounts = record.get('dailyTaskCounts').map(c => Number(c));

        // Calculate trend (increasing/decreasing)
        const trend = this._calculateTrend(dailyCounts);

        // Assess risk based on average load, max spike, and trend
        const riskScore = this._calculateBurnoutRiskScore(avgDaily, maxDaily, trend);

        return {
          userId: record.get('userId'),
          name: record.get('name'),
          avgDailyTasks: avgDaily,
          maxDailyTasks: maxDaily,
          trend: trend > 0.1 ? 'increasing' : trend < -0.1 ? 'decreasing' : 'stable',
          trendValue: trend,
          riskScore,
          riskLevel: riskScore > 0.7 ? 'high' : riskScore > 0.4 ? 'medium' : 'low',
          recommendation: this._generateBurnoutRecommendation(riskScore, trend)
        };
      });

      return riskAssessments.filter(r => r.riskLevel !== 'low');
    } finally {
      await session.close();
    }
  }

  /**
   * Generate comprehensive predictive insights summary
   */
  async getPredictiveInsights(familyId, daysAhead = 7) {
    const [
      taskPredictions,
      coordinationConflicts,
      anticipationForecasts,
      burnoutRisks
    ] = await Promise.all([
      this.predictTaskCreation(familyId, daysAhead),
      this.detectCoordinationConflicts(familyId),
      this.forecastAnticipationBurden(familyId, daysAhead),
      this.assessBurnoutRisk(familyId)
    ]);

    // Generate overall recommendations
    const recommendations = this._generateOverallRecommendations(
      taskPredictions,
      coordinationConflicts,
      anticipationForecasts,
      burnoutRisks
    );

    return {
      generatedAt: new Date().toISOString(),
      period: {
        daysAhead,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      taskPredictions,
      coordinationConflicts,
      anticipationForecasts,
      burnoutRisks,
      recommendations
    };
  }

  // Helper methods for risk assessment

  _calculateTrend(dailyCounts) {
    if (dailyCounts.length < 2) return 0;

    // Simple linear regression to detect trend
    const n = dailyCounts.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    dailyCounts.forEach((count, i) => {
      const x = i;
      const y = count.toNumber ? count.toNumber() : count;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  _calculateBurnoutRiskScore(avgDaily, maxDaily, trend) {
    // Risk factors:
    // 1. High average load (normalized to 0-1)
    const avgFactor = Math.min(avgDaily / 10, 1) * 0.4;

    // 2. High spike (max vs avg ratio)
    const spikeFactor = Math.min((maxDaily - avgDaily) / avgDaily, 1) * 0.3;

    // 3. Increasing trend
    const trendFactor = Math.max(trend, 0) * 0.3;

    return avgFactor + spikeFactor + trendFactor;
  }

  _assessBurnoutRisk(share, avgPerDay) {
    if (share > 0.6 && avgPerDay > 5) return 'high';
    if (share > 0.4 && avgPerDay > 3) return 'medium';
    return 'low';
  }

  _generateConflictRecommendation(peopleInvolved) {
    if (peopleInvolved > 3) {
      return 'Consider assigning a single coordinator for this task to reduce overhead';
    } else if (peopleInvolved > 2) {
      return 'Clarify roles to avoid duplication of effort';
    }
    return 'Good coordination - maintain current approach';
  }

  _generateBurdenRecommendation(share, avgPerDay) {
    if (share > 0.6) {
      return 'High anticipation burden - consider redistributing task creation responsibilities';
    } else if (share > 0.4 && avgPerDay > 3) {
      return 'Moderate burden - monitor for signs of overwhelm';
    }
    return 'Anticipation load is balanced';
  }

  _generateBurnoutRecommendation(riskScore, trend) {
    if (riskScore > 0.7) {
      return 'HIGH RISK: Immediate intervention recommended - delegate tasks and schedule downtime';
    } else if (riskScore > 0.4) {
      if (trend > 0.1) {
        return 'INCREASING RISK: Monitor closely and consider preventive measures';
      }
      return 'MODERATE RISK: Review workload distribution';
    }
    return 'Low risk - maintain current balance';
  }

  _generateOverallRecommendations(predictions, conflicts, forecasts, risks) {
    const recommendations = [];

    // High burnout risks
    const highRisks = risks.filter(r => r.riskLevel === 'high');
    if (highRisks.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'burnout',
        title: 'Burnout Risk Detected',
        description: `${highRisks.map(r => r.name).join(', ')} showing signs of high cognitive load`,
        action: 'Redistribute task creation responsibilities immediately'
      });
    }

    // High coordination conflicts
    const highConflicts = conflicts.filter(c => c.severity === 'high');
    if (highConflicts.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'coordination',
        title: 'Coordination Complexity',
        description: `${highConflicts.length} tasks involve 4+ people`,
        action: 'Simplify decision-making by assigning single owners'
      });
    }

    // Unbalanced anticipation burden
    const maxBurden = forecasts.reduce((max, f) =>
      f.currentShare > max ? f.currentShare : max, 0
    );
    if (maxBurden > 0.6) {
      const person = forecasts.find(f => f.currentShare === maxBurden);
      recommendations.push({
        priority: 'medium',
        category: 'equity',
        title: 'Unbalanced Anticipation Load',
        description: `${person.name} notices ${Math.round(maxBurden * 100)}% of tasks`,
        action: 'Encourage other family members to proactively identify needs'
      });
    }

    // Upcoming peak task creation periods
    const peakDays = predictions.filter(p => p.totalExpected > 5);
    if (peakDays.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'planning',
        title: 'Peak Task Creation Periods',
        description: `Expect high activity on ${peakDays.map(p => p.dayOfWeek).join(', ')}`,
        action: 'Plan ahead to reduce last-minute coordination'
      });
    }

    return recommendations;
  }
}

const predictiveInsightsService = new PredictiveInsightsService();

export default predictiveInsightsService;
