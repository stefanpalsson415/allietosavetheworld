// src/components/chore/ChoreApprovalQueue.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  DollarSign, 
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Image,
  MessageSquare,
  Smile,
  Frown,
  AlertTriangle,
  Plus,
  Filter,
  Search
} from 'lucide-react';
import { useChore } from '../../contexts/ChoreContext';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';

/**
 * ChoreApprovalQueue - Component for reviewing and approving/rejecting completed chores
 * 
 * @param {Object} props
 * @param {boolean} props.isEmbedded - Whether component is embedded in another component or standalone
 * @param {Function} props.onRefresh - Function to call after approving/rejecting (if embedded)
 */
const ChoreApprovalQueue = ({ isEmbedded = false, onRefresh }) => {
  const { 
    pendingApprovals, 
    loadPendingApprovals, 
    approveChore, 
    rejectChore, 
    tipChore 
  } = useChore();
  const { selectedUser, familyMembers } = useFamily();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [expandedChoreId, setExpandedChoreId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChildFilter, setSelectedChildFilter] = useState('all');
  const [rejectionReason, setRejectionReason] = useState('');
  const [tipAmount, setTipAmount] = useState(0);
  const [actionStatus, setActionStatus] = useState({ 
    choreId: null, 
    action: null, 
    status: null, 
    message: '' 
  });
  
  // Load pending approvals
  useEffect(() => {
    const fetchApprovals = async () => {
      setIsLoading(true);
      try {
        await loadPendingApprovals();
      } catch (error) {
        console.error('Error loading pending approvals:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApprovals();
  }, [loadPendingApprovals]);
  
  // Filter approvals by search and child
  const filteredApprovals = pendingApprovals.filter(chore => {
    // Filter by search
    const matchesSearch = 
      searchQuery === '' || 
      chore.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chore.description && chore.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (chore.comment && chore.comment.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by child
    const matchesChildFilter = 
      selectedChildFilter === 'all' || 
      chore.childId === selectedChildFilter;
    
    return matchesSearch && matchesChildFilter;
  });
  
  // Toggle expanded chore
  const toggleExpandChore = (choreId) => {
    if (expandedChoreId === choreId) {
      setExpandedChoreId(null);
    } else {
      setExpandedChoreId(choreId);
    }
  };
  
  // Find a child by ID
  const findChildById = (childId) => {
    return familyMembers.find(member => member.id === childId);
  };
  
  // Handle approval
  const handleApprove = async (chore) => {
    if (actionStatus.status === 'loading') return;
    
    setActionStatus({ 
      choreId: chore.id, 
      action: 'approve', 
      status: 'loading',
      message: '' 
    });
    
    try {
      await approveChore(chore.id, selectedUser.id, {
        approvedTimestamp: new Date().toISOString()
      });
      
      setActionStatus({ 
        choreId: chore.id, 
        action: 'approve', 
        status: 'success',
        message: 'Chore approved successfully!' 
      });
      
      // Call refresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
      
      // Auto-reload after a moment if not embedded
      if (!isEmbedded) {
        setTimeout(() => {
          loadPendingApprovals();
          setActionStatus({ choreId: null, action: null, status: null, message: '' });
        }, 2000);
      }
    } catch (error) {
      console.error('Error approving chore:', error);
      setActionStatus({ 
        choreId: chore.id, 
        action: 'approve', 
        status: 'error',
        message: error.message || 'Failed to approve chore' 
      });
    }
  };
  
  // Handle rejection
  const handleReject = async (chore) => {
    if (actionStatus.status === 'loading' || !rejectionReason.trim()) return;
    
    setActionStatus({ 
      choreId: chore.id, 
      action: 'reject', 
      status: 'loading',
      message: '' 
    });
    
    try {
      await rejectChore(chore.id, selectedUser.id, {
        rejectionReason: rejectionReason.trim(),
        rejectedTimestamp: new Date().toISOString()
      });
      
      setActionStatus({ 
        choreId: chore.id, 
        action: 'reject', 
        status: 'success',
        message: 'Chore rejected successfully' 
      });
      
      // Reset rejection reason
      setRejectionReason('');
      
      // Call refresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
      
      // Auto-reload after a moment if not embedded
      if (!isEmbedded) {
        setTimeout(() => {
          loadPendingApprovals();
          setActionStatus({ choreId: null, action: null, status: null, message: '' });
        }, 2000);
      }
    } catch (error) {
      console.error('Error rejecting chore:', error);
      setActionStatus({ 
        choreId: chore.id, 
        action: 'reject', 
        status: 'error',
        message: error.message || 'Failed to reject chore' 
      });
    }
  };
  
  // Handle tip
  const handleTip = async (chore) => {
    if (actionStatus.status === 'loading' || tipAmount <= 0) return;
    
    setActionStatus({ 
      choreId: chore.id, 
      action: 'tip', 
      status: 'loading',
      message: '' 
    });
    
    try {
      await tipChore(chore.id, chore.childId, tipAmount, selectedUser.id);
      
      setActionStatus({ 
        choreId: chore.id, 
        action: 'tip', 
        status: 'success',
        message: `Added ${tipAmount} Bucks tip successfully!` 
      });
      
      // Reset tip amount
      setTipAmount(0);
    } catch (error) {
      console.error('Error adding tip:', error);
      setActionStatus({ 
        choreId: chore.id, 
        action: 'tip', 
        status: 'error',
        message: error.message || 'Failed to add tip' 
      });
    }
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <div className="bg-gray-50 rounded-lg p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">All Caught Up!</h3>
      <p className="text-gray-600 mb-4">
        There are no chores waiting for your approval at the moment.
      </p>
      <button 
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
        onClick={() => loadPendingApprovals()}
      >
        <RefreshCw size={16} className="mr-2" />
        Refresh
      </button>
    </div>
  );
  
  // Render chore card
  const renderChoreCard = (chore) => {
    const child = findChildById(chore.childId);
    const isExpanded = expandedChoreId === chore.id;
    const isActionLoading = actionStatus.choreId === chore.id && actionStatus.status === 'loading';
    const hasActionSuccess = actionStatus.choreId === chore.id && actionStatus.status === 'success';
    const hasActionError = actionStatus.choreId === chore.id && actionStatus.status === 'error';
    
    // Format completion time
    const formattedCompletionTime = chore.completedTimestamp
      ? new Date(chore.completedTimestamp).toLocaleString()
      : 'Unknown time';
    
    return (
      <div 
        key={chore.id}
        className={`border rounded-lg overflow-hidden transition-all duration-200 ${
          hasActionSuccess ? 'bg-green-50 border-green-200' : 
          hasActionError ? 'bg-red-50 border-red-200' :
          'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
        }`}
      >
        {/* Basic info section - always visible */}
        <div className="p-4 flex">
          <div className="mr-3">
            <UserAvatar 
              user={child || { name: 'Child', photoURL: null }}
              size={40}
            />
          </div>
          
          <div className="flex-grow min-w-0">
            <div className="flex flex-wrap justify-between items-start gap-2">
              <h3 className="font-bold text-lg">{chore.title}</h3>
              
              <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
                <DollarSign size={16} className="text-green-600 mr-1" />
                <span className="font-bold text-green-700">{chore.bucksAwarded}</span>
              </div>
            </div>
            
            <div className="flex items-center text-gray-500 text-sm mt-1">
              <Clock size={14} className="mr-1" />
              <span>Completed: {formattedCompletionTime}</span>
            </div>
            
            {chore.timeOfDay && (
              <div className="mt-1 bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 text-xs inline-flex items-center">
                {chore.timeOfDay}
              </div>
            )}
            
            {/* Icons for completion evidence */}
            <div className="flex mt-2 gap-2">
              {chore.photoURL && (
                <div className="flex items-center text-gray-600 text-sm">
                  <Image size={14} className="mr-1" />
                  <span>Photo</span>
                </div>
              )}
              
              {chore.comment && (
                <div className="flex items-center text-gray-600 text-sm">
                  <MessageSquare size={14} className="mr-1" />
                  <span>Comment</span>
                </div>
              )}
              
              {chore.mood && (
                <div className="flex items-center text-gray-600 text-sm">
                  {chore.mood === 'happy' ? (
                    <Smile size={14} className="mr-1 text-green-600" />
                  ) : (
                    <Frown size={14} className="mr-1 text-amber-600" />
                  )}
                  <span>{chore.mood === 'happy' ? 'Easy' : 'Challenging'}</span>
                </div>
              )}
            </div>
          </div>
          
          <button
            className="ml-2 text-gray-400 hover:text-gray-600"
            onClick={() => toggleExpandChore(chore.id)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            <svg 
              className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {/* Expanded details */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100 pt-3">
            {/* Photo evidence */}
            {chore.photoURL && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Photo Evidence</h4>
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <img 
                    src={chore.photoURL} 
                    alt="Chore completion evidence" 
                    className="w-full h-48 object-cover"
                  />
                </div>
              </div>
            )}
            
            {/* Comment */}
            {chore.comment && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-1">Child's Comment</h4>
                <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-gray-700">
                  {chore.comment}
                </div>
              </div>
            )}
            
            {/* Approval/Rejection Actions */}
            <div className="mt-4 border-t border-gray-200 pt-4">
              {hasActionSuccess ? (
                <div className="bg-green-100 text-green-800 p-3 rounded-md flex items-center mb-3">
                  <CheckCircle size={18} className="mr-2" />
                  <span>{actionStatus.message}</span>
                </div>
              ) : hasActionError ? (
                <div className="bg-red-100 text-red-800 p-3 rounded-md flex items-center mb-3">
                  <AlertTriangle size={18} className="mr-2" />
                  <span>{actionStatus.message}</span>
                </div>
              ) : (
                <>
                  <h4 className="font-medium text-gray-700 mb-2">Review Actions</h4>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {/* Approve button */}
                    <button
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleApprove(chore)}
                      disabled={isActionLoading}
                    >
                      {isActionLoading && actionStatus.action === 'approve' ? (
                        <RefreshCw size={16} className="animate-spin mr-2" />
                      ) : (
                        <ThumbsUp size={16} className="mr-2" />
                      )}
                      Approve & Reward
                    </button>
                    
                    {/* Reject button - toggles rejection form */}
                    <button
                      className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => toggleExpandChore(`${chore.id}_reject`)}
                      disabled={isActionLoading}
                    >
                      <ThumbsDown size={16} className="mr-2" />
                      Reject
                    </button>
                    
                    {/* Tip button - toggles tip form */}
                    <button
                      className="inline-flex items-center px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => toggleExpandChore(`${chore.id}_tip`)}
                      disabled={isActionLoading}
                    >
                      <DollarSign size={16} className="mr-2" />
                      Add Tip
                    </button>
                  </div>
                  
                  {/* Rejection form */}
                  {expandedChoreId === `${chore.id}_reject` && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Rejection Reason</h4>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-3"
                        rows="2"
                        placeholder="Explain why the chore needs to be redone..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                      
                      <div className="flex justify-end">
                        <button
                          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleReject(chore)}
                          disabled={isActionLoading || !rejectionReason.trim()}
                        >
                          {isActionLoading && actionStatus.action === 'reject' ? (
                            <RefreshCw size={16} className="animate-spin mr-2" />
                          ) : (
                            <XCircle size={16} className="mr-2" />
                          )}
                          Send Rejection
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Tip form */}
                  {expandedChoreId === `${chore.id}_tip` && (
                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <h4 className="font-medium text-gray-700 mb-2">Add Bonus Bucks</h4>
                      <div className="flex items-center mb-3">
                        <span className="mr-2">Amount:</span>
                        <div className="relative">
                          <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-600" />
                          <input
                            type="number"
                            className="pl-8 py-1 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                            max="20"
                            value={tipAmount}
                            onChange={(e) => setTipAmount(Number(e.target.value))}
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleTip(chore)}
                          disabled={isActionLoading || tipAmount <= 0}
                        >
                          {isActionLoading && actionStatus.action === 'tip' ? (
                            <RefreshCw size={16} className="animate-spin mr-2" />
                          ) : (
                            <Plus size={16} className="mr-2" />
                          )}
                          Add Bonus Bucks
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Main render
  return (
    <div className={isEmbedded ? '' : 'h-full flex flex-col'}>
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        {!isEmbedded && <h2 className="text-xl font-bold text-gray-800">Chores Pending Approval</h2>}
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search filter */}
          <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search chores..."
              className="pl-9 py-2 px-3 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Child filter dropdown */}
          <div className="relative">
            <button 
              className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-800 hover:bg-gray-50"
              onClick={() => {
                // Would toggle a dropdown in real implementation
              }}
            >
              <Filter size={16} />
              <span className="hidden sm:inline">Filter</span>
            </button>
            {/* Filter dropdown would go here */}
          </div>
          
          {/* Refresh button */}
          <button 
            className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={() => loadPendingApprovals()}
            disabled={isLoading}
            aria-label="Refresh list"
          >
            <RefreshCw size={16} className={`${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* List of pending approvals */}
      <div className={isEmbedded ? '' : 'flex-grow overflow-auto'}>
        {isLoading ? (
          // Loading state
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredApprovals.length > 0 ? (
          // List of chores
          <div className="space-y-4">
            {filteredApprovals.map(chore => renderChoreCard(chore))}
          </div>
        ) : (
          // Empty state
          renderEmptyState()
        )}
      </div>
    </div>
  );
};

export default ChoreApprovalQueue;