import React from 'react';
import { Brain, Cloud, Target, Clock, Search, Heart } from 'lucide-react';

const InvisibleCrisisSlide = () => {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-4">The Invisible Crisis</h2>
        <h3 className="text-xl font-light text-gray-600 mb-10">Why mental load creates persistent stress for families</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="flex flex-col">
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-xl shadow-sm flex-grow">
              <div className="rounded-full bg-purple-100 p-3 w-12 h-12 flex items-center justify-center mb-4">
                <Brain className="text-purple-600 h-6 w-6" />
              </div>
              
              <h3 className="text-xl font-medium mb-3">Cognitive Burden</h3>
              <p className="text-gray-700 mb-4">
                Mental load occupies constant background processing power in the brain, creating:
              </p>
              
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <div className="rounded-full bg-purple-200 p-1 mr-2 mt-1 flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-purple-700 rounded-full"></div>
                  </div>
                  <span className="text-sm">Decreased focus (41% reduction)</span>
                </li>
                <li className="flex items-start">
                  <div className="rounded-full bg-purple-200 p-1 mr-2 mt-1 flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-purple-700 rounded-full"></div>
                  </div>
                  <span className="text-sm">Increased decision fatigue</span>
                </li>
                <li className="flex items-start">
                  <div className="rounded-full bg-purple-200 p-1 mr-2 mt-1 flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-purple-700 rounded-full"></div>
                  </div>
                  <span className="text-sm">Memory overload (73% of parents)</span>
                </li>
              </ul>
              
              <div className="mt-6 bg-white rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600 mb-1">67%</div>
                <p className="text-xs text-gray-600">
                  of parents report regular "mental bandwidth overflow" (Pew Research)
                </p>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-lg shadow-sm mt-6">
              <div className="flex items-center mb-2">
                <Cloud className="text-blue-500 mr-2 h-5 w-5" />
                <h4 className="font-medium">The Fog Effect</h4>
              </div>
              <p className="text-sm text-gray-700">
                Parents describe mental load as a persistent "fog" that makes other activities harder and less enjoyable.
              </p>
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
              <h3 className="text-xl font-medium mb-3">Dimensions of Mental Load</h3>
              <p className="text-gray-700 mb-4">
                Mental load consists of multiple cognitive tasks happening simultaneously:
              </p>
              
              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Target className="text-red-500 mr-2 h-5 w-5" />
                    <h4 className="font-medium text-sm">Planning</h4>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Anticipating needs across domains (school, activities, health, home)
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="text-amber-500 mr-2 h-5 w-5" />
                    <h4 className="font-medium text-sm">Monitoring</h4>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Tracking deadlines, appointments, developmental milestones
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Search className="text-blue-500 mr-2 h-5 w-5" />
                    <h4 className="font-medium text-sm">Information Management</h4>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Researching options, comparing alternatives, making decisions
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Heart className="text-pink-500 mr-2 h-5 w-5" />
                    <h4 className="font-medium text-sm">Emotional Labor</h4>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Maintaining family harmony, managing social obligations
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl shadow-sm border border-amber-200 flex-grow">
              <h3 className="text-lg font-medium mb-3">The Invisibility Paradox</h3>
              <p className="text-gray-700 mb-4">
                Mental load is most successful when invisible – when everything runs smoothly, its value goes unrecognized.
              </p>
              
              <div className="bg-white/70 p-4 rounded-lg">
                <blockquote className="italic text-gray-700 text-sm border-l-3 border-amber-400 pl-3">
                  "It's only when I stop doing it that anyone notices everything I've been keeping track of."
                </blockquote>
                <p className="text-right text-xs text-gray-500 mt-2">— Research participant</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="bg-gradient-to-br from-teal-50 to-green-50 p-6 rounded-xl shadow-sm border border-teal-100 flex-grow">
              <h3 className="text-xl font-medium mb-3">The AI Opportunity</h3>
              <p className="text-gray-700 mb-4">
                Allie is uniquely positioned to address mental load through:
              </p>
              
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg flex items-start">
                  <div className="bg-teal-100 rounded-lg p-2 mr-3 flex-shrink-0">
                    <span className="text-teal-700 font-medium">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">External cognitive storage</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Moving mental burden from human memory to AI system
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg flex items-start">
                  <div className="bg-teal-100 rounded-lg p-2 mr-3 flex-shrink-0">
                    <span className="text-teal-700 font-medium">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Anticipatory intelligence</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Predicting needs before family members have to think of them
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg flex items-start">
                  <div className="bg-teal-100 rounded-lg p-2 mr-3 flex-shrink-0">
                    <span className="text-teal-700 font-medium">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Task context retention</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Maintaining continuous awareness of family state without human effort
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-3 rounded-lg flex items-start">
                  <div className="bg-teal-100 rounded-lg p-2 mr-3 flex-shrink-0">
                    <span className="text-teal-700 font-medium">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Pattern recognition</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Identifying hidden correlations that increase family efficiency
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-600 text-white p-5 rounded-xl shadow-sm mt-6">
              <h3 className="text-lg font-medium mb-3">Market Validation</h3>
              <div className="flex justify-around text-center">
                <div>
                  <div className="text-2xl font-bold">88%</div>
                  <p className="text-xs opacity-80">Would pay for mental <br />load reduction</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">$37</div>
                  <p className="text-xs opacity-80">Average monthly<br />willingness to pay</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">4.2x</div>
                  <p className="text-xs opacity-80">Retention vs.<br />task-only apps</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-center text-xl font-medium mb-6">The Value Proposition</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm text-center min-w-[200px]">
                <div className="inline-flex items-center justify-center rounded-full bg-purple-100 p-3 mb-3">
                  <Brain className="text-purple-600 h-5 w-5" />
                </div>
                <div className="font-medium mb-1">Reduced Cognitive Load</div>
                <p className="text-xs text-gray-600">Frees up mental bandwidth for more meaningful activities</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center min-w-[200px]">
                <div className="inline-flex items-center justify-center rounded-full bg-blue-100 p-3 mb-3">
                  <Heart className="text-blue-600 h-5 w-5" />
                </div>
                <div className="font-medium mb-1">Relationship Harmony</div>
                <p className="text-xs text-gray-600">Measurably reduces conflict about household responsibilities</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center min-w-[200px]">
                <div className="inline-flex items-center justify-center rounded-full bg-amber-100 p-3 mb-3">
                  <Clock className="text-amber-600 h-5 w-5" />
                </div>
                <div className="font-medium mb-1">Time Reclaimed</div>
                <p className="text-xs text-gray-600">Average 7-10 hours of mental bandwidth recovered weekly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvisibleCrisisSlide;