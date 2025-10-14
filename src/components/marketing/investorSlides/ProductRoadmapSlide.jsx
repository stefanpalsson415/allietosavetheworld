import React, { useState } from 'react';
import { Map, Calendar, Brain, Users, MessageSquare, BarChart, CheckCircle, Clock, Shield, Server, Zap, DollarSign } from 'lucide-react';

const ProductRoadmapSlide = () => {
  const [activeQuarter, setActiveQuarter] = useState('q3-2023');
  
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Product Roadmap</h2>
        
        <div className="mb-8">
          <div className="grid grid-cols-4 gap-2 mb-8">
            <button 
              className={`py-3 px-2 font-medium text-sm rounded-lg ${activeQuarter === 'q3-2023' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-purple-50'}`}
              onClick={() => setActiveQuarter('q3-2023')}
            >
              Q3 2023
            </button>
            <button 
              className={`py-3 px-2 font-medium text-sm rounded-lg ${activeQuarter === 'q4-2023' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-purple-50'}`}
              onClick={() => setActiveQuarter('q4-2023')}
            >
              Q4 2023
            </button>
            <button 
              className={`py-3 px-2 font-medium text-sm rounded-lg ${activeQuarter === 'q1-2024' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-purple-50'}`}
              onClick={() => setActiveQuarter('q1-2024')}
            >
              Q1 2024
            </button>
            <button 
              className={`py-3 px-2 font-medium text-sm rounded-lg ${activeQuarter === 'beyond' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-purple-50'}`}
              onClick={() => setActiveQuarter('beyond')}
            >
              2024-2025
            </button>
          </div>
        </div>
        
        {activeQuarter === 'q3-2023' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <Calendar size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">Q3 2023: Foundation</h3>
                    <p className="text-sm text-gray-600">Jul - Sep 2023</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <CheckCircle size={18} className="text-green-600 mr-2" />
                      Completed Features
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <CheckCircle size={12} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Core Calendar Integration</p>
                          <p className="text-xs text-gray-600">Google, Apple, and Outlook calendar synchronization</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <CheckCircle size={12} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Task Detection System</p>
                          <p className="text-xs text-gray-600">Basic ML for identifying household tasks from calendars</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <CheckCircle size={12} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Alpha Family Accounts</p>
                          <p className="text-xs text-gray-600">Multi-user household setup with basic permissions</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Clock size={18} className="text-purple-600 mr-2" />
                      In Progress (Delivery Sep 2023)
                    </h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Basic Task Weight AI</p>
                          <p className="text-xs text-gray-600">Initial algorithm for mental load quantification</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Simple Workload Visualizations</p>
                          <p className="text-xs text-gray-600">First version of our mental load dashboard</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Beta Mobile Apps</p>
                          <p className="text-xs text-gray-600">iOS and Android early access versions</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">Q3 Milestone: Private Beta Launch</h3>
                <p className="text-sm mb-4">
                  Our Q3 focus is bringing our core task detection and basic task weight AI to our first 250 beta families. This foundation will provide essential data for our ML systems.
                </p>
                <div className="flex justify-between text-center">
                  <div>
                    <p className="text-xl font-bold">250</p>
                    <p className="text-xs text-blue-100">beta families</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">1,400+</p>
                    <p className="text-xs text-blue-100">waitlist signups</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">93%</p>
                    <p className="text-xs text-blue-100">feature completion</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Key Metrics & Targets</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Task detection accuracy</span>
                      <span className="text-sm font-medium">78% → 85%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="bg-purple-600 h-2.5 rounded-full" style={{width: '78%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: 78% / Target: 85%</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Beta user engagement</span>
                      <span className="text-sm font-medium">4.2 days/week</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{width: '60%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: 4.2 days/week / Target: 5+ days/week</p>
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Calendar integration success</span>
                      <span className="text-sm font-medium">91%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{width: '91%'}}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Current: 91% / Target: 95%</p>
                  </div>
                </div>
                
                <div className="mt-5 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Q3 Technical Focus</h4>
                  <div className="space-y-2">
                    <div className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Brain size={14} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">ML Model Training</p>
                        <p className="text-xs text-gray-600">Expanding our family-specific event classification models</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Calendar size={14} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Calendar Integration APIs</p>
                        <p className="text-xs text-gray-600">Expanding provider support and real-time sync capabilities</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Shield size={14} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Security Framework</p>
                        <p className="text-xs text-gray-600">Enhanced encryption and family data protection models</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Q3 Research Initiatives</h3>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Family Task Weight Study</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Working with Stanford researchers to validate our task weight algorithm against human assessment.
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className="text-blue-600 font-medium">83 families participating</span>
                      <span className="text-blue-600 font-medium">87% complete</span>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Allocation Model Testing</h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Testing 3 different task allocation algorithms with beta users to identify which creates the most sustainable improvements.
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600 font-medium">A/B testing ongoing</span>
                      <span className="text-green-600 font-medium">42% complete</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeQuarter === 'q4-2023' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Calendar size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">Q4 2023: Advanced AI</h3>
                    <p className="text-sm text-gray-600">Oct - Dec 2023</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Core Deliverables</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <span className="text-xs font-medium text-blue-600">1</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Enhanced Task Weight AI</p>
                          <p className="text-xs text-gray-600">Contextual understanding of task complexity and emotional labor</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <span className="text-xs font-medium text-blue-600">2</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Intelligent Task Allocation</p>
                          <p className="text-xs text-gray-600">ML-based recommendations for rebalancing household workload</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <span className="text-xs font-medium text-blue-600">3</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Public Beta Release</p>
                          <p className="text-xs text-gray-600">Expanding to 1,000+ families with waitlist activation</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <span className="text-xs font-medium text-blue-600">4</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Family Communication Hub</p>
                          <p className="text-xs text-gray-600">In-app messaging and task-specific discussion threads</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Technical Infrastructure</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-gray-200 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <Server size={12} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Scaled ML Pipeline</p>
                          <p className="text-xs text-gray-600">Expanded processing infrastructure for 10x user growth</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-gray-200 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <Shield size={12} className="text-gray-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">SOC 2 Compliance</p>
                          <p className="text-xs text-gray-600">Security certification process initiated</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="bg-black p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">Q4 Milestone: Task Weight 2.0</h3>
                <p className="text-sm mb-4">
                  Our Q4 flagship feature is the advanced Task Weight AI that quantifies both visible tasks and invisible mental/emotional labor for a true picture of household workload.
                </p>
                
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-white bg-opacity-10 p-2 rounded-lg">
                    <p className="text-xl font-bold text-blue-300">93%</p>
                    <p className="text-xs text-gray-300">detection accuracy</p>
                  </div>
                  <div className="bg-white bg-opacity-10 p-2 rounded-lg">
                    <p className="text-xl font-bold text-purple-300">3.2×</p>
                    <p className="text-xs text-gray-300">allocation improvement</p>
                  </div>
                  <div className="bg-white bg-opacity-10 p-2 rounded-lg">
                    <p className="text-xl font-bold text-green-300">78%</p>
                    <p className="text-xs text-gray-300">reduced conflicts</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Public Beta Launch Strategy</h3>
                
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Targeted User Segments</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="text-sm font-medium mb-1">Dual-Income Parents</h5>
                        <p className="text-xs text-gray-600">Primary focus - highest mental load pain point</p>
                        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-purple-600 rounded-full" style={{width: '80%'}}></div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="text-sm font-medium mb-1">Single Parents</h5>
                        <p className="text-xs text-gray-600">Secondary focus - time management critical</p>
                        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-blue-600 rounded-full" style={{width: '60%'}}></div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="text-sm font-medium mb-1">Same-Sex Couples</h5>
                        <p className="text-xs text-gray-600">Strong early adoption in beta testing</p>
                        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-green-600 rounded-full" style={{width: '40%'}}></div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="text-sm font-medium mb-1">Blended Families</h5>
                        <p className="text-xs text-gray-600">Complex scheduling needs & coordination</p>
                        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-yellow-600 rounded-full" style={{width: '20%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Rollout Timeline</h4>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200"></div>
                      
                      <div className="ml-8 mb-3 relative">
                        <div className="absolute -left-8 top-1.5 h-3 w-3 rounded-full bg-blue-500"></div>
                        <h5 className="text-sm font-medium">Oct 1-15: Initial 500 User Cohort</h5>
                        <p className="text-xs text-gray-600">Existing beta users + high-engagement waitlist</p>
                      </div>
                      
                      <div className="ml-8 mb-3 relative">
                        <div className="absolute -left-8 top-1.5 h-3 w-3 rounded-full bg-blue-500"></div>
                        <h5 className="text-sm font-medium">Oct 16-31: Limited Regional Launch</h5>
                        <p className="text-xs text-gray-600">Bay Area, NYC, Chicago metropolitan areas</p>
                      </div>
                      
                      <div className="ml-8 mb-3 relative">
                        <div className="absolute -left-8 top-1.5 h-3 w-3 rounded-full bg-blue-500"></div>
                        <h5 className="text-sm font-medium">Nov 1-30: Full Waitlist Activation</h5>
                        <p className="text-xs text-gray-600">1,400+ interested users onboarded in waves</p>
                      </div>
                      
                      <div className="ml-8 relative">
                        <div className="absolute -left-8 top-1.5 h-3 w-3 rounded-full bg-blue-500"></div>
                        <h5 className="text-sm font-medium">Dec 15: Open Beta Launch</h5>
                        <p className="text-xs text-gray-600">Public access with limited feature set</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Success Metrics</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-purple-600 mb-1">1,200+</div>
                    <p className="text-xs text-gray-600">Active beta users</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-blue-600 mb-1">73%</div>
                    <p className="text-xs text-gray-600">Weekly retention</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-green-600 mb-1">4.8/5</div>
                    <p className="text-xs text-gray-600">User satisfaction</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xl font-bold text-red-600 mb-1">68%</div>
                    <p className="text-xs text-gray-600">Workload rebalancing</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-lg text-white">
                  <h4 className="font-medium mb-2">Early Monetization Testing</h4>
                  <p className="text-sm mb-3">
                    Q4 includes our first limited monetization experiments with premium features for our most engaged users.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold">$9.99</p>
                      <p className="text-xs text-blue-100">monthly price point</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">12%</p>
                      <p className="text-xs text-blue-100">conversion target</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">3</p>
                      <p className="text-xs text-blue-100">premium features</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeQuarter === 'q1-2024' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Zap size={24} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">Q1 2024: Full Launch</h3>
                    <p className="text-sm text-gray-600">Jan - Mar 2024</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Core Deliverables</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <span className="text-xs font-medium text-green-600">1</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Official Product Launch</p>
                          <p className="text-xs text-gray-600">Full feature set with paid subscription tier</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <span className="text-xs font-medium text-green-600">2</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Family AI Assistant</p>
                          <p className="text-xs text-gray-600">Natural language interface for family management</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <span className="text-xs font-medium text-green-600">3</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Relationship Coaching</p>
                          <p className="text-xs text-gray-600">Evidence-based guidance for workload discussions</p>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <span className="text-xs font-medium text-green-600">4</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Advanced Reports</p>
                          <p className="text-xs text-gray-600">Detailed analytics on family workload patterns</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Growth Channels</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="text-sm font-medium mb-1">Content Marketing</h5>
                        <p className="text-xs text-gray-600">Research-backed articles on mental load</p>
                        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-blue-600 rounded-full" style={{width: '80%'}}></div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="text-sm font-medium mb-1">Social Media</h5>
                        <p className="text-xs text-gray-600">Target platforms: Instagram, TikTok</p>
                        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-pink-600 rounded-full" style={{width: '70%'}}></div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="text-sm font-medium mb-1">Podcast Sponsorships</h5>
                        <p className="text-xs text-gray-600">Parenting & relationship podcasts</p>
                        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-purple-600 rounded-full" style={{width: '60%'}}></div>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg">
                        <h5 className="text-sm font-medium mb-1">Referral Program</h5>
                        <p className="text-xs text-gray-600">Family-to-family invitation system</p>
                        <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full">
                          <div className="h-1.5 bg-green-600 rounded-full" style={{width: '50%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-600 to-blue-600 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">Q1 Milestone: Official Launch</h3>
                <p className="text-sm mb-4">
                  Q1 marks our transition from beta to official product launch with full feature set, marketing push, and subscription model.
                </p>
                
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-white bg-opacity-10 p-2 rounded-lg">
                    <p className="text-xl font-bold text-blue-100">10,000+</p>
                    <p className="text-xs text-gray-300">active users</p>
                  </div>
                  <div className="bg-white bg-opacity-10 p-2 rounded-lg">
                    <p className="text-xl font-bold text-blue-100">15%</p>
                    <p className="text-xs text-gray-300">paid conversion</p>
                  </div>
                  <div className="bg-white bg-opacity-10 p-2 rounded-lg">
                    <p className="text-xl font-bold text-blue-100">$148K</p>
                    <p className="text-xs text-gray-300">MRR target</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Premium Features & Pricing</h3>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-5">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <DollarSign size={16} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Subscription Model</h4>
                      <p className="text-xs text-gray-600">Freemium with premium tier for advanced features</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h5 className="text-sm font-medium mb-1">Free Tier</h5>
                      <ul className="space-y-1">
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-blue-100 flex items-center justify-center mr-1 flex-shrink-0">
                            <div className="h-1 w-1 rounded-full bg-blue-600"></div>
                          </div>
                          <span>Basic task detection</span>
                        </li>
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-blue-100 flex items-center justify-center mr-1 flex-shrink-0">
                            <div className="h-1 w-1 rounded-full bg-blue-600"></div>
                          </div>
                          <span>Limited calendar integrations</span>
                        </li>
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-blue-100 flex items-center justify-center mr-1 flex-shrink-0">
                            <div className="h-1 w-1 rounded-full bg-blue-600"></div>
                          </div>
                          <span>Simple workload visualization</span>
                        </li>
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-blue-100 flex items-center justify-center mr-1 flex-shrink-0">
                            <div className="h-1 w-1 rounded-full bg-blue-600"></div>
                          </div>
                          <span>2 family members max</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <h5 className="text-sm font-medium mb-1">Premium ($9.99/mo)</h5>
                      <ul className="space-y-1">
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-purple-100 flex items-center justify-center mr-1 flex-shrink-0">
                            <div className="h-1 w-1 rounded-full bg-purple-600"></div>
                          </div>
                          <span>Advanced Task Weight AI</span>
                        </li>
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-purple-100 flex items-center justify-center mr-1 flex-shrink-0">
                            <div className="h-1 w-1 rounded-full bg-purple-600"></div>
                          </div>
                          <span>Family AI assistant</span>
                        </li>
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-purple-100 flex items-center justify-center mr-1 flex-shrink-0">
                            <div className="h-1 w-1 rounded-full bg-purple-600"></div>
                          </div>
                          <span>Relationship coaching</span>
                        </li>
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-purple-100 flex items-center justify-center mr-1 flex-shrink-0">
                            <div className="h-1 w-1 rounded-full bg-purple-600"></div>
                          </div>
                          <span>Unlimited family members</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black p-4 rounded-lg text-white">
                  <h4 className="font-medium mb-2">Launch Markets</h4>
                  <p className="text-sm mb-3">
                    Initial focus on English-speaking markets with high dual-income family concentrations.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <h5 className="text-sm font-medium mb-1">Primary Markets</h5>
                      <ul className="space-y-1">
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-white bg-opacity-20 mr-1"></div>
                          <span>United States</span>
                        </li>
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-white bg-opacity-20 mr-1"></div>
                          <span>Canada</span>
                        </li>
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-white bg-opacity-20 mr-1"></div>
                          <span>United Kingdom</span>
                        </li>
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-white bg-opacity-20 mr-1"></div>
                          <span>Australia</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium mb-1">Q2 2024 Expansion</h5>
                      <ul className="space-y-1">
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-gray-700 mr-1"></div>
                          <span>Germany</span>
                        </li>
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-gray-700 mr-1"></div>
                          <span>France</span>
                        </li>
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-gray-700 mr-1"></div>
                          <span>Nordics</span>
                        </li>
                        <li className="flex items-center text-xs">
                          <div className="h-3 w-3 rounded-full bg-gray-700 mr-1"></div>
                          <span>Japan</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Q1 Platform Expansion</h3>
                
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <MessageSquare size={18} className="text-blue-600 mr-2" />
                      Family AI Assistant
                    </h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Natural language interface for families to coordinate, manage tasks, and receive personalized guidance.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-center">
                        <p className="text-xs font-medium text-gray-700">Task Coordination</p>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <p className="text-xs font-medium text-gray-700">Calendar Management</p>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <p className="text-xs font-medium text-gray-700">Relationship Guidance</p>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <p className="text-xs font-medium text-gray-700">Family Insights</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Web App Redesign</h4>
                      <p className="text-xs text-gray-700">
                        Complete UI overhaul with enhanced mobile responsiveness and improved visualizations
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Native Mobile Apps 1.0</h4>
                      <p className="text-xs text-gray-700">
                        Official iOS and Android apps with notification integration and offline functionality
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeQuarter === 'beyond' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <Map size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium">2024-2025 Strategic Vision</h3>
                    <p className="text-sm text-gray-600">Long-term product evolution</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">2024: Platform Expansion</h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="font-medium text-purple-600">Q2</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium">International Expansion</h5>
                          <p className="text-xs text-gray-600">
                            Launch in 8 additional countries with localization and cultural adaptations
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="font-medium text-purple-600">Q3</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium">Ecosystem Integrations</h5>
                          <p className="text-xs text-gray-600">
                            Smart home, grocery delivery, and service providers (cleaning, childcare)
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="font-medium text-purple-600">Q4</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium">Enterprise Partnerships</h5>
                          <p className="text-xs text-gray-600">
                            B2B2C model with corporate wellness programs and employee benefits
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3">2025: Feature Expansion</h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="font-medium text-blue-600">Q1</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium">Child Module</h5>
                          <p className="text-xs text-gray-600">
                            Kid-friendly interface for age-appropriate task management and family participation
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="font-medium text-blue-600">Q2</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium">Extended Family Support</h5>
                          <p className="text-xs text-gray-600">
                            Grandparent mode, caregiver coordination, and multi-household management
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                          <span className="font-medium text-blue-600">H2</span>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium">Family Financial Module</h5>
                          <p className="text-xs text-gray-600">
                            Shared expense tracking, financial planning, and budget optimization
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">Growth Projections</h3>
                <div className="bg-white bg-opacity-10 p-4 rounded-lg mb-4">
                  <div className="h-48 relative">
                    {/* Growth chart visualization */}
                    <div className="absolute bottom-0 left-0 right-0 h-px bg-white bg-opacity-30"></div>
                    <div className="absolute bottom-0 left-0 w-px h-full bg-white bg-opacity-30"></div>
                    
                    {/* Revenue line */}
                    <div className="absolute bottom-0 left-0 right-0 h-10 opacity-20 bg-gradient-to-t from-green-400 to-transparent"></div>
                    <div className="absolute bottom-10 left-0 right-0 h-15 opacity-20 bg-gradient-to-t from-green-400 to-transparent"></div>
                    <div className="absolute bottom-[100px] left-0 right-0 h-20 opacity-20 bg-gradient-to-t from-green-400 to-transparent"></div>
                    
                    {/* User line */}
                    <div className="absolute bottom-0 left-0 right-0 h-5 opacity-20 bg-gradient-to-t from-blue-400 to-transparent"></div>
                    <div className="absolute bottom-5 left-0 right-0 h-25 opacity-20 bg-gradient-to-t from-blue-400 to-transparent"></div>
                    <div className="absolute bottom-[80px] left-0 right-0 h-40 opacity-20 bg-gradient-to-t from-blue-400 to-transparent"></div>
                    
                    {/* Annotation points */}
                    <div className="absolute bottom-10 left-[20%] h-2 w-2 rounded-full bg-white"></div>
                    <div className="absolute bottom-[60px] left-[50%] h-2 w-2 rounded-full bg-white"></div>
                    <div className="absolute bottom-[120px] left-[80%] h-2 w-2 rounded-full bg-white"></div>
                    
                    {/* X-axis labels */}
                    <div className="absolute bottom-[-20px] left-[20%] transform -translate-x-1/2 text-xs">Q2 2024</div>
                    <div className="absolute bottom-[-20px] left-[50%] transform -translate-x-1/2 text-xs">Q4 2024</div>
                    <div className="absolute bottom-[-20px] left-[80%] transform -translate-x-1/2 text-xs">Q2 2025</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">100K+</p>
                    <p className="text-xs text-blue-100">users by EOY 2024</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">18%</p>
                    <p className="text-xs text-blue-100">paid conversion rate</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">$2.1M</p>
                    <p className="text-xs text-blue-100">ARR by EOY 2024</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Product Expansion Strategy</h3>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Family Operating System</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      Our long-term vision is to evolve from workload management to a comprehensive family operating system.
                    </p>
                    
                    <div className="relative h-60 mt-6">
                      {/* Product evolution tree visualization */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 top-0 w-1 h-full bg-gray-200"></div>
                      
                      {/* Base product */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 top-0">
                        <div className="relative -left-32 bg-purple-100 p-2 rounded-lg text-center w-64">
                          <p className="text-sm font-medium text-purple-800">Mental Load Management</p>
                          <p className="text-xs text-purple-700">Our core product today</p>
                        </div>
                      </div>
                      
                      {/* Branch 1 */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 top-[30%]">
                        <div className="relative -left-36 bg-blue-100 p-2 rounded-lg text-center w-32">
                          <p className="text-xs font-medium text-blue-800">Child Development</p>
                          <p className="text-[10px] text-blue-700">Q1 2025</p>
                        </div>
                      </div>
                      
                      {/* Branch 2 */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 top-[30%]">
                        <div className="relative left-4 bg-green-100 p-2 rounded-lg text-center w-32">
                          <p className="text-xs font-medium text-green-800">Family Finances</p>
                          <p className="text-[10px] text-green-700">Q2 2025</p>
                        </div>
                      </div>
                      
                      {/* Branch 3 */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 top-[55%]">
                        <div className="relative -left-36 bg-yellow-100 p-2 rounded-lg text-center w-32">
                          <p className="text-xs font-medium text-yellow-800">Home Management</p>
                          <p className="text-[10px] text-yellow-700">Q3 2025</p>
                        </div>
                      </div>
                      
                      {/* Branch 4 */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 top-[55%]">
                        <div className="relative left-4 bg-red-100 p-2 rounded-lg text-center w-32">
                          <p className="text-xs font-medium text-red-800">Relationship Care</p>
                          <p className="text-[10px] text-red-700">Q3 2024</p>
                        </div>
                      </div>
                      
                      {/* Final state */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-0">
                        <div className="relative -left-32 bg-indigo-600 p-2 rounded-lg text-center text-white w-64">
                          <p className="text-sm font-medium">Complete Family OS</p>
                          <p className="text-xs text-indigo-200">2026 Vision</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Business Model Evolution</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Direct Consumer</h4>
                      <p className="text-xs text-gray-600 mb-2">
                        Our primary model: subscription directly to families
                      </p>
                      <div className="text-sm font-medium text-green-600">$8-12M ARR by end of 2025</div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">B2B2C Enterprise</h4>
                      <p className="text-xs text-gray-600 mb-2">
                        Corporate wellness benefit through employers
                      </p>
                      <div className="text-sm font-medium text-purple-600">$3-5M ARR by end of 2025</div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">API Platform</h4>
                      <p className="text-xs text-gray-600 mb-2">
                        Task Weight AI as service for third-party apps
                      </p>
                      <div className="text-sm font-medium text-blue-600">$1-2M ARR by end of 2025</div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Service Marketplace</h4>
                      <p className="text-xs text-gray-600 mb-2">
                        Commission from service provider referrals
                      </p>
                      <div className="text-sm font-medium text-yellow-600">$2-3M ARR by end of 2025</div>
                    </div>
                  </div>
                  
                  <div className="bg-black p-4 rounded-lg text-white">
                    <h4 className="font-medium mb-2">Subscription Tier Evolution</h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="h-6 w-6 rounded-full bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                          <span className="text-xs font-medium">F</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Free Tier</p>
                          <p className="text-xs text-gray-400">Limited features, serves as acquisition channel</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="h-6 w-6 rounded-full bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                          <span className="text-xs font-medium">P</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Premium ($9.99/mo)</p>
                          <p className="text-xs text-gray-400">Full AI features, 2024 core offering</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="h-6 w-6 rounded-full bg-white bg-opacity-10 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                          <span className="text-xs font-medium">F+</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Family+ ($14.99/mo)</p>
                          <p className="text-xs text-gray-400">Premium + extended family, 2025 launch</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">Our Key Milestones</h3>
                
                <div className="space-y-3">
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <div className="grid grid-cols-5 gap-2">
                      <div className="col-span-1">
                        <p className="text-sm font-medium">Q1 2024</p>
                      </div>
                      <div className="col-span-4">
                        <p className="text-sm font-medium">Official Launch</p>
                        <p className="text-xs text-blue-100">10,000 active families</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <div className="grid grid-cols-5 gap-2">
                      <div className="col-span-1">
                        <p className="text-sm font-medium">Q3 2024</p>
                      </div>
                      <div className="col-span-4">
                        <p className="text-sm font-medium">Enterprise Partnerships</p>
                        <p className="text-xs text-blue-100">First 5 corporate clients onboarded</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <div className="grid grid-cols-5 gap-2">
                      <div className="col-span-1">
                        <p className="text-sm font-medium">Q1 2025</p>
                      </div>
                      <div className="col-span-4">
                        <p className="text-sm font-medium">Child Module Launch</p>
                        <p className="text-xs text-blue-100">50,000 active families</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <div className="grid grid-cols-5 gap-2">
                      <div className="col-span-1">
                        <p className="text-sm font-medium">Q4 2025</p>
                      </div>
                      <div className="col-span-4">
                        <p className="text-sm font-medium">Family OS 1.0</p>
                        <p className="text-xs text-blue-100">Complete platform integration</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-medium mb-4 text-center">Key Achievement Milestones</h3>
          
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gray-200 transform -translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="flex items-center mb-8">
                <div className="w-1/2 pr-8 text-right">
                  <div className="inline-block bg-green-100 px-3 py-1 rounded-full text-xs font-medium text-green-800">Completed</div>
                  <h4 className="font-medium mt-1">Foundational Research</h4>
                  <p className="text-sm text-gray-600">Mental load quantification model</p>
                </div>
                <div className="absolute left-1/2 w-10 h-10 bg-green-500 rounded-full border-4 border-white transform -translate-x-1/2 flex items-center justify-center text-white font-bold">
                  ✓
                </div>
                <div className="w-1/2 pl-8">
                  <p className="text-sm text-gray-600">Q1 2023</p>
                </div>
              </div>
              
              <div className="flex items-center mb-8">
                <div className="w-1/2 pr-8 text-right">
                  <p className="text-sm text-gray-600">Q2 2023</p>
                </div>
                <div className="absolute left-1/2 w-10 h-10 bg-green-500 rounded-full border-4 border-white transform -translate-x-1/2 flex items-center justify-center text-white font-bold">
                  ✓
                </div>
                <div className="w-1/2 pl-8">
                  <div className="inline-block bg-green-100 px-3 py-1 rounded-full text-xs font-medium text-green-800">Completed</div>
                  <h4 className="font-medium mt-1">Alpha Product</h4>
                  <p className="text-sm text-gray-600">First 50 test families onboarded</p>
                </div>
              </div>
              
              <div className="flex items-center mb-8">
                <div className="w-1/2 pr-8 text-right">
                  <div className="inline-block bg-blue-100 px-3 py-1 rounded-full text-xs font-medium text-blue-800">In Progress</div>
                  <h4 className="font-medium mt-1">Private Beta</h4>
                  <p className="text-sm text-gray-600">250 beta families, core feature set</p>
                </div>
                <div className="absolute left-1/2 w-10 h-10 bg-blue-500 rounded-full border-4 border-white transform -translate-x-1/2 flex items-center justify-center text-white font-bold">
                  <Clock size={16} />
                </div>
                <div className="w-1/2 pl-8">
                  <p className="text-sm text-gray-600">Q3 2023</p>
                </div>
              </div>
              
              <div className="flex items-center mb-8">
                <div className="w-1/2 pr-8 text-right">
                  <p className="text-sm text-gray-600">Q4 2023</p>
                </div>
                <div className="absolute left-1/2 w-10 h-10 bg-gray-300 rounded-full border-4 border-white transform -translate-x-1/2 flex items-center justify-center text-white">
                  1
                </div>
                <div className="w-1/2 pl-8">
                  <div className="inline-block bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-800">Upcoming</div>
                  <h4 className="font-medium mt-1">Public Beta</h4>
                  <p className="text-sm text-gray-600">1,000+ families, advanced AI features</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-1/2 pr-8 text-right">
                  <div className="inline-block bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-800">Upcoming</div>
                  <h4 className="font-medium mt-1">Public Launch</h4>
                  <p className="text-sm text-gray-600">Full feature set with paid tier</p>
                </div>
                <div className="absolute left-1/2 w-10 h-10 bg-gray-300 rounded-full border-4 border-white transform -translate-x-1/2 flex items-center justify-center text-white">
                  2
                </div>
                <div className="w-1/2 pl-8">
                  <p className="text-sm text-gray-600">Q1 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductRoadmapSlide;