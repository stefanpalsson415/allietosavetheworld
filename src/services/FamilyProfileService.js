/**
 * FamilyProfileService.js
 * 
 * A comprehensive service for managing detailed family member profiles 
 * that go beyond basic information to track preferences, patterns,
 * historical data, and personalized insights.
 */

import {
  db,
  collection,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  writeBatch,
  updateDoc
} from './firebase';
import { getUniqueId } from '../utils/DiagnosticUtility';
// Removed circular dependency: DatabaseService will be passed as parameter where needed

// Constants for profile attributes
export const PROFILE_ATTRIBUTES = {
  // Basic info
  BASIC_INFO: 'basicInfo',
  
  // Preferences
  PREFERENCES: 'preferences',
  
  // Schedule patterns
  SCHEDULE_PATTERNS: 'schedulePatterns',
  
  // Health information
  HEALTH: 'health',
  
  // Skills and interests
  SKILLS_INTERESTS: 'skillsInterests',
  
  // Relationship dynamics
  RELATIONSHIP_DYNAMICS: 'relationshipDynamics',
  
  // Parenting style
  PARENTING_STYLE: 'parentingStyle',
  
  // Learning and education
  EDUCATION: 'education',
  
  // Digital presence
  DIGITAL: 'digital',
  
  // Financial
  FINANCIAL: 'financial',
  
  // Social
  SOCIAL: 'social',
  
  // Life events
  LIFE_EVENTS: 'lifeEvents',
  
  // Goals
  GOALS: 'goals',
};

class FamilyProfileService {
  constructor() {
    this.db = db;
    this.profilesCollection = 'familyProfiles';
    this.preferencesCollection = 'memberPreferences';
    this.lifestyleCollection = 'memberLifestyle';
    this.patternsCollection = 'memberPatterns';
    this.insightsCollection = 'memberInsights';
  }

  /**
   * Initialize enhanced profiles for a new family
   *
   * @param {string} familyId - The family ID
   * @param {Array} initialMembers - Array of initial family members
   * @param {Object} databaseService - Optional DatabaseService instance (to avoid circular dependency)
   * @returns {Promise<Object>} - Enhanced profile IDs
   */
  async initializeProfiles(familyId, initialMembers, databaseService = null) {
    try {
      const profileIds = {};
      const batch = writeBatch(this.db);

      // Create enhanced profile for each family member
      for (const member of initialMembers) {
        const profileId = getUniqueId();
        profileIds[member.id] = profileId;

        // Create base profile document
        const profileDocRef = doc(this.db, this.profilesCollection, profileId);
        batch.set(profileDocRef, {
          id: profileId,
          familyId,
          memberId: member.id,
          name: member.name,
          role: member.role,
          created: serverTimestamp(),
          lastUpdated: serverTimestamp(),
          profileCompleteness: 10, // Base profile is 10% complete
          profileVersion: 1,
        });

        // Initialize preferences
        const preferencesDocRef = doc(this.db, this.preferencesCollection, profileId);
        batch.set(preferencesDocRef, {
          id: profileId,
          familyId,
          memberId: member.id,
          communicationStyle: null,
          decisionMakingStyle: null,
          timeManagementStyle: null,
          stressResponses: null,
          learningStyle: null,
          motivationFactors: null,
          parenting: member.role === 'parent' ? {
            style: null,
            strengths: [],
            challenges: [],
            tactics: []
          } : null,
          lastUpdated: serverTimestamp(),
        });

        // Initialize patterns collection (schedule, task performance, etc.)
        const patternsDocRef = doc(this.db, this.patternsCollection, profileId);
        batch.set(patternsDocRef, {
          id: profileId,
          familyId,
          memberId: member.id,
          schedule: {
            weekdayPatterns: {},
            weekendPatterns: {},
            commonActivities: [],
          },
          taskPerformance: {
            preferredTasks: [],
            avoidedTasks: [],
            efficiencyByCategory: {},
          },
          communication: {
            responseRate: null,
            preferredChannels: [],
            topicEngagement: {},
          },
          lastUpdated: serverTimestamp(),
        });
      }

      // Execute batch
      await batch.commit();

      // Update family document with profile IDs (if databaseService provided)
      if (databaseService && databaseService.saveFamilyData) {
        await databaseService.saveFamilyData({
          enhancedProfiles: profileIds
        }, familyId);
      }

      return profileIds;
    } catch (error) {
      console.error('Error initializing family profiles:', error);
      throw error;
    }
  }

  /**
   * Get the enhanced profile for a family member
   * 
   * @param {string} profileId - The profile ID
   * @param {Array} sections - Optional array of sections to fetch (defaults to all)
   * @returns {Promise<Object>} - The complete enhanced profile
   */
  async getEnhancedProfile(profileId, sections = null) {
    try {
      const profile = {};

      // Get base profile
      const profileDocRef = doc(this.db, this.profilesCollection, profileId);
      const profileDoc = await getDoc(profileDocRef);
      if (!profileDoc.exists()) {
        throw new Error(`Profile ${profileId} not found`);
      }
      profile.base = profileDoc.data();

      // Get requested sections or all sections if none specified
      const sectionFetches = [];
      
      if (!sections || sections.includes(PROFILE_ATTRIBUTES.PREFERENCES)) {
        const preferencesDocRef = doc(this.db, this.preferencesCollection, profileId);
        sectionFetches.push(getDoc(preferencesDocRef)
          .then(doc => profile.preferences = doc.exists() ? doc.data() : null));
      }
      
      if (!sections || sections.includes(PROFILE_ATTRIBUTES.SCHEDULE_PATTERNS)) {
        const patternsDocRef = doc(this.db, this.patternsCollection, profileId);
        sectionFetches.push(getDoc(patternsDocRef)
          .then(doc => profile.patterns = doc.exists() ? doc.data() : null));
      }
      
      if (!sections || sections.includes(PROFILE_ATTRIBUTES.HEALTH)) {
        const lifestyleDocRef = doc(this.db, this.lifestyleCollection, profileId);
        sectionFetches.push(getDoc(lifestyleDocRef)
          .then(doc => profile.lifestyle = doc.exists() ? doc.data() : null));
      }
      
      if (!sections || sections.includes(PROFILE_ATTRIBUTES.SKILLS_INTERESTS)) {
        const insightsDocRef = doc(this.db, this.insightsCollection, profileId);
        sectionFetches.push(getDoc(insightsDocRef)
          .then(doc => profile.insights = doc.exists() ? doc.data() : null));
      }

      // Wait for all fetches to complete
      await Promise.all(sectionFetches);

      return profile;
    } catch (error) {
      console.error(`Error fetching enhanced profile ${profileId}:`, error);
      throw error;
    }
  }

  /**
   * Update specific sections of a family member's enhanced profile
   * 
   * @param {string} profileId - The profile ID
   * @param {string} section - The section to update (use PROFILE_ATTRIBUTES constants)
   * @param {Object} data - The data to update
   * @returns {Promise<boolean>} - Whether the update was successful
   */
  async updateProfileSection(profileId, section, data) {
    try {
      // Get the appropriate collection based on section
      let collectionName;
      switch (section) {
        case PROFILE_ATTRIBUTES.BASIC_INFO:
          collectionName = this.profilesCollection;
          break;
        case PROFILE_ATTRIBUTES.PREFERENCES:
          collectionName = this.preferencesCollection;
          break;
        case PROFILE_ATTRIBUTES.SCHEDULE_PATTERNS:
          collectionName = this.patternsCollection;
          break;
        case PROFILE_ATTRIBUTES.HEALTH:
          collectionName = this.lifestyleCollection;
          break;
        case PROFILE_ATTRIBUTES.SKILLS_INTERESTS:
        case PROFILE_ATTRIBUTES.GOALS:
          collectionName = this.insightsCollection;
          break;
        default:
          throw new Error(`Unknown profile section: ${section}`);
      }

      // Update the document
      const docRef = doc(this.db, collectionName, profileId);
      await updateDoc(docRef, {
        ...data,
        lastUpdated: serverTimestamp()
      });

      // Update profile completeness
      await this.updateProfileCompleteness(profileId);

      return true;
    } catch (error) {
      console.error(`Error updating profile section ${section}:`, error);
      throw error;
    }
  }

  /**
   * Add a life event to a family member's timeline
   * 
   * @param {string} profileId - The profile ID
   * @param {Object} event - The life event to add
   * @returns {Promise<string>} - The ID of the added event
   */
  async addLifeEvent(profileId, event) {
    try {
      const eventId = event.id || getUniqueId();
      const timestamp = serverTimestamp();

      const eventData = {
        ...event,
        id: eventId,
        created: timestamp,
        lastUpdated: timestamp,
      };

      // Get reference to the life events subcollection
      const profileDocRef = doc(this.db, this.profilesCollection, profileId);
      const lifeEventsRef = collection(profileDocRef, 'lifeEvents');
      const eventDocRef = doc(lifeEventsRef, eventId);
      await setDoc(eventDocRef, eventData);

      return eventId;
    } catch (error) {
      console.error('Error adding life event:', error);
      throw error;
    }
  }

  /**
   * Record an observed pattern for a family member
   * 
   * @param {string} profileId - The profile ID
   * @param {string} patternType - The type of pattern (schedule, task, communication)
   * @param {Object} patternData - The pattern data
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async recordPattern(profileId, patternType, patternData) {
    try {
      const patternsDocRef = doc(this.db, this.patternsCollection, profileId);
      const patternsSnap = await getDoc(patternsDocRef);

      if (!patternsSnap.exists()) {
        throw new Error(`Patterns document not found for profile ${profileId}`);
      }

      // Get existing patterns
      const patterns = patternsSnap.data();

      // Update based on pattern type
      let fieldName;
      switch (patternType) {
        case 'schedule':
          fieldName = 'schedule';
          break;
        case 'task':
          fieldName = 'taskPerformance';
          break;
        case 'communication':
          fieldName = 'communication';
          break;
        default:
          throw new Error(`Unknown pattern type: ${patternType}`);
      }

      // Merge new pattern data with existing data
      const updatedPatternData = {
        ...patterns[fieldName],
        ...patternData,
      };

      // Update document
      await updateDoc(patternsDocRef, {
        [fieldName]: updatedPatternData,
        lastUpdated: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Error recording pattern:', error);
      throw error;
    }
  }

  /**
   * Add a preference for a family member
   * 
   * @param {string} profileId - The profile ID
   * @param {string} preferenceType - The type of preference
   * @param {any} value - The preference value
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async setPreference(profileId, preferenceType, value) {
    try {
      const preferencesDocRef = doc(this.db, this.preferencesCollection, profileId);
      
      // Update document
      await updateDoc(preferencesDocRef, {
        [preferenceType]: value,
        lastUpdated: serverTimestamp()
      });

      // Update profile completeness
      await this.updateProfileCompleteness(profileId);

      return true;
    } catch (error) {
      console.error('Error setting preference:', error);
      throw error;
    }
  }

  /**
   * Record schedule pattern data for a family member
   * 
   * @param {string} profileId - The profile ID
   * @param {string} patternType - 'weekday' or 'weekend'
   * @param {Object} patternData - The schedule pattern data
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async updateSchedulePattern(profileId, patternType, patternData) {
    try {
      const field = patternType === 'weekday' ? 'schedule.weekdayPatterns' : 'schedule.weekendPatterns';
      
      // Add timestamp to the pattern data
      const timestampedData = {
        ...patternData,
        lastUpdated: new Date().toISOString()
      };
      
      return await this.recordPattern(profileId, 'schedule', {
        [patternType === 'weekday' ? 'weekdayPatterns' : 'weekendPatterns']: timestampedData
      });
    } catch (error) {
      console.error('Error updating schedule pattern:', error);
      throw error;
    }
  }

  /**
   * Record communication pattern data for a family member
   * 
   * @param {string} profileId - The profile ID
   * @param {Object} communicationData - The communication pattern data
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async updateCommunicationPattern(profileId, communicationData) {
    try {
      return await this.recordPattern(profileId, 'communication', communicationData);
    } catch (error) {
      console.error('Error updating communication pattern:', error);
      throw error;
    }
  }

  /**
   * Calculate and update profile completeness percentage
   * 
   * @param {string} profileId - The profile ID
   * @returns {Promise<number>} - The updated completeness percentage
   */
  async updateProfileCompleteness(profileId) {
    try {
      // Fetch all profile sections
      const profile = await this.getEnhancedProfile(profileId);
      
      // Define the total number of profile sections
      const totalSections = 12;
      let completedSections = 0;
      
      // Check base profile
      if (profile.base) {
        completedSections += 1;
      }
      
      // Check preferences
      if (profile.preferences) {
        const preferencesData = profile.preferences;
        if (preferencesData.communicationStyle) completedSections += 0.5;
        if (preferencesData.decisionMakingStyle) completedSections += 0.5;
        if (preferencesData.timeManagementStyle) completedSections += 0.5;
        if (preferencesData.stressResponses) completedSections += 0.5;
        if (preferencesData.learningStyle) completedSections += 0.5;
        if (preferencesData.motivationFactors) completedSections += 0.5;
        if (preferencesData.parenting && preferencesData.parenting.style) completedSections += 1;
      }
      
      // Check patterns
      if (profile.patterns) {
        const patternsData = profile.patterns;
        if (patternsData.schedule && 
            (Object.keys(patternsData.schedule.weekdayPatterns).length > 0 || 
             Object.keys(patternsData.schedule.weekendPatterns).length > 0)) {
          completedSections += 1;
        }
        if (patternsData.taskPerformance && 
            (patternsData.taskPerformance.preferredTasks.length > 0 || 
             Object.keys(patternsData.taskPerformance.efficiencyByCategory).length > 0)) {
          completedSections += 1;
        }
        if (patternsData.communication && 
            (patternsData.communication.preferredChannels.length > 0 || 
             patternsData.communication.responseRate)) {
          completedSections += 1;
        }
      }
      
      // Check lifestyle
      if (profile.lifestyle) {
        const lifestyleData = profile.lifestyle;
        if (lifestyleData.health) completedSections += 1;
        if (lifestyleData.schedule) completedSections += 1;
        if (lifestyleData.interests) completedSections += 1;
      }
      
      // Check insights
      if (profile.insights) {
        const insightsData = profile.insights;
        if (insightsData.strengths && insightsData.strengths.length > 0) completedSections += 0.5;
        if (insightsData.challenges && insightsData.challenges.length > 0) completedSections += 0.5;
        if (insightsData.skills && insightsData.skills.length > 0) completedSections += 1;
        if (insightsData.goals && insightsData.goals.length > 0) completedSections += 1;
      }
      
      // Calculate completeness percentage (cap at 100%)
      const completeness = Math.min(100, Math.round((completedSections / totalSections) * 100));
      
      // Update profile document with new completeness
      const profileDocRef = doc(this.db, this.profilesCollection, profileId);
      await updateDoc(profileDocRef, {
        profileCompleteness: completeness,
        lastUpdated: serverTimestamp()
      });
      
      return completeness;
    } catch (error) {
      console.error('Error updating profile completeness:', error);
      throw error;
    }
  }

  /**
   * Get all family members' enhanced profiles
   *
   * @param {string} familyId - The family ID
   * @param {Object} databaseService - Optional DatabaseService instance (to avoid circular dependency)
   * @returns {Promise<Object>} - Object with member IDs as keys and profiles as values
   */
  async getFamilyProfiles(familyId, databaseService = null) {
    try {
      // Get family document to get profile IDs
      let familyData = null;
      if (databaseService && databaseService.loadFamilyData) {
        familyData = await databaseService.loadFamilyData(familyId);
      }

      if (!familyData || !familyData.enhancedProfiles) {
        // No enhanced profiles yet
        return {};
      }

      const profileIds = familyData.enhancedProfiles;
      const profiles = {};

      // Fetch each profile
      const profilePromises = Object.entries(profileIds).map(async ([memberId, profileId]) => {
        try {
          const profile = await this.getEnhancedProfile(profileId);
          profiles[memberId] = profile;
        } catch (error) {
          console.error(`Error fetching profile for member ${memberId}:`, error);
          profiles[memberId] = null;
        }
      });

      await Promise.all(profilePromises);

      return profiles;
    } catch (error) {
      console.error('Error fetching family profiles:', error);
      throw error;
    }
  }

  /**
   * Extract member profile insights for use in AI/personalization
   * 
   * @param {string} profileId - The profile ID
   * @returns {Promise<Object>} - Condensed profile insights
   */
  async getProfileInsights(profileId) {
    try {
      const profile = await this.getEnhancedProfile(profileId);
      
      // Extract key insights from the profile sections
      const insights = {
        communicationStyle: profile.preferences?.communicationStyle || null,
        decisionMakingStyle: profile.preferences?.decisionMakingStyle || null,
        learningStyle: profile.preferences?.learningStyle || null,
        motivations: profile.preferences?.motivationFactors || [],
        stressResponses: profile.preferences?.stressResponses || null,
        strengths: profile.insights?.strengths || [],
        challenges: profile.insights?.challenges || [],
        preferredTasks: profile.patterns?.taskPerformance?.preferredTasks || [],
        avoidedTasks: profile.patterns?.taskPerformance?.avoidedTasks || [],
        commonActivities: profile.patterns?.schedule?.commonActivities || [],
        healthConsiderations: profile.lifestyle?.health?.considerations || [],
        goals: profile.insights?.goals || [],
      };
      
      return insights;
    } catch (error) {
      console.error('Error getting profile insights:', error);
      throw error;
    }
  }
}

const familyProfileService = new FamilyProfileService();
export default familyProfileService;