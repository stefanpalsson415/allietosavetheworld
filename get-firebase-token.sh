#!/bin/bash

# Quick Firebase CI Token Generator
# This opens a browser for authentication

echo "🔥 Generating Firebase CI Token..."
echo ""
echo "This will open a browser window for authentication."
echo "Copy the token that appears after 'Success! Use this token:'"
echo ""

firebase login:ci

echo ""
echo "✅ Token generated!"
echo ""
echo "Next steps:"
echo "1. Copy the token above (starts with 1//0...)"
echo "2. Open .circleci-env-vars.txt"
echo "3. Replace <PASTE_TOKEN_HERE_AFTER_RUNNING_setup-circleci.sh> with your token"
echo "4. Go to CircleCI and add all variables from that file"
echo ""
