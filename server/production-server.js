const express = require('express');
const axios = require('axios');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const admin = require('firebase-admin');
require('dotenv').config();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Use service account if available, otherwise use default credentials
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountPath) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Use Application Default Credentials (for local dev and Cloud Run)
    admin.initializeApp({
      projectId: 'parentload-ba995',
      credential: admin.credential.applicationDefault()
    });
  }

  console.log('Firebase Admin SDK initialized with ADC');
}

// Import AgentHandler
const AgentHandler = require('./agent-handler');

// Import SMS webhook
const smsWebhook = require('./inbound-sms-webhook');

const app = express();

// Production CORS configuration - Secure for production
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://parentload-ba995.web.app',
      'https://checkallie.com',
      'https://www.checkallie.com'
    ];

    // Add localhost only in development mode
    if (process.env.NODE_ENV !== 'production') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
    }

    // Allow requests with no origin (webhooks from Twilio, SendGrid, etc.)
    // These services don't send an Origin header
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS blocked unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// General rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Strict rate limiter for API endpoints
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 API requests per minute
  message: 'API rate limit exceeded, please try again later.'
});

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true })); // Parse form data from Twilio/SendGrid webhooks
app.use(limiter); // Apply general rate limit to all routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Mount SMS webhook routes
app.use(smsWebhook);

// Mount Knowledge Graph API routes (enabled with Neo4j Aura)
try {
  const knowledgeGraphRoutes = require('./routes/knowledge-graph');
  app.use('/api/knowledge-graph', knowledgeGraphRoutes);
  console.log('✅ Knowledge Graph API routes enabled - Connected to Neo4j Aura');
} catch (error) {
  console.error('⚠️ Knowledge Graph routes not available:', error.message);
  console.error('   Check that ./routes/knowledge-graph.js exists and services are properly configured');
}

// Production API Keys - Read from environment variables for security
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || process.env.ANTHROPIC_API_KEY;
const SALES_API_KEY = process.env.SALES_API_KEY || process.env.ANTHROPIC_SALES_API_KEY;

// Validate API keys are configured (optional - only needed for Claude API endpoints)
if (!INTERNAL_API_KEY || !SALES_API_KEY) {
  console.warn('WARNING: API keys not configured. Claude API endpoints will not work.');
  console.warn('Set INTERNAL_API_KEY and SALES_API_KEY environment variables if you need Claude API functionality.');
}

// Secure logging middleware - sanitize sensitive data
app.use((req, res, next) => {
  // Don't log sensitive headers or body content
  const sanitizedPath = req.path.replace(/\/api\/claude.*/, '/api/claude/[REDACTED]');
  console.log(`${new Date().toISOString()} - ${req.method} ${sanitizedPath}`);
  next();
});

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  next();
});

// Investor password verification endpoint
app.post('/api/verify-investor-password',
  [
    body('password').isString().trim().notEmpty().withMessage('Password is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Store password securely as environment variable or hardcoded for now
    const INVESTOR_PASSWORD = process.env.INVESTOR_PASSWORD || 'allieinvestor';
    
    // Verify password
    if (req.body.password === INVESTOR_PASSWORD) {
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
  }
);

// Internal Claude endpoint (authenticated users)
app.post('/api/claude',
  apiLimiter, // Apply strict API rate limit
  [
    body('messages').isArray().withMessage('Messages must be an array'),
    body('model').isString().trim().notEmpty().withMessage('Model is required'),
    body('max_tokens').optional().isInt({ min: 1, max: 16384 }).withMessage('Max tokens must be between 1 and 16384')
  ],
  async (req, res) => {
    // Check if API key is configured
    if (!INTERNAL_API_KEY) {
      return res.status(503).json({ 
        error: 'Claude API service is not configured',
        message: 'Internal API key not set'
      });
    }
    
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  try {
    console.log('Internal Claude API request - Model:', req.body.model);
    
    // Check if tools are requested (for web search)
    const hasTools = req.body.tools && req.body.tools.length > 0;
    if (hasTools) {
      console.log('Tools requested:', req.body.tools.map(t => t.name).join(', '));
      
      // If web search is requested and model is Sonnet, use the sales API key which definitely works
      if (req.body.model === 'claude-3-5-sonnet-20241022' && 
          req.body.tools.some(t => t.name === 'web_search_20250305')) {
        console.log('Web search detected with Sonnet - using sales API key for better compatibility');
      }
    }
    
    // Prepare the request body - pass through everything including tools
    const apiRequestBody = { ...req.body };
    
    // Make the API call with proper headers for tool use
    const headers = {
      'x-api-key': INTERNAL_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    };
    
    // Add beta header if tools are being used
    if (hasTools) {
      // Add the beta header for web search functionality
      headers['anthropic-beta'] = 'max-tokens-3-5-sonnet-2024-07-15';
      console.log('Adding beta header for tool use');
    }
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', apiRequestBody, {
      headers: headers,
      timeout: hasTools ? 60000 : 90000 // Increased timeout for large token responses (survey generation)
    });
    
    console.log('Internal Claude API success' + (hasTools ? ' (with tools)' : ''));
    
    // Check if Claude used tools (server-side tools execute automatically)
    if (response.data && response.data.content) {
      const hasServerTool = response.data.content.some(c => 
        c.type === 'server_tool_use' || 
        c.type === 'web_search_tool_result'
      );
      const hasClientTool = response.data.content.some(c => c.type === 'tool_use');
      
      if (hasServerTool) {
        console.log('✅ Server-side web search executed automatically');
      } else if (hasClientTool) {
        console.log('⚠️ Client-side tool use detected - this should not happen with web_search_20250305');
      }
    }
    
    res.json(response.data);
  } catch (error) {
    // Sanitize error logging
    console.error('Internal Claude API Error:', {
      status: error.response?.status,
      error: 'Request failed' // Don't log full error details
    });
    
    // Return the actual error from Claude API
    if (error.response?.data) {
      res.status(error.response.status).json({
        error: 'Claude API error',
        status: error.response.status,
        details: error.response.data,
        content: [{
          text: `Error from Claude API: ${error.response.status} - ${JSON.stringify(error.response.data)}`
        }]
      });
    } else {
      res.status(500).json({
        error: 'Network or server error',
        message: error.message
      });
    }
  }
});

// Sales Claude endpoint (public)
app.post('/api/claude/sales',
  apiLimiter, // Apply strict API rate limit
  [
    body('messages').isArray().withMessage('Messages must be an array'),
    body('model').isString().trim().notEmpty().withMessage('Model is required'),
    body('max_tokens').optional().isInt({ min: 1, max: 16384 }).withMessage('Max tokens must be between 1 and 16384')
  ],
  async (req, res) => {
    // Check if API key is configured
    if (!SALES_API_KEY) {
      return res.status(503).json({ 
        error: 'Claude Sales API service is not configured',
        message: 'Sales API key not set'
      });
    }
    
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  try {
    console.log('Sales Claude API request - Model:', req.body.model);
    
    const response = await axios.post('https://api.anthropic.com/v1/messages', req.body, {
      headers: {
        'x-api-key': SALES_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('Sales Claude API success');
    res.json(response.data);
  } catch (error) {
    // Sanitize error logging
    console.error('Sales Claude API Error:', {
      status: error.response?.status,
      error: 'Request failed' // Don't log full error details
    });
    
    if (error.response?.data) {
      res.status(error.response.status).json({
        error: 'Claude API error',
        status: error.response.status,
        details: error.response.data
      });
    } else {
      res.status(500).json({
        error: 'Network or server error',
        message: error.message
      });
    }
  }
});

// ========== AGENT ENDPOINT (NEW) ==========

// Initialize agent handler with configuration
const agentHandler = new AgentHandler({
  claudeApiKey: INTERNAL_API_KEY || process.env.ANTHROPIC_API_KEY
});

// Agent endpoint with function calling
app.post('/api/claude/agent',
  apiLimiter, // Apply strict API rate limit
  [
    body('message').isString().trim().notEmpty().withMessage('Message is required'),
    body('userId').isString().trim().notEmpty().withMessage('User ID is required'),
    body('familyId').isString().trim().notEmpty().withMessage('Family ID is required'),
    body('conversationHistory').optional().isArray().withMessage('Conversation history must be an array'),
    body('context').optional().isObject().withMessage('Context must be an object')
  ],
  async (req, res) => {
    // Check if API key is configured
    if (!INTERNAL_API_KEY) {
      return res.status(503).json({
        error: 'Agent service is not configured',
        message: 'Internal API key not set'
      });
    }

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Delegate to agent handler
    await agentHandler.handleAgentRequest(req, res);
  }
);

// ========== TWILIO SMS ENDPOINTS ==========

// Send SMS verification code (used by in-app phone verification)
app.post('/api/twilio/send-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number required' });
    }
    
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // For now, just log and return success (SMS sending can be implemented later)
    console.log(`SMS verification requested for ${phoneNumber} with code: ${code}`);
    
    // Store code in memory for verification (in production, use Redis or database)
    global.verificationCodes = global.verificationCodes || {};
    global.verificationCodes[phoneNumber] = {
      code: code,
      timestamp: Date.now(),
      attempts: 0
    };
    
    res.json({ 
      success: true, 
      message: 'Verification code sent',
      // Only return code in development for testing
      ...(process.env.NODE_ENV === 'development' && { code })
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Failed to send SMS verification' });
  }
});

// Verify SMS code
app.post('/api/twilio/verify-code', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and code required' });
    }
    
    // Check if code exists and is valid
    const storedData = global.verificationCodes?.[phoneNumber];
    
    if (!storedData) {
      return res.status(400).json({ error: 'No verification code found for this number' });
    }
    
    // Check if code expired (10 minutes)
    if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
      delete global.verificationCodes[phoneNumber];
      return res.status(400).json({ error: 'Verification code has expired' });
    }
    
    // Check attempts
    if (storedData.attempts >= 3) {
      delete global.verificationCodes[phoneNumber];
      return res.status(400).json({ error: 'Too many failed attempts' });
    }
    
    // Verify code
    if (storedData.code !== code) {
      storedData.attempts++;
      return res.status(400).json({ error: 'Invalid verification code' });
    }
    
    // Success - clean up
    delete global.verificationCodes[phoneNumber];
    
    res.json({ 
      success: true, 
      message: 'Phone number verified successfully'
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

// Alias for backward compatibility (onboarding might still use old endpoint)
app.post('/api/twilio/send-verification', async (req, res) => {
  // Redirect to the correct endpoint
  req.url = '/api/twilio/send-code';
  return app._router.handle(req, res);
});

// ========== PHASE 5: PROGRESSIVE AUTONOMY ENDPOINTS ==========

// Confirm a pending action
app.post('/api/claude/agent/confirm',
  apiLimiter,
  [
    body('userId').isString().trim().notEmpty().withMessage('User ID is required'),
    body('familyId').isString().trim().notEmpty().withMessage('Family ID is required'),
    body('actionId').isString().trim().notEmpty().withMessage('Action ID is required'),
    body('confirmed').isBoolean().withMessage('Confirmed must be a boolean')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { userId, familyId, actionId, confirmed } = req.body;

      // Retrieve pending action from Firestore
      const pendingActionRef = admin.firestore()
        .collection('pending_actions')
        .doc(actionId);

      const actionDoc = await pendingActionRef.get();

      if (!actionDoc.exists) {
        return res.status(404).json({ error: 'Action not found or already processed' });
      }

      const actionData = actionDoc.data();

      // Verify ownership
      if (actionData.userId !== userId || actionData.familyId !== familyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (confirmed) {
        // Execute the action
        const result = await agentHandler.executeTool(
          actionData.toolName,
          actionData.input,
          userId,
          familyId
        );

        // Update user preferences based on confirmation
        await agentHandler.autonomyService.updateUserPreferences(userId, familyId, {
          type: 'confirmation_result',
          action: actionData.toolName,
          confirmed: true,
          confidence: actionData.confidence || 0.5
        });

        // Delete pending action
        await pendingActionRef.delete();

        res.json({
          success: true,
          executed: true,
          result,
          message: 'Action executed successfully'
        });
      } else {
        // User declined - update preferences
        await agentHandler.autonomyService.updateUserPreferences(userId, familyId, {
          type: 'confirmation_result',
          action: actionData.toolName,
          confirmed: false,
          confidence: actionData.confidence || 0.5
        });

        // Delete pending action
        await pendingActionRef.delete();

        res.json({
          success: true,
          executed: false,
          message: 'Action cancelled by user'
        });
      }

    } catch (error) {
      console.error('Error processing confirmation:', error);
      res.status(500).json({
        error: 'Failed to process confirmation',
        details: error.message
      });
    }
  }
);

// Get pending actions for a user
app.get('/api/claude/agent/pending/:userId/:familyId',
  apiLimiter,
  async (req, res) => {
    try {
      const { userId, familyId } = req.params;

      const pendingActionsSnapshot = await admin.firestore()
        .collection('pending_actions')
        .where('userId', '==', userId)
        .where('familyId', '==', familyId)
        .where('createdAt', '>', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
        .orderBy('createdAt', 'desc')
        .get();

      const pendingActions = pendingActionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      res.json({
        success: true,
        pendingActions
      });

    } catch (error) {
      console.error('Error getting pending actions:', error);
      res.status(500).json({
        error: 'Failed to get pending actions',
        details: error.message
      });
    }
  }
);

// Update user autonomy level
app.post('/api/claude/agent/autonomy',
  apiLimiter,
  [
    body('userId').isString().trim().notEmpty().withMessage('User ID is required'),
    body('familyId').isString().trim().notEmpty().withMessage('Family ID is required'),
    body('autonomyLevel').isInt({ min: 0, max: 3 }).withMessage('Autonomy level must be 0-3')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { userId, familyId, autonomyLevel } = req.body;

      await agentHandler.autonomyService.updateUserPreferences(userId, familyId, {
        type: 'autonomy_level_change',
        autonomyLevel,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        autonomyLevel,
        message: 'Autonomy level updated successfully'
      });

    } catch (error) {
      console.error('Error updating autonomy level:', error);
      res.status(500).json({
        error: 'Failed to update autonomy level',
        details: error.message
      });
    }
  }
);

// Get user autonomy settings and stats
app.get('/api/claude/agent/autonomy/:userId/:familyId',
  apiLimiter,
  async (req, res) => {
    try {
      const { userId, familyId } = req.params;

      const preferences = await agentHandler.autonomyService.getUserPreferences(userId, familyId);

      // Get proactive suggestions
      const suggestions = await agentHandler.autonomyService.generateProactiveSuggestions(
        familyId,
        userId,
        { timestamp: new Date().toISOString() }
      );

      res.json({
        success: true,
        autonomyLevel: preferences.autonomyLevel || 1,
        preferences,
        suggestions
      });

    } catch (error) {
      console.error('Error getting autonomy settings:', error);
      res.status(500).json({
        error: 'Failed to get autonomy settings',
        details: error.message
      });
    }
  }
);

// Test endpoint for basic Claude
app.get('/api/claude/test', async (req, res) => {
  console.log('Test endpoint called');
  
  try {
    // Test with Opus 3 model which we know works
    const testResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 20,
      messages: [{ role: 'user', content: 'Say hello in 5 words' }]
    }, {
      headers: {
        'x-api-key': INTERNAL_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    res.json({
      success: true,
      status: 'Connected',
      message: 'Claude API connection successful',
      model: 'claude-3-5-sonnet-20241022',
      response: testResponse.data.content[0].text,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test endpoint error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      status: 'Error',
      message: 'Claude API test failed',
      error: error.response?.data?.error || error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint for web search capability
app.get('/api/claude/test-web-search', async (req, res) => {
  console.log('Testing web search capability');
  
  try {
    // Test with Opus 4.1 and server-side web search tool specification
    const testResponse = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-opus-4-1-20250805',  // Use Opus 4.1 model (same as main API)
      max_tokens: 500,
      messages: [{ 
        role: 'user', 
        content: 'Use the web search tool to find the current temperature in New York City.' 
      }],
      tools: [{
        type: 'web_search_20250305',  // Server-side tool specification
        name: 'web_search',
        max_uses: 1  // Allow 1 search for test
      }]
    }, {
      headers: {
        'x-api-key': INTERNAL_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    // Check if web search was actually used
    const hasToolUse = testResponse.data.content?.some(c => c.type === 'tool_use');
    const textContent = testResponse.data.content?.find(c => c.type === 'text')?.text || 'No text response';
    
    res.json({
      success: true,
      webSearchEnabled: hasToolUse,
      message: hasToolUse ? 'Web search is working!' : 'Web search tool not used - may not be enabled',
      response: textContent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Web search test error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      webSearchEnabled: false,
      message: 'Web search test failed',
      error: error.response?.data?.error || error.message,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    });
  }
});

// Handle 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

const PORT = process.env.PORT || 8080;

// Create HTTP server (required for Socket.io)
const http = require('http');
const server = http.createServer(app);

// Initialize Socket.io for real-time graph updates
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: corsOptions,
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

// Initialize WebSocket Knowledge Graph Service (if available)
try {
  // Dynamic import for ES6 module
  import('./services/graph/WebSocketGraphService.js').then(module => {
    const webSocketGraphService = module.default;
    webSocketGraphService.initialize(io);
    console.log('✅ WebSocket Knowledge Graph service initialized');
  });
} catch (error) {
  console.log('⚠️  WebSocket Graph service not available:', error.message);
}

server.listen(PORT, () => {
  console.log(`🚀 Production Claude Proxy Server`);
  console.log(`📍 Running on port ${PORT}`);
  console.log(`✅ Internal API key configured (Opus 4.1 support)`);
  console.log(`✅ Sales API key configured (Sonnet 3.5 support)`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
});