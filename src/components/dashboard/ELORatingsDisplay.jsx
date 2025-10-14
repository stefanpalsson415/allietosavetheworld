// src/components/dashboard/ELORatingsDisplay.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { Scale, TrendingUp, TrendingDown, Minus, BarChart2, Info, ChevronDown, Weight, Activity } from 'lucide-react';

const ELORatingsDisplay = ({ compact = false }) => {
  const { getELORatings, getELOCategoryImbalances, getTotalSurveyResponseCount, getRecentMatchHistory, getWeightStatistics } = useFamily();
  const [ratings, setRatings] = useState(null);
  const [imbalances, setImbalances] = useState({});
  const [totalResponseData, setTotalResponseData] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [weightStats, setWeightStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showWeightDetails, setShowWeightDetails] = useState(false);

  useEffect(() => {
    loadELOData();
  }, []);

  const loadELOData = async () => {
    try {
      setLoading(true);
      const [ratingsData, imbalanceData, responseData, matchHistory, weightData] = await Promise.all([
        getELORatings(),
        getELOCategoryImbalances(),
        getTotalSurveyResponseCount(),
        getRecentMatchHistory(5),
        getWeightStatistics()
      ]);
      
      setRatings(ratingsData);
      setImbalances(imbalanceData);
      setTotalResponseData(responseData);
      setRecentMatches(matchHistory);
      setWeightStats(weightData);
    } catch (error) {
      console.error('Error loading ELO data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!ratings || !ratings.globalRatings) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Scale className="mr-2" size={20} />
            Task Distribution Analysis (ELO Ratings)
          </h3>
        </div>
        <div className="text-center py-8">
          <BarChart2 size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No rating data available yet</p>
          <p className="text-sm text-gray-400 mt-2">Answer survey questions about task ownership to generate ratings</p>
        </div>
      </div>
    );
  }

  const getRatingColor = (rating) => {
    if (rating > 1600) return 'text-green-600';
    if (rating > 1400) return 'text-blue-600';
    if (rating < 1400) return 'text-red-600';
    return 'text-gray-600';
  };

  const getRatingIcon = (mamaRating, papaRating) => {
    const diff = mamaRating - papaRating;
    if (Math.abs(diff) < 50) return <Minus className="text-gray-500" size={16} />;
    if (diff > 0) return <TrendingUp className="text-purple-500" size={16} />;
    return <TrendingDown className="text-blue-500" size={16} />;
  };

  const getImbalanceLevel = (score) => {
    if (score > 200) return { text: 'Severe', color: 'text-red-600 bg-red-50' };
    if (score > 100) return { text: 'Moderate', color: 'text-orange-600 bg-orange-50' };
    if (score > 50) return { text: 'Mild', color: 'text-yellow-600 bg-yellow-50' };
    return { text: 'Balanced', color: 'text-green-600 bg-green-50' };
  };

  if (compact) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 flex items-center">
            <Scale className="mr-2" size={16} />
            Workload Balance (ELO)
          </h3>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-xs text-blue-600 hover:underline"
          >
            View Details
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500">Mama</p>
            <p className={`text-lg font-semibold ${getRatingColor(ratings.globalRatings.Mama.rating)}`}>
              {ratings.globalRatings.Mama.rating}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Papa</p>
            <p className={`text-lg font-semibold ${getRatingColor(ratings.globalRatings.Papa.rating)}`}>
              {ratings.globalRatings.Papa.rating}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Scale className="mr-2" size={20} />
          Task Distribution Analysis (ELO Ratings)
        </h3>
        <div className="flex items-center text-sm text-gray-500">
          <Info size={14} className="mr-1" />
          <span>Based on {totalResponseData?.aggregatedTotal || 0} total survey responses</span>
        </div>
      </div>

      {/* Global Ratings */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Overall Balance</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Mama</p>
            <p className={`text-3xl font-bold ${getRatingColor(ratings.globalRatings.Mama.rating)}`}>
              {ratings.globalRatings.Mama.rating}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(() => {
                // Find Mama's response count based on roleType
                const mamaResponses = totalResponseData?.responsesByMemberWithRoles && 
                  Object.entries(totalResponseData.responsesByMemberWithRoles).find(([memberId, data]) => 
                    data.memberInfo?.roleType === 'Mama'
                  );
                return mamaResponses ? mamaResponses[1].responseCount : ratings.globalRatings.Mama.matchCount;
              })()} responses
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Papa</p>
            <p className={`text-3xl font-bold ${getRatingColor(ratings.globalRatings.Papa.rating)}`}>
              {ratings.globalRatings.Papa.rating}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(() => {
                // Find Papa's response count based on roleType
                const papaResponses = totalResponseData?.responsesByMemberWithRoles && 
                  Object.entries(totalResponseData.responsesByMemberWithRoles).find(([memberId, data]) => 
                    data.memberInfo?.roleType === 'Papa'
                  );
                return papaResponses ? papaResponses[1].responseCount : ratings.globalRatings.Papa.matchCount;
              })()} responses
            </p>
          </div>
        </div>
      </div>

      {/* Weight Impact Section */}
      {weightStats && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700 flex items-center">
              <Weight className="mr-1" size={16} />
              Task Weight Impact
            </h4>
            <button
              onClick={() => setShowWeightDetails(!showWeightDetails)}
              className="text-xs text-blue-600 hover:underline"
            >
              {showWeightDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Weighted Load (Mama)</p>
              <p className="text-lg font-semibold text-purple-700">
                {Math.round(weightStats.totalWeightedLoad.Mama)} pts
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {weightStats.highWeightWins.Mama} heavy tasks
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">Weighted Load (Papa)</p>
              <p className="text-lg font-semibold text-blue-700">
                {Math.round(weightStats.totalWeightedLoad.Papa)} pts
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {weightStats.highWeightWins.Papa} heavy tasks
              </p>
            </div>
          </div>
          
          {showWeightDetails && recentMatches.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-gray-700 mb-2">Recent High-Impact Changes:</p>
              {recentMatches
                .filter(match => match.questionWeight > 7)
                .slice(0, 3)
                .map((match, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 truncate max-w-[200px]">
                      {match.taskType || match.questionText || 'Task'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded-full ${
                        match.response === 'Mama' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {match.response}
                      </span>
                      <span className="text-gray-500">
                        Weight: {match.questionWeight?.toFixed(1)}
                      </span>
                      <span className={`font-medium ${
                        match.weightMultiplier > 1 ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        {match.weightMultiplier > 1 ? '↑' : '→'} {Math.abs(match.categoryRatings?.ratingChanges?.[match.response] || 0)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Category Breakdown */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Category Analysis</h4>
        <div className="space-y-2">
          {Object.entries(imbalances)
            .sort((a, b) => b[1].score - a[1].score)
            .map(([category, data]) => {
              const imbalanceLevel = getImbalanceLevel(data.score);
              const isExpanded = selectedCategory === category;
              
              return (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setSelectedCategory(isExpanded ? null : category)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{category}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${imbalanceLevel.color}`}>
                        {imbalanceLevel.text}
                      </span>
                    </div>
                    <div className="flex items-center">
                      {getRatingIcon(data.mamaRating, data.papaRating)}
                      <ChevronDown
                        className={`ml-2 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        size={16}
                      />
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Mama Rating</p>
                          <p className={`text-lg font-semibold ${getRatingColor(data.mamaRating)}`}>
                            {data.mamaRating}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Papa Rating</p>
                          <p className={`text-lg font-semibold ${getRatingColor(data.papaRating)}`}>
                            {data.papaRating}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>Confidence: {Math.round(data.confidence * 100)}%</p>
                        <p>Based on {data.matchCount} questions</p>
                        {data.leader && (
                          <p className="mt-2 text-sm">
                            <strong>{data.leader}</strong> is handling more tasks in this category
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* ELO Explanation */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start">
          <Info className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" size={16} />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">How ELO Ratings Work:</p>
            <p className="mb-2">Like chess ratings, each parent starts at 1500. When you answer "Mama" for a task, 
            her rating goes up and Papa's goes down. Higher ratings indicate more responsibility. 
            "We Share It" keeps ratings stable while improving accuracy.</p>
            <p className="font-medium mt-2 mb-1">Task Weight Impact:</p>
            <p>Heavier tasks (frequent, invisible, emotionally demanding) now create larger rating changes. 
            A win on a weight-10 task affects ratings 2x more than a weight-5 task, better reflecting 
            actual workload distribution.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ELORatingsDisplay;