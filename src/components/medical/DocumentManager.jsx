// src/components/medical/DocumentManager.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileText, FilePlus, FolderPlus, Trash, Download, User,
  Calendar, CheckCircle, AlertCircle, Plus, Search, X, Upload
} from 'lucide-react';
import { db } from '../../services/firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, serverTimestamp, Timestamp 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

/**
 * Component to manage medical documents for the family
 */
const DocumentManager = () => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  
  // State variables
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Filter state
  const [filters, setFilters] = useState({
    category: 'all',
    patient: 'all',
    searchTerm: ''
  });
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    patientId: '',
    category: '',
    date: '',
    expirationDate: '',
    fileName: '',
    fileType: '',
    fileSize: 0,
    tags: []
  });
  
  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    color: '#3B82F6' // Default blue
  });
  
  // New tag input
  const [newTag, setNewTag] = useState('');
  
  // Load documents and categories on component mount
  useEffect(() => {
    if (familyId) {
      fetchDocuments();
      fetchCategories();
    }
  }, [familyId, filters]);
  
  // Fetch documents from Firestore
  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let documentsQuery = query(
        collection(db, 'medicalDocuments'),
        where('familyId', '==', familyId)
      );
      
      // Apply category filter
      if (filters.category !== 'all') {
        documentsQuery = query(documentsQuery, where('category', '==', filters.category));
      }
      
      // Apply patient filter
      if (filters.patient !== 'all') {
        documentsQuery = query(documentsQuery, where('patientId', '==', filters.patient));
      }
      
      const documentDocs = await getDocs(documentsQuery);
      
      let docs = [];
      documentDocs.forEach(doc => {
        docs.push(doc.data());
      });
      
      // Apply search filter (client-side)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        docs = docs.filter(doc => 
          doc.title.toLowerCase().includes(searchTerm) ||
          doc.description.toLowerCase().includes(searchTerm) ||
          doc.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      
      // Sort by date (newest first)
      docs.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date || 0);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date || 0);
        return dateB - dateA;
      });
      
      setDocuments(docs);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to load documents');
      setLoading(false);
    }
  };
  
  // Fetch document categories
  const fetchCategories = async () => {
    try {
      const categoriesQuery = query(
        collection(db, 'medicalDocumentCategories'),
        where('familyId', '==', familyId)
      );
      
      const categoryDocs = await getDocs(categoriesQuery);
      
      const cats = [];
      categoryDocs.forEach(doc => {
        cats.push(doc.data());
      });
      
      // Sort alphabetically
      cats.sort((a, b) => a.name.localeCompare(b.name));
      
      setCategories(cats);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };
  
  // Create a new document
  const handleUploadDocument = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Convert dates to Firestore timestamps
      const dateTimestamp = uploadForm.date 
        ? Timestamp.fromDate(new Date(uploadForm.date)) 
        : Timestamp.fromDate(new Date());
        
      const expirationTimestamp = uploadForm.expirationDate 
        ? Timestamp.fromDate(new Date(uploadForm.expirationDate))
        : null;
      
      // Generate document ID
      const documentId = uuidv4();
      
      // Prepare document data
      const documentData = {
        id: documentId,
        familyId,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        
        title: uploadForm.title,
        description: uploadForm.description,
        patientId: uploadForm.patientId,
        category: uploadForm.category,
        date: dateTimestamp,
        expirationDate: expirationTimestamp,
        
        // File info (would normally come from actual upload)
        fileName: uploadForm.fileName || 'example.pdf',
        fileType: uploadForm.fileType || 'application/pdf',
        fileSize: uploadForm.fileSize || 0,
        fileUrl: 'https://example.com/document', // Placeholder
        
        tags: uploadForm.tags
      };
      
      // Save document to Firestore
      await setDoc(doc(db, 'medicalDocuments', documentId), documentData);
      
      // Reset form and refresh documents
      resetUploadForm();
      await fetchDocuments();
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document');
      setLoading(false);
    }
  };
  
  // Create a new category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Generate category ID
      const categoryId = uuidv4();
      
      // Prepare category data
      const categoryData = {
        id: categoryId,
        familyId,
        name: categoryForm.name,
        description: categoryForm.description,
        color: categoryForm.color,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Save category to Firestore
      await setDoc(doc(db, 'medicalDocumentCategories', categoryId), categoryData);
      
      // Reset form and refresh categories
      setCategoryForm({
        name: '',
        description: '',
        color: '#3B82F6'
      });
      setShowCategoryForm(false);
      await fetchCategories();
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Failed to create category');
      setLoading(false);
    }
  };
  
  // Delete a document
  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await deleteDoc(doc(db, 'medicalDocuments', documentId));
      
      // Refresh documents
      await fetchDocuments();
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Failed to delete document');
      setLoading(false);
    }
  };
  
  // Reset upload form
  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      patientId: '',
      category: '',
      date: '',
      expirationDate: '',
      fileName: '',
      fileType: '',
      fileSize: 0,
      tags: []
    });
    
    setUploadingDocument(false);
    setLoading(false);
  };
  
  // Handle upload form field change
  const handleUploadFormChange = (e) => {
    const { name, value } = e.target;
    setUploadForm({
      ...uploadForm,
      [name]: value
    });
  };
  
  // Handle category form field change
  const handleCategoryFormChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm({
      ...categoryForm,
      [name]: value
    });
  };
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    if (!uploadForm.tags.includes(newTag.trim())) {
      setUploadForm({
        ...uploadForm,
        tags: [...uploadForm.tags, newTag.trim()]
      });
    }
    
    setNewTag('');
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tag) => {
    setUploadForm({
      ...uploadForm,
      tags: uploadForm.tags.filter(t => t !== tag)
    });
  };
  
  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters({
      ...filters,
      [key]: value
    });
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };
  
  // Get patient name from ID
  const getPatientName = (patientId) => {
    if (!patientId) return 'Family';
    
    const patient = familyMembers.find(m => m.id === patientId);
    return patient ? patient.name : 'Unknown';
  };
  
  // Get category color from ID
  const getCategoryInfo = (categoryId) => {
    if (!categoryId) return { name: 'Uncategorized', color: '#9CA3AF' };
    
    const category = categories.find(c => c.id === categoryId);
    return category 
      ? { name: category.name, color: category.color }
      : { name: 'Uncategorized', color: '#9CA3AF' };
  };
  
  // Mock file upload handler
  const handleFileSelect = (e) => {
    // Get the file
    const file = e.target.files[0];
    
    if (file) {
      setUploadForm({
        ...uploadForm,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
    }
  };
  
  // Render upload form
  const renderUploadForm = () => (
    <div className="bg-white p-4 mb-6 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Upload Medical Document</h3>
        <button
          onClick={resetUploadForm}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleUploadDocument}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Document Title */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Title *
            </label>
            <input
              type="text"
              name="title"
              value={uploadForm.title}
              onChange={handleUploadFormChange}
              placeholder="Lab Results, Prescription, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Patient and Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient
            </label>
            <select
              name="patientId"
              value={uploadForm.patientId}
              onChange={handleUploadFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Family / General</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowCategoryForm(true)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                New Category
              </button>
            </div>
            <select
              name="category"
              value={uploadForm.category}
              onChange={handleUploadFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Uncategorized</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Date
            </label>
            <input
              type="date"
              name="date"
              value={uploadForm.date}
              onChange={handleUploadFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date (if applicable)
            </label>
            <input
              type="date"
              name="expirationDate"
              value={uploadForm.expirationDate}
              onChange={handleUploadFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* File Upload */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File *
            </label>
            <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
              <div className="flex items-center justify-center w-full">
                <label className="w-full flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg shadow-lg tracking-wide border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white">
                  <Upload size={36} />
                  <span className="mt-2 text-sm">Select a file</span>
                  <input 
                    type="file" 
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
              
              {uploadForm.fileName && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                  <p><span className="font-medium">File:</span> {uploadForm.fileName}</p>
                  {uploadForm.fileSize > 0 && (
                    <p><span className="font-medium">Size:</span> {Math.round(uploadForm.fileSize / 1024)} KB</p>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">
                Note: File upload is simulated in this demo
              </p>
            </div>
          </div>
          
          {/* Description */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={uploadForm.description}
              onChange={handleUploadFormChange}
              rows="3"
              placeholder="Additional details about this document"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Tags */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {uploadForm.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-800 hover:text-blue-900"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetUploadForm}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            disabled={loading || !uploadForm.title}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Upload Document
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
  
  // Render category form
  const renderCategoryForm = () => (
    <div className="bg-white p-4 mb-6 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Create Document Category</h3>
        <button
          onClick={() => setShowCategoryForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleCreateCategory}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Name */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              name="name"
              value={categoryForm.name}
              onChange={handleCategoryFormChange}
              placeholder="Lab Results, Prescriptions, Insurance, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Description */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={categoryForm.description}
              onChange={handleCategoryFormChange}
              rows="2"
              placeholder="What kinds of documents belong in this category?"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="color"
              name="color"
              value={categoryForm.color}
              onChange={handleCategoryFormChange}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setShowCategoryForm(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            disabled={loading || !categoryForm.name}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Creating...
              </>
            ) : (
              <>
                <FolderPlus size={16} className="mr-2" />
                Create Category
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
  
  // Render filter controls
  const renderFilters = () => (
    <div className="mb-4 bg-gray-50 p-3 border border-gray-200 rounded-lg">
      <div className="flex flex-wrap gap-3">
        {/* Category filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="">Uncategorized</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Patient filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Patient
          </label>
          <select
            value={filters.patient}
            onChange={(e) => handleFilterChange('patient', e.target.value)}
            className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Patients</option>
            <option value="">Family / General</option>
            {familyMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Search filter */}
        <div className="flex-grow">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="Search documents"
              className="w-full px-3 py-1 pl-8 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search size={14} className="absolute left-2.5 top-2 text-gray-400" />
            {filters.searchTerm && (
              <button
                onClick={() => handleFilterChange('searchTerm', '')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
        
        {/* Upload button */}
        <div className="flex items-end">
          <button
            onClick={() => setUploadingDocument(true)}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center"
          >
            <FilePlus size={14} className="mr-1" />
            Upload Document
          </button>
        </div>
      </div>
    </div>
  );
  
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <FileText size={18} className="mr-2" />
          Medical Document Manager
        </h3>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        </div>
      )}
      
      {/* Forms */}
      {uploadingDocument && renderUploadForm()}
      {showCategoryForm && renderCategoryForm()}
      
      {/* Filters */}
      {!uploadingDocument && !showCategoryForm && renderFilters()}
      
      {/* Loading state */}
      {loading && documents.length === 0 && !uploadingDocument && !showCategoryForm && (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p>Loading documents...</p>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && documents.length === 0 && !uploadingDocument && !showCategoryForm && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FileText size={40} className="mx-auto text-gray-400 mb-3" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No documents found</h4>
          <p className="text-gray-500 mb-4">
            {filters.searchTerm || filters.category !== 'all' || filters.patient !== 'all'
              ? "Try changing your search filters"
              : "Upload your first medical document to get started"}
          </p>
          <button
            onClick={() => setUploadingDocument(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 inline-flex items-center"
          >
            <FilePlus size={16} className="mr-2" />
            Upload Document
          </button>
        </div>
      )}
      
      {/* Documents grid */}
      {documents.length > 0 && !uploadingDocument && !showCategoryForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => {
            const { name: categoryName, color: categoryColor } = getCategoryInfo(doc.category);
            
            return (
              <div
                key={doc.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Document header */}
                <div 
                  className="p-3 border-b" 
                  style={{ backgroundColor: `${categoryColor}15` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-base truncate" title={doc.title}>
                        {doc.title}
                      </h4>
                      <div className="flex items-center mt-1">
                        <span
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{ 
                            backgroundColor: `${categoryColor}30`,
                            color: categoryColor
                          }}
                        >
                          {categoryName}
                        </span>
                        
                        {doc.expirationDate && (
                          <span className="ml-2 text-xs text-gray-500">
                            Expires: {formatDate(doc.expirationDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {}}
                        className="p-1 text-gray-600 hover:text-gray-800"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="p-1 text-gray-600 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Document details */}
                <div className="p-3">
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <User size={14} className="mr-1" />
                    {getPatientName(doc.patientId)}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={14} className="mr-1" />
                    {formatDate(doc.date)}
                  </div>
                  
                  {doc.description && (
                    <div className="mt-2 text-sm text-gray-700 line-clamp-2">
                      {doc.description}
                    </div>
                  )}
                  
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {doc.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* File info */}
                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div>{doc.fileName}</div>
                    {doc.fileSize && (
                      <div>{Math.round(doc.fileSize / 1024)} KB</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentManager;