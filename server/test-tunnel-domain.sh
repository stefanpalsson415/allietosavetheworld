#!/bin/bash

# Test script for tunnel.checkallie.com domain

DOMAIN="tunnel.checkallie.com"
LOCAL_PORT=3002

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Testing Parentload Server with Custom Domain${NC}"
echo "============================================"

# Test 1: Check if server is running locally
echo -e "\n${YELLOW}1. Testing local server on port $LOCAL_PORT...${NC}"
if curl -s http://localhost:$LOCAL_PORT/api/test > /dev/null; then
    echo -e "${GREEN}✓ Local server is running${NC}"
    curl -s http://localhost:$LOCAL_PORT/api/test | jq '.'
else
    echo -e "${RED}✗ Local server is not running${NC}"
    echo "  Run: ./manage-servers.sh start"
fi

# Test 2: Check if ngrok tunnel is accessible
echo -e "\n${YELLOW}2. Testing ngrok tunnel at https://$DOMAIN...${NC}"
if curl -s https://$DOMAIN/api/test > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ngrok tunnel is accessible${NC}"
    curl -s https://$DOMAIN/api/test | jq '.'
else
    echo -e "${RED}✗ Ngrok tunnel is not accessible${NC}"
    echo "  Make sure ngrok is running with: ./manage-servers.sh start"
fi

# Test 3: Test email webhook endpoint
echo -e "\n${YELLOW}3. Testing email webhook endpoint...${NC}"
response=$(curl -s -X POST https://$DOMAIN/api/inbound/email \
    -H "Content-Type: application/json" \
    -d '{"test": true, "from": "test@example.com", "subject": "Test"}')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Email webhook endpoint is accessible${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo -e "${RED}✗ Email webhook endpoint failed${NC}"
fi

# Test 4: Test SMS webhook endpoint
echo -e "\n${YELLOW}4. Testing SMS webhook endpoint...${NC}"
response=$(curl -s -X POST https://$DOMAIN/api/inbound/sms \
    -H "Content-Type: application/json" \
    -d '{"test": true, "From": "+1234567890", "Body": "Test SMS"}')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SMS webhook endpoint is accessible${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo -e "${RED}✗ SMS webhook endpoint failed${NC}"
fi

# Test 5: Show webhook URLs for configuration
echo -e "\n${YELLOW}5. Webhook URLs for your services:${NC}"
echo -e "${GREEN}SendGrid Inbound Parse:${NC}"
echo "  Development: https://$DOMAIN/api/inbound/email"
echo "  Production:  https://$DOMAIN/api/inbound/email/956efd786d1627b507c8fa65953b4110a51dbbcd5b6c2583fa4bb0d8186b299b"
echo -e "\n${GREEN}Twilio SMS/MMS:${NC}"
echo "  SMS: https://$DOMAIN/api/inbound/sms"
echo "  MMS: https://$DOMAIN/api/inbound/mms"

echo -e "\n${YELLOW}============================================${NC}"
echo -e "${GREEN}Configuration Summary:${NC}"
echo "Domain: $DOMAIN"
echo "Local Port: $LOCAL_PORT"
echo "Status: Check results above"
echo -e "${YELLOW}============================================${NC}"