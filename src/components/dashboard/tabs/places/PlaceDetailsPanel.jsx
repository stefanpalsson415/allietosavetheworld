import React, { useState, useEffect } from 'react';
import {
  X, Edit2, Trash2, Navigation, Clock, Phone, Globe, Users,
  Calendar, Car, MapPin, Tag, ExternalLink, Copy, CheckCircle,
  AlertCircle, Star, BarChart3, Home, School, Heart, ShoppingBag,
  Coffee, Briefcase
} from 'lucide-react';
import placesService from '../../../../services/PlacesService';

const PlaceDetailsPanel = ({ place, familyMembers, onClose, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(place);
  const [copied, setCopied] = useState(false);
  const [driveTime, setDriveTime] = useState(null);
  const [loadingDriveTime, setLoadingDriveTime] = useState(false);
  const [newTag, setNewTag] = useState('');
  
  // Update editData when place changes
  useEffect(() => {
    setEditData(place);
  }, [place]);

  // Category configuration
  const categories = [
    { value: 'HOME', label: 'Home', icon: Home },
    { value: 'SCHOOL', label: 'School', icon: School },
    { value: 'MEDICAL', label: 'Medical', icon: Heart },
    { value: 'ACTIVITIES', label: 'Activities', icon: Star },
    { value: 'FRIENDS_FAMILY', label: 'Friends & Family', icon: Users },
    { value: 'SHOPPING', label: 'Shopping', icon: ShoppingBag },
    { value: 'DINING', label: 'Dining', icon: Coffee },
    { value: 'WORK', label: 'Work', icon: Briefcase },
    { value: 'OTHER', label: 'Other', icon: MapPin }
  ];

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value.toLowerCase() === category?.toLowerCase());
    return cat?.icon || MapPin;
  };

  useEffect(() => {
    // Get drive time from user's current location
    if (navigator.geolocation && place.coordinates) {
      setLoadingDriveTime(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const from = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            const time = await placesService.calculateDriveTime(from, place.coordinates);
            setDriveTime(time);
          } catch (error) {
            console.error('Error calculating drive time:', error);
          } finally {
            setLoadingDriveTime(false);
          }
        },
        () => setLoadingDriveTime(false)
      );
    }
  }, [place]);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(place.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNavigate = () => {
    if (place.coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  const handleSaveEdit = async () => {
    await onEdit(editData);
    setIsEditing(false);
  };

  const getAssociatedMemberNames = () => {
    return place.associatedMembers
      ?.map(memberId => familyMembers.find(m => m.id === memberId)?.name)
      .filter(Boolean)
      .join(', ');
  };


  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-40 transform transition-transform">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: getCategoryIcon(place.category).color + '20' }}
          >
            <span className="text-2xl">{getCategoryIcon(place.category).icon}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="px-2 py-1 border border-gray-300 rounded"
                />
              ) : (
                place.name
              )}
            </h3>
            {isEditing ? (
              <select
                value={editData.category}
                onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                className="text-sm px-2 py-1 border border-gray-300 rounded"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-600">
                {categories.find(c => c.value.toLowerCase() === place.category?.toLowerCase())?.label || 'Other'}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 grid grid-cols-2 gap-2 border-b border-gray-200">
        <button
          onClick={handleNavigate}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Navigation className="w-4 h-4" />
          Navigate
        </button>
        <button
          onClick={() => {
            if (!isEditing) {
              setEditData(place); // Reset editData when starting to edit
              setNewTag(''); // Reset newTag
            } else {
              setNewTag(''); // Reset newTag when canceling
            }
            setIsEditing(!isEditing);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <Edit2 className="w-4 h-4" />
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {/* Address */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Address</h4>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.address}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="w-full px-3 py-1 border border-gray-300 rounded"
                />
              ) : (
                <p className="text-gray-900">{place.address}</p>
              )}
            </div>
            <button
              onClick={handleCopyAddress}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              title="Copy address"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Drive Time */}
        {driveTime && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">From Current Location</h4>
            <div className="flex items-center gap-3 text-gray-900">
              <Car className="w-4 h-4 text-gray-400" />
              <span>{driveTime.formattedTime}</span>
              <span className="text-gray-500">•</span>
              <span>{driveTime.distance.toFixed(1)} miles</span>
            </div>
          </div>
        )}

        {/* Contact Info */}
        {(place.phoneNumber || place.website) && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Contact</h4>
            <div className="space-y-2">
              {place.phoneNumber && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editData.phoneNumber}
                      onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded"
                    />
                  ) : (
                    <a
                      href={`tel:${place.phoneNumber}`}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      {place.phoneNumber}
                    </a>
                  )}
                </div>
              )}
              {place.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="url"
                      value={editData.website}
                      onChange={(e) => setEditData({ ...editData, website: e.target.value })}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded"
                    />
                  ) : (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      Visit Website
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Associated Members */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Associated Members</h4>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {familyMembers.map(member => {
                const isSelected = editData.associatedMembers?.includes(member.id);
                const initials = member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
                // Get avatar URL - check multiple possible fields
                const avatarUrl = member.avatarUrl || member.photoURL || member.avatar || member.picture || member.profilePicture;
                
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      const currentMembers = editData.associatedMembers || [];
                      if (isSelected) {
                        setEditData({
                          ...editData,
                          associatedMembers: currentMembers.filter(id => id !== member.id)
                        });
                      } else {
                        setEditData({
                          ...editData,
                          associatedMembers: [...currentMembers, member.id]
                        });
                      }
                    }}
                    className={`relative group transition-all ${isSelected ? 'scale-105' : ''}`}
                  >
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center text-xs
                      transition-all cursor-pointer
                      ${isSelected 
                        ? 'ring-2 ring-blue-500 ring-offset-1' 
                        : 'ring-1 ring-gray-200 hover:ring-gray-300'}
                      ${avatarUrl ? '' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}
                    `}>
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt={member.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-semibold">
                          {initials}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            place.associatedMembers?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {place.associatedMembers.map(memberId => {
                  const member = familyMembers.find(m => m.id === memberId);
                  if (!member) return null;
                  
                  const initials = member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
                  const avatarUrl = member.avatarUrl || member.photoURL || member.avatar || member.picture || member.profilePicture;
                  
                  return (
                    <div key={memberId} className="flex flex-col items-center gap-1">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center text-xs
                        ring-1 ring-gray-200
                        ${avatarUrl ? '' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}
                      `}>
                        {avatarUrl ? (
                          <img 
                            src={avatarUrl} 
                            alt={member.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold">
                            {initials}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600">{member.name?.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No members associated</p>
            )
          )}
        </div>

        {/* Visit Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Visit Information</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <label className="text-sm">Typical duration:</label>
                  <select
                    value={editData.typicalDuration || 30}
                    onChange={(e) => setEditData({ ...editData, typicalDuration: parseInt(e.target.value) })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                    <option value="180">3 hours</option>
                    <option value="240">4 hours</option>
                    <option value="480">8 hours</option>
                  </select>
                </div>
              ) : (
                <span className="text-gray-900">
                  Typical duration: {place.typicalDuration || 30} minutes
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <label className="text-sm">Visit frequency:</label>
                  <select
                    value={editData.visitFrequency || 'occasional'}
                    onChange={(e) => setEditData({ ...editData, visitFrequency: e.target.value })}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="occasional">Occasional</option>
                    <option value="rare">Rare</option>
                  </select>
                </div>
              ) : (
                <span className="text-gray-900">
                  Visit frequency: {place.visitFrequency || 'occasional'}
                </span>
              )}
            </div>
            {place.visitCount > 0 && (
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">
                  Visited {place.visitCount} time{place.visitCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
          {isEditing ? (
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                {(editData.tags || []).map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        setEditData({
                          ...editData,
                          tags: editData.tags.filter(t => t !== tag)
                        });
                      }}
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
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newTag && !(editData.tags || []).includes(newTag)) {
                        setEditData({
                          ...editData,
                          tags: [...(editData.tags || []), newTag]
                        });
                        setNewTag('');
                      }
                    }
                  }}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTag && !(editData.tags || []).includes(newTag)) {
                      setEditData({
                        ...editData,
                        tags: [...(editData.tags || []), newTag]
                      });
                      setNewTag('');
                    }
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  +
                </button>
              </div>
            </div>
          ) : (
            place.tags?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {place.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No tags added</p>
            )
          )}
        </div>

        {/* Notes */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
          {isEditing ? (
            <textarea
              value={editData.notes || ''}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              placeholder="Any special instructions, parking info, etc..."
              className="w-full px-3 py-2 border border-gray-300 rounded"
              rows={3}
            />
          ) : (
            place.notes ? (
              <p className="text-gray-900 whitespace-pre-wrap">{place.notes}</p>
            ) : (
              <p className="text-sm text-gray-500">No notes added</p>
            )
          )}
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Added {new Date(place.createdAt?.seconds * 1000).toLocaleDateString()}</div>
            {place.lastVisited && (
              <div>Last visited {new Date(place.lastVisited?.seconds * 1000).toLocaleDateString()}</div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
        {isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditData(place); // Reset editData when canceling
                setNewTag(''); // Reset newTag
                setIsEditing(false);
              }}
              className="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        ) : (
          <button
            onClick={onDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Place
          </button>
        )}
      </div>
    </div>
  );
};

export default PlaceDetailsPanel;