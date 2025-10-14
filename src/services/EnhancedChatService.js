import { db } from './firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';

class EnhancedChatService {
  constructor() {
    this.collection = 'chatMessages';
  }

  // Get recent chat messages for analysis
  async getRecentMessages(familyId, sinceDate) {
    try {
      const messagesRef = collection(db, this.collection);
      const q = query(
        messagesRef,
        where('familyId', '==', familyId),
        where('timestamp', '>=', Timestamp.fromDate(sinceDate)),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const messages = [];
      
      snapshot.forEach((doc) => {
        messages.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate()
        });
      });
      
      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching recent messages:', error);
      return [];
    }
  }

  // Get conversation history (placeholder for other methods)
  async getConversationHistory(familyId, limit = 50) {
    try {
      const messagesRef = collection(db, this.collection);
      const q = query(
        messagesRef,
        where('familyId', '==', familyId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      const messages = [];
      
      snapshot.forEach((doc) => {
        if (messages.length < limit) {
          messages.push({
            id: doc.id,
            ...doc.data()
          });
        }
      });
      
      return messages.reverse();
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      return [];
    }
  }

  // Set unified event context for chat integration
  setUnifiedEventContext(context) {
    this.unifiedEventContext = context;
    console.log('Enhanced chat service received unified event context');
  }

  // Get unified event context
  getUnifiedEventContext() {
    return this.unifiedEventContext;
  }
}

export default new EnhancedChatService();