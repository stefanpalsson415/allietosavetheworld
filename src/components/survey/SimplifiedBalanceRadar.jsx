// src/components/survey/SimplifiedBalanceRadar.jsx
import React, { useState, useMemo } from 'react';
import { 
  Eye, EyeOff, Brain, Wrench
} from 'lucide-react';

const SimplifiedBalanceRadar = ({ 
  surveyData, 
  onSelectHabit,
  className = ''
}) => {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Define the Four Categories
  const mainCategories = [
    { 
      id: 'invisible_parenting', 
      label: 'Invisible Parental', 
      icon: EyeOff,
      color: '#8B5CF6', // purple
      description: 'Planning, remembering, emotional work'
    },
    { 
      id: 'visible_parenting', 
      label: 'Visible Parental', 
      icon: Eye,
      color: '#3B82F6', // blue
      description: 'Physical care and activities'
    },
    { 
      id: 'invisible_household', 
      label: 'Invisible Household', 
      icon: Brain,
      color: '#10B981', // green
      description: 'Planning and mental household work'
    },
    { 
      id: 'visible_household', 
      label: 'Visible Household', 
      icon: Wrench,
      color: '#F59E0B', // amber
      description: 'Physical household management'
    }
  ];

  // Process survey data to get percentages
  const processedData = useMemo(() => {
    if (!surveyData || !surveyData.responses) {
      return { mama: {}, papa: {} };
    }

    // Count responses by category and parent
    const counts = {
      mama: {},
      papa: {}
    };

    // Initialize counts
    mainCategories.forEach(cat => {
      counts.mama[cat.id] = 0;
      counts.papa[cat.id] = 0;
    });

    // Process survey responses
    Object.entries(surveyData.responses).forEach(([questionId, response]) => {
      const question = surveyData.fullQuestions?.find(q => q.id === questionId);
      if (question && (response === 'Mama' || response === 'Papa')) {
        // Map question category to our four categories
        let categoryId = null;
        if (question.category === 'Invisible Parental Tasks') {
          categoryId = 'invisible_parenting';
        } else if (question.category === 'Visible Parental Tasks') {
          categoryId = 'visible_parenting';
        } else if (question.category === 'Invisible Household Tasks') {
          categoryId = 'invisible_household';
        } else if (question.category === 'Visible Household Tasks') {
          categoryId = 'visible_household';
        }

        if (categoryId && response === 'Mama') {
          counts.mama[categoryId]++;
        } else if (categoryId && response === 'Papa') {
          counts.papa[categoryId]++;
        }
      }
    });

    // Convert to percentages
    const result = { mama: {}, papa: {} };
    mainCategories.forEach(cat => {
      const total = counts.mama[cat.id] + counts.papa[cat.id];
      if (total > 0) {
        result.mama[cat.id] = Math.round((counts.mama[cat.id] / total) * 100);
        result.papa[cat.id] = Math.round((counts.papa[cat.id] / total) * 100);
      } else {
        // Default to 50/50 if no data
        result.mama[cat.id] = 50;
        result.papa[cat.id] = 50;
      }
    });

    return result;
  }, [surveyData]);

  // SVG dimensions
  const size = 300;
  const center = size / 2;
  const maxRadius = 100;

  // Generate path for radar chart
  const generatePath = (data, person) => {
    const points = mainCategories.map((cat, index) => {
      const angle = (Math.PI * 2 * index) / mainCategories.length - Math.PI / 2;
      const value = processedData[person][cat.id] || 0;
      const radius = (value / 100) * maxRadius;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      return { x, y };
    });

    const pathData = points.reduce((acc, point, index) => {
      return acc + (index === 0 ? 'M' : 'L') + ` ${point.x} ${point.y} `;
    }, '') + 'Z';

    return pathData;
  };

  // Get position for category labels
  const getCategoryPosition = (index) => {
    const angle = (Math.PI * 2 * index) / mainCategories.length - Math.PI / 2;
    const labelRadius = maxRadius + 40;
    return {
      x: center + labelRadius * Math.cos(angle),
      y: center + labelRadius * Math.sin(angle)
    };
  };

  return (
    <div className={`${className}`}>
      <div className="flex flex-col items-center">
        {/* Chart */}
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
          {[...Array(4)].map((_, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={(maxRadius / 4) * (i + 1)}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
          ))}

          {/* Grid lines */}
          {mainCategories.map((_, index) => {
            const angle = (Math.PI * 2 * index) / mainCategories.length - Math.PI / 2;
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
          <path
            d={generatePath(processedData, 'mama')}
            fill="url(#purpleGradient)"
            stroke="#9F7AEA"
            strokeWidth="2"
          />
          <path
            d={generatePath(processedData, 'papa')}
            fill="url(#blueGradient)"
            stroke="#4299E1"
            strokeWidth="2"
          />

          {/* Center display with colored indicators */}
          <g transform={`translate(${center}, ${center})`}>
            <circle r="30" fill="white" stroke="#E5E7EB" strokeWidth="1" />
            <text y="-10" textAnchor="middle" className="text-sm font-medium fill-gray-700">
              Balance
            </text>
            <g transform="translate(-15, 5)">
              <rect width="12" height="12" fill="#9F7AEA" rx="2" />
              <text x="16" y="9" className="text-xs fill-gray-600">M</text>
            </g>
            <g transform="translate(-15, 20)">
              <rect width="12" height="12" fill="#4299E1" rx="2" />
              <text x="16" y="9" className="text-xs fill-gray-600">P</text>
            </g>
          </g>

          {/* Category labels */}
          {mainCategories.map((cat, index) => {
            const pos = getCategoryPosition(index);
            const isHovered = hoveredCategory === cat.id;
            const Icon = cat.icon;
            
            return (
              <g 
                key={cat.id}
                className="cursor-pointer"
                onClick={() => onSelectHabit && onSelectHabit({
                  category: cat.id,
                  title: cat.label,
                  description: cat.description
                })}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {/* Icon background */}
                <circle
                  cx={pos.x}
                  cy={pos.y - 15}
                  r="20"
                  fill={isHovered ? cat.color : '#F3F4F6'}
                  fillOpacity={isHovered ? 0.2 : 1}
                  stroke={isHovered ? cat.color : '#E5E7EB'}
                  strokeWidth="2"
                />
                
                {/* Icon */}
                <g transform={`translate(${pos.x - 10}, ${pos.y - 25})`}>
                  <Icon 
                    size={20} 
                    color={isHovered ? cat.color : '#6B7280'}
                  />
                </g>
                
                {/* Label */}
                <text
                  x={pos.x}
                  y={pos.y + 10}
                  textAnchor="middle"
                  className={`text-xs font-medium select-none ${
                    isHovered ? 'fill-gray-900' : 'fill-gray-700'
                  }`}
                >
                  {cat.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend below chart */}
        <div className="mt-4 flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-6">
            {mainCategories.map(cat => (
              <div key={cat.id} className="flex items-center gap-1">
                <cat.icon size={14} color={cat.color} />
                <span className="text-gray-600">{cat.label}:</span>
                <span className="font-medium text-purple-600">{processedData.mama[cat.id]}%</span>
                <span className="text-gray-400">/</span>
                <span className="font-medium text-blue-600">{processedData.papa[cat.id]}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedBalanceRadar;