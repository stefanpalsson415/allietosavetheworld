import { v4 as uuidv4 } from 'uuid';
import { db, storage } from './firebase';
import ClaudeService from './ClaudeService';
import FamilyKnowledgeGraph from './FamilyKnowledgeGraph';
import { MultimodalUnderstandingPipeline, DocumentKnowledgeExtractor, DocumentSimilarityDetector } from './knowledge';

/**
 * MultimodalUnderstandingService
 * 
 * Service that handles the extraction and understanding of content from various file types
 * Integrates with Claude and other AI services to extract structured information
 */
class MultimodalUnderstandingService {
  constructor() {
    // Supported file types
    this.supportedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      text: ['text/plain', 'text/markdown', 'text/html', 'text/css', 'text/javascript'],
      spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      calendar: ['text/calendar'],
      email: ['message/rfc822']
    };
    
    // Analysis capabilities
    this.analysisCapabilities = {
      event: {
        extractors: ['date', 'time', 'location', 'attendees', 'organizer', 'description', 'recurrence'],
        confidence: 0.9,
        knowledgeGraphMappings: ['temporal', 'people', 'locations']
      },
      medical: {
        extractors: ['provider', 'diagnosis', 'medications', 'instructions', 'followUp'],
        confidence: 0.85,
        knowledgeGraphMappings: ['medical', 'people', 'temporal']
      },
      document: {
        extractors: ['title', 'author', 'date', 'summary', 'keywords'],
        confidence: 0.8,
        knowledgeGraphMappings: ['general', 'documents', 'people']
      },
      email: {
        extractors: ['sender', 'recipients', 'subject', 'body', 'attachments', 'actionItems'],
        confidence: 0.85,
        knowledgeGraphMappings: ['communication', 'people', 'tasks']
      },
      knowledgeGraph: {
        extractors: ['entities', 'relationships', 'concepts', 'categories'],
        confidence: 0.8,
        knowledgeGraphMappings: ['all']
      }
    };
    
    this.claudeService = ClaudeService;
    this.knowledgeGraph = FamilyKnowledgeGraph;
  }
  
  /**
   * Process a file to extract structured information
   * @param {File} file - The file to process
   * @param {string} analysisType - Type of analysis to perform
   * @param {Object} context - Context information for the analysis
   * @param {string} familyId - ID of the family
   * @param {string} userId - ID of the user
   * @returns {Promise<Object>} The extracted information
   */
  async processFile(file, analysisType = 'document', context = {}, familyId, userId) {
    try {
      if (!file) {
        return { success: false, error: 'No file provided' };
      }
      
      // Generate a unique ID for this processing job
      const processingId = uuidv4();
      
      // Determine the file category
      const fileCategory = this.getFileCategory(file.type);
      
      if (!fileCategory) {
        return {
          success: false,
          error: `Unsupported file type: ${file.type}`,
          processingId
        };
      }
      
      // Read the file content
      let fileContent;
      
      try {
        fileContent = await this.readFileContent(file);
      } catch (error) {
        console.error('Error reading file content:', error);
        return {
          success: false,
          error: 'Failed to read file content',
          processingId
        };
      }
      
      // Process the file content based on type
      let processingResult;
      
      switch (fileCategory) {
        case 'image':
          processingResult = await this.processImageFile(file, fileContent, analysisType, context);
          break;
        case 'document':
          processingResult = await this.processDocumentFile(file, fileContent, analysisType, context);
          break;
        case 'text':
          processingResult = await this.processTextFile(file, fileContent, analysisType, context);
          break;
        case 'spreadsheet':
          processingResult = await this.processSpreadsheetFile(file, fileContent, analysisType, context);
          break;
        case 'calendar':
          processingResult = await this.processCalendarFile(file, fileContent, analysisType, context);
          break;
        case 'email':
          processingResult = await this.processEmailFile(file, fileContent, analysisType, context);
          break;
        default:
          return {
            success: false,
            error: 'Unsupported file category',
            processingId
          };
      }
      
      // Add metadata to the processing result
      processingResult.fileInfo = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      };
      
      processingResult.context = context;
      processingResult.processingId = processingId;
      processingResult.analysisType = analysisType;
      
      // Store the processing result
      await this.storeProcessingResult(processingResult, familyId, userId);
      
      // Return the processing result
      return {
        success: true,
        results: processingResult,
        processingId
      };
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while processing the file'
      };
    }
  }
  
  /**
   * Process multiple files together and extract combined information
   * @param {Array<File>} files - The files to process
   * @param {string} analysisType - Type of analysis to perform
   * @param {Object} context - Context information for the analysis
   * @param {string} familyId - ID of the family
   * @param {string} userId - ID of the user
   * @returns {Promise<Object>} The extracted information
   */
  async processMultipleFiles(files, analysisType = 'document', context = {}, familyId, userId) {
    try {
      if (!files || !files.length) {
        return { success: false, error: 'No files provided' };
      }
      
      // Generate a unique ID for this batch processing job
      const batchId = uuidv4();
      
      // Process each file individually
      const fileResults = await Promise.all(
        files.map(file => this.processFile(file, analysisType, context, familyId, userId))
      );
      
      // Filter out failures
      const successfulResults = fileResults.filter(result => result.success);
      
      if (successfulResults.length === 0) {
        return {
          success: false,
          error: 'Failed to process any of the provided files',
          batchId
        };
      }
      
      // Combine results for overall analysis
      const combinedAnalysis = await this.combineFileResults(successfulResults, analysisType);
      
      // Extract knowledge graph from combined results if applicable
      if (analysisType === 'knowledgeGraph' || this.analysisCapabilities[analysisType]?.knowledgeGraphMappings) {
        const knowledgeGraph = await this.extractKnowledgeGraph(combinedAnalysis, analysisType);
        
        // Store in knowledge graph if family ID is provided
        if (familyId && knowledgeGraph.entities.length > 0) {
          await this.storeInKnowledgeGraph(knowledgeGraph, familyId, userId);
        }
        
        combinedAnalysis.knowledgeGraph = knowledgeGraph;
      }
      
      // Store the combined result
      const combinedResult = {
        success: true,
        results: {
          analysis: combinedAnalysis,
          individualResults: successfulResults.map(r => r.results),
          textContent: successfulResults.map(r => r.results?.textContent || '').join('\n\n')
        },
        batchId,
        fileCount: files.length,
        successCount: successfulResults.length
      };
      
      await this.storeProcessingResult(combinedResult, familyId, userId, true);
      
      return combinedResult;
    } catch (error) {
      console.error('Error processing multiple files:', error);
      return {
        success: false,
        error: error.message || 'An error occurred while processing the files'
      };
    }
  }
  
  /**
   * Get the category of a file based on its MIME type
   * @param {string} mimeType - The MIME type of the file
   * @returns {string|null} The file category or null if unsupported
   */
  getFileCategory(mimeType) {
    for (const [category, types] of Object.entries(this.supportedTypes)) {
      if (types.includes(mimeType)) {
        return category;
      }
    }
    return null;
  }
  
  /**
   * Read the content of a file
   * @param {File} file - The file to read
   * @returns {Promise<ArrayBuffer|string>} The file content
   */
  async readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      if (this.getFileCategory(file.type) === 'image') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }
  
  /**
   * Process an image file
   * @param {File} file - The image file
   * @param {string} content - The file content as a data URL
   * @param {string} analysisType - Type of analysis to perform
   * @param {Object} context - Context information for the analysis
   * @returns {Promise<Object>} The processed result
   */
  async processImageFile(file, content, analysisType, context) {
    // For images, we'll use Claude's multimodal capabilities
    const prompt = this.getPromptForAnalysis(analysisType, context);
    
    // Call Claude with the image
    const claudeResponse = await this.claudeService.sendMultimodalMessage(
      prompt,
      [{ type: 'image', data: content }]
    );
    
    // Process Claude's response
    const result = this.processClaudeResponse(claudeResponse, analysisType);
    
    return {
      originalContent: null, // Don't include the image data in the result
      textContent: result.extractedText || '',
      analysis: result
    };
  }
  
  /**
   * Process a document file (PDF, Word, etc.)
   * @param {File} file - The document file
   * @param {ArrayBuffer} content - The file content
   * @param {string} analysisType - Type of analysis to perform
   * @param {Object} context - Context information for the analysis
   * @returns {Promise<Object>} The processed result
   */
  async processDocumentFile(file, content, analysisType, context) {
    // For documents, we convert to text first (for PDFs, this involves OCR)
    // Then we use Claude to analyze the text
    
    // Convert document to text
    const textContent = await this.convertDocumentToText(file, content);
    
    // Get prompt for analysis
    const prompt = this.getPromptForAnalysis(analysisType, context, textContent);
    
    // Call Claude with the text
    const claudeResponse = await this.claudeService.sendMessage(prompt);
    
    // Process Claude's response
    const result = this.processClaudeResponse(claudeResponse, analysisType);
    
    return {
      originalContent: null, // Don't include the binary data in the result
      textContent: textContent,
      analysis: result
    };
  }
  
  /**
   * Process a text file
   * @param {File} file - The text file
   * @param {ArrayBuffer} content - The file content
   * @param {string} analysisType - Type of analysis to perform
   * @param {Object} context - Context information for the analysis
   * @returns {Promise<Object>} The processed result
   */
  async processTextFile(file, content, analysisType, context) {
    // Convert ArrayBuffer to text
    const decoder = new TextDecoder('utf-8');
    const textContent = decoder.decode(content);
    
    // Get prompt for analysis
    const prompt = this.getPromptForAnalysis(analysisType, context, textContent);
    
    // Call Claude with the text
    const claudeResponse = await this.claudeService.sendMessage(prompt);
    
    // Process Claude's response
    const result = this.processClaudeResponse(claudeResponse, analysisType);
    
    return {
      originalContent: textContent,
      textContent: textContent,
      analysis: result
    };
  }
  
  /**
   * Process a spreadsheet file
   * @param {File} file - The spreadsheet file
   * @param {ArrayBuffer} content - The file content
   * @param {string} analysisType - Type of analysis to perform
   * @param {Object} context - Context information for the analysis
   * @returns {Promise<Object>} The processed result
   */
  async processSpreadsheetFile(file, content, analysisType, context) {
    // Convert spreadsheet to text or structured data
    // This is a simplified implementation
    
    // For now, we'll just extract some basic text
    const textContent = "Spreadsheet data extraction is not fully implemented.";
    
    // Get prompt for analysis
    const prompt = this.getPromptForAnalysis(analysisType, context, textContent);
    
    // Call Claude with the text
    const claudeResponse = await this.claudeService.sendMessage(prompt);
    
    // Process Claude's response
    const result = this.processClaudeResponse(claudeResponse, analysisType);
    
    return {
      originalContent: null,
      textContent: textContent,
      analysis: result
    };
  }
  
  /**
   * Process a calendar file (.ics)
   * @param {File} file - The calendar file
   * @param {ArrayBuffer} content - The file content
   * @param {string} analysisType - Type of analysis to perform
   * @param {Object} context - Context information for the analysis
   * @returns {Promise<Object>} The processed result
   */
  async processCalendarFile(file, content, analysisType, context) {
    // Parse ICS file
    const decoder = new TextDecoder('utf-8');
    const icsContent = decoder.decode(content);
    
    // Basic parsing of ICS content
    const events = this.parseIcsContent(icsContent);
    
    // Convert events to text for Claude
    const textContent = events.map(event => 
      `Event: ${event.summary}\nStart: ${event.start}\nEnd: ${event.end}\nLocation: ${event.location}\nDescription: ${event.description}`
    ).join('\n\n');
    
    // Get prompt for analysis
    const prompt = this.getPromptForAnalysis(analysisType, context, textContent);
    
    // Call Claude with the text
    const claudeResponse = await this.claudeService.sendMessage(prompt);
    
    // Process Claude's response
    const result = this.processClaudeResponse(claudeResponse, analysisType);
    
    return {
      originalContent: icsContent,
      textContent: textContent,
      rawEvents: events,
      analysis: result
    };
  }
  
  /**
   * Process an email file
   * @param {File} file - The email file
   * @param {ArrayBuffer} content - The file content
   * @param {string} analysisType - Type of analysis to perform
   * @param {Object} context - Context information for the analysis
   * @returns {Promise<Object>} The processed result
   */
  async processEmailFile(file, content, analysisType, context) {
    // Parse email file
    const decoder = new TextDecoder('utf-8');
    const emailContent = decoder.decode(content);
    
    // Basic email parsing (simplified)
    const emailData = this.parseEmailContent(emailContent);
    
    // Convert email to text for Claude
    const textContent = `From: ${emailData.from}\nTo: ${emailData.to}\nSubject: ${emailData.subject}\n\n${emailData.body}`;
    
    // Get prompt for analysis
    const prompt = this.getPromptForAnalysis(analysisType, context, textContent);
    
    // Call Claude with the text
    const claudeResponse = await this.claudeService.sendMessage(prompt);
    
    // Process Claude's response
    const result = this.processClaudeResponse(claudeResponse, analysisType);
    
    return {
      originalContent: emailContent,
      textContent: textContent,
      emailMetadata: {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject,
        date: emailData.date
      },
      analysis: result
    };
  }
  
  /**
   * Combine results from multiple files
   * @param {Array<Object>} fileResults - Results from individual file processing
   * @param {string} analysisType - Type of analysis performed
   * @returns {Promise<Object>} Combined analysis
   */
  async combineFileResults(fileResults, analysisType) {
    // Extract individual analyses
    const analyses = fileResults
      .filter(result => result.success)
      .map(result => result.results?.analysis);
    
    // If there's only one result, just return it
    if (analyses.length === 1) {
      return analyses[0];
    }
    
    // Combine analyses based on type
    let combinedData = {};
    
    switch (analysisType) {
      case 'event':
        combinedData = this.combineEventAnalyses(analyses);
        break;
      case 'medical':
        combinedData = this.combineMedicalAnalyses(analyses);
        break;
      case 'document':
        combinedData = this.combineDocumentAnalyses(analyses);
        break;
      case 'knowledgeGraph':
        combinedData = this.combineKnowledgeGraphs(analyses);
        break;
      default:
        // Default combining strategy
        combinedData = this.defaultCombineAnalyses(analyses);
    }
    
    return {
      type: analysisType,
      data: combinedData,
      confidence: Math.max(...analyses.map(a => a.confidence || 0)),
      combined: true,
      sourceCount: analyses.length
    };
  }
  
  /**
   * Combine event analyses
   * @param {Array<Object>} analyses - Event analyses to combine
   * @returns {Object} Combined event data
   */
  combineEventAnalyses(analyses) {
    // Start with the most confident analysis
    const sortedAnalyses = [...analyses].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    const baseAnalysis = sortedAnalyses[0]?.data || {};
    
    // Combine key fields
    const combinedData = { ...baseAnalysis };
    
    // For arrays, combine unique items
    if (baseAnalysis.attendees) {
      const allAttendees = new Set(baseAnalysis.attendees);
      sortedAnalyses.slice(1).forEach(analysis => {
        if (analysis.data?.attendees) {
          analysis.data.attendees.forEach(attendee => allAttendees.add(attendee));
        }
      });
      combinedData.attendees = Array.from(allAttendees);
    }
    
    return combinedData;
  }
  
  /**
   * Combine medical analyses
   * @param {Array<Object>} analyses - Medical analyses to combine
   * @returns {Object} Combined medical data
   */
  combineMedicalAnalyses(analyses) {
    // Start with the most confident analysis
    const sortedAnalyses = [...analyses].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    const baseAnalysis = sortedAnalyses[0]?.data || {};
    
    // Combine key fields
    const combinedData = { ...baseAnalysis };
    
    // For medications, combine unique items
    if (baseAnalysis.medications) {
      const allMedications = new Map();
      
      // Add base medications
      baseAnalysis.medications.forEach(med => {
        if (typeof med === 'string') {
          allMedications.set(med.toLowerCase(), med);
        } else if (med.name) {
          allMedications.set(med.name.toLowerCase(), med);
        }
      });
      
      // Add medications from other analyses
      sortedAnalyses.slice(1).forEach(analysis => {
        if (analysis.data?.medications) {
          analysis.data.medications.forEach(med => {
            const medName = typeof med === 'string' ? med : med.name;
            if (medName && !allMedications.has(medName.toLowerCase())) {
              allMedications.set(medName.toLowerCase(), med);
            }
          });
        }
      });
      
      combinedData.medications = Array.from(allMedications.values());
    }
    
    return combinedData;
  }
  
  /**
   * Combine document analyses
   * @param {Array<Object>} analyses - Document analyses to combine
   * @returns {Object} Combined document data
   */
  combineDocumentAnalyses(analyses) {
    // Start with the most confident analysis
    const sortedAnalyses = [...analyses].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    const baseAnalysis = sortedAnalyses[0]?.data || {};
    
    // Combine key fields
    const combinedData = { ...baseAnalysis };
    
    // For keywords, combine unique items
    if (baseAnalysis.keywords) {
      const allKeywords = new Set(baseAnalysis.keywords);
      sortedAnalyses.slice(1).forEach(analysis => {
        if (analysis.data?.keywords) {
          analysis.data.keywords.forEach(keyword => allKeywords.add(keyword));
        }
      });
      combinedData.keywords = Array.from(allKeywords);
    }
    
    // Create combined summary
    if (sortedAnalyses.length > 1) {
      const summaries = sortedAnalyses
        .map(analysis => analysis.data?.summary)
        .filter(Boolean);
      
      if (summaries.length > 1) {
        combinedData.summary = `Combined from ${summaries.length} documents: ${summaries[0]}`;
        combinedData.allSummaries = summaries;
      }
    }
    
    return combinedData;
  }
  
  /**
   * Combine knowledge graphs
   * @param {Array<Object>} analyses - Knowledge graph analyses to combine
   * @returns {Object} Combined knowledge graph
   */
  combineKnowledgeGraphs(analyses) {
    const entities = new Map();
    const relationships = [];
    
    // Collect all entities with deduplication
    analyses.forEach(analysis => {
      if (analysis.data?.entities) {
        analysis.data.entities.forEach(entity => {
          const key = `${entity.type}:${entity.value}`;
          if (!entities.has(key)) {
            entities.set(key, entity);
          }
        });
      }
    });
    
    // Collect all relationships
    analyses.forEach(analysis => {
      if (analysis.data?.relationships) {
        analysis.data.relationships.forEach(rel => {
          // Find the source and target entities in our deduplicated collection
          const sourceEntity = Array.from(entities.values()).find(e => e.id === rel.sourceId);
          const targetEntity = Array.from(entities.values()).find(e => e.id === rel.targetId);
          
          if (sourceEntity && targetEntity) {
            relationships.push({
              ...rel,
              sourceId: sourceEntity.id,
              targetId: targetEntity.id
            });
          }
        });
      }
    });
    
    return {
      entities: Array.from(entities.values()),
      relationships,
      sourceCount: analyses.length
    };
  }
  
  /**
   * Default strategy for combining analyses
   * @param {Array<Object>} analyses - Analyses to combine
   * @returns {Object} Combined data
   */
  defaultCombineAnalyses(analyses) {
    // Start with the most confident analysis
    const sortedAnalyses = [...analyses].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    const baseAnalysis = sortedAnalyses[0]?.data || {};
    
    return {
      ...baseAnalysis,
      sources: sortedAnalyses.length
    };
  }
  
  /**
   * Get the prompt for a specific analysis type
   * @param {string} analysisType - Type of analysis to perform
   * @param {Object} context - Context information for the analysis
   * @param {string} content - Text content to analyze (optional)
   * @returns {string} The prompt for Claude
   */
  getPromptForAnalysis(analysisType, context, content = '') {
    // Define the base prompt
    let basePrompt = `You are an AI assistant that specializes in extracting structured information from ${this.getTypeName(analysisType)}. `;
    
    // Add context information if available
    if (context) {
      if (context.familyInfo) {
        basePrompt += `\nFamily Information: ${JSON.stringify(context.familyInfo)}`;
      }
      
      if (context.userId) {
        basePrompt += `\nUser ID: ${context.userId}`;
      }
      
      if (context.timestamp) {
        basePrompt += `\nTimestamp: ${context.timestamp}`;
      }
    }
    
    // Get the specific prompt based on analysis type
    return this.getSystemPromptForAnalysis(analysisType, basePrompt, content);
  }
  
  /**
   * Get the system prompt for a specific analysis type
   * @param {string} analysisType - Type of analysis to perform
   * @param {string} basePrompt - Base prompt with context
   * @param {string} content - Text content to analyze (optional)
   * @returns {string} The system prompt for Claude
   */
  getSystemPromptForAnalysis(analysisType, basePrompt, content = '') {
    const contentSection = content ? `\n\nContent to analyze:\n${content}` : '';
    
    switch (analysisType) {
      case 'event':
        return `${basePrompt}
        
        TASK: Extract event information from the provided content.
        
        JSON SCHEMA:
        {
          "title": "string (event title)",
          "eventType": "string (type of event: meeting, appointment, school, etc.)",
          "dateTime": "ISO string (event date and time)",
          "location": "string (location)",
          "organizer": "string (event organizer)",
          "attendees": ["array of strings (people attending)"],
          "description": "string (event description)",
          "childName": "string (if applicable, which child this event is for)",
          "specialInstructions": "string (any special instructions)",
          "recurrence": "string (recurrence pattern if any)"
        }
        
        EXTRACTION GUIDELINES:
        - If the event has a specific date/time, format it as an ISO string
        - Include any special instructions or notes
        - If the event is for a child, include their name
        - Extract any recurrence pattern (daily, weekly, etc.)
        
        IMPORTANT: Return ONLY the JSON object with no additional text.${contentSection}`;
      
      case 'medical':
        return `${basePrompt}
        
        TASK: Extract medical information from the provided content.
        
        JSON SCHEMA:
        {
          "documentType": "string (prescription, lab report, etc.)",
          "patientName": "string (patient name)",
          "providerName": "string (healthcare provider name)",
          "date": "ISO string (document date)",
          "diagnosis": "string (diagnosis if present)",
          "medications": [
            {
              "name": "string (medication name)",
              "dosage": "string (dosage)",
              "instructions": "string (usage instructions)"
            }
          ],
          "treatment": "string (treatment plan)",
          "followUp": "string (follow-up instructions)"
        }
        
        EXTRACTION GUIDELINES:
        - Focus on key medical information
        - Extract all medications and their details
        - Include follow-up instructions or appointments
        - Capture diagnosis and treatment information
        
        IMPORTANT: Return ONLY the JSON object with no additional text.${contentSection}`;
      
      case 'document':
        return `${basePrompt}
        
        TASK: Extract document information and create a summary.
        
        JSON SCHEMA:
        {
          "title": "string (document title)",
          "author": "string (document author)",
          "date": "ISO string (document date)",
          "summary": "string (summary of key points)",
          "keywords": ["array of strings (important keywords)"],
          "categories": ["array of strings (document categories)"]
        }
        
        EXTRACTION GUIDELINES:
        - Create a concise summary of the main points
        - Extract key dates, names, and entities
        - Identify important keywords and themes
        - Categorize the document appropriately
        
        IMPORTANT: Return ONLY the JSON object with no additional text.${contentSection}`;
      
      case 'email':
        return `${basePrompt}
        
        TASK: Extract email information and identify action items.
        
        JSON SCHEMA:
        {
          "sender": "string (email sender)",
          "recipients": ["array of strings (email recipients)"],
          "subject": "string (email subject)",
          "date": "ISO string (email date)",
          "summary": "string (summary of email content)",
          "actionItems": ["array of strings (required actions)"],
          "priority": "string (high, medium, low)",
          "categories": ["array of strings (email categories)"]
        }
        
        EXTRACTION GUIDELINES:
        - Identify any action items or required responses
        - Assess the priority of the email
        - Categorize the email content
        - Create a brief summary of the main points
        
        IMPORTANT: Return ONLY the JSON object with no additional text.${contentSection}`;
      
      case 'knowledgeGraph':
        return `${basePrompt}
        
        TASK: Extract entities and their relationships to create a knowledge graph.
        
        JSON SCHEMA:
        {
          "entities": [
            {
              "id": "string (unique identifier)",
              "type": "string (person, place, organization, event, concept, etc.)",
              "value": "string (entity name or value)",
              "category": "string (broader category: person, place, temporal, etc.)",
              "confidence": number (0-1)
            }
          ],
          "relationships": [
            {
              "id": "string (unique identifier)",
              "sourceId": "string (source entity id)",
              "targetId": "string (target entity id)",
              "type": "string (relationship type)",
              "label": "string (relationship label)",
              "confidence": number (0-1)
            }
          ]
        }
        
        EXTRACTION GUIDELINES:
        - Identify people, places, organizations, events, times, and concepts
        - Create relationships between entities (e.g., person-attends-event)
        - Ensure each entity has a unique ID that is referenced in relationships
        - Include a confidence score for each extraction
        - Common entity types: person, place, organization, event, concept, time, document
        - Common relationship types: attends, located_at, organizes, related_to, part_of, member_of
        
        IMPORTANT: Return ONLY the JSON object with no additional text.${contentSection}`;
      
      default:
        return `${basePrompt}
        
        TASK: Extract structured information from the provided content.
        
        JSON SCHEMA:
        {
          "data": {
            // Extracted information should be placed here
          },
          "confidence": number (0-1)
        }
        
        EXTRACTION GUIDELINES:
        - Extract key information from the content
        - Identify main topics, entities, and concepts
        - Organize information in a structured format
        - Include a confidence score for your extraction
        
        IMPORTANT: Return ONLY the JSON object with no additional text.${contentSection}`;
    }
  }
  
  /**
   * Process Claude's response into structured data
   * @param {string} response - Claude's response
   * @param {string} analysisType - Type of analysis performed
   * @returns {Object} Structured data extracted from response
   */
  processClaudeResponse(response, analysisType) {
    // Find and parse JSON in the response
    try {
      const jsonStart = response.indexOf('{');
      const jsonEnd = response.lastIndexOf('}') + 1;
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        const jsonStr = response.substring(jsonStart, jsonEnd);
        const data = JSON.parse(jsonStr);
        
        // Extract key information based on analysis type
        const extractedInfo = this.extractKeyInformation(data, analysisType);
        
        return {
          type: analysisType,
          data: extractedInfo,
          rawResponse: response,
          confidence: this.analysisCapabilities[analysisType]?.confidence || 0.7
        };
      }
    } catch (error) {
      console.error('Error processing Claude response:', error);
    }
    
    // Fallback if JSON parsing fails
    return {
      type: analysisType,
      data: {},
      rawResponse: response,
      confidence: 0.3,
      error: 'Failed to extract structured data'
    };
  }
  
  /**
   * Extract key information from JSON response based on analysis type
   * @param {Object} data - Parsed JSON data from Claude
   * @param {string} analysisType - Type of analysis performed
   * @returns {Object} Extracted key information
   */
  extractKeyInformation(data, analysisType) {
    switch (analysisType) {
      case 'event':
        return {
          title: data.title || '',
          eventType: data.eventType || '',
          dateTime: data.dateTime || '',
          location: data.location || '',
          organizer: data.organizer || '',
          attendees: data.attendees || [],
          description: data.description || '',
          childName: data.childName || '',
          specialInstructions: data.specialInstructions || '',
          recurrence: data.recurrence || ''
        };
      
      case 'medical':
        return {
          documentType: data.documentType || '',
          patientName: data.patientName || '',
          providerName: data.providerName || '',
          date: data.date || '',
          diagnosis: data.diagnosis || '',
          medications: data.medications || [],
          treatment: data.treatment || '',
          followUp: data.followUp || ''
        };
      
      case 'document':
        return {
          title: data.title || '',
          author: data.author || '',
          date: data.date || '',
          summary: data.summary || '',
          keywords: data.keywords || [],
          categories: data.categories || []
        };
      
      case 'email':
        return {
          sender: data.sender || '',
          recipients: data.recipients || [],
          subject: data.subject || '',
          date: data.date || '',
          summary: data.summary || '',
          actionItems: data.actionItems || [],
          priority: data.priority || 'medium',
          categories: data.categories || []
        };
      
      case 'knowledgeGraph':
        return {
          entities: data.entities || [],
          relationships: data.relationships || []
        };
      
      default:
        return data;
    }
  }
  
  /**
   * Extract a knowledge graph from processing results
   * @param {Object} processingResult - The result from processing
   * @param {string} analysisType - Type of analysis performed
   * @returns {Promise<Object>} The extracted knowledge graph
   */
  async extractKnowledgeGraph(processingResult, analysisType) {
    try {
      // If analysis type is already knowledgeGraph, return its data
      if (analysisType === 'knowledgeGraph' && 
          processingResult.data && 
          processingResult.data.entities && 
          processingResult.data.relationships) {
        return processingResult.data;
      }
      
      // Otherwise, extract entities and relationships based on analysis type
      const entities = await this.extractEntitiesFromAnalysis(processingResult, analysisType);
      const relationships = await this.extractRelationshipsFromAnalysis(entities, processingResult, analysisType);
      
      // Add temporal context if available
      await this.extractTemporalContext(entities, processingResult, analysisType);
      
      return {
        entities,
        relationships,
        analysisType
      };
    } catch (error) {
      console.error('Error extracting knowledge graph:', error);
      return {
        entities: [],
        relationships: [],
        error: error.message
      };
    }
  }
  
  /**
   * Extract entities from analysis results
   * @param {Object} processingResult - The processing result
   * @param {string} analysisType - Type of analysis performed
   * @returns {Promise<Array>} Extracted entities
   */
  async extractEntitiesFromAnalysis(processingResult, analysisType) {
    const entities = [];
    const data = processingResult.data || {};
    
    // Generate unique IDs for entities
    const createEntity = (type, value, category, confidence = 0.8) => {
      return {
        id: `entity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type,
        value: String(value),
        category,
        confidence
      };
    };
    
    // Extract entities based on analysis type
    switch (analysisType) {
      case 'event':
        // Event title
        if (data.title) {
          entities.push(createEntity('event', data.title, 'event'));
        }
        
        // Event date/time
        if (data.dateTime) {
          entities.push(createEntity('date', data.dateTime, 'temporal'));
        }
        
        // Location
        if (data.location) {
          entities.push(createEntity('location', data.location, 'place'));
        }
        
        // Organizer
        if (data.organizer) {
          entities.push(createEntity('person', data.organizer, 'person'));
        }
        
        // Attendees
        if (data.attendees && Array.isArray(data.attendees)) {
          data.attendees.forEach(attendee => {
            entities.push(createEntity('person', attendee, 'person'));
          });
        }
        
        // Child name
        if (data.childName) {
          entities.push(createEntity('person', data.childName, 'person'));
        }
        break;
      
      case 'medical':
        // Document type
        if (data.documentType) {
          entities.push(createEntity('document', data.documentType, 'document'));
        }
        
        // Patient
        if (data.patientName) {
          entities.push(createEntity('patient', data.patientName, 'person'));
        }
        
        // Provider
        if (data.providerName) {
          entities.push(createEntity('provider', data.providerName, 'person'));
        }
        
        // Date
        if (data.date) {
          entities.push(createEntity('date', data.date, 'temporal'));
        }
        
        // Diagnosis
        if (data.diagnosis) {
          entities.push(createEntity('diagnosis', data.diagnosis, 'medical'));
        }
        
        // Medications
        if (data.medications && Array.isArray(data.medications)) {
          data.medications.forEach(med => {
            const medName = typeof med === 'string' ? med : med.name;
            if (medName) {
              entities.push(createEntity('medication', medName, 'medical'));
            }
          });
        }
        
        // Treatment
        if (data.treatment) {
          entities.push(createEntity('treatment', data.treatment, 'medical'));
        }
        break;
      
      case 'document':
        // Title
        if (data.title) {
          entities.push(createEntity('title', data.title, 'document'));
        }
        
        // Author
        if (data.author) {
          entities.push(createEntity('author', data.author, 'person'));
        }
        
        // Date
        if (data.date) {
          entities.push(createEntity('date', data.date, 'temporal'));
        }
        
        // Keywords
        if (data.keywords && Array.isArray(data.keywords)) {
          data.keywords.forEach(keyword => {
            entities.push(createEntity('keyword', keyword, 'concept'));
          });
        }
        
        // Categories
        if (data.categories && Array.isArray(data.categories)) {
          data.categories.forEach(category => {
            entities.push(createEntity('category', category, 'concept'));
          });
        }
        break;
      
      case 'email':
        // Sender
        if (data.sender) {
          entities.push(createEntity('person', data.sender, 'person'));
        }
        
        // Recipients
        if (data.recipients && Array.isArray(data.recipients)) {
          data.recipients.forEach(recipient => {
            entities.push(createEntity('person', recipient, 'person'));
          });
        }
        
        // Subject
        if (data.subject) {
          entities.push(createEntity('subject', data.subject, 'concept'));
        }
        
        // Date
        if (data.date) {
          entities.push(createEntity('date', data.date, 'temporal'));
        }
        
        // Action items
        if (data.actionItems && Array.isArray(data.actionItems)) {
          data.actionItems.forEach(item => {
            entities.push(createEntity('action', item, 'task'));
          });
        }
        
        // Categories
        if (data.categories && Array.isArray(data.categories)) {
          data.categories.forEach(category => {
            entities.push(createEntity('category', category, 'concept'));
          });
        }
        break;
      
      default:
        // Generic entity extraction
        Object.entries(data).forEach(([key, value]) => {
          if (value && typeof value === 'string' && value.length > 0) {
            let category = 'unknown';
            
            // Guess category based on key name
            if (key.includes('name') || key.includes('person') || key.includes('author')) {
              category = 'person';
            } else if (key.includes('date') || key.includes('time')) {
              category = 'temporal';
            } else if (key.includes('location') || key.includes('place')) {
              category = 'place';
            } else if (key.includes('concept') || key.includes('category')) {
              category = 'concept';
            }
            
            entities.push(createEntity(key, value, category));
          } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
              if (item && typeof item === 'string' && item.length > 0) {
                entities.push(createEntity(`${key}_${index}`, item, 'concept'));
              }
            });
          }
        });
    }
    
    return entities;
  }
  
  /**
   * Extract relationships between entities
   * @param {Array} entities - Extracted entities
   * @param {Object} processingResult - The processing result
   * @param {string} analysisType - Type of analysis performed
   * @returns {Promise<Array>} Extracted relationships
   */
  async extractRelationshipsFromAnalysis(entities, processingResult, analysisType) {
    const relationships = [];
    const data = processingResult.data || {};
    
    // Helper to find entity by type and category
    const findEntity = (type, category) => {
      return entities.find(e => e.type === type && e.category === category);
    };
    
    // Helper to find entities by category
    const findEntitiesByCategory = (category) => {
      return entities.filter(e => e.category === category);
    };
    
    // Helper to find entity by value
    const findEntityByValue = (value) => {
      return entities.find(e => e.value === value);
    };
    
    // Generate unique ID for relationship
    const createRelationship = (sourceId, targetId, type, label) => {
      return {
        id: `rel_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        sourceId,
        targetId,
        type,
        label,
        confidence: 0.8
      };
    };
    
    // Create relationships based on analysis type
    switch (analysisType) {
      case 'event':
        // Event -> Location
        const eventEntity = findEntity('event', 'event');
        const locationEntity = findEntity('location', 'place');
        
        if (eventEntity && locationEntity) {
          relationships.push(createRelationship(
            eventEntity.id,
            locationEntity.id,
            'location',
            'takes_place_at'
          ));
        }
        
        // Event -> Time
        const timeEntity = findEntity('date', 'temporal');
        if (eventEntity && timeEntity) {
          relationships.push(createRelationship(
            eventEntity.id,
            timeEntity.id,
            'temporal',
            'occurs_at'
          ));
        }
        
        // Organizer -> Event
        const organizerEntity = findEntityByValue(data.organizer);
        if (organizerEntity && eventEntity) {
          relationships.push(createRelationship(
            organizerEntity.id,
            eventEntity.id,
            'organization',
            'organizes'
          ));
        }
        
        // Attendees -> Event
        const attendeeEntities = findEntitiesByCategory('person');
        if (eventEntity) {
          attendeeEntities.forEach(attendee => {
            if (attendee.id !== organizerEntity?.id) {
              relationships.push(createRelationship(
                attendee.id,
                eventEntity.id,
                'participation',
                'attends'
              ));
            }
          });
        }
        
        // Child -> Event (if applicable)
        const childEntity = findEntityByValue(data.childName);
        if (childEntity && eventEntity) {
          relationships.push(createRelationship(
            childEntity.id,
            eventEntity.id,
            'participation',
            'participates_in'
          ));
        }
        break;
      
      case 'medical':
        // Patient -> Provider
        const patientEntity = findEntity('patient', 'person');
        const providerEntity = findEntity('provider', 'person');
        
        if (patientEntity && providerEntity) {
          relationships.push(createRelationship(
            patientEntity.id,
            providerEntity.id,
            'medical',
            'consulted_with'
          ));
        }
        
        // Patient -> Diagnosis
        const diagnosisEntity = findEntity('diagnosis', 'medical');
        if (patientEntity && diagnosisEntity) {
          relationships.push(createRelationship(
            patientEntity.id,
            diagnosisEntity.id,
            'medical',
            'diagnosed_with'
          ));
        }
        
        // Patient -> Medications
        const medicationEntities = entities.filter(e => e.type === 'medication');
        if (patientEntity) {
          medicationEntities.forEach(medication => {
            relationships.push(createRelationship(
              patientEntity.id,
              medication.id,
              'medical',
              'prescribed'
            ));
          });
        }
        
        // Provider -> Medications (prescribes)
        if (providerEntity) {
          medicationEntities.forEach(medication => {
            relationships.push(createRelationship(
              providerEntity.id,
              medication.id,
              'medical',
              'prescribes'
            ));
          });
        }
        
        // Diagnosis -> Treatment
        const treatmentEntity = findEntity('treatment', 'medical');
        if (diagnosisEntity && treatmentEntity) {
          relationships.push(createRelationship(
            diagnosisEntity.id,
            treatmentEntity.id,
            'medical',
            'treated_with'
          ));
        }
        break;
      
      case 'document':
        // Document -> Author
        const titleEntity = findEntity('title', 'document');
        const authorEntity = findEntity('author', 'person');
        
        if (titleEntity && authorEntity) {
          relationships.push(createRelationship(
            titleEntity.id,
            authorEntity.id,
            'attribution',
            'authored_by'
          ));
        }
        
        // Document -> Date
        const documentDateEntity = findEntity('date', 'temporal');
        if (titleEntity && documentDateEntity) {
          relationships.push(createRelationship(
            titleEntity.id,
            documentDateEntity.id,
            'temporal',
            'created_on'
          ));
        }
        
        // Document -> Keywords
        const keywordEntities = entities.filter(e => e.type === 'keyword');
        if (titleEntity) {
          keywordEntities.forEach(keyword => {
            relationships.push(createRelationship(
              titleEntity.id,
              keyword.id,
              'topic',
              'contains_topic'
            ));
          });
        }
        
        // Document -> Categories
        const categoryEntities = entities.filter(e => e.type === 'category');
        if (titleEntity) {
          categoryEntities.forEach(category => {
            relationships.push(createRelationship(
              titleEntity.id,
              category.id,
              'classification',
              'classified_as'
            ));
          });
        }
        break;
      
      case 'email':
        // Sender -> Recipients
        const senderEntity = entities.find(e => e.type === 'person' && e.value === data.sender);
        const recipientEntities = entities.filter(e => 
          e.type === 'person' && 
          data.recipients?.includes(e.value)
        );
        
        if (senderEntity) {
          recipientEntities.forEach(recipient => {
            relationships.push(createRelationship(
              senderEntity.id,
              recipient.id,
              'communication',
              'sent_to'
            ));
          });
        }
        
        // Email -> Subject
        const subjectEntity = findEntity('subject', 'concept');
        if (senderEntity && subjectEntity) {
          relationships.push(createRelationship(
            senderEntity.id,
            subjectEntity.id,
            'communication',
            'wrote_about'
          ));
        }
        
        // Email -> Action Items
        const actionEntities = entities.filter(e => e.type === 'action');
        if (senderEntity) {
          actionEntities.forEach(action => {
            relationships.push(createRelationship(
              senderEntity.id,
              action.id,
              'task',
              'requested'
            ));
            
            // Recipients -> Action Items (assigned_to)
            recipientEntities.forEach(recipient => {
              relationships.push(createRelationship(
                action.id,
                recipient.id,
                'assignment',
                'assigned_to'
              ));
            });
          });
        }
        break;
      
      default:
        // Create generic relationships based on entity categories
        const personEntities = findEntitiesByCategory('person');
        const placeEntities = findEntitiesByCategory('place');
        const conceptEntities = findEntitiesByCategory('concept');
        const temporalEntities = findEntitiesByCategory('temporal');
        
        // People -> Places
        personEntities.forEach(person => {
          placeEntities.forEach(place => {
            relationships.push(createRelationship(
              person.id,
              place.id,
              'location',
              'associated_with'
            ));
          });
        });
        
        // People -> Concepts
        personEntities.forEach(person => {
          conceptEntities.forEach(concept => {
            relationships.push(createRelationship(
              person.id,
              concept.id,
              'interest',
              'interested_in'
            ));
          });
        });
        
        // Connect all entities to temporal entities
        if (temporalEntities.length > 0) {
          const primaryTemporal = temporalEntities[0];
          entities.forEach(entity => {
            if (entity.category !== 'temporal' && entity.id !== primaryTemporal.id) {
              relationships.push(createRelationship(
                entity.id,
                primaryTemporal.id,
                'temporal',
                'occurred_at'
              ));
            }
          });
        }
    }
    
    return relationships;
  }
  
  /**
   * Extract temporal context from processing results
   * @param {Array} entities - Extracted entities
   * @param {Object} processingResult - The processing result
   * @param {string} analysisType - Type of analysis performed
   * @returns {Promise<void>}
   */
  async extractTemporalContext(entities, processingResult, analysisType) {
    const data = processingResult.data || {};
    
    // Look for temporal information in the data
    let temporalValue = null;
    
    // Check common fields for dates
    if (data.dateTime) temporalValue = data.dateTime;
    else if (data.date) temporalValue = data.date;
    else if (data.createdAt) temporalValue = data.createdAt;
    else if (data.timestamp) temporalValue = data.timestamp;
    
    // If no temporal information is found, use current date
    if (!temporalValue) {
      temporalValue = new Date().toISOString();
    }
    
    // Check if we already have a temporal entity
    const hasTemporalEntity = entities.some(e => e.category === 'temporal');
    
    // If not, add one
    if (!hasTemporalEntity) {
      entities.push({
        id: `entity_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: 'date',
        value: temporalValue,
        category: 'temporal',
        confidence: 0.7
      });
    }
  }
  
  /**
   * Store entities and relationships in the knowledge graph
   * @param {Object} knowledgeGraph - The extracted knowledge graph
   * @param {string} familyId - ID of the family
   * @param {string} userId - ID of the user
   * @returns {Promise<void>}
   */
  async storeInKnowledgeGraph(knowledgeGraph, familyId, userId) {
    try {
      if (!knowledgeGraph || !knowledgeGraph.entities || !familyId) return;
      
      // Add entities to the family knowledge graph
      for (const entity of knowledgeGraph.entities) {
        await this.knowledgeGraph.addEntity(
          familyId,
          entity.type,
          entity.value,
          entity.category,
          {
            confidence: entity.confidence,
            createdBy: userId,
            createdAt: new Date().toISOString()
          }
        );
      }
      
      // Add relationships to the family knowledge graph
      for (const relationship of knowledgeGraph.relationships) {
        // Find source and target entities
        const sourceEntity = knowledgeGraph.entities.find(e => e.id === relationship.sourceId);
        const targetEntity = knowledgeGraph.entities.find(e => e.id === relationship.targetId);
        
        if (sourceEntity && targetEntity) {
          await this.knowledgeGraph.addRelationship(
            familyId,
            sourceEntity.type,
            sourceEntity.value,
            targetEntity.type,
            targetEntity.value,
            relationship.type,
            relationship.label,
            {
              confidence: relationship.confidence,
              createdBy: userId,
              createdAt: new Date().toISOString()
            }
          );
        }
      }
    } catch (error) {
      console.error('Error storing in knowledge graph:', error);
    }
  }
  
  /**
   * Store processing result in the database
   * @param {Object} result - The processing result
   * @param {string} familyId - ID of the family
   * @param {string} userId - ID of the user
   * @param {boolean} isBatch - Whether this is a batch result
   * @returns {Promise<void>}
   */
  async storeProcessingResult(result, familyId, userId, isBatch = false) {
    try {
      if (!result || !result.processingId) return;
      
      // Create a storage reference for the processing result
      const resultRef = db.collection('multimodalProcessing').doc(result.processingId);
      
      // Store basic result metadata
      await resultRef.set({
        id: result.processingId,
        familyId: familyId || null,
        userId: userId || null,
        timestamp: new Date().toISOString(),
        analysisType: result.analysisType || 'unknown',
        fileInfo: result.fileInfo || null,
        isBatch: isBatch,
        batchId: result.batchId || null
      });
      
      // Store the analysis data in a subcollection
      if (result.results?.analysis) {
        await resultRef.collection('data').doc('analysis').set(result.results.analysis);
      }
      
      // Store text content in a subcollection
      if (result.results?.textContent) {
        await resultRef.collection('data').doc('textContent').set({
          content: result.results.textContent
        });
      }
      
      // Process knowledge graph data if available
      if (result.results?.analysis?.data && familyId) {
        // Extract entities and relationships if not already done
        if (result.analysisType === 'knowledgeGraph') {
          // Knowledge graph data is already in the result
          const knowledgeGraph = result.results.analysis.data;
          await this.storeInKnowledgeGraph(knowledgeGraph, familyId, userId);
        } else if (this.analysisCapabilities[result.analysisType]?.knowledgeGraphMappings) {
          // Extract knowledge graph data
          const knowledgeGraph = await this.extractKnowledgeGraph(
            result.results.analysis,
            result.analysisType
          );
          
          await this.storeInKnowledgeGraph(knowledgeGraph, familyId, userId);
          
          // Store the extracted knowledge graph
          await resultRef.collection('data').doc('knowledgeGraph').set(knowledgeGraph);
        }
      }
      
      // For document type, process with understanding pipeline if family ID is provided
      if (result.analysisType === 'document' && familyId && result.results?.analysis?.data) {
        try {
          // Create a document object
          const document = {
            id: result.processingId,
            title: result.results.analysis.data.title || result.fileInfo?.name || 'Untitled',
            type: 'document',
            fileType: result.fileInfo?.type || 'unknown',
            createdAt: new Date().toISOString(),
            familyId,
            userId
          };
          
          // Process with understanding pipeline
          await MultimodalUnderstandingPipeline.processDocument(
            document,
            result.results
          );
        } catch (error) {
          console.error('Error processing document with understanding pipeline:', error);
        }
      }
    } catch (error) {
      console.error('Error storing processing result:', error);
    }
  }
  
  /**
   * Convert a document to text
   * @param {File} file - The document file
   * @param {ArrayBuffer} content - The file content
   * @returns {Promise<string>} The extracted text
   */
  async convertDocumentToText(file, content) {
    // This is a simplified implementation
    // In a real implementation, this would use appropriate libraries for different file types
    
    // For PDFs, this would use a PDF parsing library with OCR capabilities
    // For Word docs, this would use a Word parsing library
    
    // For this demo, we'll return a placeholder
    return `Extracted text from ${file.name} (${file.type})
    
This is a simplified text extraction. In a real implementation, the full document text would be extracted and processed.`;
  }
  
  /**
   * Parse ICS content to extract events
   * @param {string} icsContent - The ICS file content
   * @returns {Array<Object>} Array of extracted events
   */
  parseIcsContent(icsContent) {
    // This is a simplified implementation
    // In a real implementation, this would use a proper ICS parsing library
    
    const events = [];
    
    // Simple regex-based parsing (not robust, just for demo)
    const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
    const summaryRegex = /SUMMARY:(.*?)(?:\r\n|\n)/;
    const dtStartRegex = /DTSTART(?:;.+?)?:(.*?)(?:\r\n|\n)/;
    const dtEndRegex = /DTEND(?:;.+?)?:(.*?)(?:\r\n|\n)/;
    const locationRegex = /LOCATION:(.*?)(?:\r\n|\n)/;
    const descriptionRegex = /DESCRIPTION:(.*?)(?:\r\n|\n)/;
    
    let match;
    while ((match = eventRegex.exec(icsContent)) !== null) {
      const eventContent = match[1];
      
      const summary = (summaryRegex.exec(eventContent) || [])[1] || '';
      const start = (dtStartRegex.exec(eventContent) || [])[1] || '';
      const end = (dtEndRegex.exec(eventContent) || [])[1] || '';
      const location = (locationRegex.exec(eventContent) || [])[1] || '';
      const description = (descriptionRegex.exec(eventContent) || [])[1] || '';
      
      events.push({
        summary,
        start,
        end,
        location,
        description
      });
    }
    
    return events;
  }
  
  /**
   * Parse email content
   * @param {string} emailContent - The email content
   * @returns {Object} Parsed email data
   */
  parseEmailContent(emailContent) {
    // This is a simplified implementation
    // In a real implementation, this would use a proper email parsing library
    
    // Simple regex-based parsing (not robust, just for demo)
    const fromRegex = /From: (.*?)(?:\r\n|\n)/;
    const toRegex = /To: (.*?)(?:\r\n|\n)/;
    const subjectRegex = /Subject: (.*?)(?:\r\n|\n)/;
    const dateRegex = /Date: (.*?)(?:\r\n|\n)/;
    
    const from = (fromRegex.exec(emailContent) || [])[1] || '';
    const to = (toRegex.exec(emailContent) || [])[1] || '';
    const subject = (subjectRegex.exec(emailContent) || [])[1] || '';
    const date = (dateRegex.exec(emailContent) || [])[1] || '';
    
    // Simple body extraction (everything after the headers)
    const bodyStart = emailContent.indexOf('\n\n');
    const body = bodyStart !== -1 ? emailContent.substring(bodyStart + 2) : '';
    
    return {
      from,
      to,
      subject,
      date,
      body
    };
  }
  
  /**
   * Get a human-readable name for an analysis type
   * @param {string} analysisType - The analysis type
   * @returns {string} Human-readable name
   */
  getTypeName(analysisType) {
    switch (analysisType) {
      case 'event':
        return 'events';
      case 'medical':
        return 'medical documents';
      case 'document':
        return 'text documents';
      case 'email':
        return 'email messages';
      case 'knowledgeGraph':
        return 'knowledge graphs';
      default:
        return 'content';
    }
  }
  
  /**
   * Extract a knowledge graph directly from text content
   * @param {string} content - Text content to analyze
   * @param {Object} options - Extraction options
   * @returns {Promise<Object>} Extracted knowledge graph
   */
  async extractKnowledgeGraphFromContent(content, options = {}) {
    try {
      if (!content || typeof content !== 'string') {
        return {
          success: false,
          error: 'Invalid content provided'
        };
      }
      
      // Prepare context information
      const context = options.context || {};
      
      // Get prompt for knowledge graph analysis
      const prompt = this.getPromptForAnalysis('knowledgeGraph', context, content);
      
      // Call Claude with the text
      const claudeResponse = await this.claudeService.sendMessage(prompt);
      
      // Process Claude's response
      const result = this.processClaudeResponse(claudeResponse, 'knowledgeGraph');
      
      // Return the knowledge graph data
      return {
        success: true,
        knowledgeGraph: result.data,
        confidence: result.confidence
      };
    } catch (error) {
      console.error('Error extracting knowledge graph from content:', error);
      return {
        success: false,
        error: error.message || 'An error occurred'
      };
    }
  }
}

export default new MultimodalUnderstandingService();