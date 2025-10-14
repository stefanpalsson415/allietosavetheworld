// src/services/BucksService.js
import { db } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  runTransaction,
  Timestamp, 
  serverTimestamp, 
  increment
} from 'firebase/firestore';

class BucksService {
  constructor() {
    this.db = db;
  }

  /**
   * Initialize Palsson Bucks balance for a child
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {number} initialBalance - Initial balance (default: 0)
   * @returns {Promise<Object>} - Balance data
   */
  async initializeBalance(familyId, childId, initialBalance = 0) {
    try {
      const balanceRef = doc(this.db, 'bucksBalances', childId);
      const balanceSnap = await getDoc(balanceRef);
      
      // Only initialize if balance doesn't exist
      if (!balanceSnap.exists()) {
        const balanceData = {
          familyId,
          currentBalance: initialBalance,
          lifetimeEarned: initialBalance > 0 ? initialBalance : 0,
          lifetimeSpent: 0,
          updatedAt: serverTimestamp()
        };
        
        await setDoc(balanceRef, balanceData);
        
        // Create initial transaction if balance is not 0
        if (initialBalance !== 0) {
          await this.createTransaction(familyId, childId, {
            type: 'adjusted',
            amount: initialBalance,
            description: 'Initial balance',
            source: {
              type: 'admin',
              id: null
            }
          });
        }
        
        return {
          ...balanceData,
          updatedAt: new Date()
        };
      }
      
      // Return existing balance
      return {
        ...balanceSnap.data(),
        updatedAt: balanceSnap.data().updatedAt?.toDate()
      };
    } catch (error) {
      console.error("Error initializing Palsson Bucks balance:", error);
      throw error;
    }
  }

  /**
   * Get balance for a child
   * @param {string} childId - Child ID
   * @returns {Promise<Object>} - Balance data
   */
  async getBalance(childId) {
    try {
      const balanceRef = doc(this.db, 'bucksBalances', childId);
      const balanceSnap = await getDoc(balanceRef);
      
      if (!balanceSnap.exists()) {
        throw new Error(`No balance found for child with ID ${childId}`);
      }
      
      return {
        ...balanceSnap.data(),
        updatedAt: balanceSnap.data().updatedAt?.toDate()
      };
    } catch (error) {
      console.error("Error getting Palsson Bucks balance:", error);
      throw error;
    }
  }

  /**
   * Get balance for a child (convenience method)
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @returns {Promise<number>} - Current balance
   */
  async getChildBalance(familyId, childId) {
    try {
      const balanceRef = doc(this.db, 'bucksBalances', childId);
      const balanceSnap = await getDoc(balanceRef);
      
      if (!balanceSnap.exists()) {
        // Initialize balance if it doesn't exist
        await this.initializeBalance(familyId, childId, 0);
        return 0;
      }
      
      return balanceSnap.data().currentBalance || 0;
    } catch (error) {
      console.error("Error getting child balance:", error);
      return 0; // Return 0 on error
    }
  }

  /**
   * Create a transaction and update balance
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<string>} - Transaction ID
   */
  async createTransaction(familyId, childId, transactionData) {
    try {
      // Get current user ID for createdBy field
      let createdBy = transactionData.createdBy || 'system';
      
      // Make sure we have a valid amount
      const amount = Number(transactionData.amount);
      if (isNaN(amount)) {
        throw new Error("Transaction amount must be a number");
      }
      
      // Run as a transaction to ensure balance consistency
      return await runTransaction(this.db, async (transaction) => {
        // Get current balance
        const balanceRef = doc(this.db, 'bucksBalances', childId);
        const balanceSnap = await transaction.get(balanceRef);
        
        if (!balanceSnap.exists()) {
          // Initialize balance if it doesn't exist
          await this.initializeBalance(familyId, childId);
          // Get the newly created balance
          const newBalanceSnap = await getDoc(balanceRef);
          if (!newBalanceSnap.exists()) {
            throw new Error("Failed to initialize balance");
          }
        }
        
        // Get current balance data
        const balanceData = balanceSnap.exists() ? balanceSnap.data() : { currentBalance: 0, lifetimeEarned: 0, lifetimeSpent: 0 };
        const currentBalance = balanceData.currentBalance || 0;
        const lifetimeEarned = balanceData.lifetimeEarned || 0;
        const lifetimeSpent = balanceData.lifetimeSpent || 0;
        
        // Calculate new balance
        const newBalance = currentBalance + amount;
        
        // Update lifetime stats
        let newLifetimeEarned = lifetimeEarned;
        let newLifetimeSpent = lifetimeSpent;
        
        if (amount > 0) {
          newLifetimeEarned += amount;
        } else if (amount < 0) {
          newLifetimeSpent += Math.abs(amount);
        }
        
        // Create transaction document
        const transactionRef = collection(this.db, 'bucksTransactions');
        const newTransactionRef = doc(transactionRef);
        
        const transactionDoc = {
          id: newTransactionRef.id,
          familyId,
          childId,
          type: transactionData.type || 'adjusted',
          amount,
          balance: newBalance,
          source: transactionData.source || {
            type: 'admin',
            id: null
          },
          description: transactionData.description || '',
          createdAt: serverTimestamp(),
          createdBy,
          metadata: transactionData.metadata || {}
        };
        
        // Update balance document
        transaction.update(balanceRef, {
          currentBalance: newBalance,
          lifetimeEarned: newLifetimeEarned,
          lifetimeSpent: newLifetimeSpent,
          lastTransactionId: newTransactionRef.id,
          lastTransactionAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Create transaction document
        transaction.set(newTransactionRef, transactionDoc);
        
        return newTransactionRef.id;
      });
    } catch (error) {
      console.error("Error creating Palsson Bucks transaction:", error);
      throw error;
    }
  }

  /**
   * Reward Palsson Bucks for a completed chore
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {string} choreInstanceId - Chore instance ID
   * @param {number} amount - Amount to reward
   * @param {string} parentId - Parent ID who is rewarding
   * @returns {Promise<string>} - Transaction ID
   */
  async rewardChore(familyId, childId, choreInstanceId, amount, parentId) {
    try {
      return await this.createTransaction(familyId, childId, {
        type: 'earned',
        amount,
        description: 'Completed chore',
        source: {
          type: 'chore',
          id: choreInstanceId
        },
        createdBy: parentId
      });
    } catch (error) {
      console.error("Error rewarding Palsson Bucks for chore:", error);
      throw error;
    }
  }

  /**
   * Add a tip to a completed chore
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {string} choreInstanceId - Chore instance ID
   * @param {number} amount - Tip amount
   * @param {string} parentId - Parent ID who is tipping
   * @returns {Promise<string>} - Transaction ID
   */
  async tipChore(familyId, childId, choreInstanceId, amount, parentId) {
    try {
      return await this.createTransaction(familyId, childId, {
        type: 'bonus',
        amount,
        description: 'Bonus for great work on chore',
        source: {
          type: 'chore',
          id: choreInstanceId
        },
        createdBy: parentId,
        metadata: {
          isTip: true
        }
      });
    } catch (error) {
      console.error("Error adding tip for chore:", error);
      throw error;
    }
  }

  /**
   * Spend Palsson Bucks on a reward
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {string} rewardInstanceId - Reward instance ID
   * @param {number} amount - Amount to spend (should be negative)
   * @returns {Promise<string>} - Transaction ID
   */
  async spendOnReward(familyId, childId, rewardInstanceId, amount) {
    try {
      // Ensure amount is negative
      const spendAmount = Math.abs(amount) * -1;
      
      return await this.createTransaction(familyId, childId, {
        type: 'spent',
        amount: spendAmount,
        description: 'Purchased reward',
        source: {
          type: 'reward',
          id: rewardInstanceId
        },
        createdBy: childId
      });
    } catch (error) {
      console.error("Error spending Palsson Bucks on reward:", error);
      throw error;
    }
  }

  /**
   * Refund Palsson Bucks for a rejected reward
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {string} rewardInstanceId - Reward instance ID
   * @param {number} amount - Amount to refund (should be positive)
   * @param {string} parentId - Parent ID who is refunding
   * @returns {Promise<string>} - Transaction ID
   */
  async refundReward(familyId, childId, rewardInstanceId, amount, parentId) {
    try {
      // Ensure amount is positive
      const refundAmount = Math.abs(amount);
      
      return await this.createTransaction(familyId, childId, {
        type: 'adjusted',
        amount: refundAmount,
        description: 'Refund for rejected reward',
        source: {
          type: 'reward',
          id: rewardInstanceId
        },
        createdBy: parentId,
        metadata: {
          isRefund: true
        }
      });
    } catch (error) {
      console.error("Error refunding Palsson Bucks for reward:", error);
      throw error;
    }
  }

  /**
   * Manually adjust a child's balance
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {number} amount - Amount to adjust
   * @param {string} reason - Reason for adjustment
   * @param {string} parentId - Parent ID who is adjusting
   * @returns {Promise<string>} - Transaction ID
   */
  async adjustBalance(familyId, childId, amount, reason, parentId) {
    try {
      return await this.createTransaction(familyId, childId, {
        type: 'adjusted',
        amount,
        description: reason || 'Manual adjustment',
        source: {
          type: 'admin',
          id: null
        },
        createdBy: parentId,
        metadata: {
          isManualAdjustment: true
        }
      });
    } catch (error) {
      console.error("Error adjusting Palsson Bucks balance:", error);
      throw error;
    }
  }

  /**
   * Get transaction history for a child
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {number} limit - Maximum number of transactions to return
   * @returns {Promise<Array>} - Array of transactions
   */
  async getTransactionHistory(familyId, childId, transactionLimit = 50) {
    try {
      const q = query(
        collection(this.db, 'bucksTransactions'),
        where('familyId', '==', familyId),
        where('childId', '==', childId),
        orderBy('createdAt', 'desc'),
        limit(transactionLimit)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
    } catch (error) {
      console.error("Error getting Palsson Bucks transaction history:", error);
      throw error;
    }
  }

  /**
   * Get transactions related to a specific source
   * @param {string} sourceType - Source type ('chore' or 'reward')
   * @param {string} sourceId - Source ID
   * @returns {Promise<Array>} - Array of transactions
   */
  async getTransactionsBySource(sourceType, sourceId) {
    try {
      const q = query(
        collection(this.db, 'bucksTransactions'),
        where('source.type', '==', sourceType),
        where('source.id', '==', sourceId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
    } catch (error) {
      console.error("Error getting transactions by source:", error);
      throw error;
    }
  }

  /**
   * Get balances for all children in a family
   * @param {string} familyId - Family ID
   * @returns {Promise<Array>} - Array of child balances
   */
  async getFamilyBalances(familyId) {
    try {
      const q = query(
        collection(this.db, 'bucksBalances'),
        where('familyId', '==', familyId)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        childId: doc.id,
        ...doc.data(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastTransactionAt: doc.data().lastTransactionAt?.toDate()
      }));
    } catch (error) {
      console.error("Error getting family balances:", error);
      throw error;
    }
  }

  /**
   * Get balance stats for a child
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {number} days - Number of days to look back
   * @returns {Promise<Object>} - Balance statistics
   */
  async getBalanceStats(familyId, childId, days = 30) {
    try {
      // Get current balance
      const balance = await this.getBalance(childId);
      
      // Get transactions for the specified time period
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const q = query(
        collection(this.db, 'bucksTransactions'),
        where('familyId', '==', familyId),
        where('childId', '==', childId),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      // Calculate stats
      const stats = {
        currentBalance: balance.currentBalance,
        lifetimeEarned: balance.lifetimeEarned,
        lifetimeSpent: balance.lifetimeSpent,
        periodEarned: 0,
        periodSpent: 0,
        transactionCount: transactions.length,
        earnedBySource: {
          chore: 0,
          bonus: 0,
          admin: 0
        },
        spentBySource: {
          reward: 0,
          other: 0
        },
        dailyTransactions: {}
      };
      
      // Process transactions
      for (const transaction of transactions) {
        const amount = transaction.amount;
        const sourceType = transaction.source?.type || 'other';
        
        // Track earned/spent in period
        if (amount > 0) {
          stats.periodEarned += amount;
          
          // Track earned by source
          if (sourceType === 'chore') {
            stats.earnedBySource.chore += amount;
          } else if (transaction.type === 'bonus') {
            stats.earnedBySource.bonus += amount;
          } else {
            stats.earnedBySource.admin += amount;
          }
        } else if (amount < 0) {
          stats.periodSpent += Math.abs(amount);
          
          // Track spent by source
          if (sourceType === 'reward') {
            stats.spentBySource.reward += Math.abs(amount);
          } else {
            stats.spentBySource.other += Math.abs(amount);
          }
        }
        
        // Track daily transactions
        const dateString = transaction.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
        
        if (!stats.dailyTransactions[dateString]) {
          stats.dailyTransactions[dateString] = {
            earned: 0,
            spent: 0,
            net: 0,
            count: 0
          };
        }
        
        stats.dailyTransactions[dateString].count++;
        
        if (amount > 0) {
          stats.dailyTransactions[dateString].earned += amount;
        } else if (amount < 0) {
          stats.dailyTransactions[dateString].spent += Math.abs(amount);
        }
        
        stats.dailyTransactions[dateString].net += amount;
      }
      
      return stats;
    } catch (error) {
      console.error("Error getting balance stats:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive Bucks statistics for the entire family
   * @param {string} familyId - Family ID
   * @returns {Promise<Object>} - Family-wide statistics
   */
  async getBucksStatistics(familyId) {
    try {
      // Get all family balances
      const balances = await this.getFamilyBalances(familyId);
      
      // Get transaction history for the past 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const q = query(
        collection(this.db, 'bucksTransactions'),
        where('familyId', '==', familyId),
        where('createdAt', '>=', Timestamp.fromDate(ninetyDaysAgo)),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));
      
      // Calculate family-wide statistics
      const stats = {
        totalBalance: 0,
        totalLifetimeEarned: 0,
        totalLifetimeSpent: 0,
        childBalances: {},
        last90Days: {
          totalEarned: 0,
          totalSpent: 0,
          choreRewards: 0,
          rewardPurchases: 0,
          bonuses: 0,
          adjustments: 0
        },
        monthlyTrends: {},
        topEarners: [],
        topSavers: [],
        recentActivity: transactions.slice(0, 10) // Last 10 transactions
      };
      
      // Process balances
      for (const balance of balances) {
        stats.totalBalance += balance.currentBalance;
        stats.totalLifetimeEarned += balance.lifetimeEarned;
        stats.totalLifetimeSpent += balance.lifetimeSpent;
        
        stats.childBalances[balance.childId] = {
          currentBalance: balance.currentBalance,
          lifetimeEarned: balance.lifetimeEarned,
          lifetimeSpent: balance.lifetimeSpent
        };
      }
      
      // Process transactions for trends
      for (const transaction of transactions) {
        const amount = transaction.amount;
        const sourceType = transaction.source?.type || 'other';
        const monthKey = transaction.createdAt.toISOString().substring(0, 7); // YYYY-MM
        
        // Initialize month if needed
        if (!stats.monthlyTrends[monthKey]) {
          stats.monthlyTrends[monthKey] = {
            earned: 0,
            spent: 0,
            net: 0,
            transactionCount: 0
          };
        }
        
        stats.monthlyTrends[monthKey].transactionCount++;
        
        if (amount > 0) {
          stats.last90Days.totalEarned += amount;
          stats.monthlyTrends[monthKey].earned += amount;
          
          if (sourceType === 'chore') {
            stats.last90Days.choreRewards += amount;
          } else if (transaction.type === 'bonus') {
            stats.last90Days.bonuses += amount;
          } else if (transaction.type === 'admin') {
            stats.last90Days.adjustments += amount;
          }
        } else if (amount < 0) {
          stats.last90Days.totalSpent += Math.abs(amount);
          stats.monthlyTrends[monthKey].spent += Math.abs(amount);
          
          if (sourceType === 'reward') {
            stats.last90Days.rewardPurchases += Math.abs(amount);
          }
        }
        
        stats.monthlyTrends[monthKey].net = stats.monthlyTrends[monthKey].earned - stats.monthlyTrends[monthKey].spent;
      }
      
      // Calculate top earners and savers
      const childStats = [];
      for (const [childId, childBalance] of Object.entries(stats.childBalances)) {
        childStats.push({
          childId,
          ...childBalance,
          savingsRate: childBalance.lifetimeSpent > 0 
            ? ((childBalance.lifetimeEarned - childBalance.lifetimeSpent) / childBalance.lifetimeEarned * 100).toFixed(1) 
            : 100
        });
      }
      
      // Sort for top earners (by lifetime earned)
      stats.topEarners = childStats
        .sort((a, b) => b.lifetimeEarned - a.lifetimeEarned)
        .slice(0, 3);
      
      // Sort for top savers (by savings rate)
      stats.topSavers = childStats
        .sort((a, b) => b.savingsRate - a.savingsRate)
        .slice(0, 3);
      
      return stats;
    } catch (error) {
      console.error("Error getting Bucks statistics:", error);
      throw error;
    }
  }

  /**
   * Update Bucks settings for a family
   * @param {string} familyId - Family ID
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} - Updated settings
   */
  async updateBucksSettings(familyId, settings) {
    try {
      const settingsRef = doc(this.db, 'bucksSettings', familyId);
      
      // Get existing settings or create new ones
      const settingsSnap = await getDoc(settingsRef);
      const currentSettings = settingsSnap.exists() ? settingsSnap.data() : {
        familyId,
        autoApprovalThreshold: 0,
        notificationsEnabled: true,
        requireApprovalForAll: false,
        childAutoRedeemEnabled: true,
        createdAt: serverTimestamp()
      };
      
      // Merge with new settings
      const updatedSettings = {
        ...currentSettings,
        ...settings,
        updatedAt: serverTimestamp()
      };
      
      // Save settings
      await setDoc(settingsRef, updatedSettings);
      
      return {
        ...updatedSettings,
        createdAt: updatedSettings.createdAt?.toDate(),
        updatedAt: updatedSettings.updatedAt?.toDate()
      };
    } catch (error) {
      console.error("Error updating Bucks settings:", error);
      throw error;
    }
  }

  /**
   * Get Bucks settings for a family
   * @param {string} familyId - Family ID
   * @returns {Promise<Object>} - Settings
   */
  async getBucksSettings(familyId) {
    try {
      const settingsRef = doc(this.db, 'bucksSettings', familyId);
      const settingsSnap = await getDoc(settingsRef);
      
      if (!settingsSnap.exists()) {
        // Return default settings
        return {
          familyId,
          autoApprovalThreshold: 0,
          notificationsEnabled: true,
          requireApprovalForAll: false,
          childAutoRedeemEnabled: true
        };
      }
      
      return {
        ...settingsSnap.data(),
        createdAt: settingsSnap.data().createdAt?.toDate(),
        updatedAt: settingsSnap.data().updatedAt?.toDate()
      };
    } catch (error) {
      console.error("Error getting Bucks settings:", error);
      throw error;
    }
  }

  /**
   * Adjust bucks reward for a completed chore
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @param {string} choreId - Chore instance ID
   * @param {number} adjustment - Amount to adjust (positive or negative)
   * @param {string} parentId - Parent ID making the adjustment
   * @returns {Promise<void>}
   */
  async adjustChoreReward(familyId, childId, choreId, adjustment, parentId) {
    try {
      // Create a manual adjustment transaction
      const adjustmentData = {
        familyId,
        childId,
        amount: adjustment,
        type: adjustment > 0 ? 'earned' : 'spent',
        category: 'adjustment',
        description: `Chore reward ${adjustment > 0 ? 'bonus' : 'reduction'} by parent`,
        reference: {
          type: 'chore_adjustment',
          choreId,
          parentId
        },
        createdAt: serverTimestamp(),
        createdBy: parentId
      };
      
      await addDoc(collection(this.db, 'bucksTransactions'), adjustmentData);
      
      // Update the chore instance with the adjustment
      const choreRef = doc(this.db, 'choreInstances', choreId);
      await updateDoc(choreRef, {
        actualBucksAwarded: increment(adjustment),
        lastAdjustedBy: parentId,
        lastAdjustedAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error("Error adjusting chore reward:", error);
      throw error;
    }
  }
}

export default new BucksService();