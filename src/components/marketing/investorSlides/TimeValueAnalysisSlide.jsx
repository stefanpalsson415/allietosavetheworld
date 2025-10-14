import React, { useState } from 'react';
import { Clock, DollarSign, Sparkles, BarChart } from 'lucide-react';

const TimeValueAnalysisSlide = () => {
  const [activeMetric, setActiveMetric] = useState('time');

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Time Value Analysis</h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium mb-4 flex items-center">
              <Clock size={24} className="text-purple-600 mr-2" />
              The Cost of Mental Load
            </h3>
            
            <p className="mb-4">
              Mental load doesn't just represent a relationship imbalance - it has significant economic and quality-of-life costs for families.
            </p>
            
            <div className="flex space-x-2 mb-6">
              <button 
                className={`px-4 py-2 rounded-lg ${activeMetric === 'time' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setActiveMetric('time')}
              >
                Time Cost
              </button>
              <button 
                className={`px-4 py-2 rounded-lg ${activeMetric === 'money' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setActiveMetric('money')}
              >
                Financial Impact
              </button>
              <button 
                className={`px-4 py-2 rounded-lg ${activeMetric === 'wellness' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                onClick={() => setActiveMetric('wellness')}
              >
                Well-being
              </button>
            </div>
            
            {activeMetric === 'time' && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-2">Time Burden Analysis</h4>
                <p className="text-sm text-purple-800 mb-4">
                  The average primary caregiver spends 15-20 hours per week on mental load tasks that could be automated, delegated, or eliminated.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xl font-bold text-purple-700">23.4 hrs</div>
                    <p className="text-xs text-gray-600">Weekly mental load</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xl font-bold text-purple-700">1,217 hrs</div>
                    <p className="text-xs text-gray-600">Annual burden</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xl font-bold text-green-600">67%</div>
                    <p className="text-xs text-gray-600">Reducible with Allie</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeMetric === 'money' && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Financial Impact</h4>
                <p className="text-sm text-green-800 mb-4">
                  Mental load translates to significant economic costs through career impacts, outsourcing, and inefficient resource allocation.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xl font-bold text-green-700">$12,180</div>
                    <p className="text-xs text-gray-600">Annual value</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xl font-bold text-green-700">$4,740</div>
                    <p className="text-xs text-gray-600">Career cost</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xl font-bold text-green-700">8.7×</div>
                    <p className="text-xs text-gray-600">ROI with Allie</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeMetric === 'wellness' && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-2">Well-being Impact</h4>
                <p className="text-sm text-blue-800 mb-4">
                  Mental load significantly impacts health, stress levels, and overall life satisfaction for primary caregivers.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xl font-bold text-blue-700">68%</div>
                    <p className="text-xs text-gray-600">Report burnout</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xl font-bold text-blue-700">42%</div>
                    <p className="text-xs text-gray-600">Sleep disruption</p>
                  </div>
                  <div className="bg-white p-3 rounded shadow-sm">
                    <div className="text-xl font-bold text-blue-700">76%</div>
                    <p className="text-xs text-gray-600">Wellness boost</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="space-y-5">
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-3 flex items-center">
                <DollarSign size={22} className="text-purple-600 mr-2" />
                Time Value Proposition
              </h3>
              
              <div className="bg-gray-50 p-4 rounded mb-4">
                <div className="flex items-start mb-3">
                  <div className="flex-shrink-0 h-10 w-10 bg-black rounded-full flex items-center justify-center text-white">
                    <span className="font-bold">1</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium">Measured in Minutes</h4>
                    <p className="text-sm text-gray-600">Allie tracks and reduces time spent on mental load by 38% within 3 months</p>
                  </div>
                </div>
                
                <div className="flex items-start mb-3">
                  <div className="flex-shrink-0 h-10 w-10 bg-black rounded-full flex items-center justify-center text-white">
                    <span className="font-bold">2</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium">Calculated in Cash</h4>
                    <p className="text-sm text-gray-600">Average family saves $4,320/year by eliminating redundant tasks</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 bg-black rounded-full flex items-center justify-center text-white">
                    <span className="font-bold">3</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium">Quantified in Quality</h4>
                    <p className="text-sm text-gray-600">Users report 42% more time for high-value family activities</p>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-gray-700">
                `Allie turned my lost time into found money. I was able to take on a freelance project with the hours I saved.` — Beta User
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Sparkles size={20} className="text-purple-600 mr-2" />
                Impact Metrics
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Primary caregiver time saved</span>
                    <span className="text-sm font-medium text-green-600">12.4 hrs/week</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{width: '76%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Family financial benefit</span>
                    <span className="text-sm font-medium text-blue-600">$8,640/year</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{width: '68%'}}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Career advancement opportunity</span>
                    <span className="text-sm font-medium text-purple-600">+24%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className="bg-purple-500 h-2.5 rounded-full" style={{width: '24%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <Clock size={24} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Time Recovery</h3>
            <p className="text-gray-700 text-sm mb-3">
              Allie automatically identifies time sinks and redundant processes, creating intelligent automation that gives families back 10+ hours weekly.
            </p>
            <div className="text-sm font-medium text-purple-600 flex items-center">
              <BarChart size={16} className="mr-1" />
              <span>Average 520 hours/year saved</span>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <DollarSign size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Economic Value</h3>
            <p className="text-gray-700 text-sm mb-3">
              Converts invisible labor into tangible economic value through reduced outsourcing costs, increased earning potential, and resource optimization.
            </p>
            <div className="text-sm font-medium text-green-600 flex items-center">
              <BarChart size={16} className="mr-1" />
              <span>8.7× ROI on subscription</span>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-lg shadow-sm">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">Quality Impact</h3>
            <p className="text-gray-700 text-sm mb-3">
              Beyond time and money, Allie transforms how families spend their time together, shifting from logistics to quality connection activities.
            </p>
            <div className="text-sm font-medium text-blue-600 flex items-center">
              <BarChart size={16} className="mr-1" />
              <span>57% more quality time together</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-lg text-white">
          <h3 className="text-xl font-medium mb-4">The Allie Advantage: Value Proposition</h3>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium mb-2">Time Value Calculation</h4>
              <p className="text-sm text-blue-100 mb-4">
                Our proprietary Time Value Analysis demonstrates how a small monthly investment in Allie yields exponential returns in time, money, and family well-being.
              </p>
              
              <div className="bg-black bg-opacity-20 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Monthly subscription</span>
                  <span className="font-medium">$9.99</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Monthly time saved</span>
                  <span className="font-medium">43.2 hours</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm">Value per hour</span>
                  <span className="font-medium">$34.25</span>
                </div>
                <div className="border-t border-white border-opacity-20 mt-2 pt-2 flex justify-between items-center font-medium">
                  <span>Monthly ROI</span>
                  <span>$1,479.60</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Value Beyond Numbers</h4>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-white bg-opacity-20 flex-shrink-0 flex items-center justify-center mr-2 mt-0.5">
                    <Check size={14} className="text-white" />
                  </div>
                  <p className="text-sm">87% report feeling "more in control of their life" after 2 months</p>
                </div>
                <div className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-white bg-opacity-20 flex-shrink-0 flex items-center justify-center mr-2 mt-0.5">
                    <Check size={14} className="text-white" />
                  </div>
                  <p className="text-sm">72% of users report "significant career advancement opportunities" from reclaimed time</p>
                </div>
                <div className="flex items-start">
                  <div className="h-6 w-6 rounded-full bg-white bg-opacity-20 flex-shrink-0 flex items-center justify-center mr-2 mt-0.5">
                    <Check size={14} className="text-white" />
                  </div>
                  <p className="text-sm">93% would recommend Allie to friends specifically for its time value proposition</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <p className="font-light text-lg mb-3">
              `Time is the most precious currency in modern family life. Allie gives it back by the bucketload.`
            </p>
            <p className="text-sm text-blue-200">— Dr. Rachel Chen, Family Psychology Expert</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Check = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default TimeValueAnalysisSlide;