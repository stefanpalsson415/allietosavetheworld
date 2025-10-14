import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card } from './components';
import { Target, Zap, Award, CheckCircle, XCircle } from 'lucide-react';

const CompetitivePositioningSlide = () => {
  const competitorData = [
    {
      name: "Traditional Family Calendar Apps",
      strengths: ["Simple scheduling", "Basic task lists", "Calendar sharing"],
      weaknesses: ["No mental load awareness", "Limited AI assistance", "No task weighting", "No relationship insights"]
    },
    {
      name: "Household Task Apps",
      strengths: ["Task assignment", "Chore tracking", "Basic reminders"],
      weaknesses: ["Focus only on execution", "No mental load concept", "No emotional labor tracking", "Limited intelligence"]
    },
    {
      name: "Digital Mental Health Apps",
      strengths: ["Wellbeing focus", "Stress tracking", "Meditation guides"],
      weaknesses: ["Not family-specific", "No practical task management", "No relationship dynamics", "Individual focus only"]
    },
    {
      name: "General Purpose AI Assistants",
      strengths: ["Basic Q&A capabilities", "General knowledge", "Broad functionality"],
      weaknesses: ["No family specialization", "No mental load concept", "Generic answers", "No personalization for families"]
    }
  ];

  return (
    <SlideTemplate
      title="Competitive Positioning"
      subtitle="A unique solution at the intersection of family management, relationship health, and AI"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 flex items-center mb-4">
            <Target className="mr-2" size={24} />
            Our Unique Position
          </h3>
          
          <p className="text-gray-700 mb-4">
            Allie occupies a distinctive space at the intersection of three growing markets:
          </p>
          
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="bg-white bg-opacity-60 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 mt-1">
                <Zap size={16} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Family Management Tools</h4>
                <p className="text-sm text-gray-700">Going beyond basic scheduling to address the underlying mental load</p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-60 p-3 rounded-lg flex items-start">
              <div className="bg-purple-100 p-2 rounded-full mr-3 mt-1">
                <Award size={16} className="text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-purple-800">Relationship Health</h4>
                <p className="text-sm text-gray-700">Addressing relationship strain from unequal mental load distribution</p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-60 p-3 rounded-lg flex items-start">
              <div className="bg-blue-100 p-2 rounded-full mr-3 mt-1">
                <Target size={16} className="text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-blue-800">AI-Enhanced Family Support</h4>
                <p className="text-sm text-gray-700">Personalized, AI-powered insights and recommendations for family wellbeing</p>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-indigo-700 italic">
            "Allie is pioneering a new category at the convergence of these markets, with a solution 
            specifically designed to address the invisible mental load in families."
          </p>
        </div>
        
        <Card 
          title="Competitive Differentiation" 
          icon={<Award size={24} />} 
          className="bg-white shadow-lg"
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="col-span-2 bg-indigo-50 p-2 rounded-lg">
                <h4 className="font-medium text-indigo-800 text-center">Key Allie Advantages</h4>
              </div>
              <div className="bg-green-50 p-2 rounded-lg flex justify-center items-center">
                <CheckCircle size={18} className="text-green-600 mr-2" />
                <span className="text-sm text-gray-800">Task Weight Algorithm</span>
              </div>
              <div className="bg-green-50 p-2 rounded-lg flex justify-center items-center">
                <CheckCircle size={18} className="text-green-600 mr-2" />
                <span className="text-sm text-gray-800">Family Knowledge Graph</span>
              </div>
              <div className="bg-green-50 p-2 rounded-lg flex justify-center items-center">
                <CheckCircle size={18} className="text-green-600 mr-2" />
                <span className="text-sm text-gray-800">Mental Load Awareness</span>
              </div>
              <div className="bg-green-50 p-2 rounded-lg flex justify-center items-center">
                <CheckCircle size={18} className="text-green-600 mr-2" />
                <span className="text-sm text-gray-800">Relationship-Focused</span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-2">
              <h4 className="font-medium text-gray-800 mb-2">Competitors' Limitations:</h4>
              {competitorData.map((competitor, index) => (
                <div key={index} className="mb-3 pb-3 border-b border-gray-100">
                  <h5 className="font-medium text-gray-700 mb-1">{competitor.name}</h5>
                  <div className="grid grid-cols-1 gap-1">
                    {competitor.weaknesses.map((weakness, i) => (
                      <div key={i} className="flex items-center">
                        <XCircle size={16} className="text-red-500 mr-2" />
                        <span className="text-sm text-gray-600">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </SlideTemplate>
  );
};

export default CompetitivePositioningSlide;