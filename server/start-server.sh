#!/bin/bash

# Kill any existing process on port 3002
lsof -ti:3002 | xargs kill -9 2>/dev/null

# Change to server directory
cd "/Users/stefanpalsson/parentload copy/parentload-clean/server"

# Start the server on port 3002
PORT=3002 node server-simple.js