import React, { useState } from 'react';
import { BarChart, PieChart, Clipboard, ClipboardCheck, Clock, Brain, Target, Database, Network, BarChart3, Share2, Radar, ChevronRight } from 'lucide-react';

const WorkloadVisualizationSlide = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">AI-Driven Insights Dashboard</h2>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('overview')}
          >
            Actionable Insights
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'insights' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('insights')}
          >
            Family Knowledge Graph
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'market' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('market')}
          >
            Behavior Change Impact
          </button>
        </div>
        
        {/* Tab content */}
        <div className="mb-8">
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-4 flex items-center">
                  <Radar size={24} className="text-purple-600 mr-2" />
                  Four Dimensions of Parental Load
                </h3>

                <p className="mb-4">
                  Our proprietary radar visualization reveals the four critical dimensions of family workload, showing the true distribution of labor beyond just visible tasks.
                </p>

                <div className="bg-black text-white p-4 rounded-lg my-4">
                  <h4 className="font-medium mb-3 text-center">Parental Load Balance Radar</h4>
                  {/* Radar Chart Visualization */}
                  <div className="h-60 relative">
                    {/* Simulated Radar Chart */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 rounded-full border-2 border-gray-700 relative">
                        <div className="w-36 h-36 rounded-full border border-gray-700 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="w-24 h-24 rounded-full border border-gray-700 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="w-12 h-12 rounded-full border border-gray-700 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>

                        {/* Axes */}
                        <div className="absolute top-0 left-1/2 h-full border-l border-dashed border-gray-600 transform -translate-x-1/2"></div>
                        <div className="absolute top-1/2 left-0 w-full border-t border-dashed border-gray-600 transform -translate-y-1/2"></div>
                        <div className="absolute top-1/2 left-1/2 h-full w-0.5 transform -translate-x-1/2 -translate-y-1/2 rotate-45 border-l border-dashed border-gray-600"></div>
                        <div className="absolute top-1/2 left-1/2 h-full w-0.5 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 border-l border-dashed border-gray-600"></div>

                        {/* Labels */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 text-xs">Visible Household</div>
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6 text-xs">Invisible Household</div>
                        <div className="absolute top-1/2 right-0 transform translate-x-6 -translate-y-1/2 text-xs">Visible Parental</div>
                        <div className="absolute top-1/2 left-0 transform -translate-x-6 -translate-y-1/2 text-xs">Invisible Parental</div>

                        {/* Mama's Shape - Purple */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <svg height="150" width="150" viewBox="0 0 200 200">
                            <polygon points="100,35 160,100 100,150 30,90" fill="rgba(147, 51, 234, 0.5)" stroke="#9333EA" strokeWidth="2" />
                          </svg>
                        </div>

                        {/* Papa's Shape - Teal */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <svg height="150" width="150" viewBox="0 0 200 200">
                            <polygon points="100,70 130,100 100,120 65,95" fill="rgba(20, 184, 166, 0.5)" stroke="#14B8A6" strokeWidth="2" />
                          </svg>
                        </div>

                        {/* Legend */}
                        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-500 mr-1"></div>
                            <span className="text-xs">Mama</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-teal-500 mr-1"></div>
                            <span className="text-xs">Papa</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">AI-powered detection of all four dimensions of parental load</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h3 className="text-xl font-medium mb-3 flex items-center">
                    <Target size={22} className="text-purple-600 mr-2" />
                    Actionable Insights, Not Just Data
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Unlike other productivity tools that simply report data, Allie focuses on driving behavioral change through targeted insights.
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="bg-purple-50 p-3 rounded">
                      <h4 className="font-medium text-purple-800 text-sm">Prioritized Recommendations</h4>
                      <p className="text-xs text-purple-700 mt-1">AI identifies the highest-impact changes for family balance with the least effort</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded">
                      <h4 className="font-medium text-blue-800 text-sm">Customized Action Plans</h4>
                      <p className="text-xs text-blue-700 mt-1">Each insight comes with specific, personalized steps to improve the identified imbalance</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <h4 className="font-medium text-green-800 text-sm">Progress-Based Feedback</h4>
                      <p className="text-xs text-green-700 mt-1">Dashboard adapts to show relevant metrics as families make progress</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h3 className="text-xl font-medium mb-3 flex items-center">
                    <BarChart3 size={22} className="text-purple-600 mr-2" />
                    Advanced Task Weight™ System
                  </h3>
                  <div className="mb-3">
                    <p className="text-sm text-gray-700 mb-2">Our proprietary algorithm analyzes tasks across 14 dimensions of mental load:</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-purple-50 p-2 rounded-lg flex items-center">
                      <span className="h-6 w-6 bg-purple-200 rounded-full text-purple-700 flex items-center justify-center mr-2">1</span>
                      <span className="text-xs">Time Commitment</span>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg flex items-center">
                      <span className="h-6 w-6 bg-purple-200 rounded-full text-purple-700 flex items-center justify-center mr-2">2</span>
                      <span className="text-xs">Cognitive Planning</span>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg flex items-center">
                      <span className="h-6 w-6 bg-purple-200 rounded-full text-purple-700 flex items-center justify-center mr-2">3</span>
                      <span className="text-xs">Emotional Labor</span>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg flex items-center">
                      <span className="h-6 w-6 bg-purple-200 rounded-full text-purple-700 flex items-center justify-center mr-2">4</span>
                      <span className="text-xs">Skill Complexity</span>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg flex items-center">
                      <span className="h-6 w-6 bg-purple-200 rounded-full text-purple-700 flex items-center justify-center mr-2">5</span>
                      <span className="text-xs">Relationship Impact</span>
                    </div>
                    <div className="bg-purple-50 p-2 rounded-lg flex items-center">
                      <span className="h-6 w-6 bg-purple-200 rounded-full text-purple-700 flex items-center justify-center mr-2">6</span>
                      <span className="text-xs">Follow-up Required</span>
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <button className="text-xs text-purple-600 flex items-center mt-1">
                        See all 14 dimensions <ChevronRight size={12} className="ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'insights' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3 flex items-center">
                  <Network size={22} className="text-purple-600 mr-2" />
                  Family Knowledge Graph
                </h3>
                <p className="text-gray-700 mb-4">
                  We built a proprietary knowledge graph that connects all family data points in a semantic network, creating unprecedented insight capabilities:
                </p>

                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <h4 className="font-medium text-sm mb-2 text-purple-800">Core Capabilities</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0 mt-0.5 mr-2">1</div>
                      <p className="text-sm">Maps relationships between events, tasks, people, and documents</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0 mt-0.5 mr-2">2</div>
                      <p className="text-sm">Reveals hidden patterns in family workload distribution</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0 mt-0.5 mr-2">3</div>
                      <p className="text-sm">Enables natural language queries about complex family relationships</p>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 flex-shrink-0 mt-0.5 mr-2">4</div>
                      <p className="text-sm">Powers proactive insights and personalized suggestions</p>
                    </li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-3 rounded-lg">
                  <p className="text-sm italic">
                    "Our knowledge graph is like a living model of a family's ecosystem, capturing not just what happens, but the relationships, patterns and dynamics between all elements."
                  </p>
                  <p className="text-xs text-right text-gray-500 mt-2">— Dr. Sarah Chen, Lead Data Scientist</p>
                </div>
              </div>

              <div className="relative bg-black p-5 rounded-lg text-white h-72 overflow-hidden">
                <h3 className="text-xl font-medium mb-3">Graph Visualization</h3>

                {/* Knowledge Graph Visualization */}
                <div className="absolute inset-0 mt-12 opacity-70">
                  {/* Nodes */}
                  <div className="absolute left-1/4 top-1/6 h-4 w-4 rounded-full bg-red-500"></div>
                  <div className="absolute left-2/3 top-1/4 h-4 w-4 rounded-full bg-red-500"></div>
                  <div className="absolute left-1/6 top-2/3 h-4 w-4 rounded-full bg-green-500"></div>
                  <div className="absolute left-3/4 top-3/5 h-4 w-4 rounded-full bg-green-500"></div>
                  <div className="absolute left-2/5 top-1/3 h-4 w-4 rounded-full bg-blue-500"></div>
                  <div className="absolute left-1/2 top-2/3 h-4 w-4 rounded-full bg-blue-500"></div>
                  <div className="absolute left-3/4 top-1/6 h-4 w-4 rounded-full bg-purple-500"></div>
                  <div className="absolute left-1/4 top-2/5 h-4 w-4 rounded-full bg-yellow-500"></div>
                  <div className="absolute left-3/5 top-4/5 h-4 w-4 rounded-full bg-yellow-500"></div>
                  <div className="absolute left-1/2 top-1/5 h-4 w-4 rounded-full bg-indigo-500"></div>
                  <div className="absolute left-1/6 top-1/3 h-4 w-4 rounded-full bg-indigo-500"></div>
                  <div className="absolute left-2/3 top-1/2 h-4 w-4 rounded-full bg-pink-500"></div>

                  {/* Edges */}
                  <svg className="absolute inset-0 h-full w-full">
                    {/* Person to Events */}
                    <line x1="25%" y1="16.6%" x2="40%" y2="33.3%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="25%" y1="16.6%" x2="16.6%" y2="33.3%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="66.6%" y1="25%" x2="50%" y2="20%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="66.6%" y1="25%" x2="66.6%" y2="50%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

                    {/* Tasks to People */}
                    <line x1="16.6%" y1="66.6%" x2="25%" y2="40%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="75%" y1="60%" x2="66.6%" y2="50%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="50%" y1="66.6%" x2="40%" y2="33.3%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

                    {/* Cross-connections */}
                    <line x1="40%" y1="33.3%" x2="60%" y2="80%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="75%" y1="16.6%" x2="66.6%" y2="25%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="75%" y1="16.6%" x2="50%" y2="20%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="16.6%" y1="33.3%" x2="25%" y2="40%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="50%" y1="20%" x2="40%" y2="33.3%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="66.6%" y1="50%" x2="75%" y2="60%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                    <line x1="60%" y1="80%" x2="50%" y2="66.6%" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                  </svg>
                </div>

                <div className="absolute bottom-3 left-3 right-3 bg-black bg-opacity-80 p-3 rounded-lg z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Entity Types</h4>
                    <div className="flex space-x-2">
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-red-500 mr-1"></div>
                        <span className="text-xs">People</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-1"></div>
                        <span className="text-xs">Tasks</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-blue-500 mr-1"></div>
                        <span className="text-xs">Events</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300">Interactive visualization enables families to explore connections and patterns in their data</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3 flex items-center">
                  <Database size={22} className="text-purple-600 mr-2" />
                  Why A Knowledge Graph?
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Traditional databases can't capture the complex web of relationships that exist in family life. Our graph database enables:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h4 className="font-medium text-purple-800 text-sm mb-1">Contextual Understanding</h4>
                    <p className="text-xs">Tasks exist in relation to people, events, locations, and other tasks, creating a rich context</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-800 text-sm mb-1">Pattern Detection</h4>
                    <p className="text-xs">AI analyzes the graph to identify recurring patterns and correlations in workload</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <h4 className="font-medium text-green-800 text-sm mb-1">Natural Language Queries</h4>
                    <p className="text-xs">Users can ask questions like "Who's handling most of the kids' doctor appointments?"</p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <h4 className="font-medium text-indigo-800 text-sm mb-1">Future Predictions</h4>
                    <p className="text-xs">Models future workload based on historical patterns in the graph</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-5 rounded-lg text-white">
                <h3 className="text-xl font-medium mb-3 flex items-center">
                  <Share2 size={22} className="text-white mr-2" />
                  Competitive Moat
                </h3>
                <p className="mb-3 text-sm">Our knowledge graph creates a unique competitive advantage no competitor can easily replicate:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Proprietary Entity Resolution</h4>
                    <p className="text-xs text-blue-100">Advanced ML models connect related entities across formats (email, chat, photos)</p>
                  </div>
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Network Effect</h4>
                    <p className="text-xs text-blue-100">Each new family improves our pattern detection and insight generation</p>
                  </div>
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">3.2M+ Relationships</h4>
                    <p className="text-xs text-blue-100">From beta users alone, a rich dataset no competitor can match</p>
                  </div>
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Patent-Pending</h4>
                    <p className="text-xs text-blue-100">Our approach to mental load visualization has legal protection</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'market' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-4 flex items-center">
                  <Target size={24} className="text-purple-600 mr-2" />
                  Driving Real Behavior Change
                </h3>
                <p className="mb-4">
                  Unlike tools that just report data, Allie's visualizations are specifically designed to drive meaningful behavior change in families:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="h-6 w-6 bg-purple-200 rounded-full text-purple-700 flex items-center justify-center mr-2">1</span>
                      <h4 className="font-medium text-purple-800">Awareness First</h4>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      Our research shows 78% of partners were "shocked" by workload data, creating an essential moment of recognition.
                    </p>
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-gray-500 italic">
                        "Revealing the hidden mental load dramatically shifts perspectives and opens the door to change."
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="h-6 w-6 bg-blue-200 rounded-full text-blue-700 flex items-center justify-center mr-2">2</span>
                      <h4 className="font-medium text-blue-800">Personalized Insights</h4>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      AI analyzes the knowledge graph to identify high-impact, personalized opportunities for rebalancing.
                    </p>
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-gray-500 italic">
                        "Our AI identifies the changes that will make the biggest difference with the least effort."
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <span className="h-6 w-6 bg-green-200 rounded-full text-green-700 flex items-center justify-center mr-2">3</span>
                      <h4 className="font-medium text-green-800">Continuous Feedback</h4>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      Weekly trend data creates accountability and prevents regression, reinforcing positive changes.
                    </p>
                    <div className="bg-white p-2 rounded">
                      <p className="text-xs text-gray-500 italic">
                        "Visual progress tracking creates a positive feedback loop that sustains new habits."
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-5 rounded-lg">
                  <h4 className="font-medium mb-3 text-center">Real User Testimonials</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-sm italic text-gray-700">
                        "The radar chart was a total revelation. My husband had no idea how much invisible work I was doing until he saw the visualization."
                      </p>
                      <p className="text-xs text-right text-gray-500 mt-2">— Emily T., Product Manager</p>
                    </div>
                    <div className="bg-white p-3 rounded shadow-sm">
                      <p className="text-sm italic text-gray-700">
                        "Seeing the trend line go from 70/30 to 55/45 over two months gave us concrete proof that we were making progress together."
                      </p>
                      <p className="text-xs text-right text-gray-500 mt-2">— Michael R., Software Engineer</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <BarChart3 size={22} className="text-purple-600 mr-2" />
                    Measured Impact on Families
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Workload Equity Improvement</span>
                        <span className="font-medium text-purple-700">42%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-purple-600 h-2.5 rounded-full" style={{width: '42%'}}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Relationship Satisfaction</span>
                        <span className="font-medium text-green-700">54%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full" style={{width: '54%'}}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Reduction in Workload Conflicts</span>
                        <span className="font-medium text-blue-700">68%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{width: '68%'}}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Emotional Well-being Score</span>
                        <span className="font-medium text-pink-700">47%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div className="bg-pink-600 h-2.5 rounded-full" style={{width: '47%'}}></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-center text-gray-500">
                    Based on surveys of 2,450+ beta users after 3 months of consistent Allie usage
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-5 rounded-lg text-white">
                  <h3 className="text-lg font-medium mb-4">How Our Reports Drive Change</h3>

                  <div className="space-y-3">
                    <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Bias-Free Analysis</h4>
                      <p className="text-xs">
                        Unlike subjective arguments, our data visualization creates a neutral third-party perspective that both partners accept.
                      </p>
                    </div>

                    <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Pattern Recognition</h4>
                      <p className="text-xs">
                        AI identifies recurring bottlenecks and suggests targeted interventions that address root causes, not just symptoms.
                      </p>
                    </div>

                    <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Cognitive Reframing</h4>
                      <p className="text-xs">
                        Visual data transforms ambiguous feelings into concrete metrics, making previously invisible work visible and valued.
                      </p>
                    </div>

                    <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Positive Reinforcement</h4>
                      <p className="text-xs">
                        Celebrates progress rather than emphasizing deficits, creating motivational momentum for continued improvement.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-black text-white p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-3 flex items-center">
            <Radar size={24} className="text-purple-400 mr-2" />
            AI-Driven Insights: The Competitive Edge
          </h3>
          <p className="mb-4">
            Allie's reporting doesn't just present data - it uncovers hidden patterns, identifies high-impact opportunities, and suggests personalized interventions. Our family knowledge graph and four-dimensional parental load visualization create an unmatched platform for driving meaningful behavior change.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 p-4 rounded-lg">
              <h4 className="font-medium text-center mb-2">Radar Visualization</h4>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-start">
                  <span className="h-4 w-4 rounded-full bg-purple-700 flex items-center justify-center text-purple-200 text-[10px] flex-shrink-0 mt-0.5 mr-1.5">1</span>
                  <span>Reveals all 4 dimensions of mental load (visible/invisible household/parental tasks)</span>
                </li>
                <li className="flex items-start">
                  <span className="h-4 w-4 rounded-full bg-purple-700 flex items-center justify-center text-purple-200 text-[10px] flex-shrink-0 mt-0.5 mr-1.5">2</span>
                  <span>Visualizes imbalances that were previously invisible and undiscussable</span>
                </li>
                <li className="flex items-start">
                  <span className="h-4 w-4 rounded-full bg-purple-700 flex items-center justify-center text-purple-200 text-[10px] flex-shrink-0 mt-0.5 mr-1.5">3</span>
                  <span>Creates shared language and metrics for productive discussions</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-900 to-cyan-900 p-4 rounded-lg">
              <h4 className="font-medium text-center mb-2">Knowledge Graph</h4>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-start">
                  <span className="h-4 w-4 rounded-full bg-blue-700 flex items-center justify-center text-blue-200 text-[10px] flex-shrink-0 mt-0.5 mr-1.5">1</span>
                  <span>Maps complex relationships between tasks, events, people and locations</span>
                </li>
                <li className="flex items-start">
                  <span className="h-4 w-4 rounded-full bg-blue-700 flex items-center justify-center text-blue-200 text-[10px] flex-shrink-0 mt-0.5 mr-1.5">2</span>
                  <span>Powers natural language queries about family distribution of labor</span>
                </li>
                <li className="flex items-start">
                  <span className="h-4 w-4 rounded-full bg-blue-700 flex items-center justify-center text-blue-200 text-[10px] flex-shrink-0 mt-0.5 mr-1.5">3</span>
                  <span>Creates compounding data advantage other solutions can't match</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-900 to-teal-900 p-4 rounded-lg">
              <h4 className="font-medium text-center mb-2">Actionable Insights</h4>
              <ul className="text-xs space-y-1.5">
                <li className="flex items-start">
                  <span className="h-4 w-4 rounded-full bg-green-700 flex items-center justify-center text-green-200 text-[10px] flex-shrink-0 mt-0.5 mr-1.5">1</span>
                  <span>Focuses on change, not just reporting – 94% of couples take action</span>
                </li>
                <li className="flex items-start">
                  <span className="h-4 w-4 rounded-full bg-green-700 flex items-center justify-center text-green-200 text-[10px] flex-shrink-0 mt-0.5 mr-1.5">2</span>
                  <span>Identifies high-impact opportunities through proprietary AI analysis</span>
                </li>
                <li className="flex items-start">
                  <span className="h-4 w-4 rounded-full bg-green-700 flex items-center justify-center text-green-200 text-[10px] flex-shrink-0 mt-0.5 mr-1.5">3</span>
                  <span>Creates quantifiable improvements in balance and relationship health</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkloadVisualizationSlide;