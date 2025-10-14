import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card } from './components';
import { Database, Shield, GitBranch, TrendingUp, Lock } from 'lucide-react';

const DataValueSlide = () => {
  return (
    <SlideTemplate
      title="Family Data Network Effects"
      subtitle="Creating compounding value while maintaining privacy and user ownership"
    >
      {/* The Data Moat section moved to the top */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 text-center">The Data Moat</h3>
        
        {/* Highlighted quote banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-4 rounded-lg my-4 shadow-lg transform -rotate-1">
          <p className="text-xl md:text-2xl font-bold text-white text-center">
            "In the age of AI and millions of apps, proprietary data is the only true moat"
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <p className="text-gray-700 mb-4">
              Every family that joins Allie strengthens our competitive position through our unique combination of knowledge graph 
              network effects and privacy-first design:
            </p>
            
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-indigo-600">1</span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-indigo-800">Pattern data compounds over time</span> - Unlike traditional software 
                  where value plateaus, our ability to deliver insights improves with usage duration and user count
                </p>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-indigo-600">2</span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-indigo-800">High switching costs</span> - As families build their knowledge graph, 
                  the accumulated understanding of their unique patterns creates strong retention
                </p>
              </li>
              <li className="flex items-start">
                <div className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-indigo-600">3</span>
                </div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium text-indigo-800">Cross-functional data advantage</span> - Our holistic view of family 
                  dynamics creates insights impossible for single-purpose competitors
                </p>
              </li>
            </ul>
          </div>
          
          <div className="bg-indigo-50 p-5 rounded-lg">
            <h4 className="font-medium text-indigo-800 mb-3 flex items-center">
              <Database size={18} className="mr-2" />
              Proprietary ML Advantage
            </h4>
            <p className="text-sm text-gray-700 mb-4">
              Our machine learning models are continuously trained on anonymized patterns from across our user base, creating 
              predictive capabilities that improve with scale:
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <h5 className="text-xs font-medium text-indigo-800 mb-1">Task Classification</h5>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-medium text-gray-800">93.7%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Improvement/mo:</span>
                  <span className="font-medium text-green-600">+1.2%</span>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <h5 className="text-xs font-medium text-indigo-800 mb-1">Mental Load Scoring</h5>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-medium text-gray-800">87.5%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Improvement/mo:</span>
                  <span className="font-medium text-green-600">+2.1%</span>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <h5 className="text-xs font-medium text-indigo-800 mb-1">Pattern Prediction</h5>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-medium text-gray-800">85.2%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Improvement/mo:</span>
                  <span className="font-medium text-green-600">+1.8%</span>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <h5 className="text-xs font-medium text-indigo-800 mb-1">Intent Recognition</h5>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Accuracy:</span>
                  <span className="font-medium text-gray-800">91.3%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Improvement/mo:</span>
                  <span className="font-medium text-green-600">+1.5%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 flex items-center mb-4">
            <GitBranch className="mr-2" size={24} />
            Knowledge Graph Network Effects
          </h3>
          
          <p className="text-gray-700 mb-4">
            Allie's knowledge graph creates powerful network effects that improve our product while maintaining strict privacy:
          </p>
          
          <div className="space-y-3">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-1">Pattern Recognition Across Families</h4>
              <p className="text-sm text-gray-700">
                Our system identifies successful coordination patterns and relationship dynamics across thousands of 
                families, while keeping all personal data private through anonymized abstraction.
              </p>
              <div className="mt-2 p-2 bg-indigo-50 rounded-lg">
                <h5 className="text-xs font-medium text-indigo-700 mb-1">Example: Schedule Conflict Resolution</h5>
                <p className="text-xs text-gray-600">
                  When we detect that families with similar structures resolve scheduling conflicts in a particular way, 
                  we can suggest these approaches to new families facing similar challenges.
                </p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-1">Collective Intelligence Adaptation</h4>
              <p className="text-sm text-gray-700">
                As more families join Allie, our AI models improve in understanding the nuances of family dynamics, 
                creating a virtuous cycle of better predictions, recommendations, and insights.
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">+27%</p>
                  <p className="text-xs text-indigo-500">Prediction accuracy</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">+41%</p>
                  <p className="text-xs text-indigo-500">Task classification</p>
                </div>
                <div className="bg-indigo-50 p-2 rounded text-center">
                  <p className="text-xs font-medium text-indigo-800">+35%</p>
                  <p className="text-xs text-indigo-500">Context understanding</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-1">Progressive User Value Delivery</h4>
              <p className="text-sm text-gray-700">
                As individual family graphs grow richer over time, Allie delivers increasingly personalized insights 
                that would be impossible without longitudinal understanding of family patterns.
              </p>
              <div className="mt-2 flex items-center">
                <div className="h-4 flex-grow bg-gray-200 rounded-full overflow-hidden">
                  <div className="flex h-full">
                    <div className="h-full bg-indigo-300" style={{width: '20%'}}></div>
                    <div className="h-full bg-indigo-400" style={{width: '25%'}}></div>
                    <div className="h-full bg-indigo-500" style={{width: '30%'}}></div>
                    <div className="h-full bg-indigo-600" style={{width: '25%'}}></div>
                  </div>
                </div>
                <div className="ml-2 flex flex-col text-xs">
                  <span className="text-indigo-800 font-medium">Growing value</span>
                  <span className="text-indigo-600">over time</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <Shield className="mr-2 text-indigo-600" size={24} />
            Privacy-First Data Architecture
          </h3>
          
          <p className="text-gray-700 mb-4">
            We've built a data architecture that balances network effects with unwavering privacy protection and user control:
          </p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-indigo-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-1">Data Ownership & Control</h4>
              <p className="text-sm text-gray-600">
                Families maintain complete ownership of their personal data, with comprehensive export capabilities 
                and the ability to delete information at any time. Our privacy controls go far beyond regulatory requirements.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-1">Pattern Abstraction</h4>
              <p className="text-sm text-gray-600">
                We extract general patterns from user data without retaining personally identifiable information, 
                allowing us to improve the service while maintaining strict privacy boundaries.
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-1">Multi-Tier Encryption</h4>
              <p className="text-sm text-gray-600">
                End-to-end encryption for sensitive family data, with local device processing for information that 
                never needs to leave the user's phone or computer.
              </p>
            </div>
            
            <div className="border-l-4 border-emerald-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-1">Never For Sale Business Model</h4>
              <p className="text-sm text-gray-600">
                Our subscription business model eliminates any incentive to monetize personal data. We will never sell 
                user data to advertisers or third parties under any circumstances.
              </p>
            </div>
          </div>
          
          <div className="mt-5 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
              <Lock size={18} className="text-indigo-600 mr-2" />
              Privacy Promise
            </h4>
            <p className="text-sm text-gray-700">
              Our privacy approach isn't just a compliance checkbox—it's a core competitive advantage. Families trust us 
              with their most sensitive information precisely because we've built a business model that aligns our 
              incentives with their privacy interests.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="Proprietary Data Assets" 
          icon={<Database size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <p className="text-gray-700 mb-3">
            We're building unprecedented datasets on family dynamics, coordination patterns, and relationship health metrics 
            that create both product advantages and long-term business value.
          </p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Family Archetypes Identified:</span>
              <span className="font-medium text-gray-800">78</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Household Task Categories:</span>
              <span className="font-medium text-gray-800">312</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Mental Load Transfer Patterns:</span>
              <span className="font-medium text-gray-800">141</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Coordination Success Metrics:</span>
              <span className="font-medium text-gray-800">35</span>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Compounding Value Per User" 
          icon={<TrendingUp size={24} />} 
          className="bg-gradient-to-br from-purple-50 to-indigo-100"
        >
          <p className="text-gray-700 mb-3">
            Unlike traditional software where user value plateaus, Allie's value to each family compounds over time 
            as our understanding of their unique patterns deepens.
          </p>
          <div className="space-y-2">
            <div className="flex flex-col">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Month 1 Knowledge Value:</span>
                <span className="font-medium text-indigo-800">Baseline</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="h-full bg-indigo-500 rounded-full" style={{width: '20%'}}></div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Month 3 Knowledge Value:</span>
                <span className="font-medium text-indigo-800">+120%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="h-full bg-indigo-500 rounded-full" style={{width: '42%'}}></div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Month 6 Knowledge Value:</span>
                <span className="font-medium text-indigo-800">+240%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="h-full bg-indigo-500 rounded-full" style={{width: '63%'}}></div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-600">Month 12 Knowledge Value:</span>
                <span className="font-medium text-indigo-800">+470%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="h-full bg-indigo-500 rounded-full" style={{width: '85%'}}></div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Strategic Data Partnerships" 
          icon={<GitBranch size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <p className="text-gray-700 mb-3">
            Our privacy-first approach enables valuable partnerships that enhance our offering while respecting user control:
          </p>
          <div className="space-y-2">
            <div className="bg-white bg-opacity-60 p-2 rounded-lg">
              <h4 className="text-xs font-medium text-amber-800 mb-1">Research Institutions</h4>
              <p className="text-xs text-gray-700">
                Opt-in studies with leading universities to advance understanding of family dynamics and mental load
              </p>
            </div>
            <div className="bg-white bg-opacity-60 p-2 rounded-lg">
              <h4 className="text-xs font-medium text-amber-800 mb-1">Healthcare Providers</h4>
              <p className="text-xs text-gray-700">
                Optional integration with healthcare systems to support family wellbeing initiatives
              </p>
            </div>
            <div className="bg-white bg-opacity-60 p-2 rounded-lg">
              <h4 className="text-xs font-medium text-amber-800 mb-1">Education Systems</h4>
              <p className="text-xs text-gray-700">
                Secure connections with school calendars and parent communication systems
              </p>
            </div>
            <div className="bg-white bg-opacity-60 p-2 rounded-lg">
              <h4 className="text-xs font-medium text-amber-800 mb-1">Calendar Ecosystem</h4>
              <p className="text-xs text-gray-700">
                Enhanced integrations with Google, Apple, and Microsoft calendars with granular permissions
              </p>
            </div>
          </div>
        </Card>
      </div>

    </SlideTemplate>
  );
};

export default DataValueSlide;