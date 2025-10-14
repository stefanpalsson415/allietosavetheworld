import { collection, doc, setDoc, updateDoc, query, where, getDocs, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

class NotificationService {
  constructor() {
    this.notificationsCollection = 'notifications';
    this.notificationPermission = null;
    this.checkPermission();
  }

  // Check and request notification permission
  async checkPermission() {
    // Check if Notification API exists
    if (typeof Notification === 'undefined' || !("Notification" in window)) {
      console.log("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      this.notificationPermission = "granted";
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      this.notificationPermission = permission;
      return permission === "granted";
    }

    return false;
  }

  // Create a notification for @ mentions
  async createMentionNotification(mentionData) {
    const { 
      mentionedUserId, 
      mentionerName, 
      messageContent, 
      threadId, 
      familyId 
    } = mentionData;

    try {
      // Save notification to Firestore
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notification = {
        id: notificationId,
        type: 'mention',
        userId: mentionedUserId,
        familyId: familyId,
        title: `${mentionerName} mentioned you`,
        body: messageContent.substring(0, 100) + (messageContent.length > 100 ? '...' : ''),
        threadId: threadId,
        read: false,
        createdAt: serverTimestamp(),
        data: {
          mentionerName,
          messageContent,
          threadId
        }
      };

      await setDoc(doc(db, this.notificationsCollection, notificationId), notification);

      // Show browser notification if permitted
      if (this.notificationPermission === "granted") {
        this.showBrowserNotification(
          `${mentionerName} mentioned you`,
          messageContent.substring(0, 100),
          threadId
        );
      }

      // Play notification sound
      this.playNotificationSound();

      return { success: true, notificationId };
    } catch (error) {
      console.error('Error creating mention notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Create a notification for new messages in important threads
  async createMessageNotification(messageData) {
    const { 
      senderId,
      senderName, 
      messageContent, 
      threadId, 
      familyId,
      recipientId
    } = messageData;

    try {
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const notification = {
        id: notificationId,
        type: 'message',
        userId: recipientId,
        familyId: familyId,
        title: `New message from ${senderName}`,
        body: messageContent.substring(0, 100) + (messageContent.length > 100 ? '...' : ''),
        threadId: threadId,
        read: false,
        createdAt: serverTimestamp(),
        data: {
          senderId,
          senderName,
          messageContent,
          threadId
        }
      };

      await setDoc(doc(db, this.notificationsCollection, notificationId), notification);

      // Show browser notification if permitted
      if (this.notificationPermission === "granted") {
        this.showBrowserNotification(
          `New message from ${senderName}`,
          messageContent.substring(0, 100),
          threadId
        );
      }

      return { success: true, notificationId };
    } catch (error) {
      console.error('Error creating message notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Show browser notification
  showBrowserNotification(title, body, threadId) {
    // Check if Notification API exists
    if (typeof Notification === 'undefined') {
      console.log('Notification API not available on this device');
      return;
    }

    if (this.notificationPermission !== "granted") return;

    const notification = new Notification(title, {
      body: body,
      icon: '/allie-favicon.svg',
      badge: '/allie-favicon.svg',
      tag: threadId, // Prevents duplicate notifications for same thread
      requireInteraction: false,
      silent: false
    });

    // Handle notification click
    notification.onclick = () => {
      window.focus();
      // Navigate to the thread
      window.dispatchEvent(new CustomEvent('open-thread', { 
        detail: { threadId } 
      }));
      notification.close();
    };

    // Auto-close after 5 seconds
    setTimeout(() => notification.close(), 5000);
  }

  // Play notification sound
  playNotificationSound() {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Notification sound not available');
    }
  }

  // Get unread notifications for a user
  async getUnreadNotifications(userId, familyId) {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userId),
        where('familyId', '==', familyId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const notifications = [];
      
      snapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() });
      });

      return notifications.sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      await updateDoc(doc(db, this.notificationsCollection, notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId, familyId) {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userId),
        where('familyId', '==', familyId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const updates = [];

      snapshot.forEach(doc => {
        updates.push(
          updateDoc(doc.ref, {
            read: true,
            readAt: serverTimestamp()
          })
        );
      });

      await Promise.all(updates);
      return { success: true, count: updates.length };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  }

  // Subscribe to notifications for real-time updates
  subscribeToNotifications(userId, familyId, callback) {
    const q = query(
      collection(db, this.notificationsCollection),
      where('userId', '==', userId),
      where('familyId', '==', familyId),
      where('read', '==', false)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = [];
      snapshot.forEach(doc => {
        notifications.push({ id: doc.id, ...doc.data() });
      });
      
      // Sort by newest first
      notifications.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      callback(notifications);
    });
  }

  // Clear old notifications (cleanup utility)
  async clearOldNotifications(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const q = query(
        collection(db, this.notificationsCollection),
        where('createdAt', '<', cutoffDate)
      );

      const snapshot = await getDocs(q);
      const deletions = [];

      snapshot.forEach(doc => {
        deletions.push(doc.ref.delete());
      });

      await Promise.all(deletions);
      return { success: true, count: deletions.length };
    } catch (error) {
      console.error('Error clearing old notifications:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new NotificationService();