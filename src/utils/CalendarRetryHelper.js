// Calendar Retry Helper
// Provides retry mechanism for calendar integration failures

import { doc, updateDoc, serverTimestamp, addDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelays: [1000, 3000, 5000], // Exponential backoff in milliseconds
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT',
    'SERVICE_UNAVAILABLE',
    'RATE_LIMIT_EXCEEDED'
  ]
};

/**
 * Checks if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is retryable
 */
function isRetryableError(error) {
  if (!error) return false;
  
  // Check for network errors
  if (error.message && (
    error.message.includes('network') ||
    error.message.includes('Network') ||
    error.message.includes('fetch') ||
    error.message.includes('Failed to fetch')
  )) {
    return true;
  }
  
  // Check for specific error codes
  if (error.code && RETRY_CONFIG.retryableErrors.includes(error.code)) {
    return true;
  }
  
  // Check for timeout errors
  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return true;
  }
  
  return false;
}

/**
 * Delays execution for a specified time
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Promise that resolves after delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Creates a calendar event with retry logic
 * @param {Function} calendarFunction - The calendar service function to call
 * @param {Object} eventData - Event data to create
 * @param {string} userId - User ID creating the event
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Calendar event result
 */
export async function createCalendarEventWithRetry(calendarFunction, eventData, userId, options = {}) {
  const { 
    maxRetries = RETRY_CONFIG.maxRetries,
    onRetry = () => {},
    storeFailedAttempt = true
  } = options;
  
  let lastError = null;
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      // Attempt to create the calendar event
      const result = await calendarFunction(eventData, userId);
      
      // If successful, return the result
      if (result && result.eventId) {
        // Log successful creation after retries
        if (attempt > 0) {
          console.log(`Calendar event created successfully after ${attempt} retries`);
        }
        return result;
      }
      
      // If no eventId returned, treat as failure
      throw new Error('Calendar event creation returned no eventId');
      
    } catch (error) {
      lastError = error;
      console.error(`Calendar event creation attempt ${attempt + 1} failed:`, error);
      
      // Check if error is retryable
      if (!isRetryableError(error) || attempt >= maxRetries) {
        break;
      }
      
      // Calculate delay for next retry
      const delayMs = RETRY_CONFIG.retryDelays[attempt] || 5000;
      
      // Notify about retry
      onRetry(attempt + 1, delayMs, error);
      
      // Wait before retrying
      await delay(delayMs);
      attempt++;
    }
  }
  
  // All retries failed
  console.error('Calendar event creation failed after all retries:', lastError);
  
  // Store failed attempt for manual retry later
  if (storeFailedAttempt) {
    await storeFailedCalendarEvent(eventData, userId, lastError);
  }
  
  // Return null to indicate failure
  return null;
}

/**
 * Stores a failed calendar event for manual retry later
 * @param {Object} eventData - Event data that failed to create
 * @param {string} userId - User ID who attempted to create
 * @param {Error} error - The error that occurred
 * @returns {Promise<string>} - ID of the stored failed attempt
 */
async function storeFailedCalendarEvent(eventData, userId, error) {
  try {
    const failedEventRef = await addDoc(collection(db, 'failedCalendarEvents'), {
      eventData,
      userId,
      error: {
        message: error.message,
        code: error.code,
        name: error.name
      },
      attempts: RETRY_CONFIG.maxRetries + 1,
      status: 'failed',
      createdAt: serverTimestamp(),
      lastAttemptAt: serverTimestamp()
    });
    
    console.log('Stored failed calendar event for manual retry:', failedEventRef.id);
    return failedEventRef.id;
  } catch (storeError) {
    console.error('Failed to store failed calendar event:', storeError);
    return null;
  }
}

/**
 * Updates an entity with calendar event ID after successful creation
 * @param {string} collection - Collection name
 * @param {string} documentId - Document ID to update
 * @param {string} calendarEventId - Calendar event ID to store
 * @returns {Promise<void>}
 */
export async function updateEntityWithCalendarId(collection, documentId, calendarEventId) {
  try {
    const docRef = doc(db, collection, documentId);
    await updateDoc(docRef, {
      calendarEventId,
      calendarSyncedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to update entity with calendar ID:', error);
    throw error;
  }
}

/**
 * Retry failed calendar events
 * @param {Function} calendarFunction - The calendar service function to call
 * @returns {Promise<Object>} - Results of retry attempts
 */
export async function retryFailedCalendarEvents(calendarFunction) {
  try {
    // Query failed calendar events
    const failedEventsQuery = query(
      collection(db, 'failedCalendarEvents'),
      where('status', '==', 'failed'),
      orderBy('createdAt', 'asc'),
      limit(10) // Process in batches
    );
    
    const snapshot = await getDocs(failedEventsQuery);
    const results = {
      successful: 0,
      failed: 0,
      total: snapshot.size
    };
    
    for (const doc of snapshot.docs) {
      const failedEvent = doc.data();
      
      try {
        // Attempt to create the calendar event
        const result = await createCalendarEventWithRetry(
          calendarFunction,
          failedEvent.eventData,
          failedEvent.userId,
          { storeFailedAttempt: false } // Don't create duplicate failed records
        );
        
        if (result && result.eventId) {
          // Update the failed event record
          await updateDoc(doc.ref, {
            status: 'resolved',
            resolvedAt: serverTimestamp(),
            calendarEventId: result.eventId
          });
          
          results.successful++;
        } else {
          results.failed++;
        }
      } catch (error) {
        console.error('Failed to retry calendar event:', error);
        results.failed++;
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error retrying failed calendar events:', error);
    throw error;
  }
}

export default {
  createCalendarEventWithRetry,
  updateEntityWithCalendarId,
  retryFailedCalendarEvents,
  isRetryableError
};