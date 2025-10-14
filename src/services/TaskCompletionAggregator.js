// src/services/TaskCompletionAggregator.js
import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import FamilyKnowledgeGraph from './FamilyKnowledgeGraph';

/**
 * Service to aggregate task completion data from various sources
 * for correlation with survey responses
 */
class TaskCompletionAggregator {
  /**
   * Get aggregated task completion data for a family
   * @param {string} familyId - Family ID
   * @param {Date} startDate - Start date for data collection
   * @param {Date} endDate - End date for data collection
   * @returns {Promise<Object>} Aggregated task completion data
   */
  async getTaskCompletionData(familyId, startDate = null, endDate = null) {
    try {
      // Default to last 30 days if no date range provided
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }
      if (!endDate) {
        endDate = new Date();
      }

      // Aggregate data from multiple sources
      const [choreData, kanbanData, knowledgeGraphData] = await Promise.all([
        this.getChoreCompletionData(familyId, startDate, endDate),
        this.getKanbanTaskData(familyId, startDate, endDate),
        this.getKnowledgeGraphCompletions(familyId, startDate, endDate)
      ]);

      // Combine and categorize all task completions
      const aggregatedData = this.aggregateTasksByCategory({
        chores: choreData,
        kanbanTasks: kanbanData,
        knowledgeGraph: knowledgeGraphData
      });

      return aggregatedData;
    } catch (error) {
      console.error("Error aggregating task completion data:", error);
      return {
        byCategory: {},
        byPerson: {},
        byTaskType: {},
        totalTasks: 0,
        dateRange: { startDate, endDate }
      };
    }
  }

  /**
   * Get chore completion data
   * @private
   */
  async getChoreCompletionData(familyId, startDate, endDate) {
    try {
      const choreInstancesRef = collection(db, `families/${familyId}/choreInstances`);
      const q = query(
        choreInstancesRef,
        where("status", "in", ["completed", "approved"]),
        where("completedAt", ">=", Timestamp.fromDate(startDate)),
        where("completedAt", "<=", Timestamp.fromDate(endDate)),
        orderBy("completedAt", "desc")
      );

      const snapshot = await getDocs(q);
      const chores = [];

      for (const doc of snapshot.docs) {
        const choreData = doc.data();
        
        // Get the template to understand the task category
        let choreTemplate = null;
        if (choreData.choreTemplateId) {
          const templateDoc = await this.getChoreTemplate(familyId, choreData.choreTemplateId);
          choreTemplate = templateDoc?.data();
        }

        chores.push({
          id: doc.id,
          title: choreData.title || choreTemplate?.title || "Unknown Chore",
          completedBy: choreData.childId, // Who completed it
          assignedTo: choreData.assignedTo || choreData.childId, // Who it was assigned to
          completedAt: choreData.completedAt?.toDate() || new Date(),
          approvedBy: choreData.approvedBy,
          category: this.categorizeTask(choreTemplate?.title || choreData.title || ""),
          type: 'chore',
          status: choreData.status,
          taskWeight: choreTemplate?.taskWeight || this.estimateTaskWeight(choreData)
        });
      }

      return chores;
    } catch (error) {
      console.error("Error getting chore completion data:", error);
      return [];
    }
  }

  /**
   * Get kanban task completion data
   * @private
   */
  async getKanbanTaskData(familyId, startDate, endDate) {
    try {
      const tasksRef = collection(db, `families/${familyId}/kanbanTasks`);
      const q = query(
        tasksRef,
        where("status", "==", "done"),
        where("completedAt", ">=", Timestamp.fromDate(startDate)),
        where("completedAt", "<=", Timestamp.fromDate(endDate)),
        orderBy("completedAt", "desc")
      );

      const snapshot = await getDocs(q);
      const tasks = [];

      snapshot.forEach(doc => {
        const taskData = doc.data();
        tasks.push({
          id: doc.id,
          title: taskData.title,
          completedBy: taskData.assignedTo, // Kanban assumes assignee completes
          assignedTo: taskData.assignedTo,
          completedAt: taskData.completedAt?.toDate() || new Date(),
          category: taskData.category || this.categorizeTask(taskData.title),
          type: 'kanban',
          priority: taskData.priority,
          taskWeight: taskData.taskWeight || this.estimateTaskWeight(taskData)
        });
      });

      return tasks;
    } catch (error) {
      console.error("Error getting kanban task data:", error);
      return [];
    }
  }

  /**
   * Get task completions from knowledge graph
   * @private
   */
  async getKnowledgeGraphCompletions(familyId, startDate, endDate) {
    try {
      // Get achievements from knowledge graph
      const achievements = await FamilyKnowledgeGraph.getAchievements(
        familyId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      return achievements.map(achievement => ({
        id: achievement.id,
        title: achievement.properties.title,
        completedBy: achievement.properties.completedBy,
        completedAt: new Date(achievement.properties.completedAt),
        category: achievement.properties.taskCategory || this.categorizeTask(achievement.properties.title),
        type: 'achievement',
        source: achievement.properties.source || 'knowledge_graph'
      }));
    } catch (error) {
      console.error("Error getting knowledge graph completions:", error);
      return [];
    }
  }

  /**
   * Get chore template by ID
   * @private
   */
  async getChoreTemplate(familyId, templateId) {
    try {
      const templateRef = collection(db, `families/${familyId}/choreTemplates`);
      const q = query(templateRef, where("id", "==", templateId), limit(1));
      const snapshot = await getDocs(q);
      return snapshot.docs[0];
    } catch (error) {
      console.error("Error getting chore template:", error);
      return null;
    }
  }

  /**
   * Categorize a task based on its title/description
   * @private
   */
  categorizeTask(taskTitle) {
    const title = taskTitle.toLowerCase();
    
    // Categorization logic based on keywords
    if (title.includes('cook') || title.includes('meal') || title.includes('dinner') || 
        title.includes('breakfast') || title.includes('lunch')) {
      return 'Visible Household Tasks';
    }
    
    if (title.includes('plan') || title.includes('schedule') || title.includes('organize') ||
        title.includes('budget') || title.includes('research')) {
      return 'Invisible Household Tasks';
    }
    
    if (title.includes('homework') || title.includes('school') || title.includes('drive') ||
        title.includes('practice') || title.includes('game')) {
      return 'Visible Parental Tasks';
    }
    
    if (title.includes('emotional') || title.includes('comfort') || title.includes('talk') ||
        title.includes('support') || title.includes('worry')) {
      return 'Invisible Parental Tasks';
    }
    
    if (title.includes('clean') || title.includes('laundry') || title.includes('dishes') ||
        title.includes('vacuum') || title.includes('trash')) {
      return 'Visible Household Tasks';
    }
    
    // Default category
    return 'Visible Household Tasks';
  }

  /**
   * Estimate task weight based on task properties
   * @private
   */
  estimateTaskWeight(taskData) {
    let weight = 5; // Base weight
    
    // Adjust based on frequency
    if (taskData.frequency === 'daily') weight += 3;
    else if (taskData.frequency === 'weekly') weight += 1;
    
    // Adjust based on priority
    if (taskData.priority === 'high') weight += 2;
    else if (taskData.priority === 'medium') weight += 1;
    
    // Adjust based on title keywords
    const title = (taskData.title || '').toLowerCase();
    if (title.includes('plan') || title.includes('coordinate')) weight += 2;
    if (title.includes('emotional') || title.includes('support')) weight += 3;
    
    return weight;
  }

  /**
   * Aggregate tasks by category, person, and type
   * @private
   */
  aggregateTasksByCategory(data) {
    const aggregated = {
      byCategory: {},
      byPerson: {},
      byTaskType: {},
      byPersonAndCategory: {},
      totalTasks: 0,
      taskDetails: []
    };

    // Combine all tasks
    const allTasks = [
      ...data.chores,
      ...data.kanbanTasks,
      ...data.knowledgeGraph
    ];

    aggregated.totalTasks = allTasks.length;
    aggregated.taskDetails = allTasks;

    // Aggregate by category
    allTasks.forEach(task => {
      // By category
      if (!aggregated.byCategory[task.category]) {
        aggregated.byCategory[task.category] = {
          total: 0,
          byPerson: {},
          totalWeight: 0
        };
      }
      aggregated.byCategory[task.category].total++;
      aggregated.byCategory[task.category].totalWeight += task.taskWeight || 0;
      
      // By person within category
      const person = task.completedBy || 'Unknown';
      if (!aggregated.byCategory[task.category].byPerson[person]) {
        aggregated.byCategory[task.category].byPerson[person] = {
          count: 0,
          weight: 0
        };
      }
      aggregated.byCategory[task.category].byPerson[person].count++;
      aggregated.byCategory[task.category].byPerson[person].weight += task.taskWeight || 0;

      // By person overall
      if (!aggregated.byPerson[person]) {
        aggregated.byPerson[person] = {
          total: 0,
          byCategory: {},
          totalWeight: 0
        };
      }
      aggregated.byPerson[person].total++;
      aggregated.byPerson[person].totalWeight += task.taskWeight || 0;
      
      if (!aggregated.byPerson[person].byCategory[task.category]) {
        aggregated.byPerson[person].byCategory[task.category] = {
          count: 0,
          weight: 0
        };
      }
      aggregated.byPerson[person].byCategory[task.category].count++;
      aggregated.byPerson[person].byCategory[task.category].weight += task.taskWeight || 0;

      // By task type
      if (!aggregated.byTaskType[task.type]) {
        aggregated.byTaskType[task.type] = 0;
      }
      aggregated.byTaskType[task.type]++;

      // By person and category combined
      const personCategoryKey = `${person}:${task.category}`;
      if (!aggregated.byPersonAndCategory[personCategoryKey]) {
        aggregated.byPersonAndCategory[personCategoryKey] = {
          person,
          category: task.category,
          count: 0,
          weight: 0,
          tasks: []
        };
      }
      aggregated.byPersonAndCategory[personCategoryKey].count++;
      aggregated.byPersonAndCategory[personCategoryKey].weight += task.taskWeight || 0;
      aggregated.byPersonAndCategory[personCategoryKey].tasks.push({
        title: task.title,
        completedAt: task.completedAt,
        weight: task.taskWeight || 0
      });
    });

    // Calculate percentages
    Object.keys(aggregated.byCategory).forEach(category => {
      const categoryData = aggregated.byCategory[category];
      const totalInCategory = categoryData.total;
      
      Object.keys(categoryData.byPerson).forEach(person => {
        const personCount = categoryData.byPerson[person].count;
        categoryData.byPerson[person].percentage = 
          totalInCategory > 0 ? (personCount / totalInCategory * 100).toFixed(1) : 0;
        
        const personWeight = categoryData.byPerson[person].weight;
        categoryData.byPerson[person].weightPercentage = 
          categoryData.totalWeight > 0 ? (personWeight / categoryData.totalWeight * 100).toFixed(1) : 0;
      });
    });

    return aggregated;
  }

  /**
   * Get task completion patterns for specific question categories
   * @param {string} familyId - Family ID
   * @param {Object} surveyResponses - Survey responses to correlate
   * @returns {Promise<Object>} Correlation data
   */
  async getTaskCorrelationData(familyId, surveyResponses) {
    try {
      // Get task completion data for the last 30 days
      const taskData = await this.getTaskCompletionData(familyId);
      
      // Map survey questions to task categories
      const correlationData = {
        matches: [],
        mismatches: [],
        accuracy: {},
        insights: []
      };

      // Analyze each survey response
      Object.entries(surveyResponses).forEach(([questionId, surveyAnswer]) => {
        // Skip if not a Mama/Papa response
        if (surveyAnswer !== 'Mama' && surveyAnswer !== 'Papa') return;

        // Find the question details (would need to be passed in or fetched)
        // For now, we'll use the category from the questionId pattern
        const category = this.inferCategoryFromQuestionId(questionId);
        if (!category) return;

        // Get actual task completion data for this category
        const categoryData = taskData.byCategory[category];
        if (!categoryData) return;

        // Determine who actually does the tasks in this category
        const mamaCount = categoryData.byPerson['Mama']?.count || 0;
        const papaCount = categoryData.byPerson['Papa']?.count || 0;
        const totalCount = mamaCount + papaCount;

        if (totalCount === 0) return;

        const mamaPercentage = (mamaCount / totalCount) * 100;
        const actualPrimaryDoer = mamaPercentage > 60 ? 'Mama' : 
                                 mamaPercentage < 40 ? 'Papa' : 'Shared';

        // Check if survey matches reality
        const isMatch = (surveyAnswer === actualPrimaryDoer) || 
                       (actualPrimaryDoer === 'Shared' && mamaPercentage > 40 && mamaPercentage < 60);

        const correlationEntry = {
          questionId,
          category,
          surveyAnswer,
          actualData: {
            mamaCount,
            papaCount,
            mamaPercentage: mamaPercentage.toFixed(1),
            papaPercentage: ((papaCount / totalCount) * 100).toFixed(1),
            primaryDoer: actualPrimaryDoer
          },
          isMatch
        };

        if (isMatch) {
          correlationData.matches.push(correlationEntry);
        } else {
          correlationData.mismatches.push(correlationEntry);
        }
      });

      // Calculate overall accuracy
      const totalCorrelations = correlationData.matches.length + correlationData.mismatches.length;
      correlationData.accuracy = {
        overall: totalCorrelations > 0 ? 
          ((correlationData.matches.length / totalCorrelations) * 100).toFixed(1) : 0,
        byCategory: this.calculateCategoryAccuracy(correlationData)
      };

      // Generate insights
      correlationData.insights = this.generateCorrelationInsights(correlationData, taskData);

      return correlationData;
    } catch (error) {
      console.error("Error getting task correlation data:", error);
      return {
        matches: [],
        mismatches: [],
        accuracy: { overall: 0, byCategory: {} },
        insights: []
      };
    }
  }

  /**
   * Infer category from question ID pattern
   * @private
   */
  inferCategoryFromQuestionId(questionId) {
    // This is a simplified approach - in production, you'd have a mapping
    const id = questionId.toLowerCase();
    if (id.includes('visible') && id.includes('household')) return 'Visible Household Tasks';
    if (id.includes('invisible') && id.includes('household')) return 'Invisible Household Tasks';
    if (id.includes('visible') && id.includes('parental')) return 'Visible Parental Tasks';
    if (id.includes('invisible') && id.includes('parental')) return 'Invisible Parental Tasks';
    
    // Default based on question number ranges (if using numeric IDs)
    const numId = parseInt(questionId.replace(/\D/g, ''));
    if (numId >= 1 && numId <= 50) return 'Visible Household Tasks';
    if (numId >= 51 && numId <= 100) return 'Invisible Household Tasks';
    if (numId >= 101 && numId <= 150) return 'Visible Parental Tasks';
    if (numId >= 151 && numId <= 200) return 'Invisible Parental Tasks';
    
    return null;
  }

  /**
   * Calculate accuracy by category
   * @private
   */
  calculateCategoryAccuracy(correlationData) {
    const categoryAccuracy = {};
    const allEntries = [...correlationData.matches, ...correlationData.mismatches];

    // Group by category
    const byCategory = {};
    allEntries.forEach(entry => {
      if (!byCategory[entry.category]) {
        byCategory[entry.category] = { matches: 0, total: 0 };
      }
      byCategory[entry.category].total++;
      if (entry.isMatch) byCategory[entry.category].matches++;
    });

    // Calculate accuracy per category
    Object.entries(byCategory).forEach(([category, data]) => {
      categoryAccuracy[category] = data.total > 0 ? 
        ((data.matches / data.total) * 100).toFixed(1) : 0;
    });

    return categoryAccuracy;
  }

  /**
   * Generate insights from correlation data
   * @private
   */
  generateCorrelationInsights(correlationData, taskData) {
    const insights = [];
    const overallAccuracy = parseFloat(correlationData.accuracy.overall);

    // Overall accuracy insight
    if (overallAccuracy >= 80) {
      insights.push({
        type: 'positive',
        message: "Survey responses closely match actual task completion patterns",
        accuracy: overallAccuracy
      });
    } else if (overallAccuracy >= 60) {
      insights.push({
        type: 'neutral',
        message: "Survey responses moderately align with actual behavior",
        accuracy: overallAccuracy,
        recommendation: "Consider reviewing task assignments to better match perceptions"
      });
    } else {
      insights.push({
        type: 'concern',
        message: "Significant gap between perceived and actual task distribution",
        accuracy: overallAccuracy,
        recommendation: "Family meeting recommended to discuss task responsibilities"
      });
    }

    // Category-specific insights
    correlationData.mismatches.forEach(mismatch => {
      if (mismatch.actualData.mamaPercentage > 70 || mismatch.actualData.papaPercentage > 70) {
        insights.push({
          type: 'imbalance',
          category: mismatch.category,
          message: `High imbalance detected in ${mismatch.category}`,
          perception: `Survey says ${mismatch.surveyAnswer} does these tasks`,
          reality: `Actually ${mismatch.actualData.primaryDoer} does ${
            mismatch.actualData.primaryDoer === 'Mama' ? 
            mismatch.actualData.mamaPercentage : mismatch.actualData.papaPercentage
          }% of these tasks`
        });
      }
    });

    // Hidden work insights
    const invisibleCategories = ['Invisible Household Tasks', 'Invisible Parental Tasks'];
    invisibleCategories.forEach(category => {
      const accuracy = correlationData.accuracy.byCategory[category];
      if (accuracy && parseFloat(accuracy) < 50) {
        insights.push({
          type: 'hidden_work',
          category,
          message: `Low awareness of who handles ${category.toLowerCase()}`,
          recommendation: "Invisible work may be going unrecognized"
        });
      }
    });

    return insights;
  }
}

export default new TaskCompletionAggregator();