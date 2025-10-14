import React from 'react';
import { Clock, MapPin, Users, AlertTriangle, MessageSquare, Mail, Upload, Cloud, CloudOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const EventCard = ({ event, onClick, compact = false, showTime = false }) => {
  const navigate = useNavigate();
  const getCategoryColor = (category) => {
    const colors = {
      medical: '#dc2626',
      school: '#2563eb',
      sports: '#16a34a',
      birthday: '#9333ea',
      work: '#f59e0b',
      family: '#06b6d4',
      social: '#ec4899',
      other: '#6b7280'
    };
    return colors[category] || colors.other;
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const categoryColor = getCategoryColor(event.category);
  const hasConflicts = event.conflicts && (
    event.conflicts.timeConflicts?.length > 0 ||
    event.conflicts.travelTimeConflicts?.length > 0
  );

  if (compact) {
    return (
      <div 
        className={`event-card-compact ${hasConflicts ? 'has-conflict' : ''}`}
        style={{ borderLeftColor: categoryColor }}
        onClick={onClick}
      >
        <span className="event-time">{formatTime(event.startTime)}</span>
        <span className="event-title">{event.title}</span>
        {hasConflicts && <AlertTriangle size={12} className="conflict-icon" />}
      </div>
    );
  }

  return (
    <div 
      className={`event-card ${hasConflicts ? 'has-conflict' : ''}`}
      style={{ borderLeftColor: categoryColor }}
      onClick={onClick}
    >
      <div className="event-header">
        <h4 className="event-title">
          {event.title}
          {hasConflicts && <AlertTriangle size={16} className="conflict-icon-inline" />}
        </h4>
        <div className="event-header-right">
          {/* Google sync indicator */}
          {event.googleEventId && (
            <span 
              className="sync-indicator"
              title={event.syncedToGoogle ? "Synced with Google Calendar" : "From Google Calendar"}
            >
              <Cloud size={14} className={event.source === 'google' ? 'text-blue-500' : 'text-green-500'} />
            </span>
          )}
          <span 
            className="event-category"
            style={{ backgroundColor: categoryColor }}
          >
            {event.category}
          </span>
        </div>
      </div>

      <div className="event-details">
        {(showTime || event.allDay === false) && (
          <div className="event-detail">
            <Clock size={14} />
            <span>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </span>
          </div>
        )}

        {event.location && (
          <div className="event-detail">
            <MapPin size={14} />
            <span>{event.location.name || event.location}</span>
          </div>
        )}

        {event.attendees && event.attendees.length > 0 && (
          <div className="event-detail">
            <Users size={14} />
            <span>{event.attendees.length} attendees</span>
          </div>
        )}

        {/* Show creation source */}
        {event.createdFrom && (
          <div 
            className="event-detail event-source"
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to inbox with the specific item
              if (event.smsId || event.emailId || event.sourceId) {
                navigate('/dashboard?tab=documents', { 
                  state: { 
                    selectedItemId: event.smsId || event.emailId || event.sourceId,
                    itemType: event.createdFrom 
                  }
                });
              }
            }}
            style={{ cursor: 'pointer', color: '#3b82f6' }}
            title="Click to view source"
          >
            {event.createdFrom === 'sms' && <MessageSquare size={14} />}
            {event.createdFrom === 'email' && <Mail size={14} />}
            {event.createdFrom === 'upload' && <Upload size={14} />}
            <span style={{ textDecoration: 'underline' }}>
              Created from {event.createdFrom === 'sms' ? 'SMS' : event.createdFrom}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};