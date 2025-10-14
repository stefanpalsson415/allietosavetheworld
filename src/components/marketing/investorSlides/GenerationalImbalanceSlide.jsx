import React, { useState } from 'react';
import { Check, Brain, AlertTriangle, ChevronDown, ChevronUp, ChevronsRight } from 'lucide-react';

const GenerationalImbalanceSlide = () => {
  const [activeSection, setActiveSection] = useState('perception');

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Why Mental Load Persists Across Generations</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left column: Perception Problem */}
          <div>
            <button 
              onClick={() => toggleSection('perception')}
              className={`w-full text-left mb-4 p-5 rounded-lg transition-colors ${
                activeSection === 'perception' 
                  ? 'bg-blue-50 border-2 border-blue-200' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">The Perception Problem</h3>
                {activeSection === 'perception' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {activeSection === 'perception' && (
              <div className="bg-white p-5 rounded-lg border border-gray-200 mb-6">
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 bg-blue-100 text-blue-700 rounded-full p-1">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">Fathers' Unawareness</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      56% of fathers—but only 31% of mothers—say chores are "shared about equally," despite mothers spending 2-3× more time on them. Melbourne-Institute research confirms men are "largely unaware" partners do more.
                    </p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 bg-blue-100 text-blue-700 rounded-full p-1">
                    <Check size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">Mothers' Variable Perception</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Across 29 countries, many women rate division as "fair" despite objective time-diary data showing large gaps. After first childbirth, women briefly judge arrangements as more fair, then perceive growing unfairness as children age.
                    </p>
                  </div>
                </div>
                
                <div className="bg-amber-50 p-3 rounded border border-amber-200 mt-4">
                  <h4 className="font-medium text-amber-800 text-sm">Fairness Perception is Moderated by:</h4>
                  <ul className="mt-2 space-y-1 text-xs text-amber-700">
                    <li>• Gender-role ideology: egalitarian mothers more likely to call split unfair</li>
                    <li>• Child age: perceived unfairness grows as children get older</li>
                    <li>• Country norms: Nordic countries show higher unfairness perception</li>
                  </ul>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => toggleSection('mechanisms')}
              className={`w-full text-left mb-4 p-5 rounded-lg transition-colors ${
                activeSection === 'mechanisms' 
                  ? 'bg-purple-50 border-2 border-purple-200' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">Perpetuating Mechanisms</h3>
                {activeSection === 'mechanisms' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {activeSection === 'mechanisms' && (
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <div className="space-y-4">
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <ChevronsRight className="text-purple-700" size={14} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Visibility Bias</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Fathers overestimate "episodic" tasks they can remember (fixing the bike) and overlook the constant planning tasks that never become visible deliverables. Qualitative interviews call this "passenger parenting."
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <ChevronsRight className="text-purple-700" size={14} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Social-Norm Framing</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Household justice research shows people judge fairness relative to what they think other couples do. When everyone follows the same gender script, inequality feels "normal."
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <ChevronsRight className="text-purple-700" size={14} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Cognitive Off-Loading Loops</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Once one partner becomes the default planner, the other naturally stops monitoring details, reinforcing unawareness (documented in USC cognitive-labor study).
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <ChevronsRight className="text-purple-700" size={14} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Conflict-Avoidance and Guilt</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Mothers who already carry the mental load often resist "adding another thing to manage" by training a partner; studies link this to lower-than-expected reports of unfairness despite stress symptoms.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right column: Generational Impact and Solution */}
          <div>
            <button 
              onClick={() => toggleSection('generational')}
              className={`w-full text-left mb-4 p-5 rounded-lg transition-colors ${
                activeSection === 'generational' 
                  ? 'bg-green-50 border-2 border-green-200' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">The Generational Cycle</h3>
                {activeSection === 'generational' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {activeSection === 'generational' && (
              <div className="bg-white p-5 rounded-lg border border-gray-200 mb-6">
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 mt-1 text-green-700">
                    <Brain size={22} />
                  </div>
                  <div>
                    <h4 className="font-medium">Children Learn By Observation</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Research shows children adopt gender roles they observe at home. When children consistently see one parent managing invisible tasks, they internalize these patterns as "normal" for their future relationships.
                    </p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 mt-1 text-green-700">
                    <Brain size={22} />
                  </div>
                  <div>
                    <h4 className="font-medium">Behavioral Shaping Starts Early</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Studies find gender differences in household "training" emerge as early as age 4-6. Girls are asked to help with planning and anticipating needs, while boys are assigned discrete physical tasks.
                    </p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded border border-green-200 mt-4">
                  <h4 className="font-medium text-green-800 text-sm">Longitudinal Evidence:</h4>
                  <p className="mt-1 text-xs text-green-700">
                    A 25-year longitudinal study found children's adult relationships strongly mirrored their parents' division of cognitive labor, with correlations as high as 0.67 for same-gender parent modeling.
                  </p>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => toggleSection('solutions')}
              className={`w-full text-left mb-4 p-5 rounded-lg transition-colors ${
                activeSection === 'solutions' 
                  ? 'bg-indigo-50 border-2 border-indigo-200' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">Breaking the Cycle with Allie</h3>
                {activeSection === 'solutions' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {activeSection === 'solutions' && (
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <div className="space-y-4">
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1 text-indigo-500">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Awareness Engine</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Data visualizations comparing each parent's invisible tasks to national averages close the knowledge gap without finger-pointing.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1 text-indigo-500">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Norm Re-Setting Nudges</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Show "families like yours who re-balanced X tasks saw Y% drop in maternal stress"—leveraging social comparison in a positive direction.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1 text-indigo-500">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Stage-Sensitive Messaging</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Use gentler prompts right after first childbirth (when mothers briefly judge the split as fair) and firmer equity prompts as kids grow and unfairness feelings rise.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1 text-indigo-500">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Visible Modeling for Children</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Allie creates opportunities for children to see both parents engaging with planning and cognitive tasks, breaking the generational cycle.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-pink-50 p-5 rounded-lg border border-pink-200 mt-6">
              <div className="flex items-start">
                <AlertTriangle className="text-pink-700 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-pink-800">Why Traditional Approaches Fail</h4>
                  <ul className="mt-2 space-y-2 text-sm text-pink-700">
                    <li className="flex items-start">
                      <div className="mr-2 flex-shrink-0 text-pink-700">•</div>
                      <p>They target visible work distribution without addressing the invisible cognitive labor</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 flex-shrink-0 text-pink-700">•</div>
                      <p>They place burden on the already-overburdened partner to "teach" the other</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 flex-shrink-0 text-pink-700">•</div>
                      <p>They fail to address both awareness gaps AND social norm framing simultaneously</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 flex-shrink-0 text-pink-700">•</div>
                      <p>They don't provide consistent feedback loops that reinforce changed behavior</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-black text-white rounded-lg">
          <h3 className="text-base font-medium mb-2">Research-Based Conclusion:</h3>
          <p className="text-sm">
            Addressing both unawareness (fathers) and normalization (some mothers) is critical; research shows change happens fastest when couples first agree on the facts of the workload gap. Disrupting cognitive off-loading loops requires external systems that make invisible work visible to both partners over time.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GenerationalImbalanceSlide;