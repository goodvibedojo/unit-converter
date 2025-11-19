/**
 * Cloud Function: saveProgress
 *
 * Type: HTTP Callable
 * Purpose: Auto-save code progress during interview session
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { validateSessionId, validateCode } = require('../utils/validators');

exports.saveProgress = functions.https.onCall(async (data, context) => {
  try {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const { sessionId, code, action = 'edit' } = data;

    // Validate inputs
    if (!validateSessionId(sessionId)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid session ID');
    }

    const codeValidation = validateCode(code);
    if (!codeValidation.valid) {
      throw new functions.https.HttpsError('invalid-argument', codeValidation.error);
    }

    const db = admin.firestore();
    const sessionRef = db.collection('sessions').doc(sessionId);
    const sessionDoc = await sessionRef.get();

    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const sessionData = sessionDoc.data();

    // Verify ownership
    if (sessionData.userId !== userId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You do not have permission to update this session'
      );
    }

    // Check if session is still active
    if (sessionData.status !== 'active') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Cannot update inactive session'
      );
    }

    // Update session with new code
    const updateData = {
      code,
      codeHistory: admin.firestore.FieldValue.arrayUnion({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        code,
        action,
      }),
    };

    await sessionRef.update(updateData);

    console.log('Progress saved for session:', sessionId);

    return {
      success: true,
      sessionId,
      saved: true,
    };
  } catch (error) {
    console.error('Error saving progress:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to save progress');
  }
});
