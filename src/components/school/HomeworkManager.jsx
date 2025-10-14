import React, { useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { FamilyContext } from '../../contexts/FamilyContext';
import HomeworkTracker from '../../services/HomeworkTracker';
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';
import { Tab } from '@headlessui/react';

function HomeworkManager({ selectedStudentId }) {
  const { familyMembers } = useContext(FamilyContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data states
  const [upcomingAssignments, setUpcomingAssignments] = useState({
    homework: [],
    projects: [],
    milestones: []
  });
  
  const [overdueAssignments, setOverdueAssignments] = useState({
    homework: [],
    projects: [],
    milestones: []
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    subject: 'all',
    type: 'all' // all, homework, project, milestone
  });
  
  // Active student ID (use provided or first child)
  const activeStudentId = selectedStudentId || 
    (familyMembers?.find(m => 
      m.relationship === 'child' || 
      m.relationship === 'son' || 
      m.relationship === 'daughter'
    )?.id);
  
  // Get active student details
  const activeStudent = familyMembers?.find(m => m.id === activeStudentId);
  
  // Load assignments when student changes
  useEffect(() => {
    if (activeStudentId) {
      loadAssignments();
    }
  }, [activeStudentId]);
  
  const loadAssignments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load upcoming assignments
      const upcoming = await HomeworkTracker.getUpcomingAssignments(
        activeStudentId,
        14 // 2 weeks ahead
      );
      setUpcomingAssignments(upcoming);
      
      // Load overdue assignments
      const overdue = await HomeworkTracker.getOverdueAssignments(activeStudentId);
      setOverdueAssignments(overdue);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setError('Failed to load assignments. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateHomeworkProgress = async (homeworkId, progress, timeSpent = 0) => {
    setIsLoading(true);
    
    try {
      await HomeworkTracker.updateHomeworkProgress(homeworkId, progress, timeSpent);
      await loadAssignments();
    } catch (err) {
      console.error('Error updating homework progress:', err);
      setError('Failed to update progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateMilestoneProgress = async (projectId, milestoneId, progress) => {
    setIsLoading(true);
    
    try {
      await HomeworkTracker.updateMilestoneProgress(projectId, milestoneId, progress);
      await loadAssignments();
    } catch (err) {
      console.error('Error updating milestone progress:', err);
      setError('Failed to update progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkSubmitted = async (type, id) => {
    setIsLoading(true);
    
    try {
      if (type === 'homework') {
        await HomeworkTracker.markHomeworkSubmitted(id);
      } else if (type === 'project') {
        await HomeworkTracker.markProjectSubmitted(id);
      }
      await loadAssignments();
    } catch (err) {
      console.error('Error marking as submitted:', err);
      setError('Failed to mark as submitted. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply filters to assignments
  const getFilteredAssignments = (assignments, includeType) => {
    let filteredHomework = [...assignments.homework];
    let filteredProjects = [...assignments.projects];
    let filteredMilestones = [...assignments.milestones];
    
    // Apply subject filter (to homework and projects)
    if (filters.subject !== 'all') {
      filteredHomework = filteredHomework.filter(hw => 
        hw.subject.toLowerCase() === filters.subject.toLowerCase()
      );
      
      filteredProjects = filteredProjects.filter(proj => 
        proj.subject.toLowerCase() === filters.subject.toLowerCase()
      );
      
      // For milestones, filter based on the parent project's subject
      if (filteredProjects.length > 0) {
        const projectIds = filteredProjects.map(p => p.id);
        filteredMilestones = filteredMilestones.filter(ms => 
          projectIds.includes(ms.projectId)
        );
      } else {
        filteredMilestones = [];
      }
    }
    
    // Apply type filter
    if (filters.type !== 'all') {
      if (filters.type === 'homework') {
        filteredProjects = [];
        filteredMilestones = [];
      } else if (filters.type === 'project') {
        filteredHomework = [];
        // Keep milestones as they belong to projects
      } else if (filters.type === 'milestone') {
        filteredHomework = [];
        filteredProjects = [];
      }
    }
    
    // For "Today" tab, only include today's items
    if (includeType === 'today') {
      filteredHomework = filteredHomework.filter(hw => 
        isToday(hw.dueDate.toDate())
      );
      
      filteredProjects = filteredProjects.filter(proj => 
        isToday(proj.dueDate.toDate())
      );
      
      filteredMilestones = filteredMilestones.filter(ms => 
        isToday(ms.dueDate.toDate())
      );
    }
    // For "This Week" tab, only include this week's items
    else if (includeType === 'this-week') {
      filteredHomework = filteredHomework.filter(hw => 
        isThisWeek(hw.dueDate.toDate())
      );
      
      filteredProjects = filteredProjects.filter(proj => 
        isThisWeek(proj.dueDate.toDate())
      );
      
      filteredMilestones = filteredMilestones.filter(ms => 
        isThisWeek(ms.dueDate.toDate())
      );
    }
    
    return {
      homework: filteredHomework,
      projects: filteredProjects,
      milestones: filteredMilestones
    };
  };
  
  // Group assignments by date
  const groupAssignmentsByDate = (assignments) => {
    const grouped = {};
    
    // Add homework
    assignments.homework.forEach(hw => {
      const date = format(hw.dueDate.toDate(), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = { homework: [], projects: [], milestones: [] };
      }
      grouped[date].homework.push(hw);
    });
    
    // Add projects
    assignments.projects.forEach(proj => {
      const date = format(proj.dueDate.toDate(), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = { homework: [], projects: [], milestones: [] };
      }
      grouped[date].projects.push(proj);
    });
    
    // Add milestones
    assignments.milestones.forEach(ms => {
      const date = format(ms.dueDate.toDate(), 'yyyy-MM-dd');
      if (!grouped[date]) {
        grouped[date] = { homework: [], projects: [], milestones: [] };
      }
      grouped[date].milestones.push(ms);
    });
    
    return grouped;
  };
  
  // Get subject list for filter
  const getSubjectList = () => {
    const subjects = new Set();
    
    upcomingAssignments.homework.forEach(hw => {
      if (hw.subject) subjects.add(hw.subject.toLowerCase());
    });
    
    upcomingAssignments.projects.forEach(proj => {
      if (proj.subject) subjects.add(proj.subject.toLowerCase());
    });
    
    overdueAssignments.homework.forEach(hw => {
      if (hw.subject) subjects.add(hw.subject.toLowerCase());
    });
    
    overdueAssignments.projects.forEach(proj => {
      if (proj.subject) subjects.add(proj.subject.toLowerCase());
    });
    
    return ['all', ...Array.from(subjects)];
  };
  
  // Format date string
  const formatDateHeading = (dateString) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'EEEE, MMMM d, yyyy');
    }
  };
  
  // Filter and group assignments for different tabs
  const filteredOverdue = getFilteredAssignments(overdueAssignments, 'overdue');
  const filteredUpcoming = getFilteredAssignments(upcomingAssignments, 'upcoming');
  const filteredToday = getFilteredAssignments(upcomingAssignments, 'today');
  const filteredThisWeek = getFilteredAssignments(upcomingAssignments, 'this-week');
  
  const groupedOverdue = groupAssignmentsByDate(filteredOverdue);
  const groupedUpcoming = groupAssignmentsByDate(filteredUpcoming);
  const groupedToday = groupAssignmentsByDate(filteredToday);
  const groupedThisWeek = groupAssignmentsByDate(filteredThisWeek);
  
  // Sort dates
  const sortedOverdueDates = Object.keys(groupedOverdue).sort();
  const sortedUpcomingDates = Object.keys(groupedUpcoming).sort();
  const sortedTodayDates = Object.keys(groupedToday).sort();
  const sortedThisWeekDates = Object.keys(groupedThisWeek).sort();
  
  // Count items for badges
  const overdueCount = 
    filteredOverdue.homework.length + 
    filteredOverdue.projects.length + 
    filteredOverdue.milestones.length;
    
  const todayCount = 
    filteredToday.homework.length + 
    filteredToday.projects.length + 
    filteredToday.milestones.length;
  
  const thisWeekCount = 
    filteredThisWeek.homework.length + 
    filteredThisWeek.projects.length + 
    filteredThisWeek.milestones.length;
  
  if (!activeStudentId) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center text-gray-600">
          Please select a student to view their homework and projects.
        </p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          {activeStudent?.name}'s Assignments
        </h2>
      </div>
      
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded mx-4 my-2">
          {error}
        </div>
      )}
      
      {/* Filters */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <div className="flex space-x-2">
          <select
            value={filters.subject}
            onChange={(e) => setFilters({...filters, subject: e.target.value})}
            className="text-sm border border-gray-300 rounded px-3 py-1"
          >
            {getSubjectList().map(subject => (
              <option key={subject} value={subject}>
                {subject === 'all' ? 'All Subjects' : subject.charAt(0).toUpperCase() + subject.slice(1)}
              </option>
            ))}
          </select>
          
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="text-sm border border-gray-300 rounded px-3 py-1"
          >
            <option value="all">All Assignment Types</option>
            <option value="homework">Homework Only</option>
            <option value="project">Projects Only</option>
            <option value="milestone">Milestones Only</option>
          </select>
        </div>
        
        <button
          onClick={loadAssignments}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
      
      <Tab.Group>
        <Tab.List className="flex border-b border-gray-200">
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
            data-count={todayCount}
          >
            <div className="flex items-center">
              Today
              {todayCount > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {todayCount}
                </span>
              )}
            </div>
          </Tab>
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
            data-count={thisWeekCount}
          >
            <div className="flex items-center">
              This Week
              {thisWeekCount > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {thisWeekCount}
                </span>
              )}
            </div>
          </Tab>
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
          >
            Upcoming
          </Tab>
          <Tab 
            className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-red-600 border-b-2 border-red-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }
            data-count={overdueCount}
          >
            <div className="flex items-center">
              Overdue
              {overdueCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {overdueCount}
                </span>
              )}
            </div>
          </Tab>
        </Tab.List>
        
        <Tab.Panels className="p-4">
          {/* Today Tab */}
          <Tab.Panel>
            <AssignmentsList
              title="Today's Assignments"
              dates={sortedTodayDates}
              groupedAssignments={groupedToday}
              onUpdateHomeworkProgress={handleUpdateHomeworkProgress}
              onUpdateMilestoneProgress={handleUpdateMilestoneProgress}
              onMarkSubmitted={handleMarkSubmitted}
              emptyMessage="No assignments due today."
            />
          </Tab.Panel>
          
          {/* This Week Tab */}
          <Tab.Panel>
            <AssignmentsList
              title="This Week's Assignments"
              dates={sortedThisWeekDates}
              groupedAssignments={groupedThisWeek}
              onUpdateHomeworkProgress={handleUpdateHomeworkProgress}
              onUpdateMilestoneProgress={handleUpdateMilestoneProgress}
              onMarkSubmitted={handleMarkSubmitted}
              emptyMessage="No assignments due this week."
            />
          </Tab.Panel>
          
          {/* Upcoming Tab */}
          <Tab.Panel>
            <AssignmentsList
              title="Upcoming Assignments"
              dates={sortedUpcomingDates}
              groupedAssignments={groupedUpcoming}
              onUpdateHomeworkProgress={handleUpdateHomeworkProgress}
              onUpdateMilestoneProgress={handleUpdateMilestoneProgress}
              onMarkSubmitted={handleMarkSubmitted}
              emptyMessage="No upcoming assignments."
            />
          </Tab.Panel>
          
          {/* Overdue Tab */}
          <Tab.Panel>
            <AssignmentsList
              title="Overdue Assignments"
              dates={sortedOverdueDates}
              groupedAssignments={groupedOverdue}
              onUpdateHomeworkProgress={handleUpdateHomeworkProgress}
              onUpdateMilestoneProgress={handleUpdateMilestoneProgress}
              onMarkSubmitted={handleMarkSubmitted}
              emptyMessage="No overdue assignments. Great job!"
              overdue={true}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

function AssignmentsList({
  title,
  dates,
  groupedAssignments,
  onUpdateHomeworkProgress,
  onUpdateMilestoneProgress,
  onMarkSubmitted,
  emptyMessage,
  overdue = false
}) {
  if (dates.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">{emptyMessage}</h3>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {dates.map(date => {
        const assignments = groupedAssignments[date];
        const dateObj = new Date(date);
        const dateHeading = formatDateHeading(date);
        
        // Skip dates with no assignments
        const totalAssignments = 
          assignments.homework.length + 
          assignments.projects.length + 
          assignments.milestones.length;
          
        if (totalAssignments === 0) return null;
        
        return (
          <div key={date} className="border-t pt-4">
            <h3 className={`text-sm font-medium mb-3 ${
              isToday(dateObj) ? 'text-blue-600' :
              isTomorrow(dateObj) ? 'text-green-600' :
              isPast(dateObj) ? 'text-red-600' : 'text-gray-700'
            }`}>
              {dateHeading}
            </h3>
            
            <div className="space-y-3">
              {/* Homework assignments */}
              {assignments.homework.map(homework => (
                <HomeworkItem
                  key={`hw-${homework.id}`}
                  homework={homework}
                  onUpdateProgress={onUpdateHomeworkProgress}
                  onMarkSubmitted={onMarkSubmitted}
                  overdue={overdue}
                />
              ))}
              
              {/* Projects */}
              {assignments.projects.map(project => (
                <ProjectItem
                  key={`proj-${project.id}`}
                  project={project}
                  onMarkSubmitted={onMarkSubmitted}
                  overdue={overdue}
                />
              ))}
              
              {/* Milestones */}
              {assignments.milestones.map(milestone => (
                <MilestoneItem
                  key={`ms-${milestone.projectId}-${milestone.id}`}
                  milestone={milestone}
                  onUpdateProgress={onUpdateMilestoneProgress}
                  overdue={overdue}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatDateHeading(dateString) {
  const date = new Date(dateString);
  if (isToday(date)) {
    return 'Today';
  } else if (isTomorrow(date)) {
    return 'Tomorrow';
  } else {
    return format(date, 'EEEE, MMMM d, yyyy');
  }
}

function getSubjectBadgeColor(subject) {
  const subjectMap = {
    math: 'bg-blue-100 text-blue-800',
    science: 'bg-green-100 text-green-800',
    english: 'bg-purple-100 text-purple-800',
    history: 'bg-yellow-100 text-yellow-800',
    art: 'bg-pink-100 text-pink-800',
    music: 'bg-indigo-100 text-indigo-800',
    pe: 'bg-red-100 text-red-800',
    language: 'bg-teal-100 text-teal-800',
    default: 'bg-gray-100 text-gray-800'
  };
  
  const key = subject?.toLowerCase() || '';
  return subjectMap[key] || subjectMap.default;
}

function getPriorityBadgeColor(priority) {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getProgressColor(progress) {
  if (progress >= 75) {
    return 'bg-green-500';
  } else if (progress >= 50) {
    return 'bg-yellow-500';
  } else if (progress >= 25) {
    return 'bg-orange-500';
  } else {
    return 'bg-red-500';
  }
}

function HomeworkItem({ homework, onUpdateProgress, onMarkSubmitted, overdue }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [progressValue, setProgressValue] = useState(homework.progress || 0);
  const [timeSpent, setTimeSpent] = useState(0);
  
  const handleProgressChange = (e) => {
    setProgressValue(parseInt(e.target.value));
  };
  
  const handleTimeChange = (e) => {
    setTimeSpent(parseInt(e.target.value));
  };
  
  const handleSaveProgress = () => {
    onUpdateProgress(homework.id, progressValue, timeSpent);
    setTimeSpent(0);
  };
  
  const handleSubmitted = () => {
    onMarkSubmitted('homework', homework.id);
  };
  
  return (
    <div className={`border rounded-lg overflow-hidden ${
      overdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
    }`}>
      <div 
        className="p-4 flex justify-between items-start cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <div className="flex items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
              Homework
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubjectBadgeColor(homework.subject)}`}>
              {homework.subject}
            </span>
            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(homework.priority)}`}>
              {homework.priority.charAt(0).toUpperCase() + homework.priority.slice(1)}
            </span>
          </div>
          
          <h4 className="text-sm font-medium text-gray-900 mt-1">
            {homework.title}
          </h4>
          
          {homework.description && (
            <p className="text-xs text-gray-500 mt-1">
              {isExpanded 
                ? homework.description 
                : homework.description.length > 50 
                  ? homework.description.substring(0, 50) + '...' 
                  : homework.description
              }
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-500 mb-1">
            Due: {format(homework.dueDate.toDate(), 'MMM d, h:mm a')}
          </div>
          
          <div className="w-24 bg-gray-200 rounded-full h-2.5 mt-1">
            <div 
              className={`h-2.5 rounded-full ${getProgressColor(homework.progress)}`}
              style={{ width: `${homework.progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {homework.progress}% complete
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex flex-col space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Progress ({progressValue}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressValue}
                onChange={handleProgressChange}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Time Spent (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={timeSpent}
                onChange={handleTimeChange}
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleSaveProgress}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Progress
              </button>
              
              <button
                onClick={handleSubmitted}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                Mark Submitted
              </button>
            </div>
            
            {homework.estimatedTimeMinutes > 0 && (
              <div className="text-xs text-gray-500">
                Estimated time: {homework.estimatedTimeMinutes} minutes
                {homework.timeSpentMinutes > 0 && ` • Time spent so far: ${homework.timeSpentMinutes} minutes`}
              </div>
            )}
            
            {homework.className && (
              <div className="text-xs text-gray-500">
                Class: {homework.className}
                {homework.teacherName && ` • Teacher: ${homework.teacherName}`}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectItem({ project, onMarkSubmitted, overdue }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleSubmitted = () => {
    onMarkSubmitted('project', project.id);
  };
  
  return (
    <div className={`border rounded-lg overflow-hidden ${
      overdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
    }`}>
      <div 
        className="p-4 flex justify-between items-start cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <div className="flex items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
              Project
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubjectBadgeColor(project.subject)}`}>
              {project.subject}
            </span>
            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityBadgeColor(project.priority)}`}>
              {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
            </span>
          </div>
          
          <h4 className="text-sm font-medium text-gray-900 mt-1">
            {project.title}
          </h4>
          
          {project.description && (
            <p className="text-xs text-gray-500 mt-1">
              {isExpanded 
                ? project.description 
                : project.description.length > 50 
                  ? project.description.substring(0, 50) + '...' 
                  : project.description
              }
            </p>
          )}
          
          {!isExpanded && project.milestones && project.milestones.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {project.milestones.length} milestones
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-500 mb-1">
            Due: {format(project.dueDate.toDate(), 'MMM d, h:mm a')}
          </div>
          
          <div className="w-24 bg-gray-200 rounded-full h-2.5 mt-1">
            <div 
              className={`h-2.5 rounded-full ${getProgressColor(project.progress)}`}
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {project.progress}% complete
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="mb-3">
            <button
              onClick={handleSubmitted}
              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Mark Project Submitted
            </button>
          </div>
          
          {project.milestones && project.milestones.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-700 mb-2">
                Milestones
              </h5>
              
              <div className="space-y-2">
                {project.milestones.map(milestone => (
                  <div 
                    key={milestone.id}
                    className="border border-gray-200 rounded p-2 bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h6 className="text-xs font-medium text-gray-900">
                          {milestone.title}
                        </h6>
                        
                        <p className="text-xs text-gray-500">
                          {milestone.description}
                        </p>
                        
                        {milestone.dueDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {format(milestone.dueDate.toDate(), 'MMM d')}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {milestone.status === 'completed' ? 'Complete' : 
                         milestone.status === 'in_progress' ? 'In Progress' : 
                         'Not Started'}
                        {milestone.progress > 0 && ` (${milestone.progress}%)`}
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div 
                        className={`h-1.5 rounded-full ${getProgressColor(milestone.progress)}`}
                        style={{ width: `${milestone.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {project.className && (
            <div className="text-xs text-gray-500 mt-3">
              Class: {project.className}
              {project.teacherName && ` • Teacher: ${project.teacherName}`}
            </div>
          )}
          
          {project.estimatedTimeHours > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Estimated time: {project.estimatedTimeHours} hours
              {project.timeSpentHours > 0 && ` • Time spent so far: ${project.timeSpentHours} hours`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MilestoneItem({ milestone, onUpdateProgress, overdue }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [progressValue, setProgressValue] = useState(milestone.progress || 0);
  
  const handleProgressChange = (e) => {
    setProgressValue(parseInt(e.target.value));
  };
  
  const handleSaveProgress = () => {
    onUpdateProgress(milestone.projectId, milestone.id, progressValue);
  };
  
  return (
    <div className={`border rounded-lg overflow-hidden ${
      overdue ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'
    }`}>
      <div 
        className="p-4 flex justify-between items-start cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <div className="flex items-center">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-2">
              Milestone
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSubjectBadgeColor(milestone.subject)}`}>
              {milestone.subject}
            </span>
          </div>
          
          <h4 className="text-sm font-medium text-gray-900 mt-1">
            {milestone.title}
          </h4>
          
          <p className="text-xs text-gray-500 mt-1">
            Project: {milestone.projectTitle}
          </p>
          
          {milestone.description && (
            <p className="text-xs text-gray-500 mt-1">
              {isExpanded 
                ? milestone.description 
                : milestone.description.length > 50 
                  ? milestone.description.substring(0, 50) + '...' 
                  : milestone.description
              }
            </p>
          )}
        </div>
        
        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-500 mb-1">
            Due: {format(milestone.dueDate.toDate(), 'MMM d, h:mm a')}
          </div>
          
          <div className="w-24 bg-gray-200 rounded-full h-2.5 mt-1">
            <div 
              className={`h-2.5 rounded-full ${getProgressColor(milestone.progress)}`}
              style={{ width: `${milestone.progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {milestone.progress}% complete
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex flex-col space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Progress ({progressValue}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressValue}
                onChange={handleProgressChange}
                className="w-full"
              />
            </div>
            
            <div>
              <button
                onClick={handleSaveProgress}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

HomeworkManager.propTypes = {
  selectedStudentId: PropTypes.string
};

export default HomeworkManager;