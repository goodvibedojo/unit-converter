/**
 * Subscribe to Session Updates
 *
 * Cloud Function to enable client-side real-time session monitoring
 * Note: This is a helper function - actual real-time updates happen via
 * Firestore SDK on client side. This function validates access and returns
 * subscription configuration.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { authenticateUser } = require('../utils/middleware');

/**
 * Get real-time subscription configuration for a session
 *
 * Returns Firestore paths and security info for client to set up listeners
 */
exports.subscribeToSession = functions.https.onCall(async (data, context) => {
  try {
    // Authenticate user
    const userId = authenticateUser(context);

    const { sessionId } = data;

    if (!sessionId) {
      throw new functions.https.HttpsError('invalid-argument', 'Session ID is required');
    }

    // Verify session ownership
    const db = admin.firestore();
    const sessionDoc = await db.collection('sessions').doc(sessionId).get();

    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionDoc.data();

    if (sessionData.userId !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You do not have access to this session'
      );
    }

    // Return subscription configuration
    return {
      success: true,
      subscription: {
        sessionPath: `sessions/${sessionId}`,
        presencePath: `presence/${userId}`,
        allowedFields: [
          'currentCode',
          'chatHistory',
          'testResults',
          'status',
          'lastSaveTime',
          'participants',
        ],
      },
      listeners: {
        session: true, // Client should listen to session doc
        presence: true, // Client should update presence
        chat: true, // Client should listen to chat updates
        code: true, // Client should listen to code changes
      },
    };
  } catch (error) {
    console.error('Error in subscribeToSession:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to set up subscription');
  }
});
