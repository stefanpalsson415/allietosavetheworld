#!/bin/bash

# Script to run calendar tests with different configurations

# Set up color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create test results directory if it doesn't exist
mkdir -p test-results

# Echo with timestamp
log() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Print section header
section() {
  echo
  echo -e "${YELLOW}========== $1 ==========${NC}"
  echo
}

# Check if Playwright is installed
if ! command -v npx playwright &> /dev/null; then
  echo -e "${RED}Playwright is not installed. Installing now...${NC}"
  npm install -D @playwright/test
fi

# Check if browsers are installed
if ! npx playwright browser-info >/dev/null 2>&1; then
  echo -e "${RED}Playwright browsers not found. Installing now...${NC}"
  npx playwright install
fi

# Function to run tests
run_tests() {
  local test_pattern=$1
  local extra_args=$2
  
  local command="npx playwright test $test_pattern $extra_args"
  log "Running: $command"
  
  if $command; then
    echo -e "${GREEN}Tests passed!${NC}"
    return 0
  else
    echo -e "${RED}Tests failed!${NC}"
    return 1
  fi
}

# Parse command line arguments
TEST_TYPE=""
BROWSER=""
DEBUG=""
HEADED=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --mock)
      TEST_TYPE="mock"
      shift
      ;;
    --real)
      TEST_TYPE="real"
      shift
      ;;
    --visual)
      TEST_TYPE="visual"
      shift
      ;;
    --all)
      TEST_TYPE="all"
      shift
      ;;
    --chrome|--chromium)
      BROWSER="--project=chromium"
      shift
      ;;
    --firefox)
      BROWSER="--project=firefox"
      shift
      ;;
    --webkit|--safari)
      BROWSER="--project=webkit"
      shift
      ;;
    --mobile)
      BROWSER="--project=mobile"
      shift
      ;;
    --debug)
      DEBUG="--debug"
      shift
      ;;
    --headed)
      HEADED="--headed"
      shift
      ;;
    --help|-h)
      echo "Usage: $0 [options]"
      echo
      echo "Options:"
      echo "  --mock       Run mock calendar tests only"
      echo "  --real       Run real calendar tests (requires auth)"
      echo "  --visual     Run visual regression tests"
      echo "  --all        Run all tests"
      echo "  --chrome     Run tests in Chrome/Chromium"
      echo "  --firefox    Run tests in Firefox"
      echo "  --webkit     Run tests in WebKit/Safari"
      echo "  --mobile     Run tests in mobile mode"
      echo "  --debug      Run tests in debug mode"
      echo "  --headed     Run tests in headed mode (visible browser)"
      echo "  --help       Show this help message"
      echo
      echo "Examples:"
      echo "  $0 --mock --chrome      Run mock tests in Chrome"
      echo "  $0 --visual --headed    Run visual tests with visible browser"
      echo "  $0 --all                Run all tests with default settings"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help to see available options"
      exit 1
      ;;
  esac
done

# Set default test type if none specified
if [ -z "$TEST_TYPE" ]; then
  TEST_TYPE="all"
fi

# Main execution
section "Calendar CRUD Test Runner"
log "Test type: $TEST_TYPE"
log "Browser: ${BROWSER:-default}"
log "Debug mode: ${DEBUG:-no}"
log "Headed mode: ${HEADED:-no}"

# Run appropriate tests based on selection
case $TEST_TYPE in
  "mock")
    section "Running Mock Calendar Tests"
    run_tests "tests/simple-mock-calendar.spec.js" "$BROWSER $DEBUG $HEADED"
    ;;
  "real")
    section "Running Real Calendar Tests"
    log "Note: These tests require valid authentication"
    run_tests "tests/calendar-crud-refactored.spec.js" "$BROWSER $DEBUG $HEADED"
    ;;
  "visual")
    section "Running Visual Regression Tests"
    run_tests "tests/calendar-visual.spec.js" "$BROWSER $DEBUG $HEADED"
    ;;
  "all")
    section "Running All Tests"
    log "Starting with mock tests (should always pass)..."
    run_tests "tests/simple-mock-calendar.spec.js" "$BROWSER $DEBUG $HEADED"
    
    log "Running visual regression tests..."
    run_tests "tests/calendar-visual.spec.js" "$BROWSER $DEBUG $HEADED"
    
    log "Finally, running real calendar tests (may fail if auth not configured)..."
    run_tests "tests/calendar-crud-refactored.spec.js" "$BROWSER $DEBUG $HEADED" || true
    ;;
esac

section "Test Report"
log "To view detailed test report, run: npx playwright show-report"
log "Screenshots and videos are available in: test-results/"
log "Test run completed!"