import React from 'react';
import { Calendar, Users, Heart } from 'lucide-react';

const LTVExpansionSlide = () => {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-0">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-2">Onion Flywheel & Data-Driven LTV</h2>
        <h3 className="text-xl font-light text-gray-600 mb-8">Building concentric layers of trust with families over time</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            {/* Four Trust Layers (Concentric Circles) */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="mb-4">
                <h3 className="text-xl font-medium mb-1 text-center">Four Trust Layers: The Onion Flywheel</h3>
                <p className="text-gray-600 text-sm mb-4 text-center">Building concentric layers of trust with families over time</p>
                
                {/* New cleaner layout with a completely redesigned onion */}
                <div className="relative mx-auto" style={{width: '500px', height: '500px'}}>
                  {/* OUTER LAYER (4) - Personalized Commerce */}
                  <div className="absolute inset-0 rounded-full bg-amber-50 border-4 border-amber-300">
                    {/* Number badge */}
                    <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold shadow-md z-10">
                      4
                    </div>
                    
                    {/* Top text */}
                    <div className="absolute top-24 left-0 w-full">
                      <h4 className="text-amber-800 text-xl font-bold text-center">Personalized Commerce</h4>
                    </div>
                    
                    {/* Bottom text - split to avoid overlap with inner circles */}
                    <div className="absolute bottom-24 left-0 w-full">
                      <p className="text-amber-700 font-medium text-center">One-tap buy of age-specific gear</p>
                    </div>
                    
                    <div className="absolute bottom-10 left-0 w-full">
                      <p className="text-amber-800 font-medium text-center">Affiliate + marketplace margin</p>
                    </div>
                  </div>
                  
                  {/* MIDDLE-OUTER LAYER (3) - Proactive Concierge */}
                  <div className="absolute rounded-full bg-green-50 border-4 border-green-300"
                       style={{top: '20%', left: '20%', right: '20%', bottom: '20%'}}>
                    {/* Number badge */}
                    <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-green-500 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-md z-10">
                      3
                    </div>
                    
                    {/* Top text */}
                    <div className="absolute top-20 left-0 w-full">
                      <h4 className="text-green-800 text-xl font-bold text-center">Proactive Concierge</h4>
                    </div>
                    
                    {/* Bottom text - no overlap because we carefully position */}
                    <div className="absolute bottom-28 left-0 w-full px-6">
                      <p className="text-green-700 font-medium text-center">Allie books sitters, schedules date night</p>
                    </div>
                    
                    <div className="absolute bottom-12 left-0 w-full">
                      <p className="text-green-800 font-medium text-center">Partner fees</p>
                    </div>
                  </div>
                  
                  {/* MIDDLE-INNER LAYER (2) - Family Command Center */}
                  <div className="absolute rounded-full bg-blue-50 border-4 border-blue-300"
                       style={{top: '40%', left: '40%', right: '40%', bottom: '40%'}}>
                    {/* Number badge */}
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shadow-md z-10">
                      2
                    </div>
                    
                    {/* Centered content - properly spaced */}
                    <div className="flex flex-col items-center justify-center h-full text-center px-2">
                      <h4 className="text-blue-800 text-base font-bold mb-1">Family<br/>Command<br/>Center</h4>
                      <p className="text-blue-700 text-xs">Calendar, docs,<br/>health vault</p>
                      <p className="text-blue-800 text-xs font-medium mt-1">Retains sub,<br/>↑ stickiness</p>
                    </div>
                  </div>
                  
                  {/* INNER LAYER (1) - Load-Balance Coach */}
                  <div className="absolute rounded-full bg-purple-50 border-4 border-purple-300"
                       style={{top: '62%', left: '62%', right: '62%', bottom: '62%'}}>
                    {/* Number badge - now side positioned to avoid overlap with center */}
                    <div className="absolute top-2 left-0 transform -translate-x-1/3 bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-md z-10">
                      1
                    </div>
                    
                    {/* Centered content - very minimal for this small space */}
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <h4 className="text-purple-800 text-xs font-bold">Coach</h4>
                      <p className="text-purple-700 text-xs">$30-50/mo</p>
                    </div>
                  </div>
                  
                  {/* CORE - Allie */}
                  <div className="absolute rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg"
                       style={{top: '75%', left: '75%', right: '75%', bottom: '75%'}}>
                    <span className="font-bold text-xs">Allie</span>
                  </div>
                </div>
                
                {/* Legend and explanation - more detailed for clarity */}
                <div className="mt-6 grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="w-8 h-8 bg-purple-600 rounded-full mx-auto flex items-center justify-center text-white font-bold mb-2">1</div>
                    <p className="text-sm font-medium">Core Product</p>
                    <p className="text-xs text-gray-600">$30-50/mo</p>
                  </div>
                  <div>
                    <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto flex items-center justify-center text-white font-bold mb-2">2</div>
                    <p className="text-sm font-medium">Command Center</p>
                    <p className="text-xs text-gray-600">Value-add</p>
                  </div>
                  <div>
                    <div className="w-8 h-8 bg-green-500 rounded-full mx-auto flex items-center justify-center text-white font-bold mb-2">3</div>
                    <p className="text-sm font-medium">Service Layer</p>
                    <p className="text-xs text-gray-600">Partner fees</p>
                  </div>
                  <div>
                    <div className="w-8 h-8 bg-amber-500 rounded-full mx-auto flex items-center justify-center text-white font-bold mb-2">4</div>
                    <p className="text-sm font-medium">Commerce Layer</p>
                    <p className="text-xs text-gray-600">High margins</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-indigo-50 p-4 rounded-lg shadow-sm">
                <div className="font-bold mb-2 text-indigo-800 text-lg">Flywheel Effect & Data Advantage:</div>
                <ul className="list-disc ml-5 space-y-2">
                  <li className="text-indigo-700">Each trust layer multiplies engagement (3 layers → 7× usage)</li>
                  <li className="text-indigo-700">Top 10 family expenditures become accessible as trust builds</li>
                  <li className="text-indigo-700">Data collected in inner layers enables personalization in outer layers</li>
                  <li className="text-indigo-700">Balanced families become loyal advocates, expanding LTV further</li>
                </ul>
              </div>
            </div>
            
            {/* Monetizing Family Trust & Data */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-medium mb-3">Monetizing Trust & Data</h3>
              <h4 className="text-sm text-gray-600 mb-2">Top 10 Family Expenditures We Can Capture</h4>
              
              <div className="mb-4 bg-gradient-to-br from-purple-50 to-indigo-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-indigo-900 mb-2">
                  Average US family spends $300k+ per child (0-18 years)
                </p>
                <p className="text-xs">
                  With first-party data from our inner trust layers, we can capture 5-10% of this spend
                  through highly relevant, perfectly timed recommendations.
                </p>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold bg-gray-100 p-2 rounded">
                  <div>Category</div>
                  <div>Annual Spend</div>
                  <div>Our Capture</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs p-1 border-b">
                  <div>Education</div>
                  <div>$4,800+</div>
                  <div className="text-green-600">7-10%</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs p-1 border-b">
                  <div>Childcare</div>
                  <div>$10,000+</div>
                  <div className="text-green-600">5-8%</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs p-1 border-b">
                  <div>Clothing & Gear</div>
                  <div>$2,400</div>
                  <div className="text-green-600">12-15%</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs p-1 border-b">
                  <div>Activities & Sports</div>
                  <div>$3,600</div>
                  <div className="text-green-600">8-12%</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs p-1 border-b">
                  <div>Family Travel</div>
                  <div>$4,500</div>
                  <div className="text-green-600">6-9%</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs p-1">
                  <div className="font-semibold">Total Opportunity</div>
                  <div className="font-semibold">$25,000+/yr</div>
                  <div className="font-semibold text-green-700">$1,500-2,500/yr</div>
                </div>
              </div>
              
              <div className="mt-3 bg-purple-100 p-3 rounded-lg">
                <div className="text-lg font-bold text-purple-800">Projected LTV: $15-30k per family</div>
                <div className="text-sm font-medium text-purple-700">As Allie builds trust, monetization expands to all family expenses</div>
              </div>
            </div>
          </div>
          
          <div>
            {/* The 360° Family Data Graph */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-xl font-medium mb-4">The 360° Family Data Advantage</h3>
              <div className="bg-blue-50 p-3 rounded-lg text-sm mb-4">
                <div className="font-bold text-blue-800 mb-1">Our Unfair Advantage:</div>
                <p className="text-blue-700 text-xs mb-2">
                  By helping families balance workload first, we gain legitimate access to 
                  sensitive first-party data across every aspect of family life.
                </p>
                <p className="text-blue-700 text-xs font-medium">
                  Amazon/Meta cannot replicate our relevance without breaching privacy trust.
                </p>
              </div>
              
              <h4 className="text-sm text-gray-600 mb-2 font-medium">High-Value Data Triggers</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-xs font-semibold bg-gray-100 p-2 rounded">
                  <div>Dataset</div>
                  <div>Example Trigger</div>
                  <div>Rev Model</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs p-1 border-b bg-gradient-to-r from-purple-50 to-transparent">
                  <div className="font-medium">Age, height, weight</div>
                  <div>Growth percentile jump at 11</div>
                  <div className="text-green-600">15% margin</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs p-1 border-b bg-gradient-to-r from-blue-50 to-transparent">
                  <div className="font-medium">Health records</div>
                  <div>Flu vax due in Oct</div>
                  <div className="text-green-600">Lead fee</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs p-1 border-b bg-gradient-to-r from-blue-50 to-transparent">
                  <div className="font-medium">Calendar events</div>
                  <div>"U12 soccer try-outs"</div>
                  <div className="text-green-600">12% affiliate</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs p-1 border-b bg-gradient-to-r from-green-50 to-transparent">
                  <div className="font-medium">Interest survey</div>
                  <div>"Minecraft + Coding" top-rank</div>
                  <div className="text-green-600">20% commission</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs p-1 border-b bg-gradient-to-r from-green-50 to-transparent">
                  <div className="font-medium">Habit outcomes</div>
                  <div>"Weekly date night" streak</div>
                  <div className="text-green-600">Dual commission</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs p-1 bg-gradient-to-r from-amber-50 to-transparent">
                  <div className="font-medium">Purchase patterns</div>
                  <div>Buys size 5T every autumn</div>
                  <div className="text-green-600">18% affiliate</div>
                </div>
              </div>
              
              <div className="mt-4 bg-indigo-100 p-3 rounded-lg text-sm">
                <div className="font-bold text-indigo-800 mb-1">Data Trust Flywheel:</div>
                <p className="text-xs">
                  The better we serve families with our data, the more data they share.
                  Each layer of trust unlocks new monetization opportunities.
                </p>
              </div>
            </div>
            
            {/* Top 10 Family Spending Categories */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-medium mb-3">Capturing Top Family Expenditures</h3>
              <p className="text-sm text-gray-600 mb-4">
                Our concentric trust model enables access to the highest-value family spending categories
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-start bg-gradient-to-r from-purple-50 to-white p-3 rounded">
                  <div className="bg-purple-100 p-2 rounded-full mr-2 flex-shrink-0">
                    <Calendar size={16} className="text-purple-700" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Educational Products</div>
                    <p className="text-xs">Calendar integration detects school activities, offering perfectly timed learning resources matching child's interests</p>
                    <p className="text-xs text-purple-700 font-medium mt-1">15-20% partner commission</p>
                  </div>
                </div>
                
                <div className="flex items-start bg-gradient-to-r from-blue-50 to-white p-3 rounded">
                  <div className="bg-blue-100 p-2 rounded-full mr-2 flex-shrink-0">
                    <Users size={16} className="text-blue-700" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Clothing & Equipment</div>
                    <p className="text-xs">Growth tracking enables perfectly-timed sizing recommendations with brand preferences</p>
                    <p className="text-xs text-blue-700 font-medium mt-1">18% affiliate + marketplace</p>
                  </div>
                </div>
                
                <div className="flex items-start bg-gradient-to-r from-green-50 to-white p-3 rounded">
                  <div className="bg-green-100 p-2 rounded-full mr-2 flex-shrink-0">
                    <Heart size={16} className="text-green-700" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Family Experiences</div>
                    <p className="text-xs">Coordinating family calendar enables travel, entertainment and dining recommendations</p>
                    <p className="text-xs text-green-700 font-medium mt-1">10-15% booking commission</p>
                  </div>
                </div>
                
                <div className="flex items-start bg-gradient-to-r from-amber-50 to-white p-3 rounded">
                  <div className="bg-amber-100 p-2 rounded-full mr-2 flex-shrink-0">
                    <Users size={16} className="text-amber-700" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Service Providers</div>
                    <p className="text-xs">Childcare, tutors, coaches, and health services matched to family preferences</p>
                    <p className="text-xs text-amber-700 font-medium mt-1">Lead gen + rebooking fees</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 bg-gradient-to-br from-indigo-600 to-purple-700 p-4 rounded-lg text-white">
                <h4 className="font-medium mb-2 text-lg">The Balanced Family Growth Flywheel</h4>
                <p className="text-sm">
                  <span className="font-medium">Key insight:</span> Helping families become more balanced creates trust, 
                  which unlocks private data, enabling monetization across all major family spending 
                  categories while driving deeper brand loyalty and multi-year retention.
                </p>
                <div className="mt-2 pt-2 border-t border-white/30 flex items-center justify-between text-lg">
                  <div className="text-center">
                    <div className="font-bold">$15-30K</div>
                    <div className="text-xs font-medium">Lifetime Value</div>
                  </div>
                  <div className="text-center text-yellow-300">
                    <div className="font-bold">8-12 years</div>
                    <div className="text-xs font-medium">Customer Lifetime</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold">85%+</div>
                    <div className="text-xs font-medium">Gross Margin</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LTVExpansionSlide;