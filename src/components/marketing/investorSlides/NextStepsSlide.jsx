import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  Target, 
  TrendingUp, 
  DollarSign, 
  Globe,
  Award,
  CheckCircle,
  Zap,
  ChevronRight,
  Clock
} from 'lucide-react';

const NextStepsSlide = () => {
  const [activeTab, setActiveTab] = useState('roadmap');

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-0">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Next Steps</h2>
        
        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'roadmap'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('roadmap')}
          >
            6-Month Roadmap
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'funding'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('funding')}
          >
            Funding Strategy
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === 'team'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('team')}
          >
            Team Expansion
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          {activeTab === 'roadmap' && (
            <div className="space-y-6">
              <h3 className="text-xl font-medium mb-4">6-Month Product Roadmap</h3>
              
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-purple-200"></div>
                
                <div className="space-y-8">
                  {/* Milestone 1 */}
                  <div className="relative pl-12">
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                      <Clock size={16} />
                    </div>
                    <div className="relative">
                      <span className="text-xs font-medium text-purple-600 mb-1 block">Month 1-2</span>
                      <h4 className="text-lg font-medium mb-1">Mental Load Assessment Suite</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Complete our diagnostic tools with personalized reporting and actionable insights
                      </p>
                      <div className="flex space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={12} className="mr-1" /> Beta testing
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          60% complete
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Milestone 2 */}
                  <div className="relative pl-12">
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                      <Clock size={16} />
                    </div>
                    <div className="relative">
                      <span className="text-xs font-medium text-purple-600 mb-1 block">Month 2-4</span>
                      <h4 className="text-lg font-medium mb-1">Family Knowledge Graph</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Launch our proprietary data structure for modeling complex family relationships and preferences
                      </p>
                      <div className="flex space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          In development
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          35% complete
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Milestone 3 */}
                  <div className="relative pl-12">
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                      <Clock size={16} />
                    </div>
                    <div className="relative">
                      <span className="text-xs font-medium text-purple-600 mb-1 block">Month 4-5</span>
                      <h4 className="text-lg font-medium mb-1">Advanced Calendar Integration</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Enhanced event parsing with role recommendation and timeline optimization
                      </p>
                      <div className="flex space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Planning phase
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          20% complete
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Milestone 4 */}
                  <div className="relative pl-12">
                    <div className="absolute left-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                      <Clock size={16} />
                    </div>
                    <div className="relative">
                      <span className="text-xs font-medium text-purple-600 mb-1 block">Month 5-6</span>
                      <h4 className="text-lg font-medium mb-1">Public API & Partner Program</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Launching extensibility options for third-party developers and family service providers
                      </p>
                      <div className="flex space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Early planning
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          10% complete
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'funding' && (
            <div>
              <h3 className="text-xl font-medium mb-4">Funding Strategy</h3>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-medium mb-3">Current Round</h4>
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-medium">$3.2M Seed</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Valuation cap:</span>
                      <span className="font-medium">$14M</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Minimum:</span>
                      <span className="font-medium">$50K</span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-medium text-green-600">$1.8M committed</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Format:</span>
                      <span className="font-medium">SAFE, Y Combinator standard terms</span>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-medium mb-3">Use of Funds</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <ChevronRight size={18} className="mr-2 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Core Team Expansion</p>
                        <p className="text-sm text-gray-600">Senior engineering & product hires (48%)</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight size={18} className="mr-2 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">AI Model Development</p>
                        <p className="text-sm text-gray-600">Fine-tuning & data acquisition (22%)</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight size={18} className="mr-2 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">User Acquisition</p>
                        <p className="text-sm text-gray-600">Targeted campaigns & partnerships (18%)</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <ChevronRight size={18} className="mr-2 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Operations & Infrastructure</p>
                        <p className="text-sm text-gray-600">Scaling, security & compliance (12%)</p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-3">Capital Strategy Timeline</h4>
                  
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                    
                    <div className="space-y-6">
                      <div className="relative pl-12">
                        <div className="absolute left-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white">
                          <CheckCircle size={16} />
                        </div>
                        <div>
                          <p className="font-medium">Pre-seed ($500K)</p>
                          <p className="text-sm text-gray-600">Completed Q3 2023</p>
                          <p className="text-xs text-gray-500 mt-1">Initial product development & MVP launch</p>
                        </div>
                      </div>
                      
                      <div className="relative pl-12">
                        <div className="absolute left-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                          <Zap size={16} />
                        </div>
                        <div>
                          <p className="font-medium">Seed ($3.2M)</p>
                          <p className="text-sm text-green-600">Active - $1.8M committed</p>
                          <p className="text-xs text-gray-500 mt-1">Scaling core offering & expanding team</p>
                        </div>
                      </div>
                      
                      <div className="relative pl-12">
                        <div className="absolute left-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                          <Target size={16} />
                        </div>
                        <div>
                          <p className="font-medium">Series A ($8-12M)</p>
                          <p className="text-sm text-gray-600">Targeted Q3 2024</p>
                          <p className="text-xs text-gray-500 mt-1">User growth & ecosystem partnerships</p>
                        </div>
                      </div>
                      
                      <div className="relative pl-12">
                        <div className="absolute left-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                          <Globe size={16} />
                        </div>
                        <div>
                          <p className="font-medium">Series B ($20-25M)</p>
                          <p className="text-sm text-gray-600">Projected Q4 2025</p>
                          <p className="text-xs text-gray-500 mt-1">International expansion & ancillary services</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'team' && (
            <div>
              <h3 className="text-xl font-medium mb-4">Team Expansion Plan</h3>
              
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white mr-3">
                    <Users size={16} />
                  </div>
                  <h4 className="text-lg font-medium">Core Hires (Next 6 Months)</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Engineering</h5>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0 mt-0.5 mr-2">
                          <CheckCircle size={12} />
                        </span>
                        <span>Senior Backend Engineer</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 flex-shrink-0 mt-0.5 mr-2">
                          ·
                        </span>
                        <span>ML Engineer</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 flex-shrink-0 mt-0.5 mr-2">
                          ·
                        </span>
                        <span>Mobile Developer</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 mt-0.5 mr-2">
                          ·
                        </span>
                        <span>DevOps Specialist</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Product & Design</h5>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0 mt-0.5 mr-2">
                          <CheckCircle size={12} />
                        </span>
                        <span>Product Manager</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 flex-shrink-0 mt-0.5 mr-2">
                          ·
                        </span>
                        <span>UX Researcher</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 mt-0.5 mr-2">
                          ·
                        </span>
                        <span>UI/UX Designer</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Business & Operations</h5>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0 mt-0.5 mr-2">
                          <CheckCircle size={12} />
                        </span>
                        <span>Head of Marketing</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 flex-shrink-0 mt-0.5 mr-2">
                          ·
                        </span>
                        <span>Content Strategist</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 mt-0.5 mr-2">
                          ·
                        </span>
                        <span>Customer Success Lead</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0 mt-0.5 mr-2">
                          ·
                        </span>
                        <span>BD Partnerships</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-100 mr-1"></span> In progress
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-100 ml-4 mr-1"></span> Active recruiting
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-200 ml-4 mr-1"></span> Planned
                </div>
              </div>
              
              <div className="bg-black text-white p-5 rounded-lg">
                <h4 className="text-lg font-medium mb-3">Building a Diverse, Empowered Culture</h4>
                <p className="text-sm mb-4">
                  We're committed to building a team that reflects the diverse families we serve, with a focus on:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                    <Award size={24} className="mx-auto mb-2 text-purple-300" />
                    <p className="text-sm font-medium">50% women in tech roles</p>
                  </div>
                  <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                    <Users size={24} className="mx-auto mb-2 text-blue-300" />
                    <p className="text-sm font-medium">Inclusive hiring practices</p>
                  </div>
                  <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                    <Target size={24} className="mx-auto mb-2 text-green-300" />
                    <p className="text-sm font-medium">Flexible work policies</p>
                  </div>
                  <div className="text-center p-3 bg-white bg-opacity-10 rounded-lg">
                    <TrendingUp size={24} className="mx-auto mb-2 text-yellow-300" />
                    <p className="text-sm font-medium">Competitive compensation</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Call to Action Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 p-6 rounded-lg text-white">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-medium mb-2">Join Us in Transforming Family Life</h3>
              <p className="text-white text-opacity-90">
                We're seeking strategic partners who share our vision for a more balanced future
              </p>
            </div>
            <div className="flex space-x-3">
              <div className="text-center bg-white bg-opacity-20 p-3 rounded-lg">
                <DollarSign size={24} className="mx-auto mb-1" />
                <p className="text-sm font-medium">Investment</p>
              </div>
              <div className="text-center bg-white bg-opacity-20 p-3 rounded-lg">
                <Users size={24} className="mx-auto mb-1" />
                <p className="text-sm font-medium">Advisors</p>
              </div>
              <div className="text-center bg-white bg-opacity-20 p-3 rounded-lg">
                <Globe size={24} className="mx-auto mb-1" />
                <p className="text-sm font-medium">Partners</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextStepsSlide;