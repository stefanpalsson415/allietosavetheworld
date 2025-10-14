// src/services/SurveyKnowledgeGraphIntegration.js
import { db } from './firebase';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
// Removed circular dependency: FamilyKnowledgeGraph will be imported dynamically

/**
 * Service to integrate survey responses and child interest data into the Family Knowledge Graph
 */
class SurveyKnowledgeGraphIntegration {
  constructor() {
    this._familyKnowledgeGraph = null; // Lazy-loaded FamilyKnowledgeGraph instance
  }

  // Lazy getter for FamilyKnowledgeGraph to avoid circular dependency
  async getFamilyKnowledgeGraph() {
    if (!this._familyKnowledgeGraph) {
      const FamilyKnowledgeGraphModule = await import('./FamilyKnowledgeGraph');
      this._familyKnowledgeGraph = FamilyKnowledgeGraphModule.default;
    }
    return this._familyKnowledgeGraph;
  }
  
  /**
   * Load all survey responses for a family into the knowledge graph
   * @param {string} familyId - The family ID
   */
  async loadSurveyResponses(familyId) {
    try {
      // Load relationship surveys
      const relationshipSurveys = await this.loadRelationshipSurveys(familyId);
      
      // Load child interest surveys
      const childInterests = await this.loadChildInterests(familyId);
      
      // Load weekly check-ins
      const weeklyCheckIns = await this.loadWeeklyCheckIns(familyId);
      
      // Load assessment results
      const assessments = await this.loadAssessments(familyId);
      
      console.log(`✅ Loaded survey data into knowledge graph:
        - ${relationshipSurveys} relationship surveys
        - ${childInterests} child interest profiles
        - ${weeklyCheckIns} weekly check-ins
        - ${assessments} assessments`);
        
      return {
        relationshipSurveys,
        childInterests,
        weeklyCheckIns,
        assessments
      };
    } catch (error) {
      console.error("Error loading survey responses into knowledge graph:", error);
      throw error;
    }
  }
  
  /**
   * Load relationship survey responses
   */
  async loadRelationshipSurveys(familyId) {
    try {
      const FamilyKnowledgeGraph = await this.getFamilyKnowledgeGraph();

      const q = query(
        collection(db, 'relationshipSurveys'),
        where('familyId', '==', familyId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      let count = 0;

      for (const doc of snapshot.docs) {
        const survey = { id: doc.id, ...doc.data() };

        // Create survey entity
        const surveyEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
          id: `survey_relationship_${doc.id}`,
          type: 'survey',
          properties: {
            surveyType: 'relationship',
            timestamp: survey.timestamp?.toDate?.() || new Date(survey.timestamp),
            weekNumber: survey.weekNumber,
            responses: survey.responses || {},
            insights: survey.insights || [],
            categories: survey.categories || {}
          }
        });
        
        // Link to respondent
        if (survey.userId) {
          await FamilyKnowledgeGraph.addRelationship(familyId, {
            from: `person_${survey.userId}`,
            to: surveyEntity.id,
            type: 'responded_to',
            properties: {
              role: survey.userRole || 'partner'
            }
          });
        }
        
        // Extract insights as separate entities
        if (survey.insights && Array.isArray(survey.insights)) {
          for (const insight of survey.insights) {
            const insightEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
              id: `insight_${doc.id}_${insight.category}_${Date.now()}`,
              type: 'insight',
              properties: {
                category: insight.category,
                description: insight.text || insight.description,
                importance: insight.importance || 'medium',
                source: 'relationship_survey'
              }
            });
            
            await FamilyKnowledgeGraph.addRelationship(familyId, {
              from: surveyEntity.id,
              to: insightEntity.id,
              type: 'generated_insight',
              properties: {
                confidence: insight.confidence || 0.8
              }
            });
          }
        }
        
        count++;
      }
      
      return count;
    } catch (error) {
      console.error("Error loading relationship surveys:", error);
      return 0;
    }
  }
  
  /**
   * Load child interest data
   */
  async loadChildInterests(familyId) {
    try {
      const FamilyKnowledgeGraph = await this.getFamilyKnowledgeGraph();

      const q = query(
        collection(db, 'childInterests'),
        where('familyId', '==', familyId)
      );

      const snapshot = await getDocs(q);
      let count = 0;

      for (const doc of snapshot.docs) {
        const interestData = { id: doc.id, ...doc.data() };
        const childId = interestData.childId;

        if (!childId) continue;

        // Create interest profile entity
        const profileEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
          id: `interest_profile_${childId}`,
          type: 'interest_profile',
          properties: {
            childId,
            totalComparisons: interestData.comparisons || 0,
            lastUpdated: interestData.lastUpdated?.toDate?.() || new Date()
          }
        });
        
        // Link to child
        await FamilyKnowledgeGraph.addRelationship(familyId, {
          from: `person_${childId}`,
          to: profileEntity.id,
          type: 'has_interest_profile',
          properties: {
            confidence: Math.min(1.0, (interestData.comparisons || 0) / 30)
          }
        });
        
        // Add individual interests as entities
        if (interestData.interests) {
          for (const [category, interests] of Object.entries(interestData.interests)) {
            for (const interest of interests) {
              const interestEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
                id: `interest_${childId}_${interest.id}`,
                type: 'interest',
                properties: {
                  name: interest.name,
                  category: interest.category || category,
                  ageGroup: interest.ageGroup,
                  rating: interest.rating,
                  wins: interest.wins || 0,
                  losses: interest.losses || 0,
                  comparisons: interest.comparisons || 0,
                  tags: interest.tags || [],
                  imageUrl: interest.imageUrl
                }
              });
              
              // Link interest to profile
              await FamilyKnowledgeGraph.addRelationship(familyId, {
                from: profileEntity.id,
                to: interestEntity.id,
                type: 'includes_interest',
                properties: {
                  strength: interest.rating / 1200, // Normalize ELO rating
                  confidence: Math.min(1.0, interest.comparisons / 10)
                }
              });
            }
          }
        }
        
        count++;
      }
      
      return count;
    } catch (error) {
      console.error("Error loading child interests:", error);
      return 0;
    }
  }
  
  /**
   * Load weekly check-in responses
   */
  async loadWeeklyCheckIns(familyId) {
    try {
      const FamilyKnowledgeGraph = await this.getFamilyKnowledgeGraph();

      const q = query(
        collection(db, 'weeklyCheckIns'),
        where('familyId', '==', familyId),
        orderBy('timestamp', 'desc'),
        limit(20) // Last 20 check-ins to avoid overloading
      );

      const snapshot = await getDocs(q);
      let count = 0;

      for (const doc of snapshot.docs) {
        const checkIn = { id: doc.id, ...doc.data() };

        // Create check-in entity
        const checkInEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
          id: `checkin_${doc.id}`,
          type: 'weekly_checkin',
          properties: {
            timestamp: checkIn.timestamp?.toDate?.() || new Date(checkIn.timestamp),
            weekNumber: checkIn.weekNumber,
            overallMood: checkIn.overallMood,
            energyLevel: checkIn.energyLevel,
            stressLevel: checkIn.stressLevel,
            relationshipSatisfaction: checkIn.relationshipSatisfaction,
            highlights: checkIn.highlights || [],
            challenges: checkIn.challenges || [],
            priorities: checkIn.priorities || []
          }
        });
        
        // Link to respondent
        if (checkIn.userId) {
          await FamilyKnowledgeGraph.addRelationship(familyId, {
            from: `person_${checkIn.userId}`,
            to: checkInEntity.id,
            type: 'submitted_checkin',
            properties: {
              weekNumber: checkIn.weekNumber
            }
          });
        }
        
        // Extract mentioned family members
        if (checkIn.familyMemberUpdates) {
          for (const [memberId, update] of Object.entries(checkIn.familyMemberUpdates)) {
            if (update && update.notes) {
              await FamilyKnowledgeGraph.addRelationship(familyId, {
                from: checkInEntity.id,
                to: `person_${memberId}`,
                type: 'mentions_update',
                properties: {
                  mood: update.mood,
                  notes: update.notes
                }
              });
            }
          }
        }
        
        count++;
      }
      
      return count;
    } catch (error) {
      console.error("Error loading weekly check-ins:", error);
      return 0;
    }
  }
  
  /**
   * Load assessment results
   */
  async loadAssessments(familyId) {
    try {
      const FamilyKnowledgeGraph = await this.getFamilyKnowledgeGraph();

      const collections = ['relationshipAssessments', 'parentingAssessments', 'familyDynamicsAssessments'];
      let totalCount = 0;

      for (const collectionName of collections) {
        const q = query(
          collection(db, collectionName),
          where('familyId', '==', familyId),
          orderBy('completedAt', 'desc'),
          limit(10)
        );

        const snapshot = await getDocs(q);

        for (const doc of snapshot.docs) {
          const assessment = { id: doc.id, ...doc.data() };

          // Create assessment entity
          const assessmentEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
            id: `assessment_${collectionName}_${doc.id}`,
            type: 'assessment',
            properties: {
              assessmentType: collectionName,
              completedAt: assessment.completedAt?.toDate?.() || new Date(assessment.completedAt),
              scores: assessment.scores || {},
              strengths: assessment.strengths || [],
              growthAreas: assessment.growthAreas || [],
              recommendations: assessment.recommendations || []
            }
          });
          
          // Link to respondent(s)
          if (assessment.userId) {
            await FamilyKnowledgeGraph.addRelationship(familyId, {
              from: `person_${assessment.userId}`,
              to: assessmentEntity.id,
              type: 'completed_assessment',
              properties: {
                role: assessment.userRole
              }
            });
          }
          
          // Create recommendation entities
          if (assessment.recommendations && Array.isArray(assessment.recommendations)) {
            for (const rec of assessment.recommendations) {
              const recEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
                id: `recommendation_${doc.id}_${rec.category}_${Date.now()}`,
                type: 'recommendation',
                properties: {
                  category: rec.category,
                  title: rec.title,
                  description: rec.description,
                  priority: rec.priority || 'medium',
                  source: assessmentEntity.assessmentType
                }
              });
              
              await FamilyKnowledgeGraph.addRelationship(familyId, {
                from: assessmentEntity.id,
                to: recEntity.id,
                type: 'recommends',
                properties: {
                  confidence: rec.confidence || 0.8
                }
              });
            }
          }
          
          totalCount++;
        }
      }
      
      return totalCount;
    } catch (error) {
      console.error("Error loading assessments:", error);
      return 0;
    }
  }
  
  /**
   * Load habit helper feedback
   */
  async loadHabitFeedback(familyId) {
    try {
      const FamilyKnowledgeGraph = await this.getFamilyKnowledgeGraph();

      const q = query(
        collection(db, 'habitHelperFeedback'),
        where('familyId', '==', familyId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      let count = 0;

      for (const doc of snapshot.docs) {
        const feedback = { id: doc.id, ...doc.data() };

        // Create feedback entity
        const feedbackEntity = await FamilyKnowledgeGraph.addEntity(familyId, {
          id: `habit_feedback_${doc.id}`,
          type: 'habit_feedback',
          properties: {
            habitId: feedback.habitId,
            helpful: feedback.helpful,
            timestamp: feedback.timestamp?.toDate?.() || new Date(feedback.timestamp),
            comments: feedback.comments,
            adjustments: feedback.adjustments || []
          }
        });
        
        // Link to user
        if (feedback.userId) {
          await FamilyKnowledgeGraph.addRelationship(familyId, {
            from: `person_${feedback.userId}`,
            to: feedbackEntity.id,
            type: 'provided_feedback',
            properties: {
              sentiment: feedback.helpful ? 'positive' : 'negative'
            }
          });
        }
        
        // Link to habit if we can identify it
        if (feedback.habitId) {
          await FamilyKnowledgeGraph.addRelationship(familyId, {
            from: feedbackEntity.id,
            to: `habit_${feedback.habitId}`,
            type: 'feedback_for',
            properties: {
              helpful: feedback.helpful
            }
          });
        }
        
        count++;
      }
      
      return count;
    } catch (error) {
      console.error("Error loading habit feedback:", error);
      return 0;
    }
  }
}

export default new SurveyKnowledgeGraphIntegration();