import React, { useEffect, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';

// Simplified Google Places Autocomplete Component
const GooglePlacesSimple = ({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Search for an address...',
  className = '',
  required = false,
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for Google Maps to be fully loaded
    const initAutocomplete = () => {
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        setTimeout(initAutocomplete, 500);
        return;
      }

      if (!inputRef.current || autocompleteRef.current) return;

      try {
        console.log('Initializing Google Places Autocomplete');
        
        // Create autocomplete with minimal options
        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['geocode', 'establishment'],
            fields: ['place_id', 'geometry', 'name', 'formatted_address', 'address_components']
          }
        );

        // Handle place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (!place.geometry) {
            console.warn('No geometry for place:', place);
            setError('Please select a valid location from the dropdown');
            return;
          }

          setError(null);
          console.log('Place selected:', place);

          // Format the place data
          const formattedPlace = {
            id: place.place_id,
            name: place.name || '',
            address: place.formatted_address || '',
            fullAddress: place.formatted_address || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            raw: place
          };

          // Update input
          const displayValue = place.formatted_address || place.name || '';
          setInputValue(displayValue);
          
          // Notify parent components
          if (onChange) {
            onChange(displayValue);
          }
          
          if (onSelect) {
            onSelect(formattedPlace);
          }
        });

        autocompleteRef.current = autocomplete;
        setIsReady(true);
        console.log('Autocomplete initialized successfully');
      } catch (error) {
        console.error('Error initializing autocomplete:', error);
        setError('Failed to initialize address search');
      }
    };

    // Start initialization
    initAutocomplete();

    // Cleanup
    return () => {
      if (autocompleteRef.current && window.google && window.google.maps) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Handle input changes
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
  };

  // Clear input
  const handleClear = () => {
    setInputValue('');
    setError(null);
    
    if (onChange) {
      onChange('');
    }
    
    if (onSelect) {
      onSelect(null);
    }
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Sync external value changes
  useEffect(() => {
    if (value !== inputValue && value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  return (
    <div className={`google-places-input-container ${className}`}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
          <MapPin className="w-4 h-4" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`
            w-full pl-10 pr-10 py-2 
            bg-white border border-gray-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500
            ${error ? 'border-red-500' : ''}
          `}
          style={{ position: 'relative', zIndex: 1 }}
        />
        
        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      
      {!isReady && !error && (
        <p className="mt-1 text-xs text-gray-500">Loading address search...</p>
      )}
    </div>
  );
};

export default GooglePlacesSimple;