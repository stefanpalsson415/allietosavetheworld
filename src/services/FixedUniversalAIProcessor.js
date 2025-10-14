// Fixed Universal AI Processing Service with better JSON handling
import ClaudeService from './ClaudeService';
import { db } from './firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import FamilyKnowledgeGraph from './FamilyKnowledgeGraph';

class FixedUniversalAIProcessor {
  static async processInboxItem(itemId, item, familyMembers = []) {
    try {
      console.log('🤖 Processing inbox item with AI:', itemId, 'Type:', item.source);

      // Check if ClaudeService is available
      if (!ClaudeService || typeof ClaudeService.generateResponse !== 'function') {
        console.error('ClaudeService not available or generateResponse not a function');
        return {
          summary: 'AI service temporarily unavailable',
          category: 'general',
          suggestedActions: [],
          contacts: [],
          tags: [],
          extractedInfo: {},
          error: 'AI service not available'
        };
      }
      
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentDay = currentDate.getDate();
      
      // Get family member names for context
      const familyMemberNames = familyMembers.map(m => 
        m.displayName || m.name || m.email?.split('@')[0] || ''
      ).filter(n => n);
      
      // Create a map of names to family member info for easier lookup
      const familyMemberMap = {};
      familyMembers.forEach(member => {
        const name = (member.displayName || member.name || '').toLowerCase();
        if (name) {
          familyMemberMap[name] = member;
          // Also map first name only
          const firstName = name.split(' ')[0];
          if (firstName) {
            familyMemberMap[firstName] = member;
          }
        }
      });
      
      let content = '';
      let contextInfo = '';

      // Build content based on source type
      if (item.source === 'email') {
        const emailContent = typeof item.content === 'object' ? item.content.text : item.content;
        content = emailContent || '';

        // Truncate extremely long emails to prevent token limit errors
        // Keep first 5000 chars and last 1000 chars to preserve context
        if (content.length > 10000) {
          console.log(`📄 Truncating long email content from ${content.length} to 6000 chars`);
          const firstPart = content.substring(0, 5000);
          const lastPart = content.substring(content.length - 1000);
          content = firstPart + '\n\n[... content truncated for processing ...]\n\n' + lastPart;
        }

        contextInfo = `Email from: ${item.from}\nSubject: ${item.subject}\n\n`;
      } else if (item.source === 'sms' || item.source === 'mms') {
        content = item.content || item.body || '';

        // Also truncate SMS if extremely long
        if (content.length > 5000) {
          content = content.substring(0, 5000) + '\n\n[... truncated ...]';
        }

        contextInfo = `SMS from: ${item.from}\n`;
      } else if (item.source === 'upload') {
        content = item.extractedText || item.ocrText || item.content || '';

        // Truncate document content if too long
        if (content.length > 10000) {
          console.log(`📄 Truncating document content from ${content.length} to 6000 chars`);
          const firstPart = content.substring(0, 5000);
          const lastPart = content.substring(content.length - 1000);
          content = firstPart + '\n\n[... document content truncated for processing ...]\n\n' + lastPart;
        }

        contextInfo = `Document: ${item.fileName || item.title}\nType: ${item.fileType}\n\n`;

        if ((item.fileType?.startsWith('image/') || item.fileName?.match(/\.(jpg|jpeg|png|gif)$/i)) && !content) {
          content = `[Image document: ${item.fileName}. Please analyze the visual content when processing.]`;
        }
      }

      const fullContent = contextInfo + content;
      
      // Split processing into smaller chunks to ensure complete responses
      console.log('📝 Getting summary...');
      let summary = 'Email received';

      try {
        const summaryPrompt = `Summarize this ${item.source} in one short sentence:
${fullContent}`;

        const summaryResponse = await ClaudeService.generateResponse(
          [{ role: 'user', content: summaryPrompt }],
          { temperature: 0.3, max_tokens: 100 }
        );

        summary = summaryResponse.trim() || 'Email received';
      } catch (summaryError) {
        console.error('Error getting summary:', summaryError);
        summary = `${item.source === 'email' ? 'Email' : item.source} from ${item.from || 'unknown'}`;
      }
      
      // Get category
      console.log('🏷️ Getting category...');
      let category = 'general';

      try {
        const categoryPrompt = `Categorize this content. Choose ONE: event, medical, school, general
${fullContent}
Reply with just the category word.`;

        const categoryResponse = await ClaudeService.generateResponse(
          [{ role: 'user', content: categoryPrompt }],
          { temperature: 0.3, max_tokens: 10 }
        );

        category = categoryResponse.trim().toLowerCase() || 'general';
      } catch (categoryError) {
        console.error('Error getting category:', categoryError);
        category = 'general';
      }
      
      // Extract actions - treat all SMS/email the same
      console.log('🎯 Extracting actions...');
      const suggestedActions = [];

      {
        try {
          const actionsPrompt = `List up to 3 actions for this ${item.source}. Today is ${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}.

${fullContent}

For each action, provide:
- Type: calendar, task, or contact
- Title: short description
- Details: INCLUDE ALL dates, times, and locations mentioned

If it's a birthday party, include "Buy present" as a task.
If it's an appointment, include "Prepare questions" as a task.

Format each action on a new line like:
TYPE: TITLE | DETAILS (include full date, time, location)`;

          const actionsResponse = await ClaudeService.generateResponse(
            [{ role: 'user', content: actionsPrompt }],
            { temperature: 0.3, max_tokens: 500 }
          );

          // Parse actions
          const actionLines = actionsResponse.split('\n').filter(line => line.trim());
      
      for (const line of actionLines) {
        const match = line.match(/^(calendar|task|contact):\s*(.+?)\s*\|\s*(.*)$/i);
        if (match) {
          const [, type, title, details] = match;
          
          const action = {
            type: type.toLowerCase(),
            title: title.trim(),
            description: details.trim() || title.trim(),
            status: 'pending',
            priority: type.toLowerCase() === 'calendar' ? 'high' : 'medium',
            isProactive: false,
            requiresClarification: [],
            data: {
              title: title.trim(),
              description: details.trim()
            }
          };
          
          // For calendar events, try to identify who it's for
          if (type.toLowerCase() === 'calendar') {
            // Check title and description for family member names
            const textToCheck = `${title} ${details}`.toLowerCase();
            const mentionedMembers = [];
            
            Object.keys(familyMemberMap).forEach(nameKey => {
              if (textToCheck.includes(nameKey)) {
                const member = familyMemberMap[nameKey];
                if (!mentionedMembers.find(m => m.id === member.id)) {
                  mentionedMembers.push(member);
                }
              }
            });
            
            // Store who the event is about
            if (mentionedMembers.length > 0) {
              action.data.attendeeIds = mentionedMembers.map(m => m.id);
              action.data.attendeeNames = mentionedMembers.map(m => m.displayName || m.name);
              console.log(`Event is about: ${action.data.attendeeNames.join(', ')}`);
            }
          }
          
          // Handle contact extraction
          if (type.toLowerCase() === 'contact') {
            // Extract phone number
            const phoneMatch = details.match(/(\+?\d{1,3}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4})/);
            if (phoneMatch) {
              action.data.phone = phoneMatch[1];
            }
            
            // Extract email
            const emailMatch = details.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
            if (emailMatch) {
              action.data.email = emailMatch[1];
            }
            
            // Extract specialty/role
            const specialtyMatch = details.match(/(?:doctor|dentist|teacher|babysitter|therapist|nurse|coach|tutor)/i);
            if (specialtyMatch) {
              action.data.specialty = specialtyMatch[0];
              action.data.type = 'medical'; // Default, will be refined based on specialty
              
              if (/teacher|coach|tutor/i.test(specialtyMatch[0])) {
                action.data.type = 'education';
              } else if (/babysitter/i.test(specialtyMatch[0])) {
                action.data.type = 'childcare';
              }
            }
            
            // Extract business name
            const businessMatch = details.match(/(?:at|from|with)\s+([A-Z][A-Za-z\s&'-]+?)(?:\s+(?:clinic|hospital|school|office|center))?/i);
            if (businessMatch) {
              action.data.businessName = businessMatch[1].trim();
            }
          }
          
          // Parse dates from details
          if (type.toLowerCase() === 'calendar') {
            let foundDate = false;
            let parsedDay = null;
            let parsedMonth = null;
            
            // First check for ISO date format (YYYY-MM-DD)
            const isoDateMatch = details.match(/(\d{4})-(\d{2})-(\d{2})/);
            if (isoDateMatch) {
              const [, year, month, day] = isoDateMatch;
              action.data.startDate = `${year}-${month}-${day}`;
              foundDate = true;
              console.log(`Found ISO date: ${action.data.startDate}`);
            } else {
              // Look for explicit dates with month names
              const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
              
              // Check for month names with days
              for (let i = 0; i < monthNames.length; i++) {
                const monthPattern = new RegExp(`${monthNames[i]}\\s+(\\d{1,2})|(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${monthNames[i]}`, 'i');
                const match = details.match(monthPattern);
                if (match) {
                  parsedDay = match[1] || match[2];
                  parsedMonth = i + 1;
                  foundDate = true;
                  console.log(`Found explicit date: ${monthNames[i]} ${parsedDay}`);
                  break;
                }
              }
            }
            
            // If no explicit date found, check for relative dates
            if (!foundDate) {
              const twoWeeksMatch = details.match(/in\s+two\s+weeks/i) || title.match(/in\s+two\s+weeks/i);
              if (twoWeeksMatch) {
                // Calculate date for "in two weeks"
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 14);
                parsedDay = futureDate.getDate();
                parsedMonth = futureDate.getMonth() + 1;
                foundDate = true;
                console.log('Using relative date: in two weeks');
              }
            }
            
            // Only process parsed day/month if we didn't already find an ISO date
            if (!action.data.startDate && foundDate && parsedDay && parsedMonth) {
              // For future dates, use the correct year
              let eventYear = currentYear;
              
              // If the parsed month is before the current month, assume next year
              if (parsedMonth < currentMonth || (parsedMonth === currentMonth && parsedDay < currentDay)) {
                eventYear = currentYear + 1;
              }
              
              action.data.startDate = `${eventYear}-${parsedMonth.toString().padStart(2, '0')}-${parsedDay.toString().padStart(2, '0')}`;
            } else if (!action.data.startDate) {
              action.data.startDate = 'NEEDS_DATE_CLARIFICATION';
              action.requiresClarification = ['date'];
            }
            
            // Extract time if present (e.g., "4pm", "4:00pm", "16:00")
            const timeMatch = details.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)|(\d{1,2}):(\d{2})/i);
            if (timeMatch) {
              let hour = parseInt(timeMatch[1] || timeMatch[4]);
              const minute = parseInt(timeMatch[2] || timeMatch[5] || '0');
              const ampm = timeMatch[3];
              
              if (ampm && ampm.toLowerCase() === 'pm' && hour < 12) {
                hour += 12;
              } else if (ampm && ampm.toLowerCase() === 'am' && hour === 12) {
                hour = 0;
              }
              
              action.data.time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
              
              // Update startDate to include time
              if (action.data.startDate && !action.data.startDate.includes('NEEDS')) {
                // Parse the date parts
                const [year, month, day] = action.data.startDate.split('-').map(n => parseInt(n));
                
                // Create an ISO string with the time but maintain local time
                // Format: YYYY-MM-DDTHH:MM:SS
                const dateTimeStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
                
                // Store as ISO string with explicit date/time
                action.data.startDate = dateTimeStr;
                action.data.date = dateTimeStr; // Also set date field
              }
            } else {
              // No time specified, default to 8:00 AM
              if (action.data.startDate && !action.data.startDate.includes('NEEDS')) {
                action.data.startDate = `${action.data.startDate}T08:00:00`;
                action.data.date = action.data.startDate;
              }
            }
            
            // Extract location if present
            const locationMatch = details.match(/at\s+(?:the\s+)?(.+?)(?:\s*,|\s*$)/i);
            if (locationMatch) {
              action.data.location = locationMatch[1].trim();
            }
          }
          
          suggestedActions.push(action);
        }
      }
        } catch (actionsError) {
          console.error('Error extracting actions:', actionsError);
          // Continue with empty actions array
        }
      }

      // Extract contacts
      console.log('👥 Extracting contacts...');
      const contacts = [];

      try {
        const contactsPrompt = `List any non-family people mentioned (doctors, teachers, friends):
${fullContent}
Family members to exclude: ${familyMemberNames.join(', ')}

Format: NAME | ROLE
Only list actual people, not organizations.`;

        const contactsResponse = await ClaudeService.generateResponse(
          [{ role: 'user', content: contactsPrompt }],
          { temperature: 0.3, max_tokens: 200 }
        );

        const contactLines = contactsResponse.split('\n').filter(line => line.trim());
      
      for (const line of contactLines) {
        const match = line.match(/^(.+?)\s*\|\s*(.+)$/);
        if (match) {
          const [, name, role] = match;
          contacts.push({
            name: name.trim(),
            title: role.trim(),
            type: 'general',
            notes: `Mentioned in ${item.source}`
          });
        }
      }
      } catch (contactsError) {
        console.error('Error extracting contacts:', contactsError);
        // Continue with empty contacts array
      }

      // Build the analysis object
      const analysis = {
        summary: summary,
        category: category,
        suggestedActions,
        contacts,
        tags: [],
        extractedInfo: {},
        intent: 'parse' // Always parse SMS/email for actions
      };

      // Only add documentType for uploads
      if (item.source === 'upload') {
        analysis.documentType = 'other';
      }
      
      console.log('🤖 AI Analysis complete:', {
        type: item.source,
        summary: analysis.summary,
        category: analysis.category,
        suggestedActionsCount: analysis.suggestedActions.length,
        contactsCount: analysis.contacts.length
      });

      // Determine the collection based on source
      let collectionName;
      if (item.source === 'email') {
        collectionName = 'emailInbox';
      } else if (item.source === 'sms' || item.source === 'mms') {
        collectionName = 'smsInbox';
      } else if (item.source === 'upload') {
        collectionName = 'familyDocuments';
      } else {
        throw new Error(`Unknown source type: ${item.source}`);
      }

      // Update the document with AI analysis
      const updateData = {
        aiAnalysis: analysis,
        summary: analysis.summary,
        category: analysis.category,
        tags: analysis.tags || [],
        contacts: analysis.contacts || [],
        suggestedActions: analysis.suggestedActions || [],
        extractedInfo: analysis.extractedInfo,
        processedAt: serverTimestamp(),
        status: 'processed',
        reviewed: true,
        processingError: null
      };
      
      // Add document-specific fields
      if (item.source === 'upload' && analysis.documentType) {
        updateData.documentType = analysis.documentType;
      }
      
      await updateDoc(doc(db, collectionName, itemId), updateData);
      
      console.log('✅ AI processing complete for:', itemId);
      
      // Add to Knowledge Graph for searchability
      try {
        console.log('📊 Adding to Knowledge Graph...');
        
        // Create document entity
        const inboxEntity = await FamilyKnowledgeGraph.addEntity(
          item.familyId,
          `inbox_${item.source}_${itemId}`,
          'document',
          {
            messageType: item.source,
            summary: analysis.summary,
            category: analysis.category,
            tags: analysis.tags,
            receivedAt: item.receivedAt,
            from: item.from,
            processedAt: new Date().toISOString()
          }
        );
        
        console.log('✅ Added to Knowledge Graph successfully');
      } catch (kgError) {
        console.error('Failed to add to Knowledge Graph:', kgError);
        // Don't fail the whole process if KG fails
      }
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Error processing with AI:', error);
      
      // Determine collection for error update
      let collectionName;
      if (item.source === 'email') {
        collectionName = 'emailInbox';
      } else if (item.source === 'sms' || item.source === 'mms') {
        collectionName = 'smsInbox';
      } else if (item.source === 'upload') {
        collectionName = 'familyDocuments';
      }
      
      // Update status to indicate processing failed
      if (collectionName) {
        try {
          await updateDoc(doc(db, collectionName, itemId), {
            status: 'error',
            processingError: error.message,
            processedAt: serverTimestamp()
          });
        } catch (updateError) {
          console.error('Failed to update error status:', updateError);
        }
      }
      
      throw error;
    }
  }
}

export default FixedUniversalAIProcessor;