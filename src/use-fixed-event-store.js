// src/use-fixed-event-store.js - Simple script to replace the EventStore with the fixed version

// Import both versions
import originalEventStore from './services/EventStore';
import fixedEventStore from './services/EventStore.fixed';

// Object to store the active event store
const activeStore = {
  instance: null
};

// Initialize with the fixed version
activeStore.instance = fixedEventStore;

// Mark that we're using the fixed version
if (typeof window !== 'undefined') {
  window._usingFixedEventStore = true;
  console.log("📆 Using fixed EventStore implementation");
}

// Function to get the active event store
export function getEventStore() {
  return activeStore.instance;
}

// Export the fixed store by default
export default fixedEventStore;