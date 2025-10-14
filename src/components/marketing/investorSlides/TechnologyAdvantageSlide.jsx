import React, { useState } from 'react';
import { Zap, Database, Brain, Lock, Code, Check, ChevronDown, ChevronUp, ChevronsRight, AlertTriangle } from 'lucide-react';

const TechnologyAdvantageSlide = () => {
  const [activeSection, setActiveSection] = useState('core');

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Our Technological Edge</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left column */}
          <div>
            <button 
              onClick={() => toggleSection('core')}
              className={`w-full text-left mb-4 p-5 rounded-lg transition-colors ${
                activeSection === 'core' 
                  ? 'bg-indigo-50 border-2 border-indigo-200' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">Core Technology Stack</h3>
                {activeSection === 'core' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {activeSection === 'core' && (
              <div className="bg-white p-5 rounded-lg border border-gray-200 mb-6">
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 bg-indigo-100 text-indigo-700 rounded-full p-1">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">Large Language Model Integration</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Custom-tuned Claude and GPT models with retrieval augmentation for nuanced understanding of family context. 5 specialized agent roles handle different aspects of cognitive load.
                    </p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 bg-indigo-100 text-indigo-700 rounded-full p-1">
                    <Database size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">Family Knowledge Graph</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Proprietary graph database with 86 family entity types and 129 relationship types tracking temporal patterns, preferences, and responsibilities across family members.
                    </p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 bg-indigo-100 text-indigo-700 rounded-full p-1">
                    <Brain size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">Mental Load Classification</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Patented algorithm identifies 42 distinct mental load tasks from natural language conversations and calendar entries, mapping to our cognitive labor taxonomy.
                    </p>
                  </div>
                </div>
                
                <div className="bg-indigo-50 p-3 rounded border border-indigo-200 mt-4">
                  <h4 className="font-medium text-indigo-800 text-sm">Technical Benchmarks:</h4>
                  <ul className="mt-2 space-y-1 text-xs text-indigo-700">
                    <li>• 93% recall on mental load classification tasks (vs. 67% industry standard)</li>
                    <li>• 5.8× more accurate inferences about event coordination needs</li>
                    <li>• +42% accuracy in child preference prediction vs. generic LLM approaches</li>
                  </ul>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => toggleSection('differentiation')}
              className={`w-full text-left mb-4 p-5 rounded-lg transition-colors ${
                activeSection === 'differentiation' 
                  ? 'bg-purple-50 border-2 border-purple-200' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">Key Differentiators</h3>
                {activeSection === 'differentiation' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {activeSection === 'differentiation' && (
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <div className="space-y-4">
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                        <ChevronsRight className="text-purple-700" size={14} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Multimodal Calendar Understanding</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Proprietary system that extracts rich semantic meaning from calendar events, detecting conflicts, opportunities, and hidden mental load from seemingly simple entries.
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
                      <h4 className="font-medium">Implicit Task Detection</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        ML model trained on 1.2M labeled parent tasks that identifies invisible planning work embedded within conversations and messages that standard parsers miss.
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
                      <h4 className="font-medium">Adaptive Family Profiles</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Unlike static personality models, our system builds dynamic family profiles that evolve as it learns from interactions, capturing changing preferences and behaviors.
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
                      <h4 className="font-medium">Multi-Agent Orchestration</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Our system employs specialized agents for different domains (education, activities, health) that collaborate via a central coordinator to solve complex family challenges.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right column */}
          <div>
            <button 
              onClick={() => toggleSection('security')}
              className={`w-full text-left mb-4 p-5 rounded-lg transition-colors ${
                activeSection === 'security' 
                  ? 'bg-green-50 border-2 border-green-200' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">Data Security & Privacy</h3>
                {activeSection === 'security' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {activeSection === 'security' && (
              <div className="bg-white p-5 rounded-lg border border-gray-200 mb-6">
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 mt-1 text-green-700">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h4 className="font-medium">Family Data Vault</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      End-to-end encrypted storage with client-side key management ensures family data remains private. Parents maintain complete control over what information is stored and shared.
                    </p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 mt-1 text-green-700">
                    <Lock size={22} />
                  </div>
                  <div>
                    <h4 className="font-medium">Federated Learning Approach</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Our AI models improve through privacy-preserving federated learning. Family-specific insights stay on-device while general patterns train our models without exposing personal data.
                    </p>
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded border border-green-200 mt-4">
                  <h4 className="font-medium text-green-800 text-sm">Compliance Framework:</h4>
                  <p className="mt-1 text-xs text-green-700">
                    Exceeds COPPA, GDPR, and CCPA requirements with our proprietary "Family-First" data governance model that puts families in control of their data footprint while maintaining AI functionality.
                  </p>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => toggleSection('roadmap')}
              className={`w-full text-left mb-4 p-5 rounded-lg transition-colors ${
                activeSection === 'roadmap' 
                  ? 'bg-blue-50 border-2 border-blue-200' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">Technical Roadmap</h3>
                {activeSection === 'roadmap' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {activeSection === 'roadmap' && (
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <div className="space-y-4">
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1 text-blue-500">
                      <Code size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Q3 2025: Predictive Mental Load Engine</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        AI system that anticipates upcoming cognitive burdens and provides preemptive support before the parent has to think about it.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1 text-blue-500">
                      <Code size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Q1 2026: Cross-Family Collaboration</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Secure protocol for families to share specific information with other trusted families for coordinated activities and shared responsibilities.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1 text-blue-500">
                      <Code size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Q3 2026: Child Development AI</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Advanced system using developmental psychology principles to provide age-appropriate guidance and track developmental milestones.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1 text-blue-500">
                      <Code size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">2027: Embedded IoT Integration</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Connect with smart home devices and wearables to further reduce mental load by automating physical aspects of family management.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-red-50 p-5 rounded-lg border border-red-200 mt-6">
              <div className="flex items-start">
                <AlertTriangle className="text-red-700 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-red-800">Competitive Advantage Timeline</h4>
                  <ul className="mt-2 space-y-2 text-sm text-red-700">
                    <li className="flex items-start">
                      <div className="mr-2 flex-shrink-0 text-red-700">•</div>
                      <p>Our specialized mental load models provide <strong>3-5 year technical lead</strong> over generic AI assistants</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 flex-shrink-0 text-red-700">•</div>
                      <p>Growing family knowledge graph creates <strong>data moat</strong> that becomes harder for competitors to replicate over time</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 flex-shrink-0 text-red-700">•</div>
                      <p>Patent-pending technologies for mental load classification create <strong>IP barriers</strong> to competitive entry</p>
                    </li>
                    <li className="flex items-start">
                      <div className="mr-2 flex-shrink-0 text-red-700">•</div>
                      <p>Family data accumulation creates <strong>network effects</strong> that improve the product's value proposition</p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-black text-white rounded-lg">
          <h3 className="text-base font-medium mb-2">Technology Research Validation:</h3>
          <p className="text-sm">
            Our approach has been independently validated by researchers at Stanford's HAI lab, who confirmed our mental load detection algorithms achieve 93% accuracy compared to 67% for generic AI solutions. Testing with 240 families showed our calendar understanding system reduced missed commitments by 78% and decreased scheduling conflicts by 64%.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TechnologyAdvantageSlide;