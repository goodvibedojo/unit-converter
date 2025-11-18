/**
 * Admin Utilities
 *
 * Functions for administrative tasks
 * Usage: Only for admin users with proper authentication
 */

const admin = require('firebase-admin');
const { bulkUpdate, bulkDelete, getCount } = require('../utils/batchOperations');

/**
 * Get platform statistics
 *
 * @returns {Promise<Object>} Platform stats
 */
async function getPlatformStats() {
  const db = admin.firestore();

  // Get counts
  const [
    usersCount,
    sessionsCount,
    problemsCount,
    activeSubscriptions,
  ] = await Promise.all([
    getCount(db.collection('users')),
    getCount(db.collection('sessions')),
    getCount(db.collection('problems')),
    getCount(db.collection('subscriptions').where('status', '==', 'active')),
  ]);

  // Get recent sessions
  const recentSessionsSnapshot = await db
    .collection('sessions')
    .orderBy('startTime', 'desc')
    .limit(10)
    .get();

  // Calculate today's stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySessionsCount = await getCount(
    db.collection('sessions').where('startTime', '>=', admin.firestore.Timestamp.fromDate(today))
  );

  // Problem difficulty distribution
  const [easyCount, mediumCount, hardCount] = await Promise.all([
    getCount(db.collection('problems').where('difficulty', '==', 'easy')),
    getCount(db.collection('problems').where('difficulty', '==', 'medium')),
    getCount(db.collection('problems').where('difficulty', '==', 'hard')),
  ]);

  return {
    users: {
      total: usersCount,
    },
    sessions: {
      total: sessionsCount,
      today: todaySessionsCount,
      recent: recentSessionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })),
    },
    problems: {
      total: problemsCount,
      easy: easyCount,
      medium: mediumCount,
      hard: hardCount,
    },
    subscriptions: {
      active: activeSubscriptions,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Update all users' trial sessions (admin operation)
 *
 * @param {number} newTrialCount - New trial session count
 * @returns {Promise<number>} Number of users updated
 */
async function updateAllUsersTrialSessions(newTrialCount) {
  const db = admin.firestore();

  const count = await bulkUpdate(
    db.collection('users'),
    {
      trialSessionsTotal: newTrialCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }
  );

  console.log(`Updated ${count} users with new trial count: ${newTrialCount}`);
  return count;
}

/**
 * Delete inactive users (no sessions in last 6 months)
 *
 * @param {boolean} dryRun - If true, only count without deleting
 * @returns {Promise<Object>} Deletion report
 */
async function deleteInactiveUsers(dryRun = true) {
  const db = admin.firestore();

  // Calculate cutoff date (6 months ago)
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - 6);

  // Get all users
  const usersSnapshot = await db.collection('users').get();
  const inactiveUsers = [];

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Check if user has any recent sessions
    const recentSessionsSnapshot = await db
      .collection('sessions')
      .where('userId', '==', userId)
      .where('startTime', '>=', admin.firestore.Timestamp.fromDate(cutoffDate))
      .limit(1)
      .get();

    if (recentSessionsSnapshot.empty) {
      inactiveUsers.push({
        id: userId,
        email: userData.email,
        createdAt: userData.createdAt,
        lastActivity: userData.stats?.lastSessionDate || null,
      });
    }
  }

  if (dryRun) {
    console.log(`[DRY RUN] Would delete ${inactiveUsers.length} inactive users`);
    return {
      dryRun: true,
      count: inactiveUsers.length,
      users: inactiveUsers,
    };
  }

  // Actually delete users
  let deletedCount = 0;

  for (const user of inactiveUsers) {
    try {
      // Delete user data
      await admin.auth().deleteUser(user.id);
      // onUserDelete trigger will clean up Firestore data
      deletedCount++;
    } catch (error) {
      console.error(`Failed to delete user ${user.id}:`, error);
    }
  }

  return {
    dryRun: false,
    count: deletedCount,
    users: inactiveUsers,
  };
}

/**
 * Reset problem statistics
 *
 * @param {string} problemId - Optional: specific problem ID
 * @returns {Promise<number>} Number of problems reset
 */
async function resetProblemStats(problemId = null) {
  const db = admin.firestore();

  const resetData = {
    'stats.totalAttempts': 0,
    'stats.successRate': 0,
    'stats.averageTime': 0,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (problemId) {
    // Reset specific problem
    await db.collection('problems').doc(problemId).update(resetData);
    return 1;
  } else {
    // Reset all problems
    const count = await bulkUpdate(db.collection('problems'), resetData);
    return count;
  }
}

/**
 * Generate user report
 *
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User report
 */
async function generateUserReport(userId) {
  const db = admin.firestore();

  // Get user data
  const userDoc = await db.collection('users').doc(userId).get();

  if (!userDoc.exists) {
    throw new Error('User not found');
  }

  const userData = userDoc.data();

  // Get all sessions
  const sessionsSnapshot = await db
    .collection('sessions')
    .where('userId', '==', userId)
    .orderBy('startTime', 'desc')
    .get();

  const sessions = sessionsSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Calculate detailed stats
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const totalTime = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);

  const problemsSolved = completedSessions.filter(
    (s) => s.testResults?.passed === s.testResults?.total
  ).length;

  const averageScore = completedSessions.length > 0
    ? completedSessions.reduce((sum, s) => sum + (s.aiScore || 0), 0) / completedSessions.length
    : 0;

  // Difficulty breakdown
  const difficultyBreakdown = {
    easy: 0,
    medium: 0,
    hard: 0,
  };

  for (const session of completedSessions) {
    const problemDoc = await db.collection('problems').doc(session.problemId).get();
    if (problemDoc.exists) {
      const difficulty = problemDoc.data().difficulty;
      difficultyBreakdown[difficulty]++;
    }
  }

  return {
    user: {
      id: userId,
      email: userData.email,
      displayName: userData.displayName,
      subscriptionStatus: userData.subscriptionStatus,
      createdAt: userData.createdAt,
    },
    stats: {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      problemsSolved,
      averageScore: Math.round(averageScore),
      totalTimeSpent: totalTime,
      currentStreak: userData.stats?.currentStreak || 0,
    },
    difficultyBreakdown,
    recentSessions: sessions.slice(0, 10),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Backup collection to JSON
 *
 * @param {string} collectionName - Collection name
 * @returns {Promise<Array>} Collection data
 */
async function backupCollection(collectionName) {
  const db = admin.firestore();
  const snapshot = await db.collection(collectionName).get();

  const data = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  console.log(`Backed up ${data.length} documents from ${collectionName}`);
  return data;
}

/**
 * Restore collection from backup
 *
 * @param {string} collectionName - Collection name
 * @param {Array} data - Backup data
 * @param {boolean} overwrite - Overwrite existing documents
 * @returns {Promise<number>} Number of documents restored
 */
async function restoreCollection(collectionName, data, overwrite = false) {
  const db = admin.firestore();
  const batch = db.batch();

  let count = 0;

  for (const item of data) {
    const docRef = db.collection(collectionName).doc(item.id);

    if (!overwrite) {
      const exists = await docRef.get();
      if (exists.exists) {
        continue; // Skip existing documents
      }
    }

    batch.set(docRef, item);
    count++;

    // Commit every 500 documents
    if (count % 500 === 0) {
      await batch.commit();
    }
  }

  // Commit remaining
  await batch.commit();

  console.log(`Restored ${count} documents to ${collectionName}`);
  return count;
}

/**
 * Export admin functions
 */
module.exports = {
  getPlatformStats,
  updateAllUsersTrialSessions,
  deleteInactiveUsers,
  resetProblemStats,
  generateUserReport,
  backupCollection,
  restoreCollection,
};
