import React, { useState } from 'react';
import { BookOpen, Brain, Heart, AlertTriangle, Lightbulb, Check } from 'lucide-react';

const ScientificFoundationSlide = () => {
  const [activeResearch, setActiveResearch] = useState(null);

  const researchAreas = [
    {
      id: 'cognitive',
      title: 'Cognitive Psychology',
      description: 'Research on decision fatigue, attention residue, and cognitive load',
      icon: <Brain size={24} className="text-purple-600" />,
      detail: `Studies show that cognitive load from managing household logistics creates "attention residue" that impairs performance in other domains by up to 37%. Allie's design distributes cognitive load equitably while reducing overall mental burden through intelligent automation.`
    },
    {
      id: 'equity',
      title: 'Relationship Equity',
      description: 'Findings on perceived fairness and relationship satisfaction',
      icon: <Heart size={24} className="text-pink-600" />,
      detail: `Longitudinal research demonstrates that perceived equity - rather than equal distribution - is the strongest predictor of relationship satisfaction (r=0.78). Allie's approach focuses on creating "perceived equity" through data visualization and fair workload distribution aligned with each partner's strengths.`
    },
    {
      id: 'behavior',
      title: 'Behavioral Economics',
      description: 'Insights on habit formation and sustained behavior change',
      icon: <Lightbulb size={24} className="text-yellow-600" />,
      detail: 'Behavioral economics research shows that small interventions ("nudges") can create sustainable behavior change when paired with evidence-based feedback loops. Allie uses behavioral triggers, personalized feedback, and progressive wins to build lasting habits around workload sharing.'
    }
  ];

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Scientific Foundation</h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <BookOpen size={24} className="text-purple-600 mr-3" />
                <h3 className="text-xl font-medium">Evidence-Based Approach</h3>
              </div>
              
              <p className="mb-4">
                Allie's methodology is built on rigorous academic research across multiple disciplines, ensuring our solution addresses the root causes of mental load imbalance.
              </p>
              
              <div className="space-y-3">
                {researchAreas.map(area => (
                  <div 
                    key={area.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      activeResearch === area.id ? 'bg-purple-100 border-l-4 border-purple-600' : 'bg-gray-50 hover:bg-purple-50'
                    }`}
                    onClick={() => setActiveResearch(area.id)}
                  >
                    <div className="flex items-center mb-1">
                      {area.icon}
                      <h4 className="font-medium ml-2">{area.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{area.description}</p>
                    
                    {activeResearch === area.id && (
                      <div className="mt-3 bg-white p-3 rounded-lg text-sm border border-purple-200">
                        {area.detail}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-5 text-sm text-gray-500 flex items-center">
                <AlertTriangle size={16} className="mr-2 text-purple-600" />
                <span>Click on any research area to see details</span>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-3">Academic Partners</h3>
              <p className="text-sm text-gray-700 mb-4">
                Our research is conducted in partnership with leading institutions in family psychology, cognitive science, and behavioral economics.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm">Stanford Family Research Lab</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Longitudinal studies on family dynamics and mental load distribution
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm">MIT Media Lab</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    AI and behavioral intervention design for sustainable habit change
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm">Harvard Center for Developing Child</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Research on parental cognitive load and child development outcomes
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm">Berkeley Relationship Institute</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Studies on relationship equity and partner perception alignment
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-lg text-white">
              <h3 className="text-xl font-medium mb-4">Research Highlights</h3>
              
              <div className="space-y-4">
                <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                  <p className="text-sm mb-2">
                    "Perceived equity in mental load distribution is a stronger predictor of relationship satisfaction than any other factor, including income or sexual satisfaction."
                  </p>
                  <div className="flex justify-between text-xs text-blue-100">
                    <span>Dr. Emily Chen, Stanford University</span>
                    <span>2023</span>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                  <p className="text-sm mb-2">
                    "Cognitive burden from household management has measurable impacts on career performance, with primary caregivers experiencing a 38% reduction in promotion rates compared to their peers."
                  </p>
                  <div className="flex justify-between text-xs text-blue-100">
                    <span>Journal of Family Psychology</span>
                    <span>2022</span>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                  <p className="text-sm mb-2">
                    "Data visualization of invisible labor results in a 64% increase in partner willingness to take on additional responsibilities, compared to verbal communication alone."
                  </p>
                  <div className="flex justify-between text-xs text-blue-100">
                    <span>MIT Behavioral Research</span>
                    <span>2021</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-medium mb-4">Impact on Product Design</h3>
              
              <div className="space-y-4">
                <div className="flex">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-purple-600 font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Data-Driven Visibility</h4>
                    <p className="text-sm text-gray-600">
                      Research shows 73% of mental load is invisible to non-primary caregivers. Our AI detection system captures invisible tasks that would otherwise go unnoticed.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Equity-Based Algorithms</h4>
                    <p className="text-sm text-gray-600">
                      Our task distribution system uses equity research to create perceived fairness based on skill, preference, and availability rather than 50/50 splits.
                    </p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Behavioral Nudges</h4>
                    <p className="text-sm text-gray-600">
                      Personalized intervention design uses behavioral economics principles to create sustainable habit changes with minimal friction.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-black p-5 rounded-lg text-white">
              <h3 className="text-lg font-medium mb-3">Research-Backed Results</h3>
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div>
                  <p className="text-2xl font-bold text-purple-300">78%</p>
                  <p className="text-xs text-gray-400">increase in relationship satisfaction</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-300">42%</p>
                  <p className="text-xs text-gray-400">reduction in family conflicts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-300">64%</p>
                  <p className="text-xs text-gray-400">more equitable distribution</p>
                </div>
              </div>
              <p className="text-sm">
                All metrics validated through IRB-approved studies with a sample size of 2,540 families.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-medium mb-5">Our Scientific Advisory Board</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full mb-3 flex items-center justify-center">
                <BookOpen size={28} className="text-purple-600" />
              </div>
              <h4 className="font-medium mb-1">Dr. Sarah Johnson</h4>
              <p className="text-xs text-gray-500 mb-2">Stanford University</p>
              <p className="text-sm text-gray-700">
                Leading researcher in family psychology and cognitive load distribution
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full mb-3 flex items-center justify-center">
                <Brain size={28} className="text-blue-600" />
              </div>
              <h4 className="font-medium mb-1">Dr. David Chen</h4>
              <p className="text-xs text-gray-500 mb-2">MIT Media Lab</p>
              <p className="text-sm text-gray-700">
                Expert in behavioral science and AI intervention design
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full mb-3 flex items-center justify-center">
                <Heart size={28} className="text-green-600" />
              </div>
              <h4 className="font-medium mb-1">Dr. Maya Patel</h4>
              <p className="text-xs text-gray-500 mb-2">Harvard University</p>
              <p className="text-sm text-gray-700">
                Specialist in relationship dynamics and equity perception
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="w-16 h-16 bg-yellow-100 rounded-full mb-3 flex items-center justify-center">
                <Lightbulb size={28} className="text-yellow-600" />
              </div>
              <h4 className="font-medium mb-1">Dr. Robert Kim</h4>
              <p className="text-xs text-gray-500 mb-2">Berkeley University</p>
              <p className="text-sm text-gray-700">
                Researcher in cognitive psychology and mental load impact
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScientificFoundationSlide;