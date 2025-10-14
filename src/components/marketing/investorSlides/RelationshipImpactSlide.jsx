import React from 'react';
import { Heart, AlertTriangle, ArrowUp, ArrowDown, Check } from 'lucide-react';

const RelationshipImpactSlide = () => {
  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Relationship Impact</h2>
        <h3 className="text-xl font-light text-gray-600 mb-8">How Mental Load Affects Partnerships</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border border-red-100">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                <h3 className="text-xl font-medium">The Relationship Toll</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-white/70 p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Resentment Growth</h4>
                    <div className="flex items-center text-red-600">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">83%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">
                    Primary caregivers report growing resentment when mental load is unacknowledged
                  </p>
                </div>
                
                <div className="bg-white/70 p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Conflict Frequency</h4>
                    <div className="flex items-center text-red-600">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">+68%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">
                    Increase in household disagreements in families with unbalanced mental load
                  </p>
                </div>
                
                <div className="bg-white/70 p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Intimacy</h4>
                    <div className="flex items-center text-red-600">
                      <ArrowDown className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">-41%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">
                    Decline in reported intimacy and connection when one partner feels overburdened
                  </p>
                </div>
                
                <div className="bg-white/70 p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Divorce Risk</h4>
                    <div className="flex items-center text-red-600">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">+38%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700">
                    Higher divorce rates when mental load is chronically imbalanced (Gottman Institute)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-xl font-medium mb-3">The Visibility Factor</h3>
              <p className="text-gray-700 mb-4">
                Research shows that simply making mental load visible can dramatically improve relationship dynamics:
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <div className="font-medium text-blue-600 text-lg">76%</div>
                  <p className="text-xs text-gray-600">Reduction in task-related conflicts</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <div className="font-medium text-blue-600 text-lg">42%</div>
                  <p className="text-xs text-gray-600">Increase in reported fairness</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <div className="font-medium text-blue-600 text-lg">53%</div>
                  <p className="text-xs text-gray-600">Improvement in communication</p>
                </div>
                
                <div className="bg-white p-3 rounded-lg shadow-sm text-center">
                  <div className="font-medium text-blue-600 text-lg">37%</div>
                  <p className="text-xs text-gray-600">Higher relationship satisfaction</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-xl border border-green-100">
              <div className="flex items-center mb-4">
                <Heart className="h-8 w-8 text-green-500 mr-3" />
                <h3 className="text-xl font-medium">The Allie Difference</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="rounded-full bg-white p-1 flex items-center justify-center mt-1 mr-3">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Neutral Visualization</h4>
                    <p className="text-sm text-gray-700">
                      Objective task tracking removes blame and creates shared understanding of workload.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="rounded-full bg-white p-1 flex items-center justify-center mt-1 mr-3">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Guided Conversations</h4>
                    <p className="text-sm text-gray-700">
                      AI-facilitated discussions help couples talk about mental load effectively and without defensiveness.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="rounded-full bg-white p-1 flex items-center justify-center mt-1 mr-3">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Preference Matching</h4>
                    <p className="text-sm text-gray-700">
                      Aligns task distribution with individual strengths and preferences, increasing satisfaction.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="rounded-full bg-white p-1 flex items-center justify-center mt-1 mr-3">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">Shared Knowledge System</h4>
                    <p className="text-sm text-gray-700">
                      Externalizes family knowledge so it's no longer carried by one person's memory.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-white/60 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">User Research Highlights</h4>
                <blockquote className="italic text-sm text-gray-700 border-l-4 border-green-300 pl-3">
                  "For the first time in 6 years, my husband actually understands what I've been saying about mental load. Just seeing it visualized changed everything."
                </blockquote>
                <p className="text-xs text-right mt-2 text-gray-500">— Emma T., beta user</p>
              </div>
            </div>
            
            <div className="bg-indigo-600 text-white p-6 rounded-xl">
              <h3 className="text-xl font-medium mb-4">Our Couple-Centered Approach</h3>
              <p className="mb-4">
                Allie's approach focuses on creating relationship harmony through balanced partnership:
              </p>
              
              <div className="space-y-3">
                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center mr-3">1</div>
                    <p className="text-sm">Visualization before redistribution</p>
                  </div>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center mr-3">2</div>
                    <p className="text-sm">Personalized suggestions based on each partner's preferences</p>
                  </div>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center mr-3">3</div>
                    <p className="text-sm">Regular relationship check-ins with actionable insights</p>
                  </div>
                </div>
                
                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center mr-3">4</div>
                    <p className="text-sm">Support through a shared task ecosystem, not just delegated lists</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-6 rounded-xl border border-indigo-200">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-center text-xl font-medium mb-4">Why This Matters for Business</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="text-lg font-medium text-purple-600 mb-1">2.7× Higher</div>
                <p className="text-sm text-gray-700">User retention when both partners engage</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="text-lg font-medium text-purple-600 mb-1">83%</div>
                <p className="text-sm text-gray-700">Of users cite relationship impact as main value</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="text-lg font-medium text-purple-600 mb-1">4.2×</div>
                <p className="text-sm text-gray-700">Higher willingness to pay vs. solo-user products</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationshipImpactSlide;