import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from '../common/Tabs';
import MultimodalContentExtractor from '../document/MultimodalContentExtractor';
import DocumentKnowledgeExtractor from '../document/DocumentKnowledgeExtractor';
import DocumentRelationshipVisualizer from '../document/DocumentRelationshipVisualizer';
import useDocumentUnderstanding from '../../hooks/useDocumentUnderstanding';

/**
 * KnowledgeGraphDemo Component
 * 
 * A demo component that showcases the multimodal understanding pipeline
 * with knowledge graph extraction and visualization
 */
const KnowledgeGraphDemo = () => {
  const [activeTab, setActiveTab] = useState('upload');
  const [extractionResult, setExtractionResult] = useState(null);
  const [document, setDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [knowledgeGraph, setKnowledgeGraph] = useState(null);
  
  const {
    loading,
    error,
    processDocument,
    knowledgeGraph: extractedKnowledgeGraph,
    similarDocuments
  } = useDocumentUnderstanding();
  
  // Process extraction result
  const handleExtractionComplete = (result) => {
    setExtractionResult(result);
    
    // Create a document object from the result
    const newDocument = {
      id: result.processingId || `doc_${Date.now()}`,
      title: result.results?.analysis?.data?.title || result.fileInfo?.name || 'Untitled Document',
      type: 'document',
      fileType: result.fileInfo?.type || 'unknown',
      createdAt: new Date().toISOString()
    };
    
    setDocument(newDocument);
    
    // Add to documents list if not already present
    setDocuments(prevDocs => {
      if (prevDocs.some(doc => doc.id === newDocument.id)) {
        return prevDocs;
      }
      return [...prevDocs, newDocument];
    });
    
    // Show knowledge graph tab
    setActiveTab('knowledge');
  };
  
  // Process document with understanding pipeline
  useEffect(() => {
    if (document && extractionResult && !knowledgeGraph) {
      processDocument(document, extractionResult)
        .then(result => {
          if (result.success && result.knowledgeGraph) {
            setKnowledgeGraph(result.knowledgeGraph);
          }
        });
    }
  }, [document, extractionResult, knowledgeGraph, processDocument]);
  
  // Use extracted knowledge graph when available
  useEffect(() => {
    if (extractedKnowledgeGraph) {
      setKnowledgeGraph(extractedKnowledgeGraph);
    }
  }, [extractedKnowledgeGraph]);
  
  // Prepare graph data for visualization
  const prepareGraphData = () => {
    if (!knowledgeGraph) return null;
    
    // Convert entities to nodes
    const nodes = knowledgeGraph.entities.map(entity => ({
      id: entity.id,
      name: entity.value,
      type: entity.type,
      category: entity.category,
      data: entity
    }));
    
    // Convert relationships to links
    const links = knowledgeGraph.relationships.map(rel => ({
      source: rel.sourceId,
      target: rel.targetId,
      type: rel.type,
      label: rel.label
    }));
    
    return { nodes, links };
  };
  
  // Display similar documents if any
  const renderSimilarDocuments = () => {
    if (!similarDocuments || similarDocuments.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No similar documents found.
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <h3 className="text-lg font-medium mb-4">Similar Documents ({similarDocuments.length})</h3>
        <div className="space-y-3">
          {similarDocuments.map((similar, index) => (
            <div key={index} className="border rounded-md p-3 bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <h4 className="font-medium">{similar.document.title}</h4>
                  <p className="text-sm text-gray-500">{similar.document.type} • {similar.document.fileType}</p>
                </div>
                <div className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded h-fit">
                  {Math.round(similar.similarityScore * 100)}% match
                </div>
              </div>
              
              <div className="mt-2 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-gray-500">Content: </span>
                    <span className="font-medium">{Math.round(similar.contentSimilarity * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Metadata: </span>
                    <span className="font-medium">{Math.round(similar.metadataSimilarity * 100)}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Title: </span>
                    <span className="font-medium">{Math.round(similar.titleSimilarity * 100)}%</span>
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
    <div className="border rounded-lg shadow-sm bg-white p-4">
      <h2 className="text-2xl font-bold mb-6">Multimodal Understanding Pipeline Demo</h2>
      
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <Tab id="upload" label="Upload & Extract">
          <div className="p-4">
            <p className="mb-4 text-gray-600">
              Upload a document to extract knowledge graph information. The system will process the document,
              extract entities and their relationships, and visualize the resulting knowledge graph.
            </p>
            
            <MultimodalContentExtractor
              analysisType="knowledgeGraph"
              onExtractionComplete={handleExtractionComplete}
              allowMultipleFiles={false}
              context={{ demo: true }}
            />
          </div>
        </Tab>
        
        <Tab id="knowledge" label="Knowledge Graph" disabled={!extractionResult}>
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-2">Processing document...</span>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 text-red-700 rounded">
                {error}
              </div>
            ) : knowledgeGraph ? (
              <div>
                <DocumentKnowledgeExtractor
                  document={document}
                  extractionResult={extractionResult}
                  showVisualizer={true}
                />
                
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Interactive Knowledge Graph</h3>
                  <div className="border rounded-md p-2 bg-gray-50" style={{ height: '500px' }}>
                    <DocumentRelationshipVisualizer
                      graphData={prepareGraphData()}
                      height={480}
                      width="100%"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                No knowledge graph available. Upload a document in the Upload tab.
              </div>
            )}
          </div>
        </Tab>
        
        <Tab id="similarity" label="Similar Documents" disabled={!similarDocuments || similarDocuments.length === 0}>
          {renderSimilarDocuments()}
        </Tab>
        
        <Tab id="debug" label="Debug" disabled={!extractionResult}>
          <div className="p-4">
            <h3 className="text-lg font-medium mb-4">Raw Extraction Data</h3>
            <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-xs">
              {JSON.stringify(extractionResult, null, 2)}
            </pre>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};

export default KnowledgeGraphDemo;