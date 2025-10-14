// src/components/bucks/BucksTransactionHistory.jsx
import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Minus, 
  ChevronDown, 
  ChevronUp,
  Filter,
  Search,
  RefreshCw,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Coffee,
  User,
  ShoppingBag,
  Gift,
  Sparkles
} from 'lucide-react';
import { useChore } from '../../contexts/ChoreContext';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';

/**
 * BucksTransactionHistory - Component for displaying Palsson Bucks transaction history
 * with filtering and sorting capabilities
 * 
 * @param {Object} props
 * @param {string} props.childId - ID of child (optional, falls back to selected child)
 * @param {number} props.limit - Number of transactions to show (0 for all)
 * @param {boolean} props.showFilters - Whether to show filtering controls
 * @param {boolean} props.isEmbedded - Whether the component is embedded in another component
 * @param {Function} props.onRefresh - Optional callback for refresh actions
 */
const BucksTransactionHistory = ({ 
  childId, 
  limit = 0,
  showFilters = true,
  isEmbedded = false,
  onRefresh
}) => {
  const { transactionHistory, loadBucksBalance, selectedChildId } = useChore();
  const { familyMembers } = useFamily();
  
  // Use provided childId or fall back to selected child
  const targetChildId = childId || selectedChildId;
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all', 'earning', 'spending'
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc', 'desc'
  const [expandedTransactionId, setExpandedTransactionId] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  // Handle refresh
  const handleRefresh = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await loadBucksBalance();
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Error refreshing transaction history:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Toggle expanded transaction
  const toggleExpandTransaction = (transactionId) => {
    if (expandedTransactionId === transactionId) {
      setExpandedTransactionId(null);
    } else {
      setExpandedTransactionId(transactionId);
    }
  };
  
  // Filter and sort transactions
  const filteredTransactions = React.useMemo(() => {
    if (!transactionHistory) return [];
    
    // Start with all transactions
    let filtered = [...transactionHistory];
    
    // Apply child filter
    if (targetChildId) {
      filtered = filtered.filter(tx => tx.childId === targetChildId);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx => 
        (tx.description && tx.description.toLowerCase().includes(query)) ||
        (tx.source && tx.source.toLowerCase().includes(query)) ||
        (tx.reason && tx.reason.toLowerCase().includes(query))
      );
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }
    
    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(tx => 
        new Date(tx.timestamp) >= new Date(dateRange.start)
      );
    }
    
    if (dateRange.end) {
      // Add a day to include the end date fully
      const endDate = new Date(dateRange.end);
      endDate.setDate(endDate.getDate() + 1);
      
      filtered = filtered.filter(tx => 
        new Date(tx.timestamp) < endDate
      );
    }
    
    // Sort by timestamp
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortDirection === 'desc' 
        ? dateB - dateA 
        : dateA - dateB;
    });
    
    // Apply limit if specified
    if (limit > 0) {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  }, [
    transactionHistory, 
    targetChildId, 
    searchQuery, 
    typeFilter, 
    dateRange, 
    sortDirection,
    limit
  ]);
  
  // Find user by ID
  const findUserById = (userId) => {
    return familyMembers.find(member => member.id === userId) || { name: 'Unknown User' };
  };
  
  // Get transaction icon based on source/type
  const getTransactionIcon = (transaction) => {
    const size = 18;
    
    // Source-based icons
    if (transaction.source === 'chore') {
      return <CheckCircle size={size} className="text-blue-500" />;
    }
    
    if (transaction.source === 'chore_tip') {
      return <Sparkles size={size} className="text-purple-500" />;
    }
    
    if (transaction.source === 'reward_purchase') {
      return <Gift size={size} className="text-pink-500" />;
    }
    
    if (transaction.source === 'manual_adjustment') {
      return <User size={size} className="text-gray-500" />;
    }
    
    if (transaction.source === 'bonus') {
      return <Plus size={size} className="text-emerald-500" />;
    }
    
    // Default icons based on type
    if (transaction.type === 'earning') {
      return <ArrowUpRight size={size} className="text-green-500" />;
    } else {
      return <ArrowDownRight size={size} className="text-amber-500" />;
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  // Format time
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Render filter controls
  const renderFilters = () => {
    if (!showFilters) return null;
    
    return (
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full pl-9 py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          {/* Type filter */}
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="earning">Earnings</option>
              <option value="spending">Spending</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDown size={16} />
            </div>
          </div>
          
          {/* Sort direction toggle */}
          <button
            className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
            aria-label={sortDirection === 'desc' ? 'Sort oldest first' : 'Sort newest first'}
          >
            {sortDirection === 'desc' ? (
              <Calendar size={16} />
            ) : (
              <Calendar size={16} className="transform rotate-180" />
            )}
          </button>
          
          {/* Refresh button */}
          <button
            className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Refresh transactions"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    );
  };
  
  // Render date range filter
  const renderDateFilter = () => {
    if (!showFilters) return null;
    
    return (
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-700">Date Range:</span>
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="border border-gray-300 rounded-md p-1 text-sm"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
          <span>to</span>
          <input
            type="date"
            className="border border-gray-300 rounded-md p-1 text-sm"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
        </div>
        
        {(dateRange.start || dateRange.end) && (
          <button
            className="text-blue-600 hover:text-blue-800 text-sm"
            onClick={() => setDateRange({ start: '', end: '' })}
          >
            Clear
          </button>
        )}
      </div>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <div className="bg-gray-50 rounded-lg p-6 text-center">
      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <DollarSign size={24} className="text-blue-600" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">No Transactions Yet</h3>
      <p className="text-gray-600 mb-4">
        {searchQuery || typeFilter !== 'all' || dateRange.start || dateRange.end 
          ? 'No transactions match your filter criteria.'
          : 'There are no Palsson Bucks transactions yet. Transactions will appear here when chores are completed and approved or rewards are purchased.'}
      </p>
      {(searchQuery || typeFilter !== 'all' || dateRange.start || dateRange.end) && (
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          onClick={() => {
            setSearchQuery('');
            setTypeFilter('all');
            setDateRange({ start: '', end: '' });
          }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
  
  // Render a transaction row
  const renderTransaction = (transaction) => {
    const isExpanded = expandedTransactionId === transaction.id;
    
    return (
      <div 
        key={transaction.id}
        className={`border rounded-lg overflow-hidden transition duration-150 ${
          transaction.type === 'earning' ? 'border-green-200' : 'border-amber-200'
        } ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'}`}
      >
        {/* Transaction summary row - always visible */}
        <div 
          className={`p-3 flex items-center cursor-pointer ${
            transaction.type === 'earning' ? 'bg-green-50' : 'bg-amber-50'
          }`}
          onClick={() => toggleExpandTransaction(transaction.id)}
        >
          {/* Icon */}
          <div className="mr-3">
            {getTransactionIcon(transaction)}
          </div>
          
          {/* Description and date */}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">
              {transaction.description || (
                transaction.type === 'earning' ? 'Earned Palsson Bucks' : 'Spent Palsson Bucks'
              )}
            </div>
            <div className="text-xs text-gray-500">
              {formatDate(transaction.timestamp)}
            </div>
          </div>
          
          {/* Amount */}
          <div className={`font-bold ${
            transaction.type === 'earning' ? 'text-green-600' : 'text-amber-700'
          } flex items-center`}>
            {transaction.type === 'earning' ? '+' : '-'}
            <DollarSign size={14} />
            {transaction.amount}
          </div>
          
          {/* Expand/collapse button */}
          <button className="ml-2 text-gray-500">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        
        {/* Expanded details */}
        {isExpanded && (
          <div className="bg-white p-3 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Transaction type and source */}
              <div>
                <div className="text-sm font-medium text-gray-500">Type</div>
                <div className="capitalize">
                  {transaction.type === 'earning' ? 'Earning' : 'Spending'}
                  {transaction.source && ` (${transaction.source.replace('_', ' ')})`}
                </div>
              </div>
              
              {/* Date and time */}
              <div>
                <div className="text-sm font-medium text-gray-500">Date & Time</div>
                <div>{formatDate(transaction.timestamp)} at {formatTime(transaction.timestamp)}</div>
              </div>
              
              {/* Reference */}
              {transaction.referenceId && (
                <div className="col-span-full">
                  <div className="text-sm font-medium text-gray-500">Reference</div>
                  <div className="text-sm font-mono bg-gray-100 p-1 rounded">{transaction.referenceId}</div>
                </div>
              )}
              
              {/* Reason or notes */}
              {transaction.reason && (
                <div className="col-span-full">
                  <div className="text-sm font-medium text-gray-500">Reason</div>
                  <div>{transaction.reason}</div>
                </div>
              )}
              
              {/* Processed by (parent) */}
              {transaction.createdBy && (
                <div className="col-span-full">
                  <div className="text-sm font-medium text-gray-500">Processed by</div>
                  <div className="flex items-center">
                    <UserAvatar 
                      user={findUserById(transaction.createdBy)} 
                      size={20} 
                      className="mr-2" 
                    />
                    <span>{findUserById(transaction.createdBy).name}</span>
                  </div>
                </div>
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
      {/* Header with title - only if not embedded */}
      {!isEmbedded && (
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">Palsson Bucks Transactions</h2>
          <p className="text-gray-600">View the history of all earnings and spendings</p>
        </div>
      )}
      
      {/* Filters */}
      {renderFilters()}
      
      {/* Date range filter */}
      {renderDateFilter()}
      
      {/* Transaction list */}
      <div className={isEmbedded ? '' : 'flex-grow overflow-auto'}>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="space-y-3">
            {filteredTransactions.map(transaction => renderTransaction(transaction))}
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>
    </div>
  );
};

export default BucksTransactionHistory;