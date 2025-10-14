import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, VideoEmbed } from './components';
import { BarChart2, PieChart, LineChart, Eye, Activity, AlertCircle, Heart, List, Database, User } from 'lucide-react';

const WorkloadVisualizationSlide = () => {
  // Real data based on Family Balance Dashboard
  const timelineData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
    datasets: [
      {
        label: 'Partner A',
        data: [73, 71, 68, 65, 62, 58, 54, 51],
        borderColor: 'rgba(99, 102, 241, 0.8)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
      },
      {
        label: 'Partner B',
        data: [27, 29, 32, 35, 38, 42, 46, 49],
        borderColor: 'rgba(245, 158, 11, 0.8)',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
      }
    ]
  };

  const taskCategoryData = {
    labels: ['School Coordination', 'Health Management', 'Activity Planning', 'Household Admin', 'Social Planning', 'Extended Family'],
    datasets: [
      {
        label: 'Partner A',
        data: [67, 72, 58, 53, 80, 75],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
      },
      {
        label: 'Partner B',
        data: [33, 28, 42, 47, 20, 25],
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
      }
    ]
  };

  return (
    <SlideTemplate
      title="Making the Invisible Visible"
      subtitle="Visualizing mental load to drive awareness and lasting change"
    >
      {/* Key Area Banner - Based on real dashboard content */}
      <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-4 rounded-lg mb-6 border border-indigo-200">
        <h3 className="text-xl font-bold text-indigo-800 mb-2 flex items-center">
          <Eye className="mr-2" size={20} />
          Why These 5 Key Areas Matter
        </h3>
        <p className="text-gray-700 mb-4">
          Our Family Balance Dashboard brings together five complementary perspectives that together create a complete picture of your family's balance journey.
        </p>
        <div className="grid grid-cols-5 gap-3 text-center">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full">
              <Activity size={18} />
            </div>
            <p className="text-sm font-semibold text-blue-800">Family Harmony Pulse</p>
            <p className="text-xs text-gray-600">Real-time metrics on responsibility distribution</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full">
              <User size={18} />
            </div>
            <p className="text-sm font-semibold text-purple-800">Individual Member Journeys</p>
            <p className="text-xs text-gray-600">Personal growth, strengths, and contributions</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center bg-green-100 text-green-700 rounded-full">
              <AlertCircle size={18} />
            </div>
            <p className="text-sm font-semibold text-green-800">Child Development Observatory</p>
            <p className="text-xs text-gray-600">How balanced parenting affects outcomes</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center bg-amber-100 text-amber-700 rounded-full">
              <LineChart size={18} />
            </div>
            <p className="text-sm font-semibold text-amber-800">Family Transformation Timeline</p>
            <p className="text-xs text-gray-600">Progress milestones and balance improvements</p>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center bg-rose-100 text-rose-700 rounded-full">
              <Heart size={18} />
            </div>
            <p className="text-sm font-semibold text-rose-800">Balance Impact Hub</p>
            <p className="text-xs text-gray-600">Tangible benefits in time, relationships, wellbeing</p>
          </div>
        </div>
      </div>

      {/* Removed the charts section based on user request */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card 
          title="Child Development Observatory" 
          icon={<AlertCircle size={24} />} 
          className="bg-gradient-to-br from-indigo-50 to-purple-100"
        >
          <p className="text-gray-700 mb-3">
            Tracks how balanced parenting positively impacts children's developmental outcomes with specialized monitoring tools.
          </p>
          <div className="bg-white bg-opacity-60 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-indigo-800 mb-1">Key Features:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>Growth tracking with health metrics</li>
              <li>Wardrobe concierge with seasonal planning</li>
              <li>Activity coordination & participation monitoring</li>
              <li>School performance integration</li>
              <li>Gift idea management with interest tracking</li>
            </ul>
          </div>
        </Card>
        
        <Card 
          title="Family Command Center" 
          icon={<Database size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <p className="text-gray-700 mb-3">
            Comprehensive family information management with AI-powered organization of critical data & documents.
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white bg-opacity-70 p-2 rounded">
              <span className="font-medium text-indigo-800">Family Allie Drive</span>
              <p className="text-gray-600 mt-1">Smart document organization</p>
            </div>
            <div className="bg-white bg-opacity-70 p-2 rounded">
              <span className="font-medium text-indigo-800">Provider Directory</span>
              <p className="text-gray-600 mt-1">Healthcare & service tracking</p>
            </div>
            <div className="bg-white bg-opacity-70 p-2 rounded">
              <span className="font-medium text-indigo-800">Calendar Events</span>
              <p className="text-gray-600 mt-1">Coordinated scheduling</p>
            </div>
            <div className="bg-white bg-opacity-70 p-2 rounded">
              <span className="font-medium text-indigo-800">Task Sequences</span>
              <p className="text-gray-600 mt-1">Complex routine management</p>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Balance Impact Hub" 
          icon={<Heart size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <p className="text-gray-700 mb-3">
            Quantifies tangible benefits of improved balance on family's time, relationships, and overall wellbeing.
          </p>
          <div className="bg-white bg-opacity-60 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-amber-800 mb-1">Measured Impacts:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li><b>Time:</b> Average 5.2 hours/week saved through coordination</li>
              <li><b>Stress:</b> 68% report significant stress reduction</li>
              <li><b>Relationship:</b> 79% report improved communication</li>
              <li><b>Equity:</b> 61% achieve balanced workload within 8 weeks</li>
              <li><b>Satisfaction:</b> 84% increase in family happiness metrics</li>
            </ul>
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 text-center">How Visualization Drives Change</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full mb-3">
              <Eye size={24} />
            </div>
            <h4 className="font-medium text-indigo-800 mb-2">Awareness</h4>
            <p className="text-sm text-gray-700">
              Visualizations reveal invisible mental load patterns, creating immediate awareness of imbalances previously unnoticed
            </p>
            <p className="text-sm font-medium text-indigo-700 mt-2">92%</p>
            <p className="text-xs text-indigo-600">report immediate awareness of imbalance</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="w-10 h-10 flex items-center justify-center bg-purple-100 text-purple-700 rounded-full mb-3">
              <List size={24} />
            </div>
            <h4 className="font-medium text-purple-800 mb-2">Acknowledgment</h4>
            <p className="text-sm text-gray-700">
              Evidence-based visualizations enable partners to recognize and validate previously invisible work
            </p>
            <p className="text-sm font-medium text-purple-700 mt-2">87%</p>
            <p className="text-xs text-purple-600">of partners recognize invisible work</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full mb-3">
              <Activity size={24} />
            </div>
            <h4 className="font-medium text-blue-800 mb-2">Action</h4>
            <p className="text-sm text-gray-700">
              Data-informed conversations lead to concrete redistribution actions with Allie's guidance
            </p>
            <p className="text-sm font-medium text-blue-700 mt-2">79%</p>
            <p className="text-xs text-blue-600">start rebalancing within one week</p>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg">
            <div className="w-10 h-10 flex items-center justify-center bg-amber-100 text-amber-700 rounded-full mb-3">
              <LineChart size={24} />
            </div>
            <h4 className="font-medium text-amber-800 mb-2">Adaptation</h4>
            <p className="text-sm text-gray-700">
              Ongoing measurement and adjustment creates sustainable new patterns and habits
            </p>
            <p className="text-sm font-medium text-amber-700 mt-2">3-5 weeks</p>
            <p className="text-xs text-amber-600">average time to significant improvement</p>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default WorkloadVisualizationSlide;