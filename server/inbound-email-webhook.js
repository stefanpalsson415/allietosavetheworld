// SendGrid Inbound Parse Webhook Handler
const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for multipart/form-data
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB limit as recommended by SendGrid
  }
});

// Initialize Firebase Admin
const admin = require('./firebase-admin');
const db = admin.firestore();
const { notifyFamilyOfProcessedEmail } = require('./email-notification-service');

/**
 * SendGrid Inbound Parse Webhook
 * Receives all emails sent to *@families.checkallie.com
 * 
 * In production, use the secure endpoint with token
 */

// Webhook handler function
const webhookHandler = async (req, res) => {
  try {
    console.log('📧 Incoming email received');
    
    // SendGrid sends data as multipart/form-data
    const {
      headers,
      dkim,
      to,
      from,
      sender_ip,
      spam_report,
      envelope,
      attachments,
      subject,
      spam_score,
      html,
      text,
      'attachment-info': attachmentInfo
    } = req.body;
    
    // Parse envelope to get exact recipient
    let recipientEmail;
    try {
      if (envelope) {
        const envelopeData = JSON.parse(envelope);
        recipientEmail = envelopeData.to[0]; // e.g., "smithfamily@families.checkallie.com"
      } else {
        // Fallback to 'to' field
        recipientEmail = to;
      }
    } catch (e) {
      console.log('Failed to parse envelope, using to field:', to);
      recipientEmail = to;
    }
    
    // Extract family identifier from email
    const emailMatch = recipientEmail.match(/^(.+)@families\.checkallie\.com$/);
    if (!emailMatch) {
      console.error('Invalid recipient format:', recipientEmail);
      return res.status(200).send('OK'); // Always return 200 to SendGrid
    }
    
    const familyEmailPrefix = emailMatch[1]; // e.g., "smithfamily"
    
    // Create email record
    const emailRecord = {
      id: generateId(),
      type: 'email',
      familyEmailPrefix,
      to: recipientEmail,
      from: from,
      subject: subject || '(No subject)',
      receivedAt: new Date(),
      status: 'pending',
      content: {
        text: text || '',
        html: html || '',
        headers: headers
      },
      metadata: {
        senderIp: sender_ip,
        spamScore: parseFloat(spam_score) || 0,
        spamReport: spam_report,
        dkim: dkim
      },
      attachments: []
    };
    
    // Process attachments if any
    if (req.files && req.files.length > 0) {
      const attachmentData = JSON.parse(attachmentInfo || '{}');
      
      req.files.forEach((file, index) => {
        const attachmentKey = `attachment${index + 1}`;
        const info = attachmentData[attachmentKey] || {};
        
        emailRecord.attachments.push({
          filename: info.filename || file.originalname,
          contentType: info.type || file.mimetype,
          size: file.size,
          contentId: info['content-id'],
          data: file.buffer // In production, upload to cloud storage
        });
      });
    }
    
    // Find family by email prefix
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
    
    // Save email to Firestore emailInbox collection
    const emailDocRef = await db.collection('emailInbox').add({
      ...emailRecord,
      familyId,
      familyEmailPrefix,
      status: 'pending',
      reviewed: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      receivedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Save attachments to family drive if any
    if (emailRecord.attachments.length > 0) {
      for (const attachment of emailRecord.attachments) {
        // Upload to Cloud Storage (in production)
        // For now, we'll save reference in Firestore
        await db.collection('familyDocuments').add({
          familyId,
          fileName: attachment.filename,
          fileType: attachment.contentType,
          fileSize: attachment.size,
          source: 'email',
          emailId: emailDocRef.id,
          uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
          uploadedBy: `Email from ${from}`,
          status: 'pending',
          title: attachment.filename,
          category: 'inbox',
          // In production, upload to storage and get URL
          fileUrl: `attachments/${emailDocRef.id}/${attachment.filename}`
        });
      }
    }
    
    // Queue for processing with Allie
    await queueForProcessing(emailDocRef.id, familyId);
    
    // Always return 200 OK to SendGrid
    res.status(200).send('OK');
    
    console.log('✅ Email received and queued for processing:', {
      id: emailRecord.id,
      family: familyEmailPrefix,
      from: from,
      subject: subject,
      attachments: emailRecord.attachments.length
    });
    
  } catch (error) {
    console.error('❌ Error processing inbound email:', error);
    // Still return 200 to prevent SendGrid from retrying
    res.status(200).send('OK');
  }
};

// Register both routes - with and without token
// Development route (backward compatible)
router.post('/api/emails/inbound', upload.any(), webhookHandler);

// Production route with token
if (process.env.INBOUND_EMAIL_TOKEN) {
  router.post(`/api/emails/inbound/${process.env.INBOUND_EMAIL_TOKEN}`, upload.any(), webhookHandler);
  console.log('🔒 Secure webhook endpoint enabled');
}

/**
 * Queue email for processing with Allie AI
 */
async function queueForProcessing(emailId, familyId) {
  try {
    // Process immediately for now
    // In production, this would be a background job
    setTimeout(async () => {
      await processEmailWithAllie(emailId, familyId);
    }, 1000);
    
  } catch (error) {
    console.error('Error queuing email:', error);
  }
}

/**
 * Process email with Allie AI
 */
async function processEmailWithAllie(emailId, familyId) {
  try {
    console.log('🤖 Processing email with Allie:', emailId);
    
    // Get email from Firestore
    const emailDoc = await db.collection('emailInbox').doc(emailId).get();
    if (!emailDoc.exists) {
      console.error('Email not found:', emailId);
      return;
    }
    
    const emailData = emailDoc.data();
    
    // Prepare content for Allie
    const emailContent = `
From: ${emailData.from}
Subject: ${emailData.subject}
Date: ${new Date(emailData.receivedAt).toISOString()}

Email Content:
${emailData.content.text || emailData.content.html || ''}

${emailData.attachments?.length > 0 ? `\nAttachments: ${emailData.attachments.map(a => a.filename).join(', ')}` : ''}
`;

    // Create prompt for Allie
    const prompt = `Analyze this email sent to a family's inbox and extract actionable information.

${emailContent}

Please analyze and return a JSON response with:
1. summary: Brief summary of the email
2. category: medical/school/sports/financial/social/general
3. extractedData: {
   - dates: Array of {date, description, isAppointment}
   - people: Array of {name, role, phone?, email?}
   - locations: Array of location names
   - phoneNumbers: Array of phone numbers
   - tags: Array of relevant tags
}
4. suggestedActions: Array of {
   - type: calendar/contact/task/document
   - title: Action title
   - details: Specific details for the action
   - data: Relevant data for creating the item
}
5. urgency: low/medium/high
6. requiresResponse: boolean

Be specific and actionable. For calendar events, include specific dates and times if mentioned.`;

    // Call Claude API
    const axios = require('axios');
    const claudeResponse = await axios.post(
      'http://localhost:3001/api/claude',
      {
        messages: [{ role: 'user', content: prompt }],
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.3,
        max_tokens: 2000
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // Parse Claude's response
    const responseText = claudeResponse.data.response;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    
    // Track actions taken
    const allieActions = [];
    
    // Process suggested actions
    if (analysis.suggestedActions) {
      for (const action of analysis.suggestedActions) {
        try {
          if (action.type === 'calendar') {
            // Create calendar event
            const eventData = {
              familyId,
              title: action.title,
              description: action.details,
              source: 'email',
              sourceId: emailId,
              category: analysis.category || 'general',
              ...action.data
            };
            
            const eventRef = await db.collection('events').add({
              ...eventData,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              createdBy: 'Allie AI'
            });
            
            allieActions.push({
              id: eventRef.id,
              type: 'calendar',
              title: action.title,
              details: action.details,
              link: `/calendar?event=${eventRef.id}`,
              status: 'completed'
            });
          } else if (action.type === 'contact') {
            // Create contact
            const contactData = {
              familyId,
              name: action.data.name,
              role: action.data.role,
              phone: action.data.phone,
              email: action.data.email,
              source: 'email',
              sourceId: emailId
            };
            
            const contactRef = await db.collection('familyContacts').add({
              ...contactData,
              familyId, // Make sure familyId is included
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              createdBy: 'Allie AI'
            });
            
            allieActions.push({
              id: contactRef.id,
              type: 'contact',
              title: action.data.name,
              details: `${action.data.role}${action.data.phone ? ' • ' + action.data.phone : ''}`,
              link: `/contacts/${contactRef.id}`,
              status: 'completed'
            });
          }
        } catch (err) {
          console.error('Error executing action:', action, err);
          allieActions.push({
            type: action.type,
            title: action.title,
            details: 'Failed to create',
            status: 'error'
          });
        }
      }
    }
    
    // Update email with AI analysis and actions
    await db.collection('emailInbox').doc(emailId).update({
      status: 'processed',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      aiAnalysis: analysis,
      allieActions,
      extractedData: analysis.extractedData || {},
      summary: analysis.summary,
      category: analysis.category,
      urgency: analysis.urgency,
      requiresResponse: analysis.requiresResponse || false,
      actions: allieActions.map(a => ({
        type: a.type,
        count: 1,
        status: a.status
      }))
    });
    
    console.log('✅ Email processed successfully with', allieActions.length, 'actions');
    
    // Send notification to family (if enabled)
    try {
      const familyDoc = await db.collection('families').doc(familyId).get();
      if (familyDoc.exists) {
        await notifyFamilyOfProcessedEmail(familyDoc.data(), emailData, allieActions);
      }
    } catch (notifError) {
      console.error('Error sending notification:', notifError);
    }
    
  } catch (error) {
    console.error('Error processing with Allie:', error);
    
    // Update email with error status
    await db.collection('emailInbox').doc(emailId).update({
      status: 'error',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processingError: error.message
    });
  }
}

/**
 * Get inbox for a family
 */
router.get('/api/family/inbox', async (req, res) => {
  try {
    const familyEmailPrefix = req.query.family;
    
    if (!familyEmailPrefix) {
      return res.status(400).json({ error: 'Family parameter required' });
    }
    
    // Find family by email prefix
    const familiesSnapshot = await db.collection('families')
      .where('emailPrefix', '==', familyEmailPrefix)
      .limit(1)
      .get();
    
    if (familiesSnapshot.empty) {
      return res.json({ success: true, messages: [] });
    }
    
    const familyId = familiesSnapshot.docs[0].id;
    
    // Get emails for this family
    const emailsSnapshot = await db.collection('emailInbox')
      .where('familyId', '==', familyId)
      .orderBy('receivedAt', 'desc')
      .limit(50)
      .get();
    
    const messages = emailsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching inbox:', error);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

/**
 * Get specific email details
 */
router.get('/api/family/inbox/:emailId', async (req, res) => {
  try {
    const emailDoc = await db.collection('emailInbox').doc(req.params.emailId).get();
    
    if (!emailDoc.exists) {
      return res.status(404).json({ error: 'Email not found' });
    }
    
    res.json({
      success: true,
      email: {
        id: emailDoc.id,
        ...emailDoc.data()
      }
    });
  } catch (error) {
    console.error('Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

/**
 * Get SMS inbox for a family
 */
router.get('/api/family/sms-inbox', async (req, res) => {
  try {
    const familyId = req.query.familyId;
    
    if (!familyId) {
      return res.json({ success: true, messages: [] });
    }
    
    // Get SMS messages for this family
    const smsSnapshot = await db.collection('smsInbox')
      .where('familyId', '==', familyId)
      .orderBy('receivedAt', 'desc')
      .limit(50)
      .get();
    
    const messages = smsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching SMS inbox:', error);
    res.status(500).json({ error: 'Failed to fetch SMS inbox' });
  }
});

/**
 * Get document uploads for a family
 */
router.get('/api/family/document-uploads', async (req, res) => {
  try {
    const familyId = req.query.familyId;
    
    if (!familyId) {
      return res.json({ success: true, documents: [] });
    }
    
    // Get recent documents
    const docsSnapshot = await db.collection('familyDocuments')
      .where('familyId', '==', familyId)
      .where('source', '==', 'email')
      .orderBy('uploadedAt', 'desc')
      .limit(50)
      .get();
    
    const documents = docsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Helper function to generate unique IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

module.exports = router;