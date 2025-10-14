// BlogCommentService.js - Handles blog post comments similar to Google Docs
// Allows logged-in users to comment on specific text selections

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';

class BlogCommentService {
  constructor() {
    this.collection = 'blogComments';
  }

  /**
   * Add a comment on selected text
   * @param {Object} commentData - Comment details
   * @returns {Promise<Object>} Created comment
   */
  async addComment(commentData) {
    try {
      const {
        blogPostId,
        selectedText,
        textStart,
        textEnd,
        userId,
        userName,
        userEmail,
        commentText
      } = commentData;

      const comment = {
        blogPostId,
        selectedText: selectedText.substring(0, 200), // Limit to 200 chars for display
        textStart,
        textEnd,
        userId,
        userName,
        userEmail,
        commentText,
        replies: [],
        resolved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, this.collection), comment);

      return {
        id: docRef.id,
        ...comment,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Add a reply to an existing comment
   * @param {string} commentId - Parent comment ID
   * @param {Object} replyData - Reply details
   * @returns {Promise<void>}
   */
  async addReply(commentId, replyData) {
    try {
      const { userId, userName, userEmail, replyText } = replyData;

      const reply = {
        userId,
        userName,
        userEmail,
        replyText,
        createdAt: new Date()
      };

      const commentRef = doc(db, this.collection, commentId);
      await updateDoc(commentRef, {
        replies: arrayUnion(reply),
        updatedAt: serverTimestamp()
      });

      return reply;
    } catch (error) {
      console.error('Error adding reply:', error);
      throw error;
    }
  }

  /**
   * Get all comments for a blog post
   * @param {string} blogPostId - Blog post ID
   * @returns {Promise<Array>} Array of comments
   */
  async getComments(blogPostId) {
    try {
      const q = query(
        collection(db, this.collection),
        where('blogPostId', '==', blogPostId),
        where('resolved', '==', false),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
      // If index is missing, try without orderBy
      try {
        const fallbackQuery = query(
          collection(db, this.collection),
          where('blogPostId', '==', blogPostId),
          where('resolved', '==', false)
        );

        const snapshot = await getDocs(fallbackQuery);
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort in memory
        return comments.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Resolve a comment (mark as done)
   * @param {string} commentId - Comment ID
   * @returns {Promise<void>}
   */
  async resolveComment(commentId) {
    try {
      const commentRef = doc(db, this.collection, commentId);
      await updateDoc(commentRef, {
        resolved: true,
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error resolving comment:', error);
      throw error;
    }
  }

  /**
   * Delete a comment (only by author)
   * @param {string} commentId - Comment ID
   * @param {string} userId - User ID attempting to delete
   * @returns {Promise<void>}
   */
  async deleteComment(commentId, userId) {
    try {
      // In a real implementation, you'd check if userId matches the comment author
      // For now, we'll just mark as resolved
      await this.resolveComment(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }
}

export default new BlogCommentService();
