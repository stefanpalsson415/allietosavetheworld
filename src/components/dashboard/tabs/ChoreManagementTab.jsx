// src/components/dashboard/tabs/ChoreManagementTab.jsx
import React, { useState } from 'react';
import { 
  Plus, 
  Pencil, 
  Calendar, 
  ClipboardList, 
  Users, 
  Search,
  Filter,
  RefreshCw,
  DollarSign,
  CheckCircle,
  AlertCircle,
  PanelLeft,
  Settings,
  Sliders
} from 'lucide-react';
import { useChore } from '../../../contexts/ChoreContext';
import UserAvatar from '../../common/UserAvatar';
import ChoreTemplateCreator from '../../chore/ChoreTemplateCreator';
import ChoreScheduler from '../../chore/ChoreScheduler';
import ChoreApprovalQueue from '../../chore/ChoreApprovalQueue';

/**
 * ChoreManagementTab - Parent view for managing chores, templates, schedules and approvals
 */
const ChoreManagementTab = () => {
  // Get data from context
  const { 
    choreTemplates,
    pendingApprovals,
    loadChoreTemplates,
    loadPendingApprovals,
    isLoadingChores
  } = useChore();
  
  // Local state
  const [activeTab, setActiveTab] = useState('templates');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);
  const [showScheduleCreator, setShowScheduleCreator] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Fetch data if needed
  React.useEffect(() => {
    if (activeTab === 'templates' && choreTemplates.length === 0) {
      loadChoreTemplates();
    } else if (activeTab === 'approvals' && pendingApprovals.length === 0) {
      loadPendingApprovals();
    }
  }, [activeTab, choreTemplates.length, pendingApprovals.length, loadChoreTemplates, loadPendingApprovals]);
  
  // Filter templates based on search and filter
  const filteredTemplates = choreTemplates.filter(template => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesFilter = selectedFilter === 'all' || template.category === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });
  
  // Handle refreshing data
  const handleRefresh = () => {
    if (activeTab === 'templates') {
      loadChoreTemplates();
    } else if (activeTab === 'approvals') {
      loadPendingApprovals();
    }
  };
  
  // Navigation tabs
  const tabs = [
    { id: 'templates', label: 'Templates', icon: <ClipboardList size={18} /> },
    { id: 'schedule', label: 'Schedule', icon: <Calendar size={18} /> },
    { id: 'approvals', label: 'Approvals', icon: <CheckCircle size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> }
  ];
  
  // Render tab navigation
  const renderTabNavigation = () => (
    <div className="flex border-b mb-6">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`flex items-center px-4 py-3 font-medium ${
            activeTab === tab.id 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon}
          <span className="ml-2">{tab.label}</span>
          
          {/* Badge for approvals */}
          {tab.id === 'approvals' && pendingApprovals.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {pendingApprovals.length}
            </span>
          )}
        </button>
      ))}
    </div>
  );
  
  // Render templates tab content
  const renderTemplatesTab = () => (
    <div>
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="relative w-full sm:w-64">
          <Search size={18} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search templates..."
            className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative">
            <button 
              className="px-3 py-2 border border-gray-300 rounded-md flex items-center text-gray-700 hover:bg-gray-50"
              onClick={() => setSelectedFilter(selectedFilter === 'all' ? 'all' : 'all')}
            >
              <Filter size={16} className="mr-1" />
              <span>Filter</span>
            </button>
            
            {/* Filter dropdown would go here */}
          </div>
          
          <button 
            className="px-3 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={handleRefresh}
            disabled={isLoadingChores}
          >
            <RefreshCw size={18} className={isLoadingChores ? 'animate-spin' : ''} />
          </button>
          
          <button 
            className="px-3 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 flex items-center whitespace-nowrap"
            onClick={() => setShowTemplateCreator(true)}
          >
            <Plus size={18} className="mr-1" />
            <span>New Template</span>
          </button>
        </div>
      </div>
      
      {/* Templates grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => (
          <div 
            key={template.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-bold text-lg">{template.title}</h3>
              <button 
                className="text-gray-500 hover:text-blue-600"
                onClick={() => setEditingTemplate(template)}
              >
                <Pencil size={16} />
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{template.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {template.category && (
                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                  {template.category}
                </span>
              )}
              
              {template.timeOfDay && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                  {template.timeOfDay}
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-600">
                <DollarSign size={16} />
                <span className="font-bold">{template.bucksAwarded}</span>
              </div>
              
              <button 
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200"
                onClick={() => {
                  setShowScheduleCreator(true);
                  // Set selected template for scheduling
                }}
              >
                Schedule
              </button>
            </div>
          </div>
        ))}
        
        {/* Add new template card */}
        <div 
          className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors h-52"
          onClick={() => setShowTemplateCreator(true)}
        >
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
            <Plus size={24} className="text-blue-600" />
          </div>
          <p className="font-medium text-blue-600">Create New Template</p>
          <p className="text-sm text-gray-500 text-center mt-1">
            Add a new chore template for your family
          </p>
        </div>
        
        {/* Empty state */}
        {filteredTemplates.length === 0 && choreTemplates.length > 0 && (
          <div className="col-span-full bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-600">No templates match your filters.</p>
            <button 
              className="mt-2 text-blue-600 hover:text-blue-800"
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('all');
              }}
            >
              Clear filters
            </button>
          </div>
        )}
        
        {/* Loading state */}
        {isLoadingChores && (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {/* Empty initial state */}
        {!isLoadingChores && choreTemplates.length === 0 && (
          <div className="col-span-full bg-blue-50 rounded-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-blue-800 mb-2">No Chore Templates Yet</h3>
            <p className="text-blue-600 mb-4">
              Create your first chore template to get started with the family chore system.
            </p>
            <button 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => setShowTemplateCreator(true)}
            >
              <Plus size={18} className="inline mr-1" />
              Create First Template
            </button>
          </div>
        )}
      </div>
    </div>
  );
  
  // Render approvals tab content
  const renderApprovalsTab = () => (
    <ChoreApprovalQueue isEmbedded={true} onRefresh={loadPendingApprovals} />
  );
  
  // Render schedule tab content (stub)
  const renderScheduleTab = () => (
    <div className="bg-yellow-50 rounded-lg p-8 text-center">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Calendar size={32} className="text-yellow-600" />
      </div>
      <h3 className="text-lg font-bold text-yellow-800 mb-2">Coming Soon</h3>
      <p className="text-yellow-600 mb-4">
        The chore scheduling interface is currently in development.
      </p>
      <button 
        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        onClick={() => setShowScheduleCreator(true)}
      >
        Try Schedule Creator
      </button>
    </div>
  );
  
  // Render settings tab content (stub)
  const renderSettingsTab = () => (
    <div>
      <h2 className="text-xl font-bold mb-6">Chore System Settings</h2>
      
      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">Automatic Generation</h3>
              <p className="text-sm text-gray-600">Automatically generate chore instances each day</p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">Approval Required</h3>
              <p className="text-sm text-gray-600">Require parent approval for chore completion</p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">Post to Family Story</h3>
              <p className="text-sm text-gray-600">Share chore completion in the family story stream</p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">Automatic Rewards</h3>
              <p className="text-sm text-gray-600">Automatically credit Palsson Bucks when chores are approved</p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Save Settings
        </button>
      </div>
    </div>
  );
  
  // Render the active tab content
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'templates':
        return renderTemplatesTab();
      case 'schedule':
        return renderScheduleTab();
      case 'approvals':
        return renderApprovalsTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderTemplatesTab();
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Tab navigation */}
      {renderTabNavigation()}
      
      {/* Tab content */}
      <div className="flex-grow overflow-auto">
        {renderActiveTabContent()}
      </div>
      
      {/* Template creator modal */}
      {showTemplateCreator && (
        <ChoreTemplateCreator 
          onClose={() => setShowTemplateCreator(false)}
          editingTemplate={editingTemplate}
          onSave={() => {
            loadChoreTemplates();
            setShowTemplateCreator(false);
            setEditingTemplate(null);
          }}
        />
      )}
      
      {/* Schedule creator modal */}
      {showScheduleCreator && (
        <ChoreScheduler 
          onClose={() => setShowScheduleCreator(false)}
          selectedTemplate={editingTemplate}
          onSave={() => {
            setShowScheduleCreator(false);
          }}
        />
      )}
    </div>
  );
};

export default ChoreManagementTab;