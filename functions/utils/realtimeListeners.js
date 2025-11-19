/**
 * Real-time Firestore Listeners
 *
 * Utilities for real-time data synchronization using Firestore onSnapshot
 */

const admin = require('firebase-admin');
const { logger } = require('./monitoring');

/**
 * Real-time session listener manager
 * Manages active listeners and provides cleanup
 */
class ListenerManager {
  constructor() {
    this.listeners = new Map();
    this.stats = {
      activeListeners: 0,
      totalCreated: 0,
      totalRemoved: 0,
    };
  }

  /**
   * Register a new listener
   */
  register(id, unsubscribe) {
    this.listeners.set(id, {
      unsubscribe,
      createdAt: new Date(),
    });
    this.stats.activeListeners++;
    this.stats.totalCreated++;

    logger.debug('Listener registered', { id, activeCount: this.stats.activeListeners });
  }

  /**
   * Unregister and cleanup a listener
   */
  unregister(id) {
    const listener = this.listeners.get(id);
    if (listener) {
      listener.unsubscribe();
      this.listeners.delete(id);
      this.stats.activeListeners--;
      this.stats.totalRemoved++;

      logger.debug('Listener unregistered', { id, activeCount: this.stats.activeListeners });
      return true;
    }
    return false;
  }

  /**
   * Cleanup all listeners
   */
  cleanup() {
    logger.info('Cleaning up all listeners', { count: this.listeners.size });

    for (const [id, listener] of this.listeners) {
      listener.unsubscribe();
    }

    this.listeners.clear();
    this.stats.activeListeners = 0;
  }

  /**
   * Get listener statistics
   */
  getStats() {
    return {
      ...this.stats,
      listeners: Array.from(this.listeners.keys()),
    };
  }
}

const globalListenerManager = new ListenerManager();

/**
 * Listen to session changes in real-time
 *
 * @param {string} sessionId - Session ID to watch
 * @param {Function} onUpdate - Callback when session changes
 * @param {Function} onError - Error callback
 * @returns {Function} Unsubscribe function
 */
function listenToSession(sessionId, onUpdate, onError = null) {
  const db = admin.firestore();

  logger.info('Setting up session listener', { sessionId });

  const unsubscribe = db
    .collection('sessions')
    .doc(sessionId)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) {
          logger.warn('Session not found in listener', { sessionId });
          onUpdate(null);
          return;
        }

        const data = {
          id: snapshot.id,
          ...snapshot.data(),
        };

        logger.debug('Session update received', {
          sessionId,
          hasCode: !!data.currentCode,
          messageCount: data.chatHistory?.length || 0,
        });

        onUpdate(data);
      },
      (error) => {
        logger.error('Session listener error', { sessionId, error: error.message });
        if (onError) {
          onError(error);
        }
      }
    );

  globalListenerManager.register(`session-${sessionId}`, unsubscribe);

  return () => {
    globalListenerManager.unregister(`session-${sessionId}`);
  };
}

/**
 * Listen to chat messages in real-time
 *
 * @param {string} sessionId - Session ID to watch
 * @param {Function} onMessage - Callback when new message arrives
 * @param {Function} onError - Error callback
 * @returns {Function} Unsubscribe function
 */
function listenToChatMessages(sessionId, onMessage, onError = null) {
  const db = admin.firestore();

  logger.info('Setting up chat listener', { sessionId });

  let lastMessageCount = 0;

  const unsubscribe = db
    .collection('sessions')
    .doc(sessionId)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) {
          return;
        }

        const data = snapshot.data();
        const messages = data.chatHistory || [];

        // Only emit new messages
        if (messages.length > lastMessageCount) {
          const newMessages = messages.slice(lastMessageCount);
          logger.debug('New chat messages received', {
            sessionId,
            count: newMessages.length,
          });

          newMessages.forEach((message) => {
            onMessage(message);
          });

          lastMessageCount = messages.length;
        }
      },
      (error) => {
        logger.error('Chat listener error', { sessionId, error: error.message });
        if (onError) {
          onError(error);
        }
      }
    );

  globalListenerManager.register(`chat-${sessionId}`, unsubscribe);

  return () => {
    globalListenerManager.unregister(`chat-${sessionId}`);
  };
}

/**
 * Listen to code changes in real-time
 *
 * @param {string} sessionId - Session ID to watch
 * @param {Function} onCodeChange - Callback when code changes
 * @param {Function} onError - Error callback
 * @returns {Function} Unsubscribe function
 */
function listenToCodeChanges(sessionId, onCodeChange, onError = null) {
  const db = admin.firestore();

  logger.info('Setting up code listener', { sessionId });

  let lastCode = '';

  const unsubscribe = db
    .collection('sessions')
    .doc(sessionId)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) {
          return;
        }

        const data = snapshot.data();
        const currentCode = data.currentCode || '';

        // Only emit if code actually changed
        if (currentCode !== lastCode) {
          logger.debug('Code change detected', {
            sessionId,
            oldLength: lastCode.length,
            newLength: currentCode.length,
          });

          onCodeChange({
            code: currentCode,
            timestamp: data.lastSaveTime,
            userId: data.userId,
          });

          lastCode = currentCode;
        }
      },
      (error) => {
        logger.error('Code listener error', { sessionId, error: error.message });
        if (onError) {
          onError(error);
        }
      }
    );

  globalListenerManager.register(`code-${sessionId}`, unsubscribe);

  return () => {
    globalListenerManager.unregister(`code-${sessionId}`);
  };
}

/**
 * Listen to user's active sessions
 *
 * @param {string} userId - User ID to watch
 * @param {Function} onUpdate - Callback when sessions change
 * @param {Function} onError - Error callback
 * @returns {Function} Unsubscribe function
 */
function listenToUserSessions(userId, onUpdate, onError = null) {
  const db = admin.firestore();

  logger.info('Setting up user sessions listener', { userId });

  const unsubscribe = db
    .collection('sessions')
    .where('userId', '==', userId)
    .where('status', '==', 'active')
    .orderBy('startTime', 'desc')
    .onSnapshot(
      (snapshot) => {
        const sessions = [];

        snapshot.forEach((doc) => {
          sessions.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        logger.debug('User sessions updated', {
          userId,
          activeCount: sessions.length,
        });

        onUpdate(sessions);
      },
      (error) => {
        logger.error('User sessions listener error', { userId, error: error.message });
        if (onError) {
          onError(error);
        }
      }
    );

  globalListenerManager.register(`user-sessions-${userId}`, unsubscribe);

  return () => {
    globalListenerManager.unregister(`user-sessions-${userId}`);
  };
}

/**
 * Listen to test results in real-time
 *
 * @param {string} sessionId - Session ID to watch
 * @param {Function} onTestResult - Callback when test results update
 * @param {Function} onError - Error callback
 * @returns {Function} Unsubscribe function
 */
function listenToTestResults(sessionId, onTestResult, onError = null) {
  const db = admin.firestore();

  logger.info('Setting up test results listener', { sessionId });

  const unsubscribe = db
    .collection('sessions')
    .doc(sessionId)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) {
          return;
        }

        const data = snapshot.data();
        const testResults = data.testResults;

        if (testResults) {
          logger.debug('Test results updated', {
            sessionId,
            passed: testResults.passed,
            total: testResults.total,
          });

          onTestResult(testResults);
        }
      },
      (error) => {
        logger.error('Test results listener error', { sessionId, error: error.message });
        if (onError) {
          onError(error);
        }
      }
    );

  globalListenerManager.register(`test-${sessionId}`, unsubscribe);

  return () => {
    globalListenerManager.unregister(`test-${sessionId}`);
  };
}

/**
 * Listen to user profile changes
 *
 * @param {string} userId - User ID to watch
 * @param {Function} onUpdate - Callback when profile changes
 * @param {Function} onError - Error callback
 * @returns {Function} Unsubscribe function
 */
function listenToUserProfile(userId, onUpdate, onError = null) {
  const db = admin.firestore();

  logger.info('Setting up user profile listener', { userId });

  const unsubscribe = db
    .collection('users')
    .doc(userId)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot.exists) {
          logger.warn('User profile not found in listener', { userId });
          onUpdate(null);
          return;
        }

        const profile = {
          uid: snapshot.id,
          ...snapshot.data(),
        };

        logger.debug('User profile updated', {
          userId,
          subscriptionStatus: profile.subscriptionStatus,
        });

        onUpdate(profile);
      },
      (error) => {
        logger.error('User profile listener error', { userId, error: error.message });
        if (onError) {
          onError(error);
        }
      }
    );

  globalListenerManager.register(`user-${userId}`, unsubscribe);

  return () => {
    globalListenerManager.unregister(`user-${userId}`);
  };
}

/**
 * Presence detection system
 * Tracks which users are currently active in sessions
 */
class PresenceManager {
  constructor() {
    this.presenceMap = new Map();
  }

  /**
   * Mark user as online in a session
   */
  async setOnline(userId, sessionId) {
    const db = admin.firestore();

    const presenceRef = db.collection('presence').doc(userId);

    await presenceRef.set(
      {
        userId,
        sessionId,
        status: 'online',
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    this.presenceMap.set(userId, { sessionId, status: 'online' });

    logger.info('User presence set to online', { userId, sessionId });
  }

  /**
   * Mark user as offline
   */
  async setOffline(userId) {
    const db = admin.firestore();

    const presenceRef = db.collection('presence').doc(userId);

    await presenceRef.set(
      {
        status: 'offline',
        lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    this.presenceMap.delete(userId);

    logger.info('User presence set to offline', { userId });
  }

  /**
   * Listen to user presence
   */
  listenToPresence(userId, onPresenceChange, onError = null) {
    const db = admin.firestore();

    const unsubscribe = db
      .collection('presence')
      .doc(userId)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.exists) {
            onPresenceChange({ status: 'offline' });
            return;
          }

          const data = snapshot.data();
          onPresenceChange(data);
        },
        (error) => {
          logger.error('Presence listener error', { userId, error: error.message });
          if (onError) {
            onError(error);
          }
        }
      );

    globalListenerManager.register(`presence-${userId}`, unsubscribe);

    return () => {
      globalListenerManager.unregister(`presence-${userId}`);
    };
  }

  /**
   * Get all online users
   */
  async getOnlineUsers() {
    const db = admin.firestore();

    const snapshot = await db
      .collection('presence')
      .where('status', '==', 'online')
      .get();

    const users = [];
    snapshot.forEach((doc) => {
      users.push({
        userId: doc.id,
        ...doc.data(),
      });
    });

    return users;
  }
}

const globalPresenceManager = new PresenceManager();

/**
 * Collaborative code editing support
 * Enables multiple viewers (e.g., mentor mode in future)
 */
class CollaborationManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Join a collaborative session
   */
  async joinSession(sessionId, userId, role = 'participant') {
    const db = admin.firestore();

    const sessionRef = db.collection('sessions').doc(sessionId);
    const doc = await sessionRef.get();

    if (!doc.exists) {
      throw new Error('Session not found');
    }

    await sessionRef.update({
      participants: admin.firestore.FieldValue.arrayUnion({
        userId,
        role,
        joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
    });

    logger.info('User joined collaborative session', { sessionId, userId, role });
  }

  /**
   * Leave a collaborative session
   */
  async leaveSession(sessionId, userId) {
    const db = admin.firestore();

    const sessionRef = db.collection('sessions').doc(sessionId);
    const doc = await sessionRef.get();

    if (!doc.exists) {
      return;
    }

    const data = doc.data();
    const participants = data.participants || [];

    // Remove user from participants
    const updatedParticipants = participants.filter((p) => p.userId !== userId);

    await sessionRef.update({
      participants: updatedParticipants,
    });

    logger.info('User left collaborative session', { sessionId, userId });
  }

  /**
   * Listen to session participants
   */
  listenToParticipants(sessionId, onUpdate, onError = null) {
    const db = admin.firestore();

    const unsubscribe = db
      .collection('sessions')
      .doc(sessionId)
      .onSnapshot(
        (snapshot) => {
          if (!snapshot.exists) {
            onUpdate([]);
            return;
          }

          const data = snapshot.data();
          const participants = data.participants || [];

          logger.debug('Participants updated', {
            sessionId,
            count: participants.length,
          });

          onUpdate(participants);
        },
        (error) => {
          logger.error('Participants listener error', {
            sessionId,
            error: error.message,
          });
          if (onError) {
            onError(error);
          }
        }
      );

    globalListenerManager.register(`participants-${sessionId}`, unsubscribe);

    return () => {
      globalListenerManager.unregister(`participants-${sessionId}`);
    };
  }
}

const globalCollaborationManager = new CollaborationManager();

/**
 * Batch listener setup for complete session monitoring
 * Sets up all relevant listeners for a session at once
 */
function setupSessionMonitoring(sessionId, callbacks) {
  const unsubscribers = [];

  // Session data listener
  if (callbacks.onSessionUpdate) {
    const unsub = listenToSession(sessionId, callbacks.onSessionUpdate, callbacks.onError);
    unsubscribers.push(unsub);
  }

  // Chat listener
  if (callbacks.onMessage) {
    const unsub = listenToChatMessages(sessionId, callbacks.onMessage, callbacks.onError);
    unsubscribers.push(unsub);
  }

  // Code listener
  if (callbacks.onCodeChange) {
    const unsub = listenToCodeChanges(sessionId, callbacks.onCodeChange, callbacks.onError);
    unsubscribers.push(unsub);
  }

  // Test results listener
  if (callbacks.onTestResult) {
    const unsub = listenToTestResults(sessionId, callbacks.onTestResult, callbacks.onError);
    unsubscribers.push(unsub);
  }

  // Participants listener
  if (callbacks.onParticipantsChange) {
    const unsub = globalCollaborationManager.listenToParticipants(
      sessionId,
      callbacks.onParticipantsChange,
      callbacks.onError
    );
    unsubscribers.push(unsub);
  }

  logger.info('Session monitoring setup complete', {
    sessionId,
    listenerCount: unsubscribers.length,
  });

  // Return cleanup function
  return () => {
    logger.info('Cleaning up session monitoring', { sessionId });
    unsubscribers.forEach((unsub) => unsub());
  };
}

module.exports = {
  // Core listeners
  listenToSession,
  listenToChatMessages,
  listenToCodeChanges,
  listenToUserSessions,
  listenToTestResults,
  listenToUserProfile,

  // Managers
  ListenerManager,
  globalListenerManager,
  PresenceManager,
  globalPresenceManager,
  CollaborationManager,
  globalCollaborationManager,

  // Batch setup
  setupSessionMonitoring,
};
