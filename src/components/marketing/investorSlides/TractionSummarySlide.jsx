import React from 'react';
import { Users, TrendingUp, Star, DollarSign, BarChart, Zap, Repeat } from 'lucide-react';

const TractionSummarySlide = () => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-0">
      
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Traction & Business Model</h2>
        
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Users size={24} className="text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-purple-700">3,420</h3>
              <p className="text-xs text-gray-600">Active Beta Users</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Repeat size={24} className="text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-blue-700">84%</h3>
              <p className="text-xs text-gray-600">Month 1 Retention</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <Star size={24} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-700">78</h3>
              <p className="text-xs text-gray-600">Net Promoter Score</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3 mx-auto">
                <TrendingUp size={24} className="text-yellow-600" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-700">410%</h3>
              <p className="text-xs text-gray-600">6-Month Growth</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Unit Economics</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <div className="h-5 w-5 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                        <DollarSign size={12} className="text-purple-600" />
                      </div>
                      <span className="text-sm font-medium">Average Revenue Per User</span>
                    </div>
                    <span className="text-sm font-bold">$9.99/mo</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-purple-500 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <div className="h-5 w-5 bg-green-100 rounded-full flex items-center justify-center mr-2">
                        <Zap size={12} className="text-green-600" />
                      </div>
                      <span className="text-sm font-medium">Customer Acquisition Cost</span>
                    </div>
                    <span className="text-sm font-bold">$0 (Organic)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-green-500 rounded-full" style={{ width: '5%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <div className="h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                        <Users size={12} className="text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">Lifetime Value (Projected)</span>
                    </div>
                    <span className="text-sm font-bold">$749</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Based on 6.3 year retention at $9.99/mo</p>
                </div>
                
                <div className="bg-black text-white p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">CAC:LTV Ratio</span>
                    <span className="text-sm font-bold text-green-400">149:1</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Incredible unit economics from organic growth</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Growth Levers</h3>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="h-6 w-6 bg-purple-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-bold text-purple-600">1</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Referral Program</p>
                    <p className="text-xs text-gray-600">18% organic referral rate can be amplified with incentives</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">B2B Channel</p>
                    <p className="text-xs text-gray-600">8 enterprise companies interested in employee wellness offering</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-bold text-green-600">3</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Professional Partnerships</p>
                    <p className="text-xs text-gray-600">Family therapist network with 14K members already recommending</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-6 w-6 bg-yellow-100 rounded-full flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                    <span className="text-xs font-bold text-yellow-600">4</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Content Marketing</p>
                    <p className="text-xs text-gray-600">Viral TikTok explains have reached 1.2M views organically</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-medium mb-3">Business Model</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                    <DollarSign size={16} className="text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium">Freemium SaaS</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      Basic mental load visibility for free, advanced features and AI for $9.99/month
                    </p>
                    <div className="flex space-x-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">92% paid conversion from beta</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                    <Users size={16} className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium">Enterprise Licensing</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      B2B channel for employee wellness programs at $7/user/month
                    </p>
                    <div className="flex space-x-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">3 Fortune 500 pilot discussions</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                    <BarChart size={16} className="text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium">API Platform</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      Task Weight API for developers and partners (future revenue stream)
                    </p>
                    <div className="flex space-x-2">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Launch Q3 2024</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-5 rounded-lg">
              <h3 className="text-lg font-medium mb-3">18-Month GTM Plan</h3>
              
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="ml-10 mb-4 relative">
                  <div className="absolute -left-10 top-1 h-6 w-6 rounded-full bg-purple-500 text-white flex items-center justify-center">
                    <span className="text-xs">Q2</span>
                  </div>
                  <h4 className="text-sm font-medium">Public Beta Launch</h4>
                  <p className="text-xs text-gray-600">14.6K waitlist to initial 10K paid subscribers</p>
                </div>
                
                <div className="ml-10 mb-4 relative">
                  <div className="absolute -left-10 top-1 h-6 w-6 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <span className="text-xs">Q3</span>
                  </div>
                  <h4 className="text-sm font-medium">Channel Development</h4>
                  <p className="text-xs text-gray-600">Professional partnerships and referral program</p>
                </div>
                
                <div className="ml-10 mb-4 relative">
                  <div className="absolute -left-10 top-1 h-6 w-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                    <span className="text-xs">Q4</span>
                  </div>
                  <h4 className="text-sm font-medium">Enterprise Pilot</h4>
                  <p className="text-xs text-gray-600">5 enterprise clients with 7,500 total users</p>
                </div>
                
                <div className="ml-10 mb-4 relative">
                  <div className="absolute -left-10 top-1 h-6 w-6 rounded-full bg-yellow-500 text-white flex items-center justify-center">
                    <span className="text-xs">Q1</span>
                  </div>
                  <h4 className="text-sm font-medium">International Expansion</h4>
                  <p className="text-xs text-gray-600">Expansion to UK, Canada, Australia markets</p>
                </div>
                
                <div className="ml-10 relative">
                  <div className="absolute -left-10 top-1 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                    <span className="text-xs">Q2</span>
                  </div>
                  <h4 className="text-sm font-medium">API Platform Launch</h4>
                  <p className="text-xs text-gray-600">Developer platform with initial partners</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-lg text-white">
          <h3 className="text-xl font-medium mb-4 text-center">Key Metrics Forecast</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
              <h4 className="font-medium mb-1">Users</h4>
              <div className="flex items-end justify-center">
                <div className="h-12 w-3 bg-white bg-opacity-20 rounded-t-sm mx-0.5"></div>
                <div className="h-20 w-3 bg-white bg-opacity-20 rounded-t-sm mx-0.5"></div>
                <div className="h-28 w-3 bg-white bg-opacity-20 rounded-t-sm mx-0.5"></div>
                <div className="h-36 w-3 bg-white bg-opacity-70 rounded-t-sm mx-0.5"></div>
              </div>
              <p className="mt-2 text-2xl font-bold">162K</p>
              <p className="text-xs text-blue-200">By end of year 2</p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
              <h4 className="font-medium mb-1">MRR</h4>
              <div className="flex items-end justify-center">
                <div className="h-12 w-3 bg-white bg-opacity-20 rounded-t-sm mx-0.5"></div>
                <div className="h-20 w-3 bg-white bg-opacity-20 rounded-t-sm mx-0.5"></div>
                <div className="h-28 w-3 bg-white bg-opacity-20 rounded-t-sm mx-0.5"></div>
                <div className="h-36 w-3 bg-white bg-opacity-70 rounded-t-sm mx-0.5"></div>
              </div>
              <p className="mt-2 text-2xl font-bold">$1.6M</p>
              <p className="text-xs text-blue-200">By end of year 2</p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
              <h4 className="font-medium mb-1">CAC</h4>
              <div className="flex items-end justify-center">
                <div className="h-8 w-3 bg-white bg-opacity-20 rounded-t-sm mx-0.5"></div>
                <div className="h-16 w-3 bg-white bg-opacity-20 rounded-t-sm mx-0.5"></div>
                <div className="h-24 w-3 bg-white bg-opacity-20 rounded-t-sm mx-0.5"></div>
                <div className="h-32 w-3 bg-white bg-opacity-70 rounded-t-sm mx-0.5"></div>
              </div>
              <p className="mt-2 text-2xl font-bold">$25</p>
              <p className="text-xs text-blue-200">By end of year 2</p>
            </div>
            
            <div className="bg-white bg-opacity-10 p-4 rounded-lg text-center">
              <h4 className="font-medium mb-1">CAC:LTV</h4>
              <div className="flex items-end justify-center">
                <div className="h-36 w-3 bg-white bg-opacity-20 rounded-t-sm mx-0.5"></div>
                <div className="h-28 w-3 bg-white bg-opacity-20 rounded-t-sm mx-0.5"></div>
                <div className="h-20 w-3 bg-white bg-opacity-20 rounded-t-sm mx-0.5"></div>
                <div className="h-12 w-3 bg-white bg-opacity-70 rounded-t-sm mx-0.5"></div>
              </div>
              <p className="mt-2 text-2xl font-bold">1:30</p>
              <p className="text-xs text-blue-200">By end of year 2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TractionSummarySlide;