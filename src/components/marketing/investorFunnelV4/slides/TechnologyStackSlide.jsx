import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card } from './components';
import { Layers, Database, Shield, Cpu, GitBranch, Workflow } from 'lucide-react';

const TechnologyStackSlide = () => {
  return (
    <SlideTemplate
      title="Technology Stack"
      subtitle="Current foundations and future architecture vision (with your investment!)"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 flex items-center mb-2">
            <Layers className="mr-2" size={24} />
            Future Vision Architecture
          </h3>
          <div className="bg-amber-100 p-3 rounded-lg border border-amber-300 mb-3">
            <p className="text-sm text-amber-800 flex items-center">
              <span className="mr-2">💰</span>
              <span><strong>Coming soon!</strong> This is what we'll build with your investment. Currently running on Claude and Firebase for our MVP.</span>
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                <Cpu size={18} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">AI Layer</h4>
                <p className="text-sm text-gray-700">
                  Large language models fine-tuned on family dynamics, mental load research, 
                  and relationship psychology, with specialized task distribution algorithms.
                </p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                <GitBranch size={18} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Knowledge Graph</h4>
                <p className="text-sm text-gray-700">
                  Neo4j-powered graph database capturing complex family relationships, events, 
                  task dependencies, and the weighted distribution of mental load.
                </p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                <Workflow size={18} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Event Processing</h4>
                <p className="text-sm text-gray-700">
                  Real-time event streaming architecture for calendar integration, task monitoring, 
                  and proactive notifications using Kafka and serverless functions.
                </p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                <Database size={18} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Data Storage</h4>
                <p className="text-sm text-gray-700">
                  Multi-tier storage system with encrypted document storage, 
                  high-performance time series data, and secure family vaults.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <Shield className="mr-2 text-indigo-600" size={24} />
            Security & Privacy
          </h3>
          
          <p className="text-gray-700 mb-4">
            Built from the ground up with family privacy and data security as core principles, 
            not just after-the-fact compliance features.
          </p>
          
          <div className="space-y-4">
            <div className="border-l-4 border-indigo-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-1">Zero-Knowledge Architecture</h4>
              <p className="text-sm text-gray-600">
                End-to-end encryption ensures that only authorized family members can access sensitive 
                information. Allie's systems cannot read private family data.
              </p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-1">Role-Based Access Control</h4>
              <p className="text-sm text-gray-600">
                Granular permission system allows families to control exactly what information is shared 
                with whom, including child-appropriate access levels.
              </p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-1">Ethical AI Principles</h4>
              <p className="text-sm text-gray-600">
                AI training and validation processes designed with fairness, transparency, and 
                bias mitigation at their core, with regular ethical audits.
              </p>
            </div>
            
            <div className="border-l-4 border-emerald-500 pl-4">
              <h4 className="font-medium text-gray-800 mb-1">SOC2 & GDPR Compliance</h4>
              <p className="text-sm text-gray-600">
                Full compliance with international data protection standards, including the strictest 
                regulations for family and child data protection.
              </p>
            </div>
          </div>
          
          <div className="mt-5 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-2 flex items-center">
              <Shield size={18} className="text-emerald-600 mr-2" />
              Family Data Control
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li className="flex items-center">
                <svg className="h-4 w-4 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Complete data portability with export options
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                One-click account deletion with full data removal
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Transparent data usage policies and controls
              </li>
              <li className="flex items-center">
                <svg className="h-4 w-4 text-emerald-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No data sold to advertisers or third parties
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 p-4 rounded-lg mb-8">
        <h3 className="text-lg font-semibold text-indigo-800 mb-3">Current MVP Tech Stack</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-indigo-200">
            <h4 className="font-medium text-indigo-700 mb-2 flex items-center">
              <Cpu size={20} className="text-indigo-600 mr-2" />
              AI Engine
            </h4>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Claude by Anthropic</span> - Leveraging Claude's capabilities 
              for understanding complex family contexts and providing natural language interactions.
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-indigo-200">
            <h4 className="font-medium text-indigo-700 mb-2 flex items-center">
              <Database size={20} className="text-indigo-600 mr-2" />
              Storage & Hosting
            </h4>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Firebase</span> - Secure, scalable storage for family data 
              with real-time updates, authentication, and web hosting infrastructure.
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="Future Scalable Infrastructure" 
          icon={<Layers size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <div className="mb-2 p-1 border border-amber-200 rounded bg-amber-50">
            <p className="text-xs text-amber-700 text-center">💸 With Series A funding 💸</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cloud Architecture:</span>
              <span className="font-medium text-gray-800">AWS & Azure Multi-Cloud</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Containerization:</span>
              <span className="font-medium text-gray-800">Kubernetes Orchestration</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Service Mesh:</span>
              <span className="font-medium text-gray-800">Istio with mTLS Security</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">CI/CD Pipeline:</span>
              <span className="font-medium text-gray-800">GitLab CI with Canary Deployments</span>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Planned Integrations" 
          icon={<Workflow size={24} />} 
          className="bg-gradient-to-br from-white to-gray-100 border border-gray-200"
        >
          <div className="mb-2 p-1 border border-amber-200 rounded bg-amber-50">
            <p className="text-xs text-amber-700 text-center">🔄 On our post-funding roadmap 🔄</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <img src="https://placehold.co/30x30/indigo/white?text=G" className="w-7 h-7 rounded mb-1" alt="Google" />
              <span className="text-xs text-gray-700">Google Suite</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <img src="https://placehold.co/30x30/blue/white?text=M" className="w-7 h-7 rounded mb-1" alt="Microsoft" />
              <span className="text-xs text-gray-700">Microsoft 365</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <img src="https://placehold.co/30x30/teal/white?text=A" className="w-7 h-7 rounded mb-1" alt="Apple" />
              <span className="text-xs text-gray-700">Apple Calendar</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-gray-50 rounded-lg">
              <img src="https://placehold.co/30x30/orange/white?text=Z" className="w-7 h-7 rounded mb-1" alt="Zoom" />
              <span className="text-xs text-gray-700">Zoom</span>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Technical Vision" 
          icon={<Cpu size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <div className="mb-2 p-1 border border-amber-200 rounded bg-amber-50">
            <p className="text-xs text-amber-700 text-center">✨ This is why we need your investment! ✨</p>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-amber-500 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Task Weighting Engine:</strong> Algorithms for measuring and balancing cognitive load</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-amber-500 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Family-Specific AI:</strong> Customized models for each family's unique dynamics</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-amber-500 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span><strong>Knowledge Graph:</strong> Rich connections between family data points</span>
            </li>
          </ul>
        </Card>
      </div>
    </SlideTemplate>
  );
};

export default TechnologyStackSlide;