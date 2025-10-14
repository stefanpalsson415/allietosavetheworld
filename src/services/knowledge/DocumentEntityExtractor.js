/**
 * DocumentEntityExtractor.js
 * 
 * Specialized entity extractor for documents (both structured and unstructured).
 * Analyzes document content to extract entities and relationships.
 */

import EntityExtractor from './EntityExtractor';

class DocumentEntityExtractor extends EntityExtractor {
  constructor() {
    super();
    
    // Category handlers to customize extraction for different document types
    this.categoryHandlers = {
      'medical': this.extractMedicalEntities.bind(this),
      'school': this.extractSchoolEntities.bind(this),
      'activity': this.extractActivityEntities.bind(this),
      'financial': this.extractFinancialEntities.bind(this),
      'email': this.extractEmailEntities.bind(this),
      'calendar': this.extractCalendarEntities.bind(this)
    };
    
    // Document type detection patterns
    this.documentTypePatterns = [
      { 
        type: 'medical', 
        keywords: ['patient', 'diagnosis', 'prescription', 'doctor', 'hospital', 'medical', 'healthcare', 'treatment', 'appointment'],
        confidence: 0.8
      },
      { 
        type: 'school', 
        keywords: ['school', 'teacher', 'grade', 'class', 'homework', 'assignment', 'student', 'course', 'curriculum', 'education'],
        confidence: 0.8
      },
      { 
        type: 'activity', 
        keywords: ['activity', 'sport', 'practice', 'game', 'tournament', 'coach', 'equipment', 'team', 'lesson', 'club'],
        confidence: 0.7
      },
      { 
        type: 'financial', 
        keywords: ['invoice', 'payment', 'amount', 'due', 'balance', 'transaction', 'bill', 'receipt', 'cost', 'expense'],
        confidence: 0.85
      },
      { 
        type: 'email', 
        keywords: ['email', 'sender', 'recipient', 'reply', 'forward', 'sent', 'received', 'message', 'subject'],
        confidence: 0.9
      },
      { 
        type: 'calendar', 
        keywords: ['event', 'schedule', 'appointment', 'meeting', 'reminder', 'calendar', 'date', 'time', 'duration'],
        confidence: 0.8
      }
    ];
  }
  
  /**
   * Extract entities from document
   * @param {Object} document - The document to analyze
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction result with entities and relationships
   */
  async extract(document, options = {}) {
    const result = {
      entities: [],
      relationships: [],
      metadata: {
        source: document.id || 'unknown',
        extractorVersion: '1.0',
        timestamp: new Date().toISOString(),
        documentType: null,
        confidenceScore: 0
      }
    };
    
    try {
      // Get document content based on type
      let content;
      
      if (typeof document === 'string') {
        // Plain text
        content = document;
      } else if (document.content) {
        // Document with content field
        content = document.content;
      } else if (document.text) {
        // Document with text field
        content = document.text;
      } else if (document.extractedText) {
        // Document with extracted text (OCR)
        content = document.extractedText;
      } else {
        // Try to stringify the document as fallback
        content = JSON.stringify(document);
      }
      
      // Detect document category if not provided
      let documentCategory = options.documentCategory;
      
      if (!documentCategory) {
        documentCategory = this.detectDocumentCategory(content);
        result.metadata.documentType = documentCategory.type;
        result.metadata.confidenceScore = documentCategory.confidence;
      } else {
        result.metadata.documentType = documentCategory;
        result.metadata.confidenceScore = 1.0;
      }
      
      // Extract document entity
      const documentEntity = this.createEntity('document', {
        title: document.title || document.name || `Document ${new Date().toISOString()}`,
        description: document.description || '',
        category: documentCategory.type || documentCategory,
        content: content.substring(0, 500) + (content.length > 500 ? '...' : ''), // Store preview only
        fileType: document.fileType || document.mimeType || 'text/plain',
        creationDate: document.creationDate || document.created || new Date().toISOString()
      });
      
      if (documentEntity) {
        documentEntity.id = document.id || `doc_${Date.now()}`;
        result.entities.push(documentEntity);
      }
      
      // Call appropriate category handler
      const category = documentCategory.type || documentCategory;
      
      if (this.categoryHandlers[category]) {
        const categoryResults = await this.categoryHandlers[category](content, document, options);
        
        // Add category-specific entities
        if (categoryResults.entities && categoryResults.entities.length > 0) {
          result.entities.push(...categoryResults.entities);
        }
        
        // Add category-specific relationships
        if (categoryResults.relationships && categoryResults.relationships.length > 0) {
          result.relationships.push(...categoryResults.relationships);
        }
      }
      
      // Extract common entities
      const commonEntities = await this.extractCommonEntities(content, options);
      
      if (commonEntities.entities && commonEntities.entities.length > 0) {
        result.entities.push(...commonEntities.entities);
      }
      
      if (commonEntities.relationships && commonEntities.relationships.length > 0) {
        result.relationships.push(...commonEntities.relationships);
      }
      
      // Create document relationships to extracted entities
      // For each entity that's not the document itself, create a reference relationship
      result.entities.forEach(entity => {
        if (entity.id !== documentEntity.id && entity.type !== 'document') {
          result.relationships.push(
            this.createRelationship(
              documentEntity.id,
              entity.id,
              'references',
              {
                context: `Document references ${entity.type} in content`,
                confidence: entity.metadata.confidence || 0.7
              },
              entity.metadata.confidence || 0.7
            )
          );
        }
      });
      
      return result;
    } catch (error) {
      console.error('Error extracting entities from document:', error);
      result.metadata.error = error.message;
      return result;
    }
  }
  
  /**
   * Detect document category based on content
   * @param {string} content - Document content
   * @returns {Object} Detected category with type and confidence
   */
  detectDocumentCategory(content) {
    const normalizedContent = content.toLowerCase();
    const categoryScores = [];
    
    // Calculate score for each category
    this.documentTypePatterns.forEach(pattern => {
      let matchCount = 0;
      let totalKeywords = pattern.keywords.length;
      
      pattern.keywords.forEach(keyword => {
        // Count occurrences
        const occurrences = (normalizedContent.match(new RegExp('\\b' + keyword + '\\b', 'gi')) || []).length;
        if (occurrences > 0) {
          matchCount++;
        }
      });
      
      const matchRatio = matchCount / totalKeywords;
      const score = matchRatio * pattern.confidence;
      
      categoryScores.push({
        type: pattern.type,
        score,
        matchCount,
        totalKeywords
      });
    });
    
    // Sort by score descending
    categoryScores.sort((a, b) => b.score - a.score);
    
    // Return the highest scoring category
    const bestMatch = categoryScores[0];
    
    if (bestMatch && bestMatch.score > 0.3) {
      return {
        type: bestMatch.type,
        confidence: bestMatch.score,
        matchRatio: bestMatch.matchCount / bestMatch.totalKeywords
      };
    }
    
    // Default to generic document if no strong match
    return {
      type: 'generic',
      confidence: 0.5
    };
  }
  
  /**
   * Extract common entities from any document
   * @param {string} content - Document content
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction result
   */
  async extractCommonEntities(content, options = {}) {
    const result = {
      entities: [],
      relationships: []
    };
    
    try {
      // Extract dates
      const dates = this.extractDates(content);
      
      // Extract times
      const times = this.extractTimes(content);
      
      // Extract locations
      const locations = this.extractLocations(content, options.knownLocations || []);
      
      // Extract people
      const people = this.extractPeople(content, options.knownPeople || []);
      
      // Add location entities
      locations.forEach(location => {
        if (location.type === 'extracted_location' && location.confidence >= this.confidenceThreshold) {
          const locationEntity = this.createEntity('location', {
            name: location.name,
            type: 'extracted',
            source: 'document'
          }, location.confidence);
          
          locationEntity.id = this.generateReferenceId('location', location.name);
          result.entities.push(locationEntity);
        }
      });
      
      // Add person entities
      people.forEach(person => {
        if (person.type === 'extracted_person' && person.confidence >= this.confidenceThreshold) {
          const personEntity = this.createEntity('person', {
            name: person.name,
            source: 'document'
          }, person.confidence);
          
          personEntity.id = this.generateReferenceId('person', person.name);
          result.entities.push(personEntity);
        }
      });
      
      // If we have both dates and times, try to create events
      if (dates.length > 0 && times.length > 0) {
        // Find dates and times that are close to each other in the text
        dates.forEach(date => {
          const nearbyTimes = times.filter(time => 
            Math.abs(time.position.start - date.position.end) < 10 ||
            Math.abs(date.position.start - time.position.end) < 10
          );
          
          if (nearbyTimes.length > 0) {
            // Get the most confident time
            const bestTime = nearbyTimes.sort((a, b) => b.confidence - a.confidence)[0];
            
            // Create event entity
            const eventEntity = this.createEntity('event', {
              title: `Event on ${date.value} at ${bestTime.value}`,
              startDate: date.value,
              startTime: bestTime.value,
              description: content.substring(
                Math.max(0, Math.min(date.position.start, bestTime.position.start) - 20),
                Math.min(content.length, Math.max(date.position.end, bestTime.position.end) + 20)
              ),
              source: 'document'
            }, Math.min(date.confidence, bestTime.confidence) * 0.9);
            
            if (eventEntity) {
              eventEntity.id = this.generateReferenceId('event', `${date.value}_${bestTime.value}`);
              result.entities.push(eventEntity);
              
              // Associate with nearby people and locations
              people.forEach(person => {
                if (Math.abs(person.position.start - date.position.start) < 100) {
                  result.relationships.push(
                    this.createRelationship(
                      person.id,
                      eventEntity.id,
                      'attends',
                      {
                        role: 'participant',
                        confidence: Math.min(person.confidence, eventEntity.metadata.confidence) * 0.8
                      },
                      Math.min(person.confidence, eventEntity.metadata.confidence) * 0.8
                    )
                  );
                }
              });
              
              locations.forEach(location => {
                if (Math.abs(location.position.start - date.position.start) < 100) {
                  result.relationships.push(
                    this.createRelationship(
                      eventEntity.id,
                      location.id,
                      'occurs_at',
                      {
                        confidence: Math.min(location.confidence, eventEntity.metadata.confidence) * 0.8
                      },
                      Math.min(location.confidence, eventEntity.metadata.confidence) * 0.8
                    )
                  );
                }
              });
            }
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error extracting common entities:', error);
      return result;
    }
  }
  
  /**
   * Extract medical entities from document
   * @param {string} content - Document content
   * @param {Object} document - Original document
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction result
   */
  async extractMedicalEntities(content, document, options = {}) {
    const result = {
      entities: [],
      relationships: []
    };
    
    try {
      // Extract medical appointment information
      const appointmentInfo = this.extractMedicalAppointmentInfo(content);
      
      if (appointmentInfo) {
        // Create provider entity if found
        if (appointmentInfo.providerName) {
          const providerEntity = this.createEntity('provider', {
            name: appointmentInfo.providerName,
            type: 'medical',
            specialties: appointmentInfo.specialty ? [appointmentInfo.specialty] : []
          }, appointmentInfo.confidence);
          
          providerEntity.id = this.generateReferenceId('provider', appointmentInfo.providerName);
          result.entities.push(providerEntity);
        }
        
        // Create appointment entity
        if (appointmentInfo.date) {
          const appointmentEntity = this.createEntity('event', {
            title: appointmentInfo.reason || `Medical Appointment`,
            description: appointmentInfo.notes || '',
            startDate: appointmentInfo.date,
            startTime: appointmentInfo.time,
            location: appointmentInfo.location,
            eventType: 'medical',
            status: 'confirmed'
          }, appointmentInfo.confidence);
          
          appointmentEntity.id = this.generateReferenceId('appointment', `medical_${appointmentInfo.date}_${appointmentInfo.time || ''}`);
          result.entities.push(appointmentEntity);
          
          // Create relationships
          if (appointmentInfo.providerName) {
            const providerId = this.generateReferenceId('provider', appointmentInfo.providerName);
            
            result.relationships.push(
              this.createRelationship(
                providerId,
                appointmentEntity.id,
                'hosts',
                {
                  primary: true
                },
                appointmentInfo.confidence * 0.9
              )
            );
          }
          
          if (appointmentInfo.patientName) {
            const patientId = options.knownPeople ? 
              options.knownPeople.find(p => p.name === appointmentInfo.patientName)?.id :
              this.generateReferenceId('person', appointmentInfo.patientName);
            
            if (patientId) {
              result.relationships.push(
                this.createRelationship(
                  patientId,
                  appointmentEntity.id,
                  'attends',
                  {
                    role: 'patient',
                    required: true
                  },
                  appointmentInfo.confidence * 0.9
                )
              );
            }
          }
        }
        
        // Extract medications if any
        const medications = this.extractMedications(content);
        
        medications.forEach(medication => {
          const medicationEntity = this.createEntity('medication', {
            name: medication.name,
            dosage: medication.dosage,
            schedule: medication.schedule,
            instructions: medication.instructions,
            purpose: medication.purpose
          }, medication.confidence);
          
          medicationEntity.id = this.generateReferenceId('medication', medication.name);
          result.entities.push(medicationEntity);
          
          // Link to patient if available
          if (appointmentInfo.patientName) {
            const patientId = options.knownPeople ? 
              options.knownPeople.find(p => p.name === appointmentInfo.patientName)?.id :
              this.generateReferenceId('person', appointmentInfo.patientName);
            
            if (patientId) {
              result.relationships.push(
                this.createRelationship(
                  medicationEntity.id,
                  patientId,
                  'prescribed_to',
                  {
                    start_date: appointmentInfo.date
                  },
                  medication.confidence * 0.8
                )
              );
            }
          }
          
          // Link to provider if available
          if (appointmentInfo.providerName) {
            const providerId = this.generateReferenceId('provider', appointmentInfo.providerName);
            
            result.relationships.push(
              this.createRelationship(
                medicationEntity.id,
                providerId,
                'provided_by',
                {
                  date: appointmentInfo.date
                },
                medication.confidence * 0.8
              )
            );
          }
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error extracting medical entities:', error);
      return result;
    }
  }
  
  /**
   * Extract medication information from text
   * @param {string} text - Text to analyze
   * @returns {Array} Array of medication objects
   */
  extractMedications(text) {
    const medications = [];
    
    // Basic medication extraction - pattern matching
    // In production, would use a medical NER model
    
    // Pattern for "Medication name, dosage, instructions"
    const medicationPattern = /(?:prescribed|taking|take)\s+([A-Z][a-zA-Z\-']*(?:\s+[A-Z][a-zA-Z\-']*)?)\s+(?:(\d+(?:\.\d+)?)\s*(mg|ml|mcg|g))?\s*(?:(\d+(?:-\d+)?)\s+times?(?: a| per)?\s+(day|daily|week|month))?/gi;
    
    const matches = [...text.matchAll(medicationPattern)];
    
    matches.forEach(match => {
      const medicationName = match[1];
      const dosage = match[2] ? `${match[2]} ${match[3] || ''}` : null;
      const frequency = match[4] ? `${match[4]} times per ${match[5]}` : null;
      
      // Look for purpose near the medication mention
      const contextStart = Math.max(0, match.index - 50);
      const contextEnd = Math.min(text.length, match.index + match[0].length + 50);
      const context = text.substring(contextStart, contextEnd);
      
      // Look for purpose pattern like "for treating X" or "to treat X"
      const purposeMatch = context.match(/(?:for|to)(?:\s+(?:treat|treating|help|helping|manage|managing|control|controlling))?\s+([a-z\s\-]+?)(?:\.|\,|\s+and|\s+or)/i);
      const purpose = purposeMatch ? purposeMatch[1].trim() : null;
      
      // Look for instructions
      const instructionsMatch = context.match(/(?:take|taking)(?:\s+it)?\s+([^\.]+)/i);
      const instructions = instructionsMatch ? instructionsMatch[1].trim() : null;
      
      // Create schedule object
      const schedule = {};
      if (frequency) {
        schedule.frequency = frequency;
      }
      
      medications.push({
        name: medicationName,
        dosage,
        schedule,
        instructions,
        purpose,
        confidence: 0.75
      });
    });
    
    return medications;
  }
  
  /**
   * Extract medical appointment information from text
   * @param {string} text - Text to analyze
   * @returns {Object} Appointment information object
   */
  extractMedicalAppointmentInfo(text) {
    // Look for appointment patterns
    const appointmentPattern = /appointment(?:\s+(?:with|for))?\s+(?:Dr\.|Doctor)?\s+([A-Z][a-zA-Z\-'\s]+)(?:\s+on\s+([a-zA-Z]+\s+\d+(?:st|nd|rd|th)?,\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}\-\d{1,2}\-\d{4}))?(?:\s+at\s+(\d{1,2}:\d{2}(?:\s*[ap]m)?|\d{1,2}\s*[ap]m))?/i;
    
    const appointmentMatch = text.match(appointmentPattern);
    
    if (appointmentMatch) {
      const appointmentInfo = {
        providerName: appointmentMatch[1]?.trim(),
        date: appointmentMatch[2]?.trim(),
        time: appointmentMatch[3]?.trim(),
        confidence: 0.8
      };
      
      // Look for patient name
      const patientPattern = /(?:patient|appointment for):?\s+([A-Z][a-zA-Z\-'\s]+)(?=[\.,\s])/i;
      const patientMatch = text.match(patientPattern);
      
      if (patientMatch) {
        appointmentInfo.patientName = patientMatch[1].trim();
      }
      
      // Look for location
      const locationPattern = /(?:at|location):\s+([A-Z][a-zA-Z\-'\s]+)(?=[\.,\s])/i;
      const locationMatch = text.match(locationPattern);
      
      if (locationMatch) {
        appointmentInfo.location = locationMatch[1].trim();
      }
      
      // Look for specialty
      const specialtyPattern = /(?:specialist|specializing in|speciality):\s+([A-Za-z\-'\s]+)(?=[\.,\s])/i;
      const specialtyMatch = text.match(specialtyPattern);
      
      if (specialtyMatch) {
        appointmentInfo.specialty = specialtyMatch[1].trim();
      }
      
      // Look for appointment reason
      const reasonPattern = /(?:reason|regarding|for):\s+([A-Za-z\-'\s]+)(?=[\.,\s])/i;
      const reasonMatch = text.match(reasonPattern);
      
      if (reasonMatch) {
        appointmentInfo.reason = reasonMatch[1].trim();
      }
      
      // Look for notes
      const notesPattern = /notes:\s+([^\.]+)/i;
      const notesMatch = text.match(notesPattern);
      
      if (notesMatch) {
        appointmentInfo.notes = notesMatch[1].trim();
      }
      
      return appointmentInfo;
    }
    
    return null;
  }
  
  /**
   * Extract school entities from document
   * @param {string} content - Document content
   * @param {Object} document - Original document
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction result
   */
  async extractSchoolEntities(content, document, options = {}) {
    // Implementation for school documents
    // Similar to medical but with school-specific entities
    
    // For brevity, returning an empty result
    return { entities: [], relationships: [] };
  }
  
  /**
   * Extract activity entities from document
   * @param {string} content - Document content
   * @param {Object} document - Original document
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction result
   */
  async extractActivityEntities(content, document, options = {}) {
    // Implementation for activity documents
    // Similar to medical but with activity-specific entities
    
    // For brevity, returning an empty result
    return { entities: [], relationships: [] };
  }
  
  /**
   * Extract financial entities from document
   * @param {string} content - Document content
   * @param {Object} document - Original document
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction result
   */
  async extractFinancialEntities(content, document, options = {}) {
    // Implementation for financial documents
    // Would extract payment amounts, invoices, etc.
    
    // For brevity, returning an empty result
    return { entities: [], relationships: [] };
  }
  
  /**
   * Extract email entities from document
   * @param {string} content - Document content
   * @param {Object} document - Original document
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction result
   */
  async extractEmailEntities(content, document, options = {}) {
    // Implementation for email documents
    // Would extract sender, recipient, subject, etc.
    
    // For brevity, returning an empty result
    return { entities: [], relationships: [] };
  }
  
  /**
   * Extract calendar entities from document
   * @param {string} content - Document content
   * @param {Object} document - Original document
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction result
   */
  async extractCalendarEntities(content, document, options = {}) {
    // Implementation for calendar documents
    // Would extract events, schedules, etc.
    
    // For brevity, returning an empty result
    return { entities: [], relationships: [] };
  }
}

export default DocumentEntityExtractor;