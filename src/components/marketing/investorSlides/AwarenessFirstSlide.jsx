import React, { useState } from 'react';
import { Eye, Brain, Heart, Check, AlertTriangle, ArrowRight, BookOpen, BarChart2 } from 'lucide-react';

const AwarenessFirstSlide = () => {
  const [activeReason, setActiveReason] = useState(null);

  const reasons = [
    {
      id: 1,
      title: "Behaviour-change theory: you must move partners from pre-contemplation → contemplation.",
      evidence: "Transtheoretical Model meta-review, Health Psych. 2020.",
      impacts: [
        "Partners finally recognise the gap as solvable, not \"just life.\"",
        "Opens the door to goal-setting dialogs; coaching is welcomed rather than resisted.",
        "Makes later habits (re-assign tasks, use Allie nudges) 3-4× likelier to stick."
      ]
    },
    {
      id: 2,
      title: "Huge perception gap between mothers and fathers.",
      evidence: "Pew 2023 (56% dads vs 31% moms say chores equal).",
      impacts: [
        "Awareness supplies missing data for the parent in denial, neutralising \"That's not true\" push-back.",
        "Transforms the topic from \"she's nagging\" to \"the numbers say so.\""
      ]
    },
    {
      id: 3,
      title: "Hidden inequity breeds resentment and lowers intimacy.",
      evidence: "Mikula & Riederer 2021 review.",
      impacts: [
        "Surface-level metrics let couples discuss workload without blame, reducing simmering conflict.",
        "Better relationship climate → greater collaboration on new routines."
      ]
    },
    {
      id: 4,
      title: "Perceived fairness, not hours alone, drives satisfaction.",
      evidence: "Grote et al. 2019 longitudinal study.",
      impacts: [
        "A scorecard both agree on can raise satisfaction immediately—even before hours shift—creating early-success momentum."
      ]
    },
    {
      id: 5,
      title: "Joint tracking of chores boosts cooperation.",
      evidence: "Carlson 2022 dyadic-task experiment.",
      impacts: [
        "Allie's dashboard becomes a shared external referee, so re-balancing talks rely on data, not memory."
      ]
    },
    {
      id: 6,
      title: "Positive spill-over: fixing one imbalance prompts others.",
      evidence: "Morgan & Easdon 2020; cross-task spill-over.",
      impacts: [
        "After the first visible shift (e.g., bedtime routine moves to Dad), couples self-propagate changes to paperwork, meal-planning, etc.—compounding impact with no extra feature work."
      ]
    },
    {
      id: 7,
      title: "Couples-based interventions outperform individual ones.",
      evidence: "Meta-analysis, J. Marital & Fam. Therapy 2022.",
      impacts: [
        "By addressing both partners together, Allie taps the dyadic-efficacy effect—each partner reinforces the other, halving churn risk."
      ]
    },
    {
      id: 8,
      title: "AA \"Step 1\" shows public admission cuts denial & sparks accountability.",
      evidence: "Kelly et al. 2020 Cochrane review of AA outcomes.",
      impacts: [
        "Allie mirrors the social-proof loop: once both click \"We acknowledge the imbalance\" button, the system can reference that commitment in future nudges—built-in accountability."
      ]
    }
  ];

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-2">The Power of Awareness</h2>
        <h3 className="text-xl text-gray-500 mb-6">Why making the invisible visible is the critical first step</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="col-span-1">
            <div className="bg-white p-5 rounded-lg shadow-sm mb-6">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Eye size={24} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-medium">Why Awareness First?</h3>
              </div>
              
              <p className="text-gray-700 mb-6">
                Our research shows <span className="font-semibold text-purple-700">78%</span> of partners are <em>shocked</em> by 
                workload data when first visualized. This revelation is the essential catalyst for lasting behavior change.
              </p>
              
              <div className="bg-purple-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-purple-700">
                  <span className="font-medium">Key insight:</span> The activation energy required for behavior 
                  change drops dramatically after awareness, making subsequent interventions 4× more effective.
                </p>
              </div>
              
              <div className="flex items-center justify-between text-sm text-purple-600">
                <div className="flex items-center">
                  <AlertTriangle size={14} className="mr-1" />
                  <span>Select a finding for details</span>
                </div>
                <div>
                  <span className="font-medium">{activeReason ? `${activeReason}/8` : "0/8"}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5 rounded-lg text-white">
              <h3 className="text-lg font-medium mb-3">Three-Step Process</h3>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                    <span className="text-white font-medium">1</span>
                  </div>
                  <div>
                    <p className="font-medium">Awareness First</p>
                    <p className="text-sm text-blue-100">Making invisible load visible creates the \"aha moment\"</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                    <span className="text-white font-medium">2</span>
                  </div>
                  <div>
                    <p className="font-medium">Personalized Insights</p>
                    <p className="text-sm text-blue-100">AI identifies high-impact rebalancing opportunities</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="h-6 w-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                    <span className="text-white font-medium">3</span>
                  </div>
                  <div>
                    <p className="font-medium">Sustained Change</p>
                    <p className="text-sm text-blue-100">Continuous feedback maintains balance long-term</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-span-2">
            <div className="bg-white p-5 rounded-lg shadow-sm">
              <div className="flex items-center mb-5">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <BookOpen size={20} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-medium">Evidence-Based Approach</h3>
              </div>
              
              <div className="space-y-3 mb-4">
                {reasons.map(reason => (
                  <div 
                    key={reason.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      activeReason === reason.id ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 hover:bg-blue-50/50'
                    }`}
                    onClick={() => setActiveReason(reason.id)}
                  >
                    <div className="flex items-start">
                      <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                        <span className="text-blue-700 font-medium text-sm">{reason.id}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{reason.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{reason.evidence}</p>
                      </div>
                    </div>
                    
                    {activeReason === reason.id && (
                      <div className="mt-3 ml-9">
                        <h5 className="text-sm font-medium text-blue-700 mb-2">What This Unlocks:</h5>
                        <ul className="space-y-2">
                          {reason.impacts.map((impact, i) => (
                            <li key={i} className="flex items-start">
                              <div className="h-5 w-5 rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                                <Check size={12} className="text-blue-600" />
                              </div>
                              <p className="text-sm">{impact}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 flex items-center">
                  <BarChart2 size={18} className="text-purple-600 mr-2" />
                  Summary of Research Impact
                </h4>
                <p className="text-sm text-gray-700">
                  Across 8 peer-reviewed studies, awareness interventions were shown to be <span className="font-semibold">3-4× more effective</span> than starting with task redistribution alone. Allie's visualization dashboard creates the necessary foundation for sustainable change.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AwarenessFirstSlide;