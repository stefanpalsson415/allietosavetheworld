import React, { useState } from 'react';
import { Users, TrendingUp, Star, MessageSquare, Award, Clock, Check } from 'lucide-react';

const InitialTractionSlide = () => {
  const [activeSection, setActiveSection] = useState('metrics');
  
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-0">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Initial Traction</h2>
        
        {/* Section navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button 
            className={`px-4 py-2 font-medium ${activeSection === 'metrics' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveSection('metrics')}
          >
            Key Metrics
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeSection === 'feedback' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveSection('feedback')}
          >
            User Feedback
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeSection === 'press' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveSection('press')}
          >
            Press & Recognition
          </button>
        </div>
        
        {/* Section content */}
        {activeSection === 'metrics' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <TrendingUp size={24} className="text-purple-600" />
                  </div>
                  <h3 className="text-xl font-medium">Growth Metrics</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">User Growth</h4>
                    <div className="relative h-48 bg-white rounded-lg p-4 overflow-hidden">
                      {/* Growth chart */}
                      <div className="absolute bottom-4 left-4 right-4 h-px bg-gray-300"></div>
                      <div className="absolute bottom-4 left-4 h-36 w-px bg-gray-300"></div>
                      
                      {/* Growth curve */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 180" preserveAspectRatio="none">
                        <path 
                          d="M 30,150 Q 60,140 90,120 T 150,85 T 210,40 T 270,25" 
                          fill="none" 
                          stroke="url(#gradient)" 
                          strokeWidth="3"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#3B82F6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      {/* Data points */}
                      <div className="absolute bottom-20 left-[20%] transform -translate-x-1/2">
                        <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                      </div>
                      <div className="absolute bottom-8 right-4 text-xs">
                        <div className="font-medium">Last 6 months: 410% growth</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <p className="text-xl font-bold text-purple-700">3,420</p>
                      <p className="text-xs text-gray-700">Active Beta Users</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-xl font-bold text-blue-700">14,600+</p>
                      <p className="text-xs text-gray-700">Waitlist Signups</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <p className="text-xl font-bold text-green-700">18%</p>
                      <p className="text-xs text-gray-700">Referral Rate</p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded-lg text-center">
                      <p className="text-xl font-bold text-indigo-700">$0</p>
                      <p className="text-xs text-gray-700">CAC (Organic Growth)</p>
                    </div>
                  </div>
                  
                  <div className="bg-black text-white p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Engagement Highlights</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold">4.8</p>
                        <p className="text-xs text-gray-400">days/week active</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">92%</p>
                        <p className="text-xs text-gray-400">week 1 retention</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">84%</p>
                        <p className="text-xs text-gray-400">month 1 retention</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3 flex items-center">
                  <Star size={22} className="text-yellow-500 mr-2" />
                  Beta Program Results
                </h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Perceived Value</h4>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200 rounded-full relative">
                          <div className="absolute top-0 left-0 h-full w-[92%] bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                          <div className="absolute top-0 left-[92%] h-6 w-6 -mt-0.5 -ml-3 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center">
                            <span className="text-xs font-bold">92%</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-3 text-sm text-gray-600">
                        would pay for premium
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Problem-Solution Fit</h4>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200 rounded-full relative">
                          <div className="absolute top-0 left-0 h-full w-[96%] bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                          <div className="absolute top-0 left-[96%] h-6 w-6 -mt-0.5 -ml-3 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center">
                            <span className="text-xs font-bold">96%</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-3 text-sm text-gray-600">
                        say it solves a real need
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">NPS Score</h4>
                    <div className="flex items-center">
                      <div className="flex-1">
                        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200 rounded-full relative">
                          <div className="absolute top-0 left-0 h-full w-[78%] bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                          <div className="absolute top-0 left-[78%] h-6 w-6 -mt-0.5 -ml-3 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center">
                            <span className="text-xs font-bold">78</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-3 text-sm text-gray-600">
                        Net Promoter Score
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3 flex items-center">
                  <Users size={22} className="text-blue-600 mr-2" />
                  User Demographics
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Family Structure</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-sm font-medium text-purple-600">64%</div>
                        <p className="text-xs text-gray-600">Dual-income</p>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-sm font-medium text-blue-600">18%</div>
                        <p className="text-xs text-gray-600">Single-parent</p>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-sm font-medium text-green-600">12%</div>
                        <p className="text-xs text-gray-600">Stay-at-home</p>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-sm font-medium text-yellow-600">14%</div>
                        <p className="text-xs text-gray-600">Same-sex</p>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-sm font-medium text-red-600">11%</div>
                        <p className="text-xs text-gray-600">Blended</p>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-sm font-medium text-gray-600">6%</div>
                        <p className="text-xs text-gray-600">Other</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Some families fall into multiple categories</p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">User Acquisition</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Word of mouth referrals</span>
                          <span>43%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '43%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Waitlist signups (organic)</span>
                          <span>28%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '28%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Social media</span>
                          <span>18%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{width: '18%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Content marketing</span>
                          <span>11%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-yellow-500 h-1.5 rounded-full" style={{width: '11%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Geographic Distribution</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-sm font-medium text-purple-600">72%</div>
                        <p className="text-xs text-gray-600">United States</p>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-sm font-medium text-blue-600">14%</div>
                        <p className="text-xs text-gray-600">Canada</p>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-sm font-medium text-green-600">8%</div>
                        <p className="text-xs text-gray-600">UK</p>
                      </div>
                      <div className="bg-white p-2 rounded text-center">
                        <div className="text-sm font-medium text-yellow-600">6%</div>
                        <p className="text-xs text-gray-600">Other</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Impact Stats</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <div className="text-3xl font-bold text-purple-700 mb-1">68%</div>
                    <p className="text-sm text-gray-700">Reduction in mental load imbalance</p>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      <div className="h-8 bg-purple-200 rounded-l-lg flex items-center pl-2">
                        <span className="text-xs">Before: 78/22</span>
                      </div>
                      <div className="h-8 bg-purple-400 rounded-r-lg flex items-center justify-end pr-2">
                        <span className="text-xs text-white">After: 58/42</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-3xl font-bold text-blue-700 mb-1">12.4</div>
                    <p className="text-sm text-gray-700">Hours saved weekly per family</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-start">
                        <Clock size={16} className="text-blue-500 mt-0.5 mr-1" />
                        <p className="text-xs">Primary: 8.2 hrs</p>
                      </div>
                      <div className="flex items-start">
                        <Clock size={16} className="text-blue-500 mt-0.5 mr-1" />
                        <p className="text-xs">Partner: 4.2 hrs</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-3xl font-bold text-green-700 mb-1">84%</div>
                    <p className="text-sm text-gray-700">Report improved relationship</p>
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>Less conflict</span>
                      <span>More communication</span>
                      <span>Shared goals</span>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-700 mb-1">$216</div>
                    <p className="text-sm text-gray-700">Monthly value perception</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Users estimate $216/mo value vs. $9.99 planned price
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">Early Corporate Interest</h3>
                <p className="text-sm mb-4">
                  We've received inbound interest from 8 enterprise companies interested in offering Allie as an employee wellness benefit.
                </p>
                <div className="flex justify-between">
                  <div className="text-center">
                    <p className="text-xl font-bold">3</p>
                    <p className="text-xs text-blue-100">Fortune 500</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">2</p>
                    <p className="text-xs text-blue-100">Tech giants</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold">3</p>
                    <p className="text-xs text-blue-100">Healthcare orgs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'feedback' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <MessageSquare size={24} className="text-purple-600" />
                  </div>
                  <h3 className="text-xl font-medium">User Testimonials</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 bg-purple-200 rounded-full mr-3 flex items-center justify-center">
                        <span className="font-medium text-purple-700">EM</span>
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <div className="flex space-x-1 mr-2">
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <Star size={16} className="text-yellow-500 fill-current" />
                          </div>
                          <span className="text-sm font-medium">Emily M., Product Manager</span>
                        </div>
                        <p className="text-sm text-gray-700 italic">
                          "Allie has completely transformed how my partner and I manage our household. For the first time, he can see all the 'invisible work' I've been doing. Our workload is so much more balanced now, and I finally have time for myself again."
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-200 rounded-full mr-3 flex items-center justify-center">
                        <span className="font-medium text-blue-700">JR</span>
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <div className="flex space-x-1 mr-2">
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <Star size={16} className="text-yellow-500 fill-current" />
                          </div>
                          <span className="text-sm font-medium">James R., Software Engineer</span>
                        </div>
                        <p className="text-sm text-gray-700 italic">
                          "I had no idea how much my wife was doing until Allie showed us the data. The visualization of mental load was a complete eye-opener. We've been using it for 3 months, and our relationship is stronger than it's been in years."
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 bg-green-200 rounded-full mr-3 flex items-center justify-center">
                        <span className="font-medium text-green-700">MT</span>
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <div className="flex space-x-1 mr-2">
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <Star size={16} className="text-yellow-500 fill-current" />
                            <Star size={16} className="text-yellow-500 fill-current" />
                          </div>
                          <span className="text-sm font-medium">Michael T., Single Dad</span>
                        </div>
                        <p className="text-sm text-gray-700 italic">
                          "As a single parent, the mental load was crushing me. Allie helps me organize everything in one place and prioritize what really matters. The time I've reclaimed has been life-changing—I can actually be present with my kids instead of constantly planning in my head."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Feature Feedback Highlights</h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Most Valuable Features</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Task Weight visualization</span>
                          <span className="font-medium">92%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '92%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Calendar integration</span>
                          <span className="font-medium">87%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '87%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Weekly insights report</span>
                          <span className="font-medium">78%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{width: '78%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Automated task detection</span>
                          <span className="font-medium">73%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-yellow-500 h-1.5 rounded-full" style={{width: '73%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Most Requested Features</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Child-friendly interface</span>
                          <span className="font-medium">67%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '67%'}}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Planned for Q1 2024</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Extended family access</span>
                          <span className="font-medium">58%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '58%'}}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Planned for Q2 2024</p>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Smart home integration</span>
                          <span className="font-medium">42%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{width: '42%'}}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Planned for Q3 2024</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">AI Effectiveness Ratings</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-purple-600">92%</p>
                      <p className="text-xs text-gray-700">Task Detection</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-blue-600">87%</p>
                      <p className="text-xs text-gray-700">Task Weight</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-lg font-bold text-green-600">89%</p>
                      <p className="text-xs text-gray-700">Distribution</p>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">AI Model Feedback</h4>
                    <div className="space-y-1">
                      <div className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <Check size={12} className="text-green-600" />
                        </div>
                        <p className="text-sm">"Impressively accurate at capturing invisible work"</p>
                      </div>
                      <div className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <Check size={12} className="text-green-600" />
                        </div>
                        <p className="text-sm">"Intuitively understands family contexts and situations"</p>
                      </div>
                      <div className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <Check size={12} className="text-green-600" />
                        </div>
                        <p className="text-sm">"Gets better with each week of usage"</p>
                      </div>
                      <div className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-yellow-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                          <Clock size={12} className="text-yellow-600" />
                        </div>
                        <p className="text-sm">"Sometimes misses context for specialized family situations"</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-200 rounded-full mr-3 flex items-center justify-center">
                        <span className="font-medium text-blue-700">AL</span>
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium">Alex & Lee, Parents of 3</span>
                        </div>
                        <p className="text-sm text-gray-700 italic">
                          "The Task Weight AI is uncanny. It correctly identified patterns we didn't even realize existed in our family management. Having this data completely transformed our conversations from accusatory to collaborative."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Beta Partner Feedback</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                        <span className="font-medium text-gray-700">SF</span>
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium">Stanford Family Research Lab</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          "In our longitudinal studies of mental load impact, Allie has demonstrated the most significant positive outcomes we've measured to date. The data-driven approach creates objective conversation starting points that move beyond blame."
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                        <span className="font-medium text-gray-700">FC</span>
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium">Family Counselors Association</span>
                        </div>
                        <p className="text-sm text-gray-700">
                          "We've been recommending Allie to our client families as a tool to supplement therapy. The objective data helps couples move past gridlock on household management issues."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">User Success Stories</h3>
                <div className="space-y-3">
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <div className="h-2 w-2 rounded-full bg-white mr-2"></div>
                      <p className="text-sm font-medium">The Johnson Family</p>
                    </div>
                    <p className="text-sm">
                      Dual-income parents with 3 kids who rebalanced their mental load from 82/18 to 56/44 in just 6 weeks, saving 14 hours weekly.
                    </p>
                  </div>
                  
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <div className="h-2 w-2 rounded-full bg-white mr-2"></div>
                      <p className="text-sm font-medium">Maria S.</p>
                    </div>
                    <p className="text-sm">
                      Single mom who used Allie to coordinate with her co-parent across households, reducing miscommunication by 78%.
                    </p>
                  </div>
                  
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <div className="flex items-center mb-1">
                      <div className="h-2 w-2 rounded-full bg-white mr-2"></div>
                      <p className="text-sm font-medium">The Patel-Williams</p>
                    </div>
                    <p className="text-sm">
                      Blended family who integrated their complex schedule across 2 households and 5 children, saving over 10 hours weekly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'press' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <Award size={24} className="text-purple-600" />
                  </div>
                  <h3 className="text-xl font-medium">Media Coverage</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center font-bold">
                        T
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium">TechCrunch</span>
                          <span className="text-xs text-gray-500 ml-2">March 2023</span>
                        </div>
                        <h4 className="text-sm font-medium mb-1">"Allie is tackling the invisible mental load that's crushing families"</h4>
                        <p className="text-sm text-gray-700">
                          "...a breakthrough approach to measuring and redistributing cognitive labor in households, backed by impressive AI..."
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center font-bold">
                        F
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium">Fast Company</span>
                          <span className="text-xs text-gray-500 ml-2">April 2023</span>
                        </div>
                        <h4 className="text-sm font-medium mb-1">"Most Innovative Family Tech of 2023"</h4>
                        <p className="text-sm text-gray-700">
                          "...combines cutting-edge AI with deep psychological research to address one of modern families' biggest pain points..."
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center font-bold">
                        W
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium">Wired</span>
                          <span className="text-xs text-gray-500 ml-2">May 2023</span>
                        </div>
                        <h4 className="text-sm font-medium mb-1">"The AI app quantifying the mental load crisis"</h4>
                        <p className="text-sm text-gray-700">
                          "...finally puts numbers to something women have been describing for decades—and offers a solution..."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Expert Recognition</h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                        <span className="font-medium text-gray-700">EC</span>
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium">Dr. Emily Chen, Stanford University</span>
                        </div>
                        <p className="text-sm text-gray-700 italic">
                          "Allie represents the most promising intervention I've seen for household equity. Their dataset is becoming the largest repository of family mental load information in existence."
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
                        <span className="font-medium text-gray-700">JB</span>
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium">Dr. James Brown, MIT Behavioral Lab</span>
                        </div>
                        <p className="text-sm text-gray-700 italic">
                          "The combination of passive data collection with their Task Weight AI creates a genuinely novel approach to workload distribution that avoids the friction points of manual tracking."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Industry Recognition</h3>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <Award size={24} className="text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Family Tech Innovator Award</p>
                      <p className="text-xs text-gray-600">FamTech Summit 2023</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <Award size={24} className="text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Top 10 AI Startups to Watch</p>
                      <p className="text-xs text-gray-600">VentureBeat AI Report</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <Award size={24} className="text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Mental Health Tech Innovation</p>
                      <p className="text-xs text-gray-600">Wellness Tech Awards</p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <Award size={24} className="text-yellow-600 mx-auto mb-2" />
                      <p className="text-sm font-medium">Women in Tech Founder Award</p>
                      <p className="text-xs text-gray-600">TechWomen 2023</p>
                    </div>
                  </div>
                  
                  <div className="bg-black text-white p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Accelerator & VC Interest</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white bg-opacity-10 p-2 rounded text-center">
                        <p className="text-sm font-medium">Y Combinator W23</p>
                        <p className="text-xs text-gray-300">Top 5% Demo Day</p>
                      </div>
                      <div className="bg-white bg-opacity-10 p-2 rounded text-center">
                        <p className="text-sm font-medium">Techstars Family Tech</p>
                        <p className="text-xs text-gray-300">Cohort Selection</p>
                      </div>
                      <div className="bg-white bg-opacity-10 p-2 rounded text-center">
                        <p className="text-sm font-medium">8 VC Cold Outreach</p>
                        <p className="text-xs text-gray-300">Based on beta metrics</p>
                      </div>
                      <div className="bg-white bg-opacity-10 p-2 rounded text-center">
                        <p className="text-sm font-medium">3 Term Sheets</p>
                        <p className="text-xs text-gray-300">Pre-seed round</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Social Media Traction</h3>
                
                <div className="space-y-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Organic Reach</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-lg font-medium text-blue-700">1.2M</p>
                        <p className="text-xs text-gray-600">TikTok Views</p>
                      </div>
                      <div className="bg-purple-50 p-2 rounded">
                        <p className="text-lg font-medium text-purple-700">430K</p>
                        <p className="text-xs text-gray-600">Instagram Reach</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-lg font-medium text-green-700">86K</p>
                        <p className="text-xs text-gray-600">Twitter Impressions</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Key Content Performance</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>"The Invisible Work" series</span>
                          <span>642K views</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '90%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>"Mental Load Explained" video</span>
                          <span>487K views</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '70%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>"How We Balance Our Home" stories</span>
                          <span>312K views</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{width: '50%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">Strategic Partnerships</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Stanford Family Research Lab</h4>
                      <p className="text-xs text-blue-100">Academic validation and research partnership</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Family Counselors Association</h4>
                      <p className="text-xs text-blue-100">Professional distribution channel (14K members)</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      <Check size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">ParentTech Alliance</h4>
                      <p className="text-xs text-blue-100">Industry collaboration network</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      <Clock size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Major Calendar Provider (in negotiation)</h4>
                      <p className="text-xs text-blue-100">Potential integration partnership with 200M+ users</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 bg-black p-6 rounded-lg text-white">
          <h3 className="text-xl font-medium mb-4 text-center">Traction Highlights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-purple-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Users size={24} className="text-purple-300" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">3,420</p>
                <p className="text-sm text-blue-200">Active Beta Users</p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-blue-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <TrendingUp size={24} className="text-blue-300" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">410%</p>
                <p className="text-sm text-blue-200">6-Month Growth</p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-green-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Star size={24} className="text-green-300" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">78</p>
                <p className="text-sm text-blue-200">Net Promoter Score</p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-yellow-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Award size={24} className="text-yellow-300" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">14.6K</p>
                <p className="text-sm text-blue-200">Waitlist Signups</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialTractionSlide;