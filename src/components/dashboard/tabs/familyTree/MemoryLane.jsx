import React, { useState, useEffect } from 'react';
import FamilyTreeService from '../../../../services/FamilyTreeService';
import { NotionButton, NotionBadge } from '../../../common/NotionUI';
import { 
  Calendar, MapPin, Users, Heart, Briefcase, Home, School,
  Baby, Cake, GraduationCap, CircleEllipsis as Rings, Award, Plane, Camera,
  MessageCircle, ChevronRight, Filter
} from 'lucide-react';

const MemoryLane = ({ familyId, treeData, onMemberSelect, onAskAllie }) => {
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedYear, setSelectedYear] = useState(null);

  useEffect(() => {
    loadTimelineEvents();
  }, [familyId]);

  const loadTimelineEvents = async () => {
    try {
      setLoading(true);
      const events = await FamilyTreeService.getFamilyTimeline(familyId);
      setTimelineEvents(events);
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const eventIcons = {
    birth: Baby,
    death: Heart,
    marriage: Rings,
    education: GraduationCap,
    career: Briefcase,
    move: Home,
    travel: Plane,
    achievement: Award,
    memory: Camera
  };

  const eventColors = {
    birth: 'bg-green-100 text-green-800',
    death: 'bg-gray-100 text-gray-800',
    marriage: 'bg-pink-100 text-pink-800',
    education: 'bg-blue-100 text-blue-800',
    career: 'bg-purple-100 text-purple-800',
    move: 'bg-orange-100 text-orange-800',
    travel: 'bg-teal-100 text-teal-800',
    achievement: 'bg-yellow-100 text-yellow-800',
    memory: 'bg-indigo-100 text-indigo-800'
  };

  const filteredEvents = timelineEvents.filter(event => {
    if (filter === 'all') return true;
    return event.type === filter;
  });

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const year = new Date(event.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(event);
    return acc;
  }, {});

  const years = Object.keys(groupedEvents).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Family Timeline</h2>
        <p className="text-gray-600">Journey through your family's history</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <NotionButton
          onClick={() => setFilter('all')}
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
        >
          All Events
        </NotionButton>
        {Object.keys(eventIcons).map(type => (
          <NotionButton
            key={type}
            onClick={() => setFilter(type)}
            variant={filter === type ? 'primary' : 'outline'}
            size="sm"
            icon={React.createElement(eventIcons[type], { className: 'h-3 w-3' })}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </NotionButton>
        ))}
      </div>

      {/* Timeline */}
      {years.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No timeline events yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Add birth dates and life events to build your family timeline
          </p>
          <NotionButton
            onClick={() => onAskAllie(null)}
            variant="primary"
            className="mt-4"
            icon={<MessageCircle className="h-4 w-4" />}
          >
            Ask Allie to Help
          </NotionButton>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

          {/* Years and events */}
          {years.map((year, yearIndex) => (
            <div key={year} className="relative mb-8">
              {/* Year marker */}
              <div className="flex items-center mb-4">
                <div className="absolute left-8 w-4 h-4 bg-white border-4 border-blue-600 rounded-full -translate-x-1/2"></div>
                <h3 className="ml-16 text-xl font-bold text-gray-900">{year}</h3>
              </div>

              {/* Events for this year */}
              <div className="ml-16 space-y-3">
                {groupedEvents[year].map((event, eventIndex) => {
                  const Icon = eventIcons[event.type] || Calendar;
                  const colorClass = eventColors[event.type] || 'bg-gray-100 text-gray-800';
                  
                  return (
                    <div
                      key={event.id}
                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => event.member && onMemberSelect(event.member)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{event.title}</h4>
                          
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(event.date).toLocaleDateString()}
                            </span>
                            
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </span>
                            )}
                            
                            {event.members && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {event.members.length} people
                              </span>
                            )}
                          </div>

                          {/* People involved */}
                          {event.members && (
                            <div className="flex gap-2 mt-2">
                              {event.members.map(member => (
                                <NotionBadge
                                  key={member.id}
                                  color="gray"
                                  className="cursor-pointer hover:bg-gray-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMemberSelect(member);
                                  }}
                                >
                                  {member.profile.displayName}
                                </NotionBadge>
                              ))}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAskAllie(event.member || null);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MessageCircle className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating timeline navigation */}
      {years.length > 10 && (
        <div className="fixed right-6 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-2">
          <div className="space-y-1">
            {years.filter((_, i) => i % 5 === 0).map(year => (
              <button
                key={year}
                onClick={() => {
                  const element = document.querySelector(`[data-year="${year}"]`);
                  element?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded"
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryLane;