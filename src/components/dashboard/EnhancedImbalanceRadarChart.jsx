// src/components/dashboard/EnhancedImbalanceRadarChart.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Scale, AlertTriangle, Info, Calendar, History, Users, ChevronDown, ChevronUp
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { analyzeTaskImbalances } from '../../utils/SurveyAnalysisUtil';
import { useSurvey } from '../../contexts/SurveyContext';
import WorkloadRadarLayout from './WorkloadRadarLayout';

// Nordic color palette
const MAMA_COLOR = '#8E8EE0'; // Lavender for Mama
const PAPA_COLOR = '#5C8A64'; // Pine for Papa
const CHILDREN_COLOR = '#FBBF24'; // Amber for Children
const WARNING_COLOR = '#F27575'; // Salmon for warnings
const HISTORICAL_OPACITY = 0.2;

const EnhancedImbalanceRadarChart = ({ 
  surveyResponses = {}, 
  onCategorySelect
}) => {
  const { selectedUser, familyMembers, completedWeeks, currentWeek, lastCompletedFullWeek } = useFamily();
  const { fullQuestionSet, familyPriorities } = useSurvey();
  
  // Filter state
  const [respondentFilter, setRespondentFilter] = useState('all');
  const [specificRespondent, setSpecificRespondent] = useState(null);
  const [cycleFilter, setCycleFilter] = useState(null);
  const [showHistorical, setShowHistorical] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Historical data
  const [historicalData, setHistoricalData] = useState([]);
  
  // Computed filtered data
  const surveyAnalysis = useMemo(() => {
    // Use enhanced analyzeTaskImbalances with filtering parameters
    return analyzeTaskImbalances(
      surveyResponses,
      fullQuestionSet,
      familyPriorities,
      respondentFilter,
      specificRespondent,
      cycleFilter
    );
  }, [surveyResponses, fullQuestionSet, familyPriorities, respondentFilter, specificRespondent, cycleFilter]);

  // Compute historical data for comparison
  useEffect(() => {
    if (showHistorical) {
      // Create an array of analyses from previous cycles
      const historicalAnalyses = [];
      
      // Get current cycle
      const currentCycleNum = cycleFilter || lastCompletedFullWeek || currentWeek;
      
      // Calculate analyses for the previous 3 cycles (if they exist)
      for (let i = 1; i <= 3; i++) {
        const previousCycle = currentCycleNum - i;
        if (previousCycle > 0 && completedWeeks.includes(previousCycle)) {
          const analysis = analyzeTaskImbalances(
            surveyResponses,
            fullQuestionSet,
            familyPriorities,
            respondentFilter,
            specificRespondent,
            previousCycle
          );
          
          if (analysis.responseCount > 0) {
            historicalAnalyses.push({
              cycle: previousCycle,
              analysis
            });
          }
        }
      }
      
      setHistoricalData(historicalAnalyses);
    } else {
      setHistoricalData([]);
    }
  }, [
    showHistorical, 
    surveyResponses, 
    fullQuestionSet, 
    familyPriorities, 
    respondentFilter, 
    specificRespondent, 
    cycleFilter,
    completedWeeks,
    currentWeek,
    lastCompletedFullWeek
  ]);

  // Get changes between cycles
  const getImbalanceChanges = useMemo(() => {
    if (!showHistorical || historicalData.length === 0 || !surveyAnalysis.imbalances) {
      return {};
    }
    
    const changes = {};
    
    // Compare current with most recent historical cycle
    const mostRecent = historicalData[0];
    if (mostRecent && mostRecent.analysis.imbalances) {
      // For each category, calculate the change
      surveyAnalysis.imbalances.forEach(category => {
        const historicalCategory = mostRecent.analysis.imbalances.find(
          c => c.category === category.category
        );
        
        if (historicalCategory) {
          const change = category.imbalancePercent - historicalCategory.imbalancePercent;
          changes[category.category] = {
            change,
            improved: change < 0, // Negative change means improvement (less imbalance)
            percentage: Math.abs(change)
          };
        }
      });
    }
    
    return changes;
  }, [showHistorical, historicalData, surveyAnalysis.imbalances]);

  // Respondent filter options
  const getRespondentOptions = useMemo(() => {
    // Core filters
    const options = [
      { id: 'all', name: 'Everyone', type: 'all' },
      { id: 'adult', name: 'Parents Only', type: 'adult' },
      { id: 'child', name: 'Children Only', type: 'child' }
    ];
    
    // Add individual family members
    if (familyMembers && familyMembers.length > 0) {
      familyMembers.forEach(member => {
        options.push({
          id: member.id,
          name: member.name,
          type: member.roleType === 'Mama' || member.roleType === 'Papa' ? 'adult' : 'child',
          roleType: member.roleType
        });
      });
    }
    
    return options;
  }, [familyMembers]);
  
  // Cycle filter options
  const getCycleOptions = useMemo(() => {
    const options = [{ id: null, name: 'All Cycles' }];
    
    // Add completed weeks as cycles
    if (completedWeeks && completedWeeks.length > 0) {
      completedWeeks.forEach(week => {
        options.push({
          id: week,
          name: `Cycle ${week}${week === currentWeek ? ' (Current)' : ''}`
        });
      });
    }
    
    // Add initial survey option
    options.push({
      id: 'initial',
      name: 'Initial Survey'
    });
    
    return options;
  }, [completedWeeks, currentWeek]);

  // Handle respondent filter change - memoized with useCallback
  const handleRespondentFilterChange = useCallback((e) => {
    const value = e.target.value;
    
    // Check if this is a specific family member or group
    const isSpecificMember = getRespondentOptions.find(
      option => option.id === value && (option.id !== 'all' && option.id !== 'adult' && option.id !== 'child')
    );
    
    if (isSpecificMember) {
      // Set the group filter based on member type
      setRespondentFilter(isSpecificMember.type);
      setSpecificRespondent(value);
    } else {
      // Set the group filter
      setRespondentFilter(value);
      setSpecificRespondent(null);
    }
  }, [getRespondentOptions]);
  
  // Handle cycle filter change - memoized with useCallback
  const handleCycleFilterChange = useCallback((e) => {
    const value = e.target.value;
    setCycleFilter(value === 'null' ? null : value);
  }, []);
  
  // Toggle historical data display - memoized with useCallback
  const toggleHistorical = useCallback(() => {
    setShowHistorical(prevState => !prevState);
  }, []);
  
  // Toggle filters section - memoized with useCallback
  const toggleFilters = useCallback(() => {
    setShowFilters(prevState => !prevState);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* No header with toggle - history feature is hidden */}
      
      {/* Legacy filters - hidden but still functional in the background */}
      <div className="hidden">
        <select
          value={specificRespondent || respondentFilter}
          onChange={handleRespondentFilterChange}
        >
          {getRespondentOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        
        <select
          value={cycleFilter === null ? 'null' : cycleFilter}
          onChange={handleCycleFilterChange}
        >
          {getCycleOptions.map(option => (
            <option key={option.id} value={option.id === null ? 'null' : option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Historical comparison */}
      {showHistorical && historicalData.length > 0 && (
        <div className="p-4 bg-purple-50 border-b border-purple-100">
          <div className="flex items-start">
            <History size={18} className="text-purple-600 mr-2 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-purple-800">Historical Comparison</h4>
              <p className="text-sm text-purple-700 mb-2">
                Comparing cycle {cycleFilter || currentWeek} with {historicalData.length} previous cycles
              </p>
              
              {/* Trend indicators for each category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {surveyAnalysis.imbalances && surveyAnalysis.imbalances.map(category => {
                  const change = getImbalanceChanges[category.category];
                  return (
                    <div key={category.category} className="bg-white rounded-md p-2 shadow-sm border border-purple-100">
                      <div className="text-xs font-medium text-gray-800">{category.category}</div>
                      <div className="mt-1 flex justify-between items-center">
                        <div className="text-sm font-bold">{category.imbalancePercent}%</div>
                        {change ? (
                          <div className={`text-xs ${change.improved ? 'text-green-600' : 'text-red-600'} font-medium flex items-center`}>
                            {change.improved ? 
                              <span>↓ {change.percentage}%</span> : 
                              <span>↑ {change.percentage}%</span>
                            }
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">No change</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main radar chart */}
      {surveyAnalysis.imbalances && surveyAnalysis.imbalances.length > 0 ? (
        <WorkloadRadarLayout 
          imbalances={surveyAnalysis.imbalances}
          onCategorySelect={onCategorySelect}
          mostImbalancedCategory={surveyAnalysis.mostImbalancedCategory}
          overallImbalance={surveyAnalysis.overallImbalance}
          confidence={surveyAnalysis.responseCount > 20 ? 90 : (surveyAnalysis.responseCount > 10 ? 70 : 50)}
          historicalData={showHistorical ? historicalData.map(h => h.analysis) : []}
        />
      ) : (
        <div className="p-8 text-center text-gray-500">
          <AlertTriangle size={32} className="mx-auto mb-4 text-amber-500" />
          <p className="font-medium">No survey data available for the selected filters</p>
          <p className="text-sm mt-2">Try adjusting your filters or complete more surveys</p>
        </div>
      )}
      
      {/* Removed the info footer as this info is now in the expandable panel in the parent component */}
    </div>
  );
};

export default EnhancedImbalanceRadarChart;