// src/components/kanban/TaskDetailModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Calendar, User, Flag, Tag, MessageSquare, 
  Send, Edit2, Check, Clock, Paperclip, Image,
  MoreVertical, Trash2, Archive, Copy, Sparkles,
  CheckSquare, Square, Plus, Users, FileText,
  Upload, Link, ChevronDown, ChevronUp
} from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import UserAvatar from '../common/UserAvatar';
import { doc, updateDoc, deleteDoc, serverTimestamp, onSnapshot, arrayUnion, arrayRemove, collection, getDocs, query, where, limit, deleteField } from 'firebase/firestore';
import { db, storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ClaudeService from '../../services/ClaudeService';
import eventStore from '../../services/EventStore';

const TaskDetailModal = ({ task, isOpen, onClose, onUpdate, onDelete }) => {
  const { familyMembers } = useFamily();
  const { currentUser } = useAuth();
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [category, setCategory] = useState(task.category || 'general');
  const [comments, setComments] = useState(task.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isAskingAllie, setIsAskingAllie] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionCursorPosition, setMentionCursorPosition] = useState(null);
  
  // New states for Trello-like features
  const [checklists, setChecklists] = useState(task.checklists || []);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [labels, setLabels] = useState(task.labels || []);
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [members, setMembers] = useState(task.members || [task.assignedTo].filter(Boolean));
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [familyDocuments, setFamilyDocuments] = useState([]);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeChecklistItem, setActiveChecklistItem] = useState(null);
  const [showChecklistItemMenu, setShowChecklistItemMenu] = useState(null);
  
  const modalRef = useRef(null);
  const commentInputRef = useRef(null);
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  // Priority options
  const priorityOptions = [
    { value: 'high', label: 'High Priority', color: 'text-red-600 bg-red-50' },
    { value: 'medium', label: 'Medium Priority', color: 'text-yellow-600 bg-yellow-50' },
    { value: 'low', label: 'Low Priority', color: 'text-green-600 bg-green-50' }
  ];

  // Category options
  const categoryOptions = [
    { value: 'household', label: 'Household', icon: '🏠' },
    { value: 'parenting', label: 'Parenting', icon: '👨‍👩‍👧‍👦' },
    { value: 'work', label: 'Work', icon: '💼' },
    { value: 'personal', label: 'Personal', icon: '👤' },
    { value: 'errands', label: 'Errands', icon: '🚗' },
    { value: 'health', label: 'Health', icon: '🏥' },
    { value: 'general', label: 'General', icon: '📋' }
  ];
  
  // Label options (Trello-style)
  const labelOptions = [
    { id: 'green', color: 'bg-green-500', name: 'Done' },
    { id: 'yellow', color: 'bg-yellow-500', name: 'In Progress' },
    { id: 'orange', color: 'bg-orange-500', name: 'Important' },
    { id: 'red', color: 'bg-red-500', name: 'Urgent' },
    { id: 'purple', color: 'bg-purple-500', name: 'Review' },
    { id: 'blue', color: 'bg-blue-500', name: 'Information' },
    { id: 'pink', color: 'bg-pink-500', name: 'Personal' },
    { id: 'gray', color: 'bg-gray-500', name: 'Low Priority' }
  ];

  // Real-time sync for comments and other data
  useEffect(() => {
    if (!task.id || !isOpen) return;

    const unsubscribe = onSnapshot(doc(db, "kanbanTasks", task.id), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setComments(data.comments || []);
        setChecklists(data.checklists || []);
        setAttachments(data.attachments || []);
        setLabels(data.labels || []);
        setMembers(data.members || [data.assignedTo].filter(Boolean));
      }
    });

    return () => unsubscribe();
  }, [task.id, isOpen]);
  
  // Load family documents from Document Hub
  useEffect(() => {
    const loadFamilyDocuments = async () => {
      try {
        const docsQuery = query(
          collection(db, 'familyDocuments'),
          where('familyId', '==', task.familyId),
          limit(20)
        );
        const snapshot = await getDocs(docsQuery);
        const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setFamilyDocuments(docs);
      } catch (error) {
        console.error('Error loading family documents:', error);
      }
    };
    
    if (isOpen && task.familyId) {
      loadFamilyDocuments();
    }
  }, [isOpen, task.familyId]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Save changes
  const saveChanges = async (updates) => {
    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      // Handle calendar sync for date changes
      if (updates.dueDate !== undefined) {
        await handleCalendarSync(updates.dueDate);
      }
      
      if (onUpdate) onUpdate({ ...task, ...updates });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };
  
  // Handle calendar sync
  const handleCalendarSync = async (newDueDate) => {
    try {
      // Make sure we have a current user
      if (!currentUser?.uid) {
        console.warn("Cannot sync calendar without authenticated user");
        return;
      }

      if (newDueDate && !task.calendarEventId) {
        // Create new calendar event
        const eventData = {
          title: `Task: ${task.title}`,
          start: { dateTime: new Date(newDueDate).toISOString() },
          end: { dateTime: new Date(newDueDate).toISOString() },
          allDay: true,
          category: 'task',
          relatedTaskId: task.id,
          description: task.description || '',
          attendees: members || [],
          familyId: task.familyId
        };
        
        const event = await eventStore.addEvent(eventData, currentUser.uid);
        
        // Only update if we got a valid event ID
        if (event?.id) {
          await updateDoc(doc(db, "kanbanTasks", task.id), {
            calendarEventId: event.id
          });
          console.log('✅ Calendar event created:', event.id);
        }
      } else if (newDueDate && task.calendarEventId) {
        // Update existing calendar event
        await eventStore.updateEvent(task.calendarEventId, {
          start: { dateTime: new Date(newDueDate).toISOString() },
          end: { dateTime: new Date(newDueDate).toISOString() },
          attendees: members || []
        }, currentUser.uid);
        console.log('✅ Calendar event updated');
      } else if (!newDueDate && task.calendarEventId) {
        // Remove calendar event if date is removed
        await eventStore.deleteEvent(task.calendarEventId, currentUser.uid);
        // Use deleteField to properly remove the field
        await updateDoc(doc(db, "kanbanTasks", task.id), {
          calendarEventId: deleteField()
        });
        console.log('✅ Calendar event removed');
      }
    } catch (error) {
      console.error("Error syncing with calendar:", error);
    }
  };

  // Handle title save
  const handleTitleSave = () => {
    if (title.trim() && title !== task.title) {
      saveChanges({ title: title.trim() });
    }
    setEditingTitle(false);
  };

  // Handle description save
  const handleDescriptionSave = () => {
    if (description !== task.description) {
      saveChanges({ description: description.trim() });
    }
    setEditingDescription(false);
  };

  // Parse mentions in text
  const parseMentions = (text) => {
    const mentions = [];
    const mentionRegex = /@(\w+)/g;
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const mentionName = match[1].toLowerCase();
      
      // Check if it's a family member
      const member = familyMembers.find(m => 
        m.name.toLowerCase() === mentionName || 
        (m.role === 'parent' && (mentionName === 'mama' || mentionName === 'papa' || mentionName === 'mom' || mentionName === 'dad'))
      );
      
      if (member) {
        mentions.push({ name: match[1], userId: member.id, type: 'user' });
      } else if (mentionName === 'allie') {
        mentions.push({ name: 'allie', type: 'allie' });
      }
    }
    
    return mentions;
  };

  // Render text with colored mentions
  const renderTextWithMentions = (text) => {
    const parts = text.split(/(@\w+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        const mentionName = part.substring(1).toLowerCase();
        const member = familyMembers.find(m => 
          m.name.toLowerCase() === mentionName || 
          (m.role === 'parent' && (mentionName === 'mama' || mentionName === 'papa' || mentionName === 'mom' || mentionName === 'dad'))
        );
        
        if (member) {
          return <span key={index} className="text-blue-600 font-semibold">{part}</span>;
        } else if (mentionName === 'allie') {
          return <span key={index} className="text-purple-600 font-semibold">{part}</span>;
        }
      }
      return part;
    });
  };

  // Handle input change for mention detection
  const handleCommentInputChange = (e) => {
    const text = e.target.value;
    setNewComment(text);
    
    // Check for @ symbol to show mention dropdown
    const cursorPosition = e.target.selectionStart;
    const lastAtSymbol = text.lastIndexOf('@', cursorPosition);
    
    if (lastAtSymbol !== -1 && cursorPosition > lastAtSymbol) {
      const searchText = text.substring(lastAtSymbol + 1, cursorPosition);
      if (!searchText.includes(' ')) {
        setMentionSearch(searchText);
        setShowMentionDropdown(true);
        setMentionCursorPosition(lastAtSymbol);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Insert mention
  const insertMention = (member) => {
    const beforeMention = newComment.substring(0, mentionCursorPosition);
    const afterCursor = newComment.substring(commentInputRef.current.selectionStart);
    const mentionText = member.type === 'allie' ? '@allie ' : `@${member.name} `;
    const newText = beforeMention + mentionText + afterCursor;
    
    setNewComment(newText);
    setShowMentionDropdown(false);
    
    // Focus back on input
    setTimeout(() => {
      commentInputRef.current.focus();
      const newCursorPos = beforeMention.length + mentionText.length;
      commentInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Get filtered mention suggestions
  const getMentionSuggestions = () => {
    const searchLower = mentionSearch.toLowerCase();
    const suggestions = [];
    
    // Add family members
    familyMembers.forEach(member => {
      if (member.name.toLowerCase().includes(searchLower) ||
          (member.role === 'parent' && 
           (searchLower === '' || 'mama'.includes(searchLower) || 'papa'.includes(searchLower) || 
            'mom'.includes(searchLower) || 'dad'.includes(searchLower)))) {
        suggestions.push({
          ...member,
          type: 'user',
          displayName: member.name + (member.role === 'parent' ? ` (${member.role})` : '')
        });
      }
    });
    
    // Add Allie
    if (searchLower === '' || 'allie'.includes(searchLower)) {
      suggestions.push({ name: 'Allie', type: 'allie', displayName: 'Allie (AI Assistant)' });
    }
    
    return suggestions;
  };

  // Add comment
  const handleAddComment = async (isFromAllie = false, allieResponse = null) => {
    const commentText = isFromAllie ? allieResponse : newComment.trim();
    if (!commentText) return;

    // Parse mentions in the comment
    const mentions = parseMentions(commentText);
    
    const comment = {
      id: `comment_${Date.now()}`,
      text: commentText,
      authorId: isFromAllie ? 'allie' : currentUser.uid,
      authorName: isFromAllie ? 'Allie' : currentUser.displayName || 'User',
      isAllie: isFromAllie,
      mentions: mentions,
      timestamp: new Date().toISOString()
    };

    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        comments: arrayUnion(comment),
        updatedAt: serverTimestamp()
      });
      
      if (!isFromAllie) {
        setNewComment('');
        
        // Only ask Allie if she's mentioned or it's a question
        const mentionsAllie = mentions.some(m => m.type === 'allie');
        const isQuestion = commentText.includes('?');
        
        if (mentionsAllie || isQuestion) {
          handleAskAllie(commentText);
        }
        
        // TODO: Send notifications to mentioned users
        const mentionedUserIds = mentions.filter(m => m.type === 'user').map(m => m.userId);
        if (mentionedUserIds.length > 0) {
          console.log('Should notify users:', mentionedUserIds);
        }
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Ask Allie for help
  const handleAskAllie = async (question) => {
    setIsAskingAllie(true);
    
    try {
      const prompt = `You are helping with a family task: "${task.title}".
${task.description ? `Description: ${task.description}` : ''}

Family member asks: "${question}"

Provide a helpful, concise response that's specific to this task. If they're asking how to do something, give practical steps. Keep it friendly and under 3-4 sentences.`;

      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7 }
      );
      
      // Add Allie's response as a comment
      await handleAddComment(true, response);
    } catch (error) {
      console.error("Error getting Allie response:", error);
      await handleAddComment(true, "I'm having trouble connecting right now. Please try again in a moment!");
    } finally {
      setIsAskingAllie(false);
    }
  };

  // Delete comment
  const handleDeleteComment = async (comment) => {
    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        comments: arrayRemove(comment)
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      try {
        await deleteDoc(doc(db, "kanbanTasks", task.id));
        onClose();
        if (onDelete) onDelete(task.id);
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };
  
  // Archive task (instead of delete)
  const handleArchiveTask = async () => {
    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        status: 'archived',
        archivedAt: serverTimestamp(),
        archivedBy: currentUser.uid
      });
      onClose();
    } catch (error) {
      console.error("Error archiving task:", error);
    }
  };
  
  // Checklist functions
  const addChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    
    const newChecklist = {
      id: `checklist_${Date.now()}`,
      title: newChecklistTitle.trim(),
      items: []
    };
    
    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        checklists: arrayUnion(newChecklist)
      });
      setNewChecklistTitle('');
      setShowAddChecklist(false);
    } catch (error) {
      console.error("Error adding checklist:", error);
    }
  };
  
  const addChecklistItem = async (checklistId, itemText) => {
    const checklist = checklists.find(cl => cl.id === checklistId);
    if (!checklist) return;
    
    const newItem = {
      id: `item_${Date.now()}`,
      text: itemText,
      completed: false
    };
    
    const updatedChecklist = {
      ...checklist,
      items: [...checklist.items, newItem]
    };
    
    const updatedChecklists = checklists.map(cl => 
      cl.id === checklistId ? updatedChecklist : cl
    );
    
    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        checklists: updatedChecklists
      });
    } catch (error) {
      console.error("Error adding checklist item:", error);
    }
  };
  
  const deleteChecklist = async (checklistId) => {
    const updatedChecklists = checklists.filter(cl => cl.id !== checklistId);
    
    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        checklists: updatedChecklists
      });
    } catch (error) {
      console.error("Error deleting checklist:", error);
    }
  };
  
  const toggleChecklistItem = async (checklistId, itemId) => {
    const checklist = checklists.find(cl => cl.id === checklistId);
    if (!checklist) return;
    
    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    
    const updatedChecklist = { ...checklist, items: updatedItems };
    const updatedChecklists = checklists.map(cl => 
      cl.id === checklistId ? updatedChecklist : cl
    );
    
    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        checklists: updatedChecklists
      });
    } catch (error) {
      console.error("Error toggling checklist item:", error);
    }
  };
  
  // Handle checklist item actions (member assignment, due date, etc.)
  const handleChecklistItemAction = (checklistId, itemId, action) => {
    setActiveChecklistItem({ checklistId, itemId, action });
    setShowChecklistItemMenu(action);
  };
  
  // Assign member to checklist item
  const assignMemberToChecklistItem = async (checklistId, itemId, memberId) => {
    const checklist = checklists.find(cl => cl.id === checklistId);
    if (!checklist) return;
    
    const updatedItems = checklist.items.map(item =>
      item.id === itemId ? { ...item, assignedTo: memberId } : item
    );
    
    const updatedChecklist = { ...checklist, items: updatedItems };
    const updatedChecklists = checklists.map(cl => 
      cl.id === checklistId ? updatedChecklist : cl
    );
    
    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        checklists: updatedChecklists
      });
      setShowChecklistItemMenu(null);
      setActiveChecklistItem(null);
    } catch (error) {
      console.error("Error assigning member to checklist item:", error);
    }
  };
  
  // Delete checklist item
  const deleteChecklistItem = async (checklistId, itemId) => {
    const checklist = checklists.find(cl => cl.id === checklistId);
    if (!checklist) return;
    
    const updatedItems = checklist.items.filter(item => item.id !== itemId);
    const updatedChecklist = { ...checklist, items: updatedItems };
    const updatedChecklists = checklists.map(cl => 
      cl.id === checklistId ? updatedChecklist : cl
    );
    
    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        checklists: updatedChecklists
      });
      setShowChecklistItemMenu(null);
      setActiveChecklistItem(null);
    } catch (error) {
      console.error("Error deleting checklist item:", error);
    }
  };
  
  // Attachment functions
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const storageRef = ref(storage, `kanban-attachments/${task.id}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      const newAttachment = {
        id: `attachment_${Date.now()}`,
        name: file.name,
        url: downloadURL,
        type: file.type,
        size: file.size,
        uploadedBy: currentUser.uid,
        uploadedAt: new Date().toISOString()
      };
      
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        attachments: arrayUnion(newAttachment)
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };
  
  const attachDocument = async (document) => {
    const newAttachment = {
      id: `attachment_${Date.now()}`,
      name: document.fileName || document.name || 'Untitled',
      url: document.fileUrl || document.url,
      type: 'document',
      documentId: document.id,
      attachedBy: currentUser.uid,
      attachedAt: new Date().toISOString()
    };
    
    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        attachments: arrayUnion(newAttachment)
      });
      setShowDocumentPicker(false);
    } catch (error) {
      console.error("Error attaching document:", error);
    }
  };
  
  // Label functions
  const toggleLabel = async (labelId) => {
    const hasLabel = labels.includes(labelId);
    
    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        labels: hasLabel ? arrayRemove(labelId) : arrayUnion(labelId)
      });
    } catch (error) {
      console.error("Error toggling label:", error);
    }
  };
  
  // Member functions
  const toggleMember = async (memberId) => {
    const hasMember = members.includes(memberId);
    const newMembers = hasMember 
      ? members.filter(id => id !== memberId)
      : [...members, memberId];
    
    try {
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        members: hasMember ? arrayRemove(memberId) : arrayUnion(memberId)
      });
      
      // Update calendar event attendees if there's a due date
      if (task.dueDate && task.calendarEventId) {
        await eventStore.updateEvent(task.calendarEventId, {
          attendees: newMembers
        });
      }
    } catch (error) {
      console.error("Error toggling member:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <Tag className="text-gray-400" size={20} />
              {editingTitle ? (
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyPress={(e) => e.key === 'Enter' && handleTitleSave()}
                  className="text-xl font-semibold border-b-2 border-blue-500 focus:outline-none"
                  autoFocus
                />
              ) : (
                <h2 
                  className="text-xl font-semibold cursor-pointer hover:text-blue-600"
                  onClick={() => setEditingTitle(true)}
                >
                  {title}
                </h2>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <MoreVertical size={20} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
            
            {/* Actions dropdown */}
            {showActions && (
              <div className="absolute right-6 top-16 bg-white border rounded-lg shadow-lg py-1 z-10">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href + '#task-' + task.id);
                    setShowActions(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 w-full"
                >
                  <Copy size={16} className="mr-2" />
                  Copy link
                </button>
                <button
                  onClick={() => {
                    handleArchiveTask();
                    setShowActions(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 w-full"
                >
                  <Archive size={16} className="mr-2" />
                  Archive
                </button>
                <button
                  onClick={() => {
                    handleDeleteTask();
                    setShowActions(false);
                  }}
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
          
          {/* Trello-style Add button */}
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
            >
              <Plus size={16} className="mr-1" />
              Add
            </button>
            
            {showAddMenu && (
              <div className="absolute top-full mt-1 left-0 bg-white border rounded-lg shadow-lg py-1 z-10 w-48">
                <button
                  onClick={() => {
                    setShowLabelPicker(true);
                    setShowAddMenu(false);
                  }}
                  className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 w-full"
                >
                  <Tag size={16} className="mr-2" />
                  Labels
                </button>
                <button
                  onClick={() => {
                    setShowAddChecklist(true);
                    setShowAddMenu(false);
                  }}
                  className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 w-full"
                >
                  <CheckSquare size={16} className="mr-2" />
                  Checklist
                </button>
                <button
                  onClick={() => {
                    setShowMemberPicker(true);
                    setShowAddMenu(false);
                  }}
                  className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 w-full"
                >
                  <Users size={16} className="mr-2" />
                  Members
                </button>
                <label className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 w-full cursor-pointer">
                  <Paperclip size={16} className="mr-2" />
                  Attachment
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                <button
                  onClick={() => {
                    setShowDocumentPicker(true);
                    setShowAddMenu(false);
                  }}
                  className="flex items-center px-3 py-2 text-sm hover:bg-gray-100 w-full"
                >
                  <FileText size={16} className="mr-2" />
                  From Document Hub
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-4 space-y-6">
            {/* Labels */}
            {labels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {labels.map(labelId => {
                  const label = labelOptions.find(l => l.id === labelId);
                  if (!label) return null;
                  return (
                    <span
                      key={labelId}
                      className={`px-3 py-1 rounded text-white text-sm ${label.color}`}
                    >
                      {label.name}
                    </span>
                  );
                })}
              </div>
            )}
            
            {/* Members */}
            {members.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Members:</span>
                <div className="flex -space-x-2">
                  {members.map(memberId => {
                    const member = familyMembers.find(m => m.id === memberId);
                    if (!member) return null;
                    return (
                      <UserAvatar 
                        key={memberId}
                        user={member} 
                        size={32} 
                        className="ring-2 ring-white"
                      />
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Meta info */}
            <div className="flex flex-wrap gap-4">
              {/* Due date */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                <Calendar size={16} />
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);
                    saveChanges({ dueDate: e.target.value });
                  }}
                  className="bg-transparent text-sm focus:outline-none"
                />
              </div>

              {/* Priority */}
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  saveChanges({ priority: e.target.value });
                }}
                className={`px-3 py-2 rounded-lg text-sm ${
                  priorityOptions.find(p => p.value === priority)?.color || ''
                }`}
              >
                {priorityOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Category */}
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  saveChanges({ category: e.target.value });
                }}
                className="px-3 py-2 bg-gray-100 rounded-lg text-sm"
              >
                {categoryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              {editingDescription ? (
                <div>
                  <textarea
                    ref={descriptionInputRef}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleDescriptionSave}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Add a more detailed description..."
                    autoFocus
                  />
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setDescription(task.description || '');
                        setEditingDescription(false);
                      }}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDescriptionSave}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setEditingDescription(true)}
                  className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 min-h-[80px]"
                >
                  {description || <span className="text-gray-400">Add a description...</span>}
                </div>
              )}
            </div>
            
            {/* Checklists */}
            {checklists.map(checklist => (
              <div key={checklist.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700 flex items-center">
                    <CheckSquare size={16} className="mr-2" />
                    {checklist.title}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {checklist.items.filter(item => item.completed).length}/{checklist.items.length}
                    </span>
                    <button
                      onClick={() => deleteChecklist(checklist.id)}
                      className="text-sm text-gray-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${checklist.items.length > 0 
                        ? (checklist.items.filter(item => item.completed).length / checklist.items.length * 100) 
                        : 0}%` 
                    }}
                  />
                </div>
                
                {/* Checklist items */}
                <div className="space-y-2">
                  {checklist.items.map(item => (
                    <div key={item.id} className="flex items-center group hover:bg-gray-50 p-1 rounded">
                      <button
                        onClick={() => toggleChecklistItem(checklist.id, item.id)}
                        className="mr-2"
                      >
                        {item.completed ? (
                          <CheckSquare size={18} className="text-green-600" />
                        ) : (
                          <Square size={18} className="text-gray-400" />
                        )}
                      </button>
                      {/* Show assigned user avatar */}
                      {item.assignedTo && (
                        <UserAvatar 
                          user={familyMembers.find(m => m.id === item.assignedTo)} 
                          size={20} 
                          className="mr-2"
                        />
                      )}
                      <span className={`text-sm flex-1 ${item.completed ? 'line-through text-gray-500' : ''}`}>
                        {item.text}
                      </span>
                      {/* Checklist item actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleChecklistItemAction(checklist.id, item.id, 'member')}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Assign member"
                        >
                          <User size={16} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleChecklistItemAction(checklist.id, item.id, 'more')}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="More options"
                        >
                          <MoreVertical size={16} className="text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add new item */}
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Add an item"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          addChecklistItem(checklist.id, e.target.value.trim());
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-2 py-1 text-sm border-b border-gray-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add checklist form */}
            {showAddChecklist && (
              <div className="border rounded-lg p-3">
                <input
                  type="text"
                  value={newChecklistTitle}
                  onChange={(e) => setNewChecklistTitle(e.target.value)}
                  placeholder="Enter checklist title..."
                  className="w-full px-2 py-1 border-b border-gray-300 focus:outline-none focus:border-blue-500"
                  autoFocus
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addChecklist();
                    }
                  }}
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setNewChecklistTitle('');
                      setShowAddChecklist(false);
                    }}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addChecklist}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
            
            {/* Attachments */}
            {attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Paperclip size={16} className="mr-2" />
                  Attachments
                </h3>
                <div className="space-y-2">
                  {attachments.map(attachment => (
                    <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center">
                        <FileText size={16} className="mr-2 text-gray-500" />
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {attachment.name}
                        </a>
                      </div>
                      <button
                        onClick={async () => {
                          await updateDoc(doc(db, "kanbanTasks", task.id), {
                            attachments: arrayRemove(attachment)
                          });
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments section */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <MessageSquare size={16} className="mr-2" />
                Activity
              </h3>
              
              {/* Comments list */}
              <div className="space-y-3 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    {comment.isAllie ? (
                      <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Sparkles size={16} className="text-purple-600" />
                      </div>
                    ) : (
                      <UserAvatar 
                        user={familyMembers.find(m => m.id === comment.authorId) || { name: comment.authorName }} 
                        size={32} 
                      />
                    )}
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm font-medium ${comment.isAllie ? 'text-purple-600' : ''}`}>
                            {comment.authorName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">
                          {comment.mentions ? renderTextWithMentions(comment.text) : comment.text}
                        </p>
                      </div>
                      {comment.authorId === currentUser.uid && (
                        <button
                          onClick={() => handleDeleteComment(comment)}
                          className="text-xs text-gray-400 hover:text-red-600 mt-1"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                {isAskingAllie && (
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles size={16} className="text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="bg-purple-50 rounded-lg p-3">
                        <p className="text-sm text-purple-600">Allie is thinking...</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Comment input */}
              <div className="relative">
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      ref={commentInputRef}
                      type="text"
                      value={newComment}
                      onChange={handleCommentInputChange}
                      onKeyPress={(e) => e.key === 'Enter' && !showMentionDropdown && handleAddComment()}
                      placeholder="Write a comment, @mention someone, or ask a question..."
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    {/* Mention dropdown */}
                    {showMentionDropdown && (
                      <div className="absolute bottom-full mb-1 left-0 bg-white border rounded-lg shadow-lg py-1 z-10 max-h-48 overflow-y-auto">
                        {getMentionSuggestions().map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => insertMention(suggestion)}
                            className="flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 w-full text-left"
                          >
                            {suggestion.type === 'user' ? (
                              <UserAvatar user={suggestion} size={24} />
                            ) : (
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                <Sparkles size={14} className="text-purple-600" />
                              </div>
                            )}
                            <span>{suggestion.displayName}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddComment()}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={16} />
                  </button>
                </div>
                
                {/* Live preview of mentions */}
                {newComment && parseMentions(newComment).length > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    Mentioning: {parseMentions(newComment).map(m => m.name).join(', ')}
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Tip: Use @ to mention family members or Allie. End with ? to ask Allie for help.
              </p>
            </div>
          </div>
        </div>
        
        {/* Label Picker Modal */}
        {showLabelPicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg p-4 w-full max-w-sm">
              <h3 className="font-medium mb-3">Labels</h3>
              <div className="space-y-2">
                {labelOptions.map(label => (
                  <button
                    key={label.id}
                    onClick={() => toggleLabel(label.id)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-6 rounded ${label.color} mr-3`} />
                      <span className="text-sm">{label.name}</span>
                    </div>
                    {labels.includes(label.id) && (
                      <Check size={16} className="text-green-600" />
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowLabelPicker(false)}
                className="mt-4 w-full py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Done
              </button>
            </div>
          </div>
        )}
        
        {/* Member Picker Modal */}
        {showMemberPicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg p-4 w-full max-w-sm">
              <h3 className="font-medium mb-3">Members</h3>
              <div className="space-y-2">
                {familyMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => toggleMember(member.id)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-100"
                  >
                    <div className="flex items-center">
                      <UserAvatar user={member} size={32} className="mr-3" />
                      <span className="text-sm">{member.name}</span>
                    </div>
                    {members.includes(member.id) && (
                      <Check size={16} className="text-green-600" />
                    )}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowMemberPicker(false)}
                className="mt-4 w-full py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Done
              </button>
            </div>
          </div>
        )}
        
        {/* Document Picker Modal */}
        {showDocumentPicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg p-4 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <h3 className="font-medium mb-3">Attach from Document Hub</h3>
              <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {familyDocuments.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => attachDocument(doc)}
                      className="p-3 border rounded hover:bg-gray-50 text-left"
                    >
                      <div className="flex items-center">
                        <FileText size={20} className="mr-2 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium truncate">{doc.fileName || doc.name || 'Untitled'}</p>
                          <p className="text-xs text-gray-500">
                            {doc.uploadedAt ? new Date(doc.uploadedAt.toDate ? doc.uploadedAt.toDate() : doc.uploadedAt).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {familyDocuments.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    No documents found in your Document Hub
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowDocumentPicker(false)}
                className="mt-4 w-full py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Checklist Item Member Picker */}
        {showChecklistItemMenu === 'member' && activeChecklistItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg p-4 w-full max-w-sm">
              <h3 className="font-medium mb-3">Assign Member</h3>
              <div className="space-y-2">
                <button
                  onClick={() => assignMemberToChecklistItem(activeChecklistItem.checklistId, activeChecklistItem.itemId, null)}
                  className="w-full flex items-center p-2 rounded hover:bg-gray-100 text-left"
                >
                  <span className="text-sm text-gray-500">Unassigned</span>
                </button>
                {familyMembers.map(member => (
                  <button
                    key={member.id}
                    onClick={() => assignMemberToChecklistItem(activeChecklistItem.checklistId, activeChecklistItem.itemId, member.id)}
                    className="w-full flex items-center p-2 rounded hover:bg-gray-100"
                  >
                    <UserAvatar user={member} size={32} className="mr-3" />
                    <span className="text-sm">{member.name}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  setShowChecklistItemMenu(null);
                  setActiveChecklistItem(null);
                }}
                className="mt-4 w-full py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Checklist Item More Options Menu */}
        {showChecklistItemMenu === 'more' && activeChecklistItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white rounded-lg p-4 w-full max-w-sm">
              <h3 className="font-medium mb-3">Item Options</h3>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    deleteChecklistItem(activeChecklistItem.checklistId, activeChecklistItem.itemId);
                  }}
                  className="w-full flex items-center p-2 rounded hover:bg-red-50 text-red-600 text-left"
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete item
                </button>
              </div>
              <button
                onClick={() => {
                  setShowChecklistItemMenu(null);
                  setActiveChecklistItem(null);
                }}
                className="mt-4 w-full py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;