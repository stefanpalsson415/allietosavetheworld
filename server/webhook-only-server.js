// Minimal webhook server for deployment to Railway, Render, or Vercel
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import webhook router
const inboundEmailRouter = require('./inbound-email-webhook-rest');
app.use(inboundEmailRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'Parentload Email Webhook Server',
    endpoint: '/api/emails/inbound'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server running on port ${PORT}`);
});