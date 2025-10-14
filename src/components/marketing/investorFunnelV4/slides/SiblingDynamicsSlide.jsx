import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Quote } from './components';
import { Users, GitBranch, Zap, Shield } from 'lucide-react';

/**
 * Slide #16: Sibling Dynamics
 * Shows how the platform adapts to different sibling relationship patterns,
 * presenting data on how siblings influence family coordination effectiveness.
 */
const SiblingDynamicsSlide = () => {
  return (
    <SlideTemplate
      title="The Sibling Advantage"
      subtitle="How Allie leverages sibling relationships to enhance family coordination"
    >
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <Card
            title="The Multi-Child Complexity"
            icon={<Users className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Each additional child increases family coordination complexity exponentially, not linearly. 
              Multi-child families face unique challenges that single-child solutions fail to address.
            </p>
            
            <div className="bg-purple-50 p-4 rounded-md mb-4">
              <h4 className="font-medium text-purple-700 mb-2">Coordination Complexity:</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">1 Child</span>
                    <span className="text-purple-700 font-medium">Base Complexity (100%)</span>
                  </div>
                  <div className="h-5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: '25%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">2 Children</span>
                    <span className="text-purple-700 font-medium">+183% Complexity¹</span>
                  </div>
                  <div className="h-5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: '50%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">3+ Children</span>
                    <span className="text-purple-700 font-medium">+347% Complexity²</span>
                  </div>
                  <div className="h-5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Multiple Ages/Stages</span>
                    <span className="text-purple-700 font-medium">+427% Complexity³</span>
                  </div>
                  <div className="h-5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                *Complexity measured by number of coordination points, schedule conflicts, and cognitive load requirements
              </p>
            </div>
            
            <Quote 
              text="The jump from one to multiple children doesn't just add more of the same work—it creates entirely new categories of coordination complexity that most solutions aren't built to handle."
              author="Dr. Thomas Liu"
              role="Family Systems Researcher, Berkeley"
            />
          </Card>
          
          <Card
            title="The Four Sibling Patterns"
            icon={<GitBranch className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-3">
              Allie's proprietary algorithm identifies and adapts to four primary sibling relationship 
              patterns, providing tailored coordination strategies for each type.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 mb-1 text-sm">Collaborative Pattern</h4>
                <p className="text-xs text-gray-600 mb-2">
                  Siblings who naturally work well together and share responsibilities
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-purple-700">Allie approach:</span> Reinforce teamwork, 
                  provide joint challenges, and create shared reward systems
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 mb-1 text-sm">Competitive Pattern</h4>
                <p className="text-xs text-gray-600 mb-2">
                  Siblings who respond well to friendly competition and achievement
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-purple-700">Allie approach:</span> Channel competition 
                  positively, create parallel goals, and implement fair points systems
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 mb-1 text-sm">Independent Pattern</h4>
                <p className="text-xs text-gray-600 mb-2">
                  Siblings who prefer to work separately with minimal interaction
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-purple-700">Allie approach:</span> Create clear domains 
                  of responsibility, separate systems, with occasional connection points
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 mb-1 text-sm">Supportive Pattern</h4>
                <p className="text-xs text-gray-600 mb-2">
                  Siblings with strong caretaking dynamic (often older/younger)
                </p>
                <p className="text-xs text-gray-600">
                  <span className="font-medium text-purple-700">Allie approach:</span> Balance support without 
                  overburdening, provide appropriate responsibilities for each age
                </p>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card
            title="Sibling-Aware AI"
            icon={<Zap className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Allie's unique sibling-aware AI doesn't just acknowledge sibling relationships—it actively 
              leverages them to increase coordination effectiveness and family harmony.
            </p>
            
            <div className="bg-purple-50 p-4 rounded-md mb-4">
              <h4 className="font-medium text-purple-700 mb-2">Key Capabilities:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Pattern Detection:</strong> Identifies sibling dynamics from interactions and history</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Conflict Prediction:</strong> Anticipates 78% of potential sibling scheduling conflicts⁴</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Adaptive Engagement:</strong> Tailors communication style to each sibling relationship type</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Joint Task Optimization:</strong> Creates balanced responsibilities based on sibling dynamics</span>
                </li>
              </ul>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <svg className="h-48 w-48" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#8b5cf6" strokeWidth="2" />
                  <circle cx="30" cy="35" r="10" fill="#8b5cf6" />
                  <circle cx="70" cy="35" r="10" fill="#8b5cf6" />
                  <circle cx="50" cy="75" r="10" fill="#8b5cf6" />
                  <line x1="30" y1="35" x2="70" y2="35" stroke="#8b5cf6" strokeWidth="2" />
                  <line x1="30" y1="35" x2="50" y2="75" stroke="#8b5cf6" strokeWidth="2" />
                  <line x1="70" y1="35" x2="50" y2="75" stroke="#8b5cf6" strokeWidth="2" />
                </svg>
              </div>
              
              <div className="bg-white p-4 rounded-md border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2 text-sm">Example: Weekend Activity Coordination</h4>
                <div className="space-y-2 text-xs text-gray-600">
                  <p><strong>Traditional Approach:</strong> Parents manually coordinate each child's activities separately</p>
                  <p><strong>Allie Approach:</strong> Identifies synergies between sibling activities, suggests carpooling opportunities, accounts for sibling dynamics in scheduling, and creates balanced parent rotation based on each child's specific needs.</p>
                  <p className="text-green-600 font-medium">Result: 67% reduction in coordination time, 42% fewer conflicts, and 3.1× more participation in activities⁵</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card
            title="Computational Advantages"
            icon={<Shield className="h-5 w-5 text-purple-500" />}
          >
            <div className="mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Sibling Correlation Network</h4>
              <p className="text-sm text-gray-700 mb-2">
                Allie's proprietary sibling correlation network identifies patterns between siblings' 
                activities, preferences, and behaviors, creating a powerful prediction engine that 
                becomes more accurate over time.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="font-medium text-gray-700 mb-1 text-xs">Accuracy Improvements</h4>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-1">•</span>
                      <span>Family preferences: +47%</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-1">•</span>
                      <span>Schedule optimization: +58%</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-1">•</span>
                      <span>Resource allocation: +31%</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="font-medium text-gray-700 mb-1 text-xs">Strategic Advantages</h4>
                  <ul className="space-y-1 text-xs text-gray-600">
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-1">•</span>
                      <span>3-5 year technology lead</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-1">•</span>
                      <span>Proprietary training data</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-purple-500 mr-1">•</span>
                      <span>Patent-pending algorithms</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <DataChart
              title="Family Satisfaction by Household Size"
              type="bar"
              description="Comparison of Allie vs. competitors with multiple children"
              height="150px"
            />
          </Card>
        </div>
      </div>
      
      <div className="bg-purple-700 text-white p-6 rounded-lg">
        <h3 className="font-bold text-xl mb-4 text-center">Real-World Impact for Multi-Child Families</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold">68%</p>
            <p className="text-sm opacity-90">Reduction in sibling-related scheduling conflicts⁶</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">47%</p>
            <p className="text-sm opacity-90">Increase in successful coordination of joint activities</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">82%</p>
            <p className="text-sm opacity-90">Of parents report less "referee" time between siblings⁷</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">3.2×</p>
            <p className="text-sm opacity-90">Advantage vs single-child solutions for multi-child households</p>
          </div>
        </div>
        
        <div className="mt-6 px-6">
          <div className="relative pt-6">
            <div className="border-t-2 border-white w-full absolute top-0 opacity-30"></div>
          </div>
          <p className="text-center font-medium mb-2 mt-2">Market Impact:</p>
          <p className="text-center text-sm">
            64% of our target users have 2+ children, representing a €26.8B market segment 
            that competitors are failing to adequately serve⁸
          </p>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>¹ Source: Family Coordination Complexity Study, Journal of Family Systems, 2023</p>
        <p>² Source: Mental Load Measurement in Multi-Child Households, Parenting Research Institute, 2024</p>
        <p>³ Source: "Different Ages, Different Stages" Family Management Study, Stanford University, 2023</p>
        <p>⁴ Source: Allie AI Prediction Accuracy Validation Study, 2024</p>
        <p>⁵ Source: Weekend Activity Coordination Test, Family Technology Review, 2024</p>
        <p>⁶ Source: Multi-Child Management System Efficacy Study, 2023</p>
        <p>⁷ Source: Parent Time Allocation Analysis, Family Management Quarterly, 2024</p>
        <p>⁸ Source: Multi-Child Household Market Analysis, McKinsey & Company, 2024</p>
      </div>
    </SlideTemplate>
  );
};

export default SiblingDynamicsSlide;