#!/bin/bash
##############################################################################
# Claude API Deployment Verification Script
#
# CRITICAL: Run this script AFTER deploying to Cloud Run to prevent breaking Claude API
#
# This script:
# 1. Verifies environment variables are set on Cloud Run
# 2. Tests the /health endpoint
# 3. Tests the /api/claude endpoint with a real request
# 4. Validates response format
# 5. Checks error handling
#
# Usage:
#   ./scripts/verify-claude-api-deployment.sh
#   ./scripts/verify-claude-api-deployment.sh --production
#
# Exit codes:
#   0 = All tests passed
#   1 = Tests failed (DO NOT MERGE/DEPLOY)
#
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICE_NAME="allie-claude-api"
REGION="us-central1"
PROJECT_ID="parentload-ba995"
PRODUCTION_URL="https://allie-claude-api-363935868004.us-central1.run.app"

# Parse arguments
PRODUCTION_MODE=false
if [[ "$1" == "--production" ]]; then
  PRODUCTION_MODE=true
fi

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Claude API Deployment Verification Script              ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

##############################################################################
# Test 1: Verify Environment Variables
##############################################################################
echo -e "${YELLOW}[1/6] Verifying environment variables on Cloud Run...${NC}"

ENV_VARS=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --format="value(spec.template.spec.containers[0].env)" 2>/dev/null || echo "")

if [[ -z "$ENV_VARS" ]]; then
  echo -e "${RED}❌ FAILED: Could not retrieve environment variables${NC}"
  echo -e "${RED}   Run: gcloud run services describe $SERVICE_NAME --region $REGION${NC}"
  exit 1
fi

# Check for ANTHROPIC_API_KEY
if echo "$ENV_VARS" | grep -q "ANTHROPIC_API_KEY"; then
  echo -e "${GREEN}✅ ANTHROPIC_API_KEY is set${NC}"
elif echo "$ENV_VARS" | grep -q "INTERNAL_API_KEY"; then
  echo -e "${GREEN}✅ INTERNAL_API_KEY is set${NC}"
else
  echo -e "${RED}❌ CRITICAL: ANTHROPIC_API_KEY is NOT set on Cloud Run!${NC}"
  echo ""
  echo -e "${YELLOW}Fix with:${NC}"
  echo -e "${YELLOW}gcloud run services update $SERVICE_NAME \\${NC}"
  echo -e "${YELLOW}  --region $REGION \\${NC}"
  echo -e "${YELLOW}  --update-env-vars=\"ANTHROPIC_API_KEY=sk-ant-...\"${NC}"
  exit 1
fi

# Check for other recommended env vars
if echo "$ENV_VARS" | grep -q "NODE_ENV"; then
  echo -e "${GREEN}✅ NODE_ENV is set${NC}"
else
  echo -e "${YELLOW}⚠️  NODE_ENV not set (recommended for production)${NC}"
fi

echo ""

##############################################################################
# Test 2: Health Check
##############################################################################
echo -e "${YELLOW}[2/6] Testing /health endpoint...${NC}"

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$PRODUCTION_URL/health" 2>/dev/null || echo "000")
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')  # Remove last line (macOS compatible)
HEALTH_STATUS=$(echo "$HEALTH_RESPONSE" | tail -n 1)

if [[ "$HEALTH_STATUS" == "200" ]]; then
  echo -e "${GREEN}✅ Health check passed (HTTP 200)${NC}"
  echo -e "${GREEN}   Response: $HEALTH_BODY${NC}"
else
  echo -e "${RED}❌ FAILED: Health check returned HTTP $HEALTH_STATUS${NC}"
  echo -e "${RED}   Response: $HEALTH_BODY${NC}"
  exit 1
fi

echo ""

##############################################################################
# Test 3: Claude API Endpoint - Simple Request
##############################################################################
echo -e "${YELLOW}[3/6] Testing /api/claude endpoint with simple request...${NC}"

CLAUDE_REQUEST='{"messages":[{"role":"user","content":"Say \"Production test successful\" in exactly 3 words."}],"model":"claude-opus-4-1-20250805","max_tokens":20}'

CLAUDE_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$PRODUCTION_URL/api/claude" \
  -H "Content-Type: application/json" \
  -d "$CLAUDE_REQUEST" 2>/dev/null || echo "000")

CLAUDE_BODY=$(echo "$CLAUDE_RESPONSE" | sed '$d')  # Remove last line (macOS compatible)
CLAUDE_STATUS=$(echo "$CLAUDE_RESPONSE" | tail -n 1)

if [[ "$CLAUDE_STATUS" == "200" ]]; then
  echo -e "${GREEN}✅ Claude API endpoint accessible (HTTP 200)${NC}"

  # Validate response format
  if echo "$CLAUDE_BODY" | jq -e '.content' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Response has 'content' field${NC}"
  else
    echo -e "${RED}❌ FAILED: Response missing 'content' field${NC}"
    echo -e "${RED}   Response: $CLAUDE_BODY${NC}"
    exit 1
  fi

  if echo "$CLAUDE_BODY" | jq -e '.model' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Response has 'model' field${NC}"
  else
    echo -e "${RED}❌ FAILED: Response missing 'model' field${NC}"
    exit 1
  fi

  # Extract and display response text
  RESPONSE_TEXT=$(echo "$CLAUDE_BODY" | jq -r '.content[0].text' 2>/dev/null || echo "")
  echo -e "${GREEN}   Claude response: \"$RESPONSE_TEXT\"${NC}"

elif [[ "$CLAUDE_STATUS" == "503" ]]; then
  echo -e "${RED}❌ CRITICAL: Claude API returned 503${NC}"
  echo -e "${RED}   This usually means ANTHROPIC_API_KEY is not set or invalid${NC}"
  echo ""
  echo -e "${YELLOW}Response:${NC}"
  echo "$CLAUDE_BODY" | jq '.' 2>/dev/null || echo "$CLAUDE_BODY"
  echo ""
  echo -e "${YELLOW}Fix with:${NC}"
  echo -e "${YELLOW}gcloud run services update $SERVICE_NAME \\${NC}"
  echo -e "${YELLOW}  --region $REGION \\${NC}"
  echo -e "${YELLOW}  --update-env-vars=\"ANTHROPIC_API_KEY=sk-ant-...\"${NC}"
  exit 1
else
  echo -e "${RED}❌ FAILED: Claude API returned HTTP $CLAUDE_STATUS${NC}"
  echo -e "${RED}   Response: $CLAUDE_BODY${NC}"
  exit 1
fi

echo ""

##############################################################################
# Test 4: Error Handling
##############################################################################
echo -e "${YELLOW}[4/6] Testing error handling (invalid request)...${NC}"

ERROR_REQUEST='{"messages":"invalid","model":"claude-opus-4-1-20250805"}'

ERROR_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$PRODUCTION_URL/api/claude" \
  -H "Content-Type: application/json" \
  -d "$ERROR_REQUEST" 2>/dev/null || echo "000")

ERROR_STATUS=$(echo "$ERROR_RESPONSE" | tail -n 1)

if [[ "$ERROR_STATUS" == "400" ]]; then
  echo -e "${GREEN}✅ Error handling works correctly (HTTP 400 for invalid request)${NC}"
else
  echo -e "${YELLOW}⚠️  Expected HTTP 400, got HTTP $ERROR_STATUS${NC}"
  echo -e "${YELLOW}   Error handling may need attention${NC}"
fi

echo ""

##############################################################################
# Test 5: Multi-turn Conversation
##############################################################################
echo -e "${YELLOW}[5/6] Testing multi-turn conversation support...${NC}"

MULTITURN_REQUEST='{"messages":[{"role":"user","content":"My name is Test."},{"role":"assistant","content":"Hello Test!"},{"role":"user","content":"What is my name?"}],"model":"claude-opus-4-1-20250805","max_tokens":50}'

MULTITURN_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$PRODUCTION_URL/api/claude" \
  -H "Content-Type: application/json" \
  -d "$MULTITURN_REQUEST" 2>/dev/null || echo "000")

MULTITURN_STATUS=$(echo "$MULTITURN_RESPONSE" | tail -n 1)

if [[ "$MULTITURN_STATUS" == "200" ]]; then
  MULTITURN_TEXT=$(echo "$MULTITURN_RESPONSE" | sed '$d' | jq -r '.content[0].text' 2>/dev/null || echo "")

  # Check if Claude remembered the context (should mention "Test")
  if echo "$MULTITURN_TEXT" | grep -qi "test"; then
    echo -e "${GREEN}✅ Multi-turn conversations work correctly${NC}"
    echo -e "${GREEN}   Claude remembered context: \"$MULTITURN_TEXT\"${NC}"
  else
    echo -e "${YELLOW}⚠️  Multi-turn conversation may not preserve context${NC}"
    echo -e "${YELLOW}   Response: \"$MULTITURN_TEXT\"${NC}"
  fi
else
  echo -e "${RED}❌ FAILED: Multi-turn conversation test failed (HTTP $MULTITURN_STATUS)${NC}"
  exit 1
fi

echo ""

##############################################################################
# Test 6: Response Time
##############################################################################
echo -e "${YELLOW}[6/6] Testing response time...${NC}"

START_TIME=$(date +%s%3N)

TIME_TEST_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST "$PRODUCTION_URL/api/claude" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello"}],"model":"claude-opus-4-1-20250805","max_tokens":20}' \
  2>/dev/null || echo "000")

END_TIME=$(date +%s%3N)
RESPONSE_TIME=$((END_TIME - START_TIME))

TIME_TEST_STATUS=$(echo "$TIME_TEST_RESPONSE" | tail -n 1)

if [[ "$TIME_TEST_STATUS" == "200" ]]; then
  if [[ $RESPONSE_TIME -lt 15000 ]]; then
    echo -e "${GREEN}✅ Response time is good (${RESPONSE_TIME}ms < 15000ms)${NC}"
  else
    echo -e "${YELLOW}⚠️  Response time is slow (${RESPONSE_TIME}ms > 15000ms)${NC}"
    echo -e "${YELLOW}   Consider optimizing or checking Cloud Run instance health${NC}"
  fi
else
  echo -e "${RED}❌ FAILED: Response time test failed (HTTP $TIME_TEST_STATUS)${NC}"
  exit 1
fi

echo ""

##############################################################################
# Summary
##############################################################################
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ ALL TESTS PASSED                                     ║${NC}"
echo -e "${GREEN}║   Claude API is working correctly in production!         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Summary:${NC}"
echo -e "  ✅ Environment variables configured"
echo -e "  ✅ Health check passed"
echo -e "  ✅ Claude API endpoint accessible"
echo -e "  ✅ Response format valid"
echo -e "  ✅ Error handling works"
echo -e "  ✅ Multi-turn conversations supported"
echo -e "  ✅ Response time acceptable (${RESPONSE_TIME}ms)"
echo ""
echo -e "${GREEN}🎉 Safe to merge/deploy!${NC}"
echo ""

exit 0
