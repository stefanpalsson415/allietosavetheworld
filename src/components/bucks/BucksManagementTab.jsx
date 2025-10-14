// src/components/bucks/BucksManagementTab.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  DollarSign, 
  CreditCard, 
  Calendar, 
  Users,
  Check,
  X,
  Sliders,
  Settings,
  Info,
  PanelLeft,
  RefreshCw,
  Download,
  Upload,
  User,
  ArrowRightCircle,
  Gift,
  Award,
  Trash,
  AlertCircle,
  Tag,
  Wallet,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  PieChart
} from 'lucide-react';
import { useChore } from '../../contexts/ChoreContext';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';
import BucksTransactionHistory from './BucksTransactionHistory';
import BucksBalanceDisplay from './BucksBalanceDisplay';
import { 
  BarChart, Bar, LineChart, Line, PieChart as RePieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

/**
 * ChildBucksTab - Child-friendly view for viewing and managing their own Palsson Bucks
 */
const ChildBucksTab = ({ 
  bucksBalance,
  transactions,
  refreshBalances 
}) => {
  const { selectedUser } = useFamily();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Navigation tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <Wallet size={18} /> },
    { id: 'history', label: 'History', icon: <CreditCard size={18} /> },
    { id: 'rewards', label: 'Rewards', icon: <Gift size={18} /> }
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
        </button>
      ))}
    </div>
  );
  
  // Dashboard tab content
  const renderDashboardTab = () => (
    <div className="max-w-4xl mx-auto">
      {/* Balance card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 text-center">
        <h2 className="text-lg font-medium text-gray-700 mb-4">Your Palsson Bucks Balance</h2>
        <div className="inline-block">
          <BucksBalanceDisplay childId={selectedUser.id} size="large" showStats={true} className="mb-4" />
        </div>
      </div>
      
      {/* Recent activity section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-700">Recent Activity</h2>
          <button 
            className="text-blue-600 text-sm flex items-center"
            onClick={() => setActiveTab('history')}
          >
            View All <ArrowRightCircle size={14} className="ml-1" />
          </button>
        </div>
        
        {transactions && transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.slice(0, 5).map((transaction, index) => (
              <div key={index} className={`flex items-center border-b border-gray-100 pb-3 ${index === 0 ? 'pt-0' : 'pt-3'}`}>
                <div className={`rounded-full p-2 mr-3 ${transaction.amount >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {transaction.amount >= 0 ? (
                    <Plus size={16} className="text-green-600" />
                  ) : (
                    <Minus size={16} className="text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{transaction.reason || 'Bucks Transaction'}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(transaction.timestamp).toLocaleDateString()}
                  </div>
                </div>
                <div className={`font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.amount >= 0 ? '+' : ''}{transaction.amount} Bucks
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent transactions
          </div>
        )}
      </div>
      
      {/* Goal section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-4">Saving Goal</h2>
        
        <div className="p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center mb-3">
            <Gift size={20} className="text-purple-500 mr-2" />
            <div className="flex-1">
              <h3 className="font-medium">Video Game</h3>
              <div className="text-sm text-gray-500">50 Bucks needed</div>
            </div>
            <Tag size={16} className="text-gray-400" />
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${Math.min(bucksBalance / 50 * 100, 100)}%` }}></div>
          </div>
          
          <div className="flex justify-between text-sm">
            <div>{bucksBalance} Bucks saved</div>
            <div>{Math.max(0, 50 - bucksBalance)} Bucks to go</div>
          </div>
        </div>
      </div>
      
      {/* Tips section */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-start">
          <Info size={20} className="text-blue-500 mr-3 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800">Bucks Earning Tips</h3>
            <p className="text-blue-600 text-sm mt-1 mb-2">
              Here are some ways you can earn more Palsson Bucks:
            </p>
            <ul className="list-disc list-inside text-blue-600 text-sm space-y-1">
              <li>Complete your daily chores</li>
              <li>Help with extra tasks around the house</li>
              <li>Complete your homework on time</li>
              <li>Demonstrate good behavior</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
  
  // History tab content
  const renderHistoryTab = () => (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Your Transaction History</h2>
        <p className="text-gray-600">See your complete history of earnings and spending</p>
      </div>
      
      <div className="flex-grow overflow-auto">
        <BucksTransactionHistory
          showFilters={false}
          isEmbedded={true}
          onRefresh={refreshBalances}
          childOnly={true}
          childId={selectedUser.id}
        />
      </div>
    </div>
  );
  
  // Rewards tab content
  const renderRewardsTab = () => {
    // Example rewards that could be replaced with data from the backend
    const availableRewards = [
      {
        id: 1,
        name: "Video Game Time",
        bucksNeeded: 10,
        description: "30 minutes of extra video game time"
      },
      {
        id: 2,
        name: "Movie Night",
        bucksNeeded: 20,
        description: "Choose a movie for family movie night"
      },
      {
        id: 3,
        name: "Special Dessert",
        bucksNeeded: 15,
        description: "Choose a special dessert for the family"
      },
      {
        id: 4,
        name: "Stay Up Late",
        bucksNeeded: 25,
        description: "Stay up 30 minutes past bedtime"
      }
    ];

    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">Rewards Shop</h2>
          <p className="text-gray-600">Spend your Palsson Bucks on rewards</p>
        </div>
        
        <div className="flex mb-4 items-center">
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 flex items-center">
            <DollarSign size={18} className="text-green-600 mr-1" />
            <span className="font-bold text-green-700">{bucksBalance}</span>
            <span className="ml-1 text-green-700">Bucks Available</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableRewards.map(reward => (
            <div key={reward.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{reward.name}</h3>
                  <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {reward.bucksNeeded} Bucks
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-4">{reward.description}</p>
                <button
                  className={`w-full py-2 rounded-md text-white font-medium 
                    ${bucksBalance >= reward.bucksNeeded 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-400 cursor-not-allowed'}`}
                  disabled={bucksBalance < reward.bucksNeeded}
                >
                  {bucksBalance >= reward.bucksNeeded ? 'Redeem Reward' : 'Not Enough Bucks'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render the active tab content
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardTab();
      case 'history':
        return renderHistoryTab();
      case 'rewards':
        return renderRewardsTab();
      default:
        return renderDashboardTab();
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
    </div>
  );
};

/**
 * ParentBucksTab - Parent view for managing Palsson Bucks system with
 * controls for adjusting balances, viewing transactions and configuring settings
 */
const ParentBucksTab = ({ 
  adjustBucksBalance, 
  loadBucksBalance,
  bucksBalance,
  selectedChildId,
  selectChild,
  familyMembers,
  selectedUser,
  getBucksStatistics 
}) => {
  // Local state
  const [activeTab, setActiveTab] = useState('balances');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('earning'); // 'earning' or 'spending'
  const [selectedChildForAdjustment, setSelectedChildForAdjustment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Statistics state - moved here from renderStatisticsTab
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Filter for children only
  const childrenMembers = familyMembers.filter(member => member.role === 'child');
  
  // Load statistics when statistics tab is active
  useEffect(() => {
    if (activeTab === 'statistics' && getBucksStatistics) {
      const loadStatistics = async () => {
        try {
          setLoadingStats(true);
          const stats = await getBucksStatistics();
          setStatistics(stats);
        } catch (error) {
          console.error('Error loading statistics:', error);
        } finally {
          setLoadingStats(false);
        }
      };
      
      loadStatistics();
    }
  }, [activeTab, getBucksStatistics]);
  
  // Refresh balances
  const refreshBalances = () => {
    loadBucksBalance();
  };
  
  // Handle adjustment dialog close
  const handleCloseAdjustment = () => {
    setIsAdjusting(false);
    setAdjustmentAmount(0);
    setAdjustmentReason('');
    setSelectedChildForAdjustment(null);
  };
  
  // Handle adjustment submit
  const handleSubmitAdjustment = async () => {
    if (!selectedChildForAdjustment || isSubmitting || adjustmentAmount <= 0) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Calculate the actual amount (negative for spending)
      const amount = adjustmentType === 'earning' 
        ? adjustmentAmount 
        : -adjustmentAmount;
      
      // Apply the adjustment
      await adjustBucksBalance(
        selectedChildForAdjustment.id,
        amount,
        adjustmentReason,
        selectedUser.id
      );
      
      // Show success message
      setSuccess(`Successfully ${adjustmentType === 'earning' ? 'added' : 'deducted'} ${adjustmentAmount} Bucks ${adjustmentType === 'earning' ? 'to' : 'from'} ${selectedChildForAdjustment.name}'s account`);
      
      // Reset form after a delay
      setTimeout(() => {
        handleCloseAdjustment();
        refreshBalances();
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error adjusting balance:', err);
      setError(err.message || 'Failed to adjust balance');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Navigation tabs
  const tabs = [
    { id: 'balances', label: 'Balances', icon: <DollarSign size={18} /> },
    { id: 'transactions', label: 'Transactions', icon: <CreditCard size={18} /> },
    { id: 'statistics', label: 'Statistics', icon: <BarChart3 size={18} /> },
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
        </button>
      ))}
    </div>
  );
  
  // Render balances tab content
  const renderBalancesTab = () => (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Palsson Bucks Balances</h2>
        
        <button 
          className="px-3 py-2 bg-blue-600 rounded-md text-white hover:bg-blue-700 flex items-center"
          onClick={() => {
            setAdjustmentType('earning');
            setIsAdjusting(true);
          }}
        >
          <Plus size={18} className="mr-1" />
          <span>Adjust Balance</span>
        </button>
      </div>
      
      {/* Child balances grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {childrenMembers.map(child => (
          <div 
            key={child.id} 
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Child header */}
            <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center">
                <UserAvatar user={child} size={36} className="mr-3" />
                <div>
                  <h3 className="font-bold text-gray-800">{child.name}</h3>
                  <p className="text-xs text-gray-500">Child Account</p>
                </div>
              </div>
              
              <div className="flex">
                <button 
                  className="p-1 text-gray-500 hover:text-green-600 mr-1"
                  onClick={() => {
                    setSelectedChildForAdjustment(child);
                    setAdjustmentType('earning');
                    setIsAdjusting(true);
                  }}
                  title="Add Bucks"
                >
                  <Plus size={18} />
                </button>
                <button 
                  className="p-1 text-gray-500 hover:text-red-600"
                  onClick={() => {
                    setSelectedChildForAdjustment(child);
                    setAdjustmentType('spending');
                    setIsAdjusting(true);
                  }}
                  title="Deduct Bucks"
                >
                  <Minus size={18} />
                </button>
              </div>
            </div>
            
            {/* Balance display */}
            <div 
              className="p-4 cursor-pointer" 
              onClick={() => {
                selectChild(child.id);
                setActiveTab('transactions');
              }}
            >
              <BucksBalanceDisplay 
                childId={child.id} 
                size="small" 
                showStats={false}
                className="mb-4"
              />
              
              <div className="text-center mt-3">
                <button 
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center mx-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectChild(child.id);
                    setActiveTab('transactions');
                  }}
                >
                  View Transactions
                  <ArrowRightCircle size={14} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* No children message */}
      {childrenMembers.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users size={24} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">No Child Accounts</h3>
          <p className="text-gray-600 mb-4">
            Add children to your family to manage their Palsson Bucks balances.
          </p>
        </div>
      )}
    </div>
  );
  
  // Render transactions tab content
  const renderTransactionsTab = () => (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Transaction History</h2>
        <p className="text-gray-600">View and filter transaction records for Palsson Bucks</p>
      </div>
      
      <div className="flex-grow overflow-auto">
        <BucksTransactionHistory
          showFilters={true}
          isEmbedded={true}
          onRefresh={refreshBalances}
        />
      </div>
    </div>
  );
  
  // Render settings tab content
  const renderSettingsTab = () => (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Palsson Bucks Settings</h2>
        <p className="text-gray-600">Configure how the virtual currency system works</p>
      </div>
      
      <div className="space-y-6">
        {/* Auto-approval setting */}
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
        
        {/* Notification settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">Transaction Notifications</h3>
              <p className="text-sm text-gray-600">Notify family when Palsson Bucks are earned or spent</p>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        
        {/* Advanced settings */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3">Advanced Settings</h3>
          
          <div className="space-y-4">
            {/* Minimum reward setting */}
            <div className="flex items-center">
              <div className="w-1/2">
                <label className="text-sm font-medium text-gray-700">Minimum Reward Value</label>
                <p className="text-xs text-gray-500">Smallest amount of Bucks that can be awarded</p>
              </div>
              <div className="w-1/2">
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="number"
                    className="w-20 pl-8 py-1 px-2 border border-gray-300 rounded-md"
                    defaultValue={1}
                    min={1}
                  />
                </div>
              </div>
            </div>
            
            {/* Maximum reward setting */}
            <div className="flex items-center">
              <div className="w-1/2">
                <label className="text-sm font-medium text-gray-700">Maximum Reward Value</label>
                <p className="text-xs text-gray-500">Largest amount of Bucks that can be awarded</p>
              </div>
              <div className="w-1/2">
                <div className="relative">
                  <DollarSign size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="number"
                    className="w-20 pl-8 py-1 px-2 border border-gray-300 rounded-md"
                    defaultValue={100}
                    min={1}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Admin actions */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3">Admin Actions</h3>
          
          <div className="flex flex-wrap gap-3">
            <button className="px-3 py-2 flex items-center border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <Download size={16} className="mr-1" /> Export Transactions
            </button>
            <button className="px-3 py-2 flex items-center border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              <Upload size={16} className="mr-1" /> Import Transactions
            </button>
            <button className="px-3 py-2 flex items-center border border-red-300 rounded-md text-red-700 hover:bg-red-50">
              <RefreshCw size={16} className="mr-1" /> Reset All Balances
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render statistics tab content
  const renderStatisticsTab = () => {
    
    if (loadingStats) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (!statistics) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No statistics available</p>
        </div>
      );
    }
    
    // Prepare data for charts
    const balanceData = Object.entries(statistics.childBalances).map(([childId, data]) => {
      const child = familyMembers.find(m => m.id === childId);
      return {
        name: child?.name || 'Unknown',
        balance: data.currentBalance,
        earned: data.lifetimeEarned,
        spent: data.lifetimeSpent
      };
    });
    
    const monthlyData = Object.entries(statistics.monthlyTrends).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      earned: data.earned,
      spent: data.spent,
      net: data.net
    }));
    
    const sourceData = [
      { name: 'Chores', value: statistics.last90Days.choreRewards, color: '#10B981' },
      { name: 'Bonuses', value: statistics.last90Days.bonuses, color: '#3B82F6' },
      { name: 'Adjustments', value: statistics.last90Days.adjustments, color: '#8B5CF6' },
      { name: 'Rewards', value: statistics.last90Days.rewardPurchases, color: '#EF4444' }
    ].filter(item => item.value > 0);
    
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalBalance}</p>
              </div>
              <Wallet className="text-blue-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earned</p>
                <p className="text-2xl font-bold text-green-600">{statistics.totalLifetimeEarned}</p>
              </div>
              <TrendingUp className="text-green-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Spent</p>
                <p className="text-2xl font-bold text-red-600">{statistics.totalLifetimeSpent}</p>
              </div>
              <TrendingDown className="text-red-500" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Children</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(statistics.childBalances).length}</p>
              </div>
              <Users className="text-purple-500" size={32} />
            </div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Balance by Child */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Balance by Child</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={balanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="balance" fill="#3B82F6" name="Current Balance" />
                <Bar dataKey="earned" fill="#10B981" name="Total Earned" />
                <Bar dataKey="spent" fill="#EF4444" name="Total Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="earned" stroke="#10B981" name="Earned" />
                <Line type="monotone" dataKey="spent" stroke="#EF4444" name="Spent" />
                <Line type="monotone" dataKey="net" stroke="#3B82F6" name="Net" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Source Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Last 90 Days by Source</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, value, percent}) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Top Performers</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Top Earners</h4>
                {statistics.topEarners.map((earner, index) => {
                  const child = familyMembers.find(m => m.id === earner.childId);
                  return (
                    <div key={earner.childId} className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 mr-2">{index + 1}.</span>
                        <UserAvatar user={child} size={24} className="mr-2" />
                        <span className="font-medium">{child?.name || 'Unknown'}</span>
                      </div>
                      <span className="font-semibold text-green-600">{earner.lifetimeEarned} Bucks</span>
                    </div>
                  );
                })}
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Top Savers</h4>
                {statistics.topSavers.map((saver, index) => {
                  const child = familyMembers.find(m => m.id === saver.childId);
                  return (
                    <div key={saver.childId} className="flex items-center justify-between py-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-500 mr-2">{index + 1}.</span>
                        <UserAvatar user={child} size={24} className="mr-2" />
                        <span className="font-medium">{child?.name || 'Unknown'}</span>
                      </div>
                      <span className="font-semibold text-blue-600">{saver.savingsRate}% saved</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render the active tab content
  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'balances':
        return renderBalancesTab();
      case 'transactions':
        return renderTransactionsTab();
      case 'statistics':
        return renderStatisticsTab();
      case 'settings':
        return renderSettingsTab();
      default:
        return renderBalancesTab();
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
      
      {/* Balance adjustment dialog */}
      {isAdjusting && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleCloseAdjustment}
          />
          
          {/* Dialog */}
          <div className="flex items-center justify-center min-h-screen p-4">
            <div 
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">
                  {adjustmentType === 'earning' ? 'Add' : 'Deduct'} Palsson Bucks
                </h2>
                <button 
                  onClick={handleCloseAdjustment}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Form */}
              <div className="p-6">
                {/* Success message */}
                {success && (
                  <div className="mb-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4">
                    <div className="flex">
                      <Check size={20} className="mr-2" />
                      <p>{success}</p>
                    </div>
                  </div>
                )}
                
                {/* Error message */}
                {error && (
                  <div className="mb-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
                    <div className="flex">
                      <X size={20} className="mr-2" />
                      <p>{error}</p>
                    </div>
                  </div>
                )}
                
                {/* Child selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Child
                  </label>
                  <div className="relative">
                    <select
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      value={selectedChildForAdjustment?.id || ''}
                      onChange={(e) => {
                        const childId = e.target.value;
                        const child = childrenMembers.find(c => c.id === childId);
                        setSelectedChildForAdjustment(child || null);
                      }}
                      disabled={isSubmitting}
                    >
                      <option value="">Select a child...</option>
                      {childrenMembers.map(child => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Amount input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {adjustmentType === 'earning' ? 'Amount to Add' : 'Amount to Deduct'}
                  </label>
                  <div className="relative mt-1 rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign size={16} className={`text-${adjustmentType === 'earning' ? 'green' : 'red'}-500`} />
                    </div>
                    <input
                      type="number"
                      className={`block w-full pl-10 pr-12 py-2 sm:text-sm border-gray-300 rounded-md focus:ring-${adjustmentType === 'earning' ? 'green' : 'red'}-500 focus:border-${adjustmentType === 'earning' ? 'green' : 'red'}-500`}
                      placeholder="0.00"
                      min="1"
                      value={adjustmentAmount || ''}
                      onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                      disabled={isSubmitting}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">Bucks</span>
                    </div>
                  </div>
                </div>
                
                {/* Reason input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason (Optional)
                  </label>
                  <textarea
                    rows="2"
                    className="shadow-sm block w-full focus:ring-blue-500 focus:border-blue-500 sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Enter a reason for this adjustment..."
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                
                {/* Action buttons */}
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="button"
                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-${
                      adjustmentType === 'earning' ? 'green' : 'red'
                    }-600 text-base font-medium text-white hover:bg-${
                      adjustmentType === 'earning' ? 'green' : 'red'
                    }-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${
                      adjustmentType === 'earning' ? 'green' : 'red'
                    }-500 sm:col-start-2 sm:text-sm`}
                    onClick={handleSubmitAdjustment}
                    disabled={isSubmitting || !selectedChildForAdjustment || adjustmentAmount <= 0}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <RefreshCw size={18} className="animate-spin mr-2" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <>
                        {adjustmentType === 'earning' ? (
                          <>
                            <Plus size={18} className="mr-1" />
                            <span>Add Bucks</span>
                          </>
                        ) : (
                          <>
                            <Minus size={18} className="mr-1" />
                            <span>Deduct Bucks</span>
                          </>
                        )}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                    onClick={handleCloseAdjustment}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * BucksManagementTab - Component that renders different views based on user role
 */
const BucksManagementTab = () => {
  const { 
    adjustBucksBalance, 
    loadBucksBalance,
    bucksBalance,
    selectedChildId,
    selectChild,
    getRecentTransactions,
    getBucksStatistics
  } = useChore();
  const { familyMembers, selectedUser } = useFamily();
  
  const [transactions, setTransactions] = useState([]);

  // Load recent transactions for the selected user if they are a child
  useEffect(() => {
    const loadTransactions = async () => {
      if (selectedUser?.role === 'child') {
        try {
          const recentTransactions = await getRecentTransactions(selectedUser.id);
          setTransactions(recentTransactions);
        } catch (error) {
          console.error('Error loading transactions:', error);
        }
      }
    };
    
    loadTransactions();
  }, [selectedUser, getRecentTransactions]);

  // If no user is selected, show a message
  if (!selectedUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No User Selected</h3>
          <p className="text-gray-600">Please select a family member to view their Palsson Bucks.</p>
        </div>
      </div>
    );
  }

  // Render role-specific view
  if (selectedUser.role === 'child') {
    return (
      <ChildBucksTab 
        bucksBalance={bucksBalance}
        transactions={transactions}
        refreshBalances={loadBucksBalance}
      />
    );
  } else {
    return (
      <ParentBucksTab 
        adjustBucksBalance={adjustBucksBalance}
        loadBucksBalance={loadBucksBalance}
        bucksBalance={bucksBalance}
        selectedChildId={selectedChildId}
        selectChild={selectChild}
        familyMembers={familyMembers}
        selectedUser={selectedUser}
        getBucksStatistics={getBucksStatistics}
      />
    );
  }
};

export default BucksManagementTab;