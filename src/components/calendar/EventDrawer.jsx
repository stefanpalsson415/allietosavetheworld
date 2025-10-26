import React, { useEffect, useRef, useState } from 'react';
import {
  X, Calendar, Clock, MapPin, Users, Bell, Save, AlertCircle,
  Video, Plus, Trash2, User, FileText, CheckSquare, Paperclip, Link, MessageSquare
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp, collection, addDoc, arrayUnion, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';
import messageService from '../../services/MessageService';
import GooglePlacesInput from '../common/GooglePlacesInput';
import EventRoleAssignment from '../calendar-v2/EventRoleAssignment';

const DRAWER_WIDTH = '480px';

const EventDrawer = ({ isOpen, onClose, event, onUpdate }) => {
  const drawerRef = useRef(null);
  const { familyMembers = [], familyId } = useFamily();
  const { currentUser } = useAuth();
  const [editedEvent, setEditedEvent] = useState(event || {});
  const [isSaving, setIsSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const commentInputRef = useRef(null);
  const eventIdRef = useRef(null);
  const [linkedDocuments, setLinkedDocuments] = useState([]);
  const [linkedContacts, setLinkedContacts] = useState([]);
  const [linkedTasks, setLinkedTasks] = useState([]);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [availableTasks, setAvailableTasks] = useState([]);
  const [linkingType, setLinkingType] = useState(null); // 'document', 'contact', or 'task'

  // Update editedEvent when event prop changes and load linked entities
  useEffect(() => {
    if (event && event.id !== eventIdRef.current) {
      setEditedEvent(event);
      eventIdRef.current = event.id;

      // Load linked entities
      setLinkedDocuments(event.linkedDocuments || []);
      setLinkedContacts(event.linkedContacts || []);
      setLinkedTasks(event.linkedTasks || []);
    }
  }, [event]);

  // Load available items when linking
  useEffect(() => {
    if (!linkingType || !familyId) return;

    const loadAvailableItems = async () => {
      try {
        if (linkingType === 'document') {
          // Load recent emails and documents
          const emailsQuery = query(
            collection(db, 'emailInbox'),
            where('familyId', '==', familyId),
            firestoreLimit(20)
          );
          const emailsSnap = await getDocs(emailsQuery);
          const docs = emailsSnap.docs.map(doc => ({
            id: doc.id,
            name: doc.data().subject || 'Email',
            type: 'email',
            from: doc.data().from,
            date: doc.data().timestamp
          }));
          setAvailableDocuments(docs);
        } else if (linkingType === 'contact') {
          // Load family contacts
          const contactsQuery = query(
            collection(db, 'familyContacts'),
            where('familyId', '==', familyId)
          );
          const contactsSnap = await getDocs(contactsQuery);
          const contacts = contactsSnap.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name,
            type: doc.data().type || 'general',
            title: doc.data().title
          }));
          setAvailableContacts(contacts);
        } else if (linkingType === 'task') {
          // Load kanban tasks
          const tasksQuery = query(
            collection(db, 'kanbanTasks'),
            where('familyId', '==', familyId),
            firestoreLimit(20)
          );
          const tasksSnap = await getDocs(tasksQuery);
          const tasks = tasksSnap.docs.map(doc => ({
            id: doc.id,
            title: doc.data().title,
            status: doc.data().column || 'upcoming'
          }));
          setAvailableTasks(tasks);
        }
      } catch (error) {
        console.error('Error loading available items:', error);
      }
    };

    loadAvailableItems();
  }, [linkingType, familyId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        if (showMentions) {
          setShowMentions(false);
        } else {
          onClose();
        }
      }

      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && isOpen) {
        e.preventDefault();
        handleSave();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, showMentions]);

  // Auto-save when editedEvent changes (debounced) - ONLY for existing events
  useEffect(() => {
    // Only auto-save for existing events (event.id exists), not for new events
    if (!event?.id || !isOpen || !editedEvent.title?.trim() || isSaving) {
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSave();
    }, 3000); // 3 second debounce

    return () => clearTimeout(timeoutId);
  }, [editedEvent.title, editedEvent.location, editedEvent.description, editedEvent.startTime, editedEvent.endTime]);

  const handleSave = async () => {
    if (!editedEvent.title?.trim()) return;

    setIsSaving(true);
    try {
      const eventData = {
        title: editedEvent.title,
        description: editedEvent.description || '',
        location: editedEvent.location || '',
        locationDetails: editedEvent.locationDetails || null,
        startTime: editedEvent.startTime,
        endTime: editedEvent.endTime,
        startDate: new Date(editedEvent.startTime).toISOString().split('T')[0],
        endDate: new Date(editedEvent.endTime).toISOString().split('T')[0],
        allDay: editedEvent.allDay || false,
        attendees: editedEvent.attendees || [],
        reminders: editedEvent.reminders || [],
        linkedDocuments: linkedDocuments,
        linkedContacts: linkedContacts,
        linkedTasks: linkedTasks,
        familyId: editedEvent.familyId || familyId,
        userId: currentUser?.uid,
        source: 'manual'
      };

      // CREATE MODE: event.id is null
      if (!event?.id) {
        // Create new event
        const eventsRef = collection(db, 'events');
        const newEventRef = await addDoc(eventsRef, {
          ...eventData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        console.log('✅ Created new event:', newEventRef.id);

        // Dispatch event for calendar refresh
        window.dispatchEvent(new CustomEvent('calendar-event-created', {
          detail: { eventId: newEventRef.id, eventData }
        }));

        // Close drawer after creation
        if (onClose) {
          setTimeout(() => onClose(), 500);
        }
      }
      // EDIT MODE: event.id exists
      else {
        const eventRef = doc(db, 'events', event.id);
        await updateDoc(eventRef, {
          ...eventData,
          updatedAt: serverTimestamp()
        });

        console.log('✅ Updated event:', event.id);

        if (onUpdate) {
          onUpdate({ ...event, ...eventData });
        }

        // Dispatch event for calendar refresh
        window.dispatchEvent(new CustomEvent('calendar-event-updated', {
          detail: { eventId: event.id, updates: eventData }
        }));
      }
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedEvent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAttendeeToggle = (memberId) => {
    const currentAttendees = editedEvent.attendees || [];
    const member = familyMembers.find(m => m.id === memberId);

    if (!member) return;

    const isCurrentlyAttending = currentAttendees.some(a => a.id === memberId);

    let newAttendees;
    if (isCurrentlyAttending) {
      newAttendees = currentAttendees.filter(a => a.id !== memberId);
    } else {
      newAttendees = [...currentAttendees, {
        id: memberId,
        name: member.name,
        email: member.email,
        responseStatus: 'accepted'
      }];
    }

    handleFieldChange('attendees', newAttendees);
  };

  const handleAddReminder = () => {
    const currentReminders = editedEvent.reminders || [];
    handleFieldChange('reminders', [
      ...currentReminders,
      { method: 'popup', minutes: 30 }
    ]);
  };

  const handleRemoveReminder = (index) => {
    const currentReminders = editedEvent.reminders || [];
    handleFieldChange('reminders', currentReminders.filter((_, i) => i !== index));
  };

  const handleReminderChange = (index, field, value) => {
    const currentReminders = [...(editedEvent.reminders || [])];
    currentReminders[index] = { ...currentReminders[index], [field]: value };
    handleFieldChange('reminders', currentReminders);
  };

  // Handle @ mentions in comments
  const handleCommentChange = (e) => {
    const value = e.target.value;
    setCommentText(value);

    // Check for @ symbol
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      const charBeforeAt = lastAtIndex > 0 ? value[lastAtIndex - 1] : ' ';

      if ((charBeforeAt === ' ' || lastAtIndex === 0) && !textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt.toLowerCase());
        setShowMentions(true);
        setSelectedMentionIndex(0);
        return;
      }
    }

    setShowMentions(false);
  };

  const handleMentionSelect = (member) => {
    const lastAtIndex = commentText.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const beforeAt = commentText.slice(0, lastAtIndex);
      const afterSearch = commentText.slice(lastAtIndex + 1);
      const spaceIndex = afterSearch.indexOf(' ');
      const afterMention = spaceIndex !== -1 ? afterSearch.slice(spaceIndex) : '';

      const newText = `${beforeAt}@${member.name}${afterMention} `;
      setCommentText(newText);

      setTimeout(() => {
        if (commentInputRef.current) {
          commentInputRef.current.focus();
          commentInputRef.current.setSelectionRange(newText.length, newText.length);
        }
      }, 0);
    }

    setShowMentions(false);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !event?.id) return;

    setIsAddingComment(true);
    try {
      // Create a message in the messaging system
      await messageService.sendMessage({
        text: commentText,
        familyId,
        userId: currentUser?.uid,
        userName: currentUser?.displayName || currentUser?.email || 'User',
        context: {
          type: 'event',
          eventId: event.id,
          eventTitle: editedEvent.title
        },
        timestamp: new Date()
      });

      setCommentText('');

      // Dispatch event to notify Allie chat to refresh
      window.dispatchEvent(new CustomEvent('event-comment-added', {
        detail: { eventId: event.id }
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleLinkEntity = (entityType, entityId, entityData) => {
    if (entityType === 'document') {
      if (!linkedDocuments.find(d => d.id === entityId)) {
        setLinkedDocuments([...linkedDocuments, { id: entityId, ...entityData }]);
      }
    } else if (entityType === 'contact') {
      if (!linkedContacts.find(c => c.id === entityId)) {
        setLinkedContacts([...linkedContacts, { id: entityId, ...entityData }]);
      }
    } else if (entityType === 'task') {
      if (!linkedTasks.find(t => t.id === entityId)) {
        setLinkedTasks([...linkedTasks, { id: entityId, ...entityData }]);
      }
    }
    setShowLinkMenu(false);
  };

  const handleUnlinkEntity = (entityType, entityId) => {
    if (entityType === 'document') {
      setLinkedDocuments(linkedDocuments.filter(d => d.id !== entityId));
    } else if (entityType === 'contact') {
      setLinkedContacts(linkedContacts.filter(c => c.id !== entityId));
    } else if (entityType === 'task') {
      setLinkedTasks(linkedTasks.filter(t => t.id !== entityId));
    }
  };

  // Include @allie and family members in mentions
  const filteredMembers = showMentions
    ? [
        // Add Allie as first option
        ...(mentionSearch === '' || 'allie'.includes(mentionSearch.toLowerCase())
          ? [{
              id: 'allie',
              name: 'Allie',
              isAllie: true,
              avatar: '🤖'
            }]
          : []),
        // Add family members
        ...familyMembers.filter(member =>
          member.name?.toLowerCase().includes(mentionSearch)
        )
      ]
    : [];

  if (!isOpen || !event) return null;

  // Parse dates for inputs
  const startDate = editedEvent.startTime ? new Date(editedEvent.startTime) : new Date();
  const endDate = editedEvent.endTime ? new Date(editedEvent.endTime) : new Date(startDate.getTime() + 60 * 60 * 1000);

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <>
      {/* No backdrop - user can see and interact with page behind drawer */}

      {/* Drawer */}
      <div
        ref={drawerRef}
        data-testid="event-form"
        className={`fixed right-0 top-0 h-full bg-white shadow-2xl transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: DRAWER_WIDTH }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
          <button
            onClick={onClose}
            data-testid="close-event-form"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Title */}
          <div>
            <input
              type="text"
              data-testid="event-title-input"
              value={editedEvent.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Event title"
              className="w-full text-2xl font-semibold border-none outline-none focus:ring-0 p-0 placeholder-gray-400"
            />
          </div>

          {/* Date and Time - Google Calendar Style */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Date & Time</span>
            </div>

            <div className="ml-7 space-y-3">
              {/* All day checkbox */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editedEvent.allDay || false}
                  onChange={(e) => handleFieldChange('allDay', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">All day</span>
              </label>

              {/* Start date/time - Google Calendar style layout */}
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  data-testid="date-picker"
                  value={formatDateForInput(startDate)}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    newDate.setHours(startDate.getHours(), startDate.getMinutes());
                    handleFieldChange('startTime', newDate.toISOString());
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {!editedEvent.allDay && (
                  <>
                    <input
                      type="time"
                      data-testid="time-picker-start"
                      value={formatTimeForInput(startDate)}
                      onChange={(e) => {
                        const [hours, minutes] = e.target.value.split(':');
                        const newDate = new Date(startDate);
                        newDate.setHours(parseInt(hours), parseInt(minutes));
                        handleFieldChange('startTime', newDate.toISOString());
                      }}
                      className="w-32 px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </>
                )}
              </div>

              {/* "to" text between dates - Google Calendar style */}
              {!editedEvent.allDay && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-8 text-center">to</span>
                </div>
              )}

              {/* End date/time - Google Calendar style layout */}
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  data-testid="date-picker-end"
                  value={formatDateForInput(endDate)}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    newDate.setHours(endDate.getHours(), endDate.getMinutes());
                    handleFieldChange('endTime', newDate.toISOString());
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {!editedEvent.allDay && (
                  <input
                    type="time"
                    data-testid="time-picker-end"
                    value={formatTimeForInput(endDate)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':');
                      const newDate = new Date(endDate);
                      newDate.setHours(parseInt(hours), parseInt(minutes));
                      handleFieldChange('endTime', newDate.toISOString());
                    }}
                    className="w-32 px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              {/* Repeat dropdown - Google Calendar style */}
              <div className="flex items-center gap-3">
                <select
                  value={editedEvent.recurrence || 'none'}
                  onChange={(e) => handleFieldChange('recurrence', e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Location</span>
            </div>
            <div className="ml-7">
              <GooglePlacesInput
                value={editedEvent.location || ''}
                onChange={(value) => handleFieldChange('location', value)}
                onSelect={(place) => {
                  // Update location with full address and save place details
                  handleFieldChange('location', place.address);
                  handleFieldChange('locationDetails', {
                    placeId: place.id,
                    name: place.name,
                    address: place.address,
                    coordinates: place.coordinates
                  });
                }}
                placeholder="Add location"
                className=""
              />
            </div>
          </div>

          {/* Attendees */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Attendees</span>
            </div>
            <div className="ml-7 space-y-2">
              {familyMembers.map(member => {
                const isAttending = (editedEvent.attendees || []).some(a => a.id === member.id);
                return (
                  <label key={member.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAttending}
                      onChange={() => handleAttendeeToggle(member.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <UserAvatar user={member} size={24} />
                    <span className="text-sm text-gray-700">{member.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Event Roles - Makes Invisible Labor Visible! */}
          {(editedEvent.attendees || []).length > 0 && (
            <div className="space-y-3 border-t pt-4 mt-4">
              <EventRoleAssignment
                familyMembers={familyMembers}
                attendees={(editedEvent.attendees || []).map(a => a.id)}
                roleAssignments={editedEvent.roleAssignments || []}
                onRoleAssignmentsChange={(assignments) => handleFieldChange('roleAssignments', assignments)}
              />
            </div>
          )}

          {/* Reminders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Reminders</span>
              </div>
              <button
                onClick={handleAddReminder}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                + Add
              </button>
            </div>
            <div className="ml-7 space-y-2">
              {(editedEvent.reminders || []).map((reminder, index) => (
                <div key={index} className="flex items-center gap-2">
                  <select
                    value={reminder.minutes}
                    onChange={(e) => handleReminderChange(index, 'minutes', parseInt(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={0}>At time of event</option>
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                    <option value={60}>1 hour before</option>
                    <option value={120}>2 hours before</option>
                    <option value={1440}>1 day before</option>
                  </select>
                  <button
                    onClick={() => handleRemoveReminder(index)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Description</span>
            </div>
            <textarea
              value={editedEvent.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Add description"
              rows={4}
              className="w-full ml-7 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Linked Documents, Contacts, and Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Attached Items</span>
              </div>
              <button
                onClick={() => {
                  setShowLinkMenu(!showLinkMenu);
                  setLinkingType(null);
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {/* Linked Documents */}
            {linkedDocuments.length > 0 && (
              <div className="ml-7 space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase">Documents</div>
                {linkedDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm flex-1">{doc.name || 'Document'}</span>
                    <button
                      onClick={() => handleUnlinkEntity('document', doc.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Linked Contacts */}
            {linkedContacts.length > 0 && (
              <div className="ml-7 space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase">Contacts</div>
                {linkedContacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="text-sm flex-1">{contact.name || 'Contact'}</span>
                    <button
                      onClick={() => handleUnlinkEntity('contact', contact.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Linked Tasks */}
            {linkedTasks.length > 0 && (
              <div className="ml-7 space-y-2">
                <div className="text-xs font-medium text-gray-500 uppercase">Tasks</div>
                {linkedTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <CheckSquare className="w-4 h-4 text-purple-600" />
                    <span className="text-sm flex-1">{task.title || 'Task'}</span>
                    <button
                      onClick={() => handleUnlinkEntity('task', task.id)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Link Type Selection */}
            {showLinkMenu && !linkingType && (
              <div className="ml-7 space-y-2">
                <button
                  onClick={() => setLinkingType('document')}
                  className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Attach Document/Email</span>
                </button>
                <button
                  onClick={() => setLinkingType('contact')}
                  className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <User className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Link Contact</span>
                </button>
                <button
                  onClick={() => setLinkingType('task')}
                  className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <CheckSquare className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Link Task</span>
                </button>
              </div>
            )}

            {/* Document Browser */}
            {linkingType === 'document' && (
              <div className="ml-7">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Select Document</span>
                  <button
                    onClick={() => { setLinkingType(null); setShowLinkMenu(false); }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                  {availableDocuments.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        handleLinkEntity('document', doc.id, doc);
                        setLinkingType(null);
                      }}
                      className="w-full p-2 hover:bg-gray-50 rounded flex items-center gap-2 text-left"
                    >
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">{doc.name}</div>
                        <div className="text-xs text-gray-500">From: {doc.from}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Browser */}
            {linkingType === 'contact' && (
              <div className="ml-7">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Select Contact</span>
                  <button
                    onClick={() => { setLinkingType(null); setShowLinkMenu(false); }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                  {availableContacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        handleLinkEntity('contact', contact.id, contact);
                        setLinkingType(null);
                      }}
                      className="w-full p-2 hover:bg-gray-50 rounded flex items-center gap-2 text-left"
                    >
                      <User className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">{contact.name}</div>
                        {contact.title && (
                          <div className="text-xs text-gray-500">{contact.title}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Task Browser */}
            {linkingType === 'task' && (
              <div className="ml-7">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Select Task</span>
                  <button
                    onClick={() => { setLinkingType(null); setShowLinkMenu(false); }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                  {availableTasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => {
                        handleLinkEntity('task', task.id, task);
                        setLinkingType(null);
                      }}
                      className="w-full p-2 hover:bg-gray-50 rounded flex items-center gap-2 text-left"
                    >
                      <CheckSquare className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-900 truncate">{task.title}</div>
                        <div className="text-xs text-gray-500">Status: {task.status}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />

          {/* Comments - Tag @allie or family members */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Comments</span>
            </div>

            {/* Comment input */}
            <div className="relative ml-7">
              <textarea
                ref={commentInputRef}
                value={commentText}
                onChange={handleCommentChange}
                placeholder="Add a comment... (use @allie or @mention family)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />

              {/* Mention dropdown */}
              {showMentions && filteredMembers.length > 0 && (
                <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredMembers.map((member, index) => (
                    <button
                      key={member.id}
                      onClick={() => handleMentionSelect(member)}
                      className={`w-full px-3 py-2 text-left flex items-center gap-2 hover:bg-gray-50 ${
                        index === selectedMentionIndex ? 'bg-blue-50' : ''
                      }`}
                    >
                      <UserAvatar user={member} size={24} />
                      <span className="text-sm">{member.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleAddComment}
                disabled={!commentText.trim() || isAddingComment}
                className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isAddingComment ? 'Adding...' : 'Add Comment'}
              </button>
            </div>
          </div>

          {/* Event metadata */}
          {event.createdAt && (
            <div className="ml-7 text-xs text-gray-400 flex items-center gap-1 mt-4">
              <Clock className="w-3 h-3" />
              Created {new Date(event.createdAt.toDate ? event.createdAt.toDate() : event.createdAt).toLocaleDateString()}
              {event.source && event.source !== 'manual' && ` from ${event.source}`}
            </div>
          )}
        </div>

        {/* Save Button and Saving indicator */}
        <div className="px-6 py-3 border-t border-gray-200 bg-white">
          {isSaving ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4 animate-pulse" />
              <span>Saving...</span>
            </div>
          ) : (
            <button
              onClick={handleSave}
              data-testid="save-event-button"
              disabled={!editedEvent.title?.trim() || isSaving}
              className="w-full px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {event?.id ? 'Save' : 'Create Event'}
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default EventDrawer;
