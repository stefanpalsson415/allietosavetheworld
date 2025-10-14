import React, { useState, useEffect } from 'react';
import { FileText, X, Check, AlertCircle, Paperclip, Search, Eye, Download } from 'lucide-react';
import FamilyAllieDrive from '../document/FamilyAllieDrive';
import { useFamily } from '../../contexts/FamilyContext';
import { db } from '../../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

/**
 * Document Selector for Calendar Events
 *
 * Allows selecting documents from the family drive to attach to calendar events
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
  const { familyId } = useFamily();
  const [documents, setDocuments] = useState(selectedDocuments || []);
  const [availableDocuments, setAvailableDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Load available documents
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        if (!familyId) return;

        setLoading(true);

        // Build query to get all family documents
        let documentsQuery = query(
          collection(db, "familyDocuments"),
          where("familyId", "==", familyId)
        );

        // Apply child filter if provided
        if (childId) {
          documentsQuery = query(
            documentsQuery,
            where("childId", "==", childId)
          );
        }

        const querySnapshot = await getDocs(documentsQuery);

        const loadedDocuments = [];
        querySnapshot.forEach((doc) => {
          loadedDocuments.push({
            id: doc.id,
            ...doc.data()
          });
        });

        // Sort by upload date (newest first)
        loadedDocuments.sort((a, b) => {
          const dateA = a.uploadedAt?.toDate?.() || new Date(a.uploadedAt || 0);
          const dateB = b.uploadedAt?.toDate?.() || new Date(b.uploadedAt || 0);
          return dateB - dateA;
        });

        setAvailableDocuments(loadedDocuments);
        setLoading(false);
      } catch (error) {
        console.error("Error loading documents:", error);
        setError("Failed to load documents. Please try again.");
        setLoading(false);
      }
    };

    loadDocuments();
  }, [familyId, childId]);

  // Handle document selection
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

  // Get filtered documents based on search
  const filteredDocuments = availableDocuments.filter(doc => {
    if (!searchQuery) return true;

    const query = searchQuery.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(query) ||
      doc.description?.toLowerCase().includes(query) ||
      doc.fileName?.toLowerCase().includes(query)
    );
  });

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

  // Check if a document is selected
  const isDocumentSelected = (documentId) => {
    return documents.some(doc => doc.id === documentId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[200] flex items-center justify-center p-4 animate-fadeIn">
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
          {/* Search bar */}
          <div className="p-4 border-b bg-gray-50">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Search documents..."
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {/* Document selection list */}
          <div className="p-4">
            {loading ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 border-4 border-t-transparent border-gray-900 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500">Loading documents...</p>
              </div>
            ) : filteredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredDocuments.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => handleDocumentSelected(doc)}
                    className={`border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                      isDocumentSelected(doc.id) ? "ring-2 ring-blue-500 bg-blue-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        {doc.fileType?.startsWith('image/') ? (
                          <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3 bg-purple-100">
                            <Eye size={20} className="text-purple-500" />
                          </div>
                        ) : (
                          <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3 bg-green-100">
                            <FileText size={20} className="text-green-500" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-md truncate" style={{ maxWidth: '150px' }}>
                            {doc.title}
                          </h3>
                          <p className="text-xs text-gray-600 truncate" style={{ maxWidth: '150px' }}>
                            {doc.fileName || doc.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isDocumentSelected(doc.id) && (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <FileText size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-1">No documents found</p>
                <p className="text-sm text-gray-400">
                  {searchQuery ? 'Try changing your search term' : 'No documents available'}
                </p>
              </div>
            )}
          </div>

          {/* Selected Documents Preview */}
          {documents.length > 0 && (
            <div className="p-4 border-t bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Selected Documents:</h4>
              <div className="flex flex-wrap gap-2">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center bg-white border px-3 py-1.5 rounded-full text-sm"
                  >
                    <FileText size={16} className="text-blue-500" />
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

export default DocumentSelector;