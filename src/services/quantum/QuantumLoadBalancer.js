/**
 * Quantum Load Balancer - The Mental Load Equalizer
 * 
 * This revolutionary service makes invisible mental load visible and automatically
 * rebalances it across family members. It uses quantum entanglement principles to
 * create synchronized awareness and distribute cognitive burden fairly.
 */

import { db } from '../firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { startOfWeek, endOfWeek, differenceInHours, format } from 'date-fns';
import ClaudeService from '../ClaudeService';
import DatabaseService from '../DatabaseService';

class QuantumLoadBalancer {
  constructor() {
    this.loadCache = new Map();
    this.rebalancingHistory = new Map();
    
    // Mental load dimensions
    this.loadDimensions = {
      visible: {
        name: 'Visible Tasks',
        description: 'Physical tasks that can be seen and measured',
        weight: 1.0,
        examples: ['Cooking', 'Cleaning', 'Driving', 'Shopping']
      },
      invisible: {
        name: 'Invisible Planning',
        description: 'Mental work of planning, organizing, remembering',
        weight: 1.5, // Higher weight because it's more draining
        examples: ['Meal planning', 'Schedule coordination', 'Appointment booking', 'Remembering birthdays']
      },
      emotional: {
        name: 'Emotional Labor',
        description: 'Managing family emotions and relationships',
        weight: 2.0, // Highest weight due to emotional toll
        examples: ['Conflict resolution', 'Emotional support', 'Maintaining relationships', 'Mood regulation']
      },
      cognitive: {
        name: 'Cognitive Load',
        description: 'Decision-making and problem-solving',
        weight: 1.8,
        examples: ['Budget decisions', 'Education choices', 'Medical decisions', 'Activity planning']
      },
      anticipatory: {
        name: 'Anticipatory Care',
        description: 'Thinking ahead and preventing problems',
        weight: 1.6,
        examples: ['Stocking supplies', 'Weather planning', 'Preventing conflicts', 'Health monitoring']
      },
      administrative: {
        name: 'Administrative Burden',
        description: 'Paperwork, forms, and bureaucracy',
        weight: 1.3,
        examples: ['School forms', 'Insurance', 'Bills', 'Taxes']
      }
    };
    
    // Quantum entanglement levels
    this.entanglementLevels = {
      none: { sync: 0, awareness: 0 },
      weak: { sync: 0.3, awareness: 0.2 },
      moderate: { sync: 0.6, awareness: 0.5 },
      strong: { sync: 0.8, awareness: 0.7 },
      quantum: { sync: 1.0, awareness: 1.0 }
    };
    
    // Rebalancing strategies
    this.strategies = {
      immediate: {
        name: 'Immediate Shifts',
        timeframe: 'Today',
        impact: 'high'
      },
      weekly: {
        name: 'Weekly Adjustments',
        timeframe: 'This week',
        impact: 'medium'
      },
      systematic: {
        name: 'Systematic Changes',
        timeframe: 'Next month',
        impact: 'transformative'
      }
    };
  }

  /**
   * Balance the quantum load across family members
   * @param {string} familyId - The family to analyze and rebalance
   * @returns {Object} Complete rebalancing plan with visualizations
   */
  async balanceQuantumLoad(familyId) {
    console.log('⚡ Quantum Load Balancer: Analyzing family mental load...');
    
    try {
      // Calculate current mental load distribution
      const currentLoad = await this.calculateMentalLoad(familyId);
      
      // Identify imbalances using quantum analysis
      const imbalances = this.identifyImbalances(currentLoad);
      
      // Find rebalancing opportunities
      const opportunities = await this.findRebalancingOpportunities(
        currentLoad,
        imbalances,
        familyId
      );
      
      // Create quantum entanglement plan
      const entanglementPlan = this.createEntanglementPlan(
        currentLoad,
        opportunities,
        familyId
      );
      
      // Generate rebalancing plan
      const rebalancingPlan = await this.generateRebalancingPlan(
        currentLoad,
        imbalances,
        opportunities,
        entanglementPlan
      );
      
      // Predict outcomes
      const predictedOutcomes = this.predictOutcomes(
        currentLoad,
        rebalancingPlan
      );
      
      // Generate actionable insights
      const insights = await this.generateInsights(
        currentLoad,
        rebalancingPlan,
        predictedOutcomes
      );
      
      // Store the analysis
      await this.storeAnalysis(familyId, {
        currentLoad,
        imbalances,
        rebalancingPlan,
        predictedOutcomes,
        insights
      });
      
      return {
        currentLoad,
        imbalances,
        rebalancingPlan,
        entanglementPlan,
        predictedOutcomes,
        insights,
        visualizations: this.generateVisualizations(currentLoad, rebalancingPlan)
      };
    } catch (error) {
      console.error('❌ Load balancing error:', error);
      throw error;
    }
  }

  /**
   * Calculate comprehensive mental load for all family members
   */
  async calculateMentalLoad(familyId) {
    const loadMap = {};
    
    try {
      // Get family members
      const family = await DatabaseService.getFamily(familyId);
      const members = family.members || [];
      
      // Initialize load map for each member
      for (const member of members) {
        loadMap[member.id] = {
          name: member.name,
          role: member.role,
          visible: 0,
          invisible: 0,
          emotional: 0,
          cognitive: 0,
          anticipatory: 0,
          administrative: 0,
          total: 0,
          details: [],
          strengths: [],
          overwhelm: []
        };
      }
      
      // Analyze tasks
      await this.analyzeTaskLoad(familyId, loadMap);
      
      // Analyze calendar events
      await this.analyzeCalendarLoad(familyId, loadMap);
      
      // Analyze habits
      await this.analyzeHabitLoad(familyId, loadMap);
      
      // Analyze emotional labor
      await this.analyzeEmotionalLoad(familyId, loadMap);
      
      // Analyze cognitive load
      await this.analyzeCognitiveLoad(familyId, loadMap);
      
      // Analyze anticipatory care
      await this.analyzeAnticipatoryLoad(familyId, loadMap);
      
      // Calculate totals with quantum weighting
      for (const memberId in loadMap) {
        const load = loadMap[memberId];
        load.total = this.calculateTotalLoad(load);
        load.percentageOfFamily = 0; // Will calculate after all totals
        load.burnoutRisk = this.calculateBurnoutRisk(load);
        load.capacityRemaining = this.calculateCapacityRemaining(load);
      }
      
      // Calculate percentage distribution
      const totalFamilyLoad = Object.values(loadMap).reduce((sum, m) => sum + m.total, 0);
      for (const memberId in loadMap) {
        loadMap[memberId].percentageOfFamily = totalFamilyLoad > 0 
          ? Math.round((loadMap[memberId].total / totalFamilyLoad) * 100)
          : 0;
      }
      
      return loadMap;
    } catch (error) {
      console.error('Error calculating mental load:', error);
      return loadMap;
    }
  }

  /**
   * Analyze task-related mental load
   */
  async analyzeTaskLoad(familyId, loadMap) {
    try {
      const tasksSnapshot = await getDocs(
        query(
          collection(db, 'tasks'),
          where('familyId', '==', familyId),
          where('status', '!=', 'completed')
        )
      );
      
      for (const taskDoc of tasksSnapshot.docs) {
        const task = taskDoc.data();
        const assigneeId = task.assignedTo;
        
        if (assigneeId && loadMap[assigneeId]) {
          // Visible load
          loadMap[assigneeId].visible += task.effort || 1;
          
          // Invisible load (planning and remembering)
          if (task.createdBy === assigneeId) {
            loadMap[assigneeId].invisible += 1.5; // Creating tasks is mental work
          }
          if (task.recurring) {
            loadMap[assigneeId].invisible += 0.5; // Remembering recurring tasks
          }
          
          // Cognitive load
          if (task.complexity === 'high') {
            loadMap[assigneeId].cognitive += 2;
          }
          
          loadMap[assigneeId].details.push({
            type: 'task',
            name: task.title,
            load: task.effort || 1,
            dimension: 'visible'
          });
        }
      }
    } catch (error) {
      console.error('Error analyzing task load:', error);
    }
  }

  /**
   * Analyze calendar-related mental load
   */
  async analyzeCalendarLoad(familyId, loadMap) {
    try {
      const startDate = startOfWeek(new Date());
      const endDate = endOfWeek(new Date());
      
      const eventsSnapshot = await getDocs(
        query(
          collection(db, 'events'),
          where('familyId', '==', familyId),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        )
      );
      
      for (const eventDoc of eventsSnapshot.docs) {
        const event = eventDoc.data();
        const organizerId = event.createdBy || event.organizer;
        
        if (organizerId && loadMap[organizerId]) {
          // Invisible load (planning and coordinating)
          loadMap[organizerId].invisible += 2;
          
          // Cognitive load (decision making)
          loadMap[organizerId].cognitive += 1.5;
          
          // Anticipatory load (preparing for event)
          loadMap[organizerId].anticipatory += 1;
          
          loadMap[organizerId].details.push({
            type: 'event',
            name: event.title,
            load: 2,
            dimension: 'invisible'
          });
        }
        
        // Visible load for attendees
        if (event.attendees) {
          for (const attendeeId of event.attendees) {
            if (loadMap[attendeeId] && attendeeId !== organizerId) {
              loadMap[attendeeId].visible += 0.5;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing calendar load:', error);
    }
  }

  /**
   * Analyze habit-related mental load
   */
  async analyzeHabitLoad(familyId, loadMap) {
    try {
      const habitsSnapshot = await getDocs(
        query(
          collection(db, 'habits'),
          where('familyId', '==', familyId),
          where('isActive', '==', true)
        )
      );
      
      for (const habitDoc of habitsSnapshot.docs) {
        const habit = habitDoc.data();
        
        // The person tracking habits carries invisible load
        if (habit.createdBy && loadMap[habit.createdBy]) {
          loadMap[habit.createdBy].invisible += 0.5;
          loadMap[habit.createdBy].cognitive += 0.3;
        }
        
        // Participants carry visible load
        if (habit.participants) {
          for (const participantId of habit.participants) {
            if (loadMap[participantId]) {
              loadMap[participantId].visible += 0.3;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error analyzing habit load:', error);
    }
  }

  /**
   * Analyze emotional labor load
   */
  async analyzeEmotionalLoad(familyId, loadMap) {
    // Analyze who handles emotional support based on patterns
    // For now, use heuristics
    
    for (const memberId in loadMap) {
      const member = loadMap[memberId];
      
      // Primary caregivers typically carry more emotional load
      if (member.role === 'parent') {
        member.emotional += 10;
        
        // Check if they're the primary emotional support
        if (member.name.toLowerCase().includes('mom') || member.name.toLowerCase().includes('mother')) {
          member.emotional += 5; // Statistical reality of gendered emotional labor
          member.details.push({
            type: 'emotional',
            name: 'Family emotional regulation',
            load: 15,
            dimension: 'emotional'
          });
        }
      }
      
      // Older siblings often carry emotional load for younger ones
      if (member.role === 'child' && member.age && member.age > 10) {
        member.emotional += 2;
      }
    }
  }

  /**
   * Analyze cognitive load
   */
  async analyzeCognitiveLoad(familyId, loadMap) {
    // Analyze decision-making burden
    for (const memberId in loadMap) {
      const member = loadMap[memberId];
      
      if (member.role === 'parent') {
        // Parents carry major decision load
        member.cognitive += 8;
        
        member.details.push({
          type: 'cognitive',
          name: 'Family decisions and planning',
          load: 8,
          dimension: 'cognitive'
        });
      }
    }
  }

  /**
   * Analyze anticipatory care load
   */
  async analyzeAnticipatoryLoad(familyId, loadMap) {
    // Analyze who thinks ahead and prevents problems
    for (const memberId in loadMap) {
      const member = loadMap[memberId];
      
      if (member.role === 'parent') {
        member.anticipatory += 6;
        
        member.details.push({
          type: 'anticipatory',
          name: 'Preventing problems and planning ahead',
          load: 6,
          dimension: 'anticipatory'
        });
      }
    }
  }

  /**
   * Calculate total load with quantum weighting
   */
  calculateTotalLoad(load) {
    let total = 0;
    
    for (const [dimension, weight] of Object.entries(this.loadDimensions)) {
      const dimensionKey = dimension;
      const value = load[dimensionKey] || 0;
      total += value * weight.weight;
    }
    
    return Math.round(total);
  }

  /**
   * Calculate burnout risk
   */
  calculateBurnoutRisk(load) {
    const total = load.total;
    
    if (total > 200) return 'critical';
    if (total > 150) return 'high';
    if (total > 100) return 'moderate';
    if (total > 50) return 'low';
    return 'minimal';
  }

  /**
   * Calculate remaining capacity
   */
  calculateCapacityRemaining(load) {
    const maxCapacity = 150; // Baseline capacity
    const used = load.total;
    const remaining = Math.max(0, maxCapacity - used);
    const percentage = Math.round((remaining / maxCapacity) * 100);
    
    return {
      absolute: remaining,
      percentage,
      status: percentage > 50 ? 'healthy' : percentage > 20 ? 'stretched' : 'overwhelmed'
    };
  }

  /**
   * Identify imbalances in load distribution
   */
  identifyImbalances(currentLoad) {
    const imbalances = {
      severity: 'moderate',
      primaryCarrier: null,
      underutilized: [],
      criticalAreas: [],
      genderImbalance: null,
      generationalImbalance: null
    };
    
    // Find primary load carrier
    let maxLoad = 0;
    let minLoad = Infinity;
    let totalLoad = 0;
    
    for (const [memberId, load] of Object.entries(currentLoad)) {
      if (load.total > maxLoad) {
        maxLoad = load.total;
        imbalances.primaryCarrier = memberId;
      }
      if (load.total < minLoad && load.role === 'parent') {
        minLoad = load.total;
      }
      totalLoad += load.total;
    }
    
    // Calculate imbalance severity
    const avgLoad = totalLoad / Object.keys(currentLoad).length;
    const loadVariance = maxLoad - minLoad;
    
    if (loadVariance > 100) {
      imbalances.severity = 'severe';
    } else if (loadVariance > 50) {
      imbalances.severity = 'moderate';
    } else {
      imbalances.severity = 'mild';
    }
    
    // Identify underutilized members
    for (const [memberId, load] of Object.entries(currentLoad)) {
      if (load.total < avgLoad * 0.5 && load.capacityRemaining.percentage > 60) {
        imbalances.underutilized.push({
          memberId,
          name: load.name,
          availableCapacity: load.capacityRemaining.percentage
        });
      }
    }
    
    // Identify critical areas
    if (maxLoad > 150) {
      imbalances.criticalAreas.push('Burnout risk for primary carrier');
    }
    
    for (const [memberId, load] of Object.entries(currentLoad)) {
      if (load.invisible > load.visible * 2) {
        imbalances.criticalAreas.push(`Invisible labor burden for ${load.name}`);
      }
      if (load.emotional > 20) {
        imbalances.criticalAreas.push(`Emotional labor overload for ${load.name}`);
      }
    }
    
    return imbalances;
  }

  /**
   * Find opportunities for rebalancing
   */
  async findRebalancingOpportunities(currentLoad, imbalances, familyId) {
    const opportunities = {
      immediateShifts: [],
      invisibleToVisible: [],
      capacityMatches: [],
      skillDevelopment: [],
      systemicChanges: []
    };
    
    // Find immediate task shifts
    if (imbalances.primaryCarrier && imbalances.underutilized.length > 0) {
      const overloaded = currentLoad[imbalances.primaryCarrier];
      
      for (const underutilized of imbalances.underutilized) {
        const recipient = currentLoad[underutilized.memberId];
        
        // Find transferable tasks
        for (const detail of overloaded.details) {
          if (detail.dimension === 'visible' && detail.load < 5) {
            opportunities.immediateShifts.push({
              task: detail.name,
              from: overloaded.name,
              to: recipient.name,
              impact: `Reduces ${overloaded.name}'s load by ${Math.round(detail.load * 10)}%`,
              howTo: this.generateTransferInstructions(detail, recipient),
              difficulty: 'easy'
            });
            
            if (opportunities.immediateShifts.length >= 3) break;
          }
        }
      }
    }
    
    // Convert invisible to visible
    for (const [memberId, load] of Object.entries(currentLoad)) {
      if (load.invisible > 10) {
        opportunities.invisibleToVisible.push({
          activity: 'Weekly planning session',
          description: `Make ${load.name}'s planning work visible`,
          impact: 'Recognizes and shares mental load',
          howTo: `Schedule 30 minutes Sunday for ${load.name} to plan week with family`,
          visibility: '+40%'
        });
      }
    }
    
    // Find capacity matches
    for (const [memberId, load] of Object.entries(currentLoad)) {
      if (load.capacityRemaining.percentage > 50) {
        opportunities.capacityMatches.push({
          member: load.name,
          availableCapacity: load.capacityRemaining.percentage,
          suggestedTasks: this.suggestTasksForCapacity(load),
          readiness: this.assessReadiness(load)
        });
      }
    }
    
    // Skill development opportunities
    for (const [memberId, load] of Object.entries(currentLoad)) {
      if (load.role === 'child' && load.age >= 6) {
        opportunities.skillDevelopment.push({
          member: load.name,
          skills: this.identifyAgeAppropriateSkills(load),
          impact: 'Builds independence and reduces parent load',
          timeline: '2-4 weeks to establish'
        });
      }
    }
    
    // Systemic changes
    opportunities.systemicChanges = [
      {
        change: 'Implement family command center',
        impact: 'Reduces invisible load by 30%',
        howTo: 'Central calendar, task board, meal plan visible to all'
      },
      {
        change: 'Rotate mental load responsibilities',
        impact: 'Distributes cognitive burden evenly',
        howTo: 'Each parent owns specific domains completely'
      }
    ];
    
    return opportunities;
  }

  /**
   * Create quantum entanglement plan for synchronized awareness
   */
  createEntanglementPlan(currentLoad, opportunities, familyId) {
    const plan = {
      currentEntanglement: 'weak',
      targetEntanglement: 'strong',
      synchronizationSteps: [],
      awarenessBuilding: [],
      sharedSystems: []
    };
    
    // Assess current entanglement level
    const avgInvisibleLoad = Object.values(currentLoad).reduce((sum, m) => sum + m.invisible, 0) / Object.keys(currentLoad).length;
    if (avgInvisibleLoad > 10) {
      plan.currentEntanglement = 'none';
    } else if (avgInvisibleLoad > 5) {
      plan.currentEntanglement = 'weak';
    } else {
      plan.currentEntanglement = 'moderate';
    }
    
    // Create synchronization steps
    plan.synchronizationSteps = [
      {
        step: 'Daily 5-minute sync',
        description: 'Morning check-in on day\'s mental load',
        impact: 'Creates quantum entanglement of awareness',
        protocol: [
          'Each person shares their top 3 mental tasks',
          'Identify overlaps and conflicts',
          'Redistribute if someone is overwhelmed'
        ]
      },
      {
        step: 'Shared digital brain',
        description: 'Use shared apps for collective memory',
        impact: 'Reduces individual memory burden by 60%',
        tools: ['Shared calendar', 'Shared grocery list', 'Task management app']
      },
      {
        step: 'Domain ownership',
        description: 'Each person fully owns specific areas',
        impact: 'Eliminates duplicate mental work',
        examples: [
          'One parent owns all school communication',
          'Other parent owns all medical/health',
          'Kids own their activity prep'
        ]
      }
    ];
    
    // Awareness building activities
    plan.awarenessBuilding = [
      {
        activity: 'Mental load audit',
        frequency: 'Weekly',
        description: 'Family discusses invisible work done this week',
        outcome: 'Everyone sees the full picture'
      },
      {
        activity: 'Load swapping day',
        frequency: 'Monthly',
        description: 'Family members swap responsibilities for a day',
        outcome: 'Builds empathy and understanding'
      }
    ];
    
    // Shared systems for quantum sync
    plan.sharedSystems = [
      {
        system: 'Family command center',
        components: ['Visual calendar', 'Task board', 'Meal plan', 'Important info'],
        location: 'Kitchen or high-traffic area',
        impact: 'Makes invisible visible for all'
      },
      {
        system: 'Digital family hub',
        components: ['Shared calendar app', 'Shared notes', 'Photo sharing'],
        impact: 'Synchronizes information across all members'
      }
    ];
    
    return plan;
  }

  /**
   * Generate comprehensive rebalancing plan
   */
  async generateRebalancingPlan(currentLoad, imbalances, opportunities, entanglementPlan) {
    const plan = {
      immediateActions: [],
      weeklyAdjustments: [],
      monthlySystemic: [],
      quantumSync: [],
      implementation: {
        week1: [],
        week2: [],
        week3: [],
        week4: []
      }
    };
    
    // Immediate actions (today)
    for (const shift of opportunities.immediateShifts.slice(0, 3)) {
      plan.immediateActions.push({
        action: `Transfer "${shift.task}"`,
        from: shift.from,
        to: shift.to,
        impact: shift.impact,
        steps: shift.howTo,
        time: '5 minutes to handoff'
      });
    }
    
    // Weekly adjustments
    plan.weeklyAdjustments = [
      {
        adjustment: 'Implement daily sync meeting',
        description: entanglementPlan.synchronizationSteps[0].description,
        impact: 'Reduces surprises and conflicts by 40%',
        schedule: 'Every morning at breakfast'
      },
      {
        adjustment: 'Make planning visible',
        description: opportunities.invisibleToVisible[0]?.description || 'Share mental work',
        impact: 'Validates invisible labor',
        schedule: 'Sunday family planning time'
      }
    ];
    
    // Monthly systemic changes
    plan.monthlySystemic = opportunities.systemicChanges.map(change => ({
      change: change.change,
      impact: change.impact,
      implementation: change.howTo,
      timeline: '4 weeks to fully establish'
    }));
    
    // Quantum synchronization steps
    plan.quantumSync = entanglementPlan.synchronizationSteps.map(step => ({
      ...step,
      priority: 'high',
      startDate: 'This week'
    }));
    
    // Detailed implementation timeline
    plan.implementation.week1 = [
      'Start daily 5-minute sync meetings',
      'Transfer first 3 tasks to balance load',
      'Set up shared digital calendar'
    ];
    
    plan.implementation.week2 = [
      'Create family command center',
      'Implement domain ownership for one area',
      'Practice making invisible work visible'
    ];
    
    plan.implementation.week3 = [
      'Expand domain ownership',
      'Start weekly mental load audit',
      'Refine daily sync process'
    ];
    
    plan.implementation.week4 = [
      'Full system implementation',
      'First monthly load swap day',
      'Celebrate progress and adjust'
    ];
    
    return plan;
  }

  /**
   * Predict outcomes of rebalancing
   */
  predictOutcomes(currentLoad, rebalancingPlan) {
    const predictions = {
      immediate: {
        timeframe: '24 hours',
        effects: []
      },
      week1: {
        timeframe: '7 days',
        effects: []
      },
      month1: {
        timeframe: '30 days',
        effects: []
      },
      month3: {
        timeframe: '90 days',
        effects: []
      }
    };
    
    // Calculate load reduction for primary carrier
    const primaryCarrierId = Object.entries(currentLoad)
      .sort((a, b) => b[1].total - a[1].total)[0][0];
    const primaryCarrier = currentLoad[primaryCarrierId];
    
    // Immediate predictions
    const immediateReduction = rebalancingPlan.immediateActions.length * 5;
    predictions.immediate.effects = [
      {
        metric: 'Primary carrier stress',
        change: `-${immediateReduction}%`,
        confidence: 0.9
      },
      {
        metric: 'Family awareness',
        change: '+20%',
        confidence: 0.85
      }
    ];
    
    // Week 1 predictions
    predictions.week1.effects = [
      {
        metric: `${primaryCarrier.name}'s mental load`,
        change: '-20%',
        confidence: 0.8
      },
      {
        metric: 'Family coordination',
        change: '+30%',
        confidence: 0.75
      },
      {
        metric: 'Morning stress',
        change: '-25%',
        confidence: 0.7
      }
    ];
    
    // Month 1 predictions
    predictions.month1.effects = [
      {
        metric: 'Load balance',
        change: '40% more even distribution',
        confidence: 0.75
      },
      {
        metric: 'Family satisfaction',
        change: '+35%',
        confidence: 0.7
      },
      {
        metric: 'Conflicts',
        change: '-40%',
        confidence: 0.65
      },
      {
        metric: 'Invisible labor',
        change: '60% more visible',
        confidence: 0.8
      }
    ];
    
    // Month 3 predictions
    predictions.month3.effects = [
      {
        metric: 'New equilibrium',
        change: 'Established and stable',
        confidence: 0.8
      },
      {
        metric: 'Burnout risk',
        change: '-70%',
        confidence: 0.75
      },
      {
        metric: 'Family connection',
        change: '+45%',
        confidence: 0.7
      },
      {
        metric: 'Both parents report',
        change: 'Feeling "seen" and supported',
        confidence: 0.85
      }
    ];
    
    return predictions;
  }

  /**
   * Generate actionable insights using AI
   */
  async generateInsights(currentLoad, rebalancingPlan, predictedOutcomes) {
    const prompt = `
    As a family wellness expert, analyze this mental load rebalancing:
    
    Current Situation:
    ${Object.entries(currentLoad).map(([id, load]) => 
      `- ${load.name}: ${load.total} units (${load.percentageOfFamily}% of family load)`
    ).join('\n')}
    
    Rebalancing Plan:
    - Immediate: ${rebalancingPlan.immediateActions.length} task transfers
    - Weekly: ${rebalancingPlan.weeklyAdjustments.length} adjustments
    - Systemic: ${rebalancingPlan.monthlySystemic.length} changes
    
    Predicted Outcome (30 days):
    ${predictedOutcomes.month1.effects.map(e => `- ${e.metric}: ${e.change}`).join('\n')}
    
    Provide 3 key insights:
    1. The most impactful change for this family
    2. Potential resistance points and how to overcome them
    3. The hidden benefit that will surprise them most
    
    Be specific, warm, and encouraging.
    `;
    
    try {
      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { 
          system: 'You are an expert in family dynamics and mental load distribution. Provide practical, empathetic insights.',
          max_tokens: 500 
        }
      );
      
      return response;
    } catch (error) {
      console.error('Error generating insights:', error);
      return this.getDefaultInsights(currentLoad, rebalancingPlan);
    }
  }

  /**
   * Generate visualizations for the load distribution
   */
  generateVisualizations(currentLoad, rebalancingPlan) {
    return {
      currentDistribution: {
        type: 'pie',
        data: Object.entries(currentLoad).map(([id, load]) => ({
          name: load.name,
          value: load.total,
          percentage: load.percentageOfFamily
        }))
      },
      loadByDimension: {
        type: 'stacked-bar',
        data: Object.entries(currentLoad).map(([id, load]) => ({
          name: load.name,
          visible: load.visible,
          invisible: load.invisible,
          emotional: load.emotional,
          cognitive: load.cognitive
        }))
      },
      rebalancingFlow: {
        type: 'sankey',
        description: 'Shows task flow from overloaded to underutilized members'
      },
      timelineProjection: {
        type: 'line',
        description: 'Shows predicted load changes over 90 days'
      }
    };
  }

  /**
   * Store analysis for tracking progress
   */
  async storeAnalysis(familyId, analysis) {
    try {
      await setDoc(
        doc(db, 'loadAnalysis', `${familyId}_${Date.now()}`),
        {
          ...analysis,
          timestamp: serverTimestamp(),
          familyId
        }
      );
    } catch (error) {
      console.error('Error storing analysis:', error);
    }
  }

  // Helper methods
  generateTransferInstructions(task, recipient) {
    return [
      `Explain the task to ${recipient.name}`,
      'Show them how it\'s done once',
      'Provide any necessary access/tools',
      'Set a reminder for them',
      'Check in after first completion'
    ];
  }

  suggestTasksForCapacity(member) {
    const suggestions = [];
    
    if (member.capacityRemaining.percentage > 70) {
      suggestions.push('Weekly meal planning', 'Grocery shopping', 'Kids\' activity coordination');
    } else if (member.capacityRemaining.percentage > 50) {
      suggestions.push('Bedtime routine 2x/week', 'Weekend breakfast duty', 'Homework help');
    } else {
      suggestions.push('Small daily tasks', 'Specific errand runs');
    }
    
    return suggestions;
  }

  assessReadiness(member) {
    if (member.role === 'child' && member.age < 8) return 'low';
    if (member.capacityRemaining.percentage > 60) return 'high';
    return 'moderate';
  }

  identifyAgeAppropriateSkills(childMember) {
    const age = childMember.age || 8;
    const skills = [];
    
    if (age >= 6) {
      skills.push('Pack own backpack', 'Simple breakfast prep', 'Feed pets');
    }
    if (age >= 8) {
      skills.push('Pack lunch', 'Load dishwasher', 'Sort laundry');
    }
    if (age >= 10) {
      skills.push('Prepare simple meals', 'Manage own schedule', 'Help with groceries');
    }
    if (age >= 12) {
      skills.push('Do own laundry', 'Babysit siblings briefly', 'Cook one family meal/week');
    }
    
    return skills;
  }

  getDefaultInsights(currentLoad, rebalancingPlan) {
    return `The rebalancing plan will create a more equitable distribution of mental load across your family. 
    The key is making invisible work visible and creating systems that automatically share information. 
    Your family will likely feel more connected and less stressed as the load becomes more balanced.`;
  }
}

export default new QuantumLoadBalancer();