// src/services/HabitBankService.js
import { 
  doc, collection, getDoc, setDoc, updateDoc, 
  query, where, getDocs, serverTimestamp, 
  arrayUnion, increment, writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import CalendarService from './CalendarService';
import AllieAIService from './AllieAIService';
import ClaudeService from './ClaudeService';
import HabitCyclesService from './HabitCyclesService';

class HabitBankService {
  constructor() {
    this.accountTypes = {
      'energy': {
        name: 'Energy Account',
        emoji: '⚡',
        color: '#FCD34D',
        description: 'Physical and mental vitality',
        baseInterestRate: 0.05 // 5% daily
      },
      'connection': {
        name: 'Connection Account',
        emoji: '❤️',
        color: '#F87171',
        description: 'Family bonds and relationships',
        baseInterestRate: 0.07 // 7% daily
      },
      'order': {
        name: 'Order Account',
        emoji: '🏠',
        color: '#60A5FA',
        description: 'Home organization and systems',
        baseInterestRate: 0.04 // 4% daily
      },
      'growth': {
        name: 'Growth Account',
        emoji: '🌱',
        color: '#34D399',
        description: 'Learning and development',
        baseInterestRate: 0.06 // 6% daily
      }
    };
    
    this.rewardTiers = [
      { minBalance: 100, name: 'Bronze', emoji: '🥉', multiplier: 1.0 },
      { minBalance: 500, name: 'Silver', emoji: '🥈', multiplier: 1.2 },
      { minBalance: 1000, name: 'Gold', emoji: '🥇', multiplier: 1.5 },
      { minBalance: 2500, name: 'Platinum', emoji: '💎', multiplier: 2.0 },
      { minBalance: 5000, name: 'Diamond', emoji: '💎', multiplier: 3.0 }
    ];
  }

  // Initialize habit bank for a family
  async initializeHabitBank(familyId) {
    try {
      const bankRef = doc(db, 'families', familyId, 'habitBank', 'main');
      const existing = await getDoc(bankRef);
      
      if (existing.exists()) {
        // Sync with real habit data before returning
        return await this.syncWithRealHabitData(existing.data(), familyId);
      }
      
      // Get actual habit history to initialize with real data
      const habitsSnapshot = await getDocs(collection(db, 'families', familyId, 'habits'));
      const completionHistory = [];
      
      // Collect all habit completions
      for (const habitDoc of habitsSnapshot.docs) {
        const habit = habitDoc.data();
        if (habit.completionInstances && habit.completionInstances.length > 0) {
          habit.completionInstances.forEach(instance => {
            completionHistory.push({
              habitId: habitDoc.id,
              habitTitle: habit.title,
              category: habit.category || 'growth',
              timestamp: instance.timestamp,
              userId: instance.userId,
              userName: instance.userName,
              reflection: instance.reflection || ''
            });
          });
        }
      }
      
      // Calculate initial balances based on real completions
      const accountBalances = {
        energy: 0,
        connection: 0,
        order: 0,
        growth: 0
      };
      
      // Map completions to accounts and calculate wealth
      completionHistory.forEach(completion => {
        const accountType = this.mapHabitCategoryToAccount(completion.category);
        const quality = completion.reflection ? 5 : 3;
        const baseValue = 10 * (quality / 5);
        accountBalances[accountType] += baseValue;
      });
      
      // Apply some initial interest for existing completions
      Object.keys(accountBalances).forEach(type => {
        accountBalances[type] = Math.round(accountBalances[type] * 1.2);
      });
      
      const totalValue = Object.values(accountBalances).reduce((a, b) => a + b, 0);
      
      const now = new Date();
      const bankData = {
        familyId,
        accounts: Object.entries(this.accountTypes).map(([type, config]) => ({
          accountType: type,
          accountName: config.name,
          balance: accountBalances[type],
          interestRate: config.baseInterestRate,
          lastInterestCalculation: now, // Use Date object instead of serverTimestamp()
          deposits: [],
          withdrawals: [],
          tier: this.calculateTierForBalance(accountBalances[type])
        })),
        portfolio: {
          habits: await this.analyzeHabitPortfolio(habitsSnapshot.docs),
          diversificationScore: this.calculateDiversification(accountBalances),
          totalValue,
          projectedGrowth: {
            oneWeek: Math.round(totalValue * 0.35),
            oneMonth: Math.round(totalValue * 1.5),
            threeMonths: Math.round(totalValue * 5)
          }
        },
        statements: [],
        rewards: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(bankRef, bankData);
      
      // Create initial calendar event
      await this.createWelcomeEvent(familyId);
      
      return bankData;
    } catch (error) {
      console.error('Error initializing habit bank:', error);
      throw error;
    }
  }

  // Make a deposit when habit is completed
  async makeDeposit(habitId, userId, familyId, quality = 5) {
    try {
      // Get habit details
      const habit = await HabitCyclesService.getHabitById(habitId, familyId);
      if (!habit) throw new Error('Habit not found');
      
      // Determine account type based on habit category
      const accountType = this.determineAccountType(habit);
      
      // Calculate deposit amount
      const baseAmount = 10;
      const qualityMultiplier = quality / 5; // 0.2 to 1.0
      const streakBonus = Math.min(habit.streak || 0, 30) * 0.5; // Max 15 bonus
      const helperBonus = habit.helperChild ? 5 : 0;
      
      const depositAmount = Math.round((baseAmount * qualityMultiplier) + streakBonus + helperBonus);
      
      // Get current bank data
      const bankRef = doc(db, 'families', familyId, 'habitBank', 'main');
      const bankDoc = await getDoc(bankRef);
      
      if (!bankDoc.exists()) {
        await this.initializeHabitBank(familyId);
      }
      
      const bankData = bankDoc.data();
      const accountIndex = bankData.accounts.findIndex(a => a.accountType === accountType);
      
      if (accountIndex === -1) throw new Error('Account type not found');
      
      // Calculate compound interest since last calculation
      const account = bankData.accounts[accountIndex];
      const compoundedValue = await this.calculateCompoundInterest(account, depositAmount);
      
      // Create deposit record
      const deposit = {
        depositId: `dep_${Date.now()}`,
        habitId,
        userId,
        amount: depositAmount,
        compoundedValue,
        timestamp: new Date(),
        quality,
        streakAtTime: habit.streak || 0,
        hadHelper: !!habit.helperChild
      };
      
      // Update account
      account.deposits.push(deposit);
      account.balance += compoundedValue;
      account.lastInterestCalculation = new Date();
      
      // Check for tier upgrade
      const newTier = this.calculateTier(account.balance);
      if (newTier.minBalance > account.tier.minBalance) {
        account.tier = newTier;
        await this.celebrateTierUpgrade(familyId, userId, accountType, newTier);
      }
      
      // Update portfolio
      await this.updatePortfolio(bankData, habit, depositAmount);
      
      // Save changes
      bankData.accounts[accountIndex] = account;
      await updateDoc(bankRef, {
        accounts: bankData.accounts,
        portfolio: bankData.portfolio,
        updatedAt: serverTimestamp()
      });
      
      // Create visual feedback
      await this.createDepositAnimation(familyId, userId, accountType, compoundedValue);
      
      // Check for family rewards
      const unlockedRewards = await this.checkRewardUnlocks(bankData);
      
      return {
        deposit,
        newBalance: account.balance,
        accountType,
        tier: account.tier,
        unlockedRewards,
        projectedGrowth: await this.calculateProjectedGrowth(bankData)
      };
    } catch (error) {
      console.error('Error making deposit:', error);
      throw error;
    }
  }

  // Withdraw from account for rewards
  async makeWithdrawal(rewardId, familyId, approvedBy) {
    try {
      // Get reward details
      const reward = await this.getRewardDetails(rewardId);
      if (!reward) throw new Error('Reward not found');
      
      // Get bank data
      const bankRef = doc(db, 'families', familyId, 'habitBank', 'main');
      const bankDoc = await getDoc(bankRef);
      const bankData = bankDoc.data();
      
      // Check if sufficient balance in required account
      const account = bankData.accounts.find(a => a.accountType === reward.accountType);
      if (!account || account.balance < reward.cost) {
        throw new Error('Insufficient balance');
      }
      
      // Create withdrawal record
      const withdrawal = {
        withdrawalId: `wd_${Date.now()}`,
        rewardId,
        amount: reward.cost,
        timestamp: new Date(),
        approvedBy,
        rewardName: reward.name,
        rewardType: reward.type
      };
      
      // Update account
      account.withdrawals.push(withdrawal);
      account.balance -= reward.cost;
      
      // Save changes
      const accountIndex = bankData.accounts.findIndex(a => a.accountType === reward.accountType);
      bankData.accounts[accountIndex] = account;
      bankData.rewards.push({
        ...reward,
        redeemedAt: new Date(),
        redeemedBy: approvedBy
      });
      await updateDoc(bankRef, {
        accounts: bankData.accounts,
        rewards: bankData.rewards,
        updatedAt: serverTimestamp()
      });
      
      // Create calendar event for reward
      await this.createRewardEvent(reward, familyId);
      
      // Notify family
      await this.notifyRewardRedemption(reward, familyId, approvedBy);
      
      return {
        withdrawal,
        newBalance: account.balance,
        reward
      };
    } catch (error) {
      console.error('Error making withdrawal:', error);
      throw error;
    }
  }

  // Generate weekly wealth statement
  async generateWeeklyStatement(familyId) {
    try {
      const bankRef = doc(db, 'families', familyId, 'habitBank', 'main');
      const bankDoc = await getDoc(bankRef);
      const bankData = bankDoc.data();
      
      // Calculate week boundaries
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 7);
      
      // Analyze transactions
      let totalDeposits = 0;
      let totalInterest = 0;
      let totalWithdrawals = 0;
      const accountSummaries = [];
      
      for (const account of bankData.accounts) {
        const weekDeposits = account.deposits.filter(
          d => new Date(d.timestamp) >= startDate
        );
        const weekWithdrawals = account.withdrawals.filter(
          w => new Date(w.timestamp) >= startDate
        );
        
        const accountDeposits = weekDeposits.reduce((sum, d) => sum + d.amount, 0);
        const accountInterest = weekDeposits.reduce((sum, d) => sum + (d.compoundedValue - d.amount), 0);
        const accountWithdrawals = weekWithdrawals.reduce((sum, w) => sum + w.amount, 0);
        
        totalDeposits += accountDeposits;
        totalInterest += accountInterest;
        totalWithdrawals += accountWithdrawals;
        
        accountSummaries.push({
          accountType: account.accountType,
          deposits: accountDeposits,
          interest: accountInterest,
          withdrawals: accountWithdrawals,
          netChange: accountDeposits + accountInterest - accountWithdrawals,
          endingBalance: account.balance
        });
      }
      
      // Generate AI insights
      const insights = await this.generateStatementInsights(
        bankData,
        accountSummaries,
        startDate,
        endDate
      );
      
      // Create statement
      const statement = {
        statementId: `stmt_${Date.now()}`,
        weekNumber: this.getWeekNumber(endDate),
        startDate,
        endDate,
        summary: {
          deposits: totalDeposits,
          interest: totalInterest,
          withdrawals: totalWithdrawals,
          netGrowth: totalDeposits + totalInterest - totalWithdrawals
        },
        accountDetails: accountSummaries,
        insights,
        totalValue: bankData.accounts.reduce((sum, a) => sum + a.balance, 0),
        diversificationScore: await this.calculateDiversificationScore(bankData),
        generatedAt: new Date()
      };
      
      // Save statement
      bankData.statements.push(statement);
      await updateDoc(bankRef, {
        statements: bankData.statements,
        updatedAt: serverTimestamp()
      });
      
      // Create calendar event with statement
      await this.createStatementEvent(statement, familyId);
      
      return statement;
    } catch (error) {
      console.error('Error generating weekly statement:', error);
      throw error;
    }
  }

  // Get investment portfolio analysis
  async getPortfolioAnalysis(familyId) {
    try {
      const bankRef = doc(db, 'families', familyId, 'habitBank', 'main');
      const bankDoc = await getDoc(bankRef);
      const bankData = bankDoc.data();
      
      // Analyze each habit investment
      const habitAnalysis = [];
      
      for (const habitInvestment of bankData.portfolio.habits) {
        const habit = await HabitCyclesService.getHabitById(habitInvestment.habitId, familyId);
        
        const analysis = {
          habitId: habitInvestment.habitId,
          habitName: habit?.title || 'Unknown Habit',
          investmentType: habitInvestment.investmentType,
          currentROI: await this.calculateROI(habitInvestment, habit),
          risk: habitInvestment.risk,
          performance: await this.analyzePerformance(habitInvestment, habit),
          maturityProgress: await this.calculateMaturityProgress(habitInvestment, habit),
          recommendations: await this.generateRecommendations(habitInvestment, habit)
        };
        
        habitAnalysis.push(analysis);
      }
      
      // Calculate overall portfolio metrics
      const portfolioMetrics = {
        totalValue: bankData.accounts.reduce((sum, a) => sum + a.balance, 0),
        diversificationScore: await this.calculateDiversificationScore(bankData),
        riskProfile: this.calculateRiskProfile(habitAnalysis),
        projectedGrowth: await this.calculateProjectedGrowth(bankData),
        topPerformers: habitAnalysis
          .sort((a, b) => b.currentROI - a.currentROI)
          .slice(0, 3),
        needsAttention: habitAnalysis
          .filter(h => h.performance.trend === 'declining')
      };
      
      // Generate AI-powered advice
      const advice = await this.generatePortfolioAdvice(portfolioMetrics, habitAnalysis);
      
      return {
        habits: habitAnalysis,
        metrics: portfolioMetrics,
        advice,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting portfolio analysis:', error);
      throw error;
    }
  }

  // Helper methods
  determineAccountType(habit) {
    const title = habit.title.toLowerCase();
    const category = habit.category?.toLowerCase() || '';
    
    if (title.includes('exercise') || title.includes('walk') || title.includes('energy')) {
      return 'energy';
    } else if (title.includes('family') || title.includes('together') || category.includes('relationship')) {
      return 'connection';
    } else if (title.includes('clean') || title.includes('organize') || title.includes('tidy')) {
      return 'order';
    } else if (title.includes('learn') || title.includes('read') || title.includes('practice')) {
      return 'growth';
    }
    
    // Default based on category
    if (category.includes('household')) return 'order';
    if (category.includes('parenting')) return 'connection';
    
    return 'growth'; // default
  }

  async calculateCompoundInterest(account, newDeposit) {
    const now = new Date();
    const lastCalc = account.lastInterestCalculation?.toDate() || new Date();
    const daysSinceLastCalc = Math.max(0, (now - lastCalc) / (1000 * 60 * 60 * 24));
    
    // Calculate interest on existing balance
    const existingInterest = account.balance * Math.pow(1 + account.interestRate, daysSinceLastCalc) - account.balance;
    
    // New deposit gets immediate value boost based on account tier
    const tierBoost = account.tier?.multiplier || 1.0;
    const boostedDeposit = newDeposit * tierBoost;
    
    return boostedDeposit + existingInterest;
  }

  calculateTier(balance) {
    // Find the highest tier the balance qualifies for
    for (let i = this.rewardTiers.length - 1; i >= 0; i--) {
      if (balance >= this.rewardTiers[i].minBalance) {
        return this.rewardTiers[i];
      }
    }
    return this.rewardTiers[0];
  }

  async updatePortfolio(bankData, habit, depositAmount) {
    const existingIndex = bankData.portfolio.habits.findIndex(
      h => h.habitId === habit.id
    );
    
    if (existingIndex === -1) {
      // New habit investment
      bankData.portfolio.habits.push({
        habitId: habit.id,
        investmentType: this.determineInvestmentType(habit),
        roi: 0,
        risk: this.calculateRisk(habit),
        startDate: new Date(),
        maturityDate: this.calculateMaturityDate(habit),
        totalInvested: depositAmount
      });
    } else {
      // Update existing investment
      bankData.portfolio.habits[existingIndex].totalInvested += depositAmount;
      bankData.portfolio.habits[existingIndex].roi = 
        await this.calculateROI(bankData.portfolio.habits[existingIndex], habit);
    }
    
    // Update portfolio totals
    bankData.portfolio.totalValue = bankData.accounts.reduce((sum, a) => sum + a.balance, 0);
    bankData.portfolio.diversificationScore = await this.calculateDiversificationScore(bankData);
  }

  determineInvestmentType(habit) {
    if (habit.frequency === 'daily') return 'daily';
    if (habit.frequency === 'weekly') return 'weekly';
    return 'milestone';
  }

  calculateRisk(habit) {
    // Risk based on habit difficulty and consistency requirements
    if (habit.difficulty === 'hard' || habit.estimatedMinutes > 30) return 'high';
    if (habit.difficulty === 'medium' || habit.estimatedMinutes > 15) return 'medium';
    return 'low';
  }

  calculateMaturityDate(habit) {
    // Habits "mature" (become automatic) after consistent practice
    const maturityDays = {
      'daily': 66, // Based on research
      'weekly': 90,
      'milestone': 120
    };
    
    const days = maturityDays[this.determineInvestmentType(habit)] || 66;
    const maturityDate = new Date();
    maturityDate.setDate(maturityDate.getDate() + days);
    return maturityDate;
  }

  async calculateROI(investment, habit) {
    if (!habit) return 0;
    
    const consistencyScore = (habit.streak || 0) / 21; // 21-day baseline
    const completionRate = habit.completionRate || 0.5;
    const timeValue = investment.totalInvested / 100; // Normalize
    
    return Math.round((consistencyScore * completionRate * timeValue) * 100);
  }

  async analyzePerformance(investment, habit) {
    const recentCompletions = habit.completionInstances?.slice(-7) || [];
    const trend = recentCompletions.length >= 5 ? 'improving' : 
                  recentCompletions.length >= 3 ? 'stable' : 'declining';
    
    return {
      trend,
      consistency: recentCompletions.length / 7,
      quality: recentCompletions.reduce((sum, c) => sum + (c.quality || 3), 0) / Math.max(recentCompletions.length, 1)
    };
  }

  async calculateMaturityProgress(investment, habit) {
    const startDate = investment.startDate?.toDate() || new Date();
    const maturityDate = investment.maturityDate?.toDate() || new Date();
    const now = new Date();
    
    const totalDays = (maturityDate - startDate) / (1000 * 60 * 60 * 24);
    const daysPassed = (now - startDate) / (1000 * 60 * 60 * 24);
    
    return Math.min(100, Math.round((daysPassed / totalDays) * 100));
  }

  async generateRecommendations(investment, habit) {
    const performance = await this.analyzePerformance(investment, habit);
    const recommendations = [];
    
    if (performance.trend === 'declining') {
      recommendations.push('Consider reducing session duration or difficulty');
      recommendations.push('Try pairing with a different family member for support');
    }
    
    if (performance.consistency < 0.5) {
      recommendations.push('Set more consistent practice times');
      recommendations.push('Use calendar blocking for habit time');
    }
    
    if (investment.risk === 'high' && performance.quality < 3) {
      recommendations.push('Break down into smaller, easier steps');
      recommendations.push('Consider a stepping-stone habit first');
    }
    
    return recommendations;
  }

  async calculateDiversificationScore(bankData) {
    const accountBalances = bankData.accounts.map(a => a.balance);
    const totalBalance = accountBalances.reduce((sum, b) => sum + b, 0);
    
    if (totalBalance === 0) return 0;
    
    // Calculate how evenly distributed the wealth is
    const idealBalance = totalBalance / bankData.accounts.length;
    const deviations = accountBalances.map(b => Math.abs(b - idealBalance));
    const totalDeviation = deviations.reduce((sum, d) => sum + d, 0);
    
    // Score from 0-100, where 100 is perfectly balanced
    return Math.round(100 - (totalDeviation / totalBalance * 100));
  }

  calculateRiskProfile(habitAnalysis) {
    const riskCounts = { low: 0, medium: 0, high: 0 };
    habitAnalysis.forEach(h => riskCounts[h.risk]++);
    
    const total = habitAnalysis.length || 1;
    return {
      low: Math.round(riskCounts.low / total * 100),
      medium: Math.round(riskCounts.medium / total * 100),
      high: Math.round(riskCounts.high / total * 100)
    };
  }

  async calculateProjectedGrowth(bankData) {
    const currentTotal = bankData.accounts.reduce((sum, a) => sum + a.balance, 0);
    const avgDailyGrowth = await this.calculateAverageDailyGrowth(bankData);
    
    return {
      oneWeek: Math.round(currentTotal * Math.pow(1 + avgDailyGrowth, 7)),
      oneMonth: Math.round(currentTotal * Math.pow(1 + avgDailyGrowth, 30)),
      threeMonths: Math.round(currentTotal * Math.pow(1 + avgDailyGrowth, 90))
    };
  }

  async calculateAverageDailyGrowth(bankData) {
    // Look at last 30 days of deposits
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    let totalGrowth = 0;
    let days = 0;
    
    for (const account of bankData.accounts) {
      const recentDeposits = account.deposits.filter(
        d => new Date(d.timestamp) > thirtyDaysAgo
      );
      
      if (recentDeposits.length > 0) {
        const dailyAvg = recentDeposits.reduce((sum, d) => sum + d.amount, 0) / 30;
        const growthRate = account.balance > 0 ? dailyAvg / account.balance : 0;
        totalGrowth += growthRate;
        days++;
      }
    }
    
    return days > 0 ? totalGrowth / days : 0.02; // Default 2% daily growth
  }

  async generateStatementInsights(bankData, accountSummaries, startDate, endDate) {
    const prompt = `
      Generate 3-4 brief, actionable insights for a family's habit wealth statement.
      
      Week summary:
      - Total deposits: ${accountSummaries.reduce((sum, a) => sum + a.deposits, 0)}
      - Total interest earned: ${accountSummaries.reduce((sum, a) => sum + a.interest, 0)}
      - Account balances: ${accountSummaries.map(a => `${a.accountType}: ${a.endingBalance}`).join(', ')}
      - Diversification score: ${await this.calculateDiversificationScore(bankData)}%
      
      Focus on:
      1. Celebrating progress
      2. Identifying imbalances
      3. Suggesting next actions
      4. Motivating continued growth
      
      Keep each insight to 1-2 sentences. Be specific and encouraging.
    `;
    
    try {
      const response = await ClaudeService.sendMessage(prompt, 'bank_insights');
      return this.parseInsights(response);
    } catch (error) {
      // Fallback insights
      return [
        'Great progress this week! Your consistency is building compound growth.',
        'Consider adding a Connection habit to balance your portfolio.',
        'You\'re just 200 points away from Silver tier - keep going!'
      ];
    }
  }

  parseInsights(response) {
    const lines = response.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    return lines.slice(0, 4); // Max 4 insights
  }

  async generatePortfolioAdvice(metrics, habitAnalysis) {
    const prompt = `
      Provide brief investment advice for a family habit portfolio.
      
      Portfolio metrics:
      - Total value: ${metrics.totalValue}
      - Diversification: ${metrics.diversificationScore}%
      - Risk profile: ${JSON.stringify(metrics.riskProfile)}
      - Top performer: ${metrics.topPerformers[0]?.habitName || 'None'}
      - Needs attention: ${metrics.needsAttention.length} habits
      
      Provide 2-3 specific recommendations in the style of a financial advisor.
      Keep it encouraging and actionable.
    `;
    
    try {
      const response = await ClaudeService.sendMessage(prompt, 'portfolio_advice');
      return this.parseAdvice(response);
    } catch (error) {
      return {
        summary: 'Your habit portfolio shows steady growth potential.',
        recommendations: [
          'Maintain your top-performing habits for reliable returns',
          'Consider rebalancing declining habits with easier alternatives',
          'Your diversification score suggests adding variety to your routine'
        ]
      };
    }
  }

  parseAdvice(response) {
    const lines = response.split('\n').filter(line => line.trim());
    return {
      summary: lines[0] || 'Your portfolio is on track.',
      recommendations: lines.slice(1, 4)
    };
  }

  async checkRewardUnlocks(bankData) {
    const totalBalance = bankData.accounts.reduce((sum, a) => sum + a.balance, 0);
    const unlockedRewards = [];
    
    // Define reward thresholds
    const rewards = [
      { threshold: 250, id: 'family_movie_night', name: 'Family Movie Night' },
      { threshold: 500, id: 'special_outing', name: 'Special Outing' },
      { threshold: 1000, id: 'weekend_adventure', name: 'Weekend Adventure' },
      { threshold: 2000, id: 'family_vacation_fund', name: 'Family Vacation Fund Contribution' }
    ];
    
    for (const reward of rewards) {
      const alreadyUnlocked = bankData.rewards.some(r => r.id === reward.id);
      if (!alreadyUnlocked && totalBalance >= reward.threshold) {
        unlockedRewards.push(reward);
      }
    }
    
    return unlockedRewards;
  }

  async getRewardDetails(rewardId) {
    // In production, this would fetch from a rewards catalog
    const catalog = {
      'family_movie_night': {
        id: 'family_movie_night',
        name: 'Family Movie Night',
        cost: 100,
        accountType: 'connection',
        type: 'experience',
        description: 'Pizza, popcorn, and a movie of everyone\'s choice!'
      },
      'special_outing': {
        id: 'special_outing',
        name: 'Special Outing',
        cost: 200,
        accountType: 'energy',
        type: 'experience',
        description: 'Choose a fun family activity: mini golf, bowling, or ice cream!'
      },
      'weekend_adventure': {
        id: 'weekend_adventure',
        name: 'Weekend Adventure',
        cost: 500,
        accountType: 'growth',
        type: 'experience',
        description: 'Plan a full day adventure: hiking, beach trip, or city exploration!'
      }
    };
    
    return catalog[rewardId] || null;
  }

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  // Calendar and notification methods
  async createWelcomeEvent(familyId) {
    await CalendarService.addEvent({
      title: '🎯 Welcome to Habit Bank!',
      summary: 'Your family wealth-building journey begins!',
      eventType: 'habit-bank-welcome',
      start: { dateTime: new Date() },
      duration: 5,
      metadata: {
        bankEvent: true,
        type: 'welcome'
      }
    }, null, familyId);
  }

  async celebrateTierUpgrade(familyId, userId, accountType, newTier) {
    const account = this.accountTypes[accountType];
    
    await CalendarService.addEvent({
      title: `${newTier.emoji} ${account.name} upgraded to ${newTier.name} tier!`,
      eventType: 'habit-bank-achievement',
      start: { dateTime: new Date() },
      duration: 5,
      metadata: {
        accountType,
        tier: newTier.name,
        celebration: true
      }
    }, userId, familyId);
    
    await AllieAIService.sendProactiveMessage(familyId, {
      type: 'tier_upgrade',
      content: `${newTier.emoji} Amazing! Your ${account.name} just reached ${newTier.name} tier! You now earn ${newTier.multiplier}x rewards on all ${accountType} deposits!`,
      priority: 'high'
    });
  }

  async createDepositAnimation(familyId, userId, accountType, amount) {
    // This would trigger a real-time animation in the UI
    // For now, we'll create a notification
    const account = this.accountTypes[accountType];
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('habit-bank-deposit', {
        detail: {
          accountType,
          amount,
          emoji: account.emoji,
          color: account.color
        }
      }));
    }
  }

  async createRewardEvent(reward, familyId) {
    await CalendarService.addEvent({
      title: `🎁 ${reward.name} Redeemed!`,
      summary: reward.description,
      eventType: 'habit-bank-reward',
      start: { dateTime: new Date() },
      duration: 60,
      metadata: {
        rewardId: reward.id,
        rewardType: reward.type
      }
    }, null, familyId);
  }

  async notifyRewardRedemption(reward, familyId, redeemedBy) {
    await AllieAIService.sendProactiveMessage(familyId, {
      type: 'reward_redeemed',
      content: `🎁 Exciting news! Your family just redeemed "${reward.name}" from the Habit Bank! Time to plan your ${reward.type}!`,
      metadata: {
        rewardId: reward.id,
        redeemedBy
      }
    });
  }

  async createStatementEvent(statement, familyId) {
    await CalendarService.addEvent({
      title: `📊 Weekly Habit Wealth Statement`,
      summary: `Net growth: +${statement.summary.netGrowth} | Total value: ${statement.totalValue}`,
      eventType: 'habit-bank-statement',
      start: { dateTime: new Date() },
      duration: 5,
      attachments: [{
        type: 'statement',
        data: statement
      }],
      metadata: {
        statementId: statement.statementId,
        weekNumber: statement.weekNumber
      }
    }, null, familyId);
  }
  
  // Helper method to map habit categories to account types
  mapHabitCategoryToAccount(category) {
    const categoryMap = {
      'visible parenting': 'connection',
      'invisible parenting': 'growth',
      'cognitive labor': 'energy',
      'household management': 'order',
      'morning': 'energy',
      'evening': 'order',
      'planning': 'growth',
      'family': 'connection'
    };
    
    return categoryMap[category?.toLowerCase()] || 'growth';
  }
  
  // Calculate tier based on balance
  calculateTierForBalance(balance) {
    for (let i = this.rewardTiers.length - 1; i >= 0; i--) {
      if (balance >= this.rewardTiers[i].minBalance) {
        return this.rewardTiers[i];
      }
    }
    return this.rewardTiers[0];
  }
  
  // Analyze habit portfolio
  async analyzeHabitPortfolio(habitDocs) {
    const portfolio = [];
    
    for (const doc of habitDocs) {
      const habit = doc.data();
      const completions = habit.completionInstances?.length || 0;
      const accountType = this.mapHabitCategoryToAccount(habit.category);
      
      portfolio.push({
        habitId: doc.id,
        habitName: habit.title,
        accountType,
        investmentType: this.accountTypes[accountType].name,
        totalCompletions: completions,
        currentROI: Math.min(completions * 10, 100), // Cap at 100%
        risk: completions > 10 ? 'low' : completions > 5 ? 'medium' : 'high',
        maturityProgress: Math.min((completions / 21) * 100, 100),
        performance: {
          trend: completions > 5 ? 'improving' : 'developing',
          lastCompletion: habit.completionInstances?.[completions - 1]?.timestamp || null
        },
        recommendations: this.generateHabitRecommendations(habit, completions)
      });
    }
    
    return portfolio;
  }
  
  // Calculate diversification score
  calculateDiversification(accountBalances) {
    const total = Object.values(accountBalances).reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    
    // Calculate how evenly distributed the wealth is
    const percentages = Object.values(accountBalances).map(b => b / total);
    const evenDistribution = 0.25; // 25% each for perfect distribution
    
    let diversificationScore = 100;
    percentages.forEach(p => {
      const deviation = Math.abs(p - evenDistribution);
      diversificationScore -= deviation * 100;
    });
    
    return Math.max(0, Math.round(diversificationScore));
  }
  
  // Generate habit-specific recommendations
  generateHabitRecommendations(habit, completions) {
    const recommendations = [];
    
    if (completions === 0) {
      recommendations.push('Start practicing this habit to build wealth');
    } else if (completions < 5) {
      recommendations.push('Complete 5 times to unlock survey bonus');
    } else if (completions < 11) {
      recommendations.push('Keep going! You\'re building momentum');
    } else if (completions < 21) {
      recommendations.push('Approaching habit mastery (21 completions)');
    } else {
      recommendations.push('Habit mastered! Consider adding a new challenge');
    }
    
    if (habit.streak && habit.streak > 3) {
      recommendations.push(`Great streak! ${habit.streak} days in a row`);
    }
    
    return recommendations;
  }
  
  // Sync existing bank with real habit data
  async syncWithRealHabitData(bankData, familyId) {
    try {
      // Get current habit data
      const habitsSnapshot = await getDocs(collection(db, 'families', familyId, 'habits'));
      
      // Update portfolio
      bankData.portfolio.habits = await this.analyzeHabitPortfolio(habitsSnapshot.docs);
      
      // Recalculate total value
      bankData.portfolio.totalValue = bankData.accounts.reduce((sum, acc) => sum + acc.balance, 0);
      
      // Update projections based on current performance
      const weeklyGrowthRate = 0.35;
      bankData.portfolio.projectedGrowth = {
        oneWeek: Math.round(bankData.portfolio.totalValue * weeklyGrowthRate),
        oneMonth: Math.round(bankData.portfolio.totalValue * weeklyGrowthRate * 4),
        threeMonths: Math.round(bankData.portfolio.totalValue * weeklyGrowthRate * 12)
      };
      
      // Update diversification
      const balances = {};
      bankData.accounts.forEach(acc => {
        balances[acc.accountType] = acc.balance;
      });
      bankData.portfolio.diversificationScore = this.calculateDiversification(balances);
      
      return bankData;
    } catch (error) {
      console.error('Error syncing with real habit data:', error);
      return bankData;
    }
  }
}

// Export singleton instance
const habitBankService = new HabitBankService();
export default habitBankService;