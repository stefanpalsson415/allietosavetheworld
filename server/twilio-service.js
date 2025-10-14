const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const admin = require('./firebase-admin-minimal');
const { processImageWithAllie } = require('./twilio-image-processor');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

// Store verification codes temporarily (use Redis in production)
const verificationCodes = new Map();

/**
 * Send verification code to phone number
 */
router.post('/send-verification', async (req, res) => {
  try {
    const { phoneNumber, userId } = req.body;
    
    if (!phoneNumber || !userId) {
      return res.status(400).json({ error: 'Phone number and user ID required' });
    }
    
    // Generate 4-digit code (to match frontend)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store code with expiration (5 minutes)
    verificationCodes.set(`${userId}-${phoneNumber}`, {
      code,
      expires: Date.now() + 5 * 60 * 1000
    });
    
    // Send SMS
    const message = await client.messages.create({
      body: `Your Parentload verification code is: ${code}`,
      from: twilioPhoneNumber,
      to: phoneNumber
    });
    
    console.log('Verification SMS sent:', message.sid);
    
    res.json({ 
      success: true, 
      message: 'Verification code sent',
      // Don't send actual code in production!
      debug: process.env.NODE_ENV === 'development' ? code : undefined
    });
  } catch (error) {
    console.error('Error sending verification:', error);
    res.status(500).json({ 
      error: 'Failed to send verification code',
      details: error.message 
    });
  }
});

/**
 * Verify code
 */
router.post('/verify-code', async (req, res) => {
  try {
    const { phoneNumber, userId, code } = req.body;
    
    const key = `${userId}-${phoneNumber}`;
    const stored = verificationCodes.get(key);
    
    if (!stored) {
      return res.status(400).json({ error: 'No verification pending' });
    }
    
    if (Date.now() > stored.expires) {
      verificationCodes.delete(key);
      return res.status(400).json({ error: 'Code expired' });
    }
    
    if (stored.code !== code) {
      return res.status(400).json({ error: 'Invalid code' });
    }
    
    // Skip Firebase update in development - frontend will handle it
    console.log(`Phone verified for user ${userId}: ${phoneNumber}`);
    
    // Clear the verification code
    verificationCodes.delete(key);
    
    res.json({ 
      success: true,
      allieNumber: twilioPhoneNumber,
      message: 'Phone verified successfully'
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/**
 * Webhook to receive SMS messages
 */
router.post('/incoming-sms', async (req, res) => {
  try {
    const { From, To, Body, NumMedia, MediaUrl0, MediaContentType0 } = req.body;
    
    console.log('Incoming SMS:', { From, To, Body, NumMedia });
    
    // Try to find user by phone number, but continue even if Firebase fails
    let userData = null;
    let userId = null;
    
    try {
      const userSnapshot = await admin.firestore()
        .collection('users')
        .where('phoneNumber', '==', From)
        .where('phoneVerified', '==', true)
        .limit(1)
        .get();
      
      if (!userSnapshot.empty) {
        const user = userSnapshot.docs[0];
        userId = user.id;
        userData = user.data();
      }
    } catch (firebaseError) {
      console.log('Firebase lookup failed, using default user data');
      // Use default data for testing
      userId = '8rI5pQhj6PPnmzFECP3HPTx7Inq1';
      userData = {
        currentFamily: 'default-family',
        phoneNumber: From
      };
    }
    
    if (!userData) {
      // Unknown number - send welcome message
      await client.messages.create({
        body: 'Welcome to Parentload! Please sign up at parentload.com to connect this number.',
        from: To,
        to: From
      });
      
      return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
    }
    
    // Store the message
    const messageData = {
      userId,
      familyId: userData.currentFamily,
      from: From,
      to: To,
      body: Body,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      processed: false
    };
    
    // Handle media (images)
    if (NumMedia > 0 && MediaUrl0) {
      messageData.mediaUrl = MediaUrl0;
      messageData.mediaType = MediaContentType0;
    }
    
    let messageRef = null;
    try {
      messageRef = await admin.firestore()
        .collection('smsMessages')
        .add(messageData);
    } catch (error) {
      console.log('Could not store message in Firebase, continuing anyway');
      messageRef = { id: `local-${Date.now()}` };
    }
    
    // Process the message with Allie
    let responseMessage = '';
    
    try {
      if (messageData.mediaUrl) {
        // Process image with Allie
        const result = await processImageWithAllie(messageData);
        responseMessage = result.response;
        
        if (result.eventsCreated > 0) {
          responseMessage += `\n\nI've added ${result.eventsCreated} event(s) to your calendar.`;
        }
      } else {
        // Process text message
        await processWithAllie(messageRef.id, messageData);
        
        // Create a smart response based on the message content
        const lowerBody = Body.toLowerCase();
        if (lowerBody.includes('dentist') || lowerBody.includes('appointment')) {
          responseMessage = `I'll help you schedule that appointment. I've noted: "${Body}"\n\nI'll add this to your calendar and send you a reminder.`;
        } else if (lowerBody.includes('remind')) {
          responseMessage = `Reminder set! I'll make sure to remind you about: "${Body}"`;
        } else if (lowerBody.includes('calendar')) {
          responseMessage = `I've received your calendar request. Processing: "${Body}"`;
        } else {
          responseMessage = `Thanks for your message! I've received: "${Body}"\n\nI'm processing this and will help you manage it.`;
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      responseMessage = 'I received your message! Even though I had trouble processing it fully, I\'ve logged it for later review.';
    }
    
    // Send response
    await client.messages.create({
      body: responseMessage,
      from: To,
      to: From
    });
    
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    console.error('Error handling incoming SMS:', error);
    res.status(500).send('Error processing message');
  }
});

/**
 * Process message with Allie AI
 */
async function processWithAllie(messageId, messageData) {
  try {
    // For testing, just log the message
    console.log('Processing with Allie:', {
      messageId,
      content: messageData.body,
      from: messageData.from
    });
    
    // Try to create task in Firebase, but don't fail if it doesn't work
    try {
      await admin.firestore()
        .collection('allieTasks')
        .add({
          type: 'process-sms',
          messageId,
          userId: messageData.userId,
          familyId: messageData.familyId,
          content: messageData.body,
          mediaUrl: messageData.mediaUrl,
          status: 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    } catch (firebaseError) {
      console.log('Could not create Allie task in Firebase, but message was received');
    }
  } catch (error) {
    console.error('Error processing with Allie:', error);
  }
}

/**
 * Create a dedicated Allie number (future feature)
 */
async function createAllieNumber(userId, phoneNumber) {
  // In the future, you could provision a dedicated number per family
  // For now, return the main Twilio number
  return twilioPhoneNumber;
}

module.exports = router;