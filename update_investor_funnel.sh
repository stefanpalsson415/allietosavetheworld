#!/bin/bash

# Create a backup of the original file
cp "/Users/stefanpalsson/parentload copy/2/components/marketing/InvestorFunnel.jsx" "/Users/stefanpalsson/parentload copy/2/components/marketing/InvestorFunnel.jsx.bak"

# Replace the original with our refactored version
cp "/Users/stefanpalsson/parentload copy/2/components/marketing/InvestorFunnelRefactored.jsx" "/Users/stefanpalsson/parentload copy/2/components/marketing/InvestorFunnel.jsx"

echo "InvestorFunnel component has been replaced with the refactored version."
echo "A backup of the original file is available at: /Users/stefanpalsson/parentload copy/2/components/marketing/InvestorFunnel.jsx.bak"