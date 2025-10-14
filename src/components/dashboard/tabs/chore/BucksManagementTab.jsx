import React, { useState, useEffect } from 'react';
import { DollarSign, PlusCircle, MinusCircle, Clock, Filter, Download, FileText, BarChart2, Settings, User } from 'lucide-react';
import { useFamily } from '../../../../contexts/FamilyContext';
import { useChore } from '../../../../contexts/ChoreContext';
import { NotionTabs } from '../../../common/NotionUI';
import BucksTransactionHistory from '../../../bucks/BucksTransactionHistory';

const BucksManagementTab = () => {
  const { familyMembers } = useFamily();
  const { 
    getFamilyBucksBalances, 
    getBucksTransactions, 
    createBucksTransaction, 
    getBucksStatistics,
    updateBucksSettings
  } = useChore();
  
  // State for tab management
  const [activeTab, setActiveTab] = useState('balances');
  
  // State for family balances and transactions
  const [familyBalances, setFamilyBalances] = useState([]);
  const [bucksTransactions, setBucksTransactions] = useState([]);
  const [bucksStatistics, setBucksStatistics] = useState(null);
  
  // State for filtering transactions
  const [filters, setFilters] = useState({
    childId: 'all',
    dateRange: '7days',
    transactionType: 'all'
  });
  
  // State for transaction form
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionForm, setTransactionForm] = useState({
    childId: '',
    amount: 0,
    type: 'manual_add',
    description: '',
    isSystemTransaction: false
  });
  
  // State for settings
  const [bucksSettings, setBucksSettings] = useState({
    earnRateMultiplier: 1.0,
    allowNegativeBalances: false,
    defaultChoreValue: 5,
    rewardApprovalRequired: true,
    streakBonusEnabled: true,
    streakBonusAmount: 2
  });
  
  // Load all data for the tab
  const loadBucksData = async () => {
    try {
      // Load family balances
      const balances = await getFamilyBucksBalances();
      setFamilyBalances(balances);
      
      // Load transactions based on filters
      await loadTransactions();
      
      // Load statistics
      const stats = await getBucksStatistics(filters.childId, filters.dateRange);
      setBucksStatistics(stats);
    } catch (error) {
      console.error('Error loading bucks data:', error);
    }
  };
  
  // Load transactions based on current filters
  const loadTransactions = async () => {
    try {
      const transactions = await getBucksTransactions(
        filters.childId,
        filters.dateRange,
        filters.transactionType
      );
      setBucksTransactions(transactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Handle changing transaction form fields
  const handleTransactionFormChange = (key, value) => {
    setTransactionForm(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Submit new transaction
  const handleSubmitTransaction = async () => {
    try {
      // Validate form
      if (!transactionForm.childId || !transactionForm.amount || !transactionForm.description) {
        alert('Please fill in all required fields');
        return;
      }
      
      // Create the transaction
      await createBucksTransaction({
        childId: transactionForm.childId,
        amount: transactionForm.type.startsWith('manual_add') ? Math.abs(transactionForm.amount) : -Math.abs(transactionForm.amount),
        description: transactionForm.description,
        type: transactionForm.type,
        isSystemTransaction: transactionForm.isSystemTransaction
      });
      
      // Reset form and close
      setTransactionForm({
        childId: '',
        amount: 0,
        type: 'manual_add',
        description: '',
        isSystemTransaction: false
      });
      setShowTransactionForm(false);
      
      // Reload data
      await loadBucksData();
    } catch (error) {
      console.error('Error creating transaction:', error);
      alert('Failed to create transaction. Please try again.');
    }
  };
  
  // Handle settings changes
  const handleSettingsChange = (key, value) => {
    setBucksSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Save settings
  const handleSaveSettings = async () => {
    try {
      await updateBucksSettings(bucksSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };
  
  // Export transactions to CSV
  const exportTransactionsToCSV = () => {
    if (bucksTransactions.length === 0) {
      alert('No transactions to export');
      return;
    }
    
    // Create CSV content
    const headers = 'Date,Child,Amount,Type,Description\n';
    const rows = bucksTransactions.map(t => {
      const child = familyMembers.find(m => m.id === t.childId)?.name || 'Unknown';
      return `${new Date(t.timestamp).toLocaleString()},${child},${t.amount},${t.type},${t.description}`;
    }).join('\n');
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}${rows}`;
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `palsson_bucks_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    
    // Trigger download and clean up
    link.click();
    document.body.removeChild(link);
  };
  
  // Effect to load data on mount and when filters change
  useEffect(() => {
    loadBucksData();
  }, [filters]);
  
  // Render tabs
  const tabs = [
    { id: 'balances', label: 'Balances', icon: <DollarSign size={16} /> },
    { id: 'transactions', label: 'Transactions', icon: <Clock size={16} /> },
    { id: 'statistics', label: 'Statistics', icon: <BarChart2 size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> }
  ];
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Palsson Bucks Management</h1>
        <p className="text-gray-600">Manage virtual currency for your family</p>
      </div>
      
      {/* Tabs navigation */}
      <NotionTabs 
        tabs={tabs} 
        activeTab={activeTab} 
        onChange={setActiveTab} 
        className="mb-6"
      />
      
      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Family Balances</h2>
            <button
              onClick={() => setShowTransactionForm(true)}
              className="flex items-center text-sm bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
            >
              <PlusCircle size={16} className="mr-2" />
              Add/Remove Bucks
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Family Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Earned This Week
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent This Week
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {familyBalances
                  .filter(b => familyMembers.find(m => m.id === b.childId && m.type === 'child'))
                  .map((balance) => {
                    const child = familyMembers.find(m => m.id === balance.childId);
                    return (
                      <tr key={balance.childId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                              {child?.profilePicture ? (
                                <img src={child.profilePicture} alt={child.name} className="h-10 w-10 rounded-full" />
                              ) : (
                                <User size={20} className="text-gray-500" />
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{child?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{child?.age ? `${child.age} years old` : ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-bold ${balance.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {balance.balance} Bucks
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            +{balance.earnedThisWeek || 0} Bucks
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            -{balance.spentThisWeek || 0} Bucks
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => {
                              setTransactionForm({
                                childId: balance.childId,
                                amount: 0,
                                type: 'manual_add',
                                description: '',
                                isSystemTransaction: false
                              });
                              setShowTransactionForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Add
                          </button>
                          <button 
                            onClick={() => {
                              setTransactionForm({
                                childId: balance.childId,
                                amount: 0,
                                type: 'manual_remove',
                                description: '',
                                isSystemTransaction: false
                              });
                              setShowTransactionForm(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          
          {/* No data message */}
          {familyBalances.length === 0 && (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <DollarSign size={48} className="mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium text-gray-900">No balances found</h3>
              <p className="text-gray-500 mt-1">Add children to your family to start managing their Palsson Bucks.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div>
          <div className="flex justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-lg font-medium">Transaction History</h2>
            
            <div className="flex space-x-2">
              <button
                onClick={exportTransactionsToCSV}
                className="flex items-center text-sm bg-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-300"
              >
                <Download size={16} className="mr-2" />
                Export CSV
              </button>
              
              <button
                onClick={() => setShowTransactionForm(true)}
                className="flex items-center text-sm bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600"
              >
                <PlusCircle size={16} className="mr-2" />
                New Transaction
              </button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <div className="flex items-center mb-2">
              <Filter size={16} className="text-gray-400 mr-2" />
              <h3 className="text-sm font-medium">Filters</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Child filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Child
                </label>
                <select
                  value={filters.childId}
                  onChange={(e) => handleFilterChange('childId', e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Children</option>
                  {familyMembers
                    .filter(m => m.type === 'child')
                    .map(child => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                </select>
              </div>
              
              {/* Date range filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Period
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="7days">Last 7 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              
              {/* Transaction type filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <select
                  value={filters.transactionType}
                  onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="earned">Earned</option>
                  <option value="spent">Spent</option>
                  <option value="manual">Manual Adjustments</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Transaction list */}
          <BucksTransactionHistory 
            transactions={bucksTransactions} 
            familyMembers={familyMembers}
          />
        </div>
      )}
      
      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Bucks Statistics</h2>
            
            <div className="flex space-x-2">
              <select
                value={filters.childId}
                onChange={(e) => handleFilterChange('childId', e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Children</option>
                {familyMembers
                  .filter(m => m.type === 'child')
                  .map(child => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
              </select>
              
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>
          
          {bucksStatistics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Earnings by category */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Earnings by Category</h3>
                {bucksStatistics.earningsByCategory.length > 0 ? (
                  <div className="space-y-2">
                    {bucksStatistics.earningsByCategory.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getColorForIndex(index) }}></div>
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <span className="text-sm font-medium">{category.value} Bucks</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No earnings data available</p>
                )}
              </div>
              
              {/* Spending by category */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Spending by Category</h3>
                {bucksStatistics.spendingByCategory.length > 0 ? (
                  <div className="space-y-2">
                    {bucksStatistics.spendingByCategory.map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getColorForIndex(index) }}></div>
                          <span className="text-sm">{category.name}</span>
                        </div>
                        <span className="text-sm font-medium">{category.value} Bucks</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No spending data available</p>
                )}
              </div>
              
              {/* Total statistics */}
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Summary</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">Total Earned</div>
                    <div className="text-xl font-bold text-green-600">{bucksStatistics.totalEarned} Bucks</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Total Spent</div>
                    <div className="text-xl font-bold text-red-600">{bucksStatistics.totalSpent} Bucks</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Current Balance</div>
                    <div className="text-xl font-bold">{bucksStatistics.totalEarned - bucksStatistics.totalSpent} Bucks</div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-500">Most Valuable Chore</div>
                    <div className="text-md font-medium">
                      {bucksStatistics.mostValuableChore?.name || 'N/A'} 
                      {bucksStatistics.mostValuableChore && (
                        <span className="ml-1 text-green-600">
                          ({bucksStatistics.mostValuableChore.value} Bucks)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <BarChart2 size={48} className="mx-auto text-gray-400 mb-2" />
              <h3 className="text-lg font-medium text-gray-900">No statistics available</h3>
              <p className="text-gray-500 mt-1">Statistics will appear as children earn and spend Palsson Bucks.</p>
            </div>
          )}
        </div>
      )}
      
      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-medium">Bucks System Settings</h2>
            
            <button
              onClick={handleSaveSettings}
              className="flex items-center text-sm bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
            >
              Save Settings
            </button>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            {/* Earn rate multiplier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Earn Rate Multiplier
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={bucksSettings.earnRateMultiplier}
                  onChange={(e) => handleSettingsChange('earnRateMultiplier', parseFloat(e.target.value))}
                  className="w-full max-w-md"
                />
                <span className="ml-3 text-sm font-medium">
                  {bucksSettings.earnRateMultiplier}x
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Adjust how quickly children earn Palsson Bucks. A higher value means they earn more for the same chores.
              </p>
            </div>
            
            {/* Default chore value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Chore Value
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={bucksSettings.defaultChoreValue}
                onChange={(e) => handleSettingsChange('defaultChoreValue', parseInt(e.target.value, 10))}
                className="w-full max-w-xs border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <p className="text-sm text-gray-500 mt-1">
                The default value for new chores in Palsson Bucks.
              </p>
            </div>
            
            {/* Allow negative balances */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="allow-negative"
                  type="checkbox"
                  checked={bucksSettings.allowNegativeBalances}
                  onChange={(e) => handleSettingsChange('allowNegativeBalances', e.target.checked)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="allow-negative" className="font-medium text-gray-700">
                  Allow Negative Balances
                </label>
                <p className="text-gray-500">
                  If enabled, children can spend more Bucks than they have, resulting in a negative balance.
                </p>
              </div>
            </div>
            
            {/* Reward approval required */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="reward-approval"
                  type="checkbox"
                  checked={bucksSettings.rewardApprovalRequired}
                  onChange={(e) => handleSettingsChange('rewardApprovalRequired', e.target.checked)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="reward-approval" className="font-medium text-gray-700">
                  Require Reward Approval
                </label>
                <p className="text-gray-500">
                  If enabled, parents must approve rewards before they are granted to children.
                </p>
              </div>
            </div>
            
            {/* Streak bonus enabled */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="streak-bonus"
                  type="checkbox"
                  checked={bucksSettings.streakBonusEnabled}
                  onChange={(e) => handleSettingsChange('streakBonusEnabled', e.target.checked)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="streak-bonus" className="font-medium text-gray-700">
                  Enable Streak Bonuses
                </label>
                <p className="text-gray-500">
                  If enabled, children earn bonus Bucks for completing the same chore multiple days in a row.
                </p>
              </div>
            </div>
            
            {/* Streak bonus amount */}
            {bucksSettings.streakBonusEnabled && (
              <div className="ml-7">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Streak Bonus Amount (per streak day)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={bucksSettings.streakBonusAmount}
                  onChange={(e) => handleSettingsChange('streakBonusAmount', parseInt(e.target.value, 10))}
                  className="w-full max-w-xs border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Amount of bonus Bucks earned for each consecutive day a chore is completed.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4">
              {transactionForm.type.startsWith('manual_add') 
                ? 'Add Palsson Bucks' 
                : 'Remove Palsson Bucks'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmitTransaction();
            }}>
              {/* Child selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Child
                </label>
                <select
                  value={transactionForm.childId}
                  onChange={(e) => handleTransactionFormChange('childId', e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  required
                >
                  <option value="">Select a child</option>
                  {familyMembers
                    .filter(m => m.type === 'child')
                    .map(child => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                </select>
              </div>
              
              {/* Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">
                      <DollarSign size={16} />
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={transactionForm.amount}
                    onChange={(e) => handleTransactionFormChange('amount', parseInt(e.target.value, 10) || 0)}
                    className="pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">
                      Bucks
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => handleTransactionFormChange('description', e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="E.g., Bonus for helping with dinner"
                  required
                />
              </div>
              
              {/* Transaction type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type
                </label>
                <select
                  value={transactionForm.type}
                  onChange={(e) => handleTransactionFormChange('type', e.target.value)}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  {transactionForm.type.startsWith('manual_add') ? (
                    <>
                      <option value="manual_add">Manual Addition</option>
                      <option value="manual_add_bonus">Bonus</option>
                      <option value="manual_add_gift">Gift</option>
                    </>
                  ) : (
                    <>
                      <option value="manual_remove">Manual Deduction</option>
                      <option value="manual_remove_penalty">Penalty</option>
                      <option value="manual_remove_correction">Correction</option>
                    </>
                  )}
                </select>
              </div>
              
              {/* System transaction checkbox */}
              <div className="flex items-start mb-6">
                <div className="flex items-center h-5">
                  <input
                    id="system-transaction"
                    type="checkbox"
                    checked={transactionForm.isSystemTransaction}
                    onChange={(e) => handleTransactionFormChange('isSystemTransaction', e.target.checked)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="system-transaction" className="font-medium text-gray-700">
                    System Transaction
                  </label>
                  <p className="text-gray-500">
                    Mark as a system transaction (won't show in child's history)
                  </p>
                </div>
              </div>
              
              {/* Form buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTransactionForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium text-white rounded ${
                    transactionForm.type.startsWith('manual_add')
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {transactionForm.type.startsWith('manual_add') 
                    ? 'Add Bucks' 
                    : 'Remove Bucks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to get colors for charts
const getColorForIndex = (index) => {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // yellow
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#6366F1', // indigo
    '#14B8A6', // teal
    '#F97316', // orange
    '#A855F7'  // violet
  ];
  
  return colors[index % colors.length];
};

export default BucksManagementTab;