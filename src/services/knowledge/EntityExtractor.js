/**
 * EntityExtractor.js
 * 
 * Base class for entity extraction from various content types.
 * Provides a framework for specialized extractors to identify entities and relationships.
 */

import { ENTITY_TYPES, RELATIONSHIP_TYPES } from './FamilyKnowledgeOntology';

class EntityExtractor {
  constructor() {
    this.entityTypes = Object.keys(ENTITY_TYPES).map(key => ENTITY_TYPES[key].name);
    this.relationshipTypes = Object.keys(RELATIONSHIP_TYPES).map(key => RELATIONSHIP_TYPES[key].name);
    this.confidenceThreshold = 0.6; // Minimum confidence to include an extraction
  }
  
  /**
   * Extract entities from generic content
   * @param {Object} content - The content to analyze
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extraction result with entities and relationships
   */
  async extract(content, options = {}) {
    throw new Error('Method extract() must be implemented by subclasses');
  }
  
  /**
   * Create entity object from extracted data
   * @param {string} type - Entity type
   * @param {Object} properties - Entity properties
   * @param {number} confidence - Confidence score (0-1)
   * @returns {Object} Entity object
   */
  createEntity(type, properties, confidence = 1.0) {
    // Don't include if below confidence threshold
    if (confidence < this.confidenceThreshold) {
      return null;
    }
    
    return {
      type,
      properties,
      metadata: {
        confidence,
        extraction_method: this.constructor.name,
        created_at: new Date().toISOString()
      }
    };
  }
  
  /**
   * Create relationship between entities
   * @param {string} sourceId - Source entity ID or reference
   * @param {string} targetId - Target entity ID or reference
   * @param {string} type - Relationship type
   * @param {Object} properties - Relationship properties
   * @param {number} confidence - Confidence score (0-1)
   * @returns {Object} Relationship object
   */
  createRelationship(sourceId, targetId, type, properties = {}, confidence = 1.0) {
    // Don't include if below confidence threshold
    if (confidence < this.confidenceThreshold) {
      return null;
    }
    
    return {
      sourceId,
      targetId,
      type,
      properties,
      metadata: {
        confidence,
        extraction_method: this.constructor.name,
        created_at: new Date().toISOString()
      }
    };
  }
  
  /**
   * Generate a temporary reference ID for an entity
   * @param {string} type - Entity type
   * @param {string} key - Unique identifier for this entity
   * @returns {string} Reference ID
   */
  generateReferenceId(type, key) {
    return `ref_${type}_${key.replace(/\s+/g, '_').toLowerCase()}`;
  }
  
  /**
   * Extract dates from text
   * @param {string} text - Text to analyze
   * @returns {Array} Array of date objects with value and metadata
   */
  extractDates(text) {
    // Very basic date extraction - in production would use more sophisticated NLP
    const dateResults = [];
    
    // Common date patterns
    const patterns = [
      // MM/DD/YYYY
      {
        regex: /\b(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{4})\b/g,
        confidence: 0.9,
        format: 'MM/DD/YYYY'
      },
      // Month DD, YYYY
      {
        regex: /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?,\s+(\d{4})\b/gi,
        confidence: 0.95,
        format: 'Month DD, YYYY'
      },
      // DD Month YYYY
      {
        regex: /\b(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi,
        confidence: 0.9,
        format: 'DD Month YYYY'
      },
      // Tomorrow, next week, etc.
      {
        regex: /\b(today|tomorrow|yesterday|next week|next month|this weekend)\b/gi,
        confidence: 0.7,
        format: 'relative'
      }
    ];
    
    patterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern.regex)];
      
      matches.forEach(match => {
        dateResults.push({
          value: match[0],
          format: pattern.format,
          match: Array.from(match),
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          confidence: pattern.confidence
        });
      });
    });
    
    return dateResults;
  }
  
  /**
   * Extract times from text
   * @param {string} text - Text to analyze
   * @returns {Array} Array of time objects with value and metadata
   */
  extractTimes(text) {
    // Basic time extraction
    const timeResults = [];
    
    // Common time patterns
    const patterns = [
      // HH:MM AM/PM
      {
        regex: /\b(0?[1-9]|1[0-2]):([0-5][0-9])\s*(am|pm|AM|PM)\b/g,
        confidence: 0.9,
        format: '12-hour'
      },
      // Military time
      {
        regex: /\b([01]?[0-9]|2[0-3]):([0-5][0-9])\b/g,
        confidence: 0.85,
        format: '24-hour'
      },
      // Hour only with AM/PM
      {
        regex: /\b(0?[1-9]|1[0-2])\s*(am|pm|AM|PM)\b/g,
        confidence: 0.8,
        format: '12-hour-no-minutes'
      }
    ];
    
    patterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern.regex)];
      
      matches.forEach(match => {
        timeResults.push({
          value: match[0],
          format: pattern.format,
          match: Array.from(match),
          position: {
            start: match.index,
            end: match.index + match[0].length
          },
          confidence: pattern.confidence
        });
      });
    });
    
    return timeResults;
  }
  
  /**
   * Extract locations from text
   * @param {string} text - Text to analyze
   * @param {Array} knownLocations - Array of known locations from knowledge graph
   * @returns {Array} Array of location objects
   */
  extractLocations(text, knownLocations = []) {
    const locationResults = [];
    
    // First check for known locations
    knownLocations.forEach(location => {
      if (location.properties && location.properties.name) {
        const locationName = location.properties.name;
        
        // Check if the location name appears in the text
        if (text.includes(locationName)) {
          locationResults.push({
            id: location.id,
            name: locationName,
            confidence: 0.95,
            type: 'known_location',
            position: {
              start: text.indexOf(locationName),
              end: text.indexOf(locationName) + locationName.length
            }
          });
        }
      }
    });
    
    // Look for location patterns (simple version)
    // In production would use a proper NER model
    const locationPatterns = [
      // "at LOCATION"
      {
        regex: /\bat\s+([A-Z][a-zA-Z\s&\-']+)(?=[\.,;:\s])/g,
        confidence: 0.7
      },
      // "to LOCATION"
      {
        regex: /\bto\s+([A-Z][a-zA-Z\s&\-']+)(?=[\.,;:\s])/g,
        confidence: 0.65
      },
      // Addresses
      {
        regex: /\b\d+\s+[A-Z][a-zA-Z\s\-']+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Court|Ct|Plaza|Square|Sq|Highway|Hwy|Route|RT)(?=[\.,;:\s])/gi,
        confidence: 0.9
      }
    ];
    
    locationPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern.regex)];
      
      matches.forEach(match => {
        const locationName = match[1] || match[0];
        
        // Check if this is a duplicate of a known location
        const isDuplicate = locationResults.some(loc => 
          loc.name.toLowerCase() === locationName.toLowerCase()
        );
        
        if (!isDuplicate) {
          locationResults.push({
            name: locationName,
            confidence: pattern.confidence,
            type: 'extracted_location',
            position: {
              start: match.index,
              end: match.index + match[0].length
            }
          });
        }
      });
    });
    
    return locationResults;
  }
  
  /**
   * Extract people from text using name patterns and known people
   * @param {string} text - Text to analyze
   * @param {Array} knownPeople - Array of known people from knowledge graph
   * @returns {Array} Array of person objects
   */
  extractPeople(text, knownPeople = []) {
    const peopleResults = [];
    
    // First check for known people
    knownPeople.forEach(person => {
      if (person.properties && person.properties.name) {
        const personName = person.properties.name;
        
        // Check if the person name appears in the text
        if (text.includes(personName)) {
          peopleResults.push({
            id: person.id,
            name: personName,
            confidence: 0.95,
            type: 'known_person',
            role: person.properties.role,
            position: {
              start: text.indexOf(personName),
              end: text.indexOf(personName) + personName.length
            }
          });
        }
      }
    });
    
    // Look for name patterns (simple version)
    // In production would use a proper NER model
    const personPatterns = [
      // First Last
      {
        regex: /\b([A-Z][a-z]+)\s+([A-Z][a-z]+)\b/g,
        confidence: 0.7
      },
      // Title First Last
      {
        regex: /\b(Mr\.|Mrs\.|Ms\.|Dr\.)\s+([A-Z][a-z]+)(?:\s+([A-Z][a-z]+))?\b/g,
        confidence: 0.85
      }
    ];
    
    personPatterns.forEach(pattern => {
      const matches = [...text.matchAll(pattern.regex)];
      
      matches.forEach(match => {
        let personName;
        
        if (match[1].match(/^(Mr\.|Mrs\.|Ms\.|Dr\.)$/)) {
          personName = match[0];
        } else {
          personName = match[0];
        }
        
        // Check if this is a duplicate of a known person
        const isDuplicate = peopleResults.some(person => 
          person.name.toLowerCase() === personName.toLowerCase()
        );
        
        if (!isDuplicate) {
          peopleResults.push({
            name: personName,
            confidence: pattern.confidence,
            type: 'extracted_person',
            position: {
              start: match.index,
              end: match.index + match[0].length
            }
          });
        }
      });
    });
    
    return peopleResults;
  }
}

export default EntityExtractor;