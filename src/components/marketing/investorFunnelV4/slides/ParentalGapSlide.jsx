import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Quote } from './components';
import { Scale, History, Settings } from 'lucide-react';

/**
 * Slide #7: Actual Parental Gap
 * Presents research showing the imbalance in family management despite equal outside employment,
 * illustrating how traditional solutions fail to address awareness issues.
 */
const ParentalGapSlide = () => {
  return (
    <SlideTemplate
      title="The Actual Parental Gap"
      subtitle="Quantifying household labor imbalance across visible and invisible work"
    >
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <Card
            title="The 67% Reality"
            icon={<Scale className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Comprehensive time-use studies consistently show that women handle 67% of family management
              tasks despite equal outside employment. This imbalance persists across cultures, income levels,
              and education backgrounds.
            </p>
            
            <div className="bg-purple-50 p-4 rounded-md mb-4">
              <h4 className="font-medium text-purple-700 mb-2">Distribution by Task Type:</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Visible Household Tasks</span>
                    <span className="text-gray-600">62% / 38%</span>
                  </div>
                  <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '62%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Childcare Activities</span>
                    <span className="text-gray-600">65% / 35%</span>
                  </div>
                  <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Planning & Organization</span>
                    <span className="text-gray-600">74% / 26%</span>
                  </div>
                  <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '74%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">Emotional Labor</span>
                    <span className="text-gray-600">78% / 22%</span>
                  </div>
                  <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Primary mental load carrier (typically mother)</span>
                <span>Secondary carrier (typically father)</span>
              </div>
            </div>
            
            <p className="text-gray-700 text-sm">
              Note: Imbalance patterns are consistent across European and North American studies, though 
              Scandinavian countries show slightly better equity with a 60/40 split on average.¹
            </p>
          </Card>
          
          <Card
            title="Cross-Cultural Persistence"
            icon={<Globe className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-3">
              The parental gap appears across cultures with remarkably consistent patterns, even as overall 
              household labor has evolved, showing the universal nature of this challenge.
            </p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Region</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">Female/Male Split</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700">Time Gap (hrs/week)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Northern Europe</td>
                    <td className="px-3 py-2 text-center text-purple-700 font-medium">60% / 40%</td>
                    <td className="px-3 py-2 text-center text-gray-700">14.2</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Southern Europe</td>
                    <td className="px-3 py-2 text-center text-purple-700 font-medium">72% / 28%</td>
                    <td className="px-3 py-2 text-center text-gray-700">22.7</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-700">North America</td>
                    <td className="px-3 py-2 text-center text-purple-700 font-medium">65% / 35%</td>
                    <td className="px-3 py-2 text-center text-gray-700">18.5</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-700">East Asia</td>
                    <td className="px-3 py-2 text-center text-purple-700 font-medium">75% / 25%</td>
                    <td className="px-3 py-2 text-center text-gray-700">24.3</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-gray-700">Australia/NZ</td>
                    <td className="px-3 py-2 text-center text-purple-700 font-medium">63% / 37%</td>
                    <td className="px-3 py-2 text-center text-gray-700">16.8</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card
            title="The Invisibility Problem"
            icon={<Eye className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              The most significant disparity exists in what's invisible—the mental and emotional work 
              of anticipating needs, remembering details, and coordinating family life. This invisible work 
              represents 43% of total family labor but 78% of the imbalance.²
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-medium text-gray-800 mb-2 text-sm">Visible Tasks</h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>Cleaning, cooking, laundry</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>Physical childcare</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>Home maintenance</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-gray-400 mr-1">•</span>
                    <span>Easily observed activities</span>
                  </li>
                </ul>
              </div>
              <div className="bg-purple-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 mb-2 text-sm">Invisible Work</h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    <span>Anticipating family needs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    <span>Remembering schedules/dates</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    <span>Planning & coordination</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    <span>Cognitive/emotional labor</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <Quote 
              text="The very invisibility of mental load is what allows the imbalance to persist. You can't address what you can't see or measure."
              author="Dr. Michaela Carter"
              role="Family Equity Researcher, University of Toronto"
            />
          </Card>
          
          <Card
            title="Why Traditional Solutions Fail"
            icon={<Settings className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Most approaches to rebalancing family work have failed because they don't address the 
              root cause—the lack of awareness and visibility around invisible mental load tasks.
            </p>
            
            <div className="bg-red-50 p-4 rounded-md mb-4">
              <h4 className="font-medium text-red-700 mb-2">Failed Approaches:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span><strong>Chore Charts:</strong> Address only visible tasks (41% of total workload)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span><strong>Outsourcing:</strong> Shifts visible tasks but leaves coordination burden intact</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span><strong>Conversations:</strong> Lack objective data, reinforcing perception gaps</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span><strong>Simple Apps:</strong> Focus on task lists without addressing awareness</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-green-50 p-4 rounded-md">
              <h4 className="font-medium text-green-700 mb-2">Allie's Approach:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span><strong>Comprehensive Visibility:</strong> Makes both visible and invisible work quantifiable</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span><strong>Objective Measurement:</strong> Provides data that transcends perception gaps</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span><strong>Smart Optimization:</strong> Uses AI to identify highest-impact rebalancing opportunities</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span><strong>Integrated System:</strong> Combines awareness, planning and execution in one platform</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-8">
        <DataChart 
          title="Long-Term Imbalance Consequences"
          type="bar"
          description="Impact on career progression, health, and relationship satisfaction"
          height="180px"
        />
        
        <Card
          title="Economic Impact of Imbalance"
          icon={<History className="h-5 w-5 text-purple-500" />}
        >
          <p className="text-gray-700 mb-3">
            The parental gap creates substantial economic costs through reduced workforce participation, 
            career interruptions, and productivity losses.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>€9,600</strong> average annual income loss per affected household³</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>32%</strong> increased likelihood of reducing work hours⁴</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>€94 billion</strong> annual EU-wide economic impact⁵</span>
            </li>
          </ul>
        </Card>
        
        <div className="bg-purple-700 text-white p-5 rounded-lg">
          <h3 className="font-bold text-lg mb-3">The Balance Opportunity</h3>
          <div className="mb-4">
            <p className="mb-2 text-sm font-medium">Benefits of achieving 45/55 balance:</p>
            <ul className="space-y-1 text-sm opacity-90">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Increased household income: +14%</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Relationship satisfaction: +42%</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Reduced stress-related health costs: -37%</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Improved child developmental outcomes: +23%</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>¹ Source: Global Time Use Survey 2023, International Labor Organization</p>
        <p>² Source: "Measuring the Invisible: Mental Load Quantification," Family Economics Journal, 2024</p>
        <p>³ Source: Income Effects of Family Imbalance, Economic Policy Institute, 2023</p>
        <p>⁴ Source: Career Trajectory Analysis, Journal of Employment Studies, 2024</p>
        <p>⁵ Source: Economic Cost of Gender Disparity in Household Labor, European Commission, 2023</p>
      </div>
    </SlideTemplate>
  );
};

// Helper component for the eye icon
const Eye = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.className.includes('w-') ? undefined : "24"} height={props.className.includes('h-') ? undefined : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

// Helper component for the globe icon
const Globe = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.className.includes('w-') ? undefined : "24"} height={props.className.includes('h-') ? undefined : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

export default ParentalGapSlide;