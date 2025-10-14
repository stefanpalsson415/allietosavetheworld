// Intelligent Distribution Service for Mental Load Redistribution
// Automatically suggests ownership and rotation for incoming tasks based on survey data and workload patterns

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
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import EnhancedQuantumKG from './EnhancedQuantumKG';
import { CoOwnershipHelpers } from '../models/CoOwnershipModels';
import ClaudeService from './ClaudeService';

/**
 * Intelligent Distribution Service
 * Analyzes incoming items and suggests optimal ownership based on:
 * - Current workload distribution
 * - Survey insights about who does what
 * - Historical patterns
 * - Domain expertise
 * - Rotation schedules
 */
class IntelligentDistributionService {
  constructor() {
    this.quantumKG = EnhancedQuantumKG;

    // Distribution strategies
    this.strategies = {
      ROTATE: 'rotate',           // Suggest rotation to underutilized member
      SHARE: 'share',            // Split between multiple owners
      DELEGATE: 'delegate',       // Assign to someone with capacity
      MENTOR: 'mentor',          // Pair experienced with learning member
      CONSENSUS: 'consensus',     // Require family decision
      MAINTAIN: 'maintain'        // Keep current assignment
    };

    // Domain patterns from survey questions
    this.domainPatterns = {
      medical: {
        keywords: ['doctor', 'appointment', 'medical', 'dentist', 'therapy', 'prescription', 'health'],
        surveyQuestions: ['medical_appointments', 'health_management', 'doctor_coordination'],
        defaultRotation: 'monthly'
      },
      meals: {
        keywords: ['meal', 'dinner', 'lunch', 'breakfast', 'grocery', 'cooking', 'food', 'recipe'],
        surveyQuestions: ['meal_planning', 'grocery_shopping', 'cooking_duties'],
        defaultRotation: 'weekly'
      },
      school: {
        keywords: ['school', 'homework', 'teacher', 'class', 'education', 'assignment', 'project'],
        surveyQuestions: ['school_coordination', 'homework_help', 'teacher_communication'],
        defaultRotation: 'biweekly'
      },
      activities: {
        keywords: ['sport', 'practice', 'game', 'activity', 'club', 'lesson', 'tournament'],
        surveyQuestions: ['activity_scheduling', 'practice_driving', 'equipment_management'],
        defaultRotation: 'monthly'
      },
      household: {
        keywords: ['clean', 'laundry', 'repair', 'maintenance', 'organize', 'chore', 'vacuum'],
        surveyQuestions: ['household_chores', 'home_maintenance', 'organization'],
        defaultRotation: 'weekly'
      },
      finances: {
        keywords: ['bill', 'payment', 'budget', 'expense', 'invoice', 'tax', 'insurance'],
        surveyQuestions: ['financial_management', 'bill_payment', 'budget_tracking'],
        defaultRotation: 'monthly'
      }
    };
  }

  /**
   * Main entry point: Analyze an incoming item and suggest distribution
   */
  async analyzeIncomingItem(familyId, item) {
    try {
      console.log('🧠 Analyzing incoming item for intelligent distribution:', item.title);

      // Step 1: Get current workload distribution
      const workloadAnalysis = await this.quantumKG.analyzeWorkloadDistribution(familyId);

      // Step 2: Identify the domain of this item
      const domain = this.identifyDomain(item);
      console.log(`📊 Identified domain: ${domain}`);

      // Step 3: Get survey insights about who typically handles this domain
      const domainOwnership = await this.getDomainOwnershipFromSurvey(familyId, domain);
      console.log('📋 Domain ownership from survey:', domainOwnership);

      // Step 4: Check for rotation opportunities
      const rotationAnalysis = await this.analyzeRotationOpportunity(
        familyId,
        domain,
        domainOwnership,
        workloadAnalysis
      );

      // Step 5: Generate distribution suggestion
      const suggestion = await this.generateDistributionSuggestion({
        familyId,
        item,
        domain,
        workloadAnalysis,
        domainOwnership,
        rotationAnalysis
      });

      // Step 6: Create co-ownership structure if suggested
      if (suggestion.strategy === this.strategies.SHARE) {
        suggestion.coOwnership = await this.createCoOwnershipStructure(
          item,
          suggestion.suggestedOwners,
          workloadAnalysis
        );
      }

      // Step 7: Add explanation based on survey data
      suggestion.explanation = await this.generateExplanation(
        suggestion,
        domainOwnership,
        workloadAnalysis
      );

      console.log('✅ Distribution suggestion:', suggestion);
      return suggestion;

    } catch (error) {
      console.error('Error analyzing incoming item:', error);
      return this.getFallbackSuggestion(item);
    }
  }

  /**
   * Identify which domain an item belongs to
   */
  identifyDomain(item) {
    const text = `${item.title || ''} ${item.description || ''} ${item.content || ''}`.toLowerCase();

    for (const [domain, config] of Object.entries(this.domainPatterns)) {
      const matchCount = config.keywords.filter(keyword => text.includes(keyword)).length;
      if (matchCount > 0) {
        return domain;
      }
    }

    return 'general';
  }

  /**
   * Get domain ownership patterns from survey responses
   */
  async getDomainOwnershipFromSurvey(familyId, domain) {
    try {
      const ownership = {
        primary: null,
        percentage: 0,
        participants: {},
        imbalance: false,
        interviewInsights: null
      };

      // Get family members
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      if (!familyDoc.exists()) return ownership;

      const familyData = familyDoc.data();
      const parents = familyData.parents || [];

      // STEP 1: Check interview insights first (most reliable data)
      const interviewInsights = await this.quantumKG.getInvisibleWorkPatterns(familyId);
      if (interviewInsights && interviewInsights.mentalLoadDistribution) {
        console.log('📝 Using interview insights for domain ownership:', interviewInsights.mentalLoadDistribution);

        // Use mental load distribution from invisible work discovery interview
        ownership.interviewInsights = interviewInsights;
        ownership.participants = interviewInsights.mentalLoadDistribution || {};

        // Find primary owner from interview data
        const entries = Object.entries(ownership.participants);
        if (entries.length > 0) {
          entries.sort((a, b) => b[1] - a[1]);
          ownership.primary = entries[0][0];
          ownership.percentage = entries[0][1];

          // Check for significant imbalance (>65% handled by one person)
          ownership.imbalance = ownership.percentage > 65;
        }
      }

      // Get survey responses related to this domain
      const domainConfig = this.domainPatterns[domain];
      if (!domainConfig) return ownership;

      // Query weekly check-ins for domain-related questions
      for (const parent of parents) {
        const userId = parent.id || parent.email;
        if (!userId) continue;

        // Get most recent check-in
        const checkInQuery = query(
          collection(db, 'weeklyCheckIns'),
          where('familyId', '==', familyId),
          where('userId', '==', userId)
        );

        const checkIns = await getDocs(checkInQuery);
        let totalScore = 0;
        let responseCount = 0;

        checkIns.forEach(doc => {
          const data = doc.data();
          if (data.responses) {
            // Look for domain-related responses
            domainConfig.surveyQuestions.forEach(questionPattern => {
              Object.entries(data.responses).forEach(([questionId, response]) => {
                if (questionId.includes(questionPattern)) {
                  totalScore += (typeof response === 'number' ? response : 0);
                  responseCount++;
                }
              });
            });
          }
        });

        if (responseCount > 0) {
          ownership.participants[userId] = {
            name: parent.name || parent.email,
            averageLoad: totalScore / responseCount,
            responseCount
          };
        }
      }

      // Calculate who does most of this domain's work
      const participants = Object.entries(ownership.participants);
      if (participants.length > 0) {
        // Sort by average load
        participants.sort((a, b) => b[1].averageLoad - a[1].averageLoad);

        const [primaryId, primaryData] = participants[0];
        ownership.primary = primaryId;

        // Calculate percentage if we have multiple participants
        if (participants.length > 1) {
          const totalLoad = participants.reduce((sum, [_, data]) => sum + data.averageLoad, 0);
          ownership.percentage = (primaryData.averageLoad / totalLoad) * 100;

          // Check for imbalance (one person doing >70% of the work)
          if (ownership.percentage > 70) {
            ownership.imbalance = true;
          }
        } else {
          ownership.percentage = 100;
          ownership.imbalance = true; // One person doing everything is an imbalance
        }
      }

      return ownership;

    } catch (error) {
      console.error('Error getting domain ownership from survey:', error);
      return {
        primary: null,
        percentage: 0,
        participants: {},
        imbalance: false
      };
    }
  }

  /**
   * Analyze if this is a good opportunity for rotation
   */
  async analyzeRotationOpportunity(familyId, domain, domainOwnership, workloadAnalysis) {
    const analysis = {
      shouldRotate: false,
      currentLead: domainOwnership.primary,
      suggestedLead: null,
      reason: null,
      confidence: 0
    };

    // Check if there's an imbalance that suggests rotation
    if (domainOwnership.imbalance && domainOwnership.primary) {
      // Find an underutilized member who could take this
      const currentLeadLoad = workloadAnalysis.workloadAnalysis[domainOwnership.primary];

      if (currentLeadLoad) {
        const currentUtilization = currentLeadLoad.total / currentLeadLoad.capacity;

        // If current lead is overloaded (>80% capacity)
        if (currentUtilization > 0.8) {
          // Find someone with capacity
          for (const [memberId, memberData] of Object.entries(workloadAnalysis.workloadAnalysis)) {
            if (memberId === domainOwnership.primary) continue;

            const utilization = memberData.total / memberData.capacity;

            // Found someone with <60% utilization
            if (utilization < 0.6) {
              analysis.shouldRotate = true;
              analysis.suggestedLead = memberId;
              analysis.reason = `${currentLeadLoad.name} handles ${Math.round(domainOwnership.percentage)}% of ${domain} tasks and is at ${Math.round(currentUtilization * 100)}% capacity. ${memberData.name} has availability at ${Math.round(utilization * 100)}% capacity.`;
              analysis.confidence = 0.8;
              break;
            }
          }
        }
      }
    }

    // Check for existing rotation schedule
    const rotationDoc = await getDoc(doc(db, 'domainRotations', `${familyId}_${domain}`));
    if (rotationDoc.exists()) {
      const rotation = rotationDoc.data();
      if (CoOwnershipHelpers.isRotationDue(rotation.rotation)) {
        analysis.shouldRotate = true;
        analysis.reason = 'Scheduled rotation is due';
        analysis.confidence = 1.0;
      }
    }

    return analysis;
  }

  /**
   * Generate the distribution suggestion
   */
  async generateDistributionSuggestion(context) {
    const { item, domain, workloadAnalysis, domainOwnership, rotationAnalysis } = context;

    const suggestion = {
      itemId: item.id,
      itemTitle: item.title,
      domain,
      strategy: this.strategies.MAINTAIN,
      suggestedOwners: [],
      confidence: 0.5,
      benefits: []
    };

    // Case 1: Rotation opportunity
    if (rotationAnalysis.shouldRotate && rotationAnalysis.suggestedLead) {
      suggestion.strategy = this.strategies.ROTATE;
      suggestion.suggestedOwners = [{
        userId: rotationAnalysis.suggestedLead,
        role: 'lead',
        contribution: 1.0
      }];
      suggestion.confidence = rotationAnalysis.confidence;
      suggestion.benefits = [
        'Reduces workload imbalance',
        'Provides learning opportunity',
        'Builds family resilience'
      ];
      return suggestion;
    }

    // Case 2: High complexity task - suggest sharing
    if (item.complexity === 'high' || item.estimatedTime > 120) {
      suggestion.strategy = this.strategies.SHARE;

      // Find 2-3 people to share the task
      const candidates = Object.entries(workloadAnalysis.workloadAnalysis)
        .filter(([id, data]) => (data.total / data.capacity) < 0.7)
        .sort((a, b) => (a[1].total / a[1].capacity) - (b[1].total / b[1].capacity))
        .slice(0, 3);

      if (candidates.length >= 2) {
        suggestion.suggestedOwners = candidates.map(([id, data], index) => ({
          userId: id,
          name: data.name,
          role: index === 0 ? 'lead' : 'support',
          contribution: index === 0 ? 0.6 : 0.2
        }));
        suggestion.confidence = 0.7;
        suggestion.benefits = [
          'Distributes complex work',
          'Enables knowledge sharing',
          'Reduces individual burden'
        ];
        return suggestion;
      }
    }

    // Case 3: Learning opportunity - suggest mentoring
    if (domain !== 'general' && domainOwnership.imbalance) {
      // Find someone who could learn this domain
      const learner = await this.findLearningCandidate(context.familyId, domain, workloadAnalysis);

      if (learner && domainOwnership.primary) {
        suggestion.strategy = this.strategies.MENTOR;
        suggestion.suggestedOwners = [
          {
            userId: domainOwnership.primary,
            role: 'mentor',
            contribution: 0.7
          },
          {
            userId: learner,
            role: 'learner',
            contribution: 0.3
          }
        ];
        suggestion.confidence = 0.6;
        suggestion.benefits = [
          'Builds domain expertise',
          'Gradual responsibility transfer',
          'Strengthens family capability'
        ];
        return suggestion;
      }
    }

    // Case 4: Important decision - suggest consensus
    if (item.category === 'decision' || item.importance === 'high') {
      suggestion.strategy = this.strategies.CONSENSUS;
      suggestion.suggestedOwners = Object.keys(workloadAnalysis.workloadAnalysis).map(userId => ({
        userId,
        role: 'voter',
        contribution: 1.0 / Object.keys(workloadAnalysis.workloadAnalysis).length
      }));
      suggestion.confidence = 0.9;
      suggestion.benefits = [
        'Democratic decision making',
        'Shared responsibility',
        'Family alignment'
      ];
      return suggestion;
    }

    // Default: Delegate to least loaded person
    const leastLoaded = Object.entries(workloadAnalysis.workloadAnalysis)
      .sort((a, b) => (a[1].total / a[1].capacity) - (b[1].total / b[1].capacity))[0];

    if (leastLoaded) {
      suggestion.strategy = this.strategies.DELEGATE;
      suggestion.suggestedOwners = [{
        userId: leastLoaded[0],
        name: leastLoaded[1].name,
        role: 'owner',
        contribution: 1.0
      }];
      suggestion.confidence = 0.5;
      suggestion.benefits = ['Balances workload'];
    }

    return suggestion;
  }

  /**
   * Create co-ownership structure for shared tasks
   */
  async createCoOwnershipStructure(item, suggestedOwners, workloadAnalysis) {
    const structure = {
      type: 'shared',
      stakeholders: [],
      rotation: {
        enabled: false,
        schedule: null,
        currentLead: null,
        nextRotation: null
      },
      mentalWork: {
        noticing: { who: null, duration: 10 },
        researching: { who: null, duration: 0 },
        planning: { who: null, duration: 15 },
        coordinating: { who: null, duration: 20 },
        emotionalSupport: { who: null, duration: 0 }
      }
    };

    // Assign stakeholders with detailed load breakdown
    for (const owner of suggestedOwners) {
      const memberData = workloadAnalysis.workloadAnalysis[owner.userId];

      structure.stakeholders.push({
        userId: owner.userId,
        name: owner.name || memberData?.name,
        role: owner.role,
        contribution: owner.contribution,
        cognitiveLoad: Math.round(owner.contribution * 30), // Minutes of mental work
        physicalLoad: Math.round(owner.contribution * (item.estimatedTime || 60)),
        emotionalLoad: owner.role === 'lead' ? 5 : 2,
        learningMode: owner.role === 'learner'
      });
    }

    // Assign mental work components
    const lead = suggestedOwners.find(o => o.role === 'lead' || o.role === 'mentor');
    if (lead) {
      structure.mentalWork.noticing.who = lead.userId;
      structure.mentalWork.planning.who = lead.userId;
      structure.mentalWork.coordinating.who = lead.userId;
    }

    const support = suggestedOwners.find(o => o.role === 'support' || o.role === 'learner');
    if (support) {
      structure.mentalWork.researching.who = support.userId;
    }

    return structure;
  }

  /**
   * Generate human-readable explanation for the suggestion
   */
  async generateExplanation(suggestion, domainOwnership, workloadAnalysis) {
    let explanation = '';

    switch (suggestion.strategy) {
      case this.strategies.ROTATE:
        const currentOwner = suggestion.suggestedOwners[0];
        const currentData = workloadAnalysis.workloadAnalysis[domainOwnership.primary];
        const newData = workloadAnalysis.workloadAnalysis[currentOwner.userId];

        explanation = `📊 Survey data shows ${currentData?.name || 'current owner'} handles ${Math.round(domainOwnership.percentage)}% of ${suggestion.domain} tasks. `;
        explanation += `They're at ${Math.round((currentData?.total / currentData?.capacity) * 100)}% capacity. `;
        explanation += `Suggesting ${newData?.name || 'another member'} takes this one - they're only at ${Math.round((newData?.total / newData?.capacity) * 100)}% capacity. `;
        explanation += `This helps balance the mental load! 🎯`;
        break;

      case this.strategies.SHARE:
        explanation = `🤝 This looks like a complex task that would benefit from collaboration. `;
        explanation += `Suggesting ${suggestion.suggestedOwners.length} people share ownership: `;
        explanation += suggestion.suggestedOwners.map(o => `${o.name || o.userId} (${o.role})`).join(', ');
        explanation += `. Working together reduces individual burden and builds shared knowledge.`;
        break;

      case this.strategies.MENTOR:
        const mentor = suggestion.suggestedOwners.find(o => o.role === 'mentor');
        const learner = suggestion.suggestedOwners.find(o => o.role === 'learner');
        explanation = `🎓 Great learning opportunity! ${mentor?.name || mentor?.userId} can mentor ${learner?.name || learner?.userId} on ${suggestion.domain} tasks. `;
        explanation += `This gradually builds expertise and creates backup capability for the family.`;
        break;

      case this.strategies.CONSENSUS:
        explanation = `🗳️ This appears to be an important decision that affects the whole family. `;
        explanation += `Suggesting everyone participates in making this decision together.`;
        break;

      case this.strategies.DELEGATE:
        const delegate = suggestion.suggestedOwners[0];
        explanation = `✅ Assigning to ${delegate?.name || delegate?.userId} who has the most available capacity. `;
        explanation += `This helps maintain balanced workload across the family.`;
        break;

      default:
        explanation = `Maintaining current assignment pattern.`;
    }

    return explanation;
  }

  /**
   * Find a family member who could learn a new domain
   */
  async findLearningCandidate(familyId, domain, workloadAnalysis) {
    // Find someone with <50% utilization who doesn't currently handle this domain
    for (const [memberId, data] of Object.entries(workloadAnalysis.workloadAnalysis)) {
      const utilization = data.total / data.capacity;

      if (utilization < 0.5 && !data.domains.includes(domain)) {
        return memberId;
      }
    }

    return null;
  }

  /**
   * Get fallback suggestion when analysis fails
   */
  getFallbackSuggestion(item) {
    return {
      itemId: item.id,
      itemTitle: item.title,
      domain: 'general',
      strategy: this.strategies.MAINTAIN,
      suggestedOwners: [],
      confidence: 0.1,
      benefits: [],
      explanation: 'Using default assignment. Survey data not available for intelligent distribution.'
    };
  }

  /**
   * Create a rotation schedule for a domain
   */
  async createDomainRotation(familyId, domain, participants, frequency = 'biweekly') {
    try {
      const rotationId = `${familyId}_${domain}`;

      const rotation = {
        familyId,
        domain,
        rotationPattern: {
          type: 'sequential',
          frequency,
          schedule: CoOwnershipHelpers.generateRotationSchedule(
            domain,
            participants,
            frequency,
            new Date()
          ),
          rules: {
            skipIfUnavailable: true,
            allowSwaps: true,
            requireHandoff: true,
            minExperience: 0
          }
        },
        currentState: {
          lead: participants[0],
          periodStart: new Date(),
          periodEnd: null,
          handoffCompleted: false,
          notes: 'Auto-created rotation based on survey insights'
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'domainRotations', rotationId), rotation);

      console.log(`✅ Created rotation schedule for ${domain}`);
      return rotation;

    } catch (error) {
      console.error('Error creating domain rotation:', error);
      throw error;
    }
  }

  /**
   * Update task with co-ownership structure
   */
  async applyDistributionSuggestion(familyId, taskId, suggestion) {
    try {
      const updates = {
        ownership: {
          type: suggestion.strategy === this.strategies.SHARE ? 'shared' : 'individual',
          stakeholders: suggestion.suggestedOwners.map(owner => ({
            ...owner,
            assignedAt: serverTimestamp()
          })),
          distributionStrategy: suggestion.strategy,
          distributionConfidence: suggestion.confidence
        },
        domain: suggestion.domain,
        updatedAt: serverTimestamp()
      };

      // Update the task
      await updateDoc(doc(db, 'kanbanTasks', taskId), updates);

      // Create quantum entity for this distribution
      await this.quantumKG.createEntity(familyId, {
        id: `distribution_${taskId}_${Date.now()}`,
        type: 'quantum_ownership',
        properties: {
          taskId,
          suggestion,
          appliedAt: new Date()
        }
      });

      console.log(`✅ Applied distribution suggestion to task ${taskId}`);
      return true;

    } catch (error) {
      console.error('Error applying distribution suggestion:', error);
      return false;
    }
  }

  /**
   * Get distribution suggestions for all pending inbox items
   */
  async analyzePendingInbox(familyId) {
    try {
      const suggestions = [];

      // Get unprocessed emails
      const emailQuery = query(
        collection(db, 'emailInbox'),
        where('familyId', '==', familyId),
        where('processed', '==', false)
      );

      const emails = await getDocs(emailQuery);

      for (const emailDoc of emails.docs) {
        const email = { id: emailDoc.id, ...emailDoc.data() };
        const suggestion = await this.analyzeIncomingItem(familyId, {
          id: email.id,
          title: email.subject,
          description: email.snippet,
          content: email.content,
          type: 'email'
        });
        suggestions.push(suggestion);
      }

      // Get unprocessed SMS
      const smsQuery = query(
        collection(db, 'smsInbox'),
        where('familyId', '==', familyId),
        where('processed', '==', false)
      );

      const smsMessages = await getDocs(smsQuery);

      for (const smsDoc of smsMessages.docs) {
        const sms = { id: smsDoc.id, ...smsDoc.data() };
        const suggestion = await this.analyzeIncomingItem(familyId, {
          id: sms.id,
          title: `SMS from ${sms.from}`,
          description: sms.body,
          type: 'sms'
        });
        suggestions.push(suggestion);
      }

      return suggestions;

    } catch (error) {
      console.error('Error analyzing pending inbox:', error);
      return [];
    }
  }
}

export default new IntelligentDistributionService();