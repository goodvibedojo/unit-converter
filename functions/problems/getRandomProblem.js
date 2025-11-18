/**
 * Cloud Function: getRandomProblem
 *
 * Type: HTTP Callable
 * Purpose: Get a random problem by difficulty and optional category
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { validateDifficulty } = require('../utils/validators');

exports.getRandomProblem = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { difficulty = 'easy', category, excludeIds = [] } = data;

    // Validate difficulty
    if (!validateDifficulty(difficulty)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid difficulty. Must be: easy, medium, or hard'
      );
    }

    const db = admin.firestore();

    // Build query
    let query = db.collection('problems').where('difficulty', '==', difficulty);

    if (category) {
      query = query.where('category', 'array-contains', category);
    }

    // Execute query
    const problemsSnapshot = await query.get();

    if (problemsSnapshot.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'No problems found matching the criteria'
      );
    }

    // Filter out excluded problems
    let problems = problemsSnapshot.docs.filter((doc) => !excludeIds.includes(doc.id));

    if (problems.length === 0) {
      throw new functions.https.HttpsError(
        'not-found',
        'No problems available after filtering'
      );
    }

    // Select random problem
    const randomProblem = problems[Math.floor(Math.random() * problems.length)];
    const problemData = randomProblem.data();

    // Return problem without hidden test cases
    const publicProblem = {
      id: randomProblem.id,
      title: problemData.title,
      slug: problemData.slug,
      difficulty: problemData.difficulty,
      category: problemData.category,
      companyTags: problemData.companyTags,
      description: problemData.description,
      constraints: problemData.constraints,
      examples: problemData.examples,
      hints: problemData.hints,
      starterCode: problemData.starterCode,
      testCases: problemData.testCases?.filter((tc) => !tc.isHidden) || [],
    };

    console.log('Random problem retrieved:', randomProblem.id);

    return {
      success: true,
      problem: publicProblem,
    };
  } catch (error) {
    console.error('Error getting random problem:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to retrieve problem');
  }
});
