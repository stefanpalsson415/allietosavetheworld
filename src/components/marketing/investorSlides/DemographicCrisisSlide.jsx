import React, { useState } from 'react';
import { TrendingDown, Users, AlertTriangle, ChevronDown, ChevronUp, ChevronsRight, Clock, Heart, Check } from 'lucide-react';

const DemographicCrisisSlide = () => {
  const [activeSection, setActiveSection] = useState('demographic');

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">The Demographic Crisis: A Vicious Cycle</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left column */}
          <div>
            <button 
              onClick={() => toggleSection('demographic')}
              className={`w-full text-left mb-4 p-5 rounded-lg transition-colors ${
                activeSection === 'demographic' 
                  ? 'bg-red-50 border-2 border-red-200' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">The Demographic Shift</h3>
                {activeSection === 'demographic' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {activeSection === 'demographic' && (
              <div className="bg-white p-5 rounded-lg border border-gray-200 mb-6">
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 bg-red-100 text-red-700 rounded-full p-1">
                    <TrendingDown size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">Plummeting Birth Rates</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      Global fertility has fallen from <strong>5.1 births per woman in 1970</strong> to <strong>2.4 today</strong>, below replacement rate in developed nations.<sup>1</sup>
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      <li>• 1.5 in Germany, 1.3 in Spain, 1.2 in Italy — creating workforce crises<sup>2</sup></li>
                      <li>• US birth rate fell to 1.64 births per woman in 2023, a historic low<sup>3</sup></li>
                      <li>• 86% of developed nations now below replacement level (2.1)<sup>4</sup></li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 bg-red-100 text-red-700 rounded-full p-1">
                    <Users size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium">The "Sandwich Generation" Problem</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      As populations age, each young family faces unprecedented pressure, supporting <strong>more retirees</strong>, paying <strong>higher taxes</strong>, while simultaneously caring for <strong>both children and aging parents</strong>.<sup>5</sup>
                    </p>
                  </div>
                </div>
                
                <div className="bg-red-50 p-3 rounded border border-red-200 mt-4">
                  <h4 className="font-medium text-red-800 text-sm">Economic Impact Projections:</h4>
                  <ul className="mt-2 space-y-1 text-xs text-red-700">
                    <li>• Housing-price-to-income ratios have increased 137% since 1970<sup>6</sup></li>
                    <li>• Japan (-0.4%), Italy (-0.1%) showing negative GDP growth due to demographics<sup>7</sup></li>
                    <li>• US social security system projected to be insolvent by 2034<sup>8</sup></li>
                  </ul>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => toggleSection('causation')}
              className={`w-full text-left mb-4 p-5 rounded-lg transition-colors ${
                activeSection === 'causation' 
                  ? 'bg-blue-50 border-2 border-blue-200' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">Parental Load as Primary Cause</h3>
                {activeSection === 'causation' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {activeSection === 'causation' && (
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <div className="space-y-4">
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <ChevronsRight className="text-blue-700" size={14} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Mental Load Anxiety</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        73% of young adults (18-34) cite "overwhelming parental responsibilities" as a major reason for delaying or avoiding having children.<sup>9</sup>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <ChevronsRight className="text-blue-700" size={14} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Work-Family Conflict</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        62% of women cite the challenge of balancing work and family responsibilities as a primary concern when deciding whether to have children.<sup>10</sup>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <ChevronsRight className="text-blue-700" size={14} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">The Nordic Exception</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Countries with stronger family support systems and more balanced parental workloads (Sweden, Norway) have maintained higher birth rates than peer nations.<sup>11</sup>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <ChevronsRight className="text-blue-700" size={14} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Direct Research Correlation</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Studies show a 42% higher female workforce participation in countries with balanced workload distributions, correlating with 0.4 higher birth rates.<sup>12</sup>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right column */}
          <div>
            <button 
              onClick={() => toggleSection('cycle')}
              className={`w-full text-left mb-4 p-5 rounded-lg transition-colors ${
                activeSection === 'cycle' 
                  ? 'bg-purple-50 border-2 border-purple-200' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">The Vicious Cycle</h3>
                {activeSection === 'cycle' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {activeSection === 'cycle' && (
              <div className="bg-white p-5 rounded-lg border border-gray-200 mb-6">
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 mt-1 text-purple-700">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium">Fewer Children → More Pressure</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      As birth rates decline, fewer future workers must support more retirees, creating economic pressures on families that make parenting even more stressful.<sup>13</sup>
                    </p>
                  </div>
                </div>
                
                <div className="flex mb-4">
                  <div className="mr-3 flex-shrink-0 mt-1 text-purple-700">
                    <Heart size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium">Parenting Anxiety Amplification</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      With fewer children, parents feel increased pressure to "get it right" with each child, creating perfectionistic parenting that further increases mental load.<sup>14</sup>
                    </p>
                  </div>
                </div>
                
                <div className="bg-purple-50 p-3 rounded border border-purple-200 mt-4">
                  <h4 className="font-medium text-purple-800 text-sm">The Accelerating Cycle:</h4>
                  <p className="mt-1 text-xs text-purple-700">
                    68% of parents report feeling like they must "optimize" every aspect of their fewer children's lives, creating unprecedented planning and monitoring burden.<sup>15</sup> This leads to greater parental stress, further discouraging additional children.
                  </p>
                </div>
              </div>
            )}
            
            <button 
              onClick={() => toggleSection('solution')}
              className={`w-full text-left mb-4 p-5 rounded-lg transition-colors ${
                activeSection === 'solution' 
                  ? 'bg-green-50 border-2 border-green-200' 
                  : 'bg-white border border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-medium">Breaking the Cycle with Allie</h3>
                {activeSection === 'solution' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </button>
            
            {activeSection === 'solution' && (
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <div className="space-y-4">
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1 text-green-500">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Liberating Parents from Admin Work</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        By automating and managing 78% of family administrative tasks, Allie reduces the cognitive burden that deters young adults from having children.<sup>16</sup>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1 text-green-500">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Making Parenting More Enjoyable</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        By eliminating tedious planning work, Allie helps parents focus on meaningful interactions. 84% of beta users report more enjoyable time with children.<sup>17</sup>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1 text-green-500">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">Realistic Workload Balancing</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Allie's AI provides practical support that creates more balanced households, addressing a key concern for prospective parents.<sup>18</sup>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-3 flex-shrink-0 mt-1 text-green-500">
                      <Check size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium">From Vicious to Virtuous Cycle</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Countries with balanced workload programs show a 16% increase in second-child births, suggesting technology solutions could help reverse demographic decline.<sup>19</sup>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="bg-amber-50 p-5 rounded-lg border border-amber-200 mt-6">
              <div className="flex items-start">
                <AlertTriangle className="text-amber-700 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-amber-800">This Economic Squeeze is Already Here</h4>
                  <p className="mt-2 text-sm text-amber-700">
                    Families face unprecedented pressure with fewer resources and support systems than previous generations. The mental load of parenting has increased 43% in the past decade, as documented pressure on each family unit grows.<sup>20</sup>
                  </p>
                  <p className="mt-2 text-sm text-amber-700">
                    <strong>In countries with better family support and workload balance, both birth rates and female workforce participation are higher, creating a virtuous economic cycle.</strong><sup>21</sup>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-black text-white rounded-lg">
          <h3 className="text-base font-medium mb-2">Market Implication:</h3>
          <p className="text-sm">
            The demographic crisis creates both societal need and market opportunity for solutions like Allie that address parental mental load. By reducing the cognitive burden of parenting, we can make family life more attractive to young adults, improve quality of life for existing parents, and potentially help address a critical global challenge. The economic value of increasing birth rates through reduced parental anxiety represents a multi-trillion dollar opportunity.
          </p>
        </div>
        
        {/* Footnotes */}
        <div className="text-xs text-gray-500 mt-4">
          <div className="grid grid-cols-2 gap-2">
            <div><sup>1</sup> World Bank Fertility Data, 2023</div>
            <div><sup>2</sup> Eurostat Population & Demographic Report, 2023</div>
            <div><sup>3</sup> US Census Bureau, 2023</div>
            <div><sup>4</sup> UN Population Division, "World Population Prospects", 2022</div>
            <div><sup>5</sup> Pew Research, "The Sandwich Generation", 2024</div>
            <div><sup>6</sup> OECD Housing Market Analytics, 2023</div>
            <div><sup>7</sup> IMF Global Economic Outlook, 2023</div>
            <div><sup>8</sup> US Social Security Trustees Report, 2024</div>
            <div><sup>9</sup> Guttmacher Institute, "Fertility Intentions Survey", 2023</div>
            <div><sup>10</sup> McKinsey & Company, "Women in the Workplace", 2023</div>
            <div><sup>11</sup> Nordic Council of Ministers Demographic Report, 2022</div>
            <div><sup>12</sup> EU Working Paper on Family Policy & Birth Rates, 2023</div>
            <div><sup>13</sup> BIS Working Papers, "Demographic Pressure and Economic Growth", 2022</div>
            <div><sup>14</sup> Journal of Family Psychology, "Intensive Parenting Trends", 2023</div>
            <div><sup>15</sup> Parenthood in America Survey, Pew Research, 2024</div>
            <div><sup>16</sup> Allie Initial User Study, 2024 (n=240)</div>
            <div><sup>17</sup> Allie Beta Program Satisfaction Survey, 2024</div>
            <div><sup>18</sup> NYU Family & Child Study, "Technology & Parental Balance", 2023</div>
            <div><sup>19</sup> OECD Family Database, 2023</div>
            <div><sup>20</sup> Harvard Center on the Developing Child, "Parental Stress Metrics", 2023</div>
            <div><sup>21</sup> World Economic Forum, "The Family Support Economy", 2024</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemographicCrisisSlide;