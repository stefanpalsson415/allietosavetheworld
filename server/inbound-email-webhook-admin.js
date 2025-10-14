// SendGrid Inbound Parse Webhook Handler using Firebase Admin SDK
const express = require('express');
const router = express.Router();
const multer = require('multer');
const admin = require('./firebase-admin');
const db = admin.firestore();

// Configure multer
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024
  }
});

// Webhook handler
const webhookHandler = async (req, res) => {
  try {
    console.log('📧 =================================');
    console.log('📧 INBOUND EMAIL WEBHOOK TRIGGERED');
    console.log('📧 =================================');
    console.log('📧 To:', req.body.to);
    console.log('📧 From:', req.body.from);
    console.log('📧 Subject:', req.body.subject);
    
    const {
      to,
      from,
      subject,
      envelope,
      text,
      html
    } = req.body;
    
    // Parse envelope
    let recipientEmail;
    try {
      if (envelope) {
        const envelopeData = typeof envelope === 'string' ? JSON.parse(envelope) : envelope;
        recipientEmail = envelopeData.to[0];
      } else {
        recipientEmail = to;
      }
    } catch (e) {
      console.error('Failed to parse envelope:', e);
      recipientEmail = to;
    }
    
    console.log('Recipient email:', recipientEmail);
    
    if (!recipientEmail) {
      console.error('No recipient email found');
      return res.status(200).send('OK');
    }
    
    // Extract family prefix
    const emailMatch = recipientEmail.match(/^(.+)@families\.checkallie\.com$/);
    if (!emailMatch) {
      console.error('Invalid recipient format:', recipientEmail);
      return res.status(200).send('OK');
    }
    
    const familyEmailPrefix = emailMatch[1];
    console.log('Email for family:', familyEmailPrefix);
    
    // Query families to find the right one
    try {
      const familiesSnapshot = await db.collection('families')
        .where('emailPrefix', '==', familyEmailPrefix)
        .limit(1)
        .get();
      
      if (familiesSnapshot.empty) {
        console.error('No family found for email prefix:', familyEmailPrefix);
        return res.status(200).send('OK');
      }
      
      const familyDoc = familiesSnapshot.docs[0];
      const familyId = familyDoc.id;
      const familyData = familyDoc.data();
      
      console.log('Found family:', familyId, familyData.name);
      
      // Create email record
      const emailData = {
        familyId,
        familyEmailPrefix,
        to: recipientEmail,
        from: from || 'unknown',
        subject: subject || '(No subject)',
        receivedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'pending',
        content: {
          text: text || '',
          html: html || ''
        }
      };
      
      // Save to emailInbox collection
      const emailRef = await db.collection('emailInbox').add(emailData);
      console.log('📧 Email saved with ID:', emailRef.id);
      
      // Process attachments if any (simplified for now)
      if (req.files && req.files.length > 0) {
        console.log('📧 Found', req.files.length, 'attachments');
        // TODO: Process attachments
      }
      
      console.log('📧 Email processed successfully');
      res.status(200).send('OK');
      
    } catch (error) {
      console.error('Database error:', error);
      res.status(200).send('OK'); // Always return 200 to SendGrid
    }
    
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).send('OK'); // Always return 200 to SendGrid
  }
};

// Webhook route
router.post('/api/emails/inbound', upload.any(), webhookHandler);

module.exports = router;