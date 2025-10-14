/**
 * FamilyDriveTimeout.js
 * 
 * Direct fix for the FamilyAllieDrive component to prevent infinite loading states
 * by adding automatic timeout logic to all loading operations.
 */

// Maximum loading time allowed before forcing a completion
const MAX_LOADING_TIME = 8000; // 8 seconds

// Reference to any pending load timeouts
let pendingTimeouts = new Map();

/**
 * Creates a safe loading wrapper that ensures loading states are always properly resolved
 * @param {Function} setLoadingFn - The setState function for the loading state
 * @param {String} operationId - Unique identifier for the loading operation
 * @param {Number} timeout - Optional custom timeout in ms
 * @returns {Function} The wrapped loading setter function
 */
export const createSafeLoadingState = (setLoadingFn, operationId = 'default', timeout = MAX_LOADING_TIME) => {
  // Return a wrapper function that adds safety guarantees
  return (loadingState) => {
    // If we're setting loading to true, create a safety timeout
    if (loadingState === true) {
      console.log(`🕒 Setting up safety timeout for ${operationId}`);
      
      // Clear any existing timeout for this operation
      if (pendingTimeouts.has(operationId)) {
        clearTimeout(pendingTimeouts.get(operationId));
      }
      
      // Set a new timeout to force loading to false after the timeout period
      const timeoutId = setTimeout(() => {
        console.warn(`⚠️ Loading timeout reached for ${operationId} - forcing completion`);
        setLoadingFn(false);
        pendingTimeouts.delete(operationId);
        
        // Dispatch an event to notify about the forced completion
        document.dispatchEvent(new CustomEvent('loading-timeout-reached', {
          detail: { operationId }
        }));
      }, timeout);
      
      // Store the timeout ID so we can clear it later
      pendingTimeouts.set(operationId, timeoutId);
    } 
    // If loading is being set to false, clear any pending timeout
    else if (loadingState === false) {
      if (pendingTimeouts.has(operationId)) {
        clearTimeout(pendingTimeouts.get(operationId));
        pendingTimeouts.delete(operationId);
      }
    }
    
    // Actually update the loading state
    setLoadingFn(loadingState);
  };
};

/**
 * Creates a wrapped loadFamilyData function with built-in safety timeouts
 * @param {Function} originalLoadFn - The original loadFamilyData function
 * @param {Function} setLoadingFn - The setState function for the loading state
 * @param {Function} setDataFn - Function to set empty data if needed
 * @returns {Function} The wrapped safe loading function
 */
export const createSafeLoadFamilyData = (originalLoadFn, setLoadingFn, setDataFn) => {
  return async (...args) => {
    let loadCompleted = false;
    let timeoutId = null;
    
    // Set up safety timeout
    timeoutId = setTimeout(() => {
      if (!loadCompleted) {
        console.warn("⚠️ loadFamilyData timeout reached - forcing completion");
        setLoadingFn(false);
        
        // Set empty data arrays if needed
        if (setDataFn) {
          setDataFn();
        }
      }
    }, MAX_LOADING_TIME);
    
    try {
      // Call the original function
      const result = await originalLoadFn(...args);
      loadCompleted = true;
      
      // Clear the timeout since we completed normally
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      return result;
    } catch (error) {
      console.error("Error in loadFamilyData:", error);
      loadCompleted = true;
      
      // Clear the timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Ensure loading state is reset
      setLoadingFn(false);
      
      // Rethrow the error
      throw error;
    }
  };
};

/**
 * Helper function to make localStorage operations safer with timeouts
 * @param {String} key - The localStorage key
 * @returns {Object|null} The parsed data or null
 */
export const safeGetFromLocalStorage = (key) => {
  try {
    const start = Date.now();
    const data = localStorage.getItem(key);
    const elapsed = Date.now() - start;
    
    // Log if localStorage access is slow
    if (elapsed > 100) {
      console.warn(`⚠️ Slow localStorage access (${elapsed}ms) for key: ${key}`);
    }
    
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return null;
  }
};

/**
 * Helper function to make localStorage write operations safer
 * @param {String} key - The localStorage key
 * @param {Object} data - The data to store
 */
export const safeSetToLocalStorage = (key, data) => {
  try {
    const start = Date.now();
    localStorage.setItem(key, JSON.stringify(data));
    const elapsed = Date.now() - start;
    
    // Log if localStorage access is slow
    if (elapsed > 100) {
      console.warn(`⚠️ Slow localStorage write (${elapsed}ms) for key: ${key}`);
    }
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

export default {
  createSafeLoadingState,
  createSafeLoadFamilyData,
  safeGetFromLocalStorage,
  safeSetToLocalStorage
};