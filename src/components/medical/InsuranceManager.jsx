// src/components/medical/InsuranceManager.jsx
import React, { useState, useEffect } from 'react';
import { useFamily } from '../../contexts/FamilyContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  CreditCard, Edit, Trash, Shield, Phone, Calendar,
  AlertCircle, Plus, Check, X, FileText, UserPlus
} from 'lucide-react';
import { db } from '../../services/firebase';
import { 
  collection, doc, getDoc, getDocs, setDoc, updateDoc, 
  deleteDoc, query, where, serverTimestamp, addDoc 
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

/**
 * Component to manage insurance information for the family
 */
const InsuranceManager = () => {
  const { familyId, familyMembers } = useFamily();
  const { currentUser } = useAuth();
  
  // State variables
  const [insurancePlans, setInsurancePlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  
  // Form data for new/edit plan
  const [formData, setFormData] = useState({
    provider: '',
    planName: '',
    policyNumber: '',
    groupNumber: '',
    memberID: '',
    coverageType: 'medical',
    primaryHolder: '',
    phoneNumber: '',
    website: '',
    effectiveDate: '',
    expirationDate: '',
    coveredMembers: [],
    notes: ''
  });
  
  // Document upload form
  const [documentForm, setDocumentForm] = useState({
    name: '',
    description: '',
    planId: '',
    memberId: '',
    documentType: 'insurance-card',
    expirationDate: '',
    fileUrl: '' // In a real app, this would be set after uploading
  });
  
  // Load insurance plans on component mount
  useEffect(() => {
    if (familyId) {
      fetchInsurancePlans();
    }
  }, [familyId]);
  
  // Fetch insurance plans from Firestore
  const fetchInsurancePlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const plansCollection = collection(db, 'insurancePlans');
      const plansQuery = query(plansCollection, where('familyId', '==', familyId));
      const planDocs = await getDocs(plansQuery);
      
      const plans = [];
      planDocs.forEach(doc => {
        plans.push(doc.data());
      });
      
      // Sort by provider name
      plans.sort((a, b) => a.provider.localeCompare(b.provider));
      
      setInsurancePlans(plans);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching insurance plans:', err);
      setError('Failed to load insurance plans');
      setLoading(false);
    }
  };
  
  // Create or update insurance plan
  const handleSavePlan = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Format date fields
      const effectiveDate = formData.effectiveDate ? new Date(formData.effectiveDate) : null;
      const expirationDate = formData.expirationDate ? new Date(formData.expirationDate) : null;
      
      // Prepare plan data
      const planData = {
        ...formData,
        effectiveDate: effectiveDate,
        expirationDate: expirationDate,
        familyId,
        updatedAt: new Date(),
        updatedBy: currentUser.uid
      };
      
      if (editingPlan) {
        // Update existing plan
        await updateDoc(doc(db, 'insurancePlans', editingPlan), planData);
      } else {
        // Create new plan
        const planId = uuidv4();
        await setDoc(doc(db, 'insurancePlans', planId), {
          ...planData,
          id: planId,
          createdAt: new Date(),
          createdBy: currentUser.uid
        });
      }
      
      // Reset form and refresh plans
      resetForm();
      await fetchInsurancePlans();
    } catch (err) {
      console.error('Error saving insurance plan:', err);
      setError('Failed to save insurance plan');
      setLoading(false);
    }
  };
  
  // Delete insurance plan
  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this insurance plan?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await deleteDoc(doc(db, 'insurancePlans', planId));
      
      // Also delete associated documents
      const docsCollection = collection(db, 'insuranceDocuments');
      const docsQuery = query(docsCollection, where('planId', '==', planId));
      const docDocs = await getDocs(docsQuery);
      
      const deleteDocs = [];
      docDocs.forEach(docRef => {
        deleteDocs.push(deleteDoc(doc(db, 'insuranceDocuments', docRef.id)));
      });
      
      await Promise.all(deleteDocs);
      
      resetForm();
      await fetchInsurancePlans();
    } catch (err) {
      console.error('Error deleting insurance plan:', err);
      setError('Failed to delete insurance plan');
      setLoading(false);
    }
  };
  
  // Edit insurance plan
  const handleEditPlan = (plan) => {
    setFormData({
      provider: plan.provider || '',
      planName: plan.planName || '',
      policyNumber: plan.policyNumber || '',
      groupNumber: plan.groupNumber || '',
      memberID: plan.memberID || '',
      coverageType: plan.coverageType || 'medical',
      primaryHolder: plan.primaryHolder || '',
      phoneNumber: plan.phoneNumber || '',
      website: plan.website || '',
      effectiveDate: plan.effectiveDate ? new Date(plan.effectiveDate).toISOString().split('T')[0] : '',
      expirationDate: plan.expirationDate ? new Date(plan.expirationDate).toISOString().split('T')[0] : '',
      coveredMembers: plan.coveredMembers || [],
      notes: plan.notes || ''
    });
    
    setEditingPlan(plan.id);
    setCreatingPlan(true);
  };
  
  // Save insurance document
  const handleSaveDocument = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Format date fields
      const expirationDate = documentForm.expirationDate ? new Date(documentForm.expirationDate) : null;
      
      // Prepare document data
      const docData = {
        ...documentForm,
        expirationDate: expirationDate,
        familyId,
        createdAt: new Date(),
        createdBy: currentUser.uid,
        updatedAt: new Date(),
        updatedBy: currentUser.uid
      };
      
      // Create new document
      const docId = uuidv4();
      await setDoc(doc(db, 'insuranceDocuments', docId), {
        ...docData,
        id: docId
      });
      
      // Reset form and close it
      setDocumentForm({
        name: '',
        description: '',
        planId: '',
        memberId: '',
        documentType: 'insurance-card',
        expirationDate: '',
        fileUrl: ''
      });
      setShowDocumentForm(false);
      
      // Refresh plans
      await fetchInsurancePlans();
    } catch (err) {
      console.error('Error saving insurance document:', err);
      setError('Failed to save insurance document');
      setLoading(false);
    }
  };
  
  // Reset form and state
  const resetForm = () => {
    setFormData({
      provider: '',
      planName: '',
      policyNumber: '',
      groupNumber: '',
      memberID: '',
      coverageType: 'medical',
      primaryHolder: '',
      phoneNumber: '',
      website: '',
      effectiveDate: '',
      expirationDate: '',
      coveredMembers: [],
      notes: ''
    });
    
    setEditingPlan(null);
    setCreatingPlan(false);
    setLoading(false);
  };
  
  // Handle form field change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'coveredMembers') {
      // Handle multi-select checkboxes for covered members
      const memberId = value;
      let updatedMembers = [...formData.coveredMembers];
      
      if (checked) {
        if (!updatedMembers.includes(memberId)) {
          updatedMembers.push(memberId);
        }
      } else {
        updatedMembers = updatedMembers.filter(id => id !== memberId);
      }
      
      setFormData({
        ...formData,
        coveredMembers: updatedMembers
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle document form field change
  const handleDocumentFormChange = (e) => {
    const { name, value } = e.target;
    setDocumentForm({
      ...documentForm,
      [name]: value
    });
  };
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid date';
    }
  };
  
  // Get coverage type label
  const getCoverageTypeLabel = (type) => {
    const coverageTypes = {
      'medical': 'Medical',
      'dental': 'Dental',
      'vision': 'Vision',
      'prescription': 'Prescription',
      'mental-health': 'Mental Health',
      'combined': 'Combined'
    };
    
    return coverageTypes[type] || type;
  };
  
  // Get member name from ID
  const getMemberName = (memberId) => {
    const member = familyMembers.find(m => m.id === memberId);
    return member ? member.name : 'Unknown';
  };
  
  // Render form for creating/editing insurance plan
  const renderPlanForm = () => (
    <div className="bg-white p-4 mb-6 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">
          {editingPlan ? 'Edit Insurance Plan' : 'Add New Insurance Plan'}
        </h3>
        <button
          onClick={resetForm}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSavePlan}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Provider */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Insurance Provider *
            </label>
            <input
              type="text"
              name="provider"
              value={formData.provider}
              onChange={handleChange}
              placeholder="Blue Cross Blue Shield, Aetna, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {/* Plan Name and Coverage Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan Name
            </label>
            <input
              type="text"
              name="planName"
              value={formData.planName}
              onChange={handleChange}
              placeholder="e.g., Family PPO Plan, HMO Choice"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coverage Type
            </label>
            <select
              name="coverageType"
              value={formData.coverageType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="medical">Medical</option>
              <option value="dental">Dental</option>
              <option value="vision">Vision</option>
              <option value="prescription">Prescription</option>
              <option value="mental-health">Mental Health</option>
              <option value="combined">Combined</option>
            </select>
          </div>
          
          {/* Policy and Group Numbers */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Policy Number *
            </label>
            <input
              type="text"
              name="policyNumber"
              value={formData.policyNumber}
              onChange={handleChange}
              placeholder="Policy number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Number
            </label>
            <input
              type="text"
              name="groupNumber"
              value={formData.groupNumber}
              onChange={handleChange}
              placeholder="Group number (if applicable)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Member ID and Primary Holder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member ID
            </label>
            <input
              type="text"
              name="memberID"
              value={formData.memberID}
              onChange={handleChange}
              placeholder="Member ID"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Policy Holder *
            </label>
            <select
              name="primaryHolder"
              value={formData.primaryHolder}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select primary holder</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Contact Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Insurance phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="Insurance website"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Dates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective Date
            </label>
            <input
              type="date"
              name="effectiveDate"
              value={formData.effectiveDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Covered Members */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Covered Members *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border border-gray-300 rounded-md max-h-40 overflow-y-auto">
              {familyMembers.map(member => (
                <label key={member.id} className="flex items-center">
                  <input
                    type="checkbox"
                    name="coveredMembers"
                    value={member.id}
                    checked={formData.coveredMembers.includes(member.id)}
                    onChange={handleChange}
                    className="form-checkbox h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="ml-2 text-sm">{member.name}</span>
                </label>
              ))}
            </div>
            {formData.coveredMembers.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Please select at least one covered member
              </p>
            )}
          </div>
          
          {/* Notes */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Any additional information about this insurance plan"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            disabled={loading || formData.coveredMembers.length === 0}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Saving...
              </>
            ) : (
              <>
                <Check size={16} className="mr-2" />
                {editingPlan ? 'Update Plan' : 'Save Plan'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
  
  // Render form for adding insurance document
  const renderDocumentForm = () => (
    <div className="bg-white p-4 mb-6 border border-gray-200 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Add Insurance Document</h3>
        <button
          onClick={() => setShowDocumentForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <form onSubmit={handleSaveDocument}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Document Name and Type */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Name *
            </label>
            <input
              type="text"
              name="name"
              value={documentForm.name}
              onChange={handleDocumentFormChange}
              placeholder="Insurance Card, Policy Document, etc."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document Type
            </label>
            <select
              name="documentType"
              value={documentForm.documentType}
              onChange={handleDocumentFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="insurance-card">Insurance Card</option>
              <option value="policy">Policy Document</option>
              <option value="explanation-of-benefits">Explanation of Benefits</option>
              <option value="claims">Claims Document</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {/* Related Plan and Member */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Insurance Plan *
            </label>
            <select
              name="planId"
              value={documentForm.planId}
              onChange={handleDocumentFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select insurance plan</option>
              {insurancePlans.map(plan => (
                <option key={plan.id} value={plan.id}>
                  {plan.provider} - {plan.planName || getCoverageTypeLabel(plan.coverageType)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Family Member
            </label>
            <select
              name="memberId"
              value={documentForm.memberId}
              onChange={handleDocumentFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All members / general</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Expiration and File */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date (if applicable)
            </label>
            <input
              type="date"
              name="expirationDate"
              value={documentForm.expirationDate}
              onChange={handleDocumentFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Upload
            </label>
            <input
              type="file"
              name="file"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={true}
            />
            <p className="text-xs text-gray-500 mt-1">
              File upload is not available in this demo
            </p>
          </div>
          
          {/* Description */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={documentForm.description}
              onChange={handleDocumentFormChange}
              rows="2"
              placeholder="Additional information about this document"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="mt-4 flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => setShowDocumentForm(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
            disabled={loading || !documentForm.planId || !documentForm.name}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Saving...
              </>
            ) : (
              <>
                <FileText size={16} className="mr-2" />
                Save Document
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
  
  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Shield size={18} className="mr-2" />
          Insurance Information Manager
        </h3>
        
        {!creatingPlan && !showDocumentForm && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowDocumentForm(true)}
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm flex items-center"
              disabled={insurancePlans.length === 0}
            >
              <FileText size={14} className="mr-1" />
              Add Document
            </button>
            
            <button
              onClick={() => setCreatingPlan(true)}
              className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center"
            >
              <Plus size={14} className="mr-1" />
              Add Insurance Plan
            </button>
          </div>
        )}
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
      {creatingPlan && renderPlanForm()}
      {showDocumentForm && renderDocumentForm()}
      
      {/* Loading state */}
      {loading && insurancePlans.length === 0 && !creatingPlan && !showDocumentForm && (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-2"></div>
          <p>Loading insurance information...</p>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && insurancePlans.length === 0 && !creatingPlan && !showDocumentForm && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <Shield size={40} className="mx-auto text-gray-400 mb-3" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No insurance plans</h4>
          <p className="text-gray-500 mb-4">
            Add insurance information to easily access policy details for medical appointments
          </p>
          <button
            onClick={() => setCreatingPlan(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 inline-flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Insurance Plan
          </button>
        </div>
      )}
      
      {/* Insurance plans list */}
      {insurancePlans.length > 0 && !creatingPlan && !showDocumentForm && (
        <div className="space-y-4">
          {insurancePlans.map(plan => (
            <div
              key={plan.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Plan header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-lg">{plan.provider}</h4>
                    <div className="text-sm text-gray-500">
                      {plan.planName || getCoverageTypeLabel(plan.coverageType)}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="p-1 text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Plan details */}
              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {/* Policy information */}
                  <div>
                    <span className="font-medium">Policy Number:</span> {plan.policyNumber}
                  </div>
                  
                  {plan.groupNumber && (
                    <div>
                      <span className="font-medium">Group Number:</span> {plan.groupNumber}
                    </div>
                  )}
                  
                  {plan.memberID && (
                    <div>
                      <span className="font-medium">Member ID:</span> {plan.memberID}
                    </div>
                  )}
                  
                  {/* Primary holder */}
                  <div>
                    <span className="font-medium">Primary Holder:</span> {getMemberName(plan.primaryHolder)}
                  </div>
                  
                  {/* Contact information */}
                  {plan.phoneNumber && (
                    <div className="flex items-center">
                      <Phone size={14} className="mr-1 text-gray-500" />
                      {plan.phoneNumber}
                    </div>
                  )}
                  
                  {/* Dates */}
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1 text-gray-500" />
                    {plan.effectiveDate ? (
                      <>Effective: {formatDate(plan.effectiveDate)}</>
                    ) : (
                      <>No effective date</>
                    )}
                    
                    {plan.expirationDate && (
                      <>, Expires: {formatDate(plan.expirationDate)}</>
                    )}
                  </div>
                </div>
                
                {/* Covered members */}
                <div className="mt-3">
                  <h5 className="text-sm font-medium mb-1">Covered Members:</h5>
                  <div className="flex flex-wrap gap-1">
                    {plan.coveredMembers.map(memberId => (
                      <span
                        key={memberId}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {getMemberName(memberId)}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Notes */}
                {plan.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">Notes:</span> {plan.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InsuranceManager;