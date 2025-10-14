// src/components/habits/HabitBankDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  PiggyBank, TrendingUp, Gift, BarChart3, DollarSign,
  Zap, Heart, Home, Sprout, Trophy, FileText, ShoppingCart
} from 'lucide-react';
import HabitBankService from '../../services/HabitBankService';

const HabitBankDashboard = ({ familyId, userId, onBack, onWithdrawal }) => {
  const [bankData, setBankData] = useState(null);
  const [portfolio, setPortfolio] = useState(null);
  const [statement, setStatement] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, portfolio, rewards, statement
  const [loading, setLoading] = useState(true);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

  useEffect(() => {
    loadBankData();
  }, [familyId]);

  const loadBankData = async () => {
    try {
      setLoading(true);
      
      // Initialize and get bank data
      const data = await HabitBankService.initializeHabitBank(familyId);
      setBankData(data);
      
      // Get portfolio analysis
      const portfolioData = await HabitBankService.getPortfolioAnalysis(familyId);
      setPortfolio(portfolioData);
      
      // Get latest statement
      const latestStatement = await HabitBankService.generateWeeklyStatement(familyId);
      setStatement(latestStatement);
    } catch (error) {
      console.error('Error loading bank data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccountIcon = (accountType) => {
    const icons = {
      'energy': Zap,
      'connection': Heart,
      'order': Home,
      'growth': Sprout
    };
    return icons[accountType] || PiggyBank;
  };

  const getAccountColor = (accountType) => {
    const colors = {
      'energy': '#FCD34D',
      'connection': '#F87171',
      'order': '#60A5FA',
      'growth': '#34D399'
    };
    return colors[accountType] || '#9CA3AF';
  };

  const handleRewardPurchase = async (reward) => {
    try {
      const result = await HabitBankService.makeWithdrawal(
        reward.id,
        familyId,
        userId
      );
      
      alert(`Success! You've redeemed ${reward.name}!`);
      setShowRewardModal(false);
      setSelectedReward(null);
      
      // Reload data
      await loadBankData();
      if (onWithdrawal) onWithdrawal();
    } catch (error) {
      alert('Insufficient balance or error processing reward.');
      console.error('Error purchasing reward:', error);
    }
  };

  const renderAccountCards = () => {
    if (!bankData) return null;

    const totalBalance = bankData.accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return (
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {bankData.accounts.map(account => {
            const Icon = getAccountIcon(account.accountType);
            const color = getAccountColor(account.accountType);
            
            return (
              <div
                key={account.accountType}
                className="bg-white rounded-lg p-6 border-2 hover:shadow-lg transition-all"
                style={{ borderColor: color }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-600">Tier</div>
                    <div className="font-medium">
                      {account.tier.name} {account.tier.emoji}
                    </div>
                  </div>
                </div>
                
                <h3 className="font-medium text-gray-700 mb-1">{account.accountName}</h3>
                <div className="text-2xl font-bold" style={{ color }}>
                  {account.balance}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  +{Math.round(account.balance * account.interestRate)} daily interest
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Total Family Wealth</h3>
              <div className="text-4xl font-bold">{totalBalance}</div>
              <div className="text-sm opacity-90 mt-2">
                Projected next week: {bankData.portfolio.projectedGrowth?.oneWeek || 0}
              </div>
            </div>
            <TrendingUp className="w-16 h-16 opacity-20" />
          </div>
        </div>
      </div>
    );
  };

  const renderPortfolio = () => {
    if (!portfolio) return null;

    return (
      <div className="space-y-6">
        {/* Portfolio Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-6 text-center">
            <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-3xl font-bold">{portfolio.metrics.totalValue}</div>
            <div className="text-sm text-gray-600">Total Value</div>
          </div>
          <div className="bg-white rounded-lg p-6 text-center">
            <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-3xl font-bold">{portfolio.metrics.diversificationScore}%</div>
            <div className="text-sm text-gray-600">Diversification</div>
          </div>
          <div className="bg-white rounded-lg p-6 text-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-3xl font-bold">+{portfolio.metrics.projectedGrowth.oneMonth}</div>
            <div className="text-sm text-gray-600">30-Day Projection</div>
          </div>
        </div>

        {/* Simple Visual Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Habit ROI Performance</h3>
            {/* Simple bar chart replacement */}
            <div className="space-y-3">
              {portfolio.habits.map(habit => (
                <div key={habit.habitId}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{habit.habitName}</span>
                    <span className="font-medium text-green-600">{habit.currentROI}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 rounded-full h-2 transition-all"
                      style={{ width: `${Math.min(habit.currentROI, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
            {/* Simple pie chart replacement */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-sm">Low Risk</span>
                </div>
                <span className="font-medium">{portfolio.metrics.riskProfile.low}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full mr-2"></div>
                  <span className="text-sm">Medium Risk</span>
                </div>
                <span className="font-medium">{portfolio.metrics.riskProfile.medium}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-400 rounded-full mr-2"></div>
                  <span className="text-sm">High Risk</span>
                </div>
                <span className="font-medium">{portfolio.metrics.riskProfile.high}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Habit Investments */}
        <div className="bg-white rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Your Habit Investments</h3>
          <div className="space-y-4">
            {portfolio.habits.map(habit => (
              <div key={habit.habitId} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{habit.habitName}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      Type: {habit.investmentType} • Risk: {habit.risk}
                    </div>
                    <div className="mt-2">
                      <div className="text-sm text-gray-600">Maturity Progress</div>
                      <div className="bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-green-500 rounded-full h-2"
                          style={{ width: `${habit.maturityProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold text-green-600">
                      {habit.currentROI}%
                    </div>
                    <div className="text-sm text-gray-600">ROI</div>
                  </div>
                </div>
                
                {/* Performance indicator */}
                <div className="mt-3 flex items-center text-sm">
                  {habit.performance.trend === 'improving' && (
                    <span className="text-green-600">↑ Improving</span>
                  )}
                  {habit.performance.trend === 'stable' && (
                    <span className="text-blue-600">→ Stable</span>
                  )}
                  {habit.performance.trend === 'declining' && (
                    <span className="text-red-600">↓ Needs attention</span>
                  )}
                </div>
                
                {/* Recommendations */}
                {habit.recommendations.length > 0 && (
                  <div className="mt-3 bg-blue-50 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-700 mb-1">Recommendations:</div>
                    <ul className="text-sm text-blue-600 space-y-1">
                      {habit.recommendations.map((rec, index) => (
                        <li key={index}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Investment Advice */}
        {portfolio.advice && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Investment Advisor</h3>
            <p className="text-gray-700 mb-3">{portfolio.advice.summary}</p>
            <ul className="space-y-2">
              {portfolio.advice.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2">✓</span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderRewards = () => {
    const rewards = [
      { id: 'movie_night', name: 'Family Movie Night', cost: 100, emoji: '🎬', description: 'Pizza, popcorn, and a movie!' },
      { id: 'special_outing', name: 'Special Outing', cost: 200, emoji: '🎡', description: 'Mini golf, bowling, or ice cream!' },
      { id: 'pizza_party', name: 'Pizza Party', cost: 150, emoji: '🍕', description: 'Order from your favorite place!' },
      { id: 'game_night', name: 'Board Game Night', cost: 80, emoji: '🎲', description: 'New game + snacks!' },
      { id: 'adventure_day', name: 'Adventure Day', cost: 500, emoji: '🏞️', description: 'Full day family adventure!' },
      { id: 'tech_time', name: 'Extra Screen Time', cost: 50, emoji: '📱', description: '2 hours bonus screen time!' }
    ];

    const totalBalance = bankData?.accounts.reduce((sum, acc) => sum + acc.balance, 0) || 0;

    return (
      <div>
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Family Reward Store</h3>
              <p className="text-gray-700 mt-1">Spend your habit wealth on amazing experiences!</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Available Balance</div>
              <div className="text-2xl font-bold text-purple-700">{totalBalance}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map(reward => {
            const canAfford = totalBalance >= reward.cost;
            
            return (
              <div
                key={reward.id}
                className={`bg-white rounded-lg p-6 border-2 transition-all ${
                  canAfford ? 'border-gray-200 hover:border-purple-300 hover:shadow-lg cursor-pointer' : 'border-gray-100 opacity-60'
                }`}
                onClick={() => {
                  if (canAfford) {
                    setSelectedReward(reward);
                    setShowRewardModal(true);
                  }
                }}
              >
                <div className="text-4xl mb-3">{reward.emoji}</div>
                <h4 className="font-semibold text-lg">{reward.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <div className="font-bold text-lg">{reward.cost} points</div>
                  {canAfford ? (
                    <span className="text-green-600 text-sm font-medium">Available</span>
                  ) : (
                    <span className="text-gray-500 text-sm">Need {reward.cost - totalBalance} more</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStatement = () => {
    if (!statement) return null;

    return (
      <div className="bg-white rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Weekly Statement</h3>
          <FileText className="w-6 h-6 text-gray-400" />
        </div>

        {/* Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Deposits</div>
              <div className="text-xl font-bold text-green-600">+{statement.summary.deposits}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Interest</div>
              <div className="text-xl font-bold text-blue-600">+{statement.summary.interest}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Withdrawals</div>
              <div className="text-xl font-bold text-red-600">-{statement.summary.withdrawals}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Net Growth</div>
              <div className="text-xl font-bold text-purple-600">+{statement.summary.netGrowth}</div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Account Performance</h4>
          <div className="space-y-3">
            {statement.accountDetails.map(account => {
              const Icon = getAccountIcon(account.accountType);
              const color = getAccountColor(account.accountType);
              
              return (
                <div key={account.accountType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Icon className="w-5 h-5 mr-2" style={{ color }} />
                    <span className="font-medium capitalize">{account.accountType}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-medium ${
                      account.netChange >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {account.netChange >= 0 ? '+' : ''}{account.netChange}
                    </span>
                    <span className="text-gray-600 text-sm ml-2">
                      (Balance: {account.endingBalance})
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Weekly Insights</h4>
          <ul className="space-y-2">
            {statement.insights.map((insight, index) => (
              <li key={index} className="text-sm text-gray-700">
                • {insight}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="habit-bank-dashboard">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <PiggyBank className="w-8 h-8 mr-2 text-green-600" />
          Habit Bank
        </h2>
        <div className="flex space-x-2">
          {['overview', 'portfolio', 'rewards', 'statement'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderAccountCards()}
      {activeTab === 'portfolio' && renderPortfolio()}
      {activeTab === 'rewards' && renderRewards()}
      {activeTab === 'statement' && renderStatement()}

      {/* Reward Purchase Modal */}
      {showRewardModal && selectedReward && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">{selectedReward.emoji}</div>
              <h3 className="text-xl font-bold">{selectedReward.name}</h3>
              <p className="text-gray-600 mt-2">{selectedReward.description}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span>Cost:</span>
                <span className="font-bold">{selectedReward.cost} points</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span>Your Balance:</span>
                <span className="font-bold">
                  {bankData?.accounts.reduce((sum, acc) => sum + acc.balance, 0) || 0} points
                </span>
              </div>
              <div className="border-t mt-2 pt-2">
                <div className="flex justify-between items-center font-bold">
                  <span>After Purchase:</span>
                  <span>
                    {(bankData?.accounts.reduce((sum, acc) => sum + acc.balance, 0) || 0) - selectedReward.cost} points
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleRewardPurchase(selectedReward)}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Purchase Reward
              </button>
              <button
                onClick={() => {
                  setShowRewardModal(false);
                  setSelectedReward(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitBankDashboard;