#!/bin/bash
# Script to seed Firestore database with sample problems

set -e

echo "🌱 Seeding Database with Sample Problems"
echo "========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check environment
ENVIRONMENT=${1:-development}

if [ "$ENVIRONMENT" == "development" ]; then
    print_info "Seeding local emulator database..."
    echo ""
    print_info "Make sure Firebase Emulator is running:"
    echo "  firebase emulators:start"
    echo ""
else
    print_info "Seeding $ENVIRONMENT database..."
    firebase use $ENVIRONMENT
fi

echo ""
print_info "This script will add 15 problems to the database:"
echo "  - 7 Easy problems"
echo "  - 6 Medium problems"
echo "  - 2 Hard problems"
echo ""

read -p "Continue? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "Cancelled"
    exit 0
fi

echo ""
print_info "Creating seed script..."

# Create a temporary Node.js script
cat > /tmp/seed-problems.js << 'EOF'
const admin = require('firebase-admin');
const { EXTENDED_PROBLEMS } = require('./functions/problems/seedProblemsExtended');

// Initialize Firebase Admin
if (process.env.FIREBASE_EMULATOR) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
}

admin.initializeApp();
const db = admin.firestore();

async function seedProblems() {
  console.log(`Seeding ${EXTENDED_PROBLEMS.length} problems...`);

  const batch = db.batch();
  let count = 0;

  for (const problem of EXTENDED_PROBLEMS) {
    const ref = db.collection('problems').doc(problem.id);
    batch.set(ref, {
      ...problem,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    count++;
  }

  await batch.commit();
  console.log(`✓ Successfully seeded ${count} problems!`);

  // List seeded problems
  console.log('\nSeeded problems:');
  EXTENDED_PROBLEMS.forEach(p => {
    console.log(`  - [${p.difficulty.toUpperCase()}] ${p.title}`);
  });

  process.exit(0);
}

seedProblems().catch(error => {
  console.error('Error seeding problems:', error);
  process.exit(1);
});
EOF

echo ""
print_info "Running seed script..."

if [ "$ENVIRONMENT" == "development" ]; then
    FIREBASE_EMULATOR=true node /tmp/seed-problems.js
else
    node /tmp/seed-problems.js
fi

rm /tmp/seed-problems.js

print_success "Database seeded successfully!"
echo ""
print_info "Verify in Firebase Console or Emulator UI"
