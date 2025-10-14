import React, { useState } from 'react';
import { DollarSign, Users, TrendingUp, BarChart, PieChart, Activity, ArrowRight } from 'lucide-react';

const FinancialProjectionsSlide = () => {
  const [activeTab, setActiveTab] = useState('revenue');
  
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-0">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Financial Projections</h2>
        
        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'revenue' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('revenue')}
          >
            Revenue
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'unit' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('unit')}
          >
            Unit Economics
          </button>
          <button 
            className={`px-4 py-2 font-medium ${activeTab === 'funding' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('funding')}
          >
            Funding & Use
          </button>
        </div>
        
        {/* Tab content */}
        {activeTab === 'revenue' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <DollarSign size={24} className="text-green-600" />
                </div>
                <h3 className="text-xl font-medium">Revenue Projections</h3>
              </div>
              
              <div className="space-y-5">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">5-Year Revenue Forecast</h4>
                  <div className="relative h-48 bg-white rounded-lg p-4 overflow-hidden">
                    {/* Revenue chart visualization */}
                    <div className="absolute bottom-4 left-4 right-4 h-px bg-gray-300"></div>
                    <div className="absolute bottom-4 left-4 h-32 w-px bg-gray-300"></div>
                    
                    {/* Revenue bars */}
                    <div className="absolute bottom-4 left-[15%] w-8 bg-gradient-to-t from-purple-500 to-blue-500" style={{height: '10px'}}></div>
                    <div className="absolute bottom-4 left-[32%] w-8 bg-gradient-to-t from-purple-500 to-blue-500" style={{height: '40px'}}></div>
                    <div className="absolute bottom-4 left-[49%] w-8 bg-gradient-to-t from-purple-500 to-blue-500" style={{height: '80px'}}></div>
                    <div className="absolute bottom-4 left-[66%] w-8 bg-gradient-to-t from-purple-500 to-blue-500" style={{height: '130px'}}></div>
                    <div className="absolute bottom-4 left-[83%] w-8 bg-gradient-to-t from-purple-500 to-blue-500" style={{height: '190px'}}></div>
                    
                    {/* Year labels */}
                    <div className="absolute bottom-0 left-[15%] transform -translate-x-1/2 text-xs text-gray-600">Year 1</div>
                    <div className="absolute bottom-0 left-[32%] transform -translate-x-1/2 text-xs text-gray-600">Year 2</div>
                    <div className="absolute bottom-0 left-[49%] transform -translate-x-1/2 text-xs text-gray-600">Year 3</div>
                    <div className="absolute bottom-0 left-[66%] transform -translate-x-1/2 text-xs text-gray-600">Year 4</div>
                    <div className="absolute bottom-0 left-[83%] transform -translate-x-1/2 text-xs text-gray-600">Year 5</div>
                    
                    {/* Revenue labels */}
                    <div className="absolute top-4 left-[15%] transform -translate-x-1/2 text-xs font-medium text-gray-800">€1.1M</div>
                    <div className="absolute top-4 left-[32%] transform -translate-x-1/2 text-xs font-medium text-gray-800">€4.3M</div>
                    <div className="absolute top-4 left-[49%] transform -translate-x-1/2 text-xs font-medium text-gray-800">€9.1M</div>
                    <div className="absolute top-4 left-[66%] transform -translate-x-1/2 text-xs font-medium text-gray-800">€16.9M</div>
                    <div className="absolute top-4 left-[83%] transform -translate-x-1/2 text-xs font-medium text-gray-800">€39.0M</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Annual Recurring Revenue</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span>Year 1 (2024)</span>
                        <span className="font-medium">€1.1M</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Year 2 (2025)</span>
                        <span className="font-medium">€4.3M</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Year 3 (2026)</span>
                        <span className="font-medium">€9.1M</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Growth Factors</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
                        <span>173% Y1-Y2 growth</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
                        <span>113% Y2-Y3 growth</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
                        <span>87% Y3-Y4 growth</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
                        <span>130% Y4-Y5 growth</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="bg-black text-white p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Key Revenue Assumptions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-lg font-bold">€9.25</p>
                      <p className="text-xs text-gray-400">monthly subscription</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">15-22%</p>
                      <p className="text-xs text-gray-400">conversion rate</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">428K</p>
                      <p className="text-xs text-gray-400">users by year 5</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold">73%</p>
                      <p className="text-xs text-gray-400">annual retention</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Multi-Stream Revenue Model & Gross Margin</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium text-sm">Direct Consumer (B2C)</h4>
                        <span className="text-sm font-medium text-green-600">82% of revenue</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        Family subscription model with free and premium tiers
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2 rounded text-center">
                          <p className="text-xs font-medium">€9.25/month</p>
                          <p className="text-[10px] text-gray-500">Standard</p>
                        </div>
                        <div className="bg-white p-2 rounded text-center">
                          <p className="text-xs font-medium">€13.90/month</p>
                          <p className="text-[10px] text-gray-500">Family+ (Year 2)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium text-sm">Enterprise (B2B2C)</h4>
                        <span className="text-sm font-medium text-blue-600">12% of revenue</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        Corporate wellness benefit through employers
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2 rounded text-center">
                          <p className="text-xs font-medium">€22.50/user/month</p>
                          <p className="text-[10px] text-gray-500">Volume pricing</p>
                        </div>
                        <div className="bg-white p-2 rounded text-center">
                          <p className="text-xs font-medium">Q3 2024</p>
                          <p className="text-[10px] text-gray-500">Launch timeline</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-medium text-sm">Partner Revenue</h4>
                        <span className="text-sm font-medium text-purple-600">6% of revenue</span>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        Referral fees from recommended service providers
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white p-2 rounded text-center">
                          <p className="text-xs font-medium">10-15% commission</p>
                          <p className="text-[10px] text-gray-500">Service providers</p>
                        </div>
                        <div className="bg-white p-2 rounded text-center">
                          <p className="text-xs font-medium">Q1 2025</p>
                          <p className="text-[10px] text-gray-500">Full marketplace</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Gross Margin by Usage Level</h4>
                      <p className="text-xs text-gray-600 mb-2">
                        Primary costs: Claude API compute and Firebase database
                      </p>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Light user family (15 queries/mo)</span>
                            <span className="font-medium">96% margin</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '96%'}}></div>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">€1.20/mo compute cost (€29.99 revenue)</p>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Medium user family (50 queries/mo)</span>
                            <span className="font-medium">92% margin</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '92%'}}></div>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">€2.40/mo compute cost (€29.99 revenue)</p>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Heavy user family (120+ queries/mo)</span>
                            <span className="font-medium">84% margin</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{width: '84%'}}></div>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">€4.80/mo compute cost (€29.99 revenue)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">AI Cost Trajectory</h4>
                      <div className="relative h-32 bg-white rounded p-2 mb-2">
                        {/* AI Cost trend chart visualization */}
                        <div className="absolute bottom-2 left-2 right-2 h-px bg-gray-300"></div>
                        <div className="absolute bottom-2 left-2 h-24 w-px bg-gray-300"></div>
                        
                        {/* Utility threshold line */}
                        <div className="absolute left-2 right-2 border-b border-dashed border-blue-400" style={{bottom: '40%'}}></div>
                        <div className="absolute right-3 text-[9px] text-blue-500" style={{bottom: '41%'}}>
                          Utility Threshold: €0.0025/token
                        </div>
                        
                        {/* Cost curve */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 240 100" preserveAspectRatio="none">
                          <path 
                            d="M 20,10 Q 60,25 120,50 T 220,85" 
                            fill="none" 
                            stroke="red" 
                            strokeWidth="2"
                          />
                        </svg>
                        
                        {/* Year labels */}
                        <div className="absolute bottom-0 left-0 text-[9px] text-gray-500">2023</div>
                        <div className="absolute bottom-0 left-[40%] text-[9px] text-gray-500">2025</div>
                        <div className="absolute bottom-0 right-0 text-[9px] text-gray-500">2029</div>
                        
                        {/* Price points */}
                        <div className="absolute text-[9px] text-red-500" style={{left: '5%', top: '10%'}}>€0.008</div>
                        <div className="absolute text-[9px] text-red-500" style={{left: '40%', top: '50%'}}>€0.0045</div>
                        <div className="absolute text-[9px] text-red-500" style={{right: '5%', top: '85%'}}>€0.0005</div>
                      </div>
                      <p className="text-[10px] text-gray-600">
                        AI cost per token is declining rapidly, projected to drop 94% by 2029, 
                        driving gross margins from current ~90% to 97%+ over time even as feature usage increases.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">User Growth Projections</h3>
                
                <div className="relative h-36 bg-gray-50 rounded-lg p-4 overflow-hidden mb-4">
                  {/* User growth chart */}
                  <div className="absolute bottom-4 left-4 right-4 h-px bg-gray-300"></div>
                  <div className="absolute bottom-4 left-4 h-24 w-px bg-gray-300"></div>
                  
                  {/* Growth curve */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                    <path 
                      d="M 30,110 Q 60,105 90,95 T 150,70 T 210,40 T 270,10" 
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
                  <div className="absolute bottom-4 left-[10%] transform translate-y-[-12px] -translate-x-1/2">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  </div>
                  <div className="absolute bottom-4 left-[30%] transform translate-y-[-35px] -translate-x-1/2">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  </div>
                  <div className="absolute bottom-4 left-[50%] transform translate-y-[-60px] -translate-x-1/2">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  </div>
                  <div className="absolute bottom-4 left-[70%] transform translate-y-[-85px] -translate-x-1/2">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  </div>
                  <div className="absolute bottom-4 left-[90%] transform translate-y-[-105px] -translate-x-1/2">
                    <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  </div>
                </div>
                
                <div className="grid grid-cols-5 gap-1 text-center">
                  <div>
                    <p className="text-xs font-medium">12K</p>
                    <p className="text-[10px] text-gray-500">Year 1</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium">48K</p>
                    <p className="text-[10px] text-gray-500">Year 2</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium">106K</p>
                    <p className="text-[10px] text-gray-500">Year 3</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium">218K</p>
                    <p className="text-[10px] text-gray-500">Year 4</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium">428K</p>
                    <p className="text-[10px] text-gray-500">Year 5</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">Profitability Timeline</h3>
                <div className="relative h-14 bg-white bg-opacity-10 rounded-lg mb-4">
                  <div className="absolute top-0 bottom-0 left-0 w-[28%] bg-red-500 bg-opacity-30 rounded-l-lg"></div>
                  <div className="absolute top-0 bottom-0 left-[28%] right-0 bg-green-500 bg-opacity-30 rounded-r-lg"></div>
                  <div className="absolute top-0 bottom-0 left-[28%] w-px bg-white"></div>
                  
                  <div className="absolute top-1 left-[14%] transform -translate-x-1/2 text-xs font-medium">
                    Cash Burn
                  </div>
                  <div className="absolute top-1 left-[64%] transform -translate-x-1/2 text-xs font-medium">
                    Profitable Growth
                  </div>
                  
                  <div className="absolute bottom-1 left-[28%] transform -translate-x-1/2 text-xs">
                    Q1 2025
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xl font-bold">€5.9M</p>
                    <p className="text-xs text-blue-100">Total burn until profitability</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">19 months</p>
                    <p className="text-xs text-blue-100">Path to positive unit economics</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'unit' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Users size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-medium">Unit Economics</h3>
              </div>
              
              <div className="space-y-5">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Customer Acquisition</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Year 1 CAC</span>
                        <span className="font-medium">€35.50</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '80%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Year 2 CAC</span>
                        <span className="font-medium">€30.30</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '68%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Year 3 CAC</span>
                        <span className="font-medium">€27.00</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '60%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Customer Lifetime Value</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Year 1 LTV</span>
                        <span className="font-medium">€80.00</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{width: '45%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Year 2 LTV</span>
                        <span className="font-medium">€118.00</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{width: '65%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Year 3 LTV</span>
                        <span className="font-medium">€170.50</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{width: '95%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">LTV:CAC Ratio Evolution</h4>
                  <div className="h-36 bg-white rounded-lg relative overflow-hidden mb-4">
                    {/* LTV:CAC ratio chart */}
                    <div className="absolute bottom-4 left-4 right-4 h-px bg-gray-300"></div>
                    <div className="absolute bottom-4 left-4 h-24 w-px bg-gray-300"></div>
                    
                    {/* Target ratio line */}
                    <div className="absolute bottom-4 left-4 right-4 transform translate-y-[-24px] border-t border-dashed border-gray-400"></div>
                    <div className="absolute bottom-4 right-4 transform translate-y-[-24px] -translate-x-2 bg-gray-100 px-1 text-[10px] text-gray-600">
                      Target 3:1
                    </div>
                    
                    {/* Ratio bars */}
                    <div className="absolute bottom-4 left-[15%] transform -translate-x-1/2 w-8 h-12 bg-gradient-to-t from-purple-500 to-purple-400"></div>
                    <div className="absolute bottom-4 left-[35%] transform -translate-x-1/2 w-8 h-16 bg-gradient-to-t from-purple-500 to-purple-400"></div>
                    <div className="absolute bottom-4 left-[55%] transform -translate-x-1/2 w-8 h-20 bg-gradient-to-t from-purple-500 to-purple-400"></div>
                    <div className="absolute bottom-4 left-[75%] transform -translate-x-1/2 w-8 h-28 bg-gradient-to-t from-purple-500 to-purple-400"></div>
                    
                    {/* Labels */}
                    <div className="absolute bottom-0 left-[15%] transform -translate-x-1/2 text-xs text-gray-500">Y1</div>
                    <div className="absolute bottom-0 left-[35%] transform -translate-x-1/2 text-xs text-gray-500">Y2</div>
                    <div className="absolute bottom-0 left-[55%] transform -translate-x-1/2 text-xs text-gray-500">Y3</div>
                    <div className="absolute bottom-0 left-[75%] transform -translate-x-1/2 text-xs text-gray-500">Y4</div>
                    
                    <div className="absolute top-4 left-[15%] transform -translate-x-1/2 text-xs font-medium">2.2×</div>
                    <div className="absolute top-4 left-[35%] transform -translate-x-1/2 text-xs font-medium">3.9×</div>
                    <div className="absolute top-4 left-[55%] transform -translate-x-1/2 text-xs font-medium">6.3×</div>
                    <div className="absolute top-4 left-[75%] transform -translate-x-1/2 text-xs font-medium">8.7×</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Operating Metrics</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Gross Margin</h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2 rounded">
                        <p className="text-xs font-medium">78%</p>
                        <p className="text-[10px] text-gray-500">Year 1</p>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <p className="text-xs font-medium">82%</p>
                        <p className="text-[10px] text-gray-500">Year 2</p>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <p className="text-xs font-medium">86%</p>
                        <p className="text-[10px] text-gray-500">Year 3+</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">COGS Components</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Cloud infrastructure</span>
                          <span>8.5%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '8.5%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>API usage (calendar, AI)</span>
                          <span>6.2%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '6.2%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Customer support</span>
                          <span>3.8%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{width: '3.8%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Payment processing</span>
                          <span>2.5%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-yellow-500 h-1.5 rounded-full" style={{width: '2.5%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">User Metrics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-2 rounded">
                        <p className="text-xs font-medium">Retention</p>
                        <div className="flex justify-between text-[10px] mt-1">
                          <span className="text-gray-600">Month 1</span>
                          <span className="font-medium">92%</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-600">Month 12</span>
                          <span className="font-medium">73%</span>
                        </div>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <p className="text-xs font-medium">Conversion</p>
                        <div className="flex justify-between text-[10px] mt-1">
                          <span className="text-gray-600">Free → Paid</span>
                          <span className="font-medium">15%</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-gray-600">Year 3 Target</span>
                          <span className="font-medium">22%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Cost Structure</h3>
                
                <div className="h-36 bg-gray-50 rounded-lg p-4 relative mb-4">
                  {/* Cost structure pie chart */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden relative">
                      <div className="absolute top-0 left-0 right-0 bottom-0" style={{
                        background: 'conic-gradient(#8B5CF6 0% 42%, #3B82F6 42% 64%, #10B981 64% 85%, #A3A3A3 85% 100%)'
                      }}></div>
                    </div>
                  </div>
                  
                  <div className="absolute top-4 right-4 text-xs space-y-1">
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-purple-500 rounded-full mr-1"></div>
                      <span>R&D: 42%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mr-1"></div>
                      <span>Sales & Marketing: 22%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                      <span>G&A: 21%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-gray-500 rounded-full mr-1"></div>
                      <span>COGS: 15%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <div className="text-center">
                    <p className="text-sm font-medium text-purple-600">€1.72M</p>
                    <p className="text-xs text-gray-500">Year 1 Expenses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-blue-600">€3.00M</p>
                    <p className="text-xs text-gray-500">Year 2 Expenses</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-600">€5.31M</p>
                    <p className="text-xs text-gray-500">Year 3 Expenses</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-black text-white p-5 rounded-lg">
                <h3 className="text-lg font-medium mb-3">Economic Milestones</h3>
                <div className="relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-white bg-opacity-20"></div>
                  
                  <div className="ml-8 mb-3 relative">
                    <div className="absolute -left-8 top-1 h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center">
                      <TrendingUp size={14} />
                    </div>
                    <h4 className="text-base font-medium">Unit Profitability</h4>
                    <p className="text-xs text-gray-400">Q1 2025 (Month 13)</p>
                  </div>
                  
                  <div className="ml-8 mb-3 relative">
                    <div className="absolute -left-8 top-1 h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                      <TrendingUp size={14} />
                    </div>
                    <h4 className="text-base font-medium">Cash Flow Breakeven</h4>
                    <p className="text-xs text-gray-400">Q2 2026 (Month 28)</p>
                  </div>
                  
                  <div className="ml-8 relative">
                    <div className="absolute -left-8 top-1 h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                      <TrendingUp size={14} />
                    </div>
                    <h4 className="text-base font-medium">EBITDA Positive</h4>
                    <p className="text-xs text-gray-400">Q3 2026 (Month 32)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'funding' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <DollarSign size={24} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-medium">Funding Strategy</h3>
              </div>
              
              <div className="space-y-5">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Current Round</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white p-3 rounded shadow-sm text-center">
                      <p className="text-xl font-bold text-purple-600">€5.4M</p>
                      <p className="text-xs text-gray-600">Seed Round Target</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm text-center">
                      <p className="text-xl font-bold text-green-600">€1.9M</p>
                      <p className="text-xs text-gray-600">Committed</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span>Round Progress</span>
                      <span className="font-medium">36%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{width: '36%'}}></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Investors: Founder Ventures, Family Tech Fund, 2 angels</p>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Funding Roadmap</h4>
                  <div className="relative">
                    <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-blue-200"></div>
                    
                    <div className="ml-8 mb-3 relative">
                      <div className="absolute -left-8 top-1 h-5 w-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-medium">1</div>
                      <h4 className="text-sm font-medium">Pre-Seed (Completed)</h4>
                      <p className="text-xs text-gray-600">€695K at €3.9M cap</p>
                    </div>
                    
                    <div className="ml-8 mb-3 relative">
                      <div className="absolute -left-8 top-1 h-5 w-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-medium">2</div>
                      <h4 className="text-sm font-medium">Seed (Current)</h4>
                      <p className="text-xs text-gray-600">€5.4M at €16.7M pre-money</p>
                    </div>
                    
                    <div className="ml-8 mb-3 relative">
                      <div className="absolute -left-8 top-1 h-5 w-5 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-medium">3</div>
                      <h4 className="text-sm font-medium">Series A (Q3 2024)</h4>
                      <p className="text-xs text-gray-600">€11.1M target</p>
                    </div>
                    
                    <div className="ml-8 relative">
                      <div className="absolute -left-8 top-1 h-5 w-5 rounded-full bg-gray-400 text-white flex items-center justify-center text-xs font-medium">4</div>
                      <h4 className="text-sm font-medium">Series B (2025)</h4>
                      <p className="text-xs text-gray-600">€23-28M target for international expansion</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black text-white p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Financial Control</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Burn rate</span>
                        <span className="font-medium">€287K/month</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{width: '60%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Runway with current raise</span>
                        <span className="font-medium">22 months</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{width: '80%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Operational efficiency</span>
                        <span className="font-medium">84%</span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div className="bg-purple-500 h-1.5 rounded-full" style={{width: '84%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Use of Funds</h3>
                
                <div className="h-36 bg-gray-50 rounded-lg p-4 relative mb-4">
                  {/* Use of funds pie chart */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gray-300 overflow-hidden relative">
                      <div className="absolute top-0 left-0 right-0 bottom-0" style={{
                        background: 'conic-gradient(#8B5CF6 0% 48%, #3B82F6 48% 78%, #10B981 78% 92%, #A3A3A3 92% 100%)'
                      }}></div>
                    </div>
                  </div>
                  
                  <div className="absolute top-4 right-4 text-xs space-y-1">
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-purple-500 rounded-full mr-1"></div>
                      <span>Engineering: 48%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-blue-500 rounded-full mr-1"></div>
                      <span>Marketing & Sales: 30%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-green-500 rounded-full mr-1"></div>
                      <span>Operations: 14%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="h-2 w-2 bg-gray-500 rounded-full mr-1"></div>
                      <span>Working Capital: 8%</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      <ArrowRight size={14} className="text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Engineering & R&D (€2.6M)</h4>
                      <p className="text-xs text-gray-600">ML engineers, data scientists, AI development</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      <ArrowRight size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Marketing & Sales (€1.6M)</h4>
                      <p className="text-xs text-gray-600">User acquisition, partnerships, content marketing</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      <ArrowRight size={14} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Operations (€760K)</h4>
                      <p className="text-xs text-gray-600">Customer support, infrastructure, compliance</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                      <ArrowRight size={14} className="text-gray-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Working Capital (€445K)</h4>
                      <p className="text-xs text-gray-600">Buffer for unexpected expenses and opportunities</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Key Hiring Plan</h3>
                
                <div className="space-y-3">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Engineering (11 new hires)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        Sr. ML Engineers (3)
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Full-Stack Devs (4)
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Mobile Engineers (2)
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Data Engineers (2)
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Marketing & Growth (7 new hires)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        Head of Growth
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Content Marketers (2)
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Growth Marketers (2)
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Partnership Manager
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Operations (4 new hires)</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-white p-2 rounded text-xs">
                        Customer Success Lead
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Support Specialists (2)
                      </div>
                      <div className="bg-white p-2 rounded text-xs">
                        Finance Manager
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">Strategic Milestones</h3>
                
                <div className="space-y-3">
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Next 6 Months</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-white mr-2 flex-shrink-0"></div>
                        <span>Public beta launch with 1,000+ families</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-white mr-2 flex-shrink-0"></div>
                        <span>Enhanced Task Weight AI (v2.0) release</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-white mr-2 flex-shrink-0"></div>
                        <span>15% free-to-paid conversion rate</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">By Series A (Q3 2024)</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-white mr-2 flex-shrink-0"></div>
                        <span>12,000+ paying subscribers</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-white mr-2 flex-shrink-0"></div>
                        <span>Enterprise partnerships with 5+ companies</span>
                      </li>
                      <li className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-white mr-2 flex-shrink-0"></div>
                        <span>Clear path to unit profitability</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 bg-black p-6 rounded-lg text-white">
          <h3 className="text-xl font-medium mb-4 text-center">Financial Highlights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-purple-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <TrendingUp size={24} className="text-purple-300" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">€125.0M</p>
                <p className="text-sm text-blue-200">ARR by Year 5</p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-blue-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Users size={24} className="text-blue-300" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">428K</p>
                <p className="text-sm text-blue-200">Users by Year 5</p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-green-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Activity size={24} className="text-green-300" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">92%</p>
                <p className="text-sm text-blue-200">Gross Margin at Scale</p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg">
              <div className="h-12 w-12 bg-yellow-600 bg-opacity-30 rounded-full flex items-center justify-center mb-3 mx-auto">
                <PieChart size={24} className="text-yellow-300" />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">€540</p>
                <p className="text-sm text-blue-200">LTV by Year 3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialProjectionsSlide;