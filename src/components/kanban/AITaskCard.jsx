// src/components/kanban/AITaskCard.jsx
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar,
  Clock,
  MoreVertical,
  CheckCircle,
  Circle,
  AlertCircle,
  User,
  Tag,
  Edit2,
  Trash2,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useFamily } from '../../contexts/FamilyContext';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const AITaskCard = ({ task, isDragging = false, onTaskSelect }) => {
  const { familyMembers } = useFamily();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'task',
      task,
      column: task.column
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };
  
  // Get assignee details
  const assignee = familyMembers.find(m => m.id === task.assignedTo);
  
  // Priority colors
  const priorityColors = {
    high: 'border-red-400 bg-red-50',
    medium: 'border-yellow-400 bg-yellow-50',
    low: 'border-green-400 bg-green-50',
    default: 'border-gray-200 bg-white'
  };
  
  // Category colors
  const categoryColors = {
    household: 'bg-blue-100 text-blue-700',
    parenting: 'bg-purple-100 text-purple-700',
    work: 'bg-gray-100 text-gray-700',
    personal: 'bg-green-100 text-green-700',
    errands: 'bg-orange-100 text-orange-700',
    health: 'bg-red-100 text-red-700',
    general: 'bg-gray-100 text-gray-700'
  };
  
  // Format due date
  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return { text: 'Today', urgent: true };
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return { text: 'Tomorrow', urgent: false };
    } else if (date < today) {
      return { text: 'Overdue', urgent: true, overdue: true };
    } else {
      return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgent: false };
    }
  };
  
  const dueDateInfo = formatDueDate(task.dueDate);
  
  // Handle title edit
  const handleTitleSave = async () => {
    if (editedTitle.trim() && editedTitle !== task.title) {
      try {
        await updateDoc(doc(db, "kanbanTasks", task.id), {
          title: editedTitle.trim(),
          updatedAt: new Date()
        });
      } catch (error) {
        console.error("Error updating task title:", error);
      }
    }
    setIsEditing(false);
  };
  
  // Handle task deletion
  const handleDelete = async () => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      try {
        await deleteDoc(doc(db, "kanbanTasks", task.id));
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };
  
  // Toggle completion
  const toggleComplete = async () => {
    try {
      const newColumn = task.column === 'done' ? 'today' : 'done';
      await updateDoc(doc(db, "kanbanTasks", task.id), {
        column: newColumn,
        completedAt: newColumn === 'done' ? new Date() : null
      });
      
      if (newColumn === 'done') {
        // Trigger celebration
        window.dispatchEvent(new CustomEvent('task-completed', { detail: { task } }));
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
    }
  };
  
  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`relative mb-2 p-2 rounded-lg border cursor-move hover:shadow-md transition-all ${
          priorityColors[task.priority] || priorityColors.default
        } ${task.fromAllie ? 'ring-1 ring-indigo-400 ring-opacity-50' : ''}`}
        onClick={(e) => {
          // Only open modal if not dragging and not clicking on interactive elements
          if (!isSortableDragging && !isDragging && !e.target.closest('button') && !e.target.closest('input') && !e.target.closest('select')) {
            console.log('Task card clicked, opening drawer for task:', task.title);
            if (onTaskSelect) {
              onTaskSelect(task);
            } else {
              console.log('No onTaskSelect prop provided');
            }
          }
        }}
        {...attributes}
        {...listeners}
      >
      {/* Clean priority and AI indicators */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1">
          {task.fromAllie && (
            <div className="flex items-center bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-xs">
              <Sparkles size={12} className="mr-1" />
              AI
            </div>
          )}
        </div>
        {task.priority === 'high' && (
          <div className="flex items-center bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs">
            <AlertCircle size={12} className="mr-1" />
            Urgent
          </div>
        )}
      </div>
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start flex-1">
          <button
            onClick={toggleComplete}
            className="mt-0.5 mr-2 text-gray-400 hover:text-gray-600"
          >
            {task.column === 'done' ? (
              <CheckCircle size={18} className="text-green-600" />
            ) : (
              <Circle size={18} />
            )}
          </button>
          
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyPress={(e) => e.key === 'Enter' && handleTitleSave()}
              className="flex-1 px-1 border-b border-gray-300 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          ) : (
            <h3 
              className={`flex-1 text-sm font-medium ${
                task.column === 'done' ? 'line-through text-gray-500' : ''
              }`}
              onDoubleClick={() => setIsEditing(true)}
            >
              {task.title}
            </h3>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <MoreVertical size={16} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 py-1 w-32">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowMenu(false);
                }}
                className="flex items-center px-3 py-1.5 text-sm hover:bg-gray-100 w-full"
              >
                <Edit2 size={14} className="mr-2" />
                Edit
              </button>
              <button
                onClick={() => {
                  handleDelete();
                  setShowMenu(false);
                }}
                className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 w-full"
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}
      
      {/* Meta info */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          {/* Assignee */}
          {assignee && (
            <div className="flex items-center">
              <UserAvatar user={assignee} size={24} className="flex-shrink-0" />
              <span className="ml-1 text-gray-600 truncate max-w-[80px]">{assignee.name}</span>
            </div>
          )}
          
          {/* Due date */}
          {dueDateInfo && (
            <div className={`flex items-center ${
              dueDateInfo.overdue ? 'text-red-600' : 
              dueDateInfo.urgent ? 'text-orange-600' : 
              'text-gray-600'
            }`}>
              <Calendar size={12} className="mr-1" />
              {dueDateInfo.text}
            </div>
          )}
        </div>
        
        {/* Category */}
        {task.category && (
          <span className={`px-2 py-0.5 rounded-full text-xs ${
            categoryColors[task.category] || categoryColors.general
          }`}>
            {task.category}
          </span>
        )}
      </div>
      
      {/* Subtasks indicator */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} subtasks
        </div>
      )}
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
      </div>
    </>
  );
};

export default AITaskCard;