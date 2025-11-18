// Update User Statistics
// Engineer 5 - Analytics Function

const functions = require('firebase-functions');
const admin = require('firebase-admin');

/**
 * Update user statistics based on session data
 * Triggered when a session is completed
 */
module.exports = functions.firestore
  .document('sessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    // Only process if session was just completed
    if (newData.completed && !oldData.completed) {
      const userId = newData.userId;

      try {
        // Get all user sessions
        const sessionsSnapshot = await admin.firestore()
          .collection('sessions')
          .where('userId', '==', userId)
          .where('completed', '==', true)
          .get();

        const sessions = sessionsSnapshot.docs.map(doc => doc.data());

        // Calculate statistics
        const stats = calculateUserStats(sessions);

        // Update user document
        await admin.firestore().collection('users').doc(userId).update({
          stats: stats,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Updated stats for user ${userId}`);
      } catch (error) {
        console.error('Error updating user stats:', error);
      }
    }
  });

/**
 * Calculate comprehensive user statistics
 */
function calculateUserStats(sessions) {
  if (!sessions || sessions.length === 0) {
    return {
      totalSessions: 0,
      completedSessions: 0,
      problemsSolved: 0,
      averageScore: 0,
      averageSessionDuration: 0,
      successRate: 0,
      totalCodingTime: 0,
      problemsByDifficulty: {
        easy: { attempted: 0, solved: 0 },
        medium: { attempted: 0, solved: 0 },
        hard: { attempted: 0, solved: 0 }
      },
      categoriesStats: {}
    };
  }

  const completedSessions = sessions.filter(s => s.completed);
  const solvedSessions = sessions.filter(
    s => s.completed && s.testResults?.passed === s.testResults?.total
  );

  // Calculate averages
  const scores = sessions
    .filter(s => s.metrics?.overallScore !== undefined)
    .map(s => s.metrics.overallScore);

  const durations = sessions
    .filter(s => s.duration !== undefined)
    .map(s => s.duration);

  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;

  const averageSessionDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60)
    : 0;

  const totalCodingTime = Math.round(
    durations.reduce((a, b) => a + b, 0) / 60
  );

  // Group by difficulty
  const problemsByDifficulty = {
    easy: { attempted: 0, solved: 0 },
    medium: { attempted: 0, solved: 0 },
    hard: { attempted: 0, solved: 0 }
  };

  sessions.forEach(session => {
    const difficulty = session.difficulty || 'medium';
    problemsByDifficulty[difficulty].attempted++;

    if (session.completed && session.testResults?.passed === session.testResults?.total) {
      problemsByDifficulty[difficulty].solved++;
    }
  });

  // Group by category
  const categoriesStats = {};

  sessions.forEach(session => {
    const categories = session.category || ['uncategorized'];

    categories.forEach(cat => {
      if (!categoriesStats[cat]) {
        categoriesStats[cat] = {
          attempted: 0,
          solved: 0,
          totalScore: 0,
          avgScore: 0
        };
      }

      categoriesStats[cat].attempted++;

      if (session.completed && session.testResults?.passed === session.testResults?.total) {
        categoriesStats[cat].solved++;
      }

      if (session.metrics?.overallScore) {
        categoriesStats[cat].totalScore += session.metrics.overallScore;
      }
    });
  });

  // Calculate average scores per category
  Object.keys(categoriesStats).forEach(cat => {
    const stat = categoriesStats[cat];
    stat.avgScore = stat.attempted > 0
      ? Math.round((stat.totalScore / stat.attempted) * 100) / 100
      : 0;
    delete stat.totalScore;
  });

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    problemsSolved: solvedSessions.length,
    averageScore,
    averageSessionDuration,
    successRate: completedSessions.length > 0
      ? Math.round((solvedSessions.length / completedSessions.length) * 100)
      : 0,
    totalCodingTime,
    problemsByDifficulty,
    categoriesStats
  };
}
