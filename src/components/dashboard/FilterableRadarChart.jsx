// src/components/dashboard/FilterableRadarChart.jsx
import React, { useState, useMemo } from 'react';
import { Users, Calendar, Filter } from 'lucide-react';
import NordicRadarChart from './NordicRadarChart';
import { motion } from 'framer-motion';

const FilterableRadarChart = ({ 
  surveyResponses,
  availableHabits,
  onSelectHabit,
  familyMembers = [],
  cycles = []
}) => {
  const [selectedPerson, setSelectedPerson] = useState('both');
  const [selectedCycle, setSelectedCycle] = useState('current');
  const [showFilters, setShowFilters] = useState(false);

  // Process survey data based on filters
  const processedData = useMemo(() => {
    if (!surveyResponses) return null;

    // Get the relevant cycle data
    const cycleData = selectedCycle === 'current' 
      ? surveyResponses[surveyResponses.length - 1]
      : surveyResponses.find(r => r.cycle === selectedCycle);

    if (!cycleData) return null;

    // Calculate averages for each category
    const calculateCategoryScore = (person, category) => {
      const responses = cycleData.responses?.[person]?.[category];
      if (!responses || responses.length === 0) return 50;
      
      const sum = responses.reduce((acc, val) => acc + val, 0);
      return (sum / responses.length) * 20; // Convert 1-5 scale to 0-100
    };

    // Build data structure for radar chart
    const categories = ['household', 'childcare', 'emotional', 'financial', 'planning'];
    const result = {
      mama: {},
      papa: {}
    };

    categories.forEach(cat => {
      result.mama[cat] = calculateCategoryScore('mama', cat);
      result.papa[cat] = calculateCategoryScore('papa', cat);
    });

    return result;
  }, [surveyResponses, selectedCycle]);

  // Filter controls
  const FilterControls = () => (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-50 rounded-lg p-4 mb-4"
    >
      <div className="grid grid-cols-2 gap-4">
        {/* Person Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Users size={16} className="inline mr-1" />
            Show Data For
          </label>
          <select
            value={selectedPerson}
            onChange={(e) => setSelectedPerson(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-purple-500 focus:border-transparent"
          >
            <option value="both">Both Parents</option>
            <option value="mama">Mama Only</option>
            <option value="papa">Papa Only</option>
          </select>
        </div>

        {/* Cycle Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar size={16} className="inline mr-1" />
            Cycle
          </label>
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 
                     focus:ring-purple-500 focus:border-transparent"
          >
            <option value="current">Current Cycle</option>
            {cycles.map((cycle, index) => (
              <option key={cycle.id} value={cycle.id}>
                Cycle {cycles.length - index} - {cycle.date}
              </option>
            ))}
          </select>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      {/* Filter Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 
                   bg-white border border-gray-300 rounded-lg hover:bg-gray-50 
                   focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <Filter size={16} />
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {/* Filter Controls */}
      {showFilters && <FilterControls />}

      {/* Radar Chart */}
      {processedData ? (
        <NordicRadarChart
          surveyData={processedData}
          onSelectHabit={onSelectHabit}
          selectedPerson={selectedPerson}
          selectedCycle={selectedCycle}
          availableHabits={availableHabits}
        />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500">No survey data available for the selected cycle</p>
        </div>
      )}
    </div>
  );
};

export default FilterableRadarChart;