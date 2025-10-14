/**
 * Version Manager for Task Weight Calculation Algorithms
 * 
 * Manages multiple versions of weight calculation algorithms
 * Allows for gradual rollout of new calculation methods 
 * Enables A/B testing of different calculation approaches
 */

const admin = require('firebase-admin');
const logger = require('./logger');

// Define available calculation versions
const AVAILABLE_VERSIONS = [
  {
    version: '1.0',
    name: 'Original',
    description: 'Initial version with basic multipliers',
    releaseDate: '2023-01-15',
    deprecationDate: null,
    features: [
      'Base weight calculation',
      'Frequency multipliers',
      'Invisibility factors',
      'Emotional labor assessment',
      'Research-based weights'
    ]
  },
  {
    version: '2.0',
    name: 'Enhanced',
    description: 'Expanded weighting factors with family customization',
    releaseDate: '2023-05-20',
    deprecationDate: null,
    features: [
      'All v1.0 features',
      'Time requirement factors',
      'Skill complexity weighting',
      'Seasonal adjustments',
      'Life stage adaptation',
      'Cultural context sensitivity',
      'Burnout risk assessment'
    ]
  }
];

// Default version to use if none specified
const DEFAULT_VERSION = '2.0';

/**
 * Get all available calculator versions
 * @returns {Array} Array of version objects
 */
async function getVersions() {
  try {
    // Check for dynamic version configuration in Firestore
    let dynamicVersions = [];
    
    try {
      const versionsDoc = await admin.firestore()
        .collection('system')
        .doc('calculatorVersions')
        .get();
      
      if (versionsDoc.exists) {
        dynamicVersions = versionsDoc.data().versions || [];
      }
    } catch (error) {
      logger.warn('Unable to fetch dynamic version information', { error: error.message });
      // Continue with hardcoded versions
    }
    
    // Merge hardcoded versions with any dynamic ones
    const mergedVersions = [...AVAILABLE_VERSIONS];
    
    // Add any dynamic versions not already in the hardcoded list
    dynamicVersions.forEach(dynamicVersion => {
      if (!mergedVersions.some(v => v.version === dynamicVersion.version)) {
        mergedVersions.push(dynamicVersion);
      }
    });
    
    return mergedVersions;
  } catch (error) {
    logger.error('Error retrieving calculator versions', { error: error.message });
    // Fall back to hardcoded versions
    return AVAILABLE_VERSIONS;
  }
}

/**
 * Get the latest available calculator version
 * @returns {string} Latest version identifier
 */
async function getLatestVersion() {
  try {
    // Check if there's a system setting for default version
    let defaultVersion = DEFAULT_VERSION;
    
    try {
      const settingsDoc = await admin.firestore()
        .collection('system')
        .doc('settings')
        .get();
      
      if (settingsDoc.exists && settingsDoc.data().defaultCalculatorVersion) {
        defaultVersion = settingsDoc.data().defaultCalculatorVersion;
      }
    } catch (error) {
      logger.warn('Unable to fetch default version setting', { error: error.message });
      // Continue with hardcoded default
    }
    
    return defaultVersion;
  } catch (error) {
    logger.error('Error determining latest version', { error: error.message });
    return DEFAULT_VERSION;
  }
}

/**
 * Check if a specific version is valid and available
 * @param {string} version - Version identifier to check
 * @returns {boolean} True if version is valid
 */
async function isValidVersion(version) {
  const versions = await getVersions();
  return versions.some(v => v.version === version);
}

/**
 * Get version details for a specific version
 * @param {string} version - Version identifier 
 * @returns {Object} Version details or null if not found
 */
async function getVersionDetails(version) {
  const versions = await getVersions();
  return versions.find(v => v.version === version) || null;
}

/**
 * Register a new calculator version (admin function)
 * @param {Object} versionInfo - Details about the new version
 * @returns {boolean} Success status
 */
async function registerVersion(versionInfo) {
  try {
    if (!versionInfo || !versionInfo.version) {
      throw new Error('Missing required version information');
    }
    
    // Validate version format
    const versionRegex = /^\d+\.\d+(\.\d+)?$/;
    if (!versionRegex.test(versionInfo.version)) {
      throw new Error('Invalid version format. Use semantic versioning (e.g. 1.0, 2.1, 3.0.1)');
    }
    
    // Add to Firestore
    await admin.firestore()
      .collection('system')
      .doc('calculatorVersions')
      .set({
        versions: admin.firestore.FieldValue.arrayUnion(versionInfo)
      }, { merge: true });
    
    logger.info('Registered new calculator version', { version: versionInfo.version });
    return true;
  } catch (error) {
    logger.error('Failed to register new version', { error: error.message });
    throw new Error(`Version registration failed: ${error.message}`);
  }
}

/**
 * Set the default calculator version (admin function)
 * @param {string} version - Version to set as default
 * @returns {boolean} Success status
 */
async function setDefaultVersion(version) {
  try {
    // Validate version exists
    const isValid = await isValidVersion(version);
    if (!isValid) {
      throw new Error(`Version ${version} is not a valid calculator version`);
    }
    
    // Set as default in Firestore
    await admin.firestore()
      .collection('system')
      .doc('settings')
      .set({
        defaultCalculatorVersion: version,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    
    logger.info('Updated default calculator version', { version });
    return true;
  } catch (error) {
    logger.error('Failed to set default version', { error: error.message });
    throw new Error(`Setting default version failed: ${error.message}`);
  }
}

module.exports = {
  getVersions,
  getLatestVersion,
  isValidVersion,
  getVersionDetails,
  registerVersion,
  setDefaultVersion
};