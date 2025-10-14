// Scalable Data Service - Implements pagination, caching, and smart querying
import { db } from './firebase';
import { 
  collection, query, where, orderBy, limit, 
  startAfter, getDocs, onSnapshot, doc, getDoc 
} from 'firebase/firestore';

class ScalableDataService {
  constructor() {
    // In-memory cache with TTL
    this.cache = new Map();
    this.listeners = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    this.PAGE_SIZE = 50;
    this.MAX_LISTENERS = 10; // Maximum concurrent listeners per family
  }

  // Get paginated data with caching
  async getPaginatedData(collectionName, familyId, options = {}) {
    const {
      pageSize = this.PAGE_SIZE,
      orderByField = 'createdAt',
      orderDirection = 'desc',
      startAfterDoc = null,
      filters = [],
      useCache = true
    } = options;

    // Check cache first
    const cacheKey = `${collectionName}-${familyId}-${JSON.stringify(options)}`;
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      // Build query with limits
      let q = query(
        collection(db, collectionName),
        where('familyId', '==', familyId),
        ...filters,
        orderBy(orderByField, orderDirection),
        limit(pageSize)
      );

      if (startAfterDoc) {
        q = query(q, startAfter(startAfterDoc));
      }

      const snapshot = await getDocs(q);
      const items = [];
      let lastDoc = null;

      snapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data(),
          _docRef: doc // Store for pagination
        });
        lastDoc = doc;
      });

      const result = {
        items,
        hasMore: items.length === pageSize,
        lastDoc,
        total: items.length
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error(`Error fetching paginated data from ${collectionName}:`, error);
      throw error;
    }
  }

  // Subscribe to limited real-time updates
  subscribeToCollection(collectionName, familyId, callback, options = {}) {
    const {
      limit: resultLimit = 20, // Only sync most recent items
      orderByField = 'updatedAt',
      filters = []
    } = options;

    // Check listener limit
    const familyListenerKey = `${familyId}-listeners`;
    const currentListeners = this.listeners.get(familyListenerKey) || 0;
    
    if (currentListeners >= this.MAX_LISTENERS) {
      console.warn(`Listener limit reached for family ${familyId}`);
      return () => {}; // Return no-op unsubscribe
    }

    // Create limited query
    const q = query(
      collection(db, collectionName),
      where('familyId', '==', familyId),
      ...filters,
      orderBy(orderByField, 'desc'),
      limit(resultLimit)
    );

    // Track listener count
    this.listeners.set(familyListenerKey, currentListeners + 1);

    // Subscribe with automatic error handling
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
          items.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(items);
      },
      (error) => {
        console.error(`Listener error for ${collectionName}:`, error);
        // Implement exponential backoff for reconnection
        this.handleListenerError(collectionName, familyId, callback, options);
      }
    );

    // Return cleanup function
    return () => {
      unsubscribe();
      const count = this.listeners.get(familyListenerKey) || 0;
      this.listeners.set(familyListenerKey, Math.max(0, count - 1));
    };
  }

  // Get single document with caching
  async getDocument(collectionName, docId, useCache = true) {
    const cacheKey = `${collectionName}-${docId}`;
    
    if (useCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data()
        };
        
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        return data;
      }
      return null;
    } catch (error) {
      console.error(`Error fetching document ${docId}:`, error);
      throw error;
    }
  }

  // Clear cache for a specific family
  clearFamilyCache(familyId) {
    const keysToDelete = [];
    this.cache.forEach((value, key) => {
      if (key.includes(familyId)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Get data for specific date range (for calendars/events)
  async getDataForDateRange(collectionName, familyId, startDate, endDate, options = {}) {
    const filters = [
      where('startDate', '>=', startDate),
      where('startDate', '<=', endDate),
      ...options.additionalFilters || []
    ];

    return this.getPaginatedData(collectionName, familyId, {
      ...options,
      filters,
      orderByField: 'startDate',
      pageSize: 100 // Reasonable limit for a month view
    });
  }

  // Batch fetch multiple documents efficiently
  async batchGetDocuments(collectionName, docIds) {
    const chunks = [];
    const chunkSize = 10; // Firestore limit for 'in' queries
    
    for (let i = 0; i < docIds.length; i += chunkSize) {
      chunks.push(docIds.slice(i, i + chunkSize));
    }

    const results = [];
    
    for (const chunk of chunks) {
      const q = query(
        collection(db, collectionName),
        where('__name__', 'in', chunk)
      );
      
      const snapshot = await getDocs(q);
      snapshot.forEach((doc) => {
        results.push({
          id: doc.id,
          ...doc.data()
        });
      });
    }
    
    return results;
  }

  // Handle listener errors with exponential backoff
  handleListenerError(collectionName, familyId, callback, options, retryCount = 0) {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    
    if (retryCount >= maxRetries) {
      console.error(`Max retries reached for ${collectionName} listener`);
      return;
    }
    
    const delay = baseDelay * Math.pow(2, retryCount);
    
    setTimeout(() => {
      console.log(`Retrying listener for ${collectionName} (attempt ${retryCount + 1})`);
      this.subscribeToCollection(collectionName, familyId, callback, options);
    }, delay);
  }

  // Get summary counts without loading all data
  async getCollectionCount(collectionName, familyId, filters = []) {
    const q = query(
      collection(db, collectionName),
      where('familyId', '==', familyId),
      ...filters,
      limit(1000) // Safety limit
    );
    
    const snapshot = await getDocs(q);
    return snapshot.size;
  }
}

// Export singleton instance
export default new ScalableDataService();