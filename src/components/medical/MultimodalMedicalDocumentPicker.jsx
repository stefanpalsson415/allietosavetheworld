import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Image, FilePlus } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import MultimodalUnderstandingService from '../../services/MultimodalUnderstandingService';

/**
 * MultimodalMedicalDocumentPicker Component
 * 
 * Specialized component for handling medical document uploads and intelligent extraction
 * Leverages the MultimodalUnderstandingService to process medical files and extract structured information
 */
const MultimodalMedicalDocumentPicker = ({
  onDocumentSelected,
  onExtractedDataReceived,
  initialDocuments = [],
  className,
  includePatientInfo = true
}) => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();

  // State
  const [view, setView] = useState('library'); // library, upload, selected
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [processingFile, setProcessingFile] = useState(false);
  const [error, setError] = useState(null);

  // Process and add an extracted document
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
      medicalType: result.results?.analysis?.data?.documentType || 'unknown',
      patientName: result.results?.analysis?.data?.patientName || '',
      providerName: result.results?.analysis?.data?.providerName || '',
      providerSpecialty: result.results?.analysis?.data?.providerSpecialty || '',
      diagnosisInfo: result.results?.analysis?.data?.diagnosis || '',
      date: result.results?.analysis?.data?.date || '',
      medications: result.results?.analysis?.data?.medications || [],
      addedAt: new Date().toISOString(),
    };

    // Add to documents state
    setUploadedFiles(prev => [...prev, newDocument]);
    setDocuments(prev => [...prev, newDocument]);
    
    // Switch view to show selected documents
    setView('selected');
    
    // Notify parent component about extracted data
    if (onExtractedDataReceived) {
      onExtractedDataReceived(result.results?.analysis?.data, file);
    }
  };

  // File drop handler
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  // Drag over handler
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // File input change handler
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  // Process the selected file
  const handleFileSelection = async (file) => {
    setError(null);
    setProcessingFile(true);
    
    try {
      // Process the file with MultimodalUnderstandingService
      const result = await MultimodalUnderstandingService.processFile(
        file,
        'medical',
        { includePatientInfo },
        familyId,
        currentUser?.uid
      );
      
      handleExtractionComplete(result, file);
    } catch (err) {
      console.error('Error processing medical document:', err);
      setError('Failed to process the document. Please try again.');
      setProcessingFile(false);
    }
  };

  // Select a document
  const handleSelectDocument = (document) => {
    setSelectedDocuments([document]);
    
    // Notify parent component
    if (onDocumentSelected) {
      onDocumentSelected(document);
    }
  };

  // Render document library
  const renderDocumentLibrary = () => {
    if (documents.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No medical documents available. Upload a new document to get started.
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {documents.map((doc) => (
          <div 
            key={doc.id} 
            className="p-3 border rounded-md hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition"
            onClick={() => handleSelectDocument(doc)}
          >
            <div className="flex items-center">
              {doc.fileType?.startsWith('image/') ? (
                <Image size={24} className="mr-2 text-blue-500" />
              ) : (
                <FileText size={24} className="mr-2 text-blue-500" />
              )}
              <div className="flex-1 truncate">
                <div className="font-medium truncate">{doc.title}</div>
                <div className="text-xs text-gray-500">
                  {doc.medicalType === 'unknown' ? 'Medical Document' : doc.medicalType}
                  {doc.date && ` • ${new Date(doc.date).toLocaleDateString()}`}
                </div>
              </div>
            </div>
            {doc.providerName && (
              <div className="mt-1 text-sm text-gray-600">
                Provider: {doc.providerName}
                {doc.providerSpecialty && ` (${doc.providerSpecialty})`}
              </div>
            )}
            {doc.patientName && (
              <div className="mt-1 text-sm text-gray-600">
                Patient: {doc.patientName}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render upload area
  const renderUploadArea = () => (
    <div
      className="p-8 border-2 border-dashed rounded-lg text-center"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {processingFile ? (
        <div className="flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-3"></div>
          <div className="text-gray-600 font-medium">Processing document...</div>
          <div className="text-sm text-gray-500 mt-1">This may take a few seconds</div>
        </div>
      ) : (
        <>
          <Upload size={32} className="mx-auto text-gray-400 mb-3" />
          <div className="font-medium mb-1">Upload Medical Document</div>
          <p className="text-sm text-gray-500 mb-4">
            Drop your file here, or click to upload
            <br />
            Supports images, PDFs, and Word documents
          </p>
          <label className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 cursor-pointer inline-block">
            Select File
            <input 
              type="file" 
              className="hidden" 
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/heic,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            />
          </label>
        </>
      )}
    </div>
  );

  // Render selected documents
  const renderSelectedDocuments = () => {
    if (selectedDocuments.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No documents selected. Select a document from the library or upload a new one.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {selectedDocuments.map((doc) => (
          <div key={doc.id} className="p-3 border rounded-md bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {doc.fileType?.startsWith('image/') ? (
                  <Image size={24} className="mr-2 text-blue-500" />
                ) : (
                  <FileText size={24} className="mr-2 text-blue-500" />
                )}
                <div>
                  <div className="font-medium">{doc.title}</div>
                  <div className="text-xs text-gray-500">
                    {doc.medicalType === 'unknown' ? 'Medical Document' : doc.medicalType}
                    {doc.date && ` • ${new Date(doc.date).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocuments([])}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            
            {doc.extractedData && (
              <div className="mt-3 p-2 bg-white rounded border border-blue-100">
                <div className="text-sm font-medium mb-1">Extracted Information:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {doc.providerName && (
                    <div>
                      <span className="font-medium">Provider:</span> {doc.providerName}
                      {doc.providerSpecialty && ` (${doc.providerSpecialty})`}
                    </div>
                  )}
                  {doc.patientName && (
                    <div>
                      <span className="font-medium">Patient:</span> {doc.patientName}
                    </div>
                  )}
                  {doc.date && (
                    <div>
                      <span className="font-medium">Date:</span> {new Date(doc.date).toLocaleDateString()}
                    </div>
                  )}
                  {doc.diagnosisInfo && (
                    <div className="col-span-full">
                      <span className="font-medium">Diagnosis:</span> {doc.diagnosisInfo}
                    </div>
                  )}
                </div>
                
                {doc.medications && doc.medications.length > 0 && (
                  <div className="mt-2">
                    <div className="text-sm font-medium">Medications:</div>
                    <ul className="list-disc pl-5 text-sm">
                      {doc.medications.map((med, index) => (
                        <li key={index}>
                          <strong>{med.name}</strong>
                          {med.dosage && ` - ${med.dosage}`}
                          {med.instructions && ` (${med.instructions})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`${className || ''}`}>
      {/* Tab navigation */}
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 flex items-center ${
            view === 'library' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setView('library')}
        >
          <FileText size={16} className="mr-1" />
          Document Library
        </button>
        <button
          className={`px-4 py-2 flex items-center ${
            view === 'upload' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setView('upload')}
        >
          <Upload size={16} className="mr-1" />
          Upload New
        </button>
        <button
          className={`px-4 py-2 flex items-center ${
            view === 'selected' 
              ? 'border-b-2 border-blue-500 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setView('selected')}
        >
          <CheckCircle size={16} className="mr-1" />
          Selected
          {selectedDocuments.length > 0 && (
            <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
              {selectedDocuments.length}
            </span>
          )}
        </button>
      </div>

      {/* Error messages */}
      {error && (
        <div className="mb-4 p-3 border rounded-md bg-red-50 border-red-200 text-red-700 flex items-center">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main content area */}
      <div className="min-h-[200px]">
        {view === 'library' && renderDocumentLibrary()}
        {view === 'upload' && renderUploadArea()}
        {view === 'selected' && renderSelectedDocuments()}
      </div>
    </div>
  );
};

export default MultimodalMedicalDocumentPicker;