// src/components/dashboard/TaskMomentumTracker.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { TrendingUp, TrendingDown, Activity, BarChart3, Calendar, Zap } from 'lucide-react';

const TaskMomentumTracker = () => {
  const { getELORatings } = useFamily();
  const [ratings, setRatings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7days');
  const [momentum, setMomentum] = useState({});

  useEffect(() => {
    loadMomentumData();
  }, [selectedTimeframe]);

  const loadMomentumData = async () => {
    try {
      setLoading(true);
      const ratingsData = await getELORatings();
      setRatings(ratingsData);
      
      // Calculate momentum based on ratings and uncertainty
      if (ratingsData) {
        calculateMomentum(ratingsData);
      }
    } catch (error) {
      console.error('Error loading momentum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMomentum = (ratingsData) => {
    const momentumData = {};
    
    // Global momentum
    const globalMama = ratingsData.globalRatings.Mama;
    const globalPapa = ratingsData.globalRatings.Papa;
    const globalDiff = globalMama.rating - globalPapa.rating;
    
    momentumData.global = {
      direction: globalDiff > 0 ? 'mama' : 'papa',
      intensity: Math.abs(globalDiff) / 100, // Normalize
      velocity: Math.max(0, 100 - (globalMama.uncertainty + globalPapa.uncertainty) / 2), // Lower uncertainty = higher velocity
      trend: globalDiff > 50 ? 'increasing' : globalDiff < -50 ? 'decreasing' : 'stable'
    };

    // Category momentum
    Object.entries(ratingsData.categories || {}).forEach(([category, categoryData]) => {
      const mamaDiff = categoryData.Mama.rating - 1500; // Difference from starting point
      const papaDiff = categoryData.Papa.rating - 1500;
      const totalMatches = categoryData.Mama.matchCount + categoryData.Papa.matchCount;
      
      momentumData[category] = {
        direction: categoryData.Mama.rating > categoryData.Papa.rating ? 'mama' : 'papa',
        intensity: Math.abs(categoryData.Mama.rating - categoryData.Papa.rating) / 200,
        velocity: Math.min(100, totalMatches * 5), // More matches = more velocity
        trend: mamaDiff > papaDiff ? 'mama-gaining' : 'papa-gaining',
        confidence: Math.min(100, totalMatches * 10),
        recentActivity: totalMatches > 5 ? 'high' : totalMatches > 2 ? 'medium' : 'low'
      };
    });

    setMomentum(momentumData);
  };

  const getMomentumIcon = (direction, intensity) => {
    if (intensity > 0.7) {
      return direction === 'mama' ? 
        <TrendingUp className="text-purple-600" size={20} /> : 
        <TrendingDown className="text-blue-600" size={20} />;
    }
    return <Activity className="text-gray-500" size={20} />;
  };

  const getMomentumColor = (direction, intensity) => {
    if (intensity > 0.7) {
      return direction === 'mama' ? 'from-purple-500 to-pink-500' : 'from-blue-500 to-cyan-500';
    }
    if (intensity > 0.3) {
      return direction === 'mama' ? 'from-purple-300 to-pink-300' : 'from-blue-300 to-cyan-300';
    }
    return 'from-gray-300 to-gray-400';
  };

  const predictFutureTrend = (categoryMomentum) => {
    if (!categoryMomentum) return "Stable balance expected";
    
    if (categoryMomentum.intensity > 0.8 && categoryMomentum.velocity > 70) {
      return `Strong ${categoryMomentum.direction === 'mama' ? 'Mama' : 'Papa'} momentum - expect continued shift`;
    }
    if (categoryMomentum.intensity > 0.5) {
      return `Moderate imbalance trending toward ${categoryMomentum.direction === 'mama' ? 'Mama' : 'Papa'}`;
    }
    return "Balanced distribution - maintain current pattern";
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!ratings || !momentum.global) return null;

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
          <Activity className="mr-2" size={20} />
          Task Momentum Tracker
        </h3>
        <p className="text-sm text-gray-600">See who's gaining momentum and predict future trends</p>
      </div>

      {/* Global Momentum Dashboard */}
      <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Overall Family Momentum</h4>
          <div className="flex items-center">
            {getMomentumIcon(momentum.global.direction, momentum.global.intensity)}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Direction</p>
            <div className={`text-lg font-bold ${momentum.global.direction === 'mama' ? 'text-purple-600' : 'text-blue-600'}`}>
              {momentum.global.direction === 'mama' ? '← Mama' : 'Papa →'}
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Intensity</p>
            <div className="text-lg font-bold text-gray-700">
              {Math.round(momentum.global.intensity * 100)}%
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Velocity</p>
            <div className="text-lg font-bold text-gray-700">
              {Math.round(momentum.global.velocity)}
            </div>
          </div>
        </div>

        {/* Momentum Bar */}
        <div className="mt-4">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${getMomentumColor(momentum.global.direction, momentum.global.intensity)} transition-all duration-1000`}
              style={{ width: `${Math.min(100, momentum.global.intensity * 100)}%` }}
            />
          </div>
        </div>

        {/* Prediction */}
        <div className="mt-3 text-xs text-gray-600 flex items-center">
          <Zap size={12} className="mr-1 text-yellow-500" />
          <span className="font-medium">Prediction:</span>
          <span className="ml-1">{predictFutureTrend(momentum.global)}</span>
        </div>
      </div>

      {/* Category Momentum Cards */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Category Breakdown</h4>
        {Object.entries(momentum)
          .filter(([key]) => key !== 'global')
          .sort((a, b) => b[1].intensity - a[1].intensity)
          .slice(0, 4) // Show top 4 categories
          .map(([category, data]) => (
            <div key={category} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h5 className="text-sm font-medium text-gray-900">{category}</h5>
                <div className="flex items-center space-x-2">
                  {getMomentumIcon(data.direction, data.intensity)}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    data.recentActivity === 'high' ? 'bg-green-100 text-green-700' :
                    data.recentActivity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {data.recentActivity} activity
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                <div>
                  <p className="text-gray-500">Direction</p>
                  <p className={`font-medium ${data.direction === 'mama' ? 'text-purple-600' : 'text-blue-600'}`}>
                    {data.direction === 'mama' ? 'Mama' : 'Papa'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Intensity</p>
                  <p className="font-medium">{Math.round(data.intensity * 100)}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Velocity</p>
                  <p className="font-medium">{Math.round(data.velocity)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Confidence</p>
                  <p className="font-medium">{Math.round(data.confidence)}%</p>
                </div>
              </div>

              {/* Mini momentum bar */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full bg-gradient-to-r ${getMomentumColor(data.direction, data.intensity)}`}
                  style={{ width: `${Math.min(100, data.intensity * 100)}%` }}
                />
              </div>

              <p className="text-xs text-gray-600">{predictFutureTrend(data)}</p>
            </div>
          ))}
      </div>

      {/* Legend */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <BarChart3 className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" size={16} />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">How Momentum Works:</p>
            <p>Intensity = how imbalanced tasks are • Velocity = how quickly patterns are forming • 
            Higher confidence means more reliable predictions based on survey responses.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskMomentumTracker;