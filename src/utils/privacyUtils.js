// src/utils/privacyUtils.js

/**
 * Privacy utilities for anonymizing and hashing sensitive data
 */

/**
 * Create a one-way hash of input string
 * Uses Web Crypto API when available, falls back to simple hash
 * @param {string} input - String to hash
 * @returns {string} Hashed string
 */
export async function createHash(input) {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      // Use Web Crypto API for secure hashing
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex.substring(0, 16); // Return first 16 chars for consistency
    } catch (error) {
      console.warn('Web Crypto API not available, using fallback hash');
    }
  }
  
  // Fallback simple hash function
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Anonymize a string by removing potential PII
 * @param {string} text - Text to anonymize
 * @returns {string} Anonymized text
 */
export function anonymizeText(text) {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // Remove names (capitalized words)
    .replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, '[NAME]')
    // Remove email addresses
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    // Remove phone numbers
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE]')
    // Remove potential addresses
    .replace(/\b\d{1,5}\s+[A-Za-z\s]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Plaza|Pl)\b/gi, '[ADDRESS]')
    // Remove social security numbers
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
    // Remove credit card numbers
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]');
}

/**
 * Generate anonymous ID with timestamp component
 * @param {string} identifier - Original identifier
 * @param {string} salt - Salt for hashing
 * @returns {Promise<string>} Anonymous ID
 */
export async function generateAnonymousId(identifier, salt = 'default') {
  const timestamp = Math.floor(Date.now() / 86400000); // Daily rotation
  const combined = `${identifier}-${salt}-${timestamp}`;
  const hash = await createHash(combined);
  return `anon_${hash}`;
}

/**
 * Convert exact numbers to privacy-preserving ranges
 * @param {number} value - Numeric value
 * @param {string} type - Type of value (percentage, count, score)
 * @returns {string} Range string
 */
export function numberToRange(value, type = 'general') {
  if (type === 'percentage') {
    if (value < 20) return 'very_low';
    if (value < 40) return 'low';
    if (value < 60) return 'moderate';
    if (value < 80) return 'high';
    return 'very_high';
  }
  
  if (type === 'count') {
    if (value <= 2) return 'few';
    if (value <= 5) return 'several';
    if (value <= 10) return 'many';
    return 'numerous';
  }
  
  if (type === 'age') {
    if (value < 3) return 'toddler';
    if (value < 6) return 'preschool';
    if (value < 9) return 'early_elementary';
    if (value < 12) return 'late_elementary';
    if (value < 15) return 'middle_school';
    if (value < 18) return 'high_school';
    return 'adult';
  }
  
  // General numeric ranges
  if (value < 10) return 'very_low';
  if (value < 30) return 'low';
  if (value < 70) return 'moderate';
  if (value < 90) return 'high';
  return 'very_high';
}

/**
 * Generalize location data for privacy
 * @param {Object} location - Location object with various levels of detail
 * @returns {Object} Generalized location
 */
export function generalizeLocation(location) {
  if (!location) return { region: 'unknown' };
  
  const generalized = {};
  
  // Keep only country and general region
  if (location.country) {
    generalized.country = location.country;
  }
  
  // Generalize to region level
  if (location.state || location.province) {
    generalized.region = 'regional';
  }
  
  // Urban/rural classification
  if (location.population) {
    if (location.population > 500000) {
      generalized.urbanity = 'urban';
    } else if (location.population > 50000) {
      generalized.urbanity = 'suburban';
    } else {
      generalized.urbanity = 'rural';
    }
  }
  
  return generalized;
}

/**
 * Create k-anonymous groups from data
 * @param {Array} data - Array of records
 * @param {number} k - Minimum group size
 * @param {Array} quasiIdentifiers - Fields that could identify individuals
 * @returns {Array} K-anonymous groups
 */
export function createKAnonymousGroups(data, k = 5, quasiIdentifiers = []) {
  if (data.length < k) {
    console.warn(`Dataset too small for k-anonymity (k=${k})`);
    return [];
  }
  
  const groups = [];
  const ungrouped = [...data];
  
  while (ungrouped.length >= k) {
    // Take first record as seed
    const seed = ungrouped.shift();
    const group = [seed];
    
    // Find k-1 most similar records
    const similarities = ungrouped.map((record, index) => ({
      index,
      similarity: calculateSimilarity(seed, record, quasiIdentifiers)
    }));
    
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    // Add most similar records to group
    for (let i = 0; i < k - 1 && i < similarities.length; i++) {
      group.push(ungrouped[similarities[i].index]);
    }
    
    // Remove grouped records
    for (let i = k - 2; i >= 0; i--) {
      ungrouped.splice(similarities[i].index, 1);
    }
    
    groups.push(generalizeGroup(group, quasiIdentifiers));
  }
  
  // Handle remaining records (suppress if less than k)
  if (ungrouped.length > 0) {
    console.warn(`Suppressing ${ungrouped.length} records for k-anonymity`);
  }
  
  return groups;
}

/**
 * Calculate similarity between two records
 * @private
 */
function calculateSimilarity(record1, record2, fields) {
  if (fields.length === 0) return 1;
  
  let matchCount = 0;
  fields.forEach(field => {
    if (record1[field] === record2[field]) {
      matchCount++;
    }
  });
  
  return matchCount / fields.length;
}

/**
 * Generalize a group of records
 * @private
 */
function generalizeGroup(group, quasiIdentifiers) {
  const generalized = {
    size: group.length,
    data: {}
  };
  
  // For each quasi-identifier, find common generalization
  quasiIdentifiers.forEach(field => {
    const values = group.map(record => record[field]);
    const uniqueValues = [...new Set(values)];
    
    if (uniqueValues.length === 1) {
      // All same value
      generalized.data[field] = uniqueValues[0];
    } else {
      // Generalize based on field type
      if (typeof values[0] === 'number') {
        const min = Math.min(...values);
        const max = Math.max(...values);
        generalized.data[field] = `${min}-${max}`;
      } else {
        generalized.data[field] = 'varied';
      }
    }
  });
  
  // Aggregate other data
  const nonQuasiFields = Object.keys(group[0]).filter(
    field => !quasiIdentifiers.includes(field)
  );
  
  nonQuasiFields.forEach(field => {
    const values = group.map(record => record[field]);
    if (typeof values[0] === 'number') {
      // Average for numeric fields
      generalized.data[field] = values.reduce((a, b) => a + b, 0) / values.length;
    } else {
      // Most common for categorical
      const counts = {};
      values.forEach(v => {
        counts[v] = (counts[v] || 0) + 1;
      });
      generalized.data[field] = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])[0][0];
    }
  });
  
  return generalized;
}

/**
 * Apply differential privacy noise to a value
 * @param {number} value - Original value
 * @param {number} sensitivity - Query sensitivity
 * @param {number} epsilon - Privacy parameter (smaller = more privacy)
 * @returns {number} Value with noise added
 */
export function addDifferentialPrivacyNoise(value, sensitivity = 1, epsilon = 1) {
  // Laplace mechanism for differential privacy
  const scale = sensitivity / epsilon;
  
  // Generate Laplace noise
  const u = Math.random() - 0.5;
  const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  
  return value + noise;
}

/**
 * Check if data meets privacy thresholds
 * @param {Object} data - Data to check
 * @param {Object} thresholds - Privacy thresholds
 * @returns {boolean} Whether data meets privacy requirements
 */
export function meetsPrivacyThresholds(data, thresholds = {}) {
  const defaultThresholds = {
    minGroupSize: 5,
    maxSpecificity: 0.2,
    minGeneralization: 3,
    ...thresholds
  };
  
  // Check group size
  if (data.sampleSize && data.sampleSize < defaultThresholds.minGroupSize) {
    return false;
  }
  
  // Check specificity
  if (data.specificity && data.specificity > defaultThresholds.maxSpecificity) {
    return false;
  }
  
  // Check generalization level
  if (data.generalizationLevel && data.generalizationLevel < defaultThresholds.minGeneralization) {
    return false;
  }
  
  return true;
}