// DatabaseDebugger.js
// Utility to debug Firestore collections and document structure

import { db } from '../services/firebase';
import { collection, getDocs, getDoc, doc, query, where, limit } from 'firebase/firestore';

class DatabaseDebugger {
  constructor() {
    this.db = db;
  }

  /**
   * Check if a collection exists and list its documents
   * @param {string} collectionName - Name of the collection to check
   * @param {number} limitCount - Optional limit on the number of documents to return
   * @returns {Promise<{exists: boolean, documents: Array}>} - Collection status and documents
   */
  async checkCollection(collectionName, limitCount = 10) {
    try {
      console.log(`[DEBUG] Checking collection: ${collectionName}`);
      const collectionRef = collection(this.db, collectionName);
      const q = query(collectionRef, limit(limitCount));
      const querySnapshot = await getDocs(q);
      
      const exists = !querySnapshot.empty;
      console.log(`[DEBUG] Collection ${collectionName} exists: ${exists}`);
      
      const documents = [];
      if (exists) {
        querySnapshot.forEach(doc => {
          documents.push({
            id: doc.id,
            ...doc.data()
          });
        });
        console.log(`[DEBUG] Retrieved ${documents.length} documents from ${collectionName}`);
      }
      
      return { exists, documents };
    } catch (error) {
      console.error(`[DEBUG] Error checking collection ${collectionName}:`, error);
      return { exists: false, documents: [], error: error.message };
    }
  }

  /**
   * Check if a family has any chore or reward templates
   * @param {string} familyId - Family ID to check
   * @returns {Promise<{chores: Array, rewards: Array}>} - Templates for the family
   */
  async checkFamilyTemplates(familyId) {
    try {
      console.log(`[DEBUG] Checking templates for family: ${familyId}`);
      
      // Check chore templates
      const choreTemplatesRef = collection(this.db, 'choreTemplates');
      const choreQuery = query(choreTemplatesRef, where('familyId', '==', familyId));
      const choreSnapshot = await getDocs(choreQuery);
      
      const chores = [];
      choreSnapshot.forEach(doc => {
        chores.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`[DEBUG] Found ${chores.length} chore templates for family ${familyId}`);
      
      // Check reward templates
      const rewardTemplatesRef = collection(this.db, 'rewardTemplates');
      const rewardQuery = query(rewardTemplatesRef, where('familyId', '==', familyId));
      const rewardSnapshot = await getDocs(rewardQuery);
      
      const rewards = [];
      rewardSnapshot.forEach(doc => {
        rewards.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log(`[DEBUG] Found ${rewards.length} reward templates for family ${familyId}`);
      
      return { chores, rewards };
    } catch (error) {
      console.error(`[DEBUG] Error checking family templates for ${familyId}:`, error);
      return { chores: [], rewards: [], error: error.message };
    }
  }

  /**
   * Check if a document exists in a collection
   * @param {string} collectionName - Collection name
   * @param {string} documentId - Document ID
   * @returns {Promise<{exists: boolean, data: Object}>} - Document status and data
   */
  async checkDocument(collectionName, documentId) {
    try {
      console.log(`[DEBUG] Checking document: ${collectionName}/${documentId}`);
      const docRef = doc(this.db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      const exists = docSnap.exists();
      console.log(`[DEBUG] Document ${collectionName}/${documentId} exists: ${exists}`);
      
      const data = exists ? docSnap.data() : null;
      
      return { exists, data };
    } catch (error) {
      console.error(`[DEBUG] Error checking document ${collectionName}/${documentId}:`, error);
      return { exists: false, data: null, error: error.message };
    }
  }
}

export default new DatabaseDebugger();