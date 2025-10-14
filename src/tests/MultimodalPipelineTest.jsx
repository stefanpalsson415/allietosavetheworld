import React from 'react';
import { KnowledgeGraphDemo } from '../components/knowledge';

/**
 * MultimodalPipelineTest Component
 * 
 * A test component to showcase the Multimodal Understanding Pipeline
 * with knowledge graph extraction and visualization
 */
const MultimodalPipelineTest = () => {
  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Multimodal Understanding Pipeline Demo</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Overview</h2>
        <p className="mb-4">
          This demo showcases the Multimodal Understanding Pipeline's ability to extract
          structured information from various file types, build knowledge graphs, and detect
          similar documents. Upload a document to see the system in action.
        </p>
        
        <h3 className="text-lg font-medium mb-2">Features:</h3>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>Document content extraction from images, PDFs, and other file types</li>
          <li>Entity and relationship extraction to build knowledge graphs</li>
          <li>Document similarity detection to prevent duplicates</li>
          <li>Interactive knowledge graph visualization</li>
        </ul>
      </div>
      
      <KnowledgeGraphDemo />
    </div>
  );
};

export default MultimodalPipelineTest;