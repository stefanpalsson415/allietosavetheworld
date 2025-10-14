// SMS AI Processing Service
import ClaudeService from './ClaudeService';
import { db } from './firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

class SMSAIProcessor {
  static async processSMS(smsId, content, from, familyMembers = []) {
    try {
      console.log('🤖 Processing SMS with AI:', smsId);
      
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentDay = currentDate.getDate();
      
      // Get family member names for the prompt
      const familyMemberNames = familyMembers.map(m => m.name).join(', ');
      
      const prompt = `You are Allie, the world's best family assistant. Analyze this SMS message and create ALL necessary interconnected actions. Think comprehensively - every message should generate contacts, tasks, and events as appropriate.

Today's date: ${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}
SMS from: ${from}
${content}

FAMILY MEMBERS (DO NOT create contacts for these people): ${familyMemberNames || 'Not specified'}

CRITICAL INSTRUCTIONS:
1. Extract EVERY actionable item from the message
2. Create contacts ONLY for external people (coaches, teachers, doctors, etc.) - NOT for family members listed above
3. Create tasks for any preparations or things to buy/do
4. Create calendar events for any appointments or scheduled activities
5. Link everything together - contacts should be linked to events, tasks should reference the event they're for
6. IMPORTANT: If a person mentioned is in the family members list above, DO NOT create a contact for them

Example: "Tennis lesson with Coach Felix next Wednesday at 5pm at MIK, need to get a new tennis racket"
Should create:
- Contact: Coach Felix (tennis coach) 
- Task: Buy tennis racket (assigned to parents, due before lesson)
- Event: Tennis lesson (with Coach Felix linked, at MIK location)

For the action title, describe what to do (e.g., "Add Coach Felix as contact")
For times like "2:30pm", convert to 24-hour format (14:30)
If day of week is mentioned (like "Wednesday"), calculate the actual date

Return a JSON object with this structure:
{
  "summary": "Brief summary of the message",
  "category": "task|event|reminder|information|other",
  "tags": ["relevant", "tags"],
  "suggestedActions": [
    {
      "type": "contact",
      "title": "Add [Person Name] as contact",
      "description": "[Role/relationship]",
      "status": "pending",
      "priority": "medium",
      "data": {
        "name": "Person Name",
        "title": "Their role/title",
        "type": "sports|medical|school|business|personal",
        "category": "appropriate category",
        "specialty": "Their specialty if applicable",
        "notes": "Context about this person",
        "forPerson": ["Which family member they're associated with"]
      }
    },
    {
      "type": "task",
      "title": "Specific task description",
      "description": "Task details and context",
      "status": "pending",
      "priority": "high|medium|low",
      "data": {
        "title": "Task title",
        "description": "Detailed task description",
        "assignedTo": ["Mama", "Papa", "or family member names"],
        "dueDate": "${currentYear}-MM-DDTHH:mm:ss.000Z",
        "priority": "high|medium|low",
        "relatedTo": "Person this task is for",
        "source": "SMS",
        "relatedEvent": "Title of related event if applicable"
      }
    },
    {
      "type": "calendar",
      "title": "Event title",
      "description": "Event description",
      "status": "pending",
      "priority": "high",
      "data": {
        "title": "Event title",
        "description": "Event details",
        "startDate": "${currentYear}-MM-DDTHH:mm:ss.000Z",
        "endDate": "${currentYear}-MM-DDTHH:mm:ss.000Z",
        "location": "Location name",
        "attendees": ["List of family member names attending"],
        "relatedContacts": ["Names of external people involved"]
      }
    }
  ],
  "contacts": [
    {
      "name": "Person Name",
      "title": "Role/Title",
      "type": "medical|school|sports|business|personal",
      "notes": "Context about this person"
    }
  ],
  "extractedInfo": {
    "dates": ["${currentYear}-MM-DD"],
    "people": ["names mentioned"],
    "locations": ["places mentioned"],
    "actionItems": ["things to do"]
  }
}`;

      // Call Claude API
      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { temperature: 0.3 }
      );

      // Parse Claude's response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      
      console.log('🤖 AI Analysis complete:', {
        summary: analysis.summary,
        category: analysis.category,
        suggestedActionsCount: analysis.suggestedActions?.length || 0
      });

      // Update the SMS document with AI analysis
      await updateDoc(doc(db, 'smsInbox', smsId), {
        aiAnalysis: analysis,
        summary: analysis.summary,
        category: analysis.category,
        tags: analysis.tags || [],
        contacts: analysis.contacts || [],
        suggestedActions: analysis.suggestedActions || [],
        extractedInfo: analysis.extractedInfo,
        processedAt: serverTimestamp(),
        status: 'processed'
      });
      
      console.log('✅ SMS AI processing complete:', smsId);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Error processing SMS with AI:', error);
      // Update status to indicate processing failed
      try {
        await updateDoc(doc(db, 'smsInbox', smsId), {
          status: 'error',
          error: error.message,
          processedAt: serverTimestamp()
        });
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
      throw error;
    }
  }
}

export default SMSAIProcessor;