import { v4 as uuidv4 } from 'uuid';

/**
 * Robust GEDCOM Parser Service
 * Handles standard GEDCOM 5.5.1 format with proper error handling and validation
 */
class GEDCOMParser {
  constructor() {
    this.records = new Map();
    this.individuals = new Map();
    this.families = new Map();
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Main parse method - entry point for GEDCOM parsing
   */
  async parse(content) {
    try {
      // Validate input
      if (!content) {
        throw new Error('No content provided to parse');
      }
      
      if (typeof content !== 'string') {
        throw new Error('Content must be a text string');
      }
      
      // Check for basic GEDCOM format
      if (!content.includes('0 HEAD') && !content.includes('0 @')) {
        throw new Error('File does not appear to be in GEDCOM format');
      }
      
      this.reset();
      const lines = this.preprocessLines(content);
      
      if (lines.length === 0) {
        throw new Error('No valid GEDCOM lines found in file');
      }
      
      const hierarchy = this.buildHierarchy(lines);
      this.extractRecords(hierarchy);
      const graphData = this.transformToGraph();
      this.validateData(graphData);
      
      return {
        success: true,
        data: graphData,
        stats: this.getStatistics(),
        errors: this.errors,
        warnings: this.warnings
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        errors: this.errors,
        warnings: this.warnings
      };
    }
  }

  /**
   * Reset parser state for new parse
   */
  reset() {
    this.records.clear();
    this.individuals.clear();
    this.families.clear();
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Preprocess GEDCOM lines - handle encoding and line breaks
   */
  preprocessLines(content) {
    // Validate content exists and is a string
    if (!content) {
      throw new Error('GEDCOM file is empty');
    }
    
    if (typeof content !== 'string') {
      throw new Error('Invalid GEDCOM content - expected text file');
    }
    
    // Handle different line endings and encoding issues
    const lines = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter(line => line.trim());

    const parsedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = this.parseLine(line, i + 1);
      if (parsed) {
        parsedLines.push(parsed);
      }
    }

    return parsedLines;
  }

  /**
   * Parse individual GEDCOM line
   */
  parseLine(line, lineNumber) {
    // GEDCOM line format: LEVEL [XREF] TAG [VALUE]
    const regex = /^(\d+)\s+(@[^@]+@\s+)?(\S+)(\s+(.*))?$/;
    const match = line.match(regex);
    
    if (!match) {
      this.warnings.push(`Line ${lineNumber}: Invalid format - "${line}"`);
      return null;
    }
    
    return {
      level: parseInt(match[1]),
      xref: match[2]?.trim(),
      tag: match[3],
      value: match[5]?.trim() || '',
      lineNumber,
      children: []
    };
  }

  /**
   * Build hierarchical structure from flat lines
   */
  buildHierarchy(lines) {
    const root = { level: -1, children: [] };
    const stack = [root];
    
    for (const line of lines) {
      // Find correct parent level
      while (stack.length > 0 && stack[stack.length - 1].level >= line.level) {
        stack.pop();
      }
      
      // Add to parent's children
      const parent = stack[stack.length - 1];
      parent.children.push(line);
      stack.push(line);
    }
    
    return root.children;
  }

  /**
   * Extract records from hierarchy
   */
  extractRecords(hierarchy) {
    for (const record of hierarchy) {
      if (record.xref) {
        this.records.set(record.xref, record);
        
        switch (record.tag) {
          case 'INDI':
            this.parseIndividual(record);
            break;
          case 'FAM':
            this.parseFamily(record);
            break;
        }
      }
    }
  }

  /**
   * Parse individual record
   */
  parseIndividual(record) {
    const individual = {
      id: record.xref,
      type: 'individual',
      profile: {
        displayName: '',
        firstName: '',
        lastName: '',
        middleName: '',
        nickname: '',
        gender: 'other',
        birthDate: null,
        birthPlace: '',
        deathDate: null,
        deathPlace: '',
        isLiving: true,
        occupation: '',
        education: ''
      },
      relationships: {
        parents: [],
        spouses: [],
        children: []
      },
      events: [],
      notes: [],
      sources: []
    };

    for (const child of record.children) {
      switch (child.tag) {
        case 'NAME':
          this.parseName(child, individual);
          break;
        case 'SEX':
          individual.profile.gender = this.parseGender(child.value);
          break;
        case 'BIRT':
          const birth = this.parseEvent(child, 'birth');
          // Extract the actual parsed date from the date object
          if (birth.date && birth.date.parsed) {
            individual.profile.birthDate = birth.date.parsed;
          } else if (birth.date && typeof birth.date === 'string') {
            individual.profile.birthDate = birth.date;
          }
          if (birth.place) individual.profile.birthPlace = birth.place;
          individual.events.push(birth);
          break;
        case 'DEAT':
          const death = this.parseEvent(child, 'death');
          individual.profile.isLiving = false;
          // Extract the actual parsed date from the date object
          if (death.date && death.date.parsed) {
            individual.profile.deathDate = death.date.parsed;
          } else if (death.date && typeof death.date === 'string') {
            individual.profile.deathDate = death.date;
          }
          if (death.place) individual.profile.deathPlace = death.place;
          individual.events.push(death);
          break;
        case 'OCCU':
          individual.profile.occupation = child.value;
          break;
        case 'EDUC':
          individual.profile.education = child.value;
          break;
        case 'FAMC':
          individual.relationships.parents.push(child.value);
          break;
        case 'FAMS':
          individual.relationships.spouses.push(child.value);
          break;
        case 'NOTE':
          individual.notes.push(this.parseNote(child));
          break;
        case 'SOUR':
          individual.sources.push(child.value);
          break;
        case 'MARR':
          individual.events.push(this.parseEvent(child, 'marriage'));
          break;
        case 'BAPM':
        case 'CHR':
          individual.events.push(this.parseEvent(child, 'baptism'));
          break;
        case 'GRAD':
          individual.events.push(this.parseEvent(child, 'graduation'));
          break;
        case 'RESI':
          // Residence events - very common in GEDCOM files
          const residence = this.parseEvent(child, 'residence');
          individual.events.push(residence);
          // Store current residence
          if (!individual.profile.currentResidence && residence.place) {
            individual.profile.currentResidence = residence.place;
          }
          break;
        case 'BURI':
          // Burial information
          const burial = this.parseEvent(child, 'burial');
          if (burial.place) individual.profile.burialPlace = burial.place;
          if (burial.date) individual.profile.burialDate = burial.date.parsed || burial.date;
          individual.events.push(burial);
          break;
        case 'EVEN':
          // Generic events
          individual.events.push(this.parseEvent(child, 'event'));
          break;
        case 'OBJE':
          // Media objects (photos, documents)
          if (!individual.media) individual.media = [];
          individual.media.push(this.parseMediaObject(child));
          break;
        case 'TITL':
          // Title (Dr., Rev., etc.)
          individual.profile.title = child.value;
          break;
        case 'ADDR':
          // Address
          individual.profile.address = this.parseAddress(child);
          break;
        case 'EMAIL':
          // Email
          individual.profile.email = child.value;
          break;
        case 'PHON':
          // Phone
          individual.profile.phone = child.value;
          break;
        case 'CENS':
          // Census records
          individual.events.push(this.parseEvent(child, 'census'));
          break;
        case 'IMMI':
          // Immigration
          individual.events.push(this.parseEvent(child, 'immigration'));
          break;
        case 'NATU':
          // Naturalization
          individual.events.push(this.parseEvent(child, 'naturalization'));
          break;
        case 'RELI':
          // Religion
          individual.profile.religion = child.value;
          break;
        case 'NATI':
          // Nationality
          individual.profile.nationality = child.value;
          break;
      }
    }

    this.individuals.set(record.xref, individual);
  }

  /**
   * Parse name from NAME tag
   */
  parseName(nameRecord, individual) {
    // GEDCOM name format: Given /Surname/ Suffix
    const value = nameRecord.value;
    const match = value.match(/^([^\/]*?)\s*\/([^\/]*?)\/\s*(.*)$/);
    
    if (match) {
      individual.profile.firstName = match[1].trim();
      individual.profile.lastName = match[2].trim();
      const suffix = match[3].trim();
      if (suffix) {
        individual.profile.displayName = `${match[1].trim()} ${match[2].trim()} ${suffix}`;
      } else {
        individual.profile.displayName = `${match[1].trim()} ${match[2].trim()}`;
      }
    } else {
      individual.profile.displayName = value;
    }

    // Check for detailed name components
    for (const child of nameRecord.children) {
      switch (child.tag) {
        case 'GIVN':
          individual.profile.firstName = child.value;
          break;
        case 'SURN':
          individual.profile.lastName = child.value;
          break;
        case 'NICK':
          individual.profile.nickname = child.value;
          break;
        case 'SPFX':
          individual.profile.prefix = child.value;
          break;
        case 'NSFX':
          individual.profile.suffix = child.value;
          break;
      }
    }

    // Update display name
    if (!individual.profile.displayName && (individual.profile.firstName || individual.profile.lastName)) {
      individual.profile.displayName = `${individual.profile.firstName} ${individual.profile.lastName}`.trim();
    }
  }

  /**
   * Parse gender value
   */
  parseGender(value) {
    const upper = value.toUpperCase();
    if (upper === 'M' || upper === 'MALE') return 'male';
    if (upper === 'F' || upper === 'FEMALE') return 'female';
    return 'other';
  }

  /**
   * Parse event (birth, death, marriage, etc.)
   */
  parseEvent(eventRecord, type) {
    const event = {
      type,
      date: null,
      place: null,
      notes: []
    };

    for (const child of eventRecord.children) {
      switch (child.tag) {
        case 'DATE':
          event.date = this.parseDate(child.value);
          break;
        case 'PLAC':
          event.place = this.parsePlace(child);
          break;
        case 'NOTE':
          event.notes.push(this.parseNote(child));
          break;
        case 'SOUR':
          event.source = child.value;
          break;
      }
    }

    return event;
  }

  /**
   * Parse date with various GEDCOM formats
   */
  parseDate(dateStr) {
    if (!dateStr) return null;

    const result = {
      original: dateStr,
      parsed: null,
      qualifier: null,
      isValid: false
    };

    // Handle date qualifiers
    const qualifiers = {
      'ABT': 'about',
      'CAL': 'calculated',
      'EST': 'estimated',
      'BEF': 'before',
      'AFT': 'after',
      'BET': 'between',
      'FROM': 'from',
      'TO': 'to'
    };

    for (const [key, value] of Object.entries(qualifiers)) {
      if (dateStr.startsWith(key)) {
        result.qualifier = value;
        dateStr = dateStr.substring(key.length).trim();
        break;
      }
    }

    // Handle BETWEEN...AND format
    if (result.qualifier === 'between') {
      const parts = dateStr.split(/\s+AND\s+/i);
      if (parts.length === 2) {
        result.parsed = {
          start: this.parseSimpleDate(parts[0]),
          end: this.parseSimpleDate(parts[1])
        };
      }
    } else {
      result.parsed = this.parseSimpleDate(dateStr);
    }

    result.isValid = result.parsed !== null;
    return result;
  }

  /**
   * Parse simple date (without qualifiers)
   */
  parseSimpleDate(dateStr) {
    if (!dateStr) return null;

    // Convert to uppercase for matching
    dateStr = dateStr.toUpperCase();

    // Month names mapping
    const months = {
      'JAN': 0, 'FEB': 1, 'MAR': 2, 'APR': 3, 'MAY': 4, 'JUN': 5,
      'JUL': 6, 'AUG': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DEC': 11
    };

    // Try different date formats
    // Format: DD MMM YYYY (e.g., "20 Aug 1948")
    let match = dateStr.match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/);
    if (match) {
      const [, day, month, year] = match;
      if (months[month] !== undefined) {
        return new Date(parseInt(year), months[month], parseInt(day)).toISOString();
      }
    }

    // Format: MMM DD, YYYY (e.g., "Aug 20, 1948")
    match = dateStr.match(/^([A-Z]{3})\s+(\d{1,2}),?\s+(\d{4})$/);
    if (match) {
      const [, month, day, year] = match;
      if (months[month] !== undefined) {
        return new Date(parseInt(year), months[month], parseInt(day)).toISOString();
      }
    }

    // Format: MMM YYYY
    match = dateStr.match(/^([A-Z]{3})\s+(\d{4})$/);
    if (match) {
      const [, month, year] = match;
      if (months[month] !== undefined) {
        return new Date(parseInt(year), months[month], 1).toISOString();
      }
    }

    // Format: YYYY
    match = dateStr.match(/^(\d{4})$/);
    if (match) {
      return new Date(parseInt(match[1]), 0, 1).toISOString();
    }

    // Try parsing as-is (for ISO dates)
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (e) {
      // Silent fail
    }

    return null;
  }

  /**
   * Parse place information
   */
  parsePlace(placeRecord) {
    let place = placeRecord.value;
    
    for (const child of placeRecord.children) {
      switch (child.tag) {
        case 'MAP':
          // Geographic coordinates if available
          for (const mapChild of child.children) {
            if (mapChild.tag === 'LATI') place += ` (Lat: ${mapChild.value})`;
            if (mapChild.tag === 'LONG') place += ` (Long: ${mapChild.value})`;
          }
          break;
        case 'NOTE':
          place += ` - ${child.value}`;
          break;
      }
    }
    
    return place;
  }

  /**
   * Parse note information
   */
  parseNote(noteRecord) {
    if (typeof noteRecord === 'string') return noteRecord;
    
    let note = noteRecord.value;
    
    // Handle continued notes
    for (const child of noteRecord.children) {
      if (child.tag === 'CONT') {
        note += '\n' + child.value;
      } else if (child.tag === 'CONC') {
        note += child.value;
      }
    }
    
    return note;
  }

  /**
   * Parse media object (photos, documents)
   */
  parseMediaObject(objRecord) {
    const media = {
      type: 'media',
      title: null,
      file: null,
      format: null,
      notes: []
    };

    for (const child of objRecord.children) {
      switch (child.tag) {
        case 'FILE':
          media.file = child.value;
          // Check for format in children
          for (const fileChild of child.children) {
            if (fileChild.tag === 'FORM') {
              media.format = fileChild.value;
            }
          }
          break;
        case 'TITL':
          media.title = child.value;
          break;
        case 'NOTE':
          media.notes.push(this.parseNote(child));
          break;
      }
    }

    return media;
  }

  /**
   * Parse address information
   */
  parseAddress(addrRecord) {
    let address = addrRecord.value || '';
    
    for (const child of addrRecord.children) {
      switch (child.tag) {
        case 'CONT':
          address += '\n' + child.value;
          break;
        case 'ADR1':
          address += '\n' + child.value;
          break;
        case 'ADR2':
          address += '\n' + child.value;
          break;
        case 'CITY':
          address += '\n' + child.value;
          break;
        case 'STAE':
          address += ', ' + child.value;
          break;
        case 'POST':
          address += ' ' + child.value;
          break;
        case 'CTRY':
          address += '\n' + child.value;
          break;
      }
    }
    
    return address.trim();
  }

  /**
   * Parse family record
   */
  parseFamily(record) {
    const family = {
      id: record.xref,
      type: 'family',
      husband: null,
      wife: null,
      children: [],
      marriageDate: null,
      marriagePlace: null,
      divorced: false,
      events: []
    };

    for (const child of record.children) {
      switch (child.tag) {
        case 'HUSB':
          family.husband = child.value;
          break;
        case 'WIFE':
          family.wife = child.value;
          break;
        case 'CHIL':
          family.children.push(child.value);
          break;
        case 'MARR':
          const marriage = this.parseEvent(child, 'marriage');
          family.marriageDate = marriage.date;
          family.marriagePlace = marriage.place;
          family.events.push(marriage);
          break;
        case 'DIV':
          family.divorced = true;
          family.events.push(this.parseEvent(child, 'divorce'));
          break;
      }
    }

    this.families.set(record.xref, family);
  }

  /**
   * Transform parsed data to graph format
   */
  transformToGraph() {
    const nodes = [];
    const relationships = [];

    // Create nodes for individuals
    for (const [id, individual] of this.individuals) {
      nodes.push({
        id: individual.id,
        type: 'person',
        properties: individual.profile,
        metadata: {
          events: individual.events,
          notes: individual.notes,
          sources: individual.sources,
          media: individual.media || [],
          gedcomId: individual.id,
          relationships: individual.relationships
        }
      });
    }

    // Create relationships from families
    for (const [id, family] of this.families) {
      // Spouse relationships
      if (family.husband && family.wife) {
        relationships.push({
          from: family.husband,
          to: family.wife,
          type: 'spouse',
          properties: {
            marriageDate: family.marriageDate,
            marriagePlace: family.marriagePlace,
            divorced: family.divorced,
            familyId: family.id
          }
        });
      }

      // Parent-child relationships
      for (const childId of family.children) {
        if (family.husband) {
          relationships.push({
            from: family.husband,
            to: childId,
            type: 'parent',
            properties: {
              familyId: family.id,
              biological: true // May need additional logic
            }
          });
        }

        if (family.wife) {
          relationships.push({
            from: family.wife,
            to: childId,
            type: 'parent',
            properties: {
              familyId: family.id,
              biological: true
            }
          });
        }
      }

      // Sibling relationships (inferred)
      for (let i = 0; i < family.children.length; i++) {
        for (let j = i + 1; j < family.children.length; j++) {
          relationships.push({
            from: family.children[i],
            to: family.children[j],
            type: 'sibling',
            properties: {
              familyId: family.id
            }
          });
        }
      }
    }

    return { nodes, relationships };
  }

  /**
   * Validate parsed data
   */
  validateData(graphData) {
    // Check for orphaned relationships
    const nodeIds = new Set(graphData.nodes.map(n => n.id));
    
    for (const rel of graphData.relationships) {
      if (!nodeIds.has(rel.from)) {
        this.errors.push(`Relationship references non-existent person: ${rel.from}`);
      }
      if (!nodeIds.has(rel.to)) {
        this.errors.push(`Relationship references non-existent person: ${rel.to}`);
      }
    }

    // Check for logical inconsistencies
    for (const node of graphData.nodes) {
      const profile = node.properties;
      
      // Birth/death date logic
      if (profile.birthDate && profile.deathDate) {
        const birth = new Date(profile.birthDate);
        const death = new Date(profile.deathDate);
        
        if (birth > death) {
          this.errors.push(`${profile.displayName}: Death date before birth date`);
        }
        
        const age = (death - birth) / (365.25 * 24 * 60 * 60 * 1000);
        if (age > 120) {
          this.warnings.push(`${profile.displayName}: Age at death (${Math.floor(age)}) seems unusually high`);
        }
      }

      // Check for missing critical data
      if (!profile.displayName && !profile.firstName && !profile.lastName) {
        this.warnings.push(`Person ${node.id} has no name information`);
      }
    }
  }

  /**
   * Get statistics about parsed data
   */
  getStatistics() {
    const stats = {
      totalIndividuals: this.individuals.size,
      totalFamilies: this.families.size,
      totalRelationships: 0,
      generations: 0,
      dateRange: { earliest: null, latest: null },
      genderDistribution: { male: 0, female: 0, other: 0 },
      livingIndividuals: 0
    };

    // Calculate statistics
    let earliestDate = null;
    let latestDate = null;

    for (const [id, individual] of this.individuals) {
      // Gender distribution
      stats.genderDistribution[individual.profile.gender]++;
      
      // Living individuals
      if (individual.profile.isLiving) {
        stats.livingIndividuals++;
      }

      // Date range
      if (individual.profile.birthDate) {
        const birthDate = new Date(individual.profile.birthDate);
        if (!earliestDate || birthDate < earliestDate) {
          earliestDate = birthDate;
        }
        if (!latestDate || birthDate > latestDate) {
          latestDate = birthDate;
        }
      }
    }

    stats.dateRange.earliest = earliestDate;
    stats.dateRange.latest = latestDate;

    // Calculate generations (simplified)
    stats.generations = this.calculateGenerations();

    return stats;
  }

  /**
   * Calculate number of generations
   */
  calculateGenerations() {
    const visited = new Set();
    let maxGeneration = 0;

    const traverse = (personId, generation = 0) => {
      if (visited.has(personId)) return;
      visited.add(personId);
      
      maxGeneration = Math.max(maxGeneration, generation);
      
      // Find children
      for (const [famId, family] of this.families) {
        if (family.husband === personId || family.wife === personId) {
          for (const childId of family.children) {
            traverse(childId, generation + 1);
          }
        }
      }
    };

    // Start from people without parents
    for (const [id, individual] of this.individuals) {
      if (individual.relationships.parents.length === 0) {
        traverse(id);
      }
    }

    return maxGeneration + 1;
  }
}

export default GEDCOMParser;