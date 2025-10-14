import React, { useState, useEffect } from 'react';
import { BarChart3, X, Users, Home, Baby, Eye, EyeOff } from 'lucide-react';
import ELORatingService from '../../services/ELORatingService';
import { useFamily } from '../../contexts/FamilyContext';

const ELOImbalanceDisplay = () => {
  const [categoryImbalances, setCategoryImbalances] = useState({});
  const [taskImbalances, setTaskImbalances] = useState({});
  const [uncoveredTasks, setUncoveredTasks] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const { familyData } = useFamily();

  useEffect(() => {
    if (familyData?.familyId) {
      loadImbalanceData();
    }
  }, [familyData?.familyId]);

  const loadImbalanceData = async () => {
    try {
      setLoading(true);
      
      // Get category imbalances
      const catImbalances = await ELORatingService.getCategoryImbalances(familyData.familyId);
      setCategoryImbalances(catImbalances);
      
      // Get task imbalances
      const taskImbal = await ELORatingService.getTaskImbalances(familyData.familyId);
      setTaskImbalances(taskImbal);
      
      // Get uncovered tasks
      const uncovered = await ELORatingService.getUncoveredTasks(familyData.familyId);
      setUncoveredTasks(uncovered);
    } catch (error) {
      console.error('Error loading imbalance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    if (category.includes('Household')) return <Home size={16} />;
    if (category.includes('Parental')) return <Baby size={16} />;
    return <Users size={16} />;
  };

  const getVisibilityIcon = (category) => {
    if (category.includes('Invisible')) return <EyeOff size={16} />;
    return <Eye size={16} />;
  };

  const getCategoryColor = (category) => {
    if (category.includes('Invisible Parental')) return 'purple';
    if (category.includes('Visible Parental')) return 'blue';
    if (category.includes('Invisible Household')) return 'green';
    return 'amber';
  };

  const renderCategoryCard = (category, data) => {
    const color = getCategoryColor(category);
    const mamaWidth = Math.round(data.mamaRating / (data.mamaRating + data.papaRating) * 100);
    const papaWidth = 100 - mamaWidth;
    
    return (
      <div 
        key={category}
        className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
          selectedCategory === category ? 'border-gray-800 bg-gray-50' : 'border-gray-200'
        }`}
        onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getCategoryIcon(category)}
            {getVisibilityIcon(category)}
            <h3 className="font-medium text-sm">{category}</h3>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full bg-${color}-100 text-${color}-700 font-medium`}>
            {data.leader} leads
          </span>
        </div>
        
        {/* ELO Rating Bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Mama: {data.mamaRating}</span>
            <span>Papa: {data.papaRating}</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
            <div 
              className="bg-purple-500 transition-all"
              style={{ width: `${mamaWidth}%` }}
            />
            <div 
              className="bg-blue-500 transition-all"
              style={{ width: `${papaWidth}%` }}
            />
          </div>
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>Confidence: {Math.round(data.confidence * 100)}%</span>
          <span>{data.matchCount} responses</span>
        </div>
      </div>
    );
  };

  const renderTaskList = (category) => {
    const tasks = Object.entries(taskImbalances)
      .filter(([_, data]) => data.category === category)
      .sort((a, b) => b[1].score - a[1].score);
    
    if (tasks.length === 0) return null;
    
    return (
      <div className="mt-4 space-y-2">
        <h4 className="font-medium text-sm text-gray-700 mb-2">Individual Tasks:</h4>
        {tasks.map(([taskType, data]) => {
          const mamaWidth = Math.round(data.mamaRating / (data.mamaRating + data.papaRating) * 100);
          const papaWidth = 100 - mamaWidth;
          
          return (
            <div key={taskType} className="bg-white p-3 rounded border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-700 flex-1">{taskType}</p>
                {data.isUncovered && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-2">
                    Often uncovered
                  </span>
                )}
              </div>
              
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden flex">
                <div 
                  className="bg-purple-400 transition-all"
                  style={{ width: `${mamaWidth}%` }}
                />
                <div 
                  className="bg-blue-400 transition-all"
                  style={{ width: `${papaWidth}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{data.leader} ({Math.round(data.leader === 'Mama' ? mamaWidth : papaWidth)}%)</span>
                {data.neitherCount > 0 && (
                  <span className="text-red-600">{data.neitherCount} times uncovered</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="text-gray-700" size={24} />
        <h2 className="text-xl font-semibold">ELO-Based Task Balance</h2>
      </div>
      
      {/* Uncovered Tasks Summary */}
      {uncoveredTasks.total > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <X className="text-red-600" size={20} />
            <h3 className="font-medium text-red-900">Uncovered Tasks</h3>
          </div>
          <p className="text-sm text-red-700 mb-3">
            {uncoveredTasks.total} tasks that no one is handling
          </p>
          {uncoveredTasks.topUncoveredTasks && (
            <div className="space-y-1">
              {uncoveredTasks.topUncoveredTasks.slice(0, 5).map(({ task, count }) => (
                <div key={task} className="flex justify-between text-sm">
                  <span className="text-red-700">{task}</span>
                  <span className="text-red-600 font-medium">{count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Category Imbalances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(categoryImbalances).map(([category, data]) => 
          renderCategoryCard(category, data)
        )}
      </div>
      
      {/* Selected Category Task Details */}
      {selectedCategory && (
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            {getCategoryIcon(selectedCategory)}
            {getVisibilityIcon(selectedCategory)}
            {selectedCategory} - Task Breakdown
          </h3>
          {renderTaskList(selectedCategory)}
        </div>
      )}
      
      {/* Overall Summary */}
      <div className="mt-6 pt-6 border-t">
        <p className="text-sm text-gray-600">
          Based on {Object.keys(taskImbalances).length} different tasks tracked across all categories.
          Click on a category to see individual task breakdowns.
        </p>
      </div>
    </div>
  );
};

export default ELOImbalanceDisplay;