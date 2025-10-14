import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Stat } from './components';
import { Users, TrendingUp, Target, Globe } from 'lucide-react';

const MarketSummarySlide = () => {
  const marketTrendData = {
    labels: ['2022', '2023', '2024', '2025', '2026', '2027', '2028'],
    datasets: [
      {
        label: 'USA Market Size',
        data: [3.5, 4.8, 6.5, 8.9, 11.8, 15.4, 19.6],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
        yAxisID: 'y',
      },
      {
        label: 'Europe Market Size',
        data: [2.9, 4.0, 5.5, 7.4, 9.8, 12.9, 16.7],
        backgroundColor: 'rgba(79, 70, 229, 0.4)',
        yAxisID: 'y',
      },
      {
        label: 'Mental Load Awareness',
        data: [18, 32, 47, 65, 78, 87, 94],
        borderColor: 'rgba(245, 158, 11, 0.8)',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        type: 'line',
        yAxisID: 'y1',
      }
    ]
  };

  return (
    <SlideTemplate
      title="Market Overview"
      subtitle="A growing market at the intersection of family management, mental health, and AI"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Stat 
          value="€19.6B" 
          label="projected family management market in USA by 2028"
          icon={<TrendingUp className="text-indigo-500" />}
        />
        <Stat 
          value="33.5M" 
          label="families with children in the US alone"
          icon={<Users className="text-blue-500" />}
        />
        <Stat 
          value="78%" 
          label="of dual-income families report mental load challenges"
          icon={<Target className="text-amber-500" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <TrendingUp className="mr-2 text-indigo-600" size={24} />
            Market Growth & Mental Load Awareness
          </h3>
          <div className="h-64 mb-10">
            <DataChart 
              type="bar"
              data={marketTrendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                      display: true,
                      text: 'Market Size (€ Billions)'
                    },
                    min: 0,
                  },
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                      drawOnChartArea: false,
                    },
                    title: {
                      display: true,
                      text: 'Mental Load Awareness %'
                    },
                    min: 0,
                    max: 100,
                  }
                },
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 20
                    }
                  }
                }
              }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-8">
            As mental load awareness grows, so does the market for solutions addressing family coordination challenges.
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 flex items-center mb-4">
            <Target className="mr-2" size={24} />
            Key Market Segments
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 mt-1 flex-shrink-0">
                <span className="text-indigo-600 font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Dual-Income Families</h4>
                <p className="text-sm text-gray-700 mb-1">
                  42.8M households in US and Europe with both parents working, facing significant time pressure 
                  and coordination challenges.
                </p>
                <div className="flex items-center">
                  <div className="h-2 flex-grow bg-gray-200 rounded-full">
                    <div className="h-full bg-indigo-600 rounded-full" style={{width: '65%'}}></div>
                  </div>
                  <span className="text-xs text-indigo-800 font-medium ml-2">Primary Focus</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 mt-1 flex-shrink-0">
                <span className="text-indigo-600 font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Single-Parent Households</h4>
                <p className="text-sm text-gray-700 mb-1">
                  21.5M single-parent households in US and Europe managing heightened mental load with fewer resources to 
                  share responsibilities.
                </p>
                <div className="flex items-center">
                  <div className="h-2 flex-grow bg-gray-200 rounded-full">
                    <div className="h-full bg-indigo-600 rounded-full" style={{width: '45%'}}></div>
                  </div>
                  <span className="text-xs text-indigo-800 font-medium ml-2">Secondary Focus</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 mt-1 flex-shrink-0">
                <span className="text-indigo-600 font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Multi-Generational Households</h4>
                <p className="text-sm text-gray-700 mb-1">
                  17.5M households in US and Europe with complex care and coordination needs across multiple generations,
                  including children and elder care responsibilities.
                </p>
                <div className="flex items-center">
                  <div className="h-2 flex-grow bg-gray-200 rounded-full">
                    <div className="h-full bg-indigo-600 rounded-full" style={{width: '30%'}}></div>
                  </div>
                  <span className="text-xs text-indigo-800 font-medium ml-2">Growth Opportunity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-5">
          <Globe className="mr-2 text-indigo-600" size={24} />
          Global Market Opportunities
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            title="North America" 
            icon={<Globe size={24} />} 
            className="bg-gradient-to-br from-blue-50 to-indigo-100"
          >
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Market Size:</span>
                <span className="font-medium text-gray-800">€8.1B by 2028</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Growth Rate:</span>
                <span className="font-medium text-gray-800">24.5% CAGR</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Target Families:</span>
                <span className="font-medium text-gray-800">42.8M</span>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Initial market focus with highest awareness of mental load concepts and premium subscription willingness.
            </p>
          </Card>
          
          <Card 
            title="Europe" 
            icon={<Globe size={24} />} 
            className="bg-gradient-to-br from-purple-50 to-indigo-100"
          >
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Market Size:</span>
                <span className="font-medium text-gray-800">€6.7B by 2028</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Growth Rate:</span>
                <span className="font-medium text-gray-800">21.3% CAGR</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Target Families:</span>
                <span className="font-medium text-gray-800">38.5M</span>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Strong cultural alignment with work-life balance values and progressive family policies.
            </p>
          </Card>
          
          <Card 
            title="Asia Pacific" 
            icon={<Globe size={24} />} 
            className="bg-gradient-to-br from-amber-50 to-yellow-100"
          >
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Market Size:</span>
                <span className="font-medium text-gray-800">€5.0B by 2028</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Growth Rate:</span>
                <span className="font-medium text-gray-800">27.8% CAGR</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Target Families:</span>
                <span className="font-medium text-gray-800">72.3M</span>
              </div>
            </div>
            <p className="text-xs text-gray-600">
              Emerging opportunity with rapid urbanization, growing middle class, and increasing dual-income households.
            </p>
          </Card>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Market Entry Strategy</h4>
          <p className="text-sm text-gray-600">
            We're pursuing a phased global rollout, starting with the US market in Years 1-2, 
            expanding to Canada, UK, and Australia in Year 3, and entering select European and 
            Asian markets in Years 4-5. This approach allows us to refine our product-market fit 
            in English-speaking regions before tackling the localization challenges of international expansion.
          </p>
          <p className="text-xs text-gray-500 mt-3 italic">
            <span className="font-medium">Note on currency:</span> All figures are presented in Euro (€) using an approximate conversion rate of 1 USD = 0.93 EUR.
          </p>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default MarketSummarySlide;