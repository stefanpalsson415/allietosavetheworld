import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Plus, Navigation } from 'lucide-react';
import logger from '../../utils/logger';

const GoogleMapView = ({
  center = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
  zoom = 11,
  markers = [],
  onMapClick,
  onMarkerClick,
  showUserLocation = true,
  height = '400px',
  className = '',
  style = {},
  searchBox = false,
  onPlaceSelected
}) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const searchBoxRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Load Google Maps
  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      // Check if script is already loading
      if (window.googleMapsLoading) {
        window.googleMapsCallbacks = window.googleMapsCallbacks || [];
        window.googleMapsCallbacks.push(() => setMapLoaded(true));
        return;
      }

      window.googleMapsLoading = true;
      window.googleMapsCallbacks = [];

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_API_KEY}&libraries=places,marker&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;
      
      window.initGoogleMaps = () => {
        setMapLoaded(true);
        window.googleMapsLoading = false;
        
        // Call all waiting callbacks
        if (window.googleMapsCallbacks) {
          window.googleMapsCallbacks.forEach(cb => cb());
          window.googleMapsCallbacks = [];
        }
      };

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    // Create map instance
    const map = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    googleMapRef.current = map;

    // Add click listener
    if (onMapClick) {
      map.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        onMapClick({ lat, lng, event: e });
      });
    }

    // Add search box if requested
    if (searchBox && !searchBoxRef.current) {
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Search for places';
      input.className = 'google-map-search-box';
      input.style.cssText = `
        box-sizing: border-box;
        border: 1px solid transparent;
        width: 300px;
        height: 40px;
        padding: 0 12px;
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        font-size: 14px;
        outline: none;
        text-overflow: ellipses;
        position: absolute;
        top: 10px;
        left: 50%;
        transform: translateX(-50%);
        background-color: white;
        z-index: 1;
      `;

      mapRef.current.parentElement.style.position = 'relative';
      mapRef.current.parentElement.appendChild(input);

      const searchBoxInstance = new window.google.maps.places.SearchBox(input);
      map.controls[window.google.maps.ControlPosition.TOP_CENTER].push(input);

      // Bias search box to map bounds
      map.addListener('bounds_changed', () => {
        searchBoxInstance.setBounds(map.getBounds());
      });

      searchBoxInstance.addListener('places_changed', () => {
        const places = searchBoxInstance.getPlaces();

        if (places.length === 0) return;

        // Clear existing markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // Create bounds to fit all places
        const bounds = new window.google.maps.LatLngBounds();

        places.forEach(place => {
          if (!place.geometry || !place.geometry.location) {
            logger.warn('Place has no geometry', place);
            return;
          }

          // Create a marker for each place
          const marker = new window.google.maps.Marker({
            map: map,
            title: place.name,
            position: place.geometry.location
          });

          markersRef.current.push(marker);

          if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport);
          } else {
            bounds.extend(place.geometry.location);
          }

          // Notify parent component
          if (onPlaceSelected) {
            onPlaceSelected({
              id: place.place_id,
              name: place.name,
              address: place.formatted_address,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              raw: place
            });
          }
        });

        map.fitBounds(bounds);
      });

      searchBoxRef.current = searchBoxInstance;
    }

    // Get user location
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);

          // Add user location marker
          new window.google.maps.Marker({
            position: userPos,
            map: map,
            title: 'Your Location',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2
            }
          });

          // Center map on user location if no center provided
          if (!center || (center.lat === 40.7128 && center.lng === -74.0060)) {
            map.setCenter(userPos);
          }
        },
        (error) => {
          logger.warn('Error getting user location:', error);
        }
      );
    }
  }, [mapLoaded, center, zoom, onMapClick, showUserLocation, searchBox, onPlaceSelected]);

  // Update markers
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    // Set up global click handler for info windows
    window.googleMapInfoWindowClick = (markerId) => {
      const markerData = markers.find(m => m.id === markerId);
      if (markerData && onMarkerClick) {
        onMarkerClick(markerData);
      }
    };

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const marker = new window.google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map: googleMapRef.current,
        title: markerData.title || '',
        icon: markerData.color ? {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: markerData.color,
          fillOpacity: 1,
          strokeColor: 'white',
          strokeWeight: 2
        } : undefined
      });

      // Add click listener
      if (onMarkerClick) {
        marker.addListener('click', () => {
          onMarkerClick(markerData);
        });
      }

      // Add info window if description provided or showLabel is true
      if (markerData.description || markerData.showLabel) {
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; cursor: pointer;" onclick="window.googleMapInfoWindowClick && window.googleMapInfoWindowClick('${markerData.id}')">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #1a73e8;">
                ${markerData.title || 'Location'}
              </h3>
              ${markerData.description ? `
                <p style="margin: 0; font-size: 12px; color: #666;">
                  ${markerData.description}
                </p>
              ` : ''}
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #1a73e8;">Click for details →</p>
            </div>
          `
        });

        // Auto-open info window if showLabel is true
        if (markerData.showLabel) {
          infoWindow.open(googleMapRef.current, marker);
        }

        marker.addListener('click', () => {
          infoWindow.open(googleMapRef.current, marker);
          // Also trigger the marker click handler
          if (onMarkerClick) {
            onMarkerClick(markerData);
          }
        });
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      markers.forEach(marker => {
        bounds.extend({ lat: marker.lat, lng: marker.lng });
      });
      googleMapRef.current.fitBounds(bounds);
    }

    // Cleanup function
    return () => {
      if (window.googleMapInfoWindowClick) {
        delete window.googleMapInfoWindowClick;
      }
    };
  }, [markers, mapLoaded, onMarkerClick]);

  // Update center and zoom
  useEffect(() => {
    if (!googleMapRef.current || !mapLoaded) return;

    googleMapRef.current.setCenter(center);
    googleMapRef.current.setZoom(zoom);
  }, [center, zoom, mapLoaded]);

  return (
    <div className={`google-map-container ${className}`} style={{ ...style, height, position: 'relative' }}>
      {!mapLoaded && (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef}
        className="google-map"
        style={{ 
          width: '100%', 
          height: '100%',
          display: mapLoaded ? 'block' : 'none',
          borderRadius: '8px'
        }}
      />
      
      {showUserLocation && userLocation && (
        <button
          onClick={() => {
            if (googleMapRef.current && userLocation) {
              googleMapRef.current.setCenter(userLocation);
              googleMapRef.current.setZoom(14);
            }
          }}
          className="absolute bottom-4 right-4 bg-white p-2 rounded-full shadow-lg hover:shadow-xl transition-shadow z-10"
          title="Center on my location"
        >
          <Navigation className="w-5 h-5 text-blue-600" />
        </button>
      )}
    </div>
  );
};

export default GoogleMapView;