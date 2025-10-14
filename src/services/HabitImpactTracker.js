/**
 * Habit Impact Tracker
 *
 * Tracks the real-world impact of habit implementation on cognitive load
 * Provides before/after analysis to prove habits are working
 *
 * Key Features:
 * - Baseline measurement when habit is created
 * - Weekly progress tracking
 * - Before/after comparison
 * - Impact quantification (hours saved, balance improvement)
 * - Celebration triggers when impact is significant
 */

import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

class HabitImpactTracker {
  constructor() {
    this.collectionName = 'habitImpactTracking';
  }

  /**
   * Create baseline measurement when habit is started
   * @param {Object} params - Habit and baseline data
   * @returns {Promise<string>} Tracking ID
   */
  async createBaselineMeasurement({
    familyId,
    habitId,
    habitName,
    targetedImbalance,
    baselineMetrics,
    projectedImpact,
    createdBy
  }) {
    try {
      console.log('📊 Creating baseline measurement for habit:', habitName);

      const trackingId = `${familyId}_${habitId}_${Date.now()}`;
      const trackingRef = doc(db, this.collectionName, trackingId);

      const trackingData = {
        familyId,
        habitId,
        habitName,
        createdBy,
        createdAt: serverTimestamp(),

        // What this habit targets
        targetedImbalance: {
          task: targetedImbalance.task,
          weight: targetedImbalance.weight,
          currentOwner: targetedImbalance.currentOwner,
          hoursPerWeek: targetedImbalance.hoursPerWeek
        },

        // Baseline cognitive load metrics (before habit)
        baseline: {
          measurementDate: new Date(),
          overallBalance: baselineMetrics.overallBalance, // e.g., 87% on primary parent
          perceptionGap: baselineMetrics.perceptionGap, // e.g., 44%
          specificTaskLoad: baselineMetrics.specificTaskLoad, // Hours spent on this task
          stressLevel: baselineMetrics.stressLevel || null, // Optional 1-10 rating
          relationshipSatisfaction: baselineMetrics.relationshipSatisfaction || null // Optional 1-10
        },

        // Projected impact (what we expect to achieve)
        projected: {
          hoursPerWeek: projectedImpact.hoursPerWeek,
          balanceImprovement: projectedImpact.percentageChange,
          timeline: projectedImpact.timeline,
          successRate: projectedImpact.successRate || 85
        },

        // Actual measurements (filled in over time)
        measurements: [],

        // Current status
        status: 'active', // active, paused, completed, abandoned
        daysSinceStart: 0,
        completionCount: 0,
        streakDays: 0,

        // Impact calculated once enough data is available
        actualImpact: null,
        impactVerified: false,
        verificationDate: null
      };

      await setDoc(trackingRef, trackingData);

      console.log('✅ Baseline measurement created:', trackingId);
      return trackingId;

    } catch (error) {
      console.error('❌ Error creating baseline measurement:', error);
      throw error;
    }
  }

  /**
   * Record a weekly measurement as habit progresses
   * @param {string} trackingId - The tracking document ID
   * @param {Object} metrics - Current week's metrics
   */
  async recordWeeklyMeasurement(trackingId, metrics) {
    try {
      console.log('📈 Recording weekly measurement for:', trackingId);

      const trackingRef = doc(db, this.collectionName, trackingId);
      const trackingDoc = await getDoc(trackingRef);

      if (!trackingDoc.exists()) {
        throw new Error('Tracking document not found');
      }

      const data = trackingDoc.data();
      const weekNumber = Math.floor(data.daysSinceStart / 7) + 1;

      const measurement = {
        week: weekNumber,
        date: new Date(),
        overallBalance: metrics.overallBalance,
        perceptionGap: metrics.perceptionGap,
        specificTaskLoad: metrics.specificTaskLoad,
        stressLevel: metrics.stressLevel || null,
        relationshipSatisfaction: metrics.relationshipSatisfaction || null,
        habitCompletionRate: metrics.habitCompletionRate, // % of days habit was completed this week
        notes: metrics.notes || ''
      };

      // Add to measurements array
      const updatedMeasurements = [...(data.measurements || []), measurement];

      await updateDoc(trackingRef, {
        measurements: updatedMeasurements,
        lastMeasurement: serverTimestamp()
      });

      // Check if we have enough data to verify impact (at least 2 weeks)
      if (updatedMeasurements.length >= 2) {
        await this.calculateActualImpact(trackingId);
      }

      console.log('✅ Weekly measurement recorded for week', weekNumber);

    } catch (error) {
      console.error('❌ Error recording weekly measurement:', error);
      throw error;
    }
  }

  /**
   * Calculate actual impact based on measurements
   * @param {string} trackingId - The tracking document ID
   */
  async calculateActualImpact(trackingId) {
    try {
      const trackingRef = doc(db, this.collectionName, trackingId);
      const trackingDoc = await getDoc(trackingRef);

      if (!trackingDoc.exists()) {
        throw new Error('Tracking document not found');
      }

      const data = trackingDoc.data();
      const { baseline, measurements, projected } = data;

      if (!measurements || measurements.length < 2) {
        console.log('⏳ Not enough data yet to calculate impact');
        return null;
      }

      // Get the most recent measurement
      const latest = measurements[measurements.length - 1];

      // Calculate improvements
      const balanceImprovement = baseline.overallBalance - latest.overallBalance;
      const perceptionGapReduction = baseline.perceptionGap - latest.perceptionGap;
      const taskLoadReduction = baseline.specificTaskLoad - latest.specificTaskLoad;

      const stressImprovement = baseline.stressLevel && latest.stressLevel
        ? baseline.stressLevel - latest.stressLevel
        : null;

      const satisfactionImprovement = baseline.relationshipSatisfaction && latest.relationshipSatisfaction
        ? latest.relationshipSatisfaction - baseline.relationshipSatisfaction
        : null;

      // Calculate average completion rate
      const avgCompletionRate = measurements.reduce((sum, m) => sum + m.habitCompletionRate, 0) / measurements.length;

      const actualImpact = {
        calculatedAt: new Date(),
        weeksTracked: measurements.length,

        // Balance metrics
        balanceImprovement: Math.round(balanceImprovement),
        balanceBeforeAfter: {
          before: baseline.overallBalance,
          after: latest.overallBalance
        },

        // Perception gap
        perceptionGapReduction: Math.round(perceptionGapReduction),
        perceptionGapBeforeAfter: {
          before: baseline.perceptionGap,
          after: latest.perceptionGap
        },

        // Time saved
        hoursPerWeekSaved: taskLoadReduction,
        hoursBeforeAfter: {
          before: baseline.specificTaskLoad,
          after: latest.specificTaskLoad
        },

        // Wellbeing
        stressImprovement,
        satisfactionImprovement,

        // Habit adherence
        averageCompletionRate: Math.round(avgCompletionRate),

        // Comparison to projection
        metProjection: taskLoadReduction >= projected.hoursPerWeek * 0.8, // Met 80% of projection
        exceedsProjection: taskLoadReduction > projected.hoursPerWeek,

        // Overall success rating
        successRating: this.calculateSuccessRating({
          balanceImprovement,
          taskLoadReduction,
          projected,
          avgCompletionRate
        })
      };

      // Update the tracking document
      await updateDoc(trackingRef, {
        actualImpact,
        impactVerified: true,
        verificationDate: serverTimestamp()
      });

      console.log('✅ Actual impact calculated:', actualImpact);

      // Check if this deserves celebration
      if (actualImpact.successRating >= 7 || actualImpact.exceedsProjection) {
        await this.triggerCelebration(trackingId, actualImpact);
      }

      return actualImpact;

    } catch (error) {
      console.error('❌ Error calculating actual impact:', error);
      throw error;
    }
  }

  /**
   * Calculate success rating (0-10)
   */
  calculateSuccessRating({ balanceImprovement, taskLoadReduction, projected, avgCompletionRate }) {
    let score = 0;

    // Points for balance improvement (0-3 points)
    if (balanceImprovement >= 10) score += 3;
    else if (balanceImprovement >= 5) score += 2;
    else if (balanceImprovement >= 2) score += 1;

    // Points for time saved (0-4 points)
    const timePercentage = (taskLoadReduction / projected.hoursPerWeek) * 100;
    if (timePercentage >= 100) score += 4;
    else if (timePercentage >= 80) score += 3;
    else if (timePercentage >= 60) score += 2;
    else if (timePercentage >= 40) score += 1;

    // Points for consistency (0-3 points)
    if (avgCompletionRate >= 90) score += 3;
    else if (avgCompletionRate >= 75) score += 2;
    else if (avgCompletionRate >= 60) score += 1;

    return Math.min(10, score);
  }

  /**
   * Trigger celebration for successful habit impact
   */
  async triggerCelebration(trackingId, actualImpact) {
    try {
      console.log('🎉 Triggering celebration for habit success!');

      const celebrationRef = doc(collection(db, 'habitCelebrations'));
      await setDoc(celebrationRef, {
        trackingId,
        type: 'impact_verified',
        actualImpact,
        triggeredAt: serverTimestamp(),
        viewed: false
      });

      // This will be picked up by the UI to show a celebration modal/notification

    } catch (error) {
      console.error('❌ Error triggering celebration:', error);
    }
  }

  /**
   * Get before/after summary for a habit
   * @param {string} trackingId - The tracking document ID
   * @returns {Promise<Object>} Summary data for display
   */
  async getBeforeAfterSummary(trackingId) {
    try {
      const trackingRef = doc(db, this.collectionName, trackingId);
      const trackingDoc = await getDoc(trackingRef);

      if (!trackingDoc.exists()) {
        throw new Error('Tracking document not found');
      }

      const data = trackingDoc.data();

      if (!data.actualImpact) {
        return {
          hasEnoughData: false,
          message: 'Keep tracking! We need at least 2 weeks of data to measure impact.'
        };
      }

      return {
        hasEnoughData: true,
        habitName: data.habitName,
        weeksTracked: data.measurements.length,

        // Visual data for charts
        beforeAfter: {
          balance: data.actualImpact.balanceBeforeAfter,
          perceptionGap: data.actualImpact.perceptionGapBeforeAfter,
          hours: data.actualImpact.hoursBeforeAfter
        },

        // Key metrics
        improvements: {
          balancePoints: data.actualImpact.balanceImprovement,
          hoursPerWeek: data.actualImpact.hoursPerWeekSaved,
          perceptionGapPoints: data.actualImpact.perceptionGapReduction,
          stress: data.actualImpact.stressImprovement,
          satisfaction: data.actualImpact.satisfactionImprovement
        },

        // Comparison to projection
        projection: {
          projected: data.projected.hoursPerWeek,
          actual: data.actualImpact.hoursPerWeekSaved,
          metProjection: data.actualImpact.metProjection,
          exceedsProjection: data.actualImpact.exceedsProjection
        },

        // Success metrics
        success: {
          rating: data.actualImpact.successRating,
          completionRate: data.actualImpact.averageCompletionRate
        },

        // Trend data for sparklines
        trend: data.measurements.map(m => ({
          week: m.week,
          balance: m.overallBalance,
          hours: m.specificTaskLoad
        }))
      };

    } catch (error) {
      console.error('❌ Error getting before/after summary:', error);
      throw error;
    }
  }

  /**
   * Get all active habit tracking for a family
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Array of tracking documents
   */
  async getActiveTracking(familyId) {
    try {
      const trackingQuery = query(
        collection(db, this.collectionName),
        where('familyId', '==', familyId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(trackingQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

    } catch (error) {
      console.error('❌ Error getting active tracking:', error);
      throw error;
    }
  }

  /**
   * Update habit completion count
   * @param {string} trackingId - The tracking document ID
   * @param {number} increment - Number to add to completion count
   */
  async incrementCompletion(trackingId, increment = 1) {
    try {
      const trackingRef = doc(db, this.collectionName, trackingId);
      const trackingDoc = await getDoc(trackingRef);

      if (trackingDoc.exists()) {
        const data = trackingDoc.data();
        await updateDoc(trackingRef, {
          completionCount: (data.completionCount || 0) + increment,
          daysSinceStart: Math.floor((Date.now() - data.createdAt.toMillis()) / (1000 * 60 * 60 * 24))
        });
      }

    } catch (error) {
      console.error('❌ Error incrementing completion:', error);
    }
  }

  /**
   * Get celebration-worthy habits (impact verified and exceeds projection)
   * @param {string} familyId - The family ID
   * @returns {Promise<Array>} Habits ready for celebration
   */
  async getCelebrationWorthyHabits(familyId) {
    try {
      const trackingQuery = query(
        collection(db, this.collectionName),
        where('familyId', '==', familyId),
        where('impactVerified', '==', true),
        orderBy('verificationDate', 'desc'),
        limit(5)
      );

      const snapshot = await getDocs(trackingQuery);
      const habits = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter to only habits that exceed projection or have high success rating
      return habits.filter(h =>
        h.actualImpact &&
        (h.actualImpact.exceedsProjection || h.actualImpact.successRating >= 8)
      );

    } catch (error) {
      console.error('❌ Error getting celebration-worthy habits:', error);
      return [];
    }
  }
}

export default new HabitImpactTracker();
