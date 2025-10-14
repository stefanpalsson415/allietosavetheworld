// Complete backend server for Parentload
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const axios = require('axios');

// Import our services (we'll make simplified versions for now)
const emailService = require('./sendgrid-email-service');

const app = express();

// Enable CORS for local development
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Parse JSON requests
app.use(express.json());

// Store OTPs temporarily (use Redis in production)
const otpStore = new Map();

// ========== AUTH ROUTES ==========

// Send OTP
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { email, userName } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration
    otpStore.set(email, {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
      attempts: 0
    });
    
    // Send email
    await emailService.sendOTPEmail(email, otp, userName);
    
    res.json({ 
      success: true, 
      message: 'Verification code sent!',
      // Only in development
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ 
      error: 'Failed to send verification code',
      details: error.message 
    });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }
    
    const stored = otpStore.get(email);
    
    if (!stored) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }
    
    // Check expiration
    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'Verification code expired' });
    }
    
    // Check attempts
    stored.attempts++;
    if (stored.attempts > 3) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'Too many attempts. Please request a new code.' });
    }
    
    // Verify OTP
    if (stored.code !== otp) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Success - delete OTP
    otpStore.delete(email);
    
    res.json({ 
      success: true,
      message: 'Email verified successfully!'
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// ========== TWILIO ROUTES ==========

// Twilio webhook for incoming SMS
app.post('/api/twilio/incoming-sms', async (req, res) => {
  try {
    const { From, To, Body, NumMedia, MediaUrl0 } = req.body;
    
    console.log('Incoming SMS:', { From, To, Body, NumMedia });
    
    // For now, just acknowledge
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  } catch (error) {
    console.error('Error handling incoming SMS:', error);
    res.status(500).send('Error processing message');
  }
});

// Send SMS verification
app.post('/api/twilio/send-verification', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    // Generate code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // TODO: Actually send SMS with Twilio
    console.log(`Would send SMS to ${phoneNumber} with code: ${code}`);
    
    res.json({ 
      success: true, 
      message: 'Verification code sent',
      // Only in dev
      ...(process.env.NODE_ENV === 'development' && { code })
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Failed to send SMS' });
  }
});

// ========== SENDGRID ROUTES ==========

// SendGrid webhook for incoming emails
app.post('/api/sendgrid/incoming-email', async (req, res) => {
  try {
    console.log('Incoming email received');
    // Process email here
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing email:', error);
    res.status(200).send('OK'); // Always return 200 to SendGrid
  }
});

// ========== CLAUDE PROXY ==========

app.use('/api/claude', async (req, res) => {
  const claudeApiUrl = `https://europe-west1-parentload-ba995.cloudfunctions.net/claude`;
  
  try {
    console.log(`Proxying request to Claude API: ${req.method} ${claudeApiUrl}`);
    
    if (req.path === '/test') {
      return res.json({ success: true, message: "Claude API proxy is working" });
    }
    
    const response = await axios({
      method: req.method,
      url: claudeApiUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
      }
    });
    
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error proxying to Claude API:', error.message);
    return res.status(500).json({ 
      error: 'Error connecting to Claude API',
      details: error.message
    });
  }
});

// ========== TEST ENDPOINTS ==========

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running!',
    env: {
      twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      sendgridConfigured: !!process.env.SENDGRID_API_KEY,
      port: process.env.PORT || 3001
    }
  });
});

app.post('/api/twilio/test', (req, res) => {
  const twilioConfigured = process.env.TWILIO_ACCOUNT_SID && 
                          process.env.TWILIO_AUTH_TOKEN && 
                          process.env.TWILIO_PHONE_NUMBER;
  
  res.json({
    success: twilioConfigured,
    message: twilioConfigured ? 'Twilio is configured' : 'Twilio configuration missing',
    config: {
      hasSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhone: !!process.env.TWILIO_PHONE_NUMBER
    }
  });
});

app.post('/api/sendgrid/test', (req, res) => {
  const sendgridConfigured = process.env.SENDGRID_API_KEY && 
                            process.env.SENDGRID_FROM_EMAIL;
  
  res.json({
    success: sendgridConfigured,
    message: sendgridConfigured ? 'SendGrid is configured' : 'SendGrid configuration missing',
    config: {
      hasApiKey: !!process.env.SENDGRID_API_KEY,
      hasFromEmail: !!process.env.SENDGRID_FROM_EMAIL
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('🚀 Parentload Backend Server Started');
  console.log(`📍 Port: ${PORT}`);
  console.log(`📧 SendGrid: ${process.env.SENDGRID_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📱 Twilio: ${process.env.TWILIO_ACCOUNT_SID ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log('');
  console.log('Test endpoints:');
  console.log(`  GET  ${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/test`);
  console.log(`  POST ${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/send-otp`);
});