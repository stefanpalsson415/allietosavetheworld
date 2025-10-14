import React from 'react';
import { X } from 'lucide-react';

const SimpleTaskDrawer = ({ isOpen, onClose, task }) => {
  if (!isOpen || !task) return null;

  return (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        right: 0,
        width: '400px',
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        padding: '24px',
        overflowY: 'auto',
        borderLeft: '1px solid #e5e7eb'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827' }}>Task Details</h2>
        <button 
          onClick={onClose}
          style={{ 
            padding: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          <X size={24} />
        </button>
      </div>

      {/* Task Title */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '20px', fontWeight: '500', color: '#111827' }}>{task.title || 'Untitled Task'}</h3>
      </div>

      {/* Task Details */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Description</label>
        <p style={{ fontSize: '14px', color: '#374151' }}>{task.description || 'No description provided'}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Priority</label>
        <p style={{ fontSize: '14px', color: '#374151', textTransform: 'capitalize' }}>{task.priority || 'medium'}</p>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Status</label>
        <p style={{ fontSize: '14px', color: '#374151' }}>{task.column || task.status || 'todo'}</p>
      </div>

      {/* Task ID for debugging */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Task ID</label>
        <p style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>{task.id}</p>
      </div>

      {/* Close Button */}
      <button 
        onClick={onClose}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          fontSize: '16px',
          fontWeight: '500',
          cursor: 'pointer',
          marginTop: '24px'
        }}
      >
        Close
      </button>
    </div>
  );
};

export default SimpleTaskDrawer;