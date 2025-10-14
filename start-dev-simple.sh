#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Parentload Development (Simple Mode)${NC}"
echo "=============================================="

# Clean up
echo -e "${YELLOW}Cleaning up old processes...${NC}"
pkill -f "npm start" 2>/dev/null
pkill -f "node server-simple.js" 2>/dev/null
pkill -f ngrok 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
sleep 2

# Start everything
echo -e "${GREEN}Starting all services...${NC}"

# Terminal 1: React + Claude
osascript -e 'tell app "Terminal" to do script "cd \"'"/Users/stefanpalsson/parentload copy/parentload-clean"'\" && echo -e \"'"\033[0;32m"'Starting React App with Claude API...'"\033[0m"'\" && npm start"'

# Terminal 2: Backend Server
sleep 3
osascript -e 'tell app "Terminal" to do script "cd \"'"/Users/stefanpalsson/parentload copy/parentload-clean/server"'\" && echo -e \"'"\033[0;32m"'Starting Backend Server on port 3002...'"\033[0m"'\" && PORT=3002 node server-simple.js"'

# Terminal 3: Ngrok
sleep 3
osascript -e 'tell app "Terminal" to do script "echo -e \"'"\033[0;32m"'Starting Ngrok...'"\033[0m"'\" && ngrok http 3002"'

echo ""
echo -e "${BLUE}✅ All services starting in separate Terminal windows!${NC}"
echo "=============================================="
echo ""
echo -e "${GREEN}Services:${NC}"
echo "• React App (with Claude): http://localhost:3001"
echo "• Backend Server:          http://localhost:3002"
echo "• Ngrok:                   Check the ngrok terminal for URL"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "1. Wait for all services to fully start"
echo "2. Copy the ngrok HTTPS URL from the ngrok terminal"
echo "3. Update SendGrid webhook: https://YOUR-NGROK-URL/api/emails/inbound"
echo ""
echo -e "${GREEN}Your email: palsson@families.checkallie.com${NC}"
echo ""
echo "To stop: Close all Terminal windows or press Ctrl+C in each"