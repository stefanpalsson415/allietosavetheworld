// Co-Ownership Data Models for Mental Load Redistribution
// This file defines the core data structures for shared ownership, rotation, and consensus

/**
 * Shared Ownership Model
 * Enables multiple stakeholders to co-own tasks with defined roles and contributions
 */
export const SharedOwnershipSchema = {
  type: 'shared', // 'shared' | 'rotating' | 'individual'

  stakeholders: [
    {
      userId: String,
      name: String,
      role: String, // 'planner' | 'executor' | 'reviewer' | 'coordinator'
      contribution: Number, // 0-1 representing percentage
      cognitiveLoad: Number, // minutes of mental work
      physicalLoad: Number, // minutes of physical work
      emotionalLoad: Number, // 1-10 scale of emotional labor
      learningMode: Boolean // if true, this is a teaching opportunity
    }
  ],

  rotation: {
    enabled: Boolean,
    schedule: String, // 'daily' | 'weekly' | 'biweekly' | 'monthly'
    currentLead: String, // userId of current rotation lead
    nextRotation: Date,
    history: [
      {
        lead: String,
        startDate: Date,
        endDate: Date,
        success: Boolean,
        notes: String
      }
    ]
  }
};

/**
 * Consensus Decision Model
 * Tracks collaborative decision-making for family governance
 */
export const ConsensusDecisionSchema = {
  id: String,
  description: String,
  category: String, // 'financial' | 'schedule' | 'household' | 'children'
  status: String, // 'pending' | 'approved' | 'rejected' | 'tabled'
  initiatedBy: String,
  initiatedAt: Date,

  consensusRules: {
    requiredThreshold: Number, // 0.5 = majority, 0.66 = 2/3, 1.0 = unanimous
    requiredParticipants: [String], // specific userIds who must participate
    deadline: Date,
    minimumParticipation: Number // minimum number of votes needed
  },

  votes: [{
    userId: String,
    vote: String, // 'yes' | 'no' | 'abstain' | 'pending'
    timestamp: Date,
    comment: String,
    notifiedAt: Date
  }],

  outcome: {
    approved: Boolean,
    approvedAt: Date,
    implementedAt: Date,
    notes: String
  }
};

/**
 * Mental Work Tracking Model
 * Captures the invisible cognitive and emotional labor
 */
export const MentalWorkSchema = {
  noticing: {
    who: String,
    when: Date,
    duration: Number, // minutes
    description: String // "Noticed we're low on milk"
  },

  researching: {
    who: String,
    when: Date,
    duration: Number,
    sources: [String], // URLs, contacts consulted
    findings: String
  },

  planning: {
    who: String,
    when: Date,
    duration: Number,
    decisionsMode: [String],
    alternativesConsidered: Number
  },

  coordinating: {
    who: String,
    when: Date,
    duration: Number,
    peopleCoordinated: [String],
    conflictsResolved: Number
  },

  emotionalSupport: {
    who: String,
    when: Date,
    intensity: Number, // 1-10 scale
    description: String
  }
};

/**
 * Domain Rotation Model
 * Defines how household domains rotate between family members
 */
export const DomainRotationSchema = {
  domain: String, // 'meals' | 'medical' | 'school' | 'finances' | 'activities'

  rotationPattern: {
    type: String, // 'sequential' | 'alternating' | 'skillBased' | 'availability'
    frequency: String, // 'weekly' | 'biweekly' | 'monthly'

    schedule: [
      {
        period: Number,
        lead: String, // userId
        support: String, // optional support person
        startDate: Date,
        endDate: Date
      }
    ],

    rules: {
      skipIfUnavailable: Boolean,
      allowSwaps: Boolean,
      requireHandoff: Boolean, // formal handoff meeting required
      minExperience: Number // minimum times handled before solo lead
    }
  },

  currentState: {
    lead: String,
    periodStart: Date,
    periodEnd: Date,
    handoffCompleted: Boolean,
    notes: String
  },

  performance: {
    averageStressLevel: Number, // 1-10 across all rotations
    successRate: Number, // percentage of successful rotations
    commonChallenges: [String],
    improvements: [String]
  }
};

/**
 * Workload Balance Model
 * Tracks overall family member workload across all dimensions
 */
export const WorkloadBalanceSchema = {
  familyId: String,
  timestamp: Date,

  members: [{
    userId: String,
    name: String,

    currentLoad: {
      cognitive: Number, // hours per week
      physical: Number,
      emotional: Number,
      total: Number
    },

      capacity: {
        available: Number, // hours available per week
        utilized: Number, // percentage utilized
        stressLevel: Number // 1-10
      },

    domains: [{
      domainName: String,
      hoursPerWeek: Number,
      isLead: Boolean,
      rotationDue: Date
    }],

    recentTasks: {
      assigned: Number,
      completed: Number,
      shared: Number,
      rotated: Number
    }
  }],

  balance: {
    equalityScore: Number, // 0-100, 100 being perfectly equal
    cognitiveImbalance: Number, // standard deviation
    suggestions: [String], // AI-generated rebalancing suggestions
    lastRebalanced: Date
  }
};

/**
 * Enhanced Task Model with Co-Ownership
 * Extends existing task model with shared ownership capabilities
 */
export const EnhancedTaskSchema = {
  // Existing fields maintained for backward compatibility
  id: String,
  title: String,
  description: String,
  assignedTo: String, // DEPRECATED - kept for migration

  // New co-ownership fields
  ownership: SharedOwnershipSchema,
  decisions: [ConsensusDecisionSchema],
  mentalWork: MentalWorkSchema,

  // Task metadata
  category: String,
  domain: String, // links to domain rotation
  urgency: String, // 'low' | 'medium' | 'high' | 'urgent'
  complexity: String, // 'simple' | 'moderate' | 'complex'
  estimatedTime: Number, // total minutes

  // Collaboration features
  sharedNotes: [
    {
      author: String,
      timestamp: Date,
      content: String,
      type: String // 'update' | 'question' | 'decision' | 'handoff'
    }
  ],

  handoff: {
    required: Boolean,
    from: String,
    to: String,
    scheduledDate: Date,
    completed: Boolean,
    notes: String
  },

  // Learning and development
  learningOpportunity: {
    enabled: Boolean,
    learner: String,
    mentor: String,
    skills: [String],
    progressNotes: String
  },

  // Success tracking
  outcome: {
    completed: Boolean,
    completedBy: [String], // can be multiple for shared tasks
    completedAt: Date,
    quality: Number, // 1-5 rating
    lessonsLearned: String,
    wouldRotateAgain: Boolean
  }
};

/**
 * Family Governance Model
 * Defines how the family makes decisions and manages responsibilities
 */
export const FamilyGovernanceSchema = {
  familyId: String,

  model: String, // 'democratic' | 'consensus' | 'rotating_lead' | 'collaborative'

  votingRules: [{
    category: String,
    threshold: Number, // required approval percentage
    requiredMembers: [String], // who must participate
    vetoRights: [String], // who can veto
    discussionRequired: Boolean,
    minimumDeliberation: Number // hours before vote
  }],

  rotationDomains: [
    {
      name: String,
      schedule: String,
      currentLead: String,
      participants: [String], // who participates in this rotation
      optOut: [String] // temporarily opted out members
    }
  ],

  meetings: {
    regular: {
      frequency: String, // 'weekly' | 'biweekly' | 'monthly'
      dayOfWeek: Number,
      time: String,
      duration: Number,
      mandatory: Boolean
    },

    adhoc: {
      triggerThreshold: Number, // number of pending decisions
      minimumNotice: Number // hours
    }
  },

  constitution: {
    values: [String], // family values
    principles: [String], // operating principles
    rules: [
      {
        rule: String,
        category: String,
        consequences: String,
        exceptions: [String]
      }
    ],
    lastUpdated: Date,
    amendmentProcess: ConsensusDecisionSchema
  }
};

// Helper functions for working with co-ownership models

export const CoOwnershipHelpers = {
  /**
   * Calculate total contribution percentage for validation
   */
  validateContributions(stakeholders) {
    const total = stakeholders.reduce((sum, s) => sum + s.contribution, 0);
    return Math.abs(total - 1.0) < 0.01; // Allow for floating point errors
  },

  /**
   * Determine if rotation is due
   */
  isRotationDue(rotation) {
    return rotation.enabled && new Date() >= new Date(rotation.nextRotation);
  },

  /**
   * Calculate consensus status
   */
  getConsensusStatus(decision) {
    const votes = Object.values(decision.votes);
    const yesVotes = votes.filter(v => v.vote === 'yes').length;
    const totalVotes = votes.filter(v => v.vote !== 'pending').length;

    if (totalVotes < decision.consensusRules.minimumParticipation) {
      return 'insufficient_participation';
    }

    const approvalRate = yesVotes / totalVotes;
    return approvalRate >= decision.consensusRules.requiredThreshold ?
      'approved' : 'not_approved';
  },

  /**
   * Calculate workload equality score (0-100)
   */
  calculateEqualityScore(workloadBalance) {
    const loads = Object.values(workloadBalance.members)
      .map(m => m.currentLoad.total);

    const mean = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((sum, load) =>
      sum + Math.pow(load - mean, 2), 0) / loads.length;
    const stdDev = Math.sqrt(variance);

    // Convert to 0-100 score (lower std dev = higher score)
    const maxAcceptableStdDev = mean * 0.5; // 50% deviation is score of 0
    const score = Math.max(0, 100 - (stdDev / maxAcceptableStdDev * 100));

    return Math.round(score);
  },

  /**
   * Generate rotation schedule
   */
  generateRotationSchedule(domain, participants, frequency, startDate) {
    const schedule = [];
    const frequencyDays = {
      'daily': 1,
      'weekly': 7,
      'biweekly': 14,
      'monthly': 30
    };

    const daysBetween = frequencyDays[frequency];
    let currentDate = new Date(startDate);

    for (let period = 0; period < 12; period++) { // Generate 12 periods ahead
      const participant = participants[period % participants.length];
      const endDate = new Date(currentDate);
      endDate.setDate(endDate.getDate() + daysBetween - 1);

      schedule.push({
        period,
        lead: participant,
        support: participants[(period + 1) % participants.length],
        startDate: new Date(currentDate),
        endDate: endDate
      });

      currentDate.setDate(currentDate.getDate() + daysBetween);
    }

    return schedule;
  }
};

export default {
  SharedOwnershipSchema,
  ConsensusDecisionSchema,
  MentalWorkSchema,
  DomainRotationSchema,
  WorkloadBalanceSchema,
  EnhancedTaskSchema,
  FamilyGovernanceSchema,
  CoOwnershipHelpers
};