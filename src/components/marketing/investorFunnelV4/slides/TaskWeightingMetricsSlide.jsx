import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart } from './components';
import { Scale, Brain, Clock, BarChart2 } from 'lucide-react';

const TaskWeightingMetricsSlide = () => {
  const taskWeightData = {
    labels: ['Planning School Activities', 'Grocery Shopping', 'Doctor Appointments', 'Homework Help', 'Birthday Planning', 'Home Maintenance'],
    datasets: [
      {
        label: 'Traditional Time Metric',
        data: [1, 2, 1, 1.5, 3, 2],
        backgroundColor: 'rgba(99, 102, 241, 0.4)',
      },
      {
        label: 'Allie Task Weight Score',
        data: [4.2, 2.5, 4.8, 2.7, 4.5, 1.8],
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
      }
    ]
  };

  return (
    <SlideTemplate
      title="Beyond Time: Task Weighting Algorithm"
      subtitle="Measuring the true cognitive and emotional impact of family responsibilities"
    >
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
          <BarChart2 className="mr-2 text-amber-600" size={24} />
          Time vs. True Task Weight
        </h3>
        <div className="h-72">
          <DataChart 
            type="bar"
            data={taskWeightData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              indexAxis: 'y',
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Time (hours) vs. Weight Score (1-5 scale)'
                  }
                }
              }
            }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-4">
          Allie's proprietary task weighting algorithm considers multiple factors beyond just time, 
          measuring the true cognitive and emotional load of each responsibility.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="Multidimensional Metrics" 
          icon={<Brain size={24} />} 
          className="bg-gradient-to-br from-indigo-50 to-purple-100"
        >
          <h4 className="text-base font-medium text-gray-800 mb-2">Our Task Weight Factors:</h4>
          <ul className="list-disc pl-5 text-gray-700 text-sm space-y-1">
            <li>Mental effort required</li>
            <li>Emotional labor involved</li>
            <li>Decision fatigue level</li>
            <li>Coordination complexity</li>
            <li>Deadline pressure</li>
            <li>Consequences of failure</li>
          </ul>
        </Card>
        
        <Card 
          title="Personalized Calibration" 
          icon={<Scale size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <p className="text-gray-700 mb-3">
            Task weights are calibrated to each family's specific dynamics, accounting for individual 
            stress triggers and cognitive styles.
          </p>
          <p className="text-gray-700">
            The algorithm learns from user feedback and adjusts weights based on changing family circumstances.
          </p>
        </Card>
        
        <Card 
          title="Balance Over Time" 
          icon={<Clock size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <p className="text-gray-700 mb-3">
            Our system tracks load distribution over time, not just at one moment, to ensure sustainable balance.
          </p>
          <p className="text-gray-700">
            Families can see trends, patterns, and progress toward more equitable distribution of household mental load.
          </p>
        </Card>
      </div>
    </SlideTemplate>
  );
};

export default TaskWeightingMetricsSlide;