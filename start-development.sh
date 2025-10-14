#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Complete Parentload Development Environment${NC}"
echo "=================================================="

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command_exists ngrok; then
    echo -e "${RED}❌ ngrok not found. Please install it first:${NC}"
    echo "   brew install ngrok"
    exit 1
fi

# Kill any existing processes on our ports
echo -e "${YELLOW}Cleaning up existing processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null

# Start React app with Claude simple proxy (port 3001)
echo -e "${GREEN}1. Starting React app with Claude API proxy on port 3001...${NC}"
cd "/Users/stefanpalsson/parentload copy/parentload-clean"
npm start > /tmp/react-app.log 2>&1 &
REACT_PID=$!
echo "   React PID: $REACT_PID"
echo "   Logs: tail -f /tmp/react-app.log"

# Give React time to start
echo -e "${YELLOW}   Waiting for React to start...${NC}"
sleep 8

# Start backend server for email/SMS (port 3002)
echo -e "${GREEN}2. Starting backend server (Email/SMS) on port 3002...${NC}"
cd "/Users/stefanpalsson/parentload copy/parentload-clean/server"
PORT=3002 node server-simple.js > /tmp/backend-server.log 2>&1 &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"
echo "   Logs: tail -f /tmp/backend-server.log"

# Give server time to start
sleep 3

# Start ngrok forwarding to backend server
echo -e "${GREEN}3. Starting ngrok (forwarding to backend on 3002)...${NC}"
ngrok http 3002 > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
echo "   Ngrok PID: $NGROK_PID"

# Wait for ngrok to start and get the URL
sleep 5
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok[^"]*\.app' | head -1)

echo ""
echo -e "${BLUE}✅ All services started successfully!${NC}"
echo "=================================================="
echo ""
echo -e "${GREEN}Service Status:${NC}"
echo "📱 React App (with Claude):  http://localhost:3001"
echo "🔧 Backend API:              http://localhost:3002"
echo "🌐 Ngrok URL:                ${NGROK_URL:-Check http://localhost:4040}"
echo ""
echo -e "${GREEN}Test Endpoints:${NC}"
echo "✅ Claude API:  http://localhost:3001/api/claude/test"
echo "✅ Backend API: http://localhost:3002/api/test"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT NEXT STEPS:${NC}"
echo "1. Copy the ngrok URL: ${NGROK_URL:-Check http://localhost:4040}"
echo "2. Go to SendGrid Inbound Parse settings"
echo "3. Update webhook URL to: ${NGROK_URL:-NGROK_URL}/api/emails/inbound"
echo ""
echo -e "${GREEN}Your family email: palsson@families.checkallie.com${NC}"
echo ""
echo -e "${BLUE}Monitoring:${NC}"
echo "• React logs:   tail -f /tmp/react-app.log"
echo "• Server logs:  tail -f /tmp/backend-server.log"
echo "• Ngrok web UI: http://localhost:4040"
echo ""
echo "Press Ctrl+C to stop all services"

# Save PIDs to file for easy cleanup
echo "$REACT_PID" > /tmp/parentload-pids.txt
echo "$SERVER_PID" >> /tmp/parentload-pids.txt
echo "$NGROK_PID" >> /tmp/parentload-pids.txt

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Stopping all services...${NC}"
    
    # Kill using saved PIDs
    if [ -f /tmp/parentload-pids.txt ]; then
        while read pid; do
            kill $pid 2>/dev/null
        done < /tmp/parentload-pids.txt
        rm /tmp/parentload-pids.txt
    fi
    
    # Also kill any remaining processes on our ports
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    lsof -ti:3002 | xargs kill -9 2>/dev/null
    
    # Kill ngrok by name as backup
    pkill -f ngrok 2>/dev/null
    
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup INT

# Keep script running and show status
while true; do
    sleep 5
    
    # Check if services are still running
    if ! kill -0 $REACT_PID 2>/dev/null; then
        echo -e "${RED}⚠️  React app stopped! Check logs: tail -f /tmp/react-app.log${NC}"
    fi
    
    if ! kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${RED}⚠️  Backend server stopped! Check logs: tail -f /tmp/backend-server.log${NC}"
    fi
    
    if ! kill -0 $NGROK_PID 2>/dev/null; then
        echo -e "${RED}⚠️  Ngrok stopped! Check logs: tail -f /tmp/ngrok.log${NC}"
    fi
done