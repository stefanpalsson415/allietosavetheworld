#!/bin/bash

# CircleCI Setup - Interactive Guide
# This script walks you through the manual steps needed to complete CircleCI setup

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║     CircleCI Setup - Interactive Configuration            ║${NC}"
echo -e "${BLUE}║     for Allie Project                                     ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI not found!${NC}"
    echo ""
    echo "Install it with:"
    echo "  npm install -g firebase-tools"
    echo ""
    exit 1
fi

# Check if gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${YELLOW}⚠️  Google Cloud SDK not found (optional for Cloud Run deployment)${NC}"
    echo ""
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    echo ""
fi

echo -e "${GREEN}✅ Prerequisites check passed!${NC}"
echo ""
echo "This script will guide you through:"
echo "  1. Generating Firebase CI token"
echo "  2. Creating Google Cloud service account (optional)"
echo "  3. Setting up environment variables for CircleCI"
echo ""

read -p "Press Enter to continue..."
clear

# ============================================================================
# STEP 1: Firebase CI Token
# ============================================================================
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Step 1: Generate Firebase CI Token${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""
echo "This token allows CircleCI to deploy to Firebase Hosting and Functions."
echo ""
echo -e "${YELLOW}IMPORTANT: This will open a browser window for authentication.${NC}"
echo ""

read -p "Press Enter to generate Firebase token..."

# Generate Firebase token
echo ""
echo "Running: firebase login:ci"
echo ""
echo -e "${YELLOW}▶ Follow the browser prompts to authenticate...${NC}"
echo ""

FIREBASE_TOKEN=$(firebase login:ci 2>&1 | tail -1 | grep -o '1//[^ ]*' || echo "")

if [ -z "$FIREBASE_TOKEN" ]; then
    echo -e "${RED}❌ Failed to get Firebase token automatically.${NC}"
    echo ""
    echo "Please run manually in your terminal:"
    echo -e "${YELLOW}  firebase login:ci${NC}"
    echo ""
    echo "Then copy the token and save it as: FIREBASE_TOKEN"
    echo ""
    read -p "Press Enter when you have the token..."
else
    echo ""
    echo -e "${GREEN}✅ Firebase token generated!${NC}"
    echo ""
    echo -e "${YELLOW}FIREBASE_TOKEN:${NC}"
    echo "$FIREBASE_TOKEN"
    echo ""
    echo -e "${RED}⚠️  SAVE THIS TOKEN! You'll need it for CircleCI.${NC}"
    echo ""

    # Save to file
    echo "$FIREBASE_TOKEN" > .firebase-token.txt
    echo -e "${GREEN}Saved to: .firebase-token.txt${NC}"
    echo ""
fi

read -p "Press Enter to continue to Step 2..."
clear

# ============================================================================
# STEP 2: Google Cloud Service Account (Optional)
# ============================================================================
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Step 2: Google Cloud Service Account (Optional)${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""
echo "This is only needed if you want CircleCI to deploy the Cloud Run server."
echo ""
echo -e "${YELLOW}Manual Steps:${NC}"
echo "1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts"
echo "2. Select project: parentload-ba995"
echo "3. Click 'Create Service Account'"
echo "4. Name: circleci-deployer"
echo "5. Grant roles:"
echo "   - Cloud Run Admin"
echo "   - Service Account User"
echo "   - Storage Admin"
echo "   - Container Registry Service Agent"
echo "6. Create JSON key"
echo "7. Download the key file"
echo ""

read -p "Have you created the service account? (y/n): " created_sa

if [ "$created_sa" = "y" ] || [ "$created_sa" = "Y" ]; then
    echo ""
    read -p "Enter the path to your service account JSON file: " sa_file

    if [ -f "$sa_file" ]; then
        echo ""
        echo "Encoding to base64..."
        GCLOUD_SERVICE_KEY=$(cat "$sa_file" | base64 | tr -d '\n')

        echo "$GCLOUD_SERVICE_KEY" > .gcloud-service-key-base64.txt

        echo -e "${GREEN}✅ Service account key encoded!${NC}"
        echo ""
        echo -e "${YELLOW}GCLOUD_SERVICE_KEY (base64):${NC}"
        echo "$GCLOUD_SERVICE_KEY" | head -c 80
        echo "..."
        echo ""
        echo -e "${GREEN}Saved to: .gcloud-service-key-base64.txt${NC}"
        echo ""
        echo -e "${RED}⚠️  IMPORTANT: Delete the JSON file for security!${NC}"
        echo "  rm $sa_file"
        echo ""
    else
        echo -e "${RED}❌ File not found: $sa_file${NC}"
        echo "Skipping service account setup."
    fi
else
    echo ""
    echo "Skipping service account setup."
    echo "You can do this later by following CIRCLECI_SETUP_GUIDE.md"
fi

read -p "Press Enter to continue to Step 3..."
clear

# ============================================================================
# STEP 3: Environment Variables Summary
# ============================================================================
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Step 3: CircleCI Environment Variables${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Now you need to add these environment variables to CircleCI:"
echo ""
echo -e "${YELLOW}1. Go to CircleCI project settings:${NC}"
echo "   https://app.circleci.com/projects"
echo ""
echo -e "${YELLOW}2. Click on your project → Project Settings → Environment Variables${NC}"
echo ""
echo -e "${YELLOW}3. Add the following variables:${NC}"
echo ""

# Create env vars file
cat > .circleci-env-vars.txt <<EOF
# ============================================================================
# CircleCI Environment Variables
# Add these to: CircleCI Project Settings → Environment Variables
# ============================================================================

# Firebase (REQUIRED)
FIREBASE_TOKEN=${FIREBASE_TOKEN:-<see .firebase-token.txt>}

# Google Cloud (REQUIRED for Cloud Run deployment)
GCLOUD_PROJECT_ID=parentload-ba995
GCLOUD_SERVICE_KEY=${GCLOUD_SERVICE_KEY:-<see .gcloud-service-key-base64.txt>}

# Anthropic API (REQUIRED)
ANTHROPIC_API_KEY=<your-anthropic-api-key>

# Firebase Config (REQUIRED for React build)
REACT_APP_FIREBASE_API_KEY=<from Firebase Console>
REACT_APP_FIREBASE_AUTH_DOMAIN=parentload-ba995.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=parentload-ba995
REACT_APP_FIREBASE_STORAGE_BUCKET=parentload-ba995.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=<from Firebase Console>
REACT_APP_FIREBASE_APP_ID=<from Firebase Console>
REACT_APP_FIREBASE_MEASUREMENT_ID=<from Firebase Console>

# Mapbox (REQUIRED)
REACT_APP_MAPBOX_TOKEN=<your-mapbox-token>

# Stripe (REQUIRED)
REACT_APP_STRIPE_PUBLISHABLE_KEY=<your-stripe-publishable-key>
REACT_APP_STRIPE_MONTHLY_PRICE_ID=price_1SLhErKrwosuk0SZe75qGPCC
REACT_APP_STRIPE_ANNUAL_PRICE_ID=price_1SLhGTKrwosuk0SZYGZDu9Gl

# Optional (has defaults)
REACT_APP_BACKEND_URL=https://allie-claude-api-363935868004.us-central1.run.app
REACT_APP_CLAUDE_URL=https://allie-claude-api-363935868004.us-central1.run.app/api/claude

# Optional (for Knowledge Graph)
NEO4J_URI=neo4j+s://c82dff38.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=<your-neo4j-password>

# Optional (for Slack notifications)
SLACK_WEBHOOK=<your-slack-webhook-url>
EOF

echo -e "${GREEN}✅ Environment variables template created!${NC}"
echo ""
echo -e "${GREEN}Saved to: .circleci-env-vars.txt${NC}"
echo ""
echo "Review this file and add the variables to CircleCI."
echo ""

read -p "Press Enter to see the final checklist..."
clear

# ============================================================================
# FINAL CHECKLIST
# ============================================================================
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Final Checklist${NC}"
echo -e "${BLUE}══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Files created:"
echo -e "${GREEN}  ✓${NC} .firebase-token.txt (keep this private!)"
if [ -f ".gcloud-service-key-base64.txt" ]; then
    echo -e "${GREEN}  ✓${NC} .gcloud-service-key-base64.txt (keep this private!)"
fi
echo -e "${GREEN}  ✓${NC} .circleci-env-vars.txt (reference for CircleCI setup)"
echo ""

echo "Next steps:"
echo ""
echo -e "${YELLOW}1. Connect GitHub to CircleCI:${NC}"
echo "   - Go to: https://app.circleci.com/projects"
echo "   - Find: parentload-clean"
echo "   - Click: Set Up Project → Use existing config"
echo ""

echo -e "${YELLOW}2. Add environment variables:${NC}"
echo "   - Use the values from: .circleci-env-vars.txt"
echo "   - Add them to: CircleCI Project Settings → Environment Variables"
echo ""

echo -e "${YELLOW}3. Push to GitHub:${NC}"
echo "   git push origin main"
echo ""

echo -e "${YELLOW}4. Watch your first build:${NC}"
echo "   - CircleCI will automatically trigger on push"
echo "   - Check: https://app.circleci.com"
echo ""

echo -e "${YELLOW}5. Set up branch protection (optional but recommended):${NC}"
echo "   - GitHub repo → Settings → Branches"
echo "   - Add rule for 'main' branch"
echo "   - Require status checks: ci/circleci: build"
echo ""

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║     CircleCI Setup Complete! 🎉                           ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "For detailed instructions, see:"
echo "  - CIRCLECI_SETUP_COMPLETE.md (quick start)"
echo "  - CIRCLECI_SETUP_GUIDE.md (comprehensive guide)"
echo ""

# Security reminder
echo -e "${RED}⚠️  SECURITY REMINDER:${NC}"
echo "The following files contain sensitive information:"
echo "  - .firebase-token.txt"
echo "  - .gcloud-service-key-base64.txt"
echo "  - .circleci-env-vars.txt"
echo ""
echo "These files are already in .gitignore and will NOT be committed."
echo "Store them securely and delete them after adding to CircleCI."
echo ""
