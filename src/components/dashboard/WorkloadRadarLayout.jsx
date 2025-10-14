// src/components/dashboard/WorkloadRadarLayout.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, Legend, ResponsiveContainer, Tooltip
} from 'recharts';
import { 
  Scale, 
  AlertTriangle, 
  Plus, 
  Calendar, 
  ChevronDown, 
  Users, 
  Zap,
  Sparkles,
  ArrowRightCircle
} from 'lucide-react';
import UserAvatar from '../../components/common/UserAvatar';
import { useFamily } from '../../contexts/FamilyContext';
import { useChatDrawer } from '../../contexts/ChatDrawerContext';
import useHabitCycles from '../../hooks/useHabitCycles';
import HabitCarryOverDialog from './HabitCarryOverDialog';
import HabitCyclesService from '../../services/HabitCyclesService';

// Nordic color palette - optimized for Notion-like aesthetic
const COLORS = {
  lavender: "#8E8EE0", // Mama color (lavender-400)
  pine: "#5C8A64",     // Papa color (pine-500)
  stone300: "#D1D5DB", // Grid lines
  stone50: "#FAFAFA",  // Background
  salmon: "#F27575",   // Warning color
  blue50: "#EFF6FF",   // Light blue for highlights
  blue100: "#DBEAFE",  // Slightly darker blue for emphasis
  neutral200: "#E5E7EB" // Light border color
};

const MAMA_COLOR = COLORS.lavender; // Lavender for Mama
const PAPA_COLOR = COLORS.pine; // Pine for Papa
const PROJECTED_OPACITY = 0.15; // Reduced opacity for Nordic aesthetic

const WorkloadRadarLayout = ({ 
  imbalances, 
  onCategorySelect,
  mostImbalancedCategory,
  overallImbalance,
  confidence = 70,
  historicalData = [], // Add support for historical data
  onCycleTransition = null // Callback for when a cycle transition occurs
}) => {
  // Access the user context to personalize the view
  const { selectedUser, familyMembers } = useFamily();
  // Access the chat drawer context
  const { openDrawerWithPrompt } = useChatDrawer();
  
  // State for tracking which category is being hovered
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tooltipData, setTooltipData] = useState({});
  
  // State for member-based filtering
  const [activeMemberFilters, setActiveMemberFilters] = useState(['all']);
  const [showCycleFilter, setShowCycleFilter] = useState(false);
  
  // Initialize the habit cycles hook
  const { 
    currentCycle, 
    cycles, 
    currentHabits, 
    showCycleTransition, 
    startNewCycle, 
    getFormattedDates, 
    dismissTransition 
  } = useHabitCycles(HabitCyclesService);

  // Determine if current user is Mama or Papa
  const isMama = selectedUser?.roleType === 'Mama';
  const isPapa = selectedUser?.roleType === 'Papa';
  const currentUserColor = isMama ? MAMA_COLOR : isPapa ? PAPA_COLOR : '#666666';
  
  // For personalized messaging
  const otherParentRole = isMama ? 'Papa' : isPapa ? 'Mama' : 'Other parent';

  // Memoize tooltip data for better performance
  const memoizedTooltipData = useMemo(() => {
    const tooltipDataObj = {};
    imbalances.forEach(category => {
      tooltipDataObj[category.category] = {
        mama: category.mamaPercent,
        papa: category.papaPercent,
        imbalance: category.imbalancePercent
      };
    });
    return tooltipDataObj;
  }, [imbalances]);
  
  // Update state once tooltip data changes
  useEffect(() => {
    setTooltipData(memoizedTooltipData);
  }, [memoizedTooltipData]);

  // Format radar chart data from imbalances - filtered by selected members
  const radarData = useMemo(() => {
    // If all members are selected, use the original data
    if (activeMemberFilters.includes('all') || activeMemberFilters.length === 0) {
      return imbalances.map(category => {
        // Create base data object
        const dataObj = {
          category: category.category,
          mama: category.mamaPercent,
          papa: category.papaPercent
        };
        
        // Add historical data points if available
        if (historicalData && historicalData.length > 0) {
          // Add data from up to 3 historical cycles
          historicalData.forEach((histData, index) => {
            // Find this category in historical data
            const histCategory = histData.imbalances?.find(c => c.category === category.category);
            
            if (histCategory) {
              // Use cycle number as identifier, or index if not available
              const cycleNum = histData.cycleNumber || (index + 1);
              dataObj[`mama_hist_${cycleNum}`] = histCategory.mamaPercent;
              dataObj[`papa_hist_${cycleNum}`] = histCategory.papaPercent;
            }
          });
        }
        
        return dataObj;
      });
    } 
    
    // Otherwise, filter the data for selected members
    const filteredMembers = familyMembers.filter(member => activeMemberFilters.includes(member.id));
    
    return imbalances.map(category => {
      // Create filtered data object for selected members only
      const dataObj = {
        category: category.category,
        mama: filteredMembers.some(m => m.roleType === 'Mama') ? category.mamaPercent : 0,
        papa: filteredMembers.some(m => m.roleType === 'Papa') ? category.papaPercent : 0
      };
      
      return dataObj;
    });
  }, [imbalances, activeMemberFilters, familyMembers, historicalData]);

  // Custom tooltip for radar chart - keeping it simple
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Get category data by label
      const categoryData = imbalances.find(cat => cat.category === label);
      if (!categoryData) return null;
      
      // Get values directly from the category
      const mamaValue = categoryData.mamaPercent;
      const papaValue = categoryData.papaPercent;
      
      // Highlight the current user's value
      const highlightedStyle = "font-bold";
      
      return (
        <div className="bg-white p-3 border shadow-lg rounded-lg text-sm">
          <p className="font-bold">{label}</p>
          <div className="flex justify-between gap-4 mt-1">
            <span className={`text-purple-700 ${isMama ? highlightedStyle : ''}`}>
              Mama: {mamaValue}%
              {isMama ? " (you)" : ""}
            </span>
            <span className={`text-green-700 ${isPapa ? highlightedStyle : ''}`}>
              Papa: {papaValue}%
              {isPapa ? " (you)" : ""}
            </span>
          </div>
          <div className="mt-1 text-amber-600 font-medium">
            {Math.abs(mamaValue - papaValue)}% imbalance
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle clicking on a category bar chart
  const handleCategoryClick = useCallback((category) => {
    setSelectedCategory(category.category);
    if (onCategorySelect) {
      onCategorySelect(category.category);
    }
  }, [onCategorySelect]);

  // Personalized message for imbalance
  const getPersonalizedImbalanceMessage = useCallback((category) => {
    if (!category) return "";
    
    const isDominant = (category.dominantRole === 'Mama' && isMama) || 
                       (category.dominantRole === 'Papa' && isPapa);
                       
    if (isDominant) {
      return `You're doing ${category.imbalancePercent}% more in this area`;
    } else {
      return `${category.dominantRole} is doing ${category.imbalancePercent}% more`;
    }
  }, [isMama, isPapa]);

  // Add state for the habit carry-over dialog
  const [showHabitCarryOver, setShowHabitCarryOver] = useState(false);
  
  // Handle habit selection for the new cycle
  const handleHabitsCarryOver = async (selectedHabits) => {
    try {
      // Start the new cycle with the selected habits
      const newCycle = await startNewCycle(selectedHabits);
      
      // Close the dialog
      setShowHabitCarryOver(false);
      
      // Call the callback if provided
      if (onCycleTransition) {
        onCycleTransition(newCycle);
      }
    } catch (error) {
      console.error("Error carrying over habits:", error);
      // You could add an error notification here
    }
  };
  
  // Formatted dates for the dialog
  const { cycleEndDate, cycleStartDate } = getFormattedDates();
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6 mb-6">
      <div className="mb-5">
        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 mb-3">
          <h3 className="font-medium text-indigo-800 mb-2 flex items-center">
            <Zap className="text-indigo-600 mr-2" size={18} />
            Balance Your Family Workload in 2 Simple Steps
          </h3>
          
          <div className="ml-6 space-y-3">
            <div className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-2 flex-shrink-0 font-medium text-xs">1</div>
              <p className="text-sm text-indigo-700">
                Look at the radar chart to see where imbalances exist. <span className="font-medium">Click on any category</span> to get habit recommendations that help create balance.
              </p>
            </div>
            
            <div className="flex items-start">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mr-2 flex-shrink-0 font-medium text-xs">2</div>
              <p className="text-sm text-indigo-700">
                Track your habits consistently to improve balance over time. Small daily actions create big changes!
              </p>
            </div>
          </div>
          
          <div className="mt-3 flex justify-center">
            <button 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm flex items-center shadow-sm"
              onClick={() => {
                // Generate a personalized prompt based on most imbalanced category
                const category = mostImbalancedCategory?.category || "family workload";
                const prompt = `I want you to help me choose a habit that will improve my family's ${category.toLowerCase()} balance. Based on our survey results, what would be the best habit for me to start with as a ${selectedUser?.roleType || 'parent'}? Give me 3 personalized options and help me choose one.`;
                
                // Open the chat drawer with this prompt
                openDrawerWithPrompt(prompt);
              }}
              aria-label="Let Allie choose a habit for you"
            >
              <Sparkles size={16} className="mr-1.5" />
              Let Allie Choose For Me
            </button>
          </div>
        </div>
      </div>

      {/* Alert for most imbalanced category - removed */}

      {/* Main layout with boxes on top and bottom of radar chart */}
      <div className="flex flex-col gap-4 mt-4">
        {/* Top row with two boxes */}
        <div className="grid grid-cols-3 gap-4">
          {/* Top Left Box - Visible Household Tasks - Notion style */}
          <div 
            className={`p-3 rounded-md border border-[#E5E7EB] cursor-pointer transition-colors bg-white hover:border-[#C1C7CD] ${
              selectedCategory === imbalances[0].category
                ? 'ring-1 ring-blue-200'
                : ''
            }`}
            onClick={() => handleCategoryClick(imbalances[0])}
            onMouseEnter={() => setHoveredCategory(imbalances[0].category)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <span className="font-medium text-[14px] text-gray-800">{imbalances[0].category}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    imbalances[0].imbalancePercent > 20 
                      ? 'bg-red-50 text-red-700' 
                      : imbalances[0].imbalancePercent > 10 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'bg-green-50 text-green-700'
                  }`}>
                    {imbalances[0].imbalancePercent}% imbalance
                  </span>
                </div>
              </div>
              
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div className="flex h-full">
                  <div 
                    className="bg-[#8E8EE0]" 
                    style={{ width: `${imbalances[0].mamaPercent}%` }}
                  ></div>
                  <div 
                    className="bg-[#5C8A64]" 
                    style={{ width: `${imbalances[0].papaPercent}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-3 text-xs text-gray-500">
                <span className={`${isMama ? 'text-[#8E8EE0] font-medium' : ''}`}>
                  Mama: {imbalances[0].mamaPercent}%{isMama ? " (you)" : ""}
                </span>
                <span className={`${isPapa ? 'text-[#5C8A64] font-medium' : ''}`}>
                  Papa: {imbalances[0].papaPercent}%{isPapa ? " (you)" : ""}
                </span>
              </div>
              
              <button 
                className="text-xs flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-blue-600 px-2.5 py-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategorySelect(imbalances[0].category);
                }}
              >
                <Plus size={12} className="mr-1" />
                Add a habit
              </button>
            </div>
          </div>

          {/* Center - Overall Balance - Notion style */}
          {overallImbalance && (
            <div className="p-3 bg-white rounded-md border border-[#E5E7EB] flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[14px] font-medium text-gray-800">Overall Family Balance</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {Math.abs(overallImbalance.mamaPercent - overallImbalance.papaPercent)}% imbalance
                </span>
              </div>
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div className="flex h-full">
                  <div 
                    className="bg-[#8E8EE0]" 
                    style={{ width: `${overallImbalance.mamaPercent}%` }}
                  ></div>
                  <div 
                    className="bg-[#5C8A64]" 
                    style={{ width: `${overallImbalance.papaPercent}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span className={`${isMama ? 'text-[#8E8EE0] font-medium' : ''}`}>
                  Mama: {overallImbalance.mamaPercent}%{isMama ? " (you)" : ""}
                </span>
                <span className={`${isPapa ? 'text-[#5C8A64] font-medium' : ''}`}>
                  Papa: {overallImbalance.papaPercent}%{isPapa ? " (you)" : ""}
                </span>
              </div>
            </div>
          )}

          {/* Top Right Box - Invisible Household Tasks - Notion style */}
          <div 
            className={`p-3 rounded-md border border-[#E5E7EB] cursor-pointer transition-colors bg-white hover:border-[#C1C7CD] ${
              selectedCategory === imbalances[1].category
                ? 'ring-1 ring-blue-200'
                : ''
            }`}
            onClick={() => handleCategoryClick(imbalances[1])}
            onMouseEnter={() => setHoveredCategory(imbalances[1].category)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <span className="font-medium text-[14px] text-gray-800">{imbalances[1].category}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    imbalances[1].imbalancePercent > 20 
                      ? 'bg-red-50 text-red-700' 
                      : imbalances[1].imbalancePercent > 10 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'bg-green-50 text-green-700'
                  }`}>
                    {imbalances[1].imbalancePercent}% imbalance
                  </span>
                </div>
              </div>
              
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div className="flex h-full">
                  <div 
                    className="bg-[#8E8EE0]" 
                    style={{ width: `${imbalances[1].mamaPercent}%` }}
                  ></div>
                  <div 
                    className="bg-[#5C8A64]" 
                    style={{ width: `${imbalances[1].papaPercent}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-3 text-xs text-gray-500">
                <span className={`${isMama ? 'text-[#8E8EE0] font-medium' : ''}`}>
                  Mama: {imbalances[1].mamaPercent}%{isMama ? " (you)" : ""}
                </span>
                <span className={`${isPapa ? 'text-[#5C8A64] font-medium' : ''}`}>
                  Papa: {imbalances[1].papaPercent}%{isPapa ? " (you)" : ""}
                </span>
              </div>
              
              <button 
                className="text-xs flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-blue-600 px-2.5 py-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategorySelect(imbalances[1].category);
                }}
              >
                <Plus size={12} className="mr-1" />
                Add a habit
              </button>
            </div>
          </div>
        </div>

        {/* Central radar chart with cycle filter dropdown */}
        <div className="h-[450px] md:h-[500px] mb-2 relative">
          {/* Small cycle filter dropdown (top-right of chart) */}
          <div className="absolute top-2 right-2 z-10">
            <div className="relative">
              <button 
                onClick={() => setShowCycleFilter(!showCycleFilter)}
                className="bg-white text-xs shadow-sm border border-gray-200 rounded-lg px-3 py-2 flex items-center"
              >
                <Calendar size={14} className="mr-1.5 text-blue-500" />
                <span>All Cycles</span>
                <ChevronDown size={14} className="ml-1.5" />
              </button>
              
              {showCycleFilter && (
                <div className="absolute right-0 top-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 w-48 z-20">
                  <div className="p-2 border-b border-gray-100">
                    <div className="text-xs font-medium text-gray-700">Select Survey Cycle</div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <div className="p-1">
                      <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-blue-50 font-medium text-blue-700">
                        All Cycles
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-blue-50">
                        Cycle 1
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-blue-50">
                        Initial Survey
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart 
              cx="50%" 
              cy="50%" 
              outerRadius="85%" 
              data={radarData}
              startAngle={45}
              endAngle={405}
            >
              <PolarGrid gridType="circle" stroke={COLORS.stone300} strokeWidth={1} className="radar-chart-grid" />
              <PolarAngleAxis 
                dataKey="category" 
                tick={(props) => {
                  const { x, y, payload } = props;
                  
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
                  
                  // Highlighted when hovered
                  const isHighlighted = hoveredCategory === payload.value;
                  const fontWeight = isHighlighted ? "bold" : "600";
                  const fontSize = isHighlighted ? 18 : 16;
                  const fill = isHighlighted ? "#2563EB" : "#4B5563";
                  
                  // Don't move the text from its original position
                  // This ensures the text stays at the corners of the chart
                  const nx = x;
                  const ny = y;
                  
                  return (
                    <g transform={`translate(${nx},${ny})`}>
                      <text
                        x={0}
                        y={0}
                        dy={-22}
                        textAnchor="middle"
                        fill={fill}
                        fontSize={fontSize}
                        fontWeight={fontWeight}
                      >
                        {visibility}
                      </text>
                      <text
                        x={0}
                        y={0}
                        dy={6}
                        textAnchor="middle"
                        fill={fill}
                        fontSize={fontSize}
                        fontWeight={fontWeight}
                      >
                        {type}
                      </text>
                    </g>
                  );
                }}
                tickLine={false}
                axisLine={{ stroke: '#666', strokeWidth: 2 }}
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tickCount={5}
                tick={{
                  fontSize: 14,
                  fontWeight: 600,
                  fill: '#4B5563'
                }}
                axisLine={{ stroke: '#666', strokeWidth: 1.5 }}
                tickLine={{ stroke: '#666', strokeWidth: 1.5 }}
              />
              
              {/* Historical data layers (rendered first so current data appears on top) */}
              {historicalData && historicalData.length > 0 && historicalData.map((histData, index) => {
                // Use cycle number as identifier, or index if not available
                const cycleNum = histData.cycleNumber || (index + 1);
                
                return (
                  <React.Fragment key={`hist-${cycleNum}`}>
                    <Radar
                      name={`Mama (Cycle ${cycleNum})`}
                      dataKey={`mama_hist_${cycleNum}`}
                      stroke={MAMA_COLOR}
                      fill={MAMA_COLOR}
                      fillOpacity={PROJECTED_OPACITY * 0.4}
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      dot={false}
                      legendType="none"
                      className="history-radar"
                    />
                    <Radar
                      name={`Papa (Cycle ${cycleNum})`}
                      dataKey={`papa_hist_${cycleNum}`}
                      stroke={PAPA_COLOR}
                      fill={PAPA_COLOR}
                      fillOpacity={PROJECTED_OPACITY * 0.4}
                      strokeWidth={1}
                      strokeDasharray="4 4"
                      dot={false}
                      legendType="none"
                      className="history-radar"
                    />
                  </React.Fragment>
                );
              })}
              
              {/* Current data */}
              <Radar
                name="Mama"
                dataKey="mama"
                stroke={MAMA_COLOR}
                fill={MAMA_COLOR}
                fillOpacity={PROJECTED_OPACITY}
                strokeWidth={3}
                activeDot={{ r: 8, strokeWidth: 2 }}
                className="mama-radar"
              />
              
              <Radar
                name="Papa"
                dataKey="papa"
                stroke={PAPA_COLOR}
                fill={PAPA_COLOR}
                fillOpacity={PROJECTED_OPACITY}
                strokeWidth={3}
                activeDot={{ r: 8, strokeWidth: 2 }}
                className="papa-radar"
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                align="center" 
                iconSize={16}
                wrapperStyle={{ 
                  paddingTop: '15px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
                formatter={(value) => {
                  // Add "you" to the label for the current user
                  if (value === "Mama" && isMama) return `${value} (you)`;
                  if (value === "Papa" && isPapa) return `${value} (you)`;
                  return value;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Cycle transition banner - shows when a cycle is ending */}
        {showCycleTransition && currentCycle && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fadeIn">
            <div className="flex items-start">
              <Calendar size={20} className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-blue-800 font-medium text-base">New Habit Cycle Starting</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Your current habit cycle ended on {getFormattedDates().cycleEndDate}. Would you like to
                  start a new cycle and choose which habits to carry over?
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
                    onClick={() => {
                      const { cycleEndDate, cycleStartDate } = getFormattedDates();
                      // Open the habit carry-over dialog
                      setShowHabitCarryOver(true);
                    }}
                  >
                    <ArrowRightCircle size={16} className="mr-1.5" />
                    Start New Cycle
                  </button>
                  <button
                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                    onClick={dismissTransition}
                  >
                    Remind Me Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        

        {/* Family member selector between boxes */}
        {familyMembers && familyMembers.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 my-5 px-4">
            <button 
              className={`flex items-center px-3 py-1.5 rounded-full border ${
                activeMemberFilters.includes('all') 
                  ? 'bg-blue-50 border-blue-300 text-blue-700' 
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
              onClick={() => setActiveMemberFilters(['all'])}
            >
              <Users size={16} className="mr-1.5" />
              <span className="text-sm font-medium">Everyone</span>
            </button>
            
            {familyMembers.map(member => (
              <button 
                key={member.id}
                className={`flex items-center px-2 py-1.5 rounded-full border ${
                  activeMemberFilters.includes(member.id) 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => {
                  if (activeMemberFilters.includes('all')) {
                    // If all is selected, switch to just this member
                    setActiveMemberFilters([member.id]);
                  } else if (activeMemberFilters.includes(member.id)) {
                    // If already selected, toggle off (but ensure at least one selected)
                    const newFilters = activeMemberFilters.filter(id => id !== member.id);
                    setActiveMemberFilters(newFilters.length > 0 ? newFilters : ['all']);
                  } else {
                    // Add this member to selected filters
                    setActiveMemberFilters([...activeMemberFilters, member.id]);
                  }
                }}
              >
                <UserAvatar 
                  user={member}
                  size={24}
                  className="mr-1.5"
                />
                <span className="text-sm font-medium">
                  {member.name}
                </span>
              </button>
            ))}
          </div>
        )}
        
        {/* Bottom row with two boxes */}
        <div className="grid grid-cols-3 gap-4">
          {/* Bottom Left Box - Visible Parental Tasks - Notion style */}
          <div 
            className={`p-3 rounded-md border border-[#E5E7EB] cursor-pointer transition-colors bg-white hover:border-[#C1C7CD] ${
              selectedCategory === imbalances[2].category
                ? 'ring-1 ring-blue-200'
                : ''
            }`}
            onClick={() => handleCategoryClick(imbalances[2])}
            onMouseEnter={() => setHoveredCategory(imbalances[2].category)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <span className="font-medium text-[14px] text-gray-800">{imbalances[2].category}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    imbalances[2].imbalancePercent > 20 
                      ? 'bg-red-50 text-red-700' 
                      : imbalances[2].imbalancePercent > 10 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'bg-green-50 text-green-700'
                  }`}>
                    {imbalances[2].imbalancePercent}% imbalance
                  </span>
                </div>
              </div>
              
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div className="flex h-full">
                  <div 
                    className="bg-[#8E8EE0]" 
                    style={{ width: `${imbalances[2].mamaPercent}%` }}
                  ></div>
                  <div 
                    className="bg-[#5C8A64]" 
                    style={{ width: `${imbalances[2].papaPercent}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-3 text-xs text-gray-500">
                <span className={`${isMama ? 'text-[#8E8EE0] font-medium' : ''}`}>
                  Mama: {imbalances[2].mamaPercent}%{isMama ? " (you)" : ""}
                </span>
                <span className={`${isPapa ? 'text-[#5C8A64] font-medium' : ''}`}>
                  Papa: {imbalances[2].papaPercent}%{isPapa ? " (you)" : ""}
                </span>
              </div>
              
              <button 
                className="text-xs flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-blue-600 px-2.5 py-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategorySelect(imbalances[2].category);
                }}
              >
                <Plus size={12} className="mr-1" />
                Add a habit
              </button>
            </div>
          </div>

          {/* Empty middle space */}
          <div></div>

          {/* Bottom Right Box - Invisible Household Tasks - Notion style */}
          <div 
            className={`p-3 rounded-md border border-[#E5E7EB] cursor-pointer transition-colors bg-white hover:border-[#C1C7CD] ${
              selectedCategory === imbalances[3].category
                ? 'ring-1 ring-blue-200'
                : ''
            }`}
            onClick={() => handleCategoryClick(imbalances[3])}
            onMouseEnter={() => setHoveredCategory(imbalances[3].category)}
            onMouseLeave={() => setHoveredCategory(null)}
          >
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <span className="font-medium text-[14px] text-gray-800">{imbalances[3].category}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    imbalances[3].imbalancePercent > 20 
                      ? 'bg-red-50 text-red-700' 
                      : imbalances[3].imbalancePercent > 10 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'bg-green-50 text-green-700'
                  }`}>
                    {imbalances[3].imbalancePercent}% imbalance
                  </span>
                </div>
              </div>
              
              <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden mb-1.5">
                <div className="flex h-full">
                  <div 
                    className="bg-[#8E8EE0]" 
                    style={{ width: `${imbalances[3].mamaPercent}%` }}
                  ></div>
                  <div 
                    className="bg-[#5C8A64]" 
                    style={{ width: `${imbalances[3].papaPercent}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-3 text-xs text-gray-500">
                <span className={`${isMama ? 'text-[#8E8EE0] font-medium' : ''}`}>
                  Mama: {imbalances[3].mamaPercent}%{isMama ? " (you)" : ""}
                </span>
                <span className={`${isPapa ? 'text-[#5C8A64] font-medium' : ''}`}>
                  Papa: {imbalances[3].papaPercent}%{isPapa ? " (you)" : ""}
                </span>
              </div>
              
              <button 
                className="text-xs flex items-center justify-center bg-white border border-gray-200 hover:bg-gray-50 text-blue-600 px-2.5 py-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  onCategorySelect(imbalances[3].category);
                }}
              >
                <Plus size={12} className="mr-1" />
                Add a habit
              </button>
            </div>
          </div>
        </div>
      </div>
    
      {/* Habit Carry Over Dialog */}
      <HabitCarryOverDialog
        isOpen={showHabitCarryOver}
        currentHabits={currentHabits}
        cycleEndDate={cycleEndDate}
        cycleStartDate={cycleStartDate}
        onConfirm={handleHabitsCarryOver}
        onCancel={() => setShowHabitCarryOver(false)}
      />
    </div>
  );
};

export default WorkloadRadarLayout;