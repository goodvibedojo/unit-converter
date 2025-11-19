#!/bin/bash
# Deployment script for AI Mock Interview Platform

set -e # Exit on error

echo "🚀 AI Mock Interview Platform - Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if environment is specified
if [ -z "$1" ]; then
    print_error "Please specify environment: staging or production"
    echo "Usage: ./scripts/deploy.sh [staging|production]"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    print_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

print_info "Deploying to: $ENVIRONMENT"

# Confirm production deployment
if [ "$ENVIRONMENT" == "production" ]; then
    echo ""
    print_info "⚠️  WARNING: You are about to deploy to PRODUCTION!"
    read -p "Type 'yes' to continue: " confirm
    if [ "$confirm" != "yes" ]; then
        print_error "Deployment cancelled"
        exit 0
    fi
fi

echo ""
print_info "Step 1: Checking Firebase CLI..."
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI not found. Install with: npm install -g firebase-tools"
    exit 1
fi
print_success "Firebase CLI found"

echo ""
print_info "Step 2: Checking current Firebase project..."
firebase use $ENVIRONMENT
print_success "Using project: $ENVIRONMENT"

echo ""
print_info "Step 3: Running linter..."
cd functions
npm run lint
print_success "Linting passed"

echo ""
print_info "Step 4: Running tests..."
# npm test
print_info "Tests skipped (add tests in future)"

echo ""
print_info "Step 5: Building frontend..."
cd ..
npm run build
print_success "Frontend built successfully"

echo ""
print_info "Step 6: Deploying Firestore rules..."
firebase deploy --only firestore:rules
print_success "Firestore rules deployed"

echo ""
print_info "Step 7: Deploying Firestore indexes..."
firebase deploy --only firestore:indexes
print_success "Firestore indexes deployed"

echo ""
print_info "Step 8: Deploying Cloud Functions..."
firebase deploy --only functions
print_success "Cloud Functions deployed"

echo ""
print_info "Step 9: Deploying hosting..."
firebase deploy --only hosting
print_success "Hosting deployed"

echo ""
print_success "===================================="
print_success "🎉 Deployment to $ENVIRONMENT complete!"
print_success "===================================="

echo ""
print_info "Next steps:"
echo "1. Test the deployed application"
echo "2. Monitor functions in Firebase Console"
echo "3. Check error logs: firebase functions:log"

if [ "$ENVIRONMENT" == "staging" ]; then
    echo "4. Staging URL: https://staging.aimockinterview.com"
else
    echo "4. Production URL: https://aimockinterview.com"
fi

echo ""
print_info "View deployment details:"
echo "firebase hosting:channel:list"
echo "firebase functions:log"
