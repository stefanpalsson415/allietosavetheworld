// src/components/document/DocumentDetailDrawer.jsx
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  Tag, 
  Edit, 
  Trash, 
  User, 
  Calendar, 
  Info,
  X,
  Plus,
  ChevronRight
} from 'lucide-react';
import DocumentProcessingService from '../../services/DocumentProcessingService';
import DocumentCategoryService from '../../services/DocumentCategoryService';
import { useFamily } from '../../contexts/FamilyContext';

const DocumentDetailDrawer = ({ 
  document, 
  isOpen,
  onClose, 
  onDelete, 
  onUpdate,
  showRelated = true
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDocument, setEditedDocument] = useState({ ...document });
  const [relatedDocuments, setRelatedDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  const { familyId, familyMembers } = useFamily();
  
  // Update editedDocument when document prop changes
  useEffect(() => {
    if (document) {
      setEditedDocument({ ...document });
      setIsEditing(false);
    }
  }, [document]);
  
  // Get category info
  const categoryInfo = document ? DocumentCategoryService.getCategory(document.category) : null;
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };
  
  // Load related documents
  useEffect(() => {
    if (document && showRelated && isOpen) {
      loadRelatedDocuments();
    }
  }, [document, showRelated, isOpen]);
  
  const loadRelatedDocuments = async () => {
    setIsLoading(true);
    try {
      // For now, just get documents from the same category
      // TODO: Implement proper related documents functionality
      const related = [];
      setRelatedDocuments(related);
    } catch (error) {
      console.error("Error loading related documents:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle document update
  const handleUpdateDocument = async () => {
    setIsLoading(true);
    try {
      const result = await DocumentProcessingService.updateDocumentMetadata(
        document.id, 
        {
          title: editedDocument.title,
          description: editedDocument.description,
          tags: editedDocument.tags,
          childId: editedDocument.childId
        }
      );
      
      if (result.success) {
        // Call onUpdate callback with updated document
        if (onUpdate) {
          onUpdate({
            ...document,
            title: editedDocument.title,
            description: editedDocument.description,
            tags: editedDocument.tags,
            childId: editedDocument.childId
          });
        }
        
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating document:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle document download
  const handleDownload = () => {
    if (document?.fileUrl) {
      window.open(document.fileUrl, '_blank');
    }
  };
  
  // Handle document print
  const handlePrint = () => {
    if (document?.fileUrl) {
      const printWindow = window.open(document.fileUrl, '_blank');
      printWindow.addEventListener('load', () => {
        printWindow.print();
      });
    }
  };
  
  // Handle document share
  const handleShare = () => {
    if (navigator.share && document?.fileUrl) {
      navigator.share({
        title: document.title,
        text: document.description,
        url: document.fileUrl
      }).catch(err => {
        console.error("Error sharing document:", err);
      });
    } else if (document?.fileUrl) {
      // Fallback - copy link to clipboard
      navigator.clipboard.writeText(document.fileUrl);
      alert("Document link copied to clipboard");
    }
  };
  
  // Handle adding new tag
  const handleAddTag = () => {
    if (newTag.trim() === '') return;
    
    if (!editedDocument.tags) {
      setEditedDocument({
        ...editedDocument,
        tags: [newTag.trim()]
      });
    } else if (!editedDocument.tags.includes(newTag.trim())) {
      setEditedDocument({
        ...editedDocument,
        tags: [...editedDocument.tags, newTag.trim()]
      });
    }
    
    setNewTag('');
  };
  
  // Handle removing tag
  const handleRemoveTag = (tag) => {
    setEditedDocument({
      ...editedDocument,
      tags: editedDocument.tags.filter(t => t !== tag)
    });
  };
  
  // Get child name
  const getChildName = (childId) => {
    if (!childId) return 'N/A';
    
    const child = familyMembers.find(m => m.id === childId);
    return child ? child.name : 'Unknown';
  };
  
  // Handle child selection
  const handleChildSelection = (e) => {
    const selectedChildId = e.target.value === 'none' ? null : e.target.value;
    
    setEditedDocument({
      ...editedDocument,
      childId: selectedChildId
    });
  };

  if (!document) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 z-40 ${
          isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={`fixed right-0 top-0 h-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '600px', maxWidth: '90vw' }}
      >
        <div className="h-full flex flex-col font-roboto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <button 
                onClick={onClose}
                className="p-1 rounded-full hover:bg-gray-100 mr-3"
              >
                <ChevronRight size={20} />
              </button>
              <FileText size={20} className="text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold">
                {isEditing ? 'Edit Document' : 'Document Details'}
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {/* Document preview */}
            <div className="mb-6">
              <div className="bg-gray-100 rounded-lg p-2 h-60 flex items-center justify-center mb-4">
                {document.fileType?.startsWith('image/') ? (
                  <img 
                    src={document.fileUrl} 
                    alt={document.title} 
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <FileText size={64} className="text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">{document.fileName}</p>
                    <p className="text-xs text-gray-400 mt-1">{document.fileType}</p>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={handleDownload}
                  className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center justify-center"
                >
                  <Download size={16} className="mr-1" />
                  Download
                </button>
                
                <button 
                  onClick={handlePrint}
                  className="flex-1 py-2 px-3 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 flex items-center justify-center"
                >
                  <Printer size={16} className="mr-1" />
                  Print
                </button>
                
                <button 
                  onClick={handleShare}
                  className="flex-1 py-2 px-3 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 flex items-center justify-center"
                >
                  <Share2 size={16} className="mr-1" />
                  Share
                </button>
              </div>
            </div>
            
            {/* Document details */}
            {isEditing ? (
              // Edit mode
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editedDocument.title}
                    onChange={(e) => setEditedDocument({ ...editedDocument, title: e.target.value })}
                    className="w-full p-2 border rounded-md text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editedDocument.description || ''}
                    onChange={(e) => setEditedDocument({ ...editedDocument, description: e.target.value })}
                    className="w-full p-2 border rounded-md text-sm h-24 resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editedDocument.tags?.map(tag => (
                      <div 
                        key={tag} 
                        className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center"
                      >
                        <span>{tag}</span>
                        <button 
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-blue-500 hover:text-blue-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag"
                      className="flex-1 p-2 border rounded-l-md text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    />
                    <button
                      onClick={handleAddTag}
                      className="bg-blue-600 text-white px-3 rounded-r-md hover:bg-blue-700"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Associated Child
                  </label>
                  <select
                    value={editedDocument.childId || 'none'}
                    onChange={handleChildSelection}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="none">None</option>
                    {familyMembers.filter(m => m.role === 'child').map(child => (
                      <option key={child.id} value={child.id}>
                        {child.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleUpdateDocument}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  <button
                    onClick={() => {
                      setEditedDocument({ ...document });
                      setIsEditing(false);
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // View mode
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium">{document.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{document.description}</p>
                </div>
                
                <div className="flex items-center text-sm">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                    <span className="text-blue-600 font-medium">
                      {categoryInfo?.icon ? (
                        <span className={`icon-${categoryInfo.icon}`}></span>
                      ) : (
                        document.category.charAt(0).toUpperCase()
                      )}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {categoryInfo?.name || document.category}
                    </p>
                    <p className="text-xs text-gray-500">Category</p>
                  </div>
                </div>
                
                <div className="flex items-center text-sm">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-2">
                    <Calendar size={16} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {formatDate(document.uploadedAt)}
                    </p>
                    <p className="text-xs text-gray-500">Upload Date</p>
                  </div>
                </div>
                
                {document.childId && (
                  <div className="flex items-center text-sm">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-2">
                      <User size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {getChildName(document.childId)}
                      </p>
                      <p className="text-xs text-gray-500">Associated Child</p>
                    </div>
                  </div>
                )}
                
                {/* AI Analysis Section */}
                {document.aiAnalysis && (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-sm text-blue-900 flex items-center">
                      <Info size={16} className="mr-1" />
                      AI Analysis
                    </h4>
                    
                    {document.aiAnalysis.summary && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Summary</p>
                        <p className="text-sm text-gray-800">{document.aiAnalysis.summary}</p>
                      </div>
                    )}
                    
                    {document.aiAnalysis.extractedDates && document.aiAnalysis.extractedDates.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Important Dates</p>
                        <ul className="text-sm text-gray-800 space-y-1">
                          {document.aiAnalysis.extractedDates.map((date, idx) => {
                            // Handle both string and object formats
                            const dateText = typeof date === 'string' ? date : 
                              (date.date ? `${date.date}${date.context ? ` - ${date.context}` : ''}` : '');
                            
                            return (
                              <li key={idx} className="flex items-start">
                                <Calendar size={14} className="mr-1 mt-0.5 text-blue-600" />
                                <span>{dateText}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    
                    {document.aiAnalysis.extractedPeople && document.aiAnalysis.extractedPeople.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">People Mentioned</p>
                        <div className="flex flex-wrap gap-2">
                          {document.aiAnalysis.extractedPeople.map((person, idx) => (
                            <span key={idx} className="text-sm bg-white px-2 py-1 rounded-md">
                              {person}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {document.aiAnalysis.suggestedContacts && document.aiAnalysis.suggestedContacts.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Suggested Contacts</p>
                        <ul className="text-sm text-gray-800 space-y-1">
                          {document.aiAnalysis.suggestedContacts.map((contact, idx) => {
                            // Handle both string and object formats
                            if (typeof contact === 'string') {
                              return (
                                <li key={idx} className="flex items-center">
                                  <User size={14} className="mr-1 text-blue-600" />
                                  <span>{contact}</span>
                                </li>
                              );
                            }
                            
                            return (
                              <li key={idx} className="flex items-center">
                                <User size={14} className="mr-1 text-blue-600" />
                                <span>{contact.name || 'Unknown'}{contact.type ? ` - ${contact.type}` : ''}</span>
                                {contact.phone && <span className="text-gray-500 ml-2">({contact.phone})</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    
                    {document.aiAnalysis.actionItems && document.aiAnalysis.actionItems.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Action Items</p>
                        <ul className="text-sm text-gray-800 space-y-1">
                          {document.aiAnalysis.actionItems.map((item, idx) => {
                            // Handle both string and object formats
                            const taskText = typeof item === 'string' ? item : (item.task || item.description || '');
                            const priority = typeof item === 'object' ? item.priority : 'medium';
                            
                            return (
                              <li key={idx} className="flex items-start">
                                <span className={`inline-block w-2 h-2 rounded-full mr-2 mt-1.5 ${
                                  priority === 'high' ? 'bg-red-500' : 
                                  priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                                }`} />
                                <span>{taskText}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    
                    {document.aiAnalysis.keyInfo && document.aiAnalysis.keyInfo.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Key Information</p>
                        <ul className="text-sm text-gray-800 space-y-1">
                          {document.aiAnalysis.keyInfo.map((info, idx) => (
                            <li key={idx}>• {info}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                
                {document.tags && document.tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center">
                      <Tag size={16} className="mr-1" />
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {document.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {document.entities && Object.keys(document.entities).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Extracted Details</p>
                    <div className="bg-gray-50 p-3 rounded-md text-sm space-y-2">
                      {Object.entries(document.entities).map(([key, values]) => (
                        values && values.length > 0 && (
                          <div key={key}>
                            <p className="text-xs text-gray-500 capitalize">{key}</p>
                            <p className="text-sm">{values.slice(0, 3).join(', ')}</p>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Extracted text preview */}
                {document.extractedText && (
                  <div className="border rounded-lg p-3">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Info size={16} className="mr-1 text-blue-500" />
                      Extracted Text
                    </h3>
                    <div className="max-h-40 overflow-y-auto text-xs bg-gray-50 p-2 rounded">
                      <pre className="whitespace-pre-wrap font-sans">
                        {document.extractedText}
                      </pre>
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 flex items-center"
                  >
                    <Edit size={16} className="mr-1" />
                    Edit
                  </button>
                  
                  {onDelete && (
                    <button
                      onClick={() => onDelete(document.id)}
                      className="px-4 py-2 bg-white border border-red-300 text-red-600 rounded-md text-sm hover:bg-red-50 flex items-center"
                    >
                      <Trash size={16} className="mr-1" />
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {/* Related documents */}
            {showRelated && relatedDocuments.length > 0 && !isEditing && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-medium mb-3">Related Documents</h3>
                <div className="space-y-3">
                  {relatedDocuments.map(relDoc => (
                    <div 
                      key={relDoc.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex items-center"
                      onClick={() => window.open(relDoc.fileUrl, '_blank')}
                    >
                      <FileText size={20} className="text-blue-500 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{relDoc.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(relDoc.uploadedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentDetailDrawer;