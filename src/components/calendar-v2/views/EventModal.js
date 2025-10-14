import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, MapPin, Users, FileText, Repeat, CheckSquare, AlertTriangle, MessageSquare, Mail, Upload } from 'lucide-react';
import { useCalendar } from '../hooks/useCalendar';
import { useFamily } from '../../../contexts/FamilyContext';
import { PrepTaskGenerator } from '../services/PrepTaskGenerator';
import { useNavigate } from 'react-router-dom';

export const EventModal = ({ event, initialDate, onClose }) => {
  const { createEvent, updateEvent, deleteEvent, checkConflicts } = useCalendar();
  const { selectedFamily } = useFamily();
  const navigate = useNavigate();
  const isEditing = !!event;
  const [showPrepTasks, setShowPrepTasks] = useState(false);
  const [prepTasks, setPrepTasks] = useState([]);
  const [conflicts, setConflicts] = useState(null);
  const formRef = useRef(null);
  const saveButtonRef = useRef(null);
  const cancelButtonRef = useRef(null);
  
  const prepTaskGenerator = new PrepTaskGenerator();
  
  // Debug component mount and button presence
  useEffect(() => {
    console.log('EventModal mounted');
    console.log('Form ref:', formRef.current);
    console.log('Save button ref:', saveButtonRef.current);
    console.log('Cancel button ref:', cancelButtonRef.current);
    
    // Check if buttons are actually in the DOM
    setTimeout(() => {
      console.log('After timeout - Form ref:', formRef.current);
      console.log('After timeout - Save button ref:', saveButtonRef.current);
      console.log('After timeout - Cancel button ref:', cancelButtonRef.current);
      
      // Try to find buttons by class name
      const saveBtn = document.querySelector('.save-button');
      const cancelBtn = document.querySelector('.cancel-button');
      console.log('Found save button by class:', saveBtn);
      console.log('Found cancel button by class:', cancelBtn);
      
      // Add test listener
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          console.log('Save clicked via querySelector!');
        });
        
        // Check computed styles
        const styles = window.getComputedStyle(saveBtn);
        console.log('Save button computed styles:', {
          pointerEvents: styles.pointerEvents,
          zIndex: styles.zIndex,
          position: styles.position,
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity
        });
        
        // Check if button is actually clickable
        const rect = saveBtn.getBoundingClientRect();
        console.log('Save button position:', rect);
        
        // Check what element is at the button's position
        const elementAtCenter = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2
        );
        console.log('Element at save button center:', elementAtCenter);
        console.log('Is it the save button?', elementAtCenter === saveBtn);
        
        // Try to trigger click programmatically
        setTimeout(() => {
          console.log('Attempting to trigger click programmatically...');
          saveBtn.click();
        }, 1000);
      }
    }, 100);
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'general',
    startTime: initialDate || new Date(),
    endTime: initialDate ? new Date(initialDate.getTime() + 60 * 60 * 1000) : new Date(Date.now() + 60 * 60 * 1000),
    allDay: false,
    location: '',
    attendees: [],
    recurrence: 'none'
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'general',
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        allDay: event.allDay || false,
        location: event.location || '',
        attendees: event.attendees || [],
        recurrence: event.recurrence || 'none'
      });
      
      // Generate prep tasks for existing event
      const tasks = prepTaskGenerator.generateTasks(event);
      setPrepTasks(tasks);
      
      // Set conflicts if they exist
      if (event.conflicts) {
        setConflicts(event.conflicts);
      }
    }
  }, [event]);

  const handleSubmit = async (e) => {
    console.log('EventModal handleSubmit called');
    e.preventDefault();
    
    try {
      console.log('Form data:', formData);
      console.log('Is editing:', isEditing);
      
      if (isEditing) {
        console.log('Updating event:', event.id);
        await updateEvent(event.id, formData);
      } else {
        console.log('Creating new event');
        await createEvent(formData);
      }
      
      console.log('Event saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(event.id);
      onClose();
    }
  };

  const handleInputChange = (field, value) => {
    const newData = {
      ...formData,
      [field]: value
    };
    setFormData(newData);
    
    // Check conflicts when date/time changes
    if (['startTime', 'endTime', 'location'].includes(field)) {
      const newConflicts = checkConflicts(newData, event?.id);
      setConflicts(newConflicts);
    }
    
    // Regenerate prep tasks when key fields change
    if (['category', 'startTime', 'title', 'location'].includes(field)) {
      const tasks = prepTaskGenerator.generateTasks(newData);
      setPrepTasks(tasks);
    }
  };

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'medical', label: 'Medical' },
    { value: 'school', label: 'School' },
    { value: 'sports', label: 'Sports' },
    { value: 'birthday', label: 'Birthday' },
    { value: 'work', label: 'Work' },
    { value: 'family', label: 'Family' },
    { value: 'social', label: 'Social' }
  ];

  const recurrenceOptions = [
    { value: 'none', label: 'Does not repeat' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => {
        console.log('Modal overlay clicked');
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => {
          console.log('Modal content clicked');
          e.stopPropagation();
        }}
      >
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Event' : 'Create Event'}</h2>
          <button 
            className="close-button" 
            onClick={(e) => {
              console.log('Close button clicked');
              e.stopPropagation();
              onClose();
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Event title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="form-input large"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                <Calendar size={16} />
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="form-select"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                <Repeat size={16} />
                Repeat
              </label>
              <select
                value={formData.recurrence}
                onChange={(e) => handleInputChange('recurrence', e.target.value)}
                className="form-select"
              >
                {recurrenceOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.allDay}
                onChange={(e) => handleInputChange('allDay', e.target.checked)}
              />
              All day event
            </label>
          </div>

          {!formData.allDay && (
            <div className="form-row">
              <div className="form-group">
                <label>
                  <Clock size={16} />
                  Start
                </label>
                <input
                  type="datetime-local"
                  value={formData.startTime.toISOString().slice(0, 16)}
                  onChange={(e) => handleInputChange('startTime', new Date(e.target.value))}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <Clock size={16} />
                  End
                </label>
                <input
                  type="datetime-local"
                  value={formData.endTime.toISOString().slice(0, 16)}
                  onChange={(e) => handleInputChange('endTime', new Date(e.target.value))}
                  className="form-input"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>
              <MapPin size={16} />
              Location
            </label>
            <input
              type="text"
              placeholder="Add location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>
              <Users size={16} />
              Attendees
            </label>
            <div className="attendee-list">
              {selectedFamily?.members?.map(member => (
                <label key={member.id} className="attendee-option">
                  <input
                    type="checkbox"
                    checked={formData.attendees.some(a => a.familyMemberId === member.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange('attendees', [
                          ...formData.attendees,
                          { familyMemberId: member.id, status: 'pending' }
                        ]);
                      } else {
                        handleInputChange('attendees', 
                          formData.attendees.filter(a => a.familyMemberId !== member.id)
                        );
                      }
                    }}
                  />
                  {member.name}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              <FileText size={16} />
              Description
            </label>
            <textarea
              placeholder="Add description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="form-textarea"
              rows={3}
            />
          </div>

          {/* Show event source if created from inbox */}
          {event?.createdFrom && (
            <div className="form-group">
              <label>
                {event.createdFrom === 'sms' && <MessageSquare size={16} />}
                {event.createdFrom === 'email' && <Mail size={16} />}
                {event.createdFrom === 'upload' && <Upload size={16} />}
                Source
              </label>
              <div 
                className="event-source-link"
                onClick={() => {
                  onClose();
                  navigate('/dashboard?tab=documents', { 
                    state: { 
                      selectedItemId: event.smsId || event.emailId || event.sourceId,
                      itemType: event.createdFrom 
                    }
                  });
                }}
                style={{ 
                  cursor: 'pointer', 
                  color: '#3b82f6',
                  textDecoration: 'underline',
                  padding: '8px 12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px',
                  display: 'inline-block'
                }}
              >
                Created from {event.createdFrom === 'sms' ? 'SMS' : event.createdFrom}
                {event.createdFrom === 'sms' && event.smsId && ' (View SMS)'}
                {event.createdFrom === 'email' && event.emailId && ' (View Email)'}
              </div>
            </div>
          )}

          {/* Conflicts Section */}
          {conflicts && (conflicts.timeConflicts?.length > 0 || conflicts.warnings?.length > 0) && (
            <div className="conflicts-section">
              <h3 className="section-title">
                <AlertTriangle size={16} />
                Potential Conflicts
              </h3>
              {conflicts.timeConflicts?.map((conflict, index) => (
                <div key={index} className="conflict-item">
                  <p className="conflict-message">{conflict.message}</p>
                </div>
              ))}
              {conflicts.warnings?.map((warning, index) => (
                <div key={index} className="warning-item">
                  <p className="warning-message">{warning.message}</p>
                </div>
              ))}
              {conflicts.suggestions?.map((suggestion, index) => (
                <div key={index} className="suggestion-item">
                  <p className="suggestion-message">{suggestion.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Prep Tasks Section */}
          {prepTasks.length > 0 && (
            <div className="prep-tasks-section">
              <h3 className="section-title">
                <CheckSquare size={16} />
                Suggested Prep Tasks
                <button 
                  type="button"
                  className="toggle-button"
                  onClick={() => setShowPrepTasks(!showPrepTasks)}
                >
                  {showPrepTasks ? 'Hide' : 'Show'} ({prepTasks.length})
                </button>
              </h3>
              {showPrepTasks && (
                <div className="prep-tasks-list">
                  {prepTasks.map((task) => (
                    <div key={task.id} className="prep-task-item">
                      <input type="checkbox" id={task.id} />
                      <label htmlFor={task.id}>
                        <span className="task-title">{task.title}</span>
                        <span className="task-due">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            {isEditing && (
              <button type="button" onClick={handleDelete} className="delete-button">
                Delete Event
              </button>
            )}
            <div className="form-actions-right">
              <button 
                ref={cancelButtonRef}
                type="button" 
                onClick={(e) => {
                  console.log('Cancel button clicked');
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }} 
                className="cancel-button"
              >
                Cancel
              </button>
              <button 
                ref={saveButtonRef}
                type="submit" 
                onClick={(e) => {
                  console.log('Save button clicked');
                  // Don't prevent default here - let form submit handle it
                }}
                className="save-button"
              >
                {isEditing ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};