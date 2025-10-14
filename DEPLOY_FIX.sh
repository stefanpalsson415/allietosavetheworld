#!/bin/bash

# Critical Fix Deployment Script
# Run this to deploy the circular dependency fix

echo "🔧 Deploying critical bug fix..."
echo ""
echo "Fix Details:"
echo "- Added null safety checks to useEventPrompts hook"
echo "- Lines 162-164: Check if setInput exists before calling"
echo "- Lines 166-171: Check if handleSend exists before calling"
echo ""

# Re-authenticate if needed
firebase login --reauth

# Deploy to production
firebase deploy --only hosting

echo ""
echo "✅ Deployment complete!"
echo "🌐 Check: https://checkallie.com"
echo "📊 Monitor console for errors"
