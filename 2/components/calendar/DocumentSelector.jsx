import React, { useState, useEffect } from 'react';
import { FileText, X, Check, AlertCircle, Paperclip } from 'lucide-react';
import DocumentLibrary from '../document/DocumentLibrary';

/**
 * Document Selector for Calendar Events
 * 
 * Allows selecting documents from the document library to attach to calendar events
 * 
 * @param {Object} props
 * @param {Array} props.selectedDocuments - Currently selected documents
 * @param {Function} props.onDocumentsSelected - Callback when documents are selected
 * @param {Function} props.onClose - Callback when the selector is closed
 * @param {string} props.childId - ID of the child for the event (to filter documents)
 */
const DocumentSelector = ({ 
  selectedDocuments = [], 
  onDocumentsSelected, 
  onClose,
  childId = null
}) => {
  const [documents, setDocuments] = useState(selectedDocuments || []);
  const [showLibrary, setShowLibrary] = useState(true);
  const [error, setError] = useState(null);

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

  // Helper to get document icon based on file type
  const getDocumentIcon = (fileType) => {
    if (!fileType) return <FileText size={20} className="text-gray-400" />;
    
    if (fileType.startsWith('image/')) {
      return <img 
        src={document.fileUrl} 
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
        
        <div className="flex-1 overflow-auto">
          {/* Document Library for selection */}
          {showLibrary && (
            <DocumentLibrary
              initialChildId={childId}
              selectMode={true}
              onSelectDocument={handleDocumentSelected}
              onClose={() => setShowLibrary(false)}
            />
          )}
          
          {/* Selected Documents Preview */}
          {documents.length > 0 && (
            <div className="p-4 border-t">
              <h4 className="text-sm font-medium mb-2">Selected Documents:</h4>
              <div className="flex flex-wrap gap-2">
                {documents.map(doc => (
                  <div 
                    key={doc.id}
                    className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full text-sm"
                  >
                    {getDocumentIcon(doc.fileType)}
                    <span className="mx-2 truncate max-w-[150px]">{doc.title}</span>
                    <button 
                      onClick={() => handleDocumentSelected(doc)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Error message if any */}
          {error && (
            <div className="p-3 m-4 bg-red-50 text-red-700 rounded-md flex items-center">
              <AlertCircle size={16} className="mr-2" />
              {error}
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
          >
            <Check size={16} className="mr-2" />
            Attach {documents.length} Document{documents.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentSelector;