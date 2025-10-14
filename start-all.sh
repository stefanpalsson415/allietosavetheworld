#!/bin/bash

# This script starts both the proxy server and the React app

# Display information about the setup
echo "================================="
echo "Starting development environment"
echo "================================="
echo "1. Checking .env file..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "ERROR: .env file not found!"
  echo "Please create a .env file with your Claude API key:"
  echo "REACT_APP_CLAUDE_API_KEY=your_api_key_here"
  echo "REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here"
  exit 1
fi

# Check if API key is in .env file
if ! grep -q "REACT_APP_CLAUDE_API_KEY" .env; then
  echo "ERROR: No Claude API key found in .env file!"
  echo "Please add your Claude API key to the .env file:"
  echo "REACT_APP_CLAUDE_API_KEY=your_api_key_here"
  exit 1
fi

echo "2. Starting Claude proxy server..."
# Start the proxy server in the background
node src/simple-proxy.js &
PROXY_PID=$!

# Wait a moment for the proxy to start
sleep 2

echo "3. Testing proxy connection..."
# Test if the proxy is running
curl -s http://localhost:3001/api/claude/test > /dev/null
if [ $? -ne 0 ]; then
  echo "ERROR: Failed to connect to proxy server!"
  echo "Make sure port 3001 is not in use by another application."
  kill $PROXY_PID
  exit 1
fi

echo "4. Starting React development server..."
# Start the React app
npm start

# When the React app is stopped, also stop the proxy server
kill $PROXY_PID
echo "All processes stopped."