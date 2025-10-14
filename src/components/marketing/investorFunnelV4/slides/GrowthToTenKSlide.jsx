import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart } from './components';
import { TrendingUp, Users, Target, ArrowRight } from 'lucide-react';

const GrowthToTenKSlide = () => {
  const growthProjectionData = {
    labels: ['Now', 'Month 3', 'Month 6', 'Month 9', 'Month 12', 'Month 15', 'Month 18'],
    datasets: [
      {
        label: 'Total Users',
        data: [6500, 42000, 160000, 320000, 580000, 920000, 1350000],
        borderColor: 'rgba(124, 58, 237, 0.7)',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 2,
      },
      {
        label: 'Paid Subscribers',
        data: [2000, 12000, 57000, 112000, 203000, 322000, 472000],
        borderColor: 'rgba(245, 158, 11, 0.7)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
      }
    ]
  };

  const channelBreakdownData = {
    labels: ['Organic/Word-of-Mouth', 'Referral Program', 'Content Marketing', 'Partnerships', 'Paid Acquisition'],
    datasets: [
      {
        label: 'Contribution to New Users (%)',
        data: [45, 25, 15, 10, 5],
        backgroundColor: [
          'rgba(124, 58, 237, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(239, 68, 68, 0.7)'
        ],
        borderWidth: 0,
      }
    ]
  };

  return (
    <SlideTemplate
      title="Path to 10,000 Subscribers"
      subtitle="Our roadmap to achieving significant market traction and proving scalability"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <TrendingUp className="mr-2 text-indigo-600" size={24} />
            Growth Trajectory to 10K+ Subscribers
          </h3>
          <div className="h-64">
            <DataChart 
              type="line"
              data={growthProjectionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Number of Users'
                    }
                  }
                },
                plugins: {
                  annotation: {
                    annotations: {
                      line1: {
                        type: 'line',
                        yMin: 10000,
                        yMax: 10000,
                        borderColor: 'rgba(124, 58, 237, 0.5)',
                        borderWidth: 2,
                        borderDash: [6, 6],
                        label: {
                          content: '10K Subscribers',
                          enabled: true,
                          position: 'end'
                        }
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Projections show us reaching 10,000 paid subscribers by Month 5, with continued strong growth driven 
            by network effects and improving conversion rates.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <Users className="mr-2 text-indigo-600" size={24} />
            User Acquisition Channel Mix
          </h3>
          <div className="h-64">
            <DataChart 
              type="pie"
              data={channelBreakdownData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  }
                }
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Our growth strategy emphasizes organic and referral channels, with limited dependence on paid acquisition.
            This approach drives lower CAC and more sustainable growth.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card 
          title="Milestone 1: Product Validation" 
          icon={<Target size={24} />} 
          className="bg-gradient-to-br from-indigo-50 to-purple-100"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm border-b border-indigo-100 pb-2">
              <span className="text-gray-600">Target:</span>
              <span className="font-medium text-indigo-800">2,000 paid subscribers</span>
            </div>
            <div className="flex justify-between text-sm border-b border-indigo-100 pb-2">
              <span className="text-gray-600">Timeframe:</span>
              <span className="font-medium text-indigo-800">Now (Achieved)</span>
            </div>
            <div className="flex justify-between text-sm border-b border-indigo-100 pb-2">
              <span className="text-gray-600">Key Metrics:</span>
              <span className="font-medium text-indigo-800">35% conversion, 92% retention</span>
            </div>
          </div>
          
          <div className="mt-4 bg-white bg-opacity-70 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-indigo-800 mb-1">Current Status</h4>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">COMPLETED</span> - We've validated product-market fit with strong 
                conversion and retention in our beta markets.
              </p>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Milestone 2: Growth Acceleration" 
          icon={<Target size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm border-b border-blue-100 pb-2">
              <span className="text-gray-600">Target:</span>
              <span className="font-medium text-blue-800">10,000 paid subscribers</span>
            </div>
            <div className="flex justify-between text-sm border-b border-blue-100 pb-2">
              <span className="text-gray-600">Timeframe:</span>
              <span className="font-medium text-blue-800">Month 5</span>
            </div>
            <div className="flex justify-between text-sm border-b border-blue-100 pb-2">
              <span className="text-gray-600">Key Metrics:</span>
              <span className="font-medium text-blue-800">70% word-of-mouth growth</span>
            </div>
          </div>
          
          <div className="mt-4 bg-white bg-opacity-70 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-1">Key Initiatives</h4>
            <ul className="space-y-1">
              <li className="flex items-center text-sm text-gray-700">
                <ArrowRight size={14} className="text-blue-600 mr-1 flex-shrink-0" />
                Launch referral program with dual-sided incentives
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <ArrowRight size={14} className="text-blue-600 mr-1 flex-shrink-0" />
                Scale content marketing with family productivity focus
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <ArrowRight size={14} className="text-blue-600 mr-1 flex-shrink-0" />
                First corporate wellness partnerships (5 companies)
              </li>
            </ul>
          </div>
        </Card>
        
        <Card 
          title="Milestone 3: Sustained Growth" 
          icon={<Target size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm border-b border-amber-100 pb-2">
              <span className="text-gray-600">Target:</span>
              <span className="font-medium text-amber-800">100,000 paid subscribers</span>
            </div>
            <div className="flex justify-between text-sm border-b border-amber-100 pb-2">
              <span className="text-gray-600">Timeframe:</span>
              <span className="font-medium text-amber-800">Month 14</span>
            </div>
            <div className="flex justify-between text-sm border-b border-amber-100 pb-2">
              <span className="text-gray-600">Key Metrics:</span>
              <span className="font-medium text-amber-800">40% annual plans, $4.5M ARR</span>
            </div>
          </div>
          
          <div className="mt-4 bg-white bg-opacity-70 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-amber-800 mb-1">Key Initiatives</h4>
            <ul className="space-y-1">
              <li className="flex items-center text-sm text-gray-700">
                <ArrowRight size={14} className="text-amber-600 mr-1 flex-shrink-0" />
                Scale enterprise offerings to 25+ companies
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <ArrowRight size={14} className="text-amber-600 mr-1 flex-shrink-0" />
                Launch API for third-party integrations
              </li>
              <li className="flex items-center text-sm text-gray-700">
                <ArrowRight size={14} className="text-amber-600 mr-1 flex-shrink-0" />
                Begin international expansion (Canada, UK, Australia)
              </li>
            </ul>
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 text-center">Month-by-Month Growth Plan</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Users</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Users</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Growth</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Launch</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">Current</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">6,500</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">2,000</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">-</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">Beta program</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">Month 1</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">15,000</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">5,000</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">+150%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">Public launch</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">Month 2</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">28,500</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">9,000</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">+80%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">Referral program</td>
              </tr>
              <tr className="bg-indigo-50">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-900 font-medium">Month 3</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-700">42,000</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-700">13,000</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-700">+44%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-700">Podcast campaign</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">Month 4</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">65,000</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">21,000</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">+62%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">Content hub</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">Month 5</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">95,000</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">32,000</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">+52%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">First enterprise</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">Month 6</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">160,000</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">57,000</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">+78%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">Partner API</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div className="mt-5 p-4 bg-indigo-50 rounded-lg">
          <h4 className="font-medium text-indigo-800 mb-2 flex items-center">
            <Target size={18} className="mr-2" />
            The 10K Subscriber Milestone Significance
          </h4>
          <p className="text-sm text-gray-700">
            Reaching 10,000 paid subscribers represents a significant validation point for our business model and growth strategy. 
            At this scale, we will have validated our organic growth engine, demonstrated strong conversion metrics, 
            and established a clear path to unit economics that support scaling. This milestone also provides the financial 
            foundation for accelerating our product roadmap and expansion initiatives.
          </p>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default GrowthToTenKSlide;