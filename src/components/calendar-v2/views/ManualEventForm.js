// src/components/calendar-v2/views/ManualEventForm.js

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, FileText, Repeat, Bell } from 'lucide-react';
import { format, addHours, setHours, setMinutes, roundToNearestMinutes } from 'date-fns';
import { useCalendar } from '../hooks/useCalendar';
import { useFamily } from '../../../contexts/FamilyContext';

export function ManualEventForm({ initialDate, onClose, onEventCreated }) {
  const { createEvent, checkConflicts } = useCalendar();
  const { familyMembers } = useFamily();
  
  // Round time to nearest 30 minutes
  const getDefaultStartTime = () => {
    const now = initialDate || new Date();
    return roundToNearestMinutes(now, { nearestTo: 30 });
  };

  const [formData, setFormData] = useState({
    title: '',
    date: format(initialDate || new Date(), 'yyyy-MM-dd'),
    startTime: format(getDefaultStartTime(), 'HH:mm'),
    endTime: format(addHours(getDefaultStartTime(), 1), 'HH:mm'),
    allDay: false,
    location: '',
    description: '',
    attendees: [],
    category: 'personal',
    reminder: 15,
    recurrence: 'none'
  });

  const [conflicts, setConflicts] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check conflicts when time changes
  useEffect(() => {
    if (formData.date && formData.startTime && formData.endTime) {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);
      
      const eventData = {
        startTime: startDateTime,
        endTime: endDateTime,
        attendees: formData.attendees
      };
      
      const detectedConflicts = checkConflicts(eventData);
      setConflicts(detectedConflicts);
    }
  }, [formData.date, formData.startTime, formData.endTime, formData.attendees, checkConflicts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setLoading(true);
    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);
      
      const eventData = {
        title: formData.title,
        startTime: formData.allDay ? new Date(formData.date) : startDateTime,
        endTime: formData.allDay ? new Date(formData.date) : endDateTime,
        allDay: formData.allDay,
        location: formData.location,
        description: formData.description,
        attendees: formData.attendees,
        category: formData.category,
        reminder: formData.reminder,
        recurrence: formData.recurrence,
        source: 'manual'
      };

      const created = await createEvent(eventData);
      if (created) {
        onEventCreated?.(created);
        onClose();
      }
    } catch (error) {
      console.error('Failed to create event:', error);
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const display = format(setMinutes(setHours(new Date(), hour), minute), 'h:mm a');
      timeOptions.push({ value: time, label: display });
    }
  }

  return (
    <div className="manual-event-form">
      <div className="form-header">
        <h2>Create Event</h2>
        <button onClick={onClose} className="close-button">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="event-form-content">
        {/* Title */}
        <div className="form-group">
          <input
            type="text"
            placeholder="Add title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="form-input-large"
            autoFocus
          />
        </div>

        {/* Date and Time */}
        <div className="form-group">
          <div className="form-row">
            <div className="form-field">
              <label>
                <Calendar size={16} />
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          {!formData.allDay && (
            <div className="form-row">
              <div className="form-field">
                <label>
                  <Clock size={16} />
                  Start time
                </label>
                <select
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="form-select"
                >
                  {timeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label>
                  <Clock size={16} />
                  End time
                </label>
                <select
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="form-select"
                >
                  {timeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.allDay}
              onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
            />
            All-day
          </label>
        </div>

        {/* Location */}
        <div className="form-group">
          <label>
            <MapPin size={16} />
            Location
          </label>
          <input
            type="text"
            placeholder="Add location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            className="form-input"
          />
        </div>

        {/* Attendees */}
        <div className="form-group">
          <label>
            <Users size={16} />
            Attendees
          </label>
          <div className="attendees-list">
            {familyMembers?.map(member => (
              <label key={member.id} className="attendee-option">
                <input
                  type="checkbox"
                  checked={formData.attendees.includes(member.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, attendees: [...formData.attendees, member.id] });
                    } else {
                      setFormData({ ...formData, attendees: formData.attendees.filter(id => id !== member.id) });
                    }
                  }}
                />
                <span>{member.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="form-group">
          <label>Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="form-select"
          >
            <option value="personal">Personal</option>
            <option value="work">Work</option>
            <option value="medical">Medical</option>
            <option value="school">School</option>
            <option value="activity">Activity</option>
          </select>
        </div>

        {/* Reminder */}
        <div className="form-group">
          <label>
            <Bell size={16} />
            Reminder
          </label>
          <select
            value={formData.reminder}
            onChange={(e) => setFormData({ ...formData, reminder: parseInt(e.target.value) })}
            className="form-select"
          >
            <option value="0">None</option>
            <option value="5">5 minutes before</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
            <option value="1440">1 day before</option>
          </select>
        </div>

        {/* Recurrence */}
        <div className="form-group">
          <label>
            <Repeat size={16} />
            Repeat
          </label>
          <select
            value={formData.recurrence}
            onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
            className="form-select"
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekdays">Every weekday (Mon-Fri)</option>
            <option value="weekly">Weekly on {format(new Date(formData.date), 'EEEE')}</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Description */}
        <div className="form-group">
          <label>
            <FileText size={16} />
            Description
          </label>
          <textarea
            placeholder="Add description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-textarea"
            rows={3}
          />
        </div>

        {/* Conflicts Warning */}
        {conflicts && conflicts.timeConflicts?.length > 0 && (
          <div className="conflict-warning">
            <h4>⚠️ Conflicts detected</h4>
            {conflicts.timeConflicts.map((conflict, index) => (
              <p key={index}>{conflict.message}</p>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button type="button" onClick={onClose} className="cancel-button">
            Cancel
          </button>
          <button 
            type="submit" 
            className="save-button"
            disabled={!formData.title.trim() || loading}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}