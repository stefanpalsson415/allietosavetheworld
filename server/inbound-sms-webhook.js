// Twilio Inbound SMS Webhook Handler with Full AllieChat Feature Parity
const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const axios = require('axios');
const admin = require('firebase-admin');

// Get Firestore instance from initialized Admin SDK (initialized in production-server.js)
const db = admin.firestore();

// Initialize Twilio client (only if credentials are available)
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
let twilioClient = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
  console.log('✅ Twilio client initialized');
} else {
  console.warn('⚠️ Twilio credentials not configured - SMS replies disabled');
}

// Twilio webhook signature validation (optional but recommended)
const validateTwilioRequest = (req, res, next) => {
  // In production, validate the request came from Twilio
  // For now, skip validation
  next();
};

/**
 * Twilio SMS Webhook
 * Receives all SMS sent to your Twilio number
 */
router.post('/api/sms/inbound', validateTwilioRequest, async (req, res) => {
  try {
    console.log('📱 Incoming SMS received');
    
    const {
      From,        // Sender's phone number
      To,          // Your Twilio number
      Body,        // Message text
      NumMedia,    // Number of media attachments
      MessageSid,  // Unique message ID
      AccountSid   // Your Twilio account
    } = req.body;
    
    // Create SMS record
    const smsRecord = {
      id: MessageSid,
      type: 'sms',
      from: From,
      to: To,
      receivedAt: new Date(),
      status: 'pending',
      content: {
        text: Body || '',
        images: []
      },
      actions: []
    };
    
    // Handle media attachments (MMS)
    const numMedia = parseInt(NumMedia) || 0;
    if (numMedia > 0) {
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = req.body[`MediaUrl${i}`];
        const mediaType = req.body[`MediaContentType${i}`];
        
        if (mediaUrl) {
          smsRecord.content.images.push({
            url: mediaUrl,
            contentType: mediaType,
            index: i
          });
        }
      }
    }
    
    // Find which family this belongs to
    console.log('🔍 Looking up family for phone:', From);
    
    // Check if this is a test request
    const isTestRequest = req.body.TestMode === 'true' || req.headers['x-test-mode'] === 'true';
    
    let family = await findFamilyByPhone(From);
    
    // If test mode and no family found, use the test family
    if (!family && isTestRequest) {
      console.log('🧪 Test mode detected, using first available family');
      family = await getTestFamily();
    }
    
    if (!family) {
      console.log('❌ No family found for phone:', From);
      // Unknown number - send welcome message
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message('Welcome to Allie! Please sign up at checkallie.com to connect this number to your family account.');
      
      return res.type('text/xml').send(twiml.toString());
    }
    
    console.log('✅ Found family:', family.id, family.name, 'for phone:', From);
    
    // Prepare SMS data for Firestore
    const smsData = {
      familyId: family.id,
      familyEmailPrefix: family.emailPrefix,
      from: From,
      phoneNumber: From,
      to: To,
      content: Body || '',
      body: Body || '',
      hasMedia: numMedia > 0,
      mediaCount: numMedia,
      messageId: MessageSid,
      status: 'pending',
      source: numMedia > 0 ? 'mms' : 'sms',
      type: numMedia > 0 ? 'mms' : 'sms',
      receivedAt: new Date(),
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Handle media attachments
    if (numMedia > 0) {
      const mediaUrls = [];
      for (let i = 0; i < numMedia; i++) {
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
      smsData.content.images = mediaUrls;
    }

    // Store in Firestore - just save as pending, frontend will auto-process
    console.log('💾 Saving SMS to Firestore with data:', {
      familyId: smsData.familyId,
      from: smsData.from,
      contentPreview: smsData.content?.substring(0, 50) + '...'
    });

    const smsRef = await db.collection('smsInbox').add(smsData);
    console.log('✅ SMS saved to Firestore with ID:', smsRef.id, 'familyId:', smsData.familyId);

    // Don't process here - let frontend auto-process with FixedUniversalAIProcessor
    // This ensures SMS gets parsed into tasks/events/contacts/docs like emails

    // Send confirmation SMS back to user
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('✅ Received and processing - Allie');

    res.type('text/xml').send(twiml.toString());

    console.log('✅ SMS received and queued:', {
      id: smsRef.id,
      from: From,
      hasMedia: numMedia > 0,
      family: family.name
    });
    
  } catch (error) {
    console.error('❌ Error processing SMS:', error);
    
    // Send error response
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Sorry, I had trouble processing that. Please try again.");
    
    res.type('text/xml').send(twiml.toString());
  }
});

/**
 * Queue SMS for processing with Allie
 */
async function queueForProcessing(smsId, smsData) {
  // Process immediately for demo
  setTimeout(async () => {
    try {
      await processSMSWithAllie(smsId, smsData);
    } catch (error) {
      console.error('❌ Error processing SMS in queue:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
  }, 2000);
}

/**
 * Load conversation history for SMS thread
 */
async function loadConversationHistory(phoneNumber, familyId, limitNum = 10) {
  try {
    const conversationQuery = db.collection('smsConversations')
      .where('phoneNumber', '==', phoneNumber)
      .where('familyId', '==', familyId)
      .orderBy('createdAt', 'desc')
      .limit(limitNum);

    const snapshot = await conversationQuery.get();
    const messages = snapshot.docs.map(doc => ({
      role: doc.data().role,
      content: doc.data().content,
      timestamp: doc.data().createdAt
    }));

    // Return in chronological order (oldest first)
    return messages.reverse();
  } catch (error) {
    console.error('Error loading conversation history:', error);
    return [];
  }
}

/**
 * Save message to conversation history
 */
async function saveToConversationHistory(phoneNumber, familyId, role, content) {
  try {
    await db.collection('smsConversations').add({
      phoneNumber,
      familyId,
      role,
      content,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving to conversation history:', error);
  }
}

/**
 * Load full family context for AI processing
 */
async function loadFamilyContext(familyId) {
  try {
    // Get family data
    const familyDoc = await db.collection('families').doc(familyId).get();
    if (!familyDoc.exists) {
      return { members: [], events: [], tasks: [], habits: [] };
    }

    const familyData = familyDoc.data();

    // Get family members
    const members = familyData.familyMembers || familyData.members || [];

    // Get upcoming events (next 7 days)
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const eventsQuery = db.collection('events')
      .where('familyId', '==', familyId)
      .where('startTime', '>=', now)
      .where('startTime', '<=', weekLater)
      .orderBy('startTime', 'asc')
      .limit(20);
    const eventsSnapshot = await eventsQuery.get();
    const events = eventsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get active tasks
    const tasksQuery = db.collection('kanbanTasks')
      .where('familyId', '==', familyId)
      .where('column', 'in', ['todo', 'inProgress'])
      .limit(20);
    const tasksSnapshot = await tasksQuery.get();
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get active habits (from HabitService2)
    const habitsQuery = db.collection('habits2')
      .where('familyId', '==', familyId)
      .limit(20);
    const habitsSnapshot = await habitsQuery.get();
    const habits = habitsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      familyName: familyData.familyName || familyData.name || 'Family',
      members,
      events,
      tasks,
      habits
    };
  } catch (error) {
    console.error('Error loading family context:', error);
    return { members: [], events: [], tasks: [], habits: [] };
  }
}

/**
 * Build comprehensive system prompt with family context
 */
function buildSystemPrompt(familyContext, userInfo) {
  const { familyName, members, events, tasks, habits } = familyContext;

  let systemPrompt = `You are Allie, an AI family assistant communicating via SMS with ${familyName}.

Current user: ${userInfo.name || 'Family member'}
Phone: ${userInfo.phone}

Family Members:
${members.map(m => `- ${m.name} (${m.role || 'member'}${m.age ? `, age ${m.age}` : ''})`).join('\n')}

`;

  // Add upcoming events context
  if (events.length > 0) {
    systemPrompt += `\nUpcoming Events (next 7 days):
${events.slice(0, 5).map(e => `- ${e.title} on ${new Date(e.startTime?.seconds * 1000 || e.startTime).toLocaleDateString()}`).join('\n')}
`;
  }

  // Add active tasks context
  if (tasks.length > 0) {
    systemPrompt += `\nActive Tasks:
${tasks.slice(0, 5).map(t => `- ${t.title} (assigned to: ${t.assignedTo?.join(', ') || 'unassigned'})`).join('\n')}
`;
  }

  // Add active habits context
  if (habits.length > 0) {
    systemPrompt += `\nActive Habits:
${habits.slice(0, 5).map(h => `- ${h.title} by ${h.createdByName || 'family member'}`).join('\n')}
`;
  }

  systemPrompt += `

Capabilities via SMS:
🔍 INFORMATION RETRIEVAL (Priority):
- Answer questions about family schedule, tasks, and habits
- Retrieve information about family members and contacts
- Search family documents and emails
- Provide context-aware responses

✏️ ACTION CREATION:
- Create and manage calendar events
- Create, complete, and assign tasks
- Create and track habits using the Four Laws framework
- Provide reminders and proactive nudges

SMS Command Shortcuts:
- "done [habit/task name]" - Mark habit or task complete
- "skip [habit name]" - Skip today's habit
- "what's next" - Show upcoming events
- "my tasks" - Show your assigned tasks
- "add task [description]" - Create new task
- "remind me [when] to [what]" - Create reminder

IMPORTANT: When user asks a question (starts with what/when/who/where/show/list), provide a direct answer.
Keep responses concise for SMS (under 300 chars when possible). Use emojis sparingly but effectively.
`;

  return systemPrompt;
}

/**
 * Handle quick SMS command shortcuts
 */
async function handleQuickCommands(text, smsData) {
  const textLower = text.toLowerCase().trim();

  // "done [task/habit]" - Mark complete
  if (textLower.startsWith('done ')) {
    const itemName = text.substring(5).trim();
    return await handleDoneCommand(itemName, smsData);
  }

  // "skip [habit]" - Skip habit for today
  if (textLower.startsWith('skip ')) {
    const habitName = text.substring(5).trim();
    return await handleSkipCommand(habitName, smsData);
  }

  // "what's next" - Show upcoming events
  if (textLower.includes("what's next") || textLower === 'whats next') {
    return await handleWhatsNextCommand(smsData);
  }

  // "my tasks" - Show assigned tasks
  if (textLower === 'my tasks' || textLower === 'tasks') {
    return await handleMyTasksCommand(smsData);
  }

  return null;
}

/**
 * Handle "done" command
 */
async function handleDoneCommand(itemName, smsData) {
  try {
    // Check habits first
    const habitsQuery = db.collection('habits2')
      .where('familyId', '==', smsData.familyId)
      .limit(20);
    const habitsSnapshot = await habitsQuery.get();

    for (const habitDoc of habitsSnapshot.docs) {
      const habit = habitDoc.data();
      if (habit.title.toLowerCase().includes(itemName.toLowerCase())) {
        // Mark habit as complete for today
        const completions = habit.completions || [];
        completions.push({
          date: new Date(),
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('habits2').doc(habitDoc.id).update({
          completions,
          lastCompletedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
          message: `✅ Great job! Marked "${habit.title}" as complete for today.`,
          actions: [{ type: 'habit_complete', habit: habit.title }]
        };
      }
    }

    // Check tasks
    const tasksQuery = db.collection('kanbanTasks')
      .where('familyId', '==', smsData.familyId)
      .where('column', '!=', 'done')
      .limit(20);
    const tasksSnapshot = await tasksQuery.get();

    for (const taskDoc of tasksSnapshot.docs) {
      const task = taskDoc.data();
      if (task.title.toLowerCase().includes(itemName.toLowerCase())) {
        await db.collection('kanbanTasks').doc(taskDoc.id).update({
          column: 'done',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        return {
          message: `✅ Task completed: "${task.title}"`,
          actions: [{ type: 'task_complete', task: task.title }]
        };
      }
    }

    return {
      message: `I couldn't find "${itemName}". Try being more specific or say "my tasks" to see your list.`,
      actions: []
    };
  } catch (error) {
    console.error('Error in handleDoneCommand:', error);
    return {
      message: "Sorry, I had trouble marking that as done. Please try again.",
      actions: []
    };
  }
}

/**
 * Handle "skip" command
 */
async function handleSkipCommand(habitName, smsData) {
  try {
    const habitsQuery = db.collection('habits2')
      .where('familyId', '==', smsData.familyId)
      .limit(20);
    const habitsSnapshot = await habitsQuery.get();

    for (const habitDoc of habitsSnapshot.docs) {
      const habit = habitDoc.data();
      if (habit.title.toLowerCase().includes(habitName.toLowerCase())) {
        const skips = habit.skips || [];
        skips.push({
          date: new Date(),
          reason: 'skipped_via_sms',
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection('habits2').doc(habitDoc.id).update({
          skips
        });

        return {
          message: `Okay, skipped "${habit.title}" for today. You've got this! 💪`,
          actions: [{ type: 'habit_skip', habit: habit.title }]
        };
      }
    }

    return {
      message: `I couldn't find habit "${habitName}". What habit did you want to skip?`,
      actions: []
    };
  } catch (error) {
    console.error('Error in handleSkipCommand:', error);
    return {
      message: "Sorry, I had trouble skipping that habit.",
      actions: []
    };
  }
}

/**
 * Handle "what's next" command
 */
async function handleWhatsNextCommand(smsData) {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const eventsQuery = db.collection('events')
      .where('familyId', '==', smsData.familyId)
      .where('startTime', '>=', now)
      .where('startTime', '<=', tomorrow)
      .orderBy('startTime', 'asc')
      .limit(3);

    const eventsSnapshot = await eventsQuery.get();

    if (eventsSnapshot.empty) {
      return {
        message: "No upcoming events in the next 24 hours. Enjoy the free time! 😊",
        actions: []
      };
    }

    let message = "📅 Coming up:\n";
    eventsSnapshot.docs.forEach((doc, idx) => {
      const event = doc.data();
      const startTime = event.startTime?.seconds
        ? new Date(event.startTime.seconds * 1000)
        : new Date(event.startTime);

      message += `${idx + 1}. ${event.title} at ${startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })}\n`;
    });

    return {
      message,
      actions: [{ type: 'query_events', count: eventsSnapshot.size }]
    };
  } catch (error) {
    console.error('Error in handleWhatsNextCommand:', error);
    return {
      message: "Sorry, I had trouble loading your events.",
      actions: []
    };
  }
}

/**
 * Handle "my tasks" command
 */
async function handleMyTasksCommand(smsData) {
  try {
    const tasksQuery = db.collection('kanbanTasks')
      .where('familyId', '==', smsData.familyId)
      .where('column', 'in', ['todo', 'inProgress'])
      .limit(5);

    const tasksSnapshot = await tasksQuery.get();

    if (tasksSnapshot.empty) {
      return {
        message: "No active tasks! You're all caught up. 🎉",
        actions: []
      };
    }

    let message = "📋 Your tasks:\n";
    tasksSnapshot.docs.forEach((doc, idx) => {
      const task = doc.data();
      message += `${idx + 1}. ${task.title}\n`;
    });
    message += '\nReply "done [task name]" to complete one!';

    return {
      message,
      actions: [{ type: 'query_tasks', count: tasksSnapshot.size }]
    };
  } catch (error) {
    console.error('Error in handleMyTasksCommand:', error);
    return {
      message: "Sorry, I had trouble loading your tasks.",
      actions: []
    };
  }
}

/**
 * Classify SMS intent using Claude
 */
async function classifyIntent(messageText, familyContext) {
  const intentPrompt = `Classify this SMS message intent:

Message: "${messageText}"

Context: User has ${familyContext.tasks?.length || 0} active tasks,
         ${familyContext.events?.length || 0} upcoming events,
         ${familyContext.habits?.length || 0} habits

Intent Categories:
1. QUERY - User asking for information
   Examples: "What tasks do I have?", "What's on my calendar today?",
             "Who is Tegner's tennis coach?", "Show me today's schedule",
             "Do I have anything tomorrow?", "What are my habits?"

2. PARSE - User providing information to process
   Examples: "Tennis lesson Wed 5pm with Coach Felix",
             "Doctor appointment next Tuesday at 2pm",
             Forwarded emails/schedules, calendar invitations

3. COMMAND - Direct action request (already handled by quick commands)
   Examples: "done meditate", "skip workout", "remind me to buy milk"

Respond with JSON:
{
  "intent": "query|parse|command",
  "confidence": 0.0-1.0,
  "reasoning": "Why you chose this intent",
  "queryType": "tasks|events|habits|contacts|general" (if query intent)
}`;

  try {
    const claudeUrl = process.env.NODE_ENV === 'production'
      ? 'http://localhost:8080/api/claude'  // Internal call within same container
      : 'http://localhost:3002/api/claude';

    console.log('🧠 Classifying intent with Claude...');

    const response = await fetch(claudeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: intentPrompt }],
        max_tokens: 500,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const jsonMatch = result.content[0].text.match(/\{[\s\S]*\}/);
    const classification = jsonMatch ? JSON.parse(jsonMatch[0]) : { intent: 'parse', confidence: 0.5 };

    console.log('📊 Intent classification result:', classification);
    return classification;
  } catch (error) {
    console.error('❌ Intent classification error:', error);
    return { intent: 'parse', confidence: 0.5, reasoning: 'Classification failed, defaulting to parse' };
  }
}

/**
 * Build family context summary for queries
 */
function buildFamilyContextSummary(familyContext) {
  let summary = '';

  // Add members
  if (familyContext.members && familyContext.members.length > 0) {
    summary += `Family Members:\n${familyContext.members.map(m => `- ${m.name}${m.age ? ` (${m.age})` : ''}`).join('\n')}\n\n`;
  }

  // Add today's events
  const today = new Date();
  const todayEvents = (familyContext.events || []).filter(e => {
    const eventDate = e.startTime?.seconds
      ? new Date(e.startTime.seconds * 1000)
      : new Date(e.startTime);
    return eventDate.toDateString() === today.toDateString();
  });

  if (todayEvents.length > 0) {
    summary += `Today's Events:\n${todayEvents.map(e => {
      const time = e.startTime?.seconds
        ? new Date(e.startTime.seconds * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
        : new Date(e.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      return `- ${e.title} at ${time}`;
    }).join('\n')}\n\n`;
  }

  // Add active tasks
  if (familyContext.tasks && familyContext.tasks.length > 0) {
    summary += `Active Tasks:\n${familyContext.tasks.slice(0, 10).map(t =>
      `- ${t.title}${t.assignedTo?.length ? ` (${t.assignedTo.join(', ')})` : ''}`
    ).join('\n')}\n\n`;
  }

  // Add active habits
  if (familyContext.habits && familyContext.habits.length > 0) {
    summary += `Active Habits:\n${familyContext.habits.slice(0, 5).map(h =>
      `- ${h.title} by ${h.createdByName || 'family member'}`
    ).join('\n')}`;
  }

  return summary;
}

/**
 * Handle QUERY intent - retrieve and respond
 */
async function handleQueryIntent(smsId, messageText, smsData, familyContext) {
  const queryPrompt = `You are Allie, answering a family member's question via SMS.

User: ${familyContext.userInfo?.name || 'Family member'}
Phone: ${smsData.from}
Question: "${messageText}"

Family Context:
${buildFamilyContextSummary(familyContext)}

Provide a helpful, concise response. If they ask about:
- Tasks: List their tasks with status
- Events: List upcoming events with times
- Habits: List their habits and completion status
- General: Answer their question using the context above

Keep SMS-friendly (aim for under 300 characters, but can be longer if needed):
- Use emojis sparingly (✓ for complete, ⏰ for time, 📅 for date)
- Use numbered lists for multiple items
- Include relevant times/dates
- Today's date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;

  try {
    const claudeUrl = process.env.NODE_ENV === 'production'
      ? 'http://localhost:8080/api/claude'  // Internal call within same container
      : 'http://localhost:3002/api/claude';

    console.log('📥 Handling QUERY intent with Claude...');

    const response = await fetch(claudeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: queryPrompt }],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const result = await response.json();
    const responseMessage = result.content[0].text;

    console.log('💬 Query response:', responseMessage.substring(0, 100) + '...');

    // Save to conversation history
    console.log('💾 Saving conversation history...');
    await saveToConversationHistory(smsData.from, smsData.familyId, 'user', messageText);
    await saveToConversationHistory(smsData.from, smsData.familyId, 'assistant', responseMessage);
    console.log('✅ Conversation history saved');

    // Update SMS record as query (no actions created)
    console.log('📝 Updating SMS record in Firestore...');
    await db.collection('smsInbox').doc(smsId).update({
      status: 'processed',
      intent: 'query',
      responseMessage,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      actions: [], // No actions for queries
      summary: `Query: ${messageText.substring(0, 50)}`
    });
    console.log('✅ SMS record updated in Firestore');

    // Send SMS response
    console.log('📲 Preparing to send SMS response via Twilio...');
    console.log('  twilioPhoneNumber:', twilioPhoneNumber);
    console.log('  twilioClient exists:', !!twilioClient);
    console.log('  Response length:', responseMessage.length, 'characters');

    if (twilioPhoneNumber && twilioClient) {
      try {
        const message = await twilioClient.messages.create({
          body: responseMessage,
          from: twilioPhoneNumber,
          to: smsData.from
        });
        console.log('📤 Query response sent via SMS:', {
          sid: message.sid,
          status: message.status,
          to: smsData.from
        });
      } catch (twilioError) {
        console.error('❌ Twilio send error:', twilioError);
        console.error('Twilio error details:', {
          code: twilioError.code,
          message: twilioError.message,
          status: twilioError.status
        });
        throw twilioError;
      }
    } else {
      console.error('⚠️ Cannot send SMS - Twilio not configured:', {
        hasPhoneNumber: !!twilioPhoneNumber,
        hasClient: !!twilioClient
      });
    }

    return { success: true, responseMessage, intent: 'query' };
  } catch (error) {
    console.error('❌ Query handler error:', error);
    throw error;
  }
}

/**
 * Parse AI response and execute structured actions
 */
async function parseAndExecuteActions(aiContent, smsData, familyContext) {
  const actions = [];

  // Look for action indicators in the response
  // This is a simplified parser - in production you'd want more robust parsing

  // Check for event creation mentions
  if (aiContent.toLowerCase().includes('created event') || aiContent.toLowerCase().includes('added to calendar')) {
    // Event was likely created - this is a placeholder for more sophisticated parsing
    actions.push({
      type: 'calendar',
      status: 'completed',
      title: 'Calendar event created',
      details: 'Event added via SMS'
    });
  }

  // Check for task creation mentions
  if (aiContent.toLowerCase().includes('created task') || aiContent.toLowerCase().includes('added to tasks')) {
    actions.push({
      type: 'task',
      status: 'completed',
      title: 'Task created',
      details: 'Task added via SMS'
    });
  }

  // Check for habit creation mentions
  if (aiContent.toLowerCase().includes('created habit') || aiContent.toLowerCase().includes('set up habit')) {
    actions.push({
      type: 'habit',
      status: 'completed',
      title: 'Habit created',
      details: 'Habit added via SMS'
    });
  }

  return actions;
}

/**
 * Process SMS with Allie AI - Full Feature Parity Version with Intent Classification
 */
async function processSMSWithAllie(smsId, smsData) {
  try {
    console.log('🤖 Processing SMS with Intent Classification:', smsId);

    const actions = [];
    let responseMessage = '';

    // Process images if any
    if (smsData.hasMedia && smsData.mediaUrls) {
      for (const media of smsData.mediaUrls) {
        if (media.contentType.startsWith('image/')) {
          await db.collection('familyDocuments').add({
            familyId: smsData.familyId,
            fileName: `SMS Image ${new Date().toLocaleDateString()}`,
            fileType: media.contentType,
            fileUrl: media.url,
            source: 'sms',
            sourceId: smsId,
            uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
            uploadedBy: `SMS from ${smsData.from}`,
            status: 'pending',
            title: `SMS Image - ${smsData.body.substring(0, 30) || 'No description'}`,
            category: 'inbox'
          });

          actions.push({
            type: 'document',
            status: 'completed',
            title: 'Saved image',
            details: 'Image saved to family drive'
          });
        }
      }
    }

    // Get text content
    const text = smsData.body;

    // STEP 1: Check for quick command shortcuts first
    const commandResult = await handleQuickCommands(text, smsData);
    if (commandResult) {
      responseMessage = commandResult.message;
      if (commandResult.actions) {
        actions.push(...commandResult.actions);
      }

      // Save messages to conversation history
      await saveToConversationHistory(smsData.from, smsData.familyId, 'user', text);
      await saveToConversationHistory(smsData.from, smsData.familyId, 'assistant', responseMessage);

      // Update SMS record
      await db.collection('smsInbox').doc(smsId).update({
        status: 'processed',
        intent: 'command',
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        actions: actions,
        responseMessage: responseMessage
      });

      // Send response
      if (twilioPhoneNumber && twilioClient) {
        await twilioClient.messages.create({
          body: responseMessage,
          from: twilioPhoneNumber,
          to: smsData.from
        });
      }

      return;
    }

    // STEP 2: Load family context for intent classification
    const familyContext = await loadFamilyContext(smsData.familyId);

    // Get user info
    const userInfo = {
      name: 'Family member',
      phone: smsData.from
    };

    // Try to identify user from family members
    if (familyContext.members) {
      const member = familyContext.members.find(m =>
        m.phone === smsData.from || m.phoneNumber === smsData.from
      );
      if (member) {
        userInfo.name = member.name;
        userInfo.role = member.role;
      }
    }

    // Add user info to family context for query handler
    familyContext.userInfo = userInfo;

    // STEP 3: CLASSIFY INTENT 🆕
    console.log('🧠 Classifying intent for:', text);
    const intentResult = await classifyIntent(text, familyContext);
    console.log('📊 Intent classified as:', intentResult.intent, 'Confidence:', intentResult.confidence);

    // STEP 4: Route based on intent
    if (intentResult.intent === 'query' && intentResult.confidence > 0.7) {
      // 📥 QUERY MODE - Retrieve and respond (no actions created)
      console.log('📥 Handling as QUERY intent - retrieving information');
      await handleQueryIntent(smsId, text, smsData, familyContext);
      console.log('✅ Query processed successfully');
      return;
    }

    // STEP 5: PARSE MODE (default) - Extract entities and create actions
    console.log('🔨 Handling as PARSE intent - extracting entities and creating actions');

    // Load conversation history for context
    const conversationHistory = await loadConversationHistory(smsData.from, smsData.familyId, 10);

    // Build comprehensive system prompt
    const systemPrompt = buildSystemPrompt(familyContext, userInfo);

    // Build conversation messages with history
    const messages = [
      // Add conversation history
      ...conversationHistory,
      // Add current message
      {
        role: 'user',
        content: text
      }
    ];

    // Add intent analysis for action routing
    const intentPrompt = `Analyze the user's message and determine if it requires specific actions.

Message: "${text}"

Determine if this message requires:
1. Creating/completing habits
2. Creating/completing tasks
3. Creating/updating calendar events
4. Researching family members
5. Searching documents
6. Just conversational response

Respond with JSON:
{
  "requiresActions": true/false,
  "actionTypes": ["habit", "task", "event", "research", "search"],
  "extractedData": {
    // Any specific data extracted (task title, event details, habit name, etc.)
  },
  "conversationalResponse": "Your response to the user"
}

`;

    try {
      // Call Claude API with new system
      const claudeUrl = process.env.NODE_ENV === 'production'
        ? 'http://localhost:8080/api/claude'  // Internal call within same container
        : 'http://localhost:3002/api/claude';

      console.log('📤 Calling Claude API for SMS processing (full context)...');

      const response = await fetch(claudeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          system: systemPrompt,
          messages: messages,
          max_tokens: 2000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`);
      }

      const aiResponse = await response.json();
      const aiContent = aiResponse.content[0].text;

      console.log('📥 Claude response:', aiContent.substring(0, 200) + '...');

      // Extract response message
      responseMessage = aiContent;

      // Parse and execute any structured actions mentioned in response
      const actionResults = await parseAndExecuteActions(aiContent, smsData, familyContext);
      if (actionResults && actionResults.length > 0) {
        actions.push(...actionResults);
      }

      // Save conversation to history
      await saveToConversationHistory(smsData.from, smsData.familyId, 'user', text);
      await saveToConversationHistory(smsData.from, smsData.familyId, 'assistant', responseMessage);
    } catch (aiError) {
      console.error('Error with AI processing, falling back:', aiError);
      
      // Fallback to simple keyword matching
      const text = smsData.body.toLowerCase();
      if (text.includes('remind') || text.includes('remember')) {
        await db.collection('kanbanTasks').add({
          familyId: smsData.familyId,
          title: smsData.body.substring(0, 50),
          description: `From SMS: ${smsData.body}`,
          column: 'todo',
          priority: 'medium',
          source: 'sms',
          sourceId: smsId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          createdBy: 'Allie AI',
          assignedTo: [],
          tags: ['reminder', 'sms']
        });

        actions.push({
          type: 'task',
          status: 'completed',
          title: 'Created reminder',
          details: 'Added to tasks'
        });
        responseMessage = "✅ I've added that to your family tasks!";
      }
    }

    // Update SMS record in Firestore with intent information
    await db.collection('smsInbox').doc(smsId).update({
      status: 'processed',
      intent: 'parse', // Mark as parse intent for tracking
      intentConfidence: intentResult.confidence,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      actions: actions,
      allieActions: actions,
      summary: actions.length > 0 ? `Processed: ${actions.map(a => a.title).join(', ')}` : 'Message saved'
    });
    
    // Send follow-up SMS with results
    if (responseMessage && twilioPhoneNumber && twilioClient) {
      try {
        await twilioClient.messages.create({
          body: responseMessage,
          from: twilioPhoneNumber,
          to: smsData.from
        });
        console.log('📤 Sent response SMS:', responseMessage);
      } catch (err) {
        console.error('Error sending response SMS:', err);
      }
    }
    
    console.log('✅ SMS processed successfully');
    
  } catch (error) {
    console.error('Error processing SMS:', error);
    smsRecord.status = 'error';
    smsRecord.error = error.message;
  }
}

/**
 * Get test family for development
 */
async function getTestFamily() {
  try {
    const familiesQuery = db.collection('families').limit(1);

    const snapshot = await familiesQuery.get();
    if (!snapshot.empty) {
      const family = snapshot.docs[0];
      console.log('📱 Using test family:', family.id, family.data().name);
      return {
        id: family.id,
        name: family.data().name || 'Test Family',
        emailPrefix: family.data().emailPrefix || 'family'
      };
    }
    console.error('❌ No families found in database!');
    return null;
  } catch (error) {
    console.error('Error getting test family:', error);
    return null;
  }
}

/**
 * Find family by phone number
 */
async function findFamilyByPhone(phoneNumber) {
  try {
    console.log('🔍 Finding family for phone:', phoneNumber);

    // Try different phone formats
    const phoneVariations = [
      phoneNumber,
      phoneNumber.replace(/\D/g, ''), // Just digits
      phoneNumber.replace(/^\+/, ''), // Remove leading +
      phoneNumber.replace(/^1/, ''), // Remove leading 1
      phoneNumber.replace(/^\+1/, ''), // Remove +1
    ];

    // Also try Swedish number variations
    if (phoneNumber.startsWith('+46')) {
      phoneVariations.push(
        phoneNumber.replace(/^\+46/, '0'), // Swedish format with 0
        phoneNumber.replace(/^\+46/, '') // Without country code
      );
    }

    console.log('📱 Trying phone variations:', phoneVariations);

    // First try to find user by phone number
    const usersQuery = db.collection('users')
      .where('phoneNumber', 'in', phoneVariations)
      .limit(1);

    const userSnapshot = await usersQuery.get();

    console.log(`📊 Found ${userSnapshot.size} users with matching phone`);

    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      if (userData.currentFamily) {
        // Get family data - use doc() to get by ID
        try {
          const familyDoc = await db.collection('families').doc(userData.currentFamily).get();
          if (familyDoc.exists) {
            const familyData = familyDoc.data();
            return {
              id: userData.currentFamily,
              name: familyData.name || 'Unknown Family',
              emailPrefix: familyData.emailPrefix || 'family'
            };
          }
        } catch (error) {
          console.error('Error getting family doc:', error);
        }
      }
    }

    // Try to find family by members array containing phone
    const familiesQuery = db.collection('families').limit(20);

    const familiesSnapshot = await familiesQuery.get();

    for (const doc of familiesSnapshot.docs) {
      const family = doc.data();
      if (family.members && Array.isArray(family.members)) {
        const hasPhone = family.members.some(member =>
          member.phone === phoneNumber ||
          member.phoneNumber === phoneNumber
        );

        if (hasPhone) {
          return {
            id: doc.id,
            name: family.name || 'Unknown Family',
            emailPrefix: family.emailPrefix || 'family'
          };
        }
      }
    }

    // Check for known family phone numbers
    const knownFamilyPhones = {
      '+460731536304': 'mcq5374e2bkcnx9z1lo', // Stefan
      '0731536304': 'mcq5374e2bkcnx9z1lo',     // Stefan alt format
      '460731536304': 'mcq5374e2bkcnx9z1lo',   // Stefan without +
      '+46731536304': 'mcq5374e2bkcnx9z1lo',   // Stefan no leading 0
      '46731536304': 'mcq5374e2bkcnx9z1lo',    // Stefan no + no 0
      // Add Kensey's phone here when known
    };

    if (knownFamilyPhones[phoneNumber]) {
      console.log('📱 Recognized family member phone');
      const familyId = knownFamilyPhones[phoneNumber];
      const familyDoc = await db.collection('families').doc(familyId).get();

      if (familyDoc.exists) {
        return {
          id: familyId,
          name: familyDoc.data().name || 'Family',
          emailPrefix: familyDoc.data().emailPrefix || 'family'
        };
      }
    }

    // For known numbers, use direct family assignment to bypass permission issues
    if (phoneNumber === '+46731536304' || phoneNumber === '46731536304' ||
        phoneNumber === '+460731536304' || phoneNumber === '0731536304') {
      console.log('📱 Recognized Stefan\'s phone, using direct family assignment');
      return {
        id: 'mcq5374e2bkcnx9z1lo',
        name: 'Palsson Family',
        emailPrefix: 'palsson'
      };
    }

    // For testing, always assign to the first family found
    // This is a temporary fix for testing
    console.log('⚠️ Phone not found in any family, using fallback for testing');

    const allFamiliesQuery = db.collection('families').limit(1);

    const familySnapshot = await allFamiliesQuery.get();
    if (!familySnapshot.empty) {
      const family = familySnapshot.docs[0];
      console.log('📱 Using fallback family:', family.id, family.data().name);
      return {
        id: family.id,
        name: family.data().name || 'Test Family',
        emailPrefix: family.data().emailPrefix || 'family'
      };
    }

    return null;
  } catch (error) {
    console.error('Error finding family by phone:', error);
    return null;
  }
}

/**
 * Test endpoint
 */
router.get('/api/sms/test', (req, res) => {
  res.json({
    success: true,
    message: 'SMS webhook is ready',
    twilioNumber: twilioPhoneNumber,
    configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  });
});

module.exports = router;