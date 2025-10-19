#!/bin/bash
##############################################################################
# Comprehensive Claude API Test Suite Runner
#
# Runs ALL Claude API tests:
# 1. Frontend unit tests (ClaudeService.js)
# 2. Backend endpoint tests (production-server.js)
# 3. Production deployment validation
# 4. End-to-end integration tests
#
# Usage:
#   ./scripts/test-claude-api-complete.sh           # Run all tests except production
#   ./scripts/test-claude-api-complete.sh --all     # Run ALL tests including production
#   ./scripts/test-claude-api-complete.sh --quick   # Run only fast unit tests
#
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Parse arguments
MODE="standard"
if [[ "$1" == "--all" ]]; then
  MODE="all"
elif [[ "$1" == "--quick" ]]; then
  MODE="quick"
fi

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Comprehensive Claude API Test Suite                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Mode: $MODE${NC}"
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

##############################################################################
# Test 1: Frontend Unit Tests (ClaudeService.js)
##############################################################################
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}[1/5] Running Frontend Unit Tests (ClaudeService)${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""

if npm test -- --testPathPattern=ClaudeService --watchAll=false --ci; then
  echo -e "${GREEN}✅ Frontend unit tests passed${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ Frontend unit tests failed${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""

##############################################################################
# Test 2: Backend Endpoint Tests
##############################################################################
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}[2/5] Running Backend Endpoint Tests${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""

cd server

if npm test -- --testPathPattern=claude-api-endpoint --watchAll=false --ci; then
  echo -e "${GREEN}✅ Backend endpoint tests passed${NC}"
  TESTS_PASSED=$((TESTS_PASSED + 1))
else
  echo -e "${RED}❌ Backend endpoint tests failed${NC}"
  TESTS_FAILED=$((TESTS_FAILED + 1))
fi

cd ..

echo ""

# Exit here if quick mode
if [[ "$MODE" == "quick" ]]; then
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}Quick Mode Summary:${NC}"
  echo -e "  Passed: ${GREEN}$TESTS_PASSED${NC}"
  echo -e "  Failed: ${RED}$TESTS_FAILED${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

  if [[ $TESTS_FAILED -eq 0 ]]; then
    exit 0
  else
    exit 1
  fi
fi

##############################################################################
# Test 3: Backend Integration Test
##############################################################################
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}[3/5] Running Backend Integration Test${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if local server is running
if curl -s http://localhost:3002/health > /dev/null 2>&1; then
  echo "Local backend detected, running integration test..."

  cd server
  if node test-claude-integration.js; then
    echo -e "${GREEN}✅ Backend integration test passed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ Backend integration test failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
  cd ..
else
  echo -e "${YELLOW}⏭️  Skipping backend integration test (local server not running)${NC}"
  echo -e "${YELLOW}   Start server with: npm start (in server directory)${NC}"
fi

echo ""

##############################################################################
# Test 4: End-to-End Integration Tests
##############################################################################
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}[4/5] Running End-to-End Integration Tests${NC}"
echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check if frontend dev server is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo "Frontend dev server detected, running E2E tests..."

  if npm run test:e2e -- --grep "Claude API"; then
    echo -e "${GREEN}✅ End-to-end integration tests passed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ End-to-end integration tests failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
else
  echo -e "${YELLOW}⏭️  Skipping E2E tests (frontend dev server not running)${NC}"
  echo -e "${YELLOW}   Start server with: npm start${NC}"
fi

echo ""

##############################################################################
# Test 5: Production Deployment Validation (only in --all mode)
##############################################################################
if [[ "$MODE" == "all" ]]; then
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${YELLOW}[5/5] Running Production Deployment Validation${NC}"
  echo -e "${YELLOW}═══════════════════════════════════════════════════════════${NC}"
  echo ""

  if ./scripts/verify-claude-api-deployment.sh; then
    echo -e "${GREEN}✅ Production deployment validation passed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo -e "${RED}❌ Production deployment validation failed${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi

  echo ""
else
  echo -e "${YELLOW}⏭️  Skipping production deployment validation (use --all to run)${NC}"
  echo ""
fi

##############################################################################
# Summary
##############################################################################
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Test Suite Summary                                     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [[ $TESTS_FAILED -eq 0 ]]; then
  echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${GREEN}║   ✅ ALL TESTS PASSED                                     ║${NC}"
  echo -e "${GREEN}║   Claude API is working correctly!                       ║${NC}"
  echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${RED}║   ❌ TESTS FAILED                                         ║${NC}"
  echo -e "${RED}║   DO NOT DEPLOY - Fix failing tests first                ║${NC}"
  echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 1
fi
