import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Stat } from './components';
import { TrendingUp, Users, DollarSign, Globe } from 'lucide-react';

const MarketSizeSlide = () => {
  const marketData = {
    labels: ['2024', '2025', '2026', '2027', '2028'],
    datasets: [
      {
        label: 'Family Management Apps',
        data: [5.8, 7.9, 10.6, 14.2, 18.5],
        borderColor: 'rgba(99, 102, 241, 0.8)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Digital Mental Health',
        data: [25.3, 31.6, 39.8, 49.7, 62.1],
        borderColor: 'rgba(245, 158, 11, 0.8)',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        yAxisID: 'y',
      }
    ]
  };

  return (
    <SlideTemplate
      title="Addressable Market"
      subtitle="A large and growing opportunity at the intersection of family management and digital mental health"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Stat 
          value="33.5M" 
          label="families in the US with children under 18"
          icon={<Users className="text-indigo-500" />}
        />
        <Stat 
          value="$18.5B" 
          label="family management app market by 2028"
          icon={<TrendingUp className="text-blue-500" />}
        />
        <Stat 
          value="$62.1B" 
          label="digital mental health market by 2028"
          icon={<DollarSign className="text-amber-500" />}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <TrendingUp className="mr-2 text-indigo-600" size={24} />
            Market Growth Projections (in Billions USD)
          </h3>
          <div className="h-64">
            <DataChart 
              type="line"
              data={marketData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Market Size (Billions USD)'
                    }
                  }
                }
              }}
            />
          </div>
        </div>

        <Card 
          title="Target Market Segments" 
          icon={<Globe size={24} />} 
          className="bg-white shadow-lg"
        >
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-indigo-800 mb-1">Primary: Dual-Career Families</h4>
              <p className="text-gray-700 text-sm">
                17.3M families in the US with both parents working, facing significant time pressure 
                and mental load challenges
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">Secondary: Single Parents</h4>
              <p className="text-gray-700 text-sm">
                11.2M single-parent households managing heightened mental load with fewer resources
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-1">Tertiary: International Expansion</h4>
              <p className="text-gray-700 text-sm">
                150M+ families across Europe, Canada, Australia, and developed Asian markets
              </p>
            </div>
            
            <div className="p-3 bg-amber-50 rounded-lg">
              <h4 className="font-medium text-amber-800 mb-1">Future Growth: Extended Family Networks</h4>
              <p className="text-gray-700 text-sm">
                9.3M multi-generational households with complex care and coordination needs
              </p>
            </div>
          </div>
        </Card>
      </div>
    </SlideTemplate>
  );
};

export default MarketSizeSlide;