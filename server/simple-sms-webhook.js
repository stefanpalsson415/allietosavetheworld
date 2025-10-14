// Simple SMS webhook that just saves messages
const express = require('express');
const router = express.Router();
const twilio = require('twilio');

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "parentload-ba995"
  });
}

const db = admin.firestore();

// Known family phones - hardcoded for now
const FAMILY_MAPPINGS = {
  '+46731536304': 'm93tlovs6ty9sg8k0c8',  // Stefan
  '+460731536304': 'm93tlovs6ty9sg8k0c8', // Stefan with 0
  '46731536304': 'm93tlovs6ty9sg8k0c8',   // Stefan no +
  '0731536304': 'm93tlovs6ty9sg8k0c8',    // Stefan local
  // Add more family members here
};

// Default family for unknown numbers
const DEFAULT_FAMILY = {
  id: 'm93tlovs6ty9sg8k0c8',
  name: 'Palsson Family',
  emailPrefix: 'palsson'
};

router.post('/api/sms/inbound', async (req, res) => {
  try {
    console.log('📱 SMS webhook called');
    
    const { From, To, Body, MessageSid, NumMedia } = req.body;
    
    console.log('From:', From);
    console.log('Body:', Body);
    
    // Determine family
    let familyId = FAMILY_MAPPINGS[From] || DEFAULT_FAMILY.id;
    
    // Create SMS record
    const smsData = {
      familyId: familyId,
      familyEmailPrefix: 'palsson',
      from: From,
      phoneNumber: From,
      to: To,
      content: Body || '',
      body: Body || '',
      hasMedia: parseInt(NumMedia) > 0,
      mediaCount: parseInt(NumMedia) || 0,
      messageId: MessageSid,
      status: 'pending',
      source: 'sms',
      type: 'sms',
      receivedAt: new Date(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Save to Firestore
    const docRef = await db.collection('smsInbox').add(smsData);
    console.log('✅ SMS saved with ID:', docRef.id);
    
    // Send Twilio response
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Got it! I'm processing your message...");
    
    res.type('text/xml').send(twiml.toString());
    
  } catch (error) {
    console.error('❌ Error in SMS webhook:', error);
    
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Sorry, I had trouble processing that. Please try again.");
    
    res.type('text/xml').send(twiml.toString());
  }
});

// Test endpoint
router.get('/api/sms/test', (req, res) => {
  res.json({
    success: true,
    message: 'Simple SMS webhook is ready',
    families: Object.keys(FAMILY_MAPPINGS).length
  });
});

module.exports = router;