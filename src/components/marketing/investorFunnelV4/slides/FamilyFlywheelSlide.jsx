import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card } from './components';
import { RefreshCw, Users, Zap, Target } from 'lucide-react';

const FamilyFlywheelSlide = () => {
  return (
    <SlideTemplate
      title="The Family Flywheel Effect"
      subtitle="Creating virtuous cycles of increasing value and deepening engagement"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <RefreshCw className="mr-2 text-indigo-600" size={24} />
            The Allie Flywheel
          </h3>
          
          <div className="relative h-80">
            {/* Central Circle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex flex-col items-center justify-center text-center shadow-md">
                <RefreshCw size={20} className="text-indigo-600 mb-1" />
                <span className="text-xs font-medium text-indigo-900">Family</span>
                <span className="text-xs font-medium text-indigo-900">Flywheel</span>
              </div>
            </div>
            
            {/* Outer circles and connecting lines - positioned absolutely */}
            
            {/* Top Circle */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-3 shadow-md w-48 text-center">
              <h4 className="text-sm font-medium text-indigo-800 mb-1">Usage Generates Data</h4>
              <p className="text-xs text-gray-600">Calendar updates, tasks, documents, and requests feed the knowledge graph</p>
            </div>
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2 h-10 border-l-2 border-dashed border-indigo-300"></div>
            
            {/* Right Circle */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 shadow-md w-48 text-center">
              <h4 className="text-sm font-medium text-purple-800 mb-1">Enhanced Understanding</h4>
              <p className="text-xs text-gray-600">ML models adapt to family's unique patterns and preferences</p>
            </div>
            <div className="absolute right-16 top-1/2 transform -translate-y-1/2 w-10 border-t-2 border-dashed border-purple-300"></div>
            
            {/* Bottom Circle */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 shadow-md w-48 text-center">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Personalized Assistance</h4>
              <p className="text-xs text-gray-600">Tailored recommendations and proactive guidance</p>
            </div>
            <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 h-10 border-l-2 border-dashed border-blue-300"></div>
            
            {/* Left Circle */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 shadow-md w-48 text-center">
              <h4 className="text-sm font-medium text-amber-800 mb-1">Increased Engagement</h4>
              <p className="text-xs text-gray-600">More features used, deeper integration into family life</p>
            </div>
            <div className="absolute left-16 top-1/2 transform -translate-y-1/2 w-10 border-t-2 border-dashed border-amber-300"></div>
            
            {/* Connecting arrows around the circle */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
              <defs>
                <marker id="arrowhead" markerWidth="5" markerHeight="5" refX="2.5" refY="2.5" orient="auto">
                  <polygon points="0 0, 5 2.5, 0 5" fill="#818cf8" />
                </marker>
              </defs>
              
              {/* Top to Right */}
              <path d="M 200 50 Q 300 50, 300 150" fill="none" stroke="#818cf8" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="4" />
              
              {/* Right to Bottom */}
              <path d="M 300 150 Q 300 250, 200 250" fill="none" stroke="#818cf8" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="4" />
              
              {/* Bottom to Left */}
              <path d="M 200 250 Q 100 250, 100 150" fill="none" stroke="#818cf8" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="4" />
              
              {/* Left to Top */}
              <path d="M 100 150 Q 100 50, 200 50" fill="none" stroke="#818cf8" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="4" />
            </svg>
          </div>
          
          <p className="text-sm text-gray-600 mt-3 text-center">
            Our flywheel creates a self-reinforcing cycle where increased usage leads to better personalization, 
            which drives more engagement and value.
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 flex items-center mb-4">
            <Zap className="mr-2" size={24} />
            Flywheel Acceleration
          </h3>
          
          <p className="text-gray-700 mb-4">
            Allie's flywheel accelerates through multiple reinforcing mechanisms:
          </p>
          
          <div className="space-y-4">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-1">Data Depth Compounds</h4>
              <p className="text-sm text-gray-700 mb-2">
                The longer a family uses Allie, the deeper our understanding of their unique patterns becomes.
              </p>
              <div className="flex items-center">
                <div className="relative w-full h-6 bg-gray-100 rounded">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-200 to-indigo-400 rounded" style={{width: '25%'}}>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-indigo-800">Month 1</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center mt-2">
                <div className="relative w-full h-6 bg-gray-100 rounded">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-300 to-indigo-500 rounded" style={{width: '50%'}}>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">Month 6</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center mt-2">
                <div className="relative w-full h-6 bg-gray-100 rounded">
                  <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded" style={{width: '90%'}}>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">Month 12</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-1">Feature Discovery Path</h4>
              <p className="text-sm text-gray-700 mb-2">
                We design feature discovery to follow natural usage patterns, introducing new capabilities 
                at the perfect moment to solve emerging needs.
              </p>
              <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                <span>Core Calendar</span>
                <div className="flex items-center">
                  <span className="font-medium text-indigo-800 mr-1">93%</span>
                  <span>adoption</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                <span>→ Mental Load Dashboard</span>
                <div className="flex items-center">
                  <span className="font-medium text-indigo-800 mr-1">78%</span>
                  <span>conversion</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                <span>→ Task Weighting</span>
                <div className="flex items-center">
                  <span className="font-medium text-indigo-800 mr-1">65%</span>
                  <span>conversion</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs text-gray-600">
                <span>→ Relationship Insights</span>
                <div className="flex items-center">
                  <span className="font-medium text-indigo-800 mr-1">52%</span>
                  <span>conversion</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-1">Cross-Family Ecosystem</h4>
              <p className="text-sm text-gray-700 mb-2">
                As more families join, increasing opportunities for shared experiences create new value.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">School Community</p>
                  <p className="text-xs text-indigo-500">23% faster adoption</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">Activity Groups</p>
                  <p className="text-xs text-indigo-500">2.7× calendar shares</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">Shared Resources</p>
                  <p className="text-xs text-indigo-500">+41% document usage</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">Carpools/Logistics</p>
                  <p className="text-xs text-indigo-500">3.2× coordination</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="Multi-User Flywheel" 
          icon={<Users size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <p className="text-gray-700 mb-3">
            As more family members actively engage with Allie, the system becomes exponentially more valuable to everyone.
          </p>
          <div className="space-y-2">
            <div className="bg-white bg-opacity-60 p-2 rounded-lg flex items-start">
              <div className="bg-blue-100 p-1 rounded-full mr-2 flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <div>
                <h4 className="text-xs font-medium text-blue-800">Multi-Person Insight</h4>
                <p className="text-xs text-gray-700">
                  When both partners use Allie, coordination efficiency increases by 72%
                </p>
              </div>
            </div>
            <div className="bg-white bg-opacity-60 p-2 rounded-lg flex items-start">
              <div className="bg-blue-100 p-1 rounded-full mr-2 flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <div>
                <h4 className="text-xs font-medium text-blue-800">Child Integration</h4>
                <p className="text-xs text-gray-700">
                  Adding child accounts improves family planning accuracy by 37%
                </p>
              </div>
            </div>
            <div className="bg-white bg-opacity-60 p-2 rounded-lg flex items-start">
              <div className="bg-blue-100 p-1 rounded-full mr-2 flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              <div>
                <h4 className="text-xs font-medium text-blue-800">Trusted Circle</h4>
                <p className="text-xs text-gray-700">
                  Extended family and care providers add diversity to family support
                </p>
              </div>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Data Network Flywheel" 
          icon={<RefreshCw size={24} />} 
          className="bg-gradient-to-br from-purple-50 to-indigo-100"
        >
          <p className="text-gray-700 mb-3">
            As our user base grows, our pattern recognition improves, creating better experiences that attract more families.
          </p>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Families in Network:</span>
              <span className="font-medium text-indigo-800">57,000+</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pattern Accuracy:</span>
              <span className="font-medium text-indigo-800">87.3%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Family Archetypes:</span>
              <span className="font-medium text-indigo-800">78</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Success Metrics:</span>
              <span className="font-medium text-indigo-800">35</span>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Revenue Flywheel" 
          icon={<Target size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <p className="text-gray-700 mb-3">
            Our business flywheel converts growth into sustainable revenue to fuel further expansion.
          </p>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">User Growth</span>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium text-amber-800">+180% annual</span>
              </div>
            </div>
            <svg className="h-5 w-5 text-amber-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Subscription Revenue</span>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium text-amber-800">+210% annual</span>
              </div>
            </div>
            <svg className="h-5 w-5 text-amber-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Product Development</span>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium text-amber-800">+40% feature velocity</span>
              </div>
            </div>
            <svg className="h-5 w-5 text-amber-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">ML Excellence</span>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-amber-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="font-medium text-amber-800">+65% accuracy</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 p-5 bg-white rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">The Long-Term Vision</h3>
        
        <p className="text-gray-700 mb-4 text-center max-w-4xl mx-auto">
          By activating multiple flywheels simultaneously, Allie creates an accelerating ecosystem that delivers 
          more value to families while driving our business growth.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-800 text-sm mb-1 text-center">Year 1</h4>
            <p className="text-xs text-center text-gray-700">Establish core product-market fit with essential features</p>
          </div>
          
          <div className="p-3 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-800 text-sm mb-1 text-center">Year 2-3</h4>
            <p className="text-xs text-center text-gray-700">Expand ecosystem and drive network effects through partnerships</p>
          </div>
          
          <div className="p-3 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-800 text-sm mb-1 text-center">Year 3-4</h4>
            <p className="text-xs text-center text-gray-700">Launch developer APIs and enable third-party integration ecosystem</p>
          </div>
          
          <div className="p-3 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-800 text-sm mb-1 text-center">Year 5+</h4>
            <p className="text-xs text-center text-gray-700">Establish Allie as the central platform for family coordination globally</p>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default FamilyFlywheelSlide;