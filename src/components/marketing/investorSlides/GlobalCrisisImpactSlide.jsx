import React from 'react';
import { Globe, Clock, TrendingUp, AlertTriangle, Heart, Check } from 'lucide-react';

const GlobalCrisisImpactSlide = () => {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Global Family Crisis</h2>
        <h3 className="text-xl font-light text-gray-600 mb-10">The mental load challenge crosses borders and cultures</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-indigo-100">
            <Globe className="h-10 w-10 text-indigo-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-3">Universal Challenge</h3>
            <p className="text-gray-700 mb-4">
              Mental load impacts families across cultures, though distribution patterns and manifestations vary by region.
            </p>
            <div className="mt-auto pt-4 border-t border-indigo-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">North America</span>
                <span className="font-medium">67%</span>
              </div>
              <div className="w-full bg-indigo-100 h-2 rounded-full mt-1 mb-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{width: '67%'}}></div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Europe</span>
                <span className="font-medium">71%</span>
              </div>
              <div className="w-full bg-indigo-100 h-2 rounded-full mt-1 mb-2">
                <div className="bg-indigo-500 h-2 rounded-full" style={{width: '71%'}}></div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Asia Pacific</span>
                <span className="font-medium">63%</span>
              </div>
              <div className="w-full bg-indigo-100 h-2 rounded-full mt-1">
                <div className="bg-indigo-500 h-2 rounded-full" style={{width: '63%'}}></div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 shadow-sm border border-blue-100">
            <Clock className="h-10 w-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-3">Global Time Deficit</h3>
            <p className="text-gray-700 mb-4">
              Working parents worldwide report similar time deficits, with mothers experiencing the most severe impact.
            </p>
            <div className="bg-white p-4 rounded-lg mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Weekly time deficit</span>
                <span className="text-sm text-blue-600">12-30 hrs</span>
              </div>
              <div className="text-xs text-gray-500">
                Hours parents spend on administrative family tasks
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Cognitive burden</span>
                <span className="text-sm text-blue-600">3.4× higher</span>
              </div>
              <div className="text-xs text-gray-500">
                For primary caregivers vs. secondary caregivers
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 shadow-sm border border-red-100">
            <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-xl font-medium text-gray-800 mb-3">Economic Impact</h3>
            <p className="text-gray-700 mb-4">
              The mental load crisis has measurable economic consequences for families and organizations.
            </p>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-red-100 rounded-full p-2 flex-shrink-0 mr-3">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">$23.5B</p>
                  <p className="text-xs text-gray-500">Lost productivity annually (US)</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-red-100 rounded-full p-2 flex-shrink-0 mr-3">
                  <Clock className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">9.4 hours/week</p>
                  <p className="text-xs text-gray-500">Average work time affected by family logistics</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-red-100 rounded-full p-2 flex-shrink-0 mr-3">
                  <Heart className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">38% divorce risk</p>
                  <p className="text-xs text-gray-500">Increase when mental load is severely imbalanced</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-medium mb-4">Cultural Variations</h3>
            <div className="space-y-4">
              <div className="border-l-4 border-purple-400 pl-4">
                <h4 className="font-medium text-gray-900">Nordics</h4>
                <p className="text-sm text-gray-600">More egalitarian distribution, but still 62% falls on one parent</p>
              </div>
              
              <div className="border-l-4 border-blue-400 pl-4">
                <h4 className="font-medium text-gray-900">Southern Europe</h4>
                <p className="text-sm text-gray-600">Strong gender imbalance (84%), with extended family support decreasing</p>
              </div>
              
              <div className="border-l-4 border-green-400 pl-4">
                <h4 className="font-medium text-gray-900">Asia</h4>
                <p className="text-sm text-gray-600">Rapid transition as traditional systems meet modern work demands</p>
              </div>
              
              <div className="border-l-4 border-amber-400 pl-4">
                <h4 className="font-medium text-gray-900">North America</h4>
                <p className="text-sm text-gray-600">High tech adoption, 78% seeking digital solutions to mental load</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-b from-purple-600 to-indigo-700 text-white rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-medium mb-4">Global Opportunity</h3>
            <p className="mb-6">
              The universal nature of this challenge creates a global market opportunity with local adaptations.
            </p>
            
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-5 mt-4">
              <h4 className="font-medium text-white mb-3">Key Market Insights</h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="rounded-full bg-white/30 p-1 mr-2 mt-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-sm">Mental load is a universal pain point with consistent willingness to pay</p>
                </li>
                
                <li className="flex items-start">
                  <div className="rounded-full bg-white/30 p-1 mr-2 mt-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-sm">Core solution translates across cultures with regional customizations</p>
                </li>
                
                <li className="flex items-start">
                  <div className="rounded-full bg-white/30 p-1 mr-2 mt-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-sm">Pricing consistency across regions ($30-50/mo equivalent)</p>
                </li>
                
                <li className="flex items-start">
                  <div className="rounded-full bg-white/30 p-1 mr-2 mt-0.5">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-sm">Global expansion timeline: US → Western Europe → Asia Pacific</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-xl font-medium mb-3">Conclusion</h3>
          <p className="text-gray-700">
            The mental load crisis is a global phenomenon with consistent manifestations across cultures. Allie's solution addresses a universal need with appropriate cultural adaptations, allowing for efficient global scaling.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GlobalCrisisImpactSlide;