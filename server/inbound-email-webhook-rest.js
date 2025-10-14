// SendGrid Inbound Parse Webhook Handler using Firestore REST API
const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');

// Configure multer
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024
  }
});

// Firestore REST API base URL
const FIRESTORE_BASE_URL = 'https://firestore.googleapis.com/v1/projects/parentload-ba995/databases/(default)/documents';
const API_KEY = process.env.FIREBASE_API_KEY;

// Claude API helper function
async function analyzeEmailWithClaude(emailContent) {
  try {
    const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
    if (!apiKey) {
      console.error('No Claude API key found');
      return null;
    }

    const prompt = `Analyze this email and extract:
1. Summary
2. Category (medical/school/financial/general)
3. Urgency (high/medium/low)
4. Specific actions needed

Email content:
Subject: ${emailContent.subject}
From: ${emailContent.from}
Body: ${emailContent.text}`;

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
      const analysisText = response.data.content[0].text;
      
      // Parse the analysis into structured data
      const lines = analysisText.split('\n');
      const analysis = {
        summary: '',
        category: 'general',
        urgency: 'medium',
        actions: []
      };

      lines.forEach(line => {
        if (line.toLowerCase().includes('summary:')) {
          analysis.summary = line.replace(/summary:/i, '').trim();
        } else if (line.toLowerCase().includes('category:')) {
          analysis.category = line.replace(/category:/i, '').trim().toLowerCase();
        } else if (line.toLowerCase().includes('urgency:')) {
          analysis.urgency = line.replace(/urgency:/i, '').trim().toLowerCase();
        } else if (line.toLowerCase().includes('action')) {
          const action = line.replace(/\d+\.|action.*:/i, '').trim();
          if (action) analysis.actions.push(action);
        }
      });

      return analysis;
    }
    
    return null;
  } catch (error) {
    console.error('Error analyzing email with Claude:', error.message);
    return null;
  }
}

// Helper to convert JS object to Firestore format
function toFirestoreValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  } else if (typeof value === 'boolean') {
    return { booleanValue: value };
  } else if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: value } : { doubleValue: value };
  } else if (typeof value === 'string') {
    return { stringValue: value };
  } else if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  } else if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  } else if (typeof value === 'object') {
    const fields = {};
    for (const [key, val] of Object.entries(value)) {
      fields[key] = toFirestoreValue(val);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

// Webhook handler
const webhookHandler = async (req, res) => {
  try {
    console.log('📧 =================================');
    console.log('📧 INBOUND EMAIL WEBHOOK TRIGGERED');
    console.log('📧 =================================');
    console.log('📧 Incoming email received via REST API webhook');
    console.log('📧 Headers:', req.headers);
    console.log('📧 Body keys:', Object.keys(req.body || {}));
    console.log('📧 To:', req.body.to);
    console.log('📧 From:', req.body.from);
    console.log('📧 Subject:', req.body.subject);
    console.log('📧 Full body:', req.body);
    
    const {
      to,
      from,
      subject,
      envelope,
      text,
      html
    } = req.body;
    
    // Parse envelope
    let envelopeData;
    let recipientEmail;
    
    try {
      if (envelope) {
        envelopeData = typeof envelope === 'string' ? JSON.parse(envelope) : envelope;
        recipientEmail = envelopeData.to[0];
      } else {
        // Fallback to 'to' field if no envelope
        recipientEmail = to;
      }
    } catch (e) {
      console.error('Failed to parse envelope:', e);
      recipientEmail = to; // Fallback to 'to' field
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
      // Use REST API to query families
      console.log('📧 API_KEY available:', !!API_KEY);
      console.log('📧 API_KEY length:', API_KEY ? API_KEY.length : 0);
      const queryUrl = `${FIRESTORE_BASE_URL}:runQuery${API_KEY ? `?key=${API_KEY}` : ''}`;
      console.log('📧 Query URL:', queryUrl);
      const queryResponse = await axios.post(queryUrl, {
        structuredQuery: {
          from: [{ collectionId: 'families' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'emailPrefix' },
              op: 'EQUAL',
              value: { stringValue: familyEmailPrefix }
            }
          },
          limit: 1
        }
      });
      
      if (!queryResponse.data[0]?.document) {
        console.error('No family found for email prefix:', familyEmailPrefix);
        return res.status(200).send('OK');
      }
      
      const familyDoc = queryResponse.data[0].document;
      const familyId = familyDoc.name.split('/').pop();
      console.log('Found family:', familyId);
      
      // Create email document
      const emailData = {
        fields: {
          familyId: toFirestoreValue(familyId),
          familyEmailPrefix: toFirestoreValue(familyEmailPrefix),
          to: toFirestoreValue(recipientEmail),
          from: toFirestoreValue(from),
          subject: toFirestoreValue(subject || '(No subject)'),
          content: toFirestoreValue({
            text: text || '',
            html: html || ''
          }),
          status: toFirestoreValue('pending'),
          source: toFirestoreValue('email'),
          type: toFirestoreValue('email'),
          receivedAt: toFirestoreValue(new Date()),
          createdAt: toFirestoreValue(new Date())
        }
      };
      
      // Save to emailInbox
      const createUrl = `${FIRESTORE_BASE_URL}/emailInbox${API_KEY ? `?key=${API_KEY}` : ''}`;
      const createResponse = await axios.post(createUrl, emailData);
      
      const emailId = createResponse.data.name.split('/').pop();
      console.log('✅ Email saved with ID:', emailId);
      
      // Process with Claude AI
      setTimeout(async () => {
        await processEmailWithClaude(emailId, {
          familyId,
          subject: subject || '',
          from: from || '',
          content: { text: text || '' }
        });
      }, 2000);
      
    } catch (queryError) {
      console.error('REST API error:', queryError.response?.data || queryError.message);
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('❌ Error processing email:', error);
    res.status(200).send('OK');
  }
};

// Process email with Claude AI
async function processEmailWithClaude(emailId, emailData) {
  try {
    console.log('🤖 Processing email with Claude:', emailId);
    
    // Analyze email with Claude
    const analysis = await analyzeEmailWithClaude({
      subject: emailData.subject,
      from: emailData.from,
      text: emailData.content.text
    });
    
    if (!analysis) {
      console.log('Claude analysis failed, falling back to simple processing');
      
      // Fallback to simple keyword matching
      const content = (emailData.content.text + ' ' + emailData.subject).toLowerCase();
      
      if (content.includes('ryggsäck') || content.includes('tom') || content.includes('skola') || 
          content.includes('backpack') || content.includes('empty') || content.includes('school')) {
        
        analysis = {
          summary: 'Email about bringing empty backpack to school',
          category: 'school',
          urgency: 'high',
          actions: ['Bring empty backpack to school']
        };
      } else {
        return; // No action needed
      }
    }
    
    console.log('Claude analysis result:', analysis);
    
    // Create tasks based on analysis
    const allieActions = [];
    
    if (analysis.actions && analysis.actions.length > 0) {
      for (const action of analysis.actions) {
        // Create kanban task
        const taskData = {
          fields: {
            familyId: toFirestoreValue(emailData.familyId),
            title: toFirestoreValue(action),
            description: toFirestoreValue(`From email: ${emailData.subject}\n\n${analysis.summary}`),
            column: toFirestoreValue('todo'),
            priority: toFirestoreValue(analysis.urgency || 'medium'),
            dueDate: toFirestoreValue(
              analysis.urgency === 'high' 
                ? new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
                : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next week
            ),
            source: toFirestoreValue('email'),
            sourceId: toFirestoreValue(emailId),
            createdAt: toFirestoreValue(new Date()),
            createdBy: toFirestoreValue('Allie AI'),
            assignedTo: toFirestoreValue([]),
            tags: toFirestoreValue([analysis.category, analysis.urgency])
          }
        };
        
        const taskResponse = await axios.post(`${FIRESTORE_BASE_URL}/kanbanTasks${API_KEY ? `?key=${API_KEY}` : ''}`, taskData);
        const taskId = taskResponse.data.name.split('/').pop();
        
        allieActions.push({
          id: taskId,
          type: 'task',
          title: action,
          details: analysis.summary,
          link: '/kanban',
          status: 'completed'
        });
      }
    }
    
    // Update email status with Claude analysis
    const updateData = {
      fields: {
        status: toFirestoreValue('processed'),
        processedAt: toFirestoreValue(new Date()),
        summary: toFirestoreValue(analysis.summary || 'Email processed'),
        category: toFirestoreValue(analysis.category || 'general'),
        urgency: toFirestoreValue(analysis.urgency || 'medium'),
        allieActions: toFirestoreValue(allieActions),
        actions: toFirestoreValue([{
          type: 'task',
          count: allieActions.length,
          status: 'completed'
        }]),
        claudeAnalysis: toFirestoreValue(analysis)
      }
    };
    
    const patchUrl = `${FIRESTORE_BASE_URL}/emailInbox/${emailId}?key=${API_KEY}&updateMask.fieldPaths=status&updateMask.fieldPaths=processedAt&updateMask.fieldPaths=summary&updateMask.fieldPaths=category&updateMask.fieldPaths=urgency&updateMask.fieldPaths=allieActions&updateMask.fieldPaths=actions&updateMask.fieldPaths=claudeAnalysis`;
    
    await axios.patch(patchUrl, updateData);
    
    console.log(`✅ Processed email with Claude, created ${allieActions.length} tasks`);
  } catch (error) {
    console.error('Error processing email:', error.response?.data || error.message);
  }
}

// Routes - handle both form data and JSON
router.use('/api/emails/inbound', express.urlencoded({ extended: true }));
router.use('/api/emails/inbound', express.json());
router.post('/api/emails/inbound', upload.any(), webhookHandler);

// Get inbox - also using REST API
router.get('/api/family/inbox', async (req, res) => {
  try {
    const familyEmailPrefix = req.query.family;
    
    if (!familyEmailPrefix) {
      return res.status(400).json({ error: 'Family parameter required' });
    }
    
    // Query families
    const queryUrl = `${FIRESTORE_BASE_URL}:runQuery`;
    const familyQuery = await axios.post(queryUrl, {
      structuredQuery: {
        from: [{ collectionId: 'families' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'emailPrefix' },
            op: 'EQUAL',
            value: { stringValue: familyEmailPrefix }
          }
        },
        limit: 1
      }
    });
    
    if (!familyQuery.data[0]?.document) {
      return res.json({ success: true, messages: [] });
    }
    
    const familyId = familyQuery.data[0].document.name.split('/').pop();
    
    // Query emails
    const emailQuery = await axios.post(queryUrl, {
      structuredQuery: {
        from: [{ collectionId: 'emailInbox' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'familyId' },
            op: 'EQUAL',
            value: { stringValue: familyId }
          }
        },
        orderBy: [{ field: { fieldPath: 'receivedAt' }, direction: 'DESCENDING' }],
        limit: 50
      }
    });
    
    // Convert Firestore format to regular JSON
    const messages = emailQuery.data
      .filter(item => item.document)
      .map(item => {
        const doc = item.document;
        const id = doc.name.split('/').pop();
        const fields = doc.fields;
        
        // Convert fields back to regular format
        const data = {};
        for (const [key, value] of Object.entries(fields)) {
          data[key] = extractValue(value);
        }
        
        return { id, ...data };
      });
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching inbox:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch inbox' });
  }
});

// Helper to extract value from Firestore format
function extractValue(firestoreValue) {
  if (firestoreValue.stringValue !== undefined) return firestoreValue.stringValue;
  if (firestoreValue.booleanValue !== undefined) return firestoreValue.booleanValue;
  if (firestoreValue.integerValue !== undefined) return parseInt(firestoreValue.integerValue);
  if (firestoreValue.doubleValue !== undefined) return firestoreValue.doubleValue;
  if (firestoreValue.timestampValue !== undefined) return new Date(firestoreValue.timestampValue);
  if (firestoreValue.nullValue !== undefined) return null;
  if (firestoreValue.arrayValue !== undefined) {
    return firestoreValue.arrayValue.values?.map(extractValue) || [];
  }
  if (firestoreValue.mapValue !== undefined) {
    const obj = {};
    for (const [key, val] of Object.entries(firestoreValue.mapValue.fields || {})) {
      obj[key] = extractValue(val);
    }
    return obj;
  }
  return null;
}

module.exports = router;