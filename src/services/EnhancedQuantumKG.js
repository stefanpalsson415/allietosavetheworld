// Enhanced Quantum Knowledge Graph with Co-Ownership Patterns
// Extends the base QuantumKnowledgeGraph to support mental load redistribution

import { QuantumKnowledgeGraph } from './QuantumKnowledgeGraph';
import { CoOwnershipHelpers } from '../models/CoOwnershipModels';
import { db } from './firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

/**
 * Enhanced Quantum Knowledge Graph
 * Adds co-ownership intelligence to the quantum knowledge graph
 */
class EnhancedQuantumKG extends QuantumKnowledgeGraph {
  constructor() {
    super();

    // Add co-ownership specific entity types
    this.coreEntityTypes.add('quantum_ownership');
    this.coreEntityTypes.add('quantum_rotation');
    this.coreEntityTypes.add('quantum_workload');
    this.coreEntityTypes.add('quantum_consensus');
    this.coreEntityTypes.add('quantum_domain');
    this.coreEntityTypes.add('quantum_mental_work');

    // Add co-ownership relationships
    this.quantumRelationships = {
      ...this.quantumRelationships,

      // Co-ownership relationships
      'co_owns_with': { weight: 1.2, shared: true, bidirectional: true },
      'delegates_to': { weight: 0.8, transfer: true },
      'mentors_for': { weight: 0.9, learning: true },
      'rotates_with': { weight: 1.0, temporal: true },
      'backs_up': { weight: 0.7, support: true },

      // Mental load relationships
      'notices_for': { weight: 0.6, cognitive: true },
      'plans_for': { weight: 0.8, cognitive: true },
      'researches_for': { weight: 0.7, cognitive: true },
      'coordinates_for': { weight: 0.9, cognitive: true },
      'emotionally_supports': { weight: 1.0, emotional: true },

      // Domain relationships
      'leads_domain': { weight: 1.0, authority: true },
      'participates_in_domain': { weight: 0.7, collaborative: true },
      'handoff_from': { weight: 0.8, transition: true },
      'handoff_to': { weight: 0.8, transition: true },

      // Consensus relationships
      'votes_on': { weight: 0.5, democratic: true },
      'proposes': { weight: 0.7, initiative: true },
      'supports_decision': { weight: 0.8, consensus: true },
      'opposes_decision': { weight: -0.8, consensus: true }
    };

    // Workload distribution patterns
    this.workloadPatterns = {
      overloaded: { threshold: 0.8, suggestion: 'redistribute' },
      balanced: { threshold: 0.6, suggestion: 'maintain' },
      underutilized: { threshold: 0.4, suggestion: 'assign_more' },
      learning: { threshold: 0.3, suggestion: 'pair_with_mentor' }
    };
  }

  /**
   * Analyze workload distribution across family members
   */
  async analyzeWorkloadDistribution(familyId) {
    try {
      // Get all family members
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      if (!familyDoc.exists()) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data();
      const members = [...(familyData.parents || []), ...(familyData.children || [])];

      // Get survey responses to understand current distribution
      const surveyData = await this.getSurveyInsights(familyId);

      // Calculate workload for each member
      const workloadAnalysis = {};

      for (const member of members) {
        const memberId = member.id || member.email;
        if (!memberId) continue;

        // Get all tasks/events assigned to this member
        const tasks = await this.getMemberTasks(familyId, memberId);
        const events = await this.getMemberEvents(familyId, memberId);

        // Calculate cognitive, physical, and emotional loads
        const cognitiveLoad = this.calculateCognitiveLoad(tasks, events, surveyData[memberId]);
        const physicalLoad = this.calculatePhysicalLoad(tasks, events);
        const emotionalLoad = this.calculateEmotionalLoad(tasks, events, surveyData[memberId]);

        workloadAnalysis[memberId] = {
          name: member.name || member.email,
          cognitive: cognitiveLoad,
          physical: physicalLoad,
          emotional: emotionalLoad,
          total: cognitiveLoad + physicalLoad + emotionalLoad,
          capacity: await this.getMemberCapacity(familyId, memberId),
          domains: await this.getMemberDomains(familyId, memberId),
          surveyInsights: surveyData[memberId] || {}
        };
      }

      // Calculate family-level metrics
      const equalityScore = CoOwnershipHelpers.calculateEqualityScore({
        members: workloadAnalysis
      });

      // Generate redistribution suggestions
      const suggestions = await this.generateRedistributionSuggestions(workloadAnalysis);

      // Create quantum entities for the analysis
      await this.createWorkloadEntity(familyId, {
        timestamp: new Date(),
        analysis: workloadAnalysis,
        equalityScore,
        suggestions
      });

      return {
        workloadAnalysis,
        equalityScore,
        suggestions
      };
    } catch (error) {
      console.error('Error analyzing workload distribution:', error);
      throw error;
    }
  }

  /**
   * Get survey insights about workload distribution
   */
  async getSurveyInsights(familyId) {
    try {
      const surveyInsights = {};

      // Get weekly check-in responses
      const checkInsQuery = query(
        collection(db, 'weeklyCheckIns'),
        where('familyId', '==', familyId)
      );
      const checkIns = await getDocs(checkInsQuery);

      checkIns.forEach(doc => {
        const data = doc.data();
        const userId = data.userId;
        if (!surveyInsights[userId]) {
          surveyInsights[userId] = {
            stressLevel: [],
            workloadPerception: [],
            domains: {}
          };
        }

        // Extract workload insights from responses
        if (data.responses) {
          Object.entries(data.responses).forEach(([questionId, response]) => {
            // Look for workload-related questions
            if (questionId.includes('medical') || questionId.includes('appointments')) {
              if (!surveyInsights[userId].domains.medical) {
                surveyInsights[userId].domains.medical = [];
              }
              surveyInsights[userId].domains.medical.push(response);
            }

            if (questionId.includes('meals') || questionId.includes('cooking')) {
              if (!surveyInsights[userId].domains.meals) {
                surveyInsights[userId].domains.meals = [];
              }
              surveyInsights[userId].domains.meals.push(response);
            }

            if (questionId.includes('school') || questionId.includes('homework')) {
              if (!surveyInsights[userId].domains.school) {
                surveyInsights[userId].domains.school = [];
              }
              surveyInsights[userId].domains.school.push(response);
            }

            if (questionId.includes('stress')) {
              surveyInsights[userId].stressLevel.push(response);
            }
          });
        }
      });

      // Calculate domain ownership percentages from survey data
      for (const userId in surveyInsights) {
        const insights = surveyInsights[userId];

        // Calculate average perception for each domain
        for (const domain in insights.domains) {
          const responses = insights.domains[domain];
          const average = responses.reduce((sum, r) => sum + (r || 0), 0) / responses.length;
          insights.domains[domain] = {
            averageLoad: average,
            responseCount: responses.length
          };
        }

        // Calculate average stress
        if (insights.stressLevel.length > 0) {
          insights.averageStress = insights.stressLevel.reduce((sum, s) => sum + s, 0) /
                                   insights.stressLevel.length;
        }
      }

      return surveyInsights;
    } catch (error) {
      console.error('Error getting survey insights:', error);
      return {};
    }
  }

  /**
   * Create rotation suggestion based on workload analysis
   */
  async createRotationSuggestion(familyId, domain, currentLead, suggestedLead, reason) {
    try {
      const suggestionId = this.generateQuantumId('rotation_suggestion', { domain });

      // Create quantum entity for rotation suggestion
      const rotationEntity = {
        id: suggestionId,
        type: 'quantum_rotation',
        properties: {
          domain,
          currentLead,
          suggestedLead,
          reason,
          confidence: await this.calculateRotationConfidence(familyId, domain, suggestedLead),
          benefits: await this.predictRotationBenefits(familyId, domain, currentLead, suggestedLead),
          createdAt: serverTimestamp()
        },
        quantumState: {
          state: 'suggested',
          energy: 0.7,
          potential: 0.9
        }
      };

      await this.createQuantumEntity(familyId, rotationEntity);

      // Create relationships
      await this.createQuantumRelationship(familyId, suggestionId, currentLead, 'handoff_from');
      await this.createQuantumRelationship(familyId, suggestionId, suggestedLead, 'handoff_to');

      return rotationEntity;
    } catch (error) {
      console.error('Error creating rotation suggestion:', error);
      throw error;
    }
  }

  /**
   * Analyze a task for co-ownership opportunities
   */
  async analyzeTaskForCoOwnership(familyId, task) {
    try {
      const analysis = {
        taskId: task.id,
        currentOwner: task.assignedTo,
        coOwnershipOpportunities: [],
        rotationSuggestion: null,
        mentalWorkBreakdown: null
      };

      // Get workload distribution
      const workload = await this.analyzeWorkloadDistribution(familyId);

      // Identify if this task belongs to an overloaded domain
      const taskDomain = this.identifyTaskDomain(task);
      const domainLoads = this.calculateDomainLoads(workload.workloadAnalysis);

      // If current owner is overloaded, suggest co-ownership
      if (task.assignedTo && workload.workloadAnalysis[task.assignedTo]) {
        const ownerLoad = workload.workloadAnalysis[task.assignedTo];

        if (ownerLoad.total / ownerLoad.capacity > 0.8) {
          // Find potential co-owners
          for (const [memberId, memberData] of Object.entries(workload.workloadAnalysis)) {
            if (memberId === task.assignedTo) continue;

            const loadRatio = memberData.total / memberData.capacity;
            if (loadRatio < 0.6) {
              analysis.coOwnershipOpportunities.push({
                memberId,
                memberName: memberData.name,
                currentLoad: loadRatio,
                suggestedRole: this.suggestRole(task, memberData),
                confidence: this.calculateCoOwnershipConfidence(task, memberData)
              });
            }
          }
        }
      }

      // Check if this task should rotate
      if (taskDomain && domainLoads[taskDomain]) {
        const domainData = domainLoads[taskDomain];
        if (domainData.shouldRotate) {
          analysis.rotationSuggestion = {
            domain: taskDomain,
            currentLead: domainData.currentLead,
            suggestedLead: domainData.suggestedLead,
            reason: domainData.rotationReason
          };
        }
      }

      // Break down mental work components
      analysis.mentalWorkBreakdown = {
        noticing: this.estimateNoticingWork(task),
        researching: this.estimateResearchWork(task),
        planning: this.estimatePlanningWork(task),
        coordinating: this.estimateCoordinationWork(task),
        emotionalSupport: this.estimateEmotionalWork(task)
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing task for co-ownership:', error);
      throw error;
    }
  }

  /**
   * Helper methods for workload calculations
   */

  calculateCognitiveLoad(tasks, events, surveyInsights) {
    let load = 0;

    // Base load from task/event count
    load += tasks.length * 10; // 10 mins per task
    load += events.length * 15; // 15 mins per event

    // Adjust based on survey insights
    if (surveyInsights && surveyInsights.averageStress > 7) {
      load *= 1.3; // High stress increases perceived cognitive load
    }

    return load;
  }

  calculatePhysicalLoad(tasks, events) {
    let load = 0;

    tasks.forEach(task => {
      // Estimate physical time based on task type
      if (task.category === 'chore' || task.category === 'errand') {
        load += 30; // 30 mins average
      } else if (task.category === 'appointment') {
        load += 60; // 1 hour including travel
      }
    });

    events.forEach(event => {
      if (event.duration) {
        load += event.duration;
      } else {
        load += 60; // Default 1 hour
      }
    });

    return load;
  }

  calculateEmotionalLoad(tasks, events, surveyInsights) {
    let load = 0;

    // Check for emotionally taxing tasks
    const emotionalKeywords = ['medical', 'doctor', 'therapy', 'school', 'meeting', 'conflict'];

    tasks.forEach(task => {
      if (emotionalKeywords.some(keyword =>
        task.title?.toLowerCase().includes(keyword) ||
        task.description?.toLowerCase().includes(keyword)
      )) {
        load += 20; // Emotional tasks add 20 points
      }
    });

    // Add baseline from survey stress level
    if (surveyInsights && surveyInsights.averageStress) {
      load += surveyInsights.averageStress * 10;
    }

    return load;
  }

  async getMemberCapacity(familyId, memberId) {
    // Default capacity: 40 hours per week (2400 minutes)
    // This could be customized per family member
    return 2400;
  }

  async getMemberDomains(familyId, memberId) {
    // Get domains this member is involved in
    const domains = [];

    // Query domain rotations
    const rotationsQuery = query(
      collection(db, 'domainRotations'),
      where('familyId', '==', familyId),
      where('currentLead', '==', memberId)
    );

    const rotations = await getDocs(rotationsQuery);
    rotations.forEach(doc => {
      domains.push(doc.data().domain);
    });

    return domains;
  }

  async getMemberTasks(familyId, memberId) {
    const tasksQuery = query(
      collection(db, 'kanbanTasks'),
      where('familyId', '==', familyId),
      where('assignedTo', '==', memberId),
      where('completed', '==', false)
    );

    const tasks = await getDocs(tasksQuery);
    return tasks.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async getMemberEvents(familyId, memberId) {
    const eventsQuery = query(
      collection(db, 'events'),
      where('familyId', '==', familyId),
      where('attendees', 'array-contains', memberId)
    );

    const events = await getDocs(eventsQuery);
    return events.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async generateRedistributionSuggestions(workloadAnalysis) {
    const suggestions = [];

    // Find overloaded members
    const overloaded = [];
    const underutilized = [];

    for (const [memberId, data] of Object.entries(workloadAnalysis)) {
      const utilization = data.total / data.capacity;

      if (utilization > 0.8) {
        overloaded.push({ memberId, ...data, utilization });
      } else if (utilization < 0.4) {
        underutilized.push({ memberId, ...data, utilization });
      }
    }

    // Generate redistribution suggestions
    overloaded.forEach(overloadedMember => {
      underutilized.forEach(underMember => {
        // Find domains that could be redistributed
        overloadedMember.domains.forEach(domain => {
          suggestions.push({
            type: 'domain_rotation',
            from: overloadedMember.memberId,
            to: underMember.memberId,
            domain,
            impact: `Reduce ${overloadedMember.name}'s workload by ~20%, increase ${underMember.name}'s by ~15%`,
            confidence: 0.75
          });
        });
      });
    });

    return suggestions;
  }

  identifyTaskDomain(task) {
    const domainKeywords = {
      medical: ['doctor', 'appointment', 'medical', 'dentist', 'therapy'],
      meals: ['meal', 'dinner', 'lunch', 'breakfast', 'grocery', 'cooking'],
      school: ['school', 'homework', 'teacher', 'class', 'education'],
      activities: ['sport', 'practice', 'game', 'activity', 'club'],
      household: ['clean', 'laundry', 'repair', 'maintenance', 'organize']
    };

    const taskText = `${task.title} ${task.description}`.toLowerCase();

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(keyword => taskText.includes(keyword))) {
        return domain;
      }
    }

    return 'general';
  }

  calculateDomainLoads(workloadAnalysis) {
    const domainLoads = {};

    // Aggregate loads by domain
    for (const [memberId, data] of Object.entries(workloadAnalysis)) {
      data.domains.forEach(domain => {
        if (!domainLoads[domain]) {
          domainLoads[domain] = {
            currentLead: memberId,
            totalLoad: 0,
            members: []
          };
        }
        domainLoads[domain].totalLoad += data.total;
        domainLoads[domain].members.push({
          memberId,
          load: data.total
        });
      });
    }

    // Determine if rotation is needed
    for (const [domain, data] of Object.entries(domainLoads)) {
      if (data.members.length > 1) {
        // Sort by load
        data.members.sort((a, b) => a.load - b.load);

        // If current lead has significantly more load, suggest rotation
        const leadLoad = data.members.find(m => m.memberId === data.currentLead)?.load || 0;
        const minLoad = data.members[0].load;

        if (leadLoad > minLoad * 1.5) {
          data.shouldRotate = true;
          data.suggestedLead = data.members[0].memberId;
          data.rotationReason = 'Current lead is overloaded compared to other domain participants';
        }
      }
    }

    return domainLoads;
  }

  suggestRole(task, memberData) {
    // Based on member's current capacity and skills, suggest appropriate role
    const loadRatio = memberData.total / memberData.capacity;

    if (loadRatio < 0.3) {
      return 'executor'; // Has capacity to do the work
    } else if (loadRatio < 0.5) {
      return 'planner'; // Can help with planning
    } else {
      return 'reviewer'; // Light touch involvement
    }
  }

  calculateCoOwnershipConfidence(task, memberData) {
    let confidence = 0.5; // Base confidence

    // Increase confidence if member has experience with similar tasks
    if (memberData.domains.includes(this.identifyTaskDomain(task))) {
      confidence += 0.2;
    }

    // Increase confidence if member has low stress
    if (memberData.surveyInsights?.averageStress < 5) {
      confidence += 0.1;
    }

    // Increase confidence if member has available capacity
    const loadRatio = memberData.total / memberData.capacity;
    if (loadRatio < 0.4) {
      confidence += 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  async calculateRotationConfidence(familyId, domain, suggestedLead) {
    // Calculate confidence that this rotation will be successful
    let confidence = 0.6; // Base confidence

    // Check if suggested lead has handled this domain before
    const historyQuery = query(
      collection(db, 'domainRotationHistory'),
      where('familyId', '==', familyId),
      where('domain', '==', domain),
      where('lead', '==', suggestedLead)
    );

    const history = await getDocs(historyQuery);
    if (!history.empty) {
      confidence += 0.2; // Has experience

      // Check success rate
      let successCount = 0;
      history.forEach(doc => {
        if (doc.data().success) successCount++;
      });

      const successRate = successCount / history.size;
      confidence += successRate * 0.2;
    }

    return Math.min(confidence, 1.0);
  }

  async predictRotationBenefits(familyId, domain, currentLead, suggestedLead) {
    return {
      workloadReduction: '~20% for current lead',
      learningOpportunity: 'New skills for suggested lead',
      familyResilience: 'Increased backup capability',
      stressReduction: 'Distributed mental load'
    };
  }

  estimateNoticingWork(task) {
    // Estimate minutes spent noticing this need
    if (task.recurring) return 5; // Recurring tasks require less noticing
    if (task.priority === 'high') return 15; // High priority = more mental tracking
    return 10; // Default
  }

  estimateResearchWork(task) {
    const researchKeywords = ['find', 'research', 'compare', 'choose', 'select'];
    const taskText = `${task.title} ${task.description}`.toLowerCase();

    if (researchKeywords.some(keyword => taskText.includes(keyword))) {
      return 30; // Tasks requiring research
    }
    return 0;
  }

  estimatePlanningWork(task) {
    if (task.subtasks && task.subtasks.length > 0) {
      return task.subtasks.length * 5; // 5 mins per subtask
    }
    if (task.complexity === 'complex') return 20;
    return 5; // Default planning time
  }

  estimateCoordinationWork(task) {
    if (task.attendees && task.attendees.length > 1) {
      return task.attendees.length * 10; // 10 mins per person to coordinate
    }
    return 0;
  }

  estimateEmotionalWork(task) {
    const emotionalKeywords = ['comfort', 'support', 'help', 'care', 'worry'];
    const taskText = `${task.title} ${task.description}`.toLowerCase();

    if (emotionalKeywords.some(keyword => taskText.includes(keyword))) {
      return 15; // Tasks with emotional component
    }
    return 0;
  }

  async createWorkloadEntity(familyId, workloadData) {
    const entityId = this.generateQuantumId('workload_analysis', workloadData);

    const entity = {
      id: entityId,
      type: 'quantum_workload',
      properties: workloadData,
      quantumState: {
        state: workloadData.equalityScore > 70 ? 'balanced' : 'imbalanced',
        energy: workloadData.equalityScore / 100,
        potential: 1.0
      }
    };

    await this.createQuantumEntity(familyId, entity);

    // Create relationships to family members
    for (const memberId of Object.keys(workloadData.analysis)) {
      await this.createQuantumRelationship(familyId, entityId, memberId, 'measures_load_for');
    }

    return entityId;
  }
}

export default new EnhancedQuantumKG();