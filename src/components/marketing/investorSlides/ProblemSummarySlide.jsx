import React from 'react';
import { Brain, Clock, Heart, Users, AlertTriangle, DollarSign, Scale } from 'lucide-react';

const ProblemSummarySlide = () => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-0">
      
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6 text-purple-600 text-center">PROBLEM SUMMARY</h2>
        
        <div className="mb-8">
          <h3 className="text-xl font-medium mb-6 text-center">The Problems We're Solving</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            
            {/* Family Imbalance Crisis */}
            <div className="border-l-4 border-red-400 p-4">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Heart className="text-red-500 mr-2" size={20} />
                Family Imbalance Crisis
              </h3>
              <p className="text-sm mb-2">Research shows that imbalanced family workloads lead to:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <div className="h-4 w-4 text-red-500 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p>33% higher parental burnout rates</p>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 text-red-500 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p>42% more relationship conflicts</p>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 text-red-500 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p>Reduced career advancement for the overloaded parent</p>
                </li>
              </ul>
            </div>
            
            {/* The Hidden Mental Load */}
            <div className="border-l-4 border-purple-400 p-4">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Brain className="text-purple-500 mr-2" size={20} />
                The Hidden Mental Load
              </h3>
              <p className="text-sm mb-2">Traditional approaches to balance fail because they ignore:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <div className="h-4 w-4 text-purple-500 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p>Invisible cognitive work of planning and organizing</p>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 text-purple-500 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p>Emotional labor of anticipating family needs</p>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 text-purple-500 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p>The compounding effect of imbalance over time</p>
                </li>
              </ul>
            </div>
            
            {/* The Information Overload */}
            <div className="border-l-4 border-blue-400 p-4">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Users className="text-blue-500 mr-2" size={20} />
                The Information Overload
              </h3>
              <p className="text-sm mb-2">Parents struggle with information management:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <div className="h-4 w-4 text-blue-500 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p>Remembering thousands of critical details</p>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 text-blue-500 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p>Information scattered across multiple channels</p>
                </li>
                <li className="flex items-start">
                  <div className="h-4 w-4 text-blue-500 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p>Mental burden of being the family's memory</p>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
            {/* Market Opportunity */}
            <div className="bg-purple-600 text-white p-6 rounded-lg">
              <h3 className="text-xl font-medium mb-4">Market Opportunity</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold mb-1">$42B</div>
                  <div className="text-sm opacity-90">market opportunity addressing this critical pain point</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">94%</div>
                  <div className="text-sm opacity-90">of millennials actively seeking solutions to mental load</div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">5.2x</div>
                  <div className="text-sm opacity-90">YoY search growth for family management solutions</div>
                </div>
              </div>
            </div>
            
            {/* Why This Problem Matters Now section */}
            <div className="col-span-2">
              <h3 className="text-xl font-medium mb-4">Why This Problem Matters Now</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-purple-700 font-medium mb-2">Post-COVID Acceleration</h4>
                  <p className="text-sm">Mental load increased 37% during the pandemic, raising awareness and demand for solutions</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-blue-700 font-medium mb-2">Generational Shift</h4>
                  <p className="text-sm">Millennials and Gen Z expect technology to solve family management problems</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-green-700 font-medium mb-2">AI Readiness</h4>
                  <p className="text-sm">First time technology can actually address the complexity of mental load</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footnotes */}
        <div className="text-xs text-gray-500 mt-10">
          <div>¹ Journal of Family Psychology (2023) "Perception Gaps in Household Labor Distribution"</div>
          <div>² Relationship Research Institute (2022) "Mental Load and Relationship Health"</div>
          <div>³ McKinsey & Company (2022) "The Economics of Unpaid Work"</div>
          <div>⁴ Morgan Stanley (2023) "Family Tech Market Analysis"</div>
          <div>⁵ Pew Research (2022) "Millennial Family Management Survey"</div>
          <div>⁶ Google Trends Analysis (2021-2023) conducted by Allie</div>
          <div>⁷ Harvard Business Review (2022) "COVID's Impact on Family Dynamics"</div>
          <div>⁸ Deloitte "Tech Trends Report: Family Management" (2023)</div>
        </div>
      </div>
    </div>
  );
};

export default ProblemSummarySlide;