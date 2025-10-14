import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card } from './components';
import { Database, GitBranch, Shield, Landmark } from 'lucide-react';

const DataAndKnowledgeGraphSlide = () => {
  return (
    <SlideTemplate
      title="Family Knowledge Graph"
      subtitle="Creating an intelligent network of family data for seamless information management"
    >
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-indigo-700 mb-4">Knowledge Graph: The Heart of Allie's Intelligence</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-gray-700 mb-4">
              Unlike traditional apps that store disconnected pieces of information, 
              Allie builds a comprehensive knowledge graph that captures:
            </p>
            
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Family members and their relationships</li>
              <li>Responsibilities, preferences, and capabilities</li>
              <li>Historical patterns and behaviors</li>
              <li>Calendar events and how they relate to each other</li>
              <li>Household logistics and regular commitments</li>
              <li>Special dates, traditions, and milestones</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-5">
            <h4 className="text-lg font-medium text-indigo-800 mb-3">Knowledge Graph in Action: Real-World Example</h4>
            <div className="mb-4 p-3 bg-white bg-opacity-70 rounded-lg border border-indigo-200">
              <h5 className="font-medium text-indigo-700 text-sm mb-2">Scenario: "Show me Olivia's school documents for this month"</h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-indigo-100 rounded-md">
                  <p className="font-medium text-indigo-800">Nodes</p>
                  <p className="text-gray-700">• School documents</p>
                  <p className="text-gray-700">• Vaccination records</p>
                  <p className="text-gray-700">• Permission slips</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-md">
                  <p className="font-medium text-blue-800">Relationships</p>
                  <p className="text-gray-700">• Child → Document</p>
                  <p className="text-gray-700">• Document → Event</p>
                  <p className="text-gray-700">• Document → Provider</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-md">
                  <p className="font-medium text-purple-800">Result</p>
                  <p className="text-gray-700">• Only relevant documents</p>
                  <p className="text-gray-700">• Context-aware filtering</p>
                  <p className="text-gray-700">• Precise time filtering</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center text-center w-1/3">
                <Database size={28} className="text-gray-500 mb-2" />
                <div className="bg-gray-200 rounded-md px-2 py-1 w-full">
                  <p className="text-xs text-gray-700">Traditional DB</p>
                </div>
                <div className="mt-1 h-14 flex items-center">
                  <p className="text-xs text-gray-500">Isolated data requiring complex queries</p>
                </div>
              </div>
              
              <div className="text-2xl text-indigo-400">→</div>
              
              <div className="flex flex-col items-center text-center w-1/3">
                <GitBranch size={28} className="text-indigo-600 mb-2" />
                <div className="bg-indigo-200 rounded-md px-2 py-1 w-full">
                  <p className="text-xs text-indigo-700">Knowledge Graph</p>
                </div>
                <div className="mt-1 h-14 flex items-center">
                  <p className="text-xs text-indigo-600">Natural queries across connected data</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="Rich Contextual Understanding" 
          icon={<GitBranch size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <p className="text-gray-700">
            Allie understands complex family relationships and dependencies, allowing for nuanced 
            support that accounts for the full context of family life.
          </p>
        </Card>
        
        <Card 
          title="Privacy & Security" 
          icon={<Shield size={24} />} 
          className="bg-gradient-to-br from-green-50 to-emerald-100"
        >
          <p className="text-gray-700">
            All family data is encrypted, private, and never used for advertising. 
            Only approved family members have access to your knowledge graph.
          </p>
        </Card>
        
        <Card 
          title="Family Data Ownership" 
          icon={<Landmark size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <p className="text-gray-700">
            Families maintain complete ownership of their data, with full export capabilities 
            and the ability to delete information at any time.
          </p>
        </Card>
      </div>
    </SlideTemplate>
  );
};

export default DataAndKnowledgeGraphSlide;