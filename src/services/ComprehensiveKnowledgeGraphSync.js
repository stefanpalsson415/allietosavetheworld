// src/services/ComprehensiveKnowledgeGraphSync.js
import { db } from './firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
// Removed circular dependencies: FamilyKnowledgeGraph and SurveyKnowledgeGraphIntegration will be imported dynamically

/**
 * Comprehensive service to sync all family data sources with the Knowledge Graph
 */
class ComprehensiveKnowledgeGraphSync {
  constructor() {
    this._familyKnowledgeGraph = null; // Lazy-loaded FamilyKnowledgeGraph instance
    this._surveyKnowledgeGraphIntegration = null; // Lazy-loaded SurveyKnowledgeGraphIntegration instance
  }

  // Lazy getter for FamilyKnowledgeGraph to avoid circular dependency
  async getFamilyKnowledgeGraph() {
    if (!this._familyKnowledgeGraph) {
      const FamilyKnowledgeGraphModule = await import('./FamilyKnowledgeGraph');
      this._familyKnowledgeGraph = FamilyKnowledgeGraphModule.default;
    }
    return this._familyKnowledgeGraph;
  }

  // Lazy getter for SurveyKnowledgeGraphIntegration to avoid circular dependency
  async getSurveyKnowledgeGraphIntegration() {
    if (!this._surveyKnowledgeGraphIntegration) {
      const SurveyKnowledgeGraphIntegrationModule = await import('./SurveyKnowledgeGraphIntegration');
      this._surveyKnowledgeGraphIntegration = SurveyKnowledgeGraphIntegrationModule.default;
    }
    return this._surveyKnowledgeGraphIntegration;
  }
  
  /**
   * Perform a full sync of all family data to the knowledge graph
   * @param {string} familyId - The family ID
   * @param {Object} options - Sync options
   * @returns {Object} Sync results
   */
  async performFullSync(familyId, options = {}) {
    console.log("🔄 Starting comprehensive knowledge graph sync...");

    const FamilyKnowledgeGraph = await this.getFamilyKnowledgeGraph();
    const SurveyKnowledgeGraphIntegration = await this.getSurveyKnowledgeGraphIntegration();

    const results = {
      timestamp: new Date(),
      familyId,
      dataSources: {}
    };

    try {
      // Core family data (already implemented)
      console.log("Loading core family data...");
      await FamilyKnowledgeGraph.loadFamilyData(familyId);
      results.dataSources.familyCore = { status: 'success' };

      // Survey responses (using our new integration)
      console.log("Loading survey responses...");
      const surveyResults = await SurveyKnowledgeGraphIntegration.loadSurveyResponses(familyId);
      results.dataSources.surveys = { status: 'success', ...surveyResults };
      
      // Calendar events
      console.log("Loading calendar events...");
      const calendarResults = await this.loadCalendarEvents(familyId, options.dateRange);
      results.dataSources.calendar = { status: 'success', events: calendarResults };
      
      // Chores and rewards
      console.log("Loading chores and rewards...");
      const choreResults = await this.loadChoresAndRewards(familyId);
      results.dataSources.chores = { status: 'success', ...choreResults };
      
      // Provider directory
      console.log("Loading providers...");
      const providerResults = await this.loadProviders(familyId);
      results.dataSources.providers = { status: 'success', providers: providerResults };
      
      // Habits and routines
      console.log("Loading habits...");
      const habitResults = await this.loadHabits(familyId);
      results.dataSources.habits = { status: 'success', habits: habitResults };
      
      // Chat history insights (optional, can be heavy)
      if (options.includeChatHistory) {
        console.log("Loading chat insights...");
        const chatResults = await this.loadChatInsights(familyId);
        results.dataSources.chat = { status: 'success', insights: chatResults };
      }
      
      // Generate fresh insights after sync
      console.log("Generating insights...");
      await FamilyKnowledgeGraph.generateInsights(familyId);
      
      // Save sync timestamp
      await setDoc(doc(db, 'knowledgeGraphSync', familyId), {
        lastSync: serverTimestamp(),
        status: 'success',
        dataSources: results.dataSources,
        timestamp: results.timestamp
      });
      
      results.status = 'success';
      console.log("✅ Knowledge graph sync complete!", results);
      
      return results;
      
    } catch (error) {
      console.error("Error during knowledge graph sync:", error);
      results.status = 'error';
      results.error = error.message;
      return results;
    }
  }
  
  /**
   * Load calendar events into knowledge graph
   */
  async loadCalendarEvents(familyId, dateRange = {}) {
    try {
      const FamilyKnowledgeGraph = await this.getFamilyKnowledgeGraph();

      const startDate = dateRange.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const endDate = dateRange.end || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days future

      const q = query(
        collection(db, 'events'),
        where('familyId', '==', familyId),
        where('startTime', '>=', Timestamp.fromDate(startDate)),
        where('startTime', '<=', Timestamp.fromDate(endDate))
      );

      const snapshot = await getDocs(q);
      let count = 0;

      for (const doc of snapshot.docs) {
        const event = { id: doc.id, ...doc.data() };

        // Create event entity
        const eventEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
          id: `calendar_event_${doc.id}`,
          type: 'calendar_event',
          properties: {
            title: event.title,
            description: event.description,
            startTime: event.startTime?.toDate?.() || new Date(event.startTime),
            endTime: event.endTime?.toDate?.() || new Date(event.endTime),
            location: event.location,
            category: event.category || 'general',
            isRecurring: event.recurrence ? true : false,
            source: event.source || 'manual',
            tags: event.tags || []
          }
        });
        
        // Link to attendees
        if (event.attendees && Array.isArray(event.attendees)) {
          for (const attendeeId of event.attendees) {
            await FamilyKnowledgeGraph.addRelationship(familyId, {
              from: `person_${attendeeId}`,
              to: eventEntity.id,
              type: 'attends_event',
              properties: {
                role: event.createdBy === attendeeId ? 'organizer' : 'attendee'
              }
            });
          }
        }
        
        // Link to location if it's a known provider
        if (event.providerId) {
          await FamilyKnowledgeGraph.addRelationship(familyId, {
            from: eventEntity.id,
            to: `provider_${event.providerId}`,
            type: 'located_at',
            properties: {
              context: 'appointment'
            }
          });
        }
        
        count++;
      }
      
      return count;
    } catch (error) {
      console.error("Error loading calendar events:", error);
      return 0;
    }
  }
  
  /**
   * Load chores and rewards
   */
  async loadChoresAndRewards(familyId) {
    try {
      const FamilyKnowledgeGraph = await this.getFamilyKnowledgeGraph();

      let choreCount = 0;
      let rewardCount = 0;

      // Load recent chore instances
      const choreQuery = query(
        collection(db, 'choreInstances'),
        where('familyId', '==', familyId),
        where('status', 'in', ['completed', 'verified']),
        orderBy('completedAt', 'desc'),
        limit(100)
      );

      const choreSnapshot = await getDocs(choreQuery);

      for (const doc of choreSnapshot.docs) {
        const chore = { id: doc.id, ...doc.data() };

        // Create chore completion entity
        const choreEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
          id: `chore_completion_${doc.id}`,
          type: 'chore_completion',
          properties: {
            title: chore.title,
            completedAt: chore.completedAt?.toDate?.() || new Date(chore.completedAt),
            bucksEarned: chore.bucksAwarded || chore.bucksValue,
            feedback: chore.feedback,
            photoUrl: chore.photoUrl,
            mood: chore.completionMood || chore.completionProof?.mood || 'neutral',
            notes: chore.completionProof?.note || '',
            difficulty: chore.completionMood || chore.completionProof?.mood || 'neutral',
            proofType: chore.completionProof?.type || 'photo'
          }
        });
        
        // Link to child
        if (chore.childId) {
          await FamilyKnowledgeGraph.addRelationship(familyId, {
            from: `person_${chore.childId}`,
            to: choreEntity.id,
            type: 'completed_chore',
            properties: {
              effort: chore.effort || 'medium',
              quality: chore.quality || 'good',
              mood: chore.completionMood || chore.completionProof?.mood || 'neutral',
              completionNotes: chore.completionProof?.note || ''
            }
          });
        }
        
        choreCount++;
      }
      
      // Load reward redemptions
      const rewardQuery = query(
        collection(db, 'rewardInstances'),
        where('familyId', '==', familyId),
        where('status', 'in', ['fulfilled', 'scheduled']),
        orderBy('requestedAt', 'desc'),
        limit(50)
      );
      
      const rewardSnapshot = await getDocs(rewardQuery);
      
      for (const doc of rewardSnapshot.docs) {
        const reward = { id: doc.id, ...doc.data() };
        
        // Create reward entity
        const rewardEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
          id: `reward_redemption_${doc.id}`,
          type: 'reward_redemption',
          properties: {
            title: reward.title,
            category: reward.category,
            requestedAt: reward.requestedAt?.toDate?.() || new Date(reward.requestedAt),
            fulfilledAt: reward.fulfilledAt?.toDate?.(),
            bucksSpent: reward.bucksValue,
            scheduledDate: reward.scheduledDate,
            photoUrl: reward.photoUrl
          }
        });
        
        // Link to child
        if (reward.childId) {
          await FamilyKnowledgeGraph.addRelationship(familyId, {
            from: `person_${reward.childId}`,
            to: rewardEntity.id,
            type: 'redeemed_reward',
            properties: {
              satisfaction: reward.satisfaction || 'happy'
            }
          });
        }
        
        rewardCount++;
      }
      
      return { chores: choreCount, rewards: rewardCount };
    } catch (error) {
      console.error("Error loading chores and rewards:", error);
      return { chores: 0, rewards: 0 };
    }
  }
  
  /**
   * Load providers from directory
   */
  async loadProviders(familyId) {
    try {
      const FamilyKnowledgeGraph = await this.getFamilyKnowledgeGraph();

      const q = query(
        collection(db, 'familyProviders'),
        where('familyId', '==', familyId)
      );

      const snapshot = await getDocs(q);
      let count = 0;

      for (const doc of snapshot.docs) {
        const provider = { id: doc.id, ...doc.data() };

        // Create provider entity
        const providerEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
          id: `provider_${doc.id}`,
          type: 'provider',
          properties: {
            name: provider.name,
            specialty: provider.specialty,
            category: provider.category,
            phone: provider.phone,
            email: provider.email,
            address: provider.address,
            notes: provider.notes,
            lastVisit: provider.lastVisit?.toDate?.(),
            nextAppointment: provider.nextAppointment?.toDate?.(),
            rating: provider.rating
          }
        });
        
        // Link to family members who use this provider
        if (provider.familyMembers && Array.isArray(provider.familyMembers)) {
          for (const memberId of provider.familyMembers) {
            await FamilyKnowledgeGraph.addRelationship(familyId, {
              from: `person_${memberId}`,
              to: providerEntity.id,
              type: 'patient_of',
              properties: {
                isPrimary: provider.primaryFor?.includes(memberId)
              }
            });
          }
        }
        
        count++;
      }
      
      return count;
    } catch (error) {
      console.error("Error loading providers:", error);
      return 0;
    }
  }
  
  /**
   * Load habits
   */
  async loadHabits(familyId) {
    try {
      const FamilyKnowledgeGraph = await this.getFamilyKnowledgeGraph();

      const q = query(
        collection(db, 'habits'),
        where('familyId', '==', familyId),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);
      let count = 0;

      for (const doc of snapshot.docs) {
        const habit = { id: doc.id, ...doc.data() };

        // Create habit entity
        const habitEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
          id: `habit_${doc.id}`,
          type: 'habit',
          properties: {
            title: habit.title,
            description: habit.description,
            category: habit.category,
            frequency: habit.frequency,
            targetBehavior: habit.targetBehavior,
            currentStreak: habit.currentStreak || 0,
            longestStreak: habit.longestStreak || 0,
            completionRate: habit.completionRate || 0,
            difficulty: habit.difficulty || 'medium',
            impact: habit.impact || 'medium'
          }
        });
        
        // Link to assigned family members
        if (habit.assignedTo && Array.isArray(habit.assignedTo)) {
          for (const memberId of habit.assignedTo) {
            await FamilyKnowledgeGraph.addRelationship(familyId, {
              from: `person_${memberId}`,
              to: habitEntity.id,
              type: 'practices_habit',
              properties: {
                streak: habit.streaks?.[memberId] || 0,
                lastCompleted: habit.lastCompleted?.[memberId]
              }
            });
          }
        }
        
        count++;
      }
      
      return count;
    } catch (error) {
      console.error("Error loading habits:", error);
      return 0;
    }
  }
  
  /**
   * Load chat insights (extract key themes and decisions from chat history)
   */
  async loadChatInsights(familyId) {
    try {
      const FamilyKnowledgeGraph = await this.getFamilyKnowledgeGraph();

      // This is a simplified version - in production you might want to
      // process chat messages more intelligently
      const q = query(
        collection(db, 'chatSessions'),
        where('familyId', '==', familyId),
        orderBy('timestamp', 'desc'),
        limit(10) // Recent sessions only
      );

      const snapshot = await getDocs(q);
      let insightCount = 0;

      for (const doc of snapshot.docs) {
        const session = { id: doc.id, ...doc.data() };

        // Extract decisions and action items from chat
        if (session.summary?.decisions) {
          for (const decision of session.summary.decisions) {
            const decisionEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
              id: `decision_${doc.id}_${Date.now()}`,
              type: 'decision',
              properties: {
                description: decision.text,
                category: decision.category,
                madeAt: session.timestamp?.toDate?.() || new Date(session.timestamp),
                source: 'chat_conversation'
              }
            });
            
            // Link to participants
            if (session.participants) {
              for (const participantId of session.participants) {
                await FamilyKnowledgeGraph.addRelationship(familyId, {
                  from: `person_${participantId}`,
                  to: decisionEntity.id,
                  type: 'participated_in_decision',
                  properties: {
                    role: 'participant'
                  }
                });
              }
            }
            
            insightCount++;
          }
        }
      }
      
      return insightCount;
    } catch (error) {
      console.error("Error loading chat insights:", error);
      return 0;
    }
  }
  
  /**
   * Perform incremental sync (only recent changes)
   */
  async performIncrementalSync(familyId, lastSyncTimestamp) {
    // Implementation for incremental sync
    // This would only load data that has changed since lastSyncTimestamp
    console.log("Incremental sync not yet implemented");
    return this.performFullSync(familyId);
  }
}

export default new ComprehensiveKnowledgeGraphSync();