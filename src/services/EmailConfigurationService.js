import { db } from './firebase';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * EmailConfigurationService - Handles all email configuration for families
 * Standardizes email domain usage and provides methods for email management
 */
class EmailConfigurationService {
  // Primary email domain for all family emails
  static EMAIL_DOMAIN = '@families.checkallie.com';
  
  // Legacy domains for backward compatibility
  static LEGACY_DOMAINS = ['@checkallie.com', '@allie.family', '@allie.parentload.com'];
  
  // Email format regex for validation - allow dots, dashes, underscores
  static EMAIL_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

  /**
   * Generate a unique email address for a family
   * @param {string} familyName - The family name
   * @param {string} familyId - The family ID
   * @returns {string} Generated email address
   */
  static generateFamilyEmail(familyName, familyId) {
    // Clean the family name for email use
    const cleanName = familyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20); // Limit length
    
    // If no clean name or too short, use a default
    if (!cleanName || cleanName.length < 3) {
      // Use first 8 chars of family ID as fallback
      const fallback = `family${familyId.substring(0, 8)}`;
      return `${fallback}${this.EMAIL_DOMAIN}`;
    }
    
    // Return the clean name with domain
    return `${cleanName}${this.EMAIL_DOMAIN}`;
  }

  /**
   * Validate an email prefix (part before @)
   * @param {string} emailPrefix - The email prefix to validate
   * @returns {object} { isValid: boolean, error?: string }
   */
  static validateEmailPrefix(emailPrefix) {
    if (!emailPrefix || emailPrefix.length === 0) {
      return { isValid: false, error: 'Email prefix cannot be empty' };
    }
    
    if (emailPrefix.length < 3) {
      return { isValid: false, error: 'Email prefix must be at least 3 characters' };
    }
    
    if (emailPrefix.length > 30) {
      return { isValid: false, error: 'Email prefix cannot exceed 30 characters' };
    }
    
    if (!this.EMAIL_REGEX.test(emailPrefix)) {
      return { isValid: false, error: 'Email can only contain letters, numbers, dots, and hyphens' };
    }
    
    if (emailPrefix.startsWith('.') || emailPrefix.endsWith('.')) {
      return { isValid: false, error: 'Email cannot start or end with a dot' };
    }
    
    if (emailPrefix.includes('..')) {
      return { isValid: false, error: 'Email cannot contain consecutive dots' };
    }
    
    return { isValid: true };
  }

  /**
   * Format email with the standard domain
   * @param {string} emailPrefix - The email prefix
   * @returns {string} Full email address
   */
  static formatEmail(emailPrefix) {
    const cleanPrefix = emailPrefix.toLowerCase().trim();
    return `${cleanPrefix}${this.EMAIL_DOMAIN}`;
  }

  /**
   * Extract email prefix from a full email address
   * @param {string} fullEmail - The full email address
   * @returns {string} Email prefix
   */
  static extractEmailPrefix(fullEmail) {
    if (!fullEmail) return '';
    
    // Handle any of our domains
    const allDomains = [this.EMAIL_DOMAIN, ...this.LEGACY_DOMAINS];
    
    for (const domain of allDomains) {
      if (fullEmail.endsWith(domain)) {
        return fullEmail.slice(0, -domain.length);
      }
    }
    
    // If no known domain, return the part before @
    const atIndex = fullEmail.indexOf('@');
    return atIndex > -1 ? fullEmail.substring(0, atIndex) : fullEmail;
  }

  /**
   * Save the selected email to the family document
   * @param {string} familyId - The family ID
   * @param {string} emailPrefix - The selected email prefix
   * @returns {Promise<object>} Result object with success status
   */
  static async saveFamilyEmail(familyId, emailPrefix) {
    try {
      const validation = this.validateEmailPrefix(emailPrefix);
      if (!validation.isValid) {
        return { success: false, error: validation.error };
      }
      
      const fullEmail = this.formatEmail(emailPrefix);
      const familyRef = doc(db, 'families', familyId);
      
      await updateDoc(familyRef, {
        // Save in both formats for compatibility
        familyEmail: fullEmail,
        familyEmailPrefix: emailPrefix.toLowerCase(),
        // Also save in old format for backward compatibility
        email: fullEmail,
        emailPrefix: emailPrefix.toLowerCase(),
        emailDomain: this.EMAIL_DOMAIN,
        emailUpdatedAt: new Date(),
        // Keep legacy email for backward compatibility
        legacyEmail: `${emailPrefix.toLowerCase()}@checkallie.com`
      });
      
      return { success: true, email: fullEmail };
    } catch (error) {
      console.error('Error saving family email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get the family's email address
   * @param {string} familyId - The family ID
   * @returns {Promise<string|null>} The family's email or null
   */
  static async getFamilyEmail(familyId) {
    try {
      const familyRef = doc(db, 'families', familyId);
      const familyDoc = await getDoc(familyRef);
      
      if (!familyDoc.exists()) {
        return null;
      }
      
      const data = familyDoc.data();
      
      // First check for familyEmail (full email from onboarding)
      if (data.familyEmail) {
        return data.familyEmail;
      }
      
      // Then check for familyEmailPrefix (custom chosen email prefix)
      if (data.familyEmailPrefix) {
        return this.formatEmail(data.familyEmailPrefix);
      }
      
      // Then check for emailPrefix (legacy field)
      if (data.emailPrefix) {
        return this.formatEmail(data.emailPrefix);
      }
      
      // Then check for stored email
      if (data.email) {
        return data.email;
      }
      
      // Generate one if it doesn't exist
      const generatedEmail = this.generateFamilyEmail(data.name || 'family', familyId);
      await this.saveFamilyEmail(familyId, this.extractEmailPrefix(generatedEmail));
      
      return generatedEmail;
    } catch (error) {
      console.error('Error getting family email:', error);
      return null;
    }
  }

  /**
   * Update the family's email address
   * @param {string} familyId - The family ID
   * @param {string} newEmailPrefix - The new email prefix
   * @returns {Promise<object>} Result object with success status
   */
  static async updateFamilyEmail(familyId, newEmailPrefix) {
    return this.saveFamilyEmail(familyId, newEmailPrefix);
  }

  /**
   * Check if an email prefix is available
   * @param {string} emailPrefix - The email prefix to check
   * @param {string} excludeFamilyId - Optional family ID to exclude from check (for re-onboarding)
   * @returns {Promise<boolean>} True if available, false otherwise
   */
  static async isEmailPrefixAvailable(emailPrefix, excludeFamilyId = null) {
    // TEMPORARILY SIMPLIFIED - Allow all non-reserved emails for testing
    const reserved = [
      'admin', 'support', 'help', 'info', 'contact',
      'noreply', 'no-reply', 'postmaster', 'webmaster',
      'abuse', 'security', 'privacy', 'legal', 'billing'
    ];

    const lowerPrefix = emailPrefix.toLowerCase();

    if (reserved.includes(lowerPrefix)) {
      return false;
    }

    // TEMPORARY: Just return true for all non-reserved emails
    // TODO: Fix the database query logic
    console.log(`[EmailConfig] TEMP: Allowing email "${lowerPrefix}" without database check`);
    return true;

    try {
      // Check Firestore for existing families with this email prefix
      const familiesRef = collection(db, 'families');
      const fullEmail = this.formatEmail(lowerPrefix);

      // Only check the current active email fields (not legacy fields)
      // This allows families to reuse emails that were previously set but changed
      const queries = [
        query(familiesRef, where('familyEmail', '==', fullEmail)),
        query(familiesRef, where('familyEmailPrefix', '==', lowerPrefix))
      ];

      // Run queries and check if any return results
      console.log(`[EmailConfig] Checking availability for "${lowerPrefix}" / "${fullEmail}"`);

      for (const q of queries) {
        const snapshot = await getDocs(q);
        console.log(`[EmailConfig] Query returned ${snapshot.size} results`);

        if (!snapshot.empty) {
          // Double-check that this is actually a real conflict
          // Sometimes families have incomplete setups or test data
          const docs = snapshot.docs;
          console.log('[EmailConfig] Found docs:', docs.map(doc => ({
            id: doc.id,
            familyEmail: doc.data().familyEmail,
            familyEmailPrefix: doc.data().familyEmailPrefix,
            memberIds: doc.data().memberIds
          })));

          const hasActiveFamily = docs.some(doc => {
            const data = doc.data();
            // Only consider it taken if the family has members and is active
            const hasMembersAndEmail = data.memberIds && data.memberIds.length > 0 &&
                   (data.familyEmail === fullEmail || data.familyEmailPrefix === lowerPrefix);

            if (hasMembersAndEmail) {
              console.log(`[EmailConfig] Found active family using this email:`, {
                id: doc.id,
                familyName: data.name || data.familyName,
                memberCount: data.memberIds?.length || 0,
                familyEmail: data.familyEmail,
                familyEmailPrefix: data.familyEmailPrefix
              });
            }

            return hasMembersAndEmail;
          });

          if (hasActiveFamily) {
            console.log(`[EmailConfig] Email prefix "${lowerPrefix}" is TAKEN`);
            return false; // Email is already taken by an active family
          }
        }
      }

      console.log(`[EmailConfig] Email prefix "${lowerPrefix}" is AVAILABLE`);

      return true; // Email is available
    } catch (error) {
      console.error('Error checking email availability:', error);
      // Default to unavailable on error to prevent duplicates
      return false;
    }
  }

  /**
   * Get suggested email prefixes based on family name
   * @param {string} familyName - The family name
   * @returns {Promise<string[]>} Array of available suggested email prefixes
   */
  static async getSuggestedEmails(familyName) {
    const baseName = familyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    const baseSuggestions = [
      baseName,
      `${baseName}family`,
      `the${baseName}s`,
      `${baseName}crew`,
      `${baseName}home`
    ];

    // Filter out empty or too short suggestions
    const validSuggestions = baseSuggestions.filter(s => s.length >= 3);

    // Check availability and add numbers if needed
    const availableSuggestions = [];

    for (const suggestion of validSuggestions) {
      // Check if base suggestion is available
      const isAvailable = await this.isEmailPrefixAvailable(suggestion);
      if (isAvailable) {
        availableSuggestions.push(suggestion);
      } else {
        // Try adding numbers to make it unique
        for (let i = 2; i <= 9; i++) {
          const numberedSuggestion = `${suggestion}${i}`;
          const isNumberedAvailable = await this.isEmailPrefixAvailable(numberedSuggestion);
          if (isNumberedAvailable) {
            availableSuggestions.push(numberedSuggestion);
            break; // Stop once we find an available one
          }
        }
      }

      // Return up to 5 suggestions
      if (availableSuggestions.length >= 5) {
        break;
      }
    }

    // If we still don't have any suggestions, generate random ones
    if (availableSuggestions.length === 0) {
      const randomSuffix = Math.floor(Math.random() * 9999);
      availableSuggestions.push(`${baseName}${randomSuffix}`);
    }

    return availableSuggestions.slice(0, 5);
  }

  /**
   * Migrate legacy email to new format
   * @param {string} familyId - The family ID
   * @returns {Promise<object>} Migration result
   */
  static async migrateLegacyEmail(familyId) {
    try {
      const familyRef = doc(db, 'families', familyId);
      const familyDoc = await getDoc(familyRef);
      
      if (!familyDoc.exists()) {
        return { success: false, error: 'Family not found' };
      }
      
      const data = familyDoc.data();
      
      // If already has new format email, no migration needed
      if (data.email && data.email.endsWith(this.EMAIL_DOMAIN)) {
        return { success: true, email: data.email, migrated: false };
      }
      
      // Extract prefix from legacy email
      let emailPrefix = '';
      if (data.email) {
        emailPrefix = this.extractEmailPrefix(data.email);
      } else if (data.legacyEmail) {
        emailPrefix = this.extractEmailPrefix(data.legacyEmail);
      } else {
        // Generate new email
        emailPrefix = this.extractEmailPrefix(
          this.generateFamilyEmail(data.name || 'family', familyId)
        );
      }
      
      // Save with new format
      const result = await this.saveFamilyEmail(familyId, emailPrefix);
      
      return { ...result, migrated: true };
    } catch (error) {
      console.error('Error migrating legacy email:', error);
      return { success: false, error: error.message };
    }
  }
}

export default EmailConfigurationService;