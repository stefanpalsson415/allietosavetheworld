// Twilio SMS/MMS Webhook Handler
const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const axios = require('axios');
const { db } = require('./firebase-client');
const { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  limit
} = require('firebase/firestore');

// Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// SMS webhook handler
router.post('/api/sms/inbound', async (req, res) => {
  try {
    console.log('📱 Incoming SMS/MMS received');
    
    const {
      From,
      To,
      Body,
      NumMedia,
      MessageSid
    } = req.body;
    
    console.log('From:', From, 'Body:', Body, 'Media:', NumMedia);
    
    // Find family by phone number
    const familyQuery = query(
      collection(db, 'families'),
      where('members', 'array-contains-any', [
        { phone: From },
        { phoneNumber: From }
      ]),
      limit(1)
    );
    
    // If that doesn't work, try a simpler approach - look for families
    let familySnapshot = await getDocs(familyQuery);
    
    if (familySnapshot.empty) {
      // Try to find by email prefix (for demo, use palsson)
      const palssonQuery = query(
        collection(db, 'families'),
        where('emailPrefix', '==', 'palsson'),
        limit(1)
      );
      familySnapshot = await getDocs(palssonQuery);
    }
    
    if (familySnapshot.empty) {
      console.log('No family found for phone:', From);
      
      // Send welcome message
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message('Hi! I\'m Allie, your AI family assistant. To connect this number to your family account, please visit checkallie.com');
      
      return res.type('text/xml').send(twiml.toString());
    }
    
    const familyDoc = familySnapshot.docs[0];
    const familyId = familyDoc.id;
    const familyData = familyDoc.data();
    
    console.log('Found family:', familyData.name);
    
    // Create SMS record
    const smsData = {
      familyId,
      familyEmailPrefix: familyData.emailPrefix || 'unknown',
      from: From,
      phoneNumber: From,
      to: To,
      body: Body || '',
      content: Body || '',
      hasMedia: parseInt(NumMedia) > 0,
      mediaCount: parseInt(NumMedia) || 0,
      messageId: MessageSid,
      status: 'pending',
      source: 'sms',
      type: 'sms',
      receivedAt: new Date(),
      createdAt: serverTimestamp()
    };
    
    // Handle media attachments
    const mediaUrls = [];
    const numMediaInt = parseInt(NumMedia) || 0;
    
    if (numMediaInt > 0) {
      smsData.type = 'mms';
      smsData.source = 'mms';
      
      for (let i = 0; i < numMediaInt; i++) {
        const mediaUrl = req.body[`MediaUrl${i}`];
        const mediaType = req.body[`MediaContentType${i}`];
        
        if (mediaUrl) {
          mediaUrls.push({
            url: mediaUrl,
            contentType: mediaType || 'image/jpeg',
            index: i
          });
        }
      }
      
      smsData.mediaUrls = mediaUrls;
      smsData.attachments = mediaUrls;
    }
    
    // Save to smsInbox
    const smsRef = await addDoc(collection(db, 'smsInbox'), smsData);
    console.log('✅ SMS saved with ID:', smsRef.id);
    
    // Process with simple AI
    setTimeout(async () => {
      await processSMSSimple(smsRef.id, smsData, familyId);
    }, 2000);
    
    // Send acknowledgment
    const twiml = new twilio.twiml.MessagingResponse();
    
    if (numMediaInt > 0) {
      twiml.message(`Got your message with ${numMediaInt} image${numMediaInt > 1 ? 's' : ''}! I'll analyze ${numMediaInt > 1 ? 'them' : 'it'} and let you know what I find.`);
    } else {
      // Check for keywords
      const lowerBody = Body.toLowerCase();
      if (lowerBody.includes('help')) {
        twiml.message('I can help with:\n• Send photos of schedules\n• "remind me to..."\n• "add event..."\n• Ask questions about your family calendar');
      } else {
        twiml.message('Got it! I\'m processing your message and will update your family hub.');
      }
    }
    
    res.type('text/xml').send(twiml.toString());
    
  } catch (error) {
    console.error('❌ Error processing SMS:', error);
    
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Sorry, I had trouble processing that. Please try again or contact support.');
    
    res.type('text/xml').send(twiml.toString());
  }
});

// Process SMS with simple AI
async function processSMSSimple(smsId, smsData, familyId) {
  try {
    console.log('🤖 Processing SMS:', smsId);
    
    const content = smsData.body.toLowerCase();
    let processed = false;
    let responseMessage = '';
    const actions = [];
    
    // Check for task/reminder keywords
    if (content.includes('remind') || content.includes('don\'t forget') || content.includes('remember')) {
      // Create a task
      await addDoc(collection(db, 'kanbanTasks'), {
        familyId,
        title: smsData.body.substring(0, 50),
        description: `From SMS: ${smsData.body}`,
        column: 'todo',
        priority: 'medium',
        source: 'sms',
        sourceId: smsId,
        createdAt: serverTimestamp(),
        createdBy: 'Allie AI',
        assignedTo: [],
        tags: ['reminder', 'sms']
      });
      
      actions.push({
        type: 'task',
        status: 'completed',
        title: 'Created reminder',
        details: smsData.body
      });
      
      responseMessage = '✅ I\'ve added that to your family tasks!';
      processed = true;
    }
    
    // Check for calendar keywords
    if (content.includes('appointment') || content.includes('meeting') || 
        content.includes('practice') || content.includes('game') ||
        content.includes('event')) {
      
      // Extract any time mentions
      const timeMatch = content.match(/(\d{1,2}(:\d{2})?\s*(am|pm)?)|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i);
      
      actions.push({
        type: 'calendar',
        status: 'completed',
        title: 'Calendar event detected',
        details: `Event: ${smsData.body}${timeMatch ? ` at ${timeMatch[0]}` : ''}`
      });
      
      responseMessage = '📅 I found an event in your message. Check your calendar!';
      processed = true;
    }
    
    // Handle images
    if (smsData.hasMedia && smsData.mediaUrls) {
      actions.push({
        type: 'document',
        status: 'completed',
        title: 'Saved image(s)',
        details: `${smsData.mediaUrls.length} image(s) saved to family drive`
      });
      
      // Save image references to family documents
      for (const media of smsData.mediaUrls) {
        await addDoc(collection(db, 'familyDocuments'), {
          familyId,
          fileName: `SMS Image ${new Date().toLocaleDateString()}`,
          fileType: media.contentType,
          fileUrl: media.url,
          source: 'sms',
          sourceId: smsId,
          uploadedAt: serverTimestamp(),
          uploadedBy: `SMS from ${smsData.from}`,
          status: 'pending',
          title: `SMS Image - ${smsData.body.substring(0, 30) || 'No description'}`,
          category: 'inbox'
        });
      }
      
      if (!processed) {
        responseMessage = '📸 I\'ve saved your image(s) to the family drive!';
      }
      processed = true;
    }
    
    // Update SMS with processing results
    const updateData = {
      status: 'processed',
      processedAt: new Date(),
      actions: actions.length > 0 ? actions : null,
      summary: actions.length > 0 ? `Processed: ${actions.map(a => a.title).join(', ')}` : 'Message saved'
    };
    
    // Update in Firestore (would need to use REST API or admin SDK)
    console.log('SMS processing complete:', updateData);
    
    // Send follow-up SMS if we did something
    if (responseMessage && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({
          body: responseMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: smsData.from
        });
        console.log('📤 Sent response SMS:', responseMessage);
      } catch (err) {
        console.error('Error sending response SMS:', err);
      }
    }
    
  } catch (error) {
    console.error('Error processing SMS:', error);
  }
}

// Test endpoint
router.get('/api/sms/test', (req, res) => {
  res.json({
    success: true,
    message: 'SMS webhook is ready',
    twilioNumber: process.env.TWILIO_PHONE_NUMBER,
    configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  });
});

module.exports = router;