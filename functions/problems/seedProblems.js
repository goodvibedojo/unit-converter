/**
 * Cloud Function: seedProblems
 *
 * Type: HTTP Callable (Admin only)
 * Purpose: Seed the database with initial problems
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { EXTENDED_PROBLEMS } = require('./seedProblemsExtended');

// Sample problems for seeding - using extended problem bank (15 problems)
const SAMPLE_PROBLEMS = EXTENDED_PROBLEMS;

exports.seedProblems = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    // TODO: Add admin check in production
    // For now, any authenticated user can seed (for development)
    const isAdmin = true; // In production: check user role

    if (!isAdmin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can seed problems'
      );
    }

    const db = admin.firestore();
    const batch = db.batch();

    let count = 0;

    for (const problem of SAMPLE_PROBLEMS) {
      const problemRef = db.collection('problems').doc(problem.id);
      const problemData = {
        ...problem,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      batch.set(problemRef, problemData);
      count++;
    }

    await batch.commit();

    console.log(`Seeded ${count} problems`);

    return {
      success: true,
      count,
      message: `Successfully seeded ${count} problems`,
    };
  } catch (error) {
    console.error('Error seeding problems:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to seed problems');
  }
});
