// src/services/DocumentProcessingService.js
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, query, where, getDocs, getDoc, doc, updateDoc, serverTimestamp, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { db, storage, auth } from './firebase';
import QuantumKnowledgeGraph from './QuantumKnowledgeGraph';

class DocumentProcessingService {
  constructor() {
    this.supportedDocumentTypes = {
      'application/pdf': 'pdf',
      'image/jpeg': 'image',
      'image/png': 'image',
      'image/gif': 'image',
      'image/heic': 'image',
      'application/msword': 'document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'document',
      'application/vnd.ms-excel': 'spreadsheet',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'spreadsheet',
      'text/plain': 'text',
      'text/csv': 'csv',
      'application/json': 'json'
    };
    
    this.categoryKeywords = {
      'medical': ['doctor', 'hospital', 'clinic', 'prescription', 'medication', 'treatment', 'diagnosis', 'patient', 'healthcare', 'medical', 'appointment', 'physician', 'pediatrician', 'dentist', 'therapy'],
      'school': ['school', 'classroom', 'teacher', 'student', 'homework', 'assignment', 'grade', 'report card', 'education', 'project', 'syllabus', 'curriculum', 'class', 'course', 'academic'],
      'financial': ['invoice', 'receipt', 'payment', 'bill', 'tax', 'finance', 'account', 'statement', 'expense', 'income', 'budget', 'credit', 'debit', 'transaction', 'money'],
      'legal': ['contract', 'agreement', 'legal', 'law', 'attorney', 'court', 'document', 'terms', 'conditions', 'policy', 'consent', 'license', 'certificate', 'permit', 'authorization'],
      'event': ['invitation', 'event', 'party', 'celebration', 'ceremony', 'wedding', 'birthday', 'anniversary', 'graduation', 'concert', 'festival', 'occasion', 'gathering', 'rsvp'],
      'identification': ['passport', 'license', 'id', 'identification', 'certificate', 'card', 'social security', 'birth', 'insurance', 'identity'],
      'activity': ['schedule', 'itinerary', 'program', 'activity', 'plan', 'calendar', 'agenda', 'timetable', 'roster', 'schedule', 'sport', 'club', 'team', 'class', 'lesson']
    };
  }

  /**
   * Main entry point for processing documents
   * @param {File} file - The document file
   * @param {string} familyId - Family ID
   * @param {string} userId - User ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Processing result with metadata
   */
  async processDocument(file, familyId, userId, options = {}) {
    try {
      console.log(`📄 Processing document: ${file.name} (${file.type}) for family ${familyId}`);
      console.log(`File details: size=${file.size} bytes, type=${file.type}`);
      
      // Step 1: Validate the document
      const validationResult = this.validateDocument(file);
      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }
      
      // Step 2: Preprocess the document
      const preprocessed = await this.preprocessDocument(file);
      
      // Step 3: Extract content via OCR if needed
      let textContent = null;
      let metadata = {};
      let pageImages = null;
      
      if (this.needsOCR(file)) {
        const ocrResult = await this.extractTextFromDocument(preprocessed.file);
        textContent = ocrResult.text;
        metadata = { ...metadata, ...ocrResult.metadata };
        pageImages = ocrResult.pageImages; // Store page images for later processing
      }
      
      // Step 4: Categorize the document
      const category = await this.categorizeDocument(file, textContent);
      
      // Step 5: Extract entities
      const entities = await this.extractEntities(file, textContent, category);
      
      // Step 6: Store the document
      const storagePath = `family-documents/${familyId}/${category}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      console.log(`📤 Uploading to Firebase Storage: ${storagePath}`);
      
      // Upload the original file
      await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`✅ Upload complete. URL: ${downloadURL}`);
      
      // Step 6b: Upload page images to Storage if they exist
      let pageImageUrls = [];
      if (pageImages && pageImages.length > 0) {
        console.log(`📤 Uploading ${pageImages.length} page images to Storage...`);
        
        for (let i = 0; i < pageImages.length; i++) {
          const pageImage = pageImages[i];
          // Convert base64 to blob if needed
          const imageBlob = await this.base64ToBlob(pageImage);
          const pageImagePath = `family-documents/${familyId}/${category}/pages/${Date.now()}_${file.name}_page_${i + 1}.png`;
          const pageImageRef = ref(storage, pageImagePath);
          
          await uploadBytes(pageImageRef, imageBlob);
          const pageImageUrl = await getDownloadURL(pageImageRef);
          pageImageUrls.push(pageImageUrl);
          console.log(`✅ Page ${i + 1} uploaded`);
        }
      }
      
      // Step 7: Save metadata to Firestore with reviewed=false for inbox
      const documentData = {
        title: options.customTitle || file.name,
        description: options.description || this.generateDescription(category, entities),
        category,
        childId: options.childId || null,
        familyId,
        fileName: file.name,
        filePath: storagePath,
        fileUrl: downloadURL,
        fileType: file.type,
        fileSize: file.size,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
        extractedText: textContent ? textContent.substring(0, 10000) : '', // Limit text to 10k chars
        entities,
        tags: this.generateTags(category, entities),
        metadata: {
          ...metadata,
          processingVersion: '1.0',
          processingTimestamp: new Date().toISOString(),
          pageCount: pageImageUrls.length
        },
        pageImageUrls: pageImageUrls, // Store URLs instead of actual images
        reviewed: false, // Start as unreviewed in inbox
        status: 'pending', // Status for processing
        source: 'upload' // Source of the document
      };
      
      const docRef = await addDoc(collection(db, "familyDocuments"), documentData);
      
      // Add document ID to the result
      documentData.id = docRef.id;
      
      // Step 8: Auto-process with Claude AI
      try {
        await this.autoProcessWithAI(docRef.id, documentData, familyId);
      } catch (aiError) {
        console.error("Error in AI processing:", aiError);
        // Continue even if AI processing fails
      }
      
      // Step 9: Add to Knowledge Graph
      try {
        await this.addToKnowledgeGraph(docRef.id, documentData, familyId);
      } catch (kgError) {
        console.error("Error adding document to knowledge graph:", kgError);
        // Continue even if KG fails - document is still saved
      }
      
      // Return the processed document data
      return {
        success: true,
        documentId: docRef.id,
        documentData
      };
    } catch (error) {
      console.error("Error processing document:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate the document type and size
   * @param {File} file - The document file
   * @returns {Object} Validation result
   */
  validateDocument(file) {
    // Check file size (20MB max)
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB in bytes
    if (file.size > MAX_SIZE) {
      return {
        valid: false,
        error: `File too large. Maximum size is 20MB.`
      };
    }
    
    // Check file type
    if (!this.supportedDocumentTypes[file.type]) {
      return {
        valid: false,
        error: `Unsupported file type: ${file.type}`
      };
    }
    
    return { valid: true };
  }

  /**
   * Preprocess the document (resize, compress, etc.)
   * @param {File} file - The document file
   * @returns {Promise<Object>} Preprocessed document
   */
  async preprocessDocument(file) {
    // For image files, we might want to resize or compress them
    if (file.type.startsWith('image/')) {
      try {
        // Try to compress/resize the image if it's large
        if (file.size > 2000000) { // 2MB
          console.log("Image is large, applying compression");
          
          // Read file as data URL
          const fileReader = new FileReader();
          const imageDataPromise = new Promise((resolve, reject) => {
            fileReader.onload = () => resolve(fileReader.result);
            fileReader.onerror = reject;
            fileReader.readAsDataURL(file);
          });
          
          const imageData = await imageDataPromise;
          
          // Create an image element to load the image
          const img = new Image();
          const loadPromise = new Promise((resolve) => {
            img.onload = () => resolve();
            img.src = imageData;
          });
          
          await loadPromise;
          
          // Create a canvas to resize/compress
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1600px on longest side)
          const maxDimension = 1600;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw resized image on canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to Blob with reduced quality
          const canvasDataPromise = new Promise((resolve) => {
            canvas.toBlob((blob) => {
              resolve(blob);
            }, file.type, 0.7); // Use 70% quality
          });
          
          const compressedBlob = await canvasDataPromise;
          
          // Create a new file from the blob
          const compressedFile = new File([compressedBlob], file.name, {
            type: file.type,
            lastModified: file.lastModified
          });
          
          return {
            file: compressedFile,
            processed: true,
            reason: "Image compressed and resized",
            originalSize: file.size,
            newSize: compressedFile.size
          };
        }
      } catch (error) {
        console.error("Error preprocessing image:", error);
        // Fall through to default return if compression fails
      }
      
      // If no compression needed or compression failed, return original
      return {
        file,
        processed: false,
        reason: "No processing needed or compression failed"
      };
    }
    
    // For other file types, return as is
    return {
      file,
      processed: false,
      reason: "No processing needed for this file type"
    };
  }

  /**
   * Determine if a file needs OCR processing
   * @param {File} file - The document file
   * @returns {boolean} Whether OCR is needed
   */
  needsOCR(file) {
    // Images and PDFs typically need OCR
    return file.type.startsWith('image/') || file.type === 'application/pdf';
  }

  /**
   * Extract text content from a document using OCR
   * @param {File} file - The document file
   * @returns {Promise<Object>} Extracted text and metadata
   */
  async extractTextFromDocument(file) {
    try {
      // Use DocumentOCRService to extract text
      const { default: DocumentOCRService } = await import('./DocumentOCRService');
      console.log("Extracting text from document:", file.name);
      
      // Extract text from the document using OCR service
      const ocrResult = await DocumentOCRService.processDocument(file);
      
      // Check if we have page images (from scanned PDFs)
      if (ocrResult.pageImages && ocrResult.pageImages.length > 0) {
        console.log(`Found ${ocrResult.pageImages.length} page images to process with vision API`);
        
        // We'll handle the vision processing in the AI processing step
        // For now, just pass along the page images
        return {
          text: ocrResult.text || '',
          pageImages: ocrResult.pageImages,
          metadata: {
            ocrEngine: 'PDF to Image Conversion',
            confidence: ocrResult.metadata?.confidence || 0.7,
            processingTime: ocrResult.metadata?.processingTime || 500,
            hasPageImages: true,
            imageCount: ocrResult.pageImages.length
          }
        };
      }
      
      return {
        text: ocrResult.text,
        pageImages: [], // Return empty array instead of undefined
        metadata: {
          ocrEngine: ocrResult.metadata?.method || 'Cloud OCR',
          confidence: ocrResult.metadata?.confidence || 0.9,
          processingTime: ocrResult.metadata?.processingTime || 500
        }
      };
    } catch (error) {
      console.error("Error in extractTextFromDocument:", error);
      
      // Fallback if DocumentOCRService fails
      return {
        text: `Document content for ${file.name}. Unfortunately, OCR extraction encountered an error.`,
        pageImages: [], // Return empty array instead of undefined
        metadata: {
          ocrEngine: 'Fallback extractor',
          confidence: 0.5,
          processingTime: 0,
          error: error.message
        }
      };
    }
  }

  /**
   * Categorize a document based on its content and metadata
   * @param {File} file - The document file
   * @param {string} textContent - Extracted text content
   * @returns {Promise<string>} Document category
   */
  async categorizeDocument(file, textContent) {
    // First, try to categorize based on filename
    const filename = file.name.toLowerCase();
    
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      for (const keyword of keywords) {
        if (filename.includes(keyword)) {
          return category;
        }
      }
    }
    
    // Next, try to categorize based on text content
    if (textContent) {
      const textLower = textContent.toLowerCase();
      
      for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
        for (const keyword of keywords) {
          if (textLower.includes(keyword)) {
            return category;
          }
        }
      }
    }
    
    // Default category based on file type
    if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.type.includes('pdf')) {
      return 'document';
    } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
      return 'spreadsheet';
    } else if (file.type.includes('word') || file.type.includes('document')) {
      return 'document';
    }
    
    // Fallback category
    return 'other';
  }

  /**
   * Extract entities from document content
   * @param {File} file - The document file
   * @param {string} textContent - Extracted text content
   * @param {string} category - Document category
   * @returns {Promise<Object>} Extracted entities
   */
  async extractEntities(file, textContent, category) {
    // This would ideally use a more sophisticated entity extraction service
    // For now, we'll use basic regex patterns for common entities
    
    const entities = {};
    
    if (!textContent) {
      return entities;
    }
    
    // Extract dates
    const datePatterns = [
      /\b\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}\b/g, // MM/DD/YYYY, DD.MM.YYYY, etc.
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b/g // January 1, 2022, etc.
    ];
    
    entities.dates = [];
    for (const pattern of datePatterns) {
      const matches = textContent.match(pattern);
      if (matches) {
        entities.dates.push(...matches);
      }
    }
    
    // Extract names
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g; // Simple pattern for "First Last"
    entities.names = textContent.match(namePattern) || [];
    
    // Extract email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    entities.emails = textContent.match(emailPattern) || [];
    
    // Extract phone numbers
    const phonePattern = /\b\(?(?:\d{3})\)?[-.\s]?(?:\d{3})[-.\s]?(?:\d{4})\b/g;
    entities.phones = textContent.match(phonePattern) || [];
    
    // Extract addresses (simplified)
    const addressPattern = /\b\d+ [A-Za-z]+ (?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane)\b.+/g;
    entities.addresses = textContent.match(addressPattern) || [];
    
    // Category-specific entities
    if (category === 'medical') {
      // Extract medical terms (simplified)
      const medicalPattern = /\b(?:diagnosis|treatment|prescription|medication|dose|mg|ml|appointment|referral|doctor|physician|patient)\b/g;
      entities.medicalTerms = textContent.match(medicalPattern) || [];
    } else if (category === 'school') {
      // Extract education terms
      const educationPattern = /\b(?:grade|class|teacher|student|assignment|homework|project|exam|test|quiz|report card|course)\b/g;
      entities.educationTerms = textContent.match(educationPattern) || [];
    } else if (category === 'event') {
      // Extract event details
      const eventPattern = /\b(?:event|party|celebration|ceremony|wedding|birthday|anniversary|graduation|invitation|rsvp)\b/g;
      entities.eventTerms = textContent.match(eventPattern) || [];
    }
    
    // Extract action items (things that need to be done)
    const actionItemIndicators = [
      /(?:need to|must|should|please|required to|have to|make sure to|don't forget to|remember to)\s+([^.!?]+)/gi,
      /(?:action item|todo|task):\s*([^.!?\n]+)/gi,
      /(?:□|\[\s*\]|\*)\s*([^.!?\n]+)/gi, // Checkboxes and bullet points
      /(?:\d+\.)\s*([^.!?\n]+)(?=\n\d+\.|$)/gi // Numbered lists
    ];
    
    entities.actionItems = [];
    for (const pattern of actionItemIndicators) {
      const matches = textContent.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].trim().length > 5 && match[1].trim().length < 200) {
          entities.actionItems.push(match[1].trim());
        }
      }
    }
    
    // Deduplicate action items
    entities.actionItems = [...new Set(entities.actionItems)];
    
    return entities;
  }

  /**
   * Generate a description based on category and entities
   * @param {string} category - Document category
   * @param {Object} entities - Extracted entities
   * @returns {string} Generated description
   */
  generateDescription(category, entities) {
    let description = `${category.charAt(0).toUpperCase() + category.slice(1)} document`;
    
    if (entities.dates && entities.dates.length > 0) {
      description += ` from ${entities.dates[0]}`;
    }
    
    if (entities.names && entities.names.length > 0) {
      description += ` involving ${entities.names[0]}`;
    }
    
    if (category === 'medical' && entities.medicalTerms && entities.medicalTerms.length > 0) {
      description += ` related to ${entities.medicalTerms[0]}`;
    } else if (category === 'school' && entities.educationTerms && entities.educationTerms.length > 0) {
      description += ` related to ${entities.educationTerms[0]}`;
    } else if (category === 'event' && entities.eventTerms && entities.eventTerms.length > 0) {
      description += ` for ${entities.eventTerms[0]}`;
    }
    
    return description;
  }

  /**
   * Generate tags based on category and entities
   * @param {string} category - Document category
   * @param {Object} entities - Extracted entities
   * @returns {Array} Generated tags
   */
  generateTags(category, entities) {
    const tags = [category];
    
    // Add tags based on entities
    if (entities.dates && entities.dates.length > 0) {
      try {
        const date = new Date(entities.dates[0]);
        tags.push(`${date.getFullYear()}`);
        tags.push(`${date.toLocaleString('default', { month: 'long' })}`);
      } catch (e) {
        // If we can't parse the date, just use it as is
        tags.push(entities.dates[0]);
      }
    }
    
    // Add category-specific tags
    if (category === 'medical') {
      tags.push('health');
      if (entities.medicalTerms) {
        entities.medicalTerms.slice(0, 3).forEach(term => tags.push(term));
      }
    } else if (category === 'school') {
      tags.push('education');
      if (entities.educationTerms) {
        entities.educationTerms.slice(0, 3).forEach(term => tags.push(term));
      }
    } else if (category === 'event') {
      tags.push('social');
      if (entities.eventTerms) {
        entities.eventTerms.slice(0, 3).forEach(term => tags.push(term));
      }
    }
    
    // Remove duplicates and return
    return [...new Set(tags)];
  }

  /**
   * Search for documents matching criteria
   * @param {string} familyId - Family ID
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} Matching documents
   */
  async searchDocuments(familyId, filters = {}) {
    try {
      let q = query(collection(db, "familyDocuments"), where("familyId", "==", familyId));
      
      // Apply additional filters
      if (filters.category) {
        q = query(q, where("category", "==", filters.category));
      }
      
      if (filters.childId) {
        q = query(q, where("childId", "==", filters.childId));
      }
      
      // Execute the query
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // Apply text search if specified (client-side filtering)
      if (filters.searchText && filters.searchText.trim() !== '') {
        const searchTerms = filters.searchText.toLowerCase().split(' ');
        
        return documents.filter(doc => {
          const searchableText = `
            ${doc.title?.toLowerCase() || ''} 
            ${doc.description?.toLowerCase() || ''} 
            ${doc.extractedText?.toLowerCase() || ''} 
            ${doc.tags?.join(' ')?.toLowerCase() || ''}
          `;
          
          return searchTerms.every(term => searchableText.includes(term));
        });
      }
      
      return documents;
    } catch (error) {
      console.error("Error searching documents:", error);
      throw error;
    }
  }

  /**
   * Get recent documents for a family
   * @param {string} familyId - Family ID
   * @param {number} limit - Maximum number of documents to return
   * @returns {Promise<Array>} Recent documents
   */
  async getRecentDocuments(familyId, limit = 10) {
    try {
      const q = query(
        collection(db, "familyDocuments"), 
        where("familyId", "==", familyId),
        orderBy("uploadedAt", "desc"),
        limit(limit)
      );
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return documents;
    } catch (error) {
      console.error("Error getting recent documents:", error);
      throw error;
    }
  }

  /**
   * Update document metadata
   * @param {string} documentId - Document ID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Update result
   */
  async updateDocumentMetadata(documentId, updates) {
    try {
      const docRef = doc(db, "familyDocuments", documentId);
      
      // Prepare updates with timestamp
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, updateData);
      
      return { success: true, documentId };
    } catch (error) {
      console.error("Error updating document metadata:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Associate document with a child
   * @param {string} documentId - Document ID
   * @param {string} childId - Child ID
   * @returns {Promise<Object>} Result
   */
  async associateDocumentWithChild(documentId, childId) {
    return this.updateDocumentMetadata(documentId, { childId });
  }

  /**
   * Get all documents associated with a child
   * @param {string} familyId - Family ID
   * @param {string} childId - Child ID
   * @returns {Promise<Array>} Child's documents
   */
  async getChildDocuments(familyId, childId) {
    try {
      const q = query(
        collection(db, "familyDocuments"),
        where("familyId", "==", familyId),
        where("childId", "==", childId)
      );
      
      const querySnapshot = await getDocs(q);
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return documents;
    } catch (error) {
      console.error("Error getting child documents:", error);
      throw error;
    }
  }

  /**
   * Add document to the Family Knowledge Graph
   * @param {string} documentId - Document ID
   * @param {Object} documentData - Document metadata
   * @param {string} familyId - Family ID
   */
  async addToKnowledgeGraph(documentId, documentData, familyId) {
    try {
      // Create document entity with correct method signature
      const documentEntity = await QuantumKnowledgeGraph.addEntity(
        familyId,
        `document_${documentId}`,
        'document',
        {
          title: documentData.title,
          category: documentData.category,
          fileName: documentData.fileName,
          fileUrl: documentData.fileUrl,
          uploadedAt: documentData.uploadedAt,
          extractedText: documentData.extractedText?.substring(0, 500), // Store preview
          tags: documentData.tags
        }
      );

      // Create relationships based on extracted entities
      if (documentData.entities) {
        // Link to child if specified
        if (documentData.childId) {
          await QuantumKnowledgeGraph.addRelationship(
            familyId,
            `document_${documentId}`,
            `person_${documentData.childId}`,
            'related_to',
            {
              context: 'document_owner',
              relationship: 'belongs_to'
            }
          );
        }

        // Link to mentioned people
        if (documentData.entities.names && documentData.entities.names.length > 0) {
          // Try to match names with family members
          const familyMembers = await this.getFamilyMembers(familyId);
          
          for (const name of documentData.entities.names) {
            const matchedMember = familyMembers.find(member => 
              member.name.toLowerCase().includes(name.toLowerCase()) ||
              name.toLowerCase().includes(member.name.toLowerCase())
            );
            
            if (matchedMember) {
              await QuantumKnowledgeGraph.addRelationship(
                familyId,
                `document_${documentId}`,
                `person_${matchedMember.id}`,
                'mentions',
                {
                  context: 'name_mention'
                }
              );
            }
          }
        }

        // Create event entities from dates
        if (documentData.entities.dates && documentData.entities.dates.length > 0) {
          for (const dateStr of documentData.entities.dates) {
            // Parse date and check if it's in the future
            const date = new Date(dateStr);
            if (date > new Date() && !isNaN(date)) {
              // Create an event entity for future dates
              const eventEntity = await QuantumKnowledgeGraph.addEntity(
                familyId,
                `event_doc_${documentId}_${date.getTime()}`,
                'event',
                {
                  title: `Event from ${documentData.title}`,
                  date: date.toISOString(),
                  source: 'document',
                  documentId: documentId
                }
              );

              // Link document to event
              await QuantumKnowledgeGraph.addRelationship(
                familyId,
                `document_${documentId}`,
                eventEntity.id,
                'contains_event',
                {
                  extractedDate: dateStr
                }
              );
            }
          }
        }

        // Create provider entities for medical documents
        if (documentData.category === 'medical' && documentData.entities.medicalTerms) {
          // Look for provider names in the document
          const providerIndicators = ['dr.', 'doctor', 'md', 'clinic', 'hospital', 'center'];
          const text = (documentData.extractedText || '').toLowerCase();
          
          for (const indicator of providerIndicators) {
            if (text.includes(indicator)) {
              // Extract provider name (simple heuristic)
              const regex = new RegExp(`(dr\\.?\\s+\\w+\\s+\\w+|\\w+\\s+${indicator})`, 'gi');
              const matches = text.match(regex);
              
              if (matches) {
                for (const match of matches) {
                  const providerEntity = await QuantumKnowledgeGraph.addEntity(
                    familyId,
                    `provider_doc_${documentId}_${match.replace(/\s/g, '_')}`,
                    'provider',
                    {
                      name: match.trim(),
                      specialty: 'medical',
                      source: 'document',
                      documentId: documentId
                    }
                  );

                  // Link document to provider
                  await QuantumKnowledgeGraph.addRelationship(
                    familyId,
                    `document_${documentId}`,
                    providerEntity.id,
                    'mentions_provider',
                    {
                      context: 'medical_document'
                    }
                  );
                }
              }
            }
          }
        }

        // Create task entities for documents with action items
        if (documentData.entities.actionItems && documentData.entities.actionItems.length > 0) {
          for (const actionItem of documentData.entities.actionItems) {
            const taskEntity = await QuantumKnowledgeGraph.addEntity(
              familyId,
              `task_doc_${documentId}_${Date.now()}`,
              'task',
              {
                title: actionItem,
                source: 'document',
                documentId: documentId,
                category: documentData.category,
                created: new Date().toISOString()
              }
            );

            // Link document to task
            await QuantumKnowledgeGraph.addRelationship(
              familyId,
              `document_${documentId}`,
              taskEntity.id,
              'creates_task',
              {
                actionItem: actionItem
              }
            );
          }
        }
      }

      console.log(`✅ Document ${documentId} added to knowledge graph with relationships`);
      
      // Generate insights based on the new document
      await QuantumKnowledgeGraph.generateInsights(familyId);
      
    } catch (error) {
      console.error("Error adding document to knowledge graph:", error);
      throw error;
    }
  }

  /**
   * Helper method to get family members
   * @param {string} familyId - Family ID
   * @returns {Promise<Array>} Family members
   */
  async getFamilyMembers(familyId) {
    try {
      const familyDoc = await getDocs(query(
        collection(db, "families"),
        where("id", "==", familyId)
      ));
      
      if (!familyDoc.empty) {
        const familyData = familyDoc.docs[0].data();
        return familyData.members || [];
      }
      return [];
    } catch (error) {
      console.error("Error getting family members:", error);
      return [];
    }
  }

  /**
   * Build text analysis prompt
   * @param {Object} documentData - Document data
   * @returns {string} Text prompt
   */
  buildTextAnalysisPrompt(documentData) {
    return `Analyze this document and extract all relevant information:

Document Title: ${documentData.title}
Category: ${documentData.category}
Extracted Text:
${documentData.extractedText || 'No text content available'}

Please analyze and provide:
1. A brief summary of the document
2. Enhanced category classification (medical/school/financial/legal/activity/general)
3. All important dates with context (identify if they are appointments, deadlines, or events)
4. People mentioned - IMPORTANT: Look for patient names (especially children's names like "Lilly"), doctor names (Dr., MD, etc.), and any other people
5. Organizations/businesses mentioned (clinics, hospitals, medical centers)
6. Action items that need to be taken
7. Related contacts that should be created - Extract ALL doctor names with their credentials (MD, DO, etc.)
8. Calendar events that should be created
9. Key information to remember (vaccine types, dosages, medical record numbers, etc.)
10. Tags for easy searching

For medical documents like vaccine records:
- The patient name is usually at the top (look for "Patient:", "Name:", or similar)
- Doctor names often appear with "Dr." or medical credentials (MD, DO, NP, PA)
- Look for clinic/hospital contact information (phone numbers, addresses)

Return as JSON with the structure shown in the previous message.`;
  }

  /**
   * Convert PDF to images using canvas
   * @param {string} url - URL of the PDF
   * @returns {Promise<Array>} Array of base64 encoded images
   */
  async convertPDFToImages(url) {
    try {
      console.log('Converting PDF to images for OCR...');
      
      // For now, we'll return null since we need pdf.js library
      // In production, you'd use pdf.js to convert PDF pages to images
      console.log('PDF to image conversion requires pdf.js library');
      return null;
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      return null;
    }
  }

  /**
   * Convert URL to base64 string with compression
   * @param {string} url - URL of the image
   * @param {string} fileType - MIME type of the file
   * @returns {Promise<string>} Base64 encoded string
   */
  async getBase64FromUrl(url, fileType) {
    try {
      // Fetch the image
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Note: This method is only for regular images now, not PDFs
      // PDFs are handled separately with page image extraction
      if (fileType === 'application/pdf') {
        throw new Error('PDF files should be processed with page image extraction first.');
      }
      
      // For images, compress before converting
      const imageUrl = URL.createObjectURL(blob);
      const img = new Image();
      
      return new Promise((resolve, reject) => {
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions (max 1600px)
          const maxDimension = 1600;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with quality setting
          // Keep the original format if it's PNG, otherwise use JPEG
          const outputFormat = fileType === 'image/png' ? 'image/png' : 'image/jpeg';
          const quality = fileType === 'image/png' ? 1.0 : 0.8;
          
          canvas.toBlob((blob) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result.split(',')[1];
              resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          }, outputFormat, quality);
          
          URL.revokeObjectURL(imageUrl);
        };
        
        img.onerror = () => {
          URL.revokeObjectURL(imageUrl);
          reject(new Error('Failed to load image for compression'));
        };
        
        img.src = imageUrl;
      });
    } catch (error) {
      console.error('Error converting URL to base64:', error);
      throw error;
    }
  }

  /**
   * Convert base64 string to Blob
   * @param {string} base64 - Base64 string
   * @returns {Promise<Blob>} Blob object
   */
  async base64ToBlob(base64) {
    try {
      // Handle both data URL and raw base64
      let base64String = base64;
      let mimeType = 'image/png'; // Default mime type
      
      if (base64.startsWith('data:')) {
        const parts = base64.split(',');
        base64String = parts[1];
        // Extract mime type from data URL
        const mimeMatch = parts[0].match(/data:([^;]+)/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }
      
      // Convert base64 to binary
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mimeType });
    } catch (error) {
      console.error('Error converting base64 to blob:', error);
      // If conversion fails, return an empty image blob
      return new Blob([], { type: 'image/png' });
    }
  }

  /**
   * Auto-process document with Claude AI
   * @param {string} documentId - Document ID
   * @param {Object} documentData - Document data
   * @param {string} familyId - Family ID
   */
  async autoProcessWithAI(documentId, documentData, familyId) {
    try {
      console.log(`Starting AI processing for document ${documentId}`);
      
      // Import Claude service
      const { default: ClaudeService } = await import('./ClaudeService');
      const { default: CalendarService } = await import('./CalendarService');
      
      // Check if we have an image URL for vision processing
      let messages;
      const isScannedDocument = documentData.extractedText && documentData.extractedText.trim().length < 100;
      const isImageFile = documentData.fileType?.includes('image');
      const isPDF = documentData.fileType === 'application/pdf';
      const hasPageImages = documentData.pageImageUrls && documentData.pageImageUrls.length > 0;
      
      // Use vision for image files OR PDFs with extracted page images
      if ((documentData.fileUrl && isImageFile && !isPDF) || (isPDF && hasPageImages)) {
        console.log('🖼️ VISION MODE: Processing document with vision API');
        console.log('Document type:', documentData.fileType);
        console.log('File name:', documentData.fileName);
        console.log('Has page images:', hasPageImages);
        console.log('Page image count:', documentData.pageImageUrls?.length || 0);
        
        try {
          // Build content array for Claude
          const contentArray = [
            {
              type: 'text',
              text: `Analyze this document and extract all relevant information:

Document Title: ${documentData.title}
Category: ${documentData.category}

Please analyze and provide:
1. A brief summary of the document
2. Enhanced category classification (medical/school/financial/legal/activity/general)
3. All important dates with context (identify if they are appointments, deadlines, or events)
4. People mentioned - IMPORTANT: Look for patient names (especially children's names like "Lilly"), doctor names (Dr., MD, etc.), and any other people
5. Organizations/businesses mentioned (clinics, hospitals, medical centers)
6. Action items that need to be taken
7. Related contacts that should be created - Extract ALL doctor names with their credentials (MD, DO, etc.)
8. Calendar events that should be created
9. Key information to remember (vaccine types, dosages, medical record numbers, etc.)
10. Tags for easy searching

For medical documents like vaccine records:
- The patient name is usually at the top (look for "Patient:", "Name:", or similar)
- Doctor names often appear with "Dr." or medical credentials (MD, DO, NP, PA)
- Look for clinic/hospital contact information (phone numbers, addresses)

Return as JSON with this structure:
{
  "summary": "brief summary",
  "enhancedCategory": "category",
  "dates": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "description": "what this date is for",
      "isAppointment": true/false,
      "duration": 60
    }
  ],
  "people": [
    {
      "name": "person name",
      "role": "their role (doctor, teacher, etc.)",
      "organization": "where they work"
    }
  ],
  "organizations": [
    {
      "name": "org name",
      "type": "medical/school/business",
      "phone": "if found",
      "address": "if found"
    }
  ],
  "actionItems": [
    {
      "task": "what needs to be done",
      "dueDate": "YYYY-MM-DD if applicable",
      "priority": "high/medium/low"
    }
  ],
  "suggestedContacts": [
    {
      "name": "contact name",
      "type": "medical/education/service",
      "phone": "phone number",
      "email": "email",
      "organization": "organization name"
    }
  ],
  "suggestedEvents": [
    {
      "title": "event title",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "duration": 60,
      "location": "if mentioned",
      "attendees": ["family member names"]
    }
  ],
  "keyInfo": ["important fact 1", "important fact 2"],
  "tags": ["tag1", "tag2", "tag3"],
  "linkedDocuments": ["related document types"]
}`
            }
          ];
          
          // Add images to the content array
          if (isPDF && hasPageImages) {
            // For PDFs, add each page image
            console.log(`Adding ${documentData.pageImageUrls.length} PDF page images to vision request`);
            
            for (let i = 0; i < Math.min(documentData.pageImageUrls.length, 5); i++) { // Limit to 5 pages for API limits
              const pageImageUrl = documentData.pageImageUrls[i];
              console.log(`Fetching page ${i + 1} from URL for vision processing`);
              
              try {
                // Fetch image from URL and convert to base64
                const response = await fetch(pageImageUrl);
                const blob = await response.blob();
                const base64 = await new Promise((resolve, reject) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    const base64String = reader.result.split(',')[1];
                    resolve(base64String);
                  };
                  reader.onerror = reject;
                  reader.readAsDataURL(blob);
                });
                
                contentArray.push({
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/png',
                    data: base64
                  }
                });
              } catch (error) {
                console.error(`Error fetching page image ${i + 1}:`, error);
              }
            }
            
            if (documentData.pageImageUrls.length > 5) {
              contentArray[0].text += `\n\nNOTE: This PDF has ${documentData.pageImageUrls.length} pages. I'm showing you the first 5 pages.`;
            }
          } else if (isImageFile && documentData.fileUrl) {
            // For regular image files, convert from URL
            contentArray.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: documentData.fileType || 'image/jpeg',
                data: await this.getBase64FromUrl(documentData.fileUrl, documentData.fileType).catch(err => {
                  console.error('Error converting image to base64:', err);
                  throw new Error(`Failed to process image: ${err.message}`);
                })
              }
            });
          }
          
          messages = [{
            role: 'user',
            content: contentArray
          }];
        } catch (error) {
          console.error('Error preparing vision request, falling back to text analysis:', error);
          // Fall back to text-based analysis
          messages = [{
            role: 'user',
            content: this.buildTextAnalysisPrompt(documentData)
          }];
        }
      } else if (isPDF && isScannedDocument) {
        // For scanned PDFs with minimal text, use Claude to analyze what we have
        console.log('Scanned PDF detected with minimal text extraction');
        console.log('Extracted text:', documentData.extractedText);
        console.log('Filename:', documentData.fileName);
        
        // Use Claude to make intelligent inferences
        messages = [{
          role: 'user',
          content: `You are analyzing a scanned PDF document. The OCR extracted minimal text, but I need you to analyze what we have and make intelligent inferences.

Document Details:
- Title: ${documentData.title}
- Filename: ${documentData.fileName}
- Category: ${documentData.category}
- File size: ${documentData.fileSize} bytes
- Extracted Text (possibly incomplete): "${documentData.extractedText || 'No text extracted'}"

Based on the filename "${documentData.fileName}" which appears to be a ${documentData.category} document, please:

1. Identify what type of document this likely is
2. For this document type, what information is typically included
3. Extract any recognizable information from the partial text
4. Suggest appropriate actions and calendar events
5. Identify likely people/organizations involved

For example:
- If filename contains "vaccine", it's likely an immunization record
- If it contains a child's name, that child is likely the patient
- Medical documents often need follow-up appointments

Please provide a comprehensive analysis in the JSON format requested, using your knowledge of common document patterns to fill in likely information.

Return as JSON with this structure:
{
  "summary": "brief summary of what this document likely contains",
  "enhancedCategory": "medical/school/financial/legal/activity/general",
  "dates": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "description": "likely purpose of this date",
      "isAppointment": true/false,
      "duration": 60
    }
  ],
  "people": [
    {
      "name": "person name extracted or inferred",
      "role": "their likely role",
      "organization": "likely organization"
    }
  ],
  "organizations": [
    {
      "name": "org name",
      "type": "medical/school/business",
      "phone": "if found",
      "address": "if found"
    }
  ],
  "actionItems": [
    {
      "task": "what likely needs to be done",
      "dueDate": "YYYY-MM-DD if applicable",
      "priority": "high/medium/low"
    }
  ],
  "suggestedContacts": [],
  "suggestedEvents": [],
  "keyInfo": ["important facts about this document type"],
  "tags": ["relevant", "tags", "for", "searching"],
  "linkedDocuments": ["related document types"]
}`
        }];
      } else {
        // Use text-based analysis for documents with good text extraction
        console.log('Using text-based analysis for document');
        const textPrompt = `Analyze this document and extract all relevant information:

Document Title: ${documentData.title}
Category: ${documentData.category}
Extracted Text:
${documentData.extractedText || 'No text content available'}

Please analyze and provide:
1. A brief summary of the document
2. Enhanced category classification (medical/school/financial/legal/activity/general)
3. All important dates with context (identify if they are appointments, deadlines, or events)
4. People mentioned - IMPORTANT: Look for patient names (especially children's names like "Lilly"), doctor names (Dr., MD, etc.), and any other people
5. Organizations/businesses mentioned (clinics, hospitals, medical centers)
6. Action items that need to be taken
7. Related contacts that should be created - Extract ALL doctor names with their credentials (MD, DO, etc.)
8. Calendar events that should be created
9. Key information to remember (vaccine types, dosages, medical record numbers, etc.)
10. Tags for easy searching

For medical documents like vaccine records:
- The patient name is usually at the top (look for "Patient:", "Name:", or similar)
- Doctor names often appear with "Dr." or medical credentials (MD, DO, NP, PA)
- Look for clinic/hospital contact information (phone numbers, addresses)

Return as JSON with this structure:
{
  "summary": "brief summary",
  "enhancedCategory": "category",
  "dates": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "description": "what this date is for",
      "isAppointment": true/false,
      "duration": 60
    }
  ],
  "people": [
    {
      "name": "person name",
      "role": "their role (doctor, teacher, etc.)",
      "organization": "where they work"
    }
  ],
  "organizations": [
    {
      "name": "org name",
      "type": "medical/school/business",
      "phone": "if found",
      "address": "if found"
    }
  ],
  "actionItems": [
    {
      "task": "what needs to be done",
      "dueDate": "YYYY-MM-DD if applicable",
      "priority": "high/medium/low"
    }
  ],
  "suggestedContacts": [
    {
      "name": "contact name",
      "type": "medical/education/service",
      "phone": "phone number",
      "email": "email",
      "organization": "organization name"
    }
  ],
  "suggestedEvents": [
    {
      "title": "event title",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "duration": 60,
      "location": "if mentioned",
      "attendees": ["family member names"]
    }
  ],
  "keyInfo": ["important fact 1", "important fact 2"],
  "tags": ["tag1", "tag2", "tag3"],
  "linkedDocuments": ["related document types"]
}`;
        
        messages = [{ role: 'user', content: textPrompt }];
      }

      const response = await ClaudeService.generateResponse(
        messages,
        { temperature: 0.3 }
      );
      
      console.log('AI raw response length:', response.length);
      console.log('AI raw response preview:', response.substring(0, 200) + '...');
      
      // Parse AI response
      let aiAnalysis;
      try {
        // Try to find JSON in the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('Found JSON in response, attempting to parse...');
          aiAnalysis = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully parsed AI analysis:', aiAnalysis);
        } else {
          console.error('❌ No JSON found in response');
          
          aiAnalysis = { 
            summary: response, 
            enhancedCategory: documentData.category,
            error: 'Failed to parse structured response' 
          };
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        aiAnalysis = { 
          summary: response, 
          enhancedCategory: documentData.category,
          error: 'Failed to parse structured response' 
        };
      }
      
      // Execute suggested actions
      const actions = [];
      
      // Create calendar events
      if (aiAnalysis.suggestedEvents && Array.isArray(aiAnalysis.suggestedEvents)) {
        for (const event of aiAnalysis.suggestedEvents) {
          try {
            const eventData = {
              title: event.title,
              startTime: new Date(`${event.date}T${event.time || '09:00'}`),
              duration: event.duration || 60,
              location: event.location,
              attendees: event.attendees || [],
              category: documentData.category,
              notes: `Created from document: ${documentData.title}`,
              relatedDocumentId: documentId,
              source: 'document-ai-extracted'
            };
            
            // Use EventStore.addEvent instead of CalendarService.createEvent
            const eventStore = (await import('./EventStore')).default;
            const currentUser = auth.currentUser;
            const createdEvent = await eventStore.addEvent(eventData, currentUser?.uid, documentData.familyId);
            
            actions.push({
              type: 'calendar',
              status: 'completed',
              description: `Created event: ${event.title}`,
              details: [
                `Date: ${event.date}`,
                event.time ? `Time: ${event.time}` : 'Time: TBD',
                `Duration: ${event.duration || 60} minutes`
              ],
              eventId: createdEvent.id
            });
          } catch (error) {
            console.error('Error creating event:', error);
            actions.push({
              type: 'calendar',
              status: 'failed',
              description: `Failed to create event: ${event.title}`,
              error: error.message
            });
          }
        }
      }
      
      // Auto-tag children based on patient names
      if (aiAnalysis.people && Array.isArray(aiAnalysis.people)) {
        console.log('🏷️ Checking for patient names to auto-tag children:', aiAnalysis.people);
        
        // Get family members
        const familyDoc = await getDoc(doc(db, 'families', familyId));
        if (familyDoc.exists()) {
          const familyData = familyDoc.data();
          const familyMembers = familyData.familyMembers || [];
          
          // Look for patient names that match children in the family
          for (const person of aiAnalysis.people) {
            const personName = typeof person === 'string' ? person : person.name;
            if (!personName) continue;
            
            // Check if this person is a child in the family
            const matchedChild = familyMembers.find(member => 
              member.role === 'child' && 
              (member.name.toLowerCase().includes(personName.toLowerCase()) ||
               personName.toLowerCase().includes(member.name.toLowerCase()))
            );
            
            if (matchedChild) {
              console.log(`✅ Found matching child: ${matchedChild.name} (ID: ${matchedChild.id})`);
              
              // Update document to associate with this child
              await updateDoc(doc(db, 'familyDocuments', documentId), {
                childId: matchedChild.id,
                childName: matchedChild.name
              });
              
              actions.push({
                type: 'child-tagging',
                status: 'completed',
                description: `Tagged document for ${matchedChild.name}`,
                childId: matchedChild.id
              });
              
              // First, ensure the document entity exists in the knowledge graph
              try {
                await QuantumKnowledgeGraph.addEntity(
                  familyId,
                  `document_${documentId}`,
                  'document',
                  {
                    title: documentData.title || documentData.fileName,
                    type: documentData.fileType,
                    category: aiAnalysis.enhancedCategory || documentData.category,
                    uploadedAt: documentData.uploadedAt,
                    status: 'processed'
                  }
                );
                
                // Also ensure the person entity exists
                await QuantumKnowledgeGraph.addEntity(
                  familyId,
                  `person_${matchedChild.id}`,
                  'person',
                  {
                    name: matchedChild.name,
                    role: 'child'
                  }
                );
                
                // Now add relationship in knowledge graph
                await QuantumKnowledgeGraph.addRelationship(
                familyId, 
                `document_${documentId}`,
                `person_${matchedChild.id}`,
                'related_to',
                {
                  context: 'patient_record',
                  autoTagged: true
                }
              );
              } catch (kgError) {
                console.error('Error adding to knowledge graph:', kgError);
                // Don't fail the whole process if knowledge graph update fails
              }
              
              break; // Only tag the first matching child
            }
          }
        }
      }
      
      // Create contacts
      if (aiAnalysis.suggestedContacts && Array.isArray(aiAnalysis.suggestedContacts)) {
        for (const contact of aiAnalysis.suggestedContacts) {
          try {
            // Skip if contact has no name
            if (!contact.name) {
              console.warn('Skipping contact without name:', contact);
              continue;
            }
            
            // Check if contact already exists
            const existingContacts = await getDocs(
              query(
                collection(db, 'familyContacts'),
                where('familyId', '==', familyId),
                where('name', '==', contact.name)
              )
            );
            
            if (existingContacts.empty) {
              const contactData = {
                name: contact.name,
                type: contact.type || 'general',
                familyId,
                source: 'document-ai-extracted',
                sourceDocumentId: documentId,
                createdAt: serverTimestamp()
              };
              
              // Only add optional fields if they have values
              if (contact.phone) contactData.phone = contact.phone;
              if (contact.email) contactData.email = contact.email;
              if (contact.organization) contactData.businessName = contact.organization;
              
              const contactRef = await addDoc(collection(db, 'familyContacts'), contactData);
              
              actions.push({
                type: 'contact',
                status: 'completed',
                description: `Added contact: ${contact.name}`,
                details: [
                  contact.type || 'Contact',
                  contact.organization || ''
                ].filter(Boolean),
                contactId: contactRef.id
              });
              
              // Link contact to document in knowledge graph
              try {
                await QuantumKnowledgeGraph.addRelationship(
                  familyId, 
                  `document_${documentId}`,
                  `contact_${contactRef.id}`,
                  'related_to',
                  {
                    autoExtracted: true,
                    confidence: 0.9
                  }
                );
              } catch (kgError) {
                console.error('Error linking contact in knowledge graph:', kgError);
              }
            } else {
              actions.push({
                type: 'contact',
                status: 'skipped',
                description: `Contact already exists: ${contact.name}`
              });
            }
          } catch (error) {
            console.error('Error creating contact:', error);
            actions.push({
              type: 'contact',
              status: 'failed',
              description: `Failed to add contact: ${contact.name}`,
              error: error.message
            });
          }
        }
      }
      
      // Create action items/tasks
      if (aiAnalysis.actionItems && Array.isArray(aiAnalysis.actionItems)) {
        for (const actionItem of aiAnalysis.actionItems) {
          try {
            const taskData = {
              title: actionItem.task,
              dueDate: actionItem.dueDate,
              priority: actionItem.priority || 'medium',
              familyId,
              source: 'document-ai-extracted',
              sourceDocumentId: documentId,
              status: 'pending',
              createdAt: serverTimestamp()
            };
            
            const taskRef = await addDoc(collection(db, 'familyTasks'), taskData);
            
            actions.push({
              type: 'task',
              status: 'completed',
              description: `Created task: ${actionItem.task}`,
              details: [
                actionItem.dueDate ? `Due: ${actionItem.dueDate}` : 'No due date',
                `Priority: ${actionItem.priority || 'medium'}`
              ],
              taskId: taskRef.id
            });
          } catch (error) {
            console.error('Error creating task:', error);
            actions.push({
              type: 'task',
              status: 'failed',
              description: `Failed to create task: ${actionItem.task}`,
              error: error.message
            });
          }
        }
      }
      
      // Deep clean function to remove undefined values from any object
      const deepClean = (obj) => {
        if (obj === null || obj === undefined) return null;
        if (typeof obj !== 'object') return obj;
        if (obj instanceof Date) return obj;
        if (Array.isArray(obj)) {
          return obj.map(item => deepClean(item)).filter(item => item !== undefined);
        }
        
        const cleaned = {};
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          if (value !== undefined) {
            const cleanedValue = deepClean(value);
            if (cleanedValue !== undefined) {
              cleaned[key] = cleanedValue;
            }
          }
        });
        return cleaned;
      };
      
      // Clean up aiAnalysis to remove any undefined values
      const cleanedAiAnalysis = deepClean(aiAnalysis) || {};
      
      // Update document with AI analysis and actions
      const updateData = {
        aiAnalysis: cleanedAiAnalysis,
        actions: deepClean(actions) || [],
        processedAt: serverTimestamp(),
        status: actions.some(a => a.status === 'failed') ? 'partial' : 'processed',
        reviewed: true, // Mark as reviewed after AI processing
        summary: cleanedAiAnalysis.summary || '',
        enhancedCategory: cleanedAiAnalysis.enhancedCategory || documentData.category || 'general',
        enhancedTags: [
          ...(Array.isArray(documentData.tags) ? documentData.tags : []), 
          ...(Array.isArray(cleanedAiAnalysis.tags) ? cleanedAiAnalysis.tags : [])
        ],
        keyInfo: cleanedAiAnalysis.keyInfo || [],
        // Clear any previous error
        processingError: null
      };
      
      console.log('📝 Updating document with AI analysis:', {
        documentId,
        status: updateData.status,
        summaryLength: updateData.summary?.length,
        actionsCount: actions.length,
        tagsCount: updateData.enhancedTags?.length,
        peopleFound: aiAnalysis.people?.length || 0,
        datesFound: aiAnalysis.dates?.length || 0
      });
      
      // Log extracted information
      if (aiAnalysis.people?.length > 0) {
        console.log('👥 People extracted:', aiAnalysis.people);
      }
      if (aiAnalysis.dates?.length > 0) {
        console.log('📅 Dates extracted:', aiAnalysis.dates);
      }
      if (aiAnalysis.organizations?.length > 0) {
        console.log('🏢 Organizations extracted:', aiAnalysis.organizations);
      }
      
      // Final safety check - ensure no undefined values
      const finalUpdateData = deepClean(updateData);
      
      // Log the final data for debugging
      console.log('🔍 Final update data (cleaned):', JSON.stringify(finalUpdateData, null, 2));
      
      await updateDoc(doc(db, 'familyDocuments', documentId), finalUpdateData);
      
      console.log(`✅ Document ${documentId} processed with AI. ${actions.length} actions completed.`);
      
      // Notify user of processing completion
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('document-processed', {
          detail: {
            documentId,
            title: documentData.title,
            actionsCount: actions.length,
            status: updateData.status
          }
        }));
      }
      
    } catch (error) {
      console.error('Error in AI document processing:', error);
      
      // Update document with error status
      await updateDoc(doc(db, 'familyDocuments', documentId), {
        status: 'error',
        processingError: error.message,
        processedAt: serverTimestamp(),
        aiAnalysis: {
          error: true,
          message: error.message,
          summary: `Processing failed: ${error.message}`
        }
      });
      
      // Re-throw to show error in UI
      throw error;
    }
  }
}

export default new DocumentProcessingService();