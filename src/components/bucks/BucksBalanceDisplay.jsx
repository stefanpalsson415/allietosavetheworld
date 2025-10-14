// src/components/bucks/BucksBalanceDisplay.jsx
import React from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  BarChart,
  CreditCard,
  Wallet
} from 'lucide-react';
import { useChore } from '../../contexts/ChoreContext';

/**
 * BucksBalanceDisplay - Component for displaying a child's Palsson Bucks balance
 * with visual indicators and stats
 * 
 * @param {Object} props
 * @param {string} props.childId - ID of child (if not using context's selectedChild)
 * @param {number} props.balance - Balance to display (overrides context balance)
 * @param {boolean} props.showStats - Whether to show additional earning/spending stats
 * @param {string} props.size - 'large', 'medium', or 'small' display
 * @param {string} props.className - Additional CSS classes
 */
const BucksBalanceDisplay = ({ 
  childId,
  balance,  // Accept balance as prop
  showStats = false,
  size = 'medium',
  className = ''
}) => {
  const { bucksBalance, transactionHistory, selectedChildId } = useChore();
  
  // Use provided childId or fall back to selected child
  const targetChildId = childId || selectedChildId;
  
  // Use provided balance or fall back to context balance
  const displayBalance = balance !== undefined ? balance : bucksBalance;
  
  // Size configurations
  const sizeConfig = {
    large: {
      containerClass: 'p-6',
      iconSize: 28,
      balanceClass: 'text-4xl',
      labelClass: 'text-lg',
      statsIconSize: 18
    },
    medium: {
      containerClass: 'p-4',
      iconSize: 24,
      balanceClass: 'text-3xl',
      labelClass: 'text-base',
      statsIconSize: 16
    },
    small: {
      containerClass: 'p-3',
      iconSize: 20,
      balanceClass: 'text-2xl',
      labelClass: 'text-sm',
      statsIconSize: 14
    }
  };
  
  const config = sizeConfig[size] || sizeConfig.medium;
  
  // Calculate stats if needed and have transaction history
  const stats = React.useMemo(() => {
    if (!showStats || !transactionHistory?.length) {
      return null;
    }
    
    // Last 30 days transactions
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = transactionHistory.filter(
      tx => new Date(tx.timestamp) > thirtyDaysAgo
    );
    
    // Calculate earned and spent amounts
    const earned = recentTransactions
      .filter(tx => tx.type === 'earning')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const spent = recentTransactions
      .filter(tx => tx.type === 'spending')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    // Get most recent transaction
    const lastTransaction = transactionHistory[0];
    
    return { earned, spent, lastTransaction };
  }, [transactionHistory, showStats]);
  
  // If no balance or child is selected, show placeholder
  if (!targetChildId) {
    return (
      <div className={`bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center ${config.containerClass} ${className}`}>
        <span className="text-gray-500">Select a child to view balance</span>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg min-w-[200px] ${config.containerClass} ${className}`}>
      <div className="flex items-center justify-center mb-1">
        <Wallet size={config.iconSize} className="text-green-600 mr-2" />
        <h3 className={`font-medium ${config.labelClass} text-green-800`}>Palsson Bucks Balance</h3>
      </div>
      
      <div className="flex justify-center items-center my-2">
        <DollarSign size={config.iconSize} className="text-green-600" />
        <span className={`font-bold ${config.balanceClass} text-green-700 min-w-[80px] text-center`}>{displayBalance}</span>
      </div>
      
      {/* Stats section */}
      {showStats && stats && (
        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="flex flex-wrap -mx-2">
            {/* Earned stats */}
            <div className="w-1/2 px-2 mb-3">
              <div className="flex items-center text-emerald-700">
                <TrendingUp size={config.statsIconSize} className="mr-1" />
                <span className="text-sm font-medium">Earned (30d)</span>
              </div>
              <div className="font-bold text-emerald-800 mt-1 flex items-center">
                <DollarSign size={14} className="mr-0.5" />
                {stats.earned}
              </div>
            </div>
            
            {/* Spent stats */}
            <div className="w-1/2 px-2 mb-3">
              <div className="flex items-center text-amber-700">
                <TrendingDown size={config.statsIconSize} className="mr-1" />
                <span className="text-sm font-medium">Spent (30d)</span>
              </div>
              <div className="font-bold text-amber-800 mt-1 flex items-center">
                <DollarSign size={14} className="mr-0.5" />
                {stats.spent}
              </div>
            </div>
            
            {/* Last transaction */}
            {stats.lastTransaction && (
              <div className="w-full px-2">
                <div className="flex items-center text-gray-700">
                  <Clock size={config.statsIconSize} className="mr-1" />
                  <span className="text-sm font-medium">Last Transaction</span>
                </div>
                <div className="text-sm text-gray-800 mt-1">
                  {stats.lastTransaction.description || 'Transaction'} 
                  <span className={`ml-1 ${stats.lastTransaction.type === 'earning' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    ({stats.lastTransaction.type === 'earning' ? '+' : '-'}${stats.lastTransaction.amount})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Simple chart visualization for larger sizes */}
      {size === 'large' && transactionHistory && transactionHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-green-200">
          <div className="flex items-center mb-2">
            <BarChart size={18} className="text-green-600 mr-1" />
            <span className="text-sm font-medium text-green-800">Recent Activity</span>
          </div>
          <div className="h-12 flex items-end space-x-1">
            {transactionHistory.slice(0, 10).map((tx, idx) => {
              const isEarning = tx.type === 'earning';
              const maxAmount = Math.max(...transactionHistory.slice(0, 10).map(t => t.amount));
              const height = Math.max(3, Math.round((tx.amount / maxAmount) * 100));
              
              return (
                <div 
                  key={idx} 
                  className={`w-1/10 ${isEarning ? 'bg-emerald-500' : 'bg-amber-500'} rounded-t`}
                  style={{ height: `${height}%` }}
                  title={`${tx.description || 'Transaction'}: ${isEarning ? '+' : '-'}${tx.amount}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BucksBalanceDisplay;