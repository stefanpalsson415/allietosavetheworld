import React, { useState } from 'react';
import { Code, Database, Server, Cloud, Shield, Braces, Cpu, Lock } from 'lucide-react';

const TechnologyStackSlide = () => {
  const [activeCategory, setActiveCategory] = useState('ai');
  
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Technology Stack</h2>
        
        <div className="mb-8">
          <div className="grid grid-cols-4 mb-4">
            <button 
              className={`py-3 px-2 font-medium text-sm ${activeCategory === 'ai' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveCategory('ai')}
            >
              <Cpu size={18} className="mx-auto mb-1" />
              AI & ML
            </button>
            <button 
              className={`py-3 px-2 font-medium text-sm ${activeCategory === 'backend' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveCategory('backend')}
            >
              <Server size={18} className="mx-auto mb-1" />
              Backend
            </button>
            <button 
              className={`py-3 px-2 font-medium text-sm ${activeCategory === 'frontend' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveCategory('frontend')}
            >
              <Braces size={18} className="mx-auto mb-1" />
              Frontend
            </button>
            <button 
              className={`py-3 px-2 font-medium text-sm ${activeCategory === 'security' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'}`}
              onClick={() => setActiveCategory('security')}
            >
              <Shield size={18} className="mx-auto mb-1" />
              Security
            </button>
          </div>
        </div>
        
        {activeCategory === 'ai' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                  <Cpu size={24} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-medium">AI & Machine Learning</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Natural Language Understanding</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Our proprietary NLU system specializes in family context, with 94% accuracy in identifying household tasks, events, and responsibilities from natural language.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-purple-50 p-2 rounded text-center text-purple-700">Claude 3.5 Sonnet</div>
                    <div className="bg-purple-50 p-2 rounded text-center text-purple-700">Custom LLM Fine-tuning</div>
                    <div className="bg-purple-50 p-2 rounded text-center text-purple-700">BERT Embeddings</div>
                    <div className="bg-purple-50 p-2 rounded text-center text-purple-700">Named Entity Recognition</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Task Weight Intelligence</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Our Task Weight neural network quantifies invisible mental load, analyzing text, context, and patterns to assign appropriate weight and create equitable distribution.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">TensorFlow</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Scikit-learn</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">PyTorch</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Custom Neural Networks</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-black text-white p-4 rounded-lg">
                <h4 className="font-medium mb-2">AI Competitive Advantage</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 mr-2">1</div>
                    <div>
                      <strong>Proprietary Dataset:</strong> 2.4M labeled examples of family mental load tasks
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 mr-2">2</div>
                    <div>
                      <strong>Unique Models:</strong> Task weight calculation system with 89% agreement with expert human analysis
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="h-5 w-5 rounded-full bg-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 mr-2">3</div>
                    <div>
                      <strong>Family Context Awareness:</strong> ML models that understand family-specific jargon, patterns, and needs
                    </div>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-4">AI Architecture</h3>
                
                <div className="relative h-72 bg-gray-50 rounded-lg p-4 overflow-hidden">
                  {/* AI System Architecture Diagram */}
                  <div className="absolute top-4 left-4 right-4 h-12 bg-purple-100 rounded flex items-center justify-center">
                    <span className="font-medium text-purple-800">Input Layer: Family Data Sources</span>
                  </div>
                  
                  <div className="absolute top-20 left-4 right-4 h-12 bg-blue-100 rounded flex items-center justify-center">
                    <span className="font-medium text-blue-800">Processing Layer: AI Orchestration</span>
                  </div>
                  
                  <div className="absolute top-36 left-4 right-4 h-12 bg-green-100 rounded flex items-center justify-center">
                    <span className="font-medium text-green-800">Analysis Layer: Task Weight & Context</span>
                  </div>
                  
                  <div className="absolute top-52 left-4 right-4 h-12 bg-yellow-100 rounded flex items-center justify-center">
                    <span className="font-medium text-yellow-800">Output Layer: Personalized Insights</span>
                  </div>
                  
                  {/* Connecting Lines */}
                  <div className="absolute left-1/2 top-16 h-4 w-0.5 bg-gray-400"></div>
                  <div className="absolute left-1/2 top-32 h-4 w-0.5 bg-gray-400"></div>
                  <div className="absolute left-1/2 top-48 h-4 w-0.5 bg-gray-400"></div>
                </div>
                
                <div className="mt-4 text-sm text-center text-gray-500">
                  Allie's multi-layered AI architecture processes diverse family data through our proprietary orchestration system
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Data Science Pipeline</h3>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <span className="font-bold text-indigo-600">1</span>
                    </div>
                    <h4 className="text-sm font-medium text-center mb-1">Data Collection</h4>
                    <p className="text-xs text-gray-600 text-center">
                      Passive collection from calendars, messages, and activity patterns
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <span className="font-bold text-blue-600">2</span>
                    </div>
                    <h4 className="text-sm font-medium text-center mb-1">Processing</h4>
                    <p className="text-xs text-gray-600 text-center">
                      Event extraction, deduplication, and task identification
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2 mx-auto">
                      <span className="font-bold text-green-600">3</span>
                    </div>
                    <h4 className="text-sm font-medium text-center mb-1">Insight Engine</h4>
                    <p className="text-xs text-gray-600 text-center">
                      Pattern detection, equity analysis, and personalized recommendations
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">ML Training & Evaluation</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Task Detection Accuracy</span>
                      <span className="font-medium">94%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{width: '94%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Context Understanding</span>
                      <span className="font-medium">87%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '87%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Task Weight Precision</span>
                      <span className="font-medium">89%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '89%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeCategory === 'backend' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <Server size={24} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-medium">Backend Infrastructure</h3>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-2">Cloud Architecture</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Highly available, auto-scaling cloud infrastructure with multi-region redundancy and 99.99% uptime.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">AWS</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Kubernetes</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Docker</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Terraform</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">GitHub Actions</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">CircleCI</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">API & Services</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Microservices architecture with GraphQL API gateway for flexible, client-driven data querying.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">Node.js</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">GraphQL</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">Express</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">Apollo</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">gRPC</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">Redis</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Database Architecture</h3>
                <div className="flex justify-center mb-4">
                  <Database size={48} className="text-blue-600" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Primary Data</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      Event-sourced core with CQRS pattern for high throughput and data integrity
                    </p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <span className="bg-blue-50 px-2 py-0.5 rounded text-blue-700">PostgreSQL</span>
                      <span className="bg-blue-50 px-2 py-0.5 rounded text-blue-700">MongoDB</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Analytics</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      Column-oriented analytics database for real-time workload analysis
                    </p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <span className="bg-green-50 px-2 py-0.5 rounded text-green-700">BigQuery</span>
                      <span className="bg-green-50 px-2 py-0.5 rounded text-green-700">Redshift</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Search</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      Full-text search for intelligent task and event retrieval
                    </p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <span className="bg-yellow-50 px-2 py-0.5 rounded text-yellow-700">Elasticsearch</span>
                      <span className="bg-yellow-50 px-2 py-0.5 rounded text-yellow-700">Algolia</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium text-sm mb-1">Caching</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      Multi-layered caching strategy for high performance user experience
                    </p>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <span className="bg-red-50 px-2 py-0.5 rounded text-red-700">Redis</span>
                      <span className="bg-red-50 px-2 py-0.5 rounded text-red-700">ElastiCache</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Data Integration Layer</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Calendar Integration</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Bi-directional sync with all major calendar providers with specialized event processing.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Google Calendar</div>
                      <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Apple Calendar</div>
                      <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Outlook</div>
                      <div className="bg-blue-50 p-2 rounded text-center text-blue-700">ProtonCalendar</div>
                      <div className="bg-blue-50 p-2 rounded text-center text-blue-700">CalDAV</div>
                      <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Custom APIs</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Third-Party Services</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Integration with task management, messaging, and lifestyle applications.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-green-50 p-2 rounded text-center text-green-700">Slack</div>
                      <div className="bg-green-50 p-2 rounded text-center text-green-700">Google Tasks</div>
                      <div className="bg-green-50 p-2 rounded text-center text-green-700">Todoist</div>
                      <div className="bg-green-50 p-2 rounded text-center text-green-700">Notion</div>
                      <div className="bg-green-50 p-2 rounded text-center text-green-700">Trello</div>
                      <div className="bg-green-50 p-2 rounded text-center text-green-700">WhatsApp</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 bg-black text-white p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Integration Competitive Edge</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 mr-2">
                        <Check size={12} />
                      </div>
                      <div>
                        <strong>Proprietary Event Normalization:</strong> Unified event representation across all platforms
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 mr-2">
                        <Check size={12} />
                      </div>
                      <div>
                        <strong>Zero-click Authorization:</strong> OAuth flows that simplify integration to a single tap
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 mr-2">
                        <Check size={12} />
                      </div>
                      <div>
                        <strong>Intelligent Conflict Resolution:</strong> ML-driven resolution of cross-platform conflicts
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Architecture Philosophy</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <Cloud size={24} className="text-purple-600 mb-2" />
                    <h4 className="font-medium text-sm mb-1">Cloud Native</h4>
                    <p className="text-xs text-gray-700">
                      Fully containerized, serverless-first architecture with auto-scaling to handle varying loads
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Code size={24} className="text-blue-600 mb-2" />
                    <h4 className="font-medium text-sm mb-1">Modular Design</h4>
                    <p className="text-xs text-gray-700">
                      Microservices with clear boundaries for independent scaling and fast development cycles
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <Shield size={24} className="text-green-600 mb-2" />
                    <h4 className="font-medium text-sm mb-1">Security First</h4>
                    <p className="text-xs text-gray-700">
                      Zero-trust architecture with end-to-end encryption and comprehensive audit logging
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <Server size={24} className="text-yellow-600 mb-2" />
                    <h4 className="font-medium text-sm mb-1">Resilient Systems</h4>
                    <p className="text-xs text-gray-700">
                      Fault-tolerant design with automatic failover and self-healing capabilities
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">Scaling Strategy</h3>
                <p className="text-sm mb-4">
                  Our architecture is designed to scale to millions of families with consistent performance and reliability.
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-100">99.99%</p>
                    <p className="text-xs text-blue-200">uptime SLA</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-100">&lt;100ms</p>
                    <p className="text-xs text-blue-200">API response time</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-100">10M+</p>
                    <p className="text-xs text-blue-200">family capacity</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeCategory === 'frontend' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                  <Braces size={24} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-medium">Frontend Technologies</h3>
              </div>
              
              <div className="space-y-5 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Web Application</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Modern, high-performance React application with TypeScript for type safety and code quality.
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">React</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">TypeScript</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Next.js</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Apollo</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Redux</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">TailwindCSS</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Framer Motion</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">React Query</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Mobile Applications</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Native iOS and Android applications with React Native for cross-platform efficiency.
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">React Native</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">Expo</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">Native Modules</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">Swift</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">Kotlin</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">React Navigation</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">Push Notifications</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">Background Sync</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Design System</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Comprehensive component library with accessibility and cross-platform consistency.
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-purple-50 p-2 rounded text-center text-purple-700">Storybook</div>
                    <div className="bg-purple-50 p-2 rounded text-center text-purple-700">Figma</div>
                    <div className="bg-purple-50 p-2 rounded text-center text-purple-700">Styled Components</div>
                    <div className="bg-purple-50 p-2 rounded text-center text-purple-700">Emotion</div>
                    <div className="bg-purple-50 p-2 rounded text-center text-purple-700">WCAG 2.1 AA</div>
                    <div className="bg-purple-50 p-2 rounded text-center text-purple-700">i18n</div>
                    <div className="bg-purple-50 p-2 rounded text-center text-purple-700">Theme System</div>
                    <div className="bg-purple-50 p-2 rounded text-center text-purple-700">Design Tokens</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-black text-white p-4 rounded-lg">
                <h4 className="font-medium mb-2">Frontend Testing Strategy</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Unit Tests</span>
                    <span>93% coverage</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '93%'}}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Integration Tests</span>
                    <span>87% coverage</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '87%'}}></div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>E2E Tests</span>
                    <span>76% coverage</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{width: '76%'}}></div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded">Jest</span>
                  <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded">React Testing Library</span>
                  <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded">Cypress</span>
                  <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded">Playwright</span>
                  <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded">Detox</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-4">User Experience</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                      <span className="font-medium text-indigo-600">UX</span>
                    </div>
                    <h4 className="font-medium text-sm mb-1">User-Centered Design</h4>
                    <p className="text-xs text-gray-600">
                      Extensive user research and testing with our target demographic ensures intuitive, frictionless experiences.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                      <span className="font-medium text-green-600">A11Y</span>
                    </div>
                    <h4 className="font-medium text-sm mb-1">Accessibility</h4>
                    <p className="text-xs text-gray-600">
                      WCAG 2.1 AA compliant with comprehensive screenreader support and keyboard navigation.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                      <span className="font-medium text-blue-600">PWA</span>
                    </div>
                    <h4 className="font-medium text-sm mb-1">Progressive Web App</h4>
                    <p className="text-xs text-gray-600">
                      Offline capabilities, push notifications, and app-like experience with web technologies.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                      <span className="font-medium text-purple-600">i18n</span>
                    </div>
                    <h4 className="font-medium text-sm mb-1">Internationalization</h4>
                    <p className="text-xs text-gray-600">
                      Full support for 12 languages with right-to-left text rendering where needed.
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-lg text-white">
                  <h4 className="font-medium mb-2">UX Research</h4>
                  <p className="text-sm mb-3">
                    Over 700 hours of usability testing and 2,400 user interviews inform our design decisions.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xl font-bold">97%</p>
                      <p className="text-xs">task completion</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">4.8/5</p>
                      <p className="text-xs">user satisfaction</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">89%</p>
                      <p className="text-xs">retention rate</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Performance Optimization</h3>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="font-medium mb-2">Core Web Vitals</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Largest Contentful Paint</span>
                          <span>1.2s</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '95%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>First Input Delay</span>
                          <span>18ms</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '98%'}}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Cumulative Layout Shift</span>
                          <span>0.04</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '97%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Bundle Optimization</h4>
                      <p className="text-xs text-gray-700">
                        Code splitting, tree shaking, and dynamic imports reduce initial load times
                      </p>
                      <div className="mt-2 text-xs font-medium text-blue-700">92kb initial bundle</div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Mobile Performance</h4>
                      <p className="text-xs text-gray-700">
                        Optimized rendering for resource-constrained devices
                      </p>
                      <div className="mt-2 text-xs font-medium text-green-700">60fps animations</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Platform Support</h4>
                <div className="grid grid-cols-2 gap-y-4">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white mr-2">
                      <span className="text-sm">iOS</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">iOS 14+</p>
                      <p className="text-xs text-gray-500">Native app & PWA</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-green-700 flex items-center justify-center text-white mr-2">
                      <span className="text-sm">A</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Android 9+</p>
                      <p className="text-xs text-gray-500">Native app & PWA</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white mr-2">
                      <span className="text-sm">W</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Web</p>
                      <p className="text-xs text-gray-500">All modern browsers</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white mr-2">
                      <span className="text-sm">D</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Desktop</p>
                      <p className="text-xs text-gray-500">PWA & responsive</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeCategory === 'security' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <Shield size={24} className="text-red-600" />
                  </div>
                  <h3 className="text-xl font-medium">Security Architecture</h3>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-2">Data Protection</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Comprehensive encryption strategy for data at rest and in transit with zero access to user content.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">AES-256</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">TLS 1.3</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Perfect Forward Secrecy</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">E2E Encryption</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">HMAC</div>
                    <div className="bg-blue-50 p-2 rounded text-center text-blue-700">Key Rotation</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Identity & Access</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Enterprise-grade authentication with multi-factor options and granular permission controls.
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">OAuth 2.0</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">OIDC</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">SAML 2.0</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">MFA</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">RBAC</div>
                    <div className="bg-green-50 p-2 rounded text-center text-green-700">JWT</div>
                  </div>
                </div>
                
                <div className="mt-5 bg-black text-white p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Security Posture</h4>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-white bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                        <Lock size={16} className="text-white" />
                      </div>
                      <div>
                        <h5 className="font-medium text-sm">Zero Trust Architecture</h5>
                        <p className="text-xs text-gray-300">All requests authenticated and authorized regardless of origin</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-white bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                        <Shield size={16} className="text-white" />
                      </div>
                      <div>
                        <h5 className="font-medium text-sm">Defense in Depth</h5>
                        <p className="text-xs text-gray-300">Multiple security layers with redundant controls</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="h-8 w-8 bg-white bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                        <Code size={16} className="text-white" />
                      </div>
                      <div>
                        <h5 className="font-medium text-sm">Secure SDLC</h5>
                        <p className="text-xs text-gray-300">Security integrated into every stage of development</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Privacy Controls</h3>
                
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="font-bold text-purple-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Local-First Processing</h4>
                      <p className="text-sm text-gray-600">
                        AI processing happens on-device when possible, minimizing data transmission to our servers
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="font-bold text-purple-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Granular Data Permissions</h4>
                      <p className="text-sm text-gray-600">
                        Users control exactly which data sources are used for analysis and automation
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <span className="font-bold text-purple-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Data Minimization</h4>
                      <p className="text-sm text-gray-600">
                        We only collect what's needed, anonymize where possible, and auto-delete data after its useful life
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-medium mb-3">Compliance & Certifications</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-2">
                      <Shield size={24} className="text-blue-600" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">SOC 2 Type II</h4>
                    <p className="text-xs text-gray-600">
                      Certified security, availability, confidentiality, and privacy controls
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <Shield size={24} className="text-green-600" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">GDPR Compliant</h4>
                    <p className="text-xs text-gray-600">
                      Full compliance with EU data protection regulations
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-2">
                      <Shield size={24} className="text-red-600" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">CCPA Compliant</h4>
                    <p className="text-xs text-gray-600">
                      California Consumer Privacy Act aligned data practices
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="w-12 h-12 mx-auto bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                      <Shield size={24} className="text-yellow-600" />
                    </div>
                    <h4 className="font-medium text-sm mb-1">ISO 27001</h4>
                    <p className="text-xs text-gray-600">
                      Certified information security management system
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Regular Security Testing</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-purple-600">P</span>
                        </div>
                        <span className="text-sm">Penetration Testing</span>
                      </div>
                      <span className="text-xs text-gray-500">Quarterly</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-600">V</span>
                        </div>
                        <span className="text-sm">Vulnerability Scanning</span>
                      </div>
                      <span className="text-xs text-gray-500">Weekly</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-green-600">C</span>
                        </div>
                        <span className="text-sm">Code Security Reviews</span>
                      </div>
                      <span className="text-xs text-gray-500">Every PR</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-red-600">B</span>
                        </div>
                        <span className="text-sm">Bug Bounty Program</span>
                      </div>
                      <span className="text-xs text-gray-500">Ongoing</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-600 to-purple-600 p-5 rounded-lg text-white">
                <h3 className="text-xl font-medium mb-3">Security Innovation</h3>
                
                <div className="space-y-4 mb-4">
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <h4 className="font-medium mb-1">AI-Powered Threat Detection</h4>
                    <p className="text-sm">
                      Machine learning anomaly detection identifies suspicious patterns and potential account compromise in real-time
                    </p>
                  </div>
                  
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <h4 className="font-medium mb-1">Privacy-Preserving Analytics</h4>
                    <p className="text-sm">
                      Differential privacy techniques allow for insights without exposing individual user data
                    </p>
                  </div>
                  
                  <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                    <h4 className="font-medium mb-1">Family-Safe Encryption</h4>
                    <p className="text-sm">
                      Multi-user encryption model preserves privacy while enabling safe family data sharing
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <div className="inline-block bg-white px-4 py-2 rounded-full text-purple-600 font-medium text-sm">
                    Security is a core product feature, not an afterthought
                  </div>
                </div>
              </div>
              
              <div className="bg-black p-4 rounded-lg text-white">
                <h3 className="text-lg font-medium mb-3">Security by the Numbers</h3>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold">$0</p>
                    <p className="text-xs text-gray-400">customer data breaches</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">99.99%</p>
                    <p className="text-xs text-gray-400">uptime SLA</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">24/7</p>
                    <p className="text-xs text-gray-400">security monitoring</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">100%</p>
                    <p className="text-xs text-gray-400">security training</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white mt-8 p-6 rounded-lg shadow-sm">
          <h3 className="text-xl font-medium mb-4">Our Engineering Principles</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <Code size={24} className="text-purple-600" />
              </div>
              <h4 className="font-medium mb-2">Build for Scale</h4>
              <p className="text-sm text-gray-600">
                Every component designed to handle millions of families with consistent performance
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Shield size={24} className="text-blue-600" />
              </div>
              <h4 className="font-medium mb-2">Security First</h4>
              <p className="text-sm text-gray-600">
                Privacy and security baked into architecture from day one, not added later
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Cpu size={24} className="text-green-600" />
              </div>
              <h4 className="font-medium mb-2">AI-Native</h4>
              <p className="text-sm text-gray-600">
                Systems designed around AI capabilities rather than AI bolted onto legacy systems
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                <Cloud size={24} className="text-yellow-600" />
              </div>
              <h4 className="font-medium mb-2">Cloud Flexibility</h4>
              <p className="text-sm text-gray-600">
                Multi-cloud infrastructure with seamless migration capabilities
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Check = ({ size, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default TechnologyStackSlide;