// src/components/dashboard/ELOTugOfWar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { Users, TrendingUp, TrendingDown, AlertCircle, Scale } from 'lucide-react';

const ELOTugOfWar = () => {
  const { getELORatings, getELOCategoryImbalances } = useFamily();
  const [ratings, setRatings] = useState(null);
  const [imbalances, setImbalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('global');
  const [animationProgress, setAnimationProgress] = useState(50);
  const animationRef = useRef(null);

  useEffect(() => {
    loadELOData();
  }, []);

  const loadELOData = async () => {
    try {
      setLoading(true);
      const [ratingsData, imbalanceData] = await Promise.all([
        getELORatings(),
        getELOCategoryImbalances()
      ]);
      
      setRatings(ratingsData);
      setImbalances(imbalanceData);
      
      // Start animation after data loads
      if (ratingsData) {
        animateToPosition(ratingsData, 'global');
      }
    } catch (error) {
      console.error('Error loading ELO data:', error);
    } finally {
      setLoading(false);
    }
  };

  const animateToPosition = (ratingsData, category) => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    let targetPosition;
    if (category === 'global') {
      const mamaRating = ratingsData.globalRatings.Mama.rating;
      const papaRating = ratingsData.globalRatings.Papa.rating;
      const totalRating = mamaRating + papaRating;
      targetPosition = (mamaRating / totalRating) * 100;
    } else {
      const categoryData = imbalances[category];
      if (categoryData) {
        const totalRating = categoryData.mamaRating + categoryData.papaRating;
        targetPosition = (categoryData.mamaRating / totalRating) * 100;
      } else {
        targetPosition = 50;
      }
    }

    const animate = () => {
      setAnimationProgress(prev => {
        const diff = targetPosition - prev;
        if (Math.abs(diff) < 0.5) {
          return targetPosition;
        }
        return prev + diff * 0.1;
      });

      if (Math.abs(animationProgress - targetPosition) > 0.5) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  };

  useEffect(() => {
    if (ratings) {
      animateToPosition(ratings, selectedCategory);
    }
  }, [selectedCategory, ratings]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!ratings || !ratings.globalRatings) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
            <Users className="mr-2" size={20} />
            Task Distribution Tug-of-War
          </h3>
          <p className="text-sm text-gray-600">See who's pulling more weight in different areas</p>
        </div>
        <div className="text-center py-8">
          <Scale size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No workload data available yet</p>
          <p className="text-sm text-gray-400 mt-2">Complete the weekly survey to see task distribution</p>
        </div>
      </div>
    );
  }

  const getStrengthDescription = (position) => {
    if (position > 65) return { text: "Mama is carrying much more", color: "text-purple-600" };
    if (position > 55) return { text: "Mama is carrying more", color: "text-purple-500" };
    if (position >= 45 && position <= 55) return { text: "Well balanced!", color: "text-green-600" };
    if (position < 35) return { text: "Papa is carrying much more", color: "text-blue-600" };
    return { text: "Papa is carrying more", color: "text-blue-500" };
  };

  const strength = getStrengthDescription(animationProgress);
  const ropePosition = 100 - animationProgress; // Invert for visual effect

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
          <Users className="mr-2" size={20} />
          Task Distribution Tug-of-War
        </h3>
        <p className="text-sm text-gray-600">See who's pulling more weight in different areas</p>
      </div>

      {/* Category Selector */}
      <div className="mb-6">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="global">Overall Balance</option>
          {Object.keys(imbalances).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Tug of War Visualization */}
      <div className="relative mb-6">
        {/* Background */}
        <div className="h-32 bg-gradient-to-r from-purple-50 via-gray-50 to-blue-50 rounded-lg relative overflow-hidden">
          {/* Center line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300"></div>
          
          {/* Balance zones */}
          <div className="absolute left-1/2 top-0 bottom-0 w-20 -ml-10 bg-green-100 opacity-30"></div>
          
          {/* Rope */}
          <div className="absolute top-1/2 -mt-1 h-2 w-full">
            <div 
              className="h-full bg-gradient-to-r from-purple-400 to-blue-400 rounded-full shadow-lg transition-all duration-1000"
              style={{
                transform: `translateX(${ropePosition - 50}%)`,
                width: '100%'
              }}
            >
              {/* Knot in the middle of rope */}
              <div 
                className="absolute top-1/2 -mt-3 w-6 h-6 bg-yellow-400 rounded-full shadow-lg border-2 border-yellow-600"
                style={{ left: `${animationProgress}%`, transform: 'translateX(-50%)' }}
              />
            </div>
          </div>

          {/* Characters */}
          <div className="absolute bottom-4 left-8 text-center">
            <div className={`text-4xl mb-1 ${animationProgress > 55 ? 'animate-bounce' : ''}`}>
              👩
            </div>
            <p className="text-xs font-medium text-purple-600">Mama</p>
            <p className="text-xs text-purple-500">
              {selectedCategory === 'global' 
                ? ratings.globalRatings.Mama.rating 
                : imbalances[selectedCategory]?.mamaRating || '-'}
            </p>
          </div>
          
          <div className="absolute bottom-4 right-8 text-center">
            <div className={`text-4xl mb-1 ${animationProgress < 45 ? 'animate-bounce' : ''}`}>
              👨
            </div>
            <p className="text-xs font-medium text-blue-600">Papa</p>
            <p className="text-xs text-blue-500">
              {selectedCategory === 'global' 
                ? ratings.globalRatings.Papa.rating 
                : imbalances[selectedCategory]?.papaRating || '-'}
            </p>
          </div>
        </div>

        {/* Strength indicator */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className={`px-3 py-1 bg-white rounded-full shadow-md text-xs font-medium ${strength.color}`}>
            {strength.text}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-purple-50 rounded-lg p-3">
          <p className="text-purple-900 font-medium">Mama's Load</p>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round(animationProgress)}%
          </p>
          {animationProgress > 60 && (
            <p className="text-xs text-purple-500 mt-1 flex items-center">
              <AlertCircle size={12} className="mr-1" />
              Consider rebalancing
            </p>
          )}
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-blue-900 font-medium">Papa's Load</p>
          <p className="text-2xl font-bold text-blue-600">
            {Math.round(100 - animationProgress)}%
          </p>
          {animationProgress < 40 && (
            <p className="text-xs text-blue-500 mt-1 flex items-center">
              <AlertCircle size={12} className="mr-1" />
              Consider rebalancing
            </p>
          )}
        </div>
      </div>

      {/* Insights */}
      {selectedCategory !== 'global' && imbalances[selectedCategory] && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <span className="font-medium">Confidence:</span> {Math.round(imbalances[selectedCategory].confidence * 100)}% • 
            <span className="font-medium ml-2">Questions:</span> {imbalances[selectedCategory].matchCount}
          </p>
        </div>
      )}
    </div>
  );
};

export default ELOTugOfWar;