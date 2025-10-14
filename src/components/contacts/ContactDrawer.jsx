import React, { useEffect, useRef, useState } from 'react';
import { X, Phone, Mail, MapPin, Building, Heart, GraduationCap, Users, Briefcase, User, Save, Edit2, Calendar, MessageSquare, FileText } from 'lucide-react';
import { doc, updateDoc, serverTimestamp, addDoc, collection, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useFamily } from '../../contexts/FamilyContext';
import UserAvatar from '../common/UserAvatar';
import GooglePlacesSimple from '../common/GooglePlacesSimple';

const DRAWER_WIDTH = '480px';

const ContactDrawer = ({ isOpen, onClose, contact, onUpdate }) => {
  const drawerRef = useRef(null);
  const { familyMembers = [], familyId, selectedUser } = useFamily();
  const [isEditing, setIsEditing] = useState(true); // Always in edit mode like Notion
  const [editedContact, setEditedContact] = useState(contact || {});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const contactTypes = [
    { id: 'medical', label: 'Medical', icon: Heart, color: 'red' },
    { id: 'education', label: 'Education', icon: GraduationCap, color: 'blue' },
    { id: 'childcare', label: 'Childcare', icon: Users, color: 'green' },
    { id: 'service', label: 'Service', icon: Briefcase, color: 'purple' },
    { id: 'family', label: 'Family Friend', icon: Users, color: 'indigo' },
    { id: 'other', label: 'Other', icon: User, color: 'gray' }
  ];

  // Update editedContact when contact prop changes
  useEffect(() => {
    if (contact) {
      setEditedContact(contact);
      setIsEditing(true);
    }
  }, [contact]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && isOpen) {
        e.preventDefault();
        handleSave();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, editedContact]);

  // Auto-save when editedContact changes (with debounce)
  useEffect(() => {
    // Don't auto-save for new contacts - wait for explicit save
    if (!contact?.id || contact?.isNew) {
      return;
    }
    
    // Don't auto-save if drawer is closed or if contact has no name
    if (!isOpen || !editedContact.name || !editedContact.name.trim()) {
      return;
    }

    // Debounce the save
    const timeoutId = setTimeout(() => {
      handleSave();
    }, 2000); // Save after 2 seconds of no changes

    return () => clearTimeout(timeoutId);
  }, [editedContact, isOpen]);
  
  // Save function - handles both create and update
  const handleSave = async () => {
    // Don't save if name is empty
    if (!editedContact.name || !editedContact.name.trim()) {
      console.log('Cannot save contact without name');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const contactData = {
        ...editedContact,
        name: editedContact.name.trim(),
        type: editedContact.type || 'other',
        phone: editedContact.phone || '',
        email: editedContact.email || '',
        address: editedContact.address || '',
        businessName: editedContact.businessName || '',
        specialty: editedContact.specialty || '',
        notes: editedContact.notes || '',
        assignedChildren: editedContact.assignedChildren || [],
        updatedAt: serverTimestamp(),
        familyId: familyId
      };

      if (contact?.isNew || !contact?.id) {
        // Create new contact
        delete contactData.id;
        delete contactData.isNew;
        
        const docRef = await addDoc(collection(db, 'familyContacts'), contactData);
        console.log('✅ Created new contact:', docRef.id);
        
        // Update the editedContact with the new ID
        const newContact = { ...contactData, id: docRef.id };
        setEditedContact(newContact);
        
        // Call onUpdate with the new contact
        if (onUpdate) {
          onUpdate(newContact);
        }
        
        // Show success and close for new contacts
        setSaveSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        // Update existing contact
        const contactRef = doc(db, 'familyContacts', contact.id);
        await updateDoc(contactRef, contactData);
        console.log('✅ Updated contact:', contact.id);
        
        // Call onUpdate with the updated contact
        if (onUpdate) {
          onUpdate({ ...contactData, id: contact.id });
        }
        
        // Show success briefly
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
      
      // Dispatch event for other components to refresh
      window.dispatchEvent(new CustomEvent('contact-updated', { 
        detail: { contactId: contact?.id || 'new' } 
      }));
      
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle address selection from Google Places
  const handleAddressSelect = (place) => {
    if (place && place.formatted_address) {
      setEditedContact({
        ...editedContact,
        address: place.formatted_address,
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng()
      });
    }
  };

  // Toggle child assignment
  const toggleChildAssignment = (childId) => {
    const currentAssigned = editedContact.assignedChildren || [];
    const newAssigned = currentAssigned.includes(childId)
      ? currentAssigned.filter(id => id !== childId)
      : [...currentAssigned, childId];
    
    setEditedContact({
      ...editedContact,
      assignedChildren: newAssigned
    });
  };

  if (!isOpen) return null;

  const currentType = contactTypes.find(t => t.id === (editedContact.type || 'other'));
  const TypeIcon = currentType?.icon || User;

  return (
    <>
      {/* Remove backdrop - no darkening behind drawer */}
      {/* <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      /> */}
      
      {/* Drawer - higher z-index to ensure it's on top */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full bg-white shadow-2xl z-[100] flex flex-col"
        style={{ width: DRAWER_WIDTH }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className={`p-2 bg-${currentType?.color || 'gray'}-100 rounded-lg`}>
              <TypeIcon className={`w-5 h-5 text-${currentType?.color || 'gray'}-600`} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {contact?.isNew ? 'New Contact' : 'Contact Details'}
              </h2>
              {saveSuccess && (
                <span className="text-sm text-green-600">Saved ✓</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={editedContact.name || ''}
              onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
              placeholder="Enter contact name"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Contact Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {contactTypes.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setEditedContact({ ...editedContact, type: type.id })}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      editedContact.type === type.id
                        ? `border-${type.color}-600 bg-${type.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mx-auto mb-1 ${
                      editedContact.type === type.id ? `text-${type.color}-600` : 'text-gray-400'
                    }`} />
                    <div className="text-xs">{type.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Business Name (for medical/service providers) */}
          {(editedContact.type === 'medical' || editedContact.type === 'service') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business/Practice Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={editedContact.businessName || ''}
                  onChange={(e) => setEditedContact({ ...editedContact, businessName: e.target.value })}
                  placeholder="e.g., Pediatric Associates"
                  className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Specialty/Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialty/Role
            </label>
            <input
              type="text"
              value={editedContact.specialty || ''}
              onChange={(e) => setEditedContact({ ...editedContact, specialty: e.target.value })}
              placeholder="e.g., Pediatrician, Math Tutor, Tennis Coach"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={editedContact.phone || ''}
                onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={editedContact.email || ''}
                onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                placeholder="contact@example.com"
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Address with Google Places */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <GooglePlacesSimple
              value={editedContact.address || ''}
              onChange={(value) => setEditedContact({ ...editedContact, address: value })}
              onSelect={handleAddressSelect}
              placeholder="Start typing to search for address..."
              className="w-full"
            />
          </div>

          {/* Assigned to Children */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned to Children
            </label>
            <div className="space-y-2">
              {familyMembers
                .filter(member => member.role === 'child')
                .map(child => (
                  <label
                    key={child.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(editedContact.assignedChildren || []).includes(child.id)}
                      onChange={() => toggleChildAssignment(child.id)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <UserAvatar user={child} size={24} />
                    <span className="text-sm">{child.name}</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={editedContact.notes || ''}
              onChange={(e) => setEditedContact({ ...editedContact, notes: e.target.value })}
              placeholder="Add any additional notes..."
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Footer with Save Button for new contacts */}
        {(contact?.isNew || !contact?.id) && (
          <div className="border-t p-4">
            <button
              onClick={handleSave}
              disabled={!editedContact.name?.trim() || isSaving}
              className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Contact
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ContactDrawer;