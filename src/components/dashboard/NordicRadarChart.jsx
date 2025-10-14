// src/components/dashboard/NordicRadarChart.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Home, Heart, Users, Briefcase, 
  Sparkles, ChevronRight, Plus, X 
} from 'lucide-react';

const NordicRadarChart = ({ 
  surveyData, 
  onSelectHabit,
  selectedPerson = 'both',
  selectedCycle = 'current',
  availableHabits = {},
  className = ''
}) => {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [habitsPanelOpen, setHabitsPanelOpen] = useState(false);

  // Define categories with icons and colors
  const categories = [
    { id: 'household', label: 'Household', icon: Home, color: 'purple' },
    { id: 'childcare', label: 'Childcare', icon: Heart, color: 'pink' },
    { id: 'emotional', label: 'Emotional Labor', icon: Users, color: 'blue' },
    { id: 'financial', label: 'Financial', icon: Briefcase, color: 'green' },
    { id: 'planning', label: 'Planning', icon: Sparkles, color: 'orange' }
  ];

  // Calculate radar data points
  const radarData = useMemo(() => {
    if (!surveyData) return { mama: [], papa: [] };

    const processData = (person) => {
      return categories.map(cat => {
        const value = surveyData[person]?.[cat.id] || 50;
        // Normalize to 0-100 scale
        return {
          category: cat.id,
          value: Math.min(100, Math.max(0, value)),
          angle: 0 // Will be calculated
        };
      });
    };

    return {
      mama: processData('mama'),
      papa: processData('papa')
    };
  }, [surveyData]);

  // SVG dimensions
  const size = 400;
  const center = size / 2;
  const maxRadius = size * 0.4;
  const levels = 5;

  // Calculate angle for each category
  const angleStep = (2 * Math.PI) / categories.length;
  const startAngle = -Math.PI / 2; // Start from top

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

  // Handle category interaction
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setHabitsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setHabitsPanelOpen(false);
    setTimeout(() => setSelectedCategory(null), 300);
  };

  // Get habits for selected category
  const categoryHabits = selectedCategory 
    ? (availableHabits[selectedCategory.id] || [])
    : [];

  return (
    <div className={`relative ${className}`}>
      {/* Main Chart Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8" style={{ minHeight: '500px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Task Balance Overview</h3>
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                <span className="text-gray-600">Mama</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span className="text-gray-600">Papa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="relative flex justify-center">
          <svg 
            width={size} 
            height={size} 
            className="mx-auto"
            viewBox={`0 0 ${size} ${size}`}
            style={{ filter: 'url(#glow)', maxWidth: '100%', height: 'auto' }}
          >
            {/* Definitions for gradients and filters */}
            <defs>
              {/* Glow filter */}
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              {/* Gradients */}
              <radialGradient id="purple-gradient">
                <stop offset="0%" stopColor="#9F7AEA" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#9F7AEA" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="blue-gradient">
                <stop offset="0%" stopColor="#4299E1" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4299E1" stopOpacity="0" />
              </radialGradient>
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
                strokeDasharray="2,4"
                opacity="0.5"
              />
            ))}

            {/* Grid lines and labels */}
            {categories.map((cat, index) => {
              const angle = startAngle + index * angleStep;
              const x1 = center;
              const y1 = center;
              const x2 = center + maxRadius * Math.cos(angle);
              const y2 = center + maxRadius * Math.sin(angle);
              const labelX = center + (maxRadius + 30) * Math.cos(angle);
              const labelY = center + (maxRadius + 30) * Math.sin(angle);

              const isHovered = hoveredCategory?.id === cat.id;
              const Icon = cat.icon;

              return (
                <g key={cat.id}>
                  {/* Grid line */}
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                    opacity="0.3"
                  />
                  
                  {/* Category label with icon */}
                  <g
                    transform={`translate(${labelX}, ${labelY})`}
                    className="cursor-pointer"
                    onClick={() => handleCategoryClick(cat)}
                    onMouseEnter={() => setHoveredCategory(cat)}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    <motion.g
                      initial={false}
                      animate={{
                        scale: isHovered ? 1.1 : 1,
                        opacity: hoveredCategory && !isHovered ? 0.5 : 1
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <circle
                        cx="0"
                        cy="-10"
                        r="3"
                        fill={isHovered ? '#9F7AEA' : '#9CA3AF'}
                      />
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        className="text-xs font-medium fill-gray-700"
                      >
                        {cat.label}
                      </text>
                    </motion.g>
                  </g>
                </g>
              );
            })}

            {/* Mama's data */}
            <motion.path
              d={generatePath(radarData.mama)}
              fill="url(#purple-gradient)"
              stroke="#9F7AEA"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: selectedPerson === 'papa' ? 0.3 : 1,
                scale: 1 
              }}
              transition={{ duration: 0.5 }}
            />

            {/* Papa's data */}
            <motion.path
              d={generatePath(radarData.papa)}
              fill="url(#blue-gradient)"
              stroke="#4299E1"
              strokeWidth="2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: selectedPerson === 'mama' ? 0.3 : 1,
                scale: 1 
              }}
              transition={{ duration: 0.5 }}
            />

            {/* Data points */}
            {categories.map((cat, index) => {
              const angle = startAngle + index * angleStep;
              const mamaValue = radarData.mama[index]?.value || 50;
              const papaValue = radarData.papa[index]?.value || 50;
              const mamaRadius = (mamaValue / 100) * maxRadius;
              const papaRadius = (papaValue / 100) * maxRadius;
              const mamaX = center + mamaRadius * Math.cos(angle);
              const mamaY = center + mamaRadius * Math.sin(angle);
              const papaX = center + papaRadius * Math.cos(angle);
              const papaY = center + papaRadius * Math.sin(angle);

              return (
                <g key={`points-${cat.id}`}>
                  {selectedPerson !== 'papa' && (
                    <motion.circle
                      cx={mamaX}
                      cy={mamaY}
                      r="4"
                      fill="#9F7AEA"
                      stroke="white"
                      strokeWidth="2"
                      whileHover={{ r: 6 }}
                      className="cursor-pointer"
                    />
                  )}
                  {selectedPerson !== 'mama' && (
                    <motion.circle
                      cx={papaX}
                      cy={papaY}
                      r="4"
                      fill="#4299E1"
                      stroke="white"
                      strokeWidth="2"
                      whileHover={{ r: 6 }}
                      className="cursor-pointer"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover tooltip */}
          <AnimatePresence>
            {hoveredCategory && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                          bg-white rounded-lg shadow-lg p-3 pointer-events-none z-10"
              >
                <p className="text-sm font-medium text-gray-900">{hoveredCategory.label}</p>
                <p className="text-xs text-gray-600 mt-1">Click to see habits</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Habits Side Panel */}
      <AnimatePresence>
        {habitsPanelOpen && selectedCategory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-20 z-40"
              onClick={handleClosePanel}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-hidden"
            >
              {/* Panel Header */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center">
                      {React.createElement(selectedCategory.icon, { size: 20, className: 'text-gray-700' })}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{selectedCategory.label}</h3>
                      <p className="text-sm text-gray-600">Select a habit to add</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClosePanel}
                    className="p-2 hover:bg-white rounded-lg transition-colors"
                  >
                    <X size={20} className="text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Habits List */}
              <div className="p-6 overflow-y-auto h-full pb-32">
                <div className="space-y-3">
                  {categoryHabits.map((habit, index) => (
                    <motion.div
                      key={habit.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group bg-gray-50 rounded-xl p-4 hover:bg-gray-100 
                               transition-all cursor-pointer border border-transparent 
                               hover:border-gray-200 hover:shadow-sm"
                      onClick={() => {
                        onSelectHabit(habit);
                        handleClosePanel();
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">{habit.title}</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">{habit.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              {habit.frequency || 'Weekly'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {habit.duration || '15 min'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Plus size={20} className="text-purple-600" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {categoryHabits.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No habits available for this category</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NordicRadarChart;