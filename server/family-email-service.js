// Family Email Service - Handle unique email selection
const express = require('express');
const router = express.Router();

// Simulated database of taken emails (replace with real DB)
const takenEmails = new Set([
  'smith@families.checkallie.com',
  'johnson@families.checkallie.com',
  'wilson@families.checkallie.com'
]);

/**
 * Generate email suggestions for a family
 */
function generateEmailSuggestions(familyName, zipCode = '') {
  const base = familyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special characters
    .substring(0, 20); // Limit length
  
  const suggestions = [];
  
  // First suggestion: just the family name
  suggestions.push(base);
  
  // If taken, add numbers
  if (takenEmails.has(`${base}@families.checkallie.com`)) {
    // Try base + numbers
    for (let i = 1; i <= 3; i++) {
      suggestions.push(`${base}${i}`);
    }
    
    // Try with zip code (if provided)
    if (zipCode) {
      suggestions.push(`${base}${zipCode.substring(0, 5)}`);
    }
    
    // Try with year
    suggestions.push(`${base}${new Date().getFullYear()}`);
    
    // Creative variations
    suggestions.push(`the${base}family`);
    suggestions.push(`${base}fam`);
  }
  
  // Filter out any that are already taken
  return suggestions
    .filter(email => !takenEmails.has(`${email}@families.checkallie.com`))
    .slice(0, 5); // Return max 5 suggestions
}

/**
 * Check if an email is available
 */
router.post('/api/family/check-email', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate format
    const emailRegex = /^[a-z0-9][a-z0-9-_]{2,30}$/;
    if (!emailRegex.test(email)) {
      return res.json({
        available: false,
        reason: 'Invalid format. Use only letters, numbers, dash, and underscore.',
        rules: [
          'Must start with letter or number',
          'Length: 3-30 characters',
          'Only lowercase letters, numbers, dash (-), underscore (_)'
        ]
      });
    }
    
    const fullEmail = `${email}@families.checkallie.com`;
    const isAvailable = !takenEmails.has(fullEmail);
    
    res.json({
      available: isAvailable,
      email: email,
      fullEmail: fullEmail,
      ...(isAvailable 
        ? { message: 'Great choice! This email is available.' }
        : { 
            message: 'This email is already taken.',
            suggestions: generateEmailSuggestions(email)
          }
      )
    });
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ error: 'Failed to check email availability' });
  }
});

/**
 * Get email suggestions based on family name
 */
router.post('/api/family/email-suggestions', async (req, res) => {
  try {
    const { familyName, zipCode } = req.body;
    
    if (!familyName) {
      return res.status(400).json({ error: 'Family name is required' });
    }
    
    const suggestions = generateEmailSuggestions(familyName, zipCode);
    
    res.json({
      familyName,
      baseSuggestion: familyName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      suggestions: suggestions.map(s => ({
        local: s,
        full: `${s}@families.checkallie.com`,
        available: true
      })),
      customMessage: suggestions.length === 0 
        ? 'All our suggestions are taken. Please create a custom email!'
        : 'Here are some available options, or create your own!'
    });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

/**
 * Claim a family email
 */
router.post('/api/family/claim-email', async (req, res) => {
  try {
    const { familyId, email, familyName } = req.body;
    
    // Validate format again
    const emailRegex = /^[a-z0-9][a-z0-9-_]{2,30}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }
    
    const fullEmail = `${email}@families.checkallie.com`;
    
    // Double-check availability
    if (takenEmails.has(fullEmail)) {
      return res.status(409).json({
        error: 'Email is no longer available',
        suggestions: generateEmailSuggestions(email)
      });
    }
    
    // Claim it!
    takenEmails.add(fullEmail);
    
    // In real implementation, save to database:
    // await db.collection('families').doc(familyId).update({
    //   email: fullEmail,
    //   emailPrefix: email,
    //   emailClaimedAt: new Date()
    // });
    
    res.json({
      success: true,
      email: fullEmail,
      instructions: {
        setup: `Your family email ${fullEmail} is now active!`,
        usage: [
          'Save this email to your contacts',
          'Forward any schedules, invitations, or important emails',
          'Allie will automatically process and add events to your calendar'
        ]
      }
    });
  } catch (error) {
    console.error('Error claiming email:', error);
    res.status(500).json({ error: 'Failed to claim email' });
  }
});

/**
 * Search for similar emails (for admin/support)
 */
router.get('/api/family/email-search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const searchTerm = query.toLowerCase();
    
    const similar = Array.from(takenEmails)
      .filter(email => email.includes(searchTerm))
      .slice(0, 10);
    
    res.json({
      query: searchTerm,
      results: similar,
      count: similar.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;