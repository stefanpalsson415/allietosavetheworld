/**
 * DocumentKnowledgeExtractor.js
 * Service for extracting knowledge graphs from processed documents
 */
import { db } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

class DocumentKnowledgeExtractor {
  /**
   * Extracts a knowledge graph from a processed document
   * @param {Object} document - The processed document object
   * @param {Object} extractionResult - The result from the multimodal extraction
   * @returns {Promise<Object>} The extracted knowledge graph
   */
  async extractKnowledgeGraph(document, extractionResult) {
    try {
      // Skip extraction if insufficient data
      if (!extractionResult || !extractionResult.results) {
        console.warn('Insufficient data for knowledge graph extraction');
        return { 
          entities: [], 
          relationships: [],
          success: false,
          error: 'Insufficient extraction data'
        };
      }
      
      const { results } = extractionResult;
      const analysis = results.analysis || {};
      const data = analysis.data || {};
      
      // Extract entities based on document type
      const entities = await this.extractEntities(document, data);
      
      // Create relationships between entities
      const relationships = await this.createRelationships(entities, data);
      
      // Store the knowledge graph
      const graphId = uuidv4();
      const knowledgeGraph = {
        id: graphId,
        documentId: document.id,
        documentType: document.type || data.documentType,
        entities,
        relationships,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save to database
      await this.saveKnowledgeGraph(knowledgeGraph);
      
      return {
        ...knowledgeGraph,
        success: true
      };
    } catch (error) {
      console.error('Error extracting knowledge graph:', error);
      return {
        entities: [],
        relationships: [],
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Extract entities from document based on document type
   * @param {Object} document - The document object
   * @param {Object} data - The extracted data
   * @returns {Array} Array of entity objects
   */
  async extractEntities(document, data) {
    const entities = [];
    const documentType = document.type || data.documentType;
    
    // Common entities for all document types
    if (data.title) {
      entities.push(this.createEntity('title', data.title, 'document'));
    }
    
    if (data.date) {
      entities.push(this.createEntity('date', data.date, 'temporal'));
    }
    
    if (data.location) {
      entities.push(this.createEntity('location', data.location, 'place'));
    }
    
    // Extract entities based on document type
    switch (documentType?.toLowerCase()) {
      case 'medical':
        this.extractMedicalEntities(data, entities);
        break;
      case 'school':
        this.extractSchoolEntities(data, entities);
        break;
      case 'activity':
        this.extractActivityEntities(data, entities);
        break;
      case 'family':
        this.extractFamilyEntities(data, entities);
        break;
      case 'email':
        this.extractEmailEntities(data, entities);
        break;
      default:
        // Extract generic entities
        this.extractGenericEntities(data, entities);
    }
    
    // Extract named entities from textual content
    if (data.textContent) {
      await this.extractNamedEntities(data.textContent, entities);
    }
    
    return entities;
  }
  
  /**
   * Creates an entity object
   * @param {string} type - Type of entity
   * @param {string} value - Entity value
   * @param {string} category - Entity category
   * @returns {Object} Entity object
   */
  createEntity(type, value, category) {
    return {
      id: uuidv4(),
      type,
      value: value.toString(),
      category,
      confidence: 1.0,
      createdAt: new Date().toISOString()
    };
  }
  
  /**
   * Extract medical-specific entities
   * @param {Object} data - The extracted data
   * @param {Array} entities - Array to add entities to
   */
  extractMedicalEntities(data, entities) {
    if (data.patientName) {
      entities.push(this.createEntity('patient', data.patientName, 'person'));
    }
    
    if (data.providerName) {
      entities.push(this.createEntity('provider', data.providerName, 'person'));
    }
    
    if (data.diagnosis) {
      entities.push(this.createEntity('diagnosis', data.diagnosis, 'medical'));
    }
    
    if (data.medications && Array.isArray(data.medications)) {
      data.medications.forEach(medication => {
        entities.push(this.createEntity('medication', medication, 'medical'));
      });
    }
    
    if (data.treatmentPlan) {
      entities.push(this.createEntity('treatment', data.treatmentPlan, 'medical'));
    }
    
    if (data.appointmentDate) {
      entities.push(this.createEntity('appointment', data.appointmentDate, 'temporal'));
    }
  }
  
  /**
   * Extract school-specific entities
   * @param {Object} data - The extracted data
   * @param {Array} entities - Array to add entities to
   */
  extractSchoolEntities(data, entities) {
    if (data.schoolName) {
      entities.push(this.createEntity('school', data.schoolName, 'organization'));
    }
    
    if (data.studentName) {
      entities.push(this.createEntity('student', data.studentName, 'person'));
    }
    
    if (data.teacherName) {
      entities.push(this.createEntity('teacher', data.teacherName, 'person'));
    }
    
    if (data.className) {
      entities.push(this.createEntity('class', data.className, 'concept'));
    }
    
    if (data.eventDate) {
      entities.push(this.createEntity('event_date', data.eventDate, 'temporal'));
    }
    
    if (data.eventType) {
      entities.push(this.createEntity('event_type', data.eventType, 'concept'));
    }
    
    if (data.supplies && Array.isArray(data.supplies)) {
      data.supplies.forEach(supply => {
        entities.push(this.createEntity('supply', supply, 'object'));
      });
    }
  }
  
  /**
   * Extract activity-specific entities
   * @param {Object} data - The extracted data
   * @param {Array} entities - Array to add entities to
   */
  extractActivityEntities(data, entities) {
    if (data.activityName) {
      entities.push(this.createEntity('activity', data.activityName, 'concept'));
    }
    
    if (data.participants && Array.isArray(data.participants)) {
      data.participants.forEach(participant => {
        entities.push(this.createEntity('participant', participant, 'person'));
      });
    }
    
    if (data.equipment && Array.isArray(data.equipment)) {
      data.equipment.forEach(item => {
        entities.push(this.createEntity('equipment', item, 'object'));
      });
    }
    
    if (data.location) {
      entities.push(this.createEntity('venue', data.location, 'place'));
    }
    
    if (data.timeStart) {
      entities.push(this.createEntity('start_time', data.timeStart, 'temporal'));
    }
    
    if (data.timeEnd) {
      entities.push(this.createEntity('end_time', data.timeEnd, 'temporal'));
    }
  }
  
  /**
   * Extract family-specific entities
   * @param {Object} data - The extracted data
   * @param {Array} entities - Array to add entities to
   */
  extractFamilyEntities(data, entities) {
    if (data.familyMembers && Array.isArray(data.familyMembers)) {
      data.familyMembers.forEach(member => {
        entities.push(this.createEntity('family_member', member, 'person'));
      });
    }
    
    if (data.event) {
      entities.push(this.createEntity('family_event', data.event, 'concept'));
    }
    
    if (data.milestone) {
      entities.push(this.createEntity('milestone', data.milestone, 'concept'));
    }
    
    if (data.childName) {
      entities.push(this.createEntity('child', data.childName, 'person'));
    }
    
    if (data.parentNames && Array.isArray(data.parentNames)) {
      data.parentNames.forEach(parent => {
        entities.push(this.createEntity('parent', parent, 'person'));
      });
    }
  }
  
  /**
   * Extract email-specific entities
   * @param {Object} data - The extracted data
   * @param {Array} entities - Array to add entities to
   */
  extractEmailEntities(data, entities) {
    if (data.sender) {
      entities.push(this.createEntity('sender', data.sender, 'person'));
    }
    
    if (data.recipient) {
      entities.push(this.createEntity('recipient', data.recipient, 'person'));
    }
    
    if (data.subject) {
      entities.push(this.createEntity('subject', data.subject, 'concept'));
    }
    
    if (data.sentDate) {
      entities.push(this.createEntity('sent_date', data.sentDate, 'temporal'));
    }
    
    if (data.actionItems && Array.isArray(data.actionItems)) {
      data.actionItems.forEach(item => {
        entities.push(this.createEntity('action_item', item, 'task'));
      });
    }
  }
  
  /**
   * Extract generic entities from data
   * @param {Object} data - The extracted data
   * @param {Array} entities - Array to add entities to
   */
  extractGenericEntities(data, entities) {
    // Process any people mentioned
    if (data.people && Array.isArray(data.people)) {
      data.people.forEach(person => {
        entities.push(this.createEntity('person', person, 'person'));
      });
    }
    
    // Process any organizations mentioned
    if (data.organizations && Array.isArray(data.organizations)) {
      data.organizations.forEach(org => {
        entities.push(this.createEntity('organization', org, 'organization'));
      });
    }
    
    // Process concepts
    if (data.concepts && Array.isArray(data.concepts)) {
      data.concepts.forEach(concept => {
        entities.push(this.createEntity('concept', concept, 'concept'));
      });
    }
    
    // Process dates
    if (data.dates && Array.isArray(data.dates)) {
      data.dates.forEach(date => {
        entities.push(this.createEntity('date', date, 'temporal'));
      });
    }
  }
  
  /**
   * Extract named entities from text using basic patterns or NLP
   * @param {string} text - The text content to analyze
   * @param {Array} entities - Array to add entities to
   */
  async extractNamedEntities(text, entities) {
    // For now, using simple regex patterns for common entity types
    // In production, this should be replaced with a proper NLP service
    
    // Extract email addresses
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = text.match(emailRegex) || [];
    emails.forEach(email => {
      entities.push(this.createEntity('email', email, 'contact'));
    });
    
    // Extract phone numbers (simple pattern)
    const phoneRegex = /\b(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
    const phones = text.match(phoneRegex) || [];
    phones.forEach(phone => {
      entities.push(this.createEntity('phone', phone, 'contact'));
    });
    
    // Extract URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex) || [];
    urls.forEach(url => {
      entities.push(this.createEntity('url', url, 'web'));
    });
    
    // Extract dates (simple pattern)
    const dateRegex = /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](19|20)?\d{2}\b/g;
    const dates = text.match(dateRegex) || [];
    dates.forEach(date => {
      entities.push(this.createEntity('date', date, 'temporal'));
    });
  }
  
  /**
   * Create relationships between entities based on document data
   * @param {Array} entities - Array of extracted entities
   * @param {Object} data - The extracted data
   * @returns {Array} Array of relationship objects
   */
  async createRelationships(entities, data) {
    const relationships = [];
    
    // Skip if no entities
    if (!entities || entities.length < 2) {
      return relationships;
    }
    
    // Map entities by type for easier lookup
    const entityMap = {};
    entities.forEach(entity => {
      if (!entityMap[entity.type]) {
        entityMap[entity.type] = [];
      }
      entityMap[entity.type].push(entity);
    });
    
    // Generate relationships based on document type
    const documentType = data.documentType?.toLowerCase();
    
    // Create relationship between entities based on semantic relationships
    switch (documentType) {
      case 'medical':
        this.createMedicalRelationships(entityMap, relationships);
        break;
      case 'school':
        this.createSchoolRelationships(entityMap, relationships);
        break;
      case 'activity':
        this.createActivityRelationships(entityMap, relationships);
        break;
      case 'family':
        this.createFamilyRelationships(entityMap, relationships);
        break;
      case 'email':
        this.createEmailRelationships(entityMap, relationships);
        break;
      default:
        this.createGenericRelationships(entityMap, relationships);
    }
    
    // Create temporal relationships
    this.createTemporalRelationships(entityMap, relationships);
    
    // Create contextual relationships
    this.createContextualRelationships(entities, relationships);
    
    return relationships;
  }
  
  /**
   * Create a relationship object
   * @param {string} sourceId - Source entity ID
   * @param {string} targetId - Target entity ID
   * @param {string} type - Relationship type
   * @param {string} label - Relationship label
   * @returns {Object} Relationship object
   */
  createRelationship(sourceId, targetId, type, label) {
    return {
      id: uuidv4(),
      sourceId,
      targetId,
      type,
      label,
      confidence: 1.0,
      createdAt: new Date().toISOString()
    };
  }
  
  /**
   * Create medical-specific relationships
   * @param {Object} entityMap - Map of entities by type
   * @param {Array} relationships - Array to add relationships to
   */
  createMedicalRelationships(entityMap, relationships) {
    // Patient-Provider relationship
    if (entityMap.patient && entityMap.provider) {
      entityMap.patient.forEach(patient => {
        entityMap.provider.forEach(provider => {
          relationships.push(
            this.createRelationship(patient.id, provider.id, 'medical', 'treated_by')
          );
        });
      });
    }
    
    // Patient-Diagnosis relationship
    if (entityMap.patient && entityMap.diagnosis) {
      entityMap.patient.forEach(patient => {
        entityMap.diagnosis.forEach(diagnosis => {
          relationships.push(
            this.createRelationship(patient.id, diagnosis.id, 'medical', 'diagnosed_with')
          );
        });
      });
    }
    
    // Patient-Medication relationship
    if (entityMap.patient && entityMap.medication) {
      entityMap.patient.forEach(patient => {
        entityMap.medication.forEach(medication => {
          relationships.push(
            this.createRelationship(patient.id, medication.id, 'medical', 'prescribed')
          );
        });
      });
    }
    
    // Diagnosis-Treatment relationship
    if (entityMap.diagnosis && entityMap.treatment) {
      entityMap.diagnosis.forEach(diagnosis => {
        entityMap.treatment.forEach(treatment => {
          relationships.push(
            this.createRelationship(diagnosis.id, treatment.id, 'medical', 'treated_with')
          );
        });
      });
    }
    
    // Patient-Appointment relationship
    if (entityMap.patient && entityMap.appointment) {
      entityMap.patient.forEach(patient => {
        entityMap.appointment.forEach(appointment => {
          relationships.push(
            this.createRelationship(patient.id, appointment.id, 'temporal', 'scheduled_for')
          );
        });
      });
    }
  }
  
  /**
   * Create school-specific relationships
   * @param {Object} entityMap - Map of entities by type
   * @param {Array} relationships - Array to add relationships to
   */
  createSchoolRelationships(entityMap, relationships) {
    // Student-School relationship
    if (entityMap.student && entityMap.school) {
      entityMap.student.forEach(student => {
        entityMap.school.forEach(school => {
          relationships.push(
            this.createRelationship(student.id, school.id, 'education', 'attends')
          );
        });
      });
    }
    
    // Student-Teacher relationship
    if (entityMap.student && entityMap.teacher) {
      entityMap.student.forEach(student => {
        entityMap.teacher.forEach(teacher => {
          relationships.push(
            this.createRelationship(student.id, teacher.id, 'education', 'taught_by')
          );
        });
      });
    }
    
    // Student-Class relationship
    if (entityMap.student && entityMap.class) {
      entityMap.student.forEach(student => {
        entityMap.class.forEach(classEntity => {
          relationships.push(
            this.createRelationship(student.id, classEntity.id, 'education', 'enrolled_in')
          );
        });
      });
    }
    
    // Teacher-School relationship
    if (entityMap.teacher && entityMap.school) {
      entityMap.teacher.forEach(teacher => {
        entityMap.school.forEach(school => {
          relationships.push(
            this.createRelationship(teacher.id, school.id, 'employment', 'works_at')
          );
        });
      });
    }
    
    // Teacher-Class relationship
    if (entityMap.teacher && entityMap.class) {
      entityMap.teacher.forEach(teacher => {
        entityMap.class.forEach(classEntity => {
          relationships.push(
            this.createRelationship(teacher.id, classEntity.id, 'education', 'teaches')
          );
        });
      });
    }
    
    // Student-Event relationship
    if (entityMap.student && entityMap.event_type) {
      entityMap.student.forEach(student => {
        entityMap.event_type.forEach(event => {
          relationships.push(
            this.createRelationship(student.id, event.id, 'participation', 'participates_in')
          );
        });
      });
    }
    
    // Student-Supply relationship
    if (entityMap.student && entityMap.supply) {
      entityMap.student.forEach(student => {
        entityMap.supply.forEach(supply => {
          relationships.push(
            this.createRelationship(student.id, supply.id, 'requirement', 'needs')
          );
        });
      });
    }
  }
  
  /**
   * Create activity-specific relationships
   * @param {Object} entityMap - Map of entities by type
   * @param {Array} relationships - Array to add relationships to
   */
  createActivityRelationships(entityMap, relationships) {
    // Participant-Activity relationship
    if (entityMap.participant && entityMap.activity) {
      entityMap.participant.forEach(participant => {
        entityMap.activity.forEach(activity => {
          relationships.push(
            this.createRelationship(participant.id, activity.id, 'participation', 'participates_in')
          );
        });
      });
    }
    
    // Activity-Equipment relationship
    if (entityMap.activity && entityMap.equipment) {
      entityMap.activity.forEach(activity => {
        entityMap.equipment.forEach(equipment => {
          relationships.push(
            this.createRelationship(activity.id, equipment.id, 'requirement', 'requires')
          );
        });
      });
    }
    
    // Activity-Venue relationship
    if (entityMap.activity && entityMap.venue) {
      entityMap.activity.forEach(activity => {
        entityMap.venue.forEach(venue => {
          relationships.push(
            this.createRelationship(activity.id, venue.id, 'location', 'takes_place_at')
          );
        });
      });
    }
    
    // Activity-Time relationships
    if (entityMap.activity) {
      if (entityMap.start_time) {
        entityMap.activity.forEach(activity => {
          entityMap.start_time.forEach(time => {
            relationships.push(
              this.createRelationship(activity.id, time.id, 'temporal', 'starts_at')
            );
          });
        });
      }
      
      if (entityMap.end_time) {
        entityMap.activity.forEach(activity => {
          entityMap.end_time.forEach(time => {
            relationships.push(
              this.createRelationship(activity.id, time.id, 'temporal', 'ends_at')
            );
          });
        });
      }
    }
  }
  
  /**
   * Create family-specific relationships
   * @param {Object} entityMap - Map of entities by type
   * @param {Array} relationships - Array to add relationships to
   */
  createFamilyRelationships(entityMap, relationships) {
    // Family Member-Family Event relationship
    if (entityMap.family_member && entityMap.family_event) {
      entityMap.family_member.forEach(member => {
        entityMap.family_event.forEach(event => {
          relationships.push(
            this.createRelationship(member.id, event.id, 'participation', 'participates_in')
          );
        });
      });
    }
    
    // Child-Parent relationship
    if (entityMap.child && entityMap.parent) {
      entityMap.child.forEach(child => {
        entityMap.parent.forEach(parent => {
          relationships.push(
            this.createRelationship(child.id, parent.id, 'family', 'child_of')
          );
        });
      });
    }
    
    // Family Member-Milestone relationship
    if (entityMap.family_member && entityMap.milestone) {
      entityMap.family_member.forEach(member => {
        entityMap.milestone.forEach(milestone => {
          relationships.push(
            this.createRelationship(member.id, milestone.id, 'achievement', 'achieved')
          );
        });
      });
    }
  }
  
  /**
   * Create email-specific relationships
   * @param {Object} entityMap - Map of entities by type
   * @param {Array} relationships - Array to add relationships to
   */
  createEmailRelationships(entityMap, relationships) {
    // Sender-Recipient relationship
    if (entityMap.sender && entityMap.recipient) {
      entityMap.sender.forEach(sender => {
        entityMap.recipient.forEach(recipient => {
          relationships.push(
            this.createRelationship(sender.id, recipient.id, 'communication', 'sent_to')
          );
        });
      });
    }
    
    // Sender-Subject relationship
    if (entityMap.sender && entityMap.subject) {
      entityMap.sender.forEach(sender => {
        entityMap.subject.forEach(subject => {
          relationships.push(
            this.createRelationship(sender.id, subject.id, 'communication', 'wrote_about')
          );
        });
      });
    }
    
    // Sender-Action Item relationship
    if (entityMap.sender && entityMap.action_item) {
      entityMap.sender.forEach(sender => {
        entityMap.action_item.forEach(item => {
          relationships.push(
            this.createRelationship(sender.id, item.id, 'task', 'requested')
          );
        });
      });
    }
    
    // Email-Date relationship
    if (entityMap.subject && entityMap.sent_date) {
      entityMap.subject.forEach(subject => {
        entityMap.sent_date.forEach(date => {
          relationships.push(
            this.createRelationship(subject.id, date.id, 'temporal', 'sent_on')
          );
        });
      });
    }
  }
  
  /**
   * Create generic relationships between entities
   * @param {Object} entityMap - Map of entities by type
   * @param {Array} relationships - Array to add relationships to
   */
  createGenericRelationships(entityMap, relationships) {
    // Person-Organization relationship
    if (entityMap.person && entityMap.organization) {
      entityMap.person.forEach(person => {
        entityMap.organization.forEach(org => {
          relationships.push(
            this.createRelationship(person.id, org.id, 'association', 'associated_with')
          );
        });
      });
    }
    
    // Person-Concept relationship
    if (entityMap.person && entityMap.concept) {
      entityMap.person.forEach(person => {
        entityMap.concept.forEach(concept => {
          relationships.push(
            this.createRelationship(person.id, concept.id, 'interest', 'interested_in')
          );
        });
      });
    }
    
    // Title-Content relationships
    if (entityMap.title) {
      // Connect title to all non-title entities
      entityMap.title.forEach(title => {
        Object.entries(entityMap).forEach(([type, typeEntities]) => {
          if (type !== 'title') {
            typeEntities.forEach(entity => {
              relationships.push(
                this.createRelationship(title.id, entity.id, 'content', 'contains')
              );
            });
          }
        });
      });
    }
  }
  
  /**
   * Create temporal relationships between entities
   * @param {Object} entityMap - Map of entities by type
   * @param {Array} relationships - Array to add relationships to
   */
  createTemporalRelationships(entityMap, relationships) {
    // Connect all temporal entities to relevant non-temporal entities
    const temporalTypes = ['date', 'temporal', 'start_time', 'end_time', 'appointment', 'sent_date', 'event_date'];
    
    temporalTypes.forEach(temporalType => {
      if (entityMap[temporalType]) {
        entityMap[temporalType].forEach(temporal => {
          Object.entries(entityMap).forEach(([type, typeEntities]) => {
            // Skip connecting temporal entities to other temporal entities
            if (!temporalTypes.includes(type)) {
              typeEntities.forEach(entity => {
                // Skip if already has a specific temporal relationship
                const hasSpecificTemporal = relationships.some(
                  r => (r.sourceId === entity.id && r.targetId === temporal.id) || 
                       (r.sourceId === temporal.id && r.targetId === entity.id)
                );
                
                if (!hasSpecificTemporal) {
                  relationships.push(
                    this.createRelationship(entity.id, temporal.id, 'temporal', 'occurs_on')
                  );
                }
              });
            }
          });
        });
      }
    });
  }
  
  /**
   * Create contextual relationships between entities based on semantic similarity
   * @param {Array} entities - Array of all entities
   * @param {Array} relationships - Array to add relationships to
   */
  createContextualRelationships(entities, relationships) {
    // For now, create simple relationships based on entity categories
    const categoryGroups = {};
    
    // Group entities by category
    entities.forEach(entity => {
      if (!categoryGroups[entity.category]) {
        categoryGroups[entity.category] = [];
      }
      categoryGroups[entity.category].push(entity);
    });
    
    // Create relationships between entities in the same category
    Object.values(categoryGroups).forEach(group => {
      if (group.length > 1) {
        for (let i = 0; i < group.length; i++) {
          for (let j = i + 1; j < group.length; j++) {
            // Skip if already has a more specific relationship
            const hasSpecificRelation = relationships.some(
              r => (r.sourceId === group[i].id && r.targetId === group[j].id) || 
                   (r.sourceId === group[j].id && r.targetId === group[i].id)
            );
            
            if (!hasSpecificRelation) {
              relationships.push(
                this.createRelationship(group[i].id, group[j].id, 'semantic', 'related_to')
              );
            }
          }
        }
      }
    });
  }
  
  /**
   * Save knowledge graph to database
   * @param {Object} knowledgeGraph - The knowledge graph to save
   * @returns {Promise<void>}
   */
  async saveKnowledgeGraph(knowledgeGraph) {
    try {
      // Save to Firestore
      await db.collection('knowledgeGraphs').doc(knowledgeGraph.id).set(knowledgeGraph);
      
      // Add reference to document
      await db.collection('documents').doc(knowledgeGraph.documentId).update({
        knowledgeGraphId: knowledgeGraph.id,
        hasKnowledgeGraph: true,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`Knowledge graph ${knowledgeGraph.id} saved successfully`);
    } catch (error) {
      console.error('Error saving knowledge graph:', error);
      throw error;
    }
  }
  
  /**
   * Get knowledge graph by document ID
   * @param {string} documentId - Document ID to get knowledge graph for
   * @returns {Promise<Object>} The knowledge graph
   */
  async getKnowledgeGraphByDocumentId(documentId) {
    try {
      const snapshot = await db.collection('knowledgeGraphs')
        .where('documentId', '==', documentId)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return null;
      }
      
      return snapshot.docs[0].data();
    } catch (error) {
      console.error('Error getting knowledge graph:', error);
      throw error;
    }
  }
  
  /**
   * Merge knowledge graphs from multiple documents
   * @param {Array<string>} documentIds - Array of document IDs to merge graphs from
   * @returns {Promise<Object>} The merged knowledge graph
   */
  async mergeKnowledgeGraphs(documentIds) {
    try {
      const graphs = [];
      
      // Get all knowledge graphs
      for (const docId of documentIds) {
        const graph = await this.getKnowledgeGraphByDocumentId(docId);
        if (graph) {
          graphs.push(graph);
        }
      }
      
      if (graphs.length === 0) {
        return {
          entities: [],
          relationships: [],
          success: false,
          error: 'No knowledge graphs found'
        };
      }
      
      // Merge entities
      const mergedEntities = [];
      const entityMap = new Map(); // To track duplicates
      
      graphs.forEach(graph => {
        graph.entities.forEach(entity => {
          // Use value+type as a simple deduplication key
          const key = `${entity.type}:${entity.value.toLowerCase()}`;
          
          if (!entityMap.has(key)) {
            entityMap.set(key, entity);
            mergedEntities.push(entity);
          }
        });
      });
      
      // Merge relationships, updating IDs as needed
      const mergedRelationships = [];
      const relationshipMap = new Map(); // To track duplicates
      
      graphs.forEach(graph => {
        graph.relationships.forEach(rel => {
          // Find the new entity IDs (in case entities were deduplicated)
          const sourceEntity = graph.entities.find(e => e.id === rel.sourceId);
          const targetEntity = graph.entities.find(e => e.id === rel.targetId);
          
          if (sourceEntity && targetEntity) {
            const sourceKey = `${sourceEntity.type}:${sourceEntity.value.toLowerCase()}`;
            const targetKey = `${targetEntity.type}:${targetEntity.value.toLowerCase()}`;
            
            const newSourceEntity = entityMap.get(sourceKey);
            const newTargetEntity = entityMap.get(targetKey);
            
            if (newSourceEntity && newTargetEntity) {
              // Create a key for the relationship
              const relKey = `${newSourceEntity.id}:${newTargetEntity.id}:${rel.type}`;
              
              if (!relationshipMap.has(relKey)) {
                const newRel = {
                  ...rel,
                  sourceId: newSourceEntity.id,
                  targetId: newTargetEntity.id
                };
                relationshipMap.set(relKey, newRel);
                mergedRelationships.push(newRel);
              }
            }
          }
        });
      });
      
      // Create the merged graph
      const mergedGraph = {
        id: uuidv4(),
        documentIds: documentIds,
        entities: mergedEntities,
        relationships: mergedRelationships,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isMerged: true
      };
      
      // Save the merged graph
      await db.collection('knowledgeGraphs').doc(mergedGraph.id).set(mergedGraph);
      
      return {
        ...mergedGraph,
        success: true
      };
    } catch (error) {
      console.error('Error merging knowledge graphs:', error);
      return {
        entities: [],
        relationships: [],
        success: false,
        error: error.message
      };
    }
  }
}

export default new DocumentKnowledgeExtractor();