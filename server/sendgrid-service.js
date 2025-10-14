const express = require('express');
const router = express.Router();
const multer = require('multer');
const admin = require('./firebase-admin');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Configure multer for parsing multipart form data
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  }
});

/**
 * Create family email address
 */
router.post('/create-family-email', async (req, res) => {
  try {
    const { familyId, familyName } = req.body;
    
    // Generate unique email address
    const emailPrefix = familyName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
    
    const familyEmail = `${emailPrefix}@families.checkallie.com`;
    
    // Store in database
    await admin.firestore()
      .collection('families')
      .doc(familyId)
      .update({
        familyEmail,
        emailCreatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    res.json({ 
      success: true, 
      familyEmail,
      instructions: [
        `Forward schedules and documents to: ${familyEmail}`,
        'Allie will automatically parse and add events to your calendar',
        'You can also CC this address on important emails'
      ]
    });
  } catch (error) {
    console.error('Error creating family email:', error);
    res.status(500).json({ error: 'Failed to create family email' });
  }
});

/**
 * Webhook to receive inbound emails
 */
router.post('/incoming-email', upload.any(), async (req, res) => {
  try {
    console.log('Incoming email received');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request files:', req.files?.length || 0);
    
    // Parse email data from SendGrid
    const {
      to,
      from,
      subject,
      text,
      html,
      email,  // Sometimes SendGrid sends the full email in this field
      envelope,
      attachments: attachmentCount
    } = req.body;
    
    // Log all fields for debugging
    console.log('Email webhook data:', {
      to,
      from,
      subject,
      hasText: !!text,
      textLength: text?.length,
      hasHtml: !!html,
      hasEmail: !!email,
      emailLength: email?.length,
      envelope
    });
    
    // Parse raw email if needed
    let parsedContent = text || '';
    let parsedHtml = html || '';
    let parsedSubject = subject || 'No Subject';
    let parsedFrom = from || '';
    
    // Check if we received raw email data
    if ((text && text.includes('Received:')) || (email && email.includes('Received:'))) {
      console.log('📧 Detected raw email format, parsing...');
      const rawEmail = text || email;
      
      try {
        // Extract subject
        const subjectMatch = rawEmail.match(/Subject:\s*(.+?)(\r?\n|$)/i);
        if (subjectMatch) {
          parsedSubject = subjectMatch[1].trim();
        }
        
        // Extract from
        const fromMatch = rawEmail.match(/From:\s*(.+?)(\r?\n|$)/i);
        if (fromMatch) {
          parsedFrom = fromMatch[1].trim();
        }
        
        // Extract body content - look for content after the boundary
        let bodyContent = '';
        
        // Look for plain text content
        const plainTextBoundary = rawEmail.match(/Content-Type:\s*text\/plain[^]*?\r?\n\r?\n([^]*?)(?=--[0-9a-f]+|$)/i);
        if (plainTextBoundary) {
          bodyContent = plainTextBoundary[1].trim();
          // Remove any trailing boundary markers
          bodyContent = bodyContent.replace(/--[0-9a-f]+--?$/g, '').trim();
        }
        
        // Look for HTML content if no plain text found
        if (!bodyContent) {
          const htmlBoundary = rawEmail.match(/Content-Type:\s*text\/html[^]*?\r?\n\r?\n([^]*?)(?=--[0-9a-f]+|$)/i);
          if (htmlBoundary) {
            parsedHtml = htmlBoundary[1].trim();
            // Decode quoted-printable encoding
            parsedHtml = parsedHtml.replace(/=3D/g, '=').replace(/=\r?\n/g, '');
            // Extract text from HTML
            bodyContent = parsedHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          }
        }
        
        // If we found content, use it
        if (bodyContent) {
          parsedContent = bodyContent;
          console.log('✅ Successfully parsed email content:', parsedContent.substring(0, 100) + '...');
        } else {
          console.log('⚠️ Could not extract body content from raw email');
        }
        
      } catch (parseError) {
        console.error('Error parsing raw email:', parseError);
        // Fallback to original values
      }
    }
    
    // Extract family name from email address
    let toEmail;
    try {
      // Handle different formats from SendGrid
      if (envelope) {
        const envelopeData = typeof envelope === 'string' ? JSON.parse(envelope) : envelope;
        toEmail = envelopeData.to?.[0] || to;
      } else {
        toEmail = to;
      }
    } catch (error) {
      console.error('Error parsing envelope:', error);
      toEmail = to;
    }
    
    console.log('Processing email to:', toEmail);
    const emailMatch = toEmail?.match(/^([a-z0-9]+)@families\.checkallie\.com$/);
    
    if (!emailMatch) {
      console.error('Invalid family email format:', toEmail);
      return res.status(200).send('OK'); // Still return 200 to SendGrid
    }
    
    const familyEmailPrefix = emailMatch[1];
    
    // Find family by email
    const familySnapshot = await admin.firestore()
      .collection('families')
      .where('familyEmail', '==', toEmail)
      .limit(1)
      .get();
    
    if (familySnapshot.empty) {
      console.error('Family not found for email:', toEmail);
      return res.status(200).send('OK');
    }
    
    const family = familySnapshot.docs[0];
    const familyId = family.id;
    
    // Store email data matching frontend expectations
    const emailData = {
      familyId,
      familyEmailPrefix,
      type: 'email',
      source: 'email',
      to: toEmail,
      from: parsedFrom,
      senderEmail: parsedFrom,
      senderName: parsedFrom.match(/^(.*?)\s*</) ? parsedFrom.match(/^(.*?)\s*</)[1].trim() : parsedFrom,
      subject: parsedSubject,
      textContent: parsedContent,
      htmlContent: parsedHtml,
      content: parsedContent || parsedHtml,
      body: parsedContent || parsedHtml,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      receivedAt: new Date(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      processed: false,
      hasAttachments: parseInt(attachmentCount) > 0,
      attachmentCount: parseInt(attachmentCount) || 0
    };
    
    // Handle attachments
    if (req.files && req.files.length > 0) {
      emailData.attachments = [];
      
      for (const file of req.files) {
        // Store attachment metadata
        emailData.attachments.push({
          filename: file.originalname,
          contentType: file.mimetype,
          size: file.size
        });
        
        // TODO: Upload to Firebase Storage
        // const storageRef = admin.storage().bucket().file(`emails/${familyId}/${file.originalname}`);
        // await storageRef.save(file.buffer);
      }
    }
    
    // Save to emailInbox collection (same as SMS for unified inbox)
    const emailRef = await admin.firestore()
      .collection('emailInbox')
      .add(emailData);
    
    console.log('✅ Email saved to emailInbox with ID:', emailRef.id, 'familyId:', emailData.familyId);
    
    // Process email with Claude AI immediately
    setTimeout(async () => {
      await processEmailWithAllie(emailRef.id, emailData);
    }, 2000);
    
    // Send auto-reply
    await sendAutoReply(from, familyId);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing incoming email:', error);
    res.status(200).send('OK'); // Always return 200 to SendGrid
  }
});

/**
 * Send auto-reply to acknowledge email receipt
 */
async function sendAutoReply(toEmail, familyId) {
  try {
    const msg = {
      to: toEmail,
      from: 'stefan@checkallie.com',
      subject: 'Allie received your email',
      text: `Thanks for your email! I'm processing the information and will add any events or tasks to your family calendar.

If you included a schedule or document, I'll extract the relevant information and organize it for you.

Best,
Allie
Your AI Family Assistant`,
      html: `<p>Thanks for your email! I'm processing the information and will add any events or tasks to your family calendar.</p>
<p>If you included a schedule or document, I'll extract the relevant information and organize it for you.</p>
<p>Best,<br>
Allie<br>
<em>Your AI Family Assistant</em></p>`
    };
    
    await sgMail.send(msg);
    console.log('Auto-reply sent to:', toEmail);
  } catch (error) {
    console.error('Error sending auto-reply:', error);
  }
}

/**
 * Process email with Claude AI for comprehensive parsing
 */
async function processEmailWithAllie(emailId, emailData) {
  try {
    console.log('🤖 Processing email with Claude AI:', emailId);
    
    const actions = [];
    
    // Get family data for context
    const familyDoc = await admin.firestore()
      .collection('families')
      .doc(emailData.familyId)
      .get();
    
    const familyData = familyDoc.exists() ? familyDoc.data() : {};
    const familyMembers = familyData.familyMembers || [];
    
    // Combine text and HTML content for analysis
    const emailContent = emailData.textContent || emailData.htmlContent || emailData.content || '';
    
    // Create comprehensive prompt for Claude
    const prompt = `You are Allie, an AI family assistant. Analyze this email and extract ALL actionable information.

Email Details:
From: ${emailData.from}
To: ${emailData.to}
Subject: ${emailData.subject}
Content: "${emailContent}"

Family Name: ${familyData.familyName || 'Unknown'}
Family Members: ${familyMembers.map(m => `${m.name} (${m.role})`).join(', ')}
Current Date/Time: ${new Date().toISOString()}
Current Day: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

Please analyze this email and return a JSON response with the following structure:
{
  "summary": "Brief summary of the email content and what actions were extracted",
  "actions": [
    {
      "type": "calendar_event",
      "title": "Clear, specific event title",
      "description": "Full description with all relevant details from the email",
      "date": "YYYY-MM-DD (calculate from dates mentioned)",
      "time": "HH:MM (24-hour format)",
      "duration": 60,
      "location": "location if mentioned",
      "attendees": ["list of family members who should attend"],
      "reminderMinutes": 30,
      "category": "activity/medical/school/work/other"
    },
    {
      "type": "task",
      "title": "Clear task title",
      "description": "Task details from the email",
      "assignedTo": ["Family member names from the list above"],
      "dueDate": "YYYY-MM-DD (calculate based on event dates or deadlines mentioned)",
      "priority": "high/medium/low",
      "tags": ["relevant", "tags"]
    },
    {
      "type": "document",
      "title": "Document title",
      "category": "schedule/form/notice/other",
      "needsReview": true,
      "extractedInfo": "Key information from the document"
    }
  ],
  "suggestedResponse": "A brief acknowledgment of what was processed"
}

Important instructions:
- Extract ALL dates, times, and events mentioned
- For school schedules, create individual events for each item
- For forms or documents, note deadlines and required actions
- Identify which family members are affected by each item
- Calculate actual dates from relative terms
- Be thorough - don't miss any actionable information
- For tasks related to events, set the dueDate a few days before the event
- Always assign tasks to specific family members by name (use the exact names from the family members list)
- For tasks like "buy present" or "get costume", set dueDate 3-5 days before the event date`;

    try {
      // Call Claude API
      const claudeUrl = process.env.NODE_ENV === 'production' 
        ? 'https://parentload-backend-363935868004.us-central1.run.app/api/claude'
        : 'http://localhost:3001/api/claude';
      
      console.log('📤 Calling Claude API for email analysis...');
      
      const axios = require('axios');
      const response = await axios.post(claudeUrl, {
        model: 'claude-3-5-sonnet-20241022',
        messages: [{
          role: 'user',
          content: prompt
        }],
        max_tokens: 2000,
        temperature: 0.3
      });
      
      const aiContent = response.data.content[0].text;
      console.log('📥 Claude response received');
      
      // Parse the AI response
      let aiAnalysis;
      try {
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        aiAnalysis = {
          summary: "Email received but couldn't parse details",
          actions: [{
            type: "task",
            title: "Review email: " + emailData.subject,
            description: emailContent.substring(0, 200),
            assignedTo: familyMembers.filter(m => m.role === 'parent').map(m => m.name),
            priority: "medium"
          }],
          suggestedResponse: "I've saved your email for review."
        };
      }
      
      // Process each action from AI
      for (const action of aiAnalysis.actions || []) {
        try {
          if (action.type === 'calendar_event') {
            const eventData = {
              familyId: emailData.familyId,
              title: action.title,
              description: action.description,
              startTime: new Date(`${action.date}T${action.time}`),
              endTime: new Date(new Date(`${action.date}T${action.time}`).getTime() + (action.duration || 60) * 60 * 1000),
              location: action.location || '',
              attendees: action.attendees || [],
              category: action.category || 'activity',
              reminderMinutes: action.reminderMinutes || 30,
              source: 'email',
              sourceId: emailId,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              createdBy: 'Allie AI',
              metadata: {
                processedByClaude: true,
                emailSubject: emailData.subject,
                emailFrom: emailData.from
              }
            };
            
            await admin.firestore()
              .collection('events')
              .add(eventData);
            
            actions.push({
              type: 'calendar',
              status: 'completed',
              title: `Created event: ${action.title}`,
              details: `${action.date} at ${action.time}`
            });
          }
          else if (action.type === 'task') {
            // Find assignee ID from name
            let assignedToId = null;
            if (action.assignedTo && Array.isArray(action.assignedTo) && action.assignedTo.length > 0) {
              // Try to find the family member by name
              const assignedMemberName = action.assignedTo[0]; // Take first assignee
              const assignedMember = familyMembers.find(m => 
                m.name && m.name.toLowerCase() === assignedMemberName.toLowerCase()
              );
              if (assignedMember) {
                assignedToId = assignedMember.id || assignedMember.uid || null;
              }
            }
            
            // Default to first parent if no assignee found
            if (!assignedToId) {
              const parentMember = familyMembers.find(m => m.role === 'parent');
              if (parentMember) {
                assignedToId = parentMember.id || parentMember.uid || null;
              }
            }
            
            const taskData = {
              familyId: emailData.familyId,
              title: action.title,
              description: action.description,
              column: 'this-week', // Better default than 'todo'
              priority: action.priority || 'medium',
              source: 'email',
              sourceId: emailId,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              createdBy: 'Allie AI',
              assignedTo: assignedToId, // Single ID, not array
              dueDate: action.dueDate ? new Date(action.dueDate) : null,
              tags: action.tags || ['email', 'inbox'],
              status: 'active',
              position: Date.now(),
              fromAllie: true,
              metadata: {
                processedByClaude: true,
                emailSubject: emailData.subject,
                originalAssignees: action.assignedTo // Keep original for reference
              }
            };
            
            await admin.firestore()
              .collection('kanbanTasks')
              .add(taskData);
            
            actions.push({
              type: 'task',
              status: 'completed',
              title: 'Created task',
              details: action.title
            });
          }
          else if (action.type === 'document') {
            const docData = {
              familyId: emailData.familyId,
              fileName: action.title || emailData.subject,
              fileType: 'email',
              category: action.category || 'inbox',
              source: 'email',
              sourceId: emailId,
              uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
              uploadedBy: `Email from ${emailData.from}`,
              status: 'processed',
              title: action.title,
              extractedInfo: action.extractedInfo,
              needsReview: action.needsReview || false,
              metadata: {
                processedByClaude: true,
                emailSubject: emailData.subject
              }
            };
            
            await admin.firestore()
              .collection('familyDocuments')
              .add(docData);
            
            actions.push({
              type: 'document',
              status: 'completed',
              title: 'Saved document',
              details: action.title
            });
          }
        } catch (actionError) {
          console.error('Error processing action:', action, actionError);
        }
      }
      
      // Update email record with AI processing results
      await admin.firestore()
        .collection('emailInbox')
        .doc(emailId)
        .update({
          processed: true,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          actions: actions,
          allieActions: actions,
          summary: aiAnalysis.summary || 'Email processed',
          aiAnalysis: {
            summary: aiAnalysis.summary,
            actionsFound: actions.length,
            suggestedResponse: aiAnalysis.suggestedResponse
          }
        });
      
      console.log('✅ Email processed successfully with', actions.length, 'actions');
      
    } catch (aiError) {
      console.error('Error with AI processing:', aiError);
      
      // Update email as processed even if AI fails
      await admin.firestore()
        .collection('emailInbox')
        .doc(emailId)
        .update({
          processed: true,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
          processingError: aiError.message,
          summary: 'Email saved (AI processing failed)'
        });
    }
    
  } catch (error) {
    console.error('Error processing email with Allie:', error);
  }
}

/**
 * Test email sending
 */
router.post('/test-email', async (req, res) => {
  try {
    const { to, subject, text } = req.body;
    
    const msg = {
      to,
      from: 'stefan@checkallie.com',
      subject: subject || 'Test from Allie',
      text: text || 'This is a test email from your AI family assistant.'
    };
    
    await sgMail.send(msg);
    
    res.json({ success: true, message: 'Test email sent!' });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;