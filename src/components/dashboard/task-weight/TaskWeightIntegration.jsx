// src/components/dashboard/task-weight/TaskWeightIntegration.jsx
import React from 'react';
import TaskWeightBadge from '../TaskWeightBadge';
import TaskWeightFeedbackButton from '../TaskWeightFeedbackButton';

/**
 * Task Weight Integration Examples
 * 
 * This file provides fully functional example components showing how to integrate 
 * the task weight components into various parts of the application.
 * 
 * These components can be imported and used directly, or used as reference
 * for integrating the task weight components into existing UI components.
 */

/**
 * Example integration for a task card
 * @param {Object} task - The task object
 * @returns {JSX.Element} - The task card with weight badge integration
 */
export const TaskCardWithWeight = ({ task }) => {
  return (
    <div className="border rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow bg-white">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-800">{task.title}</h3>
        
        {/* Add the TaskWeightBadge here */}
        {task.weight && (
          <TaskWeightBadge 
            task={task}
            weight={task.weight}
            size="md"
            showFeedback={true}
          />
        )}
      </div>
      
      <p className="text-gray-600 text-sm mb-3">{task.description}</p>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Assigned to: {task.assignedToName || task.assignedTo}
        </div>
        
        {/* Standalone feedback button option */}
        {task.weight && (
          <TaskWeightFeedbackButton
            task={task}
            calculatedWeight={task.weight}
            taskId={task.id}
            variant="icon"
            size="sm"
          />
        )}
      </div>
    </div>
  );
};

/**
 * Example integration for a task list item
 * @param {Object} task - The task object
 * @returns {JSX.Element} - The task list item with weight badge integration
 */
export const TaskListItemWithWeight = ({ task }) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-200">
      <div className="flex items-center">
        <input 
          type="checkbox" 
          className="mr-3 h-4 w-4 rounded border-gray-300 text-blue-600"
          checked={task.completed || false}
          onChange={() => {}} // Example component, no real functionality needed
        />
        <span className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
          {task.title}
        </span>
      </div>
      
      {task.weight && (
        <TaskWeightBadge 
          task={task}
          weight={task.weight}
          size="sm"
          showFeedback={true}
          showDetailOnHover={true}
        />
      )}
    </div>
  );
};

/**
 * Example integration for task details panel
 * @param {Object} task - The task object
 * @returns {JSX.Element} - Task details with weight information 
 */
export const TaskDetailsWithWeight = ({ task }) => {
  return (
    <div className="border rounded-lg p-5">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-bold text-gray-900">{task.title}</h2>
        
        {task.weight && (
          <TaskWeightBadge 
            task={task}
            weight={task.weight}
            size="lg"
            showFeedback={false}
          />
        )}
      </div>
      
      <p className="text-gray-700 mb-4">{task.description}</p>
      
      {task.subTasks && task.subTasks.length > 0 && (
        <div className="mb-4">
          <h3 className="font-medium text-gray-800 mb-2">Subtasks:</h3>
          <ul className="list-disc list-inside space-y-1">
            {task.subTasks.map((subtask, index) => (
              <li key={index} className={subtask.completed ? 'line-through text-gray-500' : ''}>
                {subtask.title}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="mt-5 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              Category: <span className="font-medium">{task.category || 'Uncategorized'}</span>
            </p>
            <p className="text-sm text-gray-600">
              Assigned to: <span className="font-medium">{task.assignedToName || task.assignedTo || 'Unassigned'}</span>
            </p>
          </div>
          
          {task.weight && (
            <TaskWeightFeedbackButton
              task={task}
              calculatedWeight={task.weight}
              taskId={task.id}
              variant="both"
              size="md"
            />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * HOW TO INTEGRATE
 * 
 * To integrate the task weight components into your existing components:
 * 
 * 1. Import the components in your file:
 *    import { TaskWeightBadge, TaskWeightFeedbackButton } from '../task-weight';
 * 
 * 2. Add the components to your task rendering logic:
 *    - For badges showing weight: use TaskWeightBadge
 *    - For feedback buttons: use TaskWeightFeedbackButton
 * 
 * 3. Ensure the task object has a 'weight' property
 *    - If using AllieTaskWeightService, this is provided as 'calculatedWeight'
 *    - You may need to transform your data structure
 * 
 * 4. Style the components to match your application's design
 *    - Both components accept className props for custom styling
 * 
 * Example snippet for EnhancedTasksTab.jsx or similar components:
 * 
 * // Inside your task rendering function
 * return (
 *   <div className="task-card">
 *     <div className="flex justify-between">
 *       <h3>{task.title}</h3>
 *       {task.weight && (
 *         <TaskWeightBadge 
 *           task={task}
 *           weight={task.weight}
 *           size="md"
 *         />
 *       )}
 *     </div>
 *     <p>{task.description}</p>
 *     // ... other task content
 *     <div className="task-actions">
 *       // ... other action buttons
 *       {task.weight && (
 *         <TaskWeightFeedbackButton
 *           task={task}
 *           calculatedWeight={task.weight}
 *           taskId={task.id}
 *           variant="both"
 *           size="md"
 *         />
 *       )}
 *     </div>
 *   </div>
 * );
 */