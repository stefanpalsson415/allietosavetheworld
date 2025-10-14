#!/bin/bash
# Test the email webhook

curl -X POST http://localhost:3002/api/emails/inbound \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "to=palsson@families.checkallie.com" \
  --data-urlencode "from=test@example.com" \
  --data-urlencode "subject=Test Email After Claude Integration" \
  --data-urlencode "text=This is a test email to verify the webhook is working after Claude integration. It should be processed by AI."