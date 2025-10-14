import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Stat } from './components';
import { Eye, Lightbulb, BarChart, Users, TrendingUp, DollarSign, Target, Globe } from 'lucide-react';

/**
 * OnePager Slide - Comprehensive summary of the entire investor presentation
 * Contains key highlights from all sections: Problem, Solution, Market, Growth, and Financing
 */
const OnePagerSlide = () => {
  // Mental health & parenting apps market data
  const marketData = {
    labels: ['2024', '2025', '2026', '2027', '2028'],
    datasets: [
      {
        label: 'Mental Health Apps ($B)',
        data: [7.5, 8.6, 9.9, 11.4, 13.1],
        backgroundColor: 'rgba(99, 102, 241, 0.7)',
      },
      {
        label: 'Parenting Apps ($B)',
        data: [0.9, 1.2, 1.6, 2.3, 3.3],
        backgroundColor: 'rgba(79, 70, 229, 0.4)',
      }
    ]
  };

  // Projected user growth data
  const userGrowthData = {
    labels: ['Y1-Q1', 'Y1-Q2', 'Y1-Q3', 'Y1-Q4', 'Y2-Q1', 'Y2-Q2'],
    datasets: [
      {
        label: 'Free Users (K)',
        data: [3, 8, 15, 25, 40, 60],
        backgroundColor: 'rgba(124, 58, 237, 0.6)',
      },
      {
        label: 'Paid Users (K)',
        data: [0.1, 0.3, 0.8, 1.5, 2.8, 4.5],
        backgroundColor: 'rgba(245, 158, 11, 0.7)',
      }
    ]
  };

  return (
    <SlideTemplate
      title="Allie: Family Mental Load Solution"
      subtitle="The first app directly addressing the cognitive burden of parenting"
    >
      {/* Key Stats */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <Stat value="€7.48B" label="Mental health apps market in 2024" color="text-indigo-700" />
        <Stat value="71%" label="Mental load falls on mothers" color="text-amber-600" />
        <Stat value="€1M" label="Pre-seed funding target" color="text-green-600" />
        <Stat value="€29.99" label="Monthly subscription" color="text-purple-700" />
        <Stat value="15.9%" label="Mental health apps CAGR (2024-2032)" color="text-indigo-700" />
      </div>

      {/* Problem & Solution */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Card 
          title="The Problem: Family Mental Load Crisis" 
          className="bg-gradient-to-br from-indigo-50 to-blue-100"
        >
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span><strong>71%</strong> of mental load falls on mothers vs. 45% on fathers</span>
            </div>
            <div className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span><strong>69%</strong> of working moms experience mental load burden</span>
            </div>
            <div className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span><strong>52%</strong> of mothers report burnout from mental load weight</span>
            </div>
            <div className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span><strong>73%</strong> of families abandon fragmented solutions in 3 months</span>
            </div>
            <div className="flex items-start">
              <span className="text-indigo-500 mr-2">•</span>
              <span>Mothers 2× more likely to consider reducing work hours</span>
            </div>
          </div>
        </Card>

        <Card 
          title="Our Solution: Mental Load Management" 
          className="bg-gradient-to-br from-purple-50 to-indigo-100"
        >
          <div className="flex justify-between mb-2">
            <div className="bg-purple-100 rounded-lg p-2 text-center w-[32%]">
              <div className="text-purple-800 flex items-center justify-center mb-1">
                <Eye size={16} className="mr-1" />
                <span className="font-medium text-sm">Awareness</span>
              </div>
              <p className="text-xs text-gray-700">Mental load assessment & visualization</p>
            </div>
            <div className="bg-purple-100 rounded-lg p-2 text-center w-[32%]">
              <div className="text-purple-800 flex items-center justify-center mb-1">
                <Lightbulb size={16} className="mr-1" />
                <span className="font-medium text-sm">Insights</span>
              </div>
              <p className="text-xs text-gray-700">Personalized household dashboard</p>
            </div>
            <div className="bg-purple-100 rounded-lg p-2 text-center w-[32%]">
              <div className="text-purple-800 flex items-center justify-center mb-1">
                <BarChart size={16} className="mr-1" />
                <span className="font-medium text-sm">Actions</span>
              </div>
              <p className="text-xs text-gray-700">Task redistribution & automation</p>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span>Our <strong>proprietary Mental Load Index</strong> quantifies invisible work</span>
            </div>
            <div className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>AI-powered recommendations</strong> for workload redistribution</span>
            </div>
            <div className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>Calendar & task integrations</strong> to centralize family management</span>
            </div>
            <div className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>Shared accountability</strong> tools for both partners</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Market & Business */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Card 
            title="Market Opportunity" 
            className="mb-4 h-[280px]"
          >
            <div className="flex h-full">
              <div className="w-1/2 pr-2">
                <div className="h-48">
                  <DataChart 
                    type="bar"
                    data={marketData}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Market Size ($B)'
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 12,
                            padding: 8
                          }
                        }
                      }
                    }}
                    height={180}
                  />
                </div>
                <div className="text-xs text-gray-700 mt-3">
                  <div className="flex items-start">
                    <span className="text-indigo-500 mr-2">•</span>
                    <span>Mental health apps to reach <strong>$26B by 2032</strong></span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-indigo-500 mr-2">•</span>
                    <span>Parenting apps growing at <strong>12.2% CAGR</strong></span>
                  </div>
                </div>
              </div>
              <div className="w-1/2 pl-2 border-l border-gray-200">
                <h4 className="font-medium text-sm text-gray-800 mb-2">Target Customer Segments</h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-indigo-50 p-2 rounded">
                    <div className="font-medium text-indigo-800">Dual-Income Families</div>
                    <div className="text-gray-700">42.8M households in US & Europe</div>
                    <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{width: '65%'}}></div>
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded">
                    <div className="font-medium text-indigo-800">Single-Parent Households</div>
                    <div className="text-gray-700">21.5M households with heavier mental load</div>
                    <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{width: '45%'}}></div>
                    </div>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded">
                    <div className="font-medium text-indigo-800">North America & Europe</div>
                    <div className="text-gray-700">Initial market focus with 38.7% of global share</div>
                    <div className="mt-1 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{width: '39%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div>
          <Card 
            title="Business Model & Growth" 
            className="mb-4 h-[280px]"
          >
            <div className="flex">
              <div className="w-1/2 pr-3">
                <div className="space-y-2 text-sm">
                  <div className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    <span><strong>Subscription model</strong> with premium features</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    <span><strong>€29.99/month</strong> or <strong>€299/year</strong> subscription</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    <span><strong>14-day free trial</strong> to demonstrate value</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    <span>Target <strong>10%</strong> trial-to-paid conversion</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-amber-500 mr-2">•</span>
                    <span>Future <strong>B2B partnerships</strong> with employers</span>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium text-sm text-gray-800 mb-1">Year 2 Projections</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-amber-50 p-2 rounded">
                      <div className="font-medium text-amber-800">Users</div>
                      <div className="text-gray-700">60K free, 4.5K paid</div>
                    </div>
                    <div className="bg-amber-50 p-2 rounded">
                      <div className="font-medium text-amber-800">Revenue</div>
                      <div className="text-gray-700">€1.62M ARR</div>
                    </div>
                    <div className="bg-amber-50 p-2 rounded">
                      <div className="font-medium text-amber-800">CAC</div>
                      <div className="text-gray-700">€90 per paid user</div>
                    </div>
                    <div className="bg-amber-50 p-2 rounded">
                      <div className="font-medium text-amber-800">LTV</div>
                      <div className="text-gray-700">€720 (2yr retention)</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-1/2 pl-3 border-l border-gray-200">
                <div className="h-60">
                  <DataChart 
                    type="bar"
                    data={userGrowthData}
                    options={{
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Users (K)'
                          }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            boxWidth: 12,
                            padding: 8
                          }
                        }
                      }
                    }}
                    height={200}
                  />
                </div>
                <div className="text-xs text-center text-gray-600 mt-1">
                  Projected growth to <strong>60K free</strong> and <strong>4.5K paid</strong> users in 18 months
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Competitive Advantage & Financing */}
      <div className="grid grid-cols-2 gap-4">
        <Card 
          title="Competitive Advantage" 
          className="bg-gradient-to-br from-indigo-50 to-purple-100"
        >
          <div className="mb-3">
            <div className="relative h-28">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-purple-600 flex items-center justify-center z-20">
                  <div className="text-white text-center">
                    <div className="font-bold text-lg">Allie AI</div>
                    <div className="text-xs">Mental Load Solution</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full border-2 border-dashed border-purple-300 z-10"></div>
              
              <div className="absolute top-2 left-1/4 transform -translate-x-1/2 bg-white px-2 py-1 rounded-full shadow-sm z-30">
                <span className="text-xs font-medium text-purple-800">Shared Dashboard</span>
              </div>
              
              <div className="absolute bottom-2 left-1/3 transform -translate-x-1/2 bg-white px-2 py-1 rounded-full shadow-sm z-30">
                <span className="text-xs font-medium text-purple-800">Task Weighting</span>
              </div>
              
              <div className="absolute top-2 right-1/4 transform translate-x-1/2 bg-white px-2 py-1 rounded-full shadow-sm z-30">
                <span className="text-xs font-medium text-purple-800">Partner Insights</span>
              </div>
              
              <div className="absolute bottom-2 right-1/3 transform translate-x-1/2 bg-white px-2 py-1 rounded-full shadow-sm z-30">
                <span className="text-xs font-medium text-purple-800">Integrations</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>First dedicated solution</strong> for mental load balancing</span>
            </div>
            <div className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>Competing solutions</strong> fragment tasks, increasing burden</span>
            </div>
            <div className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>Research-based</strong> approach validated by psychologists</span>
            </div>
            <div className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>Mental health benefits</strong> reduce parental burnout</span>
            </div>
          </div>
        </Card>
        
        <Card 
          title="Financing & Use of Funds" 
          className="bg-gradient-to-br from-amber-50 to-yellow-100"
        >
          <div className="flex items-center justify-center mb-3 bg-white p-2 rounded-lg">
            <div className="text-center px-3 bg-amber-100 rounded-lg py-2">
              <div className="text-xs text-gray-700">Pre-Seed Round</div>
              <div className="font-bold text-amber-800">€1M</div>
              <div className="text-xs text-gray-700">€5M cap SAFE</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="font-medium text-sm text-indigo-800">Product (60%)</div>
              <div className="text-xs text-gray-600 mt-1">MVP development, early features, APIs & integrations</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="font-medium text-sm text-indigo-800">Marketing (25%)</div>
              <div className="text-xs text-gray-600 mt-1">Beta launch, early user acquisition, brand building</div>
            </div>
            <div className="bg-white rounded-lg p-2 text-center">
              <div className="font-medium text-sm text-indigo-800">Operations (15%)</div>
              <div className="text-xs text-gray-600 mt-1">Infrastructure, compliance, legal setup</div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-2">
            <h4 className="font-medium text-sm text-gray-800 mb-1">12-Month Milestones</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                <span><strong>MVP Launch</strong> with core features</span>
              </div>
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                <span><strong>25K</strong> app downloads</span>
              </div>
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                <span><strong>1.5K</strong> paying subscribers</span>
              </div>
              <div className="flex items-start">
                <span className="text-amber-500 mr-2">•</span>
                <span><strong>Seed round</strong> preparation</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Team banner */}
      <div className="mt-4 bg-indigo-600 text-white p-2 rounded-lg text-center">
        <div className="font-medium">Founding team with backgrounds in psychology, product development, and family systems research</div>
      </div>
    </SlideTemplate>
  );
};

export default OnePagerSlide;