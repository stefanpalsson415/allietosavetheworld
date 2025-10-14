/**
 * Lead Management Service
 *
 * Purpose: Handle marketing leads from blog subscriptions and quiz completions
 * Separate from full user accounts to maintain clean data architecture
 *
 * Collections:
 * - leads/{leadId} - Marketing leads (blog subscribers, quiz takers)
 *
 * Integration points:
 * - Blog subscribe forms
 * - Quiz completion screens
 * - User signup (mark lead as converted)
 *
 * Created: October 10, 2025
 */

import { db } from './firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

class LeadService {

  /**
   * Create a new lead from blog subscribe
   *
   * @param {Object} data - Lead data
   * @param {string} data.email - Email address (required)
   * @param {string} data.name - Name (optional)
   * @param {string} data.blogPostId - Blog post they subscribed from (optional)
   * @param {Array<string>} data.interests - Topics of interest (optional)
   * @returns {Promise<{success: boolean, leadId?: string, error?: string}>}
   */
  async createBlogSubscriber({ email, name = null, blogPostId = null, interests = [] }) {
    try {
      // Check if email already exists
      const existing = await this.getLeadByEmail(email);
      if (existing) {
        // Update last activity
        await updateDoc(doc(db, 'leads', existing.leadId), {
          lastActivity: serverTimestamp(),
          metadata: {
            ...existing.metadata,
            blogPostIds: [...new Set([...(existing.metadata.blogPostIds || []), blogPostId])].filter(Boolean)
          }
        });

        return {
          success: true,
          leadId: existing.leadId,
          alreadyExists: true
        };
      }

      // Create new lead
      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const leadData = {
        leadId,
        email,
        name: name || null,
        source: 'blog_subscribe',
        status: 'subscribed',
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        emailConsent: true,
        metadata: {
          blogPostId,
          blogPostIds: blogPostId ? [blogPostId] : [],
          interests: interests || [],
          subscriptionSource: 'blog_widget'
        },
        tags: ['blog-reader'],
        convertedToUserId: null,
        convertedAt: null
      };

      await setDoc(doc(db, 'leads', leadId), leadData);

      console.log('✅ Blog subscriber lead created:', leadId);

      return {
        success: true,
        leadId
      };

    } catch (error) {
      console.error('❌ Error creating blog subscriber:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create a new lead from quiz completion
   *
   * @param {Object} data - Lead data
   * @param {string} data.email - Email address (required)
   * @param {string} data.name - Name (required for quiz)
   * @param {Object} data.quizResults - Quiz answers and results (required)
   * @param {Array<string>} data.interests - Topics from quiz (optional)
   * @returns {Promise<{success: boolean, leadId?: string, error?: string}>}
   */
  async createQuizLead({ email, name, quizResults, interests = [] }) {
    try {
      // Check if email already exists
      const existing = await this.getLeadByEmail(email);
      if (existing) {
        // Update with quiz results
        await updateDoc(doc(db, 'leads', existing.leadId), {
          lastActivity: serverTimestamp(),
          metadata: {
            ...existing.metadata,
            quizResults: {
              ...(existing.metadata.quizResults || {}),
              ...quizResults
            },
            quizCompletedAt: new Date().toISOString()
          },
          tags: [...new Set([...(existing.tags || []), 'quiz-taker'])]
        });

        return {
          success: true,
          leadId: existing.leadId,
          alreadyExists: true
        };
      }

      // Create new lead
      const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const leadData = {
        leadId,
        email,
        name,
        source: 'quiz_complete',
        status: 'subscribed',
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        emailConsent: true,
        metadata: {
          quizResults,
          quizCompletedAt: new Date().toISOString(),
          interests: interests || [],
          quizType: quizResults.quizType || 'family_balance'
        },
        tags: ['quiz-taker'],
        convertedToUserId: null,
        convertedAt: null
      };

      await setDoc(doc(db, 'leads', leadId), leadData);

      console.log('✅ Quiz lead created:', leadId);

      return {
        success: true,
        leadId
      };

    } catch (error) {
      console.error('❌ Error creating quiz lead:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get lead by email address
   *
   * @param {string} email - Email to search for
   * @returns {Promise<Object|null>} Lead data or null if not found
   */
  async getLeadByEmail(email) {
    try {
      const q = query(
        collection(db, 'leads'),
        where('email', '==', email.toLowerCase().trim()),
        limit(1)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data();

    } catch (error) {
      console.error('❌ Error getting lead by email:', error);
      return null;
    }
  }

  /**
   * Mark a lead as converted to full user
   *
   * @param {string} email - Lead email
   * @param {string} userId - Firebase Auth UID of new user
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async markLeadConverted(email, userId) {
    try {
      const lead = await this.getLeadByEmail(email);

      if (!lead) {
        console.log('ℹ️  No lead found for email:', email);
        return { success: true, message: 'No lead to convert' };
      }

      await updateDoc(doc(db, 'leads', lead.leadId), {
        status: 'converted',
        convertedToUserId: userId,
        convertedAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });

      console.log('✅ Lead marked as converted:', lead.leadId, '→', userId);

      return {
        success: true,
        leadId: lead.leadId
      };

    } catch (error) {
      console.error('❌ Error marking lead as converted:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Unsubscribe a lead
   *
   * @param {string} email - Email to unsubscribe
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async unsubscribeLead(email) {
    try {
      const lead = await this.getLeadByEmail(email);

      if (!lead) {
        return {
          success: false,
          error: 'Email not found in leads'
        };
      }

      await updateDoc(doc(db, 'leads', lead.leadId), {
        status: 'unsubscribed',
        emailConsent: false,
        unsubscribedAt: serverTimestamp(),
        lastActivity: serverTimestamp()
      });

      console.log('✅ Lead unsubscribed:', lead.leadId);

      return {
        success: true,
        leadId: lead.leadId
      };

    } catch (error) {
      console.error('❌ Error unsubscribing lead:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get all leads (admin only)
   *
   * @param {Object} filters - Filter options
   * @param {string} filters.source - Filter by source ('blog_subscribe', 'quiz_complete')
   * @param {string} filters.status - Filter by status ('subscribed', 'converted', 'unsubscribed')
   * @param {number} filters.maxResults - Max number of results (default 100)
   * @returns {Promise<Array<Object>>}
   */
  async getLeads({ source = null, status = null, maxResults = 100 } = {}) {
    try {
      let q = query(collection(db, 'leads'));

      if (source) {
        q = query(q, where('source', '==', source));
      }

      if (status) {
        q = query(q, where('status', '==', status));
      }

      q = query(q, orderBy('createdAt', 'desc'), limit(maxResults));

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => doc.data());

    } catch (error) {
      console.error('❌ Error getting leads:', error);
      return [];
    }
  }

  /**
   * Get lead statistics
   *
   * @returns {Promise<Object>} Lead statistics
   */
  async getLeadStats() {
    try {
      const allLeads = await getDocs(collection(db, 'leads'));

      const stats = {
        total: allLeads.size,
        bySource: {
          blog_subscribe: 0,
          quiz_complete: 0,
          other: 0
        },
        byStatus: {
          subscribed: 0,
          converted: 0,
          unsubscribed: 0
        },
        conversionRate: 0
      };

      allLeads.forEach(doc => {
        const data = doc.data();

        // Count by source
        if (data.source === 'blog_subscribe') {
          stats.bySource.blog_subscribe++;
        } else if (data.source === 'quiz_complete') {
          stats.bySource.quiz_complete++;
        } else {
          stats.bySource.other++;
        }

        // Count by status
        if (data.status === 'subscribed') {
          stats.byStatus.subscribed++;
        } else if (data.status === 'converted') {
          stats.byStatus.converted++;
        } else if (data.status === 'unsubscribed') {
          stats.byStatus.unsubscribed++;
        }
      });

      // Calculate conversion rate
      if (stats.total > 0) {
        stats.conversionRate = ((stats.byStatus.converted / stats.total) * 100).toFixed(2);
      }

      return stats;

    } catch (error) {
      console.error('❌ Error getting lead stats:', error);
      return null;
    }
  }
}

// Export singleton instance
const leadService = new LeadService();
export default leadService;
