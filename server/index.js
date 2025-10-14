// server/index.js
const express = require('express');
require('dotenv').config();
const emailWebhookRouter = require('./email-webhook');
const brevoWebhookRouter = require('./brevo-webhook');
const brevoApiRouter = require('./brevo-api');
const twilioService = require('./twilio-service');
const sendgridService = require('./sendgrid-service');
const authService = require('./auth-service');
const cors = require('cors');
const axios = require('axios');

const app = express();

// Configure CORS to allow specific origins
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://parentload-ba995.web.app',
      'https://checkallie.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Remove the global CORS middleware for now
// app.use(cors(corsOptions));

// Parse JSON requests
app.use(express.json());

// Apply CORS to all routes - temporarily allow all origins for debugging
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log the request for debugging
  console.log(`CORS request from origin: ${origin} to ${req.path}`);
  
  // For now, allow the specific origin that's making the request
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return res.status(204).end();
  }
  
  next();
});

// Mount the email webhook router
app.use('/api/emails', emailWebhookRouter);

// Mount the Brevo webhook router
app.use('/api/webhooks/brevo', brevoWebhookRouter);

// Mount the Brevo API router
app.use('/api/brevo', brevoApiRouter);

// Mount Twilio service for SMS
app.use('/api/twilio', twilioService);

// Mount SMS webhook handler
const smsWebhookRouter = require('./inbound-sms-webhook');
app.use(smsWebhookRouter);

// Mount SendGrid service for email receiving
app.use('/api/sendgrid', sendgridService);

// Mount Auth service for OTP
app.use('/api/auth', authService);

// Sales Chat Claude endpoint - public access, no auth required
// MUST BE DEFINED BEFORE THE GENERAL CLAUDE PROXY

// Handle OPTIONS for sales endpoint
app.options('/api/claude/sales', (req, res) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

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
    
    // Basic rate limiting - you can enhance this
    // For now, just log the request
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

// Add Claude API proxy
app.use('/api/claude', async (req, res) => {
  // CORS is now handled by the global middleware
  
  // Direct Claude API URL instead of Firebase Function
  const claudeApiUrl = `https://api.anthropic.com/v1/messages`;
  
  try {
    console.log(`Proxying request to Claude API: ${req.method} ${claudeApiUrl} from origin: ${origin}`);
    
    // Test endpoint just returns success
    if (req.path === '/test') {
      return res.json({ success: true, message: "Claude API proxy is working" });
    }
    
    // Get API key from environment or request
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.REACT_APP_CLAUDE_API_KEY || req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required',
        details: 'Please configure ANTHROPIC_API_KEY environment variable'
      });
    }
    
    // Forward the request to Claude API directly
    const response = await axios({
      method: 'POST',
      url: claudeApiUrl,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
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

// Simple test endpoint
app.get('/api/claude/test', (req, res) => {
  res.json({ success: true, message: "Claude API proxy is working" });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});