import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Calendar, User, Tag, Paperclip, MessageSquare, CheckSquare, Activity, MoreHorizontal, Trash2, Archive } from 'lucide-react';
import { doc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, arrayUnion, arrayRemove, collection, addDoc, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import AllieChat from '../chat/refactored/AllieChat';
import UserAvatar from '../common/UserAvatar';
import './TaskDetailDrawer.css';

const TaskDetailDrawer = ({ isOpen, onClose, task, onUpdate, onDelete }) => {
  console.log('TaskDetailDrawer render:', { isOpen, task: task?.title || 'No task' });
  
  const { currentUser } = useAuth();
  const { familyMembers = [] } = useFamily();
  
  // State
  const [editedTask, setEditedTask] = useState(task || {});
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState(() => {
    const saved = localStorage.getItem('taskDrawerWidth');
    return saved ? parseInt(saved) : 600;
  });
  
  // Refs
  const titleInputRef = useRef(null);
  const descriptionTextareaRef = useRef(null);
  const resizeHandleRef = useRef(null);
  const drawerRef = useRef(null);
  
  // Available labels
  const availableLabels = [
    { id: 'urgent', name: 'Urgent', color: 'bg-red-500' },
    { id: 'important', name: 'Important', color: 'bg-orange-500' },
    { id: 'bug', name: 'Bug', color: 'bg-red-600' },
    { id: 'feature', name: 'Feature', color: 'bg-blue-500' },
    { id: 'enhancement', name: 'Enhancement', color: 'bg-green-500' },
    { id: 'documentation', name: 'Documentation', color: 'bg-purple-500' },
    { id: 'research', name: 'Research', color: 'bg-indigo-500' },
    { id: 'design', name: 'Design', color: 'bg-pink-500' }
  ];

  // Load task data when task changes
  useEffect(() => {
    if (task) {
      setEditedTask(task);
    }
  }, [task]);

  // Set up real-time sync
  useEffect(() => {
    if (!task?.id || !isOpen) return;

    const unsubscribe = onSnapshot(doc(db, 'kanbanTasks', task.id), (doc) => {
      if (doc.exists()) {
        const updatedTask = { id: doc.id, ...doc.data() };
        setEditedTask(updatedTask);
      }
    });

    return () => unsubscribe();
  }, [task?.id, isOpen]);

  // Load comments
  useEffect(() => {
    if (!task?.id || !isOpen) return;

    const commentsQuery = query(
      collection(db, 'kanbanTasks', task.id, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentsData);
    });

    return () => unsubscribe();
  }, [task?.id, isOpen]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = window.innerWidth - e.clientX;
      const clampedWidth = Math.max(400, Math.min(800, newWidth));
      setDrawerWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem('taskDrawerWidth', drawerWidth);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, drawerWidth]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Update task in Firestore
  const updateTask = async (updates) => {
    if (!editedTask?.id) return;

    try {
      await updateDoc(doc(db, 'kanbanTasks', editedTask.id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Handle title update
  const handleTitleUpdate = () => {
    if (editedTask?.title?.trim() && editedTask.title !== task?.title) {
      updateTask({ title: editedTask.title });
    }
    setIsEditingTitle(false);
  };

  // Handle description update
  const handleDescriptionUpdate = () => {
    updateTask({ description: editedTask.description || '' });
    setIsEditingDescription(false);
  };

  // Handle member assignment
  const toggleMember = (memberId) => {
    const currentMembers = editedTask.members || [];
    const isAssigned = currentMembers.includes(memberId);
    
    const newMembers = isAssigned
      ? currentMembers.filter(id => id !== memberId)
      : [...currentMembers, memberId];
    
    updateTask({ members: newMembers });
  };

  // Handle label toggle
  const toggleLabel = (labelId) => {
    const currentLabels = editedTask.labels || [];
    const hasLabel = currentLabels.includes(labelId);
    
    const newLabels = hasLabel
      ? currentLabels.filter(id => id !== labelId)
      : [...currentLabels, labelId];
    
    updateTask({ labels: newLabels });
  };

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !editedTask?.id) return;

    try {
      await addDoc(collection(db, 'kanbanTasks', editedTask.id, 'comments'), {
        text: newComment,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'User',
        userAvatar: currentUser.photoURL,
        createdAt: serverTimestamp(),
        mentions: extractMentions(newComment)
      });

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Extract @mentions from text
  const extractMentions = (text) => {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1].toLowerCase();
      const member = familyMembers.find(m => 
        m.name.toLowerCase().replace(/\s+/g, '') === username
      );
      if (member) {
        mentions.push({
          userId: member.id,
          userName: member.name,
          position: match.index
        });
      }
    }

    return mentions;
  };

  // Add checklist item
  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      text: newChecklistItem,
      completed: false
    };

    const currentChecklist = editedTask.checklist || [];
    updateTask({ checklist: [...currentChecklist, newItem] });

    setNewChecklistItem('');
  };

  // Toggle checklist item
  const toggleChecklistItem = (itemId) => {
    const updatedChecklist = (editedTask.checklist || []).map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    updateTask({ checklist: updatedChecklist });
  };

  // Delete checklist item
  const deleteChecklistItem = (itemId) => {
    const updatedChecklist = (editedTask.checklist || []).filter(item => item.id !== itemId);
    updateTask({ checklist: updatedChecklist });
  };

  // Handle task deletion
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteDoc(doc(db, 'kanbanTasks', editedTask.id));
        onClose();
        if (onDelete) {
          onDelete(editedTask.id);
        }
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  // Handle archive
  const handleArchive = async () => {
    try {
      await updateTask({ archived: true, archivedAt: serverTimestamp() });
      onClose();
    } catch (error) {
      console.error('Error archiving task:', error);
    }
  };
  
  // Create portal container if it doesn't exist
  useEffect(() => {
    let container = document.getElementById('task-drawer-portal');
    if (!container) {
      container = document.createElement('div');
      container.id = 'task-drawer-portal';
      container.style.position = 'fixed';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '0';
      container.style.height = '0';
      container.style.pointerEvents = 'none';
      container.style.zIndex = '999999';
      document.body.appendChild(container);
    }
    return () => {
      // Don't remove container as other drawers might use it
    };
  }, []);
  
  // Log DOM state
  useEffect(() => {
    if (isOpen) {
      console.log('Checking drawer in DOM...');
      setTimeout(() => {
        const drawer = document.querySelector('[data-testid="task-detail-drawer"]');
        if (drawer) {
          console.log('Drawer found in DOM:', {
            display: window.getComputedStyle(drawer).display,
            visibility: window.getComputedStyle(drawer).visibility,
            transform: window.getComputedStyle(drawer).transform,
            zIndex: window.getComputedStyle(drawer).zIndex,
            position: window.getComputedStyle(drawer).position,
            right: window.getComputedStyle(drawer).right,
            width: window.getComputedStyle(drawer).width
          });
        } else {
          console.log('Drawer NOT found in DOM');
        }
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen || !editedTask) {
    console.log('TaskDetailDrawer early return:', { isOpen, hasEditedTask: !!editedTask });
    return null;
  }

  console.log('TaskDetailDrawer rendering directly to body');
  
  return (
    <div 
      style={{ 
        width: '400px',
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        padding: '20px',
        boxSizing: 'border-box',
        borderLeft: '1px solid #e5e7eb'
      }}
    >
      <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#111827' }}>{editedTask?.title || 'No title'}</h2>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Description</label>
        <p style={{ fontSize: '14px', color: '#374151' }}>{editedTask?.description || 'No description'}</p>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Priority</label>
        <p style={{ fontSize: '14px', color: '#374151' }}>{editedTask?.priority || 'No priority'}</p>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Status</label>
        <p style={{ fontSize: '14px', color: '#374151' }}>{editedTask?.status || 'No status'}</p>
      </div>
      <button 
        onClick={onClose}
        style={{
          marginTop: '20px',
          padding: '10px 20px',
          background: 'blue',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Close Drawer
      </button>
    </div>
  );
};

export default TaskDetailDrawer;