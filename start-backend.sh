#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Parentload Backend + Ngrok${NC}"
echo "========================================"

# Kill any existing backend server on port 3002
echo -e "${YELLOW}Cleaning up port 3002...${NC}"
lsof -ti:3002 | xargs kill -9 2>/dev/null

# Start backend server on port 3002
echo -e "${GREEN}1. Starting backend server on port 3002...${NC}"
cd "/Users/stefanpalsson/parentload copy/parentload-clean/server"
npm start &
SERVER_PID=$!

# Give server time to start
sleep 3

# Start ngrok
echo -e "${GREEN}2. Starting ngrok (forwarding to 3002)...${NC}"
ngrok http 3002 &
NGROK_PID=$!

# Wait for ngrok to display URL
sleep 3

echo ""
echo -e "${BLUE}✅ Backend services started!${NC}"
echo "========================================"
echo "Backend API:   http://localhost:3002"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
echo "1. Copy the ngrok HTTPS URL from above"
echo "2. Go to SendGrid Inbound Parse settings"
echo "3. Update webhook URL to: https://YOUR-NGROK-URL.ngrok.io/api/sendgrid/incoming-email"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    kill $SERVER_PID 2>/dev/null
    kill $NGROK_PID 2>/dev/null
    lsof -ti:3002 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}Services stopped.${NC}"
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup INT

# Keep script running
wait