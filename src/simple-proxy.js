// simple-proxy.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const app = express();
const PORT = 3001;

// Load environment variables from .env file
// Use path.resolve to look for .env in parent directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Log all environment variables for debugging
console.log('Environment variables loaded:', {
  REACT_APP_CLAUDE_API_KEY: process.env.REACT_APP_CLAUDE_API_KEY ? 'PRESENT (hidden)' : 'NOT FOUND'
});

// Configure CORS to allow all origins and methods
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Increase payload limit to 50MB for image processing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.post('/api/claude', async (req, res) => {
  try {
    console.log('Received request to Claude proxy');
    
    // Get API key from environment variables
    const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
    
    // Check if API key is provided
    if (!apiKey) {
      console.log('No API key found in environment variables, returning mock response');
      console.error('ERROR: Please add your Claude API key to the .env file as REACT_APP_CLAUDE_API_KEY');
      return res.json({
        content: [{ text: "CONFIGURATION ERROR: No Claude API key found in .env file. Please add your API key to the .env file as REACT_APP_CLAUDE_API_KEY=your_key_here and restart the proxy server." }]
      });
    }
    
    console.log('Making real API call to Claude with API key from .env file');
    
    // Log the request body for debugging
    console.log('Request body structure:', JSON.stringify(req.body).substring(0, 200) + '...');
    
    // Check if request contains vision content
    const hasVision = req.body.messages?.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some(block => block.type === 'image')
    );
    
    if (hasVision) {
      console.log('📸 Vision request detected - processing image with Claude');
      // Log image format but not the actual data
      req.body.messages.forEach((msg, idx) => {
        if (Array.isArray(msg.content)) {
          msg.content.forEach((block, blockIdx) => {
            if (block.type === 'image') {
              console.log(`Message ${idx}, Block ${blockIdx}: Image (${block.source?.type}, ${block.source?.media_type})`);
            }
          });
        }
      });
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
    
    console.log('Claude API response received successfully');
    res.json(response.data);
  } catch (error) {
    console.error('Error in Claude proxy:', error.message);
    
    // Detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API response error:');
      console.error('Status:', error.response.status);
      console.error('Headers:', JSON.stringify(error.response.headers));
      console.error('Data:', JSON.stringify(error.response.data));
      
      res.status(error.response.status).json({
        error: 'Claude API error',
        status: error.response.status,
        details: error.response.data,
        content: [{ text: `Error from Claude API: ${error.response.status} - ${JSON.stringify(error.response.data)}` }]
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from API');
      console.error(error.request);
      
      res.status(500).json({
        error: 'No response from Claude API',
        details: 'The request was made but no response was received',
        content: [{ text: "Error: Could not connect to Claude API. Please check your internet connection and API key." }]
      });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      
      res.status(500).json({
        error: 'Proxy server error',
        details: error.message,
        content: [{ text: `Error setting up request to Claude API: ${error.message}` }]
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Simple Claude proxy running on http://localhost:${PORT}`);
  console.log(`API key environment variable ${process.env.REACT_APP_CLAUDE_API_KEY ? 'is set' : 'is NOT set'}`);
});



// Add this to simple-proxy.js
app.get('/api/claude/test', async (req, res) => {
  console.log('Received test request to Claude proxy');
  
  // Check if API key is set
  const apiKey = process.env.REACT_APP_CLAUDE_API_KEY;
  const keyStatus = apiKey ? 'API key is set' : 'No API key found';
  
  // If API key is set, make a tiny call to the Claude API to verify it works
  let apiCallStatus = 'not_tested';
  let apiCallDetails = null;
  
  if (apiKey) {
    try {
      // Make a minimal API call to test if the key works
      const testResponse = await axios.post('https://api.anthropic.com/v1/messages', 
        {
          model: "claude-sonnet-4-20250514",
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
    message: 'Claude proxy is running',
    keyStatus: keyStatus,
    apiTest: {
      status: apiCallStatus,
      details: apiCallDetails
    },
    timestamp: new Date().toISOString()
  });
});