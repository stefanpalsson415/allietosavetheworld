#!/bin/bash

# CircleCI Local Build Runner
# This script allows you to test CircleCI builds locally before pushing

set -e  # Exit on error

echo "🔧 CircleCI Local Build Runner for Allie Project"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if CircleCI CLI is installed
if ! command -v circleci &> /dev/null; then
    echo -e "${RED}❌ CircleCI CLI not found!${NC}"
    echo ""
    echo "Install it with:"
    echo "  macOS:   brew install circleci"
    echo "  Linux:   curl -fLSs https://raw.githubusercontent.com/CircleCI-Public/circleci-cli/master/install.sh | bash"
    echo "  Windows: choco install circleci-cli"
    echo ""
    echo "Or visit: https://circleci.com/docs/local-cli/"
    exit 1
fi

# Function to run a specific job
run_job() {
    local job_name=$1
    echo ""
    echo -e "${GREEN}▶ Running job: ${job_name}${NC}"
    echo "-------------------------------------------"

    circleci local execute \
        --job "${job_name}" \
        --config .circleci/config.yml \
        || {
            echo -e "${RED}❌ Job '${job_name}' failed!${NC}"
            return 1
        }

    echo -e "${GREEN}✅ Job '${job_name}' completed successfully!${NC}"
    return 0
}

# Parse command line arguments
JOB_NAME=${1:-"all"}

# Available jobs
JOBS=("setup" "build" "test-unit" "test-smoke")

case "${JOB_NAME}" in
    all)
        echo "Running all local jobs..."
        for job in "${JOBS[@]}"; do
            run_job "${job}" || exit 1
        done
        echo ""
        echo -e "${GREEN}✅ All jobs completed successfully!${NC}"
        ;;

    setup|build|test-unit|test-smoke)
        run_job "${JOB_NAME}"
        ;;

    list)
        echo "Available jobs:"
        for job in "${JOBS[@]}"; do
            echo "  - ${job}"
        done
        echo ""
        echo "Usage:"
        echo "  ./run-build-locally.sh [job-name|all|list]"
        echo ""
        echo "Examples:"
        echo "  ./run-build-locally.sh all          # Run all jobs"
        echo "  ./run-build-locally.sh build        # Run just the build job"
        echo "  ./run-build-locally.sh test-unit    # Run unit tests"
        ;;

    *)
        echo -e "${RED}❌ Unknown job: ${JOB_NAME}${NC}"
        echo ""
        echo "Available jobs:"
        for job in "${JOBS[@]}"; do
            echo "  - ${job}"
        done
        echo ""
        echo "Or use 'all' to run all jobs, 'list' to see available jobs"
        exit 1
        ;;
esac

# Cleanup (optional)
echo ""
echo -e "${YELLOW}💡 Tip: You can validate your config without running it:${NC}"
echo "   circleci config validate"
echo ""
echo -e "${YELLOW}💡 To see the processed config (with orbs expanded):${NC}"
echo "   circleci config process .circleci/config.yml"
