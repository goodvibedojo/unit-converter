#!/bin/bash
# Start Firebase Emulators for local development

echo "🔥 Starting Firebase Emulators"
echo "==============================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found"
    echo "Install with: npm install -g firebase-tools"
    exit 1
fi

echo "✓ Firebase CLI found"
echo ""

# Kill any existing emulator processes
echo "Checking for existing emulator processes..."
pkill -f "firebase.*emulators" || true
echo "✓ Cleaned up old processes"
echo ""

# Start emulators
echo "Starting emulators..."
echo ""
echo "📍 Emulator URLs:"
echo "  - Functions: http://localhost:5001"
echo "  - Firestore: http://localhost:8080"
echo "  - Auth: http://localhost:9099"
echo "  - UI: http://localhost:4000"
echo ""

firebase emulators:start
