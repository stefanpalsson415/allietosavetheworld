import React from 'react';
import { Shield, DollarSign, TrendingUp, Users, Clock } from 'lucide-react';

const BusinessCaseValidationSlide = () => {
  const validationPoints = [
    {
      id: 'pain',
      icon: <Clock className="text-red-500" />,
      title: 'Mental Load Crisis',
      stats: '63% of parents feel daily overload',
      subStats: '30 hrs/week "second job"',
      description: 'Parents are already looking for solutions to this invisible labor'
    },
    {
      id: 'willingness',
      icon: <DollarSign className="text-green-500" />,
      title: 'Proven WTP',
      stats: '60k members @ $23-28/mo',
      subStats: 'Good Inside (Dr. Becky)',
      description: 'Parents already pay for just content; Allie adds execution'
    },
    {
      id: 'retention',
      icon: <TrendingUp className="text-blue-500" />,
      title: 'High Retention',
      stats: 'Multi-year stickiness',
      subStats: 'Once embedded in family routine',
      description: 'Similar apps (Cozi, Maple) report long-term usage patterns'
    },
    {
      id: 'alternatives',
      icon: <Users className="text-purple-500" />,
      title: 'Cost of Alternatives',
      stats: '$800-1k/mo nanny share',
      subStats: '$150/hr couples therapy',
      description: '$40/mo subscription looks cheap vs. real-world substitutes'
    },
    {
      id: 'global',
      icon: <Shield className="text-indigo-500" />,
      title: 'Global Market',
      stats: '54% of EU parents',
      subStats: 'Buy digital aids (~€25/mo)',
      description: 'Same willingness to pay across US and Europe'
    }
  ];

  // Pricing comparison for visual chart
  const pricingData = [
    { name: 'Good Inside (Parent Coaching)', price: 25, note: 'Content only' },
    { name: 'Weekly Therapy Session', price: 150, note: 'Single hour' },
    { name: 'Nanny (1 day/week)', price: 200, note: 'Limited relief' },
    { name: 'Allie ($40/mo)', price: 40, note: 'Full family support' }
  ];

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-2">Market Validation</h2>
        <h3 className="text-xl font-light text-gray-600 mb-8">Parents Will Pay $30-50/month for Comprehensive Family Support</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Left column: Validation pillars */}
          <div className="space-y-4">
            <h4 className="font-medium text-lg mb-2">Key Evidence Points</h4>
            
            {validationPoints.map(point => (
              <div key={point.id} className="bg-white rounded-lg shadow p-4 border-l-4 hover:shadow-md transition-shadow" style={{ borderLeftColor: point.id === 'pain' ? '#ef4444' : point.id === 'willingness' ? '#10b981' : point.id === 'retention' ? '#3b82f6' : point.id === 'alternatives' ? '#8b5cf6' : '#6366f1' }}>
                <div className="flex items-start">
                  <div className="rounded-full p-2 bg-gray-50 mr-3">
                    {point.icon}
                  </div>
                  <div>
                    <h5 className="font-medium">{point.title}</h5>
                    <div className="text-lg font-semibold">{point.stats}</div>
                    <div className="text-sm text-gray-500">{point.subStats}</div>
                    <p className="text-sm mt-1">{point.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Right column: Data visualization */}
          <div className="space-y-6">
            {/* Pricing comparison chart */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="font-medium text-lg mb-4">Price-Value Comparison</h4>
              
              <div className="space-y-3">
                {pricingData.map((item, i) => (
                  <div key={i} className="relative">
                    <div className="flex justify-between mb-1 items-center">
                      <span className="text-sm">{item.name}</span>
                      <span className="font-medium">${item.price}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`h-3 rounded-full ${item.name.includes('Allie') ? 'bg-purple-500' : 'bg-gray-400'}`} 
                        style={{ width: `${Math.min(item.price / 2, 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{item.note}</div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Key quotes/stats */}
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <h4 className="font-medium text-lg mb-3">Critical Market Insights</h4>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="text-2xl font-bold text-purple-500 mr-3">71%</div>
                  <p className="text-sm">Of mental load falls on mothers in most households, leading to burnout and relationship strain</p>
                </div>
                
                <div className="flex items-start">
                  <div className="text-2xl font-bold text-purple-500 mr-3">79%</div>
                  <p className="text-sm">Of parents experience anxiety about scheduling family tasks and managing logistics</p>
                </div>
                
                <div className="flex items-start">
                  <div className="text-2xl font-bold text-purple-500 mr-3">$60k</div>
                  <p className="text-sm">Estimated annual value of the "invisible labor" parents perform; Allie at $480/year represents less than 1% of that value</p>
                </div>
              </div>
            </div>
            
            {/* European market validation */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium mb-2">Global Appeal</h4>
              <p className="text-sm">
                "La charge mentale" (mental load) concept has topped bestseller lists in Europe. Our pricing research shows similar willingness to pay across both US and European markets, enabling global expansion with consistent pricing.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-3">Market Conclusion</h3>
          <p className="text-lg">
            The market is primed for Allie's solution. With parents already spending similar amounts on partial solutions, Allie's comprehensive approach justifies pricing at the upper end of the $30-50/month range.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-lg font-medium text-green-600">Pain is severe & chronic</div>
              <div className="text-sm">Even modest relief worth real money</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-lg font-medium text-green-600">High retention vectors</div>
              <div className="text-sm">Low churn once embedded in family life</div>
            </div>
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <div className="text-lg font-medium text-green-600">Proven analogues exist</div>
              <div className="text-sm">Content-only solutions already monetizing</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCaseValidationSlide;