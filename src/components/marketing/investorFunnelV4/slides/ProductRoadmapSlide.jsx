import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart } from './components';
import { 
  Route, 
  Map, 
  Milestone, 
  GitBranch, 
  Calendar, 
  Layers, 
  Database, 
  Share2, 
  Users, 
  Zap, 
  Box, 
  Clock,
  TrendingUp
} from 'lucide-react';

const ProductRoadmapSlide = () => {
  const roadmapData = {
    labels: ['Q3 2025', 'Q4 2025', 'Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026', 'H1 2027', 'H2 2027', '2028'],
    datasets: [
      {
        label: 'Major Feature Releases',
        data: [2, 3, 4, 4, 5, 5, 8, 10, 15],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
      }
    ]
  };

  return (
    <SlideTemplate 
      title="Product Roadmap" 
      subtitle="Our path to scaling the product and building the family ecosystem"
    >
      <div className="grid grid-cols-12 gap-4 h-full">
        
        {/* Left column - Timeline and features */}
        <div className="col-span-8 space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <Route className="mr-2 text-indigo-600" size={20} />
              Strategic Roadmap Timeline
            </h3>
            
            <div className="relative">
              {/* Timeline visualization */}
              <div className="border-l-2 border-indigo-500 ml-4 pl-8 space-y-6">
                {/* Phase 1 */}
                <div>
                  <h4 className="text-md font-semibold text-indigo-700 flex items-center">
                    <Milestone className="mr-2" size={18} />
                    Phase 1: Core Platform Expansion (2025 Q3-Q4)
                  </h4>
                  <ul className="list-disc ml-5 mt-2 text-sm text-gray-700">
                    <li>Enhanced calendar integration with task weighting analytics</li>
                    <li>AI assistant improvements with more specialized family knowledge</li>
                    <li>Parental mental load distribution dashboard</li>
                    <li>Kids activity and interest tracking system</li>
                    <li>Multi-user household accounts with role-based views</li>
                  </ul>
                </div>
                
                {/* Phase 2 */}
                <div>
                  <h4 className="text-md font-semibold text-indigo-700 flex items-center">
                    <Milestone className="mr-2" size={18} />
                    Phase 2: Ecosystem Development (2026 Q1-Q2)
                  </h4>
                  <ul className="list-disc ml-5 mt-2 text-sm text-gray-700">
                    <li>Family knowledge graph enrichment and visualization</li>
                    <li>Proactive insights and recommendations engine</li>
                    <li>Provider network integration (medical, education, activities)</li>
                    <li>Family document management and organization system</li>
                    <li>Advanced recurring task management with load balancing</li>
                    <li>Family health tracking and medication management</li>
                  </ul>
                </div>
                
                {/* Phase 3 */}
                <div>
                  <h4 className="text-md font-semibold text-indigo-700 flex items-center">
                    <Milestone className="mr-2" size={18} />
                    Phase 3: Advanced Intelligence (2026 Q3-Q4)
                  </h4>
                  <ul className="list-disc ml-5 mt-2 text-sm text-gray-700">
                    <li>Multi-modal information extraction from documents and images</li>
                    <li>Family relationship health monitoring and intervention</li>
                    <li>Predictive planning system for family needs and events</li>
                    <li>Cross-family coordination for carpools and shared activities</li>
                    <li>School system integration and academic tracking</li>
                    <li>Life stage-aware assistance (new baby, school transitions, etc.)</li>
                  </ul>
                </div>
                
                {/* Phase 4 */}
                <div>
                  <h4 className="text-md font-semibold text-indigo-700 flex items-center">
                    <Milestone className="mr-2" size={18} />
                    Phase 4: Ecosystem Expansion (2027)
                  </h4>
                  <ul className="list-disc ml-5 mt-2 text-sm text-gray-700">
                    <li>Family marketplace with trusted service providers</li>
                    <li>Community features for neighborhood coordination</li>
                    <li>Family financial planning and budget management</li>
                    <li>Extended family connectivity and care coordination</li>
                    <li>Educational content and developmental tracking</li>
                    <li>Voice interface and smart home integration</li>
                  </ul>
                </div>
                
                {/* Phase 5 */}
                <div>
                  <h4 className="text-md font-semibold text-indigo-700 flex items-center">
                    <Milestone className="mr-2" size={18} />
                    Phase 5: Family Platform (2028+)
                  </h4>
                  <ul className="list-disc ml-5 mt-2 text-sm text-gray-700">
                    <li>Family API for third-party developers</li>
                    <li>Enterprise solutions for family-friendly employers</li>
                    <li>International expansion with cultural adaptations</li>
                    <li>Advanced family wellness optimization systems</li>
                    <li>Institutional partnerships (schools, healthcare, government)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right column - Stats and metrics */}
        <div className="col-span-4 space-y-4">
          <Card
            icon={<Clock size={20} />}
            title="Development Cadence"
            className="bg-indigo-50"
          >
            <div className="h-64">
              <DataChart 
                type="bar"
                data={roadmapData}
                options={{
                  plugins: {
                    legend: {
                      display: false
                    },
                    title: {
                      display: true,
                      text: 'Feature Release Schedule'
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Features'
                      }
                    }
                  }
                }}
              />
            </div>
          </Card>
          
          <Card
            icon={<GitBranch size={20} />}
            title="Technical Priorities"
          >
            <ul className="space-y-2">
              <li className="flex items-center">
                <Database className="mr-2 text-indigo-600" size={16} />
                <span className="text-sm">Knowledge graph architecture expansion</span>
              </li>
              <li className="flex items-center">
                <Zap className="mr-2 text-indigo-600" size={16} />
                <span className="text-sm">AI optimization for family-specific tasks</span>
              </li>
              <li className="flex items-center">
                <Users className="mr-2 text-indigo-600" size={16} />
                <span className="text-sm">Multi-user experience refinement</span>
              </li>
              <li className="flex items-center">
                <Calendar className="mr-2 text-indigo-600" size={16} />
                <span className="text-sm">Calendar intelligence and prediction</span>
              </li>
              <li className="flex items-center">
                <Layers className="mr-2 text-indigo-600" size={16} />
                <span className="text-sm">Provider integration framework</span>
              </li>
              <li className="flex items-center">
                <Share2 className="mr-2 text-indigo-600" size={16} />
                <span className="text-sm">Social sharing and collaboration tools</span>
              </li>
            </ul>
          </Card>
          
          <Card
            icon={<Box size={20} />}
            title="Key Initiatives"
            className="bg-indigo-50"
          >
            <div className="space-y-2">
              <div className="border-l-2 border-indigo-500 pl-3">
                <h4 className="text-sm font-semibold">Relationship Health</h4>
                <p className="text-xs text-gray-600">Tools for monitoring and improving family dynamics</p>
              </div>
              <div className="border-l-2 border-green-500 pl-3">
                <h4 className="text-sm font-semibold">Provider Network</h4>
                <p className="text-xs text-gray-600">Integration with schools, medical systems and services</p>
              </div>
              <div className="border-l-2 border-blue-500 pl-3">
                <h4 className="text-sm font-semibold">Family Intelligence</h4>
                <p className="text-xs text-gray-600">Personalized insights from integrated family data</p>
              </div>
              <div className="border-l-2 border-amber-500 pl-3">
                <h4 className="text-sm font-semibold">Task Equality</h4>
                <p className="text-xs text-gray-600">Advanced algorithms for fair distribution of family work</p>
              </div>
              <div className="border-l-2 border-rose-500 pl-3">
                <h4 className="text-sm font-semibold">Family API</h4>
                <p className="text-xs text-gray-600">Platform for third-party family service integration</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default ProductRoadmapSlide;