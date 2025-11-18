/**
 * Cloud Function: getProblemsByCategory
 *
 * Type: HTTP Callable
 * Purpose: Get all problems filtered by category and difficulty
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { validatePagination } = require('../utils/validators');

exports.getProblemsByCategory = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { category, difficulty, page = 1, limit = 20 } = data;

    // Validate pagination
    const pagination = validatePagination(page, limit);

    const db = admin.firestore();

    // Build query
    let query = db.collection('problems');

    if (category) {
      query = query.where('category', 'array-contains', category);
    }

    if (difficulty) {
      query = query.where('difficulty', '==', difficulty);
    }

    // Order by difficulty and title
    query = query.orderBy('difficulty').orderBy('title');

    // Get total count
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    const offset = (pagination.sanitizedPage - 1) * pagination.sanitizedLimit;
    query = query.limit(pagination.sanitizedLimit);

    if (offset > 0) {
      const skipSnapshot = await db
        .collection('problems')
        .orderBy('difficulty')
        .orderBy('title')
        .limit(offset)
        .get();

      if (!skipSnapshot.empty) {
        const lastDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    // Execute query
    const problemsSnapshot = await query.get();

    // Format problems
    const problems = problemsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        slug: data.slug,
        difficulty: data.difficulty,
        category: data.category,
        companyTags: data.companyTags,
        description: data.description,
        // Don't include full details, test cases, or solutions
      };
    });

    console.log('Problems by category retrieved');

    return {
      success: true,
      problems,
      pagination: {
        page: pagination.sanitizedPage,
        limit: pagination.sanitizedLimit,
        total,
        totalPages: Math.ceil(total / pagination.sanitizedLimit),
      },
    };
  } catch (error) {
    console.error('Error getting problems by category:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to retrieve problems');
  }
});
