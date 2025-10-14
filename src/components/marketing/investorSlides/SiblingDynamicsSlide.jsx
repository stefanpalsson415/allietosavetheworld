import React, { useState } from 'react';
import { Users, ArrowRight, BarChart2, Zap, Star } from 'lucide-react';

const SiblingDynamicsSlide = () => {
  const [activeTab, setActiveTab] = useState('insights');

  const siblingInsights = [
    { 
      title: "Siblings See the Real You", 
      text: "Siblings observe each other in unguarded moments, identifying talents and interests parents might miss.",
      application: "Facilitate \"sibling talent-spotting\" sessions during family meetings."
    },
    { 
      title: "Cascade Effect", 
      text: "Positive interventions with one child naturally cascade to benefit siblings, multiplying the ROI.",
      application: "Older siblings become mentors, reducing parental cognitive load."
    },
    { 
      title: "Natural Skill Transfer", 
      text: "Younger siblings gain accelerated growth through informal practice with older ones.",
      application: "Structure family activities that leverage this natural learning dynamic."
    },
    { 
      title: "Niche Development", 
      text: "Siblings naturally develop complementary skills and interests rather than direct competition.",
      application: "Tools to help parents recognize and support unique niches for each child."
    }
  ];

  const parentalLoadImpact = [
    { 
      metric: "Reduced planning burden", 
      percentage: 38,
      text: "When siblings help identify each other's activities and interests"
    },
    { 
      metric: "Skill transfer efficiency", 
      percentage: 65,
      text: "Learning from siblings vs. parent-directed learning"
    },
    { 
      metric: "Distributed emotional support", 
      percentage: 42,
      text: "Siblings provide significant emotional scaffolding for each other"
    },
    { 
      metric: "Natural conflict resolution", 
      percentage: 31,
      text: "Reduction in parental intervention needed over time"
    }
  ];

  const productFeatures = [
    {
      title: "Sibling Dynamic Survey",
      description: "Special survey module that identifies sibling relationship patterns and opportunities",
      benefit: "Uncovers invisible dynamics parents may miss"
    },
    {
      title: "Sibling Insight Engine",
      description: "AI analysis that spots positive sibling influence patterns specific to each family",
      benefit: "Personalized suggestions to leverage sibling relationships"
    },
    {
      title: "Sibling Balance Habits",
      description: "Guided activities that intentionally strengthen positive sibling dynamics",
      benefit: "Converts natural sibling interactions into parental load reduction"
    },
    {
      title: "Interests Cross-Pollination",
      description: "System to track how siblings influence each other's interests over time",
      benefit: "Helps parents amplify positive sibling influence patterns"
    }
  ];

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">The Sibling Advantage</h2>
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'insights' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Key Insights
          </button>
          <button
            onClick={() => setActiveTab('load')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'load' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Parental Load Impact
          </button>
          <button
            onClick={() => setActiveTab('product')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'product' 
                ? 'bg-black text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Allie Features
          </button>
        </div>
        
        {activeTab === 'insights' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-4 flex items-center">
                <Users className="mr-2 text-purple-600" size={22} />
                Sibling Influence Research
              </h3>
              <p className="text-gray-700 mb-6">
                Recent research from NYT's "The Surprising Ways That Siblings Shape Our Lives" reveals siblings have a profound 
                impact on each other's development—often more powerful and efficient than direct parental intervention.
              </p>
              
              <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                <p className="text-sm text-gray-500 italic">
                "A single push from an older sibling can launch a life-long passion...
                siblings see the 'real you' more clearly than parents do."
                </p>
              </div>
              
              <p className="text-gray-700">
                This natural influence system represents an <strong>untapped resource</strong> for reducing parental mental 
                load while enhancing child development outcomes.
              </p>
            </div>
            
            <div>
              <div className="grid grid-cols-1 gap-4">
                {siblingInsights.map((insight, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-700 mb-2">{insight.text}</p>
                    <div className="flex items-center text-purple-700 text-sm">
                      <ArrowRight size={14} className="mr-1" />
                      <span>{insight.application}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'load' && (
          <div>
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-xl font-medium mb-4 flex items-center">
                <BarChart2 className="mr-2 text-green-600" size={22} />
                Parental Load Reduction Metrics
              </h3>
              <p className="text-gray-700 mb-6">
                When sibling dynamics are intentionally leveraged, parents experience significant reductions in cognitive, 
                emotional, and logistical loads across multiple domains.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {parentalLoadImpact.map((impact, index) => (
                  <div key={index} className="flex">
                    <div className="mr-4 w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold text-xl">
                      {impact.percentage}%
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{impact.metric}</h4>
                      <p className="text-sm text-gray-600">{impact.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-3">Multiplier Effect</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded border border-gray-200">
                  <h4 className="font-medium text-center mb-2">Resource Investment</h4>
                  <p className="text-sm text-center">Single parental intervention</p>
                  <div className="flex justify-center mt-2">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white text-xs">1x</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded border border-purple-200">
                  <h4 className="font-medium text-center mb-2">With Siblings</h4>
                  <p className="text-sm text-center">Cascading impact across children</p>
                  <div className="flex justify-center mt-2 space-x-1">
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <span className="text-white text-xs">1x</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-white text-xs">1x</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center">
                      <span className="text-white text-xs">1x</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded border border-green-200">
                  <h4 className="font-medium text-center mb-2">Net Effect</h4>
                  <p className="text-sm text-center">Total parental load reduction</p>
                  <div className="flex justify-center mt-2">
                    <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                      <span className="text-white text-xs">3x</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'product' && (
          <div>
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {productFeatures.map((feature, index) => (
                <div key={index} className="bg-white p-5 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {index === 0 ? <Zap size={20} className="text-yellow-500" /> : 
                       index === 1 ? <Star size={20} className="text-purple-500" /> :
                       index === 2 ? <Users size={20} className="text-blue-500" /> :
                       <BarChart2 size={20} className="text-green-500" />}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">{feature.title}</h4>
                      <p className="text-sm text-gray-700 mb-2">{feature.description}</p>
                      <div className="text-sm text-indigo-600 font-medium">
                        {feature.benefit}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-black text-white p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-4">Implementation Strategy</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded bg-gray-800">
                  <h4 className="font-medium mb-2">Survey Integration</h4>
                  <p className="text-sm text-gray-300">
                    Add sibling dynamics questions to the Kids Cycle Survey to uncover how siblings view each other's talents
                  </p>
                </div>
                
                <div className="p-4 rounded bg-gray-800">
                  <h4 className="font-medium mb-2">Family Journal Enhancement</h4>
                  <p className="text-sm text-gray-300">
                    Expand Kid Interests & Gift tab to include sibling observations and cross-influence insights
                  </p>
                </div>
                
                <div className="p-4 rounded bg-gray-800">
                  <h4 className="font-medium mb-2">Parental Load Habits</h4>
                  <p className="text-sm text-gray-300">
                    Create habit templates for parents to intentionally foster positive sibling dynamics
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-purple-50 rounded-lg">
          <div className="flex">
            <div className="w-1/4 pr-4 border-r border-purple-200">
              <h3 className="font-medium text-purple-800">The Big Opportunity</h3>
              <p className="text-sm text-purple-600 mt-1">
                Allie can uniquely leverage sibling dynamics as a powerful force-multiplier for reducing parental load
              </p>
            </div>
            <div className="w-3/4 pl-4 grid grid-cols-3 gap-4">
              <div>
                <h4 className="text-sm font-medium text-purple-800">Knowledge Collection</h4>
                <p className="text-xs text-purple-600">
                  Capture each sibling's unique insights about the others
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-purple-800">Pattern Recognition</h4>
                <p className="text-xs text-purple-600">
                  AI identifies opportunities in sibling dynamics specific to each family
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-purple-800">Intervention Design</h4>
                <p className="text-xs text-purple-600">
                  Turn insights into structured activities that reduce parental load
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiblingDynamicsSlide;