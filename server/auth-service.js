const express = require('express');
const router = express.Router();
const emailService = require('./sendgrid-email-service');
const admin = require('./firebase-admin');

// Initialize Firestore
const db = admin.firestore();

// Store OTPs temporarily (use Redis in production)
const otpStore = new Map();

/**
 * Check family status endpoint
 */
router.post('/check-family-status', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
    }
    
    // Search for family by email using admin privileges
    let familyData = null;
    let familyId = null;
    let isIncomplete = false;
    
    // Query families collection
    const familiesSnapshot = await db.collection('families').get();
    
    for (const doc of familiesSnapshot.docs) {
      const data = doc.data();
      
      // Check various email fields
      const emailLower = email.toLowerCase();
      let found = false;
      
      // Check main email
      if (data.email && data.email.toLowerCase() === emailLower) {
        found = true;
      }
      
      // Check primaryEmail
      if (!found && data.primaryEmail && data.primaryEmail.toLowerCase() === emailLower) {
        found = true;
      }
      
      // Check family members
      if (!found && data.familyMembers) {
        const memberMatch = data.familyMembers.find(member => 
          member.email && member.email.toLowerCase() === emailLower
        );
        if (memberMatch) {
          found = true;
        }
      }
      
      if (found) {
        familyId = doc.id;
        familyData = data;
        
        // Check if family setup is incomplete
        isIncomplete = !data.setupComplete || 
                      !data.surveyCompleted ||
                      !data.phoneVerified;
        break;
      }
    }
    
    return res.json({
      success: true,
      familyExists: !!familyData,
      isIncomplete: isIncomplete,
      familyId: familyId,
      familyData: isIncomplete ? {
        familyName: familyData?.familyName,
        setupComplete: familyData?.setupComplete,
        surveyCompleted: familyData?.surveyCompleted,
        phoneVerified: familyData?.phoneVerified
      } : null
    });
    
  } catch (error) {
    console.error('Error checking family status:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to check family status' 
    });
  }
});

/**
 * Send OTP to email
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email, userName } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // First, check if email exists in any family
    let emailFound = false;
    const familiesSnapshot = await db.collection('families').get();
    
    for (const doc of familiesSnapshot.docs) {
      const data = doc.data();
      const emailLower = email.toLowerCase();
      
      // Check all possible email locations
      if (data.email && data.email.toLowerCase() === emailLower) {
        emailFound = true;
        break;
      }
      
      if (data.primaryEmail && data.primaryEmail.toLowerCase() === emailLower) {
        emailFound = true;
        break;
      }
      
      if (data.familyMembers) {
        const memberMatch = data.familyMembers.find(member => 
          member.email && member.email.toLowerCase() === emailLower
        );
        if (memberMatch) {
          emailFound = true;
          break;
        }
      }
    }
    
    if (!emailFound) {
      return res.status(404).json({ 
        success: false, 
        error: 'No account found with this email. Please sign up first.' 
      });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration
    otpStore.set(email, {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0
    });
    
    // Send email
    await emailService.sendOTPEmail(email, otp, userName);
    
    res.json({ 
      success: true, 
      message: 'Verification code sent!',
      // Only in development
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ 
      error: 'Failed to send verification code',
      details: error.message 
    });
  }
});

/**
 * Verify OTP
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    const stored = otpStore.get(email);
    
    if (!stored) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }
    
    // Check expiration
    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'Verification code expired' });
    }
    
    // Check attempts
    stored.attempts++;
    if (stored.attempts > 3) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'Too many attempts. Please request a new code.' });
    }
    
    // Verify OTP
    if (stored.code !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Success - delete OTP
    otpStore.delete(email);
    
    res.json({ 
      success: true,
      message: 'Email verified successfully!'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * Resend OTP
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, userName } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if we need to rate limit
    const existing = otpStore.get(email);
    if (existing && (Date.now() - (existing.expires - 5 * 60 * 1000)) < 30000) {
      return res.status(429).json({ 
        error: 'Please wait 30 seconds before requesting a new code' 
      });
    }
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store new OTP
    otpStore.set(email, {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });
    
    // Send email
    await emailService.sendOTPEmail(email, otp, userName);
    
    res.json({ 
      success: true, 
      message: 'New verification code sent!'
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

module.exports = router;