import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import placesService from '../../../../services/PlacesService';

const PlaceMapView = ({ places, selectedPlace, onPlaceClick, center }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Load MapQuest SDK
  useEffect(() => {
    if (window.L && window.L.mapquest) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.js';
    script.async = true;
    script.onload = () => {
      try {
        const link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = 'https://api.mqcdn.com/sdk/mapquest-js/v1.3.2/mapquest.css';
        document.head.appendChild(link);
        
        if (window.L && window.L.mapquest) {
          window.L.mapquest.key = 'GOnHG5D8A9ZNBn43AdnIphoWKXAEUb7Y';
          setMapLoaded(true);
        } else {
          console.error('MapQuest library failed to load properly');
        }
      } catch (error) {
        console.error('Error initializing MapQuest:', error);
      }
    };
    script.onerror = (error) => {
      console.error('Failed to load MapQuest script:', error);
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    try {
      const defaultCenter = center || { lat: 37.7749, lng: -122.4194 }; // Default to SF
      
      // Create map instance
      const map = window.L.mapquest.map(mapRef.current, {
        center: [defaultCenter.lat, defaultCenter.lng],
        layers: window.L.mapquest.tileLayer('map'),
        zoom: 12
      });

      mapInstanceRef.current = map;

      // Add controls
      map.addControl(window.L.mapquest.control());

      // Get user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userLoc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(userLoc);
            
            // Add user location marker
            const userMarker = window.L.marker([userLoc.lat, userLoc.lng], {
              icon: window.L.mapquest.icons.marker({
                primaryColor: '#4F46E5',
                secondaryColor: '#4F46E5',
                symbol: 'U' // Changed from ⚫ to U for "User"
              })
            });
            userMarker.bindPopup('Your Location');
            userMarker.addTo(map);
          },
          (error) => console.log('Error getting location:', error)
        );
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapLoaded(false);
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.error('Error removing map:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [mapLoaded]);

  // Update markers when places change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];

    // Add markers for each place
    places.forEach(place => {
      if (place.coordinates) {
        const category = placesService.CATEGORIES[place.category] || placesService.CATEGORIES.OTHER;
        
        // Map emoji to valid MapQuest symbols
        const symbolMap = {
          '🏠': 'H',  // Home
          '🏫': 'S',  // School
          '🏥': 'M',  // Medical
          '⚽': 'A',  // Activities
          '👥': 'F',  // Friends
          '🛒': 'G',  // Shopping (Groceries)
          '🍽️': 'D',  // Dining
          '💼': 'W',  // Work
          '📍': 'P'   // Pin/Other
        };
        
        const marker = window.L.marker([place.coordinates.lat, place.coordinates.lng], {
          icon: window.L.mapquest.icons.marker({
            primaryColor: category.color,
            secondaryColor: '#FFFFFF',
            symbol: symbolMap[category.icon] || 'P'
          })
        });

        // Create popup content
        const popupContent = `
          <div class="p-2">
            <h4 class="font-semibold text-gray-900">${place.name}</h4>
            <p class="text-sm text-gray-600 mt-1">${place.address}</p>
            ${place.phoneNumber ? `<p class="text-sm text-gray-600 mt-1">📞 ${place.phoneNumber}</p>` : ''}
            ${place.notes ? `<p class="text-sm text-gray-500 mt-1">${place.notes}</p>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent);
        
        // Handle click events
        marker.on('click', () => {
          if (onPlaceClick) {
            onPlaceClick(place);
          }
        });

        marker.addTo(mapInstanceRef.current);
        markersRef.current.push(marker);
      }
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const group = new window.L.featureGroup(markersRef.current);
      mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [places, mapLoaded, onPlaceClick]);

  // Center on selected place
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPlace?.coordinates) return;

    mapInstanceRef.current.setView(
      [selectedPlace.coordinates.lat, selectedPlace.coordinates.lng],
      15
    );

    // Open popup for selected marker
    const selectedMarker = markersRef.current.find((marker, index) => 
      places[index]?.id === selectedPlace.id
    );
    if (selectedMarker) {
      selectedMarker.openPopup();
    }
  }, [selectedPlace, places]);

  // Custom controls
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleCenterOnUser = () => {
    if (mapInstanceRef.current && userLocation) {
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 14);
    }
  };

  const handleFullscreen = () => {
    if (mapRef.current.requestFullscreen) {
      mapRef.current.requestFullscreen();
    }
  };

  return (
    <div className="relative h-full w-full bg-gray-100">
      <div ref={mapRef} className="h-full w-full" />
      
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5 text-gray-700" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5 text-gray-700" />
        </button>
        {userLocation && (
          <button
            onClick={handleCenterOnUser}
            className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            title="Center on My Location"
          >
            <Navigation2 className="w-5 h-5 text-indigo-600" />
          </button>
        )}
        <button
          onClick={handleFullscreen}
          className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          title="Fullscreen"
        >
          <Maximize2 className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Places Counter */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {places.length} place{places.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlaceMapView;