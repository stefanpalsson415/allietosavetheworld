// Universal AI Processing Service for all inbox items
import ClaudeService from './ClaudeService';
import { db } from './firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import FamilyKnowledgeGraph from './FamilyKnowledgeGraph';

class UniversalAIProcessor {
  static async processInboxItem(itemId, item, familyMembers = []) {
    try {
      console.log('🤖 Processing inbox item with AI:', itemId, 'Type:', item.source);
      
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;
      const currentDay = currentDate.getDate();
      
      // Get family member names for context
      const familyMemberNames = familyMembers.map(m => 
        m.displayName || m.name || m.email?.split('@')[0] || ''
      ).filter(n => n);
      
      let content = '';
      let contextInfo = '';
      
      // Build content based on source type
      if (item.source === 'email') {
        const emailContent = typeof item.content === 'object' ? item.content.text : item.content;
        content = emailContent || '';
        contextInfo = `Email from: ${item.from}\nSubject: ${item.subject}\n\n`;
      } else if (item.source === 'sms' || item.source === 'mms') {
        content = item.content || item.body || '';
        contextInfo = `SMS from: ${item.from}\n`;
      } else if (item.source === 'upload') {
        // For documents, use extracted text or OCR content
        content = item.extractedText || item.ocrText || item.content || '';
        contextInfo = `Document: ${item.fileName || item.title}\nType: ${item.fileType}\n\n`;
        
        // If it's an image and no text, describe what we need
        if ((item.fileType?.startsWith('image/') || item.fileName?.match(/\.(jpg|jpeg|png|gif)$/i)) && !content) {
          content = `[Image document: ${item.fileName}. Please analyze the visual content when processing.]`;
        }
      }
      
      const fullContent = contextInfo + content;
      
      // Simplify the prompt to ensure complete responses
      const prompt = `Analyze this ${item.source} and extract key information. Today is ${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}.

${fullContent}

Extract:
1. Events with dates/times
2. People mentioned (non-family)
3. Tasks to do

For birthday parties, always suggest buying a present.
For appointments, suggest preparing questions.

Return a JSON object with this EXACT structure:
{
  "summary": "one sentence summary",
  "category": "event|medical|school|general",
  "suggestedActions": [
    {
      "type": "calendar|task|contact",
      "title": "short title",
      "priority": "high|medium|low",
      "data": {
        "title": "event/task name",
        "startDate": "2025-MM-DD",
        "location": "place if mentioned"
      }
    }
  ],
  "contacts": [
    {
      "name": "person name",
      "type": "medical|personal"
    }
  ]
}`;

      // Call Claude API with explicit JSON mode
      const response = await ClaudeService.generateResponse(
        [{ role: 'user', content: prompt }],
        { 
          temperature: 0.3,
          max_tokens: 1000 // Limit response length to prevent truncation
        }
      );

      // Parse Claude's response with multiple fallback strategies
      let analysis = {};
      try {
        // First, try to extract JSON from the response
        let jsonStr = response;
        
        // Strategy 1: Look for JSON in code blocks
        const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          jsonStr = codeBlockMatch[1];
        } else {
          // Strategy 2: Find JSON object in response
          const jsonStart = response.indexOf('{');
          const jsonEnd = response.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
            jsonStr = response.substring(jsonStart, jsonEnd + 1);
          }
        }
        
        // Clean up the JSON string
        jsonStr = jsonStr
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
          .replace(/\/\/.*$/gm, '') // Remove single-line comments
          .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas
          .replace(/(['"])\s*:\s*undefined/g, '$1: null') // Replace undefined with null
          .trim();
        
        // Try to parse
        analysis = JSON.parse(jsonStr);
        
        // Ensure required fields exist
        analysis.summary = analysis.summary || 'Content analyzed';
        analysis.category = analysis.category || 'general';
        analysis.suggestedActions = analysis.suggestedActions || [];
        analysis.contacts = analysis.contacts || [];
        
      } catch (parseError) {
        console.error('Failed to parse Claude response:', parseError);
        console.error('Raw response:', response);
        
        // Fallback: Try to extract basic information manually
        try {
          // Look for patterns in the response
          const summaryMatch = response.match(/"summary"\s*:\s*"([^"]+)"/);
          const categoryMatch = response.match(/"category"\s*:\s*"([^"]+)"/);
          
          analysis = {
            summary: summaryMatch ? summaryMatch[1] : 'Unable to process - please try again',
            category: categoryMatch ? categoryMatch[1] : 'general',
            suggestedActions: [],
            contacts: [],
            error: 'JSON parsing failed: ' + parseError.message
          };
          
          // Try to extract suggested actions
          const actionMatches = response.matchAll(/"title"\s*:\s*"([^"]+)"/g);
          for (const match of actionMatches) {
            if (analysis.suggestedActions.length < 3) {
              analysis.suggestedActions.push({
                type: 'task',
                title: match[1],
                priority: 'medium',
                status: 'pending',
                data: { title: match[1] }
              });
            }
          }
        } catch (fallbackError) {
          console.error('Fallback parsing also failed:', fallbackError);
          
          // Ultimate fallback
          analysis = {
            summary: 'Processing incomplete - please retry',
            category: 'general',
            suggestedActions: [],
            contacts: [],
            error: 'Complete parsing failure'
          };
        }
      }
      
      // Ensure all fields exist with defaults
      analysis.suggestedActions = analysis.suggestedActions || [];
      analysis.contacts = analysis.contacts || [];
      analysis.tags = analysis.tags || [];
      analysis.extractedInfo = analysis.extractedInfo || {};
      analysis.proactiveQuestions = analysis.proactiveQuestions || [];
      
      // Ensure suggestedActions have proper structure
      analysis.suggestedActions = analysis.suggestedActions.map(action => ({
        type: action.type || 'task',
        title: action.title || 'Untitled action',
        description: action.description || '',
        status: action.status || 'pending',
        priority: action.priority || 'medium',
        isProactive: action.isProactive || false,
        requiresClarification: action.requiresClarification || [],
        data: action.data || {}
      }));
      
      // Add proactive suggestions based on content
      if (fullContent.toLowerCase().includes('birthday') && 
          !analysis.suggestedActions.some(a => a.title.toLowerCase().includes('present'))) {
        analysis.suggestedActions.push({
          type: 'task',
          title: 'Buy birthday present',
          description: 'Shop for a birthday present',
          status: 'pending',
          priority: 'high',
          isProactive: true,
          data: {
            title: 'Buy birthday present',
            category: 'shopping'
          }
        });
      }
      
      // Add contact actions if contacts were detected
      if (analysis.contacts && analysis.contacts.length > 0) {
        // Check existing contacts in the database
        let existingContacts = [];
        try {
          const contactsQuery = query(
            collection(db, 'familyContacts'),
            where('familyId', '==', item.familyId)
          );
          const contactsSnapshot = await getDocs(contactsQuery);
          existingContacts = contactsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (error) {
          console.warn('Could not check existing contacts:', error);
        }
        
        for (const contact of analysis.contacts) {
          // Double-check that this person isn't a family member
          const isFamily = familyMemberNames.some(familyName => 
            familyName.toLowerCase() === contact.name.toLowerCase() ||
            contact.name.toLowerCase().includes(familyName.toLowerCase()) ||
            familyName.toLowerCase().includes(contact.name.toLowerCase())
          );
          
          // Check if contact already exists
          const contactExists = existingContacts.some(existing => {
            const existingName = existing.name?.toLowerCase() || '';
            const newName = contact.name?.toLowerCase() || '';
            
            // Check for exact match or partial match (e.g., "Dr. Greene" vs "Dr Greene" vs "Greene")
            return existingName === newName ||
                   existingName.includes(newName) ||
                   newName.includes(existingName) ||
                   (existing.title?.toLowerCase() === contact.title?.toLowerCase() && 
                    existing.type === contact.type);
          });
          
          if (!isFamily && !contactExists) {
            analysis.suggestedActions.push({
              type: 'contact',
              title: `Add ${contact.name} to Contacts`,
              description: `Add ${contact.name} (${contact.title || contact.type}) to your family contacts`,
              status: 'pending',
              priority: 'medium', // Increased from 'low' since it's a new professional
              data: {
                name: contact.name,
                title: contact.title || contact.type || 'Healthcare Provider',
                type: contact.type || 'medical',
                notes: contact.notes || `${contact.type || 'Professional'} mentioned in ${item.source}`,
                phone: contact.phone,
                email: contact.email,
                category: analysis.category || 'medical'
              }
            });
          } else if (!isFamily && contactExists) {
            console.log(`📋 Contact ${contact.name} already exists, skipping creation suggestion`);
          }
        }
      }
      
      console.log('🤖 AI Analysis complete:', {
        type: item.source,
        summary: analysis.summary,
        category: analysis.category,
        documentType: analysis.documentType,
        suggestedActionsCount: analysis.suggestedActions?.length || 0,
        contactsCount: analysis.contacts?.length || 0
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

      // Only mark as processed if we have meaningful analysis
      const hasValidAnalysis = analysis.summary && 
                              analysis.summary !== 'Processing incomplete - please retry' &&
                              analysis.summary !== 'Unable to process - please try again' &&
                              !analysis.error;
      
      const updateData = {
        aiAnalysis: analysis,
        summary: analysis.summary,
        category: analysis.category,
        tags: analysis.tags || [],
        contacts: analysis.contacts || [],
        suggestedActions: analysis.suggestedActions || [],
        extractedInfo: analysis.extractedInfo,
        processedAt: serverTimestamp(),
        status: hasValidAnalysis ? 'processed' : 'pending',
        reviewed: hasValidAnalysis,
        processingError: analysis.error || null
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
        
        // Create message entity (using 'message' instead of 'inbox_item')
        const inboxEntity = await FamilyKnowledgeGraph.addEntity(
          item.familyId,
          `inbox_${item.source}_${itemId}`,
          'message',
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
        
        // Add relationships for contacts
        if (analysis.contacts?.length > 0) {
          for (const contact of analysis.contacts) {
            const contactEntity = await FamilyKnowledgeGraph.addEntity(
              item.familyId,
              `contact_${contact.name.replace(/\s+/g, '_')}`,
              'contact',
              {
                name: contact.name,
                title: contact.title,
                type: contact.type
              }
            );
            
            await FamilyKnowledgeGraph.addRelationship(
              item.familyId,
              inboxEntity.id,
              contactEntity.id,
              'mentions_contact',
              { context: item.source }
            );
          }
        }
        
        // Add relationships for suggested actions
        if (analysis.suggestedActions?.length > 0) {
          for (const action of analysis.suggestedActions) {
            if (action.type === 'calendar' && action.data?.title) {
              await FamilyKnowledgeGraph.addEntity(
                item.familyId,
                `event_${action.data.title.replace(/\s+/g, '_')}_${Date.now()}`,
                'event',
                {
                  title: action.data.title,
                  date: action.data.startDate,
                  location: action.data.location,
                  isProactive: action.isProactive || false
                }
              );
            }
          }
        }
        
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

export default UniversalAIProcessor;