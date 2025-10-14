import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, Search, Edit, Trash2, ArrowDown, ArrowUp, ExternalLink, Check, X } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import ActivityManager from '../../services/ActivityManager';

const EquipmentManager = ({ equipment: initialEquipment, onUpdateEquipment }) => {
  const { selectedUser, familyMembers } = useFamily();
  const [equipment, setEquipment] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [sortBy, setSortBy] = useState('status'); // status, activity, name
  const [sortDirection, setSortDirection] = useState('asc');
  const [groupBy, setGroupBy] = useState('activity'); // activity, type, status
  const [filters, setFilters] = useState({
    status: 'all', // all, needed, owned, borrowed
    type: 'all',   // all, equipment, uniform, supplies
  });
  
  // Form for new equipment
  const [formData, setFormData] = useState({
    activityId: '',
    name: '',
    description: '',
    type: 'equipment',
    quantity: 1,
    size: '',
    status: 'needed',
    cost: 0,
    purchaseUrl: '',
    notes: ''
  });
  
  const [activities, setActivities] = useState([]);
  
  useEffect(() => {
    if (initialEquipment) {
      setEquipment(initialEquipment);
    } else if (selectedUser?.familyId) {
      loadEquipment();
    }
    
    loadActivities();
  }, [selectedUser, initialEquipment]);
  
  const loadEquipment = async () => {
    setIsLoading(true);
    
    try {
      const equipmentNeeds = await ActivityManager.getEquipmentNeeds(selectedUser.familyId);
      setEquipment(equipmentNeeds);
    } catch (error) {
      console.error('Error loading equipment:', error);
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
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const selectedActivity = activities.find(a => a.id === formData.activityId);
      
      if (!selectedActivity) {
        throw new Error('Activity not found');
      }
      
      // Get current equipment list
      const currentEquipment = selectedActivity.equipment || [];
      
      // Add new equipment
      const newItem = {
        id: showEditForm && selectedItem ? selectedItem.id : `new-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        type: formData.type,
        quantity: formData.quantity,
        size: formData.size,
        status: formData.status,
        cost: formData.cost,
        purchaseUrl: formData.purchaseUrl,
        notes: formData.notes
      };
      
      let updatedEquipment;
      
      if (showEditForm && selectedItem) {
        // Edit existing item
        updatedEquipment = currentEquipment.map(item => 
          item.id === selectedItem.id ? newItem : item
        );
      } else {
        // Add new item
        updatedEquipment = [...currentEquipment, newItem];
      }
      
      // Update equipment in activity
      await ActivityManager.updateEquipment(selectedActivity.id, updatedEquipment);
      
      // Refresh data
      await loadEquipment();
      
      // Call the callback if provided (for parent component updates)
      if (onUpdateEquipment) {
        onUpdateEquipment(selectedActivity.id, updatedEquipment);
      }
      
      // Reset form and state
      resetForm();
    } catch (error) {
      console.error('Error saving equipment:', error);
      alert('Failed to save equipment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      activityId: item.activityId,
      name: item.name,
      description: item.description || '',
      type: item.type || 'equipment',
      quantity: item.quantity || 1,
      size: item.size || '',
      status: item.status || 'needed',
      cost: item.cost || 0,
      purchaseUrl: item.purchaseUrl || '',
      notes: item.notes || ''
    });
    setShowEditForm(true);
    setShowAddForm(false);
  };
  
  const handleDelete = async (item) => {
    if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const selectedActivity = activities.find(a => a.id === item.activityId);
      
      if (!selectedActivity) {
        throw new Error('Activity not found');
      }
      
      // Get current equipment list
      const currentEquipment = selectedActivity.equipment || [];
      
      // Filter out the item to delete
      const updatedEquipment = currentEquipment.filter(eq => eq.id !== item.id);
      
      // Update equipment in activity
      await ActivityManager.updateEquipment(selectedActivity.id, updatedEquipment);
      
      // Refresh data
      await loadEquipment();
      
      // Call the callback if provided
      if (onUpdateEquipment) {
        onUpdateEquipment(selectedActivity.id, updatedEquipment);
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      alert('Failed to delete equipment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateStatus = async (item, newStatus) => {
    setIsLoading(true);
    
    try {
      // Find the activity
      const selectedActivity = activities.find(a => a.id === item.activityId);
      
      if (!selectedActivity) {
        throw new Error('Activity not found');
      }
      
      // Get current equipment list
      const currentEquipment = selectedActivity.equipment || [];
      
      // Update status of the specific item
      const updatedEquipment = currentEquipment.map(eq => 
        eq.id === item.id ? { ...eq, status: newStatus } : eq
      );
      
      // Update equipment in activity
      await ActivityManager.updateEquipment(selectedActivity.id, updatedEquipment);
      
      // Refresh data
      await loadEquipment();
      
      // Call the callback if provided
      if (onUpdateEquipment) {
        onUpdateEquipment(selectedActivity.id, updatedEquipment);
      }
    } catch (error) {
      console.error('Error updating equipment status:', error);
      alert('Failed to update equipment status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setFormData({
      activityId: '',
      name: '',
      description: '',
      type: 'equipment',
      quantity: 1,
      size: '',
      status: 'needed',
      cost: 0,
      purchaseUrl: '',
      notes: ''
    });
    setSelectedItem(null);
    setShowAddForm(false);
    setShowEditForm(false);
  };
  
  // Filter and sort equipment
  const processedEquipment = equipment
    // Apply filters
    .filter(item => {
      // Search term
      if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.description?.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !item.activityName?.toLowerCase().includes(searchTerm.toLowerCase())) {
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
      
      return true;
    })
    // Apply sorting
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'status':
          // Prioritize 'needed' first, then 'borrowed', then 'owned'
          const statusOrder = { needed: 0, borrowed: 1, owned: 2 };
          aValue = statusOrder[a.status] || 3;
          bValue = statusOrder[b.status] || 3;
          break;
        case 'activity':
          aValue = a.activityName || '';
          bValue = b.activityName || '';
          break;
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'date':
          aValue = a.lastReplaced ? new Date(a.lastReplaced) : new Date(0);
          bValue = b.lastReplaced ? new Date(b.lastReplaced) : new Date(0);
          break;
        case 'cost':
          aValue = a.cost || 0;
          bValue = b.cost || 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      // Apply sort direction
      const directionMultiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return -1 * directionMultiplier;
      if (aValue > bValue) return 1 * directionMultiplier;
      return 0;
    });
  
  // Group equipment (if grouping is active)
  const groupedEquipment = processedEquipment.reduce((groups, item) => {
    let groupKey;
    
    switch (groupBy) {
      case 'activity':
        groupKey = item.activityName || 'Unknown Activity';
        break;
      case 'type':
        groupKey = item.type?.charAt(0).toUpperCase() + item.type?.slice(1) || 'Other';
        break;
      case 'status':
        groupKey = item.status?.charAt(0).toUpperCase() + item.status?.slice(1) || 'Unknown';
        break;
      default:
        groupKey = 'All Equipment';
    }
    
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    
    groups[groupKey].push(item);
    return groups;
  }, {});
  
  // Generate group headers
  const groupHeaders = Object.keys(groupedEquipment).sort();
  
  const EmptyStateMessage = () => (
    <div className="text-center py-8">
      <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Equipment Found</h3>
      <p className="text-gray-500 mb-6">
        {searchTerm || filters.status !== 'all' || filters.type !== 'all'
          ? 'Try adjusting your filters or search term'
          : 'Add equipment to activities to track uniforms, supplies, and gear'}
      </p>
      <button
        onClick={() => {
          setShowAddForm(true);
          setShowEditForm(false);
        }}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
      >
        <Plus size={16} className="mr-2" />
        Add Equipment
      </button>
    </div>
  );
  
  // Render the equipment item card
  const EquipmentCard = ({ item }) => (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <h3 className="font-medium text-gray-900">{item.name}</h3>
            {item.quantity > 1 && (
              <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                Qty: {item.quantity}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {item.activityName} • {item.participantName}
          </p>
          {item.description && (
            <p className="text-sm text-gray-500 mt-1">{item.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">
              {item.type}
            </span>
            {item.size && (
              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                Size: {item.size}
              </span>
            )}
            <span className={`text-xs px-2 py-1 rounded-full ${
              item.status === 'needed' 
                ? 'bg-red-100 text-red-800' 
                : item.status === 'owned'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-800'
            }`}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          {item.cost > 0 && (
            <div className="text-sm font-medium text-gray-900">
              ${item.cost.toFixed(2)}
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
      
      {/* Action buttons */}
      <div className="mt-3 flex justify-end">
        {item.status === 'needed' && (
          <>
            {item.purchaseUrl && (
              <a
                href={item.purchaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mr-2 inline-flex items-center text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                <ExternalLink size={12} className="mr-1" />
                Purchase
              </a>
            )}
            <button
              onClick={() => handleUpdateStatus(item, 'owned')}
              className="mr-2 inline-flex items-center text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >
              <Check size={12} className="mr-1" />
              Mark as Owned
            </button>
            <button
              onClick={() => handleUpdateStatus(item, 'borrowed')}
              className="inline-flex items-center text-xs bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700"
            >
              Borrowed
            </button>
          </>
        )}
        
        {item.status === 'borrowed' && (
          <button
            onClick={() => handleUpdateStatus(item, 'owned')}
            className="inline-flex items-center text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            <Check size={12} className="mr-1" />
            Mark as Owned
          </button>
        )}
        
        {item.status === 'owned' && (
          <button
            onClick={() => handleUpdateStatus(item, 'needed')}
            className="inline-flex items-center text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            <X size={12} className="mr-1" />
            Mark as Needed
          </button>
        )}
      </div>
    </div>
  );
  
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* Header with title and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-3 sm:mb-0">Equipment & Uniforms</h2>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search equipment..."
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
      
      {/* Add/Edit Form */}
      {(showAddForm || showEditForm) && (
        <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {showEditForm ? 'Edit Equipment' : 'Add New Equipment'}
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
                  Equipment Name*
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Soccer Cleats"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={2}
                placeholder="Add details about the equipment..."
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  <option value="equipment">Equipment</option>
                  <option value="uniform">Uniform</option>
                  <option value="supplies">Supplies</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Size
                </label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleInputChange}
                  placeholder="e.g. Medium, Youth Large, 8"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                  <option value="needed">Needed</option>
                  <option value="owned">Owned</option>
                  <option value="borrowed">Borrowed</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    name="cost"
                    value={formData.cost}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full pl-7 p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase URL
                </label>
                <input
                  type="url"
                  name="purchaseUrl"
                  value={formData.purchaseUrl}
                  onChange={handleInputChange}
                  placeholder="https://..."
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={2}
                placeholder="Any additional notes..."
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
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
          <option value="needed">Needed</option>
          <option value="owned">Owned</option>
          <option value="borrowed">Borrowed</option>
        </select>
        
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="all">All Types</option>
          <option value="equipment">Equipment</option>
          <option value="uniform">Uniforms</option>
          <option value="supplies">Supplies</option>
        </select>
        
        <div className="flex-grow"></div>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-600 mr-2">Group by:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="activity">Activity</option>
            <option value="type">Type</option>
            <option value="status">Status</option>
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
            <option value="status">By Status</option>
            <option value="activity">By Activity</option>
            <option value="name">By Name</option>
            <option value="cost">By Cost</option>
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
      
      {/* Equipment List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
        </div>
      ) : processedEquipment.length === 0 ? (
        <EmptyStateMessage />
      ) : groupBy === 'none' ? (
        <div className="space-y-4">
          {processedEquipment.map(item => (
            <EquipmentCard key={item.id} item={item} />
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
                {groupedEquipment[header].map(item => (
                  <EquipmentCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EquipmentManager;