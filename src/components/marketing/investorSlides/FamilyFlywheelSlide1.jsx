import React, { useState } from 'react';
import { Calendar, Users, Heart, Shield, Layers, ArrowRight } from 'lucide-react';

const FamilyFlywheelSlide1 = () => {
  const [activeLayer, setActiveLayer] = useState(0);
  
  const layers = [
    {
      id: 1,
      title: "Load-Balance Coach",
      description: "80-Q assessment, weekly habits, fairness analytics",
      revenue: "$30-50/mo subscription",
      kpi: "Activation %, Weekly active parents",
      color: "purple",
      icon: <Shield size={24} className="text-purple-700" />
    },
    {
      id: 2,
      title: "Family Command Center",
      description: "Calendar, docs, health vault, interest tracker",
      revenue: "Retains sub, ↑ stickiness",
      kpi: "DAU / Docs stored",
      color: "blue",
      icon: <Calendar size={24} className="text-blue-700" />
    },
    {
      id: 3,
      title: "Proactive Concierge",
      description: "Allie books sitters, refills Rx, schedules date night",
      revenue: "Partner fees",
      kpi: "Tasks auto-executed per user",
      color: "green",
      icon: <Users size={24} className="text-green-700" />
    },
    {
      id: 4,
      title: "Personalized Commerce",
      description: "One-tap buy of age-/size-specific gear, services",
      revenue: "Affiliate + marketplace margin, private-label",
      kpi: "GMV / family",
      color: "amber",
      icon: <Heart size={24} className="text-amber-700" />
    }
  ];

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-2">Family Flywheel Model</h2>
        <h3 className="text-xl font-light text-gray-600 mb-6">Building concentric layers of trust with families over time</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left side: Concentric circles visualization */}
          <div className="relative">
            <h3 className="text-xl font-medium mb-4">Four Trust Layers</h3>
            <div className="relative h-[480px] w-full bg-gray-50 rounded-lg border border-gray-100">
              <div className="absolute inset-0">
                {/* Truly concentric circles with absolute positioning */}
                {/* Layer 4 - Outermost */}
                <div 
                  className={`absolute rounded-full border-4 cursor-pointer transition-all duration-300 ${
                    activeLayer === 3 ? 'border-amber-500 bg-amber-50' : 'border-amber-200'
                  }`}
                  style={{ width: '80%', height: '80%', top: '10%', left: '10%' }}
                  onClick={() => setActiveLayer(3)}
                />
                {/* Layer 3 */}
                <div 
                  className={`absolute rounded-full border-4 cursor-pointer transition-all duration-300 ${
                    activeLayer === 2 ? 'border-green-500 bg-green-50' : 'border-green-200'
                  }`}
                  style={{ width: '60%', height: '60%', top: '20%', left: '20%' }}
                  onClick={() => setActiveLayer(2)}
                />
                {/* Layer 2 */}
                <div 
                  className={`absolute rounded-full border-4 cursor-pointer transition-all duration-300 ${
                    activeLayer === 1 ? 'border-blue-500 bg-blue-50' : 'border-blue-200'
                  }`}
                  style={{ width: '40%', height: '40%', top: '30%', left: '30%' }}
                  onClick={() => setActiveLayer(1)}
                />
                {/* Layer 1 - Innermost */}
                <div 
                  className={`absolute rounded-full border-4 cursor-pointer transition-all duration-300 ${
                    activeLayer === 0 ? 'border-purple-500 bg-purple-50' : 'border-purple-200'
                  }`}
                  style={{ width: '20%', height: '20%', top: '40%', left: '40%' }}
                  onClick={() => setActiveLayer(0)}
                >
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm font-bold text-purple-800">Allie</div>
                      <div className="text-xs">Core</div>
                    </div>
                  </div>
                </div>
                
                {/* Layer labels with adjusted positioning */}
                <div className="absolute top-[10%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full shadow-sm border border-purple-200 font-medium text-sm text-purple-700 z-10">
                  1. Load-Balance Coach
                </div>
                <div className="absolute top-[30%] right-[10%] transform -translate-y-1/2 bg-white px-3 py-1 rounded-full shadow-sm border border-blue-200 font-medium text-sm text-blue-700 z-10">
                  2. Family Command Center
                </div>
                <div className="absolute bottom-[30%] right-[10%] transform translate-y-1/2 bg-white px-3 py-1 rounded-full shadow-sm border border-green-200 font-medium text-sm text-green-700 z-10">
                  3. Proactive Concierge
                </div>
                <div className="absolute bottom-[10%] left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-white px-3 py-1 rounded-full shadow-sm border border-amber-200 font-medium text-sm text-amber-700 z-10">
                  4. Personalized Commerce
                </div>
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-500 text-center italic">
              Click any layer to see details
            </div>
          </div>
          
          {/* Right side: Layer details */}
          <div>
            <h3 className="text-xl font-medium mb-4">Layer Details</h3>
            
            <div className={`p-6 border-l-4 rounded-r-lg transition-all duration-300 mb-4
              ${activeLayer === 0 ? 'border-l-purple-500 bg-purple-50' : 'border-l-gray-200 bg-white'}`}
            >
              <div className="flex items-center mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 
                  ${activeLayer === 0 ? 'bg-purple-100' : 'bg-gray-100'}`}
                >
                  <Shield size={18} className={activeLayer === 0 ? 'text-purple-700' : 'text-gray-500'} />
                </div>
                <div className="font-medium text-lg">1. Load-Balance Coach</div>
              </div>
              
              <div className="ml-11 space-y-2">
                <div className="flex items-center text-sm">
                  <span className="w-24 font-medium">Core UX:</span>
                  <span>80-Q assessment, weekly habits, fairness analytics</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 font-medium">Revenue:</span>
                  <span className="text-purple-700 font-medium">$30-50/mo subscription</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 font-medium">KPI:</span>
                  <span>Activation %, Weekly active parents</span>
                </div>
                
                {activeLayer === 0 && (
                  <div className="bg-white p-3 rounded-lg border border-purple-100 mt-2 text-sm">
                    <p>The foundation of the Allie experience. We help families discover, track, and balance their mental load through AI-powered assessment, weekly habit building, and relationship coaching.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`p-6 border-l-4 rounded-r-lg transition-all duration-300 mb-4
              ${activeLayer === 1 ? 'border-l-blue-500 bg-blue-50' : 'border-l-gray-200 bg-white'}`}
            >
              <div className="flex items-center mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 
                  ${activeLayer === 1 ? 'bg-blue-100' : 'bg-gray-100'}`}
                >
                  <Calendar size={18} className={activeLayer === 1 ? 'text-blue-700' : 'text-gray-500'} />
                </div>
                <div className="font-medium text-lg">2. Family Command Center</div>
              </div>
              
              <div className="ml-11 space-y-2">
                <div className="flex items-center text-sm">
                  <span className="w-24 font-medium">Core UX:</span>
                  <span>Calendar, docs, health vault, interest tracker</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 font-medium">Revenue:</span>
                  <span className="text-blue-700 font-medium">Retains subscription, ↑ stickiness</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 font-medium">KPI:</span>
                  <span>DAU / Documents stored</span>
                </div>
                
                {activeLayer === 1 && (
                  <div className="bg-white p-3 rounded-lg border border-blue-100 mt-2 text-sm">
                    <p>As families trust Allie with their mental load, they naturally centralize their family data in our system. Allie becomes the single source of truth for schedules, documents, and family information.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`p-6 border-l-4 rounded-r-lg transition-all duration-300 mb-4
              ${activeLayer === 2 ? 'border-l-green-500 bg-green-50' : 'border-l-gray-200 bg-white'}`}
            >
              <div className="flex items-center mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 
                  ${activeLayer === 2 ? 'bg-green-100' : 'bg-gray-100'}`}
                >
                  <Users size={18} className={activeLayer === 2 ? 'text-green-700' : 'text-gray-500'} />
                </div>
                <div className="font-medium text-lg">3. Proactive Concierge</div>
              </div>
              
              <div className="ml-11 space-y-2">
                <div className="flex items-center text-sm">
                  <span className="w-24 font-medium">Core UX:</span>
                  <span>Allie books sitters, refills Rx, schedules date night</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 font-medium">Revenue:</span>
                  <span className="text-green-700 font-medium">Partner fees</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 font-medium">KPI:</span>
                  <span>Tasks auto-executed per user</span>
                </div>
                
                {activeLayer === 2 && (
                  <div className="bg-white p-3 rounded-lg border border-green-100 mt-2 text-sm">
                    <p>With established trust and a comprehensive understanding of the family's needs, Allie starts taking action on behalf of parents. This reduces mental load even further by automating the execution of tasks.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className={`p-6 border-l-4 rounded-r-lg transition-all duration-300 mb-4
              ${activeLayer === 3 ? 'border-l-amber-500 bg-amber-50' : 'border-l-gray-200 bg-white'}`}
            >
              <div className="flex items-center mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 
                  ${activeLayer === 3 ? 'bg-amber-100' : 'bg-gray-100'}`}
                >
                  <Heart size={18} className={activeLayer === 3 ? 'text-amber-700' : 'text-gray-500'} />
                </div>
                <div className="font-medium text-lg">4. Personalized Commerce</div>
              </div>
              
              <div className="ml-11 space-y-2">
                <div className="flex items-center text-sm">
                  <span className="w-24 font-medium">Core UX:</span>
                  <span>One-tap buy of age-/size-specific gear, services</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 font-medium">Revenue:</span>
                  <span className="text-amber-700 font-medium">Affiliate + marketplace margin</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-24 font-medium">KPI:</span>
                  <span>GMV / family</span>
                </div>
                
                {activeLayer === 3 && (
                  <div className="bg-white p-3 rounded-lg border border-amber-100 mt-2 text-sm">
                    <p>At the outermost layer, Allie leverages its deep understanding of the family to offer perfectly timed, relevant product recommendations. This feels like a natural extension of Allie's helpful role, not intrusive selling.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-purple-100 p-4 rounded-lg text-center">
              <div className="font-medium mb-1">Flywheel Effect</div>
              <div className="text-lg font-bold">Each extra service multiplies total usage</div>
              <div className="text-sm">3 services → <span className="text-purple-700 font-bold">7×</span> engagement</div>
            </div>
          </div>
        </div>
        
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
            Next: Family Data Graph <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FamilyFlywheelSlide1;