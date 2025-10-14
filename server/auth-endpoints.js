// Additional auth endpoints for OTP flow
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Initialize Firestore
const db = admin.firestore();

/**
 * Check family status endpoint
 * Used by frontend to check if a family exists and is incomplete
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
      
      // Check parents array
      if (!found && data.parents) {
        const parentMatch = data.parents.find(parent => 
          parent.email && parent.email.toLowerCase() === emailLower
        );
        if (parentMatch) {
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
 * Enhanced send-otp endpoint
 * Validates email exists before sending OTP
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { email, userName } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email is required' 
      });
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
      
      if (data.parents) {
        const parentMatch = data.parents.find(parent => 
          parent.email && parent.email.toLowerCase() === emailLower
        );
        if (parentMatch) {
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
    
    // Email exists, generate and send OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in Firestore with expiration
    await db.collection('otpCodes').doc(email).set({
      otp: otp,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      attempts: 0
    });
    
    // In production, send email via SendGrid
    // For development, return OTP in response
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${email}: ${otp}`);
      return res.json({ 
        success: true, 
        message: 'OTP sent successfully',
        otp: otp // Only in dev mode
      });
    }
    
    // Production: Send email
    // await sendOTPEmail(email, otp, userName);
    
    return res.json({ 
      success: true, 
      message: 'Verification code sent to your email' 
    });
    
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send verification code' 
    });
  }
});

/**
 * Verify OTP endpoint
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and OTP are required' 
      });
    }
    
    // Get stored OTP
    const otpDoc = await db.collection('otpCodes').doc(email).get();
    
    if (!otpDoc.exists) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid or expired verification code' 
      });
    }
    
    const otpData = otpDoc.data();
    
    // Check if OTP is expired
    if (new Date() > otpData.expiresAt.toDate()) {
      await db.collection('otpCodes').doc(email).delete();
      return res.status(400).json({ 
        success: false, 
        error: 'Verification code has expired' 
      });
    }
    
    // Check if OTP matches
    if (otpData.otp !== otp) {
      // Increment attempts
      await db.collection('otpCodes').doc(email).update({
        attempts: admin.firestore.FieldValue.increment(1)
      });
      
      // Lock after 5 attempts
      if (otpData.attempts >= 4) {
        await db.collection('otpCodes').doc(email).delete();
        return res.status(400).json({ 
          success: false, 
          error: 'Too many failed attempts. Please request a new code.' 
        });
      }
      
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid verification code' 
      });
    }
    
    // OTP is valid, delete it
    await db.collection('otpCodes').doc(email).delete();
    
    return res.json({ 
      success: true, 
      message: 'Email verified successfully' 
    });
    
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to verify code' 
    });
  }
});

module.exports = router;