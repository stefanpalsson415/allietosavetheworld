// src/services/SubCategoryAnalyzer.js
import { SUB_CATEGORY_DEFINITIONS } from '../utils/SubCategoryDefinitions';

/**
 * Service for analyzing survey responses at the subcategory level
 */
class SubCategoryAnalyzer {
  /**
   * Analyze survey responses and calculate subcategory breakdown WITH TASK WEIGHTS
   * @param {Object} surveyResponses - Raw survey responses (enriched format with weights)
   * @returns {Object} Detailed subcategory analysis using weighted calculations
   */
  static analyzeSubCategories(surveyResponses) {
    const analysis = {};

    // Initialize all subcategories with weighted tracking
    Object.entries(SUB_CATEGORY_DEFINITIONS).forEach(([category, data]) => {
      analysis[category] = {
        total: { mama: 0, papa: 0, both: 0, na: 0, mamaWeight: 0, papaWeight: 0, bothWeight: 0 },
        subcategories: {}
      };

      data.subcategories.forEach(sub => {
        analysis[category].subcategories[sub.id] = {
          label: sub.label,
          mama: 0,           // Count for backward compatibility
          papa: 0,           // Count for backward compatibility
          both: 0,           // Count for backward compatibility
          na: 0,
          mamaWeight: 0,     // NEW: Weighted accumulation
          papaWeight: 0,     // NEW: Weighted accumulation
          bothWeight: 0,     // NEW: Weighted accumulation
          totalWeight: 0,    // NEW: Total weight
          total: 0,
          mamaPercent: 0,
          papaPercent: 0,
          imbalancePercent: 0,
          dominantRole: 'Equal'
        };
      });
    });

    // Process each response
    Object.entries(surveyResponses).forEach(([questionId, responseData]) => {
      // Handle both simple and enriched response formats
      let answer, category, subcategory, weight;

      if (typeof responseData === 'string') {
        // Simple format: just the answer (no weight available, skip)
        // Using console.debug to reduce noise - these are expected for old survey data
        if (process.env.NODE_ENV === 'development') {
          console.debug('SubCategoryAnalyzer: Skipping unweighted response', questionId);
        }
        return;
      } else if (typeof responseData === 'object' && responseData.answer) {
        // Enriched format with weight
        answer = responseData.answer;
        category = responseData.category;
        subcategory = responseData.subcategory;
        weight = parseFloat(responseData.totalWeight) || 1; // Use weight or default to 1
      }

      // Only process if we have all required data
      if (answer && category && subcategory && analysis[category]?.subcategories[subcategory]) {
        // Update subcategory counts AND weights
        if (answer === 'Mama') {
          analysis[category].subcategories[subcategory].mama++;
          analysis[category].subcategories[subcategory].mamaWeight += weight;
          analysis[category].total.mama++;
          analysis[category].total.mamaWeight += weight;
        } else if (answer === 'Papa') {
          analysis[category].subcategories[subcategory].papa++;
          analysis[category].subcategories[subcategory].papaWeight += weight;
          analysis[category].total.papa++;
          analysis[category].total.papaWeight += weight;
        } else if (answer === 'Both') {
          analysis[category].subcategories[subcategory].both++;
          analysis[category].subcategories[subcategory].bothWeight += weight;
          // Split weight evenly for 'Both' responses
          analysis[category].subcategories[subcategory].mamaWeight += weight / 2;
          analysis[category].subcategories[subcategory].papaWeight += weight / 2;
          analysis[category].total.both++;
          analysis[category].total.bothWeight += weight;
        } else if (answer === 'N/A' || answer === 'NA') {
          analysis[category].subcategories[subcategory].na++;
          analysis[category].total.na++;
        }

        analysis[category].subcategories[subcategory].total++;
        analysis[category].subcategories[subcategory].totalWeight += weight;
      }
    });

    // Calculate percentages using WEIGHTED values
    Object.entries(analysis).forEach(([category, categoryData]) => {
      // Calculate category totals using weights
      const categoryTotalWeight = categoryData.total.mamaWeight + categoryData.total.papaWeight;

      if (categoryTotalWeight > 0) {
        categoryData.total.mamaPercent = ((categoryData.total.mamaWeight / categoryTotalWeight) * 100).toFixed(1);
        categoryData.total.papaPercent = ((categoryData.total.papaWeight / categoryTotalWeight) * 100).toFixed(1);
        categoryData.total.imbalancePercent = Math.abs(
          categoryData.total.mamaPercent - categoryData.total.papaPercent
        ).toFixed(1);
      }

      // Calculate subcategory percentages using WEIGHTED values
      Object.entries(categoryData.subcategories).forEach(([subId, subData]) => {
        const subTotalWeight = subData.mamaWeight + subData.papaWeight;

        if (subTotalWeight > 0) {
          // Calculate WEIGHTED percentages (this is the key fix!)
          subData.mamaPercent = ((subData.mamaWeight / subTotalWeight) * 100).toFixed(1);
          subData.papaPercent = ((subData.papaWeight / subTotalWeight) * 100).toFixed(1);

          const mamaWeightedPercent = parseFloat(subData.mamaPercent);
          const papaWeightedPercent = parseFloat(subData.papaPercent);

          subData.imbalancePercent = Math.abs(mamaWeightedPercent - papaWeightedPercent).toFixed(1);

          // Determine dominant role based on WEIGHTED percentages
          if (mamaWeightedPercent > papaWeightedPercent + 10) {
            subData.dominantRole = 'Mama';
          } else if (papaWeightedPercent > mamaWeightedPercent + 10) {
            subData.dominantRole = 'Papa';
          } else {
            subData.dominantRole = 'Equal';
          }
        }
      });
    });

    console.log('SubCategoryAnalyzer: Analysis complete with weighted calculations', analysis);
    return analysis;
  }
  
  /**
   * Find the most imbalanced subcategory across all categories (WEIGHTED)
   * @param {Object} analysis - Subcategory analysis from analyzeSubCategories
   * @returns {Object} Most imbalanced subcategory info with weighted data
   */
  static getMostImbalancedSubcategory(analysis) {
    let mostImbalanced = null;
    let highestImbalance = 0;

    Object.entries(analysis).forEach(([category, categoryData]) => {
      Object.entries(categoryData.subcategories).forEach(([subId, subData]) => {
        const imbalance = parseFloat(subData.imbalancePercent || 0);

        // Only consider subcategories with at least 2 responses OR significant weight
        if (imbalance > highestImbalance && (subData.total >= 2 || subData.totalWeight >= 5)) {
          highestImbalance = imbalance;
          mostImbalanced = {
            category,
            subcategoryId: subId,
            subcategoryLabel: subData.label,
            imbalancePercent: imbalance,
            dominantRole: subData.dominantRole,
            mama: subData.mama,
            papa: subData.papa,
            both: subData.both,
            total: subData.total,
            mamaWeight: subData.mamaWeight,        // NEW: Include weights
            papaWeight: subData.papaWeight,        // NEW: Include weights
            totalWeight: subData.totalWeight,      // NEW: Include weights
            mamaPercent: parseFloat(subData.mamaPercent),
            papaPercent: parseFloat(subData.papaPercent)
          };
        }
      });
    });

    return mostImbalanced;
  }
  
  /**
   * Get top N most imbalanced subcategories (WEIGHTED)
   * @param {Object} analysis - Subcategory analysis
   * @param {number} count - Number of subcategories to return
   * @returns {Array} Top imbalanced subcategories with weighted data
   */
  static getTopImbalancedSubcategories(analysis, count = 5) {
    const allSubcategories = [];

    Object.entries(analysis).forEach(([category, categoryData]) => {
      Object.entries(categoryData.subcategories).forEach(([subId, subData]) => {
        if (subData.total >= 2 || subData.totalWeight >= 5) {
          allSubcategories.push({
            category,
            subcategoryId: subId,
            subcategoryLabel: subData.label,
            imbalancePercent: parseFloat(subData.imbalancePercent || 0),
            dominantRole: subData.dominantRole,
            mama: subData.mama,
            papa: subData.papa,
            both: subData.both,
            total: subData.total,
            mamaWeight: subData.mamaWeight,        // NEW: Include weights
            papaWeight: subData.papaWeight,        // NEW: Include weights
            totalWeight: subData.totalWeight,      // NEW: Include weights
            mamaPercent: parseFloat(subData.mamaPercent),
            papaPercent: parseFloat(subData.papaPercent)
          });
        }
      });
    });

    // Sort by imbalance percentage (now weighted)
    return allSubcategories
      .sort((a, b) => b.imbalancePercent - a.imbalancePercent)
      .slice(0, count);
  }
  
  /**
   * Get insights about subcategory patterns
   * @param {Object} analysis - Subcategory analysis
   * @returns {Object} Insights and recommendations
   */
  static generateSubcategoryInsights(analysis) {
    const insights = {
      patterns: [],
      recommendations: [],
      strengths: [],
      priorities: []
    };
    
    // Find patterns
    Object.entries(analysis).forEach(([category, categoryData]) => {
      let highImbalanceCount = 0;
      let totalSubcategories = 0;
      
      Object.entries(categoryData.subcategories).forEach(([subId, subData]) => {
        if (subData.total >= 2) {
          totalSubcategories++;
          if (parseFloat(subData.imbalancePercent) > 60) {
            highImbalanceCount++;
          }
        }
      });
      
      if (highImbalanceCount > totalSubcategories / 2) {
        insights.patterns.push({
          category,
          pattern: 'High imbalance across multiple subcategories',
          severity: 'high',
          message: `${highImbalanceCount} out of ${totalSubcategories} subcategories in ${category} show significant imbalance`
        });
      }
    });
    
    // Generate recommendations based on most imbalanced areas
    const topImbalanced = this.getTopImbalancedSubcategories(analysis, 3);
    topImbalanced.forEach(sub => {
      insights.recommendations.push({
        subcategory: sub.subcategoryLabel,
        category: sub.category,
        action: `Address the ${sub.imbalancePercent}% imbalance in ${sub.subcategoryLabel}`,
        priority: sub.imbalancePercent > 70 ? 'high' : 'medium'
      });
    });
    
    // Find strengths (well-balanced subcategories)
    Object.entries(analysis).forEach(([category, categoryData]) => {
      Object.entries(categoryData.subcategories).forEach(([subId, subData]) => {
        if (subData.total >= 2 && parseFloat(subData.imbalancePercent) < 20) {
          insights.strengths.push({
            subcategory: subData.label,
            category,
            message: `${subData.label} is well-balanced between partners`
          });
        }
      });
    });
    
    return insights;
  }
  
  /**
   * Format subcategory data for visualization
   * @param {Object} analysis - Subcategory analysis
   * @param {string} category - Category to format
   * @returns {Object} Formatted data for charts
   */
  static formatForVisualization(analysis, category) {
    if (!analysis[category]) return { mama: [], papa: [] };
    
    const formatData = (person) => {
      return Object.entries(analysis[category].subcategories).map(([subId, subData]) => {
        const value = person === 'mama' ? parseFloat(subData.mamaPercent) : parseFloat(subData.papaPercent);
        return {
          category: subId,
          label: subData.label,
          value: value || 0,
          detail: SUB_CATEGORY_DEFINITIONS[category].subcategories.find(s => s.id === subId)?.detail || '',
          time: SUB_CATEGORY_DEFINITIONS[category].subcategories.find(s => s.id === subId)?.time || '',
          responses: subData.total
        };
      });
    };
    
    return {
      mama: formatData('mama'),
      papa: formatData('papa')
    };
  }
}

export default SubCategoryAnalyzer;