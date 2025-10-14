#!/bin/bash

# Parentload Server Management Script
# Handles both local server and ngrok tunnel with custom domain

# Configuration
NGROK_DOMAIN="tunnel.checkallie.com"
SERVER_PORT=3002
REACT_PORT=3000

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to kill process on port
kill_port() {
    local port=$1
    lsof -ti:$port | xargs kill -9 2>/dev/null
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to start local server
start_server() {
    echo -e "${YELLOW}Starting Parentload backend server...${NC}"
    
    # Kill any existing process
    kill_port $SERVER_PORT
    
    # Start server
    cd "/Users/stefanpalsson/parentload copy/parentload-clean/server"
    PORT=$SERVER_PORT node index.js &
    SERVER_PID=$!
    
    sleep 2
    
    # Check if server started
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo -e "${GREEN}✓ Backend server started on port $SERVER_PORT (PID: $SERVER_PID)${NC}"
    else
        echo -e "${RED}✗ Failed to start backend server${NC}"
        exit 1
    fi
}

# Function to start ngrok
start_ngrok() {
    echo -e "${YELLOW}Starting ngrok tunnel...${NC}"
    
    # Check if ngrok is installed
    if ! command_exists ngrok; then
        echo -e "${RED}✗ ngrok is not installed${NC}"
        echo "Install ngrok from: https://ngrok.com/download"
        exit 1
    fi
    
    # Kill any existing ngrok
    pkill -f ngrok 2>/dev/null
    
    # Start ngrok with custom domain
    ngrok http $SERVER_PORT --domain=$NGROK_DOMAIN &
    NGROK_PID=$!
    
    sleep 3
    
    # Check if ngrok started
    if kill -0 $NGROK_PID 2>/dev/null; then
        echo -e "${GREEN}✓ ngrok tunnel started with domain: https://$NGROK_DOMAIN${NC}"
    else
        echo -e "${RED}✗ Failed to start ngrok${NC}"
        exit 1
    fi
}

# Function to show status
show_status() {
    echo -e "\n${GREEN}============================================${NC}"
    echo -e "${GREEN}Parentload Services Status${NC}"
    echo -e "${GREEN}============================================${NC}"
    
    # Check backend server
    if lsof -i:$SERVER_PORT >/dev/null 2>&1; then
        echo -e "Backend Server: ${GREEN}✓ Running${NC} on port $SERVER_PORT"
    else
        echo -e "Backend Server: ${RED}✗ Not running${NC}"
    fi
    
    # Check ngrok
    if pgrep -f ngrok >/dev/null; then
        echo -e "ngrok Tunnel:   ${GREEN}✓ Running${NC} at https://$NGROK_DOMAIN"
    else
        echo -e "ngrok Tunnel:   ${RED}✗ Not running${NC}"
    fi
    
    echo -e "\n${YELLOW}Webhook URLs:${NC}"
    echo -e "SendGrid Email:   ${GREEN}https://$NGROK_DOMAIN/api/emails/inbound${NC}"
    echo -e "Twilio SMS/MMS:   ${GREEN}https://$NGROK_DOMAIN/api/sms/inbound${NC}"
    echo -e "ngrok Inspector:  ${GREEN}http://localhost:4040${NC}"
    
    echo -e "\n${YELLOW}Local URLs:${NC}"
    echo -e "Backend API:      ${GREEN}http://localhost:$SERVER_PORT${NC}"
    echo -e "React Frontend:   ${GREEN}http://localhost:$REACT_PORT${NC}"
    echo -e "${GREEN}============================================${NC}\n"
}

# Function to stop all services
stop_all() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    
    # Kill backend server
    kill_port $SERVER_PORT
    echo -e "${GREEN}✓ Backend server stopped${NC}"
    
    # Kill ngrok
    pkill -f ngrok 2>/dev/null
    echo -e "${GREEN}✓ ngrok stopped${NC}"
}

# Function to test webhooks
test_webhooks() {
    echo -e "\n${YELLOW}Testing webhook endpoints...${NC}"
    
    # Test main server
    echo -e "\nTesting server connection..."
    curl -k -s https://$NGROK_DOMAIN/api/test | jq '.' || echo "Server test failed"
    
    # Test SMS endpoint
    echo -e "\nTesting SMS endpoint..."
    curl -k -s https://$NGROK_DOMAIN/api/sms/test | jq '.' || echo "SMS endpoint test failed"
    
    # Test email endpoint
    echo -e "\nTesting email endpoint..."
    curl -k -s https://$NGROK_DOMAIN/api/emails/test | jq '.' || echo "Email endpoint test failed"
}

# Main script
case "$1" in
    start)
        echo -e "${GREEN}Starting Parentload services...${NC}"
        start_server
        start_ngrok
        show_status
        ;;
    
    stop)
        stop_all
        ;;
    
    restart)
        stop_all
        sleep 2
        start_server
        start_ngrok
        show_status
        ;;
    
    status)
        show_status
        ;;
    
    test)
        test_webhooks
        ;;
    
    logs)
        echo -e "${YELLOW}Showing server logs...${NC}"
        echo "Press Ctrl+C to exit"
        tail -f /tmp/parentload-server.log 2>/dev/null || echo "No logs available"
        ;;
    
    *)
        echo "Usage: $0 {start|stop|restart|status|test|logs}"
        echo ""
        echo "Commands:"
        echo "  start   - Start backend server and ngrok tunnel"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        echo "  status  - Show service status and URLs"
        echo "  test    - Test webhook endpoints"
        echo "  logs    - Show server logs"
        exit 1
        ;;
esac