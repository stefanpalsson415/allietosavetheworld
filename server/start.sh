#!/bin/bash
# Start the backend server
cd "$(dirname "$0")"
echo "Starting Parentload backend server..."
node test-server.js &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"
echo "To stop: kill $SERVER_PID"
echo ""
echo "Testing endpoints..."
sleep 2
echo "Test endpoint:"
curl -s http://localhost:3001/api/test | jq .
echo ""
echo "Twilio config:"
curl -s -X POST http://localhost:3001/api/twilio/test | jq .
echo ""
echo "SendGrid config:"
curl -s -X POST http://localhost:3001/api/sendgrid/test | jq .