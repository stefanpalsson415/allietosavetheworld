#!/bin/bash

# CircleCI Configuration Validator
# Quick script to validate CircleCI config before committing

set -e

echo "🔍 CircleCI Configuration Validator"
echo "===================================="

# Check if CircleCI CLI is installed
if ! command -v circleci &> /dev/null; then
    echo "❌ CircleCI CLI not found!"
    echo ""
    echo "Install it first:"
    echo "  macOS:   brew install circleci"
    echo "  Linux:   curl -fLSs https://raw.githubusercontent.com/CircleCI-Public/circleci-cli/master/install.sh | bash"
    echo ""
    exit 1
fi

# Validate the config
echo "Validating .circleci/config.yml..."
echo ""

if circleci config validate; then
    echo ""
    echo "✅ Configuration is valid!"
    echo ""
    echo "💡 To see the processed config (with orbs expanded):"
    echo "   circleci config process .circleci/config.yml"
    echo ""
    echo "💡 To run a job locally:"
    echo "   ./.circleci/run-build-locally.sh build"
    echo ""
else
    echo ""
    echo "❌ Configuration has errors!"
    echo ""
    echo "Fix the errors above and run this script again."
    exit 1
fi
