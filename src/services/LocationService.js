// Location Service - Get user location for personalized questions
import { db } from './firebase';
import { doc, updateDoc } from 'firebase/firestore';

class LocationService {
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            // Use a reverse geocoding service to get city/country
            const locationData = await this.reverseGeocode(latitude, longitude);
            resolve({
              latitude,
              longitude,
              ...locationData
            });
          } catch (error) {
            // Return basic location even if geocoding fails
            resolve({
              latitude,
              longitude,
              city: 'Unknown',
              country: 'Unknown'
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve({
            latitude: null,
            longitude: null,
            city: 'Unknown',
            country: 'Unknown'
          });
        }
      );
    });
  }

  async reverseGeocode(latitude, longitude) {
    try {
      // Using OpenStreetMap's Nominatim service (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'ParentLoad Family Survey App'
          }
        }
      );
      
      const data = await response.json();
      
      return {
        city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
        state: data.address?.state || '',
        country: data.address?.country || 'Unknown',
        countryCode: data.address?.country_code?.toUpperCase() || ''
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return {
        city: 'Unknown',
        country: 'Unknown'
      };
    }
  }

  async updateFamilyLocation(familyId, location) {
    try {
      const familyRef = doc(db, 'families', familyId);
      await updateDoc(familyRef, {
        location: {
          ...location,
          updatedAt: new Date().toISOString()
        }
      });
      return true;
    } catch (error) {
      console.error('Error updating family location:', error);
      return false;
    }
  }

  // Get location from IP address as fallback
  async getLocationFromIP() {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      return {
        city: data.city || 'Unknown',
        region: data.region || '',
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        timezone: data.timezone || ''
      };
    } catch (error) {
      console.error('Error getting location from IP:', error);
      return {
        city: 'Unknown',
        country: 'Unknown'
      };
    }
  }
}

export default new LocationService();