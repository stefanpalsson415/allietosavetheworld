import React from 'react';
import { Database, BarChart, Brain, DollarSign, ChevronRight, Layers, Shield } from 'lucide-react';

const DataValueSlide = () => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-0">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">The Family Knowledge Graph: Our MOAT</h2>
        
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <div className="flex items-center mb-4">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Database size={24} className="text-blue-700" />
            </div>
            <p className="text-xl font-medium text-blue-800">In the age of AI and millions of apps, proprietary data is the only true moat</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium mb-4 flex items-center">
              <Database size={20} className="mr-2 text-purple-600" /> 
              The Family Knowledge Graph
            </h3>
            
            <p className="text-gray-700 mb-4">
              We collect and organize unique, high-value data about each family:
            </p>
            
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <div className="bg-purple-100 p-1 rounded-full mr-2 flex-shrink-0 mt-0.5">
                  <ChevronRight className="text-purple-600" size={16} />
                </div>
                <p>Complete developmental journey of children over time</p>
              </li>
              <li className="flex items-start">
                <div className="bg-purple-100 p-1 rounded-full mr-2 flex-shrink-0 mt-0.5">
                  <ChevronRight className="text-purple-600" size={16} />
                </div>
                <p>Family preference patterns (activities, products, locations)</p>
              </li>
              <li className="flex items-start">
                <div className="bg-purple-100 p-1 rounded-full mr-2 flex-shrink-0 mt-0.5">
                  <ChevronRight className="text-purple-600" size={16} />
                </div>
                <p>Emotional state tracking and sentiment patterns</p>
              </li>
              <li className="flex items-start">
                <div className="bg-purple-100 p-1 rounded-full mr-2 flex-shrink-0 mt-0.5">
                  <ChevronRight className="text-purple-600" size={16} />
                </div>
                <p>Task and mental load distribution between family members</p>
              </li>
              <li className="flex items-start">
                <div className="bg-purple-100 p-1 rounded-full mr-2 flex-shrink-0 mt-0.5">
                  <ChevronRight className="text-purple-600" size={16} />
                </div>
                <p>Changing needs at different life stages and transitions</p>
              </li>
            </ul>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 italic">
                "This longitudinal data across families creates an asset no competitor can easily replicate"
              </p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-medium mb-4 flex items-center">
              <DollarSign size={20} className="mr-2 text-green-600" /> 
              Monetization Opportunities
            </h3>
            
            <div className="space-y-4">
              <div className="border-l-4 border-green-400 pl-4">
                <h4 className="font-medium mb-1 flex items-center">
                  <Shield size={18} className="mr-2 text-green-600" />
                  Privacy-First Personalization
                </h4>
                <p className="text-sm text-gray-700">
                  Highly targeted recommendations that perfectly match each family's unique needs and preferences
                </p>
              </div>
              
              <div className="border-l-4 border-green-400 pl-4">
                <h4 className="font-medium mb-1 flex items-center">
                  <BarChart size={18} className="mr-2 text-green-600" />
                  Predictive Commerce
                </h4>
                <p className="text-sm text-gray-700">
                  Anticipate family needs before they arise, offering just-in-time solutions with frictionless purchasing
                </p>
              </div>
              
              <div className="border-l-4 border-green-400 pl-4">
                <h4 className="font-medium mb-1 flex items-center">
                  <Layers size={18} className="mr-2 text-green-600" />
                  Vertical Expansion
                </h4>
                <p className="text-sm text-gray-700">
                  Leverage insights to build new features that address unmet needs across education, health, and financial planning
                </p>
              </div>
              
              <div className="border-l-4 border-green-400 pl-4">
                <h4 className="font-medium mb-1 flex items-center">
                  <Brain size={18} className="mr-2 text-green-600" />
                  Research & Insights
                </h4>
                <p className="text-sm text-gray-700">
                  Anonymized trend data that provides unique value to partners, researchers, and product developers
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-4">Our Proprietary Data Advantage</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-60 p-4 rounded-lg">
              <div className="text-center mb-2">
                <span className="text-3xl font-bold text-purple-700">85%</span>
              </div>
              <p className="text-center text-sm">
                of user data we collect is unavailable to any single competitor
              </p>
            </div>
            
            <div className="bg-white bg-opacity-60 p-4 rounded-lg">
              <div className="text-center mb-2">
                <span className="text-3xl font-bold text-purple-700">12x</span>
              </div>
              <p className="text-center text-sm">
                value multiplier on monetization features built on our knowledge graph
              </p>
            </div>
            
            <div className="bg-white bg-opacity-60 p-4 rounded-lg">
              <div className="text-center mb-2">
                <span className="text-3xl font-bold text-purple-700">3.5+</span>
              </div>
              <p className="text-center text-sm">
                years of data accumulation needed for a competitor to match our insights
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataValueSlide;