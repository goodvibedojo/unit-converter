/**
 * Update User Presence
 *
 * Update user's online/offline status and current session
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { authenticateUser } = require('../utils/middleware');
const { globalPresenceManager } = require('../utils/realtimeListeners');

/**
 * Update presence status
 */
exports.updatePresence = functions.https.onCall(async (data, context) => {
  try {
    // Authenticate user
    const userId = authenticateUser(context);

    const { status, sessionId } = data;

    if (!status || !['online', 'offline'].includes(status)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Status must be "online" or "offline"'
      );
    }

    if (status === 'online') {
      if (!sessionId) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Session ID required when setting online status'
        );
      }

      // Verify session exists and user has access
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

      // Set online
      await globalPresenceManager.setOnline(userId, sessionId);
    } else {
      // Set offline
      await globalPresenceManager.setOffline(userId);
    }

    return {
      success: true,
      presence: {
        userId,
        status,
        sessionId: status === 'online' ? sessionId : null,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Error in updatePresence:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to update presence');
  }
});

/**
 * Get online users (admin or debugging)
 */
exports.getOnlineUsers = functions.https.onCall(async (data, context) => {
  try {
    // Authenticate user
    authenticateUser(context);

    // Get online users
    const onlineUsers = await globalPresenceManager.getOnlineUsers();

    return {
      success: true,
      users: onlineUsers,
      count: onlineUsers.length,
    };
  } catch (error) {
    console.error('Error in getOnlineUsers:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', 'Failed to get online users');
  }
});
