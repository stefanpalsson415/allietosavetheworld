#!/bin/bash

# Restart script for the development server and proxy
echo "🔄 Stopping any running proxy server..."
pkill -f "node.*simple-proxy.js" || echo "No running proxy server found"

echo "🔄 Starting proxy server in the background..."
cd "$(dirname "$0")"
node src/simple-proxy.js > proxy.log 2>&1 &
PROXY_PID=$!

echo "✅ Proxy server started with PID: $PROXY_PID"
echo "📝 Logs are being written to: proxy.log"

echo "🌐 Proxy server running at http://localhost:3001"
echo "📝 You can view logs with: tail -f proxy.log"
echo "🔍 Testing Claude API connection..."

sleep 2
curl -s "http://localhost:3001/api/claude/test" -H "Content-Type: application/json" | jq || echo "❌ API test failed, check proxy.log for details"

echo "🚀 All done! Your services are ready."
echo "✨ To test chat, restart the React app if necessary with: npm start"