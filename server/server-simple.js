// Simple working backend server for Parentload
const express = require('express');
require('dotenv').config();
const cors = require('cors');
const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const sendGridEmailService = require('./sendgrid-email-service');
const familyEmailRouter = require('./family-email-service');
const inboundEmailRouter = require('./inbound-email-webhook-simple');
const inboundSMSRouter = require('./ultra-simple-sms-webhook');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Check if Twilio is configured
const twilioConfigured = process.env.TWILIO_ACCOUNT_SID && 
                        process.env.TWILIO_AUTH_TOKEN && 
                        process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio if configured
let twilioRouter = null;
if (twilioConfigured) {
  try {
    twilioRouter = require('./twilio-service');
    console.log('✅ Twilio service loaded');
  } catch (error) {
    console.log('❌ Failed to load Twilio service:', error.message);
  }
}

const app = express();

// Enable CORS for multiple origins
const allowedOrigins = [
  'https://parentload-ba995.web.app',
  'https://checkallie.com',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Parse JSON requests with increased limit for image processing
app.use(express.json({ limit: '50mb' }));
// Parse URL-encoded requests (for SendGrid webhooks)
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Store OTPs temporarily (use Redis in production)
const otpStore = new Map();

// Mount routers
app.use(familyEmailRouter);
app.use(inboundEmailRouter);
app.use(inboundSMSRouter);

// Mount Twilio router if configured
if (twilioRouter) {
  app.use('/api/twilio', twilioRouter);
  console.log('📱 Twilio routes mounted at /api/twilio');
}

// ========== SALES CHAT ENDPOINT ==========
// Public endpoint for sales chat - no auth required
app.post('/api/claude/sales', async (req, res) => {
  // Apply CORS for sales endpoint
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  const claudeApiUrl = 'https://api.anthropic.com/v1/messages';
  
  try {
    console.log('Sales chat request from origin:', origin);
    
    // Use dedicated sales API key from environment
    const salesApiKey = process.env.ANTHROPIC_SALES_API_KEY;
    
    if (!salesApiKey) {
      return res.status(500).json({ 
        error: 'Sales API key not configured',
        details: 'Please configure ANTHROPIC_SALES_API_KEY environment variable' 
      });
    }
    
    console.log('Sales chat API call:', {
      timestamp: new Date().toISOString(),
      origin: origin,
      messageCount: req.body.messages?.length || 0
    });
    
    const response = await axios.post(claudeApiUrl, req.body, {
      headers: {
        'x-api-key': salesApiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error('Sales Claude API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal server error',
      message: 'Failed to process sales chat request'
    });
  }
});

// Handle OPTIONS for sales endpoint (CORS preflight)
app.options('/api/claude/sales', (req, res) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// ========== HELPER FUNCTIONS ==========

// Deprecated - use sendGridEmailService.sendOTPEmail instead
async function sendOTPEmail(email, otp, userName = '') {
  // Now using the new SendGrid email service with better template
  return await sendGridEmailService.sendOTPEmail(email, otp, userName);
}

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
    
    // Send email using the new SendGrid service with proper template
    await sendGridEmailService.sendOTPEmail(email, otp, userName || 'there');
    
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

// Resend OTP
app.post('/api/auth/resend-otp', async (req, res) => {
  try {
    const { email, userName } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Check if we need to rate limit
    const existing = otpStore.get(email);
    if (existing && (Date.now() - (existing.expires - 5 * 60 * 1000)) < 30000) {
      return res.status(429).json({ 
        error: 'Please wait 30 seconds before requesting a new code' 
      });
    }
    
    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store new OTP
    otpStore.set(email, {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000,
      attempts: 0
    });
    
    // Send email using the new SendGrid service with proper template
    await sendGridEmailService.sendOTPEmail(email, otp, userName || 'there');
    
    res.json({ 
      success: true, 
      message: 'New verification code sent!'
    });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

// ========== CLAUDE API ENDPOINT ==========

app.post('/api/claude', async (req, res) => {
  try {
    console.log('Received request to Claude API endpoint');
    
    // Get API key from environment variables or request header (prefer ANTHROPIC_API_KEY for Cloud Run)
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.REACT_APP_CLAUDE_API_KEY || req.headers['x-api-key'];
    
    // Check if API key is provided
    if (!apiKey) {
      console.log('No API key found in environment variables, returning error');
      console.error('ERROR: Please add your Claude API key to the .env file as REACT_APP_CLAUDE_API_KEY');
      return res.json({
        content: [{ text: "CONFIGURATION ERROR: No Claude API key found in .env file. Please add your API key to the .env file as REACT_APP_CLAUDE_API_KEY=your_key_here and restart the server." }]
      });
    }
    
    console.log('Making API call to Claude with API key from .env file');
    
    // Log the request body for debugging
    console.log('Request body structure:', JSON.stringify(req.body).substring(0, 200) + '...');
    
    // Check if request contains vision content
    const hasVision = req.body.messages?.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(block => block.type === 'image')
    );
    
    if (hasVision) {
      console.log('📸 Vision request detected - processing image with Claude');
    }
    
    // Make the API call with updated headers and endpoint
    const response = await axios.post('https://api.anthropic.com/v1/messages', req.body, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });
    
    // Log success response
    console.log('Claude API response received successfully. Status:', response.status);
    res.json(response.data);
  } catch (error) {
    console.error('Error in Claude API:', error.message);
    
    // Detailed error logging
    if (error.response) {
      console.error('API response error:');
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data));
      
      res.status(error.response.status).json({
        error: 'Claude API error',
        status: error.response.status,
        details: error.response.data,
        content: [{ text: `Error from Claude API: ${error.response.status} - ${JSON.stringify(error.response.data)}` }]
      });
    } else if (error.request) {
      console.error('No response received from API');
      
      res.status(500).json({
        error: 'No response from Claude API',
        details: 'The request was made but no response was received',
        content: [{ text: "Error: Could not connect to Claude API. Please check your internet connection and API key." }]
      });
    } else {
      console.error('Request setup error:', error.message);
      
      res.status(500).json({
        error: 'Server error',
        details: error.message,
        content: [{ text: `Error setting up request to Claude API: ${error.message}` }]
      });
    }
  }
});

// Debug endpoint to list all families and their email prefixes
app.get('/api/debug/families', async (req, res) => {
  try {
    const { initializeApp, getApps, getApp } = require('firebase/app');
    const { getFirestore, collection, getDocs } = require('firebase/firestore');
    
    const firebaseConfig = {
      apiKey: "AIzaSyBKSJY4EaY8BQwRgrMnsBhtfWC_4kttHMw",
      authDomain: "parentload-ba995.firebaseapp.com",
      projectId: "parentload-ba995",
      storageBucket: "parentload-ba995.appspot.com",
      messagingSenderId: "810507329293",
      appId: "1:810507329293:web:df9e06f8a2b732c88d2501"
    };
    
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const familiesSnapshot = await getDocs(collection(db, 'families'));
    const families = [];
    
    familiesSnapshot.forEach((doc) => {
      const data = doc.data();
      families.push({
        id: doc.id,
        name: data.name,
        emailPrefix: data.emailPrefix,
        email: data.email,
        fullEmail: data.emailPrefix ? `${data.emailPrefix}@families.checkallie.com` : 'Not set'
      });
    });
    
    res.json({
      count: families.length,
      families
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/claude/test', async (req, res) => {
  console.log('Received test request to Claude API endpoint');
  
  // Check if API key is set (prefer ANTHROPIC_API_KEY for Cloud Run)
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.REACT_APP_CLAUDE_API_KEY || req.headers['x-api-key'];
  const keyStatus = apiKey ? 'API key is set' : 'No API key found';
  
  // If API key is set, make a tiny call to the Claude API to verify it works
  let apiCallStatus = 'not_tested';
  let apiCallDetails = null;
  
  if (apiKey) {
    try {
      // Make a minimal API call to test if the key works
      const testResponse = await axios.post('https://api.anthropic.com/v1/messages', 
        {
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 10,
          messages: [{ role: "user", content: "Hello" }]
        }, 
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 5000 // 5 second timeout
        }
      );
      
      apiCallStatus = 'success';
      apiCallDetails = {
        status: testResponse.status,
        model: testResponse.data.model,
        completion_length: testResponse.data.content?.length || 0
      };
      
      console.log('✅ API key test successful, Claude API is working properly');
      
    } catch (testError) {
      apiCallStatus = 'failed';
      apiCallDetails = {
        error: testError.message,
        response: testError.response ? {
          status: testError.response.status,
          data: testError.response.data
        } : 'No response'
      };
      
      console.error('❌ API key test failed:', testError.message);
    }
  }
  
  res.json({
    status: 'ok',
    message: 'Claude API endpoint is running',
    keyStatus: keyStatus,
    apiTest: {
      status: apiCallStatus,
      details: apiCallDetails
    },
    timestamp: new Date().toISOString()
  });
});

// ========== INVESTOR PASSWORD ENDPOINT ==========

app.post('/api/verify-investor-password', async (req, res) => {
  const { password } = req.body;
  
  // Store password securely as environment variable or hardcoded for now
  const INVESTOR_PASSWORD = process.env.INVESTOR_PASSWORD || 'allieinvestor';
  
  // Verify password
  if (password === INVESTOR_PASSWORD) {
    // Generate a simple session token (in production, use JWT or similar)
    const sessionToken = Buffer.from(Date.now().toString()).toString('base64');
    
    res.json({
      success: true,
      sessionToken: sessionToken
    });
  } else {
    // Add delay to prevent brute force attacks
    setTimeout(() => {
      res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }, 1000);
  }
});

// ========== TEST ENDPOINTS ==========

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    env: {
      sendgridConfigured: !!process.env.SENDGRID_API_KEY,
      port: process.env.PORT || 3001
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
      hasFromEmail: !!process.env.SENDGRID_FROM_EMAIL,
      fromEmail: process.env.SENDGRID_FROM_EMAIL
    }
  });
});

// Start server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Parentload Backend Server (Simple Version)');
  console.log('============================================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`📧 SendGrid: ${process.env.SENDGRID_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📨 From Email: ${process.env.SENDGRID_FROM_EMAIL || 'Not set'}`);
  console.log(`🤖 Claude API: ${(process.env.ANTHROPIC_API_KEY || process.env.REACT_APP_CLAUDE_API_KEY) ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📱 Twilio: ${twilioConfigured ? '✅ Configured' : '❌ Not configured'}`);
  if (twilioConfigured) {
    console.log(`📞 Twilio Phone: ${process.env.TWILIO_PHONE_NUMBER}`);
  }
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  http://localhost:3002/api/test');
  console.log('  POST http://localhost:3002/api/auth/send-otp');
  console.log('  POST http://localhost:3002/api/auth/verify-otp');
  console.log('  POST http://localhost:3002/api/auth/resend-otp');
  console.log('  POST http://localhost:3002/api/sendgrid/test');
  console.log('  POST http://localhost:3002/api/claude');
  console.log('  GET  http://localhost:3002/api/claude/test');
  if (twilioConfigured) {
    console.log('');
    console.log('  Twilio endpoints:');
    console.log('  POST http://localhost:3002/api/twilio/send-verification');
    console.log('  POST http://localhost:3002/api/twilio/verify-code');
    console.log('  POST http://localhost:3002/api/twilio/incoming-sms (webhook)');
  }
  console.log('');
});