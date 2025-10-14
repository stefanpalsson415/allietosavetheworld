/**
 * FamilyKnowledgeOntology.js
 * 
 * Defines the comprehensive ontology for the Family Knowledge Graph
 * including entity types, relationship types, properties, and validation rules.
 * This serves as the schema definition for the knowledge graph system.
 */

/**
 * Complete entity type definitions with allowed properties and validation rules
 */
export const ENTITY_TYPES = {
  // Core entities
  PERSON: {
    name: 'person',
    properties: {
      name: { type: 'string', required: true },
      role: { type: 'string', enum: ['parent', 'child', 'guardian', 'relative', 'other'] },
      age: { type: 'number' },
      birthdate: { type: 'date' },
      gender: { type: 'string' },
      interests: { type: 'array' },
      preferences: { type: 'object' },
      avatar: { type: 'string' },
      contact: { type: 'object' },
      lastUpdate: { type: 'date' }
    }
  },
  
  FAMILY: {
    name: 'family',
    properties: {
      name: { type: 'string', required: true },
      address: { type: 'object' },
      formationDate: { type: 'date' },
      preferences: { type: 'object' },
      settings: { type: 'object' },
      culturalContext: { type: 'string' },
      lastUpdate: { type: 'date' }
    }
  },
  
  EVENT: {
    name: 'event',
    properties: {
      title: { type: 'string', required: true },
      description: { type: 'string' },
      startDate: { type: 'date', required: true },
      endDate: { type: 'date' },
      location: { type: 'object' },
      calendar: { type: 'string' },
      recurrence: { type: 'object' },
      status: { type: 'string', enum: ['confirmed', 'tentative', 'cancelled'] },
      priority: { type: 'number' },
      eventType: { type: 'string', enum: ['family', 'school', 'medical', 'activity', 'work', 'social', 'other'] },
      reminders: { type: 'array' },
      lastUpdate: { type: 'date' }
    }
  },
  
  TASK: {
    name: 'task',
    properties: {
      title: { type: 'string', required: true },
      description: { type: 'string' },
      status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'cancelled'] },
      dueDate: { type: 'date' },
      priority: { type: 'number' },
      taskType: { type: 'string' },
      weight: { type: 'number' },
      estimatedTime: { type: 'number' },
      actualTime: { type: 'number' },
      recurrence: { type: 'object' },
      taskSequence: { type: 'string' },
      lastUpdate: { type: 'date' }
    }
  },
  
  DOCUMENT: {
    name: 'document',
    properties: {
      title: { type: 'string', required: true },
      description: { type: 'string' },
      fileType: { type: 'string', required: true },
      category: { type: 'string' },
      source: { type: 'string' },
      content: { type: 'string' },
      extractedData: { type: 'object' },
      uri: { type: 'string' },
      creationDate: { type: 'date' },
      lastUpdate: { type: 'date' }
    }
  },
  
  PROVIDER: {
    name: 'provider',
    properties: {
      name: { type: 'string', required: true },
      type: { type: 'string', enum: ['medical', 'school', 'activity', 'service', 'other'] },
      contact: { type: 'object' },
      location: { type: 'object' },
      specialties: { type: 'array' },
      rating: { type: 'number' },
      relationships: { type: 'array' },
      lastUpdate: { type: 'date' }
    }
  },
  
  // Extended entities
  LOCATION: {
    name: 'location',
    properties: {
      name: { type: 'string', required: true },
      address: { type: 'object' },
      coordinates: { type: 'object' },
      type: { type: 'string' },
      frequencyOfVisit: { type: 'number' },
      associatedActivities: { type: 'array' },
      lastVisited: { type: 'date' },
      lastUpdate: { type: 'date' }
    }
  },
  
  MEDICATION: {
    name: 'medication',
    properties: {
      name: { type: 'string', required: true },
      dosage: { type: 'string' },
      schedule: { type: 'object' },
      prescribedBy: { type: 'string' },
      startDate: { type: 'date' },
      endDate: { type: 'date' },
      purpose: { type: 'string' },
      sideEffects: { type: 'array' },
      instructions: { type: 'string' },
      lastUpdate: { type: 'date' }
    }
  },
  
  MILESTONE: {
    name: 'milestone',
    properties: {
      title: { type: 'string', required: true },
      description: { type: 'string' },
      date: { type: 'date', required: true },
      type: { type: 'string' },
      importance: { type: 'number' },
      associatedEntities: { type: 'array' },
      media: { type: 'array' },
      lastUpdate: { type: 'date' }
    }
  },
  
  INTEREST: {
    name: 'interest',
    properties: {
      name: { type: 'string', required: true },
      category: { type: 'string' },
      level: { type: 'number' },
      since: { type: 'date' },
      activities: { type: 'array' },
      relatedInterests: { type: 'array' },
      lastUpdate: { type: 'date' }
    }
  },
  
  HABIT: {
    name: 'habit',
    properties: {
      name: { type: 'string', required: true },
      description: { type: 'string' },
      frequency: { type: 'object' },
      startDate: { type: 'date' },
      streakCount: { type: 'number' },
      category: { type: 'string' },
      triggers: { type: 'array' },
      successRate: { type: 'number' },
      lastUpdate: { type: 'date' }
    }
  },
  
  METRIC: {
    name: 'metric',
    properties: {
      name: { type: 'string', required: true },
      type: { type: 'string', enum: ['scalar', 'categorical', 'temporal'] },
      value: { type: 'any', required: true },
      unit: { type: 'string' },
      timestamp: { type: 'date', required: true },
      source: { type: 'string' },
      context: { type: 'object' },
      lastUpdate: { type: 'date' }
    }
  },
  
  INSIGHT: {
    name: 'insight',
    properties: {
      title: { type: 'string', required: true },
      description: { type: 'string', required: true },
      type: { type: 'string' },
      severity: { type: 'number' },
      generatedDate: { type: 'date', required: true },
      expirationDate: { type: 'date' },
      sources: { type: 'array' },
      confidence: { type: 'number' },
      actionable: { type: 'boolean' },
      suggested_actions: { type: 'array' },
      lastUpdate: { type: 'date' }
    }
  },
  
  COMMUNICATION: {
    name: 'communication',
    properties: {
      type: { type: 'string', enum: ['message', 'email', 'call', 'chat', 'in_person'], required: true },
      timestamp: { type: 'date', required: true },
      content: { type: 'string' },
      participants: { type: 'array', required: true },
      subject: { type: 'string' },
      sentiment: { type: 'string' },
      extractedEntities: { type: 'array' },
      lastUpdate: { type: 'date' }
    }
  },
  
  PREFERENCE: {
    name: 'preference',
    properties: {
      name: { type: 'string', required: true },
      value: { type: 'any', required: true },
      category: { type: 'string' },
      strength: { type: 'number' },
      lastUpdate: { type: 'date' }
    }
  }
};

/**
 * Complete relationship type definitions with allowed properties
 */
export const RELATIONSHIP_TYPES = {
  // Family relationships
  MEMBER_OF: {
    name: 'member_of',
    source: ['PERSON'],
    target: ['FAMILY'],
    properties: {
      role: { type: 'string' },
      since: { type: 'date' },
      primary: { type: 'boolean' }
    }
  },
  
  PARENT_OF: {
    name: 'parent_of',
    source: ['PERSON'],
    target: ['PERSON'],
    properties: {
      type: { type: 'string', enum: ['biological', 'adoptive', 'step', 'guardian'] },
      primary_caregiver: { type: 'boolean' }
    }
  },
  
  CHILD_OF: {
    name: 'child_of',
    source: ['PERSON'],
    target: ['PERSON'],
    properties: {
      type: { type: 'string', enum: ['biological', 'adopted', 'step'] }
    }
  },
  
  SIBLING_OF: {
    name: 'sibling_of',
    source: ['PERSON'],
    target: ['PERSON'],
    properties: {
      type: { type: 'string', enum: ['full', 'half', 'step', 'adopted'] },
      influence_type: { type: 'string', enum: ['teacher', 'learner', 'peer', 'mentor'] },
      influence_strength: { type: 'number', min: 0, max: 10 },
      relationship_quality: { type: 'string', enum: ['positive', 'neutral', 'challenging'] },
      shared_interests: { type: 'array' },
      teaching_domains: { type: 'array' },
      learning_domains: { type: 'array' }
    }
  },
  
  // Event relationships
  ATTENDS: {
    name: 'attends',
    source: ['PERSON'],
    target: ['EVENT'],
    properties: {
      role: { type: 'string' },
      required: { type: 'boolean' },
      confirmed: { type: 'boolean' },
      importance: { type: 'number' }
    }
  },
  
  HOSTS: {
    name: 'hosts',
    source: ['PERSON', 'PROVIDER'],
    target: ['EVENT'],
    properties: {
      primary: { type: 'boolean' }
    }
  },
  
  OCCURS_AT: {
    name: 'occurs_at',
    source: ['EVENT'],
    target: ['LOCATION'],
    properties: {
      confirmed: { type: 'boolean' }
    }
  },
  
  // Task relationships
  ASSIGNED_TO: {
    name: 'assigned_to',
    source: ['TASK'],
    target: ['PERSON'],
    properties: {
      assignedDate: { type: 'date' },
      voluntary: { type: 'boolean' },
      weight: { type: 'number' }
    }
  },
  
  RESPONSIBLE_FOR: {
    name: 'responsible_for',
    source: ['PERSON'],
    target: ['TASK'],
    properties: {
      primary: { type: 'boolean' },
      delegation_allowed: { type: 'boolean' }
    }
  },
  
  RELATED_TO: {
    name: 'related_to',
    source: ['TASK', 'EVENT', 'DOCUMENT', 'INSIGHT', 'MEDICATION', 'INTEREST', 'HABIT'],
    target: ['TASK', 'EVENT', 'DOCUMENT', 'INSIGHT', 'MEDICATION', 'INTEREST', 'HABIT'],
    properties: {
      type: { type: 'string' },
      strength: { type: 'number' }
    }
  },
  
  PREREQUISITE_FOR: {
    name: 'prerequisite_for',
    source: ['TASK'],
    target: ['TASK'],
    properties: {
      required: { type: 'boolean' }
    }
  },
  
  // Document & Provider relationships
  CREATED_BY: {
    name: 'created_by',
    source: ['DOCUMENT', 'TASK', 'EVENT', 'INSIGHT'],
    target: ['PERSON', 'PROVIDER'],
    properties: {
      date: { type: 'date' }
    }
  },
  
  REFERENCES: {
    name: 'references',
    source: ['DOCUMENT', 'COMMUNICATION'],
    target: ['PERSON', 'EVENT', 'TASK', 'MEDICATION', 'PROVIDER', 'LOCATION'],
    properties: {
      context: { type: 'string' },
      confidence: { type: 'number' }
    }
  },
  
  PROVIDED_BY: {
    name: 'provided_by',
    source: ['DOCUMENT', 'EVENT', 'MEDICATION'],
    target: ['PROVIDER'],
    properties: {
      date: { type: 'date' }
    }
  },
  
  PROVIDES_CARE_TO: {
    name: 'provides_care_to',
    source: ['PROVIDER'],
    target: ['PERSON'],
    properties: {
      since: { type: 'date' },
      role: { type: 'string' },
      specialty: { type: 'string' }
    }
  },
  
  // Interest & Preference relationships
  INTERESTED_IN: {
    name: 'interested_in',
    source: ['PERSON'],
    target: ['INTEREST'],
    properties: {
      level: { type: 'number' },
      since: { type: 'date' }
    }
  },
  
  HAS_PREFERENCE: {
    name: 'has_preference',
    source: ['PERSON', 'FAMILY'],
    target: ['PREFERENCE'],
    properties: {
      strength: { type: 'number' },
      context: { type: 'string' }
    }
  },
  
  PRACTICES: {
    name: 'practices',
    source: ['PERSON'],
    target: ['HABIT'],
    properties: {
      consistency: { type: 'number' },
      since: { type: 'date' }
    }
  },
  
  // Location relationships
  FREQUENTS: {
    name: 'frequents',
    source: ['PERSON', 'FAMILY'],
    target: ['LOCATION'],
    properties: {
      frequency: { type: 'number' },
      purpose: { type: 'string' },
      regular_schedule: { type: 'object' }
    }
  },
  
  // Medication relationships
  PRESCRIBED_TO: {
    name: 'prescribed_to',
    source: ['MEDICATION'],
    target: ['PERSON'],
    properties: {
      start_date: { type: 'date' },
      end_date: { type: 'date' },
      adherence: { type: 'number' }
    }
  },
  
  // Communication relationships
  PARTICIPATED_IN: {
    name: 'participated_in',
    source: ['PERSON', 'PROVIDER'],
    target: ['COMMUNICATION'],
    properties: {
      role: { type: 'string' },
      sentiment: { type: 'string' }
    }
  },
  
  // Metric relationships
  MEASURED_FOR: {
    name: 'measured_for',
    source: ['METRIC'],
    target: ['PERSON', 'TASK', 'HABIT', 'FAMILY'],
    properties: {
      context: { type: 'string' }
    }
  },
  
  // Insight relationships
  SUGGESTS: {
    name: 'suggests',
    source: ['INSIGHT'],
    target: ['TASK', 'EVENT', 'COMMUNICATION'],
    properties: {
      priority: { type: 'number' },
      reasoning: { type: 'string' }
    }
  },
  
  DERIVED_FROM: {
    name: 'derived_from',
    source: ['INSIGHT'],
    target: ['DOCUMENT', 'EVENT', 'TASK', 'COMMUNICATION', 'METRIC'],
    properties: {
      contribution: { type: 'number' },
      confidence: { type: 'number' }
    }
  },
  
  RELEVANT_TO: {
    name: 'relevant_to',
    source: ['INSIGHT'],
    target: ['PERSON', 'FAMILY'],
    properties: {
      importance: { type: 'number' },
      actionable: { type: 'boolean' }
    }
  }
};

/**
 * Metadata structure for entity/relationship creation
 */
export const METADATA_STRUCTURE = {
  created_at: { type: 'date', required: true, default: 'now' },
  created_by: { type: 'string' },
  updated_at: { type: 'date', required: true, default: 'now' },
  updated_by: { type: 'string' },
  confidence: { type: 'number', min: 0, max: 1, default: 1.0 },
  provenance: { type: 'string' }, // Source of this data
  extraction_method: { type: 'string' }, // How this entity/relationship was extracted
  privacy_level: { type: 'string', enum: ['private', 'family', 'shared', 'public'], default: 'family' },
  ttl: { type: 'number' } // Time to live in seconds, if applicable
};

/**
 * Returns entity type definition by name
 * @param {string} typeName - The name of the entity type
 * @returns {Object} The entity type definition
 */
export const getEntityTypeByName = (typeName) => {
  const upperTypeName = typeName.toUpperCase();
  if (ENTITY_TYPES[upperTypeName]) {
    return ENTITY_TYPES[upperTypeName];
  }
  
  // Try to match by name property if not matched by key
  return Object.values(ENTITY_TYPES).find(
    type => type.name.toLowerCase() === typeName.toLowerCase()
  );
};

/**
 * Returns relationship type definition by name
 * @param {string} typeName - The name of the relationship type
 * @returns {Object} The relationship type definition
 */
export const getRelationshipTypeByName = (typeName) => {
  const upperTypeName = typeName.toUpperCase();
  if (RELATIONSHIP_TYPES[upperTypeName]) {
    return RELATIONSHIP_TYPES[upperTypeName];
  }
  
  // Try to match by name property if not matched by key
  return Object.values(RELATIONSHIP_TYPES).find(
    type => type.name.toLowerCase() === typeName.toLowerCase()
  );
};

/**
 * Validates entity properties against the defined schema
 * @param {string} entityType - Type of entity
 * @param {Object} properties - Properties to validate
 * @returns {Object} Validation result {valid: boolean, errors: Array}
 */
export const validateEntityProperties = (entityType, properties) => {
  const entityTypeDefinition = getEntityTypeByName(entityType);
  if (!entityTypeDefinition) {
    return { valid: false, errors: [`Unknown entity type: ${entityType}`] };
  }
  
  const errors = [];
  const propertyDefs = entityTypeDefinition.properties;
  
  // Check required properties
  Object.entries(propertyDefs).forEach(([propName, propDef]) => {
    if (propDef.required && (properties[propName] === undefined || properties[propName] === null)) {
      errors.push(`Missing required property: ${propName}`);
    }
  });
  
  // Validate property types and enums
  Object.entries(properties).forEach(([propName, propValue]) => {
    const propDef = propertyDefs[propName];
    if (!propDef) {
      // Allow unknown properties, but could warn instead
      return;
    }
    
    // Type validation
    if (propDef.type && propValue !== undefined && propValue !== null) {
      if (propDef.type === 'date' && !(propValue instanceof Date) && isNaN(Date.parse(propValue))) {
        errors.push(`Property ${propName} must be a valid date`);
      } else if (propDef.type === 'number' && typeof propValue !== 'number') {
        errors.push(`Property ${propName} must be a number`);
      } else if (propDef.type === 'string' && typeof propValue !== 'string') {
        errors.push(`Property ${propName} must be a string`);
      } else if (propDef.type === 'array' && !Array.isArray(propValue)) {
        errors.push(`Property ${propName} must be an array`);
      } else if (propDef.type === 'object' && (typeof propValue !== 'object' || propValue === null || Array.isArray(propValue))) {
        errors.push(`Property ${propName} must be an object`);
      } else if (propDef.type === 'boolean' && typeof propValue !== 'boolean') {
        errors.push(`Property ${propName} must be a boolean`);
      }
    }
    
    // Enum validation
    if (propDef.enum && propValue !== undefined && propValue !== null) {
      if (!propDef.enum.includes(propValue)) {
        errors.push(`Property ${propName} must be one of: ${propDef.enum.join(', ')}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validates relationship between entities
 * @param {string} relationshipType - Type of relationship
 * @param {string} sourceEntityType - Type of source entity
 * @param {string} targetEntityType - Type of target entity
 * @returns {Object} Validation result {valid: boolean, errors: Array}
 */
export const validateRelationship = (relationshipType, sourceEntityType, targetEntityType) => {
  const relTypeDefinition = getRelationshipTypeByName(relationshipType);
  if (!relTypeDefinition) {
    return { valid: false, errors: [`Unknown relationship type: ${relationshipType}`] };
  }
  
  const errors = [];
  const sourceType = sourceEntityType.toUpperCase();
  const targetType = targetEntityType.toUpperCase();
  
  // Check if source entity type is allowed for this relationship
  if (relTypeDefinition.source && !relTypeDefinition.source.includes(sourceType)) {
    errors.push(`Entity type ${sourceEntityType} cannot be the source of a ${relationshipType} relationship. Allowed types: ${relTypeDefinition.source.join(', ')}`);
  }
  
  // Check if target entity type is allowed for this relationship
  if (relTypeDefinition.target && !relTypeDefinition.target.includes(targetType)) {
    errors.push(`Entity type ${targetEntityType} cannot be the target of a ${relationshipType} relationship. Allowed types: ${relTypeDefinition.target.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validates relationship properties against the defined schema
 * @param {string} relationshipType - Type of relationship
 * @param {Object} properties - Properties to validate
 * @returns {Object} Validation result {valid: boolean, errors: Array}
 */
export const validateRelationshipProperties = (relationshipType, properties) => {
  const relTypeDefinition = getRelationshipTypeByName(relationshipType);
  if (!relTypeDefinition) {
    return { valid: false, errors: [`Unknown relationship type: ${relationshipType}`] };
  }
  
  const errors = [];
  const propertyDefs = relTypeDefinition.properties || {};
  
  // Similar validation logic as for entities
  Object.entries(propertyDefs).forEach(([propName, propDef]) => {
    if (propDef.required && (properties[propName] === undefined || properties[propName] === null)) {
      errors.push(`Missing required property: ${propName}`);
    }
  });
  
  Object.entries(properties).forEach(([propName, propValue]) => {
    const propDef = propertyDefs[propName];
    if (!propDef) {
      // Allow unknown properties
      return;
    }
    
    // Type and enum validation as with entities
    if (propDef.type && propValue !== undefined && propValue !== null) {
      // Same type validation as entities
    }
    
    if (propDef.enum && propValue !== undefined && propValue !== null) {
      if (!propDef.enum.includes(propValue)) {
        errors.push(`Property ${propName} must be one of: ${propDef.enum.join(', ')}`);
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export default {
  ENTITY_TYPES,
  RELATIONSHIP_TYPES,
  METADATA_STRUCTURE,
  getEntityTypeByName,
  getRelationshipTypeByName,
  validateEntityProperties,
  validateRelationship,
  validateRelationshipProperties
};