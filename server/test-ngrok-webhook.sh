#!/bin/bash

# Get the current ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok[^"]*\.app' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Ngrok not running or URL not found"
    exit 1
fi

echo "🔗 Testing webhook at: $NGROK_URL/api/emails/inbound"

# Test the webhook
curl -X POST "$NGROK_URL/api/emails/inbound" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "to=palsson@families.checkallie.com" \
  --data-urlencode "from=doctor@medical.com" \
  --data-urlencode "subject=Medical Appointment Tomorrow" \
  --data-urlencode "text=Your appointment with Dr. Smith is confirmed for tomorrow at 2:00 PM. Please bring your insurance card."

echo -e "\n\n✅ Test email sent!"