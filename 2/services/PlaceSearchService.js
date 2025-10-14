// PlaceSearchService.js - Abstract interface for place search functionality

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
export function createPlaceSearchService(type = PlaceSearchTypes.MAPBOX, options = {}) {
  switch (type) {
    case PlaceSearchTypes.GOOGLE:
      return new GooglePlaceSearchService(options);
    case PlaceSearchTypes.MAPBOX:
    default:
      return new MapboxPlaceSearchService(options);
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
 * This will be removed after migration is complete
 */
class GooglePlaceSearchService extends PlaceSearchService {
  constructor(options = {}) {
    super();
    this.options = options;
    console.warn('GooglePlaceSearchService is deprecated and will be removed soon');
  }

  async search(query, options = {}) {
    try {
      // This is a placeholder implementation that returns empty results
      console.warn('GooglePlaceSearchService.search is deprecated');
      return [];
    } catch (error) {
      console.error('Error in GooglePlaceSearchService.search:', error);
      return [];
    }
  }

  async details(id) {
    try {
      // This is a placeholder implementation that returns empty results
      console.warn('GooglePlaceSearchService.details is deprecated');
      return {
        id: '',
        text: '',
        fullAddress: '',
        center: [0, 0]
      };
    } catch (error) {
      console.error('Error in GooglePlaceSearchService.details:', error);
      return {
        id: '',
        text: '',
        fullAddress: '',
        center: [0, 0]
      };
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
    this.accessToken = options.accessToken || process.env.REACT_APP_MAPBOX_TOKEN;
    
    if (!this.accessToken) {
      console.error('Mapbox access token is required');
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
      const params = new URLSearchParams({
        access_token: this.accessToken,
        autocomplete: true,
        fuzzyMatch: true,
        limit: 5,
        types: 'address,poi,place'
      });

      // Add proximity if available
      if (options.proximity && Array.isArray(options.proximity) && options.proximity.length === 2) {
        params.append('proximity', options.proximity.join(','));
      }

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert Mapbox features to common Place format
      return data.features.map(feature => ({
        id: feature.id,
        text: feature.text,
        fullAddress: feature.place_name,
        center: feature.center // Already in [lng, lat] format
      }));
    } catch (error) {
      console.error('Error in MapboxPlaceSearchService.search:', error);
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
      console.error('Error in MapboxPlaceSearchService.details:', error);
      return {
        id: '',
        text: '',
        fullAddress: '',
        center: [0, 0]
      };
    }
  }
}

// Create and export the default instance
export default createPlaceSearchService(PlaceSearchTypes.MAPBOX);