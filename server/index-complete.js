// server/index-complete.js
const express = require('express');
const axios = require('axios');

const app = express();

// Parse JSON and URL-encoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply CORS to all routes - allow all origins for debugging
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log the request for debugging
  console.log(`Request from origin: ${origin} to ${req.method} ${req.path}`);
  
  // Allow the specific origin that's making the request
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Claude API proxy
app.use('/api/claude', async (req, res) => {
  // Direct Claude API URL
  const claudeApiUrl = 'https://api.anthropic.com/v1/messages';
  
  try {
    console.log(`Proxying request to Claude API: ${req.method} ${req.path} from origin: ${req.headers.origin}`);
    
    // Test endpoint just returns success
    if (req.path === '/test' || req.url === '/test') {
      return res.json({ success: true, message: "Claude API proxy is working" });
    }
    
    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
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
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
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

// Mount webhook routers - check if modules exist first
// Email webhook disabled due to import issues
// try {
//   const emailWebhookRouter = require('./email-webhook');
//   app.use('/api/emails', emailWebhookRouter);
//   console.log('Email webhook router mounted');
// } catch (error) {
//   console.log('Email webhook router not available:', error.message);
// }

try {
  const sendgridService = require('./sendgrid-service');
  app.use('/api/sendgrid', sendgridService);
  console.log('SendGrid service mounted');
} catch (error) {
  console.log('SendGrid service not available:', error.message);
}

try {
  const smsWebhookRouter = require('./inbound-sms-webhook');
  app.use(smsWebhookRouter);
  console.log('SMS webhook router mounted');
} catch (error) {
  console.log('SMS webhook router not available:', error.message);
}

try {
  const twilioService = require('./twilio-service');
  app.use('/api/twilio', twilioService);
  console.log('Twilio service mounted');
} catch (error) {
  console.log('Twilio service not available:', error.message);
}

// Test endpoints for webhooks
app.get('/api/sms/test', (req, res) => {
  res.json({ success: true, message: "SMS webhook endpoint is accessible" });
});

app.get('/api/sendgrid/test', (req, res) => {
  res.json({ success: true, message: "SendGrid webhook endpoint is accessible" });
});

// Catch-all route to log unhandled requests
app.use('*', (req, res) => {
  console.log(`Unhandled request: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: [
      '/health',
      '/api/claude',
      '/api/claude/test',
      '/api/emails',
      '/api/sendgrid',
      '/api/sms',
      '/api/twilio'
    ]
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('  - /health');
  console.log('  - /api/claude');
  console.log('  - /api/emails');
  console.log('  - /api/sendgrid');
  console.log('  - /api/sms');
  console.log('  - /api/twilio');
});