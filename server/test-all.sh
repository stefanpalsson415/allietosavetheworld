#!/bin/bash

echo "🚀 Starting Parentload Backend Server..."
echo ""

# Start server in background
node server-simple.js &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 2

# Test the server
echo ""
echo "🧪 Running tests..."
echo ""

# Test 1: Server health
echo "1️⃣ Testing server health..."
curl -s http://localhost:3001/api/test | python3 -m json.tool
echo ""

# Test 2: SendGrid config
echo "2️⃣ Testing SendGrid configuration..."
curl -s -X POST http://localhost:3001/api/sendgrid/test | python3 -m json.tool
echo ""

# Test 3: Send OTP (development mode)
echo "3️⃣ Testing OTP send (dev mode)..."
curl -s -X POST http://localhost:3001/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","userName":"Test User"}' | python3 -m json.tool
echo ""

# Kill the server
echo "🛑 Stopping server..."
kill $SERVER_PID

echo ""
echo "✅ Tests complete!"