#!/bin/bash
# Quick Test Verification Script
# This script provides fast feedback on critical test health

set -e

echo "🧪 Allie Test Quick Verification"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

# 1. Check if dev server is running
echo "1️⃣ Checking dev server..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status 0 "Dev server is running on port 3000"
else
    print_status 1 "Dev server is NOT running"
    echo -e "${YELLOW}   → Start server with: npm start${NC}"
    echo ""
    read -p "Would you like to start the server now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Starting server in background..."
        npm start > /tmp/dev-server.log 2>&1 &
        SERVER_PID=$!
        echo "Server PID: $SERVER_PID"
        echo "Waiting 60 seconds for compilation..."
        sleep 60

        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            print_status 0 "Server started successfully"
        else
            print_status 1 "Server failed to start - check /tmp/dev-server.log"
            exit 1
        fi
    else
        echo "Exiting - please start server and try again"
        exit 1
    fi
fi
echo ""

# 2. Check auth state
echo "2️⃣ Checking authentication state..."
if [ -f "tests/.auth/user.json" ]; then
    print_status 0 "Auth state file exists"

    # Check if auth file has data
    AUTH_SIZE=$(wc -c < "tests/.auth/user.json" | tr -d ' ')
    if [ "$AUTH_SIZE" -gt 100 ]; then
        print_status 0 "Auth state has data (${AUTH_SIZE} bytes)"
    else
        print_status 1 "Auth state file is too small (${AUTH_SIZE} bytes)"
        echo -e "${YELLOW}   → Recapture auth with: npx playwright test tests/auth-setup-fixed.spec.js${NC}"
    fi
else
    print_status 1 "Auth state file missing"
    echo -e "${YELLOW}   → Capture auth with: npx playwright test tests/auth-setup-fixed.spec.js${NC}"
fi
echo ""

# 3. Run smoke tests (just auth for now)
echo "3️⃣ Running smoke test (auth only)..."
if npx playwright test tests/auth-setup-fixed.spec.js --project=chromium --timeout=30000 --reporter=list 2>&1 | tee /tmp/test-output.log | grep -q "1 passed"; then
    print_status 0 "Auth test passed"
else
    print_status 1 "Auth test failed"
    echo -e "${YELLOW}   → Check output: /tmp/test-output.log${NC}"
fi
echo ""

# 4. Run regression tests
echo "4️⃣ Running October 2025 regression tests..."
echo -e "${YELLOW}   (This will take 2-3 minutes)${NC}"

if npx playwright test tests/regression/october-2025-critical-bugs.spec.js --project=chromium --reporter=list 2>&1 | tee /tmp/regression-output.log; then
    PASSED=$(grep -o "[0-9]* passed" /tmp/regression-output.log | head -1 | cut -d' ' -f1)
    print_status 0 "Regression tests completed: ${PASSED} passed"
else
    print_status 1 "Some regression tests failed"
    echo -e "${YELLOW}   → Check output: /tmp/regression-output.log${NC}"
fi
echo ""

# 5. Summary
echo "📊 Summary"
echo "=========="
echo "Test artifacts:"
echo "  - Dev server log: /tmp/dev-server.log"
echo "  - Test output: /tmp/test-output.log"
echo "  - Regression output: /tmp/regression-output.log"
echo "  - HTML report: playwright-report/index.html"
echo ""

echo "Quick commands:"
echo "  - View HTML report: npx playwright show-report"
echo "  - Run specific test: npx playwright test tests/regression/october-2025-critical-bugs.spec.js --grep 'OTP login'"
echo "  - Run tagged tests: npx playwright test --grep @regression"
echo ""

echo -e "${GREEN}✨ Verification complete!${NC}"
