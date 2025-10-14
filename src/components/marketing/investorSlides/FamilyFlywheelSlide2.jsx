import React, { useState } from 'react';
import { Calendar, Users, ChevronRight, ArrowRight, PlusCircle, Database } from 'lucide-react';

const FamilyFlywheelSlide2 = () => {
  const [selectedDataset, setSelectedDataset] = useState('age');
  
  const datasets = [
    {
      id: 'age',
      name: 'Age, height, weight',
      trigger: 'Growth percentile jump at 11',
      offer: '24ʺ → 26ʺ bike trade-in bundle',
      revenue: '15% margin',
      example: 'As Allie tracks the family growth data, it can predict when a child will outgrow their bike, and offer a perfectly timed trade-in.',
      icon: <Users size={18} className="text-blue-600" />
    },
    {
      id: 'health',
      name: 'Health records',
      trigger: 'Flu vax due in Oct',
      offer: 'Tele-clinic slot + CVS booking',
      revenue: 'Lead fee',
      example: 'Allie knows when seasonal vaccinations or check-ups are due and can seamlessly book appointments with preferred providers.',
      icon: <PlusCircle size={18} className="text-red-600" />
    },
    {
      id: 'calendar',
      name: 'Calendar events',
      trigger: '"U12 soccer try-outs"',
      offer: 'Full kit; optional coaching clinic',
      revenue: '12% affiliate',
      example: 'When Allie sees soccer try-outs on the calendar, it can suggest the right equipment, practice guides, and private coaching.',
      icon: <Calendar size={18} className="text-green-600" />
    },
    {
      id: 'interest',
      name: 'Interest survey',
      trigger: '"Minecraft + Coding" top-rank',
      offer: 'Roblox coding camp, LED-matrix kit',
      revenue: '20%',
      example: 'Based on child interest surveys, Allie recommends relevant learning opportunities, hobby kits, and educational activities.',
      icon: <Database size={18} className="text-purple-600" />
    },
    {
      id: 'habits',
      name: 'Habit outcomes',
      trigger: '"Weekly date night" streak',
      offer: 'Babysitter + restaurant discount',
      revenue: 'Dual commission',
      example: 'When parents maintain a date night streak, Allie can offer special restaurant rates and help schedule a trusted babysitter.',
      icon: <ChevronRight size={18} className="text-amber-600" />
    }
  ];

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-2">The 360° Family Data Graph</h2>
        <h3 className="text-xl font-light text-gray-600 mb-8">Unique monetization opportunities from consent-based data</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {/* Dataset selection sidebar */}
          <div className="md:col-span-1 space-y-2">
            <h4 className="font-medium text-lg mb-4">Data Types</h4>
            {datasets.map(dataset => (
              <div 
                key={dataset.id}
                className={`p-3 rounded-lg flex items-start cursor-pointer transition-all
                  ${selectedDataset === dataset.id 
                    ? 'bg-purple-100 border-purple-300' 
                    : 'bg-gray-50 hover:bg-gray-100 border-transparent'
                  } border`}
                onClick={() => setSelectedDataset(dataset.id)}
              >
                <div className={`p-1.5 rounded-full mr-3 flex-shrink-0 ${
                  selectedDataset === dataset.id ? 'bg-white' : 'bg-gray-100'
                }`}>
                  {dataset.icon}
                </div>
                <div className="text-sm font-medium">{dataset.name}</div>
              </div>
            ))}
          </div>
          
          {/* Main content area */}
          <div className="md:col-span-4">
            <div className="border border-gray-200 rounded-lg p-6 bg-white h-full">
              {datasets.find(d => d.id === selectedDataset) && (
                <>
                  <h3 className="text-xl font-medium mb-6 pb-4 border-b border-gray-200">
                    <span className="mr-2">{datasets.find(d => d.id === selectedDataset).icon}</span>
                    {datasets.find(d => d.id === selectedDataset).name}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Trigger Event</h4>
                      <div className="font-medium">{datasets.find(d => d.id === selectedDataset).trigger}</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Suggested Offer</h4>
                      <div className="font-medium">{datasets.find(d => d.id === selectedDataset).offer}</div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Revenue Model</h4>
                      <div className="font-medium text-green-600">{datasets.find(d => d.id === selectedDataset).revenue}</div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <h4 className="font-medium text-blue-800 mb-2">How This Works</h4>
                    <p className="text-blue-900">
                      {datasets.find(d => d.id === selectedDataset).example}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Data security edge section */}
          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
            <h3 className="text-xl font-medium mb-4 text-purple-800">Our Data Advantage</h3>
            <p className="mb-4">
              Because Allie hosts private family data with explicit consent and purpose, giants like Amazon and Meta cannot replicate the relevance without breaching trust.
            </p>
            <p className="text-sm italic">
              "Unlike intrusive targeted ads, Allie's recommendations come from a trusted family assistant that already knows what you need."
            </p>
            <div className="mt-4 p-4 bg-white rounded-lg">
              <div className="flex items-center">
                <span className="font-bold text-3xl text-purple-600 mr-2">100%</span>
                <span className="text-sm">Transparent, consent-based data usage with families</span>
              </div>
            </div>
          </div>
          
          {/* Monetization edge section */}
          <div className="rounded-lg p-6 bg-gray-50 border border-gray-200">
            <h3 className="text-xl font-medium mb-4">Monetization Flywheel</h3>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <ChevronRight size={18} className="text-green-700" />
                </div>
                <div>
                  <span className="font-medium">Contextual Timing:</span> Allie knows exactly when families need something, maximizing conversion.
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <ChevronRight size={18} className="text-green-700" />
                </div>
                <div>
                  <span className="font-medium">Accuracy Compounds:</span> Each interaction improves Allie's understanding, making future recommendations better.
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <ChevronRight size={18} className="text-green-700" />
                </div>
                <div>
                  <span className="font-medium">Trust-Based Sales:</span> Recommendations feel like helpful suggestions, not marketing, yielding higher conversion rates.
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center py-3 bg-white rounded-lg">
              <div className="text-xl font-bold">Family Data Graph → Long-Term Trust → High-Conversion Commerce</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <button 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center"
            onClick={() => window.history.back()}
          >
            ← Previous: Trust Layers
          </button>
          <button 
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            onClick={() => window.location.href = '#'}
          >
            Next: Lifetime Value Model <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FamilyFlywheelSlide2;