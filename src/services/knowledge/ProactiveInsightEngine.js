/**
 * ProactiveInsightEngine.js
 * 
 * Service for generating proactive insights and notifications 
 * based on knowledge graph traversals.
 * 
 * This engine performs scheduled analysis of the knowledge graph to 
 * detect patterns, imbalances, and opportunities for intervention.
 */

import Neo4jGraphService from '../database/Neo4jGraphService';
import { db } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  updateDoc,
  addDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

class ProactiveInsightEngine {
  constructor() {
    this.neo4jService = Neo4jGraphService;
    this.insightTypes = {
      WORKLOAD_IMBALANCE: 'workload_imbalance',
      UPCOMING_EVENTS: 'upcoming_events',
      TASK_OVERDUE: 'task_overdue', 
      CHILD_NEEDS: 'child_needs',
      RELATIONSHIP_HEALTH: 'relationship_health',
      SIBLING_DYNAMICS: 'sibling_dynamics',
      MEDICAL_REMINDER: 'medical_reminder',
      DOCUMENT_UPDATE: 'document_update',
      MILESTONE_ALERT: 'milestone_alert',
      SCHEDULING_CONFLICT: 'scheduling_conflict'
    };
    
    // Define insight generators
    this.insightGenerators = [
      this.generateWorkloadInsights.bind(this),
      this.generateUpcomingEventInsights.bind(this),
      this.generateTaskInsights.bind(this),
      this.generateChildNeedsInsights.bind(this),
      this.generateRelationshipInsights.bind(this),
      this.generateSiblingDynamicsInsights.bind(this),
      this.generateMedicalInsights.bind(this),
      this.generateDocumentInsights.bind(this),
      this.generateMilestoneInsights.bind(this),
      this.generateSchedulingInsights.bind(this)
    ];
    
    // Scheduled job tracking
    this.scheduledJobs = {};
  }
  
  /**
   * Generate sibling dynamics insights
   * @param {string} familyId - Family ID to generate insights for
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Sibling dynamics insights
   */
  async generateSiblingDynamicsInsights(familyId, options = {}) {
    try {
      const insights = [];
      
      // Get family data to find sibling pairs
      const membersQuery = `
        MATCH (f:family {id: $familyId})
        MATCH (c:person)-[:member_of]->(f)
        WHERE c.role = 'child'
        RETURN c.id as id, c.name as name, c.age as age
      `;
      
      const childMembers = await this.neo4jService.executeQuery(membersQuery, { familyId });
      
      // If less than 2 children, no sibling dynamics to analyze
      if (childMembers.length < 2) {
        return [];
      }
      
      // Get survey responses related to siblings
      const surveyResponses = await this.getSiblingSurveyResponses(familyId);
      
      // Get sibling relationship data from knowledge graph
      const siblingRelationshipsQuery = `
        MATCH (f:family {id: $familyId})
        MATCH (c1:person)-[:member_of]->(f)
        MATCH (c2:person)-[:member_of]->(f)
        MATCH (c1)-[r:sibling_of]->(c2)
        WHERE c1.role = 'child' AND c2.role = 'child' AND c1.id <> c2.id
        RETURN c1.id as source_id, c1.name as source_name, c1.age as source_age,
               c2.id as target_id, c2.name as target_name, c2.age as target_age,
               r.influence_type as influence_type, r.influence_strength as influence_strength,
               r.relationship_quality as relationship_quality,
               r.shared_interests as shared_interests,
               r.teaching_domains as teaching_domains,
               r.learning_domains as learning_domains
      `;
      
      const siblingRelationships = await this.neo4jService.executeQuery(siblingRelationshipsQuery, { familyId });
      
      // If sibling relationships exist in the graph, analyze them
      if (siblingRelationships.length > 0) {
        // Find teaching-learning patterns
        const teachingPatterns = this.findTeachingPatterns(siblingRelationships);
        for (const pattern of teachingPatterns) {
          insights.push({
            id: `sibling_teaching_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: this.insightTypes.SIBLING_DYNAMICS,
            title: `${pattern.teacher} can teach ${pattern.learner}`,
            description: `${pattern.teacher} has skills in ${pattern.domains.join(', ')} that could be shared with ${pattern.learner}.`,
            severity: 'medium',
            generatedDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            entities: [pattern.teacherId, pattern.learnerId],
            actionable: true,
            actionItems: [
              `Schedule a 20-minute teaching session where ${pattern.teacher} leads in ${pattern.domains[0]}`,
              `Create a "Sibling Teaching Ladder" for structured skill transfer`,
              `Praise and acknowledge when you see ${pattern.teacher} helping ${pattern.learner}`
            ],
            confidence: 0.8,
            source: 'knowledge_graph',
            siblingTeachingData: pattern
          });
        }
        
        // Find shared interest patterns
        const sharedInterestPatterns = this.findSharedInterests(siblingRelationships);
        for (const pattern of sharedInterestPatterns) {
          insights.push({
            id: `sibling_interests_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: this.insightTypes.SIBLING_DYNAMICS,
            title: `${pattern.siblings.join(' & ')} share interests`,
            description: `${pattern.siblings.join(' and ')} both enjoy ${pattern.interests.join(', ')}, which offers opportunities for joint activities.`,
            severity: 'low',
            generatedDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            entities: pattern.siblingIds,
            actionable: true,
            actionItems: [
              `Schedule a joint activity around ${pattern.interests[0]}`,
              `Create a shared project that builds on this mutual interest`,
              `Look for ways they can support each other in this shared passion`
            ],
            confidence: 0.85,
            source: 'knowledge_graph',
            sharedInterestData: pattern
          });
        }
        
        // Find complementary skills
        const complementarySkills = this.findComplementarySkills(siblingRelationships);
        for (const pattern of complementarySkills) {
          insights.push({
            id: `sibling_comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: this.insightTypes.SIBLING_DYNAMICS,
            title: `${pattern.siblings.join(' & ')} have complementary skills`,
            description: `${pattern.siblings[0]} excels at ${pattern.skills[0]}, while ${pattern.siblings[1]} excels at ${pattern.skills[1]}. They can learn from each other.`,
            severity: 'medium',
            generatedDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            entities: pattern.siblingIds,
            actionable: true,
            actionItems: [
              `Create a "Sibling Talent Spotlight" at your next family dinner`,
              `Have each child teach the other about their strength area`,
              `Create a joint project that requires both skill sets`
            ],
            confidence: 0.75,
            source: 'knowledge_graph',
            complementarySkillsData: pattern
          });
        }
      }
      
      // Process survey data for additional insights
      if (surveyResponses.length > 0) {
        for (const response of surveyResponses) {
          // Skip if no specific talent or activity mentioned
          if (!response.value || response.value.length < 3) continue;
          
          const siblingPair = childMembers.filter(m => 
            m.id === response.childId || m.id === response.siblingId
          );
          
          if (siblingPair.length !== 2) continue;
          
          const respondent = siblingPair.find(m => m.id === response.childId);
          const sibling = siblingPair.find(m => m.id === response.siblingId);
          
          // Process talent spotting responses
          if (response.questionId === 'sibling_talent_1') {
            insights.push({
              id: `sibling_talent_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              type: this.insightTypes.SIBLING_DYNAMICS,
              title: `Hidden Talent: ${sibling.name}`,
              description: `${respondent.name} noticed that ${sibling.name} is really good at ${response.value}, which they might not realize.`,
              severity: 'low',
              generatedDate: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              entities: [respondent.id, sibling.id],
              actionable: true,
              actionItems: [
                `Hold a "Sibling Talent Spotlight" and have ${respondent.name} share this observation`,
                `Find opportunities for ${sibling.name} to develop this talent further`,
                `Notice and praise when ${sibling.name} demonstrates this ability`
              ],
              confidence: 0.7,
              source: 'survey',
              siblingTalentData: {
                respondent: respondent.name,
                respondentId: respondent.id,
                sibling: sibling.name,
                siblingId: sibling.id,
                talent: response.value
              }
            });
          }
          
          // Process activity suggestions
          else if (response.questionId === 'sibling_activity_1') {
            insights.push({
              id: `sibling_activity_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              type: this.insightTypes.SIBLING_DYNAMICS,
              title: `Activity Suggestion for ${sibling.name}`,
              description: `${respondent.name} thinks ${sibling.name} would enjoy ${response.value}.`,
              severity: 'low',
              generatedDate: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              entities: [respondent.id, sibling.id],
              actionable: true,
              actionItems: [
                `Explore ${response.value} as a potential activity for ${sibling.name}`,
                `Have ${respondent.name} help introduce ${sibling.name} to this activity`,
                `Ask ${respondent.name} why they think ${sibling.name} would enjoy this`
              ],
              confidence: 0.65,
              source: 'survey',
              siblingActivityData: {
                respondent: respondent.name,
                respondentId: respondent.id,
                sibling: sibling.name,
                siblingId: sibling.id,
                activity: response.value
              }
            });
          }
          
          // Process learning insights
          else if (response.questionId === 'sibling_learn_1') {
            insights.push({
              id: `sibling_learning_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              type: this.insightTypes.SIBLING_DYNAMICS,
              title: `Learning Between Siblings`,
              description: `${respondent.name} has learned ${response.value} from ${sibling.name}.`,
              severity: 'medium',
              generatedDate: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              entities: [respondent.id, sibling.id],
              actionable: true,
              actionItems: [
                `Acknowledge this learning exchange at your next family meeting`,
                `Look for other opportunities where ${sibling.name} can mentor ${respondent.name}`,
                `Create a "Sibling Success Cascade" to formalize this knowledge sharing`
              ],
              confidence: 0.8,
              source: 'survey',
              siblingLearningData: {
                learner: respondent.name,
                learnerId: respondent.id,
                teacher: sibling.name,
                teacherId: sibling.id,
                skill: response.value
              }
            });
          }
          
          // Process help recognition
          else if (response.questionId === 'sibling_help_1') {
            insights.push({
              id: `sibling_help_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              type: this.insightTypes.SIBLING_DYNAMICS,
              title: `${sibling.name}'s Contribution Recognized`,
              description: `${respondent.name} appreciates that ${sibling.name} helps by ${response.value}.`,
              severity: 'low',
              generatedDate: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              entities: [respondent.id, sibling.id],
              actionable: true,
              actionItems: [
                `Start a "Sibling Kindness Ledger" to track helpful behaviors`,
                `Acknowledge ${sibling.name}'s contribution at family dinner`,
                `Encourage this helpful behavior with specific praise`
              ],
              confidence: 0.75,
              source: 'survey',
              siblingHelpData: {
                observer: respondent.name,
                observerId: respondent.id,
                helper: sibling.name,
                helperId: sibling.id,
                helpActivity: response.value
              }
            });
          }
          
          // Process sibling challenges
          else if (response.questionId === 'sibling_challenge_1') {
            insights.push({
              id: `sibling_challenge_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              type: this.insightTypes.SIBLING_DYNAMICS,
              title: `Challenge from ${respondent.name} to ${sibling.name}`,
              description: `${respondent.name} would like to challenge ${sibling.name} to try ${response.value}.`,
              severity: 'low',
              generatedDate: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              entities: [respondent.id, sibling.id],
              actionable: true,
              actionItems: [
                `Create a "Monthly Sibling Challenge Coupon" system for siblings to challenge each other`,
                `Help ${respondent.name} present this challenge to ${sibling.name}`,
                `Follow up to see if ${sibling.name} accepted the challenge`
              ],
              confidence: 0.65,
              source: 'survey',
              siblingChallengeData: {
                challenger: respondent.name,
                challengerId: respondent.id,
                challenged: sibling.name,
                challengedId: sibling.id,
                challenge: response.value
              }
            });
          }
        }
      }
      
      // Generate parent-focused load reduction insights if we have multiple children
      if (childMembers.length >= 2) {
        // Get some basic data about parent load
        const parentsQuery = `
          MATCH (f:family {id: $familyId})
          MATCH (p:person)-[:member_of]->(f)
          WHERE p.role = 'parent' OR p.role = 'guardian'
          RETURN p.id as id, p.name as name
        `;
        
        const parents = await this.neo4jService.executeQuery(parentsQuery, { familyId });
        
        if (parents.length > 0) {
          // Generate workload reduction insight
          insights.push({
            id: `sibling_workload_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: this.insightTypes.SIBLING_DYNAMICS,
            title: 'Reduce Parental Load Through Sibling Teaching',
            description: `Your children can help teach each other, reducing your workload while building their relationships and skills.`,
            severity: 'medium',
            generatedDate: new Date().toISOString(),
            expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            entities: [...parents.map(p => p.id), ...childMembers.map(c => c.id)],
            actionable: true,
            actionItems: [
              'Implement a "Sibling Teaching Ladder" where older siblings teach younger ones with minimal parent intervention',
              'Create a "Sibling Success Cascade" system for knowledge transfer when one child masters a skill',
              'Schedule sibling-led activities where you observe but don\'t lead'
            ],
            confidence: 0.85,
            source: 'knowledge_graph',
            parentalLoadData: {
              childCount: childMembers.length,
              parents: parents.map(p => ({ id: p.id, name: p.name })),
              children: childMembers.map(c => ({ id: c.id, name: c.name, age: c.age }))
            }
          });
        }
      }
      
      return insights;
    } catch (error) {
      console.error('Error generating sibling dynamics insights:', error);
      return [];
    }
  }
  
  /**
   * Get sibling survey responses from Firestore
   * @private
   * @param {string} familyId - Family ID
   * @returns {Promise<Array>} Sibling survey responses
   */
  async getSiblingSurveyResponses(familyId) {
    try {
      // In a real implementation, this would query Firestore for survey responses
      // For demonstration, we'll return a synthetic sample
      return [
        {
          questionId: 'sibling_talent_1',
          childId: 'child1', // The child providing this answer
          siblingId: 'child2', // The sibling they're talking about
          value: 'drawing animals'
        },
        {
          questionId: 'sibling_activity_1',
          childId: 'child2',
          siblingId: 'child1',
          value: 'a coding class'
        },
        {
          questionId: 'sibling_learn_1',
          childId: 'child1',
          siblingId: 'child2',
          value: 'how to make friendship bracelets'
        }
      ];
    } catch (error) {
      console.error('Error getting sibling survey responses:', error);
      return [];
    }
  }
  
  /**
   * Find teaching patterns between siblings
   * @private
   * @param {Array} siblingRelationships - Sibling relationship data
   * @returns {Array} Teaching patterns found
   */
  findTeachingPatterns(siblingRelationships) {
    const patterns = [];
    
    // Look for explicit teaching relationships
    for (const relationship of siblingRelationships) {
      if (relationship.influence_type === 'teacher' && 
          relationship.teaching_domains && 
          relationship.teaching_domains.length > 0) {
        
        patterns.push({
          teacher: relationship.source_name,
          teacherId: relationship.source_id,
          learner: relationship.target_name,
          learnerId: relationship.target_id,
          domains: relationship.teaching_domains,
          strength: relationship.influence_strength || 5
        });
      }
    }
    
    return patterns;
  }
  
  /**
   * Find shared interests between siblings
   * @private
   * @param {Array} siblingRelationships - Sibling relationship data
   * @returns {Array} Shared interest patterns
   */
  findSharedInterests(siblingRelationships) {
    const patterns = [];
    
    // Look for shared interests
    for (const relationship of siblingRelationships) {
      if (relationship.shared_interests && relationship.shared_interests.length > 0) {
        patterns.push({
          siblings: [relationship.source_name, relationship.target_name],
          siblingIds: [relationship.source_id, relationship.target_id],
          interests: relationship.shared_interests
        });
      }
    }
    
    return patterns;
  }
  
  /**
   * Find complementary skills between siblings
   * @private
   * @param {Array} siblingRelationships - Sibling relationship data
   * @returns {Array} Complementary skill patterns
   */
  findComplementarySkills(siblingRelationships) {
    const patterns = [];
    
    // This would require more sophisticated analysis with actual data
    // For now, we'll use a placeholder implementation
    for (const rel1 of siblingRelationships) {
      for (const rel2 of siblingRelationships) {
        // Look for pairs where sibling A teaches sibling B one thing,
        // and sibling B teaches sibling A another thing
        if (rel1.source_id === rel2.target_id && 
            rel1.target_id === rel2.source_id &&
            rel1.teaching_domains && rel2.teaching_domains &&
            rel1.teaching_domains.length > 0 && rel2.teaching_domains.length > 0) {
          
          patterns.push({
            siblings: [rel1.source_name, rel1.target_name],
            siblingIds: [rel1.source_id, rel1.target_id],
            skills: [rel1.teaching_domains[0], rel2.teaching_domains[0]]
          });
        }
      }
    }
    
    return patterns;
  }

  /**
   * Initialize the proactive engine
   * @returns {Promise<boolean>} Initialization status
   */
  async initialize() {
    try {
      await this.neo4jService.initialize();
      return true;
    } catch (error) {
      console.error('Error initializing proactive insight engine:', error);
      return false;
    }
  }
  
  /**
   * Run a full insights generation cycle for a family
   * @param {string} familyId - Family ID to generate insights for
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Generated insights
   */
  async generateInsights(familyId, options = {}) {
    try {
      // Initialize services if needed
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize proactive insight engine');
      }
      
      // Track execution
      const executionId = `exec_${Date.now()}`;
      const executionRecord = {
        id: executionId,
        familyId,
        startTime: new Date().toISOString(),
        endTime: null,
        insightCount: 0,
        notificationCount: 0,
        errors: [],
        options
      };
      
      // Save initial execution record
      await this.saveExecutionRecord(executionRecord);
      
      console.log(`Generating proactive insights for family ${familyId}`);
      
      // Generate all insights
      let allInsights = [];
      let errors = [];
      
      for (const generator of this.insightGenerators) {
        try {
          const insights = await generator(familyId, options);
          allInsights = [...allInsights, ...insights];
        } catch (error) {
          console.error(`Error in insight generator: ${generator.name}`, error);
          errors.push({
            generator: generator.name,
            error: error.message
          });
        }
      }
      
      // Save insights to database
      const savedInsights = await this.saveInsights(familyId, allInsights);
      
      // Generate notifications for actionable insights
      let notifications = [];
      if (options.generateNotifications !== false) {
        notifications = await this.generateNotifications(familyId, savedInsights);
      }
      
      // Update execution record
      executionRecord.endTime = new Date().toISOString();
      executionRecord.insightCount = savedInsights.length;
      executionRecord.notificationCount = notifications.length;
      executionRecord.errors = errors;
      
      await this.saveExecutionRecord(executionRecord);
      
      return {
        insights: savedInsights,
        notifications,
        execution: executionRecord
      };
    } catch (error) {
      console.error(`Error generating insights for family ${familyId}:`, error);
      throw error;
    }
  }
  
  /**
   * Save generated insights to the database
   * @private
   * @param {string} familyId - Family ID
   * @param {Array} insights - Insights to save
   * @returns {Promise<Array>} Saved insights with IDs
   */
  async saveInsights(familyId, insights) {
    try {
      const savedInsights = [];
      
      // Process each insight
      for (const insight of insights) {
        try {
          // Check for duplicate insights (similar title and type within 24 hours)
          const duplicateQuery = query(
            collection(db, "families", familyId, "insights"),
            where("type", "==", insight.type),
            where("title", "==", insight.title),
            where("generatedDate", ">=", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
            limit(1)
          );
          
          const duplicateSnapshot = await getDocs(duplicateQuery);
          
          if (!duplicateSnapshot.empty) {
            // Skip this insight as it's a duplicate
            continue;
          }
          
          // Add insight with timestamp
          const insightWithTimestamp = {
            ...insight,
            familyId,
            generatedDate: insight.generatedDate || new Date().toISOString(),
            status: 'active',
            seenBy: [],
            actionsCompleted: []
          };
          
          // Save to Neo4j
          if (insight.id) {
            // Update existing insight
            await this.neo4jService.createOrUpdateNode(
              'insight',
              insight.id,
              insightWithTimestamp
            );
            
            savedInsights.push(insightWithTimestamp);
          } else {
            // Add new insight to Firestore
            const insightRef = await addDoc(
              collection(db, "families", familyId, "insights"),
              insightWithTimestamp
            );
            
            // Add the ID to the insight
            const savedInsight = {
              ...insightWithTimestamp,
              id: insightRef.id
            };
            
            // Save to Neo4j for graph connections
            await this.neo4jService.createOrUpdateNode(
              'insight',
              insightRef.id,
              savedInsight
            );
            
            // Add relationships to relevant entities
            if (insight.entities && insight.entities.length > 0) {
              for (const entityId of insight.entities) {
                try {
                  // Get entity type from Neo4j
                  const entity = await this.neo4jService.getNodeById(entityId);
                  
                  if (entity) {
                    await this.neo4jService.createOrUpdateRelationship(
                      insightRef.id,
                      'insight',
                      entityId,
                      entity.type,
                      'relevant_to',
                      {
                        importance: insight.severity === 'high' ? 3 : 
                                   insight.severity === 'medium' ? 2 : 1,
                        actionable: insight.actionable || true
                      }
                    );
                  }
                } catch (err) {
                  console.warn(`Error creating relationship for insight ${insightRef.id} to entity ${entityId}:`, err);
                }
              }
            }
            
            savedInsights.push(savedInsight);
          }
        } catch (err) {
          console.error(`Error saving insight:`, err);
          // Continue with other insights
        }
      }
      
      return savedInsights;
    } catch (error) {
      console.error(`Error saving insights for family ${familyId}:`, error);
      throw error;
    }
  }
  
  /**
   * Generate notifications from actionable insights
   * @private
   * @param {string} familyId - Family ID
   * @param {Array} insights - Insights to generate notifications from
   * @returns {Promise<Array>} Generated notifications
   */
  async generateNotifications(familyId, insights) {
    try {
      const notifications = [];
      
      // Process each insight for notifications
      for (const insight of insights) {
        try {
          // Skip non-actionable insights
          if (!insight.actionable) continue;
          
          // Check notification urgency based on severity
          const urgency = insight.severity === 'high' ? 'urgent' : 
                         insight.severity === 'medium' ? 'important' : 'normal';
          
          // Create notification
          const notification = {
            familyId,
            sourceType: 'insight',
            sourceId: insight.id,
            title: insight.title,
            message: insight.description,
            type: insight.type,
            urgency,
            actionItems: insight.actionItems || [],
            entities: insight.entities || [],
            createdAt: new Date().toISOString(),
            expiresAt: insight.expirationDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            seenBy: [],
            actionsCompleted: []
          };
          
          // Save notification to Firestore
          const notificationRef = await addDoc(
            collection(db, "families", familyId, "notifications"),
            notification
          );
          
          notifications.push({
            ...notification,
            id: notificationRef.id
          });
        } catch (err) {
          console.error(`Error generating notification for insight ${insight.id}:`, err);
          // Continue with other insights
        }
      }
      
      return notifications;
    } catch (error) {
      console.error(`Error generating notifications for family ${familyId}:`, error);
      throw error;
    }
  }
  
  /**
   * Save execution record to the database
   * @private
   * @param {Object} record - Execution record
   * @returns {Promise<void>}
   */
  async saveExecutionRecord(record) {
    try {
      const recordRef = doc(db, "insightExecutions", record.id);
      await setDoc(recordRef, record);
    } catch (error) {
      console.error('Error saving execution record:', error);
    }
  }
  
  /**
   * Schedule insights generation for a family
   * @param {string} familyId - Family ID
   * @param {Object} schedule - Schedule configuration
   * @returns {Promise<Object>} Schedule information
   */
  scheduleInsightsGeneration(familyId, schedule = {}) {
    try {
      // Default to daily at midnight
      const defaultSchedule = {
        frequency: 'daily', // 'hourly', 'daily', 'weekly'
        time: '00:00',      // For daily/weekly
        dayOfWeek: 1,       // For weekly (0 = Sunday)
        immediate: true     // Run immediately after scheduling
      };
      
      const finalSchedule = { ...defaultSchedule, ...schedule };
      
      // Calculate next run time
      const nextRunTime = this.calculateNextRunTime(finalSchedule);
      
      // Create schedule object
      const scheduleId = `schedule_${familyId}_${Date.now()}`;
      const scheduleObj = {
        id: scheduleId,
        familyId,
        schedule: finalSchedule,
        nextRunTime,
        lastRunTime: null,
        enabled: true,
        createdAt: new Date().toISOString()
      };
      
      // Save schedule
      this.saveSchedule(scheduleObj);
      
      // Set up timer for next run
      this.setupScheduleTimer(scheduleObj);
      
      // Run immediately if requested
      if (finalSchedule.immediate) {
        setTimeout(() => {
          this.generateInsights(familyId, { scheduledRun: true });
        }, 100);
      }
      
      return scheduleObj;
    } catch (error) {
      console.error(`Error scheduling insights generation for family ${familyId}:`, error);
      throw error;
    }
  }
  
  /**
   * Save schedule information to the database
   * @private
   * @param {Object} schedule - Schedule object
   * @returns {Promise<void>}
   */
  async saveSchedule(schedule) {
    try {
      const scheduleRef = doc(db, "insightSchedules", schedule.id);
      await setDoc(scheduleRef, schedule);
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  }
  
  /**
   * Calculate the next run time based on schedule configuration
   * @private
   * @param {Object} schedule - Schedule configuration
   * @returns {string} ISO timestamp for next run
   */
  calculateNextRunTime(schedule) {
    const now = new Date();
    let nextRun = new Date();
    
    switch (schedule.frequency) {
      case 'hourly':
        // Round up to the next hour
        nextRun.setHours(now.getHours() + 1, 0, 0, 0);
        break;
        
      case 'daily':
        // Parse schedule time
        const [hours, minutes] = schedule.time.split(':').map(Number);
        
        // Set to today at specified time
        nextRun.setHours(hours, minutes, 0, 0);
        
        // If that time is in the past, set to tomorrow
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
        
      case 'weekly':
        // Parse schedule time
        const [weeklyHours, weeklyMinutes] = schedule.time.split(':').map(Number);
        
        // Set to specified day of week
        const dayDiff = schedule.dayOfWeek - now.getDay();
        nextRun.setDate(now.getDate() + (dayDiff < 0 ? dayDiff + 7 : dayDiff));
        nextRun.setHours(weeklyHours, weeklyMinutes, 0, 0);
        
        // If that time is in the past, set to next week
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;
        
      default:
        // Default to 24 hours from now
        nextRun.setHours(now.getHours() + 24);
    }
    
    return nextRun.toISOString();
  }
  
  /**
   * Set up timer for scheduled insight generation
   * @private
   * @param {Object} schedule - Schedule object
   */
  setupScheduleTimer(schedule) {
    // Clear existing timer if present
    if (this.scheduledJobs[schedule.id]) {
      clearTimeout(this.scheduledJobs[schedule.id]);
    }
    
    // Calculate delay until next run
    const nextRun = new Date(schedule.nextRunTime);
    const now = new Date();
    const delay = nextRun.getTime() - now.getTime();
    
    // Skip if in the past
    if (delay < 0) return;
    
    // Schedule timer
    this.scheduledJobs[schedule.id] = setTimeout(async () => {
      if (!schedule.enabled) return;
      
      try {
        // Run insights generation
        await this.generateInsights(schedule.familyId, { scheduledRun: true });
        
        // Update schedule with new next run time and last run time
        const updatedSchedule = {
          ...schedule,
          lastRunTime: new Date().toISOString(),
          nextRunTime: this.calculateNextRunTime(schedule.schedule)
        };
        
        // Save updated schedule
        await this.saveSchedule(updatedSchedule);
        
        // Set up timer for next run
        this.setupScheduleTimer(updatedSchedule);
      } catch (error) {
        console.error('Error executing scheduled insights generation:', error);
      }
    }, delay);
  }
  
  /**
   * Load and activate all schedules
   * @returns {Promise<Array>} Loaded schedules
   */
  async loadAllSchedules() {
    try {
      const schedulesRef = collection(db, "insightSchedules");
      const schedulesSnapshot = await getDocs(
        query(schedulesRef, where("enabled", "==", true))
      );
      
      const schedules = [];
      
      for (const scheduleDoc of schedulesSnapshot.docs) {
        const schedule = scheduleDoc.data();
        
        // Set up timer for each schedule
        this.setupScheduleTimer(schedule);
        
        schedules.push(schedule);
      }
      
      return schedules;
    } catch (error) {
      console.error('Error loading schedules:', error);
      throw error;
    }
  }
  
  /**
   * Stop all scheduled jobs
   */
  stopAllSchedules() {
    Object.values(this.scheduledJobs).forEach(timer => {
      clearTimeout(timer);
    });
    
    this.scheduledJobs = {};
  }
  
  /**
   * Delete a schedule
   * @param {string} scheduleId - Schedule ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteSchedule(scheduleId) {
    try {
      // Clear timer
      if (this.scheduledJobs[scheduleId]) {
        clearTimeout(this.scheduledJobs[scheduleId]);
        delete this.scheduledJobs[scheduleId];
      }
      
      // Delete from database
      const scheduleRef = doc(db, "insightSchedules", scheduleId);
      await deleteDoc(scheduleRef);
      
      return true;
    } catch (error) {
      console.error(`Error deleting schedule ${scheduleId}:`, error);
      return false;
    }
  }
  
  /**
   * Mark a notification as seen by a user
   * @param {string} familyId - Family ID
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID who saw the notification
   * @returns {Promise<boolean>} Success status
   */
  async markNotificationSeen(familyId, notificationId, userId) {
    try {
      const notificationRef = doc(db, "families", familyId, "notifications", notificationId);
      
      await updateDoc(notificationRef, {
        seenBy: arrayUnion(userId)
      });
      
      return true;
    } catch (error) {
      console.error(`Error marking notification as seen:`, error);
      return false;
    }
  }
  
  /**
   * Mark a notification action as completed
   * @param {string} familyId - Family ID
   * @param {string} notificationId - Notification ID
   * @param {string} actionIndex - Index of the action that was completed
   * @param {string} userId - User ID who completed the action
   * @returns {Promise<boolean>} Success status
   */
  async markNotificationActionCompleted(familyId, notificationId, actionIndex, userId) {
    try {
      const notificationRef = doc(db, "families", familyId, "notifications", notificationId);
      
      await updateDoc(notificationRef, {
        actionsCompleted: arrayUnion({
          actionIndex,
          userId,
          completedAt: new Date().toISOString()
        })
      });
      
      return true;
    } catch (error) {
      console.error(`Error marking notification action as completed:`, error);
      return false;
    }
  }
  
  /**
   * Dismiss a notification
   * @param {string} familyId - Family ID
   * @param {string} notificationId - Notification ID
   * @returns {Promise<boolean>} Success status
   */
  async dismissNotification(familyId, notificationId) {
    try {
      const notificationRef = doc(db, "families", familyId, "notifications", notificationId);
      
      await updateDoc(notificationRef, {
        status: 'dismissed'
      });
      
      return true;
    } catch (error) {
      console.error(`Error dismissing notification:`, error);
      return false;
    }
  }
  
  /**
   * Get active notifications for a family
   * @param {string} familyId - Family ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Active notifications
   */
  async getActiveNotifications(familyId, options = {}) {
    try {
      const notificationsRef = collection(db, "families", familyId, "notifications");
      
      let notificationQuery = query(
        notificationsRef,
        where("status", "==", "active"),
        where("expiresAt", ">", new Date().toISOString()),
        orderBy("expiresAt"),
        orderBy("createdAt", "desc")
      );
      
      // Apply limit if specified
      if (options.limit) {
        notificationQuery = query(notificationQuery, limit(options.limit));
      }
      
      // Apply urgency filter if specified
      if (options.urgency) {
        notificationQuery = query(
          notificationsRef,
          where("urgency", "==", options.urgency),
          where("status", "==", "active"),
          where("expiresAt", ">", new Date().toISOString()),
          orderBy("expiresAt"),
          orderBy("createdAt", "desc")
        );
      }
      
      const notificationsSnapshot = await getDocs(notificationQuery);
      
      return notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting active notifications:`, error);
      throw error;
    }
  }
  
  /**
   * Get all insights for a family
   * @param {string} familyId - Family ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Insights
   */
  async getInsights(familyId, options = {}) {
    try {
      const insightsRef = collection(db, "families", familyId, "insights");
      
      let insightQuery = query(
        insightsRef,
        where("status", "==", "active"),
        orderBy("generatedDate", "desc")
      );
      
      // Apply limit if specified
      if (options.limit) {
        insightQuery = query(insightQuery, limit(options.limit));
      }
      
      // Apply type filter if specified
      if (options.type) {
        insightQuery = query(
          insightsRef,
          where("type", "==", options.type),
          where("status", "==", "active"),
          orderBy("generatedDate", "desc")
        );
      }
      
      // Apply severity filter if specified
      if (options.severity) {
        insightQuery = query(
          insightsRef,
          where("severity", "==", options.severity),
          where("status", "==", "active"),
          orderBy("generatedDate", "desc")
        );
      }
      
      const insightsSnapshot = await getDocs(insightQuery);
      
      return insightsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting insights:`, error);
      throw error;
    }
  }
  
  /**
   * Get schedules for a family
   * @param {string} familyId - Family ID
   * @returns {Promise<Array>} Schedules
   */
  async getSchedulesForFamily(familyId) {
    try {
      const schedulesRef = collection(db, "insightSchedules");
      const schedulesSnapshot = await getDocs(
        query(schedulesRef, where("familyId", "==", familyId))
      );
      
      return schedulesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting schedules for family ${familyId}:`, error);
      throw error;
    }
  }
  
  /*
   * INSIGHT GENERATORS
   * 
   * These methods analyze the knowledge graph to generate specific
   * types of insights and recommendations.
   */
  
  /**
   * Generate workload balance insights
   * @param {string} familyId - Family ID
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Workload insights
   */
  async generateWorkloadInsights(familyId, options = {}) {
    try {
      const insights = [];
      
      // Cypher query to analyze task workload distribution
      const query = `
        MATCH (f:family {id: $familyId})
        MATCH (p:person)-[:member_of]->(f)
        WHERE p.role = 'parent' OR p.role = 'guardian'
        OPTIONAL MATCH (t:task)-[:assigned_to]->(p)
        WITH p, count(t) as assignedTasks,
            sum(CASE WHEN t.status = 'completed' THEN 0 ELSE coalesce(t.weight, 1) END) as workload
        RETURN p.id as personId, p.name as personName, assignedTasks, workload
        ORDER BY workload DESC
      `;
      
      const result = await this.neo4jService.executeQuery(query, { familyId });
      
      // Skip if no results
      if (result.length < 2) {
        return insights;
      }
      
      // Check for workload imbalance
      const parents = result.filter(r => r.assignedTasks > 0);
      
      if (parents.length >= 2) {
        const maxWorkload = parents[0].workload;
        const minWorkload = parents[parents.length - 1].workload;
        
        // Calculate imbalance
        const totalWorkload = parents.reduce((sum, p) => sum + p.workload, 0);
        const avgWorkload = totalWorkload / parents.length;
        const imbalanceRatio = maxWorkload / (avgWorkload || 1);
        
        // Threshold for generating an insight
        if (imbalanceRatio > 1.5 && maxWorkload > 5) {
          const mostTasksPerson = parents[0];
          const leastTasksPerson = parents[parents.length - 1];
          
          // Generate insight
          insights.push({
            type: this.insightTypes.WORKLOAD_IMBALANCE,
            title: 'Task Workload Imbalance',
            description: `${mostTasksPerson.personName} has ${Math.round((imbalanceRatio - 1) * 100)}% higher workload than the family average, while ${leastTasksPerson.personName} has a significantly lower workload.`,
            severity: imbalanceRatio > 2 ? 'high' : 'medium',
            actionable: true,
            entities: parents.map(p => p.personId),
            confidence: 0.85,
            actionItems: [
              `Redistribute ${Math.ceil((maxWorkload - avgWorkload) / 2)} tasks from ${mostTasksPerson.personName} to ${leastTasksPerson.personName}`,
              `Review task assignments at your next family meeting`,
              `Consider creating a more balanced weekly schedule`
            ]
          });
        }
        
        // Check for task type imbalance (e.g., one person doing all household tasks)
        const taskTypeQuery = `
          MATCH (f:family {id: $familyId})
          MATCH (p:person)-[:member_of]->(f)
          WHERE p.role = 'parent' OR p.role = 'guardian'
          OPTIONAL MATCH (t:task)-[:assigned_to]->(p)
          WITH p, t.taskType as taskType, count(t) as taskCount
          WHERE taskType IS NOT NULL
          RETURN p.id as personId, p.name as personName, 
                 taskType, taskCount
          ORDER BY taskCount DESC
        `;
        
        const taskTypeResult = await this.neo4jService.executeQuery(taskTypeQuery, { familyId });
        
        if (taskTypeResult.length > 0) {
          // Group by task type
          const taskTypeDistribution = {};
          
          taskTypeResult.forEach(row => {
            if (!taskTypeDistribution[row.taskType]) {
              taskTypeDistribution[row.taskType] = [];
            }
            
            taskTypeDistribution[row.taskType].push({
              personId: row.personId,
              personName: row.personName,
              taskCount: row.taskCount
            });
          });
          
          // Check each task type for imbalance
          for (const [taskType, distribution] of Object.entries(taskTypeDistribution)) {
            if (distribution.length >= 2) {
              const sorted = [...distribution].sort((a, b) => b.taskCount - a.taskCount);
              const maxCount = sorted[0].taskCount;
              const totalCount = sorted.reduce((sum, p) => sum + p.taskCount, 0);
              
              // If one person does more than 80% of a task type with at least 5 tasks
              if (maxCount / totalCount > 0.8 && totalCount >= 5) {
                insights.push({
                  type: this.insightTypes.WORKLOAD_IMBALANCE,
                  title: `${taskType} Task Imbalance`,
                  description: `${sorted[0].personName} is handling ${Math.round(maxCount / totalCount * 100)}% of all ${taskType} tasks.`,
                  severity: 'medium',
                  actionable: true,
                  entities: distribution.map(d => d.personId),
                  confidence: 0.8,
                  actionItems: [
                    `Consider redistributing some ${taskType} tasks more evenly`,
                    `Discuss this task category at your next family meeting`,
                    `Create a rotation schedule for ${taskType} tasks`
                  ]
                });
              }
            }
          }
        }
      }
      
      return insights;
    } catch (error) {
      console.error('Error generating workload insights:', error);
      return [];
    }
  }
  
  /**
   * Generate insights about upcoming events
   * @param {string} familyId - Family ID
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Event insights
   */
  async generateUpcomingEventInsights(familyId, options = {}) {
    try {
      const insights = [];
      
      // Get current date in ISO format
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Query for upcoming events
      const query = `
        MATCH (f:family {id: $familyId})
        MATCH (e:event)
        WHERE e.familyId = $familyId
          AND e.startDate >= $today
          AND e.startDate <= $nextMonth
        OPTIONAL MATCH (p:person)-[:attends]->(e)
        RETURN e.id as eventId, e.title as eventTitle, 
               e.startDate as eventDate, e.eventType as eventType,
               e.startTime as eventTime, e.location as eventLocation,
               collect(p.id) as attendeeIds, collect(p.name) as attendeeNames
        ORDER BY e.startDate, e.startTime
      `;
      
      const result = await this.neo4jService.executeQuery(query, { 
        familyId, today, nextWeek, nextMonth 
      });
      
      if (result.length === 0) {
        return insights;
      }
      
      // Group events by day
      const eventsByDay = {};
      
      result.forEach(event => {
        if (!eventsByDay[event.eventDate]) {
          eventsByDay[event.eventDate] = [];
        }
        
        eventsByDay[event.eventDate].push(event);
      });
      
      // Check for busy days (3+ events)
      for (const [date, events] of Object.entries(eventsByDay)) {
        if (events.length >= 3) {
          const eventDate = new Date(date);
          const formattedDate = eventDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          });
          
          // Get all person IDs involved in events that day
          const affectedPersons = new Set();
          events.forEach(event => {
            event.attendeeIds.forEach(id => affectedPersons.add(id));
          });
          
          insights.push({
            type: this.insightTypes.UPCOMING_EVENTS,
            title: `Busy Day: ${formattedDate}`,
            description: `You have ${events.length} events scheduled on ${formattedDate}.`,
            severity: events.length >= 5 ? 'high' : 'medium',
            actionable: true,
            entities: [...affectedPersons],
            confidence: 0.9,
            actionItems: [
              `Review your schedule for ${formattedDate}`,
              `Consider rescheduling non-essential events`,
              `Ensure transportation and logistics are planned`
            ],
            events: events.map(e => ({
              id: e.eventId,
              title: e.eventTitle,
              time: e.eventTime,
              type: e.eventType,
              attendees: e.attendeeNames
            }))
          });
        }
      }
      
      // Check for events requiring preparation
      const importantEventTypes = ['medical', 'school', 'performance', 'travel'];
      
      result.forEach(event => {
        if (importantEventTypes.includes(event.eventType)) {
          const eventDate = new Date(event.eventDate);
          const today = new Date();
          const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
          
          // Generate insight for events 2-5 days away
          if (daysUntil >= 2 && daysUntil <= 5) {
            const formattedDate = eventDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            });
            
            insights.push({
              type: this.insightTypes.UPCOMING_EVENTS,
              title: `Upcoming ${event.eventType}: ${event.eventTitle}`,
              description: `${event.eventTitle} is coming up in ${daysUntil} days (${formattedDate}).`,
              severity: daysUntil <= 3 ? 'medium' : 'low',
              actionable: true,
              entities: [event.eventId, ...event.attendeeIds],
              confidence: 0.85,
              actionItems: [
                `Confirm details for ${event.eventTitle}`,
                `Prepare any materials or documents needed`,
                `Check if transportation is arranged`
              ]
            });
          }
        }
      });
      
      return insights;
    } catch (error) {
      console.error('Error generating upcoming event insights:', error);
      return [];
    }
  }
  
  /**
   * Generate insights about tasks (overdue, recurring, etc.)
   * @param {string} familyId - Family ID
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Task insights
   */
  async generateTaskInsights(familyId, options = {}) {
    try {
      const insights = [];
      
      // Get current date in ISO format
      const today = new Date().toISOString().split('T')[0];
      
      // Query for overdue tasks
      const query = `
        MATCH (f:family {id: $familyId})
        MATCH (t:task)
        WHERE t.familyId = $familyId
          AND t.status <> 'completed'
          AND t.status <> 'cancelled'
          AND t.dueDate < $today
        OPTIONAL MATCH (t)-[:assigned_to]->(p:person)
        RETURN t.id as taskId, t.title as taskTitle, 
               t.dueDate as dueDate, t.priority as priority,
               p.id as assigneeId, p.name as assigneeName
        ORDER BY t.dueDate, t.priority DESC
      `;
      
      const result = await this.neo4jService.executeQuery(query, { familyId, today });
      
      if (result.length > 0) {
        // Group by assignee
        const tasksByAssignee = {};
        
        result.forEach(task => {
          const assignee = task.assigneeId || 'unassigned';
          
          if (!tasksByAssignee[assignee]) {
            tasksByAssignee[assignee] = [];
          }
          
          tasksByAssignee[assignee].push(task);
        });
        
        // Generate insights for each assignee with overdue tasks
        for (const [assigneeId, tasks] of Object.entries(tasksByAssignee)) {
          if (assigneeId === 'unassigned') {
            insights.push({
              type: this.insightTypes.TASK_OVERDUE,
              title: 'Unassigned Overdue Tasks',
              description: `There are ${tasks.length} overdue tasks that haven't been assigned to anyone.`,
              severity: tasks.length > 3 ? 'high' : 'medium',
              actionable: true,
              entities: tasks.map(t => t.taskId),
              confidence: 0.9,
              actionItems: [
                'Assign these tasks to family members',
                'Consider prioritizing the most important ones',
                'Some tasks may need to be rescheduled or cancelled'
              ],
              tasks: tasks.map(t => ({
                id: t.taskId,
                title: t.taskTitle,
                dueDate: t.dueDate,
                priority: t.priority
              }))
            });
          } else {
            insights.push({
              type: this.insightTypes.TASK_OVERDUE,
              title: `Overdue Tasks for ${tasks[0].assigneeName}`,
              description: `${tasks[0].assigneeName} has ${tasks.length} overdue tasks.`,
              severity: tasks.length > 5 ? 'high' : tasks.length > 2 ? 'medium' : 'low',
              actionable: true,
              entities: [assigneeId, ...tasks.map(t => t.taskId)],
              confidence: 0.9,
              actionItems: [
                `Check in with ${tasks[0].assigneeName} about these tasks`,
                'Consider redistributing some tasks if needed',
                'Help prioritize which should be done first'
              ],
              tasks: tasks.map(t => ({
                id: t.taskId,
                title: t.taskTitle,
                dueDate: t.dueDate,
                priority: t.priority
              }))
            });
          }
        }
      }
      
      // Query for upcoming high-priority tasks
      const upcomingQuery = `
        MATCH (f:family {id: $familyId})
        MATCH (t:task)
        WHERE t.familyId = $familyId
          AND t.status <> 'completed'
          AND t.status <> 'cancelled'
          AND t.dueDate >= $today
          AND t.dueDate <= $nextWeek
          AND t.priority > 3
        OPTIONAL MATCH (t)-[:assigned_to]->(p:person)
        RETURN t.id as taskId, t.title as taskTitle, 
               t.dueDate as dueDate, t.priority as priority,
               p.id as assigneeId, p.name as assigneeName
        ORDER BY t.dueDate, t.priority DESC
      `;
      
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const upcomingResult = await this.neo4jService.executeQuery(upcomingQuery, { 
        familyId, today, nextWeek 
      });
      
      if (upcomingResult.length > 0) {
        insights.push({
          type: this.insightTypes.TASK_OVERDUE,
          title: 'Upcoming High-Priority Tasks',
          description: `There are ${upcomingResult.length} high-priority tasks due in the next week.`,
          severity: upcomingResult.length > 5 ? 'medium' : 'low',
          actionable: true,
          entities: upcomingResult.map(t => t.taskId),
          confidence: 0.85,
          actionItems: [
            'Schedule time to work on these tasks soon',
            'Ensure all assignments are clear',
            'Check if any dependencies need to be resolved'
          ],
          tasks: upcomingResult.map(t => ({
            id: t.taskId,
            title: t.taskTitle,
            dueDate: t.dueDate,
            priority: t.priority,
            assignee: t.assigneeName
          }))
        });
      }
      
      return insights;
    } catch (error) {
      console.error('Error generating task insights:', error);
      return [];
    }
  }
  
  /**
   * Generate insights about child needs
   * @param {string} familyId - Family ID
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Child needs insights
   */
  async generateChildNeedsInsights(familyId, options = {}) {
    try {
      const insights = [];
      
      // Query for children without recent activities
      const query = `
        MATCH (f:family {id: $familyId})
        MATCH (child:person)-[:member_of]->(f)
        WHERE child.role = 'child'
        OPTIONAL MATCH (child)-[:attends]->(event:event)
        WHERE event.startDate >= $lastMonth AND event.startDate <= $today
        WITH child, count(event) as eventCount
        RETURN child.id as childId, child.name as childName, eventCount
      `;
      
      const today = new Date().toISOString().split('T')[0];
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const result = await this.neo4jService.executeQuery(query, { 
        familyId, today, lastMonth 
      });
      
      // Check for children with few activities
      result.forEach(child => {
        if (child.eventCount < 3) {
          insights.push({
            type: this.insightTypes.CHILD_NEEDS,
            title: `${child.childName} Needs Activities`,
            description: `${child.childName} has participated in only ${child.eventCount} activities in the past month.`,
            severity: child.eventCount === 0 ? 'medium' : 'low',
            actionable: true,
            entities: [child.childId],
            confidence: 0.75,
            actionItems: [
              `Plan some activities for ${child.childName}`,
              'Consider their interests when scheduling events',
              'Look for classes or programs they might enjoy'
            ]
          });
        }
      });
      
      // Query for children's interests
      const interestsQuery = `
        MATCH (f:family {id: $familyId})
        MATCH (child:person)-[:member_of]->(f)
        WHERE child.role = 'child'
        OPTIONAL MATCH (child)-[:interested_in]->(interest:interest)
        WITH child, collect(interest.name) as interests
        RETURN child.id as childId, child.name as childName, interests,
               size(interests) as interestCount
      `;
      
      const interestsResult = await this.neo4jService.executeQuery(interestsQuery, { familyId });
      
      // Check for children with few documented interests
      interestsResult.forEach(child => {
        if (child.interestCount < 2) {
          insights.push({
            type: this.insightTypes.CHILD_NEEDS,
            title: `Update ${child.childName}'s Interests`,
            description: `We don't have much information about ${child.childName}'s interests.`,
            severity: 'low',
            actionable: true,
            entities: [child.childId],
            confidence: 0.7,
            actionItems: [
              `Talk with ${child.childName} about their interests`,
              'Update their profile with new preferences',
              'Consider a family activity to explore new interests'
            ]
          });
        }
      });
      
      return insights;
    } catch (error) {
      console.error('Error generating child needs insights:', error);
      return [];
    }
  }
  
  /**
   * Generate insights about relationship health
   * @param {string} familyId - Family ID
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Relationship insights
   */
  async generateRelationshipInsights(familyId, options = {}) {
    try {
      const insights = [];
      
      // Query for parent-child interaction frequency
      const query = `
        MATCH (f:family {id: $familyId})
        MATCH (parent:person)-[:member_of]->(f)
        MATCH (child:person)-[:member_of]->(f)
        WHERE parent.role = 'parent' AND child.role = 'child'
        OPTIONAL MATCH (parent)-[:attends]->(event:event)<-[:attends]-(child)
        WHERE event.startDate >= $lastMonth AND event.startDate <= $today
        WITH parent, child, count(event) as sharedEvents
        RETURN parent.id as parentId, parent.name as parentName,
               child.id as childId, child.name as childName,
               sharedEvents
        ORDER BY sharedEvents
      `;
      
      const today = new Date().toISOString().split('T')[0];
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const result = await this.neo4jService.executeQuery(query, { 
        familyId, today, lastMonth 
      });
      
      // Check for low parent-child interaction
      result.forEach(relationship => {
        if (relationship.sharedEvents < 3) {
          insights.push({
            type: this.insightTypes.RELATIONSHIP_HEALTH,
            title: `${relationship.parentName} & ${relationship.childName} Connection`,
            description: `${relationship.parentName} and ${relationship.childName} have participated in only ${relationship.sharedEvents} shared activities in the past month.`,
            severity: relationship.sharedEvents === 0 ? 'medium' : 'low',
            actionable: true,
            entities: [relationship.parentId, relationship.childId],
            confidence: 0.8,
            actionItems: [
              `Plan some one-on-one time for ${relationship.parentName} and ${relationship.childName}`,
              'Consider shared interests for activities',
              'Schedule a regular weekly activity together'
            ]
          });
        }
      });
      
      // Query for couple time
      const coupleQuery = `
        MATCH (f:family {id: $familyId})
        MATCH (p1:person)-[:member_of]->(f)
        MATCH (p2:person)-[:member_of]->(f)
        WHERE p1.role = 'parent' AND p2.role = 'parent' AND p1.id < p2.id
        OPTIONAL MATCH (p1)-[:attends]->(event:event)<-[:attends]-(p2)
        WHERE NOT event.eventType = 'family'
        AND event.startDate >= $lastMonth AND event.startDate <= $today
        RETURN p1.id as parent1Id, p1.name as parent1Name,
               p2.id as parent2Id, p2.name as parent2Name,
               count(event) as coupleEvents
      `;
      
      const coupleResult = await this.neo4jService.executeQuery(coupleQuery, { 
        familyId, today, lastMonth 
      });
      
      if (coupleResult.length > 0) {
        const coupleData = coupleResult[0];
        
        if (coupleData.coupleEvents < 2) {
          insights.push({
            type: this.insightTypes.RELATIONSHIP_HEALTH,
            title: 'Couple Time Needed',
            description: `${coupleData.parent1Name} and ${coupleData.parent2Name} have had ${coupleData.coupleEvents} couple-only activities in the past month.`,
            severity: coupleData.coupleEvents === 0 ? 'medium' : 'low',
            actionable: true,
            entities: [coupleData.parent1Id, coupleData.parent2Id],
            confidence: 0.85,
            actionItems: [
              'Schedule a date night in the next week',
              'Consider trading childcare with friends for an evening',
              'Even a short walk together can strengthen your connection'
            ]
          });
        }
      }
      
      return insights;
    } catch (error) {
      console.error('Error generating relationship insights:', error);
      return [];
    }
  }
  
  /**
   * Generate insights about medical needs
   * @param {string} familyId - Family ID
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Medical insights
   */
  async generateMedicalInsights(familyId, options = {}) {
    try {
      const insights = [];
      
      // Query for upcoming medical appointments
      const query = `
        MATCH (f:family {id: $familyId})
        MATCH (event:event)
        WHERE event.familyId = $familyId AND event.eventType = 'medical'
          AND event.startDate >= $today AND event.startDate <= $nextMonth
        OPTIONAL MATCH (person:person)-[:attends]->(event)
        RETURN event.id as eventId, event.title as title,
               event.startDate as date, event.startTime as time,
               event.location as location, event.description as description,
               person.id as personId, person.name as personName
        ORDER BY event.startDate
      `;
      
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const result = await this.neo4jService.executeQuery(query, { 
        familyId, today, nextMonth, nextWeek 
      });
      
      // Generate insights for upcoming medical appointments
      result.forEach(appointment => {
        // Check how soon the appointment is
        const appointmentDate = new Date(appointment.date);
        const today = new Date();
        const daysUntil = Math.ceil((appointmentDate - today) / (1000 * 60 * 60 * 24));
        
        // Only create insights for appointments within next 7 days
        if (daysUntil <= 7) {
          insights.push({
            type: this.insightTypes.MEDICAL_REMINDER,
            title: `Medical Appointment: ${appointment.title}`,
            description: `${appointment.personName} has a medical appointment in ${daysUntil} days on ${appointment.date}${appointment.time ? ' at ' + appointment.time : ''}.`,
            severity: daysUntil <= 2 ? 'medium' : 'low',
            actionable: true,
            entities: [appointment.personId, appointment.eventId],
            confidence: 0.9,
            actionItems: [
              `Confirm the appointment time and location`,
              `Prepare any medical records or questions`,
              `Arrange transportation if needed`
            ],
            appointment: {
              id: appointment.eventId,
              title: appointment.title,
              date: appointment.date,
              time: appointment.time,
              location: appointment.location,
              description: appointment.description
            }
          });
        }
      });
      
      // Query for medication reminders
      const medicationQuery = `
        MATCH (f:family {id: $familyId})
        MATCH (medication:medication)-[:prescribed_to]->(person:person)
        WHERE medication.familyId = $familyId
        RETURN medication.id as medicationId, medication.name as medicationName,
               medication.dosage as dosage, medication.schedule as schedule,
               person.id as personId, person.name as personName
      `;
      
      const medicationResult = await this.neo4jService.executeQuery(medicationQuery, { familyId });
      
      // Generate medication reminder insights
      medicationResult.forEach(medication => {
        insights.push({
          type: this.insightTypes.MEDICAL_REMINDER,
          title: `Medication Reminder: ${medication.medicationName}`,
          description: `Reminder for ${medication.personName} to take ${medication.medicationName} (${medication.dosage}) as scheduled.`,
          severity: 'low',
          actionable: true,
          entities: [medication.personId, medication.medicationId],
          confidence: 0.85,
          actionItems: [
            `Check if ${medication.medicationName} needs to be refilled`,
            `Verify the current schedule and dosage`,
            `Consider setting up recurring calendar reminders`
          ],
          medication: {
            id: medication.medicationId,
            name: medication.medicationName,
            dosage: medication.dosage,
            schedule: medication.schedule
          }
        });
      });
      
      return insights;
    } catch (error) {
      console.error('Error generating medical insights:', error);
      return [];
    }
  }
  
  /**
   * Generate insights about documents
   * @param {string} familyId - Family ID
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Document insights
   */
  async generateDocumentInsights(familyId, options = {}) {
    try {
      const insights = [];
      
      // Query for important documents
      const query = `
        MATCH (f:family {id: $familyId})
        MATCH (doc:document)
        WHERE doc.familyId = $familyId
          AND (doc.category = 'medical' OR doc.category = 'school' OR doc.category = 'financial')
        RETURN doc.id as docId, doc.title as title, 
               doc.category as category, doc.creationDate as creationDate
        ORDER BY doc.creationDate DESC
      `;
      
      const result = await this.neo4jService.executeQuery(query, { familyId });
      
      // Check for recent important documents
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const recentDocs = result.filter(doc => doc.creationDate >= lastWeek);
      
      if (recentDocs.length > 0) {
        insights.push({
          type: this.insightTypes.DOCUMENT_UPDATE,
          title: 'Recent Important Documents',
          description: `You have ${recentDocs.length} new important documents added in the past week.`,
          severity: 'low',
          actionable: true,
          entities: recentDocs.map(doc => doc.docId),
          confidence: 0.8,
          actionItems: [
            'Review these documents and verify information',
            'File them appropriately in your document library',
            'Share with relevant family members if needed'
          ],
          documents: recentDocs.map(doc => ({
            id: doc.docId,
            title: doc.title,
            category: doc.category,
            creationDate: doc.creationDate
          }))
        });
      }
      
      return insights;
    } catch (error) {
      console.error('Error generating document insights:', error);
      return [];
    }
  }
  
  /**
   * Generate insights about milestones
   * @param {string} familyId - Family ID
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Milestone insights
   */
  async generateMilestoneInsights(familyId, options = {}) {
    try {
      const insights = [];
      
      // Query for upcoming milestones
      const query = `
        MATCH (f:family {id: $familyId})
        MATCH (milestone:milestone)
        WHERE milestone.familyId = $familyId
          AND milestone.date >= $today
          AND milestone.date <= $nextMonth
        OPTIONAL MATCH (milestone)-[:milestone_of]->(person:person)
        RETURN milestone.id as milestoneId, milestone.title as title,
               milestone.type as type, milestone.date as date,
               milestone.importance as importance,
               person.id as personId, person.name as personName
        ORDER BY milestone.date, milestone.importance DESC
      `;
      
      const today = new Date().toISOString().split('T')[0];
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const result = await this.neo4jService.executeQuery(query, { 
        familyId, today, nextMonth 
      });
      
      // Generate insights for upcoming important milestones
      result.forEach(milestone => {
        // Skip low importance milestones
        if (milestone.importance && milestone.importance < 3) {
          return;
        }
        
        const milestoneDate = new Date(milestone.date);
        const today = new Date();
        const daysUntil = Math.ceil((milestoneDate - today) / (1000 * 60 * 60 * 24));
        
        // Only create insights for milestones within next 14 days
        if (daysUntil <= 14) {
          insights.push({
            type: this.insightTypes.MILESTONE_ALERT,
            title: `Upcoming Milestone: ${milestone.title}`,
            description: `${milestone.personName ? milestone.personName + "'s" : 'A'} ${milestone.type} milestone "${milestone.title}" is coming up in ${daysUntil} days.`,
            severity: daysUntil <= 7 ? 'medium' : 'low',
            actionable: true,
            entities: milestone.personId ? [milestone.personId, milestone.milestoneId] : [milestone.milestoneId],
            confidence: 0.85,
            actionItems: [
              'Make sure this milestone is on your calendar',
              'Consider if any preparation is needed',
              'Plan how to celebrate or commemorate this occasion'
            ],
            milestone: {
              id: milestone.milestoneId,
              title: milestone.title,
              type: milestone.type,
              date: milestone.date,
              importance: milestone.importance
            }
          });
        }
      });
      
      return insights;
    } catch (error) {
      console.error('Error generating milestone insights:', error);
      return [];
    }
  }
  
  /**
   * Generate insights about scheduling conflicts
   * @param {string} familyId - Family ID
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Scheduling insights
   */
  async generateSchedulingInsights(familyId, options = {}) {
    try {
      const insights = [];
      
      // Query for potential event conflicts (events on same day for same person)
      const query = `
        MATCH (f:family {id: $familyId})
        MATCH (person:person)-[:attends]->(event1:event)
        MATCH (person)-[:attends]->(event2:event)
        WHERE event1.familyId = $familyId AND event2.familyId = $familyId
          AND event1.id <> event2.id
          AND event1.startDate = event2.startDate
          AND event1.startDate >= $today
          AND event1.startDate <= $nextWeek
        RETURN person.id as personId, person.name as personName,
               event1.id as event1Id, event1.title as event1Title,
               event1.startTime as event1Time,
               event2.id as event2Id, event2.title as event2Title,
               event2.startTime as event2Time,
               event1.startDate as eventDate
        ORDER BY event1.startDate
      `;
      
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const result = await this.neo4jService.executeQuery(query, { 
        familyId, today, nextWeek 
      });
      
      // Group conflicts by date and person
      const conflicts = {};
      
      result.forEach(conflict => {
        const key = `${conflict.personId}_${conflict.eventDate}`;
        
        if (!conflicts[key]) {
          conflicts[key] = {
            personId: conflict.personId,
            personName: conflict.personName,
            date: conflict.eventDate,
            events: []
          };
        }
        
        // Add both events if not already in the list
        const events = conflicts[key].events;
        
        if (!events.some(e => e.id === conflict.event1Id)) {
          events.push({
            id: conflict.event1Id,
            title: conflict.event1Title,
            time: conflict.event1Time
          });
        }
        
        if (!events.some(e => e.id === conflict.event2Id)) {
          events.push({
            id: conflict.event2Id,
            title: conflict.event2Title,
            time: conflict.event2Time
          });
        }
      });
      
      // Generate insights for conflicts
      for (const conflict of Object.values(conflicts)) {
        // Check for strict time conflicts (if times overlap)
        let hasTimeConflict = false;
        
        if (conflict.events.length >= 2) {
          for (let i = 0; i < conflict.events.length; i++) {
            for (let j = i + 1; j < conflict.events.length; j++) {
              const event1 = conflict.events[i];
              const event2 = conflict.events[j];
              
              // Skip if either event doesn't have a time
              if (!event1.time || !event2.time) {
                continue;
              }
              
              // Simple time comparison (would need more sophisticated logic for duration)
              if (event1.time === event2.time) {
                hasTimeConflict = true;
                break;
              }
            }
            
            if (hasTimeConflict) break;
          }
        }
        
        // Generate insight
        insights.push({
          type: this.insightTypes.SCHEDULING_CONFLICT,
          title: `${hasTimeConflict ? 'Time Conflict' : 'Busy Schedule'} for ${conflict.personName}`,
          description: `${conflict.personName} has ${conflict.events.length} events scheduled on ${conflict.date}${hasTimeConflict ? ' with overlapping times' : ''}.`,
          severity: hasTimeConflict ? 'high' : conflict.events.length > 3 ? 'medium' : 'low',
          actionable: true,
          entities: [conflict.personId, ...conflict.events.map(e => e.id)],
          confidence: hasTimeConflict ? 0.95 : 0.8,
          actionItems: [
            hasTimeConflict ? 'Resolve this scheduling conflict' : 'Review this busy schedule',
            'Consider rescheduling lower priority events',
            'Check transportation logistics between events'
          ],
          conflict: {
            personId: conflict.personId,
            personName: conflict.personName,
            date: conflict.date,
            events: conflict.events,
            hasTimeConflict
          }
        });
      }
      
      return insights;
    } catch (error) {
      console.error('Error generating scheduling insights:', error);
      return [];
    }
  }
}

export default new ProactiveInsightEngine();