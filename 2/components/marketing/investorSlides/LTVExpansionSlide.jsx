import React from 'react';
import { Calendar, Users, Heart } from 'lucide-react';

const LTVExpansionSlide = () => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-2">Onion Flywheel & Data-Driven LTV</h2>
        <h3 className="text-xl font-light text-gray-600 mb-8">Building concentric layers of trust with families over time</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            {/* Four Trust Layers (Concentric Circles) */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-medium mb-4">Four Trust Layers</h3>
              
              <div className="space-y-4">
                <div className="p-4 border-l-4 border-purple-600 bg-purple-50 rounded-r-lg">
                  <div className="flex items-center mb-1">
                    <span className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">1</span>
                    <h4 className="font-medium text-lg">Load-Balance Coach</h4>
                  </div>
                  <p className="text-sm ml-11">80-Q assessment, weekly habits, fairness analytics</p>
                  <div className="mt-2 ml-11 flex justify-between text-sm">
                    <span className="font-medium">Revenue:</span>
                    <span>$30-50/mo subscription</span>
                  </div>
                </div>
                
                <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                  <div className="flex items-center mb-1">
                    <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">2</span>
                    <h4 className="font-medium text-lg">Family Command Center</h4>
                  </div>
                  <p className="text-sm ml-11">Calendar, docs, health vault, interest tracker</p>
                  <div className="mt-2 ml-11 flex justify-between text-sm">
                    <span className="font-medium">Revenue:</span>
                    <span>Retains sub, ↑ stickiness</span>
                  </div>
                </div>
                
                <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                  <div className="flex items-center mb-1">
                    <span className="bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">3</span>
                    <h4 className="font-medium text-lg">Proactive Concierge</h4>
                  </div>
                  <p className="text-sm ml-11">Allie books sitters, refills Rx, schedules date night</p>
                  <div className="mt-2 ml-11 flex justify-between text-sm">
                    <span className="font-medium">Revenue:</span>
                    <span>Partner fees</span>
                  </div>
                </div>
                
                <div className="p-4 border-l-4 border-amber-500 bg-amber-50 rounded-r-lg">
                  <div className="flex items-center mb-1">
                    <span className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center mr-3">4</span>
                    <h4 className="font-medium text-lg">Personalized Commerce</h4>
                  </div>
                  <p className="text-sm ml-11">One-tap buy of age-/size-specific gear, services</p>
                  <div className="mt-2 ml-11 flex justify-between text-sm">
                    <span className="font-medium">Revenue:</span>
                    <span>Affiliate + marketplace margin</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600 italic">
                Flywheel effect: each extra service multiplies total usage (3 services → 7× engagement)
              </div>
            </div>
            
            {/* Lifetime Value Model */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-medium mb-3">Lifetime Value Model</h3>
              <h4 className="text-sm text-gray-600 mb-4">Per family, single child (0-18 years)</h4>
              
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium">Age Band</div>
                  <div className="font-medium">Annual Sub</div>
                  <div className="font-medium">Allie Take</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <div>0-4</div>
                  <div>$480</div>
                  <div>$200</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <div>5-12</div>
                  <div>$480</div>
                  <div>$300</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <div>13-18</div>
                  <div>$480</div>
                  <div>$500</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm font-medium">
                  <div>18-yr subtotal</div>
                  <div>$8.6k</div>
                  <div>$3.5-6k</div>
                </div>
              </div>
              
              <div className="mt-4 bg-purple-100 p-3 rounded-lg">
                <div className="text-lg font-bold text-purple-800">Projected LTV: $15-20k minimum</div>
                <div className="text-sm">Up to $30k with multi-child uplift</div>
              </div>
            </div>
          </div>
          
          <div>
            {/* The 360° Family Data Graph */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-medium mb-4">The 360° Family Data Graph</h3>
              <h4 className="text-sm text-gray-600 mb-4">Monetization Triggers</h4>
              
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-sm font-medium">
                  <div>Dataset</div>
                  <div>Example Trigger</div>
                  <div>Rev Model</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <div>Age, height, weight</div>
                  <div>Growth percentile jump at 11</div>
                  <div>15% margin</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <div>Health records</div>
                  <div>Flu vax due in Oct</div>
                  <div>Lead fee</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <div>Calendar events</div>
                  <div>"U12 soccer try-outs"</div>
                  <div>12% affiliate</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <div>Interest survey</div>
                  <div>"Minecraft + Coding" top-rank</div>
                  <div>20%</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <div>Habit outcomes</div>
                  <div>"Weekly date night" streak</div>
                  <div>Dual commission</div>
                </div>
              </div>
              
              <div className="mt-4 bg-blue-50 p-3 rounded-lg text-sm">
                <span className="font-medium">Edge:</span> Because Allie hosts private family data, Amazon/Meta cannot replicate the relevance without breaching trust.
              </div>
            </div>
            
            {/* Monetization Examples */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-medium mb-4">Monetization Examples</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-purple-100 p-2 rounded-full mr-3 mt-1">
                    <Calendar size={16} className="text-purple-700" />
                  </div>
                  <div>
                    <div className="font-medium">School Calendar Integration</div>
                    <p className="text-sm">Allie detects "back-to-school" events, offers curated supply packages with affiliate commission</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-100 p-2 rounded-full mr-3 mt-1">
                    <Users size={16} className="text-purple-700" />
                  </div>
                  <div>
                    <div className="font-medium">Growth Milestone Detection</div>
                    <p className="text-sm">Tracking child's growth enables perfectly-timed clothing and equipment recommendations</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-100 p-2 rounded-full mr-3 mt-1">
                    <Heart size={16} className="text-purple-700" />
                  </div>
                  <div>
                    <div className="font-medium">Relationship Support</div>
                    <p className="text-sm">Date night streak triggers partner discounts with restaurants and entertainment</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">LTV Growth Strategy</h4>
                <p className="text-sm">
                  By building trust in layers, each family becomes increasingly valuable over time. We estimate capturing 5-10% of a family's $300k average per-child spend, yielding LTVs of $15k-30k over the child's first 18 years.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LTVExpansionSlide;