import React, { useState, useEffect } from 'react';
import { Truck, Calendar, Search, Plus, Edit, Trash2, Check, X, Users, MapPin, Clock, ChevronRight, ArrowDown, ArrowUp } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import ActivityManager from '../../services/ActivityManager';
import { format, addDays, startOfWeek } from 'date-fns';

const TransportationManager = ({ transportation: initialTransportation, onUpdateTransportation }) => {
  const { selectedUser, familyMembers } = useFamily();
  const [transportation, setTransportation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedArrangement, setSelectedArrangement] = useState(null);
  const [showCarpoolMembers, setShowCarpoolMembers] = useState({});
  const [activities, setActivities] = useState([]);
  const [carpoolMembers, setCarpoolMembers] = useState([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: addDays(new Date(), 14)  // 2 weeks
  });
  const [filters, setFilters] = useState({
    status: 'all',  // all, planned, confirmed, completed
    type: 'all',    // all, dropoff, pickup, carpool, public, walk
    assignedTo: 'all'  // all, me, unassigned, others
  });
  const [sortBy, setSortBy] = useState('date');  // date, activity, type
  const [sortDirection, setSortDirection] = useState('asc');
  const [groupBy, setGroupBy] = useState('date');  // date, activity, type, assignedTo
  
  // Form for new transportation arrangement
  const [formData, setFormData] = useState({
    activityId: '',
    type: 'dropoff',
    isRecurring: true,
    day: new Date().getDay(),
    specificDate: format(new Date(), 'yyyy-MM-dd'),
    assignedTo: '',
    assignedToName: '',
    status: 'planned',
    details: '',
    carpoolMembers: []
  });
  
  useEffect(() => {
    if (initialTransportation) {
      setTransportation(initialTransportation);
    } else if (selectedUser?.familyId) {
      loadTransportation();
    }
    
    loadActivities();
  }, [selectedUser, initialTransportation, dateRange]);
  
  const loadTransportation = async () => {
    setIsLoading(true);
    
    try {
      const transportationNeeds = await ActivityManager.getTransportationNeeds(
        selectedUser.familyId,
        dateRange.start,
        dateRange.end
      );
      setTransportation(transportationNeeds);
    } catch (error) {
      console.error('Error loading transportation:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadActivities = async () => {
    try {
      const activityList = await ActivityManager.getActivitiesForFamily(
        selectedUser.familyId,
        { isActive: true }
      );
      setActivities(activityList);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const updateDateRange = (weeks) => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today);
    
    setDateRange({
      start: today,
      end: addDays(startOfCurrentWeek, weeks * 7)
    });
  };
  
  const toggleCarpoolMembers = (id) => {
    setShowCarpoolMembers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const selectedActivity = activities.find(a => a.id === formData.activityId);
      
      if (!selectedActivity) {
        throw new Error('Activity not found');
      }
      
      // Prepare the arrangement data
      const arrangementData = {
        id: showEditForm && selectedArrangement ? selectedArrangement.id : `new-${Date.now()}`,
        type: formData.type,
        day: formData.isRecurring ? parseInt(formData.day) : null,
        specificDate: !formData.isRecurring ? new Date(formData.specificDate) : null,
        assignedTo: formData.assignedTo,
        assignedToName: formData.assignedToName,
        status: formData.status,
        details: formData.details,
        carpoolMembers: formData.carpoolMembers || []
      };
      
      // Get current transportation arrangements
      const currentArrangements = selectedActivity.transportationArrangements || [];
      
      let updatedArrangements;
      
      if (showEditForm && selectedArrangement) {
        // Edit existing arrangement
        updatedArrangements = currentArrangements.map(arr => 
          arr.id === selectedArrangement.id ? arrangementData : arr
        );
      } else {
        // Add new arrangement
        updatedArrangements = [...currentArrangements, arrangementData];
      }
      
      // Update transportation in activity
      await ActivityManager.updateTransportation(selectedActivity.id, updatedArrangements);
      
      // Refresh data
      await loadTransportation();
      
      // Call the callback if provided
      if (onUpdateTransportation) {
        onUpdateTransportation(selectedActivity.id, updatedArrangements);
      }
      
      // Reset form and state
      resetForm();
    } catch (error) {
      console.error('Error saving transportation arrangement:', error);
      alert('Failed to save arrangement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = (arrangement) => {
    setSelectedArrangement(arrangement);
    
    // Convert date objects for form
    let specificDate = '';
    if (arrangement.specificDate) {
      const date = arrangement.specificDate instanceof Date 
        ? arrangement.specificDate 
        : arrangement.specificDate.toDate();
      specificDate = format(date, 'yyyy-MM-dd');
    }
    
    setFormData({
      activityId: arrangement.activityId,
      type: arrangement.type || 'dropoff',
      isRecurring: arrangement.day !== null && arrangement.day !== undefined,
      day: arrangement.day !== null ? arrangement.day : new Date().getDay(),
      specificDate: specificDate || format(new Date(), 'yyyy-MM-dd'),
      assignedTo: arrangement.assignedTo || '',
      assignedToName: arrangement.assignedToName || '',
      status: arrangement.status || 'planned',
      details: arrangement.details || '',
      carpoolMembers: arrangement.carpoolMembers || []
    });
    
    setShowEditForm(true);
    setShowAddForm(false);
  };
  
  const handleDelete = async (arrangement) => {
    if (!window.confirm(`Are you sure you want to delete this transportation arrangement?`)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const selectedActivity = activities.find(a => a.id === arrangement.activityId);
      
      if (!selectedActivity) {
        throw new Error('Activity not found');
      }
      
      // Get current transportation arrangements
      const currentArrangements = selectedActivity.transportationArrangements || [];
      
      // Filter out the arrangement to delete
      const updatedArrangements = currentArrangements.filter(arr => arr.id !== arrangement.id);
      
      // Update transportation in activity
      await ActivityManager.updateTransportation(selectedActivity.id, updatedArrangements);
      
      // Refresh data
      await loadTransportation();
      
      // Call the callback if provided
      if (onUpdateTransportation) {
        onUpdateTransportation(selectedActivity.id, updatedArrangements);
      }
    } catch (error) {
      console.error('Error deleting transportation arrangement:', error);
      alert('Failed to delete arrangement. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateStatus = async (arrangement, newStatus) => {
    setIsLoading(true);
    
    try {
      const selectedActivity = activities.find(a => a.id === arrangement.activityId);
      
      if (!selectedActivity) {
        throw new Error('Activity not found');
      }
      
      // Get current transportation arrangements
      const currentArrangements = selectedActivity.transportationArrangements || [];
      
      // Update status of the specific arrangement
      const updatedArrangements = currentArrangements.map(arr => 
        arr.id === arrangement.id ? { ...arr, status: newStatus } : arr
      );
      
      // Update transportation in activity
      await ActivityManager.updateTransportation(selectedActivity.id, updatedArrangements);
      
      // Refresh data
      await loadTransportation();
      
      // Call the callback if provided
      if (onUpdateTransportation) {
        onUpdateTransportation(selectedActivity.id, updatedArrangements);
      }
    } catch (error) {
      console.error('Error updating transportation status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAssignTransportation = async (arrangement, memberId, memberName) => {
    setIsLoading(true);
    
    try {
      // Use the service to assign transportation
      await ActivityManager.assignTransportation(
        arrangement.activityId,
        arrangement.id,
        memberId,
        memberName
      );
      
      // Refresh data
      await loadTransportation();
    } catch (error) {
      console.error('Error assigning transportation:', error);
      alert('Failed to assign transportation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddCarpoolMember = async (arrangement, member) => {
    setIsLoading(true);
    
    try {
      // Use the service to add carpool member
      await ActivityManager.addCarpoolMember(
        arrangement.activityId,
        arrangement.id,
        member
      );
      
      // Refresh data
      await loadTransportation();
    } catch (error) {
      console.error('Error adding carpool member:', error);
      alert('Failed to add carpool member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveCarpoolMember = async (arrangement, memberId) => {
    setIsLoading(true);
    
    try {
      // Use the service to remove carpool member
      await ActivityManager.removeCarpoolMember(
        arrangement.activityId,
        arrangement.id,
        memberId
      );
      
      // Refresh data
      await loadTransportation();
    } catch (error) {
      console.error('Error removing carpool member:', error);
      alert('Failed to remove carpool member. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      activityId: '',
      type: 'dropoff',
      isRecurring: true,
      day: new Date().getDay(),
      specificDate: format(new Date(), 'yyyy-MM-dd'),
      assignedTo: '',
      assignedToName: '',
      status: 'planned',
      details: '',
      carpoolMembers: []
    });
    setSelectedArrangement(null);
    setShowAddForm(false);
    setShowEditForm(false);
  };
  
  // Filter and sort transportation
  const processedTransportation = transportation
    // Apply filters
    .filter(item => {
      // Search term
      if (searchTerm && !item.activityName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.participantName?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.details?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.assignedToName?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }
      
      // Type filter
      if (filters.type !== 'all' && item.type !== filters.type) {
        return false;
      }
      
      // Assignment filter
      if (filters.assignedTo !== 'all') {
        if (filters.assignedTo === 'me' && item.assignedTo !== selectedUser.id) {
          return false;
        } else if (filters.assignedTo === 'unassigned' && item.assignedTo) {
          return false;
        } else if (filters.assignedTo === 'others' && (!item.assignedTo || item.assignedTo === selectedUser.id)) {
          return false;
        }
      }
      
      return true;
    })
    // Apply sorting
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = a.date instanceof Date ? a.date : new Date(a.date);
          bValue = b.date instanceof Date ? b.date : new Date(b.date);
          break;
        case 'activity':
          aValue = a.activityName || '';
          bValue = b.activityName || '';
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'status':
          const statusOrder = { planned: 0, confirmed: 1, completed: 2 };
          aValue = statusOrder[a.status] || 3;
          bValue = statusOrder[b.status] || 3;
          break;
        default:
          aValue = a.date instanceof Date ? a.date : new Date(a.date);
          bValue = b.date instanceof Date ? b.date : new Date(b.date);
      }
      
      // Apply sort direction
      const directionMultiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return -1 * directionMultiplier;
      if (aValue > bValue) return 1 * directionMultiplier;
      return 0;
    });
  
  // Group transportation (if grouping is active)
  const groupedTransportation = processedTransportation.reduce((groups, item) => {
    let groupKey;
    
    switch (groupBy) {
      case 'date':
        // Group by date (today, tomorrow, this week, next week)
        const itemDate = item.date instanceof Date ? item.date : new Date(item.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(nextWeekStart.getDate() + (7 - nextWeekStart.getDay()));
        
        if (itemDate.getTime() === today.getTime()) {
          groupKey = 'Today';
        } else if (itemDate.getTime() === tomorrow.getTime()) {
          groupKey = 'Tomorrow';
        } else if (itemDate < nextWeekStart) {
          groupKey = 'This Week';
        } else {
          groupKey = 'Later';
        }
        break;
      case 'activity':
        groupKey = item.activityName || 'Unknown Activity';
        break;
      case 'type':
        groupKey = item.type?.charAt(0).toUpperCase() + item.type?.slice(1) || 'Other';
        break;
      case 'assignedTo':
        if (!item.assignedTo) {
          groupKey = 'Unassigned';
        } else if (item.assignedTo === selectedUser.id) {
          groupKey = 'Assigned to Me';
        } else {
          groupKey = `Assigned to ${item.assignedToName || 'Others'}`;
        }
        break;
      default:
        groupKey = 'All Transportation';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(item);
    return groups;
  }, {});
  
  // Generate sorted group headers based on groupBy
  const getSortedGroupHeaders = () => {
    const headers = Object.keys(groupedTransportation);
    
    // If grouping by date, use a specific order
    if (groupBy === 'date') {
      const order = { 'Today': 0, 'Tomorrow': 1, 'This Week': 2, 'Later': 3 };
      return headers.sort((a, b) => order[a] - order[b]);
    }
    
    // Default sort alphabetically
    return headers.sort();
  };
  
  const groupHeaders = getSortedGroupHeaders();
  
  const EmptyStateMessage = () => (
    <div className="text-center py-8">
      <Truck size={48} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Transportation Arrangements</h3>
      <p className="text-gray-500 mb-6">
        {searchTerm || filters.status !== 'all' || filters.type !== 'all'
          ? 'Try adjusting your filters or search term'
          : 'Add transportation arrangements to coordinate drop-offs, pick-ups, and carpools'}
      </p>
      <button
        onClick={() => {
          setShowAddForm(true);
          setShowEditForm(false);
        }}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
      >
        <Plus size={16} className="mr-2" />
        Add Transportation
      </button>
    </div>
  );
  
  // Render the transportation card
  const TransportationCard = ({ item }) => {
    // Format the date display
    const formattedDate = item.date instanceof Date 
      ? format(item.date, 'EEE, MMM d') 
      : format(new Date(item.date), 'EEE, MMM d');
    
    // Get status color
    const getStatusColor = (status) => {
      switch (status) {
        case 'planned': return 'bg-amber-100 text-amber-800';
        case 'confirmed': return 'bg-blue-100 text-blue-800';
        case 'completed': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    
    // Get type icon
    const getTypeIcon = (type) => {
      switch (type) {
        case 'dropoff': return <ArrowDown size={14} className="mr-1" />;
        case 'pickup': return <ArrowUp size={14} className="mr-1" />;
        case 'carpool': return <Users size={14} className="mr-1" />;
        default: return <Truck size={14} className="mr-1" />;
      }
    };
    
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <h3 className="font-medium text-gray-900 flex items-center">
                {getTypeIcon(item.type)}
                <span className="capitalize">{item.type}</span>
              </h3>
              <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </span>
            </div>
            
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Calendar size={14} className="mr-1 text-gray-400" />
              <span>{formattedDate}</span>
              
              {item.time && (
                <>
                  <span className="mx-1">•</span>
                  <Clock size={14} className="mr-1 text-gray-400" />
                  <span>{item.time}</span>
                </>
              )}
            </div>
            
            <p className="text-sm font-medium text-gray-800 mt-1">
              {item.activityName} • {item.participantName}
            </p>
            
            {item.location && (
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <MapPin size={12} className="mr-1 text-gray-400" />
                <span>{item.location}</span>
              </div>
            )}
            
            {item.details && (
              <p className="text-xs text-gray-500 mt-1">{item.details}</p>
            )}
          </div>
          
          <div className="flex flex-col items-end">
            {item.assignedToName ? (
              <div className="text-sm font-medium text-green-600">
                {item.assignedTo === selectedUser.id ? 'You' : item.assignedToName}
              </div>
            ) : (
              <div className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                Needs assignment
              </div>
            )}
            
            <div className="flex space-x-1 mt-2">
              <button
                onClick={() => handleEdit(item)}
                className="p-1 text-gray-400 hover:text-blue-600"
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(item)}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Carpool members section */}
        {item.carpoolMembers && item.carpoolMembers.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => toggleCarpoolMembers(item.id)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Users size={16} className="mr-1" />
              <span>Carpool: {item.carpoolMembers.length} members</span>
              <ChevronRight 
                size={16} 
                className={`ml-1 transition-transform ${showCarpoolMembers[item.id] ? 'rotate-90' : ''}`} 
              />
            </button>
            
            {showCarpoolMembers[item.id] && (
              <div className="mt-2 pl-6 border-l-2 border-gray-200 space-y-2">
                {item.carpoolMembers.map(member => (
                  <div key={member.id} className="text-sm">
                    <div className="font-medium">{member.name}</div>
                    {member.address && (
                      <div className="text-xs text-gray-500 flex items-center">
                        <MapPin size={12} className="mr-1" />
                        {member.address}
                      </div>
                    )}
                    {member.notes && (
                      <div className="text-xs text-gray-500 mt-1">{member.notes}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Action buttons */}
        <div className="mt-3 flex justify-end">
          {!item.assignedTo && (
            <button
              onClick={() => handleAssignTransportation(item, selectedUser.id, selectedUser.name)}
              className="mr-2 inline-flex items-center text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              <Check size={12} className="mr-1" />
              Assign to Me
            </button>
          )}
          
          {item.status === 'planned' && (
            <button
              onClick={() => handleUpdateStatus(item, 'confirmed')}
              className="mr-2 inline-flex items-center text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              <Check size={12} className="mr-1" />
              Confirm
            </button>
          )}
          
          {item.status === 'confirmed' && (
            <button
              onClick={() => handleUpdateStatus(item, 'completed')}
              className="inline-flex items-center text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              <Check size={12} className="mr-1" />
              Complete
            </button>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3 sm:mb-0">Transportation</h2>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transportation..."
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md"
            />
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <button
            onClick={() => {
              setShowAddForm(true);
              setShowEditForm(false);
            }}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
          >
            <Plus size={16} className="mr-1" />
            Add
          </button>
        </div>
      </div>
      
      {/* Date range selector */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">View transportation for:</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => updateDateRange(1)}
            className={`px-3 py-1 text-sm rounded ${
              dateRange.end.getTime() - dateRange.start.getTime() <= 7 * 24 * 60 * 60 * 1000
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            1 week
          </button>
          <button
            onClick={() => updateDateRange(2)}
            className={`px-3 py-1 text-sm rounded ${
              dateRange.end.getTime() - dateRange.start.getTime() <= 14 * 24 * 60 * 60 * 1000 &&
              dateRange.end.getTime() - dateRange.start.getTime() > 7 * 24 * 60 * 60 * 1000
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            2 weeks
          </button>
          <button
            onClick={() => updateDateRange(4)}
            className={`px-3 py-1 text-sm rounded ${
              dateRange.end.getTime() - dateRange.start.getTime() <= 30 * 24 * 60 * 60 * 1000 &&
              dateRange.end.getTime() - dateRange.start.getTime() > 14 * 24 * 60 * 60 * 1000
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            1 month
          </button>
        </div>
      </div>
      
      {/* Add/Edit Form */}
      {(showAddForm || showEditForm) && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {showEditForm ? 'Edit Transportation' : 'Add New Transportation'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Activity*
                </label>
                <select
                  name="activityId"
                  value={formData.activityId}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  disabled={showEditForm}
                >
                  <option value="">Select an activity</option>
                  {activities.map(activity => (
                    <option key={activity.id} value={activity.id}>
                      {activity.name} ({activity.participantName})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="dropoff">Drop-off</option>
                  <option value="pickup">Pick-up</option>
                  <option value="carpool">Carpool</option>
                  <option value="public">Public Transport</option>
                  <option value="walk">Walking</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRecurring"
                  name="isRecurring"
                  checked={formData.isRecurring}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700">
                  Recurring (weekly)
                </label>
              </div>
            </div>
            
            <div className="mb-4">
              {formData.isRecurring ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Day of Week
                  </label>
                  <select
                    name="day"
                    value={formData.day}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="0">Sunday</option>
                    <option value="1">Monday</option>
                    <option value="2">Tuesday</option>
                    <option value="3">Wednesday</option>
                    <option value="4">Thursday</option>
                    <option value="5">Friday</option>
                    <option value="6">Saturday</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Date
                  </label>
                  <input
                    type="date"
                    name="specificDate"
                    value={formData.specificDate}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={(e) => {
                    const memberId = e.target.value;
                    let memberName = '';
                    
                    if (memberId) {
                      const member = familyMembers.find(m => m.id === memberId);
                      if (member) {
                        memberName = member.name;
                      }
                    }
                    
                    setFormData({
                      ...formData,
                      assignedTo: memberId,
                      assignedToName: memberName
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Unassigned</option>
                  {familyMembers.filter(m => m.role === 'parent' || m.relationship === 'parent').map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="planned">Planned</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Details
              </label>
              <textarea
                name="details"
                value={formData.details}
                onChange={handleInputChange}
                rows={2}
                placeholder="Add any additional information..."
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            {formData.type === 'carpool' && (
              <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Carpool Members</h4>
                <p className="text-xs text-gray-500 mb-3">
                  You can add carpool members after creating the arrangement.
                </p>
              </div>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md mr-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : (showEditForm ? 'Update' : 'Add')}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Filters and Sorting */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Statuses</option>
          <option value="planned">Planned</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
        </select>
        
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Types</option>
          <option value="dropoff">Drop-off</option>
          <option value="pickup">Pick-up</option>
          <option value="carpool">Carpool</option>
          <option value="public">Public Transport</option>
          <option value="walk">Walking</option>
          <option value="other">Other</option>
        </select>
        
        <select
          value={filters.assignedTo}
          onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Assignments</option>
          <option value="me">Assigned to Me</option>
          <option value="unassigned">Unassigned</option>
          <option value="others">Assigned to Others</option>
        </select>
        
        <div className="flex-grow"></div>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Group by:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="date">Date</option>
            <option value="activity">Activity</option>
            <option value="type">Type</option>
            <option value="assignedTo">Assignment</option>
            <option value="none">No Grouping</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="date">By Date</option>
            <option value="activity">By Activity</option>
            <option value="type">By Type</option>
            <option value="status">By Status</option>
          </select>
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="p-1 ml-1 text-gray-500 hover:text-gray-700"
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDirection === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          </button>
        </div>
      </div>
      
      {/* Transportation List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : processedTransportation.length === 0 ? (
        <EmptyStateMessage />
      ) : groupBy === 'none' ? (
        <div className="space-y-4">
          {processedTransportation.map(item => (
            <TransportationCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {groupHeaders.map(header => (
            <div key={header}>
              <h3 className="text-lg font-medium text-gray-900 mb-3 border-b border-gray-200 pb-2">
                {header}
              </h3>
              <div className="space-y-4">
                {groupedTransportation[header].map(item => (
                  <TransportationCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransportationManager;