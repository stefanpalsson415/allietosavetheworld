import React, { useState, useEffect } from 'react';
import {
  X, MapPin, Search, Plus, Users, Clock, Phone, Globe,
  Tag, Home, School, Heart, ShoppingBag, Coffee, Briefcase,
  Calendar, AlertCircle, ChevronDown
} from 'lucide-react';
import placesService from '../../../../services/PlacesService';
import GooglePlacesInput from '../../../common/GooglePlacesSimple';

const AddPlaceModal = ({ familyMembers = [], onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    category: 'OTHER',
    associatedMembers: [],
    phoneNumber: '',
    website: '',
    notes: '',
    typicalDuration: 30,
    visitFrequency: 'occasional',
    tags: []
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState({});

  const visitFrequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'occasional', label: 'Occasional' }
  ];

  const typicalDurations = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 180, label: '3+ hours' }
  ];

  // Search for addresses using Mapbox
  const searchAddress = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      console.log('AddPlaceModal - Searching for:', query);
      const results = await placesService.searchPlaces(query);
      console.log('AddPlaceModal - Search results:', results);
      
      if (results && results.length > 0) {
        setSearchResults(results.slice(0, 5));
      } else {
        // Fallback - just use the entered text as the address
        setSearchResults([{
          displayString: query,
          name: query,
          latLng: null // Will try to geocode later
        }]);
      }
    } catch (error) {
      console.error('Error searching addresses:', error);
      // Fallback - just use the entered text as the address
      setSearchResults([{
        displayString: query,
        name: query,
        latLng: null // Will try to geocode later
      }]);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddress(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectAddress = (result) => {
    setFormData({
      ...formData,
      address: result.displayString || result.name,
      coordinates: result.latLng
    });
    setSearchQuery('');
    setSearchResults([]);
  };


  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Place name is required';
    if (!formData.address) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    await onSave(formData);
  };

  const getCategoryIcon = (categoryId) => {
    const icons = {
      HOME: Home,
      SCHOOL: School,
      MEDICAL: Heart,
      SHOPPING: ShoppingBag,
      DINING: Coffee,
      WORK: Briefcase,
      ACTIVITIES: Calendar,
      FRIENDS: Users,
      OTHER: MapPin
    };
    return icons[categoryId] || MapPin;
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Add New Place</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Place Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Place Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Lincoln Elementary School"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Address Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <GooglePlacesInput
                value={formData.address}
                onChange={(value) => setFormData({ ...formData, address: value })}
                onSelect={(place) => {
                  // Handle null when clearing
                  if (!place) {
                    setFormData({
                      ...formData,
                      address: '',
                      coordinates: null
                    });
                    setSearchResults([]);
                    return;
                  }
                  
                  // Auto-fill place name if empty
                  const newFormData = {
                    ...formData,
                    address: place.fullAddress || place.address || '',
                    coordinates: {
                      lat: place.lat || place.coordinates?.lat,
                      lng: place.lng || place.coordinates?.lng
                    }
                  };
                  
                  // If place name is empty, use the place name from Google
                  if (!formData.name && place.name) {
                    newFormData.name = place.name;
                  }
                  
                  setFormData(newFormData);
                  setSearchResults([]);
                }}
                placeholder="Search for an address..."
                className={errors.address ? 'error' : ''}
                required={true}
                types={['establishment', 'geocode']}
              />
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg shadow-sm">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSelectAddress(result)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-900">
                        {result.name || result.displayString}
                      </div>
                      {result.display_name && (
                        <div className="text-sm text-gray-600">{result.display_name}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              
              {/* Manual entry option */}
              {searchQuery.length > 0 && !formData.address && (
                <div className="mt-2 text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, address: searchQuery });
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    Use "{searchQuery}" as address
                  </button>
                </div>
              )}
              
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(placesService.CATEGORIES).map(category => {
                  const Icon = getCategoryIcon(category.id);
                  const isSelected = formData.category === category.id;
                  
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: category.id })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Associated Members */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Associated Family Members
              </label>
              <div className="flex flex-wrap gap-3">
                {familyMembers && familyMembers.length > 0 ? (
                  familyMembers.map(member => {
                    const isSelected = formData.associatedMembers.includes(member.id);
                    const initials = member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
                    // Get avatar URL - check multiple possible fields
                    const avatarUrl = member.avatarUrl || member.photoURL || member.avatar || member.picture || member.profilePicture;
                    
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setFormData({
                              ...formData,
                              associatedMembers: formData.associatedMembers.filter(id => id !== member.id)
                            });
                          } else {
                            setFormData({
                              ...formData,
                              associatedMembers: [...formData.associatedMembers, member.id]
                            });
                          }
                        }}
                        className={`relative group transition-all ${isSelected ? 'scale-110' : ''}`}
                      >
                        {/* Avatar Circle */}
                        <div className={`
                          w-14 h-14 rounded-full flex items-center justify-center
                          transition-all cursor-pointer
                          ${isSelected 
                            ? 'ring-4 ring-blue-500 ring-offset-2' 
                            : 'ring-2 ring-gray-200 hover:ring-gray-300'}
                          ${avatarUrl ? '' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}
                        `}>
                          {avatarUrl ? (
                            <img 
                              src={avatarUrl} 
                              alt={member.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-semibold text-sm">
                              {initials}
                            </span>
                          )}
                        </div>
                        
                        {/* Checkmark for selected state */}
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Name tooltip */}
                        <div className="mt-1 text-xs text-center text-gray-600 max-w-[60px] truncate">
                          {member.name || 'Unknown'}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">No family members available</p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Visit Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visit Frequency
                </label>
                <select
                  value={formData.visitFrequency}
                  onChange={(e) => setFormData({ ...formData, visitFrequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {visitFrequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typical Duration
                </label>
                <select
                  value={formData.typicalDuration}
                  onChange={(e) => setFormData({ ...formData, typicalDuration: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {typicalDurations.map(duration => (
                    <option key={duration.value} value={duration.value}>
                      {duration.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-gray-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                placeholder="Any special instructions, parking info, etc..."
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Add Place
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPlaceModal;