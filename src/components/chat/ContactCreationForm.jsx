// ContactCreationForm.jsx - Interactive contact creation form for Allie chat
import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, Building, Heart, GraduationCap, Users, Briefcase, FileText, X } from 'lucide-react';
import { useFamily } from '../../contexts/FamilyContext';
import usePlaceSearch from '../../hooks/usePlaceSearch';

const ContactCreationForm = ({ onSubmit, onCancel, initialData = {}, isEdit = false }) => {
  const { familyMembers } = useFamily();
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    businessName: initialData.businessName || '',
    type: initialData.type || 'medical',
    specialty: initialData.specialty || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    address: initialData.address || '',
    notes: initialData.notes || '',
    assignedChildren: initialData.assignedChildren || [],
    ...initialData
  });
  
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const { 
    searchResults, 
    isSearching, 
    searchLocation,
    selectedPlace,
    setSelectedPlace,
    getAddressComponents 
  } = usePlaceSearch();
  
  const contactTypes = [
    { id: 'medical', label: 'Medical Provider', icon: Heart, examples: 'Doctor, Dentist, Therapist' },
    { id: 'education', label: 'Education', icon: GraduationCap, examples: 'Teacher, Tutor, School Staff' },
    { id: 'childcare', label: 'Childcare', icon: Users, examples: 'Babysitter, Nanny, Daycare' },
    { id: 'service', label: 'Service Provider', icon: Briefcase, examples: 'Plumber, Electrician, Contractor' }
  ];
  
  const getContactTypeIcon = () => {
    const type = contactTypes.find(t => t.id === formData.type);
    return type?.icon || User;
  };
  
  const handleSubmit = () => {
    if (!formData.name || !formData.type) {
      return;
    }
    
    onSubmit({
      ...formData,
      address: selectedPlace ? getAddressComponents(selectedPlace) : formData.address
    });
  };
  
  const handleLocationSelect = (place) => {
    setSelectedPlace(place);
    setFormData({ ...formData, address: place.address });
    setShowLocationSearch(false);
  };
  
  const Icon = getContactTypeIcon();
  
  return (
    <div className="bg-white rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Icon className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold">{isEdit ? 'Edit Contact' : 'Add New Contact'}</h3>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Contact Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What type of contact is this?
        </label>
        <div className="grid grid-cols-2 gap-3">
          {contactTypes.map(type => {
            const TypeIcon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setFormData({ ...formData, type: type.id })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.type === type.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <TypeIcon className={`w-6 h-6 mb-2 mx-auto ${
                  formData.type === type.id ? 'text-indigo-600' : 'text-gray-400'
                }`} />
                <div className="text-sm font-medium">{type.label}</div>
                <div className="text-xs text-gray-500 mt-1">{type.examples}</div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Contact Details */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Dr. Sarah Johnson"
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        {(formData.type === 'medical' || formData.type === 'service') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business/Practice Name
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="Pediatric Associates"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specialty/Role
          </label>
          <input
            type="text"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            placeholder={
              formData.type === 'medical' ? 'Pediatrician' :
              formData.type === 'education' ? '3rd Grade Teacher' :
              formData.type === 'childcare' ? 'Evening Babysitter' :
              'Plumber'
            }
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@example.com"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
        
        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={formData.address}
              onChange={(e) => {
                setFormData({ ...formData, address: e.target.value });
                searchLocation(e.target.value);
              }}
              onFocus={() => setShowLocationSearch(true)}
              placeholder="123 Medical Plaza, Suite 100"
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {showLocationSearch && searchResults.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleLocationSelect(result)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b last:border-b-0"
                >
                  <div className="font-medium">{result.name}</div>
                  <div className="text-sm text-gray-500">{result.address}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Assigned Children */}
        {familyMembers.filter(m => m.role === 'child').length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned to Children
            </label>
            <div className="space-y-2">
              {familyMembers.filter(m => m.role === 'child').map(child => (
                <label key={child.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assignedChildren?.includes(child.id)}
                    onChange={(e) => {
                      const children = formData.assignedChildren || [];
                      if (e.target.checked) {
                        setFormData({ ...formData, assignedChildren: [...children, child.id] });
                      } else {
                        setFormData({ ...formData, assignedChildren: children.filter(id => id !== child.id) });
                      }
                    }}
                    className="mr-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm">{child.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Office hours, insurance accepted, special instructions..."
              rows={3}
              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.name || !formData.type}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEdit ? 'Save Changes' : 'Add Contact'}
        </button>
      </div>
    </div>
  );
};

export default ContactCreationForm;