import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart } from './components';
import { Network, Users, Brain, TrendingUp } from 'lucide-react';

const CollectiveIntelligenceSlide = () => {
  const chartData = {
    labels: ['Month 1', 'Month 3', 'Month 6', 'Month 12'],
    datasets: [
      {
        label: 'Solution Quality',
        data: [65, 75, 85, 95],
        borderColor: 'rgba(99, 102, 241, 0.8)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
      },
      {
        label: 'Personalization',
        data: [40, 65, 80, 92],
        borderColor: 'rgba(245, 158, 11, 0.8)',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
      }
    ]
  };

  return (
    <SlideTemplate
      title="Leveraging Collective Intelligence"
      subtitle="Learning from patterns across thousands of families while respecting privacy"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card title="Anonymous Pattern Recognition" icon={<Network size={24} />} className="bg-gradient-to-br from-purple-50 to-indigo-100">
          <p className="text-gray-700">Allie identifies successful strategies and patterns across thousands of families, while keeping all personal data private and secure.</p>
        </Card>
        
        <Card title="Community-Powered Solutions" icon={<Users size={24} />} className="bg-gradient-to-br from-blue-50 to-blue-100">
          <p className="text-gray-700">Strategies that work for similar families are suggested and adapted to your family's unique needs and preferences.</p>
        </Card>
        
        <Card title="Continuous Learning" icon={<Brain size={24} />} className="bg-gradient-to-br from-amber-50 to-yellow-100">
          <p className="text-gray-700">Our system continuously improves as more families use it, creating a virtuous cycle of better solutions and experiences.</p>
        </Card>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-lg mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="mr-2 text-indigo-600" size={24} /> 
          Solution Quality Over Time <span className="ml-2 text-sm font-normal text-gray-500">(Projected Data)</span>
        </h3>
        <div className="h-72 mb-6">
          <DataChart 
            type="line"
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'bottom'
                },
                tooltip: {
                  mode: 'index',
                  intersect: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: 'Effectiveness Score'
                  }
                }
              }
            }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-4">
          <span className="bg-amber-100 px-2 py-0.5 rounded text-amber-800 font-medium">Note:</span> The chart above shows estimated and forecasted data based on AI learning curve models. 
          As more families join Allie, we expect solutions to become more effective and personalized through 
          collective intelligence algorithms. Privacy will be maintained through careful anonymization and data abstraction.
        </p>
      </div>
    </SlideTemplate>
  );
};

export default CollectiveIntelligenceSlide;