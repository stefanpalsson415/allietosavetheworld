import React, { useEffect, useRef, useState } from 'react';
import { X, Calendar, User, Tag, MessageSquare, Edit2, Save, AlertCircle, Clock, Users, CheckSquare, Plus, Trash2, Square, CheckSquare2, FileText, Link as LinkIcon } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, addDoc, collection, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';
import AllieChat from '../chat/refactored/AllieChat';
import messageService from '../../services/MessageService';
import { useNavigate } from 'react-router-dom';

const DRAWER_WIDTH = '480px';

const TaskDrawer = ({ isOpen, onClose, task, onUpdate }) => {
  const drawerRef = useRef(null);
  const navigate = useNavigate();
  const { familyMembers = [], familyId, selectedUser } = useFamily();
  const [isEditing, setIsEditing] = useState(true); // Always in edit mode like Notion
  const [editedTask, setEditedTask] = useState(task || {});
  const [isSaving, setIsSaving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const commentInputRef = useRef(null);
  const taskIdRef = useRef(null);

  // Contact/Document linking state
  const [linkedDocuments, setLinkedDocuments] = useState([]);
  const [linkedContacts, setLinkedContacts] = useState([]);
  const [showLinkMenu, setShowLinkMenu] = useState(false);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [availableContacts, setAvailableContacts] = useState([]);
  const [linkingType, setLinkingType] = useState(null); // 'document' or 'contact'

  // Update editedTask when task prop changes (but only if task ID changed, not on every Firestore update)
  useEffect(() => {
    if (task && task.id !== taskIdRef.current) {
      // New task opened, reset editedTask
      setEditedTask(task);
      setIsEditing(true);
      taskIdRef.current = task.id;

      // Load linked entities
      setLinkedDocuments(task.linkedDocuments || []);
      setLinkedContacts(task.linkedContacts || []);
    }
  }, [task]);

  // Handle extracted contacts from smart extraction
  useEffect(() => {
    const handleExtractedContacts = async () => {
      if (!task?.extractedContacts || task.extractedContacts.length === 0 || !familyId) return;

      console.log('📋 Processing extracted contacts:', task.extractedContacts);

      const newContacts = [];
      for (const contactName of task.extractedContacts) {
        // Check if contact already exists
        const contactsQuery = query(
          collection(db, 'familyContacts'),
          where('familyId', '==', familyId),
          where('name', '==', contactName)
        );

        const existing = await getDocs(contactsQuery);

        if (existing.empty) {
          // Create new contact
          try {
            const newContact = {
              name: contactName,
              familyId: familyId,
              type: 'general',
              createdAt: serverTimestamp(),
              createdFrom: task.inboxItemType || 'task'
            };

            const docRef = await addDoc(collection(db, 'familyContacts'), newContact);
            console.log(`✅ Created contact: ${contactName} with ID ${docRef.id}`);

            newContacts.push({ id: docRef.id, name: contactName });
          } catch (error) {
            console.error('Error creating contact:', error);
          }
        } else {
          // Contact exists, just link it
          const existingContact = { id: existing.docs[0].id, name: existing.docs[0].data().name };
          newContacts.push(existingContact);
          console.log(`📎 Linking existing contact: ${contactName}`);
        }
      }

      // Add all new/existing contacts to linked contacts
      if (newContacts.length > 0) {
        setLinkedContacts(prev => [...prev, ...newContacts]);
      }
    };

    if (task?.extractedContacts) {
      handleExtractedContacts();
    }
  }, [task?.extractedContacts, familyId]);

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
        }
      } catch (error) {
        console.error('Error loading available items:', error);
      }
    };

    loadAvailableItems();
  }, [linkingType, familyId]);

  // Close on Escape key and handle click outside for mentions
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape key handling
      if (e.key === 'Escape' && isOpen) {
        if (showMentions) {
          setShowMentions(false);
        } else {
          onClose();
        }
      }
      
      // Cmd/Ctrl + Enter to save task
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && isOpen) {
        if (task?.isNew && editedTask.title && editedTask.title.trim()) {
          handleSave().then(() => onClose());
        } else if (!task?.isNew) {
          handleSave();
        }
      }
    };

    const handleClickOutside = (e) => {
      if (showMentions && commentInputRef.current && !commentInputRef.current.contains(e.target)) {
        setShowMentions(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, showMentions]);

  // Log state changes
  useEffect(() => {
    console.log('TaskDrawer isOpen changed to:', isOpen);
    console.log('TaskDrawer task:', task);
  }, [isOpen, task]);

  // Auto-save when editedTask changes (with debounce) - FIXED: Specific dependencies to prevent infinite loop
  useEffect(() => {
    // Don't auto-save for new tasks - wait for explicit save
    if (task?.isNew || !task?.id) {
      return;
    }

    // Don't auto-save if drawer is closed or if task has no title
    if (!isOpen || !editedTask.title || !editedTask.title.trim()) {
      return;
    }

    // Don't auto-save while user is adding a comment
    if (isAddingComment || isSaving) {
      return;
    }

    // Only auto-save for existing tasks (updates)
    // Debounce the save - increased to 3 seconds
    const timeoutId = setTimeout(() => {
      if (!isAddingComment && !isSaving) {
        handleSave();
      }
    }, 3000); // Save after 3 seconds of no changes for existing tasks

    return () => clearTimeout(timeoutId);
  }, [
    // ✅ SPECIFIC dependencies instead of entire editedTask object
    editedTask.title,
    editedTask.description,
    editedTask.priority,
    editedTask.column,
    editedTask.dueDate,
    JSON.stringify(editedTask.assignedTo),  // Convert array to string for comparison
    JSON.stringify(editedTask.subtasks),
    isOpen,
    isAddingComment,
    isSaving
  ]);
  
  // Save function - handles both create and update
  const handleSave = async () => {
    // Don't save if title is empty
    if (!editedTask.title || !editedTask.title.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      if (task?.isNew || !task?.id) {
        // Create new task
        const newTask = {
          title: editedTask.title,
          description: editedTask.description || '',
          priority: editedTask.priority || 'medium',
          column: editedTask.column || editedTask.status || 'backlog',
          dueDate: editedTask.dueDate || null,
          assignedTo: Array.isArray(editedTask.assignedTo) ? editedTask.assignedTo : [],
          subtasks: editedTask.subtasks || [],
          comments: editedTask.comments || [],
          linkedDocuments: linkedDocuments || [],  // ✅ Include linked documents
          linkedContacts: linkedContacts || [],    // ✅ Include linked contacts
          sourceInboxId: task.inboxItemId || null, // ✅ Store source reference
          sourceInboxType: task.inboxItemType || null,
          familyId: familyId,
          createdBy: selectedUser?.id || familyMembers[0]?.id || null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          completed: false,
          fromAllie: false,
          status: 'active',
          position: Date.now()
        };

        const docRef = await addDoc(collection(db, 'kanbanTasks'), newTask);
        console.log('Task created successfully with ID:', docRef.id);

        if (onUpdate) {
          onUpdate({ ...newTask, id: docRef.id });
        }

        // Don't automatically close drawer after creating - let user decide
        // User can close with X button or Escape key
        // if (onClose) {
        //   onClose();
        // }
      } else {
        // Update existing task
        const updates = {
          title: editedTask.title,
          description: editedTask.description || '',
          priority: editedTask.priority || 'medium',
          column: editedTask.column || editedTask.status || 'backlog',
          dueDate: editedTask.dueDate || null,
          assignedTo: Array.isArray(editedTask.assignedTo) ? editedTask.assignedTo : [],
          subtasks: editedTask.subtasks || [],
          comments: editedTask.comments || [],
          linkedDocuments: linkedDocuments || [],  // ✅ Include linked documents
          linkedContacts: linkedContacts || [],    // ✅ Include linked contacts
          updatedAt: serverTimestamp()
        };

        await updateDoc(doc(db, 'kanbanTasks', task.id), updates);

        if (onUpdate) {
          onUpdate({ ...task, ...updates });
        }

        console.log('Task updated successfully');
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Failed to save task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Helper functions
  const formatColumn = (column) => {
    const columnNames = {
      'backlog': 'Backlog',
      'this-week': 'This Week',
      'today': 'Today',
      'in-progress': 'In Progress',
      'done': 'Done',
      'todo': 'To Do'
    };
    return columnNames[column] || column;
  };
  
  const formatDate = (date) => {
    if (!date) return '';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Link/Unlink entity functions
  const handleLinkEntity = (entityType, entityId, entityData) => {
    if (entityType === 'document') {
      if (!linkedDocuments.find(d => d.id === entityId)) {
        setLinkedDocuments([...linkedDocuments, { id: entityId, ...entityData }]);
      }
    } else if (entityType === 'contact') {
      if (!linkedContacts.find(c => c.id === entityId)) {
        setLinkedContacts([...linkedContacts, { id: entityId, ...entityData }]);
      }
    }
    setShowLinkMenu(false);
  };

  const handleUnlinkEntity = (entityType, entityId) => {
    if (entityType === 'document') {
      setLinkedDocuments(linkedDocuments.filter(d => d.id !== entityId));
    } else if (entityType === 'contact') {
      setLinkedContacts(linkedContacts.filter(c => c.id !== entityId));
    }
  };

  // Navigate to source inbox item
  const handleNavigateToSource = () => {
    if (task.sourceInboxId || task.inboxItemId) {
      // Close drawer first
      onClose();
      // Navigate to Document Hub and highlight the item
      navigate('/inbox', {
        state: {
          highlightItemId: task.sourceInboxId || task.inboxItemId
        }
      });
    }
  };

  return (
    <div
      ref={drawerRef}
      className="fixed top-0 right-0 z-50 h-screen bg-white shadow-xl border-l border-gray-200 flex flex-col"
      style={{
        width: DRAWER_WIDTH,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 300ms ease-in-out',
      }}
    >
      {/* Header */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4">
        <h3 className="text-base font-medium text-gray-900">
          {task?.isNew ? 'New Task' : 'Task Details'}
        </h3>
        <div className="flex items-center gap-2">
          {/* Show Create Task button for new tasks */}
          {task?.isNew && (
            <button
              onClick={async () => {
                if (editedTask.title && editedTask.title.trim()) {
                  await handleSave();
                  onClose();
                }
              }}
              disabled={!editedTask.title || !editedTask.title.trim()}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                editedTask.title && editedTask.title.trim()
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Create Task
            </button>
          )}
          <button 
            className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {task ? (
          <>
            {/* Task Info Section */}
            <div className="p-6 border-b border-gray-200">
              {/* Title - Always Editable */}
              <div className="mb-4">
                <input
                  type="text"
                  value={editedTask.title || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="w-full text-xl font-semibold text-gray-900 border-0 outline-none p-0 placeholder-gray-400"
                  placeholder="Task title"
                  autoFocus
                />
                {task?.isNew && (
                  <p className="text-xs text-gray-400 mt-1">
                    Press {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter to create task
                  </p>
                )}
              </div>
              
              {/* Description - Always Editable */}
              <textarea
                value={editedTask.description || ''}
                onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded-lg mb-4 outline-none focus:border-blue-500 resize-none"
                placeholder="Add a description..."
                rows={3}
              />

              <div className="space-y-3">
                {/* Priority */}
                <div className="flex items-center gap-3">
                  <AlertCircle size={16} className={`${
                    editedTask.priority === 'high' ? 'text-red-500' : 
                    editedTask.priority === 'low' ? 'text-green-500' : 
                    'text-yellow-500'
                  }`} />
                  <span className="text-sm text-gray-600">Priority:</span>
                  <select
                    value={editedTask.priority || 'medium'}
                    onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value })}
                    className="text-sm font-medium capitalize border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                {/* Status/Column */}
                <div className="flex items-center gap-3">
                  <CheckSquare size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Column:</span>
                  <select
                    value={editedTask.column || editedTask.status || 'backlog'}
                    onChange={(e) => setEditedTask({ ...editedTask, column: e.target.value })}
                    className="text-sm font-medium border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                  >
                    <option value="backlog">Backlog</option>
                    <option value="this-week">This Week</option>
                    <option value="today">Today</option>
                    <option value="in-progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                {/* Due Date */}
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <input
                    type="date"
                    value={editedTask.dueDate || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
                    className="text-sm font-medium border border-gray-300 rounded px-2 py-1 outline-none focus:border-blue-500"
                  />
                </div>

                {/* Assigned To */}
                <div className="flex items-start gap-3">
                  <Users size={16} className="text-gray-400 mt-1" />
                  <span className="text-sm text-gray-600 mt-0.5">Assigned to:</span>
                  <div className="flex-1">
                    <div className="space-y-2">
                      {(familyMembers || []).map(member => (
                        <label key={member.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={Array.isArray(editedTask.assignedTo) && editedTask.assignedTo.includes(member.id)}
                            onChange={(e) => {
                              const currentAssigned = Array.isArray(editedTask.assignedTo) ? editedTask.assignedTo : [];
                              if (e.target.checked) {
                                setEditedTask({ 
                                  ...editedTask, 
                                  assignedTo: [...currentAssigned, member.id]
                                });
                              } else {
                                setEditedTask({ 
                                  ...editedTask, 
                                  assignedTo: currentAssigned.filter(id => id !== member.id)
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <UserAvatar user={member} size={20} />
                          <span className="text-sm">{member.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Source Info - CLICKABLE */}
                {(task.source || task.sourceInboxId || task.inboxItemId) && (
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Clock size={16} className="text-gray-400" />
                    {(task.sourceInboxId || task.inboxItemId) ? (
                      <button
                        onClick={handleNavigateToSource}
                        className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Created from {task.source || task.inboxItemType || 'email-ai'}
                        {task.createdAt && ` on ${formatDate(task.createdAt.toDate ? task.createdAt.toDate() : task.createdAt)}`}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500">
                        Created from {task.source}
                        {task.createdAt && ` on ${formatDate(task.createdAt.toDate ? task.createdAt.toDate() : task.createdAt)}`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Linked Documents and Contacts - SIMILAR TO EventDrawer */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <LinkIcon size={16} className="text-gray-400" />
                  Attached Items
                </h4>
                <button
                  onClick={() => {
                    setShowLinkMenu(!showLinkMenu);
                    setLinkingType(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus size={14} />
                  Add
                </button>
              </div>

              {/* Linked Contacts */}
              {linkedContacts.length > 0 && (
                <div className="space-y-2 mb-3">
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

              {/* Linked Documents */}
              {linkedDocuments.length > 0 && (
                <div className="space-y-2">
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

              {/* Link Type Selection */}
              {showLinkMenu && !linkingType && (
                <div className="space-y-2 mt-2">
                  <button
                    onClick={() => setLinkingType('contact')}
                    className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <User className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">Link Contact</span>
                  </button>
                  <button
                    onClick={() => setLinkingType('document')}
                    className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Attach Document/Email</span>
                  </button>
                </div>
              )}

              {/* Contact Browser */}
              {linkingType === 'contact' && (
                <div className="mt-2">
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

              {/* Document Browser */}
              {linkingType === 'document' && (
                <div className="mt-2">
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
            </div>

            {/* Subtasks/Checklist Section */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <CheckSquare2 size={16} className="text-gray-400" />
                    Checklist
                  </h4>
                  <button
                    onClick={() => {
                      const newSubtask = {
                        id: Date.now().toString(),
                        text: '',
                        completed: false
                      };
                      setEditedTask({
                        ...editedTask,
                        subtasks: [...(editedTask.subtasks || []), newSubtask]
                      });
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Add item
                  </button>
                </div>
                <div className="space-y-2">
                  {(editedTask.subtasks || []).map((subtask, index) => (
                    <div key={subtask.id || index} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={subtask.completed || false}
                        onChange={(e) => {
                          const updatedSubtasks = [...(editedTask.subtasks || [])];
                          updatedSubtasks[index] = { ...subtask, completed: e.target.checked };
                          setEditedTask({ ...editedTask, subtasks: updatedSubtasks });
                        }}
                        className="rounded"
                      />
                      <input
                        type="text"
                        value={subtask.text || ''}
                        onChange={(e) => {
                          const updatedSubtasks = [...(editedTask.subtasks || [])];
                          updatedSubtasks[index] = { ...subtask, text: e.target.value };
                          setEditedTask({ ...editedTask, subtasks: updatedSubtasks });
                        }}
                        className="flex-1 text-sm border-b border-gray-300 outline-none focus:border-blue-500"
                        placeholder="Checklist item"
                      />
                      <button
                        onClick={() => {
                          const updatedSubtasks = (editedTask.subtasks || []).filter((_, i) => i !== index);
                          setEditedTask({ ...editedTask, subtasks: updatedSubtasks });
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>


            {/* Activity History */}
            {task.activityHistory && task.activityHistory.length > 0 && (
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3">
                  <Clock size={16} className="text-gray-400" />
                  Activity History
                </h4>
                <div className="space-y-2 text-xs text-gray-500">
                  {task.activityHistory.slice(0, 5).map((activity, index) => (
                    <div key={index}>
                      {activity.action} by {activity.userName} • {formatDate(activity.timestamp)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Combined Chat Section */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center mb-3">
                <MessageSquare size={16} className="text-gray-400 mr-2" />
                <h4 className="text-sm font-medium text-gray-700">Chat with Allie or your family about this task</h4>
              </div>
              <div className="space-y-3 mb-4">
                {/* Show existing comments */}
                {(editedTask.comments || []).map((comment, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {comment.userId === 'allie' ? (
                        <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">
                          A
                        </div>
                      ) : (
                        <UserAvatar 
                          user={familyMembers.find(m => m.id === comment.userId)} 
                          size={24} 
                        />
                      )}
                      <span className="text-sm font-medium">
                        {comment.userId === 'allie' ? 'Allie' : familyMembers.find(m => m.id === comment.userId)?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {comment.timestamp && new Date(comment.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 ml-8">
                      {comment.isThinking ? (
                        <span className="text-gray-400 italic">Thinking...</span>
                      ) : (
                        comment.text.split(/(@\w+)/).map((part, index) => 
                          part.startsWith('@') ? (
                            <span key={index} className="text-blue-600 font-medium">{part}</span>
                          ) : (
                            <span key={index}>{part}</span>
                          )
                        )
                      )}
                    </p>
                  </div>
                ))}
              </div>
              {/* Add comment input with @ mentions */}
              <div className="relative">
                <input
                  ref={commentInputRef}
                  type="text"
                  value={commentText}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setCommentText(newValue);
                    
                    // Check if user is typing @ mention
                    const lastAtIndex = newValue.lastIndexOf('@');
                    
                    if (lastAtIndex === -1) {
                      // No @ symbol, hide mentions
                      setShowMentions(false);
                      setMentionSearch('');
                    } else {
                      // Check if @ is the most recent character or if we're still typing after @
                      const textAfterAt = newValue.slice(lastAtIndex + 1);
                      
                      // Show mentions if:
                      // 1. @ was just typed (nothing after it)
                      // 2. Still typing after @ without a space
                      if (!textAfterAt.includes(' ')) {
                        setShowMentions(true);
                        setMentionSearch(textAfterAt);
                        setSelectedMentionIndex(0); // Reset selection when showing
                      } else {
                        // Space found after @, hide mentions
                        setShowMentions(false);
                        setMentionSearch('');
                      }
                    }
                  }}
                  placeholder="Add a comment... (use @ to mention)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (showMentions) {
                      const allMentionOptions = [
                        { id: 'allie', name: 'Allie' },
                        ...familyMembers.filter(member => 
                          !mentionSearch || 
                          member.name.toLowerCase().includes(mentionSearch.toLowerCase())
                        )
                      ];
                      
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSelectedMentionIndex(prev => 
                          Math.min(prev + 1, allMentionOptions.length - 1)
                        );
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSelectedMentionIndex(prev => Math.max(prev - 1, 0));
                      } else if (e.key === 'Enter' || e.key === 'Tab') {
                        e.preventDefault();
                        const selected = allMentionOptions[selectedMentionIndex];
                        if (selected) {
                          const lastAtIndex = commentText.lastIndexOf('@');
                          const newText = commentText.slice(0, lastAtIndex) + '@' + selected.name + ' ';
                          setCommentText(newText);
                          setShowMentions(false);
                          setSelectedMentionIndex(0);
                        }
                      } else if (e.key === 'Escape') {
                        setShowMentions(false);
                        setSelectedMentionIndex(0);
                      }
                    }
                  }}
                  onKeyPress={async (e) => {
                    if (e.key === 'Enter' && commentText.trim() && !showMentions) {
                      // Mark that we're adding a comment to prevent auto-save conflicts
                      setIsAddingComment(true);

                      const currentUserId = selectedUser?.id || familyMembers[0]?.id;
                      const currentUserName = selectedUser?.name || familyMembers[0]?.name || 'Someone';

                      const newComment = {
                        text: commentText,
                        userId: currentUserId,
                        timestamp: new Date().toISOString()
                      };
                      const updatedComments = [...(editedTask.comments || []), newComment];
                      setEditedTask({ ...editedTask, comments: updatedComments });

                      // Save immediately with the new comment
                      await handleSave();

                      // Check for @mentions and create notifications
                      const mentionRegex = /@(\w+)/g;
                      const mentions = commentText.match(mentionRegex);
                      if (mentions && mentions.length > 0) {
                        // Find mentioned family members
                        mentions.forEach(async (mention) => {
                          const mentionedName = mention.substring(1); // Remove @
                          const mentionedMember = familyMembers.find(m =>
                            m.name && m.name.toLowerCase() === mentionedName.toLowerCase()
                          );

                          if (mentionedMember && mentionedMember.id !== currentUserId) {
                            // Create notification message for the mentioned user
                            try {
                              await messageService.sendMessage({
                                content: `${currentUserName} mentioned you in a comment on task "${editedTask.title}": ${commentText}`,
                                userId: currentUserId,
                                userName: currentUserName,
                                familyId: familyId,
                                mentions: [mentionedMember.id],
                                priority: 'high',
                                requiresAction: true,
                                aiContext: {
                                  type: 'task_mention',
                                  taskId: task.id,
                                  taskTitle: editedTask.title,
                                  comment: commentText
                                }
                              });
                            } catch (error) {
                              console.error('Error creating mention notification:', error);
                            }
                          }
                        });
                      }

                      // Check if @Allie was mentioned
                      if (commentText.includes('@Allie')) {
                        // Add a placeholder comment for Allie's response
                        const allieThinking = {
                          text: '...',
                          userId: 'allie',
                          timestamp: new Date().toISOString(),
                          isThinking: true
                        };
                        setEditedTask({ 
                          ...editedTask, 
                          comments: [...updatedComments, allieThinking] 
                        });
                        
                        // Process the comment with Allie
                        try {
                          // Extract the question/request for Allie
                          const allieQuery = commentText.replace('@Allie', '').trim();
                          
                          // Here we would normally call an AI service, but for now let's simulate
                          setTimeout(() => {
                            let responseText = '';
                            
                            // Check different types of requests
                            if (allieQuery.toLowerCase().includes('dad joke') || allieQuery.toLowerCase().includes('joke')) {
                              const jokes = [
                                "Why don't scientists trust atoms? Because they make up everything!",
                                "Did you hear about the cheese factory that exploded? There was nothing left but de-brie!",
                                "Why did the scarecrow win an award? He was outstanding in his field!",
                                "I used to hate facial hair, but then it grew on me.",
                                "Why don't eggs tell jokes? They'd crack each other up!"
                              ];
                              responseText = jokes[Math.floor(Math.random() * jokes.length)] + "\n\n😄 Hope that brightened your day!";
                            } else if (allieQuery.toLowerCase().includes('food') && (allieQuery.toLowerCase().includes('gas') || allieQuery.toLowerCase().includes('eat'))) {
                              // Food/diet related questions
                              responseText = `Common foods that can cause gas include:\n\n• Beans and lentils (high in fiber and complex sugars)\n• Cruciferous vegetables (broccoli, cauliflower, cabbage)\n• Dairy products (if lactose intolerant)\n• Carbonated beverages\n• Onions and garlic\n• Whole grains\n• Artificial sweeteners (sorbitol, xylitol)\n\nTry keeping a food diary to identify your specific triggers. Eating smaller meals and chewing slowly can also help! 🥗`;
                            } else if (allieQuery.toLowerCase().includes('help') && allieQuery.toLowerCase().includes('task')) {
                              // Specific help with the task
                              responseText = `I'd be happy to help with the task "${editedTask.title}". Here are some suggestions:\n\n1. Break down the task into smaller steps\n2. Set a specific timeline for completion\n3. Consider any dependencies or blockers\n\nWould you like me to create subtasks for this?`;
                            } else if (allieQuery.toLowerCase().includes('how') || allieQuery.toLowerCase().includes('what') || allieQuery.toLowerCase().includes('can you')) {
                              // General questions - try to be helpful based on context
                              if (allieQuery.toLowerCase().includes('paint')) {
                                responseText = `For painting a house, here are 3 key things:\n\n1. **Preparation** - Clean surfaces, fill holes, sand rough spots, and prime\n2. **Quality materials** - Use good brushes/rollers and appropriate paint for the surface\n3. **Weather timing** - Paint when it's dry, not too hot/cold (50-85°F is ideal)\n\nPro tip: Don't skip the prep work - it makes all the difference! 🎨`;
                              } else {
                                // For other general questions, provide a contextual response
                                responseText = `I understand you're asking: "${allieQuery}"\n\nI'd be happy to help! Could you provide a bit more context about what you're looking for? In the meantime, is there anything specific about the task "${editedTask.title}" I can assist with?`;
                              }
                            } else {
                              // Default response for unrecognized queries
                              responseText = `Thanks for the message! "${allieQuery}"\n\nI'm here to help with various things:\n• Task management and organization\n• General questions and advice\n• Dad jokes (just ask!)\n• Or anything specific about "${editedTask.title}"\n\nWhat would you like help with?`;
                            }
                            
                            const allieResponse = {
                              text: responseText,
                              userId: 'allie',
                              timestamp: new Date().toISOString()
                            };
                            
                            // Replace thinking comment with actual response
                            setEditedTask(prev => ({
                              ...prev,
                              comments: prev.comments.filter(c => !c.isThinking).concat(allieResponse)
                            }));
                          }, 1500); // Simulate AI processing time
                        } catch (error) {
                          console.error('Error processing Allie mention:', error);
                        }
                      }

                      setCommentText('');
                      setIsAddingComment(false);
                    }
                  }}
                />
                
                {/* @ Mention dropdown */}
                {showMentions && (() => {
                  const filteredMembers = familyMembers.filter(member => 
                    !mentionSearch || 
                    member.name.toLowerCase().includes(mentionSearch.toLowerCase())
                  );
                  const allOptions = [
                    { id: 'allie', name: 'Allie', isAllie: true },
                    ...filteredMembers
                  ];
                  
                  return (
                    <div className="absolute bottom-full mb-1 left-0 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto z-50">
                      <div className="p-2">
                        <div className="text-xs text-gray-500 font-medium mb-2">Mention someone</div>
                        {allOptions.map((option, index) => (
                          <button
                            key={option.id}
                            onMouseDown={(e) => {
                              e.preventDefault(); // Prevent input blur
                              const lastAtIndex = commentText.lastIndexOf('@');
                              const newText = commentText.slice(0, lastAtIndex) + '@' + option.name + ' ';
                              setCommentText(newText);
                              setShowMentions(false);
                              setSelectedMentionIndex(0);
                              setTimeout(() => commentInputRef.current?.focus(), 0);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded flex items-center gap-2 transition-colors ${
                              index === selectedMentionIndex 
                                ? 'bg-blue-100 text-blue-900' 
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {option.isAllie ? (
                              <div className="w-6 h-6 bg-purple-200 rounded-full flex items-center justify-center text-xs font-bold text-purple-700">
                                A
                              </div>
                            ) : (
                              <UserAvatar user={option} size={24} />
                            )}
                            <span className="text-sm">
                              {option.name}
                              {option.isAllie && ' (AI Assistant)'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

          </>
        ) : (
          <div className="p-6 text-center text-gray-500">
            No task selected
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDrawer;