#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Parentload Development Environment${NC}"
echo "============================================"

# Kill any existing processes on our ports
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null

# Start React app (Claude simple server on port 3001)
echo -e "${GREEN}1. Starting React app on port 3001...${NC}"
cd "/Users/stefanpalsson/parentload copy/parentload-clean"
npm start &
REACT_PID=$!
echo "   React PID: $REACT_PID"

# Give React time to start
sleep 5

# Start backend server on port 3002
echo -e "${GREEN}2. Starting backend server on port 3002...${NC}"
cd "/Users/stefanpalsson/parentload copy/parentload-clean/server"
npm start &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"

# Give server time to start
sleep 3

# Start ngrok forwarding to backend server
echo -e "${GREEN}3. Starting ngrok (forwarding to backend on 3002)...${NC}"
ngrok http 3002 &
NGROK_PID=$!
echo "   Ngrok PID: $NGROK_PID"

# Wait a moment for ngrok to start
sleep 3

echo ""
echo -e "${BLUE}✅ All services started!${NC}"
echo "============================================"
echo "React App:     http://localhost:3001"
echo "Backend API:   http://localhost:3002"
echo "Ngrok:         Check terminal for public URL"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Update SendGrid webhook URL with the ngrok URL${NC}"
echo -e "${YELLOW}    Format: https://YOUR-NGROK-URL.ngrok.io/api/sendgrid/incoming-email${NC}"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping all services...${NC}"
    kill $REACT_PID 2>/dev/null
    kill $SERVER_PID 2>/dev/null
    kill $NGROK_PID 2>/dev/null
    # Also kill any remaining node processes on our ports
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    lsof -ti:3002 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup INT

# Keep script running
while true; do
    sleep 1
done