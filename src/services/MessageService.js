/**
 * MessageService - Handles threaded messaging system for family communication
 * Provides Slack-like threading, mentions, and real-time updates
 */

import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc,
  getDocs,
  query, 
  where, 
  orderBy,
  limit, 
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import NotificationService from './NotificationService';

class MessageService {
  constructor() {
    this.messagesCollection = 'chatMessages';
    this.threadsCollection = 'messageThreads';
    this.listeners = new Map();
  }

  /**
   * Send a new message (root or reply)
   * @param {Object} messageData - Message content and metadata
   * @param {string} messageData.content - Message text
   * @param {string} messageData.userId - Sender ID
   * @param {string} messageData.userName - Sender name
   * @param {string} messageData.familyId - Family ID
   * @param {string} messageData.threadId - Thread ID (for replies)
   * @param {string} messageData.parentMessageId - Parent message ID (for replies)
   * @param {Array} messageData.mentions - Array of mentioned user IDs
   * @param {Array} messageData.attachments - File attachments
   */
  async sendMessage(messageData) {
    try {
      const messageId = doc(collection(db, this.messagesCollection)).id;
      
      // Parse mentions from content
      const mentions = this.extractMentions(messageData.content);
      
      const message = {
        id: messageId,
        content: messageData.content,
        userId: messageData.userId,
        userName: messageData.userName,
        userAvatar: messageData.userAvatar || null,
        userImage: messageData.userImage || messageData.userAvatar || null, // ChatMessage expects userImage
        familyId: messageData.familyId,
        timestamp: serverTimestamp(),
        
        // Threading
        threadId: messageData.threadId || messageId, // If root, threadId = messageId
        parentMessageId: messageData.parentMessageId || null,
        replyCount: 0,
        lastReplyAt: null,
        
        // Mentions
        mentions: mentions.userIds || [],
        mentionedUsers: mentions.users || [],
        
        // Metadata
        read: [messageData.userId], // Sender has read their own message
        reactions: {},
        edited: false,
        editedAt: null,
        isFromAllie: messageData.isFromAllie || false,
        aiContext: messageData.aiContext || null,
        attachments: messageData.attachments || [],
        
        // Priority for dashboard
        priority: this.calculatePriority(messageData.content, mentions.userIds),
        requiresAction: this.checkIfRequiresAction(messageData.content)
      };

      // Save message
      await setDoc(doc(db, this.messagesCollection, messageId), message);

      // If this is a reply, update parent message reply count
      if (messageData.parentMessageId) {
        await this.updateThreadMetadata(messageData.threadId, messageId);
      }

      // Create notifications for mentions
      if (mentions.userIds.length > 0) {
        await this.createMentionNotifications(messageId, mentions.userIds, messageData);
      }

      return { success: true, messageId, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extract @ mentions from message content
   */
  extractMentions(content) {
    const mentionRegex = /@(\w+)/g;
    const matches = content.match(mentionRegex) || [];
    
    const userIds = [];
    const users = [];
    
    matches.forEach(match => {
      const username = match.substring(1);
      // TODO: Look up actual user IDs from family members
      // For now, using username as ID
      userIds.push(username.toLowerCase());
      users.push({
        id: username.toLowerCase(),
        name: username,
        notified: false
      });
    });
    
    return { userIds, users };
  }

  /**
   * Calculate message priority for dashboard display
   */
  calculatePriority(content, mentions) {
    let priority = 'normal';
    
    // High priority keywords
    const urgentKeywords = ['urgent', 'asap', 'emergency', 'now', 'immediately', 'help'];
    const importantKeywords = ['important', 'need', 'must', 'today', 'pickup', 'doctor'];
    
    const lowerContent = content.toLowerCase();
    
    if (urgentKeywords.some(keyword => lowerContent.includes(keyword))) {
      priority = 'urgent';
    } else if (importantKeywords.some(keyword => lowerContent.includes(keyword))) {
      priority = 'high';
    } else if (mentions.length > 0) {
      priority = 'medium';
    }
    
    return priority;
  }

  /**
   * Check if message requires action
   */
  checkIfRequiresAction(content) {
    const actionPhrases = [
      'can you', 'could you', 'will you', 'would you',
      'please', 'need to', 'have to', 'pick up',
      'drop off', 'buy', 'get', 'remember to',
      '?'
    ];
    
    const lowerContent = content.toLowerCase();
    return actionPhrases.some(phrase => lowerContent.includes(phrase));
  }

  /**
   * Update thread metadata when a reply is added
   */
  async updateThreadMetadata(threadId, newMessageId) {
    try {
      const threadRef = doc(db, this.messagesCollection, threadId);
      await updateDoc(threadRef, {
        replyCount: increment(1),
        lastReplyAt: serverTimestamp(),
        lastReplyId: newMessageId
      });
    } catch (error) {
      console.error('Error updating thread metadata:', error);
    }
  }

  /**
   * Get messages for dashboard display
   */
  async getMessagesForDashboard(familyId, userId, maxResults = 4) {
    try {
      // Simplified query - just get recent messages for the family
      const q = query(
        collection(db, this.messagesCollection),
        where('familyId', '==', familyId),
        orderBy('timestamp', 'desc'),
        limit(20) // Get more messages to filter from
      );

      const snapshot = await getDocs(q);
      const messages = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        // Filter for unread messages and dashboard criteria
        const isUnread = !data.read || !data.read.includes(userId);

        // IMPORTANT: Only show messages that are RELEVANT to this specific user
        // Either they are mentioned, OR it's their own message that requires action
        const isRelevantToUser = data.mentions?.includes(userId) || data.userId === userId;

        if (isUnread && isRelevantToUser) {
          messages.push({ id: doc.id, ...data });
        }
      });

      // Return top messages based on maxResults
      return messages.slice(0, maxResults);
    } catch (error) {
      console.error('Error getting dashboard messages:', error);
      return [];
    }
  }

  /**
   * Get thread with all replies
   */
  async getThread(threadId) {
    try {
      const q = query(
        collection(db, this.messagesCollection),
        where('threadId', '==', threadId),
        orderBy('timestamp', 'asc')
      );

      const snapshot = await getDocs(q);
      const messages = [];
      
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });

      // Organize into thread structure
      const rootMessage = messages.find(m => m.parentMessageId === null);
      const replies = messages.filter(m => m.parentMessageId !== null);

      return {
        root: rootMessage,
        replies: replies,
        totalReplies: replies.length
      };
    } catch (error) {
      console.error('Error getting thread:', error);
      return null;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId, userId) {
    try {
      const messageRef = doc(db, this.messagesCollection, messageId);
      await updateDoc(messageRef, {
        read: arrayUnion(userId)
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add reaction to message
   */
  async addReaction(messageId, userId, emoji) {
    try {
      const messageRef = doc(db, this.messagesCollection, messageId);
      const messageDoc = await getDoc(messageRef);
      
      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const reactions = messageDoc.data().reactions || {};
      
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      
      if (!reactions[emoji].includes(userId)) {
        reactions[emoji].push(userId);
      }

      await updateDoc(messageRef, { reactions });
      return { success: true };
    } catch (error) {
      console.error('Error adding reaction:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe to real-time message updates
   */
  subscribeToMessages(familyId, callback) {
    const q = query(
      collection(db, this.messagesCollection),
      where('familyId', '==', familyId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = [];
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      callback(messages);
    });

    // Store listener for cleanup
    this.listeners.set(`messages_${familyId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Subscribe to thread updates
   */
  subscribeToThread(threadId, callback) {
    console.log('MessageService.subscribeToThread called with threadId:', threadId);
    
    if (!threadId) {
      console.error('MessageService.subscribeToThread: threadId is undefined or null');
      callback([]);
      return () => {};
    }
    
    // For backwards compatibility, we need to handle two cases:
    // 1. New messages with threadId field
    // 2. Old messages where the message ID is the threadId (root message)
    
    // First, try to get the root message itself (for old messages without threadId)
    const rootMessageRef = doc(db, this.messagesCollection, threadId);
    
    // Query for messages with this threadId
    const threadQuery = query(
      collection(db, this.messagesCollection),
      where('threadId', '==', threadId),
      orderBy('timestamp', 'asc')
    );

    // Set up listeners for both the root message and thread messages
    let rootMessageUnsubscribe = null;
    let threadUnsubscribe = null;
    const messages = new Map(); // Use Map to avoid duplicates
    
    const sendUpdate = () => {
      const sortedMessages = Array.from(messages.values()).sort((a, b) => {
        const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp);
        const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp);
        return aTime - bTime;
      });
      console.log(`MessageService: Found ${sortedMessages.length} messages in thread ${threadId}`);
      callback(sortedMessages);
    };
    
    // Listen for the root message (for backwards compatibility)
    rootMessageUnsubscribe = onSnapshot(
      rootMessageRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          // Add threadId if it doesn't exist (for old messages)
          const message = { 
            id: doc.id, 
            ...data,
            threadId: data.threadId || doc.id
          };
          messages.set(doc.id, message);
          sendUpdate();
        }
      },
      (error) => {
        console.log('Root message not found or error:', error);
      }
    );
    
    // Listen for thread messages
    threadUnsubscribe = onSnapshot(
      threadQuery,
      (snapshot) => {
        // Add all messages from the query (query already filters by threadId)
        snapshot.forEach(doc => {
          const data = doc.data();
          messages.set(doc.id, { id: doc.id, ...data });
        });

        console.log(`📬 Thread ${threadId}: Loaded ${snapshot.size} messages from query`);
        sendUpdate();
      },
      (error) => {
        console.error('MessageService.subscribeToThread error:', error);
      }
    );

    // Return cleanup function
    const unsubscribe = () => {
      if (rootMessageUnsubscribe) rootMessageUnsubscribe();
      if (threadUnsubscribe) threadUnsubscribe();
    };
    
    this.listeners.set(`thread_${threadId}`, unsubscribe);
    return unsubscribe;
  }

  /**
   * Create notifications for mentioned users
   */
  async createMentionNotifications(messageId, mentionedUserIds, messageData) {
    try {
      console.log('Creating notifications for mentions:', mentionedUserIds);
      
      // Create notifications for each mentioned user
      const notificationPromises = mentionedUserIds.map(async (userId) => {
        // Don't notify the sender about their own mention
        if (userId === messageData.userId) return;
        
        // Special handling for Allie (AI assistant)
        if (userId === 'allie') {
          console.log('Allie was mentioned - AI will handle this');
          return;
        }
        
        // Create notification for the mentioned user
        return NotificationService.createMentionNotification({
          mentionedUserId: userId,
          mentionerName: messageData.userName || 'Someone',
          messageContent: messageData.content,
          threadId: messageData.threadId || messageId,
          familyId: messageData.familyId
        });
      });
      
      await Promise.all(notificationPromises);
      console.log('Mention notifications created successfully');
    } catch (error) {
      console.error('Error creating mention notifications:', error);
    }
  }

  /**
   * Clean up all listeners
   */
  cleanup() {
    this.listeners.forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners.clear();
  }
}

// Export singleton instance
const messageService = new MessageService();
export default messageService;