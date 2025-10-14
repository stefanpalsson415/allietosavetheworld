// BlogService.js - Blog post data management
// Follows CLAUDE.md service layer patterns

import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * BlogService - Manages blog post data from Firestore
 * Following existing service patterns from CLAUDE.md
 */
class BlogService {
  constructor() {
    this.collection = 'blogPosts';
  }

  /**
   * Fetch all published blog posts
   * @returns {Promise<Array>} Array of blog post objects
   */
  async getAllPosts() {
    try {
      // Try with orderBy first
      const q = query(
        collection(db, this.collection),
        where('published', '==', true),
        orderBy('publishedDate', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching blog posts:', error);

      // If index is missing, try without orderBy
      try {
        console.log('Retrying without orderBy...');
        const fallbackQuery = query(
          collection(db, this.collection),
          where('published', '==', true)
        );

        const snapshot = await getDocs(fallbackQuery);
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort in memory if needed
        return posts.sort((a, b) => {
          const dateA = a.publishedDate?.toDate?.() || new Date(0);
          const dateB = b.publishedDate?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        // Return empty array instead of throwing - gracefully handle no posts
        return [];
      }
    }
  }

  /**
   * Fetch single post by slug
   * @param {string} slug - Post slug
   * @returns {Promise<Object|null>} Post object or null
   */
  async getPostBySlug(slug) {
    try {
      // Try optimized query first
      const q = query(
        collection(db, this.collection),
        where('slug', '==', slug),
        where('published', '==', true)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const postDoc = snapshot.docs[0];
      return {
        id: postDoc.id,
        ...postDoc.data()
      };
    } catch (error) {
      console.error('Error fetching post with compound query:', error);

      // Fallback: Get all published posts and filter by slug
      try {
        console.log('Trying fallback query without compound index...');
        const allPostsQuery = query(
          collection(db, this.collection),
          where('published', '==', true)
        );

        const snapshot = await getDocs(allPostsQuery);
        const matchingPost = snapshot.docs.find(doc => doc.data().slug === slug);

        if (!matchingPost) return null;

        return {
          id: matchingPost.id,
          ...matchingPost.data()
        };
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Fetch posts by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of posts
   */
  async getPostsByCategory(category) {
    try {
      const q = query(
        collection(db, this.collection),
        where('category', '==', category),
        where('published', '==', true),
        orderBy('publishedDate', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching posts by category:', error);
      throw error;
    }
  }

  /**
   * Get featured posts (for homepage)
   * @param {number} limitCount - Number of posts
   * @returns {Promise<Array>} Featured posts
   */
  async getFeaturedPosts(limitCount = 3) {
    try {
      const q = query(
        collection(db, this.collection),
        where('featured', '==', true),
        where('published', '==', true),
        orderBy('publishedDate', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching featured posts:', error);
      throw error;
    }
  }

  /**
   * Get recent posts
   * @param {number} limitCount - Number of posts
   * @returns {Promise<Array>} Recent posts
   */
  async getRecentPosts(limitCount = 6) {
    try {
      const q = query(
        collection(db, this.collection),
        where('published', '==', true),
        orderBy('publishedDate', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      throw error;
    }
  }

  /**
   * Get related posts based on tags/category
   * @param {Object} currentPost - Current post object
   * @param {number} limitCount - Number of related posts
   * @returns {Promise<Array>} Related posts
   */
  async getRelatedPosts(currentPost, limitCount = 3) {
    try {
      // First try to get posts with matching tags
      if (currentPost.tags && currentPost.tags.length > 0) {
        const q = query(
          collection(db, this.collection),
          where('published', '==', true),
          where('tags', 'array-contains-any', currentPost.tags.slice(0, 10)),
          orderBy('publishedDate', 'desc'),
          limit(limitCount + 1) // +1 to exclude current post
        );

        const snapshot = await getDocs(q);
        const posts = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(post => post.id !== currentPost.id)
          .slice(0, limitCount);

        if (posts.length >= limitCount) {
          return posts;
        }
      }

      // Fallback to same category
      if (currentPost.category) {
        const q = query(
          collection(db, this.collection),
          where('published', '==', true),
          where('category', '==', currentPost.category),
          orderBy('publishedDate', 'desc'),
          limit(limitCount + 1)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(post => post.id !== currentPost.id)
          .slice(0, limitCount);
      }

      // Final fallback to recent posts
      return this.getRecentPosts(limitCount);
    } catch (error) {
      console.error('Error fetching related posts:', error);
      return this.getRecentPosts(limitCount);
    }
  }

  /**
   * Increment view count for a post
   * @param {string} postId - Post document ID
   */
  async incrementViewCount(postId) {
    try {
      // Note: This would require a Cloud Function for atomic increment
      // For now, we'll skip this to keep the implementation simple
      // Can add later with Firebase Functions increment operation
      console.log(`View counted for post: ${postId}`);
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  }
}

export default new BlogService();
