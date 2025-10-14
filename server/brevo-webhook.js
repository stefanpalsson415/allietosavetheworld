// server/brevo-webhook.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { db } = require('../src/services/firebase');
const { collection, addDoc, updateDoc, doc, query, where, getDocs } = require('firebase/firestore');

const router = express.Router();

// Middleware
router.use(cors());
router.use(bodyParser.json());

/**
 * Brevo Email Webhook Handler
 * 
 * Handles webhook events from Brevo for email delivery events:
 * - delivered: Email was successfully delivered
 * - hardBounce: Permanent delivery failure
 * - softBounce: Temporary delivery failure
 * - blocked: Email was blocked
 * - spam: Email was marked as spam
 * - opened: Email was opened by recipient
 * - clicked: Link in email was clicked
 */
router.post('/email', async (req, res) => {
  try {
    console.log('Brevo email webhook received:', { 
      event: req.body.event,
      email: req.body.email
    });
    
    // Validate webhook data
    if (!req.body.event || !req.body.email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid webhook data' 
      });
    }
    
    // Extract relevant data from webhook
    const {
      event,
      email,
      messageId,
      templateId,
      timestamp,
      reason
    } = req.body;
    
    // Record the event in Firestore
    await addDoc(collection(db, "emailEvents"), {
      event,
      email,
      messageId,
      templateId,
      timestamp: new Date(timestamp * 1000),
      reason: reason || '',
      createdAt: new Date()
    });
    
    // Handle specific events
    if (event === 'hardBounce' || event === 'blocked' || event === 'spam') {
      // Find users with the bounced email
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      // Update each user's profile to mark email as invalid
      querySnapshot.forEach(async (document) => {
        await updateDoc(doc(db, "users", document.id), {
          emailValid: false,
          emailInvalidReason: reason || event,
          emailInvalidAt: new Date()
        });
        
        console.log(`Marked email as invalid for user ${document.id}`);
      });
    }
    
    // Return successful response
    res.status(200).json({ 
      success: true, 
      message: 'Email event processed successfully' 
    });
  } catch (error) {
    console.error('Error handling Brevo email webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

/**
 * Brevo SMS Webhook Handler
 * 
 * Handles webhook events from Brevo for SMS delivery events:
 * - delivered: SMS was successfully delivered
 * - hardBounce: Permanent delivery failure
 * - softBounce: Temporary delivery failure
 * - blocked: SMS was blocked
 * - rejected: SMS was rejected by carrier
 */
router.post('/sms', async (req, res) => {
  try {
    console.log('Brevo SMS webhook received:', { 
      event: req.body.event,
      to: req.body.to
    });
    
    // Validate webhook data
    if (!req.body.event || !req.body.to) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid webhook data' 
      });
    }
    
    // Extract relevant data from webhook
    const {
      event,
      to,
      messageId,
      timestamp,
      reason
    } = req.body;
    
    // Record the event in Firestore
    await addDoc(collection(db, "smsEvents"), {
      event,
      phoneNumber: to,
      messageId,
      timestamp: new Date(timestamp * 1000),
      reason: reason || '',
      createdAt: new Date()
    });
    
    // Handle specific events
    if (event === 'hardBounce' || event === 'rejected') {
      // Find users with the bounced phone number
      const usersQuery = query(
        collection(db, "users"),
        where("phoneNumber", "==", to)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      
      // Update each user's profile to mark phone as invalid
      querySnapshot.forEach(async (document) => {
        await updateDoc(doc(db, "users", document.id), {
          phoneValid: false,
          phoneInvalidReason: reason || event,
          phoneInvalidAt: new Date()
        });
        
        console.log(`Marked phone as invalid for user ${document.id}`);
      });
    }
    
    // Return successful response
    res.status(200).json({ 
      success: true, 
      message: 'SMS event processed successfully' 
    });
  } catch (error) {
    console.error('Error handling Brevo SMS webhook:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

module.exports = router;