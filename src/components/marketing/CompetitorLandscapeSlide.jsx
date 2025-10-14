import React from 'react';
import { Shield, Users, MessageSquare, Calendar, AlertTriangle } from 'lucide-react';

const CompetitorLandscapeSlide = () => {
  // Define competitor dots
  const competitors = [
    { 
      id: 'google-cal', 
      name: 'Google Calendar / Cozi', 
      x: 80, // High tech
      y: 15, // Low wellness
      icon: <Calendar size={16} className="mr-1" />,
      description: 'Great scheduling & reminders; do nothing about fairness, mental load, or relationship health.'
    },
    { 
      id: 'good-inside', 
      name: 'Good Inside (Dr. Becky)', 
      x: 20, // Low tech
      y: 80, // High wellness
      icon: <MessageSquare size={16} className="mr-1" />,
      description: 'Deep emotional guidance; no automation, can't stop chores piling up.'
    },
    { 
      id: 'paper-cal', 
      name: 'Paper Calendars / Single-Function Apps', 
      x: 15, // Low tech
      y: 12, // Low wellness
      icon: <AlertTriangle size={16} className="mr-1" />,
      description: 'Fragmented; parents shoulder both planning & emotion.'
    },
    { 
      id: 'alexa', 
      name: 'Alexa / Smart Assistants', 
      x: 65, // Medium-high tech
      y: 10, // Very low wellness
      icon: <Calendar size={16} className="mr-1" />,
      description: 'Basic reminders but no family-specific intelligence.'
    },
    { 
      id: 'therapy', 
      name: 'Therapists / Coaching', 
      x: 5, // Very low tech
      y: 90, // Very high wellness
      icon: <Users size={16} className="mr-1" />,
      description: 'Excellent emotional support but expensive and not integrated with daily logistics.'
    },
    { 
      id: 'maple', 
      name: 'Maple (Task Manager)', 
      x: 40, // Medium tech
      y: 30, // Low-medium wellness
      icon: <Shield size={16} className="mr-1" />,
      description: 'Good for tasks but manual; no AI or relationship coaching.'
    }
  ];

  return (
    <div className="min-h-[80vh] flex flex-col justify-center px-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-light mb-2">Competitive Landscape</h2>
        <h3 className="text-xl font-light text-gray-600 mb-8">Allie occupies the uncrowded "High-Tech × High-Touch" quadrant</h3>
        
        <div className="relative h-[500px] bg-gray-50 rounded-xl border border-gray-200 p-4 mb-8">
          {/* Axes Labels */}
          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 -rotate-90 text-gray-600 font-medium">
            Family Wellness Focus
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-gray-600 font-medium">
            Automation & Intelligence
          </div>
          
          {/* Quadrant Labels */}
          <div className="absolute left-1/4 top-1/4 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 text-sm">
            Low Tech / High Wellness
          </div>
          <div className="absolute left-3/4 top-1/4 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 text-sm">
            High Tech / High Wellness
          </div>
          <div className="absolute left-1/4 top-3/4 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 text-sm">
            Low Tech / Low Wellness
          </div>
          <div className="absolute left-3/4 top-3/4 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 text-sm">
            High Tech / Low Wellness
          </div>
          
          {/* Axes */}
          <div className="absolute top-1/2 left-0 right-0 border-b border-gray-300"></div>
          <div className="absolute bottom-0 top-0 left-1/2 border-l border-gray-300"></div>
          
          {/* Competitor Dots */}
          {competitors.map((comp) => (
            <div 
              key={comp.id}
              className="absolute w-4 h-4 bg-gray-300 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-150"
              style={{ 
                left: `${comp.x}%`, 
                top: `${comp.y}%`,
                backgroundColor: comp.id === 'allie' ? '#8b5cf6' : '#d1d5db'
              }}
              title={comp.name}
            />
          ))}
          
          {/* Allie Logo (Special Highlight) */}
          <div 
            className="absolute w-16 h-16 bg-purple-600 rounded-full shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
            style={{ left: '85%', top: '15%' }}
          >
            <div className="text-white font-bold">Allie</div>
          </div>
          
          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 max-w-md">
            <h4 className="font-medium mb-2">Why Competitors Fall Short</h4>
            <ul className="space-y-1 text-sm">
              {competitors.map((comp) => (
                <li key={comp.id} className="flex items-start">
                  <div className="w-3 h-3 rounded-full bg-gray-300 mt-1 mr-2"></div>
                  <div>
                    <span className="font-medium">{comp.name}:</span> {comp.description}
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Allie Highlight */}
          <div className="absolute top-4 right-4 bg-purple-50 p-4 rounded-lg border border-purple-200 max-w-xs">
            <h4 className="font-medium text-purple-800 mb-1">Allie's Unique Position</h4>
            <p className="text-sm">
              Only player combining proactive AI + workload analytics + evidence-based relationship coaching
            </p>
          </div>
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