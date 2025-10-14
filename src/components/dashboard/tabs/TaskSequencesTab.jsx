// src/components/dashboard/tabs/TaskSequencesTab.jsx
import React from 'react';
import { 
  List, 
  AlertCircle 
} from 'lucide-react';
import TaskSequenceManager from '../task-sequence/TaskSequenceManager';

/**
 * Task Sequences tab for the dashboard
 * Integrates contextual task management features
 */
const TaskSequencesTab = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-roboto mb-2">Task Sequences</h2>
        <p className="text-gray-600 font-roboto">
          Manage and track complex tasks with dependencies and intelligent reminders.
        </p>
      </div>
      
      {/* Information banner */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 flex items-start">
        <AlertCircle size={24} className="text-blue-500 flex-shrink-0 mr-3" />
        <div>
          <h3 className="font-medium text-blue-700 mb-1">About Task Sequences</h3>
          <p className="text-sm text-blue-600">
            Task sequences help you organize complex projects with multiple steps that depend on each other.
            You can set dependencies between tasks, get smart reminders, and automatically generate shopping lists.
          </p>
        </div>
      </div>
      
      {/* Task Sequence Manager */}
      <TaskSequenceManager />
    </div>
  );
};

export default TaskSequencesTab;