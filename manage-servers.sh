#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_DIR="/Users/stefanpalsson/parentload copy/parentload-clean"

# Load environment variables if .env.local exists
if [ -f "$PROJECT_DIR/.env.local" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env.local" | xargs)
fi

# Also load server/.env for NGROK_DOMAIN and other server configs
if [ -f "$PROJECT_DIR/server/.env" ]; then
    # Load environment variables more safely
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        if [[ ! "$key" =~ ^# ]] && [[ -n "$key" ]]; then
            # Remove any trailing comments from the value
            value="${value%%#*}"
            # Trim whitespace
            value="${value#"${value%%[![:space:]]*}"}"
            value="${value%"${value##*[![:space:]]}"}"
            # Export the variable
            export "$key=$value"
        fi
    done < "$PROJECT_DIR/server/.env"
fi

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}Killing processes on port $port...${NC}"
        kill -9 $pids 2>/dev/null
        sleep 1
    fi
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Port $port is in use"
        return 0
    else
        echo -e "${RED}✗${NC} Port $port is free"
        return 1
    fi
}

# Function to show status
show_status() {
    echo -e "\n${BLUE}=== Server Status ===${NC}"
    echo -e "${YELLOW}Port 3000${NC} - React App"
    check_port 3000
    echo -e "${YELLOW}Port 3001${NC} - Claude API Proxy"
    check_port 3001
    echo -e "${YELLOW}Port 3002${NC} - Backend Server (Email/SMS)"
    check_port 3002
    echo -e "${YELLOW}Port 4040${NC} - Ngrok Web UI"
    check_port 4040
    
    # Show ngrok URL if available
    if check_port 4040 >/dev/null 2>&1; then
        echo -e "\n${BLUE}Ngrok URL:${NC}"
        curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*\.app' | head -1 || echo "Unable to fetch URL"
    fi
}

# Function to stop all servers
stop_all() {
    echo -e "\n${RED}=== Stopping All Servers ===${NC}"
    
    # Kill specific ports
    kill_port 3000
    kill_port 3001
    kill_port 3002
    kill_port 4040
    
    # Kill by process name
    pkill -f "npm start" 2>/dev/null
    pkill -f "react-scripts" 2>/dev/null
    pkill -f "node.*server-simple.js" 2>/dev/null
    pkill -f "node.*simple-proxy.js" 2>/dev/null
    pkill -f "node src/simple-proxy.js" 2>/dev/null
    pkill -f ngrok 2>/dev/null
    
    echo -e "${GREEN}All servers stopped${NC}"
}

# Function to start all servers
start_all() {
    echo -e "\n${GREEN}=== Starting All Servers ===${NC}"
    
    # Start Claude proxy server on 3001
    echo -e "${BLUE}Starting Claude proxy server on port 3001...${NC}"
    cd "$PROJECT_DIR"
    node src/simple-proxy.js > /tmp/parentload-proxy.log 2>&1 &
    echo "Proxy PID: $!"
    
    sleep 3
    
    # Start React app (will use proxy on 3001)
    echo -e "${BLUE}Starting React App on port 3000...${NC}"
    cd "$PROJECT_DIR"
    # Set environment variables to handle TypeScript issues
    export TSC_COMPILE_ON_ERROR=true
    export SKIP_PREFLIGHT_CHECK=true
    npm start > /tmp/parentload-react.log 2>&1 &
    echo "React PID: $!"
    
    sleep 5
    
    # Start backend server on 3002
    echo -e "${BLUE}Starting Backend Server on port 3002...${NC}"
    cd "$PROJECT_DIR/server"
    PORT=3002 node server-simple.js > /tmp/parentload-backend.log 2>&1 &
    echo "Backend PID: $!"
    
    sleep 3
    
    # Start ngrok with fixed domain
    echo -e "${BLUE}Starting Ngrok tunnel to port 3002...${NC}"
    
    # Check if we have a custom domain set
    if [ ! -z "$NGROK_DOMAIN" ]; then
        echo -e "${YELLOW}Using fixed domain: $NGROK_DOMAIN${NC}"
        ngrok http 3002 --domain=$NGROK_DOMAIN > /tmp/parentload-ngrok.log 2>&1 &
        TUNNEL_URL="https://$NGROK_DOMAIN"
    else
        # Fallback to dynamic URL
        ngrok http 3002 > /tmp/parentload-ngrok.log 2>&1 &
        sleep 5
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok[^"]*\.app' | head -1)
        TUNNEL_URL=$NGROK_URL
    fi
    
    echo "Ngrok PID: $!"
    sleep 3
    
    echo -e "\n${GREEN}=== All Services Started ===${NC}"
    echo -e "${BLUE}React App:${NC} http://localhost:3000"
    echo -e "${BLUE}Claude Proxy:${NC} http://localhost:3001"
    echo -e "${BLUE}Backend API:${NC} http://localhost:3002"
    echo -e "${BLUE}Tunnel URL:${NC} ${TUNNEL_URL:-'Starting...'}"
    echo -e "\n${YELLOW}Update SendGrid webhook to:${NC} ${TUNNEL_URL}/api/emails/inbound"
}

# Function to show logs
show_logs() {
    echo -e "\n${BLUE}=== Log Files ===${NC}"
    echo "React: tail -f /tmp/parentload-react.log"
    echo "Claude Proxy: tail -f /tmp/parentload-proxy.log"
    echo "Backend: tail -f /tmp/parentload-backend.log"
    echo "Ngrok: tail -f /tmp/parentload-ngrok.log"
}

# Main menu
case "$1" in
    start)
        stop_all
        start_all
        show_logs
        ;;
    stop)
        stop_all
        ;;
    status)
        show_status
        ;;
    restart)
        stop_all
        sleep 2
        start_all
        show_logs
        ;;
    logs)
        show_logs
        ;;
    *)
        echo -e "${BLUE}Parentload Server Manager${NC}"
        echo -e "${YELLOW}Usage:${NC} $0 {start|stop|status|restart|logs}"
        echo ""
        echo "  start   - Stop all servers and start fresh"
        echo "  stop    - Stop all running servers"
        echo "  status  - Show status of all servers"
        echo "  restart - Restart all servers"
        echo "  logs    - Show log file locations"
        echo ""
        show_status
        ;;
esac