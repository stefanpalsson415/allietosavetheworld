import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart } from './components';
import { DollarSign, Brain, Users, BarChart2, Server, CreditCard } from 'lucide-react';

const BusinessModelSlide = () => {
  // AI cost projection data (similar to the chart in the screenshot)
  const aiCostData = {
    labels: ['2023', '2024', '2025', '2026', '2027', '2028', '2029'],
    datasets: [
      {
        label: 'Claude API Cost per Token (€)',
        data: [0.008, 0.0045, 0.0025, 0.0015, 0.001, 0.0007, 0.0005],
        borderColor: 'rgba(239, 68, 68, 0.8)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.4,
      }
    ]
  };

  // Family usage scenarios
  const usageLevels = [
    {
      type: "Light Usage",
      queries: 100,
      tokensPerQuery: 2000,
      totalTokens: 200000,
      costNow: 0.50,
      cost2025: 0.25,
      cost2027: 0.10
    },
    {
      type: "Medium Usage",
      queries: 300,
      tokensPerQuery: 3000,
      totalTokens: 900000,
      costNow: 2.25,
      cost2025: 1.13,
      cost2027: 0.45
    },
    {
      type: "Heavy Usage",
      queries: 800,
      tokensPerQuery: 5000,
      totalTokens: 4000000,
      costNow: 10.00,
      cost2025: 5.00,
      cost2027: 2.00
    }
  ];

  // Breakeven analysis
  const breakeven = [
    { teamSize: 20, people: 20, cost: 2, subscribers: 7500 },
    { teamSize: 30, people: 30, cost: 3, subscribers: 11250 },
    { teamSize: 100, people: 100, cost: 10, subscribers: 37500 }
  ];

  return (
    <SlideTemplate
      title="Business Case: Unit Economics"
      subtitle="Subscription model with strong profitability and decreasing AI costs over time"
    >
      {/* Subscription Pricing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 p-6 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 flex items-center mb-4">
            <DollarSign className="mr-2" size={24} />
            Unit Economics: Revenue & Cost
          </h3>
          
          <div className="flex mb-6">
            <div className="flex-1 p-4 bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-700">Monthly Subscription</h4>
                <span className="text-2xl font-bold text-indigo-700">€29.99</span>
              </div>
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-700">Annual Subscription</h4>
                <span className="text-lg font-bold text-indigo-700">€299.90</span>
              </div>
            </div>
          </div>
          
          <h4 className="font-medium text-indigo-800 mb-2">Per-User Monthly P&L:</h4>
          <div className="space-y-1 text-sm bg-white p-4 rounded-lg mb-3">
            <div className="flex items-center justify-between font-semibold">
              <span className="text-indigo-800">Revenue</span>
              <span className="text-indigo-800">€29.99</span>
            </div>
            <div className="w-full border-t border-gray-200 my-1"></div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Claude Compute Costs (90%)</span>
              <span className="text-red-600">-€1.13 to -€10.00</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Hosting & Payment Fees (10%)</span>
              <span className="text-red-600">-€0.50</span>
            </div>
            <div className="w-full border-t border-gray-200 my-1"></div>
            
            <div className="flex items-center justify-between font-semibold">
              <span className="text-indigo-800">Gross Margin</span>
              <span className="text-green-600">€19.49 to €28.36</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Gross Margin %</span>
              <span>65% to 95%</span>
            </div>
            
            <div className="w-full border-t border-gray-200 my-1"></div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Marketing (Mostly Organic)</span>
              <span className="text-red-600">-€3.00</span>
            </div>
            <div className="w-full border-t border-gray-200 my-1"></div>
            
            <div className="flex items-center justify-between font-semibold">
              <span className="text-indigo-800">Contribution Margin</span>
              <span className="text-green-600">€16.49 to €25.36</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Contribution Margin %</span>
              <span>55% to 85%</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-700">
            Unit economics improve over time as AI costs decrease and usage patterns optimize.
            Our high gross margins allow for reinvestment in product development and organic growth.
          </p>
        </div>

        {/* AI Cost Trend Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <Brain className="mr-2 text-red-500" size={24} />
            AI Cost/Performance Curve
          </h3>
          <div className="h-64">
            <DataChart 
              type="line"
              data={aiCostData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    labels: {
                      padding: 20,
                      font: {
                        size: 11
                      }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `€${context.parsed.y.toFixed(4)} per token`;
                      }
                    }
                  },
                  annotation: {
                    annotations: {
                      line1: {
                        type: 'line',
                        yMin: 0.002,
                        yMax: 0.002,
                        borderColor: 'rgb(79, 70, 229)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        label: {
                          content: 'Utility Threshold: €0.002/token',
                          display: true,
                          position: 'start'
                        }
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Cost per token (€)'
                    }
                  }
                }
              }}
            />
          </div>
          <div className="h-6"></div> {/* Added spacing to ensure legend has room */}
          <p className="text-xs text-gray-500 mt-2 italic">
            AI compute costs are projected to decrease significantly over time,
            improving our unit economics and enabling more features within the same cost structure.
          </p>
        </div>
      </div>

      {/* Usage Scenarios */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
          <Users className="mr-2 text-indigo-600" size={24} />
          Family Usage Scenarios & AI Cost Projections
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Usage Profile</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Monthly Queries</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Avg Tokens/Query</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">Total Tokens</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  <span className="text-red-500">2023 Cost</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  <span className="text-amber-500">2025 Cost</span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  <span className="text-green-500">2027 Cost</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usageLevels.map((usage, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{usage.type}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{usage.queries}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{usage.tokensPerQuery.toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-center">{usage.totalTokens.toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 text-center font-medium">€{usage.costNow.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-amber-600 text-center font-medium">€{usage.cost2025.toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 text-center font-medium">€{usage.cost2027.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-indigo-50 p-3 rounded-lg">
            <h4 className="font-medium text-indigo-800 text-sm mb-1">Cost Structure Breakdown</h4>
            <div className="flex items-center mb-2">
              <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div className="h-full bg-red-500" style={{width: '90%'}}>
                    <span className="flex h-full items-center justify-center text-xs font-medium text-white">Claude Compute (90%)</span>
                  </div>
                  <div className="h-full bg-indigo-500" style={{width: '5%'}}></div>
                  <div className="h-full bg-blue-500" style={{width: '5%'}}></div>
                </div>
              </div>
            </div>
            <div className="flex text-xs justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-1"></div>
                <span>Hosting (5%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                <span>Payment Processing (5%)</span>
              </div>
            </div>
          </div>
          
          <div className="bg-amber-50 p-3 rounded-lg">
            <h4 className="font-medium text-amber-800 text-sm mb-1">Key Cost Optimization Strategies</h4>
            <ul className="text-xs text-gray-700 space-y-1 pl-4">
              <li className="flex items-start">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-1 mt-0.5 flex-shrink-0"></div>
                <span>Leveraging lower-cost models for routine tasks</span>
              </li>
              <li className="flex items-start">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-1 mt-0.5 flex-shrink-0"></div>
                <span>Client-side caching of repetitive queries</span>
              </li>
              <li className="flex items-start">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-1 mt-0.5 flex-shrink-0"></div>
                <span>AI model fine-tuning for efficiency</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Breakeven Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {breakeven.map((level, index) => (
          <div key={index} className="bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl p-5 shadow-md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-indigo-800">
                {level.teamSize}-Person Team
              </h3>
              <span className="text-xs bg-indigo-100 text-indigo-800 py-1 px-2 rounded-full">
                €{level.cost}M Annual Cost
              </span>
            </div>
            
            <div className="mb-4 text-center">
              <span className="text-4xl font-bold text-indigo-700">{level.subscribers.toLocaleString()}</span>
              <p className="text-sm text-gray-600">Paid Subscribers at Breakeven</p>
            </div>
            
            <div className="flex justify-between text-sm">
              <div className="text-center">
                <p className="text-xs text-gray-500">Monthly Revenue</p>
                <p className="font-medium text-gray-800">€{(level.subscribers * 29.99).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Monthly Compute*</p>
                <p className="font-medium text-gray-800">€{(level.subscribers * 3).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Monthly Margin</p>
                <p className="font-medium text-green-600">€{(level.subscribers * 16.5).toLocaleString()}</p>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-center text-gray-500 italic">
              *Based on medium usage scenario in 2025
            </div>
          </div>
        ))}
      </div>
    </SlideTemplate>
  );
};

export default BusinessModelSlide;