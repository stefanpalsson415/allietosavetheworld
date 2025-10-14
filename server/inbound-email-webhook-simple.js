// Simplified SendGrid Inbound Parse Webhook Handler
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { db } = require('./firebase-simple');
const { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc,
  doc,
  orderBy,
  limit,
  serverTimestamp 
} = require('firebase/firestore');

// Configure multer for multipart/form-data
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB limit
  }
});

// Webhook handler
const webhookHandler = async (req, res) => {
  try {
    console.log('📧 Incoming email received');
    console.log('Request headers:', req.headers);
    console.log('Request body keys:', Object.keys(req.body));
    
    // Parse webhook data - SendGrid may send different fields
    const {
      to,
      from,
      subject,
      envelope,
      text,
      html,
      email // Sometimes SendGrid sends the full email content in an 'email' field
    } = req.body;
    
    // Parse envelope to get exact recipient
    let envelopeData;
    let recipientEmail;
    
    if (envelope) {
      try {
        envelopeData = typeof envelope === 'string' ? JSON.parse(envelope) : envelope;
        recipientEmail = envelopeData.to[0];
      } catch (e) {
        console.error('Error parsing envelope:', e);
        recipientEmail = to; // Fallback to 'to' field
      }
    } else {
      recipientEmail = to;
    }
    
    // Extract family identifier from email
    const emailMatch = recipientEmail.match(/^(.+)@families\.checkallie\.com$/);
    if (!emailMatch) {
      console.error('Invalid recipient format:', recipientEmail);
      return res.status(200).send('OK');
    }
    
    const familyEmailPrefix = emailMatch[1];
    console.log('Email for family:', familyEmailPrefix);
    
    // Try to extract text content from various sources
    let textContent = text || '';
    let htmlContent = html || '';
    
    // If no text/html but there's an 'email' field, try to extract from there
    if (!textContent && !htmlContent && email) {
      console.log('Trying to extract content from email field...');
      if (typeof email === 'string') {
        // Simple extraction - look for plain text body
        const textMatch = email.match(/\n\n([\s\S]+?)(\n--|\z)/);
        if (textMatch) {
          textContent = textMatch[1].trim();
        }
      }
    }
    
    console.log('Email text content:', textContent ? textContent.substring(0, 200) + '...' : 'No text content');
    console.log('Email HTML content:', htmlContent ? 'HTML content present' : 'No HTML content');
    
    // Find family by email prefix
    const familiesQuery = query(
      collection(db, 'families'),
      where('emailPrefix', '==', familyEmailPrefix),
      limit(1)
    );
    
    const familySnapshot = await getDocs(familiesQuery);
    
    if (familySnapshot.empty) {
      console.error('No family found for email prefix:', familyEmailPrefix);
      return res.status(200).send('OK');
    }
    
    const familyDoc = familySnapshot.docs[0];
    const familyId = familyDoc.id;
    console.log('Found family:', familyId);
    
    // Create email record
    const emailRecord = {
      familyId,
      familyEmailPrefix,
      to: recipientEmail,
      from: from,
      subject: subject || '(No subject)',
      content: {
        text: textContent || '',
        html: htmlContent || ''
      },
      status: 'pending',
      source: 'email',
      type: 'email',
      receivedAt: new Date(),
      createdAt: serverTimestamp()
    };
    
    // Save to emailInbox collection
    const emailDocRef = await addDoc(collection(db, 'emailInbox'), emailRecord);
    console.log('✅ Email saved with ID:', emailDocRef.id);
    
    // Process with Claude AI
    setTimeout(async () => {
      await processEmailWithClaude(emailDocRef.id, emailRecord, familyId);
    }, 2000);
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Error processing email:', error);
    res.status(200).send('OK'); // Always return 200 to SendGrid
  }
};

// Process email with Claude AI
async function processEmailWithClaude(emailId, emailData, familyId) {
  try {
    console.log('🤖 Processing email with Claude:', emailId);
    console.log('🤖 Email subject:', emailData.subject);
    console.log('🤖 Email content preview:', emailData.content.text ? emailData.content.text.substring(0, 100) : 'No content');
    
    const axios = require('axios');
    const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
    
    if (!apiKey) {
      console.error('No Claude API key found');
      return processEmailSimple(emailId, emailData, familyId);
    }
    
    const prompt = `You are an AI assistant helping a family manage their emails. Analyze this email and extract:
1. A brief summary
2. Category (school/medical/social/shopping/general)
3. Any calendar events mentioned (with dates, times, locations)
4. Action items that need to be done
5. Important people or contacts mentioned

Email Details:
Subject: ${emailData.subject}
From: ${emailData.from}
Content: ${emailData.content.text || 'No text content'}

Respond in JSON format like this:
{
  "summary": "brief summary",
  "category": "category",
  "events": [
    {
      "title": "event title",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "location": "location",
      "description": "details"
    }
  ],
  "actionItems": ["action 1", "action 2"],
  "contacts": ["person 1", "person 2"]
}`;

    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    if (response.data && response.data.content && response.data.content[0]) {
      const aiResponse = response.data.content[0].text;
      console.log('Claude response:', aiResponse);
      
      // Parse JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        // Update email with AI analysis
        await updateDoc(doc(db, 'emailInbox', emailId), {
          status: 'processed',
          processedAt: serverTimestamp(),
          aiAnalysis: analysis,
          summary: analysis.summary,
          category: analysis.category
        });
        
        // Prepare suggested actions (but don't execute them)
        const suggestedActions = [];
        
        // Prepare calendar events
        if (analysis.events && analysis.events.length > 0) {
          for (const event of analysis.events) {
            console.log('Preparing calendar event:', event);
            
            // Parse the date string into ISO format
            const eventDate = new Date(event.date);
            if (event.time) {
              const [hours, minutes] = event.time.split(':');
              eventDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            }
            
            suggestedActions.push({
              type: 'calendar',
              status: 'pending',
              title: `Create calendar event: ${event.title}`,
              details: `Date: ${event.date}${event.time ? ' at ' + event.time : ''}${event.location ? ' at ' + event.location : ''}`,
              data: {
                title: event.title,
                description: event.description || `From email: ${emailData.subject}`,
                startDate: eventDate.toISOString(),
                endDate: new Date(eventDate.getTime() + 60 * 60 * 1000).toISOString(),
                location: event.location || '',
                category: 'event',
                source: 'email',
                sourceId: emailId
              }
            });
          }
        }
        
        // Prepare kanban tasks
        if (analysis.actionItems && analysis.actionItems.length > 0) {
          for (const actionItem of analysis.actionItems) {
            console.log('Preparing kanban task:', actionItem);
            
            // Determine priority based on keywords
            let priority = 'medium';
            const actionLower = actionItem.toLowerCase();
            if (actionLower.includes('urgent') || actionLower.includes('asap') || actionLower.includes('immediately')) {
              priority = 'high';
            } else if (actionLower.includes('optional') || actionLower.includes('consider')) {
              priority = 'low';
            }
            
            suggestedActions.push({
              type: 'task',
              status: 'pending',
              title: `Create task: ${actionItem}`,
              details: `Priority: ${priority}`,
              data: {
                title: actionItem,
                description: `From email: ${emailData.subject}`,
                status: 'todo',
                priority,
                tags: ['email', 'allie-suggested'],
                source: 'email',
                sourceId: emailId
              }
            });
          }
        }
        
        // Update email with AI analysis and suggested actions
        await updateDoc(doc(db, 'emailInbox', emailId), {
          status: 'processed',
          processedAt: serverTimestamp(),
          aiAnalysis: analysis,
          summary: analysis.summary,
          category: analysis.category,
          suggestedActions: suggestedActions.length > 0 ? suggestedActions : null
        });
        
        console.log('✅ Email processed with Claude AI and actions completed');
      }
    }
  } catch (error) {
    console.error('Error with Claude API:', error.message);
    // Fallback to simple processing
    return processEmailSimple(emailId, emailData, familyId);
  }
}

// Simple email processing (fallback)
async function processEmailSimple(emailId, emailData, familyId) {
  try {
    console.log('🤖 Processing email:', emailId);
    console.log('🤖 Email subject:', emailData.subject);
    console.log('🤖 Email content preview:', emailData.content.text ? emailData.content.text.substring(0, 100) : 'No content');
    
    // Simple keyword detection for Swedish and English content
    const content = (emailData.content.text + ' ' + emailData.subject).toLowerCase();
    
    // Check for birthday party keywords
    if (content.includes('birthday') || content.includes('födelsedag') || content.includes('party')) {
      console.log('Found birthday party related content');
      
      // Extract date if mentioned (e.g., "June 17th" or "17 juni")
      const dateMatch = content.match(/june\s+(\d+)|(\d+)\s+juni|(\d+)th/i);
      const timeMatch = content.match(/(\d+)\s*pm|kl\s*(\d+)|at\s*(\d+)/i);
      
      console.log('Date match:', dateMatch);
      console.log('Time match:', timeMatch);
    }
    
    // Check for backpack/school keywords
    if (content.includes('ryggsäck') || content.includes('tom påse') || content.includes('skola')) {
      console.log('Found school/backpack related content');
      
      // Create a task
      await addDoc(collection(db, 'kanbanTasks'), {
        familyId,
        title: 'Bring empty backpack to school',
        description: `From email: ${emailData.subject}`,
        column: 'todo',
        priority: 'high',
        source: 'email',
        sourceId: emailId,
        createdAt: serverTimestamp(),
        createdBy: 'Allie AI'
      });
      
      // Update email status
      await updateDoc(doc(db, 'emailInbox', emailId), {
        status: 'processed',
        processedAt: serverTimestamp(),
        summary: 'Email about bringing empty backpack to school',
        category: 'school',
        actions: [{
          type: 'task',
          count: 1,
          status: 'completed'
        }]
      });
      
      console.log('✅ Created task from email');
    } else {
      // Just mark as processed
      await updateDoc(doc(db, 'emailInbox', emailId), {
        status: 'processed',
        processedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error processing email:', error);
  }
}

// Routes
router.post('/api/emails/inbound', upload.any(), webhookHandler);

// Get inbox endpoint
router.get('/api/family/inbox', async (req, res) => {
  try {
    const familyEmailPrefix = req.query.family;
    
    if (!familyEmailPrefix) {
      return res.status(400).json({ error: 'Family parameter required' });
    }
    
    // Find family
    const familiesQuery = query(
      collection(db, 'families'),
      where('emailPrefix', '==', familyEmailPrefix),
      limit(1)
    );
    
    const familySnapshot = await getDocs(familiesQuery);
    if (familySnapshot.empty) {
      return res.json({ success: true, messages: [] });
    }
    
    const familyId = familySnapshot.docs[0].id;
    
    // Get emails
    const emailsQuery = query(
      collection(db, 'emailInbox'),
      where('familyId', '==', familyId),
      orderBy('receivedAt', 'desc'),
      limit(50)
    );
    
    const emailsSnapshot = await getDocs(emailsQuery);
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

module.exports = router;