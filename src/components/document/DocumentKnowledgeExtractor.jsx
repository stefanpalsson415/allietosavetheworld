/**
 * DocumentKnowledgeExtractor.jsx
 * Component for extracting knowledge graphs from documents and detecting similar documents
 */
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Network, FileText, FileWarning, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import useDocumentUnderstanding from '../../hooks/useDocumentUnderstanding';
import DocumentRelationshipVisualizer from './DocumentRelationshipVisualizer';

const DocumentKnowledgeExtractor = ({ 
  document, 
  extractionResult, 
  onExtractionComplete,
  onSimilarDocumentsFound,
  showVisualizer = true,
  allowManualActions = true
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [processingOptions, setProcessingOptions] = useState({
    extractKnowledgeGraph: true,
    detectSimilarDocuments: true
  });
  const [activeTab, setActiveTab] = useState('knowledge');
  
  const { 
    loading, 
    error, 
    processingResult,
    similarDocuments,
    knowledgeGraph,
    markAsDuplicate,
    unmarkAsDuplicate,
    processDocument,
    getPipelineStatus
  } = useDocumentUnderstanding();
  
  // Track if processing completed for this document
  const [processingCompleted, setProcessingCompleted] = useState(false);
  
  useEffect(() => {
    // Check if document already has processing completed
    if (document?.processingCompleted) {
      setProcessingCompleted(true);
      
      // Check pipeline status to get recent info
      if (document.id) {
        getPipelineStatus(document.id);
      }
    }
  }, [document, getPipelineStatus]);
  
  // Handle extraction completion
  useEffect(() => {
    if (processingResult && processingResult.success && !processingCompleted) {
      setProcessingCompleted(true);
      
      // Notify parent component
      if (onExtractionComplete) {
        onExtractionComplete(processingResult);
      }
      
      // Notify about similar documents if found
      if (similarDocuments.length > 0 && onSimilarDocumentsFound) {
        onSimilarDocumentsFound(similarDocuments);
      }
    }
  }, [processingResult, processingCompleted, onExtractionComplete, onSimilarDocumentsFound, similarDocuments]);
  
  // Start processing automatically if document and extraction result are provided
  useEffect(() => {
    const shouldAutoProcess = 
      document && 
      extractionResult && 
      !processingCompleted && 
      !loading && 
      !processingResult;
    
    if (shouldAutoProcess) {
      processDocument(document, extractionResult, processingOptions);
    }
  }, [document, extractionResult, processingCompleted, loading, processingResult, processDocument, processingOptions]);
  
  // Handle manual processing
  const handleStartProcessing = useCallback(() => {
    if (document && extractionResult) {
      processDocument(document, extractionResult, processingOptions);
    }
  }, [document, extractionResult, processDocument, processingOptions]);
  
  // Handle marking as duplicate
  const handleMarkAsDuplicate = useCallback((originalId, duplicateId) => {
    markAsDuplicate(originalId, duplicateId)
      .then(() => {
        // Refresh similar documents
        if (document?.id) {
          getPipelineStatus(document.id);
        }
      });
  }, [document, markAsDuplicate, getPipelineStatus]);
  
  // Handle unmarking as duplicate
  const handleUnmarkAsDuplicate = useCallback((originalId, duplicateId) => {
    unmarkAsDuplicate(originalId, duplicateId)
      .then(() => {
        // Refresh similar documents
        if (document?.id) {
          getPipelineStatus(document.id);
        }
      });
  }, [document, unmarkAsDuplicate, getPipelineStatus]);
  
  // Render processing status
  const renderProcessingStatus = () => {
    if (loading) {
      return (
        <div className="bg-blue-50 p-3 rounded mb-4">
          <div className="flex items-center">
            <div className="animate-spin mr-2">
              <Network size={16} className="text-blue-600" />
            </div>
            <span className="text-sm font-medium text-blue-800">
              Processing document...
            </span>
          </div>
          <div className="text-xs text-blue-700 mt-1">
            This may take a few moments. We're analyzing the document content and structure.
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 p-3 rounded mb-4">
          <div className="flex items-center">
            <FileWarning size={16} className="text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              Error processing document
            </span>
          </div>
          <div className="text-xs text-red-700 mt-1">
            {error}
          </div>
        </div>
      );
    }
    
    if (processingCompleted) {
      return (
        <div className="bg-green-50 p-3 rounded mb-4">
          <div className="flex items-center">
            <CheckCircle size={16} className="text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">
              Document processing completed
            </span>
          </div>
          <div className="text-xs text-green-700 mt-1">
            {processingResult?.knowledgeGraph && 'Knowledge graph extracted. '}
            {similarDocuments.length > 0 && `${similarDocuments.length} similar document(s) found.`}
            {!processingResult?.knowledgeGraph && similarDocuments.length === 0 && 
              'No knowledge graph or similar documents found.'}
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Render knowledge graph
  const renderKnowledgeGraph = () => {
    if (!knowledgeGraph || !knowledgeGraph.entities || knowledgeGraph.entities.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic p-4 text-center">
          No knowledge graph available for this document.
        </div>
      );
    }
    
    // Group entities by category
    const entitiesByCategory = {};
    knowledgeGraph.entities.forEach(entity => {
      if (!entitiesByCategory[entity.category]) {
        entitiesByCategory[entity.category] = [];
      }
      entitiesByCategory[entity.category].push(entity);
    });
    
    return (
      <div className="p-2">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Entities ({knowledgeGraph.entities.length})
          </h4>
          <div className="space-y-3">
            {Object.entries(entitiesByCategory).map(([category, entities]) => (
              <div key={category} className="border rounded p-2">
                <h5 className="text-xs font-medium text-gray-600 capitalize">
                  {category} ({entities.length})
                </h5>
                <div className="flex flex-wrap gap-1 mt-1">
                  {entities.map(entity => (
                    <span 
                      key={entity.id} 
                      className="px-2 py-1 bg-gray-100 text-xs rounded-full"
                      title={`${entity.type}: ${entity.value}`}
                    >
                      {entity.value}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Relationships ({knowledgeGraph.relationships.length})
          </h4>
          <div className="border rounded p-2 max-h-40 overflow-y-auto">
            <div className="space-y-1">
              {knowledgeGraph.relationships.map(rel => {
                const sourceEntity = knowledgeGraph.entities.find(e => e.id === rel.sourceId);
                const targetEntity = knowledgeGraph.entities.find(e => e.id === rel.targetId);
                
                if (!sourceEntity || !targetEntity) return null;
                
                return (
                  <div key={rel.id} className="text-xs">
                    <span className="font-medium">{sourceEntity.value}</span>
                    <span className="mx-1 text-gray-500">{rel.label}</span>
                    <span className="font-medium">{targetEntity.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {showVisualizer && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Knowledge Graph Visualization
            </h4>
            <div className="border rounded p-1 bg-gray-50">
              <DocumentRelationshipVisualizer 
                graphData={{
                  nodes: knowledgeGraph.entities.map(entity => ({
                    id: entity.id,
                    label: entity.value,
                    type: entity.type,
                    category: entity.category
                  })),
                  links: knowledgeGraph.relationships.map(rel => ({
                    source: rel.sourceId,
                    target: rel.targetId,
                    type: rel.type,
                    label: rel.label
                  }))
                }}
                height={300}
              />
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Render similar documents
  const renderSimilarDocuments = () => {
    if (!similarDocuments || similarDocuments.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic p-4 text-center">
          No similar documents found.
        </div>
      );
    }
    
    return (
      <div className="p-2">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Similar Documents ({similarDocuments.length})
        </h4>
        <div className="space-y-2">
          {similarDocuments.map((similarDoc, index) => (
            <div 
              key={similarDoc.document.id} 
              className="border rounded p-2 bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium">
                    {similarDoc.document.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {similarDoc.document.type}
                    {similarDoc.document.date && ` • ${new Date(similarDoc.document.date).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {(similarDoc.similarityScore * 100).toFixed(0)}% match
                  </div>
                  {allowManualActions && (
                    <button
                      onClick={() => similarDoc.document.isDuplicate 
                        ? handleUnmarkAsDuplicate(document.id, similarDoc.document.id)
                        : handleMarkAsDuplicate(document.id, similarDoc.document.id)
                      }
                      className={`ml-2 p-1 rounded ${
                        similarDoc.document.isDuplicate 
                          ? 'bg-red-100 text-red-600' 
                          : 'bg-green-100 text-green-600'
                      }`}
                      title={similarDoc.document.isDuplicate 
                        ? "Unmark as duplicate" 
                        : "Mark as duplicate"
                      }
                    >
                      {similarDoc.document.isDuplicate 
                        ? <XCircle size={16} /> 
                        : <CheckCircle size={16} />
                      }
                    </button>
                  )}
                </div>
              </div>
              
              <div className="mt-2 text-xs">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-gray-500">Title: </span>
                    <span className="font-medium">{(similarDoc.titleSimilarity * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Content: </span>
                    <span className="font-medium">{(similarDoc.contentSimilarity * 100).toFixed(0)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Metadata: </span>
                    <span className="font-medium">{(similarDoc.metadataSimilarity * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="border rounded bg-white shadow-sm">
      {/* Header */}
      <div 
        className="flex justify-between items-center p-3 border-b cursor-pointer"
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div className="flex items-center">
          <Network size={18} className="text-purple-600 mr-2" />
          <span className="font-medium text-gray-800">Document Knowledge</span>
        </div>
        <div className="flex items-center">
          {processingCompleted && (
            <CheckCircle size={16} className="text-green-600 mr-2" />
          )}
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>
      
      {/* Expanded content */}
      {isExpanded && (
        <div className="p-3">
          {/* Processing status */}
          {renderProcessingStatus()}
          
          {/* Processing options */}
          {!processingCompleted && allowManualActions && (
            <div className="bg-gray-50 p-3 rounded mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Processing Options
              </h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={processingOptions.extractKnowledgeGraph}
                    onChange={(e) => setProcessingOptions(prev => ({
                      ...prev,
                      extractKnowledgeGraph: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Extract knowledge graph</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={processingOptions.detectSimilarDocuments}
                    onChange={(e) => setProcessingOptions(prev => ({
                      ...prev,
                      detectSimilarDocuments: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Detect similar documents</span>
                </label>
              </div>
              <button
                onClick={handleStartProcessing}
                disabled={loading}
                className="mt-3 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:bg-gray-300"
              >
                {loading ? 'Processing...' : 'Start Processing'}
              </button>
            </div>
          )}
          
          {/* Tabs */}
          {processingCompleted && (
            <div className="mb-4">
              <div className="flex border-b">
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'knowledge' 
                      ? 'text-purple-600 border-b-2 border-purple-600' 
                      : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('knowledge')}
                >
                  Knowledge Graph
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === 'similar' 
                      ? 'text-purple-600 border-b-2 border-purple-600' 
                      : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab('similar')}
                >
                  Similar Documents
                </button>
              </div>
              
              {/* Tab content */}
              <div className="mt-4">
                {activeTab === 'knowledge' && renderKnowledgeGraph()}
                {activeTab === 'similar' && renderSimilarDocuments()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

DocumentKnowledgeExtractor.propTypes = {
  document: PropTypes.object,
  extractionResult: PropTypes.object,
  onExtractionComplete: PropTypes.func,
  onSimilarDocumentsFound: PropTypes.func,
  showVisualizer: PropTypes.bool,
  allowManualActions: PropTypes.bool
};

export default DocumentKnowledgeExtractor;