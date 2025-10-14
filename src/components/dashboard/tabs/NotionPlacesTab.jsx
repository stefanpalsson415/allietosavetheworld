import React, { useState, useEffect } from 'react';
import {
  MapPin, Plus, Search, Navigation, Clock, Phone, Globe,
  Edit2, Trash2, Users, Calendar, Car, Home, School,
  Heart, ShoppingBag, Coffee, Briefcase, Star, Filter,
  ChevronRight, X, Check, AlertCircle, Map
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useFamily } from '../../../contexts/FamilyContext';
import placesService from '../../../services/PlacesService';
import GoogleMapView from '../../common/GoogleMapView';
import AddPlaceModal from './places/AddPlaceModal';
import PlaceDetailsPanel from './places/PlaceDetailsPanel';
import ConfirmationModal from '../../common/ConfirmationModal';

const NotionPlacesTab = () => {
  const { currentUser: user, familyData } = useAuth();
  const { familyMembers } = useFamily();
  const [places, setPlaces] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(12);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState(null);

  const categories = [
    { id: 'ALL', name: 'All Places', icon: MapPin, isComponent: true, count: 0 },
    ...Object.values(placesService.CATEGORIES).map(cat => ({
      ...cat,
      isComponent: false,
      count: 0
    }))
  ];

  useEffect(() => {
    if (familyData?.familyId) {
      loadPlaces();
    }
  }, [familyData]);

  useEffect(() => {
    filterPlaces();
  }, [places, selectedCategory, searchQuery]);

  const loadPlaces = async () => {
    try {
      setLoading(true);
      const familyPlaces = await placesService.getFamilyPlaces(familyData.familyId);
      setPlaces(familyPlaces);
      
      // Set initial map center to first place or default
      if (familyPlaces.length > 0 && familyPlaces[0].coordinates) {
        setMapCenter(familyPlaces[0].coordinates);
      }
    } catch (error) {
      console.error('Error loading places:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPlaces = () => {
    let filtered = [...places];

    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(place => place.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(place => {
        // Search in name
        if (place.name && place.name.toLowerCase().includes(query)) return true;
        // Search in address
        if (place.address && place.address.toLowerCase().includes(query)) return true;
        // Search in category label - check both the ID and the display name
        if (place.category) {
          const categoryObj = placesService.CATEGORIES[place.category];
          if (categoryObj && categoryObj.name.toLowerCase().includes(query)) return true;
          if (place.category.toLowerCase().includes(query)) return true;
        }
        // Search in notes
        if (place.notes && place.notes.toLowerCase().includes(query)) return true;
        // Search in tags
        if (place.tags && Array.isArray(place.tags)) {
          if (place.tags.some(tag => tag.toLowerCase().includes(query))) return true;
        }
        // Search in phone number
        if (place.phoneNumber && place.phoneNumber.includes(query)) return true;
        // Search in website
        if (place.website && place.website.toLowerCase().includes(query)) return true;
        
        return false;
      });
    }

    setFilteredPlaces(filtered);

    // Adjust map view based on filtered places
    if (filtered.length === 1) {
      // Single place - zoom in close
      const place = filtered[0];
      if (place.coordinates) {
        setMapCenter({ 
          lat: place.coordinates.lat || place.latitude, 
          lng: place.coordinates.lng || place.longitude 
        });
        setMapZoom(16); // Zoom in close for single place
      }
    } else if (filtered.length > 1) {
      // Multiple places - let the map auto-fit bounds
      // The GoogleMapView component will handle this automatically
      setMapZoom(12); // Reset to default zoom
    }
  };

  const handleAddPlace = async (placeData) => {
    try {
      await placesService.savePlace(familyData.familyId, {
        ...placeData,
        createdBy: user?.uid || 'unknown'
      });
      await loadPlaces();
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding place:', error);
    }
  };

  const handleDeletePlace = (placeId) => {
    setPlaceToDelete(placeId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (placeToDelete) {
      try {
        await placesService.deletePlace(placeToDelete);
        await loadPlaces();
        setSelectedPlace(null);
        setShowDetailsPanel(false);
        setPlaceToDelete(null);
      } catch (error) {
        console.error('Error deleting place:', error);
      }
    }
  };

  const handlePlaceClick = (place) => {
    setSelectedPlace(place);
    setShowDetailsPanel(true);
    if (place.coordinates) {
      setMapCenter(place.coordinates);
    }
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

  // Update category counts
  const categoriesWithCounts = categories.map(cat => ({
    ...cat,
    count: cat.id === 'ALL' ? places.length : places.filter(p => p.category === cat.id).length,
    isComponent: cat.isComponent || false
  }));

  return (
    <div className="flex h-full bg-gray-50" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Left Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Family Places</h2>
          <p className="text-sm text-gray-600">
            Save time by storing your family's important locations. Get directions, 
            see drive times, and never forget an address again.
          </p>
        </div>

        {/* Search and Add */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search places..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Place
          </button>
        </div>

        {/* Categories */}
        <div className="px-4 pb-3">
          <div className="space-y-1">
            {categoriesWithCounts.map(category => {
              const Icon = category.icon || getCategoryIcon(category.id);
              const isSelected = selectedCategory === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${
                      isSelected ? 'bg-indigo-100' : 'bg-gray-100'
                    }`}>
                      {category.isComponent ? (
                        <Icon className="w-4 h-4" />
                      ) : (
                        <span className="text-sm">{category.icon}</span>
                      )}
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <span className={`text-sm ${
                    isSelected ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {category.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Places List */}
        <div className="flex-1 overflow-y-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredPlaces.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchQuery || selectedCategory !== 'ALL' 
                  ? 'No places found matching your criteria'
                  : 'No places added yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-4">
              {filteredPlaces.map(place => {
                const Icon = getCategoryIcon(place.category);
                const isSelected = selectedPlace?.id === place.id;
                
                return (
                  <div
                    key={place.id}
                    onClick={() => handlePlaceClick(place)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'bg-white border border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-indigo-100' : 'bg-gray-100'
                      }`}>
                        <Icon className="w-4 h-4 text-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {place.name}
                        </h4>
                        <p className="text-sm text-gray-600 truncate">
                          {place.address}
                        </p>
                        {place.associatedMembers?.length > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {place.associatedMembers.length} member{place.associatedMembers.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${
                        isSelected ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{places.length}</div>
              <div className="text-xs text-gray-600">Total Places</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {places.filter(p => p.visitCount > 5).length}
              </div>
              <div className="text-xs text-gray-600">Frequent Visits</div>
            </div>
          </div>
        </div>
      </div>

      {/* Map View */}
      <div className="flex-1 relative">
        <GoogleMapView
          markers={filteredPlaces.map(place => ({
            id: place.id,
            lat: place.coordinates?.lat || place.latitude,
            lng: place.coordinates?.lng || place.longitude,
            title: place.name,
            description: place.address,
            color: placesService.CATEGORIES[place.category]?.color || '#6B7280',
            category: place.category,
            showLabel: true // Show labels for all markers
          }))}
          center={mapCenter || { lat: 40.7128, lng: -74.0060 }}
          zoom={mapZoom}
          height="100%"
          onMarkerClick={(marker) => {
            const place = filteredPlaces.find(p => p.id === marker.id);
            if (place) handlePlaceClick(place);
          }}
          showUserLocation={true}
        />
        
        {/* Floating Legend */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Categories</h4>
          <div className="space-y-1">
            {Object.values(placesService.CATEGORIES).map(cat => (
              <div key={cat.id} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-gray-600">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddPlaceModal
          familyMembers={familyMembers || []}
          onSave={handleAddPlace}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {showDetailsPanel && selectedPlace && (
        <PlaceDetailsPanel
          place={selectedPlace}
          familyMembers={familyMembers || []}
          onClose={() => setShowDetailsPanel(false)}
          onEdit={async (updates) => {
            try {
              await placesService.updatePlace(selectedPlace.id, updates);
              await loadPlaces();
              // Update the selectedPlace with the new data
              const updatedPlaces = await placesService.getFamilyPlaces(familyData.familyId);
              const updatedPlace = updatedPlaces.find(p => p.id === selectedPlace.id);
              if (updatedPlace) {
                setSelectedPlace(updatedPlace);
              }
            } catch (error) {
              console.error('Error updating place:', error);
            }
          }}
          onDelete={() => handleDeletePlace(selectedPlace.id)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setPlaceToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Place"
        message="Are you sure you want to delete this place? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default NotionPlacesTab;