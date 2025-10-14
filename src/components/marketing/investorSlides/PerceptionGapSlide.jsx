import React from 'react';
import { EyeOff, Scale, AlertTriangle, Lightbulb } from 'lucide-react';

const PerceptionGapSlide = () => {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-4">The Perception Gap</h2>
        <h3 className="text-xl font-light text-gray-600 mb-10">Why mental load remains invisible and hard to solve</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="rounded-full bg-amber-100 p-3 mr-4 flex-shrink-0">
                <EyeOff className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">The Visibility Problem</h3>
                <p className="text-gray-700">
                  Mental load consists of invisible cognitive labor that's rarely seen or measured by others. 
                  This "underground work" includes remembering, planning, coordinating, and anticipating family needs.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-indigo-100 p-3 mr-4 flex-shrink-0">
                <Scale className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">The Recognition Disparity</h3>
                <p className="text-gray-700">
                  Our research found a significant gap in how partners perceive mental load distribution:
                </p>
                <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">Primary caregiver estimate</span>
                    <span className="text-sm text-indigo-700">87%</span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{width: '87%'}}></div>
                  </div>
                  <div className="flex items-center justify-between mb-1 mt-3">
                    <span className="text-sm font-medium">Partner's perception</span>
                    <span className="text-sm text-indigo-700">43%</span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{width: '43%'}}></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Percentage of mental load partners believe is carried by the primary caregiver
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="rounded-full bg-red-100 p-3 mr-4 flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">The Communication Barrier</h3>
                <p className="text-gray-700">
                  Three key communication challenges prevent couples from solving the mental load imbalance:
                </p>
                <div className="mt-4 space-y-3">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="font-medium text-gray-800">Lack of shared language</p>
                    <p className="text-sm text-gray-600">
                      72% of couples lack vocabulary to discuss cognitive labor
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="font-medium text-gray-800">Reactive discussions</p>
                    <p className="text-sm text-gray-600">
                      81% only discuss mental load during conflicts
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="font-medium text-gray-800">Unclear expectations</p>
                    <p className="text-sm text-gray-600">
                      67% never explicitly discussed task ownership
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="rounded-full bg-green-100 p-3 mr-4 flex-shrink-0">
                <Lightbulb className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">The Awareness Solution</h3>
                <p className="text-gray-700">
                  Allie's approach creates visibility and shared understanding:
                </p>
                <ul className="mt-3 space-y-2">
                  <li className="flex items-start">
                    <div className="text-green-500 font-bold mr-2">•</div>
                    <p className="text-sm text-gray-700">
                      Quantifies invisible work through task tracking
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="text-green-500 font-bold mr-2">•</div>
                    <p className="text-sm text-gray-700">
                      Visualizes mental load distribution between partners
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="text-green-500 font-bold mr-2">•</div>
                    <p className="text-sm text-gray-700">
                      Creates shared family knowledge system that outlasts individual memory
                    </p>
                  </li>
                  <li className="flex items-start">
                    <div className="text-green-500 font-bold mr-2">•</div>
                    <p className="text-sm text-gray-700">
                      Facilitates neutral, data-driven conversations about workload
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-xl">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-xl font-medium mb-4">Why This Gap Creates Market Opportunity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">Urgent Need</h4>
                <p className="text-sm text-white/90">
                  Families recognize imbalance exists, but can't solve it without visibility tools
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">Difficult DIY Solution</h4>
                <p className="text-sm text-white/90">
                  Requires neutral 3rd party system that quantifies qualitative work
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <h4 className="font-medium text-white mb-2">Measurable Value</h4>
                <p className="text-sm text-white/90">
                  Recognition alone creates a 37% improvement in relationship satisfaction
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerceptionGapSlide;