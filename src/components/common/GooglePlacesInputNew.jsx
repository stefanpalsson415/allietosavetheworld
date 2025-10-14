import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import logger from '../../utils/logger';

// Google Places Autocomplete Component using new PlaceAutocompleteElement
const GooglePlacesInputNew = ({
  value = '',
  onChange,
  onSelect,
  placeholder = 'Search for a place or address',
  className = '',
  required = false,
  disabled = false,
  autoFocus = false,
  types = ['geocode', 'establishment'],
  componentRestrictions = null, // e.g., { country: 'us' }
  bounds = null, // LatLngBounds to bias results
  strictBounds = false,
  fields = ['address_components', 'formatted_address', 'geometry', 'name', 'place_id']
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const autocompleteElementRef = useRef(null);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const initAttemptedRef = useRef(false);

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('Google Maps Places API loaded');
        setGoogleLoaded(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkGoogleMaps()) return;

    // Listen for the ready event
    const handleGoogleMapsReady = () => {
      console.log('Google Maps ready event received');
      setGoogleLoaded(true);
    };

    window.addEventListener('google-maps-ready', handleGoogleMapsReady);

    // Check periodically with limited attempts
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds max
    const interval = setInterval(() => {
      attempts++;
      if (checkGoogleMaps() || attempts >= maxAttempts) {
        clearInterval(interval);
        if (attempts >= maxAttempts) {
          setError('Google Maps failed to load. Please refresh the page.');
        }
      }
    }, 500);

    // Cleanup
    return () => {
      window.removeEventListener('google-maps-ready', handleGoogleMapsReady);
      clearInterval(interval);
    };
  }, []);

  // Initialize autocomplete when Google Maps is loaded
  useEffect(() => {
    if (!googleLoaded || !inputRef.current || initAttemptedRef.current) return;
    
    initAttemptedRef.current = true;

    try {
      // For now, always use the classic Autocomplete API as PlaceAutocompleteElement requires additional setup
      // Check if PlaceAutocompleteElement is available (new API) - disabled for now
      if (false && window.google.maps.places.PlaceAutocompleteElement) {
        console.log('Using new PlaceAutocompleteElement API');
        
        // Create the new autocomplete element
        const autocompleteElement = new window.google.maps.places.PlaceAutocompleteElement({
          inputField: inputRef.current,
          componentRestrictions: componentRestrictions,
          types: types,
          fields: fields,
          locationBias: bounds,
          strictBounds: strictBounds
        });

        // Listen for place selection
        autocompleteElement.addEventListener('gmp-placeselect', async (event) => {
          const place = event.place;
          
          if (!place || !place.location) {
            logger.warn('No valid place selected');
            setError('Please select a valid location from the dropdown');
            return;
          }

          try {
            // Fetch additional details if needed
            await place.fetchFields({
              fields: ['displayName', 'formattedAddress', 'location', 'id']
            });

            setError(null);
            
            // Format the place data
            const formattedPlace = {
              id: place.id,
              name: place.displayName || '',
              address: place.formattedAddress || '',
              fullAddress: place.formattedAddress || '',
              lat: place.location.lat(),
              lng: place.location.lng(),
              center: [place.location.lng(), place.location.lat()], // [lng, lat] for compatibility
              coordinates: {
                lat: place.location.lat(),
                lng: place.location.lng()
              },
              raw: place
            };

            logger.log('Place selected:', formattedPlace);

            // Update input value
            const displayValue = place.formattedAddress || place.displayName || '';
            setInputValue(displayValue);
            
            // Call callbacks
            if (onChange) {
              onChange(displayValue);
            }
            
            if (onSelect) {
              onSelect(formattedPlace);
            }
          } catch (error) {
            logger.error('Error fetching place details:', error);
            setError('Failed to get place details');
          }
        });

        autocompleteElementRef.current = autocompleteElement;
        
      } else {
        // Use classic Autocomplete API (more stable)
        console.log('Using classic Autocomplete API');
        
        const options = {
          types: types,
          fields: fields
        };

        if (componentRestrictions) {
          options.componentRestrictions = componentRestrictions;
        }

        if (bounds) {
          options.bounds = bounds;
          options.strictBounds = strictBounds;
        }

        const autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          options
        );

        // Handle place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          
          if (!place.geometry) {
            logger.warn('No geometry found for selected place');
            setError('Please select a valid location from the dropdown');
            return;
          }

          setError(null);
          
          // Format the place data
          const formattedPlace = {
            id: place.place_id,
            name: place.name || '',
            address: place.formatted_address || '',
            fullAddress: place.formatted_address || '',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            center: [place.geometry.location.lng(), place.geometry.location.lat()],
            coordinates: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            },
            raw: place
          };

          // Extract address components if available
          if (place.address_components) {
            const components = {};
            place.address_components.forEach(comp => {
              const type = comp.types[0];
              components[type] = {
                long_name: comp.long_name,
                short_name: comp.short_name
              };
            });
            formattedPlace.components = components;
          }

          logger.log('Place selected (classic):', formattedPlace);

          // Update input value
          setInputValue(place.formatted_address || place.name || '');
          
          // Call callbacks
          if (onChange) {
            onChange(place.formatted_address || place.name || '');
          }
          
          if (onSelect) {
            onSelect(formattedPlace);
          }
        });

        autocompleteElementRef.current = autocomplete;
      }
    } catch (error) {
      logger.error('Error initializing Google Places Autocomplete:', error);
      setError('Failed to initialize address search. Please try refreshing the page.');
    }

    // Cleanup
    return () => {
      if (autocompleteElementRef.current) {
        if (window.google.maps.places.PlaceAutocompleteElement && 
            autocompleteElementRef.current instanceof window.google.maps.places.PlaceAutocompleteElement) {
          // Clean up new API element if needed
          autocompleteElementRef.current = null;
        } else {
          // Clean up old API
          window.google.maps.event.clearInstanceListeners(autocompleteElementRef.current);
          autocompleteElementRef.current = null;
        }
      }
    };
  }, [googleLoaded, types, componentRestrictions, bounds, strictBounds, fields, onChange, onSelect]);

  // Handle manual input changes
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
  }, [onChange]);

  // Clear input
  const handleClear = useCallback(() => {
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
  }, [onChange, onSelect]);

  // Sync external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  return (
    <div className={`google-places-input-container ${className}`} ref={containerRef}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {isLoading ? (
            <div className="animate-spin">
              <Search className="w-4 h-4" />
            </div>
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || !googleLoaded}
          required={required}
          autoFocus={autoFocus}
          className={`
            w-full pl-10 pr-10 py-2 
            bg-white border border-gray-200 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-50 disabled:text-gray-500
            ${error ? 'border-red-500' : ''}
          `}
        />
        
        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
      
      {!googleLoaded && !error && (
        <p className="mt-1 text-xs text-gray-500">Loading address search...</p>
      )}
    </div>
  );
};

export default GooglePlacesInputNew;