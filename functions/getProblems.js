/**
 * Get Problems Firebase Function
 * Provides access to coding problems for interviews
 */

const functions = require('firebase-functions');
const problemBank = require('./utils/problemBank');

/**
 * Get all problems or filter by criteria
 * @param {Object} data - Request data
 * @param {string} data.difficulty - Filter by difficulty (optional)
 * @param {string} data.category - Filter by category (optional)
 * @param {string} data.problemId - Get specific problem by ID (optional)
 * @param {boolean} data.random - Get random problem (optional)
 * @param {Object} context - Firebase auth context
 * @returns {Promise<Object>} Problems or single problem
 */
exports.getProblems = functions.https.onCall(async (data, context) => {
  try {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to access problems'
      );
    }

    const userId = context.auth.uid;
    console.log('[getProblems] Request from user:', userId, data);

    // Get specific problem by ID
    if (data.problemId) {
      const problem = problemBank.getProblemById(data.problemId);

      if (!problem) {
        throw new functions.https.HttpsError(
          'not-found',
          `Problem with ID '${data.problemId}' not found`
        );
      }

      return {
        problem,
      };
    }

    // Get random problem
    if (data.random) {
      const problem = problemBank.getRandomProblem({
        difficulty: data.difficulty,
        category: data.category,
      });

      return {
        problem,
      };
    }

    // Get all problems with optional filtering
    let problems = problemBank.getAllProblems();

    if (data.difficulty) {
      problems = problemBank.getProblemsByDifficulty(data.difficulty);
    }

    if (data.category) {
      problems = problemBank.getProblemsByCategory(data.category);
    }

    return {
      problems,
      total: problems.length,
      stats: problemBank.getProblemStats(),
    };
  } catch (error) {
    console.error('[getProblems] Error:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to get problems: ' + error.message
    );
  }
});

/**
 * Get problem statistics
 * @param {Object} data - Request data
 * @param {Object} context - Firebase auth context
 * @returns {Promise<Object>} Problem statistics
 */
exports.getProblemStats = functions.https.onCall(async (data, context) => {
  try {
    // Authentication check
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const stats = problemBank.getProblemStats();

    return stats;
  } catch (error) {
    console.error('[getProblemStats] Error:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      'internal',
      'Failed to get problem stats: ' + error.message
    );
  }
});
