/**
 * TemporalAnalysisService.js
 *
 * Analyzes family patterns over time for historical visualization and predictions.
 * Aggregates Neo4j data into time-series for trend analysis.
 *
 * Features:
 * - Cognitive load trends (daily, weekly, monthly)
 * - Task creation heat maps (time of day, day of week)
 * - Coordination complexity evolution
 * - Anticipation burden trends
 * - Pattern recurrence detection (e.g., Sunday night surge)
 */

import neo4jService from './Neo4jService.js';

class TemporalAnalysisService {
  /**
   * Get cognitive load trends over time
   * Returns daily cognitive load for each family member over specified period
   */
  async getCognitiveLoadTrends(familyId, startDate, endDate) {
    const session = neo4jService.getSession();

    try {
      // Query tasks created each day, calculate cognitive load
      const result = await session.run(`
        MATCH (p:Person)-[:CREATED]->(t:Task)
        WHERE p.familyId = $familyId
          AND datetime(t.createdAt) >= datetime($startDate)
          AND datetime(t.createdAt) <= datetime($endDate)
        WITH p, date(datetime(t.createdAt)) AS taskDate, collect(t) AS tasks
        WITH p, taskDate,
             size(tasks) AS taskCount,
             reduce(load = 0, task IN tasks | load + coalesce(task.cognitiveLoad, 1)) AS dailyLoad
        RETURN p.name AS person,
               p.userId AS userId,
               toString(taskDate) AS date,
               taskCount,
               dailyLoad
        ORDER BY taskDate, p.name
      `, { familyId, startDate, endDate });

      // Format as time series by person
      const trends = {};

      result.records.forEach(record => {
        const person = record.get('person');
        const userId = record.get('userId');
        const date = record.get('date');
        const taskCount = record.get('taskCount').toNumber();
        const dailyLoad = record.get('dailyLoad');

        if (!trends[userId]) {
          trends[userId] = {
            person,
            userId,
            dataPoints: []
          };
        }

        trends[userId].dataPoints.push({
          date,
          taskCount,
          cognitiveLoad: dailyLoad
        });
      });

      return Object.values(trends);
    } finally {
      await session.close();
    }
  }

  /**
   * Get task creation heat map
   * Returns frequency of task creation by hour of day and day of week
   */
  async getTaskCreationHeatMap(familyId, startDate, endDate) {
    const session = neo4jService.getSession();

    try {
      const result = await session.run(`
        MATCH (p:Person)-[:CREATED]->(t:Task)
        WHERE p.familyId = $familyId
          AND datetime(t.createdAt) >= datetime($startDate)
          AND datetime(t.createdAt) <= datetime($endDate)
        WITH datetime(t.createdAt) AS createdTime
        WITH createdTime.hour AS hour,
             createdTime.dayOfWeek AS dayOfWeek,
             count(*) AS frequency
        RETURN hour, dayOfWeek, frequency
        ORDER BY dayOfWeek, hour
      `, { familyId, startDate, endDate });

      // Format as 7x24 matrix (7 days, 24 hours)
      const heatMap = Array.from({ length: 7 }, () => Array(24).fill(0));
      let maxFrequency = 0;

      result.records.forEach(record => {
        const hour = record.get('hour').toNumber();
        const dayOfWeek = record.get('dayOfWeek').toNumber() - 1; // 1-7 to 0-6
        const frequency = record.get('frequency').toNumber();

        heatMap[dayOfWeek][hour] = frequency;
        maxFrequency = Math.max(maxFrequency, frequency);
      });

      return {
        heatMap,
        maxFrequency,
        dayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        hourLabels: Array.from({ length: 24 }, (_, i) => `${i}:00`)
      };
    } finally {
      await session.close();
    }
  }

  /**
   * Get coordination complexity over time
   * Measures how many people are involved in task chains
   */
  async getCoordinationComplexity(familyId, startDate, endDate) {
    const session = neo4jService.getSession();

    try {
      // Find tasks with blocking relationships, count people involved
      const result = await session.run(`
        MATCH (t:Task)
        WHERE t.familyId = $familyId
          AND datetime(t.createdAt) >= datetime($startDate)
          AND datetime(t.createdAt) <= datetime($endDate)
        OPTIONAL MATCH (t)-[:BLOCKS*1..3]->(blocked:Task)
        WITH date(datetime(t.createdAt)) AS taskDate,
             t,
             count(DISTINCT blocked) AS blockCount
        MATCH (p:Person)-[:CREATED]->(t)
        WITH taskDate, collect(DISTINCT p) AS people, avg(blockCount) AS avgBlocking
        RETURN toString(taskDate) AS date,
               size(people) AS peopleInvolved,
               avgBlocking AS coordinationScore
        ORDER BY taskDate
      `, { familyId, startDate, endDate });

      return result.records.map(record => ({
        date: record.get('date'),
        peopleInvolved: record.get('peopleInvolved').toNumber(),
        coordinationScore: record.get('coordinationScore')
      }));
    } finally {
      await session.close();
    }
  }

  /**
   * Detect recurring patterns (e.g., Sunday night task surge)
   * Returns statistically significant temporal patterns
   */
  async detectRecurringPatterns(familyId, startDate, endDate) {
    const session = neo4jService.getSession();

    try {
      // Analyze task creation by day of week and time of day
      const result = await session.run(`
        MATCH (p:Person)-[:CREATED]->(t:Task)
        WHERE p.familyId = $familyId
          AND datetime(t.createdAt) >= datetime($startDate)
          AND datetime(t.createdAt) <= datetime($endDate)
        WITH datetime(t.createdAt) AS createdTime, t
        WITH createdTime.dayOfWeek AS dayOfWeek,
             createdTime.hour AS hour,
             count(t) AS frequency,
             collect(t.title) AS taskTitles
        RETURN dayOfWeek, hour, frequency, taskTitles
        ORDER BY frequency DESC
        LIMIT 10
      `, { familyId, startDate, endDate });

      const patterns = result.records.map(record => {
        const dayOfWeek = record.get('dayOfWeek').toNumber();
        const hour = record.get('hour').toNumber();
        const frequency = record.get('frequency').toNumber();
        const taskTitles = record.get('taskTitles');

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return {
          pattern: `${dayNames[dayOfWeek - 1]} ${hour}:00-${hour + 1}:00`,
          dayOfWeek: dayOfWeek - 1,
          hour,
          frequency,
          description: `${frequency} tasks typically created on ${dayNames[dayOfWeek - 1]} around ${hour}:00`,
          severity: frequency > 10 ? 'high' : frequency > 5 ? 'medium' : 'low',
          sampleTasks: taskTitles.slice(0, 3)
        };
      });

      return patterns;
    } finally {
      await session.close();
    }
  }

  /**
   * Get anticipation burden trends
   * Tracks who is noticing/creating tasks over time
   */
  async getAnticipationTrends(familyId, startDate, endDate) {
    const session = neo4jService.getSession();

    try {
      const result = await session.run(`
        MATCH (p:Person)-[:CREATED]->(t:Task)
        WHERE p.familyId = $familyId
          AND datetime(t.createdAt) >= datetime($startDate)
          AND datetime(t.createdAt) <= datetime($endDate)
        WITH date(datetime(t.createdAt)) AS taskDate, p, count(t) AS tasksCreated
        WITH taskDate, collect({ person: p.name, userId: p.userId, count: tasksCreated }) AS creators
        WITH taskDate, creators,
             reduce(total = 0, c IN creators | total + c.count) AS totalTasks
        UNWIND creators AS creator
        RETURN toString(taskDate) AS date,
               creator.person AS person,
               creator.userId AS userId,
               creator.count AS tasksCreated,
               toFloat(creator.count) / totalTasks AS anticipationShare
        ORDER BY taskDate, creator.person
      `, { familyId, startDate, endDate });

      // Group by person
      const trends = {};

      result.records.forEach(record => {
        const person = record.get('person');
        const userId = record.get('userId');
        const date = record.get('date');
        const tasksCreated = record.get('tasksCreated').toNumber();
        const share = record.get('anticipationShare');

        if (!trends[userId]) {
          trends[userId] = {
            person,
            userId,
            dataPoints: []
          };
        }

        trends[userId].dataPoints.push({
          date,
          tasksCreated,
          anticipationShare: share
        });
      });

      return Object.values(trends);
    } finally {
      await session.close();
    }
  }

  /**
   * Get comprehensive temporal summary
   * Returns all temporal analyses in one call
   */
  async getTemporalSummary(familyId, daysBack = 30) {
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    const [
      cognitiveLoadTrends,
      taskCreationHeatMap,
      coordinationComplexity,
      recurringPatterns,
      anticipationTrends
    ] = await Promise.all([
      this.getCognitiveLoadTrends(familyId, startDate, endDate),
      this.getTaskCreationHeatMap(familyId, startDate, endDate),
      this.getCoordinationComplexity(familyId, startDate, endDate),
      this.detectRecurringPatterns(familyId, startDate, endDate),
      this.getAnticipationTrends(familyId, startDate, endDate)
    ]);

    return {
      period: {
        startDate,
        endDate,
        daysBack
      },
      cognitiveLoadTrends,
      taskCreationHeatMap,
      coordinationComplexity,
      recurringPatterns,
      anticipationTrends
    };
  }
}

const temporalAnalysisService = new TemporalAnalysisService();

export default temporalAnalysisService;
