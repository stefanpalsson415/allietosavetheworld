// Smart Email Generation Utility
// This utility creates functional placeholder emails that route to the primary email

/**
 * Generates a smart placeholder email that routes to the primary email
 * @param {string} name - The family member's name
 * @param {string} primaryEmail - The verified primary email address
 * @returns {string} Smart placeholder email (e.g., "kimberly+spalsson@gmail.com")
 */
export const generateSmartEmail = (name, primaryEmail) => {
  // Handle edge cases
  if (!name || !primaryEmail || !primaryEmail.includes('@')) {
    console.warn('Invalid input for smart email generation:', { name, primaryEmail });
    return null;
  }

  try {
    // Extract the username and domain from primary email
    const [username, domain] = primaryEmail.split('@');
    
    // Create a clean version of the name (lowercase, no spaces, alphanumeric only)
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
      .trim();
    
    // If name is empty after cleaning, use a generic placeholder
    const finalName = cleanName || 'member';
    
    // Generate smart email: name+username@domain
    // This format works with Gmail, Outlook, and most email providers
    return `${finalName}+${username}@${domain}`;
  } catch (error) {
    console.error('Error generating smart email:', error);
    return null;
  }
};

/**
 * Checks if an email is a smart placeholder email
 * @param {string} email - The email to check
 * @returns {boolean} True if it's a smart placeholder email
 */
export const isSmartPlaceholderEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  // Check if email contains the '+' character used in smart emails
  // and doesn't end with '.family' (old fake email format)
  return email.includes('+') && !email.endsWith('.family');
};

/**
 * Extracts the primary email from a smart placeholder email
 * @param {string} smartEmail - The smart placeholder email
 * @returns {string|null} The primary email or null if not a smart email
 */
export const extractPrimaryEmail = (smartEmail) => {
  if (!isSmartPlaceholderEmail(smartEmail)) return null;
  
  try {
    // Extract everything after the + and rebuild the primary email
    const [localPart, domain] = smartEmail.split('@');
    const primaryUsername = localPart.split('+')[1];
    return `${primaryUsername}@${domain}`;
  } catch (error) {
    console.error('Error extracting primary email:', error);
    return null;
  }
};

/**
 * Converts old fake emails to smart placeholder emails
 * @param {string} fakeEmail - The old fake email (e.g., "kimberly@palsson.family")
 * @param {string} primaryEmail - The verified primary email to use
 * @returns {string} Smart placeholder email
 */
export const convertFakeToSmartEmail = (fakeEmail, primaryEmail) => {
  if (!fakeEmail || !fakeEmail.endsWith('.family')) {
    return fakeEmail; // Not a fake email, return as-is
  }
  
  // Extract the name from the fake email
  const name = fakeEmail.split('@')[0];
  
  // Generate smart email
  return generateSmartEmail(name, primaryEmail);
};

/**
 * Generates a family-wide email mapping for all members
 * @param {Array} familyMembers - Array of family member objects
 * @param {string} primaryEmail - The verified primary email
 * @returns {Object} Mapping of member names to smart emails
 */
export const generateFamilyEmailMapping = (familyMembers, primaryEmail) => {
  const emailMapping = {};
  
  familyMembers.forEach(member => {
    if (member.email === primaryEmail) {
      // Primary member keeps their real email
      emailMapping[member.name] = primaryEmail;
    } else {
      // Other members get smart placeholder emails
      emailMapping[member.name] = generateSmartEmail(member.name, primaryEmail);
    }
  });
  
  return emailMapping;
};

// Export all functions as default object too
export default {
  generateSmartEmail,
  isSmartPlaceholderEmail,
  extractPrimaryEmail,
  convertFakeToSmartEmail,
  generateFamilyEmailMapping
};