/**
 * TemporalPatternDetector.js
 *
 * Detects time-based patterns in family behavior:
 * - Sunday night planning spike
 * - Morning/evening rushes
 * - Seasonal patterns (back-to-school, holidays)
 * - Day-of-week variations
 * - Recurring stress points
 *
 * Research Foundation:
 * - Time-series analysis
 * - Circadian family rhythms (Presser, 2003)
 * - Mental load temporal dynamics
 *
 * Insights Enabled:
 * - "You create 68% of tasks on Sunday nights" (invisible planning labor)
 * - "Mondays have 3x more conflicts than other days"
 * - "Back-to-school months show 40% increase in coordination burden"
 */

import neo4jService from '../Neo4jService.js';

class TemporalPatternDetector {
  constructor() {
    this.neo4j = neo4jService;
  }

  /**
   * Analyze all temporal patterns for family
   */
  async analyzeTemporalPatterns(familyId) {
    console.log(`⏰ [TemporalPatterns] Analyzing temporal patterns for family ${familyId}...`);

    const [
      taskCreationPatterns,
      eventPatterns,
      stressPatterns,
      seasonalPatterns,
      weeklyRhythms
    ] = await Promise.all([
      this.analyzeTaskCreationPatterns(familyId),
      this.analyzeEventPatterns(familyId),
      this.detectStressPatterns(familyId),
      this.detectSeasonalPatterns(familyId),
      this.analyzeWeeklyRhythms(familyId)
    ]);

    return {
      familyId,
      generatedAt: new Date().toISOString(),
      taskCreation: taskCreationPatterns,
      events: eventPatterns,
      stress: stressPatterns,
      seasonal: seasonalPatterns,
      weekly: weeklyRhythms,
      summary: this._generateTemporalSummary({
        taskCreation: taskCreationPatterns,
        events: eventPatterns,
        stress: stressPatterns,
        seasonal: seasonalPatterns,
        weekly: weeklyRhythms
      })
    };
  }

  /**
   * Analyze when tasks are created (Sunday night spike detection)
   */
  async analyzeTaskCreationPatterns(familyId) {
    console.log(`📋 [TemporalPatterns] Analyzing task creation patterns...`);

    const query = `
      MATCH (t:Task {familyId: $familyId})
      WHERE t.createdAt IS NOT NULL
      RETURN t.createdAt AS timestamp, t.id AS taskId, t.title
      ORDER BY t.createdAt ASC
    `;

    const results = await this.neo4j.runQuery(query, { familyId });

    if (!results || results.length === 0) {
      return {
        dayOfWeek: {},
        hourOfDay: {},
        insight: 'Not enough task data to detect creation patterns yet.',
        sundayNightSpike: false
      };
    }

    // Analyze by day of week
    const dayOfWeek = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };  // Sunday = 0
    const hourOfDay = {};

    results.forEach(r => {
      const date = new Date(r.timestamp);
      const day = date.getDay();
      const hour = date.getHours();

      dayOfWeek[day]++;
      hourOfDay[hour] = (hourOfDay[hour] || 0) + 1;
    });

    // Detect Sunday night spike (Sunday 6pm-11pm)
    const sundayNight = results.filter(r => {
      const date = new Date(r.timestamp);
      return date.getDay() === 0 && date.getHours() >= 18 && date.getHours() <= 23;
    }).length;

    const totalTasks = results.length;
    const sundayNightPercentage = (sundayNight / totalTasks * 100).toFixed(1);
    const sundayNightSpike = sundayNightPercentage > 20;  // >20% on Sunday night

    // Find peak day
    const peakDay = Object.entries(dayOfWeek).reduce((max, [day, count]) =>
      count > max.count ? { day: parseInt(day), count } : max
    , { day: 0, count: 0 });

    // Find peak hour
    const peakHour = Object.entries(hourOfDay).reduce((max, [hour, count]) =>
      count > max.count ? { hour: parseInt(hour), count } : max
    , { hour: 0, count: 0 });

    return {
      dayOfWeek: this._convertDayOfWeekToLabels(dayOfWeek),
      hourOfDay,
      peakDay: {
        day: this._dayName(peakDay.day),
        count: peakDay.count,
        percentage: (peakDay.count / totalTasks * 100).toFixed(1)
      },
      peakHour: {
        hour: peakHour.hour,
        count: peakHour.count,
        percentage: (peakHour.count / totalTasks * 100).toFixed(1),
        label: this._hourLabel(peakHour.hour)
      },
      sundayNightSpike,
      sundayNightPercentage,
      insight: this._generateTaskCreationInsight({
        peakDay,
        peakHour,
        sundayNightSpike,
        sundayNightPercentage,
        totalTasks
      })
    };
  }

  /**
   * Analyze event patterns (when are activities scheduled?)
   */
  async analyzeEventPatterns(familyId) {
    console.log(`📅 [TemporalPatterns] Analyzing event patterns...`);

    const query = `
      MATCH (e:Event {familyId: $familyId})
      WHERE e.startTime IS NOT NULL
      RETURN e.startTime AS timestamp, e.title, e.id
      ORDER BY e.startTime ASC
    `;

    const results = await this.neo4j.runQuery(query, { familyId });

    if (!results || results.length === 0) {
      return {
        dayOfWeek: {},
        timeOfDay: {},
        insight: 'Not enough event data to detect patterns yet.'
      };
    }

    const dayOfWeek = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    const timeOfDay = {
      earlyMorning: 0,    // 6am-9am
      lateMorning: 0,     // 9am-12pm
      afternoon: 0,       // 12pm-5pm
      evening: 0,         // 5pm-9pm
      night: 0            // 9pm-midnight
    };

    results.forEach(r => {
      const date = new Date(r.timestamp);
      const day = date.getDay();
      const hour = date.getHours();

      dayOfWeek[day]++;

      if (hour >= 6 && hour < 9) timeOfDay.earlyMorning++;
      else if (hour >= 9 && hour < 12) timeOfDay.lateMorning++;
      else if (hour >= 12 && hour < 17) timeOfDay.afternoon++;
      else if (hour >= 17 && hour < 21) timeOfDay.evening++;
      else if (hour >= 21 && hour < 24) timeOfDay.night++;
    });

    const totalEvents = results.length;

    // Find busiest day
    const busiestDay = Object.entries(dayOfWeek).reduce((max, [day, count]) =>
      count > max.count ? { day: parseInt(day), count } : max
    , { day: 0, count: 0 });

    // Find busiest time of day
    const busiestTime = Object.entries(timeOfDay).reduce((max, [time, count]) =>
      count > max.count ? { time, count } : max
    , { time: 'afternoon', count: 0 });

    return {
      dayOfWeek: this._convertDayOfWeekToLabels(dayOfWeek),
      timeOfDay,
      busiestDay: {
        day: this._dayName(busiestDay.day),
        count: busiestDay.count,
        percentage: (busiestDay.count / totalEvents * 100).toFixed(1)
      },
      busiestTime: {
        time: busiestTime.time,
        count: busiestTime.count,
        percentage: (busiestTime.count / totalEvents * 100).toFixed(1)
      },
      insight: this._generateEventPatternInsight({
        busiestDay,
        busiestTime,
        totalEvents
      })
    };
  }

  /**
   * Detect recurring stress patterns
   */
  async detectStressPatterns(familyId) {
    console.log(`😰 [TemporalPatterns] Detecting stress patterns...`);

    // Query for monitoring actions (indicator of stress)
    const query = `
      MATCH (p:Person)-[m:MONITORS]->(t:Task)
      WHERE p.familyId = $familyId AND m.timestamp IS NOT NULL
      RETURN m.timestamp AS timestamp, p.name AS person, t.title AS task
      ORDER BY m.timestamp ASC
    `;

    const results = await this.neo4j.runQuery(query, { familyId });

    if (!results || results.length === 0) {
      return {
        dayOfWeek: {},
        insight: 'Not enough monitoring data to detect stress patterns yet.'
      };
    }

    const dayOfWeek = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    results.forEach(r => {
      const date = new Date(r.timestamp);
      const day = date.getDay();
      dayOfWeek[day]++;
    });

    const totalMonitoring = results.length;

    // Find highest stress day
    const highestStressDay = Object.entries(dayOfWeek).reduce((max, [day, count]) =>
      count > max.count ? { day: parseInt(day), count } : max
    , { day: 0, count: 0 });

    return {
      dayOfWeek: this._convertDayOfWeekToLabels(dayOfWeek),
      highestStressDay: {
        day: this._dayName(highestStressDay.day),
        count: highestStressDay.count,
        percentage: (highestStressDay.count / totalMonitoring * 100).toFixed(1)
      },
      insight: this._generateStressPatternInsight({
        highestStressDay,
        totalMonitoring
      })
    };
  }

  /**
   * Detect seasonal patterns (back-to-school, holidays)
   */
  async detectSeasonalPatterns(familyId) {
    console.log(`🍂 [TemporalPatterns] Detecting seasonal patterns...`);

    // Query for tasks/events by month
    const query = `
      MATCH (t:Task {familyId: $familyId})
      WHERE t.createdAt IS NOT NULL
      RETURN t.createdAt AS timestamp
      ORDER BY t.createdAt ASC
    `;

    const results = await this.neo4j.runQuery(query, { familyId });

    if (!results || results.length === 0) {
      return {
        monthlyDistribution: {},
        insight: 'Not enough data to detect seasonal patterns yet.'
      };
    }

    const monthlyDistribution = {};

    results.forEach(r => {
      const date = new Date(r.timestamp);
      const month = date.getMonth();  // 0-11
      monthlyDistribution[month] = (monthlyDistribution[month] || 0) + 1;
    });

    const totalTasks = results.length;

    // Detect back-to-school spike (August/September)
    const augustSeptemberTasks = (monthlyDistribution[7] || 0) + (monthlyDistribution[8] || 0);
    const backToSchoolSpike = augustSeptemberTasks / totalTasks > 0.25;  // >25% in Aug/Sept

    // Detect holiday spike (November/December)
    const novemberDecemberTasks = (monthlyDistribution[10] || 0) + (monthlyDistribution[11] || 0);
    const holidaySpike = novemberDecemberTasks / totalTasks > 0.25;

    return {
      monthlyDistribution: this._convertMonthsToLabels(monthlyDistribution),
      backToSchoolSpike,
      holidaySpike,
      insight: this._generateSeasonalInsight({
        backToSchoolSpike,
        holidaySpike,
        monthlyDistribution
      })
    };
  }

  /**
   * Analyze weekly rhythms and patterns
   */
  async analyzeWeeklyRhythms(familyId) {
    console.log(`📆 [TemporalPatterns] Analyzing weekly rhythms...`);

    // Combine task creation + events to see full weekly rhythm
    const taskQuery = `
      MATCH (t:Task {familyId: $familyId})
      WHERE t.createdAt IS NOT NULL
      RETURN t.createdAt AS timestamp, 'task' AS type
    `;

    const eventQuery = `
      MATCH (e:Event {familyId: $familyId})
      WHERE e.startTime IS NOT NULL
      RETURN e.startTime AS timestamp, 'event' AS type
    `;

    const [tasks, events] = await Promise.all([
      this.neo4j.runQuery(taskQuery, { familyId }),
      this.neo4j.runQuery(eventQuery, { familyId })
    ]);

    const allActivities = [...tasks, ...events];

    if (allActivities.length === 0) {
      return {
        weeklyRhythm: {},
        insight: 'Not enough data to analyze weekly rhythms yet.'
      };
    }

    const dayOfWeek = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

    allActivities.forEach(a => {
      const date = new Date(a.timestamp);
      const day = date.getDay();
      dayOfWeek[day]++;
    });

    const totalActivities = allActivities.length;

    // Calculate weekly rhythm (standard deviation of activity across days)
    const dayValues = Object.values(dayOfWeek);
    const mean = dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
    const variance = dayValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dayValues.length;
    const stdDev = Math.sqrt(variance);
    const rhythmScore = stdDev / mean;  // Higher = more variation across days

    return {
      weeklyRhythm: this._convertDayOfWeekToLabels(dayOfWeek),
      rhythmScore: rhythmScore.toFixed(2),
      interpretation: rhythmScore > 0.5 ? 'highly variable' : rhythmScore > 0.3 ? 'moderately variable' : 'consistent',
      insight: this._generateWeeklyRhythmInsight({
        dayOfWeek,
        rhythmScore,
        totalActivities
      })
    };
  }

  // ============= Helper Methods =============

  _dayName(day) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }

  _hourLabel(hour) {
    if (hour >= 6 && hour < 9) return 'early morning';
    if (hour >= 9 && hour < 12) return 'late morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21 && hour < 24) return 'night';
    return 'overnight';
  }

  _convertDayOfWeekToLabels(dayOfWeek) {
    return {
      Sunday: dayOfWeek[0],
      Monday: dayOfWeek[1],
      Tuesday: dayOfWeek[2],
      Wednesday: dayOfWeek[3],
      Thursday: dayOfWeek[4],
      Friday: dayOfWeek[5],
      Saturday: dayOfWeek[6]
    };
  }

  _convertMonthsToLabels(monthlyDistribution) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const labeled = {};
    months.forEach((month, index) => {
      labeled[month] = monthlyDistribution[index] || 0;
    });
    return labeled;
  }

  _generateTaskCreationInsight(data) {
    const { peakDay, peakHour, sundayNightSpike, sundayNightPercentage, totalTasks } = data;

    let insight = `Tasks are most often created on ${this._dayName(peakDay.day)} (${peakDay.count} tasks, ${(peakDay.count / totalTasks * 100).toFixed(0)}%)`;

    if (sundayNightSpike) {
      insight += `, with a significant Sunday night planning spike (${sundayNightPercentage}% of all tasks created Sunday 6pm-11pm). This indicates invisible planning labor concentrated at week's end.`;
    } else {
      insight += `. Peak creation hour: ${this._hourLabel(peakHour.hour)} (${peakHour.count} tasks).`;
    }

    return insight;
  }

  _generateEventPatternInsight(data) {
    const { busiestDay, busiestTime, totalEvents } = data;

    return `Events concentrate on ${this._dayName(busiestDay.day)} (${busiestDay.count} events, ${(busiestDay.count / totalEvents * 100).toFixed(0)}%), mostly during ${busiestTime.time} (${(busiestTime.count / totalEvents * 100).toFixed(0)}% of events). This shows your family's activity rhythm.`;
  }

  _generateStressPatternInsight(data) {
    const { highestStressDay, totalMonitoring } = data;

    return `Monitoring burden peaks on ${this._dayName(highestStressDay.day)} (${highestStressDay.count} follow-up actions, ${(highestStressDay.count / totalMonitoring * 100).toFixed(0)}% of all monitoring). This suggests ${this._dayName(highestStressDay.day)} is highest stress day.`;
  }

  _generateSeasonalInsight(data) {
    const { backToSchoolSpike, holidaySpike } = data;

    const spikes = [];
    if (backToSchoolSpike) spikes.push('back-to-school (August/September)');
    if (holidaySpike) spikes.push('holiday season (November/December)');

    if (spikes.length === 0) {
      return 'Task creation is relatively consistent year-round.';
    }

    return `Task creation spikes during ${spikes.join(' and ')}, indicating increased coordination burden during these periods.`;
  }

  _generateWeeklyRhythmInsight(data) {
    const { dayOfWeek, rhythmScore, totalActivities } = data;

    const busiestDay = Object.entries(dayOfWeek).reduce((max, [day, count]) =>
      count > max.count ? { day: parseInt(day), count } : max
    , { day: 0, count: 0 });

    const quietestDay = Object.entries(dayOfWeek).reduce((min, [day, count]) =>
      count < min.count && count > 0 ? { day: parseInt(day), count } : min
    , { day: 0, count: Infinity });

    if (rhythmScore > 0.5) {
      return `Highly variable weekly rhythm (score: ${rhythmScore}). ${this._dayName(busiestDay.day)} is ${(busiestDay.count / quietestDay.count).toFixed(1)}x busier than ${this._dayName(quietestDay.day)}. This variation may create stress.`;
    } else {
      return `Consistent weekly rhythm (score: ${rhythmScore}). Activities are evenly distributed across the week, reducing overwhelm.`;
    }
  }

  _generateTemporalSummary(data) {
    const insights = [];

    if (data.taskCreation.sundayNightSpike) {
      insights.push(`Sunday night planning spike (${data.taskCreation.sundayNightPercentage}% of tasks)`);
    }

    if (data.seasonal.backToSchoolSpike) {
      insights.push('back-to-school coordination surge');
    }

    if (data.weekly.rhythmScore > 0.5) {
      insights.push('highly variable weekly rhythm');
    }

    if (insights.length === 0) {
      return 'Your family has relatively consistent temporal patterns - no major spikes or stress points detected.';
    }

    return `Temporal patterns detected: ${insights.join(', ')}. These patterns reveal when invisible labor concentrates.`;
  }
}

export default new TemporalPatternDetector();
