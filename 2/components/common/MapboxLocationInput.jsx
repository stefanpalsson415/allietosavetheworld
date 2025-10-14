import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { MapPin } from 'lucide-react';

// Set your Mapbox token here
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 'pk.eyJ1Ijoic3BhbHNzb24iLCJhIjoiY21hN3lmMHE3MTF4eTJsc2dodXlhY3V6ZSJ9.LM8VtdOBYFVzGG0nfFjc2A';

// Add a global error handler for Mapbox GL
mapboxgl.setRTLTextPlugin = function() {
  // Override this method which can cause errors
  console.log("RTL Text Plugin loading suppressed");
};

// Add a fallback for missing methods to prevent runtime errors
if (typeof MapboxGeocoder.prototype.onRemove !== 'function') {
  MapboxGeocoder.prototype.onRemove = function() {
    console.log("Using fallback onRemove method");
    if (this._map) {
      this._map = null;
    }
    // Other teardown code here
  };
}

// Helper to create a basic geocoder that works without requiring a map
const createBasicGeocoder = (config) => {
  // Basic geocoder setup with minimal requirements
  const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken,
    types: config.types || 'address,poi,place',
    placeholder: config.placeholder || 'Enter a location',
    proximity: config.proximity,
    minLength: 3,
    mapboxgl: mapboxgl,
    marker: false
  });
  
  return geocoder;
};

const MapboxLocationInput = ({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Enter a location',
  id = 'mapbox-location-input',
  className = '',
  required = false,
  disabled = false,
  autoFocus = false,
  proximity = null
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [useFallback, setUseFallback] = useState(false);
  const containerRef = useRef(null);
  const geocoderRef = useRef(null);
  
  // Initialize geocoder on mount
  useEffect(() => {
    if (!containerRef.current || useFallback) return;

    try {
      // Safely remove previous geocoder if it exists
      try {
        if (geocoderRef.current) {
          geocoderRef.current.onRemove();
        }
      } catch (error) {
        console.warn("Error removing previous geocoder:", error);
      }

      // Create new geocoder instance
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        types: 'address,poi,place',
        placeholder: placeholder,
        proximity: proximity ? { longitude: proximity[0], latitude: proximity[1] } : undefined,
        minLength: 3,
        marker: false,
        mapboxgl: mapboxgl
      });
      
      // Set up container
      geocoder.addTo(containerRef.current);
      geocoderRef.current = geocoder;
    } catch (error) {
      console.error("Error initializing Mapbox geocoder, using fallback:", error);
      setUseFallback(true);
      return;
    }

    // Get a reference to the current geocoder for event handlers
    const currentGeocoder = geocoderRef.current;

    // Set initial value if provided
    if (value) {
      const input = containerRef.current.querySelector('input');
      if (input) {
        input.value = value;
      }
    }

    // Handle result selection
    currentGeocoder.on('result', (e) => {
      const place = e.result;
      setInputValue(place.place_name);
      
      if (onChange) {
        onChange(place.place_name);
      }
      
      if (onSelect) {
        onSelect({
          id: place.id,
          text: place.text,
          fullAddress: place.place_name,
          center: place.center // [longitude, latitude]
        });
      }
    });

    // Handle clear
    currentGeocoder.on('clear', () => {
      setInputValue('');
      if (onChange) {
        onChange('');
      }
    });

    // Add listener for manual input
    const input = containerRef.current.querySelector('input');
    if (input) {
      input.id = id;
      input.required = required;
      input.disabled = disabled;
      input.autoFocus = autoFocus;
      
      // Add custom classes to input
      if (className) {
        input.className = `${input.className} ${className}`;
      }
      
      input.addEventListener('input', (e) => {
        setInputValue(e.target.value);
        if (onChange && !currentGeocoder.loading) {
          onChange(e.target.value);
        }
      });
    }

    return () => {
      try {
        if (geocoderRef.current && containerRef.current) {
          geocoderRef.current.onRemove();
        }
      } catch (error) {
        console.warn("Error cleaning up Mapbox geocoder:", error);
      }
      geocoderRef.current = null;
    };
  }, [proximity, placeholder, useFallback]);

  // Update input value when prop changes
  useEffect(() => {
    if (useFallback) return;
    
    try {
      if (value !== inputValue && geocoderRef.current && containerRef.current) {
        const input = containerRef.current.querySelector('input');
        if (input && input.value !== value) {
          input.value = value;
          setInputValue(value);
        }
      }
    } catch (error) {
      console.warn("Error updating input value:", error);
      setUseFallback(true);
    }
  }, [value, inputValue, useFallback]);

  // Force fallback if we've had any issues - this must be declared before any conditional returns
  useEffect(() => {
    if (useFallback) return; // Skip if already using fallback
    
    const timer = setTimeout(() => {
      if (containerRef.current) {
        const input = containerRef.current.querySelector('input');
        if (!input || (input && value && input.value !== value)) {
          console.log("Falling back to simple input as Mapbox integration seems unreliable");
          setUseFallback(true);
        }
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [value, useFallback]);
  
  // If Mapbox encounters an error, render a simple fallback input
  if (useFallback) {
    return (
      <div className="relative w-full">
        <div className="relative">
          <input
            id={id}
            type="text"
            className="w-full p-2 py-2.5 pl-9 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder={placeholder}
            value={value}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (onChange) onChange(e.target.value);
            }}
            required={required}
            disabled={disabled}
            autoFocus={autoFocus}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, render the Mapbox geocoder
  return (
    <div className="relative w-full">
      <div 
        ref={containerRef} 
        className="mapbox-geocoder-container"
        onError={() => setUseFallback(true)}
      />
      <style jsx="true">{`
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder {
          width: 100%;
          max-width: 100%;
          box-shadow: none;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
        }
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder input {
          height: 38px;
          padding-left: 32px;
        }
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder--icon-search {
          top: 10px;
        }
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder--suggestion {
          padding: 6px 12px;
          font-size: 0.875rem;
        }
        .mapbox-geocoder-container .mapboxgl-ctrl-geocoder--suggestion-title {
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default MapboxLocationInput;