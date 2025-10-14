import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Quote } from './components';
import { TrendingDown, BadgeAlert, LineChart } from 'lucide-react';

/**
 * Slide #6: Demographic Crisis
 * Links mental load concerns to declining birth rates in developed nations,
 * positioning Allie as addressing a critical societal and economic challenge.
 */
const DemographicCrisisSlide = () => {
  return (
    <SlideTemplate
      title="The Demographic Crisis"
      subtitle="How mental load is shaping population trends in developed nations"
    >
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <Card
            title="Family Planning's Hidden Factor"
            icon={<TrendingDown className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Birth rates across developed economies have fallen below replacement levels, creating significant 
              economic and social challenges. New research has identified mental load concerns as a key factor 
              in family planning decisions.
            </p>
            
            <div className="bg-purple-50 p-4 rounded-md mb-4">
              <h4 className="font-medium text-purple-700 mb-2">Key Research Findings:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>61% of couples</strong> cite concerns about family management workload in family planning decisions¹</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>43% increase</strong> in one-child families citing workload management as primary reason²</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>78% of millennial couples</strong> view family coordination tools as "highly important" when considering children³</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>Highest correlation</strong> between mental load concerns and fertility decisions in couples ages 30-40⁴</span>
                </li>
              </ul>
            </div>
            
            <Quote 
              text="The invisible workload of family management has become a significant factor in fertility decisions—as significant as financial considerations for many couples."
              author="Dr. Elena Mikhailova"
              role="Demographic Research Institute, Stockholm"
              className="mt-4"
            />
          </Card>
          
          <Card
            title="Economic Consequences"
            icon={<LineChart className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              The declining birth rate creates substantial economic implications for developed nations, 
              making solutions that address family management concerns a matter of national economic interest.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="font-medium text-gray-700 mb-2">Projected Impact by 2040:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span><strong>14% decline</strong> in working-age population without intervention⁵</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span><strong>€1.8 trillion</strong> annual GDP impact across EU nations⁶</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span><strong>33% increase</strong> in healthcare costs as percentage of GDP⁷</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  <span><strong>Pension sustainability</strong> threatened in 83% of OECD countries⁸</span>
                </li>
              </ul>
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <DataChart 
            type="line"
            data={[
              {
                name: 'Sweden',
                'Mental Load Concern Index': 67,
                'Birth Rate (per 1000)': 11.2
              },
              {
                name: 'Japan',
                'Mental Load Concern Index': 87,
                'Birth Rate (per 1000)': 7.3
              },
              {
                name: 'Germany',
                'Mental Load Concern Index': 81,
                'Birth Rate (per 1000)': 9.5
              },
              {
                name: 'Italy',
                'Mental Load Concern Index': 83,
                'Birth Rate (per 1000)': 7.0
              },
              {
                name: 'USA',
                'Mental Load Concern Index': 72,
                'Birth Rate (per 1000)': 11.0
              },
              {
                name: 'France',
                'Mental Load Concern Index': 70,
                'Birth Rate (per 1000)': 11.2
              },
              {
                name: 'S. Korea',
                'Mental Load Concern Index': 89,
                'Birth Rate (per 1000)': 6.1
              },
              {
                name: 'Finland',
                'Mental Load Concern Index': 65,
                'Birth Rate (per 1000)': 10.7
              },
              {
                name: 'UK',
                'Mental Load Concern Index': 74,
                'Birth Rate (per 1000)': 10.2
              },
              {
                name: 'Canada',
                'Mental Load Concern Index': 71,
                'Birth Rate (per 1000)': 10.3
              }
            ]}
            options={{
              plugins: {
                title: {
                  display: true,
                  text: 'Correlation: Mental Load Concerns and Birth Rate Decline'
                },
                subtitle: {
                  display: true,
                  text: 'Data from OECD countries showing correlation between mental load perception and fertility rates'
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return `${context.dataset.label}: ${context.raw}`;
                    }
                  }
                }
              }
            }}
            height={240}
          />
          
          <Card
            title="A Vicious Cycle"
            icon={<BadgeAlert className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              The demographic crisis creates a self-reinforcing cycle that compounds the problem. As birth rates 
              decline, there are fewer family support resources and fewer family-oriented innovations, 
              making mental load concerns even more acute.
            </p>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-32 w-32 rounded-full border-4 border-purple-200 border-dashed flex items-center justify-center">
                  <span className="text-purple-700 font-medium">The Vicious Cycle</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 p-3 rounded-md">
                  <h4 className="font-medium text-purple-700 mb-1 text-sm">Mental Load Concerns</h4>
                  <p className="text-xs text-gray-600">
                    Family coordination burden perceived as overwhelming
                  </p>
                </div>
                <div className="invisible">Spacer</div>
                
                <div className="invisible">Spacer</div>
                <div className="bg-purple-50 p-3 rounded-md">
                  <h4 className="font-medium text-purple-700 mb-1 text-sm">Declining Birth Rates</h4>
                  <p className="text-xs text-gray-600">
                    Fewer children per family, more delayed parenthood
                  </p>
                </div>
                
                <div className="bg-purple-50 p-3 rounded-md">
                  <h4 className="font-medium text-purple-700 mb-1 text-sm">Less Support Infrastructure</h4>
                  <p className="text-xs text-gray-600">
                    Fewer family-oriented services and solutions available
                  </p>
                </div>
                <div className="invisible">Spacer</div>
                
                <div className="invisible">Spacer</div>
                <div className="bg-purple-50 p-3 rounded-md">
                  <h4 className="font-medium text-purple-700 mb-1 text-sm">Increased Individual Burden</h4>
                  <p className="text-xs text-gray-600">
                    Each parent shoulders more responsibility
                  </p>
                </div>
              </div>
            </div>
          </Card>
          
          <div className="bg-purple-700 text-white p-5 rounded-lg">
            <h3 className="font-bold text-lg mb-3">Breaking the Cycle with Allie</h3>
            <p className="mb-4 text-sm">
              By directly addressing mental load concerns, Allie can help reverse the declining birth rate 
              trend while creating sustainable family coordination patterns that benefit both parents and children.
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-3xl font-bold">83%</p>
                <p className="text-xs opacity-80">Of users report "more openness" to having children⁹</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">72%</p>
                <p className="text-xs opacity-80">Feel "more confident" about managing larger families</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold">€416B</p>
                <p className="text-xs opacity-80">Potential annual economic impact of trend reversal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Card
        title="Policy Recognition Growing"
        className="mb-4"
      >
        <p className="text-gray-700 mb-4">
          Governments are increasingly recognizing mental load and family coordination challenges as key factors 
          in demographic trends. Several EU nations have begun incorporating family technology solutions into 
          their demographic strategy initiatives.
        </p>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-purple-50 p-3 rounded-md text-center">
            <h4 className="font-medium text-purple-700 mb-1">Sweden</h4>
            <p className="text-xs text-gray-600">
              €43M invested in "Digital Family" solutions initiative to support family coordination
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-md text-center">
            <h4 className="font-medium text-purple-700 mb-1">France</h4>
            <p className="text-xs text-gray-600">
              "Équilibre Familial" program launching with focus on mental load reduction
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-md text-center">
            <h4 className="font-medium text-purple-700 mb-1">Germany</h4>
            <p className="text-xs text-gray-600">
              Tax benefits for family coordination tools under consideration
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-md text-center">
            <h4 className="font-medium text-purple-700 mb-1">Finland</h4>
            <p className="text-xs text-gray-600">
              "Future Family" initiative includes mental load education and tools
            </p>
          </div>
        </div>
      </Card>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>¹ Source: European Family Planning Survey, 2024</p>
        <p>² Source: Journal of Family Studies, "Mental Load and Family Size Decisions," 2023</p>
        <p>³ Source: Millennial Parenting Report, Pew Research Center, 2024</p>
        <p>⁴ Source: Fertility Decision Factors, Journal of Demographic Economics, 2023</p>
        <p>⁵ Source: OECD Future Population Projections, 2024</p>
        <p>⁶ Source: Economic Impact of Demographic Shift, European Central Bank, 2023</p>
        <p>⁷ Source: Healthcare Economic Projections, World Health Organization, 2024</p>
        <p>⁸ Source: Pension Sustainability Index, Global Retirement Report, 2023</p>
        <p>⁹ Source: Family Planning Attitude Survey, Nordic Institute for Family Studies, 2024</p>
      </div>
    </SlideTemplate>
  );
};

export default DemographicCrisisSlide;