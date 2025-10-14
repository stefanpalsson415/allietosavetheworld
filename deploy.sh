#!/bin/bash

# Firebase Deployment Script for Parentload
# This script builds and deploys your React app to Firebase

echo "🚀 Starting Parentload Firebase Deployment..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command was successful
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 successful${NC}"
    else
        echo -e "${RED}✗ $1 failed${NC}"
        exit 1
    fi
}

# 1. Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Installing dependencies...${NC}"
npm install --legacy-peer-deps
check_status "Dependency installation"

echo -e "\n${YELLOW}Step 2: Running tests...${NC}"
# Uncomment if you want to run tests before deploying
# npm test -- --watchAll=false
# check_status "Tests"

echo -e "\n${YELLOW}Step 3: Building production version...${NC}"
npm run build
check_status "Build"

echo -e "\n${YELLOW}Step 4: Checking Firebase login...${NC}"
firebase login:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}You need to login to Firebase${NC}"
    firebase login
fi

# Ask what to deploy
echo -e "\n${YELLOW}What would you like to deploy?${NC}"
echo "1) Everything (hosting + functions + firestore rules)"
echo "2) Hosting only (React app)"
echo "3) Functions only"
echo "4) Firestore rules only"
echo "5) Preview deployment (creates a preview URL)"
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}Step 5: Deploying everything to Firebase...${NC}"
        firebase deploy
        check_status "Full deployment"
        ;;
    2)
        echo -e "\n${YELLOW}Step 5: Deploying hosting only...${NC}"
        firebase deploy --only hosting
        check_status "Hosting deployment"
        ;;
    3)
        echo -e "\n${YELLOW}Step 5: Deploying functions only...${NC}"
        firebase deploy --only functions
        check_status "Functions deployment"
        ;;
    4)
        echo -e "\n${YELLOW}Step 5: Deploying Firestore rules only...${NC}"
        firebase deploy --only firestore:rules
        check_status "Firestore rules deployment"
        ;;
    5)
        echo -e "\n${YELLOW}Step 5: Creating preview deployment...${NC}"
        firebase hosting:channel:deploy preview
        check_status "Preview deployment"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}=========================================="
echo -e "🎉 Deployment Complete!"
echo -e "==========================================${NC}"
echo -e "\nYour site is available at:"
echo -e "${GREEN}https://parentload-ba995.web.app${NC}"
echo -e "${GREEN}https://parentload-ba995.firebaseapp.com${NC}"
echo -e "\nFirebase Console:"
echo -e "${GREEN}https://console.firebase.google.com/project/parentload-ba995/overview${NC}"