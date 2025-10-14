import React from 'react';
import { Clock, Shield, Zap, Info } from 'lucide-react';

const MacroTailwindsSlide = () => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-16">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-6">Macro Tailwinds & Timing ("Why Now")</h2>

        <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
          <h3 className="text-2xl font-medium mb-6 text-center">The Market is Opening <span className="text-blue-600">Today</span></h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Tech Enabler */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border-t-4 border-blue-500">
              <div className="flex items-center mb-4">
                <div className="h-14 w-14 bg-blue-200 rounded-full flex items-center justify-center mr-4">
                  <Zap size={32} className="text-blue-700" />
                </div>
                <h4 className="text-xl font-bold text-blue-800">Tech Enabler</h4>
              </div>

              <div className="mb-4">
                <div className="text-4xl font-bold mb-2">75%<sup className="text-xs ml-1 text-blue-600">1</sup></div>
                <p className="text-lg font-medium text-blue-800">LLM cost reduction since 2022</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-5 w-5 text-blue-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p className="text-blue-800">AI quality threshold crossed for real understanding of family dynamics<sup className="text-xs ml-1 text-blue-600">2</sup></p>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-blue-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p className="text-blue-800">Mobile-first tools with low friction finally viable</p>
                </li>
              </ul>
            </div>

            {/* Policy/Demographic Catalyst */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border-t-4 border-purple-500">
              <div className="flex items-center mb-4">
                <div className="h-14 w-14 bg-purple-200 rounded-full flex items-center justify-center mr-4">
                  <Shield size={32} className="text-purple-700" />
                </div>
                <h4 className="text-xl font-bold text-purple-800">Policy Catalyst</h4>
              </div>

              <div className="mb-4">
                <div className="text-4xl font-bold mb-2">2023<sup className="text-xs ml-1 text-purple-600">3</sup></div>
                <p className="text-lg font-medium text-purple-800">Surge in institutional support</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-5 w-5 text-purple-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p className="text-purple-800">EU childcare crisis response with €23B in funding<sup className="text-xs ml-1 text-purple-600">4</sup></p>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-purple-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p className="text-purple-800">US Surgeon General advisory on mental health burden on families<sup className="text-xs ml-1 text-purple-600">5</sup></p>
                </li>
              </ul>
            </div>

            {/* Behavior Shift */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-lg border-t-4 border-amber-500">
              <div className="flex items-center mb-4">
                <div className="h-14 w-14 bg-amber-200 rounded-full flex items-center justify-center mr-4">
                  <Clock size={32} className="text-amber-700" />
                </div>
                <h4 className="text-xl font-bold text-amber-800">Behavior Shift</h4>
              </div>

              <div className="mb-4">
                <div className="text-4xl font-bold mb-2">42%<sup className="text-xs ml-1 text-amber-600">6</sup></div>
                <p className="text-lg font-medium text-amber-800">Awareness growth in 24 months</p>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="h-5 w-5 text-amber-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p className="text-amber-800">67% of parents now open to AI for family management tasks<sup className="text-xs ml-1 text-amber-600">7</sup></p>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-amber-600 flex items-center justify-center mr-2 flex-shrink-0">•</div>
                  <p className="text-amber-800">4.3× increase in Google searches for "family mental load" since 2021<sup className="text-xs ml-1 text-amber-600">8</sup></p>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Data trends visualization */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1 bg-white p-6 rounded-lg shadow-sm">
            <h4 className="text-lg font-medium mb-4">AI Cost/Performance Curve<sup className="text-xs ml-1 text-blue-600">9</sup></h4>

            <div className="h-64 relative">
              {/* Chart title and description */}
              <div className="absolute -top-6 right-0 text-xs text-gray-500 max-w-[200px] text-right">
                <span className="text-red-500 font-medium">AI Utility Threshold:</span> Cost level where AI becomes viable for complex family assistance
              </div>

              {/* Simplified chart showing declining cost curve */}
              <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
              <div className="absolute left-0 bottom-0 h-full w-px bg-gray-300"></div>

              {/* Y-axis tick marks and values */}
              <div className="absolute left-[-5px] bottom-[0%] w-2 h-px bg-gray-400"></div>
              <div className="absolute left-[-5px] bottom-[20%] w-2 h-px bg-gray-400"></div>
              <div className="absolute left-[-5px] bottom-[40%] w-2 h-px bg-gray-400"></div>
              <div className="absolute left-[-5px] bottom-[60%] w-2 h-px bg-gray-400"></div>
              <div className="absolute left-[-5px] bottom-[80%] w-2 h-px bg-gray-400"></div>
              <div className="absolute left-[-5px] bottom-[100%] w-2 h-px bg-gray-400"></div>

              {/* Y-axis labels */}
              <div className="absolute left-[-35px] bottom-[0%] transform translate-y-[-50%] text-xs">$0.000</div>
              <div className="absolute left-[-35px] bottom-[20%] transform translate-y-[-50%] text-xs">$0.002</div>
              <div className="absolute left-[-35px] bottom-[40%] transform translate-y-[-50%] text-xs">$0.004</div>
              <div className="absolute left-[-35px] bottom-[60%] transform translate-y-[-50%] text-xs">$0.006</div>
              <div className="absolute left-[-35px] bottom-[80%] transform translate-y-[-50%] text-xs">$0.008</div>

              {/* Data points for visualization */}
              <div className="absolute bottom-0 left-[5%] h-[80%] w-2 bg-blue-500 rounded-t">
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-blue-100 px-1 py-0.5 rounded">$0.008</div>
              </div>
              <div className="absolute bottom-0 left-[15%] h-[60%] w-2 bg-blue-500 rounded-t"></div>
              <div className="absolute bottom-0 left-[25%] h-[45%] w-2 bg-blue-500 rounded-t">
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-blue-100 px-1 py-0.5 rounded">$0.0045</div>
              </div>
              <div className="absolute bottom-0 left-[35%] h-[30%] w-2 bg-blue-500 rounded-t"></div>
              <div className="absolute bottom-0 left-[45%] h-[20%] w-2 bg-blue-500 rounded-t">
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-blue-100 px-1 py-0.5 rounded">$0.002</div>
              </div>
              <div className="absolute bottom-0 left-[55%] h-[15%] w-2 bg-blue-500 rounded-t"></div>
              <div className="absolute bottom-0 left-[65%] h-[10%] w-2 bg-blue-500 rounded-t opacity-60"></div>
              <div className="absolute bottom-0 left-[75%] h-[7%] w-2 bg-blue-500 rounded-t opacity-50"></div>
              <div className="absolute bottom-0 left-[85%] h-[5%] w-2 bg-blue-500 rounded-t opacity-40">
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-blue-100 px-1 py-0.5 rounded">$0.0005</div>
              </div>
              <div className="absolute bottom-0 left-[95%] h-[3%] w-2 bg-blue-500 rounded-t opacity-30"></div>

              {/* Trendline - Fixed to go down (not up) */}
              <div className="absolute bottom-[80%] left-[5%] w-[90%] h-1 bg-red-500 transform rotate-[30deg] origin-bottom-left"></div>

              {/* Dotted line for AI Utility Threshold */}
              <div className="absolute bottom-[25%] left-0 w-full border-b border-dashed border-red-500"></div>
              <div className="absolute bottom-[25%] left-[30%] bg-white px-1 py-0.5 text-xs text-red-500 rounded transform translate-y-[-50%]">Utility Threshold: $0.0025/token</div>

              {/* Labels */}
              <div className="absolute bottom-[-20px] left-[5%] text-xs">2021</div>
              <div className="absolute bottom-[-20px] left-[25%] text-xs">2023</div>
              <div className="absolute bottom-[-20px] left-[45%] text-xs">2025</div>
              <div className="absolute bottom-[-20px] left-[65%] text-xs">2027</div>
              <div className="absolute bottom-[-20px] left-[85%] text-xs">2029</div>

              <div className="absolute top-0 left-[-40px] text-xs font-medium">Cost per token</div>

              {/* Label for forecasted data */}
              <div className="absolute top-[5%] right-0 text-xs italic bg-gray-100 px-2 py-1 rounded">
                <span className="font-medium">Forecast</span> →
              </div>
              <div className="absolute bottom-[45%] left-[35%] h-[20%] w-px border-l border-dashed border-gray-400"></div>
              <div className="absolute bottom-[40%] left-[39%] transform rotate-[-15deg] text-[10px] text-gray-500 bg-white px-1">Current (2025)</div>
            </div>
          </div>

          <div className="flex-1 bg-white p-6 rounded-lg shadow-sm">
            <h4 className="text-lg font-medium mb-4">User Behavior Readiness</h4>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">AI Trust for Family Tasks<sup className="text-xs ml-1 text-blue-600">10</sup></span>
                  <span className="text-sm font-medium">67%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{width: '67%'}}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Mental Load Recognition<sup className="text-xs ml-1 text-blue-600">11</sup></span>
                  <span className="text-sm font-medium">42%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{width: '42%'}}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Willingness to Pay for Solutions<sup className="text-xs ml-1 text-blue-600">12</sup></span>
                  <span className="text-sm font-medium">53%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{width: '53%'}}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Institutional Support Growth<sup className="text-xs ml-1 text-blue-600">13</sup></span>
                  <span className="text-sm font-medium">76%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{width: '76%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center py-4">
          <p className="text-xl font-medium text-blue-800">The market is opening <span className="font-bold">today</span> — not five years ago or five years ahead</p>
        </div>

        {/* Footnotes */}
        <div className="text-xs text-gray-600 mt-3 space-y-1">
          <p><sup>1</sup> Anthropic, 2024. "Claude API Pricing History 2022-2024"</p>
          <p><sup>2</sup> Stanford HAI, 2023. "Large Language Model Capabilities Report"</p>
          <p><sup>3</sup> European Commission Press Release, 2023</p>
          <p><sup>4</sup> European Commission, "European Care Strategy Funding Allocation 2023-2025"</p>
          <p><sup>5</sup> U.S. Surgeon General Advisory, 2023. "Our Epidemic of Loneliness and Isolation"</p>
          <p><sup>6</sup> Pew Research Center, 2024. "Family Dynamics and Digital Technology"</p>
          <p><sup>7</sup> Morning Consult Survey, 2024. "AI Adoption Trends Among Parents"</p>
          <p><sup>8</sup> Google Trends Analysis, 2021-2024</p>
          <p><sup>9</sup> Aggregated data from OpenAI, Anthropic, and Google DeepMind price trends (2021-2024) with projections through 2029. The "AI Utility Threshold" represents the cost per token where AI becomes economically viable for complex family assistance tasks that require sophisticated reasoning.</p>
          <p><sup>10</sup> Morning Consult Survey, 2024. "AI Adoption Trends Among Parents"</p>
          <p><sup>11</sup> Pew Research Center, 2024. "Family Dynamics and Digital Technology"</p>
          <p><sup>12</sup> McKinsey Research, 2023. "AI-Enabled Consumer Services" </p>
          <p><sup>13</sup> Combined growth in funding & policy support for family services across US, EU, UK, 2022-2024</p>
        </div>
      </div>
    </div>
  );
};

export default MacroTailwindsSlide;