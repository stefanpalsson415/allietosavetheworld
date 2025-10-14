import React from 'react';
import { Zap, BarChart, Calendar, Users, Shield, CheckCircle, Eye, Sparkles, LightBulb } from 'lucide-react';

const SolutionSummarySlide = () => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-0">

      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Our Solution: Allie</h2>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="text-center mb-4">
            <h3 className="text-xl font-medium mb-2">Value Proposition</h3>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              <span className="text-purple-600 font-medium">Allie makes the invisible mental load visible</span> and provides
              AI-powered tools to balance family responsibilities, saving 12.4 hours weekly per household.
            </p>
          </div>

          {/* The Three-Step Solution Process */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium text-center mb-3">Our Three-Step Solution Process</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                    <Eye size={18} className="text-purple-600" />
                  </div>
                  <h5 className="font-medium">1. Awareness First</h5>
                </div>
                <p className="text-sm text-gray-600">
                  Research shows 78% of partners were "shocked" when seeing workload data visualized. Revealing the hidden mental load creates essential recognition.
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <Sparkles size={18} className="text-blue-600" />
                  </div>
                  <h5 className="font-medium">2. AI-Powered Insights</h5>
                </div>
                <p className="text-sm text-gray-600">
                  Our algorithms identify patterns, quantify mental load, and generate personalized recommendations for balanced workload.
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                    <Shield size={18} className="text-green-600" />
                  </div>
                  <h5 className="font-medium">3. Sustained Change</h5>
                </div>
                <p className="text-sm text-gray-600">
                  Knowledge graph and behavior tracking create consistent improvements with 92% of families maintaining balance long-term.
                </p>
              </div>
            </div>
          </div>
          
          {/* Product Screenshot - Mockup of the main dashboard */}
          <div className="mb-8 bg-gray-50 p-3 rounded-lg">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="h-8 bg-gray-100 flex items-center px-4">
                <div className="flex space-x-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <div className="h-12 bg-purple-100 rounded-lg mb-4 flex items-center px-4">
                      <span className="text-sm font-medium text-purple-700">Mental Load Dashboard</span>
                    </div>
                    <div className="h-48 bg-gray-100 rounded-lg relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-[72%] bg-pink-400 flex items-center pl-3">
                        <span className="text-white text-sm">Primary: 72%</span>
                      </div>
                      <div className="absolute top-0 right-0 h-full w-[28%] bg-blue-400 flex items-center justify-end pr-3">
                        <span className="text-white text-sm">Partner: 28%</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-32 bg-blue-100 rounded-lg p-3">
                      <div className="text-xs font-medium text-blue-700 mb-1">Task Distribution</div>
                      <div className="h-24 bg-white rounded-lg"></div>
                    </div>
                    <div className="h-32 bg-green-100 rounded-lg p-3">
                      <div className="text-xs font-medium text-green-700 mb-1">Weekly Progress</div>
                      <div className="h-24 bg-white rounded-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 mt-2">Allie's Mental Load Dashboard - Live MVP with 3,420 active beta users</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-medium mb-3">How We Solve the Pain</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <BarChart size={14} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Task Weight AI</p>
                    <p className="text-xs text-gray-600">Quantifies invisible cognitive labor with 92% accuracy</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Calendar size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Smart Calendar Integration</p>
                    <p className="text-xs text-gray-600">Detects patterns and automates task distribution</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Users size={14} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Personalized Family Profiles</p>
                    <p className="text-xs text-gray-600">Adapts to different household structures and needs</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <Shield size={14} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Knowledge Graph</p>
                    <p className="text-xs text-gray-600">Learns family patterns to anticipate future needs</p>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Current Status</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <CheckCircle size={14} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">MVP Launch</span>
                      <span className="text-xs text-green-600">Completed</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className="bg-green-600 h-1.5 rounded-full w-full"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <CheckCircle size={14} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Beta Program</span>
                      <span className="text-xs text-green-600">3,420 active users</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className="bg-green-600 h-1.5 rounded-full w-full"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <Zap size={14} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Task Weight API</span>
                      <span className="text-xs text-blue-600">60% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{width: '60%'}}></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                    <Zap size={14} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Calendar Integration</span>
                      <span className="text-xs text-purple-600">80% complete</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div className="bg-purple-600 h-1.5 rounded-full" style={{width: '80%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-lg text-white">
          <h3 className="text-xl font-medium mb-4">Key Differentiators</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2">
                  <Zap size={18} className="text-yellow-300" />
                </div>
                <h4 className="font-medium">Proprietary AI</h4>
              </div>
              <p className="text-sm text-blue-100">
                Task Weight algorithm trained on 1.4M examples with 92% accuracy
              </p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2">
                  <Shield size={18} className="text-green-300" />
                </div>
                <h4 className="font-medium">Science-Backed</h4>
              </div>
              <p className="text-sm text-blue-100">
                Developed with Stanford Family Research Lab and peer-reviewed
              </p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <div className="h-8 w-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2">
                  <Users size={18} className="text-purple-300" />
                </div>
                <h4 className="font-medium">Family Graph</h4>
              </div>
              <p className="text-sm text-blue-100">
                Revolutionary data structure that models complex family dynamics
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionSummarySlide;