#!/bin/bash

# Start the simple backend server with Claude integration
echo "🚀 Starting Parentload Backend Server..."
echo "============================================"
echo ""

# Change to server directory
cd "$(dirname "$0")"

# Load environment variables
if [ -f ../.env ]; then
  export $(cat ../.env | grep -v '^#' | xargs)
fi

# Check if Claude API key is configured
if [ -z "$REACT_APP_CLAUDE_API_KEY" ]; then
  echo "⚠️  WARNING: Claude API key not found in .env file"
  echo "   Add REACT_APP_CLAUDE_API_KEY=your_key_here to .env file"
  echo ""
fi

# Start the server
echo "Starting server on port 3002..."
node server-simple.js