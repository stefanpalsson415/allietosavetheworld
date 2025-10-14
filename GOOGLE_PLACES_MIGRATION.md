# Google Places API Migration Guide

## Overview
Migration from Mapbox to Google Places API for better address autocomplete and integration with existing Google services.

## Setup Instructions

### 1. Enable Google Places API
Since you already have a Google Cloud account with Firebase:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (parentload-ba995)
3. Navigate to **APIs & Services** > **Library**
4. Search and enable these APIs:
   - **Places API**
   - **Maps JavaScript API**
   - **Geocoding API** (optional, for reverse geocoding)

### 2. API Key Configuration
Your existing `REACT_APP_GOOGLE_API_KEY` in `.env` will work for Places API too.

To add restrictions (recommended for production):
1. Go to **APIs & Services** > **Credentials**
2. Click on your API key
3. Under **Application restrictions**:
   - Choose "HTTP referrers"
   - Add your domains:
     - `https://parentload-ba995.web.app/*`
     - `https://parentload-ba995.firebaseapp.com/*`
     - `http://localhost:3000/*` (for development)
4. Under **API restrictions**:
   - Select "Restrict key"
   - Check: Places API, Maps JavaScript API, Calendar API

## Migration Status

### ✅ Completed
1. Created `GooglePlacesInput.jsx` component
2. Updated `PlaceSearchService.js` with full Google Places implementation
3. Changed default provider from Mapbox to Google

### 🚧 Components to Update

#### High Priority (Calendar & Events)
- [ ] `/src/components/chat/EventCreationForm.jsx` - Event location input
- [ ] `/src/components/calendar/EnhancedEventManager.jsx` - Event location field
- [ ] `/src/components/settings/LocationsSettingsTab.jsx` - Saved locations

#### Medium Priority (Places Feature)
- [ ] `/src/components/dashboard/tabs/places/AddPlaceModal.jsx`
- [ ] `/src/components/dashboard/tabs/NotionPlacesTab.jsx`
- [ ] `/src/components/settings/DirectLocationSaver.js`

#### Low Priority (Replace if needed)
- [ ] `/src/components/common/MapboxLocationInput.jsx` - Replace with GooglePlacesInput
- [ ] `/src/components/common/MixedMapboxInput.jsx` - Update to use Google
- [ ] `/src/components/common/BasicAddressInput.jsx` - Update fallback

### Map View Components
- [ ] `/src/components/dashboard/tabs/places/MapboxMapView.jsx` - Replace with Google Maps

## Implementation Examples

### Using GooglePlacesInput Component
```jsx
import GooglePlacesInput from '../common/GooglePlacesInput';

// Basic usage
<GooglePlacesInput
  value={location}
  onChange={setLocation}
  onSelect={(place) => {
    console.log('Selected place:', place);
    // place object contains:
    // - id: Google place_id
    // - fullAddress: Formatted address
    // - coordinates: { lat, lng }
    // - center: [lng, lat] for Mapbox compatibility
  }}
  placeholder="Search for a location"
/>

// With restrictions
<GooglePlacesInput
  componentRestrictions={{ country: 'us' }}
  types={['address']}
  bounds={userLocationBounds}
/>
```

### Using PlaceSearchService
```javascript
import placeSearchService from '../services/PlaceSearchService';

// Search for places
const results = await placeSearchService.search('coffee shop', {
  proximity: [userLng, userLat],
  radius: 5000
});

// Get place details
const details = await placeSearchService.details(placeId);
```

## Benefits of Google Places Over Mapbox

### 🎯 Better Autocomplete
- More accurate address predictions
- Better handling of business names
- Smarter fuzzy matching
- Support for place names + addresses

### 🌍 Richer Data
- Business hours
- Phone numbers
- Reviews and ratings
- Photos
- Place types (restaurant, store, etc.)

### 💰 Cost Optimization
- Session-based pricing (groups autocomplete requests)
- Shared billing with other Google services
- Better free tier for small apps

### 🔗 Integration Benefits
- Works seamlessly with Google Calendar events
- Same API key for all Google services
- Better support for international addresses
- Consistent data format across services

## Testing Checklist

- [ ] Address autocomplete works in event creation
- [ ] Selected addresses save correctly
- [ ] Location data syncs with Google Calendar
- [ ] Saved places appear in settings
- [ ] Map view displays locations correctly
- [ ] International addresses work
- [ ] Mobile experience is smooth

## Rollback Plan

If issues arise, you can temporarily switch back to Mapbox:

1. Change default in `PlaceSearchService.js`:
```javascript
export function createPlaceSearchService(type = PlaceSearchTypes.MAPBOX, options = {})
```

2. Keep both implementations active during transition

## Notes

- Google Places API uses session tokens for billing optimization (implemented)
- Autocomplete predictions are free until user selects a place
- Place Details API calls are billable but necessary for coordinates
- Consider caching place details to reduce API calls

## Next Steps

1. Test GooglePlacesInput in development
2. Replace MapboxLocationInput usage one component at a time
3. Monitor Google Cloud Console for API usage
4. Remove Mapbox dependencies once migration is complete