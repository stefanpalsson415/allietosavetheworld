import React from 'react';
import { DollarSign, TrendingUp, Users, Clock } from 'lucide-react';

const BusinessCaseValidationSlide = () => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-2">Market Validation</h2>
        <h3 className="text-xl font-light text-gray-600 mb-8">Parents Will Pay $30-50/month for Comprehensive Family Support</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left column: Validation pillars */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg mb-2">Key Evidence Points</h4>
            
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-l-red-500">
              <div className="flex items-start">
                <div className="rounded-full p-2 bg-gray-50 mr-3">
                  <Clock size={20} className="text-red-500" />
                </div>
                <div>
                  <h5 className="font-medium">Mental Load Crisis</h5>
                  <div className="text-lg font-semibold">63% of parents feel daily overload</div>
                  <div className="text-sm text-gray-500">30 hrs/week "second job"</div>
                  <p className="text-sm mt-1">Parents are already looking for solutions to this invisible labor</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-l-green-500">
              <div className="flex items-start">
                <div className="rounded-full p-2 bg-gray-50 mr-3">
                  <DollarSign size={20} className="text-green-500" />
                </div>
                <div>
                  <h5 className="font-medium">Proven WTP</h5>
                  <div className="text-lg font-semibold">60k members @ $23-28/mo</div>
                  <div className="text-sm text-gray-500">Good Inside (Dr. Becky)</div>
                  <p className="text-sm mt-1">Parents already pay for just content; Allie adds execution</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-l-blue-500">
              <div className="flex items-start">
                <div className="rounded-full p-2 bg-gray-50 mr-3">
                  <TrendingUp size={20} className="text-blue-500" />
                </div>
                <div>
                  <h5 className="font-medium">High Retention</h5>
                  <div className="text-lg font-semibold">Multi-year stickiness</div>
                  <div className="text-sm text-gray-500">Once embedded in family routine</div>
                  <p className="text-sm mt-1">Similar apps (Cozi, Maple) report long-term usage patterns</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4 border-l-4 border-l-purple-500">
              <div className="flex items-start">
                <div className="rounded-full p-2 bg-gray-50 mr-3">
                  <Users size={20} className="text-purple-500" />
                </div>
                <div>
                  <h5 className="font-medium">Cost of Alternatives</h5>
                  <div className="text-lg font-semibold">$800-1k/mo nanny share</div>
                  <div className="text-sm text-gray-500">$150/hr couples therapy</div>
                  <p className="text-sm mt-1">$40/mo subscription looks cheap vs. real-world substitutes</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column: Data visualization */}
          <div className="space-y-6">
            {/* Pricing comparison chart */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="font-medium text-lg mb-4">Price-Value Comparison</h4>
              
              <div className="space-y-3">
                <div className="relative">
                  <div className="flex justify-between mb-1 items-center">
                    <span className="text-sm">Good Inside (Parent Coaching)</span>
                    <span className="font-medium">$25</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="h-3 rounded-full bg-gray-400" style={{ width: "12.5%" }}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Content only</div>
                </div>
                
                <div className="relative">
                  <div className="flex justify-between mb-1 items-center">
                    <span className="text-sm">Weekly Therapy Session</span>
                    <span className="font-medium">$150</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="h-3 rounded-full bg-gray-400" style={{ width: "75%" }}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Single hour</div>
                </div>
                
                <div className="relative">
                  <div className="flex justify-between mb-1 items-center">
                    <span className="text-sm">Nanny (1 day/week)</span>
                    <span className="font-medium">$200</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="h-3 rounded-full bg-gray-400" style={{ width: "100%" }}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Limited relief</div>
                </div>
                
                <div className="relative">
                  <div className="flex justify-between mb-1 items-center">
                    <span className="text-sm">Allie ($40/mo)</span>
                    <span className="font-medium">$40</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="h-3 rounded-full bg-purple-500" style={{ width: "20%" }}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Full family support</div>
                </div>
              </div>
            </div>
            
            {/* Key quotes/stats */}
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <h4 className="font-medium text-lg mb-3">Critical Market Insights</h4>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="text-2xl font-bold text-purple-500 mr-3">71%</div>
                  <p className="text-sm">Of mental load falls on mothers in most households, leading to burnout and relationship strain</p>
                </div>
                
                <div className="flex items-start">
                  <div className="text-2xl font-bold text-purple-500 mr-3">79%</div>
                  <p className="text-sm">Of parents experience anxiety about scheduling family tasks and managing logistics</p>
                </div>
                
                <div className="flex items-start">
                  <div className="text-2xl font-bold text-purple-500 mr-3">$60k</div>
                  <p className="text-sm">Estimated annual value of the "invisible labor" parents perform; Allie at $480/year represents less than 1% of that value</p>
                </div>
              </div>
            </div>
            
            {/* European market validation */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium mb-2">Global Appeal</h4>
              <p className="text-sm">
                "La charge mentale" (mental load) concept has topped bestseller lists in Europe. Our pricing research shows similar willingness to pay across both US and European markets, enabling global expansion with consistent pricing.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-3">Market Conclusion</h3>
          <p className="text-lg">
            The market is primed for Allie's solution. With parents already spending similar amounts on partial solutions, Allie's comprehensive approach justifies pricing at the upper end of the $30-50/month range.
          </p>
        </div>
        
        {/* Navigation buttons */}
        <div className="mt-6 flex justify-between">
          <button 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center"
            onClick={() => window.history.back()}
          >
            ← Previous Slide
          </button>
          <button 
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            onClick={() => window.location.href = '#'} 
          >
            Next Slide →
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessCaseValidationSlide;