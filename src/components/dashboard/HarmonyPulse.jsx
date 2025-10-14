import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, TrendingUp, TrendingDown, Minus, AlertCircle,
  Info, ChevronRight, Activity, Brain, Home, Eye
} from 'lucide-react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';
import { useFamily } from '../../contexts/FamilyContext';

const HarmonyPulse = () => {
  const { taskRecommendations, weekHistory, surveyResponses } = useFamily();
  const [selectedMetric, setSelectedMetric] = useState('overall');
  const [timeRange, setTimeRange] = useState('week');

  // Calculate harmony metrics from survey responses
  const harmonyMetrics = useMemo(() => {
    // Default balanced state
    const defaultMetrics = {
      overall: 50,
      taskBalance: 50,
      emotionalLoad: 50,
      timeBalance: 50,
      satisfaction: 50
    };

    if (!surveyResponses || Object.keys(surveyResponses).length === 0) {
      return defaultMetrics;
    }

    // Initialize category data
    const categoryImbalances = {
      visible_household: { mama: 0, papa: 0, both: 0 },
      invisible_household: { mama: 0, papa: 0, both: 0 },
      visible_parenting: { mama: 0, papa: 0, both: 0 },
      invisible_parenting: { mama: 0, papa: 0, both: 0 }
    };

    // Process survey responses
    Object.entries(surveyResponses).forEach(([questionId, answer]) => {
      if (!answer || answer === 'N/A') return;
      
      const qNum = parseInt(questionId.replace(/[^0-9]/g, ''));
      if (isNaN(qNum)) return;
      
      // Map to category
      let category;
      if (qNum >= 1 && qNum <= 18) category = 'visible_household';
      else if (qNum >= 19 && qNum <= 36) category = 'invisible_household';
      else if (qNum >= 37 && qNum <= 54) category = 'visible_parenting';
      else if (qNum >= 55 && qNum <= 72) category = 'invisible_parenting';
      
      if (!category) return;
      
      const normalizedAnswer = answer.toString().toLowerCase().trim();
      if (normalizedAnswer.includes('mama') || normalizedAnswer.includes('mom')) {
        categoryImbalances[category].mama++;
      } else if (normalizedAnswer.includes('papa') || normalizedAnswer.includes('dad')) {
        categoryImbalances[category].papa++;
      } else if (normalizedAnswer.includes('both')) {
        categoryImbalances[category].both++;
      }
    });

    // Calculate balance scores
    const calculateBalance = (category) => {
      const total = category.mama + category.papa + category.both;
      if (total === 0) return 50;
      
      const mamaTotal = category.mama + (category.both * 0.5);
      const papaTotal = category.papa + (category.both * 0.5);
      const totalWork = mamaTotal + papaTotal;
      
      if (totalWork === 0) return 50;
      
      const mamaPercent = (mamaTotal / totalWork) * 100;
      const imbalance = Math.abs(mamaPercent - 50);
      
      // Convert imbalance to harmony score (0% imbalance = 100% harmony)
      return Math.max(0, Math.min(100, 100 - (imbalance * 2)));
    };

    // Calculate individual metrics
    const visibleHousehold = calculateBalance(categoryImbalances.visible_household);
    const invisibleHousehold = calculateBalance(categoryImbalances.invisible_household);
    const visibleParenting = calculateBalance(categoryImbalances.visible_parenting);
    const invisibleParenting = calculateBalance(categoryImbalances.invisible_parenting);

    // Task balance: average of all categories
    const taskBalance = Math.round((visibleHousehold + invisibleHousehold + visibleParenting + invisibleParenting) / 4);

    // Emotional load: specifically from invisible work imbalance
    const emotionalLoad = Math.round((invisibleHousehold + invisibleParenting) / 2);

    // Time balance: weighted by category importance
    const timeBalance = Math.round(
      visibleHousehold * 0.2 + 
      invisibleHousehold * 0.3 + 
      visibleParenting * 0.2 + 
      invisibleParenting * 0.3
    );

    // Satisfaction: based on how balanced things are overall
    const satisfaction = taskBalance;

    // Overall harmony with weighted factors
    const overall = Math.round(
      taskBalance * 0.3 + 
      emotionalLoad * 0.3 + 
      timeBalance * 0.2 + 
      satisfaction * 0.2
    );

    return {
      overall,
      taskBalance,
      emotionalLoad,
      timeBalance,
      satisfaction
    };
  }, [surveyResponses]);

  // Historical data for charts
  const historicalData = useMemo(() => {
    if (!weekHistory || !Array.isArray(weekHistory) || weekHistory.length === 0) {
      // Mock data for demo
      return [
        { week: 'W1', harmony: 45, trend: 'stable' },
        { week: 'W2', harmony: 48, trend: 'up' },
        { week: 'W3', harmony: 52, trend: 'up' },
        { week: 'W4', harmony: 55, trend: 'up' },
        { week: 'Current', harmony: harmonyMetrics.overall, trend: 'up' }
      ];
    }

    return weekHistory.slice(-4).map((week, index) => ({
      week: `W${index + 1}`,
      harmony: week.harmonyScore || 50,
      trend: index === 0 ? 'stable' : 
        week.harmonyScore > weekHistory[index - 1]?.harmonyScore ? 'up' : 
        week.harmonyScore < weekHistory[index - 1]?.harmonyScore ? 'down' : 'stable'
    })).concat([{
      week: 'Current',
      harmony: harmonyMetrics.overall,
      trend: harmonyMetrics.overall > (weekHistory[weekHistory.length - 1]?.harmonyScore || 50) ? 'up' : 'stable'
    }]);
  }, [weekHistory, harmonyMetrics]);

  // Gauge data for radial chart
  const gaugeData = [
    {
      name: 'Harmony',
      value: harmonyMetrics.overall,
      fill: harmonyMetrics.overall >= 70 ? '#10b981' : 
            harmonyMetrics.overall >= 50 ? '#f59e0b' : '#ef4444'
    }
  ];

  // Get trend icon
  const getTrendIcon = () => {
    const lastWeek = historicalData[historicalData.length - 2]?.harmony || 50;
    const current = harmonyMetrics.overall;
    
    if (current > lastWeek + 5) return <TrendingUp className="text-green-600" size={20} />;
    if (current < lastWeek - 5) return <TrendingDown className="text-red-600" size={20} />;
    return <Minus className="text-gray-600" size={20} />;
  };

  // Metric cards data
  const metricCards = [
    {
      id: 'taskBalance',
      label: 'Task Balance',
      value: harmonyMetrics.taskBalance,
      icon: Activity,
      color: 'blue',
      description: 'Distribution across categories'
    },
    {
      id: 'emotionalLoad',
      label: 'Emotional Load',
      value: harmonyMetrics.emotionalLoad,
      icon: Brain,
      color: 'purple',
      description: 'Cognitive & invisible labor'
    },
    {
      id: 'timeBalance',
      label: 'Time Balance',
      value: harmonyMetrics.timeBalance,
      icon: Home,
      color: 'green',
      description: 'Workload distribution'
    },
    {
      id: 'satisfaction',
      label: 'Satisfaction',
      value: harmonyMetrics.satisfaction,
      icon: Heart,
      color: 'pink',
      description: 'Task completion rate'
    }
  ];

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Heart className="mr-2 text-purple-600" size={20} />
            Harmony Pulse
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Real-time family balance and wellbeing metrics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Info size={16} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Main Harmony Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Gauge Chart */}
        <div className="lg:col-span-1">
          <div className="relative h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="60%" 
                outerRadius="90%" 
                barSize={20} 
                data={gaugeData}
                startAngle={180} 
                endAngle={0}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  fill={gaugeData[0].fill}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-gray-900">
                {harmonyMetrics.overall}%
              </div>
              <div className="text-sm text-gray-600">Overall</div>
              <div className="mt-2">{getTrendIcon()}</div>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="lg:col-span-2">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="harmonyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="harmony"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#harmonyGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric) => {
          const Icon = metric.icon;
          const isSelected = selectedMetric === metric.id;
          
          return (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`p-4 rounded-lg border transition-all ${
                isSelected 
                  ? 'border-purple-300 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon size={18} className={`text-${metric.color}-600`} />
                <span className="text-2xl font-bold text-gray-900">
                  {metric.value}%
                </span>
              </div>
              <h4 className="text-sm font-medium text-gray-900 text-left">
                {metric.label}
              </h4>
              <p className="text-xs text-gray-600 text-left mt-1">
                {metric.description}
              </p>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-${metric.color}-500 rounded-full transition-all duration-500`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-start space-x-3">
          <AlertCircle size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-purple-900">
              Harmony Insight
            </h4>
            <p className="text-sm text-purple-700 mt-1">
              {harmonyMetrics.overall >= 70 
                ? "Your family is in great harmony! Keep up the excellent balance."
                : harmonyMetrics.overall >= 50
                ? "Good progress on family balance. Focus on emotional load distribution for improvement."
                : "Consider redistributing tasks to improve family harmony. Chat with Allie for personalized suggestions."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HarmonyPulse;