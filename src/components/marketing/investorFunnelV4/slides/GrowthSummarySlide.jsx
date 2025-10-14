import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart } from './components';
import { TrendingUp, Zap, Users, Clock, DollarSign } from 'lucide-react';

const GrowthSummarySlide = () => {
  const growthData = {
    labels: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8'],
    datasets: [
      {
        label: 'Total Users',
        data: [5000, 15000, 42000, 85000, 160000, 270000, 410000, 580000],
        borderColor: 'rgba(99, 102, 241, 0.8)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Paid Subscribers',
        data: [500, 3000, 12000, 28000, 57000, 94000, 143000, 203000],
        borderColor: 'rgba(245, 158, 11, 0.8)',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        yAxisID: 'y',
      }
    ]
  };

  return (
    <SlideTemplate
      title="Growth Strategy"
      subtitle="Three key levers driving organic user acquisition and conversion"
    >
      {/* Key Growth Levers Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-5 text-center">Our Three Key Growth Levers</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Utility Lever */}
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-6 relative">
            <div className="absolute top-0 left-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center transform translate-x-4 translate-y-4">
              <span className="text-white font-bold">1</span>
            </div>
            
            <div className="mt-10">
              <h4 className="text-lg font-semibold text-indigo-800 mb-3 flex items-center">
                <Clock className="mr-2" size={20} />
                Daily Utility
              </h4>
              
              <p className="text-sm text-gray-700 mb-3">
                We're building an everyday utility parents can't live without, not just another app.
              </p>
              
              <ul className="space-y-1 text-sm">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">Saves 12-15 hours weekly</span>
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">10-100 daily interactions</span>
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">"Check Allie" becomes vernacular</span>
                </li>
              </ul>
              
              <div className="mt-4 text-xs text-indigo-700 flex items-center">
                <Zap size={12} className="mr-1" />
                <span>See "Allie as a Utility" slide</span>
              </div>
            </div>
          </div>
          
          {/* Free & Paid Tier Lever */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 relative">
            <div className="absolute top-0 left-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center transform translate-x-4 translate-y-4">
              <span className="text-white font-bold">2</span>
            </div>
            
            <div className="mt-10">
              <h4 className="text-lg font-semibold text-purple-800 mb-3 flex items-center">
                <DollarSign className="mr-2" size={20} />
                Free-to-Paid Funnel
              </h4>
              
              <p className="text-sm text-gray-700 mb-3">
                Our free tier creates the "Aha!" moment that drives conversion to paid features.
              </p>
              
              <ul className="space-y-1 text-sm">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">Free: Mental load assessment</span>
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">Paid: Complete solution with AI</span>
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">35% free-to-paid conversion</span>
                </li>
              </ul>
              
              <div className="mt-4 text-xs text-purple-700 flex items-center">
                <Zap size={12} className="mr-1" />
                <span>See "Freemium Strategy" slide</span>
              </div>
            </div>
          </div>
          
          {/* Organic Growth Lever */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 relative">
            <div className="absolute top-0 left-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center transform translate-x-4 translate-y-4">
              <span className="text-white font-bold">3</span>
            </div>
            
            <div className="mt-10">
              <h4 className="text-lg font-semibold text-emerald-800 mb-3 flex items-center">
                <Users className="mr-2" size={20} />
                Organic Sharing
              </h4>
              
              <p className="text-sm text-gray-700 mb-3">
                Natural virality driven by solving a universal pain point for families.
              </p>
              
              <ul className="space-y-1 text-sm">
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">2.3 referrals per paying user</span>
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">42% referral conversion</span>
                </li>
                <li className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 flex-shrink-0"></div>
                  <span className="text-gray-700">76% share after "save" moments</span>
                </li>
              </ul>
              
              <div className="mt-4 text-xs text-emerald-700 flex items-center">
                <Zap size={12} className="mr-1" />
                <span>See "Organic Growth Strategy" slide</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <TrendingUp className="mr-2 text-indigo-600" size={24} />
            Path to 10K Paid Subscribers
          </h3>
          <div className="h-64 mb-12">
            <DataChart 
              type="line"
              data={growthData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    title: {
                      display: true,
                      text: 'Number of Users'
                    }
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20,
                      boxWidth: 12,
                      usePointStyle: true,
                      font: {
                        size: 11
                      }
                    }
                  }
                }
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-8">
            Targeting <span className="font-medium">10,000 paid subscribers</span> by the end of Year 2,
            with a total of 580,000 users and a steady 35% paid conversion rate.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <Zap className="mr-2 text-indigo-600" size={24} />
            Growth Flywheel Effects
          </h3>
          
          <div className="text-xs text-center text-indigo-600 font-medium mb-3">
            Forecasted metrics based on early testing and industry benchmarks
          </div>
          
          <div className="space-y-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-2">Daily Utility → Higher Retention</h4>
              <div className="flex items-center">
                <div className="w-16 h-16 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center mr-4">
                  <span className="text-2xl font-bold text-indigo-600">87%</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">Daily Active Users / Monthly Active Users ratio</p>
                  <p className="text-xs text-gray-500 mt-1">Industry benchmark: 30-40% for most apps</p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">Freemium → Higher Conversion</h4>
              <div className="flex items-center">
                <div className="w-16 h-16 flex-shrink-0 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                  <span className="text-2xl font-bold text-purple-600">35%</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">Free-to-paid conversion rate</p>
                  <p className="text-xs text-gray-500 mt-1">Industry benchmark: 2-5% for most freemium apps</p>
                </div>
              </div>
            </div>
            
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h4 className="font-medium text-emerald-800 mb-2">Organic Growth → Lower CAC</h4>
              <div className="flex items-center">
                <div className="w-16 h-16 flex-shrink-0 rounded-full bg-emerald-100 flex items-center justify-center mr-4">
                  <span className="text-2xl font-bold text-emerald-600">€18</span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">Average customer acquisition cost</p>
                  <p className="text-xs text-gray-500 mt-1">Industry benchmark: €80-120 for family apps</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="High User Engagement (Forecast)" 
          icon={<Clock size={24} />} 
          className="bg-gradient-to-br from-indigo-50 to-indigo-100"
        >
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Daily Active Users:</span>
              <span className="font-medium text-indigo-800">87% of MAU</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Sessions Per Day:</span>
              <span className="font-medium text-indigo-800">4.7 avg</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">30-Day Retention:</span>
              <span className="font-medium text-indigo-800">78%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">90-Day Retention:</span>
              <span className="font-medium text-indigo-800">63%</span>
            </div>
            <div className="mt-3 pt-3 border-t border-indigo-100">
              <p className="text-sm text-indigo-800 font-medium">
                Parents interact with Allie multiple times daily due to its must-have utility in family coordination.
              </p>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Freemium Conversion (Forecast)" 
          icon={<DollarSign size={24} />} 
          className="bg-gradient-to-br from-purple-50 to-purple-100"
        >
          <div className="space-y-3">
            <div className="flex flex-col">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Awareness → Free Signup</span>
                <span className="font-medium text-purple-800">28%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="h-full bg-purple-500 rounded-full" style={{width: '28%'}}></div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Free → Active Usage</span>
                <span className="font-medium text-purple-800">82%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="h-full bg-purple-500 rounded-full" style={{width: '82%'}}></div>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Active Free → Paid</span>
                <span className="font-medium text-purple-800">35%</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full">
                <div className="h-full bg-purple-500 rounded-full" style={{width: '35%'}}></div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-purple-100">
              <p className="text-sm text-purple-800 font-medium">
                The free assessment creates an "Aha!" moment that drives exceptional conversion to our paid solution.
              </p>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Organic Growth Economics (Forecast)" 
          icon={<Users size={24} />} 
          className="bg-gradient-to-br from-emerald-50 to-emerald-100"
        >
          <div className="space-y-3">
            <div className="bg-white bg-opacity-60 p-2 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Monthly User Growth:</span>
                <span className="font-medium text-emerald-800">+18% MoM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Organic Acquisition:</span>
                <span className="font-medium text-emerald-800">68% of users</span>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-60 p-2 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Customer Acquisition Cost:</span>
                <span className="font-medium text-emerald-800">€18</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Lifetime Value:</span>
                <span className="font-medium text-emerald-800">€226</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">LTV:CAC Ratio:</span>
                <span className="font-medium text-emerald-800">12.6:1</span>
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-emerald-100">
              <p className="text-sm text-emerald-800 font-medium">
                Our powerful "save moments" lead to natural sharing and exceptional unit economics.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 p-5 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">How Our Three Levers Work Together</h3>
        
        <div className="p-4 bg-indigo-50 rounded-lg mb-4">
          <p className="text-sm text-gray-700 text-center">
            <span className="font-medium text-indigo-800">Daily Utility</span> → Drives frequent usage and high retention
            → <span className="font-medium text-purple-800">Free-to-Paid Conversion</span> → Generates revenue
            → <span className="font-medium text-emerald-800">Organic Sharing</span> → Lowers acquisition costs
          </p>
        </div>
        
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center bg-purple-700 text-white px-5 py-3 rounded-lg text-sm">
            <Zap size={18} className="mr-2" />
            <span>Each lever reinforces the others, creating a self-sustaining growth engine</span>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default GrowthSummarySlide;