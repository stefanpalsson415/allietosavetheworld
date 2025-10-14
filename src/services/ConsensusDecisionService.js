// Consensus Decision Service for Democratic Family Governance
// Implements voting, consensus building, and decision tracking

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
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import NotificationService from './NotificationService';
import EnhancedQuantumKG from './EnhancedQuantumKG';
import ClaudeService from './ClaudeService';

/**
 * Consensus Decision Service
 * Manages family decision-making through voting and consensus
 */
class ConsensusDecisionService {
  constructor() {
    this.quantumKG = EnhancedQuantumKG;

    // Decision categories and their default thresholds
    this.decisionCategories = {
      financial: {
        name: 'Financial Decisions',
        requiredThreshold: 0.66, // 2/3 majority
        requiresAllParents: true,
        minimumDeliberation: 24, // hours
        examples: ['Major purchases', 'Budget changes', 'Investment decisions']
      },
      schedule: {
        name: 'Schedule Changes',
        requiredThreshold: 0.5, // Simple majority
        requiresAllParents: false,
        minimumDeliberation: 12,
        examples: ['Vacation planning', 'Activity enrollment', 'Schedule conflicts']
      },
      household: {
        name: 'Household Rules',
        requiredThreshold: 0.75, // 3/4 majority
        requiresAllParents: true,
        minimumDeliberation: 48,
        examples: ['Chore systems', 'House rules', 'Major changes']
      },
      children: {
        name: 'Children\'s Activities',
        requiredThreshold: 0.5,
        requiresAllParents: true,
        minimumDeliberation: 24,
        examples: ['School choice', 'Extracurriculars', 'Health decisions']
      },
      emergency: {
        name: 'Emergency Decisions',
        requiredThreshold: 0.5,
        requiresAllParents: false,
        minimumDeliberation: 0, // Immediate
        examples: ['Urgent medical', 'Safety issues', 'Time-sensitive matters']
      }
    };

    // Voting options
    this.voteOptions = {
      YES: 'yes',
      NO: 'no',
      ABSTAIN: 'abstain',
      PENDING: 'pending'
    };

    // Decision status
    this.decisionStatus = {
      PENDING: 'pending',
      DELIBERATING: 'deliberating',
      VOTING: 'voting',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      TABLED: 'tabled',
      IMPLEMENTED: 'implemented'
    };
  }

  /**
   * Create a new decision for family consensus
   */
  async createDecision(familyId, decision) {
    try {
      // Get family members
      const familyDoc = await getDoc(doc(db, 'families', familyId));
      if (!familyDoc.exists()) {
        throw new Error('Family not found');
      }

      const familyData = familyDoc.data();
      const parents = familyData.parents || [];
      const children = familyData.children || [];

      // Determine required participants based on category
      const category = this.decisionCategories[decision.category] ||
                      this.decisionCategories.household;

      let requiredParticipants = [];
      let eligibleVoters = [];

      // Add parents as required participants if needed
      if (category.requiresAllParents) {
        requiredParticipants = parents.map(p => p.id || p.email);
        eligibleVoters = [...requiredParticipants];
      } else {
        eligibleVoters = parents.map(p => p.id || p.email);
      }

      // Add older children for certain decisions (age 13+)
      const eligibleChildren = children.filter(child => {
        if (!child.birthDate) return false;
        const age = this.calculateAge(child.birthDate);
        return age >= 13 && decision.category !== 'financial';
      });

      eligibleVoters.push(...eligibleChildren.map(c => c.id));

      // Create decision document
      const decisionDoc = {
        familyId,
        title: decision.title,
        description: decision.description,
        category: decision.category,
        status: this.decisionStatus.DELIBERATING,
        initiatedBy: decision.initiatedBy,
        initiatedAt: serverTimestamp(),

        consensusRules: {
          requiredThreshold: decision.customThreshold || category.requiredThreshold,
          requiredParticipants,
          eligibleVoters,
          minimumParticipation: Math.max(2, Math.ceil(eligibleVoters.length * 0.5)),
          deadline: this.calculateDeadline(category.minimumDeliberation),
          minimumDeliberation: category.minimumDeliberation
        },

        votes: this.initializeVotes(eligibleVoters),

        discussion: {
          thread: [],
          pros: [],
          cons: [],
          alternatives: []
        },

        outcome: {
          approved: null,
          approvedAt: null,
          implementedAt: null,
          notes: null
        },

        metadata: {
          importance: decision.importance || 'medium',
          urgency: decision.urgency || 'normal',
          estimatedImpact: decision.estimatedImpact || 'moderate',
          affectedMembers: decision.affectedMembers || eligibleVoters
        }
      };

      const decisionRef = await addDoc(collection(db, 'decisions'), decisionDoc);

      // Create quantum entity
      await this.quantumKG.createEntity(familyId, {
        id: decisionRef.id,
        type: 'quantum_consensus',
        properties: decisionDoc
      });

      // Notify all eligible voters
      await this.notifyVoters(familyId, eligibleVoters, {
        decisionId: decisionRef.id,
        title: decision.title,
        category: decision.category,
        deadline: decisionDoc.consensusRules.deadline
      });

      // Schedule deliberation period end
      if (category.minimumDeliberation > 0) {
        await this.scheduleVotingPeriod(decisionRef.id, category.minimumDeliberation);
      } else {
        // Emergency decision - open voting immediately
        await this.openVoting(decisionRef.id);
      }

      console.log(`✅ Created decision: ${decision.title}`);
      return { id: decisionRef.id, ...decisionDoc };

    } catch (error) {
      console.error('Error creating decision:', error);
      throw error;
    }
  }

  /**
   * Cast a vote on a decision
   */
  async castVote(decisionId, userId, vote, comment = '') {
    try {
      const decisionDoc = await getDoc(doc(db, 'decisions', decisionId));
      if (!decisionDoc.exists()) {
        throw new Error('Decision not found');
      }

      const decision = decisionDoc.data();

      // Validate voter eligibility
      if (!decision.consensusRules.eligibleVoters.includes(userId)) {
        throw new Error('User not eligible to vote on this decision');
      }

      // Check if voting is open
      if (decision.status !== this.decisionStatus.VOTING &&
          decision.status !== this.decisionStatus.DELIBERATING) {
        throw new Error('Voting is not open for this decision');
      }

      // Update vote
      const voteUpdate = {
        [`votes.${userId}`]: {
          vote,
          timestamp: serverTimestamp(),
          comment,
          notifiedAt: decision.votes[userId]?.notifiedAt || new Date()
        }
      };

      await updateDoc(doc(db, 'decisions', decisionId), voteUpdate);

      // Add comment to discussion if provided
      if (comment) {
        await this.addDiscussionComment(decisionId, userId, comment, vote);
      }

      // Check if we have enough votes to make a decision
      const updatedDecision = await this.checkConsensus(decisionId);

      console.log(`✅ Vote cast: ${userId} voted ${vote} on ${decisionId}`);
      return updatedDecision;

    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  }

  /**
   * Add a comment to decision discussion
   */
  async addDiscussionComment(decisionId, userId, comment, sentiment = 'neutral') {
    try {
      const discussionEntry = {
        userId,
        comment,
        sentiment,
        timestamp: serverTimestamp()
      };

      await updateDoc(doc(db, 'decisions', decisionId), {
        'discussion.thread': arrayUnion(discussionEntry)
      });

      // Use AI to categorize as pro/con if applicable
      if (sentiment === 'yes' || sentiment === 'no') {
        const category = sentiment === 'yes' ? 'pros' : 'cons';
        await updateDoc(doc(db, 'decisions', decisionId), {
          [`discussion.${category}`]: arrayUnion(comment)
        });
      }

      return true;

    } catch (error) {
      console.error('Error adding discussion comment:', error);
      throw error;
    }
  }

  /**
   * Check if consensus has been reached
   */
  async checkConsensus(decisionId) {
    try {
      const decisionDoc = await getDoc(doc(db, 'decisions', decisionId));
      if (!decisionDoc.exists()) {
        throw new Error('Decision not found');
      }

      const decision = decisionDoc.data();
      const votes = Object.values(decision.votes);

      // Count votes
      const voteCount = {
        yes: votes.filter(v => v.vote === this.voteOptions.YES).length,
        no: votes.filter(v => v.vote === this.voteOptions.NO).length,
        abstain: votes.filter(v => v.vote === this.voteOptions.ABSTAIN).length,
        pending: votes.filter(v => v.vote === this.voteOptions.PENDING).length
      };

      const totalVoted = voteCount.yes + voteCount.no + voteCount.abstain;

      // Check minimum participation
      if (totalVoted < decision.consensusRules.minimumParticipation) {
        console.log('Not enough participation yet:', totalVoted, '<', decision.consensusRules.minimumParticipation);
        return decision;
      }

      // Check required participants have voted
      const requiredVoted = decision.consensusRules.requiredParticipants.every(
        userId => decision.votes[userId]?.vote !== this.voteOptions.PENDING
      );

      if (!requiredVoted) {
        console.log('Required participants have not all voted');
        return decision;
      }

      // Calculate approval rate (excluding abstentions from denominator)
      const effectiveVotes = voteCount.yes + voteCount.no;
      const approvalRate = effectiveVotes > 0 ? voteCount.yes / effectiveVotes : 0;

      // Determine outcome
      let newStatus = decision.status;
      let approved = null;

      if (approvalRate >= decision.consensusRules.requiredThreshold) {
        newStatus = this.decisionStatus.APPROVED;
        approved = true;
      } else if (voteCount.pending === 0) {
        // All votes are in and threshold not met
        newStatus = this.decisionStatus.REJECTED;
        approved = false;
      }

      // Update decision if status changed
      if (newStatus !== decision.status) {
        const updates = {
          status: newStatus,
          'outcome.approved': approved,
          'outcome.approvedAt': approved !== null ? serverTimestamp() : null,
          'outcome.voteCount': voteCount,
          'outcome.approvalRate': approvalRate
        };

        await updateDoc(doc(db, 'decisions', decisionId), updates);

        // Notify participants of outcome
        if (approved !== null) {
          await this.notifyOutcome(decision.familyId, decisionId, approved, voteCount);
        }

        // If approved, create implementation tasks
        if (approved) {
          await this.createImplementationTasks(decision);
        }

        return { ...decision, ...updates };
      }

      return decision;

    } catch (error) {
      console.error('Error checking consensus:', error);
      throw error;
    }
  }

  /**
   * Open voting period after deliberation
   */
  async openVoting(decisionId) {
    try {
      await updateDoc(doc(db, 'decisions', decisionId), {
        status: this.decisionStatus.VOTING,
        votingOpenedAt: serverTimestamp()
      });

      // Notify all voters that voting is open
      const decisionDoc = await getDoc(doc(db, 'decisions', decisionId));
      const decision = decisionDoc.data();

      await this.notifyVoters(decision.familyId, decision.consensusRules.eligibleVoters, {
        decisionId,
        title: decision.title,
        message: 'Voting is now open',
        action: 'cast_vote'
      });

      console.log(`✅ Opened voting for decision: ${decisionId}`);
      return true;

    } catch (error) {
      console.error('Error opening voting:', error);
      throw error;
    }
  }

  /**
   * Table a decision for later consideration
   */
  async tableDecision(decisionId, reason = '') {
    try {
      await updateDoc(doc(db, 'decisions', decisionId), {
        status: this.decisionStatus.TABLED,
        'outcome.tabledAt': serverTimestamp(),
        'outcome.tabledReason': reason
      });

      console.log(`✅ Tabled decision: ${decisionId}`);
      return true;

    } catch (error) {
      console.error('Error tabling decision:', error);
      throw error;
    }
  }

  /**
   * Get AI suggestions for a decision
   */
  async getAISuggestions(decisionId) {
    try {
      const decisionDoc = await getDoc(doc(db, 'decisions', decisionId));
      if (!decisionDoc.exists()) {
        throw new Error('Decision not found');
      }

      const decision = decisionDoc.data();

      // Ask Claude for insights
      const prompt = `
        Our family needs to make a decision about: "${decision.title}"

        Description: ${decision.description}
        Category: ${decision.category}

        Current discussion points:
        Pros: ${decision.discussion.pros.join(', ')}
        Cons: ${decision.discussion.cons.join(', ')}

        Please provide:
        1. Key considerations we might be missing
        2. Potential unintended consequences
        3. Alternative solutions we haven't considered
        4. A balanced recommendation
      `;

      const response = await ClaudeService.sendMessage(prompt, null, decision.familyId);

      // Parse and structure the AI suggestions
      const suggestions = {
        considerations: [],
        consequences: [],
        alternatives: [],
        recommendation: '',
        generatedAt: new Date()
      };

      // Extract structured suggestions from Claude's response
      // This is a simplified extraction - you might want more sophisticated parsing
      suggestions.recommendation = response;

      // Save suggestions
      await updateDoc(doc(db, 'decisions', decisionId), {
        'aiSuggestions': suggestions
      });

      console.log(`✅ Generated AI suggestions for decision: ${decisionId}`);
      return suggestions;

    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      throw error;
    }
  }

  /**
   * Get pending decisions for a user
   */
  async getPendingDecisions(familyId, userId) {
    try {
      const decisionsQuery = query(
        collection(db, 'decisions'),
        where('familyId', '==', familyId),
        where('consensusRules.eligibleVoters', 'array-contains', userId)
      );

      const decisions = await getDocs(decisionsQuery);
      const pendingDecisions = [];

      decisions.forEach(doc => {
        const data = doc.data();
        // Check if user hasn't voted yet
        if (data.votes[userId]?.vote === this.voteOptions.PENDING) {
          pendingDecisions.push({
            id: doc.id,
            ...data
          });
        }
      });

      return pendingDecisions;

    } catch (error) {
      console.error('Error getting pending decisions:', error);
      return [];
    }
  }

  /**
   * Get decision history
   */
  async getDecisionHistory(familyId, limit = 10) {
    try {
      const decisionsQuery = query(
        collection(db, 'decisions'),
        where('familyId', '==', familyId),
        where('status', 'in', [
          this.decisionStatus.APPROVED,
          this.decisionStatus.REJECTED,
          this.decisionStatus.IMPLEMENTED
        ])
      );

      const decisions = await getDocs(decisionsQuery);
      return decisions.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.initiatedAt - a.initiatedAt)
        .slice(0, limit);

    } catch (error) {
      console.error('Error getting decision history:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */

  initializeVotes(eligibleVoters) {
    const votes = {};
    eligibleVoters.forEach(userId => {
      votes[userId] = {
        vote: this.voteOptions.PENDING,
        timestamp: null,
        comment: '',
        notifiedAt: new Date()
      };
    });
    return votes;
  }

  calculateDeadline(hoursFromNow) {
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hoursFromNow);
    return deadline;
  }

  calculateAge(birthDate) {
    const birth = birthDate.toDate ? birthDate.toDate() : new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  async scheduleVotingPeriod(decisionId, deliberationHours) {
    // This would integrate with your scheduling system
    // For now, we'll set a timeout (in production, use a proper job scheduler)
    setTimeout(() => {
      this.openVoting(decisionId);
    }, deliberationHours * 60 * 60 * 1000);
  }

  async notifyVoters(familyId, voterIds, notificationData) {
    const notifications = voterIds.map(userId =>
      NotificationService.sendNotification(userId, {
        title: `Decision Required: ${notificationData.title}`,
        body: notificationData.message || `Your input is needed on a family decision`,
        data: notificationData
      })
    );

    await Promise.all(notifications);
  }

  async notifyOutcome(familyId, decisionId, approved, voteCount) {
    const status = approved ? 'approved' : 'rejected';
    const message = `Decision ${status}: Yes(${voteCount.yes}), No(${voteCount.no}), Abstain(${voteCount.abstain})`;

    // Get all participants
    const decisionDoc = await getDoc(doc(db, 'decisions', decisionId));
    const decision = decisionDoc.data();

    const notifications = decision.consensusRules.eligibleVoters.map(userId =>
      NotificationService.sendNotification(userId, {
        title: `Decision ${status}`,
        body: message,
        data: { decisionId, outcome: status }
      })
    );

    await Promise.all(notifications);
  }

  async createImplementationTasks(decision) {
    // This would create tasks in the Kanban system
    // For now, we'll create a placeholder
    console.log(`Creating implementation tasks for approved decision: ${decision.title}`);

    // You could integrate with the task system here
    // Example: await TaskService.createTask({ ... });
  }
}

export default new ConsensusDecisionService();