import React, { useState } from 'react';
import { Shield, Users, MessageSquare, HelpCircle, Zap, DollarSign } from 'lucide-react';

const CompetitorLandscapeSlide = () => {
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);

  // Define cost levels for visual representation
  const COST_LEVELS = {
    FREE: 0,
    LOW: 1,     // $0-$5/month
    MEDIUM: 2,  // $5-$15/month
    HIGH: 3,    // $15-$30/month
    VERY_HIGH: 4 // $30+/month
  };

  // Define competitors with improved data including cost information
  const competitors = [
    {
      id: 'google-cal',
      name: 'Google Calendar/Cozi',
      x: 80, // High tech
      y: 85, // Low wellness
      description: 'Great scheduling & reminders; do nothing about fairness, mental load, or relationship health.',
      costLevel: COST_LEVELS.FREE,
      costLabel: 'Free'
    },
    {
      id: 'good-inside',
      name: 'Good Inside (Dr. Becky)',
      x: 20, // Low tech
      y: 20, // High wellness
      description: 'Deep emotional guidance; no automation, cannot stop chores piling up.',
      costLevel: COST_LEVELS.HIGH,
      costLabel: '$25/mo'
    },
    {
      id: 'paper-cal',
      name: 'Paper Calendars',
      x: 15, // Low tech
      y: 88, // Low wellness
      description: 'Fragmented; parents shoulder both planning & emotion.',
      costLevel: COST_LEVELS.LOW,
      costLabel: 'One-time'
    },
    {
      id: 'alexa',
      name: 'Alexa/Smart Assistants',
      x: 65, // Medium-high tech
      y: 90, // Very low wellness
      description: 'Basic reminders but no family-specific intelligence.',
      costLevel: COST_LEVELS.LOW,
      costLabel: 'Free+Device'
    },
    {
      id: 'therapy',
      name: 'Therapists/Coaching',
      x: 5, // Very low tech
      y: 10, // Very high wellness
      description: 'Excellent emotional support but expensive and not integrated with daily logistics.',
      costLevel: COST_LEVELS.VERY_HIGH,
      costLabel: '$150/hr'
    },
    {
      id: 'maple',
      name: 'Maple (Task Manager)',
      x: 40, // Medium tech
      y: 70, // Low-medium wellness
      description: 'Good for tasks but manual; no AI or relationship coaching.',
      costLevel: COST_LEVELS.MEDIUM,
      costLabel: '$8/mo'
    },
    {
      id: 'family-app',
      name: 'FamilyWall',
      x: 55, // Medium tech
      y: 60, // Medium wellness
      description: 'Basic family organization but limited AI capabilities.',
      costLevel: COST_LEVELS.MEDIUM,
      costLabel: '$10/mo'
    },
    {
      id: 'todoist',
      name: 'Todoist/TickTick',
      x: 60, // Medium-high tech
      y: 80, // Low wellness
      description: 'Task tracking but no family-specific features or emotional support.',
      costLevel: COST_LEVELS.LOW,
      costLabel: '$5/mo'
    },
    {
      id: 'parenting-apps',
      name: 'Moms Groups Apps',
      x: 30, // Low-medium tech
      y: 40, // Medium wellness
      description: 'Community support but limited organization capabilities.',
      costLevel: COST_LEVELS.FREE,
      costLabel: 'Free'
    }
  ];

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8 pt-0">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-2">Competitive Landscape</h2>
        <h3 className="text-xl font-light text-gray-600 mb-8">Allie occupies the uncrowded "High-Tech × High-Touch" quadrant</h3>

        <div className="relative h-[450px] bg-gray-50 rounded-xl border border-gray-200 p-4 mb-4">
          {/* Axes Labels */}
          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-gray-600 font-medium">
            Family Wellness Focus
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-gray-600 font-medium">
            Automation & Intelligence
          </div>

          {/* Quadrant Labels - Positioned better to avoid overlap */}
          <div className="absolute left-[20%] top-[20%] transform -translate-x-1/2 -translate-y-1/2 text-gray-500 text-xs bg-white px-2 py-1 rounded">
            Low Tech / High Wellness
          </div>
          <div className="absolute left-[80%] top-[20%] transform -translate-x-1/2 -translate-y-1/2 text-gray-500 text-xs bg-white px-2 py-1 rounded">
            High Tech / High Wellness
          </div>
          <div className="absolute left-[20%] top-[80%] transform -translate-x-1/2 -translate-y-1/2 text-gray-500 text-xs bg-white px-2 py-1 rounded">
            Low Tech / Low Wellness
          </div>
          <div className="absolute left-[80%] top-[80%] transform -translate-x-1/2 -translate-y-1/2 text-gray-500 text-xs bg-white px-2 py-1 rounded">
            High Tech / Low Wellness
          </div>

          {/* Axes */}
          <div className="absolute top-1/2 left-0 right-0 border-b border-gray-300"></div>
          <div className="absolute bottom-0 top-0 left-1/2 border-l border-gray-300"></div>

          {/* Interactive Competitor Dots with Cost */}
          {competitors.map((comp) => (
            <div
              key={comp.id}
              className={`absolute cursor-pointer transition-all duration-300 ease-in-out
                ${selectedCompetitor === comp.id ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                bg-gray-300 rounded-full transform -translate-x-1/2 -translate-y-1/2 hover:scale-125 z-0`}
              style={{
                left: `${comp.x}%`,
                top: `${comp.y}%`,
                width: `${comp.costLevel ? 16 + comp.costLevel * 2 : 16}px`,
                height: `${comp.costLevel ? 16 + comp.costLevel * 2 : 16}px`
              }}
              onClick={() => setSelectedCompetitor(comp.id)}
            >
              {/* Cost indicator */}
              {comp.costLevel > 0 && (
                <div
                  className="absolute -top-1 -right-1 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
                  style={{ width: '14px', height: '14px' }}
                >
                  {Array(Math.min(comp.costLevel, 3)).fill('$').join('')}
                </div>
              )}

              {/* Competitor name */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap bg-white px-1 py-0.5 rounded-sm">
                {comp.name}
              </div>

              {/* Cost label on hover */}
              <div className="absolute opacity-0 group-hover:opacity-100 -top-6 left-1/2 transform -translate-x-1/2 text-[10px] bg-white px-1 py-0.5 rounded shadow whitespace-nowrap z-20">
                {comp.costLabel}
              </div>
            </div>
          ))}

          {/* Allie Logo (Enhanced for visibility) */}
          <div
            className="absolute w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
            style={{ left: '85%', top: '15%' }}
            onClick={() => setSelectedCompetitor('allie')}
          >
            <div className="text-white font-bold text-lg">Allie</div>
            <div className="absolute -right-1 -top-1 w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center">
              <Zap size={12} className="text-purple-700" />
            </div>
            <div className="absolute w-24 h-24 bg-purple-400 rounded-full -z-10 opacity-20 animate-pulse"></div>

            {/* Allie cost tag */}
            <div className="absolute -bottom-2 -right-2 flex items-center bg-yellow-400 text-gray-800 rounded-full px-2 py-0.5 text-xs font-semibold shadow-sm">
              <DollarSign size={10} className="mr-0.5" />
              <span>14/mo</span>
            </div>
          </div>

          {/* Allie Highlight - Repositioned to avoid overlap with the circle */}
          <div className="absolute top-[15%] right-[5%] bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border-l-4 border-purple-500 max-w-xs shadow-sm z-10">
            <h4 className="font-medium text-purple-800 mb-1">Allie's Unique Position</h4>
            <p className="text-sm">
              Only player combining proactive AI + workload analytics + evidence-based relationship coaching
            </p>
          </div>

          {/* Cost legend */}
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-sm text-xs">
            <h5 className="font-medium mb-2 text-gray-700 flex items-center">
              <DollarSign size={12} className="mr-1" /> Cost Comparison
            </h5>
            <div className="flex items-center space-x-3 flex-wrap">
              <div className="flex items-center mr-3 mb-1">
                <div className="w-3 h-3 bg-gray-300 rounded-full mr-1"></div>
                <span>Free</span>
              </div>
              <div className="flex items-center mr-3 mb-1">
                <div className="w-4 h-4 bg-gray-300 rounded-full relative mr-1">
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center text-[8px] font-bold">$</div>
                </div>
                <span>$1-$10/mo</span>
              </div>
              <div className="flex items-center mr-3 mb-1">
                <div className="w-5 h-5 bg-gray-300 rounded-full relative mr-1">
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center text-[8px] font-bold">$$</div>
                </div>
                <span>$10-$25/mo</span>
              </div>
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 bg-gray-300 rounded-full relative mr-1">
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center text-[8px] font-bold">$$$</div>
                </div>
                <span>$25+/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Moved details panel below the chart */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-8">
          <h4 className="font-medium mb-2 flex items-center">
            {selectedCompetitor ?
              (selectedCompetitor === 'allie' ? "Allie's Advantage" : "Why This Competitor Falls Short") :
              <><HelpCircle size={16} className="mr-1 text-gray-400" /> Click on any competitor to see details</>
            }
          </h4>

          {selectedCompetitor === 'allie' ? (
            <p className="text-sm text-purple-800">
              Only player combining proactive AI + workload analytics + evidence-based relationship coaching.
              Allie uniquely operates at the intersection of high-tech intelligence and deep family wellness.
            </p>
          ) : selectedCompetitor ? (
            <div className="text-sm">
              <span className="font-medium">{competitors.find(c => c.id === selectedCompetitor)?.name}:</span> {competitors.find(c => c.id === selectedCompetitor)?.description}
            </div>
          ) : (
            <ul className="space-y-1 text-sm">
              <li className="flex items-start">
                <div className="w-3 h-3 rounded-full bg-gray-300 mt-1 mr-2"></div>
                <div>
                  <span className="font-medium">Google Calendar/Cozi:</span> Great scheduling & reminders; do nothing about fairness, mental load, or relationship health.
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-3 h-3 rounded-full bg-gray-300 mt-1 mr-2"></div>
                <div>
                  <span className="font-medium">Good Inside (Dr. Becky):</span> Deep emotional guidance; no automation, can't stop chores piling up.
                </div>
              </li>
              <li className="flex items-start">
                <div className="w-3 h-3 rounded-full bg-gray-300 mt-1 mr-2"></div>
                <div>
                  <span className="font-medium">Paper calendars/Apps:</span> Fragmented; parents shoulder both planning & emotion.
                </div>
              </li>
            </ul>
          )}
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-medium mb-4">Our Competitive Moat</h3>
          <ul className="space-y-4">
            <li className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <Shield size={20} className="text-purple-700" />
              </div>
              <div>
                <span className="font-medium">Dual Expertise:</span> Building Allie requires both advanced AI capabilities and deep family psychology expertise—a rare combination.
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <Users size={20} className="text-purple-700" />
              </div>
              <div>
                <span className="font-medium">Family Data Graph:</span> As Allie learns about each family, our personalization advantage grows—a data advantage competitors can't easily reproduce.
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-purple-100 p-2 rounded-full mr-3">
                <MessageSquare size={20} className="text-purple-700" />
              </div>
              <div>
                <span className="font-medium">Emotional Intelligence:</span> Allie's nuanced understanding of family dynamics and relationships creates natural stickiness and trust.
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CompetitorLandscapeSlide;