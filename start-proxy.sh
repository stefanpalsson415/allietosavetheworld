#!/bin/bash

# Start the Claude API proxy server
echo "Starting Claude API proxy server..."

# Check if simple-proxy.js exists
if [ -f "src/simple-proxy.js" ]; then
    # Install required dependencies if not already installed
    if ! npm list express cors axios dotenv >/dev/null 2>&1; then
        echo "Installing proxy dependencies..."
        npm install express cors axios dotenv --save-dev
    fi
    
    # Start the proxy server
    node src/simple-proxy.js
else
    echo "Error: simple-proxy.js not found in src/"
    exit 1
fi