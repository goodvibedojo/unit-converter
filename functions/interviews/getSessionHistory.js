/**
 * Cloud Function: getSessionHistory
 *
 * Type: HTTP Callable
 * Purpose: Get user's interview session history
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { validatePagination } = require('../utils/validators');

exports.getSessionHistory = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { page = 1, limit = 10, status, difficulty } = data;

    // Validate pagination
    const pagination = validatePagination(page, limit);

    const db = admin.firestore();

    // Build query
    let query = db.collection('sessions').where('userId', '==', userId);

    if (status) {
      query = query.where('status', '==', status);
    }

    // Order by start time (most recent first)
    query = query.orderBy('startTime', 'desc');

    // Get total count (for pagination)
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;

    // Apply pagination
    const offset = (pagination.sanitizedPage - 1) * pagination.sanitizedLimit;
    query = query.limit(pagination.sanitizedLimit);

    if (offset > 0) {
      const skipSnapshot = await db
        .collection('sessions')
        .where('userId', '==', userId)
        .orderBy('startTime', 'desc')
        .limit(offset)
        .get();

      if (!skipSnapshot.empty) {
        const lastDoc = skipSnapshot.docs[skipSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    // Execute query
    const sessionsSnapshot = await query.get();

    // Fetch problem details for each session
    const sessions = await Promise.all(
      sessionsSnapshot.docs.map(async (doc) => {
        const sessionData = doc.data();

        // Get problem details
        const problemRef = db.collection('problems').doc(sessionData.problemId);
        const problemDoc = await problemRef.get();
        const problemData = problemDoc.exists ? problemDoc.data() : null;

        return {
          id: doc.id,
          problemId: sessionData.problemId,
          problemTitle: problemData?.title || 'Unknown',
          difficulty: problemData?.difficulty || 'unknown',
          language: sessionData.language,
          startTime: sessionData.startTime,
          endTime: sessionData.endTime,
          duration: sessionData.duration,
          status: sessionData.status,
          testResults: sessionData.testResults,
          aiScore: sessionData.aiScore,
        };
      })
    );

    // Filter by difficulty if specified
    let filteredSessions = sessions;
    if (difficulty) {
      filteredSessions = sessions.filter((s) => s.difficulty === difficulty);
    }

    console.log('Session history retrieved for user:', userId);

    return {
      success: true,
      sessions: filteredSessions,
      pagination: {
        page: pagination.sanitizedPage,
        limit: pagination.sanitizedLimit,
        total,
        totalPages: Math.ceil(total / pagination.sanitizedLimit),
      },
    };
  } catch (error) {
    console.error('Error getting session history:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to retrieve session history');
  }
});
