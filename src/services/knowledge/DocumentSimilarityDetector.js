/**
 * DocumentSimilarityDetector.js
 * Service for detecting similar documents to prevent duplicates
 */
import { db } from '../firebase';

class DocumentSimilarityDetector {
  /**
   * Detect similar documents based on content and metadata
   * @param {Object} document - The document to check for similarity
   * @param {Object} extractionResult - The result from the multimodal extraction
   * @returns {Promise<Object>} Object containing similar documents and similarity scores
   */
  async detectSimilarDocuments(document, extractionResult) {
    try {
      if (!document || !extractionResult) {
        return {
          similarDocuments: [],
          success: false,
          error: 'Invalid document or extraction result'
        };
      }
      
      // Extract text content from the document
      const textContent = extractionResult.results?.textContent || '';
      const title = document.title || extractionResult.results?.analysis?.data?.title || '';
      
      // Get potential similar documents from database
      let potentialMatches = await this.getPotentialSimilarDocuments(document);
      
      // Calculate similarity scores
      const similarDocuments = await this.calculateSimilarityScores(
        document, 
        textContent, 
        title, 
        potentialMatches
      );
      
      return {
        similarDocuments,
        success: true
      };
    } catch (error) {
      console.error('Error detecting similar documents:', error);
      return {
        similarDocuments: [],
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get potentially similar documents from database
   * @param {Object} document - The document to find similar documents for
   * @returns {Promise<Array>} Array of potential similar documents
   */
  async getPotentialSimilarDocuments(document) {
    try {
      // Skip if no title or no document type
      if (!document.title || !document.type) {
        return [];
      }
      
      // Get documents of the same type
      const typeSnapshot = await db.collection('documents')
        .where('type', '==', document.type)
        .where('id', '!=', document.id) // Exclude the current document
        .get();
      
      // Get documents with similar titles (using a simple word match)
      const titleWords = document.title
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3); // Only consider words longer than 3 characters
      
      // Skip title search if no significant words
      if (titleWords.length === 0) {
        return typeSnapshot.docs.map(doc => doc.data());
      }
      
      // Use a query for each significant word in the title (limit to first 3 words)
      const titleQueries = titleWords.slice(0, 3).map(word => {
        return db.collection('documents')
          .where('titleLowercase', '>=', word)
          .where('titleLowercase', '<=', word + '\uf8ff') // Next Unicode character after all ASCII
          .where('id', '!=', document.id) // Exclude the current document
          .get();
      });
      
      // Execute all title queries in parallel
      const titleSnapshots = await Promise.all(titleQueries);
      
      // Combine and deduplicate results
      const potentialMatches = new Map();
      
      // Add type matches
      typeSnapshot.docs.forEach(doc => {
        potentialMatches.set(doc.id, doc.data());
      });
      
      // Add title matches
      titleSnapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          potentialMatches.set(doc.id, doc.data());
        });
      });
      
      return Array.from(potentialMatches.values());
    } catch (error) {
      console.error('Error getting potential similar documents:', error);
      return [];
    }
  }
  
  /**
   * Calculate similarity scores between documents
   * @param {Object} document - The document to compare
   * @param {string} textContent - The text content of the document
   * @param {string} title - The title of the document
   * @param {Array} potentialMatches - Array of potential similar documents
   * @returns {Promise<Array>} Array of similar documents with similarity scores
   */
  async calculateSimilarityScores(document, textContent, title, potentialMatches) {
    try {
      const similarDocuments = [];
      
      // Skip if no potential matches
      if (!potentialMatches || potentialMatches.length === 0) {
        return similarDocuments;
      }
      
      // Calculate TF-IDF vectors for document text content
      const documentVector = this.calculateTfIdfVector(textContent);
      
      // For each potential match, calculate similarity score
      for (const match of potentialMatches) {
        try {
          // Get the document content
          const matchContent = await this.getDocumentContent(match.id);
          
          // Calculate metadata similarity
          const metadataSimilarity = this.calculateMetadataSimilarity(document, match);
          
          // Calculate content similarity using TF-IDF and cosine similarity
          const contentSimilarity = this.calculateContentSimilarity(
            documentVector, 
            this.calculateTfIdfVector(matchContent)
          );
          
          // Calculate title similarity
          const titleSimilarity = this.calculateStringSimilarity(
            title.toLowerCase(), 
            (match.title || '').toLowerCase()
          );
          
          // Calculate combined similarity score
          // Weights: title (0.4), metadata (0.3), content (0.3)
          const similarityScore = (
            titleSimilarity * 0.4 + 
            metadataSimilarity * 0.3 + 
            contentSimilarity * 0.3
          );
          
          // Add to similar documents if similarity score is above threshold
          if (similarityScore > 0.5) {
            similarDocuments.push({
              document: match,
              similarityScore,
              titleSimilarity,
              metadataSimilarity,
              contentSimilarity
            });
          }
        } catch (error) {
          console.warn(`Error calculating similarity for document ${match.id}:`, error);
          // Continue with next match
        }
      }
      
      // Sort by similarity score (descending)
      return similarDocuments.sort((a, b) => b.similarityScore - a.similarityScore);
    } catch (error) {
      console.error('Error calculating similarity scores:', error);
      return [];
    }
  }
  
  /**
   * Get document content by ID
   * @param {string} documentId - Document ID
   * @returns {Promise<string>} Document content text
   */
  async getDocumentContent(documentId) {
    try {
      // Try to get content from document content collection
      const contentDoc = await db.collection('documentContent').doc(documentId).get();
      
      if (contentDoc.exists) {
        return contentDoc.data().content || '';
      }
      
      // If not found, try to get content from extraction results
      const extractionDoc = await db.collection('documentExtractions').doc(documentId).get();
      
      if (extractionDoc.exists) {
        return extractionDoc.data().results?.textContent || '';
      }
      
      return '';
    } catch (error) {
      console.error(`Error getting content for document ${documentId}:`, error);
      return '';
    }
  }
  
  /**
   * Calculate metadata similarity between two documents
   * @param {Object} doc1 - First document
   * @param {Object} doc2 - Second document
   * @returns {number} Similarity score (0-1)
   */
  calculateMetadataSimilarity(doc1, doc2) {
    let matchCount = 0;
    let totalFields = 0;
    
    // Compare common metadata fields
    const metadataFields = [
      'type', 'category', 'source', 'author', 'createdBy', 
      'fileType', 'language', 'tags'
    ];
    
    metadataFields.forEach(field => {
      if (doc1[field] && doc2[field]) {
        totalFields++;
        
        if (Array.isArray(doc1[field]) && Array.isArray(doc2[field])) {
          // Compare arrays (like tags)
          const intersection = doc1[field].filter(item => doc2[field].includes(item));
          const union = [...new Set([...doc1[field], ...doc2[field]])];
          
          if (union.length > 0) {
            matchCount += intersection.length / union.length;
          }
        } else if (doc1[field] === doc2[field]) {
          // Compare scalar values
          matchCount++;
        }
      }
    });
    
    // Compare dates if available
    if (doc1.date && doc2.date) {
      totalFields++;
      
      // Parse dates
      const date1 = new Date(doc1.date);
      const date2 = new Date(doc2.date);
      
      // Check if dates are valid
      if (!isNaN(date1) && !isNaN(date2)) {
        // Calculate days difference
        const diffDays = Math.abs((date1 - date2) / (1000 * 60 * 60 * 24));
        
        // Consider dates similar if within 2 days
        if (diffDays <= 2) {
          matchCount++;
        } else if (diffDays <= 7) {
          // Partial match for dates within a week
          matchCount += 0.5;
        }
      }
    }
    
    return totalFields > 0 ? matchCount / totalFields : 0;
  }
  
  /**
   * Calculate TF-IDF vector for text content
   * @param {string} text - Text content
   * @returns {Object} TF-IDF vector
   */
  calculateTfIdfVector(text) {
    // Simple implementation of TF-IDF for similarity comparison
    const words = this.tokenizeText(text);
    const wordCounts = {};
    const vector = {};
    
    // Count word frequencies (term frequency)
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    
    // Calculate TF-IDF (simplified, using just TF)
    Object.keys(wordCounts).forEach(word => {
      vector[word] = wordCounts[word] / words.length;
    });
    
    return vector;
  }
  
  /**
   * Calculate cosine similarity between two vectors
   * @param {Object} vector1 - First vector
   * @param {Object} vector2 - Second vector
   * @returns {number} Cosine similarity (0-1)
   */
  calculateContentSimilarity(vector1, vector2) {
    // Skip if either vector is empty
    if (Object.keys(vector1).length === 0 || Object.keys(vector2).length === 0) {
      return 0;
    }
    
    // Calculate dot product
    let dotProduct = 0;
    Object.keys(vector1).forEach(word => {
      if (vector2[word]) {
        dotProduct += vector1[word] * vector2[word];
      }
    });
    
    // Calculate magnitudes
    const magnitude1 = Math.sqrt(
      Object.values(vector1).reduce((sum, val) => sum + val * val, 0)
    );
    
    const magnitude2 = Math.sqrt(
      Object.values(vector2).reduce((sum, val) => sum + val * val, 0)
    );
    
    // Return cosine similarity
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    
    return dotProduct / (magnitude1 * magnitude2);
  }
  
  /**
   * Calculate string similarity using Jaccard index
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateStringSimilarity(str1, str2) {
    // Skip if either string is empty
    if (!str1 || !str2) {
      return 0;
    }
    
    // Tokenize strings
    const tokens1 = new Set(this.tokenizeText(str1));
    const tokens2 = new Set(this.tokenizeText(str2));
    
    // Calculate intersection and union
    const intersection = new Set(
      [...tokens1].filter(token => tokens2.has(token))
    );
    
    const union = new Set([...tokens1, ...tokens2]);
    
    // Return Jaccard similarity
    return union.size > 0 ? intersection.size / union.size : 0;
  }
  
  /**
   * Tokenize text into words
   * @param {string} text - Text to tokenize
   * @returns {Array} Array of tokens
   */
  tokenizeText(text) {
    if (!text) return [];
    
    // Convert to lowercase and split by non-word characters
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2) // Only consider words longer than 2 characters
      .filter(word => !this.isStopWord(word)); // Remove stop words
  }
  
  /**
   * Check if a word is a stop word
   * @param {string} word - Word to check
   * @returns {boolean} True if stop word, false otherwise
   */
  isStopWord(word) {
    const stopWords = new Set([
      'the', 'and', 'is', 'in', 'to', 'of', 'that', 'for', 'on', 'with',
      'as', 'at', 'by', 'an', 'be', 'this', 'which', 'or', 'from', 'but',
      'not', 'what', 'all', 'were', 'when', 'we', 'there', 'can', 'who',
      'has', 'been', 'one', 'have', 'had', 'will', 'would', 'they', 'their',
      'was', 'are', 'you', 'your', 'may', 'could', 'should'
    ]);
    
    return stopWords.has(word);
  }
  
  /**
   * Get duplicate candidates for a document
   * @param {string} documentId - Document ID
   * @returns {Promise<Array>} Array of duplicate candidates
   */
  async getDuplicateCandidates(documentId) {
    try {
      const document = await db.collection('documents').doc(documentId).get();
      
      if (!document.exists) {
        return {
          duplicateCandidates: [],
          success: false,
          error: 'Document not found'
        };
      }
      
      // Get extraction result
      const extractionDoc = await db.collection('documentExtractions').doc(documentId).get();
      
      if (!extractionDoc.exists) {
        return {
          duplicateCandidates: [],
          success: false,
          error: 'Document extraction not found'
        };
      }
      
      // Detect similar documents
      const result = await this.detectSimilarDocuments(
        document.data(),
        extractionDoc.data()
      );
      
      // Return results
      return {
        duplicateCandidates: result.similarDocuments,
        success: true
      };
    } catch (error) {
      console.error('Error getting duplicate candidates:', error);
      return {
        duplicateCandidates: [],
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Mark documents as duplicates
   * @param {string} originalDocumentId - Original document ID
   * @param {string} duplicateDocumentId - Duplicate document ID
   * @returns {Promise<Object>} Result of the operation
   */
  async markAsDuplicate(originalDocumentId, duplicateDocumentId) {
    try {
      // Update duplicate document
      await db.collection('documents').doc(duplicateDocumentId).update({
        isDuplicate: true,
        originalDocumentId,
        updatedAt: new Date().toISOString()
      });
      
      // Update original document
      await db.collection('documents').doc(originalDocumentId).update({
        duplicateIds: db.FieldValue.arrayUnion(duplicateDocumentId),
        updatedAt: new Date().toISOString()
      });
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error marking document as duplicate:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Unmark documents as duplicates
   * @param {string} originalDocumentId - Original document ID
   * @param {string} duplicateDocumentId - Duplicate document ID
   * @returns {Promise<Object>} Result of the operation
   */
  async unmarkAsDuplicate(originalDocumentId, duplicateDocumentId) {
    try {
      // Update duplicate document
      await db.collection('documents').doc(duplicateDocumentId).update({
        isDuplicate: false,
        originalDocumentId: null,
        updatedAt: new Date().toISOString()
      });
      
      // Update original document
      await db.collection('documents').doc(originalDocumentId).update({
        duplicateIds: db.FieldValue.arrayRemove(duplicateDocumentId),
        updatedAt: new Date().toISOString()
      });
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error unmarking document as duplicate:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new DocumentSimilarityDetector();