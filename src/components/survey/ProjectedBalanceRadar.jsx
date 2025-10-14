// src/components/survey/ProjectedBalanceRadar.jsx
import React, { useMemo } from 'react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, Legend, ResponsiveContainer, Tooltip 
} from 'recharts';
import { Scale, AlertCircle, HelpCircle } from 'lucide-react';

const MAMA_COLOR = '#8884d8';
const PAPA_COLOR = '#82ca9d';
const PROJECTED_OPACITY = 0.8;
const CONFIDENCE_STROKE = 'rgba(0,0,0,0.3)';

const ProjectedBalanceRadar = ({ 
  answeredQuestions = [], 
  totalQuestions = [], 
  historicalData = [],
  familyPriorities = {},
  isWidget = false
}) => {
  // Calculate projected balance data for radar chart
  const { radarData, confidence, overallBalance } = useMemo(() => {
    // Define categories
    const categories = {
      "Visible Household Tasks": { mama: 0, papa: 0, total: 0, confidence: 0 },
      "Invisible Household Tasks": { mama: 0, papa: 0, total: 0, confidence: 0 },
      "Visible Parental Tasks": { mama: 0, papa: 0, total: 0, confidence: 0 },
      "Invisible Parental Tasks": { mama: 0, papa: 0, total: 0, confidence: 0 }
    };
    
    // Define question category mapping
    const questionCategories = {};
    totalQuestions.forEach(question => {
      questionCategories[question.id] = question.category;
    });
    
    // Count total questions per category
    const categoryQuestionCounts = {};
    totalQuestions.forEach(question => {
      const category = question.category;
      if (!categoryQuestionCounts[category]) {
        categoryQuestionCounts[category] = 0;
      }
      categoryQuestionCounts[category]++;
    });
    
    // Process answered questions
    let mamaTotal = 0;
    let papaTotal = 0;
    
    // Filter to only valid responses (Mama/Papa)
    const validResponses = answeredQuestions.filter(q => q.response === 'Mama' || q.response === 'Papa');
    
    validResponses.forEach(question => {
      const category = questionCategories[question.id];
      if (category && categories[category]) {
        categories[category].total++;
        
        if (question.response === 'Mama') {
          categories[category].mama++;
          mamaTotal++;
        } else if (question.response === 'Papa') {
          categories[category].papa++;
          papaTotal++;
        }
      }
    });
    
    // Calculate confidence level per category
    Object.keys(categories).forEach(category => {
      if (categoryQuestionCounts[category]) {
        // Calculate what percentage of questions in this category have been answered
        categories[category].confidence = Math.min(
          100, 
          Math.round((categories[category].total / categoryQuestionCounts[category]) * 100)
        );
      }
    });
    
    // Process historical data to improve projections
    if (historicalData && Object.keys(historicalData).length > 0) {
      console.log("Processing historical data for projection", historicalData);
      
      // Extract historical responses by category
      const historicalCategories = { ...categories };
      
      // Process each historical cycle's data
      Object.entries(historicalData).forEach(([cycleKey, cycleData]) => {
        if (!cycleData || typeof cycleData !== 'object') return;
        
        // Process each question/response in this cycle
        Object.entries(cycleData).forEach(([questionId, response]) => {
          // Only process valid responses
          if (response !== 'Mama' && response !== 'Papa') return;
          
          // Get the category for this question
          const category = questionCategories[questionId];
          if (!category || !historicalCategories[category]) return;
          
          // Count this historical response
          historicalCategories[category].total++;
          
          if (response === 'Mama') {
            historicalCategories[category].mama++;
          } else if (response === 'Papa') {
            historicalCategories[category].papa++;
          }
        });
      });
      
      // Calculate historical percentages and blend with current data
      Object.keys(categories).forEach(category => {
        const historicalCat = historicalCategories[category];
        const currentCat = categories[category];
        
        // Only blend if we have historical data for this category
        if (historicalCat.total > 0) {
          // Calculate historical percentages
          const historicalMamaPercent = historicalCat.mama / historicalCat.total;
          const historicalPapaPercent = historicalCat.papa / historicalCat.total;
          
          // Blend with current data - weight historical data less for low confidence categories
          // The lower the current confidence, the more we rely on historical patterns
          const blendWeight = Math.max(0, Math.min(0.7, 1 - (currentCat.confidence / 100)));
          
          // If we have current data, blend it
          if (currentCat.total > 0) {
            const currentMamaPercent = currentCat.mama / currentCat.total;
            const currentPapaPercent = currentCat.papa / currentCat.total;
            
            // Blend historical and current percentages
            currentCat.mamaPercent = (currentMamaPercent * (1 - blendWeight)) + (historicalMamaPercent * blendWeight);
            currentCat.papaPercent = (currentPapaPercent * (1 - blendWeight)) + (historicalPapaPercent * blendWeight);
            
            // Mark as having historical data influence
            currentCat.hasHistorical = true;
          } else {
            // If no current data, use historical as fallback but with lower confidence
            currentCat.mamaPercent = historicalMamaPercent;
            currentCat.papaPercent = historicalPapaPercent;
            currentCat.hasHistorical = true;
            currentCat.historical_only = true;
          }
        }
      });
    }
    
    // Apply adjustments based on family priorities
    if (familyPriorities && Object.keys(familyPriorities).length > 0) {
      // Adjust projection confidence based on family priorities
      Object.entries(familyPriorities).forEach(([priority, value]) => {
        // Map priorities to categories and increase their confidence
        if (value && value > 3) { // Only for high priorities (scale of 1-5)
          if (priority === 'household') {
            categories["Visible Household Tasks"].priorityBoost = true;
            categories["Invisible Household Tasks"].priorityBoost = true;
          } else if (priority === 'parenting') {
            categories["Visible Parental Tasks"].priorityBoost = true;
            categories["Invisible Parental Tasks"].priorityBoost = true;
          }
        }
      });
    }
    
    // Convert to percentage values for radar chart
    const radarData = Object.entries(categories).map(([category, counts]) => {
      // If no direct questions answered and no historical data, use statistical baseline
      if (counts.total === 0 && !counts.hasHistorical) {
        // Default to slightly mama-weighted distribution based on general statistics
        return { 
          category, 
          mama: 55, 
          papa: 45, 
          confidence: 10, // Low confidence for categories with no data
          projected: true
        };
      }
      
      // If we have blended historical data, use that
      if (counts.hasHistorical) {
        return {
          category,
          mama: Math.round(counts.mamaPercent * 100),
          papa: Math.round(counts.papaPercent * 100),
          confidence: counts.historical_only ? 30 : counts.confidence, // Lower confidence for historical-only
          projected: true,
          withHistorical: true, // Flag to indicate historical data was used
          priorityArea: counts.priorityBoost // Flag for priority areas
        };
      }
      
      // Calculate percentages from answered questions only
      const mamaPercent = Math.round((counts.mama / counts.total) * 100);
      const papaPercent = Math.round((counts.papa / counts.total) * 100);
      
      return {
        category,
        mama: mamaPercent,
        papa: papaPercent,
        confidence: counts.confidence,
        projected: counts.confidence < 60, // Mark as projected if confidence is low
        priorityArea: counts.priorityBoost // Flag for priority areas
      };
    });
    
    // Calculate overall confidence level
    const totalAnswered = answeredQuestions.length;
    const totalAvailable = totalQuestions.length;
    const overallConfidence = totalAvailable > 0 
      ? Math.round((totalAnswered / totalAvailable) * 100) 
      : 0;
    
    // Calculate overall balance
    const totalResponses = mamaTotal + papaTotal;
    const overallBalance = {
      mama: totalResponses > 0 ? Math.round((mamaTotal / totalResponses) * 100) : 50,
      papa: totalResponses > 0 ? Math.round((papaTotal / totalResponses) * 100) : 50,
      confidence: overallConfidence
    };
    
    return { 
      radarData, 
      confidence: overallConfidence,
      overallBalance
    };
  }, [answeredQuestions, totalQuestions, historicalData, familyPriorities]);
  
  // Get confidence level text description
  const getConfidenceLevel = (confidence) => {
    if (confidence >= 70) return 'High';
    if (confidence >= 40) return 'Medium';
    return 'Low';
  };
  
  // Get confidence color based on level
  const getConfidenceColor = (confidence) => {
    if (confidence >= 70) return 'text-green-700 bg-green-100';
    if (confidence >= 40) return 'text-amber-700 bg-amber-100';
    return 'text-red-700 bg-red-100';
  };
  
  // Custom tooltip to show confidence
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload.find(p => p.name === 'Mama') || {};
      const confidence = payload.find(p => p.name === 'confidence')?.value || 0;
      const isProjected = radarData.find(d => d.category === label)?.projected;
      
      return (
        <div className="bg-white p-2 border shadow-md rounded text-xs">
          <p className="font-bold">{label}</p>
          <div className="flex justify-between gap-4 mt-1">
            <span className="text-purple-700">Mama: {data.value}%</span>
            <span className="text-green-700">Papa: {100 - data.value}%</span>
          </div>
          <div className={`mt-1 px-1 py-0.5 rounded-full text-xs inline-flex items-center ${getConfidenceColor(confidence)}`}>
            {isProjected && <AlertCircle size={10} className="mr-1" />}
            Confidence: {getConfidenceLevel(confidence)}
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={`bg-white rounded-lg ${isWidget ? '' : 'shadow-sm overflow-hidden mb-6'}`}>
      <div className={`${isWidget ? 'p-2' : 'p-6'}`}>
        <div className={`${isWidget ? '' : 'flex items-start'}`}>
          {!isWidget && (
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-4">
              <Scale className="text-blue-600" size={24} />
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-start">
              {!isWidget && (
                <h2 className="text-xl font-bold text-gray-800 mb-2">Projected Family Balance</h2>
              )}
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getConfidenceColor(confidence)}`}>
                {confidence < 40 && <AlertCircle size={12} className="mr-1" />}
                {confidence >= 40 && confidence < 70 && <HelpCircle size={12} className="mr-1" />}
                Confidence: {getConfidenceLevel(confidence)}
              </div>
            </div>
            
            {!isWidget && (
              <p className="text-gray-600 mb-2">
                Based on {answeredQuestions.length} of {totalQuestions.length} questions answered so far
              </p>
            )}
            
            {confidence < 60 && !isWidget && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
                <p>This projection will become more accurate as you answer more questions. Categories with less data show preliminary estimates.</p>
              </div>
            )}
            
            <div className={`${isWidget ? 'h-96' : 'h-64'} mb-2`}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                  outerRadius={isWidget ? "55%" : "75%"} 
                  data={radarData}
                  margin={
                    isWidget 
                      ? { top: 35, right: 35, bottom: 35, left: 35 }
                      : { top: 10, right: 30, bottom: 20, left: 30 }
                  }
                >
                  <PolarGrid />
                  <PolarAngleAxis 
                    dataKey="category" 
                    radius={110} 
                    tick={(props) => {
                      const { x, y, payload, index } = props;
                      
                      // Extract category parts
                      let visibility = "";
                      let type = "";
                      
                      if (payload.value.includes("Visible")) {
                        visibility = "Visible";
                        type = payload.value.includes("Household") ? "Household" : "Parental";
                      } else {
                        visibility = "Invisible";
                        type = payload.value.includes("Household") ? "Household" : "Parental";
                      }
                      
                      // Calculate position offset based on index to push labels out
                      let offsetX = 0;
                      let offsetY = 0;
                      const offsetFactor = 30; // Adjust this to control how far labels move outward
                      
                      // Top label
                      if (index === 0) offsetY = -offsetFactor;
                      // Right label
                      else if (index === 1) offsetX = offsetFactor + 5;
                      // Bottom label
                      else if (index === 2) offsetY = offsetFactor;
                      // Left label
                      else if (index === 3) offsetX = -offsetFactor - 5;
                      
                      return (
                        <g transform={`translate(${x + offsetX},${y + offsetY})`}>
                          <text
                            x={0}
                            y={0}
                            dy={-15}
                            textAnchor="middle"
                            fill="#4B5563"
                            fontSize={13}
                            fontWeight={600}
                          >
                            {visibility}
                          </text>
                          <text
                            x={0}
                            y={0}
                            dy={5}
                            textAnchor="middle"
                            fill="#4B5563"
                            fontSize={13}
                            fontWeight={600}
                          >
                            {type}
                          </text>
                        </g>
                      );
                    }}
                    tickLine={false}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]} 
                    tickCount={5}
                    tick={{
                      fontSize: 10,
                      fill: '#6B7280'
                    }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={{ stroke: '#E5E7EB' }}
                  />
                  
                  <Radar
                    name="Mama"
                    dataKey="mama"
                    stroke={MAMA_COLOR}
                    fill={MAMA_COLOR}
                    fillOpacity={PROJECTED_OPACITY}
                  />
                  
                  <Radar
                    name="Papa"
                    dataKey="papa"
                    stroke={PAPA_COLOR}
                    fill={PAPA_COLOR}
                    fillOpacity={PROJECTED_OPACITY}
                  />
                  
                  <Radar
                    name="confidence"
                    dataKey="confidence"
                    stroke={CONFIDENCE_STROKE}
                    fill="none"
                    strokeDasharray="5 5"
                    isAnimationActive={false}
                  />
                  
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Compact Workload Distribution */}
            <div className={`${isWidget ? 'p-2' : 'p-4'} bg-gray-50 rounded-lg`}>
              <div className="flex items-center justify-between">
                <h3 className={`font-medium text-gray-800 ${isWidget ? 'text-sm' : 'text-sm'} mr-1`}>Workload Summary</h3>
                
                {radarData.some(cat => cat.withHistorical) && (
                  <p className="text-xs text-blue-600">
                    <span className="text-blue-500 font-bold">*</span> Includes historical data
                  </p>
                )}
              </div>
              
              {/* Horizontal layout for category distributions */}
              <div className="flex flex-wrap mt-2">
                {radarData.map((category, index) => {
                  // Extract just the key part of the category name
                  const shortName = category.category
                    .replace('Visible Household Tasks', 'Vis.House')
                    .replace('Invisible Household Tasks', 'Inv.House')
                    .replace('Visible Parental Tasks', 'Vis.Parent')
                    .replace('Invisible Parental Tasks', 'Inv.Parent');
                    
                  return (
                    <div key={index} className="w-1/2 pr-1 mb-2">
                      <div className="flex items-center">
                        <span className="text-xs w-20 truncate font-medium">{shortName}</span>
                        <div className="flex-1 ml-1">
                          <div className="h-4 relative">
                            <div className="absolute left-0 right-0 top-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className={`absolute top-0 bottom-0 left-0 ${category.withHistorical ? 'bg-purple-400' : 'bg-purple-500'} rounded-full transition-all duration-700`}
                                style={{ width: `${category.mama}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex text-xs ml-1 whitespace-nowrap">
                          <span className="text-purple-700 mr-1 font-medium">{category.mama}%</span>
                          <span className="text-green-700 font-medium">{category.papa}%</span>
                          {category.withHistorical && <span className="text-blue-500 ml-px font-bold">*</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {confidence < 40 && (
                <p className="text-xs text-center text-gray-500 mt-2 italic">
                  Preliminary estimate, will refine as you answer more questions.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectedBalanceRadar;