// Ultra simple SMS webhook using client SDK with AI processing
const express = require('express');
const router = express.Router();
const twilio = require('twilio');
const axios = require('axios');
const { initializeApp, getApps, getApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc } = require('firebase/firestore');

// Firebase config (same as frontend)
const firebaseConfig = {
  apiKey: "AIzaSyBKSJY4EaY8BQwRgrMnsBhtfWC_4kttHMw",
  authDomain: "parentload-ba995.firebaseapp.com",
  projectId: "parentload-ba995",
  storageBucket: "parentload-ba995.appspot.com",
  messagingSenderId: "810507329293",
  appId: "1:810507329293:web:df9e06f8a2b732c88d2501"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Your family ID
const YOUR_FAMILY_ID = 'm93tlovs6ty9sg8k0c8';

// Claude proxy endpoint
const CLAUDE_PROXY_URL = 'https://europe-west1-parentload-ba995.cloudfunctions.net/claude';

router.post('/api/sms/inbound', async (req, res) => {
  try {
    console.log('📱 Ultra-simple SMS webhook called');
    
    const { From, To, Body, MessageSid, NumMedia } = req.body;
    
    console.log('From:', From);
    console.log('Body:', Body);
    
    // Create SMS record - minimal data
    const smsData = {
      familyId: YOUR_FAMILY_ID,
      from: From,
      phoneNumber: From,
      to: To,
      content: Body || '',
      body: Body || '',
      messageId: MessageSid,
      status: 'pending',
      source: 'sms',
      type: 'sms',
      receivedAt: new Date(),
      createdAt: serverTimestamp()
    };
    
    // Save to Firestore using client SDK
    try {
      const docRef = await addDoc(collection(db, 'smsInbox'), smsData);
      console.log('✅ SMS saved with ID:', docRef.id);
      
      // Don't process with AI here - let the frontend handle it on click
      // This prevents double processing and ensures the UI has control
      
      // Send success response
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Message received! Click to view in your inbox.");
      res.type('text/xml').send(twiml.toString());
      
    } catch (saveError) {
      console.error('Save error:', saveError);
      // Even if save fails, send a response to Twilio
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message("Message received!");
      res.type('text/xml').send(twiml.toString());
    }
    
  } catch (error) {
    console.error('❌ Error in ultra-simple webhook:', error);
    
    // Always send a response to Twilio
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message("Message received!");
    res.type('text/xml').send(twiml.toString());
  }
});

// Test endpoint
router.get('/api/sms/test', (req, res) => {
  res.json({
    success: true,
    message: 'Ultra-simple SMS webhook ready',
    familyId: YOUR_FAMILY_ID
  });
});

// Process SMS with AI using the same prompt structure as frontend
async function processWithAI(docId, content, from) {
  try {
    console.log('🤖 Processing SMS with AI:', docId);
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();
    
    const prompt = `Analyze this sms and extract actionable information. Today's date is ${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}.

SMS from: ${from}
${content}

You must extract ALL actionable items from this content. Pay close attention to:
1. Events/appointments with specific times and dates (convert relative dates like "Wednesday" to actual dates)
2. Tasks like bringing items, preparing things, or submitting forms
3. People's names mentioned (doctors, teachers, coaches, etc.)
4. Specific locations mentioned
5. Important tags that categorize the content
6. For documents: medical records, school forms, receipts, legal documents, etc.

IMPORTANT RULES:
- For the action title, describe what to do (e.g., "Add field trip to calendar", "Submit permission slip")
- For event titles, be descriptive and include the person involved (e.g., "[Child's Name] Field Trip to Science Museum")
- Use ${currentYear} for all dates, never ${currentYear - 1}
- For times like "2:30pm", convert to 24-hour format (14:30)
- If day of week is mentioned (like "Friday"), calculate the actual date

Return a JSON object with this structure:
{
  "summary": "Brief summary of the content",
  "category": "medical|school|sports|financial|event|legal|general|task|reminder",
  "documentType": "form|receipt|medical-record|report-card|permission-slip|contract|other",
  "tags": ["relevant", "category", "tags"],
  "suggestedActions": [
    {
      "type": "calendar|task|contact|save|file",
      "title": "Action title describing what to do",
      "description": "Detailed action description",
      "status": "pending",
      "priority": "high|medium|low",
      "data": {
        "title": "Event/task title",
        "startDate": "${currentYear}-MM-DDTHH:mm:ss.000Z",
        "endDate": "${currentYear}-MM-DDTHH:mm:ss.000Z",
        "location": "Location if mentioned",
        "description": "Details",
        "attendees": ["person names if mentioned"],
        "dueDate": "${currentYear}-MM-DD",
        "category": "category"
      }
    }
  ],
  "contacts": [
    {
      "name": "Person Name",
      "title": "Role/Title",
      "type": "medical|school|sports|business|personal",
      "notes": "Context about this person",
      "phone": "phone if mentioned",
      "email": "email if mentioned"
    }
  ],
  "extractedInfo": {
    "dates": ["${currentYear}-MM-DD"],
    "people": ["names mentioned"],
    "locations": ["places mentioned"],
    "actionItems": ["things to do"],
    "amounts": ["$XX.XX"],
    "documentDetails": {
      "issuer": "who issued the document",
      "documentDate": "${currentYear}-MM-DD",
      "expirationDate": "${currentYear}-MM-DD"
    }
  }
}`;

    // Call Claude API
    const response = await axios.post(CLAUDE_PROXY_URL, {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Parse Claude's response
    const claudeContent = response.data.content[0].text;
    const jsonMatch = claudeContent.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    
    // Ensure all arrays exist and actions have proper structure
    analysis.suggestedActions = (analysis.suggestedActions || []).map(action => ({
      ...action,
      status: action.status || 'pending',
      priority: action.priority || 'medium'
    }));
    analysis.contacts = analysis.contacts || [];
    analysis.tags = analysis.tags || [];
    
    console.log('🤖 AI Analysis complete:', {
      summary: analysis.summary,
      category: analysis.category,
      suggestedActionsCount: analysis.suggestedActions?.length || 0
    });

    // Update the SMS document with AI analysis
    await updateDoc(doc(db, 'smsInbox', docId), {
      aiAnalysis: analysis,
      summary: analysis.summary,
      category: analysis.category,
      tags: analysis.tags || [],
      contacts: analysis.contacts || [],
      suggestedActions: analysis.suggestedActions || [],
      extractedInfo: analysis.extractedInfo,
      processedAt: serverTimestamp(),
      status: 'processed',
      reviewed: true
    });
    
    console.log('✅ SMS AI processing complete:', docId);
    
  } catch (error) {
    console.error('❌ Error processing SMS with AI:', error);
    // Update status to indicate processing failed
    try {
      await updateDoc(doc(db, 'smsInbox', docId), {
        status: 'error',
        processingError: error.message,
        processedAt: serverTimestamp()
      });
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }
  }
}

module.exports = router;