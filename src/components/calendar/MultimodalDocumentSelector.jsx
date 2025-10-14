import React, { useState, useEffect } from 'react';
import { FileText, X, Check, AlertCircle, Paperclip, Upload, RotateCw, PlusCircle } from 'lucide-react';
import DocumentLibrary from '../document/DocumentLibrary';
import MultimodalContentExtractor from '../chat/MultimodalContentExtractor';
import { useFamily } from '../../contexts/FamilyContext';

/**
 * Enhanced Document Selector with Multimodal Capabilities
 * 
 * Allows selecting documents from the document library or uploading new ones
 * with multimodal content extraction for calendar events
 * 
 * @param {Object} props
 * @param {Array} props.selectedDocuments - Currently selected documents
 * @param {Function} props.onDocumentsSelected - Callback when documents are selected
 * @param {Function} props.onClose - Callback when the selector is closed
 * @param {string} props.childId - ID of the child for the event (to filter documents)
 * @param {string} props.analysisType - Type of analysis to perform on uploads
 */
const MultimodalDocumentSelector = ({ 
  selectedDocuments = [], 
  onDocumentsSelected, 
  onClose,
  childId = null,
  analysisType = 'event'
}) => {
  const { familyMembers, familyId, currentWeek, familyName } = useFamily();
  const [documents, setDocuments] = useState(selectedDocuments || []);
  const [view, setView] = useState('library'); // 'library', 'upload', 'selected'
  const [error, setError] = useState(null);
  const [processingFile, setProcessingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Handle document selection from library
  const handleDocumentSelected = (document) => {
    // Check if document is already selected
    const isAlreadySelected = documents.some(doc => doc.id === document.id);
    
    if (isAlreadySelected) {
      // Remove from selection
      setDocuments(documents.filter(doc => doc.id !== document.id));
    } else {
      // Add to selection
      setDocuments([...documents, document]);
    }
  };

  // Handle final document selection confirmation
  const handleConfirmSelection = () => {
    if (onDocumentsSelected) {
      onDocumentsSelected(documents);
    }
    if (onClose) {
      onClose();
    }
  };

  // Handle multimodal extraction completion
  const handleExtractionComplete = (result, file) => {
    setProcessingFile(false);
    
    if (result.error) {
      setError(`Error processing file: ${result.error}`);
      return;
    }
    
    // Create a document object from the extraction result
    const newDocument = {
      id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: file.name,
      fileType: file.type,
      fileUrl: URL.createObjectURL(file),
      uploadedFile: file,
      extractedData: result.results,
      rawFile: file,
      fileSize: file.size,
      timestamp: new Date().toISOString(),
      isMultimodal: true
    };
    
    // Add more metadata based on the analysis type
    if (result.results && result.results.analysis && result.results.analysis.data) {
      // Add analysis data
      const data = result.results.analysis.data;
      
      // Use detected title if available
      if (data.title) {
        newDocument.title = data.title;
      }
      
      // Add event details for event analysis
      if (analysisType === 'event') {
        newDocument.eventDetails = {
          title: data.title || file.name,
          location: data.location,
          date: data.date || data.startDate,
          time: data.time || data.startTime, 
          description: data.description || data.summary,
          attendees: data.attendees
        };
      }
      
      // Add medical details for medical analysis
      if (analysisType === 'medical') {
        newDocument.medicalDetails = {
          patientName: data.patientName,
          providerName: data.providerName,
          date: data.date,
          diagnosis: data.diagnosis,
          medications: data.medications,
          followUp: data.followUp
        };
      }
    }
    
    // Add to uploaded files and documents
    setUploadedFiles(prev => [...prev, newDocument]);
    setDocuments(prev => [...prev, newDocument]);
    
    // Switch view to show selected documents
    setView('selected');
  };

  // Helper to get document icon based on file type
  const getDocumentIcon = (doc) => {
    if (!doc.fileType) return <FileText size={20} className="text-gray-400" />;
    
    if (doc.fileType.startsWith('image/') && doc.fileUrl) {
      return <img 
        src={doc.fileUrl} 
        alt="Document Preview" 
        className="w-6 h-6 object-cover rounded"
      />;
    }
    
    return <FileText size={20} className="text-blue-500" />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-medium">
            Attach Documents 
            {documents.length > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({documents.length} selected)
              </span>
            )}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Navigation Tabs */}
        <div className="border-b px-4 flex">
          <button
            onClick={() => setView('library')}
            className={`py-3 px-4 font-medium text-sm border-b-2 -mb-px ${
              view === 'library' 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Document Library
          </button>
          <button
            onClick={() => setView('upload')}
            className={`py-3 px-4 font-medium text-sm border-b-2 -mb-px ${
              view === 'upload' 
                ? 'border-black text-black' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload New
          </button>
          {documents.length > 0 && (
            <button
              onClick={() => setView('selected')}
              className={`py-3 px-4 font-medium text-sm border-b-2 -mb-px ${
                view === 'selected' 
                  ? 'border-black text-black' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Selected ({documents.length})
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-auto">
          {/* Document Library View */}
          {view === 'library' && (
            <DocumentLibrary
              initialChildId={childId}
              selectMode={true}
              onSelectDocument={handleDocumentSelected}
              selectedDocuments={documents}
            />
          )}
          
          {/* Upload View */}
          {view === 'upload' && (
            <div className="p-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Upload New Document</h4>
                <p className="text-sm text-gray-500 mb-4">
                  Upload documents, images, or screenshots. Our AI will automatically analyze the content.
                </p>
              </div>
              
              <MultimodalContentExtractor 
                analysisType={analysisType}
                onExtractionComplete={handleExtractionComplete}
                allowMultipleFiles={true}
                context={{
                  familyContext: {
                    familyMembers,
                    currentWeek,
                    familyName
                  }
                }}
              />
              
              {uploadedFiles.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Uploaded Documents</h4>
                  <div className="space-y-2">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="flex items-center p-2 border rounded">
                        {getDocumentIcon(file)}
                        <div className="ml-2 flex-grow">
                          <p className="text-sm font-medium">{file.title}</p>
                          <p className="text-xs text-gray-500">
                            {file.fileType} • {Math.round(file.fileSize / 1024)} KB
                            {file.eventDetails && ' • Event data extracted'}
                            {file.medicalDetails && ' • Medical data extracted'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDocumentSelected(file)}
                          className={`p-1.5 rounded-full ${
                            documents.some(d => d.id === file.id)
                              ? 'bg-black text-white'
                              : 'border text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {documents.some(d => d.id === file.id) ? (
                            <Check size={14} />
                          ) : (
                            <PlusCircle size={14} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Selected Documents View */}
          {view === 'selected' && documents.length > 0 && (
            <div className="p-4">
              <h4 className="text-sm font-medium mb-2">Selected Documents</h4>
              <div className="space-y-2">
                {documents.map(doc => (
                  <div 
                    key={doc.id}
                    className="flex items-center p-3 border rounded-md"
                  >
                    {getDocumentIcon(doc)}
                    <div className="ml-2 flex-grow">
                      <p className="text-sm font-medium">{doc.title}</p>
                      <p className="text-xs text-gray-500">
                        {doc.fileType || "Unknown type"}
                        {doc.isMultimodal && ' • AI processed'}
                      </p>
                      
                      {/* Show extracted metadata if available */}
                      {doc.eventDetails && (
                        <div className="mt-1 text-xs bg-blue-50 p-1.5 rounded">
                          <p className="font-medium text-blue-700">Event Details:</p>
                          {doc.eventDetails.date && <p>Date: {doc.eventDetails.date}</p>}
                          {doc.eventDetails.location && <p>Location: {doc.eventDetails.location}</p>}
                          {doc.eventDetails.description && (
                            <p className="truncate">Description: {doc.eventDetails.description}</p>
                          )}
                        </div>
                      )}
                      
                      {/* Show medical metadata if available */}
                      {doc.medicalDetails && (
                        <div className="mt-1 text-xs bg-red-50 p-1.5 rounded">
                          <p className="font-medium text-red-700">Medical Details:</p>
                          {doc.medicalDetails.patientName && <p>Patient: {doc.medicalDetails.patientName}</p>}
                          {doc.medicalDetails.providerName && <p>Provider: {doc.medicalDetails.providerName}</p>}
                          {doc.medicalDetails.diagnosis && <p>Diagnosis: {doc.medicalDetails.diagnosis}</p>}
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => handleDocumentSelected(doc)}
                      className="p-1.5 text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Empty Selected Documents Message */}
          {view === 'selected' && documents.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-gray-500">No documents selected</p>
              <button
                onClick={() => setView('library')}
                className="mt-2 text-blue-600 text-sm"
              >
                Browse document library
              </button>
            </div>
          )}
          
          {/* Error message if any */}
          {error && (
            <div className="p-3 m-4 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertCircle size={16} className="mr-2" />
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-700"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm mr-3"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSelection}
            className="px-4 py-2 bg-black text-white rounded-md text-sm flex items-center"
            disabled={documents.length === 0}
          >
            <Check size={16} className="mr-2" />
            Attach {documents.length} Document{documents.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultimodalDocumentSelector;