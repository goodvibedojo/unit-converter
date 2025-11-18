// Get Problems By Filter
// Engineer 5 - Problem Function

const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Get problems with filtering and pagination
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

  const {
    difficulty,
    category,
    companyTag,
    limit = 20,
    startAfter = null
  } = data;

  try {
    let query = admin.firestore().collection('problems');

    // Apply filters
    if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
      query = query.where('difficulty', '==', difficulty);
    }

    if (category) {
      query = query.where('category', 'array-contains', category);
    }

    if (companyTag) {
      query = query.where('companyTags', 'array-contains', companyTag);
    }

    // Order by title
    query = query.orderBy('title');

    // Pagination
    if (startAfter) {
      const startDoc = await admin.firestore()
        .collection('problems')
        .doc(startAfter)
        .get();

      if (startDoc.exists) {
        query = query.startAfter(startDoc);
      }
    }

    // Limit results
    query = query.limit(Math.min(limit, 50)); // Max 50 per request

    const snapshot = await query.get();

    const problems = snapshot.docs.map(doc => {
      const data = doc.data();

      // Remove solutions and hidden test cases
      delete data.solutions;

      if (data.testCases) {
        data.testCases = data.testCases.map(tc => ({
          ...tc,
          expectedOutput: tc.isHidden ? '???' : tc.expectedOutput
        }));
      }

      return {
        id: doc.id,
        ...data
      };
    });

    const lastDoc = snapshot.docs[snapshot.docs.length - 1];

    console.log(`Retrieved ${problems.length} problems for user ${context.auth.uid}`);

    return {
      problems,
      lastId: lastDoc?.id || null,
      hasMore: snapshot.docs.length === limit
    };
  } catch (error) {
    console.error('Error getting problems:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to get problems',
      error.message
    );
  }
});
