/**
 * ChildInsightEngine.js
 *
 * WORLD-CHANGING FEATURE: Deep psychological understanding of children
 * Uses entire knowledge graph (tasks, events, conversations, interviews) to generate
 * insights that help parents understand their children's:
 * - Hidden talents and interests
 * - Emerging challenges before they become problems
 * - Behavioral patterns and triggers
 * - Developmental milestones and progress
 * - Emotional states and needs
 *
 * Research Foundation:
 * - Attachment theory (Bowlby, Ainsworth)
 * - Developmental psychology (Piaget, Erikson)
 * - Positive youth development frameworks
 * - Family systems theory
 *
 * Data Sources:
 * 1. Interview responses (multi-person family interviews)
 * 2. Chat conversations (mentions of child)
 * 3. Calendar events (activities, interests)
 * 4. Tasks (responsibilities, challenges)
 * 5. Parent observations (notes, photos)
 * 6. School communication (grades, teacher feedback)
 */

import neo4jService from '../Neo4jService.js';
import { executeQuery } from '../CypherQueries.js';
import ClaudeService from '../../ClaudeService.js';

class ChildInsightEngine {
  constructor() {
    this.neo4j = neo4jService;
    this.claudeService = new ClaudeService();
  }

  /**
   * Generate comprehensive psychological profile for child
   * This is the "killer feature" - world-changing insights for parents
   */
  async generateChildProfile(familyId, childId) {
    console.log(`🧠 [ChildInsights] Generating deep profile for child ${childId}...`);

    // 1. Gather all data about child from knowledge graph
    const childData = await this._gatherChildData(familyId, childId);

    if (!childData.child) {
      return {
        success: false,
        error: 'Child not found'
      };
    }

    // 2. Analyze behavioral patterns
    const behavioralPatterns = await this._analyzeBehavioralPatterns(childData);

    // 3. Detect hidden talents and interests
    const talents = await this._detectHiddenTalents(childData);

    // 4. Identify emerging challenges
    const challenges = await this._identifyEmergingChallenges(childData);

    // 5. Track developmental milestones
    const milestones = await this._trackDevelopmentalMilestones(childData);

    // 6. Analyze emotional patterns
    const emotionalPatterns = await this._analyzeEmotionalPatterns(childData);

    // 7. Generate natural language insights using Claude
    const narrativeInsights = await this._generateNarrativeInsights({
      child: childData.child,
      behavioral: behavioralPatterns,
      talents,
      challenges,
      milestones,
      emotional: emotionalPatterns
    });

    // 8. Generate actionable recommendations
    const recommendations = await this._generateParentingRecommendations({
      child: childData.child,
      behavioral: behavioralPatterns,
      talents,
      challenges,
      milestones,
      emotional: emotionalPatterns
    });

    return {
      success: true,
      child: childData.child,
      generatedAt: new Date().toISOString(),
      profile: {
        behavioral: behavioralPatterns,
        talents,
        challenges,
        milestones,
        emotional: emotionalPatterns
      },
      insights: narrativeInsights,
      recommendations,
      confidence: this._calculateConfidenceScore(childData)
    };
  }

  /**
   * Gather all knowledge graph data about specific child
   */
  async _gatherChildData(familyId, childId) {
    console.log(`📊 [ChildInsights] Gathering data for child ${childId}...`);

    // Query 1: Get child's basic info
    const childQuery = `
      MATCH (c:Person {id: $childId, familyId: $familyId})
      WHERE c.isParent = false
      RETURN c
    `;

    const childResult = await this.neo4j.runQuery(childQuery, { childId, familyId });
    const child = childResult[0]?.c;

    if (!child) {
      return { child: null };
    }

    // Query 2: Get child's events (interests, activities)
    const eventsQuery = `
      MATCH (c:Person {id: $childId})<-[:INVOLVES]-(e:Event)
      WHERE e.familyId = $familyId
      RETURN e
      ORDER BY e.startTime DESC
      LIMIT 50
    `;

    const events = await this.neo4j.runQuery(eventsQuery, { childId, familyId });

    // Query 3: Get tasks related to child
    const tasksQuery = `
      MATCH (c:Person {id: $childId})<-[:RELATES_TO]-(t:Task)
      WHERE t.familyId = $familyId
      RETURN t
      ORDER BY t.createdAt DESC
      LIMIT 50
    `;

    const tasks = await this.neo4j.runQuery(tasksQuery, { childId, familyId });

    // Query 4: Get parent observations
    const observationsQuery = `
      MATCH (c:Person {id: $childId})<-[:OBSERVES]-(parent:Person)-[:CREATES]->(note:Note)
      WHERE note.familyId = $familyId
      RETURN note, parent
      ORDER BY note.createdAt DESC
      LIMIT 30
    `;

    const observations = await this.neo4j.runQuery(observationsQuery, { childId, familyId });

    // Query 5: Get child's relationships (friends, siblings)
    // FIXED: Move property filter to MATCH pattern (Neo4j 5.x requirement)
    const relationshipsQuery = `
      MATCH (c:Person {id: $childId})-[r]-(other:Person {familyId: $familyId})
      RETURN type(r) AS relationType, other
    `;

    const relationships = await this.neo4j.runQuery(relationshipsQuery, { childId, familyId });

    // TODO: Add interview responses when we have them
    // TODO: Add chat conversation mentions

    return {
      child,
      events: events.map(r => r.e),
      tasks: tasks.map(r => r.t),
      observations: observations.map(r => ({ note: r.note, parent: r.parent })),
      relationships
    };
  }

  /**
   * Analyze behavioral patterns from all data sources
   */
  async _analyzeBehavioralPatterns(childData) {
    const { child, events, tasks, observations } = childData;

    // Analyze activity patterns
    const activityPatterns = this._analyzeActivityPatterns(events);

    // Analyze task completion patterns
    const taskPatterns = this._analyzeTaskPatterns(tasks);

    // Extract patterns from observations
    const observationPatterns = this._extractObservationPatterns(observations);

    return {
      activities: activityPatterns,
      tasks: taskPatterns,
      observations: observationPatterns,
      summary: this._summarizeBehavioralPatterns(activityPatterns, taskPatterns, observationPatterns)
    };
  }

  _analyzeActivityPatterns(events) {
    if (!events || events.length === 0) {
      return {
        interests: [],
        frequency: {},
        timeOfDay: {},
        consistency: 0
      };
    }

    // Extract interests from event titles
    const interests = {};
    const timeOfDay = { morning: 0, afternoon: 0, evening: 0 };
    const daysOfWeek = {};

    events.forEach(event => {
      // Track interests
      const title = event.title?.toLowerCase() || '';
      if (title.includes('soccer') || title.includes('football')) interests.soccer = (interests.soccer || 0) + 1;
      if (title.includes('art') || title.includes('drawing') || title.includes('painting')) interests.art = (interests.art || 0) + 1;
      if (title.includes('music') || title.includes('piano') || title.includes('guitar')) interests.music = (interests.music || 0) + 1;
      if (title.includes('read') || title.includes('library') || title.includes('book')) interests.reading = (interests.reading || 0) + 1;
      if (title.includes('science') || title.includes('stem') || title.includes('experiment')) interests.science = (interests.science || 0) + 1;

      // Track time of day
      if (event.startTime) {
        const hour = new Date(event.startTime).getHours();
        if (hour >= 6 && hour < 12) timeOfDay.morning++;
        else if (hour >= 12 && hour < 18) timeOfDay.afternoon++;
        else timeOfDay.evening++;

        // Track day of week
        const day = new Date(event.startTime).getDay();
        daysOfWeek[day] = (daysOfWeek[day] || 0) + 1;
      }
    });

    // Calculate consistency (standard deviation of day distribution)
    const dayValues = Object.values(daysOfWeek);
    const consistency = dayValues.length > 0
      ? 1 - (this._stdDev(dayValues) / this._mean(dayValues))
      : 0;

    return {
      interests: Object.entries(interests)
        .map(([name, count]) => ({ name, count, percentage: (count / events.length * 100).toFixed(1) }))
        .sort((a, b) => b.count - a.count),
      frequency: {
        weeklyAverage: events.length / 4,  // Assuming ~1 month of data
        mostActiveDay: Object.keys(daysOfWeek).reduce((a, b) => daysOfWeek[a] > daysOfWeek[b] ? a : b)
      },
      timeOfDay,
      consistency: (consistency * 100).toFixed(0)
    };
  }

  _analyzeTaskPatterns(tasks) {
    if (!tasks || tasks.length === 0) {
      return {
        completionRate: 0,
        averageTimeToComplete: 0,
        responsibilities: [],
        challenges: []
      };
    }

    const completed = tasks.filter(t => t.status === 'done');
    const completionRate = (completed.length / tasks.length * 100).toFixed(1);

    // Calculate average time to complete
    const completionTimes = completed
      .filter(t => t.completedAt && t.createdAt)
      .map(t => {
        const created = new Date(t.createdAt);
        const completedDate = new Date(t.completedAt);
        return (completedDate - created) / (1000 * 60 * 60 * 24);  // Days
      });

    const averageTimeToComplete = completionTimes.length > 0
      ? this._mean(completionTimes).toFixed(1)
      : 0;

    // Extract responsibilities
    const responsibilities = tasks
      .filter(t => t.title)
      .map(t => ({
        task: t.title,
        status: t.status,
        priority: t.priority
      }));

    // Identify challenges (tasks that took long or are incomplete)
    const challenges = tasks
      .filter(t => t.status !== 'done' || completionTimes.length > averageTimeToComplete * 2)
      .map(t => t.title);

    return {
      completionRate,
      averageTimeToComplete,
      totalTasks: tasks.length,
      completed: completed.length,
      responsibilities: responsibilities.slice(0, 10),
      challenges: challenges.slice(0, 5)
    };
  }

  _extractObservationPatterns(observations) {
    if (!observations || observations.length === 0) {
      return {
        themes: [],
        sentiment: 'neutral',
        concerns: [],
        strengths: []
      };
    }

    // Simple keyword extraction (production would use NLP)
    const themes = {};
    const concerns = [];
    const strengths = [];

    observations.forEach(obs => {
      const text = obs.note?.content?.toLowerCase() || '';

      // Extract themes
      if (text.includes('school')) themes.school = (themes.school || 0) + 1;
      if (text.includes('friend') || text.includes('social')) themes.social = (themes.social || 0) + 1;
      if (text.includes('emotional') || text.includes('feeling')) themes.emotional = (themes.emotional || 0) + 1;
      if (text.includes('behavior')) themes.behavior = (themes.behavior || 0) + 1;

      // Detect concerns (negative keywords)
      if (text.includes('worry') || text.includes('concern') || text.includes('difficult')) {
        concerns.push(obs.note.content);
      }

      // Detect strengths (positive keywords)
      if (text.includes('great') || text.includes('excel') || text.includes('proud')) {
        strengths.push(obs.note.content);
      }
    });

    return {
      themes: Object.entries(themes)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      totalObservations: observations.length,
      concerns: concerns.slice(0, 5),
      strengths: strengths.slice(0, 5)
    };
  }

  _summarizeBehavioralPatterns(activities, tasks, observations) {
    const topInterest = activities.interests[0]?.name || 'none identified';
    const completionRate = tasks.completionRate || 0;
    const topTheme = observations.themes[0]?.name || 'none';

    return `Shows strong interest in ${topInterest}. Task completion rate: ${completionRate}%. Parent observations focus on ${topTheme}.`;
  }

  /**
   * Detect hidden talents from activity patterns and observations
   */
  async _detectHiddenTalents(childData) {
    const { child, events } = childData;

    // Analyze consistent high-engagement activities
    const activityPatterns = this._analyzeActivityPatterns(events);

    const talents = [];

    // High-frequency activities indicate talent/interest
    activityPatterns.interests.forEach(interest => {
      if (parseInt(interest.percentage) > 20) {  // >20% of activities
        talents.push({
          talent: interest.name,
          evidence: `${interest.count} ${interest.name} activities (${interest.percentage}% of all activities)`,
          confidence: Math.min(parseInt(interest.percentage) / 100, 0.9),
          recommendation: `Consider advanced ${interest.name} classes or mentorship`
        });
      }
    });

    return talents;
  }

  /**
   * Identify emerging challenges before they become problems
   */
  async _identifyEmergingChallenges(childData) {
    const { child, tasks, observations } = childData;

    const challenges = [];

    // Low task completion = executive function challenge
    const taskPatterns = this._analyzeTaskPatterns(tasks);
    if (taskPatterns.completionRate < 60) {
      challenges.push({
        challenge: 'Task completion difficulty',
        severity: taskPatterns.completionRate < 40 ? 'high' : 'medium',
        evidence: `${taskPatterns.completionRate}% completion rate on ${taskPatterns.totalTasks} tasks`,
        recommendation: 'Consider breaking tasks into smaller steps, visual checklists, or ADHD screening'
      });
    }

    // Parent concern mentions
    const obsPatterns = this._extractObservationPatterns(observations);
    if (obsPatterns.concerns.length > 0) {
      challenges.push({
        challenge: 'Parent-identified concerns',
        severity: 'medium',
        evidence: `${obsPatterns.concerns.length} observations with concern keywords`,
        concerns: obsPatterns.concerns,
        recommendation: 'Review specific concerns with pediatrician or child psychologist'
      });
    }

    return challenges;
  }

  /**
   * Track developmental milestones
   */
  async _trackDevelopmentalMilestones(childData) {
    const { child } = childData;

    // Age-appropriate milestone tracking
    const age = child.age || 0;

    const milestones = {
      age,
      expectedMilestones: this._getExpectedMilestones(age),
      // TODO: Track actual milestone achievement from observations
      achieved: [],
      inProgress: [],
      delayed: []
    };

    return milestones;
  }

  _getExpectedMilestones(age) {
    if (age >= 4 && age <= 6) {
      return ['kindergarten readiness', 'basic reading', 'social play', 'emotional regulation'];
    } else if (age >= 7 && age <= 9) {
      return ['reading fluency', 'basic math', 'peer friendships', 'independence'];
    } else if (age >= 10 && age <= 12) {
      return ['abstract thinking', 'self-awareness', 'complex friendships', 'responsibility'];
    } else if (age >= 13 && age <= 15) {
      return ['identity formation', 'peer influence management', 'academic independence', 'future planning'];
    }
    return [];
  }

  /**
   * Analyze emotional patterns from all data
   */
  async _analyzeEmotionalPatterns(childData) {
    const { observations } = childData;

    // Extract emotional keywords from observations
    const emotions = {
      positive: 0,
      neutral: 0,
      negative: 0
    };

    observations.forEach(obs => {
      const text = obs.note?.content?.toLowerCase() || '';

      // Positive emotions
      if (text.includes('happy') || text.includes('excited') || text.includes('proud') || text.includes('joy')) {
        emotions.positive++;
      }
      // Negative emotions
      else if (text.includes('sad') || text.includes('angry') || text.includes('frustrated') || text.includes('anxious')) {
        emotions.negative++;
      }
      // Neutral
      else {
        emotions.neutral++;
      }
    });

    const total = emotions.positive + emotions.neutral + emotions.negative;
    const sentiment = total > 0
      ? emotions.positive / total > 0.6 ? 'predominantly positive'
        : emotions.negative / total > 0.6 ? 'concerning - mostly negative'
          : 'balanced'
      : 'not enough data';

    return {
      sentiment,
      emotionalDistribution: {
        positive: total > 0 ? (emotions.positive / total * 100).toFixed(0) : 0,
        neutral: total > 0 ? (emotions.neutral / total * 100).toFixed(0) : 0,
        negative: total > 0 ? (emotions.negative / total * 100).toFixed(0) : 0
      }
    };
  }

  /**
   * Generate natural language insights using Claude
   */
  async _generateNarrativeInsights(data) {
    const { child, behavioral, talents, challenges, milestones, emotional } = data;

    const prompt = `As a child development expert, generate deep psychological insights about this child:

**Child Profile:**
- Name: ${child.name}
- Age: ${child.age}
- Grade: ${child.grade}

**Behavioral Patterns:**
${JSON.stringify(behavioral, null, 2)}

**Identified Talents:**
${JSON.stringify(talents, null, 2)}

**Emerging Challenges:**
${JSON.stringify(challenges, null, 2)}

**Emotional Patterns:**
${JSON.stringify(emotional, null, 2)}

Generate 3-5 profound insights that help parents deeply understand their child. Focus on:
1. Hidden strengths they might not see
2. Developmental patterns and what they mean
3. How challenges and talents relate
4. What the child might be experiencing emotionally
5. Specific ways to support their growth

Be warm, hopeful, and specific. Avoid generic advice.`;

    try {
      const response = await this.claudeService.sendMessage([{
        role: 'user',
        content: prompt
      }], {
        temperature: 0.7,
        max_tokens: 1500
      });

      return response.content;
    } catch (error) {
      console.error('❌ [ChildInsights] Claude API error:', error);
      return 'Insights generation temporarily unavailable. Please try again.';
    }
  }

  /**
   * Generate actionable parenting recommendations
   */
  async _generateParentingRecommendations(data) {
    const recommendations = [];

    // Talent development recommendations
    data.talents.forEach(talent => {
      recommendations.push({
        priority: 'high',
        category: 'talent_development',
        action: talent.recommendation,
        timeframe: '1-2 months'
      });
    });

    // Challenge mitigation recommendations
    data.challenges.forEach(challenge => {
      recommendations.push({
        priority: challenge.severity === 'high' ? 'critical' : 'medium',
        category: 'challenge_support',
        action: challenge.recommendation,
        timeframe: challenge.severity === 'high' ? 'immediate' : '1-4 weeks'
      });
    });

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  _calculateConfidenceScore(childData) {
    let score = 0;

    // More data = higher confidence
    if (childData.events.length > 10) score += 0.25;
    if (childData.tasks.length > 5) score += 0.25;
    if (childData.observations.length > 5) score += 0.3;
    if (childData.relationships.length > 0) score += 0.2;

    return Math.min(score, 1.0);
  }

  // Statistical helpers
  _mean(values) {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  _stdDev(values) {
    const mean = this._mean(values);
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    return Math.sqrt(this._mean(squareDiffs));
  }
}

export default new ChildInsightEngine();
