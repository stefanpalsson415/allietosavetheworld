import React, { useState, useRef } from 'react';
import { Upload, FileText, Image, X, Camera, Clipboard, RotateCw, PlusCircle, Calendar } from 'lucide-react';
import MultimodalUnderstandingService from '../../services/MultimodalUnderstandingService';
import { useFamily } from '../../contexts/FamilyContext';

/**
 * MultimodalContentExtractor - A component for extracting content from various file types
 * 
 * @param {Object} props
 * @param {string} props.analysisType - Type of analysis to perform (event, medical, document)
 * @param {Function} props.onExtractionComplete - Callback when extraction is complete
 * @param {boolean} props.allowMultipleFiles - Whether to allow multiple file uploads
 * @param {Object} props.context - Additional context for analysis
 * @param {string} props.className - Additional CSS classes
 */
const MultimodalContentExtractor = ({ 
  analysisType = 'event',
  onExtractionComplete,
  allowMultipleFiles = false,
  context = {},
  className
}) => {
  const { familyId, selectedUser } = useFamily();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFile, setProcessingFile] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef(null);
  
  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragging(false);
      setDragCounter(0);
    }
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      handleFiles(droppedFiles);
    }
  };
  
  // Handle click to open file selector
  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };
  
  // Handle file selection from input
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };
  
  // Process files (common handler for drop and select)
  const handleFiles = (newFiles) => {
    // Filter for supported file types
    const supportedFiles = newFiles.filter(file => {
      return file.type.startsWith('image/') || 
             file.type === 'application/pdf' || 
             file.type.includes('text') || 
             file.type.includes('document') ||
             file.type.includes('spreadsheet') ||
             file.type.includes('excel') ||
             file.type.includes('csv');
    });
    
    if (supportedFiles.length === 0) {
      console.error("No supported files found", newFiles.map(f => f.type));
      return;
    }
    
    // Create previews for image files
    const newPreviews = supportedFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null; // No preview for non-image files
    });
    
    // Update state with new files
    if (allowMultipleFiles) {
      setFiles(prev => [...prev, ...supportedFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
    } else {
      // Release any previous object URLs
      previews.forEach(preview => {
        if (preview) URL.revokeObjectURL(preview);
      });
      
      setFiles(supportedFiles);
      setPreviews(newPreviews);
    }
    
    // If there's only one file and autoProcess is true, process immediately
    if (supportedFiles.length === 1 && !allowMultipleFiles) {
      processFile(supportedFiles[0]);
    }
  };
  
  // Process a single file
  const processFile = async (file) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setProcessingFile(file);
    setProcessingProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          const newProgress = prev + (Math.random() * 10);
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 300);
      
      // Use the MultimodalUnderstandingService to process the file
      const result = await MultimodalUnderstandingService.processFile(
        file,
        analysisType,
        { ...context }, // Include any context
        familyId,
        selectedUser?.id
      );
      
      // Complete the progress
      clearInterval(progressInterval);
      setProcessingProgress(100);
      
      // Call the completion callback with the result
      if (onExtractionComplete) {
        onExtractionComplete(result, file);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      
      // Call the completion callback with the error
      if (onExtractionComplete) {
        onExtractionComplete({ error: error.message }, file);
      }
    } finally {
      // Short delay before resetting processing state to show 100% completion
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingFile(null);
        setProcessingProgress(0);
      }, 500);
    }
  };
  
  // Remove a file from the list
  const removeFile = (index) => {
    // Release object URL
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }
    
    // Update state by removing file at index
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  // Clean up object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview) URL.revokeObjectURL(preview);
      });
    };
  }, [previews]);
  
  // Determine what file types we accept
  const getAcceptedFileTypes = () => {
    if (analysisType === 'image' || analysisType === 'vision') {
      return "image/*";
    }
    return "image/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt";
  };
  
  return (
    <div 
      className={`multimodal-extractor border bg-white rounded-lg overflow-hidden shadow-sm ${className || ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-10 flex items-center justify-center z-10 backdrop-blur-sm border-2 border-dashed border-blue-400 rounded-lg">
          <div className="text-center p-4">
            <Upload size={28} className="mx-auto text-blue-500 mb-2" />
            <p className="text-sm font-medium text-blue-700">Drop files here</p>
          </div>
        </div>
      )}
      
      {/* File input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={getAcceptedFileTypes()}
        className="hidden"
        multiple={allowMultipleFiles}
      />
      
      {/* Content area */}
      <div className="p-3">
        {/* Title */}
        <div className="flex items-center mb-2">
          {analysisType === 'event' && <Calendar size={16} className="mr-1 text-blue-600" />}
          {analysisType === 'medical' && <FileText size={16} className="mr-1 text-red-600" />}
          {analysisType === 'document' && <FileText size={16} className="mr-1 text-green-600" />}
          <span className="text-sm font-medium">
            {analysisType === 'event' && 'Extract Event Details'}
            {analysisType === 'medical' && 'Extract Medical Information'}
            {analysisType === 'document' && 'Extract Document Content'}
          </span>
        </div>
        
        {/* File upload area (shown when no files selected) */}
        {files.length === 0 && (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={handleAttachFile}
          >
            <Upload size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Click to upload or drag files here
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {analysisType === 'event' ? 'Upload invitations, screenshots, or flyers' : 
               analysisType === 'medical' ? 'Upload medical reports, prescriptions, or insurance documents' :
               'Upload documents, images, or PDFs'}
            </p>
          </div>
        )}
        
        {/* Preview area (shown when files selected) */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="relative flex items-center border rounded-md p-2 group">
                {/* Preview thumbnail */}
                <div className="w-10 h-10 flex-shrink-0 mr-2 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  {previews[index] ? (
                    <img src={previews[index]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <FileText size={20} className="text-gray-400" />
                  )}
                </div>
                
                {/* File info */}
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB • {file.type || 'unknown'}
                  </p>
                  
                  {/* Processing progress */}
                  {isProcessing && processingFile === file && (
                    <div className="mt-1">
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${processingProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {processingProgress < 100 ? 'Processing...' : 'Completed'}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex items-center space-x-1">
                  {!isProcessing && (
                    <>
                      {/* Process button */}
                      <button
                        onClick={() => processFile(file)}
                        className="p-1 text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Process file"
                      >
                        <RotateCw size={16} />
                      </button>
                      
                      {/* Remove button */}
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove file"
                      >
                        <X size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {/* Add more files button (if allowMultipleFiles) */}
            {allowMultipleFiles && (
              <button
                onClick={handleAttachFile}
                className="flex items-center justify-center w-full p-2 border border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <PlusCircle size={14} className="mr-1" />
                Add More Files
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MultimodalContentExtractor;