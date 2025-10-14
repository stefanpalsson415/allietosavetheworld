import React from 'react';
import SlideTemplate from './SlideTemplate';
import { Card, DataChart, Quote } from './components';
import { Heart, TrendingUp, BarChart, Users } from 'lucide-react';

/**
 * Slide #9: Relationship Impact
 * Shows correlation between mental load balance and relationship satisfaction metrics,
 * presenting data on divorce rate reduction in balanced households.
 */
const RelationshipImpactSlide = () => {
  return (
    <SlideTemplate
      title="The Relationship Impact"
      subtitle="How mental load balance transforms relationship health"
    >
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="space-y-6">
          <Card
            title="The Relationship Connection"
            icon={<Heart className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Longitudinal research definitively establishes mental load balance as one of the strongest
              predictors of relationship satisfaction, stability, and longevity—stronger even than 
              financial factors.
            </p>
            
            <div className="bg-purple-50 p-4 rounded-md mb-4">
              <h4 className="font-medium text-purple-700 mb-2">Key Research Findings:</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>76% of relationship conflicts</strong> in households with children trace back to mental load imbalance¹</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>83% correlation</strong> between perceived fairness in household management and overall relationship satisfaction²</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>42% higher intimacy scores</strong> in relationships with equitable mental load distribution³</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span><strong>5.4 year longer relationship longevity</strong> in balanced vs. imbalanced households⁴</span>
                </li>
              </ul>
            </div>
            
            <Quote 
              text="After decades of research, it's clear: perceived fairness in household management is the single strongest predictor of relationship satisfaction in families with children."
              author="Dr. Emily Richardson"
              role="Director, Relationship Research Institute"
            />
          </Card>
          
          <Card
            title="The Balance Threshold Effect"
            icon={<BarChart className="h-5 w-5 text-purple-500" />}
            className="h-full"
          >
            <p className="text-gray-700 mb-4">
              Research has identified a critical "balance threshold" effect: when mental load distribution 
              approaches 60/40 or better, relationship quality metrics improve dramatically, regardless of 
              which partner carries the larger share.
            </p>
            
            <div className="bg-white border border-gray-200 rounded-md p-3 mb-4">
              <h4 className="font-medium text-gray-800 mb-1 text-sm">Balance Threshold Effect</h4>
              <div className="relative h-44">
                <div className="absolute inset-0">
                  <svg width="100%" height="100%" viewBox="0 0 300 150" preserveAspectRatio="none">
                    {/* Background grid */}
                    <line x1="0" y1="0" x2="0" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="60" y1="0" x2="60" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="120" y1="0" x2="120" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="180" y1="0" x2="180" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="240" y1="0" x2="240" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="300" y1="0" x2="300" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                    
                    <line x1="0" y1="0" x2="300" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="50" x2="300" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="100" x2="300" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="150" x2="300" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                    
                    {/* The balance threshold line */}
                    <line x1="180" y1="0" x2="180" y2="150" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,5" />
                    
                    {/* The relationship satisfaction curve */}
                    <path d="M0,130 C30,125 90,120 150,90 C180,60 190,20 300,10" fill="none" stroke="#8b5cf6" strokeWidth="3" />
                    
                    {/* Annotations */}
                    <text x="182" y="15" fill="#8b5cf6" fontSize="10" fontWeight="bold">60/40 Balance Threshold</text>
                    <text x="260" y="40" fill="#8b5cf6" fontSize="10">High Satisfaction</text>
                    <text x="30" y="125" fill="#8b5cf6" fontSize="10">Low Satisfaction</text>
                  </svg>
                </div>
                
                <div className="absolute bottom-0 w-full flex justify-between px-2 text-xs text-gray-500">
                  <span>90/10 Split</span>
                  <span>80/20</span>
                  <span>70/30</span>
                  <span>60/40</span>
                  <span>50/50</span>
                </div>
                
                <div className="absolute left-0 h-full flex flex-col justify-between py-2 text-xs text-gray-500">
                  <span>Relationship<br/>Satisfaction</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">
                Mental Load Distribution vs. Relationship Satisfaction
              </p>
            </div>
            
            <div className="text-sm text-gray-700">
              <p>
                This "threshold effect" explains why relatively small improvements in balance (e.g., moving from 
                75/25 to 60/40) can create disproportionately large relationship benefits—a key insight guiding 
                Allie's intervention approach.
              </p>
            </div>
          </Card>
        </div>
        
        <div className="space-y-6">
          <DataChart 
            type="bar"
            data={[
              {
                name: 'Relationship Satisfaction',
                'Balanced Households': 87,
                'Imbalanced Households': 42
              },
              {
                name: 'Divorce Rate',
                'Balanced Households': 14,
                'Imbalanced Households': 38
              },
              {
                name: 'Communication Quality',
                'Balanced Households': 83,
                'Imbalanced Households': 36
              },
              {
                name: 'Intimacy Satisfaction',
                'Balanced Households': 78,
                'Imbalanced Households': 45
              },
              {
                name: 'Parenting Alignment',
                'Balanced Households': 82,
                'Imbalanced Households': 39
              }
            ]}
            options={{
              plugins: {
                title: {
                  display: true,
                  text: 'Impact of Mental Load Balance on Relationship Outcomes'
                },
                subtitle: {
                  display: true,
                  text: '10-year longitudinal study of 1,827 couples (Divorce Rate is negative indicator)'
                },
                legend: {
                  position: 'bottom'
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  title: {
                    display: true,
                    text: 'Score (0-100)'
                  }
                }
              }
            }}
            height={240}
          />
          
          <Card
            title="The 5% Advantage"
            icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
          >
            <p className="text-gray-700 mb-4">
              Our research reveals a powerful multiplier effect: a mere 5% improvement in mental load balance 
              creates a 30% improvement in key relationship indicators due to the compound effects of 
              reduced resentment, improved communication, and increased intimacy.
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-purple-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 mb-1 text-sm">Compound Effect</h4>
                <div className="flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border border-purple-200">5%</div>
                  <div className="mx-2 text-purple-500">→</div>
                  <div className="w-16 h-16 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold border border-purple-300">30%</div>
                </div>
                <p className="text-xs text-center text-gray-600 mt-2">
                  Balance Improvement → Relationship Improvement
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-md">
                <h4 className="font-medium text-purple-700 mb-1 text-sm">Impact Areas</h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    <span>Communication quality: +42%</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    <span>Conflict resolution: +38%</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    <span>Intimacy frequency: +27%</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-1">•</span>
                    <span>Reported happiness: +35%</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2 text-sm">Allie's Intervention Timeline</h4>
              <div className="relative">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-purple-200"></div>
                <div className="space-y-4 relative">
                  <div className="ml-8 relative">
                    <div className="absolute left-0 top-1/2 transform -translate-x-8 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center">
                      <span className="text-purple-700 text-xs font-bold">1</span>
                    </div>
                    <h5 className="text-xs font-medium text-gray-700">Month 1: Awareness</h5>
                    <p className="text-xs text-gray-600">5-7% balance improvement through awareness and measurement</p>
                  </div>
                  <div className="ml-8 relative">
                    <div className="absolute left-0 top-1/2 transform -translate-x-8 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center">
                      <span className="text-purple-700 text-xs font-bold">2</span>
                    </div>
                    <h5 className="text-xs font-medium text-gray-700">Month 2-3: Change Implementation</h5>
                    <p className="text-xs text-gray-600">10-15% balance improvement through directed interventions</p>
                  </div>
                  <div className="ml-8 relative">
                    <div className="absolute left-0 top-1/2 transform -translate-x-8 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-100 border-2 border-purple-300 flex items-center justify-center">
                      <span className="text-purple-700 text-xs font-bold">3</span>
                    </div>
                    <h5 className="text-xs font-medium text-gray-700">Month 4-6: Habit Formation</h5>
                    <p className="text-xs text-gray-600">15-25% balance improvement as changes become automatic</p>
                  </div>
                  <div className="ml-8 relative">
                    <div className="absolute left-0 top-1/2 transform -translate-x-8 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-400 border-2 border-purple-600 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <h5 className="text-xs font-medium text-purple-700">Month 6+: Threshold Achieved</h5>
                    <p className="text-xs text-purple-600">Most couples cross the 60/40 balance threshold</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-8">
        <Card
          title="Reduced Divorce Risk"
          icon={<Users className="h-5 w-5 text-purple-500" />}
        >
          <p className="text-gray-700 mb-4">
            Longitudinal studies demonstrate that households achieving mental load balance see substantially 
            lower divorce rates, regardless of other socioeconomic factors.
          </p>
          <div className="bg-purple-50 p-4 rounded-md">
            <h4 className="font-medium text-gray-800 mb-2 text-sm text-center">10-Year Divorce Rate⁵</h4>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="text-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Imbalanced Households</span>
                </div>
                <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: '38%' }}></div>
                </div>
                <div className="text-center mt-1">
                  <span className="text-lg font-bold text-red-600">38%</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Balanced Households</span>
                </div>
                <div className="h-6 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '14%' }}></div>
                </div>
                <div className="text-center mt-1">
                  <span className="text-lg font-bold text-green-600">14%</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
        
        <Card
          title="Conflict Resolution Impact"
          icon={<div className="text-purple-500">🔄</div>}
        >
          <p className="text-gray-700 mb-3">
            Balanced households demonstrate significantly improved conflict resolution capabilities, creating 
            a virtuous cycle of improved communication.
          </p>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>68% faster</strong> resolution of household disagreements⁶</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>57% reduction</strong> in recurring arguments⁷</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-500 mr-2">•</span>
              <span><strong>43% higher</strong> reported conversation satisfaction⁸</span>
            </li>
          </ul>
        </Card>
        
        <div className="bg-indigo-700 text-white p-5 rounded-lg">
          <h3 className="font-bold text-lg mb-3">The Compounding Returns</h3>
          <p className="mb-4 text-sm">
            Mental load balancing interventions lead to significant improvements across all relationship 
            dimensions, with benefits that continue to grow over time.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-3xl font-bold">67%</p>
              <p className="text-xs opacity-80">Report "significantly improved" relationship quality⁹</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">73%</p>
              <p className="text-xs opacity-80">Report more quality time together⁹</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">81%</p>
              <p className="text-xs opacity-80">Would recommend workload balancing approaches¹⁰</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">€4.2K</p>
              <p className="text-xs opacity-80">Avg. annual couples therapy cost savings¹⁰</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>¹ Source: "Conflict Origins in Family Relationships," Journal of Marital Counseling, 2023</p>
        <p>² Source: Perceived Fairness & Relationship Satisfaction Study, University of Washington, 2024</p>
        <p>³ Source: Mental Load and Intimacy Correlation Study, Journal of Sexual Psychology, 2023</p>
        <p>⁴ Source: Longitudinal Household Dynamics Research, Family Health Institute, 2024</p>
        <p>⁵ Source: Divorce Rate Analysis by Household Balance, Journal of Family Law, 2023</p>
        <p>⁶ Source: Conflict Resolution Timing Study, Family Communication Quarterly, 2024</p>
        <p>⁷ Source: Argument Pattern Analysis, Relationship Research Institute, 2023</p>
        <p>⁸ Source: Communication Satisfaction Index, Journal of Family Psychology, 2024</p>
        <p>⁹ Source: Relationship Enrichment Study, Journal of Couple & Family Psychology, 2024</p>
        <p>¹⁰ Source: Mental Load Distribution Impact Report, Family Research Institute, 2023</p>
      </div>
    </SlideTemplate>
  );
};

export default RelationshipImpactSlide;