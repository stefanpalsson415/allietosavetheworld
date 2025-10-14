// src/components/dashboard/SimpleNordicRadar.jsx
import React, { useState, useMemo } from 'react';
import { 
  Home, Heart, Users, Briefcase, 
  Sparkles, Plus, X 
} from 'lucide-react';

const SimpleNordicRadar = ({ 
  surveyData, 
  onSelectHabit,
  selectedPerson = 'both',
  availableHabits = {},
  familyMembers = [],
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [respondentFilter, setRespondentFilter] = useState('parents'); // parents, kids, all
  const [showSurveyVisibility, setShowSurveyVisibility] = useState(false);

  // Define categories with visibility status
  const categories = [
    { id: 'household', label: 'Household', icon: Home, type: 'visible' },
    { id: 'childcare', label: 'Childcare', icon: Heart, type: 'visible' },
    { id: 'emotional', label: 'Emotional Labor', icon: Users, type: 'invisible' },
    { id: 'financial', label: 'Financial', icon: Briefcase, type: 'visible' },
    { id: 'planning', label: 'Planning', icon: Sparkles, type: 'invisible' }
  ];

  // All categories are visible in the chart
  const visibleCategories = categories;

  // Calculate radar data points with filtering
  const radarData = useMemo(() => {
    if (!surveyData) return { mama: [], papa: [] };

    // Apply respondent filter
    let filteredData = surveyData;
    if (respondentFilter === 'kids' && surveyData.kids) {
      // Use kids' perspective data if available
      filteredData = surveyData.kids;
    } else if (respondentFilter === 'parents') {
      // Use parents' data (default)
      filteredData = surveyData;
    }

    const processData = (person) => {
      return visibleCategories.map(cat => {
        const value = filteredData[person]?.[cat.id] || 50;
        return {
          category: cat.id,
          value: Math.min(100, Math.max(0, value))
        };
      });
    };

    return {
      mama: processData('mama'),
      papa: processData('papa')
    };
  }, [surveyData, respondentFilter, visibleCategories]);

  // SVG dimensions
  const size = 400;
  const center = size / 2;
  const maxRadius = size * 0.35;
  const levels = 5;

  // Calculate positions based on visible categories
  const angleStep = visibleCategories.length > 0 
    ? (2 * Math.PI) / visibleCategories.length 
    : 0;
  const startAngle = -Math.PI / 2;

  // Generate path for radar shape
  const generatePath = (data) => {
    if (!data || data.length === 0) return '';
    
    return data.map((point, index) => {
      const angle = startAngle + index * angleStep;
      const radius = (point.value / 100) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
  };

  // Get category position
  const getCategoryPosition = (index) => {
    const angle = startAngle + index * angleStep;
    const labelRadius = maxRadius + 40;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle)
    };
  };

  return (
    <div className={`${className}`}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Task Balance Overview
              {respondentFilter === 'kids' && (
                <span className="ml-2 text-sm font-normal text-purple-600">
                  (Kids' Perspective)
                </span>
              )}
              {respondentFilter === 'all' && (
                <span className="ml-2 text-sm font-normal text-blue-600">
                  (Combined View)
                </span>
              )}
            </h3>
            <div className="flex items-center gap-4 text-sm">
              {/* Person Legend */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                  <span className="text-gray-600">Mama</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="text-gray-600">Papa</span>
                </div>
              </div>
              
              {/* Task Type Legend */}
              <div className="flex items-center gap-3 pl-3 border-l border-gray-300">
                <span className="text-xs text-gray-500">Task Types:</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-normal text-gray-700">Regular</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                    Mental/Emotional Load
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 pb-3 border-b border-gray-200">
            {/* Respondent Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Show data from:</span>
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setRespondentFilter('parents')}
                  className={`px-3 py-1 text-xs rounded ${
                    respondentFilter === 'parents' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Parents
                </button>
                <button
                  onClick={() => setRespondentFilter('kids')}
                  className={`px-3 py-1 text-xs rounded ${
                    respondentFilter === 'kids' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Kids
                </button>
                <button
                  onClick={() => setRespondentFilter('all')}
                  className={`px-3 py-1 text-xs rounded ${
                    respondentFilter === 'all' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All
                </button>
              </div>
            </div>
            
            {/* Invisible Labor Info Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSurveyVisibility(!showSurveyVisibility)}
                className="text-sm text-purple-600 hover:text-purple-700 underline flex items-center gap-1"
              >
                {showSurveyVisibility ? 'Hide' : 'Learn about'} invisible labor
                <Sparkles size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Invisible Labor Explanation */}
        {showSurveyVisibility && (
          <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="text-sm font-medium text-purple-900 mb-2 flex items-center gap-2">
              <Sparkles size={16} />
              Understanding Invisible Labor
            </h4>
            <div className="space-y-3 text-xs">
              <div className="space-y-2">
                <div className="bg-white rounded p-3 border border-gray-200">
                  <span className="font-medium text-gray-900">Regular Tasks</span>
                  <p className="text-gray-600 mt-1">
                    <strong>Household:</strong> Cooking, cleaning, laundry<br/>
                    <strong>Childcare:</strong> Bathing, feeding, driving to activities<br/>
                    <strong>Financial:</strong> Paying bills, managing accounts
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded p-3 border border-purple-200">
                  <span className="font-medium text-purple-900">Mental/Emotional Load</span>
                  <span className="text-xs text-purple-600 ml-2">(Often invisible)</span>
                  <p className="text-gray-600 mt-1">
                    <strong>Emotional Labor:</strong> Managing family emotions, mediating conflicts, 
                    remembering birthdays, maintaining relationships<br/>
                    <strong>Planning:</strong> Thinking ahead, making lists, coordinating schedules, 
                    anticipating needs, worrying about family
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-purple-200">
                <p className="text-purple-700">
                  <strong>Why it matters:</strong> Invisible labor is real work that creates imbalance 
                  but often goes unacknowledged. Making it visible helps families recognize and 
                  redistribute this mental and emotional load.
                </p>
              </div>
              
              <div className="bg-purple-100 rounded p-2">
                <p className="text-purple-800">
                  On the chart, <strong>Emotional Labor</strong> and <strong>Planning</strong> 
                  have purple backgrounds because they represent mental/emotional load - 
                  the "invisible" work that's just as exhausting as physical tasks.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Chart and Categories */}
        <div className="flex gap-8">
          {/* Radar Chart */}
          <div className="flex-shrink-0">
            <svg width={size} height={size} className="overflow-visible">
              <defs>
                <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9F7AEA" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#9F7AEA" stopOpacity="0.1" />
                </linearGradient>
                <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4299E1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#4299E1" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Grid circles */}
              {[...Array(levels)].map((_, i) => (
                <circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={(maxRadius / levels) * (i + 1)}
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              ))}

              {/* Grid lines */}
              {visibleCategories.map((_, index) => {
                const angle = startAngle + index * angleStep;
                const x2 = center + maxRadius * Math.cos(angle);
                const y2 = center + maxRadius * Math.sin(angle);
                return (
                  <line
                    key={index}
                    x1={center}
                    y1={center}
                    x2={x2}
                    y2={y2}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Data shapes */}
              {selectedPerson !== 'papa' && (
                <path
                  d={generatePath(radarData.mama)}
                  fill="url(#purpleGradient)"
                  stroke="#9F7AEA"
                  strokeWidth="2"
                  opacity={selectedPerson === 'papa' ? 0.3 : 1}
                />
              )}
              
              {selectedPerson !== 'mama' && (
                <path
                  d={generatePath(radarData.papa)}
                  fill="url(#blueGradient)"
                  stroke="#4299E1"
                  strokeWidth="2"
                  opacity={selectedPerson === 'mama' ? 0.3 : 1}
                />
              )}

              {/* Category labels */}
              {visibleCategories.map((cat, index) => {
                const pos = getCategoryPosition(index);
                const isHovered = hoveredCategory === cat.id;
                const isInvisible = cat.type === 'invisible';
                
                return (
                  <g key={cat.id}>
                    {/* Background for invisible labor categories */}
                    {isInvisible && (
                      <g>
                        <rect
                          x={pos.x - 45}
                          y={pos.y - 20}
                          width="90"
                          height="40"
                          rx="20"
                          fill="#F3E8FF"
                          stroke="#9F7AEA"
                          strokeWidth="1.5"
                        />
                      </g>
                    )}
                    
                    <text
                      x={pos.x}
                      y={isInvisible ? pos.y - 5 : pos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className={`text-xs cursor-pointer select-none ${
                        isHovered ? 'fill-purple-600 font-semibold' : 
                        isInvisible ? 'fill-purple-700 font-semibold' : 'fill-gray-700 font-medium'
                      }`}
                      onMouseEnter={() => setHoveredCategory(cat.id)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat.label}
                    </text>
                    
                    {/* Subtitle for invisible labor */}
                    {isInvisible && (
                      <text
                        x={pos.x}
                        y={pos.y + 10}
                        textAnchor="middle"
                        className="text-purple-600"
                        fontSize="9"
                        fontStyle="italic"
                      >
                        (Mental Load)
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Category Actions */}
          <div className="flex-1 space-y-3">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Click a category in the chart to see available habits
            </h4>
            
            {selectedCategory ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {React.createElement(selectedCategory.icon, { 
                      size: 20, 
                      className: 'text-purple-600' 
                    })}
                    <h5 className="font-medium text-gray-900">
                      {selectedCategory.label} Habits
                    </h5>
                  </div>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(availableHabits[selectedCategory.id] || []).map(habit => (
                    <div
                      key={habit.id}
                      className="bg-white rounded p-3 border border-gray-200 hover:border-purple-300 
                               cursor-pointer transition-colors group"
                      onClick={() => {
                        onSelectHabit(habit);
                        setSelectedCategory(null);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h6 className="text-sm font-medium text-gray-900">
                            {habit.title}
                          </h6>
                          <p className="text-xs text-gray-600 mt-1">
                            {habit.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                              {habit.frequency}
                            </span>
                            <span className="text-xs text-gray-500">
                              {habit.duration}
                            </span>
                          </div>
                        </div>
                        <Plus size={16} className="text-purple-600 opacity-0 group-hover:opacity-100 
                                                   transition-opacity mt-1" />
                      </div>
                    </div>
                  ))}
                  
                  {(!availableHabits[selectedCategory.id] || 
                    availableHabits[selectedCategory.id].length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No habits available for this category
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {visibleCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 
                             hover:border-purple-300 hover:bg-purple-50 transition-all 
                             text-left group"
                  >
                    {React.createElement(cat.icon, { 
                      size: 20, 
                      className: 'text-gray-400 group-hover:text-purple-600' 
                    })}
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {cat.label}
                      </span>
                      {cat.type === 'invisible' && (
                        <span className="text-xs text-purple-600 block">Mental/Emotional</span>
                      )}
                    </div>
                  </button>
                ))}
                {visibleCategories.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No categories selected. Please select at least one task category above.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleNordicRadar;