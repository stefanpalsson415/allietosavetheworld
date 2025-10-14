import React from 'react';

const MentalLoadAssessmentSlide = () => {
  return (
    <div className="min-h-[80vh] p-8">
      <h2 className="text-3xl text-purple-700 font-semibold mb-2">Mental Load Assessment</h2>
      <p className="text-lg mb-8 text-gray-600">Understanding and quantifying the invisible cognitive burden</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Survey System */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <div className="text-purple-600 mr-3 text-xl">📋</div>
              <h3 className="font-semibold text-gray-800">Interactive Survey System</h3>
            </div>
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="pl-6 border-l-2 border-purple-100">
                <h4 className="text-sm font-semibold text-purple-700">1. Initial Data Collection</h4>
                <p className="text-sm mt-1 text-gray-600">
                  Through engaging, simple surveys with easy selection interface, Allie builds a picture of each family's current workload distribution.
                </p>
              </div>
              
              {/* Mama/Papa Selection Interface */}
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-xs text-purple-700 mb-2 font-semibold">Survey Selection Interface</p>
                <div className="flex items-center justify-center bg-white rounded-lg p-3 border border-purple-200">
                  <div className="text-center w-1/2 border-r border-gray-200 p-2">
                    <div className="rounded-full w-12 h-12 mx-auto mb-1 bg-pink-100 flex items-center justify-center">
                      <span className="text-pink-700 font-bold">Mama</span>
                    </div>
                    <p className="text-xs text-gray-600">Simple tap selection</p>
                  </div>
                  <div className="text-center w-1/2 p-2">
                    <div className="rounded-full w-12 h-12 mx-auto mb-1 bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-700 font-bold">Papa</span>
                    </div>
                    <p className="text-xs text-gray-600">Kid-friendly interface</p>
                  </div>
                </div>
              </div>
              
              {/* Step 2 */}
              <div className="pl-6 border-l-2 border-purple-100">
                <h4 className="text-sm font-semibold text-purple-700">2. Task Categorization</h4>
                <p className="text-sm mt-1 text-gray-600">
                  Tasks are categorized by type, frequency, cognitive weight, and emotional labor to provide a comprehensive view of all family responsibilities.
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="pl-6 border-l-2 border-purple-100">
                <h4 className="text-sm font-semibold text-purple-700">3. Personalized Insight Generation</h4>
                <p className="text-sm mt-1 text-gray-600">
                  Allie generates insights about load distribution, hidden patterns, and potential areas for rebalancing based on family-specific data.
                </p>
              </div>
              
              {/* Step 4 */}
              <div className="pl-6 border-l-2 border-purple-100">
                <h4 className="text-sm font-semibold text-purple-700">4. Objective Visualization</h4>
                <p className="text-sm mt-1 text-gray-600">
                  Visualizing the load distribution in a non-threatening way helps everyone understand the current state without blame or judgment.
                </p>
              </div>
            </div>
          </div>
          
          {/* Initial Load Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <div className="text-blue-600 mr-3 text-xl">⏱️</div>
              <h3 className="font-semibold text-gray-800">Initial Load Distribution</h3>
            </div>
            
            <div className="flex justify-center">
              <div className="w-40 h-40 relative">
                {/* Pie chart visualization */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="40" fill="#a78bfa" />
                  <path d="M 50 50 L 90 50 A 40 40 0 0 1 76 84 Z" fill="#3b82f6" />
                </svg>
                
                {/* Labels */}
                <div className="absolute top-2 left-0 w-full text-center">
                  <span className="text-xs font-semibold text-purple-700">Partner A: 73%</span>
                </div>
                <div className="absolute bottom-5 right-2">
                  <span className="text-xs font-semibold text-blue-700">Partner B: 27%</span>
                </div>
              </div>
            </div>
            
            <p className="text-center text-sm mt-4 text-gray-600">Typical initial assessment shows significant imbalance</p>
            
            <div className="mt-4 flex justify-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-sm mr-1"></div>
                <span className="text-xs">Partner A</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></div>
                <span className="text-xs">Partner B</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column */}
        <div className="space-y-6">
          {/* Multidimensional Assessment */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <div className="text-blue-600 mr-3 text-xl">🔄</div>
              <h3 className="font-semibold text-gray-800">Multidimensional Assessment</h3>
            </div>
            
            <p className="text-sm mb-4 text-gray-600">Allie assesses mental load across multiple dimensions:</p>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-2 rounded text-center">
                  <p className="text-xs font-medium text-purple-700">Planning Burden</p>
                </div>
                <div className="bg-white p-2 rounded text-center">
                  <p className="text-xs font-medium text-blue-700">Coordination Effort</p>
                </div>
                <div className="bg-white p-2 rounded text-center">
                  <p className="text-xs font-medium text-purple-700">Task Execution</p>
                </div>
                <div className="bg-white p-2 rounded text-center">
                  <p className="text-xs font-medium text-blue-700">Monitoring Status</p>
                </div>
                <div className="bg-white p-2 rounded text-center">
                  <p className="text-xs font-medium text-purple-700">Emotional Labor</p>
                </div>
                <div className="bg-white p-2 rounded text-center">
                  <p className="text-xs font-medium text-blue-700">Crisis Management</p>
                </div>
              </div>
            </div>
            
            {/* Family Survey System Features */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-purple-700 mb-2">Survey System Features</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="text-xs bg-purple-100 text-purple-700 rounded-full w-4 h-4 flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">✓</div>
                  <p className="text-xs text-gray-600">Age-appropriate questions for children as young as 6</p>
                </li>
                <li className="flex items-start">
                  <div className="text-xs bg-purple-100 text-purple-700 rounded-full w-4 h-4 flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">✓</div>
                  <p className="text-xs text-gray-600">Dynamic question generation based on family structure</p>
                </li>
                <li className="flex items-start">
                  <div className="text-xs bg-purple-100 text-purple-700 rounded-full w-4 h-4 flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">✓</div>
                  <p className="text-xs text-gray-600">Task Weight AI for precise mental load measurement</p>
                </li>
                <li className="flex items-start">
                  <div className="text-xs bg-purple-100 text-purple-700 rounded-full w-4 h-4 flex items-center justify-center mt-0.5 mr-2 flex-shrink-0">✓</div>
                  <p className="text-xs text-gray-600">Initial assessment included in free tier (conversion driver)</p>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Testimonial */}
          <div className="bg-yellow-50 p-6 rounded-lg shadow border border-yellow-100">
            <p className="text-sm italic text-gray-700">
              "The assessment process was eye-opening. I had no idea how much I was carrying until Allie helped us map it all out. It wasn't just about the tasks, but all the thinking and planning that goes into them."
            </p>
            <p className="mt-3 text-right text-sm font-medium text-gray-700">
              Michael S.
              <span className="block text-xs text-gray-500">Father of three</span>
            </p>
          </div>
          
          {/* After 3 Months with Allie */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center mb-4">
              <div className="text-green-600 mr-3 text-xl">📈</div>
              <h3 className="font-semibold text-gray-800">After 3 Months with Allie</h3>
            </div>
            
            <div className="flex justify-center">
              <div className="w-40 h-40 relative">
                {/* Pie chart visualization */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="40" fill="#a78bfa" />
                  <path d="M 50 50 L 90 50 A 40 40 0 0 1 50 90 A 40 40 0 0 1 29 79 Z" fill="#3b82f6" />
                </svg>
                
                {/* Labels */}
                <div className="absolute top-2 left-0 w-full text-center">
                  <span className="text-xs font-semibold text-purple-700">Partner A: 58%</span>
                </div>
                <div className="absolute bottom-2 right-0 w-full text-center">
                  <span className="text-xs font-semibold text-blue-700">Partner B: 42%</span>
                </div>
              </div>
            </div>
            
            <p className="text-center text-sm mt-4 text-gray-600">Progressive improvement toward more balanced distribution</p>
            
            <div className="mt-4 flex justify-center space-x-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-sm mr-1"></div>
                <span className="text-xs">Partner A</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-sm mr-1"></div>
                <span className="text-xs">Partner B</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Freemium Strategy - Bottom Section */}
      <div className="mt-8 bg-black text-white p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Freemium Conversion Strategy</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white bg-opacity-10 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="h-6 w-6 rounded-full bg-white text-purple-700 font-bold flex items-center justify-center mr-2 text-sm">1</div>
              <p className="font-medium text-sm">Initial Assessment (Free)</p>
            </div>
            <p className="text-xs text-gray-300">
              Initial survey creates the "aha moment" when families see their true imbalance
            </p>
          </div>
          <div className="bg-white bg-opacity-10 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="h-6 w-6 rounded-full bg-white text-purple-700 font-bold flex items-center justify-center mr-2 text-sm">2</div>
              <p className="font-medium text-sm">Basic Results (Free)</p>
            </div>
            <p className="text-xs text-gray-300">
              Limited visualization of mental load breakdown that proves valuable imbalance exists
            </p>
          </div>
          <div className="bg-white bg-opacity-10 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="h-6 w-6 rounded-full bg-white text-purple-700 font-bold flex items-center justify-center mr-2 text-sm">3</div>
              <p className="font-medium text-sm">Premium (€29.99/mo)</p>
            </div>
            <p className="text-xs text-gray-300">
              Complete analysis, task weight insights, and personalized rebalancing strategies
            </p>
          </div>
          <div className="bg-white bg-opacity-10 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <div className="h-6 w-6 rounded-full bg-white text-purple-700 font-bold flex items-center justify-center mr-2 text-sm">✓</div>
              <p className="font-medium text-sm">78% Conversion Rate</p>
            </div>
            <p className="text-xs text-gray-300">
              Over 3/4 of free assessment users convert to premium subscriptions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentalLoadAssessmentSlide;