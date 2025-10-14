import React, { useState, useEffect } from 'react';
import { Gift, DollarSign, Star, Tag, Filter, PlusCircle, Clock, ShoppingBag, AlertCircle, Users } from 'lucide-react';
import { useFamily } from '../../../../contexts/FamilyContext';
import { useChore } from '../../../../contexts/ChoreContext';
import BucksBalanceDisplay from '../../../bucks/BucksBalanceDisplay';
import UserAvatar from '../../../common/UserAvatar';
import SpotifyRewardCard, { getCategoryColor } from '../../../reward/SpotifyRewardCard';
import CelebrationAnimation from '../../../common/CelebrationAnimation';

// Child rewards view component
const ChildRewardsView = ({ 
  selectedUser, 
  availableRewards, 
  pendingRewards, 
  bucksBalance, 
  filter, 
  setFilter, 
  sortBy, 
  setSortBy, 
  handleRewardClick, 
  showRewardDetails, 
  setShowRewardDetails,
  setSelectedReward 
}) => {
  // Function to filter and sort rewards
  const getFilteredAndSortedRewards = () => {
    let filtered = [...availableRewards];
    
    // Apply category filter
    if (filter !== 'all') {
      filtered = filtered.filter(reward => reward.category === filter);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
    
    return filtered;
  };
  
  // Get unique categories for filter
  const getUniqueCategories = () => {
    const categories = availableRewards.map(reward => reward.category);
    return ['all', ...new Set(categories)];
  };
  
  const filteredRewards = getFilteredAndSortedRewards();
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with title and balance */}
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Reward Shop</h1>
          <p className="text-gray-600">Spend your Palsson Bucks on awesome rewards!</p>
        </div>
        
        {/* Bucks balance card */}
        <BucksBalanceDisplay balance={bucksBalance} compact={false} />
      </div>
      
      {/* Tabs for shop and pending rewards */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${showRewardDetails ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' : 'border-blue-500 text-blue-600'}
              `}
              onClick={() => {
                setShowRewardDetails(false);
                setSelectedReward(null); // Clear selected reward
              }}
            >
              <ShoppingBag size={16} className="inline-block mr-2" />
              Reward Shop
            </button>
            <button
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${!showRewardDetails ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300' : 'border-blue-500 text-blue-600'}
              `}
              onClick={() => {
                setShowRewardDetails(true);
                setSelectedReward(null); // Clear selected reward
              }}
            >
              <Clock size={16} className="inline-block mr-2" />
              Pending Rewards
              {pendingRewards.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-500 px-2 py-0.5 rounded-full text-xs">
                  {pendingRewards.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>
      
      {!showRewardDetails ? (
        // Reward Shop
        <>
          {/* Filters and sorting */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-3 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Filter size={16} className="text-gray-400 mr-2" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border-none bg-transparent text-sm focus:ring-0 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  {getUniqueCategories().filter(c => c !== 'all').map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center">
                <span className="text-gray-400 mr-2">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border-none bg-transparent text-sm focus:ring-0 cursor-pointer"
                >
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
            </div>
            
            <span className="text-sm text-gray-500">
              {filteredRewards.length} {filteredRewards.length === 1 ? 'reward' : 'rewards'} available
            </span>
          </div>
          
          {/* Rewards grid */}
          {filteredRewards.length > 0 ? (
            <div className="space-y-2">
              {filteredRewards.map(reward => {
                const isAffordable = bucksBalance >= reward.price;
                
                return (
                  <SpotifyRewardCard
                    key={reward.id}
                    reward={reward}
                    onClick={() => handleRewardClick(reward)}
                    bucksBalance={bucksBalance}
                    disabled={bucksBalance < reward.price}
                  />
                );
              })}
            </div>
          ) : (
            // No rewards found
            <div className="bg-white rounded-lg shadow-md py-12 text-center">
              <Gift size={48} className="mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No rewards found</h3>
              <p className="text-gray-500 mt-1 max-w-md mx-auto">
                {filter !== 'all' 
                  ? `There are no rewards in the "${filter}" category.` 
                  : "There are no rewards available right now. Check back later!"}
              </p>
            </div>
          )}
        </>
      ) : (
        // Pending Rewards
        <>
          <h2 className="text-lg font-medium mb-4">Pending Approval</h2>
          
          {pendingRewards.length > 0 ? (
            <div className="space-y-2">
              {pendingRewards.map(reward => (
                <SpotifyRewardCard
                  key={reward.id}
                  reward={{...reward, status: 'pending'}}
                  disabled={true}
                  bucksBalance={0}
                  onClick={() => {}} // No action on click for pending rewards
                />
              ))}
            </div>
          ) : (
            // No pending rewards
            <div className="bg-white rounded-lg shadow-md py-12 text-center">
              <Clock size={48} className="mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No pending rewards</h3>
              <p className="text-gray-500 mt-1">
                You don't have any rewards waiting for approval.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Parent rewards dashboard component
const ParentRewardsView = ({ 
  familyMembers, 
  allChildrenRewards, 
  pendingApprovals, 
  handleApproveReward, 
  handleRejectReward 
}) => {
  // Get child family members only
  const childrenOnly = familyMembers.filter(member => member.role === 'child');
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Family Rewards Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage your children's rewards and approvals</p>
      </div>
      
      {/* Pending approvals section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pending Reward Approvals</h2>
        
        {pendingApprovals.length > 0 ? (
          <div className="space-y-2">
            {pendingApprovals.map(approval => {
              // Find the child data
              const childData = familyMembers.find(m => m.id === approval.childId) || { name: 'Unknown Child' };
              
              const rewardWithMeta = {
                ...approval.template,
                ...approval,
                status: 'pending',
                childName: childData.name,
                requestedAt: approval.requestedAt || approval.createdAt
              };
              
              return (
                <div key={approval.id} className="relative">
                  <SpotifyRewardCard
                    reward={rewardWithMeta}
                    disabled={true}
                    bucksBalance={0}
                    onClick={() => {}}
                  />
                  
                  {/* Approval overlay */}
                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <button 
                      onClick={() => handleRejectReward(approval.id)}
                      className="px-3 py-1 text-sm text-red-500 bg-white border border-red-200 rounded hover:bg-red-50 shadow-md"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleApproveReward(approval.id)}
                      className="px-3 py-1 text-sm text-white bg-green-500 rounded hover:bg-green-600 shadow-md"
                    >
                      Approve
                    </button>
                  </div>
                  
                  {/* Child info overlay */}
                  <div className="absolute bottom-2 left-14 flex items-center bg-white/90 backdrop-blur px-2 py-1 rounded-full shadow-sm">
                    <UserAvatar user={childData} size={20} className="mr-1.5" />
                    <span className="text-sm font-medium">{childData.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // No pending approvals
          <div className="bg-white rounded-lg shadow-md py-8 text-center">
            <Clock size={36} className="mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No pending approvals</h3>
            <p className="text-gray-500 mt-1">
              There are no reward requests waiting for your approval.
            </p>
          </div>
        )}
      </div>
      
      {/* Children's reward summaries */}
      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Children's Rewards</h2>
        
        {childrenOnly.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {childrenOnly.map(child => {
              const childRewards = allChildrenRewards[child.id] || [];
              const approvedRewards = childRewards.filter(r => 
                r.status === 'approved' || r.status === 'fulfilled'
              ).length;
              
              // Calculate total bucks spent
              const bucksSpent = childRewards
                .filter(r => r.status === 'approved' || r.status === 'fulfilled')
                .reduce((total, r) => total + r.bucksPrice, 0);
              
              return (
                <div 
                  key={child.id}
                  className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                >
                  <div className="p-4 flex items-center">
                    <UserAvatar user={child} size={48} className="mr-3" />
                    <div>
                      <h3 className="font-medium">{child.name}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        {childRewards.length > 0 ? (
                          <>
                            <div>{approvedRewards} rewards redeemed</div>
                            <div className="flex items-center mt-1 text-green-600">
                              <DollarSign size={14} className="mr-1" />
                              <span>{bucksSpent} Bucks spent</span>
                            </div>
                          </>
                        ) : (
                          <span>No rewards yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {childRewards.length > 0 && (
                    <>
                      {/* Most recent rewards */}
                      <div className="px-4 pb-3">
                        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                          Recent Rewards
                        </h4>
                        
                        <div className="space-y-2">
                          {childRewards.slice(0, 3).map(reward => (
                            <div key={reward.id} className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div 
                                  className="w-6 h-6 rounded flex items-center justify-center mr-2"
                                  style={{ backgroundColor: getCategoryColor(reward.template?.category || reward.category || 'other') + '20' }}
                                >
                                  <Gift size={12} style={{ color: getCategoryColor(reward.template?.category || reward.category || 'other') }} />
                                </div>
                                <span className="text-sm truncate max-w-[140px]">{reward.template?.title || reward.title || 'Unnamed Reward'}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(reward.requestedAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* View all button */}
                      <div className="border-t border-gray-100 p-2">
                        <button 
                          className="w-full py-1.5 text-center text-sm text-blue-600 hover:bg-blue-50 rounded"
                          onClick={() => {
                            // View child's rewards detail (would navigate to detailed view)
                            console.log(`View ${child.name}'s rewards`);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          // No children added
          <div className="py-8 text-center bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-center mb-3">
              <Users size={36} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-2">No children added to your family yet</p>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">
              Add Family Member
            </button>
          </div>
        )}
      </div>
      
      {/* Create new reward button */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-800">Need to create new rewards?</h3>
            <p className="text-blue-600 text-sm mt-1">
              Use the Reward Admin panel to create, edit and manage all rewards.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard?tab=reward-admin'}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg"
          >
            Go to Reward Admin
          </button>
        </div>
      </div>
    </div>
  );
};

// Main RewardsTab component with role-based views
const RewardsTab = () => {
  const { selectedUser, familyMembers } = useFamily();
  const { 
    getAvailableRewards, 
    getChildBucksBalance, 
    purchaseReward,
    getPendingRewards,
    approveReward,
    rejectReward,
    rewardTemplates,
    childRewards,
    pendingRewardApprovals,
    loadRewardTemplates,
    loadChildRewards,
    loadPendingRewardApprovals
  } = useChore();
  
  // State for rewards and balance
  const [availableRewards, setAvailableRewards] = useState([]);
  const [pendingRewards, setPendingRewards] = useState([]);
  const [bucksBalance, setBucksBalance] = useState(0);
  
  // State for all children's rewards (for parent view)
  const [allChildrenRewards, setAllChildrenRewards] = useState({});
  const [pendingApprovals, setPendingApprovals] = useState([]);
  
  // State for reward details modal
  const [showRewardDetails, setShowRewardDetails] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  
  // State for confirmation modal
  const [showConfirmPurchase, setShowConfirmPurchase] = useState(false);
  
  // State for purchase success modal
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [purchasedReward, setPurchasedReward] = useState(null);
  
  // State for filters
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('price-asc');
  
  // Load rewards and balance for child view
  const loadChildRewardData = async () => {
    if (!selectedUser) return;
    
    try {
      // Load rewards - getAvailableRewards is a getter that returns rewardTemplates
      const rewards = getAvailableRewards();
      
      // Ensure all rewards have a price property (map bucksPrice to price if needed)
      const rewardsWithPrice = rewards.map(reward => ({
        ...reward,
        price: reward.price || reward.bucksPrice || 50,
        name: reward.name || reward.title || 'Unnamed Reward'
      }));
      
      console.log('Loaded rewards for child:', rewardsWithPrice);
      setAvailableRewards(rewardsWithPrice);
      
      // Load balance
      const balance = await getChildBucksBalance(selectedUser.id);
      console.log('Loaded balance for child:', selectedUser.id, 'Balance:', balance);
      setBucksBalance(balance);
      
      // Load pending rewards - getPendingRewards is a getter that filters childRewards
      const pending = getPendingRewards();
      setPendingRewards(pending);
    } catch (error) {
      console.error('Error loading reward data:', error);
    }
  };
  
  // Load rewards data for parent view
  const loadParentRewardData = async () => {
    if (!selectedUser || selectedUser.role !== 'parent') return;
    
    try {
      // Load pending reward approvals
      await loadPendingRewardApprovals();
      
      // Use the pendingRewardApprovals from context
      setPendingApprovals(pendingRewardApprovals);
      
      // Load rewards for all children
      const childrenOnly = familyMembers.filter(member => member.role === 'child');
      const allRewards = {};
      
      // For now, we'll use childRewards from context
      // In a real implementation, we'd need to fetch rewards for each child
      for (const child of childrenOnly) {
        // Filter childRewards by child.id
        allRewards[child.id] = childRewards.filter(r => r.childId === child.id);
      }
      
      setAllChildrenRewards(allRewards);
    } catch (error) {
      console.error('Error loading parent reward data:', error);
    }
  };
  
  // Effect to load data on mount and when user changes
  useEffect(() => {
    if (selectedUser) {
      if (selectedUser.role === 'child') {
        loadChildRewardData();
      } else {
        loadParentRewardData();
      }
    }
  }, [selectedUser, rewardTemplates, childRewards, pendingRewardApprovals]);
  
  // Function to handle reward click (child view)
  const handleRewardClick = (reward) => {
    if (bucksBalance >= reward.price) {
      setSelectedReward(reward);
      setShowRewardDetails(true);
    } else {
      // Optionally show a message that they can't afford this reward
      console.log("Not enough Palsson Bucks to purchase this reward");
    }
  };
  
  // Function to initiate reward purchase (child view)
  const handleInitiatePurchase = (reward) => {
    setSelectedReward(reward);
    setShowConfirmPurchase(true);
  };
  
  // Function to complete purchase (child view)
  const handleCompletePurchase = async () => {
    if (!selectedReward || !selectedUser) return;
    
    try {
      // Purchase reward - purchaseReward expects (templateId, requestData)
      await purchaseReward(selectedReward.id, {});
      
      // Close confirmation modal
      setShowConfirmPurchase(false);
      
      // Show success modal
      setPurchasedReward(selectedReward);
      setShowPurchaseSuccess(true);
      
      // Reload data after purchase
      if (selectedUser.role === 'child') {
        await loadChildRewardData();
      } else {
        await loadParentRewardData();
      }
    } catch (error) {
      console.error('Error purchasing reward:', error);
      alert('Failed to purchase reward. Please try again.');
      setShowConfirmPurchase(false);
    }
  };
  
  // Function to approve a pending reward (parent view)
  const handleApproveReward = async (rewardId, scheduledDate = null) => {
    if (!selectedUser || selectedUser.role !== 'parent') return;
    
    try {
      await approveReward(rewardId, selectedUser.id, { scheduledDate });
      loadParentRewardData();
    } catch (error) {
      console.error('Error approving reward:', error);
      alert('Failed to approve reward. Please try again.');
    }
  };
  
  // Function to reject a pending reward (parent view)
  const handleRejectReward = async (rewardId, reason = 'Rejected by parent') => {
    if (!selectedUser || selectedUser.role !== 'parent') return;
    
    try {
      await rejectReward(rewardId, selectedUser.id, { reason });
      loadParentRewardData();
    } catch (error) {
      console.error('Error rejecting reward:', error);
      alert('Failed to reject reward. Please try again.');
    }
  };
  
  // If no user is selected, show a message
  if (!selectedUser) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Please select a family member to view their rewards.</p>
      </div>
    );
  }
  
  // Render appropriate view based on user role
  if (selectedUser.role === 'child') {
    return (
      <>
        <ChildRewardsView 
          selectedUser={selectedUser}
          availableRewards={availableRewards}
          pendingRewards={pendingRewards}
          bucksBalance={bucksBalance}
          filter={filter}
          setFilter={setFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          handleRewardClick={handleRewardClick}
          showRewardDetails={showRewardDetails}
          setShowRewardDetails={setShowRewardDetails}
          setSelectedReward={setSelectedReward}
        />
        
        {/* Reward details modal */}
        {showRewardDetails && selectedReward && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full overflow-hidden">
              {/* Reward image */}
              <div 
                className="h-48 bg-gray-200 flex items-center justify-center relative"
                style={{ background: `linear-gradient(45deg, ${getCategoryColor(selectedReward.category)} 0%, ${getCategoryColor(selectedReward.category)}90 100%)` }}
              >
                {selectedReward.imageUrl ? (
                  <img 
                    src={selectedReward.imageUrl} 
                    alt={selectedReward.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Gift size={64} className="text-white opacity-80" />
                )}
                
                {/* Category badge */}
                <div 
                  className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-black/50 text-white"
                >
                  {selectedReward.category}
                </div>

                {/* Price badge (top right) */}
                <div className="absolute top-3 right-3 bg-green-600 text-white rounded-full px-2 py-1 shadow-md flex items-center z-10">
                  <DollarSign size={14} className="mr-0.5" />
                  <span className="text-sm font-medium">{selectedReward.price}</span>
                </div>
              </div>
              
              {/* Reward info */}
              <div className="p-6">
                <div className="mb-2">
                  <h3 className="font-medium text-xl">{selectedReward.name}</h3>
                </div>
                
                <p className="text-gray-600 text-sm mb-6">{selectedReward.description}</p>
                
                <div className="space-y-3 mb-6">
                  {selectedReward.details && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Details</h4>
                      <p className="text-sm text-gray-600">{selectedReward.details}</p>
                    </div>
                  )}
                  
                  {selectedReward.restrictions && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Restrictions</h4>
                      <p className="text-sm text-gray-600">{selectedReward.restrictions}</p>
                    </div>
                  )}
                  
                  {selectedReward.expirationDays && (
                    <div className="flex items-center">
                      <Clock size={16} className="text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">
                        Expires {selectedReward.expirationDays} days after purchase
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowRewardDetails(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Close
                  </button>
                  
                  {bucksBalance >= selectedReward.price && (
                    <button
                      onClick={() => {
                        setShowRewardDetails(false);
                        handleInitiatePurchase(selectedReward);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded"
                    >
                      Buy Now
                    </button>
                  )}
                </div>
                
                {bucksBalance < selectedReward.price && (
                  <div className="mt-3 p-3 bg-orange-50 text-orange-700 rounded-md text-sm flex items-start">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Not enough Palsson Bucks</p>
                      <p>You need {selectedReward.price - bucksBalance} more Bucks to purchase this reward.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Purchase confirmation modal */}
        {showConfirmPurchase && selectedReward && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium mb-4">Confirm Purchase</h3>
              
              <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-medium">{selectedReward.name}</h4>
                    <div 
                      className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: getCategoryColor(selectedReward.category) + '30',
                        color: getCategoryColor(selectedReward.category)
                      }}
                    >
                      {selectedReward.category}
                    </div>
                  </div>
                  <div className="flex items-center font-bold">
                    <DollarSign size={18} className="text-green-500" />
                    <span>{selectedReward.price}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span>Current Balance</span>
                  <span>{bucksBalance} Bucks</span>
                </div>
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span>Cost</span>
                  <span className="text-red-500">-{selectedReward.price} Bucks</span>
                </div>
                <div className="h-px bg-gray-200 my-2"></div>
                <div className="flex justify-between items-center font-medium">
                  <span>New Balance</span>
                  <span>{bucksBalance - selectedReward.price} Bucks</span>
                </div>
              </div>
              
              <div className="p-3 bg-yellow-50 text-yellow-700 rounded-md text-sm mb-6">
                <p className="font-medium">Note</p>
                <p>This purchase will need parent approval before the reward is granted.</p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmPurchase(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompletePurchase}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded"
                >
                  Confirm Purchase
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Purchase success modal */}
        {showPurchaseSuccess && purchasedReward && (
          <>
            {/* Celebration animation */}
            <CelebrationAnimation 
              type="emojis" 
              duration={3000}
              onComplete={() => {
                // Animation complete callback if needed
              }}
            />
            
            {/* Success modal */}
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-md w-full p-6 text-center transform transition-all duration-300 scale-100 animate-bounce-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              
              <h3 className="text-xl font-medium text-gray-900 mb-2">Purchase Successful!</h3>
              <p className="text-gray-600 mb-4">
                Your request for "{purchasedReward.name}" has been submitted and is pending parent approval.
              </p>
              
              <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-sm mb-6 text-left">
                <p className="font-medium">What happens next?</p>
                <p>Your parent will review your reward request. Once approved, it will be added to your rewards list.</p>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span>Previous Balance</span>
                  <span>{bucksBalance + purchasedReward.price} Bucks</span>
                </div>
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span>Cost</span>
                  <span className="text-red-500">-{purchasedReward.price} Bucks</span>
                </div>
                <div className="h-px bg-gray-200 my-2"></div>
                <div className="flex justify-between items-center font-medium">
                  <span>New Balance</span>
                  <span>{bucksBalance} Bucks</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setShowPurchaseSuccess(false);
                  setPurchasedReward(null);
                  setSelectedReward(null); // Clear selected reward to prevent modal
                  setShowRewardDetails(true); // Show pending rewards tab
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded w-full"
              >
                View Pending Rewards
              </button>
            </div>
          </div>
          </>
        )}
        
        {/* Add styles for bounce-in animation */}
        <style jsx>{`
          @keyframes bounce-in {
            0% {
              transform: scale(0.3);
              opacity: 0;
            }
            50% {
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
          
          .animate-bounce-in {
            animation: bounce-in 0.6s ease-out;
          }
        `}</style>
      </>
    );
  } else {
    // Parent view
    return (
      <ParentRewardsView 
        familyMembers={familyMembers}
        allChildrenRewards={allChildrenRewards}
        pendingApprovals={pendingApprovals}
        handleApproveReward={handleApproveReward}
        handleRejectReward={handleRejectReward}
      />
    );
  }
};

// Using imported getCategoryColor from SpotifyRewardCard

export default RewardsTab;