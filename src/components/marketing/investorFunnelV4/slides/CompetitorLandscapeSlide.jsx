import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart } from './components';
import { 
  Users, 
  TrendingUp, 
  Search, 
  Database, 
  Shield, 
  Clock, 
  Target,
  Award
} from 'lucide-react';

const CompetitorLandscapeSlide = () => {
  const competitiveData = [
    {
      name: 'Family Focus',
      'Allie': 95,
      'Traditional Calendars': 40,
      'To-Do Apps': 30,
      'Task Managers': 55
    },
    {
      name: 'AI Integration',
      'Allie': 90,
      'Traditional Calendars': 20,
      'To-Do Apps': 25,
      'Task Managers': 30
    },
    {
      name: 'Mental Load Balancing',
      'Allie': 95,
      'Traditional Calendars': 15,
      'To-Do Apps': 30,
      'Task Managers': 45
    },
    {
      name: 'Real-Time Adaptation',
      'Allie': 85,
      'Traditional Calendars': 20,
      'To-Do Apps': 10,
      'Task Managers': 35
    },
    {
      name: 'Multi-User Support',
      'Allie': 90,
      'Traditional Calendars': 60,
      'To-Do Apps': 40,
      'Task Managers': 50
    }
  ];

  return (
    <SlideTemplate 
      title="Competitor Landscape" 
      subtitle="How Allie stands out in the family management ecosystem"
    >
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Left column - Chart */}
        <div className="col-span-7">
          <Card className="h-full">
            <h3 className="font-medium text-gray-800 mb-4">Feature Comparison: Allie vs. Competitors</h3>
            <div className="h-80">
              <DataChart 
                type="bar"
                data={competitiveData}
                options={{
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      title: {
                        display: true,
                        text: 'Capability Score'
                      }
                    }
                  }
                }}
                height={300}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Comparison based on independent feature evaluation across 5 key capability dimensions
            </p>
          </Card>
        </div>

        {/* Right column - Competitor positioning */}
        <div className="col-span-5">
          <Card
            icon={<Target size={20} />}
            title="Our Competitive Edge"
            className="h-full"
          >
            <p className="text-gray-700 mb-4">
              Allie's specialized focus on family organization and mental load balancing creates a 
              substantial competitive moat that general-purpose tools cannot match.
            </p>
            
            <div className="space-y-3 mb-4">
              <div className="flex items-start">
                <div className="bg-indigo-100 p-1.5 rounded-full mr-3 mt-0.5">
                  <Award className="text-indigo-600 h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Family-Specific AI Model</h4>
                  <p className="text-xs text-gray-600">Our models are trained specifically on family coordination patterns</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-indigo-100 p-1.5 rounded-full mr-3 mt-0.5">
                  <Database className="text-indigo-600 h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Knowledge Graph Architecture</h4>
                  <p className="text-xs text-gray-600">Specialized data structure that maps complex family relationships</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-indigo-100 p-1.5 rounded-full mr-3 mt-0.5">
                  <Shield className="text-indigo-600 h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">3-5 Year Technology Moat</h4>
                  <p className="text-xs text-gray-600">Patent-pending task weighting and load balancing systems</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-indigo-100 p-1.5 rounded-full mr-3 mt-0.5">
                  <Clock className="text-indigo-600 h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Higher Retention Rates</h4>
                  <p className="text-xs text-gray-600">91% 3-month retention vs 23-35% for competitors</p>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-700 mb-2">Competitor Response Timeline</h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className="w-24 text-xs text-indigo-800">Current</div>
                  <div className="flex-1 ml-2 h-1.5 bg-gray-200 rounded-full">
                    <div className="h-full w-full bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-xs text-indigo-800">1-2 Years</div>
                  <div className="flex-1 ml-2 h-1.5 bg-gray-200 rounded-full">
                    <div className="h-full w-4/5 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-xs text-indigo-800">3-4 Years</div>
                  <div className="flex-1 ml-2 h-1.5 bg-gray-200 rounded-full">
                    <div className="h-full w-3/5 bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-24 text-xs text-indigo-800">5+ Years</div>
                  <div className="flex-1 ml-2 h-1.5 bg-gray-200 rounded-full">
                    <div className="h-full w-2/5 bg-red-400 rounded-full"></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center mt-2 text-gray-600">
                Estimated competitive advantage timeline based on current patent and R&D trajectory
              </p>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6">
        <Card
          icon={<Users size={20} />}
          title="Traditional Calendar Apps"
          className="bg-gray-50"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-sm font-medium">Key Players:</span>
              <span className="text-sm">Google Calendar, Apple Calendar</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-700">Strengths:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Widespread adoption and familiarity</li>
                <li>• Strong integration with email platforms</li>
                <li>• Free with device/platform purchase</li>
              </ul>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-700">Weaknesses:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• No mental load tracking capabilities</li>
                <li>• No task weighting or distribution features</li>
                <li>• Limited personalization for family needs</li>
                <li>• No specialized intelligence for family events</li>
              </ul>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Market Share:</span>
                <span className="text-xs font-medium text-indigo-600">73%</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1">
                <div className="bg-indigo-600 h-full rounded-full" style={{width: '73%'}}></div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card
          icon={<Search size={20} />}
          title="To-Do & Task List Apps"
          className="bg-gray-50"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-sm font-medium">Key Players:</span>
              <span className="text-sm">Todoist, Microsoft To Do, Any.do</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-700">Strengths:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Simple user interface for task tracking</li>
                <li>• Basic sharing capabilities</li>
                <li>• Cross-platform availability</li>
              </ul>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-700">Weaknesses:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• No concept of invisible work</li>
                <li>• Limited calendar integration</li>
                <li>• No workload analysis or balancing</li>
                <li>• No family-specific features</li>
                <li>• Manual entry requirements create fatigue</li>
              </ul>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Market Share:</span>
                <span className="text-xs font-medium text-indigo-600">48%</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1">
                <div className="bg-indigo-600 h-full rounded-full" style={{width: '48%'}}></div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card
          icon={<TrendingUp size={20} />}
          title="Specialized Family Tools"
          className="bg-gray-50"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="text-sm font-medium">Key Players:</span>
              <span className="text-sm">Cozi, OurHome, FamilyWall</span>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-700">Strengths:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Family-specific features</li>
                <li>• Shopping lists and meal planning</li>
                <li>• Basic chore tracking</li>
              </ul>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium text-gray-700">Weaknesses:</h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• No AI integration or intelligence</li>
                <li>• No mental load tracking or balancing</li>
                <li>• Manual entry requirements</li>
                <li>• Limited data analysis capabilities</li>
                <li>• Basic feature set without advanced insights</li>
              </ul>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Market Share:</span>
                <span className="text-xs font-medium text-indigo-600">12%</span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1">
                <div className="bg-indigo-600 h-full rounded-full" style={{width: '12%'}}></div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="mt-6 bg-indigo-700 text-white p-5 rounded-lg">
        <h3 className="font-bold text-xl mb-3 text-center">Why Allie Wins Against Competitors</h3>
        <div className="grid grid-cols-4 gap-x-4">
          <div className="text-center">
            <p className="text-3xl font-bold">3-5yr</p>
            <p className="text-xs opacity-90">Technology advantage window</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">2.8x</p>
            <p className="text-xs opacity-90">Higher engagement than specialized tools</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">91%</p>
            <p className="text-xs opacity-90">12-month retention (vs 23-35% competitors)</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">3.4x</p>
            <p className="text-xs opacity-90">Higher likelihood of premium conversion</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Source: Competitor Analysis Report, Family Technology Research Institute, 2024</p>
      </div>
    </SlideTemplate>
  );
};

export default CompetitorLandscapeSlide;