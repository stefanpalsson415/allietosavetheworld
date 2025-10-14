#!/bin/bash

# Simple startup script for Parentload
# This starts all servers without the complex manage-servers.sh

echo "🚀 Starting Parentload Services..."
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Kill any existing processes on our ports
echo -e "${YELLOW}Cleaning up old processes...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
sleep 2

echo ""
echo -e "${GREEN}Starting services...${NC}"
echo ""

# 1. Start Claude Proxy (Port 3001)
echo -e "${BLUE}1. Starting Claude Proxy on port 3001...${NC}"
node src/simple-proxy.js > /tmp/proxy.log 2>&1 &
PROXY_PID=$!
echo "   PID: $PROXY_PID"

# 2. Start Backend Server (Port 3002)
echo -e "${BLUE}2. Starting Backend Server on port 3002...${NC}"
cd server
PORT=3002 node server-simple.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "   PID: $BACKEND_PID"
cd ..

# 3. Start ngrok tunnel for webhooks
echo -e "${BLUE}3. Starting ngrok tunnel (tunnel.checkallie.com)...${NC}"
ngrok http 3002 --domain=tunnel.checkallie.com > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!
echo "   PID: $NGROK_PID"
sleep 3  # Give ngrok time to start

# 4. Start React App (Port 3000)
echo -e "${BLUE}4. Starting React App on port 3000...${NC}"
export TSC_COMPILE_ON_ERROR=true
export SKIP_PREFLIGHT_CHECK=true
npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   PID: $FRONTEND_PID"

echo ""
echo -e "${GREEN}All services started!${NC}"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🤖 Claude Proxy: http://localhost:3001"
echo "🔧 Backend API: http://localhost:3002"
echo "🌐 Email Webhook: https://tunnel.checkallie.com"
echo "🔍 ngrok Inspector: http://localhost:4040"
echo ""
echo "📄 Log files:"
echo "   Frontend: tail -f /tmp/frontend.log"
echo "   Backend: tail -f /tmp/backend.log"
echo "   Proxy: tail -f /tmp/proxy.log"
echo "   ngrok: tail -f /tmp/ngrok.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${RED}Stopping all services...${NC}"
    kill $FRONTEND_PID $BACKEND_PID $PROXY_PID $NGROK_PID 2>/dev/null
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    killall ngrok 2>/dev/null || true
    echo -e "${GREEN}All services stopped${NC}"
    exit 0
}

# Set trap to cleanup on Ctrl+C
trap cleanup INT

# Wait for all background processes
wait