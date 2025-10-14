// src/utils/SurveyResponseCategorizer.js
import AIQuestionGenerator from '../services/AIQuestionGenerator';
import { SUB_CATEGORY_DEFINITIONS } from './SubCategoryDefinitions';

/**
 * Utility to categorize survey responses by loading question metadata
 * This solves the problem where survey responses don't have category information stored
 */
class SurveyResponseCategorizer {
  constructor() {
    this.questionCache = new Map();
  }

  /**
   * Get static questions from the survey context
   * @private
   */
  getStaticQuestions() {
    // Define categories with their questions (copied from SurveyContext)
    const categories = [
      "Visible Household Tasks",
      "Invisible Household Tasks",
      "Visible Parental Tasks",
      "Invisible Parental Tasks"
    ];
    
    const questionTexts = {
      "Visible Household Tasks": [
        "Who is responsible for cleaning floors in your home?",
        "Who usually washes the dishes after meals?",
        "Who typically cooks meals for the family?",
        "Who does the laundry in your household?",
        "Who does the grocery shopping?",
        "Who takes out the trash regularly?",
        "Who handles yard work like mowing and gardening?",
        "Who cleans the bathrooms?",
        "Who dusts surfaces around the house?",
        "Who makes the beds each day?"
      ],
      "Invisible Household Tasks": [
        "Who plans meals for the week?",
        "Who schedules family appointments?",
        "Who manages the family calendar?",
        "Who remembers birthdays and special occasions?",
        "Who makes shopping lists?",
        "Who handles paying bills on time?",
        "Who coordinates childcare arrangements?",
        "Who plans family vacations and trips?",
        "Who oversees children's educational needs?",
        "Who keeps track of household supplies?"
      ],
      "Visible Parental Tasks": [
        "Who drives kids to school and activities?",
        "Who helps with homework?",
        "Who attends parent-teacher conferences?",
        "Who prepares school lunches?",
        "Who coordinates extracurricular activities?",
        "Who attends children's performances and games?",
        "Who organizes playdates?",
        "Who supervises bath time?",
        "Who manages bedtime routines?",
        "Who shops for school supplies and clothing?"
      ],
      "Invisible Parental Tasks": [
        "Who coordinates children's schedules to prevent conflicts?",
        "Who provides emotional labor for the family?",
        "Who anticipates developmental needs?",
        "Who networks with other parents?",
        "Who monitors academic progress?",
        "Who develops strategies for behavioral issues?",
        "Who watches for signs of illness or stress?",
        "Who plans for future educational expenses?",
        "Who maintains family traditions?",
        "Who handles cultural and moral education?"
      ]
    };
    
    // Generate question objects
    const questions = [];
    let questionId = 1;
    
    categories.forEach(category => {
      const categoryQuestions = questionTexts[category] || [];
      categoryQuestions.forEach(text => {
        questions.push({
          id: `q${questionId}`,
          text: text,
          category: category,
          weight: 3 // Default weight
        });
        questionId++;
      });
    });
    
    return questions;
  }

  /**
   * Load question metadata from various sources
   * @param {string} familyId - Family ID to load personalized questions
   * @param {string} memberId - Member ID who took the survey
   * @returns {Promise<Map>} Map of questionId to question metadata
   */
  async loadQuestionMetadata(familyId, memberId) {
    try {
      // Try to get the questions that were generated for this family/member
      const questionMap = new Map();
      
      // 1. Load static questions from SurveyContext
      // Import the context and use the provider's function
      const staticQuestions = this.getStaticQuestions();
      
      staticQuestions.forEach(q => {
        questionMap.set(q.id, {
          id: q.id,
          text: q.text,
          category: q.category,
          subcategory: q.subcategory || null,
          subcategoryLabel: q.subcategoryLabel || null,
          weight: q.totalWeight || 1
        });
      });
      
      // 2. Try to load dynamic questions if they were used
      try {
        const { default: DynamicSurveyGenerator } = await import('../services/DynamicSurveyGenerator');
        // Note: We can't regenerate the exact questions, but we can get category mappings
        console.log('Note: Dynamic questions may have different categories than originally generated');
      } catch (error) {
        console.log('Dynamic questions not available:', error);
      }
      
      // 3. Cache the results
      this.questionCache.set(`${familyId}-${memberId}`, questionMap);
      
      return questionMap;
    } catch (error) {
      console.error('Error loading question metadata:', error);
      return new Map();
    }
  }

  /**
   * Categorize survey responses by adding category metadata
   * @param {Object} responses - Survey responses object (questionId -> answer)
   * @param {string} familyId - Family ID
   * @param {string} memberId - Member ID
   * @returns {Promise<Object>} Categorized responses with metadata
   */
  async categorizeResponses(responses, familyId, memberId) {
    try {
      // Load question metadata
      const cacheKey = `${familyId}-${memberId}`;
      let questionMap = this.questionCache.get(cacheKey);
      
      if (!questionMap) {
        questionMap = await this.loadQuestionMetadata(familyId, memberId);
      }
      
      // Create categorized responses
      const categorizedResponses = {};
      
      // Map between different category naming conventions
      const categoryMapping = {
        "Visible Household Tasks": "visible_household",
        "Invisible Household Tasks": "invisible_household",
        "Visible Parental Tasks": "visible_parenting",
        "Invisible Parental Tasks": "invisible_parenting"
      };
      
      const responsesByCategory = {
        "visible_household": [],
        "invisible_household": [],
        "visible_parenting": [],
        "invisible_parenting": [],
        "Unknown": []
      };
      
      // Process each response
      Object.entries(responses).forEach(([questionId, answer]) => {
        const questionMeta = questionMap.get(questionId);
        
        if (questionMeta) {
          categorizedResponses[questionId] = {
            answer,
            category: questionMeta.category,
            subcategory: questionMeta.subcategory,
            subcategoryLabel: questionMeta.subcategoryLabel,
            questionText: questionMeta.text,
            weight: questionMeta.weight
          };
          
          // Group by category (map to short form)
          const shortCategory = categoryMapping[questionMeta.category] || questionMeta.category;
          if (responsesByCategory[shortCategory]) {
            responsesByCategory[shortCategory].push({
              questionId,
              answer,
              questionText: questionMeta.text,
              subcategory: questionMeta.subcategory
            });
          } else {
            responsesByCategory["Unknown"].push({
              questionId,
              answer,
              questionText: questionId // Use ID as fallback
            });
          }
        } else {
          // Try to infer category from question ID pattern or text
          const inferredCategory = this.inferCategoryFromQuestionId(questionId);
          
          categorizedResponses[questionId] = {
            answer,
            category: inferredCategory,
            subcategory: null,
            subcategoryLabel: null,
            questionText: questionId,
            weight: 1
          };
          
          responsesByCategory[inferredCategory].push({
            questionId,
            answer,
            questionText: questionId
          });
        }
      });
      
      return {
        categorizedResponses,
        responsesByCategory,
        summary: this.generateCategorySummary(responsesByCategory)
      };
    } catch (error) {
      console.error('Error categorizing responses:', error);
      throw error;
    }
  }

  /**
   * Try to infer category from question ID or other patterns
   * @private
   */
  inferCategoryFromQuestionId(questionId) {
    // Check for patterns in question IDs
    if (questionId.includes('household') || questionId.includes('cleaning') || questionId.includes('cooking')) {
      return questionId.includes('invisible') ? "Invisible Household Tasks" : "Visible Household Tasks";
    }
    if (questionId.includes('parent') || questionId.includes('child') || questionId.includes('school')) {
      return questionId.includes('invisible') ? "Invisible Parental Tasks" : "Visible Parental Tasks";
    }
    
    // Default to Unknown
    return "Unknown";
  }

  /**
   * Generate a summary of responses by category
   * @private
   */
  generateCategorySummary(responsesByCategory) {
    const summary = {};
    
    Object.entries(responsesByCategory).forEach(([category, responses]) => {
      const mamaCount = responses.filter(r => r.answer === 'Mama').length;
      const papaCount = responses.filter(r => r.answer === 'Papa').length;
      const bothCount = responses.filter(r => r.answer === 'Both equally').length;
      const naCount = responses.filter(r => r.answer === 'Not applicable' || r.answer === 'NA').length;
      const total = responses.length;
      
      summary[category] = {
        total,
        mama: mamaCount,
        papa: papaCount,
        both: bothCount,
        notApplicable: naCount,
        mamaPercentage: total > 0 ? (mamaCount / total * 100).toFixed(1) : 0,
        papaPercentage: total > 0 ? (papaCount / total * 100).toFixed(1) : 0,
        bothPercentage: total > 0 ? (bothCount / total * 100).toFixed(1) : 0
      };
    });
    
    return summary;
  }

  /**
   * Get responses for a specific category
   */
  getResponsesForCategory(categorizedData, category) {
    return categorizedData.responsesByCategory[category] || [];
  }

  /**
   * Analyze subcategory distribution
   */
  analyzeSubcategoryDistribution(categorizedData) {
    const subcategoryAnalysis = {};
    
    // Initialize all subcategories
    Object.entries(SUB_CATEGORY_DEFINITIONS).forEach(([category, def]) => {
      def.subcategories.forEach(sub => {
        subcategoryAnalysis[sub.id] = {
          label: sub.label,
          category,
          total: 0,
          mama: 0,
          papa: 0,
          both: 0
        };
      });
    });
    
    // Count responses by subcategory
    Object.values(categorizedData.categorizedResponses).forEach(response => {
      if (response.subcategory && subcategoryAnalysis[response.subcategory]) {
        subcategoryAnalysis[response.subcategory].total++;
        
        if (response.answer === 'Mama') {
          subcategoryAnalysis[response.subcategory].mama++;
        } else if (response.answer === 'Papa') {
          subcategoryAnalysis[response.subcategory].papa++;
        } else if (response.answer === 'Both equally') {
          subcategoryAnalysis[response.subcategory].both++;
        }
      }
    });
    
    return subcategoryAnalysis;
  }
}

export default new SurveyResponseCategorizer();