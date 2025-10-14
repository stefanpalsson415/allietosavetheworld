import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart } from './components';
import { DollarSign, TrendingUp, BarChart2, Users } from 'lucide-react';

const FinancialProjectionsSlide = () => {
  const revenueData = {
    labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    datasets: [
      {
        label: 'Revenue ($ Million)',
        data: [2.9, 13.9, 32.6, 62.1, 103.9],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
      }
    ]
  };

  const profitMarginData = {
    labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    datasets: [
      {
        label: 'Gross Margin',
        data: [76, 78, 81, 83, 85],
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        stack: 'stack1',
      },
      {
        label: 'EBITDA Margin',
        data: [-131, 8, 26, 32, 32],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        stack: 'stack2',
      }
    ]
  };

  return (
    <SlideTemplate
      title="Financial Projections"
      subtitle="Five-year forecast demonstrating strong growth and path to profitability"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <DollarSign className="mr-2 text-indigo-600" size={24} />
            Revenue Growth
          </h3>
          <div className="h-64">
            <DataChart 
              type="bar"
              data={revenueData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Revenue ($ Million)'
                    }
                  }
                }
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            We project rapid revenue growth as our user base expands and we introduce premium tiers and B2B channels.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <BarChart2 className="mr-2 text-indigo-600" size={24} />
            Margin Improvement
          </h3>
          <div className="h-64">
            <DataChart 
              type="bar"
              data={profitMarginData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    title: {
                      display: true,
                      text: 'Percentage (%)'
                    },
                    min: -150,
                    max: 100
                  }
                }
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Our business model yields strong gross margins from day one, with EBITDA positivity in Year 2 
            and margin expansion in Years 3-5.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
          <TrendingUp className="mr-2 text-indigo-600" size={24} />
          Five-Year Financial Forecast
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Metric</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Year 1</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Year 2</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Year 3</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Year 4</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Year 5</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* User Metrics */}
              <tr className="bg-gray-50">
                <td colSpan="6" className="px-3 py-2 text-sm font-medium text-gray-800">User Metrics</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Total Users (K)</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">160</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">580</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">1,350</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">2,370</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">3,570</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Paid Subscribers (K)</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">57</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">203</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">472</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">829</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">1,250</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Conversion Rate</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">35%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">35%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">35%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">35%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">35%</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">ARPU (Annual)</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">$97</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">$128</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">$142</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">$156</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">$178</td>
              </tr>
              
              {/* Revenue */}
              <tr className="bg-gray-50">
                <td colSpan="6" className="px-3 py-2 text-sm font-medium text-gray-800">Revenue ($ Million)</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">B2C Revenue</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">2.4</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">10.8</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">23.7</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">42.9</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">67.5</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">B2B Revenue</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">0.5</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">3.1</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">8.9</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">19.2</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">36.4</td>
              </tr>
              <tr className="font-medium">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-800">Total Revenue</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-700 text-right">2.9</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-700 text-right">13.9</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-700 text-right">32.6</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-700 text-right">62.1</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-indigo-700 text-right">103.9</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">YoY Growth</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">-</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">+379%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">+135%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">+90%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">+67%</td>
              </tr>
              
              {/* Expenses */}
              <tr className="bg-gray-50">
                <td colSpan="6" className="px-3 py-2 text-sm font-medium text-gray-800">Expenses ($ Million)</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">COGS</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">0.7</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">3.1</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">6.2</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">10.6</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">15.6</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">R&D</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">2.7</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">4.2</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">6.5</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">9.3</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">15.6</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Sales & Marketing</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">2.3</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">4.7</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">9.8</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">18.6</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">31.2</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">G&A</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">1.0</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">0.8</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">1.6</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">3.7</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">8.3</td>
              </tr>
              <tr className="font-medium">
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Total Expenses</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800 text-right">6.7</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800 text-right">12.8</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800 text-right">24.1</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800 text-right">42.2</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-800 text-right">70.7</td>
              </tr>
              
              {/* Profitability */}
              <tr className="bg-gray-50">
                <td colSpan="6" className="px-3 py-2 text-sm font-medium text-gray-800">Profitability ($ Million)</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Gross Profit</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">2.2</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">10.8</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">26.4</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">51.5</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">88.3</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Gross Margin</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">76%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">78%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">81%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">83%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 text-right">85%</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">EBITDA</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-red-500 text-right">-3.8</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">1.1</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">8.5</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">19.9</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">33.2</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">EBITDA Margin</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-red-500 text-right">-131%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">8%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">26%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">32%</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">32%</td>
              </tr>
              <tr>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">Free Cash Flow</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-red-500 text-right">-4.2</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-red-500 text-right">-0.3</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">6.1</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">15.8</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-green-600 text-right">27.9</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="Key Financial Assumptions" 
          icon={<TrendingUp size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm border-b border-blue-100 pb-1">
              <span className="text-gray-600">User Growth Rate:</span>
              <span className="font-medium text-indigo-800">+95-180% annually</span>
            </div>
            <div className="flex justify-between text-sm border-b border-blue-100 pb-1">
              <span className="text-gray-600">Conversion Rate:</span>
              <span className="font-medium text-indigo-800">35% stable</span>
            </div>
            <div className="flex justify-between text-sm border-b border-blue-100 pb-1">
              <span className="text-gray-600">Annual ARPU Growth:</span>
              <span className="font-medium text-indigo-800">15-20%</span>
            </div>
            <div className="flex justify-between text-sm border-b border-blue-100 pb-1">
              <span className="text-gray-600">CAC:</span>
              <span className="font-medium text-indigo-800">$38.50 - $48.00</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">B2B Revenue Share:</span>
              <span className="font-medium text-indigo-800">17% → 35%</span>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Cash Flow & Funding" 
          icon={<DollarSign size={24} />} 
          className="bg-gradient-to-br from-green-50 to-emerald-100"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm border-b border-green-100 pb-1">
              <span className="text-gray-600">Cash on Hand:</span>
              <span className="font-medium text-emerald-800">$3.8M post-seed</span>
            </div>
            <div className="flex justify-between text-sm border-b border-green-100 pb-1">
              <span className="text-gray-600">Monthly Burn Rate:</span>
              <span className="font-medium text-emerald-800">$195K initial</span>
            </div>
            <div className="flex justify-between text-sm border-b border-green-100 pb-1">
              <span className="text-gray-600">Runway:</span>
              <span className="font-medium text-emerald-800">18+ months</span>
            </div>
            <div className="flex justify-between text-sm border-b border-green-100 pb-1">
              <span className="text-gray-600">Cash Flow Positive:</span>
              <span className="font-medium text-emerald-800">Month 26</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Series A Target:</span>
              <span className="font-medium text-emerald-800">Q3 2026 ($10M)</span>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Key Performance Indicators" 
          icon={<Users size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <div className="space-y-2">
            <div className="flex justify-between text-sm border-b border-amber-100 pb-1">
              <span className="text-gray-600">Annual Revenue Per User:</span>
              <span className="font-medium text-amber-800">$97 → $178</span>
            </div>
            <div className="flex justify-between text-sm border-b border-amber-100 pb-1">
              <span className="text-gray-600">Lifetime Value:</span>
              <span className="font-medium text-amber-800">$243 → $389</span>
            </div>
            <div className="flex justify-between text-sm border-b border-amber-100 pb-1">
              <span className="text-gray-600">LTV:CAC Ratio:</span>
              <span className="font-medium text-amber-800">2.5:1 → 8.1:1</span>
            </div>
            <div className="flex justify-between text-sm border-b border-amber-100 pb-1">
              <span className="text-gray-600">Payback Period:</span>
              <span className="font-medium text-amber-800">4.8 → 1.5 months</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Revenue Per Employee:</span>
              <span className="font-medium text-amber-800">$195K (Year 3)</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 p-5 bg-white rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Financial Strategy & Inflection Points</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="p-3 bg-indigo-50 rounded-lg border-t-4 border-indigo-500">
            <h4 className="font-medium text-indigo-800 text-sm mb-1 text-center">Year 1</h4>
            <p className="text-xs text-center text-gray-700">
              Investment phase focused on product development and initial user acquisition
            </p>
            <div className="mt-2 text-center">
              <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                -$3.8M EBITDA
              </span>
            </div>
          </div>
          
          <div className="p-3 bg-indigo-50 rounded-lg border-t-4 border-indigo-500">
            <h4 className="font-medium text-indigo-800 text-sm mb-1 text-center">Year 2</h4>
            <p className="text-xs text-center text-gray-700">
              Scaling growth channels with positive unit economics and first EBITDA positive quarter
            </p>
            <div className="mt-2 text-center">
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                $1.1M EBITDA
              </span>
            </div>
          </div>
          
          <div className="p-3 bg-indigo-50 rounded-lg border-t-4 border-indigo-500">
            <h4 className="font-medium text-indigo-800 text-sm mb-1 text-center">Year 3</h4>
            <p className="text-xs text-center text-gray-700">
              B2B channel expansion and international markets with significant margin improvement
            </p>
            <div className="mt-2 text-center">
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                $8.5M EBITDA
              </span>
            </div>
          </div>
          
          <div className="p-3 bg-indigo-50 rounded-lg border-t-4 border-indigo-500">
            <h4 className="font-medium text-indigo-800 text-sm mb-1 text-center">Year 4</h4>
            <p className="text-xs text-center text-gray-700">
              Scaling enterprise offerings and expanding product ecosystem with API platform
            </p>
            <div className="mt-2 text-center">
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                $19.9M EBITDA
              </span>
            </div>
          </div>
          
          <div className="p-3 bg-indigo-50 rounded-lg border-t-4 border-indigo-500">
            <h4 className="font-medium text-indigo-800 text-sm mb-1 text-center">Year 5</h4>
            <p className="text-xs text-center text-gray-700">
              Expanding to adjacent markets with strong cash flow generation and consistent profitability
            </p>
            <div className="mt-2 text-center">
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                $33.2M EBITDA
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-5 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">
            Our financial strategy balances growth investment with disciplined efficiency. Initial losses in Year 1 reflect our 
            strategic investment in product development and user acquisition. We reach EBITDA positivity in Year 2 and steady 
            margin improvement thereafter, with consistently improving unit economics and increasing operational leverage.
          </p>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default FinancialProjectionsSlide;