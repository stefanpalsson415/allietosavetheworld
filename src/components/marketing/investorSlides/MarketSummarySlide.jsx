import React from 'react';
import { Users, TrendingUp, Globe, Target, Clock } from 'lucide-react';

const MarketSummarySlide = () => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-0">
      
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Market & Opportunity</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="bg-purple-50 p-5 rounded-lg text-center">
              <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Globe size={30} className="text-purple-600" />
              </div>
              <h3 className="text-3xl font-bold text-purple-600 mb-1">$42B</h3>
              <p className="uppercase tracking-wide text-sm font-medium text-gray-500">TAM</p>
              <p className="text-sm text-gray-600 mt-2">
                All global households with children under 18
              </p>
            </div>
            
            <div className="bg-blue-50 p-5 rounded-lg text-center">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Target size={30} className="text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-blue-600 mb-1">$8.4B</h3>
              <p className="uppercase tracking-wide text-sm font-medium text-gray-500">SAM</p>
              <p className="text-sm text-gray-600 mt-2">
                Dual and single-income families in tier 1 markets
              </p>
            </div>
            
            <div className="bg-green-50 p-5 rounded-lg text-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Target size={30} className="text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-green-600 mb-1">$2.7B</h3>
              <p className="uppercase tracking-wide text-sm font-medium text-gray-500">SOM</p>
              <p className="text-sm text-gray-600 mt-2">
                Initial 3-year target in US, Canada, UK markets
              </p>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-3">Bottom-Up Market Calculation</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">68M</div>
                  <p className="text-xs text-gray-600">U.S., Canada, UK families with children</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">42%</div>
                  <p className="text-xs text-gray-600">Awareness of mental load imbalance</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">18%</div>
                  <p className="text-xs text-gray-600">Conversion to paid subscribers</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">$9.99</div>
                  <p className="text-xs text-gray-600">Monthly subscription price</p>
                </div>
              </div>
              
              <div className="flex justify-center items-center py-1">
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mx-2">
                  <span className="text-purple-600 font-medium">×</span>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mx-2">
                  <span className="text-blue-600 font-medium">×</span>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mx-2">
                  <span className="text-green-600 font-medium">×</span>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center mx-2">
                  <span className="text-amber-600 font-medium">×</span>
                </div>
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mx-2">
                  <span className="text-gray-600 font-medium">=</span>
                </div>
              </div>
              
              <div className="flex justify-center mt-3">
                <div className="bg-black text-white px-6 py-3 rounded-lg">
                  <div className="text-3xl font-bold">$2.7B SOM</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Macro Tailwinds</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <TrendingUp size={14} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">COVID Acceleration</p>
                    <p className="text-xs text-gray-600">37% increase in mental load awareness post-pandemic</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Users size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Demographic Shift</p>
                    <p className="text-xs text-gray-600">Millennials prioritize balanced households (94% seeking solutions)</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Globe size={14} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Policy Recognition</p>
                    <p className="text-xs text-gray-600">UN and WHO now recognize mental load as a key wellbeing factor</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 bg-amber-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Clock size={14} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tech Maturity</p>
                    <p className="text-xs text-gray-600">AI and ML finally capable of understanding complex family dynamics</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Market Search Trends</h3>
              <div className="h-48 bg-white rounded-lg relative p-3 mb-3">
                <div className="absolute bottom-3 left-3 right-3 h-px bg-gray-300"></div>
                <div className="absolute left-3 bottom-3 top-3 w-px bg-gray-300"></div>
                
                {/* Search trend line */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 180" preserveAspectRatio="none">
                  <path 
                    d="M 30,150 Q 60,140 90,130 T 150,100 T 210,60 T 270,20" 
                    fill="none" 
                    stroke="url(#gradient)" 
                    strokeWidth="3"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333EA" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="absolute top-3 right-3 bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                  5.2× YoY growth
                </div>
                
                <div className="absolute bottom-4 left-4 text-xs text-gray-500">2020</div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-500">2022</div>
                <div className="absolute bottom-4 right-4 text-xs text-gray-500">2024</div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-purple-50 p-2 rounded-lg text-center">
                  <p className="text-xl font-bold text-purple-600">8.4M</p>
                  <p className="text-xs text-gray-600">Monthly searches for "mental load"</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg text-center">
                  <p className="text-xl font-bold text-blue-600">12.3M</p>
                  <p className="text-xs text-gray-600">Monthly searches for "family balance"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-black p-6 rounded-lg text-white">
          <h3 className="text-xl font-medium mb-4 text-center">Competitive White Space</h3>
          
          <div className="h-64 bg-white bg-opacity-5 rounded-lg relative p-4">
            {/* X and Y axis */}
            <div className="absolute bottom-4 left-4 right-4 h-px bg-gray-600"></div>
            <div className="absolute left-4 bottom-4 top-4 w-px bg-gray-600"></div>
            
            {/* Axis labels */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-400">
              AI Intelligence →
            </div>
            <div className="absolute -left-5 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-400">
              Mental Load Focus →
            </div>
            
            {/* Competitors */}
            <div className="absolute left-[25%] bottom-[25%] transform -translate-x-1/2 -translate-y-1/2">
              <div className="h-8 w-8 rounded-full bg-blue-900 flex items-center justify-center">
                <span className="text-xs text-white">T</span>
              </div>
              <p className="text-xs mt-1 text-gray-300">Todo Apps</p>
            </div>
            
            <div className="absolute left-[75%] bottom-[25%] transform -translate-x-1/2 -translate-y-1/2">
              <div className="h-8 w-8 rounded-full bg-green-900 flex items-center justify-center">
                <span className="text-xs text-white">C</span>
              </div>
              <p className="text-xs mt-1 text-gray-300">Calendar Apps</p>
            </div>
            
            <div className="absolute left-[20%] bottom-[70%] transform -translate-x-1/2 -translate-y-1/2">
              <div className="h-8 w-8 rounded-full bg-yellow-900 flex items-center justify-center">
                <span className="text-xs text-white">P</span>
              </div>
              <p className="text-xs mt-1 text-gray-300">Parenting Blogs</p>
            </div>
            
            {/* Our solution */}
            <div className="absolute left-[80%] bottom-[80%] transform -translate-x-1/2 -translate-y-1/2">
              <div className="h-12 w-12 rounded-full bg-purple-600 border-2 border-white flex items-center justify-center pulse-animation">
                <span className="text-sm font-medium text-white">Allie</span>
              </div>
            </div>
            
            {/* Add pulse animation */}
            <style jsx>{`
              @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.7); }
                70% { box-shadow: 0 0 0 10px rgba(147, 51, 234, 0); }
                100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0); }
              }
              .pulse-animation {
                animation: pulse 2s infinite;
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketSummarySlide;