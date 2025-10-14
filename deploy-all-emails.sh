#!/bin/bash

echo "🚀 DEPLOYING ALL EMAIL UPDATES TO CLOUD RUN"
echo "==========================================="
echo ""
echo "This will deploy:"
echo "✅ Beautiful OTP verification email template"
echo "✅ 5-email onboarding sequence for new families"
echo "✅ Welcome email improvements"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check authentication
echo -e "${YELLOW}Step 1: Checking Google Cloud authentication...${NC}"
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &>/dev/null; then
    echo -e "${RED}⚠️  Not authenticated with Google Cloud${NC}"
    echo "Please run: gcloud auth login"
    echo "Then run this script again"
    exit 1
fi
echo -e "${GREEN}✅ Authenticated with Google Cloud${NC}"
echo ""

# Step 2: Set project
echo -e "${YELLOW}Step 2: Setting project...${NC}"
gcloud config set project parentload-ba995
echo -e "${GREEN}✅ Project set to parentload-ba995${NC}"
echo ""

# Step 3: Deploy to Cloud Run
echo -e "${YELLOW}Step 3: Deploying backend to Cloud Run...${NC}"
echo "This may take 2-3 minutes..."
echo ""

cd server

# Build and deploy
gcloud run deploy parentload-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --project parentload-ba995 \
  --memory 512Mi \
  --timeout 60 \
  --quiet

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
    echo ""
    echo "✨ What's New:"
    echo ""
    echo "1️⃣  ${GREEN}Beautiful OTP Email${NC}"
    echo "   - Clean, modern design"
    echo "   - Purple/pink gradient matching Allie brand"
    echo "   - Works on all email clients"
    echo ""
    echo "2️⃣  ${GREEN}5-Email Onboarding Sequence${NC}"
    echo "   Email 1: Welcome - The 10-Second Scheduler"
    echo "   Email 2: Calendar Merge Magic"
    echo "   Email 3: The Fairness Engine"
    echo "   Email 4: Memory Vault"
    echo "   Email 5: Family Superpower Unlocked"
    echo ""
    echo "📧 ${YELLOW}Testing the New Emails:${NC}"
    echo ""
    echo "1. Test OTP Email:"
    echo "   - Go to your app and request a verification code"
    echo "   - Check your email for the beautiful new design"
    echo ""
    echo "2. Test Onboarding Sequence:"
    echo "   - New families will automatically get the 5-email sequence"
    echo "   - Emails sent on days 0, 2, 4, 7, and 10"
    echo ""
    echo "🔗 Backend URL: https://parentload-backend-363935868004.us-central1.run.app"
    echo ""
    echo "📊 ${YELLOW}What to Monitor:${NC}"
    echo "   - Email open rates (target: 60%+)"
    echo "   - Click rates (target: 20%+)"
    echo "   - Feature adoption after each email"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo ""
    echo "Please try:"
    echo "1. Run: gcloud auth login"
    echo "2. Make sure you have the right permissions"
    echo "3. Check if the project ID is correct"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ All email templates are now live!${NC}"
echo ""
echo "The voice of Allie is now:"
echo "• Warm and understanding"
echo "• Smart and helpful"
echo "• Absolutely on parents' side"
echo ""
echo "Happy emailing! 💌"