import React, { useState } from 'react';
import { Shield, Users, MessageSquare, HelpCircle } from 'lucide-react';

const CompetitorLandscapeSlide = () => {
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  
  // Define competitors with improved data
  const competitors = [
    { 
      id: 'google-cal', 
      name: 'Google Calendar/Cozi', 
      x: 80, // High tech
      y: 85, // Low wellness
      description: 'Great scheduling & reminders; do nothing about fairness, mental load, or relationship health.'
    },
    { 
      id: 'good-inside', 
      name: 'Good Inside (Dr. Becky)', 
      x: 20, // Low tech
      y: 20, // High wellness
      description: 'Deep emotional guidance; no automation, cannot stop chores piling up.'
    },
    { 
      id: 'paper-cal', 
      name: 'Paper Calendars', 
      x: 15, // Low tech
      y: 88, // Low wellness
      description: 'Fragmented; parents shoulder both planning & emotion.'
    },
    { 
      id: 'alexa', 
      name: 'Alexa/Smart Assistants', 
      x: 65, // Medium-high tech
      y: 90, // Very low wellness
      description: 'Basic reminders but no family-specific intelligence.'
    },
    { 
      id: 'therapy', 
      name: 'Therapists/Coaching', 
      x: 5, // Very low tech
      y: 10, // Very high wellness
      description: 'Excellent emotional support but expensive and not integrated with daily logistics.'
    },
    { 
      id: 'maple', 
      name: 'Maple (Task Manager)', 
      x: 40, // Medium tech
      y: 70, // Low-medium wellness
      description: 'Good for tasks but manual; no AI or relationship coaching.'
    },
    { 
      id: 'family-app', 
      name: 'FamilyWall', 
      x: 55, // Medium tech
      y: 60, // Medium wellness
      description: 'Basic family organization but limited AI capabilities.'
    },
    { 
      id: 'todoist', 
      name: 'Todoist/TickTick', 
      x: 60, // Medium-high tech
      y: 80, // Low wellness
      description: 'Task tracking but no family-specific features or emotional support.'
    },
    { 
      id: 'parenting-apps', 
      name: 'Moms Groups Apps', 
      x: 30, // Low-medium tech
      y: 40, // Medium wellness
      description: 'Community support but limited organization capabilities.'
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
          
          {/* Quadrant Labels - Positioned better to avoid overlap */}
          <div className="absolute left-1/4 top-1/4 transform -translate-x-1/2 -translate-y-1/2 text-gray-500 text-xs bg-white px-2 py-1 rounded">
            Low Tech / High Wellness
          </div>
          <div className="absolute left-3/4 top-1/4 transform -translate-x-1/2 -translate-y-1/2 text-gray-500 text-xs bg-white px-2 py-1 rounded">
            High Tech / High Wellness
          </div>
          <div className="absolute left-1/4 top-3/4 transform -translate-x-1/2 -translate-y-1/2 text-gray-500 text-xs bg-white px-2 py-1 rounded">
            Low Tech / Low Wellness
          </div>
          <div className="absolute left-3/4 top-3/4 transform -translate-x-1/2 -translate-y-1/2 text-gray-500 text-xs bg-white px-2 py-1 rounded">
            High Tech / Low Wellness
          </div>
          
          {/* Axes */}
          <div className="absolute top-1/2 left-0 right-0 border-b border-gray-300"></div>
          <div className="absolute bottom-0 top-0 left-1/2 border-l border-gray-300"></div>
          
          {/* Interactive Competitor Dots */}
          {competitors.map((comp) => (
            <div 
              key={comp.id}
              className={`absolute cursor-pointer transition-all duration-300 ease-in-out
                ${selectedCompetitor === comp.id ? 'w-5 h-5 ring-2 ring-offset-2 ring-blue-500' : 'w-4 h-4'} 
                bg-gray-300 rounded-full transform -translate-x-1/2 -translate-y-1/2 hover:scale-125`}
              style={{ left: `${comp.x}%`, top: `${comp.y}%` }}
              title={comp.name}
              onClick={() => setSelectedCompetitor(comp.id)}
            >
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap">
                {comp.name}
              </div>
            </div>
          ))}
          
          {/* Allie Logo (Special Highlight) */}
          <div 
            className="absolute w-16 h-16 bg-purple-600 rounded-full shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 animate-pulse cursor-pointer"
            style={{ left: '85%', top: '15%' }}
            onClick={() => setSelectedCompetitor('allie')}
          >
            <div className="text-white font-bold">Allie</div>
          </div>
          
          {/* Legend/Details panel - dynamically shows selected competitor */}
          <div className="absolute bottom-4 left-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100 max-w-md">
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
        
        {/* Navigation buttons */}
        <div className="mt-6 flex justify-between">
          <button 
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center"
            onClick={() => window.history.back()}
          >
            ← Previous Slide
          </button>
          <button 
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
            onClick={() => window.location.href = '#'} 
          >
            Next Slide →
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompetitorLandscapeSlide;