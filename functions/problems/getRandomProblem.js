// Get Random Problem
// Engineer 5 - Problem Function

const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Get a random problem by difficulty and/or category
 * Callable function from frontend
 */
module.exports = functions.https.onCall(async (data, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { difficulty, category, excludeIds } = data;

  try {
    let query = admin.firestore().collection('problems');

    // Filter by difficulty
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      query = query.where('difficulty', '==', difficulty);
    }

    // Filter by category
    if (category) {
      query = query.where('category', 'array-contains', category);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'No problems found matching criteria'
      );
    }

    // Filter out excluded IDs
    let problems = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (excludeIds && excludeIds.length > 0) {
      problems = problems.filter(p => !excludeIds.includes(p.id));
    }

    if (problems.length === 0) {
      throw new functions.https.HttpsError(
        'not-found',
        'No new problems available'
      );
    }

    // Select random problem
    const randomIndex = Math.floor(Math.random() * problems.length);
    const problem = problems[randomIndex];

    // Remove hidden test cases from response
    if (problem.testCases) {
      problem.testCases = problem.testCases.map(tc => ({
        ...tc,
        expectedOutput: tc.isHidden ? '???' : tc.expectedOutput
      }));
    }

    console.log(`Random problem selected: ${problem.id} for user ${context.auth.uid}`);

    return problem;
  } catch (error) {
    console.error('Error getting random problem:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get random problem',
      error.message
    );
  }
});
