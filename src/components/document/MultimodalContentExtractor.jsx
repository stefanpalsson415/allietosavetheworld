import React, { useState, useRef, useContext } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFamily } from '../../contexts/FamilyContext';
import MultimodalUnderstandingService from '../../services/MultimodalUnderstandingService';

/**
 * MultimodalContentExtractor Component
 * 
 * A component that allows users to upload and extract content from various file types
 * Leverages the MultimodalUnderstandingService to process files and extract structured information
 */
const MultimodalContentExtractor = ({ 
  analysisType = 'event',
  onExtractionComplete,
  allowMultipleFiles = false,
  context = {},
  className
}) => {
  const { currentUser } = useAuth();
  const { familyMembers, familyId } = useFamily();
  
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const fileInputRef = useRef(null);
  
  // Supported file types based on analysis type
  const getSupportedFileTypes = () => {
    const baseTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    switch (analysisType) {
      case 'event':
        return [...baseTypes, 'text/calendar'];
      case 'medical':
        return [...baseTypes, 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      case 'document':
        return [...baseTypes, 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      case 'knowledgeGraph':
        return [...baseTypes, 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/csv', 'application/json'];
      default:
        return baseTypes;
    }
  };
  
  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles(selectedFiles);
    setError(null);
    setResults(null);
  };
  
  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };
  
  const processFiles = async () => {
    if (!files.length) {
      setError('Please select a file to process');
      return;
    }
    
    setIsProcessing(true);
    setProgress(10);
    setError(null);
    
    try {
      let extractionResults;
      
      // Enhanced context with information from current state
      const enhancedContext = {
        ...context,
        userId: currentUser?.uid,
        familyId,
        timestamp: new Date().toISOString()
      };
      
      setProgress(30);
      
      if (allowMultipleFiles && files.length > 1) {
        // Process multiple files together
        extractionResults = await MultimodalUnderstandingService.processMultipleFiles(
          files,
          analysisType,
          enhancedContext,
          familyId,
          currentUser?.uid
        );
      } else {
        // Process single file
        extractionResults = await MultimodalUnderstandingService.processFile(
          files[0],
          analysisType,
          enhancedContext,
          familyId,
          currentUser?.uid
        );
      }
      
      setProgress(90);
      
      if (!extractionResults.success) {
        throw new Error(extractionResults.error || 'Failed to process file');
      }
      
      // Set results and call the completion handler
      setResults(extractionResults);
      if (onExtractionComplete) {
        onExtractionComplete(extractionResults);
      }
      
    } catch (err) {
      console.error('Error processing files:', err);
      setError(err.message || 'An error occurred while processing the file');
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };
  
  const renderFilePreview = () => {
    if (!files.length) return null;
    
    return (
      <div className="mt-4">
        <h3 className="text-lg font-medium">Selected Files</h3>
        <ul className="mt-2 space-y-2">
          {files.map((file, index) => (
            <li key={index} className="flex items-center p-2 border rounded">
              <span className="material-icons mr-2">
                {file.type.startsWith('image/') ? 'image' : 'description'}
              </span>
              <div className="flex flex-col flex-1">
                <span className="font-medium truncate">{file.name}</span>
                <span className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB · {file.type}</span>
              </div>
              <button 
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  const newFiles = [...files];
                  newFiles.splice(index, 1);
                  setFiles(newFiles);
                }}
              >
                <span className="material-icons">close</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  const renderResults = () => {
    if (!results) return null;
    
    return (
      <div className="mt-6 p-4 border rounded bg-gray-50">
        <h3 className="text-lg font-medium mb-2">Extracted Information</h3>
        
        {/* Results preview based on analysis type */}
        {analysisType === 'event' && renderEventResults()}
        {analysisType === 'medical' && renderMedicalResults()}
        {analysisType === 'document' && renderDocumentResults()}
        {analysisType === 'knowledgeGraph' && renderKnowledgeGraphResults()}
        
        {/* Generic JSON view for any type */}
        <div className="mt-4">
          <details>
            <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View Raw Data</summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  };
  
  const renderEventResults = () => {
    const eventData = results?.results?.analysis?.data || {};
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium">Event Details</h4>
          <ul className="mt-2 space-y-1">
            <li><span className="font-medium">Title:</span> {eventData.title || 'N/A'}</li>
            <li><span className="font-medium">Type:</span> {eventData.eventType || 'N/A'}</li>
            <li><span className="font-medium">Date/Time:</span> {eventData.dateTime ? new Date(eventData.dateTime).toLocaleString() : 'N/A'}</li>
            <li><span className="font-medium">Location:</span> {eventData.location || 'N/A'}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium">Additional Information</h4>
          <ul className="mt-2 space-y-1">
            <li><span className="font-medium">Organizer:</span> {eventData.organizer || 'N/A'}</li>
            <li><span className="font-medium">Attendees:</span> {eventData.attendees ? eventData.attendees.join(', ') : 'N/A'}</li>
            <li><span className="font-medium">For Child:</span> {eventData.childName || 'N/A'}</li>
            <li><span className="font-medium">Instructions:</span> {eventData.specialInstructions || 'N/A'}</li>
          </ul>
        </div>
        {eventData.description && (
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-medium">Description</h4>
            <p className="mt-1">{eventData.description}</p>
          </div>
        )}
      </div>
    );
  };
  
  const renderMedicalResults = () => {
    const medicalData = results?.results?.analysis?.data || {};
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium">Document Information</h4>
          <ul className="mt-2 space-y-1">
            <li><span className="font-medium">Type:</span> {medicalData.documentType || 'N/A'}</li>
            <li><span className="font-medium">Patient:</span> {medicalData.patientName || 'N/A'}</li>
            <li><span className="font-medium">Provider:</span> {medicalData.providerName || 'N/A'}</li>
            <li><span className="font-medium">Date:</span> {medicalData.date ? new Date(medicalData.date).toLocaleDateString() : 'N/A'}</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium">Medical Information</h4>
          <ul className="mt-2 space-y-1">
            <li><span className="font-medium">Diagnosis:</span> {medicalData.diagnosis || 'N/A'}</li>
            <li><span className="font-medium">Treatment:</span> {medicalData.treatment || 'N/A'}</li>
            <li><span className="font-medium">Follow-up:</span> {medicalData.followUp || 'N/A'}</li>
          </ul>
        </div>
        {medicalData.medications && medicalData.medications.length > 0 && (
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-medium">Medications</h4>
            <ul className="mt-2">
              {medicalData.medications.map((med, idx) => (
                <li key={idx} className="mb-2">
                  <strong>{med.name}</strong> - {med.dosage} ({med.instructions})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };
  
  const renderDocumentResults = () => {
    const docData = results?.results?.analysis?.data || {};
    
    return (
      <div>
        <h4 className="font-medium">Document Summary</h4>
        <ul className="mt-2 space-y-1">
          <li><span className="font-medium">Title:</span> {docData.title || 'N/A'}</li>
          <li><span className="font-medium">Author:</span> {docData.author || 'N/A'}</li>
          <li><span className="font-medium">Date:</span> {docData.date || 'N/A'}</li>
        </ul>
        
        {docData.summary && (
          <div className="mt-4">
            <h4 className="font-medium">Summary</h4>
            <p className="mt-1">{docData.summary}</p>
          </div>
        )}
        
        {docData.keywords && docData.keywords.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium">Keywords</h4>
            <div className="mt-1 flex flex-wrap gap-2">
              {docData.keywords.map((keyword, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };
  
  const renderKnowledgeGraphResults = () => {
    const graphData = results?.results?.analysis?.data || {};
    const entities = graphData.entities || [];
    const relationships = graphData.relationships || [];
    
    // Group entities by category for better display
    const entityCategories = {};
    entities.forEach(entity => {
      if (!entityCategories[entity.category]) {
        entityCategories[entity.category] = [];
      }
      entityCategories[entity.category].push(entity);
    });
    
    return (
      <div>
        <h4 className="font-medium">Knowledge Graph</h4>
        
        {/* Entities Section */}
        <div className="mt-4">
          <h5 className="font-medium text-sm">Entities ({entities.length})</h5>
          
          {Object.entries(entityCategories).map(([category, categoryEntities]) => (
            <div key={category} className="mt-2">
              <h6 className="text-sm font-medium capitalize">{category} ({categoryEntities.length})</h6>
              <div className="flex flex-wrap gap-1 mt-1">
                {categoryEntities.map((entity) => (
                  <span 
                    key={entity.id} 
                    className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                    title={`${entity.type}: ${entity.value}`}
                  >
                    {entity.value}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* Relationships Section */}
        {relationships.length > 0 && (
          <div className="mt-4">
            <h5 className="font-medium text-sm">Relationships ({relationships.length})</h5>
            <div className="mt-2 text-sm">
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Relationship</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {relationships.slice(0, 10).map((rel) => {
                      const sourceEntity = entities.find(e => e.id === rel.sourceId);
                      const targetEntity = entities.find(e => e.id === rel.targetId);
                      
                      if (!sourceEntity || !targetEntity) return null;
                      
                      return (
                        <tr key={rel.id}>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">{sourceEntity.value}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">{rel.label || rel.type}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs">{targetEntity.value}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {relationships.length > 10 && (
                  <div className="px-3 py-2 text-xs text-gray-500 text-center">
                    {relationships.length - 10} more relationships not shown
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Knowledge Graph Visualization Link */}
        <div className="mt-4 text-sm">
          <button 
            className="text-blue-600 hover:text-blue-800 flex items-center"
            onClick={() => onExtractionComplete && onExtractionComplete(results)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            View Full Knowledge Graph
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className={`p-4 border rounded ${className || ''}`}>
      <h2 className="text-xl font-semibold mb-4">
        {analysisType === 'event' && 'Extract Event Information'}
        {analysisType === 'medical' && 'Extract Medical Information'}
        {analysisType === 'document' && 'Extract Document Content'}
        {analysisType === 'knowledgeGraph' && 'Extract Knowledge Graph'}
        {!['event', 'medical', 'document', 'knowledgeGraph'].includes(analysisType) && 'Extract Content'}
      </h2>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Upload a file to extract {analysisType} information. Supported formats include JPEG, PNG, and PDF
          {analysisType === 'event' && ' as well as calendar files (.ics)'}
          {analysisType === 'medical' && ' as well as Word documents'}
          {analysisType === 'document' && ' as well as Word documents and text files'}
          {analysisType === 'knowledgeGraph' && ' as well as Word documents, text files, CSV, and JSON'}
          .
        </p>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={getSupportedFileTypes().join(',')}
          multiple={allowMultipleFiles}
          className="hidden"
        />
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={triggerFileSelect}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            disabled={isProcessing}
          >
            Select {allowMultipleFiles ? 'Files' : 'File'}
          </button>
          
          <button
            onClick={processFiles}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            disabled={!files.length || isProcessing}
          >
            {isProcessing ? 'Processing...' : `Extract ${analysisType === 'event' ? 'Event' : analysisType === 'medical' ? 'Medical' : analysisType === 'knowledgeGraph' ? 'Knowledge Graph' : 'Content'}`}
          </button>
        </div>
      </div>
      
      {/* Progress bar for processing */}
      {isProcessing && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="p-3 mt-4 bg-red-100 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}
      
      {/* File preview */}
      {renderFilePreview()}
      
      {/* Results display */}
      {renderResults()}
    </div>
  );
};

export default MultimodalContentExtractor;