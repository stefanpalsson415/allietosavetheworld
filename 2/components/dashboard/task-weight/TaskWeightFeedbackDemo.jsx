// src/components/dashboard/task-weight/TaskWeightFeedbackDemo.jsx
import React, { useState } from 'react';
import { TaskWeightBadge, TaskWeightFeedback, TaskWeightFeedbackButton } from './index';

/**
 * TaskWeightFeedbackDemo Component
 * 
 * A fully functional demonstration component showing different ways to use the Task Weight Feedback system.
 * This component can be added to any page for testing or as a dashboard widget.
 * 
 * All buttons and interactions in this demo are fully functional - clicking on any
 * badge or button will show the real feedback interface.
 */
const TaskWeightFeedbackDemo = () => {
  const [showFullForm, setShowFullForm] = useState(false);
  
  // Example tasks with different weights
  const exampleTasks = [
    {
      id: 'demo-task-1',
      title: 'Morning Childcare Routine',
      description: 'Getting children ready for school, including breakfast, dressing, and emotional preparation',
      weight: 7.5,
      assignedTo: 'Mama',
      assignedToName: 'Sarah',
      category: 'Invisible Parental Tasks',
      frequency: 'daily',
      invisibility: 'partially',
      emotionalLabor: 'high'
    },
    {
      id: 'demo-task-2',
      title: 'Weekly Grocery Shopping',
      description: 'Planning meals, making lists, and shopping for family groceries',
      weight: 4.8,
      assignedTo: 'Papa',
      assignedToName: 'Michael',
      category: 'Visible Household Tasks',
      frequency: 'weekly',
      invisibility: 'highly',
      emotionalLabor: 'moderate'
    },
    {
      id: 'demo-task-3',
      title: 'Scheduling Medical Appointments',
      description: 'Tracking health needs, finding providers, and scheduling appointments for family members',
      weight: 6.2,
      assignedTo: 'Mama',
      assignedToName: 'Sarah',
      category: 'Invisible Household Tasks',
      frequency: 'monthly',
      invisibility: 'completely',
      emotionalLabor: 'high'
    }
  ];
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Task Weight Feedback System</h2>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">About Task Weights</h3>
        <p className="text-gray-600 mb-3">
          Task weights help quantify the mental, emotional, and physical effort required for different family responsibilities. 
          Our system uses multiple factors to calculate these weights, including:
        </p>
        <ul className="list-disc pl-5 text-gray-600 mb-4">
          <li>Task frequency (daily, weekly, monthly)</li>
          <li>Invisibility of the work (how obvious it is when completed)</li>
          <li>Emotional labor required</li>
          <li>Impact on child development</li>
          <li>Alignment with your family's stated priorities</li>
        </ul>
        <p className="text-gray-600">
          These weights help identify imbalances in workload distribution and can guide more equitable sharing of responsibilities.
        </p>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Example Tasks with Weights</h3>
        <div className="space-y-4">
          {exampleTasks.map(task => (
            <div key={task.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-800">{task.title}</h4>
                <TaskWeightBadge 
                  task={task}
                  weight={task.weight}
                  size="md"
                />
              </div>
              <p className="text-gray-600 text-sm mb-3">{task.description}</p>
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Assigned to: {task.assignedToName} ({task.assignedTo})
                </div>
                <TaskWeightFeedbackButton
                  task={task}
                  calculatedWeight={task.weight}
                  taskId={task.id}
                  variant="both"
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Different Ways to Use</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border rounded-lg p-4 bg-blue-50">
            <h4 className="font-medium text-blue-800 mb-2">Badge Only</h4>
            <div className="flex justify-center mb-3">
              <TaskWeightBadge 
                task={exampleTasks[0]}
                weight={exampleTasks[0].weight}
                size="lg"
                showFeedback={false}
              />
            </div>
            <p className="text-sm text-blue-700">
              Shows the weight as a simple badge with hover details
            </p>
          </div>
          
          <div className="border rounded-lg p-4 bg-purple-50">
            <h4 className="font-medium text-purple-800 mb-2">Feedback Button</h4>
            <div className="flex justify-center mb-3">
              <TaskWeightFeedbackButton
                task={exampleTasks[1]}
                calculatedWeight={exampleTasks[1].weight}
                taskId={exampleTasks[1].id}
                variant="both"
                size="lg"
              />
            </div>
            <p className="text-sm text-purple-700">
              Button that opens the feedback form
            </p>
          </div>
          
          <div className="border rounded-lg p-4 bg-green-50">
            <h4 className="font-medium text-green-800 mb-2">Combined Usage</h4>
            <div className="flex justify-between items-center mb-3">
              <TaskWeightBadge 
                task={exampleTasks[2]}
                weight={exampleTasks[2].weight}
                size="md"
              />
              <TaskWeightFeedbackButton
                task={exampleTasks[2]}
                calculatedWeight={exampleTasks[2].weight}
                taskId={exampleTasks[2].id}
                variant="icon"
                size="md"
              />
            </div>
            <p className="text-sm text-green-700">
              Badge and button used together
            </p>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-6 mt-6">
        <button
          onClick={() => setShowFullForm(!showFullForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mb-4"
        >
          {showFullForm ? 'Hide' : 'Show'} Full Feedback Form
        </button>
        
        {showFullForm && (
          <div className="mt-4">
            <TaskWeightFeedback
              task={exampleTasks[0]}
              calculatedWeight={exampleTasks[0].weight}
              taskId={exampleTasks[0].id}
              onClose={() => setShowFullForm(false)}
              isVisible={true}
            />
          </div>
        )}
      </div>
      
      <div className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-600">
        <p>
          Your feedback helps our system learn and adapt weights over time, making them more accurate for your family's unique situation.
        </p>
      </div>
    </div>
  );
};

export default TaskWeightFeedbackDemo;