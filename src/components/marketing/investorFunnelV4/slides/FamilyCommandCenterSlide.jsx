import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card } from './components';
import { LayoutDashboard, Calendar, MessageSquare, FileText, Clock, Monitor } from 'lucide-react';

const FamilyCommandCenterSlide = () => {
  return (
    <SlideTemplate
      title="Family Command Center"
      subtitle="The unified hub for all family coordination and communication"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 flex items-center mb-4">
            <LayoutDashboard className="mr-2" size={24} />
            Beyond Traditional Family Apps
          </h3>
          
          <p className="text-gray-700 mb-4">
            The Family Command Center is Allie's unified interface that brings together all the tools 
            families need, while adding essential mental load balancing features:
          </p>
          
          <div className="space-y-3">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 mt-1 flex-shrink-0">
                <span className="text-indigo-600 font-bold text-xs">1</span>
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Load Awareness Layer</h4>
                <p className="text-sm text-gray-700">
                  Every feature includes a mental load tracking component that captures not just task completion, 
                  but planning, coordination, and emotional labor.
                </p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 mt-1 flex-shrink-0">
                <span className="text-indigo-600 font-bold text-xs">2</span>
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Connection-First Design</h4>
                <p className="text-sm text-gray-700">
                  Unlike efficiency-focused tools, Allie's interface prioritizes relationship health, 
                  communication, and load distribution alongside task management.
                </p>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 mt-1 flex-shrink-0">
                <span className="text-indigo-600 font-bold text-xs">3</span>
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Seamless Integration</h4>
                <p className="text-sm text-gray-700">
                  Connects with existing tools and services, enhancing them with Allie's intelligence 
                  rather than forcing families to abandon familiar systems.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-5">Core Command Center Features</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col">
              <div className="mb-3">
                <Calendar size={20} className="text-indigo-600" />
              </div>
              <h4 className="font-medium text-gray-800 mb-1">Enhanced Calendar</h4>
              <p className="text-xs text-gray-600 flex-grow">
                Integrates with existing calendars while adding mental load context, task assignment tracking,
                and workload balancing recommendations.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col">
              <div className="mb-3">
                <MessageSquare size={20} className="text-purple-600" />
              </div>
              <h4 className="font-medium text-gray-800 mb-1">Family Chat</h4>
              <p className="text-xs text-gray-600 flex-grow">
                A dedicated space for family communication with Allie's guidance, task coordination,
                and relationship-enhancing prompts.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col">
              <div className="mb-3">
                <FileText size={20} className="text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-800 mb-1">Document Hub</h4>
              <p className="text-xs text-gray-600 flex-grow">
                Intelligent organization of family documents with automatic tagging, reminders,
                and assignment of administrative responsibilities.
              </p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 flex flex-col">
              <div className="mb-3">
                <Clock size={20} className="text-amber-600" />
              </div>
              <h4 className="font-medium text-gray-800 mb-1">Workload Tracker</h4>
              <p className="text-xs text-gray-600 flex-grow">
                Visual representation of mental load distribution with historical tracking,
                goals, and dynamic rebalancing suggestions.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <h4 className="font-medium text-indigo-800 flex items-center mb-2">
              <Monitor className="mr-2" size={18} />
              Multi-Device Experience
            </h4>
            <p className="text-sm text-gray-700">
              The Command Center works seamlessly across mobile, desktop, and voice interfaces,
              ensuring access to Allie's support whenever and wherever families need it.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 text-center">User Outcomes</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            title="Reduced Cognitive Overload" 
            icon={<LayoutDashboard size={24} />} 
            className="bg-gradient-to-br from-blue-50 to-indigo-100"
          >
            <p className="text-gray-700">
              "Allie's Command Center has taken so much off my mental plate. I used to keep track of 
              everything in my head. Now we have a shared system that everyone can access and contribute to."
              <span className="block mt-2 text-sm text-indigo-600">- Jennifer R., Seattle</span>
            </p>
          </Card>
          
          <Card 
            title="Improved Coordination" 
            icon={<Calendar size={24} />} 
            className="bg-gradient-to-br from-purple-50 to-indigo-100"
          >
            <p className="text-gray-700">
              "The difference is night and day. Before Allie, we were constantly dropping balls and 
              miscommunicating. Now everyone knows what's happening and who's responsible."
              <span className="block mt-2 text-sm text-indigo-600">- Marcus T., Chicago</span>
            </p>
          </Card>
          
          <Card 
            title="Relationship Benefits" 
            icon={<MessageSquare size={24} />} 
            className="bg-gradient-to-br from-amber-50 to-yellow-100"
          >
            <p className="text-gray-700">
              "Allie's Command Center hasn't just made us more organized—it's helped us communicate better 
              and appreciate each other's contributions to running our household."
              <span className="block mt-2 text-sm text-indigo-600">- Sarah and David K., Boston</span>
            </p>
          </Card>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default FamilyCommandCenterSlide;