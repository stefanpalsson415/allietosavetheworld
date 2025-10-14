/**
 * useDocumentUnderstanding.js
 * React hook for using the multimodal understanding pipeline
 */
import { useState, useCallback } from 'react';
import { MultimodalUnderstandingPipeline, DocumentSimilarityDetector } from '../services/knowledge';

/**
 * Hook for document processing through the multimodal understanding pipeline
 * @returns {Object} Hook methods and state
 */
const useDocumentUnderstanding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingResult, setProcessingResult] = useState(null);
  const [similarDocuments, setSimilarDocuments] = useState([]);
  const [knowledgeGraph, setKnowledgeGraph] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState(null);
  
  /**
   * Process a document through the understanding pipeline
   * @param {Object} document - The document object
   * @param {Object} extractionResult - The extraction result
   * @param {Object} options - Processing options
   */
  const processDocument = useCallback(async (document, extractionResult, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await MultimodalUnderstandingPipeline.processDocument(
        document,
        extractionResult,
        options
      );
      
      setProcessingResult(result);
      
      if (result.success) {
        setSimilarDocuments(result.similarDocuments || []);
        setKnowledgeGraph(result.knowledgeGraph || null);
      } else {
        setError(result.error || 'Unknown error during document processing');
      }
      
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Error processing document';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Get document knowledge graph
   * @param {string} documentId - Document ID
   */
  const getDocumentKnowledgeGraph = useCallback(async (documentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await MultimodalUnderstandingPipeline.getDocumentKnowledgeGraph(documentId);
      
      if (result.success && result.hasKnowledgeGraph) {
        setKnowledgeGraph(result.knowledgeGraph);
      } else if (result.success) {
        setKnowledgeGraph(null);
      } else {
        setError(result.error || 'Unknown error getting knowledge graph');
      }
      
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Error getting knowledge graph';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Get document similarity candidates
   * @param {string} documentId - Document ID
   */
  const getSimilarDocuments = useCallback(async (documentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await DocumentSimilarityDetector.getDuplicateCandidates(documentId);
      
      if (result.success) {
        setSimilarDocuments(result.duplicateCandidates || []);
      } else {
        setError(result.error || 'Unknown error getting similar documents');
      }
      
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Error getting similar documents';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Get pipeline status for a document
   * @param {string} documentId - Document ID
   */
  const getPipelineStatus = useCallback(async (documentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await MultimodalUnderstandingPipeline.getPipelineStatus(documentId);
      
      if (result.success) {
        setPipelineStatus(result);
      } else {
        setError(result.error || 'Unknown error getting pipeline status');
      }
      
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Error getting pipeline status';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Mark document as duplicate
   * @param {string} originalDocumentId - Original document ID
   * @param {string} duplicateDocumentId - Duplicate document ID
   */
  const markAsDuplicate = useCallback(async (originalDocumentId, duplicateDocumentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await DocumentSimilarityDetector.markAsDuplicate(
        originalDocumentId,
        duplicateDocumentId
      );
      
      if (!result.success) {
        setError(result.error || 'Unknown error marking as duplicate');
      }
      
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Error marking as duplicate';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Unmark document as duplicate
   * @param {string} originalDocumentId - Original document ID
   * @param {string} duplicateDocumentId - Duplicate document ID
   */
  const unmarkAsDuplicate = useCallback(async (originalDocumentId, duplicateDocumentId) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await DocumentSimilarityDetector.unmarkAsDuplicate(
        originalDocumentId,
        duplicateDocumentId
      );
      
      if (!result.success) {
        setError(result.error || 'Unknown error unmarking as duplicate');
      }
      
      return result;
    } catch (err) {
      const errorMsg = err.message || 'Error unmarking as duplicate';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * Clear all state
   */
  const clearState = useCallback(() => {
    setProcessingResult(null);
    setSimilarDocuments([]);
    setKnowledgeGraph(null);
    setPipelineStatus(null);
    setError(null);
  }, []);
  
  return {
    // State
    loading,
    error,
    processingResult,
    similarDocuments,
    knowledgeGraph,
    pipelineStatus,
    
    // Methods
    processDocument,
    getDocumentKnowledgeGraph,
    getSimilarDocuments,
    getPipelineStatus,
    markAsDuplicate,
    unmarkAsDuplicate,
    clearState
  };
};

export default useDocumentUnderstanding;