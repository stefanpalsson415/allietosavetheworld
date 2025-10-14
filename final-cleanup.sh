#\!/bin/bash

# Path to the file
FILE="/Users/stefanpalsson/parentload copy/src/components/calendar/EnhancedEventManager.jsx"

# Remove remaining Google Maps code after Mapbox location handling
sed -i '' '/Mapbox location handling is now complete/,/}/d' "$FILE"

echo "Final cleanup complete"
