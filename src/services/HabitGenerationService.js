// src/services/HabitGenerationService.js
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import ClaudeService from './ClaudeService';
import ELORatingService from './ELORatingService';

/**
 * Service for generating personalized habit recommendations
 * using Claude AI based on family survey data
 */
class HabitGenerationService {
  /**
   * Generate personalized habits for a family member based on survey data
   * @param {string} familyId - The family ID
   * @param {object} familyMember - The family member object
   * @param {object} surveyData - Survey responses
   * @param {object} weightedScores - Category balance scores
   * @returns {Promise<Array>} - Array of generated habits
   */
  async generatePersonalizedHabits(familyId, familyMember, surveyData, weightedScores) {
    try {
      console.log(`Generating personalized habits for ${familyMember.name} in family ${familyId}`);
      
      // First check if we have cached habits
      const cachedHabits = await this.getCachedHabits(familyId, familyMember.id);
      if (cachedHabits && cachedHabits.length > 0) {
        console.log("Using cached habits for", familyMember.name);
        return cachedHabits;
      }
      
      // NEW: Get task-level imbalances with weight data
      let taskImbalances = {};
      let eloRecommendations = [];
      try {
        taskImbalances = await ELORatingService.getTaskImbalances(familyId);
        eloRecommendations = await ELORatingService.getTaskRecommendations(familyId);
      } catch (error) {
        console.log("Could not fetch ELO data, continuing with basic imbalances");
      }
      
      // Extract category-level imbalances
      const categoryImbalances = this.extractImbalances(weightedScores);
      
      // NEW: Identify high-weight imbalanced tasks
      const highWeightTasks = this.identifyHighWeightImbalancedTasks(taskImbalances, categoryImbalances);
      
      // Extract relevant data for habit generation
      const familyData = {
        memberName: familyMember.name,
        memberRole: familyMember.role,
        memberRoleType: familyMember.roleType || (familyMember.role === 'parent' ? 'Papa' : 'Child'),
        surveyResponses: surveyData || {},
        imbalances: categoryImbalances,
        highWeightTasks: highWeightTasks,
        eloRecommendations: eloRecommendations
      };
      
      // Generate habits using Claude with enhanced data
      const generatedHabits = await this.useClaudeToGenerateHabits(familyData);
      
      // Cache the generated habits for future use
      await this.cacheHabits(familyId, familyMember.id, generatedHabits);
      
      return generatedHabits;
    } catch (error) {
      console.error("Error generating personalized habits:", error);
      // Return empty array - users should select from Allie or radar chart
      return [];
    }
  }
  
  /**
   * Extract imbalances from weighted scores
   * @param {object} weightedScores - Category balance scores
   * @returns {Array} - Array of imbalance objects
   */
  extractImbalances(weightedScores) {
    if (!weightedScores || !weightedScores.categoryBalance) {
      return [];
    }
    
    const imbalances = [];
    
    // Convert category balance to array of imbalance objects
    Object.entries(weightedScores.categoryBalance).forEach(([category, scores]) => {
      const imbalanceObj = {
        category,
        imbalance: scores.imbalance || 0,
        dominantRole: scores.mama > scores.papa ? "Mama" : "Papa",
        scores: {
          mama: scores.mama || 0,
          papa: scores.papa || 0
        }
      };
      
      imbalances.push(imbalanceObj);
    });
    
    // Sort by imbalance (highest first)
    return imbalances.sort((a, b) => b.imbalance - a.imbalance);
  }
  
  /**
   * Identify high-weight imbalanced tasks that should be prioritized for habits
   * @param {object} taskImbalances - Task-level imbalances from ELO service
   * @param {Array} categoryImbalances - Category-level imbalances
   * @returns {Array} - Array of high-priority tasks for habit creation
   */
  identifyHighWeightImbalancedTasks(taskImbalances, categoryImbalances) {
    const highWeightTasks = [];
    
    // If we don't have task imbalances, return empty array
    if (!taskImbalances || Object.keys(taskImbalances).length === 0) {
      return highWeightTasks;
    }
    
    // Get top imbalanced categories
    const topCategories = categoryImbalances.slice(0, 3).map(c => c.category);
    
    // Find high-weight tasks in imbalanced categories
    Object.entries(taskImbalances).forEach(([taskType, data]) => {
      // Check if task is in a top imbalanced category
      if (topCategories.includes(data.category)) {
        // Extract task weight from the data or estimate it
        const taskWeight = data.weight || this.estimateTaskWeight(taskType, data);
        
        // Consider tasks with significant imbalance and high weight
        if (data.score > 50 && taskWeight > 7) {
          highWeightTasks.push({
            taskType: taskType,
            category: data.category,
            weight: taskWeight,
            imbalanceScore: data.score,
            leader: data.leader,
            impactScore: taskWeight * data.score, // Combined metric
            mamaRating: data.mamaRating,
            papaRating: data.papaRating,
            isUncovered: data.isUncovered || false
          });
        }
      }
    });
    
    // Sort by impact score (weight × imbalance)
    return highWeightTasks.sort((a, b) => b.impactScore - a.impactScore).slice(0, 5);
  }
  
  /**
   * Estimate task weight based on task characteristics
   * @param {string} taskType - The task description
   * @param {object} taskData - Task data from ELO service
   * @returns {number} - Estimated weight
   */
  estimateTaskWeight(taskType, taskData) {
    // Base weight estimation based on task characteristics
    let weight = 5; // Default average
    
    // Daily tasks get higher weight
    if (taskType.toLowerCase().includes('daily') || 
        taskType.toLowerCase().includes('every day')) {
      weight *= 1.5;
    }
    
    // Invisible tasks get higher weight
    if (taskType.toLowerCase().includes('planning') ||
        taskType.toLowerCase().includes('organizing') ||
        taskType.toLowerCase().includes('mental') ||
        taskType.toLowerCase().includes('thinking')) {
      weight *= 1.35;
    }
    
    // Childcare tasks get higher weight
    if (taskType.toLowerCase().includes('child') ||
        taskType.toLowerCase().includes('kid') ||
        taskType.toLowerCase().includes('school')) {
      weight *= 1.2;
    }
    
    return Math.min(weight, 14); // Cap at maximum weight
  }
  
  /**
   * Use Claude to generate personalized habits with detailed explanations
   * @param {object} familyData - Family and member data
   * @returns {Promise<Array>} - Array of generated habits
   */
  async useClaudeToGenerateHabits(familyData) {
    try {
      const { memberName, memberRole, memberRoleType, surveyResponses, imbalances, highWeightTasks, eloRecommendations } = familyData;
      
      // Prepare data for Claude prompt
      const topImbalances = imbalances.slice(0, 3);
      const topImbalanceCategories = topImbalances.map(i => i.category).join(", ");
      const dominantRole = topImbalances.length > 0 ? topImbalances[0].dominantRole : "unknown";
      
      // Get survey highlights
      const surveyHighlights = this.extractSurveyHighlights(surveyResponses);
      
      // NEW: Prepare high-weight task information
      const highWeightTaskInfo = highWeightTasks.length > 0 ? 
        highWeightTasks.slice(0, 3).map(task => 
          `- ${task.taskType} (Weight: ${task.weight.toFixed(1)}, Imbalance: ${task.imbalanceScore}, Currently done by: ${task.leader})`
        ).join("\n") : 
        "No specific high-weight tasks identified";
      
      // NEW: Include ELO recommendations if available
      const eloRecommendationInfo = eloRecommendations.length > 0 ?
        eloRecommendations.slice(0, 2).map(rec => 
          `- ${rec.suggestion} (${rec.category}, Severity: ${rec.severity})`
        ).join("\n") :
        "No specific ELO recommendations available";
      
      // Construct Claude prompt
      const prompt = `
You are a family balance expert helping to create personalized habit recommendations for parents to improve their work-life balance.

Create ONE highly specific, actionable habit that will help balance the family workload. Focus on high-weight tasks that create the most burden when imbalanced.

USER DETAILS:
- Parent Name: ${memberName}
- Role: ${memberRoleType || 'Parent'}
- Most imbalanced categories: ${topImbalanceCategories || 'Unknown'}
- Dominant parent handling more work: ${dominantRole}

HIGH-WEIGHT IMBALANCED TASKS (These create the most burden):
${highWeightTaskInfo}

ELO-BASED RECOMMENDATIONS:
${eloRecommendationInfo}

SURVEY INSIGHTS:
${surveyHighlights.join("\n")}

CREATE ONE HABIT with these components:
1. Title: 3-5 word specific, catchy habit name
2. Description: 1-2 sentence description of what the habit is and why it helps
3. Cue: A specific time/context when the habit should be triggered
4. Routine: The actual behavior to perform (very specific, not vague)
5. Reward: The immediate benefit the parent will experience
6. Identity Statement: "I am someone who..." statement that reinforces the habit
7. Explanation: A personalized 2-3 sentence explanation of why this habit was selected based on the family's specific imbalances and survey data. Should explain how this habit addresses their specific challenges.
8. Research: One brief evidence-based statement about how this type of habit helps families (with a specific percentage or statistic if possible).

IMPORTANT FORMATTING:
- Format your response as JSON only
- Include: title, description, cue, routine, reward, identityStatement, explanation, research
- Make the habit EXTREMELY specific and actionable
- PRIORITIZE habits that address high-weight tasks (daily, invisible, emotional labor tasks)
- Focus on redistributing the heaviest burden tasks, not just any tasks
- Make the explanation reference specific high-weight tasks from the data
- For the research, include a specific percentage or metric about task weight impact

Example format (but with YOUR unique content):
{
  "title": "Morning Task Delegation",
  "description": "A quick morning routine to distribute household responsibilities more evenly among family members",
  "cue": "During breakfast preparation",
  "routine": "Identify 2-3 household tasks and explicitly assign them to family members",
  "reward": "Mental relief from reduced responsibility load and clearer expectations",
  "identityStatement": "I am someone who creates family balance through clear communication",
  "explanation": "This habit addresses the 35% imbalance in household task management currently falling more on you. By implementing a structured delegation approach, you'll redistribute responsibilities more evenly.",
  "research": "Families who practice explicit task delegation see a 27% reduction in mental load and a 32% improvement in perceived fairness of household management."
}
`;

      // Call Claude to generate the habit
      const response = await ClaudeService.getCompletion(prompt, { 
        temperature: 0.7,
        responseFormat: { type: "json_object" }
      });
      
      // Parse the response
      let habit;
      try {
        // First, try to clean the response if it has markdown code blocks
        let cleanedResponse = response;
        if (response.includes('```json')) {
          // Extract content between ```json and ```
          const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            cleanedResponse = jsonMatch[1];
          }
        } else if (response.includes('```')) {
          // Extract content between ``` and ```
          const codeMatch = response.match(/```\s*([\s\S]*?)\s*```/);
          if (codeMatch && codeMatch[1]) {
            cleanedResponse = codeMatch[1];
          }
        }
        
        habit = JSON.parse(cleanedResponse);
      } catch (e) {
        console.error("Error parsing Claude response:", e);
        // Extract JSON from the response if the response includes non-JSON text
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          habit = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("Could not parse Claude response");
        }
      }
      
      // Transform to our habit format
      const habitId = `gen-habit-${Date.now()}`;
      
      // Build a personalized explanation combining the personalized explanation and research
      const personalized = habit.explanation || `This habit addresses imbalance in ${topImbalanceCategories || 'family workload'} based on your survey responses.`;
      const research = habit.research || "Families with consistent habits experience significant improvements in workload balance.";
      
      // Combine them into a complete explanation
      const completeExplanation = `${personalized} ${research}`;
      
      const formattedHabit = {
        id: habitId,
        title: habit.title,
        description: habit.description,
        cue: habit.cue,
        action: habit.routine,
        reward: habit.reward,
        identity: habit.identityStatement,
        category: "Balance Habit",
        assignedTo: memberRole,
        assignedToName: memberName,
        streak: 0,
        record: 0,
        progress: 0,
        completed: false,
        isUserGenerated: false,
        lastCompleted: null,
        insight: completeExplanation,
        // Include personalized fields for the explanation
        habitExplanation: habit.explanation,
        habitResearch: habit.research,
        atomicSteps: [
          {
            id: `${habitId}-step-1`,
            title: habit.cue,
            description: "Choose a consistent time that works for you",
            completed: false
          },
          {
            id: `${habitId}-step-2`,
            title: habit.routine,
            description: "Complete this action mindfully",
            completed: false
          },
          {
            id: `${habitId}-step-3`,
            title: habit.reward,
            description: "Take a moment to appreciate the benefit",
            completed: false
          }
        ],
        completionInstances: []
      };
      
      return [formattedHabit];
    } catch (error) {
      console.error("Error using Claude to generate habits:", error);
      throw error;
    }
  }
  
  /**
   * Extract highlights from survey responses
   * @param {object} surveyResponses - Survey response data
   * @returns {Array} - Array of survey highlight strings
   */
  extractSurveyHighlights(surveyResponses) {
    const highlights = [];
    
    // If we don't have survey responses, return empty array
    if (!surveyResponses || typeof surveyResponses !== 'object') {
      return highlights;
    }
    
    // Check for key survey indicators
    if (surveyResponses.overwhelmed) {
      highlights.push(`- Feeling overwhelmed: ${surveyResponses.overwhelmed}`);
    }
    
    if (surveyResponses.mentalLoad) {
      highlights.push(`- Mental load concerns: ${surveyResponses.mentalLoad}`);
    }
    
    if (surveyResponses.balanceScore) {
      highlights.push(`- Balance score: ${surveyResponses.balanceScore}`);
    }
    
    if (surveyResponses.priorityTasks) {
      highlights.push(`- Priority tasks: ${surveyResponses.priorityTasks}`);
    }
    
    // Extract any other relevant data
    Object.entries(surveyResponses).forEach(([key, value]) => {
      if (typeof value === 'string' && key.includes('balance')) {
        highlights.push(`- ${key}: ${value}`);
      }
      
      if (typeof value === 'string' && key.includes('stress')) {
        highlights.push(`- ${key}: ${value}`);
      }
    });
    
    return highlights.length ? highlights : ["No specific survey data available"];
  }
  
  /**
   * Get cached habits for a family member
   * @param {string} familyId - The family ID
   * @param {string} memberId - The family member ID
   * @returns {Promise<Array>} - Array of cached habits
   */
  async getCachedHabits(familyId, memberId) {
    try {
      const habitCacheRef = doc(db, "habitCache", `${familyId}_${memberId}`);
      const habitCacheDoc = await getDoc(habitCacheRef);
      
      if (habitCacheDoc.exists()) {
        const data = habitCacheDoc.data();
        
        // Check if cache is recent (within 7 days)
        const cacheTimestamp = data.timestamp?.toDate() || new Date(0);
        const now = new Date();
        const daysDiff = (now - cacheTimestamp) / (1000 * 60 * 60 * 24);
        
        if (daysDiff < 7 && data.habits && data.habits.length > 0) {
          return data.habits;
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error getting cached habits:", error);
      return null;
    }
  }
  
  /**
   * Cache generated habits for a family member
   * @param {string} familyId - The family ID
   * @param {string} memberId - The family member ID
   * @param {Array} habits - The generated habits
   * @returns {Promise<void>}
   */
  async cacheHabits(familyId, memberId, habits) {
    try {
      // Validate habitCache inputs before trying to write to Firestore
      if (!habits || !Array.isArray(habits)) {
        console.warn("Invalid habits format - skipping cache operation");
        return;
      }
      
      // Filter out any invalid habits that might contain undefined fields
      const validHabits = habits.filter(habit => {
        return habit && 
               typeof habit === 'object' && 
               habit.id && 
               habit.title && 
               habit.description;
      });
      
      // Don't proceed if no valid habits
      if (validHabits.length === 0) {
        console.warn("No valid habits to cache");
        return;
      }
      
      // Create a clean copy with just the necessary fields to prevent Firebase errors
      const sanitizedHabits = validHabits.map(habit => ({
        id: habit.id || `fallback-${Date.now()}`,
        title: habit.title || "Habit",
        description: habit.description || "Daily habit for family balance",
        cue: habit.cue || "Morning",
        action: habit.action || habit.routine || "Perform habit", 
        reward: habit.reward || "Feel accomplished",
        identity: habit.identity || habit.identityStatement || "I am someone who values balance",
        category: habit.category || "Balance",
        insight: habit.insight || "",
        atomicSteps: Array.isArray(habit.atomicSteps) ? habit.atomicSteps : []
      }));
      
      const habitCacheRef = doc(db, "habitCache", `${familyId}_${memberId}`);
      
      await setDoc(habitCacheRef, {
        familyId,
        memberId,
        habits: sanitizedHabits,
        timestamp: serverTimestamp()
      });
      
      console.log("Cached habits for future use");
    } catch (error) {
      console.error("Error caching habits:", error);
      // Non-critical error, continue execution
    }
  }
  
  /**
   * Generate fallback habits when AI generation fails
   * @param {object} familyMember - The family member object 
   * @returns {Array} - Array of fallback habits
   */
  getFallbackHabits(familyMember) {
    // Return empty array - users should select habits from Allie or radar chart
    console.log("Fallback habits disabled - guiding user to proper habit selection");
    return [];
  }
  
  /**
   * Validate if a habit is appropriate for parent needs
   * @param {object} habit - The habit to validate
   * @param {object} familyMember - The family member
   * @returns {boolean} - Whether the habit is appropriate
   */
  validateHabitAppropriateness(habit, familyMember) {
    if (!habit || !familyMember) return false;
    
    // Check for meeting action items
    if (habit.title?.includes('Meeting Action Item') || 
        habit.category?.includes('Meeting') ||
        habit.type?.includes('meeting_action')) {
      return false;
    }
    
    // Make sure the habit is assigned to the correct person
    if (habit.assignedTo && 
        habit.assignedTo !== familyMember.role && 
        habit.assignedTo !== familyMember.roleType &&
        habit.assignedTo !== 'Everyone') {
      return false;
    }
    
    // Check if the habit has proper structure
    if (!habit.title || !habit.cue || !habit.action || !habit.reward) {
      return false;
    }
    
    return true;
  }
}

export default new HabitGenerationService();