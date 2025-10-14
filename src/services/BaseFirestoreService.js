// BaseFirestoreService.js - Foundation for all Firebase services
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  writeBatch 
} from 'firebase/firestore';

class BaseFirestoreService {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.subscriptions = new Map();
    this.cache = new Map();
    this.debug = process.env.NODE_ENV === 'development';
  }

  log(...args) {
    if (this.debug) {
      console.log(`[${this.collectionName}]`, ...args);
    }
  }

  error(...args) {
    console.error(`[${this.collectionName}]`, ...args);
  }

  // Create with automatic timestamps
  async create(data, customId = null) {
    try {
      const timestamp = serverTimestamp();
      const docData = {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp
      };

      // Remove undefined values
      Object.keys(docData).forEach(key => 
        docData[key] === undefined && delete docData[key]
      );

      let docRef;
      if (customId) {
        docRef = doc(db, this.collectionName, customId);
        await setDoc(docRef, docData);
        this.log('Created with custom ID:', customId);
      } else {
        docRef = await addDoc(collection(db, this.collectionName), docData);
        this.log('Created with auto ID:', docRef.id);
      }

      const created = { id: docRef.id, ...docData };
      this.cache.set(docRef.id, created);
      
      return created;
    } catch (error) {
      this.error('Create error:', error);
      throw error;
    }
  }

  // Get single document
  async get(id, useCache = true) {
    try {
      // Check cache first
      if (useCache && this.cache.has(id)) {
        this.log('Cache hit:', id);
        return this.cache.get(id);
      }

      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error(`${this.collectionName} document not found: ${id}`);
      }
      
      const data = { id: docSnap.id, ...docSnap.data() };
      
      // Convert Firestore timestamps to dates
      this.convertTimestamps(data);
      
      // Update cache
      this.cache.set(id, data);
      
      return data;
    } catch (error) {
      this.error('Get error:', error);
      throw error;
    }
  }

  // Update with automatic timestamp
  async update(id, data) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp()
      };
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );
      
      await updateDoc(docRef, updateData);
      
      // Update cache
      if (this.cache.has(id)) {
        const cached = this.cache.get(id);
        this.cache.set(id, { ...cached, ...updateData });
      }
      
      this.log('Updated:', id);
      return { id, ...updateData };
    } catch (error) {
      this.error('Update error:', error);
      throw error;
    }
  }

  // Soft delete (set status) or hard delete
  async delete(id, soft = true) {
    try {
      const docRef = doc(db, this.collectionName, id);
      
      if (soft) {
        await updateDoc(docRef, {
          status: 'deleted',
          deletedAt: serverTimestamp()
        });
        this.log('Soft deleted:', id);
      } else {
        await deleteDoc(docRef);
        this.log('Hard deleted:', id);
      }
      
      // Remove from cache
      this.cache.delete(id);
      
      return { id, deleted: true };
    } catch (error) {
      this.error('Delete error:', error);
      throw error;
    }
  }

  // Batch operations
  async batchCreate(documents) {
    try {
      const batch = writeBatch(db);
      const timestamp = serverTimestamp();
      const results = [];

      documents.forEach(doc => {
        const docData = {
          ...doc,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        
        const docRef = doc.id 
          ? doc(db, this.collectionName, doc.id)
          : doc(collection(db, this.collectionName));
          
        batch.set(docRef, docData);
        results.push({ id: docRef.id, ...docData });
      });

      await batch.commit();
      this.log('Batch created:', results.length, 'documents');
      
      return results;
    } catch (error) {
      this.error('Batch create error:', error);
      throw error;
    }
  }

  // Query with pagination
  async query(filters = {}, options = {}) {
    try {
      const {
        orderByField = 'createdAt',
        orderDirection = 'desc',
        pageSize = 20,
        lastDoc = null
      } = options;

      let q = collection(db, this.collectionName);
      
      // Build query constraints
      const constraints = [];
      
      // Apply filters
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          constraints.push(where(field, '==', value));
        }
      });
      
      // Apply ordering
      constraints.push(orderBy(orderByField, orderDirection));
      
      // Apply pagination
      constraints.push(limit(pageSize));
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      
      // Execute query
      q = query(q, ...constraints);
      const snapshot = await getDocs(q);
      
      const docs = snapshot.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() };
        this.convertTimestamps(data);
        return data;
      });
      
      this.log('Query returned:', docs.length, 'documents');
      
      return {
        docs,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === pageSize
      };
    } catch (error) {
      this.error('Query error:', error);
      
      // Handle missing index error
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        this.error('Missing index. Create it here:', error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)?.[0]);
        
        // Fallback to simpler query
        try {
          const simpleQuery = query(
            collection(db, this.collectionName),
            ...Object.entries(filters).map(([field, value]) => where(field, '==', value))
          );
          const snapshot = await getDocs(simpleQuery);
          const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          return { docs, lastDoc: null, hasMore: false };
        } catch (fallbackError) {
          throw fallbackError;
        }
      }
      
      throw error;
    }
  }

  // Real-time subscription
  subscribe(filters = {}, callback, errorCallback = null) {
    try {
      const subscriptionId = Date.now().toString();
      
      let q = collection(db, this.collectionName);
      const constraints = [];
      
      Object.entries(filters).forEach(([field, value]) => {
        if (value !== undefined && value !== null) {
          constraints.push(where(field, '==', value));
        }
      });
      
      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const docs = [];
          const changes = {
            added: [],
            modified: [],
            removed: []
          };
          
          snapshot.docChanges().forEach(change => {
            const doc = { id: change.doc.id, ...change.doc.data() };
            this.convertTimestamps(doc);
            
            if (change.type === 'added') {
              changes.added.push(doc);
            } else if (change.type === 'modified') {
              changes.modified.push(doc);
            } else if (change.type === 'removed') {
              changes.removed.push(doc);
            }
          });
          
          snapshot.docs.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            this.convertTimestamps(data);
            docs.push(data);
          });
          
          this.log('Subscription update:', {
            total: docs.length,
            added: changes.added.length,
            modified: changes.modified.length,
            removed: changes.removed.length
          });
          
          callback(docs, changes);
        },
        (error) => {
          this.error('Subscription error:', error);
          if (errorCallback) {
            errorCallback(error);
          }
        }
      );
      
      this.subscriptions.set(subscriptionId, unsubscribe);
      this.log('Subscription created:', subscriptionId);
      
      // Return cleanup function
      return () => {
        unsubscribe();
        this.subscriptions.delete(subscriptionId);
        this.log('Subscription cleaned up:', subscriptionId);
      };
    } catch (error) {
      this.error('Subscribe error:', error);
      throw error;
    }
  }

  // Convert Firestore timestamps to JS dates
  convertTimestamps(obj) {
    Object.keys(obj).forEach(key => {
      if (obj[key] && typeof obj[key].toDate === 'function') {
        obj[key] = obj[key].toDate();
      }
    });
    return obj;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
    this.log('Cache cleared');
  }

  // Cleanup all subscriptions
  cleanup() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
    this.clearCache();
    this.log('Service cleaned up');
  }
}

export default BaseFirestoreService;