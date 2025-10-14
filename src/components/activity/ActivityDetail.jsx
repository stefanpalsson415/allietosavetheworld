import React, { useState } from 'react';
import { 
  Calendar, Clock, MapPin, Building, User, DollarSign, 
  Edit, Trash2, ArrowLeft, Truck, ShoppingBag, Award, ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { Tab } from '@headlessui/react';

const ActivityDetail = ({ activity, onUpdateActivity, onBack, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  
  const startDate = activity.startDate ? 
    (activity.startDate.toDate ? activity.startDate.toDate() : new Date(activity.startDate)) : 
    null;
  
  const endDate = activity.endDate ? 
    (activity.endDate.toDate ? activity.endDate.toDate() : new Date(activity.endDate)) : 
    null;
  
  const formatDate = (date) => {
    if (!date) return 'Not set';
    return format(date, 'MMMM d, yyyy');
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleDelete = () => {
    setIsConfirmingDelete(true);
  };
  
  const confirmDelete = async () => {
    await onUpdateActivity(activity.id, { isActive: false });
    onBack();
  };
  
  const cancelDelete = () => {
    setIsConfirmingDelete(false);
  };
  
  const formatSchedule = () => {
    if (!activity.isRecurring) {
      return startDate ? formatDate(startDate) : 'Date not set';
    }
    
    if (activity.schedule && activity.schedule.length > 0) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return (
        <div className="space-y-2">
          {activity.schedule.map(session => (
            <div key={session.id} className="text-sm">
              <span className="font-medium">{days[session.day]}</span>: {session.startTime} - {session.endTime}
              {session.location && session.location !== activity.location && (
                <div className="text-xs text-gray-500 mt-1">
                  <MapPin size={12} className="inline mr-1" />
                  {session.location}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
    
    return 'Recurring schedule details not available';
  };
  
  const formatCost = () => {
    if (!activity.cost) return 'No cost information';
    
    const { registrationFee, recurringFee, frequency, equipmentCost, additionalCosts } = activity.cost;
    
    let totalCost = registrationFee || 0;
    totalCost += equipmentCost || 0;
    
    if (additionalCosts && Array.isArray(additionalCosts)) {
      additionalCosts.forEach(cost => {
        totalCost += cost.amount || 0;
      });
    }
    
    return (
      <div className="space-y-1">
        {registrationFee > 0 && (
          <div className="text-sm">Registration: ${registrationFee.toFixed(2)}</div>
        )}
        {recurringFee > 0 && (
          <div className="text-sm">Recurring: ${recurringFee.toFixed(2)} ({frequency})</div>
        )}
        {equipmentCost > 0 && (
          <div className="text-sm">Equipment: ${equipmentCost.toFixed(2)}</div>
        )}
        {additionalCosts && additionalCosts.length > 0 && (
          <div className="text-sm">
            Additional: ${additionalCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0).toFixed(2)}
          </div>
        )}
        <div className="text-sm font-medium pt-1 border-t border-gray-200">
          Total: ${totalCost.toFixed(2)}
        </div>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-t-transparent border-blue-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (isEditing) {
    // In a real implementation, we would render the edit form here
    // For now, we'll just show a placeholder
    return (
      <div className="p-4">
        <button
          onClick={() => setIsEditing(false)}
          className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to activity details
        </button>
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Activity</h2>
          <p className="text-sm text-gray-600">
            Edit form will be implemented in ActivityEditor component
          </p>
          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Save Changes
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-gray-600 hover:text-gray-800 flex items-center"
      >
        <ArrowLeft size={16} className="mr-1" />
        Back to activities
      </button>
      
      {/* Confirmation Dialog */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Delete Activity</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{activity.name}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">{activity.name}</h2>
              <p className="text-sm text-gray-600 mt-1 capitalize">{activity.type}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Edit activity"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete activity"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <Calendar className="text-blue-600 mt-1 mr-3" size={20} />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Schedule</div>
                  <div className="text-sm font-medium">
                    {activity.isRecurring ? 'Recurring' : 'One-time Event'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatDate(startDate)}
                    {endDate && ` - ${formatDate(endDate)}`}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <User className="text-green-600 mt-1 mr-3" size={20} />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Participant</div>
                  <div className="text-sm font-medium">{activity.participantName}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {activity.ageGroup || 'Age group not specified'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <Building className="text-amber-600 mt-1 mr-3" size={20} />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Organization</div>
                  <div className="text-sm font-medium">
                    {activity.organizationName || 'Not specified'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {activity.instructorName ? `Instructor: ${activity.instructorName}` : ''}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <MapPin className="text-purple-600 mt-1 mr-3" size={20} />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Location</div>
                  <div className="text-sm font-medium">
                    {activity.location || 'Not specified'}
                  </div>
                  <div className="text-xs text-gray-600 mt-1 truncate max-w-[200px]">
                    {activity.address || ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs and Detail Information */}
        <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
          <Tab.List className="flex border-b border-gray-200">
            <Tab className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }>
              Details
            </Tab>
            <Tab className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }>
              <div className="flex items-center">
                <ShoppingBag size={16} className="mr-2" />
                Equipment
                {activity.requiresEquipment && activity.equipment?.length > 0 && (
                  <span className="ml-2 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activity.equipment.length}
                  </span>
                )}
              </div>
            </Tab>
            <Tab className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }>
              <div className="flex items-center">
                <Truck size={16} className="mr-2" />
                Transportation
                {activity.requiresTransportation && activity.transportationArrangements?.length > 0 && (
                  <span className="ml-2 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activity.transportationArrangements.length}
                  </span>
                )}
              </div>
            </Tab>
            <Tab className={({ selected }) => 
              `py-3 px-4 text-sm font-medium focus:outline-none ${
                selected 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`
            }>
              <div className="flex items-center">
                <Award size={16} className="mr-2" />
                Skills
              </div>
            </Tab>
          </Tab.List>
          
          <Tab.Panels>
            {/* Details Tab */}
            <Tab.Panel>
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">
                    {activity.description || 'No description provided.'}
                  </p>
                </div>
                
                {/* Schedule Details */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    {formatSchedule()}
                  </div>
                </div>
                
                {/* Cost Information */}
                {activity.cost && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Cost Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {formatCost()}
                    </div>
                  </div>
                )}
                
                {/* Tags */}
                {activity.tags && activity.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {activity.tags.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Notes */}
                {activity.notes && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
                    <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-line">
                      {activity.notes}
                    </div>
                  </div>
                )}
                
                {/* Contact Information */}
                {activity.contactInfo && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Information</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {activity.contactInfo.phone && (
                        <div className="text-sm mb-1">
                          <span className="font-medium">Phone:</span> {activity.contactInfo.phone}
                        </div>
                      )}
                      {activity.contactInfo.email && (
                        <div className="text-sm mb-1">
                          <span className="font-medium">Email:</span> {activity.contactInfo.email}
                        </div>
                      )}
                      {activity.contactInfo.website && (
                        <div className="text-sm">
                          <span className="font-medium">Website:</span>{' '}
                          <a 
                            href={activity.contactInfo.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {activity.contactInfo.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Tab.Panel>
            
            {/* Equipment Tab */}
            <Tab.Panel>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Equipment & Uniforms</h3>
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded">
                    Add Equipment
                  </button>
                </div>
                
                {!activity.requiresEquipment || !activity.equipment || activity.equipment.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <ShoppingBag size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-600">
                      No equipment or uniforms required for this activity.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activity.equipment.map(item => (
                      <div 
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            <div className="flex items-center mt-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">
                                {item.type}
                              </span>
                              {item.size && (
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full ml-2">
                                  Size: {item.size}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
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
                          <div className="text-sm text-gray-900">
                            {item.cost > 0 && `$${item.cost.toFixed(2)}`}
                          </div>
                        </div>
                        
                        {item.status === 'needed' && (
                          <div className="mt-3 flex justify-end space-x-2">
                            {item.purchaseUrl && (
                              <a 
                                href={item.purchaseUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                Purchase
                              </a>
                            )}
                            <button className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                              Mark as Owned
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tab.Panel>
            
            {/* Transportation Tab */}
            <Tab.Panel>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Transportation</h3>
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded">
                    Add Transportation
                  </button>
                </div>
                
                {!activity.requiresTransportation || !activity.transportationArrangements || activity.transportationArrangements.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Truck size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-600">
                      No transportation arrangements for this activity.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activity.transportationArrangements.map(arrangement => (
                      <div 
                        key={arrangement.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center">
                              <h4 className="font-medium text-gray-900 capitalize">{arrangement.type}</h4>
                              <span className={`text-xs px-2.5 py-1 rounded-full ml-3 ${
                                arrangement.status === 'planned' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : arrangement.status === 'confirmed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                              }`}>
                                {arrangement.status.charAt(0).toUpperCase() + arrangement.status.slice(1)}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 mt-2">
                              {arrangement.day !== null && arrangement.day !== undefined ? (
                                <div>
                                  <span className="font-medium">Day:</span> {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][arrangement.day]}
                                </div>
                              ) : arrangement.specificDate ? (
                                <div>
                                  <span className="font-medium">Date:</span> {format(arrangement.specificDate.toDate(), 'MMM d, yyyy')}
                                </div>
                              ) : (
                                <div>No date specified</div>
                              )}
                            </div>
                            
                            {arrangement.assignedToName && (
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Assigned to:</span> {arrangement.assignedToName}
                              </div>
                            )}
                            
                            {arrangement.details && (
                              <div className="text-sm text-gray-600 mt-1">
                                {arrangement.details}
                              </div>
                            )}
                          </div>
                          
                          {arrangement.carpoolMembers && arrangement.carpoolMembers.length > 0 && (
                            <div className="text-sm bg-gray-50 p-2 rounded-lg">
                              <div className="font-medium mb-1">Carpool: {arrangement.carpoolMembers.length} members</div>
                            </div>
                          )}
                        </div>
                        
                        {arrangement.status !== 'completed' && (
                          <div className="mt-3 flex justify-end space-x-2">
                            <button className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                              Update Status
                            </button>
                            {arrangement.type === 'carpool' && (
                              <button className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">
                                Manage Carpool
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tab.Panel>
            
            {/* Skills Tab */}
            <Tab.Panel>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Skill Development</h3>
                  <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded">
                    {activity.skillsTracking?.enabled ? 'Add Skill' : 'Enable Skill Tracking'}
                  </button>
                </div>
                
                {!activity.skillsTracking?.enabled || !activity.skillsTracking?.skills || activity.skillsTracking?.skills.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Award size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-600">
                      Skill tracking is not enabled for this activity.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activity.skillsTracking.skills.map(skill => (
                      <div 
                        key={skill.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{skill.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{skill.description}</p>
                            {skill.category && (
                              <div className="mt-2">
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full capitalize">
                                  {skill.category}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="text-sm font-medium text-gray-900">
                              Level {skill.level}/{skill.targetLevel}
                            </div>
                            <div className="w-24 h-3 bg-gray-200 rounded-full mt-1 overflow-hidden">
                              <div 
                                className="h-full bg-purple-600"
                                style={{ width: `${(skill.progress / 100) * 100}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {skill.progress}% Complete
                            </div>
                          </div>
                        </div>
                        
                        {skill.assessments && skill.assessments.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>Last assessment: {format(skill.assessments[skill.assessments.length - 1].date.toDate(), 'MMM d, yyyy')}</span>
                              <button className="flex items-center text-blue-600 hover:underline">
                                <span>View History</span>
                                <ChevronDown size={14} className="ml-1" />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-3 flex justify-end space-x-2">
                          <button className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700">
                            Record Assessment
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default ActivityDetail;