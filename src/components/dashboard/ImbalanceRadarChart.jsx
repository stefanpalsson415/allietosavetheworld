// src/components/dashboard/ImbalanceRadarChart.jsx
import React, { useMemo, useState } from 'react';
import { Scale, AlertTriangle, Info, BarChart2 } from 'lucide-react';

// Color constants
const MAMA_COLOR = '#8884d8'; // Purple for Mama
const PAPA_COLOR = '#82ca9d'; // Green for Papa

const ImbalanceRadarChart = ({ 
  surveyResponses = {}, 
  currentParentRole,
  onCategorySelect
}) => {
  // Calculate category imbalances from survey data
  const { categories, mostImbalancedCategory, hasImbalance } = useMemo(() => {
    // Define categories
    const categoryData = {
      "Visible Household Tasks": { mama: 0, papa: 0, total: 0, imbalance: 0 },
      "Invisible Household Tasks": { mama: 0, papa: 0, total: 0, imbalance: 0 },
      "Visible Parental Tasks": { mama: 0, papa: 0, total: 0, imbalance: 0 },
      "Invisible Parental Tasks": { mama: 0, papa: 0, total: 0, imbalance: 0 }
    };

    // Keywords to help categorize questions if explicit category isn't available
    const categoryKeywords = {
      "Visible Household Tasks": ["dishes", "laundry", "cooking", "cleaning", "repair", "groceries", "shopping"],
      "Invisible Household Tasks": ["planning", "scheduling", "remembering", "organizing", "budgeting", "researching"],
      "Visible Parental Tasks": ["bathe", "feed", "dress", "play", "drive", "homework", "bedtime"],
      "Invisible Parental Tasks": ["medical", "teacher", "appointment", "school", "emotional", "development"]
    };
    
    // Process each survey response
    Object.entries(surveyResponses).forEach(([questionId, response]) => {
      // Only process Mama/Papa responses
      if (response !== 'Mama' && response !== 'Papa' && response !== 'Both') {
        return;
      }
      
      // Try to determine the category from the question ID
      let matchedCategory = null;
      
      // Check question text against keywords to identify category
      const questionText = questionId.toLowerCase();
      
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => questionText.includes(keyword))) {
          matchedCategory = category;
          break;
        }
      }
      
      // If still no match, use default category
      if (!matchedCategory) {
        // Default to Invisible Household Tasks as that's common for miscellaneous
        matchedCategory = "Invisible Household Tasks";
      }
      
      // Increment counters
      categoryData[matchedCategory].total += 1;
      
      if (response === 'Mama') {
        categoryData[matchedCategory].mama += 1;
      } else if (response === 'Papa') {
        categoryData[matchedCategory].papa += 1;
      } else if (response === 'Both') {
        // Split evenly for "Both" responses
        categoryData[matchedCategory].mama += 0.5;
        categoryData[matchedCategory].papa += 0.5;
      }
    });
    
    // If no survey data, create synthetic data
    let hasAnyData = false;
    Object.values(categoryData).forEach(cat => {
      if (cat.total > 0) hasAnyData = true;
    });
    
    if (!hasAnyData) {
      // Create synthetic data as an example
      categoryData["Visible Household Tasks"].mama = 4;
      categoryData["Visible Household Tasks"].papa = 6;
      categoryData["Visible Household Tasks"].total = 10;
      
      categoryData["Invisible Household Tasks"].mama = 7;
      categoryData["Invisible Household Tasks"].papa = 3;
      categoryData["Invisible Household Tasks"].total = 10;
      
      categoryData["Visible Parental Tasks"].mama = 6;
      categoryData["Visible Parental Tasks"].papa = 4;
      categoryData["Visible Parental Tasks"].total = 10;
      
      categoryData["Invisible Parental Tasks"].mama = 8;
      categoryData["Invisible Parental Tasks"].papa = 2;
      categoryData["Invisible Parental Tasks"].total = 10;
    }
    
    // Calculate percentages and imbalances
    Object.keys(categoryData).forEach(category => {
      const cat = categoryData[category];
      
      if (cat.total > 0) {
        // Calculate percentages
        cat.mamaPercent = Math.round((cat.mama / cat.total) * 100);
        cat.papaPercent = Math.round((cat.papa / cat.total) * 100);
        
        // Calculate absolute imbalance - how far from 50/50
        cat.imbalance = Math.abs(cat.mamaPercent - cat.papaPercent);
        
        // Record who is doing more in this category
        cat.dominantRole = cat.mamaPercent > cat.papaPercent ? "Mama" : "Papa";
      } else {
        // Default values if no data
        cat.mamaPercent = 50;
        cat.papaPercent = 50;
        cat.imbalance = 0;
        cat.dominantRole = "Equal";
      }
    });
    
    // Find the most imbalanced category
    let highestImbalance = 0;
    let mostImbalanced = null;
    
    Object.entries(categoryData).forEach(([category, data]) => {
      if (data.imbalance > highestImbalance) {
        highestImbalance = data.imbalance;
        mostImbalanced = {
          category,
          imbalance: data.imbalance,
          dominantRole: data.dominantRole
        };
      }
    });
    
    // Convert to categories array
    const categoriesArray = Object.entries(categoryData).map(([category, data]) => ({
      category,
      mamaPercent: data.mamaPercent,
      papaPercent: data.papaPercent,
      imbalancePercent: data.imbalance,
      dominantRole: data.dominantRole,
      isWorstImbalance: category === mostImbalanced?.category
    }));
    
    return { 
      categories: categoriesArray, 
      mostImbalancedCategory: mostImbalanced,
      hasImbalance: highestImbalance > 10 // Consider there's an imbalance if > 10%
    };
  }, [surveyResponses]);
  
  // State for selected category
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Click handler for selecting categories
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden p-4">
      <div className="flex items-start mb-3">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
          <BarChart2 className="text-blue-600" size={18} />
        </div>
        <div>
          <h3 className="font-medium text-gray-800">Task Imbalance Analysis</h3>
          <p className="text-sm text-gray-500">
            This visualization shows where imbalances exist in your family workload
          </p>
        </div>
      </div>
      
      {hasImbalance && mostImbalancedCategory && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm">
          <div className="flex">
            <AlertTriangle size={18} className="text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-amber-800">
                <strong>Highest Imbalance: {mostImbalancedCategory.category}</strong> 
                <span className="ml-1">
                  ({mostImbalancedCategory.dominantRole} does {mostImbalancedCategory.imbalance}% more)
                </span>
              </p>
              <p className="text-amber-700 text-xs mt-1">
                Click on a category below to get habit recommendations that address that imbalance.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Imbalance visualization cards */}
      <div className="space-y-2 mb-4">
        {categories.map((category) => (
          <div 
            key={category.category}
            onClick={() => handleCategoryClick(category.category)}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedCategory === category.category
                ? 'border-indigo-300 bg-indigo-50'
                : category.imbalancePercent > 20
                  ? 'border-red-200 bg-red-50 hover:bg-red-100'
                  : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex justify-between">
              <span className="font-medium">{category.category}</span>
              <span className={`text-sm ${
                category.imbalancePercent > 20 
                  ? 'text-red-600 font-bold' 
                  : category.imbalancePercent > 10 
                    ? 'text-amber-600' 
                    : 'text-green-600'
              }`}>
                {category.imbalancePercent}% imbalance
              </span>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <div className="flex-1">
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="flex h-full">
                    <div 
                      className="bg-purple-500" 
                      style={{ width: `${category.mamaPercent}%` }}
                    ></div>
                    <div 
                      className="bg-green-500" 
                      style={{ width: `${category.papaPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="ml-4 text-xs">
                <span className="text-purple-700 mr-2">Mama: {category.mamaPercent}%</span>
                <span className="text-green-700">Papa: {category.papaPercent}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-3 bg-blue-50 rounded-lg text-sm">
        <div className="flex">
          <Info size={18} className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-blue-800">
            <p><strong>How to interpret the imbalance:</strong></p>
            <ul className="list-disc ml-5 mt-1">
              <li>Each category shows the distribution of tasks between parents</li>
              <li>The progress bars show the percentage each parent is handling</li>
              <li>Click on any category to get habit recommendations to address that imbalance</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImbalanceRadarChart;