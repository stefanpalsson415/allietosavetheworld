import React from 'react';
import { TrendingUp, PieChart, Target } from 'lucide-react';

const MarketSizeSlide = () => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-8">Market Size (TAM → SAM → SOM)</h2>
        
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* TAM */}
          <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border-t-4 border-blue-500">
            <div className="flex items-start mb-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <PieChart size={24} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-1">TAM</h3>
                <p className="text-gray-700">Total Addressable Market</p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-3xl font-bold text-blue-800 mb-2">$65B</div>
              <p className="text-gray-700">Annual spend on care-tech & parenting tools</p>
            </div>

            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="h-5 w-5 text-blue-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                <p className="text-sm">95M parents across USA, Canada & Europe spend avg $680/year</p>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 text-blue-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                <p className="text-sm">Includes apps, child development services, family management tools</p>
              </li>
            </ul>
          </div>
          
          {/* SAM */}
          <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border-t-4 border-purple-500">
            <div className="flex items-start mb-4">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                <TrendingUp size={24} className="text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-1">SAM</h3>
                <p className="text-gray-700">Serviceable Available Market</p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-3xl font-bold text-purple-800 mb-2">$18.2B</div>
              <p className="text-gray-700">Millennial & Gen X parents with technology adoption</p>
            </div>

            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="h-5 w-5 text-purple-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                <p className="text-sm">26.8M North American & European parents, dual-income, tech-positive</p>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 text-purple-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                <p className="text-sm">High concentration in urban/suburban areas with 2+ children per family</p>
              </li>
            </ul>
          </div>
          
          {/* SOM */}
          <div className="flex-1 bg-white p-6 rounded-lg shadow-sm border-t-4 border-amber-500">
            <div className="flex items-start mb-4">
              <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center mr-4">
                <Target size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-1">SOM</h3>
                <p className="text-gray-700">Serviceable Obtainable Market</p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="text-3xl font-bold text-amber-800 mb-2">$2.7B</div>
              <p className="text-gray-700">Realistic share in 3-5 years (users × price)</p>
            </div>

            <ul className="space-y-2">
              <li className="flex items-start">
                <div className="h-5 w-5 text-amber-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                <p className="text-sm">4M households across NA & Europe × $680/yr average value</p>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 text-amber-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                <p className="text-sm">Targeting families with most acute mental load pain points</p>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Visual representation */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h3 className="text-xl font-medium mb-6 text-center">Market Opportunity Visualization</h3>
          
          <div className="relative mx-auto" style={{width: '400px', height: '400px'}}>
            {/* Largest circle - TAM */}
            <div className="absolute inset-0 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="absolute top-4 w-full text-center">
                <span className="font-bold text-blue-800">TAM: $65B</span>
              </div>

              {/* Middle circle - SAM */}
              <div className="w-2/3 h-2/3 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="absolute top-1/4 w-full text-center">
                  <span className="font-bold text-purple-800">SAM: $18.2B</span>
                </div>

                {/* Inner circle - SOM */}
                <div className="w-1/2 h-1/2 bg-amber-100 rounded-full flex items-center justify-center">
                  <span className="font-bold text-amber-800">SOM: $2.7B</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-4">Data Sources</h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <div className="h-5 w-5 text-gray-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
              <p className="text-sm">OECD Family Database (2023) - Household spending patterns</p>
            </li>
            <li className="flex items-start">
              <div className="h-5 w-5 text-gray-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
              <p className="text-sm">Statista Digital Market Outlook - Parenting app market size</p>
            </li>
            <li className="flex items-start">
              <div className="h-5 w-5 text-gray-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
              <p className="text-sm">Grand View Research - Family Tech Market Analysis, April 2023</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MarketSizeSlide;