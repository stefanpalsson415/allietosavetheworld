#!/bin/bash
# Test the local webhook directly

echo "Testing local webhook..."
curl -X POST http://localhost:3002/api/emails/inbound \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "to=palsson@families.checkallie.com" \
  -d "from=test@example.com" \
  -d "subject=Test+Email+via+Local+Webhook" \
  -d "text=This+is+a+test+to+verify+the+webhook+is+working+locally"