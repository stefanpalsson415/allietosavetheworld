// src/components/kanban/AITaskColumn.jsx
import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import AITaskCard from './AITaskCard';
import { Plus, Edit2, Check, X } from 'lucide-react';

const AITaskColumn = ({ column, tasks, onAddTask, onUpdateTitle, onTaskSelect }) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column: column.id
    }
  });
  
  // Column color schemes
  const columnColors = {
    backlog: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      header: 'bg-gray-100',
      text: 'text-gray-700',
      count: 'bg-gray-200 text-gray-700'
    },
    'this-week': {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      header: 'bg-purple-100',
      text: 'text-purple-700',
      count: 'bg-purple-200 text-purple-700'
    },
    today: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      header: 'bg-blue-100',
      text: 'text-blue-700',
      count: 'bg-blue-200 text-blue-700'
    },
    'in-progress': {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      header: 'bg-yellow-100',
      text: 'text-yellow-700',
      count: 'bg-yellow-200 text-yellow-700'
    },
    done: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      header: 'bg-green-100',
      text: 'text-green-700',
      count: 'bg-green-200 text-green-700'
    }
  };
  
  const colors = columnColors[column.id] || columnColors.backlog;
  
  // Calculate stats
  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || column.id === 'done') return false;
    return new Date(t.dueDate) < new Date();
  }).length;
  
  // Handle title save
  const handleTitleSave = () => {
    if (editedTitle.trim() && editedTitle !== column.title && onUpdateTitle) {
      onUpdateTitle(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };
  
  // Handle title cancel
  const handleTitleCancel = () => {
    setEditedTitle(column.title);
    setIsEditingTitle(false);
  };
  
  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[280px] rounded-lg border ${colors.border} ${colors.bg} ${
        isOver ? 'ring-2 ring-indigo-400 ring-opacity-50' : ''
      } transition-all h-full flex flex-col`}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 ${colors.header} rounded-t-md`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') handleTitleCancel();
                  }}
                  className={`font-semibold bg-white px-2 py-1 rounded border border-gray-300 focus:outline-none focus:border-blue-500 ${colors.text}`}
                  autoFocus
                />
                <button
                  onClick={handleTitleSave}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <Check size={16} className="text-green-600" />
                </button>
                <button
                  onClick={handleTitleCancel}
                  className="p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <X size={16} className="text-red-600" />
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <h3 className={`font-semibold ${colors.text}`}>{column.title}</h3>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white hover:bg-opacity-20 rounded"
                >
                  <Edit2 size={14} className={colors.text} />
                </button>
              </div>
            )}
            <p className="text-xs text-gray-600 mt-0.5">{column.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            {overdueTasks > 0 && column.id !== 'done' && (
              <span className="bg-red-200 text-red-700 text-xs px-2 py-0.5 rounded-full">
                {overdueTasks} overdue
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${colors.count}`}>
              {totalTasks}
            </span>
          </div>
        </div>
      </div>
      
      {/* Tasks Container */}
      <div className="p-2 flex-1 overflow-y-auto">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <AITaskCard key={task.id} task={task} onTaskSelect={onTaskSelect} />
          ))}
        </SortableContext>
        
        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No tasks</p>
            <p className="text-xs mt-1">Drag tasks here or create new</p>
          </div>
        )}
        
        {/* Quick add button */}
        {onAddTask && (
          <button
            onClick={() => onAddTask(column.id)}
            className="w-full mt-2 py-2 text-gray-600 hover:bg-gray-100 rounded-md flex items-center text-sm transition-all"
          >
            <Plus size={18} className="mr-1" />
            Add a card
          </button>
        )}
      </div>
    </div>
  );
};

export default AITaskColumn;