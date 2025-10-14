import React, { useState } from 'react';
import { Layers, DollarSign, BarChart, TrendingUp, ArrowRight } from 'lucide-react';

const FamilyFlywheelSlide3 = () => {
  const [selectedAge, setSelectedAge] = useState('all');
  
  // LTV model data
  const ltvData = {
    '0-4': {
      annualSub: 480,
      gmv: 2500,
      allieTake: 200,
      description: 'During early childhood, families need significant gear and supplies (strollers, car seats, diapers, etc.). Allie helps with both major purchases and recurring necessities.',
      examples: ['Growth-based clothing subscriptions', 'Diaper/formula delivery', 'Age-appropriate toys', 'Childcare services'],
      icon: '👶'
    },
    '5-12': {
      annualSub: 480,
      gmv: 3000,
      allieTake: 300,
      description: 'School-age children need educational supplies, hobby equipment, and activity coordination. This is a high-engagement phase for both logistics and commerce.',
      examples: ['School supplies automation', 'Sports/activity equipment', 'After-school program matches', 'Educational subscriptions'],
      icon: '🧒'
    },
    '13-18': {
      annualSub: 480,
      gmv: 5000,
      allieTake: 500,
      description: 'Teen years bring bigger purchases (tech, travel, college prep) and specialized services that command higher margins.',
      examples: ['College counseling services', 'High-end tech products', 'Travel planning', 'Test prep courses'],
      icon: '👦'
    },
    'all': {
      annualSub: 8640,
      gmv: 10500,
      allieTake: 1000,
      description: 'Over a child\'s full development, Allie becomes an essential family partner - capturing value through both subscription revenue and high-margin commerce.',
      examples: ['Milestone event planning', 'College planning services', 'Family insurance optimization', 'Cross-child hand-me-down management'],
      icon: '👨‍👩‍👧‍👦'
    }
  };

  // Calculate subscription bar width based on maxiumum annual subscription value
  const getSubWidth = (value) => {
    return (value / 480) * 25; // Maximum width percentage
  };
  
  // Calculate GMV bar width based on maximum GMV value
  const getGmvWidth = (value) => {
    return (value / 5000) * 100; // Maximum width percentage
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-2">Lifetime Value Model</h2>
        <h3 className="text-xl font-light text-gray-600 mb-6">From subscription-only to comprehensive commerce partner</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left side: LTV table and interactive age selector */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-medium mb-4 flex items-center">
                <Layers size={20} className="mr-2 text-purple-600" />
                Per-Family Revenue Model
              </h3>
              
              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-2">Select age band to see details:</div>
                <div className="flex space-x-3">
                  <button 
                    onClick={() => setSelectedAge('0-4')}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      selectedAge === '0-4' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2">👶</span> 0-4 Years
                  </button>
                  <button 
                    onClick={() => setSelectedAge('5-12')}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      selectedAge === '5-12' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2">🧒</span> 5-12 Years
                  </button>
                  <button 
                    onClick={() => setSelectedAge('13-18')}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      selectedAge === '13-18' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2">👦</span> 13-18 Years
                  </button>
                  <button 
                    onClick={() => setSelectedAge('all')}
                    className={`px-4 py-2 rounded-lg flex items-center ${
                      selectedAge === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <span className="mr-2">👨‍👩‍👧‍👦</span> Full Childhood
                  </button>
                </div>
              </div>
              
              {/* Dynamic revenue visualization based on selected age */}
              <div className="space-y-6">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center">
                      <DollarSign size={16} className="mr-1 text-green-600" /> 
                      Annual Subscription
                    </span>
                    <span className="font-medium">${ltvData[selectedAge].annualSub.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-6">
                    <div 
                      className="h-6 rounded-full bg-green-500 flex items-center justify-end pr-2 text-xs text-white"
                      style={{ width: `${getSubWidth(ltvData[selectedAge].annualSub)}%` }}
                    >
                      {selectedAge !== 'all' && '$40/mo'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center">
                      <BarChart size={16} className="mr-1 text-blue-600" /> 
                      Avg GMV Influenced
                    </span>
                    <span className="font-medium">${ltvData[selectedAge].gmv.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-6">
                    <div 
                      className="h-6 rounded-full bg-blue-500 flex items-center justify-end pr-2 text-xs text-white"
                      style={{ width: `${getGmvWidth(ltvData[selectedAge].gmv)}%` }}
                    >
                      {selectedAge !== 'all' && `$${ltvData[selectedAge].gmv.toLocaleString()}`}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium flex items-center">
                      <TrendingUp size={16} className="mr-1 text-purple-600" /> 
                      Allie Take (8-15%)
                    </span>
                    <span className="font-medium">${ltvData[selectedAge].allieTake.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-6">
                    <div 
                      className="h-6 rounded-full bg-purple-500 flex items-center justify-end pr-2 text-xs text-white"
                      style={{ width: `${getGmvWidth(ltvData[selectedAge].allieTake) * 2}%` }}
                    >
                      {selectedAge !== 'all' && `$${ltvData[selectedAge].allieTake.toLocaleString()}`}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Description of selected age bracket */}
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <p className="text-sm">{ltvData[selectedAge].description}</p>
              </div>
            </div>
            
            {/* Examples for selected age bracket */}
            <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                <span className="mr-2 text-xl">{ltvData[selectedAge].icon}</span>
                Example Revenue Opportunities: {selectedAge === 'all' ? 'Across Childhood' : selectedAge + ' years'}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {ltvData[selectedAge].examples.map((example, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg text-sm flex items-start">
                    <div className="bg-blue-100 p-1 rounded-full mr-2">
                      <DollarSign size={14} className="text-blue-800" />
                    </div>
                    {example}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right side: LTV headline and value props */}
          <div className="space-y-6">
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h3 className="text-xl font-medium mb-4 text-purple-800">Projected Lifetime Value</h3>
              <div className="text-4xl font-bold text-purple-700 mb-2">$15,000-30,000</div>
              <p className="text-sm mb-4">Per family over a child's first 18 years</p>
              
              <div className="space-y-3">
                <div className="flex items-center text-sm">
                  <div className="w-20">Subscription</div>
                  <div className="font-medium">$8,600</div>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-20">Commerce</div>
                  <div className="font-medium">$3,500-6,000</div>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-20">Milestones</div>
                  <div className="font-medium">$2,000-4,000</div>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-20">Multi-child</div>
                  <div className="font-medium">+$5,000-10,000</div>
                </div>
                <div className="h-px bg-purple-200 my-2"></div>
                <div className="flex items-center font-medium">
                  <div className="w-20">Total LTV</div>
                  <div className="font-bold">$15,000-30,000</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-medium mb-4">Strategic Advantage</h3>
              
              <div className="space-y-4">
                <div className="p-3 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                  <div className="font-medium">Multi-decade relationship</div>
                  <p className="text-sm">A customer acquired at first baby can be an Allie user for 20+ years.</p>
                </div>
                
                <div className="p-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                  <div className="font-medium">Growing commerce share</div>
                  <p className="text-sm">As families grow with Allie, our share of wallet expands exponentially.</p>
                </div>
                
                <div className="p-3 border-l-4 border-purple-500 bg-purple-50 rounded-r-lg">
                  <div className="font-medium">Strong moat</div>
                  <p className="text-sm">A family that's relied on Allie for years is unlikely to leave.</p>
                </div>
              </div>
              
              <div className="mt-6 text-center py-3 bg-gray-50 rounded-lg">
                <div className="font-medium">US total addressable market:</div>
                <div className="text-2xl font-bold text-purple-700">$26,000,000,000</div>
                <div className="text-xs">Based on average child-rearing spend × US families with children under 18</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-between">
          <button 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center"
            onClick={() => window.history.back()}
          >
            ← Previous: Family Data Graph
          </button>
          <button 
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            onClick={() => window.location.href = '#'}
          >
            Next: Competitive Landscape <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FamilyFlywheelSlide3;