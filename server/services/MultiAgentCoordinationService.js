/**
 * Phase 6: Multi-Agent Coordination Service
 *
 * This service coordinates between multiple family members' AI agents:
 * - Conflict resolution between competing requests
 * - Workload balancing across family members
 * - Preference coordination and compromise finding
 * - Resource allocation and scheduling optimization
 */

const admin = require('firebase-admin');

class MultiAgentCoordinationService {
  constructor(config) {
    this.db = admin.firestore();
    this.config = config;

    // Coordination thresholds
    this.CONFLICT_DETECTION_THRESHOLD = 0.7;
    this.WORKLOAD_BALANCE_THRESHOLD = 0.3;
    this.PREFERENCE_WEIGHT_THRESHOLD = 0.6;

    // Conflict types
    this.CONFLICT_TYPES = {
      SCHEDULING: 'scheduling_conflict',
      RESOURCE: 'resource_conflict',
      PREFERENCE: 'preference_conflict',
      WORKLOAD: 'workload_conflict',
      PRIORITY: 'priority_conflict'
    };

    // Resolution strategies
    this.RESOLUTION_STRATEGIES = {
      COMPROMISE: 'compromise',
      PRIORITY_BASED: 'priority_based',
      ROTATION: 'rotation',
      NEGOTIATION: 'negotiation',
      ESCALATION: 'escalation'
    };
  }

  /**
   * Coordinate multiple agent requests from family members
   */
  async coordinateAgentRequests(familyId, requests) {
    try {
      console.log(`🤝 Coordinating ${requests.length} agent requests for family: ${familyId}`);

      // Analyze requests for conflicts
      const conflicts = await this.detectConflicts(requests);

      // Generate resolution strategies
      const resolutions = await this.generateResolutions(conflicts, familyId);

      // Apply workload balancing
      const balancedRequests = await this.balanceWorkload(requests, familyId);

      // Create coordination plan
      const coordinationPlan = await this.createCoordinationPlan(
        balancedRequests,
        resolutions,
        familyId
      );

      // Store coordination session
      await this.storeCoordinationSession(familyId, {
        requests,
        conflicts,
        resolutions,
        plan: coordinationPlan
      });

      return {
        originalRequests: requests,
        conflicts,
        resolutions,
        coordinatedPlan: coordinationPlan,
        success: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Agent coordination failed:', error);
      return {
        success: false,
        error: error.message,
        fallbackPlan: await this.createFallbackPlan(requests)
      };
    }
  }

  /**
   * Detect conflicts between multiple agent requests
   */
  async detectConflicts(requests) {
    const conflicts = [];

    // Check for scheduling conflicts
    const schedulingConflicts = await this.detectSchedulingConflicts(requests);
    conflicts.push(...schedulingConflicts);

    // Check for resource conflicts
    const resourceConflicts = await this.detectResourceConflicts(requests);
    conflicts.push(...resourceConflicts);

    // Check for preference conflicts
    const preferenceConflicts = await this.detectPreferenceConflicts(requests);
    conflicts.push(...preferenceConflicts);

    // Check for workload conflicts
    const workloadConflicts = await this.detectWorkloadConflicts(requests);
    conflicts.push(...workloadConflicts);

    return conflicts;
  }

  /**
   * Detect scheduling conflicts between requests
   */
  async detectSchedulingConflicts(requests) {
    const conflicts = [];
    const timeSlots = new Map();

    // Group requests by time slots
    requests.forEach((request, index) => {
      if (request.scheduledTime) {
        const timeSlot = this.normalizeTimeSlot(request.scheduledTime);
        if (!timeSlots.has(timeSlot)) {
          timeSlots.set(timeSlot, []);
        }
        timeSlots.get(timeSlot).push({ ...request, originalIndex: index });
      }
    });

    // Find overlapping time slots
    for (const [timeSlot, slotRequests] of timeSlots) {
      if (slotRequests.length > 1) {
        conflicts.push({
          type: this.CONFLICT_TYPES.SCHEDULING,
          timeSlot,
          conflictingRequests: slotRequests,
          severity: this.calculateConflictSeverity(slotRequests),
          description: `${slotRequests.length} requests scheduled for ${timeSlot}`,
          affectedUsers: slotRequests.map(r => r.userId)
        });
      }
    }

    return conflicts;
  }

  /**
   * Detect resource conflicts between requests
   */
  async detectResourceConflicts(requests) {
    const conflicts = [];
    const resourceRequests = new Map();

    // Group requests by required resources
    requests.forEach((request, index) => {
      if (request.requiredResources) {
        request.requiredResources.forEach(resource => {
          if (!resourceRequests.has(resource)) {
            resourceRequests.set(resource, []);
          }
          resourceRequests.get(resource).push({ ...request, originalIndex: index });
        });
      }
    });

    // Find resource conflicts
    for (const [resource, resourceUsers] of resourceRequests) {
      if (resourceUsers.length > 1) {
        // Check if requests overlap in time
        const overlappingRequests = this.findTimeOverlaps(resourceUsers);
        if (overlappingRequests.length > 1) {
          conflicts.push({
            type: this.CONFLICT_TYPES.RESOURCE,
            resource,
            conflictingRequests: overlappingRequests,
            severity: this.calculateConflictSeverity(overlappingRequests),
            description: `Multiple users need ${resource} at the same time`,
            affectedUsers: overlappingRequests.map(r => r.userId)
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect preference conflicts between family members
   */
  async detectPreferenceConflicts(requests) {
    const conflicts = [];
    const preferenceGroups = new Map();

    // Group requests by preference domains
    requests.forEach((request, index) => {
      if (request.preferences) {
        Object.keys(request.preferences).forEach(prefType => {
          if (!preferenceGroups.has(prefType)) {
            preferenceGroups.set(prefType, []);
          }
          preferenceGroups.get(prefType).push({
            ...request,
            originalIndex: index,
            preferenceValue: request.preferences[prefType]
          });
        });
      }
    });

    // Find conflicting preferences
    for (const [prefType, prefRequests] of preferenceGroups) {
      if (prefRequests.length > 1) {
        const uniqueValues = new Set(prefRequests.map(r => r.preferenceValue));
        if (uniqueValues.size > 1) {
          conflicts.push({
            type: this.CONFLICT_TYPES.PREFERENCE,
            preferenceType: prefType,
            conflictingRequests: prefRequests,
            severity: this.calculatePreferenceConflictSeverity(prefRequests),
            description: `Family members have different ${prefType} preferences`,
            affectedUsers: prefRequests.map(r => r.userId)
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect workload imbalance conflicts
   */
  async detectWorkloadConflicts(requests) {
    const conflicts = [];
    const userWorkloads = new Map();

    // Calculate workload per user
    requests.forEach(request => {
      const userId = request.userId;
      const workload = this.calculateRequestWorkload(request);

      if (!userWorkloads.has(userId)) {
        userWorkloads.set(userId, 0);
      }
      userWorkloads.set(userId, userWorkloads.get(userId) + workload);
    });

    // Check for workload imbalance
    const workloadValues = Array.from(userWorkloads.values());
    const avgWorkload = workloadValues.reduce((sum, w) => sum + w, 0) / workloadValues.length;
    const maxWorkload = Math.max(...workloadValues);
    const minWorkload = Math.min(...workloadValues);

    if ((maxWorkload - minWorkload) / avgWorkload > this.WORKLOAD_BALANCE_THRESHOLD) {
      const overloadedUsers = [];
      const underloadedUsers = [];

      for (const [userId, workload] of userWorkloads) {
        if (workload > avgWorkload * 1.3) {
          overloadedUsers.push({ userId, workload });
        } else if (workload < avgWorkload * 0.7) {
          underloadedUsers.push({ userId, workload });
        }
      }

      if (overloadedUsers.length > 0 && underloadedUsers.length > 0) {
        conflicts.push({
          type: this.CONFLICT_TYPES.WORKLOAD,
          overloadedUsers,
          underloadedUsers,
          averageWorkload: avgWorkload,
          severity: (maxWorkload - minWorkload) / avgWorkload,
          description: 'Significant workload imbalance detected among family members',
          affectedUsers: [...overloadedUsers, ...underloadedUsers].map(u => u.userId)
        });
      }
    }

    return conflicts;
  }

  /**
   * Generate resolution strategies for conflicts
   */
  async generateResolutions(conflicts, familyId) {
    const resolutions = [];

    for (const conflict of conflicts) {
      const resolution = await this.generateResolutionForConflict(conflict, familyId);
      resolutions.push(resolution);
    }

    return resolutions;
  }

  /**
   * Generate resolution for a specific conflict
   */
  async generateResolutionForConflict(conflict, familyId) {
    const familyPreferences = await this.getFamilyPreferences(familyId);

    switch (conflict.type) {
      case this.CONFLICT_TYPES.SCHEDULING:
        return await this.resolveSchedulingConflict(conflict, familyPreferences);

      case this.CONFLICT_TYPES.RESOURCE:
        return await this.resolveResourceConflict(conflict, familyPreferences);

      case this.CONFLICT_TYPES.PREFERENCE:
        return await this.resolvePreferenceConflict(conflict, familyPreferences);

      case this.CONFLICT_TYPES.WORKLOAD:
        return await this.resolveWorkloadConflict(conflict, familyPreferences);

      default:
        return await this.createDefaultResolution(conflict);
    }
  }

  /**
   * Resolve scheduling conflicts
   */
  async resolveSchedulingConflict(conflict, familyPreferences) {
    const { conflictingRequests } = conflict;

    // Strategy 1: Priority-based resolution
    if (familyPreferences.conflictResolution === 'priority') {
      const prioritizedRequests = conflictingRequests.sort((a, b) => {
        const priorityA = this.getPriorityScore(a);
        const priorityB = this.getPriorityScore(b);
        return priorityB - priorityA;
      });

      return {
        strategy: this.RESOLUTION_STRATEGIES.PRIORITY_BASED,
        conflict,
        resolution: {
          selectedRequest: prioritizedRequests[0],
          rescheduledRequests: prioritizedRequests.slice(1).map(req => ({
            ...req,
            suggestedNewTime: this.findAlternativeTimeSlot(req, conflictingRequests)
          }))
        },
        confidence: 0.8,
        explanation: 'Resolved using priority-based scheduling'
      };
    }

    // Strategy 2: Compromise time slots
    const compromiseTime = this.findCompromiseTimeSlot(conflictingRequests);
    if (compromiseTime) {
      return {
        strategy: this.RESOLUTION_STRATEGIES.COMPROMISE,
        conflict,
        resolution: {
          compromiseTime,
          adjustedRequests: conflictingRequests.map(req => ({
            ...req,
            adjustedTime: compromiseTime,
            adjustmentReason: 'Compromise scheduling'
          }))
        },
        confidence: 0.7,
        explanation: 'Found compromise time slot that works for all parties'
      };
    }

    // Fallback: Suggest manual resolution
    return {
      strategy: this.RESOLUTION_STRATEGIES.ESCALATION,
      conflict,
      resolution: {
        escalationType: 'manual_scheduling',
        suggestedAction: 'Family discussion needed for time slot selection',
        alternativeOptions: conflictingRequests.map(req =>
          this.findAlternativeTimeSlot(req, conflictingRequests)
        )
      },
      confidence: 0.4,
      explanation: 'Unable to automatically resolve - manual intervention recommended'
    };
  }

  /**
   * Resolve resource conflicts
   */
  async resolveResourceConflict(conflict, familyPreferences) {
    const { conflictingRequests, resource } = conflict;

    // Strategy 1: Rotation system
    if (familyPreferences.resourceSharing === 'rotation') {
      const rotationOrder = await this.getResourceRotationOrder(resource, conflict.affectedUsers);

      return {
        strategy: this.RESOLUTION_STRATEGIES.ROTATION,
        conflict,
        resolution: {
          rotationSchedule: rotationOrder.map((userId, index) => {
            const userRequest = conflictingRequests.find(r => r.userId === userId);
            return {
              userId,
              timeSlot: this.calculateRotationTimeSlot(userRequest, index),
              originalRequest: userRequest
            };
          })
        },
        confidence: 0.9,
        explanation: 'Applied rotation system for fair resource sharing'
      };
    }

    // Strategy 2: Duration-based allocation
    const shortestRequest = conflictingRequests.reduce((shortest, current) =>
      (current.estimatedDuration || 60) < (shortest.estimatedDuration || 60) ? current : shortest
    );

    return {
      strategy: this.RESOLUTION_STRATEGIES.PRIORITY_BASED,
      conflict,
      resolution: {
        immediateUser: shortestRequest.userId,
        queuedRequests: conflictingRequests
          .filter(r => r.userId !== shortestRequest.userId)
          .map((req, index) => ({
            ...req,
            queuePosition: index + 1,
            estimatedStartTime: this.calculateQueueStartTime(shortestRequest, index + 1)
          }))
      },
      confidence: 0.8,
      explanation: 'Shortest duration gets immediate access, others queued'
    };
  }

  /**
   * Resolve preference conflicts
   */
  async resolvePreferenceConflict(conflict, familyPreferences) {
    const { conflictingRequests, preferenceType } = conflict;

    // Strategy 1: Weighted compromise
    const preferenceWeights = await this.getPreferenceWeights(conflict.affectedUsers, preferenceType);
    const weightedAverage = this.calculateWeightedPreferenceAverage(conflictingRequests, preferenceWeights);

    if (weightedAverage) {
      return {
        strategy: this.RESOLUTION_STRATEGIES.COMPROMISE,
        conflict,
        resolution: {
          compromiseValue: weightedAverage,
          adjustedRequests: conflictingRequests.map(req => ({
            ...req,
            adjustedPreference: weightedAverage,
            adjustmentReason: 'Weighted family preference compromise'
          }))
        },
        confidence: 0.7,
        explanation: 'Applied weighted average of family preferences'
      };
    }

    // Strategy 2: Alternating preferences
    return {
      strategy: this.RESOLUTION_STRATEGIES.ROTATION,
      conflict,
      resolution: {
        rotationSchedule: conflictingRequests.map((req, index) => ({
          userId: req.userId,
          preferenceValue: req.preferenceValue,
          activeWeeks: this.calculatePreferenceRotationWeeks(index, conflictingRequests.length)
        }))
      },
      confidence: 0.6,
      explanation: 'Alternating preference system to ensure fairness'
    };
  }

  /**
   * Resolve workload conflicts
   */
  async resolveWorkloadConflict(conflict, familyPreferences) {
    const { overloadedUsers, underloadedUsers } = conflict;

    // Calculate reallocation suggestions
    const reallocations = [];

    for (const overloaded of overloadedUsers) {
      const excessWorkload = overloaded.workload - conflict.averageWorkload;

      for (const underloaded of underloadedUsers) {
        const capacity = conflict.averageWorkload - underloaded.workload;
        const transferAmount = Math.min(excessWorkload, capacity);

        if (transferAmount > 0) {
          reallocations.push({
            fromUser: overloaded.userId,
            toUser: underloaded.userId,
            workloadTransfer: transferAmount,
            suggestedTasks: await this.suggestTasksForTransfer(overloaded.userId, transferAmount)
          });
        }
      }
    }

    return {
      strategy: this.RESOLUTION_STRATEGIES.COMPROMISE,
      conflict,
      resolution: {
        workloadReallocations: reallocations,
        balancedWorkloads: await this.calculateBalancedWorkloads(conflict),
        implementationPlan: await this.createWorkloadBalancingPlan(reallocations)
      },
      confidence: 0.8,
      explanation: 'Redistributed workload for better family balance'
    };
  }

  /**
   * Balance workload across family members
   */
  async balanceWorkload(requests, familyId) {
    const userCapacities = await this.getUserCapacities(familyId);
    const balancedRequests = [...requests];

    // Sort requests by priority and workload
    balancedRequests.sort((a, b) => {
      const priorityDiff = this.getPriorityScore(b) - this.getPriorityScore(a);
      if (priorityDiff !== 0) return priorityDiff;

      const workloadDiff = this.calculateRequestWorkload(a) - this.calculateRequestWorkload(b);
      return workloadDiff;
    });

    // Assign requests to users based on capacity
    const userAssignments = new Map();

    balancedRequests.forEach(request => {
      const bestUser = this.findBestUserForRequest(request, userCapacities, userAssignments);

      if (!userAssignments.has(bestUser)) {
        userAssignments.set(bestUser, []);
      }

      userAssignments.get(bestUser).push({
        ...request,
        assignedUser: bestUser,
        workloadBalance: true
      });
    });

    return Array.from(userAssignments.values()).flat();
  }

  /**
   * Create coordination plan
   */
  async createCoordinationPlan(balancedRequests, resolutions, familyId) {
    return {
      executionOrder: this.determineExecutionOrder(balancedRequests),
      timelineSchedule: await this.createTimelineSchedule(balancedRequests),
      resourceAllocation: await this.allocateResources(balancedRequests),
      conflictResolutions: resolutions,
      monitoringPoints: this.identifyMonitoringPoints(balancedRequests, resolutions),
      fallbackStrategies: await this.createFallbackStrategies(balancedRequests),
      successMetrics: this.defineSuccessMetrics(balancedRequests, resolutions)
    };
  }

  /**
   * Store coordination session for learning
   */
  async storeCoordinationSession(familyId, sessionData) {
    try {
      await this.db.collection('coordination_sessions').add({
        familyId,
        ...sessionData,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`Stored coordination session for family ${familyId}`);

    } catch (error) {
      console.error('Failed to store coordination session:', error);
    }
  }

  /**
   * Helper methods
   */

  normalizeTimeSlot(time) {
    // Normalize time to hour blocks
    const date = new Date(time);
    date.setMinutes(0, 0, 0);
    return date.toISOString();
  }

  calculateConflictSeverity(conflictingRequests) {
    // Higher severity for more requests and higher priorities
    const prioritySum = conflictingRequests.reduce((sum, req) => sum + this.getPriorityScore(req), 0);
    return Math.min(1, (conflictingRequests.length * prioritySum) / 10);
  }

  calculatePreferenceConflictSeverity(prefRequests) {
    const uniqueValues = new Set(prefRequests.map(r => r.preferenceValue));
    return uniqueValues.size / prefRequests.length;
  }

  calculateRequestWorkload(request) {
    let workload = 1; // Base workload

    // Adjust based on complexity
    if (request.complexity === 'high') workload *= 3;
    else if (request.complexity === 'medium') workload *= 2;

    // Adjust based on estimated duration
    if (request.estimatedDuration) {
      workload *= (request.estimatedDuration / 60); // Convert minutes to hours
    }

    // Adjust based on priority
    workload *= this.getPriorityScore(request) / 5;

    return workload;
  }

  getPriorityScore(request) {
    const priorityMap = {
      'urgent': 10,
      'high': 8,
      'medium': 5,
      'low': 2,
      'optional': 1
    };

    return priorityMap[request.priority] || 5;
  }

  findAlternativeTimeSlot(request, conflictingRequests) {
    // Simple implementation - add 1 hour to original time
    const originalTime = new Date(request.scheduledTime);
    originalTime.setHours(originalTime.getHours() + 1);
    return originalTime.toISOString();
  }

  findCompromiseTimeSlot(conflictingRequests) {
    // Find a time slot that's acceptable to all parties
    // For now, return the average of all requested times
    const times = conflictingRequests.map(req => new Date(req.scheduledTime).getTime());
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    return new Date(averageTime).toISOString();
  }

  async getFamilyPreferences(familyId) {
    try {
      const prefsDoc = await this.db.collection('family_preferences').doc(familyId).get();
      return prefsDoc.exists ? prefsDoc.data() : {
        conflictResolution: 'compromise',
        resourceSharing: 'rotation',
        workloadBalance: 'equal'
      };
    } catch (error) {
      console.error('Failed to get family preferences:', error);
      return {};
    }
  }

  async getResourceRotationOrder(resource, userIds) {
    // Get last rotation order or create new one
    try {
      const rotationDoc = await this.db.collection('resource_rotations')
        .where('resource', '==', resource)
        .where('userIds', 'array-contains-any', userIds)
        .orderBy('lastUpdated', 'desc')
        .limit(1)
        .get();

      if (!rotationDoc.empty) {
        const lastRotation = rotationDoc.docs[0].data();
        // Rotate to next user
        const currentIndex = lastRotation.currentIndex || 0;
        const nextIndex = (currentIndex + 1) % userIds.length;

        const newOrder = [...userIds.slice(nextIndex), ...userIds.slice(0, nextIndex)];
        return newOrder;
      }

      return userIds; // First time rotation
    } catch (error) {
      console.error('Failed to get rotation order:', error);
      return userIds;
    }
  }

  calculateRotationTimeSlot(request, rotationIndex) {
    const baseTime = new Date(request.scheduledTime);
    baseTime.setHours(baseTime.getHours() + (rotationIndex * (request.estimatedDuration || 60) / 60));
    return baseTime.toISOString();
  }

  calculateQueueStartTime(firstRequest, queuePosition) {
    const startTime = new Date(firstRequest.scheduledTime);
    const duration = firstRequest.estimatedDuration || 60;
    startTime.setMinutes(startTime.getMinutes() + (duration * queuePosition));
    return startTime.toISOString();
  }

  async getPreferenceWeights(userIds, preferenceType) {
    // In a real implementation, this would fetch user-specific weights
    // For now, return equal weights
    const weights = {};
    userIds.forEach(userId => {
      weights[userId] = 1 / userIds.length;
    });
    return weights;
  }

  calculateWeightedPreferenceAverage(requests, weights) {
    // Simple numeric average for now
    const numericValues = requests
      .map(req => parseFloat(req.preferenceValue))
      .filter(val => !isNaN(val));

    if (numericValues.length === 0) return null;

    return numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length;
  }

  calculatePreferenceRotationWeeks(index, totalUsers) {
    // Rotate preferences every few weeks
    const rotationCycle = Math.max(4, totalUsers * 2); // At least 4 weeks per cycle
    return {
      startWeek: index * (rotationCycle / totalUsers),
      endWeek: (index + 1) * (rotationCycle / totalUsers)
    };
  }

  async suggestTasksForTransfer(fromUserId, workloadAmount) {
    // Suggest which tasks could be transferred to balance workload
    return [
      {
        taskType: 'routine_chore',
        estimatedWorkload: workloadAmount * 0.6,
        description: 'Transfer routine household tasks'
      },
      {
        taskType: 'admin_task',
        estimatedWorkload: workloadAmount * 0.4,
        description: 'Transfer administrative responsibilities'
      }
    ];
  }

  async calculateBalancedWorkloads(conflict) {
    const totalWorkload = conflict.overloadedUsers.reduce((sum, u) => sum + u.workload, 0) +
                         conflict.underloadedUsers.reduce((sum, u) => sum + u.workload, 0);
    const userCount = conflict.overloadedUsers.length + conflict.underloadedUsers.length;
    const targetWorkload = totalWorkload / userCount;

    return {
      targetWorkload,
      adjustments: [...conflict.overloadedUsers, ...conflict.underloadedUsers].map(user => ({
        userId: user.userId,
        currentWorkload: user.workload,
        targetWorkload,
        adjustment: targetWorkload - user.workload
      }))
    };
  }

  async createWorkloadBalancingPlan(reallocations) {
    return {
      phases: [
        {
          phase: 1,
          description: 'Immediate workload redistribution',
          actions: reallocations.slice(0, 2),
          timeline: '1-2 days'
        },
        {
          phase: 2,
          description: 'Long-term balance optimization',
          actions: reallocations.slice(2),
          timeline: '1 week'
        }
      ],
      monitoringSchedule: 'Weekly workload assessment',
      successCriteria: 'Workload variance < 20%'
    };
  }

  async getUserCapacities(familyId) {
    // Get user capacity information
    try {
      const usersSnapshot = await this.db.collection('family_members')
        .where('familyId', '==', familyId)
        .get();

      const capacities = {};
      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        capacities[doc.id] = {
          maxWorkload: userData.maxWorkload || 10,
          currentWorkload: userData.currentWorkload || 0,
          availability: userData.availability || 'full',
          preferences: userData.preferences || {}
        };
      });

      return capacities;
    } catch (error) {
      console.error('Failed to get user capacities:', error);
      return {};
    }
  }

  findBestUserForRequest(request, userCapacities, currentAssignments) {
    // Find the user with the best fit for this request
    let bestUser = request.userId; // Default to requesting user
    let bestScore = 0;

    for (const [userId, capacity] of Object.entries(userCapacities)) {
      const currentLoad = currentAssignments.get(userId)?.length || 0;
      const requestWorkload = this.calculateRequestWorkload(request);

      // Calculate fit score
      let score = 0;

      // Availability score
      if (capacity.availability === 'full') score += 0.4;
      else if (capacity.availability === 'partial') score += 0.2;

      // Capacity score
      const capacityUtilization = (currentLoad + requestWorkload) / capacity.maxWorkload;
      if (capacityUtilization < 0.8) score += 0.3;
      else if (capacityUtilization < 1.0) score += 0.1;

      // Preference score
      if (capacity.preferences[request.category]) score += 0.3;

      if (score > bestScore) {
        bestScore = score;
        bestUser = userId;
      }
    }

    return bestUser;
  }

  determineExecutionOrder(requests) {
    // Sort by priority and dependencies
    return requests.sort((a, b) => {
      // Priority first
      const priorityDiff = this.getPriorityScore(b) - this.getPriorityScore(a);
      if (priorityDiff !== 0) return priorityDiff;

      // Then by scheduled time
      const timeA = new Date(a.scheduledTime || Date.now()).getTime();
      const timeB = new Date(b.scheduledTime || Date.now()).getTime();
      return timeA - timeB;
    });
  }

  async createTimelineSchedule(requests) {
    const schedule = [];
    let currentTime = new Date();

    requests.forEach(request => {
      const startTime = new Date(request.scheduledTime || currentTime);
      const endTime = new Date(startTime.getTime() + (request.estimatedDuration || 60) * 60000);

      schedule.push({
        requestId: request.id,
        userId: request.assignedUser || request.userId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        description: request.description || request.action,
        priority: request.priority
      });

      currentTime = endTime;
    });

    return schedule;
  }

  async allocateResources(requests) {
    const allocation = {};

    requests.forEach(request => {
      if (request.requiredResources) {
        request.requiredResources.forEach(resource => {
          if (!allocation[resource]) {
            allocation[resource] = [];
          }

          allocation[resource].push({
            userId: request.assignedUser || request.userId,
            timeSlot: request.scheduledTime,
            duration: request.estimatedDuration || 60,
            purpose: request.description || request.action
          });
        });
      }
    });

    return allocation;
  }

  identifyMonitoringPoints(requests, resolutions) {
    const monitoringPoints = [];

    // Add monitoring for resolved conflicts
    resolutions.forEach(resolution => {
      monitoringPoints.push({
        type: 'conflict_resolution',
        conflictType: resolution.conflict.type,
        checkTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        criteria: 'Verify resolution effectiveness',
        actionIfFailed: 'Escalate to manual intervention'
      });
    });

    // Add monitoring for high-priority requests
    requests.filter(req => this.getPriorityScore(req) >= 8).forEach(request => {
      monitoringPoints.push({
        type: 'high_priority_tracking',
        requestId: request.id,
        checkTime: request.scheduledTime,
        criteria: 'Ensure timely execution',
        actionIfFailed: 'Send urgent notification'
      });
    });

    return monitoringPoints;
  }

  async createFallbackStrategies(requests) {
    return {
      coordinationFailure: {
        strategy: 'Individual agent execution',
        description: 'Revert to independent agent operation if coordination fails',
        triggers: ['coordination_timeout', 'unresolvable_conflicts']
      },
      resourceUnavailable: {
        strategy: 'Alternative resource allocation',
        description: 'Use backup resources or reschedule',
        triggers: ['resource_failure', 'double_booking']
      },
      userUnavailable: {
        strategy: 'Task redistribution',
        description: 'Reallocate tasks to available family members',
        triggers: ['user_absence', 'capacity_exceeded']
      }
    };
  }

  defineSuccessMetrics(requests, resolutions) {
    return {
      coordinationSuccess: {
        metric: 'Percentage of requests executed as planned',
        target: 85,
        measurement: 'Daily tracking'
      },
      conflictResolution: {
        metric: 'Percentage of conflicts successfully resolved',
        target: 90,
        measurement: 'Per coordination session'
      },
      familySatisfaction: {
        metric: 'Average family member satisfaction score',
        target: 4.0, // Out of 5
        measurement: 'Weekly survey'
      },
      workloadBalance: {
        metric: 'Workload variance between family members',
        target: '<20%',
        measurement: 'Weekly calculation'
      }
    };
  }

  async createFallbackPlan(requests) {
    // Simple fallback - execute requests in order without coordination
    return {
      strategy: 'sequential_execution',
      requests: requests.map((req, index) => ({
        ...req,
        executionOrder: index + 1,
        scheduledTime: new Date(Date.now() + index * 30 * 60 * 1000).toISOString() // 30 min intervals
      })),
      warning: 'Coordination failed - executing requests sequentially without optimization'
    };
  }

  createDefaultResolution(conflict) {
    return {
      strategy: this.RESOLUTION_STRATEGIES.ESCALATION,
      conflict,
      resolution: {
        escalationType: 'manual_intervention',
        suggestedAction: 'Family discussion required to resolve conflict',
        timeframe: '24 hours'
      },
      confidence: 0.3,
      explanation: 'Unable to automatically resolve - requires human intervention'
    };
  }
}

module.exports = MultiAgentCoordinationService;