import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart } from './components';
import { DollarSign, TrendingUp, Database, ShoppingBag, RefreshCw, Target } from 'lucide-react';

const MonetizationSummarySlide = () => {
  const revenueProjectionData = {
    labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    datasets: [
      {
        label: 'B2C Revenue',
        data: [2.4, 10.8, 23.7, 42.9, 67.5],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
      },
      {
        label: 'B2B Revenue',
        data: [0.5, 3.1, 8.9, 19.2, 36.4],
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
      },
      {
        label: 'Marketplace Revenue',
        data: [0.0, 0.8, 4.6, 12.3, 28.7],
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
      }
    ]
  };

  const familySpendData = {
    labels: ['Education', 'Activities', 'Childcare', 'Healthcare', 'Retail', 'Travel'],
    datasets: [
      {
        label: 'Average Annual Family Spend (€K)',
        data: [4.2, 3.7, 8.5, 5.2, 12.8, 6.9],
        backgroundColor: [
          'rgba(99, 102, 241, 0.7)',
          'rgba(79, 70, 229, 0.7)',
          'rgba(67, 56, 202, 0.7)',
          'rgba(55, 48, 163, 0.7)',
          'rgba(49, 46, 129, 0.7)',
          'rgba(30, 27, 75, 0.7)',
        ],
      }
    ]
  };

  return (
    <SlideTemplate
      title="Family LTV Expansion Strategy"
      subtitle="Maximizing value per user through proprietary data, network effects, and commerce"
    >
      {/* 3-Step LTV Expansion Strategy */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          Our Three-Step Revenue Expansion Strategy
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <div className="bg-gradient-to-b from-indigo-50 to-indigo-100 rounded-lg p-5 relative">
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">1</span>
            </div>
            <h4 className="text-lg font-medium text-indigo-800 mb-3 mt-2">Collect Family Data</h4>
            <p className="text-sm text-gray-700 mb-3">
              Our greatest asset is the proprietary data we gather as families use Allie for coordination, scheduling, and communication.
            </p>
            <div className="flex items-center text-xs text-indigo-600">
              <Database size={14} className="mr-1" />
              <span>See Data Value Slide</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-b from-purple-50 to-purple-100 rounded-lg p-5 relative">
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">2</span>
            </div>
            <h4 className="text-lg font-medium text-purple-800 mb-3 mt-2">Leverage the Flywheel</h4>
            <p className="text-sm text-gray-700 mb-3">
              Our flywheel effect drives deeper user engagement, creating more data and expanding relationship trust with each interaction.
            </p>
            <div className="flex items-center text-xs text-purple-600">
              <RefreshCw size={14} className="mr-1" />
              <span>See Family Flywheel Slide</span>
            </div>
          </div>
          
          <div className="bg-gradient-to-b from-emerald-50 to-emerald-100 rounded-lg p-5 relative">
            <div className="absolute -top-3 -left-3 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold">3</span>
            </div>
            <h4 className="text-lg font-medium text-emerald-800 mb-3 mt-2">Monetize Family Spend</h4>
            <p className="text-sm text-gray-700 mb-3">
              Capture significant share of the €41,300 average annual family spend through trusted recommendations and seamless commerce.
            </p>
            <div className="flex items-center text-xs text-emerald-600">
              <ShoppingBag size={14} className="mr-1" />
              <span>€41.3K average annual spend per family</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <DollarSign className="mr-2 text-indigo-600" size={24} />
            Revenue Projection by Channel
          </h3>
          <div className="h-64 mb-12">
            <DataChart 
              type="bar"
              data={revenueProjectionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: {
                    stacked: true,
                  },
                  y: {
                    stacked: true,
                    title: {
                      display: true,
                      text: 'Revenue (€ Millions)'
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      boxWidth: 15,
                      font: {
                        size: 11
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-12">
            Our revenue mix evolves to capture more value per user over time, with marketplace 
            transactions becoming a major revenue driver in later years.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <ShoppingBag className="mr-2 text-indigo-600" size={24} />
            Family Annual Spend Opportunity
          </h3>
          <div className="h-64 mb-12">
            <DataChart 
              type="pie"
              data={familySpendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      boxWidth: 15,
                      font: {
                        size: 11
                      }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `€${context.parsed}K per year`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-indigo-800">Total Annual Family Spend:</span>
              <span className="text-sm font-bold text-indigo-900">€41.3K</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm font-medium text-indigo-800">Our Target Capture:</span>
              <span className="text-sm font-bold text-indigo-900">5-15%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card 
          title="Subscription Base Value" 
          icon={<RefreshCw size={24} />} 
          className="bg-gradient-to-br from-indigo-50 to-purple-100"
        >
          <div className="space-y-3">
            <p className="text-gray-700 mb-2">
              Our core subscription provides the foundation for higher-value monetization streams:
            </p>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-800 mb-1">Premium Plans</h4>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly:</span>
                <span className="font-medium text-gray-800">€29.99/month</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Annual:</span>
                <span className="font-medium text-gray-800">€299.99/year</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Family Plan (Y2):</span>
                <span className="font-medium text-gray-800">€399.99/year</span>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-indigo-800 mb-1">LTV Growth Levers</h4>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-1 flex-shrink-0"></div>
                  <span>Annual plan conversion (47% → 65%)</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-1 flex-shrink-0"></div>
                  <span>Family plan upsells (+33% ARPU)</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-1 flex-shrink-0"></div>
                  <span>Retention improvement (5% monthly → 3%)</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Merchant Marketplace" 
          icon={<Target size={24} />} 
          className="bg-gradient-to-br from-emerald-50 to-emerald-100"
        >
          <div className="space-y-3">
            <p className="text-gray-700 mb-2">
              As trust builds, we can capture significant value from family purchasing decisions:
            </p>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-emerald-800 mb-1">Monetization Model</h4>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1 flex-shrink-0"></div>
                  <span>Affiliate partnerships (4-8% commission)</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1 flex-shrink-0"></div>
                  <span>Direct marketplace (12-15% fee)</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1 flex-shrink-0"></div>
                  <span>Premium merchant visibility (€50-500/mo)</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-emerald-800 mb-1">High-Value Categories</h4>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-emerald-50 p-2 rounded-lg text-center">
                  <p className="text-xs font-medium text-emerald-800">Education</p>
                  <p className="text-xs text-emerald-600">€4.2K/yr</p>
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg text-center">
                  <p className="text-xs font-medium text-emerald-800">Childcare</p>
                  <p className="text-xs text-emerald-600">€8.5K/yr</p>
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg text-center">
                  <p className="text-xs font-medium text-emerald-800">Activities</p>
                  <p className="text-xs text-emerald-600">€3.7K/yr</p>
                </div>
                <div className="bg-emerald-50 p-2 rounded-lg text-center">
                  <p className="text-xs font-medium text-emerald-800">Retail</p>
                  <p className="text-xs text-emerald-600">€12.8K/yr</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Data-Powered Growth" 
          icon={<Database size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <div className="space-y-3">
            <p className="text-gray-700 mb-2">
              Our family data model creates unique opportunities for targeted value creation:
            </p>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Trust Progression</h4>
              <div className="mt-2 space-y-2">
                <div className="relative h-5">
                  <div className="absolute inset-0 bg-blue-100 rounded"></div>
                  <div className="absolute inset-y-0 left-0 bg-blue-500 rounded" style={{width: '20%'}}>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">Stage 1</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Calendar Coordination</span>
                  <span>20% trust</span>
                </div>
                
                <div className="relative h-5">
                  <div className="absolute inset-0 bg-blue-100 rounded"></div>
                  <div className="absolute inset-y-0 left-0 bg-blue-600 rounded" style={{width: '50%'}}>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">Stage 2</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Load Balancing</span>
                  <span>50% trust</span>
                </div>
                
                <div className="relative h-5">
                  <div className="absolute inset-0 bg-blue-100 rounded"></div>
                  <div className="absolute inset-y-0 left-0 bg-blue-700 rounded" style={{width: '85%'}}>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">Stage 3</span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Spend Recommendations</span>
                  <span>85% trust</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Unique Data Assets</h4>
              <ul className="space-y-1 text-xs text-gray-700">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 flex-shrink-0"></div>
                  <span>Family relationship & life-stage models</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 flex-shrink-0"></div>
                  <span>Household task allocation patterns</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 flex-shrink-0"></div>
                  <span>Child activity & development preferences</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-1 flex-shrink-0"></div>
                  <span>Family spending prediction models</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 text-center">Per-User Revenue Expansion</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-b from-indigo-50 to-indigo-100 p-4 rounded-lg text-center">
            <h4 className="font-medium text-indigo-800 mb-2">Year 1</h4>
            <div className="bg-white rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-3">
              <div>
                <p className="text-lg font-bold text-indigo-900">€53</p>
                <p className="text-xs text-indigo-600">ARPU</p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Subscription:</span>
                <span className="font-medium text-gray-800">€53</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Marketplace:</span>
                <span className="font-medium text-gray-800">€0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Add-ons:</span>
                <span className="font-medium text-gray-800">€0</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-b from-indigo-100 to-indigo-200 p-4 rounded-lg text-center">
            <h4 className="font-medium text-indigo-800 mb-2">Year 2</h4>
            <div className="bg-white rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-3">
              <div>
                <p className="text-lg font-bold text-indigo-900">€72</p>
                <p className="text-xs text-indigo-600">ARPU</p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Subscription:</span>
                <span className="font-medium text-gray-800">€59</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Marketplace:</span>
                <span className="font-medium text-gray-800">€9</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Add-ons:</span>
                <span className="font-medium text-gray-800">€4</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-b from-indigo-200 to-indigo-300 p-4 rounded-lg text-center">
            <h4 className="font-medium text-indigo-800 mb-2">Year 3</h4>
            <div className="bg-white rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-3">
              <div>
                <p className="text-lg font-bold text-indigo-900">€103</p>
                <p className="text-xs text-indigo-600">ARPU</p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Subscription:</span>
                <span className="font-medium text-gray-800">€67</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Marketplace:</span>
                <span className="font-medium text-gray-800">€27</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Add-ons:</span>
                <span className="font-medium text-gray-800">€9</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-b from-indigo-300 to-indigo-400 p-4 rounded-lg text-center">
            <h4 className="font-medium text-indigo-800 mb-2">Year 4</h4>
            <div className="bg-white rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-3">
              <div>
                <p className="text-lg font-bold text-indigo-900">€165</p>
                <p className="text-xs text-indigo-600">ARPU</p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-gray-600">Subscription:</span>
                <span className="font-medium text-gray-800">€78</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Marketplace:</span>
                <span className="font-medium text-gray-800">€68</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Add-ons:</span>
                <span className="font-medium text-gray-800">€19</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-b from-indigo-400 to-indigo-500 p-4 rounded-lg text-center">
            <h4 className="font-medium text-white mb-2">Year 5</h4>
            <div className="bg-white rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-3">
              <div>
                <p className="text-lg font-bold text-indigo-900">€279</p>
                <p className="text-xs text-indigo-600">ARPU</p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-white">Subscription:</span>
                <span className="font-medium text-white">€85</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Marketplace:</span>
                <span className="font-medium text-white">€157</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Add-ons:</span>
                <span className="font-medium text-white">€37</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
          <h4 className="font-medium text-indigo-800 mb-2 flex items-center">
            <TrendingUp size={18} className="mr-2" />
            The Trust-Based Commerce Model
          </h4>
          <p className="text-sm text-gray-700">
            Our monetization strategy follows a natural progression of value and trust. As we solve essential 
            family coordination challenges, we build trusted relationships that allow us to recommend and facilitate 
            high-value purchases. By Year 5, marketplace-facilitated transactions become our primary revenue 
            source, with the potential to capture 5-15% of total family spending (€2,000-6,000 per family annually).
          </p>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default MonetizationSummarySlide;