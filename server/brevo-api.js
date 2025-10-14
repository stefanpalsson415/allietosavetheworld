// server/brevo-api.js
const express = require('express');
const cors = require('cors');
const SibApiV3Sdk = require('sib-api-v3-sdk');
const router = express.Router();

// Enable CORS and JSON parsing
router.use(cors());
router.use(express.json());

// Initialize Brevo API client
let apiInstance;

try {
  // Configure API key authorization
  const apiKey = process.env.BREVO_API_KEY || 'jFJN4Z1K5AmvzXE6';
  let defaultClient = SibApiV3Sdk.ApiClient.instance;
  let apiKeyAuth = defaultClient.authentications['api-key'];
  apiKeyAuth.apiKey = apiKey;
  
  // Initialize API instances
  const emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
  const smsApi = new SibApiV3Sdk.TransactionalSMSApi();
  
  apiInstance = {
    emailApi,
    smsApi,
    initialized: true
  };
  
  console.log('Brevo API initialized successfully');
} catch (error) {
  console.error('Error initializing Brevo API:', error);
  apiInstance = {
    initialized: false,
    error: error.message
  };
}

/**
 * Send Email API endpoint
 */
router.post('/send-email', async (req, res) => {
  try {
    if (!apiInstance.initialized) {
      return res.status(500).json({
        success: false,
        error: 'Brevo API not initialized',
        details: apiInstance.error
      });
    }
    
    // Get parameters from request
    const { to, subject, html, text, sender, params, templateId } = req.body;
    
    // Validate required fields
    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email is required'
      });
    }
    
    // Prepare email data
    const emailData = {
      sender: sender || { name: 'Allie', email: 'noreply@mail.checkallie.com' },
      to: [{ email: to }],
      subject: subject || 'Message from Allie',
      params: params || {}
    };
    
    // Use template or raw content
    if (templateId) {
      emailData.templateId = templateId;
    } else if (html) {
      emailData.htmlContent = html;
      if (text) {
        emailData.textContent = text;
      }
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either templateId or html content is required'
      });
    }
    
    // Send the email
    const result = await apiInstance.emailApi.sendTransacEmail(emailData);
    
    res.status(200).json({
      success: true,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending email via Brevo API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error sending email'
    });
  }
});

/**
 * Send SMS API endpoint
 */
router.post('/send-sms', async (req, res) => {
  try {
    if (!apiInstance.initialized) {
      return res.status(500).json({
        success: false,
        error: 'Brevo API not initialized',
        details: apiInstance.error
      });
    }
    
    // Get parameters from request
    const { to, content, sender } = req.body;
    
    // Validate required fields
    if (!to || !content) {
      return res.status(400).json({
        success: false,
        error: 'Recipient phone number and content are required'
      });
    }
    
    // Prepare SMS data
    const smsData = {
      sender: sender || 'Allie',
      recipient: to,
      content: content,
      type: 'transactional'
    };
    
    // Send the SMS
    const result = await apiInstance.smsApi.sendTransacSms(smsData);
    
    res.status(200).json({
      success: true,
      messageId: result.messageId
    });
  } catch (error) {
    console.error('Error sending SMS via Brevo API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error sending SMS'
    });
  }
});

/**
 * Health Check endpoint
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: apiInstance.initialized ? 'operational' : 'error',
    details: apiInstance.initialized ? 'Brevo API is configured and ready' : apiInstance.error
  });
});

module.exports = router;