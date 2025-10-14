// src/components/dashboard/NotionTasksWrapper.jsx
import React from 'react';
import './notion-styles.css';
import { Info, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

/**
 * A Notion-inspired wrapper component that applies Notion styling to the TasksTab
 */
const NotionTasksWrapper = ({ children }) => {
  return (
    <div className="notion-page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      {/* Header section */}
      <div className="notion-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div>
            <h1 className="notion-title" style={{ fontSize: '24px', marginBottom: '8px' }}>Family Tasks</h1>
            <p className="notion-text notion-text-light">
              Track your family's tasks, habits, and workload balance in one place.
            </p>
          </div>
        </div>
        
        <div className="notion-callout notion-callout-blue" style={{ marginTop: '16px' }}>
          <Info size={20} color="#5B8AF9" />
          <div>
            <p className="notion-text">
              <strong>Balance your family workload</strong> by tracking habits and visualizing task distribution. 
              Create habits that help share responsibilities more equitably.
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats overview */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
        gap: '16px',
        marginBottom: '24px',
        marginTop: '24px'
      }}>
        <div className="notion-container" style={{ margin: 0, padding: '16px' }}>
          <div className="notion-icon-text" style={{ marginBottom: '8px' }}>
            <Calendar size={16} />
            <span className="notion-subtitle">Current Cycle</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="notion-text" style={{ fontSize: '24px', fontWeight: '600' }}>Cycle 3</span>
            <span className="notion-pill notion-pill-blue">In Progress</span>
          </div>
        </div>
        
        <div className="notion-container" style={{ margin: 0, padding: '16px' }}>
          <div className="notion-icon-text" style={{ marginBottom: '8px' }}>
            <CheckCircle size={16} />
            <span className="notion-subtitle">Active Habits</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="notion-text" style={{ fontSize: '24px', fontWeight: '600' }}>5</span>
            <span className="notion-pill notion-pill-sage">On Track</span>
          </div>
        </div>
        
        <div className="notion-container" style={{ margin: 0, padding: '16px' }}>
          <div className="notion-icon-text" style={{ marginBottom: '8px' }}>
            <AlertTriangle size={16} />
            <span className="notion-subtitle">Workload Balance</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="notion-text" style={{ fontSize: '24px', fontWeight: '600' }}>25%</span>
            <span className="notion-pill notion-pill-peach">Imbalanced</span>
          </div>
        </div>
      </div>
      
      {/* Main content area with Notion styling applied */}
      <div style={{ position: 'relative' }}>
        {/* Apply Notion styling to the children content */}
        {children}
      </div>
    </div>
  );
};

export default NotionTasksWrapper;