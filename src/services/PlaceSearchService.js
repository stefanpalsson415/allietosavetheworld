// PlaceSearchService.js - Abstract interface for place search functionality
import config from '../config';
import logger from '../utils/logger';

// Ensure config is available
const safeConfig = config || { mapbox: { accessToken: 'pk.eyJ1Ijoic3BhbHNzb24iLCJhIjoiY21hN3lmMHE3MTF4eTJsc2dodXlhY3V6ZSJ9.LM8VtdOBYFVzGG0nfFjc2A' } };

export const PlaceSearchTypes = {
  GOOGLE: 'google',
  MAPBOX: 'mapbox'
};

/**
 * Place interface - common structure for location data
 * @typedef {Object} Place
 * @property {string} id - Unique identifier for the place
 * @property {string} text - Primary display text for the place
 * @property {string} fullAddress - Complete address
 * @property {[number, number]} center - [longitude, latitude] coordinates
 */

/**
 * Creates a PlaceSearchService instance based on provider type
 * @param {string} type - Type of provider (google, mapbox)
 * @param {Object} options - Provider specific options
 * @returns {PlaceSearchService} A place search service instance
 */
export function createPlaceSearchService(type = PlaceSearchTypes.GOOGLE, options = {}) {
  switch (type) {
    case PlaceSearchTypes.GOOGLE:
      return new GooglePlaceSearchService(options);
    case PlaceSearchTypes.MAPBOX:
      return new MapboxPlaceSearchService(options);
    default:
      return new GooglePlaceSearchService(options); // Default to Google
  }
}

/**
 * Base PlaceSearchService interface
 */
class PlaceSearchService {
  /**
   * Search for places matching a query
   * @param {string} query - Search text
   * @param {Object} options - Search options
   * @param {[number, number]} options.proximity - [longitude, latitude] to bias results
   * @returns {Promise<Place[]>} Array of matching places
   */
  async search(query, options = {}) {
    throw new Error('Method not implemented');
  }

  /**
   * Get detailed information about a place by ID
   * @param {string} id - Place identifier
   * @returns {Promise<Place>} Detailed place information
   */
  async details(id) {
    throw new Error('Method not implemented');
  }
}

/**
 * Google Places implementation of PlaceSearchService
 * Now the primary implementation for place search
 */
class GooglePlaceSearchService extends PlaceSearchService {
  constructor(options = {}) {
    super();
    this.options = options;
    this.service = null;
    this.sessionToken = null;
    this.initService();
  }

  initService() {
    // Initialize when Google Maps is loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      this.service = new window.google.maps.places.AutocompleteService();
      this.placesService = new window.google.maps.places.PlacesService(
        document.createElement('div')
      );
      this.sessionToken = new window.google.maps.places.AutocompleteSessionToken();
    }
  }

  async search(query, options = {}) {
    try {
      // Ensure service is initialized
      if (!this.service) {
        this.initService();
        if (!this.service) {
          logger.error('Google Places service not initialized');
          return [];
        }
      }

      return new Promise((resolve, reject) => {
        const request = {
          input: query,
          sessionToken: this.sessionToken
        };

        // Add proximity bias if provided
        if (options.proximity) {
          const [lng, lat] = options.proximity;
          request.location = new window.google.maps.LatLng(lat, lng);
          request.radius = options.radius || 50000; // 50km default radius
        }

        // Add types if specified
        if (options.types) {
          request.types = options.types;
        }

        this.service.getPlacePredictions(request, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const results = predictions.map(prediction => ({
              id: prediction.place_id,
              text: prediction.structured_formatting.main_text || prediction.description,
              fullAddress: prediction.description,
              secondaryText: prediction.structured_formatting.secondary_text || '',
              types: prediction.types || [],
              center: null // Will be populated when details are fetched
            }));
            resolve(results);
          } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
          } else {
            logger.error('Google Places search failed:', status);
            resolve([]);
          }
        });
      });
    } catch (error) {
      logger.error('Error in GooglePlaceSearchService.search:', error);
      return [];
    }
  }

  async details(placeId) {
    try {
      if (!this.placesService) {
        this.initService();
        if (!this.placesService) {
          logger.error('Google Places service not initialized');
          return null;
        }
      }

      return new Promise((resolve, reject) => {
        const request = {
          placeId: placeId,
          fields: ['name', 'formatted_address', 'geometry', 'address_components', 'types']
        };

        this.placesService.getDetails(request, (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const result = {
              id: placeId,
              text: place.name || place.formatted_address,
              fullAddress: place.formatted_address,
              center: [
                place.geometry.location.lng(),
                place.geometry.location.lat()
              ],
              coordinates: {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              },
              types: place.types || [],
              components: {}
            };

            // Parse address components
            if (place.address_components) {
              place.address_components.forEach(comp => {
                const type = comp.types[0];
                result.components[type] = {
                  long_name: comp.long_name,
                  short_name: comp.short_name
                };
              });
            }

            // Reset session token after getting details
            this.sessionToken = new window.google.maps.places.AutocompleteSessionToken();
            
            resolve(result);
          } else {
            logger.error('Google Places details failed:', status);
            resolve(null);
          }
        });
      });
    } catch (error) {
      logger.error('Error in GooglePlaceSearchService.details:', error);
      return null;
    }
  }
}

/**
 * Mapbox implementation of PlaceSearchService
 */
class MapboxPlaceSearchService extends PlaceSearchService {
  constructor(options = {}) {
    super();
    this.options = options;
    this.accessToken = options.accessToken || safeConfig?.mapbox?.accessToken || 'pk.eyJ1Ijoic3BhbHNzb24iLCJhIjoiY21hN3lmMHE3MTF4eTJsc2dodXlhY3V6ZSJ9.LM8VtdOBYFVzGG0nfFjc2A';
    
    logger.debug('MapboxPlaceSearchService - Token:', this.accessToken ? `${this.accessToken.substring(0, 10)}...` : 'Missing');
    
    if (!this.accessToken) {
      logger.error('Mapbox access token is required');
    }
    
    // Create a local cache for place details
    this.cache = new Map();
  }

  /**
   * Search for places using Mapbox Geocoding API
   * @param {string} query - Search text
   * @param {Object} options - Search options
   * @returns {Promise<Place[]>} Array of matching places
   */
  async search(query, options = {}) {
    if (!query || query.length < 3) {
      return [];
    }

    try {
      logger.debug('Mapbox search - Query:', query);
      logger.debug('Mapbox search - Access token:', this.accessToken ? 'Present' : 'Missing');
      
      const params = new URLSearchParams({
        access_token: this.accessToken,
        autocomplete: 'true',
        fuzzyMatch: 'true',
        limit: '5',
        types: 'address,poi,neighborhood,place,locality,postcode'
      });

      // Add proximity if available
      if (options.proximity && Array.isArray(options.proximity) && options.proximity.length === 2) {
        params.append('proximity', options.proximity.join(','));
      }

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
      logger.debug('Mapbox search - URL:', url);

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Mapbox API error response:', errorText);
        throw new Error(`Mapbox API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      logger.debug('Mapbox search - Results count:', data.features?.length || 0);
      
      // Convert Mapbox features to common Place format
      return data.features.map(feature => ({
        id: feature.id,
        text: feature.text,
        fullAddress: feature.place_name,
        center: feature.center // Already in [lng, lat] format
      }));
    } catch (error) {
      logger.error('Error in MapboxPlaceSearchService.search:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a place by ID
   * @param {string} id - Place identifier
   * @returns {Promise<Place>} Detailed place information
   */
  async details(id) {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    try {
      const params = new URLSearchParams({
        access_token: this.accessToken
      });

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(id)}.json?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.features || data.features.length === 0) {
        throw new Error('No details found for this place ID');
      }
      
      const feature = data.features[0];
      const place = {
        id: feature.id,
        text: feature.text,
        fullAddress: feature.place_name,
        center: feature.center
      };
      
      // Cache the result for 24 hours
      this.cache.set(id, place);
      
      return place;
    } catch (error) {
      logger.error('Error in MapboxPlaceSearchService.details:', error);
      return {
        id: '',
        text: '',
        fullAddress: '',
        center: [0, 0]
      };
    }
  }
}

// Create and export the default instance - Now using Google Places
export default createPlaceSearchService(PlaceSearchTypes.GOOGLE);