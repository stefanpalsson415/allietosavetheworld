import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart } from './components';
import { Wind, TrendingUp, Users, Clock, Briefcase, Heart } from 'lucide-react';

const MacroTailwindsSlide = () => {
  const demographicData = {
    labels: ['2015', '2020', '2025', '2030'],
    datasets: [
      {
        label: 'Dual-Income Households (%)',
        data: [58, 63, 67, 72],
        borderColor: 'rgba(99, 102, 241, 0.8)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        yAxisID: 'y',
      },
      {
        label: 'Mental Load Stress (%)', // Updated to match the custom legend
        data: [45, 63, 78, 85],
        borderColor: 'rgba(245, 158, 11, 0.8)',
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        yAxisID: 'y',
      }
    ]
  };

  return (
    <SlideTemplate
      title="Macro Tailwinds"
      subtitle="Major societal trends creating a perfect opportunity for Allie"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center mb-4">
            <TrendingUp className="mr-2 text-indigo-600" size={24} />
            Converging Demographic Trends
          </h3>
          <div className="h-48"> {/* Slightly reduced height to ensure proper spacing */}
            <DataChart 
              type="line"
              data={demographicData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    min: 0,
                    max: 100,
                    title: {
                      display: true,
                      text: 'Percentage (%)'
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false, // Disable the chart's built-in legend since we're using a custom one below
                  }
                }
              }}
            />
          </div>
          <div className="bg-gray-50 p-2 rounded-lg mt-3 mb-3">
            <div className="flex justify-center gap-6">
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-indigo-600 mr-2"></div>
                <span className="text-sm text-gray-700 font-medium">Dual-Income Households (%)</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full bg-amber-500 mr-2"></div>
                <span className="text-sm text-gray-700 font-medium">Mental Load Stress (%)</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            The rise in dual-income households correlates directly with increasing reports of mental load stress, 
            creating growing demand for solutions like Allie.
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-100 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold text-indigo-800 flex items-center mb-4">
            <Wind className="mr-2" size={24} />
            Key Tailwinds Driving Adoption
          </h3>
          
          <div className="space-y-3">
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                <Briefcase size={18} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Remote Work Revolution</h4>
                <p className="text-sm text-gray-700">
                  The permanent shift to hybrid and remote work has increased domestic coordination needs 
                  while blurring work-home boundaries, heightening mental load challenges.
                </p>
                <div className="mt-2 flex items-center">
                  <span className="text-xs text-indigo-800 font-medium mr-2">Impact:</span>
                  <div className="h-2 w-24 bg-gray-200 rounded-full">
                    <div className="h-full bg-indigo-600 rounded-full" style={{width: '90%'}}></div>
                  </div>
                  <span className="text-xs text-indigo-800 ml-2">Very High</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                <Heart size={18} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Relationship Health Focus</h4>
                <p className="text-sm text-gray-700">
                  Growing awareness of mental load's impact on relationships has created demand for 
                  solutions that address underlying coordination inequalities.
                </p>
                <div className="mt-2 flex items-center">
                  <span className="text-xs text-indigo-800 font-medium mr-2">Impact:</span>
                  <div className="h-2 w-24 bg-gray-200 rounded-full">
                    <div className="h-full bg-indigo-600 rounded-full" style={{width: '85%'}}></div>
                  </div>
                  <span className="text-xs text-indigo-800 ml-2">High</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                <Clock size={18} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Time Scarcity Premium</h4>
                <p className="text-sm text-gray-700">
                  Families increasingly value time over money, creating willingness to pay for 
                  solutions that reduce cognitive burden and save mental energy.
                </p>
                <div className="mt-2 flex items-center">
                  <span className="text-xs text-indigo-800 font-medium mr-2">Impact:</span>
                  <div className="h-2 w-24 bg-gray-200 rounded-full">
                    <div className="h-full bg-indigo-600 rounded-full" style={{width: '80%'}}></div>
                  </div>
                  <span className="text-xs text-indigo-800 ml-2">High</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white bg-opacity-70 p-3 rounded-lg flex items-start">
              <div className="bg-indigo-100 p-2 rounded-full mr-3 flex-shrink-0">
                <Users size={18} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-medium text-indigo-800">Generational Shift</h4>
                <p className="text-sm text-gray-700">
                  Millennial and Gen Z parents expect more balanced domestic partnerships and 
                  actively seek technological solutions to household challenges.
                </p>
                <div className="mt-2 flex items-center">
                  <span className="text-xs text-indigo-800 font-medium mr-2">Impact:</span>
                  <div className="h-2 w-24 bg-gray-200 rounded-full">
                    <div className="h-full bg-indigo-600 rounded-full" style={{width: '95%'}}></div>
                  </div>
                  <span className="text-xs text-indigo-800 ml-2">Very High</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="Rising Mental Health Awareness" 
          icon={<Wind size={24} />} 
          className="bg-gradient-to-br from-blue-50 to-indigo-100"
        >
          <p className="text-gray-700 mb-3">
            Society's growing focus on mental health has made the concept of "mental load" mainstream, 
            with 78% more media mentions in 2024 compared to 2020.
          </p>
          <div className="bg-white bg-opacity-60 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-indigo-800 mb-1">Key Indicators:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>43% increase in Google searches for "mental load" (YoY)</li>
              <li>127 mainstream news articles on the topic in Q1 2025</li>
              <li>92% of women and 67% of men now familiar with the concept</li>
            </ul>
          </div>
        </Card>
        
        <Card 
          title="AI and Automation Adoption" 
          icon={<Wind size={24} />} 
          className="bg-gradient-to-br from-purple-50 to-indigo-100"
        >
          <p className="text-gray-700 mb-3">
            Consumer comfort with AI assistants has crossed the mainstream adoption threshold, 
            with 64% of US households now using some form of AI assistant regularly.
          </p>
          <div className="bg-white bg-opacity-60 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-indigo-800 mb-1">Market Readiness:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>73% increase in AI assistant adoption among families</li>
              <li>82% of parents believe AI can help with family coordination</li>
              <li>$14.3B spent on AI productivity tools in 2024</li>
            </ul>
          </div>
        </Card>
        
        <Card 
          title="Corporate Family Benefits" 
          icon={<Wind size={24} />} 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <p className="text-gray-700 mb-3">
            Leading employers are expanding benefits packages to include family coordination 
            support as a strategy for talent retention and employee wellbeing.
          </p>
          <div className="bg-white bg-opacity-60 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-amber-800 mb-1">Enterprise Opportunity:</h4>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
              <li>47% of Fortune 500 companies now offer family benefits</li>
              <li>$3.2B market for employer-sponsored family solutions</li>
              <li>72% of HR leaders prioritizing work-life balance support</li>
            </ul>
          </div>
        </Card>
      </div>

      <div className="mt-6 p-5 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">Why Now Is The Perfect Time</h3>
        <p className="text-gray-700 mb-4">
          The convergence of demographic shifts, technological capabilities, and social awareness 
          has created an unprecedented window of opportunity for Allie:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h4 className="font-medium text-indigo-800 text-sm mb-1">Problem Recognition</h4>
            <p className="text-xs text-gray-600">
              The concept of mental load has reached mainstream awareness, creating recognized demand
            </p>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h4 className="font-medium text-indigo-800 text-sm mb-1">Technology Readiness</h4>
            <p className="text-xs text-gray-600">
              AI and UX advances make it possible to deliver a solution that actually works
            </p>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h4 className="font-medium text-indigo-800 text-sm mb-1">Market Readiness</h4>
            <p className="text-xs text-gray-600">
              Willingness to pay for family coordination solutions at an all-time high
            </p>
          </div>
          
          <div className="bg-white p-3 rounded-lg shadow-sm">
            <h4 className="font-medium text-indigo-800 text-sm mb-1">Limited Competition</h4>
            <p className="text-xs text-gray-600">
              Current solutions address pieces of the problem but not the comprehensive mental load
            </p>
          </div>
        </div>
      </div>
    </SlideTemplate>
  );
};

export default MacroTailwindsSlide;