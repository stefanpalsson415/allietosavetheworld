const axios = require('axios');
const admin = require('./firebase-admin-minimal');
const ClaudeService = require('./claude-service');

/**
 * Process image from Twilio MMS with Allie
 */
async function processImageWithAllie(messageData) {
  try {
    const { mediaUrl, body, userId, familyId } = messageData;
    
    // Download image from Twilio
    const imageResponse = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN
      }
    });
    
    // Convert to base64
    const base64Image = Buffer.from(imageResponse.data).toString('base64');
    const mimeType = imageResponse.headers['content-type'];
    
    // Create prompt for Claude
    const prompt = `You are Allie, an AI family assistant. A parent just sent you this image via SMS${body ? ` with the message: "${body}"` : ''}.

Please analyze this image and:
1. Identify what type of content it is (schedule, flyer, handwritten note, etc.)
2. Extract any important information (dates, times, events, tasks)
3. Suggest what actions to take (add to calendar, create reminders, etc.)
4. Format any events in a structured way

Be helpful and conversational in your response.`;

    // Send to Claude for analysis
    const claudeResponse = await ClaudeService.processImageWithPrompt(
      base64Image,
      mimeType,
      prompt
    );
    
    // Parse Claude's response for calendar events
    const events = extractEventsFromResponse(claudeResponse);
    
    // Store analysis results
    await admin.firestore().collection('processedImages').add({
      userId,
      familyId,
      originalMessageId: messageData.id,
      imageUrl: mediaUrl,
      userMessage: body || '',
      allieAnalysis: claudeResponse,
      extractedEvents: events,
      processedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create calendar events if any were found
    for (const event of events) {
      await admin.firestore().collection('events').add({
        ...event,
        familyId,
        createdBy: userId,
        source: 'sms-image',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    return {
      success: true,
      response: claudeResponse,
      eventsCreated: events.length
    };
  } catch (error) {
    console.error('Error processing image with Allie:', error);
    throw error;
  }
}

/**
 * Extract calendar events from Claude's response
 */
function extractEventsFromResponse(response) {
  const events = [];
  
  // Look for event patterns in the response
  // This is a simple example - you'd want more sophisticated parsing
  const eventRegex = /Event:\s*(.+?)\nDate:\s*(.+?)\nTime:\s*(.+?)(?:\n|$)/gi;
  let match;
  
  while ((match = eventRegex.exec(response)) !== null) {
    events.push({
      title: match[1].trim(),
      date: match[2].trim(),
      time: match[3].trim(),
      description: `Extracted from SMS image`,
      isAIGenerated: true
    });
  }
  
  // Also look for structured JSON if Claude returns it
  try {
    const jsonMatch = response.match(/```json\n([\s\S]+?)\n```/);
    if (jsonMatch) {
      const parsedEvents = JSON.parse(jsonMatch[1]);
      if (Array.isArray(parsedEvents)) {
        events.push(...parsedEvents);
      }
    }
  } catch (e) {
    // Not JSON, that's okay
  }
  
  return events;
}

/**
 * Example responses for different image types
 */
const imageTypeResponses = {
  schedule: `I can see this is a schedule! Let me extract the important dates and times for you...`,
  
  flyer: `This looks like an event flyer. Here's what I found...`,
  
  handwritten: `I can see some handwritten notes. Let me help you organize this information...`,
  
  receipt: `This appears to be a receipt. Would you like me to track this expense?`,
  
  screenshot: `I see you've shared a screenshot. Let me analyze what's shown...`
};

module.exports = {
  processImageWithAllie,
  extractEventsFromResponse
};