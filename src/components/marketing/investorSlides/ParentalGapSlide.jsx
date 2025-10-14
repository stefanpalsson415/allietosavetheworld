import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { HelpCircle, AlertTriangle, ExternalLink } from 'lucide-react';

const ParentalGapSlide = () => {
  const [activeTab, setActiveTab] = useState('visible');
  const [selectedRegion, setSelectedRegion] = useState('usa');

  // Chart data for visible and invisible load
  const visibleLoadData = [
    { name: 'Mothers', value: 60, color: '#F472B6' }, // Pink
    { name: 'Fathers', value: 40, color: '#3B82F6' }  // Blue
  ];

  const invisibleLoadData = [
    { name: 'Mothers', value: 71, color: '#F472B6' }, // Pink
    { name: 'Fathers', value: 29, color: '#3B82F6' }  // Blue
  ];

  const euVisibleLoadData = [
    { name: 'Mothers', value: 58, color: '#F472B6' }, // Pink
    { name: 'Fathers', value: 42, color: '#3B82F6' }  // Blue
  ];

  const euInvisibleLoadData = [
    { name: 'Mothers', value: 68, color: '#F472B6' }, // Pink
    { name: 'Fathers', value: 32, color: '#3B82F6' }  // Blue
  ];

  // Data for comparison chart showing the gap is larger for invisible load
  const gapComparisonData = [
    {
      name: 'United States',
      visible: 20, // 60% mothers vs 40% fathers = 20% gap
      invisible: 42, // 71% mothers vs 29% fathers = 42% gap
    },
    {
      name: 'European Union',
      visible: 16, // 58% mothers vs 42% fathers = 16% gap
      invisible: 36, // 68% mothers vs 32% fathers = 36% gap
    },
  ];

  // Country variation data
  const countryVariationData = [
    { name: 'Sweden', invisibleGap: 20 }, // 60/40 split = 20% gap
    { name: 'France', invisibleGap: 28 }, // 64/36 split = 28% gap
    { name: 'Germany', invisibleGap: 44 }, // 72/28 split = 44% gap
    { name: 'Greece', invisibleGap: 50 }, // 75/25 split = 50% gap
  ];

  // Click handler for chart sections to provide more information
  const handlePieClick = (data, index) => {
    console.log(`Clicked on ${data.name}: ${data.value}%`);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">How Big is the Parental Gap?</h2>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left column with charts */}
          <div>
            <div className="flex mb-4 space-x-4">
              <button
                onClick={() => setActiveTab('visible')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'visible' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Visible Load
              </button>
              <button
                onClick={() => setActiveTab('invisible')}
                className={`px-4 py-2 rounded-lg ${
                  activeTab === 'invisible' 
                    ? 'bg-black text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Invisible Load
              </button>
            </div>
            
            <div className="flex justify-center mb-4 space-x-4">
              <button
                onClick={() => setSelectedRegion('usa')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  selectedRegion === 'usa' 
                    ? 'bg-indigo-100 text-indigo-800 font-medium' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                United States
              </button>
              <button
                onClick={() => setSelectedRegion('eu')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  selectedRegion === 'eu' 
                    ? 'bg-indigo-100 text-indigo-800 font-medium' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                European Union
              </button>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-2">
                {activeTab === 'visible' ? 'Physical Housework & Childcare' : 'Mental Planning & Organizing'}
              </h3>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={selectedRegion === 'usa' ? 
                        (activeTab === 'visible' ? visibleLoadData : invisibleLoadData) :
                        (activeTab === 'visible' ? euVisibleLoadData : euInvisibleLoadData)
                      }
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      onClick={handlePieClick}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = 25 + innerRadius + (outerRadius - innerRadius);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text 
                            x={x} 
                            y={y} 
                            textAnchor={x > cx ? 'start' : 'end'} 
                            dominantBaseline="central"
                            className="font-medium"
                          >
                            {name}: {value}%
                          </text>
                        );
                      }}
                    >
                      {(selectedRegion === 'usa' ? 
                        (activeTab === 'visible' ? visibleLoadData : invisibleLoadData) :
                        (activeTab === 'visible' ? euVisibleLoadData : euInvisibleLoadData)
                      ).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-2 text-sm text-gray-500 text-center">
                Source: {selectedRegion === 'usa' ? 
                  (activeTab === 'visible' ? 'American Time-Use Survey 2023' : 'University of Bath / U Melbourne survey 2024') :
                  (activeTab === 'visible' ? 'EIGE Gender-Equality Index 2023' : 'Haupt & Gelbgiser 2023')
                }
              </div>
            </div>
          </div>
          
          {/* Right column with explanations */}
          <div>
            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-medium mb-3">
                {activeTab === 'visible' ? 'Visible Load Breakdown' : 'Invisible Load Breakdown'}
              </h3>
              
              {activeTab === 'visible' && selectedRegion === 'usa' && (
                <div>
                  <p className="mb-3">
                    Mothers in two-parent homes spend <strong>2h 40m more per day</strong> on unpaid care & housework than fathers (4h 31m vs 1h 51m).
                  </p>
                  <p className="text-sm text-gray-600">
                    This includes physical childcare, cooking, cleaning, and household maintenance tasks.
                  </p>
                </div>
              )}
              
              {activeTab === 'invisible' && selectedRegion === 'usa' && (
                <div>
                  <p className="mb-3">
                    Mothers handle <strong>71%</strong> of all "mental-load" tasks; fathers <strong>29%</strong>.
                  </p>
                  <p className="text-sm text-gray-600">
                    This includes planning, scheduling, remembering, researching, and making decisions about family needs.
                  </p>
                </div>
              )}
              
              {activeTab === 'visible' && selectedRegion === 'eu' && (
                <div>
                  <p className="mb-3">
                    <strong>91%</strong> of mothers and <strong>30%</strong> of fathers do ≥ 1h of housework daily. Employed mothers average <strong>2h 18m/day</strong> vs fathers <strong>1h 36m</strong>.
                  </p>
                  <p className="text-sm text-gray-600">
                    This data comes from time-use studies across 27 EU nations.
                  </p>
                </div>
              )}
              
              {activeTab === 'invisible' && selectedRegion === 'eu' && (
                <div>
                  <p className="mb-3">
                    Across 10 EU nations mothers report <strong>64–75%</strong> of cognitive labour, fathers <strong>25–36%</strong>; mean gap ≈ <strong>68/32</strong>.
                  </p>
                  <p className="text-sm text-gray-600">
                    Based on a multi-country online panel (N ≈ 6,400 parents).
                  </p>
                </div>
              )}
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start">
                <AlertTriangle className="text-amber-600 mt-1 mr-3 flex-shrink-0" size={20} />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">Key Insight</h4>
                  <p className="text-sm text-amber-700">
                    The imbalance is <strong>larger for the invisible load</strong> than for the physical one in both regions.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-700">
                    <li>• U.S. visible share ≈ 60/40, but invisible share 71/29</li>
                    <li>• EU visible share ≈ 58/42, invisible ≈ 68/32</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom section with additional insights */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium mb-3">Gap Comparison: Visible vs. Invisible</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={gapComparisonData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Gap Size (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="visible" name="Visible Load Gap" fill="#94A3B8" />
                  <Bar dataKey="invisible" name="Invisible Load Gap" fill="#8884D8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              The invisible load (planning, scheduling, remembering) shows a significantly wider gap between parents.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-3">The Perception Problem</h3>
              <p className="text-sm">
                Visibility hides the bigger problem. Because planning and monitoring are done "in the head," fathers often believe work is evenly split even when mothers do two-thirds of the cognitive tasks — a bias documented in both the Bath survey and the EU study.
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-medium mb-3">Country Variation</h3>
              <div className="flex flex-col space-y-2">
                {countryVariationData.map(country => (
                  <div key={country.name} className="flex items-center">
                    <span className="w-20 text-sm">{country.name}</span>
                    <div className="flex-grow h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-purple-500" 
                        style={{ width: `${country.invisibleGap}%` }}
                      ></div>
                    </div>
                    <span className="ml-2 text-sm">{country.invisibleGap}%</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Nordic countries show the smallest gaps; Southern and Central European countries the largest, mirroring childcare policy generosity.
              </p>
            </div>
            
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-base font-medium mb-2 text-indigo-800">Why this matters for Allie</h3>
              <p className="text-sm text-indigo-700">
                The public numbers above are the "problem size" you can cite when explaining why a proactive AI concierge is needed—and why solving invisible tasks (calendars, wardrobe audits, permission-slip reminders) delivers the biggest equity gain.
              </p>
            </div>
          </div>
        </div>
        
        {/* Additional key statistics */}
        <div className="mt-8 bg-black text-white rounded-lg overflow-hidden">
          <div className="p-5 border-b border-gray-700">
            <h3 className="text-base font-medium mb-3">Critical Parenting Statistics</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-red-900 bg-opacity-40 p-4 rounded">
                <div className="flex items-start">
                  <div className="font-bold text-xl mr-3">9 in 10</div>
                  <div>
                    <p className="text-sm">U.S. moms say they manage children's schedules; just 1 in 10 dads say the same.<sup>1</sup></p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-900 bg-opacity-40 p-4 rounded">
                <div className="flex items-start">
                  <div className="font-bold text-xl mr-3">2 hours</div>
                  <div>
                    <p className="text-sm">more weekly leisure time enjoyed by employed U.S. husbands than working wives—even with kids.<sup>2</sup></p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 bg-gradient-to-r from-red-900 to-red-800 p-4 rounded">
              <div className="flex items-start">
                <div className="font-bold text-2xl mr-3">"</div>
                <div>
                  <p className="text-sm italic">Parental stress is an urgent public-health issue on par with past warnings about smoking."<sup>3</sup></p>
                  <p className="text-xs mt-1">— Surgeon General Murthy</p>
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-gray-400 grid grid-cols-3 gap-2">
              <p><sup>1</sup> Pew Research <i>Gender & Parenting</i> 2023</p>
              <p><sup>2</sup> Pew time-use analysis 2023</p>
              <p><sup>3</sup> Interview recap, <i>People</i> magazine Aug 2024</p>
            </div>
          </div>
          
          {/* How researchers measure invisible load */}
          <div className="p-5">
            <h3 className="text-base font-medium mb-3">How researchers measure "invisible" load</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-800 p-3 rounded">
                <p>Task batteries (e.g., 21-item checklist such as "remember school forms" or "track kids' sizes"). Respondents mark who is "mainly responsible".</p>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <p>Time-triggered diaries prompting for "thinking about and organizing family life".</p>
              </div>
              <div className="bg-gray-800 p-3 rounded">
                <p>Experience-sampling apps (rare, still experimental).</p>
              </div>
            </div>
            <p className="text-sm mt-3 text-gray-400">
              All major studies in the last three years point to the same range—roughly two-thirds of the cognitive/mental work of parenting still falls on women on both sides of the Atlantic.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentalGapSlide;