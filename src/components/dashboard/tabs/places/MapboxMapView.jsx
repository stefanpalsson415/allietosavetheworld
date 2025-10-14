import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Navigation2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import placesService from '../../../../services/PlacesService';

// Set the Mapbox access token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoic3BhbHNzb24iLCJhIjoiY21hN3lmMHE3MTF4eTJsc2dodXlhY3V6ZSJ9.LM8VtdOBYFVzGG0nfFjc2A';

const MapboxMapView = ({ places, selectedPlace, onPlaceClick, center }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const defaultCenter = center || { lat: 37.7749, lng: -122.4194 }; // Default to SF
      
      // Create map instance
      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [defaultCenter.lng, defaultCenter.lat],
        zoom: 12
      });

      mapInstanceRef.current = map;

      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add geolocate control
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      
      map.addControl(geolocate);

      // Get user location
      map.on('load', () => {
        setMapLoaded(true);
        
        // Trigger geolocation
        geolocate.on('geolocate', (e) => {
          setUserLocation({
            lat: e.coords.latitude,
            lng: e.coords.longitude
          });
        });
      });
    } catch (error) {
      console.error('Error initializing map:', error);
      setMapLoaded(false);
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when places change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each place
    places.forEach(place => {
      if (place.coordinates) {
        const category = placesService.CATEGORIES[place.category] || placesService.CATEGORIES.OTHER;
        
        // Create custom marker element
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.backgroundColor = category.color;
        el.style.width = '32px';
        el.style.height = '32px';
        el.style.borderRadius = '50%';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.border = '2px solid white';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.cursor = 'pointer';
        el.innerHTML = `<span style="font-size: 16px;">${category.icon}</span>`;

        // Create marker
        const marker = new mapboxgl.Marker(el)
          .setLngLat([place.coordinates.lng, place.coordinates.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div style="padding: 8px;">
                  <h4 style="margin: 0 0 4px 0; font-weight: 600;">${place.name}</h4>
                  <p style="margin: 0; font-size: 14px; color: #666;">${place.address}</p>
                  ${place.phoneNumber ? `<p style="margin: 4px 0 0 0; font-size: 14px;">📞 ${place.phoneNumber}</p>` : ''}
                </div>
              `)
          )
          .addTo(mapInstanceRef.current);

        // Handle click events
        el.addEventListener('click', () => {
          if (onPlaceClick) {
            onPlaceClick(place);
          }
        });

        markersRef.current.push(marker);
      }
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      places.forEach(place => {
        if (place.coordinates) {
          bounds.extend([place.coordinates.lng, place.coordinates.lat]);
        }
      });
      mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
    }
  }, [places, mapLoaded, onPlaceClick]);

  // Center on selected place
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedPlace?.coordinates) return;

    mapInstanceRef.current.flyTo({
      center: [selectedPlace.coordinates.lng, selectedPlace.coordinates.lat],
      zoom: 15
    });

    // Open popup for selected marker
    const selectedMarker = markersRef.current.find((marker, index) => 
      places[index]?.id === selectedPlace.id
    );
    if (selectedMarker) {
      selectedMarker.togglePopup();
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
      mapInstanceRef.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 14
      });
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

export default MapboxMapView;