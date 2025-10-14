#!/bin/bash
# Start ngrok to expose local server for email webhooks

echo "🚀 Starting ngrok to expose local server..."
echo "This allows SendGrid to send emails to your local development server"
echo ""
echo "Make sure your server is running on port 3002"
echo ""

# Check if server is running
if ! curl -s http://localhost:3002/api/test > /dev/null; then
  echo "❌ Server not running on port 3002!"
  echo "Please start the server first: cd server && npm start"
  exit 1
fi

echo "✅ Server is running on port 3002"
echo ""
echo "Starting ngrok..."
echo "After ngrok starts, you'll need to:"
echo "1. Copy the HTTPS URL (like https://abc123.ngrok.io)"
echo "2. Update SendGrid Inbound Parse webhook to:"
echo "   https://YOUR-NGROK-URL/api/emails/inbound"
echo ""

# Start ngrok
ngrok http 3002