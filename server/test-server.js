// Simple test server without Firebase dependencies
const express = require('express');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running!',
    env: {
      twilioConfigured: !!process.env.TWILIO_ACCOUNT_SID,
      sendgridConfigured: !!process.env.SENDGRID_API_KEY,
      port: process.env.PORT || 3001
    }
  });
});

// Test Twilio endpoint
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

// Test SendGrid endpoint
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Test server running on port ${PORT}`);
  console.log(`📧 SendGrid configured: ${!!process.env.SENDGRID_API_KEY}`);
  console.log(`📱 Twilio configured: ${!!process.env.TWILIO_ACCOUNT_SID}`);
});